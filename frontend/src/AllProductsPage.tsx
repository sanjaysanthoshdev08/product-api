import { useEffect, useMemo, useState } from "react";
import { ApiError, fetchProducts } from "./api";
import type { AuthResponse, Product } from "./api";
import { CATEGORY_TABS, colorHex, money, splitList } from "./fashion";
import type { CategoryKey } from "./fashion";
import NavMenu from "./NavMenu";
import ProductArt from "./ProductArt";

const FETCH_SIZE = 100;

interface Props {
  session: AuthResponse;
  bagCount: number;
  onSelectProduct: (id: number) => void;
  onLogout: () => void;
  onHome: () => void;
  onProducts: () => void;
}

export default function AllProductsPage({
  session,
  bagCount,
  onSelectProduct,
  onLogout,
  onHome,
  onProducts,
}: Props) {
  const [products, setProducts] = useState<Product[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [reloadKey, setReloadKey] = useState(0);
  const [query, setQuery] = useState("");
  const [category, setCategory] = useState<CategoryKey>("ALL");

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

  const counts = useMemo(() => {
    const c: Record<CategoryKey, number> = { ALL: 0, MEN: 0, WOMEN: 0, KIDS: 0 };
    for (const p of products ?? []) {
      c.ALL += 1;
      if (p.category === "MEN" || p.category === "WOMEN" || p.category === "KIDS") {
        c[p.category] += 1;
      }
    }
    return c;
  }, [products]);

  const visible = useMemo(() => {
    const q = query.trim().toLowerCase();
    return (products ?? []).filter((p) => {
      if (category !== "ALL" && p.category !== category) return false;
      if (!q) return true;
      return (
        p.name.toLowerCase().includes(q) ||
        (p.description ?? "").toLowerCase().includes(q)
      );
    });
  }, [products, query, category]);

  return (
    <div className="page-products shop">
      <div className="layout">
        <header className="topbar">
          <NavMenu
            brandClassName="title"
            brand={
              <>
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
                <h1>Shop</h1>
              </>
            }
            navClassName="page-nav"
            extraClassName="user"
            extra={
              <>
                <span className="bag-pill" aria-label={`Bag, ${bagCount} items`}>
                  Bag ({bagCount})
                </span>
                <span>
                  {session.username} <small>({session.role})</small>
                </span>
                <button className="secondary" onClick={onLogout}>
                  Log out
                </button>
              </>
            }
          >
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
        </header>

        <main className="shop-main">
          <div className="shop-tabs" role="tablist" aria-label="Category">
            {CATEGORY_TABS.map((t) => (
              <button
                key={t.key}
                type="button"
                role="tab"
                aria-selected={category === t.key}
                className={
                  category === t.key ? "shop-btn tab active" : "shop-btn tab"
                }
                onClick={() => setCategory(t.key)}
              >
                {t.label}
                {products && <span className="tab-count">{counts[t.key]}</span>}
              </button>
            ))}
          </div>

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
                  placeholder="Search clothes…"
                  aria-label="Search products"
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                />
                <span className="all-count">
                  {visible.length} item{visible.length === 1 ? "" : "s"}
                </span>
              </div>
              {visible.length === 0 ? (
                <p className="state">Nothing found.</p>
              ) : (
                <ul className="product-grid">
                  {visible.map((p) => {
                    const colors = splitList(p.colors);
                    const out = p.quantity <= 0;
                    return (
                      <li key={p.id}>
                        <button
                          type="button"
                          className="product-card"
                          onClick={() => onSelectProduct(p.id)}
                        >
                          <span className="product-card-art">
                            <ProductArt
                              imageKey={p.imageKey}
                              color={colors[0]}
                            />
                            {out && <span className="sold-out">Sold out</span>}
                          </span>
                          <span className="product-card-name">{p.name}</span>
                          <span className="product-card-foot">
                            <strong>{money(p.price)}</strong>
                            <span className="dots" aria-hidden="true">
                              {colors.map((c) => (
                                <i key={c} style={{ background: colorHex(c) }} />
                              ))}
                            </span>
                          </span>
                        </button>
                      </li>
                    );
                  })}
                </ul>
              )}
            </>
          )}
        </main>
      </div>
    </div>
  );
}
