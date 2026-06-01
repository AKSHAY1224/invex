import axios from "axios";

const BASE_URL = process.env.REACT_APP_API_URL || "http://localhost:8000";

const api = axios.create({
  baseURL: BASE_URL,
  headers: {
    "Content-Type": "application/json",
  },
});

// ─── Error extractor ─────────────────────────────────────────────────────────

function extractErrorMessage(error) {
  if (error.response) {
    const data = error.response.data;
    if (data && data.detail) {
      if (typeof data.detail === "string") return data.detail;
      if (Array.isArray(data.detail)) {
        return data.detail.map((e) => e.msg || JSON.stringify(e)).join("; ");
      }
    }
    return `Server error: ${error.response.status}`;
  }
  if (error.request) {
    return "No response from server. Is the backend running?";
  }
  return error.message || "An unknown error occurred.";
}

function withErrorHandling(fn) {
  return async (...args) => {
    try {
      const response = await fn(...args);
      return response.data;
    } catch (error) {
      throw new Error(extractErrorMessage(error));
    }
  };
}

// ─── Products ─────────────────────────────────────────────────────────────────

export const getProducts = withErrorHandling(() => api.get("/products"));

export const createProduct = withErrorHandling((data) =>
  api.post("/products", data)
);

export const updateProduct = withErrorHandling((id, data) =>
  api.put(`/products/${id}`, data)
);

export const deleteProduct = withErrorHandling((id) =>
  api.delete(`/products/${id}`)
);

// ─── Customers ────────────────────────────────────────────────────────────────

export const getCustomers = withErrorHandling(() => api.get("/customers"));

export const createCustomer = withErrorHandling((data) =>
  api.post("/customers", data)
);

export const deleteCustomer = withErrorHandling((id) =>
  api.delete(`/customers/${id}`)
);

// ─── Orders ───────────────────────────────────────────────────────────────────

export const getOrders = withErrorHandling(() => api.get("/orders"));

export const getOrder = withErrorHandling((id) => api.get(`/orders/${id}`));

export const createOrder = withErrorHandling((data) =>
  api.post("/orders", data)
);

export const deleteOrder = withErrorHandling((id) =>
  api.delete(`/orders/${id}`)
);
