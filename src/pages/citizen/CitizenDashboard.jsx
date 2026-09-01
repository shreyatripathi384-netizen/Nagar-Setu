import React, { useEffect, useState } from "react";
import DashboardHeader from "../../components/DashboardHeader";
import { useAuth } from "../../context/AuthContext";
import { supabase } from "../../lib/supabaseClient";
import { classifyIssue } from "../../lib/ai";

function getCurrentLocation() {
  return new Promise((resolve) => {
    if (!navigator.geolocation) {
      resolve(null);
      return;
    }
    navigator.geolocation.getCurrentPosition(
      (pos) => resolve({ lat: pos.coords.latitude, lng: pos.coords.longitude }),
      () => resolve(null)
    );
  });
}

const STATUS_COLORS = {
  Reported: "#f0ad4e",
  "In Progress": "#5bc0de",
  Resolved: "#5cb85c",
};

export default function CitizenDashboard() {
  const { profile } = useAuth();
  const [issues, setIssues] = useState([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [points, setPoints] = useState(profile.points || 0);

  const [description, setDescription] = useState("");
  const [locationText, setLocationText] = useState("");
  const [urgent, setUrgent] = useState(false);

  useEffect(() => {
    fetchIssues();
  }, [profile]);

  async function fetchIssues() {
    if (!profile) return;
    setLoading(true);
    const { data, error } = await supabase
      .from("issues")
      .select("*")
      .eq("citizen_id", profile.id)
      .order("created_at", { ascending: false });
    if (error) console.error("Error fetching issues:", error);
    else setIssues(data);
    setLoading(false);
  }

    async function handleComplainAgain(issueId) {
    const { error } = await supabase
      .from("issues")
      .update({ urgent_flag: true })
      .eq("id", issueId);
    if (!error) {
      alert("Reminder sent to department!");
      fetchIssues();
    }
  }
  async function handleSubmit(e) {
    e.preventDefault();
    setError("");

    const photoInput = document.getElementById("citizen-photo");
    const videoInput = document.getElementById("citizen-video");
    const photoFile = photoInput.files[0];
    const videoFile = videoInput.files[0];

    if (!photoFile) {
      setError("Please upload a photo of the issue.");
      return;
    }
    if (!description.trim() || !locationText.trim()) {
      setError("Please fill in description and location.");
      return;
    }

    setSubmitting(true);

    const location = await getCurrentLocation();

    const photoExt = photoFile.name.split(".").pop();
    const photoName = "citizen-" + profile.id + "-" + Date.now() + "." + photoExt;
    const photoUpload = await supabase.storage.from("Issue media").upload(photoName, photoFile);
    if (photoUpload.error) {
      setError("Error uploading photo: " + photoUpload.error.message);
      setSubmitting(false);
      return;
    }
    const photoUrl = supabase.storage.from("Issue media").getPublicUrl(photoName).data.publicUrl;

    let videoUrl = null;
    if (videoFile) {
      const videoExt = videoFile.name.split(".").pop();
      const videoName = "citizen-video-" + profile.id + "-" + Date.now() + "." + videoExt;
      const videoUpload = await supabase.storage.from("Issue media").upload(videoName, videoFile);
      if (!videoUpload.error) {
        videoUrl = supabase.storage.from("Issue media").getPublicUrl(videoName).data.publicUrl;
      }
    }

    const classification = classifyIssue(description);

    const deptResult = await supabase
      .from("departments")
      .select("id")
      .eq("dept_code", classification.departmentCode)
      .single();

    const insertResult = await supabase.from("issues").insert({
      citizen_id: profile.id,
      description: description,
      photo_url: photoUrl,
      video_url: videoUrl,
      location_text: locationText,
      category: classification.category,
      severity: classification.severity,
      department_id: deptResult.data ? deptResult.data.id : null,
      status: "Reported",
      urgent_flag: urgent,
      resolved_lat: location ? location.lat : null,
      resolved_lng: location ? location.lng : null,
    });

    if (insertResult.error) {
      setError("Error submitting complaint: " + insertResult.error.message);
    } else {
      setDescription("");
      setLocationText("");
      setUrgent(false);
      photoInput.value = "";
      videoInput.value = "";
            setDescription("");
      setLocationText("");
      setUrgent(false);
      photoInput.value = "";
      videoInput.value = "";

      const newPoints = points + 5;
      await supabase
        .from("profiles")
        .update({ points: newPoints })
        .eq("id", profile.id);
      setPoints(newPoints);

      fetchIssues();
    }
    setSubmitting(false);
  }

  return (
    <div>
      <DashboardHeader title="Citizen Dashboard" />

      <div style={{ padding: "1rem", maxWidth: "500px" }}>
                <div style={{ marginBottom: "1rem" }}>
                    <strong>Points: {points}</strong>
          {points >= 100 && (
            <p style={{ color: "green" }}>🏆 Certificate Unlocked!</p>
          )}
        </div>
        <h3>Report an Issue</h3>
        <form onSubmit={handleSubmit}>
          <div style={{ marginBottom: "0.75rem" }}>
            <label style={{ fontSize: "0.85rem", display: "block" }}>Photo (required):</label>
            <input type="file" accept="image/*" capture="environment" id="citizen-photo" />
          </div>

          <div style={{ marginBottom: "0.75rem" }}>
            <label style={{ fontSize: "0.85rem", display: "block" }}>Video (optional):</label>
            <input type="file" accept="video/*" capture="environment" id="citizen-video" />
          </div>

          <div style={{ marginBottom: "0.75rem" }}>
            <label style={{ fontSize: "0.85rem", display: "block" }}>Location:</label>
            <input
              type="text"
              placeholder="e.g. MG Road, Sector 14"
              value={locationText}
              onChange={(e) => setLocationText(e.target.value)}
              style={{ width: "100%", padding: "0.5rem" }}
            />
          </div>

          <div style={{ marginBottom: "0.75rem" }}>
            <label style={{ fontSize: "0.85rem", display: "block" }}>Description:</label>
            <textarea
              placeholder="Describe the issue..."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              style={{ width: "100%", padding: "0.5rem", minHeight: "80px" }}
            />
          </div>

          <div style={{ marginBottom: "0.75rem" }}>
            <label style={{ fontSize: "0.85rem" }}>
              <input
                type="checkbox"
                checked={urgent}
                onChange={(e) => setUrgent(e.target.checked)}
              />{" "}
              Mark as urgent
            </label>
          </div>

          {error && <p style={{ color: "red", fontSize: "0.85rem" }}>{error}</p>}

          <button type="submit" disabled={submitting}>
            {submitting ? "Submitting..." : "Submit Report"}
          </button>
        </form>
      </div>

      <div style={{ padding: "1rem" }}>
        <h3>My Complaints</h3>
        {loading && <p>Loading...</p>}
        {!loading && issues.length === 0 && <p>You haven't reported any issues yet.</p>}
        {!loading &&
          issues.map(function (issue) {
            return (
              <div key={issue.id} className="placeholder-box" style={{ marginBottom: "1rem" }}>
                <strong>{issue.category || "Uncategorized"}</strong> — {issue.severity || "N/A"}
                <br />
                Location: {issue.location_text}
                <br />
                Reported on: {new Date(issue.created_at).toLocaleDateString()}
                                <br />
                {issue.photo_url && (
                  <img
                    src={issue.photo_url}
                    alt="submitted"
                    style={{ maxWidth: "150px", marginTop: "0.5rem", borderRadius: "6px" }}
                  />
                )}
                <br />
                <span
                  style={{
                    display: "inline-block",
                    padding: "0.2rem 0.6rem",
                    borderRadius: "12px",
                    color: "white",
                    fontSize: "0.8rem",
                    backgroundColor: STATUS_COLORS[issue.status] || "#999",
                    marginTop: "0.3rem",
                  }}
                >
                  {issue.status}
                </span>
                                {issue.resolution_deadline && (
                  <p style={{ fontSize: "0.8rem", marginTop: "0.3rem" }}>
                    Expected resolution by: {new Date(issue.resolution_deadline).toLocaleDateString()}
                  </p>
                )}

                {issue.report_count > 1 && (
                  <p style={{ fontSize: "0.8rem", color: "#888" }}>
                    Reported by {issue.report_count} citizens
                  </p>
                )}

                {issue.resolution_deadline &&
                  new Date(issue.resolution_deadline) < new Date() &&
                  issue.status !== "Resolved" && (
                    <button
                      style={{ marginTop: "0.4rem", fontSize: "0.8rem" }}
                      onClick={() => handleComplainAgain(issue.id)}
                    >
                      Complain Again
                    </button>
                  )}
                {issue.resolved_photo_url && (
                  <div style={{ marginTop: "0.5rem" }}>
                    <p style={{ fontSize: "0.8rem" }}>Resolution proof:</p>
                    <img src={issue.resolved_photo_url} alt="resolved" style={{ maxWidth: "150px" }} />
                  </div>
                )}
              </div>
            );
          })}
      </div>
    </div>
  );
}