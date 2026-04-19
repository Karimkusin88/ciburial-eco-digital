"use client";
import { useState, useEffect, useRef } from "react";
import { supabase, isSupabaseReady } from "@/lib/supabase";

// ─── TYPES ───────────────────────────────────────────────────────────────────
interface Jadwal { id:string; tanggal:string; rt:string; jam_mulai:string; jam_selesai:string; }
interface Absensi { id:string; jadwal_id:string; kk_id:string; nama:string; waktu_tap:string; metode:string; }

const POIN_RONDA = 30;
const emptyJadwal = { tanggal:new Date().toISOString().split("T")[0], rt:"01", jam_mulai:"21:00", jam_selesai:"04:00" };

// ─── RADAR ANIMATION ─────────────────────────────────────────────────────────
function RadarPing({ active }:{ active:boolean }) {
  return (
    <div style={{ position:"relative", width:120, height:120, margin:"0 auto" }}>
      {/* Rings */}
      {[1,2,3].map(i => (
        <div key={i} style={{
          position:"absolute", inset:0, borderRadius:"50%",
          border:`1px solid rgba(74,222,128,${active?0.15:0.06})`,
          transform:`scale(${i*0.33})`, transformOrigin:"center",
        }}/>
      ))}
      {/* Sweep */}
      {active && (
        <div style={{
          position:"absolute", inset:0, borderRadius:"50%",
          background:"conic-gradient(from 0deg, transparent 270deg, rgba(74,222,128,0.3) 360deg)",
          animation:"sweep 2s linear infinite",
        }}/>
      )}
      {/* Center dot */}
      <div style={{
        position:"absolute", top:"50%", left:"50%",
        transform:"translate(-50%,-50%)",
        width:active?20:14, height:active?20:14,
        borderRadius:"50%",
        background:active?"#4ade80":"rgba(74,222,128,0.3)",
        boxShadow:active?"0 0 20px #4ade80, 0 0 40px rgba(74,222,128,0.4)":"none",
        transition:"all 0.3s",
      }}/>
      {/* Crosshair */}
      <div style={{ position:"absolute", inset:0, display:"flex", alignItems:"center", justifyContent:"center" }}>
        <div style={{ position:"absolute", width:"100%", height:1, background:`rgba(74,222,128,${active?0.2:0.08})` }}/>
        <div style={{ position:"absolute", width:1, height:"100%", background:`rgba(74,222,128,${active?0.2:0.08})` }}/>
      </div>
      {/* Pulse ring */}
      {active && (
        <div style={{
          position:"absolute", inset:0, borderRadius:"50%",
          border:"2px solid rgba(74,222,128,0.6)",
          animation:"ping 1.5s ease-out infinite",
        }}/>
      )}
    </div>
  );
}

// ─── STATUS BADGE ─────────────────────────────────────────────────────────────
function StatusBadge({ label, color, pulse }:{ label:string; color:string; pulse?:boolean }) {
  return (
    <div style={{ display:"inline-flex", alignItems:"center", gap:6, padding:"4px 12px", borderRadius:20, border:`1px solid ${color}40`, background:`${color}10` }}>
      <div style={{ width:6, height:6, borderRadius:"50%", background:color, boxShadow:`0 0 6px ${color}`, animation:pulse?"pulse-dot 1s infinite":"none" }}/>
      <span style={{ fontSize:11, fontWeight:700, color, letterSpacing:"0.08em", textTransform:"uppercase" }}>{label}</span>
    </div>
  );
}

// ─── MAIN ─────────────────────────────────────────────────────────────────────
export default function AdminRondaPage() {
  const [jadwal, setJadwal] = useState<Jadwal[]>([]);
  const [absensi, setAbsensi] = useState<Absensi[]>([]);
  const [kkList, setKkList] = useState<any[]>([]);
  const [anggotaList, setAnggotaList] = useState<any[]>([]);
  const [formJadwal, setFormJadwal] = useState(emptyJadwal);
  const [activeJadwal, setActiveJadwal] = useState<string|null>(null);
  const [tab, setTab] = useState<"monitor"|"jadwal"|"scan">("monitor");
  const [scanning, setScanning] = useState(false);
  const [lastScan, setLastScan] = useState<{nama:string;poin:number;waktu:string}|null>(null);
  const [manualKK, setManualKK] = useState("");
  const [toast, setToast] = useState({ msg:"", ok:true });
  const [jam, setJam] = useState(new Date());
  const nfcRef = useRef<any>(null);

  useEffect(() => {
    const t = setInterval(() => setJam(new Date()), 1000);
    return () => clearInterval(t);
  }, []);

  function showToast(msg:string, ok=true) { setToast({msg,ok}); setTimeout(()=>setToast({msg:"",ok:true}),4000); }

  async function fetchAll() {
    if (!isSupabaseReady()) return;
    const [j, a, kk, ang] = await Promise.all([
      supabase.from("jadwal_ronda").select("*").order("tanggal",{ascending:false}).limit(10),
      supabase.from("absensi_ronda").select("*").order("waktu_tap",{ascending:false}).limit(50),
      supabase.from("keluarga").select("id,kepala_keluarga,rt,nfc_id,no_wa").order("kepala_keluarga"),
      supabase.from("anggota_kk").select("id,kk_id,nama,nfc_id,saldo_poin").eq("hubungan","kepala"),
    ]);
    if (j.data) setJadwal(j.data as Jadwal[]);
    if (a.data) setAbsensi(a.data as Absensi[]);
    if (kk.data) setKkList(kk.data);
    if (ang.data) setAnggotaList(ang.data);
  }

  useEffect(() => { fetchAll(); }, []);

  async function buatJadwal() {
    const { error } = await supabase.from("jadwal_ronda").insert(formJadwal);
    if (error) showToast(`❌ ${error.message}`, false);
    else { showToast("✅ Jadwal ronda dibuat!"); setFormJadwal(emptyJadwal); fetchAll(); }
  }

  async function catatAbsensi(kkId:string, metode:string) {
    if (!activeJadwal) return showToast("⚠️ Pilih jadwal dulu!", false);
    const kk = kkList.find(k => k.id===kkId || k.nfc_id===kkId.toUpperCase());
    const ang = anggotaList.find(a => a.kk_id===(kk?.id||kkId) || a.nfc_id===kkId.toUpperCase());
    if (!kk && !ang) return showToast("❌ Warga tidak ditemukan!", false);

    const nama = kk?.kepala_keluarga || ang?.nama || "Unknown";
    const realKKId = kk?.id || ang?.kk_id;

    // Anti-spam: cek DB
    const { data:cek } = await supabase.from("absensi_ronda").select("id")
      .eq("jadwal_id", activeJadwal).eq("kk_id", realKKId).limit(1);
    if (cek && cek.length > 0) return showToast(`⚠️ ${nama} sudah tercatat!`, false);

    // Catat absensi
    await supabase.from("absensi_ronda").insert({ jadwal_id:activeJadwal, kk_id:realKKId, nama, metode, status:"hadir" });

    // Tambah poin
    if (ang?.id) {
      await supabase.from("anggota_kk").update({ saldo_poin:(ang.saldo_poin||0)+POIN_RONDA }).eq("id", ang.id);
      await supabase.from("riwayat_poin").insert({ anggota_id:ang.id, kk_id:realKKId, jumlah:POIN_RONDA, jenis:"masuk", sumber:"ronda", keterangan:`Ronda malam — ${new Date().toLocaleDateString("id-ID")}` });
    }

    const waktu = new Date().toLocaleTimeString("id-ID",{hour:"2-digit",minute:"2-digit"});
    setLastScan({ nama, poin:POIN_RONDA, waktu });
    showToast(`✅ ${nama} HADIR! +${POIN_RONDA} poin`);
    fetchAll();
  }

  async function startNFC() {
    if (!("NDEFReader" in window)) return showToast("⚠️ Browser tidak support NFC", false);
    try {
      const ndef = new (window as any).NDEFReader();
      nfcRef.current = ndef;
      await ndef.scan();
      setScanning(true);
      ndef.addEventListener("reading", ({serialNumber}:any) => {
        catatAbsensi(serialNumber.replace(/:/g,"").toUpperCase(), "nfc");
      });
    } catch { showToast("❌ Gagal aktifkan NFC", false); }
  }

  function stopNFC() {
    try { nfcRef.current?.stop?.(); } catch {}
    setScanning(false);
  }

  const activeAbsensi = absensi.filter(a => a.jadwal_id === activeJadwal);
  const activeJadwalData = jadwal.find(j => j.id === activeJadwal);
  const hariIni = new Date().toISOString().split("T")[0];
  const jadwalHariIni = jadwal.filter(j => j.tanggal === hariIni);

  return (
    <div style={{ minHeight:"100vh", background:"#030a0f", fontFamily:"'IBM Plex Mono','Courier New',monospace", color:"#e2e8f0", position:"relative", overflow:"hidden" }}>

      {/* Background grid pattern */}
      <div style={{ position:"fixed", inset:0, backgroundImage:"linear-gradient(rgba(74,222,128,0.03) 1px,transparent 1px),linear-gradient(90deg,rgba(74,222,128,0.03) 1px,transparent 1px)", backgroundSize:"40px 40px", pointerEvents:"none", zIndex:0 }}/>

      {/* Ambient glow */}
      <div style={{ position:"fixed", top:"-20%", left:"50%", transform:"translateX(-50%)", width:600, height:300, background:"radial-gradient(ellipse,rgba(74,222,128,0.06) 0%,transparent 70%)", pointerEvents:"none", zIndex:0 }}/>

      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=IBM+Plex+Mono:wght@300;400;500;600;700&family=Rajdhani:wght@400;500;600;700&display=swap');
        @keyframes sweep { from{transform:rotate(0deg)} to{transform:rotate(360deg)} }
        @keyframes ping { 0%{transform:scale(1);opacity:1} 100%{transform:scale(1.8);opacity:0} }
        @keyframes pulse-dot { 0%,100%{opacity:1} 50%{opacity:0.3} }
        @keyframes slide-in { from{transform:translateX(100%);opacity:0} to{transform:translateX(0);opacity:1} }
        @keyframes blink { 0%,100%{opacity:1} 50%{opacity:0} }
        @keyframes scanline { 0%{top:0} 100%{top:100%} }
        .ronda-tab { transition:all 0.2s; }
        .ronda-tab:hover { background:rgba(74,222,128,0.08) !important; }
        .ronda-card { transition:all 0.25s; border:1px solid rgba(74,222,128,0.1); }
        .ronda-card:hover { border-color:rgba(74,222,128,0.3) !important; transform:translateY(-1px); }
        .scan-btn { transition:all 0.2s; }
        .scan-btn:hover { filter:brightness(1.1); }
        ::-webkit-scrollbar { width:4px; }
        ::-webkit-scrollbar-thumb { background:rgba(74,222,128,0.3); border-radius:2px; }
      `}</style>

      {/* Toast */}
      {toast.msg && (
        <div style={{ position:"fixed", top:20, left:"50%", transform:"translateX(-50%)", background:toast.ok?"rgba(74,222,128,0.15)":"rgba(239,68,68,0.15)", backdropFilter:"blur(20px)", color:toast.ok?"#4ade80":"#f87171", padding:"10px 20px", borderRadius:10, zIndex:999, fontSize:12, border:`1px solid ${toast.ok?"rgba(74,222,128,0.4)":"rgba(239,68,68,0.4)"}`, letterSpacing:"0.05em", fontWeight:600, animation:"slide-in 0.3s ease", maxWidth:"85vw", textAlign:"center" }}>
          {toast.msg}
        </div>
      )}

      {/* Header */}
      <header style={{ position:"sticky", top:0, zIndex:50, background:"rgba(3,10,15,0.95)", backdropFilter:"blur(20px)", borderBottom:"1px solid rgba(74,222,128,0.15)", padding:"0 20px", height:60, display:"flex", alignItems:"center", justifyContent:"space-between" }}>
        <div style={{ display:"flex", alignItems:"center", gap:16 }}>
          <a href="/admin" style={{ color:"rgba(74,222,128,0.5)", textDecoration:"none", fontSize:11, letterSpacing:"0.1em", textTransform:"uppercase" }}>← ADMIN</a>
          <div style={{ width:1, height:20, background:"rgba(74,222,128,0.2)" }}/>
          <div>
            <div style={{ fontFamily:"'Rajdhani',sans-serif", fontWeight:700, fontSize:18, color:"#4ade80", letterSpacing:"0.1em", lineHeight:1 }}>
              🔦 RONDA DIGITAL
            </div>
            <div style={{ fontSize:9, color:"rgba(74,222,128,0.5)", letterSpacing:"0.15em", marginTop:1 }}>
              CIBURIAL NIGHT PATROL SYSTEM
            </div>
          </div>
        </div>

        {/* Jam digital */}
        <div style={{ textAlign:"right" }}>
          <div style={{ fontFamily:"'IBM Plex Mono',monospace", fontSize:20, fontWeight:700, color:"#4ade80", letterSpacing:"0.1em", lineHeight:1 }}>
            {jam.toLocaleTimeString("id-ID",{hour:"2-digit",minute:"2-digit",second:"2-digit"})}
          </div>
          <div style={{ fontSize:9, color:"rgba(74,222,128,0.5)", letterSpacing:"0.1em", marginTop:2 }}>
            {jam.toLocaleDateString("id-ID",{weekday:"short",day:"numeric",month:"short",year:"numeric"}).toUpperCase()}
          </div>
        </div>
      </header>

      <div style={{ maxWidth:960, margin:"0 auto", padding:"20px 16px", position:"relative", zIndex:1 }}>

        {/* Status bar */}
        <div style={{ display:"flex", gap:10, marginBottom:20, flexWrap:"wrap", alignItems:"center" }}>
          <StatusBadge label="SISTEM AKTIF" color="#4ade80" pulse/>
          {scanning && <StatusBadge label="NFC SCANNING" color="#60a5fa" pulse/>}
          {jadwalHariIni.length > 0 && <StatusBadge label={`RONDA RT ${jadwalHariIni[0].rt} MALAM INI`} color="#fbbf24"/>}
          <div style={{ marginLeft:"auto", fontSize:10, color:"rgba(74,222,128,0.4)", letterSpacing:"0.08em" }}>
            {absensi.length} REKAMAN · {kkList.length} WARGA TERDAFTAR
          </div>
        </div>

        {/* Tab nav */}
        <div style={{ display:"flex", gap:2, marginBottom:20, background:"rgba(74,222,128,0.05)", borderRadius:10, padding:4, border:"1px solid rgba(74,222,128,0.1)" }}>
          {([["monitor","📡 MONITOR"],["scan","🔦 SCAN NFC / e-KTP"],["jadwal","📋 JADWAL"]] as const).map(([t,l]) => (
            <button key={t} onClick={()=>setTab(t)} className="ronda-tab"
              style={{ flex:1, padding:"9px 8px", borderRadius:8, fontSize:11, fontWeight:600, border:"none", cursor:"pointer", letterSpacing:"0.08em", fontFamily:"'IBM Plex Mono',monospace", background:tab===t?"rgba(74,222,128,0.15)":"transparent", color:tab===t?"#4ade80":"rgba(74,222,128,0.4)", boxShadow:tab===t?"inset 0 0 20px rgba(74,222,128,0.05)":"none" }}>
              {l}
            </button>
          ))}
        </div>

        {/* ── MONITOR TAB ── */}
        {tab==="monitor" && (
          <div>
            {/* Stats grid */}
            <div style={{ display:"grid", gridTemplateColumns:"repeat(auto-fit,minmax(160px,1fr))", gap:12, marginBottom:20 }}>
              {[
                { icon:"🏠", val:kkList.length, label:"WARGA TERDAFTAR", color:"#4ade80" },
                { icon:"✅", val:absensi.filter(a=>jadwal.find(j=>j.tanggal===hariIni)?.id===a.jadwal_id).length, label:"HADIR MALAM INI", color:"#60a5fa" },
                { icon:"🏆", val:`${absensi.length*POIN_RONDA}`, label:"TOTAL POIN RONDA", color:"#fbbf24" },
                { icon:"📅", val:jadwal.length, label:"TOTAL JADWAL", color:"#a78bfa" },
              ].map(s => (
                <div key={s.label} className="ronda-card" style={{ background:"rgba(3,15,10,0.8)", borderRadius:14, padding:"16px 14px" }}>
                  <div style={{ fontSize:22, marginBottom:8 }}>{s.icon}</div>
                  <div style={{ fontFamily:"'Rajdhani',sans-serif", fontSize:28, fontWeight:700, color:s.color, lineHeight:1 }}>{s.val}</div>
                  <div style={{ fontSize:9, color:"rgba(255,255,255,0.3)", letterSpacing:"0.12em", marginTop:4 }}>{s.label}</div>
                </div>
              ))}
            </div>

            {/* Jadwal terbaru */}
            <div style={{ background:"rgba(3,15,10,0.8)", borderRadius:16, border:"1px solid rgba(74,222,128,0.1)", overflow:"hidden" }}>
              <div style={{ padding:"12px 18px", borderBottom:"1px solid rgba(74,222,128,0.08)", display:"flex", justifyContent:"space-between", alignItems:"center" }}>
                <span style={{ fontSize:10, fontWeight:700, color:"rgba(74,222,128,0.6)", letterSpacing:"0.15em" }}>RIWAYAT JADWAL RONDA</span>
                <button onClick={()=>setTab("jadwal")} style={{ fontSize:10, color:"rgba(74,222,128,0.4)", background:"none", border:"none", cursor:"pointer", letterSpacing:"0.08em" }}>+ BUAT JADWAL →</button>
              </div>
              {jadwal.length === 0 ? (
                <div style={{ padding:40, textAlign:"center", color:"rgba(74,222,128,0.2)", fontSize:12 }}>
                  <div style={{ fontSize:32, marginBottom:8 }}>📋</div>
                  BELUM ADA JADWAL RONDA
                </div>
              ) : jadwal.map((j, i) => {
                const jmlHadir = absensi.filter(a => a.jadwal_id === j.id).length;
                const isActive = activeJadwal === j.id;
                return (
                  <div key={j.id} onClick={() => { setActiveJadwal(j.id); setTab("scan"); }}
                    style={{ padding:"14px 18px", borderBottom:i<jadwal.length-1?"1px solid rgba(74,222,128,0.06)":"none", cursor:"pointer", background:isActive?"rgba(74,222,128,0.06)":"transparent", display:"flex", alignItems:"center", gap:14, transition:"background 0.2s" }}>
                    <div style={{ width:40, height:40, borderRadius:10, background:"rgba(74,222,128,0.08)", border:"1px solid rgba(74,222,128,0.15)", display:"flex", alignItems:"center", justifyContent:"center", fontSize:18, flexShrink:0 }}>🔦</div>
                    <div style={{ flex:1 }}>
                      <div style={{ fontFamily:"'Rajdhani',sans-serif", fontWeight:600, fontSize:15, color:"#e2e8f0" }}>
                        RT {j.rt} — {new Date(j.tanggal).toLocaleDateString("id-ID",{weekday:"long",day:"numeric",month:"long"})}
                      </div>
                      <div style={{ fontSize:11, color:"rgba(255,255,255,0.3)", marginTop:2 }}>
                        ⏰ {j.jam_mulai} - {j.jam_selesai} · ✅ {jmlHadir} hadir · 🏆 {jmlHadir*POIN_RONDA} poin
                      </div>
                    </div>
                    <div style={{ fontSize:11, color:"rgba(74,222,128,0.5)", letterSpacing:"0.08em" }}>SCAN →</div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* ── SCAN TAB ── */}
        {tab==="scan" && (
          <div>
            {/* Pilih jadwal */}
            <div style={{ marginBottom:16 }}>
              <label style={{ fontSize:10, fontWeight:700, color:"rgba(74,222,128,0.5)", letterSpacing:"0.15em", display:"block", marginBottom:6 }}>JADWAL AKTIF</label>
              <select value={activeJadwal||""} onChange={e=>setActiveJadwal(e.target.value)}
                style={{ width:"100%", padding:"10px 14px", borderRadius:10, border:"1px solid rgba(74,222,128,0.2)", fontSize:12, background:"rgba(3,15,10,0.9)", color:"#4ade80", outline:"none", fontFamily:"'IBM Plex Mono',monospace" }}>
                <option value="">-- PILIH JADWAL RONDA --</option>
                {jadwal.map(j => <option key={j.id} value={j.id}>RT {j.rt} — {new Date(j.tanggal).toLocaleDateString("id-ID",{day:"numeric",month:"long"})} ({absensi.filter(a=>a.jadwal_id===j.id).length} hadir)</option>)}
              </select>
            </div>

            <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:16 }}>
              {/* NFC Scanner panel */}
              <div style={{ background:"rgba(3,15,10,0.9)", borderRadius:18, padding:24, border:`1px solid ${scanning?"rgba(74,222,128,0.4)":"rgba(74,222,128,0.1)"}`, boxShadow:scanning?"0 0 30px rgba(74,222,128,0.1)":"none", transition:"all 0.3s", textAlign:"center" }}>
                <div style={{ fontSize:10, fontWeight:700, color:"rgba(74,222,128,0.5)", letterSpacing:"0.15em", marginBottom:20 }}>
                  {scanning ? "◉ NFC AKTIF — TEMPELKAN e-KTP / KARTU" : "○ NFC SCANNER"}
                </div>

                <RadarPing active={scanning}/>

                {/* Last scan result */}
                {lastScan && (
                  <div style={{ margin:"20px 0", padding:"12px 16px", background:"rgba(74,222,128,0.08)", border:"1px solid rgba(74,222,128,0.2)", borderRadius:12, animation:"slide-in 0.3s ease" }}>
                    <div style={{ fontFamily:"'Rajdhani',sans-serif", fontWeight:700, fontSize:16, color:"#4ade80" }}>✓ {lastScan.nama}</div>
                    <div style={{ fontSize:11, color:"rgba(74,222,128,0.6)", marginTop:4 }}>+{lastScan.poin} POIN · {lastScan.waktu}</div>
                  </div>
                )}

                <button onClick={scanning?stopNFC:startNFC} className="scan-btn"
                  style={{ width:"100%", marginTop:lastScan?0:20, padding:"13px", borderRadius:12, border:`1px solid ${scanning?"rgba(239,68,68,0.5)":"rgba(74,222,128,0.4)"}`, background:scanning?"rgba(239,68,68,0.1)":"rgba(74,222,128,0.1)", color:scanning?"#f87171":"#4ade80", fontSize:12, fontWeight:700, cursor:"pointer", letterSpacing:"0.1em", fontFamily:"'IBM Plex Mono',monospace" }}>
                  {scanning ? "⏹ STOP SCANNING" : "▶ AKTIFKAN NFC"}
                </button>

                <div style={{ marginTop:12, fontSize:10, color:"rgba(255,255,255,0.2)", lineHeight:1.6, letterSpacing:"0.05em" }}>
                  e-KTP / kartu NFC · Chrome Android<br/>NFC harus aktif di HP
                </div>
              </div>

              {/* Manual + rekap */}
              <div>
                {/* Input manual */}
                <div style={{ background:"rgba(3,15,10,0.9)", borderRadius:14, padding:18, border:"1px solid rgba(74,222,128,0.1)", marginBottom:12 }}>
                  <div style={{ fontSize:10, fontWeight:700, color:"rgba(74,222,128,0.5)", letterSpacing:"0.15em", marginBottom:12 }}>INPUT MANUAL</div>
                  <select value={manualKK} onChange={e=>setManualKK(e.target.value)}
                    style={{ width:"100%", padding:"9px 12px", borderRadius:10, border:"1px solid rgba(74,222,128,0.2)", fontSize:12, background:"rgba(3,15,10,0.9)", color:"#e2e8f0", outline:"none", marginBottom:10, fontFamily:"'IBM Plex Mono',monospace" }}>
                    <option value="">-- Pilih warga --</option>
                    {kkList.map(k => <option key={k.id} value={k.id}>{k.kepala_keluarga} (RT {k.rt})</option>)}
                  </select>
                  <button onClick={()=>{ if(manualKK){ catatAbsensi(manualKK,"manual"); setManualKK(""); } }} className="scan-btn"
                    style={{ width:"100%", padding:"9px", borderRadius:10, border:"1px solid rgba(74,222,128,0.3)", background:"rgba(74,222,128,0.1)", color:"#4ade80", fontSize:11, fontWeight:700, cursor:"pointer", letterSpacing:"0.1em", fontFamily:"'IBM Plex Mono',monospace" }}>
                    ✓ CATAT HADIR
                  </button>
                </div>

                {/* Rekap hadir */}
                <div style={{ background:"rgba(3,15,10,0.9)", borderRadius:14, border:"1px solid rgba(74,222,128,0.1)", overflow:"hidden" }}>
                  <div style={{ padding:"10px 16px", borderBottom:"1px solid rgba(74,222,128,0.08)", display:"flex", justifyContent:"space-between" }}>
                    <span style={{ fontSize:10, fontWeight:700, color:"rgba(74,222,128,0.5)", letterSpacing:"0.15em" }}>REKAP HADIR</span>
                    <span style={{ fontSize:10, color:"rgba(74,222,128,0.4)" }}>{activeAbsensi.length} ORANG</span>
                  </div>
                  <div style={{ maxHeight:240, overflowY:"auto" }}>
                    {activeAbsensi.length === 0 ? (
                      <div style={{ padding:20, textAlign:"center", color:"rgba(74,222,128,0.2)", fontSize:11, letterSpacing:"0.08em" }}>BELUM ADA YANG HADIR</div>
                    ) : activeAbsensi.map((a, i) => (
                      <div key={a.id} style={{ display:"flex", alignItems:"center", gap:10, padding:"9px 16px", borderBottom:i<activeAbsensi.length-1?"1px solid rgba(74,222,128,0.05)":"none" }}>
                        <div style={{ width:6, height:6, borderRadius:"50%", background:"#4ade80", boxShadow:"0 0 6px #4ade80", flexShrink:0 }}/>
                        <div style={{ flex:1 }}>
                          <div style={{ fontSize:13, color:"#e2e8f0", fontWeight:500 }}>{a.nama}</div>
                          <div style={{ fontSize:10, color:"rgba(255,255,255,0.3)" }}>{a.metode==="nfc"?"e-KTP/NFC":"Manual"} · {new Date(a.waktu_tap).toLocaleTimeString("id-ID",{hour:"2-digit",minute:"2-digit"})}</div>
                        </div>
                        <div style={{ fontSize:11, color:"#4ade80", fontWeight:700 }}>+{POIN_RONDA}</div>
                      </div>
                    ))}
                  </div>
                  {activeAbsensi.length > 0 && (
                    <div style={{ padding:"10px 16px", borderTop:"1px solid rgba(74,222,128,0.08)", display:"flex", justifyContent:"space-between" }}>
                      <span style={{ fontSize:10, color:"rgba(74,222,128,0.4)", letterSpacing:"0.08em" }}>TOTAL POIN DIBAGI</span>
                      <span style={{ fontSize:13, color:"#fbbf24", fontWeight:700 }}>{activeAbsensi.length*POIN_RONDA} 🏆</span>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ── JADWAL TAB ── */}
        {tab==="jadwal" && (
          <div style={{ display:"grid", gridTemplateColumns:"1fr 1.5fr", gap:16 }}>
            <div style={{ background:"rgba(3,15,10,0.9)", borderRadius:16, padding:20, border:"1px solid rgba(74,222,128,0.1)" }}>
              <div style={{ fontSize:10, fontWeight:700, color:"rgba(74,222,128,0.5)", letterSpacing:"0.15em", marginBottom:16 }}>BUAT JADWAL RONDA</div>

              {[
                { label:"TANGGAL", key:"tanggal", type:"date" },
                { label:"JAM MULAI", key:"jam_mulai", type:"time" },
                { label:"JAM SELESAI", key:"jam_selesai", type:"time" },
              ].map(f => (
                <div key={f.key} style={{ marginBottom:12 }}>
                  <label style={{ fontSize:10, fontWeight:700, color:"rgba(74,222,128,0.4)", letterSpacing:"0.12em", display:"block", marginBottom:5 }}>{f.label}</label>
                  <input type={f.type} value={(formJadwal as any)[f.key]} onChange={e=>setFormJadwal({...formJadwal,[f.key]:e.target.value})}
                    style={{ width:"100%", padding:"9px 12px", borderRadius:10, border:"1px solid rgba(74,222,128,0.2)", fontSize:13, background:"rgba(0,0,0,0.4)", color:"#4ade80", outline:"none", boxSizing:"border-box", fontFamily:"'IBM Plex Mono',monospace" }}/>
                </div>
              ))}

              <div style={{ marginBottom:16 }}>
                <label style={{ fontSize:10, fontWeight:700, color:"rgba(74,222,128,0.4)", letterSpacing:"0.12em", display:"block", marginBottom:5 }}>RT</label>
                <select value={formJadwal.rt} onChange={e=>setFormJadwal({...formJadwal,rt:e.target.value})}
                  style={{ width:"100%", padding:"9px 12px", borderRadius:10, border:"1px solid rgba(74,222,128,0.2)", fontSize:13, background:"rgba(0,0,0,0.4)", color:"#4ade80", outline:"none", fontFamily:"'IBM Plex Mono',monospace" }}>
                  {["01","02","03","04","05"].map(v => <option key={v} value={v}>RT {v}</option>)}
                </select>
              </div>

              <button onClick={buatJadwal} className="scan-btn"
                style={{ width:"100%", padding:"11px", borderRadius:12, border:"1px solid rgba(74,222,128,0.4)", background:"rgba(74,222,128,0.1)", color:"#4ade80", fontSize:12, fontWeight:700, cursor:"pointer", letterSpacing:"0.1em", fontFamily:"'IBM Plex Mono',monospace" }}>
                + BUAT JADWAL
              </button>

              {/* Info poin */}
              <div style={{ marginTop:16, padding:"10px 14px", background:"rgba(251,191,36,0.06)", border:"1px solid rgba(251,191,36,0.15)", borderRadius:10 }}>
                <div style={{ fontSize:10, color:"rgba(251,191,36,0.7)", letterSpacing:"0.08em" }}>
                  🏆 SETIAP PETUGAS HADIR = <strong style={{color:"#fbbf24"}}>+{POIN_RONDA} POIN</strong>
                </div>
              </div>
            </div>

            {/* List jadwal */}
            <div style={{ background:"rgba(3,15,10,0.9)", borderRadius:16, border:"1px solid rgba(74,222,128,0.1)", overflow:"hidden" }}>
              <div style={{ padding:"12px 18px", borderBottom:"1px solid rgba(74,222,128,0.08)" }}>
                <span style={{ fontSize:10, fontWeight:700, color:"rgba(74,222,128,0.5)", letterSpacing:"0.15em" }}>RIWAYAT JADWAL</span>
              </div>
              {jadwal.length === 0 ? (
                <div style={{ padding:40, textAlign:"center", color:"rgba(74,222,128,0.2)", fontSize:12, letterSpacing:"0.1em" }}>BELUM ADA JADWAL</div>
              ) : jadwal.map((j, i) => {
                const jmlHadir = absensi.filter(a => a.jadwal_id === j.id).length;
                return (
                  <div key={j.id} onClick={() => { setActiveJadwal(j.id); setTab("scan"); }}
                    style={{ padding:"13px 18px", borderBottom:i<jadwal.length-1?"1px solid rgba(74,222,128,0.06)":"none", cursor:"pointer", display:"flex", alignItems:"center", gap:12, transition:"background 0.15s" }}
                    onMouseEnter={e=>(e.currentTarget.style.background="rgba(74,222,128,0.05)")}
                    onMouseLeave={e=>(e.currentTarget.style.background="transparent")}>
                    <div style={{ width:8, height:8, borderRadius:"50%", background:j.tanggal===hariIni?"#4ade80":"rgba(74,222,128,0.2)", boxShadow:j.tanggal===hariIni?"0 0 8px #4ade80":"none", flexShrink:0 }}/>
                    <div style={{ flex:1 }}>
                      <div style={{ fontFamily:"'Rajdhani',sans-serif", fontWeight:600, fontSize:14, color:"#e2e8f0" }}>
                        RT {j.rt} — {new Date(j.tanggal).toLocaleDateString("id-ID",{weekday:"short",day:"numeric",month:"short"})}
                      </div>
                      <div style={{ fontSize:11, color:"rgba(255,255,255,0.25)", marginTop:1 }}>
                        {j.jam_mulai} → {j.jam_selesai} · {jmlHadir} hadir
                      </div>
                    </div>
                    <div style={{ fontSize:12, color:"#fbbf24", fontWeight:700 }}>{jmlHadir*POIN_RONDA}🏆</div>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}