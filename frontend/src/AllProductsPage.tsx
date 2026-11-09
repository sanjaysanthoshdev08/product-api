import { useEffect, useMemo, useState } from "react";
import { ApiError, fetchProducts } from "./api";
import NavMenu from "./NavMenu";
import type { AuthResponse, Product } from "./api";

const FETCH_SIZE = 100;

interface Props {
  session: AuthResponse;
  onSelectProduct: (id: number) => void;
  onLogout: () => void;
  onHome: () => void;
  onProducts: () => void;
}

export default function AllProductsPage({
  session,
  onSelectProduct,
  onLogout,
  onHome,
  onProducts,
}: Props) {
  const [products, setProducts] = useState<Product[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [reloadKey, setReloadKey] = useState(0);
  const [query, setQuery] = useState("");

  useEffect(() => {
    const controller = new AbortController();
    setError(null);
    setProducts(null);

    // The API is paginated, so collect every page.
    (async () => {
      const all: Product[] = [];
      let page = 0;
      for (;;) {
        const result = await fetchProducts(
          session.token,
          page,
          FETCH_SIZE,
          controller.signal,
        );
        all.push(...result.content);
        if (result.last || result.content.length === 0) break;
        page += 1;
      }
      setProducts(all);
    })().catch((err: unknown) => {
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
            : "Failed to load products",
      );
    });

    return () => controller.abort();
  }, [session.token, reloadKey, onLogout]);

  const visible = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!products) return [];
    if (!q) return products;
    return products.filter(
      (p) =>
        p.name.toLowerCase().includes(q) ||
        (p.description ?? "").toLowerCase().includes(q),
    );
  }, [products, query]);

  return (
    <div className="page-products">
      <div className="layout">
        <header className="topbar">
          <div className="title">
            <button
              type="button"
              className="icon-btn"
              onClick={onHome}
              aria-label="Home"
              title="Home"
            >
              <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                <path d="M3 11l9-8 9 8" />
                <path d="M5 10v10h5v-6h4v6h5V10" />
              </svg>
            </button>
            <h1>All Products</h1>
          </div>
          <NavMenu className="page-nav">
            <button type="button" className="nav-link" onClick={onHome}>
              Home
            </button>
            <button type="button" className="nav-link" onClick={onProducts}>
              Products
            </button>
            <button
              type="button"
              className="nav-link active"
              aria-current="page"
            >
              All Products
            </button>
          </NavMenu>
          <div className="user">
            <span>
              {session.username} <small>({session.role})</small>
            </span>
            <button className="secondary" onClick={onLogout}>
              Log out
            </button>
          </div>
        </header>

        <main className="card">
          {error ? (
            <div className="state error" role="alert">
              <p>{error}</p>
              <button onClick={() => setReloadKey((k) => k + 1)}>Retry</button>
            </div>
          ) : products === null ? (
            <p className="state">Loading products…</p>
          ) : (
            <>
              <div className="all-toolbar">
                <input
                  type="search"
                  placeholder="Search products…"
                  aria-label="Search products"
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                />
                <span className="all-count">
                  {visible.length} of {products.length} product
                  {products.length === 1 ? "" : "s"}
                </span>
              </div>
              {visible.length === 0 ? (
                <p className="state">No products found.</p>
              ) : (
                <ul className="product-grid">
                  {visible.map((p) => (
                    <li key={p.id}>
                      <button
                        type="button"
                        className="product-card"
                        onClick={() => onSelectProduct(p.id)}
                      >
                        <span className="product-card-name">{p.name}</span>
                        <span className="product-card-desc">
                          {p.description ?? "No description"}
                        </span>
                        <span className="product-card-foot">
                          <strong>{Number(p.price).toFixed(2)}</strong>
                          <span
                            className={
                              p.quantity > 0 ? "stock in" : "stock out"
                            }
                          >
                            {p.quantity > 0
                              ? `${p.quantity} in stock`
                              : "Out of stock"}
                          </span>
                        </span>
                      </button>
                    </li>
                  ))}
                </ul>
              )}
            </>
          )}
        </main>
      </div>
    </div>
  );
}
