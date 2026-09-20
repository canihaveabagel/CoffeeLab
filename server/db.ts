import { env } from "cloudflare:workers";
import { and, desc, eq, like, or, sql } from "drizzle-orm";
import { drizzle } from "drizzle-orm/d1";
import * as schema from "../drizzle/schema";
import {
  CoffeeChat,
  Contact,
  EmailDraft,
  InsertCoffeeChat,
  InsertContact,
  InsertEmailDraft,
  InsertRecommendation,
  InsertTakeaway,
  InsertUser,
  InsertRecruitingTimeline,
  Recommendation,
  Takeaway,
  coffeeChats,
  contacts,
  emailDrafts,
  recommendations,
  recruitingTimelines,
  takeaways,
  users,
} from "../drizzle/schema";
let _db: ReturnType<typeof drizzle> | null = null;
let schemaReady: Promise<void> | null = null;

const schemaStatements = [
  `CREATE TABLE IF NOT EXISTS users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    openId TEXT NOT NULL UNIQUE,
    name TEXT,
    email TEXT,
    loginMethod TEXT,
    role TEXT NOT NULL,
    school TEXT,
    major TEXT,
    classYear TEXT,
    hometown TEXT,
    club TEXT,
    targetGroup TEXT,
    targetFirm TEXT,
    targetIndustry TEXT,
    recruitingSeason TEXT,
    onboardingCompleted INTEGER NOT NULL DEFAULT 0,
    createdAt INTEGER NOT NULL DEFAULT (unixepoch()),
    updatedAt INTEGER NOT NULL DEFAULT (unixepoch()),
    lastSignedIn INTEGER NOT NULL DEFAULT (unixepoch())
  )`,
  `CREATE TABLE IF NOT EXISTS contacts (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    userId INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    email TEXT,
    linkedinUrl TEXT,
    school TEXT,
    major TEXT,
    club TEXT,
    hometown TEXT,
    firm TEXT,
    bankingGroup TEXT,
    industry TEXT,
    role TEXT,
    notes TEXT,
    status TEXT NOT NULL,
    isDemo INTEGER NOT NULL DEFAULT 0,
    lastContactedAt INTEGER,
    createdAt INTEGER NOT NULL DEFAULT (unixepoch()),
    updatedAt INTEGER NOT NULL DEFAULT (unixepoch())
  )`,
  `CREATE TABLE IF NOT EXISTS coffee_chats (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    userId INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    contactId INTEGER NOT NULL REFERENCES contacts(id) ON DELETE CASCADE,
    chatDate INTEGER,
    transcriptText TEXT,
    audioFileKey TEXT,
    audioFileUrl TEXT,
    transcriptionStatus TEXT NOT NULL,
    notes TEXT,
    isDemo INTEGER NOT NULL DEFAULT 0,
    createdAt INTEGER NOT NULL DEFAULT (unixepoch()),
    updatedAt INTEGER NOT NULL DEFAULT (unixepoch())
  )`,
  `CREATE TABLE IF NOT EXISTS takeaways (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    chatId INTEGER NOT NULL REFERENCES coffee_chats(id) ON DELETE CASCADE,
    userId INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    category TEXT NOT NULL,
    content TEXT NOT NULL,
    isKeyInsight INTEGER NOT NULL DEFAULT 0,
    isDemo INTEGER NOT NULL DEFAULT 0,
    createdAt INTEGER NOT NULL DEFAULT (unixepoch())
  )`,
  `CREATE TABLE IF NOT EXISTS email_drafts (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    userId INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    contactId INTEGER NOT NULL REFERENCES contacts(id) ON DELETE CASCADE,
    chatId INTEGER REFERENCES coffee_chats(id) ON DELETE SET NULL,
    type TEXT NOT NULL,
    subject TEXT,
    body TEXT NOT NULL,
    status TEXT NOT NULL,
    isDemo INTEGER NOT NULL DEFAULT 0,
    createdAt INTEGER NOT NULL DEFAULT (unixepoch()),
    updatedAt INTEGER NOT NULL DEFAULT (unixepoch())
  )`,
  `CREATE TABLE IF NOT EXISTS recommendations (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    userId INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    contactId INTEGER NOT NULL REFERENCES contacts(id) ON DELETE CASCADE,
    reason TEXT NOT NULL,
    priority TEXT NOT NULL,
    sourceType TEXT NOT NULL,
    sourceChatId INTEGER REFERENCES coffee_chats(id) ON DELETE SET NULL,
    isDemo INTEGER NOT NULL DEFAULT 0,
    createdAt INTEGER NOT NULL DEFAULT (unixepoch())
  )`,
  `CREATE TABLE IF NOT EXISTS recruiting_timelines (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    industry TEXT NOT NULL UNIQUE,
    title TEXT NOT NULL,
    content TEXT NOT NULL,
    sourceUrl TEXT,
    fetchedAt INTEGER NOT NULL DEFAULT (unixepoch()),
    createdAt INTEGER NOT NULL DEFAULT (unixepoch())
  )`,
  "CREATE INDEX IF NOT EXISTS idx_contacts_user_created ON contacts(userId, createdAt)",
  "CREATE INDEX IF NOT EXISTS idx_contacts_user_status ON contacts(userId, status)",
  "CREATE INDEX IF NOT EXISTS idx_chats_user_created ON coffee_chats(userId, createdAt)",
  "CREATE INDEX IF NOT EXISTS idx_chats_contact ON coffee_chats(contactId)",
  "CREATE INDEX IF NOT EXISTS idx_takeaways_user_category ON takeaways(userId, category)",
  "CREATE INDEX IF NOT EXISTS idx_takeaways_chat ON takeaways(chatId)",
  "CREATE INDEX IF NOT EXISTS idx_email_drafts_user_created ON email_drafts(userId, createdAt)",
  "CREATE INDEX IF NOT EXISTS idx_email_drafts_contact ON email_drafts(contactId)",
  "CREATE INDEX IF NOT EXISTS idx_recommendations_user ON recommendations(userId)",
];

async function ensureSchema() {
  if (!schemaReady) {
    schemaReady = env.DB.batch(
      schemaStatements.map((statement) => env.DB.prepare(statement)),
    ).then(() => undefined);
  }
  await schemaReady;
}

export async function getDb() {
  if (!env.DB) {
    throw new Error("Cloudflare D1 binding DB is unavailable");
  }
  if (!_db) {
    _db = drizzle(env.DB, { schema });
  }
  await ensureSchema();
  return _db;
}

// ─── Users ────────────────────────────────────────────────────────────────────

export async function upsertUser(user: InsertUser): Promise<void> {
  if (!user.openId) throw new Error("User openId is required for upsert");
  const db = await getDb();
  try {
    const values: InsertUser = {
      openId: user.openId,
      role: user.role ?? "user",
    };
    const updateSet: Partial<InsertUser> = {};
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
    if (user.lastSignedIn !== undefined) { values.lastSignedIn = user.lastSignedIn; updateSet.lastSignedIn = user.lastSignedIn; }
    if (user.role !== undefined) { values.role = user.role; updateSet.role = user.role; }
    if (!values.lastSignedIn) values.lastSignedIn = new Date();
    if (Object.keys(updateSet).length === 0) updateSet.lastSignedIn = new Date();
    updateSet.updatedAt = new Date();
    await db
      .insert(users)
      .values(values)
      .onConflictDoUpdate({ target: users.openId, set: updateSet });
  } catch (error) {
    console.error("[Database] Failed to upsert user:", error);
    throw error;
  }
}

export async function getUserByOpenId(openId: string) {
  const db = await getDb();
  if (!db) return undefined;
  const result = await db.select().from(users).where(eq(users.openId, openId)).limit(1);
  return result.length > 0 ? result[0] : undefined;
}

export async function updateUserBackground(
  userId: number,
  data: {
    school?: string;
    major?: string;
    hometown?: string;
    club?: string;
    targetGroup?: string;
    targetFirm?: string;
    classYear?: string;
    targetIndustry?: "investment_banking" | "venture_capital" | "consulting";
    recruitingSeason?: string;
    onboardingCompleted?: boolean;
  }
) {
  const db = await getDb();
  await db
    .update(users)
    .set({ ...data, updatedAt: new Date() })
    .where(eq(users.id, userId));
}

// ─── Contacts ─────────────────────────────────────────────────────────────────

export async function listContacts(
  userId: number,
  opts: {
    search?: string;
    status?: string;
    firm?: string;
    group?: string;
    sortBy?: string;
    sortDir?: "asc" | "desc";
    limit?: number;
    offset?: number;
    includeDemo?: boolean;
  } = {}
) {
  const db = await getDb();
  if (!db) return { contacts: [], total: 0 };

  const {
    search,
    status,
    firm,
    group,
    sortBy = "createdAt",
    sortDir = "desc",
    limit = 50,
    offset = 0,
    includeDemo: _includeDemo = false,
  } = opts;

  const conditions = [eq(contacts.userId, userId)];

  if (search) {
    const searchCondition = or(
      like(contacts.name, `%${search}%`),
      like(contacts.firm, `%${search}%`),
      like(contacts.email, `%${search}%`),
      like(contacts.bankingGroup, `%${search}%`),
    );
    if (searchCondition) conditions.push(searchCondition);
  }
  if (status) conditions.push(eq(contacts.status, status as Contact["status"]));
  if (firm) conditions.push(like(contacts.firm, `%${firm}%`));
  if (group) conditions.push(like(contacts.bankingGroup, `%${group}%`));

  const whereClause = conditions.length > 0 ? and(...conditions) : undefined;

  const orderCol =
    sortBy === "name" ? contacts.name :
    sortBy === "firm" ? contacts.firm :
    sortBy === "status" ? contacts.status :
    contacts.createdAt;

  const orderFn = sortDir === "asc" ? orderCol : desc(orderCol);

  const rows = await db
    .select()
    .from(contacts)
    .where(whereClause)
    .orderBy(orderFn)
    .limit(limit)
    .offset(offset);

  const countResult = await db
    .select({ count: sql<number>`count(*)` })
    .from(contacts)
    .where(whereClause);

  return { contacts: rows, total: Number(countResult[0]?.count ?? 0) };
}

export async function getContact(id: number, userId: number) {
  const db = await getDb();
  if (!db) return undefined;
  const result = await db
    .select()
    .from(contacts)
    .where(and(eq(contacts.id, id), eq(contacts.userId, userId)))
    .limit(1);
  return result[0];
}

export async function createContact(data: InsertContact) {
  const db = await getDb();
  const result = await db
    .insert(contacts)
    .values({ status: "not_started", ...data })
    .returning({ id: contacts.id });
  return { insertId: result[0]?.id ?? 0 };
}

export async function updateContact(id: number, data: Partial<InsertContact>) {
  const db = await getDb();
  await db
    .update(contacts)
    .set({ ...data, updatedAt: new Date() })
    .where(eq(contacts.id, id));
}

export async function deleteContact(id: number) {
  const db = await getDb();
  if (!db) throw new Error("DB unavailable");
  await db.delete(contacts).where(eq(contacts.id, id));
}

export async function deleteAllContacts(userId: number) {
  const db = await getDb();
  if (!db) throw new Error("DB unavailable");
  await db.delete(contacts).where(eq(contacts.userId, userId));
}

export async function bulkInsertContacts(data: InsertContact[]) {
  const db = await getDb();
  if (!db) throw new Error("DB unavailable");
  if (data.length === 0) return;
  for (let i = 0; i < data.length; i += 50) {
    await db
      .insert(contacts)
      .values(data.slice(i, i + 50).map(row => ({ status: "not_started" as const, ...row })));
  }
}

// ─── Coffee Chats ─────────────────────────────────────────────────────────────

export async function listCoffeeChats(userId: number, contactId?: number, limit?: number) {
  const db = await getDb();
  if (!db) return [];
  const conditions = [eq(coffeeChats.userId, userId)];
  if (contactId) conditions.push(eq(coffeeChats.contactId, contactId));
  const rows = await db
    .select({
      id: coffeeChats.id,
      userId: coffeeChats.userId,
      contactId: coffeeChats.contactId,
      chatDate: coffeeChats.chatDate,
      transcriptText: coffeeChats.transcriptText,
      audioFileKey: coffeeChats.audioFileKey,
      audioFileUrl: coffeeChats.audioFileUrl,
      transcriptionStatus: coffeeChats.transcriptionStatus,
      notes: coffeeChats.notes,
      isDemo: coffeeChats.isDemo,
      createdAt: coffeeChats.createdAt,
      updatedAt: coffeeChats.updatedAt,
      contactName: contacts.name,
      contactFirm: contacts.firm,
      contactGroup: contacts.bankingGroup,
    })
    .from(coffeeChats)
    .leftJoin(contacts, eq(coffeeChats.contactId, contacts.id))
    .where(and(...conditions))
    .orderBy(desc(coffeeChats.createdAt))
    .limit(limit ?? 200);
  return rows;
}

export async function getCoffeeChat(id: number, userId: number) {
  const db = await getDb();
  if (!db) return undefined;
  const result = await db
    .select()
    .from(coffeeChats)
    .where(and(eq(coffeeChats.id, id), eq(coffeeChats.userId, userId)))
    .limit(1);
  return result[0];
}

export async function createCoffeeChat(data: InsertCoffeeChat) {
  const db = await getDb();
  const result = await db
    .insert(coffeeChats)
    .values({ transcriptionStatus: "pending", ...data })
    .returning({ id: coffeeChats.id });
  return { insertId: result[0]?.id ?? 0 };
}

export async function updateCoffeeChat(id: number, data: Partial<InsertCoffeeChat>) {
  const db = await getDb();
  await db
    .update(coffeeChats)
    .set({ ...data, updatedAt: new Date() })
    .where(eq(coffeeChats.id, id));
}

// ─── Takeaways ────────────────────────────────────────────────────────────────

export async function listTakeaways(chatId: number, userId: number) {
  const db = await getDb();
  if (!db) return [];
  return db
    .select()
    .from(takeaways)
    .where(and(eq(takeaways.chatId, chatId), eq(takeaways.userId, userId)))
    .orderBy(takeaways.category);
}

export async function listAllTakeaways(userId: number) {
  const db = await getDb();
  if (!db) return [];
  return db
    .select({
      id: takeaways.id,
      chatId: takeaways.chatId,
      userId: takeaways.userId,
      category: takeaways.category,
      content: takeaways.content,
      isKeyInsight: takeaways.isKeyInsight,
      isDemo: takeaways.isDemo,
      createdAt: takeaways.createdAt,
      contactName: contacts.name,
      contactFirm: contacts.firm,
      contactGroup: contacts.bankingGroup,
      chatDate: coffeeChats.chatDate,
    })
    .from(takeaways)
    .leftJoin(coffeeChats, eq(takeaways.chatId, coffeeChats.id))
    .leftJoin(contacts, eq(coffeeChats.contactId, contacts.id))
    .where(eq(takeaways.userId, userId))
    .orderBy(takeaways.category, desc(takeaways.createdAt));
}

export async function bulkInsertTakeaways(data: InsertTakeaway[]) {
  const db = await getDb();
  if (!db) throw new Error("DB unavailable");
  if (data.length === 0) return;
  await db.insert(takeaways).values(data);
}

export async function deleteTakeawaysByChatId(chatId: number) {
  const db = await getDb();
  if (!db) return;
  await db.delete(takeaways).where(eq(takeaways.chatId, chatId));
}

export async function updateTakeaway(id: number, data: { content?: string; category?: typeof takeaways.$inferSelect.category; isKeyInsight?: boolean }) {
  const db = await getDb();
  if (!db) throw new Error("DB unavailable");
  await db.update(takeaways).set(data).where(eq(takeaways.id, id));
}

// ─── Email Drafts ─────────────────────────────────────────────────────────────

export async function listEmailDrafts(userId: number, contactId?: number) {
  const db = await getDb();
  if (!db) return [];
  const conditions = [eq(emailDrafts.userId, userId)];
  if (contactId) conditions.push(eq(emailDrafts.contactId, contactId));
  return db
    .select()
    .from(emailDrafts)
    .where(and(...conditions))
    .orderBy(desc(emailDrafts.createdAt));
}

export async function getEmailDraft(id: number, userId: number) {
  const db = await getDb();
  if (!db) return undefined;
  const result = await db
    .select()
    .from(emailDrafts)
    .where(and(eq(emailDrafts.id, id), eq(emailDrafts.userId, userId)))
    .limit(1);
  return result[0];
}

export async function createEmailDraft(data: InsertEmailDraft) {
  const db = await getDb();
  const result = await db
    .insert(emailDrafts)
    .values({ status: "draft", ...data })
    .returning({ id: emailDrafts.id });
  return { insertId: result[0]?.id ?? 0 };
}

export async function updateEmailDraft(id: number, data: Partial<InsertEmailDraft>) {
  const db = await getDb();
  await db
    .update(emailDrafts)
    .set({ ...data, updatedAt: new Date() })
    .where(eq(emailDrafts.id, id));
}

// ─── Recommendations ──────────────────────────────────────────────────────────

export async function listRecommendations(userId: number) {
  const db = await getDb();
  if (!db) return [];
  return db
    .select({
      id: recommendations.id,
      userId: recommendations.userId,
      contactId: recommendations.contactId,
      reason: recommendations.reason,
      priority: recommendations.priority,
      sourceType: recommendations.sourceType,
      sourceChatId: recommendations.sourceChatId,
      isDemo: recommendations.isDemo,
      createdAt: recommendations.createdAt,
      contactName: contacts.name,
      contactFirm: contacts.firm,
      contactGroup: contacts.bankingGroup,
      contactRole: contacts.role,
      contactStatus: contacts.status,
    })
    .from(recommendations)
    .leftJoin(contacts, eq(recommendations.contactId, contacts.id))
    .where(eq(recommendations.userId, userId))
    .orderBy(recommendations.priority, desc(recommendations.createdAt));
}

export async function bulkInsertRecommendations(data: InsertRecommendation[]) {
  const db = await getDb();
  if (!db) throw new Error("DB unavailable");
  if (data.length === 0) return;
  await db.delete(recommendations).where(eq(recommendations.userId, data[0]!.userId));
  await db.insert(recommendations).values(
    data.map(row => ({
      priority: "medium" as const,
      sourceType: "gap_analysis" as const,
      ...row,
    })),
  );
}

// ─── Recruiting Timelines ─────────────────────────────────────────────────────

export async function getRecruitingTimeline(industry: string) {
  const db = await getDb();
  if (!db) return null;
  const result = await db
    .select()
    .from(recruitingTimelines)
    .where(eq(recruitingTimelines.industry, industry as typeof recruitingTimelines.$inferSelect.industry))
    .orderBy(desc(recruitingTimelines.fetchedAt))
    .limit(1);
  return result[0] ?? null;
}

export async function upsertRecruitingTimeline(data: InsertRecruitingTimeline) {
  const db = await getDb();
  if (!db) throw new Error("DB unavailable");
  // Delete old entry for this industry and insert fresh
  await db.delete(recruitingTimelines).where(eq(recruitingTimelines.industry, data.industry));
  await db.insert(recruitingTimelines).values(data);
}

// ─── Dashboard Stats ──────────────────────────────────────────────────────────

export async function getDashboardStats(userId: number) {
  const db = await getDb();
  if (!db) return null;

  const totalContacts = await db
    .select({ count: sql<number>`count(*)` })
    .from(contacts)
    .where(eq(contacts.userId, userId));

  const chatted = await db
    .select({ count: sql<number>`count(*)` })
    .from(contacts)
    .where(
      and(
        eq(contacts.userId, userId),
        eq(contacts.status, "chatted")
      )
    );

  const followingUp = await db
    .select({ count: sql<number>`count(*)` })
    .from(contacts)
    .where(
      and(
        eq(contacts.userId, userId),
        eq(contacts.status, "following_up")
      )
    );

  const totalChats = await db
    .select({ count: sql<number>`count(*)` })
    .from(coffeeChats)
    .where(eq(coffeeChats.userId, userId));

  const recentContacts = await db
    .select()
    .from(contacts)
    .where(eq(contacts.userId, userId))
    .orderBy(desc(contacts.createdAt))
    .limit(5);

  return {
    totalContacts: Number(totalContacts[0]?.count ?? 0),
    chatsCompleted: Number(totalChats[0]?.count ?? 0),
    followUpsDue: Number(followingUp[0]?.count ?? 0),
    chatted: Number(chatted[0]?.count ?? 0),
    recentContacts,
  };
}
