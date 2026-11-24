import { useState } from "react";
import type { FormEvent } from "react";
import { login } from "./api";
import type { AuthResponse } from "./api";

interface Props {
  onLogin: (auth: AuthResponse) => void;
  onShowRegister: () => void;
  onShowForgot: () => void;
  onShowHome: () => void;
}

export default function LoginPage({
  onLogin,
  onShowRegister,
  onShowForgot,
  onShowHome,
}: Props) {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    setSubmitting(true);
    try {
      onLogin(await login(username.trim(), password));
    } catch (err) {
      setError(
        err instanceof TypeError
          ? "Cannot reach the API. Is the backend running on port 8081?"
          : err instanceof Error
            ? err.message
            : "Login failed",
      );
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <main className="center page-login">
      <form className="card login" onSubmit={handleSubmit}>
        <h1>Sign in</h1>
        <label>
          Username
          <input
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            autoComplete="username"
            autoFocus
            required
          />
        </label>
        <label>
          Password
          <span className="password-field">
            <input
              type={showPassword ? "text" : "password"}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              autoComplete="current-password"
              required
            />
            <button
              type="button"
              className="eye-btn"
              onClick={() => setShowPassword((v) => !v)}
              aria-label={showPassword ? "Hide password" : "Show password"}
              aria-pressed={showPassword}
              title={showPassword ? "Hide password" : "Show password"}
            >
              {showPassword ? (
                <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                  <path d="M17.94 17.94A10.94 10.94 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94" />
                  <path d="M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19" />
                  <path d="M14.12 14.12a3 3 0 1 1-4.24-4.24" />
                  <path d="M1 1l22 22" />
                </svg>
              ) : (
                <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                  <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
                  <circle cx="12" cy="12" r="3" />
                </svg>
              )}
            </button>
          </span>
        </label>
        <p className="forgot">
          <button type="button" className="link" onClick={onShowForgot}>
            Forgot password?
          </button>
        </p>
        {error && (
          <p className="error" role="alert">
            {error}
          </p>
        )}
        <button type="submit" className="btn-black" disabled={submitting}>
          {submitting ? "Signing in…" : "Sign in"}
        </button>
        <p className="switch">
          New here?{" "}
          <button type="button" className="link" onClick={onShowRegister}>
            Create an account
          </button>
          {" · "}
          <button type="button" className="link" onClick={onShowHome}>
            Home
          </button>
        </p>
      </form>
    </main>
  );
}
