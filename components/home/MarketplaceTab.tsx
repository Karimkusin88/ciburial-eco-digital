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

          {/* Order Summary Card */}
          <div style={{ background: "var(--cw)", border: "1px solid var(--bo)", borderRadius: 20, overflow: "hidden", marginBottom: 16 }}>
            <div style={{ background: "var(--fo)", padding: "16px 22px", display: "flex", alignItems: "center", gap: 14 }}>
              <div style={{ width: 48, height: 48, borderRadius: 12, background: "rgba(255,255,255,.12)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 24 }}>{p.icon || "🎋"}</div>
              <div>
                <div style={{ fontSize: 10, fontWeight: 700, letterSpacing: ".14em", textTransform: "uppercase", color: "rgba(250,248,243,.45)", marginBottom: 2 }}>Pesanan Anda</div>
                <div style={{ fontSize: 15, fontWeight: 700, color: "var(--cr)" }}>{p.nama}</div>
              </div>
              <div style={{ marginLeft: "auto", textAlign: "right" }}>
                <div style={{ fontSize: 10, color: "rgba(250,248,243,.4)" }}>Total</div>
                <div className="fnt" style={{ fontSize: 20, fontWeight: 600, color: "var(--gl)" }}>{fRp(p.harga)}</div>
              </div>
            </div>
            <div style={{ padding: "24px 22px", display: "flex", flexDirection: "column", gap: 14 }}>
              <div style={{ display: "flex", gap: 12, padding: "12px 16px", background: "rgba(184,148,63,.07)", borderRadius: 10, border: "1px solid rgba(184,148,63,.15)", fontSize: 12, color: "var(--ts)", alignItems: "center" }}>
                <span style={{ fontSize: 18 }}>📦</span>
                <span>Pengiriman langsung dari <strong>Ciburial Makers</strong> ke alamat Anda. Estimasi 3–7 hari.</span>
              </div>
              {[{ l: "Nama Lengkap", t: "text", p: "Cth: Budi Santoso" }, { l: "No. WhatsApp Aktif", t: "tel", p: "Cth: 08123456789" }].map((f, i) => (
                <div key={i}>
                  <label style={{ display: "block", fontSize: 10, fontWeight: 700, letterSpacing: ".1em", textTransform: "uppercase", color: "var(--ts)", marginBottom: 6 }}>{f.l}</label>
                  <input type={f.t} placeholder={f.p} className="fi" />
                </div>
              ))}
              <div>
                <label style={{ display: "block", fontSize: 10, fontWeight: 700, letterSpacing: ".1em", textTransform: "uppercase", color: "var(--ts)", marginBottom: 6 }}>Alamat Lengkap</label>
                <textarea rows={3} className="fi" placeholder="Cth: Jl. Merdeka No.10, RT 01/02, Bandung" style={{ resize: "vertical" }} />
              </div>
              <div>
                <label style={{ display: "block", fontSize: 10, fontWeight: 700, letterSpacing: ".1em", textTransform: "uppercase", color: "var(--ts)", marginBottom: 6 }}>Catatan (opsional)</label>
                <textarea rows={2} className="fi" placeholder="Warna, ukuran, atau permintaan khusus..." style={{ resize: "vertical" }} />
              </div>
            </div>
          </div>

          {/* Payment button */}
          <button onClick={() => bayarSekarang(p)} disabled={loadingSnap} style={{ width: "100%", padding: "16px", borderRadius: 14, fontSize: 13, fontWeight: 700, letterSpacing: ".08em", textTransform: "uppercase", border: "none", cursor: loadingSnap ? "wait" : "pointer", background: loadingSnap ? "var(--tm)" : "var(--fo)", color: "#fff", transition: "background .2s", display: "flex", alignItems: "center", justifyContent: "center", gap: 10 }}>
            <span>{loadingSnap ? "⏳ Menghubungi Midtrans..." : `🔒 Bayar ${fRp(p.harga)} via QRIS / Transfer`}</span>
          </button>
          <p style={{ textAlign: "center", fontSize: 11, color: "var(--tm)", marginTop: 12 }}>Pembayaran aman & terenkripsi melalui Midtrans. Dana langsung tercatat di Transparansi Desa.</p>
        </div>
      </div>
    );
  }

  // ─── MAIN MARKETPLACE PAGE ───────────────────────────────────────────────────
  return (
    <div className="pi" style={{ paddingTop: "clamp(64px,10vw,120px)", paddingBottom: 80, background: "var(--cr)" }}>
      <div style={{ maxWidth: 1320, margin: "0 auto", padding: "0 clamp(12px,3vw,24px)" }}>

        {/* ── TOP HERO SEARCH BAR ── */}
        <div style={{ background: "var(--fo)", borderRadius: 24, padding: "28px 32px", marginBottom: 24, display: "flex", flexWrap: "wrap", gap: 16, alignItems: "center", justifyContent: "space-between" }}>
          <div>
            <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: ".2em", textTransform: "uppercase", color: "rgba(250,248,243,.4)", marginBottom: 4 }}>Ciburial</div>
            <h1 className="fnt" style={{ fontSize: "clamp(24px,4vw,38px)", fontWeight: 300, color: "var(--cr)", letterSpacing: "-.02em", lineHeight: 1.1 }}>Marketplace<br /><em>Eco-Local</em></h1>
          </div>
          <div style={{ display: "flex", gap: 10, alignItems: "center", flex: 1, minWidth: 240, maxWidth: 440 }}>
            <div style={{ position: "relative", flex: 1 }}>
              <span style={{ position: "absolute", left: 14, top: "50%", transform: "translateY(-50%)", fontSize: 16, opacity: .5 }}>🔍</span>
              <input
                value={search}
                onChange={e => setSearch(e.target.value)}
                placeholder="Cari produk Ciburial..."
                style={{ width: "100%", padding: "12px 12px 12px 42px", borderRadius: 99, background: "rgba(255,255,255,.12)", border: "1px solid rgba(255,255,255,.15)", color: "var(--cr)", fontSize: 13, outline: "none", boxSizing: "border-box" }}
              />
            </div>
          </div>
        </div>

        {/* ── PROMO BANNER SLIDER ── */}
        {iklan.length > 0 && !dataLoad && (
          <div style={{ marginBottom: 24, position: "relative" }}>
            <div ref={sliderRef} style={{ display: "flex", overflowX: "hidden", borderRadius: 20, scrollSnapType: "x mandatory" }}>
              {iklan.map((ik, i) => (
                <div key={ik.id || i} style={{ flex: "0 0 100%", scrollSnapAlign: "start", position: "relative", aspectRatio: "21/8", minHeight: 160, background: "var(--fo)", borderRadius: 20, overflow: "hidden" }}>
                  {ik.tipe === "video" ? (
                    <>
                      <video src={ik.mediaUrl} autoPlay muted loop playsInline
                        onClick={e => { e.currentTarget.muted = !e.currentTarget.muted; }}
                        style={{ width: "100%", height: "100%", objectFit: "cover", cursor: "pointer" }} />
                      <div style={{ position: "absolute", top: 10, left: 10, background: "rgba(0,0,0,.55)", color: "#fff", padding: "3px 10px", borderRadius: 8, fontSize: 10, fontWeight: 700, backdropFilter: "blur(4px)" }}>🔊 Tap Untuk Suara</div>
                    </>
                  ) : (
                    <img src={ik.mediaUrl} alt={ik.judul} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                  )}
                  <div style={{ position: "absolute", bottom: 0, left: 0, right: 0, padding: "50px 24px 22px", background: "linear-gradient(to top, rgba(0,0,0,.88), transparent)" }}>
                    <div style={{ display: "inline-block", background: "var(--go)", color: "#fff", fontSize: 9, fontWeight: 800, padding: "3px 10px", borderRadius: 6, marginBottom: 6, textTransform: "uppercase", letterSpacing: ".1em" }}>PROMO</div>
                    <h3 style={{ color: "#fff", fontSize: 18, fontWeight: 700, margin: 0, marginBottom: 4 }}>{ik.judul}</h3>
                    <p style={{ color: "rgba(255,255,255,.8)", fontSize: 12, margin: 0 }}>{ik.deskripsi}</p>
                    {ik.linkTujuan && <a href={ik.linkTujuan} target="_blank" rel="noreferrer" style={{ display: "inline-block", marginTop: 10, padding: "6px 16px", background: "var(--go)", color: "#fff", borderRadius: 8, fontSize: 11, fontWeight: 700, textDecoration: "none" }}>Lihat Promo →</a>}
                  </div>
                </div>
              ))}
            </div>
            {/* Slide dots */}
            {iklan.length > 1 && (
              <div style={{ display: "flex", justifyContent: "center", gap: 6, marginTop: 10 }}>
                {iklan.map((_, i) => (
                  <button key={i} onClick={() => setActiveSlide(i)} style={{ width: i === activeSlide ? 20 : 6, height: 6, borderRadius: 99, background: i === activeSlide ? "var(--go)" : "var(--bo)", border: "none", cursor: "pointer", padding: 0, transition: "all .3s" }} />
                ))}
              </div>
            )}
          </div>
        )}

        {/* ── CATEGORY CHIPS ── */}
        <div style={{ display: "flex", gap: 8, overflowX: "auto", marginBottom: 20, paddingBottom: 4 }} className="hide-scroll">
          {CATEGORI.map(k => (
            <button key={k} onClick={() => setActiveKat(k)} style={{
              flexShrink: 0, padding: "8px 18px", borderRadius: 99, fontSize: 12, fontWeight: 700, border: "none", cursor: "pointer", transition: "all .2s",
              background: activeKat === k ? "var(--fo)" : "var(--cw)",
              color: activeKat === k ? "var(--cr)" : "var(--ts)",
              boxShadow: activeKat === k ? "0 2px 12px rgba(0,0,0,.12)" : "none"
            }}>
              {k}
            </button>
          ))}
        </div>

        {/* ── SECTION HEADER ── */}
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 16 }}>
          <div style={{ fontSize: 14, fontWeight: 700, color: "var(--tp)" }}>
            {search ? `Hasil pencarian "${search}"` : `Produk ${activeKat === "Semua" ? "Unggulan" : activeKat}`}&nbsp;
            <span style={{ fontWeight: 400, color: "var(--tm)", fontSize: 12 }}>({filteredProduk.length} produk)</span>
          </div>
          <div style={{ fontSize: 11, color: "var(--tm)" }}>🏷️ Langsung dari warga Ciburial</div>
        </div>

        {/* ── SKELETON ── */}
        {dataLoad && (
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill,minmax(180px,1fr))", gap: 14 }}>
            {[1, 2, 3, 4, 5, 6].map(i => <div key={i} className="sk" style={{ height: 280, borderRadius: 16 }} />)}
          </div>
        )}

        {/* ── PRODUK GRID ── */}
        {!dataLoad && filteredProduk.length === 0 && (
          <div style={{ textAlign: "center", padding: "60px 20px", color: "var(--tm)" }}>
            <div style={{ fontSize: 40, marginBottom: 12 }}>🔍</div>
            <div style={{ fontWeight: 600 }}>Produk tidak ditemukan</div>
            <div style={{ fontSize: 13, marginTop: 6 }}>Coba kata kunci lain atau ubah filter</div>
          </div>
        )}

        {!dataLoad && filteredProduk.length > 0 && (
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill,minmax(175px,1fr))", gap: 14 }}>
            {filteredProduk.map((p, i) => {
              const sold = MOCK_SOLD[i % MOCK_SOLD.length];
              const rating = MOCK_RATING[i % MOCK_RATING.length];
              return (
                <div key={p.id} className={`rv ch`}
                  style={{ background: "var(--cw)", borderRadius: 16, overflow: "hidden", border: "1px solid var(--bo)", cursor: "pointer", display: "flex", flexDirection: "column" }}
                  onClick={() => { setSelectedProduk(p); setCheckout(true); }}
                >
                  {/* Product Image */}
                  <div style={{ aspectRatio: "1/1", background: "linear-gradient(135deg,var(--cd) 0%,var(--cr) 100%)", display: "flex", alignItems: "center", justifyContent: "center", position: "relative" }}>
                    {p.foto ? (
                      <img src={p.foto} alt={p.nama} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                    ) : (
                      <span style={{ fontSize: 48 }}>{p.icon || "🎋"}</span>
                    )}
                    {p.tag && (
                      <div style={{ position: "absolute", top: 10, left: 10, padding: "3px 9px", background: "var(--fo)", borderRadius: 6, fontSize: 9, fontWeight: 800, textTransform: "uppercase", letterSpacing: ".07em", color: "#fff" }}>{p.tag}</div>
                    )}
                    <div style={{ position: "absolute", top: 10, right: 10, width: 30, height: 30, background: "rgba(255,255,255,.9)", borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 14 }}>♡</div>
                  </div>

                  {/* Info */}
                  <div style={{ padding: "12px 14px 14px", display: "flex", flexDirection: "column", gap: 6, flex: 1 }}>
                    <div style={{ fontSize: 13, fontWeight: 700, color: "var(--tp)", lineHeight: 1.3 }}>{p.nama}</div>
                    <div style={{ fontSize: 11, color: "var(--tm)", lineHeight: 1.5, flexGrow: 1 }}>{p.deskripsi.slice(0, 55)}...</div>

                    {/* Rating & Sold */}
                    <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                      <span style={{ fontSize: 10, color: "#F59E0B", fontWeight: 700 }}>⭐ {rating}</span>
                      <span style={{ fontSize: 10, color: "var(--tm)" }}>|</span>
                      <span style={{ fontSize: 10, color: "var(--tm)" }}>{sold} terjual</span>
                    </div>

                    <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginTop: 4 }}>
                      <span className="fnt" style={{ fontSize: 17, fontWeight: 700, color: "var(--fo)" }}>{fRp(p.harga)}</span>
                      <div style={{ padding: "6px 12px", background: "var(--fo)", borderRadius: 8, fontSize: 10, fontWeight: 700, color: "#fff" }}>+ Keranjang</div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* ── TRUST BADGES ── */}
        <div style={{ marginTop: 40, padding: "24px", background: "var(--cw)", borderRadius: 20, border: "1px solid var(--bo)", display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(160px,1fr))", gap: 16 }}>
          {[
            { icon: "🌿", t: "100% Lokal", d: "Dibuat warga Ciburial sendiri" },
            { icon: "🔒", t: "Pembayaran Aman", d: "Diproses via Midtrans terenkripsi" },
            { icon: "📦", t: "Pengiriman Terjamin", d: "Dikirim langsung oleh Ciburial Makers" },
            { icon: "♻️", t: "Eco-Friendly", d: "Material daur ulang & organik" },
          ].map((b, i) => (
            <div key={i} style={{ display: "flex", gap: 12, alignItems: "center" }}>
              <span style={{ fontSize: 24 }}>{b.icon}</span>
              <div>
                <div style={{ fontSize: 12, fontWeight: 700, color: "var(--tp)" }}>{b.t}</div>
                <div style={{ fontSize: 11, color: "var(--tm)" }}>{b.d}</div>
              </div>
            </div>
          ))}
        </div>
      </div>

      <style>{`
        .hide-scroll::-webkit-scrollbar { display: none; }
        .hide-scroll { -ms-overflow-style: none; scrollbar-width: none; }
      `}</style>
    </div>
  );
}
