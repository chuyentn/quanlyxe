import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/**
 * Generate a unique trip code using short UUID format
 * Format: CH-YYYYMM-XXXXX (e.g., CH-202601-a7f4e)
 */
export function generateTripCode(): string {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const shortId = Math.random().toString(36).substring(2, 7).toUpperCase();
  return `CH-${year}${month}-${shortId}`;
}
