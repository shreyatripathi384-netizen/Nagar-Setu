import React, { useEffect, useState } from "react";
import DashboardHeader from "../../components/DashboardHeader";
import { useAuth } from "../../context/AuthContext";
import { supabase } from "../../lib/supabaseClient";

export default function DepartmentDashboard() {
  const { profile } = useAuth();
  const [issues, setIssues] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchIssues() {
      if (!profile?.department_id) return;
      const { data, error } = await supabase
        .from("issues")
        .select("*")
        .eq("department_id", profile.department_id)
        .order("created_at", { ascending: false });

      if (error) {
        console.error("Error fetching issues:", error);
      } else {
        setIssues(data);
      }
      setLoading(false);
    }
    fetchIssues();
  }, [profile]);

  return (
    <div className="app-shell">
      <DashboardHeader roleLabel={`Department: ${profile?.departments?.name || ""}`} />
      <div className="dashboard-shell">
        <h2 style={{ fontFamily: "var(--font-display)", color: "var(--navy)" }}>
          Department Complaints
        </h2>

        {loading && <p>Loading complaints...</p>}

        {!loading && issues.length === 0 && (
          <p>No complaints reported for your department yet.</p>
        )}

        {!loading && issues.map((issue) => (
          <div key={issue.id} className="placeholder-box" style={{ marginBottom: "1rem" }}>
            <strong>{issue.category || "Uncategorized"}</strong> — {issue.severity || "N/A"}
            <br />
            Location: {issue.location_text}
            <br />
            Status: {issue.status}
            <br />
            {issue.description}
          </div>
        ))}
      </div>
    </div>
  );
}