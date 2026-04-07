"use client";
import { Produk, Iklan, fRp } from "./types";
import { useState } from "react";

interface MarketplaceTabProps {
  produk: Produk[];
  iklan?: Iklan[];
  dataLoad: boolean;
  checkout: boolean;
  setCheckout: (val: boolean) => void;
}

export default function MarketplaceTab({ produk, iklan = [], dataLoad, checkout, setCheckout }: MarketplaceTabProps) {
  const [loadingSnap, setLoadingSnap] = useState(false);

  const bayarSekarang = async () => {
    setLoadingSnap(true);
    try {
      const res = await fetch("/api/midtrans/tokenize", {
        method: "POST",
        headers: { "Content-type": "application/json" },
        body: JSON.stringify({ 
          order_id: `MKT-${Date.now()}`,
          gross_amount: 150000, 
          item_details: [{ id: "mkt-1", price: 150000, quantity: 1, name: "Checkout Produk Ciburial" }]
        })
      });
      const data = await res.json();
      if (data.token && (window as any).snap) {
        (window as any).snap.pay(data.token, {
          onSuccess: function(r:any){ alert("Pembayaran sukses! Terima kasih."); setCheckout(false); },
          onPending: function(r:any){ alert("Menunggu pembayaran Anda."); },
          onError: function(r:any){ alert("Pembayaran gagal."); }
        });
      } else {
        alert("Gagal memanggil API payment. " + (data.error || "Cek console log atau .env"));
      }
    } catch (e) {
      alert("Error contacting server.");
    }
    setLoadingSnap(false);
  };

  if (checkout) {
    return (
      <div className="pi" style={{ paddingTop: "clamp(48px,8vw,106px)", paddingBottom: "clamp(48px,8vw,106px)", minHeight: "100vh" }}>
        <div style={{ maxWidth: 560, margin: "0 auto", padding: "0 clamp(16px,3vw,28px)" }}>
          <button onClick={() => setCheckout(false)} style={{ display: "flex", alignItems: "center", gap: 8, background: "none", border: "none", cursor: "pointer", fontSize: 11, fontWeight: 700, letterSpacing: ".1em", textTransform: "uppercase", color: "var(--tm)", marginBottom: 32, padding: 0, transition: "color .2s" }}
            onMouseEnter={e => (e.currentTarget.style.color = "var(--fo)")}
            onMouseLeave={e => (e.currentTarget.style.color = "var(--tm)")}
          >← Kembali</button>
          <div style={{ padding: "20px", background: "var(--fo)", borderRadius: 16, marginBottom: 18, display: "flex", alignItems: "center", gap: 16 }}>
            <span style={{ fontSize: 32 }}>🪔</span>
            <div>
              <div style={{ fontSize: 10, fontWeight: 700, letterSpacing: ".15em", textTransform: "uppercase", color: "rgba(250,248,243,.4)", marginBottom: 3 }}>Pesanan Anda</div>
              <div style={{ fontSize: 15, fontWeight: 700, color: "var(--cr)" }}>Produk Ciburial Makers</div>
            </div>
          </div>
          <div style={{ background: "var(--cw)", border: "1px solid var(--bo)", borderRadius: 22, padding: "38px" }}>
            <h2 className="fnt" style={{ fontSize: 27, fontWeight: 300, color: "var(--fo)", letterSpacing: "-.02em", marginBottom: 6 }}>Detail Pengiriman</h2>
            <p style={{ fontSize: 12, color: "var(--tm)", marginBottom: 30 }}>Pesanan diteruskan ke tim Ciburial Makers via email resmi.</p>
            <div style={{ display: "flex", flexDirection: "column", gap: 18 }}>
              {[{ l: "Nama Lengkap", t: "text", p: "Cth: Budi Santoso" }, { l: "No. WhatsApp Aktif", t: "tel", p: "Cth: 08123456789" }].map((f, i) => (
                <div key={i}>
                  <label style={{ display: "block", fontSize: 10, fontWeight: 700, letterSpacing: ".12em", textTransform: "uppercase", color: "var(--ts)", marginBottom: 7 }}>{f.l}</label>
                  <input type={f.t} placeholder={f.p} className="fi" />
                </div>
              ))}
              <div>
                <label style={{ display: "block", fontSize: 10, fontWeight: 700, letterSpacing: ".12em", textTransform: "uppercase", color: "var(--ts)", marginBottom: 7 }}>Alamat Lengkap</label>
                <textarea rows={3} className="fi" style={{ resize: "vertical" }} />
              </div>
              <div>
                <label style={{ display: "block", fontSize: 10, fontWeight: 700, letterSpacing: ".12em", textTransform: "uppercase", color: "var(--ts)", marginBottom: 7 }}>Catatan (opsional)</label>
                <textarea rows={2} className="fi" placeholder="Warna, ukuran, atau permintaan khusus..." style={{ resize: "vertical" }} />
              </div>
              <button type="button" onClick={bayarSekarang} disabled={loadingSnap} className="btn" style={{ width: "100%", padding: "15px", borderRadius: 13, fontSize: 11, fontWeight: 700, letterSpacing: ".14em", textTransform: "uppercase", border: "none", cursor: loadingSnap ? "wait" : "pointer", background: "var(--fo)", color: "#fff", marginTop: 4, opacity: loadingSnap ? 0.7 : 1 }}>
                <span>{loadingSnap ? "Memproses Midtrans..." : "Bayar via Midtrans (Rp150.000) →"}</span>
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="pi" style={{ paddingTop: "clamp(48px,8vw,106px)", paddingBottom: "clamp(48px,8vw,106px)" }}>
      <div style={{ maxWidth: 1320, margin: "0 auto", padding: "0 clamp(16px,3vw,28px)" }}>
        <div style={{ marginBottom: 60, display: "flex", flexWrap: "wrap", alignItems: "flex-end", justifyContent: "space-between", gap: 20 }}>
          <div>
            <div className="dl" />
            <h1 className="fnt" style={{ fontSize: "clamp(40px,7vw,84px)", fontWeight: 300, color: "var(--fo)", lineHeight: .95, letterSpacing: "-.03em" }}>Galeri<br /><em>Produk</em></h1>
          </div>
          <p style={{ maxWidth: 320, fontSize: 14, lineHeight: 1.8, color: "var(--ts)" }}>Setiap produk adalah cerminan keahlian dan kecintaan pemuda Ciburial terhadap tanah dan bambu mereka.</p>
        </div>

        {/* IKLAN & PROMO SLIDER */}
        {iklan.length > 0 && !dataLoad && (
          <div style={{ marginBottom: 60 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 20 }}>
              <span style={{ fontSize: 24 }}>📺</span>
              <div>
                <h2 style={{ fontSize: 16, fontWeight: 700, color: "var(--fo)", letterSpacing: ".02em", textTransform: "uppercase" }}>Sorotan & Promo</h2>
                <p style={{ fontSize: 13, color: "var(--ts)" }}>Papan iklan warga dan penawaran spesial minggu ini.</p>
              </div>
            </div>
            
            <div style={{ display: "flex", gap: 16, overflowX: "auto", scrollSnapType: "x mandatory", paddingBottom: 16 }} className="hide-scroll">
              {iklan.map((ik, i) => (
                <div key={ik.id || i} style={{ scrollSnapAlign: "start", flex: "0 0 clamp(300px, 80vw, 600px)", background: "var(--cw)", border: "1px solid var(--bo)", borderRadius: 20, overflow: "hidden", position: "relative", aspectRatio: "16/9" }}>
                  {ik.tipe === "video" ? (
                    <>
                      <video 
                        src={ik.mediaUrl} 
                        autoPlay muted loop playsInline 
                        onClick={(e) => { e.currentTarget.muted = !e.currentTarget.muted; }}
                        style={{ width: "100%", height: "100%", objectFit: "cover", cursor: "pointer" }} 
                      />
                      <div style={{ position: "absolute", top: 12, left: 12, background: "rgba(0,0,0,0.6)", color: "#fff", padding: "4px 10px", borderRadius: 8, fontSize: 10, fontWeight: 700, backdropFilter: "blur(4px)" }}>
                        Tap Video untuk 🔊 Suara
                      </div>
                    </>
                  ) : (
                    <img src={ik.mediaUrl} alt={ik.judul} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                  )}
                  <div style={{ position: "absolute", bottom: 0, left: 0, width: "100%", padding: "40px 20px 20px", background: "linear-gradient(to top, rgba(0,0,0,0.85) 0%, transparent 100%)", color: "#fff", pointerEvents: "none" }}>
                    <h3 style={{ fontSize: 18, fontWeight: 700, marginBottom: 4 }}>{ik.judul}</h3>
                    <p style={{ fontSize: 12, opacity: 0.9, lineHeight: 1.5, maxWidth: "90%" }}>{ik.deskripsi}</p>
                    {ik.linkTujuan && (
                      <a href={ik.linkTujuan} target="_blank" rel="noreferrer" style={{ display: "inline-block", marginTop: 10, padding: "6px 14px", background: "var(--go)", color: "#fff", borderRadius: 8, fontSize: 11, fontWeight: 700, textDecoration: "none", pointerEvents: "auto" }}>
                        Lihat Promo →
                      </a>
                    )}
                  </div>
                </div>
              ))}
            </div>
            <style>{`
              .hide-scroll::-webkit-scrollbar { display: none; }
              .hide-scroll { -ms-overflow-style: none; scrollbar-width: none; }
            `}</style>
          </div>
        )}

        {dataLoad && (
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill,minmax(270px,1fr))", gap: 18 }}>
            {[1, 2, 3, 4].map(i => <div key={i} className="sk" style={{ height: 310, borderRadius: 20 }} />)}
          </div>
        )}

        {!dataLoad && (
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill,minmax(270px,1fr))", gap: 18 }}>
            {produk.map((p, i) => (
              <div key={p.id} className={`rv ch d${(i % 3) + 1}`} style={{ background: "var(--cw)", border: "1px solid var(--bo)", borderRadius: 20, overflow: "hidden" }}>
                <div style={{ aspectRatio: "4/3", background: "linear-gradient(135deg,var(--cd) 0%,var(--cr) 100%)", display: "flex", alignItems: "center", justifyContent: "center", position: "relative" }}>
                  <span style={{ fontSize: 52 }}>{p.icon || "🎋"}</span>
                  {p.tag && <div style={{ position: "absolute", top: 13, left: 13, padding: "5px 12px", background: "var(--fo)", borderRadius: 99, fontSize: 10, fontWeight: 700, letterSpacing: ".09em", textTransform: "uppercase", color: "#fff" }}>{p.tag}</div>}
                </div>
                <div style={{ padding: "21px 22px 18px" }}>
                  <h3 style={{ fontSize: 16, fontWeight: 700, color: "var(--tp)", marginBottom: 6 }}>{p.nama}</h3>
                  <p style={{ fontSize: 12, lineHeight: 1.7, color: "var(--ts)", marginBottom: 18 }}>{p.deskripsi}</p>
                  <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", paddingTop: 15, borderTop: "1px solid var(--bo)" }}>
                    <span className="fnt" style={{ fontSize: 20, fontWeight: 600, color: "var(--fo)" }}>{fRp(p.harga)}</span>
                    <button onClick={() => setCheckout(true)} className="btn" style={{ padding: "9px 20px", borderRadius: 99, fontSize: 11, fontWeight: 700, letterSpacing: ".08em", textTransform: "uppercase", border: "none", cursor: "pointer", background: "var(--fo)", color: "#fff" }}>
                      <span>Beli</span>
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
