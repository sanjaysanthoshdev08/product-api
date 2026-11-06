// Types mirror the backend DTOs:
//   LoginRequest  { username, password }
//   AuthResponse  { token, username, role }
//   ProductResponse { id, name, description, price, quantity }
//   GET /api/v1/products returns a Spring Data Page<ProductResponse>.

export interface AuthResponse {
  token: string;
  username: string;
  role: string;
}

export interface Product {
  id: number;
  name: string;
  description: string | null;
  price: number;
  quantity: number;
}

export interface ProductPage {
  content: Product[];
  number: number; // zero-based current page
  size: number;
  totalPages: number;
  totalElements: number;
  first: boolean;
  last: boolean;
}

export class ApiError extends Error {
  status: number;
  constructor(status: number, message: string) {
    super(message);
    this.status = status;
  }
}

async function readError(res: Response): Promise<string> {
  try {
    const body = await res.json();
    if (body && typeof body.message === "string" && body.message) {
      return body.message;
    }
  } catch {
    // body was not JSON; fall through
  }
  return `Request failed (HTTP ${res.status})`;
}

export async function login(
  username: string,
  password: string,
): Promise<AuthResponse> {
  const res = await fetch("/api/v1/auth/login", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ username, password }),
  });
  if (!res.ok) throw new ApiError(res.status, await readError(res));
  return res.json();
}

// POST /api/v1/auth/register -> 201 { token, username, role }.
// New accounts always get the USER role; 409 means the username is taken.
export async function register(
  username: string,
  password: string,
): Promise<AuthResponse> {
  const res = await fetch("/api/v1/auth/register", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ username, password }),
  });
  if (!res.ok) throw new ApiError(res.status, await readError(res));
  return res.json();
}

// GET /api/v1/products/{id} -> ProductResponse, or 404 with a message.
export async function fetchProduct(
  token: string,
  id: number,
  signal?: AbortSignal,
): Promise<Product> {
  const res = await fetch(`/api/v1/products/${id}`, {
    headers: { Authorization: `Bearer ${token}` },
    signal,
  });
  if (!res.ok) {
    const message =
      res.status === 401
        ? "Your session has expired. Please sign in again."
        : await readError(res);
    throw new ApiError(res.status, message);
  }
  return res.json();
}

export async function fetchProducts(
  token: string,
  page: number,
  size: number,
  signal?: AbortSignal,
): Promise<ProductPage> {
  const res = await fetch(`/api/v1/products?page=${page}&size=${size}`, {
    headers: { Authorization: `Bearer ${token}` },
    signal,
  });
  if (!res.ok) {
    const message =
      res.status === 401
        ? "Your session has expired. Please sign in again."
        : await readError(res);
    throw new ApiError(res.status, message);
  }
  return res.json();
}
