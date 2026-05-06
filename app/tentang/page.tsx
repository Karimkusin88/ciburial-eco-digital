"use client";
import { useState, useEffect, ReactNode } from "react";
import { Landmark, Home, User, HandHeart, Zap, FileText, Coins, Building, Monitor, Wheat, ShoppingCart, Megaphone, Lightbulb, BookOpen, Sprout, BarChart2 } from "lucide-react";
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
    icon: <Building size={20} />, nama: "Green Build", full: "Infrastruktur & Konstruksi Hijau", tugas: "Balai Serba Guna, Smart PJU, drainase resapan",
    ketua: { nama: "— Hasil Voting —" }, wakil: { nama: "— Hasil Voting —" }
  },
  {
    icon: <Monitor size={20} />, nama: "Digital Hub", full: "IT, Jaringan & Web3", tugas: "RT/RW Net, Learning Hub, Website, Crypto",
    ketua: { nama: "— Hasil Voting —" }, wakil: { nama: "— Hasil Voting —" }
  },
  {
    icon: <Wheat size={20} />, nama: "Eco-Waste & Farming", full: "Smart Farming & Lingkungan", tugas: "Pertanian organik, peternakan, Bank Sampah",
    ketua: { nama: "— Hasil Voting —" }, wakil: { nama: "— Hasil Voting —" }
  },
  {
    icon: <ShoppingCart size={20} />, nama: "Local Commerce", full: "Ekonomi Kreatif & UMKM", tugas: "Pengrajin lokal, marketplace, quality control",
    ketua: { nama: "— Hasil Voting —" }, wakil: { nama: "— Hasil Voting —" }
  },
  {
    icon: <Megaphone size={20} />, nama: "Public Relations", full: "Humas & Transparansi Publik", tugas: "Dokumentasi, laporan dana, komunikasi CSR",
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
      <section className="sec" style={{ padding: "clamp(60px,10vw,120px) clamp(16px,4vw,32px)", background: "linear-gradient(135deg,rgba(250,248,243,.5) 0%,rgba(255,254,249,.8) 100%)" }}>
        <div className="visi-wrap" style={{ maxWidth: 1320, margin: "0 auto", display: "flex", flexWrap: "wrap", gap: "clamp(32px, 5vw, 64px)", alignItems: "flex-start" }}>
          <div className="visi-left" style={{ flex: "1 1 300px", minWidth: 280 }}>
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
              { no: "01", icon: "", t: "Infrastruktur Cerdas", d: "Balai Serba Guna berkonsep hijau, Smart PJU, Jaringan CCTV, dan Internet Mandiri (Wi-Fi Kampung)." },
              { no: "02", icon: "", t: "SDM Unggul", d: "Laboratorium Komputer & Perpustakaan sebagai inkubator pemuda Ciburial yang melek teknologi." },
              { no: "03", icon: "", t: "Ekonomi Sirkular & Smart Farming", d: "Pasar lokal untuk bambu, sayuran organik, peternakan terpadu, dan produk daur ulang limbah." },
              { no: "04", icon: "", t: "Tata Kelola Transparan", d: "Aliran dana kemakmuran terbuka secara real-time, dari fiat konvensional hingga aset kripto (Web3)." },
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
            <div style={{ display: "flex", flexWrap: "wrap", gap: "clamp(16px, 4vw, 32px)", justifyContent: "center" }}>
              {(pengurusDb.filter(p => p.kategori === 'pelindung').length > 0 ? pengurusDb.filter(p => p.kategori === 'pelindung') : dwnPelindung.map((p, i) => ({ ...p, jabatan: p.role, nama: p.name, id: `p-${i}` }))).map((item: any, i) => (
                <div key={item.id} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', marginTop: 50, position: 'relative', width: "clamp(160px, 40vw, 220px)", minWidth: 160, animation: `float-heroic 6s ease-in-out infinite ${(i * 0.2).toFixed(1)}s` }}>
                  <div style={{ width: "clamp(100px, 25vw, 140px)", height: "clamp(100px, 25vw, 140px)", borderRadius: 28, padding: 5, background: "var(--cw)", border: `2px solid var(--go)`, zIndex: 2, position: "relative", marginBottom: -40, boxShadow: `0 16px 32px rgba(184,148,63,.25)`, overflow: "hidden" }}>
                    {item.foto ? (
                      <img src={item.foto} alt={item.nama} style={{ width: "100%", height: "100%", borderRadius: 22, objectFit: "cover" }} />
                    ) : (
                      <div style={{ width: "100%", height: "100%", borderRadius: 22, background: "var(--fo)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 44 }}></div>
                    )}
                  </div>
                  <div style={{ background: "linear-gradient(135deg,rgba(184,148,63,1),rgba(155,125,76,1))", padding: "64px 16px 24px", borderRadius: "16px 16px 24px 24px", width: "100%", textAlign: "center", borderTop: "none", boxShadow: `0 12px 28px rgba(0,0,0,0.2)` }}>
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
              <div style={{ display: "flex", flexWrap: "wrap", gap: "clamp(16px, 4vw, 32px)", justifyContent: "center", maxWidth: 800, margin: "0 auto" }}>
                {(pengurusDb.filter(p => p.kategori === 'pengawas').length > 0 ? pengurusDb.filter(p => p.kategori === 'pengawas') : dwnPengawas.map((p, i) => ({ ...p, jabatan: p.role, nama: p.name, id: `w-${i}` }))).map((item: any, i) => (
                  <div key={item.id} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', marginTop: 40, position: 'relative', width: "clamp(160px, 40vw, 220px)", minWidth: 160, animation: `float-heroic 6s ease-in-out infinite ${(i * 0.2 + 1).toFixed(1)}s` }}>
                    <div style={{ width: "clamp(100px, 25vw, 140px)", height: "clamp(100px, 25vw, 140px)", borderRadius: 28, padding: 5, background: "var(--cw)", border: `2px solid #2F8F4E`, zIndex: 2, position: "relative", marginBottom: -40, boxShadow: `0 16px 32px rgba(47,143,78,.25)`, overflow: "hidden" }}>
                      {item.foto ? (
                        <img src={item.foto} alt={item.nama} style={{ width: "100%", height: "100%", borderRadius: 22, objectFit: "cover" }} />
                      ) : (
                        <div style={{ width: "100%", height: "100%", borderRadius: 22, background: "var(--fo)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 44 }}></div>
                      )}
                    </div>
                    <div style={{ background: "linear-gradient(135deg,rgba(47,143,78,1),rgba(28,58,43,1))", padding: "64px 16px 24px", borderRadius: "16px 16px 24px 24px", width: "100%", textAlign: "center", borderTop: "none", boxShadow: `0 12px 28px rgba(0,0,0,0.2)` }}>
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
              <div style={{ display: "flex", flexWrap: "wrap", gap: "clamp(16px, 4vw, 32px)", justifyContent: "center" }}>
                {(pengurusDb.filter(p => p.kategori === 'eksekutif').length > 0 ? pengurusDb.filter(p => p.kategori === 'eksekutif') : timEksekutif.map((p, i) => ({ ...p, jabatan: p.role, nama: p.name, id: `e-${i}` }))).map((item: any, i) => (
                  <div key={item.id} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', marginTop: 40, position: 'relative', width: "clamp(160px, 40vw, 220px)", minWidth: 160, animation: `float-heroic 6s ease-in-out infinite ${(i * 0.2 + 2).toFixed(1)}s` }}>
                    <div style={{ width: "clamp(100px, 25vw, 140px)", height: "clamp(100px, 25vw, 140px)", borderRadius: 28, padding: 5, background: "var(--cw)", border: `2px solid var(--go)`, zIndex: 2, position: "relative", marginBottom: -40, boxShadow: `0 16px 32px rgba(184,148,63,.25)`, overflow: "hidden" }}>
                      {item.foto ? (
                        <img src={item.foto} alt={item.nama} style={{ width: "100%", height: "100%", borderRadius: 22, objectFit: "cover" }} />
                      ) : (
                        <div style={{ width: "100%", height: "100%", borderRadius: 22, background: "var(--fo)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 44 }}></div>
                      )}
                    </div>
                    <div style={{ background: "linear-gradient(135deg,rgba(184,148,63,1),rgba(155,125,76,1))", padding: "64px 16px 24px", borderRadius: "16px 16px 24px 24px", width: "100%", textAlign: "center", borderTop: "none", boxShadow: `0 12px 28px rgba(0,0,0,0.2)` }}>
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
                    <div style={{ fontSize: 10, fontWeight: 700, color: "#2F8F4E", textTransform: "uppercase", letterSpacing: ".05em" }}> Ketua</div>
                    <div style={{ fontSize: 12, fontWeight: 600, color: "#1C3A2B", fontStyle: (pengurusDb.find(p => p.kategori === 'divisi' && p.jabatan.includes("Ketua") && p.jabatan.includes(d.nama))?.nama || d.ketua.nama).includes("—") ? "italic" : "normal", marginBottom: 8 }}>
                      {pengurusDb.find(p => p.kategori === 'divisi' && p.jabatan.includes("Ketua") && p.jabatan.includes(d.nama))?.nama || d.ketua.nama}
                    </div>

                    <div style={{ fontSize: 10, fontWeight: 700, color: "#2F8F4E", textTransform: "uppercase", letterSpacing: ".05em" }}> Wakil</div>
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

    </main>
  );
}
