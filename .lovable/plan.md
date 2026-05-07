Saya kelompokkan 20 item ke 4 batch supaya bisa dikerjakan bertahap dan diverifikasi per batch. Beberapa item saling terkait (mis. onboarding ↔ visibility ↔ My Portfolio) jadi dikerjakan satu paket.

## Batch 1 — Quick Wins (UI/Form, low risk)

1. **#1 Footer** — sisakan hanya menu yang punya halaman aktif: `Explore`, `Login`, `Register`. Hapus Pricing/About/Help/Blog/Contact/Terms/Privacy/Cookies. Sederhanakan struktur footer jadi 1 baris link + copyright.
2. **#13 Sign In show/hide password** — toggle ikon mata di `Login.tsx`.
3. **#14 Popup "Cek email"** — setelah register sukses, tampilkan dialog dengan tombol "Buka Email" (`mailto:` + link ke `https://mail.google.com`).
4. **#12 User popup menu** — di Navbar (Home/Explore) tampilkan `Dashboard | Sign Out` saja; di dashboard biarkan apa adanya.
5. **#19 Sidebar Settings** — verifikasi sudah ada (sudah ditambahkan sebelumnya).
6. **#7 Add Skill max 6** — batasi di `EditSkillsDialog` & onboarding TagInput; sembunyikan tombol/input setelah 6.
7. **#6 Short bio 150–300 char + counter** — di Register & onboarding/profile setup.

## Batch 2 — Explore & Home Recommendations

8. **#2 Filter modal** — `Explore.tsx`: tombol "Filter" buka Dialog berisi select Profession + Location. Filter aktif jadi chip dengan ✕, tombol "Reset Filter".
9. **#3 Skill tags hanya saat aktif** — bagian skill chips hanya tampil saat ada filter skill aktif.
10. **#9 Home rekomendasi post-login** — query profil dengan profession/skill mirip user saat login (fallback ke top-liked); tambah section "Project rekomendasi" dari portfolio_items user lain dengan tag/profesi serupa.

## Batch 3 — Onboarding, Visibility & Profile

11. **#5 Register tambah Username + Short Bio** — tambah field di `Register.tsx`, simpan ke `raw_user_meta_data` (handler `handle_new_user` sudah pakai username).
12. **#8 Onboarding multi-step portfolio** — refaktor `Onboarding.tsx` jadi steps: Profil dasar → Education → Experience → Project → Contact → Visibility(Public/Private) → Submit. Masing-masing skippable. Tambah kolom `onboarding_completed boolean` di `profiles`. Guard di App: jika login & belum complete → redirect `/onboarding`.
13. **#17 Pindah Visibility ke Overview, hapus My Portfolio** — hapus route & menu `/dashboard/portfolio`, pindahkan toggle Public/Private ke `Overview.tsx` (atau Settings sesuai poin). Sesuai #17 user bilang "halaman Overview (di Settings)" → tempatkan toggle di Settings page bagian Overview/Account.
14. **#18 Edit Profile tambah section + Download CV** — verifikasi tombol Download CV sudah ada; pastikan section Project/Education/Experience/Contact ada (sudah dibuat sebelumnya, tinggal cek).
15. **#10 Navigasi utama 4 item** — MobileBottomTabs: Home, Messages, Notifications, Settings. Settings page berisi: Edit Profile, Overview, Reset Password, Logout, dengan tombol Back di header.

## Batch 4 — Chat, Auth Flow, AI CV

16. **#4 Forgot password OTP flow** — buat halaman `/forgot-password` (input email → kirim OTP via `supabase.auth.signInWithOtp` type=recovery atau `resetPasswordForEmail`), `/reset-password` (verify OTP + set password baru). Catatan: Supabase recovery default = magic link; untuk OTP gunakan `verifyOtp({type:'recovery', token, email})`.
17. **#11 Chat realtime** — di `Inbox.tsx` pastikan subscribe `postgres_changes` pada `messages` filter receiver/sender = current thread, dan append ke state tanpa refresh. Sudah sebagian ada, butuh fix listener untuk thread aktif.
18. **#20 Copy message** — context menu / long-press di bubble chat → `navigator.clipboard.writeText`.
19. **#15 + #16 AI CV generate & layout PDF** — edge function `extract-cv` sudah ada; pastikan dipanggil dari Edit Profile, hasilnya di-merge ke data CV. Perbaiki `cv-pdf.tsx` (hierarchy heading, spacing konsisten, sections lengkap: Education/Experience/Project/Contact/Skills).

## Database changes yang dibutuhkan

- `ALTER TABLE profiles ADD COLUMN onboarding_completed boolean NOT NULL DEFAULT false;` (untuk #8)
- Tidak ada perubahan schema lain yang diperlukan.

## Risiko & catatan

- **Realtime chat**: harus pakai channel name unik (Math.random) untuk hindari konflik subscribe ganda di StrictMode (sudah pernah jadi penyebab blank page).
- **Onboarding guard**: jangan terlalu agresif — kecualikan route `/login`, `/register`, `/forgot-password`, `/onboarding`, `/suspended`.
- **Forgot password OTP**: Supabase mengirim 6-digit OTP di email recovery template default — pastikan template menampilkan `{{ .Token }}` (kalau auth-email-hook custom belum diaktifkan, default OK).
- **AI CV**: gunakan Lovable AI Gateway (`google/gemini-2.5-flash`) untuk hemat credit, output JSON terstruktur lalu render via `cv-pdf.tsx`. Jangan loop AI; satu panggilan per generate.
- **My Portfolio dihapus**: pastikan tidak ada link tersisa yang mengarah ke `/dashboard/portfolio`.

## Urutan eksekusi yang saya sarankan

Batch 1 → 2 → 3 → 4. Tiap akhir batch saya verifikasi build & beri ringkasan singkat sebelum lanjut.

## Yang ingin saya konfirmasi sebelum mulai

1. **Visibility** (#17): user bilang "di halaman Overview (di Settings)". Saat ini Overview = halaman dashboard terpisah. Apakah dileburkan jadi tab di Settings, atau Overview tetap halaman sendiri tapi toggle visibility ditaruh di Settings? → Saya akan **taruh toggle di Settings** (sesuai literal request) dan biarkan Overview tetap sebagai dashboard utama.
2. **Hapus My Portfolio** (#17): apakah halaman edit project/portfolio item juga dihapus, atau cuma menu sidebar-nya? → Saya akan **hapus menu sidebar saja**, fungsionalitas edit project tetap tersedia via Edit Profile (#18).
3. **Onboarding guard** (#8): apakah user existing yang sudah punya profil dianggap sudah selesai onboarding? → Saya akan set `onboarding_completed = true` untuk semua user existing supaya tidak terjebak.

Jika Anda OK dengan rencana & 3 asumsi di atas, saya langsung mulai dari Batch 1.