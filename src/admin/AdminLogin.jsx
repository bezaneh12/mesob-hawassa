import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "../supabase";
import "./Admin.css";

function AdminLogin() {
  const navigate = useNavigate();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleLogin(event) {
    event.preventDefault();

    setError("");

    if (!supabase) {
      setError("Supabase is not configured yet.");
      return;
    }

    setLoading(true);

    try {
      const { error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) {
        throw error;
      }

      navigate("/admin/dashboard");
    } catch (error) {
      console.error("Login error:", error);
      setError(error.message || "Invalid email or password.");
    } finally {
      setLoading(false);
    }
  }

  if (!supabase) {
    return (
      <div className="admin-login-page">
        <div className="admin-login-card">
          <div className="admin-login-header">
            <h1>Admin Login unavailable</h1>
            <p>
              Supabase is not configured yet. Please add your environment
              variables to continue.
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="admin-login-page">
      <div className="admin-login-card">
        <div className="admin-login-header">
          <img
            src="/mesob-logo.png.webp"
            alt="MESOB Hawassa"
            className="admin-logo"
          />

          <h1>Admin Login</h1>
          <p>MESOB Hawassa Administration</p>
        </div>

        <form onSubmit={handleLogin}>
          <div className="admin-form-group">
            <label htmlFor="email">
              Email
            </label>

            <input
              id="email"
              type="email"
              placeholder="Enter admin email"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              required
            />
          </div>

          <div className="admin-form-group">
            <label htmlFor="password">
              Password
            </label>

            <input
              id="password"
              type="password"
              placeholder="Enter password"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              required
            />
          </div>

          {error && (
            <p className="admin-error">
              {error}
            </p>
          )}

          <button
            type="submit"
            className="admin-login-button"
            disabled={loading}
          >
            {loading ? "Signing in..." : "Sign In"}
          </button>
        </form>

        <button
          type="button"
          className="back-to-website"
          onClick={() => navigate("/")}
        >
          ← Back to Website
        </button>
      </div>
    </div>
  );
}

export default AdminLogin;