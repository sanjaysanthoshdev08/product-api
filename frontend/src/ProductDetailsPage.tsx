import { useEffect, useState } from "react";
import { ApiError, fetchProduct } from "./api";
import type { AuthResponse, Product } from "./api";

interface Props {
  session: AuthResponse;
  productId: number;
  onBack: () => void;
  onLogout: () => void;
}

export default function ProductDetailsPage({
  session,
  productId,
  onBack,
  onLogout,
}: Props) {
  const [product, setProduct] = useState<Product | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [reloadKey, setReloadKey] = useState(0);

  useEffect(() => {
    const controller = new AbortController();
    setLoading(true);
    setError(null);

    fetchProduct(session.token, productId, controller.signal)
      .then((result) => {
        setProduct(result);
        setLoading(false);
      })
      .catch((err: unknown) => {
        if (controller.signal.aborted) return;
        if (err instanceof ApiError && err.status === 401) {
          onLogout();
          return;
        }
        setError(
          err instanceof TypeError
            ? "Cannot reach the API. Is the backend running on port 8081?"
            : err instanceof Error
              ? err.message
              : "Failed to load product",
        );
        setLoading(false);
      });

    return () => controller.abort();
  }, [session.token, productId, reloadKey, onLogout]);

  return (
    <div className="layout">
      <header className="topbar">
        <h1>Product details</h1>
        <div className="user">
          <span>
            {session.username} <small>({session.role})</small>
          </span>
          <button className="secondary" onClick={onLogout}>
            Log out
          </button>
        </div>
      </header>

      <div>
        <button className="secondary" onClick={onBack}>
          ← Back to products
        </button>
      </div>

      <main className="card">
        {loading ? (
          <p className="state">Loading product…</p>
        ) : error ? (
          <div className="state error" role="alert">
            <p>{error}</p>
            <button onClick={() => setReloadKey((k) => k + 1)}>Retry</button>
          </div>
        ) : product ? (
          <dl className="details">
            <dt>ID</dt>
            <dd>{product.id}</dd>
            <dt>Name</dt>
            <dd>{product.name}</dd>
            <dt>Description</dt>
            <dd>{product.description ?? "—"}</dd>
            <dt>Price</dt>
            <dd>{Number(product.price).toFixed(2)}</dd>
            <dt>Quantity</dt>
            <dd>{product.quantity}</dd>
          </dl>
        ) : null}
      </main>
    </div>
  );
}
