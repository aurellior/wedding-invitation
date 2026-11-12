"use client";

import React, { useState } from "react";
import { motion } from "framer-motion";
import { Check, Copy, CreditCard, Sparkles } from "lucide-react";
import {
  DEFAULT_WEDDING_CONFIG,
  type BankAccount,
  type WeddingContentConfig,
} from "@/lib/config/wedding-config";

export default function GiftSection({
  config = DEFAULT_WEDDING_CONFIG,
}: {
  config?: WeddingContentConfig;
}) {
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const handleCopy = async (id: string, textToCopy: string) => {
    try {
      await navigator.clipboard.writeText(textToCopy);
      setCopiedId(id);
      setTimeout(() => {
        setCopiedId((prev) => (prev === id ? null : prev));
      }, 2500);
    } catch {
      // Fallback textarea copy
      const textarea = document.createElement("textarea");
      textarea.value = textToCopy;
      document.body.appendChild(textarea);
      textarea.select();
      document.execCommand("copy");
      document.body.removeChild(textarea);
      setCopiedId(id);
      setTimeout(() => {
        setCopiedId((prev) => (prev === id ? null : prev));
      }, 2500);
    }
  };

  return (
    <section id="hadiah" className="relative py-20 px-4 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-5xl">
        {/* Heading */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.7 }}
          className="text-center"
        >
          <span className="inline-flex items-center gap-2 rounded-full border border-[#C5A059]/40 bg-[#F2ECE1] px-4 py-1 text-[11px] font-medium uppercase tracking-[0.25em] text-[#243830]">
            <Sparkles className="h-3.5 w-3.5 text-[#C5A059]" />
            Amplop Digital &amp; Tanda Kasih
          </span>
          <h2 className="mt-4 font-serif-luxury text-4xl font-semibold text-[#1C2B24] sm:text-5xl">
            Tanda Kasih Pernikahan
          </h2>
          <p className="mx-auto mt-3 max-w-xl text-sm leading-relaxed text-[#4A6358]">
            Doa restu Anda merupakan karunia terindah bagi kami. Namun apabila
            Anda ingin memberikan tanda kasih secara digital, Anda dapat
            menyalurkannya melalui rekening berikut:
          </p>
        </motion.div>

        {/* Bank Account Priority Cards */}
        <div className="mt-12 grid grid-cols-1 gap-6 md:grid-cols-2">
          {config.gifts.accounts.map(
            (account: BankAccount, idx: number) => {
              const isCopied = copiedId === account.id;
              return (
                <motion.div
                  key={account.id}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.6, delay: idx * 0.12 }}
                  className="relative flex flex-col justify-between overflow-hidden rounded-3xl border border-[#C5A059]/45 bg-gradient-to-br from-[#1C2B24] via-[#243830] to-[#1C2B24] p-7 text-[#FAF7F2] shadow-xl sm:p-8"
                >
                  {/* Subtle Gold Glow */}
                  <div className="pointer-events-none absolute -right-12 -top-12 h-40 w-40 rounded-full bg-[#C5A059]/15 blur-2xl" />

                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <p className="text-[11px] uppercase tracking-[0.25em] text-[#E5D1A7]/80">
                        Transfer Rekening
                      </p>
                      <h3 className="mt-1 font-serif-luxury text-2xl font-semibold text-[#FAF7F2]">
                        {account.bankName}
                      </h3>
                    </div>
                    <div className="flex h-11 w-11 items-center justify-center rounded-2xl border border-[#C5A059]/40 bg-[#FAF7F2]/10 text-[#E5D1A7]">
                      <CreditCard className="h-5 w-5" />
                    </div>
                  </div>

                  <div className="my-7">
                    <p className="text-[11px] uppercase tracking-[0.2em] text-[#FAF7F2]/65">
                      Nomor Rekening
                    </p>
                    <p className="mt-1.5 font-mono text-2xl font-semibold tracking-[0.16em] text-[#E5D1A7] sm:text-3xl">
                      {account.accountNumber}
                    </p>
                    <p className="mt-2 text-sm font-medium text-[#FAF7F2]">
                      a.n. {account.accountHolder}
                    </p>
                    {account.branch && (
                      <p className="mt-0.5 text-xs text-[#FAF7F2]/65">
                        {account.branch}
                      </p>
                    )}
                  </div>

                  <button
                    type="button"
                    onClick={() =>
                      void handleCopy(account.id, account.accountNumber)
                    }
                    className={`inline-flex w-full cursor-pointer items-center justify-center gap-2 rounded-xl border px-4 py-3 text-xs font-semibold tracking-wider transition-all ${
                      isCopied
                        ? "border-emerald-400 bg-emerald-500/20 text-emerald-200"
                        : "border-[#C5A059]/50 bg-[#FAF7F2]/10 text-[#E5D1A7] hover:bg-[#C5A059] hover:text-[#1C2B24]"
                    }`}
                  >
                    {isCopied ? (
                      <>
                        <Check className="h-4 w-4" />
                        <span>Tersalin! ({account.accountNumber})</span>
                      </>
                    ) : (
                      <>
                        <Copy className="h-4 w-4" />
                        <span>Salin Nomor Rekening</span>
                      </>
                    )}
                  </button>
                </motion.div>
              );
            }
          )}
        </div>
      </div>
    </section>
  );
}
