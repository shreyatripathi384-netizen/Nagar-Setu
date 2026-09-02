import React, { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { supabase } from "../../lib/supabaseClient";

export default function WorkerSignup() {
  const [fullName, setFullName] = useState("");
  const [phone, setPhone] = useState("");
  const [aadhaar, setAadhaar] = useState("");
  const [departments, setDepartments] = useState([]);
  const [selectedDept, setSelectedDept] = useState("");
    useEffect(function () {
    async function fetchDepartments() {
      const { data } = await supabase.from("departments").select("id, name");
      if (data) setDepartments(data);
    }
    fetchDepartments();
  }, []);
 
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

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
        phone,
        aadhaar_number: aadhaar,
        role: "worker",
        department_id: selectedDept,
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

         <label>Department</label>
            <select value={selectedDept} onChange={function (e) { setSelectedDept(e.target.value); }} required>
              <option value="" disabled>Select department</option>
              {departments.map(function (d) {
                return <option key={d.id} value={d.id}>{d.name}</option>;
              })}
            </select>

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
