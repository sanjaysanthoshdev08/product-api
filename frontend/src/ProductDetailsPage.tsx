import { useEffect, useState } from "react";
import { ApiError, fetchProduct } from "./api";
import type { AuthResponse, Product } from "./api";
import {
  categoryLabel,
  colorHex,
  money,
  productRef,
  splitList,
} from "./fashion";
import ProductArt from "./ProductArt";

interface Props {
  session: AuthResponse;
  productId: number;
  bagCount: number;
  onAddToBag: () => void;
  onBack: () => void;
  onLogout: () => void;
}

export default function ProductDetailsPage({
  session,
  productId,
  bagCount,
  onAddToBag,
  onBack,
  onLogout,
}: Props) {
  const [product, setProduct] = useState<Product | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [reloadKey, setReloadKey] = useState(0);
  const [color, setColor] = useState<string | null>(null);
  const [size, setSize] = useState<string | null>(null);
  const [added, setAdded] = useState(false);

  useEffect(() => {
    const controller = new AbortController();
    setLoading(true);
    setError(null);

    fetchProduct(session.token, productId, controller.signal)
      .then((result) => {
        setProduct(result);
        setColor(splitList(result.colors)[0] ?? null);
        setSize(null);
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

  const colors = splitList(product?.colors);
  const sizes = splitList(product?.sizes);
  const soldOut = (product?.quantity ?? 0) <= 0;
  const needsSize = sizes.length > 0 && size === null;

  function handleAdd() {
    if (needsSize || soldOut) return;
    onAddToBag();
    setAdded(true);
    window.setTimeout(() => setAdded(false), 1800);
  }

  return (
    <div className="shop shop-detail">
      <div className="layout">
        <header className="topbar">
          <h1>Product details</h1>
          <div className="user">
            <span className="bag-pill">Bag ({bagCount})</span>
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

        {loading ? (
          <main className="card">
            <p className="state">Loading product…</p>
          </main>
        ) : error ? (
          <main className="card">
            <div className="state error" role="alert">
              <p>{error}</p>
              <button onClick={() => setReloadKey((k) => k + 1)}>Retry</button>
            </div>
          </main>
        ) : product ? (
          <main className="detail-grid">
            <section className="detail-art">
              <ProductArt imageKey={product.imageKey} color={color ?? undefined} />
            </section>

            <section className="detail-panel">
              {product.category && (
                <p className="detail-cat">{categoryLabel(product.category)}</p>
              )}
              <h2>{product.name}</h2>
              <p className="detail-price">
                <strong>{money(product.price)}</strong>
                <span className="detail-ref">{productRef(product)}</span>
              </p>
              {product.description && (
                <p className="detail-desc">{product.description}</p>
              )}

              {colors.length > 0 && (
                <div className="detail-group">
                  <h3>
                    Color{color ? <span className="picked"> · {color}</span> : null}
                  </h3>
                  <div className="swatches">
                    {colors.map((c) => (
                      <button
                        key={c}
                        type="button"
                        className={
                          color === c ? "shop-btn swatch active" : "shop-btn swatch"
                        }
                        onClick={() => setColor(c)}
                        aria-label={c}
                        aria-pressed={color === c}
                        title={c}
                      >
                        <i style={{ background: colorHex(c) }} />
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {sizes.length > 0 && (
                <div className="detail-group">
                  <h3>Size</h3>
                  <div className="chips">
                    {sizes.map((s) => (
                      <button
                        key={s}
                        type="button"
                        className={size === s ? "shop-btn chip active" : "shop-btn chip"}
                        onClick={() => setSize(s)}
                        aria-pressed={size === s}
                      >
                        {s}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              <p className={soldOut ? "stock out" : "stock in"}>
                {soldOut ? "Sold out" : `${product.quantity} in stock`}
              </p>

              <button
                type="button"
                className="shop-btn btn-yellow"
                onClick={handleAdd}
                disabled={soldOut}
              >
                {added ? "Added to bag ✓" : `Add to bag (${bagCount})`}
              </button>
              {needsSize && !soldOut && (
                <p className="detail-hint">Choose a size to add this to your bag.</p>
              )}
            </section>
          </main>
        ) : null}
      </div>
    </div>
  );
}
