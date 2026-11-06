import { useState } from "react";
import type { AuthResponse } from "./api";
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
  const [view, setView] = useState<"login" | "register">("login");
  const [selectedId, setSelectedId] = useState<number | null>(null);
  const [listPage, setListPage] = useState(0);

  function handleLogin(auth: AuthResponse) {
    try {
      sessionStorage.setItem(STORAGE_KEY, JSON.stringify(auth));
    } catch {
      // storage unavailable: session lasts until reload
    }
    setSession(auth);
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
  }

  if (session) {
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
        onLogout={handleLogout}
      />
    );
  }

  return view === "register" ? (
    <RegisterPage
      onRegistered={handleLogin}
      onShowLogin={() => setView("login")}
    />
  ) : (
    <LoginPage
      onLogin={handleLogin}
      onShowRegister={() => setView("register")}
    />
  );
}
