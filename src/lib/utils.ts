import { type ClassValue, clsx } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function formatDate(date: Date | string): string {
  return new Date(date).toLocaleDateString("id-ID", {
    day: "numeric",
    month: "long",
    year: "numeric",
  })
}

export function formatCurrency(n: number): string {
  return new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    minimumFractionDigits: 0,
  }).format(n)
}

export function formatPercent(n: number): string {
  return `${n.toFixed(1)}%`
}

// Maroon #731D36, Pink Rose #E2A6C0, Gold #C9A96E
export const COLORS = {
  primary: "#731D36",
  primaryLight: "#8B2A45",
  secondary: "#C9A96E",
  accent: "#E2A6C0",
  surface: "#1A1A2E",
  surfaceLight: "#232340",
}
