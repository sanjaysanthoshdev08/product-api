import { useState } from "react";
import type { AuthResponse } from "./api";
import AddProductPage from "./AddProductPage";
import EditProductPage from "./EditProductPage";
import HomePage from "./HomePage";
import LoginPage from "./LoginPage";
import ProductDetailsPage from "./ProductDetailsPage";
import ProductsPage from "./ProductsPage";
import RegisterPage from "./RegisterPage";

const STORAGE_KEY = "product-api-session";

function loadSession(): AuthResponse | null {
  try {
    const raw = sessionStorage.getItem(STORAGE_KEY);
    return raw ? (JSON.parse(raw) as AuthResponse) : null;
  } catch {
    return null;
  }
}

export default function App() {
  const [session, setSession] = useState<AuthResponse | null>(loadSession);
  const [view, setView] = useState<"home" | "login" | "register">("home");
  const [selectedId, setSelectedId] = useState<number | null>(null);
  const [listPage, setListPage] = useState(0);
  const [adding, setAdding] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  // After signing in (or reloading while signed in) the user lands on Home.
  const [atHome, setAtHome] = useState(true);

  function handleLogin(auth: AuthResponse) {
    try {
      sessionStorage.setItem(STORAGE_KEY, JSON.stringify(auth));
    } catch {
      // storage unavailable: session lasts until reload
    }
    setSession(auth);
    setAtHome(true);
  }

  function handleLogout() {
    try {
      sessionStorage.removeItem(STORAGE_KEY);
    } catch {
      // ignore
    }
    setSession(null);
    setSelectedId(null);
    setListPage(0);
    setAdding(false);
    setEditingId(null);
    setAtHome(true);
    setView("home");
  }

  if (session) {
    if (atHome) {
      return (
        <HomePage
          onLogin={() => {}}
          onTryNow={() => {}}
          username={session.username}
          onOpenProducts={() => setAtHome(false)}
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
    if (selectedId !== null) {
      return (
        <ProductDetailsPage
          session={session}
          productId={selectedId}
          onBack={() => setSelectedId(null)}
          onLogout={handleLogout}
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

  return view === "register" ? (
    <RegisterPage
      onRegistered={handleLogin}
      onShowLogin={() => setView("login")}
      onShowHome={() => setView("home")}
    />
  ) : (
    <LoginPage
      onLogin={handleLogin}
      onShowRegister={() => setView("register")}
      onShowHome={() => setView("home")}
    />
  );
}
