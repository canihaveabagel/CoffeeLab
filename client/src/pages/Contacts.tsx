import { DoodleMagnifier, DoodleSparkle, DoodleUpload } from "@/components/DoodleIcons";
import { trpc } from "@/lib/trpc";
import {
  BANKING_GROUPS,
  STATUS_CLASSES,
  STATUS_LABELS,
  TOP_FIRMS,
} from "@/lib/types";
import type { ContactStatus } from "@/lib/types";
import { AlertTriangle, ChevronDown, ChevronUp, ExternalLink, Trash2, X } from "lucide-react";
import { useState } from "react";
import { Link } from "wouter";
import { toast } from "sonner";

type SortField = "name" | "firm" | "status" | "createdAt";

/** Confirmation dialog for destructive actions */
function ConfirmDialog({
  open,
  title,
  description,
  confirmLabel,
  onConfirm,
  onCancel,
}: {
  open: boolean;
  title: string;
  description: string;
  confirmLabel: string;
  onConfirm: () => void;
  onCancel: () => void;
}) {
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="absolute inset-0 bg-black/30" onClick={onCancel} />
      <div className="relative sketch-card w-full max-w-sm mx-4 p-6 z-10">
        <div className="flex items-start gap-3 mb-4">
          <AlertTriangle size={18} className="text-red-500 flex-shrink-0 mt-0.5" />
          <div>
            <h3 className="text-sm font-bold text-[var(--color-ink)]">{title}</h3>
            <p className="text-xs text-[var(--color-ink-muted)] mt-1">{description}</p>
          </div>
        </div>
        <div className="flex items-center justify-end gap-2">
          <button onClick={onCancel} className="sketch-btn text-xs">
            Cancel
          </button>
          <button
            onClick={onConfirm}
            className="sketch-btn text-xs bg-red-50 border-red-300 text-red-700 hover:bg-red-100"
          >
            <Trash2 size={11} />
            {confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
}

export default function Contacts() {
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [groupFilter, setGroupFilter] = useState("");
  const [firmFilter, setFirmFilter] = useState("");
  const [sortBy, setSortBy] = useState<SortField>("createdAt");
  const [sortDir, setSortDir] = useState<"asc" | "desc">("desc");
  const [page, setPage] = useState(1);
  const [deleteTargetId, setDeleteTargetId] = useState<number | null>(null);
  const [deleteTargetName, setDeleteTargetName] = useState<string>("");
  const [showDeleteAll, setShowDeleteAll] = useState(false);
  const PAGE_SIZE = 25;

  const utils = trpc.useUtils();

  const { data, isLoading } = trpc.contacts.list.useQuery({
    search: search || undefined,
    status: statusFilter || undefined,
    group: groupFilter || undefined,
    firm: firmFilter || undefined,
    sortBy,
    sortDir,
    limit: PAGE_SIZE,
    offset: (page - 1) * PAGE_SIZE,
  });

  const updateStatusMutation = trpc.contacts.update.useMutation({
    onSuccess: () => utils.contacts.list.invalidate(),
    onError: (e) => toast.error("Failed to update status: " + e.message),
  });

  const deleteMutation = trpc.contacts.delete.useMutation({
    onSuccess: () => {
      toast.success("Contact deleted");
      utils.contacts.list.invalidate();
      utils.dashboard.stats.invalidate();
      setDeleteTargetId(null);
    },
    onError: (err) => {
      toast.error("Failed to delete: " + err.message);
      setDeleteTargetId(null);
    },
  });

  const deleteAllMutation = trpc.contacts.deleteAll.useMutation({
    onSuccess: () => {
      toast.success("All contacts deleted");
      utils.contacts.list.invalidate();
      utils.dashboard.stats.invalidate();
      setShowDeleteAll(false);
    },
    onError: (err) => {
      toast.error("Failed to delete all: " + err.message);
      setShowDeleteAll(false);
    },
  });

  const contacts = data?.contacts ?? [];
  const total = data?.total ?? 0;
  const totalPages = Math.ceil(total / PAGE_SIZE);

  function toggleSort(field: SortField) {
    if (sortBy === field) {
      setSortDir((d) => (d === "asc" ? "desc" : "asc"));
    } else {
      setSortBy(field);
      setSortDir("desc");
    }
    setPage(1);
  }

  function SortIcon({ field }: { field: SortField }) {
    if (sortBy !== field) return <ChevronDown size={10} className="opacity-30" />;
    return sortDir === "asc" ? <ChevronUp size={10} /> : <ChevronDown size={10} />;
  }

  const hasFilters = search || statusFilter || groupFilter || firmFilter;

  return (
    <div className="min-h-screen paper-bg">
      {/* Confirm delete single */}
      <ConfirmDialog
        open={deleteTargetId !== null}
        title={`Delete ${deleteTargetName}?`}
        description="This will permanently remove the contact and all associated coffee chat data. This cannot be undone."
        confirmLabel="Delete Contact"
        onConfirm={() => {
          if (deleteTargetId !== null) deleteMutation.mutate({ id: deleteTargetId });
        }}
        onCancel={() => setDeleteTargetId(null)}
      />

      {/* Confirm delete all */}
      <ConfirmDialog
        open={showDeleteAll}
        title="Delete all contacts?"
        description={`This will permanently delete all ${total} contacts and all associated coffee chat data. This cannot be undone.`}
        confirmLabel="Delete All"
        onConfirm={() => deleteAllMutation.mutate()}
        onCancel={() => setShowDeleteAll(false)}
      />

      {/* Header */}
      <div className="border-b border-[var(--color-border-dark)] px-8 py-6">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-[10px] font-mono font-semibold uppercase tracking-widest text-[var(--color-ink-faint)] mb-1">
              Relationship CRM
            </p>
            <h1 className="text-2xl font-bold tracking-tight text-[var(--color-ink)]">
              Contacts
            </h1>
            <p className="text-sm text-[var(--color-ink-muted)] mt-0.5">
              {total} contact{total !== 1 ? "s" : ""} in your network
            </p>
          </div>
          <div className="flex items-center gap-2">
            {total > 0 && (
              <button
                onClick={() => setShowDeleteAll(true)}
                className="sketch-btn text-xs border-red-200 text-red-600 hover:bg-red-50"
                title="Delete all contacts"
              >
                <Trash2 size={12} />
                Delete All
              </button>
            )}
            <Link href="/import">
              <button className="sketch-btn sketch-btn-primary">
                <DoodleUpload size={13} />
                Import
              </button>
            </Link>
          </div>
        </div>

        {/* Filter bar */}
        <div className="flex flex-wrap gap-2 mt-4">
          <div className="relative">
            <DoodleMagnifier
              size={14}
              className="absolute left-2.5 top-1/2 -translate-y-1/2 text-[var(--color-ink-faint)]"
            />
            <input
              type="text"
              placeholder="Search name, firm, school…"
              value={search}
              onChange={(e) => {
                setSearch(e.target.value);
                setPage(1);
              }}
              className="sketch-input pl-8 w-52 text-xs"
            />
          </div>

          <select
            value={statusFilter}
            onChange={(e) => {
              setStatusFilter(e.target.value);
              setPage(1);
            }}
            className="sketch-input w-40 text-xs"
          >
            <option value="">All statuses</option>
            {Object.entries(STATUS_LABELS).map(([v, l]) => (
              <option key={v} value={v}>
                {l}
              </option>
            ))}
          </select>

          <select
            value={groupFilter}
            onChange={(e) => {
              setGroupFilter(e.target.value);
              setPage(1);
            }}
            className="sketch-input w-44 text-xs"
          >
            <option value="">All groups</option>
            {BANKING_GROUPS.map((g) => (
              <option key={g} value={g}>
                {g}
              </option>
            ))}
          </select>

          <select
            value={firmFilter}
            onChange={(e) => {
              setFirmFilter(e.target.value);
              setPage(1);
            }}
            className="sketch-input w-44 text-xs"
          >
            <option value="">All firms</option>
            {TOP_FIRMS.map((f) => (
              <option key={f} value={f}>
                {f}
              </option>
            ))}
          </select>

          {hasFilters && (
            <button
              onClick={() => {
                setSearch("");
                setStatusFilter("");
                setGroupFilter("");
                setFirmFilter("");
                setPage(1);
              }}
              className="sketch-btn text-xs"
            >
              <X size={11} />
              Clear
            </button>
          )}
        </div>
      </div>

      {/* Table */}
      <div className="px-8 py-4">
        <div className="sketch-card overflow-hidden">
          <div className="overflow-x-auto">
            <table className="crm-table">
              <thead>
                <tr>
                  <th
                    className="cursor-pointer hover:text-[var(--color-ink)] select-none"
                    onClick={() => toggleSort("name")}
                  >
                    <span className="flex items-center gap-1">
                      Name <SortIcon field="name" />
                    </span>
                  </th>
                  <th
                    className="cursor-pointer hover:text-[var(--color-ink)] select-none"
                    onClick={() => toggleSort("firm")}
                  >
                    <span className="flex items-center gap-1">
                      Firm <SortIcon field="firm" />
                    </span>
                  </th>
                  <th>Group</th>
                  <th>Role</th>
                  <th>School</th>
                  <th
                    className="cursor-pointer hover:text-[var(--color-ink)] select-none"
                    onClick={() => toggleSort("status")}
                  >
                    <span className="flex items-center gap-1">
                      Status <SortIcon field="status" />
                    </span>
                  </th>
                  <th className="w-16 text-right">Actions</th>
                </tr>
              </thead>
              <tbody>
                {isLoading ? (
                  Array.from({ length: 8 }).map((_, i) => (
                    <tr key={i}>
                      {Array.from({ length: 7 }).map((_, j) => (
                        <td key={j}>
                          <div className="h-3.5 bg-[var(--color-border)] rounded animate-pulse w-20" />
                        </td>
                      ))}
                    </tr>
                  ))
                ) : contacts.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="text-center py-16">
                      <div className="flex flex-col items-center gap-3">
                        <DoodleSparkle
                          size={32}
                          className="text-[var(--color-ink-faint)]"
                        />
                        <p className="text-sm text-[var(--color-ink-muted)]">
                          {hasFilters
                            ? "No contacts match your filters."
                            : "No contacts yet. Import your spreadsheet to get started."}
                        </p>
                        {!hasFilters && (
                          <Link href="/import">
                            <button className="sketch-btn sketch-btn-primary text-xs">
                              <DoodleUpload size={12} />
                              Import Contacts
                            </button>
                          </Link>
                        )}
                      </div>
                    </td>
                  </tr>
                ) : (
                  contacts.map((c) => (
                    <tr
                      key={c.id}
                      className="cursor-pointer"
                      onClick={() => (window.location.href = `/contacts/${c.id}`)}
                    >
                      <td>
                        <div className="flex items-center gap-2">
                          <div className="w-7 h-7 rounded-full bg-[var(--color-paper-dark)] border border-[var(--color-border-dark)] flex items-center justify-center text-[10px] font-mono font-bold text-[var(--color-ink-muted)] flex-shrink-0">
                            {(c.name ?? "?")[0].toUpperCase()}
                          </div>
                          <div>
                            <p className="text-xs font-semibold text-[var(--color-ink)]">
                              {c.name}
                            </p>
                            {c.email && (
                              <p className="text-[10px] text-[var(--color-ink-faint)] font-mono">
                                {c.email}
                              </p>
                            )}
                          </div>
                        </div>
                      </td>
                      <td className="text-xs text-[var(--color-ink-muted)]">
                        {c.firm ?? "—"}
                      </td>
                      <td>
                        {c.bankingGroup && (
                          <span className="sketch-tag">{c.bankingGroup}</span>
                        )}
                      </td>
                      <td className="text-xs text-[var(--color-ink-muted)]">
                        {c.role ?? "—"}
                      </td>
                      <td className="text-xs text-[var(--color-ink-muted)]">
                        {c.school ?? "—"}
                      </td>
                      <td onClick={(e) => e.stopPropagation()}>
                        <select
                          value={c.status ?? "not_started"}
                          onChange={(e) => {
                            updateStatusMutation.mutate({
                              id: c.id,
                              status: e.target.value as ContactStatus,
                            });
                          }}
                          className={`status-badge cursor-pointer border-0 bg-transparent text-[10px] font-mono font-semibold uppercase tracking-wider pr-4 ${STATUS_CLASSES[(c.status ?? "not_started") as ContactStatus]}`}
                          style={{ appearance: "auto" }}
                        >
                          {Object.entries(STATUS_LABELS).map(([val, label]) => (
                            <option key={val} value={val}>{label}</option>
                          ))}
                        </select>
                      </td>
                      <td>
                        <div
                          className="flex items-center justify-end gap-1"
                          onClick={(e) => e.stopPropagation()}
                        >
                          {c.linkedinUrl && (
                            <a
                              href={c.linkedinUrl}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="p-1 rounded hover:bg-[var(--color-paper-dark)] transition-colors"
                              title="LinkedIn"
                            >
                              <ExternalLink
                                size={12}
                                className="text-[var(--color-ink-faint)]"
                              />
                            </a>
                          )}
                          <button
                            onClick={() => {
                              setDeleteTargetId(c.id);
                              setDeleteTargetName(c.name ?? "this contact");
                            }}
                            className="p-1 rounded hover:bg-red-50 transition-colors group"
                            title="Delete contact"
                          >
                            <Trash2
                              size={12}
                              className="text-[var(--color-ink-faint)] group-hover:text-red-500 transition-colors"
                            />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex items-center justify-between px-4 py-3 border-t border-[var(--color-border-dark)]">
              <p className="text-xs text-[var(--color-ink-faint)] font-mono">
                Showing {(page - 1) * PAGE_SIZE + 1}–
                {Math.min(page * PAGE_SIZE, total)} of {total}
              </p>
              <div className="flex items-center gap-1">
                <button
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                  disabled={page === 1}
                  className="sketch-btn text-xs disabled:opacity-40"
                >
                  Prev
                </button>
                <span className="text-xs font-mono text-[var(--color-ink-muted)] px-2">
                  {page} / {totalPages}
                </span>
                <button
                  onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                  disabled={page === totalPages}
                  className="sketch-btn text-xs disabled:opacity-40"
                >
                  Next
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
