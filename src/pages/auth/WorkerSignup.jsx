import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { supabase } from "../../lib/supabaseClient";

export default function WorkerSignup() {
  const [fullName, setFullName] = useState("");
  const [phone, setPhone] = useState("");
  const [aadhaar, setAadhaar] = useState("");
  const [workerCode, setWorkerCode] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  async function handleSubmit(e) {
    e.preventDefault();
    setError("");
    setLoading(true);

    // Validate the worker code against a real department before creating an account.
    const { data: dept, error: deptError } = await supabase
      .from("departments")
      .select("id, name")
      .eq("worker_code", workerCode.trim())
      .maybeSingle();

    if (deptError || !dept) {
      setError("Worker code not recognized. Check the code given by your department.");
      setLoading(false);
      return;
    }

    const { data, error: signUpError } = await supabase.auth.signUp({ email, password });
    if (signUpError) {
      setError(signUpError.message);
      setLoading(false);
      return;
    }

    const userId = data.user?.id;
    if (userId) {
      const { error: profileError } = await supabase.from("profiles").insert({
        id: userId,
        email,
        full_name: fullName,
        phone,
        aadhaar_number: aadhaar,
        role: "worker",
        department_id: dept.id,
        status: "pending",
      });
      if (profileError) {
        setError(profileError.message);
        setLoading(false);
        return;
      }
    }

    setLoading(false);
    navigate("/worker/login");
  }

  return (
    <div className="page-center">
      <form className="card" onSubmit={handleSubmit}>
        <h1>Worker Registration</h1>
        <p className="subtitle">Use the worker code given by your department</p>

        <label>Full Name</label>
        <input required value={fullName} onChange={(e) => setFullName(e.target.value)} />

        <label>Phone Number</label>
        <input required value={phone} onChange={(e) => setPhone(e.target.value)} />

        <label>Aadhaar Number</label>
        <input required value={aadhaar} onChange={(e) => setAadhaar(e.target.value)} />

        <label>Department Worker Code</label>
        <input required value={workerCode} onChange={(e) => setWorkerCode(e.target.value)} />

        <label>Email</label>
        <input type="email" required value={email} onChange={(e) => setEmail(e.target.value)} />

        <label>Password</label>
        <input
          type="password"
          required
          minLength={6}
          value={password}
          onChange={(e) => setPassword(e.target.value)}
        />

        {error && <p className="error-text">{error}</p>}

        <button className="btn-primary" type="submit" disabled={loading}>
          {loading ? "Creating account..." : "Register"}
        </button>

        <div className="link-row">
          Already registered? <Link to="/worker/login">Log in</Link>
        </div>
      </form>
    </div>
  );
}
