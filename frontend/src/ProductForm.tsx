import { useState } from "react";
import type { FormEvent } from "react";
import type { ProductInput } from "./api";

interface Props {
  initial?: ProductInput;
  submitLabel: string;
  submittingLabel: string;
  error: string | null;
  submitting: boolean;
  onSubmit: (input: ProductInput) => void;
  onCancel: () => void;
}

// Shared by the Add and Edit pages. Field values are held as strings while
// typing and converted to numbers on submit.
export default function ProductForm({
  initial,
  submitLabel,
  submittingLabel,
  error,
  submitting,
  onSubmit,
  onCancel,
}: Props) {
  const [name, setName] = useState(initial?.name ?? "");
  const [description, setDescription] = useState(initial?.description ?? "");
  const [price, setPrice] = useState(initial ? String(initial.price) : "");
  const [quantity, setQuantity] = useState(
    initial ? String(initial.quantity) : "",
  );

  function handleSubmit(e: FormEvent) {
    e.preventDefault();
    onSubmit({
      name: name.trim(),
      description: description.trim(),
      price: Number(price),
      quantity: Number(quantity),
    });
  }

  return (
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
        <button type="button" className="secondary" onClick={onCancel}>
          Cancel
        </button>
        <button type="submit" disabled={submitting}>
          {submitting ? submittingLabel : submitLabel}
        </button>
      </div>
    </form>
  );
}
