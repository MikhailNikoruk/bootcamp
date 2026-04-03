import { Router } from "express";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { z } from "zod";
import { db } from "../db.js";
import { AuthRequest, requireAuth } from "../middleware/auth.js";

const router = Router();

const registerSchema = z.object({
  name: z.string().min(2).max(80),
  email: z.string().email(),
  password: z.string().min(8).max(72),
});

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8).max(72),
});

type UserRecord = {
  id: number;
  name: string;
  email: string;
  role: "USER" | "ADMIN";
  password_hash: string;
  created_at: string;
};

function signToken(user: { id: number; email: string; role: "USER" | "ADMIN" }) {
  const secret = process.env.JWT_SECRET;
  if (!secret) {
    throw new Error("JWT_SECRET is not configured");
  }

  return jwt.sign(
    {
      userId: user.id,
      email: user.email,
      role: user.role,
    },
    secret,
    { expiresIn: "7d" },
  );
}

router.post("/register", async (req, res) => {
  const parsed = registerSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ message: "Invalid payload", issues: parsed.error.issues });
  }

  const { name, email, password } = parsed.data;

  const existing = db
    .prepare("SELECT id FROM users WHERE email = ?")
    .get(email) as { id: number } | undefined;

  if (existing) {
    return res.status(409).json({ message: "Email already registered" });
  }

  const passwordHash = await bcrypt.hash(password, 10);
  const info = db
    .prepare("INSERT INTO users (name, email, password_hash, role) VALUES (?, ?, ?, 'USER')")
    .run(name, email, passwordHash);

  const user = db.prepare("SELECT id, name, email, role FROM users WHERE id = ?").get(
    Number(info.lastInsertRowid),
  ) as Pick<UserRecord, "id" | "name" | "email" | "role">;

  const token = signToken({ id: user.id, email: user.email, role: user.role });

  return res.status(201).json({ token, user });
});

router.post("/login", async (req, res) => {
  const parsed = loginSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ message: "Invalid payload", issues: parsed.error.issues });
  }

  const { email, password } = parsed.data;
  const user = db
    .prepare("SELECT id, name, email, role, password_hash, created_at FROM users WHERE email = ?")
    .get(email) as UserRecord | undefined;

  if (!user) {
    return res.status(401).json({ message: "Invalid email or password" });
  }

  const valid = await bcrypt.compare(password, user.password_hash);
  if (!valid) {
    return res.status(401).json({ message: "Invalid email or password" });
  }

  const token = signToken({ id: user.id, email: user.email, role: user.role });

  return res.json({
    token,
    user: { id: user.id, name: user.name, email: user.email, role: user.role },
  });
});

router.get("/me", requireAuth, (req: AuthRequest, res) => {
  const user = db
    .prepare("SELECT id, name, email, role, created_at FROM users WHERE id = ?")
    .get(req.user!.userId) as Omit<UserRecord, "password_hash"> | undefined;

  if (!user) {
    return res.status(404).json({ message: "User not found" });
  }

  return res.json(user);
});

export default router;
