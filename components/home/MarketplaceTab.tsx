"use client";
import { Produk, Iklan, fRp } from "./types";
import { useState, useRef, useEffect } from "react";

interface MarketplaceTabProps {
  produk: Produk[];
  iklan?: Iklan[];
  dataLoad: boolean;
  checkout: boolean;
  setCheckout: (val: boolean) => void;
}

// Gunakan warna solid yang kontrasnya tajam
const CATEGORI = ["Semua", "Kerajinan", "Pertanian", "Makanan", "Eco-Waste", "Bambu"];
const MOCK_SOLD = [42, 128, 76, 215, 93, 54];
const MOCK_RATING = [4.8, 4.9, 4.7, 5.0, 4.6, 4.8];

export default function MarketplaceTab({ produk, iklan = [], dataLoad, checkout, setCheckout }: MarketplaceTabProps) {
  const [loadingSnap, setLoadingSnap] = useState(false);
  const [selectedProduk, setSelectedProduk] = useState<Produk | null>(null);
  const [search, setSearch] = useState("");
  const [activeKat, setActiveKat] = useState("Semua");
  const [activeSlide, setActiveSlide] = useState(0);
  const sliderRef = useRef<HTMLDivElement>(null);

  // Auto-scroll banner
  useEffect(() => {
    if (iklan.length < 2) return;
    const t = setInterval(() => setActiveSlide(s => (s + 1) % iklan.length), 4000);
    return () => clearInterval(t);
  }, [iklan.length]);

  useEffect(() => {
    if (sliderRef.current) {
      sliderRef.current.scrollTo({ left: activeSlide * sliderRef.current.offsetWidth, behavior: "smooth" });
    }
  }, [activeSlide]);

  const filteredProduk = produk.filter(p => {
    const matchSearch = p.nama.toLowerCase().includes(search.toLowerCase()) || p.deskripsi.toLowerCase().includes(search.toLowerCase());
    const matchKat = activeKat === "Semua" || (p.tag && p.tag.toLowerCase().includes(activeKat.toLowerCase()));
    return matchSearch && matchKat;
  });

  const bayarSekarang = async (p: Produk) => {
    setLoadingSnap(true);
    try {
      const res = await fetch("/api/midtrans/tokenize", {
        method: "POST",
        headers: { "Content-type": "application/json" },
        body: JSON.stringify({
          order_id: `MKT-${Date.now()}`,
          gross_amount: p.harga,
          item_details: [{ id: p.id, price: p.harga, quantity: 1, name: p.nama }]
        })
      });
      const data = await res.json();
      if (data.token && (window as any).snap) {
        (window as any).snap.pay(data.token, {
          onSuccess: function (r: any) { alert("Pembayaran sukses! Terima kasih sudah berbelanja di Ciburial Marketplace. 🎉"); setCheckout(false); },
          onPending: function (r: any) { alert("Menunggu konfirmasi pembayaran Anda."); },
          onError: function (r: any) { alert("Pembayaran gagal. Silakan coba lagi."); }
        });
      } else {
        alert("Payment Gateway belum aktif. Cek ENV Midtrans. (" + (data.error || "Missing Token") + ")");
      }
    } catch (e) { alert("Error menghubungi server."); }
    setLoadingSnap(false);
  };

  // ─── CHECKOUT PAGE (DESAIN SOLID & KONTRAS TINGGI) ─────────────────────
  if (checkout && selectedProduk) {
    const p = selectedProduk;
    return (
      <div className="pi" style={{ paddingTop: "clamp(64px,10vw,120px)", paddingBottom: 80, minHeight: "100vh", background: "#F5F5F0" }}>
        <div style={{ maxWidth: 600, margin: "0 auto", padding: "0 clamp(16px,3vw,28px)" }}>

          {/* Back */}
          <button onClick={() => { setCheckout(false); setSelectedProduk(null); }} style={{ display: "flex", alignItems: "center", gap: 6, background: "none", border: "none", cursor: "pointer", fontSize: 13, fontWeight: 700, color: "#1A4D2E", marginBottom: 24, padding: "6px 0" }}>
            ← Kembali ke Toko
          </button>

          {/* Order Summary Card - SOLID WHITE */}
          <div style={{ background: "#FFFFFF", border: "1px solid #E0E0E0", borderRadius: 20, overflow: "hidden", marginBottom: 16, boxShadow: "0 2px 8px rgba(0,0,0,0.05)" }}>
            <div style={{ background: "#F0F0F0", padding: "16px 22px", display: "flex", alignItems: "center", gap: 14, borderBottom: "1px solid #E0E0E0" }}>
              <div style={{ width: 56, height: 56, borderRadius: 16, background: "rgba(0,0,0,0.05)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 28 }}>{p.icon || "🎋"}</div>
              <div>
                <div style={{ fontSize: 10, fontWeight: 700, letterSpacing: ".14em", textTransform: "uppercase", color: "#666", marginBottom: 2 }}>{p.tag || "Produk Lokal"}</div>
                <div style={{ fontSize: 16, fontWeight: 800, color: "#1A1A1A" }}>{p.nama}</div>
              </div>
              <div style={{ marginLeft: "auto", textAlign: "right" }}>
                <div style={{ fontSize: 10, color: "#999" }}>Total</div>
                <div className="fnt" style={{ fontSize: 20, fontWeight: 700, color: "#1A4D2E" }}>{fRp(p.harga)}</div>
              </div>
            </div>
            
             <div style={{ padding: "16px 22px", background: "#FFFFFF", borderBottom: "1px solid #E0E0E0"}}>
                 <div style={{fontSize: 12, color: "#333", display: "flex", alignItems: "center", gap: 8}}>
                     <span>🌱</span>
                     <span>"Mendukung ekonomi warga Kp. Ciburial, Garut."</span>
                 </div>
             </div>

            <div style={{ padding: "24px 22px", display: "flex", flexDirection: "column", gap: 16 }}>
              {/* Form Input - SOLID & JELAS */}
              {[{ l: "Nama Lengkap", t: "text", p: "Cth: Budi Santoso" }, { l: "No. WhatsApp Aktif", t: "tel", p: "Cth: 08123456789" }].map((f, i) => (
                <div key={i}>
                  <label style={{ display: "block", fontSize: 11, fontWeight: 700, letterSpacing: ".1em", textTransform: "uppercase", color: "#666", marginBottom: 8 }}>{f.l}</label>
                  <input type={f.t} placeholder={f.p} style={{ width: "100%", padding: "14px", background: "#FAFAFA", border: "1px solid #CCCCCC", borderRadius: 10, color: "#1A1A1A", fontSize: 14, boxSizing: "border-box" }} />
                </div>
              ))}
            </div>
          </div>

          {/* Payment button - SOLID GREEN */}
          <button onClick={() => bayarSekarang(p)} disabled={loadingSnap} style={{ width: "100%", padding: "18px", borderRadius: 16, fontSize: 14, fontWeight: 700, letterSpacing: ".08em", textTransform: "uppercase", border: "none", cursor: loadingSnap ? "wait" : "pointer", background: loadingSnap ? "#999" : "#1A4D2E", color: "#FFFFFF", transition: "all 0.3s", boxShadow: loadingSnap ? "none" : "0 4px 12px rgba(26, 77, 46, 0.2)", display: "flex", alignItems: "center", justifyContent: "center", gap: 10 }}>
            <span>{loadingSnap ? "⏳ Memproses..." : `📦 Checkout & Bayar (${fRp(p.harga)})`}</span>
          </button>
        </div>
      </div>
    );
  }

  // ─── MAIN MARKETPLACE PAGE (DESAIN SOLID & KONTRAS TINGGI) ─────────────────────
  return (
    <div className="pi" style={{ paddingTop: "clamp(64px,10vw,120px)", paddingBottom: 80, background: "#F5F5F0", minHeight: "100vh" }}>
      <div style={{ maxWidth: 1320, margin: "0 auto", padding: "0 clamp(12px,3vw,24px)" }}>

        {/* ── TOP HERO SEARCH BAR - SOLID GREY ── */}
        <div style={{ background: "#FFFFFF", border: "1px solid #E0E0E0", borderRadius: 24, padding: "32px", marginBottom: 32, display: "flex", flexWrap: "wrap", gap: 24, alignItems: "center", justifyContent: "space-between", boxShadow: "0 4px 12px rgba(0,0,0,0.03)" }}>
          <div>
            <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: ".2em", textTransform: "uppercase", color: "#1A4D2E", marginBottom: 8 }}>PROFIL DESA DIGITAL</div>
            <h1 className="fnt" style={{ fontSize: "clamp(28px,4vw,42px)", fontWeight: 800, color: "#1A1A1A", letterSpacing: "-.02em", lineHeight: 1.1 }}>
              Marketplace <span style={{ color: "#1A4D2E" }}>Ciburial</span>
            </h1>
          </div>
          <div style={{ display: "flex", gap: 10, alignItems: "center", flex: 1, minWidth: 240, maxWidth: 440 }}>
            <div style={{ position: "relative", flex: 1 }}>
              <span style={{ position: "absolute", left: 16, top: "50%", transform: "translateY(-50%)", fontSize: 16, color: "#999" }}>🔍</span>
              <input
                value={search}
                onChange={e => setSearch(e.target.value)}
                placeholder="Cari produk lokal..."
                style={{ width: "100%", padding: "16px 16px 16px 48px", borderRadius: 14, background: "#FFFFFF", border: "1px solid #CCCCCC", color: "#1A1A1A", fontSize: 14, outline: "none", boxSizing: "border-box", transition: "all 0.3s" }}
                onFocus={(e) => e.target.style.borderColor = "#1A4D2E"}
                onBlur={(e) => e.target.style.borderColor = "#CCCCCC"}
              />
            </div>
          </div>
        </div>

        {/* ── CATEGORY CHIPS ── */}
        <div style={{ display: "flex", gap: 10, overflowX: "auto", marginBottom: 32, paddingBottom: 8 }} className="hide-scroll">
          {CATEGORI.map(k => (
            <button key={k} onClick={() => setActiveKat(k)} style={{
              flexShrink: 0, padding: "12px 26px", borderRadius: 14, fontSize: 13, fontWeight: 700, cursor: "pointer", transition: "all 0.3s ease",
              background: activeKat === k ? "#1A4D2E" : "#FFFFFF",
              border: `1px solid ${activeKat === k ? "#1A4D2E" : "#CCCCCC"}`,
              color: activeKat === k ? "#FFFFFF" : "#1A1A1A",
              boxShadow: activeKat === k ? "0 4px 10px rgba(26, 77, 46, 0.15)" : "none"
            }}>
              {k}
            </button>
          ))}
        </div>

        {/* ── SKELETON ── */}
        {dataLoad && (
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill,minmax(240px,1fr))", gap: 20 }}>
            {[1, 2, 3, 4].map(i => <div key={i} className="sk" style={{ height: 320, borderRadius: 20, background: "#FFFFFF" }} />)}
          </div>
        )}

        {/* ── BENTO GRID (PRODUK & BANNER) ── */}
        {!dataLoad && (
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))", gap: 24, gridAutoFlow: "dense" }}>
                
                {/* Banner Promo / Iklan Warung Lokal (SOLID WHITE) */}
                {iklan.length > 0 && (
                     <div style={{ gridColumn: "span 2 / auto", position: "relative", borderRadius: 24, overflow: "hidden", minHeight: 250, border: "1px solid #E0E0E0", boxShadow: "0 4px 15px rgba(0,0,0,0.05)" }}>
                        <div ref={sliderRef} style={{ display: "flex", height: "100%", overflowX: "hidden", scrollSnapType: "x mandatory" }}>
                        {iklan.map((ik, i) => (
                            <div key={ik.id || i} style={{ flex: "0 0 100%", scrollSnapAlign: "start", position: "relative", background: "#FFFFFF" }}>
                            {ik.tipe === "video" ? (
                                <video src={ik.mediaUrl} autoPlay muted loop playsInline style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                            ) : (
                                <img src={ik.mediaUrl} alt={ik.judul} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                            )}
                            <div style={{ position: "absolute", inset: 0, background: "linear-gradient(to top, rgba(0,0,0,0.8) 0%, rgba(0,0,0,0) 100%)", display: "flex", flexDirection: "column", justifyContent: "flex-end", padding: "32px" }}>
                                <div style={{ display: "inline-block", background: "#FFFFFF", color: "#1A4D2E", fontSize: 10, fontWeight: 800, padding: "5px 12px", borderRadius: 8, marginBottom: 12, textTransform: "uppercase", letterSpacing: ".1em", width: "max-content" }}>UMKM Lokal</div>
                                <h3 style={{ color: "#FFFFFF", fontSize: 28, fontWeight: 800, margin: 0, marginBottom: 8, lineHeight: 1.2 }}>{ik.judul}</h3>
                                <p style={{ color: "rgba(255,255,255,0.9)", fontSize: 14, margin: 0, maxWidth: "80%" }}>{ik.deskripsi}</p>
                            </div>
                            </div>
                        ))}
                        </div>
                     </div>
                )}

                {/* List Produk (SOLID WHITE & JELAS) */}
                {filteredProduk.map((p, i) => {
                const sold = MOCK_SOLD[i % MOCK_SOLD.length];
                const rating = MOCK_RATING[i % MOCK_RATING.length];
                return (
                    <div key={p.id} className="product-card"
                        style={{ 
                            background: "#FFFFFF", 
                            borderRadius: 20, 
                            border: "1px solid #E0E0E0", 
                            cursor: "pointer", 
                            display: "flex", 
                            flexDirection: "column",
                            transition: "all 0.3s",
                            position: "relative",
                            overflow: "hidden",
                            boxShadow: "0 2px 8px rgba(0,0,0,0.03)"
                        }}
                        onClick={() => { setSelectedProduk(p); setCheckout(true); }}
                        onMouseEnter={(e) => {
                            e.currentTarget.style.transform = "translateY(-5px)";
                            e.currentTarget.style.boxShadow = "0 8px 20px rgba(0,0,0,0.08)";
                            e.currentTarget.style.borderColor = "#1A4D2E";
                        }}
                        onMouseLeave={(e) => {
                            e.currentTarget.style.transform = "translateY(0)";
                            e.currentTarget.style.boxShadow = "0 2px 8px rgba(0,0,0,0.03)";
                            e.currentTarget.style.borderColor = "#E0E0E0";
                        }}
                    >
                    
                    {/* Product Image */}
                    <div style={{ aspectRatio: "4/3", background: "#FAFAFA", display: "flex", alignItems: "center", justifyContent: "center", position: "relative", zIndex: 1, borderBottom: "1px solid #E0E0E0" }}>
                        {p.foto ? (
                        <img src={p.foto} alt={p.nama} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                        ) : (
                        <span style={{ fontSize: 64, filter: "drop-shadow(0 2px 4px rgba(0,0,0,0.1))" }}>{p.icon || "🎋"}</span>
                        )}
                        {p.tag && (
                        <div style={{ position: "absolute", top: 12, left: 12, padding: "5px 12px", background: "rgba(26, 77, 46, 0.9)", border: "1px solid rgba(255,255,255,0.2)", borderRadius: 8, fontSize: 10, fontWeight: 700, textTransform: "uppercase", letterSpacing: ".1em", color: "#FFFFFF" }}>{p.tag}</div>
                        )}
                    </div>

                    {/* Info */}
                    <div style={{ padding: "20px", display: "flex", flexDirection: "column", gap: 10, flex: 1, zIndex: 1 }}>
                        <div style={{ fontSize: 16, fontWeight: 800, color: "#1A1A1A", lineHeight: 1.3 }}>{p.nama}</div>
                        <div style={{ fontSize: 12, color: "#4F4F4F", lineHeight: 1.5, flexGrow: 1 }}>{p.deskripsi.slice(0, 60)}...</div>

                        {/* Story / Impact Mini Badge - JELAS */}
                        <div style={{ display: "flex", alignItems: "center", gap: 6, background: "rgba(26, 77, 46, 0.05)", padding: "6px 10px", borderRadius: 6, border: "1px solid rgba(26, 77, 46, 0.1)"}}>
                            <span style={{fontSize: 10}}>🌱</span>
                            <span style={{ fontSize: 10, color: "#1A4D2E", fontWeight: 700 }}>Kontribusi Ekonomi Desa</span>
                        </div>

                        {/* Rating & Sold - HITAM & KONTRAST */}
                        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginTop: 8 }}>
                            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                                <span style={{ fontSize: 11, color: "#1A1A1A", fontWeight: 800 }}>⭐ {rating}</span>
                                <span style={{ fontSize: 10, color: "#CCCCCC" }}>|</span>
                                <span style={{ fontSize: 11, color: "#666666" }}>{sold} terjual</span>
                            </div>
                        </div>

                        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginTop: 12, paddingTop: 12, borderTop: "1px solid #E0E0E0" }}>
                            <div style={{display: "flex", flexDirection: "column"}}>
                                <span style={{fontSize: 9, color: "#999999", textTransform: "uppercase", letterSpacing: "0.1em"}}>Harga / Produk</span>
                                <span className="fnt" style={{ fontSize: 18, fontWeight: 800, color: "#1A4D2E" }}>{fRp(p.harga)}</span>
                            </div>
                            <div className="btn-beli" style={{ padding: "10px 18px", background: "transparent", border: "1px solid #1A4D2E", borderRadius: 10, fontSize: 11, fontWeight: 700, color: "#1A4D2E", transition: "all 0.2s" }}>Beli Sekarang</div>
                        </div>
                    </div>
                    </div>
                );
                })}
            </div>
        )}

        {/* ── TRUST BADGES - SOLID WHITE ── */}
        <div style={{ marginTop: 60, padding: "32px", background: "#FFFFFF", borderRadius: 24, border: "1px solid #E0E0E0", display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(200px,1fr))", gap: 24, boxShadow: "0 2px 10px rgba(0,0,0,0.03)" }}>
          {[
            { icon: "🌿", t: "Produk Lokal Autentik", d: "Asli buatan warga Kp. Ciburial" },
            { icon: "📦", t: "Pengiriman Cepat", d: "Dikirim langsung dari Makers desa" },
            { icon: "🤝", t: "Pemberdayaan Warga", d: "Keuntungan untuk ekonomi desa" },
            { icon: "♻️", t: "Ramah Lingkungan", d: "Material lokal & organik" },
          ].map((b, i) => (
            <div key={i} style={{ display: "flex", gap: 16, alignItems: "flex-start" }}>
              <div style={{ fontSize: 28, background: "rgba(0,0,0,0.05)", padding: 12, borderRadius: 14 }}>{b.icon}</div>
              <div>
                <div style={{ fontSize: 14, fontWeight: 800, color: "#1A1A1A", marginBottom: 4 }}>{b.t}</div>
                <div style={{ fontSize: 12, color: "#666666", lineHeight: 1.4 }}>{b.d}</div>
              </div>
            </div>
          ))}
        </div>
      </div>

      <style>{`
        .hide-scroll::-webkit-scrollbar { display: none; }
        .hide-scroll { -ms-overflow-style: none; scrollbar-width: none; }
        
        .product-card:hover .btn-beli {
            background: #1A4D2E !important;
            color: #FFFFFF !important;
        }
      `}</style>
    </div>
  );
}