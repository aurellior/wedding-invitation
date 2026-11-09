"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  LayoutDashboard,
  FileEdit,
  Users,
  CheckCircle2,
  MessageSquareHeart,
  ExternalLink,
  LogOut,
  Menu,
  X,
  ShieldCheck,
  Loader2,
} from "lucide-react";
import {
  DEFAULT_WEDDING_CONFIG,
  type WeddingContentConfig,
} from "@/lib/config/wedding-config";
import {
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
    label: "Ringkasan",
    subtitle: "Metrik & Progres RSVP",
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
    label: "Daftar Tamu",
    subtitle: "Kuota & Pengiriman WA",
    href: "/admin/guests",
    icon: Users,
  },
  {
    label: "Rekap RSVP",
    subtitle: "Kehadiran & Ekspor CSV",
    href: "/admin/rsvp",
    icon: CheckCircle2,
  },
  {
    label: "Moderasi Doa",
    subtitle: "Buku Tamu & Ucapan",
    href: "/admin/wishes",
    icon: MessageSquareHeart,
  },
];

export default function AdminSidebar({
  config = DEFAULT_WEDDING_CONFIG,
  children,
}: {
  config?: WeddingContentConfig;
  children: React.ReactNode;
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
    return <>{children}</>;
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
  const monogram = `${config.couple.groom.nickname[0] ?? "A"}&${
    config.couple.bride.nickname[0] ?? "N"
  }`;

  return (
    <div className="relative flex min-h-screen flex-col bg-[#FAF7F2] text-[#222624] lg:flex-row">
      {/* Top Loading Progress Bar */}
      {showTopBar && (
        <div
          role="progressbar"
          aria-label="Memuat halaman admin"
          aria-valuemin={0}
          aria-valuemax={100}
          aria-valuenow={progress}
          className="pointer-events-none fixed left-0 right-0 top-0 z-[100] h-1 overflow-hidden bg-[#243830]/15"
        >
          <div
            className="h-full bg-[#C5A059] transition-all duration-200 ease-out"
            style={{ width: `${progress}%` }}
          />
        </div>
      )}

      {/* Mobile Header Bar */}
      <header className="sticky top-0 z-30 flex items-center justify-between border-b border-[#C5A059]/30 bg-[#1C2B24] px-4 py-3 text-[#FAF7F2] lg:hidden">
        <div className="flex items-center gap-2.5">
          <div className="flex h-8 w-8 items-center justify-center rounded-sm border border-[#C5A059]/45 bg-[#243830] font-serif-luxury text-sm font-semibold text-[#E5D1A7]">
            {monogram}
          </div>
          <div>
            <p className="font-serif-luxury text-base font-semibold leading-tight tracking-wide text-[#FAF7F2]">
              {config.couple.groom.nickname} &amp;{" "}
              {config.couple.bride.nickname} | Back-Office
            </p>
            <p className="text-[11px] text-[#E5D1A7]/80">
              Meja Kerja Panitia &amp; Mempelai
            </p>
          </div>
        </div>

        <button
          type="button"
          onClick={() => setMobileOpen(!mobileOpen)}
          aria-label={mobileOpen ? "Tutup menu navigasi" : "Buka menu navigasi"}
          className="flex h-11 w-11 items-center justify-center rounded-sm text-[#FAF7F2] transition-colors hover:bg-white/10"
        >
          {mobileOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
        </button>
      </header>

      {/* Mobile Drawer Overlay */}
      {mobileOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/50 lg:hidden"
          onClick={() => setMobileOpen(false)}
        />
      )}

      {/* Sidebar Navigation */}
      <aside
        aria-label="Navigasi Back-Office"
        className={`fixed inset-y-0 left-0 z-50 flex w-72 flex-col justify-between border-r border-[#C5A059]/30 bg-[#1C2B24] text-[#FAF7F2] transition-transform duration-200 ease-out lg:static lg:translate-x-0 ${
          mobileOpen ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        {/* Top Brand Section */}
        <div>
          <div className="border-b border-[#C5A059]/25 p-6">
            <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-[#C5A059]">
              Meja Kerja Pernikahan
            </p>
            <p className="mt-1.5 font-serif-luxury text-2xl font-semibold tracking-wide text-[#FAF7F2]">
              {config.couple.groom.nickname} &amp;{" "}
              {config.couple.bride.nickname}
            </p>
            <p className="mt-1 text-xs text-[#E5D1A7]/80 tabular-nums">
              {config.couple.weddingDateDisplay}
            </p>
          </div>

          {/* Navigation Links */}
          <nav className="space-y-1 p-4" aria-label="Menu Utama Admin">
            <p className="px-3 py-1.5 text-[10px] font-semibold uppercase tracking-[0.2em] text-[#FAF7F2]/45">
              Modul Operasional
            </p>
            {NAV_ITEMS.map((item) => {
              const Icon = item.icon;
              const active = isActive(item.href);
              const isItemLoading =
                pendingPath === item.href && pathname !== item.href;

              return (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={() => handleNavClick(item.href)}
                  className={`group flex min-h-11 items-center gap-3.5 rounded-sm px-3.5 py-2.5 transition-colors ${
                    active
                      ? "bg-[#C5A059] font-semibold text-[#1C2B24]"
                      : "text-[#FAF7F2]/80 hover:bg-white/10 hover:text-white"
                  }`}
                >
                  <div
                    className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-sm transition-colors ${
                      active
                        ? "bg-[#1C2B24]/15 text-[#1C2B24]"
                        : "bg-white/5 text-[#E5D1A7] group-hover:bg-white/10"
                    }`}
                  >
                    {isItemLoading ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <Icon className="h-4 w-4" />
                    )}
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm leading-tight">
                      {item.label}
                    </p>
                    <p
                      className={`mt-0.5 truncate text-[11px] ${
                        active ? "text-[#1C2B24]/80" : "text-white/55"
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
        <div className="space-y-2.5 border-t border-[#C5A059]/25 p-4">
          <div className="rounded-sm border border-[#C5A059]/25 bg-[#243830] px-3.5 py-3">
            <div className="flex items-center gap-2 text-xs font-medium text-[#E5D1A7]">
              <ShieldCheck className="h-4 w-4 shrink-0" />
              <span>Sesi Panitia Aktif</span>
            </div>
            <p className="mt-1 text-[11px] leading-relaxed text-[#FAF7F2]/65">
              Kelola konten undangan, daftar tamu, kuota kursi, dan WhatsApp.
            </p>
          </div>

          <Link
            href="/"
            target="_blank"
            rel="noopener noreferrer"
            className="flex min-h-11 w-full items-center justify-center gap-2 rounded-sm border border-[#C5A059]/35 bg-[#243830] px-4 py-2.5 text-xs font-semibold text-[#FAF7F2] transition-colors hover:bg-[#243830]/80"
          >
            <ExternalLink className="h-3.5 w-3.5 text-[#E5D1A7]" />
            <span>Buka Halaman Undangan</span>
          </Link>

          <button
            type="button"
            onClick={handleLogout}
            disabled={loggingOut}
            className="flex min-h-11 w-full items-center justify-center gap-2 rounded-sm border border-rose-400/30 bg-rose-950/40 px-4 py-2.5 text-xs font-semibold text-rose-200 transition-colors hover:bg-rose-900/50 disabled:opacity-50"
          >
            <LogOut className="h-3.5 w-3.5" />
            <span>{loggingOut ? "Keluar..." : "Keluar Sesi Admin"}</span>
          </button>
        </div>
      </aside>

      {/* Main Content Area */}
      <div
        className="flex min-w-0 flex-1 flex-col"
        onClick={handleContentClick}
      >
        {/* Desktop Top Header */}
        <header className="sticky top-0 z-20 hidden items-center justify-between border-b border-[#C5A059]/30 bg-[#FAF7F2] px-8 py-4 lg:flex">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-[#243830]">
              {config.couple.groom.nickname} &amp;{" "}
              {config.couple.bride.nickname} | Back-Office
            </p>
            <p className="mt-0.5 text-xs text-[#4A6358]">
              Manajemen Konten Undangan, Daftar Tamu, RSVP, dan Moderasi Ucapan
            </p>
          </div>

          <div className="flex items-center gap-3">
            <Link
              href="/?to=Bapak%2FIbu%20Tamu%20Kehormatan"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex min-h-10 items-center gap-2 rounded-sm border border-[#C5A059]/50 bg-[#F2ECE1] px-3.5 py-2 text-xs font-semibold text-[#243830] transition-colors hover:bg-[#E5D1A7]/40"
            >
              <ExternalLink className="h-3.5 w-3.5 text-[#8A6825]" />
              <span>Pratinjau Undangan Tamu</span>
            </Link>
          </div>
        </header>

        <main className="mx-auto w-full max-w-7xl flex-1 p-4 sm:p-6 lg:p-8">
          {isNavigating ? (
            pendingPath === "/admin" ? (
              <DashboardOverviewSkeleton />
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
