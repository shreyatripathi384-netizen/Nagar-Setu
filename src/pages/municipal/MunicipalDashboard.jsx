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

  async function updateStatus(id, status, name) {
  const { error } = await supabase.from("profiles").update({ status }).eq("id", id);
  if (!error) {
    loadPending();
    setAuditLog((prev) => [
      { action: `${status} — ${name}`, time: new Date().toLocaleString() },
      ...prev,
    ]);
  }
}
  const [counts, setCounts] = useState({ total: 0, pending: 0, inProgress: 0, resolved: 0 });
const [deptStats, setDeptStats] = useState([]);
const [statsLoading, setStatsLoading] = useState(true);

async function loadStats() {
  setStatsLoading(true);
  const { data: complaints, error } = await supabase
    .from("complaints")
    .select("id, status, department_id, departments(name)");

  if (!error && complaints) {
    const total = complaints.length;
    const resolved = complaints.filter(c => c.status === "Resolved").length;
    const inProgress = complaints.filter(c => c.status === "In Progress").length;
    const pendingCount = complaints.filter(
      c => c.status === "Reported" || c.status === "Under Review"
    ).length;

    setCounts({ total, pending: pendingCount, inProgress, resolved });

    const deptMap = {};
    complaints.forEach(c => {
      const name = c.departments?.name || "Unknown";
      if (!deptMap[name]) deptMap[name] = { name, total: 0, resolved: 0 };
      deptMap[name].total += 1;
      if (c.status === "Resolved") deptMap[name].resolved += 1;
    });
    setDeptStats(Object.values(deptMap));
  }
  setStatsLoading(false);
}
const [auditLog, setAuditLog] = useState([]);

function getBadge(points) {
  if (points >= 100) return "Clean City Champion";
  if (points >= 50) return "Responsible Citizen";
  return "New Reporter";
}
const [topCitizens, setTopCitizens] = useState([]);

async function loadGamification() {
  const { data, error } = await supabase
    .from("profiles")
    .select("id, full_name, points")
    .eq("role", "citizen")
    .order("points", { ascending: false })
    .limit(10);

  if (!error && data) setTopCitizens(data);
}

useEffect(() => {
  loadStats();
  loadGamification();
}, []);

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

        <h2 style={{ fontFamily: "var(--font-display)" }}>Municipal Overview</h2>
{statsLoading ? (
  <p>Loading stats...</p>
) : (
  <>
    <div className="stats-grid">
      <div className="stat-card">
        <p>Total</p>
        <h3>{counts.total}</h3>
      </div>
      <div className="stat-card">
        <p>Pending</p>
        <h3>{counts.pending}</h3>
      </div>
      <div className="stat-card">
        <p>In Progress</p>
        <h3>{counts.inProgress}</h3>
      </div>
      <div className="stat-card">
        <p>Resolved</p>
        <h3>{counts.resolved}</h3>
      </div>
    </div>

    <h2 style={{ fontFamily: "var(--font-display)" }}>Department-wise</h2>
    <table className="request-table">
      <thead>
        <tr>
          <th>Department</th>
          <th>Total</th>
          <th>Resolved</th>
        </tr>
      </thead>
      <tbody>
        {deptStats.map((d) => (
          <tr key={d.name}>
            <td>{d.name}</td>
            <td>{d.total}</td>
            <td>{d.resolved}</td>
          </tr>
        ))}
      </tbody>
    </table>
    <h2 style={{ fontFamily: "var(--font-display)" }}>Top Citizens (Leaderboard)</h2>
<table className="request-table">
  <thead>
    <tr>
  <th>Rank</th>
  <th>Name</th>
  <th>Points</th>
  <th>Badge</th>
  <th>Certificate</th>
</tr>
  </thead>
  <tbody>
    {topCitizens.map((c, i) => (
      <tr key={c.id}>
        <td>{i + 1}</td>
        <td>{c.full_name}</td>
        <td>{c.points}</td>
        <td>{getBadge(c.points)}</td>
        <td>
          {c.points >= 100 && <span className="badge">Certificate of Excellence</span>}
        </td>
      </tr>
    ))}
  </tbody>
</table>
<h2 style={{ fontFamily: "var(--font-display)" }}>Audit Log</h2>
{auditLog.length === 0 ? (
  <div className="placeholder-box">No actions yet</div>
) : (
  <table className="request-table">
    <thead>
      <tr>
        <th>Action</th>
        <th>Time</th>
      </tr>
    </thead>
    <tbody>
      {auditLog.map((log, i) => (
        <tr key={i}>
          <td>{log.action}</td>
          <td>{log.time}</td>
        </tr>
      ))}
    </tbody>
  </table>
)}
  </>
)}
      </div>
    </div>
  );
}
