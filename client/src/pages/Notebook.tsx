import { trpc } from "@/lib/trpc";
import { DoodleNotebook, DoodleSparkle, DoodleStar } from "@/components/DoodleIcons";
import { useState, useMemo, useRef, useEffect } from "react";
import { Skeleton } from "@/components/ui/skeleton";
import { BookOpen, Check, Copy, Filter, Pencil, X } from "lucide-react";
import { toast } from "sonner";

const TAKEAWAY_CATEGORIES = [
  { value: "", label: "All Categories" },
  { value: "Industry", label: "Industry" },
  { value: "Firm", label: "Firm Specific" },
  { value: "Group", label: "Group Insights" },
  { value: "Recruiting", label: "Recruiting" },
  { value: "Technical Prep", label: "Technical Prep" },
  { value: "Personal Growth", label: "Personal Growth" },
  { value: "Referral Signal", label: "Referral Signal" },
  { value: "Next Person To Meet", label: "Next Person To Meet" },
];

const CATEGORY_COLORS: Record<string, { bg: string; border: string; text: string; dot: string }> = {
  "Industry":           { bg: "bg-blue-50",    border: "border-blue-200",    text: "text-blue-800",    dot: "bg-blue-400" },
  "Firm":               { bg: "bg-violet-50",  border: "border-violet-200",  text: "text-violet-800",  dot: "bg-violet-400" },
  "Group":              { bg: "bg-emerald-50", border: "border-emerald-200", text: "text-emerald-800", dot: "bg-emerald-400" },
  "Recruiting":         { bg: "bg-amber-50",   border: "border-amber-200",   text: "text-amber-800",   dot: "bg-amber-400" },
  "Technical Prep":     { bg: "bg-orange-50",  border: "border-orange-200",  text: "text-orange-800",  dot: "bg-orange-400" },
  "Personal Growth":    { bg: "bg-pink-50",    border: "border-pink-200",    text: "text-pink-800",    dot: "bg-pink-400" },
  "Referral Signal":    { bg: "bg-red-50",     border: "border-red-200",     text: "text-red-800",     dot: "bg-red-400" },
  "Next Person To Meet":{ bg: "bg-teal-50",    border: "border-teal-200",    text: "text-teal-800",    dot: "bg-teal-400" },
};

type TakeawayItem = {
  id: number;
  category: string;
  content: string;
  isKeyInsight: boolean | null;
  contactName?: string | null;
  contactFirm?: string | null;
  contactGroup?: string | null;
  chatDate?: Date | null;
};

function splitTakeawayBullets(content: string): string[] {
  return content
    .replace(/\r/g, "")
    .replace(/([^\n])\s+(?=•\s+)/g, "$1\n")
    .split(/\n+/)
    .map((line) => line.replace(/^\s*(?:[•*-]|\d+[.)])\s*/, "").trim())
    .filter(Boolean);
}

function TakeawayCard({ takeaway, onUpdated }: {
  takeaway: TakeawayItem;
  onUpdated: () => void;
}) {
  const colors = CATEGORY_COLORS[takeaway.category] ?? { bg: "bg-gray-50", border: "border-gray-200", text: "text-gray-800", dot: "bg-gray-400" };
  const bullets = splitTakeawayBullets(takeaway.content);
  const [editing, setEditing] = useState(false);
  const [editContent, setEditContent] = useState(takeaway.content);
  const [editCategory, setEditCategory] = useState(takeaway.category);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const updateMutation = trpc.notebook.update.useMutation({
    onSuccess: () => {
      toast.success("Takeaway updated");
      setEditing(false);
      onUpdated();
    },
    onError: (e) => toast.error(e.message),
  });

  useEffect(() => {
    if (editing && textareaRef.current) {
      textareaRef.current.focus();
      textareaRef.current.select();
    }
  }, [editing]);

  function startEdit() {
    setEditContent(takeaway.content);
    setEditCategory(takeaway.category);
    setEditing(true);
  }

  function cancelEdit() {
    setEditing(false);
    setEditContent(takeaway.content);
    setEditCategory(takeaway.category);
  }

  function saveEdit() {
    if (!editContent.trim()) { toast.error("Content cannot be empty"); return; }
    updateMutation.mutate({
      id: takeaway.id,
      content: editContent.trim(),
      category: editCategory as "Industry" | "Firm" | "Group" | "Recruiting" | "Technical Prep" | "Personal Growth" | "Referral Signal" | "Next Person To Meet",
    });
  }

  function toggleKeyInsight() {
    updateMutation.mutate({ id: takeaway.id, isKeyInsight: !takeaway.isKeyInsight });
  }

  function copyContent() {
    navigator.clipboard.writeText(takeaway.content);
    toast.success("Copied to clipboard");
  }

  if (editing) {
    return (
      <div className="sketch-card p-4 border-[var(--color-ink)]">
        <div className="space-y-2">
          <textarea
            ref={textareaRef}
            value={editContent}
            onChange={e => setEditContent(e.target.value)}
            className="sketch-textarea w-full text-sm min-h-[80px] resize-y"
            placeholder="Edit takeaway content..."
          />
          <div className="flex items-center gap-2">
            <select
              value={editCategory}
              onChange={e => setEditCategory(e.target.value)}
              className="sketch-input text-xs h-7 flex-1"
            >
              {TAKEAWAY_CATEGORIES.filter(c => c.value).map(c => (
                <option key={c.value} value={c.value}>{c.label}</option>
              ))}
            </select>
            <button
              onClick={saveEdit}
              disabled={updateMutation.isPending}
              className="sketch-btn sketch-btn-primary text-xs flex items-center gap-1"
            >
              <Check size={11} />
              Save
            </button>
            <button onClick={cancelEdit} className="sketch-btn text-xs flex items-center gap-1">
              <X size={11} />
              Cancel
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={`sketch-card p-4 group relative ${takeaway.isKeyInsight ? "border-[var(--color-ink)]" : ""}`}>
      {takeaway.isKeyInsight && (
        <DoodleStar size={12} className="absolute top-3 right-8 text-amber-500" />
      )}
      <div className="flex items-start gap-3">
        <div className="flex-1 min-w-0">
          <ul className="space-y-2.5">
            {bullets.map((bullet, index) => (
              <li key={`${takeaway.id}-${index}`} className="flex items-start gap-2.5">
                <span className={`mt-[7px] h-1.5 w-1.5 rounded-full flex-shrink-0 ${colors.dot}`} aria-hidden="true" />
                <span className="text-sm text-[var(--color-ink)] leading-relaxed">{bullet}</span>
              </li>
            ))}
          </ul>
          <div className="flex items-center gap-2 mt-2 flex-wrap">
            <span className={`inline-flex items-center px-2 py-0.5 rounded text-[10px] font-mono font-semibold border ${colors.bg} ${colors.border} ${colors.text}`}>
              {takeaway.category}
            </span>
            {takeaway.contactName && (
              <span className="text-[10px] font-mono text-[var(--color-ink-faint)]">
                — {takeaway.contactName}
                {takeaway.contactFirm && `, ${takeaway.contactFirm}`}
                {takeaway.contactGroup && ` (${takeaway.contactGroup})`}
              </span>
            )}
            {takeaway.chatDate && (
              <span className="text-[10px] font-mono text-[var(--color-ink-faint)]">
                {new Date(takeaway.chatDate).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}
              </span>
            )}
          </div>
        </div>
        <div className="flex items-center gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity">
          <button
            onClick={toggleKeyInsight}
            className={`p-1 rounded transition-colors ${takeaway.isKeyInsight ? "text-amber-500" : "text-[var(--color-ink-faint)] hover:text-amber-400"}`}
            title={takeaway.isKeyInsight ? "Remove key insight" : "Mark as key insight"}
          >
            <DoodleStar size={12} />
          </button>
          <button
            onClick={startEdit}
            className="p-1 rounded hover:bg-[var(--color-paper-dark)] transition-colors"
            title="Edit"
          >
            <Pencil size={11} className="text-[var(--color-ink-faint)]" />
          </button>
          <button
            onClick={copyContent}
            className="p-1 rounded hover:bg-[var(--color-paper-dark)] transition-colors"
            title="Copy"
          >
            <Copy size={12} className="text-[var(--color-ink-faint)]" />
          </button>
        </div>
      </div>
    </div>
  );
}

export default function Notebook() {
  const [categoryFilter, setCategoryFilter] = useState("");
  const [firmFilter, setFirmFilter] = useState("");
  const [keyOnly, setKeyOnly] = useState(false);
  const [view, setView] = useState<"grouped" | "flat">("grouped");

  const utils = trpc.useUtils();
  const { data: takeaways, isLoading } = trpc.notebook.all.useQuery();

  const filtered = useMemo(() => {
    if (!takeaways) return [];
    return takeaways.filter(t => {
      if (categoryFilter && t.category !== categoryFilter) return false;
      if (firmFilter && t.contactFirm !== firmFilter) return false;
      if (keyOnly && !t.isKeyInsight) return false;
      return true;
    });
  }, [takeaways, categoryFilter, firmFilter, keyOnly]);

  const grouped = useMemo(() => {
    const groups: Record<string, typeof filtered> = {};
    for (const t of filtered) {
      if (!groups[t.category]) groups[t.category] = [];
      groups[t.category].push(t);
    }
    return groups;
  }, [filtered]);

  const firms = useMemo(() => {
    if (!takeaways) return [];
    const set = new Set<string>();
    takeaways.forEach(t => { if (t.contactFirm) set.add(t.contactFirm); });
    return Array.from(set).sort();
  }, [takeaways]);

  const totalCount = filtered.reduce((count, t) => count + splitTakeawayBullets(t.content).length, 0);
  const keyCount = filtered.reduce(
    (count, t) => count + (t.isKeyInsight ? splitTakeawayBullets(t.content).length : 0),
    0,
  );

  function handleUpdated() {
    utils.notebook.all.invalidate();
  }

  return (
    <div className="min-h-screen paper-bg">
      {/* Header */}
      <div className="border-b border-[var(--color-border-dark)] px-8 py-6">
        <p className="text-[10px] font-mono font-semibold uppercase tracking-widest text-[var(--color-ink-faint)] mb-1">
          Intelligence
        </p>
        <div className="flex items-start justify-between">
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-[var(--color-ink)] flex items-center gap-2">
              <DoodleNotebook size={24} className="text-[var(--color-ink-muted)]" />
              Notebook
            </h1>
            <p className="text-sm text-[var(--color-ink-muted)] mt-0.5">
              All takeaways from your coffee chats — click any card to edit
            </p>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setView(v => v === "grouped" ? "flat" : "grouped")}
              className="sketch-btn text-xs"
            >
              <BookOpen size={12} />
              {view === "grouped" ? "Flat view" : "Grouped view"}
            </button>
          </div>
        </div>

        {/* Stats row */}
        <div className="flex items-center gap-4 mt-4">
          <div className="flex items-center gap-1.5">
            <span className="text-xl font-bold font-mono text-[var(--color-ink)]">{totalCount}</span>
            <span className="text-xs text-[var(--color-ink-muted)]">takeaways</span>
          </div>
          <div className="w-px h-4 bg-[var(--color-border-dark)]" />
          <div className="flex items-center gap-1.5">
            <DoodleStar size={12} className="text-amber-500" />
            <span className="text-xl font-bold font-mono text-[var(--color-ink)]">{keyCount}</span>
            <span className="text-xs text-[var(--color-ink-muted)]">key insights</span>
          </div>
          <div className="w-px h-4 bg-[var(--color-border-dark)]" />
          <div className="flex items-center gap-1.5">
            <span className="text-xl font-bold font-mono text-[var(--color-ink)]">{Object.keys(grouped).length}</span>
            <span className="text-xs text-[var(--color-ink-muted)]">categories</span>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="px-8 py-4 border-b border-[var(--color-border)] flex flex-wrap items-center gap-2">
        <Filter size={13} className="text-[var(--color-ink-faint)]" />
        <select
          value={categoryFilter}
          onChange={e => setCategoryFilter(e.target.value)}
          className="sketch-input text-xs w-44"
        >
          {TAKEAWAY_CATEGORIES.map(c => (
            <option key={c.value} value={c.value}>{c.label}</option>
          ))}
        </select>
        {firms.length > 0 && (
          <select
            value={firmFilter}
            onChange={e => setFirmFilter(e.target.value)}
            className="sketch-input text-xs w-40"
          >
            <option value="">All Firms</option>
            {firms.map(f => <option key={f} value={f}>{f}</option>)}
          </select>
        )}
        <label className="flex items-center gap-1.5 cursor-pointer">
          <input
            type="checkbox"
            checked={keyOnly}
            onChange={e => setKeyOnly(e.target.checked)}
            className="w-3.5 h-3.5 rounded border-[var(--color-border-dark)]"
          />
          <span className="text-xs text-[var(--color-ink-muted)]">Key insights only</span>
        </label>
        {(categoryFilter || firmFilter || keyOnly) && (
          <button
            onClick={() => { setCategoryFilter(""); setFirmFilter(""); setKeyOnly(false); }}
            className="sketch-btn text-xs"
          >
            Clear
          </button>
        )}
        <span className="ml-auto text-[10px] font-mono text-[var(--color-ink-faint)]">
          Hover any card to edit · click ★ to mark as key insight
        </span>
      </div>

      <div className="px-8 py-6">
        {isLoading ? (
          <div className="space-y-3">
            {Array.from({ length: 6 }).map((_, i) => (
              <Skeleton key={i} className="h-20 w-full rounded-lg" />
            ))}
          </div>
        ) : filtered.length === 0 ? (
          <div className="sketch-card p-12 text-center">
            <DoodleNotebook size={40} className="text-[var(--color-ink-faint)] mx-auto mb-3" />
            <p className="text-sm font-medium text-[var(--color-ink-muted)]">No takeaways yet.</p>
            <p className="text-xs font-mono text-[var(--color-ink-faint)] mt-1">
              Log a coffee chat and analyze the transcript to populate your notebook.
            </p>
          </div>
        ) : view === "flat" ? (
          <div className="space-y-3 max-w-3xl">
            {filtered.map(t => (
              <TakeawayCard key={t.id} takeaway={t} onUpdated={handleUpdated} />
            ))}
          </div>
        ) : (
          <div className="space-y-8 max-w-3xl">
            {TAKEAWAY_CATEGORIES.filter(c => c.value && grouped[c.value]?.length).map(cat => {
              const items = grouped[cat.value] ?? [];
              const colors = CATEGORY_COLORS[cat.value] ?? { bg: "bg-gray-50", border: "border-gray-200", text: "text-gray-800", dot: "bg-gray-400" };
              return (
                <div key={cat.value}>
                  <div className="flex items-center gap-2 mb-3">
                    <div className={`w-2.5 h-2.5 rounded-full ${colors.dot}`} />
                    <h3 className="text-sm font-bold text-[var(--color-ink)]">{cat.label}</h3>
                    <span className={`inline-flex items-center px-2 py-0.5 rounded text-[10px] font-mono font-semibold border ${colors.bg} ${colors.border} ${colors.text}`}>
                      {items.reduce((count, item) => count + splitTakeawayBullets(item.content).length, 0)}
                    </span>
                  </div>
                  <div className="space-y-2 pl-4 border-l-2 border-[var(--color-border-dark)]">
                    {items.map(t => (
                      <TakeawayCard key={t.id} takeaway={t} onUpdated={handleUpdated} />
                    ))}
                  </div>
                </div>
              );
            })}
            {/* Any uncategorized */}
            {Object.entries(grouped)
              .filter(([cat]) => !TAKEAWAY_CATEGORIES.some(c => c.value === cat))
              .map(([cat, items]) => (
                <div key={cat}>
                  <div className="flex items-center gap-2 mb-3">
                    <div className="w-2.5 h-2.5 rounded-full bg-gray-400" />
                    <h3 className="text-sm font-bold text-[var(--color-ink)]">{cat}</h3>
                    <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-mono font-semibold border bg-gray-50 border-gray-200 text-gray-700">
                      {items.reduce((count, item) => count + splitTakeawayBullets(item.content).length, 0)}
                    </span>
                  </div>
                  <div className="space-y-2 pl-4 border-l-2 border-[var(--color-border-dark)]">
                    {items.map(t => (
                      <TakeawayCard key={t.id} takeaway={t} onUpdated={handleUpdated} />
                    ))}
                  </div>
                </div>
              ))
            }
          </div>
        )}
      </div>
    </div>
  );
}
