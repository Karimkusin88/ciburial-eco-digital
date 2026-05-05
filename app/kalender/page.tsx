"use client";
import { useState, useEffect } from "react";
import { supabase, isSupabaseReady } from "@/lib/supabase";

interface Kegiatan { id: string; judul: string; deskripsi: string; tanggal: string; jam_mulai: string; lokasi: string; kategori: string; foto_url: string; }

const BULAN = ["Januari", "Februari", "Maret", "April", "Mei", "Juni", "Juli", "Agustus", "September", "Oktober", "November", "Desember"];
const HARI = ["Min", "Sen", "Sel", "Rab", "Kam", "Jum", "Sab"];
const KAT_COLOR: Record<string, string> = {
  keagamaan: "#b8943f", kemasyarakatan: "#2d5a40", kesehatan: "#1a3a6b",
  pendidikan: "#5a2d82", lingkungan: "#2d7a40", olahraga: "#8b0000", lainnya: "#6b7c6d",
};

// Dummy data untuk tampilan awal
const DUMMY: Kegiatan[] = [
  { id: "d1", judul: "Posyandu Bulan April", deskripsi: "Pemeriksaan tumbuh kembang balita & ibu hamil", tanggal: new Date(new Date().getFullYear(), new Date().getMonth(), 15).toISOString().split("T")[0], jam_mulai: "08:00", lokasi: "Balai Desa Ciburial", kategori: "kesehatan", foto_url: "" },
  { id: "d2", judul: "Rapat Musyawarah Warga", deskripsi: "Pembahasan program bank sampah & Smart PJU fase 2", tanggal: new Date(new Date().getFullYear(), new Date().getMonth(), 20).toISOString().split("T")[0], jam_mulai: "19:30", lokasi: "Mushola Al-Ikhlas RT 01", kategori: "kemasyarakatan", foto_url: "" },
  { id: "d3", judul: "Pengajian Rutin Mingguan", deskripsi: "Pengajian bersama warga Ciburial setiap Jumat malam", tanggal: new Date(new Date().getFullYear(), new Date().getMonth(), 25).toISOString().split("T")[0], jam_mulai: "20:00", lokasi: "Masjid Baitussalam", kategori: "keagamaan", foto_url: "" },
];

export default function KalenderPage() {
  const [kegiatan, setKegiatan] = useState<Kegiatan[]>(DUMMY);
  const [now] = useState(new Date());
  const [viewMonth, setViewMonth] = useState(now.getMonth());
  const [viewYear, setViewYear] = useState(now.getFullYear());
  const [selected, setSelected] = useState<string | null>(null);
  const [filterKat, setFilterKat] = useState("semua");

  async function fetchData() {
    if (!isSupabaseReady()) return;
    const { data } = await supabase.from("kegiatan").select("*").order("tanggal");
    if (data && data.length > 0) setKegiatan(data as Kegiatan[]);
  }

  useEffect(() => { fetchData(); }, []);

  // Kalender
  const firstDay = new Date(viewYear, viewMonth, 1).getDay();
  const daysInMonth = new Date(viewYear, viewMonth + 1, 0).getDate();
  const cells = Array.from({ length: firstDay + daysInMonth }, (_, i) => i < firstDay ? null : i - firstDay + 1);

  function kegiatanOnDate(day: number) {
    const dateStr = `${viewYear}-${String(viewMonth + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
    return kegiatan.filter(k => k.tanggal === dateStr);
  }

  const filtered = kegiatan.filter(k => {
    const d = new Date(k.tanggal);
    return d.getMonth() === viewMonth && d.getFullYear() === viewYear && (filterKat === "semua" || k.kategori === filterKat);
  }).sort((a, b) => a.tanggal.localeCompare(b.tanggal));

  const selectedKegiatan = selected ? kegiatan.find(k => k.id === selected) : null;

  return (
    <div style={{ minHeight: "100vh", background: "#f5f0e8", fontFamily: "'Segoe UI',system-ui,sans-serif" }}>
      <header style={{ background: "#f5f0e8", borderBottom: "1px solid rgba(45,90,64,0.12)", padding: "clamp(12px, 3vw, 14px) clamp(16px, 4vw, 20px)", position: "sticky", top: 0, zIndex: 10, display: "flex", alignItems: "center", gap: 12 }}>
        <a href="/" style={{ color: "#6b7c6d", textDecoration: "none", fontSize: 13 }}>← Beranda</a>
        <span style={{ color: "#c8bfaa" }}>|</span>
        <div>
          <div style={{ fontWeight: 800, fontSize: 15, color: "#1a2e1f" }}>📅 Kalender Kegiatan</div>
          <div style={{ fontSize: 10, color: "#7a9a7e", textTransform: "uppercase", letterSpacing: "0.08em" }}>Agenda Kampung Ciburial</div>
        </div>
      </header>

      <div style={{ maxWidth: 900, margin: "0 auto", padding: "clamp(16px, 4vw, 20px) clamp(12px, 3vw, 16px)" }}>
        <div style={{ display: "grid", gridTemplateColumns: "1.2fr 1fr", gap: 20 }}>

          {/* Kalender */}
          <div>
            <div style={{ background: "white", borderRadius: 16, padding: "clamp(16px, 4vw, 20px)", border: "1px solid rgba(45,90,64,0.1)", boxShadow: "0 1px 6px rgba(0,0,0,0.04)", marginBottom: 16 }}>
              {/* Nav bulan */}
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 16 }}>
                <button onClick={() => { if (viewMonth === 0) { setViewMonth(11); setViewYear(y => y - 1); } else setViewMonth(m => m - 1); }}
                  style={{ background: "none", border: "1px solid rgba(45,90,64,0.2)", borderRadius: 8, padding: "6px 12px", cursor: "pointer", color: "#2d5a40" }}>‹</button>
                <div style={{ fontWeight: 800, fontSize: 16, color: "#1a2e1f" }}>{BULAN[viewMonth]} {viewYear}</div>
                <button onClick={() => { if (viewMonth === 11) { setViewMonth(0); setViewYear(y => y + 1); } else setViewMonth(m => m + 1); }}
                  style={{ background: "none", border: "1px solid rgba(45,90,64,0.2)", borderRadius: 8, padding: "6px 12px", cursor: "pointer", color: "#2d5a40" }}>›</button>
              </div>
              {/* Grid hari */}
              <div style={{ display: "grid", gridTemplateColumns: "repeat(7,1fr)", gap: 2, marginBottom: 6 }}>
                {HARI.map(h => <div key={h} style={{ textAlign: "center", fontSize: 11, fontWeight: 700, color: "#a8b5a9", padding: "4px 0" }}>{h}</div>)}
              </div>
              <div style={{ display: "grid", gridTemplateColumns: "repeat(7,1fr)", gap: 2 }}>
                {cells.map((day, i) => {
                  if (!day) return <div key={i}/>;
                  const kgs = kegiatanOnDate(day);
                  const isToday = day === now.getDate() && viewMonth === now.getMonth() && viewYear === now.getFullYear();
                  return (
                    <div key={i} onClick={() => kgs.length > 0 && setSelected(kgs[0].id)}
                      style={{
                        aspectRatio: "1", display: "flex", flexDirection: "column",
                        alignItems: "center", justifyContent: "center", borderRadius: 10,
                        cursor: kgs.length > 0 ? "pointer" : "default",
                        background: isToday ? "#2d5a40" : kgs.length > 0 ? "rgba(45,90,64,0.08)" : "transparent",
                        border: kgs.length > 0 && !isToday ? "1.5px solid rgba(45,90,64,0.2)" : "1.5px solid transparent",
                        position: "relative",
                      }}>
                      <span style={{ fontSize: 13, fontWeight: isToday ? 800 : 400, color: isToday ? "white" : "#1a2e1f" }}>{day}</span>
                      {kgs.length > 0 && (
                        <div style={{ display: "flex", gap: 2, marginTop: 2 }}>
                          {kgs.slice(0, 3).map(k => (
                            <div key={k.id} style={{ width: 5, height: 5, borderRadius: "50%", background: isToday ? "rgba(255,255,255,0.7)" : (KAT_COLOR[k.kategori] || "#2d5a40") }}/>
                          ))}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Legend */}
            <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
              {Object.entries(KAT_COLOR).map(([k, c]) => (
                <button key={k} onClick={() => setFilterKat(filterKat === k ? "semua" : k)}
                  style={{ display: "flex", alignItems: "center", gap: 5, padding: "5px 10px", borderRadius: 20, border: `1.5px solid ${filterKat === k ? c : "rgba(0,0,0,0.1)"}`, background: filterKat === k ? c + "15" : "white", cursor: "pointer", fontSize: 11, color: filterKat === k ? c : "#6b7c6d", fontWeight: 500 }}>
                  <div style={{ width: 8, height: 8, borderRadius: "50%", background: c }}/>
                  {k.charAt(0).toUpperCase() + k.slice(1)}
                </button>
              ))}
            </div>
          </div>

          {/* List kegiatan */}
          <div>
            {selectedKegiatan && (
              <div style={{ background: "#2d5a40", borderRadius: 16, padding: "clamp(16px, 4vw, 20px)", marginBottom: 14, color: "white" }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
                  <div>
                    <div style={{ fontSize: 11, opacity: 0.7, marginBottom: 4, textTransform: "uppercase", letterSpacing: "0.06em" }}>{selectedKegiatan.kategori}</div>
                    <div style={{ fontWeight: 800, fontSize: 16, marginBottom: 6 }}>{selectedKegiatan.judul}</div>
                    <div style={{ fontSize: 13, opacity: 0.8, lineHeight: 1.5 }}>{selectedKegiatan.deskripsi}</div>
                    <div style={{ display: "flex", gap: 12, marginTop: 10, fontSize: 12, opacity: 0.8 }}>
                      <span>📅 {new Date(selectedKegiatan.tanggal).toLocaleDateString("id-ID", { day: "numeric", month: "long" })}</span>
                      {selectedKegiatan.jam_mulai && <span>⏰ {selectedKegiatan.jam_mulai}</span>}
                      {selectedKegiatan.lokasi && <span>📍 {selectedKegiatan.lokasi}</span>}
                    </div>
                  </div>
                  <button onClick={() => setSelected(null)} style={{ background: "rgba(255,255,255,0.2)", border: "none", borderRadius: 8, padding: "4px 8px", color: "white", cursor: "pointer", fontSize: 13 }}>✕</button>
                </div>
              </div>
            )}

            <h3 style={{ margin: "0 0 12px", color: "#1a2e1f", fontSize: 14, fontWeight: 700 }}>
              Agenda {BULAN[viewMonth]} {viewYear}
              <span style={{ fontSize: 12, color: "#7a9a7e", fontWeight: 400, marginLeft: 8 }}>({filtered.length} kegiatan)</span>
            </h3>

            {filtered.length === 0 ? (
              <div style={{ background: "white", borderRadius: 16, padding: "clamp(24px, 5vw, 40px)", textAlign: "center", border: "1px solid rgba(45,90,64,0.1)", color: "#a8b5a9" }}>
                Belum ada kegiatan bulan ini
              </div>
            ) : filtered.map(k => {
              const color = KAT_COLOR[k.kategori] || "#2d5a40";
              const tgl = new Date(k.tanggal);
              return (
                <div key={k.id} onClick={() => setSelected(k.id)}
                  style={{ background: "white", borderRadius: 14, padding: "clamp(12px, 3vw, 14px) clamp(14px, 4vw, 16px)", marginBottom: 10, border: `1.5px solid ${selected === k.id ? color : "rgba(45,90,64,0.1)"}`, cursor: "pointer", boxShadow: "0 1px 6px rgba(0,0,0,0.04)", display: "flex", gap: 14 }}>
                  <div style={{ background: color + "15", border: `1px solid ${color}30`, borderRadius: 10, padding: "8px 10px", textAlign: "center", minWidth: 44, flexShrink: 0 }}>
                    <div style={{ fontSize: 18, fontWeight: 900, color, lineHeight: 1 }}>{tgl.getDate()}</div>
                    <div style={{ fontSize: 9, color, textTransform: "uppercase", fontWeight: 600 }}>{BULAN[tgl.getMonth()].slice(0, 3)}</div>
                  </div>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontWeight: 700, fontSize: 14, color: "#1a2e1f", marginBottom: 3 }}>{k.judul}</div>
                    <div style={{ fontSize: 12, color: "#6b7c6d", lineHeight: 1.4, marginBottom: 4 }}>{k.deskripsi?.slice(0, 80)}{k.deskripsi?.length > 80 ? "..." : ""}</div>
                    <div style={{ display: "flex", gap: 10, fontSize: 11, color: "#a8b5a9" }}>
                      {k.jam_mulai && <span>⏰ {k.jam_mulai}</span>}
                      {k.lokasi && <span>📍 {k.lokasi}</span>}
                    </div>
                  </div>
                  <div style={{ width: 8, borderRadius: 4, background: color, flexShrink: 0 }}/>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
