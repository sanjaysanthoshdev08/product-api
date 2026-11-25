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
  const [pose, setPose] = useState("crossed");
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
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
    if (!file) {
      setPreview(null);
      return;
    }
    const u = URL.createObjectURL(file);
    setPreview(u);
    return () => URL.revokeObjectURL(u);
  }, [file]);

  function toggle(id: number) {
    setPicked((p) =>
      p.includes(id) ? p.filter((x) => x !== id) : p.length < 4 ? [...p, id] : p,
    );
  }

  async function save() {
    if (picked.length === 0 || !file || busy) return;
    setBusy(true);
    setMessage(null);
    try {
      await uploadLook(session.token, picked, pose, file);
      setMessage({ ok: true, text: "Saved. The fitting room will now show this picture." });
      setPicked([]);
      setFile(null);
      await reload();
    } catch (err) {
      fail(err);
    } finally {
      setBusy(false);
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
          1. Pick the products that are worn in the picture (1 to 4). 2. Choose the pose of the
          mannequin. 3. Upload the picture (JPG, PNG or WebP, up to 8 MB). Users who put on the
          same products on the same pose will see it when they click “Make it realistic”.
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

        <h3>2. Mannequin pose</h3>
        <div className="looks-poses">
          {POSES.map((p) => (
            <button
              key={p.id}
              type="button"
              className={pose === p.id ? "looks-chip on" : "looks-chip"}
              onClick={() => setPose(p.id)}
              aria-pressed={pose === p.id}
            >
              {p.label}
            </button>
          ))}
        </div>

        <h3>3. Picture</h3>
        <input
          type="file"
          accept="image/jpeg,image/png,image/webp"
          onChange={(e) => setFile(e.target.files?.[0] ?? null)}
        />
        {preview && <img className="looks-preview" src={preview} alt="Preview" />}

        <div className="looks-actions">
          <button onClick={save} disabled={busy || picked.length === 0 || !file}>
            {busy ? "Saving…" : "Save picture"}
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
