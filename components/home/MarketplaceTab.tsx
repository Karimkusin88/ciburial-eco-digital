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

  // ─── CHECKOUT PAGE ──────────────────────────────────────────────────────────
  if (checkout && selectedProduk) {
    const p = selectedProduk;
    return (
      <div className="pi" style={{ paddingTop: "clamp(64px,10vw,120px)", paddingBottom: 80, minHeight: "100vh", background: "var(--cr)" }}>
        <div style={{ maxWidth: 600, margin: "0 auto", padding: "0 clamp(16px,3vw,28px)" }}>

          {/* Back */}
          <button onClick={() => { setCheckout(false); setSelectedProduk(null); }} style={{ display: "flex", alignItems: "center", gap: 6, background: "none", border: "none", cursor: "pointer", fontSize: 13, fontWeight: 600, color: "var(--tm)", marginBottom: 24, padding: "6px 0" }}>
            ← Kembali ke Toko
          </button>

          {/* Order Summary Card - ECO TECH STYLE */}
          <div style={{ background: "rgba(255, 255, 255, 0.05)", border: "1px solid rgba(255, 255, 255, 0.1)", backdropFilter: "blur(10px)", borderRadius: 20, overflow: "hidden", marginBottom: 16 }}>
            <div style={{ background: "linear-gradient(135deg, rgba(46, 139, 87, 0.2) 0%, rgba(0, 0, 0, 0.4) 100%)", padding: "16px 22px", display: "flex", alignItems: "center", gap: 14 }}>
              <div style={{ width: 56, height: 56, borderRadius: 16, background: "rgba(255,255,255,.1)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 28 }}>{p.icon || "🎋"}</div>
              <div>
                <div style={{ fontSize: 10, fontWeight: 700, letterSpacing: ".14em", textTransform: "uppercase", color: "var(--go)", marginBottom: 2 }}>{p.tag || "Eco-Product"}</div>
                <div style={{ fontSize: 16, fontWeight: 700, color: "var(--cw)" }}>{p.nama}</div>
              </div>
              <div style={{ marginLeft: "auto", textAlign: "right" }}>
                <div style={{ fontSize: 10, color: "rgba(255,255,255,.5)" }}>Total</div>
                <div className="fnt" style={{ fontSize: 20, fontWeight: 600, color: "var(--go)" }}>{fRp(p.harga)}</div>
              </div>
            </div>
            
            {/* Story-Driven Info */}
             <div style={{ padding: "16px 22px", background: "rgba(0,0,0,0.2)", borderBottom: "1px solid rgba(255,255,255,0.05)"}}>
                 <div style={{fontSize: 12, color: "var(--cw)", fontStyle: "italic", display: "flex", alignItems: "center", gap: 8}}>
                     <span>✨</span>
                     <span>"Karya asli warga Ciburial, mendukung kemandirian ekonomi desa."</span>
                 </div>
             </div>

            <div style={{ padding: "24px 22px", display: "flex", flexDirection: "column", gap: 14 }}>
              {/* Emas Digital Highlight */}
              <div style={{ display: "flex", gap: 12, padding: "16px", background: "linear-gradient(90deg, rgba(218, 165, 32, 0.1) 0%, rgba(218, 165, 32, 0.05) 100%)", borderRadius: 12, border: "1px solid rgba(218, 165, 32, 0.3)", alignItems: "center" }}>
                <span style={{ fontSize: 24 }}>🪙</span>
                <div>
                  <div style={{ fontSize: 13, fontWeight: 700, color: "var(--go)", marginBottom: 4 }}>Otomatis Konversi ke Emas Digital!</div>
                  <div style={{ fontSize: 11, color: "rgba(255,255,255,0.7)" }}>Setiap pembelian atau penukaran poin Bank Sampah akan langsung dicatat sebagai aset masa depan lo.</div>
                </div>
              </div>

              {/* Form Input yang lebih sleek */}
              {[{ l: "Nama Lengkap", t: "text", p: "Cth: Budi Santoso" }, { l: "No. WhatsApp Aktif", t: "tel", p: "Cth: 08123456789" }].map((f, i) => (
                <div key={i}>
                  <label style={{ display: "block", fontSize: 10, fontWeight: 700, letterSpacing: ".1em", textTransform: "uppercase", color: "rgba(255,255,255,0.6)", marginBottom: 6 }}>{f.l}</label>
                  <input type={f.t} placeholder={f.p} style={{ width: "100%", padding: "12px", background: "rgba(0,0,0,0.3)", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 8, color: "var(--cw)", boxSizing: "border-box" }} />
                </div>
              ))}
            </div>
          </div>

          {/* Payment button */}
          <button onClick={() => bayarSekarang(p)} disabled={loadingSnap} style={{ width: "100%", padding: "16px", borderRadius: 14, fontSize: 13, fontWeight: 700, letterSpacing: ".08em", textTransform: "uppercase", border: "none", cursor: loadingSnap ? "wait" : "pointer", background: loadingSnap ? "var(--tm)" : "linear-gradient(90deg, var(--fo) 0%, #2E8B57 100%)", color: "#fff", transition: "all .3s", boxShadow: loadingSnap ? "none" : "0 4px 15px rgba(46, 139, 87, 0.3)", display: "flex", alignItems: "center", justifyContent: "center", gap: 10 }}>
            <span>{loadingSnap ? "⏳ Menghubungi Sistem..." : `🔒 Checkout & Investasi Emas (${fRp(p.harga)})`}</span>
          </button>
        </div>
      </div>
    );
  }

  // ─── MAIN MARKETPLACE PAGE ───────────────────────────────────────────────────
  return (
    <div className="pi" style={{ paddingTop: "clamp(64px,10vw,120px)", paddingBottom: 80, background: "var(--cr)", minHeight: "100vh" }}>
      <div style={{ maxWidth: 1320, margin: "0 auto", padding: "0 clamp(12px,3vw,24px)" }}>

        {/* ── TOP HERO SEARCH BAR - GLASSMORPHISM ── */}
        <div style={{ background: "rgba(255,255,255,0.05)", backdropFilter: "blur(10px)", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 24, padding: "32px", marginBottom: 32, display: "flex", flexWrap: "wrap", gap: 24, alignItems: "center", justifyContent: "space-between" }}>
          <div>
            <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 8 }}>
                <span style={{width: 8, height: 8, background: "var(--go)", borderRadius: "50%", display: "inline-block", boxShadow: "0 0 10px var(--go)"}}></span>
                <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: ".2em", textTransform: "uppercase", color: "var(--go)" }}>Ekosistem Web3</div>
            </div>
            <h1 className="fnt" style={{ fontSize: "clamp(28px,4vw,42px)", fontWeight: 800, color: "var(--cw)", letterSpacing: "-.02em", lineHeight: 1.1 }}>
              Marketplace <span style={{ color: "transparent", WebkitTextStroke: "1px var(--go)" }}>Ciburial</span>
            </h1>
          </div>
          <div style={{ display: "flex", gap: 10, alignItems: "center", flex: 1, minWidth: 240, maxWidth: 440 }}>
            <div style={{ position: "relative", flex: 1 }}>
              <span style={{ position: "absolute", left: 16, top: "50%", transform: "translateY(-50%)", fontSize: 16, opacity: .7 }}>🔍</span>
              <input
                value={search}
                onChange={e => setSearch(e.target.value)}
                placeholder="Cari inovasi desa..."
                style={{ width: "100%", padding: "14px 14px 14px 46px", borderRadius: 12, background: "rgba(0,0,0,0.3)", border: "1px solid rgba(255,255,255,0.2)", color: "var(--cw)", fontSize: 14, outline: "none", boxSizing: "border-box", transition: "all 0.3s" }}
                onFocus={(e) => e.target.style.borderColor = "var(--go)"}
                onBlur={(e) => e.target.style.borderColor = "rgba(255,255,255,0.2)"}
              />
            </div>
          </div>
        </div>

        {/* ── CATEGORY CHIPS ── */}
        <div style={{ display: "flex", gap: 10, overflowX: "auto", marginBottom: 32, paddingBottom: 8 }} className="hide-scroll">
          {CATEGORI.map(k => (
            <button key={k} onClick={() => setActiveKat(k)} style={{
              flexShrink: 0, padding: "10px 24px", borderRadius: 12, fontSize: 13, fontWeight: 700, cursor: "pointer", transition: "all .3s ease",
              background: activeKat === k ? "var(--go)" : "rgba(255,255,255,0.05)",
              border: `1px solid ${activeKat === k ? "var(--go)" : "rgba(255,255,255,0.1)"}`,
              color: activeKat === k ? "#000" : "var(--cw)",
              boxShadow: activeKat === k ? "0 4px 15px rgba(218, 165, 32, 0.4)" : "none"
            }}>
              {k}
            </button>
          ))}
        </div>

        {/* ── SKELETON ── */}
        {dataLoad && (
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill,minmax(240px,1fr))", gap: 20 }}>
            {[1, 2, 3, 4].map(i => <div key={i} className="sk" style={{ height: 320, borderRadius: 20, background: "rgba(255,255,255,0.05)" }} />)}
          </div>
        )}

        {/* ── BENTO GRID (PRODUK & BANNER) ── */}
        {!dataLoad && (
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))", gap: 24, gridAutoFlow: "dense" }}>
                
                {/* Banner Promo / Iklan Warung Lokal (Ditampilkan di urutan ke-2 dalam grid) */}
                {iklan.length > 0 && (
                     <div style={{ gridColumn: "span 2 / auto", position: "relative", borderRadius: 24, overflow: "hidden", minHeight: 250, boxShadow: "0 10px 30px rgba(0,0,0,0.2)" }}>
                        <div ref={sliderRef} style={{ display: "flex", height: "100%", overflowX: "hidden", scrollSnapType: "x mandatory" }}>
                        {iklan.map((ik, i) => (
                            <div key={ik.id || i} style={{ flex: "0 0 100%", scrollSnapAlign: "start", position: "relative", background: "var(--fo)" }}>
                            {ik.tipe === "video" ? (
                                <video src={ik.mediaUrl} autoPlay muted loop playsInline style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                            ) : (
                                <img src={ik.mediaUrl} alt={ik.judul} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                            )}
                            <div style={{ position: "absolute", inset: 0, background: "linear-gradient(to top, rgba(0,0,0,.9) 0%, rgba(0,0,0,0) 100%)", display: "flex", flexDirection: "column", justifyContent: "flex-end", padding: "32px" }}>
                                <div style={{ display: "inline-block", background: "var(--go)", color: "#000", fontSize: 10, fontWeight: 800, padding: "4px 12px", borderRadius: 8, marginBottom: 12, textTransform: "uppercase", letterSpacing: ".1em", width: "max-content" }}>UMKM Lokal</div>
                                <h3 style={{ color: "#fff", fontSize: 28, fontWeight: 800, margin: 0, marginBottom: 8, lineHeight: 1.2 }}>{ik.judul}</h3>
                                <p style={{ color: "rgba(255,255,255,.8)", fontSize: 14, margin: 0, maxWidth: "80%" }}>{ik.deskripsi}</p>
                            </div>
                            </div>
                        ))}
                        </div>
                     </div>
                )}

                {/* List Produk */}
                {filteredProduk.map((p, i) => {
                const sold = MOCK_SOLD[i % MOCK_SOLD.length];
                const rating = MOCK_RATING[i % MOCK_RATING.length];
                return (
                    <div key={p.id} className="product-card"
                        style={{ 
                            background: "rgba(255,255,255,0.03)", 
                            borderRadius: 20, 
                            border: "1px solid rgba(255,255,255,0.08)", 
                            cursor: "pointer", 
                            display: "flex", 
                            flexDirection: "column",
                            transition: "all 0.3s cubic-bezier(0.4, 0, 0.2, 1)",
                            position: "relative",
                            overflow: "hidden"
                        }}
                        onClick={() => { setSelectedProduk(p); setCheckout(true); }}
                        onMouseEnter={(e) => {
                            e.currentTarget.style.transform = "translateY(-5px)";
                            e.currentTarget.style.boxShadow = "0 10px 20px rgba(0,0,0,0.2)";
                            e.currentTarget.style.borderColor = "rgba(46, 139, 87, 0.5)";
                        }}
                        onMouseLeave={(e) => {
                            e.currentTarget.style.transform = "translateY(0)";
                            e.currentTarget.style.boxShadow = "none";
                            e.currentTarget.style.borderColor = "rgba(255,255,255,0.08)";
                        }}
                    >
                    
                    {/* Background Glow Effect */}
                    <div style={{ position: "absolute", top: -50, left: -50, width: 100, height: 100, background: "var(--fo)", filter: "blur(50px)", opacity: 0.1, zIndex: 0 }}></div>

                    {/* Product Image */}
                    <div style={{ aspectRatio: "4/3", background: "rgba(0,0,0,0.2)", display: "flex", alignItems: "center", justifyContent: "center", position: "relative", zIndex: 1 }}>
                        {p.foto ? (
                        <img src={p.foto} alt={p.nama} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                        ) : (
                        <span style={{ fontSize: 64, filter: "drop-shadow(0 4px 8px rgba(0,0,0,0.3))" }}>{p.icon || "🎋"}</span>
                        )}
                        {p.tag && (
                        <div style={{ position: "absolute", top: 12, left: 12, padding: "4px 12px", background: "rgba(0,0,0,0.6)", backdropFilter: "blur(4px)", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 8, fontSize: 10, fontWeight: 700, textTransform: "uppercase", letterSpacing: ".1em", color: "var(--go)" }}>{p.tag}</div>
                        )}
                    </div>

                    {/* Info */}
                    <div style={{ padding: "20px", display: "flex", flexDirection: "column", gap: 10, flex: 1, zIndex: 1 }}>
                        <div style={{ fontSize: 16, fontWeight: 800, color: "var(--cw)", lineHeight: 1.3 }}>{p.nama}</div>
                        <div style={{ fontSize: 12, color: "rgba(255,255,255,0.6)", lineHeight: 1.5, flexGrow: 1 }}>{p.deskripsi.slice(0, 60)}...</div>

                        {/* Story / Impact Mini Badge */}
                        <div style={{ display: "flex", alignItems: "center", gap: 6, background: "rgba(46, 139, 87, 0.1)", padding: "6px 10px", borderRadius: 6, border: "1px solid rgba(46, 139, 87, 0.2)"}}>
                            <span style={{fontSize: 10}}>🌱</span>
                            <span style={{ fontSize: 10, color: "var(--go)", fontWeight: 600 }}>Dampak Positif Desa</span>
                        </div>

                        {/* Rating & Sold */}
                        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginTop: 8 }}>
                            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                                <span style={{ fontSize: 11, color: "var(--go)", fontWeight: 800 }}>⭐ {rating}</span>
                                <span style={{ fontSize: 10, color: "rgba(255,255,255,0.3)" }}>|</span>
                                <span style={{ fontSize: 11, color: "rgba(255,255,255,0.5)" }}>{sold} terjual</span>
                            </div>
                        </div>

                        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginTop: 12, paddingTop: 12, borderTop: "1px solid rgba(255,255,255,0.05)" }}>
                            <div style={{display: "flex", flexDirection: "column"}}>
                                <span style={{fontSize: 9, color: "rgba(255,255,255,0.4)", textTransform: "uppercase", letterSpacing: "0.1em"}}>Harga / Poin</span>
                                <span className="fnt" style={{ fontSize: 18, fontWeight: 800, color: "var(--go)" }}>{fRp(p.harga)}</span>
                            </div>
                            <div className="btn-beli" style={{ padding: "8px 16px", background: "transparent", border: "1px solid var(--go)", borderRadius: 8, fontSize: 11, fontWeight: 700, color: "var(--go)", transition: "all 0.2s" }}>Beli / Tukar</div>
                        </div>
                    </div>
                    </div>
                );
                })}
            </div>
        )}

        {/* ── TRUST BADGES - GLASSMORPHISM ── */}
        <div style={{ marginTop: 60, padding: "32px", background: "rgba(255,255,255,0.02)", backdropFilter: "blur(10px)", borderRadius: 24, border: "1px solid rgba(255,255,255,0.05)", display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(200px,1fr))", gap: 24 }}>
          {[
            { icon: "🌿", t: "100% Produk Lokal", d: "Memberdayakan warga Ciburial" },
            { icon: "🪙", t: "Investasi Emas", d: "Poin jadi aset digital aman" },
            { icon: "⛓️", t: "Transparan (Web3)", d: "Tercatat di blockchain Ciburial" },
            { icon: "♻️", t: "Ekonomi Sirkular", d: "Zero waste & ramah lingkungan" },
          ].map((b, i) => (
            <div key={i} style={{ display: "flex", gap: 16, alignItems: "flex-start" }}>
              <div style={{ fontSize: 28, background: "rgba(46, 139, 87, 0.1)", padding: 12, borderRadius: 12 }}>{b.icon}</div>
              <div>
                <div style={{ fontSize: 14, fontWeight: 800, color: "var(--cw)", marginBottom: 4 }}>{b.t}</div>
                <div style={{ fontSize: 12, color: "rgba(255,255,255,0.6)", lineHeight: 1.4 }}>{b.d}</div>
              </div>
            </div>
          ))}
        </div>
      </div>

      <style>{`
        .hide-scroll::-webkit-scrollbar { display: none; }
        .hide-scroll { -ms-overflow-style: none; scrollbar-width: none; }
        
        .product-card:hover .btn-beli {
            background: var(--go) !important;
            color: #000 !important;
        }
      `}</style>
    </div>
  );
}