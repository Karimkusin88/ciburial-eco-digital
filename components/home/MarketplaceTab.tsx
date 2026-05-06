"use client";
import { Produk, Iklan, fRp } from "./types";
import { useState, useRef, useEffect } from "react";
import { supabase, isSupabaseReady } from "@/lib/supabase";

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

interface OrderForm {
  nama: string;
  no_wa: string;
  alamat: string;
  kecamatan: string;
  catatan: string;
  metode_kirim: "ambil_sendiri" | "kurir_kampung" | "jne" | "jnt" | "sicepat";
  metode_bayar: "qris" | "gopay" | "ovo" | "dana" | "va_bca" | "va_bni" | "va_bri" | "va_mandiri";
}

const METODE_KIRIM = [
  { v:"ambil_sendiri", l:"🏠 Ambil Sendiri di Pos Kampung", harga:0 },
  { v:"kurir_kampung", l:"🛵 Kurir Kampung (area Ciburial)", harga:5000 },
  { v:"jne", l:"📦 JNE Regular", harga:15000 },
  { v:"jnt", l:"📦 J&T Express", harga:13000 },
  { v:"sicepat", l:"📦 SiCepat REG", harga:12000 },
];

const METODE_BAYAR = [
  { v:"qris",       l:"QRIS",           icon:"🔲", grup:"E-Wallet & QRIS" },
  { v:"gopay",      l:"GoPay",          icon:"💚", grup:"E-Wallet & QRIS" },
  { v:"ovo",        l:"OVO",            icon:"💜", grup:"E-Wallet & QRIS" },
  { v:"dana",       l:"DANA",           icon:"💙", grup:"E-Wallet & QRIS" },
  { v:"va_bca",     l:"Virtual Account BCA",     icon:"🏦", grup:"Transfer Bank" },
  { v:"va_bni",     l:"Virtual Account BNI",     icon:"🏦", grup:"Transfer Bank" },
  { v:"va_bri",     l:"Virtual Account BRI",     icon:"🏦", grup:"Transfer Bank" },
  { v:"va_mandiri", l:"Virtual Account Mandiri", icon:"🏦", grup:"Transfer Bank" },
];

const emptyOrder: OrderForm = {
  nama:"", no_wa:"", alamat:"", kecamatan:"Bungbulang", catatan:"",
  metode_kirim:"ambil_sendiri", metode_bayar:"qris",
};

export default function MarketplaceTab({ produk, iklan = [], dataLoad, checkout, setCheckout, onPaymentSuccess }: MarketplaceTabProps) {
  const [loadingSnap, setLoadingSnap] = useState(false);
  const [search, setSearch] = useState("");
  const [activeKat, setActiveKat] = useState("Semua");
  const [activeSlide, setActiveSlide] = useState(0);
  const sliderRef = useRef<HTMLDivElement>(null);

  // State untuk Keranjang Belanja
  const [cart, setCart] = useState<CartItem[]>([]);
  const [showCart, setShowCart] = useState(false);
  const [showCheckout, setShowCheckout] = useState(false);
  const [orderForm, setOrderForm] = useState<OrderForm>(emptyOrder);
  const [orderLoading, setOrderLoading] = useState(false);
  const [orderDone, setOrderDone] = useState<{orderId:string;metode:string}|null>(null);
  const [directCheckoutItems, setDirectCheckoutItems] = useState<CartItem[]>([]); // For "Beli Langsung"

  // State untuk Tracking
  const [showTracking, setShowTracking] = useState(false);
  const [trackingId, setTrackingId] = useState("");
  const [trackedOrder, setTrackedOrder] = useState<any>(null);
  const [trackingLoading, setTrackingLoading] = useState(false);
  const [trackingError, setTrackingError] = useState("");

  // State untuk Product Detail & Reviews
  const [selectedProduct, setSelectedProduct] = useState<Produk | null>(null);
  const [activePhotoIndex, setActivePhotoIndex] = useState(0);
  const [reviews, setReviews] = useState<any[]>([]);
  const [reviewLoading, setReviewLoading] = useState(false);
  const [newReview, setNewReview] = useState({ nama: "", rating: 5, komentar: "" });
  const [submittingReview, setSubmittingReview] = useState(false);
  const [detailQty, setDetailQty] = useState(1);

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

  const ongkosKirim = METODE_KIRIM.find(m=>m.v===orderForm.metode_kirim)?.harga||0;
  
  // Use directCheckout items if doing direct purchase, otherwise use cart
  const itemsForCheckout = directCheckoutItems.length > 0 ? directCheckoutItems : cart;
  const checkoutTotal = itemsForCheckout.reduce((total, item) => total + item.harga * item.qty, 0);
  const totalBayar = checkoutTotal + ongkosKirim;

  // ─── LOAD REVIEWS ─────────────────────────────────────────────────────
  useEffect(() => {
    if (!selectedProduct) return;
    const loadReviews = async () => {
      setReviewLoading(true);
      try {
        const { data, error } = await supabase
          .from("reviews")
          .select("*")
          .eq("produk_id", selectedProduct.id)
          .order("created_at", { ascending: false });
        if (error) throw error;
        setReviews(data || []);
      } catch (e) {
        console.error("Gagal load reviews:", e);
      } finally {
        setReviewLoading(false);
      }
    };
    loadReviews();
  }, [selectedProduct]);

  // ─── SUBMIT REVIEW ────────────────────────────────────────────────────
  const submitReview = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedProduct || !newReview.nama.trim() || !newReview.komentar.trim()) {
      alert("Lengkapi nama dan komentar!");
      return;
    }
    setSubmittingReview(true);
    try {
      const { data, error } = await supabase
        .from("reviews")
        .insert([{
          produk_id: selectedProduct.id,
          nama: newReview.nama,
          rating: newReview.rating,
          komentar: newReview.komentar,
        }])
        .select();
      if (error) throw error;
      setReviews([data[0], ...reviews]);
      setNewReview({ nama: "", rating: 5, komentar: "" });
      alert("Terima kasih atas review Anda! 🙏");
    } catch (e) {
      console.error("Gagal submit review:", e);
      alert("Gagal submit review");
    } finally {
      setSubmittingReview(false);
    }
  };

  const prosesCheckout = async () => {
    if (!orderForm.nama) return alert("Nama wajib diisi!");
    if (!orderForm.no_wa) return alert("No. WhatsApp wajib diisi!");
    if (orderForm.metode_kirim !== "ambil_sendiri" && !orderForm.alamat) return alert("Alamat wajib diisi untuk pengiriman!");
    if (cart.length === 0) return alert("Keranjang kosong!");

    setOrderLoading(true);
    const orderId = `MKT-${Date.now()}`;
    
    try {
      const itemDetails = cart.map((item) => ({
        id: item.id,
        price: item.harga,
        quantity: item.qty,
        name: item.nama.substring(0, 50)
      }));

      // Tambah ongkir ke item details kalau ada
      if (ongkosKirim > 0) {
        itemDetails.push({
          id: "ONGKIR",
          price: ongkosKirim,
          quantity: 1,
          name: `Ongkos Kirim - ${METODE_KIRIM.find(m=>m.v===orderForm.metode_kirim)?.l||""}`
        });
      }

      // Map metode bayar ke Midtrans payment type
      const paymentMap: Record<string,any> = {
        qris: { payment_type: "qris" },
        gopay: { payment_type: "gopay" },
        ovo: { payment_type: "shopeepay" },
        dana: { payment_type: "shopeepay" },
        va_bca: { payment_type: "bank_transfer", bank_transfer: { bank: "bca" } },
        va_bni: { payment_type: "bank_transfer", bank_transfer: { bank: "bni" } },
        va_bri: { payment_type: "bank_transfer", bank_transfer: { bank: "bri" } },
        va_mandiri: { payment_type: "echannel", bill_info1: "Pembayaran", bill_info2: "Ciburial Market" },
      };

      const res = await fetch("/api/midtrans/tokenize", {
        method: "POST",
        headers: { "Content-type": "application/json" },
        body: JSON.stringify({
          order_id: orderId,
          gross_amount: totalBayar,
          item_details: itemDetails,
          customer_details: {
            first_name: orderForm.nama,
            phone: orderForm.no_wa,
          },
          // Kirim metode bayar preferred
          preferred_payment: paymentMap[orderForm.metode_bayar],
        })
      });

      const data = await res.json();
      if (data.token && (window as any).snap) {
        (window as any).snap.pay(data.token, {
          onSuccess: async (r: any) => {
            // Simpan order ke Supabase
            if (isSupabaseReady()) {
              await supabase.from("orders_marketplace").insert({
                order_id: orderId,
                nama_pembeli: orderForm.nama,
                no_wa: orderForm.no_wa,
                alamat: orderForm.alamat,
                kecamatan: orderForm.kecamatan,
                catatan: orderForm.catatan,
                metode_kirim: orderForm.metode_kirim,
                metode_bayar: r.payment_type || orderForm.metode_bayar,
                total_harga: totalCartPrice,
                ongkos_kirim: ongkosKirim,
                total_bayar: totalBayar,
                items: JSON.stringify(cart.map(c=>({id:c.id,nama:c.nama,harga:c.harga,qty:c.qty}))),
                status: "dibayar",
              });
            }
            setCart([]);
            setShowCart(false);
            setShowCheckout(false);
            setOrderDone({ orderId, metode: r.payment_type || "Midtrans" });
            if (onPaymentSuccess) onPaymentSuccess(totalBayar, true, orderId, r.payment_type || "Midtrans");
          },
          onPending: (r: any) => {
            // Simpan order pending
            if (isSupabaseReady()) {
              supabase.from("orders_marketplace").insert({
                order_id: orderId,
                nama_pembeli: orderForm.nama,
                no_wa: orderForm.no_wa,
                alamat: orderForm.alamat,
                metode_kirim: orderForm.metode_kirim,
                metode_bayar: orderForm.metode_bayar,
                total_bayar: totalBayar,
                items: JSON.stringify(cart.map(c=>({id:c.id,nama:c.nama,harga:c.harga,qty:c.qty}))),
                status: "pending",
              });
            }
            alert("Menunggu pembayaran. Cek WhatsApp kamu untuk konfirmasi!");
          },
          onError: (r: any) => alert("Pembayaran gagal. Silakan coba lagi."),
        });
      } else {
        alert("Payment Gateway belum aktif. (" + (data.error || "Missing Token") + ")");
      }
    } catch (e) { alert("Error menghubungi server."); }
    setOrderLoading(false);
  };

  // ─── TRACKING ORDER ────────────────────────────────────────────────────
  const cariTracking = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!trackingId.trim()) {
      setTrackingError("Masukkan Order ID terlebih dahulu!");
      return;
    }

    setTrackingLoading(true);
    setTrackingError("");
    setTrackedOrder(null);

    if (!isSupabaseReady()) {
      setTrackingError("Database belum siap");
      setTrackingLoading(false);
      return;
    }

    try {
      const { data, error } = await supabase
        .from("orders_marketplace")
        .select("*")
        .eq("order_id", trackingId.toUpperCase())
        .single();

      if (error || !data) {
        setTrackingError("❌ Order ID tidak ditemukan");
        setTrackedOrder(null);
      } else {
        setTrackedOrder(data);
        setTrackingError("");
      }
    } catch (e) {
      console.error("Error:", e);
      setTrackingError("Error mencari pesanan");
    }
    setTrackingLoading(false);
  };

  // ─── ORDER SUKSES ─────────────────────────────────────────────────────
  if (orderDone) {
    return (
      <div style={{ minHeight:"100vh", display:"flex", alignItems:"center", justifyContent:"center", background:"linear-gradient(135deg,rgba(250,248,243,.8),rgba(255,254,249,.9))", padding:20 }}>
        <div style={{ background:"white", borderRadius:24, padding:"clamp(24px, 5vw, 40px)", maxWidth:480, width:"100%", textAlign:"center", boxShadow:"0 20px 60px rgba(47,143,78,.1)", border:"1.5px solid rgba(47,143,78,.15)" }}>
          <div style={{ fontSize:60, marginBottom:16 }}>🎉</div>
          <h2 style={{ margin:"0 0 8px", color:"#1C3A2B", fontSize:24, fontWeight:800 }}>Pesanan Berhasil!</h2>
          <p style={{ color:"#5A4A40", fontSize:14, margin:"0 0 20px", lineHeight:1.6 }}>
            Terima kasih sudah berbelanja di Ciburial Marketplace!<br/>
            Tim kami akan menghubungi kamu via WhatsApp.
          </p>
          <div style={{ background:"rgba(47,143,78,.06)", border:"1px solid rgba(47,143,78,.15)", borderRadius:12, padding:"14px 20px", marginBottom:24 }}>
            <div style={{ fontSize:12, color:"#7a9a7e", marginBottom:4 }}>ID Pesanan</div>
            <div style={{ fontWeight:800, fontSize:16, color:"#1C3A2B", letterSpacing:"0.05em" }}>{orderDone.orderId}</div>
            <div style={{ fontSize:12, color:"#7a9a7e", marginTop:4 }}>via {orderDone.metode}</div>
          </div>
          <div style={{ fontSize:13, color:"#5A4A40", marginBottom:24, lineHeight:1.6 }}>
            📱 Konfirmasi dikirim ke <strong>{orderForm.no_wa}</strong><br/>
            {orderForm.metode_kirim === "ambil_sendiri" ? "🏠 Ambil di Pos Kampung Ciburial" : `🛵 Estimasi pengiriman 1-3 hari`}
          </div>
          <button onClick={()=>{ setOrderDone(null); setOrderForm(emptyOrder); }}
            style={{ width:"100%", padding:"13px", borderRadius:12, background:"linear-gradient(135deg,#2F8F4E,#4FBF7E)", color:"white", border:"none", fontSize:15, fontWeight:700, cursor:"pointer" }}>
            Belanja Lagi 🛒
          </button>
        </div>
      </div>
    );
  }

  // ─── TAMPILAN CHECKOUT ──────────────────────────────────────────────────
  if (showCheckout) {
    return (
      <div className="pi" style={{ paddingTop:"clamp(64px,10vw,120px)", paddingBottom:"clamp(40px, 8vw, 80px)", minHeight:"100vh", background:"linear-gradient(135deg,rgba(250,248,243,.5),rgba(255,254,249,.8))" }}>
        <div style={{ maxWidth:720, margin:"0 auto", padding:"0 clamp(16px,3vw,28px)" }}>
          <button onClick={()=>setShowCheckout(false)} style={{ display:"flex", alignItems:"center", gap:6, background:"none", border:"none", cursor:"pointer", fontSize:14, fontWeight:700, color:"#2F8F4E", padding:"clamp(4px, 1vw, 6px) 0", marginBottom:20 }}>
            ← Kembali ke Keranjang
          </button>
          <h2 style={{ margin:"0 0 24px", color:"#1C3A2B", fontSize:"clamp(22px,4vw,30px)", fontWeight:800 }}>🧾 Detail Pesanan</h2>

          <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:16 }}>
            {/* Form kiri */}
            <div style={{ display:"flex", flexDirection:"column", gap:14 }}>
              {/* Identitas */}
              <div style={{ background:"white", borderRadius:16, padding:"clamp(16px, 4vw, 20px)", border:"1.5px solid rgba(47,143,78,.12)", boxShadow:"0 4px 16px rgba(47,143,78,.06)" }}>
                <h4 style={{ margin:"0 0 14px", color:"#1C3A2B", fontSize:14, fontWeight:700, textTransform:"uppercase", letterSpacing:"0.06em" }}>👤 Identitas Pembeli</h4>
                <div style={{ display:"flex", flexDirection:"column", gap:10 }}>
                  {[
                    {label:"Nama Lengkap *", key:"nama", ph:"Nama sesuai identitas"},
                    {label:"No. WhatsApp *", key:"no_wa", ph:"08xxxxxxxxxx"},
                  ].map(f=>(
                    <div key={f.key}>
                      <label style={{ fontSize:11, fontWeight:700, color:"#6b7c6d", letterSpacing:"0.06em", textTransform:"uppercase" as const, display:"block", marginBottom:4 }}>{f.label}</label>
                      <input value={(orderForm as any)[f.key]} onChange={e=>setOrderForm({...orderForm,[f.key]:e.target.value})} placeholder={f.ph}
                        style={{ width:"100%", padding:"clamp(6px, 2vw, 9px) clamp(8px, 2vw, 12px)", borderRadius:10, border:"1.5px solid rgba(47,143,78,.2)", fontSize:13, outline:"none", boxSizing:"border-box" as const }}/>
                    </div>
                  ))}
                </div>
              </div>

              {/* Pengiriman */}
              <div style={{ background:"white", borderRadius:16, padding:"clamp(16px, 4vw, 20px)", border:"1.5px solid rgba(47,143,78,.12)", boxShadow:"0 4px 16px rgba(47,143,78,.06)" }}>
                <h4 style={{ margin:"0 0 14px", color:"#1C3A2B", fontSize:14, fontWeight:700, textTransform:"uppercase", letterSpacing:"0.06em" }}>🚚 Metode Pengiriman</h4>
                <div style={{ display:"flex", flexDirection:"column", gap:8 }}>
                  {METODE_KIRIM.map(m=>(
                    <div key={m.v} onClick={()=>setOrderForm({...orderForm,metode_kirim:m.v as any})}
                      style={{ padding:"clamp(8px, 2vw, 10px) clamp(10px, 3vw, 14px)", borderRadius:10, border:`1.5px solid ${orderForm.metode_kirim===m.v?"#2F8F4E":"rgba(47,143,78,.15)"}`, cursor:"pointer", background:orderForm.metode_kirim===m.v?"rgba(47,143,78,.06)":"white", display:"flex", justifyContent:"space-between", alignItems:"center", transition:"all 0.15s" }}>
                      <span style={{ fontSize:13, color:"#1C3A2B", fontWeight:500 }}>{m.l}</span>
                      <span style={{ fontSize:13, fontWeight:700, color: m.harga===0?"#2F8F4E":"#1C3A2B" }}>{m.harga===0?"Gratis":`+${fRp(m.harga)}`}</span>
                    </div>
                  ))}
                </div>
                {orderForm.metode_kirim!=="ambil_sendiri" && (
                  <div style={{ marginTop:12 }}>
                    <label style={{ fontSize:11, fontWeight:700, color:"#6b7c6d", letterSpacing:"0.06em", textTransform:"uppercase" as const, display:"block", marginBottom:4 }}>Alamat Lengkap *</label>
                    <textarea value={orderForm.alamat} onChange={e=>setOrderForm({...orderForm,alamat:e.target.value})} placeholder="Nama jalan, RT/RW, desa..." rows={2}
                      style={{ width:"100%", padding:"clamp(6px, 2vw, 9px) clamp(8px, 2vw, 12px)", borderRadius:10, border:"1.5px solid rgba(47,143,78,.2)", fontSize:13, outline:"none", resize:"none" as const, boxSizing:"border-box" as const, fontFamily:"inherit" }}/>
                  </div>
                )}
              </div>

              {/* Catatan */}
              <div style={{ background:"white", borderRadius:16, padding:"clamp(16px, 4vw, 20px)", border:"1.5px solid rgba(47,143,78,.12)" }}>
                <label style={{ fontSize:11, fontWeight:700, color:"#6b7c6d", letterSpacing:"0.06em", textTransform:"uppercase" as const, display:"block", marginBottom:8 }}>📝 Catatan (opsional)</label>
                <textarea value={orderForm.catatan} onChange={e=>setOrderForm({...orderForm,catatan:e.target.value})} placeholder="Catatan khusus untuk penjual..." rows={2}
                  style={{ width:"100%", padding:"clamp(6px, 2vw, 9px) clamp(8px, 2vw, 12px)", borderRadius:10, border:"1.5px solid rgba(47,143,78,.15)", fontSize:13, outline:"none", resize:"none" as const, boxSizing:"border-box" as const, fontFamily:"inherit" }}/>
              </div>
            </div>

            {/* Ringkasan + payment kanan */}
            <div style={{ display:"flex", flexDirection:"column", gap:14 }}>
              {/* Ringkasan order */}
              <div style={{ background:"white", borderRadius:16, padding:"clamp(16px, 4vw, 20px)", border:"1.5px solid rgba(47,143,78,.12)", boxShadow:"0 4px 16px rgba(47,143,78,.06)" }}>
                <h4 style={{ margin:"0 0 14px", color:"#1C3A2B", fontSize:14, fontWeight:700, textTransform:"uppercase", letterSpacing:"0.06em" }}>🛒 Ringkasan ({cart.length} produk)</h4>
                {cart.map(item=>(
                  <div key={item.id} style={{ display:"flex", justifyContent:"space-between", padding:"clamp(4px, 1vw, 6px) 0", borderBottom:"1px solid rgba(47,143,78,.08)", fontSize:13 }}>
                    <span style={{ color:"#1C3A2B" }}>{item.nama} ×{item.qty}</span>
                    <span style={{ fontWeight:600, color:"#2F8F4E" }}>{fRp(item.harga*item.qty)}</span>
                  </div>
                ))}
                <div style={{ display:"flex", justifyContent:"space-between", padding:"clamp(6px, 2vw, 8px) 0", fontSize:13, color:"#6b7c6d" }}>
                  <span>Ongkos Kirim</span>
                  <span style={{ color:ongkosKirim===0?"#2F8F4E":"#1C3A2B" }}>{ongkosKirim===0?"Gratis":fRp(ongkosKirim)}</span>
                </div>
                <div style={{ display:"flex", justifyContent:"space-between", padding:"clamp(8px, 2vw, 10px) 0 0", borderTop:"2px solid rgba(47,143,78,.15)", fontWeight:800, color:"#1C3A2B", fontSize:16 }}>
                  <span>Total</span>
                  <span style={{ color:"#2F8F4E" }}>{fRp(totalBayar)}</span>
                </div>
              </div>

              {/* Metode bayar */}
              <div style={{ background:"white", borderRadius:16, padding:"clamp(16px, 4vw, 20px)", border:"1.5px solid rgba(47,143,78,.12)", boxShadow:"0 4px 16px rgba(47,143,78,.06)" }}>
                <h4 style={{ margin:"0 0 14px", color:"#1C3A2B", fontSize:14, fontWeight:700, textTransform:"uppercase", letterSpacing:"0.06em" }}>💳 Metode Pembayaran</h4>
                {["E-Wallet & QRIS","Transfer Bank"].map(grup=>(
                  <div key={grup} style={{ marginBottom:12 }}>
                    <div style={{ fontSize:10, fontWeight:700, color:"#9A8C85", letterSpacing:"0.1em", textTransform:"uppercase" as const, marginBottom:6 }}>{grup}</div>
                    <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:6 }}>
                      {METODE_BAYAR.filter(m=>m.grup===grup).map(m=>(
                        <div key={m.v} onClick={()=>setOrderForm({...orderForm,metode_bayar:m.v as any})}
                          style={{ padding:"clamp(6px, 2vw, 8px) clamp(8px, 2vw, 10px)", borderRadius:10, border:`1.5px solid ${orderForm.metode_bayar===m.v?"#2F8F4E":"rgba(47,143,78,.15)"}`, cursor:"pointer", background:orderForm.metode_bayar===m.v?"rgba(47,143,78,.08)":"white", display:"flex", alignItems:"center", gap:6, transition:"all 0.15s" }}>
                          <span style={{ fontSize:16 }}>{m.icon}</span>
                          <span style={{ fontSize:11, fontWeight:600, color:"#1C3A2B" }}>{m.l}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>

              {/* Tombol bayar */}
              <button onClick={prosesCheckout} disabled={orderLoading}
                style={{ padding:"clamp(10px, 3vw, 14px)", borderRadius:14, background:orderLoading?"rgba(47,143,78,.3)":"linear-gradient(135deg,#2F8F4E,#4FBF7E)", color:"white", border:"none", fontSize:15, fontWeight:800, cursor:orderLoading?"not-allowed":"pointer", boxShadow:"0 8px 20px rgba(47,143,78,.25)", letterSpacing:"0.03em", transition:"all 0.2s" }}>
                {orderLoading ? "Memproses..." : `🔒 Bayar ${fRp(totalBayar)}`}
              </button>
              <div style={{ fontSize:11, color:"#9A8C85", textAlign:"center", lineHeight:1.5 }}>
                🔒 Pembayaran aman via Midtrans<br/>
                Didukung oleh Bank Indonesia
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // ─── TRACKING ORDER ────────────────────────────────────────────────────
  if (showTracking) {
    const STATUS_INFO = {
      pending: { label: "⏳ Menunggu Pembayaran", warna: "#FFB84D", progress: 10 },
      dibayar: { label: "✅ Pembayaran Diterima", warna: "#4FBF7E", progress: 25 },
      diproses: { label: "📦 Sedang Diproses", warna: "#0066CC", progress: 50 },
      dikirim: { label: "🚚 Sedang Dikirim", warna: "#6366F1", progress: 75 },
      selesai: { label: "🎉 Pesanan Selesai", warna: "#2F8F4E", progress: 100 },
      dibatalkan: { label: "❌ Pesanan Dibatalkan", warna: "#B8472F", progress: 0 },
    };

    const statusInfo = trackedOrder ? STATUS_INFO[trackedOrder.status as keyof typeof STATUS_INFO] : null;
    const items = trackedOrder ? (typeof trackedOrder.items === "string" ? JSON.parse(trackedOrder.items) : trackedOrder.items) : [];

    return (
      <div className="pi" style={{ paddingTop: "clamp(64px,10vw,120px)", paddingBottom: "clamp(40px, 8vw, 80px)", minHeight: "100vh", background: "linear-gradient(135deg,rgba(250,248,243,.5) 0%,rgba(255,254,249,.8) 100%)" }}>
        <div style={{ maxWidth: 600, margin: "0 auto", padding: "0 clamp(16px,3vw,28px)" }}>
          <button onClick={() => setShowTracking(false)} style={{ display: "flex", alignItems: "center", gap: 6, background: "none", border: "none", cursor: "pointer", fontSize: 14, fontWeight: 700, color: "#2F8F4E", padding: "clamp(4px, 1vw, 6px) 0", marginBottom: 24 }}>
            ← Kembali ke Marketplace
          </button>

          <h2 style={{ margin: "0 0 24px", color: "#1C3A2B", fontSize: "clamp(22px,4vw,28px)", fontWeight: 800 }}>📦 Lacak Pesanan</h2>

          <form onSubmit={cariTracking} style={{ marginBottom: 24 }}>
            <div style={{ display: "flex", gap: 8 }}>
              <input
                type="text"
                value={trackingId}
                onChange={(e) => {
                  setTrackingId(e.target.value.toUpperCase());
                  setTrackingError("");
                }}
                placeholder="Contoh: MKT-1776656649289"
                style={{ flex: 1, padding: "clamp(8px, 2vw, 12px) clamp(10px, 3vw, 14px)", borderRadius: 10, border: "1.5px solid rgba(47,143,78,.2)", fontSize: 13, outline: "none", boxSizing: "border-box" }}
              />
              <button
                type="submit"
                disabled={trackingLoading}
                style={{ padding: "clamp(8px, 2vw, 12px) clamp(16px, 4vw, 20px)", borderRadius: 10, background: trackingLoading ? "rgba(47,143,78,.3)" : "linear-gradient(135deg,#2F8F4E,#4FBF7E)", color: "white", border: "none", fontSize: 13, fontWeight: 700, cursor: trackingLoading ? "not-allowed" : "pointer" }}
              >
                {trackingLoading ? "⏳" : "🔍"}
              </button>
            </div>
            {trackingError && <div style={{ marginTop: 10, fontSize: 12, color: "#B8472F", fontWeight: 600 }}>{trackingError}</div>}
          </form>

          {trackedOrder && statusInfo && (
            <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
              <div style={{ background: "white", borderRadius: 14, padding: "clamp(16px, 4vw, 20px)", border: `1.5px solid ${statusInfo.warna}40` }}>
                <div style={{ fontSize: 40, marginBottom: 12 }}>{statusInfo.label.split(" ")[0]}</div>
                <h3 style={{ margin: "0 0 8px", color: "#1C3A2B", fontSize: 18, fontWeight: 700 }}>{statusInfo.label.substring(2)}</h3>
                <div style={{ fontSize: 12, color: "#6b7c6d", fontFamily: "monospace", fontWeight: 600, marginBottom: 16 }}>{trackedOrder.order_id}</div>
                
                <div style={{ height: 6, background: "rgba(47,143,78,.1)", borderRadius: 3, overflow: "hidden", marginBottom: 8 }}>
                  <div style={{ height: "100%", background: statusInfo.warna, width: `${statusInfo.progress}%`, transition: "width 0.6s ease" }} />
                </div>
                <div style={{ fontSize: 11, color: "#6b7c6d" }}>{statusInfo.progress}% Selesai</div>

                {trackedOrder.no_resi && trackedOrder.status !== "pending" && (
                  <div style={{ marginTop: 14, padding: "clamp(8px, 2vw, 12px)", background: "rgba(47,143,78,.06)", borderRadius: 8, fontSize: 12 }}>
                    <div style={{ color: "#6b7c6d", fontWeight: 600, marginBottom: 4 }}>No. Resi:</div>
                    <div style={{ fontFamily: "monospace", fontWeight: 700, color: "#2F8F4E" }}>{trackedOrder.no_resi}</div>
                  </div>
                )}
              </div>

              {items.length > 0 && (
                <div style={{ background: "white", borderRadius: 12, padding: "clamp(12px, 3vw, 16px)", border: "1px solid rgba(47,143,78,.12)" }}>
                  <div style={{ fontSize: 12, fontWeight: 700, color: "#1C3A2B", marginBottom: 10 }}>📦 Produk ({items.length})</div>
                  {items.map((item: any, i: number) => (
                    <div key={i} style={{ padding: "clamp(6px, 2vw, 8px) 0", borderBottom: i < items.length - 1 ? "1px solid rgba(47,143,78,.08)" : "none", fontSize: 12 }}>
                      <div style={{ color: "#1C3A2B", fontWeight: 600 }}>{item.nama} ×{item.qty}</div>
                      <div style={{ fontSize: 11, color: "#9A8C85" }}>{fRp(item.harga * item.qty)}</div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    );
  }

  // ─── PRODUCT DETAIL MODAL ─────────────────────────────────────────────
  if (selectedProduct) {
    const totalRating = reviews.length > 0 ? (reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length).toFixed(1) : "0.0";
    const ratingDist = {
      5: reviews.filter(r => r.rating === 5).length,
      4: reviews.filter(r => r.rating === 4).length,
      3: reviews.filter(r => r.rating === 3).length,
      2: reviews.filter(r => r.rating === 2).length,
      1: reviews.filter(r => r.rating === 1).length,
    };

    return (
      <div className="pi" style={{ paddingTop: "clamp(64px,10vw,120px)", paddingBottom: "clamp(40px, 8vw, 80px)", minHeight: "100vh", background: "linear-gradient(135deg,rgba(250,248,243,.5) 0%,rgba(255,254,249,.8) 100%)" }}>
        <div style={{ maxWidth: 1200, margin: "0 auto", padding: "0 clamp(16px,3vw,28px)" }}>
          {/* Close Button */}
          <button onClick={() => { setSelectedProduct(null); setDetailQty(1); setActivePhotoIndex(0); }} style={{ display: "flex", alignItems: "center", gap: 6, background: "none", border: "none", cursor: "pointer", fontSize: 14, fontWeight: 700, color: "#2F8F4E", padding: "clamp(4px, 1vw, 6px) 0", marginBottom: 24, transition: "all 0.3s" }}
            onMouseEnter={(e) => e.currentTarget.style.transform = "translateX(-4px)"}
            onMouseLeave={(e) => e.currentTarget.style.transform = "translateX(0)"}
          >
            ← Kembali ke Marketplace
          </button>

          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 40, marginBottom: 40 }} className="responsive-grid">
            {/* Foto Produk Besar (Left) */}
            <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
              {/* Get photos from fotos array or fallback to foto */}
              {(() => {
                const photos = (selectedProduct as any)?.fotos && Array.isArray((selectedProduct as any).fotos) && (selectedProduct as any).fotos.length > 0
                  ? (selectedProduct as any).fotos
                  : selectedProduct?.foto ? [selectedProduct.foto] : [];
                
                return (
                  <>
                    {/* Main Photo */}
                    <div style={{ borderRadius: 16, overflow: "hidden", aspectRatio: "1/1", background: "linear-gradient(135deg,rgba(79,191,126,.08),rgba(47,143,78,.04))", display: "flex", alignItems: "center", justifyContent: "center", border: "1.5px solid rgba(47,143,78,.15)", position: "relative" }}>
                      {photos.length > 0 && photos[activePhotoIndex] ? (
                        <>
                          <img src={photos[activePhotoIndex]} alt={selectedProduct!.nama} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                          {/* Photo Counter */}
                          {photos.length > 1 && (
                            <div style={{ position: "absolute", bottom: 14, right: 14, background: "rgba(0,0,0,.5)", color: "white", padding: "clamp(4px, 1vw, 6px) clamp(8px, 2vw, 12px)", borderRadius: 20, fontSize: 11, fontWeight: 700, letterSpacing: "0.05em" }}>
                              {activePhotoIndex + 1}/{photos.length}
                            </div>
                          )}
                          {/* Nav Arrows */}
                          {photos.length > 1 && (
                            <>
                              <button
                                onClick={() => setActivePhotoIndex(Math.max(0, activePhotoIndex - 1))}
                                style={{ position: "absolute", left: 14, top: "50%", transform: "translateY(-50%)", background: "rgba(0,0,0,.4)", border: "none", color: "white", fontSize: 20, width: 40, height: 40, borderRadius: 8, cursor: "pointer", transition: "all 0.2s" }}
                                onMouseEnter={(e) => e.currentTarget.style.background = "rgba(0,0,0,.6)"}
                                onMouseLeave={(e) => e.currentTarget.style.background = "rgba(0,0,0,.4)"}
                              >
                                ‹
                              </button>
                              <button
                                onClick={() => setActivePhotoIndex(Math.min(photos.length - 1, activePhotoIndex + 1))}
                                style={{ position: "absolute", right: 14, top: "50%", transform: "translateY(-50%)", background: "rgba(0,0,0,.4)", border: "none", color: "white", fontSize: 20, width: 40, height: 40, borderRadius: 8, cursor: "pointer", transition: "all 0.2s" }}
                                onMouseEnter={(e) => e.currentTarget.style.background = "rgba(0,0,0,.6)"}
                                onMouseLeave={(e) => e.currentTarget.style.background = "rgba(0,0,0,.4)"}
                              >
                                ›
                              </button>
                            </>
                          )}
                        </>
                      ) : (
                        <span style={{ fontSize: 120 }}>{selectedProduct!.icon || "🎋"}</span>
                      )}
                      {selectedProduct!.tag && (
                        <div style={{ position: "absolute", top: 20, left: 20, padding: "clamp(8px, 2vw, 10px) clamp(12px, 3vw, 16px)", background: "linear-gradient(135deg,#2F8F4E,#4FBF7E)", color: "#FFF", borderRadius: 8, fontSize: 13, fontWeight: 800, boxShadow: "0 4px 12px rgba(47,143,78,.3)" }}>
                          {selectedProduct!.tag}
                        </div>
                      )}
                    </div>

                    {/* Thumbnail Gallery */}
                    {photos.length > 1 && (
                      <div style={{ display: "flex", gap: 8, overflowX: "auto", paddingBottom: 4 }}>
                        {photos.map((photo: string, idx: number) => (
                          <button
                            key={idx}
                            onClick={() => setActivePhotoIndex(idx)}
                            style={{ width: 70, height: 70, borderRadius: 10, overflow: "hidden", border: `3px solid ${activePhotoIndex === idx ? "#2F8F4E" : "rgba(47,143,78,.2)"}`, cursor: "pointer", flexShrink: 0, transition: "all 0.2s", padding: 0, background: "none" }}
                          >
                            <img src={photo} alt={`${idx + 1}`} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                          </button>
                        ))}
                      </div>
                    )}
                  </>
                );
              })()}
            </div>

            {/* Info Produk (Right) */}
            <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
              {/* Header: Nama & Rating */}
              <div>
                <h1 style={{ margin: "0 0 12px", color: "#1C3A2B", fontSize: "clamp(24px,5vw,32px)", fontWeight: 800, lineHeight: 1.2 }}>
                  {selectedProduct.nama}
                </h1>
                
                {/* Rating Stars */}
                <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 12 }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                    <span style={{ fontSize: 24 }}>★</span>
                    <span style={{ fontSize: 20, fontWeight: 800, color: "#2F8F4E" }}>{totalRating}</span>
                    <span style={{ fontSize: 13, color: "#6b7c6d" }}>({reviews.length} ulasan)</span>
                  </div>
                </div>

                {/* Lokasi */}
                <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 16 }}>
                  <span style={{ fontSize: 14 }}>📍</span>
                  <span style={{ fontSize: 14, color: "#5A4A40", fontWeight: 500 }}>Kampung Ciburial</span>
                </div>
              </div>

              {/* Harga Besar */}
              <div style={{ padding: "clamp(12px, 3vw, 16px)", background: "linear-gradient(135deg,rgba(79,191,126,.1),rgba(47,143,78,.05))", borderRadius: 12, border: "1.5px solid rgba(47,143,78,.15)" }}>
                <div style={{ fontSize: 12, color: "#6b7c6d", fontWeight: 600, marginBottom: 8 }}>HARGA</div>
                <div className="fnt" style={{ fontSize: "clamp(28px,5vw,40px)", fontWeight: 900, background: "linear-gradient(135deg,#2F8F4E,#4FBF7E)", backgroundClip: "text", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}>
                  {fRp(selectedProduct.harga)}
                </div>
              </div>

              {/* Deskripsi */}
              <div>
                <h3 style={{ margin: "0 0 10px", color: "#1C3A2B", fontSize: 14, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.05em" }}>Deskripsi</h3>
                <p style={{ margin: 0, color: "#5A4A40", fontSize: 14, lineHeight: 1.6, fontWeight: 500 }}>
                  {selectedProduct.deskripsi || "Tidak ada deskripsi tersedia untuk produk ini."}
                </p>
              </div>

              {/* Quantity Selector */}
              <div style={{ display: "flex", alignItems: "center", gap: 16, padding: "clamp(12px, 3vw, 16px)", background: "rgba(47,143,78,.06)", borderRadius: 12, border: "1.5px solid rgba(47,143,78,.15)" }}>
                <span style={{ fontSize: 12, fontWeight: 700, color: "#6b7c6d", textTransform: "uppercase", letterSpacing: "0.05em" }}>Jumlah</span>
                <div style={{ display: "flex", alignItems: "center", gap: 10, background: "white", borderRadius: 8, padding: "clamp(2px, 1vw, 4px) clamp(6px, 2vw, 8px)", border: "1.5px solid rgba(47,143,78,.2)" }}>
                  <button
                    onClick={() => setDetailQty(Math.max(1, detailQty - 1))}
                    style={{ background: "none", border: "none", fontSize: 18, cursor: "pointer", color: "#2F8F4E", fontWeight: 800, width: 24, textAlign: "center", transition: "all 0.2s", padding: 0 }}
                    onMouseEnter={(e) => e.currentTarget.style.transform = "scale(1.2)"}
                    onMouseLeave={(e) => e.currentTarget.style.transform = "scale(1)"}
                  >
                    −
                  </button>
                  <span style={{ fontSize: 14, fontWeight: 800, color: "#1C3A2B", minWidth: 30, textAlign: "center" }}>{detailQty}</span>
                  <button
                    onClick={() => setDetailQty(detailQty + 1)}
                    style={{ background: "none", border: "none", fontSize: 18, cursor: "pointer", color: "#2F8F4E", fontWeight: 800, width: 24, textAlign: "center", transition: "all 0.2s", padding: 0 }}
                    onMouseEnter={(e) => e.currentTarget.style.transform = "scale(1.2)"}
                    onMouseLeave={(e) => e.currentTarget.style.transform = "scale(1)"}
                  >
                    +
                  </button>
                </div>
              </div>

              {/* Buttons Container */}
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
                {/* Tambah ke Keranjang */}
                <button onClick={() => {
                  for (let i = 0; i < detailQty; i++) addToCart(selectedProduct);
                  setSelectedProduct(null);
                  setDetailQty(1);
                }}
                  style={{ padding: "clamp(10px, 3vw, 14px) clamp(16px, 4vw, 24px)", background: "linear-gradient(135deg,#2F8F4E,#4FBF7E)", border: "none", borderRadius: 12, color: "#FFF", fontSize: 15, fontWeight: 800, cursor: "pointer", boxShadow: "0 8px 20px rgba(47,143,78,.25)", transition: "all 0.3s", letterSpacing: "0.02em" }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.transform = "translateY(-2px)";
                    e.currentTarget.style.boxShadow = "0 12px 28px rgba(47,143,78,.3)";
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.transform = "translateY(0)";
                    e.currentTarget.style.boxShadow = "0 8px 20px rgba(47,143,78,.25)";
                  }}
                >
                  🛒 Keranjang
                </button>

                {/* Beli Langsung */}
                <button onClick={() => {
                  const newItems: CartItem[] = [];
                  for (let i = 0; i < detailQty; i++) {
                    newItems.push({ ...selectedProduct!, qty: 1 });
                  }
                  setDirectCheckoutItems(newItems);
                  setSelectedProduct(null);
                  setDetailQty(1);
                  setShowCheckout(true);
                }}
                  style={{ padding: "clamp(10px, 3vw, 14px) clamp(16px, 4vw, 24px)", background: "linear-gradient(135deg,#B8943F,#D4AC5A)", border: "none", borderRadius: 12, color: "#FFF", fontSize: 15, fontWeight: 800, cursor: "pointer", boxShadow: "0 8px 20px rgba(184,148,63,.25)", transition: "all 0.3s", letterSpacing: "0.02em" }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.transform = "translateY(-2px)";
                    e.currentTarget.style.boxShadow = "0 12px 28px rgba(184,148,63,.3)";
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.transform = "translateY(0)";
                    e.currentTarget.style.boxShadow = "0 8px 20px rgba(184,148,63,.25)";
                  }}
                >
                  ⚡ Beli Langsung
                </button>
              </div>
            </div>
          </div>

          {/* Reviews Section */}
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 40 }}>
            {/* Rating Distribution (Left) */}
            <div style={{ background: "white", borderRadius: 16, padding: 28, border: "1.5px solid rgba(47,143,78,.12)", boxShadow: "0 4px 16px rgba(47,143,78,.06)" }}>
              <h3 style={{ margin: "0 0 24px", color: "#1C3A2B", fontSize: 16, fontWeight: 800 }}>⭐ Rating & Ulasan</h3>
              
              {/* Big Rating Display */}
              <div style={{ textAlign: "center", marginBottom: 24, paddingBottom: 24, borderBottom: "2px solid rgba(47,143,78,.15)" }}>
                <div style={{ fontSize: 56, fontWeight: 900, color: "#2F8F4E", marginBottom: 8 }}>{totalRating}</div>
                <div style={{ fontSize: 28, color: "#FFC400", marginBottom: 8 }}>{"★".repeat(Math.round(parseFloat(totalRating)))}</div>
                <div style={{ fontSize: 13, color: "#6b7c6d", fontWeight: 600 }}>Berdasarkan {reviews.length} ulasan</div>
              </div>

              {/* Rating Distribution Bars */}
              {[5,4,3,2,1].map(star => (
                <div key={star} style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 12 }}>
                  <span style={{ fontSize: 13, fontWeight: 700, color: "#1C3A2B", minWidth: 30 }}>{star}★</span>
                  <div style={{ flex: 1, height: 8, background: "rgba(47,143,78,.1)", borderRadius: 4, overflow: "hidden" }}>
                    <div style={{ height: "100%", background: "linear-gradient(90deg,#2F8F4E,#4FBF7E)", width: `${reviews.length > 0 ? (ratingDist[star as keyof typeof ratingDist] / reviews.length * 100) : 0}%`, transition: "width 0.6s ease" }} />
                  </div>
                  <span style={{ fontSize: 12, color: "#6b7c6d", fontWeight: 600, minWidth: 30 }}>{ratingDist[star as keyof typeof ratingDist]}</span>
                </div>
              ))}
            </div>

            {/* Form Tambah Review (Right) */}
            <div style={{ background: "white", borderRadius: 16, padding: 28, border: "1.5px solid rgba(47,143,78,.12)", boxShadow: "0 4px 16px rgba(47,143,78,.06)" }}>
              <h3 style={{ margin: "0 0 20px", color: "#1C3A2B", fontSize: 16, fontWeight: 800 }}>✍️ Berikan Ulasan Anda</h3>
              
              <form onSubmit={submitReview} style={{ display: "flex", flexDirection: "column", gap: 14 }}>
                {/* Nama */}
                <input
                  type="text"
                  placeholder="Nama Anda"
                  value={newReview.nama}
                  onChange={(e) => setNewReview({ ...newReview, nama: e.target.value })}
                  style={{ padding: "10px 14px", borderRadius: 8, border: "1.5px solid rgba(47,143,78,.2)", fontSize: 13, outline: "none", boxSizing: "border-box", fontFamily: "inherit" }}
                />

                {/* Rating */}
                <div>
                  <label style={{ display: "block", fontSize: 12, fontWeight: 700, color: "#6b7c6d", marginBottom: 8, textTransform: "uppercase", letterSpacing: "0.05em" }}>Rating</label>
                  <div style={{ display: "flex", gap: 8 }}>
                    {[1,2,3,4,5].map(star => (
                      <button
                        key={star}
                        type="button"
                        onClick={() => setNewReview({ ...newReview, rating: star })}
                        style={{ fontSize: 24, background: "none", border: "none", cursor: "pointer", opacity: star <= newReview.rating ? 1 : 0.4, transition: "all 0.2s" }}
                      >
                        ★
                      </button>
                    ))}
                  </div>
                </div>

                {/* Komentar */}
                <textarea
                  placeholder="Tulis ulasan Anda..."
                  value={newReview.komentar}
                  onChange={(e) => setNewReview({ ...newReview, komentar: e.target.value })}
                  style={{ padding: "10px 14px", borderRadius: 8, border: "1.5px solid rgba(47,143,78,.2)", fontSize: 13, outline: "none", boxSizing: "border-box", minHeight: 80, fontFamily: "inherit", resize: "vertical" }}
                />

                {/* Submit Button */}
                <button
                  type="submit"
                  disabled={submittingReview}
                  style={{ padding: "10px 16px", background: submittingReview ? "rgba(47,143,78,.3)" : "linear-gradient(135deg,#2F8F4E,#4FBF7E)", border: "none", borderRadius: 8, color: "#FFF", fontSize: 13, fontWeight: 700, cursor: submittingReview ? "not-allowed" : "pointer", transition: "all 0.2s", letterSpacing: "0.02em" }}
                >
                  {submittingReview ? "⏳ Mengirim..." : "✓ Kirim Ulasan"}
                </button>
              </form>
            </div>
          </div>

          {/* Recent Reviews */}
          {reviews.length > 0 && (
            <div style={{ marginTop: 40 }}>
              <h3 style={{ margin: "0 0 20px", color: "#1C3A2B", fontSize: 16, fontWeight: 800 }}>📝 Ulasan Terbaru</h3>
              <div style={{ display: "grid", gap: 16 }}>
                {reviews.slice(0, 5).map((review, i) => (
                  <div key={i} style={{ background: "white", borderRadius: 12, padding: 20, border: "1px solid rgba(47,143,78,.12)", boxShadow: "0 2px 8px rgba(0,0,0,.04)" }}>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 10 }}>
                      <div>
                        <h4 style={{ margin: "0 0 4px", color: "#1C3A2B", fontSize: 14, fontWeight: 700 }}>{review.nama}</h4>
                        <div style={{ fontSize: 12, color: "#FFC400" }}>{"★".repeat(review.rating)}</div>
                      </div>
                      <div style={{ fontSize: 11, color: "#9A8C85" }}>
                        {new Date(review.created_at).toLocaleDateString("id-ID")}
                      </div>
                    </div>
                    <p style={{ margin: "10px 0 0", color: "#5A4A40", fontSize: 13, lineHeight: 1.5 }}>
                      {review.komentar}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        <style>{`
          @media (max-width: 768px) {
            .responsive-grid {
              grid-template-columns: 1fr !important;
            }
          }
        `}</style>
      </div>
    );
  }

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
                          
                          <div style={{ marginTop: 12, paddingTop: 12, borderTop: "1px solid rgba(47,143,78,.1)", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                             <span style={{ fontSize: 12, color: "#6b7c6d", fontWeight: 500 }}>Subtotal</span>
                             <span style={{ fontSize: 16, fontWeight: 800, color: "#2F8F4E" }}>{fRp(item.harga * item.qty)}</span>
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
                  onClick={()=>{ setShowCart(false); setShowCheckout(true); }} 
                  disabled={cart.length === 0} 
                  style={{ width: "100%", padding: "14px", borderRadius: 10, fontSize: 16, fontWeight: 700, border: "none", cursor: cart.length === 0 ? "not-allowed" : "pointer", background: cart.length === 0 ? "rgba(47,143,78,.2)" : "linear-gradient(135deg,#2F8F4E,#4FBF7E)", color: cart.length === 0 ? "#5A4A40" : "#FFF", transition: "all 0.3s", letterSpacing: ".05em", boxShadow: cart.length === 0 ? "none" : "0 8px 16px rgba(47,143,78,.2)" }}
               >
                 {`Lanjut ke Checkout (${cart.length}) →`}
               </button>
               <div style={{ marginTop:8, fontSize:11, color:"#9A8C85", textAlign:"center" }}>
                 🔒 VA Bank · GoPay · OVO · Dana · QRIS
               </div>
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

            {/* Tracking Button */}
            <button onClick={() => setShowTracking(true)} style={{ position: "relative", background: "linear-gradient(135deg,#4FBF7E,#6FD09E)", border: "none", cursor: "pointer", fontSize: 22, padding: "10px 14px", borderRadius: 10, color: "white", transition: "all 0.3s", fontWeight: 600, letterSpacing: ".05em", boxShadow: "0 8px 16px rgba(79,191,126,.2)" }}
              onMouseEnter={e => {
                e.currentTarget.style.transform = "translateY(-2px)";
                e.currentTarget.style.boxShadow = "0 12px 24px rgba(79,191,126,.3)";
              }}
              onMouseLeave={e => {
                e.currentTarget.style.transform = "translateY(0)";
                e.currentTarget.style.boxShadow = "0 8px 16px rgba(79,191,126,.2)";
              }}
            >
              📦
            </button>

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
                    onClick={() => setSelectedProduct(p)}
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
                    {(() => {
                      const mainPhoto = (p as any)?.fotos && Array.isArray((p as any).fotos) && (p as any).fotos.length > 0 ? (p as any).fotos[0] : p.foto;
                      return mainPhoto ? (
                        <img src={mainPhoto} alt={p.nama} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                      ) : (
                        <span style={{ fontSize: 64 }}>{p.icon || "🎋"}</span>
                      );
                    })()}
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
                      style={{ marginTop: 12, padding: "10px", background: "linear-gradient(135deg,#2F8F4E,#4FBF7E)", border: "none", borderRadius: 8, fontSize: 12, fontWeight: 700, color: "#FFF", cursor: "pointer", transition: "all 0.3s", boxShadow: "0 4px 12px rgba(47,143,78,.2)", width: "100%" }}>
                      + Keranjang
                    </button>

                    {/* Tombol Beli Langsung */}
                    <button 
                      className="btn-buy-now"
                      onClick={(e) => {
                        e.stopPropagation();
                        setDirectCheckoutItems([{ ...p, qty: 1 }]);
                        setShowCheckout(true);
                      }}
                      style={{ marginTop: 8, padding: "8px 12px", background: "linear-gradient(135deg,#B8943F,#D4AC5A)", border: "none", borderRadius: 8, fontSize: 11, fontWeight: 700, color: "#FFF", cursor: "pointer", transition: "all 0.3s", boxShadow: "0 4px 12px rgba(184,148,63,.2)", width: "100%" }}>
                      ⚡ Beli Langsung
                    </button>

                    {/* Tombol Lihat Detail */}
                    <button 
                      className="btn-detail"
                      onClick={(e) => {
                        e.stopPropagation();
                        setSelectedProduct(p);
                      }}
                      style={{ padding: "8px 12px", background: "rgba(47,143,78,.1)", border: "1.5px solid rgba(47,143,78,.3)", borderRadius: 8, fontSize: 11, fontWeight: 600, color: "#2F8F4E", cursor: "pointer", transition: "all 0.3s", marginTop: 8, width: "100%" }}>
                      👁️ Detail
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