import { useCallback, useState } from "react";
import type { AuthResponse } from "./api";
import AllProductsPage from "./AllProductsPage";
import AddProductPage from "./AddProductPage";
import EditProductPage from "./EditProductPage";
import FittingRoomPage from "./FittingRoomPage";
import ForgotPasswordPage from "./ForgotPasswordPage";
import HomePage from "./HomePage";
import LoginPage from "./LoginPage";
import ProductDetailsPage from "./ProductDetailsPage";
import ProductsPage from "./ProductsPage";
import RegisterPage from "./RegisterPage";
import ResetPasswordPage from "./ResetPasswordPage";

// The emailed link opens the site as /?reset-token=...
function readResetToken(): string | null {
  return new URLSearchParams(window.location.search).get("reset-token");
}

const STORAGE_KEY = "product-api-session";
const BAG_KEY = "product-api-bag";

function loadBag(): number {
  try {
    const n = Number(localStorage.getItem(BAG_KEY));
    return Number.isFinite(n) && n > 0 ? Math.floor(n) : 0;
  } catch {
    return 0;
  }
}

function loadSession(): AuthResponse | null {
  try {
    // localStorage keeps you signed in after closing the browser; fall back to
    // sessionStorage for sessions saved by older versions.
    const raw =
      localStorage.getItem(STORAGE_KEY) ?? sessionStorage.getItem(STORAGE_KEY);
    return raw ? (JSON.parse(raw) as AuthResponse) : null;
  } catch {
    return null;
  }
}

export default function App() {
  const [session, setSession] = useState<AuthResponse | null>(loadSession);
  const [view, setView] = useState<"home" | "login" | "register" | "forgot" | "reset">(
    () => (readResetToken() ? "reset" : "home"),
  );
  const [resetToken, setResetToken] = useState<string | null>(readResetToken);
  const [selectedId, setSelectedId] = useState<number | null>(null);
  const [listPage, setListPage] = useState(0);
  const [adding, setAdding] = useState(false);
  // Which product listing is open: the admin table or the All Products grid.
  const [showAll, setShowAll] = useState(false);
  const [bagCount, setBagCount] = useState(loadBag);
  // Fitting room: open flag, plus a product to put on the model when it opens
  const [fitting, setFitting] = useState(false);
  const [tryOnId, setTryOnId] = useState<number | null>(null);

  function openFitting(productId: number | null = null) {
    setSelectedId(null);
    setTryOnId(productId);
    setFitting(true);
    setAtHome(false);
  }

  function handleAddToBag() {
    setBagCount((n) => {
      const next = n + 1;
      try {
        localStorage.setItem(BAG_KEY, String(next));
      } catch {
        // storage unavailable: the count lasts until reload
      }
      return next;
    });
  }
  const [editingId, setEditingId] = useState<number | null>(null);
  // After signing in (or reloading while signed in) the user lands on Home.
  const [atHome, setAtHome] = useState(true);

  function handleLogin(auth: AuthResponse) {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(auth));
    } catch {
      // storage unavailable: session lasts until reload
    }
    setSession(auth);
    setAtHome(true);
  }

  // Stable identity: pages list it as an effect dependency, so a new function on
  // every render would reload their data (and reset their selections).
  const handleLogout = useCallback(() => {
    try {
      localStorage.removeItem(STORAGE_KEY);
      sessionStorage.removeItem(STORAGE_KEY);
    } catch {
      // ignore
    }
    setSession(null);
    setSelectedId(null);
    setListPage(0);
    setAdding(false);
    setEditingId(null);
    setShowAll(false);
    setFitting(false);
    setTryOnId(null);
    setAtHome(true);
    setView("home");
  }, []);

  function leaveReset(next: "login" | "forgot") {
    // Drop the token from the address bar so it is not kept in history
    window.history.replaceState(null, "", window.location.pathname);
    setView(next);
  }

  if (view === "reset" && resetToken) {
    return (
      <ResetPasswordPage
        token={resetToken}
        onShowLogin={() => leaveReset("login")}
        onRequestNew={() => leaveReset("forgot")}
      />
    );
  }

  if (session) {
    if (atHome) {
      return (
        <HomePage
          onLogin={() => {}}
          onTryNow={() => {}}
          username={session.username}
          onOpenProducts={() => {
            setShowAll(false);
            setFitting(false);
            setAtHome(false);
          }}
          onOpenAllProducts={() => {
            setShowAll(true);
            setFitting(false);
            setAtHome(false);
          }}
          onOpenFitting={() => openFitting()}
          onLogout={handleLogout}
        />
      );
    }
    if (editingId !== null) {
      return (
        <EditProductPage
          session={session}
          productId={editingId}
          onDone={() => setEditingId(null)}
          onLogout={handleLogout}
        />
      );
    }
    if (adding) {
      return (
        <AddProductPage
          session={session}
          onDone={() => setAdding(false)}
          onLogout={handleLogout}
        />
      );
    }
    if (fitting) {
      return (
        <FittingRoomPage
          session={session}
          bagCount={bagCount}
          initialProductId={tryOnId}
          onAddToBag={handleAddToBag}
          onHome={() => {
            setFitting(false);
            setAtHome(true);
          }}
          onProducts={() => {
            setFitting(false);
            setShowAll(false);
          }}
          onAllProducts={() => {
            setFitting(false);
            setShowAll(true);
          }}
          onLogout={handleLogout}
        />
      );
    }
    if (selectedId !== null) {
      return (
        <ProductDetailsPage
          session={session}
          productId={selectedId}
          bagCount={bagCount}
          onAddToBag={handleAddToBag}
          onTryOn={(id) => openFitting(id)}
          onBack={() => setSelectedId(null)}
          onLogout={handleLogout}
        />
      );
    }
    if (showAll) {
      return (
        <AllProductsPage
          session={session}
          bagCount={bagCount}
          onSelectProduct={setSelectedId}
          onLogout={handleLogout}
          onHome={() => setAtHome(true)}
          onProducts={() => setShowAll(false)}
          onFitting={() => openFitting()}
        />
      );
    }
    return (
      <ProductsPage
        session={session}
        page={listPage}
        onPageChange={setListPage}
        onSelectProduct={setSelectedId}
        onAddProduct={() => setAdding(true)}
        onEditProduct={setEditingId}
        onLogout={handleLogout}
        onHome={() => setAtHome(true)}
        onAllProducts={() => setShowAll(true)}
        onFitting={() => openFitting()}
      />
    );
  }

  if (view === "home") {
    return (
      <HomePage
        onLogin={() => setView("login")}
        onTryNow={() => setView("register")}
      />
    );
  }

  if (view === "forgot") {
    return (
      <ForgotPasswordPage
        onShowLogin={() => setView("login")}
        onShowHome={() => setView("home")}
        onResetToken={(token) => {
          setResetToken(token);
          setView("reset");
        }}
      />
    );
  }

  return view === "register" ? (
    <RegisterPage
      onRegistered={handleLogin}
      onShowLogin={() => setView("login")}
      onShowForgot={() => setView("forgot")}
      onShowHome={() => setView("home")}
    />
  ) : (
    <LoginPage
      onLogin={handleLogin}
      onShowRegister={() => setView("register")}
      onShowForgot={() => setView("forgot")}
      onShowHome={() => setView("home")}
    />
  );
}
