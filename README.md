# InVex — Inventory & Order Management System

A production-ready full-stack Inventory & Order Management System built with:

- **Backend**: Python + FastAPI
- **Frontend**: React + Bootstrap 5
- **Database**: PostgreSQL
- **Containerization**: Docker + Docker Compose

---

## Project Structure

```
invex/
├── backend/
│   ├── main.py          # FastAPI app + all endpoints
│   ├── database.py      # SQLAlchemy engine + session
│   ├── models.py        # ORM models (Product, Customer, Order, OrderItem)
│   ├── schemas.py       # Pydantic schemas
│   ├── requirements.txt
│   ├── Dockerfile
│   └── .env.example
├── frontend/
│   ├── public/
│   │   └── index.html
│   ├── src/
│   │   ├── api/api.js   # Axios client + all API functions
│   │   ├── pages/
│   │   │   ├── Dashboard.jsx
│   │   │   ├── Products.jsx
│   │   │   ├── Customers.jsx
│   │   │   └── Orders.jsx
│   │   ├── App.jsx
│   │   └── index.js
│   ├── package.json
│   ├── Dockerfile
│   └── .env.example
├── docker-compose.yml
└── README.md
```

---

## Running with Docker Compose (Recommended)

This is the easiest way to run everything in one command.

### Prerequisites

- [Docker Desktop](https://www.docker.com/products/docker-desktop/) installed and running

### Steps

```bash
# 1. Clone / navigate to the project root
cd invex

# 2. Start all services
docker compose up --build

# 3. Open the app
#    Frontend:  http://localhost:3000
#    Backend API: http://localhost:8000
#    API Docs:  http://localhost:8000/docs
```

To stop all services:

```bash
docker compose down
```

To also remove the database volume (wipes all data):

```bash
docker compose down -v
```

---

## Running Locally (Development)

### Prerequisites

- Python 3.11+
- Node.js 18+
- PostgreSQL 15+

### Backend Setup

```bash
cd backend

# Copy environment file
cp .env.example .env
# Edit .env and set your local PostgreSQL DATABASE_URL

# Create virtual environment
python -m venv venv
venv\Scripts\activate        # Windows
# source venv/bin/activate   # macOS/Linux

# Install dependencies
pip install -r requirements.txt

# Start the server
uvicorn main:app --reload --host 0.0.0.0 --port 8000
```

The backend will be available at: `http://localhost:8000`  
Interactive API docs: `http://localhost:8000/docs`

### Frontend Setup

```bash
cd frontend

# Copy environment file
cp .env.example .env
# Edit .env if your backend is running on a different URL

# Install dependencies
npm install

# Start the development server
npm start
```

The frontend will be available at: `http://localhost:3000`

---

## Environment Variables

### Backend (`backend/.env`)

| Variable       | Description                                              | Example                                               |
|----------------|----------------------------------------------------------|-------------------------------------------------------|
| `DATABASE_URL` | Full PostgreSQL connection string (SQLAlchemy format)    | `postgresql://postgres:password@localhost:5432/invex` |

### Frontend (`frontend/.env`)

| Variable              | Description                         | Default                    |
|-----------------------|-------------------------------------|----------------------------|
| `REACT_APP_API_URL`   | URL of the FastAPI backend           | `http://localhost:8000`    |

---

## API Overview

| Method | Endpoint            | Description                                |
|--------|---------------------|--------------------------------------------|
| POST   | `/products`         | Create a product                           |
| GET    | `/products`         | List all products                          |
| GET    | `/products/{id}`    | Get product by ID                          |
| PUT    | `/products/{id}`    | Update product                             |
| DELETE | `/products/{id}`    | Delete product                             |
| POST   | `/customers`        | Create a customer                          |
| GET    | `/customers`        | List all customers                         |
| GET    | `/customers/{id}`   | Get customer by ID                         |
| DELETE | `/customers/{id}`   | Delete customer                            |
| POST   | `/orders`           | Create order (validates stock, deducts)    |
| GET    | `/orders`           | List all orders with details               |
| GET    | `/orders/{id}`      | Get order by ID with full details          |
| DELETE | `/orders/{id}`      | Cancel order (restores stock)              |

Full interactive documentation available at `/docs` (Swagger UI).

---

## Features

- ✅ Full CRUD for Products, Customers, and Orders
- ✅ Automatic stock deduction on order creation
- ✅ Stock restoration on order cancellation
- ✅ Duplicate SKU and email validation
- ✅ Insufficient stock detection with clear error messages
- ✅ Live order total calculation in the UI
- ✅ Low-stock dashboard alerts
- ✅ Responsive UI with Bootstrap 5 + Bootstrap Icons
- ✅ All business logic isolated in the backend
- ✅ Environment-variable-driven configuration (no hardcoded secrets)
