import { useState } from "react";
import { Link, useSearchParams, useNavigate } from "react-router-dom";
import { verifyAccount } from "../services/authService";

export default function VerifyAccount() {
  const [params] = useSearchParams();
  const navigate = useNavigate();

  const [email, setEmail] = useState(params.get("email") || "");
  const [code, setCode] = useState("");
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  async function submit(event) {
    event.preventDefault();
    setError("");
    setMessage("");

    try {
      const { data } = await verifyAccount({ email, code });
      setMessage(data.message);
      setTimeout(() => navigate("/login"), 800);
    } catch (error) {
      setError(error.response?.data?.message || "Verification failed");
    }
  }

  return (
    <div className="auth-page">
      <form className="auth-card" onSubmit={submit}>
        <h1>Verify account</h1>
        <p className="muted">
          The development verification code is printed in the backend terminal.
        </p>

        <input
          value={email}
          onChange={e => setEmail(e.target.value)}
          type="email"
          placeholder="Email"
          required
        />

        <input
          value={code}
          onChange={e => setCode(e.target.value)}
          placeholder="6-digit code"
          inputMode="numeric"
          maxLength={6}
          required
        />

        {error && <p className="error">{error}</p>}
        {message && <p className="success">{message}</p>}

        <button>Verify</button>
        <Link to="/login">Back to login</Link>
      </form>
    </div>
  );
}
