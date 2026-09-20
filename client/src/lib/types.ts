export type ContactStatus = "not_started" | "reached_out" | "chatted" | "following_up" | "closed";
export type EmailDraftType = "cold_outreach" | "follow_up" | "thank_you" | "referral_ask";
export type TakeawayCategory =
  | "Industry"
  | "Firm"
  | "Group"
  | "Recruiting"
  | "Technical Prep"
  | "Personal Growth"
  | "Referral Signal"
  | "Next Person To Meet";

export const STATUS_LABELS: Record<ContactStatus, string> = {
  not_started: "Not Started",
  reached_out: "Reached Out",
  chatted: "Chatted",
  following_up: "Following Up",
  closed: "Closed",
};

export const STATUS_CLASSES: Record<ContactStatus, string> = {
  not_started: "status-not-started",
  reached_out: "status-reached-out",
  chatted: "status-chatted",
  following_up: "status-following-up",
  closed: "status-closed",
};

export const EMAIL_TYPE_LABELS: Record<EmailDraftType, string> = {
  cold_outreach: "Cold Outreach",
  follow_up: "Follow-Up",
  thank_you: "Thank-You",
  referral_ask: "Referral Ask",
};

export const TAKEAWAY_CATEGORIES: TakeawayCategory[] = [
  "Industry",
  "Firm",
  "Group",
  "Recruiting",
  "Technical Prep",
  "Personal Growth",
  "Referral Signal",
  "Next Person To Meet",
];

export const BANKING_GROUPS = [
  "M&A",
  "TMT",
  "Healthcare",
  "RX / Restructuring",
  "ECM",
  "DCM",
  "LevFin",
  "Industrials",
  "Consumer & Retail",
  "Real Estate",
  "Financial Institutions",
  "Energy",
  "General Coverage",
];

export const TOP_FIRMS = [
  "Goldman Sachs",
  "Morgan Stanley",
  "JPMorgan",
  "Bank of America",
  "Citi",
  "Barclays",
  "Deutsche Bank",
  "UBS",
  "Credit Suisse",
  "Evercore",
  "Lazard",
  "Centerview",
  "PJT Partners",
  "Moelis",
  "Guggenheim",
  "Houlihan Lokey",
  "Jefferies",
  "RBC",
  "Wells Fargo",
  "Rothschild",
];

export function getScoreClass(score: number): string {
  if (score >= 60) return "score-high";
  if (score >= 30) return "score-medium";
  return "score-low";
}

export function getScoreLabel(score: number): string {
  if (score >= 60) return "Strong";
  if (score >= 30) return "Moderate";
  return "Weak";
}
