import { useEffect, useState } from "react";
import { ApiError, fetchProducts } from "./api";
import type { AuthResponse, Product } from "./api";
import { colorHex, imageList, money, splitList } from "./fashion";
import NavMenu from "./NavMenu";
import { OUTFIT_SLOTS, slotKind } from "./outfit";
import ProductArt from "./ProductArt";
import "./outfit.css";

interface Props {
  session: AuthResponse;
  outfitIds: number[];
  onRemove: (id: number) => void;
  onClear: () => void;
  onHome: () => void;
  onProducts: () => void;
  onAllProducts: () => void;
  onFitting: () => void;
  onSelectProduct: (id: number) => void;
  onTryOutfit: (ids: number[]) => void;
  onLogout: () => void;
}

// A wire hanger drawn in SVG (hook, neck and the two sloping arms).
function Hanger() {
  return (
    <svg className="outfit-hanger" viewBox="0 0 120 56" aria-hidden="true">
      <path
        d="M60 4c-6 0-10 4-10 9 0 4 3 6 6 8l4 3"
        fill="none"
        stroke="#2a2a2e"
        strokeWidth="2.4"
        strokeLinecap="round"
      />
      <path
        d="M60 24L8 50h104L60 24z"
        fill="none"
        stroke="#2a2a2e"
        strokeWidth="2.4"
        strokeLinejoin="round"
      />
    </svg>
  );
}

export default function OutfitPage({
  session,
  outfitIds,
  onRemove,
  onClear,
  onHome,
  onProducts,
  onAllProducts,
  onFitting,
  onSelectProduct,
  onTryOutfit,
  onLogout,
}: Props) {
  const [all, setAll] = useState<Product[] | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const controller = new AbortController();
    fetchProducts(session.token, 0, 100, controller.signal)
      .then((page) => setAll(page.content))
      .catch((err: unknown) => {
        if (controller.signal.aborted) return;
        if (err instanceof ApiError && err.status === 401) {
          onLogout();
          return;
        }
        setError("Could not load your outfit. Is the backend running?");
      });
    return () => controller.abort();
  }, [session.token, onLogout]);

  // Keep the order the user picked them in; skip products that no longer exist.
  const picked = outfitIds
    .map((id) => all?.find((p) => p.id === id))
    .filter((p): p is Product => Boolean(p));
  // Needs at least one top (shirt, T-shirt, jacket...) and one bottom (trousers...)
  const hasTop = picked.some((p) => slotKind(p.imageKey) === "top");
  const hasBottom = picked.some((p) => slotKind(p.imageKey) === "bottom");
  const canTry = hasTop && hasBottom;
  const total = picked.reduce((sum, p) => sum + Number(p.price), 0);
  const month = new Date()
    .toLocaleDateString("en-US", { month: "long", year: "numeric" })
    .toUpperCase();

  return (
    <div className="outfit-page">
      <div className="outfit-top">
        <NavMenu
          brand="My Outfit"
          brandClassName="brand"
          navClassName="page-nav"
          extraClassName="user"
          extra={
            <>
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
          <button type="button" className="nav-link" onClick={onAllProducts}>
            All Products
          </button>
          <button type="button" className="nav-link" onClick={onFitting}>
            Fitting Room
          </button>
          <button type="button" className="nav-link active" aria-current="page">
            My Outfit
          </button>
        </NavMenu>
      </div>

      <main className="outfit-poster" aria-label="My selected outfit">
        <div className="outfit-corners">
          <span>
            MY
            <br />
            SELECTION
          </span>
          <span className="right">{month}</span>
        </div>

        <h1 className="outfit-title">MY OUTFIT</h1>
        <p className="outfit-sub">
          {picked.length === 0
            ? "Nothing hanging yet. Pick pieces from the shop and they appear here."
            : "Your chosen pieces, hung together and ready to wear."}
        </p>

        {error ? (
          <p className="state error" role="alert">
            {error}
          </p>
        ) : (
          <div className="outfit-rail">
            <div className="outfit-bar" />
            {Array.from({ length: OUTFIT_SLOTS }).map((_, i) => {
              const p = picked[i];
              const photo = p ? imageList(p.imageUrl)[0] : undefined;
              return (
                <div className={p ? "outfit-slot filled" : "outfit-slot"} key={i}>
                  <Hanger />
                  {p ? (
                    <>
                      <button
                        type="button"
                        className="outfit-piece"
                        onClick={() => onSelectProduct(p.id)}
                        aria-label={`Open ${p.name}`}
                      >
                        {photo ? (
                          <img src={photo} alt={p.name} />
                        ) : (
                          <ProductArt
                            imageKey={p.imageKey}
                            color={splitList(p.colors)[0]}
                          />
                        )}
                      </button>
                      <span className="outfit-name">{p.name}</span>
                      <span className="outfit-meta">
                        {money(p.price)}
                        <i
                          style={{ background: colorHex(splitList(p.colors)[0] ?? "") }}
                        />
                      </span>
                      <button
                        type="button"
                        className="outfit-remove"
                        onClick={() => onRemove(p.id)}
                        aria-label={`Remove ${p.name}`}
                      >
                        Remove
                      </button>
                    </>
                  ) : (
                    <span className="outfit-empty">Empty</span>
                  )}
                </div>
              );
            })}
          </div>
        )}

        <div className="outfit-shadow" aria-hidden="true" />

        <div className="outfit-foot">
          <span className="outfit-foot-l">
            NEVER
            <br />
            BASIC
          </span>
          <p>
            {picked.length > 0
              ? `${picked.length} of ${OUTFIT_SLOTS} pieces · Total ${money(total)}`
              : "Designed for those who never follow the crowd."}
          </p>
          <button type="button" className="outfit-shop" onClick={onAllProducts}>
            SHOP
            <br />
            NOW
          </button>
        </div>
        <div className="outfit-actions">
          <button
            type="button"
            className="outfit-try"
            disabled={!canTry}
            onClick={() => onTryOutfit(picked.map((p) => p.id))}
          >
            Try this outfit on the mannequin
          </button>
          {!canTry && (
            <p className="outfit-hint">
              Pick at least one top (shirt, T-shirt, jacket) and one bottom
              (trousers) to try them on.
            </p>
          )}
        </div>
        {picked.length > 0 && (
          <button type="button" className="outfit-clear" onClick={onClear}>
            Clear outfit
          </button>
        )}
      </main>
    </div>
  );
}
