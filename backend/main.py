from fastapi import FastAPI, Depends, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy.orm import Session
from typing import List

import models
import schemas
from database import Base, engine, get_db

# ─── App Initialization ───────────────────────────────────────────────────────

app = FastAPI(
    title="Inventory & Order Management API",
    description="A production-ready API for managing products, customers, and orders.",
    version="1.0.0",
)

# ─── CORS Middleware ──────────────────────────────────────────────────────────

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ─── DB Table Creation on Startup ────────────────────────────────────────────

@app.on_event("startup")
def create_tables():
    Base.metadata.create_all(bind=engine)


# ─── Helper: Build OrderResponse ─────────────────────────────────────────────

def build_order_response(order: models.Order) -> schemas.OrderResponse:
    items = []
    for item in order.items:
        items.append(
            schemas.OrderItemResponse(
                id=item.id,
                product_id=item.product_id,
                product_name=item.product.name if item.product else "Unknown",
                quantity=item.quantity,
                unit_price=item.unit_price,
                subtotal=round(item.unit_price * item.quantity, 2),
            )
        )
    return schemas.OrderResponse(
        id=order.id,
        customer_id=order.customer_id,
        customer_name=order.customer.full_name if order.customer else "Unknown",
        total_amount=order.total_amount,
        created_at=order.created_at,
        items=items,
    )


# ═════════════════════════════════════════════════════════════════════════════
# PRODUCTS
# ═════════════════════════════════════════════════════════════════════════════

@app.post("/products", response_model=schemas.ProductResponse, status_code=201, tags=["Products"])
def create_product(product: schemas.ProductCreate, db: Session = Depends(get_db)):
    existing = db.query(models.Product).filter(models.Product.sku == product.sku).first()
    if existing:
        raise HTTPException(status_code=400, detail=f"Product with SKU '{product.sku}' already exists.")

    db_product = models.Product(
        name=product.name,
        sku=product.sku,
        price=product.price,
        quantity=product.quantity,
    )
    db.add(db_product)
    db.commit()
    db.refresh(db_product)
    return db_product


@app.get("/products", response_model=List[schemas.ProductResponse], tags=["Products"])
def get_products(db: Session = Depends(get_db)):
    return db.query(models.Product).all()


@app.get("/products/{product_id}", response_model=schemas.ProductResponse, tags=["Products"])
def get_product(product_id: int, db: Session = Depends(get_db)):
    product = db.query(models.Product).filter(models.Product.id == product_id).first()
    if not product:
        raise HTTPException(status_code=404, detail="Product not found.")
    return product


@app.put("/products/{product_id}", response_model=schemas.ProductResponse, tags=["Products"])
def update_product(product_id: int, update: schemas.ProductUpdate, db: Session = Depends(get_db)):
    product = db.query(models.Product).filter(models.Product.id == product_id).first()
    if not product:
        raise HTTPException(status_code=404, detail="Product not found.")

    if update.sku and update.sku != product.sku:
        existing = db.query(models.Product).filter(models.Product.sku == update.sku).first()
        if existing:
            raise HTTPException(status_code=400, detail=f"Product with SKU '{update.sku}' already exists.")

    update_data = update.model_dump(exclude_unset=True)
    for field, value in update_data.items():
        setattr(product, field, value)

    db.commit()
    db.refresh(product)
    return product


@app.delete("/products/{product_id}", status_code=204, tags=["Products"])
def delete_product(product_id: int, db: Session = Depends(get_db)):
    product = db.query(models.Product).filter(models.Product.id == product_id).first()
    if not product:
        raise HTTPException(status_code=404, detail="Product not found.")
    db.delete(product)
    db.commit()


# ═════════════════════════════════════════════════════════════════════════════
# CUSTOMERS
# ═════════════════════════════════════════════════════════════════════════════

@app.post("/customers", response_model=schemas.CustomerResponse, status_code=201, tags=["Customers"])
def create_customer(customer: schemas.CustomerCreate, db: Session = Depends(get_db)):
    existing = db.query(models.Customer).filter(models.Customer.email == customer.email).first()
    if existing:
        raise HTTPException(status_code=400, detail=f"Customer with email '{customer.email}' already exists.")

    db_customer = models.Customer(
        full_name=customer.full_name,
        email=customer.email,
        phone=customer.phone,
    )
    db.add(db_customer)
    db.commit()
    db.refresh(db_customer)
    return db_customer


@app.get("/customers", response_model=List[schemas.CustomerResponse], tags=["Customers"])
def get_customers(db: Session = Depends(get_db)):
    return db.query(models.Customer).all()


@app.get("/customers/{customer_id}", response_model=schemas.CustomerResponse, tags=["Customers"])
def get_customer(customer_id: int, db: Session = Depends(get_db)):
    customer = db.query(models.Customer).filter(models.Customer.id == customer_id).first()
    if not customer:
        raise HTTPException(status_code=404, detail="Customer not found.")
    return customer


@app.delete("/customers/{customer_id}", status_code=204, tags=["Customers"])
def delete_customer(customer_id: int, db: Session = Depends(get_db)):
    customer = db.query(models.Customer).filter(models.Customer.id == customer_id).first()
    if not customer:
        raise HTTPException(status_code=404, detail="Customer not found.")
    db.delete(customer)
    db.commit()


# ═════════════════════════════════════════════════════════════════════════════
# ORDERS
# ═════════════════════════════════════════════════════════════════════════════

@app.post("/orders", response_model=schemas.OrderResponse, status_code=201, tags=["Orders"])
def create_order(order_data: schemas.OrderCreate, db: Session = Depends(get_db)):
    # 1. Validate customer exists
    customer = db.query(models.Customer).filter(models.Customer.id == order_data.customer_id).first()
    if not customer:
        raise HTTPException(status_code=404, detail="Customer not found.")

    resolved_items = []
    for item in order_data.items:
        # 2. Validate each product exists
        product = db.query(models.Product).filter(models.Product.id == item.product_id).first()
        if not product:
            raise HTTPException(status_code=404, detail=f"Product with id {item.product_id} not found.")

        # 3. Check stock
        if product.quantity < item.quantity:
            raise HTTPException(
                status_code=400,
                detail=f"Insufficient stock for product: {product.name}",
            )
        resolved_items.append((product, item.quantity))

    # 4 & 5. Deduct stock + capture unit price + calculate total
    total_amount = 0.0
    order_items = []
    for product, qty in resolved_items:
        product.quantity -= qty
        unit_price = product.price
        total_amount += unit_price * qty
        order_items.append(
            models.OrderItem(
                product_id=product.id,
                quantity=qty,
                unit_price=unit_price,
            )
        )

    # 6 & 7. Save order and all order items
    db_order = models.Order(
        customer_id=customer.id,
        total_amount=round(total_amount, 2),
        items=order_items,
    )
    db.add(db_order)
    db.commit()
    db.refresh(db_order)

    # Reload relationships
    db.refresh(db_order)
    for oi in db_order.items:
        db.refresh(oi)

    return build_order_response(db_order)


@app.get("/orders", response_model=List[schemas.OrderResponse], tags=["Orders"])
def get_orders(db: Session = Depends(get_db)):
    orders = db.query(models.Order).all()
    return [build_order_response(o) for o in orders]


@app.get("/orders/{order_id}", response_model=schemas.OrderResponse, tags=["Orders"])
def get_order(order_id: int, db: Session = Depends(get_db)):
    order = db.query(models.Order).filter(models.Order.id == order_id).first()
    if not order:
        raise HTTPException(status_code=404, detail="Order not found.")
    return build_order_response(order)


@app.delete("/orders/{order_id}", status_code=204, tags=["Orders"])
def delete_order(order_id: int, db: Session = Depends(get_db)):
    order = db.query(models.Order).filter(models.Order.id == order_id).first()
    if not order:
        raise HTTPException(status_code=404, detail="Order not found.")

    # Restore stock quantities before deleting
    for item in order.items:
        product = db.query(models.Product).filter(models.Product.id == item.product_id).first()
        if product:
            product.quantity += item.quantity

    db.delete(order)
    db.commit()
