"use client";
import { Produk, Iklan, fRp } from "./types";
import { useState, useRef, useEffect } from "react";

interface MarketplaceTabProps {
  produk: Produk[];
  iklan?: Iklan[];
  dataLoad: boolean;
  checkout: boolean;
  setCheckout: (val: boolean) => void;
  onPaymentSuccess?: (total: number, isMkt: boolean, orderId: string, payType: string) => void;
}

// Data kategori yang lebih umum ala e-commerce
const CATEGORI = [
  { id: "Semua", icon: "🏠" },
  { id: "Kerajinan", icon: "🎋" },
  { id: "Pertanian", icon: "🌾" },
  { id: "Makanan", icon: "🍲" },
  { id: "Eco-Waste", icon: "♻️" },
  { id: "Bambu", icon: "🎍" }
];

const MOCK_SOLD = [42, 128, 76, 215, 93, 54];
const MOCK_RATING = [4.8, 4.9, 4.7, 5.0, 4.6, 4.8];

// Tipe data untuk item di keranjang
interface CartItem extends Produk {
  qty: number;
}

export default function MarketplaceTab({ produk, iklan = [], dataLoad, checkout, setCheckout, onPaymentSuccess }: MarketplaceTabProps) {
  const [loadingSnap, setLoadingSnap] = useState(false);
  const [search, setSearch] = useState("");
  const [activeKat, setActiveKat] = useState("Semua");
  const [activeSlide, setActiveSlide] = useState(0);
  const sliderRef = useRef<HTMLDivElement>(null);

  // State untuk Keranjang Belanja
  const [cart, setCart] = useState<CartItem[]>([]);
  const [showCart, setShowCart] = useState(false);

  // Load keranjang dari localStorage pas komponen pertama kali jalan
  useEffect(() => {
    const savedCart = localStorage.getItem("ciburial_cart");
    if (savedCart) {
      try {
        setCart(JSON.parse(savedCart));
      } catch (e) {
        console.error("Gagal load cart", e);
      }
    }
  }, []);

  // Simpan keranjang ke localStorage setiap kali ada perubahan di 'cart'
  useEffect(() => {
    localStorage.setItem("ciburial_cart", JSON.stringify(cart));
  }, [cart]);

  // Fungsi tambah ke keranjang
  const addToCart = (p: Produk) => {
    setCart((prev) => {
      const existing = prev.find((item) => item.id === p.id);
      if (existing) {
        // Kalau udah ada, tambah jumlahnya (qty)
        return prev.map((item) =>
          item.id === p.id ? { ...item, qty: item.qty + 1 } : item
        );
      }
      // Kalau belum ada, masukin baru dengan qty 1
      return [...prev, { ...p, qty: 1 }];
    });
    alert(`${p.nama} berhasil masuk keranjang! 🛒`);
  };

  // Fungsi ubah jumlah barang di keranjang
  const updateQty = (id: string, delta: number) => {
    setCart((prev) =>
      prev.map((item) => {
        if (item.id === id) {
          const newQty = Math.max(1, item.qty + delta); // Minimal 1
          return { ...item, qty: newQty };
        }
        return item;
      })
    );
  };

  // Fungsi hapus dari keranjang
  const removeFromCart = (id: string) => {
    setCart((prev) => prev.filter((item) => item.id !== id));
  };

  // Hitung total harga keranjang
  const totalCartPrice = cart.reduce((total, item) => total + item.harga * item.qty, 0);

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

  const bayarSekarang = async () => {
    if (cart.length === 0) return alert("Keranjang kosong bro!");
    
    setLoadingSnap(true);
    const orderId = `MKT-${Date.now()}`;
    try {
      // Bikin format detail item buat Midtrans
      const itemDetails = cart.map((item) => ({
        id: item.id,
        price: item.harga,
        quantity: item.qty,
        name: item.nama.substring(0, 50) // Midtrans batesin nama item max 50 karakter
      }));

      const res = await fetch("/api/midtrans/tokenize", {
        method: "POST",
        headers: { "Content-type": "application/json" },
        body: JSON.stringify({
          order_id: orderId,
          gross_amount: totalCartPrice,
          item_details: itemDetails
        })
      });
      const data = await res.json();
      if (data.token && (window as any).snap) {
        (window as any).snap.pay(data.token, {
          onSuccess: function (r: any) { 
            alert("Pembayaran sukses! Terima kasih sudah berbelanja di Ciburial Marketplace. 🎉"); 
            setCart([]); // Kosongin keranjang kalau sukses
            setShowCart(false);
            setCheckout(false); 
            if (onPaymentSuccess) onPaymentSuccess(totalCartPrice, true, orderId, r.payment_type || "Midtrans");
          },
          onPending: function (r: any) { alert("Menunggu konfirmasi pembayaran Anda."); },
          onError: function (r: any) { alert("Pembayaran gagal. Silakan coba lagi."); }
        });
      } else {
        alert("Payment Gateway belum aktif. (" + (data.error || "Missing Token") + ")");
      }
    } catch (e) { alert("Error menghubungi server."); }
    setLoadingSnap(false);
  };

  // ─── TAMPILAN KERANJANG (MODAL/SIDEBAR HEROIC) ─────────────────────────
  if (showCart) {
    return (
      <div className="pi" style={{ paddingTop: "clamp(64px,10vw,120px)", paddingBottom: 80, minHeight: "100vh", background: "linear-gradient(135deg,rgba(250,248,243,.5) 0%,rgba(255,254,249,.8) 100%)" }}>
        <div style={{ maxWidth: 800, margin: "0 auto", padding: "0 clamp(16px,3vw,28px)", display: "flex", flexDirection: "column", gap: 20 }}>
          
          <button onClick={() => setShowCart(false)} style={{ display: "flex", alignItems: "center", gap: 6, background: "none", border: "none", cursor: "pointer", fontSize: 14, fontWeight: 700, color: "#2F8F4E", padding: "6px 0", alignSelf: "flex-start", transition: "all 0.3s" }}
            onMouseEnter={(e) => e.currentTarget.style.transform = "translateX(-4px)"}
            onMouseLeave={(e) => e.currentTarget.style.transform = "translateX(0)"}
          >
            ← Lanjut Belanja
          </button>

          <h2 style={{ margin: 0, color: "#1C3A2B", fontSize: "clamp(24px, 4vw, 32px)", fontWeight: 800, background: "linear-gradient(135deg,#2F8F4E,#4FBF7E)", backgroundClip: "text", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}>Keranjang Belanja</h2>

          <div style={{ display: "flex", gap: 24, flexWrap: "wrap", alignItems: "flex-start" }}>
            {/* List Barang */}
            <div style={{ flex: "1 1 60%", minWidth: 300, background: "linear-gradient(135deg,rgba(255,254,249,.9),rgba(250,248,243,.8))", borderRadius: 14, padding: 28, boxShadow: "0 8px 24px rgba(47,143,78,.08)", border: "1.5px solid rgba(47,143,78,.12)" }}>
              {cart.length === 0 ? (
                <div style={{ textAlign: "center", padding: "60px 0", color: "#5A4A40" }}>
                  <div style={{ fontSize: 56, marginBottom: 20 }}>🛒</div>
                  <h3 style={{ margin: "0 0 12px 0", color: "#1C3A2B", fontSize: "clamp(18px, 3vw, 22px)", fontWeight: 800 }}>Keranjangmu kosong</h3>
                  <p style={{ margin: 0, fontSize: 14, fontWeight: 500 }}>Yuk, temukan produk desa pilihanmu!</p>
                </div>
              ) : (
                <div style={{ display: "flex", flexDirection: "column", gap: 24 }}>
                  {cart.map((item) => (
                    <div key={item.id} style={{ display: "flex", gap: 16, borderBottom: "1.5px solid rgba(47,143,78,.15)", paddingBottom: 24 }}>
                       <div style={{ width: 90, height: 90, borderRadius: 10, background: "linear-gradient(135deg,rgba(79,191,126,.08),rgba(47,143,78,.04))", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 40, flexShrink: 0, border: "1.5px solid rgba(47,143,78,.12)" }}>
                         {item.foto ? <img src={item.foto} alt={item.nama} style={{width: "100%", height: "100%", objectFit: "cover", borderRadius: 8}}/> : (item.icon || "📦")}
                       </div>
                       <div style={{ flex: 1 }}>
                          <div style={{ fontSize: 16, fontWeight: 600, color: "#1C3A2B", marginBottom: 6 }}>{item.nama}</div>
                          <div style={{ fontSize: 16, fontWeight: 800, background: "linear-gradient(135deg,#2F8F4E,#4FBF7E)", backgroundClip: "text", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent", marginBottom: 16 }}>{fRp(item.harga)}</div>
                          
                          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                             <button onClick={() => removeFromCart(item.id)} style={{ background: "none", border: "none", color: "#5A4A40", fontSize: 12, fontWeight: 600, cursor: "pointer", padding: 0, transition: "all 0.3s" }}
                               onMouseEnter={(e) => e.currentTarget.style.color = "#2F8F4E"}
                               onMouseLeave={(e) => e.currentTarget.style.color = "#5A4A40"}
                             >Tulis Catatan</button>
                             
                             <div style={{ display: "flex", alignItems: "center", gap: 12, border: "1.5px solid rgba(47,143,78,.2)", borderRadius: 8, padding: "6px 10px", background: "rgba(255,254,249,.8)" }}>
                               <button onClick={() => item.qty > 1 ? updateQty(item.id, -1) : removeFromCart(item.id)} style={{ background: "none", border: "none", color: item.qty > 1 ? "#2F8F4E" : "#5A4A40", fontSize: 16, fontWeight: 700, cursor: "pointer", width: 24, transition: "all 0.3s" }}>−</button>
                               <span style={{ fontSize: 14, fontWeight: 600, color: "#1C3A2B", minWidth: 20, textAlign: "center" }}>{item.qty}</span>
                               <button onClick={() => updateQty(item.id, 1)} style={{ background: "none", border: "none", color: "#2F8F4E", fontSize: 16, fontWeight: 700, cursor: "pointer", width: 24, transition: "all 0.3s" }}>+</button>
                             </div>
                          </div>
                       </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Ringkasan Belanja (Heroic) */}
            <div style={{ flex: "1 1 30%", minWidth: 280, background: "linear-gradient(135deg,rgba(255,254,249,.95),rgba(250,248,243,.9))", borderRadius: 14, padding: 28, boxShadow: "0 8px 24px rgba(47,143,78,.12)", position: "sticky", top: 100, border: "1.5px solid rgba(47,143,78,.12)" }}>
               <h3 style={{ margin: "0 0 24px 0", color: "#1C3A2B", fontSize: 18, fontWeight: 800, background: "linear-gradient(135deg,#2F8F4E,#4FBF7E)", backgroundClip: "text", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}>Ringkasan Belanja</h3>
               <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 16, fontSize: 13, color: "#5A4A40", fontWeight: 500 }}>
                 <span>Total Harga ({cart.length} barang)</span>
                 <span style={{ fontWeight: 600 }}>{fRp(totalCartPrice)}</span>
               </div>
               <hr style={{ border: "none", borderTop: "1.5px solid rgba(47,143,78,.15)", margin: "20px 0" }} />
               <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 28, fontSize: 16, fontWeight: 800, color: "#1C3A2B", background: "linear-gradient(135deg,#2F8F4E,#4FBF7E)", backgroundClip: "text", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}>
                 <span>Total Harga</span>
                 <span>{fRp(totalCartPrice)}</span>
               </div>
               
               <button 
                  onClick={bayarSekarang} 
                  disabled={loadingSnap || cart.length === 0} 
                  style={{ width: "100%", padding: "14px", borderRadius: 10, fontSize: 16, fontWeight: 700, border: "none", cursor: loadingSnap || cart.length === 0 ? "not-allowed" : "pointer", background: loadingSnap || cart.length === 0 ? "rgba(47,143,78,.2)" : "linear-gradient(135deg,#2F8F4E,#4FBF7E)", color: loadingSnap || cart.length === 0 ? "#5A4A40" : "#FFF", transition: "all 0.3s", letterSpacing: ".05em", boxShadow: loadingSnap || cart.length === 0 ? "none" : "0 8px 16px rgba(47,143,78,.2)" }}
               >
                 {loadingSnap ? "Memproses..." : `Beli (${cart.length})`}
               </button>
            </div>
          </div>

        </div>
      </div>
    );
  }

  // ─── MAIN MARKETPLACE PAGE (HEROIC DESIGN) ─────────────────────────
  return (
    <div className="pi" style={{ paddingTop: "clamp(60px,8vw,100px)", paddingBottom: "clamp(60px,8vw,100px)", background: "linear-gradient(135deg,rgba(250,248,243,.5) 0%,rgba(255,254,249,.8) 100%)", minHeight: "100vh", fontFamily: "var(--font-dm-sans)" }}>
      <div style={{ maxWidth: 1280, margin: "0 auto", padding: "0 clamp(16px,4vw,32px)" }}>

        {/* ── HEADER SECTION ── */}
        <div style={{ marginBottom: 48, display: "flex", flexDirection: "column", gap: 24 }}>
          {/* Logo + Search Bar */}
          <div style={{ background: "rgba(255,254,249,.9)", borderRadius: 16, border: "1.5px solid rgba(47,143,78,.15)", padding: "20px 24px", display: "flex", gap: 18, alignItems: "center", boxShadow: "0 8px 24px rgba(47,143,78,.08)" }}>
            <div className="fnt" style={{ fontWeight: 700, fontSize: 22, background: "linear-gradient(135deg,#1C3A2B,#2F8F4E)", backgroundClip: "text", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}>Ciburial<span style={{ WebkitTextFillColor: "#5A4A40" }}>Market</span></div>
            
            <div style={{ flex: 1, position: "relative" }}>
              <span style={{ position: "absolute", left: 16, top: "50%", transform: "translateY(-50%)", fontSize: 18, color: "#2F8F4E" }}>🔍</span>
              <input
                value={search}
                onChange={e => setSearch(e.target.value)}
                placeholder="Cari produk desa lokal..."
                style={{ width: "100%", padding: "12px 16px 12px 48px", borderRadius: 10, border: "2px solid rgba(47,143,78,.15)", color: "#1C3A2B", fontSize: 14, outline: "none", boxSizing: "border-box", transition: "all 0.25s", background: "rgba(255,254,249,.8)" }}
                onFocus={(e) => {
                  e.currentTarget.style.borderColor = "#2F8F4E";
                  e.currentTarget.style.boxShadow = "0 0 0 3px rgba(47,143,78,.1)";
                }}
                onBlur={(e) => {
                  e.currentTarget.style.borderColor = "rgba(47,143,78,.15)";
                  e.currentTarget.style.boxShadow = "none";
                }}
              />
            </div>

            {/* Cart Button */}
            <button onClick={() => setShowCart(true)} style={{ position: "relative", background: "linear-gradient(135deg,#2F8F4E,#4FBF7E)", border: "none", cursor: "pointer", fontSize: 22, padding: "10px 14px", borderRadius: 10, color: "white", transition: "all 0.3s", fontWeight: 600, letterSpacing: ".05em", boxShadow: "0 8px 16px rgba(47,143,78,.2)" }}
              onMouseEnter={e => {
                e.currentTarget.style.transform = "translateY(-2px)";
                e.currentTarget.style.boxShadow = "0 12px 24px rgba(47,143,78,.3)";
              }}
              onMouseLeave={e => {
                e.currentTarget.style.transform = "translateY(0)";
                e.currentTarget.style.boxShadow = "0 8px 16px rgba(47,143,78,.2)";
              }}
            >
              🛒
              {cart.length > 0 && (
                <span style={{ position: "absolute", top: 0, right: 0, background: "#f87171", color: "#FFF", fontSize: 10, fontWeight: 700, padding: "2px 6px", borderRadius: "10px", minWidth: "20px", textAlign: "center", border: "2px solid white" }}>
                  {cart.length}
                </span>
              )}
            </button>
          </div>

          {/* Section Title */}
          <div style={{ textAlign: "center", marginBottom: 12 }}>
            <div style={{ display: "inline-block", width: "44px", height: "3px", background: "linear-gradient(90deg,#2F8F4E,#4FBF7E)", borderRadius: "99px", boxShadow: "0 0 16px rgba(47,143,78,.4)", marginBottom: "16px" }} />
            <h2 className="fnt" style={{ fontSize: "clamp(28px,4vw,44px)", fontWeight: 300, background: "linear-gradient(135deg,#1C3A2B,#2F8F4E)", backgroundClip: "text", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent", margin: "0 0 8px 0" }}>
              Marketplace Lokal
            </h2>
            <p style={{ fontSize: 14, color: "#5A4A40", fontWeight: 500 }}>Produk asli dari pengrajin dan petani Ciburial</p>
          </div>
        </div>

        {/* ── BANNER SLIDER (Heroic) ── */}
        {iklan.length > 0 && !dataLoad && (
          <div style={{ marginBottom: 40, position: "relative", borderRadius: 16, overflow: "hidden", border: "1.5px solid rgba(47,143,78,.15)" }}>
            <div ref={sliderRef} style={{ display: "flex", overflowX: "hidden", scrollSnapType: "x mandatory" }}>
              {iklan.map((ik, i) => (
                <div key={ik.id || i} style={{ flex: "0 0 100%", scrollSnapAlign: "start", position: "relative", aspectRatio: "12/3", minHeight: 220, background: "linear-gradient(135deg,#2F8F4E,#4FBF7E)" }}>
                  {ik.tipe === "video" ? (
                    <video src={ik.mediaUrl} autoPlay muted loop playsInline style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                  ) : (
                    <img src={ik.mediaUrl} alt={ik.judul} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                  )}
                  <div style={{ position: "absolute", inset: 0, background: "linear-gradient(135deg,rgba(47,143,78,.6) 0%,rgba(47,143,78,.2) 100%)" }} />
                </div>
              ))}
            </div>
            {/* Dots */}
            {iklan.length > 1 && (
              <div style={{ position: "absolute", bottom: 20, left: 28, display: "flex", gap: 8 }}>
                {iklan.map((_, i) => (
                  <div key={i} onClick={() => setActiveSlide(i)} style={{ width: i === activeSlide ? 28 : 10, height: 10, borderRadius: 5, background: i === activeSlide ? "white" : "rgba(255,255,255,.4)", cursor: "pointer", transition: "all 0.3s cubic-bezier(.22,1,.36,1)", boxShadow: i === activeSlide ? "0 4px 12px rgba(0,0,0,.2)" : "none" }} />
                ))}
              </div>
            )}
          </div>
        )}

        {/* ── KATEGORI POPULER (Heroic) ── */}
        <div style={{ background: "linear-gradient(135deg,rgba(79,191,126,.06),rgba(47,143,78,.03))", borderRadius: 16, padding: "32px 24px", marginBottom: 48, border: "1.5px solid rgba(47,143,78,.12)", boxShadow: "0 4px 16px rgba(47,143,78,.06)" }}>
           <h2 style={{ margin: "0 0 24px 0", color: "#1C3A2B", fontSize: "clamp(20px, 4vw, 24px)", fontWeight: 800, background: "linear-gradient(135deg,#2F8F4E,#4FBF7E)", backgroundClip: "text", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}>Kategori Desa</h2>
           <div style={{ display: "flex", gap: 16, overflowX: "auto", paddingBottom: 8, flex: 1 }} className="hide-scroll">
             {CATEGORI.map(k => (
               <button key={k.id} onClick={() => setActiveKat(k.id)} style={{
                 flexShrink: 0, padding: "14px 24px", borderRadius: 10, fontSize: 14, fontWeight: 600, cursor: "pointer", transition: "all 0.3s cubic-bezier(.22,1,.36,1)",
                 display: "flex", alignItems: "center", gap: 10,
                 background: activeKat === k.id ? "linear-gradient(135deg,#2F8F4E,#4FBF7E)" : "rgba(255,254,249,.8)",
                 border: `1.5px solid ${activeKat === k.id ? "#2F8F4E" : "rgba(47,143,78,.2)"}`,
                 color: activeKat === k.id ? "#FFF" : "#1C3A2B",
                 boxShadow: activeKat === k.id ? "0 8px 16px rgba(47,143,78,.2)" : "0 2px 8px rgba(0,0,0,.04)",
                 transform: activeKat === k.id ? "translateY(-2px)" : "translateY(0)",
               }}>
                 <span style={{ fontSize: 20 }}>{k.icon}</span>
                 <span>{k.id}</span>
               </button>
             ))}
           </div>
        </div>

        {/* ── HEADER PRODUK ── */}
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 16 }}>
           <h2 style={{ margin: 0, color: "#31353B", fontSize: 20, fontWeight: 800 }}>
             {search ? `Hasil pencarian "${search}"` : `Produk ${activeKat === "Semua" ? "Pilihan Untukmu" : activeKat}`}
           </h2>
        </div>

        {/* ── SKELETON ── */}
        {dataLoad && (
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill,minmax(180px,1fr))", gap: 16 }}>
            {[1, 2, 3, 4, 5, 6].map(i => <div key={i} className="sk" style={{ height: 280, borderRadius: 12, background: "#FFF" }} />)}
          </div>
        )}

        {/* ── PRODUK GRID (CARD ALA TOKPED) ── */}
        {!dataLoad && (
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill,minmax(190px,1fr))", gap: 16 }}>
            {filteredProduk.map((p, i) => {
              const sold = MOCK_SOLD[i % MOCK_SOLD.length];
              const rating = MOCK_RATING[i % MOCK_RATING.length];
              return (
                <div key={p.id} className="product-card"
                    style={{ 
                        background: "linear-gradient(135deg,rgba(255,254,249,.9),rgba(250,248,243,.8))", 
                        borderRadius: 14, 
                        border: "1.5px solid rgba(47,143,78,.12)", 
                        cursor: "pointer", 
                        display: "flex", 
                        flexDirection: "column",
                        transition: "all 0.3s cubic-bezier(.22,1,.36,1)",
                        position: "relative",
                        overflow: "hidden",
                        boxShadow: "0 4px 12px rgba(0,0,0,.04)"
                    }}
                    onMouseEnter={(e) => {
                        e.currentTarget.style.transform = "translateY(-6px) scale(1.01)";
                        e.currentTarget.style.boxShadow = "0 12px 28px rgba(47,143,78,.15)";
                    }}
                    onMouseLeave={(e) => {
                        e.currentTarget.style.transform = "translateY(0) scale(1)";
                        e.currentTarget.style.boxShadow = "0 4px 12px rgba(0,0,0,.04)";
                    }}
                >
                  
                  {/* Product Image */}
                  <div style={{ aspectRatio: "1/1", background: "linear-gradient(135deg,rgba(79,191,126,.08),rgba(47,143,78,.04))", display: "flex", alignItems: "center", justifyContent: "center", position: "relative" }}>
                    {p.foto ? (
                      <img src={p.foto} alt={p.nama} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                    ) : (
                      <span style={{ fontSize: 64 }}>{p.icon || "🎋"}</span>
                    )}
                    {/* Badge Diskon / Label */}
                    {p.tag && (
                      <div style={{ position: "absolute", top: 12, left: 12, padding: "6px 12px", background: "linear-gradient(135deg,#2F8F4E,#4FBF7E)", color: "#FFF", borderRadius: 6, fontSize: 11, fontWeight: 800, boxShadow: "0 4px 12px rgba(47,143,78,.3)" }}>{p.tag}</div>
                    )}
                  </div>

                  {/* Info */}
                  <div style={{ padding: "16px", display: "flex", flexDirection: "column", gap: 6, flex: 1 }}>
                    <div style={{ fontSize: 14, color: "#1C3A2B", lineHeight: 1.4, display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical", overflow: "hidden", minHeight: 40, fontWeight: 500 }}>{p.nama}</div>
                    
                    <div className="fnt" style={{ fontSize: 16, fontWeight: 800, background: "linear-gradient(135deg,#2F8F4E,#4FBF7E)", backgroundClip: "text", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent", marginTop: 4 }}>{fRp(p.harga)}</div>
                    
                    {/* Badge Lokasi */}
                    <div style={{ display: "flex", alignItems: "center", gap: 4, marginTop: 6 }}>
                      <span style={{fontSize: 12}}>📍</span>
                      <span style={{ fontSize: 12, color: "#5A4A40", fontWeight: 500 }}>Kp. Ciburial</span>
                    </div>

                    {/* Rating & Sold */}
                    <div style={{ display: "flex", alignItems: "center", gap: 6, marginTop: 4 }}>
                      <span style={{ fontSize: 12, color: "#FFC400" }}>★</span>
                      <span style={{ fontSize: 12, color: "#5A4A40", fontWeight: 500 }}>{rating}</span>
                      <span style={{ fontSize: 10, color: "#D6D6D6" }}>|</span>
                      <span style={{ fontSize: 12, color: "#5A4A40", fontWeight: 500 }}>Terjual {sold}</span>
                    </div>

                    {/* Tombol Tambah Keranjang (Muncul pas di-hover) */}
                    <button 
                      className="btn-add-cart"
                      onClick={(e) => {
                        e.stopPropagation();
                        addToCart(p);
                      }}
                      style={{ marginTop: 12, padding: "10px", background: "linear-gradient(135deg,#2F8F4E,#4FBF7E)", border: "none", borderRadius: 8, fontSize: 12, fontWeight: 700, color: "#FFF", cursor: "pointer", transition: "all 0.3s", boxShadow: "0 4px 12px rgba(47,143,78,.2)" }}>
                      + Keranjang
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      <style>{`
        .hide-scroll::-webkit-scrollbar { display: none; }
        .hide-scroll { -ms-overflow-style: none; scrollbar-width: none; }
        
        /* Tombol keranjang efek Heroic */
        .product-card .btn-add-cart {
            opacity: 1;
        }
        
        @media (min-width: 768px) {
            .product-card .btn-add-cart {
                opacity: 0;
            }
            .product-card:hover .btn-add-cart {
                opacity: 1;
                background: linear-gradient(135deg,#2F8F4E,#4FBF7E) !important;
                color: #FFF !important;
                box-shadow: 0 8px 16px rgba(47,143,78,.2) !important;
            }
        }
      `}</style>
    </div>
  );
}