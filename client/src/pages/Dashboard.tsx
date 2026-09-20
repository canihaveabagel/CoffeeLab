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
import { ArrowRight, ChevronRight, RefreshCw, ExternalLink } from "lucide-react";
import { Link } from "wouter";
import { useState } from "react";
import { Streamdown } from "streamdown";
import { useAuth } from "@/_core/hooks/useAuth";



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
  const targetIndustry = (userProfile?.targetIndustry as string | null) ?? "investment_banking";
  type TimelineIndustry = "investment_banking" | "venture_capital" | "consulting" | "private_equity" | "asset_management" | "sales_trading" | "quant_finance" | "corporate_finance" | "public_accounting" | "commercial_real_estate";
  const TIMELINE_INDUSTRY_LABELS: Record<TimelineIndustry, string> = {
    investment_banking: "Investment Banking",
    venture_capital: "Venture Capital",
    consulting: "Management Consulting",
    private_equity: "Private Equity",
    asset_management: "Asset Management",
    sales_trading: "Sales & Trading",
    quant_finance: "Quant Finance",
    corporate_finance: "Corporate Finance / FLDP",
    public_accounting: "Big 4 / Accounting",
    commercial_real_estate: "Commercial Real Estate",
  };
  const [timelineIndustry, setTimelineIndustry] = useState<TimelineIndustry>("investment_banking");
  const [timelineExpanded, setTimelineExpanded] = useState(false);
  const { data: timeline, refetch: refetchTimeline } = trpc.timeline.get.useQuery({ industry: timelineIndustry });
  const fetchTimelineMutation = trpc.timeline.fetch.useMutation({
    onSuccess: () => refetchTimeline(),
    onError: (e) => console.error("Timeline fetch failed:", e.message),
  });

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
                <div className="flex items-center gap-2 min-w-0 flex-1 mr-2">
                  <h2 className="text-sm font-semibold text-[var(--color-ink)] whitespace-nowrap flex-shrink-0">Recruiting Timeline</h2>
                  <select
                    value={timelineIndustry}
                    onChange={e => setTimelineIndustry(e.target.value as typeof timelineIndustry)}
                    className="sketch-input text-xs h-7 min-w-0 flex-1 max-w-[180px]"
                  >
                    {(Object.entries(TIMELINE_INDUSTRY_LABELS) as [TimelineIndustry, string][]).map(([val, label]) => (
                      <option key={val} value={val}>{label}</option>
                    ))}
                  </select>
                </div>
                <div className="flex items-center gap-1.5 flex-shrink-0">
                  <button
                    onClick={() => fetchTimelineMutation.mutate({ industry: timelineIndustry })}
                    disabled={fetchTimelineMutation.isPending}
                    className="sketch-btn text-xs"
                    title="Fetch latest from web"
                  >
                    <RefreshCw size={11} className={fetchTimelineMutation.isPending ? "animate-spin" : ""} />
                    {fetchTimelineMutation.isPending ? "Fetching..." : "Refresh"}
                  </button>
                  {timeline?.content && (
                    <button
                      onClick={() => setTimelineExpanded(e => !e)}
                      className="sketch-btn text-xs"
                    >
                      {timelineExpanded ? "Collapse" : "Expand"}
                    </button>
                  )}
                </div>
              </div>
              <div className={`p-4 transition-all duration-300 ease-out ${timeline?.content && !timelineExpanded ? "max-h-40 overflow-hidden" : "max-h-[480px] overflow-y-auto"}`}>
                {timeline?.content ? (
                  <div className="relative">
                    <div className="prose prose-sm max-w-none text-[var(--color-ink-muted)] text-xs leading-relaxed">
                      <Streamdown>{timeline.content}</Streamdown>
                      {timeline.sourceUrl && (
                        <a href={timeline.sourceUrl} target="_blank" rel="noopener noreferrer"
                          className="inline-flex items-center gap-1 text-[10px] font-mono text-[var(--color-ink-faint)] hover:text-[var(--color-ink)] mt-2">
                          <ExternalLink size={10} /> Source
                        </a>
                      )}
                    </div>
                    {!timelineExpanded && (
                      <div className="absolute bottom-0 left-0 right-0 h-12 bg-gradient-to-t from-[var(--color-paper)] to-transparent pointer-events-none" />
                    )}
                  </div>
                ) : (
                  <div className="text-center py-6">
                    <p className="text-xs text-[var(--color-ink-faint)] font-mono mb-3">
                      No timeline loaded yet. Click Refresh to fetch the latest recruiting timeline.
                    </p>
                    <button
                      onClick={() => fetchTimelineMutation.mutate({ industry: timelineIndustry })}
                      disabled={fetchTimelineMutation.isPending}
                      className="sketch-btn sketch-btn-primary text-xs"
                    >
                      <RefreshCw size={11} className={fetchTimelineMutation.isPending ? "animate-spin" : ""} />
                      {fetchTimelineMutation.isPending ? "Fetching timeline..." : "Fetch Recruiting Timeline"}
                    </button>
                  </div>
                )}
              </div>
              {timeline?.content && (
                <button
                  onClick={() => setTimelineExpanded(e => !e)}
                  className="w-full py-2 text-[10px] font-mono text-[var(--color-ink-faint)] hover:text-[var(--color-ink)] border-t border-[var(--color-border)] transition-colors"
                >
                  {timelineExpanded ? "Show less ↑" : "Show more ↓"}
                </button>
              )}
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
