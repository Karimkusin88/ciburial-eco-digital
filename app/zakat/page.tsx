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
    <div style={{ position: "relative", width: 180, height: 180, margin: "0 auto" }}>
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
        boxShadow: active ? `0 0 40px ${color}80, 0 0 80px ${color}40` : "none", 
        transition: "all 0.5s cubic-bezier(0.175, 0.885, 0.32, 1.275)",
        zIndex: 2
      }} />
      {active && (
        <div style={{
          position: "absolute", inset: -20, borderRadius: "50%",
          background: `conic-gradient(from 0deg, transparent 0deg, ${color}10 180deg, transparent 360deg)`,
          animation: "sweep 3s linear infinite"
        }} />
      )}
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
      id: kk.id,
      kepala: kk.kepala_keluarga,
      rt: kk.rt,
      jiwa: jiwaKeluarga,
      yatimCount: yatimKeluarga.length,
      isMustahiq: kk.golongan_zakat === "mustahiq",
      statusBayar: dataSetor || null,
      sudahAmbilBeras,
      sudahAmbilUang,
      totalJatahBeras: jiwaKeluarga * JATAH_ZAKAT_PER_JIWA,
      totalSantunanUang: yatimKeluarga.length * JATAH_SANTUNAN_PER_YATIM
    });
  }

  async function konfirmasiAmil(tipe: 'zakat_beras' | 'santunan_uang', jumlah: number) {
    if (!hasilScan) return;
    setLoading(true);
    try {
        const { error } = await supabase.from("pengambilan_zakat").insert({
          kk_id: hasilScan.id, tahun: TAHUN_INI, tipe, jumlah
        });
        if (error) showToast("❌ Gagal: " + error.message, false);
        else {
            showToast("✅ Berhasil Diserahkan!");
            await fetchAll();
            setHasilScan(null);
        }
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
      ndef.addEventListener("reading", ({ serialNumber }: any) => {
        prosesTap(serialNumber.replace(/:/g, "").toUpperCase());
      });
    } catch { showToast("NFC Error", false); }
  }

  return (
    <div style={{ 
      minHeight: "100vh", background: "#060A0D", color: "#FAF8F3", 
      fontFamily: "'Inter', system-ui, sans-serif", display: "flex", flexDirection: "column",
      position: "relative", overflow: "hidden"
    }}>
      {/* BACKGROUND DECORATION */}
      <div style={{ position: "absolute", top: "-10%", left: "-10%", width: "50%", height: "50%", background: "radial-gradient(circle, rgba(184,148,63,0.08) 0%, transparent 70%)", pointerEvents: "none" }} />
      <div style={{ position: "absolute", bottom: "-10%", right: "-10%", width: "50%", height: "50%", background: "radial-gradient(circle, rgba(47,143,78,0.05) 0%, transparent 70%)", pointerEvents: "none" }} />

      <style>{`
        @keyframes ping { 75%, 100% { transform: scale(3.5); opacity: 0; } }
        @keyframes sweep { to { transform: rotate(360deg); } }
        @keyframes slideIn { from { transform: translateY(30px) scale(0.95); opacity: 0; } to { transform: translateY(0) scale(1); opacity: 1; } }
        @keyframes pulseGlow { 0%, 100% { opacity: 0.5; } 50% { opacity: 1; } }
        .heroic-card { background: rgba(255,255,255,0.03); backdrop-filter: blur(16px); border: 1px solid rgba(184,148,63,0.15); border-radius: 32px; box-shadow: 0 20px 50px rgba(0,0,0,0.3); }
        .stat-badge { background: rgba(184,148,63,0.1); border: 1px solid rgba(184,148,63,0.2); padding: 8px 16px; borderRadius: 12px; }
      `}</style>

      {/* TOAST */}
      {toast.msg && (
        <div style={{ position: "fixed", top: 32, left: "50%", transform: "translateX(-50%)", background: toast.ok ? "linear-gradient(135deg, #2F8F4E, #1C3A2B)" : "#8B2020", color: "white", padding: "16px 32px", borderRadius: 99, zIndex: 1000, fontWeight: 800, boxShadow: "0 10px 40px rgba(0,0,0,0.5)", border: "1px solid rgba(255,255,255,0.1)", animation: "slideIn 0.3s ease-out" }}>
          {toast.msg}
        </div>
      )}

      {/* HEADER */}
      <header style={{ padding: "24px 40px", display: "flex", justifyContent: "space-between", alignItems: "center", borderBottom: "1px solid rgba(255,255,255,0.05)", zIndex: 10 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 20 }}>
          <div style={{ width: 56, height: 56, borderRadius: 16, background: "linear-gradient(135deg, #B8943F, #D4AC5A)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 32, boxShadow: "0 8px 20px rgba(184,148,63,0.3)" }}>🕌</div>
          <div>
            <div style={{ fontSize: 11, color: "#B8943F", fontWeight: 900, letterSpacing: "0.25em", textTransform: "uppercase" }}>CIBURIAL DIGITAL HUB</div>
            <div style={{ fontSize: 22, fontWeight: 900, letterSpacing: "-0.02em" }}>Kiosk Zakat Desa</div>
          </div>
        </div>
        <div style={{ textAlign: "right" }}>
          <div style={{ fontSize: 24, fontWeight: 900, letterSpacing: "0.05em", color: "#FAF8F3" }}>{jam.toLocaleTimeString("id-ID", { hour: "2-digit", minute: "2-digit" })}</div>
          <div style={{ fontSize: 12, color: "rgba(250,248,243,0.4)", fontWeight: 700, textTransform: "uppercase" }}>{jam.toLocaleDateString("id-ID", { weekday: 'long', day: 'numeric', month: 'short' })}</div>
        </div>
      </header>

      {/* TOP LIVE STATS */}
      <div style={{ padding: "0 40px", marginTop: 20, zIndex: 10 }}>
        <div style={{ background: "rgba(255,255,255,0.02)", padding: "16px 32px", borderRadius: 20, border: "1px solid rgba(255,255,255,0.05)", display: "flex", gap: 40, justifyContent: "center", flexWrap: "wrap" }}>
           {[
             { l: "TERKUMPUL", v: `${zakatList.filter(z=>z.jenis==='beras').reduce((s,z)=>s+Number(z.nominal_kg),0).toFixed(0)} kg`, i: "🌾" },
             { l: "DISALURKAN", v: `${pengambilan.filter(p=>p.tipe==='zakat_beras').reduce((s,p)=>s+Number(p.jumlah),0).toFixed(0)} kg`, i: "📤" },
             { l: "DANA INFAQ", v: `Rp ${zakatList.reduce((s,z)=>s+Number(z.infaq_uang||0),0).toLocaleString()}`, i: "🧡" }
           ].map((s, idx) => (
             <div key={idx} style={{ display: "flex", alignItems: "center", gap: 12 }}>
                <span style={{ fontSize: 20 }}>{s.i}</span>
                <div>
                   <div style={{ fontSize: 9, fontWeight: 900, color: "#B8943F", opacity: 0.8 }}>{s.l}</div>
                   <div style={{ fontSize: 16, fontWeight: 900 }}>{s.v}</div>
                </div>
             </div>
           ))}
        </div>
      </div>

      <main style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center", padding: "40px", zIndex: 10 }}>
        <div style={{ width: "100%", maxWidth: 800 }}>
          {!hasilScan ? (
            /* --- STATE: IDLE / SCANNING --- */
            <div className="heroic-card" style={{ padding: "80px 40px", textAlign: "center", position: "relative", overflow: "hidden" }}>
              <RadarPing active={scanning} color="#B8943F" />
              <div style={{ marginTop: 48 }}>
                <h2 style={{ fontSize: 28, fontWeight: 900, marginBottom: 12 }}>{scanning ? "Sistem Siaga: Tempelkan Kartu" : "Kiosk Standby"}</h2>
                <p style={{ color: "rgba(250,248,243,0.5)", fontSize: 16, maxWidth: 450, margin: "0 auto" }}>Gunakan e-KTP atau Kartu Warga Ciburial untuk verifikasi hak dan kewajiban zakat Fitrah keluarga Anda.</p>
              </div>

              {!scanning ? (
                <button onClick={startNFC} style={{ marginTop: 48, padding: "20px 48px", borderRadius: 20, background: "linear-gradient(135deg, #B8943F, #D4AC5A)", color: "#1A1410", border: "none", fontSize: 18, fontWeight: 900, cursor: "pointer", boxShadow: "0 15px 40px rgba(184,148,63,0.4)", transition: "all 0.3s" }}>AKTIFKAN SENSOR NFC</button>
              ) : (
                <button onClick={() => setScanning(false)} style={{ marginTop: 40, padding: "12px 24px", background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.1)", color: "#FAF8F3", borderRadius: 12, cursor: "pointer", fontWeight: 700 }}>Matikan Sensor</button>
              )}

              {/* GUIDE STEPS */}
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 20, marginTop: 64 }}>
                 {[
                   { i: "01", t: "TEMPEL", d: "Tap e-KTP di belakang HP" },
                   { i: "02", t: "CEK", d: "Sistem cek data keluarga" },
                   { i: "03", t: "AMBIL", d: "Panitia serahkan zakat" }
                 ].map(s => (
                   <div key={s.i} style={{ textAlign: "center" }}>
                      <div style={{ fontSize: 10, fontWeight: 900, color: "#B8943F", marginBottom: 8 }}>{s.i}</div>
                      <div style={{ fontSize: 13, fontWeight: 800, marginBottom: 4 }}>{s.t}</div>
                      <div style={{ fontSize: 11, color: "rgba(250,248,243,0.3)" }}>{s.d}</div>
                   </div>
                 ))}
              </div>
            </div>
          ) : (
            /* --- STATE: SCAN RESULT --- */
            <div className="heroic-card" style={{ padding: "48px", animation: "slideIn 0.5s cubic-bezier(0.22, 1, 0.36, 1)", border: "2px solid #B8943F" }}>
               <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 40, paddingBottom: 24, borderBottom: "1px solid rgba(255,255,255,0.05)" }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 24 }}>
                    <div style={{ width: 80, height: 80, borderRadius: "50%", background: "rgba(184,148,63,0.1)", border: "2px solid #B8943F", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 40 }}>👤</div>
                    <div>
                      <div style={{ fontSize: 11, fontWeight: 900, color: "#B8943F", letterSpacing: "0.2em", marginBottom: 4 }}>DATA KELUARGA TERDAFTAR</div>
                      <div style={{ fontSize: 32, fontWeight: 900 }}>{hasilScan.kepala}</div>
                      <div style={{ fontSize: 15, color: "rgba(250,248,243,0.5)", marginTop: 4 }}>Rukun Tetangga {hasilScan.rt} · <strong>{hasilScan.jiwa} Jiwa</strong> Anggota</div>
                    </div>
                  </div>
                  <button onClick={() => setHasilScan(null)} style={{ background: "rgba(255,255,255,0.1)", border: "none", color: "white", width: 48, height: 48, borderRadius: "50%", cursor: "pointer", fontSize: 24 }}>✕</button>
               </div>

               <div style={{ display: "grid", gridTemplateColumns: hasilScan.isMustahiq || hasilScan.yatimCount > 0 ? "1fr 1fr" : "1fr", gap: 24 }}>
                  {/* LEFT: STATUS WAJIB SETOR */}
                  <div style={{ background: "rgba(255,255,255,0.03)", padding: 32, borderRadius: 28, border: "1px solid rgba(255,255,255,0.05)" }}>
                     <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 20 }}>
                        <span style={{ fontSize: 12, fontWeight: 900, opacity: 0.5 }}>STATUS WAJIB ZAKAT</span>
                        <div style={{ 
                          background: hasilScan.statusBayar ? "rgba(47,143,78,0.2)" : "rgba(220,53,69,0.2)",
                          color: hasilScan.statusBayar ? "#4FBF7E" : "#FF8A8A",
                          padding: "6px 16px", borderRadius: 99, fontSize: 11, fontWeight: 900
                        }}>
                          {hasilScan.statusBayar ? "✓ LUNAS" : "⚠️ BELUM SETOR"}
                        </div>
                     </div>
                     <div style={{ fontSize: 24, fontWeight: 900 }}>
                        {hasilScan.statusBayar ? (
                           hasilScan.statusBayar.jenis === 'beras' ? `${hasilScan.statusBayar.nominal_kg} kg Beras` : `Rp ${hasilScan.statusBayar.nominal_uang.toLocaleString()}`
                        ) : (
                           <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                              <div style={{ fontSize: 22 }}>{(hasilScan.jiwa * 2.5).toFixed(1)} kg Beras</div>
                              <div style={{ fontSize: 14, color: "rgba(250,248,243,0.3)" }}>atau Rp {(hasilScan.jiwa * 2.5 * HARGA_BERAS).toLocaleString()}</div>
                           </div>
                        )}
                     </div>
                     <div style={{ marginTop: 24, fontSize: 12, color: "rgba(250,248,243,0.3)", lineHeight: 1.5 }}>
                        {hasilScan.statusBayar ? `Diterima Amil pada ${new Date(hasilScan.statusBayar.tgl_bayar).toLocaleDateString("id-ID")}` : "Silakan hubungi Amil DKM di Masjid untuk penyetoran."}
                     </div>
                  </div>

                  {/* RIGHT: HAK TERIMA (IF APPLICABLE) */}
                  {(hasilScan.isMustahiq || hasilScan.yatimCount > 0) && (
                    <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
                       {/* HAK BERAS */}
                       {hasilScan.isMustahiq && (
                         <div style={{ background: "linear-gradient(135deg, rgba(184,148,63,0.2), rgba(184,148,63,0.05))", padding: 28, borderRadius: 28, border: "1.5px solid #B8943F50" }}>
                            <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 12 }}>
                               <span style={{ fontSize: 12, fontWeight: 900, color: "#B8943F" }}>HAK TERIMA BERAS</span>
                               {hasilScan.sudahAmbilBeras && <span style={{ color: "#4fbf7e", fontSize: 11, fontWeight: 900 }}>✓ DIAMBIL</span>}
                            </div>
                            <div style={{ fontSize: 32, fontWeight: 900, color: "#FAF8F3", marginBottom: 20 }}>{hasilScan.totalJatahBeras.toFixed(1)} <span style={{ fontSize: 16, opacity: 0.5 }}>kg</span></div>
                            {!hasilScan.sudahAmbilBeras && (
                              <button disabled={loading} onClick={() => konfirmasiAmil('zakat_beras', hasilScan.totalJatahBeras)} style={{ width: "100%", padding: "16px", borderRadius: 16, border: "none", background: "#2F8F4E", color: "white", fontSize: 14, fontWeight: 900, cursor: "pointer", boxShadow: "0 10px 25px rgba(47,143,78,0.3)" }}>{loading ? "PROSES..." : "AMIL: KONFIRMASI SERAH"}</button>
                            )}
                         </div>
                       )}

                       {/* HAK SANTUNAN */}
                       {hasilScan.yatimCount > 0 && (
                         <div style={{ background: "rgba(79,191,126,0.08)", padding: 24, borderRadius: 28, border: "1px solid rgba(79,191,126,0.2)" }}>
                            <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 10 }}>
                               <span style={{ fontSize: 11, fontWeight: 900, color: "#4FBF7E" }}>SANTUNAN INFAQ ({hasilScan.yatimCount} JIWA)</span>
                               {hasilScan.sudahAmbilUang && <span style={{ color: "#4fbf7e", fontSize: 10, fontWeight: 900 }}>✓ DIAMBIL</span>}
                            </div>
                            <div style={{ fontSize: 24, fontWeight: 900, marginBottom: 16 }}>Rp {hasilScan.totalSantunanUang.toLocaleString()}</div>
                            {!hasilScan.sudahAmbilUang && (
                              <button disabled={loading} onClick={() => konfirmasiAmil('santunan_uang', hasilScan.totalSantunanUang)} style={{ width: "100%", padding: "12px", borderRadius: 12, border: "1px solid #4FBF7E", background: "none", color: "#4FBF7E", fontSize: 12, fontWeight: 800, cursor: "pointer" }}>{loading ? "PROSES..." : "KONFIRMASI SERAH UANG"}</button>
                            )}
                         </div>
                       )}
                    </div>
                  )}
               </div>

               <div style={{ marginTop: 40, textAlign: "center", borderTop: "1px solid rgba(255,255,255,0.05)", paddingTop: 24 }}>
                  <p style={{ fontSize: 12, color: "rgba(250,248,243,0.3)", fontStyle: "italic" }}>
                    &quot;Sebaik-baik manusia adalah yang paling bermanfaat bagi orang lain.&quot;
                  </p>
               </div>
            </div>
          )}
        </div>
      </main>

      {/* FOOTER */}
      <footer style={{ padding: "24px 40px", textAlign: "center", borderTop: "1px solid rgba(255,255,255,0.05)", zIndex: 10 }}>
         <div style={{ fontSize: 10, fontWeight: 800, color: "rgba(250,248,243,0.2)", letterSpacing: "0.1em" }}>© 2026 CIBURIAL ECO-DIGITAL VILLAGE · DKM AL-IKHLAS</div>
      </footer>
    </div>
  );
}