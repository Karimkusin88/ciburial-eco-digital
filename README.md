# 🌿 Ciburial Eco-Digital Village

Inovasi Desa Mandiri Berbasis Kearifan Lokal dan Teknologi Masa Depan.

Website resmi Kampung Ciburial — desa inovatif di Garut, Jawa Barat yang mengawinkan kekayaan alam organik dengan literasi teknologi digital.

## ✨ Fitur

- **📊 Transparansi Dana** — Tracking pemasukan/pengeluaran real-time
- **🛒 Marketplace** — Produk kerajinan bambu, sayur organik, kompos
- **📅 Kalender Kegiatan** — Agenda dan jadwal kampung
- **📢 Pengaduan Warga** — Sistem laporan dan aspirasi
- **🗳️ Voting** — Musyawarah digital warga
- **♻️ Tukar Poin** — Reward Bank Sampah digital (Eco-Reward)
- **🤖 Ciburial AI** — Asisten digital kampung (powered by Groq)
- **🕌 Widget Sholat & Cuaca** — Info real-time untuk warga
- **🔐 Admin Panel** — Kelola kegiatan, produk, dan transaksi

## 🛠 Tech Stack

- **Framework**: [Next.js 16](https://nextjs.org) (App Router)
- **Database**: [Supabase](https://supabase.com) (PostgreSQL + Realtime)
- **Styling**: [Tailwind CSS v4](https://tailwindcss.com) + CSS Custom Properties
- **AI**: [Groq API](https://groq.com) (Llama 3.3 70B)
- **Deployment**: [Vercel](https://vercel.com)

## 🚀 Getting Started

1. **Clone & Install**
   ```bash
   git clone https://github.com/your-repo/ciburial-eco-digital.git
   cd ciburial-eco-digital
   npm install
   ```

2. **Setup Environment**
   ```bash
   cp .env.example .env.local
   ```
   Isi variabel di `.env.local` dengan credentials Supabase dan Groq API key.

3. **Setup Database**
   Jalankan SQL yang ada di `lib/supabase.ts` di Supabase SQL Editor.

4. **Run Development Server**
   ```bash
   npm run dev
   ```
   Buka [http://localhost:3000](http://localhost:3000).

## 📁 Struktur Project

```
app/
├── page.tsx           # Homepage (Tentang, Kegiatan, Proposal, Transparansi, Marketplace)
├── admin/             # Panel admin (CRUD kegiatan, produk, transaksi)
│   ├── page.tsx
│   ├── bank-sampah/
│   ├── dashboard/
│   ├── kalender/
│   ├── posyandu/
│   ├── ronda/
│   ├── voting/
│   ├── warga/
│   └── zakat/
├── ai/                # Halaman chatbot AI
├── api/ai/            # API route untuk Groq integration
├── kalender/          # Kalender kegiatan publik
├── pengaduan/         # Pengaduan & aspirasi warga
├── voting/            # Voting digital
└── tukar-poin/        # Tukar poin Bank Sampah
components/
└── CuacaSholatWidget.tsx  # Widget cuaca & jadwal sholat
lib/
├── supabase.ts        # Supabase client + SQL schema
└── ecoReward.ts       # Sistem poin eco-reward
```

## 📍 Lokasi

Kp. Ciburial, Desa Hanjuang, Kec. Bungbulang, Kab. Garut, Jawa Barat 44165

## 📧 Kontak

- Email: ciburial.smarthub@gmail.com
- Website: [ciburial-eco-digital.vercel.app](https://ciburial-eco-digital.vercel.app)

## 📝 License

© 2026 Ciburial Eco-Digital Village. All Rights Reserved.
