"use client";
import { useState, useEffect } from "react";
import { TabType, TABS } from "./types";
import { CalendarDays, Newspaper, Info, Bot, Search } from "lucide-react";
import ThemeToggle from "@/components/ui/ThemeToggle";

interface NavbarProps {
  tab: TabType;
  checkout: boolean;
  scrolled: boolean;
  onNavigate: (t: TabType) => void;
}

export default function Navbar({ tab, checkout, scrolled, onNavigate }: NavbarProps) {
  const [mobOpen, setMobOpen] = useState(false);
  const [dropOpen, setDropOpen] = useState(false);
  const [isMac, setIsMac] = useState(false);

  useEffect(() => {
    if (typeof navigator !== "undefined") {
      setIsMac(/Mac|iPod|iPhone|iPad/.test(navigator.platform));
    }
  }, []);

  const openPalette = () => window.dispatchEvent(new Event("ciburial:open-palette"));

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
                <CalendarDays size={18} strokeWidth={1.5} />
                <div>
                  <div style={{ fontWeight: 700, color: "var(--tp)" }}>Kalender Kegiatan</div>
                  <div style={{ fontSize: 10, color: "var(--tm)", fontWeight: 500 }}>Agenda & jadwal kampung</div>
                </div>
              </a>
              <div style={{ height: 1, background: "var(--bo)", margin: "4px 0" }} />
              <a href="/info-harian" className="drop-item">
                <Newspaper size={18} strokeWidth={1.5} />
                <div>
                  <div style={{ fontWeight: 700, color: "var(--tp)" }}>Info Harian</div>
                  <div style={{ fontSize: 10, color: "var(--tm)", fontWeight: 500 }}>Dukungan & liputan terbaru</div>
                </div>
              </a>
              <div style={{ height: 1, background: "var(--bo)", margin: "4px 0" }} />
              <a href="/tentang" className="drop-item">
                <Info size={18} strokeWidth={1.5} />
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
            <Bot size={14} strokeWidth={1.5} />
            Ciburial AI
            <span style={{ fontSize: 9, padding: "2px 6px", background: "rgba(74,140,92,0.25)", borderRadius: 99, letterSpacing: ".06em" }}>BETA</span>
          </a>
          {/* Search (⌘K) button */}
          <button
            onClick={openPalette}
            aria-label="Buka pencarian cepat"
            title="Pencarian cepat"
            style={{
              display: "flex", alignItems: "center", gap: 8,
              padding: "7px 12px 7px 12px", marginLeft: 6,
              fontSize: 11, fontWeight: 600, color: "var(--ts)",
              background: "var(--cw)", border: "1px solid var(--bo)",
              borderRadius: 99, cursor: "pointer", transition: "all .25s",
            }}
            onMouseEnter={e => { (e.currentTarget as HTMLButtonElement).style.borderColor = "var(--accent)"; (e.currentTarget as HTMLButtonElement).style.color = "var(--accent)"; }}
            onMouseLeave={e => { (e.currentTarget as HTMLButtonElement).style.borderColor = "var(--bo)"; (e.currentTarget as HTMLButtonElement).style.color = "var(--ts)"; }}
          >
            <Search size={14} strokeWidth={1.7} />
            <span>Cari</span>
            <kbd style={{ fontSize: 9, fontWeight: 700, padding: "2px 6px", borderRadius: 5, background: "var(--cd)", border: "1px solid var(--bo)", color: "var(--tm)", letterSpacing: ".02em" }}>{isMac ? "⌘K" : "Ctrl K"}</kbd>
          </button>

          {/* Theme toggle */}
          <div style={{ marginLeft: 6 }}><ThemeToggle /></div>
        </div>

        {/* Mobile burger */}
        <div className="md:hidden" style={{ display: "flex", alignItems: "center", gap: 6 }}>
          <button
            onClick={openPalette}
            aria-label="Pencarian cepat"
            style={{ width: 38, height: 38, borderRadius: 99, border: "1px solid var(--bo)", background: "var(--cw)", color: "var(--ts)", display: "inline-flex", alignItems: "center", justifyContent: "center", cursor: "pointer" }}
          >
            <Search size={16} strokeWidth={1.7} />
          </button>
          <ThemeToggle />
          <button onClick={() => setMobOpen(!mobOpen)} aria-label="Buka menu" style={{ background: "none", border: "none", cursor: "pointer", padding: 8, display: "flex", flexDirection: "column", gap: 5 }}>
            <div style={{ width: 22, height: 2, background: "var(--fo)", borderRadius: 2 }} />
            <div style={{ width: 15, height: 2, background: "var(--fo)", borderRadius: 2 }} />
            <div style={{ width: 22, height: 2, background: "var(--fo)", borderRadius: 2 }} />
          </button>
        </div>
      </div>

      <div className={`mob md:hidden ${mobOpen ? "op" : ""}`} style={{ background: "var(--cw)", borderTop: "1px solid var(--bo)", padding: "12px clamp(12px, 4vw, 28px) 20px" }}>
        {TABS.map(t => (
          <button key={t.key} onClick={() => go(t.key)} style={{ display: "block", width: "100%", textAlign: "left", padding: "11px 0", fontSize: 12, fontWeight: 600, letterSpacing: ".08em", textTransform: "uppercase", background: "none", border: "none", color: tab === t.key ? "var(--fo)" : "var(--ts)", cursor: "pointer", borderBottom: "1px solid var(--bo)" }}>
            {t.label}
          </button>
        ))}
        <a href="/ai" style={{ display: "flex", alignItems: "center", gap: 8, padding: "12px 0", fontSize: 12, fontWeight: 700, letterSpacing: ".08em", textTransform: "uppercase", color: "#2d5a40", textDecoration: "none", borderBottom: "1px solid var(--bo)" }}>
          <Bot size={16} strokeWidth={1.5} /> Ciburial AI <span style={{ fontSize: 9, padding: "2px 6px", background: "rgba(45,90,64,0.1)", borderRadius: 99, color: "#4a7c59" }}>BETA</span>
        </a>
        <div style={{ padding: "8px 0 4px", borderBottom: "1px solid var(--bo)" }}>
          <div style={{ fontSize: 9, fontWeight: 700, letterSpacing: ".15em", textTransform: "uppercase", color: "var(--tm)", marginBottom: 8 }}>Layanan Warga</div>
          {[
            { href: "/kalender", icon: <CalendarDays size={18} strokeWidth={1.5} />, title: "Kalender Kegiatan", sub: "Agenda & jadwal kampung" },
            { href: "/info-harian", icon: <Newspaper size={18} strokeWidth={1.5} />, title: "Info Harian", sub: "Dukungan & liputan terbaru" },
            { href: "/tentang", icon: <Info size={18} strokeWidth={1.5} />, title: "Tentang", sub: "Profil Ciburial Eco-Digital" },
          ].map((item, i, arr) => (
            <a key={i} href={item.href} style={{ display: "flex", alignItems: "center", gap: 10, padding: "10px 0", textDecoration: "none", borderBottom: i < arr.length - 1 ? "1px solid rgba(229,224,216,.5)" : "none" }}>
              {item.icon}
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
