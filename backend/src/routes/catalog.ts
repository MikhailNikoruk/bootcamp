import { Router } from "express";
import { db } from "../db.js";

const router = Router();

router.get("/districts", (_req, res) => {
  const data = db.prepare("SELECT id, name, slug FROM districts ORDER BY name ASC").all();
  return res.json(data);
});

router.get("/sports", (_req, res) => {
  const data = db.prepare("SELECT id, name, slug FROM sports ORDER BY name ASC").all();
  return res.json(data);
});

router.get("/venues", (req, res) => {
  const districtSlug = typeof req.query.districtSlug === "string" ? req.query.districtSlug : null;
  const sportSlug = typeof req.query.sportSlug === "string" ? req.query.sportSlug : null;

  const venues = db
    .prepare(
      `
      SELECT
        v.id,
        v.name,
        v.address,
        d.id as district_id,
        d.name as district_name,
        d.slug as district_slug,
        (
          SELECT MIN(ts.start_at)
          FROM time_slots ts
          WHERE ts.venue_id = v.id
            AND datetime(ts.start_at) > datetime('now')
        ) as next_slot_at
      FROM venues v
      JOIN districts d ON d.id = v.district_id
      WHERE (? IS NULL OR d.slug = ?)
        AND (
          ? IS NULL OR EXISTS (
            SELECT 1
            FROM venue_sports vs
            JOIN sports s ON s.id = vs.sport_id
            WHERE vs.venue_id = v.id AND s.slug = ?
          )
        )
      ORDER BY v.name ASC
      `,
    )
    .all(districtSlug, districtSlug, sportSlug, sportSlug) as Array<{
    id: number;
    name: string;
    address: string;
    district_id: number;
    district_name: string;
    district_slug: string;
    next_slot_at: string | null;
  }>;

  const sportsByVenue = db
    .prepare(
      `
      SELECT vs.venue_id, s.id, s.name, s.slug
      FROM venue_sports vs
      JOIN sports s ON s.id = vs.sport_id
      ORDER BY s.name ASC
      `,
    )
    .all() as Array<{ venue_id: number; id: number; name: string; slug: string }>;

  const venueSportsMap = new Map<number, Array<{ id: number; name: string; slug: string }>>();
  for (const s of sportsByVenue) {
    const list = venueSportsMap.get(s.venue_id) ?? [];
    list.push({ id: s.id, name: s.name, slug: s.slug });
    venueSportsMap.set(s.venue_id, list);
  }

  return res.json(
    venues.map((venue) => ({
      id: venue.id,
      name: venue.name,
      address: venue.address,
      district: {
        id: venue.district_id,
        name: venue.district_name,
        slug: venue.district_slug,
      },
      sports: venueSportsMap.get(venue.id) ?? [],
      nextSlotAt: venue.next_slot_at,
    })),
  );
});

router.get("/venues/:id/slots", (req, res) => {
  const venueId = Number(req.params.id);
  const dateRaw = typeof req.query.date === "string" ? req.query.date : null;

  if (!Number.isInteger(venueId)) {
    return res.status(400).json({ message: "Invalid venue id" });
  }

  const selectedDate = dateRaw ? new Date(dateRaw) : new Date();
  if (Number.isNaN(selectedDate.getTime())) {
    return res.status(400).json({ message: "Invalid date" });
  }

  const yyyy = selectedDate.getFullYear();
  const mm = String(selectedDate.getMonth() + 1).padStart(2, "0");
  const dd = String(selectedDate.getDate()).padStart(2, "0");
  const dateKey = `${yyyy}-${mm}-${dd}`;

  const slots = db
    .prepare(
      `
      SELECT
        ts.id,
        ts.start_at,
        ts.end_at,
        EXISTS(
          SELECT 1
          FROM bookings b
          WHERE b.slot_id = ts.id
            AND b.status = 'CONFIRMED'
        ) as is_booked
      FROM time_slots ts
      WHERE ts.venue_id = ?
        AND date(ts.start_at) = ?
      ORDER BY ts.start_at ASC
      `,
    )
    .all(venueId, dateKey) as Array<{
    id: number;
    start_at: string;
    end_at: string;
    is_booked: 0 | 1;
  }>;

  return res.json(
    slots.map((slot) => ({
      id: slot.id,
      startAt: slot.start_at,
      endAt: slot.end_at,
      isBooked: slot.is_booked === 1,
    })),
  );
});

export default router;
