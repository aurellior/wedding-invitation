import React from "react";
import { Instagram } from "lucide-react";
import {
  findGuestByName,
  getRsvpByGuestId,
  getWeddingConfig,
  getWishes,
} from "@/lib/supabase/repository";
import InvitationClientShell from "@/components/invitation/InvitationClientShell";
import EventSchedule from "@/components/invitation/EventSchedule";
import RsvpForm from "@/components/invitation/RsvpForm";
import WishWall from "@/components/invitation/WishWall";
import GiftSection from "@/components/invitation/GiftSection";

export const dynamic = "force-dynamic";

interface InvitationPageProps {
  searchParams: Promise<{ to?: string | string[] }>;
}

function decodeGuestParameter(rawParam?: string | string[]): string {
  const firstValue = Array.isArray(rawParam) ? rawParam[0] : rawParam;
  if (!firstValue || typeof firstValue !== "string") {
    return "Tamu Undangan";
  }

  try {
    const decoded = decodeURIComponent(firstValue.replace(/\+/g, " ")).trim();
    return decoded.length > 0 ? decoded : "Tamu Undangan";
  } catch {
    const fallback = firstValue.trim();
    return fallback.length > 0 ? fallback : "Tamu Undangan";
  }
}

export default async function InvitationPage({
  searchParams,
}: InvitationPageProps) {
  const params = await searchParams;
  const rawGuestName = decodeGuestParameter(params.to);

  // Server-side lookups for Strict Invite-Only RSVP, initial Wishes, and live CMS Wedding Config
  const [registeredGuest, wishes, config] = await Promise.all([
    rawGuestName !== "Tamu Undangan"
      ? findGuestByName(rawGuestName)
      : Promise.resolve(null),
    getWishes(),
    getWeddingConfig(),
  ]);

  const initialRsvp = registeredGuest
    ? await getRsvpByGuestId(registeredGuest.id)
    : null;

  const displayGuestName = registeredGuest?.name ?? rawGuestName;

  return (
    <InvitationClientShell
      guestName={displayGuestName}
      guestCategory={registeredGuest?.category ?? null}
      isRegistered={Boolean(registeredGuest)}
      config={config}
    >
      <main id="main-content">
        {/* SECTION I: EDITORIAL FOLIO HERO & SACRED VERSE */}
        <header className="relative overflow-hidden border-b border-[#C5A059]/35 bg-[#1C2B24] px-4 py-16 text-[#FAF7F2] sm:px-6 sm:py-24 lg:px-8">
          <div className="mx-auto max-w-5xl">
            {/* Top Editorial Index Bar */}
            <div className="flex flex-wrap items-center justify-between gap-2 border-b border-[#C5A059]/30 pb-4 text-[11px] uppercase tracking-[0.24em] text-[#E5D1A7]/85">
              <span>I. Maklumat Pernikahan</span>
              <span className="tabular-nums">{config.couple.shortDate}</span>
            </div>

            {/* Main Couple Typography Spread */}
            <div className="py-12 text-center sm:py-16">
              <p className="text-xs font-medium uppercase tracking-[0.3em] text-[#E5D1A7]">
                Pernikahan Putra-Putri Kami
              </p>

              <h1 className="mt-4 font-serif-luxury text-6xl font-normal leading-[1.03] tracking-[-0.02em] text-[#FAF7F2] sm:text-7xl md:text-8xl">
                {config.couple.groom.nickname}{" "}
                <span className="font-serif-luxury italic text-[#C5A059]">
                  &amp;
                </span>{" "}
                {config.couple.bride.nickname}
              </h1>

              <p className="mt-5 text-sm font-medium uppercase tracking-[0.26em] text-[#E5D1A7]">
                {config.couple.weddingDateDisplay}
              </p>
            </div>

            {/* Asymmetric Two-Column Sacred Verse Folio */}
            <div className="grid grid-cols-1 gap-6 rounded-sm border border-[#C5A059]/40 bg-[#FAF7F2] p-6 text-[#222624] sm:p-10 lg:grid-cols-12 lg:items-center lg:gap-10">
              <div className="border-b border-[#C5A059]/25 pb-5 lg:col-span-6 lg:border-b-0 lg:border-r lg:pb-0 lg:pr-8">
                <p
                  dir="rtl"
                  lang="ar"
                  className="font-serif-luxury text-right text-2xl leading-[2] text-[#1C2B24] sm:text-3xl"
                >
                  {config.quote.arabic}
                </p>
              </div>

              <div className="lg:col-span-6 lg:pl-2">
                <p className="text-xs leading-relaxed text-[#4A6358] sm:text-sm">
                  &ldquo;{config.quote.translation}&rdquo;
                </p>
                <p className="mt-4 text-[11px] font-semibold uppercase tracking-[0.22em] text-[#243830]">
                  {config.quote.source}
                </p>
              </div>
            </div>
          </div>
        </header>

        {/* SECTION II: BRIDE & GROOM EDITORIAL PRINT SPREAD */}
        <section
          id="mempelai"
          className="relative overflow-hidden border-b border-[#C5A059]/25 bg-[#FAF7F2] px-4 py-20 sm:px-6 lg:px-8"
        >
          <div className="mx-auto max-w-5xl">
            {/* Section Opening Index & Intro */}
            <div className="grid grid-cols-1 gap-6 border-b border-[#C5A059]/30 pb-10 lg:grid-cols-12 lg:items-end">
              <div className="lg:col-span-7">
                <p className="text-xs font-semibold uppercase tracking-[0.24em] text-[#8A6825]">
                  II. Mempelai yang Berbahagia
                </p>
                <h2 className="mt-2 font-serif-luxury text-4xl font-semibold leading-[1.1] text-[#1C2B24] sm:text-5xl">
                  Assalamu&apos;alaikum Wr. Wb.
                </h2>
              </div>
              <div className="lg:col-span-5">
                <p className="text-sm leading-relaxed text-[#4A6358]">
                  Maha Suci Allah yang telah menciptakan makhluk-Nya
                  berpasang-pasangan. Perkenankanlah kami merangkaikan kasih
                  sayang di antara putra-putri kami:
                </p>
              </div>
            </div>

            {/* Editorial Two-Column Portrait Ledger (Separated by Architectural Hairline) */}
            <div className="mt-10 grid grid-cols-1 divide-y divide-[#C5A059]/30 rounded-sm border border-[#C5A059]/35 bg-[#FAF7F2] md:grid-cols-2 md:divide-x md:divide-y-0">
              {/* Groom Column */}
              <article className="flex flex-col justify-between p-7 sm:p-10">
                <div>
                  <div className="flex items-center justify-between text-[11px] font-semibold uppercase tracking-[0.22em] text-[#8A6825]">
                    <span>01 / Mempelai Pria</span>
                    <span>{config.couple.groom.childOrder}</span>
                  </div>

                  <div className="my-7 flex items-baseline gap-4 border-y border-[#C5A059]/20 py-6">
                    <span
                      aria-hidden="true"
                      className="font-serif-luxury text-6xl font-normal italic leading-none text-[#C5A059] sm:text-7xl"
                    >
                      {config.couple.groom.nickname[0]}
                    </span>
                    <div>
                      <h3 className="font-serif-luxury text-3xl font-semibold leading-tight text-[#1C2B24] sm:text-4xl">
                        {config.couple.groom.fullName}
                      </h3>
                      <p className="mt-1 text-xs uppercase tracking-[0.18em] text-[#4A6358]">
                        Panggilan: {config.couple.groom.nickname}
                      </p>
                    </div>
                  </div>

                  <dl className="space-y-1.5 text-sm text-[#222624]">
                    <dt className="text-[11px] font-semibold uppercase tracking-[0.18em] text-[#4A6358]">
                      Putra dari Pasangan
                    </dt>
                    <dd className="font-medium text-[#1C2B24]">
                      {config.couple.groom.fatherName}
                    </dd>
                    <dd className="text-[#4A6358]">
                      &amp; {config.couple.groom.motherName}
                    </dd>
                  </dl>
                </div>

                {config.couple.groom.instagram && (
                  <div className="mt-8 border-t border-[#C5A059]/25 pt-4">
                    <span className="inline-flex items-center gap-2 text-xs font-medium text-[#243830]">
                      <Instagram className="h-3.5 w-3.5 text-[#8A6825]" />
                      <span>{config.couple.groom.instagram}</span>
                    </span>
                  </div>
                )}
              </article>

              {/* Bride Column */}
              <article className="flex flex-col justify-between p-7 sm:p-10">
                <div>
                  <div className="flex items-center justify-between text-[11px] font-semibold uppercase tracking-[0.22em] text-[#8A6825]">
                    <span>02 / Mempelai Wanita</span>
                    <span>{config.couple.bride.childOrder}</span>
                  </div>

                  <div className="my-7 flex items-baseline gap-4 border-y border-[#C5A059]/20 py-6">
                    <span
                      aria-hidden="true"
                      className="font-serif-luxury text-6xl font-normal italic leading-none text-[#C5A059] sm:text-7xl"
                    >
                      {config.couple.bride.nickname[0]}
                    </span>
                    <div>
                      <h3 className="font-serif-luxury text-3xl font-semibold leading-tight text-[#1C2B24] sm:text-4xl">
                        {config.couple.bride.fullName}
                      </h3>
                      <p className="mt-1 text-xs uppercase tracking-[0.18em] text-[#4A6358]">
                        Panggilan: {config.couple.bride.nickname}
                      </p>
                    </div>
                  </div>

                  <dl className="space-y-1.5 text-sm text-[#222624]">
                    <dt className="text-[11px] font-semibold uppercase tracking-[0.18em] text-[#4A6358]">
                      Putri dari Pasangan
                    </dt>
                    <dd className="font-medium text-[#1C2B24]">
                      {config.couple.bride.fatherName}
                    </dd>
                    <dd className="text-[#4A6358]">
                      &amp; {config.couple.bride.motherName}
                    </dd>
                  </dl>
                </div>

                {config.couple.bride.instagram && (
                  <div className="mt-8 border-t border-[#C5A059]/25 pt-4">
                    <span className="inline-flex items-center gap-2 text-xs font-medium text-[#243830]">
                      <Instagram className="h-3.5 w-3.5 text-[#8A6825]" />
                      <span>{config.couple.bride.instagram}</span>
                    </span>
                  </div>
                )}
              </article>
            </div>
          </div>
        </section>

        {/* SECTION III: EVENT SCHEDULE & COUNTDOWN */}
        <EventSchedule config={config} />

        {/* SECTION IV: STRICT INVITE-ONLY RSVP FORM */}
        <RsvpForm
          guestName={displayGuestName}
          registeredGuest={registeredGuest}
          initialRsvp={initialRsvp}
        />

        {/* SECTION V: REALTIME & OPTIMISTIC WISH WALL */}
        <WishWall
          initialWishes={wishes}
          defaultSenderName={displayGuestName}
          registeredGuest={registeredGuest}
        />

        {/* SECTION VI: DIGITAL ENVELOPE & QRIS GIFT SECTION */}
        <GiftSection config={config} />
      </main>

      {/* CLOSING COLOPHON FOOTER */}
      <footer className="relative overflow-hidden border-t border-[#C5A059]/35 bg-[#1C2B24] px-4 pb-28 pt-16 text-[#FAF7F2] sm:px-6 lg:px-8">
        <div className="mx-auto max-w-5xl">
          <div className="grid grid-cols-1 gap-8 border-b border-[#C5A059]/25 pb-12 lg:grid-cols-12 lg:items-end">
            <div className="lg:col-span-7">
              <p className="text-xs uppercase tracking-[0.26em] text-[#E5D1A7]">
                Ungkapan Terima Kasih
              </p>
              <h2 className="mt-3 font-serif-luxury text-4xl font-normal text-[#FAF7F2] sm:text-5xl">
                {config.couple.groom.nickname}{" "}
                <span className="italic text-[#C5A059]">&amp;</span>{" "}
                {config.couple.bride.nickname}
              </h2>
              <p className="mt-4 max-w-xl text-xs leading-relaxed text-[#FAF7F2]/80 sm:text-sm">
                Merupakan suatu kehormatan dan kebahagiaan bagi kami apabila
                Bapak/Ibu/Saudara/i berkenan hadir dan memberikan doa restu
                kepada kedua mempelai.
              </p>
            </div>

            <div className="lg:col-span-5 lg:text-right">
              <p className="font-serif-luxury text-xl italic text-[#E5D1A7]">
                Wassalamu&apos;alaikum Warahmatullahi Wabarakatuh
              </p>
              <p className="mt-2 text-xs font-semibold tracking-[0.22em] text-[#C5A059]">
                {config.couple.hashtag}
              </p>
            </div>
          </div>

          <div className="mt-6 flex flex-col justify-between gap-2 text-[11px] text-[#FAF7F2]/60 sm:flex-row sm:items-center">
            <span>
              Keluarga Besar {config.couple.groom.fatherName} &amp;{" "}
              {config.couple.bride.fatherName}
            </span>
            <span className="tabular-nums">
              {config.couple.weddingDateDisplay}
            </span>
          </div>
        </div>
      </footer>
    </InvitationClientShell>
  );
}
