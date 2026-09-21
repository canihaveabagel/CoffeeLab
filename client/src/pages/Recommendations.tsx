import { trpc } from "@/lib/trpc";
import { STATUS_LABELS, STATUS_CLASSES } from "@/lib/types";
import {
  DoodleSparkle,
  DoodleHandshake,
  DoodleArrow,
} from "@/components/DoodleIcons";
import { ArrowRight, RefreshCw, Target } from "lucide-react";
import { useLocation } from "wouter";
import { Skeleton } from "@/components/ui/skeleton";
import { toast } from "sonner";

const REASON_STYLES: Record<
  string,
  { bg: string; border: string; text: string }
> = {
  coverage_gap: {
    bg: "bg-blue-50",
    border: "border-blue-200",
    text: "text-blue-800",
  },
  mentioned_in_chat: {
    bg: "bg-emerald-50",
    border: "border-emerald-200",
    text: "text-emerald-800",
  },
  strong_background: {
    bg: "bg-amber-50",
    border: "border-amber-200",
    text: "text-amber-800",
  },
  no_recent_contact: {
    bg: "bg-orange-50",
    border: "border-orange-200",
    text: "text-orange-800",
  },
  referral_potential: {
    bg: "bg-violet-50",
    border: "border-violet-200",
    text: "text-violet-800",
  },
};

const REASON_LABELS: Record<string, string> = {
  coverage_gap: "Coverage Gap",
  mentioned_in_chat: "Mentioned in Chat",
  strong_background: "Strong Background Match",
  no_recent_contact: "No Recent Contact",
  referral_potential: "Referral Potential",
};

export default function Recommendations() {
  const [, setLocation] = useLocation();
  const utils = trpc.useUtils();

  const { data: recs, isLoading } = trpc.recommendations.list.useQuery();

  const generateMutation = trpc.recommendations.generate.useMutation({
    onSuccess: (d: { count: number }) => {
      utils.recommendations.list.invalidate();
      toast.success(`Generated ${d.count} recommendations`);
    },
    onError: (e: { message: string }) => toast.error(e.message),
  });

  return (
    <div className="min-h-screen paper-bg">
      {/* Page header */}
      <div className="border-b border-[var(--color-border-dark)] px-8 py-6">
        <p className="text-[10px] font-mono font-semibold uppercase tracking-widest text-[var(--color-ink-faint)] mb-1">
          Intelligence
        </p>
        <div className="flex items-start justify-between">
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-[var(--color-ink)] flex items-center gap-2">
              <DoodleHandshake
                size={24}
                className="text-[var(--color-ink-muted)]"
              />
              Recommendations
            </h1>
            <p className="text-sm text-[var(--color-ink-muted)] mt-0.5">
              AI-powered suggestions for who to reach out to next
            </p>
          </div>
          <button
            onClick={() => generateMutation.mutate()}
            disabled={generateMutation.isPending}
            className="sketch-btn text-xs disabled:opacity-40"
          >
            {generateMutation.isPending ? (
              <>
                <RefreshCw size={12} className="animate-spin" /> Generating...
              </>
            ) : (
              <>
                <DoodleSparkle size={12} /> Refresh
              </>
            )}
          </button>
        </div>
      </div>

      <div className="mx-auto w-full max-w-4xl space-y-5 px-5 py-6 sm:px-8">
        {/* How it works */}
        <div className="sketch-card p-4">
          <div className="flex items-start gap-3">
            <Target
              size={16}
              className="text-[var(--color-ink-muted)] flex-shrink-0 mt-0.5"
            />
            <div>
              <p className="text-xs font-semibold text-[var(--color-ink)] mb-1">
                How recommendations work
              </p>
              <p className="text-xs text-[var(--color-ink-muted)] leading-relaxed">
                The engine analyzes your contact coverage across groups and
                firms, identifies bankers mentioned in past coffee chats,
                surfaces contacts with strong background overlap you haven't
                reached out to, and flags people you haven't followed up with
                recently.
              </p>
            </div>
          </div>
        </div>

        {/* Recommendations list */}
        {isLoading ? (
          <div className="space-y-3">
            {Array.from({ length: 4 }).map((_, i) => (
              <Skeleton key={i} className="h-28 w-full rounded-lg" />
            ))}
          </div>
        ) : recs && recs.length > 0 ? (
          <div className="space-y-3">
            <p className="text-[10px] font-mono font-semibold uppercase tracking-widest text-[var(--color-ink-faint)]">
              {recs.length} Suggestions
            </p>
            {recs.map((rec, idx) => {
              const reasonStyle = REASON_STYLES[rec.sourceType] ?? {
                bg: "bg-gray-50",
                border: "border-gray-200",
                text: "text-gray-700",
              };
              const priorityStyle =
                rec.priority === "high"
                  ? "bg-emerald-50 border-emerald-200 text-emerald-800"
                  : rec.priority === "medium"
                    ? "bg-amber-50 border-amber-200 text-amber-800"
                    : "bg-gray-50 border-gray-200 text-gray-700";

              return (
                <div
                  key={rec.id}
                  className="sketch-card p-4 cursor-pointer hover:shadow-md transition-shadow"
                  onClick={() => setLocation(`/contacts/${rec.contactId}`)}
                >
                  <div className="flex items-start gap-4">
                    {/* Rank number */}
                    <div className="w-8 h-8 rounded-full border-2 border-[var(--color-ink)] flex items-center justify-center text-xs font-mono font-bold text-[var(--color-ink)] flex-shrink-0">
                      {idx + 1}
                    </div>

                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-2">
                        <div>
                          <p className="text-sm font-semibold text-[var(--color-ink)]">
                            {rec.contactName}
                          </p>
                          <p className="text-xs font-mono text-[var(--color-ink-muted)] mt-0.5">
                            {[
                              rec.contactRole,
                              rec.contactGroup,
                              rec.contactFirm,
                            ]
                              .filter(Boolean)
                              .join(" · ")}
                          </p>
                        </div>
                        <div className="flex items-center gap-1.5 flex-shrink-0">
                          {rec.contactStatus && (
                            <span
                              className={`sketch-tag text-[10px] hidden sm:inline-flex ${STATUS_CLASSES[rec.contactStatus as keyof typeof STATUS_CLASSES] ?? ""}`}
                            >
                              {STATUS_LABELS[
                                rec.contactStatus as keyof typeof STATUS_LABELS
                              ] ?? rec.contactStatus}
                            </span>
                          )}
                        </div>
                      </div>

                      {/* Reason tags */}
                      <div className="flex flex-wrap gap-1.5 mt-2">
                        <span
                          className={`inline-flex items-center px-2 py-0.5 rounded text-[10px] font-mono font-semibold border ${reasonStyle.bg} ${reasonStyle.border} ${reasonStyle.text}`}
                        >
                          {REASON_LABELS[rec.sourceType] ?? rec.sourceType}
                        </span>
                        <span
                          className={`inline-flex items-center px-2 py-0.5 rounded text-[10px] font-mono font-semibold border ${priorityStyle}`}
                        >
                          {rec.priority} priority
                        </span>
                      </div>

                      {rec.reason && (
                        <p className="text-xs text-[var(--color-ink-muted)] mt-2 leading-relaxed">
                          {rec.reason}
                        </p>
                      )}

                      {/* Actions */}
                      <div className="flex items-center gap-2 mt-3">
                        <button
                          onClick={e => {
                            e.stopPropagation();
                            setLocation(`/contacts/${rec.contactId}`);
                          }}
                          className="sketch-btn text-xs"
                        >
                          View Profile <ArrowRight size={11} />
                        </button>
                        <button
                          onClick={e => {
                            e.stopPropagation();
                            setLocation(`/outreach?contactId=${rec.contactId}`);
                          }}
                          className="sketch-btn sketch-btn-primary text-xs"
                        >
                          <DoodleSparkle size={11} /> Generate Outreach
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="sketch-card p-10 text-center">
            <DoodleHandshake
              size={36}
              className="text-[var(--color-ink-faint)] mx-auto mb-3"
            />
            <p className="text-sm font-medium text-[var(--color-ink-muted)]">
              No recommendations yet.
            </p>
            <p className="text-xs font-mono text-[var(--color-ink-faint)] mt-1 mb-4">
              Add contacts and log coffee chats to generate personalized
              suggestions.
            </p>
            <button
              onClick={() => generateMutation.mutate()}
              disabled={generateMutation.isPending}
              className="sketch-btn sketch-btn-primary text-xs"
            >
              <DoodleSparkle size={12} /> Generate Now
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
