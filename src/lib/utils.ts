import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export const shuffleArray = <T,>(array: T[]): T[] => {
  if (typeof window === "undefined") {
    // Return original array if not in browser environment
    return array;
  }
  return [...array].sort(() => Math.random() - 0.5);
};

    