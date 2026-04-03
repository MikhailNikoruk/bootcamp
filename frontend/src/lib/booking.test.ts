import { describe, expect, it } from "vitest";
import { filterVenues, generateTimeSlots, isSlotBooked } from "./booking";
import type { Booking, Venue } from "../types";

describe("booking utils", () => {
  it("generates slot list by hour range", () => {
    expect(generateTimeSlots(8, 11)).toEqual(["08:00", "09:00", "10:00"]);
  });

  it("detects booked slot correctly", () => {
    const bookings: Booking[] = [
      {
        id: "b1",
        venueId: "v1",
        date: "2026-04-05",
        time: "10:00",
        createdAt: "2026-04-03T10:00:00.000Z",
        status: "CONFIRMED",
      },
    ];

    expect(isSlotBooked(bookings, "v1", "2026-04-05", "10:00")).toBe(true);
    expect(isSlotBooked(bookings, "v1", "2026-04-05", "11:00")).toBe(false);
  });

  it("filters venues by district, sport and query", () => {
    const venues: Venue[] = [
      {
        id: "v1",
        name: "Арена Тверская",
        address: "ул. Тверская, 10",
        districtSlug: "center",
        sportSlugs: ["football"],
        description: "",
        capacity: 40,
        pricePerHour: 1200,
      },
      {
        id: "v2",
        name: "Запад Корт",
        address: "ул. Лесная, 4",
        districtSlug: "west",
        sportSlugs: ["tennis"],
        description: "",
        capacity: 25,
        pricePerHour: 2000,
      },
    ];

    const result = filterVenues(venues, {
      district: "west",
      sport: "tennis",
      query: "корт",
    });

    expect(result).toHaveLength(1);
    expect(result[0]?.id).toBe("v2");
  });
});
