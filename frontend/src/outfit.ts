// "My outfit": the products a user picked to hang on the outfit rail.
// Kept in localStorage so it survives a refresh; the rail has 4 hangers.

export const OUTFIT_SLOTS = 4;
const OUTFIT_KEY = "product-api-outfit";

export function loadOutfit(): number[] {
  try {
    const raw = JSON.parse(localStorage.getItem(OUTFIT_KEY) ?? "[]");
    return Array.isArray(raw)
      ? raw.filter((n): n is number => Number.isInteger(n)).slice(0, OUTFIT_SLOTS)
      : [];
  } catch {
    return [];
  }
}

export function saveOutfit(ids: number[]): void {
  try {
    localStorage.setItem(OUTFIT_KEY, JSON.stringify(ids));
  } catch {
    // ignore (private mode etc.)
  }
}
