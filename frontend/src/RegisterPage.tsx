import { useState } from "react";
import type { FormEvent } from "react";
import { register } from "./api";
import type { AuthResponse } from "./api";

interface Props {
  onRegistered: (auth: AuthResponse) => void;
  onShowLogin: () => void;
}

export default function RegisterPage({ onRegistered, onShowLogin }: Props) {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);

    if (password !== confirm) {
      setError("Passwords do not match.");
      return;
    }

    setSubmitting(true);
    try {
      // The backend returns a token on success, so the user is signed in
      // straight away.
      onRegistered(await register(username.trim(), password));
    } catch (err) {
      setError(
        err instanceof TypeError
          ? "Cannot reach the API. Is the backend running on port 8081?"
          : err instanceof Error
            ? err.message
            : "Registration failed",
      );
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <main className="center">
      <form className="card login" onSubmit={handleSubmit}>
        <h1>Create account</h1>
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
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            autoComplete="new-password"
            required
          />
        </label>
        <label>
          Confirm password
          <input
            type="password"
            value={confirm}
            onChange={(e) => setConfirm(e.target.value)}
            autoComplete="new-password"
            required
          />
        </label>
        {error && (
          <p className="error" role="alert">
            {error}
          </p>
        )}
        <button type="submit" disabled={submitting}>
          {submitting ? "Creating account…" : "Create account"}
        </button>
        <p className="switch">
          Already have an account?{" "}
          <button type="button" className="link" onClick={onShowLogin}>
            Sign in
          </button>
        </p>
      </form>
    </main>
  );
}
