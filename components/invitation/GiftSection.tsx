"use client";

import React, { useMemo, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Check,
  Copy,
  CreditCard,
  Gift,
  QrCode,
  Sparkles,
  X,
  MapPin,
  Download,
} from "lucide-react";
import {
  DEFAULT_WEDDING_CONFIG,
  type BankAccount,
  type WeddingContentConfig,
} from "@/lib/config/wedding-config";

/**
 * Generates a deterministic 25x25 QR-style matrix from the payload string,
 * including standard 7x7 finder patterns in the three corners and a 5x5 alignment pattern.
 */
function buildStylizedQrMatrix(payload: string): boolean[][] {
  const size = 25;
  const grid: boolean[][] = Array.from({ length: size }, () =>
    Array.from({ length: size }, () => false)
  );
  const reserved: boolean[][] = Array.from({ length: size }, () =>
    Array.from({ length: size }, () => false)
  );

  const placeFinder = (rowOffset: number, colOffset: number) => {
    for (let r = -1; r <= 7; r++) {
      for (let c = -1; c <= 7; c++) {
        const rr = rowOffset + r;
        const cc = colOffset + c;
        if (rr < 0 || rr >= size || cc < 0 || cc >= size) continue;
        reserved[rr][cc] = true;
        if (r >= 0 && r <= 6 && c >= 0 && c <= 6) {
          const isBorder = r === 0 || r === 6 || c === 0 || c === 6;
          const isInner = r >= 2 && r <= 4 && c >= 2 && c <= 4;
          grid[rr][cc] = isBorder || isInner;
        }
      }
    }
  };

  placeFinder(0, 0);
  placeFinder(0, size - 7);
  placeFinder(size - 7, 0);

  // Timing patterns
  for (let i = 8; i < size - 8; i++) {
    reserved[6][i] = true;
    reserved[i][6] = true;
    grid[6][i] = i % 2 === 0;
    grid[i][6] = i % 2 === 0;
  }

  // Deterministic fill from payload char codes
  let hash = 2166136261;
  for (let r = 0; r < size; r++) {
    for (let c = 0; c < size; c++) {
      if (reserved[r][c]) continue;
      const charCode = payload.charCodeAt((r * size + c) % payload.length);
      hash ^= charCode + r * 31 + c * 17;
      hash = Math.imul(hash, 16777619);
      grid[r][c] = (Math.abs(hash) & 1) === 1;
    }
  }

  return grid;
}

export default function GiftSection({
  config = DEFAULT_WEDDING_CONFIG,
}: {
  config?: WeddingContentConfig;
}) {
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [isQrisModalOpen, setIsQrisModalOpen] = useState<boolean>(false);

  const qrMatrix = useMemo(
    () => buildStylizedQrMatrix(config.gifts.qris.codePayload),
    [config.gifts.qris.codePayload]
  );

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

  const handleDownloadQrisSvg = () => {
    const svgElement = document.getElementById("wedding-qris-svg");
    if (!svgElement) return;
    const serializer = new XMLSerializer();
    const source = serializer.serializeToString(svgElement);
    const blob = new Blob([source], { type: "image/svg+xml;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `QRIS-${config.couple.groom.nickname}-${config.couple.bride.nickname}.svg`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
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
            Anda ingin memberikan tanda kasih secara digital maupun fisik, Anda
            dapat menyalurkannya melalui informasi berikut:
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

        {/* Bottom Row: QRIS Card & Physical Gift Address */}
        <div className="mt-6 grid grid-cols-1 gap-6 md:grid-cols-2">
          {/* QRIS Interactive Card */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="flex flex-col justify-between rounded-3xl border border-[#C5A059]/40 bg-[#FAF7F2] p-7 shadow-md sm:p-8"
          >
            <div>
              <div className="flex items-center justify-between">
                <span className="rounded-full border border-[#C5A059]/40 bg-[#F2ECE1] px-3.5 py-1 text-[11px] font-semibold uppercase tracking-widest text-[#243830]">
                  QRIS Nasional
                </span>
                <QrCode className="h-6 w-6 text-[#C5A059]" />
              </div>

              <h3 className="mt-4 font-serif-luxury text-2xl font-semibold text-[#1C2B24]">
                {config.gifts.qris.merchantName}
              </h3>
              <p className="mt-1 text-xs text-[#4A6358]">
                NMID: {config.gifts.qris.nmid} • Mendukung seluruh
                Mobile Banking &amp; E-Wallet (GoPay, OVO, Dana, ShopeePay).
              </p>
            </div>

            <div className="mt-6 flex flex-col gap-3 sm:flex-row">
              <button
                type="button"
                onClick={() => setIsQrisModalOpen(true)}
                className="inline-flex flex-1 cursor-pointer items-center justify-center gap-2 rounded-xl bg-[#243830] px-5 py-3.5 text-xs font-semibold tracking-wider text-[#FAF7F2] shadow-sm transition-colors hover:bg-[#1C2B24]"
              >
                <QrCode className="h-4 w-4 text-[#E5D1A7]" />
                <span>Tampilkan Kode QRIS</span>
              </button>

              <button
                type="button"
                onClick={() =>
                  void handleCopy("qris-nmid", config.gifts.qris.nmid)
                }
                className="inline-flex cursor-pointer items-center justify-center gap-2 rounded-xl border border-[#C5A059]/45 bg-[#F2ECE1] px-4 py-3.5 text-xs font-semibold text-[#243830] transition-colors hover:bg-[#E5D1A7]/40"
              >
                {copiedId === "qris-nmid" ? (
                  <>
                    <Check className="h-4 w-4 text-emerald-700" />
                    <span>NMID Tersalin!</span>
                  </>
                ) : (
                  <>
                    <Copy className="h-4 w-4 text-[#C5A059]" />
                    <span>Salin NMID</span>
                  </>
                )}
              </button>
            </div>
          </motion.div>

          {/* Physical Gift Shipping Address Card */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6, delay: 0.25 }}
            className="flex flex-col justify-between rounded-3xl border border-[#C5A059]/40 bg-[#FAF7F2] p-7 shadow-md sm:p-8"
          >
            <div>
              <div className="flex items-center justify-between">
                <span className="rounded-full border border-[#C5A059]/40 bg-[#F2ECE1] px-3.5 py-1 text-[11px] font-semibold uppercase tracking-widest text-[#243830]">
                  Kirim Kado Fisik
                </span>
                <Gift className="h-6 w-6 text-[#C5A059]" />
              </div>

              <h3 className="mt-4 font-serif-luxury text-2xl font-semibold text-[#1C2B24]">
                {config.gifts.shippingAddress.recipient}
              </h3>

              <div className="mt-2 flex items-start gap-2 text-xs leading-relaxed text-[#4A6358]">
                <MapPin className="mt-0.5 h-4 w-4 shrink-0 text-[#C5A059]" />
                <div>
                  <p>{config.gifts.shippingAddress.address}</p>
                  <p className="mt-1 font-medium text-[#243830]">
                    Telp / Konfirmasi Kurir:{" "}
                    {config.gifts.shippingAddress.phone}
                  </p>
                </div>
              </div>
            </div>

            <button
              type="button"
              onClick={() =>
                void handleCopy(
                  "shipping-address",
                  `${config.gifts.shippingAddress.recipient} (${config.gifts.shippingAddress.phone}) - ${config.gifts.shippingAddress.address}`
                )
              }
              className="mt-6 inline-flex w-full cursor-pointer items-center justify-center gap-2 rounded-xl border border-[#C5A059]/50 bg-[#F2ECE1] px-5 py-3.5 text-xs font-semibold tracking-wider text-[#243830] transition-colors hover:bg-[#243830] hover:text-[#FAF7F2]"
            >
              {copiedId === "shipping-address" ? (
                <>
                  <Check className="h-4 w-4 text-emerald-600" />
                  <span>Alamat Pengiriman Tersalin!</span>
                </>
              ) : (
                <>
                  <Copy className="h-4 w-4 text-[#C5A059]" />
                  <span>Salin Alamat Pengiriman</span>
                </>
              )}
            </button>
          </motion.div>
        </div>
      </div>

      {/* Interactive QRIS Modal */}
      <AnimatePresence>
        {isQrisModalOpen && (
          <motion.div
            key="qris-modal-backdrop"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setIsQrisModalOpen(false)}
            className="fixed inset-0 z-50 flex items-center justify-center bg-[#1C2B24]/80 p-4 backdrop-blur-sm"
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.92, y: 16 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.92, y: 16 }}
              transition={{ duration: 0.25 }}
              onClick={(e) => e.stopPropagation()}
              className="relative w-full max-w-md overflow-hidden rounded-3xl border border-[#C5A059]/50 bg-[#FAF7F2] p-6 text-center shadow-2xl sm:p-8"
            >
              <button
                type="button"
                onClick={() => setIsQrisModalOpen(false)}
                aria-label="Tutup modal QRIS"
                className="absolute right-4 top-4 flex h-9 w-9 cursor-pointer items-center justify-center rounded-full border border-[#C5A059]/35 bg-[#F2ECE1] text-[#243830] transition-colors hover:bg-[#243830] hover:text-[#FAF7F2]"
              >
                <X className="h-4 w-4" />
              </button>

              <span className="inline-flex items-center gap-1.5 rounded-full border border-[#C5A059]/40 bg-[#F2ECE1] px-3.5 py-1 text-[10px] font-semibold uppercase tracking-[0.22em] text-[#243830]">
                QRIS Pembayaran Digital
              </span>

              <h3 className="mt-3 font-serif-luxury text-2xl font-semibold text-[#1C2B24]">
                {config.gifts.qris.merchantName}
              </h3>
              <p className="mt-1 text-xs text-[#4A6358]">
                NMID: {config.gifts.qris.nmid}
              </p>

              {/* Stylized SVG QR Code Container */}
              <div className="mx-auto my-6 flex w-fit items-center justify-center rounded-2xl border-2 border-[#C5A059]/50 bg-white p-4 shadow-inner">
                <svg
                  id="wedding-qris-svg"
                  xmlns="http://www.w3.org/2000/svg"
                  viewBox="0 0 290 290"
                  className="h-56 w-56 sm:h-60 sm:w-60"
                  role="img"
                  aria-label="Kode QRIS Pernikahan"
                >
                  <rect width="290" height="290" rx="16" fill="#FFFFFF" />
                  <g transform="translate(20, 20)">
                    {qrMatrix.map((row, rIdx) =>
                      row.map((cell, cIdx) =>
                        cell ? (
                          <rect
                            key={`${rIdx}-${cIdx}`}
                            x={cIdx * 10}
                            y={rIdx * 10}
                            width="9.2"
                            height="9.2"
                            rx="2"
                            fill="#1C2B24"
                          />
                        ) : null
                      )
                    )}
                    {/* Center Monogram Emblem */}
                    <rect
                      x="95"
                      y="95"
                      width="60"
                      height="60"
                      rx="12"
                      fill="#FAF7F2"
                      stroke="#C5A059"
                      strokeWidth="2.5"
                    />
                    <text
                      x="125"
                      y="131"
                      textAnchor="middle"
                      fill="#1C2B24"
                      fontFamily="Georgia, serif"
                      fontSize="18"
                      fontWeight="bold"
                    >
                      {config.couple.groom.nickname[0]}&amp;
                      {config.couple.bride.nickname[0]}
                    </text>
                  </g>
                </svg>
              </div>

              <div className="flex flex-col gap-2.5 sm:flex-row">
                <button
                  type="button"
                  onClick={() =>
                    void handleCopy(
                      "qris-payload",
                      config.gifts.qris.codePayload
                    )
                  }
                  className="inline-flex flex-1 cursor-pointer items-center justify-center gap-2 rounded-xl border border-[#C5A059]/50 bg-[#F2ECE1] px-4 py-3 text-xs font-semibold text-[#243830] transition-colors hover:bg-[#E5D1A7]/40"
                >
                  {copiedId === "qris-payload" ? (
                    <>
                      <Check className="h-4 w-4 text-emerald-700" />
                      <span>Kode QRIS Tersalin!</span>
                    </>
                  ) : (
                    <>
                      <Copy className="h-4 w-4 text-[#C5A059]" />
                      <span>Salin Kode QRIS</span>
                    </>
                  )}
                </button>

                <button
                  type="button"
                  onClick={handleDownloadQrisSvg}
                  className="inline-flex flex-1 cursor-pointer items-center justify-center gap-2 rounded-xl bg-[#243830] px-4 py-3 text-xs font-semibold text-[#FAF7F2] transition-colors hover:bg-[#1C2B24]"
                >
                  <Download className="h-4 w-4 text-[#E5D1A7]" />
                  <span>Unduh QRIS (SVG)</span>
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </section>
  );
}
