import { Router } from "express";
import { z } from "zod";
import { db } from "../db.js";
import { AuthRequest, requireAuth } from "../middleware/auth.js";

const router = Router();

const createBookingSchema = z.object({
  slotId: z.number().int().positive(),
});

router.post("/", requireAuth, (req: AuthRequest, res) => {
  const parsed = createBookingSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ message: "Invalid payload", issues: parsed.error.issues });
  }

  const slotId = parsed.data.slotId;
  const userId = req.user!.userId;

  const slot = db
    .prepare("SELECT id, start_at FROM time_slots WHERE id = ?")
    .get(slotId) as { id: number; start_at: string } | undefined;

  if (!slot) {
    return res.status(404).json({ message: "Slot not found" });
  }

  if (new Date(slot.start_at) <= new Date()) {
    return res.status(400).json({ message: "Cannot book past slot" });
  }

  const existing = db
    .prepare("SELECT id FROM bookings WHERE slot_id = ? AND status = 'CONFIRMED'")
    .get(slotId) as { id: number } | undefined;

  if (existing) {
    return res.status(409).json({ message: "Slot already booked" });
  }

  const info = db
    .prepare("INSERT INTO bookings (user_id, slot_id, status) VALUES (?, ?, 'CONFIRMED')")
    .run(userId, slotId);

  const booking = db
    .prepare(
      `
      SELECT
        b.id,
        b.status,
        b.created_at,
        ts.id as slot_id,
        ts.start_at,
        ts.end_at,
        v.id as venue_id,
        v.name as venue_name,
        v.address as venue_address,
        d.id as district_id,
        d.name as district_name,
        d.slug as district_slug
      FROM bookings b
      JOIN time_slots ts ON ts.id = b.slot_id
      JOIN venues v ON v.id = ts.venue_id
      JOIN districts d ON d.id = v.district_id
      WHERE b.id = ?
      `,
    )
    .get(Number(info.lastInsertRowid)) as {
    id: number;
    status: string;
    created_at: string;
    slot_id: number;
    start_at: string;
    end_at: string;
    venue_id: number;
    venue_name: string;
    venue_address: string;
    district_id: number;
    district_name: string;
    district_slug: string;
  };

  return res.status(201).json({
    id: booking.id,
    status: booking.status,
    createdAt: booking.created_at,
    slot: {
      id: booking.slot_id,
      startAt: booking.start_at,
      endAt: booking.end_at,
      venue: {
        id: booking.venue_id,
        name: booking.venue_name,
        address: booking.venue_address,
        district: {
          id: booking.district_id,
          name: booking.district_name,
          slug: booking.district_slug,
        },
      },
    },
  });
});

router.get("/me", requireAuth, (req: AuthRequest, res) => {
  const rows = db
    .prepare(
      `
      SELECT
        b.id,
        b.status,
        b.created_at,
        ts.id as slot_id,
        ts.start_at,
        ts.end_at,
        v.id as venue_id,
        v.name as venue_name,
        v.address as venue_address,
        d.id as district_id,
        d.name as district_name,
        d.slug as district_slug
      FROM bookings b
      JOIN time_slots ts ON ts.id = b.slot_id
      JOIN venues v ON v.id = ts.venue_id
      JOIN districts d ON d.id = v.district_id
      WHERE b.user_id = ?
        AND b.status = 'CONFIRMED'
      ORDER BY b.created_at DESC
      `,
    )
    .all(req.user!.userId) as Array<{
    id: number;
    status: string;
    created_at: string;
    slot_id: number;
    start_at: string;
    end_at: string;
    venue_id: number;
    venue_name: string;
    venue_address: string;
    district_id: number;
    district_name: string;
    district_slug: string;
  }>;

  return res.json(
    rows.map((row) => ({
      id: row.id,
      status: row.status,
      createdAt: row.created_at,
      slot: {
        id: row.slot_id,
        startAt: row.start_at,
        endAt: row.end_at,
        venue: {
          id: row.venue_id,
          name: row.venue_name,
          address: row.venue_address,
          district: {
            id: row.district_id,
            name: row.district_name,
            slug: row.district_slug,
          },
        },
      },
    })),
  );
});

router.delete("/:id", requireAuth, (req: AuthRequest, res) => {
  const bookingId = Number(req.params.id);
  if (!Number.isInteger(bookingId)) {
    return res.status(400).json({ message: "Invalid booking id" });
  }

  const booking = db
    .prepare("SELECT id, user_id, status FROM bookings WHERE id = ?")
    .get(bookingId) as { id: number; user_id: number; status: string } | undefined;

  if (!booking || booking.status !== "CONFIRMED") {
    return res.status(404).json({ message: "Booking not found" });
  }

  if (booking.user_id !== req.user!.userId && req.user!.role !== "ADMIN") {
    return res.status(403).json({ message: "Forbidden" });
  }

  db.prepare("UPDATE bookings SET status = 'CANCELED' WHERE id = ?").run(bookingId);

  return res.status(204).send();
});

export default router;
