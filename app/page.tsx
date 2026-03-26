"use client";
import { useState, useEffect, useRef } from "react";

/* ─────────────────────────────────────────────
   FONT IMPORTS — tambahkan ini ke layout.tsx
   atau globals.css kalau mau lebih proper:
   @import url('https://fonts.googleapis.com/css2?family=Cormorant+Garamond:ital,wght@0,300;0,400;0,600;0,700;1,300;1,400&family=DM+Sans:wght@300;400;500;600;700&display=swap');
───────────────────────────────────────────── */

export default function Home() {
  const [activeTab, setActiveTab] = useState<"tentang" | "marketplace">("tentang");
  const [showCheckout, setShowCheckout] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 40);
    window.addEventListener("scroll", onScroll);
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  // Intersection Observer for scroll reveal
  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add("is-visible");
          }
        });
      },
      { threshold: 0.12 }
    );
    const elements = document.querySelectorAll(".reveal");
    elements.forEach((el) => observer.observe(el));
    return () => observer.disconnect();
  }, [activeTab, showCheckout]);

  const orgDesa = [
    { role: "Tokoh Agama", name: "Ust. Kurniadin", icon: "🕌" },
    { role: "Ketua RW", name: "Enang", icon: "🏘️" },
    { role: "Dewan Kemakmuran Masjid", name: "Pupu Apipudin", icon: "🤲" },
  ];
  const orgRT = [
    { role: "Ketua RT 01", name: "Sarip Hidayat" },
    { role: "Ketua RT 02", name: "Oneng" },
    { role: "Ketua RT 03", name: "Mumun" },
  ];
  const orgPemuda = [
    { role: "Ketua", name: "— Soon —" },
    { role: "Wakil Ketua", name: "— Soon —" },
    { role: "Sekretaris", name: "— Soon —" },
    { role: "Bendahara", name: "— Soon —" },
  ];

  const stats = [
    { value: "450", label: "Jiwa", sub: "Total Populasi" },
    { value: "3", label: "RT", sub: "Rukun Tetangga" },
    { value: "55%", label: "Pemuda", sub: "Generasi Penerus" },
    { value: "2026", label: "Berdiri", sub: "Tahun Inisiatif" },
  ];

  const visi = [
    {
      no: "01",
      icon: "💡",
      title: "Infrastruktur Cerdas",
      desc: "Fasilitas desa mandiri dan efisien lewat Smart PJU berbahan lokal bambu.",
    },
    {
      no: "02",
      icon: "🌱",
      title: "Ekonomi Sirkular",
      desc: "Memberdayakan warga dari hasil tani dan mahakarya kerajinan bambu pemuda.",
    },
    {
      no: "03",
      icon: "📊",
      title: "Tata Kelola Transparan",
      desc: "Data demografi dan aliran dana terbuka untuk membangun kepercayaan.",
    },
  ];

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Cormorant+Garamond:ital,wght@0,300;0,400;0,600;0,700;1,300;1,400&family=DM+Sans:opsz,wght@9..40,300;9..40,400;9..500;9..600;9..700&display=swap');

        :root {
          --forest: #1C3A2B;
          --forest-mid: #2D5A40;
          --forest-light: #4A7C59;
          --cream: #FAF8F3;
          --cream-dark: #F0EDE5;
          --warm-white: #FFFEF9;
          --gold: #B8943F;
          --gold-light: #D4AC5A;
          --earth: #3D2B1F;
          --earth-mid: #6B4F3A;
          --earth-light: #A08070;
          --text-primary: #1A1410;
          --text-secondary: #5A4A40;
          --text-muted: #9A8C85;
          --border: #E5E0D8;
        }

        * { box-sizing: border-box; }

        body {
          background-color: var(--cream);
          color: var(--text-primary);
          font-family: 'DM Sans', sans-serif;
        }

        .font-display { font-family: 'Cormorant Garamond', serif; }

        /* ── REVEAL ANIMATIONS ── */
        .reveal {
          opacity: 0;
          transform: translateY(32px);
          transition: opacity 0.8s cubic-bezier(0.22, 1, 0.36, 1),
                      transform 0.8s cubic-bezier(0.22, 1, 0.36, 1);
        }
        .reveal.is-visible { opacity: 1; transform: translateY(0); }
        .reveal-delay-1 { transition-delay: 0.1s; }
        .reveal-delay-2 { transition-delay: 0.2s; }
        .reveal-delay-3 { transition-delay: 0.3s; }
        .reveal-delay-4 { transition-delay: 0.4s; }
        .reveal-delay-5 { transition-delay: 0.5s; }

        /* ── HERO TEXT ANIMATION ── */
        @keyframes heroFadeUp {
          from { opacity: 0; transform: translateY(48px); }
          to   { opacity: 1; transform: translateY(0); }
        }
        .hero-line-1 { animation: heroFadeUp 1s cubic-bezier(0.22,1,0.36,1) 0.1s both; }
        .hero-line-2 { animation: heroFadeUp 1s cubic-bezier(0.22,1,0.36,1) 0.28s both; }
        .hero-line-3 { animation: heroFadeUp 1s cubic-bezier(0.22,1,0.36,1) 0.44s both; }
        .hero-line-4 { animation: heroFadeUp 1s cubic-bezier(0.22,1,0.36,1) 0.58s both; }
        .hero-line-5 { animation: heroFadeUp 1s cubic-bezier(0.22,1,0.36,1) 0.72s both; }

        /* ── NAV ── */
        .nav-scrolled {
          background: rgba(250,248,243,0.95) !important;
          box-shadow: 0 1px 0 var(--border);
        }

        /* ── DECORATIVE LINE ── */
        .deco-line {
          display: inline-block;
          width: 48px; height: 2px;
          background: var(--gold);
          margin-bottom: 24px;
        }

        /* ── STAT COUNTER ── */
        @keyframes countUp {
          from { opacity: 0; transform: scale(0.85); }
          to   { opacity: 1; transform: scale(1); }
        }
        .stat-card.is-visible .stat-value {
          animation: countUp 0.6s cubic-bezier(0.34, 1.56, 0.64, 1) forwards;
        }

        /* ── PRODUCT CARD HOVER ── */
        .product-card { transition: transform 0.4s cubic-bezier(0.22,1,0.36,1), box-shadow 0.4s ease; }
        .product-card:hover { transform: translateY(-8px); box-shadow: 0 24px 64px rgba(28,58,43,0.12); }

        /* ── BAMBOO TEXTURE BG ── */
        .bamboo-bg {
          background-color: var(--forest);
          background-image:
            repeating-linear-gradient(
              90deg,
              rgba(255,255,255,0.015) 0px,
              rgba(255,255,255,0.015) 1px,
              transparent 1px,
              transparent 60px
            ),
            repeating-linear-gradient(
              0deg,
              rgba(255,255,255,0.015) 0px,
              rgba(255,255,255,0.015) 1px,
              transparent 1px,
              transparent 60px
            );
        }

        /* ── NOISE GRAIN OVERLAY ── */
        .grain::after {
          content: '';
          position: absolute; inset: 0;
          background-image: url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noise'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noise)' opacity='0.04'/%3E%3C/svg%3E");
          pointer-events: none;
          opacity: 0.5;
        }

        /* ── ORG CARD ── */
        .org-card { transition: transform 0.3s ease, box-shadow 0.3s ease; }
        .org-card:hover { transform: translateY(-4px); box-shadow: 0 12px 32px rgba(28,58,43,0.1); }

        /* ── MARQUEE ── */
        @keyframes marquee {
          from { transform: translateX(0); }
          to   { transform: translateX(-50%); }
        }
        .marquee-inner { animation: marquee 20s linear infinite; }
        .marquee-inner:hover { animation-play-state: paused; }

        /* ── PAGE TRANSITION ── */
        .page-in {
          animation: heroFadeUp 0.5s cubic-bezier(0.22,1,0.36,1) both;
        }

        /* ── MOBILE MENU ── */
        .mobile-menu {
          transition: opacity 0.3s ease, transform 0.3s cubic-bezier(0.22,1,0.36,1);
        }
        .mobile-menu.open { opacity: 1; transform: translateY(0); pointer-events: all; }
        .mobile-menu.closed { opacity: 0; transform: translateY(-12px); pointer-events: none; }

        /* ── SCROLLBAR ── */
        ::-webkit-scrollbar { width: 6px; }
        ::-webkit-scrollbar-track { background: var(--cream); }
        ::-webkit-scrollbar-thumb { background: var(--earth-light); border-radius: 99px; }

        /* ── CTA BUTTON ── */
        .btn-primary {
          position: relative; overflow: hidden;
          background: var(--forest);
          color: #fff;
          transition: color 0.3s ease;
        }
        .btn-primary::before {
          content: '';
          position: absolute; inset: 0;
          background: var(--gold);
          transform: translateX(-105%);
          transition: transform 0.4s cubic-bezier(0.22,1,0.36,1);
        }
        .btn-primary:hover::before { transform: translateX(0); }
        .btn-primary span { position: relative; z-index: 1; }

        /* ── SECTION DIVIDER ── */
        .divider {
          width: 100%; height: 1px;
          background: linear-gradient(90deg, transparent, var(--border), transparent);
        }

        /* ── INPUT FOCUS ── */
        .field-input {
          border: 1px solid var(--border);
          background: var(--warm-white);
          transition: border-color 0.3s ease, box-shadow 0.3s ease;
          outline: none;
          font-family: 'DM Sans', sans-serif;
        }
        .field-input:focus {
          border-color: var(--forest-mid);
          box-shadow: 0 0 0 3px rgba(45,90,64,0.08);
        }

        /* ── PROGRESS BAR ANIMATE ── */
        .prog-bar { transition: width 1.2s cubic-bezier(0.22,1,0.36,1) 0.3s; }
        .bar-wrap:not(.is-visible) .prog-bar { width: 0 !important; }
        .bar-wrap.is-visible .prog-bar { /* uses inline width */ }
      `}</style>

      <main style={{ minHeight: "100vh", background: "var(--cream)" }}>

        {/* ══════════════ NAVBAR ══════════════ */}
        <nav
          className={`fixed top-0 w-full z-50 transition-all duration-300 ${scrolled ? "nav-scrolled" : ""}`}
          style={{ background: scrolled ? undefined : "transparent" }}
        >
          <div style={{ maxWidth: 1320, margin: "0 auto", padding: "0 32px", height: 76, display: "flex", alignItems: "center", justifyContent: "space-between" }}>

            {/* Logo */}
            <button
              onClick={() => { setActiveTab("tentang"); setShowCheckout(false); setMobileMenuOpen(false); }}
              style={{ display: "flex", flexDirection: "column", gap: 0, textAlign: "left", cursor: "pointer", background: "none", border: "none", padding: 0 }}
            >
              <span className="font-display" style={{ fontSize: 22, fontWeight: 600, color: "var(--forest)", lineHeight: 1, letterSpacing: "-0.02em" }}>Ciburial</span>
              <span style={{ fontSize: 10, fontWeight: 600, color: "var(--gold)", letterSpacing: "0.18em", textTransform: "uppercase" }}>Eco-Digital Village</span>
            </button>

            {/* Desktop Nav */}
            <div style={{ display: "flex", gap: 8, alignItems: "center" }} className="hidden md:flex">
              {(["tentang", "marketplace"] as const).map((tab) => (
                <button
                  key={tab}
                  onClick={() => { setActiveTab(tab); setShowCheckout(false); }}
                  style={{
                    padding: "10px 20px",
                    fontSize: 12,
                    fontWeight: 600,
                    letterSpacing: "0.1em",
                    textTransform: "uppercase",
                    border: "none",
                    borderRadius: 99,
                    cursor: "pointer",
                    transition: "all 0.25s ease",
                    background: (activeTab === tab && !showCheckout) || (tab === "marketplace" && showCheckout)
                      ? "var(--forest)"
                      : "transparent",
                    color: (activeTab === tab && !showCheckout) || (tab === "marketplace" && showCheckout)
                      ? "#fff"
                      : "var(--text-secondary)",
                  }}
                >
                  {tab === "tentang" ? "Tentang Kampung" : "Marketplace"}
                </button>
              ))}
            </div>

            {/* Mobile hamburger */}
            <button
              className="md:hidden"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              style={{ background: "none", border: "none", cursor: "pointer", padding: 8 }}
            >
              <div style={{ width: 22, height: 2, background: "var(--forest)", marginBottom: 5, borderRadius: 2 }} />
              <div style={{ width: 16, height: 2, background: "var(--forest)", marginBottom: 5, borderRadius: 2 }} />
              <div style={{ width: 22, height: 2, background: "var(--forest)", borderRadius: 2 }} />
            </button>
          </div>

          {/* Mobile menu */}
          <div
            className={`mobile-menu md:hidden ${mobileMenuOpen ? "open" : "closed"}`}
            style={{ background: "var(--warm-white)", borderTop: "1px solid var(--border)", padding: "16px 32px 24px" }}
          >
            {(["tentang", "marketplace"] as const).map((tab) => (
              <button
                key={tab}
                onClick={() => { setActiveTab(tab); setShowCheckout(false); setMobileMenuOpen(false); }}
                style={{ display: "block", width: "100%", textAlign: "left", padding: "12px 0", fontSize: 13, fontWeight: 600, letterSpacing: "0.08em", textTransform: "uppercase", background: "none", border: "none", color: activeTab === tab ? "var(--forest)" : "var(--text-secondary)", cursor: "pointer", borderBottom: "1px solid var(--border)" }}
              >
                {tab === "tentang" ? "Tentang Kampung" : "Marketplace"}
              </button>
            ))}
          </div>
        </nav>

        {/* ══════════════ TAB: TENTANG ══════════════ */}
        {activeTab === "tentang" && !showCheckout && (
          <div className="page-in">

            {/* ── HERO ── */}
            <section
              style={{
                minHeight: "100vh",
                display: "flex",
                flexDirection: "column",
                justifyContent: "flex-end",
                padding: "0 32px 80px",
                position: "relative",
                overflow: "hidden",
                background: "var(--cream)",
              }}
            >
              {/* Background decoration */}
              <div style={{
                position: "absolute", top: 0, right: 0,
                width: "45%", height: "100%",
                background: "linear-gradient(135deg, var(--forest) 0%, var(--forest-mid) 60%, var(--forest-light) 100%)",
                clipPath: "polygon(15% 0%, 100% 0%, 100% 100%, 0% 100%)",
                opacity: 0.06,
              }} />
              <div style={{
                position: "absolute", bottom: 0, left: 0,
                width: "100%", height: "40%",
                background: "linear-gradient(0deg, var(--cream-dark) 0%, transparent 100%)",
                pointerEvents: "none",
              }} />

              {/* Floating label top */}
              <div className="hero-line-1" style={{ position: "absolute", top: 120, left: 32, display: "flex", alignItems: "center", gap: 12 }}>
                <div style={{ width: 32, height: 1, background: "var(--gold)" }} />
                <span style={{ fontSize: 10, fontWeight: 700, letterSpacing: "0.2em", textTransform: "uppercase", color: "var(--gold)" }}>Kp. Ciburial, Garut — Est. 2026</span>
              </div>

              <div style={{ maxWidth: 1320, margin: "0 auto", width: "100%" }}>
                <div className="hero-line-2" style={{ marginBottom: 8 }}>
                  <span style={{ fontSize: 13, fontWeight: 600, letterSpacing: "0.15em", textTransform: "uppercase", color: "var(--earth-mid)" }}>Selamat Datang di</span>
                </div>
                <h1 className="font-display hero-line-3" style={{
                  fontSize: "clamp(64px, 12vw, 160px)",
                  fontWeight: 300,
                  lineHeight: 0.9,
                  color: "var(--forest)",
                  letterSpacing: "-0.03em",
                  marginBottom: 8,
                }}>
                  Ciburial
                </h1>
                <h2 className="font-display hero-line-4" style={{
                  fontSize: "clamp(28px, 5vw, 64px)",
                  fontWeight: 600,
                  fontStyle: "italic",
                  color: "var(--gold)",
                  letterSpacing: "-0.02em",
                  marginBottom: 40,
                }}>
                  Eco-Digital Village
                </h2>
                <div className="hero-line-5" style={{ display: "flex", flexWrap: "wrap", gap: 16, alignItems: "center" }}>
                  <p style={{ maxWidth: 500, fontSize: 16, fontWeight: 400, lineHeight: 1.75, color: "var(--text-secondary)" }}>
                    Dari bambu jadi cahaya. Dari desa jadi masa depan. Membangun komunitas mandiri, berkelanjutan, dan terhubung dengan dunia.
                  </p>
                  <div style={{ display: "flex", gap: 12, flexWrap: "wrap", marginLeft: "auto" }}>
                    {["🌱 Pertanian", "🐄 Peternakan", "🎋 Kerajinan Bambu", "💡 Smart PJU"].map((tag) => (
                      <span key={tag} style={{
                        padding: "8px 16px",
                        fontSize: 12, fontWeight: 600,
                        border: "1px solid var(--border)",
                        borderRadius: 99,
                        color: "var(--text-secondary)",
                        background: "var(--warm-white)",
                        letterSpacing: "0.04em",
                      }}>{tag}</span>
                    ))}
                  </div>
                </div>
              </div>
            </section>

            {/* ── MARQUEE STRIP ── */}
            <div style={{ background: "var(--forest)", overflow: "hidden", padding: "14px 0", borderTop: "1px solid rgba(255,255,255,0.06)", borderBottom: "1px solid rgba(255,255,255,0.06)" }}>
              <div className="marquee-inner" style={{ display: "flex", whiteSpace: "nowrap", width: "max-content" }}>
                {[...Array(4)].map((_, i) => (
                  <span key={i} style={{ display: "flex", alignItems: "center", gap: 32, padding: "0 32px", color: "rgba(255,255,255,0.5)", fontSize: 11, fontWeight: 700, letterSpacing: "0.2em", textTransform: "uppercase" }}>
                    <span>Mandiri</span><span style={{ color: "var(--gold-light)" }}>✦</span>
                    <span>Berkelanjutan</span><span style={{ color: "var(--gold-light)" }}>✦</span>
                    <span>Terhubung</span><span style={{ color: "var(--gold-light)" }}>✦</span>
                    <span>Inovatif</span><span style={{ color: "var(--gold-light)" }}>✦</span>
                    <span>Transparan</span><span style={{ color: "var(--gold-light)" }}>✦</span>
                    <span>Eco-Digital</span><span style={{ color: "var(--gold-light)" }}>✦</span>
                  </span>
                ))}
              </div>
            </div>

            {/* ── STATS ── */}
            <section style={{ background: "var(--warm-white)", padding: "80px 32px" }}>
              <div style={{ maxWidth: 1320, margin: "0 auto" }}>
                <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))", gap: 2 }}>
                  {stats.map((s, i) => (
                    <div key={i} className={`reveal reveal-delay-${i + 1} stat-card`} style={{
                      padding: "48px 32px",
                      borderRight: i < stats.length - 1 ? "1px solid var(--border)" : "none",
                      textAlign: "center",
                    }}>
                      <div className="stat-value font-display" style={{ fontSize: "clamp(40px, 5vw, 72px)", fontWeight: 300, color: "var(--forest)", lineHeight: 1, letterSpacing: "-0.03em" }}>{s.value}</div>
                      <div style={{ fontSize: 18, fontWeight: 600, color: "var(--text-secondary)", marginTop: 4, marginBottom: 8 }}>{s.label}</div>
                      <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: "0.12em", textTransform: "uppercase", color: "var(--text-muted)" }}>{s.sub}</div>
                    </div>
                  ))}
                </div>
              </div>
            </section>

            {/* ── VISI MISI ── */}
            <section style={{ padding: "120px 32px", background: "var(--cream)" }}>
              <div style={{ maxWidth: 1320, margin: "0 auto" }}>
                <div style={{ display: "flex", flexWrap: "wrap", gap: 64, alignItems: "flex-start" }}>

                  <div className="reveal" style={{ flex: "0 0 300px" }}>
                    <div className="deco-line" />
                    <h2 className="font-display" style={{ fontSize: "clamp(36px, 4vw, 56px)", fontWeight: 300, color: "var(--forest)", lineHeight: 1.1, letterSpacing: "-0.02em", marginBottom: 20 }}>
                      Visi &<br />Misi Kami
                    </h2>
                    <p style={{ fontSize: 15, lineHeight: 1.75, color: "var(--text-secondary)", fontWeight: 400 }}>
                      Tiga pilar yang menjadi fondasi gerakan Ciburial menuju desa masa depan.
                    </p>
                  </div>

                  <div style={{ flex: 1, minWidth: 280, display: "flex", flexDirection: "column", gap: 2 }}>
                    {visi.map((v, i) => (
                      <div key={i} className={`reveal reveal-delay-${i + 1}`} style={{
                        padding: "32px",
                        background: "var(--warm-white)",
                        borderRadius: 16,
                        border: "1px solid var(--border)",
                        display: "flex",
                        gap: 24,
                        alignItems: "flex-start",
                        marginBottom: 8,
                        transition: "background 0.3s ease",
                      }}
                        onMouseEnter={e => (e.currentTarget.style.background = "var(--cream-dark)")}
                        onMouseLeave={e => (e.currentTarget.style.background = "var(--warm-white)")}
                      >
                        <span className="font-display" style={{ fontSize: 13, fontWeight: 700, color: "var(--gold)", letterSpacing: "0.05em", minWidth: 32, paddingTop: 3 }}>{v.no}</span>
                        <span style={{ fontSize: 28 }}>{v.icon}</span>
                        <div>
                          <h3 style={{ fontSize: 17, fontWeight: 700, color: "var(--text-primary)", marginBottom: 6 }}>{v.title}</h3>
                          <p style={{ fontSize: 14, lineHeight: 1.7, color: "var(--text-secondary)", fontWeight: 400 }}>{v.desc}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </section>

            {/* ── DEMOGRAFI ── */}
            <section style={{ padding: "120px 32px", background: "var(--forest)", position: "relative" }}>
              <div style={{ maxWidth: 1320, margin: "0 auto", position: "relative", zIndex: 1 }}>
                <div className="reveal" style={{ marginBottom: 72, textAlign: "center" }}>
                  <div className="deco-line" style={{ display: "block", margin: "0 auto 24px" }} />
                  <h2 className="font-display" style={{ fontSize: "clamp(36px, 5vw, 64px)", fontWeight: 300, color: "var(--cream)", lineHeight: 1.1, letterSpacing: "-0.02em" }}>Keluarga Besar Ciburial</h2>
                  <p style={{ color: "rgba(250,248,243,0.55)", fontWeight: 400, fontSize: 15, marginTop: 12, maxWidth: 480, margin: "12px auto 0" }}>Catatan jiwa yang hidup di tanah ini — pemuda mendominasi, membawa harapan baru.</p>
                </div>

                <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))", gap: 24 }}>
                  {[
                    { label: "Pemuda (Penerus)", pct: 55, color: "var(--gold)" },
                    { label: "Lansia (Sesepuh)", pct: 45, color: "rgba(250,248,243,0.35)" },
                  ].map((item, i) => (
                    <div key={i} className={`reveal bar-wrap reveal-delay-${i + 1}`} style={{
                      padding: "40px",
                      background: "rgba(255,255,255,0.05)",
                      borderRadius: 20,
                      border: "1px solid rgba(255,255,255,0.08)",
                    }}>
                      <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 20 }}>
                        <span style={{ fontSize: 14, fontWeight: 600, color: "rgba(250,248,243,0.75)", letterSpacing: "0.02em" }}>{item.label}</span>
                        <span className="font-display" style={{ fontSize: 36, fontWeight: 300, color: "var(--cream)", lineHeight: 1 }}>{item.pct}%</span>
                      </div>
                      <div style={{ height: 4, background: "rgba(255,255,255,0.1)", borderRadius: 99, overflow: "hidden" }}>
                        <div className="prog-bar" style={{ height: "100%", background: item.color, borderRadius: 99, width: `${item.pct}%` }} />
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </section>

            {/* ── PAGUYUBAN ── */}
            <section style={{ padding: "120px 32px", background: "var(--cream)" }}>
              <div style={{ maxWidth: 1320, margin: "0 auto" }}>
                <div className="reveal" style={{ marginBottom: 72, textAlign: "center" }}>
                  <div className="deco-line" style={{ display: "block", margin: "0 auto 24px" }} />
                  <h2 className="font-display" style={{ fontSize: "clamp(36px, 5vw, 64px)", fontWeight: 300, color: "var(--forest)", lineHeight: 1.1, letterSpacing: "-0.02em" }}>Paguyuban Desa</h2>
                  <p style={{ color: "var(--text-secondary)", fontWeight: 400, fontSize: 15, marginTop: 12 }}>Harmoni kepengurusan yang menggerakkan Ciburial.</p>
                </div>

                {/* Tokoh Desa */}
                <div style={{ display: "flex", justifyContent: "center", gap: 24, flexWrap: "wrap", marginBottom: 64 }}>
                  {orgDesa.map((item, i) => (
                    <div key={i} className={`reveal org-card reveal-delay-${i + 1}`} style={{
                      width: 200,
                      background: "var(--warm-white)",
                      border: "1px solid var(--border)",
                      borderRadius: 20,
                      padding: "32px 20px 24px",
                      textAlign: "center",
                    }}>
                      <div style={{
                        width: 72, height: 72, borderRadius: "50%",
                        background: "var(--cream-dark)",
                        margin: "0 auto 16px",
                        display: "flex", alignItems: "center", justifyContent: "center",
                        fontSize: 28, border: "2px solid var(--border)",
                      }}>{item.icon}</div>
                      <div style={{ fontSize: 15, fontWeight: 700, color: "var(--text-primary)", marginBottom: 4 }}>{item.name}</div>
                      <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: "0.1em", textTransform: "uppercase", color: "var(--gold)" }}>{item.role}</div>
                    </div>
                  ))}
                </div>

                {/* RT + Pemuda */}
                <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))", gap: 24 }}>
                  <div className="reveal" style={{ background: "var(--warm-white)", border: "1px solid var(--border)", borderRadius: 24, padding: "40px" }}>
                    <h4 style={{ fontSize: 12, fontWeight: 700, letterSpacing: "0.15em", textTransform: "uppercase", color: "var(--gold)", marginBottom: 32 }}>Rukun Tetangga</h4>
                    <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
                      {orgRT.map((item, i) => (
                        <div key={i} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", paddingBottom: 16, borderBottom: i < orgRT.length - 1 ? "1px solid var(--border)" : "none" }}>
                          <span style={{ fontSize: 14, fontWeight: 600, color: "var(--text-primary)" }}>{item.name}</span>
                          <span style={{ fontSize: 11, fontWeight: 700, letterSpacing: "0.08em", textTransform: "uppercase", color: "var(--text-muted)", background: "var(--cream-dark)", padding: "4px 10px", borderRadius: 99 }}>{item.role}</span>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="reveal reveal-delay-2" style={{ background: "var(--warm-white)", border: "1px solid var(--border)", borderRadius: 24, padding: "40px" }}>
                    <h4 style={{ fontSize: 12, fontWeight: 700, letterSpacing: "0.15em", textTransform: "uppercase", color: "var(--gold)", marginBottom: 32 }}>Pemuda Makers</h4>
                    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
                      {orgPemuda.map((item, i) => (
                        <div key={i} style={{ padding: "16px", background: "var(--cream)", borderRadius: 12, border: "1px solid var(--border)" }}>
                          <div style={{ fontSize: 13, fontWeight: 700, color: "var(--text-primary)", marginBottom: 3 }}>{item.name}</div>
                          <div style={{ fontSize: 11, fontWeight: 600, color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: "0.06em" }}>{item.role}</div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            </section>

            {/* ── DONASI ── */}
            <section style={{ padding: "0 32px 120px", background: "var(--cream)" }}>
              <div style={{ maxWidth: 1320, margin: "0 auto" }}>
                <div className="reveal" style={{
                  borderRadius: 32,
                  overflow: "hidden",
                  display: "grid",
                  gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))",
                }}>
                  {/* Left: Donasi */}
                  <div style={{ background: "var(--forest)", padding: "72px 56px" }}>
                    <div className="deco-line" />
                    <h2 className="font-display" style={{ fontSize: 40, fontWeight: 300, color: "var(--cream)", lineHeight: 1.15, letterSpacing: "-0.02em", marginBottom: 16 }}>
                      Donasi<br />Kemakmuran<br />Kampung
                    </h2>
                    <p style={{ fontSize: 14, lineHeight: 1.8, color: "rgba(250,248,243,0.6)", fontWeight: 400, marginBottom: 40 }}>
                      Salurkan dukungan Anda untuk mewujudkan fasilitas penerangan jalan dan pemberdayaan pemuda.
                    </p>
                    <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                      {[{ icon: "📱", label: "QRIS", sub: "Scan & Bayar" }, { icon: "🏦", label: "Transfer Bank", sub: "Rekening Resmi" }].map((m, i) => (
                        <div key={i} style={{ display: "flex", alignItems: "center", gap: 16, padding: "16px 20px", background: "rgba(255,255,255,0.06)", borderRadius: 12, border: "1px solid rgba(255,255,255,0.1)", cursor: "pointer", transition: "background 0.2s" }}
                          onMouseEnter={e => (e.currentTarget.style.background = "rgba(255,255,255,0.1)")}
                          onMouseLeave={e => (e.currentTarget.style.background = "rgba(255,255,255,0.06)")}
                        >
                          <span style={{ fontSize: 24 }}>{m.icon}</span>
                          <div>
                            <div style={{ fontSize: 13, fontWeight: 700, color: "var(--cream)" }}>{m.label}</div>
                            <div style={{ fontSize: 11, color: "rgba(250,248,243,0.45)", fontWeight: 500 }}>{m.sub}</div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Right: Doa */}
                  <div style={{ background: "var(--earth)", padding: "72px 56px", display: "flex", flexDirection: "column", justifyContent: "center" }}>
                    <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: "0.2em", textTransform: "uppercase", color: "var(--gold)", marginBottom: 24 }}>Doa untuk Donatur</div>
                    <p dir="rtl" className="font-display" style={{ fontSize: "clamp(20px, 3vw, 30px)", lineHeight: 1.8, color: "var(--cream)", fontWeight: 400, marginBottom: 24 }}>
                      رَبَّنَا آتِنَا فِي الدُّنْيَا حَسَنَةً وَفِي الْآخِرَةِ حَسَنَةً وَقِنَا عَذَابَ النَّارِ
                    </p>
                    <p style={{ fontSize: 13, fontStyle: "italic", lineHeight: 1.8, color: "rgba(250,248,243,0.55)", fontWeight: 400, marginBottom: 16 }}>
                      "Ya Tuhan kami, berilah kebaikan di dunia dan di akhirat, serta lindungilah dari siksa neraka."
                    </p>
                    <span style={{ fontSize: 11, fontWeight: 700, letterSpacing: "0.1em", textTransform: "uppercase", color: "var(--gold-light)", opacity: 0.7 }}>QS. Al-Baqarah: 201</span>
                  </div>
                </div>
              </div>
            </section>

          </div>
        )}

        {/* ══════════════ TAB: MARKETPLACE ══════════════ */}
        {activeTab === "marketplace" && !showCheckout && (
          <div className="page-in" style={{ paddingTop: 120, paddingBottom: 120 }}>
            <div style={{ maxWidth: 1320, margin: "0 auto", padding: "0 32px" }}>

              {/* Header */}
              <div className="reveal" style={{ marginBottom: 80, display: "flex", flexWrap: "wrap", alignItems: "flex-end", justifyContent: "space-between", gap: 24 }}>
                <div>
                  <div className="deco-line" />
                  <h1 className="font-display" style={{ fontSize: "clamp(48px, 7vw, 96px)", fontWeight: 300, color: "var(--forest)", lineHeight: 0.95, letterSpacing: "-0.03em" }}>
                    Galeri<br /><em>Produk</em>
                  </h1>
                </div>
                <p style={{ maxWidth: 340, fontSize: 14, lineHeight: 1.75, color: "var(--text-secondary)", fontWeight: 400 }}>
                  Setiap produk adalah cerminan keahlian dan kecintaan pemuda Ciburial terhadap tanah dan bambu mereka.
                </p>
              </div>

              {/* Products grid */}
              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(300px, 1fr))", gap: 24 }}>
                {[
                  { name: "Lampu Hex-Bamboo", desc: "Lampu tidur estetik dari anyaman bambu asli pegunungan Ciburial. Cahaya hangat, aroma alami.", price: "Rp 150.000", tag: "Best Seller" },
                  { name: "Keranjang Anyam", desc: "Kerajinan tangan warga — multifungsi dan ramah lingkungan, cocok untuk dekorasi rumah.", price: "Rp 85.000", tag: "Handmade" },
                  { name: "Mini Pot Bambu", desc: "Pot tanaman dari bambu pilihan. Natural, kuat, dan mempercantik ruangan Anda.", price: "Rp 60.000", tag: "Eco" },
                ].map((p, i) => (
                  <div key={i} className={`reveal product-card reveal-delay-${i + 1}`} style={{
                    background: "var(--warm-white)",
                    border: "1px solid var(--border)",
                    borderRadius: 24,
                    overflow: "hidden",
                  }}>
                    {/* Image placeholder */}
                    <div style={{
                      aspectRatio: "4/3",
                      background: "linear-gradient(135deg, var(--cream-dark) 0%, var(--cream) 100%)",
                      display: "flex", alignItems: "center", justifyContent: "center",
                      position: "relative",
                    }}>
                      <span style={{ fontSize: 48 }}>🎋</span>
                      <div style={{ position: "absolute", top: 16, left: 16, padding: "6px 12px", background: "var(--forest)", borderRadius: 99, fontSize: 10, fontWeight: 700, letterSpacing: "0.1em", textTransform: "uppercase", color: "#fff" }}>{p.tag}</div>
                    </div>
                    <div style={{ padding: "28px 28px 24px" }}>
                      <h3 style={{ fontSize: 18, fontWeight: 700, color: "var(--text-primary)", marginBottom: 8 }}>{p.name}</h3>
                      <p style={{ fontSize: 13, lineHeight: 1.65, color: "var(--text-secondary)", fontWeight: 400, marginBottom: 24 }}>{p.desc}</p>
                      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", paddingTop: 20, borderTop: "1px solid var(--border)" }}>
                        <span className="font-display" style={{ fontSize: 22, fontWeight: 600, color: "var(--forest)" }}>{p.price}</span>
                        <button
                          onClick={() => setShowCheckout(true)}
                          className="btn-primary"
                          style={{ padding: "10px 24px", borderRadius: 99, fontSize: 12, fontWeight: 700, letterSpacing: "0.08em", textTransform: "uppercase", border: "none", cursor: "pointer" }}
                        >
                          <span>Beli Sekarang</span>
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* ══════════════ CHECKOUT ══════════════ */}
        {showCheckout && (
          <div className="page-in" style={{ paddingTop: 120, paddingBottom: 120, minHeight: "100vh" }}>
            <div style={{ maxWidth: 640, margin: "0 auto", padding: "0 32px" }}>

              <button
                onClick={() => setShowCheckout(false)}
                style={{ display: "flex", alignItems: "center", gap: 8, background: "none", border: "none", cursor: "pointer", fontSize: 12, fontWeight: 700, letterSpacing: "0.1em", textTransform: "uppercase", color: "var(--text-muted)", marginBottom: 48, padding: 0, transition: "color 0.2s" }}
                onMouseEnter={e => (e.currentTarget.style.color = "var(--forest)")}
                onMouseLeave={e => (e.currentTarget.style.color = "var(--text-muted)")}
              >
                ← Kembali
              </button>

              {/* Order summary */}
              <div style={{ padding: "24px", background: "var(--forest)", borderRadius: 20, marginBottom: 24, display: "flex", alignItems: "center", gap: 20 }}>
                <span style={{ fontSize: 36 }}>🎋</span>
                <div>
                  <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: "0.15em", textTransform: "uppercase", color: "rgba(250,248,243,0.5)", marginBottom: 4 }}>Pesanan Anda</div>
                  <div style={{ fontSize: 17, fontWeight: 700, color: "var(--cream)" }}>Lampu Hex-Bamboo</div>
                  <div className="font-display" style={{ fontSize: 22, color: "var(--gold-light)", fontWeight: 600 }}>Rp 150.000</div>
                </div>
              </div>

              <div style={{ background: "var(--warm-white)", border: "1px solid var(--border)", borderRadius: 24, padding: "48px" }}>
                <h2 className="font-display" style={{ fontSize: 32, fontWeight: 300, color: "var(--forest)", letterSpacing: "-0.02em", marginBottom: 8 }}>Detail Pengiriman</h2>
                <p style={{ fontSize: 13, color: "var(--text-muted)", fontWeight: 400, marginBottom: 40 }}>Pesanan akan diteruskan ke tim Ciburial Makers melalui email resmi.</p>

                <div style={{ display: "flex", flexDirection: "column", gap: 24 }}>
                  {[
                    { label: "Nama Lengkap", type: "text", placeholder: "Cth: Budi Santoso" },
                    { label: "No. WhatsApp Aktif", type: "tel", placeholder: "Cth: 08123456789" },
                  ].map((f, i) => (
                    <div key={i}>
                      <label style={{ display: "block", fontSize: 11, fontWeight: 700, letterSpacing: "0.12em", textTransform: "uppercase", color: "var(--text-secondary)", marginBottom: 8 }}>{f.label}</label>
                      <input type={f.type} placeholder={f.placeholder} className="field-input" style={{ width: "100%", padding: "14px 18px", borderRadius: 12, fontSize: 14, fontWeight: 400 }} />
                    </div>
                  ))}
                  <div>
                    <label style={{ display: "block", fontSize: 11, fontWeight: 700, letterSpacing: "0.12em", textTransform: "uppercase", color: "var(--text-secondary)", marginBottom: 8 }}>Alamat Lengkap</label>
                    <textarea rows={4} className="field-input" style={{ width: "100%", padding: "14px 18px", borderRadius: 12, fontSize: 14, fontWeight: 400, resize: "vertical" }} />
                  </div>
                  <button
                    type="button"
                    className="btn-primary"
                    style={{ width: "100%", padding: "18px", borderRadius: 14, fontSize: 12, fontWeight: 700, letterSpacing: "0.15em", textTransform: "uppercase", border: "none", cursor: "pointer", marginTop: 8 }}
                  >
                    <span>Kirim Pesanan →</span>
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ══════════════ FOOTER ══════════════ */}
        <footer style={{ background: "var(--earth)", borderTop: "1px solid rgba(255,255,255,0.06)" }}>
          <div style={{ maxWidth: 1320, margin: "0 auto", padding: "80px 32px 64px", display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: 48 }}>

            <div style={{ gridColumn: "span 1" }}>
              <div className="font-display" style={{ fontSize: 28, fontWeight: 300, color: "var(--cream)", letterSpacing: "-0.02em", marginBottom: 4 }}>Ciburial</div>
              <div style={{ fontSize: 10, fontWeight: 700, letterSpacing: "0.2em", textTransform: "uppercase", color: "var(--gold)", marginBottom: 20 }}>Eco-Digital Village</div>
              <p style={{ fontSize: 13, lineHeight: 1.8, color: "rgba(250,248,243,0.45)", fontWeight: 400 }}>
                Pelopor desa mandiri eco-digital sejak 2026 — mahakarya bambu lokal & infrastruktur cerdas.
              </p>
            </div>

            <div>
              <h4 style={{ fontSize: 11, fontWeight: 700, letterSpacing: "0.15em", textTransform: "uppercase", color: "var(--gold)", marginBottom: 24 }}>Lokasi</h4>
              <p style={{ fontSize: 13, lineHeight: 1.9, color: "rgba(250,248,243,0.5)", fontWeight: 400 }}>
                Kp Ciburial<br />Desa Hanjuang, Kec. Bungbulang<br />Kab. Garut, Jawa Barat<br />Kode Pos 44165
              </p>
            </div>

            <div>
              <h4 style={{ fontSize: 11, fontWeight: 700, letterSpacing: "0.15em", textTransform: "uppercase", color: "var(--gold)", marginBottom: 24 }}>Navigasi</h4>
              <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                {[["Tentang Kampung", "tentang"], ["Marketplace", "marketplace"]].map(([label, tab]) => (
                  <button key={tab} onClick={() => { setActiveTab(tab as any); setShowCheckout(false); }} style={{ background: "none", border: "none", cursor: "pointer", textAlign: "left", fontSize: 13, fontWeight: 500, color: "rgba(250,248,243,0.5)", padding: 0, transition: "color 0.2s" }}
                    onMouseEnter={e => (e.currentTarget.style.color = "var(--cream)")}
                    onMouseLeave={e => (e.currentTarget.style.color = "rgba(250,248,243,0.5)")}
                  >{label}</button>
                ))}
              </div>
            </div>

            <div>
              <h4 style={{ fontSize: 11, fontWeight: 700, letterSpacing: "0.15em", textTransform: "uppercase", color: "var(--gold)", marginBottom: 24 }}>Kontak</h4>
              <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                {["ciburial.smarthub@gmail.com", "support.ciburial@gmail.com"].map((email) => (
                  <a key={email} href={`mailto:${email}`} style={{ fontSize: 12, fontWeight: 500, color: "rgba(250,248,243,0.5)", textDecoration: "none", transition: "color 0.2s" }}
                    onMouseEnter={e => (e.currentTarget.style.color = "var(--cream)")}
                    onMouseLeave={e => (e.currentTarget.style.color = "rgba(250,248,243,0.5)")}
                  >{email}</a>
                ))}
              </div>
            </div>
          </div>

          {/* Bottom bar */}
          <div style={{ borderTop: "1px solid rgba(255,255,255,0.06)", padding: "24px 32px", maxWidth: 1320, margin: "0 auto", display: "flex", flexWrap: "wrap", alignItems: "center", justifyContent: "space-between", gap: 16 }}>
            <p style={{ fontSize: 11, fontWeight: 600, color: "rgba(250,248,243,0.3)", letterSpacing: "0.08em", textTransform: "uppercase" }}>
              © {new Date().getFullYear()} Ciburial Eco-Digital Village. All Rights Reserved.
            </p>
            <div style={{ display: "flex", gap: 20 }}>
              {[
                { href: "#", icon: <path fillRule="evenodd" d="M22 12c0-5.523-4.477-10-10-10S2 6.477 2 12c0 4.991 3.657 9.128 8.438 9.878v-6.987h-2.54V12h2.54V9.797c0-2.506 1.492-3.89 3.777-3.89 1.094 0 2.238.195 2.238.195v2.46h-1.26c-1.243 0-1.63.771-1.63 1.562V12h2.773l-.443 2.89h-2.33v6.988C18.343 21.128 22 16.991 22 12z" clipRule="evenodd" /> },
                { href: "#", icon: <path fillRule="evenodd" d="M21.582 6.186a2.665 2.665 0 00-1.876-1.884C17.96 3.842 12 3.842 12 3.842s-5.96 0-7.706.46A2.665 2.665 0 002.418 6.186C2 7.942 2 12 2 12s0 4.058.418 5.814a2.665 2.665 0 001.876 1.884C5.96 20.158 12 20.158 12 20.158s5.96 0 7.706-.46a2.665 2.665 0 001.876-1.884C22 15.942 22 12 22 12s0-4.058-.418-5.814zM9.99 15.292v-6.58L15.694 12l-5.704 3.292z" clipRule="evenodd" /> },
                { href: "#", icon: <path d="M12.525.02c1.31-.02 2.61-.01 3.91-.04.08 1.53.63 3.09 1.75 4.17 1.12 1.11 2.7 1.62 4.24 1.79v4.03c-1.44-.05-2.89-.35-4.2-.97-.57-.26-1.1-.59-1.62-.93-.01 2.92.01 5.84-.02 8.75-.08 1.4-.54 2.79-1.35 3.94-1.31 1.92-3.58 3.17-5.91 3.21-1.43.08-2.86-.31-4.08-1.03-2.02-1.19-3.44-3.37-3.65-5.71-.02-.5-.03-1-.01-1.49.18-1.9 1.12-3.72 2.58-4.96 1.66-1.44 3.98-2.13 6.15-1.72.02 1.48-.04 2.96-.04 4.44-.99-.32-2.15-.23-3.02.37-.63.41-1.11 1.04-1.36 1.75-.21.51-.15 1.07-.14 1.61.24 1.64 1.82 3.02 3.5 2.87 1.12-.01 2.19-.66 2.77-1.61.19-.33.4-.67.41-1.06.1-1.79.06-3.57.07-5.36.01-4.03-.01-8.05.02-12.07z" /> },
              ].map((s, i) => (
                <a key={i} href={s.href} style={{ color: "rgba(250,248,243,0.3)", transition: "color 0.2s" }}
                  onMouseEnter={e => ((e.currentTarget as HTMLAnchorElement).style.color = "var(--cream)")}
                  onMouseLeave={e => ((e.currentTarget as HTMLAnchorElement).style.color = "rgba(250,248,243,0.3)")}
                >
                  <svg style={{ width: 18, height: 18 }} fill="currentColor" viewBox="0 0 24 24">{s.icon}</svg>
                </a>
              ))}
            </div>
          </div>
        </footer>

      </main>
    </>
  );
}