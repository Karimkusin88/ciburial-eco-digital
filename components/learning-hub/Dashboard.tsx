"use client";
import { useState, useEffect } from "react";
import { 
  Smartphone, Book, Laptop, PlaySquare, FileText, Bot, 
  Image as ImageIcon, Search, Bookmark, CheckCircle, 
  LogOut, ArrowLeft, Inbox, Monitor, ChevronRight, 
  Sparkles, Leaf, Globe, Info
} from "lucide-react";
import { supabase, isSupabaseReady } from "@/lib/supabase";

interface User { id: string; nama: string; kk_id: string; saldo_poin: number; tipe: "warga" | "external" }

const FEATURES = [
  { key: "ebook", icon: <Smartphone size={24} />, title: "E-Book Digital", desc: "Baca dan unduh buku digital interaktif", color: "#3B82F6" },
  { key: "perpus", icon: <Book size={24} />, title: "Perpustakaan Desa", desc: "Katalog buku cetak fisik balai warga", color: "#D97706" },
  { key: "lab", icon: <Laptop size={24} />, title: "Lab Komputer", desc: "Cek ketersediaan PC di Balai Warga", color: "#14B8A6" },
  { key: "video", icon: <PlaySquare size={24} />, title: "Video Pembelajaran", desc: "Tutorial UMKM, koding dasar, & pertanian", color: "#8B5CF6" },
  { key: "dokumen", icon: <FileText size={24} />, title: "Dokumen & PDF", desc: "Panduan teknis, regulasi, dan proposal desa", color: "#F43F5E" },
  { key: "ai", icon: <Bot size={24} />, title: "AI Asisten Ciburial", desc: "Tanya apapun soal administrasi desa", color: "#2F8F4E" },
  { key: "galeri", icon: <ImageIcon size={24} />, title: "Galeri Kegiatan", desc: "Dokumentasi foto pelatihan & kegiatan Hub", color: "#D946EF" },
];

const ILMIYYAH_EBOOKS = [
  { id: "ilm-1", judul: "Ta’dzhimul ‘Ilm (Mengagungkan Ilmu)", penulis: "Syaikh Shalih Al-Ushaimi", kategori: "Kitab Dasar", jenis_buku: "ebook", file_url: "https://ilmiyyah.com/archives/11115", foto_sampul: null },
  { id: "ilm-2", judul: "Al-Ushul Ats-Tsalatsah (Tiga Landasan Utama)", penulis: "Syaikh Muhammad bin Abdul Wahhab", kategori: "Kitab Dasar", jenis_buku: "ebook", file_url: "https://ilmiyyah.com/archives/10372", foto_sampul: null },
  { id: "ilm-3", judul: "Sifat Sholat Nabi ﷺ", penulis: "Syaikh Al-Albani", kategori: "Fiqih", jenis_buku: "ebook", file_url: "https://ilmiyyah.com/archives/10311", foto_sampul: null },
  { id: "ilm-4", judul: "Al-Arbain An-Nawawiyyah", penulis: "Imam An-Nawawi", kategori: "Kitab Dasar", jenis_buku: "ebook", file_url: "https://ilmiyyah.com/archives/12199", foto_sampul: null },
  { id: "ilm-5", judul: "Kumpulan Fatwa Ulama Dalam Masalah Aqidah", penulis: "Ulama Ahlussunnah", kategori: "Aqidah", jenis_buku: "ebook", file_url: "https://ilmiyyah.com/archives/10095", foto_sampul: null },
  { id: "ilm-6", judul: "Kewajiban Menuntut Ilmu Agama", penulis: "Tim Ilmiyyah", kategori: "Aqidah", jenis_buku: "ebook", file_url: "https://ilmiyyah.com/archives/10198", foto_sampul: null },
  { id: "ilm-7", judul: "Bahasa Arab Mudah Metode Balik-Tangan", penulis: "Abu Ubaidah Yusuf", kategori: "Bahasa Arab", jenis_buku: "ebook", file_url: "https://ilmiyyah.com/archives/10081", foto_sampul: null },
  { id: "ilm-8", judul: "Ilmu Nahwu Untuk Pemula", penulis: "Tim Ilmiyyah", kategori: "Bahasa Arab", jenis_buku: "ebook", file_url: "https://ilmiyyah.com/archives/10194", foto_sampul: null },
  { id: "ilm-9", judul: "Kunci-Kunci Sukses Rumah Tangga Bahagia", penulis: "Abu Ubaidah Yusuf", kategori: "Keluarga", jenis_buku: "ebook", file_url: "https://ilmiyyah.com/archives/3801", foto_sampul: null },
  { id: "ilm-10", judul: "5 Masalah Penting Seputar Shalat", penulis: "Abu Ubaidah Yusuf", kategori: "Fiqih", jenis_buku: "ebook", file_url: "https://ilmiyyah.com/archives/3771", foto_sampul: null },
  { id: "ilm-11", judul: "Buku Pintar Ramadhan", penulis: "Tim Ilmiyyah", kategori: "Fiqih", jenis_buku: "ebook", file_url: "https://ilmiyyah.com/archives/10190", foto_sampul: null },
  { id: "ilm-12", judul: "Panduan Zakat Minimal 2,5%", penulis: "Muhammad Abduh Tuasikal", kategori: "Fiqih", jenis_buku: "ebook", file_url: "https://ilmiyyah.com/archives/5427", foto_sampul: null },
  { id: "ilm-13", judul: "Dzikir Pagi & Petang", penulis: "Tim Ilmiyyah", kategori: "Doa & Dzikir", jenis_buku: "ebook", file_url: "https://ilmiyyah.com/archives/3784", foto_sampul: null },
  { id: "ilm-14", judul: "Misteri Kedahsyatan Dzikir dan Doa", penulis: "Tim Ilmiyyah", kategori: "Doa & Dzikir", jenis_buku: "ebook", file_url: "https://ilmiyyah.com/archives/10212", foto_sampul: null },
  { id: "ilm-15", judul: "Aneh dan Lucu - 100 Kisah Menarik", penulis: "Abu Ubaidah Yusuf", kategori: "Sirah & Kisah", jenis_buku: "ebook", file_url: "https://ilmiyyah.com/archives/3776", foto_sampul: null },
  { id: "ilm-16", judul: "Rindu Tanah Suci Makkah dan Madinah", penulis: "Tim Ilmiyyah", kategori: "Sirah & Kisah", jenis_buku: "ebook", file_url: "https://ilmiyyah.com/archives/6599", foto_sampul: null },
  { id: "ilm-17", judul: "Sehat Dan Mabrur Saat Haji Dan Umrah", penulis: "Tim Kesehatan Muslim", kategori: "Kesehatan", jenis_buku: "ebook", file_url: "https://ilmiyyah.com/archives/10224", foto_sampul: null },
  { id: "ilm-18", judul: "Ensiklopedi Khitan", penulis: "Tim Kesehatan Muslim", kategori: "Kesehatan", jenis_buku: "ebook", file_url: "https://ilmiyyah.com/archives/10192", foto_sampul: null },
  { id: "ilm-19", judul: "Tuntunan Ibadah Ramadhan di Tengah Wabah", penulis: "Tim Ilmiyyah", kategori: "Fiqih", jenis_buku: "ebook", file_url: "https://ilmiyyah.com/archives/10229", foto_sampul: null },
  { id: "ilm-20", judul: "54 Soal Jawab Aqidah", penulis: "Syaikh Muhammad bin Jamil Zainu", kategori: "Aqidah", jenis_buku: "ebook", file_url: "https://ilmiyyah.com/archives/6665", foto_sampul: null }
];

export function Dashboard({ user, onLogout, showToast }: { user: User; onLogout: () => void; showToast: (m: string, ok?: boolean) => void }) {
  const [activeTab, setActiveTab] = useState<string | null>(null);
  const [books, setBooks] = useState<any[]>([]);
  const [videos, setVideos] = useState<any[]>([]);
  const [docs, setDocs] = useState<any[]>([]);
  const [galeri, setGaleri] = useState<any[]>([]);
  const [labPCs, setLabPCs] = useState<any[]>([]);
  const [poinUser, setPoinUser] = useState(user.saldo_poin || 0);
  const [searchQuery, setSearchQuery] = useState("");

  useEffect(() => {
    if (!isSupabaseReady()) {
      setBooks(ILMIYYAH_EBOOKS);
      return;
    }
    (async () => {
      const [b, v, d, g, l] = await Promise.all([
        supabase.from("buku_perpustakaan").select("*").order("judul"),
        supabase.from("video_pembelajaran").select("*").order("created_at", { ascending: false }),
        supabase.from("dokumen_hub").select("*").order("created_at", { ascending: false }),
        supabase.from("galeri_hub").select("*").order("created_at", { ascending: false }),
        supabase.from("lab_komputer").select("*").order("nomor_pc"),
      ]);
      if (b.data) setBooks([...b.data, ...ILMIYYAH_EBOOKS]);
      else setBooks(ILMIYYAH_EBOOKS);
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

  const backBtn = <button className="lh-btn" onClick={() => setActiveTab(null)} style={{ padding: "8px 18px", borderRadius: 10, background: "rgba(47,143,78,.06)", color: "var(--ts)", fontSize: 12, fontWeight: 600, marginBottom: 20, border: "1px solid rgba(47,143,78,.1)", display: "flex", alignItems: "center", gap: 6 }}><ArrowLeft size={14}/> Kembali ke Menu</button>;
  const empty = (t: string) => <div style={{ textAlign: "center", padding: "56px 20px", color: "var(--tm)", fontSize: 14, opacity: .6, display: "flex", flexDirection: "column", alignItems: "center", gap: 12 }}><Inbox size={40} style={{ opacity: .3 }}/>{t}</div>;
  const secTitle = (t: string, icon?: React.ReactNode) => <h3 className="fnt" style={{ fontSize: 24, fontWeight: 600, color: "var(--fo)", marginBottom: 16, display: "flex", alignItems: "center", gap: 10 }}>{icon} {t}</h3>;
  const searchBar = (
    <div style={{ marginBottom: 24, position: "relative" }}>
      <input 
        type="text" 
        placeholder="Cari judul, penulis, atau kategori..." 
        value={searchQuery}
        onChange={(e) => setSearchQuery(e.target.value)}
        style={{ width: "100%", padding: "14px 20px 14px 44px", borderRadius: 14, border: "1.5px solid rgba(47,143,78,.2)", background: "var(--cw)", fontSize: 15, outline: "none", color: "var(--tp)", boxShadow: "0 4px 12px rgba(0,0,0,.03)", WebkitAppearance: "none" }}
      />
      <Search size={18} style={{ position: "absolute", left: 16, top: "50%", transform: "translateY(-50%)", color: "var(--accent)" }} />
    </div>
  );

  function getYtId(url: string) {
    if (!url) return null;
    const match = url.match(/^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|&v=)([^#&?]*).*/);
    return (match && match[2].length === 11) ? match[2] : null;
  }

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

    if (activeTab === "ebook") {
      const eBooks = books.filter(b => b.jenis_buku === "ebook");
      const filtered = eBooks.filter(b => (b.judul + " " + (b.penulis||"") + " " + (b.kategori||"")).toLowerCase().includes(searchQuery.toLowerCase()));

      const renderGrid = (list: any[]) => (
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill,minmax(110px,1fr))", gap: 12 }}>
          {list.map(b => (
            <div 
              key={b.id} 
              style={{ 
                position: "relative", 
                borderRadius: 14, 
                overflow: "hidden", 
                aspectRatio: "3/4", 
                boxShadow: "0 10px 30px rgba(0,0,0,0.08)",
                border: "1px solid rgba(47,143,78,.1)",
                background: "#f0f0f0",
                cursor: "pointer"
              }}
              onMouseEnter={(e) => {
                const overlay = e.currentTarget.querySelector('.ebook-overlay') as HTMLElement;
                const info = e.currentTarget.querySelector('.ebook-info') as HTMLElement;
                if (overlay) overlay.style.opacity = '1';
                if (info) info.style.transform = 'translateY(0)';
              }}
              onMouseLeave={(e) => {
                const overlay = e.currentTarget.querySelector('.ebook-overlay') as HTMLElement;
                const info = e.currentTarget.querySelector('.ebook-info') as HTMLElement;
                if (overlay) overlay.style.opacity = '0';
                if (info) info.style.transform = 'translateY(20px)';
              }}
            >
              {/* PDF Preview via Iframe atau Foto Sampul */}
              {b.foto_sampul ? (
                 <img src={b.foto_sampul} alt="" style={{width: "100%", height: "100%", objectFit: "cover"}} />
              ) : (
                <div style={{ position: "absolute", inset: 0, background: "linear-gradient(135deg, var(--fo) 0%, var(--accent-dark) 100%)", display: "flex", flexDirection: "column", padding: "16px 12px", color: "white" }}>
                  <div style={{ fontSize: 9, fontWeight: 800, color: "var(--accent-light)", marginBottom: "auto", textTransform: "uppercase", letterSpacing: "1px" }}>PDF • {b.kategori || "E-Book"}</div>
                  <h3 style={{ fontSize: 15, fontWeight: 800, margin: "0 0 6px", lineHeight: 1.2, display: "-webkit-box", WebkitLineClamp: 4, WebkitBoxOrient: "vertical", overflow: "hidden" }}>{b.judul}</h3>
                  <div style={{ fontSize: 10, opacity: 0.8, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{b.penulis || "Ciburial Hub"}</div>
                </div>
              )}

              {/* Hover Overlay Animation */}
              <div 
                className="ebook-overlay"
                style={{ 
                  position: "absolute", inset: 0, 
                  background: "linear-gradient(to top, rgba(28,58,43,0.95) 0%, rgba(28,58,43,0.7) 40%, rgba(28,58,43,0.2) 100%)", 
                  opacity: 0, transition: "all 0.3s ease",
                  display: "flex", flexDirection: "column", justifyContent: "flex-end", padding: 12,
                  zIndex: 2
                }}
              >
                <div 
                  className="ebook-info"
                  style={{ transform: "translateY(20px)", transition: "all 0.3s cubic-bezier(0.4, 0, 0.2, 1)", color: "white" }}
                >
                  <div style={{ fontSize: 9, fontWeight: 800, color: "var(--accent-light)", marginBottom: 4, letterSpacing: "0.5px", textTransform: "uppercase", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{b.kategori}</div>
                  <h3 style={{ fontSize: 13, fontWeight: 800, margin: "0 0 4px", lineHeight: 1.2, textShadow: "0 2px 4px rgba(0,0,0,0.5)", display: "-webkit-box", WebkitLineClamp: 3, WebkitBoxOrient: "vertical", overflow: "hidden" }}>{b.judul}</h3>
                  <div style={{ fontSize: 10, color: "rgba(255,255,255,0.8)", marginBottom: 12, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{b.penulis || "—"}</div>
                  
                  {b.file_url && (
                    <a href={b.file_url} target="_blank" rel="noopener noreferrer" style={{ display: "block", background: "var(--accent)", color: "white", padding: "8px", borderRadius: 8, fontSize: 11, fontWeight: 700, textDecoration: "none", textAlign: "center", transition: "background 0.2s", boxShadow: "0 4px 12px rgba(47,143,78,0.4)" }}>
                      📖 Baca
                    </a>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      );

      return (
        <div>
          {backBtn}
          <div style={{marginBottom: 16}}>
            {secTitle("Rak E-Book Digital", <Smartphone size={24} />)}
            {searchBar}
            {filtered.length === 0 ? empty("E-Book tidak ditemukan") : searchQuery ? renderGrid(filtered) : (
              <div style={{ display: "flex", flexDirection: "column", gap: 32 }}>
                {Array.from(new Set(filtered.map(b => b.kategori || "Umum"))).sort().map(kat => (
                  <div key={kat as string}>
                    <div style={{ fontSize: 16, fontWeight: 800, color: "var(--tp)", marginBottom: 12, display: "flex", alignItems: "center", gap: 8, paddingBottom: 8, borderBottom: "1.5px dashed rgba(47,143,78,.15)" }}>
                      <Bookmark size={16} color="var(--accent)" /> Rak: {kat}
                    </div>
                    {renderGrid(filtered.filter(b => (b.kategori || "Umum") === kat))}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      );
    }

    if (activeTab === "perpus") {
      const fisikBooks = books.filter(b => b.jenis_buku !== "ebook");
      const filtered = fisikBooks.filter(b => (b.judul + " " + (b.penulis||"") + " " + (b.kategori||"")).toLowerCase().includes(searchQuery.toLowerCase()));

      const renderGrid = (list: any[]) => (
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill,minmax(140px,1fr))", gap: 16 }}>
          {list.map(b => (
            <div key={b.id} className="lh-card" style={{ display: "flex", flexDirection: "column", padding: 12, borderRadius: 16 }}>
              <div style={{ width: "100%", aspectRatio: "3/4", borderRadius: 10, overflow: "hidden", marginBottom: 12, background: "var(--cr)", display: "flex", alignItems: "center", justifyContent: "center", border: "1px solid rgba(0,0,0,0.05)" }}>
                {b.foto_sampul ? <img src={b.foto_sampul} alt="" style={{width: "100%", height: "100%", objectFit: "cover"}} loading="lazy" /> : <div style={{ color: "var(--tm)", opacity: 0.3 }}><Book size={40} /></div>}
              </div>
              <div style={{ flex: 1, display: "flex", flexDirection: "column" }}>
                <div style={{ fontSize: 10, fontWeight: 800, color: "var(--accent)", marginBottom: 4, textTransform: "uppercase", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{b.kategori}</div>
                <div style={{ fontSize: 14, fontWeight: 800, color: "var(--tp)", marginBottom: 4, lineHeight: 1.2, display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical", overflow: "hidden" }}>{b.judul}</div>
                <div style={{ fontSize: 11, color: "var(--tm)", marginBottom: 12, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{b.penulis || "—"}</div>
                
                <div style={{ marginTop: "auto", display: "flex", alignItems: "center", justifyContent: "center", background: b.status === "tersedia" ? "var(--gb)" : "var(--rb)", padding: "8px 10px", borderRadius: 8, gap: 6 }}>
                  {b.status === "tersedia" ? <CheckCircle size={12} color="var(--gt)" /> : <LogOut size={12} color="var(--rt)" />}
                  <span style={{ fontSize: 11, fontWeight: 700, color: b.status === "tersedia" ? "var(--gt)" : "var(--rt)" }}>{b.status === "tersedia" ? "Tersedia" : "Dipinjam"}</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      );

      return (
        <div>
          {backBtn}
          <div style={{marginBottom: 16}}>
            {secTitle("Perpustakaan Desa", <Book size={24} />)}
            {searchBar}
            {filtered.length === 0 ? empty("Buku fisik tidak ditemukan") : searchQuery ? renderGrid(filtered) : (
              <div style={{ display: "flex", flexDirection: "column", gap: 32 }}>
                {Array.from(new Set(filtered.map(b => b.kategori || "Umum"))).sort().map(kat => (
                  <div key={kat as string}>
                    <div style={{ fontSize: 16, fontWeight: 800, color: "var(--tp)", marginBottom: 12, display: "flex", alignItems: "center", gap: 8, paddingBottom: 8, borderBottom: "1.5px dashed rgba(47,143,78,.15)" }}>
                      <Bookmark size={16} color="var(--accent)" /> Rak: {kat}
                    </div>
                    {renderGrid(filtered.filter(b => (b.kategori || "Umum") === kat))}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      );
    }

    if (activeTab === "lab") return <div>{backBtn}{secTitle("Lab Komputer", <Laptop size={24} />)}{labPCs.length === 0 ? empty("Data lab belum tersedia") : <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(150px,1fr))", gap: 12 }}>{labPCs.map(pc => (
      <div key={pc.id} className="lh-card" style={{ padding: 20, textAlign: "center", display: "flex", flexDirection: "column", alignItems: "center", gap: 8 }}>
        <div style={{ color: "var(--fo)" }}><Monitor size={36} /></div>
        <div style={{ fontSize: 14, fontWeight: 700, color: "var(--tp)" }}>PC-{pc.nomor_pc}</div>
        <span className="lh-badge" style={{ marginTop: 8, background: pc.status === "tersedia" ? "var(--gb)" : "rgba(255,180,50,.1)", color: pc.status === "tersedia" ? "var(--gt)" : "#B8943F", display: "flex", alignItems: "center", gap: 4 }}>
          {pc.status === "tersedia" ? <CheckCircle size={10}/> : <Info size={10}/>} {pc.status || "tersedia"}
        </span>
      </div>))}</div>}</div>;

    if (activeTab === "video") return (
      <div>
        {backBtn}
        {secTitle("Video Pembelajaran", <PlaySquare size={24} />)}
        {videos.length === 0 ? empty("Video belum tersedia") : (
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill,minmax(240px,1fr))", gap: 20 }}>
            {videos.map(v => {
              const ytId = getYtId(v.url);
              const thumbUrl = ytId ? `https://img.youtube.com/vi/${ytId}/hqdefault.jpg` : null;
              return (
                <a key={v.id} href={v.url} target="_blank" rel="noopener noreferrer" className="lh-card" style={{ display: "flex", flexDirection: "column", textDecoration: "none", overflow: "hidden", padding: 0 }}>
                  <div style={{ width: "100%", aspectRatio: "16/9", background: "linear-gradient(135deg, rgba(139,92,246,0.1), rgba(139,92,246,0.02))", position: "relative" }}>
                    {thumbUrl ? (
                      <img src={thumbUrl} alt="" style={{width: "100%", height: "100%", objectFit: "cover"}} loading="lazy" />
                    ) : (
                      <div style={{width: "100%", height: "100%", display: "flex", alignItems: "center", justifyContent: "center", color: "#8B5CF6"}}><PlaySquare size={40} /></div>
                    )}
                    {v.durasi && (
                      <div style={{ position: "absolute", bottom: 8, right: 8, background: "rgba(0,0,0,0.8)", color: "white", fontSize: 11, fontWeight: 600, padding: "3px 6px", borderRadius: 4 }}>
                        {v.durasi}
                      </div>
                    )}
                  </div>
                  <div style={{ padding: 16 }}>
                    <div style={{ fontSize: 15, fontWeight: 700, color: "var(--tp)", marginBottom: 6, lineHeight: 1.3, display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical", overflow: "hidden" }}>{v.judul}</div>
                    <div style={{ fontSize: 12, color: "var(--tm)", display: "flex", alignItems: "center", gap: 6 }}>
                      <span style={{ padding: "2px 8px", background: "rgba(139,92,246,0.1)", color: "#8B5CF6", borderRadius: 4, fontWeight: 600, fontSize: 10 }}>{v.kategori || "Umum"}</span>
                    </div>
                  </div>
                </a>
              );
            })}
          </div>
        )}
      </div>
    );

    if (activeTab === "dokumen") return <div>{backBtn}{secTitle("Dokumen & PDF", <FileText size={24} />)}{docs.length === 0 ? empty("Dokumen belum tersedia") : <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>{docs.map(d => (
      <a key={d.id} href={d.url} target="_blank" rel="noopener noreferrer" className="lh-card" style={{ padding: 18, display: "flex", alignItems: "center", gap: 16, textDecoration: "none" }}>
        <div style={{ width: 46, height: 46, borderRadius: 12, background: "rgba(244,63,94,.08)", border: "1.5px solid rgba(244,63,94,.15)", display: "flex", alignItems: "center", justifyContent: "center", color: "#F43F5E", flexShrink: 0 }}><FileText size={24} /></div>
        <div style={{ flex: 1 }}>
          <div style={{ fontSize: 15, fontWeight: 700, color: "var(--tp)" }}>{d.judul}</div>
          <div style={{ fontSize: 12, color: "var(--tm)", marginTop: 2 }}>{d.tipe || "PDF"} · {d.ukuran || "—"}</div>
        </div>
        <span style={{ fontSize: 12, color: "#F43F5E", fontWeight: 700, display: "flex", alignItems: "center", gap: 4 }}>Unduh <ChevronRight size={14}/></span>
      </a>))}</div>}</div>;

    if (activeTab === "galeri") return <div>{backBtn}{secTitle("Galeri Kegiatan", <ImageIcon size={24} />)}{galeri.length === 0 ? empty("Galeri belum tersedia") : <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(180px,1fr))", gap: 12 }}>{galeri.map(g => (
      <div key={g.id} style={{ borderRadius: 18, overflow: "hidden", aspectRatio: "4/3", position: "relative", border: "1.5px solid rgba(47,143,78,.1)" }}>
        <img src={g.url} alt={g.judul || ""} style={{ width: "100%", height: "100%", objectFit: "cover" }} loading="lazy" />
        {g.judul && <div style={{ position: "absolute", bottom: 0, left: 0, right: 0, padding: "10px 14px", background: "linear-gradient(transparent,rgba(0,0,0,.6))", fontSize: 12, color: "#fff", fontWeight: 600 }}>{g.judul}</div>}
      </div>))}</div>}</div>;

    return null;
  }

  return (
    <div style={{ position: "relative", zIndex: 1 }}>
      {/* Dashboard Header */}
      <header style={{ background: "var(--cw)", borderBottom: "1.5px solid rgba(47,143,78,.08)", padding: "16px clamp(16px, 4vw, 24px)", display: "flex", alignItems: "center", justifyContent: "space-between", position: "sticky", top: 0, zIndex: 10, boxShadow: "0 2px 16px rgba(28,58,43,.04)" }}>
        <div>
          <div style={{ fontSize: 9, fontWeight: 700, letterSpacing: ".2em", color: "var(--accent)", textTransform: "uppercase" }}>CIBURIAL LEARNING HUB</div>
          <div style={{ fontSize: 18, fontWeight: 800, color: "var(--fo)", letterSpacing: "-.03em", marginTop: 2 }}>
            Dashboard<span style={{ color: "var(--accent)" }}>.</span>
          </div>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <div className="hidden sm:block" style={{ textAlign: "right" }}>
            <div style={{ fontSize: 13, fontWeight: 700, color: "var(--tp)" }}>{user.nama}</div>
            <div style={{ fontSize: 11, color: "var(--accent)", fontWeight: 600 }}>
              {user.tipe === "warga" ? `🌿 ${poinUser} poin` : "🌍 Pengguna Umum"}
            </div>
          </div>
          <button onClick={onLogout} className="lh-btn" style={{ padding: "7px 12px", borderRadius: 8, background: "var(--rb)", border: "1px solid rgba(139,32,32,.1)", color: "var(--rt)", fontSize: 11, fontWeight: 700 }}>Keluar</button>
        </div>
      </header>

      <div style={{ maxWidth: 1100, margin: "0 auto", padding: "28px clamp(16px, 4vw, 24px) 60px" }}>
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
