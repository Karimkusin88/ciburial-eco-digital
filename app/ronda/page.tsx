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
    <div style={{
      minHeight: "100vh", height: "100vh",
      background: "#060E09",
      fontFamily: "'Inter', system-ui, sans-serif",
      color: "#E8F5EE",
      display: "flex",
      flexDirection: "column",
      overflow: "hidden",
      position: "relative",
    }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800;900&display=swap');

        /* --- Ambient background blobs --- */
        @keyframes blob-drift {
          0%, 100% { transform: translate(0,0) scale(1); }
          33% { transform: translate(20px,-30px) scale(1.05); }
          66% { transform: translate(-15px,20px) scale(0.97); }
        }

        /* --- NFC Pulse rings --- */
        @keyframes pulse-ring {
          0%  { transform: scale(0.85); opacity: 0.75; }
          100% { transform: scale(1.7);  opacity: 0; }
        }
        @keyframes pulse-ring2 {
          0%  { transform: scale(0.85); opacity: 0.45; }
          100% { transform: scale(2.3);  opacity: 0; }
        }
        @keyframes pulse-ring3 {
          0%  { transform: scale(0.85); opacity: 0.2; }
          100% { transform: scale(3.0);  opacity: 0; }
        }

        /* --- Micro animations --- */
        @keyframes slide-up   { from { transform:translateY(14px); opacity:0 } to { transform:translateY(0); opacity:1 } }
        @keyframes fade-in    { from { opacity:0 } to { opacity:1 } }
        @keyframes blink      { 0%,100%{opacity:1} 50%{opacity:0.15} }
        @keyframes scan-sweep { 0%{top:0%} 100%{top:100%} }
        @keyframes clock-glow { 0%,100%{text-shadow:0 0 60px rgba(47,143,78,0.4)} 50%{text-shadow:0 0 90px rgba(47,143,78,0.7)} }
        @keyframes colon-blink { 0%,100%{opacity:1} 50%{opacity:0.25} }

        .ronda-btn { transition: all 0.22s cubic-bezier(.22,1,.36,1); cursor:pointer; border:none; }
        .ronda-btn:hover  { transform:translateY(-2px); filter:brightness(1.1); }
        .ronda-btn:active { transform:translateY(0) scale(0.97); }

        .glass-card {
          background: rgba(255,255,255,0.028);
          border: 1px solid rgba(255,255,255,0.065);
          backdrop-filter: blur(20px);
          -webkit-backdrop-filter: blur(20px);
          border-radius: 20px;
        }
        .glass-card-green {
          background: rgba(47,143,78,0.055);
          border: 1px solid rgba(47,143,78,0.18);
          backdrop-filter: blur(20px);
          -webkit-backdrop-filter: blur(20px);
          border-radius: 20px;
        }

        select, select option { background:#0A1710 !important; }
        ::-webkit-scrollbar { width:3px; }
        ::-webkit-scrollbar-track { background:transparent; }
        ::-webkit-scrollbar-thumb { background:rgba(47,143,78,0.2); border-radius:2px; }

        /* Responsive two-column */
        .kiosk-grid {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 16px;
          flex: 1;
          overflow: hidden;
          padding: 0 24px 24px;
        }
        @media (max-width: 768px) {
          .kiosk-grid {
            grid-template-columns: 1fr;
            overflow-y: auto;
            padding: 0 16px 16px;
          }
        }

        .col-scroll { overflow-y: auto; display:flex; flex-direction:column; gap:14px; }
      `}</style>

      {/* ── Ambient blobs ── */}
      <div style={{ position:"fixed", inset:0, pointerEvents:"none", zIndex:0 }}>
        <div style={{ position:"absolute", top:"-25%", left:"-15%", width:"65vw", height:"65vw", background:"radial-gradient(ellipse,rgba(47,143,78,0.08) 0%,transparent 68%)", animation:"blob-drift 14s ease-in-out infinite" }} />
        <div style={{ position:"absolute", bottom:"-20%", right:"-15%", width:"50vw", height:"50vw", background:"radial-gradient(ellipse,rgba(47,143,78,0.05) 0%,transparent 68%)", animation:"blob-drift 18s ease-in-out infinite 3s" }} />
        <div style={{ position:"absolute", top:"40%", right:"10%", width:"30vw", height:"30vw", background:"radial-gradient(ellipse,rgba(79,191,126,0.04) 0%,transparent 70%)", animation:"blob-drift 22s ease-in-out infinite 6s" }} />
      </div>

      {/* ── Toast ── */}
      {toast.msg && (
        <div style={{ position:"fixed", top:20, left:"50%", transform:"translateX(-50%)", background: toast.ok ? "rgba(30,100,55,0.95)" : "rgba(160,40,40,0.95)", color:"#fff", padding:"12px 26px", borderRadius:100, zIndex:9999, fontSize:13, fontWeight:600, letterSpacing:".02em", animation:"slide-up 0.3s ease", backdropFilter:"blur(24px)", border:`1px solid ${toast.ok ? "rgba(79,191,126,0.3)" : "rgba(255,100,100,0.3)"}`, maxWidth:"90vw", textAlign:"center", boxShadow:"0 12px 40px rgba(0,0,0,0.5)" }}>
          {toast.msg}
        </div>
      )}

      {/* ══════════════════════════════════════
          TOP BAR — Logo · Clock · Date
      ══════════════════════════════════════ */}
      <header style={{ position:"relative", zIndex:1, padding:"18px 24px 0", display:"flex", alignItems:"center", justifyContent:"space-between", flexShrink:0 }}>
        {/* Brand */}
        <div>
          <div style={{ fontSize:9, fontWeight:700, letterSpacing:".25em", color:"rgba(47,143,78,0.4)", textTransform:"uppercase" }}>Ciburial Eco-Digital</div>
          <div style={{ fontSize:"clamp(18px,3vw,22px)", fontWeight:800, color:"#E8F5EE", letterSpacing:"-.04em", lineHeight:1.1, marginTop:3 }}>
            Ronda<span style={{ color:"#2F8F4E" }}>.</span>
            <span style={{ fontSize:"clamp(10px,1.5vw,12px)", fontWeight:500, color:"rgba(232,245,238,0.3)", marginLeft:8, letterSpacing:".02em" }}>Kiosk Absensi</span>
          </div>
        </div>

        {/* Mega Clock */}
        <div style={{ textAlign:"center", flex:1 }}>
          <div style={{
            fontVariantNumeric:"tabular-nums",
            fontSize:"clamp(44px,9vw,82px)",
            fontWeight:900,
            color:"#2F8F4E",
            lineHeight:1,
            letterSpacing:"-.02em",
            animation:"clock-glow 4s ease-in-out infinite",
          }}>
            {jam.toLocaleTimeString("id-ID", { hour:"2-digit", minute:"2-digit" }).split(":").map((part, i, arr) => (
              <span key={i}>
                {part}
                {i < arr.length - 1 && <span style={{ animation:"colon-blink 1s step-end infinite", display:"inline-block", margin:"0 2px" }}>:</span>}
              </span>
            ))}
          </div>
          <div style={{ fontSize:"clamp(11px,1.5vw,13px)", color:"rgba(232,245,238,0.3)", fontWeight:500, marginTop:4, letterSpacing:".04em" }}>
            {jam.toLocaleDateString("id-ID", { weekday:"long", day:"numeric", month:"long", year:"numeric" })}
          </div>
        </div>

        {/* Status Dot */}
        <div style={{ display:"flex", flexDirection:"column", alignItems:"flex-end", gap:6 }}>
          <div style={{ display:"flex", alignItems:"center", gap:7 }}>
            <div style={{ width:7, height:7, borderRadius:"50%", background:"#2F8F4E", boxShadow:"0 0 8px #2F8F4E", animation:"blink 2.5s infinite" }} />
            <span style={{ fontSize:10, fontWeight:600, color:"rgba(47,143,78,0.55)", letterSpacing:".1em" }}>LIVE</span>
          </div>
          <div style={{ fontSize:10, color:"rgba(232,245,238,0.15)", fontWeight:500 }}>{hadir.length} hadir</div>
        </div>
      </header>

      {/* ══════════════════════════════════════
          ACTIVE SCHEDULE BANNER
      ══════════════════════════════════════ */}
      <div style={{ position:"relative", zIndex:1, padding:"14px 24px 0", flexShrink:0 }}>
        {activeJadwalData ? (
          <div className="glass-card-green" style={{ padding:"12px 18px", display:"flex", alignItems:"center", gap:12, borderRadius:14 }}>
            <div style={{ flexShrink:0 }}>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#4FBF7E" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <rect x="3" y="4" width="18" height="18" rx="2" ry="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/>
              </svg>
            </div>
            <div style={{ flex:1, minWidth:0 }}>
              <div style={{ fontSize:9, fontWeight:700, letterSpacing:".18em", color:"rgba(47,143,78,0.5)", marginBottom:2 }}>JADWAL AKTIF</div>
              <div style={{ fontSize:13, fontWeight:700, color:"#4FBF7E", whiteSpace:"nowrap", overflow:"hidden", textOverflow:"ellipsis" }}>
                RT {activeJadwalData.rt} &nbsp;—&nbsp; {new Date(activeJadwalData.tanggal).toLocaleDateString("id-ID", { weekday:"long", day:"numeric", month:"long" })}
                &nbsp;·&nbsp; {activeJadwalData.jam_mulai}–{activeJadwalData.jam_selesai}
              </div>
            </div>
            {jadwal.length > 1 && (
              <select value={activeJadwal || ""} onChange={e => setActiveJadwal(e.target.value)}
                style={{ padding:"6px 10px", borderRadius:8, border:"1px solid rgba(47,143,78,0.25)", fontSize:11, color:"#4FBF7E", outline:"none", fontFamily:"inherit", fontWeight:600, cursor:"pointer", flexShrink:0 }}>
                {jadwal.map(j => <option key={j.id} value={j.id}>RT {j.rt} · {new Date(j.tanggal).toLocaleDateString("id-ID", { day:"numeric", month:"short" })}</option>)}
              </select>
            )}
          </div>
        ) : (
          <div className="glass-card" style={{ padding:"12px 18px", textAlign:"center", fontSize:12, color:"rgba(232,245,238,0.25)", borderRadius:14 }}>
            Tidak ada jadwal ronda hari ini
          </div>
        )}
      </div>

      {/* ══════════════════════════════════════
          MAIN 2-COLUMN KIOSK GRID
      ══════════════════════════════════════ */}
      <div className="kiosk-grid" style={{ position:"relative", zIndex:1, marginTop:14 }}>

        {/* ── LEFT COLUMN: Scanner + Manual Input ── */}
        <div className="col-scroll">

          {/* NFC Scanner Zone */}
          <div className="glass-card" style={{
            padding:"36px 24px",
            textAlign:"center",
            borderColor: scanning ? "rgba(47,143,78,0.45)" : "rgba(255,255,255,0.065)",
            transition:"border-color 0.5s",
          }}>
            {/* Pulse Rings */}
            <div style={{ position:"relative", width:140, height:140, margin:"0 auto 28px" }}>
              {scanning && <>
                <div style={{ position:"absolute", inset:0, borderRadius:"50%", border:"2px solid rgba(47,143,78,0.6)", animation:"pulse-ring 2.2s ease-out infinite" }} />
                <div style={{ position:"absolute", inset:0, borderRadius:"50%", border:"1px solid rgba(47,143,78,0.3)", animation:"pulse-ring2 2.2s ease-out infinite 0.5s" }} />
                <div style={{ position:"absolute", inset:0, borderRadius:"50%", border:"1px solid rgba(47,143,78,0.15)", animation:"pulse-ring3 2.2s ease-out infinite 1s" }} />
              </>}

              {/* Core circle */}
              <div style={{
                position:"absolute", inset:0, borderRadius:"50%",
                background: scanning ? "rgba(47,143,78,0.15)" : "rgba(255,255,255,0.04)",
                border:`2px solid ${scanning ? "rgba(47,143,78,0.6)" : "rgba(255,255,255,0.1)"}`,
                display:"flex", alignItems:"center", justifyContent:"center",
                transition:"all 0.5s",
                backdropFilter:"blur(12px)",
                boxShadow: scanning ? "0 0 48px rgba(47,143,78,0.2), inset 0 0 24px rgba(47,143,78,0.08)" : "none",
              }}>
                {/* Scan line when active */}
                {scanning && (
                  <div style={{ position:"absolute", inset:12, borderRadius:"50%", overflow:"hidden" }}>
                    <div style={{ position:"absolute", left:0, right:0, height:2, background:"linear-gradient(90deg,transparent,rgba(47,143,78,0.7),transparent)", animation:"scan-sweep 1.8s ease-in-out infinite alternate" }} />
                  </div>
                )}
                <svg width="52" height="52" viewBox="0 0 24 24" fill="none" stroke={scanning ? "#2F8F4E" : "rgba(232,245,238,0.18)"} strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round" style={{ transition:"stroke 0.5s", position:"relative" }}>
                  <path d="M2 7V5a2 2 0 0 1 2-2h2"/><path d="M2 17v2a2 2 0 0 0 2 2h2"/>
                  <path d="M22 7V5a2 2 0 0 0-2-2h-2"/><path d="M22 17v2a2 2 0 0 1-2 2h-2"/>
                  <rect x="7" y="7" width="10" height="10" rx="1.5"/>
                </svg>
              </div>
            </div>

            {/* Status label */}
            <div style={{ fontSize:13, fontWeight:600, letterSpacing:".06em", color: scanning ? "#4FBF7E" : "rgba(232,245,238,0.25)", marginBottom:22, transition:"color 0.4s" }}>
              {scanning ? "Tempelkan e-KTP ke belakang HP..." : "NFC Scanner Belum Aktif"}
            </div>

            {/* CTA Button */}
            <button onClick={scanning ? stopNFC : startNFC} className="ronda-btn"
              style={{
                width:"100%", maxWidth:260, padding:"15px 24px", borderRadius:14,
                background: scanning ? "rgba(200,50,50,0.1)" : "linear-gradient(135deg,#166534,#2F8F4E)",
                color: scanning ? "#FF8A8A" : "#fff",
                border: scanning ? "1px solid rgba(220,50,50,0.35)" : "1px solid rgba(79,191,126,0.2)",
                fontSize:13, fontWeight:700, letterSpacing:".08em", fontFamily:"inherit",
                boxShadow: scanning ? "none" : "0 10px 36px rgba(47,143,78,0.3)",
              }}>
              {scanning ? "⬜ Stop Scanning" : "⬡ Aktifkan NFC e-KTP"}
            </button>

            {!scanning && (
              <div style={{ marginTop:10, fontSize:10, color:"rgba(232,245,238,0.18)", letterSpacing:".04em" }}>
                Chrome Android · NFC harus aktif di pengaturan
              </div>
            )}
          </div>

          {/* Last Scan Success */}
          {lastScan && (
            <div className="glass-card-green" style={{ padding:"18px 20px", display:"flex", alignItems:"center", gap:14, animation:"slide-up 0.35s ease" }}>
              <div style={{ width:44, height:44, borderRadius:"50%", background:"rgba(47,143,78,0.2)", border:"1px solid rgba(47,143,78,0.3)", display:"flex", alignItems:"center", justifyContent:"center", flexShrink:0 }}>
                <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#4FBF7E" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"/></svg>
              </div>
              <div style={{ flex:1, minWidth:0 }}>
                <div style={{ fontSize:15, fontWeight:800, color:"#E8F5EE", whiteSpace:"nowrap", overflow:"hidden", textOverflow:"ellipsis" }}>{lastScan.nama}</div>
                <div style={{ fontSize:11, color:"rgba(79,191,126,0.65)", fontWeight:600, marginTop:2 }}>Berhasil absen · {lastScan.waktu}</div>
              </div>
              <div style={{ backgroundColor:"rgba(47,143,78,0.2)", padding:"6px 12px", borderRadius:100, fontSize:14, fontWeight:900, color:"#4FBF7E", flexShrink:0 }}>+{lastScan.poin}</div>
            </div>
          )}

          {/* Manual Input */}
          <div className="glass-card" style={{ padding:"20px" }}>
            <div style={{ fontSize:9, fontWeight:700, letterSpacing:".22em", color:"rgba(232,245,238,0.22)", marginBottom:14 }}>ABSEN MANUAL</div>
            <select value={manualKK} onChange={e => setManualKK(e.target.value)}
              style={{ width:"100%", padding:"12px 14px", borderRadius:11, border:"1px solid rgba(47,143,78,0.18)", fontSize:13, color: manualKK ? "#E8F5EE" : "rgba(232,245,238,0.28)", outline:"none", fontFamily:"inherit", fontWeight:500, marginBottom:10, boxSizing:"border-box" as const, cursor:"pointer" }}>
              <option value="">— Pilih nama warga —</option>
              {kkList.map(k => <option key={k.id} value={k.id}>{k.kepala_keluarga} (RT {k.rt})</option>)}
            </select>
            <button
              onClick={() => { if (manualKK) { catatAbsensi(manualKK, "manual"); setManualKK(""); } }}
              className="ronda-btn"
              disabled={!manualKK}
              style={{ width:"100%", padding:"13px", borderRadius:11, background: manualKK ? "rgba(47,143,78,0.88)" : "rgba(47,143,78,0.07)", color: manualKK ? "#fff" : "rgba(47,143,78,0.22)", fontSize:13, fontWeight:700, fontFamily:"inherit", boxSizing:"border-box" as const, transition:"all 0.25s", boxShadow: manualKK ? "0 6px 24px rgba(47,143,78,0.25)" : "none" }}>
              Catat Kehadiran
            </button>
          </div>
        </div>

        {/* ── RIGHT COLUMN: Live Attendance Feed ── */}
        <div className="glass-card" style={{ display:"flex", flexDirection:"column", overflow:"hidden" }}>
          {/* Header */}
          <div style={{ padding:"16px 20px", borderBottom:"1px solid rgba(255,255,255,0.05)", display:"flex", alignItems:"center", justifyContent:"space-between", flexShrink:0 }}>
            <div>
              <div style={{ fontSize:10, fontWeight:700, letterSpacing:".18em", color:"rgba(232,245,238,0.35)" }}>SUDAH HADIR</div>
            </div>
            <div style={{ display:"flex", alignItems:"center", gap:8 }}>
              {hadir.length > 0 && (
                <div style={{ fontSize:13, fontWeight:800, color:"#2F8F4E", background:"rgba(47,143,78,0.14)", padding:"4px 12px", borderRadius:100, border:"1px solid rgba(47,143,78,0.2)" }}>
                  {hadir.length} orang
                </div>
              )}
            </div>
          </div>

          {/* List Body */}
          <div style={{ flex:1, overflowY:"auto" }}>
            {hadir.length === 0 ? (
              <div style={{ padding:"56px 24px", textAlign:"center" }}>
                <div style={{ fontSize:40, marginBottom:14, opacity:0.12 }}>🌙</div>
                <div style={{ fontSize:13, color:"rgba(232,245,238,0.22)", fontWeight:500 }}>Belum ada yang absen</div>
                <div style={{ fontSize:11, color:"rgba(232,245,238,0.12)", marginTop:6 }}>Tap e-KTP atau gunakan input manual</div>
              </div>
            ) : (
              hadir.map((a, i) => (
                <div key={a.id} style={{
                  display:"flex", alignItems:"center", gap:14,
                  padding:"13px 20px",
                  borderBottom: i < hadir.length - 1 ? "1px solid rgba(255,255,255,0.04)" : "none",
                  animation:"fade-in 0.3s ease",
                  transition:"background 0.2s",
                }}>
                  {/* Rank badge */}
                  <div style={{ width:34, height:34, borderRadius:"50%", background:"rgba(47,143,78,0.1)", border:"1px solid rgba(47,143,78,0.15)", display:"flex", alignItems:"center", justifyContent:"center", flexShrink:0, fontSize:12, fontWeight:800, color:"#4FBF7E" }}>
                    {(i + 1).toString().padStart(2, "0")}
                  </div>

                  {/* Name & meta */}
                  <div style={{ flex:1, minWidth:0 }}>
                    <div style={{ fontSize:14, fontWeight:700, color:"#E8F5EE", whiteSpace:"nowrap", overflow:"hidden", textOverflow:"ellipsis" }}>{a.nama}</div>
                    <div style={{ display:"flex", alignItems:"center", gap:6, marginTop:2 }}>
                      <span style={{ fontSize:9, fontWeight:700, letterSpacing:".1em", padding:"2px 7px", borderRadius:100, background: a.metode === "nfc" ? "rgba(47,143,78,0.15)" : "rgba(255,255,255,0.07)", color: a.metode === "nfc" ? "#4FBF7E" : "rgba(232,245,238,0.35)", border: a.metode === "nfc" ? "1px solid rgba(47,143,78,0.25)" : "1px solid rgba(255,255,255,0.08)" }}>
                        {a.metode === "nfc" ? "e-KTP" : "Manual"}
                      </span>
                      <span style={{ fontSize:10, color:"rgba(232,245,238,0.28)", fontWeight:500 }}>
                        {new Date(a.waktu_tap).toLocaleTimeString("id-ID", { hour:"2-digit", minute:"2-digit" })}
                      </span>
                    </div>
                  </div>

                  {/* Points */}
                  <div style={{ fontSize:13, fontWeight:900, color:"#2F8F4E", flexShrink:0 }}>+{POIN_RONDA}</div>
                </div>
              ))
            )}
          </div>

          {/* Footer watermark */}
          <div style={{ padding:"12px 20px", borderTop:"1px solid rgba(255,255,255,0.04)", textAlign:"center", flexShrink:0 }}>
            <div style={{ fontSize:9, color:"rgba(232,245,238,0.1)", letterSpacing:".18em", fontWeight:600 }}>
              KIOSK ABSENSI · DATA AMAN DI SERVER
            </div>
          </div>
        </div>

      </div>{/* end kiosk-grid */}
    </div>
  );
}
