// lib/supabase.ts
// Install: npm install @supabase/supabase-js
// Tambahkan ke .env.local:
//   NEXT_PUBLIC_SUPABASE_URL=https://xxxx.supabase.co
//   NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhb...

import { createClient } from "@supabase/supabase-js";

const url = process.env.NEXT_PUBLIC_SUPABASE_URL ?? "";
const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? "";

export const isSupabaseReady = () => Boolean(url && key);
export const supabase = isSupabaseReady()
  ? createClient(url, key)
  : createClient("https://placeholder.supabase.co", "placeholder");

/* ══════════════════════════════════════════════════════
   SQL — jalankan ini di Supabase → SQL Editor → Run

   CREATE TABLE IF NOT EXISTS kegiatan (
     id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
     judul text NOT NULL,
     tanggal date NOT NULL,
     kategori text NOT NULL,
     deskripsi text,
     foto text,
     created_at timestamptz DEFAULT now()
   );

   CREATE TABLE IF NOT EXISTS produk (
     id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
     nama text NOT NULL,
     deskripsi text,
     harga integer NOT NULL,
     tag text,
     icon text DEFAULT '🎋',
     created_at timestamptz DEFAULT now()
   );

   CREATE TABLE IF NOT EXISTS transaksi (
     id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
     tanggal date NOT NULL,
     keterangan text NOT NULL,
     kategori text,
     tipe text NOT NULL CHECK (tipe IN ('masuk','keluar')),
     jumlah integer NOT NULL,
     created_at timestamptz DEFAULT now()
   );

   -- RLS: public bisa baca, siapapun bisa insert/delete (cocok untuk admin panel dengan password JS)
   ALTER TABLE kegiatan ENABLE ROW LEVEL SECURITY;
   ALTER TABLE produk   ENABLE ROW LEVEL SECURITY;
   ALTER TABLE transaksi ENABLE ROW LEVEL SECURITY;

   CREATE POLICY "public_read_kegiatan"  ON kegiatan  FOR SELECT USING (true);
   CREATE POLICY "public_read_produk"    ON produk    FOR SELECT USING (true);
   CREATE POLICY "public_read_transaksi" ON transaksi FOR SELECT USING (true);

   CREATE POLICY "anon_write_kegiatan"  ON kegiatan  FOR ALL USING (true) WITH CHECK (true);
   CREATE POLICY "anon_write_produk"    ON produk    FOR ALL USING (true) WITH CHECK (true);
   CREATE POLICY "anon_write_transaksi" ON transaksi FOR ALL USING (true) WITH CHECK (true);

   -- ===== VOTING (WAJIB: Jalankan di Supabase SQL Editor) =====
   ALTER TABLE voting         ENABLE ROW LEVEL SECURITY;
   ALTER TABLE pilihan_voting ENABLE ROW LEVEL SECURITY;
   ALTER TABLE vote_record    ENABLE ROW LEVEL SECURITY;
   CREATE POLICY "public_read_voting"         ON voting         FOR SELECT USING (true);
   CREATE POLICY "public_read_pilihan_voting" ON pilihan_voting FOR SELECT USING (true);
   CREATE POLICY "public_read_vote_record"    ON vote_record    FOR SELECT USING (true);
   CREATE POLICY "anon_write_voting"         ON voting         FOR ALL USING (true) WITH CHECK (true);
   CREATE POLICY "anon_write_pilihan_voting" ON pilihan_voting FOR ALL USING (true) WITH CHECK (true);
   CREATE POLICY "anon_write_vote_record"    ON vote_record    FOR ALL USING (true) WITH CHECK (true);

══════════════════════════════════════════════════════ */