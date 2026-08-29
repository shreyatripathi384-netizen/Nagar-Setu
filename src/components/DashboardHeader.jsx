import React from "react";
import { useAuth } from "../context/AuthContext";

export default function DashboardHeader({ roleLabel }) {
  const { profile, logout } = useAuth();

  return (
    <div className="topbar">
      <div className="topbar-brand">
        <span className="mark">NS</span>
        Nagar Setu
        <span style={{ fontWeight: 400, fontSize: 13, marginLeft: 8, opacity: 0.8 }}>
          {roleLabel}
          {profile?.full_name ? ` · ${profile.full_name}` : ""}
        </span>
      </div>
      <button className="logout-link" onClick={logout}>
        Log out
      </button>
    </div>
  );
}
