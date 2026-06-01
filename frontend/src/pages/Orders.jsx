import React, { useEffect, useState } from "react";
import {
  getOrders,
  getOrder,
  getCustomers,
  getProducts,
  createOrder,
  deleteOrder,
} from "../api/api";

const emptyOrderForm = {
  customer_id: "",
  items: [{ product_id: "", quantity: "1" }],
};

export default function Orders() {
  const [orders, setOrders] = useState([]);
  const [customers, setCustomers] = useState([]);
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);

  // View state: "list" | "form" | "detail"
  const [view, setView] = useState("list");
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [orderForm, setOrderForm] = useState(emptyOrderForm);
  const [detailLoading, setDetailLoading] = useState(false);

  const fetchData = async () => {
    try {
      const [o, c, p] = await Promise.all([
        getOrders(),
        getCustomers(),
        getProducts(),
      ]);
      setOrders(o);
      setCustomers(c);
      setProducts(p);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const showSuccess = (msg) => {
    setSuccess(msg);
    setTimeout(() => setSuccess(null), 4000);
  };

  const showError = (msg) => {
    setError(msg);
    setTimeout(() => setError(null), 8000);
  };

  // ─── Live estimated total ──────────────────────────────────────────────────
  const estimatedTotal = orderForm.items.reduce((sum, item) => {
    const product = products.find((p) => String(p.id) === String(item.product_id));
    const qty = parseInt(item.quantity, 10);
    if (product && !isNaN(qty) && qty > 0) {
      return sum + product.price * qty;
    }
    return sum;
  }, 0);

  // ─── Item helpers ──────────────────────────────────────────────────────────
  const addItem = () => {
    setOrderForm((prev) => ({
      ...prev,
      items: [...prev.items, { product_id: "", quantity: "1" }],
    }));
  };

  const removeItem = (index) => {
    setOrderForm((prev) => ({
      ...prev,
      items: prev.items.filter((_, i) => i !== index),
    }));
  };

  const updateItem = (index, field, value) => {
    setOrderForm((prev) => {
      const items = [...prev.items];
      items[index] = { ...items[index], [field]: value };
      return { ...prev, items };
    });
  };

  // ─── Order form validation ─────────────────────────────────────────────────
  const validateOrderForm = () => {
    if (!orderForm.customer_id) return "Please select a customer.";
    if (orderForm.items.length === 0) return "Please add at least one item.";
    for (let i = 0; i < orderForm.items.length; i++) {
      const item = orderForm.items[i];
      if (!item.product_id) return `Please select a product for item ${i + 1}.`;
      const qty = parseInt(item.quantity, 10);
      if (isNaN(qty) || qty < 1) return `Quantity for item ${i + 1} must be at least 1.`;
    }
    return null;
  };

  // ─── Submit order ──────────────────────────────────────────────────────────
  const handleCreateOrder = async (e) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);

    const validationError = validateOrderForm();
    if (validationError) {
      showError(validationError);
      return;
    }

    const payload = {
      customer_id: parseInt(orderForm.customer_id, 10),
      items: orderForm.items.map((item) => ({
        product_id: parseInt(item.product_id, 10),
        quantity: parseInt(item.quantity, 10),
      })),
    };

    setSubmitting(true);
    try {
      await createOrder(payload);
      showSuccess("Order placed successfully!");
      setOrderForm(emptyOrderForm);
      setView("list");
      await fetchData();
    } catch (err) {
      showError(err.message);
    } finally {
      setSubmitting(false);
    }
  };

  // ─── View detail ───────────────────────────────────────────────────────────
  const handleViewDetail = async (orderId) => {
    setDetailLoading(true);
    setView("detail");
    try {
      const order = await getOrder(orderId);
      setSelectedOrder(order);
    } catch (err) {
      showError(err.message);
      setView("list");
    } finally {
      setDetailLoading(false);
    }
  };

  // ─── Delete order ──────────────────────────────────────────────────────────
  const handleDelete = async (id) => {
    if (!window.confirm(`Cancel order #${id}? Stock will be restored.`)) return;
    try {
      await deleteOrder(id);
      showSuccess(`Order #${id} cancelled and stock restored.`);
      if (selectedOrder?.id === id) {
        setView("list");
        setSelectedOrder(null);
      }
      await fetchData();
    } catch (err) {
      showError(err.message);
    }
  };

  // ─── Render: Detail View ───────────────────────────────────────────────────
  if (view === "detail") {
    return (
      <div>
        <button
          className="btn btn-outline-secondary mb-4"
          onClick={() => { setView("list"); setSelectedOrder(null); }}
        >
          <i className="bi bi-arrow-left me-2"></i>Back to Orders
        </button>

        {detailLoading || !selectedOrder ? (
          <div className="text-center py-5">
            <div className="spinner-border text-primary"></div>
          </div>
        ) : (
          <div className="card border-0 shadow-sm">
            <div className="card-header bg-white border-bottom py-3 px-4">
              <h5 className="mb-0 fw-semibold">
                <i className="bi bi-receipt me-2 text-info"></i>
                Order #{selectedOrder.id}
              </h5>
            </div>
            <div className="card-body p-4">
              <div className="row mb-4">
                <div className="col-md-4">
                  <div className="text-muted small">Customer</div>
                  <div className="fw-semibold">{selectedOrder.customer_name}</div>
                </div>
                <div className="col-md-4">
                  <div className="text-muted small">Order Date</div>
                  <div className="fw-semibold">
                    {new Date(selectedOrder.created_at).toLocaleString("en-IN")}
                  </div>
                </div>
                <div className="col-md-4">
                  <div className="text-muted small">Total Amount</div>
                  <div className="fw-bold fs-5 text-success">
                    ₹{selectedOrder.total_amount.toLocaleString("en-IN", { minimumFractionDigits: 2 })}
                  </div>
                </div>
              </div>

              <h6 className="fw-semibold mb-3">Order Items</h6>
              <div className="table-responsive">
                <table className="table table-bordered align-middle">
                  <thead className="table-light">
                    <tr>
                      <th>Product Name</th>
                      <th>Unit Price</th>
                      <th>Quantity</th>
                      <th>Subtotal</th>
                    </tr>
                  </thead>
                  <tbody>
                    {selectedOrder.items.map((item) => (
                      <tr key={item.id}>
                        <td className="fw-medium">{item.product_name}</td>
                        <td>₹{item.unit_price.toLocaleString("en-IN", { minimumFractionDigits: 2 })}</td>
                        <td>{item.quantity}</td>
                        <td className="fw-semibold">
                          ₹{item.subtotal.toLocaleString("en-IN", { minimumFractionDigits: 2 })}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                  <tfoot>
                    <tr className="table-light">
                      <td colSpan="3" className="fw-bold text-end">Total</td>
                      <td className="fw-bold text-success">
                        ₹{selectedOrder.total_amount.toLocaleString("en-IN", { minimumFractionDigits: 2 })}
                      </td>
                    </tr>
                  </tfoot>
                </table>
              </div>
            </div>
          </div>
        )}
      </div>
    );
  }

  // ─── Render: Order Form ────────────────────────────────────────────────────
  if (view === "form") {
    return (
      <div>
        <div className="d-flex align-items-center mb-4">
          <button
            className="btn btn-outline-secondary me-3"
            onClick={() => { setView("list"); setOrderForm(emptyOrderForm); setError(null); }}
          >
            <i className="bi bi-arrow-left me-2"></i>Cancel
          </button>
          <div>
            <h1 className="h3 fw-bold mb-0">Create New Order</h1>
          </div>
        </div>

        {error && (
          <div className="alert alert-danger alert-dismissible" role="alert">
            <i className="bi bi-exclamation-triangle-fill me-2"></i>
            {error}
            <button type="button" className="btn-close" onClick={() => setError(null)}></button>
          </div>
        )}

        <form onSubmit={handleCreateOrder}>
          {/* Customer Selection */}
          <div className="card border-0 shadow-sm mb-4">
            <div className="card-header bg-white border-bottom py-3 px-4">
              <h6 className="mb-0 fw-semibold">
                <i className="bi bi-person-check me-2 text-success"></i>Customer
              </h6>
            </div>
            <div className="card-body p-4">
              <label htmlFor="order-customer" className="form-label fw-medium">Select Customer</label>
              <select
                id="order-customer"
                className="form-select"
                value={orderForm.customer_id}
                onChange={(e) => setOrderForm({ ...orderForm, customer_id: e.target.value })}
              >
                <option value="">— Select a customer —</option>
                {customers.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.full_name} ({c.email})
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Order Items */}
          <div className="card border-0 shadow-sm mb-4">
            <div className="card-header bg-white border-bottom py-3 px-4 d-flex justify-content-between align-items-center">
              <h6 className="mb-0 fw-semibold">
                <i className="bi bi-cart me-2 text-primary"></i>Order Items
              </h6>
              <button type="button" className="btn btn-sm btn-outline-primary" onClick={addItem}>
                <i className="bi bi-plus me-1"></i>Add Item
              </button>
            </div>
            <div className="card-body p-4">
              {orderForm.items.map((item, index) => {
                const selectedProduct = products.find((p) => String(p.id) === String(item.product_id));
                return (
                  <div key={index} className="row g-3 align-items-end mb-3 border-bottom pb-3">
                    <div className="col-md-6">
                      <label className="form-label fw-medium">Product</label>
                      <select
                        className="form-select"
                        value={item.product_id}
                        onChange={(e) => updateItem(index, "product_id", e.target.value)}
                        id={`order-item-product-${index}`}
                      >
                        <option value="">— Select a product —</option>
                        {products.map((p) => (
                          <option key={p.id} value={p.id}>
                            {p.name} — ₹{p.price} (Stock: {p.quantity})
                          </option>
                        ))}
                      </select>
                    </div>
                    <div className="col-md-3">
                      <label className="form-label fw-medium">Quantity</label>
                      <input
                        type="number"
                        className="form-control"
                        min="1"
                        value={item.quantity}
                        onChange={(e) => updateItem(index, "quantity", e.target.value)}
                        id={`order-item-quantity-${index}`}
                      />
                    </div>
                    <div className="col-md-2">
                      {selectedProduct && (
                        <div className="text-muted small">
                          <div className="fw-medium text-dark">
                            ₹{(selectedProduct.price * (parseInt(item.quantity, 10) || 0)).toLocaleString("en-IN", { minimumFractionDigits: 2 })}
                          </div>
                          Subtotal
                        </div>
                      )}
                    </div>
                    <div className="col-md-1 text-end">
                      {orderForm.items.length > 1 && (
                        <button
                          type="button"
                          className="btn btn-sm btn-outline-danger"
                          onClick={() => removeItem(index)}
                          title="Remove item"
                        >
                          <i className="bi bi-x"></i>
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}

              {/* Estimated Total */}
              <div className="d-flex justify-content-end mt-2">
                <div className="text-end">
                  <div className="text-muted small">Estimated Total</div>
                  <div className="fw-bold fs-4 text-success">
                    ₹{estimatedTotal.toLocaleString("en-IN", { minimumFractionDigits: 2 })}
                  </div>
                </div>
              </div>
            </div>
          </div>

          <button type="submit" className="btn btn-primary btn-lg" disabled={submitting}>
            {submitting ? (
              <><span className="spinner-border spinner-border-sm me-2"></span>Placing Order...</>
            ) : (
              <><i className="bi bi-bag-check me-2"></i>Place Order</>
            )}
          </button>
        </form>
      </div>
    );
  }

  // ─── Render: List View ─────────────────────────────────────────────────────
  return (
    <div>
      <div className="d-flex justify-content-between align-items-start mb-4">
        <div>
          <h1 className="h3 fw-bold mb-1">Orders</h1>
          <p className="text-muted">View and manage all orders</p>
        </div>
        <button
          id="create-order-btn"
          className="btn btn-primary"
          onClick={() => setView("form")}
        >
          <i className="bi bi-plus-lg me-2"></i>Create New Order
        </button>
      </div>

      {/* Alerts */}
      {error && (
        <div className="alert alert-danger alert-dismissible" role="alert">
          <i className="bi bi-exclamation-triangle-fill me-2"></i>
          {error}
          <button type="button" className="btn-close" onClick={() => setError(null)}></button>
        </div>
      )}
      {success && (
        <div className="alert alert-success alert-dismissible" role="alert">
          <i className="bi bi-check-circle-fill me-2"></i>
          {success}
          <button type="button" className="btn-close" onClick={() => setSuccess(null)}></button>
        </div>
      )}

      {/* Orders Table */}
      <div className="card border-0 shadow-sm">
        <div className="card-header bg-white border-bottom py-3 px-4 d-flex justify-content-between align-items-center">
          <h5 className="mb-0 fw-semibold">
            <i className="bi bi-receipt me-2 text-info"></i>All Orders
          </h5>
          <span className="badge bg-info rounded-pill text-white">{orders.length}</span>
        </div>
        <div className="card-body p-0">
          {loading ? (
            <div className="text-center py-5">
              <div className="spinner-border text-info"></div>
            </div>
          ) : orders.length === 0 ? (
            <div className="text-center text-muted py-5">
              <i className="bi bi-cart-x fs-1 d-block mb-2"></i>
              No orders yet. Create one above.
            </div>
          ) : (
            <div className="table-responsive">
              <table className="table table-hover mb-0 align-middle">
                <thead className="table-light">
                  <tr>
                    <th className="px-4">Order ID</th>
                    <th>Customer</th>
                    <th>Total Amount</th>
                    <th>Date</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {orders.map((order) => (
                    <tr key={order.id}>
                      <td className="px-4">
                        <span className="badge bg-light text-dark border fw-semibold">
                          #{order.id}
                        </span>
                      </td>
                      <td className="fw-medium">{order.customer_name}</td>
                      <td className="fw-semibold text-success">
                        ₹{order.total_amount.toLocaleString("en-IN", { minimumFractionDigits: 2 })}
                      </td>
                      <td className="text-muted small">
                        {new Date(order.created_at).toLocaleString("en-IN")}
                      </td>
                      <td>
                        <button
                          className="btn btn-sm btn-outline-info me-2"
                          onClick={() => handleViewDetail(order.id)}
                          title="View Details"
                        >
                          <i className="bi bi-eye"></i>
                        </button>
                        <button
                          className="btn btn-sm btn-outline-danger"
                          onClick={() => handleDelete(order.id)}
                          title="Cancel Order"
                        >
                          <i className="bi bi-x-circle"></i>
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
