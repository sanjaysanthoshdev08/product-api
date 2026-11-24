import { useState } from "react";
import type { FormEvent } from "react";
import type { ProductInput } from "./api";
import { IMAGE_KEYS } from "./ProductArt";

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
  const [category, setCategory] = useState(initial?.category ?? "");
  const [colors, setColors] = useState(initial?.colors ?? "");
  const [sizes, setSizes] = useState(initial?.sizes ?? "");
  const [imageKey, setImageKey] = useState(initial?.imageKey ?? "");

  function handleSubmit(e: FormEvent) {
    e.preventDefault();
    onSubmit({
      name: name.trim(),
      description: description.trim(),
      price: Number(price),
      quantity: Number(quantity),
      category,
      colors: colors.trim(),
      sizes: sizes.trim(),
      imageKey,
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
      <label>
        Category (optional)
        <select value={category} onChange={(e) => setCategory(e.target.value)}>
          <option value="">None</option>
          <option value="MEN">Men</option>
          <option value="WOMEN">Ladies</option>
          <option value="KIDS">Kids</option>
        </select>
      </label>
      <label>
        Colors (optional, comma separated)
        <input
          value={colors}
          onChange={(e) => setColors(e.target.value)}
          placeholder="Brown, Black"
        />
      </label>
      <label>
        Sizes (optional, comma separated)
        <input
          value={sizes}
          onChange={(e) => setSizes(e.target.value)}
          placeholder="XS, S, M, L, XL"
        />
      </label>
      <label>
        Picture (optional)
        <select value={imageKey} onChange={(e) => setImageKey(e.target.value)}>
          <option value="">Default</option>
          {IMAGE_KEYS.map((k) => (
            <option key={k} value={k}>
              {k}
            </option>
          ))}
        </select>
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
