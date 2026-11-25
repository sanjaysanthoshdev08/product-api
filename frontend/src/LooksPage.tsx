import { useCallback, useEffect, useState } from "react";
import {
  ApiError,
  deleteLook,
  fetchLookImage,
  fetchProducts,
  listLooks,
  uploadLook,
} from "./api";
import type { AuthResponse, Look, Product } from "./api";
import "./looks.css";

const POSES = [
  { id: "crossed", label: "Arms crossed" },
  { id: "hips", label: "Hands on hips" },
  { id: "angle", label: "Side view" },
];

interface Props {
  session: AuthResponse;
  onBack: () => void;
  onLogout: () => void;
}

// Admin page: upload a realistic picture (made in Gemini / ChatGPT) for an
// exact set of products. The fitting room shows it when a user picks the same.
export default function LooksPage({ session, onBack, onLogout }: Props) {
  const [products, setProducts] = useState<Product[]>([]);
  const [looks, setLooks] = useState<Look[]>([]);
  const [thumbs, setThumbs] = useState<Record<number, string>>({});
  const [picked, setPicked] = useState<number[]>([]);
  // One picture per pose; any slot can be left empty
  const [files, setFiles] = useState<Record<string, File | null>>({});
  const [previews, setPreviews] = useState<Record<string, string>>({});
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState<{ ok: boolean; text: string } | null>(null);

  const fail = useCallback(
    (err: unknown) => {
      if (err instanceof ApiError && err.status === 401) {
        onLogout();
        return;
      }
      setMessage({
        ok: false,
        text:
          err instanceof ApiError
            ? err.message
            : "Could not reach the server. Is the backend running?",
      });
    },
    [onLogout],
  );

  const reload = useCallback(async () => {
    try {
      const [page, list] = await Promise.all([
        fetchProducts(session.token, 0, 100),
        listLooks(session.token),
      ]);
      setProducts(page.content);
      setLooks(list);
      const next: Record<number, string> = {};
      await Promise.all(
        list.map(async (l) => {
          try {
            next[l.id] = URL.createObjectURL(await fetchLookImage(session.token, l.id));
          } catch {
            // no thumbnail for this one
          }
        }),
      );
      setThumbs((old) => {
        Object.values(old).forEach((u) => URL.revokeObjectURL(u));
        return next;
      });
    } catch (err) {
      fail(err);
    }
  }, [session.token, fail]);

  useEffect(() => {
    reload();
  }, [reload]);

  useEffect(() => {
    const urls: Record<string, string> = {};
    Object.entries(files).forEach(([pose, f]) => {
      if (f) urls[pose] = URL.createObjectURL(f);
    });
    setPreviews(urls);
    return () => Object.values(urls).forEach((u) => URL.revokeObjectURL(u));
  }, [files]);

  const chosen = POSES.filter((p) => files[p.id]);

  function toggle(id: number) {
    setPicked((p) =>
      p.includes(id) ? p.filter((x) => x !== id) : p.length < 4 ? [...p, id] : p,
    );
  }

  async function save() {
    if (picked.length === 0 || chosen.length === 0 || busy) return;
    setBusy(true);
    setMessage(null);
    let done = 0;
    try {
      for (const p of chosen) {
        await uploadLook(session.token, picked, p.id, files[p.id] as File);
        done += 1;
      }
      setMessage({
        ok: true,
        text: `Saved ${done} picture${done === 1 ? "" : "s"}. The fitting room will now show them.`,
      });
      setPicked([]);
      setFiles({});
    } catch (err) {
      if (done > 0) {
        setMessage({ ok: false, text: `${done} saved, then: ${err instanceof ApiError ? err.message : "failed"}` });
      } else {
        fail(err);
      }
    } finally {
      setBusy(false);
      await reload();
    }
  }

  async function remove(l: Look) {
    if (!window.confirm("Delete this picture?")) return;
    try {
      await deleteLook(session.token, l.id);
      await reload();
    } catch (err) {
      fail(err);
    }
  }

  const nameOf = (id: number) => products.find((p) => p.id === id)?.name ?? `#${id}`;

  return (
    <div className="layout looks-page">
      <header className="topbar">
        <h1>Outfit looks</h1>
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

      <main className="card looks-card">
        <h2>Add a realistic picture</h2>
        <p className="looks-help">
          1. Pick the products that are worn in the pictures (1 to 4). 2. Upload one picture for each
          pose you made (JPG, PNG or WebP, up to 8 MB each). Users who put on the same products
          on the same pose will see it when they click “Make it realistic”.
        </p>

        <h3>1. Products in the picture</h3>
        <div className="looks-products">
          {products.map((p) => (
            <button
              key={p.id}
              type="button"
              className={picked.includes(p.id) ? "looks-chip on" : "looks-chip"}
              onClick={() => toggle(p.id)}
              aria-pressed={picked.includes(p.id)}
            >
              {p.name}
            </button>
          ))}
        </div>

        <h3>2. Pictures (one for each pose you have; leave the others empty)</h3>
        <div className="looks-slots">
          {POSES.map((p) => (
            <div key={p.id} className="looks-slot">
              <strong>{p.label}</strong>
              {previews[p.id] ? (
                <img className="looks-preview" src={previews[p.id]} alt={`${p.label} preview`} />
              ) : (
                <div className="looks-empty">No picture</div>
              )}
              <input
                type="file"
                accept="image/jpeg,image/png,image/webp"
                aria-label={`Picture for ${p.label}`}
                onChange={(e) => {
                  const picked = e.target.files?.[0] ?? null;
                  setFiles((old) => ({ ...old, [p.id]: picked }));
                }}
              />
              {files[p.id] && (
                <button
                  type="button"
                  className="secondary"
                  onClick={() => setFiles((old) => ({ ...old, [p.id]: null }))}
                >
                  Remove
                </button>
              )}
            </div>
          ))}
        </div>

        <div className="looks-actions">
          <button onClick={save} disabled={busy || picked.length === 0 || chosen.length === 0}>
            {busy ? "Saving…" : chosen.length > 1 ? `Save ${chosen.length} pictures` : "Save picture"}
          </button>
          {message && (
            <span className={message.ok ? "looks-ok" : "looks-err"} role="status">
              {message.text}
            </span>
          )}
        </div>
      </main>

      <section className="card looks-card">
        <h2>Saved pictures</h2>
        {looks.length === 0 ? (
          <p className="state">No pictures yet.</p>
        ) : (
          <ul className="looks-list">
            {looks.map((l) => (
              <li key={l.id}>
                {thumbs[l.id] ? <img src={thumbs[l.id]} alt="" /> : <div className="looks-nothumb" />}
                <div>
                  <strong>{l.productIds.map(nameOf).join(" + ")}</strong>
                  <span>{POSES.find((p) => p.id === l.pose)?.label ?? l.pose}</span>
                  <button className="secondary" onClick={() => remove(l)}>
                    Delete
                  </button>
                </div>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}
