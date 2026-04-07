// ============================================
// PHASE 3 — ECO-REWARD SYSTEM
// File ini berisi 3 fungsi helper yang dipake
// di semua halaman admin untuk tambah poin
// otomatis ke anggota KK
//
// Taruh di: lib/ecoReward.ts
// ============================================

import { supabase } from "@/lib/supabase";

export const POIN_CONFIG = {
  posyandu: 15,        // per kedatangan
  ronda: 30,           // per jadwal ronda
  bank_sampah: 20,     // per kg (dikali berat)
  kerja_bakti: 50,     // per kehadiran
  masjid: 5,           // per kedatangan
  learning_hub: 25,    // per sesi
  lapor_fasilitas: 20, // per laporan valid
};

// Tambah poin ke anggota KK
export async function tambahPoin({
  anggotaId,
  kkId,
  jumlah,
  sumber,
  keterangan,
}: {
  anggotaId: string;
  kkId: string;
  jumlah: number;
  sumber: string;
  keterangan: string;
}) {
  try {
    // 1. Ambil saldo sekarang
    const { data: anggota } = await supabase
      .from("anggota_kk")
      .select("saldo_poin, nama")
      .eq("id", anggotaId)
      .single();

    if (!anggota) return { ok: false, msg: "Anggota tidak ditemukan" };

    const saldoBaru = (anggota.saldo_poin || 0) + jumlah;

    // 2. Update saldo
    await supabase
      .from("anggota_kk")
      .update({ saldo_poin: saldoBaru })
      .eq("id", anggotaId);

    // 3. Catat riwayat
    await supabase.from("riwayat_poin").insert({
      anggota_id: anggotaId,
      kk_id: kkId,
      jumlah,
      jenis: "masuk",
      sumber,
      keterangan,
    });

    return {
      ok: true,
      msg: `+${jumlah} poin untuk ${anggota.nama}`,
      saldoBaru,
      nama: anggota.nama,
    };
  } catch (e) {
    return { ok: false, msg: "Gagal tambah poin" };
  }
}

// Ambil anggota berdasarkan NFC ID
export async function cariAnggotaNFC(nfcId: string) {
  const { data } = await supabase
    .from("anggota_kk")
    .select("*")
    .eq("nfc_id", nfcId)
    .single();
  return data;
}

// Ambil ibu dari KK (untuk reward posyandu)
export async function cariIbuDariKK(kkId: string) {
  const { data } = await supabase
    .from("anggota_kk")
    .select("*")
    .eq("kk_id", kkId)
    .eq("hubungan", "istri")
    .single();
  return data;
}
