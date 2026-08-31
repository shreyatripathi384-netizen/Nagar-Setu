import React, { useEffect, useState } from "react";
import DashboardHeader from "../../components/DashboardHeader";
import { useAuth } from "../../context/AuthContext";
import { supabase } from "../../lib/supabaseClient";

export default function DepartmentDashboard() {
  const { profile } = useAuth();
  const [issues, setIssues] = useState([]);
  const [workers, setWorkers] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchIssues();
    fetchWorkers();
  }, [profile]);

  async function fetchIssues() {
    if (!profile?.department_id) return;
    const { data, error } = await supabase
      .from("issues")
      .select("*")
      .eq("department_id", profile.department_id)
      .order("created_at", { ascending: false });

    if (error) console.error("Error fetching issues:", error);
    else setIssues(data);
    setLoading(false);
  }

  async function fetchWorkers() {
    if (!profile?.department_id) return;
    const { data, error } = await supabase
      .from("profiles")
      .select("id, full_name")
      .eq("department_id", profile.department_id)
      .eq("role", "worker");

    if (error) console.error("Error fetching workers:", error);
    else setWorkers(data);
  }

  async function assignWorker(issueId, workerId, deadline) {
    const { error } = await supabase
      .from("issues")
      .update({
        assigned_worker_id: workerId,
        resolution_deadline: deadline || null,
        status: "In Progress",
      })
      .eq("id", issueId);

    if (error) alert("Error assigning worker: " + error.message);
    else fetchIssues();
  }

  async function confirmResolved(issueId) {
    const { error } = await supabase
      .from("issues")
      .update({
        status: "Resolved",
        resolved_at: new Date().toISOString(),
      })
      .eq("id", issueId);

    if (error) {
      alert("Error confirming resolution: " + error.message);
    } else {
      alert("Marked as Resolved — citizen will now see this update.");
      fetchIssues();
    }
  }

  async function rejectResolution(issueId) {
    const { error } = await supabase
      .from("issues")
      .update({
        resolved_photo_url: null,
        status: "In Progress",
      })
      .eq("id", issueId);

    if (error) {
      alert("Error rejecting: " + error.message);
    } else {
      alert("Rejected — worker will need to submit proof again.");
      fetchIssues();
    }
  }

  return (
    <div className="app-shell">
      <DashboardHeader roleLabel={`Department: ${profile?.departments?.name || ""}`} />
      <div className="dashboard-shell">
        <h2 style={{ fontFamily: "var(--font-display)", color: "var(--navy)" }}>
          Department Complaints
        </h2>

        {loading && <p>Loading complaints...</p>}
        {!loading && issues.length === 0 && <p>No complaints reported yet.</p>}

        {!loading && issues.map((issue) => (
          <div key={issue.id} className="placeholder-box" style={{ marginBottom: "1rem" }}>
            <strong>{issue.category || "Uncategorized"}</strong> — {issue.severity || "N/A"}
            <br />
            Location: {issue.location_text}
            <br />
            Status: {issue.status}
            <br />
            {issue.description}

            {/* Worker assignment section - only show if not yet resolved and no proof pending */}
            {issue.status !== "Resolved" && !issue.resolved_photo_url && (
              <div style={{ marginTop: "0.75rem" }}>
                <label>Assign Worker: </label>
                <select id={`worker-${issue.id}`} defaultValue="">
                  <option value="" disabled>Select worker</option>
                  {workers.map((w) => (
                    <option key={w.id} value={w.id}>{w.full_name}</option>
                  ))}
                </select>

                <label style={{ marginLeft: "1rem" }}>Deadline: </label>
                <input type="date" id={`deadline-${issue.id}`} />

                <button
                  style={{ marginLeft: "1rem" }}
                  onClick={() => {
                    const workerId = document.getElementById(`worker-${issue.id}`).value;
                    const deadline = document.getElementById(`deadline-${issue.id}`).value;
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

            {/* Resolution proof review section - only show if worker submitted proof */}
            {issue.resolved_photo_url && issue.status !== "Resolved" && (
              <div style={{ marginTop: "0.75rem", border: "1px solid #ccc", padding: "0.75rem" }}>
                <strong>Resolution Proof Submitted:</strong>
                <br />
                <img
                  src={issue.resolved_photo_url}
                  alt="resolution proof"
                  style={{ maxWidth: "200px", marginTop: "0.5rem", display: "block" }}
                />
                <button
                  style={{ marginTop: "0.5rem" }}
                  onClick={() => confirmResolved(issue.id)}
                >
                  Confirm Resolved
                </button>
                <button
                  style={{ marginTop: "0.5rem", marginLeft: "0.5rem" }}
                  onClick={() => rejectResolution(issue.id)}
                >
                  Reject (send back to worker)
                </button>
              </div>
            )}

            {issue.status === "Resolved" && (
              <p style={{ color: "green", marginTop: "0.5rem" }}>✔ Confirmed Resolved</p>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}