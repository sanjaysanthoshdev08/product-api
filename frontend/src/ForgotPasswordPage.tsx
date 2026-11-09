import { useState } from "react";
import type { FormEvent } from "react";
import { forgotPassword } from "./api";

interface Props {
  onShowLogin: () => void;
  onShowHome: () => void;
  onResetToken: (token: string) => void;
}

export default function ForgotPasswordPage({
  onShowLogin,
  onShowHome,
  onResetToken,
}: Props) {
  const [email, setEmail] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    setMessage(null);
    setSubmitting(true);
    try {
      const result = await forgotPassword(email.trim());
      if (result.resetToken) {
        // Local development (no SMTP): go straight to the reset page
        onResetToken(result.resetToken);
        return;
      }
      setMessage(result.message);
    } catch (err) {
      setError(
        err instanceof TypeError
          ? "Cannot reach the API. Is the backend running on port 8081?"
          : err instanceof Error
            ? err.message
            : "Request failed",
      );
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <main className="center page-login">
      <form className="card login" onSubmit={handleSubmit}>
        <h1>Forgot password</h1>
        <p className="hint">
          Enter the email address you signed up with and we will send you a
          link to reset your password.
        </p>
        <label>
          Email
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            autoComplete="email"
            autoFocus
            required
          />
        </label>
        {error && (
          <p className="error" role="alert">
            {error}
          </p>
        )}
        {message && (
          <p className="success" role="status">
            {message}
          </p>
        )}
        <button type="submit" className="btn-black" disabled={submitting}>
          {submitting ? "Sending…" : "Send reset link"}
        </button>
        <p className="switch">
          Remembered it?{" "}
          <button type="button" className="link" onClick={onShowLogin}>
            Back to sign in
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
