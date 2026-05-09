"use client";
import { useState, useEffect, useRef, ReactNode } from "react";
import { MapPin, Droplets, Wind, Moon, Sun, CloudSun, Cloud, CloudFog, CloudRain, CloudSnow, CloudLightning, Sunset, Star, Landmark } from "lucide-react";

interface Cuaca { suhu: number; deskripsi: string; icon: ReactNode; kota: string; kelembaban: number; angin: number; }
interface Sholat { subuh: string; dzuhur: string; ashar: string; maghrib: string; isya: string; }

// Lokasi default Ciburial, Garut
const LAT = -7.2167;
const LON = 107.9167;
const KOTA = "Ciburial, Garut";

function formatWaktu(date: Date) {
  return date.toLocaleTimeString("id-ID", { hour: "2-digit", minute: "2-digit" });
}

// Hitung jadwal sholat sederhana (kalkulasi astronomi)
function hitungSholat(lat: number, lon: number, date: Date): Sholat {
  const d = Math.floor((date.getTime() - new Date(date.getFullYear(), 0, 0).getTime()) / 86400000);
  const timezone = 7; // WIB
  const B = (360 / 365) * (d - 81) * (Math.PI / 180);
  const EoT = 9.87 * Math.sin(2 * B) - 7.53 * Math.cos(B) - 1.5 * Math.sin(B);
  const noon = 12 - (lon - timezone * 15) / 15 - EoT / 60;
  const decl = 23.45 * Math.sin(B) * (Math.PI / 180);
  const latRad = lat * (Math.PI / 180);
  function ha(angle: number) { return (180 / Math.PI) * Math.acos((Math.sin(angle * Math.PI / 180) - Math.sin(latRad) * Math.sin(decl)) / (Math.cos(latRad) * Math.cos(decl))); }
  const toTime = (decimal: number) => { const h = Math.floor(decimal); const m = Math.round((decimal - h) * 60); return `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}`; };
  return {
    subuh: toTime(noon - ha(-18) / 15),
    dzuhur: toTime(noon + 0.07),
    ashar: toTime(noon + ha(Math.atan(1 / (1 + Math.tan(Math.abs(latRad - decl)))) * 180 / Math.PI) / 15),
    maghrib: toTime(noon + ha(-0.833) / 15),
    isya: toTime(noon + ha(-17) / 15),
  };
}

// ────────────────────────────────────────────────────────────
//  Draggable FAB logic: stores {right, bottom} in localStorage
// ────────────────────────────────────────────────────────────
interface Pos { right: number; bottom: number; }
const DEFAULT_POS: Pos = { right: 24, bottom: 24 };
const STORAGE_KEY = "ciburial-widget-pos";

function loadPos(): Pos {
  if (typeof window === "undefined") return DEFAULT_POS;
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return DEFAULT_POS;
    const p = JSON.parse(raw);
    if (typeof p?.right === "number" && typeof p?.bottom === "number") return p;
  } catch {}
  return DEFAULT_POS;
}

function savePos(p: Pos) {
  try { localStorage.setItem(STORAGE_KEY, JSON.stringify(p)); } catch {}
}

function clampPos(p: Pos): Pos {
  if (typeof window === "undefined") return p;
  const FAB = 56; // padding buffer
  const maxRight = Math.max(0, window.innerWidth - FAB);
  const maxBottom = Math.max(0, window.innerHeight - FAB);
  return {
    right: Math.min(Math.max(8, p.right), maxRight),
    bottom: Math.min(Math.max(8, p.bottom), maxBottom),
  };
}

export default function CuacaSholatWidget() {
  const [cuaca, setCuaca] = useState<Cuaca | null>(null);
  const [sholat, setSholat] = useState<Sholat | null>(null);
  const [now, setNow] = useState(new Date());
  const [loading, setLoading] = useState(true);
  const [isOpen, setIsOpen] = useState(false);

  // Draggable state
  const [pos, setPos] = useState<Pos>(DEFAULT_POS);
  const [dragging, setDragging] = useState(false);
  const [hasMoved, setHasMoved] = useState(false); // differentiates click vs drag
  const dragRef = useRef<{ startX: number; startY: number; startPos: Pos } | null>(null);
  const rafRef = useRef<number | null>(null);

  useEffect(() => { setPos(clampPos(loadPos())); }, []);

  // Re-clamp on resize
  useEffect(() => {
    const onResize = () => setPos((p) => {
      const next = clampPos(p);
      if (next.right !== p.right || next.bottom !== p.bottom) savePos(next);
      return next;
    });
    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
  }, []);

  useEffect(() => {
    const timer = setInterval(() => setNow(new Date()), 60000);
    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    setSholat(hitungSholat(LAT, LON, now));
    fetchCuaca();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function fetchCuaca() {
    try {
      const res = await fetch(
        `https://api.open-meteo.com/v1/forecast?latitude=${LAT}&longitude=${LON}&current_weather=true&hourly=relativehumidity_2m,windspeed_10m&timezone=Asia%2FJakarta`
      );
      const data = await res.json();
      const wc = data.current_weather;
      const iconMap: Record<number, ReactNode> = {
        0: <Sun />, 1: <CloudSun />, 2: <CloudSun />, 3: <Cloud />,
        45: <CloudFog />, 48: <CloudFog />, 51: <CloudRain />, 53: <CloudRain />, 55: <CloudRain />,
        61: <CloudRain />, 63: <CloudRain />, 65: <CloudRain />, 71: <CloudSnow />, 80: <CloudRain />,
        95: <CloudLightning />, 96: <CloudLightning />, 99: <CloudLightning />,
      };
      const descMap: Record<number, string> = {
        0: "Cerah", 1: "Cerah Berawan", 2: "Berawan", 3: "Mendung",
        45: "Berkabut", 48: "Berkabut Tebal", 51: "Gerimis", 53: "Gerimis", 55: "Gerimis Lebat",
        61: "Hujan Ringan", 63: "Hujan", 65: "Hujan Lebat", 71: "Bersalju", 80: "Hujan Lokal",
        95: "Badai", 96: "Badai Petir", 99: "Badai Besar",
      };
      setCuaca({
        suhu: Math.round(wc.temperature),
        deskripsi: descMap[wc.weathercode] || "Cerah",
        icon: iconMap[wc.weathercode] || <CloudSun />,
        kota: KOTA,
        kelembaban: data.hourly?.relativehumidity_2m?.[new Date().getHours()] || 75,
        angin: Math.round(wc.windspeed),
      });
    } catch {
      setCuaca({ suhu: 24, deskripsi: "Cerah Berawan", icon: <CloudSun />, kota: KOTA, kelembaban: 75, angin: 8 });
    } finally {
      setLoading(false);
    }
  }

  // ── DRAG HANDLERS ──
  const onPointerDown = (e: React.PointerEvent) => {
    // Only drag on the FAB button, not the panel
    if (isOpen) return;
    const el = e.currentTarget as HTMLElement;
    el.setPointerCapture(e.pointerId);
    dragRef.current = { startX: e.clientX, startY: e.clientY, startPos: pos };
    setDragging(true);
    setHasMoved(false);
  };

  const onPointerMove = (e: React.PointerEvent) => {
    if (!dragging || !dragRef.current) return;
    const dx = e.clientX - dragRef.current.startX;
    const dy = e.clientY - dragRef.current.startY;
    if (Math.abs(dx) > 4 || Math.abs(dy) > 4) setHasMoved(true);

    // Convert: right/bottom grows opposite of dx/dy
    const nextRight = dragRef.current.startPos.right - dx;
    const nextBottom = dragRef.current.startPos.bottom - dy;

    if (rafRef.current) cancelAnimationFrame(rafRef.current);
    rafRef.current = requestAnimationFrame(() => {
      setPos(clampPos({ right: nextRight, bottom: nextBottom }));
    });
  };

  const onPointerUp = (e: React.PointerEvent) => {
    const el = e.currentTarget as HTMLElement;
    try { el.releasePointerCapture(e.pointerId); } catch {}
    if (dragging && hasMoved) {
      // Snap horizontally to the closest edge (left or right)
      const mid = window.innerWidth / 2;
      const currentLeft = window.innerWidth - pos.right;
      const snappedRight = currentLeft < mid ? window.innerWidth - 16 - 56 /* FAB width */ : 16;
      const next = clampPos({ right: snappedRight, bottom: pos.bottom });
      setPos(next);
      savePos(next);
    }
    setDragging(false);
    dragRef.current = null;
  };

  const onClickFab = (e: React.MouseEvent) => {
    // If user dragged, don't open/close
    if (hasMoved) { e.preventDefault(); e.stopPropagation(); return; }
    setIsOpen((v) => !v);
  };

  const HARI_ID = ["Minggu", "Senin", "Selasa", "Rabu", "Kamis", "Jumat", "Sabtu"];
  const BULAN_ID = ["Januari", "Februari", "Maret", "April", "Mei", "Juni", "Juli", "Agustus", "September", "Oktober", "November", "Desember"];

  // Tentukan sholat berikutnya
  function sholatBerikutnya() {
    if (!sholat) return null;
    const nowStr = formatWaktu(now);
    const waktuList = [
      { nama: "Subuh", waktu: sholat.subuh },
      { nama: "Dzuhur", waktu: sholat.dzuhur },
      { nama: "Ashar", waktu: sholat.ashar },
      { nama: "Maghrib", waktu: sholat.maghrib },
      { nama: "Isya", waktu: sholat.isya },
    ];
    return waktuList.find(w => w.waktu > nowStr) || waktuList[0];
  }
  const next = sholatBerikutnya();

  // Panel position — anchor it relative to FAB so it stays near the button
  const panelStyle: React.CSSProperties = {
    position: "fixed",
    right: pos.right,
    // show panel above the FAB when FAB is near bottom; below when FAB is near top.
    bottom: pos.bottom + 72, // FAB is ~56px + 16px gap
    zIndex: 99,
    maxWidth: "calc(100vw - 32px)",
    width: "min(90vw, 650px)",
  };

  return (
    <>
      {/* Widget Content Panel */}
      {isOpen && (
        <div
          className="animate-masuk"
          style={{
            ...panelStyle,
            background: "var(--cw)",
            borderRadius: 24,
            padding: 20,
            boxShadow: "0 20px 60px rgba(28,58,43,0.25)",
            border: "1px solid var(--bo)",
            fontFamily: "'Segoe UI',system-ui,sans-serif",
          }}
        >
          <button
            onClick={() => setIsOpen(false)}
            aria-label="Tutup widget"
            style={{
              position: "absolute", top: 12, right: 12,
              width: 28, height: 28, borderRadius: 99,
              background: "var(--cd)", border: "1px solid var(--bo)",
              color: "var(--ts)", cursor: "pointer",
              display: "inline-flex", alignItems: "center", justifyContent: "center",
              fontSize: 14, fontWeight: 700,
            }}
          >
            ×
          </button>

          <div style={{ display: "grid", gridTemplateColumns: "1fr", gap: 12 }} className="cwsh-grid">
            {/* Cuaca */}
            <div style={{ background: "linear-gradient(135deg, #2d5a40 0%, #4a8c5c 100%)", borderRadius: 20, padding: 20, color: "white" }}>
              <div style={{ fontSize: 11, opacity: 0.7, letterSpacing: "0.08em", textTransform: "uppercase", marginBottom: 8 }}>
                <MapPin size={12} style={{ display: "inline", marginRight: 4, verticalAlign: "text-bottom" }} /> {KOTA}
              </div>
              {loading ? (
                <div style={{ opacity: 0.5, fontSize: 14 }}>Memuat cuaca...</div>
              ) : cuaca && (
                <>
                  <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 12 }}>
                    <div style={{ fontSize: 42 }}>{cuaca.icon}</div>
                    <div>
                      <div style={{ fontSize: 32, fontWeight: 900, lineHeight: 1 }}>{cuaca.suhu}°C</div>
                      <div style={{ fontSize: 13, opacity: 0.85 }}>{cuaca.deskripsi}</div>
                    </div>
                  </div>
                  <div style={{ display: "flex", gap: 16, fontSize: 11, opacity: 0.75 }}>
                    <span><Droplets size={12} style={{ display: "inline", marginRight: 4 }} /> {cuaca.kelembaban}%</span>
                    <span><Wind size={12} style={{ display: "inline", marginRight: 4 }} /> {cuaca.angin} km/j</span>
                  </div>
                  <div style={{ marginTop: 10, fontSize: 11, opacity: 0.6 }}>
                    {HARI_ID[now.getDay()]}, {now.getDate()} {BULAN_ID[now.getMonth()]} {now.getFullYear()}
                  </div>
                </>
              )}
            </div>

            {/* Jadwal Sholat */}
            <div style={{ background: "var(--cd)", borderRadius: 20, padding: 20, border: "1px solid var(--bo)" }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 10 }}>
                <div style={{ fontSize: 13, fontWeight: 700, color: "var(--tp)" }}><Landmark size={14} style={{ display: "inline", marginRight: 6 }} /> Jadwal Sholat</div>
                {next && (
                  <div style={{ background: "rgba(47,143,78,.15)", borderRadius: 20, padding: "2px 8px", fontSize: 10, color: "var(--accent)", fontWeight: 700 }}>
                    {next.nama} {next.waktu}
                  </div>
                )}
              </div>
              {sholat && (
                <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
                  {[
                    { nama: "Subuh", waktu: sholat.subuh, icon: <Moon size={14} /> },
                    { nama: "Dzuhur", waktu: sholat.dzuhur, icon: <Sun size={14} /> },
                    { nama: "Ashar", waktu: sholat.ashar, icon: <CloudSun size={14} /> },
                    { nama: "Maghrib", waktu: sholat.maghrib, icon: <Sunset size={14} /> },
                    { nama: "Isya", waktu: sholat.isya, icon: <Star size={14} /> },
                  ].map(s => {
                    const isNext = next?.nama === s.nama;
                    return (
                      <div key={s.nama} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "5px 8px", borderRadius: 8, background: isNext ? "rgba(47,143,78,.1)" : "transparent", border: isNext ? "1px solid rgba(47,143,78,.2)" : "1px solid transparent" }}>
                        <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                          <span style={{ fontSize: 13, color: isNext ? "var(--accent)" : "var(--ts)" }}>{s.icon}</span>
                          <span style={{ fontSize: 12, fontWeight: isNext ? 700 : 500, color: isNext ? "var(--accent)" : "var(--tp)" }}>{s.nama}</span>
                        </div>
                        <span style={{ fontSize: 12, fontWeight: 700, color: isNext ? "var(--accent)" : "var(--tm)" }}>{s.waktu}</span>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>

          <style>{`
            @media (min-width: 560px){
              .cwsh-grid{ grid-template-columns: 1fr 1fr !important; }
            }
          `}</style>
        </div>
      )}

      {/* Draggable FAB */}
      <button
        aria-label="Cuaca & Sholat (geser untuk pindahkan)"
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={onPointerUp}
        onPointerCancel={onPointerUp}
        onClick={onClickFab}
        style={{
          position: "fixed",
          right: pos.right,
          bottom: `max(${pos.bottom}px, env(safe-area-inset-bottom, 0px))`,
          zIndex: 100,
          width: 56, height: 56, borderRadius: 99,
          display: "flex", alignItems: "center", justifyContent: "center",
          border: "none", cursor: dragging ? "grabbing" : (isOpen ? "pointer" : "grab"),
          background: isOpen ? "var(--cw)" : "linear-gradient(135deg,var(--fo),var(--accent))",
          color: isOpen ? "var(--fo)" : "white",
          boxShadow: dragging
            ? "0 24px 40px rgba(47,143,78,.45)"
            : "0 12px 28px rgba(47,143,78,.35)",
          transition: dragging ? "none" : "transform .2s, box-shadow .25s, background .25s",
          transform: dragging ? "scale(1.08)" : "scale(1)",
          touchAction: "none",
          userSelect: "none",
        }}
      >
        {isOpen ? (
          <span style={{ fontSize: 20, fontWeight: 700 }}>×</span>
        ) : (
          <span style={{ display: "flex", flexDirection: "column", alignItems: "center", lineHeight: 1 }}>
            <Landmark size={20} strokeWidth={1.5} />
            <span style={{ fontSize: 8, fontWeight: 900, letterSpacing: "-.02em", textTransform: "uppercase", marginTop: 2, opacity: .9 }}>Info</span>
          </span>
        )}
      </button>
    </>
  );
}
