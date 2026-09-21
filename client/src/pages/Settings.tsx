import { trpc } from "@/lib/trpc";
import { useAuth } from "@/_core/hooks/useAuth";
import { BANKING_GROUPS } from "@/lib/types";
import { Save, User, Info } from "lucide-react";
import { useState, useEffect } from "react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { toast } from "sonner";

export default function Settings() {
  const { user } = useAuth();
  const utils = trpc.useUtils();

  const { data: profile } = trpc.settings.getProfile.useQuery();

  const [form, setForm] = useState({
    name: "",
    school: "",
    major: "",
    club: "",
    hometown: "",
    targetGroup: "",
    targetFirm: "",
    recruitingSeason: "",
    recruitingRegion: "" as "us" | "uk" | "europe" | "hong_kong" | "other" | "",
  });

  useEffect(() => {
    if (profile) {
      setForm({
        name: profile.name ?? "",
        school: profile.school ?? "",
        major: profile.major ?? "",
        club: profile.club ?? "",
        hometown: profile.hometown ?? "",
        targetGroup: profile.targetGroup ?? "",
        targetFirm: profile.targetFirm ?? "",
        recruitingSeason: profile.recruitingSeason ?? "",
        recruitingRegion: profile.recruitingRegion ?? "",
      });
    }
  }, [profile]);

  const updateMutation = trpc.settings.updateProfile.useMutation({
    onSuccess: () => {
      utils.settings.getProfile.invalidate();
      toast.success(
        "Profile saved — outreach emails will use your updated background."
      );
    },
    onError: (e: { message: string }) => toast.error(e.message),
  });

  const set = (k: string) => (e: React.ChangeEvent<HTMLInputElement>) =>
    setForm(f => ({ ...f, [k]: e.target.value }));

  return (
    <div className="min-h-screen paper-bg">
      {/* Page header */}
      <div className="border-b border-[var(--color-border-dark)] px-8 py-6">
        <p className="text-[10px] font-mono font-semibold uppercase tracking-widest text-[var(--color-ink-faint)] mb-1">
          Configuration
        </p>
        <h1 className="text-2xl font-bold tracking-tight text-[var(--color-ink)]">
          Settings
        </h1>
        <p className="text-sm text-[var(--color-ink-muted)] mt-0.5">
          Configure your background for personalized outreach email generation
        </p>
      </div>

      <div className="mx-auto w-full max-w-3xl space-y-6 px-5 py-6 sm:px-8">
        {/* Account card */}
        <div className="sketch-card p-5">
          <div className="flex items-center gap-2 mb-4">
            <User size={14} className="text-[var(--color-ink-muted)]" />
            <p className="text-xs font-mono font-semibold uppercase tracking-wider text-[var(--color-ink)]">
              Account
            </p>
          </div>
          <div className="space-y-2">
            <div className="flex justify-between items-center py-1.5 border-b border-[var(--color-border)]">
              <span className="text-xs font-mono text-[var(--color-ink-muted)]">
                Name
              </span>
              <span className="text-xs font-semibold text-[var(--color-ink)]">
                {profile?.name ?? user?.name ?? "—"}
              </span>
            </div>
            <div className="flex justify-between items-center py-1.5 border-b border-[var(--color-border)]">
              <span className="text-xs font-mono text-[var(--color-ink-muted)]">
                Email
              </span>
              <span className="text-xs font-semibold text-[var(--color-ink)]">
                {user?.email ?? "—"}
              </span>
            </div>
            <div className="flex justify-between items-center py-1.5">
              <span className="text-xs font-mono text-[var(--color-ink-muted)]">
                Role
              </span>
              <span className="text-xs font-semibold text-[var(--color-ink)] capitalize">
                {user?.role ?? "—"}
              </span>
            </div>
          </div>
        </div>

        {/* Recruiting profile */}
        <div className="sketch-card p-5">
          <div className="mb-4">
            <p className="text-xs font-mono font-semibold uppercase tracking-wider text-[var(--color-ink)] mb-1">
              Your Recruiting Profile
            </p>
            <p className="text-xs text-[var(--color-ink-muted)]">
              Used to generate highly personalized outreach emails and thank-you
              notes based on shared background.
            </p>
          </div>

          <div className="grid grid-cols-2 gap-4">
            {[
              {
                key: "name",
                label: "Preferred Name",
                placeholder: "e.g. Rylee Lin",
              },
              {
                key: "school",
                label: "Your School",
                placeholder: "e.g. Wharton, Stern, Ross",
              },
              {
                key: "major",
                label: "Major / Concentration",
                placeholder: "e.g. Finance, Economics",
              },
              {
                key: "club",
                label: "Club / Organization",
                placeholder: "e.g. Investment Banking Club",
              },
              {
                key: "hometown",
                label: "Hometown",
                placeholder: "e.g. New York, NY",
              },
              {
                key: "targetFirm",
                label: "Target Firm",
                placeholder: "e.g. Goldman Sachs",
              },
            ].map(({ key, label, placeholder }) => (
              <div
                key={key}
                className={key === "targetFirm" ? "col-span-1" : ""}
              >
                <p className="text-[10px] font-mono font-semibold uppercase tracking-wider text-[var(--color-ink-muted)] mb-1.5">
                  {label}
                </p>
                <input
                  value={form[key as keyof typeof form]}
                  onChange={set(key)}
                  placeholder={placeholder}
                  className="sketch-input w-full text-sm"
                />
              </div>
            ))}

            <div>
              <p className="text-[10px] font-mono font-semibold uppercase tracking-wider text-[var(--color-ink-muted)] mb-1.5">
                Target Group
              </p>
              <Select
                value={form.targetGroup || "none"}
                onValueChange={v =>
                  setForm(f => ({ ...f, targetGroup: v === "none" ? "" : v }))
                }
              >
                <SelectTrigger className="sketch-input h-9 text-sm w-full">
                  <SelectValue placeholder="Select target group..." />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">— Any group —</SelectItem>
                  {BANKING_GROUPS.map(g => (
                    <SelectItem key={g} value={g}>
                      {g}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <p className="text-[10px] font-mono font-semibold uppercase tracking-wider text-[var(--color-ink-muted)] mb-1.5">
                Recruiting Year
              </p>
              <input
                value={form.recruitingSeason}
                onChange={set("recruitingSeason")}
                placeholder="e.g. Summer 2028"
                className="sketch-input w-full text-sm"
              />
            </div>

            <div>
              <p className="text-[10px] font-mono font-semibold uppercase tracking-wider text-[var(--color-ink-muted)] mb-1.5">
                Recruiting Region
              </p>
              <select
                value={form.recruitingRegion}
                onChange={e =>
                  setForm(f => ({
                    ...f,
                    recruitingRegion: e.target
                      .value as typeof f.recruitingRegion,
                  }))
                }
                className="sketch-input w-full text-sm"
              >
                <option value="">Select region</option>
                <option value="us">United States</option>
                <option value="uk">United Kingdom</option>
                <option value="europe">Continental Europe</option>
                <option value="hong_kong">Hong Kong / APAC</option>
                <option value="other">Other / Multiple</option>
              </select>
            </div>
          </div>

          <div className="mt-5 pt-4 border-t border-[var(--color-border)]">
            <button
              onClick={() =>
                updateMutation.mutate({
                  ...form,
                  name: form.name || undefined,
                  recruitingRegion: form.recruitingRegion || undefined,
                })
              }
              disabled={updateMutation.isPending}
              className="sketch-btn sketch-btn-primary disabled:opacity-40"
            >
              <Save size={13} />
              {updateMutation.isPending ? "Saving..." : "Save Profile"}
            </button>
          </div>
        </div>

        {/* How personalization works */}
        <div className="sketch-card p-5">
          <div className="flex items-center gap-2 mb-4">
            <Info size={14} className="text-[var(--color-ink-muted)]" />
            <p className="text-xs font-mono font-semibold uppercase tracking-wider text-[var(--color-ink)]">
              How Personalization Works
            </p>
          </div>
          <div className="space-y-2">
            {[
              {
                label: "School",
                desc: "Shared alma mater is referenced in cold outreach and follow-ups.",
              },
              {
                label: "Major",
                desc: "Helps frame your academic background in emails.",
              },
              {
                label: "Club",
                desc: "Shared club membership is a strong conversation opener.",
              },
              {
                label: "Hometown",
                desc: "Regional connection is used as a warm intro hook.",
              },
              {
                label: "Target Firm",
                desc: "Focuses outreach on bankers at your priority firm.",
              },
              {
                label: "Target Group",
                desc: "Tailors email tone and questions to the specific group.",
              },
            ].map(({ label, desc }) => (
              <div
                key={label}
                className="flex items-start gap-3 py-1.5 border-b border-[var(--color-border)] last:border-0"
              >
                <span className="w-28 flex-shrink-0 text-xs font-semibold text-[var(--color-ink)]">
                  {label}
                </span>
                <span className="text-xs text-[var(--color-ink-muted)]">
                  {desc}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
