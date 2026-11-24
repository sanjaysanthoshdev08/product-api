import type { Product } from "./api";

// Helpers for the fashion shop fields on a product.

export type CategoryKey = "ALL" | "MEN" | "WOMEN" | "KIDS";

export const CATEGORY_TABS: { key: CategoryKey; label: string }[] = [
  { key: "ALL", label: "All" },
  { key: "MEN", label: "Men" },
  { key: "WOMEN", label: "Ladies" },
  { key: "KIDS", label: "Kids" },
];

export function categoryLabel(category: string | null | undefined): string {
  return CATEGORY_TABS.find((t) => t.key === category)?.label ?? "";
}

// "Brown,Black" -> ["Brown", "Black"]
export function splitList(value: string | null | undefined): string[] {
  return (value ?? "")
    .split(",")
    .map((v) => v.trim())
    .filter(Boolean);
}

const COLOR_HEX: Record<string, string> = {
  black: "#1c1c1c",
  white: "#f6f6f4",
  brown: "#5b3a29",
  navy: "#1f2f5a",
  grey: "#8d9096",
  gray: "#8d9096",
  red: "#c0392b",
  blue: "#3b78d8",
  green: "#2f7d4f",
  beige: "#d8c3a0",
  pink: "#f2a7c0",
  yellow: "#f6cf3a",
  olive: "#6b7a3a",
  denim: "#4a6fa5",
  cream: "#f3ead3",
};

export function colorHex(name: string): string {
  return COLOR_HEX[name.trim().toLowerCase()] ?? "#bdbdbd";
}

export function productRef(p: Pick<Product, "id">): string {
  return `Ref. ${50000 + p.id}`;
}

export function money(value: number | string): string {
  return `$${Number(value).toFixed(2)}`;
}
