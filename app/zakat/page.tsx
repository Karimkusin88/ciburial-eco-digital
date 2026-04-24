"use client";
import { useState, useEffect, useRef } from "react";
import { supabase, isSupabaseReady } from "@/lib/supabase";

const TAHUN_INI = 2026;
const HARGA_BERAS = 15000;
const JATAH_ZAKAT_PER_JIWA = 2.0; 
const JATAH_SANTUNAN_PER_YATIM = 50000;

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
  const nfcRef = useRef<any>(null);

  function showToast(msg: string, ok = true) {
    setToast({ msg, ok });
    setTimeout(() => setToast({ msg: "", ok: true }), 4000);
  }

  async function fetchAll() {
    if (!isSupabaseReady()) return;
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
      statusBayar: dataSetor || null, // Pastikan namanya statusBayar
      sudahAmbilBeras,
      sudahAmbilUang,
      totalJatahBeras: jiwaKeluarga * JATAH_ZAKAT_PER_JIWA,
      totalSantunanUang: yatimKeluarga.length * JATAH_SANTUNAN_PER_YATIM
    });
  }

  async function konfirmasiAmil(tipe: 'zakat_beras' | 'santunan_uang', jumlah: number) {
    if (!hasilScan) return;
    setLoading(true);
    const { error } = await supabase.from("pengambilan_zakat").insert({ kk_id: hasilScan.id, tahun: TAHUN_INI, tipe, jumlah });
    if (error) showToast("❌ Gagal: " + error.message, false);
    else { showToast("✅ Berhasil Dicatat!"); fetchAll(); setHasilScan(null); }
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

  return (
    <div style={{ minHeight: "100vh", background: "#081014", color: "#FAF8F3", fontFamily: "sans-serif", display: "flex", flexDirection: "column" }}>
      <style>{` @keyframes ping { 75%, 100% { transform: scale(3.5); opacity: 0; } } .glass-card { background: rgba(255,255,255,0.02); backdrop-filter: blur(12px); border-radius: 24px; border: 1px solid rgba(184,148,63,0.15); } `}</style>
      
      <header style={{ padding: "20px 32px", display: "flex", justifyContent: "space-between", alignItems: "center", borderBottom: "1px solid rgba(184,148,63,0.2)" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
          <div style={{ fontSize: 28 }}>🕌</div>
          <div>
            <div style={{ fontSize: 10, color: "#B8943F", fontWeight: 800 }}>CIBURIAL SMART HUB</div>
            <div style={{ fontSize: 18, fontWeight: 900 }}>Kiosk Zakat Digital</div>
          </div>
        </div>
        <div style={{ fontSize: 16, fontWeight: 800 }}>{TAHUN_INI}</div>
      </header>

      {/* LIVE STATS */}
      <div style={{ background: "rgba(184,148,63,0.05)", padding: "12px 32px", display: "flex", gap: 24, borderBottom: "1px solid rgba(255,255,255,0.03)", justifyContent: "center" }}>
        <div><span style={{ fontSize: 9, fontWeight: 800, color: "#B8943F", display: "block" }}>TERKUMPUL</span><span style={{ fontSize: 15, fontWeight: 900 }}>{zakatList.filter(z=>z.jenis==='beras').reduce((s,z)=>s+Number(z.nominal_kg),0).toFixed(0)}kg</span></div>
        <div><span style={{ fontSize: 9, fontWeight: 800, color: "#B8943F", display: "block" }}>DISALURKAN</span><span style={{ fontSize: 15, fontWeight: 900 }}>{pengambilan.filter(p=>p.tipe==='zakat_beras').reduce((s,p)=>s+Number(p.jumlah),0).toFixed(0)}kg</span></div>
        <div><span style={{ fontSize: 9, fontWeight: 800, color: "#B8943F", display: "block" }}>INFAQ</span><span style={{ fontSize: 15, fontWeight: 900 }}>Rp {zakatList.reduce((s,z)=>s+Number(z.infaq_uang||0),0).toLocaleString()}</span></div>
      </div>

      <main style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center", padding: "20px" }}>
        <div style={{ width: "100%", maxWidth: 650 }}>
          {!hasilScan ? (
            <div className="glass-card" style={{ padding: "60px 40px", textAlign: "center" }}>
              <RadarPing active={scanning} color="#B8943F" />
              <h2 style={{ marginTop: 32 }}>{scanning ? "Siaga: Tempelkan Kartu..." : "Sistem Kiosk Standby"}</h2>
              {!scanning && <button onClick={startNFC} style={{ marginTop: 32, padding: "16px 32px", borderRadius: 12, background: "linear-gradient(135deg, #B8943F, #D4AC5A)", color: "#1A1410", border: "none", fontWeight: 900, cursor: "pointer" }}>MULAI SCAN</button>}
            </div>
          ) : (
            <div className="glass-card" style={{ padding: 40, border: "2.5px solid #B8943F" }}>
               <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 32 }}>
                  <div><div style={{ fontSize: 11, fontWeight: 800, color: "#B8943F" }}>PEMEGANG KARTU</div><div style={{ fontSize: 32, fontWeight: 900 }}>{hasilScan.kepala}</div><div style={{ fontSize: 14, opacity: 0.5 }}>RT {hasilScan.rt} · {hasilScan.jiwa} Jiwa</div></div>
                  <button onClick={() => setHasilScan(null)} style={{ background: "#333", border: "none", color: "white", width: 40, height: 40, borderRadius: "50%", cursor: "pointer" }}>✕</button>
               </div>
               <div style={{ background: "rgba(255,255,255,0.03)", padding: 24, borderRadius: 20, marginBottom: 20 }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
                    <span style={{ fontSize: 12, fontWeight: 800, opacity: 0.6 }}>STATUS SETORAN</span>
                    <span style={{ background: hasilScan.statusBayar ? "#2d5a40" : "#8B2020", color: "#fff", padding: "4px 12px", borderRadius: 99, fontSize: 10, fontWeight: 800 }}>{hasilScan.statusBayar ? "✅ LUNAS" : "⚠️ BELUM SETOR"}</span>
                  </div>
                  <div style={{ fontSize: 24, fontWeight: 900 }}>{hasilScan.statusBayar?.jenis === 'beras' ? `${hasilScan.statusBayar.nominal_kg}kg Beras` : hasilScan.statusBayar?.jenis === 'uang' ? `Rp ${hasilScan.statusBayar.nominal_uang.toLocaleString()}` : 'Belum Ada Data'}</div>
               </div>
               {hasilScan.isMustahiq && (
                 <div style={{ background: "linear-gradient(135deg, rgba(184,148,63,0.1), rgba(184,148,63,0.03))", padding: 24, borderRadius: 20, border: "1px solid rgba(184,148,63,0.2)" }}>
                    <div style={{ fontSize: 12, fontWeight: 800, color: "#B8943F", marginBottom: 12 }}>HAK TERIMA BERAS</div>
                    <div style={{ fontSize: 32, fontWeight: 900, marginBottom: 20 }}>{hasilScan.totalJatahBeras.toFixed(1)} <span style={{ fontSize: 16, opacity: 0.5 }}>kg</span></div>
                    {!hasilScan.sudahAmbilBeras ? <button onClick={() => konfirmasiAmil('zakat_beras', hasilScan.totalJatahBeras)} style={{ width: "100%", padding: "14px", borderRadius: 12, border: "none", background: "#2d5a40", color: "white", fontWeight: 800, cursor: "pointer" }}>KONFIRMASI PENYERAHAN</button> : <div style={{ textAlign: "center", color: "#4fbf7e", fontWeight: 800 }}>✓ SUDAH DIAMBIL</div>}
                 </div>
               )}
            </div>
          )}
        </div>
      </main>
    </div>
  );
}