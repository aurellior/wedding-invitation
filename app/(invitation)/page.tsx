import React from "react";
import { Heart, Instagram, Sparkles } from "lucide-react";
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

function decodeGuestParameter(rawParam?: string | string[]): string | null {
  const firstValue = Array.isArray(rawParam) ? rawParam[0] : rawParam;
  if (!firstValue || typeof firstValue !== "string") {
    return null;
  }

  try {
    const decoded = decodeURIComponent(firstValue.replace(/\+/g, " ")).trim();
    return decoded.length > 0 ? decoded : null;
  } catch {
    const fallback = firstValue.trim();
    return fallback.length > 0 ? fallback : null;
  }
}

export default async function InvitationPage({
  searchParams,
}: InvitationPageProps) {
  const params = await searchParams;
  const rawGuestName = decodeGuestParameter(params.to);

  const registeredGuest = rawGuestName
    ? await findGuestByName(rawGuestName)
    : null;

  // Server-side lookups for Strict Invite-Only RSVP, initial Wishes, & Dynamic Wedding Config
  const [initialRsvp, wishes, config] = await Promise.all([
    registeredGuest
      ? getRsvpByGuestId(registeredGuest.id)
      : Promise.resolve(null),
    getWishes(),
    getWeddingConfig(),
  ]);

  const displayGuestName =
    registeredGuest?.name ?? (rawGuestName || "Tamu Undangan");

  return (
    <InvitationClientShell
      guestName={displayGuestName}
      guestCategory={registeredGuest?.category ?? null}
      isRegistered={Boolean(registeredGuest)}
      config={config}
    >
      {/* 1. HERO SECTION */}
      <section className="relative overflow-hidden border-b border-[#C5A059]/25 bg-gradient-to-b from-[#1C2B24] via-[#243830] to-[#1C2B24] px-4 py-24 text-center text-[#FAF7F2] sm:px-6 sm:py-32">
        {/* Radial Botanical & Gold Ambience */}
        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-0 overflow-hidden"
        >
          <div className="absolute left-1/2 top-0 h-[380px] w-[520px] -translate-x-1/2 rounded-full bg-[#C5A059]/15 blur-[120px]" />
          <div className="absolute bottom-0 left-1/2 h-[320px] w-[420px] -translate-x-1/2 rounded-full bg-[#4A6358]/20 blur-[100px]" />
        </div>

        <div className="relative z-10 mx-auto max-w-3xl">
          <div className="inline-flex items-center gap-2 rounded-full border border-[#C5A059]/40 bg-[#FAF7F2]/10 px-4 py-1.5 text-[11px] uppercase tracking-[0.28em] text-[#E5D1A7]">
            <Sparkles className="h-3.5 w-3.5 text-[#C5A059]" />
            <span>The Wedding Of</span>
          </div>

          <h1 className="mt-6 font-serif-luxury text-6xl font-normal tracking-wide text-[#FAF7F2] sm:text-7xl md:text-8xl">
            {config.couple.groom.nickname}{" "}
            <span className="font-serif-luxury italic text-[#C5A059]">
              &amp;
            </span>{" "}
            {config.couple.bride.nickname}
          </h1>

          <p className="mt-5 text-sm font-medium uppercase tracking-[0.3em] text-[#E5D1A7]">
            {config.couple.weddingDateDisplay}
          </p>

          <div className="mx-auto mt-8 flex max-w-md items-center justify-center gap-4">
            <span className="h-[1px] flex-1 bg-gradient-to-r from-transparent to-[#C5A059]/60" />
            <span className="font-serif-luxury text-lg italic text-[#E5D1A7]">
              {config.couple.shortDate}
            </span>
            <span className="h-[1px] flex-1 bg-gradient-to-l from-transparent to-[#C5A059]/60" />
          </div>

          {/* Sacred Quote Card */}
          <div className="mx-auto mt-12 max-w-2xl rounded-3xl border border-[#C5A059]/35 bg-[#FAF7F2]/95 p-7 text-[#222624] shadow-2xl sm:p-10">
            <p
              dir="rtl"
              lang="ar"
              className="font-serif-luxury text-2xl leading-loose text-[#1C2B24] sm:text-3xl"
            >
              {config.quote.arabic}
            </p>
            <p className="mt-4 text-xs italic leading-relaxed text-[#4A6358] sm:text-sm">
              &ldquo;{config.quote.translation}&rdquo;
            </p>
            <p className="mt-3 text-xs font-semibold uppercase tracking-[0.2em] text-[#243830]">
              — {config.quote.source} —
            </p>
          </div>
        </div>
      </section>

      {/* 2. BRIDE & GROOM PROFILE SECTION */}
      <section
        id="mempelai"
        className="relative overflow-hidden py-20 px-4 sm:px-6 lg:px-8"
      >
        <div className="mx-auto max-w-5xl">
          <div className="text-center">
            <span className="inline-flex items-center gap-2 rounded-full border border-[#C5A059]/40 bg-[#F2ECE1] px-4 py-1 text-[11px] font-medium uppercase tracking-[0.25em] text-[#243830]">
              <Sparkles className="h-3.5 w-3.5 text-[#C5A059]" />
              Assalamu&apos;alaikum Wr. Wb.
            </span>

            <h2 className="mt-4 font-serif-luxury text-4xl font-semibold text-[#1C2B24] sm:text-5xl">
              Mempelai yang Berbahagia
            </h2>

            <p className="mx-auto mt-3 max-w-2xl text-sm leading-relaxed text-[#4A6358]">
              Maha Suci Allah yang telah menciptakan makhluk-Nya
              berpasang-pasangan. Ya Allah, perkenankanlah kami merangkaikan
              kasih sayang yang Kau ciptakan di antara putra-putri kami:
            </p>
          </div>

          <div className="mt-14 grid grid-cols-1 items-stretch gap-8 md:grid-cols-11">
            {/* Groom Card */}
            <div className="flex flex-col items-center justify-between rounded-3xl border border-[#C5A059]/40 bg-[#FAF7F2] p-8 text-center shadow-[0_14px_40px_rgba(36,56,48,0.06)] md:col-span-5">
              <div className="flex flex-col items-center">
                {/* Botanical Monogram Portrait Frame */}
                <div className="relative mb-6 flex h-32 w-32 items-center justify-center rounded-full border-2 border-[#C5A059] bg-gradient-to-b from-[#243830] to-[#1C2B24] shadow-lg">
                  <span className="font-serif-luxury text-5xl font-semibold text-[#E5D1A7]">
                    {config.couple.groom.nickname[0]}
                  </span>
                  <span className="absolute -bottom-2.5 rounded-full border border-[#C5A059]/50 bg-[#FAF7F2] px-3 py-0.5 text-[10px] font-semibold uppercase tracking-widest text-[#243830]">
                    The Groom
                  </span>
                </div>

                <h3 className="font-serif-luxury text-3xl font-semibold text-[#1C2B24]">
                  {config.couple.groom.fullName}
                </h3>

                <p className="mt-3 text-xs font-semibold uppercase tracking-[0.18em] text-[#C5A059]">
                  {config.couple.groom.childOrder} dari:
                </p>

                <p className="mt-1.5 text-sm leading-relaxed text-[#4A6358]">
                  {config.couple.groom.fatherName}
                  <br />
                  &amp; {config.couple.groom.motherName}
                </p>
              </div>

              <div className="mt-6 pt-4 border-t border-[#C5A059]/25 w-full flex justify-center">
                <span className="inline-flex items-center gap-1.5 rounded-full border border-[#C5A059]/35 bg-[#F2ECE1] px-4 py-1.5 text-xs font-medium text-[#243830]">
                  <Instagram className="h-3.5 w-3.5 text-[#C5A059]" />
                  <span>{config.couple.groom.instagram}</span>
                </span>
              </div>
            </div>

            {/* Center Heart Divider */}
            <div className="flex items-center justify-center md:col-span-1">
              <div className="flex h-14 w-14 items-center justify-center rounded-full border border-[#C5A059]/45 bg-[#243830] text-[#E5D1A7] shadow-md">
                <Heart className="h-6 w-6 fill-[#C5A059] text-[#C5A059]" />
              </div>
            </div>

            {/* Bride Card */}
            <div className="flex flex-col items-center justify-between rounded-3xl border border-[#C5A059]/40 bg-[#FAF7F2] p-8 text-center shadow-[0_14px_40px_rgba(36,56,48,0.06)] md:col-span-5">
              <div className="flex flex-col items-center">
                {/* Botanical Monogram Portrait Frame */}
                <div className="relative mb-6 flex h-32 w-32 items-center justify-center rounded-full border-2 border-[#C5A059] bg-gradient-to-b from-[#243830] to-[#1C2B24] shadow-lg">
                  <span className="font-serif-luxury text-5xl font-semibold text-[#E5D1A7]">
                    {config.couple.bride.nickname[0]}
                  </span>
                  <span className="absolute -bottom-2.5 rounded-full border border-[#C5A059]/50 bg-[#FAF7F2] px-3 py-0.5 text-[10px] font-semibold uppercase tracking-widest text-[#243830]">
                    The Bride
                  </span>
                </div>

                <h3 className="font-serif-luxury text-3xl font-semibold text-[#1C2B24]">
                  {config.couple.bride.fullName}
                </h3>

                <p className="mt-3 text-xs font-semibold uppercase tracking-[0.18em] text-[#C5A059]">
                  {config.couple.bride.childOrder} dari:
                </p>

                <p className="mt-1.5 text-sm leading-relaxed text-[#4A6358]">
                  {config.couple.bride.fatherName}
                  <br />
                  &amp; {config.couple.bride.motherName}
                </p>
              </div>

              <div className="mt-6 pt-4 border-t border-[#C5A059]/25 w-full flex justify-center">
                <span className="inline-flex items-center gap-1.5 rounded-full border border-[#C5A059]/35 bg-[#F2ECE1] px-4 py-1.5 text-xs font-medium text-[#243830]">
                  <Instagram className="h-3.5 w-3.5 text-[#C5A059]" />
                  <span>{config.couple.bride.instagram}</span>
                </span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 3. EVENT SCHEDULE & COUNTDOWN */}
      <EventSchedule config={config} />

      {/* 4. STRICT INVITE-ONLY RSVP FORM */}
      <RsvpForm
        guestName={displayGuestName}
        registeredGuest={registeredGuest}
        initialRsvp={initialRsvp}
      />

      {/* 5. REALTIME & OPTIMISTIC WISH WALL */}
      <WishWall
        initialWishes={wishes}
        defaultSenderName={displayGuestName}
        registeredGuest={registeredGuest}
      />

      {/* 6. DIGITAL ENVELOPE GIFT SECTION */}
      <GiftSection config={config} />

      {/* 7. CLOSING THANK YOU & FOOTER */}
      <footer className="relative overflow-hidden border-t border-[#C5A059]/35 bg-[#1C2B24] px-4 pb-28 pt-20 text-center text-[#FAF7F2] sm:px-6">
        <div className="mx-auto max-w-2xl">
          <p className="text-xs uppercase tracking-[0.28em] text-[#E5D1A7]">
            Ungkapan Terima Kasih
          </p>

          <h2 className="mt-4 font-serif-luxury text-4xl font-normal text-[#FAF7F2] sm:text-5xl">
            {config.couple.groom.nickname}{" "}
            <span className="italic text-[#C5A059]">&amp;</span>{" "}
            {config.couple.bride.nickname}
          </h2>

          <p className="mt-4 text-xs leading-relaxed text-[#FAF7F2]/80 sm:text-sm">
            Merupakan suatu kehormatan dan kebahagiaan bagi kami apabila
            Bapak/Ibu/Saudara/i berkenan hadir untuk memberikan doa restu kepada
            kedua mempelai. Atas kehadiran dan doa restunya, kami ucapkan terima
            kasih.
          </p>

          <p className="mt-5 font-serif-luxury text-lg italic text-[#E5D1A7]">
            Wassalamu&apos;alaikum Warahmatullahi Wabarakatuh
          </p>

          <div className="my-8 h-[1px] w-full bg-gradient-to-r from-transparent via-[#C5A059]/40 to-transparent" />

          <p className="text-xs font-semibold tracking-[0.25em] text-[#C5A059]">
            {config.couple.hashtag}
          </p>
          <p className="mt-2 text-[11px] text-[#FAF7F2]/50">
            Luxury Botanical &amp; Warm Ivory Wedding Suite •{" "}
            {config.couple.weddingDateDisplay}
          </p>
        </div>
      </footer>
    </InvitationClientShell>
  );
}
