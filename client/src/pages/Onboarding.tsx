import { trpc } from "@/lib/trpc";
import { DoodleCoffeeCup, DoodleSparkle } from "@/components/DoodleIcons";
import { useEffect, useState } from "react";
import { useLocation } from "wouter";
import { toast } from "sonner";

const INDUSTRIES = [
  { value: "investment_banking", label: "Investment Banking", emoji: "🏦" },
  { value: "venture_capital", label: "Venture Capital", emoji: "🚀" },
  { value: "consulting", label: "Consulting", emoji: "📊" },
] as const;

const CLASS_YEARS = ["2026", "2027", "2028", "2029", "2030", "2031"];
const RECRUITING_YEARS = ["Summer 2027", "Summer 2028", "Summer 2029", "Summer 2030", "Full-Time 2027", "Full-Time 2028", "Full-Time 2029"];
const SCHOOLS = [
  "University of Pennsylvania", "New York University", "Columbia University",
  "Harvard University", "Cornell University", "University of Michigan",
  "University of Chicago", "University of California, Berkeley",
  "University of Southern California", "London School of Economics",
  "University of Oxford", "University of Cambridge", "Other",
];
const REGIONS = [
  { value: "us", label: "United States", note: "US Finance + Tech" },
  { value: "uk", label: "United Kingdom", note: "UK Finance + Spring Weeks" },
  { value: "europe", label: "Continental Europe", note: "France, Germany, Italy" },
  { value: "hong_kong", label: "Hong Kong / APAC", note: "Hong Kong Finance" },
  { value: "other", label: "Other / Multiple", note: "Browse all Trackr regions" },
] as const;

export default function Onboarding() {
  const [, setLocation] = useLocation();
  const utils = trpc.useUtils();
  const [step, setStep] = useState(1);
  const { data: profile } = trpc.user.getProfile.useQuery();
  const [schoolChoice, setSchoolChoice] = useState("");
  const [form, setForm] = useState({
    name: "",
    school: "",
    major: "",
    classYear: "",
    hometown: "",
    club: "",
    targetIndustry: "" as "investment_banking" | "venture_capital" | "consulting" | "",
    recruitingSeason: "",
    recruitingRegion: "" as "us" | "uk" | "europe" | "hong_kong" | "other" | "",
    targetFirm: "",
    targetGroup: "",
  });

  useEffect(() => {
    if (!profile) return;
    setForm(current => ({
      ...current,
      name: current.name || profile.name || "",
      school: current.school || profile.school || "",
      classYear: current.classYear || profile.classYear || "",
      recruitingSeason: current.recruitingSeason || profile.recruitingSeason || "",
      recruitingRegion: current.recruitingRegion || profile.recruitingRegion || "",
    }));
    if (profile.school) setSchoolChoice(SCHOOLS.includes(profile.school) ? profile.school : "Other");
  }, [profile]);

  const updateMutation = trpc.user.updateBackground.useMutation({
    onSuccess: async () => {
      await utils.user.getProfile.invalidate();
      toast.success("Profile saved! Welcome to CoffeeLab.");
      setLocation("/");
    },
    onError: (e) => toast.error(e.message),
  });

  function set(field: keyof typeof form, value: string) {
    setForm(f => ({ ...f, [field]: value }));
  }

  function handleSubmit() {
    if (!form.name || !form.school || !form.targetIndustry || !form.recruitingRegion || !form.recruitingSeason) {
      toast.error("Please complete the required profile and recruiting fields.");
      return;
    }
    updateMutation.mutate({
      name: form.name || undefined,
      school: form.school || undefined,
      major: form.major || undefined,
      classYear: form.classYear || undefined,
      hometown: form.hometown || undefined,
      club: form.club || undefined,
      targetIndustry: form.targetIndustry || undefined,
      recruitingSeason: form.recruitingSeason || undefined,
      recruitingRegion: form.recruitingRegion || undefined,
      targetFirm: form.targetFirm || undefined,
      targetGroup: form.targetGroup || undefined,
      onboardingCompleted: true,
    });
  }

  return (
    <div className="min-h-screen paper-bg flex items-center justify-center p-6">
      <div className="w-full max-w-lg">
        {/* Logo */}
        <div className="flex items-center gap-2 mb-8">
          <DoodleCoffeeCup size={28} className="text-[var(--color-ink)]" />
          <span className="text-lg font-bold tracking-tight text-[var(--color-ink)]">CoffeeLab</span>
        </div>

        {/* Progress */}
        <div className="flex items-center gap-1 mb-6">
          {[1, 2, 3].map(s => (
            <div
              key={s}
              className={`h-1 flex-1 rounded-full transition-all ${s <= step ? "bg-[var(--color-ink)]" : "bg-[var(--color-border-dark)]"}`}
            />
          ))}
        </div>

        <div className="sketch-card p-6 space-y-5">
          {step === 1 && (
            <>
              <div>
                <p className="text-[10px] font-mono font-semibold uppercase tracking-widest text-[var(--color-ink-faint)] mb-1">Step 1 of 3</p>
                <h2 className="text-xl font-bold text-[var(--color-ink)]">Your Background</h2>
                <p className="text-sm text-[var(--color-ink-muted)] mt-1">
                  This helps us personalize your outreach emails and score your contacts.
                </p>
              </div>

              <div className="space-y-3">
                <div>
                  <label className="block text-xs font-semibold text-[var(--color-ink)] mb-1">Name *</label>
                  <input type="text" placeholder="e.g. Rylee Lin" value={form.name} onChange={e => set("name", e.target.value)} className="sketch-input w-full text-sm" />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-[var(--color-ink)] mb-1">School *</label>
                  <select value={schoolChoice} onChange={e => {
                    const value = e.target.value;
                    setSchoolChoice(value);
                    set("school", value === "Other" ? "" : value);
                  }} className="sketch-input w-full text-sm">
                    <option value="">Select school</option>
                    {SCHOOLS.map(school => <option key={school} value={school}>{school}</option>)}
                  </select>
                  {schoolChoice === "Other" && (
                    <input type="text" placeholder="Type your school name" value={form.school} onChange={e => set("school", e.target.value)} className="sketch-input w-full text-sm mt-2" />
                  )}
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-semibold text-[var(--color-ink)] mb-1">Major</label>
                    <input
                      type="text"
                      placeholder="e.g. Finance, Economics"
                      value={form.major}
                      onChange={e => set("major", e.target.value)}
                      className="sketch-input w-full text-sm"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-[var(--color-ink)] mb-1">Class Year</label>
                    <select
                      value={form.classYear}
                      onChange={e => set("classYear", e.target.value)}
                      className="sketch-input w-full text-sm"
                    >
                      <option value="">Select year</option>
                      {CLASS_YEARS.map(y => <option key={y} value={y}>{y}</option>)}
                    </select>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-semibold text-[var(--color-ink)] mb-1">Hometown</label>
                    <input
                      type="text"
                      placeholder="e.g. New York, NY"
                      value={form.hometown}
                      onChange={e => set("hometown", e.target.value)}
                      className="sketch-input w-full text-sm"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-[var(--color-ink)] mb-1">Club / Activity</label>
                    <input
                      type="text"
                      placeholder="e.g. Investment Club"
                      value={form.club}
                      onChange={e => set("club", e.target.value)}
                      className="sketch-input w-full text-sm"
                    />
                  </div>
                </div>
              </div>

              <button
                onClick={() => {
                  if (!form.name || !form.school) { toast.error("Name and school are required"); return; }
                  setStep(2);
                }}
                className="sketch-btn sketch-btn-primary w-full"
              >
                Next →
              </button>
            </>
          )}

          {step === 2 && (
            <>
              <div>
                <p className="text-[10px] font-mono font-semibold uppercase tracking-widest text-[var(--color-ink-faint)] mb-1">Step 2 of 3</p>
                <h2 className="text-xl font-bold text-[var(--color-ink)]">Your Recruiting Goals</h2>
                <p className="text-sm text-[var(--color-ink-muted)] mt-1">
                  Tell us what you're recruiting for so we can surface the right timeline and insights.
                </p>
              </div>

              <div className="space-y-3">
                <div>
                  <label className="block text-xs font-semibold text-[var(--color-ink)] mb-2">Target Industry *</label>
                  <div className="grid grid-cols-3 gap-2">
                    {INDUSTRIES.map(ind => (
                      <button
                        key={ind.value}
                        onClick={() => set("targetIndustry", ind.value)}
                        className={`p-3 rounded border-2 text-center transition-all ${
                          form.targetIndustry === ind.value
                            ? "border-[var(--color-ink)] bg-[var(--color-paper-dark)] shadow-[2px_2px_0_0_var(--color-ink)]"
                            : "border-[var(--color-border-dark)] hover:border-[var(--color-ink-muted)]"
                        }`}
                      >
                        <div className="text-xl mb-1">{ind.emoji}</div>
                        <div className="text-[10px] font-semibold text-[var(--color-ink)] leading-tight">{ind.label}</div>
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-[var(--color-ink)] mb-1">Recruiting Year *</label>
                  <select
                    value={form.recruitingSeason}
                    onChange={e => set("recruitingSeason", e.target.value)}
                    className="sketch-input w-full text-sm"
                  >
                    <option value="">Select recruiting year</option>
                    {RECRUITING_YEARS.map(s => <option key={s} value={s}>{s}</option>)}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-[var(--color-ink)] mb-2">Recruiting Region *</label>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    {REGIONS.map(region => (
                      <button type="button" key={region.value} onClick={() => set("recruitingRegion", region.value)} className={`rounded-md border px-3 py-2 text-left transition-all ${form.recruitingRegion === region.value ? "border-[var(--color-ink)] bg-[var(--color-paper-dark)] shadow-[2px_2px_0_0_var(--color-ink)]" : "border-[var(--color-border-dark)] hover:border-[var(--color-ink-muted)]"}`}>
                        <span className="block text-xs font-semibold">{region.label}</span>
                        <span className="block text-[10px] text-[var(--color-ink-faint)]">{region.note}</span>
                      </button>
                    ))}
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-semibold text-[var(--color-ink)] mb-1">Target Firm</label>
                    <input
                      type="text"
                      placeholder="e.g. Goldman Sachs"
                      value={form.targetFirm}
                      onChange={e => set("targetFirm", e.target.value)}
                      className="sketch-input w-full text-sm"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-[var(--color-ink)] mb-1">Target Group</label>
                    <input
                      type="text"
                      placeholder="e.g. TMT, Healthcare"
                      value={form.targetGroup}
                      onChange={e => set("targetGroup", e.target.value)}
                      className="sketch-input w-full text-sm"
                    />
                  </div>
                </div>
              </div>

              <div className="flex gap-2">
                <button onClick={() => setStep(1)} className="sketch-btn flex-1">← Back</button>
                <button
                  onClick={() => {
                    if (!form.targetIndustry || !form.recruitingSeason || !form.recruitingRegion) { toast.error("Select an industry, recruiting year, and region"); return; }
                    setStep(3);
                  }}
                  className="sketch-btn sketch-btn-primary flex-1"
                >
                  Next →
                </button>
              </div>
            </>
          )}

          {step === 3 && (
            <>
              <div>
                <p className="text-[10px] font-mono font-semibold uppercase tracking-widest text-[var(--color-ink-faint)] mb-1">Step 3 of 3</p>
                <h2 className="text-xl font-bold text-[var(--color-ink)]">You're all set!</h2>
                <p className="text-sm text-[var(--color-ink-muted)] mt-1">
                  Here's a summary of your profile. You can always update this in Settings.
                </p>
              </div>

              <div className="sketch-card p-4 space-y-2 bg-[var(--color-paper-dark)]">
                {[
                  ["Name", form.name],
                  ["School", form.school],
                  ["Major", form.major],
                  ["Class Year", form.classYear],
                  ["Hometown", form.hometown],
                  ["Club", form.club],
                  ["Target Industry", INDUSTRIES.find(i => i.value === form.targetIndustry)?.label],
                  ["Recruiting Season", form.recruitingSeason],
                  ["Recruiting Region", REGIONS.find(region => region.value === form.recruitingRegion)?.label],
                  ["Target Firm", form.targetFirm],
                  ["Target Group", form.targetGroup],
                ].filter(([, v]) => v).map(([label, value]) => (
                  <div key={label} className="flex justify-between text-sm">
                    <span className="text-[var(--color-ink-muted)] text-xs">{label}</span>
                    <span className="font-semibold text-[var(--color-ink)] text-xs">{value}</span>
                  </div>
                ))}
              </div>

              <div className="flex gap-2">
                <button onClick={() => setStep(2)} className="sketch-btn flex-1">← Back</button>
                <button
                  onClick={handleSubmit}
                  disabled={updateMutation.isPending}
                  className="sketch-btn sketch-btn-primary flex-1 disabled:opacity-40"
                >
                  {updateMutation.isPending ? (
                    <><DoodleSparkle size={13} className="animate-spin" /> Saving...</>
                  ) : (
                    <><DoodleSparkle size={13} /> Start Networking</>
                  )}
                </button>
              </div>
            </>
          )}
        </div>

        <p className="text-center text-xs text-[var(--color-ink-faint)] mt-4">
          Your answers are stored privately and used to personalize your workspace.
        </p>
      </div>
    </div>
  );
}
