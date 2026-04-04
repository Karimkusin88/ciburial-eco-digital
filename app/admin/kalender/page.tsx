"use client";
import { useState, useEffect } from "react";
import { supabase, isSupabaseReady } from "@/lib/supabase";

interface Kegiatan {
  id: string;
  judul: string;
  deskripsi: string;
  tanggal: string;
  jam_mulai: string;
  lokasi: string;
  kategori: string;
  foto_url?: string;
}

const BULAN = ["Januari", "Februari", "Maret", "April", "Mei", "Juni", "Juli", "Agustus", "September", "Oktober", "November", "Desember"];
const HARI = ["Min", "Sen", "Sel", "Rab", "Kam", "Jum", "Sab"];

const KAT_COLOR: Record<string, string> = {
  keagamaan: "#b8943f",
  kemasyarakatan: "#2d5a40",
  kesehatan: "#1a3a6b",
  pendidikan: "#5a2d82",
  lingkungan: "#2d7a40",
  olahraga: "#8b0000",
  lainnya: "#6b7c6d",
};

export default function KalenderPage() {
  const [kegiatan, setKegiatan] = useState<Kegiatan[]>([]);
  const [loading, setLoading] = useState(true);
  const [now] = useState(new Date());
  const [viewMonth, setViewMonth] = useState(now.getMonth());
  const [viewYear, setViewYear] = useState(now.getFullYear());
  const [selected, setSelected] = useState<string | null>(null);
  const [filterKat, setFilterKat] = useState("semua");

  // Modal state
  const [showModal, setShowModal] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState({
    judul: "",
    deskripsi: "",
    tanggal: "",
    jam_mulai: "",
    lokasi: "",
    kategori: "kemasyarakatan" as string,
  });

  async function fetchData() {
    if (!isSupabaseReady()) return;
    setLoading(true);
    const { data, error } = await supabase
      .from("kegiatan")
      .select("*")
      .order("tanggal", { ascending: true });
    if (error) console.error("Error fetch kegiatan:", error);
    else setKegiatan(data || []);
    setLoading(false);
  }

  useEffect(() => {
    fetchData();
  }, []);

  // CRUD
  async function handleSave() {
    if (!isSupabaseReady()) return;

    const payload = { ...form };

    if (editingId) {
      // Update
      const { error } = await supabase
        .from("kegiatan")
        .update(payload)
        .eq("id", editingId);
      if (error) alert("Gagal update: " + error.message);
    } else {
      // Insert
      const { error } = await supabase.from("kegiatan").insert([payload]);
      if (error) alert("Gagal tambah: " + error.message);
    }

    setShowModal(false);
    setEditingId(null);
    setForm({ judul: "", deskripsi: "", tanggal: "", jam_mulai: "", lokasi: "", kategori: "kemasyarakatan" });
    fetchData(); // refresh
  }

  async function handleDelete(id: string) {
    if (!confirm("Yakin hapus kegiatan ini?")) return;
    const { error } = await supabase.from("kegiatan").delete().eq("id", id);
    if (error) alert("Gagal hapus");
    else fetchData();
    setSelected(null);
  }

  function openModal(kegiatanEdit?: Kegiatan) {
    if (kegiatanEdit) {
      setEditingId(kegiatanEdit.id);
      setForm({
        judul: kegiatanEdit.judul,
        deskripsi: kegiatanEdit.deskripsi,
        tanggal: kegiatanEdit.tanggal,
        jam_mulai: kegiatanEdit.jam_mulai,
        lokasi: kegiatanEdit.lokasi,
        kategori: kegiatanEdit.kategori,
      });
    } else {
      setEditingId(null);
      setForm({ judul: "", deskripsi: "", tanggal: "", jam_mulai: "", lokasi: "", kategori: "kemasyarakatan" });
    }
    setShowModal(true);
  }

  // Kalender logic (sama seperti kode lu)
  const firstDay = new Date(viewYear, viewMonth, 1).getDay();
  const daysInMonth = new Date(viewYear, viewMonth + 1, 0).getDate();
  const cells = Array.from({ length: firstDay + daysInMonth }, (_, i) => (i < firstDay ? null : i - firstDay + 1));

  function kegiatanOnDate(day: number) {
    const dateStr = `${viewYear}-${String(viewMonth + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
    return kegiatan.filter((k) => k.tanggal === dateStr);
  }

  const filtered = kegiatan
    .filter((k) => {
      const d = new Date(k.tanggal);
      return d.getMonth() === viewMonth && d.getFullYear() === viewYear && (filterKat === "semua" || k.kategori === filterKat);
    })
    .sort((a, b) => a.tanggal.localeCompare(b.tanggal));

  const selectedKegiatan = selected ? kegiatan.find((k) => k.id === selected) : null;

  return (
    <div style={{ minHeight: "100vh", background: "#f5f0e8", fontFamily: "'Segoe UI', system-ui, sans-serif" }}>
      {/* HEADER ADMIN */}
      <header style={{ background: "#f5f0e8", borderBottom: "1px solid rgba(45,90,64,0.12)", padding: "14px 20px", position: "sticky", top: 0, zIndex: 10, display: "flex", alignItems: "center", gap: 12 }}>
        <a href="/admin" style={{ color: "#6b7c6d", textDecoration: "none", fontSize: 13 }}>← Admin Panel</a>
        <span style={{ color: "#c8bfaa" }}>|</span>
        <div>
          <div style={{ fontWeight: 800, fontSize: 15, color: "#1a2e1f" }}>📅 Kalender Kegiatan</div>
          <div style={{ fontSize: 10, color: "#7a9a7e", textTransform: "uppercase", letterSpacing: "0.08em" }}>Agenda Kampung Ciburial</div>
        </div>
      </header>

      <div style={{ maxWidth: 1100, margin: "0 auto", padding: "24px 20px" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 24 }}>
          <h1 style={{ fontSize: 28, fontWeight: 800, color: "#1a2e1f" }}>Kalender Kegiatan</h1>
          <button
            onClick={() => openModal()}
            style={{
              background: "#2d5a40",
              color: "white",
              border: "none",
              borderRadius: 12,
              padding: "12px 24px",
              fontWeight: 600,
              cursor: "pointer",
              display: "flex",
              alignItems: "center",
              gap: 8,
            }}
          >
            + Tambah Kegiatan
          </button>
        </div>

        {loading && <p style={{ textAlign: "center", color: "#7a9a7e" }}>Loading kegiatan...</p>}

        <div style={{ display: "grid", gridTemplateColumns: "1.2fr 1fr", gap: 28 }}>
          {/* KALENDER GRID */}
          <div>
            {/* ... (grid kalender sama persis seperti kode lu, gw ga ubah biar tampilan tetap sama) ... */}
            {/* Gw copy logic grid lu 100% tapi tambah sedikit polish */}
            <div style={{ background: "white", borderRadius: 16, padding: 24, border: "1px solid rgba(45,90,64,0.1)", boxShadow: "0 4px 12px rgba(0,0,0,0.04)" }}>
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 20 }}>
                <button onClick={() => { if (viewMonth === 0) { setViewMonth(11); setViewYear(y => y - 1); } else setViewMonth(m => m - 1); }} style={{ background: "none", border: "1px solid rgba(45,90,64,0.2)", borderRadius: 8, padding: "8px 14px", cursor: "pointer", color: "#2d5a40", fontSize: 18 }}>‹</button>
                <div style={{ fontWeight: 800, fontSize: 20, color: "#1a2e1f" }}>{BULAN[viewMonth]} {viewYear}</div>
                <button onClick={() => { if (viewMonth === 11) { setViewMonth(0); setViewYear(y => y + 1); } else setViewMonth(m => m + 1); }} style={{ background: "none", border: "1px solid rgba(45,90,64,0.2)", borderRadius: 8, padding: "8px 14px", cursor: "pointer", color: "#2d5a40", fontSize: 18 }}>›</button>
              </div>

              <div style={{ display: "grid", gridTemplateColumns: "repeat(7,1fr)", gap: 4, marginBottom: 8 }}>
                {HARI.map(h => <div key={h} style={{ textAlign: "center", fontSize: 12, fontWeight: 700, color: "#a8b5a9" }}>{h}</div>)}
              </div>

              <div style={{ display: "grid", gridTemplateColumns: "repeat(7,1fr)", gap: 4 }}>
                {cells.map((day, i) => {
                  if (!day) return <div key={i} style={{ aspectRatio: "1" }} />;
                  const kgs = kegiatanOnDate(day);
                  const isToday = day === now.getDate() && viewMonth === now.getMonth() && viewYear === now.getFullYear();
                  return (
                    <div
                      key={i}
                      onClick={() => kgs.length > 0 && setSelected(kgs[0].id)}
                      style={{
                        aspectRatio: "1",
                        display: "flex",
                        flexDirection: "column",
                        alignItems: "center",
                        justifyContent: "center",
                        borderRadius: 12,
                        cursor: kgs.length > 0 ? "pointer" : "default",
                        background: isToday ? "#2d5a40" : kgs.length > 0 ? "rgba(45,90,64,0.08)" : "transparent",
                        border: kgs.length > 0 && !isToday ? "2px solid rgba(45,90,64,0.25)" : "2px solid transparent",
                      }}
                    >
                      <span style={{ fontSize: 15, fontWeight: isToday ? 800 : 500, color: isToday ? "white" : "#1a2e1f" }}>{day}</span>
                      {kgs.length > 0 && (
                        <div style={{ display: "flex", gap: 3, marginTop: 4 }}>
                          {kgs.slice(0, 3).map((k) => (
                            <div key={k.id} style={{ width: 6, height: 6, borderRadius: "50%", background: isToday ? "white" : (KAT_COLOR[k.kategori] || "#2d5a40") }} />
                          ))}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Legend Filter */}
            <div style={{ display: "flex", flexWrap: "wrap", gap: 8, marginTop: 16 }}>
              {Object.entries(KAT_COLOR).map(([kat, warna]) => (
                <button
                  key={kat}
                  onClick={() => setFilterKat(filterKat === kat ? "semua" : kat)}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 6,
                    padding: "6px 14px",
                    borderRadius: 9999,
                    border: `2px solid ${filterKat === kat ? warna : "rgba(0,0,0,0.1)"}`,
                    background: filterKat === kat ? warna + "15" : "white",
                    color: filterKat === kat ? warna : "#6b7c6d",
                    fontSize: 12,
                    fontWeight: 500,
                    cursor: "pointer",
                  }}
                >
                  <div style={{ width: 9, height: 9, borderRadius: "50%", background: warna }} />
                  {kat.charAt(0).toUpperCase() + kat.slice(1)}
                </button>
              ))}
            </div>
          </div>

          {/* LIST KEGIATAN */}
          <div>
            {selectedKegiatan && (
              <div style={{ background: "#2d5a40", borderRadius: 16, padding: 24, marginBottom: 20, color: "white", position: "relative" }}>
                <button onClick={() => setSelected(null)} style={{ position: "absolute", top: 16, right: 16, background: "rgba(255,255,255,0.2)", border: "none", borderRadius: 8, padding: "6px 10px", color: "white", cursor: "pointer" }}>✕</button>
                <div style={{ fontSize: 12, opacity: 0.8, textTransform: "uppercase" }}>{selectedKegiatan.kategori}</div>
                <div style={{ fontWeight: 800, fontSize: 20, margin: "8px 0" }}>{selectedKegiatan.judul}</div>
                <div style={{ opacity: 0.9, lineHeight: 1.6 }}>{selectedKegiatan.deskripsi}</div>
                <div style={{ marginTop: 20, display: "flex", gap: 20, fontSize: 14 }}>
                  <span>📅 {new Date(selectedKegiatan.tanggal).toLocaleDateString("id-ID", { day: "numeric", month: "long", year: "numeric" })}</span>
                  {selectedKegiatan.jam_mulai && <span>⏰ {selectedKegiatan.jam_mulai}</span>}
                  {selectedKegiatan.lokasi && <span>📍 {selectedKegiatan.lokasi}</span>}
                </div>
                <div style={{ marginTop: 24, display: "flex", gap: 12 }}>
                  <button onClick={() => openModal(selectedKegiatan)} style={{ flex: 1, background: "rgba(255,255,255,0.2)", border: "none", borderRadius: 10, padding: "12px", color: "white", cursor: "pointer" }}>✏️ Edit</button>
                  <button onClick={() => handleDelete(selectedKegiatan.id)} style={{ flex: 1, background: "#8b0000", border: "none", borderRadius: 10, padding: "12px", color: "white", cursor: "pointer" }}>🗑 Hapus</button>
                </div>
              </div>
            )}

            <h3 style={{ margin: "0 0 16px", color: "#1a2e1f", fontSize: 15, fontWeight: 700 }}>
              Agenda {BULAN[viewMonth]} {viewYear} <span style={{ fontSize: 13, color: "#7a9a7e" }}>({filtered.length} kegiatan)</span>
            </h3>

            {filtered.length === 0 ? (
              <div style={{ background: "white", borderRadius: 16, padding: 60, textAlign: "center", color: "#a8b5a9" }}>
                Belum ada kegiatan di bulan ini
              </div>
            ) : (
              filtered.map((k) => {
                const color = KAT_COLOR[k.kategori] || "#2d5a40";
                const tgl = new Date(k.tanggal);
                return (
                  <div
                    key={k.id}
                    onClick={() => setSelected(k.id)}
                    style={{
                      background: "white",
                      borderRadius: 16,
                      padding: "18px 20px",
                      marginBottom: 12,
                      border: `2px solid ${selected === k.id ? color : "rgba(45,90,64,0.12)"}`,
                      cursor: "pointer",
                      display: "flex",
                      gap: 18,
                      boxShadow: "0 2px 8px rgba(0,0,0,0.03)",
                    }}
                  >
                    {/* ... list item sama seperti kode lu ... */}
                    <div style={{ background: color + "15", borderRadius: 12, padding: "10px 14px", textAlign: "center", minWidth: 56 }}>
                      <div style={{ fontSize: 22, fontWeight: 900, color }}>{tgl.getDate()}</div>
                      <div style={{ fontSize: 10, color, fontWeight: 600 }}>{BULAN[tgl.getMonth()].slice(0, 3)}</div>
                    </div>
                    <div style={{ flex: 1 }}>
                      <div style={{ fontWeight: 700, fontSize: 15 }}>{k.judul}</div>
                      <div style={{ fontSize: 13, color: "#6b7c6d", marginTop: 4 }}>{k.deskripsi?.slice(0, 85)}{k.deskripsi?.length > 85 ? "..." : ""}</div>
                      <div style={{ display: "flex", gap: 16, marginTop: 12, fontSize: 12, color: "#a8b5a9" }}>
                        {k.jam_mulai && <span>⏰ {k.jam_mulai}</span>}
                        {k.lokasi && <span>📍 {k.lokasi}</span>}
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>
      </div>

      {/* MODAL FORM */}
      {showModal && (
        <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.6)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 50 }}>
          <div style={{ background: "white", borderRadius: 20, width: "100%", maxWidth: 480, padding: 28 }}>
            <h2 style={{ margin: 0, fontSize: 22, fontWeight: 800 }}>{editingId ? "Edit Kegiatan" : "Tambah Kegiatan Baru"}</h2>
            <div style={{ marginTop: 20, display: "flex", flexDirection: "column", gap: 16 }}>
              <input type="text" placeholder="Judul kegiatan" value={form.judul} onChange={(e) => setForm({ ...form, judul: e.target.value })} style={{ padding: 14, borderRadius: 10, border: "1px solid #ddd" }} />
              <textarea placeholder="Deskripsi" value={form.deskripsi} onChange={(e) => setForm({ ...form, deskripsi: e.target.value })} style={{ padding: 14, borderRadius: 10, border: "1px solid #ddd", minHeight: 100 }} />
              <input type="date" value={form.tanggal} onChange={(e) => setForm({ ...form, tanggal: e.target.value })} style={{ padding: 14, borderRadius: 10, border: "1px solid #ddd" }} />
              <input type="time" value={form.jam_mulai} onChange={(e) => setForm({ ...form, jam_mulai: e.target.value })} style={{ padding: 14, borderRadius: 10, border: "1px solid #ddd" }} />
              <input type="text" placeholder="Lokasi" value={form.lokasi} onChange={(e) => setForm({ ...form, lokasi: e.target.value })} style={{ padding: 14, borderRadius: 10, border: "1px solid #ddd" }} />
              <select value={form.kategori} onChange={(e) => setForm({ ...form, kategori: e.target.value })} style={{ padding: 14, borderRadius: 10, border: "1px solid #ddd" }}>
                {Object.keys(KAT_COLOR).map((k) => (
                  <option key={k} value={k}>{k.charAt(0).toUpperCase() + k.slice(1)}</option>
                ))}
              </select>
            </div>
            <div style={{ marginTop: 28, display: "flex", gap: 12 }}>
              <button onClick={() => { setShowModal(false); setEditingId(null); }} style={{ flex: 1, padding: 14, borderRadius: 12, border: "1px solid #ddd", background: "white" }}>Batal</button>
              <button onClick={handleSave} style={{ flex: 1, padding: 14, borderRadius: 12, background: "#2d5a40", color: "white", border: "none" }}>Simpan</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}