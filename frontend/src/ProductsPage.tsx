import { useEffect, useState } from "react";
import { ApiError, fetchProducts } from "./api";
import type { AuthResponse, ProductPage } from "./api";

const PAGE_SIZE = 10;

interface Props {
  session: AuthResponse;
  onLogout: () => void;
}

export default function ProductsPage({ session, onLogout }: Props) {
  const [page, setPage] = useState(0);
  const [data, setData] = useState<ProductPage | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [reloadKey, setReloadKey] = useState(0);

  useEffect(() => {
    const controller = new AbortController();
    setLoading(true);
    setError(null);

    fetchProducts(session.token, page, PAGE_SIZE, controller.signal)
      .then((result) => {
        setData(result);
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
              : "Failed to load products",
        );
        setLoading(false);
      });

    return () => controller.abort();
  }, [session.token, page, reloadKey, onLogout]);

  const products = data?.content ?? [];

  return (
    <div className="layout">
      <header className="topbar">
        <h1>Products</h1>
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
        ) : loading && !data ? (
          <p className="state">Loading products…</p>
        ) : products.length === 0 ? (
          <p className="state">No products found.</p>
        ) : (
          <>
            <table className={loading ? "dim" : undefined}>
              <thead>
                <tr>
                  <th>Name</th>
                  <th>Description</th>
                  <th className="num">Price</th>
                  <th className="num">Quantity</th>
                </tr>
              </thead>
              <tbody>
                {products.map((p) => (
                  <tr key={p.id}>
                    <td>{p.name}</td>
                    <td>{p.description ?? "—"}</td>
                    <td className="num">{Number(p.price).toFixed(2)}</td>
                    <td className="num">{p.quantity}</td>
                  </tr>
                ))}
              </tbody>
            </table>

            <nav className="pager" aria-label="Pagination">
              <button
                className="secondary"
                disabled={loading || data?.first}
                onClick={() => setPage((p) => Math.max(0, p - 1))}
              >
                Previous
              </button>
              <span>
                Page {(data?.number ?? 0) + 1} of {Math.max(1, data?.totalPages ?? 1)}
                {" · "}
                {data?.totalElements ?? 0} total
              </span>
              <button
                className="secondary"
                disabled={loading || data?.last}
                onClick={() => setPage((p) => p + 1)}
              >
                Next
              </button>
            </nav>
          </>
        )}
      </main>
    </div>
  );
}
