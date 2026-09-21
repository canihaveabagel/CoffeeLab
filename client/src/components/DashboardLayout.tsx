import { useAuth } from "@/_core/hooks/useAuth";
import { getLoginUrl } from "@/const";
import { DoodleCoffeeCup } from "@/components/DoodleIcons";
import { useLang } from "@/contexts/LanguageContext";
import type { TranslationKey } from "@/contexts/LanguageContext";
import {
  BarChart2,
  BookOpen,
  Coffee,
  Download,
  GripVertical,
  Mail,
  Settings,
  Users,
} from "lucide-react";
import { Link, useLocation } from "wouter";
import { useState, useRef, useCallback, useEffect } from "react";

type NavItem = {
  href: string;
  label: string;
  icon: React.ComponentType<{ size?: number; className?: string }>;
};

const NAV_TRANSLATION_KEYS: Record<string, TranslationKey> = {
  "/": "nav_dashboard",
  "/contacts": "nav_contacts",
  "/import": "nav_import",
  "/coffee-chat": "nav_coffee_chat",
  "/outreach": "nav_outreach",
  "/notebook": "nav_notebook",
  "/recommendations": "nav_recommendations",
  "/settings": "nav_settings",
};

const DEFAULT_NAV_ITEMS: NavItem[] = [
  { href: "/",               label: "Dashboard",       icon: BarChart2 },
  { href: "/contacts",       label: "Contacts",        icon: Users },
  { href: "/import",         label: "Import",          icon: Download },
  { href: "/coffee-chat",    label: "Coffee Chats",    icon: Coffee },
  { href: "/outreach",       label: "Outreach",        icon: Mail },
  { href: "/notebook",       label: "Notebook",        icon: BookOpen },
  { href: "/settings",       label: "Settings",        icon: Settings },
];

const NAV_ORDER_KEY = "coffeelab_nav_order";

function loadNavOrder(): string[] | null {
  try {
    const stored = localStorage.getItem(NAV_ORDER_KEY);
    if (!stored) return null;
    const order = JSON.parse(stored) as string[];
    // Validate all hrefs still exist
    if (order.length !== DEFAULT_NAV_ITEMS.length) return null;
    if (!DEFAULT_NAV_ITEMS.every(item => order.includes(item.href))) return null;
    return order;
  } catch {
    return null;
  }
}

function saveNavOrder(order: string[]) {
  try {
    localStorage.setItem(NAV_ORDER_KEY, JSON.stringify(order));
  } catch {}
}

function getOrderedNavItems(): NavItem[] {
  const order = loadNavOrder();
  if (!order) return DEFAULT_NAV_ITEMS;
  return order.map(href => DEFAULT_NAV_ITEMS.find(item => item.href === href)!).filter(Boolean);
}

interface DashboardLayoutProps {
  children: React.ReactNode;
}

export default function DashboardLayout({ children }: DashboardLayoutProps) {
  const { user, loading, isAuthenticated, logout } = useAuth();
  const { t } = useLang();
  const [location] = useLocation();
  const [navItems, setNavItems] = useState<NavItem[]>(getOrderedNavItems);
  const [dragIndex, setDragIndex] = useState<number | null>(null);
  const [dragOverIndex, setDragOverIndex] = useState<number | null>(null);
  const dragItem = useRef<number | null>(null);

  const handleDragStart = useCallback((index: number) => {
    dragItem.current = index;
    setDragIndex(index);
  }, []);

  const handleDragEnter = useCallback((index: number) => {
    setDragOverIndex(index);
  }, []);

  const handleDragEnd = useCallback(() => {
    if (dragItem.current !== null && dragOverIndex !== null && dragItem.current !== dragOverIndex) {
      const newItems = [...navItems];
      const [removed] = newItems.splice(dragItem.current, 1);
      newItems.splice(dragOverIndex, 0, removed);
      setNavItems(newItems);
      saveNavOrder(newItems.map(i => i.href));
    }
    dragItem.current = null;
    setDragIndex(null);
    setDragOverIndex(null);
  }, [navItems, dragOverIndex]);

  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center paper-bg">
        <div className="text-center space-y-3">
          <DoodleCoffeeCup size={40} className="text-[var(--color-ink-muted)] mx-auto" />
          <p className="text-sm text-[var(--color-ink-muted)] font-mono">Loading workspace…</p>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return (
      <div className="flex h-screen items-center justify-center paper-bg">
        <div className="sketch-card p-10 max-w-sm w-full mx-4 text-center space-y-6">
          <div className="flex items-center justify-center gap-2">
            <DoodleCoffeeCup size={28} className="text-[var(--color-ink)]" />
            <span className="text-xl font-semibold tracking-tight">CoffeeLab</span>
          </div>
          <p className="text-sm text-[var(--color-ink-muted)] leading-relaxed">
            Turn every coffee chat into real learnings.
          </p>
          <a href={getLoginUrl()} className="sketch-btn sketch-btn-primary w-full justify-center">
            Sign in to workspace
          </a>
        </div>
      </div>
    );
  }

  const initials = user?.name
    ? user.name.split(" ").map((n: string) => n[0]).join("").slice(0, 2).toUpperCase()
    : "?";

  return (
    <div className="flex h-screen overflow-hidden paper-bg">
      {/* ── Sidebar ── */}
      <aside className="sidebar w-56 flex-shrink-0 flex flex-col">
        {/* Logo */}
        <div className="px-4 py-4 border-b border-[var(--color-border-dark)]">
          <Link href="/" className="flex items-center gap-2 group">
            <DoodleCoffeeCup size={22} className="text-[var(--color-ink)] group-hover:opacity-70 transition-opacity" />
            <span className="text-sm font-semibold tracking-tight text-[var(--color-ink)]">
              CoffeeLab
            </span>
          </Link>
          <p className="text-[10px] text-[var(--color-ink-faint)] mt-0.5 font-mono ml-7">
            {t("nav_tagline")}
          </p>
        </div>

        {/* Navigation */}
        <nav className="flex-1 overflow-y-auto py-2">
          <div className="px-3 py-1.5">
            <p className="text-[10px] font-mono font-semibold uppercase tracking-widest text-[var(--color-ink-faint)] px-2 mb-1">
              {t("nav_workspace")}
            </p>
          </div>
          {navItems.map(({ href, label, icon: Icon }, index) => {
            const isActive = location === href || (href !== "/" && href !== "/dashboard" && location.startsWith(href));
            const isDragging = dragIndex === index;
            const isDragOver = dragOverIndex === index && dragIndex !== index;
            return (
              <div
                key={href}
                draggable
                onDragStart={() => handleDragStart(index)}
                onDragEnter={() => handleDragEnter(index)}
                onDragEnd={handleDragEnd}
                onDragOver={(e) => e.preventDefault()}
                className={`group relative transition-all ${isDragging ? "opacity-40" : ""} ${isDragOver ? "border-t-2 border-[var(--color-ink)]" : ""}`}
              >
                <Link href={href}>
                  <span className={`sidebar-item ${isActive ? "active" : ""} pr-2`}>
                    <span
                      className="opacity-0 group-hover:opacity-40 cursor-grab active:cursor-grabbing flex-shrink-0 -ml-1 mr-0.5"
                      onMouseDown={(e) => e.stopPropagation()}
                    >
                      <GripVertical size={12} className="text-[var(--color-ink-faint)]" />
                    </span>
                    <Icon size={14} className="flex-shrink-0 opacity-70" />
                    <span>{t(NAV_TRANSLATION_KEYS[href] ?? "nav_dashboard")}</span>
                  </span>
                </Link>
              </div>
            );
          })}
        </nav>

        {/* Footer */}
        <div className="border-t border-[var(--color-border-dark)] p-3">
          {/* User */}
          <div className="flex items-center gap-2 px-2 py-1">
            <div className="w-6 h-6 rounded-full bg-[var(--color-border-dark)] border border-[var(--color-border-dark)] flex items-center justify-center text-[10px] font-mono font-bold text-[var(--color-ink-muted)] flex-shrink-0">
              {initials}
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-xs font-medium text-[var(--color-ink)] truncate">{user?.name ?? "User"}</p>
              <p className="text-[10px] text-[var(--color-ink-faint)] truncate">{user?.email ?? ""}</p>
            </div>
            <button
              onClick={() => logout()}
              className="text-[10px] text-[var(--color-ink-faint)] hover:text-[var(--color-ink)] transition-colors font-mono"
              title="Sign out"
            >
              {t("nav_sign_out")}
            </button>
          </div>
        </div>
      </aside>

      {/* ── Main content ── */}
      <main className="flex-1 overflow-y-auto">
        {children}
      </main>
    </div>
  );
}
