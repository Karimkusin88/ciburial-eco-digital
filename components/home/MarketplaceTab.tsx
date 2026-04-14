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

  // ─── TAMPILAN KERANJANG (MODAL/SIDEBAR ALA TOKPED) ─────────────────────────
  if (showCart) {
    return (
      <div className="pi" style={{ paddingTop: "clamp(64px,10vw,120px)", paddingBottom: 80, minHeight: "100vh", background: "#F3F4F5" }}>
        <div style={{ maxWidth: 800, margin: "0 auto", padding: "0 clamp(16px,3vw,28px)", display: "flex", flexDirection: "column", gap: 20 }}>
          
          <button onClick={() => setShowCart(false)} style={{ display: "flex", alignItems: "center", gap: 6, background: "none", border: "none", cursor: "pointer", fontSize: 14, fontWeight: 700, color: "#03AC0E", padding: "6px 0", alignSelf: "flex-start" }}>
            ← Lanjut Belanja
          </button>

          <h2 style={{ margin: 0, color: "#31353B", fontSize: 24, fontWeight: 800 }}>Keranjang Belanja</h2>

          <div style={{ display: "flex", gap: 24, flexWrap: "wrap", alignItems: "flex-start" }}>
            {/* List Barang */}
            <div style={{ flex: "1 1 60%", minWidth: 300, background: "#FFF", borderRadius: 12, padding: 24, boxShadow: "0 1px 6px 0 rgba(49,53,59,0.12)" }}>
              {cart.length === 0 ? (
                <div style={{ textAlign: "center", padding: "40px 0", color: "#8D96AA" }}>
                  <div style={{ fontSize: 48, marginBottom: 16 }}>🛒</div>
                  <h3 style={{ margin: "0 0 8px 0", color: "#31353B" }}>Keranjangmu kosong</h3>
                  <p style={{ margin: 0, fontSize: 14 }}>Yuk, temukan produk desa pilihanmu!</p>
                </div>
              ) : (
                <div style={{ display: "flex", flexDirection: "column", gap: 24 }}>
                  {cart.map((item) => (
                    <div key={item.id} style={{ display: "flex", gap: 16, borderBottom: "1px solid #E5E7E9", paddingBottom: 24 }}>
                       <div style={{ width: 80, height: 80, borderRadius: 8, background: "#F3F4F5", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 32, flexShrink: 0 }}>
                         {item.foto ? <img src={item.foto} alt={item.nama} style={{width: "100%", height: "100%", objectFit: "cover", borderRadius: 8}}/> : (item.icon || "📦")}
                       </div>
                       <div style={{ flex: 1 }}>
                          <div style={{ fontSize: 16, fontWeight: 600, color: "#31353B", marginBottom: 4 }}>{item.nama}</div>
                          <div style={{ fontSize: 14, fontWeight: 700, color: "#FA591D", marginBottom: 16 }}>{fRp(item.harga)}</div>
                          
                          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                             <button onClick={() => removeFromCart(item.id)} style={{ background: "none", border: "none", color: "#8D96AA", fontSize: 12, fontWeight: 600, cursor: "pointer", padding: 0 }}>Tulis Catatan</button>
                             
                             <div style={{ display: "flex", alignItems: "center", gap: 12, border: "1px solid #E5E7E9", borderRadius: 4, padding: "4px 8px" }}>
                               <button onClick={() => item.qty > 1 ? updateQty(item.id, -1) : removeFromCart(item.id)} style={{ background: "none", border: "none", color: item.qty > 1 ? "#03AC0E" : "#8D96AA", fontSize: 16, fontWeight: 700, cursor: "pointer", width: 24 }}>-</button>
                               <span style={{ fontSize: 14, fontWeight: 600, color: "#31353B", minWidth: 20, textAlign: "center" }}>{item.qty}</span>
                               <button onClick={() => updateQty(item.id, 1)} style={{ background: "none", border: "none", color: "#03AC0E", fontSize: 16, fontWeight: 700, cursor: "pointer", width: 24 }}>+</button>
                             </div>
                          </div>
                       </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Ringkasan Belanja */}
            <div style={{ flex: "1 1 30%", minWidth: 280, background: "#FFF", borderRadius: 12, padding: 24, boxShadow: "0 1px 6px 0 rgba(49,53,59,0.12)", position: "sticky", top: 100 }}>
               <h3 style={{ margin: "0 0 16px 0", color: "#31353B", fontSize: 16, fontWeight: 700 }}>Ringkasan Belanja</h3>
               <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 12, fontSize: 14, color: "#8D96AA" }}>
                 <span>Total Harga ({cart.length} barang)</span>
                 <span>{fRp(totalCartPrice)}</span>
               </div>
               <hr style={{ border: "none", borderTop: "1px solid #E5E7E9", margin: "16px 0" }} />
               <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 24, fontSize: 16, fontWeight: 800, color: "#31353B" }}>
                 <span>Total Harga</span>
                 <span>{fRp(totalCartPrice)}</span>
               </div>
               
               <button 
                  onClick={bayarSekarang} 
                  disabled={loadingSnap || cart.length === 0} 
                  style={{ width: "100%", padding: "14px", borderRadius: 8, fontSize: 16, fontWeight: 700, border: "none", cursor: loadingSnap || cart.length === 0 ? "not-allowed" : "pointer", background: loadingSnap || cart.length === 0 ? "#E5E7E9" : "#03AC0E", color: loadingSnap || cart.length === 0 ? "#AAB4C8" : "#FFF", transition: "all 0.2s" }}
               >
                 {loadingSnap ? "Memproses..." : `Beli (${cart.length})`}
               </button>
            </div>
          </div>

        </div>
      </div>
    );
  }

  // ─── MAIN MARKETPLACE PAGE (DESAIN TOKPEDIA-STYLE) ─────────────────────────
  return (
    <div className="pi" style={{ paddingTop: "clamp(64px,10vw,120px)", paddingBottom: 80, background: "#F3F4F5", minHeight: "100vh", fontFamily: "'Nunito Sans', sans-serif" }}>
      <div style={{ maxWidth: 1200, margin: "0 auto", padding: "0 clamp(12px,3vw,24px)" }}>

        {/* ── HEADER SEARCH & CART PULL-UP ── */}
        <div style={{ background: "#FFF", borderRadius: 12, padding: "16px 24px", marginBottom: 24, display: "flex", gap: 16, alignItems: "center", boxShadow: "0 1px 6px 0 rgba(49,53,59,0.12)" }}>
          <div style={{ fontWeight: 800, color: "#03AC0E", fontSize: 24, marginRight: 16 }}>Ciburial<span style={{color: "#31353B"}}>Market</span></div>
          
          <div style={{ flex: 1, position: "relative" }}>
            <span style={{ position: "absolute", left: 16, top: "50%", transform: "translateY(-50%)", fontSize: 16, color: "#8D96AA" }}>🔍</span>
            <input
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Cari produk desa di sini..."
              style={{ width: "100%", padding: "12px 16px 12px 48px", borderRadius: 8, border: "1px solid #E5E7E9", color: "#31353B", fontSize: 14, outline: "none", boxSizing: "border-box", transition: "border-color 0.2s" }}
              onFocus={(e) => e.target.style.borderColor = "#03AC0E"}
              onBlur={(e) => e.target.style.borderColor = "#E5E7E9"}
            />
          </div>

          {/* Ikon Keranjang */}
          <button onClick={() => setShowCart(true)} style={{ position: "relative", background: "none", border: "none", cursor: "pointer", fontSize: 24, padding: "8px 12px", color: "#8D96AA" }}>
             🛒
             {cart.length > 0 && (
               <span style={{ position: "absolute", top: 4, right: 4, background: "#EF144A", color: "#FFF", fontSize: 10, fontWeight: 700, padding: "2px 6px", borderRadius: "10px", border: "2px solid #FFF" }}>
                 {cart.length}
               </span>
             )}
          </button>
        </div>

        {/* ── BANNER SLIDER (ALA TOKPED) ── */}
        {iklan.length > 0 && !dataLoad && (
          <div style={{ marginBottom: 32, position: "relative", borderRadius: 12, overflow: "hidden" }}>
            <div ref={sliderRef} style={{ display: "flex", overflowX: "hidden", scrollSnapType: "x mandatory" }}>
              {iklan.map((ik, i) => (
                <div key={ik.id || i} style={{ flex: "0 0 100%", scrollSnapAlign: "start", position: "relative", aspectRatio: "12/3", minHeight: 200, background: "#03AC0E" }}>
                  {ik.tipe === "video" ? (
                    <video src={ik.mediaUrl} autoPlay muted loop playsInline style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                  ) : (
                    <img src={ik.mediaUrl} alt={ik.judul} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                  )}
                  {/* Kalau butuh teks overlay, uncomment ini */}
                  {/* <div style={{ position: "absolute", inset: 0, padding: "40px", display: "flex", flexDirection: "column", justifyContent: "center", background: "linear-gradient(90deg, rgba(3,172,14,0.9) 0%, rgba(3,172,14,0) 100%)" }}>
                    <h2 style={{ color: "#FFF", margin: "0 0 8px", fontSize: 28 }}>{ik.judul}</h2>
                    <p style={{ color: "#FFF", margin: 0, fontSize: 16 }}>{ik.deskripsi}</p>
                  </div> */}
                </div>
              ))}
            </div>
            {/* Dots */}
             {iklan.length > 1 && (
              <div style={{ position: "absolute", bottom: 16, left: 24, display: "flex", gap: 6 }}>
                {iklan.map((_, i) => (
                  <div key={i} onClick={() => setActiveSlide(i)} style={{ width: i === activeSlide ? 24 : 8, height: 8, borderRadius: 4, background: i === activeSlide ? "#FFF" : "rgba(255,255,255,0.5)", cursor: "pointer", transition: "all 0.3s" }} />
                ))}
              </div>
            )}
          </div>
        )}

        {/* ── KATEGORI POPULER ── */}
        <div style={{ background: "#FFF", borderRadius: 12, padding: "24px", marginBottom: 32, boxShadow: "0 1px 6px 0 rgba(49,53,59,0.12)" }}>
           <h2 style={{ margin: "0 0 16px 0", color: "#31353B", fontSize: 20, fontWeight: 800 }}>Kategori Desa</h2>
           <div style={{ display: "flex", gap: 16, overflowX: "auto", paddingBottom: 8 }} className="hide-scroll">
             {CATEGORI.map(k => (
               <button key={k.id} onClick={() => setActiveKat(k.id)} style={{
                 flexShrink: 0, padding: "12px 20px", borderRadius: 8, fontSize: 14, fontWeight: 600, cursor: "pointer", transition: "all 0.2s ease",
                 display: "flex", alignItems: "center", gap: 8,
                 background: activeKat === k.id ? "#E5F7E6" : "#FFF",
                 border: `1px solid ${activeKat === k.id ? "#03AC0E" : "#E5E7E9"}`,
                 color: activeKat === k.id ? "#03AC0E" : "#31353B",
               }}>
                 <span style={{ fontSize: 18 }}>{k.icon}</span>
                 {k.id}
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
                        background: "#FFF", 
                        borderRadius: 12, 
                        border: "1px solid #E5E7E9", 
                        cursor: "pointer", 
                        display: "flex", 
                        flexDirection: "column",
                        transition: "box-shadow 0.2s, transform 0.2s",
                        position: "relative",
                        overflow: "hidden"
                    }}
                    onMouseEnter={(e) => {
                        e.currentTarget.style.transform = "translateY(-4px)";
                        e.currentTarget.style.boxShadow = "0 4px 12px 0 rgba(49,53,59,0.15)";
                    }}
                    onMouseLeave={(e) => {
                        e.currentTarget.style.transform = "translateY(0)";
                        e.currentTarget.style.boxShadow = "none";
                    }}
                >
                  
                  {/* Product Image */}
                  <div style={{ aspectRatio: "1/1", background: "#F3F4F5", display: "flex", alignItems: "center", justifyContent: "center", position: "relative" }}>
                    {p.foto ? (
                      <img src={p.foto} alt={p.nama} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                    ) : (
                      <span style={{ fontSize: 64 }}>{p.icon || "🎋"}</span>
                    )}
                    {/* Badge Diskon / Label */}
                    {p.tag && (
                      <div style={{ position: "absolute", top: 8, left: 8, padding: "4px 8px", background: "#FFEAEE", color: "#EF144A", borderRadius: 4, fontSize: 10, fontWeight: 800 }}>{p.tag}</div>
                    )}
                  </div>

                  {/* Info */}
                  <div style={{ padding: "12px", display: "flex", flexDirection: "column", gap: 4, flex: 1 }}>
                    <div style={{ fontSize: 14, color: "#31353B", lineHeight: 1.4, display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical", overflow: "hidden", minHeight: 40 }}>{p.nama}</div>
                    
                    <div className="fnt" style={{ fontSize: 16, fontWeight: 800, color: "#31353B", marginTop: 4 }}>{fRp(p.harga)}</div>
                    
                    {/* Badge Lokasi */}
                    <div style={{ display: "flex", alignItems: "center", gap: 4, marginTop: 4 }}>
                      <span style={{fontSize: 12}}>📍</span>
                      <span style={{ fontSize: 12, color: "#8D96AA" }}>Kp. Ciburial</span>
                    </div>

                    {/* Rating & Sold */}
                    <div style={{ display: "flex", alignItems: "center", gap: 4, marginTop: 4 }}>
                      <span style={{ fontSize: 11, color: "#FFC400" }}>★</span>
                      <span style={{ fontSize: 12, color: "#8D96AA" }}>{rating}</span>
                      <span style={{ fontSize: 10, color: "#D6D6D6" }}>|</span>
                      <span style={{ fontSize: 12, color: "#8D96AA" }}>Terjual {sold}</span>
                    </div>

                    {/* Tombol Tambah Keranjang (Muncul pas di-hover) */}
                    <button 
                      className="btn-add-cart"
                      onClick={(e) => {
                        e.stopPropagation(); // Biar gak ke-trigger modal checkout lama
                        addToCart(p);
                      }}
                      style={{ marginTop: 12, padding: "8px", background: "#FFF", border: "1px solid #03AC0E", borderRadius: 8, fontSize: 12, fontWeight: 700, color: "#03AC0E", cursor: "pointer", transition: "all 0.2s" }}>
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
        
        /* Tombol keranjang efek Tokped */
        .product-card .btn-add-cart {
            opacity: 1; /* Di HP tetep kelihatan */
        }
        
        @media (min-width: 768px) {
            .product-card .btn-add-cart {
                opacity: 0; /* Di Desktop sembunyi dulu */
            }
            .product-card:hover .btn-add-cart {
                opacity: 1; /* Muncul pas di-hover */
                background: #03AC0E !important;
                color: #FFF !important;
            }
        }
      `}</style>
    </div>
  );
}