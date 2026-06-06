"use client";
import { TabType, TABS } from "./types";
import { CalendarDays, Newspaper, Info, Bot, Heart } from "lucide-react";

interface FooterProps {
  onNavigate: (t: TabType) => void;
}

// Token ukuran biar konsisten di semua kolom
const HEADING_SIZE = 10;     // h4 semua kolom
const BODY_SIZE = 10;        // p / a / button semua kolom
const MUTED_COLOR = "rgba(250,248,243,.45)";
const HOVER_COLOR = "var(--cr)";
const ICON_SIZE = 13;
const SOCIAL_SIZE = 16;

export default function Footer({ onNavigate }: FooterProps) {
  return (
    <footer style={{ background: "var(--ea)", borderTop: "1px solid rgba(255,255,255,.05)" }}>
      <div style={{ maxWidth: 1320, margin: "0 auto", padding: "clamp(20px, 5vw, 40px) clamp(12px, 3vw, 24px) clamp(16px, 4vw, 32px)", display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(min(100%, 140px),1fr))", gap: "clamp(12px, 3vw, 24px)" }}>
        {/* Brand */}
        <div>
          <div className="fnt" style={{ fontSize: 20, fontWeight: 300, color: "var(--cr)", letterSpacing: "-.02em", marginBottom: 2, lineHeight: 1 }}>Ciburial</div>
          <div style={{ fontSize: 8, fontWeight: 700, letterSpacing: ".15em", textTransform: "uppercase", color: "var(--go)", marginBottom: 8 }}>Eco-Digital Village</div>
          <p style={{ fontSize: BODY_SIZE, lineHeight: 1.6, color: MUTED_COLOR, margin: 0 }}>Pelopor eco-digital village sejak 2026 — dari Garut untuk dunia.</p>
        </div>

        {/* Lokasi */}
        <div>
          <h4 style={{ fontSize: HEADING_SIZE, fontWeight: 700, letterSpacing: ".12em", textTransform: "uppercase", color: "var(--go)", marginBottom: 10, margin: "0 0 10px 0" }}>Lokasi</h4>
          <p style={{ fontSize: BODY_SIZE, lineHeight: 1.7, color: MUTED_COLOR, margin: 0 }}>
            Kp Ciburial<br />
            Desa Hanjuang, Kec. Bungbulang<br />
            Kab. Garut 44165
          </p>
        </div>

        {/* Navigasi */}
        <div>
          <h4 style={{ fontSize: HEADING_SIZE, fontWeight: 700, letterSpacing: ".12em", textTransform: "uppercase", color: "var(--go)", marginBottom: 10, margin: "0 0 10px 0" }}>Navigasi</h4>
          <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
            {TABS.map(t => (
              <button
                key={t.key}
                onClick={() => onNavigate(t.key)}
                className="footer-nav-btn"
                style={{ background: "none", border: "none", cursor: "pointer", textAlign: "left", fontSize: BODY_SIZE, fontWeight: 500, color: MUTED_COLOR, padding: 0, transition: "color .2s", lineHeight: 1.2, margin: 0, height: "auto", minHeight: 0 }}
                onMouseEnter={e => (e.currentTarget.style.color = HOVER_COLOR)}
                onMouseLeave={e => (e.currentTarget.style.color = MUTED_COLOR)}
              >
                {t.label}
              </button>
            ))}
            <a href="/kalender" style={{ display: "flex", alignItems: "center", gap: 6, fontSize: BODY_SIZE, fontWeight: 500, color: MUTED_COLOR, textDecoration: "none", transition: "color .2s", lineHeight: 1.2 }}
              onMouseEnter={e => (e.currentTarget.style.color = HOVER_COLOR)}
              onMouseLeave={e => (e.currentTarget.style.color = MUTED_COLOR)}
            >
              <CalendarDays size={ICON_SIZE} strokeWidth={1.5} /> Kalender
            </a>
            <a href="/info-harian" style={{ display: "flex", alignItems: "center", gap: 6, fontSize: BODY_SIZE, fontWeight: 500, color: MUTED_COLOR, textDecoration: "none", transition: "color .2s", lineHeight: 1.2 }}
              onMouseEnter={e => (e.currentTarget.style.color = HOVER_COLOR)}
              onMouseLeave={e => (e.currentTarget.style.color = MUTED_COLOR)}
            >
              <Newspaper size={ICON_SIZE} strokeWidth={1.5} /> Info Harian
            </a>
            <a href="/tentang" style={{ display: "flex", alignItems: "center", gap: 6, fontSize: BODY_SIZE, fontWeight: 500, color: MUTED_COLOR, textDecoration: "none", transition: "color .2s", lineHeight: 1.2 }}
              onMouseEnter={e => (e.currentTarget.style.color = HOVER_COLOR)}
              onMouseLeave={e => (e.currentTarget.style.color = MUTED_COLOR)}
            >
              <Info size={ICON_SIZE} strokeWidth={1.5} /> Tentang
            </a>
            <a href="/ai" style={{ display: "flex", alignItems: "center", gap: 6, fontSize: BODY_SIZE, fontWeight: 500, color: "rgba(122,173,138,.7)", textDecoration: "none", transition: "color .2s", lineHeight: 1.2 }}
              onMouseEnter={e => (e.currentTarget.style.color = "#a8d4b4")}
              onMouseLeave={e => (e.currentTarget.style.color = "rgba(122,173,138,.7)")}
            >
              <Bot size={ICON_SIZE} strokeWidth={1.5} /> Ciburial AI
            </a>
          </div>
        </div>

        {/* Kontak */}
        <div>
          <h4 style={{ fontSize: HEADING_SIZE, fontWeight: 700, letterSpacing: ".12em", textTransform: "uppercase", color: "var(--go)", marginBottom: 10, margin: "0 0 10px 0" }}>Kontak</h4>
          <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
            {["ciburial.smarthub@gmail.com", "support.ciburial@gmail.com"].map(e => (
              <a
                key={e}
                href={`mailto:${e}`}
                style={{ fontSize: BODY_SIZE, fontWeight: 500, color: MUTED_COLOR, textDecoration: "none", transition: "color .2s", wordBreak: "break-all", lineHeight: 1.4 }}
                onMouseEnter={ev => (ev.currentTarget.style.color = HOVER_COLOR)}
                onMouseLeave={ev => (ev.currentTarget.style.color = MUTED_COLOR)}
              >
                {e}
              </a>
            ))}
            
            <a
              href="https://wa.me/6285520934340"
              target="_blank"
              rel="noopener noreferrer"
              style={{ display: "flex", alignItems: "center", gap: 6, fontSize: BODY_SIZE, fontWeight: 500, color: "#4FBF7E", textDecoration: "none", transition: "color .2s", marginTop: 4 }}
              onMouseEnter={ev => (ev.currentTarget.style.color = "#2F8F4E")}
              onMouseLeave={ev => (ev.currentTarget.style.color = "#4FBF7E")}
            >
              <svg style={{ width: 14, height: 14 }} viewBox="0 0 24 24" fill="currentColor">
                <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51a12.8 12.8 0 0 0-.57-.01c-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 0 1-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 0 1-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 0 1 2.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0 0 12.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 0 0 5.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 0 0-3.48-8.413Z"/>
              </svg>
              0855-2093-4340
            </a>
          </div>
        </div>
      </div>

      {/* Bottom bar */}
      <div style={{ borderTop: "1px solid rgba(255,255,255,.05)", padding: "clamp(12px, 3vw, 20px) clamp(12px, 3vw, 24px)", maxWidth: 1320, margin: "0 auto", display: "flex", flexWrap: "wrap", alignItems: "center", justifyContent: "space-between", gap: 12 }}>
        <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
          <p style={{ fontSize: 10, fontWeight: 600, color: "rgba(250,248,243,.35)", letterSpacing: ".06em", textTransform: "uppercase", margin: 0, lineHeight: 1.4 }}>
            © {new Date().getFullYear()} Ciburial Eco-Digital Village
          </p>
          <div style={{ display: "flex", alignItems: "center", gap: 4, fontSize: 10, fontWeight: 400, color: "rgba(250,248,243,.55)", lineHeight: 1.4 }}>
            Built with <Heart size={11} strokeWidth={2} style={{ color: "#E25555" }} /> by <strong style={{ color: "var(--cw)", fontWeight: 700 }}>Ubay Rahmat H</strong>
          </div>
        </div>

        <div style={{ display: "flex", gap: 14, alignItems: "center" }}>
          <a href="https://facebook.com/ubayhidayat71" target="_blank" rel="noopener noreferrer" aria-label="Facebook" style={{ color: "rgba(250,248,243,.45)", transition: "all .2s", transform: "translateY(0)", display: "inline-flex" }} onMouseEnter={e => { (e.currentTarget as HTMLAnchorElement).style.color = "var(--cr)"; (e.currentTarget as HTMLAnchorElement).style.transform = "translateY(-2px)" }} onMouseLeave={e => { (e.currentTarget as HTMLAnchorElement).style.color = "rgba(250,248,243,.45)"; (e.currentTarget as HTMLAnchorElement).style.transform = "translateY(0)" }}>
            <svg style={{ width: SOCIAL_SIZE, height: SOCIAL_SIZE }} fill="currentColor" viewBox="0 0 24 24"><path d="M22 12c0-5.523-4.477-10-10-10S2 6.477 2 12c0 4.991 3.657 9.128 8.438 9.878v-6.987h-2.54V12h2.54V9.797c0-2.506 1.492-3.89 3.777-3.89 1.094 0 2.238.195 2.238.195v2.46h-1.26c-1.243 0-1.63.771-1.63 1.562V12h2.773l-.443 2.89h-2.33v6.988C18.343 21.128 22 16.991 22 12z"/></svg>
          </a>
          <a href="https://instagram.com/ubayhidayat71" target="_blank" rel="noopener noreferrer" aria-label="Instagram" style={{ color: "rgba(250,248,243,.45)", transition: "all .2s", transform: "translateY(0)", display: "inline-flex" }} onMouseEnter={e => { (e.currentTarget as HTMLAnchorElement).style.color = "var(--cr)"; (e.currentTarget as HTMLAnchorElement).style.transform = "translateY(-2px)" }} onMouseLeave={e => { (e.currentTarget as HTMLAnchorElement).style.color = "rgba(250,248,243,.45)"; (e.currentTarget as HTMLAnchorElement).style.transform = "translateY(0)" }}>
            <svg style={{ width: SOCIAL_SIZE, height: SOCIAL_SIZE }} fill="currentColor" viewBox="0 0 24 24"><path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zM12 0C8.741 0 8.333.014 7.053.072 2.695.272.273 2.69.073 7.052.014 8.333 0 8.741 0 12c0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98C8.333 23.986 8.741 24 12 24c3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98C15.668.014 15.259 0 12 0zm0 5.838a6.162 6.162 0 100 12.324 6.162 6.162 0 000-12.324zM12 16a4 4 0 110-8 4 4 0 010 8zm6.406-11.845a1.44 1.44 0 100 2.881 1.44 1.44 0 000-2.881z"/></svg>
          </a>
          <a href="https://x.com/ubayhidayat3" target="_blank" rel="noopener noreferrer" aria-label="X / Twitter" style={{ color: "rgba(250,248,243,.45)", transition: "all .2s", transform: "translateY(0)", display: "inline-flex" }} onMouseEnter={e => { (e.currentTarget as HTMLAnchorElement).style.color = "var(--cr)"; (e.currentTarget as HTMLAnchorElement).style.transform = "translateY(-2px)" }} onMouseLeave={e => { (e.currentTarget as HTMLAnchorElement).style.color = "rgba(250,248,243,.45)"; (e.currentTarget as HTMLAnchorElement).style.transform = "translateY(0)" }}>
            <svg style={{ width: SOCIAL_SIZE, height: SOCIAL_SIZE }} fill="currentColor" viewBox="0 0 24 24"><path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/></svg>
          </a>
        </div>
      </div>
    </footer>
  );
}
