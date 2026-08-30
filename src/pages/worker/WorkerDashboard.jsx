import React, { useEffect, useState } from "react";
import DashboardHeader from "../../components/DashboardHeader";
import { useAuth } from "../../context/AuthContext";
import { supabase } from "../../lib/supabaseClient";

export default function WorkerDashboard() {
  const { profile } = useAuth();
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchTasks() {
      if (!profile?.id) return;
      const { data, error } = await supabase
        .from("issues")
        .select("*")
        .eq("assigned_worker_id", profile.id)
        .order("created_at", { ascending: false });

      if (error) {
        console.error("Error fetching tasks:", error);
      } else {
        setTasks(data);
      }
      setLoading(false);
    }
    fetchTasks();
  }, [profile]);

  async function markResolved(issueId) {
    const { error } = await supabase
      .from("issues")
      .update({ status: "Resolved", resolved_at: new Date().toISOString() })
      .eq("id", issueId);

    if (error) {
      alert("Error updating task: " + error.message);
    } else {
      setTasks((prev) =>
        prev.map((t) => (t.id === issueId ? { ...t, status: "Resolved" } : t))
      );
    }
  }

  return (
    <div className="app-shell">
      <DashboardHeader roleLabel="Field Worker" />
      <div className="dashboard-shell">
        <h2 style={{ fontFamily: "var(--font-display)", color: "var(--navy)" }}>
          My Assigned Tasks
        </h2>

        {loading && <p>Loading tasks...</p>}

        {!loading && tasks.length === 0 && (
          <p>No tasks assigned to you yet.</p>
        )}

        {!loading && tasks.map((task) => (
          <div key={task.id} className="placeholder-box" style={{ marginBottom: "1rem" }}>
            <strong>{task.category || "Uncategorized"}</strong> — {task.severity || "N/A"}
            <br />
            Location: {task.location_text}
            <br />
            Status: {task.status}
            <br />
            {task.description}
            <br />
            {task.status !== "Resolved" && (
              <button onClick={() => markResolved(task.id)} style={{ marginTop: "0.5rem" }}>
                Mark as Resolved
              </button>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}