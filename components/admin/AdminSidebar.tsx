"use client";

import React, { createContext, useContext, useEffect, useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  LayoutDashboard,
  Users,
  CheckCircle2,
  MessageSquareHeart,
  FileEdit,
  ExternalLink,
  LogOut,
  Menu,
  X,
  Sparkles,
  ShieldCheck,
  Loader2,
} from "lucide-react";
import {
  DEFAULT_WEDDING_CONFIG,
  type WeddingContentConfig,
} from "@/lib/config/wedding-config";
import {
  AdminContentPageSkeleton,
  AdminTablePageSkeleton,
  DashboardOverviewSkeleton,
} from "@/components/admin/AdminSkeleton";

interface NavItem {
  label: string;
  subtitle: string;
  href: string;
  icon: React.ComponentType<{ className?: string }>;
}

const NAV_ITEMS: NavItem[] = [
  {
    label: "Dashboard",
    subtitle: "Ringkasan & Metrik",
    href: "/admin",
    icon: LayoutDashboard,
  },
  {
    label: "Konten Undangan",
    subtitle: "Mempelai, Acara & Rekening",
    href: "/admin/content",
    icon: FileEdit,
  },
  {
    label: "Guests",
    subtitle: "Daftar Tamu & Kirim WA",
    href: "/admin/guests",
    icon: Users,
  },
  {
    label: "RSVP",
    subtitle: "Konfirmasi & Kuota Pax",
    href: "/admin/rsvp",
    icon: CheckCircle2,
  },
  {
    label: "Wishes",
    subtitle: "Moderasi Doa & Ucapan",
    href: "/admin/wishes",
    icon: MessageSquareHeart,
  },
];

export const AdminConfigContext = createContext<WeddingContentConfig>(
  DEFAULT_WEDDING_CONFIG
);

export function useAdminConfig(): WeddingContentConfig {
  return useContext(AdminConfigContext);
}

export default function AdminSidebar({
  children,
  config = DEFAULT_WEDDING_CONFIG,
}: {
  children: React.ReactNode;
  config?: WeddingContentConfig;
}) {
  const pathname = usePathname();
  const router = useRouter();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [loggingOut, setLoggingOut] = useState(false);

  // Navigation progress & instant skeleton transition state
  const [pendingPath, setPendingPath] = useState<string | null>(null);
  const [progress, setProgress] = useState<number>(0);
  const [showTopBar, setShowTopBar] = useState<boolean>(false);

  // Prefetch all admin routes on mount for snappy transitions
  useEffect(() => {
    NAV_ITEMS.forEach((item) => {
      router.prefetch(item.href);
    });
  }, [router]);

  // Complete top progress bar when pathname updates
  useEffect(() => {
    if (pendingPath) {
      setProgress(100);
      const timer = setTimeout(() => {
        setShowTopBar(false);
        setPendingPath(null);
        setProgress(0);
      }, 220);
      return () => clearTimeout(timer);
    }
  }, [pathname, pendingPath]);

  // Animate progress while navigation is in-flight
  useEffect(() => {
    if (!pendingPath || pendingPath === pathname) return;

    setShowTopBar(true);
    setProgress(28);

    const t1 = setTimeout(() => setProgress(58), 120);
    const t2 = setTimeout(() => setProgress(82), 320);
    const t3 = setTimeout(() => setProgress(92), 700);

    return () => {
      clearTimeout(t1);
      clearTimeout(t2);
      clearTimeout(t3);
    };
  }, [pendingPath, pathname]);

  // Intercept internal /admin link clicks inside main content to trigger top bar & skeleton
  const handleContentClick = (e: React.MouseEvent<HTMLDivElement>) => {
    const anchor = (e.target as HTMLElement).closest("a");
    if (!anchor) return;
    const href = anchor.getAttribute("href");
    const target = anchor.getAttribute("target");
    if (
      href &&
      href.startsWith("/admin") &&
      target !== "_blank" &&
      href !== pathname
    ) {
      setPendingPath(href);
    }
  };

  // Render login page without the back-office sidebar chrome
  if (pathname === "/admin/login") {
    return (
      <AdminConfigContext.Provider value={config}>
        {children}
      </AdminConfigContext.Provider>
    );
  }

  const activeOrPendingPath = pendingPath ?? pathname;

  const isActive = (href: string) => {
    if (href === "/admin") {
      return activeOrPendingPath === "/admin";
    }
    return activeOrPendingPath.startsWith(href);
  };

  const handleNavClick = (href: string) => {
    setMobileOpen(false);
    if (href !== pathname) {
      setPendingPath(href);
    }
  };

  const handleLogout = async () => {
    try {
      setLoggingOut(true);
      setPendingPath("/admin/login");
      await fetch("/api/admin/auth", { method: "DELETE" });
      router.push("/admin/login");
      router.refresh();
    } catch {
      router.push("/admin/login");
    } finally {
      setLoggingOut(false);
    }
  };

  const isNavigating = Boolean(pendingPath && pendingPath !== pathname);

  return (
    <div className="min-h-screen bg-[#FAF7F2] text-[#222624] flex flex-col lg:flex-row relative">
      {/* Top Loading Progress Bar */}
      {showTopBar && (
        <div
          role="progressbar"
          aria-valuemin={0}
          aria-valuemax={100}
          aria-valuenow={progress}
          className="fixed top-0 left-0 right-0 z-[100] h-1 bg-[#243830]/15 overflow-hidden pointer-events-none"
        >
          <div
            className="h-full bg-gradient-to-r from-[#C5A059] via-[#E5D1A7] to-[#C5A059] shadow-[0_0_12px_#C5A059] transition-all duration-200 ease-out"
            style={{ width: `${progress}%` }}
          />
        </div>
      )}

      {/* Mobile Header Bar */}
      <header className="lg:hidden sticky top-0 z-30 flex items-center justify-between bg-[#243830] text-[#FAF7F2] px-4 py-3.5 shadow-md">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-[#C5A059]/20 border border-[#C5A059]/40 flex items-center justify-center text-[#E5D1A7] font-serif-luxury font-semibold">
            {config.couple.groom.nickname[0]}&amp;
            {config.couple.bride.nickname[0]}
          </div>
          <div>
            <p className="font-serif-luxury text-base font-semibold tracking-wide text-[#FAF7F2] leading-tight">
              {config.couple.groom.nickname} &amp;{" "}
              {config.couple.bride.nickname} — Back-Office
            </p>
            <p className="text-[11px] text-[#E5D1A7]/80">
              Wedding Organizer Suite
            </p>
          </div>
        </div>

        <button
          type="button"
          onClick={() => setMobileOpen(!mobileOpen)}
          aria-label="Toggle Menu"
          className="p-2 rounded-lg text-[#FAF7F2] hover:bg-white/10 transition-colors"
        >
          {mobileOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
        </button>
      </header>

      {/* Mobile Drawer Overlay */}
      {mobileOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/50 backdrop-blur-xs lg:hidden"
          onClick={() => setMobileOpen(false)}
        />
      )}

      {/* Sidebar Navigation */}
      <aside
        className={`fixed inset-y-0 left-0 z-50 w-72 h-screen overflow-y-auto bg-[#243830] text-[#FAF7F2] flex flex-col justify-between transition-transform duration-300 ease-in-out lg:sticky lg:top-0 lg:h-screen lg:shrink-0 lg:translate-x-0 ${
          mobileOpen ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        {/* Top Brand Section */}
        <div>
          <div className="p-6 border-b border-white/10">
            <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-[#C5A059]/20 border border-[#C5A059]/30 text-[#E5D1A7] text-[11px] font-medium tracking-wider uppercase mb-3">
              <Sparkles className="w-3 h-3" />
              Wedding Back-Office
            </div>
            <h1 className="font-serif-luxury text-2xl font-semibold text-white tracking-wide">
              {config.couple.groom.nickname} &amp;{" "}
              {config.couple.bride.nickname}
            </h1>
            <p className="text-xs text-[#E5D1A7]/80 mt-1">
              {config.couple.weddingDateDisplay}
            </p>
          </div>

          {/* Navigation Links */}
          <nav className="p-4 space-y-1.5">
            <p className="px-3 py-1.5 text-[11px] font-semibold uppercase tracking-wider text-white/40">
              Menu Manajemen
            </p>
            {NAV_ITEMS.map((item) => {
              const Icon = item.icon;
              const active = isActive(item.href);
              const isItemLoading = pendingPath === item.href && pathname !== item.href;

              return (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={() => handleNavClick(item.href)}
                  className={`group flex items-center gap-3.5 px-3.5 py-3 rounded-xl transition-all duration-200 ${
                    active
                      ? "bg-[#C5A059] text-[#243830] shadow-md font-semibold"
                      : "text-[#FAF7F2]/80 hover:bg-white/10 hover:text-white"
                  }`}
                >
                  <div
                    className={`p-2 rounded-lg transition-colors ${
                      active
                        ? "bg-[#243830]/15 text-[#243830]"
                        : "bg-white/5 text-[#E5D1A7] group-hover:bg-white/10"
                    }`}
                  >
                    {isItemLoading ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      <Icon className="w-4 h-4" />
                    )}
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-sm leading-tight truncate">
                      {item.label}
                    </p>
                    <p
                      className={`text-[11px] truncate mt-0.5 ${
                        active ? "text-[#243830]/80" : "text-white/50"
                      }`}
                    >
                      {item.subtitle}
                    </p>
                  </div>
                </Link>
              );
            })}
          </nav>
        </div>

        {/* Bottom Actions */}
        <div className="p-4 border-t border-white/10 space-y-2.5">
          <div className="px-3.5 py-3 rounded-xl bg-white/5 border border-white/10">
            <div className="flex items-center gap-2 text-xs text-[#E5D1A7] font-medium">
              <ShieldCheck className="w-4 h-4 shrink-0" />
              <span>Sesi Admin Aktif</span>
            </div>
            <p className="text-[11px] text-white/60 mt-1 leading-relaxed">
              Kelola daftar tamu, kuota RSVP, dan pengiriman WhatsApp.
            </p>
          </div>

          <Link
            href="/"
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center justify-center gap-2 w-full px-4 py-2.5 rounded-xl bg-white/10 hover:bg-white/15 text-[#FAF7F2] text-xs font-medium transition-colors border border-white/10"
          >
            <ExternalLink className="w-3.5 h-3.5 text-[#E5D1A7]" />
            Lihat Live Undangan
          </Link>

          <button
            type="button"
            onClick={handleLogout}
            disabled={loggingOut}
            className="flex items-center justify-center gap-2 w-full px-4 py-2.5 rounded-xl bg-rose-500/15 hover:bg-rose-500/25 text-rose-200 text-xs font-medium transition-colors border border-rose-400/20 disabled:opacity-50 cursor-pointer"
          >
            <LogOut className="w-3.5 h-3.5" />
            {loggingOut ? "Keluar..." : "Keluar Sesi Admin"}
          </button>
        </div>
      </aside>

      {/* Main Content Area */}
      <div
        className="flex-1 flex flex-col min-w-0"
        onClick={handleContentClick}
      >
        {/* Desktop Top Header */}
        <header className="hidden lg:flex items-center justify-between px-8 py-4 bg-white/80 backdrop-blur-md border-b border-[#E5D1A7]/40 sticky top-0 z-20">
          <div>
            <p className="text-xs uppercase tracking-widest text-[#4A6358] font-semibold">
              {config.couple.groom.nickname} &amp;{" "}
              {config.couple.bride.nickname} — Back-Office
            </p>
            <p className="text-xs text-[#222624]/60 mt-0.5">
              Manajemen Konten, Tamu, Konfirmasi Kehadiran (RSVP), dan Moderasi Ucapan
            </p>
          </div>

          <div className="flex items-center gap-3">
            <Link
              href="/?to=Bapak%2FIbu%20Tamu%20Kehormatan"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 px-3.5 py-2 rounded-xl border border-[#C5A059]/50 bg-[#FAF7F2] hover:bg-[#F2ECE1] text-[#243830] text-xs font-medium transition-colors"
            >
              <ExternalLink className="w-3.5 h-3.5 text-[#C5A059]" />
              Preview Undangan Tamu
            </Link>
          </div>
        </header>

        <main className="flex-1 p-4 sm:p-6 lg:p-8 max-w-7xl w-full mx-auto">
          {isNavigating ? (
            pendingPath === "/admin" ? (
              <DashboardOverviewSkeleton />
            ) : pendingPath === "/admin/content" ? (
              <AdminContentPageSkeleton />
            ) : (
              <AdminTablePageSkeleton />
            )
          ) : (
            children
          )}
        </main>
      </div>
    </div>
  );
}
