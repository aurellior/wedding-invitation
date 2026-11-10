import type { Metadata } from "next";
import { Cormorant_Garamond, Plus_Jakarta_Sans } from "next/font/google";
import "./globals.css";
import { getWeddingConfig } from "@/lib/supabase/repository";

const cormorant = Cormorant_Garamond({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  style: ["normal", "italic"],
  variable: "--font-serif",
});

const jakarta = Plus_Jakarta_Sans({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  variable: "--font-sans",
});

export async function generateMetadata(): Promise<Metadata> {
  const config = await getWeddingConfig();
  return {
    title: `The Wedding of ${config.couple.groom.nickname} & ${config.couple.bride.nickname} — ${config.couple.weddingDateDisplay}`,
    description: `Undangan Pernikahan Digital ${config.couple.groom.fullName} & ${config.couple.bride.fullName}. ${config.couple.weddingDateDisplay}.`,
  };
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="id"
      className={`${cormorant.variable} ${jakarta.variable} antialiased`}
    >
      <body className="min-h-screen bg-[#FAF7F2] text-[#222624] selection:bg-[#C5A059]/30 selection:text-[#243830]">
        {children}
      </body>
    </html>
  );
}

