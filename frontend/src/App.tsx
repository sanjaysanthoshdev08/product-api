import { useState } from "react";
import type { AuthResponse } from "./api";
import LoginPage from "./LoginPage";
import ProductsPage from "./ProductsPage";

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
  }

  return session ? (
    <ProductsPage session={session} onLogout={handleLogout} />
  ) : (
    <LoginPage onLogin={handleLogin} />
  );
}
