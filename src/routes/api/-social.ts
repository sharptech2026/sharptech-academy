import { createServerFn } from "@tanstack/react-start";
import { authMiddleware } from "@/lib/auth/middleware";
import { getSql } from "@/lib/db";
import { z } from "zod";

// Types
export type UserProfile = {
  userId: string;
  displayName: string | null;
  bio: string | null;
  location: string | null;
  website: string | null;
  avatarUrl: string | null;
  createdAt: string;
  updatedAt: string;
};

export type Friendship = {
  id: string;
  requesterId: string;
  addresseeId: string;
  status: "pending" | "accepted" | "blocked";
  createdAt: string;
  requester?: PublicUser;
  addressee?: PublicUser;
};

export type PublicUser = {
  id: string;
  name: string;
  email: string;
  displayName: string | null;
  avatarUrl: string | null;
  xp: number;
  streak: number;
  level: number;
};

export type Activity = {
  id: string;
  userId: string;
  type: string;
  payload: Record<string, unknown>;
  createdAt: string;
  user?: PublicUser;
};

export type LeaderboardEntry = {
  userId: string;
  rank: number;
  xp: number;
  user: PublicUser;
};

export type Notification = {
  id: string;
  type: string;
  title: string;
  message: string | null;
  data: Record<string, unknown>;
  read: boolean;
  createdAt: string;
};

// Validation schemas
const updateProfileSchema = z.object({
  displayName: z.string().max(50).optional(),
  bio: z.string().max(500).optional(),
  location: z.string().max(100).optional(),
  website: z.string().url().max(200).optional().or(z.literal("")),
  avatarUrl: z.string().url().max(500).optional(),
});

const friendRequestSchema = z.object({
  userId: z.string().uuid(),
});

const updateFriendshipSchema = z.object({
  friendshipId: z.string().uuid(),
  action: z.enum(["accept", "decline", "block", "remove"]),
});

const activityQuerySchema = z.object({
  limit: z.coerce.number().min(1).max(50).default(20),
  offset: z.coerce.number().min(0).default(0),
  type: z.string().optional(),
});

const leaderboardQuerySchema = z.object({
  period: z.enum(["weekly", "monthly", "all_time"]).default("weekly"),
  limit: z.coerce.number().min(1).max(100).default(50),
});

const settingsSchema = z.object({
  theme: z.enum(["claro", "noite", "papel"]).optional(),
  soundEnabled: z.boolean().optional(),
  dailyReminderEnabled: z.boolean().optional(),
  dailyReminderTime: z.string().regex(/^([01]\d|2[0-3]):([0-5]\d)$/).optional(),
  language: z.enum(["pt", "en", "fr"]).optional(),
  publicProfile: z.boolean().optional(),
  showOnLeaderboard: z.boolean().optional(),
});

const searchUsersSchema = z.object({
  q: z.string().min(1).max(100),
  limit: z.coerce.number().min(1).max(20).default(10),
});

// Helper functions
async function getPublicUser(userId: string): Promise<PublicUser | null> {
  const sql = await getSql();
  const result = await sql.query<{
    id: string;
    name: string;
    email: string;
    display_name: string | null;
    avatar_url: string | null;
    xp: number | null;
    streak: number | null;
  }>(
    `SELECT u.id, u.name, u.email, up.display_name, up.avatar_url, p.xp, p.streak
     FROM "user" u
     LEFT JOIN user_profiles up ON u.id = up.user_id
     LEFT JOIN progress p ON u.id = p.user_id
     WHERE u.id = $1`,
    [userId],
  );
  if (result.length === 0) return null;
  const row = result[0];
  return {
    id: row.id,
    name: row.name,
    email: row.email,
    displayName: row.display_name,
    avatarUrl: row.avatar_url,
    xp: row.xp || 0,
    streak: row.streak || 0,
    level: Math.floor((row.xp || 0) / 100) + 1,
  };
}

async function ensureProfile(userId: string) {
  const sql = await getSql();
  await sql.query(
    `INSERT INTO user_profiles (user_id) VALUES ($1)
     ON CONFLICT (user_id) DO NOTHING`,
    [userId],
  );
}

async function ensureSettings(userId: string) {
  const sql = await getSql();
  await sql.query(
    `INSERT INTO user_settings (user_id) VALUES ($1)
     ON CONFLICT (user_id) DO NOTHING`,
    [userId],
  );
}

async function createActivity(
  userId: string,
  type: string,
  payload: Record<string, unknown>,
) {
  const sql = await getSql();
  await sql.query(
    `INSERT INTO activities (user_id, type, payload) VALUES ($1, $2, $3)`,
    [userId, type, JSON.stringify(payload)],
  );
}

async function createNotification(
  userId: string,
  type: string,
  title: string,
  message: string | null,
  data: Record<string, unknown> = {},
) {
  const sql = await getSql();
  await sql.query(
    `INSERT INTO notifications (user_id, type, title, message, data) VALUES ($1, $2, $3, $4, $5)`,
    [userId, type, title, message, JSON.stringify(data)],
  );
}

// Server functions
export const getProfile = createServerFn({ method: "GET" })
  .middleware([authMiddleware])
  .validator(() => z.void())
  .handler(async ({ context }) => {
    const userId = context.userId;
    await ensureProfile(userId);

    const sql = await getSql();
    const result = await sql.query<{
      user_id: string;
      display_name: string | null;
      bio: string | null;
      location: string | null;
      website: string | null;
      avatar_url: string | null;
      created_at: string;
      name: string;
      email: string;
      xp: number | null;
      streak: number | null;
      best_streak: number | null;
      friends_count: string | number;
    }>(
      `SELECT up.*, u.name, u.email, p.xp, p.streak, p.best_streak,
              (SELECT COUNT(*) FROM friendships WHERE (requester_id = u.id OR addressee_id = u.id) AND status = 'accepted') as friends_count
       FROM user_profiles up
       JOIN "user" u ON u.id = up.user_id
       LEFT JOIN progress p ON u.id = p.user_id
       WHERE up.user_id = $1`,
      [userId],
    );

    if (result.length === 0) return null;

    const row = result[0];
    return {
      userId: row.user_id,
      name: row.name,
      email: row.email,
      displayName: row.display_name,
      bio: row.bio,
      location: row.location,
      website: row.website,
      avatarUrl: row.avatar_url,
      xp: row.xp || 0,
      streak: row.streak || 0,
      bestStreak: row.best_streak || 0,
      level: Math.floor((row.xp || 0) / 100) + 1,
      friendsCount: parseInt(String(row.friends_count)) || 0,
      joinedAt: row.created_at,
    };
  });

export const updateProfile = createServerFn({ method: "POST" })
  .middleware([authMiddleware])
  .validator(updateProfileSchema)
  .handler(async ({ context, data }) => {
    const userId = context.userId;
    await ensureProfile(userId);

    const fields = Object.keys(data).filter((k) => data[k as keyof typeof data] !== undefined);
    if (fields.length === 0) return { success: true };

    const setClause = fields.map((f, i) => `${f} = $${i + 2}`).join(", ");
    const values = fields.map((f) => data[f as keyof typeof data]);

    const sql = await getSql();
    await sql.query(
      `UPDATE user_profiles SET ${setClause}, updated_at = NOW() WHERE user_id = $1`,
      [userId, ...values],
    );

    return { success: true };
  });

export const searchUsers = createServerFn({ method: "POST" })
  .middleware([authMiddleware])
  .validator(searchUsersSchema)
  .handler(async ({ context, data }) => {
    const userId = context.userId;
    const { q, limit } = data;

    const sql = await getSql();
    const result = await sql.query<{
      id: string;
      name: string;
      email: string;
      display_name: string | null;
      avatar_url: string | null;
      xp: number | null;
      streak: number | null;
    }>(
      `SELECT u.id, u.name, u.email, up.display_name, up.avatar_url, p.xp, p.streak
       FROM "user" u
       LEFT JOIN user_profiles up ON u.id = up.user_id
       LEFT JOIN progress p ON u.id = p.user_id
       WHERE u.id != $1
         AND (u.name ILIKE $2 OR u.email ILIKE $2 OR up.display_name ILIKE $2)
         AND (up.public_profile IS NULL OR up.public_profile = true)
       LIMIT $3`,
      [userId, `%${q}%`, limit],
    );

    return result.map((row) => ({
      id: row.id,
      name: row.name,
      email: row.email,
      displayName: row.display_name,
      avatarUrl: row.avatar_url,
      xp: row.xp || 0,
      streak: row.streak || 0,
      level: Math.floor((row.xp || 0) / 100) + 1,
    }));
  });

export const sendFriendRequest = createServerFn({ method: "POST" })
  .middleware([authMiddleware])
  .validator(friendRequestSchema)
  .handler(async ({ context, data }) => {
    const userId = context.userId;
    const { userId: targetId } = data;

    if (userId === targetId) {
      throw new Error("Não podes adicionar-te a ti mesmo");
    }

    // Check if already friends or pending
    const sql = await getSql();
    const existing = await sql.query(
      `SELECT * FROM friendships
       WHERE (requester_id = $1 AND addressee_id = $2)
          OR (requester_id = $2 AND addressee_id = $1)`,
      [userId, targetId],
    );

    if (existing.length > 0) {
      const rel = existing[0];
      if (rel.status === "accepted") throw new Error("Já são amigos");
      if (rel.status === "pending") throw new Error("Pedido já enviado");
      if (rel.status === "blocked") throw new Error("Não podes enviar pedido");
    }

    await sql.query(
      `INSERT INTO friendships (requester_id, addressee_id, status) VALUES ($1, $2, 'pending')`,
      [userId, targetId],
    );

    // Notify target user
    const me = await getPublicUser(userId);
    await createNotification(
      targetId,
      "friend_request",
      "Novo pedido de amizade",
      `${me?.name || "Alguém"} quer ser teu amigo`,
      { requesterId: userId },
    );

    return { success: true };
  });

export const respondFriendRequest = createServerFn({ method: "POST" })
  .middleware([authMiddleware])
  .validator(updateFriendshipSchema)
  .handler(async ({ context, data }) => {
    const userId = context.userId;
    const { friendshipId, action } = data;

    const sql = await getSql();
    const result = await sql.query<{
      id: string;
      requester_id: string;
      addressee_id: string;
      status: string;
      created_at: string;
      updated_at: string;
    }>(
      `SELECT * FROM friendships WHERE id = $1 AND addressee_id = $2 AND status = 'pending'`,
      [friendshipId, userId],
    );

    if (result.length === 0) {
      throw new Error("Pedido não encontrado");
    }

    const friendship = result[0];

    if (action === "accept") {
      await sql.query(
        `UPDATE friendships SET status = 'accepted', updated_at = NOW() WHERE id = $1`,
        [friendshipId],
      );

      // Notify requester
      const me = await getPublicUser(userId);
      await createNotification(
        friendship.requester_id,
        "friend_accepted",
        "Pedido aceite",
        `${me?.name || "Alguém"} aceitou o teu pedido de amizade`,
        { friendId: userId },
      );
    } else if (action === "decline") {
      await sql.query(`DELETE FROM friendships WHERE id = $1`, [friendshipId]);
    } else if (action === "block") {
      await sql.query(
        `UPDATE friendships SET status = 'blocked', updated_at = NOW() WHERE id = $1`,
        [friendshipId],
      );
    }

    return { success: true };
  });

export const removeFriend = createServerFn({ method: "POST" })
  .middleware([authMiddleware])
  .validator(friendRequestSchema)
  .handler(async ({ context, data }) => {
    const userId = context.userId;
    const { userId: friendId } = data;

    const sql = await getSql();
    await sql.query(
      `DELETE FROM friendships
       WHERE ((requester_id = $1 AND addressee_id = $2) OR (requester_id = $2 AND addressee_id = $1))
         AND status = 'accepted'`,
      [userId, friendId],
    );

    return { success: true };
  });

export const getFriends = createServerFn({ method: "GET" })
  .middleware([authMiddleware])
  .validator(() => z.void())
  .handler(async ({ context }) => {
    const userId = context.userId;

    const sql = await getSql();
    const result = await sql.query<{
      id: string;
      name: string;
      email: string;
      display_name: string | null;
      avatar_url: string | null;
      xp: number | null;
      streak: number | null;
    }>(
      `SELECT u.id, u.name, u.email, up.display_name, up.avatar_url, p.xp, p.streak
       FROM friendships f
       JOIN "user" u ON (u.id = f.requester_id OR u.id = f.addressee_id) AND u.id != $1
       LEFT JOIN user_profiles up ON u.id = up.user_id
       LEFT JOIN progress p ON u.id = p.user_id
       WHERE (f.requester_id = $1 OR f.addressee_id = $1)
         AND f.status = 'accepted'`,
      [userId],
    );

    return result.map((row) => ({
      id: row.id,
      name: row.name,
      email: row.email,
      displayName: row.display_name,
      avatarUrl: row.avatar_url,
      xp: row.xp || 0,
      streak: row.streak || 0,
      level: Math.floor((row.xp || 0) / 100) + 1,
    }));
  });

export const getFriendRequests = createServerFn({ method: "GET" })
  .middleware([authMiddleware])
  .validator(() => z.void())
  .handler(async ({ context }) => {
    const userId = context.userId;

    const sql = await getSql();
    const result = await sql.query<{
      id: string;
      created_at: string;
      user_id: string;
      name: string;
      email: string;
      display_name: string | null;
      avatar_url: string | null;
      xp: number | null;
      streak: number | null;
    }>(
      `SELECT f.id, f.created_at, u.id as user_id, u.name, u.email, up.display_name, up.avatar_url, p.xp, p.streak
       FROM friendships f
       JOIN "user" u ON u.id = f.requester_id
       LEFT JOIN user_profiles up ON u.id = up.user_id
       LEFT JOIN progress p ON u.id = p.user_id
       WHERE f.addressee_id = $1 AND f.status = 'pending'
       ORDER BY f.created_at DESC`,
      [userId],
    );

    return result.map((row) => ({
      id: row.id,
      createdAt: row.created_at,
      user: {
        id: row.user_id,
        name: row.name,
        email: row.email,
        displayName: row.display_name,
        avatarUrl: row.avatar_url,
        xp: row.xp || 0,
        streak: row.streak || 0,
        level: Math.floor((row.xp || 0) / 100) + 1,
      },
    }));
  });

export const getActivities = createServerFn({ method: "POST" })
  .middleware([authMiddleware])
  .validator(activityQuerySchema)
  .handler(async ({ context, data }) => {
    const userId = context.userId;
    const { limit, offset, type } = data;

    // Get user's friends IDs
    const sql = await getSql();
    const friendsResult = await sql.query<{ friend_id: string }>(
      `SELECT CASE WHEN requester_id = $1 THEN addressee_id ELSE requester_id END as friend_id
       FROM friendships
       WHERE (requester_id = $1 OR addressee_id = $1) AND status = 'accepted'`,
      [userId],
    );
    const friendIds = friendsResult.map((r) => r.friend_id);
    const allIds = [userId, ...friendIds];

    if (allIds.length === 1) {
      // Only own activities
      const result = await sql.query<{
        id: string;
        user_id: string;
        type: string;
        payload: string;
        created_at: string;
        name: string;
        email: string;
        display_name: string | null;
        avatar_url: string | null;
      }>(
        `SELECT a.*, u.name, u.email, up.display_name, up.avatar_url
         FROM activities a
         JOIN "user" u ON u.id = a.user_id
         LEFT JOIN user_profiles up ON u.id = up.user_id
         WHERE a.user_id = $1
         ${type ? "AND a.type = $2" : ""}
         ORDER BY a.created_at DESC
         LIMIT $${type ? 3 : 2} OFFSET $${type ? 4 : 3}`,
        type ? [userId, type, limit, offset] : [userId, limit, offset],
      );
      return result.map((row) => ({
        id: row.id,
        userId: row.user_id,
        type: row.type,
        payload: row.payload ? JSON.parse(row.payload) : {},
        createdAt: row.created_at,
        user: {
          id: row.user_id,
          name: row.name,
          email: row.email,
          displayName: row.display_name,
          avatarUrl: row.avatar_url,
          xp: 0,
          streak: 0,
          level: 1,
        },
      }));
    }

    const placeholders = allIds.map((_, i) => `$${i + 2}`).join(", ");
    const params = [userId, ...allIds, limit, offset];

    const result = await sql.query<{
      id: string;
      user_id: string;
      type: string;
      payload: string;
      created_at: string;
      name: string;
      email: string;
      display_name: string | null;
      avatar_url: string | null;
    }>(
      `SELECT a.*, u.name, u.email, up.display_name, up.avatar_url
       FROM activities a
       JOIN "user" u ON u.id = a.user_id
       LEFT JOIN user_profiles up ON u.id = up.user_id
       WHERE a.user_id IN (${placeholders})
       ${type ? `AND a.type = $${allIds.length + 2}` : ""}
       ORDER BY a.created_at DESC
       LIMIT $${allIds.length + (type ? 3 : 2)} OFFSET $${allIds.length + (type ? 4 : 3)}`,
      params,
    );

    return result.map((row) => ({
      id: row.id,
      userId: row.user_id,
      type: row.type,
      payload: row.payload ? JSON.parse(row.payload) : {},
      createdAt: row.created_at,
      user: {
        id: row.user_id,
        name: row.name,
        email: row.email,
        displayName: row.display_name,
        avatarUrl: row.avatar_url,
        xp: 0,
        streak: 0,
        level: 1,
      },
    }));
  });

export const getLeaderboard = createServerFn({ method: "POST" })
  .middleware([authMiddleware])
  .validator(leaderboardQuerySchema)
  .handler(async ({ context, data }) => {
    const { period, limit } = data;
    const userId = context.userId;

    let query: string;
    let params: unknown[];

    const sql = await getSql();

    if (period === "all_time") {
      query = `
        SELECT u.id, u.name, u.email, up.display_name, up.avatar_url, p.xp, p.streak,
               ROW_NUMBER() OVER (ORDER BY p.xp DESC) as rank
        FROM "user" u
        LEFT JOIN user_profiles up ON u.id = up.user_id
        LEFT JOIN progress p ON u.id = p.user_id
        WHERE (up.show_on_leaderboard IS NULL OR up.show_on_leaderboard = true)
        ORDER BY p.xp DESC NULLS LAST
        LIMIT $1
      `;
      params = [limit];
    } else {
      const periodStart = period === "weekly"
        ? "DATE_TRUNC('week', NOW())"
        : "DATE_TRUNC('month', NOW())";

      query = `
        SELECT le.*, u.name, u.email, up.display_name, up.avatar_url, p.streak
        FROM leaderboard_entries le
        JOIN "user" u ON u.id = le.user_id
        LEFT JOIN user_profiles up ON u.id = up.user_id
        LEFT JOIN progress p ON u.id = p.user_id
        WHERE le.period = $1 AND le.period_start = ${periodStart}
        ORDER BY le.xp DESC
        LIMIT $2
      `;
      params = [period, limit];
    }

    const result = await sql.query<{
      id: string;
      user_id: string;
      name: string;
      email: string;
      display_name: string | null;
      avatar_url: string | null;
      xp: number | null;
      streak: number | null;
      rank: number | null;
    }>(query, params);

    const entries = result.map((row, idx) => ({
      userId: row.user_id || row.id,
      rank: row.rank || idx + 1,
      xp: row.xp || 0,
      user: {
        id: row.user_id || row.id,
        name: row.name,
        email: row.email,
        displayName: row.display_name,
        avatarUrl: row.avatar_url,
        xp: row.xp || 0,
        streak: row.streak || 0,
        level: Math.floor((row.xp || 0) / 100) + 1,
      },
    }));

    // Find current user's rank
    let userRank = null;
    if (period === "all_time") {
      const rankResult = await sql.query<{ rank: string }>(
        `SELECT COUNT(*) + 1 as rank FROM progress WHERE xp > (SELECT xp FROM progress WHERE user_id = $1)`,
        [userId],
      );
      userRank = parseInt(rankResult[0]?.rank || "0") || null;
    }

    return { entries, userRank };
  });

export const getNotifications = createServerFn({ method: "GET" })
  .middleware([authMiddleware])
  .validator(() => z.void())
  .handler(async ({ context }) => {
    const userId = context.userId;

    const sql = await getSql();
    const result = await sql.query<{
      id: string;
      type: string;
      title: string;
      message: string | null;
      data: string;
      read: boolean;
      created_at: string;
    }>(
      `SELECT * FROM notifications
       WHERE user_id = $1
       ORDER BY created_at DESC
       LIMIT 50`,
      [userId],
    );

    return result.map((row) => ({
      id: row.id,
      type: row.type,
      title: row.title,
      message: row.message,
      data: row.data ? JSON.parse(row.data) : {},
      read: row.read,
      createdAt: row.created_at,
    }));
  });

export const markNotificationRead = createServerFn({ method: "POST" })
  .middleware([authMiddleware])
  .validator(z.object({ notificationId: z.string().uuid() }))
  .handler(async ({ context, data }) => {
    const userId = context.userId;
    const { notificationId } = data;

    const sql = await getSql();
    await sql.query(
      `UPDATE notifications SET read = true WHERE id = $1 AND user_id = $2`,
      [notificationId, userId],
    );

    return { success: true };
  });

export const getSettings = createServerFn({ method: "GET" })
  .middleware([authMiddleware])
  .validator(() => z.void())
  .handler(async ({ context }) => {
    const userId = context.userId;
    await ensureSettings(userId);

    const sql = await getSql();
    const result = await sql.query<{
      theme: string;
      soundEnabled: boolean;
      dailyReminderEnabled: boolean;
      dailyReminderTime: string;
      language: string;
      publicProfile: boolean;
      showOnLeaderboard: boolean;
    }>(
      `SELECT * FROM user_settings WHERE user_id = $1`,
      [userId],
    );

    return result[0] || {
      theme: "claro",
      soundEnabled: true,
      dailyReminderEnabled: false,
      dailyReminderTime: "19:00",
      language: "pt",
      publicProfile: true,
      showOnLeaderboard: true,
    };
  });

export const updateSettings = createServerFn({ method: "POST" })
  .middleware([authMiddleware])
  .validator(settingsSchema)
  .handler(async ({ context, data }) => {
    const userId = context.userId;
    await ensureSettings(userId);

    const fields = Object.keys(data).filter((k) => data[k as keyof typeof data] !== undefined);
    if (fields.length === 0) return { success: true };

    const setClause = fields.map((f, i) => `${f} = $${i + 2}`).join(", ");
    const values = fields.map((f) => data[f as keyof typeof data]);

    const sql = await getSql();
    await sql.query(
      `UPDATE user_settings SET ${setClause}, updated_at = NOW() WHERE user_id = $1`,
      [userId, ...values],
    );

    return { success: true };
  });

export const getPublicProfile = createServerFn({ method: "POST" })
  .middleware([authMiddleware])
  .validator(z.object({ userId: z.string().uuid() }))
  .handler(async ({ context, data }) => {
    const { userId: targetId } = data;
    const currentUserId = context.userId;

    const sql = await getSql();
    const result = await sql.query<{
      id: string;
      name: string;
      email: string;
      display_name: string | null;
      bio: string | null;
      location: string | null;
      website: string | null;
      avatar_url: string | null;
      xp: number | null;
      streak: number | null;
      best_streak: number | null;
      friends_count: string | number;
      public_profile: boolean | null;
      relationship: string;
    }>(
      `SELECT u.id, u.name, u.email, up.display_name, up.bio, up.location, up.website, up.avatar_url,
              p.xp, p.streak, p.best_streak,
              (SELECT COUNT(*) FROM friendships WHERE (requester_id = u.id OR addressee_id = u.id) AND status = 'accepted') as friends_count,
              CASE WHEN $1 = u.id THEN 'self'
                   WHEN EXISTS (SELECT 1 FROM friendships WHERE ((requester_id = $1 AND addressee_id = u.id) OR (requester_id = u.id AND addressee_id = $1)) AND status = 'accepted') THEN 'friend'
                   WHEN EXISTS (SELECT 1 FROM friendships WHERE requester_id = $1 AND addressee_id = u.id AND status = 'pending') THEN 'request_sent'
                   WHEN EXISTS (SELECT 1 FROM friendships WHERE requester_id = u.id AND addressee_id = $1 AND status = 'pending') THEN 'request_received'
                   ELSE 'none' END as relationship,
              up.public_profile
       FROM "user" u
       LEFT JOIN user_profiles up ON u.id = up.user_id
       LEFT JOIN progress p ON u.id = p.user_id
       WHERE u.id = $2`,
      [currentUserId, targetId],
    );

    if (result.length === 0) return null;

    const row = result[0];
    // Check if profile is public
    if (row.id !== currentUserId && row.public_profile === false) {
      return { error: "Perfil privado" } as const;
    }

    return {
      userId: row.id,
      name: row.name,
      email: row.email,
      displayName: row.display_name,
      bio: row.bio,
      location: row.location,
      website: row.website,
      avatarUrl: row.avatar_url,
      xp: row.xp || 0,
      streak: row.streak || 0,
      bestStreak: row.best_streak || 0,
      level: Math.floor((row.xp || 0) / 100) + 1,
      friendsCount: parseInt(String(row.friends_count)) || 0,
      relationship: row.relationship,
    };
  });