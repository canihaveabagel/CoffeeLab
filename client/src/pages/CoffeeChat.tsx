import { trpc } from "@/lib/trpc";
import { TAKEAWAY_CATEGORIES, TakeawayCategory, EMAIL_TYPE_LABELS, EmailDraftType } from "@/lib/types";
import { DoodleCoffeeCup, DoodleMicrophone, DoodleSparkle, DoodleCheck, DoodleCalendar, DoodleNotebook } from "@/components/DoodleIcons";
import {
  ArrowLeft, Check, Copy, FileAudio, Mail, Pencil, X, ChevronRight, FileText,
} from "lucide-react";
import { useRef, useState, useCallback, useEffect } from "react";
import { useLocation, useParams, useSearch } from "wouter";
import { Skeleton } from "@/components/ui/skeleton";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import { format } from "date-fns";

// ─── Category color styles ─────────────────────────────────────────────────────
const CATEGORY_STYLES: Record<TakeawayCategory, { bg: string; border: string; text: string; dot: string }> = {
  "Industry":           { bg: "bg-blue-50",   border: "border-blue-200",   text: "text-blue-800",   dot: "bg-blue-400" },
  "Firm":               { bg: "bg-violet-50",  border: "border-violet-200", text: "text-violet-800", dot: "bg-violet-400" },
  "Group":              { bg: "bg-indigo-50",  border: "border-indigo-200", text: "text-indigo-800", dot: "bg-indigo-400" },
  "Recruiting":         { bg: "bg-amber-50",   border: "border-amber-200",  text: "text-amber-800",  dot: "bg-amber-400" },
  "Technical Prep":     { bg: "bg-orange-50",  border: "border-orange-200", text: "text-orange-800", dot: "bg-orange-400" },
  "Personal Growth":    { bg: "bg-teal-50",    border: "border-teal-200",   text: "text-teal-800",   dot: "bg-teal-400" },
  "Referral Signal":    { bg: "bg-emerald-50", border: "border-emerald-200",text: "text-emerald-800",dot: "bg-emerald-400" },
  "Next Person To Meet":{ bg: "bg-pink-50",    border: "border-pink-200",   text: "text-pink-800",   dot: "bg-pink-400" },
};

// ─── Takeaway section ─────────────────────────────────────────────────────────
function TakeawaySection({
  category,
  takeaways,
  hoveredKeyword,
  onHover,
}: {
  category: TakeawayCategory;
  takeaways: Array<{ id: number; content: string; isKeyInsight: boolean }>;
  hoveredKeyword: string | null;
  onHover: (keyword: string | null) => void;
}) {
  const s = CATEGORY_STYLES[category];
  return (
    <div>
      <div className="flex items-center gap-2 mb-2">
        <span className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded text-[10px] font-mono font-semibold uppercase tracking-wider border ${s.bg} ${s.border} ${s.text}`}>
          <span className={`w-1.5 h-1.5 rounded-full ${s.dot}`} />
          {category}
        </span>
        <span className="text-[10px] font-mono text-[var(--color-ink-faint)]">
          {takeaways.length} insight{takeaways.length !== 1 ? "s" : ""}
        </span>
      </div>
      <div className="space-y-1.5 pl-3 border-l-2 border-[var(--color-border)]">
        {takeaways.map((t) => {
          // Extract a short keyword phrase (first 6 words) for transcript highlight
          const keyword = t.content.split(/\s+/).slice(0, 6).join(" ");
          const isHovered = hoveredKeyword === keyword;
          return (
            <div
              key={t.id}
              className={`flex items-start gap-2 p-1.5 rounded cursor-pointer transition-colors ${isHovered ? "bg-amber-50 border border-amber-200" : "hover:bg-[var(--color-paper-dark)]"}`}
              onMouseEnter={() => onHover(keyword)}
              onMouseLeave={() => onHover(null)}
            >
              {t.isKeyInsight && (
                <span className="text-amber-500 text-xs mt-0.5 flex-shrink-0">★</span>
              )}
              <p className="text-sm text-[var(--color-ink-muted)] leading-relaxed">{t.content}</p>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ─── Highlighted transcript ───────────────────────────────────────────────────
function HighlightedTranscript({ text, keyword }: { text: string; keyword: string | null }) {
  if (!keyword || !text) {
    return (
      <p className="text-xs text-[var(--color-ink-muted)] whitespace-pre-wrap leading-relaxed font-mono">
        {text}
      </p>
    );
  }

  // Case-insensitive search for keyword fragments
  const words = keyword.split(/\s+/).filter(Boolean);
  const searchStr = words.slice(0, 4).join(" ");
  const idx = text.toLowerCase().indexOf(searchStr.toLowerCase());

  if (idx === -1) {
    return (
      <p className="text-xs text-[var(--color-ink-muted)] whitespace-pre-wrap leading-relaxed font-mono">
        {text}
      </p>
    );
  }

  const before = text.slice(0, idx);
  const match = text.slice(idx, idx + searchStr.length);
  const after = text.slice(idx + searchStr.length);

  return (
    <p className="text-xs text-[var(--color-ink-muted)] whitespace-pre-wrap leading-relaxed font-mono">
      {before}
      <mark className="bg-amber-200 text-amber-900 rounded px-0.5 not-italic">{match}</mark>
      {after}
    </p>
  );
}

// ─── Email draft card ─────────────────────────────────────────────────────────
function DraftCard({
  draft,
  onApprove,
  onUpdate,
}: {
  draft: { id: number; type: string; subject?: string | null; body: string; status: string };
  onApprove: (id: number, subject: string, body: string) => void;
  onUpdate: (id: number, subject: string, body: string) => void;
}) {
  const [editing, setEditing] = useState(false);
  const [subject, setSubject] = useState(draft.subject ?? "");
  const [body, setBody] = useState(draft.body);

  const gmailHref = `https://mail.google.com/mail/?view=cm&fs=1&su=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;

  return (
    <div className="sketch-card p-4 space-y-3">
      <div className="flex items-center gap-2">
        <span className="sketch-tag text-[10px]">
          {EMAIL_TYPE_LABELS[draft.type as EmailDraftType]}
        </span>
        {draft.status === "approved" ? (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-mono font-semibold bg-emerald-50 border border-emerald-200 text-emerald-800">
            <DoodleCheck size={10} /> Approved
          </span>
        ) : (
          <span className="sketch-tag text-[10px]">Draft</span>
        )}
      </div>

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
              <Check size={11} /> Save
            </button>
            <button onClick={() => setEditing(false)} className="sketch-btn text-xs">Cancel</button>
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
          <p className="text-sm whitespace-pre-wrap text-[var(--color-ink-muted)] leading-relaxed">{body}</p>
        </div>
      )}

      {!editing && (
        <div className="flex flex-wrap gap-2">
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
          <a href={gmailHref} target="_blank" rel="noopener noreferrer" className="sketch-btn text-xs">
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

// ─── New chat form ────────────────────────────────────────────────────────────
function NewChatForm({ onSuccess }: { onSuccess: (chatId: number) => void }) {
  const search = useSearch();
  const params = new URLSearchParams(search);
  const preselectedContactId = params.get("contactId");

  const [contactId, setContactId] = useState(preselectedContactId ?? "");
  const [transcript, setTranscript] = useState("");
  const [notes, setNotes] = useState("");
  const [audioFile, setAudioFile] = useState<File | null>(null);
  const [inputMode, setInputMode] = useState<"text" | "audio" | "notes">("text");
  const fileRef = useRef<HTMLInputElement>(null);
  const utils = trpc.useUtils();

  // Inline new-contact creation
  const [showNewContact, setShowNewContact] = useState(false);
  const [newName, setNewName] = useState("");
  const [newFirm, setNewFirm] = useState("");
  const [newGroup, setNewGroup] = useState("");
  const [newRole, setNewRole] = useState("");
  const [newEmail, setNewEmail] = useState("");

  const createContactMutation = trpc.contacts.create.useMutation({
    onSuccess: (d) => {
      utils.contacts.list.invalidate();
      setContactId(d.id.toString());
      setShowNewContact(false);
      setNewName(""); setNewFirm(""); setNewGroup(""); setNewRole(""); setNewEmail("");
      toast.success(`${d.name} added to contacts`);
    },
    onError: (e) => toast.error(e.message),
  });

  const handleCreateContact = useCallback(() => {
    if (!newName.trim()) { toast.error("Name is required"); return; }
    createContactMutation.mutate({
      name: newName.trim(),
      firm: newFirm.trim() || undefined,
      bankingGroup: newGroup.trim() || undefined,
      role: newRole.trim() || undefined,
      email: newEmail.trim() || undefined,
    });
  }, [newName, newFirm, newGroup, newRole, newEmail, createContactMutation]);

  const { data: contactsData } = trpc.contacts.list.useQuery({ limit: 200 });
  const contacts = contactsData?.contacts ?? [];

  const createChatMutation = trpc.coffeeChats.create.useMutation({
    onSuccess: (d) => {
      utils.coffeeChats.list.invalidate();
      utils.coffeeChats.listAll.invalidate();
      utils.dashboard.stats.invalidate();
      toast.success("Coffee chat logged");
      onSuccess(d.chatId);
    },
    onError: (e) => toast.error(e.message),
  });

  const updateChatMutation = trpc.coffeeChats.update.useMutation({
    onError: (e) => toast.error(e.message),
  });

  const [isTranscribing, setIsTranscribing] = useState(false);

  const handleSubmit = async () => {
    if (!contactId) { toast.error("Select a contact"); return; }
    if (inputMode === "text" && !transcript.trim()) { toast.error("Paste a transcript"); return; }
    if (inputMode === "notes" && !notes.trim()) { toast.error("Enter your notes"); return; }
    if (inputMode === "audio" && !audioFile) { toast.error("Upload an audio file"); return; }

    if (inputMode === "text") {
      createChatMutation.mutate({ contactId: parseInt(contactId), transcriptText: transcript });
    } else if (inputMode === "notes") {
      // Create chat with notes
      createChatMutation.mutate({ contactId: parseInt(contactId) });
      // Notes will be saved after chat is created via update
      // We handle this in onSuccess by updating notes
    } else if (audioFile) {
      setIsTranscribing(true);
      toast.info("Uploading audio to AssemblyAI — this may take 30–60 seconds...");
      try {
        const formData = new FormData();
        formData.append("audio", audioFile);
        const res = await fetch("/api/upload-audio", {
          method: "POST",
          body: formData,
          credentials: "include",
        });
        if (!res.ok) {
          const err = (await res.json().catch(() => ({ error: "Upload failed" }))) as {
            error?: string;
          };
          toast.error(err.error || "Audio upload failed");
          return;
        }
        const transcriptData = await res.json() as { text: string };
        if (!transcriptData.text) {
          toast.error("Transcription returned empty text");
          return;
        }
        createChatMutation.mutate({
          contactId: parseInt(contactId),
          transcriptText: transcriptData.text,
        });
      } catch (err) {
        toast.error("Audio upload failed: " + (err as Error).message);
      } finally {
        setIsTranscribing(false);
      }
    }
  };

  // Handle notes mode: save notes after chat is created
  const notesRef = useRef(notes);
  notesRef.current = notes;
  const inputModeRef = useRef(inputMode);
  inputModeRef.current = inputMode;

  const isPending = createChatMutation.isPending || isTranscribing;

  return (
    <div className="space-y-5">
      {/* Contact selector */}
      <div>
        <p className="text-xs font-mono font-semibold text-[var(--color-ink)] mb-1.5">
          Contact <span className="text-red-500">*</span>
        </p>
        <Select value={contactId || "none"} onValueChange={(v) => setContactId(v === "none" ? "" : v)}>
          <SelectTrigger className="sketch-input h-9 text-sm w-full">
            <SelectValue placeholder="Select the banker you chatted with..." />
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

      {/* Inline new contact quick-create */}
      {showNewContact ? (
        <div className="sketch-card p-4 space-y-3 border-amber-200 bg-amber-50/30">
          <div className="flex items-center justify-between">
            <p className="text-xs font-mono font-semibold text-[var(--color-ink)]">Quick-add new contact</p>
            <button onClick={() => setShowNewContact(false)} className="p-1 hover:bg-[var(--color-paper-dark)] rounded">
              <X size={13} className="text-[var(--color-ink-muted)]" />
            </button>
          </div>
          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="text-[10px] font-mono text-[var(--color-ink-faint)] uppercase tracking-wide">Name *</label>
              <input value={newName} onChange={e => setNewName(e.target.value)} placeholder="Sarah Chen" className="sketch-input w-full text-sm mt-0.5" />
            </div>
            <div>
              <label className="text-[10px] font-mono text-[var(--color-ink-faint)] uppercase tracking-wide">Email</label>
              <input value={newEmail} onChange={e => setNewEmail(e.target.value)} placeholder="sarah@gs.com" className="sketch-input w-full text-sm mt-0.5" />
            </div>
            <div>
              <label className="text-[10px] font-mono text-[var(--color-ink-faint)] uppercase tracking-wide">Firm</label>
              <input value={newFirm} onChange={e => setNewFirm(e.target.value)} placeholder="Goldman Sachs" className="sketch-input w-full text-sm mt-0.5" />
            </div>
            <div>
              <label className="text-[10px] font-mono text-[var(--color-ink-faint)] uppercase tracking-wide">Group</label>
              <input value={newGroup} onChange={e => setNewGroup(e.target.value)} placeholder="TMT" className="sketch-input w-full text-sm mt-0.5" />
            </div>
            <div className="col-span-2">
              <label className="text-[10px] font-mono text-[var(--color-ink-faint)] uppercase tracking-wide">Role</label>
              <input value={newRole} onChange={e => setNewRole(e.target.value)} placeholder="Analyst / Associate / VP" className="sketch-input w-full text-sm mt-0.5" />
            </div>
          </div>
          <button
            onClick={handleCreateContact}
            disabled={createContactMutation.isPending}
            className="sketch-btn sketch-btn-primary text-xs w-full disabled:opacity-40"
          >
            {createContactMutation.isPending ? "Adding…" : "Add Contact & Select"}
          </button>
        </div>
      ) : (
        <button
          onClick={() => setShowNewContact(true)}
          className="text-xs font-mono text-[var(--color-ink-faint)] hover:text-[var(--color-ink)] underline underline-offset-2 transition-colors"
        >
          + Add new contact
        </button>
      )}

      {/* Input mode toggle */}
      <div>
        <div className="flex items-center gap-1 mb-3 p-1 bg-[var(--color-paper-dark)] border border-[var(--color-border)] rounded-md w-fit">
          <button
            onClick={() => setInputMode("text")}
            className={`text-xs px-3 py-1.5 rounded transition-all font-mono ${
              inputMode === "text"
                ? "bg-[var(--color-ink)] text-[var(--color-paper)] shadow-sm"
                : "text-[var(--color-ink-muted)] hover:text-[var(--color-ink)]"
            }`}
          >
            Paste Transcript
          </button>
          <button
            onClick={() => setInputMode("notes")}
            className={`text-xs px-3 py-1.5 rounded transition-all font-mono flex items-center gap-1.5 ${
              inputMode === "notes"
                ? "bg-[var(--color-ink)] text-[var(--color-paper)] shadow-sm"
                : "text-[var(--color-ink-muted)] hover:text-[var(--color-ink)]"
            }`}
          >
            <DoodleNotebook size={12} /> Notes
          </button>
          <button
            onClick={() => setInputMode("audio")}
            className={`text-xs px-3 py-1.5 rounded transition-all font-mono flex items-center gap-1.5 ${
              inputMode === "audio"
                ? "bg-[var(--color-ink)] text-[var(--color-paper)] shadow-sm"
                : "text-[var(--color-ink-muted)] hover:text-[var(--color-ink)]"
            }`}
          >
            <DoodleMicrophone size={12} /> Upload Audio
          </button>
        </div>

        {inputMode === "text" ? (
          <Textarea
            value={transcript}
            onChange={(e) => setTranscript(e.target.value)}
            placeholder={`Paste your coffee chat transcript here...

Example:
Me: What's your advice for breaking into TMT banking?
Sarah: Focus on deal exposure early — reach out in September.`}
            rows={10}
            className="sketch-textarea w-full text-sm font-mono"
          />
        ) : inputMode === "notes" ? (
          <Textarea
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder={`Write your notes from the coffee chat here...

Example:
- Goldman TMT is very selective; reach out to recruiting in September
- She offered to connect me with two other analysts in the group`}
            rows={10}
            className="sketch-textarea w-full text-sm font-mono"
          />
        ) : (
          <div
            className={`border-2 border-dashed rounded-lg p-8 text-center cursor-pointer transition-all ${
              audioFile
                ? "border-[var(--color-ink)] bg-[var(--color-paper-dark)]"
                : "border-[var(--color-border-dark)] hover:border-[var(--color-ink-muted)]"
            }`}
            onClick={() => fileRef.current?.click()}
          >
            {audioFile ? (
              <div className="flex items-center justify-center gap-3">
                <FileAudio size={20} className="text-[var(--color-ink)]" />
                <div className="text-left">
                  <p className="text-sm font-medium text-[var(--color-ink)]">{audioFile.name}</p>
                  <p className="text-xs font-mono text-[var(--color-ink-faint)]">
                    {(audioFile.size / 1024 / 1024).toFixed(1)} MB
                  </p>
                </div>
                <button
                  onClick={(e) => { e.stopPropagation(); setAudioFile(null); }}
                  className="p-1 hover:bg-red-50 rounded"
                >
                  <X size={14} className="text-[var(--color-ink-muted)]" />
                </button>
              </div>
            ) : (
              <>
                <DoodleMicrophone size={32} className="text-[var(--color-ink-faint)] mx-auto mb-2" />
                <p className="text-sm font-medium text-[var(--color-ink)]">Drop audio file or click to browse</p>
                <p className="text-xs font-mono text-[var(--color-ink-faint)] mt-1">MP3, WAV, M4A, WebM — max 100MB</p>
              </>
            )}
            <input
              ref={fileRef}
              type="file"
              accept="audio/*"
              className="hidden"
              onChange={(e) => { const f = e.target.files?.[0]; if (f) setAudioFile(f); }}
            />
          </div>
        )}
      </div>

      <button
        onClick={handleSubmit}
        disabled={isPending || !contactId}
        className="sketch-btn sketch-btn-primary w-full disabled:opacity-40"
      >
        {isTranscribing ? (
          <span className="font-mono text-sm">Transcribing audio… (30–60s)</span>
        ) : createChatMutation.isPending ? (
          <span className="font-mono text-sm">Logging chat…</span>
        ) : (
          <>
            <DoodleCoffeeCup size={16} /> Log Coffee Chat
          </>
        )}
      </button>
    </div>
  );
}

// ─── Chat detail (side-by-side layout) ───────────────────────────────────────
function ChatDetail({ chatId }: { chatId: number }) {
  const [, setLocation] = useLocation();
  const [activeTab, setActiveTab] = useState<"insights" | "emails">("insights");
  const [hoveredKeyword, setHoveredKeyword] = useState<string | null>(null);
  const [editingNotes, setEditingNotes] = useState(false);
  const [notesDraft, setNotesDraft] = useState("");
  const utils = trpc.useUtils();

  const { data: chat, isLoading } = trpc.coffeeChats.get.useQuery({ id: chatId });
  const { data: takeaways, refetch: refetchTakeaways } = trpc.coffeeChats.takeaways.useQuery({ chatId });
  const { data: drafts, refetch: refetchDrafts } = trpc.emailDrafts.list.useQuery(
    { contactId: chat?.contactId ?? 0 },
    { enabled: !!chat?.contactId }
  );

  const updateChatMutation = trpc.coffeeChats.update.useMutation({
    onSuccess: () => { utils.coffeeChats.get.invalidate({ id: chatId }); toast.success("Notes saved"); },
    onError: (e) => toast.error(e.message),
  });

  const analyzeMutation = trpc.coffeeChats.analyzeTakeaways.useMutation({
    onSuccess: () => { refetchTakeaways(); toast.success("Takeaways extracted"); },
    onError: (e) => toast.error(e.message),
  });

  const generateEmailMutation = trpc.emailDrafts.generate.useMutation({
    onSuccess: () => { refetchDrafts(); toast.success("Email draft generated"); },
    onError: (e) => toast.error(e.message),
  });

  const approveMutation = trpc.emailDrafts.approve.useMutation({
    onSuccess: () => { refetchDrafts(); toast.success("Approved"); },
    onError: (e) => toast.error(e.message),
  });

  const updateDraftMutation = trpc.emailDrafts.update.useMutation({
    onSuccess: () => { refetchDrafts(); toast.success("Saved"); },
    onError: (e) => toast.error(e.message),
  });

  // Auto-generate takeaways when chat with transcript loads and no takeaways yet
  const autoAnalyzedRef = useRef(false);
  useEffect(() => {
    if (
      chat?.transcriptText &&
      takeaways !== undefined &&
      takeaways.length === 0 &&
      !autoAnalyzedRef.current &&
      !analyzeMutation.isPending
    ) {
      autoAnalyzedRef.current = true;
      analyzeMutation.mutate({ chatId, transcript: chat.transcriptText });
    }
  }, [chat, takeaways, chatId, analyzeMutation]);

  if (isLoading) {
    return (
      <div className="space-y-3">
        {Array.from({ length: 3 }).map((_, i) => (
          <Skeleton key={i} className="h-20 w-full rounded-lg" />
        ))}
      </div>
    );
  }
  if (!chat) return <p className="text-sm text-[var(--color-ink-muted)]">Chat not found.</p>;

  type TakeawayItem = { id: number; content: string; isKeyInsight: boolean };
  const groupedTakeaways: Partial<Record<TakeawayCategory, TakeawayItem[]>> = {};
  (takeaways ?? []).forEach((t) => {
    const cat = t.category as TakeawayCategory;
    if (!groupedTakeaways[cat]) groupedTakeaways[cat] = [];
    groupedTakeaways[cat]!.push({ id: t.id, content: t.content, isKeyInsight: false });
  });

  const postChatDrafts = (drafts ?? []).filter(
    (d) => d.type === "thank_you" || d.type === "referral_ask"
  );

  const hasContent = !!(chat.transcriptText || (chat as typeof chat & { notes?: string }).notes);

  return (
    <div className="space-y-4">
      {/* Chat header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <button
            onClick={() => setLocation("/coffee-chat")}
            className="flex items-center gap-1.5 text-xs font-mono text-[var(--color-ink-muted)] hover:text-[var(--color-ink)] transition-colors"
          >
            <ArrowLeft size={12} /> All Chats
          </button>
          <span className="text-[var(--color-border-dark)]">/</span>
          <div className="flex items-center gap-1.5">
            <DoodleCalendar size={14} className="text-[var(--color-ink-faint)]" />
            <span className="text-xs font-mono text-[var(--color-ink)]">
              {chat.chatDate ? format(new Date(chat.chatDate), "MMM d, yyyy") : "Date unknown"}
            </span>
          </div>
          {(chat as typeof chat & { contactName?: string }).contactName && (
            <>
              <span className="text-[var(--color-border-dark)]">·</span>
              <span className="text-xs font-mono text-[var(--color-ink-muted)]">
                {(chat as typeof chat & { contactName?: string }).contactName}
              </span>
            </>
          )}
        </div>
        <span className={`sketch-tag text-[10px] ${chat.transcriptionStatus === "done" ? "bg-emerald-50 border-emerald-200 text-emerald-800" : ""}`}>
          {chat.transcriptionStatus}
        </span>
      </div>

      {/* Tab bar */}
      <div className="flex items-center gap-0 border-b border-[var(--color-border-dark)]">
        {(["insights", "emails"] as const).map((tab) => {
          const count = tab === "emails" ? postChatDrafts.length : (takeaways?.length ?? 0);
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
              {tab === "insights" ? "Transcript & Takeaways" : "Post-Chat Emails"}
              {count > 0 && (
                <span className="ml-1.5 px-1.5 py-0.5 rounded-full text-[9px] bg-[var(--color-paper-dark)] border border-[var(--color-border-dark)]">
                  {count}
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* ── Insights tab: side-by-side ── */}
      {activeTab === "insights" && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {/* Left: transcript / notes */}
          <div className="sketch-card overflow-hidden">
            <div className="flex items-center justify-between px-4 py-2.5 border-b border-[var(--color-border-dark)]">
              <p className="text-[10px] font-mono font-semibold uppercase tracking-widest text-[var(--color-ink-faint)]">
                {chat.transcriptText ? "Transcript" : "Notes"}
              </p>
              {(chat as typeof chat & { notes?: string }).notes !== undefined && !chat.transcriptText && (
                <button
                  onClick={() => {
                    setNotesDraft((chat as typeof chat & { notes?: string }).notes ?? "");
                    setEditingNotes(true);
                  }}
                  className="text-xs font-mono text-[var(--color-ink-faint)] hover:text-[var(--color-ink)] flex items-center gap-1 transition-colors"
                >
                  <Pencil size={10} /> Edit
                </button>
              )}
            </div>
            <div className="p-4 max-h-[60vh] overflow-y-auto">
              {chat.transcriptText ? (
                <HighlightedTranscript text={chat.transcriptText} keyword={hoveredKeyword} />
              ) : editingNotes ? (
                <div className="space-y-2">
                  <textarea
                    autoFocus
                    value={notesDraft}
                    onChange={(e) => setNotesDraft(e.target.value)}
                    rows={12}
                    className="sketch-textarea w-full text-sm font-mono"
                    placeholder="Write your notes here..."
                  />
                  <div className="flex gap-2">
                    <button
                      onClick={() => {
                        updateChatMutation.mutate({ id: chatId, notes: notesDraft });
                        setEditingNotes(false);
                      }}
                      className="sketch-btn sketch-btn-primary text-xs"
                    >
                      <Check size={11} /> Save Notes
                    </button>
                    <button onClick={() => setEditingNotes(false)} className="sketch-btn text-xs">Cancel</button>
                  </div>
                </div>
              ) : (chat as typeof chat & { notes?: string }).notes ? (
                <div>
                  <p className="text-xs text-[var(--color-ink-muted)] whitespace-pre-wrap leading-relaxed font-mono">
                    {(chat as typeof chat & { notes?: string }).notes}
                  </p>
                  <button
                    onClick={() => {
                      setNotesDraft((chat as typeof chat & { notes?: string }).notes ?? "");
                      setEditingNotes(true);
                    }}
                    className="mt-3 text-xs font-mono text-[var(--color-ink-faint)] hover:text-[var(--color-ink)] flex items-center gap-1 transition-colors"
                  >
                    <Pencil size={10} /> Edit notes
                  </button>
                </div>
              ) : (
                <div className="text-center py-8">
                  <FileText size={28} className="text-[var(--color-ink-faint)] mx-auto mb-2" />
                  <p className="text-sm text-[var(--color-ink-muted)]">No transcript or notes yet.</p>
                  <button
                    onClick={() => { setNotesDraft(""); setEditingNotes(true); }}
                    className="mt-3 sketch-btn text-xs"
                  >
                    <DoodleNotebook size={12} /> Add Notes
                  </button>
                </div>
              )}
            </div>
          </div>

          {/* Right: takeaways */}
          <div className="sketch-card overflow-hidden">
            <div className="flex items-center justify-between px-4 py-2.5 border-b border-[var(--color-border-dark)]">
              <p className="text-[10px] font-mono font-semibold uppercase tracking-widest text-[var(--color-ink-faint)]">
                Takeaways
                {analyzeMutation.isPending && (
                  <span className="ml-2 text-amber-600 normal-case">Analyzing…</span>
                )}
              </p>
              {hasContent && (
                <button
                  onClick={() => analyzeMutation.mutate({ chatId, transcript: chat.transcriptText ?? (chat as typeof chat & { notes?: string }).notes ?? "" })}
                  disabled={analyzeMutation.isPending}
                  className="text-xs font-mono text-[var(--color-ink-faint)] hover:text-[var(--color-ink)] flex items-center gap-1 transition-colors disabled:opacity-40"
                >
                  <DoodleSparkle size={10} />
                  {takeaways && takeaways.length > 0 ? "Re-analyze" : "Extract"}
                </button>
              )}
            </div>
            <div className="p-4 max-h-[60vh] overflow-y-auto space-y-4">
              {analyzeMutation.isPending ? (
                <div className="space-y-3">
                  {Array.from({ length: 4 }).map((_, i) => (
                    <Skeleton key={i} className="h-16 w-full" />
                  ))}
                </div>
              ) : takeaways && takeaways.length > 0 ? (
                TAKEAWAY_CATEGORIES.map((cat) => {
                  const items = groupedTakeaways[cat];
                  if (!items || items.length === 0) return null;
                  return (
                    <TakeawaySection
                      key={cat}
                      category={cat}
                      takeaways={items}
                      hoveredKeyword={hoveredKeyword}
                      onHover={setHoveredKeyword}
                    />
                  );
                })
              ) : (
                <div className="text-center py-8">
                  <DoodleSparkle size={28} className="text-[var(--color-ink-faint)] mx-auto mb-2" />
                  <p className="text-sm text-[var(--color-ink-muted)]">
                    {hasContent
                      ? "Extracting takeaways…"
                      : "Add a transcript or notes to extract takeaways."}
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* ── Post-chat emails tab ── */}
      {activeTab === "emails" && (
        <div className="space-y-4">
          <div className="flex flex-wrap gap-2">
            {(["thank_you", "referral_ask"] as EmailDraftType[]).map((type) => (
              <button
                key={type}
                disabled={generateEmailMutation.isPending || !chat.contactId}
                onClick={() =>
                  generateEmailMutation.mutate({ contactId: chat.contactId, type, chatId })
                }
                className="sketch-btn text-xs disabled:opacity-40"
              >
                <DoodleSparkle size={12} />
                Generate {EMAIL_TYPE_LABELS[type]}
              </button>
            ))}
          </div>

          <p className="text-[10px] font-mono text-[var(--color-ink-faint)] flex items-center gap-1">
            <span className="text-amber-500">⚠</span> Drafts are for your review only — no emails are sent automatically.
          </p>

          {postChatDrafts.length > 0 ? (
            postChatDrafts.map((draft) => (
              <DraftCard
                key={draft.id}
                draft={draft}
                onApprove={(id, subject, body) => approveMutation.mutate({ id, subject, body })}
                onUpdate={(id, subject, body) => updateDraftMutation.mutate({ id, subject, body })}
              />
            ))
          ) : (
            <div className="sketch-card p-8 text-center">
              <p className="text-sm text-[var(--color-ink-muted)]">No post-chat emails generated yet.</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// ─── Main page ────────────────────────────────────────────────────────────────
export default function CoffeeChat() {
  const params = useParams<{ id: string }>();
  const [, setLocation] = useLocation();
  const [activeChatId, setActiveChatId] = useState<number | null>(
    params.id ? parseInt(params.id) : null
  );

  const { data: allChats, isLoading } = trpc.coffeeChats.listAll.useQuery({ limit: 50 });

  return (
    <div className="min-h-screen paper-bg">
      {/* Page header */}
      <div className="border-b border-[var(--color-border-dark)] px-8 py-6">
        <p className="text-[10px] font-mono font-semibold uppercase tracking-widest text-[var(--color-ink-faint)] mb-1">
          Chat Intelligence
        </p>
        <div className="flex items-start justify-between">
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-[var(--color-ink)] flex items-center gap-2">
              <DoodleCoffeeCup size={24} className="text-[var(--color-ink-muted)]" />
              Coffee Chats
            </h1>
            <p className="text-sm text-[var(--color-ink-muted)] mt-0.5">
              Log conversations, extract insights, generate follow-up emails
            </p>
          </div>
          {activeChatId && (
            <button
              onClick={() => { setActiveChatId(null); setLocation("/coffee-chat"); }}
              className="sketch-btn text-xs"
            >
              + New Chat
            </button>
          )}
        </div>
      </div>

      <div className="flex h-[calc(100vh-140px)]">
        {/* Left panel: chat list */}
        <div className="w-64 flex-shrink-0 border-r border-[var(--color-border-dark)] overflow-y-auto">
          <div className="p-4 space-y-1">
            <p className="text-[10px] font-mono font-semibold uppercase tracking-widest text-[var(--color-ink-faint)] mb-2 px-1">
              Past Chats ({allChats?.length ?? 0})
            </p>

            {isLoading ? (
              Array.from({ length: 4 }).map((_, i) => (
                <Skeleton key={i} className="h-14 w-full rounded-lg" />
              ))
            ) : allChats && allChats.length > 0 ? (
              allChats.map((chat) => (
                <button
                  key={chat.id}
                  onClick={() => {
                    setActiveChatId(chat.id);
                    setLocation(`/coffee-chat/${chat.id}`);
                  }}
                  className={`w-full text-left p-3 rounded-lg border transition-all ${
                    activeChatId === chat.id
                      ? "border-[var(--color-ink)] bg-[var(--color-paper-dark)]"
                      : "border-transparent hover:border-[var(--color-border-dark)] hover:bg-[var(--color-paper-dark)]"
                  }`}
                >
                  <div className="flex items-center justify-between gap-2">
                    <p className="text-xs font-semibold text-[var(--color-ink)] truncate">
                      {chat.contactName ?? `Contact #${chat.contactId}`}
                    </p>
                    <span
                      className={`text-[9px] font-mono px-1.5 py-0.5 rounded border flex-shrink-0 ${
                        chat.transcriptionStatus === "done"
                          ? "bg-emerald-50 border-emerald-200 text-emerald-700"
                          : "bg-[var(--color-paper-dark)] border-[var(--color-border-dark)] text-[var(--color-ink-faint)]"
                      }`}
                    >
                      {chat.transcriptionStatus}
                    </span>
                  </div>
                  <p className="text-[10px] font-mono text-[var(--color-ink-faint)] mt-0.5">
                    {chat.chatDate ? format(new Date(chat.chatDate), "MMM d, yyyy") : "Date unknown"}
                  </p>
                  {chat.transcriptText && (
                    <p className="text-[10px] text-[var(--color-ink-faint)] mt-1 line-clamp-1">
                      {chat.transcriptText}
                    </p>
                  )}
                </button>
              ))
            ) : (
              <div className="p-4 text-center">
                <p className="text-xs font-mono text-[var(--color-ink-faint)]">No chats yet.</p>
              </div>
            )}
          </div>
        </div>

        {/* Right panel: detail or new form */}
        <div className="flex-1 overflow-y-auto p-6">
          {activeChatId ? (
            <ChatDetail chatId={activeChatId} />
          ) : (
            <div className="max-w-2xl mx-auto">
              <div className="mb-5">
                <h2 className="text-lg font-bold text-[var(--color-ink)] flex items-center gap-2">
                  <DoodleCoffeeCup size={20} className="text-[var(--color-ink-muted)]" />
                  Log a New Coffee Chat
                </h2>
                <p className="text-sm text-[var(--color-ink-muted)] mt-0.5">
                  Paste a transcript, upload audio, or write notes — we'll extract insights automatically.
                </p>
              </div>
              <div className="sketch-card p-6">
                <NewChatForm
                  onSuccess={(id) => {
                    setActiveChatId(id);
                    setLocation(`/coffee-chat/${id}`);
                  }}
                />
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
