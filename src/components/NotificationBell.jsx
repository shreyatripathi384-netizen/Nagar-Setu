import React, { useEffect, useState } from "react";
import { supabase } from "../lib/supabaseClient";

export default function NotificationBell({ role, profile }) {
  const [items, setItems] = useState([]);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    if (!profile) return;
    loadNotifications();
    const interval = setInterval(loadNotifications, 30000);
    return () => clearInterval(interval);
  }, [profile]);

  async function loadNotifications() {
    let list = [];

        if (role === "citizen") {
      const { data } = await supabase
        .from("issues")
        .select("id, category, status")
        .eq("citizen_id", profile.id)
        .in("status", ["In Progress", "Resolved"])
        .order("created_at", { ascending: false })
        .limit(10);
      if (data) {
        list = data.map((i) => ({
          text: `Your ${i.category || "complaint"} is now "${i.status}"`,
        }));
      }

      const { data: overdue } = await supabase
        .from("issues")
        .select("id, category")
        .eq("citizen_id", profile.id)
        .lt("resolution_deadline", new Date().toISOString())
        .neq("status", "Resolved");
      if (overdue) {
        const overdueList = overdue.map((i) => ({
          text: `⚠ Deadline passed for your ${i.category || "complaint"} — tap "Complain Again" on it.`,
        }));
        list = [...overdueList, ...list];
      }
    }

    if (role === "department") {
      const { data: newComplaints } = await supabase
        .from("issues")
        .select("id, category")
        .eq("department_id", profile.department_id)
        .eq("status", "Reported");

      const { data: newWorkers } = await supabase
        .from("profiles")
        .select("id, full_name")
        .eq("department_id", profile.department_id)
        .eq("role", "worker")
        .eq("status", "active");

      const { data: urgent } = await supabase
        .from("issues")
        .select("id, category")
        .eq("department_id", profile.department_id)
        .eq("urgent_flag", true)
        .neq("status", "Resolved");

      list = [
        ...(newComplaints || []).map((c) => ({ text: `New complaint: ${c.category || "Issue"}` })),
        ...(newWorkers || []).map((w) => ({ text: `Worker added: ${w.full_name}` })),
        ...(urgent || []).map((u) => ({ text: `Citizen re-reported (deadline crossed): ${u.category || "Issue"}` })),
      ];
    }
    if (role === "worker") {
      const { data } = await supabase
        .from("issues")
        .select("id, category, location_text")
        .eq("assigned_worker_id", profile.id)
        .neq("status", "Resolved")
        .is("resolved_photo_url", null);
      if (data) {
        list = data.map((i) => ({
          text: `New task assigned: ${i.category || "Issue"} at ${i.location_text || "location"}`,
        }));
      }
    }
    if (role === "municipal") {
      const { data } = await supabase
        .from("issues")
        .select("id, category, resolution_deadline")
        .lt("resolution_deadline", new Date().toISOString())
        .neq("status", "Resolved");
      if (data) {
        list = data.map((i) => ({
          text: `Deadline missed: ${i.category || "Issue"} — escalated`,
        }));
      }
    }

    setItems(list);
  }

  return (
    <div style={{ position: "absolute", top: "18px", right: "100px", zIndex: 1000 }}>
      <button
        onClick={() => setOpen(!open)}
        style={{
          background: "none",
          border: "none",
          fontSize: "1.4rem",
          cursor: "pointer",
          color: "white",
          position: "relative",
        }}
      >
        🔔
        {items.length > 0 && (
          <span
            style={{
              position: "absolute",
              top: "-4px",
              right: "-6px",
              background: "#dc2626",
              color: "white",
              borderRadius: "50%",
              fontSize: "0.7rem",
              padding: "1px 6px",
            }}
          >
            {items.length}
          </span>
        )}
      </button>

      {open && (
        <div
          style={{
            position: "absolute",
            top: "2rem",
            right: 0,
            background: "white",
            color: "#111",
            border: "1px solid #ccc",
            borderRadius: "8px",
            width: "280px",
            maxHeight: "300px",
            overflowY: "auto",
            boxShadow: "0 4px 12px rgba(0,0,0,0.15)",
          }}
        >
          {items.length === 0 ? (
            <p style={{ padding: "1rem", fontSize: "0.85rem", color: "#888" }}>No new notifications</p>
          ) : (
            items.map((n, i) => (
              <div key={i} style={{ padding: "0.6rem 1rem", borderBottom: "1px solid #eee", fontSize: "0.85rem" }}>
                {n.text}
              </div>
            ))
          )}
        </div>
      )}
    </div>
  );
}