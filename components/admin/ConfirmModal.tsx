"use client";

import React, { useEffect } from "react";
import { AlertTriangle, Trash2, X, Loader2, Info } from "lucide-react";

export interface ConfirmModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void | Promise<void>;
  title: string;
  description: React.ReactNode;
  confirmText?: string;
  cancelText?: string;
  variant?: "danger" | "warning" | "info";
  isLoading?: boolean;
}

export function ConfirmModal({
  isOpen,
  onClose,
  onConfirm,
  title,
  description,
  confirmText = "Hapus",
  cancelText = "Batal",
  variant = "danger",
  isLoading = false,
}: ConfirmModalProps) {
  // Close on Escape key press
  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape" && !isLoading) {
        onClose();
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, isLoading, onClose]);

  if (!isOpen) return null;

  const iconVariants = {
    danger: (
      <div className="w-12 h-12 rounded-2xl bg-rose-100 ring-8 ring-rose-50 flex items-center justify-center text-rose-600 shrink-0">
        <Trash2 className="w-6 h-6" />
      </div>
    ),
    warning: (
      <div className="w-12 h-12 rounded-2xl bg-amber-100 ring-8 ring-amber-50 flex items-center justify-center text-amber-600 shrink-0">
        <AlertTriangle className="w-6 h-6" />
      </div>
    ),
    info: (
      <div className="w-12 h-12 rounded-2xl bg-[#E5D1A7]/30 ring-8 ring-[#FAF7F2] flex items-center justify-center text-[#243830] shrink-0">
        <Info className="w-6 h-6" />
      </div>
    ),
  };

  const confirmBtnStyles = {
    danger:
      "bg-rose-600 hover:bg-rose-700 active:bg-rose-800 text-white shadow-rose-200/50",
    warning:
      "bg-amber-600 hover:bg-amber-700 active:bg-amber-800 text-white shadow-amber-200/50",
    info:
      "bg-[#243830] hover:bg-[#1b2b25] active:bg-[#14201b] text-[#FAF7F2] shadow-emerald-950/20",
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs transition-opacity duration-200"
      onClick={(e) => {
        if (e.target === e.currentTarget && !isLoading) {
          onClose();
        }
      }}
    >
      <div className="bg-white rounded-3xl border border-[#E5D1A7]/80 shadow-2xl w-full max-w-md overflow-hidden animate-in fade-in zoom-in-95 duration-200">
        {/* Top Header Row with Close button */}
        <div className="p-6 pb-0 flex items-start justify-between gap-4">
          {iconVariants[variant]}
          <button
            type="button"
            onClick={onClose}
            disabled={isLoading}
            className="p-1.5 rounded-xl text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed shrink-0"
            aria-label="Tutup modal"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-2">
          <h3 className="font-serif-luxury text-xl font-bold text-[#243830]">
            {title}
          </h3>
          <div className="text-sm text-slate-600 leading-relaxed">
            {description}
          </div>
        </div>

        {/* Action Buttons Footer */}
        <div className="px-6 py-4 bg-slate-50/80 border-t border-slate-100 flex items-center justify-end gap-3">
          <button
            type="button"
            onClick={onClose}
            disabled={isLoading}
            className="px-4 py-2.5 rounded-xl border border-slate-200 bg-white text-slate-700 text-sm font-semibold hover:bg-slate-50 hover:border-slate-300 transition-colors cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {cancelText}
          </button>
          <button
            type="button"
            onClick={onConfirm}
            disabled={isLoading}
            className={`px-5 py-2.5 rounded-xl text-sm font-semibold shadow-md transition-all flex items-center gap-2 cursor-pointer disabled:opacity-60 disabled:cursor-not-allowed ${confirmBtnStyles[variant]}`}
          >
            {isLoading && <Loader2 className="w-4 h-4 animate-spin shrink-0" />}
            <span>{confirmText}</span>
          </button>
        </div>
      </div>
    </div>
  );
}

