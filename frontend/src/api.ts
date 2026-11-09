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
  email: string,
  password: string,
): Promise<AuthResponse> {
  const res = await fetch("/api/v1/auth/register", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ username, email, password }),
  });
  if (!res.ok) throw new ApiError(res.status, await readError(res));
  return res.json();
}

// POST /api/v1/auth/forgot-password -> 202 { message }. The response is the
// same whether or not the account exists.
export async function forgotPassword(email: string): Promise<string> {
  const res = await fetch("/api/v1/auth/forgot-password", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email }),
  });
  if (!res.ok) throw new ApiError(res.status, await readError(res));
  const body = await res.json();
  return typeof body.message === "string" ? body.message : "";
}

// POST /api/v1/auth/reset-password { token, newPassword } -> 200 { message }.
// 400 means the link is invalid, used or expired.
export async function resetPassword(
  token: string,
  newPassword: string,
): Promise<string> {
  const res = await fetch("/api/v1/auth/reset-password", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ token, newPassword }),
  });
  if (!res.ok) throw new ApiError(res.status, await readError(res));
  const body = await res.json();
  return typeof body.message === "string" ? body.message : "";
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

export interface ProductInput {
  name: string;
  description: string;
  price: number;
  quantity: number;
}

// POST /api/v1/products (ADMIN only) -> 201 ProductResponse.
// 400 carries field messages; 403 means the user is not an ADMIN.
export async function createProduct(
  token: string,
  input: ProductInput,
): Promise<Product> {
  const res = await fetch("/api/v1/products", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify(input),
  });
  if (!res.ok) {
    const message =
      res.status === 401
        ? "Your session has expired. Please sign in again."
        : res.status === 403
          ? "Only an ADMIN can add products."
          : await readError(res);
    throw new ApiError(res.status, message);
  }
  return res.json();
}

async function failWithAdminMessage(res: Response, action: string): Promise<never> {
  const message =
    res.status === 401
      ? "Your session has expired. Please sign in again."
      : res.status === 403
        ? `Only an ADMIN can ${action}.`
        : await readError(res);
  throw new ApiError(res.status, message);
}

// PUT /api/v1/products/{id} (ADMIN only) -> 200 ProductResponse.
export async function updateProduct(
  token: string,
  id: number,
  input: ProductInput,
): Promise<Product> {
  const res = await fetch(`/api/v1/products/${id}`, {
    method: "PUT",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify(input),
  });
  if (!res.ok) return failWithAdminMessage(res, "edit products");
  return res.json();
}

// DELETE /api/v1/products/{id} (ADMIN only) -> 204 with no body.
export async function deleteProduct(token: string, id: number): Promise<void> {
  const res = await fetch(`/api/v1/products/${id}`, {
    method: "DELETE",
    headers: { Authorization: `Bearer ${token}` },
  });
  if (!res.ok) return failWithAdminMessage(res, "delete products");
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
