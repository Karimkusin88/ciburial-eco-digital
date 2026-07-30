import React from "react";
import { Landmark, Wheat, BookOpen, Lightbulb, Wifi, Recycle, Lamp, ShoppingBasket, Leaf, Sprout, Carrot, Trees } from "lucide-react";

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
  icon: React.ReactNode | string;
  foto?: string;
  fotos?: string[];
  toko_id?: string;
  toko?: {
    nama_toko: string;
    no_wa: string;
  };
  rating_avg?: number;
  rating_count?: number;
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
  { key: "kegiatan" as TabType, label: "Kegiatan" },
  { key: "proposal" as TabType, label: "Proposal" },
  { key: "transparansi" as TabType, label: "Transparansi Dana" },
  { key: "marketplace" as TabType, label: "Marketplace" },
];

export const KAT_CFG: Record<string, { label: string; bg: string; color: string }> = {
  keagamaan: { label: "Keagamaan", bg: "rgba(184,148,63,.1)", color: "#7A5A1E" },
  kemerdekaan: { label: "Kemerdekaan", bg: "rgba(196,50,50,.09)", color: "#8B2020" },
  kemasyarakatan: { label: "Kemasyarakatan", bg: "rgba(28,58,43,.1)", color: "#1C3A2B" },
  "update-kampung": { label: "Update Kampung", bg: "rgba(45,90,160,.09)", color: "#1A3A6B" },
};

export const ALOKASI = [
  { label: "Tiang PJU Stainless", target: 6920000, icon: <Landmark size={18} strokeWidth={1.5} />, color: "#2D5A40", desc: "20 Tiang PJU" },
  { label: "Lampu PJU Cobra 50Watt", target: 2100000, icon: <Lightbulb size={18} strokeWidth={1.5} />, color: "#4A7C59", desc: "20 pcs Lampu" },
  { label: "Kabel Twisted SR 2x10mm", target: 2900000, icon: <Lamp size={18} strokeWidth={1.5} />, color: "#B8943F", desc: "Kabel instalasi 500m" },
  { label: "Semen & Pasir", target: 500000, icon: <Leaf size={18} strokeWidth={1.5} />, color: "#1A3A6B", desc: "Material pondasi" },
  { label: "Cetakan PJU", target: 385000, icon: <Recycle size={18} strokeWidth={1.5} />, color: "#6B4F3A", desc: "Cetakan cor" },
  { label: "Cat & Material", target: 150000, icon: <Sprout size={18} strokeWidth={1.5} />, color: "#8A7065", desc: "Cat & pendukung lainnya" },
];

// ─── DEFAULT DATA (fallback sebelum Supabase dikonfigurasi) ─────────────────
export const DEF_KEG: Kegiatan[] = [
  { id: "d1", judul: "Pemasangan Smart PJU Perdana", tanggal: "2026-03-20", kategori: "update-kampung", deskripsi: "Milestone pertama! Smart PJU berbahan bambu berhasil dipasang di 2 titik strategis jalan utama Ciburial." },
  { id: "d2", judul: "HUT Kemerdekaan RI ke-81", tanggal: "2026-08-17", kategori: "kemerdekaan", deskripsi: "Perayaan HUT RI dengan lomba tradisional, upacara bendera, dan pentas seni pemuda Ciburial." },
  { id: "d3", judul: "Peringatan Maulid Nabi SAW", tanggal: "2026-09-10", kategori: "keagamaan", deskripsi: "Pengajian dan doa bersama seluruh warga memperingati Maulid Nabi Muhammad SAW." },
  { id: "d4", judul: "Musyawarah Pembentukan Bank Sampah", tanggal: "2026-02-10", kategori: "kemasyarakatan", deskripsi: "Rembug warga menyiapkan sistem Bank Sampah Digital Ciburial perdana." },
];

export const DEF_PROD: Produk[] = [];

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
  { id: "t10", tanggal: "2026-03-22", keterangan: "Donasi Hamba Allah", kategori: "Donasi Warga", tipe: "masuk", jumlah: 450000 },
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
    deskripsi: "Kunjungi bazar amal minggu ini. Tersedia di pelataran Masjid Al Husain!", 
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
