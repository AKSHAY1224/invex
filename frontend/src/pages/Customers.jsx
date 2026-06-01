import React, { useEffect, useState } from "react";
import { getCustomers, createCustomer, deleteCustomer } from "../api/api";

const emptyForm = { full_name: "", email: "", phone: "" };

export default function Customers() {
  const [customers, setCustomers] = useState([]);
  const [form, setForm] = useState(emptyForm);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);

  const fetchCustomers = async () => {
    try {
      const data = await getCustomers();
      setCustomers(data);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCustomers();
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
    if (!form.full_name.trim()) return "Full name is required.";
    if (!form.email.trim()) return "Email is required.";
    if (!form.email.includes("@") || !form.email.includes("."))
      return "Please enter a valid email address.";
    if (!form.phone.trim()) return "Phone number is required.";
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

    setSubmitting(true);
    try {
      await createCustomer({
        full_name: form.full_name.trim(),
        email: form.email.trim(),
        phone: form.phone.trim(),
      });
      showSuccess("Customer added successfully!");
      setForm(emptyForm);
      await fetchCustomers();
    } catch (err) {
      showError(err.message);
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (id, name) => {
    if (!window.confirm(`Delete customer "${name}"? This action cannot be undone.`)) return;
    try {
      await deleteCustomer(id);
      showSuccess(`Customer "${name}" deleted.`);
      await fetchCustomers();
    } catch (err) {
      showError(err.message);
    }
  };

  return (
    <div>
      <div className="mb-4">
        <h1 className="h3 fw-bold mb-1">Customers</h1>
        <p className="text-muted">Manage your customer records</p>
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
            <i className="bi bi-person-plus-fill text-success me-2"></i>
            Add New Customer
          </h5>
        </div>
        <div className="card-body p-4">
          <form onSubmit={handleSubmit}>
            <div className="row g-3">
              <div className="col-md-4">
                <label htmlFor="customer-name" className="form-label fw-medium">Full Name</label>
                <input
                  id="customer-name"
                  type="text"
                  className="form-control"
                  placeholder="e.g. Rajesh Kumar"
                  value={form.full_name}
                  onChange={(e) => setForm({ ...form, full_name: e.target.value })}
                />
              </div>
              <div className="col-md-4">
                <label htmlFor="customer-email" className="form-label fw-medium">Email Address</label>
                <input
                  id="customer-email"
                  type="email"
                  className="form-control"
                  placeholder="e.g. rajesh@example.com"
                  value={form.email}
                  onChange={(e) => setForm({ ...form, email: e.target.value })}
                />
              </div>
              <div className="col-md-4">
                <label htmlFor="customer-phone" className="form-label fw-medium">Phone</label>
                <input
                  id="customer-phone"
                  type="tel"
                  className="form-control"
                  placeholder="e.g. +91 9876543210"
                  value={form.phone}
                  onChange={(e) => setForm({ ...form, phone: e.target.value })}
                />
              </div>
            </div>
            <div className="mt-3">
              <button type="submit" className="btn btn-success" disabled={submitting}>
                {submitting ? (
                  <><span className="spinner-border spinner-border-sm me-2"></span>Saving...</>
                ) : (
                  <><i className="bi bi-plus-lg me-2"></i>Add Customer</>
                )}
              </button>
            </div>
          </form>
        </div>
      </div>

      {/* Customers Table */}
      <div className="card border-0 shadow-sm">
        <div className="card-header bg-white border-bottom py-3 px-4 d-flex justify-content-between align-items-center">
          <h5 className="mb-0 fw-semibold">
            <i className="bi bi-people-fill me-2 text-success"></i>
            All Customers
          </h5>
          <span className="badge bg-success rounded-pill">{customers.length}</span>
        </div>
        <div className="card-body p-0">
          {loading ? (
            <div className="text-center py-5">
              <div className="spinner-border text-success"></div>
            </div>
          ) : customers.length === 0 ? (
            <div className="text-center text-muted py-5">
              <i className="bi bi-person-x fs-1 d-block mb-2"></i>
              No customers yet. Add one above.
            </div>
          ) : (
            <div className="table-responsive">
              <table className="table table-hover mb-0 align-middle">
                <thead className="table-light">
                  <tr>
                    <th className="px-4">Full Name</th>
                    <th>Email</th>
                    <th>Phone</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {customers.map((customer) => (
                    <tr key={customer.id}>
                      <td className="px-4 fw-medium">{customer.full_name}</td>
                      <td>
                        <a href={`mailto:${customer.email}`} className="text-decoration-none">
                          {customer.email}
                        </a>
                      </td>
                      <td>{customer.phone}</td>
                      <td>
                        <button
                          className="btn btn-sm btn-outline-danger"
                          onClick={() => handleDelete(customer.id, customer.full_name)}
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
