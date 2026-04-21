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
    if (j.data && j.data.length > 0 && !activeJadwal) {
      const todayJ = j.data.find((jd: any) => jd.tanggal === hariIni);
      setActiveJadwal(todayJ ? todayJ.id : j.data[0].id);
    }
  }

  useEffect(() => { fetchAll(); }, []);

  useEffect(() => {
    if (!activeJadwal) return;
    supabase.from("absensi_ronda").select("*").eq("jadwal_id", activeJadwal).order("waktu_tap", { ascending: false })
      .then(({ data }) => { if (data) setHadir(data); });
  }, [activeJadwal, lastScan]);

  async function catatAbsensi(kkId: string, metode: string) {
    if (!activeJadwal) return showToast("Tidak ada jadwal aktif!", false);
    const kk = kkList.find(k => k.id === kkId || k.nfc_id === kkId.toUpperCase());
    const ang = anggotaList.find(a => a.kk_id === (kk?.id || kkId) || a.nfc_id === kkId.toUpperCase());
    if (!kk && !ang) return showToast("Warga tidak ditemukan!", false);
    const nama = kk?.kepala_keluarga || ang?.nama || "Unknown";
    const realKKId = kk?.id || ang?.kk_id;
    const { data: cek } = await supabase.from("absensi_ronda").select("id").eq("jadwal_id", activeJadwal).eq("kk_id", realKKId).limit(1);
    if (cek && cek.length > 0) return showToast(`${nama} sudah tercatat hadir!`, false);
    await supabase.from("absensi_ronda").insert({ jadwal_id: activeJadwal, kk_id: realKKId, nama, metode, status: "hadir" });
    if (ang?.id) {
      await supabase.from("anggota_kk").update({ saldo_poin: (ang.saldo_poin || 0) + POIN_RONDA }).eq("id", ang.id);
      await supabase.from("riwayat_poin").insert({ anggota_id: ang.id, kk_id: realKKId, jumlah: POIN_RONDA, jenis: "masuk", sumber: "ronda", keterangan: `Ronda malam — ${new Date().toLocaleDateString("id-ID")}` });
    }
    const waktu = new Date().toLocaleTimeString("id-ID", { hour: "2-digit", minute: "2-digit" });
    setLastScan({ nama, poin: POIN_RONDA, waktu });
    showToast(`${nama} berhasil absen! +${POIN_RONDA} poin`);
  }

  async function startNFC() {
    if (!("NDEFReader" in window)) return showToast("Browser tidak support NFC. Gunakan Chrome Android.", false);
    try {
      const ndef = new (window as any).NDEFReader();
      nfcRef.current = ndef;
      await ndef.scan();
      setScanning(true);
      ndef.addEventListener("reading", ({ serialNumber }: any) => {
        catatAbsensi(serialNumber.replace(/:/g, "").toUpperCase(), "nfc");
      });
    } catch { showToast("Gagal aktifkan NFC", false); }
  }

  function stopNFC() {
    try { nfcRef.current?.stop?.(); } catch {}
    setScanning(false);
  }

  const activeJadwalData = jadwal.find(j => j.id === activeJadwal);

  return (
    <div style={{ minHeight: "100vh", background: "#080F0B", fontFamily: "'Inter', system-ui, sans-serif", color: "#E8F5EE", display: "flex", flexDirection: "column", overflow: "hidden" }}>

      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800&display=swap');
        @keyframes pulse-ring { 0%{transform:scale(0.8);opacity:0.8} 100%{transform:scale(1.6);opacity:0} }
        @keyframes pulse-ring2 { 0%{transform:scale(0.8);opacity:0.5} 100%{transform:scale(2.2);opacity:0} }
        @keyframes slide-up { from{transform:translateY(16px);opacity:0} to{transform:translateY(0);opacity:1} }
        @keyframes fade-in { from{opacity:0} to{opacity:1} }
        @keyframes blink { 0%,100%{opacity:1} 50%{opacity:0.2} }
        .ronda-btn { transition: all 0.25s cubic-bezier(.22,1,.36,1); cursor: pointer; }
        .ronda-btn:hover { transform: translateY(-2px); filter: brightness(1.08); }
        .ronda-btn:active { transform: translateY(0) scale(0.98); }
        select, select option { background: #0D1710 !important; }
        ::-webkit-scrollbar { width: 3px; }
        ::-webkit-scrollbar-track { background: transparent; }
        ::-webkit-scrollbar-thumb { background: rgba(47,143,78,0.25); border-radius: 2px; }
      `}</style>

      {/* Ambient BG */}
      <div style={{ position: "fixed", inset: 0, pointerEvents: "none" }}>
        <div style={{ position: "absolute", top: "-20%", left: "-10%", width: "60vw", height: "60vw", background: "radial-gradient(ellipse,rgba(47,143,78,0.07) 0%,transparent 70%)" }} />
        <div style={{ position: "absolute", bottom: "-10%", right: "-10%", width: "40vw", height: "40vw", background: "radial-gradient(ellipse,rgba(47,143,78,0.05) 0%,transparent 70%)" }} />
      </div>

      {/* Toast */}
      {toast.msg && (
        <div style={{ position: "fixed", top: 24, left: "50%", transform: "translateX(-50%)", background: toast.ok ? "rgba(47,143,78,0.92)" : "rgba(200,50,50,0.92)", color: "#fff", padding: "13px 28px", borderRadius: 100, zIndex: 999, fontSize: 13, fontWeight: 600, letterSpacing: ".02em", animation: "slide-up 0.3s ease", backdropFilter: "blur(20px)", border: `1px solid ${toast.ok ? "rgba(79,191,126,0.3)" : "rgba(255,100,100,0.3)"}`, maxWidth: "88vw", textAlign: "center" }}>
          {toast.msg}
        </div>
      )}

      {/* ===== Main Layout ===== */}
      <div style={{ flex: 1, display: "grid", gridTemplateColumns: "1fr", gridTemplateRows: "auto 1fr", maxHeight: "100vh", position: "relative", zIndex: 1 }}>

        {/* Top Bar */}
        <header style={{ padding: "20px 28px 0", display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: 12 }}>
          <div>
            <div style={{ fontSize: 9, fontWeight: 700, letterSpacing: ".25em", color: "rgba(47,143,78,0.45)", textTransform: "uppercase" }}>Ciburial Eco-Digital</div>
            <h1 style={{ margin: "4px 0 0", fontSize: "clamp(22px,4vw,28px)", fontWeight: 800, color: "#E8F5EE", letterSpacing: "-.03em", lineHeight: 1 }}>Ronda Digital<span style={{ color: "#2F8F4E" }}>.</span></h1>
          </div>
          <div style={{ textAlign: "right" }}>
            <div style={{ fontVariantNumeric: "tabular-nums", fontSize: "clamp(28px,6vw,44px)", fontWeight: 700, color: "#2F8F4E", lineHeight: 1, letterSpacing: ".03em", textShadow: "0 0 40px rgba(47,143,78,0.35)" }}>
              {jam.toLocaleTimeString("id-ID", { hour: "2-digit", minute: "2-digit", second: "2-digit" })}
            </div>
            <div style={{ fontSize: 11, color: "rgba(232,245,238,0.35)", marginTop: 3, fontWeight: 500 }}>
              {jam.toLocaleDateString("id-ID", { weekday: "long", day: "numeric", month: "long" })}
            </div>
          </div>
        </header>

        {/* Content Area */}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(300px, 1fr))", gap: 16, padding: "20px 28px 28px", overflowY: "auto", alignContent: "start" }}>

          {/* ===== LEFT: Scanner Column ===== */}
          <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>

            {/* Active Schedule Tag */}
            {activeJadwalData ? (
              <div style={{ background: "rgba(47,143,78,0.07)", border: "1px solid rgba(47,143,78,0.18)", borderRadius: 14, padding: "14px 18px", display: "flex", alignItems: "center", gap: 12 }}>
                <div style={{ width: 8, height: 8, borderRadius: "50%", background: "#2F8F4E", boxShadow: "0 0 8px #2F8F4E", animation: "blink 2s infinite", flexShrink: 0 }} />
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: 10, fontWeight: 700, letterSpacing: ".12em", color: "rgba(47,143,78,0.55)", marginBottom: 2 }}>JADWAL AKTIF</div>
                  <div style={{ fontSize: 14, fontWeight: 700, color: "#4FBF7E" }}>
                    RT {activeJadwalData.rt} — {new Date(activeJadwalData.tanggal).toLocaleDateString("id-ID", { weekday: "short", day: "numeric", month: "short" })}
                  </div>
                  <div style={{ fontSize: 11, color: "rgba(232,245,238,0.4)", marginTop: 1 }}>
                    {activeJadwalData.jam_mulai} – {activeJadwalData.jam_selesai} &nbsp;·&nbsp; {hadir.length} sudah hadir
                  </div>
                </div>
                {jadwal.length > 1 && (
                  <select value={activeJadwal || ""} onChange={e => setActiveJadwal(e.target.value)}
                    style={{ padding: "6px 10px", borderRadius: 8, border: "1px solid rgba(47,143,78,0.2)", fontSize: 11, color: "#4FBF7E", outline: "none", fontFamily: "inherit", fontWeight: 600, cursor: "pointer" }}>
                    {jadwal.map(j => <option key={j.id} value={j.id}>RT {j.rt} — {new Date(j.tanggal).toLocaleDateString("id-ID", { day: "numeric", month: "short" })}</option>)}
                  </select>
                )}
              </div>
            ) : (
              <div style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.07)", borderRadius: 14, padding: "14px 18px", fontSize: 13, color: "rgba(232,245,238,0.3)", textAlign: "center" }}>
                Tidak ada jadwal ronda hari ini.
              </div>
            )}

            {/* NFC Scanner Zone */}
            <div style={{ background: "rgba(255,255,255,0.025)", border: `1px solid ${scanning ? "rgba(47,143,78,0.4)" : "rgba(255,255,255,0.07)"}`, borderRadius: 24, padding: "40px 24px", textAlign: "center", transition: "border-color 0.4s" }}>

              {/* Pulse Animation */}
              <div style={{ position: "relative", width: 120, height: 120, margin: "0 auto 28px" }}>
                {scanning && <>
                  <div style={{ position: "absolute", inset: 0, borderRadius: "50%", border: "2px solid rgba(47,143,78,0.5)", animation: "pulse-ring 2s ease-out infinite" }} />
                  <div style={{ position: "absolute", inset: 0, borderRadius: "50%", border: "1px solid rgba(47,143,78,0.25)", animation: "pulse-ring2 2s ease-out infinite 0.4s" }} />
                </>}
                <div style={{ position: "absolute", inset: 0, borderRadius: "50%", background: scanning ? "rgba(47,143,78,0.12)" : "rgba(255,255,255,0.04)", border: `2px solid ${scanning ? "rgba(47,143,78,0.5)" : "rgba(255,255,255,0.08)"}`, display: "flex", alignItems: "center", justifyContent: "center", transition: "all 0.4s", backdropFilter: "blur(8px)" }}>
                  <svg width="44" height="44" viewBox="0 0 24 24" fill="none" stroke={scanning ? "#2F8F4E" : "rgba(232,245,238,0.2)"} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" style={{ transition: "stroke 0.4s" }}>
                    <path d="M2 7V5a2 2 0 0 1 2-2h2" /><path d="M2 17v2a2 2 0 0 0 2 2h2" /><path d="M22 7V5a2 2 0 0 0-2-2h-2" /><path d="M22 17v2a2 2 0 0 1-2 2h-2" />
                    <rect x="7" y="7" width="10" height="10" rx="1" />
                  </svg>
                </div>
              </div>

              <div style={{ fontSize: 12, fontWeight: 600, letterSpacing: ".08em", color: scanning ? "#4FBF7E" : "rgba(232,245,238,0.3)", marginBottom: 20, transition: "color 0.4s" }}>
                {scanning ? "Tempelkan e-KTP ke belakang HP..." : "NFC Scanner Belum Aktif"}
              </div>

              <button onClick={scanning ? stopNFC : startNFC} className="ronda-btn"
                style={{ width: "100%", maxWidth: 280, padding: "14px 24px", borderRadius: 14, border: scanning ? "1px solid rgba(220,50,50,0.35)" : "none", background: scanning ? "rgba(220,50,50,0.1)" : "linear-gradient(135deg,#1A6B35,#2F8F4E)", color: scanning ? "#FF7A7A" : "#fff", fontSize: 13, fontWeight: 700, letterSpacing: ".06em", fontFamily: "inherit", boxShadow: scanning ? "none" : "0 8px 32px rgba(47,143,78,0.25)" }}>
                {scanning ? "Stop Scanning" : "Aktifkan NFC e-KTP"}
              </button>

              {!scanning && <div style={{ marginTop: 12, fontSize: 10, color: "rgba(232,245,238,0.2)", letterSpacing: ".04em" }}>Chrome Android · NFC harus aktif</div>}
            </div>

            {/* Last Scan Success Card */}
            {lastScan && (
              <div style={{ background: "rgba(47,143,78,0.08)", border: "1px solid rgba(47,143,78,0.25)", borderRadius: 16, padding: "18px 22px", display: "flex", alignItems: "center", gap: 16, animation: "slide-up 0.4s ease" }}>
                <div style={{ width: 44, height: 44, borderRadius: "50%", background: "rgba(47,143,78,0.2)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                  <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#4FBF7E" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12" /></svg>
                </div>
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: 15, fontWeight: 800, color: "#E8F5EE" }}>{lastScan.nama}</div>
                  <div style={{ fontSize: 11, color: "rgba(47,143,78,0.6)", fontWeight: 600, marginTop: 1 }}>Berhasil absen · {lastScan.waktu}</div>
                </div>
                <div style={{ fontSize: 16, fontWeight: 800, color: "#2F8F4E" }}>+{lastScan.poin}</div>
              </div>
            )}

            {/* Manual Input */}
            <div style={{ background: "rgba(255,255,255,0.025)", border: "1px solid rgba(255,255,255,0.06)", borderRadius: 16, padding: "18px" }}>
              <div style={{ fontSize: 9, fontWeight: 700, letterSpacing: ".2em", color: "rgba(232,245,238,0.25)", marginBottom: 12 }}>ABSEN MANUAL</div>
              <select value={manualKK} onChange={e => setManualKK(e.target.value)}
                style={{ width: "100%", padding: "12px 14px", borderRadius: 10, border: "1px solid rgba(47,143,78,0.2)", fontSize: 13, color: manualKK ? "#E8F5EE" : "rgba(232,245,238,0.3)", outline: "none", fontFamily: "inherit", fontWeight: 500, marginBottom: 10, boxSizing: "border-box" as const }}>
                <option value="">— Pilih nama warga —</option>
                {kkList.map(k => <option key={k.id} value={k.id}>{k.kepala_keluarga} (RT {k.rt})</option>)}
              </select>
              <button onClick={() => { if (manualKK) { catatAbsensi(manualKK, "manual"); setManualKK(""); } }} className="ronda-btn"
                style={{ width: "100%", padding: "12px", borderRadius: 10, border: "none", background: manualKK ? "rgba(47,143,78,0.9)" : "rgba(47,143,78,0.08)", color: manualKK ? "#fff" : "rgba(47,143,78,0.25)", fontSize: 13, fontWeight: 700, fontFamily: "inherit", boxSizing: "border-box" as const, transition: "all 0.25s" }}>
                Catat Kehadiran
              </button>
            </div>
          </div>

          {/* ===== RIGHT: Attendance List ===== */}
          <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
            <div style={{ background: "rgba(255,255,255,0.025)", border: "1px solid rgba(255,255,255,0.06)", borderRadius: 20, overflow: "hidden", flex: 1 }}>
              <div style={{ padding: "16px 20px", borderBottom: "1px solid rgba(255,255,255,0.05)", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: ".12em", color: "rgba(232,245,238,0.4)" }}>SUDAH HADIR</div>
                {hadir.length > 0 && (
                  <div style={{ fontSize: 12, fontWeight: 800, color: "#2F8F4E", background: "rgba(47,143,78,0.12)", padding: "3px 10px", borderRadius: 100 }}>{hadir.length}</div>
                )}
              </div>

              {hadir.length === 0 ? (
                <div style={{ padding: "60px 24px", textAlign: "center" }}>
                  <div style={{ fontSize: 32, marginBottom: 12, opacity: 0.15 }}>🌙</div>
                  <div style={{ fontSize: 12, color: "rgba(232,245,238,0.2)", fontWeight: 500 }}>Belum ada yang absen</div>
                </div>
              ) : (
                <div style={{ overflowY: "auto", maxHeight: "calc(100vh - 280px)" }}>
                  {hadir.map((a, i) => (
                    <div key={a.id} style={{ display: "flex", alignItems: "center", gap: 14, padding: "13px 20px", borderBottom: i < hadir.length - 1 ? "1px solid rgba(255,255,255,0.04)" : "none", animation: "fade-in 0.3s ease" }}>
                      <div style={{ width: 36, height: 36, borderRadius: "50%", background: "rgba(47,143,78,0.1)", border: "1px solid rgba(47,143,78,0.15)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0, fontSize: 13, fontWeight: 800, color: "#4FBF7E" }}>
                        {(i + 1).toString().padStart(2, "0")}
                      </div>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ fontSize: 14, fontWeight: 700, color: "#E8F5EE", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{a.nama}</div>
                        <div style={{ fontSize: 10, color: "rgba(232,245,238,0.3)", fontWeight: 500, marginTop: 1 }}>
                          {a.metode === "nfc" ? "e-KTP" : "Manual"} · {new Date(a.waktu_tap).toLocaleTimeString("id-ID", { hour: "2-digit", minute: "2-digit" })}
                        </div>
                      </div>
                      <div style={{ fontSize: 12, fontWeight: 800, color: "#2F8F4E", flexShrink: 0 }}>+{POIN_RONDA}</div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div style={{ textAlign: "center", fontSize: 9, color: "rgba(232,245,238,0.12)", letterSpacing: ".18em", fontWeight: 500, paddingBottom: 4 }}>
              KIOSK ABSENSI · DATA AMAN DI SERVER
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}
