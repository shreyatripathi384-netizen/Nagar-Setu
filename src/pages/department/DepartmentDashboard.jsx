import React from "react";
import DashboardHeader from "../../components/DashboardHeader";
import { useAuth } from "../../context/AuthContext";

/**
 * TODO (Member B - feature/department-worker):
 * - List of complaints filtered by this department (profile.department_id)
 * - Sort by date, day/week/month view
 * - Assign a worker to a complaint (manual selection, not AI)
 * - Set resolution deadline
 * - Review worker's before/after photo and "Confirm Resolved"
 */
export default function DepartmentDashboard() {
  const { profile } = useAuth();

  return (
    <div className="app-shell">
      <DashboardHeader roleLabel={`Department: ${profile?.departments?.name || ""}`} />
      <div className="dashboard-shell">
        <h2 style={{ fontFamily: "var(--font-display)", color: "var(--navy)" }}>
          Department Complaints
        </h2>
        <div className="placeholder-box">
          Department dashboard goes here — complaint list, worker assignment, resolution review.
          <br />
          Owned by: Member B
        </div>
      </div>
    </div>
  );
}
