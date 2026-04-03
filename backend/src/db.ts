import Database from "better-sqlite3";
import bcrypt from "bcryptjs";

const dbPath = process.env.DB_PATH ?? "./data.db";
export const db = new Database(dbPath);

db.pragma("journal_mode = WAL");

type DistrictSeed = { slug: string; name: string };
type SportSeed = { slug: string; name: string };
type VenueSeed = {
  name: string;
  address: string;
  districtSlug: string;
  sportSlugs: string[];
};

const districts: DistrictSeed[] = [
  { slug: "center", name: "Центр" },
  { slug: "south", name: "Юг" },
  { slug: "north", name: "Север" },
  { slug: "west", name: "Запад" },
  { slug: "east", name: "Восток" },
];

const sports: SportSeed[] = [
  { slug: "football", name: "Футбол" },
  { slug: "basketball", name: "Баскетбол" },
  { slug: "tennis", name: "Теннис" },
  { slug: "volleyball", name: "Волейбол" },
  { slug: "running", name: "Бег" },
  { slug: "hockey", name: "Хоккей" },
  { slug: "baseball", name: "Бейсбол" },
];

const venues: VenueSeed[] = [
  {
    name: "Футболка на Тверской",
    address: "ул. Тверская, д. 10",
    districtSlug: "center",
    sportSlugs: ["football"],
  },
  {
    name: "Баскет Центр",
    address: "пр. Комсомольский, д. 3",
    districtSlug: "center",
    sportSlugs: ["basketball"],
  },
  {
    name: "Теннис Запад",
    address: "ул. Лесная, д. 4",
    districtSlug: "west",
    sportSlugs: ["tennis"],
  },
  {
    name: "Газель",
    address: "ул. Красная, д. 25",
    districtSlug: "south",
    sportSlugs: ["football"],
  },
  {
    name: "Беговая дорожка",
    address: "ул. Беговая, д. 22",
    districtSlug: "north",
    sportSlugs: ["running"],
  },
  {
    name: "Хоккей Восток",
    address: "ул. Революции пр., д. 3",
    districtSlug: "east",
    sportSlugs: ["hockey"],
  },
];

function createTables() {
  db.exec(`
    CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      email TEXT NOT NULL UNIQUE,
      password_hash TEXT NOT NULL,
      role TEXT NOT NULL DEFAULT 'USER',
      created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS districts (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      slug TEXT NOT NULL UNIQUE
    );

    CREATE TABLE IF NOT EXISTS sports (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      slug TEXT NOT NULL UNIQUE
    );

    CREATE TABLE IF NOT EXISTS venues (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      address TEXT NOT NULL,
      district_id INTEGER NOT NULL,
      max_capacity INTEGER NOT NULL DEFAULT 50,
      created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (district_id) REFERENCES districts(id)
    );

    CREATE TABLE IF NOT EXISTS venue_sports (
      venue_id INTEGER NOT NULL,
      sport_id INTEGER NOT NULL,
      PRIMARY KEY (venue_id, sport_id),
      FOREIGN KEY (venue_id) REFERENCES venues(id),
      FOREIGN KEY (sport_id) REFERENCES sports(id)
    );

    CREATE TABLE IF NOT EXISTS time_slots (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      venue_id INTEGER NOT NULL,
      start_at TEXT NOT NULL,
      end_at TEXT NOT NULL,
      FOREIGN KEY (venue_id) REFERENCES venues(id),
      UNIQUE (venue_id, start_at)
    );

    CREATE TABLE IF NOT EXISTS bookings (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER NOT NULL,
      slot_id INTEGER NOT NULL,
      status TEXT NOT NULL DEFAULT 'CONFIRMED',
      created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (user_id) REFERENCES users(id),
      FOREIGN KEY (slot_id) REFERENCES time_slots(id)
    );

    CREATE UNIQUE INDEX IF NOT EXISTS idx_booking_slot_confirmed
    ON bookings(slot_id)
    WHERE status = 'CONFIRMED';

    CREATE INDEX IF NOT EXISTS idx_time_slots_venue_start
    ON time_slots(venue_id, start_at);
  `);
}

function nextDays(days: number) {
  const result: Date[] = [];
  const now = new Date();

  for (let i = 0; i < days; i += 1) {
    const d = new Date(now);
    d.setDate(now.getDate() + i);
    d.setHours(0, 0, 0, 0);
    result.push(d);
  }

  return result;
}

export function initializeDatabase() {
  createTables();

  const districtCount = db.prepare("SELECT COUNT(*) as count FROM districts").get() as { count: number };
  if (districtCount.count > 0) {
    return;
  }

  const insertDistrict = db.prepare("INSERT INTO districts (name, slug) VALUES (?, ?)");
  const insertSport = db.prepare("INSERT INTO sports (name, slug) VALUES (?, ?)");
  const districtIdBySlug = new Map<string, number>();
  const sportIdBySlug = new Map<string, number>();

  for (const district of districts) {
    const info = insertDistrict.run(district.name, district.slug);
    districtIdBySlug.set(district.slug, Number(info.lastInsertRowid));
  }

  for (const sport of sports) {
    const info = insertSport.run(sport.name, sport.slug);
    sportIdBySlug.set(sport.slug, Number(info.lastInsertRowid));
  }

  const insertVenue = db.prepare(
    "INSERT INTO venues (name, address, district_id, max_capacity) VALUES (?, ?, ?, 50)",
  );
  const insertVenueSport = db.prepare("INSERT INTO venue_sports (venue_id, sport_id) VALUES (?, ?)");
  const insertSlot = db.prepare(
    "INSERT OR IGNORE INTO time_slots (venue_id, start_at, end_at) VALUES (?, ?, ?)",
  );

  for (const venue of venues) {
    const venueInfo = insertVenue.run(
      venue.name,
      venue.address,
      districtIdBySlug.get(venue.districtSlug),
    );
    const venueId = Number(venueInfo.lastInsertRowid);

    for (const sportSlug of venue.sportSlugs) {
      insertVenueSport.run(venueId, sportIdBySlug.get(sportSlug));
    }

    for (const day of nextDays(14)) {
      for (let hour = 8; hour < 21; hour += 1) {
        const start = new Date(day);
        start.setHours(hour, 0, 0, 0);

        const end = new Date(day);
        end.setHours(hour + 1, 0, 0, 0);

        insertSlot.run(venueId, start.toISOString(), end.toISOString());
      }
    }
  }

  const adminExists = db
    .prepare("SELECT id FROM users WHERE email = ?")
    .get("admin@bootcamp.local") as { id: number } | undefined;

  if (!adminExists) {
    const passwordHash = bcrypt.hashSync("admin12345", 10);
    db.prepare(
      "INSERT INTO users (name, email, password_hash, role) VALUES (?, ?, ?, 'ADMIN')",
    ).run("Admin", "admin@bootcamp.local", passwordHash);
  }
}
