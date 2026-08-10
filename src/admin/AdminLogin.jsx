import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "../supabase";
import "./Admin.css";

function AdminLogin() {
  // Router hook used to redirect after login or when going back to the site
  const navigate = useNavigate();

  // Controlled form state for the login inputs
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  // Holds any error message to display to the user
  const [error, setError] = useState("");

  // Tracks whether a login request is currently in progress
  const [loading, setLoading] = useState(false);

  async function handleLogin(event) {
    // Prevent the default browser form submission (page reload)
    event.preventDefault();

    // Clear any previous error before attempting a new login
    setError("");

    // Guard clause: if Supabase client wasn't initialized (missing env vars, etc.)
    if (!supabase) {
      setError("Supabase is not configured yet.");
      return;
    }

    setLoading(true);
    try {
      // Attempt to sign in with email/password via Supabase Auth
      const { error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      // If Supabase returns an error, throw it to be caught below
      if (error) {
        throw error;
      }

      // On successful login, redirect to the admin dashboard
      navigate("/admin/dashboard");
    } catch (error) {
      // Log the error for debugging and show a user-friendly message
      console.error("Login error:", error);
      setError(error.message || "Invalid email or password.");
    } finally {
      // Always stop the loading state, whether login succeeded or failed
      setLoading(false);
    }
  }

  // If Supabase isn't configured, render a fallback "unavailable" screen
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

  // Main login form UI
  return (
    <div className="admin-login-page">
      <div className="admin-login-card">
        <div className="admin-login-header">
          {/* MESOB Hawassa logo */}
          <img
            src="/mesob-logo.png.webp"
            alt="MESOB Hawassa"
            className="admin-logo"
          />
          <h1>Admin Login</h1>
          <p>MESOB Hawassa Administration</p>
        </div>

        <form onSubmit={handleLogin}>
          {/* Email input field */}
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

          {/* Password input field */}
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

          {/* Show error message if login fails */}
          {error && (
            <p className="admin-error">
              {error}
            </p>
          )}

          {/* Submit button, disabled while a login request is in flight */}
          <button
            type="submit"
            className="admin-login-button"
            disabled={loading}
          >
            {loading ? "Signing in..." : "Sign In"}
          </button>
        </form>

        {/* Link back to the public-facing website */}
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
