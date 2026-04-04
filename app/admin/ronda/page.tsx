"use client";
import { useState, useEffect, useRef } from "react";
import { supabase, isSupabaseReady } from "@/lib/supabase";

interface Jadwal { id: string; tanggal: string; rt: string; jam_mulai: string; }
interface Absensi { id: string; jadwal_id: string; nama: string; waktu_tap: string; metode: string; }

const emptyJadwal = { tanggal: new Date().toISOString().split("T")[0], rt: "01", jam_mulai: "21:00", jam_selesai: "04:00" };

export default function AdminRondaPage() {
  const [jadwal, setJadwal] = useState<Jadwal[]>([]);
  const [absensi, setAbsensi] = useState<Absensi[]>([]);
  const [kkList, setKkList] = useState<any[]>([]);
  const [formJadwal, setFormJadwal] = useState(emptyJadwal);
  const [activeJadwal, setActiveJadwal] = useState<string | null>(null);
  const [tab, setTab] = useState<"jadwal" | "scan">("jadwal");
  const [scanning, setScanning] = useState(false);
  const [lastScan, setLastScan] = useState<string | null>(null);
  const [manualKK, setManualKK] = useState("");
  const [toast, setToast] = useState("");
  const nfcRef = useRef<any>(null);

  function showToast(msg: string) { setToast(msg); setTimeout(() => setToast(""), 4000); }

  async function fetchAll() {
    if (!isSupabaseReady()) return;
    const [j, a, kk] = await Promise.all([
      supabase.from("jadwal_ronda").select("*").order("tanggal", { ascending: false }).limit(10),
      supabase.from("absensi_ronda").select("*").order("waktu_tap", { ascending: false }).limit(50),
      supabase.from("keluarga").select("id,kepala_keluarga,rt,nfc_id,no_wa").order("kepala_keluarga"),
    ]);
    if (j.data) setJadwal(j.data as Jadwal[]);
    if (a.data) setAbsensi(a.data as Absensi[]);
    if (kk.data) setKkList(kk.data);
  }

  useEffect(() => { fetchAll(); }, []);

  async function buatJadwal() {
    await supabase.from("jadwal_ronda").insert(formJadwal);
    showToast("✅ Jadwal ronda dibuat!");
    setFormJadwal(emptyJadwal);
    fetchAll();
  }

  async function catatAbsensi(kkId: string, metode: string) {
    if (!activeJadwal) return showToast("⚠️ Pilih jadwal ronda dulu!");
    const kk = kkList.find(k => k.id === kkId || k.nfc_id === kkId);
    if (!kk) return showToast("❌ Warga tidak ditemukan!");
    // Cek sudah absen
    const sudah = absensi.find(a => a.jadwal_id === activeJadwal && a.nama === kk.kepala_keluarga);
    if (sudah) return showToast(`⚠️ ${kk.kepala_keluarga} sudah absen!`);
    await supabase.from("absensi_ronda").insert({ jadwal_id: activeJadwal, kk_id: kk.id, nama: kk.kepala_keluarga, metode, status: "hadir" });
    setLastScan(kk.kepala_keluarga);
    showToast(`✅ ${kk.kepala_keluarga} — HADIR!`);
    fetchAll();
  }

  async function startNFC() {
    if (!("NDEFReader" in window)) return showToast("⚠️ HP ini tidak support NFC atau browser bukan Chrome");
    try {
      const ndef = new (window as any).NDEFReader();
      nfcRef.current = ndef;
      await ndef.scan();
      setScanning(true);
      showToast("📡 NFC aktif! Tempelkan kartu warga...");
      ndef.addEventListener("reading", ({ serialNumber }: any) => {
        const nfcId = serialNumber.replace(/:/g, "").toUpperCase();
        catatAbsensi(nfcId, "nfc");
      });
    } catch {
      showToast("❌ Gagal aktifkan NFC. Pastikan NFC HP aktif!");
    }
  }

  function stopNFC() { setScanning(false); showToast("NFC dimatikan"); }

  const activeAbsensi = absensi.filter(a => a.jadwal_id === activeJadwal);
  const activeJadwalData = jadwal.find(j => j.id === activeJadwal);

  return (
    <div style={{ minHeight: "100vh", background: "#f5f0e8", fontFamily: "'Segoe UI',system-ui,sans-serif" }}>
      {toast && <div style={{ position: "fixed", top: 20, left: "50%", transform: "translateX(-50%)", background: "#2d5a40", color: "white", padding: "10px 20px", borderRadius: 12, zIndex: 999, fontSize: 14, boxShadow: "0 4px 20px rgba(0,0,0,0.15)", maxWidth: "80vw", textAlign: "center" }}>{toast}</div>}

      <header style={{ background: "#f5f0e8", borderBottom: "1px solid rgba(45,90,64,0.12)", padding: "14px 20px", position: "sticky", top: 0, zIndex: 10, display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <a href="/admin" style={{ color: "#6b7c6d", textDecoration: "none", fontSize: 13 }}>← Admin</a>
          <span style={{ color: "#c8bfaa" }}>|</span>
          <div>
            <div style={{ fontWeight: 800, fontSize: 15, color: "#1a2e1f" }}>🔦 Absensi Ronda</div>
            <div style={{ fontSize: 10, color: "#7a9a7e", textTransform: "uppercase", letterSpacing: "0.08em" }}>NFC Digital</div>
          </div>
        </div>
        <div style={{ display: "flex", gap: 6 }}>
          {(["jadwal", "scan"] as const).map(t => (
            <button key={t} onClick={() => setTab(t)} style={{ padding: "6px 14px", borderRadius: 20, fontSize: 12, fontWeight: 600, border: "1.5px solid rgba(45,90,64,0.2)", cursor: "pointer", background: tab === t ? "#2d5a40" : "transparent", color: tab === t ? "white" : "#6b7c6d" }}>
              {t === "jadwal" ? "📋 Jadwal" : "📡 Scan NFC"}
            </button>
          ))}
        </div>
      </header>

      <div style={{ maxWidth: 860, margin: "0 auto", padding: "20px 16px" }}>

        {/* JADWAL TAB */}
        {tab === "jadwal" && (
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1.5fr", gap: 16 }}>
            {/* Form buat jadwal */}
            <div style={{ background: "white", borderRadius: 16, padding: 20, border: "1px solid rgba(45,90,64,0.1)", boxShadow: "0 1px 6px rgba(0,0,0,0.04)", alignSelf: "start" }}>
              <h3 style={{ margin: "0 0 16px", color: "#1a2e1f", fontSize: 15 }}>➕ Buat Jadwal Ronda</h3>
              {[
                { label: "Tanggal", key: "tanggal", type: "date" },
                { label: "Jam Mulai", key: "jam_mulai", type: "time" },
                { label: "Jam Selesai", key: "jam_selesai", type: "time" },
              ].map(f => (
                <div key={f.key} style={{ marginBottom: 12 }}>
                  <label style={{ fontSize: 11, fontWeight: 700, color: "#6b7c6d", letterSpacing: "0.06em", textTransform: "uppercase", display: "block", marginBottom: 4 }}>{f.label}</label>
                  <input type={f.type} value={(formJadwal as any)[f.key]} onChange={e => setFormJadwal({ ...formJadwal, [f.key]: e.target.value })}
                    style={{ width: "100%", padding: "9px 12px", borderRadius: 10, border: "1.5px solid rgba(45,90,64,0.2)", fontSize: 13, background: "#fafaf8", outline: "none", boxSizing: "border-box" }} />
                </div>
              ))}
              <div style={{ marginBottom: 16 }}>
                <label style={{ fontSize: 11, fontWeight: 700, color: "#6b7c6d", letterSpacing: "0.06em", textTransform: "uppercase", display: "block", marginBottom: 4 }}>RT</label>
                <select value={formJadwal.rt} onChange={e => setFormJadwal({ ...formJadwal, rt: e.target.value })}
                  style={{ width: "100%", padding: "9px 12px", borderRadius: 10, border: "1.5px solid rgba(45,90,64,0.2)", fontSize: 13, background: "#fafaf8", outline: "none" }}>
                  {["01", "02", "03", "04", "05"].map(v => <option key={v} value={v}>RT {v}</option>)}
                </select>
              </div>
              <button onClick={buatJadwal} style={{ width: "100%", background: "#2d5a40", color: "white", border: "none", borderRadius: 10, padding: "10px", fontSize: 14, fontWeight: 600, cursor: "pointer" }}>💾 Buat Jadwal</button>
            </div>

            {/* List jadwal */}
            <div>
              <h3 style={{ margin: "0 0 12px", color: "#1a2e1f", fontSize: 14, fontWeight: 700 }}>Jadwal Ronda Terbaru</h3>
              {jadwal.map(j => {
                const jmlAbsensi = absensi.filter(a => a.jadwal_id === j.id).length;
                return (
                  <div key={j.id} onClick={() => { setActiveJadwal(j.id); setTab("scan"); }}
                    style={{ background: "white", borderRadius: 14, padding: "14px 16px", marginBottom: 10, border: `2px solid ${activeJadwal === j.id ? "#2d5a40" : "rgba(45,90,64,0.1)"}`, cursor: "pointer", boxShadow: "0 1px 6px rgba(0,0,0,0.04)", display: "flex", alignItems: "center", gap: 12 }}>
                    <div style={{ fontSize: 24 }}>🔦</div>
                    <div style={{ flex: 1 }}>
                      <div style={{ fontWeight: 700, fontSize: 14, color: "#1a2e1f" }}>
                        RT {j.rt} — {new Date(j.tanggal).toLocaleDateString("id-ID", { weekday: "long", day: "numeric", month: "long" })}
                      </div>
                      <div style={{ fontSize: 12, color: "#7a9a7e" }}>⏰ {j.jam_mulai} — selesai · ✅ {jmlAbsensi} hadir</div>
                    </div>
                    <div style={{ fontSize: 12, color: "#2d5a40", fontWeight: 600 }}>Scan →</div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* SCAN TAB */}
        {tab === "scan" && (
          <div>
            {/* Pilih jadwal */}
            <div style={{ marginBottom: 16 }}>
              <label style={{ fontSize: 11, fontWeight: 700, color: "#6b7c6d", letterSpacing: "0.06em", textTransform: "uppercase", display: "block", marginBottom: 6 }}>Jadwal Aktif</label>
              <select value={activeJadwal || ""} onChange={e => setActiveJadwal(e.target.value)}
                style={{ width: "100%", padding: "10px 14px", borderRadius: 12, border: "1.5px solid rgba(45,90,64,0.2)", fontSize: 14, background: "white", outline: "none" }}>
                <option value="">-- Pilih jadwal ronda --</option>
                {jadwal.map(j => <option key={j.id} value={j.id}>RT {j.rt} — {new Date(j.tanggal).toLocaleDateString("id-ID", { day: "numeric", month: "long" })} ({absensi.filter(a => a.jadwal_id === j.id).length} hadir)</option>)}
              </select>
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
              {/* NFC Scanner */}
              <div style={{ background: "white", borderRadius: 16, padding: 24, border: "1px solid rgba(45,90,64,0.1)", boxShadow: "0 1px 6px rgba(0,0,0,0.04)", textAlign: "center" }}>
                <h3 style={{ margin: "0 0 20px", color: "#1a2e1f", fontSize: 15 }}>📡 Scan NFC</h3>
                <div style={{
                  width: 120, height: 120, borderRadius: "50%", margin: "0 auto 20px",
                  background: scanning ? "rgba(45,90,64,0.1)" : "rgba(45,90,64,0.05)",
                  border: `3px ${scanning ? "solid" : "dashed"} ${scanning ? "#2d5a40" : "rgba(45,90,64,0.3)"}`,
                  display: "flex", alignItems: "center", justifyContent: "center",
                  fontSize: 40, animation: scanning ? "pulse 1.5s infinite" : "none",
                }}>📡</div>
                {lastScan && <div style={{ background: "rgba(45,90,64,0.08)", borderRadius: 10, padding: "8px 14px", marginBottom: 16, fontSize: 13, color: "#2d5a40", fontWeight: 600 }}>✅ {lastScan}</div>}
                <button onClick={scanning ? stopNFC : startNFC}
                  style={{ width: "100%", background: scanning ? "rgba(220,53,69,0.1)" : "#2d5a40", color: scanning ? "#dc3545" : "white", border: scanning ? "1.5px solid rgba(220,53,69,0.3)" : "none", borderRadius: 12, padding: "12px", fontSize: 14, fontWeight: 600, cursor: "pointer" }}>
                  {scanning ? "⏹ Stop NFC" : "▶ Aktifkan NFC"}
                </button>
                <p style={{ fontSize: 11, color: "#a8b5a9", marginTop: 10 }}>Chrome Android + NFC aktif</p>
              </div>

              {/* Manual input */}
              <div style={{ background: "white", borderRadius: 16, padding: 24, border: "1px solid rgba(45,90,64,0.1)", boxShadow: "0 1px 6px rgba(0,0,0,0.04)" }}>
                <h3 style={{ margin: "0 0 16px", color: "#1a2e1f", fontSize: 15 }}>✋ Input Manual</h3>
                <select value={manualKK} onChange={e => setManualKK(e.target.value)}
                  style={{ width: "100%", padding: "10px 12px", borderRadius: 10, border: "1.5px solid rgba(45,90,64,0.2)", fontSize: 13, background: "#fafaf8", outline: "none", marginBottom: 10 }}>
                  <option value="">-- Pilih warga --</option>
                  {kkList.map(k => <option key={k.id} value={k.id}>{k.kepala_keluarga} (RT {k.rt})</option>)}
                </select>
                <button onClick={() => { if (manualKK) { catatAbsensi(manualKK, "manual"); setManualKK(""); } }}
                  style={{ width: "100%", background: "#2d5a40", color: "white", border: "none", borderRadius: 10, padding: "10px", fontSize: 14, fontWeight: 600, cursor: "pointer" }}>
                  ✅ Catat Hadir
                </button>

                {/* Rekap hadir */}
                <div style={{ marginTop: 16 }}>
                  <div style={{ fontSize: 12, fontWeight: 700, color: "#6b7c6d", marginBottom: 8, textTransform: "uppercase", letterSpacing: "0.06em" }}>Rekap Hadir ({activeAbsensi.length})</div>
                  <div style={{ maxHeight: 200, overflowY: "auto" }}>
                    {activeAbsensi.length === 0 ? (
                      <div style={{ fontSize: 13, color: "#a8b5a9", textAlign: "center", padding: 16 }}>Belum ada yang hadir</div>
                    ) : activeAbsensi.map((a, i) => (
                      <div key={a.id} style={{ display: "flex", alignItems: "center", gap: 8, padding: "6px 10px", borderRadius: 8, background: i % 2 === 0 ? "#fafaf8" : "transparent", marginBottom: 4 }}>
                        <span style={{ fontSize: 12 }}>{a.metode === "nfc" ? "💳" : "✋"}</span>
                        <span style={{ flex: 1, fontSize: 13, color: "#1a2e1f", fontWeight: 500 }}>{a.nama}</span>
                        <span style={{ fontSize: 11, color: "#a8b5a9" }}>{new Date(a.waktu_tap).toLocaleTimeString("id-ID", { hour: "2-digit", minute: "2-digit" })}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
      <style>{`@keyframes pulse{0%,100%{opacity:1}50%{opacity:0.5}}`}</style>
    </div>
  );
}
