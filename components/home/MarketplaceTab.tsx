"use client";
import { Produk, fRp } from "./types";

interface MarketplaceTabProps {
  produk: Produk[];
  dataLoad: boolean;
  checkout: boolean;
  setCheckout: (val: boolean) => void;
}

export default function MarketplaceTab({ produk, dataLoad, checkout, setCheckout }: MarketplaceTabProps) {
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
              <button type="button" className="btn" style={{ width: "100%", padding: "15px", borderRadius: 13, fontSize: 11, fontWeight: 700, letterSpacing: ".14em", textTransform: "uppercase", border: "none", cursor: "pointer", background: "var(--fo)", color: "#fff", marginTop: 4 }}>
                <span>Kirim Pesanan →</span>
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
