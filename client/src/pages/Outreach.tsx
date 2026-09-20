import { trpc } from "@/lib/trpc";
import { EMAIL_TYPE_LABELS, EmailDraftType } from "@/lib/types";
import { DoodleSparkle, DoodleCheck } from "@/components/DoodleIcons";
import { Check, Copy, Mail, Pencil, Sparkles } from "lucide-react";
import { useState } from "react";
import { useLocation } from "wouter";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { toast } from "sonner";

function EmailCard({
  draft,
  contactName,
  onApprove,
  onUpdate,
}: {
  draft: { id: number; type: string; subject?: string | null; body: string; status: string; contactId: number };
  contactName: string;
  onApprove: (id: number, subject: string, body: string) => void;
  onUpdate: (id: number, subject: string, body: string) => void;
}) {
  const [editing, setEditing] = useState(false);
  const [subject, setSubject] = useState(draft.subject ?? "");
  const [body, setBody] = useState(draft.body);
  const [, setLocation] = useLocation();

  return (
    <div className="sketch-card p-4 space-y-3">
      {/* Card header */}
      <div className="flex items-start justify-between gap-2">
        <div>
          <button
            className="text-sm font-semibold text-[var(--color-ink)] hover:underline transition-colors"
            onClick={() => setLocation(`/contacts/${draft.contactId}`)}
          >
            {contactName}
          </button>
          <div className="flex items-center gap-2 mt-1">
            <span className="sketch-tag text-[10px]">
              {EMAIL_TYPE_LABELS[draft.type as EmailDraftType] ?? draft.type}
            </span>
            {draft.status === "approved" ? (
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-mono font-semibold bg-emerald-50 border border-emerald-200 text-emerald-800">
                <DoodleCheck size={9} /> Approved
              </span>
            ) : (
              <span className="sketch-tag text-[10px]">Draft</span>
            )}
          </div>
        </div>
      </div>

      {/* Body */}
      {editing ? (
        <div className="space-y-2">
          <input
            value={subject}
            onChange={(e) => setSubject(e.target.value)}
            placeholder="Subject line..."
            className="sketch-input w-full text-sm"
          />
          <textarea
            value={body}
            onChange={(e) => setBody(e.target.value)}
            rows={8}
            className="sketch-textarea w-full text-sm font-mono"
          />
          <div className="flex gap-2">
            <button
              onClick={() => { onUpdate(draft.id, subject, body); setEditing(false); }}
              className="sketch-btn sketch-btn-primary text-xs"
            >
              <DoodleCheck size={12} /> Save
            </button>
            <button onClick={() => setEditing(false)} className="sketch-btn text-xs">
              Cancel
            </button>
          </div>
        </div>
      ) : (
        <div className="bg-[var(--color-paper-dark)] rounded border border-[var(--color-border)] p-3">
          {subject && (
            <p className="text-xs mb-2 font-mono">
              <span className="text-[var(--color-ink-faint)]">Subject: </span>
              <span className="text-[var(--color-ink)] font-medium">{subject}</span>
            </p>
          )}
          <p className="text-sm whitespace-pre-wrap text-[var(--color-ink-muted)] leading-relaxed">
            {body}
          </p>
        </div>
      )}

      {/* Actions */}
      {!editing && (
        <div className="flex items-center gap-2">
          <button onClick={() => setEditing(true)} className="sketch-btn text-xs">
            <Pencil size={11} /> Edit
          </button>
          <button
            onClick={() => {
              navigator.clipboard.writeText(`Subject: ${subject}\n\n${body}`);
              toast.success("Copied to clipboard");
            }}
            className="sketch-btn text-xs"
          >
            <Copy size={11} /> Copy
          </button>
          {draft.status !== "approved" && (
            <button
              onClick={() => onApprove(draft.id, subject, body)}
              className="sketch-btn sketch-btn-primary text-xs"
            >
              <Check size={11} /> Approve
            </button>
          )}
          <a
            href={`https://mail.google.com/mail/?view=cm&fs=1&su=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`}
            target="_blank"
            rel="noopener noreferrer"
            className="sketch-btn text-xs ml-auto"
            title="Open in Gmail"
          >
            <Mail size={11} /> Open in Gmail
          </a>
        </div>
      )}
    </div>
  );
}

export default function Outreach() {
  const [selectedContact, setSelectedContact] = useState<string>("");
  const [emailType, setEmailType] = useState<EmailDraftType>("cold_outreach");
  const [typeFilter, setTypeFilter] = useState<string>("all");

  const utils = trpc.useUtils();
  const { data: contactsData } = trpc.contacts.list.useQuery({ limit: 200 });
  const { data: allDrafts, isLoading: draftsLoading, refetch: refetchDrafts } = trpc.emailDrafts.list.useQuery({});

  const generateMutation = trpc.emailDrafts.generate.useMutation({
    onSuccess: () => {
      refetchDrafts();
      toast.success("Email draft generated — review it below");
    },
    onError: (e) => toast.error(e.message),
  });

  const approveMutation = trpc.emailDrafts.approve.useMutation({
    onSuccess: () => { refetchDrafts(); toast.success("Draft approved"); },
    onError: (e) => toast.error(e.message),
  });

  const updateMutation = trpc.emailDrafts.update.useMutation({
    onSuccess: () => { refetchDrafts(); toast.success("Draft saved"); },
    onError: (e) => toast.error(e.message),
  });

  const contacts = contactsData?.contacts ?? [];
  const contactMap = Object.fromEntries(contacts.map((c) => [c.id.toString(), c.name]));
  const drafts = allDrafts ?? [];
  const filteredDrafts = typeFilter === "all" ? drafts : drafts.filter((d) => d.type === typeFilter);

  const approvedCount = drafts.filter((d) => d.status === "approved").length;
  const pendingCount = drafts.filter((d) => d.status !== "approved").length;

  return (
    <div className="min-h-screen paper-bg">
      {/* Page header */}
      <div className="border-b border-[var(--color-border-dark)] px-8 py-6">
        <p className="text-[10px] font-mono font-semibold uppercase tracking-widest text-[var(--color-ink-faint)] mb-1">
          Outreach
        </p>
        <h1 className="text-2xl font-bold tracking-tight text-[var(--color-ink)]">
          Outreach Generator
        </h1>
        <p className="text-sm text-[var(--color-ink-muted)] mt-0.5">
          AI-drafted personalized emails — you review and approve before use
        </p>

        {/* Stats row */}
        <div className="flex items-center gap-4 mt-4">
          <div className="flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-[var(--color-ink)]" />
            <span className="text-xs font-mono text-[var(--color-ink-muted)]">
              {drafts.length} total drafts
            </span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-emerald-400" />
            <span className="text-xs font-mono text-[var(--color-ink-muted)]">
              {approvedCount} approved
            </span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-amber-400" />
            <span className="text-xs font-mono text-[var(--color-ink-muted)]">
              {pendingCount} pending review
            </span>
          </div>
        </div>
      </div>

      <div className="px-8 py-6 space-y-6 max-w-4xl">
        {/* Generator panel */}
        <div className="sketch-card p-5">
          <div className="flex items-center gap-2 mb-4">
            <DoodleSparkle size={16} className="text-[var(--color-ink)]" />
            <span className="text-sm font-semibold text-[var(--color-ink)]">Generate New Draft</span>
          </div>

          <div className="flex flex-wrap items-end gap-3">
            <div className="flex-1 min-w-[200px]">
              <p className="text-xs font-mono text-[var(--color-ink-muted)] mb-1.5">Contact</p>
              <Select
                value={selectedContact || "none"}
                onValueChange={(v) => setSelectedContact(v === "none" ? "" : v)}
              >
                <SelectTrigger className="sketch-input h-9 text-sm w-full">
                  <SelectValue placeholder="Select a contact..." />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">Select a contact...</SelectItem>
                  {contacts.map((c) => (
                    <SelectItem key={c.id} value={c.id.toString()}>
                      {c.name} — {c.firm ?? "?"} ({c.bankingGroup ?? "?"})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="w-44">
              <p className="text-xs font-mono text-[var(--color-ink-muted)] mb-1.5">Email Type</p>
              <Select value={emailType} onValueChange={(v) => setEmailType(v as EmailDraftType)}>
                <SelectTrigger className="sketch-input h-9 text-sm w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="cold_outreach">Cold Outreach</SelectItem>
                  <SelectItem value="follow_up">Follow-Up</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <button
              onClick={() => {
                if (!selectedContact) { toast.error("Select a contact first"); return; }
                generateMutation.mutate({ contactId: parseInt(selectedContact), type: emailType });
              }}
              disabled={!selectedContact || generateMutation.isPending}
              className="sketch-btn sketch-btn-primary h-9 disabled:opacity-40"
            >
              {generateMutation.isPending ? (
                <span className="font-mono text-xs">Generating...</span>
              ) : (
                <>
                  <DoodleSparkle size={13} /> Generate
                </>
              )}
            </button>
          </div>

          <p className="text-[10px] font-mono text-[var(--color-ink-faint)] mt-3 flex items-center gap-1">
            <span className="text-amber-500">⚠</span> All drafts require your review and approval before use. No emails are sent automatically.
          </p>
        </div>

        {/* Filter bar */}
        <div className="flex items-center gap-2">
          <p className="text-xs font-mono font-semibold uppercase tracking-widest text-[var(--color-ink-faint)] mr-2">
            Filter:
          </p>
          {["all", "cold_outreach", "follow_up", "thank_you", "referral_ask"].map((t) => (
            <button
              key={t}
              onClick={() => setTypeFilter(t)}
              className={`text-xs font-mono px-2.5 py-1 rounded border transition-colors ${
                typeFilter === t
                  ? "border-[var(--color-ink)] bg-[var(--color-ink)] text-[var(--color-paper)]"
                  : "border-[var(--color-border-dark)] text-[var(--color-ink-muted)] hover:border-[var(--color-ink-muted)]"
              }`}
            >
              {t === "all" ? "All" : EMAIL_TYPE_LABELS[t as EmailDraftType] ?? t}
            </button>
          ))}
        </div>

        {/* Drafts list */}
        <div>
          <p className="text-xs font-mono font-semibold uppercase tracking-widest text-[var(--color-ink-faint)] mb-3">
            Drafts ({filteredDrafts.length})
          </p>

          {draftsLoading ? (
            <div className="space-y-3">
              {Array.from({ length: 3 }).map((_, i) => (
                <Skeleton key={i} className="h-32 w-full rounded-lg" />
              ))}
            </div>
          ) : filteredDrafts.length === 0 ? (
            <div className="sketch-card p-10 text-center">
              <Mail size={28} className="text-[var(--color-ink-faint)] mx-auto mb-3" />
              <p className="text-sm text-[var(--color-ink-muted)]">No email drafts yet.</p>
              <p className="text-xs font-mono text-[var(--color-ink-faint)] mt-1">
                Select a contact above and generate your first draft.
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {filteredDrafts.map((draft) => (
                <EmailCard
                  key={draft.id}
                  draft={draft}
                  contactName={contactMap[draft.contactId.toString()] ?? `Contact #${draft.contactId}`}
                  onApprove={(id, subject, body) => approveMutation.mutate({ id, subject, body })}
                  onUpdate={(id, subject, body) => updateMutation.mutate({ id, subject, body })}
                />
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
