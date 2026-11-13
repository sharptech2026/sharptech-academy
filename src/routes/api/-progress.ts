import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { authMiddleware } from "@/lib/auth/middleware";
import { getSql } from "@/lib/db";

type ServerProgress = {
  name: string;
  onboarded: boolean;
  courseId: "js" | "py" | "cs" | "web" | "sql";
  xp: number;
  dailyXp: number;
  dailyDate: string;
  goal: number;
  streak: number;
  bestStreak: number;
  lastActive: string | null;
  hearts: number;
  heartsDate: string;
  sound: boolean;
  theme: "claro" | "noite" | "papel";
  practiced: Record<string, boolean>;
  completed: Record<string, { correct: number; total: number; perfect: boolean }>;
  mistakes: string[];
  answered: number;
  correctAnswers: number;
  activeDays: string[];
  pendingTrain: boolean;
  unlockedAchievements: string[];
  lastAchievementCheck: Record<string, boolean>;
};

const progressSchema = z.object({
  name: z.string().max(18).optional(),
  courseId: z.enum(["js", "py", "cs", "web", "sql"]).optional(),
  xp: z.number().int().min(0).optional(),
  dailyXp: z.number().int().min(0).optional(),
  dailyDate: z.string().optional(),
  goal: z.number().int().min(10).max(200).optional(),
  streak: z.number().int().min(0).optional(),
  bestStreak: z.number().int().min(0).optional(),
  lastActive: z.string().nullable().optional(),
  hearts: z.number().int().min(0).max(5).optional(),
  heartsDate: z.string().optional(),
  sound: z.boolean().optional(),
  theme: z.enum(["claro", "noite", "papel"]).optional(),
  practiced: z.record(z.string(), z.boolean()).optional(),
  completed: z.record(z.string(), z.object({
    correct: z.number().int().min(0),
    total: z.number().int().min(0),
    perfect: z.boolean(),
  })).optional(),
  mistakes: z.array(z.string()).optional(),
  answered: z.number().int().min(0).optional(),
  correctAnswers: z.number().int().min(0).optional(),
  activeDays: z.array(z.string()).optional(),
  pendingTrain: z.boolean().optional(),
  unlockedAchievements: z.array(z.string()).optional(),
  lastAchievementCheck: z.record(z.string(), z.boolean()).optional(),
});

export const getProgress = createServerFn({ method: "GET" })
  .middleware([authMiddleware])
  .validator(() => z.void())
  .handler(async ({ context }): Promise<ServerProgress | null> => {
    const sql = await getSql();
    const rows = await sql`
      SELECT * FROM progress WHERE user_id = ${context.userId}
    `;
    if (rows.length === 0) {
      return null;
    }
    const row = rows[0] as Record<string, unknown>;
    return {
      name: row.name as string,
      courseId: row.course_id as "js" | "py" | "cs" | "web" | "sql",
      xp: row.xp as number,
      dailyXp: row.daily_xp as number,
      dailyDate: row.daily_date as string,
      goal: row.goal as number,
      streak: row.streak as number,
      bestStreak: row.best_streak as number,
      lastActive: row.last_active as string | null,
      hearts: row.hearts as number,
      heartsDate: row.hearts_date as string,
      sound: row.sound as boolean,
      theme: row.theme as "claro" | "noite" | "papel",
      practiced: row.practiced as Record<string, boolean>,
      completed: row.completed as Record<string, { correct: number; total: number; perfect: boolean }>,
      mistakes: row.mistakes as string[],
      answered: row.answered as number,
      correctAnswers: row.correct_answers as number,
      activeDays: row.active_days as string[],
      pendingTrain: row.pending_train as boolean,
      unlockedAchievements: row.unlocked_achievements as string[],
      lastAchievementCheck: row.last_achievement_check as Record<string, boolean>,
      onboarded: row.onboarded as boolean,
    };
  });

export const upsertProgress = createServerFn({ method: "POST" })
  .middleware([authMiddleware])
  .validator(progressSchema.partial())
  .handler(async ({ context, data }): Promise<{ ok: true }> => {
    const sql = await getSql();
    const updates: string[] = [];
    const values: any[] = [context.userId];
    let paramIndex = 2;

    const fieldMap: Record<string, string> = {
      name: "name",
      courseId: "course_id",
      xp: "xp",
      dailyXp: "daily_xp",
      dailyDate: "daily_date",
      goal: "goal",
      streak: "streak",
      bestStreak: "best_streak",
      lastActive: "last_active",
      hearts: "hearts",
      heartsDate: "hearts_date",
      sound: "sound",
      theme: "theme",
      practiced: "practiced",
      completed: "completed",
      mistakes: "mistakes",
      answered: "answered",
      correctAnswers: "correct_answers",
      activeDays: "active_days",
      pendingTrain: "pending_train",
      unlockedAchievements: "unlocked_achievements",
      lastAchievementCheck: "last_achievement_check",
    };

    for (const [key, dbKey] of Object.entries(fieldMap)) {
      if (data[key as keyof typeof data] !== undefined) {
        updates.push(`"${dbKey}" = $${paramIndex}`);
        values.push(data[key as keyof typeof data]);
        paramIndex++;
      }
    }

    if (updates.length === 0) return { ok: true };

    // Keep INSERT columns aligned with bound values. `updated_at` belongs only
    // in the conflict-update clause because it is generated by the database.
    const insertColumns = updates.map((update) => update.split(" = ")[0]);
    updates.push(`updated_at = CURRENT_TIMESTAMP`);

    const columns = ["user_id", ...insertColumns];
    const placeholders = ["$1", ...values.slice(1).map((_, i) => `$${i + 2}`)];

    await sql.query(
      `INSERT INTO progress (${columns.join(", ")}) VALUES (${placeholders.join(", ")}) ON CONFLICT (user_id) DO UPDATE SET ${updates.join(", ")}`,
      values
    );

    return { ok: true };
  });

export const getCertificates = createServerFn({ method: "GET" })
  .middleware([authMiddleware])
  .validator(() => z.void())
  .handler(async ({ context }): Promise<Array<{ id: string; courseId: string; issuedAt: string; xp: number; completed: Record<string, { correct: number; total: number; perfect: boolean }>; streak: number }>> => {
    const sql = await getSql();
    const rows = await sql`
      SELECT * FROM certificates WHERE user_id = ${context.userId}
    `;
    return rows.map((row) => {
      const r = row as Record<string, unknown>;
      return {
        id: r.id as string,
        courseId: r.course_id as string,
        issuedAt: r.issued_at as string,
        xp: r.xp as number,
        completed: r.completed as Record<string, { correct: number; total: number; perfect: boolean }>,
        streak: r.streak as number,
      };
    });
  });

export const saveCertificate = createServerFn({ method: "POST" })
  .middleware([authMiddleware])
  .validator(z.object({
    id: z.string().min(1).max(128),
    courseId: z.enum(["js", "py", "cs", "web", "sql"]),
    issuedAt: z.string().datetime(),
    xp: z.number().int().min(0).max(2_147_483_647),
    completed: z.record(z.string(), z.object({
      correct: z.number().int().min(0),
      total: z.number().int().min(0),
      perfect: z.boolean(),
    })),
    streak: z.number().int().min(0).max(2_147_483_647),
  }))
  .handler(async ({ context, data }): Promise<{ ok: true }> => {
    const sql = await getSql();
    await sql.query(
      `INSERT INTO certificates (id, user_id, course_id, issued_at, xp, completed, streak)
       VALUES ($1, $2, $3, $4, $5, $6, $7)
       ON CONFLICT (user_id, course_id) DO NOTHING`,
      [data.id, context.userId, data.courseId, data.issuedAt, data.xp, JSON.stringify(data.completed), data.streak]
    );
    return { ok: true };
  });

export const getDailyChallenges = createServerFn({ method: "GET" })
  .middleware([authMiddleware])
  .validator(() => z.void())
  .handler(async ({ context }): Promise<Array<{ id: string; challengeId: string; completedAt: string; xpEarned: number; bonus: boolean }>> => {
    const sql = await getSql();
    const rows = await sql`
      SELECT * FROM daily_challenges WHERE user_id = ${context.userId}
    `;
    return rows.map((row) => {
      const r = row as Record<string, unknown>;
      return {
        id: r.id as string,
        challengeId: r.challenge_id as string,
        completedAt: r.completed_at as string,
        xpEarned: r.xp_earned as number,
        bonus: r.bonus as boolean,
      };
    });
  });

export const markDailyChallenge = createServerFn({ method: "POST" })
  .middleware([authMiddleware])
  .validator(z.object({
    challengeId: z.string().trim().min(1).max(128),
    xpEarned: z.number().int().min(0).max(2_147_483_647),
    bonus: z.boolean(),
  }))
  .handler(async ({ context, data }): Promise<{ ok: true }> => {
    const sql = await getSql();
    await sql.query(
      `INSERT INTO daily_challenges (id, user_id, challenge_id, completed_at, xp_earned, bonus)
       VALUES (gen_random_uuid()::text, $1, $2, CURRENT_TIMESTAMP, $3, $4)
       ON CONFLICT (user_id, challenge_id) DO NOTHING`,
      [context.userId, data.challengeId, data.xpEarned, data.bonus]
    );
    return { ok: true };
  });

export const resetProgressServer = createServerFn({ method: "POST" })
  .middleware([authMiddleware])
  .validator(() => z.void())
  .handler(async ({ context }): Promise<{ ok: true }> => {
    const sql = await getSql();
    await sql`DELETE FROM progress WHERE user_id = ${context.userId}`;
    await sql`DELETE FROM certificates WHERE user_id = ${context.userId}`;
    await sql`DELETE FROM daily_challenges WHERE user_id = ${context.userId}`;
    return { ok: true };
  });