# Project Rules

## 1. Wajib Jalankan Test & Verifikasi Setelah Perubahan
- Setiap kali melakukan perubahan kode, **selalu** jalankan verifikasi sebelum melaporkan tugas selesai:
  1. `npx tsc --noEmit` untuk memastikan tidak ada error TypeScript.
  2. `npm run build` untuk memastikan build produksi Next.js dan pengecekan tipe/linting berjalan sukses.
  3. Jika terdapat skrip unit/integration test di `package.json` (`npm test`), jalankan juga hingga seluruh test lolos.
- Jangan menyatakan perubahan selesai atau aman jika ada pengecekan yang gagal.

## 2. Wajib Cek Sampai Deploy Berhasil Saat Diminta Push
- Ketika user meminta untuk **push** perubahan:
  1. Pastikan seluruh test dan `npm run build` sudah dijalankan dan lolos setelah edit terakhir sebelum melakukan `git commit` dan `git push`.
  2. Setelah `git push` selesai, **pantau status deployment** (proyek ini menggunakan Vercel via `vercel.json` dan GitHub `origin`) menggunakan `vercel ls` / `vercel inspect` atau `gh` CLI (`gh api` status/deployments) sampai deployment untuk commit yang baru di-push benar-benar selesai dan berstatus **Ready / success**.
  3. Laporkan hasil push beserta status akhir deployment (termasuk URL deployment jika tersedia). Jika deployment gagal atau CLI tidak terautentikasi, segera laporkan error yang ditemukan.

