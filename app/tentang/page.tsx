"use client";
import { useState, useEffect, ReactNode } from "react";
import { Landmark, Home, User, HandHeart, Zap, FileText, Coins, Building, Monitor, Wheat, ShoppingCart, Megaphone, Lightbulb, BookOpen, Sprout, BarChart2, Wrench } from "lucide-react";
import { supabase, isSupabaseReady } from "@/lib/supabase";

// ─── STRUKTUR ORGANISASI ─────────────────────────────────────────────────
const dwnPelindung = [
  { role: "Tokoh Agama", name: "— Hasil Musyawarah —", icon: <Landmark size={20} />, foto: "/uploads/pengurus/dewan/tokoh-agama.jpg" },
  { role: "Kepala Kewilayahan", name: "Bpk. Enang (Ketua RW)", icon: <Home size={20} />, foto: "/uploads/pengurus/dewan/kepala-kewilayahan.jpg" },
  { role: "Koordinator RT 01", name: "Sarip Hidayat", icon: <User size={20} />, foto: "/uploads/pengurus/dewan/rt01.jpg" },
  { role: "Koordinator RT 02", name: "Oneng", icon: <User size={20} />, foto: "/uploads/pengurus/dewan/rt02.jpg" },
  { role: "Koordinator RT 03", name: "Mumun", icon: <User size={20} />, foto: "/uploads/pengurus/dewan/rt03.jpg" },
];
const dwnPengawas = [
  { role: "Pengelola Dana DKM", name: "Bpk. Pupu Apipudin", icon: <HandHeart size={20} />, foto: "/uploads/pengurus/dewan/kas-dkm.jpg" },
];
const timEksekutif = [
  { role: "Ketua Pelaksana (PM)", name: "— Hasil Voting —", icon: <Zap size={20} />, foto: "/uploads/pengurus/tim-eksekutif/ketua-pm.jpg" },
  { role: "Sekretaris", name: "— Hasil Voting —", icon: <FileText size={20} />, foto: "/uploads/pengurus/tim-eksekutif/sekretaris.jpg" },
  { role: "Bendahara", name: "— Hasil Voting —", icon: <Coins size={20} />, foto: "/uploads/pengurus/tim-eksekutif/bendahara.jpg" },
];
const divisi = [
  {
    icon: <HandHeart size={20} />, nama: "Syiar & Sosial", full: "Keagamaan & Dana Sosial", tugas: "Pengajian, PHBI, tanggap bencana, & santunan",
    ketua: { nama: "— Hasil Voting —" }, wakil: { nama: "— Hasil Voting —" }
  },
  {
    icon: <Building size={20} />, nama: "Infrastruktur & Lingkungan", full: "Konstruksi Hijau & Maintenance", tugas: "Balai Serba Guna, Smart PJU, drainase, & aset",
    ketua: { nama: "— Hasil Voting —" }, wakil: { nama: "— Hasil Voting —" }
  },
  {
    icon: <Wheat size={20} />, nama: "Ekonomi Terapan", full: "Smart Farming & UMKM", tugas: "Pertanian organik, Bank Sampah, & marketplace",
    ketua: { nama: "— Hasil Voting —" }, wakil: { nama: "— Hasil Voting —" }
  },
  {
    icon: <Monitor size={20} />, nama: "Digital & Humas", full: "IT, Media, & Publikasi", tugas: "Website, RT/RW Net, laporan dana, & CSR",
    ketua: { nama: "— Hasil Voting —" }, wakil: { nama: "— Hasil Voting —" }
  },
];

export default function TentangPage() {
  const [pengurusDb, setPengurusDb] = useState<any[]>([]);

  useEffect(() => {
    if (!isSupabaseReady()) return;
    (async () => {
      try {
        const pgRes = await supabase.from("pengurus_desa").select("*").order("urutan", { ascending: true });
        if (pgRes.data && pgRes.data.length > 0) {
          setPengurusDb(pgRes.data);
        }
      } catch (e) {
        // Abaikan jika tabel belum ada
      }
    })();
  }, []);

  return (
    <main style={{ minHeight: "100dvh", background: "var(--cr)", paddingBottom: "clamp(30px, 6vw, 60px)" }}>
      {/* HEADER PAGE */}
      <header style={{ background: "var(--fo)", padding: "clamp(40px,6vw,60px) 20px clamp(40px, 8vw, 80px)", textAlign: "center", position: "relative", overflow: "hidden" }}>
        <div style={{ position: "absolute", top: 0, left: 0, right: 0, bottom: 0, opacity: 0.05, backgroundImage: "radial-gradient(circle at 2px 2px, rgba(255,255,255,1) 1px, transparent 0)", backgroundSize: "24px 24px" }} />
        <div style={{ position: "relative", zIndex: 1 }}>
          <h1 className="fnt" style={{ fontSize: "clamp(32px, 5vw, 48px)", fontWeight: 300, color: "var(--cw)", letterSpacing: "-.02em", marginBottom: 12 }}>Tentang Kami</h1>
          <p style={{ color: "rgba(255,255,255,0.7)", fontSize: "clamp(15px, 2vw, 17px)", maxWidth: 500, margin: "0 auto", lineHeight: 1.6 }}>
            Profil, visi misi, dan struktur kepengurusan Ciburial Eco-Digital Village.
          </p>
        </div>
      </header>

      {/* VISI MISI - HEROIC */}
      <section className="sec visi-section" style={{ padding: "clamp(40px,8vw,100px) clamp(16px,4vw,32px)", background: "linear-gradient(135deg,rgba(250,248,243,.5) 0%,rgba(255,254,249,.8) 100%)" }}>
        <div className="visi-wrap" style={{ maxWidth: 1320, margin: "0 auto", display: "flex", flexWrap: "wrap", gap: "clamp(20px, 4vw, 64px)", alignItems: "flex-start" }}>
          <div className="visi-left" style={{ flex: "1 1 280px", minWidth: 240 }}>
            <div className="dl" />
            <h2 className="fnt" style={{ fontSize: "clamp(24px,4vw,48px)", fontWeight: 300, background: "linear-gradient(135deg,#1C3A2B,#2F8F4E)", backgroundClip: "text", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent", lineHeight: 1.1, letterSpacing: "-.03em", marginBottom: "clamp(12px, 3vw, 20px)" }}>Visi &<br />Misi Kami</h2>
            <p style={{ fontSize: "clamp(11px, 2.8vw, 14px)", lineHeight: 1.7, color: "#5A4A40", marginBottom: "clamp(16px, 4vw, 24px)", fontWeight: 500 }}>
              Empat pilar yang menjadi cetak biru (<em>blueprint</em>) peradaban desa modern Ciburial — <strong style={{ color: "#2F8F4E" }}>makmur, mandiri, tangguh</strong>, dan melek teknologi.
            </p>
            <a href="/?tab=proposal" style={{ display: "inline-flex", alignItems: "center", gap: 6, fontSize: "clamp(11px, 2.8vw, 13px)", fontWeight: 600, color: "#2F8F4E", textDecoration: "none", padding: "clamp(8px, 2vw, 10px) clamp(12px, 3vw, 16px)", borderRadius: 8, background: "rgba(47,143,78,.08)", border: "1px solid rgba(47,143,78,.2)", transition: "all .3s ease", cursor: "pointer" }}
              onMouseEnter={e => {
                (e.currentTarget as HTMLElement).style.background = "rgba(47,143,78,.15)";
                (e.currentTarget as HTMLElement).style.transform = "translateX(4px)";
              }}
              onMouseLeave={e => {
                (e.currentTarget as HTMLElement).style.background = "rgba(47,143,78,.08)";
                (e.currentTarget as HTMLElement).style.transform = "translateX(0)";
              }}>
              Lihat Proposal Lengkap <span style={{ fontSize: 14 }}>→</span>
            </a>
          </div>
          <div className="visi-cards" style={{ flex: 1, minWidth: 240, display: "flex", flexDirection: "column", gap: "clamp(8px, 2vw, 14px)" }}>
            {[
              { no: "01", icon: "", t: "Syiar Digital & Kemakmuran Masjid", d: "Menjadikan Masjid Al Husain sebagai pusat ibadah, sosial, dan pergerakan pemuda yang berdaya guna melalui sentuhan teknologi tepat guna." },
              { no: "02", icon: "", t: "SDM Unggul", d: "Laboratorium Komputer & Perpustakaan sebagai inkubator pemuda Ciburial yang melek teknologi." },
              { no: "03", icon: "", t: "Ekonomi Sirkular & Smart Farming", d: "Pasar lokal untuk bambu, sayuran organik, peternakan terpadu, dan produk daur ulang limbah." },
              { no: "04", icon: "", t: "Tata Kelola Transparan", d: "Aliran dana umat dan kas swadaya yang terbuka secara real-time melalui dasbor digital desa terintegrasi." },
            ].map((v, i) => (
              <div key={i} className={`rv ch d${i + 1} visi-card`}
                style={{ padding: "clamp(14px, 3.5vw, 24px) clamp(16px, 4vw, 28px)", background: "linear-gradient(135deg,rgba(255,254,249,.9),rgba(232,245,238,.6))", borderRadius: "clamp(10px, 2.5vw, 16px)", border: "1.5px solid rgba(47,143,78,.15)", display: "flex", gap: "clamp(10px, 2.5vw, 18px)", alignItems: "flex-start", transition: "all .35s cubic-bezier(.22,1,.36,1)", cursor: "pointer" }}
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
                <span className="fnt" style={{ fontSize: "clamp(11px, 2.8vw, 13px)", fontWeight: 700, color: "#2F8F4E", minWidth: "clamp(20px, 5vw, 28px)", paddingTop: 2 }}>{v.no}</span>
                <span style={{ fontSize: "clamp(20px, 5vw, 28px)" }}>{v.icon}</span>
                <div>
                  <div style={{ fontSize: "clamp(12px, 3.2vw, 16px)", fontWeight: 700, color: "#1C3A2B", marginBottom: "clamp(4px, 1vw, 6px)" }}>{v.t}</div>
                  <div style={{ fontSize: "clamp(10px, 2.8vw, 13px)", lineHeight: 1.6, color: "#5A4A40", fontWeight: 500 }}>{v.d}</div>
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
          <div style={{ marginBottom: 40 }}>
            <div style={{ fontSize: "clamp(10px, 2.5vw, 13px)", fontWeight: 800, letterSpacing: ".14em", textTransform: "uppercase", color: "var(--go)", marginBottom: 16, textAlign: "center" }}>A. Dewan Pelindung & Penasihat</div>
            <div style={{ display: "flex", flexWrap: "wrap", gap: "clamp(10px, 2.5vw, 32px)", justifyContent: "center" }} className="pengurus-grid">
              {(pengurusDb.filter(p => p.kategori === 'pelindung').length > 0 ? pengurusDb.filter(p => p.kategori === 'pelindung') : dwnPelindung.map((p, i) => ({ ...p, jabatan: p.role, nama: p.name, id: `p-${i}` }))).map((item: any, i) => (
                <div key={item.id} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', marginTop: "clamp(30px, 8vw, 50px)", position: 'relative', width: "clamp(100px, 28vw, 220px)", minWidth: 100, animation: `float-heroic 6s ease-in-out infinite ${(i * 0.2).toFixed(1)}s` }}>
                  <div style={{ width: "clamp(60px, 18vw, 140px)", height: "clamp(60px, 18vw, 140px)", borderRadius: "clamp(14px, 4vw, 28px)", padding: 3, background: "var(--cw)", border: `2px solid var(--go)`, zIndex: 2, position: "relative", marginBottom: "clamp(-24px, -6vw, -40px)", boxShadow: `0 12px 24px rgba(184,148,63,.25)`, overflow: "hidden" }}>
                    {item.foto ? (
                      <img src={item.foto} alt={item.nama} style={{ width: "100%", height: "100%", borderRadius: "clamp(12px, 3.5vw, 22px)", objectFit: "cover" }} />
                    ) : (
                      <div style={{ width: "100%", height: "100%", borderRadius: "clamp(12px, 3.5vw, 22px)", background: "var(--fo)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "clamp(24px, 6vw, 44px)" }}></div>
                    )}
                  </div>
                  <div style={{ background: "linear-gradient(135deg,rgba(184,148,63,1),rgba(155,125,76,1))", padding: "clamp(36px, 10vw, 64px) clamp(8px, 2vw, 16px) clamp(14px, 4vw, 24px)", borderRadius: "clamp(10px, 2.5vw, 16px) clamp(10px, 2.5vw, 16px) clamp(14px, 3.5vw, 24px) clamp(14px, 3.5vw, 24px)", width: "100%", textAlign: "center", borderTop: "none", boxShadow: `0 8px 20px rgba(0,0,0,0.2)` }}>
                    <div style={{ fontSize: "clamp(10px, 2.8vw, 15px)", fontWeight: 800, color: "white", marginBottom: 4, textShadow: "0 2px 4px rgba(0,0,0,0.2)" }}>{item.nama}</div>
                    <div style={{ fontSize: "clamp(7px, 2vw, 10px)", fontWeight: 700, color: "rgba(255,255,255,0.9)", textTransform: "uppercase", letterSpacing: ".06em" }}>{item.jabatan}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* DKM + Tim Eksekutif */}
          <div style={{ display: "grid", gridTemplateColumns: "1fr", gap: 40, marginBottom: 40 }}>
            {/* Dewan Pengawas */}
            <div>
              <div style={{ fontSize: "clamp(10px, 2.5vw, 13px)", fontWeight: 800, letterSpacing: ".14em", textTransform: "uppercase", color: "#4FBF7E", marginBottom: 16, textAlign: "center" }}>B. Dewan Pengawas Kas</div>
              <div style={{ display: "flex", flexWrap: "wrap", gap: "clamp(10px, 2.5vw, 32px)", justifyContent: "center", maxWidth: 800, margin: "0 auto" }} className="pengurus-grid">
                {(pengurusDb.filter(p => p.kategori === 'pengawas').length > 0 ? pengurusDb.filter(p => p.kategori === 'pengawas') : dwnPengawas.map((p, i) => ({ ...p, jabatan: p.role, nama: p.name, id: `w-${i}` }))).map((item: any, i) => (
                  <div key={item.id} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', marginTop: "clamp(24px, 6vw, 40px)", position: 'relative', width: "clamp(100px, 28vw, 220px)", minWidth: 100, animation: `float-heroic 6s ease-in-out infinite ${(i * 0.2 + 1).toFixed(1)}s` }}>
                    <div style={{ width: "clamp(60px, 18vw, 140px)", height: "clamp(60px, 18vw, 140px)", borderRadius: "clamp(14px, 4vw, 28px)", padding: 3, background: "var(--cw)", border: `2px solid #2F8F4E`, zIndex: 2, position: "relative", marginBottom: "clamp(-24px, -6vw, -40px)", boxShadow: `0 12px 24px rgba(47,143,78,.25)`, overflow: "hidden" }}>
                      {item.foto ? (
                        <img src={item.foto} alt={item.nama} style={{ width: "100%", height: "100%", borderRadius: "clamp(12px, 3.5vw, 22px)", objectFit: "cover" }} />
                      ) : (
                        <div style={{ width: "100%", height: "100%", borderRadius: "clamp(12px, 3.5vw, 22px)", background: "var(--fo)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "clamp(24px, 6vw, 44px)" }}></div>
                      )}
                    </div>
                    <div style={{ background: "linear-gradient(135deg,rgba(47,143,78,1),rgba(28,58,43,1))", padding: "clamp(36px, 10vw, 64px) clamp(8px, 2vw, 16px) clamp(14px, 4vw, 24px)", borderRadius: "clamp(10px, 2.5vw, 16px) clamp(10px, 2.5vw, 16px) clamp(14px, 3.5vw, 24px) clamp(14px, 3.5vw, 24px)", width: "100%", textAlign: "center", borderTop: "none", boxShadow: `0 8px 20px rgba(0,0,0,0.2)` }}>
                      <div style={{ fontSize: "clamp(10px, 2.8vw, 15px)", fontWeight: 800, color: "white", marginBottom: 4, textShadow: "0 2px 4px rgba(0,0,0,0.2)" }}>{item.nama}</div>
                      <div style={{ fontSize: "clamp(7px, 2vw, 10px)", fontWeight: 700, color: "rgba(255,255,255,0.8)", textTransform: "uppercase", letterSpacing: ".06em" }}>{item.jabatan}</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Tim Eksekutif */}
            <div>
              <div style={{ fontSize: "clamp(10px, 2.5vw, 13px)", fontWeight: 800, letterSpacing: ".14em", textTransform: "uppercase", color: "var(--go)", marginBottom: 16, textAlign: "center" }}>C. Tim Eksekutif Lapangan</div>
              <div style={{ display: "flex", flexWrap: "wrap", gap: "clamp(10px, 2.5vw, 32px)", justifyContent: "center" }} className="pengurus-grid">
                {(pengurusDb.filter(p => p.kategori === 'eksekutif').length > 0 ? pengurusDb.filter(p => p.kategori === 'eksekutif') : timEksekutif.map((p, i) => ({ ...p, jabatan: p.role, nama: p.name, id: `e-${i}` }))).map((item: any, i) => (
                  <div key={item.id} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', marginTop: "clamp(24px, 6vw, 40px)", position: 'relative', width: "clamp(100px, 28vw, 220px)", minWidth: 100, animation: `float-heroic 6s ease-in-out infinite ${(i * 0.2 + 2).toFixed(1)}s` }}>
                    <div style={{ width: "clamp(60px, 18vw, 140px)", height: "clamp(60px, 18vw, 140px)", borderRadius: "clamp(14px, 4vw, 28px)", padding: 3, background: "var(--cw)", border: `2px solid var(--go)`, zIndex: 2, position: "relative", marginBottom: "clamp(-24px, -6vw, -40px)", boxShadow: `0 12px 24px rgba(184,148,63,.25)`, overflow: "hidden" }}>
                      {item.foto ? (
                        <img src={item.foto} alt={item.nama} style={{ width: "100%", height: "100%", borderRadius: "clamp(12px, 3.5vw, 22px)", objectFit: "cover" }} />
                      ) : (
                        <div style={{ width: "100%", height: "100%", borderRadius: "clamp(12px, 3.5vw, 22px)", background: "var(--fo)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "clamp(24px, 6vw, 44px)" }}></div>
                      )}
                    </div>
                    <div style={{ background: "linear-gradient(135deg,rgba(184,148,63,1),rgba(155,125,76,1))", padding: "clamp(36px, 10vw, 64px) clamp(8px, 2vw, 16px) clamp(14px, 4vw, 24px)", borderRadius: "clamp(10px, 2.5vw, 16px) clamp(10px, 2.5vw, 16px) clamp(14px, 3.5vw, 24px) clamp(14px, 3.5vw, 24px)", width: "100%", textAlign: "center", borderTop: "none", boxShadow: `0 8px 20px rgba(0,0,0,0.2)` }}>
                      <div style={{ fontSize: "clamp(10px, 2.8vw, 15px)", fontWeight: 800, color: "white", marginBottom: 4, textShadow: "0 2px 4px rgba(0,0,0,0.2)" }}>{item.nama}</div>
                      <div style={{ fontSize: "clamp(7px, 2vw, 10px)", fontWeight: 700, color: "rgba(255,255,255,0.9)", textTransform: "uppercase", letterSpacing: ".06em" }}>{item.jabatan}</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* 5 Divisi */}
          <div style={{ marginTop: 8 }}>
<<<<<<< HEAD
            <div style={{ fontSize: "clamp(9px, 2.2vw, 11px)", fontWeight: 700, letterSpacing: ".14em", textTransform: "uppercase", color: "#2F8F4E", marginBottom: 16, background: "linear-gradient(90deg,transparent,#2F8F4E 50%,transparent)", backgroundSize: "100% 2px", backgroundPosition: "0 100%", backgroundRepeat: "no-repeat", paddingBottom: 10 }}>D. 5 Divisi Operasional (Garda Depan)</div>
=======
            <div style={{ fontSize: "clamp(9px, 2.2vw, 11px)", fontWeight: 700, letterSpacing: ".14em", textTransform: "uppercase", color: "#2F8F4E", marginBottom: 16, background: "linear-gradient(90deg,transparent,#2F8F4E 50%,transparent)", backgroundSize: "100% 2px", backgroundPosition: "0 100%", backgroundRepeat: "no-repeat", paddingBottom: 10 }}>D. 4 Divisi Operasional (Garda Depan)</div>
>>>>>>> a637e63bec351e4f46e7425aaaea45b9a1ab3434
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(140px,1fr))", gap: "clamp(8px, 2vw, 16px)" }} className="divisi-grid">
              {divisi.map((d, i) => (
                <div key={i} className={`div-card card-heroic d${i + 1}`} style={{ background: "linear-gradient(135deg,rgba(255,254,249,.95),rgba(232,245,238,.5))", border: "1.5px solid rgba(47,143,78,.15)", borderRadius: "clamp(10px, 2.5vw, 16px)", padding: "clamp(14px, 3.5vw, 24px)", transition: "all .35s cubic-bezier(.22,1,.36,1)", cursor: "pointer", position: "relative", overflow: "hidden" }}
                  onMouseEnter={e => {
                    (e.currentTarget as HTMLElement).style.background = "linear-gradient(135deg,rgba(255,254,249,1),rgba(232,245,238,.7))";
                    (e.currentTarget as HTMLElement).style.transform = "translateY(-6px)";
                    (e.currentTarget as HTMLElement).style.boxShadow = "0 16px 40px rgba(47,143,78,.1)";
                    (e.currentTarget as HTMLElement).style.borderColor = "rgba(47,143,78,.3)";
                  }}
                  onMouseLeave={e => {
                    (e.currentTarget as HTMLElement).style.background = "linear-gradient(135deg,rgba(255,254,249,.95),rgba(232,245,238,.5))";
                    (e.currentTarget as HTMLElement).style.transform = "translateY(0)";
                    (e.currentTarget as HTMLElement).style.boxShadow = "0 0 0 transparent";
                    (e.currentTarget as HTMLElement).style.borderColor = "rgba(47,143,78,.15)";
                  }}
                >
                  <div style={{ fontSize: "clamp(24px, 6vw, 36px)", marginBottom: 10, filter: "drop-shadow(0 4px 12px rgba(47,143,78,.1))" }}>{d.icon}</div>
                  <div style={{ fontSize: "clamp(10px, 2.5vw, 13px)", fontWeight: 800, color: "#1C3A2B", marginBottom: 3, textTransform: "uppercase", letterSpacing: ".04em", background: `linear-gradient(135deg,#2F8F4E,#4FBF7E)`, backgroundClip: "text", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}>{d.nama}</div>
                  <div style={{ fontSize: "clamp(9px, 2.2vw, 12px)", fontWeight: 600, color: "#5A4A40", marginBottom: 8, minHeight: 24, lineHeight: 1.3 }}>{d.full}</div>
                  <div style={{ fontSize: "clamp(9px, 2.2vw, 12px)", lineHeight: 1.5, color: "#5A4A40", marginBottom: 10, paddingBottom: 10, borderBottom: "1px solid rgba(47,143,78,.1)" }}>{d.tugas}</div>

                  {/* Ketua & Wakil (Nama saja) */}
                  <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                    <div style={{ fontSize: "clamp(8px, 2vw, 10px)", fontWeight: 700, color: "#2F8F4E", textTransform: "uppercase", letterSpacing: ".05em" }}> Ketua</div>
                    <div style={{ fontSize: "clamp(9px, 2.2vw, 12px)", fontWeight: 600, color: "#1C3A2B", fontStyle: (pengurusDb.find(p => p.kategori === 'divisi' && p.jabatan.includes("Ketua") && p.jabatan.includes(d.nama))?.nama || d.ketua.nama).includes("—") ? "italic" : "normal", marginBottom: 6 }}>
                      {pengurusDb.find(p => p.kategori === 'divisi' && p.jabatan.includes("Ketua") && p.jabatan.includes(d.nama))?.nama || d.ketua.nama}
                    </div>

                    <div style={{ fontSize: "clamp(8px, 2vw, 10px)", fontWeight: 700, color: "#2F8F4E", textTransform: "uppercase", letterSpacing: ".05em" }}> Wakil</div>
                    <div style={{ fontSize: "clamp(9px, 2.2vw, 12px)", fontWeight: 600, color: "#1C3A2B", fontStyle: (pengurusDb.find(p => p.kategori === 'divisi' && p.jabatan.includes("Wakil") && p.jabatan.includes(d.nama))?.nama || d.wakil.nama).includes("—") ? "italic" : "normal" }}>
                      {pengurusDb.find(p => p.kategori === 'divisi' && p.jabatan.includes("Wakil") && p.jabatan.includes(d.nama))?.nama || d.wakil.nama}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

    </main>
  );
}
