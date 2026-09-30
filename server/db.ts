import { and, asc, eq, lt, sql } from "drizzle-orm";
import { drizzle } from "drizzle-orm/mysql2";
import {
  scoreboardPlayers,
  type InsertScoreboardPlayer,
  type InsertUser,
  users,
} from "../drizzle/schema";
import { ENV } from "./_core/env";

let _db: ReturnType<typeof drizzle> | null = null;

// Lazily create the drizzle instance so local tooling can run without a DB.
export async function getDb() {
  if (!_db && process.env.DATABASE_URL) {
    try {
      _db = drizzle(process.env.DATABASE_URL);
    } catch (error) {
      console.warn("[Database] Failed to connect:", error);
      _db = null;
    }
  }
  return _db;
}

export async function upsertUser(user: InsertUser): Promise<void> {
  if (!user.openId) {
    throw new Error("User openId is required for upsert");
  }

  const db = await getDb();
  if (!db) {
    throw new Error("Database is not available");
  }

  try {
    const values: InsertUser = { openId: user.openId };
    const updateSet: Record<string, unknown> = {};
    const textFields = ["name", "email", "loginMethod"] as const;
    type TextField = (typeof textFields)[number];

    const assignNullable = (field: TextField) => {
      const value = user[field];
      if (value === undefined) return;
      const normalized = value ?? null;
      values[field] = normalized;
      updateSet[field] = normalized;
    };

    textFields.forEach(assignNullable);

    if (user.lastSignedIn !== undefined) {
      values.lastSignedIn = user.lastSignedIn;
      updateSet.lastSignedIn = user.lastSignedIn;
    }
    if (user.role !== undefined) {
      values.role = user.role;
      updateSet.role = user.role;
    } else if (user.openId === ENV.ownerOpenId) {
      values.role = "admin";
      updateSet.role = "admin";
    }

    if (!values.lastSignedIn) values.lastSignedIn = new Date();
    if (Object.keys(updateSet).length === 0) updateSet.lastSignedIn = new Date();

    await db.insert(users).values(values).onDuplicateKeyUpdate({ set: updateSet });
  } catch (error) {
    console.error("[Database] Failed to upsert user:", error);
    throw error;
  }
}

export async function getUserByOpenId(openId: string) {
  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot get user: database not available");
    return undefined;
  }

  const result = await db.select().from(users).where(eq(users.openId, openId)).limit(1);
  return result.length > 0 ? result[0] : undefined;
}

export async function getScoreboardPlayers() {
  const db = await getDb();
  if (!db) throw new Error("Database is not available");

  const existing = await db.select().from(scoreboardPlayers).orderBy(asc(scoreboardPlayers.slot));
  if (existing.length === 0) {
    await db.insert(scoreboardPlayers).values([
      { slot: 1, name: "ผู้เล่น 1", imageUrl: null, score: 0 },
      { slot: 2, name: "ผู้เล่น 2", imageUrl: null, score: 0 },
      { slot: 3, name: "ผู้เล่น 3", imageUrl: null, score: 0 },
      { slot: 4, name: "ผู้เล่น 4", imageUrl: null, score: 0 },
    ]).onDuplicateKeyUpdate({ set: { slot: sql`${scoreboardPlayers.slot}` } });
    return db.select().from(scoreboardPlayers).orderBy(asc(scoreboardPlayers.slot));
  }

  return existing;
}

export async function addScoreboardPoint(playerId: number) {
  const db = await getDb();
  if (!db) throw new Error("Database is not available");

  // The WHERE clause makes the increment atomic and prevents scores above 10.
  await db
    .update(scoreboardPlayers)
    .set({ score: sql`${scoreboardPlayers.score} + 1` })
    .where(and(eq(scoreboardPlayers.id, playerId), lt(scoreboardPlayers.score, 10)));

  const [player] = await db
    .select()
    .from(scoreboardPlayers)
    .where(eq(scoreboardPlayers.id, playerId))
    .limit(1);

  return player;
}

export async function updateScoreboardPlayer(
  playerId: number,
  values: Pick<InsertScoreboardPlayer, "name" | "imageUrl">
) {
  const db = await getDb();
  if (!db) throw new Error("Database is not available");

  await db
    .update(scoreboardPlayers)
    .set({
      name: values.name,
      imageUrl: values.imageUrl || null,
    })
    .where(eq(scoreboardPlayers.id, playerId));

  const [player] = await db
    .select()
    .from(scoreboardPlayers)
    .where(eq(scoreboardPlayers.id, playerId))
    .limit(1);

  return player;
}
