"use client";
import { useState, useEffect, useRef } from "react";
import { supabase, isSupabaseReady } from "@/lib/supabase";

const POIN_RONDA = 30;

export default function RondaKioskPage() {
  const [jadwal, setJadwal] = useState<any[]>([]);
  const [kkList, setKkList] = useState<any[]>([]);
  const [anggotaList, setAnggotaList] = useState<any[]>([]);
  const [activeJadwal, setActiveJadwal] = useState<string | null>(null);
  const [scanning, setScanning] = useState(false);
  const [manualKK, setManualKK] = useState("");
  const [lastScan, setLastScan] = useState<{ nama: string; poin: number; waktu: string } | null>(null);
  const [toast, setToast] = useState({ msg: "", ok: true });
  const [jam, setJam] = useState(new Date());
  const [hadir, setHadir] = useState<any[]>([]);
  const nfcRef = useRef<any>(null);

  useEffect(() => {
    const t = setInterval(() => setJam(new Date()), 1000);
    return () => clearInterval(t);
  }, []);

  function showToast(msg: string, ok = true) {
    setToast({ msg, ok });
    setTimeout(() => setToast({ msg: "", ok: true }), 4000);
  }

  async function fetchAll() {
    if (!isSupabaseReady()) return;
    const hariIni = new Date().toISOString().split("T")[0];
    const [j, kk, ang] = await Promise.all([
      supabase.from("jadwal_ronda").select("*").gte("tanggal", hariIni).order("tanggal", { ascending: true }).limit(5),
      supabase.from("keluarga").select("id,kepala_keluarga,rt,nfc_id").order("kepala_keluarga"),
      supabase.from("anggota_kk").select("id,kk_id,nama,nfc_id,saldo_poin").eq("hubungan", "kepala"),
    ]);
    if (j.data) setJadwal(j.data);
    if (kk.data) setKkList(kk.data);
    if (ang.data) setAnggotaList(ang.data);

    // Auto-select today's schedule
    if (j.data && j.data.length > 0 && !activeJadwal) {
      const todayJ = j.data.find((jd: any) => jd.tanggal === hariIni);
      if (todayJ) setActiveJadwal(todayJ.id);
      else setActiveJadwal(j.data[0].id);
    }
  }

  useEffect(() => { fetchAll(); }, []);

  // Fetch attendance for active jadwal
  useEffect(() => {
    if (!activeJadwal) return;
    supabase.from("absensi_ronda").select("*").eq("jadwal_id", activeJadwal).order("waktu_tap", { ascending: false })
      .then(({ data }) => { if (data) setHadir(data); });
  }, [activeJadwal, lastScan]);

  async function catatAbsensi(kkId: string, metode: string) {
    if (!activeJadwal) return showToast("⚠️ Tidak ada jadwal aktif!", false);
    const kk = kkList.find(k => k.id === kkId || k.nfc_id === kkId.toUpperCase());
    const ang = anggotaList.find(a => a.kk_id === (kk?.id || kkId) || a.nfc_id === kkId.toUpperCase());
    if (!kk && !ang) return showToast("❌ Warga tidak ditemukan!", false);

    const nama = kk?.kepala_keluarga || ang?.nama || "Unknown";
    const realKKId = kk?.id || ang?.kk_id;

    const { data: cek } = await supabase.from("absensi_ronda").select("id")
      .eq("jadwal_id", activeJadwal).eq("kk_id", realKKId).limit(1);
    if (cek && cek.length > 0) return showToast(`⚠️ ${nama} sudah tercatat hadir!`, false);

    await supabase.from("absensi_ronda").insert({ jadwal_id: activeJadwal, kk_id: realKKId, nama, metode, status: "hadir" });

    if (ang?.id) {
      await supabase.from("anggota_kk").update({ saldo_poin: (ang.saldo_poin || 0) + POIN_RONDA }).eq("id", ang.id);
      await supabase.from("riwayat_poin").insert({ anggota_id: ang.id, kk_id: realKKId, jumlah: POIN_RONDA, jenis: "masuk", sumber: "ronda", keterangan: `Ronda malam — ${new Date().toLocaleDateString("id-ID")}` });
    }

    const waktu = new Date().toLocaleTimeString("id-ID", { hour: "2-digit", minute: "2-digit" });
    setLastScan({ nama, poin: POIN_RONDA, waktu });
    showToast(`✅ ${nama} HADIR! +${POIN_RONDA} poin`);
  }

  async function startNFC() {
    if (!("NDEFReader" in window)) return showToast("⚠️ Browser tidak support NFC. Gunakan Chrome Android.", false);
    try {
      const ndef = new (window as any).NDEFReader();
      nfcRef.current = ndef;
      await ndef.scan();
      setScanning(true);
      ndef.addEventListener("reading", ({ serialNumber }: any) => {
        catatAbsensi(serialNumber.replace(/:/g, "").toUpperCase(), "nfc");
      });
    } catch { showToast("❌ Gagal aktifkan NFC", false); }
  }

  function stopNFC() {
    try { nfcRef.current?.stop?.(); } catch {}
    setScanning(false);
  }

  const activeJadwalData = jadwal.find(j => j.id === activeJadwal);

  return (
    <div style={{ minHeight: "100vh", background: "#0A120E", fontFamily: "'Inter', system-ui, sans-serif", color: "#E8F5EE", position: "relative", overflow: "hidden" }}>

      {/* Animated background grid */}
      <div style={{ position: "fixed", inset: 0, backgroundImage: "linear-gradient(rgba(47,143,78,0.06) 1px,transparent 1px),linear-gradient(90deg,rgba(47,143,78,0.06) 1px,transparent 1px)", backgroundSize: "48px 48px", pointerEvents: "none" }} />

      {/* Ambient glow top */}
      <div style={{ position: "fixed", top: "-15%", left: "50%", transform: "translateX(-50%)", width: 700, height: 400, background: "radial-gradient(ellipse,rgba(47,143,78,0.12) 0%,transparent 70%)", pointerEvents: "none" }} />

      {/* Ambient glow bottom */}
      <div style={{ position: "fixed", bottom: "-10%", right: "-5%", width: 400, height: 300, background: "radial-gradient(ellipse,rgba(47,143,78,0.08) 0%,transparent 70%)", pointerEvents: "none" }} />

      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=IBM+Plex+Mono:wght@300;400;500;600;700&family=Rajdhani:wght@400;500;600;700&display=swap');
        @keyframes sweep { from{transform:rotate(0deg)} to{transform:rotate(360deg)} }
        @keyframes ping { 0%{transform:scale(1);opacity:1} 100%{transform:scale(1.8);opacity:0} }
        @keyframes pulse-dot { 0%,100%{opacity:1} 50%{opacity:0.3} }
        @keyframes slide-up { from{transform:translateY(20px);opacity:0} to{transform:translateY(0);opacity:1} }
        @keyframes glow-pulse { 0%,100%{box-shadow:0 0 20px rgba(47,143,78,0.3)} 50%{box-shadow:0 0 40px rgba(47,143,78,0.6)} }
        @keyframes blink { 0%,100%{opacity:1} 50%{opacity:0} }
        .kiosk-btn { transition:all 0.3s cubic-bezier(.22,1,.36,1); cursor:pointer; }
        .kiosk-btn:hover { transform:translateY(-2px); filter:brightness(1.1); }
        .kiosk-btn:active { transform:translateY(0); }
        ::-webkit-scrollbar { width:4px; }
        ::-webkit-scrollbar-track { background:transparent; }
        ::-webkit-scrollbar-thumb { background:rgba(47,143,78,0.3); border-radius:2px; }
      `}</style>

      {/* Toast */}
      {toast.msg && (
        <div style={{ position: "fixed", top: 28, left: "50%", transform: "translateX(-50%)", background: toast.ok ? "rgba(47,143,78,0.95)" : "rgba(220,50,50,0.95)", color: "#fff", padding: "14px 28px", borderRadius: 14, zIndex: 999, fontSize: 14, fontWeight: 700, letterSpacing: ".04em", animation: "slide-up 0.4s ease", boxShadow: toast.ok ? "0 8px 30px rgba(47,143,78,0.4)" : "0 8px 30px rgba(220,50,50,0.4)", maxWidth: "90vw", textAlign: "center", backdropFilter: "blur(10px)" }}>
          {toast.msg}
        </div>
      )}

      {/* Header */}
      <header style={{ padding: "28px 24px 20px", textAlign: "center", position: "relative", zIndex: 2 }}>
        <div style={{ fontSize: 9, fontWeight: 700, letterSpacing: ".25em", color: "rgba(47,143,78,0.5)", marginBottom: 8, textTransform: "uppercase" }}>
          Ciburial Eco-Digital Village
        </div>
        <h1 style={{ margin: "0 0 6px", fontFamily: "'Rajdhani', sans-serif", fontSize: "clamp(32px,8vw,48px)", fontWeight: 700, letterSpacing: "-.02em", background: "linear-gradient(135deg,#4FBF7E,#2F8F4E)", backgroundClip: "text", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent", lineHeight: 1.1 }}>
          Ronda Digital
        </h1>
        <div style={{ fontSize: 11, color: "rgba(47,143,78,0.5)", letterSpacing: ".15em", fontWeight: 500 }}>
          NIGHT PATROL KIOSK — ABSENSI MANDIRI
        </div>
      </header>

      {/* Digital Clock */}
      <div style={{ textAlign: "center", marginBottom: 24, position: "relative", zIndex: 2 }}>
        <div style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: "clamp(56px,15vw,80px)", fontWeight: 700, color: "#2F8F4E", lineHeight: 1, letterSpacing: ".08em", textShadow: "0 0 40px rgba(47,143,78,0.4), 0 0 80px rgba(47,143,78,0.15)" }}>
          {jam.toLocaleTimeString("id-ID", { hour: "2-digit", minute: "2-digit", second: "2-digit" })}
        </div>
        <div style={{ fontSize: 13, color: "rgba(47,143,78,0.6)", letterSpacing: ".12em", fontWeight: 600, marginTop: 6 }}>
          {jam.toLocaleDateString("id-ID", { weekday: "long", day: "numeric", month: "long", year: "numeric" }).toUpperCase()}
        </div>
      </div>

      {/* Main content */}
      <div style={{ maxWidth: 480, margin: "0 auto", padding: "0 20px 40px", position: "relative", zIndex: 2 }}>

        {/* Active schedule info */}
        {activeJadwalData && (
          <div style={{ background: "rgba(47,143,78,0.08)", border: "1.5px solid rgba(47,143,78,0.2)", borderRadius: 16, padding: "16px 20px", marginBottom: 20, display: "flex", alignItems: "center", gap: 14 }}>
            <div style={{ width: 44, height: 44, borderRadius: 12, background: "rgba(47,143,78,0.15)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 22 }}>🔦</div>
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: 10, fontWeight: 700, letterSpacing: ".15em", color: "rgba(47,143,78,0.6)", marginBottom: 3 }}>JADWAL AKTIF</div>
              <div style={{ fontFamily: "'Rajdhani',sans-serif", fontWeight: 700, fontSize: 17, color: "#4FBF7E" }}>
                RT {activeJadwalData.rt} — {new Date(activeJadwalData.tanggal).toLocaleDateString("id-ID", { weekday: "long", day: "numeric", month: "long" })}
              </div>
              <div style={{ fontSize: 11, color: "rgba(47,143,78,0.5)", fontWeight: 500 }}>
                ⏰ {activeJadwalData.jam_mulai} — {activeJadwalData.jam_selesai} · ✅ {hadir.length} hadir
              </div>
            </div>
          </div>
        )}

        {/* Schedule selector if multiple */}
        {jadwal.length > 1 && (
          <div style={{ marginBottom: 20 }}>
            <label style={{ fontSize: 9, fontWeight: 700, letterSpacing: ".2em", color: "rgba(47,143,78,0.4)", display: "block", marginBottom: 6 }}>PILIH JADWAL</label>
            <select value={activeJadwal || ""} onChange={e => setActiveJadwal(e.target.value)}
              style={{ width: "100%", padding: "12px 16px", borderRadius: 12, border: "1.5px solid rgba(47,143,78,0.2)", fontSize: 13, background: "rgba(10,18,14,0.8)", color: "#4FBF7E", outline: "none", fontFamily: "'Inter',sans-serif", fontWeight: 600 }}>
              {jadwal.map(j => <option key={j.id} value={j.id}>RT {j.rt} — {new Date(j.tanggal).toLocaleDateString("id-ID", { day: "numeric", month: "long" })} ({j.jam_mulai}-{j.jam_selesai})</option>)}
            </select>
          </div>
        )}

        {/* NFC Scanner Zone */}
        <div style={{ background: scanning ? "rgba(47,143,78,0.08)" : "rgba(255,255,255,0.03)", border: scanning ? "2px solid rgba(47,143,78,0.4)" : "1.5px solid rgba(47,143,78,0.12)", borderRadius: 24, padding: "36px 24px", textAlign: "center", marginBottom: 20, transition: "all 0.5s", animation: scanning ? "glow-pulse 2s infinite" : "none" }}>

          {/* Radar */}
          <div style={{ position: "relative", width: 140, height: 140, margin: "0 auto 24px" }}>
            {[1, 2, 3].map(i => (
              <div key={i} style={{ position: "absolute", inset: 0, borderRadius: "50%", border: `1px solid rgba(47,143,78,${scanning ? 0.25 : 0.1})`, transform: `scale(${i * 0.33})`, transformOrigin: "center" }} />
            ))}
            {scanning && (
              <div style={{ position: "absolute", inset: 0, borderRadius: "50%", background: "conic-gradient(from 0deg, transparent 270deg, rgba(47,143,78,0.25) 360deg)", animation: "sweep 2s linear infinite" }} />
            )}
            <div style={{ position: "absolute", top: "50%", left: "50%", transform: "translate(-50%,-50%)", width: scanning ? 24 : 16, height: scanning ? 24 : 16, borderRadius: "50%", background: scanning ? "#2F8F4E" : "rgba(47,143,78,0.3)", boxShadow: scanning ? "0 0 30px #2F8F4E, 0 0 60px rgba(47,143,78,0.3)" : "none", transition: "all 0.3s" }} />
            {scanning && (
              <div style={{ position: "absolute", inset: 0, borderRadius: "50%", border: "2px solid rgba(47,143,78,0.4)", animation: "ping 1.5s ease-out infinite" }} />
            )}
          </div>

          <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: ".15em", color: scanning ? "#4FBF7E" : "rgba(47,143,78,0.4)", marginBottom: 20, transition: "color 0.3s" }}>
            {scanning ? "◉ MENUNGGU TEMPELAN E-KTP..." : "○ NFC SCANNER BELUM AKTIF"}
          </div>

          <button onClick={scanning ? stopNFC : startNFC} className="kiosk-btn"
            style={{ width: "100%", padding: "16px", borderRadius: 14, border: scanning ? "1.5px solid rgba(220,50,50,0.4)" : "none", background: scanning ? "rgba(220,50,50,0.15)" : "linear-gradient(135deg,#2F8F4E,#4FBF7E)", color: scanning ? "#FF6B6B" : "#FFF", fontSize: 14, fontWeight: 800, letterSpacing: ".1em", fontFamily: "'Inter',sans-serif", boxShadow: scanning ? "none" : "0 8px 30px rgba(47,143,78,0.3)" }}>
            {scanning ? "⏹ STOP SCANNING" : "▶ AKTIFKAN NFC e-KTP"}
          </button>

          <div style={{ marginTop: 10, fontSize: 10, color: "rgba(47,143,78,0.3)", letterSpacing: ".06em", lineHeight: 1.6 }}>
            Chrome Android · NFC harus aktif di pengaturan HP
          </div>
        </div>

        {/* Success Card */}
        {lastScan && (
          <div style={{ background: "rgba(47,143,78,0.12)", border: "1.5px solid rgba(47,143,78,0.3)", borderRadius: 20, padding: "20px 24px", marginBottom: 20, animation: "slide-up 0.5s ease", textAlign: "center" }}>
            <div style={{ fontSize: 40, marginBottom: 8 }}>✅</div>
            <div style={{ fontFamily: "'Rajdhani',sans-serif", fontSize: 24, fontWeight: 700, color: "#4FBF7E", marginBottom: 4 }}>{lastScan.nama}</div>
            <div style={{ fontSize: 13, color: "rgba(47,143,78,0.6)", fontWeight: 600 }}>
              HADIR · +{lastScan.poin} Poin · {lastScan.waktu}
            </div>
          </div>
        )}

        {/* Divider */}
        <div style={{ display: "flex", alignItems: "center", gap: 12, margin: "24px 0 16px" }}>
          <div style={{ flex: 1, height: 1, background: "rgba(47,143,78,0.15)" }} />
          <span style={{ fontSize: 9, fontWeight: 700, letterSpacing: ".2em", color: "rgba(47,143,78,0.3)" }}>ATAU INPUT MANUAL</span>
          <div style={{ flex: 1, height: 1, background: "rgba(47,143,78,0.15)" }} />
        </div>

        {/* Manual Input */}
        <div style={{ background: "rgba(255,255,255,0.03)", border: "1.5px solid rgba(47,143,78,0.12)", borderRadius: 16, padding: "20px", marginBottom: 24 }}>
          <select value={manualKK} onChange={e => setManualKK(e.target.value)}
            style={{ width: "100%", padding: "14px 16px", borderRadius: 12, border: "1.5px solid rgba(47,143,78,0.2)", fontSize: 14, background: "rgba(10,18,14,0.9)", color: "#E8F5EE", outline: "none", fontWeight: 600, fontFamily: "'Inter',sans-serif", marginBottom: 12, boxSizing: "border-box" }}>
            <option value="">— Pilih Nama Warga —</option>
            {kkList.map(k => <option key={k.id} value={k.id}>{k.kepala_keluarga} (RT {k.rt})</option>)}
          </select>
          <button onClick={() => { if (manualKK) { catatAbsensi(manualKK, "manual"); setManualKK(""); } }} className="kiosk-btn"
            style={{ width: "100%", padding: "14px", borderRadius: 12, border: "none", background: manualKK ? "linear-gradient(135deg,#2F8F4E,#4FBF7E)" : "rgba(47,143,78,0.15)", color: manualKK ? "#FFF" : "rgba(47,143,78,0.3)", fontSize: 13, fontWeight: 800, letterSpacing: ".1em", fontFamily: "'Inter',sans-serif", boxSizing: "border-box" }}>
            ✓ CATAT KEHADIRAN
          </button>
        </div>

        {/* Attendance List */}
        {hadir.length > 0 && (
          <div style={{ background: "rgba(255,255,255,0.03)", border: "1.5px solid rgba(47,143,78,0.12)", borderRadius: 16, overflow: "hidden" }}>
            <div style={{ padding: "12px 20px", borderBottom: "1px solid rgba(47,143,78,0.1)", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <span style={{ fontSize: 10, fontWeight: 700, letterSpacing: ".15em", color: "#2F8F4E" }}>SUDAH HADIR</span>
              <span style={{ fontSize: 10, color: "rgba(47,143,78,0.5)", fontWeight: 600 }}>{hadir.length} petugas</span>
            </div>
            <div style={{ maxHeight: 240, overflowY: "auto" }}>
              {hadir.map((a, i) => (
                <div key={a.id} style={{ display: "flex", alignItems: "center", gap: 12, padding: "12px 20px", borderBottom: i < hadir.length - 1 ? "1px solid rgba(47,143,78,0.06)" : "none" }}>
                  <div style={{ width: 8, height: 8, borderRadius: "50%", background: "#2F8F4E", boxShadow: "0 0 8px rgba(47,143,78,0.6)", flexShrink: 0 }} />
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: 14, fontWeight: 700, color: "#E8F5EE" }}>{a.nama}</div>
                    <div style={{ fontSize: 10, color: "rgba(47,143,78,0.4)", fontWeight: 500 }}>
                      {a.metode === "nfc" ? "e-KTP/NFC" : "Manual"} · {new Date(a.waktu_tap).toLocaleTimeString("id-ID", { hour: "2-digit", minute: "2-digit" })}
                    </div>
                  </div>
                  <div style={{ fontSize: 12, color: "#4FBF7E", fontWeight: 800, fontFamily: "'IBM Plex Mono',monospace" }}>+{POIN_RONDA}</div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Footer */}
        <div style={{ textAlign: "center", marginTop: 40, paddingBottom: 20 }}>
          <div style={{ fontSize: 9, color: "rgba(47,143,78,0.2)", letterSpacing: ".2em", lineHeight: 1.8, fontWeight: 500 }}>
            HALAMAN KIOSK · HANYA UNTUK ABSENSI<br />
            DATA DIJAGA SECARA AMAN DI SERVER
          </div>
        </div>
      </div>
    </div>
  );
}
