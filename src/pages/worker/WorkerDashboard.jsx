import React, { useEffect, useState } from "react";
import DashboardHeader from "../../components/DashboardHeader";
import { useAuth } from "../../context/AuthContext";
import { supabase } from "../../lib/supabaseClient";
import NotificationBell from "../../components/NotificationBell";
export default function WorkerDashboard() {
  const { profile } = useAuth();
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(null);
const [statusFilter, setStatusFilter] = useState("all");
  useEffect(() => {
    fetchTasks();
  }, [profile]);

  async function fetchTasks() {
    if (!profile?.id) return;
    const { data, error } = await supabase
      .from("issues")
      .select("*")
      .eq("assigned_worker_id", profile.id)
      .order("created_at", { ascending: false });
    if (error) console.error("Error fetching tasks:", error);
    else setTasks(data);
    setLoading(false);
  }
  function sortByPriority(list) {
  return [...list].sort((a, b) => {
    const aUrgent = a.urgent_flag || a.re_reported ? 0 : 1;
    const bUrgent = b.urgent_flag || b.re_reported ? 0 : 1;
    return aUrgent - bUrgent;
  });
}
function filterByStatus(list) {
  if (statusFilter === "all") return list;
  return list.filter(function (task) {
    return task.status === statusFilter;
  });
}
  function getCurrentLocation() {
    return new Promise((resolve) => {
      if (!navigator.geolocation) {
        resolve(null);
        return;
      }
      navigator.geolocation.getCurrentPosition(
        (pos) => resolve({ lat: pos.coords.latitude, lng: pos.coords.longitude }),
        () => resolve(null),
        { enableHighAccuracy: true, timeout: 8000 }
      );
    });
  }

  async function handleResolve(issueId, file) {
    if (!file) {
      alert("Please select/click a photo before marking resolved.");
      return;
    }
    setUploading(issueId);
    const location = await getCurrentLocation();
    const fileExt = file.name.split(".").pop();
    const fileName = "resolved-" + issueId + "-" + Date.now() + "." + fileExt;

    const uploadResult = await supabase.storage.from("Issue Media").upload(fileName, file);
    if (uploadResult.error) {
      alert("Error uploading photo: " + uploadResult.error.message);
      setUploading(null);
      return;
    }

    const urlResult = supabase.storage.from("Issue Media").getPublicUrl(fileName);

    const updateResult = await supabase
      .from("issues")
      .update({
        resolved_photo_url: urlResult.data.publicUrl,
        resolved_lat: location ? location.lat : null,
        resolved_lng: location ? location.lng : null,
      })
      .eq("id", issueId);

    if (updateResult.error) {
      alert("Error saving proof: " + updateResult.error.message);
    } else {
      alert("Proof uploaded! Sent to department for confirmation.");
      fetchTasks();
    }
    setUploading(null);
  }
const filteredTasks = sortByPriority(filterByStatus(tasks));
  return (
    <div className="app-shell">
      <DashboardHeader roleLabel="Field Worker" />
      <NotificationBell role="worker" profile={profile} />
      <div className="dashboard-shell">
        <h2 style={{ fontFamily: "var(--font-display)", color: "var(--navy)" }}>
          My Assigned Tasks
        </h2>
        <div style={{ marginBottom: "1rem" }}>
          <label style={{ fontSize: "0.85rem" }}>Show: </label>
          <select value={statusFilter} onChange={function (e) { setStatusFilter(e.target.value); }}>
            <option value="all">All Status</option>
            <option value="Reported">Reported</option>
            <option value="In Progress">In Progress</option>
            <option value="Resolved">Resolved</option>
          </select>
        </div>
                {loading && (
          <p style={{ color: "var(--navy)", fontStyle: "italic" }}>
            Loading your tasks, please wait...
          </p>
        )}
                       {!loading && filteredTasks.length === 0 && (
          <div
            style={{
              textAlign: "center",
              padding: "2rem",
              color: "#888",
              border: "1px dashed #ccc",
              borderRadius: "8px",
            }}
          >
            No tasks assigned to you yet. Check back soon! 🛠️
          </div>
        )}

                {!loading && filteredTasks.map(function (task) {
          return (
            <div key={task.id} className="placeholder-box" style={{ marginBottom: "1rem" }}>
              <strong>{task.category || "Uncategorized"}</strong> — {task.severity || "N/A"}
              <br />
              Location: {task.location_text}
              <br />
                            Status:{" "}
              <span
                style={{
                  backgroundColor:
                    task.status === "Reported" ? "#f59e0b" :
                    task.status === "In Progress" ? "#3b82f6" :
                    task.status === "Resolved" ? "#22c55e" : "#999",
                  color: "white",
                  padding: "2px 10px",
                  borderRadius: "12px",
                  fontSize: "0.85rem",
                  fontWeight: "bold",
                }}
              >
                {task.status}
                              {task.urgent_flag && !task.re_reported && (
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
              {task.re_reported && (
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
              </span>
              <br />
                           {task.description}

              {task.photo_url && (
                <div style={{ marginTop: "0.5rem" }}>
                  <img
                    src={task.photo_url}
                    alt="complaint"
                    style={{ maxWidth: "200px", borderRadius: "6px", display: "block" }}
                  />
                </div>
              )}

              {task.video_url && (
                <div style={{ marginTop: "0.5rem" }}>
                  <video
                    src={task.video_url}
                    controls
                    style={{ maxWidth: "250px", display: "block" }}
                  />
                </div>
              )}

              {task.resolved_photo_url && (
                <div style={{ marginTop: "0.5rem" }}>
                  <em>Proof already submitted, waiting for department confirmation.</em>
                  <br />
                  <img src={task.resolved_photo_url} alt="proof" style={{ maxWidth: "150px", marginTop: "0.5rem" }} />
                  {task.resolved_lat && task.resolved_lng && (
                    <div>
                      <a href={"https://www.google.com/maps?q=" + task.resolved_lat + "," + task.resolved_lng} target="_blank" rel="noreferrer">
                        View captured location on map
                      </a>
                    </div>
                  )}
                </div>
              )}

              {task.status !== "Resolved" && !task.resolved_photo_url && (
                <div style={{ marginTop: "0.75rem" }}>
                  <input type="file" accept="image/*" capture="environment" id={"photo-" + task.id} />
                  <button
                    style={{ marginLeft: "1rem" }}
                    disabled={uploading === task.id}
                    onClick={function () {
                      const fileInput = document.getElementById("photo-" + task.id);
                      handleResolve(task.id, fileInput.files[0]);
                    }}
                  >
                    {uploading === task.id ? "Uploading..." : "Mark as Resolved"}
                  </button>
                  <p style={{ fontSize: "0.8rem", color: "gray", marginTop: "0.3rem" }}>
                    Tapping this will ask camera + location permission — allow both.
                  </p>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}