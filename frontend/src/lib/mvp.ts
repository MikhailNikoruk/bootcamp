import type { Venue } from "../types";

export type OccupancyLevel = "low" | "medium" | "high";

export function getOccupancyLevel(occupancyNow: number, capacity: number): OccupancyLevel {
  const ratio = capacity > 0 ? occupancyNow / capacity : 0;

  if (ratio < 0.35) {
    return "low";
  }

  if (ratio < 0.7) {
    return "medium";
  }

  return "high";
}

export function getOccupancyLabel(level: OccupancyLevel): string {
  if (level === "low") {
    return "Пусто";
  }

  if (level === "medium") {
    return "Средняя активность";
  }

  return "Много людей";
}

export function filterVenuesForStep(
  allVenues: Venue[],
  sportId: string,
  district: string,
): Venue[] {
  return allVenues.filter((venue) => {
    const sportMatch = !sportId || venue.sports.includes(sportId);
    const districtMatch = !district || venue.district === district;
    return sportMatch && districtMatch;
  });
}

export function formatPercent(occupancyNow: number, capacity: number): number {
  if (capacity <= 0) {
    return 0;
  }

  return Math.min(100, Math.round((occupancyNow / capacity) * 100));
}
