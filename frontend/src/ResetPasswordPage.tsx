import { useState } from "react";
import type { FormEvent } from "react";
import { resetPassword } from "./api";

interface Props {
  token: string;
  onShowLogin: () => void;
  onRequestNew: () => void;
}

export default function ResetPasswordPage({
  token,
  onShowLogin,
  onRequestNew,
}: Props) {
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);

    if (password.length < 8) {
      setError("Password must be at least 8 characters.");
      return;
    }
    if (password !== confirm) {
      setError("Passwords do not match.");
      return;
    }

    setSubmitting(true);
    try {
      setMessage(await resetPassword(token, password));
    } catch (err) {
      setError(
        err instanceof TypeError
          ? "Cannot reach the API. Is the backend running on port 8081?"
          : err instanceof Error
            ? err.message
            : "Could not reset password",
      );
    } finally {
      setSubmitting(false);
    }
  }

  if (message) {
    return (
      <main className="center page-login">
        <div className="card login">
          <h1>Password updated</h1>
          <p className="success" role="status">
            {message}
          </p>
          <button type="button" className="btn-black" onClick={onShowLogin}>
            Sign in
          </button>
        </div>
      </main>
    );
  }

  return (
    <main className="center page-login">
      <form className="card login" onSubmit={handleSubmit}>
        <h1>Reset password</h1>
        <p className="hint">Choose a new password for your account.</p>
        <label>
          New password
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            autoComplete="new-password"
            autoFocus
            required
          />
        </label>
        <label>
          Confirm new password
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
            {error}{" "}
            <button type="button" className="link" onClick={onRequestNew}>
              Request a new link
            </button>
          </p>
        )}
        <button type="submit" className="btn-black" disabled={submitting}>
          {submitting ? "Saving…" : "Reset password"}
        </button>
        <p className="switch">
          <button type="button" className="link" onClick={onShowLogin}>
            Back to sign in
          </button>
        </p>
      </form>
    </main>
  );
}
