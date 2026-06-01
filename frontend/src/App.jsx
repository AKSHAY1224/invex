import React from "react";
import { BrowserRouter, Routes, Route, NavLink } from "react-router-dom";
import Dashboard from "./pages/Dashboard";
import Products from "./pages/Products";
import Customers from "./pages/Customers";
import Orders from "./pages/Orders";

export default function App() {
  return (
    <BrowserRouter>
      <nav className="navbar navbar-expand-lg navbar-dark bg-dark shadow-sm sticky-top">
        <div className="container-xl">
          <NavLink className="navbar-brand fw-bold d-flex align-items-center gap-2" to="/">
            <i className="bi bi-boxes fs-5"></i>
            <span>InVex</span>
          </NavLink>

          <button
            className="navbar-toggler"
            type="button"
            data-bs-toggle="collapse"
            data-bs-target="#mainNav"
            aria-controls="mainNav"
            aria-expanded="false"
            aria-label="Toggle navigation"
          >
            <span className="navbar-toggler-icon"></span>
          </button>

          <div className="collapse navbar-collapse" id="mainNav">
            <ul className="navbar-nav ms-auto gap-1">
              <li className="nav-item">
                <NavLink
                  to="/"
                  end
                  className={({ isActive }) =>
                    `nav-link px-3 rounded ${isActive ? "active bg-white bg-opacity-10" : ""}`
                  }
                >
                  <i className="bi bi-speedometer2 me-2"></i>Dashboard
                </NavLink>
              </li>
              <li className="nav-item">
                <NavLink
                  to="/products"
                  className={({ isActive }) =>
                    `nav-link px-3 rounded ${isActive ? "active bg-white bg-opacity-10" : ""}`
                  }
                >
                  <i className="bi bi-box-seam me-2"></i>Products
                </NavLink>
              </li>
              <li className="nav-item">
                <NavLink
                  to="/customers"
                  className={({ isActive }) =>
                    `nav-link px-3 rounded ${isActive ? "active bg-white bg-opacity-10" : ""}`
                  }
                >
                  <i className="bi bi-people me-2"></i>Customers
                </NavLink>
              </li>
              <li className="nav-item">
                <NavLink
                  to="/orders"
                  className={({ isActive }) =>
                    `nav-link px-3 rounded ${isActive ? "active bg-white bg-opacity-10" : ""}`
                  }
                >
                  <i className="bi bi-receipt me-2"></i>Orders
                </NavLink>
              </li>
            </ul>
          </div>
        </div>
      </nav>

      <main className="container-xl py-4 px-3 px-md-4">
        <Routes>
          <Route path="/" element={<Dashboard />} />
          <Route path="/products" element={<Products />} />
          <Route path="/customers" element={<Customers />} />
          <Route path="/orders" element={<Orders />} />
        </Routes>
      </main>
    </BrowserRouter>
  );
}
