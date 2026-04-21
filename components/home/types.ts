// Shared types & data for the home page components

export type TabType = "tentang" | "kegiatan" | "proposal" | "transparansi" | "marketplace";

export interface Kegiatan {
  id: string;
  judul: string;
  tanggal: string;
  kategori: string;
  deskripsi: string;
  foto?: string;
  fotos?: string[];
}

export interface Produk {
  id: string;
  nama: string;
  deskripsi: string;
  harga: number;
  tag: string;
  icon: string;
  foto?: string;
}

export interface Transaksi {
  id: string;
  tanggal: string;
  keterangan: string;
  kategori: string;
  tipe: "masuk" | "keluar";
  jumlah: number;
}

export interface Testimoni {
  id: string;
  nama: string;
  jabatan: string;
  pesan: string;
  foto?: string;
  tipe: "tokoh" | "berita";
}

export interface Iklan {
  id: string;
  judul: string;
  deskripsi: string;
  mediaUrl: string;
  tipe: "video" | "foto";
  linkTujuan?: string;
}

export const fRp = (n: number) => "Rp " + n.toLocaleString("id-ID");

export const TABS = [
  { key: "tentang" as TabType, label: "Tentang Kampung" },
  { key: "kegiatan" as TabType, label: "Kegiatan" },
  { key: "proposal" as TabType, label: "Proposal" },
  { key: "transparansi" as TabType, label: "Transparansi Dana" },
  { key: "marketplace" as TabType, label: "Marketplace" },
];

export const KAT_CFG: Record<string, { label: string; bg: string; color: string }> = {
  keagamaan: { label: "🕌 Keagamaan", bg: "rgba(184,148,63,.1)", color: "#7A5A1E" },
  kemerdekaan: { label: "🇮🇩 Kemerdekaan", bg: "rgba(196,50,50,.09)", color: "#8B2020" },
  kemasyarakatan: { label: "🤝 Kemasyarakatan", bg: "rgba(28,58,43,.1)", color: "#1C3A2B" },
  "update-kampung": { label: "📍 Update Kampung", bg: "rgba(45,90,160,.09)", color: "#1A3A6B" },
};

export const ALOKASI = [
  { label: "Balai Serba Guna & Ruang Publik", target: 80000000, icon: "🏛️", color: "#2D5A40", desc: "Material konstruksi baja ringan & bambu" },
  { label: "Smart Farming & Peternakan Modern", target: 60000000, icon: "🌾", color: "#4A7C59", desc: "Infrastruktur kandang, bibit, instalasi kebun, pupuk" },
  { label: "Learning Hub", target: 45000000, icon: "📚", color: "#B8943F", desc: "PC/Laptop, server, perabotan, buku perpustakaan" },
  { label: "Smart PJU & Keamanan", target: 25000000, icon: "💡", color: "#1A3A6B", desc: "Panel surya, lampu DC, tiang, IP Camera CCTV" },
  { label: "Jaringan Internet (RT/RW Net)", target: 20000000, icon: "📶", color: "#6B4F3A", desc: "Router utama, kabel distribusi, Wi-Fi publik" },
  { label: "Operasional Digital & Eco-Waste", target: 20000000, icon: "♻️", color: "#8A7065", desc: "Alat press limbah, server/domain, marketplace" },
];

// ─── DEFAULT DATA (fallback sebelum Supabase dikonfigurasi) ─────────────────
export const DEF_KEG: Kegiatan[] = [
  { id: "d1", judul: "Pemasangan Smart PJU Perdana", tanggal: "2026-03-20", kategori: "update-kampung", deskripsi: "Milestone pertama! Smart PJU berbahan bambu berhasil dipasang di 2 titik strategis jalan utama Ciburial." },
  { id: "d2", judul: "HUT Kemerdekaan RI ke-81", tanggal: "2026-08-17", kategori: "kemerdekaan", deskripsi: "Perayaan HUT RI dengan lomba tradisional, upacara bendera, dan pentas seni pemuda Ciburial." },
  { id: "d3", judul: "Peringatan Maulid Nabi SAW", tanggal: "2026-09-10", kategori: "keagamaan", deskripsi: "Pengajian dan doa bersama seluruh warga memperingati Maulid Nabi Muhammad SAW." },
  { id: "d4", judul: "Musyawarah Pembentukan Bank Sampah", tanggal: "2026-02-10", kategori: "kemasyarakatan", deskripsi: "Rembug warga menyiapkan sistem Bank Sampah Digital Ciburial perdana." },
];

export const DEF_PROD: Produk[] = [
  { id: "p1", nama: "Lampu Hex-Bamboo", deskripsi: "Lampu tidur estetik anyaman bambu asli pegunungan. Cahaya hangat, aroma alami.", harga: 150000, tag: "Best Seller", icon: "🪔" },
  { id: "p2", nama: "Keranjang Anyam", deskripsi: "Kerajinan tangan warga, multifungsi dan ramah lingkungan untuk dekorasi.", harga: 85000, tag: "Handmade", icon: "🧺" },
  { id: "p3", nama: "Mini Pot Bambu", deskripsi: "Pot tanaman dari bambu pilihan. Natural, kuat, mempercantik ruangan.", harga: 60000, tag: "Eco", icon: "🌿" },
  { id: "p4", nama: "Kompos Organik", deskripsi: "Pupuk dari Bank Sampah Ciburial. 100% organik, baik untuk tanaman.", harga: 25000, tag: "Eco-Waste", icon: "🌱" },
  { id: "p5", nama: "Sayur Organik Box", deskripsi: "Sayuran segar dari ladang warga Ciburial, bebas pestisida kimia.", harga: 45000, tag: "Fresh Farm", icon: "🥬" },
  { id: "p6", nama: "Pigura Bambu", deskripsi: "Pigura foto artistik dari bambu terpilih. Cocok untuk dekorasi atau hadiah.", harga: 70000, tag: "Craft", icon: "🎋" },
];

export const DEF_TX: Transaksi[] = [
  { id: "t1", tanggal: "2026-01-15", keterangan: "Donasi Ust. Kurniadin & jamaah", kategori: "Donasi Warga", tipe: "masuk", jumlah: 500000 },
  { id: "t2", tanggal: "2026-01-20", keterangan: "Donasi CSR PT. Sejahtera Garut", kategori: "Donasi Institusi", tipe: "masuk", jumlah: 2000000 },
  { id: "t3", tanggal: "2026-02-01", keterangan: "Pembelian material tiang PJU (2 unit)", kategori: "Smart PJU & Keamanan", tipe: "keluar", jumlah: 850000 },
  { id: "t4", tanggal: "2026-02-05", keterangan: "Donasi online via QRIS (Februari)", kategori: "Donasi Online", tipe: "masuk", jumlah: 750000 },
  { id: "t5", tanggal: "2026-02-10", keterangan: "Pembelian LED Solar 20W (4 buah)", kategori: "Smart PJU & Keamanan", tipe: "keluar", jumlah: 480000 },
  { id: "t6", tanggal: "2026-02-18", keterangan: "Donasi perantau Ciburial (transfer)", kategori: "Donasi Perantau", tipe: "masuk", jumlah: 1200000 },
  { id: "t7", tanggal: "2026-03-01", keterangan: "Kas DKM bulan Maret", kategori: "DKM Masjid", tipe: "keluar", jumlah: 300000 },
  { id: "t8", tanggal: "2026-03-10", keterangan: "Pengadaan buku Learning Hub", kategori: "Learning Hub", tipe: "keluar", jumlah: 180000 },
  { id: "t9", tanggal: "2026-03-15", keterangan: "Donasi online via QRIS (Maret)", kategori: "Donasi Online", tipe: "masuk", jumlah: 420000 },
  { id: "t10", tanggal: "2026-03-22", keterangan: "Penjualan Lampu Hex-Bamboo (3 unit)", kategori: "Marketplace", tipe: "masuk", jumlah: 450000 },
];

export const DEF_TESTIMONI: Testimoni[] = [
  { id: "tm1", tipe: "tokoh", nama: "H. Kepala Desa", jabatan: "Pemerintahan Desa", pesan: "Inisiatif Ciburial Eco-Digital sangat sejalan dengan visi masa depan desa. Kami mendukung penuh transisi ini menuju desa mandiri energi dan ekonomi.", foto: "https://images.unsplash.com/photo-1560250097-0b93528c311a?w=400&q=80" },
  { id: "tm2", tipe: "berita", nama: "Berita Lokal", jabatan: "Media", pesan: "Penerapan PJU berbasis panel surya dari bambu di Kp. Ciburial sukses mengurangi beban listrik desa secara signifikan. Bukti nyata inovasi pemuda!", foto: "https://images.unsplash.com/photo-1504711434969-e33886168f5c?w=400&q=80" },
  { id: "tm3", tipe: "tokoh", nama: "Bpk. Camat", jabatan: "Pemerintahan Kecamatan", pesan: "Konsep Bank Sampah Digital yang terintegrasi dengan poin penukaran adalah terobosan sirkular ekonomi tingkat kampung yang patut dicontoh daerah lain.", foto: "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=400&q=80" },
  { id: "tm4", tipe: "tokoh", nama: "Tokoh Pemuda", jabatan: "Karang Taruna", pesan: "Melihat kaum pemuda bertransformasi jadi 'Makers' yang memproduksi lampu pintar dan pupuk organik adalah secercah harapan untuk masa depan kemandirian Ciburial.", foto: "https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?w=400&q=80" }
];

export const DEF_IKLAN: Iklan[] = [
  { 
    id: "ik1", 
    tipe: "video", 
    judul: "Pasar Lebaran Ciburial", 
    deskripsi: "Diskon 50% untuk produk kerajinan bambu minggu ini. Tersedia di stand nomor 4!", 
    mediaUrl: "https://www.w3schools.com/html/mov_bbb.mp4" 
  },
  { 
    id: "ik2", 
    tipe: "foto", 
    judul: "Warung Sembako Teh Yani", 
    deskripsi: "Sedia beras, telur, dan minyak goreng. Bisa bayar pakai poin bank sampah!", 
    mediaUrl: "https://images.unsplash.com/photo-1534723452862-4c874018d66d?w=800&q=80" 
  }
];
