import { useLang } from "@/contexts/LanguageContext";

export default function LanguageToggle() {
  const { lang, toggleLang } = useLang();

  return (
    <button
      onClick={toggleLang}
      aria-label={lang === "en" ? "Switch to Chinese" : "切换为英文"}
      className="relative inline-flex items-center h-7 rounded-full px-1 gap-0 border border-[var(--color-border-dark)] bg-[var(--color-paper-dark)] transition-all duration-200 hover:border-[var(--color-ink-muted)] active:scale-95 select-none"
      style={{ width: "64px" }}
    >
      {/* Track labels */}
      <span
        className={`absolute left-2 text-[10px] font-mono font-bold transition-all duration-200 ${
          lang === "en" ? "text-[var(--color-paper)] opacity-100" : "text-[var(--color-ink-faint)] opacity-70"
        }`}
      >
        EN
      </span>
      <span
        className={`absolute right-2 text-[10px] font-mono font-bold transition-all duration-200 ${
          lang === "zh" ? "text-[var(--color-paper)] opacity-100" : "text-[var(--color-ink-faint)] opacity-70"
        }`}
      >
        中
      </span>
      {/* Sliding thumb */}
      <span
        className="absolute top-0.5 bottom-0.5 w-[28px] rounded-full bg-[var(--color-ink)] shadow-sm transition-all duration-200 ease-out"
        style={{ left: lang === "en" ? "2px" : "calc(100% - 30px)" }}
      />
    </button>
  );
}
