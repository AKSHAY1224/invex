import React, { useEffect, useState } from "react";
import { getProducts, getCustomers, getOrders } from "../api/api";

// ─── Skeleton helper ──────────────────────────────────────────────────────────
function skeletonStyle(width, height) {
  return {
    width,
    height,
    borderRadius: 6,
    background: "linear-gradient(90deg, #e2e8f0 25%, #f1f5f9 50%, #e2e8f0 75%)",
    backgroundSize: "200% 100%",
    animation: "skeleton-shimmer 1.4s infinite",
  };
}

export default function Dashboard() {
  const [products, setProducts] = useState([]);
  const [customers, setCustomers] = useState([]);
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchAll = async () => {
      try {
        const [p, c, o] = await Promise.all([
          getProducts(),
          getCustomers(),
          getOrders(),
        ]);
        setProducts(p);
        setCustomers(c);
        setOrders(o);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };
    fetchAll();
  }, []);

  const lowStockItems = products.filter((p) => p.quantity < 5);

  // ─── Skeleton loading state ───────────────────────────────────────────────
  if (loading) {
    return (
      <div>
        <div className="mb-4">
          <div style={skeletonStyle(200, 28)} className="mb-2" />
          <div style={skeletonStyle(140, 16)} />
        </div>
        <div className="row g-4 mb-4">
          {[1, 2, 3, 4].map((i) => (
            <div className="col-sm-6 col-xl-3" key={i}>
              <div className="card border-0 shadow-sm h-100">
                <div className="card-body d-flex align-items-center gap-3 p-4">
                  <div style={{ ...skeletonStyle(56, 56), borderRadius: 12 }} />
                  <div>
                    <div style={skeletonStyle(80, 12)} className="mb-2" />
                    <div style={skeletonStyle(50, 28)} />
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
        <div className="card border-0 shadow-sm">
          <div className="card-header bg-white border-bottom py-3 px-4">
            <div style={skeletonStyle(180, 20)} />
          </div>
          <div className="card-body p-4">
            {[1, 2, 3].map((i) => (
              <div key={i} className="d-flex gap-3 mb-3">
                <div style={skeletonStyle("40%", 16)} />
                <div style={skeletonStyle("20%", 16)} />
                <div style={skeletonStyle("15%", 16)} />
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="alert alert-danger" role="alert">
        <i className="bi bi-exclamation-triangle-fill me-2"></i>
        {error}
      </div>
    );
  }

  const statCards = [
    {
      title: "Total Products",
      value: products.length,
      icon: "bi-box-seam",
      color: "primary",
    },
    {
      title: "Total Customers",
      value: customers.length,
      icon: "bi-people-fill",
      color: "success",
    },
    {
      title: "Total Orders",
      value: orders.length,
      icon: "bi-receipt",
      color: "info",
    },
    {
      title: "Low Stock Items",
      value: lowStockItems.length,
      icon: "bi-exclamation-triangle-fill",
      color: lowStockItems.length > 0 ? "warning" : "secondary",
    },
  ];

  return (
    <div>
      <div className="mb-4">
        <h1 className="h3 fw-bold mb-1">Dashboard</h1>
        <p className="text-muted">Overview of your inventory and orders</p>
      </div>

      {/* Stat Cards */}
      <div className="row g-4 mb-4">
        {statCards.map((card) => (
          <div className="col-sm-6 col-xl-3" key={card.title}>
            <div className={`card border-0 shadow-sm h-100`}>
              <div className="card-body d-flex align-items-center gap-3 p-4">
                <div
                  className={`rounded-3 bg-${card.color} bg-opacity-10 p-3 d-flex align-items-center justify-content-center`}
                  style={{ width: 56, height: 56 }}
                >
                  <i className={`bi ${card.icon} fs-4 text-${card.color}`}></i>
                </div>
                <div>
                  <div className="text-muted small">{card.title}</div>
                  <div className={`fw-bold fs-3 text-${card.color}`}>{card.value}</div>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Low Stock Table */}
      <div className="card border-0 shadow-sm">
        <div className="card-header bg-white border-bottom py-3 px-4">
          <h5 className="mb-0 fw-semibold">
            <i className="bi bi-exclamation-triangle text-warning me-2"></i>
            Low Stock Products
          </h5>
        </div>
        <div className="card-body p-0">
          {lowStockItems.length === 0 ? (
            <div className="text-center text-muted py-5">
              <i className="bi bi-check-circle fs-1 text-success d-block mb-2"></i>
              All products have sufficient stock.
            </div>
          ) : (
            <div className="table-responsive">
              <table className="table table-hover mb-0 align-middle">
                <thead className="table-light">
                  <tr>
                    <th className="px-4">Product Name</th>
                    <th>SKU</th>
                    <th>Quantity Remaining</th>
                  </tr>
                </thead>
                <tbody>
                  {lowStockItems.map((product) => (
                    <tr key={product.id}>
                      <td className="px-4 fw-medium">{product.name}</td>
                      <td>
                        <code className="text-secondary">{product.sku}</code>
                      </td>
                      <td>
                        {product.quantity === 0 ? (
                          <span className="badge bg-danger">Out of Stock</span>
                        ) : (
                          <span className="badge bg-warning text-dark">
                            {product.quantity} left
                          </span>
                        )}
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
