# Digital Wedding Invitation Platform & Admin Dashboard

Aplikasi undangan pernikahan digital interaktif (*Luxury Botanical & Warm Ivory*) dan *Admin Back-Office Dashboard* berbasis **Next.js 15 (App Router)**, **TypeScript**, **Tailwind CSS**, **Framer Motion**, **Zod**, dan **Supabase PostgreSQL**.

---

## Struktur Arsitektur & Multi-Agent

Definisi spesifikasi multi-agent tersedia di dalam direktori `.agents/agents/`:
- [`.agents/agents/orchestrator.md`](./.agents/agents/orchestrator.md)
- [`.agents/agents/backend-data-agent.md`](./.agents/agents/backend-data-agent.md)
- [`.agents/agents/wedding-ui-agent.md`](./.agents/agents/wedding-ui-agent.md)
- [`.agents/agents/dashboard-agent.md`](./.agents/agents/dashboard-agent.md)

### Daftar File Utama

1. **Backend & Database (`backend-data-agent`)**
   - `supabase/migrations/001_initial_schema.sql`: Skema tabel PostgreSQL (`guests`, `rsvps`, `wishes`), Row-Level Security (RLS) policies, publikasi Supabase Realtime, dan *seed data* awal.
   - `lib/supabase/client.ts` & `lib/supabase/server.ts`: Helper client/server Supabase SSR (`@supabase/ssr`).
   - `lib/supabase/repository.ts`: *Dual-mode data layer* (otomatis menggunakan Supabase PostgreSQL saat kredensial tersedia, dan memiliki *fallback* lokal `.data/local-db.json` agar dapat langsung diuji tanpa error).
   - `app/api/rsvp/route.ts`: Validasi input (Zod), penegakan **Strict Invite-Only** berdasarkan daftar `guests`, pembatasan `pax <= max_pax`, dan mekanisme **upsert**.
   - `app/api/wishes/route.ts`: Sanitasi input anti-XSS, penyimpanan ucapan, moderasi hapus ucapan, dan daftar ucapan terbaru.
   - `app/api/guests/route.ts`: Endpoint CRUD penuh untuk manajemen tamu undangan.
   - `app/api/admin/auth/route.ts`: Autentikasi admin (mendukung Supabase Auth & password `.env`).

2. **Public Wedding Invitation (`wedding-ui-agent`)**
   - `app/(invitation)/page.tsx`: Server Component yang membaca query parameter `?to=` secara asynchronous (`searchParams`), mendekode nama tamu dengan fallback `"Tamu Undangan"`, dan memuat status tamu/RSVP dari database.
   - `components/invitation/CoverOverlay.tsx`: Cover full-screen elegan dengan nama tamu, badge kategori, dan tombol **"Buka Undangan"** yang memicu transisi Framer Motion sekaligus membuka kunci Web Audio API.
   - `components/invitation/AudioController.tsx`: Tombol musik mengambang (play/pause/mute) yang aman dari *browser autoplay policy* (mendukung file MP3 maupun synthesizer Web Audio API).
   - `components/invitation/EventSchedule.tsx`: Jadwal Akad Nikah & Resepsi, *countdown timer*, tombol **"Add to Google Calendar"** dinamis, dan *embed* Google Maps.
   - `components/invitation/RsvpForm.tsx`: Form RSVP interaktif (*Strict Invite-Only*) dengan nama tamu terkunci sesuai `?to=`, batas `pax` dinamis sesuai `max_pax`, dan dukungan *upsert*.
   - `components/invitation/WishWall.tsx`: Dinding ucapan & doa restu dengan *optimistic UI update* dan *Supabase Realtime subscription*.
   - `components/invitation/GiftSection.tsx`: Amplop digital (rekening bank & modal QRIS) dengan fitur *copy-to-clipboard* instan.

3. **Admin Dashboard (`dashboard-agent`)**
   - `middleware.ts`: Proteksi route `/admin/*` (kecuali `/admin/login`).
   - `app/admin/login/page.tsx`: Halaman login Admin Back-Office.
   - `app/admin/layout.tsx` & `components/admin/AdminSidebar.tsx`: Layout dashboard responsif dengan navigasi sidebar (**Dashboard**, **Guests**, **RSVP**, **Wishes**).
   - `app/admin/page.tsx`: Ringkasan metrik (**Total Tamu**, **Jumlah Hadir**, **Estimasi Pax**, **Total Ucapan**).
   - `app/admin/guests/page.tsx`: Tabel manajemen tamu dengan modal tambah/edit tamu serta tombol **"Kirim WhatsApp"** (`https://wa.me/`) berisi pesan personal dan tautan `?to=...` otomatis.
   - `app/admin/rsvp/page.tsx`: Monitoring daftar RSVP & fitur Export CSV.
   - `app/admin/wishes/page.tsx`: Moderasi & penghapusan ucapan tamu.

---

## Cara Menjalankan di Lokal

1. Jalankan server development:
   ```bash
   npm run dev
   ```
2. Buka di browser:
   - **Undangan Publik (Umum)**: `http://localhost:3000`
   - **Undangan Publik (Tamu Terdaftar - Strict Invite-Only)**: `http://localhost:3000/?to=Budi%20Santoso`
   - **Admin Dashboard**: `http://localhost:3000/admin` (Login via Supabase Auth)

---

## Cara Deploy ke Vercel dengan Supabase (PostgreSQL)

1. Buat proyek baru di [Supabase](https://supabase.com), buka menu **SQL Editor**, lalu jalankan isi file `supabase/migrations/001_initial_schema.sql`.
2. Buat akun admin di Supabase Dashboard melalui menu **Authentication > Users** (Add user / Create user dengan email & password admin Anda).
3. Push repositori ini ke GitHub dan import ke [Vercel](https://vercel.com).
4. Tambahkan *Environment Variables* berikut di pengaturan proyek Vercel:
   - `NEXT_PUBLIC_SUPABASE_URL` = URL proyek Supabase Anda
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY` = Anon/Public Key Supabase Anda
5. Klik **Deploy**.

