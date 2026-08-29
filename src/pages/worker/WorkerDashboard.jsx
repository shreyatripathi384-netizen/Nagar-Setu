import React from "react";
import DashboardHeader from "../../components/DashboardHeader";

/**
 * TODO (Member B - feature/department-worker):
 * - List of tasks assigned to this worker (issues.assigned_worker_id = current user)
 * - Task status update
 * - Photo/video upload on completion, sent for department review
 */
export default function WorkerDashboard() {
  return (
    <div className="app-shell">
      <DashboardHeader roleLabel="Field Worker" />
      <div className="dashboard-shell">
        <h2 style={{ fontFamily: "var(--font-display)", color: "var(--navy)" }}>
          My Assigned Tasks
        </h2>
        <div className="placeholder-box">
          Worker dashboard goes here — assigned tasks, status updates, resolution proof upload.
          <br />
          Owned by: Member B
        </div>
      </div>
    </div>
  );
}
