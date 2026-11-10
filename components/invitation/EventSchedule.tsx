"use client";

import React, { useEffect, useState } from "react";
import { motion } from "framer-motion";
import {
  CalendarPlus,
  Clock,
  MapPin,
  Navigation,
  Sparkles,
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

  return (
    <section
      id="acara"
      className="relative overflow-hidden bg-[#F2ECE1]/70 py-20 px-4 sm:px-6 lg:px-8"
    >
      <div className="mx-auto max-w-5xl">
        {/* Section Heading */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-60px" }}
          transition={{ duration: 0.7 }}
          className="text-center"
        >
          <span className="inline-flex items-center gap-2 rounded-full border border-[#C5A059]/40 bg-[#FAF7F2] px-4 py-1 text-[11px] font-medium uppercase tracking-[0.25em] text-[#243830]">
            <Sparkles className="h-3.5 w-3.5 text-[#C5A059]" />
            Rangkaian Acara
          </span>
          <h2 className="mt-4 font-serif-luxury text-4xl font-semibold text-[#1C2B24] sm:text-5xl">
            Waktu &amp; Tempat Bahagia
          </h2>
          <p className="mx-auto mt-3 max-w-xl text-sm leading-relaxed text-[#4A6358]">
            Dengan memohon rahmat dan ridho Allah SWT, kami bermaksud
            menyelenggarakan rangkaian acara pernikahan kami pada:
          </p>
        </motion.div>

        {/* Live Countdown Card */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.7, delay: 0.1 }}
          className="mx-auto mt-10 max-w-3xl rounded-3xl border border-[#C5A059]/35 bg-[#1C2B24] p-6 text-[#FAF7F2] shadow-xl sm:p-8"
        >
          <p className="text-center text-xs uppercase tracking-[0.28em] text-[#E5D1A7]">
            Menuju Hari Bahagia • {config.couple.weddingDateDisplay}
          </p>

          <div className="mt-5 grid grid-cols-4 gap-3 sm:gap-5">
            {countdownItems.map((item) => (
              <div
                key={item.label}
                className="flex flex-col items-center justify-center rounded-2xl border border-[#C5A059]/30 bg-[#243830]/90 px-2 py-4 text-center shadow-inner sm:py-5"
              >
                <span className="font-serif-luxury text-3xl font-bold tracking-wider text-[#E5D1A7] sm:text-5xl">
                  {String(item.value).padStart(2, "0")}
                </span>
                <span className="mt-1 text-[10px] font-medium uppercase tracking-[0.2em] text-[#FAF7F2]/75 sm:text-xs">
                  {item.label}
                </span>
              </div>
            ))}
          </div>
        </motion.div>

        {/* Event Cards Grid (Akad & Resepsi) */}
        <div className="mt-12 grid grid-cols-1 gap-8 md:grid-cols-2">
          {config.events.map(
            (event: WeddingEventDetail, idx: number) => (
              <motion.div
                key={event.id}
                initial={{ opacity: 0, y: 24 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.7, delay: idx * 0.15 }}
                className="group relative flex flex-col justify-between overflow-hidden rounded-3xl border border-[#C5A059]/35 bg-[#FAF7F2] p-7 shadow-[0_14px_40px_rgba(36,56,48,0.07)] sm:p-9"
              >
                {/* Decorative top accent */}
                <div className="absolute inset-x-0 top-0 h-1.5 bg-gradient-to-r from-[#243830] via-[#C5A059] to-[#243830]" />

                <div>
                  <div className="flex items-center justify-between gap-2">
                    <span className="rounded-full border border-[#C5A059]/35 bg-[#F2ECE1] px-3.5 py-1 text-[11px] font-semibold uppercase tracking-[0.2em] text-[#243830]">
                      {event.subtitle}
                    </span>
                    <span className="font-serif-luxury text-sm italic text-[#C5A059]">
                      0{idx + 1}
                    </span>
                  </div>

                  <h3 className="mt-4 font-serif-luxury text-3xl font-semibold text-[#1C2B24] sm:text-4xl">
                    {event.title}
                  </h3>

                  <div className="mt-6 space-y-3.5 border-y border-[#C5A059]/25 py-5 text-sm text-[#222624]">
                    <div className="flex items-start gap-3">
                      <Calendar className="mt-0.5 h-4 w-4 shrink-0 text-[#C5A059]" />
                      <div>
                        <p className="font-semibold text-[#1C2B24]">
                          {event.dateDisplay}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-start gap-3">
                      <Clock className="mt-0.5 h-4 w-4 shrink-0 text-[#C5A059]" />
                      <div>
                        <p className="font-medium text-[#243830]">
                          {event.timeDisplay}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-start gap-3">
                      <MapPin className="mt-0.5 h-4 w-4 shrink-0 text-[#C5A059]" />
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


                </div>

                {/* Action Buttons */}
                <div className="mt-7 flex flex-col gap-3 sm:flex-row">
                  <a
                    href={buildGoogleCalendarUrl(event, config.couple)}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex flex-1 items-center justify-center gap-2 rounded-xl bg-[#243830] px-4 py-3 text-xs font-medium tracking-wide text-[#FAF7F2] shadow-sm transition-colors hover:bg-[#1C2B24]"
                  >
                    <CalendarPlus className="h-4 w-4 text-[#E5D1A7]" />
                    <span>Add to Google Calendar</span>
                  </a>

                  <a
                    href={event.googleMapsUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex flex-1 items-center justify-center gap-2 rounded-xl border border-[#C5A059]/50 bg-[#FAF7F2] px-4 py-3 text-xs font-semibold tracking-wide text-[#243830] transition-colors hover:bg-[#F2ECE1]"
                  >
                    <Navigation className="h-4 w-4 text-[#C5A059]" />
                    <span>Petunjuk Lokasi</span>
                  </a>
                </div>
              </motion.div>
            )
          )}
        </div>

        {/* Embedded Google Maps */}
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.7, delay: 0.2 }}
          className="mt-10 overflow-hidden rounded-3xl border-2 border-[#C5A059]/40 bg-[#FAF7F2] p-3 shadow-lg sm:p-4"
        >
          <div className="mb-3 flex flex-col justify-between gap-2 px-2 sm:flex-row sm:items-center">
            <div>
              <h4 className="font-serif-luxury text-xl font-semibold text-[#1C2B24]">
                Peta Lokasi — {primaryEvent.venueName}
              </h4>
              <p className="text-xs text-[#4A6358]">
                {primaryEvent.venueAddress}
              </p>
            </div>
            <a
              href={primaryEvent.googleMapsUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 self-start rounded-full border border-[#C5A059]/40 bg-[#F2ECE1] px-3.5 py-1.5 text-xs font-medium text-[#243830] transition-colors hover:bg-[#E5D1A7]/40 sm:self-auto"
            >
              <Navigation className="h-3.5 w-3.5 text-[#C5A059]" />
              <span>Buka di Aplikasi Google Maps</span>
            </a>
          </div>

          <div className="relative h-72 w-full overflow-hidden rounded-2xl border border-[#C5A059]/25 sm:h-80">
            <iframe
              title={`Lokasi Pernikahan ${primaryEvent.venueName}`}
              src={primaryEvent.googleMapsEmbedUrl}
              className="h-full w-full border-0"
              loading="lazy"
              referrerPolicy="no-referrer-when-downgrade"
              allowFullScreen
            />
          </div>
        </motion.div>
      </div>
    </section>
  );
}
