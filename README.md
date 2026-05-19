# 🌿 Ciburial Eco-Digital Village

Inovasi Desa Mandiri Berbasis Kearifan Lokal dan Teknologi Masa Depan.

Website resmi Kampung Ciburial — desa inovatif di Garut, Jawa Barat yang mengawinkan kekayaan alam organik dengan literasi teknologi digital.

## ✨ Fitur Utama

- **🎨 HEROIC Design System** — Tampilan UI/UX modern, responsif, dan elegan (Dark Mode, Command Palette, Scroll Reveal).
- **🪪 NFC Integration** — Smart card warga untuk presensi Posyandu, Ronda, dan transaksi (Support Web NFC API).
- **📊 Transparansi Dana** — Tracking pemasukan/pengeluaran desa secara real-time.
- **🛒 Smart Marketplace** — Jual-beli produk lokal (kerajinan bambu, sayur organik, kompos) terintegrasi dengan Payment Gateway (Midtrans).
- **📦 Order Tracking** — Lacak status pesanan secara real-time.
- **👶 Posyandu & Tumbuh Kembang** — Sistem monitoring kesehatan anak dan pencegahan stunting.
- **📅 Kalender Kegiatan** — Agenda dan jadwal aktivitas rutin kampung.
- **📢 Pengaduan Warga** — Sistem laporan dan aspirasi masyarakat yang terpusat.
- **🗳️ E-Voting** — Musyawarah dan pengambilan keputusan secara digital (Live Result).
- **♻️ Bank Sampah & Eco-Reward** — Tukar poin digital dari hasil mengumpulkan sampah.
- **🕌 Widget Sholat & Cuaca** — Info real-time terintegrasi untuk warga.
- **🤖 Ciburial AI** — Asisten chatbot digital kampung (powered by Groq Llama 3).
- **👮 Ronda & Zakat** — Manajemen jadwal keamanan lingkungan dan perhitungan zakat otomatis.

## 🛠 Tech Stack

- **Framework**: [Next.js 16](https://nextjs.org) (App Router, Turbopack)
- **Language**: TypeScript
- **Database**: [Supabase](https://supabase.com) (PostgreSQL + RLS + Realtime)
- **Styling**: [Tailwind CSS v4](https://tailwindcss.com) + HEROIC CSS Custom Properties
- **Payment**: [Midtrans](https://midtrans.com)
- **AI**: [Groq API](https://groq.com) (Llama 3.3 70B)
- **Deployment**: [Vercel](https://vercel.com)

## 🚀 Getting Started

1. **Clone & Install**
   ```bash
   git clone https://github.com/Karimkusin88/ciburial-eco-digital.git
   cd ciburial-eco-digital
   npm install
   ```

2. **Setup Environment**
   Buat file `.env.local` di root folder dan isi dengan credentials berikut:
   ```env
   NEXT_PUBLIC_SUPABASE_URL=https://xxxx.supabase.co
   NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhb...
   NEXT_PUBLIC_ADMIN_PASSWORD=passwordkamu
   GROQ_API_KEY=gsk_xxx...
   ```

3. **Setup Database**
   Jalankan SQL schema yang ada di `lib/supabase.ts` di Supabase SQL Editor untuk inisialisasi tabel dan RLS (Row Level Security).

4. **Run Development Server**
   ```bash
   npm run dev
   ```
   Buka [http://localhost:3000](http://localhost:3000).

## 📁 Struktur Project Utama

```
app/
├── (routes)/           # Route publik (Homepage, Tentang, Kegiatan, dll)
├── admin/              # Panel admin sistem desa
│   ├── bank-sampah/
│   ├── dashboard/
│   ├── kalender/
│   ├── orders/
│   ├── posyandu/
│   ├── ronda/
│   ├── voting/
│   ├── warga/
│   └── zakat/
├── ai/                 # Halaman chatbot Ciburial AI
├── api/                # API routes (Midtrans, Groq, Sync, Webhooks)
├── cek-pesanan/        # Cek status pesanan publik
├── pengaduan/          # Portal aspirasi warga
├── tukar-poin/         # Penukaran eco-reward
├── voting/             # Modul e-voting warga
│   └── live/           # Live result display
components/
├── home/               # Komponen UI homepage tab-based
└── ui/                 # Reusable primitive UI (Skeleton, CommandPalette, dll)
lib/
├── ecoReward.ts        # Core logic sistem poin Bank Sampah
└── supabase.ts         # Inisialisasi Supabase & skema referensi
```

## 📍 Lokasi

Kp. Ciburial, Desa Hanjuang, Kec. Bungbulang, Kab. Garut, Jawa Barat 44165

## 📧 Kontak

- Email: ciburial.smarthub@gmail.com
- Website: [ciburial-eco-digital.vercel.app](https://ciburial-eco-digital.vercel.app)

## 📝 License

© 2026 Ciburial Eco-Digital Village. All Rights Reserved.
