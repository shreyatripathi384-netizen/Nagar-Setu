import React, { useEffect, useState } from "react";
import DashboardHeader from "../../components/DashboardHeader";
import { supabase } from "../../lib/supabaseClient";
import { useAuth } from "../../context/AuthContext";
import NotificationBell from "../../components/NotificationBell";
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
    const { profile } = useAuth();
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
    loadStats();
  }, []);

  async function updateStatus(id, status, name) {
  const { error } = await supabase.from("profiles").update({ status }).eq("id", id);
  if (!error) {
    loadPending();
    const auditResult = await supabase.from("audit_log").insert({
  action: `${status} — ${name}`,
});
console.log("Audit insert result:", auditResult);
    loadAuditLog();
  }
}
  const [counts, setCounts] = useState({ total: 0, pending: 0, inProgress: 0, resolved: 0 });
const [deptStats, setDeptStats] = useState([]);
const [statsLoading, setStatsLoading] = useState(true);
async function loadStats() {
  setStatsLoading(true);
  const { data: complaints, error } = await supabase
  .from("issues")
  .select("*, departments(name)");
  if (!error && complaints) {
    setAllIssues(complaints);
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
function sortByPriority(list) {
  const severityRank = { High: 0, Medium: 1, Low: 2 };
  return [...list].sort((a, b) => {
    const aUrgent = a.urgent_flag || a.re_reported ? 0 : 1;
    const bUrgent = b.urgent_flag || b.re_reported ? 0 : 1;
    if (aUrgent !== bUrgent) return aUrgent - bUrgent;
    const aSev = severityRank[a.severity] ?? 3;
    const bSev = severityRank[b.severity] ?? 3;
    return aSev - bSev;
  });
}
const [auditLog, setAuditLog] = useState([]);
async function loadAuditLog() {
  const { data, error } = await supabase
    .from("audit_log")
    .select("*")
    .order("created_at", { ascending: false })
    .limit(20);
  if (!error && data) setAuditLog(data);
}
const [allIssues, setAllIssues] = useState([]);
const [selectedStatus, setSelectedStatus] = useState(null);

 function filterIssuesByStatus(list, key) {
  if (key === "all") return list;
  if (key === "Pending") {
    return list.filter(function (i) {
      return i.status === "Reported" || i.status === "Under Review";
    });
  }
  return list.filter(function (i) {
    return i.status === key;
  });
}

function isOverdue(issue) {
  if (!issue.resolution_deadline || issue.status === "Resolved") return false;
  return new Date(issue.resolution_deadline) < new Date();
}

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
  loadAuditLog();
}, []);
  const filteredList = selectedStatus ? filterIssuesByStatus(allIssues, selectedStatus) : [];
  const overdueIssues = allIssues.filter(isOverdue);

  
  return (
    <div className="app-shell">
      <DashboardHeader roleLabel="Municipal Corporation Head" />
      <NotificationBell role="municipal" profile={profile} />
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
                  <button className="btn-approve" onClick={() => updateStatus(p.id, "active", p.full_name)}>
                    Approve
                  </button>
                  <button className="btn-reject" onClick={() => updateStatus(p.id, "rejected", p.full_name)}>
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
      <div className="stat-card" style={{ cursor: "pointer" }} onClick={function () { setSelectedStatus("all"); }}>
        <p>Total</p>
        <h3>{counts.total}</h3>
      </div>
      <div className="stat-card" style={{ cursor: "pointer" }} onClick={function () { setSelectedStatus("Pending"); }}>
        <p>Pending</p>
        <h3>{counts.pending}</h3>
      </div>
      <div className="stat-card" style={{ cursor: "pointer" }} onClick={function () { setSelectedStatus("In Progress"); }}>
        <p>In Progress</p>
        <h3>{counts.inProgress}</h3>
      </div>
      <div className="stat-card" style={{ cursor: "pointer" }} onClick={function () { setSelectedStatus("Resolved"); }}>
        <p>Resolved</p>
        <h3>{counts.resolved}</h3>
      </div>
    </div>
    {selectedStatus && (
      <div style={{ margin: "1rem 0" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <h3>{selectedStatus === "all" ? "All Complaints" : selectedStatus + " Complaints"}</h3>
          <button onClick={function () { setSelectedStatus(null); }}>Close</button>
        </div>
        {filteredList.length === 0 ? (
          <div className="placeholder-box">No complaints found.</div>
        ) : (
          filteredList.map(function (i) {
            return (
              <div key={i.id} className="placeholder-box" style={{ marginBottom: "1rem" }}>
                <strong>{i.category || "Uncategorized"}</strong> — {i.severity || "N/A"}
                <br />
                Department: {i.departments?.name || "-"}
                <br />
                Location: {i.location_text || "-"}
                <br />
                Reported on: {i.created_at ? new Date(i.created_at).toLocaleDateString() : "-"}
                <br />
                Status:{" "}
                <span
                  style={{
                    backgroundColor:
                      i.status === "Reported" ? "#f59e0b" :
                      i.status === "In Progress" ? "#3b82f6" :
                      i.status === "Resolved" ? "#22c55e" : "#999",
                    color: "white",
                    padding: "2px 10px",
                    borderRadius: "12px",
                    fontSize: "0.85rem",
                    fontWeight: "bold",
                  }}
                >
                  {i.status}
                </span>
                <br />
                {i.description}
                                              {i.urgent_flag && !i.re_reported && (
                  <span
                    style={{
                      marginLeft: "0.5rem",
                      backgroundColor: "#f97316",
                      color: "white",
                      padding: "2px 10px",
                      borderRadius: "12px",
                      fontSize: "0.8rem",
                      fontWeight: "bold",
                    }}
                  >
                    🔶 Marked Urgent
                  </span>
                )}
                {i.re_reported && (
                  <span
                    style={{
                      marginLeft: "0.5rem",
                      backgroundColor: "#dc2626",
                      color: "white",
                      padding: "2px 10px",
                      borderRadius: "12px",
                      fontSize: "0.8rem",
                      fontWeight: "bold",
                    }}
                  >
                    🔴 URGENT — Citizen Re-reported
                  </span>
                )}

                {i.photo_url && (
                  <div style={{ marginTop: "0.5rem" }}>
                    <img
                      src={i.photo_url}
                      alt="complaint"
                      style={{ maxWidth: "200px", borderRadius: "6px", display: "block" }}
                    />
                  </div>
                )}

                {i.video_url && (
                  <div style={{ marginTop: "0.5rem" }}>
                    <video
                      src={i.video_url}
                      controls
                      style={{ maxWidth: "250px", display: "block" }}
                    />
                  </div>
                )}
                {i.status === "In Progress" && i.resolution_deadline && (
                  <>
                    <br />
                    <strong>Deadline:</strong> {new Date(i.resolution_deadline).toLocaleDateString()}
                  </>
                )}
              </div>
            );
          })
        )}
      </div>
    )}

    <h2 style={{ fontFamily: "var(--font-display)", color: "red" }}>
      Overdue Complaints (Deadline Missed)
    </h2>
    {overdueIssues.length === 0 ? (
      <div className="placeholder-box">No overdue complaints. All good!</div>
    ) : (
      <table className="request-table">
        <thead>
          <tr>
            <th>Title</th>
            <th>Department</th>
            <th>Status</th>
            <th>Deadline (Missed)</th>
          </tr>
        </thead>
        <tbody>
          {overdueIssues.map(function (i) {
            return (
              <tr key={i.id} style={{ background: "#ffe5e5" }}>
                <td>{i.title}</td>
                <td>{i.departments?.name || "-"}</td>
                <td>{i.status}</td>
                <td>{i.resolution_deadline}</td>
              </tr>
            );
          })}
        </tbody>
      </table>
    )}
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
  {auditLog.map((log) => (
    <tr key={log.id}>
      <td>{log.action}</td>
      <td>{new Date(log.created_at).toLocaleString("en-IN", { timeZone: "Asia/Kolkata" })}</td>
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

