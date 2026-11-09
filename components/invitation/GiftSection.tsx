"use client";

import React, { useEffect, useMemo, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import {
  Check,
  Copy,
  CreditCard,
  Gift,
  QrCode,
  X,
  MapPin,
  Download,
} from "lucide-react";
import { WEDDING_CONFIG, type BankAccount } from "@/lib/config/wedding-config";

/**
 * Generates a deterministic 25x25 QR-style matrix from the payload string,
 * including standard 7x7 finder patterns in the three corners and timing patterns.
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

export default function GiftSection() {
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [isQrisModalOpen, setIsQrisModalOpen] = useState<boolean>(false);

  const qrMatrix = useMemo(
    () => buildStylizedQrMatrix(WEDDING_CONFIG.gifts.qris.codePayload),
    []
  );

  // R-26 & R-32: Allow Escape key to close the QRIS modal
  useEffect(() => {
    if (!isQrisModalOpen) return;
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setIsQrisModalOpen(false);
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isQrisModalOpen]);

  const handleCopy = async (id: string, textToCopy: string) => {
    try {
      await navigator.clipboard.writeText(textToCopy);
      setCopiedId(id);
      setTimeout(() => {
        setCopiedId((prev) => (prev === id ? null : prev));
      }, 2500);
    } catch {
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
    link.download = `QRIS-${WEDDING_CONFIG.couple.groom.nickname}-${WEDDING_CONFIG.couple.bride.nickname}.svg`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  return (
    <section
      id="hadiah"
      className="relative bg-[#FAF7F2] px-4 py-20 sm:px-6 lg:px-8"
    >
      <div className="mx-auto max-w-5xl">
        {/* Editorial Heading */}
        <div className="grid grid-cols-1 gap-6 border-b border-[#C5A059]/30 pb-10 lg:grid-cols-12 lg:items-end">
          <div className="lg:col-span-6">
            <p className="text-xs font-semibold uppercase tracking-[0.24em] text-[#8A6825]">
              VI. Tanda Kasih Pernikahan
            </p>
            <h2 className="mt-2 font-serif-luxury text-4xl font-semibold leading-[1.1] text-[#1C2B24] sm:text-5xl">
              Amplop Digital &amp; Kiriman Kado
            </h2>
          </div>
          <div className="lg:col-span-6">
            <p className="text-sm leading-relaxed text-[#4A6358]">
              Doa restu Anda merupakan karunia terindah bagi kami. Namun apabila
              Anda ingin menyampaikan tanda kasih secara digital maupun fisik,
              Anda dapat menyalurkannya melalui informasi berikut:
            </p>
          </div>
        </div>

        {/* Stationery Bank Remittance Vouchers */}
        <div className="mt-10 grid grid-cols-1 gap-6 md:grid-cols-2">
          {WEDDING_CONFIG.gifts.accounts.map((account: BankAccount) => {
            const isCopied = copiedId === account.id;
            return (
              <article
                key={account.id}
                className="flex flex-col justify-between rounded-sm border border-[#C5A059]/45 bg-[#1C2B24] p-7 text-[#FAF7F2] sm:p-8"
              >
                <div className="flex items-start justify-between gap-4 border-b border-[#C5A059]/25 pb-4">
                  <div>
                    <p className="text-[11px] uppercase tracking-[0.22em] text-[#E5D1A7]/80">
                      Rekening Transfer
                    </p>
                    <h3 className="mt-1 font-serif-luxury text-2xl font-semibold text-[#FAF7F2]">
                      {account.bankName}
                    </h3>
                  </div>
                  <div className="flex h-10 w-10 items-center justify-center rounded-sm border border-[#C5A059]/40 bg-[#243830] text-[#E5D1A7]">
                    <CreditCard className="h-4 w-4" />
                  </div>
                </div>

                <div className="my-6">
                  <p className="text-[11px] uppercase tracking-[0.18em] text-[#FAF7F2]/65">
                    Nomor Rekening
                  </p>
                  <p className="mt-1 font-mono text-2xl font-semibold tracking-[0.14em] text-[#E5D1A7] tabular-nums sm:text-3xl">
                    {account.accountNumber}
                  </p>
                  <p className="mt-2.5 text-sm font-medium text-[#FAF7F2]">
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
                  className={`inline-flex min-h-11 w-full items-center justify-center gap-2 rounded-sm border px-4 py-3 text-xs font-semibold uppercase tracking-[0.16em] transition-colors ${
                    isCopied
                      ? "border-emerald-400 bg-emerald-950/60 text-emerald-200"
                      : "border-[#C5A059]/55 bg-[#243830] text-[#E5D1A7] hover:bg-[#C5A059] hover:text-[#1C2B24]"
                  }`}
                >
                  {isCopied ? (
                    <>
                      <Check className="h-4 w-4" />
                      <span className="tabular-nums">
                        Tersalin ({account.accountNumber})
                      </span>
                    </>
                  ) : (
                    <>
                      <Copy className="h-4 w-4" />
                      <span>Salin Nomor Rekening</span>
                    </>
                  )}
                </button>
              </article>
            );
          })}
        </div>

        {/* Bottom Row: QRIS Voucher & Physical Gift Address Slip */}
        <div className="mt-6 grid grid-cols-1 gap-6 md:grid-cols-2">
          {/* QRIS Interactive Slip */}
          <article className="flex flex-col justify-between rounded-sm border border-[#C5A059]/40 bg-[#F2ECE1]/70 p-7 sm:p-8">
            <div>
              <div className="flex items-center justify-between border-b border-[#C5A059]/25 pb-3">
                <span className="text-[11px] font-semibold uppercase tracking-[0.2em] text-[#8A6825]">
                  QRIS Nasional
                </span>
                <QrCode className="h-5 w-5 text-[#8A6825]" />
              </div>

              <h3 className="mt-4 font-serif-luxury text-2xl font-semibold text-[#1C2B24]">
                {WEDDING_CONFIG.gifts.qris.merchantName}
              </h3>
              <p className="mt-1.5 text-xs leading-relaxed text-[#4A6358] tabular-nums">
                NMID: {WEDDING_CONFIG.gifts.qris.nmid} • Mendukung seluruh
                aplikasi Mobile Banking dan dompet digital (GoPay, OVO, DANA,
                ShopeePay).
              </p>
            </div>

            <div className="mt-6 flex flex-col gap-3 sm:flex-row">
              <button
                type="button"
                onClick={() => setIsQrisModalOpen(true)}
                className="inline-flex min-h-11 flex-1 items-center justify-center gap-2 rounded-sm bg-[#243830] px-5 py-3 text-xs font-semibold uppercase tracking-[0.14em] text-[#FAF7F2] transition-colors hover:bg-[#1C2B24]"
              >
                <QrCode className="h-4 w-4 text-[#E5D1A7]" />
                <span>Tampilkan Kode QRIS</span>
              </button>

              <button
                type="button"
                onClick={() =>
                  void handleCopy("qris-nmid", WEDDING_CONFIG.gifts.qris.nmid)
                }
                className="inline-flex min-h-11 items-center justify-center gap-2 rounded-sm border border-[#C5A059]/55 bg-[#FAF7F2] px-4 py-3 text-xs font-semibold uppercase tracking-[0.14em] text-[#243830] transition-colors hover:bg-[#E5D1A7]/35"
              >
                {copiedId === "qris-nmid" ? (
                  <>
                    <Check className="h-4 w-4 text-emerald-700" />
                    <span>NMID Tersalin</span>
                  </>
                ) : (
                  <>
                    <Copy className="h-4 w-4 text-[#8A6825]" />
                    <span>Salin NMID</span>
                  </>
                )}
              </button>
            </div>
          </article>

          {/* Physical Gift Shipping Address Slip */}
          <article className="flex flex-col justify-between rounded-sm border border-[#C5A059]/40 bg-[#F2ECE1]/70 p-7 sm:p-8">
            <div>
              <div className="flex items-center justify-between border-b border-[#C5A059]/25 pb-3">
                <span className="text-[11px] font-semibold uppercase tracking-[0.2em] text-[#8A6825]">
                  Alamat Pengiriman Kado
                </span>
                <Gift className="h-5 w-5 text-[#8A6825]" />
              </div>

              <h3 className="mt-4 font-serif-luxury text-2xl font-semibold text-[#1C2B24]">
                {WEDDING_CONFIG.gifts.shippingAddress.recipient}
              </h3>

              <div className="mt-2 flex items-start gap-2 text-xs leading-relaxed text-[#4A6358]">
                <MapPin className="mt-0.5 h-4 w-4 shrink-0 text-[#8A6825]" />
                <div>
                  <p>{WEDDING_CONFIG.gifts.shippingAddress.address}</p>
                  <p className="mt-1 font-medium text-[#243830] tabular-nums">
                    Konfirmasi Penerima:{" "}
                    {WEDDING_CONFIG.gifts.shippingAddress.phone}
                  </p>
                </div>
              </div>
            </div>

            <button
              type="button"
              onClick={() =>
                void handleCopy(
                  "shipping-address",
                  `${WEDDING_CONFIG.gifts.shippingAddress.recipient} (${WEDDING_CONFIG.gifts.shippingAddress.phone}), ${WEDDING_CONFIG.gifts.shippingAddress.address}`
                )
              }
              className="mt-6 inline-flex min-h-11 w-full items-center justify-center gap-2 rounded-sm border border-[#C5A059]/55 bg-[#FAF7F2] px-5 py-3 text-xs font-semibold uppercase tracking-[0.14em] text-[#243830] transition-colors hover:bg-[#243830] hover:text-[#FAF7F2]"
            >
              {copiedId === "shipping-address" ? (
                <>
                  <Check className="h-4 w-4 text-emerald-600" />
                  <span>Alamat Pengiriman Tersalin</span>
                </>
              ) : (
                <>
                  <Copy className="h-4 w-4 text-[#8A6825]" />
                  <span>Salin Alamat Pengiriman</span>
                </>
              )}
            </button>
          </article>
        </div>
      </div>

      {/* Interactive QRIS Modal */}
      <AnimatePresence>
        {isQrisModalOpen && (
          <motion.div
            key="qris-modal-backdrop"
            role="dialog"
            aria-modal="true"
            aria-labelledby="qris-modal-title"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setIsQrisModalOpen(false)}
            className="fixed inset-0 z-50 flex items-center justify-center bg-[#1C2B24]/85 p-4"
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.96, y: 12 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.96, y: 12 }}
              transition={{ duration: 0.2 }}
              onClick={(e) => e.stopPropagation()}
              className="relative w-full max-w-md overflow-hidden rounded-sm border border-[#C5A059]/55 bg-[#FAF7F2] p-6 text-center shadow-2xl sm:p-8"
            >
              <button
                type="button"
                onClick={() => setIsQrisModalOpen(false)}
                aria-label="Tutup modal QRIS"
                className="absolute right-3 top-3 flex h-11 w-11 items-center justify-center rounded-sm border border-[#C5A059]/35 bg-[#F2ECE1] text-[#243830] transition-colors hover:bg-[#243830] hover:text-[#FAF7F2]"
              >
                <X className="h-4 w-4" />
              </button>

              <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-[#8A6825]">
                QRIS Pembayaran Digital
              </p>

              <h3
                id="qris-modal-title"
                className="mt-2 font-serif-luxury text-2xl font-semibold text-[#1C2B24]"
              >
                {WEDDING_CONFIG.gifts.qris.merchantName}
              </h3>
              <p className="mt-1 text-xs text-[#4A6358] tabular-nums">
                NMID: {WEDDING_CONFIG.gifts.qris.nmid}
              </p>

              {/* Stylized SVG QR Code Container with explicit width & height */}
              <div className="mx-auto my-6 flex w-fit items-center justify-center rounded-sm border border-[#C5A059]/50 bg-white p-4">
                <svg
                  id="wedding-qris-svg"
                  xmlns="http://www.w3.org/2000/svg"
                  viewBox="0 0 290 290"
                  width="240"
                  height="240"
                  className="h-56 w-56 sm:h-60 sm:w-60"
                  role="img"
                  aria-label="Kode QRIS Pernikahan Arka & Nadia"
                >
                  <rect width="290" height="290" rx="8" fill="#FFFFFF" />
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
                            rx="1.5"
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
                      rx="6"
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
                      A&amp;N
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
                      WEDDING_CONFIG.gifts.qris.codePayload
                    )
                  }
                  className="inline-flex min-h-11 flex-1 items-center justify-center gap-2 rounded-sm border border-[#C5A059]/55 bg-[#F2ECE1] px-4 py-2.5 text-xs font-semibold uppercase tracking-[0.14em] text-[#243830] transition-colors hover:bg-[#E5D1A7]/40"
                >
                  {copiedId === "qris-payload" ? (
                    <>
                      <Check className="h-4 w-4 text-emerald-700" />
                      <span>Kode Tersalin</span>
                    </>
                  ) : (
                    <>
                      <Copy className="h-4 w-4 text-[#8A6825]" />
                      <span>Salin Kode QRIS</span>
                    </>
                  )}
                </button>

                <button
                  type="button"
                  onClick={handleDownloadQrisSvg}
                  className="inline-flex min-h-11 flex-1 items-center justify-center gap-2 rounded-sm bg-[#243830] px-4 py-2.5 text-xs font-semibold uppercase tracking-[0.14em] text-[#FAF7F2] transition-colors hover:bg-[#1C2B24]"
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
