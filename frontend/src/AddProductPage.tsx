import { useState } from "react";
import type { FormEvent } from "react";
import { ApiError, createProduct } from "./api";
import type { AuthResponse } from "./api";

interface Props {
  session: AuthResponse;
  onDone: () => void; // called after a successful create, or on Cancel
  onLogout: () => void;
}

export default function AddProductPage({ session, onDone, onLogout }: Props) {
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [price, setPrice] = useState("");
  const [quantity, setQuantity] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    setSubmitting(true);
    try {
      await createProduct(session.token, {
        name: name.trim(),
        description: description.trim(),
        price: Number(price),
        quantity: Number(quantity),
      });
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

      <form className="card form" onSubmit={handleSubmit}>
        <label>
          Name
          <input
            value={name}
            onChange={(e) => setName(e.target.value)}
            required
            autoFocus
          />
        </label>
        <label>
          Description (optional)
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            rows={3}
          />
        </label>
        <label>
          Price
          <input
            type="number"
            value={price}
            onChange={(e) => setPrice(e.target.value)}
            min="0.01"
            step="0.01"
            required
          />
        </label>
        <label>
          Quantity
          <input
            type="number"
            value={quantity}
            onChange={(e) => setQuantity(e.target.value)}
            min="0"
            step="1"
            required
          />
        </label>
        {error && (
          <p className="error" role="alert">
            {error}
          </p>
        )}
        <div className="actions">
          <button type="button" className="secondary" onClick={onDone}>
            Cancel
          </button>
          <button type="submit" disabled={submitting}>
            {submitting ? "Saving…" : "Add product"}
          </button>
        </div>
      </form>
    </div>
  );
}
