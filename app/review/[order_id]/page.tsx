"use client";
import { useState, useEffect, use } from "react";
import { supabase, isSupabaseReady } from "@/lib/supabase";
import { Star, CheckCircle, ArrowLeft } from "lucide-react";

export default function ReviewPage({ params }: { params: Promise<{ order_id: string }> }) {
  const { order_id } = use(params);
  
  const [toast, setToast] = useState("");
  const [loading, setLoading] = useState(true);
  const [order, setOrder] = useState<any>(null);
  const [items, setItems] = useState<any[]>([]);
  const [pembeli, setPembeli] = useState<any>(null);
  const [reviews, setReviews] = useState<Record<string, { rating: number; komentar: string }>>({});
  const [submitting, setSubmitting] = useState(false);
  
  const showToast = (msg: string) => { setToast(msg); setTimeout(()=>setToast(""), 3000); };

  useEffect(() => {
    // Cek auth pembeli
    const sessionStr = localStorage.getItem("pembeli_session");
    if (sessionStr) {
      setPembeli(JSON.parse(sessionStr));
    }

    if (!isSupabaseReady()) return;
    
    const fetchOrder = async () => {
      try {
        const { data, error } = await supabase
          .from("orders_marketplace")
          .select("*")
          .eq("order_id", order_id)
          .single();

        if (error) throw error;
        if (data) {
          setOrder(data);
          if (data.items) {
            let parsed = [];
            try {
              parsed = JSON.parse(data.items);
            } catch(e) {}
            setItems(parsed);
          }
        }
      } catch (err: any) {
        showToast("Order tidak ditemukan");
      } finally {
        setLoading(false);
      }
    };
    
    fetchOrder();
  }, [order_id]);

  const handleRating = (productId: string, rating: number) => {
    setReviews(prev => ({
      ...prev,
      [productId]: { ...prev[productId], rating: rating || 0, komentar: prev[productId]?.komentar || "" }
    }));
  };

  const handleKomentar = (productId: string, text: string) => {
    setReviews(prev => ({
      ...prev,
      [productId]: { ...prev[productId], rating: prev[productId]?.rating || 0, komentar: text }
    }));
  };

  const submitReviews = async () => {
    if (!pembeli) return showToast("❌ Anda harus login sebagai pembeli dulu.");
    if (order.pembeli_id && order.pembeli_id !== pembeli.id) {
      return showToast("❌ Order ini milik pembeli lain.");
    }
    
    const toSubmit = Object.entries(reviews).map(([produk_id, val]) => ({
      produk_id,
      order_id,
      pembeli_id: pembeli.id,
      rating: val.rating,
      komentar: val.komentar
    })).filter(r => r.rating > 0);

    if (toSubmit.length === 0) return showToast("Pilih rating minimal 1 produk.");

    setSubmitting(true);
    try {
      for (const review of toSubmit) {
        const { error } = await supabase.from("reviews").insert(review);
        if (error) {
          // Ignore duplicate review errors based on unique constraint
          if (!error.message.includes("unique")) {
            console.error("Error submitting review", error);
          }
        } else {
          // Update avg rating in produk table
          const { data: allReviews } = await supabase.from("reviews").select("rating").eq("produk_id", review.produk_id);
          if (allReviews && allReviews.length > 0) {
            const sum = allReviews.reduce((a, b) => a + b.rating, 0);
            const avg = sum / allReviews.length;
            await supabase.from("produk").update({
              rating_avg: avg,
              rating_count: allReviews.length
            }).eq("id", review.produk_id);
          }
        }
      }
      showToast("✅ Ulasan berhasil disimpan!");
      setTimeout(() => {
        window.location.href = "/?tab=marketplace";
      }, 2000);
    } catch (err: any) {
      showToast("❌ Gagal mengirim ulasan");
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) return <div className="p-8 text-center">Memuat data order...</div>;

  return (
    <div className="min-h-screen bg-[var(--cr)] font-sans">
      {toast && (
        <div className="fixed top-5 left-1/2 -translate-x-1/2 bg-[var(--fo)] text-white px-6 py-2.5 rounded-full z-[999] text-sm font-semibold whitespace-nowrap shadow-xl">
          {toast}
        </div>
      )}

      {/* Header */}
      <header className="bg-[var(--cr)] border-b border-[rgba(45,90,64,0.12)] px-5 py-4 sticky top-0 z-10">
        <div className="max-w-[700px] mx-auto flex items-center gap-3">
          <a href="/?tab=marketplace" className="text-[#6B7C6D] hover:text-[var(--fo)] transition-colors">
            <ArrowLeft size={20} />
          </a>
          <h1 className="font-extrabold text-[18px] text-[var(--tp)] m-0">Beri Ulasan Produk</h1>
        </div>
      </header>

      <div className="max-w-[700px] mx-auto px-4 pt-6 pb-24">
        {!pembeli ? (
          <div className="card-heroic p-6 rounded-2xl text-center">
            <h2 className="text-lg font-bold text-[#1C3A2B] mb-2">Login Diperlukan</h2>
            <p className="text-sm text-[#6b7c6d] mb-4">Silakan login sebagai pembeli di halaman Marketplace untuk memberikan ulasan.</p>
            <a href="/?tab=marketplace" className="btn-heroic inline-block px-6 py-2 rounded-lg text-white font-bold no-underline text-sm">Ke Marketplace</a>
          </div>
        ) : !order ? (
          <div className="card-heroic p-6 rounded-2xl text-center">
            <p className="text-[#8B2020] font-bold">Order tidak ditemukan.</p>
          </div>
        ) : (
          <>
            <div className="mb-6 px-2">
              <div className="text-xs text-[#6b7c6d] font-semibold tracking-wider uppercase mb-1">Order ID</div>
              <div className="text-lg font-bold text-[#1C3A2B]">{order.order_id}</div>
              <div className="text-sm text-[#5A4A40] mt-1">Selesai berbelanja? Berikan penilaianmu!</div>
            </div>

            <div className="flex flex-col gap-4">
              {items.map((item: any) => (
                <div key={item.id} className="card-heroic p-5 rounded-xl bg-white border border-[rgba(47,143,78,0.1)]">
                  <div className="font-bold text-[#1C3A2B] text-[15px] mb-1">{item.nama}</div>
                  <div className="text-xs text-[#6b7c6d] mb-4">Qty: {item.qty}</div>
                  
                  <div className="flex gap-2 mb-4">
                    {[1, 2, 3, 4, 5].map((star) => {
                      const current = reviews[item.id]?.rating || 0;
                      return (
                        <button 
                          key={star}
                          onClick={() => handleRating(item.id, star)}
                          className="bg-transparent border-none p-0 cursor-pointer outline-none hover:scale-110 transition-transform"
                        >
                          <Star size={32} fill={star <= current ? "#FFC400" : "transparent"} color={star <= current ? "#FFC400" : "#D1D5DB"} strokeWidth={1.5} />
                        </button>
                      );
                    })}
                  </div>

                  <textarea 
                    value={reviews[item.id]?.komentar || ""}
                    onChange={(e) => handleKomentar(item.id, e.target.value)}
                    placeholder="Tulis pengalamanmu menggunakan produk ini..."
                    className="w-full p-3 rounded-lg border border-[#E5E7E9] text-sm outline-none focus:border-[var(--accent)] resize-y min-h-[80px]"
                  ></textarea>
                </div>
              ))}
            </div>

            <div className="mt-8 flex justify-end">
              <button 
                onClick={submitReviews}
                disabled={submitting}
                className="btn-heroic px-8 py-3 rounded-xl text-white font-bold text-[15px] flex items-center gap-2 disabled:opacity-70"
              >
                {submitting ? "Menyimpan..." : <><CheckCircle size={18} /> Kirim Ulasan</>}
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
