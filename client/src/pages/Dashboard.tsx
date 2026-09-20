import DashboardLayout from "@/components/DashboardLayout";
import {
  DoodleArrow,
  DoodleCoffeeCup,
  DoodleNotebook,
  DoodleSparkle,
  DoodleStar,
} from "@/components/DoodleIcons";
import { trpc } from "@/lib/trpc";
import { BANKING_GROUPS, STATUS_CLASSES, STATUS_LABELS } from "@/lib/types";
import type { ContactStatus } from "@/lib/types";
import { ArrowRight, ChevronRight, ExternalLink, MapPin } from "lucide-react";
import { Link } from "wouter";
import { useAuth } from "@/_core/hooks/useAuth";

type RecruitingRegion = "us" | "uk" | "europe" | "hong_kong" | "other";
const REGION_TIMELINES: Record<RecruitingRegion, { label: string; trackerUrl: string; guideUrl?: string; milestones: Array<{ period: string; action: string }>; extraLinks?: Array<{ label: string; url: string }> }> = {
  us: {
    label: "United States", trackerUrl: "https://app.the-trackr.com/us-finance", guideUrl: "https://the-trackr.com/blog/us-finance-summer-2028-timeline/",
    milestones: [
      { period: "Aug–Nov 2026", action: "Early Summer 2028 programs begin opening; finish your resume and networking list." },
      { period: "December 2026", action: "The main banking wave begins, led by boutiques and middle-market firms." },
      { period: "January 2027", action: "Peak month for US finance openings. Apply within days, not near the deadline." },
      { period: "Spring–Summer 2027", action: "Later buy-side, accounting, and remaining programs continue to open." },
    ],
  },
  uk: {
    label: "United Kingdom", trackerUrl: "https://app.the-trackr.com/uk-finance", guideUrl: "https://the-trackr.com/blog/spring-week-timeline-2027-when-uk-finance-firms-open-applications/",
    milestones: [
      { period: "June–September", action: "The first spring weeks, insight programs, and select internships open." },
      { period: "October–November", action: "Peak investment-banking wave; submit early because recruiting is rolling." },
      { period: "January–February", action: "Consulting and trading programs cluster here; keep monitoring new openings." },
      { period: "Through April", action: "The long-tail of spring and diversity programs continues." },
    ],
  },
  europe: {
    label: "Continental Europe", trackerUrl: "https://the-trackr.com/trackers/",
    milestones: [
      { period: "May–July", action: "Trackr generally resets trackers for the next recruiting cycle." },
      { period: "Late summer", action: "Prepare local-language materials and begin checking country trackers." },
      { period: "Autumn", action: "Monitor openings daily and apply as soon as each role goes live." },
      { period: "Rolling", action: "Use the country tracker for live status, direct links, and current deadlines." },
    ],
    extraLinks: [
      { label: "France", url: "https://app.the-trackr.com/france-finance" },
      { label: "Germany", url: "https://app.the-trackr.com/germany-finance" },
      { label: "Italy", url: "https://app.the-trackr.com/italy-finance" },
    ],
  },
  hong_kong: {
    label: "Hong Kong / APAC", trackerUrl: "https://app.the-trackr.com/hong-kong-finance",
    milestones: [
      { period: "May–July", action: "Prepare before the tracker resets for the next cycle." },
      { period: "Late summer–autumn", action: "Watch the Hong Kong tracker closely as finance roles begin opening." },
      { period: "When live", action: "Apply immediately and record the deadline in CoffeeLab." },
      { period: "Rolling", action: "Recheck live status; openings and closings can change throughout the day." },
    ],
  },
  other: {
    label: "Multiple regions", trackerUrl: "https://the-trackr.com/trackers/",
    milestones: [
      { period: "May–July", action: "Most Trackr trackers reset for the following recruiting cycle." },
      { period: "Weekly", action: "Review the relevant country and sector trackers for new openings." },
      { period: "When live", action: "Prioritize rolling applications and submit as early as possible." },
      { period: "Ongoing", action: "Update your region in Settings to receive a more specific timeline." },
    ],
  },
};


function StatCard({
  label,
  value,
  sub,
  accent,
}: {
  label: string;
  value: number;
  sub: string;
  accent?: boolean;
}) {
  return (
    <div
      className={`sketch-card p-4 ${
        accent && value > 0
          ? "border-[var(--color-ink)] shadow-[2px_2px_0_0_var(--color-ink)]"
          : ""
      }`}
    >
      <p className="text-[10px] font-mono font-semibold uppercase tracking-widest text-[var(--color-ink-faint)] mb-1">
        {label}
      </p>
      <p className="text-3xl font-bold tracking-tight text-[var(--color-ink)]">{value}</p>
      <p className="text-[10px] text-[var(--color-ink-faint)] mt-0.5">{sub}</p>
    </div>
  );
}

export default function Dashboard() {
  const { user } = useAuth();
  const { data: stats, isLoading: statsLoading } = trpc.dashboard.stats.useQuery();
  const { data: contactsData } = trpc.contacts.list.useQuery({
    limit: 8,
    sortBy: "createdAt",
    sortDir: "desc",
  });
  const { data: recsData } = trpc.recommendations.list.useQuery();
  const recs = recsData?.slice(0, 3) ?? [];

  // Recruiting timeline
  const { data: userProfile } = trpc.user.getProfile.useQuery();
  const recruitingRegion = (userProfile?.recruitingRegion as RecruitingRegion | null) ?? "other";
  const regionalTimeline = REGION_TIMELINES[recruitingRegion];

  const topContacts = contactsData?.contacts ?? [];
  const coveredGroups = new Set(topContacts.map((c) => c.bankingGroup).filter(Boolean));
  const uncoveredGroups = BANKING_GROUPS.filter((g) => !coveredGroups.has(g)).slice(0, 6);

  return (
    <DashboardLayout>
      <div className="min-h-screen paper-bg">
        {/* ── Hero ── */}
        <div className="relative border-b border-[var(--color-border-dark)] px-8 py-10 overflow-hidden">
          {/* Doodle accents */}
          <div className="absolute top-6 right-16 opacity-10 rotate-12 pointer-events-none">
            <DoodleCoffeeCup size={64} />
          </div>
          <div className="absolute bottom-4 right-52 opacity-8 -rotate-6 pointer-events-none">
            <DoodleNotebook size={48} />
          </div>
          <div className="absolute top-10 right-80 opacity-8 rotate-3 pointer-events-none">
            <DoodleArrow size={36} />
          </div>

          <div className="max-w-2xl">
            <p className="text-[10px] font-mono font-semibold uppercase tracking-widest text-[var(--color-ink-faint)] mb-2">
              CoffeeLab
            </p>
            <h1 className="text-4xl font-bold tracking-tight text-[var(--color-ink)] leading-tight">
              Hi, {user?.name?.split(" ")[0] ?? "there"} ☕
            </h1>
            <p className="mt-2 text-base text-[var(--color-ink-muted)]">
              Turn every coffee chat into real learnings.
            </p>
          </div>

          {/* Quick actions */}
          <div className="flex flex-wrap gap-2 mt-6">
            <Link href="/import">
              <button className="sketch-btn">
                <DoodleNotebook size={14} />
                Import Contacts
              </button>
            </Link>
            <Link href="/coffee-chat">
              <button className="sketch-btn">
                <DoodleCoffeeCup size={14} />
                Log Coffee Chat
              </button>
            </Link>
            <Link href="/outreach">
              <button className="sketch-btn sketch-btn-primary">
                <DoodleSparkle size={14} />
                Generate Outreach
              </button>
            </Link>
          </div>
        </div>

        {/* ── Body ── */}
        <div className="px-8 py-6 grid grid-cols-1 xl:grid-cols-3 gap-6">
          {/* Left: stats + table */}
          <div className="xl:col-span-2 space-y-6">
            {/* Stats */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              {statsLoading ? (
                Array.from({ length: 4 }).map((_, i) => (
                  <div
                    key={i}
                    className="sketch-card p-4 animate-pulse"
                  >
                    <div className="h-3 bg-[var(--color-border)] rounded w-16 mb-2" />
                    <div className="h-7 bg-[var(--color-border)] rounded w-10" />
                  </div>
                ))
              ) : (
                <>
                  <StatCard label="Contacts" value={stats?.totalContacts ?? 0} sub="imported" />
                  <StatCard label="Follow-ups" value={stats?.followUpsDue ?? 0} sub="due" accent />
                  <StatCard label="Chats" value={stats?.chatsCompleted ?? 0} sub="summarized" />
                  <StatCard label="Chatted" value={stats?.chatted ?? 0} sub="conversations" />
                </>
              )}
            </div>

            {/* Recruiting Timeline */}
            <div className="sketch-card overflow-hidden">
              <div className="flex items-center justify-between px-4 py-3 border-b border-[var(--color-border-dark)]">
                <div className="min-w-0">
                  <h2 className="text-sm font-semibold text-[var(--color-ink)]">Your Recruiting Timeline</h2>
                  <p className="text-[10px] font-mono text-[var(--color-ink-faint)] mt-0.5">{regionalTimeline.label} · {userProfile?.recruitingSeason ?? "Set your recruiting year"}</p>
                </div>
                <Link href="/settings" className="text-[10px] font-mono underline text-[var(--color-ink-faint)] hover:text-[var(--color-ink)]">Edit profile</Link>
              </div>
              <div className="p-4">
                <div className="space-y-3">
                  {regionalTimeline.milestones.map((milestone, index) => (
                    <div key={milestone.period} className="grid grid-cols-[18px_110px_1fr] gap-2 items-start">
                      <div className="relative flex justify-center pt-1">
                        <span className="h-2.5 w-2.5 rounded-full bg-[var(--color-ink)] block" />
                        {index < regionalTimeline.milestones.length - 1 && <span className="absolute top-3.5 h-8 w-px bg-[var(--color-border-dark)]" />}
                      </div>
                      <span className="text-[10px] font-mono font-semibold text-[var(--color-ink)] pt-0.5">{milestone.period}</span>
                      <span className="text-xs text-[var(--color-ink-muted)] leading-relaxed">{milestone.action}</span>
                    </div>
                  ))}
                </div>
                <div className="mt-4 pt-3 border-t border-[var(--color-border)] flex flex-wrap items-center gap-2">
                  <MapPin size={11} className="text-[var(--color-ink-faint)]" />
                  <a href={regionalTimeline.trackerUrl} target="_blank" rel="noopener noreferrer" className="sketch-btn sketch-btn-primary text-xs">Open live Trackr <ExternalLink size={10} /></a>
                  {regionalTimeline.guideUrl && <a href={regionalTimeline.guideUrl} target="_blank" rel="noopener noreferrer" className="sketch-btn text-xs">View timeline guide <ExternalLink size={10} /></a>}
                  {regionalTimeline.extraLinks?.map(link => <a key={link.label} href={link.url} target="_blank" rel="noopener noreferrer" className="text-[10px] font-mono underline text-[var(--color-ink-faint)] hover:text-[var(--color-ink)]">{link.label}</a>)}
                </div>
                <p className="mt-2 text-[9px] text-[var(--color-ink-faint)]">Source: Trackr. Dates are planning estimates; use the live tracker for current openings and deadlines.</p>
              </div>
            </div>

            {/* Top contacts table */}
            <div className="sketch-card overflow-hidden">
              <div className="flex items-center justify-between px-4 py-3 border-b border-[var(--color-border-dark)]">
                <h2 className="text-sm font-semibold text-[var(--color-ink)]">
                  Recent Contacts
                </h2>
                <Link href="/contacts">
                  <button className="text-xs text-[var(--color-ink-muted)] hover:text-[var(--color-ink)] flex items-center gap-1 transition-colors font-mono">
                    View all <ArrowRight size={12} />
                  </button>
                </Link>
              </div>
              <div className="overflow-x-auto">
                <table className="crm-table">
                  <thead>
                    <tr>
                      <th>Name</th>
                      <th>Firm</th>
                      <th>Group</th>
                      <th>Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {topContacts.length === 0 ? (
                      <tr>
                        <td
                          colSpan={5}
                          className="text-center py-10 text-[var(--color-ink-faint)] text-xs font-mono"
                        >
                          No contacts yet — import your spreadsheet to get started.
                        </td>
                      </tr>
                    ) : (
                      topContacts.map((c) => (
                        <tr
                          key={c.id}
                          className="cursor-pointer"
                          onClick={() => (window.location.href = `/contacts/${c.id}`)}
                        >
                          <td>
                            <div className="flex items-center gap-2">
                              <div className="w-6 h-6 rounded-full bg-[var(--color-paper-dark)] border border-[var(--color-border-dark)] flex items-center justify-center text-[10px] font-mono font-bold text-[var(--color-ink-muted)] flex-shrink-0">
                                {(c.name ?? "?")[0].toUpperCase()}
                              </div>
                              <span className="font-medium text-xs">{c.name}</span>
                            </div>
                          </td>
                          <td className="text-xs text-[var(--color-ink-muted)]">{c.firm ?? "—"}</td>
                          <td>
                            {c.bankingGroup && <span className="sketch-tag">{c.bankingGroup}</span>}
                          </td>
                          <td>
                            {c.status && (
                              <span
                                className={`status-badge ${STATUS_CLASSES[c.status as ContactStatus] ?? "status-not-started"}`}
                              >
                                {STATUS_LABELS[c.status as ContactStatus]}
                              </span>
                            )}
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>

          {/* Right: follow-up queue + group coverage + next contacts */}
          <div className="space-y-4">
            {/* Follow-up queue */}
            <div className="sketch-card p-4">
              <div className="flex items-center gap-2 mb-3">
                <DoodleStar size={14} className="text-[var(--color-ink-muted)]" />
                <h3 className="text-xs font-semibold font-mono uppercase tracking-wider text-[var(--color-ink)]">
                  Today's Follow-up Queue
                </h3>
              </div>
              {topContacts                          .filter(
                      (c) => c.status === "reached_out" || c.status === "following_up"
                    ).length === 0 ? (
                <p className="text-xs text-[var(--color-ink-faint)] font-mono">
                  No follow-ups due today.
                </p>
              ) : (
                <div className="space-y-1">
                  {topContacts
                    .filter(
                      (c) => c.status === "reached_out" || c.status === "following_up"
                    )
                    .slice(0, 4)
                    .map((c) => (
                      <Link key={c.id} href={`/contacts/${c.id}`}>
                        <div className="flex items-center justify-between py-1.5 px-2 rounded hover:bg-[var(--color-paper-dark)] transition-colors cursor-pointer">
                          <div>
                            <p className="text-xs font-medium text-[var(--color-ink)]">
                              {c.name}
                            </p>
                            <p className="text-[10px] text-[var(--color-ink-faint)] font-mono">
                              {c.firm} · {c.bankingGroup}
                            </p>
                          </div>
                          <ChevronRight size={12} className="text-[var(--color-ink-faint)]" />
                        </div>
                      </Link>
                    ))}
                </div>
              )}
            </div>

            {/* Groups not covered */}
            <div className="sketch-card p-4">
              <div className="flex items-center gap-2 mb-3">
                <DoodleNotebook size={14} className="text-[var(--color-ink-muted)]" />
                <h3 className="text-xs font-semibold font-mono uppercase tracking-wider text-[var(--color-ink)]">
                  Groups Not Covered
                </h3>
              </div>
              {uncoveredGroups.length === 0 ? (
                <p className="text-xs text-[var(--color-ink-faint)] font-mono">
                  All major groups covered!
                </p>
              ) : (
                <div className="flex flex-wrap gap-1.5">
                  {uncoveredGroups.map((g) => (
                    <span key={g} className="sketch-tag">
                      {g}
                    </span>
                  ))}
                </div>
              )}
            </div>

            {/* Next best contacts */}
            <div className="sketch-card p-4">
              <div className="flex items-center gap-2 mb-3">
                <DoodleSparkle size={14} className="text-[var(--color-ink-muted)]" />
                <h3 className="text-xs font-semibold font-mono uppercase tracking-wider text-[var(--color-ink)]">
                  Next Best to Contact
                </h3>
              </div>
              {!recs || recs.length === 0 ? (
                <p className="text-xs text-[var(--color-ink-faint)] font-mono">
                  Log more chats to get recommendations.
                </p>
              ) : (
                <div className="space-y-1">
                  {recs.map((r: any) => (
                    <Link key={r.id} href={`/contacts/${r.contactId}`}>
                      <div className="flex items-start gap-2 py-1.5 px-2 rounded hover:bg-[var(--color-paper-dark)] transition-colors cursor-pointer">
                        <div className="flex-1 min-w-0">
                          <p className="text-xs font-medium text-[var(--color-ink)] truncate">
                            {r.contactName ?? `Contact #${r.contactId}`}
                          </p>
                          <p className="text-[10px] text-[var(--color-ink-faint)] font-mono truncate">
                            {r.firm} · {r.group}
                          </p>
                          <p className="text-[10px] text-[var(--color-ink-muted)] mt-0.5 line-clamp-2">
                            {r.reason}
                          </p>
                        </div>
                        <ChevronRight
                          size={12}
                          className="text-[var(--color-ink-faint)] flex-shrink-0 mt-0.5"
                        />
                      </div>
                    </Link>
                  ))}
                </div>
              )}
              <Link href="/recommendations">
                <button className="mt-3 w-full text-xs text-[var(--color-ink-muted)] hover:text-[var(--color-ink)] flex items-center justify-center gap-1 transition-colors font-mono">
                  View all recommendations <ArrowRight size={11} />
                </button>
              </Link>
            </div>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}
