import React, { useEffect, useState } from "react";
import DashboardHeader from "../../components/DashboardHeader";
import { supabase } from "../../lib/supabaseClient";

/**
 * TODO (Member 5 - feature/municipal-dashboard):
 * - Total/pending/in-progress/resolved complaint counts
 * - Department performance table
 * - Audit log view
 * - Gamification: certificate trigger at 100 citizen points
 *
 * The pending Department Admin approval queue below is already functional
 * since it is part of the core auth hierarchy.
 */
export default function MunicipalDashboard() {
  const [pending, setPending] = useState([]);
  const [loading, setLoading] = useState(true);

  async function loadPending() {
    setLoading(true);
    const { data, error } = await supabase
      .from("profiles")
      .select("id, full_name, designation, employee_id, email, status, departments(name)")
      .eq("role", "department")
      .eq("status", "pending");
    if (!error) setPending(data || []);
    setLoading(false);
  }

  useEffect(() => {
    loadPending();
  }, []);

  async function updateStatus(id, status) {
    const { error } = await supabase.from("profiles").update({ status }).eq("id", id);
    if (!error) loadPending();
  }

  return (
    <div className="app-shell">
      <DashboardHeader roleLabel="Municipal Corporation Head" />
      <div className="dashboard-shell">
        <h2 style={{ fontFamily: "var(--font-display)", color: "var(--navy)" }}>
          Department Admin Requests
        </h2>

        {loading ? (
          <p>Loading requests...</p>
        ) : pending.length === 0 ? (
          <div className="placeholder-box">No pending requests right now.</div>
        ) : (
          <table className="request-table">
            <thead>
              <tr>
                <th>Applicant</th>
                <th>Department</th>
                <th>Designation</th>
                <th>Employee ID</th>
                <th>Email</th>
                <th>Action</th>
              </tr>
            </thead>
            <tbody>
              {pending.map((p) => (
                <tr key={p.id}>
                  <td>{p.full_name}</td>
                  <td>{p.departments?.name || "-"}</td>
                  <td>{p.designation}</td>
                  <td>{p.employee_id}</td>
                  <td>{p.email}</td>
                  <td>
                    <button className="btn-approve" onClick={() => updateStatus(p.id, "active")}>
                      Approve
                    </button>
                    <button className="btn-reject" onClick={() => updateStatus(p.id, "rejected")}>
                      Reject
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}

        <h2 style={{ fontFamily: "var(--font-display)", color: "var(--navy)", marginTop: 32 }}>
          Municipal Overview
        </h2>
        <div className="placeholder-box">
          Complaint counts, department performance, and audit log go here.
          <br />
          Owned by: Member 5
        </div>
      </div>
    </div>
  );
}
