import React from "react";
import DashboardHeader from "../../components/DashboardHeader";

/**
 * TODO (Member A - feature/citizen-dashboard):
 * - Report an issue form (photo + video upload via camera or gallery, location, description)
 * - "My reported issues" list with status tracking
 * - AI classification call after submission
 * - "Complain Again" button after resolution deadline passes
 * - Post-resolution 1-5 star feedback
 */
export default function CitizenDashboard() {
  return (
    <div className="app-shell">
      <DashboardHeader roleLabel="Citizen" />
      <div className="dashboard-shell">
        <h2 style={{ fontFamily: "var(--font-display)", color: "var(--navy)" }}>
          My Reported Issues
        </h2>
        <div className="placeholder-box">
          Citizen dashboard goes here — complaint form, status tracking, and feedback.
          <br />
          Owned by: Member A
        </div>
      </div>
    </div>
  );
}
