"use client";
import { useState } from "react";
import { TabType, TABS } from "./types";

interface NavbarProps {
  tab: TabType;
  checkout: boolean;
  scrolled: boolean;
  onNavigate: (t: TabType) => void;
}

export default function Navbar({ tab, checkout, scrolled, onNavigate }: NavbarProps) {
  const [mobOpen, setMobOpen] = useState(false);
  const [dropOpen, setDropOpen] = useState(false);

  const go = (t: TabType) => { onNavigate(t); setMobOpen(false); };

  return (
    <nav className={scrolled ? "ng" : ""} style={{ position: "sticky", top: 0, width: "100%", height: "70px", zIndex: 50, transition: "all 0.3s ease-in-out", background: "transparant" }}>
      <div style={{ maxWidth: 1320, margin: "0 auto", padding: "0 clamp(12px, 4vw, 28px)", height: 70, display: "flex", alignItems: "center", justifyContent: "space-between" }}>

        <button onClick={() => go("tentang")} style={{ background: "none", border: "none", cursor: "pointer", textAlign: "left" }}>
          <div className="fnt" style={{ fontSize: 20, fontWeight: 600, color: "var(--fo)", lineHeight: 1, letterSpacing: "-.02em" }}>Ciburial</div>
          <div style={{ fontSize: 9, fontWeight: 700, letterSpacing: ".18em", textTransform: "uppercase", color: "var(--go)" }}>Eco-Digital Village</div>
        </button>

        {/* Desktop */}
        <div className="hidden md:flex" style={{ gap: 2, alignItems: "center" }}>
          {TABS.map(t => (
            <button key={t.key} onClick={() => go(t.key)} style={{ padding: "8px 14px", fontSize: 11, fontWeight: 600, letterSpacing: ".08em", textTransform: "uppercase", border: "none", borderRadius: 99, cursor: "pointer", transition: "all .25s", background: (tab === t.key) || (t.key === "marketplace" && checkout) ? "var(--fo)" : "transparent", color: (tab === t.key) || (t.key === "marketplace" && checkout) ? "#fff" : "var(--ts)" }}>
              {t.label}
            </button>
          ))}
          {/* Dropdown Layanan Warga */}
          <div style={{ position: "relative" }} onMouseEnter={() => setDropOpen(true)} onMouseLeave={() => setDropOpen(false)}>
            <button style={{
              display: "flex", alignItems: "center", gap: 5,
              padding: "8px 14px", fontSize: 11, fontWeight: 600, letterSpacing: ".08em", textTransform: "uppercase",
              border: "none", borderRadius: 99, cursor: "pointer", transition: "all .25s",
              background: dropOpen ? "var(--fo)" : "transparent",
              color: dropOpen ? "#fff" : "var(--ts)",
            }}>
              Layanan
              <span style={{ fontSize: 9, transition: "transform .25s", transform: dropOpen ? "rotate(180deg)" : "rotate(0)" }}>▾</span>
            </button>
            <div className={`drop-menu ${dropOpen ? "open" : ""}`}>
              <a href="/kalender" className="drop-item">
                <span style={{ fontSize: 18 }}>📅</span>
                <div>
                  <div style={{ fontWeight: 700, color: "var(--tp)" }}>Kalender Kegiatan</div>
                  <div style={{ fontSize: 10, color: "var(--tm)", fontWeight: 500 }}>Agenda & jadwal kampung</div>
                </div>
              </a>
              <div style={{ height: 1, background: "var(--bo)", margin: "4px 0" }} />
              <a href="/info-harian" className="drop-item">
                <span style={{ fontSize: 18 }}>📰</span>
                <div>
                  <div style={{ fontWeight: 700, color: "var(--tp)" }}>Info Harian</div>
                  <div style={{ fontSize: 10, color: "var(--tm)", fontWeight: 500 }}>Dukungan & liputan terbaru</div>
                </div>
              </a>
              <div style={{ height: 1, background: "var(--bo)", margin: "4px 0" }} />
              <a href="/tentang" className="drop-item">
                <span style={{ fontSize: 18 }}>ℹ️</span>
                <div>
                  <div style={{ fontWeight: 700, color: "var(--tp)" }}>Tentang</div>
                  <div style={{ fontSize: 10, color: "var(--tm)", fontWeight: 500 }}>Profil Ciburial Eco-Digital</div>
                </div>
              </a>
            </div>
          </div>

          {/* Tombol AI */}
          <a href="/ai" style={{
            display: "flex", alignItems: "center", gap: 6,
            padding: "7px 14px",
            fontSize: 11, fontWeight: 700, letterSpacing: ".08em", textTransform: "uppercase",
            borderRadius: 99, textDecoration: "none",
            background: "linear-gradient(135deg,#1a3320,#2d5a40)",
            color: "#7aad8a",
            border: "1px solid rgba(74,140,92,0.35)",
            marginLeft: 4,
            transition: "all .25s",
            boxShadow: "0 0 12px rgba(74,140,92,0.15)",
          }}
            onMouseEnter={e => { (e.currentTarget as HTMLAnchorElement).style.boxShadow = "0 0 20px rgba(74,140,92,0.35)"; (e.currentTarget as HTMLAnchorElement).style.color = "#a8d4b4"; }}
            onMouseLeave={e => { (e.currentTarget as HTMLAnchorElement).style.boxShadow = "0 0 12px rgba(74,140,92,0.15)"; (e.currentTarget as HTMLAnchorElement).style.color = "#7aad8a"; }}
          >
            <span style={{ fontSize: 14 }}>🤖</span>
            Ciburial AI
            <span style={{ fontSize: 9, padding: "2px 6px", background: "rgba(74,140,92,0.25)", borderRadius: 99, letterSpacing: ".06em" }}>BETA</span>
          </a>
        </div>

        {/* Mobile burger */}
        <button className="md:hidden" onClick={() => setMobOpen(!mobOpen)} style={{ background: "none", border: "none", cursor: "pointer", padding: 8, display: "flex", flexDirection: "column", gap: 5 }}>
          <div style={{ width: 22, height: 2, background: "var(--fo)", borderRadius: 2 }} />
          <div style={{ width: 15, height: 2, background: "var(--fo)", borderRadius: 2 }} />
          <div style={{ width: 22, height: 2, background: "var(--fo)", borderRadius: 2 }} />
        </button>
      </div>

      <div className={`mob md:hidden ${mobOpen ? "op" : ""}`} style={{ background: "var(--cw)", borderTop: "1px solid var(--bo)", padding: "12px clamp(12px, 4vw, 28px) 20px" }}>
        {TABS.map(t => (
          <button key={t.key} onClick={() => go(t.key)} style={{ display: "block", width: "100%", textAlign: "left", padding: "11px 0", fontSize: 12, fontWeight: 600, letterSpacing: ".08em", textTransform: "uppercase", background: "none", border: "none", color: tab === t.key ? "var(--fo)" : "var(--ts)", cursor: "pointer", borderBottom: "1px solid var(--bo)" }}>
            {t.label}
          </button>
        ))}
        <a href="/ai" style={{ display: "flex", alignItems: "center", gap: 8, padding: "12px 0", fontSize: 12, fontWeight: 700, letterSpacing: ".08em", textTransform: "uppercase", color: "#2d5a40", textDecoration: "none", borderBottom: "1px solid var(--bo)" }}>
          <span>🤖</span> Ciburial AI <span style={{ fontSize: 9, padding: "2px 6px", background: "rgba(45,90,64,0.1)", borderRadius: 99, color: "#4a7c59" }}>BETA</span>
        </a>
        <div style={{ padding: "8px 0 4px", borderBottom: "1px solid var(--bo)" }}>
          <div style={{ fontSize: 9, fontWeight: 700, letterSpacing: ".15em", textTransform: "uppercase", color: "var(--tm)", marginBottom: 8 }}>Layanan Warga</div>
          {[
            { href: "/kalender", icon: "📅", title: "Kalender Kegiatan", sub: "Agenda & jadwal kampung" },
            { href: "/info-harian", icon: "📰", title: "Info Harian", sub: "Dukungan & liputan terbaru" },
            { href: "/tentang", icon: "ℹ️", title: "Tentang", sub: "Profil Ciburial Eco-Digital" },
          ].map((item, i, arr) => (
            <a key={i} href={item.href} style={{ display: "flex", alignItems: "center", gap: 10, padding: "10px 0", textDecoration: "none", borderBottom: i < arr.length - 1 ? "1px solid rgba(229,224,216,.5)" : "none" }}>
              <span style={{ fontSize: 18 }}>{item.icon}</span>
              <div>
                <div style={{ fontSize: 12, fontWeight: 700, color: "var(--tp)", letterSpacing: ".04em", textTransform: "uppercase" }}>{item.title}</div>
                <div style={{ fontSize: 11, color: "var(--tm)" }}>{item.sub}</div>
              </div>
            </a>
          ))}
        </div>
      </div>
    </nav>
  );
}
