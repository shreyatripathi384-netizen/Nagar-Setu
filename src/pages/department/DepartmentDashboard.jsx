import React, { useEffect, useState } from "react";
import DashboardHeader from "../../components/DashboardHeader";
import { useAuth } from "../../context/AuthContext";
import { supabase } from "../../lib/supabaseClient";

export default function DepartmentDashboard() {
  const { profile } = useAuth();
  const [issues, setIssues] = useState([]);
  const [workers, setWorkers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState("all");

  useEffect(() => {
    fetchIssues();
    fetchWorkers();
  }, [profile]);

  async function fetchIssues() {
    if (!profile?.department_id) return;
    const result = await supabase
      .from("issues")
      .select("*")
      .eq("department_id", profile.department_id)
      .order("created_at", { ascending: false });
    if (result.error) console.error("Error fetching issues:", result.error);
    else setIssues(result.data);
    setLoading(false);
  }

  async function fetchWorkers() {
    if (!profile?.department_id) return;
    const result = await supabase
      .from("profiles")
      .select("id, full_name")
      .eq("department_id", profile.department_id)
      .eq("role", "worker");
    if (result.error) console.error("Error fetching workers:", result.error);
    else setWorkers(result.data);
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

  function filterByDate(list) {
    if (filter === "all") return list;
    const now = new Date();
    return list.filter(function (issue) {
      const createdDate = new Date(issue.created_at);
      const diffMs = now - createdDate;
      const diffDays = diffMs / (1000 * 60 * 60 * 24);
      if (filter === "day") return diffDays <= 1;
      if (filter === "week") return diffDays <= 7;
      if (filter === "month") return diffDays <= 30;
      return true;
    });
  }
    function getStatusColor(status) {
    if (status === "Reported") return "#f59e0b";
    if (status === "In Progress") return "#3b82f6";
    if (status === "Resolved") return "#22c55e";
    return "#999";
  }

  const filteredIssues = filterByDate(issues);

  return (
    <div className="app-shell">
      <DashboardHeader roleLabel={"Department: " + (profile && profile.departments ? profile.departments.name : "")} />
      <div className="dashboard-shell">
        <h2 style={{ fontFamily: "var(--font-display)", color: "var(--navy)" }}>
          Department Complaints
        </h2>

        <div style={{ marginBottom: "1rem" }}>
          <label>Show: </label>
          <select value={filter} onChange={function (e) { setFilter(e.target.value); }}>
            <option value="all">All Time</option>
            <option value="day">Last Day</option>
            <option value="week">Last Week</option>
            <option value="month">Last Month</option>
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
            No complaints found for this period. 🎉
          </div>
        )}

        {!loading && filteredIssues.map(function (issue) {
          return (
            <div key={issue.id} className="placeholder-box" style={{ marginBottom: "1rem" }}>
              <strong>{issue.category || "Uncategorized"}</strong> — {issue.severity || "N/A"}
              <br />
              Location: {issue.location_text}
              <br />
              Reported on: {new Date(issue.created_at).toLocaleDateString()}
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
              <br />
              {issue.description}

              {issue.status !== "Resolved" && !issue.resolved_photo_url && (
                <div style={{ marginTop: "0.75rem" }}>
                  <label>Assign Worker: </label>
                  <select id={"worker-" + issue.id} defaultValue="">
                    <option value="" disabled>Select worker</option>
                    {workers.map(function (w) {
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