export interface BankAccount {
  id: string;
  bankName: string;
  accountNumber: string;
  accountHolder: string;
  branch?: string;
}

export interface WeddingEventDetail {
  id: "akad" | "resepsi";
  title: string;
  subtitle: string;
  dateDisplay: string;
  timeDisplay: string;
  startIso: string; // Format YYYYMMDDTHHmmssZ for Google Calendar
  endIso: string;
  venueName: string;
  venueAddress: string;
  googleMapsUrl: string;
  googleMapsEmbedUrl: string;
}

export interface PersonProfile {
  nickname: string;
  fullName: string;
  fatherName: string;
  motherName: string;
  childOrder: string;
  instagram: string;
}

export interface WeddingContentConfig {
  couple: {
    groom: PersonProfile;
    bride: PersonProfile;
    hashtag: string;
    weddingDateIso: string;
    weddingDateDisplay: string;
    shortDate: string;
  };
  quote: {
    arabic: string;
    translation: string;
    source: string;
  };
  events: WeddingEventDetail[];
  gifts: {
    accounts: BankAccount[];
  };
  audio: {
    title: string;
    artist: string;
    src: string;
  };
  whatsappTemplate: string;
}

export const DEFAULT_WHATSAPP_TEMPLATE = [
  "Kepada Yth. *{nama_tamu}*",
  "Di Tempat",
  "",
  "Assalamu’alaikum Warahmatullahi Wabarakatuh / Salam Sejahtera.",
  "",
  "Tanpa mengurangi rasa hormat, perkenankan kami mengundang Bapak/Ibu/Saudara/i untuk hadir dan memberikan doa restu pada acara pernikahan kami:",
  "",
  "*{mempelai_pria_lengkap}*",
  "&",
  "*{mempelai_wanita_lengkap}*",
  "",
  "📅 *Hari/Tanggal:* {tanggal_acara}",
  "🕌 *Akad Nikah:* {waktu_akad}",
  "🥂 *Resepsi:* {waktu_resepsi}",
  "📍 *Lokasi:* {lokasi_acara}",
  "",
  "Silakan buka tautan undangan digital personal berikut untuk informasi lengkap & konfirmasi kehadiran (RSVP):",
  "{link_undangan}",
  "",
  "Merupakan suatu kehormatan dan kebahagiaan bagi kami apabila Bapak/Ibu/Saudara/i berkenan hadir.",
  "",
  "Kami yang berbahagia,",
  "*{mempelai_pria} & {mempelai_wanita}*",
].join("\n");

export const DEFAULT_WEDDING_CONFIG: WeddingContentConfig = {
  couple: {
    groom: {
      nickname: "Arka",
      fullName: "Bagaskara Arka Wijaya, S.T., M.B.A.",
      fatherName: "Bpk. H. Hendra Wijaya",
      motherName: "Ibu Hj. Ratna Kusuma",
      childOrder: "Putra Pertama",
      instagram: "@arkawijaya",
    },
    bride: {
      nickname: "Nadia",
      fullName: "dr. Nadia Maharani Putri, Sp.DV",
      fatherName: "Bpk. Ir. Surya Pratama",
      motherName: "Ibu Dewi Anggraini, S.E.",
      childOrder: "Putri Kedua",
      instagram: "@nadiamaharani",
    },
    hashtag: "#ArkaFoundHisNadia",
    weddingDateIso: "2026-12-12T08:00:00+07:00",
    weddingDateDisplay: "Sabtu, 12 Desember 2026",
    shortDate: "12 . 12 . 2026",
  },
  quote: {
    arabic:
      "وَمِنْ آيَاتِهِ أَنْ خَلَقَ لَكُمْ مِنْ أَنْفُسِكُمْ أَزْوَاجًا لِتَسْكُنُوا إِلَيْهَا وَجَعَلَ بَيْنَكُمْ مَوَدَّةً وَرَحْمَةً",
    translation:
      "Dan di antara tanda-tanda (kebesaran)-Nya ialah Dia menciptakan pasangan-pasangan untukmu dari jenismu sendiri, agar kamu cenderung dan merasa tenteram kepadanya, dan Dia menjadikan di antaramu rasa kasih dan sayang.",
    source: "QS. Ar-Rum: 21",
  },
  events: [
    {
      id: "akad",
      title: "Akad Nikah",
      subtitle: "Ikrar Suci Pernikahan",
      dateDisplay: "Sabtu, 12 Desember 2026",
      timeDisplay: "08.00 - 10.00 WIB",
      startIso: "20261212T010000Z",
      endIso: "20261212T030000Z",
      venueName: "Glasshouse Ballroom, The Dharmawangsa Jakarta",
      venueAddress:
        "Jl. Brawijaya Raya No. 26, Kebayoran Baru, Jakarta Selatan 12160",
      googleMapsUrl:
        "https://maps.google.com/?q=The+Dharmawangsa+Jakarta+Kebayoran+Baru",
      googleMapsEmbedUrl:
        "https://www.google.com/maps?q=The+Dharmawangsa+Jakarta&output=embed",
    },
    {
      id: "resepsi",
      title: "Resepsi Pernikahan",
      subtitle: "Syukuran & Ramah Tamah",
      dateDisplay: "Sabtu, 12 Desember 2026",
      timeDisplay: "11.00 - 14.00 WIB",
      startIso: "20261212T040000Z",
      endIso: "20261212T070000Z",
      venueName: "Grand Ballroom, The Dharmawangsa Jakarta",
      venueAddress:
        "Jl. Brawijaya Raya No. 26, Kebayoran Baru, Jakarta Selatan 12160",
      googleMapsUrl:
        "https://maps.google.com/?q=The+Dharmawangsa+Jakarta+Kebayoran+Baru",
      googleMapsEmbedUrl:
        "https://www.google.com/maps?q=The+Dharmawangsa+Jakarta&output=embed",
    },
  ],
  gifts: {
    accounts: [
      {
        id: "bca",
        bankName: "Bank Central Asia (BCA)",
        accountNumber: "7140982341",
        accountHolder: "Bagaskara Arka Wijaya",
        branch: "KCU Pondok Indah, Jakarta",
      },
      {
        id: "mandiri",
        bankName: "Bank Mandiri",
        accountNumber: "1240009876543",
        accountHolder: "Nadia Maharani Putri",
        branch: "KCP Kebayoran Baru, Jakarta",
      },
    ],
  },
  audio: {
    title: "",
    artist: "",
    src: "",
  },
  whatsappTemplate: DEFAULT_WHATSAPP_TEMPLATE,
};

export const WEDDING_CONFIG = DEFAULT_WEDDING_CONFIG;

export function mergeWithDefaultConfig(
  partial?: Partial<WeddingContentConfig> | null
): WeddingContentConfig {
  if (!partial || typeof partial !== "object") {
    return structuredClone(DEFAULT_WEDDING_CONFIG);
  }

  return {
    couple: {
      groom: {
        ...DEFAULT_WEDDING_CONFIG.couple.groom,
        ...(partial.couple?.groom ?? {}),
      },
      bride: {
        ...DEFAULT_WEDDING_CONFIG.couple.bride,
        ...(partial.couple?.bride ?? {}),
      },
      hashtag:
        partial.couple?.hashtag ?? DEFAULT_WEDDING_CONFIG.couple.hashtag,
      weddingDateIso:
        partial.couple?.weddingDateIso ??
        DEFAULT_WEDDING_CONFIG.couple.weddingDateIso,
      weddingDateDisplay:
        partial.couple?.weddingDateDisplay ??
        DEFAULT_WEDDING_CONFIG.couple.weddingDateDisplay,
      shortDate:
        partial.couple?.shortDate ?? DEFAULT_WEDDING_CONFIG.couple.shortDate,
    },
    quote: {
      ...DEFAULT_WEDDING_CONFIG.quote,
      ...(partial.quote ?? {}),
    },
    events:
      Array.isArray(partial.events) && partial.events.length > 0
        ? partial.events.map((ev, idx) => ({
            ...(DEFAULT_WEDDING_CONFIG.events[idx] ??
              DEFAULT_WEDDING_CONFIG.events[0]),
            ...ev,
          }))
        : structuredClone(DEFAULT_WEDDING_CONFIG.events),
    gifts: {
      accounts:
        Array.isArray(partial.gifts?.accounts) &&
        partial.gifts.accounts.length > 0
          ? partial.gifts.accounts.map((acc) => ({ ...acc }))
          : structuredClone(DEFAULT_WEDDING_CONFIG.gifts.accounts),
    },
    audio: {
      ...DEFAULT_WEDDING_CONFIG.audio,
      ...(partial.audio ?? {}),
    },
    whatsappTemplate:
      typeof partial.whatsappTemplate === "string" &&
      partial.whatsappTemplate.trim().length > 0
        ? partial.whatsappTemplate
        : DEFAULT_WHATSAPP_TEMPLATE,
  };
}

export function renderWhatsAppTemplate(
  guestName: string,
  invitationUrl: string,
  config: WeddingContentConfig = DEFAULT_WEDDING_CONFIG
): string {
  const akad = config.events[0] ?? DEFAULT_WEDDING_CONFIG.events[0];
  const resepsi = config.events[1] ?? akad;
  const rawTemplate =
    config.whatsappTemplate && config.whatsappTemplate.trim().length > 0
      ? config.whatsappTemplate
      : DEFAULT_WHATSAPP_TEMPLATE;

  const replacements: Record<string, string> = {
    "{nama_tamu}": guestName,
    "{link_undangan}": invitationUrl,
    "{mempelai_pria}": config.couple.groom.nickname,
    "{mempelai_wanita}": config.couple.bride.nickname,
    "{mempelai_pria_lengkap}": config.couple.groom.fullName,
    "{mempelai_wanita_lengkap}": config.couple.bride.fullName,
    "{tanggal_acara}": config.couple.weddingDateDisplay,
    "{waktu_akad}": akad.timeDisplay,
    "{waktu_resepsi}": resepsi.timeDisplay,
    "{lokasi_acara}": resepsi.venueName,
    "{alamat_acara}": resepsi.venueAddress,
  };

  let output = rawTemplate;
  for (const [token, value] of Object.entries(replacements)) {
    output = output.split(token).join(value);
  }
  return output;
}

export function buildGoogleCalendarUrl(
  event: WeddingEventDetail,
  couple: WeddingContentConfig["couple"] = DEFAULT_WEDDING_CONFIG.couple
): string {
  const title = `${event.title}: Pernikahan ${couple.groom.nickname} & ${couple.bride.nickname}`;
  const details = `Undangan Pernikahan ${couple.groom.fullName} & ${couple.bride.fullName}.\n\nAcara: ${event.title} (${event.timeDisplay})\nLokasi: ${event.venueName}, ${event.venueAddress}`;
  const params = new URLSearchParams({
    action: "TEMPLATE",
    text: title,
    dates: `${event.startIso}/${event.endIso}`,
    details,
    location: `${event.venueName}, ${event.venueAddress}`,
  });

  return `https://calendar.google.com/calendar/render?${params.toString()}`;
}
