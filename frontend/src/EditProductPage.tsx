import { useEffect, useState } from "react";
import { ApiError, fetchProduct, updateProduct } from "./api";
import type { AuthResponse, Product, ProductInput } from "./api";
import ProductForm from "./ProductForm";

interface Props {
  session: AuthResponse;
  productId: number;
  onDone: () => void; // called after a successful save, or on Cancel
  onLogout: () => void;
}

export default function EditProductPage({
  session,
  productId,
  onDone,
  onLogout,
}: Props) {
  const [product, setProduct] = useState<Product | null>(null);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    const controller = new AbortController();
    fetchProduct(session.token, productId, controller.signal)
      .then(setProduct)
      .catch((err: unknown) => {
        if (controller.signal.aborted) return;
        if (err instanceof ApiError && err.status === 401) {
          onLogout();
          return;
        }
        setLoadError(
          err instanceof TypeError
            ? "Cannot reach the API. Is the backend running on port 8081?"
            : err instanceof Error
              ? err.message
              : "Failed to load product",
        );
      });
    return () => controller.abort();
  }, [session.token, productId, onLogout]);

  async function handleSubmit(input: ProductInput) {
    setSaveError(null);
    setSubmitting(true);
    try {
      await updateProduct(session.token, productId, input);
      onDone();
    } catch (err) {
      if (err instanceof ApiError && err.status === 401) {
        onLogout();
        return;
      }
      setSaveError(
        err instanceof TypeError
          ? "Cannot reach the API. Is the backend running on port 8081?"
          : err instanceof Error
            ? err.message
            : "Failed to save product",
      );
      setSubmitting(false);
    }
  }

  return (
    <div className="layout">
      <header className="topbar">
        <h1>Edit product</h1>
        <div className="user">
          <span>
            {session.username} <small>({session.role})</small>
          </span>
          <button className="secondary" onClick={onLogout}>
            Log out
          </button>
        </div>
      </header>

      {loadError ? (
        <div className="card state error" role="alert">
          <p>{loadError}</p>
          <button className="secondary" onClick={onDone}>
            Back to products
          </button>
        </div>
      ) : !product ? (
        <p className="state">Loading product…</p>
      ) : (
        <ProductForm
          initial={{
            name: product.name,
            description: product.description ?? "",
            price: product.price,
            quantity: product.quantity,
          }}
          submitLabel="Save changes"
          submittingLabel="Saving…"
          error={saveError}
          submitting={submitting}
          onSubmit={handleSubmit}
          onCancel={onDone}
        />
      )}
    </div>
  );
}
