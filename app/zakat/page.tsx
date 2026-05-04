"use client";
import { useState, useEffect, useRef } from "react";
import { supabase, isSupabaseReady } from "@/lib/supabase";

const TAHUN_INI = 2026;
const HARGA_BERAS = 15000;
const JATAH_ZAKAT_PER_JIWA = 2.0; 
const JATAH_SANTUNAN_PER_YATIM = 50000;

// ─── COMPONENT: RADAR ANIMATION ──────────────────────────────────────────────
function RadarPing({ active, color }: { active: boolean, color: string }) {
  return (
    <div style={{ position: "relative", width: 160, height: 160, margin: "0 auto" }}>
      {[1, 2, 3].map(i => (
        <div key={i} style={{ 
          position: "absolute", inset: 0, borderRadius: "50%", 
          border: `2px solid ${color}${active ? '60' : '20'}`, 
          transform: `scale(${i * 0.33})`, transformOrigin: "center", 
          animation: active ? `ping ${1.2 + i * 0.4}s infinite cubic-bezier(0, 0, 0.2, 1)` : "none",
          transition: "all 0.5s ease"
        }} />
      ))}
      <div style={{ 
        position: "absolute", top: "50%", left: "50%", transform: "translate(-50%,-50%)", 
        width: active ? 40 : 30, height: active ? 40 : 30, borderRadius: "50%", 
        background: active ? `radial-gradient(circle at 30% 30%, ${color}, #8B6B20)` : "#333", 
        boxShadow: active ? `0 0 40px ${color}80` : "none", 
        transition: "all 0.5s cubic-bezier(0.175, 0.885, 0.32, 1.275)",
        zIndex: 2
      }} />
    </div>
  );
}

// ─── COMPONENT: LIVE CHART ──────────────────────────────────────────────────
function LiveZakatChart({ terkumpul, disalurkan }: { terkumpul: number, disalurkan: number }) {
  const max = Math.max(terkumpul, 1);
  const progress = (disalurkan / max) * 100;
  
  return (
    <div style={{ background: "rgba(255,255,255,0.03)", padding: "20px 24px", borderRadius: 24, border: "1px solid rgba(255,255,255,0.05)", width: "100%" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end", marginBottom: 12 }}>
        <div>
           <div style={{ fontSize: 10, fontWeight: 800, color: "#B8943F", letterSpacing: "0.1em", marginBottom: 4 }}>DISTRIBUSI BERAS</div>
           <div style={{ fontSize: 24, fontWeight: 900 }}>{progress.toFixed(1)}%</div>
        </div>
        <div style={{ textAlign: "right", fontSize: 11, fontWeight: 700, opacity: 0.6 }}>
           {disalurkan.toFixed(0)}kg / {terkumpul.toFixed(0)}kg
        </div>
      </div>
      <div style={{ height: 12, background: "rgba(255,255,255,0.05)", borderRadius: 99, overflow: "hidden", position: "relative" }}>
         <div style={{ 
           height: "100%", width: `${progress}%`, 
           background: "linear-gradient(90deg, #B8943F, #D4AC5A)", 
           borderRadius: 99, transition: "width 1.5s cubic-bezier(0.22, 1, 0.36, 1)" 
         }} />
      </div>
      <div style={{ display: "flex", gap: 16, marginTop: 16 }}>
         <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
            <div style={{ width: 8, height: 8, borderRadius: "50%", background: "#B8943F" }} />
            <span style={{ fontSize: 10, fontWeight: 700, opacity: 0.5 }}>MASUK</span>
         </div>
         <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
            <div style={{ width: 8, height: 8, borderRadius: "50%", background: "rgba(255,255,255,0.2)" }} />
            <span style={{ fontSize: 10, fontWeight: 700, opacity: 0.5 }}>TARGET</span>
         </div>
      </div>
    </div>
  );
}

export default function ZakatKioskPage() {
  const [kkList, setKkList] = useState<any[]>([]);
  const [anggotaList, setAnggotaList] = useState<any[]>([]);
  const [zakatList, setZakatList] = useState<any[]>([]);
  const [pengambilan, setPengambilan] = useState<any[]>([]);
  const [scanning, setScanning] = useState(false);
  const [hasilScan, setHasilScan] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [toast, setToast] = useState({ msg: "", ok: true });
  const [jam, setJam] = useState(new Date());
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
    try {
        const [kk, ang, z, p] = await Promise.all([
          supabase.from("keluarga").select("*"),
          supabase.from("anggota_kk").select("*"),
          supabase.from("zakat_fitrah").select("*").eq("tahun", TAHUN_INI),
          supabase.from("pengambilan_zakat").select("*").eq("tahun", TAHUN_INI)
        ]);
        if (kk.data) setKkList(kk.data);
        if (ang.data) setAnggotaList(ang.data);
        if (z.data) setZakatList(z.data);
        if (p.data) setPengambilan(p.data);
    } catch (e) { console.error(e); }
  }

  useEffect(() => { fetchAll(); }, []);

  async function prosesTap(nfcId: string) {
    const ang = anggotaList.find(a => a.nfc_id === nfcId);
    const kk = kkList.find(k => k.id === (ang?.kk_id || "") || k.nfc_id === nfcId);
    if (!kk) return showToast("❌ Kartu Tidak Terdata!", false);

    const jiwaKeluarga = anggotaList.filter(a => a.kk_id === kk.id).length || 1;
    const yatimKeluarga = anggotaList.filter(a => a.kk_id === kk.id && a.is_yatim);
    const dataSetor = zakatList.find(z => z.kk_id === kk.id);
    const sudahAmbilBeras = pengambilan.find(p => p.kk_id === kk.id && p.tipe === 'zakat_beras');
    const sudahAmbilUang = pengambilan.find(p => p.kk_id === kk.id && p.tipe === 'santunan_uang');

    setHasilScan({
      id: kk.id, kepala: kk.kepala_keluarga, rt: kk.rt, jiwa: jiwaKeluarga,
      yatimCount: yatimKeluarga.length, isMustahiq: kk.golongan_zakat === "mustahiq",
      statusBayar: dataSetor || null, sudahAmbilBeras, sudahAmbilUang,
      totalJatahBeras: jiwaKeluarga * JATAH_ZAKAT_PER_JIWA,
      totalSantunanUang: yatimKeluarga.length * JATAH_SANTUNAN_PER_YATIM
    });
  }

  async function konfirmasiAmil(tipe: 'zakat_beras' | 'santunan_uang', jumlah: number) {
    if (!hasilScan) return;
    setLoading(true);
    try {
        const { error } = await supabase.from("pengambilan_zakat").insert({ kk_id: hasilScan.id, tahun: TAHUN_INI, tipe, jumlah });
        if (error) showToast("❌ Gagal: " + error.message, false);
        else { showToast("✅ Berhasil Diserahkan!"); await fetchAll(); setHasilScan(null); }
    } catch (e: any) { showToast("❌ Error: " + e.message, false); }
    setLoading(false);
  }

  async function startNFC() {
    if (!("NDEFReader" in window)) return showToast("Gunakan Chrome Android", false);
    try {
      const ndef = new (window as any).NDEFReader();
      nfcRef.current = ndef;
      await ndef.scan();
      setScanning(true);
      setHasilScan(null);
      ndef.addEventListener("reading", ({ serialNumber }: any) => { prosesTap(serialNumber.replace(/:/g, "").toUpperCase()); });
    } catch { showToast("NFC Error", false); }
  }

  const totalTerkumpulBeras = zakatList.filter(z=>z.jenis==='beras').reduce((s,z)=>s+Number(z.nominal_kg),0);
  const totalDisalurkanBeras = pengambilan.filter(p=>p.tipe==='zakat_beras').reduce((s,p)=>s+Number(p.jumlah),0);
  const totalInfaq = zakatList.reduce((s,z)=>s+Number(z.infaq_uang||0),0);

  return (
    <div style={{ minHeight: "100vh", background: "#060A0D", color: "#FAF8F3", fontFamily: "sans-serif", display: "flex", flexDirection: "column", position: "relative", overflow: "hidden" }}>
      <style>{` @keyframes ping { 75%, 100% { transform: scale(3.5); opacity: 0; } } @keyframes slideIn { from { transform: translateY(30px); opacity: 0; } to { transform: translateY(0); opacity: 1; } } .heroic-card { background: rgba(255,255,255,0.03); backdrop-filter: blur(16px); border: 1px solid rgba(184,148,63,0.15); border-radius: 32px; } `}</style>

      {toast.msg && (
        <div style={{ position: "fixed", top: 32, left: "50%", transform: "translateX(-50%)", background: toast.ok ? "#2F8F4E" : "#8B2020", color: "white", padding: "16px 32px", borderRadius: 99, zIndex: 1000, fontWeight: 800, boxShadow: "0 10px 40px rgba(0,0,0,0.5)", animation: "slideIn 0.3s ease-out" }}>{toast.msg}</div>
      )}

      {/* HEADER */}
      <header style={{ padding: "24px 40px", display: "flex", justifyContent: "space-between", alignItems: "center", borderBottom: "1px solid rgba(255,255,255,0.05)", zIndex: 10 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 20 }}>
          <div style={{ width: 56, height: 56, borderRadius: 16, background: "linear-gradient(135deg, #B8943F, #D4AC5A)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 32 }}>🕌</div>
          <div>
            <div style={{ fontSize: 11, color: "#B8943F", fontWeight: 900, letterSpacing: "0.25em" }}>CIBURIAL DIGITAL HUB</div>
            <div style={{ fontSize: 22, fontWeight: 900 }}>Kiosk Zakat Digital</div>
          </div>
        </div>
        <div style={{ textAlign: "right" }}>
          <div style={{ fontSize: 24, fontWeight: 900 }}>{jam.toLocaleTimeString("id-ID", { hour: "2-digit", minute: "2-digit" })}</div>
          <div style={{ fontSize: 12, color: "rgba(250,248,243,0.4)", fontWeight: 700 }}>{jam.toLocaleDateString("id-ID", { weekday: 'long', day: 'numeric', month: 'short' })}</div>
        </div>
      </header>

      <main style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center", padding: "40px", zIndex: 10 }}>
        <div style={{ width: "100%", maxWidth: 850 }}>
          {!hasilScan ? (
            <div style={{ display: "flex", gap: 32, flexWrap: "wrap", alignItems: "center" }}>
               {/* LEFT: SCANNER */}
               <div className="heroic-card" style={{ flex: "1 1 350px", padding: "60px 40px", textAlign: "center" }}>
                  {/* NFC Circle — seragam Learning Hub & Ronda */}
                  <div style={{ position: "relative", width: 140, height: 140, margin: "0 auto 20px" }}>
                    {scanning && <>
                      <div style={{ position: "absolute", inset: 0, borderRadius: "50%", border: "2px solid rgba(184,148,63,0.5)", animation: "nfc-pulse-z 2.2s ease-out infinite" }} />
                      <div style={{ position: "absolute", inset: 0, borderRadius: "50%", border: "1px solid rgba(184,148,63,0.25)", animation: "nfc-pulse-z 2.2s ease-out infinite 0.5s" }} />
                      <div style={{ position: "absolute", inset: 0, borderRadius: "50%", border: "1px solid rgba(184,148,63,0.12)", animation: "nfc-pulse-z 2.2s ease-out infinite 1s" }} />
                    </>}
                    <div style={{
                      position: "absolute", inset: 0, borderRadius: "50%",
                      background: scanning ? "rgba(184,148,63,0.12)" : "rgba(255,255,255,0.04)",
                      border: `2px solid ${scanning ? "rgba(184,148,63,0.7)" : "rgba(184,148,63,0.25)"}`,
                      display: "flex", alignItems: "center", justifyContent: "center",
                      transition: "all 0.5s",
                      backdropFilter: "blur(12px)",
                      boxShadow: scanning ? "0 0 40px rgba(184,148,63,0.25)" : "none",
                    }}>
                      <svg width="52" height="52" viewBox="0 0 24 24" fill="none" stroke={scanning ? "#B8943F" : "rgba(184,148,63,0.4)"} strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round" style={{ transition: "stroke 0.5s" }}>
                        <path d="M2 7V5a2 2 0 0 1 2-2h2"/><path d="M2 17v2a2 2 0 0 0 2 2h2"/>
                        <path d="M22 7V5a2 2 0 0 0-2-2h-2"/><path d="M22 17v2a2 2 0 0 1-2 2h-2"/>
                        <rect x="7" y="7" width="10" height="10" rx="1.5"/>
                      </svg>
                    </div>
                  </div>
                  <h2 style={{ marginTop: 8, fontSize: 20, fontWeight: 800, color: scanning ? "#D4AC5A" : "#FAF8F3" }}>
                    {scanning ? "Tempelkan e-KTP ke HP..." : "Kiosk Standby"}
                  </h2>
                  <div style={{ fontSize: 12, color: "rgba(250,248,243,0.35)", marginBottom: 24, marginTop: 4 }}>
                    {scanning ? "Chrome Android · NFC harus aktif" : "Tap NFC e-KTP untuk mulai"}
                  </div>
                  <button onClick={scanning ? () => setScanning(false) : startNFC}
                    style={{ padding: "14px 32px", borderRadius: 12,
                      border: scanning ? "1px solid rgba(184,148,63,0.3)" : "none",
                      background: scanning ? "rgba(184,148,63,0.08)" : "linear-gradient(135deg, #B8943F, #D4AC5A)",
                      color: scanning ? "#D4AC5A" : "#1A1410", fontSize: 14, fontWeight: 800,
                      cursor: "pointer", letterSpacing: ".06em",
                      boxShadow: scanning ? "none" : "0 10px 30px rgba(184,148,63,0.4)" }}>
                    {scanning ? "⏹ Stop Scanning" : "⬡ Aktifkan NFC e-KTP"}
                  </button>
                  <style>{`
                    @keyframes nfc-pulse-z {
                      0%  { transform: scale(0.85); opacity: 0.75; }
                      100% { transform: scale(2.2); opacity: 0; }
                    }
                  `}</style>
               </div>

               {/* RIGHT: LIVE DATA CHART */}
               <div style={{ flex: "1 1 350px", display: "flex", flexDirection: "column", gap: 20 }}>
                  <div style={{ fontSize: 12, fontWeight: 900, color: "#B8943F", letterSpacing: "0.2em" }}>TRANSPARANSI REAL-TIME</div>
                  <LiveZakatChart terkumpul={totalTerkumpulBeras} disalurkan={totalDisalurkanBeras} />
                  <div className="heroic-card" style={{ padding: "20px 24px", border: "1px solid rgba(47,143,78,0.2)" }}>
                     <div style={{ fontSize: 10, fontWeight: 800, color: "#4FBF7E", letterSpacing: "0.1em", marginBottom: 8 }}>INFAQ TERKUMPUL</div>
                     <div style={{ fontSize: 28, fontWeight: 900, color: "#FAF8F3" }}>Rp {totalInfaq.toLocaleString()}</div>
                     <div style={{ fontSize: 11, color: "rgba(250,248,243,0.4)", marginTop: 8 }}>Dana sosial & santunan anak yatim desa.</div>
                  </div>
               </div>
            </div>
          ) : (
            <div className="heroic-card" style={{ padding: "48px", animation: "slideIn 0.5s ease", border: "2px solid #B8943F" }}>
               {/* (Hasil Scan UI tetap lengkap seperti sebelumnya) */}
               <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 32 }}>
                  <div><div style={{ fontSize: 11, fontWeight: 800, color: "#B8943F" }}>IDENTITAS WARGA</div><div style={{ fontSize: 32, fontWeight: 900 }}>{hasilScan.kepala}</div><div style={{ fontSize: 14, opacity: 0.5 }}>RT {hasilScan.rt} · {hasilScan.jiwa} Jiwa</div></div>
                  <button onClick={() => setHasilScan(null)} style={{ background: "rgba(255,255,255,0.1)", border: "none", color: "white", width: 44, height: 44, borderRadius: "50%", cursor: "pointer" }}>✕</button>
               </div>
               <div style={{ display: "grid", gridTemplateColumns: hasilScan.isMustahiq || hasilScan.yatimCount > 0 ? "1fr 1fr" : "1fr", gap: 24 }}>
                  <div style={{ background: "rgba(255,255,255,0.03)", padding: 24, borderRadius: 24, border: "1px solid rgba(255,255,255,0.05)" }}>
                     <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 12 }}><span style={{ fontSize: 11, fontWeight: 900, opacity: 0.5 }}>STATUS WAJIB ZAKAT</span><span style={{ background: hasilScan.statusBayar ? "rgba(47,143,78,0.2)" : "rgba(220,53,69,0.2)", color: hasilScan.statusBayar ? "#4FBF7E" : "#FF8A8A", padding: "4px 12px", borderRadius: 99, fontSize: 10, fontWeight: 900 }}>{hasilScan.statusBayar ? "✓ LUNAS" : "⚠️ BELUM"}</span></div>
                     <div style={{ fontSize: 22, fontWeight: 900 }}>{hasilScan.statusBayar ? (hasilScan.statusBayar.jenis === 'beras' ? `${hasilScan.statusBayar.nominal_kg} kg Beras` : `Rp ${hasilScan.statusBayar.nominal_uang.toLocaleString()}`) : `${(hasilScan.jiwa * 2.5).toFixed(1)} kg Beras`}</div>
                  </div>
                  {hasilScan.isMustahiq && (
                    <div style={{ background: "linear-gradient(135deg, rgba(184,148,63,0.15), rgba(184,148,63,0.03))", padding: 24, borderRadius: 24, border: "1.5px solid #B8943F50" }}>
                        <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 12 }}><span style={{ fontSize: 11, fontWeight: 900, color: "#B8943F" }}>HAK TERIMA BERAS</span>{hasilScan.sudahAmbilBeras && <span style={{ color: "#4fbf7e", fontSize: 10, fontWeight: 900 }}>✓ DIAMBIL</span>}</div>
                        <div style={{ fontSize: 32, fontWeight: 900, marginBottom: 20 }}>{hasilScan.totalJatahBeras.toFixed(1)} <span style={{ fontSize: 16, opacity: 0.5 }}>kg</span></div>
                        {!hasilScan.sudahAmbilBeras && <button disabled={loading} onClick={() => konfirmasiAmil('zakat_beras', hasilScan.totalJatahBeras)} style={{ width: "100%", padding: "14px", borderRadius: 12, border: "none", background: "#2F8F4E", color: "white", fontSize: 13, fontWeight: 900, cursor: "pointer" }}>AMIL: KONFIRMASI SERAH</button>}
                    </div>
                  )}
               </div>
            </div>
          )}
        </div>
      </main>

      <footer style={{ padding: "32px 40px", textAlign: "center", borderTop: "1px solid rgba(255,255,255,0.05)", zIndex: 10 }}>
         <div style={{ fontSize: 11, fontWeight: 800, color: "rgba(250,248,243,0.2)", letterSpacing: "0.1em" }}>© 2026 CIBURIAL ECO-DIGITAL VILLAGE · DKM AL-HUSAIN</div>
      </footer>
    </div>
  );
}