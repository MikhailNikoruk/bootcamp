import type { Venue } from "../types";

export type OccupancyLevel = "low" | "medium" | "high";

export function getOccupancyPercent(occupancyNow: number, capacity: number): number {
  if (capacity <= 0) {
    return 0;
  }

  return Math.min(100, Math.round((occupancyNow / capacity) * 100));
}

export function getOccupancyLevelByPercent(percent: number): OccupancyLevel {
  if (percent <= 33) {
    return "low";
  }

  if (percent <= 66) {
    return "medium";
  }

  return "high";
}

export function getOccupancyLevel(occupancyNow: number, capacity: number): OccupancyLevel {
  return getOccupancyLevelByPercent(getOccupancyPercent(occupancyNow, capacity));
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
  return getOccupancyPercent(occupancyNow, capacity);
}
