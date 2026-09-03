import React, { useEffect, useState } from "react";
import DashboardHeader from "../../components/DashboardHeader";
import { useAuth } from "../../context/AuthContext";
import { supabase } from "../../lib/supabaseClient";
import NotificationBell from "../../components/NotificationBell";
export default function DepartmentDashboard() {
  const { profile } = useAuth();
  const [issues, setIssues] = useState([]);
  const [workers, setWorkers] = useState([]);
  const [pendingWorkers, setPendingWorkers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState("all");
const [statusFilter, setStatusFilter] = useState("all");
  useEffect(function () {
    fetchIssues();
    fetchWorkers();
    fetchPendingWorkers();
  }, [profile]);

  async function fetchIssues() {
    if (!profile || !profile.department_id) return;
    const result = await supabase
      .from("issues")
      .select("*")
      .eq("department_id", profile.department_id)
      .order("created_at", { ascending: false });
    if (result.error) console.error("Error fetching issues:", result.error);
    else setIssues(result.data);
    setLoading(false);
  }
  async function handleApproveWorker(workerId) {
    const { error } = await supabase
      .from("profiles")
      .update({ status: "active" })
      .eq("id", workerId);
    if (error) {
      alert("Error approving worker: " + error.message);
    } else {
      fetchWorkers();
    }
  }
  async function fetchWorkers() {
    if (!profile || !profile.department_id) return;
    const result = await supabase
      .from("profiles")
      .select("id, full_name, status")
      .eq("department_id", profile.department_id)
      .eq("role", "worker")
      .eq("status", "active");
    if (result.error) console.error("Error fetching workers:", result.error);
    else setWorkers(result.data);
  }

  async function fetchPendingWorkers() {
    if (!profile || !profile.department_id) return;
    const result = await supabase
      .from("profiles")
      .select("id, full_name, phone, aadhaar_number, email")
      .eq("department_id", profile.department_id)
      .eq("role", "worker")
      .eq("status", "pending");
    if (result.error) console.error("Error fetching pending workers:", result.error);
    else setPendingWorkers(result.data);
  }

    async function approveWorker(workerId) {
    const generatedId = "WRK-" + Date.now().toString().slice(-6);
    const result = await supabase
      .from("profiles")
      .update({ status: "active", worker_id: generatedId })
      .eq("id", workerId);
    if (result.error) alert("Error approving worker: " + result.error.message);
    else {
      alert("Worker approved! Worker ID: " + generatedId);
      fetchWorkers();
      fetchPendingWorkers();
    }
  }

  async function rejectWorker(workerId) {
    const result = await supabase
      .from("profiles")
      .update({ status: "rejected" })
      .eq("id", workerId);
    if (result.error) alert("Error rejecting worker: " + result.error.message);
    else fetchPendingWorkers();
  }

  async function assignWorker(issueId, workerId, deadline) {
    const result = await supabase
      .from("issues")
      .update({
        assigned_worker_id: workerId,
        resolution_deadline: deadline || null,
        status: "In Progress",
      })
      .eq("id", issueId);
    if (result.error) alert("Error assigning worker: " + result.error.message);
    else fetchIssues();
  }

  async function confirmResolved(issueId) {
    const result = await supabase
      .from("issues")
      .update({ status: "Resolved", resolved_at: new Date().toISOString() })
      .eq("id", issueId);
    if (result.error) alert("Error confirming resolution: " + result.error.message);
    else {
      alert("Marked as Resolved — citizen will now see this update.");
      fetchIssues();
    }
  }

  async function rejectResolution(issueId) {
    const result = await supabase
      .from("issues")
      .update({ resolved_photo_url: null, status: "In Progress" })
      .eq("id", issueId);
    if (result.error) alert("Error rejecting: " + result.error.message);
    else {
      alert("Rejected — worker will need to submit proof again.");
      fetchIssues();
    }
  }

  function getStatusColor(status) {
    if (status === "Reported") return "#f59e0b";
    if (status === "In Progress") return "#3b82f6";
    if (status === "Resolved") return "#22c55e";
    return "#999";
  }
  function isOverdue(issue) {
    if (!issue.resolution_deadline || issue.status === "Resolved") return false;
    return new Date(issue.resolution_deadline) < new Date();
  }
  function filterByDate(list) {
  if (filter === "all") return list;
  const now = new Date();
  return list.filter(function (issue) {
    const createdDate = new Date(issue.created_at);
    const diffMs = now.getTime() - createdDate.getTime();
    const diffDays = diffMs / (1000 * 60 * 60 * 24);
    if (filter === "day") return diffDays <= 1;
    if (filter === "week") return diffDays <= 7;
    if (filter === "month") return diffDays <= 30;
    return true;
  });
}
  function filterByStatus(list) {
  if (statusFilter === "all") return list;
  return list.filter(function (issue) {
    return issue.status === statusFilter;
  });
}

  const filteredIssues = filterByStatus(filterByDate(issues));

  return (
    <div className="app-shell">
      <DashboardHeader  roleLabel={"Department: " + (profile && profile.departments ? profile.departments.name : "")} />
      <NotificationBell role="department" profile={profile} />
            {workers.filter((w) => w.status === "pending").length > 0 && (
        <div style={{ padding: "1rem", background: "#fff3cd", marginBottom: "1rem" }}>
          <h4>Pending Worker Approvals</h4>
          {workers
            .filter((w) => w.status === "pending")
            .map(function (w) {
              return (
                <div key={w.id} style={{ marginBottom: "0.5rem" }}>
                  {w.full_name}
                  <button
                    style={{ marginLeft: "1rem" }}
                    onClick={() => handleApproveWorker(w.id)}
                  >
                    Approve
                  </button>
                </div>
              );
            })}
        </div>
      )}
      <div className="dashboard-shell">
        <h2 style={{ fontFamily: "var(--font-display)", color: "var(--navy)" }}>
          Department Complaints
        </h2>

        {pendingWorkers.length > 0 && (
          <div
            style={{
              background: "#fff8e6",
              border: "1px solid #f0c674",
              borderRadius: "8px",
              padding: "1rem",
              marginBottom: "1.5rem",
            }}
          >
            <h3 style={{ margin: "0 0 0.75rem", fontSize: "1rem" }}>
              Pending Worker Requests ({pendingWorkers.length})
            </h3>
            {pendingWorkers.map(function (w) {
              return (
                <div
                  key={w.id}
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                    padding: "0.5rem 0",
                    borderTop: "1px solid #f0c674",
                  }}
                >
                  <div>
                    <strong>{w.full_name}</strong>
                    <br />
                    <span style={{ fontSize: "0.85rem", color: "#666" }}>
                      {w.email} — {w.phone}
                    </span>
                  </div>
                  <div>
                    <button onClick={function () { approveWorker(w.id); }}>
                      Approve
                    </button>
                    <button
                      style={{ marginLeft: "0.5rem" }}
                      onClick={function () { rejectWorker(w.id); }}
                    >
                      Reject
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        <div style={{ marginBottom: "1rem" }}>
          <label>Show: </label>
          <select value={filter} onChange={function (e) { setFilter(e.target.value); }}>
            <option value="all">All Time</option>
            <option value="day">Last Day</option>
            <option value="week">Last Week</option>
            <option value="month">Last Month</option>
          </select>

          <label style={{ marginLeft: "1rem" }}>Status: </label>
          <select value={statusFilter} onChange={function (e) { setStatusFilter(e.target.value); }}>
            <option value="all">All Status</option>
            <option value="Reported">Reported</option>
            <option value="In Progress">In Progress</option>
            <option value="Resolved">Resolved</option>
          </select>
        </div>

        {loading && (
          <p style={{ color: "var(--navy)", fontStyle: "italic" }}>
            Loading complaints, please wait...
          </p>
        )}

        {!loading && filteredIssues.length === 0 && (
          <div
            style={{
              textAlign: "center",
              padding: "2rem",
              color: "#888",
              border: "1px dashed #ccc",
              borderRadius: "8px",
            }}
          >
            No complaints found for this period.
          </div>
        )}

        {!loading && filteredIssues.map(function (issue) {
          return (
            <div key={issue.id} className="placeholder-box" style={{ marginBottom: "1rem" }}>
              <strong>{issue.category || "Uncategorized"}</strong> — {issue.severity || "N/A"}
      {issue.report_count > 1 && (
        <span
          style={{
            marginLeft: "0.6rem",
            backgroundColor: "#d9534f",
            color: "white",
            padding: "2px 8px",
            borderRadius: "10px",
            fontSize: "0.75rem",
          }}
        >
          Reported {issue.report_count} times
        </span>
      )}
              <br />
              Location: {issue.location_text}
              <br />
              Reported on: {new Date(issue.created_at).toLocaleDateString()}
              <br />
              {issue.report_count > 1 && (
                <span
                  style={{
                    background: "#fde68a",
                    color: "#78350f",
                    padding: "2px 8px",
                    borderRadius: "8px",
                    fontSize: "0.8rem",
                    fontWeight: "bold",
                  }}
                >
                  Reported {issue.report_count} times
                </span>
              )}
              <br />
              Status:{" "}
              <span
                style={{
                  backgroundColor: getStatusColor(issue.status),
                  color: "white",
                  padding: "2px 10px",
                  borderRadius: "12px",
                  fontSize: "0.85rem",
                  fontWeight: "bold",
                }}
              >
                {issue.status}
              </span>
              {isOverdue(issue) && (
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
                  ⚠ Deadline Missed
                </span>
              )}
                                        {issue.urgent_flag && !issue.re_reported && (
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
              {issue.re_reported && (
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
              <br />
              {issue.description}

              {issue.photo_url && (
                <div style={{ marginTop: "0.5rem" }}>
                  <img
                    src={issue.photo_url}
                    alt="complaint"
                    style={{ maxWidth: "200px", borderRadius: "6px", display: "block" }}
                  />
                </div>
              )}

              {issue.video_url && (
                <div style={{ marginTop: "0.5rem" }}>
                  <video
                    src={issue.video_url}
                    controls
                    style={{ maxWidth: "250px", display: "block" }}
                  />
                </div>
              )}

              {!issue.assigned_worker_id && issue.status !== "Resolved" && !issue.resolved_photo_url && (
                <div style={{ marginTop: "0.75rem" }}>
                  <label>Assign Worker: </label>
                  <select id={"worker-" + issue.id} defaultValue="">
                    <option value="" disabled>Select worker</option>
                    {workers.filter((w) => w.status === "active").map(function (w) {
                      return <option key={w.id} value={w.id}>{w.full_name}</option>;
                    })}
                  </select>

                  <label style={{ marginLeft: "1rem" }}>Deadline: </label>
                  <input type="date" id={"deadline-" + issue.id} />

                  <button
                    style={{ marginLeft: "1rem" }}
                    onClick={function () {
                      const workerId = document.getElementById("worker-" + issue.id).value;
                      const deadline = document.getElementById("deadline-" + issue.id).value;
                      if (!workerId) {
                        alert("Please select a worker first");
                        return;
                      }
                      assignWorker(issue.id, workerId, deadline);
                    }}
                  >
                    Assign
                  </button>
                </div>
              )}
               {issue.assigned_worker_id && issue.status !== "Resolved" && !issue.resolved_photo_url && (
  <div style={{ marginTop: "0.75rem", padding: "0.5rem", background: "#eef2ff", borderRadius: "6px" }}>
    <strong>Assigned to:</strong>{" "}
    {(() => {
      const w = workers.find((w) => w.id === issue.assigned_worker_id);
      return w ? w.full_name : "Worker";
    })()}
    {issue.resolution_deadline && (
      <>
        <br />
        <strong>Deadline:</strong>{" "}
        {new Date(issue.resolution_deadline).toLocaleDateString()}
      </>
    )}
  </div>
)}
              {issue.resolved_photo_url && issue.status !== "Resolved" && (
                <div style={{ marginTop: "0.75rem", border: "1px solid #ccc", padding: "0.75rem" }}>
                  <strong>Resolution Proof Submitted:</strong>
                  <br />
                  <img src={issue.resolved_photo_url} alt="resolution proof" style={{ maxWidth: "200px", marginTop: "0.5rem", display: "block" }} />
                  <button style={{ marginTop: "0.5rem" }} onClick={function () { confirmResolved(issue.id); }}>
                    Confirm Resolved
                  </button>
                  <button style={{ marginTop: "0.5rem", marginLeft: "0.5rem" }} onClick={function () { rejectResolution(issue.id); }}>
                    Reject (send back to worker)
                  </button>
                </div>
              )}

              {issue.status === "Resolved" && (
                <p style={{ color: "green", marginTop: "0.5rem" }}>✔ Confirmed Resolved</p>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}