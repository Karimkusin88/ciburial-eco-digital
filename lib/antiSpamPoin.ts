// lib/antiSpamPoin.ts
// Cek apakah anggota sudah dapat poin dari sumber tertentu hari ini
// Taruh di: lib/antiSpamPoin.ts

import { supabase } from "@/lib/supabase";

export async function sudahDapatPoinHariIni(
  anggotaId: string,
  sumber: string
): Promise<boolean> {
  const hariIni = new Date().toISOString().split("T")[0]; // "2026-04-07"

  const { data } = await supabase
    .from("riwayat_poin")
    .select("id")
    .eq("anggota_id", anggotaId)
    .eq("sumber", sumber)
    .gte("created_at", `${hariIni}T00:00:00`)
    .lte("created_at", `${hariIni}T23:59:59`)
    .limit(1);

  return (data?.length || 0) > 0;
}

export async function sudahAbsenRondaHariIni(
  jadwalId: string,
  kkId: string
): Promise<boolean> {
  const { data } = await supabase
    .from("absensi_ronda")
    .select("id")
    .eq("jadwal_id", jadwalId)
    .eq("kk_id", kkId)
    .limit(1);

  return (data?.length || 0) > 0;
}

export async function sudahAbsenPosyanduHariIni(
  kkId: string
): Promise<boolean> {
  const hariIni = new Date().toISOString().split("T")[0];

  const { data } = await supabase
    .from("riwayat_poin")
    .select("id")
    .eq("kk_id", kkId)
    .eq("sumber", "posyandu")
    .gte("created_at", `${hariIni}T00:00:00`)
    .lte("created_at", `${hariIni}T23:59:59`)
    .limit(1);

  return (data?.length || 0) > 0;
}
