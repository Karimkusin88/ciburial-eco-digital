"use client";
import { useEffect, useMemo, useRef, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import {
  Search, CalendarDays, Newspaper, Info, Bot, Vote, Stethoscope, ShieldCheck, HandHeart,
  Megaphone, HandCoins, BookOpen, Home, ShoppingBag, Wallet, FileText, Image as ImageIcon,
  Sun, Moon, MapPin, Package, Sparkles,
} from "lucide-react";
import { useTheme } from "./ThemeProvider";

interface CommandItem {
  id: string;
  title: string;
  subtitle?: string;
  group: string;
  icon: React.ReactNode;
  action: () => void;
  keywords?: string;
}

export default function CommandPalette() {
  const [open, setOpen] = useState(false);
  const [q, setQ] = useState("");
  const [activeIdx, setActiveIdx] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);
  const listRef = useRef<HTMLDivElement>(null);
  const router = useRouter();
  const { theme, toggle } = useTheme();

  // Global keyboard shortcut: Cmd/Ctrl + K
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        setOpen((v) => !v);
      }
      if (e.key === "Escape") setOpen(false);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  // Listen to custom event so other buttons can open the palette
  useEffect(() => {
    const h = () => setOpen(true);
    window.addEventListener("ciburial:open-palette", h);
    return () => window.removeEventListener("ciburial:open-palette", h);
  }, []);

  useEffect(() => {
    if (open) {
      setQ("");
      setActiveIdx(0);
      setTimeout(() => inputRef.current?.focus(), 50);
    }
  }, [open]);

  const go = useCallback((href: string) => {
    setOpen(false);
    router.push(href);
  }, [router]);

  const items: CommandItem[] = useMemo(() => [
    // Halaman utama
    { id: "home", group: "Halaman", title: "Beranda", subtitle: "Landing & visi desa", icon: <Home size={16} strokeWidth={1.7} />, action: () => go("/"), keywords: "tentang hero utama" },
    { id: "kegiatan", group: "Halaman", title: "Kegiatan", subtitle: "Agenda & liputan warga", icon: <CalendarDays size={16} strokeWidth={1.7} />, action: () => go("/?tab=kegiatan") },
    { id: "proposal", group: "Halaman", title: "Proposal", subtitle: "Dokumen resmi & RAB", icon: <FileText size={16} strokeWidth={1.7} />, action: () => go("/?tab=proposal") },
    { id: "transparansi", group: "Halaman", title: "Transparansi Dana", subtitle: "Keuangan real-time", icon: <Wallet size={16} strokeWidth={1.7} />, action: () => go("/?tab=transparansi") },
    { id: "marketplace", group: "Halaman", title: "Marketplace", subtitle: "Produk warga", icon: <ShoppingBag size={16} strokeWidth={1.7} />, action: () => go("/?tab=marketplace") },

    // Layanan Smart Hub
    { id: "voting", group: "Smart Hub", title: "E-Voting", subtitle: "Musyawarah digital", icon: <Vote size={16} strokeWidth={1.7} />, action: () => go("/voting") },
    { id: "posyandu", group: "Smart Hub", title: "Posyandu Pintar", subtitle: "Tracking gizi balita", icon: <Stethoscope size={16} strokeWidth={1.7} />, action: () => go("/posyandu") },
    { id: "ronda", group: "Smart Hub", title: "Monitoring Ronda", subtitle: "Keamanan NFC", icon: <ShieldCheck size={16} strokeWidth={1.7} />, action: () => go("/ronda") },
    { id: "zakat", group: "Smart Hub", title: "Zakat Digital", subtitle: "Kewajiban & hak", icon: <HandHeart size={16} strokeWidth={1.7} />, action: () => go("/zakat") },
    { id: "pengaduan", group: "Smart Hub", title: "Layanan Aduan", subtitle: "Lapor fasilitas publik", icon: <Megaphone size={16} strokeWidth={1.7} />, action: () => go("/pengaduan") },
    { id: "tukar-poin", group: "Smart Hub", title: "Tukar Poin", subtitle: "Dompet reward", icon: <HandCoins size={16} strokeWidth={1.7} />, action: () => go("/tukar-poin") },
    { id: "learning", group: "Smart Hub", title: "Learning Hub", subtitle: "E-Perpus & video pelatihan", icon: <BookOpen size={16} strokeWidth={1.7} />, action: () => go("/learning-hub") },

    // Info warga
    { id: "kalender", group: "Info Warga", title: "Kalender Kegiatan", subtitle: "Agenda kampung", icon: <CalendarDays size={16} strokeWidth={1.7} />, action: () => go("/kalender") },
    { id: "info-harian", group: "Info Warga", title: "Info Harian", subtitle: "Berita & liputan", icon: <Newspaper size={16} strokeWidth={1.7} />, action: () => go("/info-harian") },
    { id: "tentang", group: "Info Warga", title: "Tentang Ciburial", subtitle: "Profil desa", icon: <Info size={16} strokeWidth={1.7} />, action: () => go("/tentang") },

    // Pesanan
    { id: "cek-pesanan", group: "Pesanan", title: "Cek Pesanan", subtitle: "Status order marketplace", icon: <Package size={16} strokeWidth={1.7} />, action: () => go("/cek-pesanan") },
    { id: "tracking", group: "Pesanan", title: "Tracking", subtitle: "Lacak pengiriman", icon: <MapPin size={16} strokeWidth={1.7} />, action: () => go("/tracking") },

    // AI
    { id: "ai", group: "AI", title: "Ciburial AI", subtitle: "Asisten cerdas desa — BETA", icon: <Bot size={16} strokeWidth={1.7} />, action: () => go("/ai"), keywords: "chatbot assistant" },

    // Aksi
    {
      id: "theme-toggle",
      group: "Aksi",
      title: theme === "dark" ? "Ubah ke Mode Terang" : "Ubah ke Mode Gelap",
      subtitle: "Toggle tema tampilan",
      icon: theme === "dark" ? <Sun size={16} strokeWidth={1.7} /> : <Moon size={16} strokeWidth={1.7} />,
      action: () => { toggle(); setOpen(false); },
      keywords: "dark mode light theme tema",
    },
  ], [go, theme, toggle]);

  const filtered = useMemo(() => {
    const s = q.trim().toLowerCase();
    if (!s) return items;
    return items.filter((it) => {
      const hay = `${it.title} ${it.subtitle ?? ""} ${it.group} ${it.keywords ?? ""}`.toLowerCase();
      return hay.includes(s);
    });
  }, [q, items]);

  // Group rendering
  const grouped = useMemo(() => {
    const map = new Map<string, CommandItem[]>();
    filtered.forEach((it) => {
      const arr = map.get(it.group) ?? [];
      arr.push(it);
      map.set(it.group, arr);
    });
    return Array.from(map.entries());
  }, [filtered]);

  // Flat list for keyboard nav
  const flat = filtered;

  useEffect(() => { setActiveIdx(0); }, [q]);

  const onKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setActiveIdx((i) => Math.min(flat.length - 1, i + 1));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setActiveIdx((i) => Math.max(0, i - 1));
    } else if (e.key === "Enter") {
      e.preventDefault();
      flat[activeIdx]?.action();
    }
  };

  // Scroll active into view
  useEffect(() => {
    const el = listRef.current?.querySelector<HTMLElement>(`[data-idx="${activeIdx}"]`);
    el?.scrollIntoView({ block: "nearest" });
  }, [activeIdx]);

  if (!open) return null;

  let flatIdx = -1;

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label="Command palette"
      onMouseDown={(e) => { if (e.target === e.currentTarget) setOpen(false); }}
      style={{
        position: "fixed", inset: 0, zIndex: 10000,
        background: "rgba(10, 24, 16, .55)",
        backdropFilter: "blur(6px)",
        display: "flex", alignItems: "flex-start", justifyContent: "center",
        padding: "clamp(40px, 10vh, 120px) 16px 16px",
        animation: "cpFade .18s ease",
      }}
    >
      <div
        style={{
          width: "100%", maxWidth: 640,
          background: "var(--cw)",
          border: "1px solid var(--bo)",
          borderRadius: 16,
          boxShadow: "0 30px 80px rgba(0,0,0,.35), 0 8px 24px rgba(47,143,78,.15)",
          overflow: "hidden",
          animation: "cpPop .22s cubic-bezier(.22,1,.36,1)",
        }}
      >
        {/* Input */}
        <div style={{ display: "flex", alignItems: "center", gap: 12, padding: "14px 18px", borderBottom: "1px solid var(--bo)" }}>
          <Search size={18} strokeWidth={1.7} color="var(--accent)" />
          <input
            ref={inputRef}
            value={q}
            onChange={(e) => setQ(e.target.value)}
            onKeyDown={onKeyDown}
            placeholder="Cari halaman, layanan, atau aksi..."
            style={{
              flex: 1, border: "none", outline: "none",
              background: "transparent", color: "var(--tp)",
              fontSize: 15, fontWeight: 500,
              fontFamily: "inherit",
            }}
          />
          <kbd style={{
            fontSize: 10, fontWeight: 700, letterSpacing: ".08em",
            padding: "3px 7px", borderRadius: 6,
            background: "var(--cd)", color: "var(--tm)",
            border: "1px solid var(--bo)",
          }}>ESC</kbd>
        </div>

        {/* Results */}
        <div ref={listRef} style={{ maxHeight: "min(60vh, 420px)", overflowY: "auto", padding: "8px 0" }}>
          {flat.length === 0 ? (
            <div style={{ padding: "36px 20px", textAlign: "center" }}>
              <Sparkles size={22} strokeWidth={1.5} color="var(--tm)" />
              <div style={{ marginTop: 10, fontSize: 13, color: "var(--tm)", fontWeight: 500 }}>
                Tidak ada hasil untuk <strong style={{ color: "var(--tp)" }}>"{q}"</strong>
              </div>
            </div>
          ) : grouped.map(([group, list]) => (
            <div key={group} style={{ marginBottom: 4 }}>
              <div style={{
                fontSize: 9, fontWeight: 800, letterSpacing: ".16em", textTransform: "uppercase",
                color: "var(--tm)", padding: "8px 18px 4px",
              }}>{group}</div>
              {list.map((it) => {
                flatIdx++;
                const isActive = flatIdx === activeIdx;
                const idx = flatIdx;
                return (
                  <button
                    key={it.id}
                    data-idx={idx}
                    onMouseEnter={() => setActiveIdx(idx)}
                    onClick={it.action}
                    style={{
                      width: "100%", display: "flex", alignItems: "center", gap: 12,
                      padding: "10px 18px", textAlign: "left", border: "none",
                      background: isActive ? "var(--cd)" : "transparent",
                      color: "var(--tp)", cursor: "pointer",
                      transition: "background .15s",
                      borderLeft: isActive ? "3px solid var(--accent)" : "3px solid transparent",
                    }}
                  >
                    <span style={{
                      width: 30, height: 30, borderRadius: 8,
                      background: isActive ? "rgba(47,143,78,.15)" : "var(--cd)",
                      display: "inline-flex", alignItems: "center", justifyContent: "center",
                      color: isActive ? "var(--accent)" : "var(--ts)", flexShrink: 0,
                      transition: "all .2s",
                    }}>{it.icon}</span>
                    <span style={{ flex: 1, minWidth: 0 }}>
                      <span style={{ display: "block", fontSize: 13, fontWeight: 600, color: "var(--tp)", lineHeight: 1.3 }}>{it.title}</span>
                      {it.subtitle && (
                        <span style={{ display: "block", fontSize: 11, color: "var(--tm)", marginTop: 2, lineHeight: 1.3 }}>{it.subtitle}</span>
                      )}
                    </span>
                    {isActive && (
                      <kbd style={{
                        fontSize: 10, fontWeight: 700,
                        padding: "3px 7px", borderRadius: 6,
                        background: "var(--cw)", color: "var(--accent)",
                        border: "1px solid var(--bo)",
                      }}>↵</kbd>
                    )}
                  </button>
                );
              })}
            </div>
          ))}
        </div>

        {/* Footer */}
        <div style={{
          display: "flex", alignItems: "center", justifyContent: "space-between",
          padding: "10px 18px", borderTop: "1px solid var(--bo)",
          background: "var(--cr)", fontSize: 10.5, color: "var(--tm)",
          letterSpacing: ".04em",
        }}>
          <span style={{ display: "inline-flex", alignItems: "center", gap: 6 }}>
            <ImageIcon size={12} strokeWidth={1.7} />
            <strong style={{ color: "var(--ts)", fontWeight: 700 }}>Ciburial</strong> Command
          </span>
          <span style={{ display: "inline-flex", alignItems: "center", gap: 10 }}>
            <span><kbd style={kbdS}>↑</kbd><kbd style={kbdS}>↓</kbd> navigasi</span>
            <span><kbd style={kbdS}>↵</kbd> pilih</span>
          </span>
        </div>
      </div>

      <style>{`
        @keyframes cpFade { from { opacity: 0 } to { opacity: 1 } }
        @keyframes cpPop { from { opacity: 0; transform: translateY(-10px) scale(.98) } to { opacity: 1; transform: translateY(0) scale(1) } }
      `}</style>
    </div>
  );
}

const kbdS: React.CSSProperties = {
  fontSize: 10, fontWeight: 700, padding: "1px 5px", margin: "0 2px",
  borderRadius: 4, background: "var(--cw)", border: "1px solid var(--bo)", color: "var(--ts)",
};
