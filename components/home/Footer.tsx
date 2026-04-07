"use client";
import { TabType, TABS } from "./types";

interface FooterProps {
  onNavigate: (t: TabType) => void;
}

export default function Footer({ onNavigate }: FooterProps) {
  return (
    <footer style={{ background: "var(--ea)", borderTop: "1px solid rgba(255,255,255,.05)" }}>
      <div style={{ maxWidth: 1320, margin: "0 auto", padding: "64px 28px 48px", display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(160px,1fr))", gap: 40 }}>
        <div>
          <div className="fnt" style={{ fontSize: 24, fontWeight: 300, color: "var(--cr)", letterSpacing: "-.02em", marginBottom: 4 }}>Ciburial</div>
          <div style={{ fontSize: 9, fontWeight: 700, letterSpacing: ".18em", textTransform: "uppercase", color: "var(--go)", marginBottom: 6 }}>Eco-Digital Village</div>
          <div className="fnt" style={{ fontSize: 12, fontStyle: "italic", color: "rgba(250,248,243,.35)", marginBottom: 14 }}>Inovasi Desa Mandiri Berbasis Kearifan Lokal</div>
          <p style={{ fontSize: 12, lineHeight: 1.85, color: "rgba(250,248,243,.35)" }}>Pelopor eco-digital village sejak 2026 — bambu lokal & infrastruktur cerdas dari Garut untuk dunia.</p>
        </div>
        <div>
          <h4 style={{ fontSize: 10, fontWeight: 700, letterSpacing: ".14em", textTransform: "uppercase", color: "var(--go)", marginBottom: 18 }}>Lokasi</h4>
          <p style={{ fontSize: 12, lineHeight: 1.9, color: "rgba(250,248,243,.38)" }}>Kp Ciburial<br />Desa Hanjuang, Kec. Bungbulang<br />Kab. Garut, Jawa Barat 44165</p>
        </div>
        <div>
          <h4 style={{ fontSize: 10, fontWeight: 700, letterSpacing: ".14em", textTransform: "uppercase", color: "var(--go)", marginBottom: 18 }}>Navigasi</h4>
          <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
            {TABS.map(t => (
              <button key={t.key} onClick={() => onNavigate(t.key)} style={{ background: "none", border: "none", cursor: "pointer", textAlign: "left", fontSize: 12, fontWeight: 500, color: "rgba(250,248,243,.38)", padding: 0, transition: "color .2s" }}
                onMouseEnter={e => (e.currentTarget.style.color = "var(--cr)")}
                onMouseLeave={e => (e.currentTarget.style.color = "rgba(250,248,243,.38)")}
              >{t.label}</button>
            ))}
            <a href="/kalender" style={{ fontSize: 12, fontWeight: 500, color: "rgba(250,248,243,.38)", textDecoration: "none", transition: "color .2s" }}
              onMouseEnter={e => (e.currentTarget.style.color = "var(--cr)")}
              onMouseLeave={e => (e.currentTarget.style.color = "rgba(250,248,243,.38)")}
            >📅 Kalender Kegiatan</a>
            <a href="/pengaduan" style={{ fontSize: 12, fontWeight: 500, color: "rgba(250,248,243,.38)", textDecoration: "none", transition: "color .2s" }}
              onMouseEnter={e => (e.currentTarget.style.color = "var(--cr)")}
              onMouseLeave={e => (e.currentTarget.style.color = "rgba(250,248,243,.38)")}
            >📢 Pengaduan Warga</a>
            <a href="/voting" style={{ fontSize: 12, fontWeight: 500, color: "rgba(250,248,243,.38)", textDecoration: "none", transition: "color .2s" }}
              onMouseEnter={e => (e.currentTarget.style.color = "var(--cr)")}
              onMouseLeave={e => (e.currentTarget.style.color = "rgba(250,248,243,.38)")}
            >🗳️ Voting</a>
            <a href="/tukar-poin" style={{ fontSize: 12, fontWeight: 500, color: "rgba(250,248,243,.38)", textDecoration: "none", transition: "color .2s" }}
              onMouseEnter={e => (e.currentTarget.style.color = "var(--cr)")}
              onMouseLeave={e => (e.currentTarget.style.color = "rgba(250,248,243,.38)")}
            >♻️ Tukar Poin</a>
            <a href="/ai" style={{ fontSize: 12, fontWeight: 500, color: "rgba(122,173,138,.6)", textDecoration: "none", transition: "color .2s" }}
              onMouseEnter={e => (e.currentTarget.style.color = "#7aad8a")}
              onMouseLeave={e => (e.currentTarget.style.color = "rgba(122,173,138,.6)")}
            >🤖 Ciburial AI</a>
          </div>
        </div>
        <div>
          <h4 style={{ fontSize: 10, fontWeight: 700, letterSpacing: ".14em", textTransform: "uppercase", color: "var(--go)", marginBottom: 18 }}>Kontak</h4>
          <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
            {["ciburial.smarthub@gmail.com", "support.ciburial@gmail.com"].map(e => (
              <a key={e} href={`mailto:${e}`} style={{ fontSize: 12, fontWeight: 500, color: "rgba(250,248,243,.38)", textDecoration: "none", transition: "color .2s" }}
                onMouseEnter={ev => (ev.currentTarget.style.color = "var(--cr)")}
                onMouseLeave={ev => (ev.currentTarget.style.color = "rgba(250,248,243,.38)")}
              >{e}</a>
            ))}
          </div>
        </div>
      </div>
      <div style={{ borderTop: "1px solid rgba(255,255,255,.05)", padding: "16px 28px", maxWidth: 1320, margin: "0 auto", display: "flex", flexWrap: "wrap", alignItems: "center", justifyContent: "space-between", gap: 14 }}>
        <p style={{ fontSize: 10, fontWeight: 600, color: "rgba(250,248,243,.2)", letterSpacing: ".07em", textTransform: "uppercase" }}>
          © {new Date().getFullYear()} Ciburial Eco-Digital Village. All Rights Reserved.
        </p>
        <div style={{ display: "flex", gap: 16 }}>
          {[
            <path key="fb" fillRule="evenodd" d="M22 12c0-5.523-4.477-10-10-10S2 6.477 2 12c0 4.991 3.657 9.128 8.438 9.878v-6.987h-2.54V12h2.54V9.797c0-2.506 1.492-3.89 3.777-3.89 1.094 0 2.238.195 2.238.195v2.46h-1.26c-1.243 0-1.63.771-1.63 1.562V12h2.773l-.443 2.89h-2.33v6.988C18.343 21.128 22 16.991 22 12z" clipRule="evenodd" />,
            <path key="yt" fillRule="evenodd" d="M21.582 6.186a2.665 2.665 0 00-1.876-1.884C17.96 3.842 12 3.842 12 3.842s-5.96 0-7.706.46A2.665 2.665 0 002.418 6.186C2 7.942 2 12 2 12s0 4.058.418 5.814a2.665 2.665 0 001.876 1.884C5.96 20.158 12 20.158 12 20.158s5.96 0 7.706-.46a2.665 2.665 0 001.876-1.884C22 15.942 22 12 22 12s0-4.058-.418-5.814zM9.99 15.292v-6.58L15.694 12l-5.704 3.292z" clipRule="evenodd" />,
            <path key="tt" d="M12.525.02c1.31-.02 2.61-.01 3.91-.04.08 1.53.63 3.09 1.75 4.17 1.12 1.11 2.7 1.62 4.24 1.79v4.03c-1.44-.05-2.89-.35-4.2-.97-.57-.26-1.1-.59-1.62-.93-.01 2.92.01 5.84-.02 8.75-.08 1.4-.54 2.79-1.35 3.94-1.31 1.92-3.58 3.17-5.91 3.21-1.43.08-2.86-.31-4.08-1.03-2.02-1.19-3.44-3.37-3.65-5.71-.02-.5-.03-1-.01-1.49.18-1.9 1.12-3.72 2.58-4.96 1.66-1.44 3.98-2.13 6.15-1.72.02 1.48-.04 2.96-.04 4.44-.99-.32-2.15-.23-3.02.37-.63.41-1.11 1.04-1.36 1.75-.21.51-.15 1.07-.14 1.61.24 1.64 1.82 3.02 3.5 2.87 1.12-.01 2.19-.66 2.77-1.61.19-.33.4-.67.41-1.06.1-1.79.06-3.57.07-5.36.01-4.03-.01-8.05.02-12.07z" />,
          ].map((icon, i) => (
            <a key={i} href="#" style={{ color: "rgba(250,248,243,.22)", transition: "color .2s" }}
              onMouseEnter={e => ((e.currentTarget as HTMLAnchorElement).style.color = "var(--cr)")}
              onMouseLeave={e => ((e.currentTarget as HTMLAnchorElement).style.color = "rgba(250,248,243,.22)")}
            >
              <svg style={{ width: 16, height: 16 }} fill="currentColor" viewBox="0 0 24 24">{icon}</svg>
            </a>
          ))}
        </div>
      </div>
    </footer>
  );
}
