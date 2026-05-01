"use client";
import { TabType, Testimoni } from "./types";
import { useState, useEffect } from "react";
import { supabase, isSupabaseReady } from "@/lib/supabase";

import CommunityDashboard from "@/components/home/CommunityDashboard";
import { Transaksi, DEF_TX } from "./types";


interface TentangTabProps {
  onNavigate: (t: TabType) => void;
  testimoni?: Testimoni[];
  transaksi?: Transaksi[];
  onPaymentSuccess?: (total: number, isMkt: boolean, orderId: string, payType: string) => void;
}

// ─── STRUKTUR ORGANISASI ─────────────────────────────────────────────────
const dwnPelindung = [
  { role: "Tokoh Agama", name: "— Hasil Musyawarah —", icon: "🕌", foto: "/uploads/pengurus/dewan/tokoh-agama.jpg" },
  { role: "Kepala Kewilayahan", name: "Bpk. Enang (Ketua RW)", icon: "🏘️", foto: "/uploads/pengurus/dewan/kepala-kewilayahan.jpg" },
  { role: "Koordinator RT 01", name: "Sarip Hidayat", icon: "👤", foto: "/uploads/pengurus/dewan/rt01.jpg" },
  { role: "Koordinator RT 02", name: "Oneng", icon: "👤", foto: "/uploads/pengurus/dewan/rt02.jpg" },
  { role: "Koordinator RT 03", name: "Mumun", icon: "👤", foto: "/uploads/pengurus/dewan/rt03.jpg" },
];
const dwnPengawas = [
  { role: "Pengelola Dana DKM", name: "Bpk. Pupu Apipudin", icon: "🤲", foto: "/uploads/pengurus/dewan/kas-dkm.jpg" },
];
const timEksekutif = [
  { role: "Ketua Pelaksana (PM)", name: "— Hasil Voting —", icon: "⚡", foto: "/uploads/pengurus/tim-eksekutif/ketua-pm.jpg" },
  { role: "Sekretaris", name: "— Hasil Voting —", icon: "📋", foto: "/uploads/pengurus/tim-eksekutif/sekretaris.jpg" },
  { role: "Bendahara", name: "— Hasil Voting —", icon: "💰", foto: "/uploads/pengurus/tim-eksekutif/bendahara.jpg" },
];
const divisi = [
  {
    icon: "🏗️", nama: "Green Build", full: "Infrastruktur & Konstruksi Hijau", tugas: "Balai Serba Guna, Smart PJU, drainase resapan",
    ketua: { nama: "— Hasil Voting —" }, wakil: { nama: "— Hasil Voting —" }
  },
  {
    icon: "💻", nama: "Digital Hub", full: "IT, Jaringan & Web3", tugas: "RT/RW Net, Learning Hub, Website, Crypto",
    ketua: { nama: "— Hasil Voting —" }, wakil: { nama: "— Hasil Voting —" }
  },
  {
    icon: "🌾", nama: "Eco-Waste & Farming", full: "Smart Farming & Lingkungan", tugas: "Pertanian organik, peternakan, Bank Sampah",
    ketua: { nama: "— Hasil Voting —" }, wakil: { nama: "— Hasil Voting —" }
  },
  {
    icon: "🛒", nama: "Local Commerce", full: "Ekonomi Kreatif & UMKM", tugas: "Pengrajin lokal, marketplace, quality control",
    ketua: { nama: "— Hasil Voting —" }, wakil: { nama: "— Hasil Voting —" }
  },
  {
    icon: "📢", nama: "Public Relations", full: "Humas & Transparansi Publik", tugas: "Dokumentasi, laporan dana, komunikasi CSR",
    ketua: { nama: "— Hasil Voting —" }, wakil: { nama: "— Hasil Voting —" }
  },
];

export default function TentangTab({ onNavigate, testimoni = [], transaksi = DEF_TX, onPaymentSuccess }: TentangTabProps) {
  const [loadingDonasi, setLoadingDonasi] = useState(false);
  const [totalJiwa, setTotalJiwa] = useState<number | null>(null);
  const [pengurusDb, setPengurusDb] = useState<any[]>([]);
  const [showStory, setShowStory] = useState(false);
  const [selectedDonationMethod, setSelectedDonationMethod] = useState<string | null>(null);
  const [popoverPos, setPopoverPos] = useState({ top: 0, left: 0 });

  useEffect(() => {
    const handleScroll = () => {
      if (selectedDonationMethod) setSelectedDonationMethod(null);
    };
    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, [selectedDonationMethod]);

  // Calculate saldo from transaksi
  const totMasuk = transaksi.filter(t => t.tipe === "masuk").reduce((s, t) => s + t.jumlah, 0);
  const totKeluar = transaksi.filter(t => t.tipe === "keluar").reduce((s, t) => s + t.jumlah, 0);
  const saldo = totMasuk - totKeluar;

  useEffect(() => {
    if (!isSupabaseReady()) return;
    (async () => {
      // Total jiwa = anggota_kk saja (kepala keluarga sudah termasuk di dalamnya)
      // Tabel "keluarga" adalah data KK, bukan jiwa — jangan dijumlahkan
      const angRes = await supabase.from("anggota_kk").select("id", { count: "exact", head: true });
      setTotalJiwa(angRes.count || 0);

      const pgRes = await supabase.from("pengurus_desa").select("*").order("urutan", { ascending: true });
      if (pgRes.data && pgRes.data.length > 0) {
        setPengurusDb(pgRes.data);
      }
    })();
  }, []);

  const bayarDonasi = async () => {
    const raw = window.prompt("Berapa nominal donasi yang ingin disalurkan? (Contoh: 50000)\nMinimal: Rp 5.000", "50000");
    if (!raw) return;
    const qty = parseInt(raw.replace(/[^0-9]/g, ''), 10);
    if (isNaN(qty) || qty < 5000) {
      alert("Nominal tidak valid atau kurang dari minimal Rp 5.000");
      return;
    }
    setLoadingDonasi(true);
    const orderId = `DONASI-${Date.now()}`;
    try {
      const res = await fetch("/api/midtrans/tokenize", {
        method: "POST",
        headers: { "Content-type": "application/json" },
        body: JSON.stringify({
          order_id: orderId,
          gross_amount: qty,
          item_details: [{ id: "dn-custom", price: qty, quantity: 1, name: "Donasi Ciburial Eco-Digital" }]
        })
      });
      const data = await res.json();
      if (data.token && (window as any).snap) {
        (window as any).snap.pay(data.token, {
          onSuccess: function (r: any) {
            alert("Donasi sukses diterima! Dana langsung terdata di transparansi.");
            if (onPaymentSuccess) onPaymentSuccess(qty, false, orderId, r.payment_type || "Midtrans");
          },
          onPending: function (r: any) { alert("Menunggu status pembayaran donasi."); },
          onError: function (r: any) { alert("Pembayaran gagal."); }
        });
      } else {
        alert("Server Midtrans belum nyambung! Cek .env di Settings Vercel. (Pesan sistem: " + (data.error || "Missing Token") + ")");
      }
    } catch (e) {
      alert("Error.");
    }
    setLoadingDonasi(false);
  };

  return (
    <div className="pi">

      {/* HERO - HEROIC EDITION */}
      <section className="hero-section" style={{ position: "relative", overflow: "hidden", minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center" }}>
        {/* Background Animations */}
        <div style={{ position: "absolute", bottom: "-30%", right: "-15%", width: "800px", height: "800px", background: "radial-gradient(circle,rgba(47,143,78,.25) 0%,transparent 70%)", borderRadius: "50%", animation: "float 30s ease-in-out infinite", zIndex: 0 }} />
        <div style={{ position: "absolute", top: "-20%", left: "-10%", width: "600px", height: "600px", background: "radial-gradient(circle,rgba(184,148,63,.15) 0%,transparent 70%)", borderRadius: "50%", animation: "float 25s ease-in-out infinite reverse", zIndex: 0 }} />

        {/* Gradient Overlay */}
        <div style={{ position: "absolute", inset: 0, background: "linear-gradient(180deg,rgba(28,58,43,.1) 0%,rgba(47,143,78,.05) 50%,transparent 100%)", pointerEvents: "none", zIndex: 1 }} />

        <div className="hero-content" style={{ position: "relative", zIndex: 2, maxWidth: 1000 }}>
          {/* Badge */}
          <div className="h1" style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 40, justifyContent: "center" }}>
            <div style={{ width: 40, height: 3, background: "linear-gradient(90deg,#2F8F4E,#4FBF7E)", borderRadius: 99, boxShadow: "0 0 20px rgba(47,143,78,.4)" }} />
            <span style={{ fontSize: 11, fontWeight: 700, letterSpacing: ".15em", textTransform: "uppercase", color: "#2F8F4E", background: "rgba(79,191,126,.1)", padding: "8px 16px", borderRadius: 99, border: "1px solid rgba(47,143,78,.2)" }}>🌍 Kp. Ciburial, Garut — Est. 2026</span>
            <div style={{ width: 40, height: 3, background: "linear-gradient(90deg,#4FBF7E,#2F8F4E)", borderRadius: 99, boxShadow: "0 0 20px rgba(47,143,78,.4)" }} />
          </div>

          {/* Content */}
          <div style={{ maxWidth: 900, margin: "0 auto", width: "100%", textAlign: "center" }}>
            <div className="h2" style={{ marginBottom: 12 }}>
              <span style={{ fontSize: 13, fontWeight: 600, letterSpacing: ".15em", textTransform: "uppercase", color: "#4FBF7E", textShadow: "0 2px 8px rgba(47,143,78,.15)" }}>▼ Selamat Datang di ▼</span>
            </div>

            {/* Main Title */}
            <h1 className="fnt h3 hero-title" style={{ fontWeight: 200, lineHeight: 0.95, color: "#1C3A2B", letterSpacing: "-.04em", marginBottom: 12, fontSize: "clamp(56px,12vw,140px)", textShadow: "0 12px 32px rgba(28,58,43,.15)" }}>
              Ciburial
            </h1>

            {/* Subtitle */}
            <h2 className="fnt h4 hero-sub" style={{ fontWeight: 500, fontStyle: "italic", background: "linear-gradient(135deg,#2F8F4E,#4FBF7E)", backgroundClip: "text", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent", letterSpacing: "-.02em", marginBottom: 0, fontSize: "clamp(28px,5vw,54px)", textShadow: "0 2px 8px rgba(47,143,78,.1)" }}>
              Eco-Digital Village
            </h2>

            {/* Divider */}
            <div style={{ height: 3, background: "linear-gradient(90deg,transparent,#2F8F4E 25%,#4FBF7E 50%,#2F8F4E 75%,transparent)", margin: "28px auto", maxWidth: 200, boxShadow: "0 0 24px rgba(47,143,78,.2)" }} />

            {/* Tagline */}
            <div className="h5" style={{ marginBottom: 32 }}>
              <p className="fnt" style={{ fontSize: "clamp(14px,2.5vw,22px)", fontWeight: 300, fontStyle: "italic", color: "#5A4A40", letterSpacing: ".01em", lineHeight: 1.6, textShadow: "0 2px 4px rgba(28,58,43,.05)" }}>
                Inovasi Desa Mandiri Berbasis Kearifan Lokal dan Teknologi Masa Depan
              </p>
            </div>

            {/* Description */}
            <div className="h5" style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 20 }}>
              <p style={{ maxWidth: 620, fontSize: "clamp(15px,2vw,18px)", fontWeight: 400, lineHeight: 1.9, color: "#5A4A40" }}>
                Memutus rantai ketertinggalan dengan <strong style={{ color: "#2F8F4E", fontWeight: 600 }}>digitalisasi hasil bumi</strong>, <strong style={{ color: "#2F8F4E", fontWeight: 600 }}>ekosistem sirkular</strong>, dan <strong style={{ color: "#2F8F4E", fontWeight: 600 }}>generasi muda yang melek teknologi</strong> — tanpa meninggalkan identitas kampung halaman.
              </p>

              {/* Tags */}
              <div style={{ display: "flex", gap: 10, flexWrap: "wrap", justifyContent: "center" }}>
                {["🌱 Pertanian Organik", "🐄 Peternakan Modern", "🎋 Kerajinan Bambu", "💡 Smart PJU", "♻️ Eco-Waste", "📚 Learning Hub", "🏛️ Balai Warga"].map(tag => (
                  <span key={tag} className="badge-heroic" style={{ padding: "8px 14px", fontSize: 11, fontWeight: 600, borderRadius: 99, color: "#1C3A2B", background: "linear-gradient(135deg,rgba(47,143,78,.08),rgba(79,191,126,.08))", border: "1.5px solid rgba(47,143,78,.2)", transition: "all .3s ease", cursor: "default" }}>{tag}</span>
                ))}
              </div>
            </div>
          </div>

          {/* CTA Button */}
          <div style={{ marginTop: 52, display: "flex", justifyContent: "center", gap: 14, flexWrap: "wrap" }}>
            <button className="btn-heroic" onClick={() => document.getElementById("content-start")?.scrollIntoView({ behavior: "smooth" })} style={{ padding: "14px 32px", fontSize: 12, fontWeight: 700, letterSpacing: ".08em", textTransform: "uppercase", border: "none", borderRadius: 8, background: "linear-gradient(135deg,#2F8F4E,#4FBF7E)", color: "white", cursor: "pointer", boxShadow: "0 12px 32px rgba(47,143,78,.3)", transition: "all .35s cubic-bezier(.22,1,.36,1)" }} onMouseEnter={e => (e.currentTarget.style.transform = "translateY(-4px)", e.currentTarget.style.boxShadow = "0 16px 48px rgba(47,143,78,.4)")} onMouseLeave={e => (e.currentTarget.style.transform = "translateY(0)", e.currentTarget.style.boxShadow = "0 12px 32px rgba(47,143,78,.3)")}>
              Jelajahi Sekarang ↓
            </button>
            <button onClick={() => setShowStory(true)} style={{ padding: "14px 32px", fontSize: 12, fontWeight: 700, letterSpacing: ".08em", textTransform: "uppercase", border: "1.5px solid rgba(47,143,78,.4)", borderRadius: 8, background: "rgba(255,255,255,.6)", color: "#1C3A2B", cursor: "pointer", backdropFilter: "blur(8px)", transition: "all .35s cubic-bezier(.22,1,.36,1)", display: "flex", alignItems: "center", gap: 8 }} onMouseEnter={e => { e.currentTarget.style.transform = "translateY(-4px)"; e.currentTarget.style.background = "rgba(255,255,255,.9)"; e.currentTarget.style.boxShadow = "0 12px 32px rgba(47,143,78,.15)"; }} onMouseLeave={e => { e.currentTarget.style.transform = "translateY(0)"; e.currentTarget.style.background = "rgba(255,255,255,.6)"; e.currentTarget.style.boxShadow = "none"; }}>
              <span style={{ fontSize: 16 }}>📖</span> Our Story
            </button>
          </div>
        </div>

        {/* Scroll Indicator */}
        <div style={{ position: "absolute", bottom: 40, left: "50%", transform: "translateX(-50%)", zIndex: 2, animation: "bounce 2s ease-in-out infinite" }}>
          <div style={{ fontSize: 24, animation: "bounce 2s ease-in-out infinite" }}>⬇</div>
        </div>

        <style>{`
          @keyframes bounce {
            0%, 100% { transform: translateY(0); }
            50% { transform: translateY(-12px); }
          }
        `}</style>
      </section>

      {/* MARQUEE */}
      <div id="content-start" style={{ background: "var(--fo)", overflow: "hidden", padding: "12px 0" }}>
        <div className="mq" style={{ display: "flex", whiteSpace: "nowrap", width: "max-content" }}>
          {[...Array(4)].map((_, i) => (
            <span key={i} style={{ display: "flex", alignItems: "center", gap: 26, padding: "0 26px", color: "rgba(255,255,255,.38)", fontSize: 10, fontWeight: 700, letterSpacing: ".2em", textTransform: "uppercase" }}>
              {["Mandiri", "Berkelanjutan", "Inovatif", "Transparan", "Eco-Digital", "Gotong Royong", "Quantum Leap"].map((w, j) => (
                <span key={j}>{w}{j < 6 && <span style={{ color: "var(--gl)", margin: "0 12px" }}>✦</span>}</span>
              ))}
            </span>
          ))}
        </div>
      </div>

      {/* DEMOGRAFI - Keluarga Besar Ciburial (Heroic) */}
      <section className="sec" style={{ padding: "clamp(60px,8vw,100px) clamp(16px,4vw,32px)", background: "linear-gradient(135deg,rgba(250,248,243,.95) 0%,rgba(232,245,238,.5) 100%)" }}>
        <div style={{ maxWidth: 1320, margin: "0 auto" }}>
          <div style={{ textAlign: "center", marginBottom: 56 }}>
            <div style={{ display: "inline-block", width: "44px", height: "3px", background: "linear-gradient(90deg, #2F8F4E, #4FBF7E)", borderRadius: "99px", boxShadow: "0 0 16px rgba(47,143,78,.4)", marginBottom: "20px" }} />
            <h2 className="fnt" style={{ fontSize: "clamp(32px,5vw,54px)", fontWeight: 300, background: "linear-gradient(135deg,#1C3A2B,#2F8F4E)", backgroundClip: "text", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent", letterSpacing: "-.02em", marginBottom: 16 }}>Keluarga Besar Ciburial</h2>
            <p style={{ color: "#5A4A40", fontSize: 14, marginTop: 0, maxWidth: 500, margin: "0 auto", fontWeight: 500, lineHeight: 1.8 }}>Pemuda mendominasi komunitas dari total <strong style={{ color: "#2F8F4E" }}>{totalJiwa !== null ? totalJiwa.toLocaleString() : "450"} jiwa</strong>. Mereka adalah modal utama quantum leap Ciburial.</p>
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(240px,1fr))", gap: 20 }}>
            {[{ l: "👶 Pemuda/Pemudi (Penerus)", pct: 55, c: "#2F8F4E", bg: "linear-gradient(135deg,rgba(79,191,126,.12),rgba(47,143,78,.06))" }, { l: "🧓 Lansia (Sesepuh)", pct: 45, c: "#9B7D4C", bg: "linear-gradient(135deg,rgba(184,148,63,.12),rgba(155,125,76,.06))" }].map((item, i) => (
              <div key={i} className="dem-card" style={{ padding: "32px", background: item.bg, borderRadius: 16, border: `1.5px solid ${item.c}30`, transition: "all 0.35s cubic-bezier(.22,1,.36,1)", cursor: "pointer" }}
                onMouseEnter={(e) => {
                  const el = e.currentTarget as HTMLElement;
                  el.style.transform = "translateY(-6px)";
                  el.style.boxShadow = `0 12px 32px ${item.c}20`;
                }}
                onMouseLeave={(e) => {
                  const el = e.currentTarget as HTMLElement;
                  el.style.transform = "translateY(0)";
                  el.style.boxShadow = "none";
                }}>
                <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 20, alignItems: "flex-start" }}>
                  <span style={{ fontSize: 13, fontWeight: 700, color: "#1C3A2B", maxWidth: 160 }}>{item.l}</span>
                  <span className="fnt" style={{ fontSize: 40, fontWeight: 300, color: item.c, lineHeight: 1 }}>{item.pct}%</span>
                </div>
                <div style={{ background: "rgba(255,255,255,.4)", borderRadius: 99, height: 12, overflow: "hidden", boxShadow: "inset 0 1px 2px rgba(0,0,0,.05)" }}>
                  <div style={{ background: `linear-gradient(90deg, ${item.c}, ${item.c}cc)`, width: `${item.pct}%`, height: "100%", borderRadius: 99, transition: "all 1.2s cubic-bezier(.22,1,.36,1)", boxShadow: `0 0 12px ${item.c}80` }} />
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* DENYUT NADI — Live Community Dashboard */}
      <CommunityDashboard />

      {/* CIBURIAL SMART HUB — DIGITAL SERVICES */}
      <section className="sec" style={{ padding: "clamp(60px,8vw,100px) clamp(16px,4vw,32px)", background: "linear-gradient(180deg, rgba(232,245,238,0.5) 0%, #FAF8F3 100%)" }}>
        <div style={{ maxWidth: 1320, margin: "0 auto" }}>
          <div style={{ textAlign: "center", marginBottom: 48 }}>
            <span className="badge-heroic" style={{ padding: "6px 14px", fontSize: 10, borderRadius: 99, background: "rgba(47,143,78,0.1)", color: "#2F8F4E", border: "1px solid rgba(47,143,78,0.2)", fontWeight: 800, letterSpacing: "0.1em" }}>DIGITAL TRANSFORMATION</span>
            <h2 className="fnt" style={{ fontSize: "clamp(28px,4vw,48px)", fontWeight: 300, color: "#1C3A2B", marginTop: 16, marginBottom: 12 }}>Ciburial Smart Hub</h2>
            <p style={{ color: "#5A4A40", fontSize: 15, maxWidth: 600, margin: "0 auto", fontWeight: 500, lineHeight: 1.6 }}>Pusat kendali dan layanan warga berbasis teknologi untuk transparansi dan efisiensi desa.</p>
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 24, maxWidth: 1200 }} className="grid-2x3-hub">
            {[
              { 
                title: "E-Voting", 
                desc: "Musyawarah digital & aman",
                icon: "🗳️", 
                link: "/voting",
                color: "#2F8F4E",
                tag: "MUSYAWARAH",
                comingSoon: false
              },
              { 
                title: "Posyandu Pintar", 
                desc: "Tracking gizi & kesehatan balita",
                icon: "👶", 
                link: "/posyandu",
                color: "#8B2020",
                tag: "KESEHATAN",
                comingSoon: false
              },
              { 
                title: "Monitoring Ronda", 
                desc: "Keamanan real-time berbasis NFC",
                icon: "🔦", 
                link: "/ronda",
                color: "#1C3A2B",
                tag: "KEAMANAN",
                comingSoon: false
              },
              { 
                title: "Zakat Digital", 
                desc: "Cek kewajiban & hak Zakat",
                icon: "🕌", 
                link: "/zakat",
                color: "#B8943F",
                tag: "DKM / SOSIAL",
                comingSoon: false
              },
              { 
                title: "Layanan Aduan", 
                desc: "Lapor masalah fasilitas publik",
                icon: "📢", 
                link: "/pengaduan",
                color: "#2D5A40",
                tag: "RESPONS CEPAT",
                comingSoon: false
              },
              { 
                title: "Coming Soon", 
                desc: "Fitur dan layanan terbaru",
                icon: "✨", 
                link: "#",
                color: "#9B7D4C",
                tag: "SOON",
                comingSoon: true
              }
            ].map((item, i) => (
              <a key={i} href={item.link} style={{ textDecoration: "none", color: "inherit", pointerEvents: item.comingSoon ? "none" : "auto" }} className="hub-card-link">
                <div className="card-heroic" style={{ 
                  height: "100%", 
                  padding: "32px 24px", 
                  background: item.comingSoon ? "linear-gradient(135deg,rgba(250,248,243,.5),rgba(232,245,238,.3))" : "white", 
                  border: `1.5px solid ${item.comingSoon ? "rgba(155,125,76,.2)" : "rgba(0,0,0,0.04)"}`,
                  display: "flex",
                  flexDirection: "column",
                  gap: 16,
                  transition: "all 0.4s cubic-bezier(0.22, 1, 0.36, 1)",
                  position: "relative",
                  overflow: "hidden",
                  opacity: item.comingSoon ? 0.7 : 1
                }}>
                  {/* Decorative Gradient Background on Hover */}
                  <div className="hover-gradient" style={{ 
                    position: "absolute", 
                    top: 0, left: 0, width: "100%", height: "3px", 
                    background: `linear-gradient(90deg, transparent, ${item.color}, transparent)`,
                    opacity: 0.6
                  }} />

                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
                    <div style={{ 
                      width: 56, height: 56, borderRadius: 12, 
                      background: `${item.color}10`, 
                      display: "flex", alignItems: "center", justifyContent: "center", 
                      fontSize: 28,
                      boxShadow: `0 8px 20px ${item.color}15`
                    }}>{item.icon}</div>
                    {item.comingSoon ? (
                      <span style={{ fontSize: 8, fontWeight: 900, letterSpacing: "0.1em", color: item.color, background: `${item.color}15`, padding: "5px 10px", borderRadius: 6, border: `1.5px solid ${item.color}40`, textTransform: "uppercase" }}>Soon</span>
                    ) : (
                      <span style={{ fontSize: 8, fontWeight: 900, letterSpacing: "0.1em", color: item.color, background: `${item.color}08`, padding: "4px 10px", borderRadius: 6, border: `1px solid ${item.color}20` }}>{item.tag}</span>
                    )}
                  </div>

                  <div>
                    <h3 style={{ fontSize: 16, fontWeight: 700, color: "#1C3A2B", marginBottom: 4 }}>{item.title}</h3>
                    <p style={{ fontSize: 12, color: "#5A4A40", lineHeight: 1.5, fontWeight: 500 }}>{item.desc}</p>
                  </div>

                  {!item.comingSoon && (
                    <div style={{ marginTop: "auto", display: "flex", alignItems: "center", gap: 6, color: item.color, fontSize: 11, fontWeight: 700, letterSpacing: "0.05em" }}>
                      BUKA <span style={{ transition: "transform 0.3s" }} className="arrow">→</span>
                    </div>
                  )}
                </div>
              </a>
            ))}
          </div>
        </div>
        <style>{`
          @media (max-width: 768px) {
            .grid-2x3-hub {
              grid-template-columns: repeat(2, 1fr) !important;
            }
          }
          @media (max-width: 480px) {
            .grid-2x3-hub {
              grid-template-columns: 1fr !important;
            }
          }
          .hub-card-link:hover .card-heroic {
            transform: translateY(-8px);
            box-shadow: 0 20px 40px rgba(0,0,0,0.08);
            border-color: rgba(47,143,78,0.2);
          }
          .hub-card-link:hover .arrow {
            transform: translateX(4px);
          }
        `}</style>
      </section>


      {/* VISI MISI - HEROIC */}
      <section className="sec" style={{ padding: "clamp(60px,10vw,120px) clamp(16px,4vw,32px)", background: "linear-gradient(135deg,rgba(250,248,243,.5) 0%,rgba(255,254,249,.8) 100%)" }}>
        <div className="visi-wrap" style={{ maxWidth: 1320, margin: "0 auto", display: "flex", flexWrap: "wrap", gap: 64, alignItems: "flex-start" }}>
          <div className="visi-left" style={{ flex: "0 0 280px" }}>
            <div className="dl" />
            <h2 className="fnt" style={{ fontSize: "clamp(36px,5vw,56px)", fontWeight: 300, background: "linear-gradient(135deg,#1C3A2B,#2F8F4E)", backgroundClip: "text", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent", lineHeight: 1.1, letterSpacing: "-.03em", marginBottom: 20 }}>Visi &<br />Misi Kami</h2>
            <p style={{ fontSize: 14, lineHeight: 1.8, color: "#5A4A40", marginBottom: 24, fontWeight: 500 }}>
              Empat pilar yang menjadi cetak biru (<em>blueprint</em>) peradaban desa modern Ciburial — <strong style={{ color: "#2F8F4E" }}>makmur, mandiri, tangguh</strong>, dan melek teknologi.
            </p>
            <a href="/?tab=proposal" style={{ display: "inline-flex", alignItems: "center", gap: 8, fontSize: 13, fontWeight: 600, color: "#2F8F4E", textDecoration: "none", padding: "10px 16px", borderRadius: 8, background: "rgba(47,143,78,.08)", border: "1px solid rgba(47,143,78,.2)", transition: "all .3s ease", cursor: "pointer" }}
              onMouseEnter={e => {
                (e.currentTarget as HTMLElement).style.background = "rgba(47,143,78,.15)";
                (e.currentTarget as HTMLElement).style.transform = "translateX(4px)";
              }}
              onMouseLeave={e => {
                (e.currentTarget as HTMLElement).style.background = "rgba(47,143,78,.08)";
                (e.currentTarget as HTMLElement).style.transform = "translateX(0)";
              }}>
              Lihat Proposal Lengkap <span style={{ fontSize: 16 }}>→</span>
            </a>
          </div>
          <div style={{ flex: 1, minWidth: 260, display: "flex", flexDirection: "column", gap: 14 }}>
            {[
              { no: "01", icon: "💡", t: "Infrastruktur Cerdas", d: "Balai Serba Guna berkonsep hijau, Smart PJU, Jaringan CCTV, dan Internet Mandiri (Wi-Fi Kampung)." },
              { no: "02", icon: "📚", t: "SDM Unggul", d: "Laboratorium Komputer & Perpustakaan sebagai inkubator pemuda Ciburial yang melek teknologi." },
              { no: "03", icon: "🌱", t: "Ekonomi Sirkular & Smart Farming", d: "Pasar lokal untuk bambu, sayuran organik, peternakan terpadu, dan produk daur ulang limbah." },
              { no: "04", icon: "📊", t: "Tata Kelola Transparan", d: "Aliran dana kemakmuran terbuka secara real-time, dari fiat konvensional hingga aset kripto (Web3)." },
            ].map((v, i) => (
              <div key={i} className={`rv ch d${i + 1}`}
                style={{ padding: "24px 28px", background: "linear-gradient(135deg,rgba(255,254,249,.9),rgba(232,245,238,.6))", borderRadius: 16, border: "1.5px solid rgba(47,143,78,.15)", display: "flex", gap: 18, alignItems: "flex-start", transition: "all .35s cubic-bezier(.22,1,.36,1)", cursor: "pointer" }}
                onMouseEnter={e => {
                  (e.currentTarget as HTMLElement).style.background = "linear-gradient(135deg,rgba(255,254,249,1),rgba(232,245,238,.8))";
                  (e.currentTarget as HTMLElement).style.transform = "translateY(-6px)";
                  (e.currentTarget as HTMLElement).style.boxShadow = "0 20px 60px rgba(47,143,78,.12)";
                  (e.currentTarget as HTMLElement).style.borderColor = "rgba(47,143,78,.25)";
                }}
                onMouseLeave={e => {
                  (e.currentTarget as HTMLElement).style.background = "linear-gradient(135deg,rgba(255,254,249,.9),rgba(232,245,238,.6))";
                  (e.currentTarget as HTMLElement).style.transform = "translateY(0)";
                  (e.currentTarget as HTMLElement).style.boxShadow = "0 0 0 transparent";
                  (e.currentTarget as HTMLElement).style.borderColor = "rgba(47,143,78,.15)";
                }}
              >
                <span className="fnt" style={{ fontSize: 13, fontWeight: 700, color: "#2F8F4E", minWidth: 28, paddingTop: 4 }}>{v.no}</span>
                <span style={{ fontSize: 28 }}>{v.icon}</span>
                <div>
                  <div style={{ fontSize: 16, fontWeight: 700, color: "#1C3A2B", marginBottom: 6 }}>{v.t}</div>
                  <div style={{ fontSize: 13, lineHeight: 1.7, color: "#5A4A40", fontWeight: 500 }}>{v.d}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* PAGUYUBAN + DIVISI */}
      <section className="sec" style={{ padding: "clamp(48px,8vw,104px) clamp(16px,4vw,32px)", background: "var(--cr)" }}>
        <div style={{ maxWidth: 1320, margin: "0 auto" }}>
          <div style={{ textAlign: "center", marginBottom: 60 }}>
            <div className="dl dlc" />
            <h2 className="fnt" style={{ fontSize: "clamp(30px,5vw,54px)", fontWeight: 300, color: "var(--fo)", letterSpacing: "-.02em" }}>Struktur Kepengurusan</h2>
            <p style={{ color: "var(--ts)", fontSize: 14, marginTop: 10 }}>Gerakan ini digerakkan oleh tenaga muda profesional dari desa sendiri.</p>
          </div>

          {/* Dewan Pelindung */}
          <div style={{ marginBottom: 50 }}>
            <div style={{ fontSize: 13, fontWeight: 800, letterSpacing: ".14em", textTransform: "uppercase", color: "var(--go)", marginBottom: 20, textAlign: "center" }}>A. Dewan Pelindung & Penasihat</div>
            <div style={{ display: "flex", flexWrap: "wrap", gap: 32, justifyContent: "center" }}>
              {(pengurusDb.filter(p => p.kategori === 'pelindung').length > 0 ? pengurusDb.filter(p => p.kategori === 'pelindung') : dwnPelindung.map((p, i) => ({ ...p, jabatan: p.role, nama: p.name, id: `p-${i}` }))).map((item: any, i) => (
                <div key={item.id} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', marginTop: 50, position: 'relative', width: 220, animation: `float-heroic 6s ease-in-out infinite ${(i * 0.2).toFixed(1)}s` }}>
                  <div style={{ width: 140, height: 140, borderRadius: 28, padding: 5, background: "var(--cw)", border: `2px solid var(--go)`, zIndex: 2, position: "relative", marginBottom: -40, boxShadow: `0 16px 32px rgba(184,148,63,.25)`, overflow: "hidden" }}>
                    {item.foto ? (
                      <img src={item.foto} alt={item.nama} style={{ width: "100%", height: "100%", borderRadius: 22, objectFit: "cover" }} />
                    ) : (
                      <div style={{ width: "100%", height: "100%", borderRadius: 22, background: "var(--fo)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 44 }}>👤</div>
                    )}
                  </div>
                  <div style={{ background: "linear-gradient(135deg,rgba(184,148,63,1),rgba(155,125,76,1))", padding: "64px 20px 24px", borderRadius: "16px 16px 24px 24px", width: "100%", textAlign: "center", borderTop: "none", boxShadow: `0 12px 28px rgba(0,0,0,0.2)` }}>
                    <div style={{ fontSize: 15, fontWeight: 800, color: "white", marginBottom: 6, textShadow: "0 2px 4px rgba(0,0,0,0.2)" }}>{item.nama}</div>
                    <div style={{ fontSize: 10, fontWeight: 700, color: "rgba(255,255,255,0.9)", textTransform: "uppercase", letterSpacing: ".06em" }}>{item.jabatan}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* DKM + Tim Eksekutif */}
          <div style={{ display: "grid", gridTemplateColumns: "1fr", gap: 40, marginBottom: 40 }}>
            {/* Dewan Pengawas */}
            <div>
              <div style={{ fontSize: 13, fontWeight: 800, letterSpacing: ".14em", textTransform: "uppercase", color: "#4FBF7E", marginBottom: 20, textAlign: "center" }}>B. Dewan Pengawas Kas</div>
              <div style={{ display: "flex", flexWrap: "wrap", gap: 32, justifyContent: "center", maxWidth: 800, margin: "0 auto" }}>
                {(pengurusDb.filter(p => p.kategori === 'pengawas').length > 0 ? pengurusDb.filter(p => p.kategori === 'pengawas') : dwnPengawas.map((p, i) => ({ ...p, jabatan: p.role, nama: p.name, id: `w-${i}` }))).map((item: any, i) => (
                  <div key={item.id} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', marginTop: 40, position: 'relative', width: 220, animation: `float-heroic 6s ease-in-out infinite ${(i * 0.2 + 1).toFixed(1)}s` }}>
                    <div style={{ width: 140, height: 140, borderRadius: 28, padding: 5, background: "var(--cw)", border: `2px solid #2F8F4E`, zIndex: 2, position: "relative", marginBottom: -40, boxShadow: `0 16px 32px rgba(47,143,78,.25)`, overflow: "hidden" }}>
                      {item.foto ? (
                        <img src={item.foto} alt={item.nama} style={{ width: "100%", height: "100%", borderRadius: 22, objectFit: "cover" }} />
                      ) : (
                        <div style={{ width: "100%", height: "100%", borderRadius: 22, background: "var(--fo)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 44 }}>👤</div>
                      )}
                    </div>
                    <div style={{ background: "linear-gradient(135deg,rgba(47,143,78,1),rgba(28,58,43,1))", padding: "64px 20px 24px", borderRadius: "16px 16px 24px 24px", width: "100%", textAlign: "center", borderTop: "none", boxShadow: `0 12px 28px rgba(0,0,0,0.2)` }}>
                      <div style={{ fontSize: 15, fontWeight: 800, color: "white", marginBottom: 6, textShadow: "0 2px 4px rgba(0,0,0,0.2)" }}>{item.nama}</div>
                      <div style={{ fontSize: 10, fontWeight: 700, color: "rgba(255,255,255,0.8)", textTransform: "uppercase", letterSpacing: ".06em" }}>{item.jabatan}</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Tim Eksekutif */}
            <div>
              <div style={{ fontSize: 13, fontWeight: 800, letterSpacing: ".14em", textTransform: "uppercase", color: "var(--go)", marginBottom: 20, textAlign: "center" }}>C. Tim Eksekutif Lapangan</div>
              <div style={{ display: "flex", flexWrap: "wrap", gap: 32, justifyContent: "center" }}>
                {(pengurusDb.filter(p => p.kategori === 'eksekutif').length > 0 ? pengurusDb.filter(p => p.kategori === 'eksekutif') : timEksekutif.map((p, i) => ({ ...p, jabatan: p.role, nama: p.name, id: `e-${i}` }))).map((item: any, i) => (
                  <div key={item.id} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', marginTop: 40, position: 'relative', width: 220, animation: `float-heroic 6s ease-in-out infinite ${(i * 0.2 + 2).toFixed(1)}s` }}>
                    <div style={{ width: 140, height: 140, borderRadius: 28, padding: 5, background: "var(--cw)", border: `2px solid var(--go)`, zIndex: 2, position: "relative", marginBottom: -40, boxShadow: `0 16px 32px rgba(184,148,63,.25)`, overflow: "hidden" }}>
                      {item.foto ? (
                        <img src={item.foto} alt={item.nama} style={{ width: "100%", height: "100%", borderRadius: 22, objectFit: "cover" }} />
                      ) : (
                        <div style={{ width: "100%", height: "100%", borderRadius: 22, background: "var(--fo)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 44 }}>👤</div>
                      )}
                    </div>
                    <div style={{ background: "linear-gradient(135deg,rgba(184,148,63,1),rgba(155,125,76,1))", padding: "64px 20px 24px", borderRadius: "16px 16px 24px 24px", width: "100%", textAlign: "center", borderTop: "none", boxShadow: `0 12px 28px rgba(0,0,0,0.2)` }}>
                      <div style={{ fontSize: 15, fontWeight: 800, color: "white", marginBottom: 6, textShadow: "0 2px 4px rgba(0,0,0,0.2)" }}>{item.nama}</div>
                      <div style={{ fontSize: 10, fontWeight: 700, color: "rgba(255,255,255,0.9)", textTransform: "uppercase", letterSpacing: ".06em" }}>{item.jabatan}</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* 5 Divisi */}
          <div style={{ marginTop: 8 }}>
            <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: ".14em", textTransform: "uppercase", color: "#2F8F4E", marginBottom: 20, background: "linear-gradient(90deg,transparent,#2F8F4E 50%,transparent)", backgroundSize: "100% 2px", backgroundPosition: "0 100%", backgroundRepeat: "no-repeat", paddingBottom: 12 }}>D. 5 Divisi Operasional (Garda Depan)</div>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(200px,1fr))", gap: 16 }}>
              {divisi.map((d, i) => (
                <div key={i} className={`div-card card-heroic d${i + 1}`} style={{ background: "linear-gradient(135deg,rgba(255,254,249,.95),rgba(232,245,238,.5))", border: "1.5px solid rgba(47,143,78,.15)", borderRadius: 16, padding: "24px", transition: "all .35s cubic-bezier(.22,1,.36,1)", cursor: "pointer", position: "relative", overflow: "hidden" }}
                  onMouseEnter={e => {
                    (e.currentTarget as HTMLElement).style.background = "linear-gradient(135deg,rgba(255,254,249,1),rgba(232,245,238,.7))";
                    (e.currentTarget as HTMLElement).style.transform = "translateY(-8px)";
                    (e.currentTarget as HTMLElement).style.boxShadow = "0 20px 60px rgba(47,143,78,.12)";
                    (e.currentTarget as HTMLElement).style.borderColor = "rgba(47,143,78,.3)";
                  }}
                  onMouseLeave={e => {
                    (e.currentTarget as HTMLElement).style.background = "linear-gradient(135deg,rgba(255,254,249,.95),rgba(232,245,238,.5))";
                    (e.currentTarget as HTMLElement).style.transform = "translateY(0)";
                    (e.currentTarget as HTMLElement).style.boxShadow = "0 0 0 transparent";
                    (e.currentTarget as HTMLElement).style.borderColor = "rgba(47,143,78,.15)";
                  }}
                >
                  <div style={{ fontSize: 36, marginBottom: 14, filter: "drop-shadow(0 4px 12px rgba(47,143,78,.1))" }}>{d.icon}</div>
                  <div style={{ fontSize: 13, fontWeight: 800, color: "#1C3A2B", marginBottom: 4, textTransform: "uppercase", letterSpacing: ".04em", background: `linear-gradient(135deg,#2F8F4E,#4FBF7E)`, backgroundClip: "text", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}>{d.nama}</div>
                  <div style={{ fontSize: 12, fontWeight: 600, color: "#5A4A40", marginBottom: 10, minHeight: 30 }}>{d.full}</div>
                  <div style={{ fontSize: 12, lineHeight: 1.6, color: "#5A4A40", marginBottom: 14, paddingBottom: 14, borderBottom: "1px solid rgba(47,143,78,.1)" }}>{d.tugas}</div>

                  {/* Ketua & Wakil (Nama saja) */}
                  <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                    <div style={{ fontSize: 10, fontWeight: 700, color: "#2F8F4E", textTransform: "uppercase", letterSpacing: ".05em" }}>👤 Ketua</div>
                    <div style={{ fontSize: 12, fontWeight: 600, color: "#1C3A2B", fontStyle: (pengurusDb.find(p => p.kategori === 'divisi' && p.jabatan.includes("Ketua") && p.jabatan.includes(d.nama))?.nama || d.ketua.nama).includes("—") ? "italic" : "normal", marginBottom: 8 }}>
                      {pengurusDb.find(p => p.kategori === 'divisi' && p.jabatan.includes("Ketua") && p.jabatan.includes(d.nama))?.nama || d.ketua.nama}
                    </div>

                    <div style={{ fontSize: 10, fontWeight: 700, color: "#2F8F4E", textTransform: "uppercase", letterSpacing: ".05em" }}>👤 Wakil</div>
                    <div style={{ fontSize: 12, fontWeight: 600, color: "#1C3A2B", fontStyle: (pengurusDb.find(p => p.kategori === 'divisi' && p.jabatan.includes("Wakil") && p.jabatan.includes(d.nama))?.nama || d.wakil.nama).includes("—") ? "italic" : "normal" }}>
                      {pengurusDb.find(p => p.kategori === 'divisi' && p.jabatan.includes("Wakil") && p.jabatan.includes(d.nama))?.nama || d.wakil.nama}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* TESTIMONI & BERITA SLIDER */}
      {testimoni.length > 0 && (
        <section className="sec" style={{ padding: "clamp(48px,8vw,104px) 0", background: "var(--fo)", overflow: "hidden" }}>
          <div style={{ maxWidth: 1320, margin: "0 auto", padding: "0 clamp(16px,4vw,32px)" }}>
            <div style={{ textAlign: "center", marginBottom: 50 }}>
              <div className="dl dlc" style={{ background: "var(--go)" }} />
              <h2 className="fnt" style={{ fontSize: "clamp(28px,5vw,48px)", fontWeight: 300, color: "var(--cw)", letterSpacing: "-.02em", marginBottom: 16 }}>Dukungan & Liputan</h2>
              <p className="fnt" style={{ color: "rgba(255,255,255,0.75)", fontSize: "clamp(16px, 2vw, 22px)", marginTop: 0, fontWeight: 300, fontStyle: "italic" }}>
                "Apa kata mereka tentang inisiatif Ciburial Eco-Digital."
              </p>
            </div>
          </div>

          <div style={{ display: "flex", gap: 24, padding: "0 clamp(16px,4vw,32px) 40px", overflowX: "auto", scrollSnapType: "x mandatory", WebkitOverflowScrolling: "touch" }} className="hide-scroll">
            {testimoni.map((t, i) => (
              <div key={t.id || i} style={{ scrollSnapAlign: "start", flex: "0 0 clamp(280px, 40vw, 400px)", background: "var(--cw)", border: "1.5px solid rgba(47,143,78,.1)", borderRadius: 20, padding: t.tipe === "berita" && t.foto ? "12px 12px 28px 12px" : "32px 28px", display: "flex", flexDirection: "column", gap: 14, boxShadow: "0 12px 32px rgba(0,0,0,0.1)", transition: "all .3s ease" }}
                onMouseEnter={e => { (e.currentTarget as HTMLElement).style.transform = "translateY(-6px)"; (e.currentTarget as HTMLElement).style.boxShadow = "0 20px 48px rgba(47,143,78,.15)"; }}
                onMouseLeave={e => { (e.currentTarget as HTMLElement).style.transform = "translateY(0)"; (e.currentTarget as HTMLElement).style.boxShadow = "0 12px 32px rgba(0,0,0,0.1)"; }}
              >

                {/* COVER BESAR KHUSUS BERITA */}
                {t.tipe === "berita" && t.foto && (
                  (t.foto.toLowerCase().includes(".mp4") || t.foto.toLowerCase().includes(".webm")) ? (
                    <video src={t.foto} controls playsInline style={{ width: "100%", height: 190, borderRadius: 14, objectFit: "cover", marginBottom: 4 }} />
                  ) : (
                    <img src={t.foto} alt={t.nama} style={{ width: "100%", height: 190, borderRadius: 14, objectFit: "cover", marginBottom: 4 }} />
                  )
                )}

                <div style={{ padding: t.tipe === "berita" && t.foto ? "0 16px" : 0, display: "flex", flexDirection: "column", gap: 14, flex: 1 }}>
                  {t.tipe === "tokoh" && <div style={{ fontSize: 32, lineHeight: 1, color: "var(--go)", opacity: 0.5 }}>&quot;</div>}
                  {t.tipe === "berita" && !t.foto && <div style={{ fontSize: 28, lineHeight: 1, color: "var(--go)", opacity: 0.5 }}>📰</div>}

                  <p className="fnt" style={{ fontSize: "clamp(15px, 2vw, 18px)", lineHeight: 1.75, color: "#1C3A2B", flex: 1, fontStyle: t.tipe === "tokoh" ? "italic" : "normal", fontWeight: 400 }}>
                    {t.tipe === "tokoh" ? `"${t.pesan}"` : t.pesan}
                  </p>

                  <div style={{ display: "flex", alignItems: "center", gap: 14, marginTop: 10, borderTop: "1px solid var(--bo)", paddingTop: 18 }}>
                    {/* AVATAR KECIL (Khusus Tokoh) */}
                    {t.tipe === "tokoh" && t.foto ? (
                      (t.foto.toLowerCase().includes(".mp4") || t.foto.toLowerCase().includes(".webm")) ? (
                        <video src={t.foto} autoPlay muted loop playsInline style={{ width: 44, height: 44, borderRadius: "50%", objectFit: "cover", flexShrink: 0 }} />
                      ) : (
                        <img src={t.foto} alt={t.nama} style={{ width: 44, height: 44, borderRadius: "50%", objectFit: "cover", flexShrink: 0 }} />
                      )
                    ) : (
                      <div style={{ width: 44, height: 44, borderRadius: "50%", background: "var(--cd)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 18 }}>
                        {t.tipe === "tokoh" ? "👤" : "🗞️"}
                      </div>
                    )}
                    <div>
                      <div style={{ fontSize: 16, fontWeight: 800, color: "#1C3A2B" }}>{t.nama}</div>
                      <div style={{ fontSize: 11, fontWeight: 700, color: "#2F8F4E", letterSpacing: ".05em", textTransform: "uppercase", marginTop: 2 }}>{t.jabatan}</div>
                    </div>
                    <span style={{ marginLeft: "auto", fontSize: 10, fontWeight: 700, padding: "4px 8px", background: t.tipe === "tokoh" ? "rgba(184,148,63,.1)" : "rgba(45,90,64,.1)", color: t.tipe === "tokoh" ? "#7A5A1E" : "#2D5A40", borderRadius: 6, textTransform: "uppercase" }}>
                      {t.tipe}
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>
          <style>{`
            .hide-scroll::-webkit-scrollbar { display: none; }
            .hide-scroll { -ms-overflow-style: none; scrollbar-width: none; }
          `}</style>
        </section>
      )}

      {/* DONASI SPLIT */}
      <section className="sec" style={{ padding: "0 clamp(16px,4vw,32px) clamp(48px,8vw,104px)" }}>
        <div style={{ maxWidth: 1320, margin: "0 auto" }}>
          <div style={{ borderRadius: 28, overflow: "hidden", display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(250px,1fr))" }}>
            <div style={{ background: "var(--fo)", padding: "60px 52px" }}>
              <div className="dl" />
              <h2 className="fnt" style={{ fontSize: 36, fontWeight: 300, color: "var(--cr)", lineHeight: 1.15, letterSpacing: "-.02em", marginBottom: 14 }}>Donasi<br />Kemakmuran<br />Kampung</h2>
              <p style={{ fontSize: 13, lineHeight: 1.85, color: "rgba(250,248,243,.5)", marginBottom: 28 }}>
                Target RAB Global <strong style={{ color: "var(--gl)" }}>Rp 250.000.000</strong>.<br />
                Dukung Balai Warga, Smart Farming, Learning Hub, Smart PJU, dan Internet Desa.
              </p>

              {/* PROGRESS BAR */}
              <div style={{ marginBottom: 28 }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 10 }}>
                  <span style={{ fontSize: 11, fontWeight: 700, letterSpacing: ".08em", textTransform: "uppercase", color: "rgba(250,248,243,.6)" }}>Progress Donasi</span>
                  <span style={{ fontSize: 12, fontWeight: 700, color: "var(--gl)" }}>{((saldo / 250000000) * 100).toFixed(1)}%</span>
                </div>
                <div style={{ width: "100%", height: 12, background: "rgba(255,255,255,.12)", borderRadius: 99, overflow: "hidden", boxShadow: "inset 0 1px 3px rgba(0,0,0,.2)" }}>
                  <div style={{ width: `${Math.min((saldo / 250000000) * 100, 100)}%`, height: "100%", background: "linear-gradient(90deg, #4FBF7E, var(--gl))", borderRadius: 99, transition: "width 1s cubic-bezier(.22,1,.36,1)", boxShadow: "0 0 12px rgba(79,191,126,.6)" }} />
                </div>
                <div style={{ fontSize: 10, color: "rgba(250,248,243,.45)", marginTop: 6 }}>
                  {((saldo / 1000000).toFixed(1))} dari 250 juta terkumpul
                </div>
              </div>

              <div style={{ display: "flex", flexDirection: "column", gap: 10, marginBottom: 24 }}>
                {[
                  { id: "midtrans", icon: "📱", l: "QRIS & E-Wallet", s: "Donasi Instan via Midtrans", detail: "Silakan klik untuk memulai donasi" },
                  { id: "bank", icon: "🏦", l: "Transfer Bank", s: "Rekening Resmi DKM", detail: "SeaBank: 90135555066\na.n Ubay Rahmat H" },
                  { id: "crypto", icon: "🌐", l: "Crypto / Web3", s: "EVM-Compatible Wallet", detail: "0x71723715478b344164e992b49ae1fCEb6467888B" }
                ].map((m, i) => (
                  <div key={i} onClick={(e) => {
                    if (m.id === "midtrans") {
                      bayarDonasi();
                    } else {
                      const rect = e.currentTarget.getBoundingClientRect();
                      // Posisikan di samping kanan untuk desktop, di bawah untuk mobile
                      const isMobile = window.innerWidth < 768;
                      if (isMobile) {
                        setPopoverPos({ top: rect.bottom + 10, left: rect.left });
                      } else {
                        setPopoverPos({ top: rect.top, left: rect.right + 20 });
                      }
                      setSelectedDonationMethod(m.id);
                    }
                  }} style={{ display: "flex", alignItems: "flex-start", gap: 12, padding: "14px 16px", background: "rgba(255,255,255,.08)", borderRadius: 12, border: "1px solid rgba(255,255,255,.12)", cursor: loadingDonasi && m.id === "midtrans" ? "wait" : "pointer", transition: "all .2s", opacity: m.id === "midtrans" && loadingDonasi ? 0.6 : 1, position: "relative" }}
                    onMouseEnter={e => {
                      e.currentTarget.style.background = "rgba(255,255,255,.15)";
                      e.currentTarget.style.transform = "translateX(4px)";
                    }}
                    onMouseLeave={e => {
                      e.currentTarget.style.background = "rgba(255,255,255,.08)";
                      e.currentTarget.style.transform = "translateX(0)";
                    }}
                  >
                    <span style={{ fontSize: 24, marginTop: 0 }}>{m.icon}</span>
                    <div style={{ display: "flex", flexDirection: "column", gap: 2, width: "100%" }}>
                      <div style={{ fontSize: 13, fontWeight: 700, color: "var(--cr)" }}>{m.l}</div>
                      <div style={{ fontSize: 11, color: "rgba(250,248,243,.55)" }}>{m.s}</div>
                      {m.id === "midtrans" && loadingDonasi && <div style={{ fontSize: 11, fontWeight: 600, color: "var(--gl)" }}>⏳ Memuat...</div>}
                    </div>
                  </div>
                ))}
              </div>
              <div style={{ display: "flex", gap: 14, flexWrap: "wrap", alignItems: "center" }}>
                <button onClick={() => onNavigate("transparansi")} style={{ padding: "11px 22px", borderRadius: 99, fontSize: 11, fontWeight: 700, letterSpacing: ".09em", textTransform: "uppercase", border: "1.5px solid rgba(79,191,126,.4)", background: "rgba(79,191,126,.15)", color: "var(--cr)", cursor: "pointer", transition: "all .2s" }}
                  onMouseEnter={e => { (e.currentTarget as HTMLButtonElement).style.background = "rgba(79,191,126,.25)"; (e.currentTarget as HTMLButtonElement).style.borderColor = "rgba(79,191,126,.6)"; }}
                  onMouseLeave={e => { (e.currentTarget as HTMLButtonElement).style.background = "rgba(79,191,126,.15)"; (e.currentTarget as HTMLButtonElement).style.borderColor = "rgba(79,191,126,.4)"; }}
                >
                  Lihat Transparansi Dana →
                </button>
              </div>
            </div>
            <div style={{ background: "linear-gradient(135deg,rgba(47,143,78,.05) 0%,rgba(79,191,126,.05) 100%)", padding: "60px 52px", display: "flex", flexDirection: "column", justifyContent: "center" }}>
              <div style={{ fontSize: 10, fontWeight: 700, letterSpacing: ".2em", textTransform: "uppercase", color: "#2F8F4E", marginBottom: 20 }}>Doa untuk Donatur</div>
              <p dir="rtl" className="fnt" style={{ fontSize: "clamp(18px,2.8vw,27px)", lineHeight: 1.9, color: "#1C3A2B", fontWeight: 400, marginBottom: 22 }}>
                رَبَّنَا آتِنَا فِي الدُّنْيَا حَسَنَةً وَفِي الْآخِرَةِ حَسَنَةً وَقِنَا عَذَابَ النَّارِ
              </p>
              <p style={{ fontSize: 13, fontStyle: "italic", lineHeight: 1.85, color: "#5A4A40", marginBottom: 14 }}>
                &quot;Ya Tuhan kami, berilah mereka kebaikan di dunia dan di akhirat, serta lindungilah dari siksa neraka.&quot;
              </p>
              <span style={{ fontSize: 10, fontWeight: 700, letterSpacing: ".1em", textTransform: "uppercase", color: "#2F8F4E", opacity: .65 }}>QS. Al-Baqarah: 201</span>
            </div>
          </div>
        </div>
      </section>

      {/* DONASI DETAIL POPOVER */}
      {selectedDonationMethod && (
        <div style={{ position: "fixed", top: 0, left: 0, right: 0, bottom: 0, zIndex: 9999, background: "transparent" }} onClick={() => setSelectedDonationMethod(null)}>
          <div style={{ 
            position: "fixed", 
            top: popoverPos.top, 
            left: popoverPos.left, 
            width: "min(320px, 90vw)", 
            background: "linear-gradient(135deg,rgba(255,254,249,1) 0%,rgba(232,245,238,1) 100%)", 
            borderRadius: 16, 
            border: "1.5px solid rgba(47,143,78,0.25)", 
            boxShadow: "0 12px 40px rgba(28,58,43,0.2)", 
            padding: "24px 20px", 
            animation: "slideIn .3s cubic-bezier(.22,1,.36,1)",
            zIndex: 10000 
          }} onClick={(e) => e.stopPropagation()}>
            
            {/* Close Button */}
            <button onClick={() => setSelectedDonationMethod(null)} style={{ position: "absolute", top: 8, right: 8, width: 24, height: 24, borderRadius: "50%", background: "rgba(47,143,78,.1)", border: "none", color: "#1C3A2B", fontSize: 14, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center" }}>✕</button>

            {/* Content */}
            {selectedDonationMethod === "bank" && (
              <div style={{ textAlign: "left" }}>
                <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 14 }}>
                  <span style={{ fontSize: 28 }}>🏦</span>
                  <h3 style={{ fontSize: 16, fontWeight: 700, color: "#1C3A2B" }}>Transfer Bank</h3>
                </div>
                
                <div style={{ background: "rgba(47,143,78,.08)", border: "1.5px solid rgba(47,143,78,.15)", borderRadius: 10, padding: 12, marginBottom: 12 }}>
                  <div style={{ fontSize: 9, fontWeight: 700, letterSpacing: ".1em", textTransform: "uppercase", color: "#2F8F4E", marginBottom: 4 }}>Nomor Rekening</div>
                  <div style={{ fontSize: 15, fontWeight: 800, color: "#1C3A2B", fontFamily: "monospace", letterSpacing: "1px" }}>90135555066</div>
                  <div style={{ fontSize: 9, fontWeight: 700, letterSpacing: ".08em", textTransform: "uppercase", color: "#5A4A40", marginTop: 8, marginBottom: 2 }}>Atas Nama</div>
                  <div style={{ fontSize: 12, fontWeight: 600, color: "#1C3A2B" }}>Ubay Rahmat H</div>
                </div>
                
                <div style={{ fontSize: 10, color: "#5A4A40", background: "rgba(184,148,63,.08)", border: "1px solid rgba(184,148,63,.15)", borderRadius: 8, padding: 8, lineHeight: 1.4 }}>
                  💡 SeaBank (901) • Transfer gratis
                </div>
              </div>
            )}

            {selectedDonationMethod === "crypto" && (
              <div style={{ textAlign: "left" }}>
                <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 14 }}>
                  <span style={{ fontSize: 28 }}>🌐</span>
                  <h3 style={{ fontSize: 16, fontWeight: 700, color: "#1C3A2B" }}>Crypto / Web3</h3>
                </div>
                
                <div style={{ background: "rgba(47,143,78,.08)", border: "1.5px solid rgba(47,143,78,.15)", borderRadius: 10, padding: 12, marginBottom: 12 }}>
                  <div style={{ fontSize: 9, fontWeight: 700, letterSpacing: ".1em", textTransform: "uppercase", color: "#2F8F4E", marginBottom: 4 }}>Wallet Address (EVM)</div>
                  <div style={{ fontSize: 11, fontWeight: 700, color: "#1C3A2B", fontFamily: "monospace", wordBreak: "break-all", lineHeight: 1.4, marginBottom: 10 }}>
                    0x71723715478b344164e992b49ae1fCEb6467888B
                  </div>
                  <button onClick={() => {
                    navigator.clipboard.writeText("0x71723715478b344164e992b49ae1fCEb6467888B");
                    alert("✓ Wallet address copied!");
                  }} style={{ width: "100%", padding: "8px 12px", background: "rgba(47,143,78,.15)", border: "1px solid rgba(47,143,78,.25)", borderRadius: 8, color: "#2F8F4E", fontWeight: 700, fontSize: 10, cursor: "pointer", transition: "all .2s" }}>
                    📋 Copy Address
                  </button>
                </div>
                
                <div style={{ fontSize: 10, color: "#5A4A40", background: "rgba(184,148,63,.08)", border: "1px solid rgba(184,148,63,.15)", borderRadius: 8, padding: 8, lineHeight: 1.4 }}>
                  💡 Ethereum, Polygon, BSC, ARB, OP
                </div>
              </div>
            )}
          </div>

          <style>{`
            @keyframes slideIn { from { transform: translateX(12px); opacity: 0; } to { transform: translateX(0); opacity: 1; } }
            @media (max-width: 768px) {
              @keyframes slideIn { from { transform: translateY(12px); opacity: 0; } to { transform: translateY(0); opacity: 1; } }
            }
          `}</style>
        </div>
      )}

      {/* STORY MODAL */}
      {showStory && (
        <div style={{ position: "fixed", inset: 0, zIndex: 9999, overflowY: "auto", background: "rgba(28,58,43,.7)", backdropFilter: "blur(12px)", padding: "clamp(40px,10vw,80px) 20px", animation: "storyFadeIn .3s ease", display: "block" }}>
          <div style={{ margin: "0 auto", flexShrink: 0, background: "linear-gradient(135deg,rgba(255,254,249,1) 0%,rgba(232,245,238,1) 100%)", borderRadius: 24, maxWidth: 640, width: "100%", border: "1px solid rgba(47,143,78,.2)", boxShadow: "0 24px 64px rgba(28,58,43,.3)", position: "relative", animation: "storySlideUp .4s cubic-bezier(.22,1,.36,1)" }}>

            {/* Header / Cover */}
            <div style={{ height: 160, background: "linear-gradient(135deg,#1C3A2B 0%,#2F8F4E 100%)", position: "relative", borderRadius: "24px 24px 0 0" }}>
              <div style={{ position: "absolute", top: 20, right: 20 }}>
                <button onClick={() => setShowStory(false)} style={{ width: 36, height: 36, borderRadius: "50%", background: "rgba(255,255,255,.2)", border: "none", color: "white", fontSize: 18, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", backdropFilter: "blur(4px)", transition: "background .2s" }} onMouseEnter={e => e.currentTarget.style.background = "rgba(255,255,255,.4)"} onMouseLeave={e => e.currentTarget.style.background = "rgba(255,255,255,.2)"}>✕</button>
              </div>
              <div style={{ position: "absolute", bottom: -40, left: 40, width: 80, height: 80, borderRadius: 20, background: "transparent", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 50, overflow: "hidden", border: "4px solid #FFFEF9", boxShadow: "0 8px 24px rgba(28,58,43,.15)" }}>
                <img src="/founder.png" alt="Ubay Rahmat H." style={{ width: "100%", height: "100%", objectFit: "cover", objectPosition: "top" }} onError={(e) => { e.currentTarget.style.display = 'none'; e.currentTarget.parentElement!.innerHTML = '<div style="width:100%;height:100%;background:#4FBF7E;display:flex;align-items:center;justify-content:center;color:white;font-size:40px;">👤</div>'; }} />
              </div>
            </div>

            {/* Body */}
            <div style={{ padding: "50px 40px 40px" }}>
              <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: ".15em", textTransform: "uppercase", color: "#2F8F4E", marginBottom: 8 }}>The Origin Story</div>
              <h3 className="fnt" style={{ fontSize: 32, fontWeight: 300, color: "#1C3A2B", lineHeight: 1.2, letterSpacing: "-.02em", marginBottom: 24 }}>Dari Pelosok Garut Menuju Masa Depan</h3>

              <div style={{ fontSize: 14, lineHeight: 1.8, color: "#5A4A40", display: "flex", flexDirection: "column", gap: 16 }}>
                <p>Semua berawal dari satu pertanyaan sederhana:<br />kenapa potensi lokal yang begitu besar justru tertinggal oleh perkembangan zaman?</p>
                <p>Kami tidak menunggu jawaban.<br />Kami mulai membangun.</p>
                <p><strong>Ciburial Eco-Digital</strong> hadir sebagai jembatan antara kearifan lokal dan teknologi modern—<br />membawa sistem yang transparan, terstruktur, dan berdampak nyata bagi masyarakat.</p>
                <p>Ini bukan sekadar inovasi.<br />Ini adalah langkah menuju transformasi.</p>
                <p>Kami percaya masa depan tidak hanya milik kota besar.<br />Masa depan bisa dibangun dari desa—oleh mereka yang berani memulai.</p>
                <div style={{ background: "linear-gradient(135deg,rgba(47,143,78,.08),rgba(47,143,78,.03))", padding: "16px 20px", borderRadius: 12, borderLeft: "3px solid #2F8F4E", fontStyle: "italic", fontWeight: 500, color: "#1C3A2B", marginTop: 8 }}>
                  &ldquo;Start small. Build real. Create impact.&rdquo;
                </div>
              </div>

              <div style={{ marginTop: 32, display: "flex", alignItems: "center", gap: 16, borderTop: "1px solid rgba(47,143,78,.1)", paddingTop: 24 }}>
                <div>
                  <div style={{ fontSize: 15, fontWeight: 800, color: "#1A1410" }}>Ubay Rahmat H.</div>
                  <div style={{ fontSize: 11, fontWeight: 700, color: "#2F8F4E", letterSpacing: ".05em", textTransform: "uppercase", marginTop: 2 }}>Founder & Builder</div>
                </div>
                <div style={{ marginLeft: "auto" }}>
                  <span className="fnt" style={{ fontSize: 32, color: "rgba(184,148,63,.4)", fontStyle: "italic", fontWeight: 200, letterSpacing: "-.02em" }}>Ciburial</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      <style>{`
        @keyframes storyFadeIn { from { opacity: 0 } to { opacity: 1 } }
        @keyframes storySlideUp { from { opacity: 0; transform: translateY(30px) scale(0.95); } to { opacity: 1; transform: translateY(0) scale(1); } }
      `}</style>
    </div>
  );
}
