import { useState } from "react";
import { ApiError, createProduct } from "./api";
import type { AuthResponse, ProductInput } from "./api";
import ProductForm from "./ProductForm";

interface Props {
  session: AuthResponse;
  onDone: () => void; // called after a successful create, or on Cancel
  onLogout: () => void;
}

export default function AddProductPage({ session, onDone, onLogout }: Props) {
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit(input: ProductInput) {
    setError(null);
    setSubmitting(true);
    try {
      await createProduct(session.token, input);
      onDone();
    } catch (err) {
      if (err instanceof ApiError && err.status === 401) {
        onLogout();
        return;
      }
      setError(
        err instanceof TypeError
          ? "Cannot reach the API. Is the backend running on port 8081?"
          : err instanceof Error
            ? err.message
            : "Failed to add product",
      );
      setSubmitting(false);
    }
  }

  return (
    <div className="layout">
      <header className="topbar">
        <h1>Add product</h1>
        <div className="user">
          <span>
            {session.username} <small>({session.role})</small>
          </span>
          <button className="secondary" onClick={onLogout}>
            Log out
          </button>
        </div>
      </header>

      <ProductForm
        submitLabel="Add product"
        submittingLabel="Saving…"
        error={error}
        submitting={submitting}
        onSubmit={handleSubmit}
        onCancel={onDone}
      />
    </div>
  );
}
