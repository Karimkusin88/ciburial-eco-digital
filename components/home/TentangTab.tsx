"use client";
import dynamic from "next/dynamic";
import { TabType, Testimoni } from "./types";
import { useState, useEffect } from "react";
import { supabase, isSupabaseReady } from "@/lib/supabase";

const CuacaSholatWidget = dynamic(() => import("@/components/CuacaSholatWidget"), { ssr: false });
import CommunityDashboard from "@/components/home/CommunityDashboard";


interface TentangTabProps {
  onNavigate: (t: TabType) => void;
  testimoni?: Testimoni[];
  onPaymentSuccess?: (total: number, isMkt: boolean, orderId: string, payType: string) => void;
}

// ─── STRUKTUR ORGANISASI ─────────────────────────────────────────────────
const dwnPelindung = [
  { role: "Tokoh Agama", name: "— Hasil Musyawarah —", icon: "🕌" },
  { role: "Kepala Kewilayahan", name: "Bpk. Enang (Ketua RW)", icon: "🏘️" },
  { role: "Koordinator RT 01", name: "Sarip Hidayat", icon: "👤" },
  { role: "Koordinator RT 02", name: "Oneng", icon: "👤" },
  { role: "Koordinator RT 03", name: "Mumun", icon: "👤" },
];
const dwnPengawas = [
  { role: "Pengelola Dana DKM", name: "Bpk. Pupu Apipudin", icon: "🤲" },
];
const timEksekutif = [
  { role: "Ketua Pelaksana (PM)", name: "— Hasil Voting —", icon: "⚡" },
  { role: "Sekretaris", name: "— Hasil Voting —", icon: "📋" },
  { role: "Bendahara", name: "— Hasil Voting —", icon: "💰" },
];
const divisi = [
  { icon: "🏗️", nama: "Green Build", full: "Infrastruktur & Konstruksi Hijau", tugas: "Balai Serba Guna, Smart PJU, drainase resapan" },
  { icon: "💻", nama: "Digital Hub", full: "IT, Jaringan & Web3", tugas: "RT/RW Net, Learning Hub, Website, Crypto" },
  { icon: "🌾", nama: "Eco-Waste & Farming", full: "Smart Farming & Lingkungan", tugas: "Pertanian organik, peternakan, Bank Sampah" },
  { icon: "🛒", nama: "Local Commerce", full: "Ekonomi Kreatif & UMKM", tugas: "Pengrajin lokal, marketplace, quality control" },
  { icon: "📢", nama: "Public Relations", full: "Humas & Transparansi Publik", tugas: "Dokumentasi, laporan dana, komunikasi CSR" },
];

export default function TentangTab({ onNavigate, testimoni = [], onPaymentSuccess }: TentangTabProps) {
  const [loadingDonasi, setLoadingDonasi] = useState(false);
  const [totalJiwa, setTotalJiwa] = useState<number | null>(null);

  useEffect(() => {
    if (!isSupabaseReady()) return;
    (async () => {
      const [kkRes, angRes] = await Promise.all([
        supabase.from("keluarga").select("id", { count: "exact", head: true }),
        supabase.from("anggota_kk").select("id", { count: "exact", head: true }),
      ]);
      setTotalJiwa((kkRes.count || 0) + (angRes.count || 0));
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
          onSuccess: function(r:any){ 
            alert("Donasi sukses diterima! Dana langsung terdata di transparansi."); 
            if (onPaymentSuccess) onPaymentSuccess(qty, false, orderId, r.payment_type || "Midtrans");
          },
          onPending: function(r:any){ alert("Menunggu status pembayaran donasi."); },
          onError: function(r:any){ alert("Pembayaran gagal."); }
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

      {/* HERO */}
      <section className="hero-section" style={{ position: "relative", overflow: "hidden" }}>
        <div style={{ position: "absolute", top: 0, right: 0, width: "42%", height: "100%", background: "linear-gradient(135deg,var(--fo) 0%,var(--fm) 60%,var(--fl) 100%)", clipPath: "polygon(18% 0%,100% 0%,100% 100%,0% 100%)", opacity: .055, pointerEvents: "none" }} />
        <div style={{ position: "absolute", bottom: 0, left: 0, width: "100%", height: "35%", background: "linear-gradient(0deg,var(--cd) 0%,transparent 100%)", pointerEvents: "none" }} />

        <div className="hero-content">
          <div className="h1" style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 28 }}>
            <div style={{ width: 28, height: 1, background: "var(--go)", flexShrink: 0 }} />
            <span style={{ fontSize: 10, fontWeight: 700, letterSpacing: ".2em", textTransform: "uppercase", color: "var(--go)" }}>Kp. Ciburial, Garut — Est. 2026</span>
          </div>

          <div style={{ maxWidth: 1320, margin: "0 auto", width: "100%" }}>
            <div className="h2" style={{ marginBottom: 6 }}>
              <span style={{ fontSize: 12, fontWeight: 600, letterSpacing: ".14em", textTransform: "uppercase", color: "var(--em)" }}>Selamat Datang di</span>
            </div>
            <h1 className="fnt h3 hero-title" style={{ fontWeight: 300, lineHeight: .9, color: "var(--fo)", letterSpacing: "-.03em", marginBottom: 6 }}>Ciburial</h1>
            <h2 className="fnt h4 hero-sub" style={{ fontWeight: 600, fontStyle: "italic", color: "var(--go)", letterSpacing: "-.02em", marginBottom: 10 }}>Eco-Digital Village</h2>
            <div className="h5" style={{ marginBottom: 24 }}>
              <p className="fnt" style={{ fontSize: "clamp(13px,2vw,18px)", fontWeight: 300, fontStyle: "italic", color: "var(--em)", letterSpacing: ".02em" }}>
                Inovasi Desa Mandiri Berbasis Kearifan Lokal dan Teknologi Masa Depan
              </p>
            </div>
            <div className="h5" style={{ display: "flex", flexWrap: "wrap", gap: 10 }}>
              <p style={{ maxWidth: 480, fontSize: 15, fontWeight: 400, lineHeight: 1.8, color: "var(--ts)", marginBottom: 12 }}>
                Memutus rantai ketertinggalan dengan digitalisasi hasil bumi, ekosistem sirkular, dan generasi muda yang melek teknologi — tanpa meninggalkan identitas kampung halaman.
              </p>
              <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                {["🌱 Pertanian Organik", "🐄 Peternakan Modern", "🎋 Kerajinan Bambu", "💡 Smart PJU", "♻️ Eco-Waste", "📚 Learning Hub", "🏛️ Balai Warga"].map(tag => (
                  <span key={tag} style={{ padding: "6px 13px", fontSize: 11, fontWeight: 600, border: "1px solid var(--bo)", borderRadius: 99, color: "var(--ts)", background: "var(--cw)" }}>{tag}</span>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* MARQUEE */}
      <div style={{ background: "var(--fo)", overflow: "hidden", padding: "12px 0" }}>
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

      {/* STATS */}
      <section className="sec" style={{ background: "var(--cw)", padding: "clamp(40px,6vw,68px) clamp(16px,4vw,32px)" }}>
        <div style={{ maxWidth: 1320, margin: "0 auto", display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(130px,1fr))", gap: 2 }}>
          {[
            { v: totalJiwa !== null ? totalJiwa.toLocaleString() : "450", l: "Jiwa", s: "Total Populasi" },
            { v: "3", l: "RT", s: "Rukun Tetangga" },
            { v: "55%", l: "Pemuda/Pemudi", s: "Gen. Penerus" },
            { v: "5", l: "Divisi", s: "Tim Lapangan" },
            { v: "7", l: "Program", s: "Unggulan" },
            { v: "250jt", l: "Target", s: "RAB Global Tahun 2026" },
          ].map((s, i) => (
            <div key={i} className={`rv d${i + 1}`} style={{ padding: "40px 18px", textAlign: "center", borderRight: i < 5 ? "1px solid var(--bo)" : "none" }}>
              <div className="fnt" style={{ fontSize: "clamp(30px,4vw,56px)", fontWeight: 300, color: "var(--fo)", lineHeight: 1 }}>{s.v}</div>
              <div style={{ fontSize: 14, fontWeight: 600, color: "var(--ts)", marginTop: 4, marginBottom: 5 }}>{s.l}</div>
              <div style={{ fontSize: 9, fontWeight: 700, letterSpacing: ".12em", textTransform: "uppercase", color: "var(--tm)" }}>{s.s}</div>
            </div>
          ))}
        </div>
      </section>

      {/* DENYUT NADI — Live Community Dashboard */}
      <CommunityDashboard />

      {/* VISI MISI */}
      <section className="sec" style={{ padding: "clamp(48px,8vw,104px) clamp(16px,4vw,32px)", background: "var(--cr)" }}>
        <div className="visi-wrap" style={{ maxWidth: 1320, margin: "0 auto", display: "flex", flexWrap: "wrap", gap: 52, alignItems: "flex-start" }}>
          <div className="visi-left" style={{ flex: "0 0 270px" }}>
            <div className="dl" />
            <h2 className="fnt" style={{ fontSize: "clamp(30px,4vw,50px)", fontWeight: 300, color: "var(--fo)", lineHeight: 1.1, letterSpacing: "-.02em", marginBottom: 16 }}>Visi &<br />Misi Kami</h2>
            <p style={{ fontSize: 14, lineHeight: 1.8, color: "var(--ts)", marginBottom: 20 }}>
              Empat pilar yang menjadi cetak biru (<em>blueprint</em>) peradaban desa modern Ciburial — makmur, mandiri, tangguh, dan melek teknologi.
            </p>
          </div>
          <div style={{ flex: 1, minWidth: 250, display: "flex", flexDirection: "column", gap: 8 }}>
            {[
              { no: "01", icon: "💡", t: "Infrastruktur Cerdas", d: "Balai Serba Guna berkonsep hijau, Smart PJU, Jaringan CCTV, dan Internet Mandiri (Wi-Fi Kampung)." },
              { no: "02", icon: "📚", t: "SDM Unggul", d: "Laboratorium Komputer & Perpustakaan sebagai inkubator pemuda Ciburial yang melek teknologi." },
              { no: "03", icon: "🌱", t: "Ekonomi Sirkular & Smart Farming", d: "Pasar lokal untuk bambu, sayuran organik, peternakan terpadu, dan produk daur ulang limbah." },
              { no: "04", icon: "📊", t: "Tata Kelola Transparan", d: "Aliran dana kemakmuran terbuka secara real-time, dari fiat konvensional hingga aset kripto (Web3)." },
            ].map((v, i) => (
              <div key={i} className={`rv ch d${i + 1}`}
                style={{ padding: "22px 26px", background: "var(--cw)", borderRadius: 15, border: "1px solid var(--bo)", display: "flex", gap: 16, alignItems: "flex-start" }}
                onMouseEnter={e => (e.currentTarget.style.background = "var(--cd)")}
                onMouseLeave={e => (e.currentTarget.style.background = "var(--cw)")}
              >
                <span className="fnt" style={{ fontSize: 12, fontWeight: 700, color: "var(--go)", minWidth: 22, paddingTop: 2 }}>{v.no}</span>
                <span style={{ fontSize: 22 }}>{v.icon}</span>
                <div>
                  <div style={{ fontSize: 15, fontWeight: 700, color: "var(--tp)", marginBottom: 4 }}>{v.t}</div>
                  <div style={{ fontSize: 13, lineHeight: 1.7, color: "var(--ts)" }}>{v.d}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* DEMOGRAFI */}
      <section className="sec" style={{ padding: "clamp(48px,8vw,104px) clamp(16px,4vw,32px)", background: "var(--fo)" }}>
        <div style={{ maxWidth: 1320, margin: "0 auto" }}>
          <div style={{ textAlign: "center", marginBottom: 56 }}>
            <div className="dl dlc" />
            <h2 className="fnt" style={{ fontSize: "clamp(30px,5vw,54px)", fontWeight: 300, color: "var(--cr)", letterSpacing: "-.02em" }}>Keluarga Besar Ciburial</h2>
            <p style={{ color: "rgba(250,248,243,.45)", fontSize: 14, marginTop: 10, maxWidth: 400, margin: "10px auto 0" }}>Pemuda mendominasi komunitas dari total <strong>{totalJiwa !== null ? totalJiwa.toLocaleString() : "450"} jiwa</strong>. Mereka adalah modal utama quantum leap Ciburial.</p>
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(230px,1fr))", gap: 18 }}>
            {[{ l: "Pemuda/Pemudi (Penerus)", pct: 55, c: "var(--go)" }, { l: "Lansia (Sesepuh)", pct: 45, c: "rgba(250,248,243,.28)" }].map((item, i) => (
              <div key={i} className={`rv pgw d${i + 1}`} style={{ padding: "32px", background: "rgba(255,255,255,.05)", borderRadius: 18, border: "1px solid rgba(255,255,255,.08)" }}>
                <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 16 }}>
                  <span style={{ fontSize: 13, fontWeight: 600, color: "rgba(250,248,243,.62)" }}>{item.l}</span>
                  <span className="fnt" style={{ fontSize: 30, fontWeight: 300, color: "var(--cr)", lineHeight: 1 }}>{item.pct}%</span>
                </div>
                <div className="pg"><div className="pgf" style={{ background: item.c, width: `${item.pct}%` }} /></div>
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
          <div style={{ marginBottom: 12 }}>
            <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: ".14em", textTransform: "uppercase", color: "var(--go)", marginBottom: 14 }}>A. Dewan Pelindung & Penasihat</div>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill,minmax(130px,1fr))", gap: 12 }}>
              {dwnPelindung.map((item, i) => (
                <div key={i} className="ch" style={{ background: "var(--cw)", border: "1px solid var(--bo)", borderRadius: 16, padding: "18px 16px 14px", textAlign: "center" }}>
                  <div style={{ width: 44, height: 44, borderRadius: "50%", background: "var(--cd)", margin: "0 auto 10px", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 20, border: "2px solid var(--bo)" }}>{item.icon}</div>
                  <div style={{ fontSize: 13, fontWeight: 700, color: "var(--tp)", marginBottom: 3 }}>{item.name}</div>
                  <div style={{ fontSize: 9, fontWeight: 700, letterSpacing: ".09em", textTransform: "uppercase", color: "var(--go)" }}>{item.role}</div>
                </div>
              ))}
            </div>
          </div>

          {/* DKM + Tim Eksekutif */}
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(min(260px,100%),1fr))", gap: 14, marginBottom: 12 }}>
            <div className="d2" style={{ background: "var(--cw)", border: "1px solid var(--bo)", borderRadius: 20, padding: "28px" }}>
              <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: ".14em", textTransform: "uppercase", color: "var(--go)", marginBottom: 20 }}>B. Dewan Pengawas Kas</div>
              {dwnPengawas.map((item, i) => (
                <div key={i} style={{ display: "flex", alignItems: "center", gap: 12, padding: "14px", background: "var(--cd)", borderRadius: 12 }}>
                  <span style={{ fontSize: 24 }}>{item.icon}</span>
                  <div>
                    <div style={{ fontSize: 14, fontWeight: 700, color: "var(--tp)" }}>{item.name}</div>
                    <div style={{ fontSize: 10, fontWeight: 700, color: "var(--go)", textTransform: "uppercase", letterSpacing: ".07em" }}>{item.role}</div>
                  </div>
                </div>
              ))}
            </div>
            <div className="d3" style={{ background: "var(--cw)", border: "1px solid var(--bo)", borderRadius: 20, padding: "28px" }}>
              <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: ".14em", textTransform: "uppercase", color: "var(--go)", marginBottom: 20 }}>C. Tim Eksekutif Lapangan</div>
              <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                {timEksekutif.map((item, i) => (
                  <div key={i} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "11px 14px", background: "var(--cd)", borderRadius: 10 }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                      <span style={{ fontSize: 18 }}>{item.icon}</span>
                      <span style={{ fontSize: 13, fontWeight: 700, color: "var(--tp)", fontStyle: item.name.includes("—") ? "italic" : "normal" }}>{item.name}</span>
                    </div>
                    <span style={{ fontSize: 9, fontWeight: 700, color: "var(--tm)", textTransform: "uppercase", letterSpacing: ".07em", background: "var(--cw)", padding: "3px 9px", borderRadius: 99 }}>{item.role}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* 5 Divisi */}
          <div style={{ marginTop: 8 }}>
            <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: ".14em", textTransform: "uppercase", color: "var(--go)", marginBottom: 14 }}>D. 5 Divisi Operasional (Garda Depan)</div>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(190px,1fr))", gap: 12 }}>
              {divisi.map((d, i) => (
                <div key={i} className={`div-card d${i + 1}`} style={{ background: "var(--cw)", border: "1px solid var(--bo)", borderRadius: 16, padding: "20px 16px" }}>
                  <div style={{ fontSize: 28, marginBottom: 10 }}>{d.icon}</div>
                  <div style={{ fontSize: 12, fontWeight: 800, color: "var(--fo)", marginBottom: 3, textTransform: "uppercase", letterSpacing: ".04em" }}>{d.nama}</div>
                  <div style={{ fontSize: 11, fontWeight: 600, color: "var(--ts)", marginBottom: 8 }}>{d.full}</div>
                  <div style={{ fontSize: 11, lineHeight: 1.6, color: "var(--tm)" }}>{d.tugas}</div>
                  <div style={{ marginTop: 12, fontSize: 10, fontWeight: 700, color: "var(--tm)", fontStyle: "italic" }}>Kepala: — Hasil Voting —</div>
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
            <div style={{ textAlign: "center", marginBottom: 40 }}>
              <div className="dl dlc" style={{ background: "var(--go)" }} />
              <h2 className="fnt" style={{ fontSize: "clamp(26px,4vw,44px)", fontWeight: 300, color: "var(--cw)", letterSpacing: "-.02em" }}>Dukungan & Liputan</h2>
              <p style={{ color: "var(--ts)", fontSize: 13, marginTop: 10 }}>Apa kata mereka tentang inisiatif Ciburial Eco-Digital.</p>
            </div>
          </div>
          
          <div style={{ display: "flex", gap: 20, padding: "0 clamp(16px,4vw,32px) 20px", overflowX: "auto", scrollSnapType: "x mandatory", WebkitOverflowScrolling: "touch" }} className="hide-scroll">
            {testimoni.map((t, i) => (
              <div key={t.id || i} style={{ scrollSnapAlign: "start", flex: "0 0 clamp(280px, 40vw, 400px)", background: "var(--cw)", border: "1px solid var(--bo)", borderRadius: 20, padding: t.tipe === "berita" && t.foto ? "12px 12px 28px 12px" : 28, display: "flex", flexDirection: "column", gap: 14 }}>
                
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
                  
                  <p style={{ fontSize: 14, lineHeight: 1.7, color: "var(--ts)", flex: 1, fontStyle: t.tipe === "tokoh" ? "italic" : "normal" }}>
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
                      <div style={{ fontSize: 14, fontWeight: 700, color: "var(--tp)" }}>{t.nama}</div>
                      <div style={{ fontSize: 11, fontWeight: 600, color: "var(--go)", letterSpacing: ".04em", textTransform: "uppercase" }}>{t.jabatan}</div>
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

      {/* WIDGET CUACA & SHOLAT */}
      <section className="sec" style={{ padding: "clamp(32px,4vw,52px) clamp(16px,4vw,32px) 0" }}>
        <div style={{ maxWidth: 1320, margin: "0 auto" }}>
          <CuacaSholatWidget />
        </div>
      </section>

      {/* DONASI SPLIT */}
      <section className="sec" style={{ padding: "0 clamp(16px,4vw,32px) clamp(48px,8vw,104px)" }}>
        <div style={{ maxWidth: 1320, margin: "0 auto" }}>
          <div style={{ borderRadius: 28, overflow: "hidden", display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(250px,1fr))" }}>
            <div style={{ background: "var(--fo)", padding: "60px 52px" }}>
              <div className="dl" />
              <h2 className="fnt" style={{ fontSize: 36, fontWeight: 300, color: "var(--cr)", lineHeight: 1.15, letterSpacing: "-.02em", marginBottom: 14 }}>Donasi<br />Kemakmuran<br />Kampung</h2>
              <p style={{ fontSize: 13, lineHeight: 1.85, color: "rgba(250,248,243,.5)", marginBottom: 32 }}>
                Target RAB Global <strong style={{ color: "var(--gl)" }}>Rp 250.000.000</strong>.<br />
                Dukung Balai Warga, Smart Farming, Learning Hub, Smart PJU, dan Internet Desa.
              </p>
              <div style={{ display: "flex", flexDirection: "column", gap: 10, marginBottom: 22 }}>
                {[
                  { id: "midtrans", icon: "📱", l: "QRIS & E-Wallet", s: "Otomatis via Midtrans", rek: "Silakan Klik Kotak Ini Untuk Donasi Otomatis →" },
                  { id: "bank", icon: "🏦", l: "Transfer Bank", s: "Rekening Resmi DKM", rek: "SeaBank:90135555066 a.n Ubay Rahmat H" },
                  { id: "crypto", icon: "🌐", l: "Crypto / Web3", s: "EVM-Compatible Wallet", rek: "0x71723715478b344164e992b49ae1fCEb6467888B" }
                ].map((m, i) => (
                  <div key={i} onClick={m.id === "midtrans" ? bayarDonasi : undefined} style={{ display: "flex", alignItems: "flex-start", gap: 14, padding: "13px 18px", background: "rgba(255,255,255,.06)", borderRadius: 12, border: "1px solid rgba(255,255,255,.09)", cursor: m.id === "midtrans" ? (loadingDonasi ? "wait" : "pointer") : "default", transition: "background .2s", opacity: m.id === "midtrans" && loadingDonasi ? 0.6 : 1 }}
                    onMouseEnter={e => m.id === "midtrans" ? (e.currentTarget.style.background = "rgba(255,255,255,.11)") : undefined}
                    onMouseLeave={e => m.id === "midtrans" ? (e.currentTarget.style.background = "rgba(255,255,255,.06)") : undefined}
                  >
                    <span style={{ fontSize: 22, marginTop: 2 }}>{m.icon}</span>
                    <div style={{ display: "flex", flexDirection: "column", gap: 2, width: "100%" }}>
                      <div style={{ fontSize: 13, fontWeight: 700, color: "var(--cr)" }}>{m.l}</div>
                      <div style={{ fontSize: 11, color: "rgba(250,248,243,.38)" }}>{m.s}</div>
                      <div style={{ fontSize: 12, fontWeight: 700, color: "var(--gl)", letterSpacing: "0.5px", marginTop: 2 }}>{m.id === "midtrans" && loadingDonasi ? "⏳ MEMUAT MIDTRANS..." : m.rek}</div>
                    </div>
                  </div>
                ))}
              </div>
              <div style={{ display: "flex", gap: 14, flexWrap: "wrap", alignItems: "center" }}>
                <button onClick={() => onNavigate("transparansi")} style={{ padding: "10px 20px", borderRadius: 99, fontSize: 11, fontWeight: 700, letterSpacing: ".09em", textTransform: "uppercase", border: "1px solid rgba(255,255,255,.18)", background: "transparent", color: "rgba(250,248,243,.55)", cursor: "pointer", transition: "all .2s" }}
                  onMouseEnter={e => { (e.currentTarget as HTMLButtonElement).style.background = "rgba(255,255,255,.08)"; (e.currentTarget as HTMLButtonElement).style.color = "var(--cr)"; }}
                  onMouseLeave={e => { (e.currentTarget as HTMLButtonElement).style.background = "transparent"; (e.currentTarget as HTMLButtonElement).style.color = "rgba(250,248,243,.55)"; }}
                >
                  Lihat Transparansi Dana →
                </button>
              </div>
            </div>
            <div style={{ background: "var(--ea)", padding: "60px 52px", display: "flex", flexDirection: "column", justifyContent: "center" }}>
              <div style={{ fontSize: 10, fontWeight: 700, letterSpacing: ".2em", textTransform: "uppercase", color: "var(--go)", marginBottom: 20 }}>Doa untuk Donatur</div>
              <p dir="rtl" className="fnt" style={{ fontSize: "clamp(18px,2.8vw,27px)", lineHeight: 1.9, color: "var(--cr)", fontWeight: 400, marginBottom: 22 }}>
                رَبَّنَا آتِنَا فِي الدُّنْيَا حَسَنَةً وَفِي الْآخِرَةِ حَسَنَةً وَقِنَا عَذَابَ النَّارِ
              </p>
              <p style={{ fontSize: 13, fontStyle: "italic", lineHeight: 1.85, color: "rgba(250,248,243,.48)", marginBottom: 14 }}>
                &quot;Ya Tuhan kami, berilah mereka kebaikan di dunia dan di akhirat, serta lindungilah dari siksa neraka.&quot;
              </p>
              <span style={{ fontSize: 10, fontWeight: 700, letterSpacing: ".1em", textTransform: "uppercase", color: "var(--gl)", opacity: .65 }}>QS. Al-Baqarah: 201</span>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
