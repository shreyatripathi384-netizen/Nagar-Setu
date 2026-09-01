import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { supabase } from "../../lib/supabaseClient";

export default function WorkerLogin() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

    async function handleSubmit(e) {
    e.preventDefault();
    setError("");
    setLoading(true);

    const { error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) {
      setError(error.message);
      setLoading(false);
      return;
    }

    const { data: userData } = await supabase.auth.getUser();
    const { data: profile, error: profileError } = await supabase
      .from("profiles")
      .select("status")
      .eq("id", userData.user.id)
      .single();

    if (profileError || !profile) {
      setError("Could not verify your account. Please contact your department.");
      setLoading(false);
      await supabase.auth.signOut();
      return;
    }

    if (profile.status === "pending") {
      setError("Your account is still waiting for approval from your department.");
      setLoading(false);
      await supabase.auth.signOut();
      return;
    }

    if (profile.status === "rejected") {
      setError("Your registration was rejected. Please contact your department.");
      setLoading(false);
      await supabase.auth.signOut();
      return;
    }

    setLoading(false);
    navigate("/worker/dashboard");
  }

  return (
    <div className="page-center">
      <form className="card" onSubmit={handleSubmit}>
        <h1>Worker Login</h1>
        <p className="subtitle">View your assigned tasks</p>

        <label>Email</label>
        <input type="email" required value={email} onChange={(e) => setEmail(e.target.value)} />

        <label>Password</label>
        <input
          type="password"
          required
          value={password}
          onChange={(e) => setPassword(e.target.value)}
        />

        {error && <p className="error-text">{error}</p>}

        <button className="btn-primary" type="submit" disabled={loading}>
          {loading ? "Logging in..." : "Log In"}
        </button>

        <div className="link-row">
          New worker? <Link to="/worker/signup">Register with your code</Link>
        </div>
        <div className="link-row">
          <Link to="/">Back to role selection</Link>
        </div>
      </form>
    </div>
  );
}
