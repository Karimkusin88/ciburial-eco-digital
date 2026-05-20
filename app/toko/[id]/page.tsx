"use client";
import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { supabase, isSupabaseReady } from "@/lib/supabase";
import { ArrowLeft, Store, MapPin, Smartphone, Star, Box, CheckCircle } from "lucide-react";
import "../../globals.css";

export default function PublicTokoPage() {
  const { id } = useParams() as { id: string };
  const router = useRouter();
  const [toko, setToko] = useState<any>(null);
  const [produk, setProduk] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchToko() {
      if (!isSupabaseReady() || !id) return;
      
      const { data: tData, error: tErr } = await supabase
        .from("toko")
        .select("*")
        .eq("id", id)
        .single();
        
      if (tData) {
        setToko(tData);
        
        const { data: pData } = await supabase
          .from("produk")
          .select("*")
          .eq("toko_id", id)
          .order("created_at", { ascending: false });
          
        if (pData) setProduk(pData);
      }
      
      setLoading(false);
    }
    
    fetchToko();
  }, [id]);

  if (loading) {
    return <div className="min-h-screen flex items-center justify-center bg-[var(--cr)]">Loading...</div>;
  }

  if (!toko) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-[var(--cr)]">
        <Store size={48} className="text-[var(--ts)] mb-4" />
        <h2 className="fnt text-2xl font-bold text-[var(--tp)]">Toko Tidak Ditemukan</h2>
        <button onClick={() => router.push("/")} className="mt-6 text-[var(--accent)] font-bold">← Kembali ke Beranda</button>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[var(--cr)] font-sans pb-20">
      <header className="sticky top-0 z-50 bg-[rgba(255,254,249,0.9)] backdrop-blur-md border-b border-[rgba(47,143,78,0.1)] px-4 py-3 flex items-center gap-3">
        <button onClick={() => router.back()} className="text-[var(--fo)] bg-[rgba(47,143,78,0.08)] p-2 rounded-full">
          <ArrowLeft size={20} />
        </button>
        <span className="font-extrabold text-[16px] text-[var(--tp)]">Profil Toko</span>
      </header>

      <div className="max-w-[800px] mx-auto px-4 pt-6">
        {/* Toko Header Heroic */}
        <div className="card-heroic rounded-2xl overflow-hidden mb-8 relative">
          <div className="h-32 bg-gradient-to-br from-[var(--fo)] to-[var(--accent)]"></div>
          <div className="px-6 pb-6 pt-0 relative">
            <div className="w-24 h-24 rounded-full border-4 border-white bg-[var(--cr)] -mt-12 mb-4 flex items-center justify-center text-4xl overflow-hidden shadow-lg shadow-[rgba(47,143,78,0.2)]">
              {toko.foto_toko ? <img src={toko.foto_toko} className="w-full h-full object-cover" /> : <Store size={40} className="text-[var(--accent)]" />}
            </div>
            <h1 className="fnt text-3xl font-bold text-[var(--tp)] mb-1 flex items-center gap-2">
              {toko.nama_toko}
              {toko.status === "aktif" && <CheckCircle size={20} className="text-[var(--accent)]" />}
            </h1>
            <p className="text-[14px] text-[var(--ts)] mb-4 leading-relaxed max-w-2xl">{toko.deskripsi || "Belum ada deskripsi"}</p>
            
            <div className="flex flex-wrap gap-4 mt-2">
              <div className="flex items-center gap-2 text-[13px] font-semibold text-[var(--fo)] bg-[rgba(47,143,78,0.08)] px-3 py-1.5 rounded-lg">
                <MapPin size={16} /> Desa Ciburial
              </div>
              {toko.no_wa && (
                <a href={`https://wa.me/62${toko.no_wa.replace(/^0+/, '')}`} target="_blank" className="flex items-center gap-2 text-[13px] font-semibold text-[#128C7E] bg-[#128C7E]/10 px-3 py-1.5 rounded-lg no-underline">
                  <Smartphone size={16} /> Hubungi Penjual
                </a>
              )}
              <div className="flex items-center gap-2 text-[13px] font-semibold text-[var(--go)] bg-[var(--go)]/10 px-3 py-1.5 rounded-lg">
                <Box size={16} /> {produk.length} Produk
              </div>
            </div>
          </div>
        </div>

        {/* Daftar Produk */}
        <h3 className="fnt text-2xl font-bold text-[var(--tp)] mb-4">Etalase Toko</h3>
        
        {produk.length === 0 ? (
          <div className="text-center py-12 text-[var(--ts)] bg-white/50 rounded-2xl border border-dashed border-[var(--bo)]">
            Belum ada produk yang dijual.
          </div>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-3 gap-3 md:gap-4">
            {produk.map((p) => (
              <div key={p.id} className="card-heroic rounded-xl overflow-hidden flex flex-col group cursor-pointer" onClick={() => router.push(`/?tab=marketplace`)}>
                <div className="aspect-square relative bg-gray-100 overflow-hidden">
                  {p.foto || (p.foto_urls && p.foto_urls[0]) ? (
                    <img src={p.foto || p.foto_urls[0]} alt={p.nama} className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-5xl bg-[var(--gb)]">{p.icon || '🛍️'}</div>
                  )}
                  {p.terjual > 0 && (
                    <div className="absolute top-2 left-2 bg-[rgba(255,255,255,0.9)] backdrop-blur text-[10px] font-bold text-[var(--fo)] px-2 py-1 rounded-md shadow-sm">
                      {p.terjual} Terjual
                    </div>
                  )}
                </div>
                <div className="p-3 flex-1 flex flex-col">
                  <div className="text-[13px] font-bold text-[var(--tp)] line-clamp-2 leading-tight mb-1">{p.nama}</div>
                  <div className="text-[14px] font-extrabold text-[var(--accent)] mt-auto">Rp {p.harga.toLocaleString("id-ID")}</div>
                  {p.rating_avg > 0 && (
                    <div className="flex items-center gap-1 mt-1 text-[11px] font-semibold text-[var(--go)]">
                      <Star size={12} fill="currentColor" /> {p.rating_avg} ({p.rating_count})
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
