"use client";
import { TabType } from "./types";
import { useState, useEffect } from "react";
import { supabase, isSupabaseReady } from "@/lib/supabase";
import CommunityDashboard from "@/components/home/CommunityDashboard";

interface TentangTabProps {
  onNavigate: (t: TabType) => void;
  onPaymentSuccess?: (total: number, isMkt: boolean, orderId: string, payType: string) => void;
  totMasuk: number;
  totTarget: number;
}

export default function TentangTab({ onNavigate, onPaymentSuccess, totMasuk, totTarget }: TentangTabProps) {
  const [loadingDonasi, setLoadingDonasi] = useState(false);
  const [totalJiwa, setTotalJiwa] = useState<number | null>(null);
  const [totalKg, setTotalKg] = useState<number>(0);

  useEffect(() => {
    if (!isSupabaseReady()) return;
    (async () => {
      const angRes = await supabase.from("anggota_kk").select("id", { count: "exact", head: true });
      setTotalJiwa(angRes.count || 0);

      const spRes = await supabase.from("saldo_poin").select("total_setor_kg");
      const tot = (spRes.data || []).reduce((s, x) => s + Number(x.total_setor_kg), 0);
      setTotalKg(tot);
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
        alert("Server Midtrans belum nyambung! Cek .env di Vercel.");
      }
    } catch (e) { alert("Error."); }
    setLoadingDonasi(false);
  };

  return (
    <div className="pi">
      {/* SECTION 1 — HERO (Compact) */}
      <section className="hero-section" style={{ 
        position: "relative", 
        minHeight: "85vh", 
        display: "flex", 
        alignItems: "center", 
        justifyContent: "center",
        background: "linear-gradient(180deg, rgba(27,67,50,0.03) 0%, rgba(149,213,178,0.05) 100%), url('https://www.transparenttextures.com/patterns/natural-paper.png')"
      }}>
        <div className="hero-content" style={{ textAlign: "center", maxWidth: 900 }}>
          <h1 className="fnt h3" style={{ 
            fontSize: "clamp(48px, 10vw, 110px)", 
            fontWeight: 200, 
            color: "#1B4332", 
            lineHeight: 0.9, 
            marginBottom: 20 
          }}>
            Ciburial<br/>
            <span style={{ fontWeight: 500, fontStyle: "italic", color: "#2F8F4E" }}>Eco-Digital Village</span>
          </h1>
          <p className="h5" style={{ 
            fontSize: "clamp(16px, 2.5vw, 22px)", 
            color: "#5A4A40", 
            maxWidth: 700, 
            margin: "0 auto 40px",
            lineHeight: 1.6
          }}>
            Inovasi Desa Mandiri Berbasis Kearifan Lokal dan Teknologi Masa Depan untuk Indonesia Berdaya.
          </p>
          
          <div className="h5" style={{ display: "flex", gap: 14, justifyContent: "center", flexWrap: "wrap" }}>
            <button className="btn-heroic" onClick={() => document.getElementById("smart-hub")?.scrollIntoView({ behavior: "smooth" })}>
              🏠 Akses Layanan
            </button>
            <button className="btn-heroic" style={{ background: "#95D5B2", color: "#1B4332" }} onClick={() => onNavigate("proposal")}>
              📋 Lihat Proposal
            </button>
            <button className="btn-heroic" style={{ background: "white", color: "#1B4332", border: "1.5px solid #1B4332" }} onClick={() => document.getElementById("donasi")?.scrollIntoView({ behavior: "smooth" })}>
              💚 Dukung Kami
            </button>
          </div>
        </div>

        <div style={{ position: "absolute", bottom: 40, left: "50%", transform: "translateX(-50%)", opacity: 0.5 }}>
          <div style={{ animation: "bounce 2s infinite", fontSize: 24 }}>↓</div>
        </div>
      </section>

      {/* SECTION 2 — LIVE STATS "Denyut Nadi" */}
      <CommunityDashboard />

      {/* SECTION 3 — LAYANAN WARGA (Smart Hub) */}
      <section id="smart-hub" className="sec" style={{ background: "white" }}>
        <div style={{ maxWidth: 1200, margin: "0 auto" }}>
          <div style={{ textAlign: "center", marginBottom: 48 }}>
            <h2 className="fnt" style={{ fontSize: "clamp(32px, 5vw, 48px)", color: "#1B4332" }}>Ciburial Smart Hub</h2>
            <p style={{ color: "#5A4A40", fontWeight: 500 }}>Akses semua layanan digital warga dalam satu genggaman.</p>
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))", gap: 24 }}>
            {[
              { title: "E-Voting", icon: "🗳️", link: "/voting", label: "Aktif" },
              { title: "Posyandu", icon: "👶", link: "/posyandu", label: "Aktif" },
              { title: "Ronda", icon: "🔦", link: "/ronda", label: "Aktif" },
              { title: "Zakat", icon: "🕌", link: "/zakat", label: "Aktif" },
              { title: "Aduan", icon: "📢", link: "/pengaduan", label: "Aktif" },
              { title: "Marketplace", icon: "🛒", link: "", label: "Coming Soon" },
            ].map((item, i) => (
              <a key={i} href={item.link || "#"} style={{ textDecoration: "none", pointerEvents: item.link ? "auto" : "none" }}>
                <div className="card-heroic ch" style={{ 
                  padding: "32px", 
                  background: item.link ? "white" : "#F0F4F2",
                  border: "1.5px solid rgba(27,67,50,0.06)",
                  display: "flex",
                  alignItems: "center",
                  gap: 20
                }}>
                  <div style={{ fontSize: 36 }}>{item.icon}</div>
                  <div>
                    <h3 style={{ fontSize: 18, fontWeight: 800, color: "#1B4332", margin: 0 }}>{item.title}</h3>
                    <span style={{ 
                      fontSize: 10, 
                      fontWeight: 700, 
                      color: item.link ? "#2F8F4E" : "#9A8C85",
                      textTransform: "uppercase",
                      letterSpacing: "0.05em"
                    }}>{item.label}</span>
                  </div>
                </div>
              </a>
            ))}
          </div>
        </div>
      </section>

      {/* SECTION 4 — VISI & 4 PILAR */}
      <section className="sec" style={{ background: "linear-gradient(135deg, #FAF8F3 0%, #F0EDE5 100%)" }}>
        <div style={{ maxWidth: 1200, margin: "0 auto", display: "flex", flexWrap: "wrap", gap: 60 }}>
          <div style={{ flex: "1 1 400px" }}>
            <div className="dl" style={{ background: "#2F8F4E" }} />
            <h2 className="fnt" style={{ fontSize: "clamp(36px, 5vw, 54px)", color: "#1B4332", lineHeight: 1.1, marginBottom: 24 }}>
              Cetak Biru<br/>Masa Depan Desa
            </h2>
            <p style={{ color: "#5A4A40", lineHeight: 1.8, marginBottom: 32 }}>
              Empat pilar utama yang mendasari transformasi Ciburial menjadi desa mandiri, hijau, dan melek teknologi.
            </p>
            <button className="btn-heroic" style={{ background: "#1B4332" }} onClick={() => onNavigate("proposal")}>
              Lihat Proposal Lengkap →
            </button>
          </div>
          <div style={{ flex: "1 1 500px", display: "grid", gridTemplateColumns: "1fr 1fr", gap: 20 }}>
            {[
              { t: "Infrastruktur", d: "PJU Pintar & WiFi Kampung", i: "💡" },
              { t: "SDM Unggul", d: "Learning Hub & Lab Komputer", i: "📚" },
              { t: "Eco-Farming", d: "Bank Sampah & Tani Organik", i: "🌱" },
              { t: "Digital Govt", d: "E-Voting & Transparansi", i: "📊" },
            ].map((p, i) => (
              <div key={i} className="card-heroic" style={{ padding: "24px", background: "white" }}>
                <div style={{ fontSize: 32, marginBottom: 12 }}>{p.i}</div>
                <h4 style={{ fontSize: 16, fontWeight: 800, color: "#1B4332", marginBottom: 4 }}>{p.t}</h4>
                <p style={{ fontSize: 13, color: "#5A4A40", margin: 0 }}>{p.d}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* SECTION 5 — SOCIAL PROOF */}
      <section className="sec" style={{ background: "white", borderBottom: "1px solid #E5E0D8" }}>
        <div style={{ maxWidth: 1000, margin: "0 auto", textAlign: "center" }}>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: 40 }}>
            {[
              { val: totalJiwa || "450", label: "Jiwa Terdampak", sub: "Data Warga Real-time" },
              { val: `${totalKg.toFixed(0)} kg`, label: "Sampah Terkelola", sub: "Ekosistem Sirkular" },
              { val: "5+", label: "Layanan Digital", sub: "Smart Hub Aktif" },
              { val: "2026", label: "Est. Inovasi", sub: "Berawal dari Ciburial" },
            ].map((stat, i) => (
              <div key={i}>
                <div className="fnt" style={{ fontSize: 48, color: "#2F8F4E", fontWeight: 600 }}>{stat.val}</div>
                <div style={{ fontSize: 14, fontWeight: 800, color: "#1B4332", marginTop: 8 }}>{stat.label}</div>
                <div style={{ fontSize: 12, color: "#9A8C85", marginTop: 4 }}>{stat.sub}</div>
              </div>
            ))}
          </div>
          
          <div style={{ marginTop: 60, opacity: 0.6, display: "flex", justifyContent: "center", gap: 32, filter: "grayscale(1)" }}>
            <span style={{ fontWeight: 800, color: "#1B4332" }}>KEC. BUNGBULANG</span>
            <span style={{ fontWeight: 800, color: "#1B4332" }}>KAB. GARUT</span>
            <span style={{ fontWeight: 800, color: "#1B4332" }}>RW 08 CIBURIAL</span>
          </div>
        </div>
      </section>

      {/* SECTION 6 — DONASI (Unified) */}
      <section id="donasi" className="sec" style={{ background: "#1B4332", color: "white" }}>
        <div style={{ maxWidth: 800, margin: "0 auto", textAlign: "center" }}>
          <h2 className="fnt" style={{ fontSize: "clamp(36px, 5vw, 54px)", marginBottom: 16 }}>Dukung Kemakmuran Desa</h2>
          <p style={{ color: "#95D5B2", fontSize: 16, marginBottom: 40, maxWidth: 600, margin: "0 auto 40px" }}>
            Kontribusi Anda digunakan untuk pembangunan Balai Serba Guna, Smart PJU, dan pemberdayaan ekonomi warga Ciburial.
          </p>

          <div style={{ background: "rgba(255,255,255,0.05)", padding: "40px", borderRadius: 24, border: "1px solid rgba(255,255,255,0.1)" }}>
            <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 12, fontSize: 14 }}>
              <span>Target: Rp {totTarget.toLocaleString("id-ID")}</span>
              <span style={{ color: "#95D5B2", fontWeight: 800 }}>Terkumpul: Rp {totMasuk.toLocaleString("id-ID")}</span>
            </div>
            <div style={{ background: "rgba(255,255,255,0.1)", borderRadius: 99, height: 12, overflow: "hidden", marginBottom: 40 }}>
              <div style={{ width: `${Math.min(100, Math.round((totMasuk / totTarget) * 100))}%`, background: "#95D5B2", height: "100%", borderRadius: 99 }} />
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: 16 }}>
              <button onClick={bayarDonasi} className="btn-heroic" style={{ background: "#2F8F4E", border: "none" }}>
                📱 QRIS / E-Wallet
              </button>
              <button className="btn-heroic" style={{ background: "transparent", border: "1.5px solid white" }}>
                🏦 Transfer Bank
              </button>
              <button className="btn-heroic" style={{ background: "rgba(255,255,255,0.1)", border: "none", opacity: 0.6 }}>
                🌐 Crypto / Web3
              </button>
            </div>
            
            <button onClick={() => onNavigate("transparansi")} style={{ marginTop: 32, background: "none", border: "none", color: "#95D5B2", fontWeight: 700, cursor: "pointer", fontSize: 13 }}>
              Lihat Transparansi Dana →
            </button>
          </div>
        </div>
      </section>

      <style>{`
        @keyframes bounce { 0%, 100% { transform: translateY(0); } 50% { transform: translateY(-10px); } }
      `}</style>
    </div>
  );
}
