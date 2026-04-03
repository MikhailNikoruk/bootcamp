import type { Booking, Theme, Venue } from "../types";

const BOOKINGS_KEY = "bootcamp_bookings";
const USER_VENUES_KEY = "bootcamp_user_venues";
const THEME_KEY = "bootcamp_theme";

function safeParse<T>(value: string | null, fallback: T): T {
  if (!value) {
    return fallback;
  }

  try {
    return JSON.parse(value) as T;
  } catch {
    return fallback;
  }
}

export function loadBookings(): Booking[] {
  return safeParse<Booking[]>(localStorage.getItem(BOOKINGS_KEY), []);
}

export function saveBookings(bookings: Booking[]) {
  localStorage.setItem(BOOKINGS_KEY, JSON.stringify(bookings));
}

export function loadUserVenues(): Venue[] {
  return safeParse<Venue[]>(localStorage.getItem(USER_VENUES_KEY), []);
}

export function saveUserVenues(venues: Venue[]) {
  localStorage.setItem(USER_VENUES_KEY, JSON.stringify(venues));
}

export function loadTheme(): Theme | null {
  const value = localStorage.getItem(THEME_KEY);
  if (value === "light" || value === "dark") {
    return value;
  }
  return null;
}

export function saveTheme(theme: Theme) {
  localStorage.setItem(THEME_KEY, theme);
}
