import { Link } from "react-router-dom";

export default function Landing() {
  return (
    <main className="landing">
      <div className="hero-card">
        <div className="brand-mark">M</div>
        <h1>Simple Messenger</h1>
        <p>
          Private 1-to-1 conversations with account verification and
          real-time messaging.
        </p>
        <div className="actions">
          <Link className="button" to="/register">Create account</Link>
          <Link className="button secondary" to="/login">Login</Link>
        </div>
      </div>
    </main>
  );
}
