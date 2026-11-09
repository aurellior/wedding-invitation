"use client";

import React, { useEffect, useState } from "react";
import {
  CalendarPlus,
  Clock,
  MapPin,
  Navigation,
  Calendar,
} from "lucide-react";
import {
  DEFAULT_WEDDING_CONFIG,
  buildGoogleCalendarUrl,
  type WeddingContentConfig,
  type WeddingEventDetail,
} from "@/lib/config/wedding-config";

interface TimeLeft {
  days: number;
  hours: number;
  minutes: number;
  seconds: number;
}

function calculateTimeLeft(targetIso: string): TimeLeft {
  const target = new Date(targetIso).getTime();
  const now = Date.now();
  const diff = Math.max(0, target - now);

  return {
    days: Math.floor(diff / (1000 * 60 * 60 * 24)),
    hours: Math.floor((diff / (1000 * 60 * 60)) % 24),
    minutes: Math.floor((diff / 1000 / 60) % 60),
    seconds: Math.floor((diff / 1000) % 60),
  };
}

export default function EventSchedule({
  config = DEFAULT_WEDDING_CONFIG,
}: {
  config?: WeddingContentConfig;
}) {
  const [mounted, setMounted] = useState(false);
  const [timeLeft, setTimeLeft] = useState<TimeLeft>({
    days: 0,
    hours: 0,
    minutes: 0,
    seconds: 0,
  });

  useEffect(() => {
    setMounted(true);
    setTimeLeft(calculateTimeLeft(config.couple.weddingDateIso));

    const interval = setInterval(() => {
      setTimeLeft(calculateTimeLeft(config.couple.weddingDateIso));
    }, 1000);

    return () => clearInterval(interval);
  }, [config.couple.weddingDateIso]);

  const countdownItems = [
    { label: "Hari", value: mounted ? timeLeft.days : 0 },
    { label: "Jam", value: mounted ? timeLeft.hours : 0 },
    { label: "Menit", value: mounted ? timeLeft.minutes : 0 },
    { label: "Detik", value: mounted ? timeLeft.seconds : 0 },
  ];

  const primaryEvent = config.events[0] ?? DEFAULT_WEDDING_CONFIG.events[0];
  const romanNumerals = ["I", "II", "III", "IV"];

  return (
    <section
      id="acara"
      className="relative overflow-hidden border-b border-[#C5A059]/25 bg-[#F2ECE1]/75 px-4 py-20 sm:px-6 lg:px-8"
    >
      <div className="mx-auto max-w-5xl">
        {/* Asymmetric Section Header & Countdown Ledger */}
        <div className="grid grid-cols-1 gap-8 border-b border-[#C5A059]/30 pb-12 lg:grid-cols-12 lg:items-end">
          <div className="lg:col-span-6">
            <p className="text-xs font-semibold uppercase tracking-[0.24em] text-[#8A6825]">
              III. Rangkaian Acara
            </p>
            <h2 className="mt-2 font-serif-luxury text-4xl font-semibold leading-[1.1] text-[#1C2B24] sm:text-5xl">
              Waktu &amp; Tempat Bahagia
            </h2>
            <p className="mt-3 max-w-xl text-sm leading-relaxed text-[#4A6358]">
              Dengan memohon rahmat dan ridho Allah SWT, kami bermaksud
              menyelenggarakan akad nikah dan resepsi pernikahan pada:
            </p>
          </div>

          {/* Tabular Countdown Strip */}
          <div className="lg:col-span-6">
            <div className="rounded-sm border border-[#C5A059]/40 bg-[#1C2B24] p-5 text-[#FAF7F2]">
              <div className="flex items-center justify-between border-b border-[#C5A059]/25 pb-2.5 text-[11px] uppercase tracking-[0.2em] text-[#E5D1A7]">
                <span>Hitung Mundur Acara</span>
                <span className="tabular-nums">{config.couple.shortDate}</span>
              </div>
              <div className="mt-4 grid grid-cols-4 divide-x divide-[#C5A059]/25 text-center">
                {countdownItems.map((item) => (
                  <div key={item.label} className="px-2">
                    <span className="font-serif-luxury text-3xl font-semibold tracking-wider text-[#E5D1A7] tabular-nums sm:text-4xl">
                      {String(item.value).padStart(2, "0")}
                    </span>
                    <span className="mt-1 block text-[10px] uppercase tracking-[0.18em] text-[#FAF7F2]/75">
                      {item.label}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Event Itinerary Grid */}
        <div className="mt-10 grid grid-cols-1 gap-6 md:grid-cols-2">
          {config.events.map((event: WeddingEventDetail, idx: number) => (
            <article
              key={event.id}
              className="flex flex-col justify-between rounded-sm border border-[#C5A059]/40 bg-[#FAF7F2] p-7 sm:p-9"
            >
              <div>
                <div className="flex items-center justify-between border-b border-[#C5A059]/25 pb-3 text-xs font-semibold uppercase tracking-[0.2em] text-[#8A6825]">
                  <span>
                    {romanNumerals[idx] ?? idx + 1}. {event.subtitle}
                  </span>
                  <span className="tabular-nums">0{idx + 1}</span>
                </div>

                <h3 className="mt-5 font-serif-luxury text-3xl font-semibold text-[#1C2B24] sm:text-4xl">
                  {event.title}
                </h3>

                <div className="mt-5 space-y-3.5 border-y border-[#C5A059]/25 py-5 text-sm text-[#222624]">
                  <div className="flex items-start gap-3">
                    <Calendar className="mt-0.5 h-4 w-4 shrink-0 text-[#8A6825]" />
                    <p className="font-semibold text-[#1C2B24]">
                      {event.dateDisplay}
                    </p>
                  </div>

                  <div className="flex items-start gap-3">
                    <Clock className="mt-0.5 h-4 w-4 shrink-0 text-[#8A6825]" />
                    <p className="font-medium text-[#243830] tabular-nums">
                      {event.timeDisplay}
                    </p>
                  </div>

                  <div className="flex items-start gap-3">
                    <MapPin className="mt-0.5 h-4 w-4 shrink-0 text-[#8A6825]" />
                    <div>
                      <p className="font-semibold text-[#1C2B24]">
                        {event.venueName}
                      </p>
                      <p className="mt-0.5 text-xs leading-relaxed text-[#4A6358]">
                        {event.venueAddress}
                      </p>
                    </div>
                  </div>
                </div>

                {event.dressCode && (
                  <p className="mt-4 text-xs text-[#243830]">
                    <strong className="font-semibold uppercase tracking-wider text-[#1C2B24]">
                      Busana:
                    </strong>{" "}
                    {event.dressCode}
                  </p>
                )}
              </div>

              {/* Action Buttons (44px+ min height) */}
              <div className="mt-7 flex flex-col gap-3 sm:flex-row">
                <a
                  href={buildGoogleCalendarUrl(event, config.couple)}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex min-h-11 flex-1 items-center justify-center gap-2 rounded-sm bg-[#243830] px-4 py-2.5 text-xs font-semibold uppercase tracking-[0.14em] text-[#FAF7F2] transition-colors hover:bg-[#1C2B24]"
                >
                  <CalendarPlus className="h-4 w-4 text-[#E5D1A7]" />
                  <span>Simpan ke Kalender</span>
                </a>

                <a
                  href={event.googleMapsUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex min-h-11 flex-1 items-center justify-center gap-2 rounded-sm border border-[#C5A059]/55 bg-[#FAF7F2] px-4 py-2.5 text-xs font-semibold uppercase tracking-[0.14em] text-[#243830] transition-colors hover:bg-[#F2ECE1]"
                >
                  <Navigation className="h-4 w-4 text-[#8A6825]" />
                  <span>Petunjuk Lokasi</span>
                </a>
              </div>
            </article>
          ))}
        </div>

        {/* Framed Venue Map Sheet */}
        <div className="mt-8 rounded-sm border border-[#C5A059]/40 bg-[#FAF7F2] p-4 sm:p-6">
          <div className="mb-4 flex flex-col justify-between gap-3 sm:flex-row sm:items-center">
            <div>
              <h3 className="font-serif-luxury text-2xl font-semibold text-[#1C2B24]">
                Peta Lokasi: {primaryEvent.venueName}
              </h3>
              <p className="text-xs text-[#4A6358]">
                {primaryEvent.venueAddress}
              </p>
            </div>
            <a
              href={primaryEvent.googleMapsUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex min-h-11 items-center gap-2 self-start rounded-sm border border-[#C5A059]/50 bg-[#F2ECE1] px-4 py-2 text-xs font-semibold uppercase tracking-[0.14em] text-[#243830] transition-colors hover:bg-[#E5D1A7]/40 sm:self-auto"
            >
              <Navigation className="h-3.5 w-3.5 text-[#8A6825]" />
              <span>Buka di Google Maps</span>
            </a>
          </div>

          <div className="relative h-72 w-full overflow-hidden rounded-sm border border-[#C5A059]/30 sm:h-80">
            <iframe
              title={`Peta Lokasi ${primaryEvent.venueName}`}
              src={primaryEvent.googleMapsEmbedUrl}
              width="800"
              height="360"
              className="h-full w-full border-0"
              loading="lazy"
              referrerPolicy="no-referrer-when-downgrade"
              allowFullScreen
            />
          </div>
        </div>
      </div>
    </section>
  );
}
