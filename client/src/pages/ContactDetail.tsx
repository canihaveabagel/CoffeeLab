import { trpc } from "@/lib/trpc";
import {
  STATUS_LABELS,
  STATUS_CLASSES,
  EMAIL_TYPE_LABELS,
  ContactStatus,
  EmailDraftType,
} from "@/lib/types";
import {
  ArrowLeft,
  Check,
  Coffee,
  Copy,
  ExternalLink,
  Mail,
  Pencil,
  Sparkles,
  X,
} from "lucide-react";
import { useState } from "react";
import { useLocation, useParams } from "wouter";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { toast } from "sonner";
import { format } from "date-fns";
import { DoodleCoffeeCup, DoodleSparkle } from "@/components/DoodleIcons";

// ─── Inline editable field ────────────────────────────────────────────────────
function EditableField({
  label,
  value,
  onSave,
  disabled,
  multiline,
  placeholder,
}: {
  label: string;
  value: string | null | undefined;
  onSave: (v: string) => void;
  disabled?: boolean;
  multiline?: boolean;
  placeholder?: string;
}) {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(value ?? "");

  const commit = () => {
    onSave(draft);
    setEditing(false);
  };

  const cancel = () => {
    setDraft(value ?? "");
    setEditing(false);
  };

  return (
    <div className="group">
      <p className="text-[10px] font-mono font-semibold uppercase tracking-widest text-[var(--color-ink-faint)] mb-0.5">
        {label}
      </p>
      {editing ? (
        <div className="flex items-start gap-1.5">
          {multiline ? (
            <textarea
              autoFocus
              value={draft}
              onChange={e => setDraft(e.target.value)}
              rows={4}
              placeholder={placeholder ?? `Enter ${label.toLowerCase()}...`}
              className="sketch-textarea flex-1 text-sm"
            />
          ) : (
            <input
              autoFocus
              value={draft}
              onChange={e => setDraft(e.target.value)}
              placeholder={placeholder ?? `Enter ${label.toLowerCase()}...`}
              className="sketch-input flex-1 text-sm"
              onKeyDown={e => {
                if (e.key === "Enter") commit();
                if (e.key === "Escape") cancel();
              }}
            />
          )}
          <button
            onClick={commit}
            className="p-1.5 hover:bg-[var(--color-paper-dark)] rounded transition-colors text-emerald-600"
          >
            <Check size={13} />
          </button>
          <button
            onClick={cancel}
            className="p-1.5 hover:bg-[var(--color-paper-dark)] rounded transition-colors text-[var(--color-ink-muted)]"
          >
            <X size={13} />
          </button>
        </div>
      ) : (
        <div
          className={`flex items-center justify-between gap-2 py-1 px-2 -mx-2 rounded transition-colors ${disabled ? "" : "hover:bg-[var(--color-paper-dark)] cursor-pointer"}`}
          onClick={() => {
            if (!disabled) {
              setDraft(value ?? "");
              setEditing(true);
            }
          }}
        >
          <span
            className={`text-sm ${value ? "text-[var(--color-ink)]" : "text-[var(--color-ink-faint)] italic"}`}
          >
            {value || `No ${label.toLowerCase()} set`}
          </span>
          {!disabled && (
            <Pencil
              size={11}
              className="text-[var(--color-ink-faint)] opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0"
            />
          )}
        </div>
      )}
    </div>
  );
}

// ─── Email draft card ─────────────────────────────────────────────────────────
function EmailDraftCard({
  draft,
  onApprove,
  onUpdate,
}: {
  draft: {
    id: number;
    type: string;
    subject?: string | null;
    body: string;
    status: string;
  };
  onApprove: (id: number, subject: string, body: string) => void;
  onUpdate: (id: number, subject: string, body: string) => void;
}) {
  const [editing, setEditing] = useState(false);
  const [subject, setSubject] = useState(draft.subject ?? "");
  const [body, setBody] = useState(draft.body);

  const copyToClipboard = () => {
    navigator.clipboard.writeText(`Subject: ${subject}\n\n${body}`);
    toast.success("Copied to clipboard");
  };

  const gmailHref = `https://mail.google.com/mail/?view=cm&fs=1&su=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;

  return (
    <div className="sketch-card p-4 space-y-3">
      <div className="flex items-center gap-2">
        <span className="sketch-tag text-[10px]">
          {EMAIL_TYPE_LABELS[draft.type as EmailDraftType] ?? draft.type}
        </span>
        {draft.status === "approved" ? (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-mono font-semibold bg-emerald-50 border border-emerald-200 text-emerald-800">
            <Check size={10} /> Approved
          </span>
        ) : (
          <span className="sketch-tag text-[10px]">Draft</span>
        )}
      </div>

      {editing ? (
        <div className="space-y-2">
          <input
            value={subject}
            onChange={e => setSubject(e.target.value)}
            placeholder="Subject line..."
            className="sketch-input w-full text-sm"
          />
          <textarea
            value={body}
            onChange={e => setBody(e.target.value)}
            rows={8}
            className="sketch-textarea w-full text-sm font-mono"
          />
          <div className="flex gap-2">
            <button
              onClick={() => {
                onUpdate(draft.id, subject, body);
                setEditing(false);
              }}
              className="sketch-btn sketch-btn-primary text-xs"
            >
              <Check size={11} /> Save
            </button>
            <button
              onClick={() => setEditing(false)}
              className="sketch-btn text-xs"
            >
              Cancel
            </button>
          </div>
        </div>
      ) : (
        <div className="bg-[var(--color-paper-dark)] rounded border border-[var(--color-border)] p-3">
          {subject && (
            <p className="text-xs mb-2 font-mono">
              <span className="text-[var(--color-ink-faint)]">Subject: </span>
              <span className="text-[var(--color-ink)]">{subject}</span>
            </p>
          )}
          <p className="text-sm whitespace-pre-wrap text-[var(--color-ink-muted)] leading-relaxed">
            {body}
          </p>
        </div>
      )}

      {!editing && (
        <div className="flex flex-wrap gap-2">
          <button
            onClick={() => setEditing(true)}
            className="sketch-btn text-xs"
          >
            <Pencil size={11} /> Edit
          </button>
          <button onClick={copyToClipboard} className="sketch-btn text-xs">
            <Copy size={11} /> Copy
          </button>
          <a
            href={gmailHref}
            target="_blank"
            rel="noopener noreferrer"
            className="sketch-btn text-xs"
          >
            <Mail size={11} /> Open in Gmail
          </a>
          {draft.status !== "approved" && (
            <button
              onClick={() => onApprove(draft.id, subject, body)}
              className="sketch-btn sketch-btn-primary text-xs"
            >
              <Check size={11} /> Approve
            </button>
          )}
        </div>
      )}
    </div>
  );
}

// ─── Main page ────────────────────────────────────────────────────────────────
export default function ContactDetail() {
  const params = useParams<{ id: string }>();
  const [, setLocation] = useLocation();
  const contactId = parseInt(params.id ?? "0");
  const utils = trpc.useUtils();

  const { data: contact, isLoading } = trpc.contacts.get.useQuery({
    id: contactId,
  });
  const { data: chats } = trpc.coffeeChats.list.useQuery({ contactId });
  const { data: drafts, refetch: refetchDrafts } =
    trpc.emailDrafts.list.useQuery({ contactId });

  const [activeTab, setActiveTab] = useState<"profile" | "chats" | "emails">(
    "profile"
  );

  const updateMutation = trpc.contacts.update.useMutation({
    onSuccess: () => {
      utils.contacts.get.invalidate({ id: contactId });
      toast.success("Saved");
    },
    onError: e => toast.error(e.message),
  });

  const generateMutation = trpc.emailDrafts.generate.useMutation({
    onSuccess: () => {
      refetchDrafts();
      toast.success("Email draft generated");
    },
    onError: e => toast.error(e.message),
  });

  const approveMutation = trpc.emailDrafts.approve.useMutation({
    onSuccess: () => {
      refetchDrafts();
      toast.success("Draft approved");
    },
    onError: e => toast.error(e.message),
  });

  const updateDraftMutation = trpc.emailDrafts.update.useMutation({
    onSuccess: () => {
      refetchDrafts();
      toast.success("Draft saved");
    },
    onError: e => toast.error(e.message),
  });

  const save = (field: string, value: string) => {
    if (contact?.isDemo) {
      toast.error("Demo contacts cannot be edited");
      return;
    }
    updateMutation.mutate({
      id: contactId,
      [field]: value || null,
    } as Parameters<typeof updateMutation.mutate>[0]);
  };

  if (isLoading) {
    return (
      <div className="p-8 space-y-4">
        <Skeleton className="h-6 w-32" />
        <Skeleton className="h-24 w-full" />
        <Skeleton className="h-64 w-full" />
      </div>
    );
  }

  if (!contact) {
    return (
      <div className="min-h-screen paper-bg flex items-center justify-center">
        <div className="text-center space-y-3">
          <p className="text-sm text-[var(--color-ink-muted)]">
            Contact not found.
          </p>
          <button
            onClick={() => setLocation("/contacts")}
            className="sketch-btn text-xs"
          >
            <ArrowLeft size={12} /> Back to Contacts
          </button>
        </div>
      </div>
    );
  }

  const initials = contact.name
    .split(" ")
    .map(n => n[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();

  return (
    <div className="min-h-screen paper-bg">
      {/* ── Header ── */}
      <div className="border-b border-[var(--color-border-dark)] px-8 py-5">
        <button
          onClick={() => setLocation("/contacts")}
          className="flex items-center gap-1.5 text-xs font-mono text-[var(--color-ink-muted)] hover:text-[var(--color-ink)] transition-colors mb-4"
        >
          <ArrowLeft size={12} /> Back to Contacts
        </button>

        <div className="flex items-start justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="h-12 w-12 rounded-full bg-[var(--color-paper-dark)] border-2 border-[var(--color-border-dark)] flex items-center justify-center text-lg font-bold font-mono text-[var(--color-ink)]">
              {initials}
            </div>
            <div>
              {/* Editable name inline */}
              <EditableNameField
                value={contact.name}
                onSave={v => save("name", v)}
                disabled={!!contact.isDemo}
              />
              <p className="text-sm text-[var(--color-ink-muted)] mt-0.5">
                {[contact.role, contact.bankingGroup, contact.firm]
                  .filter(Boolean)
                  .join(" · ")}
              </p>
              {contact.isDemo && (
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-mono font-semibold bg-amber-50 border border-amber-200 text-amber-700 mt-1">
                  demo
                </span>
              )}
            </div>
          </div>

          <div className="flex items-center gap-2">
            {contact.linkedinUrl && (
              <a
                href={contact.linkedinUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="sketch-btn text-xs"
              >
                <ExternalLink size={12} /> LinkedIn
              </a>
            )}
            <Select
              value={contact.status}
              onValueChange={v =>
                updateMutation.mutate({
                  id: contactId,
                  status: v as ContactStatus,
                })
              }
              disabled={!!contact.isDemo}
            >
              <SelectTrigger
                className={`h-8 text-xs w-36 sketch-input ${STATUS_CLASSES[contact.status as ContactStatus] ?? ""}`}
              >
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {Object.entries(STATUS_LABELS).map(([v, l]) => (
                  <SelectItem key={v} value={v}>
                    {l}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
      </div>

      {/* ── Tab bar ── */}
      <div className="flex items-center gap-0 border-b border-[var(--color-border-dark)] px-8">
        {(["profile", "chats", "emails"] as const).map(tab => {
          const count =
            tab === "chats"
              ? (chats?.length ?? 0)
              : tab === "emails"
                ? (drafts?.length ?? 0)
                : 0;
          return (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`px-4 py-2.5 text-xs font-mono font-semibold capitalize border-b-2 transition-colors -mb-px ${
                activeTab === tab
                  ? "border-[var(--color-ink)] text-[var(--color-ink)]"
                  : "border-transparent text-[var(--color-ink-muted)] hover:text-[var(--color-ink)]"
              }`}
            >
              {tab === "chats"
                ? "Coffee Chats"
                : tab === "emails"
                  ? "Email Drafts"
                  : "Profile"}
              {count > 0 && (
                <span className="ml-1.5 px-1.5 py-0.5 rounded-full text-[9px] bg-[var(--color-paper-dark)] border border-[var(--color-border-dark)]">
                  {count}
                </span>
              )}
            </button>
          );
        })}
      </div>

      <div className="mx-auto w-full max-w-6xl px-5 py-6 sm:px-8">
        {/* ── Profile Tab ── */}
        {activeTab === "profile" && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-3xl">
            {/* Professional */}
            <div className="sketch-card p-5 space-y-4">
              <p className="text-[10px] font-mono font-semibold uppercase tracking-widest text-[var(--color-ink-faint)]">
                Professional
              </p>
              <EditableField
                label="Firm"
                value={contact.firm}
                onSave={v => save("firm", v)}
                disabled={!!contact.isDemo}
              />
              <EditableField
                label="Group / Division"
                value={contact.bankingGroup}
                onSave={v => save("bankingGroup", v)}
                disabled={!!contact.isDemo}
              />
              <EditableField
                label="Role"
                value={contact.role}
                onSave={v => save("role", v)}
                disabled={!!contact.isDemo}
              />
              <EditableField
                label="Industry"
                value={contact.industry}
                onSave={v => save("industry", v)}
                disabled={!!contact.isDemo}
              />
              <EditableField
                label="Email"
                value={contact.email}
                onSave={v => save("email", v)}
                disabled={!!contact.isDemo}
                placeholder="name@firm.com"
              />
              <EditableField
                label="LinkedIn URL"
                value={contact.linkedinUrl}
                onSave={v => save("linkedinUrl", v)}
                disabled={!!contact.isDemo}
                placeholder="https://linkedin.com/in/..."
              />
            </div>

            {/* Background */}
            <div className="sketch-card p-5 space-y-4">
              <p className="text-[10px] font-mono font-semibold uppercase tracking-widest text-[var(--color-ink-faint)]">
                Background
              </p>
              <EditableField
                label="School"
                value={contact.school}
                onSave={v => save("school", v)}
                disabled={!!contact.isDemo}
              />
              <EditableField
                label="Major"
                value={contact.major}
                onSave={v => save("major", v)}
                disabled={!!contact.isDemo}
              />
              <EditableField
                label="Club / Organization"
                value={contact.club}
                onSave={v => save("club", v)}
                disabled={!!contact.isDemo}
              />
              <EditableField
                label="Hometown"
                value={contact.hometown}
                onSave={v => save("hometown", v)}
                disabled={!!contact.isDemo}
              />
            </div>

            {/* Notes */}
            <div className="sketch-card p-5 md:col-span-2">
              <p className="text-[10px] font-mono font-semibold uppercase tracking-widest text-[var(--color-ink-faint)] mb-3">
                Notes
              </p>
              <EditableField
                label=""
                value={contact.notes}
                onSave={v => save("notes", v)}
                disabled={!!contact.isDemo}
                multiline
                placeholder="Add notes about this contact..."
              />
            </div>
          </div>
        )}

        {/* ── Coffee Chats Tab ── */}
        {activeTab === "chats" && (
          <div className="space-y-3 max-w-2xl">
            <div className="flex justify-end">
              <button
                onClick={() =>
                  setLocation(`/coffee-chat?contactId=${contactId}`)
                }
                className="sketch-btn sketch-btn-primary text-xs"
              >
                <DoodleCoffeeCup size={13} /> Log Chat
              </button>
            </div>
            {chats && chats.length > 0 ? (
              chats.map(chat => (
                <div
                  key={chat.id}
                  className="sketch-card p-4 cursor-pointer hover:border-[var(--color-ink)] transition-colors"
                  onClick={() => setLocation(`/coffee-chat/${chat.id}`)}
                >
                  <div className="flex items-center justify-between mb-2">
                    <p className="text-sm font-medium text-[var(--color-ink)]">
                      {chat.chatDate
                        ? format(new Date(chat.chatDate), "MMM d, yyyy")
                        : "Date unknown"}
                    </p>
                    <span
                      className={`text-[9px] font-mono px-1.5 py-0.5 rounded border ${
                        chat.transcriptionStatus === "done"
                          ? "bg-emerald-50 border-emerald-200 text-emerald-700"
                          : "bg-[var(--color-paper-dark)] border-[var(--color-border-dark)] text-[var(--color-ink-faint)]"
                      }`}
                    >
                      {chat.transcriptionStatus}
                    </span>
                  </div>
                  {chat.transcriptText && (
                    <p className="text-xs text-[var(--color-ink-muted)] line-clamp-3 font-mono">
                      {chat.transcriptText}
                    </p>
                  )}
                </div>
              ))
            ) : (
              <div className="sketch-card p-10 text-center">
                <DoodleCoffeeCup
                  size={32}
                  className="text-[var(--color-ink-faint)] mx-auto mb-2"
                />
                <p className="text-sm text-[var(--color-ink-muted)]">
                  No coffee chats logged yet.
                </p>
              </div>
            )}
          </div>
        )}

        {/* ── Email Drafts Tab ── */}
        {activeTab === "emails" && (
          <div className="space-y-3 max-w-2xl">
            {/* Outreach emails (no chat required) */}
            <div>
              <p className="text-[10px] font-mono font-semibold uppercase tracking-widest text-[var(--color-ink-faint)] mb-2">
                Outreach Emails
              </p>
              <div className="flex flex-wrap gap-2">
                {(["cold_outreach", "follow_up"] as EmailDraftType[]).map(
                  type => (
                    <button
                      key={type}
                      disabled={generateMutation.isPending || !!contact.isDemo}
                      onClick={() =>
                        generateMutation.mutate({ contactId, type })
                      }
                      className="sketch-btn text-xs disabled:opacity-40"
                    >
                      <DoodleSparkle size={12} />
                      Generate {EMAIL_TYPE_LABELS[type]}
                    </button>
                  )
                )}
              </div>
            </div>

            {/* Post-chat emails */}
            <div>
              <p className="text-[10px] font-mono font-semibold uppercase tracking-widest text-[var(--color-ink-faint)] mb-2">
                Post-Chat Emails
              </p>
              <div className="flex flex-wrap gap-2">
                {(["thank_you", "referral_ask"] as EmailDraftType[]).map(
                  type => {
                    const latestChat = chats?.[0];
                    return (
                      <button
                        key={type}
                        disabled={
                          generateMutation.isPending || !!contact.isDemo
                        }
                        onClick={() =>
                          generateMutation.mutate({
                            contactId,
                            type,
                            chatId: latestChat?.id,
                          })
                        }
                        className="sketch-btn text-xs disabled:opacity-40"
                      >
                        <DoodleSparkle size={12} />
                        Generate {EMAIL_TYPE_LABELS[type]}
                      </button>
                    );
                  }
                )}
              </div>
              {(!chats || chats.length === 0) && (
                <p className="text-[10px] font-mono text-[var(--color-ink-faint)] mt-1.5">
                  Tip: adding a coffee chat transcript will make these emails
                  more personalised.
                </p>
              )}
            </div>

            {drafts && drafts.length > 0 ? (
              drafts.map(draft => (
                <EmailDraftCard
                  key={draft.id}
                  draft={draft}
                  onApprove={(id, subject, body) =>
                    approveMutation.mutate({ id, subject, body })
                  }
                  onUpdate={(id, subject, body) =>
                    updateDraftMutation.mutate({ id, subject, body })
                  }
                />
              ))
            ) : (
              <div className="sketch-card p-10 text-center">
                <Mail
                  size={28}
                  className="text-[var(--color-ink-faint)] mx-auto mb-2"
                />
                <p className="text-sm text-[var(--color-ink-muted)]">
                  No email drafts yet.
                </p>
                <p className="text-xs font-mono text-[var(--color-ink-faint)] mt-1">
                  Generate a cold outreach or follow-up above.
                </p>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

// ─── Inline editable name (larger, header style) ──────────────────────────────
function EditableNameField({
  value,
  onSave,
  disabled,
}: {
  value: string;
  onSave: (v: string) => void;
  disabled?: boolean;
}) {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(value);

  const commit = () => {
    if (draft.trim()) {
      onSave(draft.trim());
    }
    setEditing(false);
  };
  const cancel = () => {
    setDraft(value);
    setEditing(false);
  };

  if (editing) {
    return (
      <div className="flex items-center gap-1.5">
        <input
          autoFocus
          value={draft}
          onChange={e => setDraft(e.target.value)}
          className="sketch-input text-xl font-bold w-64"
          onKeyDown={e => {
            if (e.key === "Enter") commit();
            if (e.key === "Escape") cancel();
          }}
        />
        <button
          onClick={commit}
          className="p-1.5 text-emerald-600 hover:bg-[var(--color-paper-dark)] rounded"
        >
          <Check size={14} />
        </button>
        <button
          onClick={cancel}
          className="p-1.5 text-[var(--color-ink-muted)] hover:bg-[var(--color-paper-dark)] rounded"
        >
          <X size={14} />
        </button>
      </div>
    );
  }

  return (
    <div
      className={`group flex items-center gap-2 ${disabled ? "" : "cursor-pointer"}`}
      onClick={() => {
        if (!disabled) {
          setDraft(value);
          setEditing(true);
        }
      }}
    >
      <h1 className="text-xl font-bold text-[var(--color-ink)]">{value}</h1>
      {!disabled && (
        <Pencil
          size={13}
          className="text-[var(--color-ink-faint)] opacity-0 group-hover:opacity-100 transition-opacity"
        />
      )}
    </div>
  );
}
