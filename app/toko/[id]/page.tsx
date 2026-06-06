"use client";
import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { supabase, isSupabaseReady } from "@/lib/supabase";
import { ArrowLeft, Store, MapPin, Smartphone, Star, CheckCircle, Package, ShoppingBag } from "lucide-react";
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
      const { data: tData } = await supabase.from("toko").select("*").eq("id", id).single();
      if (tData) {
        setToko(tData);
        const { data: pData } = await supabase
          .from("produk").select("*").eq("toko_id", id).order("created_at", { ascending: false });
        if (pData) setProduk(pData);
      }
      setLoading(false);
    }
    fetchToko();
  }, [id]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#F5F5F5]">
        <div className="flex flex-col items-center gap-3">
          <div className="w-8 h-8 rounded-full border-[3px] border-[var(--fo)] border-t-transparent animate-spin" />
          <p className="text-sm text-[var(--ts)]">Memuat toko...</p>
        </div>
      </div>
    );
  }

  if (!toko) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-[#F5F5F5] gap-3 px-6">
        <Store size={48} className="text-gray-300" />
        <h2 className="font-bold text-lg text-gray-800">Toko Tidak Ditemukan</h2>
        <button onClick={() => router.push("/")} className="text-sm text-[var(--fo)] font-semibold">
          ← Kembali ke Beranda
        </button>
      </div>
    );
  }

  const totalTerjual = produk.reduce((sum, p) => sum + (p.terjual || 0), 0);

  return (
    <div className="min-h-screen bg-[#F5F5F5] font-sans pb-20">

      {/* HEADER */}
      <header className="sticky top-0 z-50 bg-white border-b border-gray-200 shadow-sm">
        <div className="flex items-center px-4 py-3 gap-3 max-w-2xl mx-auto">
          <button
            onClick={() => router.back()}
            className="text-gray-700 p-1.5 hover:bg-gray-100 rounded-md transition-colors"
          >
            <ArrowLeft size={22} />
          </button>

          <span className="flex-1 font-bold text-[16px] text-gray-900 truncate text-center">
            {toko.nama_toko}
          </span>

          {toko.no_wa ? (
            <a
              href={`https://wa.me/62${toko.no_wa.replace(/^0+/, "")}?text=Halo%20kak,%20saya%20dari%20Ciburial%20Eco-Digital`}
              target="_blank"
              className="bg-[var(--fo)] text-white text-[13px] font-bold px-4 py-2 rounded-md hover:opacity-90 active:scale-95 transition-all flex items-center gap-1.5 shrink-0"
            >
              <Smartphone size={14} />
              Chat
            </a>
          ) : (
            <div className="w-[70px]" />
          )}
        </div>
      </header>

      <div className="max-w-2xl mx-auto">

        {/* PROFIL SECTION */}
        <div className="bg-white border-b border-gray-200">
          <div className="px-4 py-5">
            {/* Avatar + nama + lokasi */}
            <div className="flex items-center gap-4 mb-4">
              <div className="w-[72px] h-[72px] rounded-lg border border-gray-200 bg-gray-50 overflow-hidden shrink-0">
                {toko.foto_toko ? (
                  <img src={toko.foto_toko} className="w-full h-full object-cover" alt={toko.nama_toko} />
                ) : (
                  <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-[var(--fo)] to-[var(--accent)]">
                    <Store size={28} className="text-white" />
                  </div>
                )}
              </div>

              <div className="flex-1 min-w-0">
                <h1 className="font-extrabold text-[18px] text-gray-900 leading-tight mb-1 flex items-center gap-1.5 flex-wrap">
                  {toko.nama_toko}
                  {toko.status === "aktif" && <CheckCircle size={15} className="text-[var(--accent)] shrink-0" />}
                </h1>
                <div className="flex items-center gap-1 text-[13px] text-gray-500">
                  <MapPin size={12} className="shrink-0" />
                  <span>Kampung Ciburial, Garut</span>
                </div>
              </div>
            </div>

            {/* Stats badges */}
            <div className="flex items-center gap-2 flex-wrap">
              <span className="inline-flex items-center gap-1.5 border border-gray-300 text-gray-700 text-[13px] font-semibold px-3 py-1 rounded-full">
                <Package size={12} className="text-[var(--fo)]" />
                {produk.length} Produk
              </span>
              {totalTerjual > 0 && (
                <span className="inline-flex items-center gap-1.5 border border-gray-300 text-gray-700 text-[13px] font-semibold px-3 py-1 rounded-full">
                  <ShoppingBag size={12} className="text-[var(--fo)]" />
                  {totalTerjual} Terjual
                </span>
              )}
            </div>
          </div>

          {/* Deskripsi */}
          {toko.deskripsi && (
            <div className="px-4 pb-5 border-t border-gray-100 pt-4">
              <p className="text-[14px] text-gray-600 leading-relaxed">{toko.deskripsi}</p>
            </div>
          )}
        </div>

        {/* PRODUK SECTION */}
        <div className="px-4 pt-5">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-extrabold text-[17px] text-gray-900">Semua Produk</h2>
            <span className="text-[12px] font-semibold text-gray-500 bg-gray-100 border border-gray-200 px-2.5 py-1 rounded-full">
              {produk.length} item
            </span>
          </div>

          {produk.length === 0 ? (
            <div className="bg-white border border-gray-200 rounded-xl py-16 flex flex-col items-center justify-center text-center">
              <Package size={40} className="text-gray-300 mb-3" />
              <h4 className="font-bold text-gray-800 mb-1">Etalase Masih Kosong</h4>
              <p className="text-[13px] text-gray-500">Penjual belum menambahkan produk.</p>
            </div>
          ) : (
            <div className="grid grid-cols-2 gap-3">
              {produk.map((p) => (
                <div
                  key={p.id}
                  className="bg-white border border-gray-200 rounded-xl overflow-hidden cursor-pointer hover:border-gray-400 hover:shadow-sm transition-all"
                  onClick={() => router.push(`/?tab=marketplace`)}
                >
                  {/* Foto */}
                  <div className="aspect-square bg-gray-50 overflow-hidden relative">
                    {p.foto || (p.foto_urls && p.foto_urls[0]) ? (
                      <img
                        src={p.foto || p.foto_urls[0]}
                        alt={p.nama}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-3xl opacity-25">
                        {p.icon || "🛍️"}
                      </div>
                    )}
                    {p.terjual > 0 && (
                      <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/50 to-transparent px-2 py-2">
                        <span className="text-white text-[10px] font-bold">{p.terjual} terjual</span>
                      </div>
                    )}
                  </div>

                  {/* Info */}
                  <div className="p-3">
                    <p className="text-[13px] text-gray-800 line-clamp-2 leading-snug mb-2 font-medium">
                      {p.nama}
                    </p>
                    <p className="text-[15px] font-extrabold text-gray-900">
                      Rp {p.harga.toLocaleString("id-ID")}
                    </p>
                    {p.rating_avg > 0 && (
                      <div className="flex items-center gap-1 mt-1.5">
                        <Star size={11} className="text-yellow-400 fill-yellow-400" />
                        <span className="text-[11px] text-gray-500">{p.rating_avg} ({p.rating_count})</span>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

      </div>
    </div>
  );
}
