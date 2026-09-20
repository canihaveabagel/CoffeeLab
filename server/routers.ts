import { protectedProcedure, publicProcedure, router } from "./_core/trpc";
import { invokeLLM } from "./_core/llm";
import { uploadAndTranscribe } from "./assemblyai";
import {
  bulkInsertContacts,
  bulkInsertRecommendations,
  bulkInsertTakeaways,
  createCoffeeChat,
  createContact,
  createEmailDraft,
  deleteContact,
  deleteAllContacts,
  deleteTakeawaysByChatId,
  getCoffeeChat,
  getContact,
  getDashboardStats,
  getDb,
  getEmailDraft,
  getRecruitingTimeline,
  getUserByOpenId,
  listAllTakeaways,
  listCoffeeChats,
  listEmailDrafts,
  listRecommendations,
  listTakeaways,
  updateCoffeeChat,
  updateContact,
  updateEmailDraft,
  updateTakeaway,
  updateUserBackground,
  upsertRecruitingTimeline,
  listContacts,
} from "./db";
import { z } from "zod/v4";
import { TRPCError } from "@trpc/server";

// ─── AI Prompts ───────────────────────────────────────────────────────────────

async function generateOutreachEmail(
  contact: { name: string; firm?: string | null; bankingGroup?: string | null; role?: string | null; school?: string | null; hometown?: string | null; club?: string | null; notes?: string | null },
  user: { name?: string | null; school?: string | null; hometown?: string | null; club?: string | null },
  type: "cold_outreach" | "follow_up"
): Promise<{ subject: string; body: string }> {
  // Identify shared background connections
  const sharedConnections: string[] = [];
  if (contact.school && user.school && contact.school.toLowerCase().includes(user.school.toLowerCase().split(" ")[0] ?? "")) {
    sharedConnections.push(`both attended ${contact.school}`);
  }
  if (contact.hometown && user.hometown && contact.hometown.toLowerCase() === user.hometown.toLowerCase()) {
    sharedConnections.push(`both from ${contact.hometown}`);
  }
  if (contact.club && user.club) {
    const contactClub = contact.club.toLowerCase();
    const userClub = user.club.toLowerCase();
    if (contactClub === userClub || contactClub.includes(userClub.split(" ")[0] ?? "") || userClub.includes(contactClub.split(" ")[0] ?? "")) {
      sharedConnections.push(`both members of ${contact.club}`);
    }
  }
  // Check notes for high school alumnus or other special connections
  if (contact.notes?.toLowerCase().includes("high school")) {
    sharedConnections.push("high school alumni connection");
  }

  const sharedConnectionText = sharedConnections.length > 0
    ? `Shared connections (MUST mention in email): ${sharedConnections.join(", ")}`
    : "No direct shared connections found — use their school/firm as the hook instead";

  const prompt = type === "cold_outreach"
    ? `You are an expert IB recruiting coach. Write a concise, highly personalized cold outreach email from a business student to a banker.

Student background:
- Name: ${user.name ?? "Alex"}
- School: ${user.school ?? "University"}
- Hometown: ${user.hometown ?? ""}
- Club: ${user.club ?? ""}

Banker contact:
- Name: ${contact.name}
- Firm: ${contact.firm ?? ""}
- Group: ${contact.bankingGroup ?? ""}
- Role: ${contact.role ?? ""}
- School: ${contact.school ?? ""}
- Club: ${contact.club ?? ""}
- Hometown: ${contact.hometown ?? ""}

${sharedConnectionText}

Rules:
1. Subject line: max 8 words, specific and personal — reference their name and firm/group
2. Opening: EXPLICITLY mention the shared connection (school, hometown, club, or high school) in the first sentence
3. Body: 3-4 sentences max. Express genuine interest in their group/firm. Ask for a 20-min coffee chat.
4. Closing: professional, no desperation
5. Do NOT mention GPA, grades, or rankings
6. Do NOT use generic phrases like "I hope this email finds you well"
7. Sound like a real student, not a template
8. If there are shared connections, the email MUST open with that connection — e.g. "I came across your profile and noticed we both went to Wharton..."

Return JSON: { "subject": "...", "body": "..." }`
    : `You are an expert IB recruiting coach. Write a brief follow-up email from a student to a banker they recently had a coffee chat with.

Student: ${user.name ?? "Alex"} from ${user.school ?? "University"}
Banker: ${contact.name} at ${contact.firm ?? ""} (${contact.bankingGroup ?? ""})
${sharedConnectionText}

Rules:
1. Reference something specific from the chat (if no details, keep it general but warm)
2. 2-3 sentences max
3. Thank them, mention one key takeaway, offer to stay in touch
4. Do NOT ask for a referral in a follow-up — that comes later

Return JSON: { "subject": "...", "body": "..." }`;

  const response = await invokeLLM({
    messages: [{ role: "user", content: prompt }],
    response_format: {
      type: "json_schema",
      json_schema: {
        name: "email_draft",
        strict: true,
        schema: {
          type: "object",
          properties: {
            subject: { type: "string" },
            body: { type: "string" },
          },
          required: ["subject", "body"],
          additionalProperties: false,
        },
      },
    },
  });

  const _raw = response.choices[0]?.message?.content ?? "{}";
  const content = typeof _raw === "string" ? _raw : JSON.stringify(_raw);
  return JSON.parse(typeof content === "string" ? content : JSON.stringify(content));
}

async function analyzeTakeaways(transcript: string): Promise<Array<{ category: string; content: string }>> {
  const prompt = `You are a meticulous recruiting note-taker. Extract only takeaways that are explicitly supported by this coffee chat transcript.

TRANSCRIPT:
${transcript}

Use only these exact category labels:
1. Industry — insights about the industry, market trends, deal flow
2. Firm — culture, reputation, recent deals, what makes this firm unique
3. Group — specifics about the banking group (TMT, Healthcare, M&A, RX, ECM, DCM, LevFin, etc.)
4. Recruiting — timeline, process, what they look for, tips for getting an offer
5. Technical Prep — technical questions asked, modeling skills needed, prep resources
6. Personal Growth — advice on career development, skills to build, mindset
7. Referral Signal — any indication they'd refer you, pass your resume, or champion you
8. Next Person To Meet — specific names or roles they suggested you speak with

Rules:
- Omit categories with no meaningful evidence. Never add filler such as "no insights".
- Keep each bullet under 22 words and preserve concrete names, dates, firms, groups, and next steps.
- Separate facts from advice. Do not infer a referral signal unless the speaker clearly offered help.
- Merge duplicates and keep the 1-3 strongest bullets per relevant category.
- Use a "• " prefix for every bullet. No paragraphs.
- Return at most 16 total bullets.

Return one JSON object: { "takeaways": [{ "category": "Industry", "content": "• bullet 1\n• bullet 2" }] }`;

  const response = await invokeLLM({
    messages: [{ role: "user", content: prompt }],
    response_format: {
      type: "json_schema",
      json_schema: {
        name: "takeaways",
        strict: true,
        schema: {
          type: "object",
          properties: {
            takeaways: {
              type: "array",
              items: {
                type: "object",
                properties: {
                  category: { type: "string" },
                  content: { type: "string" },
                },
                required: ["category", "content"],
                additionalProperties: false,
              },
            },
          },
          required: ["takeaways"],
          additionalProperties: false,
        },
      },
    },
  });

  const _raw = response.choices[0]?.message?.content ?? "{}";
  const content = typeof _raw === "string" ? _raw : JSON.stringify(_raw);
  const jsonText = typeof content === "string" ? content : JSON.stringify(content);
  const objectStart = jsonText.indexOf("{");
  const objectEnd = jsonText.lastIndexOf("}");
  if (objectStart < 0 || objectEnd <= objectStart) {
    throw new Error("The summary service returned an invalid response. Please try again.");
  }
  const parsed = JSON.parse(jsonText.slice(objectStart, objectEnd + 1)) as {
    takeaways?: Array<{ category?: unknown; content?: unknown }>;
  };
  return (parsed.takeaways ?? [])
    .filter(
      (item): item is { category: string; content: string } =>
        typeof item.category === "string" &&
        typeof item.content === "string" &&
        item.content.trim().length > 0,
    )
    .slice(0, 8);
}

async function generatePostChatEmail(
  contact: { name: string; firm?: string | null; bankingGroup?: string | null },
  user: { name?: string | null; school?: string | null },
  transcript: string,
  takeaways: Array<{ category: string; content: string }>,
  type: "thank_you" | "referral_ask"
): Promise<{ subject: string; body: string }> {
  const takeawayText = takeaways.map(t => `${t.category}: ${t.content}`).join("\n");
  const referralSignal = takeaways.find(t => t.category === "Referral Signal")?.content ?? "";

  const prompt = type === "thank_you"
    ? `Write a genuine, specific thank-you email from a student to a banker after a coffee chat.

Student: ${user.name ?? "Alex"} from ${user.school ?? "University"}
Banker: ${contact.name} at ${contact.firm ?? ""} (${contact.bankingGroup ?? ""})

Key takeaways from the chat:
${takeawayText}

Rules:
1. Reference 2-3 SPECIFIC things from the conversation (use the takeaways above)
2. 4-5 sentences max
3. Express genuine appreciation, not generic thanks
4. End with staying in touch / looking forward to following up
5. Do NOT ask for anything in a thank-you email

Return JSON: { "subject": "...", "body": "..." }`
    : `Write a referral ask email from a student to a banker they had a great coffee chat with.

Student: ${user.name ?? "Alex"} from ${user.school ?? "University"}
Banker: ${contact.name} at ${contact.firm ?? ""} (${contact.bankingGroup ?? ""})

Referral signal from chat: ${referralSignal}
Key takeaways:
${takeawayText}

Rules:
1. Reference the coffee chat warmly
2. Mention 1-2 specific things that excited you about the firm/group
3. Politely ask if they'd be willing to pass your resume to recruiting or put in a word
4. Keep it 5-6 sentences max — don't be pushy
5. Make it easy for them to say yes

Return JSON: { "subject": "...", "body": "..." }`;

  const response = await invokeLLM({
    messages: [{ role: "user", content: prompt }],
    response_format: {
      type: "json_schema",
      json_schema: {
        name: "email_draft",
        strict: true,
        schema: {
          type: "object",
          properties: {
            subject: { type: "string" },
            body: { type: "string" },
          },
          required: ["subject", "body"],
          additionalProperties: false,
        },
      },
    },
  });

  const _raw = response.choices[0]?.message?.content ?? "{}";
  const content = typeof _raw === "string" ? _raw : JSON.stringify(_raw);
  return JSON.parse(typeof content === "string" ? content : JSON.stringify(content));
}

async function generateRecommendations(
  userId: number,
  contacts: Array<{ id: number; name: string; firm?: string | null; bankingGroup?: string | null; status?: string | null }>,
  allTakeaways: Array<{ category: string; content: string }>
): Promise<Array<{ contactId: number; reason: string; priority: "high" | "medium" | "low"; sourceType: "gap_analysis" | "mentioned_in_chat" | "strong_background" }>> {
  const contactSummary = contacts.slice(0, 30).map(c =>
    `ID:${c.id} ${c.name} at ${c.firm ?? "?"} (${c.bankingGroup ?? "?"}) - status: ${c.status}`
  ).join("\n");

  const mentionedNames = allTakeaways
    .filter(t => t.category === "Next Person To Meet")
    .map(t => t.content)
    .join("\n");

  const prompt = `You are an IB recruiting advisor. Based on the contact list and coffee chat insights below, recommend which contacts the student should prioritize reaching out to next.

CONTACTS:
${contactSummary}

PEOPLE MENTIONED IN COFFEE CHATS (Next Person To Meet):
${mentionedNames || "None yet"}

Rules:
1. Prioritize contacts with status "not_started"
2. Flag anyone mentioned in "Next Person To Meet" takeaways as high priority
3. Identify coverage gaps (groups with no contacts chatted)
4. Return max 10 recommendations
5. Each recommendation needs a specific, actionable reason

Return JSON array: [{ "contactId": 123, "reason": "...", "priority": "high|medium|low", "sourceType": "gap_analysis|mentioned_in_chat|strong_background" }]`;

  const response = await invokeLLM({
    messages: [{ role: "user", content: prompt }],
    response_format: {
      type: "json_schema",
      json_schema: {
        name: "recommendations",
        strict: true,
        schema: {
          type: "object",
          properties: {
            recommendations: {
              type: "array",
              items: {
                type: "object",
                properties: {
                  contactId: { type: "number" },
                  reason: { type: "string" },
                  priority: { type: "string" },
                  sourceType: { type: "string" },
                },
                required: ["contactId", "reason", "priority", "sourceType"],
                additionalProperties: false,
              },
            },
          },
          required: ["recommendations"],
          additionalProperties: false,
        },
      },
    },
  });

  const _raw = response.choices[0]?.message?.content ?? "{}";
  const content = typeof _raw === "string" ? _raw : JSON.stringify(_raw);
  const parsed = JSON.parse(typeof content === "string" ? content : JSON.stringify(content));
  return (parsed.recommendations ?? []).map((r: { contactId: number; reason: string; priority: string; sourceType: string }) => ({
    ...r,
    priority: ["high", "medium", "low"].includes(r.priority) ? r.priority : "medium",
    sourceType: ["gap_analysis", "mentioned_in_chat", "strong_background"].includes(r.sourceType) ? r.sourceType : "gap_analysis",
  }));
}

async function aiCategorizeColumns(headers: string[]): Promise<Record<string, string>> {
  const prompt = `You are mapping spreadsheet column headers to a contact CRM schema.

Column headers from the user's spreadsheet:
${headers.map((h, i) => `${i}: "${h}"`).join("\n")}

Map each header index to one of these CRM fields (or "skip" if not relevant):
name, email, linkedinUrl, school, major, club, hometown, firm, bankingGroup, industry, role, notes, status

Rules:
- "name" is required and should map to the full name column
- "status" values should be one of: not_started, reached_out, chatted, following_up, closed
- If a column doesn't match any field, use "skip"
- Each CRM field can only be mapped once

Return JSON: { "0": "name", "1": "email", "2": "skip", ... }`;

  const response = await invokeLLM({
    messages: [{ role: "user", content: prompt }],
    response_format: {
      type: "json_schema",
      json_schema: {
        name: "column_mapping",
        strict: false,
        schema: {
          type: "object",
          additionalProperties: { type: "string" },
        },
      },
    },
  });

  const _raw = response.choices[0]?.message?.content ?? "{}";
  const content = typeof _raw === "string" ? _raw : JSON.stringify(_raw);
  return JSON.parse(typeof content === "string" ? content : JSON.stringify(content));
}

// ─── Recruiting Timeline Scraper ──────────────────────────────────────────────

const TIMELINE_SOURCES: Record<string, string> = {
  investment_banking: "https://mergersandinquisitions.com/investment-banking/recruitment/",
  consulting: "https://managementconsulted.com/consulting-application-deadlines/",
  private_equity: "https://mergersandinquisitions.com/private-equity/recruitment/",
  venture_capital: "https://mergersandinquisitions.com/how-to-get-into-venture-capital/",
  asset_management: "https://mergersandinquisitions.com/asset-management-internship/",
  sales_trading: "https://www.wallstreetprep.com/knowledge/breaking-into-sales-and-trading/",
  quant_finance: "https://www.quantt.co.uk/resources/quant-finance-interview-prep-guide-2026",
  corporate_finance: "https://mycareer.wsb.wisc.edu/wp-content/uploads/sites/1044/2021/02/Corporate-Finance-Recruiting-Roadmap.pdf",
  public_accounting: "https://connections.villanova.edu/resources/recruiting-process-for-accounting/",
  commercial_real_estate: "https://cdo.som.yale.edu/blog/2024/08/28/what-to-expect-when-recruiting-in-real-estate/",
};

type TimelineIndustry = "investment_banking" | "venture_capital" | "consulting" | "private_equity" | "asset_management" | "sales_trading" | "quant_finance" | "corporate_finance" | "public_accounting" | "commercial_real_estate";

async function fetchAndSummarizeTimeline(industry: TimelineIndustry): Promise<string> {
  const url = TIMELINE_SOURCES[industry];

  // Fetch the page content
  let rawHtml = "";
  try {
    const res = await fetch(url, {
      headers: {
        "User-Agent": "Mozilla/5.0 (compatible; CoffeeChatLab/1.0)",
        "Accept": "text/html",
      },
      signal: AbortSignal.timeout(15000),
    });
    rawHtml = await res.text();
  } catch (err) {
    throw new Error(`Failed to fetch ${url}: ${(err as Error).message}`);
  }

  // Strip HTML tags to get plain text
  const plainText = rawHtml
    .replace(/<script[^>]*>[\s\S]*?<\/script>/gi, "")
    .replace(/<style[^>]*>[\s\S]*?<\/style>/gi, "")
    .replace(/<[^>]+>/g, " ")
    .replace(/\s+/g, " ")
    .trim()
    .slice(0, 8000); // limit to 8k chars for LLM

  // Summarize with AI
  const industryLabels: Record<TimelineIndustry, string> = {
    investment_banking: "Investment Banking",
    venture_capital: "Venture Capital",
    consulting: "Management Consulting",
    private_equity: "Private Equity",
    asset_management: "Asset Management",
    sales_trading: "Sales & Trading",
    quant_finance: "Quant Finance / Quant Trading",
    corporate_finance: "Corporate Finance / FLDP",
    public_accounting: "Big 4 / Public Accounting",
    commercial_real_estate: "Commercial Real Estate",
  };
  const industryLabel = industryLabels[industry] ?? industry.replace(/_/g, " ");

  const prompt = `You are a recruiting advisor summarizing a ${industryLabel} recruiting timeline article for a student.

Article content:
${plainText}

Extract and organize the following into a clear, structured summary:
1. Key recruiting timeline milestones (with approximate dates/months)
2. What students should be doing right now
3. Application deadlines and important dates
4. Tips specific to this industry
5. Common mistakes to avoid

Format as markdown with clear headers and bullet points. Be specific and actionable. Max 600 words.`;

  const response = await invokeLLM({
    messages: [{ role: "user", content: prompt }],
  });

  const _tlRaw = response.choices[0]?.message?.content ?? "Unable to summarize timeline.";
  return typeof _tlRaw === "string" ? _tlRaw : JSON.stringify(_tlRaw);
}

// ─── Router ───────────────────────────────────────────────────────────────────

export const appRouter = router({
  auth: router({
    me: publicProcedure.query(opts => opts.ctx.user),
    logout: publicProcedure.mutation(() => ({ success: true }) as const),
  }),

  // ─── User Profile / Onboarding ────────────────────────────────────────────
  user: router({
    getProfile: protectedProcedure.query(async ({ ctx }) => {
      const user = await getUserByOpenId(ctx.user.openId);
      return user ?? null;
    }),
    updateBackground: protectedProcedure
      .input(z.object({
        name: z.string().trim().min(1).max(120).optional(),
        school: z.string().optional(),
        major: z.string().optional(),
        hometown: z.string().optional(),
        club: z.string().optional(),
        targetGroup: z.string().optional(),
        targetFirm: z.string().optional(),
        classYear: z.string().optional(),
        targetIndustry: z.enum(["investment_banking", "venture_capital", "consulting"]).optional(),
        recruitingSeason: z.string().optional(),
        recruitingRegion: z.enum(["us", "uk", "europe", "hong_kong", "other"]).optional(),
        onboardingCompleted: z.boolean().optional(),
      }))
      .mutation(async ({ ctx, input }) => {
        await updateUserBackground(ctx.user.id, input);
        return { success: true };
      }),
  }),

  // ─── Dashboard ─────────────────────────────────────────────────────────────
  dashboard: router({
    stats: protectedProcedure.query(async ({ ctx }) => {
      return getDashboardStats(ctx.user.id);
    }),
  }),

  // ─── Contacts ──────────────────────────────────────────────────────────────
  contacts: router({
    list: protectedProcedure
      .input(z.object({
        search: z.string().optional(),
        status: z.string().optional(),
        firm: z.string().optional(),
        group: z.string().optional(),
        sortBy: z.string().optional(),
        sortDir: z.enum(["asc", "desc"]).optional(),
        limit: z.number().optional(),
        offset: z.number().optional(),
      }))
      .query(async ({ ctx, input }) => {
        return listContacts(ctx.user.id, { ...input, includeDemo: false });
      }),

    get: protectedProcedure
      .input(z.object({ id: z.number() }))
      .query(async ({ ctx, input }) => {
        const contact = await getContact(input.id, ctx.user.id);
        if (!contact) throw new TRPCError({ code: "NOT_FOUND" });
        return contact;
      }),

    create: protectedProcedure
      .input(z.object({
        name: z.string().min(1),
        email: z.string().optional(),
        linkedinUrl: z.string().optional(),
        school: z.string().optional(),
        major: z.string().optional(),
        club: z.string().optional(),
        hometown: z.string().optional(),
        firm: z.string().optional(),
        bankingGroup: z.string().optional(),
        industry: z.string().optional(),
        role: z.string().optional(),
        notes: z.string().optional(),
        status: z.enum(["not_started", "reached_out", "chatted", "following_up", "closed"]).optional(),
      }))
      .mutation(async ({ ctx, input }) => {
        const result = await createContact({ ...input, userId: ctx.user.id });
        const insertId = (result as { insertId?: number })?.insertId ?? 0;
        return { success: true, id: insertId, name: input.name };
      }),
    update: protectedProcedure
      .input(z.object({
        id: z.number(),
        name: z.string().optional(),
        email: z.string().optional(),
        linkedinUrl: z.string().optional(),
        school: z.string().optional(),
        major: z.string().optional(),
        club: z.string().optional(),
        hometown: z.string().optional(),
        firm: z.string().optional(),
        bankingGroup: z.string().optional(),
        industry: z.string().optional(),
        role: z.string().optional(),
        notes: z.string().optional(),
        status: z.enum(["not_started", "reached_out", "chatted", "following_up", "closed"]).optional(),
      }))
      .mutation(async ({ ctx, input }) => {
        const { id, ...data } = input;
        const contact = await getContact(id, ctx.user.id);
        if (!contact) throw new TRPCError({ code: "NOT_FOUND" });
        await updateContact(id, data);
        return { success: true };
      }),

        delete: protectedProcedure
      .input(z.object({ id: z.number() }))
      .mutation(async ({ ctx, input }) => {
        const contact = await getContact(input.id, ctx.user.id);
        if (!contact) throw new TRPCError({ code: "NOT_FOUND" });
        await deleteContact(input.id);
        return { success: true };
      }),
    deleteAll: protectedProcedure
      .mutation(async ({ ctx }) => {
        await deleteAllContacts(ctx.user.id);
        return { success: true };
      }),
    importCsv: protectedProcedure
      .input(z.object({
        rows: z.array(z.object({
          name: z.string(),
          email: z.string().optional(),
          linkedinUrl: z.string().optional(),
          school: z.string().optional(),
          major: z.string().optional(),
          club: z.string().optional(),
          hometown: z.string().optional(),
          firm: z.string().optional(),
          bankingGroup: z.string().optional(),
          industry: z.string().optional(),
          role: z.string().optional(),
          notes: z.string().optional(),
          status: z.enum(["not_started", "reached_out", "chatted", "following_up", "closed"]).optional(),
        })),
      }))
      .mutation(async ({ ctx, input }) => {
        const data = input.rows.map(r => ({ ...r, userId: ctx.user.id }));
        await bulkInsertContacts(data);
        return { imported: data.length };
      }),

    // AI-powered column mapping for import
    mapColumns: protectedProcedure
      .input(z.object({ headers: z.array(z.string()) }))
      .mutation(async ({ input }) => {
        const mapping = await aiCategorizeColumns(input.headers);
        return { mapping };
      }),

    // Manual single-contact or multi-contact entry
    importManual: protectedProcedure
      .input(z.object({
        contacts: z.array(z.object({
          name: z.string().optional(),
          email: z.string().optional(),
          linkedinUrl: z.string().optional(),
          school: z.string().optional(),
          major: z.string().optional(),
          club: z.string().optional(),
          hometown: z.string().optional(),
          firm: z.string().optional(),
          bankingGroup: z.string().optional(),
          industry: z.string().optional(),
          role: z.string().optional(),
          notes: z.string().optional(),
        })),
      }))
      .mutation(async ({ ctx, input }) => {
        const data = input.contacts
          .filter(c => c.name?.trim())
          .map(c => ({ ...c, name: c.name!, userId: ctx.user.id }));
        await bulkInsertContacts(data);
        return { imported: data.length };
      }),
  }),

  // ─── Coffee Chats ──────────────────────────────────────────────────────────
  coffeeChats: router({
    list: protectedProcedure
      .input(z.object({ contactId: z.number().optional() }))
      .query(async ({ ctx, input }) => {
        return listCoffeeChats(ctx.user.id, input.contactId);
      }),

    listAll: protectedProcedure
      .input(z.object({ limit: z.number().optional() }))
      .query(async ({ ctx, input }) => {
        return listCoffeeChats(ctx.user.id, undefined, input.limit ?? 50);
      }),

    takeaways: protectedProcedure
      .input(z.object({ chatId: z.number() }))
      .query(async ({ ctx, input }) => {
        return listTakeaways(input.chatId, ctx.user.id);
      }),

    get: protectedProcedure
      .input(z.object({ id: z.number() }))
      .query(async ({ ctx, input }) => {
        const chat = await getCoffeeChat(input.id, ctx.user.id);
        if (!chat) throw new TRPCError({ code: "NOT_FOUND" });
        const chatTakeaways = await listTakeaways(chat.id, ctx.user.id);
        return { ...chat, takeaways: chatTakeaways };
      }),

    create: protectedProcedure
      .input(z.object({
        contactId: z.number(),
        transcriptText: z.string().optional(),
        chatDate: z.string().optional(),
      }))
      .mutation(async ({ ctx, input }) => {
        const contact = await getContact(input.contactId, ctx.user.id);
        if (!contact) throw new TRPCError({ code: "NOT_FOUND" });
        const chat = await createCoffeeChat({
          userId: ctx.user.id,
          contactId: input.contactId,
          transcriptText: input.transcriptText,
          chatDate: input.chatDate ? new Date(input.chatDate) : new Date(),
          transcriptionStatus: "done",
        });
        await updateContact(input.contactId, { status: "chatted", lastContactedAt: new Date() });
        return { success: true, chatId: chat.insertId };
      }),

    transcribeAudio: protectedProcedure
      .input(z.object({
        // base64-encoded audio file bytes
        audioBase64: z.string(),
        mimeType: z.string().default("audio/mpeg"),
        contactId: z.number(),
        chatDate: z.string().optional(),
      }))
      .mutation(async ({ ctx, input }) => {
        const contact = await getContact(input.contactId, ctx.user.id);
        if (!contact) throw new TRPCError({ code: "NOT_FOUND" });
        // Create a pending chat record first
        const chat = await createCoffeeChat({
          userId: ctx.user.id,
          contactId: input.contactId,
          transcriptionStatus: "processing",
          chatDate: input.chatDate ? new Date(input.chatDate) : new Date(),
        });

        const chatId = chat.insertId;
        if (!chatId) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Failed to create chat record" });

        try {
          // Decode base64 to ArrayBuffer and send directly to AssemblyAI
          const buffer = Buffer.from(input.audioBase64, "base64");
          const arrayBuffer = buffer.buffer.slice(buffer.byteOffset, buffer.byteOffset + buffer.byteLength) as ArrayBuffer;
          const result = await uploadAndTranscribe(arrayBuffer, { speakerLabels: true });

          if ("error" in result) {
            await updateCoffeeChat(chatId, { transcriptionStatus: "error" });
            throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: result.error });
          }

          await updateCoffeeChat(chatId, {
            transcriptText: result.text,
            transcriptionStatus: "done",
          });
          await updateContact(input.contactId, { status: "chatted", lastContactedAt: new Date() });
          return { chatId, transcript: result.text };
        } catch (err) {
          await updateCoffeeChat(chatId, { transcriptionStatus: "error" });
          if (err instanceof TRPCError) throw err;
          throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Transcription failed" });
        }
      }),

    update: protectedProcedure
      .input(z.object({
        id: z.number(),
        notes: z.string().optional().nullable(),
        transcriptText: z.string().optional().nullable(),
      }))
      .mutation(async ({ ctx, input }) => {
        const chat = await getCoffeeChat(input.id, ctx.user.id);
        if (!chat) throw new TRPCError({ code: "NOT_FOUND" });
        await updateCoffeeChat(input.id, {
          ...(input.notes !== undefined ? { notes: input.notes } : {}),
          ...(input.transcriptText !== undefined ? { transcriptText: input.transcriptText } : {}),
        });
        return { success: true };
      }),

    analyzeTakeaways: protectedProcedure
      .input(z.object({ chatId: z.number(), transcript: z.string() }))
      .mutation(async ({ ctx, input }) => {
        const chat = await getCoffeeChat(input.chatId, ctx.user.id);
        if (!chat) throw new TRPCError({ code: "NOT_FOUND" });

        await deleteTakeawaysByChatId(input.chatId);

        const extracted = await analyzeTakeaways(input.transcript);
        const validCategories = ["Industry", "Firm", "Group", "Recruiting", "Technical Prep", "Personal Growth", "Referral Signal", "Next Person To Meet"];

        const toInsert = extracted
          .filter(t => validCategories.includes(t.category))
          .map(t => ({
            chatId: input.chatId,
            userId: ctx.user.id,
            category: t.category as typeof import("../drizzle/schema").takeaways.$inferInsert.category,
            content: t.content,
          }));

        await bulkInsertTakeaways(toInsert);
        return { takeaways: toInsert };
      }),
  }),

  // ─── Email Drafts ──────────────────────────────────────────────────────────
  emailDrafts: router({
    list: protectedProcedure
      .input(z.object({ contactId: z.number().optional() }))
      .query(async ({ ctx, input }) => {
        return listEmailDrafts(ctx.user.id, input.contactId);
      }),

    generate: protectedProcedure
      .input(z.object({
        contactId: z.number(),
        type: z.enum(["cold_outreach", "follow_up", "thank_you", "referral_ask"]),
        chatId: z.number().optional(),
      }))
      .mutation(async ({ ctx, input }) => {
        const contact = await getContact(input.contactId, ctx.user.id);
        if (!contact) throw new TRPCError({ code: "NOT_FOUND" });

        const user = await getUserByOpenId(ctx.user.openId);

        let emailData: { subject: string; body: string };

        if (input.type === "cold_outreach" || input.type === "follow_up") {
          emailData = await generateOutreachEmail(contact, user ?? {}, input.type);
        } else {
          // thank_you and referral_ask — work with or without a chat
          let chatTakeaways: Array<{ category: string; content: string }> = [];
          let transcript = "";

          if (input.chatId) {
            const chat = await getCoffeeChat(input.chatId, ctx.user.id);
            transcript = chat?.transcriptText ?? (chat as any)?.notes ?? "";
            const tw = await listTakeaways(input.chatId, ctx.user.id);
            chatTakeaways = tw.map(t => ({ category: t.category, content: t.content }));
          }

          emailData = await generatePostChatEmail(contact, user ?? {}, transcript, chatTakeaways, input.type);
        }

        await createEmailDraft({
          userId: ctx.user.id,
          contactId: input.contactId,
          chatId: input.chatId,
          type: input.type,
          subject: emailData.subject,
          body: emailData.body,
          status: "draft",
        });

        return emailData;
      }),

    approve: protectedProcedure
      .input(z.object({
        id: z.number(),
        subject: z.string().optional(),
        body: z.string().optional(),
      }))
      .mutation(async ({ ctx, input }) => {
        const { id, ...data } = input;
        const draft = await getEmailDraft(id, ctx.user.id);
        if (!draft) throw new TRPCError({ code: "NOT_FOUND" });
        await updateEmailDraft(id, { ...data, status: "approved" });
        return { success: true };
      }),

    update: protectedProcedure
      .input(z.object({
        id: z.number(),
        subject: z.string().optional(),
        body: z.string().optional(),
        status: z.enum(["draft", "approved", "sent"]).optional(),
      }))
      .mutation(async ({ ctx, input }) => {
        const { id, ...data } = input;
        const draft = await getEmailDraft(id, ctx.user.id);
        if (!draft) throw new TRPCError({ code: "NOT_FOUND" });
        await updateEmailDraft(id, data);
        return { success: true };
      }),
  }),

  // ─── Recommendations ───────────────────────────────────────────────────────
  recommendations: router({
    list: protectedProcedure.query(async ({ ctx }) => {
      return listRecommendations(ctx.user.id);
    }),

    generate: protectedProcedure.mutation(async ({ ctx }) => {
      const { contacts: allContacts } = await listContacts(ctx.user.id, { limit: 200 });
      const allTakeaways = await listAllTakeaways(ctx.user.id);

      const recs = await generateRecommendations(
        ctx.user.id,
        allContacts.map(c => ({
          id: c.id,
          name: c.name,
          firm: c.firm,
          bankingGroup: c.bankingGroup,
          status: c.status,
        })),
        allTakeaways.map(t => ({ category: t.category, content: t.content }))
      );

      const toInsert = recs
        .filter(r => allContacts.some(c => c.id === r.contactId))
        .map(r => ({
          userId: ctx.user.id,
          contactId: r.contactId,
          reason: r.reason,
          priority: r.priority,
          sourceType: r.sourceType,
        }));

      await bulkInsertRecommendations(toInsert);
      return { count: toInsert.length };
    }),
  }),

  // ─── Notebook (all takeaways cross-contact) ────────────────────────────────
  notebook: router({
    all: protectedProcedure.query(async ({ ctx }) => {
      return listAllTakeaways(ctx.user.id);
    }),

    update: protectedProcedure
      .input(z.object({
        id: z.number(),
        content: z.string().optional(),
        category: z.enum(["Industry", "Firm", "Group", "Recruiting", "Technical Prep", "Personal Growth", "Referral Signal", "Next Person To Meet"]).optional(),
        isKeyInsight: z.boolean().optional(),
      }))
      .mutation(async ({ ctx, input }) => {
        const { id, ...data } = input;
        // Ownership check: only allow editing own takeaways (not demo)
        const db = await getDb();
        if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });
        const { eq: eqFn } = await import("drizzle-orm");
        const { takeaways: tkTable } = await import("../drizzle/schema");
        const rows = await db.select({ userId: tkTable.userId, isDemo: tkTable.isDemo }).from(tkTable).where(eqFn(tkTable.id, id)).limit(1);
        if (!rows.length) throw new TRPCError({ code: "NOT_FOUND" });
        if (rows[0].isDemo) throw new TRPCError({ code: "FORBIDDEN", message: "Cannot edit demo takeaways" });
        if (rows[0].userId !== ctx.user.id) throw new TRPCError({ code: "FORBIDDEN" });
        await updateTakeaway(id, data);
        return { success: true };
      }),
  }),

  // ─── Recruiting Timeline ───────────────────────────────────────────────────
  timeline: router({
    get: protectedProcedure
      .input(z.object({
        industry: z.enum(["investment_banking", "venture_capital", "consulting", "private_equity", "asset_management", "sales_trading", "quant_finance", "corporate_finance", "public_accounting", "commercial_real_estate"]),
      }))
      .query(async ({ input }) => {
        return getRecruitingTimeline(input.industry);
      }),

    fetch: protectedProcedure
      .input(z.object({
        industry: z.enum(["investment_banking", "venture_capital", "consulting", "private_equity", "asset_management", "sales_trading", "quant_finance", "corporate_finance", "public_accounting", "commercial_real_estate"]),
      }))
      .mutation(async ({ input }) => {
        const content = await fetchAndSummarizeTimeline(input.industry as TimelineIndustry);
        const sourceUrl = TIMELINE_SOURCES[input.industry];
        await upsertRecruitingTimeline({
          industry: input.industry,
          title: `${input.industry.replace(/_/g, " ").replace(/\b\w/g, c => c.toUpperCase())} Recruiting Timeline`,
          content,
          sourceUrl,
        });
        return { content };
      }),
  }),

  // ─── Settings ───────────────────────────────────────────────────────────────
  settings: router({
    getProfile: protectedProcedure.query(async ({ ctx }) => {
      const user = await getUserByOpenId(ctx.user.openId);
      return user ?? null;
    }),

    updateProfile: protectedProcedure
      .input(z.object({
        name: z.string().trim().min(1).max(120).optional(),
        school: z.string().optional(),
        major: z.string().optional(),
        hometown: z.string().optional(),
        club: z.string().optional(),
        targetGroup: z.string().optional(),
        targetFirm: z.string().optional(),
        classYear: z.string().optional(),
        targetIndustry: z.enum(["investment_banking", "venture_capital", "consulting"]).optional(),
        recruitingSeason: z.string().optional(),
        recruitingRegion: z.enum(["us", "uk", "europe", "hong_kong", "other"]).optional(),
        onboardingCompleted: z.boolean().optional(),
      }))
      .mutation(async ({ ctx, input }) => {
        await updateUserBackground(ctx.user.id, input);
        return { success: true };
      }),
  }),

  // ─── File Upload ───────────────────────────────────────────────────────────
  upload: router({
    getUploadUrl: protectedProcedure
      .input(z.object({
        filename: z.string(),
        contentType: z.string(),
        size: z.number(),
      }))
      .mutation(async ({ ctx, input }) => {
        if (input.size > 50 * 1024 * 1024) {
          throw new TRPCError({ code: "BAD_REQUEST", message: "File too large (max 50MB)" });
        }
        return { uploadEndpoint: "/api/upload", key: `audio/${ctx.user.id}/${Date.now()}-${input.filename}` };
      }),
  }),
});

export type AppRouter = typeof appRouter;
