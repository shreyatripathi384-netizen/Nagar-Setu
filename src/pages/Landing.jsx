import React from "react";
import { Link } from "react-router-dom";

export default function Landing() {
  return (
    <div className="page-center">
      <div style={{ maxWidth: 480, width: "100%" }}>
        <div style={{ textAlign: "center", marginBottom: 8 }}>
          <div
            style={{
              display: "inline-flex",
              width: 56,
              height: 56,
              background: "var(--amber)",
              borderRadius: 12,
              alignItems: "center",
              justifyContent: "center",
              marginBottom: 12,
            }}
          >
            <span style={{ fontFamily: "var(--font-display)", fontSize: 24, color: "var(--navy)" }}>
              NS
            </span>
          </div>
          <h1 style={{ fontFamily: "var(--font-display)", color: "var(--navy)", fontSize: 26, margin: 0 }}>
            Welcome to Nagar Setu
          </h1>
          <p style={{ color: "var(--text-muted)", marginTop: 6 }}>
            Choose how you'd like to continue
          </p>
        </div>

        <div className="role-grid">
          <Link to="/citizen/login" className="role-card">
            <div className="role-title">Public / Citizen</div>
            <div className="role-desc">Report an issue or track your complaints</div>
          </Link>
          <Link to="/department/login" className="role-card">
            <div className="role-title">Department</div>
            <div className="role-desc">Manage complaints for your department</div>
          </Link>
          <Link to="/worker/login" className="role-card">
            <div className="role-title">Field Worker</div>
            <div className="role-desc">View and resolve assigned tasks</div>
          </Link>
          <Link to="/municipal/login" className="role-card">
            <div className="role-title">Municipal Corporation</div>
            <div className="role-desc">Oversee all departments and approvals</div>
          </Link>
        </div>
      </div>
    </div>
  );
}
