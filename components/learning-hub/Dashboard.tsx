"use client";
import { useState, useEffect } from "react";
import { supabase, isSupabaseReady } from "@/lib/supabase";

interface User { id: string; nama: string; kk_id: string; saldo_poin: number; tipe: "warga" | "external" }

const FEATURES = [
  { key: "perpus", icon: "📚", title: "E-Perpustakaan", desc: "Katalog buku & e-book digital untuk dipinjam", color: "#3B82F6" },
  { key: "lab", icon: "💻", title: "Lab Komputer", desc: "Cek ketersediaan PC di Balai Warga", color: "#14B8A6" },
  { key: "video", icon: "▶️", title: "Video Pembelajaran", desc: "Tutorial UMKM, koding dasar, & pertanian", color: "#8B5CF6" },
  { key: "dokumen", icon: "📄", title: "Dokumen & PDF", desc: "Panduan teknis, regulasi, dan proposal desa", color: "#F43F5E" },
  { key: "ai", icon: "🤖", title: "AI Asisten Ciburial", desc: "Tanya apapun soal administrasi desa", color: "#2F8F4E" },
  { key: "galeri", icon: "🖼️", title: "Galeri Kegiatan", desc: "Dokumentasi foto pelatihan & kegiatan Hub", color: "#D946EF" },
];

export function Dashboard({ user, onLogout, showToast }: { user: User; onLogout: () => void; showToast: (m: string, ok?: boolean) => void }) {
  const [activeTab, setActiveTab] = useState<string | null>(null);
  const [books, setBooks] = useState<any[]>([]);
  const [videos, setVideos] = useState<any[]>([]);
  const [docs, setDocs] = useState<any[]>([]);
  const [galeri, setGaleri] = useState<any[]>([]);
  const [labPCs, setLabPCs] = useState<any[]>([]);
  const [poinUser, setPoinUser] = useState(user.saldo_poin || 0);

  useEffect(() => {
    if (!isSupabaseReady()) return;
    (async () => {
      const [b, v, d, g, l] = await Promise.all([
        supabase.from("buku_perpustakaan").select("*").order("judul"),
        supabase.from("video_pembelajaran").select("*").order("created_at", { ascending: false }),
        supabase.from("dokumen_hub").select("*").order("created_at", { ascending: false }),
        supabase.from("galeri_hub").select("*").order("created_at", { ascending: false }),
        supabase.from("lab_komputer").select("*").order("nomor_pc"),
      ]);
      if (b.data) setBooks(b.data);
      if (v.data) setVideos(v.data);
      if (d.data) setDocs(d.data);
      if (g.data) setGaleri(g.data);
      if (l.data) setLabPCs(l.data);
    })();
  }, []);

  async function catatSesi(aktivitas: string) {
    if (!isSupabaseReady() || user.tipe !== "warga") return;
    try {
      const today = new Date().toISOString().split("T")[0];
      const { data: cek } = await supabase.from("sesi_learning").select("id").eq("anggota_id", user.id).eq("tanggal", today).eq("aktivitas", aktivitas).limit(1);
      if (cek && cek.length > 0) return;
      await supabase.from("sesi_learning").insert({ anggota_id: user.id, kk_id: user.kk_id, aktivitas, tanggal: today });
      const { tambahPoin } = await import("@/lib/ecoReward");
      const res = await tambahPoin({ anggotaId: user.id, kkId: user.kk_id, jumlah: 25, sumber: "learning_hub", keterangan: `Sesi: ${aktivitas}` });
      if (res.ok) { setPoinUser(res.saldoBaru || poinUser + 25); showToast(`+25 poin untuk sesi ${aktivitas}! 🌿`); }
    } catch {}
  }

  const backBtn = <button className="lh-btn" onClick={() => setActiveTab(null)} style={{ padding: "8px 18px", borderRadius: 10, background: "rgba(47,143,78,.06)", color: "var(--ts)", fontSize: 12, fontWeight: 600, marginBottom: 20, border: "1px solid rgba(47,143,78,.1)" }}>← Kembali ke Menu</button>;
  const empty = (t: string) => <div style={{ textAlign: "center", padding: "56px 20px", color: "var(--tm)", fontSize: 14, opacity: .6 }}><div style={{ fontSize: 40, marginBottom: 12, opacity: .3 }}>📭</div>{t}</div>;
  const secTitle = (t: string) => <h3 className="fnt" style={{ fontSize: 24, fontWeight: 600, color: "var(--fo)", marginBottom: 16 }}>{t}</h3>;

  function renderContent() {
    if (!activeTab) return (
      <div className="lh-grid-features" style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(min(280px,100%),1fr))", gap: 16 }}>
        {FEATURES.map((f, i) => (
          <button key={f.key} className="lh-feature" onClick={() => { if (f.key === "ai") { window.open("/ai", "_blank"); return; } setActiveTab(f.key); catatSesi(f.key); }}
            style={{ animationDelay: `${i * 60}ms`, animation: "fadeInUp .5s ease both" }}>
            <div style={{ width: 52, height: 52, borderRadius: 16, background: `${f.color}12`, border: `1.5px solid ${f.color}25`, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 24, transition: "transform .3s" }}>{f.icon}</div>
            <div>
              <div style={{ fontSize: 16, fontWeight: 700, color: "var(--tp)", marginBottom: 4 }}>{f.title}</div>
              <div style={{ fontSize: 13, color: "var(--tm)", lineHeight: 1.5 }}>{f.desc}</div>
            </div>
            <div style={{ marginTop: "auto", paddingTop: 8, fontSize: 12, fontWeight: 700, color: f.color, display: "flex", alignItems: "center", gap: 4 }}>Buka <span>→</span></div>
          </button>
        ))}
      </div>
    );

    if (activeTab === "perpus") return <div>{backBtn}{secTitle("📚 E-Perpustakaan")}{books.length === 0 ? empty("Katalog buku belum tersedia") : <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(240px,1fr))", gap: 14 }}>{books.map(b => (
      <div key={b.id} className="lh-card" style={{ padding: 22 }}>
        <div style={{ fontSize: 32, marginBottom: 10 }}>{b.icon || "📕"}</div>
        <div style={{ fontSize: 15, fontWeight: 700, color: "var(--tp)", marginBottom: 4 }}>{b.judul}</div>
        <div style={{ fontSize: 12, color: "var(--tm)", marginBottom: 10 }}>{b.penulis || "—"}</div>
        <span className="lh-badge" style={{ background: b.status === "tersedia" ? "var(--gb)" : "var(--rb)", color: b.status === "tersedia" ? "var(--gt)" : "var(--rt)" }}>{b.status || "tersedia"}</span>
      </div>))}</div>}</div>;

    if (activeTab === "lab") return <div>{backBtn}{secTitle("💻 Lab Komputer")}{labPCs.length === 0 ? empty("Data lab belum tersedia") : <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(150px,1fr))", gap: 12 }}>{labPCs.map(pc => (
      <div key={pc.id} className="lh-card" style={{ padding: 20, textAlign: "center" }}>
        <div style={{ fontSize: 36, marginBottom: 8 }}>🖥️</div>
        <div style={{ fontSize: 14, fontWeight: 700, color: "var(--tp)" }}>PC-{pc.nomor_pc}</div>
        <span className="lh-badge" style={{ marginTop: 8, background: pc.status === "tersedia" ? "var(--gb)" : "rgba(255,180,50,.1)", color: pc.status === "tersedia" ? "var(--gt)" : "#B8943F" }}>{pc.status || "tersedia"}</span>
      </div>))}</div>}</div>;

    if (activeTab === "video") return <div>{backBtn}{secTitle("▶️ Video Pembelajaran")}{videos.length === 0 ? empty("Video belum tersedia") : <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>{videos.map(v => (
      <a key={v.id} href={v.url} target="_blank" rel="noopener noreferrer" className="lh-card" style={{ padding: 18, display: "flex", alignItems: "center", gap: 16, textDecoration: "none" }}>
        <div style={{ width: 50, height: 50, borderRadius: 14, background: "rgba(139,92,246,.08)", border: "1.5px solid rgba(139,92,246,.15)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 22, flexShrink: 0 }}>▶️</div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontSize: 15, fontWeight: 700, color: "var(--tp)" }}>{v.judul}</div>
          <div style={{ fontSize: 12, color: "var(--tm)", marginTop: 3 }}>{v.kategori || "Umum"} · {v.durasi || "—"}</div>
        </div>
      </a>))}</div>}</div>;

    if (activeTab === "dokumen") return <div>{backBtn}{secTitle("📄 Dokumen & PDF")}{docs.length === 0 ? empty("Dokumen belum tersedia") : <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>{docs.map(d => (
      <a key={d.id} href={d.url} target="_blank" rel="noopener noreferrer" className="lh-card" style={{ padding: 18, display: "flex", alignItems: "center", gap: 16, textDecoration: "none" }}>
        <div style={{ width: 46, height: 46, borderRadius: 12, background: "rgba(244,63,94,.08)", border: "1.5px solid rgba(244,63,94,.15)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 20, flexShrink: 0 }}>📄</div>
        <div style={{ flex: 1 }}>
          <div style={{ fontSize: 15, fontWeight: 700, color: "var(--tp)" }}>{d.judul}</div>
          <div style={{ fontSize: 12, color: "var(--tm)", marginTop: 2 }}>{d.tipe || "PDF"} · {d.ukuran || "—"}</div>
        </div>
        <span style={{ fontSize: 12, color: "#F43F5E", fontWeight: 700 }}>Unduh →</span>
      </a>))}</div>}</div>;

    if (activeTab === "galeri") return <div>{backBtn}{secTitle("🖼️ Galeri Kegiatan")}{galeri.length === 0 ? empty("Galeri belum tersedia") : <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(180px,1fr))", gap: 12 }}>{galeri.map(g => (
      <div key={g.id} style={{ borderRadius: 18, overflow: "hidden", aspectRatio: "4/3", position: "relative", border: "1.5px solid rgba(47,143,78,.1)" }}>
        <img src={g.url} alt={g.judul || ""} style={{ width: "100%", height: "100%", objectFit: "cover" }} loading="lazy" />
        {g.judul && <div style={{ position: "absolute", bottom: 0, left: 0, right: 0, padding: "10px 14px", background: "linear-gradient(transparent,rgba(0,0,0,.6))", fontSize: 12, color: "#fff", fontWeight: 600 }}>{g.judul}</div>}
      </div>))}</div>}</div>;

    return null;
  }

  return (
    <div style={{ position: "relative", zIndex: 1 }}>
      {/* Dashboard Header */}
      <header style={{ background: "var(--cw)", borderBottom: "1.5px solid rgba(47,143,78,.08)", padding: "16px 24px", display: "flex", alignItems: "center", justifyContent: "space-between", position: "sticky", top: 0, zIndex: 10, boxShadow: "0 2px 16px rgba(28,58,43,.04)" }}>
        <div>
          <div style={{ fontSize: 9, fontWeight: 700, letterSpacing: ".2em", color: "var(--accent)", textTransform: "uppercase" }}>CIBURIAL LEARNING HUB</div>
          <div style={{ fontSize: 18, fontWeight: 800, color: "var(--fo)", letterSpacing: "-.03em", marginTop: 2 }}>
            Dashboard<span style={{ color: "var(--accent)" }}>.</span>
          </div>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
          <div style={{ textAlign: "right" }}>
            <div style={{ fontSize: 13, fontWeight: 700, color: "var(--tp)" }}>{user.nama}</div>
            <div style={{ fontSize: 11, color: "var(--accent)", fontWeight: 600 }}>
              {user.tipe === "warga" ? `🌿 ${poinUser} poin` : "🌍 Pengguna Umum"}
            </div>
          </div>
          <div style={{ width: 38, height: 38, borderRadius: "50%", background: "linear-gradient(135deg,rgba(47,143,78,.1),rgba(79,191,126,.15))", border: "1.5px solid rgba(47,143,78,.2)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 15, fontWeight: 800, color: "var(--accent)" }}>{user.nama?.charAt(0)}</div>
          <button onClick={onLogout} className="lh-btn" style={{ padding: "7px 16px", borderRadius: 10, background: "var(--rb)", border: "1px solid rgba(139,32,32,.1)", color: "var(--rt)", fontSize: 11, fontWeight: 700 }}>Logout</button>
        </div>
      </header>

      <div style={{ maxWidth: 1100, margin: "0 auto", padding: "28px 24px 60px" }}>
        {!activeTab && (
          <div style={{ marginBottom: 28, animation: "fadeInUp .5s ease both" }}>
            <h2 className="fnt" style={{ fontSize: "clamp(24px,4vw,36px)", fontWeight: 300, color: "var(--fo)", letterSpacing: "-.02em", marginBottom: 6 }}>
              Wilujeng sumping, <span style={{ fontWeight: 600 }}>{user.nama}</span> 👋
            </h2>
            <p style={{ fontSize: 14, color: "var(--tm)", lineHeight: 1.6 }}>Pilih layanan pembelajaran yang ingin kamu akses hari ini.</p>
          </div>
        )}
        {renderContent()}
      </div>
    </div>
  );
}
