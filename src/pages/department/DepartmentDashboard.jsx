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

    if (error) {
      alert("Error assigning worker: " + error.message);
    } else {
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
          </div>
        ))}
      </div>
    </div>
  );
}