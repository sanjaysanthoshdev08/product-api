import { useEffect, useMemo, useRef, useState } from "react";
import type { PointerEvent as ReactPointerEvent } from "react";
import { ApiError, fetchProducts } from "./api";
import type { AuthResponse, Product } from "./api";
import { CATEGORY_TABS, colorHex, money, productRef, splitList } from "./fashion";
import type { CategoryKey } from "./fashion";
import ProductArt, { Garment } from "./ProductArt";

const FETCH_SIZE = 100;
const PARAMS_KEY = "product-api-fitting-params";

// The model photo is 1240 x 1170 px; every position below is in those pixels.
const IMG_W = 1240;
const IMG_H = 1170;
// Crop the photo's empty margins so the model fills the stage.
const VIEW = { x: 340, y: -30, w: 560, h: 1200 };
const SKIN = "#c8977a";
// Same grey as the stage, so the photo's white background disappears
// (the photo is blended with `multiply`) and cover-up patches match it.
const STAGE_GREY = "#e6e6e8";

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

const SLOT_ORDER: Slot[] = ["top", "dress", "bottom", "shoes", "hat"];

interface Worn {
  product: Product;
  color: string;
  size: string | null;
}

type Outfit = Partial<Record<Slot, Worn>>;

function slotOf(p: Product): Slot | null {
  return (p.imageKey && SLOT_OF[p.imageKey]) || null;
}

// Box (photo pixels) each 200x200 garment drawing is stretched into so its
// outline lands on the matching part of the model.
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
  const w = boots ? 150 : 175;
  const h = boots ? 200 : 190;
  const foot = (cx: number, mirror: boolean) => (
    <svg
      x={cx - w / 2}
      y={985}
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
      <rect x="470" y="1040" width="280" height="130" fill={STAGE_GREY} />
      {foot(535, false)}
      {foot(683, true)}
    </>
  );
}

// The model photo plus whatever she is wearing. Used by the main stage and
// by the round magnifier.
function Scene({ outfit }: { outfit: Outfit }) {
  return (
    <>
      {/* grey base the photo is multiplied onto, so its white background vanishes */}
      <rect x="-2000" y="-2000" width="5000" height="5000" fill={STAGE_GREY} />
      <image
        href="/fitting-model.webp"
        x="0"
        y="0"
        width={IMG_W}
        height={IMG_H}
        style={{ mixBlendMode: "multiply" }}
      />
      {(outfit.top || outfit.dress) && (
        <>
          <rect x="425" y="185" width="112" height="385" fill={STAGE_GREY} />
          <rect x="698" y="185" width="105" height="385" fill={STAGE_GREY} />
        </>
      )}
      {(outfit.bottom || outfit.dress) && (
        <rect x="448" y="395" width="324" height="680" fill={STAGE_GREY} />
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
    </>
  );
}

// Rough women's letter size from a chest measurement (cm)
function sizeFromChest(chest: number): string {
  if (chest < 81) return "XS";
  if (chest <= 88) return "S";
  if (chest <= 96) return "M";
  if (chest <= 104) return "L";
  return "XL";
}

interface Params {
  chest: string;
  waist: string;
  hips: string;
  height: string;
}

const DEFAULT_PARAMS: Params = { chest: "81", waist: "59", hips: "86", height: "168" };

function loadParams(): Params {
  try {
    const raw = localStorage.getItem(PARAMS_KEY);
    return raw ? { ...DEFAULT_PARAMS, ...JSON.parse(raw) } : DEFAULT_PARAMS;
  } catch {
    return DEFAULT_PARAMS;
  }
}

const Icon = {
  bag: (
    <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M6 7h12l1 13H5L6 7z" />
      <path d="M9 7a3 3 0 0 1 6 0" />
    </svg>
  ),
  user: (
    <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <circle cx="12" cy="8" r="4" />
      <path d="M4 21c0-4.4 3.6-7 8-7s8 2.6 8 7" />
    </svg>
  ),
  zoomIn: (
    <svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" aria-hidden="true">
      <circle cx="11" cy="11" r="7" />
      <path d="M21 21l-4.3-4.3M11 8v6M8 11h6" />
    </svg>
  ),
  zoomOut: (
    <svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" aria-hidden="true">
      <circle cx="11" cy="11" r="7" />
      <path d="M21 21l-4.3-4.3M8 11h6" />
    </svg>
  ),
  search: (
    <svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" aria-hidden="true">
      <circle cx="11" cy="11" r="7" />
      <path d="M21 21l-4.3-4.3" />
    </svg>
  ),
  chevron: (
    <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M6 9l6 6 6-6" />
    </svg>
  ),
  left: (
    <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M15 5l-7 7 7 7" />
    </svg>
  ),
  right: (
    <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M9 5l7 7-7 7" />
    </svg>
  ),
  image: (
    <svg viewBox="0 0 24 24" width="34" height="34" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <rect x="3" y="4" width="18" height="16" rx="3" />
      <circle cx="9" cy="10" r="1.6" />
      <path d="M4 18l5-5 4 4 3-3 4 4" />
    </svg>
  ),
};

function TurnArrow({ flip }: { flip?: boolean }) {
  return (
    <svg viewBox="0 0 220 130" width="100%" height="100%" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" aria-hidden="true" style={flip ? { transform: "scaleX(-1)" } : undefined}>
      <path d="M14 60 C 8 110, 90 118, 205 112" />
      <path d="M14 60 C 22 28, 50 20, 74 14" strokeWidth="2" />
      <path d="M62 6 L76 14 L64 26" strokeWidth="2.2" strokeLinejoin="round" />
    </svg>
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
  const [outfit, setOutfit] = useState<Outfit>({});
  const [selectedSlot, setSelectedSlot] = useState<Slot | null>(null);
  const [zoom, setZoom] = useState(1);
  const [mirrored, setMirrored] = useState(false);
  const [lens, setLens] = useState({ x: 612, y: 330 });
  const [note, setNote] = useState<string | null>(null);
  const [params, setParams] = useState<Params>(loadParams);
  const [openAcc, setOpenAcc] = useState<string | null>(null);
  const [menuOpen, setMenuOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [category, setCategory] = useState<CategoryKey>("ALL");
  const rowRef = useRef<HTMLUListElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);
  const stageRef = useRef<HTMLDivElement>(null);

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

  // close the account menu on outside click / Escape
  useEffect(() => {
    if (!menuOpen) return;
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") setMenuOpen(false);
    }
    function onDown(e: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setMenuOpen(false);
      }
    }
    document.addEventListener("keydown", onKey);
    document.addEventListener("mousedown", onDown);
    return () => {
      document.removeEventListener("keydown", onKey);
      document.removeEventListener("mousedown", onDown);
    };
  }, [menuOpen]);

  function wear(p: Product) {
    const slot = slotOf(p);
    if (!slot) {
      setNote(`${p.name} has no fitting-room picture yet.`);
      return;
    }
    setNote(null);
    setOutfit((prev) => {
      const next: Outfit = { ...prev };
      if (slot === "dress") {
        delete next.top;
        delete next.bottom;
      } else if (slot === "top" || slot === "bottom") {
        delete next.dress;
      }
      next[slot] = { product: p, color: splitList(p.colors)[0] ?? "Grey", size: null };
      return next;
    });
    setSelectedSlot(slot);
  }

  function toggle(p: Product) {
    const slot = slotOf(p);
    if (slot && outfit[slot]?.product.id === p.id) remove(slot);
    else wear(p);
  }

  function remove(slot: Slot) {
    setOutfit((prev) => {
      const next = { ...prev };
      delete next[slot];
      return next;
    });
    setSelectedSlot((s) => (s === slot ? null : s));
  }

  function update(slot: Slot, patch: Partial<Worn>) {
    setOutfit((prev) => {
      const cur = prev[slot];
      return cur ? { ...prev, [slot]: { ...cur, ...patch } } : prev;
    });
  }

  const wornList = SLOT_ORDER.map((s) =>
    outfit[s] ? ([s, outfit[s]] as [Slot, Worn]) : null,
  ).filter((x): x is [Slot, Worn] => x !== null);

  // the item shown in the detail column
  const activeSlot: Slot | null =
    selectedSlot && outfit[selectedSlot] ? selectedSlot : (wornList[0]?.[0] ?? null);
  const active = activeSlot ? outfit[activeSlot]! : null;

  const hanger = useMemo(() => {
    const q = query.trim().toLowerCase();
    return (products ?? []).filter(
      (p) =>
        slotOf(p) !== null &&
        (category === "ALL" || p.category === category) &&
        (!q || p.name.toLowerCase().includes(q)),
    );
  }, [products, category, query]);

  const needsSize = wornList.some(
    ([, w]) => splitList(w.product.sizes).length > 0 && w.size === null,
  );

  function addToBag() {
    if (wornList.length === 0) {
      setNote("Pick something from the hanger first.");
      return;
    }
    if (needsSize) {
      setNote("Pick a size for each item before adding to your bag.");
      return;
    }
    wornList.forEach(() => onAddToBag());
    setNote(`Added ${wornList.length} item${wornList.length === 1 ? "" : "s"} to your bag.`);
  }

  function confirmParams() {
    try {
      localStorage.setItem(PARAMS_KEY, JSON.stringify(params));
    } catch {
      // storage unavailable: values last until reload
    }
    const chest = Number(params.chest);
    if (!Number.isFinite(chest) || chest <= 0) {
      setNote("Enter your chest measurement in cm.");
      return;
    }
    const size = sizeFromChest(chest);
    let applied = 0;
    setOutfit((prev) => {
      const next: Outfit = { ...prev };
      for (const slot of SLOT_ORDER) {
        const w = next[slot];
        if (w && splitList(w.product.sizes).includes(size)) {
          next[slot] = { ...w, size };
          applied += 1;
        }
      }
      return next;
    });
    setNote(`Recommended size: ${size} (from chest ${chest} cm).`);
    void applied;
  }

  function scrollHanger(dir: -1 | 1) {
    const el = rowRef.current;
    if (el) el.scrollBy({ left: dir * el.clientWidth * 0.8, behavior: "smooth" });
  }

  // move the magnifier to wherever the pointer is on the model
  function onStageMove(e: ReactPointerEvent<HTMLDivElement>) {
    const svg = stageRef.current?.querySelector("svg.fr-model-svg");
    if (!svg) return;
    const r = svg.getBoundingClientRect();
    if (e.clientX < r.left || e.clientX > r.right || e.clientY < r.top || e.clientY > r.bottom) return;
    const fx = (e.clientX - r.left) / r.width;
    const fy = (e.clientY - r.top) / r.height;
    setLens({
      x: VIEW.x + (mirrored ? 1 - fx : fx) * VIEW.w,
      y: VIEW.y + fy * VIEW.h,
    });
  }

  const set = (k: keyof Params) => (e: { target: { value: string } }) =>
    setParams((p) => ({ ...p, [k]: e.target.value }));

  const accordions: { key: string; title: string; body: string }[] = active
    ? [
        {
          key: "materials",
          title: "Materials, care and source",
          body:
            (active.product.description ?? "No description yet.") +
            " Follow the care label on the garment.",
        },
        {
          key: "stock",
          title: "In-store availability",
          body:
            active.product.quantity > 0
              ? `${active.product.quantity} in stock online.`
              : "Sold out online.",
        },
        {
          key: "delivery",
          title: "Deliveries and returns",
          body: "Delivery and return options are confirmed at checkout.",
        },
      ]
    : [];

  return (
    <div className="fr-page">
      <div className="fr-frame">
        <header className="fr-head">
          <div className="fr-head-left">
            <h1>Fitting room</h1>
            <button type="button" className="fr-back" onClick={onAllProducts}>
              {Icon.left}
              <span>Back</span>
            </button>
          </div>
          <div className="fr-brand" aria-label="Product API">
            Product<sup>API</sup>
          </div>
          <div className="fr-head-right" ref={menuRef}>
            <span className="fr-bag">
              {Icon.bag}
              Bag ({bagCount})
            </span>
            <button
              type="button"
              className="fr-user"
              onClick={() => setMenuOpen((o) => !o)}
              aria-label="Account menu"
              aria-expanded={menuOpen}
            >
              {Icon.user}
            </button>
            {menuOpen && (
              <div className="fr-menu" role="menu">
                <p>
                  {session.username} <small>({session.role})</small>
                </p>
                <button type="button" onClick={onHome}>Home</button>
                <button type="button" onClick={onProducts}>Products</button>
                <button type="button" onClick={onAllProducts}>All Products</button>
                <button type="button" onClick={onLogout}>Log out</button>
              </div>
            )}
          </div>
        </header>

        {error ? (
          <div className="state error" role="alert">
            <p>{error}</p>
            <button onClick={() => setReloadKey((k) => k + 1)}>Retry</button>
          </div>
        ) : (
          <div className="fr-grid">
            {/* ------------ left: model + hanger ------------ */}
            <section className="fr-stage" ref={stageRef} onPointerMove={onStageMove} aria-label="Model">
              <div className="fr-zoom">
                <button type="button" onClick={() => setZoom((z) => Math.min(1.6, +(z + 0.2).toFixed(1)))} aria-label="Zoom in">
                  {Icon.zoomIn}
                </button>
                <button type="button" onClick={() => setZoom((z) => Math.max(1, +(z - 0.2).toFixed(1)))} aria-label="Zoom out">
                  {Icon.zoomOut}
                </button>
              </div>

              <div className="fr-lens" aria-hidden="true">
                <svg viewBox={`${lens.x - 70} ${lens.y - 70} 140 140`} width="100%" height="100%">
                  <g transform={mirrored ? `translate(${lens.x * 2},0) scale(-1,1)` : undefined}>
                    <Scene outfit={outfit} />
                  </g>
                </svg>
              </div>

              <button type="button" className="fr-turn left" onClick={() => setMirrored((m) => !m)} aria-label="Turn the model around">
                <TurnArrow />
              </button>
              <button type="button" className="fr-turn right" onClick={() => setMirrored((m) => !m)} aria-label="Turn the model around">
                <TurnArrow flip />
              </button>

              <div className="fr-model" style={{ transform: `scale(${zoom})` }}>
                <svg
                  className="fr-model-svg"
                  viewBox={`${VIEW.x} ${VIEW.y} ${VIEW.w} ${VIEW.h}`}
                  role="img"
                  aria-label="Model wearing your outfit"
                  style={mirrored ? { transform: "scaleX(-1)" } : undefined}
                >
                  <Scene outfit={outfit} />
                </svg>
              </div>

              <section className="fr-hanger" aria-label="On a hanger">
                <div className="fr-hanger-head">
                  <h2>On a hanger</h2>
                  <button type="button" className="fr-icon" onClick={() => setSearchOpen((o) => !o)} aria-label="Search the hanger" aria-expanded={searchOpen}>
                    {Icon.search}
                  </button>
                </div>
                {searchOpen && (
                  <div className="fr-search">
                    <input
                      type="search"
                      placeholder="Search clothes…"
                      aria-label="Search clothes"
                      value={query}
                      onChange={(e) => setQuery(e.target.value)}
                      autoFocus
                    />
                    <div className="fr-cats">
                      {CATEGORY_TABS.map((t) => (
                        <button
                          key={t.key}
                          type="button"
                          className={category === t.key ? "on" : undefined}
                          onClick={() => setCategory(t.key)}
                        >
                          {t.label}
                        </button>
                      ))}
                    </div>
                  </div>
                )}
                <div className="fr-carousel">
                  <button type="button" className="fr-arrow" onClick={() => scrollHanger(-1)} aria-label="Previous">
                    {Icon.left}
                  </button>
                  {products === null ? (
                    <p className="fr-empty">Loading clothes…</p>
                  ) : hanger.length === 0 ? (
                    <p className="fr-empty">Nothing found.</p>
                  ) : (
                    <ul className="fr-row" ref={rowRef}>
                      {hanger.map((p) => {
                        const slot = slotOf(p);
                        const on = slot !== null && outfit[slot]?.product.id === p.id;
                        return (
                          <li key={p.id}>
                            <button
                              type="button"
                              className={on ? "fr-hanger-item on" : "fr-hanger-item"}
                              onClick={() => toggle(p)}
                              aria-pressed={on}
                              title={p.name}
                              aria-label={p.name}
                            >
                              <ProductArt imageKey={p.imageKey} color={splitList(p.colors)[0]} />
                            </button>
                          </li>
                        );
                      })}
                    </ul>
                  )}
                  <button type="button" className="fr-arrow" onClick={() => scrollHanger(1)} aria-label="Next">
                    {Icon.right}
                  </button>
                </div>
              </section>
            </section>

            {/* ------------ right: parameters + wearing ------------ */}
            <aside className="fr-side">
              <section className="fr-card">
                <h2>Your parameters</h2>
                <div className="fr-params">
                  {(
                    [
                      ["chest", "Chest (cm)"],
                      ["waist", "Waist (cm)"],
                      ["hips", "Hips (cm)"],
                      ["height", "Height (cm)"],
                    ] as [keyof Params, string][]
                  ).map(([k, label]) => (
                    <label key={k}>
                      <span>{label}</span>
                      <input
                        type="number"
                        inputMode="numeric"
                        min="1"
                        value={params[k]}
                        onChange={set(k)}
                      />
                    </label>
                  ))}
                </div>
                <button type="button" className="fr-yellow" onClick={confirmParams}>
                  Confirm
                </button>
              </section>

              <section className="fr-card">
                <h2>You are wearing</h2>
                <div className="fr-wear">
                  <ul className="fr-thumbs">
                    {wornList.length === 0
                      ? [0, 1, 2].map((i) => (
                          <li key={i}>
                            <div className="fr-thumb empty">{Icon.image}</div>
                          </li>
                        ))
                      : wornList.map(([slot, w]) => (
                          <li key={slot}>
                            <button
                              type="button"
                              className={slot === activeSlot ? "fr-thumb on" : "fr-thumb"}
                              onClick={() => setSelectedSlot(slot)}
                              aria-label={w.product.name}
                              aria-pressed={slot === activeSlot}
                            >
                              <ProductArt imageKey={w.product.imageKey} color={w.color} />
                            </button>
                            {slot === activeSlot && (
                              <button
                                type="button"
                                className="fr-x"
                                onClick={() => remove(slot)}
                                aria-label={`Take off ${w.product.name}`}
                              >
                                ×
                              </button>
                            )}
                          </li>
                        ))}
                  </ul>

                  <div className="fr-detail">
                    {active && activeSlot ? (
                      <>
                        <h3>{active.product.name}</h3>
                        <p className="fr-price">
                          <strong>{money(active.product.price)}</strong>
                          <span>{productRef(active.product)}</span>
                        </p>

                        {splitList(active.product.colors).length > 0 && (
                          <div className="fr-opt">
                            <h4>Color</h4>
                            <div className="fr-colors">
                              {splitList(active.product.colors).map((c) => (
                                <button
                                  key={c}
                                  type="button"
                                  className={active.color === c ? "fr-color on" : "fr-color"}
                                  onClick={() => update(activeSlot, { color: c })}
                                  aria-pressed={active.color === c}
                                >
                                  <i style={{ background: colorHex(c) }} />
                                  <span>{c}</span>
                                </button>
                              ))}
                            </div>
                          </div>
                        )}

                        {splitList(active.product.sizes).length > 0 && (
                          <div className="fr-opt">
                            <h4>Size</h4>
                            <div className="fr-sizes">
                              {splitList(active.product.sizes).map((s) => (
                                <button
                                  key={s}
                                  type="button"
                                  className={active.size === s ? "fr-size on" : "fr-size"}
                                  onClick={() => update(activeSlot, { size: s })}
                                  aria-pressed={active.size === s}
                                >
                                  {s}
                                </button>
                              ))}
                            </div>
                          </div>
                        )}

                        <div className="fr-acc">
                          {accordions.map((a) => (
                            <div key={a.key} className={openAcc === a.key ? "fr-acc-item open" : "fr-acc-item"}>
                              <button
                                type="button"
                                onClick={() => setOpenAcc((o) => (o === a.key ? null : a.key))}
                                aria-expanded={openAcc === a.key}
                              >
                                <span>{a.title}</span>
                                {Icon.chevron}
                              </button>
                              {openAcc === a.key && <p>{a.body}</p>}
                            </div>
                          ))}
                        </div>
                      </>
                    ) : (
                      <p className="fr-hint">
                        Pick something from the hanger to put it on the model.
                      </p>
                    )}
                  </div>
                </div>

                {note && (
                  <p className="fr-note" role="status">
                    {note}
                  </p>
                )}
                <button type="button" className="fr-yellow" onClick={addToBag} disabled={wornList.length === 0}>
                  Add to bag ({bagCount})
                </button>
              </section>
            </aside>
          </div>
        )}
      </div>
    </div>
  );
}
