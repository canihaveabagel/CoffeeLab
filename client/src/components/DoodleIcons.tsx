/**
 * Hand-drawn SVG doodle icons — slightly imperfect black line art.
 * All icons are inline SVG with stroke-based rendering.
 */

interface DoodleProps {
  className?: string;
  size?: number;
}

export function DoodleCoffeeCup({ className = "", size = 32 }: DoodleProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 32 32" fill="none" stroke="currentColor"
      strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"
      className={className} aria-hidden>
      <path d="M7 11h14l-2 12H9L7 11z" />
      <path d="M21 13h2a2.5 2.5 0 0 1 0 5h-2" />
      <path d="M10 8c0-1.5 2-1.5 2-3" />
      <path d="M14 8c0-1.5 2-1.5 2-3" />
      <path d="M5 23h18" />
    </svg>
  );
}

export function DoodleNotebook({ className = "", size = 32 }: DoodleProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 32 32" fill="none" stroke="currentColor"
      strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"
      className={className} aria-hidden>
      <rect x="7" y="4" width="18" height="24" rx="1.5" />
      <path d="M7 4h-2a1 1 0 0 0-1 1v22a1 1 0 0 0 1 1h2" />
      <path d="M11 10h10" />
      <path d="M11 14h10" />
      <path d="M11 18h7" />
    </svg>
  );
}

export function DoodleArrow({ className = "", size = 24 }: DoodleProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor"
      strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"
      className={className} aria-hidden>
      <path d="M5 12c3-1 9-1 13 0" />
      <path d="M14 9l4 3-4 3" />
    </svg>
  );
}

export function DoodleMagnifier({ className = "", size = 20 }: DoodleProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 20 20" fill="none" stroke="currentColor"
      strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"
      className={className} aria-hidden>
      <circle cx="8.5" cy="8.5" r="5" />
      <path d="M12.5 12.5l4 4" />
    </svg>
  );
}

export function DoodleMicrophone({ className = "", size = 24 }: DoodleProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor"
      strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"
      className={className} aria-hidden>
      <rect x="9" y="2" width="6" height="11" rx="3" />
      <path d="M5 10a7 7 0 0 0 14 0" />
      <path d="M12 17v4" />
      <path d="M9 21h6" />
    </svg>
  );
}

export function DoodleCalendar({ className = "", size = 24 }: DoodleProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor"
      strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"
      className={className} aria-hidden>
      <rect x="3" y="5" width="18" height="16" rx="1.5" />
      <path d="M3 10h18" />
      <path d="M8 3v4" />
      <path d="M16 3v4" />
      <path d="M7 14h2" />
      <path d="M11 14h2" />
      <path d="M15 14h2" />
    </svg>
  );
}

export function DoodleStar({ className = "", size = 20 }: DoodleProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 20 20" fill="none" stroke="currentColor"
      strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"
      className={className} aria-hidden>
      <path d="M10 2l2.4 5.2 5.6.8-4 4 .9 5.6L10 15l-4.9 2.6.9-5.6-4-4 5.6-.8z" />
    </svg>
  );
}

export function DoodleHandshake({ className = "", size = 28 }: DoodleProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 28 28" fill="none" stroke="currentColor"
      strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"
      className={className} aria-hidden>
      <path d="M2 10l5 5 3-2 4 4 3-2 5 5" />
      <path d="M7 15l3-3 4 2 3-3 4 3" />
      <path d="M2 10l4-4 4 4" />
      <path d="M18 10l4-4 4 4" />
    </svg>
  );
}

export function DoodlePaperclip({ className = "", size = 20 }: DoodleProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 20 20" fill="none" stroke="currentColor"
      strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"
      className={className} aria-hidden>
      <path d="M16 8l-7 7a3 3 0 0 1-4.2-4.2l7-7a1.5 1.5 0 0 1 2.1 2.1l-7 7a.75.75 0 0 1-1-1l7-7" />
    </svg>
  );
}

export function DoodleUpload({ className = "", size = 24 }: DoodleProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor"
      strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"
      className={className} aria-hidden>
      <path d="M12 15V3" />
      <path d="M8 7l4-4 4 4" />
      <path d="M4 17v2a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-2" />
    </svg>
  );
}

export function DoodleSparkle({ className = "", size = 20 }: DoodleProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 20 20" fill="none" stroke="currentColor"
      strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"
      className={className} aria-hidden>
      <path d="M10 2v3M10 15v3M2 10h3M15 10h3" />
      <path d="M4.2 4.2l2.1 2.1M13.7 13.7l2.1 2.1M4.2 15.8l2.1-2.1M13.7 6.3l2.1-2.1" />
      <circle cx="10" cy="10" r="2.5" />
    </svg>
  );
}

export function DoodleCheck({ className = "", size = 16 }: DoodleProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 16 16" fill="none" stroke="currentColor"
      strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"
      className={className} aria-hidden>
      <path d="M3 8l3.5 3.5L13 5" />
    </svg>
  );
}

export function DoodlePlay({ className = "", size = 16 }: DoodleProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 16 16" fill="currentColor"
      className={className} aria-hidden>
      <path d="M5 3.5l8 4.5-8 4.5V3.5z" />
    </svg>
  );
}

export function DoodlePause({ className = "", size = 16 }: DoodleProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 16 16" fill="currentColor"
      className={className} aria-hidden>
      <rect x="4" y="3" width="3" height="10" rx="1" />
      <rect x="9" y="3" width="3" height="10" rx="1" />
    </svg>
  );
}
