import React, { useEffect, useState } from "react";
import {
  getProducts,
  createProduct,
  updateProduct,
  deleteProduct,
} from "../api/api";

const emptyForm = { name: "", sku: "", price: "", quantity: "0" };

export default function Products() {
  const [products, setProducts] = useState([]);
  const [form, setForm] = useState(emptyForm);
  const [editingId, setEditingId] = useState(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);

  const fetchProducts = async () => {
    try {
      const data = await getProducts();
      setProducts(data);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProducts();
  }, []);

  const showSuccess = (msg) => {
    setSuccess(msg);
    setTimeout(() => setSuccess(null), 4000);
  };

  const showError = (msg) => {
    setError(msg);
    setTimeout(() => setError(null), 6000);
  };

  const validateForm = () => {
    if (!form.name.trim()) return "Product name is required.";
    if (!form.sku.trim()) return "SKU is required.";
    const price = parseFloat(form.price);
    if (isNaN(price) || price <= 0) return "Price must be greater than 0.";
    const qty = parseInt(form.quantity, 10);
    if (isNaN(qty) || qty < 0) return "Quantity must be 0 or more.";
    return null;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);

    const validationError = validateForm();
    if (validationError) {
      showError(validationError);
      return;
    }

    const payload = {
      name: form.name.trim(),
      sku: form.sku.trim(),
      price: parseFloat(form.price),
      quantity: parseInt(form.quantity, 10),
    };

    setSubmitting(true);
    try {
      if (editingId !== null) {
        await updateProduct(editingId, payload);
        showSuccess("Product updated successfully!");
        setEditingId(null);
      } else {
        await createProduct(payload);
        showSuccess("Product created successfully!");
      }
      setForm(emptyForm);
      await fetchProducts();
    } catch (err) {
      showError(err.message);
    } finally {
      setSubmitting(false);
    }
  };

  const handleEdit = (product) => {
    setEditingId(product.id);
    setForm({
      name: product.name,
      sku: product.sku,
      price: String(product.price),
      quantity: String(product.quantity),
    });
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const handleCancelEdit = () => {
    setEditingId(null);
    setForm(emptyForm);
    setError(null);
  };

  const handleDelete = async (id, name) => {
    if (!window.confirm(`Delete product "${name}"? This action cannot be undone.`)) return;
    try {
      await deleteProduct(id);
      showSuccess(`Product "${name}" deleted.`);
      await fetchProducts();
    } catch (err) {
      showError(err.message);
    }
  };

  return (
    <div>
      <div className="mb-4">
        <h1 className="h3 fw-bold mb-1">Products</h1>
        <p className="text-muted">Manage your product inventory</p>
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

      {/* Form */}
      <div className="card border-0 shadow-sm mb-4">
        <div className="card-header bg-white border-bottom py-3 px-4">
          <h5 className="mb-0 fw-semibold">
            <i className={`bi ${editingId ? "bi-pencil-fill text-warning" : "bi-plus-circle-fill text-primary"} me-2`}></i>
            {editingId ? "Edit Product" : "Add New Product"}
          </h5>
        </div>
        <div className="card-body p-4">
          <form onSubmit={handleSubmit}>
            <div className="row g-3">
              <div className="col-md-6">
                <label htmlFor="product-name" className="form-label fw-medium">Product Name</label>
                <input
                  id="product-name"
                  type="text"
                  className="form-control"
                  placeholder="e.g. Wireless Mouse"
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                />
              </div>
              <div className="col-md-6">
                <label htmlFor="product-sku" className="form-label fw-medium">SKU</label>
                <input
                  id="product-sku"
                  type="text"
                  className="form-control"
                  placeholder="e.g. WM-001"
                  value={form.sku}
                  onChange={(e) => setForm({ ...form, sku: e.target.value })}
                />
              </div>
              <div className="col-md-6">
                <label htmlFor="product-price" className="form-label fw-medium">Price (₹)</label>
                <input
                  id="product-price"
                  type="number"
                  className="form-control"
                  placeholder="0.00"
                  step="0.01"
                  min="0.01"
                  value={form.price}
                  onChange={(e) => setForm({ ...form, price: e.target.value })}
                />
              </div>
              <div className="col-md-6">
                <label htmlFor="product-quantity" className="form-label fw-medium">Quantity</label>
                <input
                  id="product-quantity"
                  type="number"
                  className="form-control"
                  placeholder="0"
                  min="0"
                  value={form.quantity}
                  onChange={(e) => setForm({ ...form, quantity: e.target.value })}
                />
              </div>
            </div>
            <div className="mt-3 d-flex gap-2">
              <button type="submit" className="btn btn-primary" disabled={submitting}>
                {submitting ? (
                  <><span className="spinner-border spinner-border-sm me-2"></span>Saving...</>
                ) : editingId ? (
                  <><i className="bi bi-save me-2"></i>Update Product</>
                ) : (
                  <><i className="bi bi-plus-lg me-2"></i>Add Product</>
                )}
              </button>
              {editingId && (
                <button type="button" className="btn btn-outline-secondary" onClick={handleCancelEdit}>
                  Cancel
                </button>
              )}
            </div>
          </form>
        </div>
      </div>

      {/* Products Table */}
      <div className="card border-0 shadow-sm">
        <div className="card-header bg-white border-bottom py-3 px-4 d-flex justify-content-between align-items-center">
          <h5 className="mb-0 fw-semibold">
            <i className="bi bi-box-seam me-2 text-primary"></i>
            All Products
          </h5>
          <span className="badge bg-primary rounded-pill">{products.length}</span>
        </div>
        <div className="card-body p-0">
          {loading ? (
            <div className="text-center py-5">
              <div className="spinner-border text-primary"></div>
            </div>
          ) : products.length === 0 ? (
            <div className="text-center text-muted py-5">
              <i className="bi bi-inbox fs-1 d-block mb-2"></i>
              No products yet. Add one above.
            </div>
          ) : (
            <div className="table-responsive">
              <table className="table table-hover mb-0 align-middle">
                <thead className="table-light">
                  <tr>
                    <th className="px-4">Name</th>
                    <th>SKU</th>
                    <th>Price</th>
                    <th>Quantity</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {products.map((product) => (
                    <tr key={product.id} className={editingId === product.id ? "table-warning" : ""}>
                      <td className="px-4 fw-medium">{product.name}</td>
                      <td><code className="text-secondary">{product.sku}</code></td>
                      <td>₹{product.price.toLocaleString("en-IN", { minimumFractionDigits: 2 })}</td>
                      <td>
                        {product.quantity === 0 ? (
                          <span className="badge bg-danger">Out of Stock</span>
                        ) : product.quantity < 5 ? (
                          <span className="badge bg-warning text-dark">{product.quantity}</span>
                        ) : (
                          <span className="badge bg-success">{product.quantity}</span>
                        )}
                      </td>
                      <td>
                        <button
                          className="btn btn-sm btn-outline-warning me-2"
                          onClick={() => handleEdit(product)}
                          title="Edit"
                        >
                          <i className="bi bi-pencil"></i>
                        </button>
                        <button
                          className="btn btn-sm btn-outline-danger"
                          onClick={() => handleDelete(product.id, product.name)}
                          title="Delete"
                        >
                          <i className="bi bi-trash"></i>
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
