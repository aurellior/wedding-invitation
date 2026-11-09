import React from "react";

export function DashboardOverviewSkeleton() {
  return (
    <div
      className="space-y-6 animate-pulse"
      aria-busy="true"
      aria-label="Memuat data ringkasan..."
    >
      {/* Header Ledger Skeleton */}
      <div className="rounded-sm border border-[#C5A059]/40 bg-[#1C2B24] p-6 sm:p-8">
        <div className="flex flex-col gap-6 md:flex-row md:items-end md:justify-between">
          <div className="flex-1 space-y-2.5">
            <div className="h-3.5 w-48 rounded-sm bg-white/15" />
            <div className="h-8 w-80 max-w-full rounded-sm bg-white/20" />
            <div className="h-3.5 w-96 max-w-full rounded-sm bg-white/10" />
          </div>
          <div className="flex items-center gap-3">
            <div className="h-11 w-40 rounded-sm bg-white/10" />
            <div className="h-11 w-44 rounded-sm bg-[#C5A059]/45" />
          </div>
        </div>
      </div>

      {/* Progress & Quick Actions Skeleton */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-12">
        <div className="space-y-4 rounded-sm border border-[#C5A059]/40 bg-white p-6 lg:col-span-8">
          <div className="flex items-center justify-between">
            <div className="space-y-2">
              <div className="h-5 w-64 rounded-sm bg-[#243830]/15" />
              <div className="h-3.5 w-80 max-w-full rounded-sm bg-[#243830]/10" />
            </div>
            <div className="h-7 w-14 rounded-sm bg-[#243830]/15" />
          </div>
          <div className="h-2.5 w-full rounded-sm bg-[#FAF7F2]" />
          <div className="grid grid-cols-2 gap-3 pt-2 sm:grid-cols-4">
            {Array.from({ length: 4 }).map((_, i) => (
              <div
                key={i}
                className="space-y-2 rounded-sm border border-[#F2ECE1] bg-[#FAF7F2] p-3.5"
              >
                <div className="h-3 w-20 rounded-sm bg-[#243830]/10" />
                <div className="h-5 w-16 rounded-sm bg-[#243830]/15" />
              </div>
            ))}
          </div>
        </div>

        <div className="space-y-4 rounded-sm border border-[#C5A059]/40 bg-white p-6 lg:col-span-4">
          <div className="space-y-2">
            <div className="h-5 w-44 rounded-sm bg-[#243830]/15" />
            <div className="h-3.5 w-56 rounded-sm bg-[#243830]/10" />
          </div>
          <div className="space-y-2.5 pt-2">
            <div className="h-14 w-full rounded-sm bg-[#FAF7F2]" />
            <div className="h-14 w-full rounded-sm bg-[#FAF7F2]" />
          </div>
        </div>
      </div>

      {/* 4 Key Metric Cards Skeleton */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <div
            key={i}
            className="space-y-4 rounded-sm border border-[#C5A059]/35 bg-white p-5"
          >
            <div className="flex items-start justify-between">
              <div className="space-y-2.5">
                <div className="h-3.5 w-28 rounded-sm bg-[#243830]/10" />
                <div className="h-8 w-16 rounded-sm bg-[#243830]/15" />
              </div>
              <div className="h-10 w-10 rounded-sm bg-[#243830]/10" />
            </div>
            <div className="flex items-center justify-between border-t border-[#F2ECE1] pt-3">
              <div className="h-3 w-24 rounded-sm bg-[#243830]/10" />
              <div className="h-3 w-16 rounded-sm bg-[#243830]/15" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

export function AdminTablePageSkeleton() {
  return (
    <div
      className="space-y-6 animate-pulse"
      aria-busy="true"
      aria-label="Memuat data halaman..."
    >
      {/* Page Header Skeleton */}
      <div className="flex flex-col gap-4 rounded-sm border border-[#C5A059]/40 bg-white p-6 sm:flex-row sm:items-center sm:justify-between">
        <div className="space-y-2">
          <div className="h-3.5 w-40 rounded-sm bg-[#243830]/10" />
          <div className="h-7 w-72 max-w-full rounded-sm bg-[#243830]/15" />
          <div className="h-3.5 w-96 max-w-full rounded-sm bg-[#243830]/10" />
        </div>
        <div className="h-11 w-44 rounded-sm bg-[#243830]/20" />
      </div>

      {/* Filter Bar & Table Skeleton */}
      <div className="overflow-hidden rounded-sm border border-[#C5A059]/40 bg-white">
        <div className="flex flex-col justify-between gap-4 border-b border-[#F2ECE1] p-5 md:flex-row md:items-center">
          <div className="flex items-center gap-2 overflow-x-auto">
            {Array.from({ length: 5 }).map((_, i) => (
              <div
                key={i}
                className="h-9 w-20 shrink-0 rounded-sm bg-[#FAF7F2]"
              />
            ))}
          </div>
          <div className="h-10 w-full rounded-sm bg-[#FAF7F2] md:w-80" />
        </div>

        <div className="divide-y divide-[#F2ECE1]">
          {Array.from({ length: 6 }).map((_, rowIdx) => (
            <div
              key={rowIdx}
              className="flex flex-col justify-between gap-4 px-6 py-4 sm:flex-row sm:items-center"
            >
              <div className="flex-1 space-y-2">
                <div className="flex items-center gap-2.5">
                  <div className="h-4 w-44 rounded-sm bg-[#243830]/15" />
                  <div className="h-5 w-16 rounded-sm bg-[#C5A059]/20" />
                </div>
                <div className="h-3 w-32 rounded-sm bg-[#243830]/10" />
              </div>
              <div className="flex items-center gap-2">
                <div className="h-9 w-28 rounded-sm bg-emerald-600/15" />
                <div className="h-9 w-9 rounded-sm bg-[#FAF7F2]" />
                <div className="h-9 w-9 rounded-sm bg-[#FAF7F2]" />
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
