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
  dressCode?: string;
}

export const WEDDING_CONFIG = {
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
      dressCode: "Busana Formal / Batik Nuansa Sage & Ivory",
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
      dressCode: "Formal Attire / Earthy Botanical Palette",
    },
  ] satisfies WeddingEventDetail[],
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
    ] satisfies BankAccount[],
    qris: {
      merchantName: "ARKA & NADIA WEDDING GIFT",
      nmid: "ID1026098877665",
      codePayload:
        "00020101021126610014COM.GO-JEK.WWW01189360091431234567890210G1234567890303UMI51440014ID.CO.QRIS.WWW0215ID10260988776650303UMI5204599953033605802ID5924ARKA NADIA WEDDING GIFT6015JAKARTA SELATAN6105121606304A1B2",
    },
    shippingAddress: {
      recipient: "Arka Wijaya & Nadia Maharani",
      phone: "0812-8899-0011",
      address:
        "Cluster Botanica Residence Blok B7 No. 12, Kebayoran Baru, Jakarta Selatan 12160",
    },
  },
  audio: {
    title: "Clair de Lune, Romantic Piano Suite",
    artist: "Instrumental Chamber Ensemble",
    src: "/audio/wedding-theme.mp3",
  },
} as const;

export function buildGoogleCalendarUrl(event: WeddingEventDetail): string {
  const title = `${event.title}: Pernikahan ${WEDDING_CONFIG.couple.groom.nickname} & ${WEDDING_CONFIG.couple.bride.nickname}`;
  const details = `Undangan Pernikahan ${WEDDING_CONFIG.couple.groom.fullName} & ${WEDDING_CONFIG.couple.bride.fullName}.\n\nAcara: ${event.title} (${event.timeDisplay})\nLokasi: ${event.venueName}, ${event.venueAddress}`;
  const params = new URLSearchParams({
    action: "TEMPLATE",
    text: title,
    dates: `${event.startIso}/${event.endIso}`,
    details,
    location: `${event.venueName}, ${event.venueAddress}`,
  });

  return `https://calendar.google.com/calendar/render?${params.toString()}`;
}
