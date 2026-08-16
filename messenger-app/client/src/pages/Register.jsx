import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { registerUser } from "../services/authService";

export default function Register() {
  const navigate = useNavigate();
  const [form, setForm] = useState({
    username: "",
    email: "",
    password: ""
  });
  const [error, setError] = useState("");

  function update(event) {
    setForm({ ...form, [event.target.name]: event.target.value });
  }

  async function submit(event) {
    event.preventDefault();
    setError("");

    try {
      await registerUser(form);
      navigate(`/verify?email=${encodeURIComponent(form.email)}`);
    } catch (error) {
      setError(error.response?.data?.message || "Registration failed");
    }
  }

  return (
    <div className="auth-page">
      <form className="auth-card" onSubmit={submit}>
        <h1>Create account</h1>

        <input name="username" placeholder="Username" onChange={update} required />
        <input name="email" type="email" placeholder="Email" onChange={update} required />
        <input name="password" type="password" placeholder="Password" onChange={update} required />

        {error && <p className="error">{error}</p>}

        <button>Create account</button>

        <p>
          Already have an account? <Link to="/login">Login</Link>
        </p>
      </form>
    </div>
  );
}
