"use client";
import { useState, useEffect } from "react";

/* ─────────────────────────────────────────────
   CATATAN: Tambahkan ke app/layout.tsx <head>:
   <link href="https://fonts.googleapis.com/css2?family=Cormorant+Garamond:ital,wght@0,300;0,400;0,600;0,700;1,300;1,400&family=DM+Sans:opsz,wght@9..40,300;9..40,400;9..500;9..600;9..700&display=swap" rel="stylesheet" />
───────────────────────────────────────────── */

// ─── TIPE DATA ───────────────────────────────
type TabType = "tentang" | "proposal" | "transparansi" | "marketplace";

interface Transaksi {
  id: number;
  tanggal: string;
  keterangan: string;
  kategori: string;
  tipe: "masuk" | "keluar";
  jumlah: number;
  bukti?: string;
}

// ─── DATA TRANSAKSI (edit bebas sesuai kondisi real) ──────────────────────────
const DATA_TRANSAKSI: Transaksi[] = [
  { id: 1, tanggal: "2026-01-15", keterangan: "Donasi Ust. Kurniadin & jamaah", kategori: "Donasi Warga", tipe: "masuk", jumlah: 500000 },
  { id: 2, tanggal: "2026-01-20", keterangan: "Donasi CSR PT. Sejahtera Garut", kategori: "Donasi Institusi", tipe: "masuk", jumlah: 2000000 },
  { id: 3, tanggal: "2026-02-01", keterangan: "Pembelian material tiang PJU (2 unit)", kategori: "Smart PJU", tipe: "keluar", jumlah: 850000 },
  { id: 4, tanggal: "2026-02-05", keterangan: "Donasi online via QRIS (Februari)", kategori: "Donasi Online", tipe: "masuk", jumlah: 750000 },
  { id: 5, tanggal: "2026-02-10", keterangan: "Pembelian bola lampu LED Solar 20W (4 buah)", kategori: "Smart PJU", tipe: "keluar", jumlah: 480000 },
  { id: 6, tanggal: "2026-02-18", keterangan: "Donasi perantau Ciburial (transfer bank)", kategori: "Donasi Perantau", tipe: "masuk", jumlah: 1200000 },
  { id: 7, tanggal: "2026-03-01", keterangan: "Kas DKM bulan Maret", kategori: "DKM", tipe: "keluar", jumlah: 300000 },
  { id: 8, tanggal: "2026-03-10", keterangan: "Pembelian 2 buku koleksi Learning Hub", kategori: "Learning Hub", tipe: "keluar", jumlah: 180000 },
  { id: 9, tanggal: "2026-03-15", keterangan: "Donasi online via QRIS (Maret)", kategori: "Donasi Online", tipe: "masuk", jumlah: 420000 },
  { id: 10, tanggal: "2026-03-22", keterangan: "Penjualan Lampu Hex-Bamboo (3 unit)", kategori: "Marketplace", tipe: "masuk", jumlah: 450000 },
];

// ─── DATA ALOKASI TARGET ────────────────────────
const ALOKASI = [
  { label: "Smart PJU & CCTV", target: 3500000, icon: "💡", color: "#2D5A40" },
  { label: "Internet Desa (RT/RW Net)", target: 2500000, icon: "📶", color: "#4A7C59" },
  { label: "Learning Hub", target: 2000000, icon: "📚", color: "#B8943F" },
  { label: "Bank Sampah & Eco-Waste", target: 1500000, icon: "♻️", color: "#6B4F3A" },
  { label: "DKM & Sosial", target: 1000000, icon: "🕌", color: "#8A7065" },
  { label: "Marketplace Digital", target: 1000000, icon: "🛒", color: "#3D5C8A" },
];

// ─── HELPER ─────────────────────────────────────
const formatRp = (n: number) =>
  "Rp " + n.toLocaleString("id-ID");

export default function Home() {
  const [activeTab, setActiveTab] = useState<TabType>("tentang");
  const [showCheckout, setShowCheckout] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [filterTipe, setFilterTipe] = useState<"semua" | "masuk" | "keluar">("semua");
  const [proposalSection, setProposalSection] = useState<number | null>(null);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 40);
    window.addEventListener("scroll", onScroll);
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => entries.forEach((e) => { if (e.isIntersecting) e.target.classList.add("is-visible"); }),
      { threshold: 0.1 }
    );
    document.querySelectorAll(".reveal").forEach((el) => observer.observe(el));
    return () => observer.disconnect();
  }, [activeTab, showCheckout]);

  // ─── KALKULASI DONASI ──────────────────────
  const totalMasuk = DATA_TRANSAKSI.filter((t) => t.tipe === "masuk").reduce((s, t) => s + t.jumlah, 0);
  const totalKeluar = DATA_TRANSAKSI.filter((t) => t.tipe === "keluar").reduce((s, t) => s + t.jumlah, 0);
  const saldo = totalMasuk - totalKeluar;
  const totalTarget = ALOKASI.reduce((s, a) => s + a.target, 0);

  // Dana per kategori (untuk progress alokasi)
  const danaPerKategori: Record<string, number> = {};
  DATA_TRANSAKSI.filter((t) => t.tipe === "keluar").forEach((t) => {
    danaPerKategori[t.kategori] = (danaPerKategori[t.kategori] || 0) + t.jumlah;
  });

  const transaksiFiltered =
    filterTipe === "semua" ? DATA_TRANSAKSI : DATA_TRANSAKSI.filter((t) => t.tipe === filterTipe);

  // Paguyuban data
  const orgDesa = [
    { role: "Tokoh Agama / Pelindung", name: "Ust. Kurniadin", icon: "🕌" },
    { role: "Ketua RW / Pelindung", name: "Bpk. Enang", icon: "🏘️" },
    { role: "Pengelola DKM", name: "Bpk. Pupu Apipudin", icon: "🤲" },
  ];
  const orgRT = [
    { role: "Ketua RT 01", name: "Sarip Hidayat" },
    { role: "Ketua RT 02", name: "Oneng" },
    { role: "Ketua RT 03", name: "mumun" },
  ];
  const orgPemuda = [
    { role: "Ketua", name: "aa bayet" },
    { role: "Wakil Ketua", name: "— Soon —" },
    { role: "Sekretaris", name: "— Soon —" },
    { role: "Bendahara", name: "— Soon —" },
  ];

  const tabs: { key: TabType; label: string }[] = [
    { key: "tentang", label: "Tentang Kampung" },
    { key: "proposal", label: "Proposal" },
    { key: "transparansi", label: "Transparansi Dana" },
    { key: "marketplace", label: "Marketplace" },
  ];

  const navTo = (tab: TabType) => {
    setActiveTab(tab);
    setShowCheckout(false);
    setMobileMenuOpen(false);
  };

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Cormorant+Garamond:ital,wght@0,300;0,400;0,600;0,700;1,300;1,400&family=DM+Sans:opsz,wght@9..40,300;9..40,400;9..500;9..600;9..700&display=swap');
        :root {
          --forest:#1C3A2B; --forest-mid:#2D5A40; --forest-light:#4A7C59;
          --cream:#FAF8F3; --cream-dark:#F0EDE5; --warm-white:#FFFEF9;
          --gold:#B8943F; --gold-light:#D4AC5A;
          --earth:#3D2B1F; --earth-mid:#6B4F3A; --earth-light:#A08070;
          --text-primary:#1A1410; --text-secondary:#5A4A40; --text-muted:#9A8C85;
          --border:#E5E0D8;
          --green-badge:#E8F5EE; --green-badge-text:#1C6B3A;
          --red-badge:#FDF0F0; --red-badge-text:#8B2020;
        }
        *{box-sizing:border-box;margin:0;padding:0;}
        body{background:var(--cream);color:var(--text-primary);font-family:'DM Sans',sans-serif;}
        .font-display{font-family:'Cormorant Garamond',serif;}

        /* reveal */
        .reveal{opacity:0;transform:translateY(28px);transition:opacity .75s cubic-bezier(.22,1,.36,1),transform .75s cubic-bezier(.22,1,.36,1);}
        .reveal.is-visible{opacity:1;transform:translateY(0);}
        .d1{transition-delay:.08s}.d2{transition-delay:.16s}.d3{transition-delay:.24s}.d4{transition-delay:.32s}.d5{transition-delay:.4s}

        /* hero anim */
        @keyframes fadeUp{from{opacity:0;transform:translateY(44px)}to{opacity:1;transform:translateY(0)}}
        .h1{animation:fadeUp .9s cubic-bezier(.22,1,.36,1) .05s both}
        .h2{animation:fadeUp .9s cubic-bezier(.22,1,.36,1) .2s both}
        .h3{animation:fadeUp .9s cubic-bezier(.22,1,.36,1) .35s both}
        .h4{animation:fadeUp .9s cubic-bezier(.22,1,.36,1) .48s both}
        .h5{animation:fadeUp .9s cubic-bezier(.22,1,.36,1) .6s both}

        /* page-in */
        @keyframes pageIn{from{opacity:0;transform:translateY(20px)}to{opacity:1;transform:translateY(0)}}
        .page-in{animation:pageIn .45s cubic-bezier(.22,1,.36,1) both}

        /* nav */
        .nav-glass{background:rgba(250,248,243,.96)!important;box-shadow:0 1px 0 var(--border);}

        /* marquee */
        @keyframes marquee{from{transform:translateX(0)}to{transform:translateX(-50%)}}
        .marquee-track{animation:marquee 22s linear infinite}
        .marquee-track:hover{animation-play-state:paused}

        /* btn */
        .btn{position:relative;overflow:hidden;transition:color .3s;}
        .btn::before{content:'';position:absolute;inset:0;background:var(--gold);transform:translateX(-105%);transition:transform .4s cubic-bezier(.22,1,.36,1);}
        .btn:hover::before{transform:translateX(0);}
        .btn span{position:relative;z-index:1;}

        /* card hover */
        .card-hover{transition:transform .35s cubic-bezier(.22,1,.36,1),box-shadow .35s ease;}
        .card-hover:hover{transform:translateY(-6px);box-shadow:0 20px 56px rgba(28,58,43,.11);}

        /* input */
        .field{border:1px solid var(--border);background:var(--warm-white);transition:border-color .25s,box-shadow .25s;outline:none;font-family:'DM Sans',sans-serif;width:100%;border-radius:12px;padding:14px 18px;font-size:14px;}
        .field:focus{border-color:var(--forest-mid);box-shadow:0 0 0 3px rgba(45,90,64,.08);}

        /* deco line */
        .dl{display:inline-block;width:44px;height:2px;background:var(--gold);margin-bottom:22px;}
        .dl-c{display:block;margin:0 auto 22px;}

        /* progress */
        .prog{height:5px;background:var(--cream-dark);border-radius:99px;overflow:hidden;}
        .prog-fill{height:100%;border-radius:99px;transition:width 1.2s cubic-bezier(.22,1,.36,1) .2s;}
        .prog-wrap:not(.is-visible) .prog-fill{width:0!important;}

        /* badge */
        .badge-masuk{background:var(--green-badge);color:var(--green-badge-text);padding:3px 10px;border-radius:99px;font-size:11px;font-weight:700;letter-spacing:.06em;}
        .badge-keluar{background:var(--red-badge);color:var(--red-badge-text);padding:3px 10px;border-radius:99px;font-size:11px;font-weight:700;letter-spacing:.06em;}

        /* table */
        .tbl{width:100%;border-collapse:collapse;}
        .tbl th{font-size:10px;font-weight:700;letter-spacing:.14em;text-transform:uppercase;color:var(--text-muted);padding:12px 16px;text-align:left;border-bottom:1px solid var(--border);}
        .tbl td{font-size:13px;padding:14px 16px;border-bottom:1px solid var(--border);color:var(--text-secondary);vertical-align:middle;}
        .tbl tr:last-child td{border-bottom:none;}
        .tbl tr:hover td{background:var(--cream);}

        /* accordion */
        .acc-content{max-height:0;overflow:hidden;transition:max-height .45s cubic-bezier(.22,1,.36,1);}
        .acc-content.open{max-height:600px;}

        /* scrollbar */
        ::-webkit-scrollbar{width:5px;}
        ::-webkit-scrollbar-track{background:var(--cream);}
        ::-webkit-scrollbar-thumb{background:var(--earth-light);border-radius:99px;}

        /* mobile menu */
        .mob-menu{opacity:0;transform:translateY(-10px);pointer-events:none;transition:opacity .25s,transform .25s cubic-bezier(.22,1,.36,1);}
        .mob-menu.open{opacity:1;transform:translateY(0);pointer-events:all;}

        /* stat num */
        @keyframes scaleIn{from{opacity:0;transform:scale(.8)}to{opacity:1;transform:scale(1)}}
        .stat-card.is-visible .snum{animation:scaleIn .6s cubic-bezier(.34,1.56,.64,1) forwards;}
      `}</style>

      <main style={{ minHeight: "100vh", background: "var(--cream)" }}>

        {/* ═══════ NAVBAR ═══════ */}
        <nav
          className={scrolled ? "nav-glass" : ""}
          style={{
            position: "fixed", top: 0, width: "100%", zIndex: 50,
            transition: "background .3s, box-shadow .3s",
            background: scrolled ? undefined : "transparent",
          }}
        >
          <div style={{ maxWidth: 1320, margin: "0 auto", padding: "0 28px", height: 72, display: "flex", alignItems: "center", justifyContent: "space-between" }}>
            <button onClick={() => navTo("tentang")} style={{ background: "none", border: "none", cursor: "pointer", textAlign: "left" }}>
              <div className="font-display" style={{ fontSize: 21, fontWeight: 600, color: "var(--forest)", lineHeight: 1, letterSpacing: "-.02em" }}>Ciburial</div>
              <div style={{ fontSize: 9, fontWeight: 700, letterSpacing: ".18em", textTransform: "uppercase", color: "var(--gold)" }}>Eco-Digital Village</div>
            </button>

            {/* Desktop nav */}
            <div className="hidden md:flex" style={{ gap: 4 }}>
              {tabs.map((t) => (
                <button key={t.key} onClick={() => navTo(t.key)} style={{
                  padding: "9px 18px", fontSize: 11, fontWeight: 600, letterSpacing: ".09em",
                  textTransform: "uppercase", border: "none", borderRadius: 99, cursor: "pointer",
                  transition: "all .25s",
                  background: (activeTab === t.key && !(t.key === "marketplace" && showCheckout === false ? false : false))
                    || (t.key === "marketplace" && (activeTab === "marketplace" || showCheckout))
                    ? "var(--forest)" : "transparent",
                  color: activeTab === t.key || (t.key === "marketplace" && showCheckout) ? "#fff" : "var(--text-secondary)",
                }}>{t.label}</button>
              ))}
            </div>

            {/* Mobile hamburger */}
            <button className="md:hidden" onClick={() => setMobileMenuOpen(!mobileMenuOpen)} style={{ background: "none", border: "none", cursor: "pointer", padding: 8, display: "flex", flexDirection: "column", gap: 5 }}>
              <div style={{ width: 22, height: 2, background: "var(--forest)", borderRadius: 2 }} />
              <div style={{ width: 15, height: 2, background: "var(--forest)", borderRadius: 2 }} />
              <div style={{ width: 22, height: 2, background: "var(--forest)", borderRadius: 2 }} />
            </button>
          </div>

          <div className={`mob-menu md:hidden ${mobileMenuOpen ? "open" : ""}`} style={{ background: "var(--warm-white)", borderTop: "1px solid var(--border)", padding: "12px 28px 20px" }}>
            {tabs.map((t) => (
              <button key={t.key} onClick={() => navTo(t.key)} style={{
                display: "block", width: "100%", textAlign: "left",
                padding: "11px 0", fontSize: 12, fontWeight: 600, letterSpacing: ".09em", textTransform: "uppercase",
                background: "none", border: "none", color: activeTab === t.key ? "var(--forest)" : "var(--text-secondary)", cursor: "pointer",
                borderBottom: "1px solid var(--border)",
              }}>{t.label}</button>
            ))}
          </div>
        </nav>

        {/* ═══════════════════════════════════════════
            TAB 1: TENTANG KAMPUNG
        ═══════════════════════════════════════════ */}
        {activeTab === "tentang" && !showCheckout && (
          <div className="page-in">

            {/* HERO */}
            <section style={{ minHeight: "100vh", display: "flex", flexDirection: "column", justifyContent: "flex-end", padding: "0 32px 80px", position: "relative", overflow: "hidden" }}>
              <div style={{ position: "absolute", top: 0, right: 0, width: "42%", height: "100%", background: "linear-gradient(135deg, var(--forest) 0%, var(--forest-mid) 60%, var(--forest-light) 100%)", clipPath: "polygon(18% 0%, 100% 0%, 100% 100%, 0% 100%)", opacity: .055 }} />
              <div style={{ position: "absolute", bottom: 0, left: 0, width: "100%", height: "35%", background: "linear-gradient(0deg, var(--cream-dark) 0%, transparent 100%)", pointerEvents: "none" }} />

              <div className="h1" style={{ position: "absolute", top: 116, left: 32, display: "flex", alignItems: "center", gap: 10 }}>
                <div style={{ width: 28, height: 1, background: "var(--gold)" }} />
                <span style={{ fontSize: 10, fontWeight: 700, letterSpacing: ".2em", textTransform: "uppercase", color: "var(--gold)" }}>Kp. Ciburial, Garut — Est. 2026</span>
              </div>

              <div style={{ maxWidth: 1320, margin: "0 auto", width: "100%" }}>
                <div className="h2" style={{ marginBottom: 6 }}>
                  <span style={{ fontSize: 12, fontWeight: 600, letterSpacing: ".15em", textTransform: "uppercase", color: "var(--earth-mid)" }}>Selamat Datang di</span>
                </div>
                <h1 className="font-display h3" style={{ fontSize: "clamp(64px, 12vw, 156px)", fontWeight: 300, lineHeight: .9, color: "var(--forest)", letterSpacing: "-.03em", marginBottom: 6 }}>Ciburial</h1>
                <h2 className="font-display h4" style={{ fontSize: "clamp(26px, 5vw, 60px)", fontWeight: 600, fontStyle: "italic", color: "var(--gold)", letterSpacing: "-.02em", marginBottom: 36 }}>Eco-Digital Village</h2>
                <div className="h5" style={{ display: "flex", flexWrap: "wrap", gap: 16, alignItems: "flex-end" }}>
                  <p style={{ maxWidth: 480, fontSize: 15, fontWeight: 400, lineHeight: 1.8, color: "var(--text-secondary)" }}>
                    Dari bambu jadi cahaya. Dari desa jadi masa depan.<br />
                    Membangun komunitas mandiri, berkelanjutan, dan terhubung dunia lewat teknologi dan gotong royong.
                  </p>
                  <div style={{ display: "flex", gap: 10, flexWrap: "wrap", marginLeft: "auto" }}>
                    {["🌱 Pertanian", "🐄 Peternakan", "🎋 Kerajinan Bambu", "💡 Smart PJU", "♻️ Eco-Waste", "📚 Learning Hub"].map((tag) => (
                      <span key={tag} style={{ padding: "7px 14px", fontSize: 11, fontWeight: 600, border: "1px solid var(--border)", borderRadius: 99, color: "var(--text-secondary)", background: "var(--warm-white)" }}>{tag}</span>
                    ))}
                  </div>
                </div>
              </div>
            </section>

            {/* MARQUEE */}
            <div style={{ background: "var(--forest)", overflow: "hidden", padding: "13px 0" }}>
              <div className="marquee-track" style={{ display: "flex", whiteSpace: "nowrap", width: "max-content" }}>
                {[...Array(4)].map((_, i) => (
                  <span key={i} style={{ display: "flex", alignItems: "center", gap: 28, padding: "0 28px", color: "rgba(255,255,255,.45)", fontSize: 10, fontWeight: 700, letterSpacing: ".2em", textTransform: "uppercase" }}>
                    {["Mandiri", "Berkelanjutan", "Inovatif", "Transparan", "Eco-Digital", "Gotong Royong"].map((w, j) => (
                      <span key={j}>{w}{j < 5 && <span style={{ color: "var(--gold-light)", margin: "0 14px" }}>✦</span>}</span>
                    ))}
                  </span>
                ))}
              </div>
            </div>

            {/* STATS */}
            <section style={{ background: "var(--warm-white)", padding: "72px 32px" }}>
              <div style={{ maxWidth: 1320, margin: "0 auto", display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(160px, 1fr))", gap: 2 }}>
                {[
                  { v: "450", l: "Jiwa", s: "Total Populasi" },
                  { v: "3", l: "RT", s: "Rukun Tetangga" },
                  { v: "55%", l: "Pemuda", s: "Generasi Penerus" },
                  { v: "7", l: "Program", s: "Unggulan" },
                  { v: "2026", l: "Berdiri", s: "Tahun Inisiatif" },
                ].map((s, i) => (
                  <div key={i} className={`reveal stat-card d${i + 1}`} style={{ padding: "44px 28px", textAlign: "center", borderRight: i < 4 ? "1px solid var(--border)" : "none" }}>
                    <div className="snum font-display" style={{ fontSize: "clamp(36px, 4.5vw, 64px)", fontWeight: 300, color: "var(--forest)", lineHeight: 1 }}>{s.v}</div>
                    <div style={{ fontSize: 16, fontWeight: 600, color: "var(--text-secondary)", marginTop: 4, marginBottom: 6 }}>{s.l}</div>
                    <div style={{ fontSize: 10, fontWeight: 700, letterSpacing: ".12em", textTransform: "uppercase", color: "var(--text-muted)" }}>{s.s}</div>
                  </div>
                ))}
              </div>
            </section>

            {/* VISI & MISI */}
            <section style={{ padding: "110px 32px", background: "var(--cream)" }}>
              <div style={{ maxWidth: 1320, margin: "0 auto", display: "flex", flexWrap: "wrap", gap: 56, alignItems: "flex-start" }}>
                <div className="reveal" style={{ flex: "0 0 280px" }}>
                  <div className="dl" />
                  <h2 className="font-display" style={{ fontSize: "clamp(34px, 4vw, 54px)", fontWeight: 300, color: "var(--forest)", lineHeight: 1.1, letterSpacing: "-.02em", marginBottom: 18 }}>Visi &<br />Misi Kami</h2>
                  <p style={{ fontSize: 14, lineHeight: 1.8, color: "var(--text-secondary)" }}>Tujuh pilar program unggulan yang membangun Ciburial dari hulu ke hilir — dari infrastruktur hingga pemasaran digital.</p>
                </div>
                <div style={{ flex: 1, minWidth: 260, display: "flex", flexDirection: "column", gap: 8 }}>
                  {[
                    { no: "01", icon: "💡", t: "Infrastruktur Cerdas & Terkoneksi", d: "Instalasi Smart PJU, Jaringan CCTV, dan Internet Mandiri (Wi-Fi Kampung) untuk desa yang aman dan terhubung." },
                    { no: "02", icon: "📚", t: "SDM Unggul (Learning Hub)", d: "Pusat edukasi terpadu — perpustakaan dan lab komputer sebagai inkubator generasi muda Ciburial." },
                    { no: "03", icon: "♻️", t: "Ekologi & Ekonomi Sirkular", d: "Mengubah masalah sampah menjadi sumber pendapatan melalui Bank Sampah Digital dan upcycling limbah." },
                    { no: "04", icon: "🌱", t: "Perdagangan Digital Lokal", d: "Marketplace desa untuk karya bambu, hasil tani, dan produk daur ulang yang menjangkau pasar global." },
                    { no: "05", icon: "📊", t: "Tata Kelola Transparan", d: "Kas donasi terbuka secara real-time — dari fiat konvensional hingga aset kripto (Web3)." },
                  ].map((v, i) => (
                    <div key={i} className={`reveal card-hover d${i + 1}`}
                      style={{ padding: "26px 28px", background: "var(--warm-white)", borderRadius: 16, border: "1px solid var(--border)", display: "flex", gap: 20, alignItems: "flex-start" }}
                      onMouseEnter={e => (e.currentTarget.style.background = "var(--cream-dark)")}
                      onMouseLeave={e => (e.currentTarget.style.background = "var(--warm-white)")}
                    >
                      <span className="font-display" style={{ fontSize: 12, fontWeight: 700, color: "var(--gold)", minWidth: 28, paddingTop: 2 }}>{v.no}</span>
                      <span style={{ fontSize: 24 }}>{v.icon}</span>
                      <div>
                        <div style={{ fontSize: 15, fontWeight: 700, color: "var(--text-primary)", marginBottom: 4 }}>{v.t}</div>
                        <div style={{ fontSize: 13, lineHeight: 1.7, color: "var(--text-secondary)", fontWeight: 400 }}>{v.d}</div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </section>

            {/* DEMOGRAFI */}
            <section style={{ padding: "110px 32px", background: "var(--forest)", position: "relative" }}>
              <div style={{ maxWidth: 1320, margin: "0 auto" }}>
                <div className="reveal" style={{ textAlign: "center", marginBottom: 64 }}>
                  <div className="dl dl-c" />
                  <h2 className="font-display" style={{ fontSize: "clamp(34px, 5vw, 60px)", fontWeight: 300, color: "var(--cream)", letterSpacing: "-.02em" }}>Keluarga Besar Ciburial</h2>
                  <p style={{ color: "rgba(250,248,243,.5)", fontSize: 14, marginTop: 10, maxWidth: 440, margin: "10px auto 0" }}>Catatan jiwa yang hidup di tanah ini — pemuda mendominasi, membawa harapan baru.</p>
                </div>
                <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(260px, 1fr))", gap: 20 }}>
                  {[{ l: "Pemuda (Penerus)", pct: 55, c: "var(--gold)" }, { l: "Lansia (Sesepuh)", pct: 45, c: "rgba(250,248,243,.35)" }].map((item, i) => (
                    <div key={i} className={`reveal prog-wrap d${i + 1}`} style={{ padding: "36px", background: "rgba(255,255,255,.05)", borderRadius: 20, border: "1px solid rgba(255,255,255,.08)" }}>
                      <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 18 }}>
                        <span style={{ fontSize: 13, fontWeight: 600, color: "rgba(250,248,243,.7)" }}>{item.l}</span>
                        <span className="font-display" style={{ fontSize: 32, fontWeight: 300, color: "var(--cream)", lineHeight: 1 }}>{item.pct}%</span>
                      </div>
                      <div className="prog">
                        <div className="prog-fill" style={{ background: item.c, width: `${item.pct}%` }} />
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </section>

            {/* PAGUYUBAN */}
            <section style={{ padding: "110px 32px", background: "var(--cream)" }}>
              <div style={{ maxWidth: 1320, margin: "0 auto" }}>
                <div className="reveal" style={{ textAlign: "center", marginBottom: 64 }}>
                  <div className="dl dl-c" />
                  <h2 className="font-display" style={{ fontSize: "clamp(34px, 5vw, 60px)", fontWeight: 300, color: "var(--forest)", letterSpacing: "-.02em" }}>Paguyuban Desa</h2>
                  <p style={{ color: "var(--text-secondary)", fontSize: 14, marginTop: 10 }}>Harmoni kepengurusan yang menggerakkan Ciburial.</p>
                </div>
                <div style={{ display: "flex", justifyContent: "center", gap: 20, flexWrap: "wrap", marginBottom: 56 }}>
                  {orgDesa.map((item, i) => (
                    <div key={i} className={`reveal card-hover d${i + 1}`} style={{ width: 190, background: "var(--warm-white)", border: "1px solid var(--border)", borderRadius: 20, padding: "28px 16px 22px", textAlign: "center" }}>
                      <div style={{ width: 64, height: 64, borderRadius: "50%", background: "var(--cream-dark)", margin: "0 auto 14px", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 26, border: "2px solid var(--border)" }}>{item.icon}</div>
                      <div style={{ fontSize: 14, fontWeight: 700, color: "var(--text-primary)", marginBottom: 4 }}>{item.name}</div>
                      <div style={{ fontSize: 10, fontWeight: 700, letterSpacing: ".1em", textTransform: "uppercase", color: "var(--gold)" }}>{item.role}</div>
                    </div>
                  ))}
                </div>
                <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(260px, 1fr))", gap: 20 }}>
                  <div className="reveal" style={{ background: "var(--warm-white)", border: "1px solid var(--border)", borderRadius: 22, padding: "36px" }}>
                    <h4 style={{ fontSize: 11, fontWeight: 700, letterSpacing: ".15em", textTransform: "uppercase", color: "var(--gold)", marginBottom: 28 }}>Rukun Tetangga</h4>
                    {orgRT.map((item, i) => (
                      <div key={i} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", paddingBottom: 14, marginBottom: 14, borderBottom: i < orgRT.length - 1 ? "1px solid var(--border)" : "none" }}>
                        <span style={{ fontSize: 14, fontWeight: 600, color: "var(--text-primary)" }}>{item.name}</span>
                        <span style={{ fontSize: 10, fontWeight: 700, letterSpacing: ".07em", textTransform: "uppercase", color: "var(--text-muted)", background: "var(--cream-dark)", padding: "4px 10px", borderRadius: 99 }}>{item.role}</span>
                      </div>
                    ))}
                  </div>
                  <div className="reveal d2" style={{ background: "var(--warm-white)", border: "1px solid var(--border)", borderRadius: 22, padding: "36px" }}>
                    <h4 style={{ fontSize: 11, fontWeight: 700, letterSpacing: ".15em", textTransform: "uppercase", color: "var(--gold)", marginBottom: 28 }}>Pemuda Makers</h4>
                    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
                      {orgPemuda.map((item, i) => (
                        <div key={i} style={{ padding: "14px", background: "var(--cream)", borderRadius: 12, border: "1px solid var(--border)" }}>
                          <div style={{ fontSize: 13, fontWeight: 700, color: "var(--text-primary)", marginBottom: 3 }}>{item.name}</div>
                          <div style={{ fontSize: 10, fontWeight: 600, color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: ".06em" }}>{item.role}</div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            </section>

            {/* DONASI SPLIT */}
            <section style={{ padding: "0 32px 110px" }}>
              <div style={{ maxWidth: 1320, margin: "0 auto" }}>
                <div className="reveal" style={{ borderRadius: 28, overflow: "hidden", display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(260px, 1fr))" }}>
                  <div style={{ background: "var(--forest)", padding: "64px 52px" }}>
                    <div className="dl" />
                    <h2 className="font-display" style={{ fontSize: 38, fontWeight: 300, color: "var(--cream)", lineHeight: 1.15, letterSpacing: "-.02em", marginBottom: 14 }}>Donasi<br />Kemakmuran<br />Kampung</h2>
                    <p style={{ fontSize: 13, lineHeight: 1.85, color: "rgba(250,248,243,.55)", marginBottom: 36 }}>Salurkan dukungan Anda untuk Smart PJU, Learning Hub, Bank Sampah, dan pemberdayaan pemuda.</p>
                    <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                      {[{ icon: "📱", l: "QRIS", s: "Scan & Bayar Instan" }, { icon: "🏦", l: "Transfer Bank", s: "Rekening Resmi" }, { icon: "🌐", l: "Crypto / Web3", s: "Dompet Digital" }].map((m, i) => (
                        <div key={i} style={{ display: "flex", alignItems: "center", gap: 14, padding: "14px 18px", background: "rgba(255,255,255,.06)", borderRadius: 12, border: "1px solid rgba(255,255,255,.09)", cursor: "pointer", transition: "background .2s" }}
                          onMouseEnter={e => (e.currentTarget.style.background = "rgba(255,255,255,.11)")}
                          onMouseLeave={e => (e.currentTarget.style.background = "rgba(255,255,255,.06)")}
                        >
                          <span style={{ fontSize: 22 }}>{m.icon}</span>
                          <div>
                            <div style={{ fontSize: 13, fontWeight: 700, color: "var(--cream)" }}>{m.l}</div>
                            <div style={{ fontSize: 11, color: "rgba(250,248,243,.4)" }}>{m.s}</div>
                          </div>
                        </div>
                      ))}
                    </div>
                    <button onClick={() => navTo("transparansi")} style={{ marginTop: 20, padding: "12px 22px", borderRadius: 99, fontSize: 11, fontWeight: 700, letterSpacing: ".1em", textTransform: "uppercase", border: "1px solid rgba(255,255,255,.2)", background: "transparent", color: "rgba(250,248,243,.6)", cursor: "pointer", transition: "all .2s" }}
                      onMouseEnter={e => { (e.currentTarget as HTMLButtonElement).style.background = "rgba(255,255,255,.08)"; (e.currentTarget as HTMLButtonElement).style.color = "var(--cream)"; }}
                      onMouseLeave={e => { (e.currentTarget as HTMLButtonElement).style.background = "transparent"; (e.currentTarget as HTMLButtonElement).style.color = "rgba(250,248,243,.6)"; }}
                    >
                      Lihat Transparansi Dana →
                    </button>
                  </div>
                  <div style={{ background: "var(--earth)", padding: "64px 52px", display: "flex", flexDirection: "column", justifyContent: "center" }}>
                    <div style={{ fontSize: 10, fontWeight: 700, letterSpacing: ".2em", textTransform: "uppercase", color: "var(--gold)", marginBottom: 22 }}>Doa untuk Donatur</div>
                    <p dir="rtl" className="font-display" style={{ fontSize: "clamp(18px, 2.8vw, 28px)", lineHeight: 1.9, color: "var(--cream)", fontWeight: 400, marginBottom: 22 }}>
                      رَبَّنَا آتِنَا فِي الدُّنْيَا حَسَنَةً وَفِي الْآخِرَةِ حَسَنَةً وَقِنَا عَذَابَ النَّارِ
                    </p>
                    <p style={{ fontSize: 13, fontStyle: "italic", lineHeight: 1.85, color: "rgba(250,248,243,.5)", marginBottom: 14 }}>"Ya Tuhan kami, berilah kebaikan di dunia dan di akhirat, serta lindungilah dari siksa neraka."</p>
                    <span style={{ fontSize: 10, fontWeight: 700, letterSpacing: ".1em", textTransform: "uppercase", color: "var(--gold-light)", opacity: .7 }}>QS. Al-Baqarah: 201</span>
                  </div>
                </div>
              </div>
            </section>
          </div>
        )}

        {/* ═══════════════════════════════════════════
            TAB 2: PROPOSAL
        ═══════════════════════════════════════════ */}
        {activeTab === "proposal" && (
          <div className="page-in" style={{ paddingTop: 110, paddingBottom: 110 }}>
            <div style={{ maxWidth: 900, margin: "0 auto", padding: "0 28px" }}>

              {/* Header */}
              <div className="reveal" style={{ textAlign: "center", marginBottom: 64 }}>
                <div className="dl dl-c" />
                <div style={{ fontSize: 10, fontWeight: 700, letterSpacing: ".2em", textTransform: "uppercase", color: "var(--gold)", marginBottom: 16 }}>Dokumen Resmi</div>
                <h1 className="font-display" style={{ fontSize: "clamp(34px, 5vw, 64px)", fontWeight: 300, color: "var(--forest)", lineHeight: 1.05, letterSpacing: "-.025em", marginBottom: 12 }}>
                  Proposal Program<br /><em>Kemakmuran Kampung</em>
                </h1>
                <p style={{ fontSize: 14, color: "var(--text-secondary)", lineHeight: 1.7, maxWidth: 520, margin: "0 auto" }}>
                  Diajukan oleh Paguyuban Warga & Pemuda Ciburial Makers<br />
                  Kp. Ciburial, Desa Hanjuang, Kec. Bungbulang, Kab. Garut 44165
                </p>
              </div>

              {/* Info strip */}
              <div className="reveal" style={{ display: "flex", flexWrap: "wrap", gap: 12, justifyContent: "center", marginBottom: 56 }}>
                {[
                  { icon: "🌐", label: "ciburial-eco-digital.vercel.app" },
                  { icon: "📧", label: "ciburial.smarthub@gmail.com" },
                  { icon: "📍", label: "Garut, Jawa Barat 44165" },
                ].map((item, i) => (
                  <div key={i} style={{ display: "flex", alignItems: "center", gap: 8, padding: "10px 18px", background: "var(--warm-white)", border: "1px solid var(--border)", borderRadius: 99 }}>
                    <span>{item.icon}</span>
                    <span style={{ fontSize: 12, fontWeight: 600, color: "var(--text-secondary)" }}>{item.label}</span>
                  </div>
                ))}
              </div>

              {/* Accordion sections */}
              {[
                {
                  title: "I. Latar Belakang",
                  icon: "📖",
                  content: (
                    <div>
                      <p style={{ fontSize: 14, lineHeight: 1.9, color: "var(--text-secondary)", marginBottom: 16 }}>
                        Kampung Ciburial adalah episentrum kebaikan alam dan gotong royong. Poros penggerak ekonomi warga terletak pada kekayaan alam yang organik dan berkelanjutan: pertanian, peternakan, kerajinan bambu, dan pelestarian lingkungan.
                      </p>
                      <p style={{ fontSize: 14, lineHeight: 1.9, color: "var(--text-secondary)", marginBottom: 16 }}>
                        Inisiatif <strong>"Ciburial Eco-Digital Village"</strong> hadir untuk memanfaatkan teknologi sebagai jembatan yang melindungi, mengelola, dan memasarkan keunggulan desa agar warganya semakin makmur, aman, dan cerdas.
                      </p>
                      <p style={{ fontSize: 14, lineHeight: 1.9, color: "var(--text-secondary)" }}>
                        Sebagai langkah awal, kami menghadapi tantangan: minimnya penerangan jalan, belum adanya sistem keamanan terintegrasi, serta minimnya akses internet. Kami membangun ekosistem desa mandiri yang terintegrasi dari hulu ke hilir — infrastruktur cerdas, pengelolaan sampah, hingga pemasaran digital.
                      </p>
                    </div>
                  ),
                },
                {
                  title: "II. Tujuan Program",
                  icon: "🎯",
                  content: (
                    <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
                      {[
                        { n: "01", t: "Kemakmuran Masjid & Warga", d: "Membantu kas Dewan Kemakmuran Masjid agar kegiatan keagamaan dan sosial berjalan optimal." },
                        { n: "02", t: "Keamanan & Konektivitas Terpadu", d: "Menerangi jalan desa dengan Smart PJU, Pos Ronda Digital, dan Internet Mandiri untuk warga." },
                        { n: "03", t: "Peningkatan SDM Generasi Muda", d: "Menyediakan Perpustakaan & Lab Komputer (Learning Hub) untuk mencetak generasi penerus kompeten." },
                        { n: "04", t: "Kemandirian Ekonomi & Ekologi", d: "Membangun marketplace lokal dan Bank Sampah Digital yang mengolah limbah menjadi produk bernilai ekonomi." },
                      ].map((item, i) => (
                        <div key={i} style={{ display: "flex", gap: 16, padding: "18px 20px", background: "var(--cream)", borderRadius: 14, border: "1px solid var(--border)" }}>
                          <span className="font-display" style={{ fontSize: 12, fontWeight: 700, color: "var(--gold)", minWidth: 24 }}>{item.n}</span>
                          <div>
                            <div style={{ fontSize: 14, fontWeight: 700, color: "var(--text-primary)", marginBottom: 4 }}>{item.t}</div>
                            <div style={{ fontSize: 13, lineHeight: 1.7, color: "var(--text-secondary)" }}>{item.d}</div>
                          </div>
                        </div>
                      ))}
                    </div>
                  ),
                },
                {
                  title: "III. Visi & Misi",
                  icon: "💡",
                  content: (
                    <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", gap: 14 }}>
                      {[
                        { icon: "💡", t: "Infrastruktur Cerdas", d: "Instalasi Smart PJU, Jaringan CCTV, dan Internet Mandiri." },
                        { icon: "📚", t: "SDM Unggul", d: "Learning Hub sebagai inkubator generasi muda Ciburial." },
                        { icon: "♻️", t: "Ekologi & Ekonomi Sirkular", d: "Mengubah sampah menjadi sumber pendapatan melalui Bank Sampah Digital." },
                        { icon: "🌱", t: "Perdagangan Digital Lokal", d: "Marketplace desa untuk karya bambu, hasil tani, dan produk daur ulang." },
                        { icon: "📊", t: "Tata Kelola Transparan", d: "Kas donasi terbuka secara real-time, fiat hingga Web3." },
                      ].map((v, i) => (
                        <div key={i} style={{ padding: "20px", background: "var(--cream)", borderRadius: 14, border: "1px solid var(--border)" }}>
                          <div style={{ fontSize: 24, marginBottom: 10 }}>{v.icon}</div>
                          <div style={{ fontSize: 13, fontWeight: 700, color: "var(--text-primary)", marginBottom: 6 }}>{v.t}</div>
                          <div style={{ fontSize: 12, lineHeight: 1.7, color: "var(--text-secondary)" }}>{v.d}</div>
                        </div>
                      ))}
                    </div>
                  ),
                },
                {
                  title: "IV. Program Kerja Unggulan",
                  icon: "🛠️",
                  content: (
                    <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                      {[
                        { icon: "🔦", t: "Smart PJU & Pos Ronda Digital", d: "Pemasangan lampu jalan cerdas dan CCTV di titik strategis untuk keamanan lingkungan." },
                        { icon: "📶", t: "Jaringan Internet Mandiri (RT/RW Net)", d: "Konektivitas tulang punggung desa agar warga dan fasilitas umum terhubung dunia digital." },
                        { icon: "♻️", t: "Circular Eco-Waste (Bank Sampah)", d: "Sampah organik → kompos/pakan ternak. Plastik → kerajinan atau material siap jual." },
                        { icon: "📚", t: "Ciburial Learning Hub", d: "Perpustakaan dan lab komputer untuk tugas sekolah dan pelatihan skill pemuda." },
                        { icon: "🛒", t: "Ciburial Local Commerce (Web & App)", d: "Marketplace dan delivery lokal untuk karya bambu, sayuran, dan produk Bank Sampah." },
                        { icon: "🌿", t: "Program Edu-Wisata (Smart Eco-Tourism)", d: "Kampung sebagai destinasi wisata edukasi kerajinan bambu, pertanian organik, dan desa digital." },
                        { icon: "💰", t: "Digitalisasi Kas Donasi (Fiat & Crypto)", d: "Sentralisasi dana kemakmuran melalui QRIS, Rekening Bank, dan Crypto Wallet yang transparan." },
                      ].map((p, i) => (
                        <div key={i} style={{ display: "flex", gap: 16, padding: "16px 20px", background: "var(--cream)", borderRadius: 14, border: "1px solid var(--border)", alignItems: "flex-start" }}>
                          <span style={{ fontSize: 22, minWidth: 32 }}>{p.icon}</span>
                          <div>
                            <div style={{ fontSize: 14, fontWeight: 700, color: "var(--text-primary)", marginBottom: 3 }}>{p.t}</div>
                            <div style={{ fontSize: 13, lineHeight: 1.7, color: "var(--text-secondary)" }}>{p.d}</div>
                          </div>
                        </div>
                      ))}
                    </div>
                  ),
                },
                {
                  title: "V. Tata Kelola & Kepengurusan",
                  icon: "🏛️",
                  content: (
                    <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                      {[
                        { role: "Pelindung & Penasihat", name: "Ust. Kurniadin (Tokoh Agama) & Bpk. Enang (Ketua RW)", icon: "🕌" },
                        { role: "Pengelola Dana Kemakmuran", name: "DKM Ciburial — Bpk. Pupu Apipudin", icon: "🤲" },
                        { role: "Koordinator RT 01", name: "Sarip Hidayat", icon: "🏘️" },
                        { role: "Koordinator RT 02", name: "Oneng", icon: "🏘️" },
                        { role: "Koordinator RT 03", name: "Mumun", icon: "🏘️" },
                        { role: "Ketua Pemuda Makers", name: "Ubay Rahmat H.", icon: "⚡" },
                      ].map((item, i) => (
                        <div key={i} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "14px 18px", background: "var(--cream)", borderRadius: 12, border: "1px solid var(--border)", flexWrap: "wrap", gap: 8 }}>
                          <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                            <span style={{ fontSize: 18 }}>{item.icon}</span>
                            <span style={{ fontSize: 14, fontWeight: 700, color: "var(--text-primary)" }}>{item.name}</span>
                          </div>
                          <span style={{ fontSize: 10, fontWeight: 700, letterSpacing: ".08em", textTransform: "uppercase", color: "var(--gold)", background: "rgba(184,148,63,.1)", padding: "4px 12px", borderRadius: 99 }}>{item.role}</span>
                        </div>
                      ))}
                    </div>
                  ),
                },
                {
                  title: "VI. Alokasi Kebutuhan Donasi",
                  icon: "💰",
                  content: (
                    <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                      {ALOKASI.map((item, i) => (
                        <div key={i} style={{ padding: "18px 22px", background: "var(--cream)", borderRadius: 14, border: "1px solid var(--border)" }}>
                          <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 10, flexWrap: "wrap", gap: 6 }}>
                            <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
                              <span style={{ fontSize: 20 }}>{item.icon}</span>
                              <span style={{ fontSize: 14, fontWeight: 600, color: "var(--text-primary)" }}>{item.label}</span>
                            </div>
                            <span className="font-display" style={{ fontSize: 16, fontWeight: 600, color: "var(--forest)" }}>{formatRp(item.target)}</span>
                          </div>
                          <div className="prog">
                            <div className="prog-fill" style={{ background: item.color, width: `${Math.min(100, ((danaPerKategori[item.label] || 0) / item.target) * 100)}%` }} />
                          </div>
                          <div style={{ fontSize: 11, color: "var(--text-muted)", marginTop: 6 }}>
                            Terkumpul: {formatRp(danaPerKategori[item.label] || 0)} / Target {formatRp(item.target)}
                          </div>
                        </div>
                      ))}
                      <div style={{ padding: "18px 22px", background: "var(--forest)", borderRadius: 14, display: "flex", justifyContent: "space-between", flexWrap: "wrap", gap: 8 }}>
                        <span style={{ fontSize: 13, fontWeight: 700, color: "var(--cream)" }}>Total Target Keseluruhan</span>
                        <span className="font-display" style={{ fontSize: 20, fontWeight: 600, color: "var(--gold-light)" }}>{formatRp(totalTarget)}</span>
                      </div>
                    </div>
                  ),
                },
                {
                  title: "VII. Penutup",
                  icon: "🙏",
                  content: (
                    <div>
                      <p style={{ fontSize: 14, lineHeight: 1.9, color: "var(--text-secondary)", marginBottom: 24 }}>
                        Setiap dukungan Anda adalah lentera bagi jalan kami, ilmu bagi generasi muda, serta roda penggerak bagi kemakmuran ekonomi dan kelestarian alam Ciburial. Kami percaya, kemajuan teknologi akan membawa keberkahan jika disandingkan dengan niat tulus bergotong royong.
                      </p>
                      <div style={{ padding: "28px 32px", background: "var(--earth)", borderRadius: 18 }}>
                        <p dir="rtl" className="font-display" style={{ fontSize: "clamp(16px, 2.5vw, 22px)", lineHeight: 1.9, color: "var(--cream)", marginBottom: 14 }}>
                          رَبَّنَا آتِنَا فِي الدُّنْيَا حَسَنَةً وَفِي الْآخِرَةِ حَسَنَةً وَقِنَا عَذَابَ النَّارِ
                        </p>
                        <p style={{ fontSize: 13, fontStyle: "italic", color: "rgba(250,248,243,.6)", lineHeight: 1.8 }}>"Ya Tuhan kami, berilah kebaikan di dunia dan di akhirat, serta lindungilah dari siksa neraka." <span style={{ fontStyle: "normal", fontWeight: 700, color: "var(--gold-light)" }}>— QS. Al-Baqarah: 201</span></p>
                      </div>
                      <div style={{ marginTop: 24, textAlign: "right" }}>
                        <div style={{ fontSize: 13, fontWeight: 700, color: "var(--text-primary)" }}>Hormat Kami,</div>
                        <div className="font-display" style={{ fontSize: 22, fontWeight: 600, color: "var(--forest)", fontStyle: "italic" }}>Paguyuban & Pemuda Ciburial Makers</div>
                      </div>
                    </div>
                  ),
                },
              ].map((section, i) => (
                <div key={i} className="reveal" style={{ marginBottom: 8 }}>
                  <button
                    onClick={() => setProposalSection(proposalSection === i ? null : i)}
                    style={{
                      width: "100%", display: "flex", justifyContent: "space-between", alignItems: "center",
                      padding: "22px 28px", background: proposalSection === i ? "var(--forest)" : "var(--warm-white)",
                      border: "1px solid var(--border)", borderRadius: proposalSection === i ? "18px 18px 0 0" : 18,
                      cursor: "pointer", transition: "background .25s, border-radius .25s", textAlign: "left",
                    }}
                  >
                    <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
                      <span style={{ fontSize: 22 }}>{section.icon}</span>
                      <span style={{ fontSize: 15, fontWeight: 700, color: proposalSection === i ? "var(--cream)" : "var(--text-primary)" }}>{section.title}</span>
                    </div>
                    <span style={{ fontSize: 18, color: proposalSection === i ? "var(--gold-light)" : "var(--text-muted)", transition: "transform .3s", transform: proposalSection === i ? "rotate(45deg)" : "rotate(0)" }}>+</span>
                  </button>
                  <div className={`acc-content ${proposalSection === i ? "open" : ""}`} style={{ borderLeft: "1px solid var(--border)", borderRight: "1px solid var(--border)", borderBottom: proposalSection === i ? "1px solid var(--border)" : "none", borderRadius: "0 0 18px 18px", padding: proposalSection === i ? "28px" : "0 28px", background: "var(--warm-white)", transition: "padding .3s, max-height .45s cubic-bezier(.22,1,.36,1)" }}>
                    {section.content}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ═══════════════════════════════════════════
            TAB 3: TRANSPARANSI DANA
        ═══════════════════════════════════════════ */}
        {activeTab === "transparansi" && (
          <div className="page-in" style={{ paddingTop: 110, paddingBottom: 110 }}>
            <div style={{ maxWidth: 1100, margin: "0 auto", padding: "0 28px" }}>

              {/* Header */}
              <div className="reveal" style={{ textAlign: "center", marginBottom: 56 }}>
                <div className="dl dl-c" />
                <h1 className="font-display" style={{ fontSize: "clamp(34px, 5vw, 64px)", fontWeight: 300, color: "var(--forest)", lineHeight: 1.05, letterSpacing: "-.025em", marginBottom: 10 }}>
                  Transparansi<br /><em>Dana Kampung</em>
                </h1>
                <p style={{ fontSize: 14, color: "var(--text-secondary)", lineHeight: 1.7, maxWidth: 440, margin: "0 auto" }}>
                  Setiap rupiah yang masuk dan keluar dicatat secara terbuka. Kepercayaan Anda adalah amanah yang kami jaga.
                </p>
              </div>

              {/* SUMMARY CARDS */}
              <div className="reveal" style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", gap: 16, marginBottom: 48 }}>
                {[
                  { label: "Total Masuk", value: totalMasuk, icon: "↑", color: "var(--forest)", bg: "var(--green-badge)", textc: "var(--green-badge-text)", prefix: "+" },
                  { label: "Total Keluar", value: totalKeluar, icon: "↓", color: "#8B2020", bg: "var(--red-badge)", textc: "var(--red-badge-text)", prefix: "-" },
                  { label: "Saldo Saat Ini", value: saldo, icon: "◎", color: "var(--forest)", bg: "var(--cream-dark)", textc: "var(--forest)", prefix: "" },
                  { label: "Total Target", value: totalTarget, icon: "◈", color: "var(--gold)", bg: "rgba(184,148,63,.1)", textc: "var(--earth-mid)", prefix: "" },
                ].map((card, i) => (
                  <div key={i} className={`reveal d${i + 1}`} style={{ padding: "28px", background: "var(--warm-white)", border: "1px solid var(--border)", borderRadius: 20 }}>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 12 }}>
                      <span style={{ fontSize: 10, fontWeight: 700, letterSpacing: ".12em", textTransform: "uppercase", color: "var(--text-muted)" }}>{card.label}</span>
                      <span style={{ padding: "4px 10px", background: card.bg, color: card.textc, borderRadius: 99, fontSize: 13, fontWeight: 800 }}>{card.icon}</span>
                    </div>
                    <div className="font-display" style={{ fontSize: "clamp(20px, 2.5vw, 28px)", fontWeight: 600, color: card.color, lineHeight: 1 }}>
                      {card.prefix}{formatRp(card.value)}
                    </div>
                  </div>
                ))}
              </div>

              {/* PROGRESS TOTAL */}
              <div className="reveal prog-wrap" style={{ padding: "28px 32px", background: "var(--warm-white)", border: "1px solid var(--border)", borderRadius: 20, marginBottom: 48 }}>
                <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 12, flexWrap: "wrap", gap: 8 }}>
                  <span style={{ fontSize: 13, fontWeight: 700, color: "var(--text-primary)" }}>Progress Pencapaian Target</span>
                  <span style={{ fontSize: 14, fontWeight: 700, color: "var(--forest)" }}>{Math.round((totalMasuk / totalTarget) * 100)}% dari {formatRp(totalTarget)}</span>
                </div>
                <div className="prog" style={{ height: 8 }}>
                  <div className="prog-fill" style={{ background: "linear-gradient(90deg, var(--forest) 0%, var(--forest-light) 100%)", width: `${Math.min(100, (totalMasuk / totalTarget) * 100)}%` }} />
                </div>
                <div style={{ fontSize: 11, color: "var(--text-muted)", marginTop: 8 }}>Terkumpul {formatRp(totalMasuk)} dari target {formatRp(totalTarget)}</div>
              </div>

              {/* ALOKASI BREAKDOWN */}
              <div className="reveal" style={{ marginBottom: 48 }}>
                <h3 style={{ fontSize: 13, fontWeight: 700, letterSpacing: ".12em", textTransform: "uppercase", color: "var(--text-muted)", marginBottom: 20 }}>Rincian Alokasi Dana</h3>
                <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))", gap: 12 }}>
                  {ALOKASI.map((item, i) => {
                    const used = DATA_TRANSAKSI.filter(t => t.tipe === "keluar" && t.kategori === item.label).reduce((s, t) => s + t.jumlah, 0);
                    const pct = Math.min(100, (used / item.target) * 100);
                    return (
                      <div key={i} className={`reveal prog-wrap d${i + 1}`} style={{ padding: "20px 22px", background: "var(--warm-white)", border: "1px solid var(--border)", borderRadius: 16 }}>
                        <div style={{ display: "flex", gap: 10, alignItems: "center", marginBottom: 10 }}>
                          <span style={{ fontSize: 20 }}>{item.icon}</span>
                          <div style={{ flex: 1 }}>
                            <div style={{ fontSize: 12, fontWeight: 700, color: "var(--text-primary)" }}>{item.label}</div>
                            <div style={{ fontSize: 11, color: "var(--text-muted)" }}>{formatRp(used)} / {formatRp(item.target)}</div>
                          </div>
                          <span style={{ fontSize: 12, fontWeight: 800, color: item.color }}>{Math.round(pct)}%</span>
                        </div>
                        <div className="prog">
                          <div className="prog-fill" style={{ background: item.color, width: `${pct}%` }} />
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* RIWAYAT TRANSAKSI */}
              <div className="reveal">
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20, flexWrap: "wrap", gap: 12 }}>
                  <h3 style={{ fontSize: 13, fontWeight: 700, letterSpacing: ".12em", textTransform: "uppercase", color: "var(--text-muted)" }}>Riwayat Transaksi</h3>
                  {/* Filter */}
                  <div style={{ display: "flex", gap: 6 }}>
                    {(["semua", "masuk", "keluar"] as const).map((f) => (
                      <button key={f} onClick={() => setFilterTipe(f)} style={{
                        padding: "7px 16px", fontSize: 11, fontWeight: 700, letterSpacing: ".08em", textTransform: "uppercase",
                        border: "1px solid var(--border)", borderRadius: 99, cursor: "pointer", transition: "all .2s",
                        background: filterTipe === f ? "var(--forest)" : "var(--warm-white)",
                        color: filterTipe === f ? "#fff" : "var(--text-secondary)",
                      }}>{f}</button>
                    ))}
                  </div>
                </div>

                <div style={{ background: "var(--warm-white)", border: "1px solid var(--border)", borderRadius: 20, overflow: "hidden" }}>
                  <div style={{ overflowX: "auto" }}>
                    <table className="tbl">
                      <thead>
                        <tr style={{ background: "var(--cream)" }}>
                          <th>Tanggal</th>
                          <th>Keterangan</th>
                          <th>Kategori</th>
                          <th>Tipe</th>
                          <th style={{ textAlign: "right" }}>Jumlah</th>
                        </tr>
                      </thead>
                      <tbody>
                        {[...transaksiFiltered].reverse().map((t) => (
                          <tr key={t.id}>
                            <td style={{ whiteSpace: "nowrap", fontSize: 12 }}>
                              {new Date(t.tanggal).toLocaleDateString("id-ID", { day: "numeric", month: "short", year: "numeric" })}
                            </td>
                            <td>{t.keterangan}</td>
                            <td>
                              <span style={{ padding: "3px 10px", background: "var(--cream-dark)", borderRadius: 99, fontSize: 11, fontWeight: 600, color: "var(--text-secondary)", whiteSpace: "nowrap" }}>{t.kategori}</span>
                            </td>
                            <td>
                              <span className={t.tipe === "masuk" ? "badge-masuk" : "badge-keluar"}>
                                {t.tipe === "masuk" ? "↑ Masuk" : "↓ Keluar"}
                              </span>
                            </td>
                            <td style={{ textAlign: "right", fontWeight: 700, whiteSpace: "nowrap", color: t.tipe === "masuk" ? "var(--green-badge-text)" : "var(--red-badge-text)" }}>
                              {t.tipe === "masuk" ? "+" : "-"}{formatRp(t.jumlah)}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                  {/* Footer total */}
                  <div style={{ padding: "18px 24px", borderTop: "2px solid var(--border)", background: "var(--cream)", display: "flex", justifyContent: "flex-end", gap: 32, flexWrap: "wrap" }}>
                    <span style={{ fontSize: 12, fontWeight: 700, color: "var(--green-badge-text)" }}>Total Masuk: {formatRp(totalMasuk)}</span>
                    <span style={{ fontSize: 12, fontWeight: 700, color: "var(--red-badge-text)" }}>Total Keluar: {formatRp(totalKeluar)}</span>
                    <span style={{ fontSize: 13, fontWeight: 800, color: "var(--forest)" }}>Saldo: {formatRp(saldo)}</span>
                  </div>
                </div>

                {/* Disclaimer */}
                <div style={{ marginTop: 20, padding: "16px 20px", background: "rgba(184,148,63,.07)", border: "1px solid rgba(184,148,63,.2)", borderRadius: 14, display: "flex", gap: 12, alignItems: "flex-start" }}>
                  <span style={{ fontSize: 18 }}>ℹ️</span>
                  <div>
                    <div style={{ fontSize: 12, fontWeight: 700, color: "var(--earth-mid)", marginBottom: 3 }}>Catatan Transparansi</div>
                    <div style={{ fontSize: 12, lineHeight: 1.7, color: "var(--earth-light)" }}>Data transaksi diperbarui secara berkala oleh tim Pemuda Ciburial Makers. Untuk konfirmasi atau pertanyaan seputar dana, hubungi: <strong>ciburial.smarthub@gmail.com</strong></div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ═══════════════════════════════════════════
            TAB 4: MARKETPLACE
        ═══════════════════════════════════════════ */}
        {activeTab === "marketplace" && !showCheckout && (
          <div className="page-in" style={{ paddingTop: 110, paddingBottom: 110 }}>
            <div style={{ maxWidth: 1320, margin: "0 auto", padding: "0 28px" }}>
              <div className="reveal" style={{ marginBottom: 72, display: "flex", flexWrap: "wrap", alignItems: "flex-end", justifyContent: "space-between", gap: 20 }}>
                <div>
                  <div className="dl" />
                  <h1 className="font-display" style={{ fontSize: "clamp(44px, 7vw, 88px)", fontWeight: 300, color: "var(--forest)", lineHeight: .95, letterSpacing: "-.03em" }}>Galeri<br /><em>Produk</em></h1>
                </div>
                <p style={{ maxWidth: 320, fontSize: 14, lineHeight: 1.8, color: "var(--text-secondary)" }}>Setiap produk adalah cerminan keahlian dan kecintaan pemuda Ciburial terhadap tanah dan bambu mereka.</p>
              </div>

              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))", gap: 20 }}>
                {[
                  { name: "Lampu Hex-Bamboo", desc: "Lampu tidur estetik dari anyaman bambu asli pegunungan Ciburial. Cahaya hangat, aroma alami.", price: "Rp 150.000", tag: "Best Seller", icon: "🪔" },
                  { name: "Keranjang Anyam", desc: "Kerajinan tangan warga — multifungsi dan ramah lingkungan, cocok untuk dekorasi rumah.", price: "Rp 85.000", tag: "Handmade", icon: "🧺" },
                  { name: "Mini Pot Bambu", desc: "Pot tanaman dari bambu pilihan. Natural, kuat, dan mempercantik ruangan Anda.", price: "Rp 60.000", tag: "Eco", icon: "🌿" },
                  { name: "Kompos Organik", desc: "Pupuk kompos dari program Bank Sampah Ciburial. 100% organik, baik untuk tanaman dan bumi.", price: "Rp 25.000", tag: "Eco-Waste", icon: "🌱" },
                  { name: "Sayur Organik Box", desc: "Paket sayuran segar langsung dari ladang warga Ciburial, tanpa pestisida kimia.", price: "Rp 45.000", tag: "Fresh Farm", icon: "🥬" },
                  { name: "Pigura Bambu", desc: "Pigura foto artistik dari bambu terpilih. Cocok sebagai dekorasi atau hadiah.", price: "Rp 70.000", tag: "Craft", icon: "🎋" },
                ].map((p, i) => (
                  <div key={i} className={`reveal card-hover d${(i % 3) + 1}`} style={{ background: "var(--warm-white)", border: "1px solid var(--border)", borderRadius: 22, overflow: "hidden" }}>
                    <div style={{ aspectRatio: "4/3", background: "linear-gradient(135deg, var(--cream-dark) 0%, var(--cream) 100%)", display: "flex", alignItems: "center", justifyContent: "center", position: "relative" }}>
                      <span style={{ fontSize: 56 }}>{p.icon}</span>
                      <div style={{ position: "absolute", top: 14, left: 14, padding: "5px 12px", background: "var(--forest)", borderRadius: 99, fontSize: 10, fontWeight: 700, letterSpacing: ".1em", textTransform: "uppercase", color: "#fff" }}>{p.tag}</div>
                    </div>
                    <div style={{ padding: "24px 24px 20px" }}>
                      <h3 style={{ fontSize: 17, fontWeight: 700, color: "var(--text-primary)", marginBottom: 6 }}>{p.name}</h3>
                      <p style={{ fontSize: 12, lineHeight: 1.7, color: "var(--text-secondary)", marginBottom: 20 }}>{p.desc}</p>
                      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", paddingTop: 16, borderTop: "1px solid var(--border)" }}>
                        <span className="font-display" style={{ fontSize: 21, fontWeight: 600, color: "var(--forest)" }}>{p.price}</span>
                        <button onClick={() => setShowCheckout(true)} className="btn" style={{ padding: "9px 20px", borderRadius: 99, fontSize: 11, fontWeight: 700, letterSpacing: ".08em", textTransform: "uppercase", border: "none", cursor: "pointer", background: "var(--forest)", color: "#fff" }}>
                          <span>Beli</span>
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* ═══════════════════════════════════════════
            CHECKOUT
        ═══════════════════════════════════════════ */}
        {showCheckout && (
          <div className="page-in" style={{ paddingTop: 110, paddingBottom: 110, minHeight: "100vh" }}>
            <div style={{ maxWidth: 600, margin: "0 auto", padding: "0 28px" }}>
              <button onClick={() => setShowCheckout(false)}
                style={{ display: "flex", alignItems: "center", gap: 8, background: "none", border: "none", cursor: "pointer", fontSize: 11, fontWeight: 700, letterSpacing: ".1em", textTransform: "uppercase", color: "var(--text-muted)", marginBottom: 40, padding: 0 }}
                onMouseEnter={e => (e.currentTarget.style.color = "var(--forest)")}
                onMouseLeave={e => (e.currentTarget.style.color = "var(--text-muted)")}
              >← Kembali ke Marketplace</button>
              <div style={{ padding: "22px", background: "var(--forest)", borderRadius: 18, marginBottom: 20, display: "flex", alignItems: "center", gap: 18 }}>
                <span style={{ fontSize: 36 }}>🪔</span>
                <div>
                  <div style={{ fontSize: 10, fontWeight: 700, letterSpacing: ".15em", textTransform: "uppercase", color: "rgba(250,248,243,.45)", marginBottom: 3 }}>Pesanan Anda</div>
                  <div style={{ fontSize: 16, fontWeight: 700, color: "var(--cream)" }}>Lampu Hex-Bamboo</div>
                  <div className="font-display" style={{ fontSize: 20, color: "var(--gold-light)", fontWeight: 600 }}>Rp 150.000</div>
                </div>
              </div>
              <div style={{ background: "var(--warm-white)", border: "1px solid var(--border)", borderRadius: 22, padding: "44px" }}>
                <h2 className="font-display" style={{ fontSize: 30, fontWeight: 300, color: "var(--forest)", letterSpacing: "-.02em", marginBottom: 6 }}>Detail Pengiriman</h2>
                <p style={{ fontSize: 12, color: "var(--text-muted)", marginBottom: 36 }}>Pesanan diteruskan ke tim Ciburial Makers melalui email resmi.</p>
                <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
                  {[{ l: "Nama Lengkap", t: "text", p: "Cth: Budi Santoso" }, { l: "No. WhatsApp Aktif", t: "tel", p: "Cth: 08123456789" }].map((f, i) => (
                    <div key={i}>
                      <label style={{ display: "block", fontSize: 10, fontWeight: 700, letterSpacing: ".12em", textTransform: "uppercase", color: "var(--text-secondary)", marginBottom: 7 }}>{f.l}</label>
                      <input type={f.t} placeholder={f.p} className="field" />
                    </div>
                  ))}
                  <div>
                    <label style={{ display: "block", fontSize: 10, fontWeight: 700, letterSpacing: ".12em", textTransform: "uppercase", color: "var(--text-secondary)", marginBottom: 7 }}>Alamat Lengkap</label>
                    <textarea rows={3} className="field" style={{ resize: "vertical" }} />
                  </div>
                  <div>
                    <label style={{ display: "block", fontSize: 10, fontWeight: 700, letterSpacing: ".12em", textTransform: "uppercase", color: "var(--text-secondary)", marginBottom: 7 }}>Catatan (opsional)</label>
                    <textarea rows={2} className="field" placeholder="Warna, ukuran, atau permintaan khusus..." style={{ resize: "vertical" }} />
                  </div>
                  <button type="button" className="btn" style={{ width: "100%", padding: "17px", borderRadius: 14, fontSize: 11, fontWeight: 700, letterSpacing: ".15em", textTransform: "uppercase", border: "none", cursor: "pointer", background: "var(--forest)", color: "#fff", marginTop: 4 }}>
                    <span>Kirim Pesanan →</span>
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ═══════════════════════════════════════════
            FOOTER
        ═══════════════════════════════════════════ */}
        <footer style={{ background: "var(--earth)", borderTop: "1px solid rgba(255,255,255,.05)" }}>
          <div style={{ maxWidth: 1320, margin: "0 auto", padding: "72px 28px 56px", display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))", gap: 44 }}>
            <div>
              <div className="font-display" style={{ fontSize: 26, fontWeight: 300, color: "var(--cream)", letterSpacing: "-.02em", marginBottom: 4 }}>Ciburial</div>
              <div style={{ fontSize: 9, fontWeight: 700, letterSpacing: ".18em", textTransform: "uppercase", color: "var(--gold)", marginBottom: 18 }}>Eco-Digital Village</div>
              <p style={{ fontSize: 12, lineHeight: 1.85, color: "rgba(250,248,243,.4)", fontWeight: 400 }}>Pelopor desa mandiri eco-digital sejak 2026 — mahakarya bambu lokal & infrastruktur cerdas dari Garut untuk dunia.</p>
            </div>
            <div>
              <h4 style={{ fontSize: 10, fontWeight: 700, letterSpacing: ".15em", textTransform: "uppercase", color: "var(--gold)", marginBottom: 22 }}>Lokasi</h4>
              <p style={{ fontSize: 12, lineHeight: 1.9, color: "rgba(250,248,243,.45)", fontWeight: 400 }}>Kp Ciburial<br />Desa Hanjuang, Kec. Bungbulang<br />Kab. Garut, Jawa Barat 44165</p>
            </div>
            <div>
              <h4 style={{ fontSize: 10, fontWeight: 700, letterSpacing: ".15em", textTransform: "uppercase", color: "var(--gold)", marginBottom: 22 }}>Navigasi</h4>
              <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                {tabs.map((t) => (
                  <button key={t.key} onClick={() => navTo(t.key)} style={{ background: "none", border: "none", cursor: "pointer", textAlign: "left", fontSize: 12, fontWeight: 500, color: "rgba(250,248,243,.45)", padding: 0, transition: "color .2s" }}
                    onMouseEnter={e => (e.currentTarget.style.color = "var(--cream)")}
                    onMouseLeave={e => (e.currentTarget.style.color = "rgba(250,248,243,.45)")}
                  >{t.label}</button>
                ))}
              </div>
            </div>
            <div>
              <h4 style={{ fontSize: 10, fontWeight: 700, letterSpacing: ".15em", textTransform: "uppercase", color: "var(--gold)", marginBottom: 22 }}>Kontak</h4>
              <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                {["ciburial.smarthub@gmail.com", "support.ciburial@gmail.com"].map((e) => (
                  <a key={e} href={`mailto:${e}`} style={{ fontSize: 12, fontWeight: 500, color: "rgba(250,248,243,.45)", textDecoration: "none", transition: "color .2s" }}
                    onMouseEnter={ev => (ev.currentTarget.style.color = "var(--cream)")}
                    onMouseLeave={ev => (ev.currentTarget.style.color = "rgba(250,248,243,.45)")}
                  >{e}</a>
                ))}
              </div>
            </div>
          </div>
          <div style={{ borderTop: "1px solid rgba(255,255,255,.05)", padding: "20px 28px", maxWidth: 1320, margin: "0 auto", display: "flex", flexWrap: "wrap", alignItems: "center", justifyContent: "space-between", gap: 14 }}>
            <p style={{ fontSize: 10, fontWeight: 600, color: "rgba(250,248,243,.25)", letterSpacing: ".08em", textTransform: "uppercase" }}>© {new Date().getFullYear()} Ciburial Eco-Digital Village. All Rights Reserved.</p>
            <div style={{ display: "flex", gap: 18 }}>
              {[
                <path key="fb" fillRule="evenodd" d="M22 12c0-5.523-4.477-10-10-10S2 6.477 2 12c0 4.991 3.657 9.128 8.438 9.878v-6.987h-2.54V12h2.54V9.797c0-2.506 1.492-3.89 3.777-3.89 1.094 0 2.238.195 2.238.195v2.46h-1.26c-1.243 0-1.63.771-1.63 1.562V12h2.773l-.443 2.89h-2.33v6.988C18.343 21.128 22 16.991 22 12z" clipRule="evenodd" />,
                <path key="yt" fillRule="evenodd" d="M21.582 6.186a2.665 2.665 0 00-1.876-1.884C17.96 3.842 12 3.842 12 3.842s-5.96 0-7.706.46A2.665 2.665 0 002.418 6.186C2 7.942 2 12 2 12s0 4.058.418 5.814a2.665 2.665 0 001.876 1.884C5.96 20.158 12 20.158 12 20.158s5.96 0 7.706-.46a2.665 2.665 0 001.876-1.884C22 15.942 22 12 22 12s0-4.058-.418-5.814zM9.99 15.292v-6.58L15.694 12l-5.704 3.292z" clipRule="evenodd" />,
                <path key="tt" d="M12.525.02c1.31-.02 2.61-.01 3.91-.04.08 1.53.63 3.09 1.75 4.17 1.12 1.11 2.7 1.62 4.24 1.79v4.03c-1.44-.05-2.89-.35-4.2-.97-.57-.26-1.1-.59-1.62-.93-.01 2.92.01 5.84-.02 8.75-.08 1.4-.54 2.79-1.35 3.94-1.31 1.92-3.58 3.17-5.91 3.21-1.43.08-2.86-.31-4.08-1.03-2.02-1.19-3.44-3.37-3.65-5.71-.02-.5-.03-1-.01-1.49.18-1.9 1.12-3.72 2.58-4.96 1.66-1.44 3.98-2.13 6.15-1.72.02 1.48-.04 2.96-.04 4.44-.99-.32-2.15-.23-3.02.37-.63.41-1.11 1.04-1.36 1.75-.21.51-.15 1.07-.14 1.61.24 1.64 1.82 3.02 3.5 2.87 1.12-.01 2.19-.66 2.77-1.61.19-.33.4-.67.41-1.06.1-1.79.06-3.57.07-5.36.01-4.03-.01-8.05.02-12.07z" />,
              ].map((icon, i) => (
                <a key={i} href="#" style={{ color: "rgba(250,248,243,.25)", transition: "color .2s" }}
                  onMouseEnter={e => ((e.currentTarget as HTMLAnchorElement).style.color = "var(--cream)")}
                  onMouseLeave={e => ((e.currentTarget as HTMLAnchorElement).style.color = "rgba(250,248,243,.25)")}
                >
                  <svg style={{ width: 17, height: 17 }} fill="currentColor" viewBox="0 0 24 24">{icon}</svg>
                </a>
              ))}
            </div>
          </div>
        </footer>

      </main>
    </>
  );
}