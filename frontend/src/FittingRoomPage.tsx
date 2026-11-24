import { useEffect, useMemo, useState } from "react";
import { ApiError, fetchProducts } from "./api";
import type { AuthResponse, Product } from "./api";
import { CATEGORY_TABS, colorHex, money, splitList } from "./fashion";
import type { CategoryKey } from "./fashion";
import NavMenu from "./NavMenu";
import ProductArt, { Garment } from "./ProductArt";

const FETCH_SIZE = 100;

// The model photo is 1240 x 1170 px; every position below is in those pixels.
const IMG_W = 1240;
const IMG_H = 1170;
const SKIN = "#c8977a";

type Slot = "top" | "bottom" | "dress" | "shoes" | "hat";

const SLOT_OF: Record<string, Slot> = {
  jacket: "top",
  tshirt: "top",
  shirt: "top",
  hoodie: "top",
  sweater: "top",
  jeans: "bottom",
  shorts: "bottom",
  skirt: "bottom",
  dress: "dress",
  sneakers: "shoes",
  boots: "shoes",
  cap: "hat",
};

const SLOT_LABEL: Record<Slot, string> = {
  top: "Top",
  bottom: "Bottom",
  dress: "Dress",
  shoes: "Shoes",
  hat: "Hat",
};

interface Worn {
  product: Product;
  color: string;
  size: string | null;
}

type Outfit = Partial<Record<Slot, Worn>>;

function slotOf(p: Product): Slot | null {
  return (p.imageKey && SLOT_OF[p.imageKey]) || null;
}

// Box (in photo pixels) the 200x200 garment art is stretched into.
// Boxes are sized so the garment's own outline lands on the matching part
// of the model.
const BOXES: Record<string, { x: number; y: number; w: number; h: number }> = {
  jacket: { x: 382, y: 150, w: 460, h: 460 },
  tshirt: { x: 392, y: 150, w: 440, h: 440 },
  shirt: { x: 382, y: 150, w: 460, h: 460 },
  hoodie: { x: 382, y: 150, w: 460, h: 460 },
  sweater: { x: 382, y: 150, w: 460, h: 460 },
  jeans: { x: 322, y: 288, w: 570, h: 895 },
  shorts: { x: 330, y: 302, w: 555, h: 545 },
  skirt: { x: 349, y: 267, w: 516, h: 555 },
  dress: { x: 322, y: 95, w: 570, h: 915 },
};

function GarmentOnModel({ worn }: { worn: Worn }) {
  const key = worn.product.imageKey ?? "";
  const box = BOXES[key];
  if (!box) return null;
  return (
    <svg
      x={box.x}
      y={box.y}
      width={box.w}
      height={box.h}
      viewBox="0 0 200 200"
      preserveAspectRatio="none"
      overflow="visible"
    >
      <Garment imageKey={key} color={worn.color} />
    </svg>
  );
}

function ShoesOnModel({ worn }: { worn: Worn }) {
  const key = worn.product.imageKey ?? "";
  const boots = key === "boots";
  // one shoe per foot; the right shoe is mirrored
  const w = boots ? 150 : 175;
  const h = boots ? 200 : 190;
  const y = boots ? 985 : 985;
  const foot = (cx: number, mirror: boolean) => (
    <svg
      x={cx - w / 2}
      y={y}
      width={w}
      height={h}
      viewBox="0 0 200 200"
      preserveAspectRatio="none"
      overflow="visible"
    >
      <g transform={mirror ? "translate(200,0) scale(-1,1)" : undefined}>
        <Garment imageKey={key} color={worn.color} />
      </g>
    </svg>
  );
  return (
    <>
      {/* hide the model's own boots */}
      <rect x="470" y="1040" width="280" height="130" fill="#fff" />
      {foot(535, false)}
      {foot(683, true)}
    </>
  );
}

export default function FittingRoomPage({
  session,
  bagCount,
  initialProductId,
  onAddToBag,
  onHome,
  onProducts,
  onAllProducts,
  onLogout,
}: {
  session: AuthResponse;
  bagCount: number;
  initialProductId: number | null;
  onAddToBag: () => void;
  onHome: () => void;
  onProducts: () => void;
  onAllProducts: () => void;
  onLogout: () => void;
}) {
  const [products, setProducts] = useState<Product[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [reloadKey, setReloadKey] = useState(0);
  const [category, setCategory] = useState<CategoryKey>("ALL");
  const [outfit, setOutfit] = useState<Outfit>({});
  const [zoom, setZoom] = useState(1);
  const [note, setNote] = useState<string | null>(null);

  useEffect(() => {
    const controller = new AbortController();
    setError(null);
    setProducts(null);

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

  // Put the product we arrived with (from "Try it on") on the model
  useEffect(() => {
    if (!products || initialProductId === null) return;
    const p = products.find((x) => x.id === initialProductId);
    if (p) wear(p);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [products, initialProductId]);

  function wear(p: Product) {
    const slot = slotOf(p);
    if (!slot) {
      setNote(`${p.name} has no fitting-room picture yet.`);
      return;
    }
    setNote(null);
    setOutfit((prev) => {
      const next: Outfit = { ...prev };
      // a dress replaces top + bottom, and top/bottom replace a dress
      if (slot === "dress") {
        delete next.top;
        delete next.bottom;
      } else if (slot === "top" || slot === "bottom") {
        delete next.dress;
      }
      const colors = splitList(p.colors);
      next[slot] = {
        product: p,
        color: colors[0] ?? "Grey",
        size: null,
      };
      return next;
    });
  }

  function toggle(p: Product) {
    const slot = slotOf(p);
    if (slot && outfit[slot]?.product.id === p.id) {
      remove(slot);
    } else {
      wear(p);
    }
  }

  function remove(slot: Slot) {
    setOutfit((prev) => {
      const next = { ...prev };
      delete next[slot];
      return next;
    });
  }

  function update(slot: Slot, patch: Partial<Worn>) {
    setOutfit((prev) => {
      const cur = prev[slot];
      return cur ? { ...prev, [slot]: { ...cur, ...patch } } : prev;
    });
  }

  const hanger = useMemo(
    () =>
      (products ?? []).filter(
        (p) =>
          slotOf(p) !== null && (category === "ALL" || p.category === category),
      ),
    [products, category],
  );

  const worn = (Object.keys(SLOT_LABEL) as Slot[])
    .map((s) => (outfit[s] ? ([s, outfit[s]] as [Slot, Worn]) : null))
    .filter((x): x is [Slot, Worn] => x !== null);

  const total = worn.reduce((sum, [, w]) => sum + Number(w.product.price), 0);
  const needsSize = worn.some(
    ([, w]) => splitList(w.product.sizes).length > 0 && w.size === null,
  );

  function addOutfit() {
    if (worn.length === 0) return;
    if (needsSize) {
      setNote("Pick a size for each item before adding the outfit to your bag.");
      return;
    }
    worn.forEach(() => onAddToBag());
    setNote(`Added ${worn.length} item${worn.length === 1 ? "" : "s"} to your bag.`);
  }

  return (
    <div className="page-products shop fitting">
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
                <h1>Fitting room</h1>
              </>
            }
            navClassName="page-nav"
            extraClassName="user"
            extra={
              <>
                <span className="bag-pill">Bag ({bagCount})</span>
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
            <button
              type="button"
              className="nav-link active"
              aria-current="page"
            >
              Fitting Room
            </button>
          </NavMenu>
        </header>

        {error ? (
          <main className="shop-main">
            <div className="state error" role="alert">
              <p>{error}</p>
              <button onClick={() => setReloadKey((k) => k + 1)}>Retry</button>
            </div>
          </main>
        ) : (
          <main className="fit-grid">
            {/* ---- the model ---- */}
            <section className="fit-stage" aria-label="Model">
              <div className="fit-zoom">
                <button
                  type="button"
                  className="shop-btn round"
                  onClick={() => setZoom((z) => Math.min(1.6, +(z + 0.2).toFixed(1)))}
                  aria-label="Zoom in"
                >
                  +
                </button>
                <button
                  type="button"
                  className="shop-btn round"
                  onClick={() => setZoom((z) => Math.max(1, +(z - 0.2).toFixed(1)))}
                  aria-label="Zoom out"
                >
                  −
                </button>
              </div>
              <div className="fit-canvas" style={{ transform: `scale(${zoom})` }}>
                <svg
                  viewBox={`0 0 ${IMG_W} ${IMG_H}`}
                  role="img"
                  aria-label="Model wearing your outfit"
                >
                  <image
                    href="/fitting-model.webp"
                    x="0"
                    y="0"
                    width={IMG_W}
                    height={IMG_H}
                  />
                  {/* Hide the model's own jacket sleeves and trousers wherever new
                      clothes are put on (the photo background is plain white) */}
                  {(outfit.top || outfit.dress) && (
                    <>
                      <rect x="425" y="185" width="112" height="385" fill="#fff" />
                      <rect x="698" y="185" width="105" height="385" fill="#fff" />
                    </>
                  )}
                  {(outfit.bottom || outfit.dress) && (
                    <rect x="448" y="395" width="324" height="680" fill="#fff" />
                  )}
                  {(outfit.dress ||
                    (outfit.bottom && outfit.bottom.product.imageKey !== "jeans")) && (
                    <path
                      d="M548 640 H603 L598 1050 H540 Z M619 640 H674 L683 1050 H625 Z"
                      fill={SKIN}
                    />
                  )}
                  {outfit.bottom && <GarmentOnModel worn={outfit.bottom} />}
                  {outfit.dress && <GarmentOnModel worn={outfit.dress} />}
                  {outfit.top && <GarmentOnModel worn={outfit.top} />}
                  {outfit.shoes && <ShoesOnModel worn={outfit.shoes} />}
                  {outfit.hat && (
                    <svg
                      x="505"
                      y="-45"
                      width="210"
                      height="240"
                      viewBox="0 0 200 200"
                      preserveAspectRatio="none"
                      overflow="visible"
                    >
                      <Garment imageKey="cap" color={outfit.hat.color} />
                    </svg>
                  )}
                </svg>
              </div>
            </section>

            {/* ---- right: wearing ---- */}
            <aside className="fit-side">
              <section className="fit-card">
                <h2>You are wearing</h2>
                {worn.length === 0 ? (
                  <p className="detail-hint">
                    Pick something from the hanger below to put it on the model.
                  </p>
                ) : (
                  <ul className="fit-list">
                    {worn.map(([slot, w]) => {
                      const colors = splitList(w.product.colors);
                      const sizes = splitList(w.product.sizes);
                      return (
                        <li key={slot} className="fit-item">
                          <div className="fit-thumb">
                            <ProductArt
                              imageKey={w.product.imageKey}
                              color={w.color}
                            />
                          </div>
                          <div className="fit-info">
                            <div className="fit-row">
                              <strong>{w.product.name}</strong>
                              <button
                                type="button"
                                className="shop-btn x-btn"
                                onClick={() => remove(slot)}
                                aria-label={`Take off ${w.product.name}`}
                              >
                                ×
                              </button>
                            </div>
                            <span className="fit-meta">
                              {SLOT_LABEL[slot]} · {money(w.product.price)}
                            </span>
                            {colors.length > 1 && (
                              <div className="swatches small">
                                {colors.map((c) => (
                                  <button
                                    key={c}
                                    type="button"
                                    className={
                                      w.color === c
                                        ? "shop-btn swatch active"
                                        : "shop-btn swatch"
                                    }
                                    onClick={() => update(slot, { color: c })}
                                    aria-label={c}
                                    aria-pressed={w.color === c}
                                    title={c}
                                  >
                                    <i style={{ background: colorHex(c) }} />
                                  </button>
                                ))}
                              </div>
                            )}
                            {sizes.length > 0 && (
                              <div className="chips small">
                                {sizes.map((s) => (
                                  <button
                                    key={s}
                                    type="button"
                                    className={
                                      w.size === s
                                        ? "shop-btn chip active"
                                        : "shop-btn chip"
                                    }
                                    onClick={() => update(slot, { size: s })}
                                    aria-pressed={w.size === s}
                                  >
                                    {s}
                                  </button>
                                ))}
                              </div>
                            )}
                          </div>
                        </li>
                      );
                    })}
                  </ul>
                )}

                {worn.length > 0 && (
                  <p className="fit-total">
                    <span>Outfit total</span>
                    <strong>{money(total)}</strong>
                  </p>
                )}
                {note && (
                  <p className="detail-hint" role="status">
                    {note}
                  </p>
                )}
                <button
                  type="button"
                  className="shop-btn btn-yellow"
                  onClick={addOutfit}
                  disabled={worn.length === 0}
                >
                  Add outfit to bag ({bagCount})
                </button>
                {worn.length > 0 && (
                  <button
                    type="button"
                    className="shop-btn ghost"
                    onClick={() => {
                      setOutfit({});
                      setNote(null);
                    }}
                  >
                    Clear outfit
                  </button>
                )}
              </section>
            </aside>

            {/* ---- bottom: on a hanger ---- */}
            <section className="fit-hanger" aria-label="On a hanger">
              <div className="fit-hanger-head">
                <h2>On a hanger</h2>
                <div className="shop-tabs">
                  {CATEGORY_TABS.map((t) => (
                    <button
                      key={t.key}
                      type="button"
                      className={
                        category === t.key ? "shop-btn tab active" : "shop-btn tab"
                      }
                      onClick={() => setCategory(t.key)}
                    >
                      {t.label}
                    </button>
                  ))}
                </div>
              </div>
              {products === null ? (
                <p className="state">Loading clothes…</p>
              ) : hanger.length === 0 ? (
                <p className="state">Nothing here yet.</p>
              ) : (
                <ul className="hanger-row">
                  {hanger.map((p) => {
                    const slot = slotOf(p);
                    const on = slot !== null && outfit[slot]?.product.id === p.id;
                    return (
                      <li key={p.id}>
                        <button
                          type="button"
                          className={on ? "shop-btn hanger-item on" : "shop-btn hanger-item"}
                          onClick={() => toggle(p)}
                          aria-pressed={on}
                          title={p.name}
                        >
                          <ProductArt
                            imageKey={p.imageKey}
                            color={splitList(p.colors)[0]}
                          />
                          <span>{p.name}</span>
                        </button>
                      </li>
                    );
                  })}
                </ul>
              )}
            </section>
          </main>
        )}
      </div>
    </div>
  );
}
