import React, { useEffect, useState } from "react";
import DashboardHeader from "../../components/DashboardHeader";
import { useAuth } from "../../context/AuthContext";
import { supabase } from "../../lib/supabaseClient";

export default function WorkerDashboard() {
  const { profile } = useAuth();
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(null);

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

  function getCurrentLocation() {
    return new Promise((resolve) => {
      if (!navigator.geolocation) {
        resolve(null);
        return;
      }
      navigator.geolocation.getCurrentPosition(
        (pos) => resolve({ lat: pos.coords.latitude, lng: pos.coords.longitude }),
        () => resolve(null), // agar permission deny ho, to bina location ke aage badhenge
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

    // 1. Location capture karo (agar allow kiya to)
    const location = await getCurrentLocation();

    // 2. Photo Supabase Storage me upload karo
    const fileExt = file.name.split(".").pop();
    const fileName = `resolved-${issueId}-${Date.now()}.${fileExt}`;

    const { error: uploadError } = await supabase.storage
      .from("issue-media")
      .upload(fileName, file);

    if (uploadError) {
      alert("Error uploading photo: " + uploadError.message);
      setUploading(null);
      return;
    }

    const { data: urlData } = supabase.storage
      .from("issue-media")
      .getPublicUrl(fileName);

    // 3. Photo URL + location database me save karo
    const { error: updateError } = await supabase
      .from("issues")
      .update({
        resolved_photo_url: urlData.publicUrl,
        resolved_lat: location?.lat || null,
        resolved_lng: location?.lng || null,
      })
      .eq("id", issueId);

    if (updateError) {
      alert("Error saving proof: " + updateError.message);
    } else {
      alert("Proof uploaded! Sent to department for confirmation.");
      fetchTasks();
    }
    setUploading(null);
  }

  return (
    <div className="app-shell">
      <DashboardHeader roleLabel="Field Worker" />
      <div className="dashboard-shell">
        <h2 style={{ fontFamily: "var(--font-display)", color: "var(--navy)" }}>
          My Assigned Tasks
        </h2>

        {loading && <p>Loading tasks...</p>}
        {!loading && tasks.length === 0 && <p>No tasks assigned to you yet.</p>}

        {!loading && tasks.map((task) => (
          <div key={task.id} className="placeholder-box" style={{ marginBottom: "1rem" }}>
            <strong>{task.category || "Uncategorized"}</strong> — {task.severity || "N/A"}
            <br />
            Location: {task.location_text}
            <br />
            Status: {task.status}
            <br />
            {task.description}

            {task.resolved_photo_url && (
              <div style={{ marginTop: "0.5rem" }}>
                <em>Proof already submitted, waiting for department confirmation.</em>
                <br />
                <img src={task.resolved_photo_url} alt="proof" style={{ maxWidth: "150px", marginTop: "0.5rem" }} />
                {task.resolved_lat && task.resolved_lng && (
                  <div>
                    
                      href={`https://www.google.com/maps?q=${task.resolved_lat},${task.resolved_lng}`}
                      target="_blank"
                      rel="noreferrer"
                    >
                      View captured location on map
                    </a>
                  </div>
                )}
              </div>
            )}

            {task.status !== "Resolved" && !task.resolved_photo_url && (
              <div style={{ marginTop: "0.75rem" }}>
                <input
                  type="file"
                  accept="image/*"
                  capture="environment"
                  id={`photo-${task.id}`}
                />
                <button
                  style={{ marginLeft: "1rem" }}
                  disabled={uploading === task.id}
                  onClick={() => {
                    const fileInput = document.getElementById(`photo-${task.id}`);
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
        ))}
      </div>
    </div>
  );
}