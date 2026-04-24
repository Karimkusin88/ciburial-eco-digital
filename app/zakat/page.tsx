"use client";
import { useState, useEffect, useRef } from "react";
import { supabase, isSupabaseReady } from "@/lib/supabase";

const TAHUN_INI = new Date().getFullYear();
const HARGA_BERAS = 15000;

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

// ─── CARA KERJA ──────────────────────────────────────────────────────────────
function CaraKerja() {
  const steps = [
    { i: "01", t: "TEMPEL KARTU", d: "Tempelkan e-KTP atau NFC Kartu Warga." },
    { i: "02", t: "CEK STATUS", d: "Sistem cek otomatis status Muzakki/Mustahiq." },
    { i: "03", t: "INFO TAGIHAN", d: "Tampil status pembayaran Zakat Fitrah tahun ini." },
    { i: "04", t: "PENYALURAN", d: "Penyaluran zakat langsung tercatat & transparan." },
  ];
  return (
    <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(180px,1fr))", gap: 14, marginTop: 24 }}>
      {steps.map(s => (
        <div key={s.i} className="glass-card" style={{ padding: 18, border: "1px solid rgba(184,148,63,0.15)", background: "rgba(255,255,255,0.03)" }}>
          <div style={{ fontSize: 9, fontWeight: 900, color: "#B8943F", marginBottom: 6, opacity: 0.8 }}>LANGKAH {s.i}</div>
          <div style={{ fontSize: 13, fontWeight: 800, color: "#FAF8F3", marginBottom: 4 }}>{s.t}</div>
          <div style={{ fontSize: 11, color: "rgba(250,248,243,0.4)", fontWeight: 500, lineHeight: 1.5 }}>{s.d}</div>
        </div>
      ))}
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
      golongan: kk.golongan_zakat, // muzakki / mustahiq
      kategori_mustahiq: kk.kategori_mustahiq,
      statusBayar: statusBayar || null
    });
  }

  async function startNFC() {
    if (!("NDEFReader" in window)) {
      showToast("Browser tidak support NFC. (Gunakan Chrome Android)", false);
      // Mode simulasi untuk testing desktop:
      // const randomKK = kkList[Math.floor(Math.random() * kkList.length)];
      // if (randomKK) prosesTap(randomKK.nfc_id || randomKK.id);
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
    } catch { showToast("Gagal aktifkan NFC. Pastikan NFC menyala.", false); }
  }

  function stopNFC() {
    try { nfcRef.current?.stop?.(); } catch {}
    setScanning(false);
  }

  // Calculate global stats
  const totalTerkumpul = zakatList.length;
  const targetMuzakki = kkList.filter(k => k.golongan_zakat === "muzakki").length;

  return (
    <div style={{
      minHeight: "100vh",
      background: "#081014",
      fontFamily: "'Inter', system-ui, sans-serif",
      color: "#FAF8F3",
      display: "flex",
      flexDirection: "column",
      overflow: "hidden",
      position: "relative",
    }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800;900&display=swap');
        @keyframes ping { 75%, 100% { transform: scale(3.5); opacity: 0; } }
        @keyframes sweep { to { transform: rotate(360deg); } }
        @keyframes slide-up { from { transform:translateY(14px); opacity:0 } to { transform:translateY(0); opacity:1 } }
        @keyframes pop-in { 0% { transform: scale(0.9); opacity:0 } 60% { transform: scale(1.05) } 100% { transform: scale(1); opacity:1 } }
        .glass-card { background: rgba(255,255,255,0.02); backdrop-filter: blur(12px); border-radius: 20px; }
      `}</style>

      {toast.msg && (
        <div style={{ position: "fixed", top: 20, left: "50%", transform: "translateX(-50%)", background: toast.ok ? "#2F8F4E" : "#8B2020", color: "white", padding: "12px 24px", borderRadius: 99, zIndex: 999, fontSize: 14, fontWeight: 700, boxShadow: "0 8px 30px rgba(0,0,0,0.3)", border: "1px solid rgba(255,255,255,0.1)", animation: "slide-up 0.3s ease-out" }}>
          {toast.msg}
        </div>
      )}

      {/* HEADER */}
      <header style={{ padding: "20px 32px", display: "flex", justifyContent: "space-between", alignItems: "center", borderBottom: "1px solid rgba(184,148,63,0.15)", background: "rgba(8,16,20,0.8)", backdropFilter: "blur(12px)", position: "sticky", top: 0, zIndex: 10 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
          <a href="/" style={{ width: 44, height: 44, borderRadius: 12, background: "rgba(184,148,63,0.1)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 24, textDecoration: "none", border: "1px solid rgba(184,148,63,0.2)" }}>🕌</a>
          <div>
            <div style={{ fontSize: 10, color: "#B8943F", fontWeight: 800, letterSpacing: "0.2em", textTransform: "uppercase" }}>ZAKAT FITRAH DIGITAL</div>
            <div style={{ fontSize: 18, fontWeight: 900, color: "#FAF8F3", marginTop: 2 }}>Kiosk Zakat Ciburial</div>
          </div>
        </div>
        <div style={{ textAlign: "right" }}>
          <div style={{ fontSize: 20, fontWeight: 900, color: "#FAF8F3", fontVariantNumeric: "tabular-nums" }}>
            {jam.toLocaleTimeString("id-ID", { hour: "2-digit", minute: "2-digit", second: "2-digit" })}
          </div>
          <div style={{ fontSize: 11, color: "rgba(250,248,243,0.4)", fontWeight: 600, marginTop: 4, letterSpacing: "0.05em", textTransform: "uppercase" }}>
            {jam.toLocaleDateString("id-ID", { weekday: "long", day: "numeric", month: "long" })}
          </div>
        </div>
      </header>

      <main style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center", padding: "40px 20px" }}>
        <div style={{ width: "100%", maxWidth: hasilScan ? 700 : 900, display: "flex", flexDirection: "column", gap: 32, transition: "max-width 0.4s ease" }}>

          {!hasilScan ? (
            /* =================== TAMPILAN SCANNER =================== */
            <div style={{ display: "flex", gap: 40, flexWrap: "wrap", alignItems: "center" }}>
              {/* Kolom Radar */}
              <div className="glass-card" style={{ flex: "1 1 300px", padding: "40px", border: "1px solid rgba(184,148,63,0.2)", textAlign: "center", display: "flex", flexDirection: "column", justifyContent: "center", minHeight: 400 }}>
                <RadarPing active={scanning} color="#B8943F" />
                <div style={{ marginTop: 40 }}>
                  <div style={{ fontSize: 20, fontWeight: 900, color: scanning ? "#B8943F" : "#FAF8F3", marginBottom: 8, transition: "color 0.3s" }}>
                    {scanning ? "Menunggu Tap Kartu..." : "NFC Offline"}
                  </div>
                  <div style={{ fontSize: 13, color: "rgba(250,248,243,0.4)", fontWeight: 500 }}>
                    {scanning ? "Sistem siap. Silakan tempelkan e-KTP / Kartu Warga pada belakang HP." : "Tekan tombol MULAI SENSOR NFC untuk memulai sistem Kiosk."}
                  </div>
                </div>

                {!scanning ? (
                  <button onClick={startNFC} style={{ marginTop: 32, padding: "16px 24px", borderRadius: 12, background: "linear-gradient(135deg, #B8943F, #D4AC5A)", color: "#1A1410", border: "none", fontSize: 14, fontWeight: 900, letterSpacing: "0.05em", cursor: "pointer", boxShadow: "0 8px 24px rgba(184,148,63,0.3)" }}>
                    📡 MULAI SENSOR NFC
                  </button>
                ) : (
                  <button onClick={stopNFC} style={{ marginTop: 32, padding: "14px 24px", borderRadius: 12, background: "rgba(250,248,243,0.05)", border: "1px solid rgba(250,248,243,0.2)", color: "#FAF8F3", fontSize: 13, fontWeight: 800, cursor: "pointer" }}>
                    HENTIKAN SENSOR
                  </button>
                )}
              </div>

              {/* Kolom Info */}
              <div style={{ flex: "1.5 1 400px" }}>
                <div style={{ fontSize: 11, fontWeight: 800, letterSpacing: "0.2em", color: "#B8943F", marginBottom: 12 }}>INFORMASI KIOSK</div>
                <h1 style={{ fontSize: "clamp(28px, 4vw, 42px)", fontWeight: 900, color: "#FAF8F3", lineHeight: 1.1, marginBottom: 20, letterSpacing: "-0.02em" }}>
                  Ketahui Hak & Kewajiban<br/>Zakat Fitrah Anda.
                </h1>
                
                <div style={{ display: "flex", gap: 16, marginBottom: 32 }}>
                  <div style={{ background: "rgba(184,148,63,0.1)", padding: "12px 20px", borderRadius: 12, border: "1px solid rgba(184,148,63,0.2)" }}>
                    <div style={{ fontSize: 24, fontWeight: 900, color: "#B8943F" }}>{totalTerkumpul} / {targetMuzakki || "?"}</div>
                    <div style={{ fontSize: 10, color: "rgba(250,248,243,0.5)", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.05em", marginTop: 4 }}>Keluarga Sudah Bayar ({TAHUN_INI})</div>
                  </div>
                </div>

                <CaraKerja />
              </div>
            </div>
          ) : (
            /* =================== TAMPILAN HASIL SCAN =================== */
            <div className="glass-card" style={{ padding: 48, border: "1px solid rgba(184,148,63,0.3)", animation: "pop-in 0.4s cubic-bezier(0.22, 1, 0.36, 1)", position: "relative", overflow: "hidden" }}>
              <button onClick={() => setHasilScan(null)} style={{ position: "absolute", top: 24, right: 24, width: 40, height: 40, borderRadius: "50%", background: "rgba(250,248,243,0.1)", border: "none", color: "#FAF8F3", fontSize: 20, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center" }}>✕</button>

              {hasilScan.error ? (
                <div style={{ textAlign: "center", padding: "20px 0" }}>
                  <div style={{ fontSize: 64, marginBottom: 24 }}>🚫</div>
                  <h2 style={{ fontSize: 28, fontWeight: 900, color: "#8B2020", marginBottom: 12 }}>Kartu Tidak Dikenali</h2>
                  <p style={{ color: "rgba(250,248,243,0.6)", fontSize: 15, lineHeight: 1.6 }}>{hasilScan.error}</p>
                </div>
              ) : (
                <>
                  <div style={{ display: "flex", alignItems: "center", gap: 20, marginBottom: 40, paddingBottom: 24, borderBottom: "1px solid rgba(250,248,243,0.1)" }}>
                    <div style={{ width: 72, height: 72, borderRadius: "50%", background: "rgba(184,148,63,0.1)", border: "2px solid #B8943F", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 32 }}>👤</div>
                    <div>
                      <div style={{ fontSize: 12, fontWeight: 700, color: "#B8943F", letterSpacing: "0.1em", marginBottom: 6 }}>INFORMASI WARGA</div>
                      <div style={{ fontSize: 24, fontWeight: 900, color: "#FAF8F3" }}>{hasilScan.nama}</div>
                      <div style={{ fontSize: 13, color: "rgba(250,248,243,0.5)", fontWeight: 500, marginTop: 4 }}>KK: {hasilScan.kepala} · RT {hasilScan.rt}</div>
                    </div>
                  </div>

                  <div style={{ textAlign: "center" }}>
                    <div style={{ fontSize: 12, fontWeight: 800, color: "rgba(250,248,243,0.4)", letterSpacing: "0.15em", marginBottom: 12 }}>STATUS GOLONGAN ZAKAT</div>
                    
                    {hasilScan.golongan === "mustahiq" ? (
                      <div style={{ background: "rgba(28,107,58,0.1)", padding: 32, borderRadius: 20, border: "1px solid rgba(47,143,78,0.3)" }}>
                        <div style={{ fontSize: 48, marginBottom: 16 }}>🤲</div>
                        <h2 style={{ fontSize: 28, fontWeight: 900, color: "#4FBF7E", marginBottom: 12 }}>Anda Berhak Menerima Zakat</h2>
                        <p style={{ fontSize: 15, color: "rgba(250,248,243,0.7)", lineHeight: 1.6, maxWidth: 500, margin: "0 auto" }}>
                          Berdasarkan data DKM, Anda terdaftar sebagai asnaf <strong>{hasilScan.kategori_mustahiq?.toUpperCase() || "MUSTAHIQ"}</strong>. Silakan hubungi Amil / Panitia Zakat di Masjid untuk pengambilan hak Anda tahun ini.
                        </p>
                      </div>
                    ) : (
                      <div>
                        {hasilScan.statusBayar ? (
                          <div style={{ background: "rgba(47,143,78,0.1)", padding: 32, borderRadius: 20, border: "1px solid rgba(47,143,78,0.3)" }}>
                            <div style={{ fontSize: 48, marginBottom: 16 }}>✅</div>
                            <h2 style={{ fontSize: 28, fontWeight: 900, color: "#4FBF7E", marginBottom: 12 }}>Zakat Fitrah {TAHUN_INI} Lunas!</h2>
                            <p style={{ fontSize: 15, color: "rgba(250,248,243,0.7)", lineHeight: 1.6, maxWidth: 500, margin: "0 auto", marginBottom: 20 }}>
                              Terima kasih. Anda telah menunaikan Zakat Fitrah pada {new Date(hasilScan.statusBayar.tgl_bayar).toLocaleDateString("id-ID")}. Semoga menjadi pembersih jiwa dan pahala berlipat ganda.
                            </p>
                            <div style={{ display: "inline-block", background: "rgba(0,0,0,0.2)", padding: "12px 24px", borderRadius: 12, fontWeight: 800, fontSize: 16, color: "#FAF8F3" }}>
                              Tercatat: {hasilScan.statusBayar.jenis === "beras" ? `${hasilScan.statusBayar.nominal_kg} kg Beras` : `Rp ${hasilScan.statusBayar.nominal_uang.toLocaleString("id-ID")}`}
                            </div>
                          </div>
                        ) : (
                          <div style={{ background: "rgba(139,32,32,0.1)", padding: 32, borderRadius: 20, border: "1px solid rgba(139,32,32,0.3)" }}>
                            <div style={{ fontSize: 48, marginBottom: 16 }}>⚠️</div>
                            <h2 style={{ fontSize: 28, fontWeight: 900, color: "#FF8A8A", marginBottom: 12 }}>Zakat Fitrah {TAHUN_INI} Belum Dibayar</h2>
                            <p style={{ fontSize: 15, color: "rgba(250,248,243,0.7)", lineHeight: 1.6, maxWidth: 500, margin: "0 auto", marginBottom: 24 }}>
                              Anda terdaftar sebagai wajib zakat (Muzakki) dengan tanggungan <strong>{hasilScan.jiwa} jiwa</strong> dalam keluarga. Segera tunaikan kewajiban Anda sebelum Idul Fitri.
                            </p>
                            <div style={{ display: "flex", gap: 16, justifyContent: "center", flexWrap: "wrap" }}>
                              <div style={{ background: "rgba(0,0,0,0.2)", padding: "16px 24px", borderRadius: 12, textAlign: "center", border: "1px dashed rgba(250,248,243,0.2)" }}>
                                <div style={{ fontSize: 11, color: "rgba(250,248,243,0.5)", fontWeight: 700, marginBottom: 6 }}>BERUPA BERAS</div>
                                <div style={{ fontSize: 20, fontWeight: 900, color: "#B8943F" }}>{(hasilScan.jiwa * 2.5).toFixed(1)} kg</div>
                              </div>
                              <div style={{ background: "rgba(0,0,0,0.2)", padding: "16px 24px", borderRadius: 12, textAlign: "center", border: "1px dashed rgba(250,248,243,0.2)" }}>
                                <div style={{ fontSize: 11, color: "rgba(250,248,243,0.5)", fontWeight: 700, marginBottom: 6 }}>BERUPA UANG (Rp {HARGA_BERAS.toLocaleString()}/kg)</div>
                                <div style={{ fontSize: 20, fontWeight: 900, color: "#4FBF7E" }}>Rp {(hasilScan.jiwa * 2.5 * HARGA_BERAS).toLocaleString("id-ID")}</div>
                              </div>
                            </div>
                            <div style={{ marginTop: 24, fontSize: 13, color: "#FF8A8A", fontWeight: 700 }}>
                              Silakan setorkan kepada Amil DKM Masjid terdekat.
                            </div>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                </>
              )}
            </div>
          )}

        </div>
      </main>
    </div>
  );
}