import { useEffect, useState } from "react";
import { ApiError, deleteProduct, fetchProducts } from "./api";
import type { AuthResponse, ProductPage } from "./api";

const PAGE_SIZE = 10;

interface Props {
  session: AuthResponse;
  page: number; // kept by App so Back from details returns to the same page
  onPageChange: (page: number) => void;
  onSelectProduct: (id: number) => void;
  onAddProduct: () => void; // shown to ADMIN users only
  onEditProduct: (id: number) => void; // ADMIN only
  onLogout: () => void;
  onHome: () => void;
  onAllProducts: () => void;
}

export default function ProductsPage({
  session,
  page,
  onPageChange,
  onSelectProduct,
  onAddProduct,
  onEditProduct,
  onLogout,
  onHome,
  onAllProducts,
}: Props) {
  const isAdmin = session.role === "ADMIN";
  const [deleteError, setDeleteError] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<number | null>(null);
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

  async function handleDelete(id: number, name: string) {
    if (!window.confirm(`Delete "${name}"? This cannot be undone.`)) return;
    setDeleteError(null);
    setDeletingId(id);
    try {
      await deleteProduct(session.token, id);
      // If that was the last row on this page, step back one page.
      if (products.length === 1 && page > 0) {
        onPageChange(page - 1);
      } else {
        setReloadKey((k) => k + 1);
      }
    } catch (err) {
      if (err instanceof ApiError && err.status === 401) {
        onLogout();
        return;
      }
      setDeleteError(
        err instanceof TypeError
          ? "Cannot reach the API. Is the backend running on port 8081?"
          : err instanceof Error
            ? err.message
            : "Failed to delete product",
      );
    } finally {
      setDeletingId(null);
    }
  }

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
          <h1>Products</h1>
        </div>
        <nav className="page-nav">
          <button type="button" className="nav-link" onClick={onHome}>
            Home
          </button>
          <button
            type="button"
            className="nav-link active"
            aria-current="page"
          >
            Products
          </button>
          <button type="button" className="nav-link" onClick={onAllProducts}>
            All Products
          </button>
        </nav>
        <div className="user">
          <span>
            {session.username} <small>({session.role})</small>
          </span>
          {isAdmin && (
            <button onClick={onAddProduct}>Add product</button>
          )}
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
            {deleteError && (
              <p className="error" role="alert">
                {deleteError}
              </p>
            )}
            <table className={loading ? "dim" : undefined}>
              <thead>
                <tr>
                  <th>Name</th>
                  <th>Description</th>
                  <th className="num">Price</th>
                  <th className="num">Quantity</th>
                  {isAdmin && <th className="num">Actions</th>}
                </tr>
              </thead>
              <tbody>
                {products.map((p) => (
                  <tr key={p.id}>
                    <td data-label="Name">
                      <button
                        type="button"
                        className="link"
                        onClick={() => onSelectProduct(p.id)}
                      >
                        {p.name}
                      </button>
                    </td>
                    <td data-label="Description">{p.description ?? "—"}</td>
                    <td className="num" data-label="Price">
                      {Number(p.price).toFixed(2)}
                    </td>
                    <td className="num" data-label="Quantity">
                      {p.quantity}
                    </td>
                    {isAdmin && (
                      <td className="num cell-actions">
                        <button
                          className="secondary small"
                          onClick={() => onEditProduct(p.id)}
                        >
                          Edit
                        </button>{" "}
                        <button
                          className="secondary small danger"
                          disabled={deletingId === p.id}
                          onClick={() => handleDelete(p.id, p.name)}
                        >
                          {deletingId === p.id ? "Deleting…" : "Delete"}
                        </button>
                      </td>
                    )}
                  </tr>
                ))}
              </tbody>
            </table>

            <nav className="pager" aria-label="Pagination">
              <button
                className="secondary"
                disabled={loading || data?.first}
                onClick={() => onPageChange(Math.max(0, page - 1))}
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
                onClick={() => onPageChange(page + 1)}
              >
                Next
              </button>
            </nav>
          </>
        )}
      </main>
    </div>
    </div>
  );
}
