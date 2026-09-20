import { sql } from "drizzle-orm";
import {
  index,
  integer,
  sqliteTable,
  text,
  uniqueIndex,
} from "drizzle-orm/sqlite-core";

const createdAt = () =>
  integer("createdAt", { mode: "timestamp" })
    .notNull()
    .default(sql`(unixepoch())`);

const updatedAt = () =>
  integer("updatedAt", { mode: "timestamp" })
    .notNull()
    .default(sql`(unixepoch())`);

export const users = sqliteTable(
  "users",
  {
    id: integer("id").primaryKey({ autoIncrement: true }),
    openId: text("openId").notNull(),
    name: text("name"),
    email: text("email"),
    loginMethod: text("loginMethod"),
    role: text("role", { enum: ["user", "admin"] }).notNull(),
    school: text("school"),
    major: text("major"),
    classYear: text("classYear"),
    hometown: text("hometown"),
    club: text("club"),
    targetGroup: text("targetGroup"),
    targetFirm: text("targetFirm"),
    targetIndustry: text("targetIndustry", {
      enum: ["investment_banking", "venture_capital", "consulting"],
    }),
    recruitingSeason: text("recruitingSeason"),
    recruitingRegion: text("recruitingRegion", {
      enum: ["us", "uk", "europe", "hong_kong", "other"],
    }),
    onboardingCompleted: integer("onboardingCompleted", { mode: "boolean" })
      .notNull()
      .default(false),
    createdAt: createdAt(),
    updatedAt: updatedAt(),
    lastSignedIn: integer("lastSignedIn", { mode: "timestamp" })
      .notNull()
      .default(sql`(unixepoch())`),
  },
  (table) => [uniqueIndex("idx_users_open_id").on(table.openId)],
);

export type User = typeof users.$inferSelect;
export type InsertUser = typeof users.$inferInsert;

export const contacts = sqliteTable(
  "contacts",
  {
    id: integer("id").primaryKey({ autoIncrement: true }),
    userId: integer("userId")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    name: text("name").notNull(),
    email: text("email"),
    linkedinUrl: text("linkedinUrl"),
    school: text("school"),
    major: text("major"),
    club: text("club"),
    hometown: text("hometown"),
    firm: text("firm"),
    bankingGroup: text("bankingGroup"),
    industry: text("industry"),
    role: text("role"),
    notes: text("notes"),
    status: text("status", {
      enum: [
        "not_started",
        "reached_out",
        "chatted",
        "following_up",
        "closed",
      ],
    }).notNull(),
    isDemo: integer("isDemo", { mode: "boolean" }).notNull().default(false),
    lastContactedAt: integer("lastContactedAt", { mode: "timestamp" }),
    createdAt: createdAt(),
    updatedAt: updatedAt(),
  },
  (table) => [
    index("idx_contacts_user_created").on(table.userId, table.createdAt),
    index("idx_contacts_user_status").on(table.userId, table.status),
  ],
);

export type Contact = typeof contacts.$inferSelect;
export type InsertContact = typeof contacts.$inferInsert;

export const coffeeChats = sqliteTable(
  "coffee_chats",
  {
    id: integer("id").primaryKey({ autoIncrement: true }),
    userId: integer("userId")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    contactId: integer("contactId")
      .notNull()
      .references(() => contacts.id, { onDelete: "cascade" }),
    chatDate: integer("chatDate", { mode: "timestamp" }),
    transcriptText: text("transcriptText"),
    audioFileKey: text("audioFileKey"),
    audioFileUrl: text("audioFileUrl"),
    transcriptionStatus: text("transcriptionStatus", {
      enum: ["pending", "processing", "done", "error"],
    }).notNull(),
    notes: text("notes"),
    isDemo: integer("isDemo", { mode: "boolean" }).notNull().default(false),
    createdAt: createdAt(),
    updatedAt: updatedAt(),
  },
  (table) => [
    index("idx_chats_user_created").on(table.userId, table.createdAt),
    index("idx_chats_contact").on(table.contactId),
  ],
);

export type CoffeeChat = typeof coffeeChats.$inferSelect;
export type InsertCoffeeChat = typeof coffeeChats.$inferInsert;

export const takeaways = sqliteTable(
  "takeaways",
  {
    id: integer("id").primaryKey({ autoIncrement: true }),
    chatId: integer("chatId")
      .notNull()
      .references(() => coffeeChats.id, { onDelete: "cascade" }),
    userId: integer("userId")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    category: text("category", {
      enum: [
        "Industry",
        "Firm",
        "Group",
        "Recruiting",
        "Technical Prep",
        "Personal Growth",
        "Referral Signal",
        "Next Person To Meet",
      ],
    }).notNull(),
    content: text("content").notNull(),
    isKeyInsight: integer("isKeyInsight", { mode: "boolean" })
      .notNull()
      .default(false),
    isDemo: integer("isDemo", { mode: "boolean" }).notNull().default(false),
    createdAt: createdAt(),
  },
  (table) => [
    index("idx_takeaways_user_category").on(table.userId, table.category),
    index("idx_takeaways_chat").on(table.chatId),
  ],
);

export type Takeaway = typeof takeaways.$inferSelect;
export type InsertTakeaway = typeof takeaways.$inferInsert;

export const emailDrafts = sqliteTable(
  "email_drafts",
  {
    id: integer("id").primaryKey({ autoIncrement: true }),
    userId: integer("userId")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    contactId: integer("contactId")
      .notNull()
      .references(() => contacts.id, { onDelete: "cascade" }),
    chatId: integer("chatId").references(() => coffeeChats.id, {
      onDelete: "set null",
    }),
    type: text("type", {
      enum: ["cold_outreach", "follow_up", "thank_you", "referral_ask"],
    }).notNull(),
    subject: text("subject"),
    body: text("body").notNull(),
    status: text("status", { enum: ["draft", "approved", "sent"] })
      .notNull(),
    isDemo: integer("isDemo", { mode: "boolean" }).notNull().default(false),
    createdAt: createdAt(),
    updatedAt: updatedAt(),
  },
  (table) => [
    index("idx_email_drafts_user_created").on(table.userId, table.createdAt),
    index("idx_email_drafts_contact").on(table.contactId),
  ],
);

export type EmailDraft = typeof emailDrafts.$inferSelect;
export type InsertEmailDraft = typeof emailDrafts.$inferInsert;

export const recommendations = sqliteTable(
  "recommendations",
  {
    id: integer("id").primaryKey({ autoIncrement: true }),
    userId: integer("userId")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    contactId: integer("contactId")
      .notNull()
      .references(() => contacts.id, { onDelete: "cascade" }),
    reason: text("reason").notNull(),
    priority: text("priority", { enum: ["high", "medium", "low"] })
      .notNull(),
    sourceType: text("sourceType", {
      enum: ["gap_analysis", "mentioned_in_chat", "strong_background"],
    }).notNull(),
    sourceChatId: integer("sourceChatId").references(() => coffeeChats.id, {
      onDelete: "set null",
    }),
    isDemo: integer("isDemo", { mode: "boolean" }).notNull().default(false),
    createdAt: createdAt(),
  },
  (table) => [index("idx_recommendations_user").on(table.userId)],
);

export type Recommendation = typeof recommendations.$inferSelect;
export type InsertRecommendation = typeof recommendations.$inferInsert;

export const recruitingTimelines = sqliteTable(
  "recruiting_timelines",
  {
    id: integer("id").primaryKey({ autoIncrement: true }),
    industry: text("industry", {
      enum: [
        "investment_banking",
        "venture_capital",
        "consulting",
        "private_equity",
        "asset_management",
        "sales_trading",
        "quant_finance",
        "corporate_finance",
        "public_accounting",
        "commercial_real_estate",
      ],
    }).notNull(),
    title: text("title").notNull(),
    content: text("content").notNull(),
    sourceUrl: text("sourceUrl"),
    fetchedAt: integer("fetchedAt", { mode: "timestamp" })
      .notNull()
      .default(sql`(unixepoch())`),
    createdAt: createdAt(),
  },
  (table) => [
    uniqueIndex("idx_recruiting_timelines_industry").on(table.industry),
  ],
);

export type RecruitingTimeline = typeof recruitingTimelines.$inferSelect;
export type InsertRecruitingTimeline = typeof recruitingTimelines.$inferInsert;
