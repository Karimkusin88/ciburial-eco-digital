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
      <div style={{ borderTop: "1px solid rgba(255,255,255,.05)", padding: "24px 28px", maxWidth: 1320, margin: "0 auto", display: "flex", flexWrap: "wrap", alignItems: "center", justifyContent: "space-between", gap: 20 }}>
        <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
          <p style={{ fontSize: 10, fontWeight: 600, color: "rgba(250,248,243,.2)", letterSpacing: ".07em", textTransform: "uppercase" }}>
            © {new Date().getFullYear()} Ciburial Eco-Digital Village. All Rights Reserved.
          </p>
          <div style={{ fontSize: 13, fontWeight: 400, color: "rgba(250,248,243,.5)" }}>
            Initiated & built with <span style={{ color: "#E25555" }}>❤️</span> by <strong style={{ color: "var(--cw)", fontWeight: 700, letterSpacing: ".02em" }}>Ubay Rahmat H</strong>
          </div>
        </div>
        
        <div style={{ display: "flex", gap: 16, alignItems: "center" }}>
          <a href="https://facebook.com/ubayhidayat71" target="_blank" rel="noopener noreferrer" style={{ color: "rgba(250,248,243,.4)", transition: "all .2s", transform: "translateY(0)" }} onMouseEnter={e => { (e.currentTarget as HTMLAnchorElement).style.color = "var(--cr)"; (e.currentTarget as HTMLAnchorElement).style.transform = "translateY(-2px)" }} onMouseLeave={e => { (e.currentTarget as HTMLAnchorElement).style.color = "rgba(250,248,243,.4)"; (e.currentTarget as HTMLAnchorElement).style.transform = "translateY(0)" }}>
            <svg style={{ width: 18, height: 18 }} fill="currentColor" viewBox="0 0 24 24"><path d="M22 12c0-5.523-4.477-10-10-10S2 6.477 2 12c0 4.991 3.657 9.128 8.438 9.878v-6.987h-2.54V12h2.54V9.797c0-2.506 1.492-3.89 3.777-3.89 1.094 0 2.238.195 2.238.195v2.46h-1.26c-1.243 0-1.63.771-1.63 1.562V12h2.773l-.443 2.89h-2.33v6.988C18.343 21.128 22 16.991 22 12z"/></svg>
          </a>
          <a href="https://instagram.com/ubayhidayat71" target="_blank" rel="noopener noreferrer" style={{ color: "rgba(250,248,243,.4)", transition: "all .2s", transform: "translateY(0)" }} onMouseEnter={e => { (e.currentTarget as HTMLAnchorElement).style.color = "var(--cr)"; (e.currentTarget as HTMLAnchorElement).style.transform = "translateY(-2px)" }} onMouseLeave={e => { (e.currentTarget as HTMLAnchorElement).style.color = "rgba(250,248,243,.4)"; (e.currentTarget as HTMLAnchorElement).style.transform = "translateY(0)" }}>
            <svg style={{ width: 18, height: 18 }} fill="currentColor" viewBox="0 0 24 24"><path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zM12 0C8.741 0 8.333.014 7.053.072 2.695.272.273 2.69.073 7.052.014 8.333 0 8.741 0 12c0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98C8.333 23.986 8.741 24 12 24c3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98C15.668.014 15.259 0 12 0zm0 5.838a6.162 6.162 0 100 12.324 6.162 6.162 0 000-12.324zM12 16a4 4 0 110-8 4 4 0 010 8zm6.406-11.845a1.44 1.44 0 100 2.881 1.44 1.44 0 000-2.881z"/></svg>
          </a>
          <a href="https://x.com/ubayhidayat3" target="_blank" rel="noopener noreferrer" style={{ color: "rgba(250,248,243,.4)", transition: "all .2s", transform: "translateY(0)" }} onMouseEnter={e => { (e.currentTarget as HTMLAnchorElement).style.color = "var(--cr)"; (e.currentTarget as HTMLAnchorElement).style.transform = "translateY(-2px)" }} onMouseLeave={e => { (e.currentTarget as HTMLAnchorElement).style.color = "rgba(250,248,243,.4)"; (e.currentTarget as HTMLAnchorElement).style.transform = "translateY(0)" }}>
            <svg style={{ width: 17, height: 17 }} fill="currentColor" viewBox="0 0 24 24"><path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/></svg>
          </a>
        </div>
      </div>
    </footer>
  );
}
