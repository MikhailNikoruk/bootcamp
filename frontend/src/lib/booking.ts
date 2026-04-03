import type { Booking, Venue, VenueFilters } from "../types";

export function generateTimeSlots(startHour: number, endHour: number): string[] {
  const slots: string[] = [];
  for (let hour = startHour; hour < endHour; hour += 1) {
    slots.push(`${String(hour).padStart(2, "0")}:00`);
  }
  return slots;
}

export function isSlotBooked(
  bookings: Booking[],
  venueId: string,
  date: string,
  time: string,
): boolean {
  return bookings.some(
    (booking) =>
      booking.status === "CONFIRMED" &&
      booking.venueId === venueId &&
      booking.date === date &&
      booking.time === time,
  );
}

export function filterVenues(venues: Venue[], filters: VenueFilters): Venue[] {
  const normalizedQuery = filters.query.trim().toLowerCase();

  return venues.filter((venue) => {
    const districtMatch = !filters.district || venue.districtSlug === filters.district;
    const sportMatch = !filters.sport || venue.sportSlugs.includes(filters.sport);
    const queryMatch =
      normalizedQuery.length === 0 ||
      venue.name.toLowerCase().includes(normalizedQuery) ||
      venue.address.toLowerCase().includes(normalizedQuery);

    return districtMatch && sportMatch && queryMatch;
  });
}
