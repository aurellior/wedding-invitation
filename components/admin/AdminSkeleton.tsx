import React from "react";

export function DashboardOverviewSkeleton() {
  return (
    <div className="space-y-8 animate-pulse" aria-busy="true" aria-label="Memuat data dashboard...">
      {/* Hero Banner Skeleton */}
      <div className="rounded-3xl bg-[#243830]/90 p-6 sm:p-8 border border-[#C5A059]/30">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-6">
          <div className="space-y-3 flex-1">
            <div className="h-6 w-48 rounded-full bg-white/15" />
            <div className="h-9 w-80 max-w-full rounded-xl bg-white/20" />
            <div className="h-4 w-96 max-w-full rounded-lg bg-white/10" />
          </div>
          <div className="flex items-center gap-3">
            <div className="h-10 w-40 rounded-xl bg-white/10" />
            <div className="h-10 w-44 rounded-xl bg-[#C5A059]/40" />
          </div>
        </div>
      </div>

      {/* 4 Key Metric Cards Skeleton */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-5">
        {Array.from({ length: 4 }).map((_, i) => (
          <div
            key={i}
            className="bg-white rounded-2xl p-6 border border-[#E5D1A7]/60 shadow-xs space-y-4"
          >
            <div className="flex items-start justify-between">
              <div className="space-y-2.5">
                <div className="h-3.5 w-24 rounded bg-[#243830]/10" />
                <div className="h-8 w-16 rounded-lg bg-[#243830]/15" />
              </div>
              <div className="w-11 h-11 rounded-2xl bg-[#243830]/10" />
            </div>
            <div className="pt-3.5 border-t border-[#FAF7F2] flex items-center justify-between">
              <div className="h-3 w-24 rounded bg-[#243830]/10" />
              <div className="h-3 w-16 rounded bg-[#243830]/15" />
            </div>
          </div>
        ))}
      </div>

      {/* Progress & Quick Actions Skeleton */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 bg-white rounded-2xl p-6 border border-[#E5D1A7]/60 shadow-xs space-y-4">
          <div className="flex items-center justify-between">
            <div className="space-y-2">
              <div className="h-5 w-64 rounded bg-[#243830]/15" />
              <div className="h-3.5 w-80 max-w-full rounded bg-[#243830]/10" />
            </div>
            <div className="h-6 w-12 rounded bg-[#243830]/15" />
          </div>
          <div className="h-3 w-full rounded-full bg-[#FAF7F2]" />
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-2">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="p-3 rounded-xl bg-[#FAF7F2] space-y-2">
                <div className="h-3 w-20 rounded bg-[#243830]/10" />
                <div className="h-5 w-16 rounded bg-[#243830]/15" />
              </div>
            ))}
          </div>
        </div>

        <div className="bg-white rounded-2xl p-6 border border-[#E5D1A7]/60 shadow-xs space-y-4">
          <div className="space-y-2">
            <div className="h-5 w-44 rounded bg-[#243830]/15" />
            <div className="h-3.5 w-56 rounded bg-[#243830]/10" />
          </div>
          <div className="space-y-2.5 pt-2">
            <div className="h-16 w-full rounded-xl bg-[#FAF7F2]" />
            <div className="h-16 w-full rounded-xl bg-[#FAF7F2]" />
          </div>
        </div>
      </div>

      {/* Bottom Two Columns Skeleton */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {Array.from({ length: 2 }).map((_, colIdx) => (
          <div
            key={colIdx}
            className="bg-white rounded-2xl border border-[#E5D1A7]/60 shadow-xs overflow-hidden"
          >
            <div className="px-6 py-4 border-b border-[#FAF7F2] flex items-center justify-between">
              <div className="space-y-1.5">
                <div className="h-5 w-48 rounded bg-[#243830]/15" />
                <div className="h-3 w-36 rounded bg-[#243830]/10" />
              </div>
              <div className="h-4 w-20 rounded bg-[#243830]/10" />
            </div>
            <div className="divide-y divide-[#FAF7F2]">
              {Array.from({ length: 4 }).map((_, rowIdx) => (
                <div key={rowIdx} className="px-6 py-4 space-y-2">
                  <div className="flex items-center justify-between">
                    <div className="h-4 w-40 rounded bg-[#243830]/15" />
                    <div className="h-5 w-16 rounded-full bg-[#243830]/10" />
                  </div>
                  <div className="h-3 w-64 max-w-full rounded bg-[#243830]/10" />
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

export function AdminTablePageSkeleton() {
  return (
    <div className="space-y-6 animate-pulse" aria-busy="true" aria-label="Memuat data halaman...">
      {/* Page Header Skeleton */}
      <div className="bg-white rounded-3xl p-6 sm:p-7 border border-[#E5D1A7]/60 shadow-xs flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="space-y-2.5">
          <div className="h-5 w-36 rounded-full bg-[#243830]/10" />
          <div className="h-8 w-72 max-w-full rounded-xl bg-[#243830]/15" />
          <div className="h-3.5 w-96 max-w-full rounded bg-[#243830]/10" />
        </div>
        <div className="h-11 w-44 rounded-xl bg-[#243830]/20" />
      </div>

      {/* Summary Counters Skeleton */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <div
            key={i}
            className="bg-white rounded-2xl p-4 border border-[#E5D1A7]/50 space-y-2"
          >
            <div className="h-3 w-24 rounded bg-[#243830]/10" />
            <div className="h-7 w-14 rounded-lg bg-[#243830]/15" />
          </div>
        ))}
      </div>

      {/* Filter Bar & Table Skeleton */}
      <div className="bg-white rounded-3xl border border-[#E5D1A7]/60 shadow-xs overflow-hidden">
        <div className="p-5 border-b border-[#FAF7F2] flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="h-10 w-full md:w-80 rounded-xl bg-[#FAF7F2]" />
          <div className="flex items-center gap-2 overflow-x-auto">
            {Array.from({ length: 5 }).map((_, i) => (
              <div key={i} className="h-8 w-20 shrink-0 rounded-full bg-[#FAF7F2]" />
            ))}
          </div>
        </div>

        <div className="divide-y divide-[#FAF7F2]">
          {Array.from({ length: 6 }).map((_, rowIdx) => (
            <div
              key={rowIdx}
              className="px-6 py-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4"
            >
              <div className="space-y-2 flex-1">
                <div className="flex items-center gap-2.5">
                  <div className="h-4 w-44 rounded bg-[#243830]/15" />
                  <div className="h-5 w-16 rounded-full bg-[#C5A059]/20" />
                </div>
                <div className="h-3 w-32 rounded bg-[#243830]/10" />
              </div>
              <div className="flex items-center gap-2">
                <div className="h-9 w-28 rounded-xl bg-emerald-600/15" />
                <div className="h-9 w-9 rounded-xl bg-[#FAF7F2]" />
                <div className="h-9 w-9 rounded-xl bg-[#FAF7F2]" />
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
