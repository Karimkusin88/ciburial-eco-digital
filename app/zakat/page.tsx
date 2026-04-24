"use client";
import { useState, useEffect, useRef } from "react";
import { supabase, isSupabaseReady } from "@/lib/supabase";

const TAHUN_INI = 2026;
const HARGA_BERAS = 15000;
const JATAH_ZAKAT_PER_JIWA = 2.0; 
const JATAH_SANTUNAN_PER_YATIM = 50000;

// ─── RADAR ANIMATION ─────────────────────────────────────────────────────────
function RadarPing({ active, color }: { active: boolean, color: string }) {
  return (
    <div style={{ position: "relative", width: 140, height: 140, margin: "0 auto" }}>
      {[1, 2, 3].map(i => (
        <div key={i} style={{ position: "absolute", inset: 0, borderRadius: "50%", border: `1px solid ${color}40`, transform: `scale(${i * 0.33})`, transformOrigin: "center", animation: active ? `ping ${1 + i * 0.5}s infinite` : "none" }} />
      ))}
      <div style={{ position: "absolute", top: "50%", left: "50%", transform: "translate(-50%,-50%)", width: active ? 32 : 24, height: active ? 32 : 24, borderRadius: "50%", background: active ? color : "#E5E7EB", boxShadow: active ? `0 0 30px ${color}` : "none", transition: "all 0.4s" }} />
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
    
    if (!kk) return showToast("❌ Kartu tidak terdaftar!", false);

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
          kk_id: hasilScan.id,
          tahun: TAHUN_INI,
          tipe: tipe,
          jumlah: jumlah
        });

        if (error) {
            showToast("❌ Gagal Simpan: " + error.message, false);
        } else {
            showToast("✅ Penyerahan Berhasil Dicatat!");
            await fetchAll(); // Tunggu data terbaru
            setHasilScan(null); // Tutup tampilan hasil scan agar kembali ke radar
        }
    } catch (e: any) {
        showToast("❌ Error Sistem: " + e.message, false);
    }
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
    } catch { showToast("NFC Tidak Aktif", false); }
  }

  return (
    <div style={{ minHeight: "100vh", background: "#081014", color: "#FAF8F3", fontFamily: "sans-serif", display: "flex", flexDirection: "column" }}>
      <style>{`
        @keyframes ping { 75%, 100% { transform: scale(3.5); opacity: 0; } }
        .glass-card { background: rgba(255,255,255,0.02); backdrop-filter: blur(12px); border-radius: 24px; border: 1px solid rgba(184,148,63,0.15); }
      `}</style>

      {/* TOAST NOTIFICATION */}
      {toast.msg && (
        <div style={{ position: "fixed", top: 20, left: "50%", transform: "translateX(-50%)", background: toast.ok ? "#2d5a40" : "#8B2020", color: "white", padding: "12px 24px", borderRadius: 99, zIndex: 999, fontWeight: 700, boxShadow: "0 10px 30px rgba(0,0,0,0.5)" }}>
          {toast.msg}
        </div>
      )}

      {/* HEADER KIOSK */}
      <header style={{ padding: "20px 32px", display: "flex", justifyContent: "space-between", alignItems: "center", borderBottom: "1px solid rgba(184,148,63,0.2)" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
          <div style={{ fontSize: 28 }}>🕌</div>
          <div>
            <div style={{ fontSize: 10, color: "#B8943F", fontWeight: 800, letterSpacing: "0.15em" }}>CIBURIAL SMART HUB</div>
            <div style={{ fontSize: 18, fontWeight: 900 }}>Kiosk Zakat Digital</div>
          </div>
        </div>
        <div style={{ textAlign: "right" }}>
          <div style={{ fontSize: 14, fontWeight: 800, color: "#B8943F" }}>OPERASIONAL DKM</div>
          <div style={{ fontSize: 10, color: "rgba(250,248,243,0.4)" }}>{jam.toLocaleTimeString("id-ID")}</div>
        </div>
      </header>

      {/* LIVE STATS */}
      <div style={{ background: "rgba(184,148,63,0.05)", padding: "12px 32px", display: "flex", gap: 24, borderBottom: "1px solid rgba(255,255,255,0.03)", justifyContent: "center", flexWrap: "wrap" }}>
        <div><span style={{ fontSize: 9, fontWeight: 800, color: "#B8943F", display: "block" }}>ZAKAT TERKUMPUL</span><span style={{ fontSize: 15, fontWeight: 900 }}>{zakatList.filter(z=>z.jenis==='beras').reduce((s,z)=>s+Number(z.nominal_kg),0).toFixed(0)}kg</span></div>
        <div style={{ width: 1, background: "rgba(255,255,255,0.1)", height: 24 }} />
        <div><span style={{ fontSize: 9, fontWeight: 800, color: "#B8943F", display: "block" }}>DISALURKAN</span><span style={{ fontSize: 15, fontWeight: 900 }}>{pengambilan.filter(p=>p.tipe==='zakat_beras').reduce((s,p)=>s+Number(p.jumlah),0).toFixed(0)}kg</span></div>
        <div style={{ width: 1, background: "rgba(255,255,255,0.1)", height: 24 }} />
        <div><span style={{ fontSize: 9, fontWeight: 800, color: "#B8943F", display: "block" }}>TOTAL INFAQ</span><span style={{ fontSize: 15, fontWeight: 900 }}>Rp {zakatList.reduce((s,z)=>s+Number(z.infaq_uang||0),0).toLocaleString()}</span></div>
      </div>

      <main style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center", padding: "20px" }}>
        <div style={{ width: "100%", maxWidth: 650 }}>
          {!hasilScan ? (
            <div className="glass-card" style={{ padding: "60px 40px", textAlign: "center" }}>
              <RadarPing active={scanning} color="#B8943F" />
              <h2 style={{ marginTop: 32 }}>{scanning ? "Siaga: Tempelkan Kartu..." : "Sistem Kiosk Standby"}</h2>
              {!scanning && <button onClick={startNFC} style={{ marginTop: 32, padding: "16px 32px", borderRadius: 12, background: "linear-gradient(135deg, #B8943F, #D4AC5A)", color: "#1A1410", border: "none", fontSize: 15, fontWeight: 900, cursor: "pointer" }}>MULAI SCAN KARTU</button>}
            </div>
          ) : (
            <div className="glass-card" style={{ padding: 40, border: "2px solid #B8943F" }}>
               <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 32 }}>
                  <div><div style={{ fontSize: 11, fontWeight: 800, color: "#B8943F" }}>IDENTITAS WARGA</div><div style={{ fontSize: 28, fontWeight: 900 }}>{hasilScan.kepala}</div><div style={{ fontSize: 14, opacity: 0.5 }}>RT {hasilScan.rt} · {hasilScan.jiwa} Jiwa</div></div>
                  <button onClick={() => setHasilScan(null)} style={{ background: "rgba(255,255,255,0.1)", border: "none", color: "white", width: 40, height: 40, borderRadius: "50%", cursor: "pointer" }}>✕</button>
               </div>

               <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
                  {/* BOX STATUS ZAKAT (WAJIB) */}
                  <div style={{ background: "rgba(255,255,255,0.03)", padding: 20, borderRadius: 20, border: "1px solid rgba(255,255,255,0.05)" }}>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
                       <span style={{ fontSize: 12, fontWeight: 800, opacity: 0.6 }}>SETORAN ZAKAT FITRAH</span>
                       <span style={{ background: hasilScan.statusBayar ? "rgba(47,143,78,0.2)" : "rgba(139,32,32,0.2)", color: hasilScan.statusBayar ? "#4FBF7E" : "#FF8A8A", padding: "4px 12px", borderRadius: 99, fontSize: 10, fontWeight: 900 }}>
                         {hasilScan.statusBayar ? "✓ LUNAS" : "⚠️ BELUM SETOR"}
                       </span>
                    </div>
                    <div style={{ fontSize: 20, fontWeight: 900, color: hasilScan.statusBayar ? "#4FBF7E" : "#FAF8F3" }}>
                      {hasilScan.statusBayar ? (hasilScan.statusBayar.jenis === 'beras' ? `${hasilScan.statusBayar.nominal_kg} kg Beras` : `Rp ${hasilScan.statusBayar.nominal_uang.toLocaleString()}`) : `${(hasilScan.jiwa * 2.5).toFixed(1)} kg Beras`}
                    </div>
                  </div>

                  {/* BOX PENYERAHAN HAK (MUSTAHIQ) */}
                  {hasilScan.isMustahiq && (
                    <div style={{ background: "linear-gradient(135deg, rgba(184,148,63,0.15), rgba(184,148,63,0.03))", padding: 24, borderRadius: 20, border: "1px solid rgba(184,148,63,0.3)" }}>
                        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
                           <span style={{ fontSize: 12, fontWeight: 800, color: "#B8943F" }}>HAK TERIMA BERAS</span>
                           {hasilScan.sudahAmbilBeras ? <span style={{ background: "#2d5a40", color: "#fff", padding: "4px 12px", borderRadius: 99, fontSize: 10, fontWeight: 800 }}>✓ DIAMBIL</span> : <span style={{ background: "#B8943F", color: "#1a1410", padding: "4px 12px", borderRadius: 99, fontSize: 10, fontWeight: 800 }}>READY</span>}
                        </div>
                        <div style={{ fontSize: 32, fontWeight: 900, marginBottom: 20 }}>{hasilScan.totalJatahBeras.toFixed(1)} <span style={{ fontSize: 16, opacity: 0.5 }}>kg</span></div>
                        
                        {!hasilScan.sudahAmbilBeras && (
                          <button disabled={loading} onClick={() => konfirmasiAmil('zakat_beras', hasilScan.totalJatahBeras)} style={{ width: "100%", padding: "14px", borderRadius: 12, border: "none", background: "#2d5a40", color: "white", fontSize: 14, fontWeight: 800, cursor: "pointer", opacity: loading ? 0.7 : 1 }}>
                            {loading ? "MENYIMPAN..." : "KONFIRMASI PENYERAHAN"}
                          </button>
                        )}
                    </div>
                  )}

                  {/* BOX SANTUNAN YATIM */}
                  {hasilScan.yatimCount > 0 && (
                    <div style={{ background: "rgba(79,191,126,0.05)", padding: 20, borderRadius: 20, border: "1px solid rgba(79,191,126,0.2)" }}>
                        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
                           <span style={{ fontSize: 12, fontWeight: 800, color: "#4fbf7e" }}>SANTUNAN INFAQ ({hasilScan.yatimCount} ANAK)</span>
                           {hasilScan.sudahAmbilUang && <span style={{ color: "#4fbf7e", fontSize: 10, fontWeight: 800 }}>✓ DIAMBIL</span>}
                        </div>
                        <div style={{ fontSize: 24, fontWeight: 900, color: "#fff", marginBottom: 16 }}>Rp {hasilScan.totalSantunanUang.toLocaleString()}</div>
                        {!hasilScan.sudahAmbilUang && (
                          <button disabled={loading} onClick={() => konfirmasiAmil('santunan_uang', hasilScan.totalSantunanUang)} style={{ width: "100%", padding: "12px", borderRadius: 10, border: "1px solid #4fbf7e", background: "none", color: "#4fbf7e", fontSize: 12, fontWeight: 800, cursor: "pointer", opacity: loading ? 0.7 : 1 }}>
                            {loading ? "PROSES..." : "KONFIRMASI PENYERAHAN UANG"}
                          </button>
                        )}
                    </div>
                  )}
               </div>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}