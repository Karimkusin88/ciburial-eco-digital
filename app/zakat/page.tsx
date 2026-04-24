"use client";
import { useState, useEffect, useRef } from "react";
import { supabase, isSupabaseReady } from "@/lib/supabase";

const TAHUN_INI = new Date().getFullYear();
const HARGA_BERAS = 15000;
const JATAH_DISTRIBUSI_DEFAULT = 2.0; // kg beras per jiwa (sesuai setting admin)

// ─── RADAR ANIMATION ─────────────────────────────────────────────────────────
function RadarPing({ active, color }: { active: boolean, color: string }) {
  return (
    <div style={{ position: "relative", width: 160, height: 160, margin: "0 auto" }}>
      {[1, 2, 3].map(i => (
        <div key={i} style={{
          position: "absolute", inset: 0, borderRadius: "50%",
          border: `1px solid ${color}40`,
          transform: `scale(${i * 0.33})`, transformOrigin: "center",
          animation: active ? `ping ${1 + i * 0.5}s infinite` : "none"
        }} />
      ))}
      {active && (
        <div style={{
          position: "absolute", inset: 0, borderRadius: "50%",
          background: `conic-gradient(from 0deg, transparent 270deg, ${color}25 360deg)`,
          animation: "sweep 2s linear infinite",
        }} />
      )}
      <div style={{
        position: "absolute", top: "50%", left: "50%",
        transform: "translate(-50%,-50%)",
        width: active ? 32 : 24, height: active ? 32 : 24,
        borderRadius: "50%",
        background: active ? color : "#E5E7EB",
        boxShadow: active ? `0 0 30px ${color}, 0 0 60px ${color}60` : "none",
        transition: "all 0.4s cubic-bezier(0.175, 0.885, 0.32, 1.275)",
      }} />
    </div>
  );
}

export default function ZakatKioskPage() {
  const [kkList, setKkList] = useState<any[]>([]);
  const [anggotaList, setAnggotaList] = useState<any[]>([]);
  const [zakatList, setZakatList] = useState<any[]>([]);
  const [scanning, setScanning] = useState(false);
  const [hasilScan, setHasilScan] = useState<any>(null);
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
    const [kk, ang, z] = await Promise.all([
      supabase.from("keluarga").select("id,kepala_keluarga,rt,nfc_id,golongan_zakat,kategori_mustahiq"),
      supabase.from("anggota_kk").select("id,kk_id,nama,nfc_id,hubungan"),
      supabase.from("zakat_fitrah").select("*").eq("tahun", TAHUN_INI)
    ]);
    if (kk.data) setKkList(kk.data);
    if (ang.data) setAnggotaList(ang.data);
    if (z.data) setZakatList(z.data);
  }

  useEffect(() => { fetchAll(); }, []);

  async function prosesTap(nfcId: string) {
    const ang = anggotaList.find(a => a.nfc_id === nfcId);
    const kk = kkList.find(k => k.id === (ang?.kk_id || "") || k.nfc_id === nfcId);
    
    if (!kk) {
      showToast("❌ Kartu NFC belum terdaftar!", false);
      setHasilScan({ error: "Kartu Warga tidak ditemukan. Harap hubungi pengurus RT." });
      return;
    }

    const jiwaKeluarga = anggotaList.filter(a => a.kk_id === kk.id).length || 1;
    const statusBayar = zakatList.find(z => z.kk_id === kk.id);
    const namaWarga = ang ? ang.nama : kk.kepala_keluarga;

    setHasilScan({
      nama: namaWarga,
      kepala: kk.kepala_keluarga,
      rt: kk.rt,
      jiwa: jiwaKeluarga,
      isMustahiq: kk.golongan_zakat === "mustahiq",
      kategori_mustahiq: kk.kategori_mustahiq,
      statusBayar: statusBayar || null
    });
  }

  async function startNFC() {
    if (!("NDEFReader" in window)) {
      showToast("Browser tidak support NFC. (Gunakan Chrome Android)", false);
      return;
    }
    try {
      const ndef = new (window as any).NDEFReader();
      nfcRef.current = ndef;
      await ndef.scan();
      setScanning(true);
      setHasilScan(null);
      ndef.addEventListener("reading", ({ serialNumber }: any) => {
        prosesTap(serialNumber.replace(/:/g, "").toUpperCase());
      });
    } catch { showToast("Gagal aktifkan NFC.", false); }
  }

  const stopNFC = () => { try { nfcRef.current?.stop?.(); } catch {} setScanning(false); };

  return (
    <div style={{ minHeight: "100vh", background: "#081014", fontFamily: "'Inter', sans-serif", color: "#FAF8F3", display: "flex", flexDirection: "column" }}>
      <style>{`
        @keyframes ping { 75%, 100% { transform: scale(3.5); opacity: 0; } }
        @keyframes sweep { to { transform: rotate(360deg); } }
        .glass-card { background: rgba(255,255,255,0.02); backdrop-filter: blur(12px); border-radius: 24px; border: 1px solid rgba(184,148,63,0.15); }
        .badge-status { padding: 4px 12px; borderRadius: 99px; font-size: 10px; font-weight: 800; text-transform: uppercase; }
      `}</style>

      {/* HEADER */}
      <header style={{ padding: "20px 32px", display: "flex", justifyContent: "space-between", alignItems: "center", borderBottom: "1px solid rgba(184,148,63,0.15)" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
          <a href="/" style={{ fontSize: 24, textDecoration: "none" }}>🕌</a>
          <div>
            <div style={{ fontSize: 10, color: "#B8943F", fontWeight: 800, letterSpacing: "0.2em" }}>ZAKAT FITRAH {TAHUN_INI}</div>
            <div style={{ fontSize: 18, fontWeight: 900 }}>Kiosk Zakat Digital</div>
          </div>
        </div>
        <div style={{ textAlign: "right" }}>
          <div style={{ fontSize: 18, fontWeight: 900 }}>{jam.toLocaleTimeString("id-ID", { hour: "2-digit", minute: "2-digit" })}</div>
          <div style={{ fontSize: 10, color: "rgba(250,248,243,0.4)", fontWeight: 600 }}>{jam.toLocaleDateString("id-ID", { weekday: "long", day: "numeric", month: "short" })}</div>
        </div>
      </header>

      <main style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center", padding: "20px" }}>
        <div style={{ width: "100%", maxWidth: 650 }}>

          {!hasilScan ? (
            <div className="glass-card" style={{ padding: "60px 40px", textAlign: "center" }}>
              <RadarPing active={scanning} color="#B8943F" />
              <h2 style={{ marginTop: 40, fontSize: 22, fontWeight: 900 }}>{scanning ? "Menunggu Tap Kartu..." : "NFC Siap Mulai"}</h2>
              <p style={{ color: "rgba(250,248,243,0.4)", fontSize: 14, marginBottom: 32 }}>Tempelkan Kartu Warga / e-KTP untuk cek status zakat keluarga.</p>
              
              {!scanning ? (
                <button onClick={startNFC} style={{ padding: "16px 32px", borderRadius: 12, background: "linear-gradient(135deg, #B8943F, #D4AC5A)", color: "#1A1410", border: "none", fontSize: 15, fontWeight: 900, cursor: "pointer", boxShadow: "0 10px 30px rgba(184,148,63,0.3)" }}>MULAI SCAN KARTU</button>
              ) : (
                <button onClick={stopNFC} style={{ padding: "12px 24px", borderRadius: 10, background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.1)", color: "#FAF8F3", cursor: "pointer" }}>Hentikan</button>
              )}
            </div>
          ) : (
            <div className="glass-card" style={{ padding: 40, animation: "pop-in 0.4s ease" }}>
               <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 32 }}>
                  <div>
                    <div style={{ fontSize: 11, fontWeight: 800, color: "#B8943F", letterSpacing: "0.1em", marginBottom: 4 }}>DATA KELUARGA</div>
                    <div style={{ fontSize: 28, fontWeight: 900 }}>{hasilScan.kepala}</div>
                    <div style={{ fontSize: 14, color: "rgba(250,248,243,0.5)", marginTop: 4 }}>RT {hasilScan.rt} · <strong>{hasilScan.jiwa} Jiwa</strong> Terdaftar</div>
                  </div>
                  <button onClick={() => setHasilScan(null)} style={{ background: "rgba(255,255,255,0.05)", border: "none", color: "white", width: 40, height: 40, borderRadius: "50%", cursor: "pointer" }}>✕</button>
               </div>

               {/* SEKSI 1: KEWAJIBAN SETOR */}
               <div style={{ background: "rgba(255,255,255,0.03)", padding: 24, borderRadius: 20, border: "1px solid rgba(255,255,255,0.05)", marginBottom: 20 }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
                    <span style={{ fontSize: 13, fontWeight: 800, opacity: 0.6 }}>OBLIGASI ZAKAT FITRAH</span>
                    <span style={{ 
                      background: hasilScan.statusBayar ? "rgba(47,143,78,0.15)" : "rgba(139,32,32,0.15)", 
                      color: hasilScan.statusBayar ? "#4FBF7E" : "#FF8A8A",
                      padding: "4px 12px", borderRadius: 99, fontSize: 11, fontWeight: 900
                    }}>
                      {hasilScan.statusBayar ? "✅ LUNAS" : "⚠️ BELUM SETOR"}
                    </span>
                  </div>

                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
                    <div>
                      <div style={{ fontSize: 10, color: "rgba(250,248,243,0.4)", fontWeight: 700, marginBottom: 4 }}>WAJIB BERAS</div>
                      <div style={{ fontSize: 20, fontWeight: 900 }}>{(hasilScan.jiwa * 2.5).toFixed(1)} kg</div>
                    </div>
                    <div>
                      <div style={{ fontSize: 10, color: "rgba(250,248,243,0.4)", fontWeight: 700, marginBottom: 4 }}>ATAU UANG</div>
                      <div style={{ fontSize: 20, fontWeight: 900 }}>Rp {(hasilScan.jiwa * 2.5 * HARGA_BERAS).toLocaleString("id-ID")}</div>
                    </div>
                  </div>

                  {hasilScan.statusBayar && (
                    <div style={{ marginTop: 16, paddingTop: 16, borderTop: "1px solid rgba(255,255,255,0.05)", fontSize: 12, color: "#4FBF7E", fontWeight: 600 }}>
                      Diterima oleh Amil pada {new Date(hasilScan.statusBayar.tgl_bayar).toLocaleDateString("id-ID")}
                    </div>
                  )}
               </div>

               {/* SEKSI 2: HAK TERIMA (MUSTAHIQ) */}
               {hasilScan.isMustahiq && (
                 <div style={{ background: "linear-gradient(135deg, rgba(184,148,63,0.1), rgba(184,148,63,0.02))", padding: 24, borderRadius: 20, border: "1px solid rgba(184,148,63,0.3)" }}>
                    <div style={{ display: "flex", gap: 12, alignItems: "center", marginBottom: 16 }}>
                       <span style={{ fontSize: 20 }}>🤲</span>
                       <span style={{ fontSize: 13, fontWeight: 800, color: "#B8943F" }}>ESTIMASI HAK TERIMA ZAKAT</span>
                    </div>
                    <p style={{ fontSize: 13, color: "rgba(250,248,243,0.6)", lineHeight: 1.5, marginBottom: 16 }}>
                      Anda terdaftar sebagai asnaf <strong>{hasilScan.kategori_mustahiq?.toUpperCase()}</strong>. Berdasarkan jatah per jiwa tahun ini, keluarga Anda diperkirakan menerima:
                    </p>
                    <div style={{ display: "flex", alignItems: "baseline", gap: 8 }}>
                       <div style={{ fontSize: 36, fontWeight: 900, color: "#B8943F" }}>{(hasilScan.jiwa * JATAH_DISTRIBUSI_DEFAULT).toFixed(1)}</div>
                       <div style={{ fontSize: 16, fontWeight: 800, opacity: 0.6 }}>kg Beras</div>
                    </div>
                    <div style={{ marginTop: 12, fontSize: 11, color: "rgba(184,148,63,0.7)", fontWeight: 600, fontStyle: "italic" }}>
                      * Jatah resmi akan dibagikan oleh panitia DKM menjelang Idul Fitri.
                    </div>
                 </div>
               )}

               {!hasilScan.isMustahiq && (
                 <p style={{ textAlign: "center", fontSize: 11, color: "rgba(250,248,243,0.3)", marginTop: 12 }}>
                    Data ini bersifat transparan untuk kepentingan pengelolaan zakat desa.
                 </p>
               )}
            </div>
          )}

        </div>
      </main>
    </div>
  );
}