import { type ClassValue, clsx } from "clsx"
import { twMerge } from "tailwind-merge"

/** Merge Tailwind classes safely — used by shadcn/ui components */
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

/** Format a Date to "Mon 3 Jun" */
export function formatShortDate(date: Date): string {
  return date.toLocaleDateString("en-GB", {
    weekday: "short",
    day:     "numeric",
    month:   "short",
  })
}

/** Format a Date to full "Monday, 3 June 2025" */
export function formatFullDate(date: Date): string {
  return date.toLocaleDateString("en-GB", {
    weekday: "long",
    day:     "numeric",
    month:   "long",
    year:    "numeric",
  })
}

/** Clamp a number between min and max */
export function clamp(value: number, min: number, max: number): number {
  return Math.min(Math.max(value, min), max)
}

/** Resolve greeting based on local hour */
export function getGreeting(hour = new Date().getHours()): string {
  if (hour < 5)  return "Still up?"
  if (hour < 12) return "Good morning."
  if (hour < 17) return "Good afternoon."
  if (hour < 21) return "Good evening."
  return "Wrapping up?"
}
