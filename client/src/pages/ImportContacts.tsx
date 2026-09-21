import { trpc } from "@/lib/trpc";
import {
  DoodleSparkle,
  DoodleArrow,
  DoodleNotebook,
  DoodleCoffeeCup,
} from "@/components/DoodleIcons";
import { useState, useRef, useCallback } from "react";
import { toast } from "sonner";
import { useLocation } from "wouter";
import {
  Upload,
  Plus,
  Trash2,
  CheckCircle2,
  ChevronDown,
  ChevronUp,
  FileText,
  X,
} from "lucide-react";

// ─── Constants ────────────────────────────────────────────────────────────────

type ContactField =
  | "name"
  | "email"
  | "linkedinUrl"
  | "firm"
  | "bankingGroup"
  | "industry"
  | "role"
  | "school"
  | "major"
  | "club"
  | "hometown"
  | "notes";
type ManualContact = Record<ContactField, string>;

const CONTACT_FIELDS: {
  key: ContactField;
  label: string;
  required?: boolean;
}[] = [
  { key: "name", label: "Name", required: true },
  { key: "email", label: "Email" },
  { key: "linkedinUrl", label: "LinkedIn URL" },
  { key: "firm", label: "Firm" },
  { key: "bankingGroup", label: "Group (TMT, M&A…)" },
  { key: "industry", label: "Industry" },
  { key: "role", label: "Role / Title" },
  { key: "school", label: "School" },
  { key: "major", label: "Major" },
  { key: "club", label: "Club / Activity" },
  { key: "hometown", label: "Hometown" },
  { key: "notes", label: "Notes" },
];

function emptyContact(): ManualContact {
  return {
    name: "",
    email: "",
    linkedinUrl: "",
    firm: "",
    bankingGroup: "",
    industry: "",
    role: "",
    school: "",
    major: "",
    club: "",
    hometown: "",
    notes: "",
  };
}

// ─── Manual Entry ─────────────────────────────────────────────────────────────

function ManualEntryForm({ onImported }: { onImported: () => void }) {
  const [contacts, setContacts] = useState<ManualContact[]>([emptyContact()]);
  const [expanded, setExpanded] = useState<number[]>([0]);
  const utils = trpc.useUtils();

  const importMutation = trpc.contacts.importManual.useMutation({
    onSuccess: data => {
      utils.contacts.list.invalidate();
      utils.dashboard.stats.invalidate();
      toast.success(
        `${data.imported} contact${data.imported !== 1 ? "s" : ""} saved!`
      );
      onImported();
    },
    onError: e => toast.error(e.message),
  });

  function toggle(i: number) {
    setExpanded(prev =>
      prev.includes(i) ? prev.filter(x => x !== i) : [...prev, i]
    );
  }
  function addRow() {
    const idx = contacts.length;
    setContacts(prev => [...prev, emptyContact()]);
    setExpanded(prev => [...prev, idx]);
  }
  function removeRow(i: number) {
    setContacts(prev => prev.filter((_, idx) => idx !== i));
    setExpanded(prev =>
      prev.filter(x => x !== i).map(x => (x > i ? x - 1 : x))
    );
  }
  function setField(i: number, field: ContactField, value: string) {
    setContacts(prev =>
      prev.map((c, idx) => (idx === i ? { ...c, [field]: value } : c))
    );
  }

  function handleSubmit() {
    const valid = contacts.filter(c => c.name.trim());
    if (valid.length === 0) {
      toast.error("Add at least one contact with a name.");
      return;
    }
    importMutation.mutate({
      contacts: valid.map(c => ({
        name: c.name || undefined,
        email: c.email || undefined,
        linkedinUrl: c.linkedinUrl || undefined,
        firm: c.firm || undefined,
        bankingGroup: c.bankingGroup || undefined,
        industry: c.industry || undefined,
        role: c.role || undefined,
        school: c.school || undefined,
        major: c.major || undefined,
        club: c.club || undefined,
        hometown: c.hometown || undefined,
        notes: c.notes || undefined,
      })),
    });
  }

  const validCount = contacts.filter(c => c.name.trim()).length;

  return (
    <div className="space-y-3">
      {contacts.map((c, i) => (
        <div key={i} className="sketch-card overflow-hidden">
          <div
            className="flex items-center justify-between px-4 py-3 cursor-pointer hover:bg-[var(--color-paper-dark)] transition-colors"
            onClick={() => toggle(i)}
          >
            <div className="flex items-center gap-2">
              <div className="w-6 h-6 rounded-full bg-[var(--color-paper-dark)] border border-[var(--color-border-dark)] flex items-center justify-center text-[10px] font-mono font-bold text-[var(--color-ink-muted)]">
                {i + 1}
              </div>
              <span className="text-sm font-medium text-[var(--color-ink)]">
                {c.name || (
                  <span className="text-[var(--color-ink-faint)] italic">
                    Unnamed contact
                  </span>
                )}
              </span>
              {c.firm && (
                <span className="sketch-tag text-[10px]">{c.firm}</span>
              )}
              {c.bankingGroup && (
                <span className="sketch-tag text-[10px]">{c.bankingGroup}</span>
              )}
            </div>
            <div className="flex items-center gap-2">
              {contacts.length > 1 && (
                <button
                  onClick={e => {
                    e.stopPropagation();
                    removeRow(i);
                  }}
                  className="p-1 rounded hover:bg-red-50 text-[var(--color-ink-faint)] hover:text-red-500 transition-colors"
                  title="Remove"
                >
                  <Trash2 size={13} />
                </button>
              )}
              {expanded.includes(i) ? (
                <ChevronUp
                  size={14}
                  className="text-[var(--color-ink-faint)]"
                />
              ) : (
                <ChevronDown
                  size={14}
                  className="text-[var(--color-ink-faint)]"
                />
              )}
            </div>
          </div>

          {expanded.includes(i) && (
            <div className="px-4 pb-4 border-t border-[var(--color-border)] grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 pt-4">
              {CONTACT_FIELDS.map(f => (
                <div key={f.key}>
                  <label className="block text-[10px] font-mono font-semibold uppercase tracking-wider text-[var(--color-ink-faint)] mb-1">
                    {f.label}
                    {f.required && (
                      <span className="text-red-400 ml-0.5">*</span>
                    )}
                  </label>
                  <input
                    type="text"
                    value={c[f.key]}
                    onChange={e => setField(i, f.key, e.target.value)}
                    placeholder={f.label}
                    className="sketch-input w-full text-sm"
                  />
                </div>
              ))}
            </div>
          )}
        </div>
      ))}

      <div className="flex items-center gap-3 pt-1">
        <button onClick={addRow} className="sketch-btn text-sm">
          <Plus size={14} /> Add Another
        </button>
        <button
          onClick={handleSubmit}
          disabled={importMutation.isPending || validCount === 0}
          className="sketch-btn sketch-btn-primary text-sm"
        >
          {importMutation.isPending ? (
            <span className="font-mono">Saving…</span>
          ) : (
            <>
              <CheckCircle2 size={14} /> Save {validCount} Contact
              {validCount !== 1 ? "s" : ""}
            </>
          )}
        </button>
      </div>
    </div>
  );
}

// ─── CSV / Excel Import ───────────────────────────────────────────────────────

type ParsedRow = Record<string, string>;

function parseCSVText(text: string): { headers: string[]; rows: ParsedRow[] } {
  const lines = text.split(/\r?\n/).filter(l => l.trim());
  if (lines.length < 2) return { headers: [], rows: [] };

  // Auto-detect delimiter
  const firstLine = lines[0];
  const delimiters = [",", "\t", ";"];
  const delimiter = delimiters.reduce((best, d) => {
    const count = firstLine.split(d).length - 1;
    const bestCount = firstLine.split(best).length - 1;
    return count > bestCount ? d : best;
  }, ",");

  const parseRow = (line: string): string[] => {
    const result: string[] = [];
    let current = "";
    let inQuotes = false;
    for (let i = 0; i < line.length; i++) {
      const ch = line[i];
      if (ch === '"') {
        inQuotes = !inQuotes;
      } else if (ch === delimiter && !inQuotes) {
        result.push(current.trim().replace(/^"|"$/g, ""));
        current = "";
      } else {
        current += ch;
      }
    }
    result.push(current.trim().replace(/^"|"$/g, ""));
    return result;
  };

  const headers = parseRow(lines[0]);
  const rows = lines
    .slice(1)
    .map(l => {
      const vals = parseRow(l);
      return Object.fromEntries(headers.map((h, i) => [h, vals[i] ?? ""]));
    })
    .filter(r => Object.values(r).some(v => v.trim()));

  return { headers, rows };
}

function CsvImportForm({ onImported }: { onImported: () => void }) {
  const [file, setFile] = useState<File | null>(null);
  const [headers, setHeaders] = useState<string[]>([]);
  const [rows, setRows] = useState<ParsedRow[]>([]);
  const [mapping, setMapping] = useState<Record<string, ContactField | "">>({});
  const [aiMapping, setAiMapping] = useState(false);
  const [step, setStep] = useState<"upload" | "map">("upload");
  const fileRef = useRef<HTMLInputElement>(null);
  const utils = trpc.useUtils();

  const mapColumnsMutation = trpc.contacts.mapColumns.useMutation({
    onSuccess: data => {
      setMapping(data.mapping as Record<string, ContactField | "">);
      setAiMapping(false);
      setStep("map");
    },
    onError: () => {
      setAiMapping(false);
      setStep("map");
    },
  });

  const importMutation = trpc.contacts.importCsv.useMutation({
    onSuccess: data => {
      utils.contacts.list.invalidate();
      utils.dashboard.stats.invalidate();
      toast.success(`${data.imported} contacts imported!`);
      onImported();
    },
    onError: e => toast.error(e.message),
  });

  const processFile = useCallback(
    (f: File) => {
      const reader = new FileReader();
      reader.onload = e => {
        const text = e.target?.result as string;
        const { headers: hdrs, rows: dataRows } = parseCSVText(text);
        if (hdrs.length === 0) {
          toast.error("Could not parse file. Make sure it has a header row.");
          return;
        }
        setHeaders(hdrs);
        setRows(dataRows);
        setFile(f);
        setAiMapping(true);
        mapColumnsMutation.mutate({ headers: hdrs });
      };
      reader.readAsText(f);
    },
    [mapColumnsMutation]
  );

  function handleDrop(e: React.DragEvent) {
    e.preventDefault();
    const f = e.dataTransfer.files[0];
    if (f) processFile(f);
  }

  function handleImport() {
    const contacts = rows
      .map(row => {
        const contact: Record<string, string | undefined> = {};
        for (const [header, field] of Object.entries(mapping)) {
          if (field && row[header]) contact[field] = row[header];
        }
        return contact;
      })
      .filter(c => c.name);

    if (contacts.length === 0) {
      toast.error(
        "No valid contacts found. Make sure the Name column is mapped."
      );
      return;
    }

    const validStatuses = [
      "not_started",
      "reached_out",
      "chatted",
      "following_up",
      "closed",
    ];
    importMutation.mutate({
      rows: contacts.map(c => ({
        name: c.name!,
        email: c.email,
        linkedinUrl: c.linkedinUrl,
        school: c.school,
        major: c.major,
        club: c.club,
        hometown: c.hometown,
        firm: c.firm,
        bankingGroup: c.bankingGroup,
        industry: c.industry,
        role: c.role,
        notes: c.notes,
        status: (validStatuses.includes(c.status ?? "")
          ? c.status
          : "not_started") as "not_started",
      })),
    });
  }

  if (step === "upload") {
    return (
      <div className="space-y-4">
        <div
          onDrop={handleDrop}
          onDragOver={e => e.preventDefault()}
          className="border-2 border-dashed border-[var(--color-border-dark)] rounded-lg p-12 text-center hover:border-[var(--color-ink)] hover:bg-[var(--color-paper-dark)] transition-all cursor-pointer"
          onClick={() => fileRef.current?.click()}
        >
          <input
            ref={fileRef}
            type="file"
            accept=".csv,.tsv,.txt"
            className="hidden"
            onChange={e => {
              const f = e.target.files?.[0];
              if (f) processFile(f);
            }}
          />
          <Upload
            size={32}
            className="mx-auto text-[var(--color-ink-faint)] mb-3"
          />
          <p className="text-sm font-medium text-[var(--color-ink)] mb-1">
            Drop your spreadsheet here
          </p>
          <p className="text-xs text-[var(--color-ink-faint)] font-mono">
            CSV or TSV — auto-detects columns with AI
          </p>
          {aiMapping && (
            <div className="mt-4 flex items-center justify-center gap-2 text-xs text-[var(--color-ink-muted)] font-mono">
              <DoodleSparkle size={14} className="animate-pulse" />
              AI is mapping your columns…
            </div>
          )}
        </div>

        <div className="sketch-card p-4">
          <div className="flex items-center gap-2 mb-3">
            <DoodleSparkle
              size={14}
              className="text-[var(--color-ink-muted)]"
            />
            <span className="text-xs font-mono font-semibold uppercase tracking-wider text-[var(--color-ink)]">
              Expected columns
            </span>
          </div>
          <div className="flex flex-wrap gap-1.5">
            {CONTACT_FIELDS.map(f => (
              <span
                key={f.key}
                className={`sketch-tag text-[10px] ${f.required ? "border-[var(--color-ink)] font-bold" : ""}`}
              >
                {f.label}
                {f.required ? " *" : ""}
              </span>
            ))}
          </div>
          <p className="text-[10px] text-[var(--color-ink-faint)] font-mono mt-2">
            Column names are auto-detected. You can remap them in the next step.
          </p>
        </div>
      </div>
    );
  }

  // Map step
  const mappedCount = Object.values(mapping).filter(v => v).length;
  const previewRows = rows.slice(0, 5);

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm font-semibold text-[var(--color-ink)] flex items-center gap-2">
            <FileText size={14} className="text-[var(--color-ink-muted)]" />
            {file?.name}
          </p>
          <p className="text-xs text-[var(--color-ink-faint)] mt-0.5 font-mono">
            {rows.length} rows · {headers.length} columns · {mappedCount} mapped
          </p>
        </div>
        <button
          onClick={() => {
            setFile(null);
            setHeaders([]);
            setRows([]);
            setStep("upload");
          }}
          className="sketch-btn text-xs"
        >
          <X size={12} /> Change file
        </button>
      </div>

      {/* AI mapping notice */}
      <div className="sketch-card p-3 flex items-center gap-2 bg-amber-50 border-amber-200">
        <DoodleSparkle size={14} className="text-amber-600 flex-shrink-0" />
        <p className="text-xs text-amber-800">
          AI has pre-mapped your columns. Review and adjust below, then click
          Import.
        </p>
      </div>

      {/* Column mapping */}
      <div className="sketch-card overflow-hidden">
        <div className="px-4 py-3 border-b border-[var(--color-border-dark)]">
          <span className="text-xs font-mono font-semibold text-[var(--color-ink)]">
            Column Mapping
          </span>
        </div>
        <div className="p-4 grid grid-cols-1 sm:grid-cols-2 gap-3">
          {headers.map(h => (
            <div key={h} className="flex items-center gap-2">
              <span
                className="text-xs font-mono text-[var(--color-ink-muted)] w-28 truncate flex-shrink-0"
                title={h}
              >
                {h}
              </span>
              <DoodleArrow
                size={12}
                className="text-[var(--color-ink-faint)] flex-shrink-0"
              />
              <select
                value={mapping[h] ?? ""}
                onChange={e =>
                  setMapping(prev => ({
                    ...prev,
                    [h]: e.target.value as ContactField | "",
                  }))
                }
                className="sketch-input text-xs flex-1"
              >
                <option value="">— skip —</option>
                {CONTACT_FIELDS.map(f => (
                  <option key={f.key} value={f.key}>
                    {f.label}
                  </option>
                ))}
              </select>
            </div>
          ))}
        </div>
      </div>

      {/* Preview */}
      {previewRows.length > 0 && (
        <div className="sketch-card overflow-hidden">
          <div className="px-4 py-3 border-b border-[var(--color-border-dark)]">
            <span className="text-xs font-mono font-semibold text-[var(--color-ink)]">
              Preview — first {previewRows.length} rows
            </span>
          </div>
          <div className="overflow-x-auto">
            <table className="crm-table">
              <thead>
                <tr>
                  {Object.entries(mapping)
                    .filter(([, v]) => v)
                    .map(([h]) => (
                      <th key={h} className="text-[10px]">
                        {mapping[h]}
                      </th>
                    ))}
                </tr>
              </thead>
              <tbody>
                {previewRows.map((row, i) => (
                  <tr key={i}>
                    {Object.entries(mapping)
                      .filter(([, v]) => v)
                      .map(([h]) => (
                        <td key={h} className="text-xs truncate max-w-[140px]">
                          {row[h] ?? "—"}
                        </td>
                      ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      <div className="flex items-center gap-3">
        <button
          onClick={() => setStep("upload")}
          className="sketch-btn text-sm"
        >
          ← Back
        </button>
        <button
          onClick={handleImport}
          disabled={
            importMutation.isPending ||
            !Object.values(mapping).some(v => v === "name")
          }
          className="sketch-btn sketch-btn-primary text-sm"
        >
          {importMutation.isPending ? (
            <span className="font-mono">Importing…</span>
          ) : (
            <>
              <CheckCircle2 size={14} /> Import {rows.length} Contacts
            </>
          )}
        </button>
      </div>
    </div>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────

export default function ImportContacts() {
  const [, setLocation] = useLocation();
  const [tab, setTab] = useState<"file" | "manual">("file");
  const [done, setDone] = useState(false);

  if (done) {
    return (
      <div className="min-h-screen paper-bg flex items-center justify-center p-8">
        <div className="sketch-card p-10 text-center max-w-md w-full">
          <CheckCircle2 size={44} className="mx-auto text-emerald-500 mb-4" />
          <h2 className="text-xl font-bold text-[var(--color-ink)] mb-2">
            Contacts added!
          </h2>
          <p className="text-sm text-[var(--color-ink-muted)] mb-6">
            Your contacts are now in the CRM. Generate outreach emails or log
            coffee chats.
          </p>
          <div className="flex items-center justify-center gap-3">
            <button
              onClick={() => setLocation("/contacts")}
              className="sketch-btn sketch-btn-primary"
            >
              <DoodleCoffeeCup size={14} /> View Contacts
            </button>
            <button onClick={() => setDone(false)} className="sketch-btn">
              Import More
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen paper-bg">
      {/* Header */}
      <div className="border-b border-[var(--color-border-dark)] px-8 py-6">
        <p className="text-[10px] font-mono font-semibold uppercase tracking-widest text-[var(--color-ink-faint)] mb-1">
          Contacts
        </p>
        <div className="flex items-start justify-between">
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-[var(--color-ink)] flex items-center gap-2">
              <DoodleNotebook
                size={24}
                className="text-[var(--color-ink-muted)]"
              />
              Import Contacts
            </h1>
            <p className="text-sm text-[var(--color-ink-muted)] mt-0.5">
              Add contacts manually or import from a spreadsheet — AI auto-maps
              your columns
            </p>
          </div>
          <button
            onClick={() => setLocation("/contacts")}
            className="sketch-btn text-sm"
          >
            View Contacts
          </button>
        </div>
      </div>

      <div className="mx-auto w-full max-w-5xl px-5 py-6 sm:px-8">
        {/* Tab switcher */}
        <div className="flex items-center gap-1 mb-6 p-1 bg-[var(--color-paper-dark)] rounded-lg border border-[var(--color-border-dark)] w-fit">
          {(["file", "manual"] as const).map(t => (
            <button
              key={t}
              onClick={() => setTab(t)}
              className={`px-4 py-1.5 rounded text-xs font-mono font-semibold transition-all flex items-center gap-1.5 ${
                tab === t
                  ? "bg-[var(--color-ink)] text-[var(--color-paper)] shadow-sm"
                  : "text-[var(--color-ink-muted)] hover:text-[var(--color-ink)]"
              }`}
            >
              {t === "file" ? (
                <>
                  <Upload size={12} /> CSV / Spreadsheet
                </>
              ) : (
                <>
                  <Plus size={12} /> Manual Entry
                </>
              )}
            </button>
          ))}
        </div>

        {tab === "file" ? (
          <CsvImportForm onImported={() => setDone(true)} />
        ) : (
          <ManualEntryForm onImported={() => setDone(true)} />
        )}

        {/* Tips */}
        <div className="mt-8 sketch-card p-4">
          <div className="flex items-center gap-2 mb-3">
            <DoodleSparkle
              size={14}
              className="text-[var(--color-ink-muted)]"
            />
            <span className="text-xs font-mono font-semibold uppercase tracking-wider text-[var(--color-ink)]">
              Tips for best results
            </span>
          </div>
          <ul className="space-y-1.5">
            {[
              "Include Name, Firm, and Group for the best AI outreach generation",
              "LinkedIn URLs help track relationship context",
              "Add School and Hometown to enable shared background matching",
              "Notes column can include anything — the AI will use them for personalization",
              "CSV files from Excel, Google Sheets, or Airtable all work — comma or tab delimited",
            ].map((tip, i) => (
              <li
                key={i}
                className="flex items-start gap-2 text-xs text-[var(--color-ink-muted)]"
              >
                <span className="font-mono text-[var(--color-ink-faint)] flex-shrink-0 mt-0.5">
                  {i + 1}.
                </span>
                {tip}
              </li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  );
}
