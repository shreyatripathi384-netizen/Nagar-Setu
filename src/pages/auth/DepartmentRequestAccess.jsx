import React, { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { supabase } from "../../lib/supabaseClient";

export default function DepartmentRequestAccess() {
  const [departments, setDepartments] = useState([]);
  const [fullName, setFullName] = useState("");
  const [designation, setDesignation] = useState("");
  const [departmentId, setDepartmentId] = useState("");
  const [employeeId, setEmployeeId] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    supabase
      .from("departments")
      .select("id, name")
      .then(({ data }) => setDepartments(data || []));
  }, []);

  async function handleSubmit(e) {
    e.preventDefault();
    setError("");
    setLoading(true);

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
        role: "department",
        department_id: departmentId,
        employee_id: employeeId,
        designation,
        status: "pending",
      });
      if (profileError) {
        setError(profileError.message);
        setLoading(false);
        return;
      }
    }

    setLoading(false);
    setSubmitted(true);
  }

  if (submitted) {
    return (
      <div className="page-center">
        <div className="card">
          <h1>Request Submitted</h1>
          <p className="subtitle">
            Your request has been sent to the Municipal Corporation Head for verification.
          </p>
          <span className="status-badge status-pending">Pending Approval</span>
          <p style={{ fontSize: 13, color: "var(--text-muted)", marginTop: 16 }}>
            You will be able to log in once your account is approved.
          </p>
          <button className="btn-secondary" onClick={() => navigate("/department/login")}>
            Go to Login
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="page-center">
      <form className="card" onSubmit={handleSubmit}>
        <h1>Department Admin — Request Access</h1>
        <p className="subtitle">Your account requires Municipal Head approval before you can log in</p>

        <label>Full Name</label>
        <input required value={fullName} onChange={(e) => setFullName(e.target.value)} />

        <label>Designation</label>
        <input required value={designation} onChange={(e) => setDesignation(e.target.value)} />

        <label>Department</label>
        <select required value={departmentId} onChange={(e) => setDepartmentId(e.target.value)}>
          <option value="">Select department</option>
          {departments.map((d) => (
            <option key={d.id} value={d.id}>
              {d.name}
            </option>
          ))}
        </select>

        <label>Employee ID</label>
        <input required value={employeeId} onChange={(e) => setEmployeeId(e.target.value)} />

        <label>Official Email</label>
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
          {loading ? "Submitting..." : "Submit Request"}
        </button>

        <div className="link-row">
          Already approved? <Link to="/department/login">Log in</Link>
        </div>
      </form>
    </div>
  );
}
