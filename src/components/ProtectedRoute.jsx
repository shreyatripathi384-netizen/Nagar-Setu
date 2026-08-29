import React from "react";
import { Navigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

/**
 * Wrap any dashboard route with this component.
 * allowedRole: "public" | "department" | "worker" | "municipal"
 *
 * Rules enforced here (never trust the frontend alone -- Supabase Row Level
 * Security policies on the "issues" and "profiles" tables are the real
 * enforcement layer; this component only controls what the UI shows).
 */
export default function ProtectedRoute({ allowedRole, children }) {
  const { user, profile, loading } = useAuth();

  if (loading) return <div className="page-center">Loading...</div>;

  if (!user) return <Navigate to="/" replace />;

  if (!profile) return <div className="page-center">Setting up your account...</div>;

  if (profile.role !== allowedRole) {
    return <Navigate to="/" replace />;
  }

  if (profile.status && profile.status !== "active") {
    return (
      <div className="page-center">
        <div className="card">
          <h1>Account pending approval</h1>
          <p className="subtitle">
            Your account status is currently{" "}
            <span
              className={`status-badge status-${profile.status === "rejected" ? "rejected" : "pending"}`}
            >
              {profile.status}
            </span>
          </p>
          <p style={{ fontSize: 14, color: "var(--text-muted)" }}>
            {profile.status === "rejected"
              ? "Your request was not approved. Contact your Municipal Corporation administrator for details."
              : "A Municipal Corporation Head needs to approve your account before you can log in. Please check back later."}
          </p>
        </div>
      </div>
    );
  }

  return children;
}
