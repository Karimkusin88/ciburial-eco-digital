"use client";
import { useState, useEffect, useRef } from "react";
import { supabase, isSupabaseReady } from "@/lib/supabase";

interface Jadwal { id:string; tanggal:string; rt:string; jam_mulai:string; }
interface Absensi { id:string; jadwal_id:string; kk_id:string; nama:string; waktu_tap:string; metode:string; status:string; }

const POIN_RONDA = 30;
const JAM_RONDA = "21:00";

// --- Animasi dan Latar Belakang Futuristis ---
function SciFiBackground() {
  return (
    <>
      <div style={{ position: "fixed", inset: 0, background: "#050A0E", zIndex: 0 }} />
      {/* Grid pattern */}
      <div style={{ position: "fixed", inset: 0, backgroundSize: "50px 50px", backgroundImage: "linear-gradient(to right, rgba(16, 185, 129, 0.03) 1px, transparent 1px), linear-gradient(to bottom, rgba(16, 185, 129, 0.03) 1px, transparent 1px)", zIndex: 0, pointerEvents: "none", transform: "perspective(500px) rotateX(60deg) scale(2) translateY(-100px)", transformOrigin: "top center", opacity: 0.6 }} />
      {/* Glowing Orbs */}
      <div style={{ position: "fixed", top: "-10%", left: "-10%", width: "50vw", height: "50vw", background: "radial-gradient(circle, rgba(16,185,129,0.15) 0%, transparent 60%)", zIndex: 0, filter: "blur(40px)" }} />
      <div style={{ position: "fixed", bottom: "-20%", right: "-10%", width: "60vw", height: "60vw", background: "radial-gradient(circle, rgba(14,165,233,0.1) 0%, transparent 60%)", zIndex: 0, filter: "blur(60px)" }} />
    </>
  );
}

export default function AdminRondaPage() {
  const today = new Date();
  const [bulanAktif, setBulanAktif] = useState({ y: today.getFullYear(), m: today.getMonth() });
  const [jadwal, setJadwal] = useState<Jadwal[]>([]);
  const [absensi, setAbsensi] = useState<Absensi[]>([]);
  const [kkList, setKkList] = useState<any[]>([]);
  const [anggotaList, setAnggotaList] = useState<any[]>([]);
  const [tanggalAktif, setTanggalAktif] = useState<string>("");
  const [jadwalAktif, setJadwalAktif] = useState<string | null>(null);
  const [scanning, setScanning] = useState(false);
  const [lastScan, setLastScan] = useState<{ nama: string; poin: number } | null>(null);
  const [manualKK, setManualKK] = useState("");
  const [toast, setToast] = useState({ msg: "", ok: true });
  const nfcRef = useRef<any>(null);

  const jadwalAktifRef = useRef(jadwalAktif);
  useEffect(() => { jadwalAktifRef.current = jadwalAktif; }, [jadwalAktif]);
  const kkListRef = useRef(kkList);
  useEffect(() => { kkListRef.current = kkList; }, [kkList]);
  const anggotaListRef = useRef(anggotaList);
  useEffect(() => { anggotaListRef.current = anggotaList; }, [anggotaList]);

  function tampilPesan(msg: string, ok = true) {
    setToast({ msg, ok });
    setTimeout(() => setToast({ msg: "", ok: true }), 4000);
  }

  async function muatSemua() {
    if (!isSupabaseReady()) return;
    const [j, a, kk, ang] = await Promise.all([
      supabase.from("jadwal_ronda").select("*").order("tanggal", { ascending: false }).limit(60),
      supabase.from("absensi_ronda").select("*").order("waktu_tap", { ascending: false }).limit(200),
      supabase.from("keluarga").select("id,kepala_keluarga,rt,nfc_id,no_wa").order("kepala_keluarga"),
      supabase.from("anggota_kk").select("id,kk_id,nama,nfc_id,saldo_poin,hubungan").eq("hubungan", "kepala"),
    ]);
    if (j.data) setJadwal(j.data as Jadwal[]);
    if (a.data) setAbsensi(a.data as Absensi[]);
    if (kk.data) setKkList(kk.data);
    if (ang.data) setAnggotaList(ang.data);
  }

  useEffect(() => { muatSemua(); }, []);

  async function buatAtauAktifkanJadwal(tglStr: string) {
    setTanggalAktif(tglStr);
    const existing = jadwal.find(j => j.tanggal === tglStr);
    if (existing) {
      setJadwalAktif(existing.id);
      return;
    }
    const { data, error } = await supabase.from("jadwal_ronda").insert({
      tanggal: tglStr, rt: "RW08", jam_mulai: JAM_RONDA,
    }).select().single();
    if (error) return tampilPesan(`Gagal menginisialisasi server patroli: ${error.message}`, false);
    tampilPesan("Sistem Patroli Digital RW 08 Siaga.");
    await muatSemua();
    setJadwalAktif(data.id);
  }

  async function catatKehadiran(kkId: string, metode: "e-ktp" | "manual") {
    const currentJadwal = jadwalAktifRef.current;
    if (!currentJadwal) return tampilPesan("Pilih siklus waktu pada matriks kalender terlebih dahulu.", false);

    const kk = kkListRef.current.find(k => k.id === kkId || k.nfc_id === kkId);
    const anggota = anggotaListRef.current.find(a => a.kk_id === (kk?.id || kkId) || a.nfc_id === kkId);

    if (!kk && !anggota) return tampilPesan("Akses Ditolak: Data E-KTP tidak direkognisi oleh server.", false);

    const nama = kk?.kepala_keluarga || anggota?.nama || "Unknown Entity";
    const realKKId = kk?.id || anggota?.kk_id;

    if (!realKKId) return tampilPesan("Anomali identitas terdeteksi.", false);

    const { data: cekAbsen } = await supabase.from("absensi_ronda")
      .select("id").eq("jadwal_id", currentJadwal).eq("kk_id", realKKId).limit(1);
    if (cekAbsen && cekAbsen.length > 0)
      return tampilPesan(`Wujud digital ${nama} sudah teregistrasi pada sesi ini.`, false);

    await supabase.from("absensi_ronda").insert({
      jadwal_id: currentJadwal, kk_id: realKKId, nama, metode, status: "hadir",
    });

    let poinDitambah = 0;
    if (anggota?.id) {
      const saldoBaru = (anggota.saldo_poin || 0) + POIN_RONDA;
      await supabase.from("anggota_kk").update({ saldo_poin: saldoBaru }).eq("id", anggota.id);
      await supabase.from("riwayat_poin").insert({
        anggota_id: anggota.id, kk_id: realKKId,
        jumlah: POIN_RONDA, jenis: "masuk", sumber: "ronda",
        keterangan: `Sesi Patroli Digital RW 08 - Matrix ${new Date(tanggalAktif).toLocaleDateString("id-ID", { day: "numeric", month: "short", year: "numeric" })}`,
      });
      poinDitambah = POIN_RONDA;
    }

    setLastScan({ nama, poin: poinDitambah });
    tampilPesan(`Verifikasi berhasil. Selamat bertugas, ${nama}.`);
    muatSemua();
  }

  async function aktifkanNFC() {
    if (!("NDEFReader" in window)) return tampilPesan("Modul E-KTP Reader tidak terdeteksi pada perangkat ini.", false);
    try {
      const ndef = new (window as any).NDEFReader();
      nfcRef.current = ndef;
      await ndef.scan();
      setScanning(true);
      tampilPesan("Modul E-KTP Aktif. Pindai E-KTP Warga di balik perangkat.");
      ndef.addEventListener("reading", ({ serialNumber }: any) => {
        const nfcId = serialNumber.replace(/:/g, "").toUpperCase();
        catatKehadiran(nfcId, "e-ktp");
      });
    } catch { tampilPesan("Gagal menginisiasi modul reader.", false); }
  }

  function matikanNFC() {
    nfcRef.current?.stop?.();
    setScanning(false);
    tampilPesan("Modul E-KTP Dinonaktifkan.");
  }

  const tglJadwal = new Set(jadwal.map(j => j.tanggal));
  const tglAbsensi: Record<string, number> = {};
  jadwal.forEach(j => { tglAbsensi[j.tanggal] = absensi.filter(a => a.jadwal_id === j.id).length; });

  const hariPertama = new Date(bulanAktif.y, bulanAktif.m, 1).getDay();
  const jumlahHari = new Date(bulanAktif.y, bulanAktif.m + 1, 0).getDate();
  const namaBulan = new Date(bulanAktif.y, bulanAktif.m, 1).toLocaleDateString("id-ID", { month: "long", year: "numeric" });
  const hariIni = today.toISOString().split("T")[0];

  const bulanSebelum = () => setBulanAktif(b => b.m === 0 ? { y: b.y - 1, m: 11 } : { y: b.y, m: b.m - 1 });
  const bulanBerikut = () => setBulanAktif(b => b.m === 11 ? { y: b.y + 1, m: 0 } : { y: b.y, m: b.m + 1 });

  const absensiAktif = absensi.filter(a => a.jadwal_id === jadwalAktif);

  return (
    <div className="sci-fi-theme" style={{ minHeight: "100vh", fontFamily: "'Inter', sans-serif", color: "#E0F2FE", position: "relative", overflowX: "hidden" }}>
      <SciFiBackground />

      {toast.msg && (
        <div style={{ position: "fixed", top: 30, left: "50%", transform: "translateX(-50%)", background: toast.ok ? "rgba(16, 185, 129, 0.15)" : "rgba(239, 68, 68, 0.15)", backdropFilter: "blur(12px)", color: toast.ok ? "#34D399" : "#FCA5A5", padding: "16px 32px", borderRadius: 8, zIndex: 9999, fontSize: 13, fontWeight: 700, border: `1px solid ${toast.ok ? "rgba(16,185,129,0.5)" : "rgba(239,68,68,0.5)"}`, borderLeft: `4px solid ${toast.ok ? "#10B981" : "#EF4444"}`, boxShadow: `0 0 30px ${toast.ok ? "rgba(16,185,129,0.2)" : "rgba(239,68,68,0.2)"}`, textTransform: "uppercase", letterSpacing: "1px" }}>
          {toast.msg}
        </div>
      )}

      {/* Header Utama */}
      <header style={{ position: "sticky", top: 0, zIndex: 40, background: "rgba(5, 10, 14, 0.7)", backdropFilter: "blur(20px)", borderBottom: "1px solid rgba(14, 165, 233, 0.15)", padding: "0 30px", height: 75, display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 20 }}>
          <a href="/admin" style={{ color: "#7DD3FC", textDecoration: "none", fontSize: 12, fontWeight: 700, padding: "8px 20px", background: "rgba(14, 165, 233, 0.05)", border: "1px solid rgba(14, 165, 233, 0.2)", borderRadius: 4, letterSpacing: "1.5px", textTransform: "uppercase", transition: "all .2s" }} onMouseEnter={e => e.currentTarget.style.background = "rgba(14, 165, 233, 0.15)"} onMouseLeave={e => e.currentTarget.style.background = "rgba(14, 165, 233, 0.05)"}>
            [ Akses Induk ]
          </a>
          <div style={{ width: 1, height: 28, background: "rgba(14, 165, 233, 0.2)" }} />
          <div>
            <div style={{ fontWeight: 900, fontSize: 18, color: "transparent", WebkitTextStroke: "1px #38BDF8", WebkitTextFillColor: "#38BDF8", letterSpacing: "2px", textTransform: "uppercase" }}>
              Pos Ronda Digital
            </div>
            <div style={{ fontSize: 10, color: "#0284C7", textTransform: "uppercase", letterSpacing: "3px", marginTop: 2 }}>Sub-Sistem Keamanan Ciburial</div>
          </div>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <div style={{ fontSize: 11, fontWeight: 800, color: "#10B981", background: "rgba(16, 185, 129, 0.1)", border: "1px solid rgba(16, 185, 129, 0.3)", padding: "6px 16px", borderRadius: 4, letterSpacing: "1px" }}>
            XP {POIN_RONDA} / Personel
          </div>
        </div>
      </header>

      <div style={{ maxWidth: 1240, margin: "0 auto", padding: "40px 30px 100px", position: "relative", zIndex: 10 }}>

        {/* Hero Section */}
        <div style={{ marginBottom: 50, display: "flex", alignItems: "flex-end", justifyContent: "space-between" }}>
          <div>
            <h1 style={{ fontSize: "clamp(32px, 5vw, 48px)", fontWeight: 900, color: "#F0F9FF", letterSpacing: "-1px", margin: "0 0 10px", lineHeight: 1.1, textShadow: "0 0 40px rgba(56,189,248,0.3)" }}>
              Sistem Keamanan <span style={{ color: "#38BDF8" }}>Terpadu</span>
            </h1>
            <p style={{ fontSize: 15, color: "#7DD3FC", maxWidth: 600, margin: 0, lineHeight: 1.7, opacity: 0.8, letterSpacing: "0.5px" }}>
              Terminal interaktif pencatatan identitas personel jaga. Distribusi aset digital terintegrasi otomatis dengan siklus kedatangan e-KTP.
            </p>
          </div>
          <div style={{ textAlign: "right", display: "flex", flexDirection: "column", alignItems: "flex-end", gap: 8 }}>
            <div style={{ fontSize: 10, color: "#0284C7", textTransform: "uppercase", letterSpacing: "2px", display: "flex", alignItems: "center", gap: 6 }}>
              <span style={{ width: 8, height: 8, background: "#10B981", borderRadius: "50%", boxShadow: "0 0 10px #10B981", animation: "pulseGreen 2s infinite" }} />
              Koneksi Enkripsi Stabil
            </div>
            <div style={{ fontSize: 28, fontWeight: 300, color: "#38BDF8", fontFamily: "monospace", letterSpacing: "2px" }}>
              {new Date().toLocaleTimeString("en-US", { hour12: false })}
            </div>
          </div>
        </div>

        {/* Grid Layout Utama */}
        <div style={{ display: "grid", gridTemplateColumns: "380px 1fr", gap: 30, alignItems: "start", marginBottom: 50 }}>
          
          {/* MATRIKS WAKTU (Kalender) */}
          <div className="sci-fi-glass">
            <div className="sci-fi-header">Matriks Waktu Operasional</div>
            <div style={{ padding: 24 }}>
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 24, padding: "0 10px" }}>
                <button onClick={bulanSebelum} className="sci-fi-btn-sm">&lt; PREV</button>
                <div style={{ fontSize: 14, fontWeight: 800, color: "#F0F9FF", letterSpacing: "2px", textTransform: "uppercase" }}>{namaBulan}</div>
                <button onClick={bulanBerikut} className="sci-fi-btn-sm">NEXT &gt;</button>
              </div>

              <div style={{ display: "grid", gridTemplateColumns: "repeat(7,1fr)", gap: 6, marginBottom: 12 }}>
                {["Min","Sen","Sel","Rab","Kam","Jum","Sab"].map(h => (
                  <div key={h} style={{ textAlign: "center", fontSize: 10, fontWeight: 800, color: "#0284C7", textTransform: "uppercase", paddingBottom: 4 }}>{h}</div>
                ))}
              </div>

              <div style={{ display: "grid", gridTemplateColumns: "repeat(7,1fr)", gap: 8 }}>
                {Array.from({ length: hariPertama === 0 ? 6 : hariPertama - 1 }).map((_, i) => <div key={`e${i}`} />)}
                {Array.from({ length: jumlahHari }, (_, i) => {
                  const tgl = i + 1;
                  const tglStr = `${bulanAktif.y}-${String(bulanAktif.m + 1).padStart(2, "0")}-${String(tgl).padStart(2, "0")}`;
                  const sudahAda = tglJadwal.has(tglStr);
                  const jumlahHadir = tglAbsensi[tglStr] || 0;
                  const isHariIni = tglStr === hariIni;
                  const isAktif = tglStr === tanggalAktif;

                  let boxClass = "sci-fi-date ";
                  if (isAktif) boxClass += "active";
                  else if (sudahAda) boxClass += "has-data";
                  else if (isHariIni) boxClass += "today";

                  return (
                    <button key={tgl} onClick={() => buatAtauAktifkanJadwal(tglStr)} className={boxClass}>
                      <span style={{ position: "relative", zIndex: 2 }}>{tgl}</span>
                      {sudahAda && <span className="data-indicator">{jumlahHadir}</span>}
                    </button>
                  );
                })}
              </div>
            </div>
          </div>

          {/* TERMINAL OPERASI (Scanner & Log) */}
          <div style={{ display: "flex", flexDirection: "column", gap: 30 }}>
            
            {!tanggalAktif ? (
              <div className="sci-fi-glass" style={{ height: "100%", display: "flex", flexDirection: "column", justifyContent: "center", alignItems: "center", padding: 60, textAlign: "center" }}>
                <div style={{ width: 80, height: 80, border: "2px dashed rgba(14, 165, 233, 0.3)", borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center", marginBottom: 24, animation: "spinSlow 10s linear infinite" }}>
                  <div style={{ width: 40, height: 40, border: "2px solid #0EA5E9", borderRadius: "50%", borderTopColor: "transparent" }} />
                </div>
                <div style={{ fontSize: 16, fontWeight: 700, color: "#38BDF8", letterSpacing: "2px", textTransform: "uppercase", marginBottom: 12 }}>Menunggu Sekuens Waktu</div>
                <div style={{ fontSize: 13, color: "#7DD3FC", maxWidth: 400, lineHeight: 1.6, opacity: 0.7 }}>
                  Klik salah satu koordinat tanggal pada Matriks Waktu Operasional untuk membuka sesi pemindaian pos ronda.
                </div>
              </div>
            ) : (
              <>
                {/* Modul Scanner */}
                <div className="sci-fi-glass">
                  <div className="sci-fi-header" style={{ display: "flex", justifyContent: "space-between" }}>
                    <span>Terminal Rekognisi Identitas</span>
                    <span style={{ color: "#BAE6FD" }}>SEQ: {tanggalAktif.replace(/-/g, "")}</span>
                  </div>

                  <div style={{ padding: 30, display: "grid", gridTemplateColumns: "1fr 1fr", gap: 40 }}>
                    
                    {/* E-KTP Scanner */}
                    <div style={{ background: "rgba(5, 10, 14, 0.5)", border: `1px solid ${scanning ? "#10B981" : "rgba(14, 165, 233, 0.2)"}`, borderRadius: 8, padding: 30, textAlign: "center", transition: "all .4s", position: "relative", overflow: "hidden", boxShadow: scanning ? "inset 0 0 50px rgba(16,185,129,0.1), 0 0 30px rgba(16,185,129,0.2)" : "none" }}>
                      {scanning && <div className="scanner-sweep" />}
                      
                      <div style={{ fontSize: 11, fontWeight: 800, color: scanning ? "#34D399" : "#38BDF8", textTransform: "uppercase", letterSpacing: "2px", marginBottom: 24 }}>
                        {scanning ? "Memindai Frekuensi E-KTP..." : "Modul Tap E-KTP Pasif"}
                      </div>
                      
                      {/* E-KTP Card Visualization */}
                      <div style={{ width: 140, height: 90, margin: "0 auto 30px", border: `2px solid ${scanning ? "#10B981" : "rgba(56, 189, 248, 0.3)"}`, borderRadius: 8, position: "relative", background: "rgba(14, 165, 233, 0.05)", display: "flex", alignItems: "center", justifyContent: "center" }}>
                        <div style={{ position: "absolute", top: 10, left: 10, width: 20, height: 25, border: "1px solid rgba(56,189,248,0.5)", borderRadius: 2 }} />
                        <div style={{ position: "absolute", top: 10, left: 40, width: 60, height: 4, background: "rgba(56,189,248,0.3)" }} />
                        <div style={{ position: "absolute", top: 20, left: 40, width: 40, height: 4, background: "rgba(56,189,248,0.3)" }} />
                        <div style={{ fontSize: 10, color: scanning ? "#10B981" : "#0284C7", fontWeight: 900, textTransform: "uppercase", letterSpacing: "1px" }}>E-KTP</div>
                      </div>

                      {lastScan && (
                        <div style={{ fontSize: 13, fontWeight: 700, color: "#10B981", marginBottom: 20, background: "rgba(16, 185, 129, 0.1)", padding: "8px 0", borderTop: "1px solid rgba(16,185,129,0.3)", borderBottom: "1px solid rgba(16,185,129,0.3)", letterSpacing: "1px" }}>
                          &gt; {lastScan.nama} [+XP]
                        </div>
                      )}

                      <button onClick={scanning ? matikanNFC : aktifkanNFC} className={scanning ? "sci-fi-btn-danger" : "sci-fi-btn-primary"} style={{ width: "100%" }}>
                        {scanning ? "[ MATIKAN MODUL PEMINDAI ]" : "[ AKTIFKAN SENSOR E-KTP ]"}
                      </button>
                    </div>

                    {/* Override Manual */}
                    <div style={{ display: "flex", flexDirection: "column", borderLeft: "1px solid rgba(14, 165, 233, 0.1)", paddingLeft: 40 }}>
                      <div style={{ fontSize: 11, fontWeight: 800, color: "#38BDF8", textTransform: "uppercase", letterSpacing: "2px", marginBottom: 24 }}>
                        Protokol Override Manual
                      </div>
                      
                      <div style={{ flex: 1 }}>
                        <select value={manualKK} onChange={e => setManualKK(e.target.value)}
                          className="sci-fi-select" style={{ width: "100%", marginBottom: 20 }}>
                          <option value="">-- Pilih Akses Personel --</option>
                          {kkList.map(k => <option key={k.id} value={k.id}>{k.kepala_keluarga} (Node {k.rt})</option>)}
                        </select>
                        <ul style={{ listStyle: "none", padding: 0, margin: 0, fontSize: 12, color: "#7DD3FC", opacity: 0.6, lineHeight: 1.8 }}>
                          <li>&gt; Enkripsi koneksi diamankan</li>
                          <li>&gt; Otorisasi Admin dibutuhkan</li>
                          <li>&gt; Sistem poin akan disinkronisasi</li>
                        </ul>
                      </div>

                      <button onClick={() => { if (manualKK) { catatKehadiran(manualKK, "manual"); setManualKK(""); } }}
                        disabled={!manualKK} className="sci-fi-btn-secondary" style={{ width: "100%" }}>
                        EXECUTE OVERRIDE
                      </button>
                    </div>
                  </div>
                </div>

                {/* LOG KEHADIRAN */}
                <div className="sci-fi-glass" style={{ display: "flex", flexDirection: "column", height: 350 }}>
                  <div className="sci-fi-header" style={{ display: "flex", justifyContent: "space-between" }}>
                    <span>Sistem Rekam Jejak Kehadiran</span>
                    <span style={{ color: "#34D399" }}>ENTITAS TERDETEKSI: {absensiAktif.length}</span>
                  </div>
                  <div style={{ flex: 1, padding: 20, overflowY: "auto" }} className="sci-fi-scrollbar">
                    {absensiAktif.length === 0 ? (
                      <div style={{ height: "100%", display: "flex", alignItems: "center", justifyContent: "center", color: "rgba(56, 189, 248, 0.3)", fontSize: 13, textTransform: "uppercase", letterSpacing: "2px", fontWeight: 700 }}>
                        <span className="blinking-cursor">_</span> AREA INI KOSONG. MENUNGGU INPUT.
                      </div>
                    ) : (
                      <table style={{ width: "100%", borderCollapse: "collapse", textAlign: "left" }}>
                        <thead>
                          <tr>
                            <th style={{ padding: "0 0 16px 16px", color: "#0284C7", fontSize: 10, textTransform: "uppercase", letterSpacing: "1px", borderBottom: "1px solid rgba(14, 165, 233, 0.2)" }}>Timestamp</th>
                            <th style={{ padding: "0 0 16px", color: "#0284C7", fontSize: 10, textTransform: "uppercase", letterSpacing: "1px", borderBottom: "1px solid rgba(14, 165, 233, 0.2)" }}>Identitas Warga</th>
                            <th style={{ padding: "0 0 16px", color: "#0284C7", fontSize: 10, textTransform: "uppercase", letterSpacing: "1px", borderBottom: "1px solid rgba(14, 165, 233, 0.2)" }}>Sistem Validasi</th>
                            <th style={{ padding: "0 16px 16px 0", textAlign: "right", color: "#0284C7", fontSize: 10, textTransform: "uppercase", letterSpacing: "1px", borderBottom: "1px solid rgba(14, 165, 233, 0.2)" }}>Aset Distribusi</th>
                          </tr>
                        </thead>
                        <tbody>
                          {absensiAktif.map((a, i) => (
                            <tr key={a.id} style={{ borderBottom: "1px solid rgba(14, 165, 233, 0.05)", background: i % 2 === 0 ? "rgba(14, 165, 233, 0.02)" : "transparent", transition: "background .2s" }}>
                              <td style={{ padding: "16px", fontSize: 12, color: "#7DD3FC", fontFamily: "monospace" }}>
                                {new Date(a.waktu_tap).toLocaleTimeString("id-ID", { hour: "2-digit", minute: "2-digit", second: "2-digit" })}
                              </td>
                              <td style={{ padding: "16px 0", fontSize: 14, fontWeight: 700, color: "#F0F9FF" }}>{a.nama}</td>
                              <td style={{ padding: "16px 0", fontSize: 11, color: "#38BDF8", textTransform: "uppercase", letterSpacing: "1px" }}>
                                {a.metode === "e-ktp" ? "[ E-KTP Scanner ]" : "[ Manual Admin ]"}
                              </td>
                              <td style={{ padding: "16px 16px 16px 0", textAlign: "right", fontSize: 12, fontWeight: 900, color: "#10B981" }}>+{POIN_RONDA} XP</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    )}
                  </div>
                </div>
              </>
            )}
          </div>
        </div>

        {/* ── Panduan Sistem Protokol Siber di Bawah ── */}
        <div className="sci-fi-glass" style={{ padding: 40, borderLeft: "4px solid #38BDF8" }}>
          <div style={{ fontSize: 18, fontWeight: 800, color: "#E0F2FE", textTransform: "uppercase", letterSpacing: "2px", marginBottom: 30, display: "flex", alignItems: "center", gap: 14 }}>
            <span>/ / Protokol Inisiasi Keamanan Digital</span>
            <div style={{ height: 1, flex: 1, background: "linear-gradient(90deg, rgba(56, 189, 248, 0.5), transparent)" }} />
          </div>
          
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))", gap: 40 }}>
            <div>
              <div style={{ fontSize: 10, fontWeight: 900, color: "#0284C7", marginBottom: 10, letterSpacing: "3px" }}>FASE 01</div>
              <div style={{ fontSize: 15, fontWeight: 700, color: "#38BDF8", marginBottom: 10, textTransform: "uppercase", letterSpacing: "1px" }}>Pemilihan Koordinat Waktu</div>
              <div style={{ fontSize: 13, color: "#7DD3FC", lineHeight: 1.8, opacity: 0.8 }}>Klik sebuah sektor matriks waktu di panel sebelah kiri. Sistem pusat akan otomatis mengkompilasi environment pencatatan ronda untuk lingkungan RW 08.</div>
            </div>
            <div>
              <div style={{ fontSize: 10, fontWeight: 900, color: "#0284C7", marginBottom: 10, letterSpacing: "3px" }}>FASE 02</div>
              <div style={{ fontSize: 15, fontWeight: 700, color: "#38BDF8", marginBottom: 10, textTransform: "uppercase", letterSpacing: "1px" }}>Pemindaian E-KTP Fisik</div>
              <div style={{ fontSize: 13, color: "#7DD3FC", lineHeight: 1.8, opacity: 0.8 }}>Aktifkan modul sensor pada terminal atau input manual nama personel. Warga dapat melakukan tap menggunakan e-KTP valid mereka pada zona pemindaian.</div>
            </div>
            <div>
              <div style={{ fontSize: 10, fontWeight: 900, color: "#0284C7", marginBottom: 10, letterSpacing: "3px" }}>FASE 03</div>
              <div style={{ fontSize: 15, fontWeight: 700, color: "#38BDF8", marginBottom: 10, textTransform: "uppercase", letterSpacing: "1px" }}>Distribusi Aset Kripto</div>
              <div style={{ fontSize: 13, color: "#7DD3FC", lineHeight: 1.8, opacity: 0.8 }}>Sistem akan secara seketika mentransmisikan saldo Poin (XP) kepada akun digital keluarga. Kehadiran akan terekam abadi di dalam log sistem keamanan terpadu.</div>
            </div>
          </div>
        </div>

      </div>

      <style>{`
        /* Global CSS untuk Tema Sci-Fi */
        .sci-fi-glass {
          background: rgba(5, 12, 18, 0.6);
          backdrop-filter: blur(25px);
          border: 1px solid rgba(14, 165, 233, 0.2);
          border-radius: 4px;
          box-shadow: 0 10px 40px rgba(0, 0, 0, 0.5), inset 0 0 20px rgba(14, 165, 233, 0.05);
          position: relative;
        }
        .sci-fi-glass::before {
          content: ''; position: absolute; top: 0; left: 0; width: 20px; height: 2px; background: #38BDF8;
        }
        .sci-fi-glass::after {
          content: ''; position: absolute; bottom: 0; right: 0; width: 20px; height: 2px; background: #38BDF8;
        }

        .sci-fi-header {
          padding: 16px 24px;
          border-bottom: 1px solid rgba(14, 165, 233, 0.2);
          background: rgba(2, 132, 199, 0.1);
          font-size: 11px;
          font-weight: 800;
          color: #38BDF8;
          letter-spacing: 2px;
          text-transform: uppercase;
        }

        /* Tombol & Navigasi */
        .sci-fi-btn-sm {
          background: transparent;
          border: 1px solid rgba(14, 165, 233, 0.3);
          color: #38BDF8;
          padding: 6px 12px;
          font-size: 10px;
          font-weight: 800;
          letter-spacing: 1px;
          border-radius: 2px;
          cursor: pointer;
          transition: all 0.2s;
        }
        .sci-fi-btn-sm:hover { background: rgba(14, 165, 233, 0.15); box-shadow: 0 0 10px rgba(56, 189, 248, 0.3); }

        .sci-fi-btn-primary {
          background: rgba(14, 165, 233, 0.1);
          border: 1px solid #0EA5E9;
          color: #38BDF8;
          padding: 14px;
          font-size: 12px;
          font-weight: 900;
          letter-spacing: 2px;
          border-radius: 4px;
          cursor: pointer;
          transition: all 0.2s;
          box-shadow: 0 0 20px rgba(14, 165, 233, 0.2);
        }
        .sci-fi-btn-primary:hover { background: rgba(14, 165, 233, 0.25); box-shadow: 0 0 30px rgba(14, 165, 233, 0.4); text-shadow: 0 0 10px #7DD3FC; }

        .sci-fi-btn-danger {
          background: rgba(239, 68, 68, 0.1);
          border: 1px solid #EF4444;
          color: #FCA5A5;
          padding: 14px;
          font-size: 12px;
          font-weight: 900;
          letter-spacing: 2px;
          border-radius: 4px;
          cursor: pointer;
          transition: all 0.2s;
          box-shadow: 0 0 20px rgba(239, 68, 68, 0.2);
        }
        .sci-fi-btn-danger:hover { background: rgba(239, 68, 68, 0.2); box-shadow: 0 0 30px rgba(239, 68, 68, 0.4); }

        .sci-fi-btn-secondary {
          background: transparent;
          border: 1px dashed rgba(14, 165, 233, 0.4);
          color: #7DD3FC;
          padding: 14px;
          font-size: 12px;
          font-weight: 900;
          letter-spacing: 2px;
          border-radius: 4px;
          cursor: pointer;
          transition: all 0.2s;
        }
        .sci-fi-btn-secondary:hover:not(:disabled) { background: rgba(14, 165, 233, 0.1); border-style: solid; box-shadow: inset 0 0 10px rgba(14, 165, 233, 0.2); }
        .sci-fi-btn-secondary:disabled { opacity: 0.3; cursor: not-allowed; }

        /* Matriks Kalender */
        .sci-fi-date {
          aspect-ratio: 1;
          background: rgba(5, 10, 14, 0.6);
          border: 1px solid rgba(14, 165, 233, 0.1);
          color: #7DD3FC;
          font-size: 13px;
          font-weight: 600;
          border-radius: 4px;
          cursor: pointer;
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          transition: all 0.2s;
          position: relative;
          overflow: hidden;
        }
        .sci-fi-date:hover { border-color: rgba(56, 189, 248, 0.5); background: rgba(14, 165, 233, 0.15); box-shadow: 0 0 15px rgba(14, 165, 233, 0.2); }
        .sci-fi-date.today { border: 1px dashed rgba(56, 189, 248, 0.6); color: #38BDF8; font-weight: 800; }
        .sci-fi-date.has-data { background: rgba(16, 185, 129, 0.05); border-color: rgba(16, 185, 129, 0.3); color: #34D399; }
        .sci-fi-date.active { background: rgba(14, 165, 233, 0.2); border-color: #38BDF8; color: #fff; text-shadow: 0 0 10px #7DD3FC; box-shadow: inset 0 0 20px rgba(14, 165, 233, 0.3); font-weight: 900; }
        .data-indicator { position: absolute; bottom: 4px; right: 6px; font-size: 9px; color: #10B981; font-weight: 800; letter-spacing: 1px; }

        /* Input Select */
        .sci-fi-select {
          background: rgba(2, 132, 199, 0.1);
          border: 1px solid rgba(14, 165, 233, 0.3);
          color: #F0F9FF;
          padding: 12px 16px;
          border-radius: 4px;
          font-size: 13px;
          outline: none;
          font-family: inherit;
        }
        .sci-fi-select:focus { border-color: #38BDF8; box-shadow: 0 0 15px rgba(14, 165, 233, 0.3); }
        .sci-fi-select option { background: #050A0E; color: #7DD3FC; }

        /* Scrollbar */
        .sci-fi-scrollbar::-webkit-scrollbar { width: 4px; }
        .sci-fi-scrollbar::-webkit-scrollbar-track { background: rgba(5, 10, 14, 0.8); }
        .sci-fi-scrollbar::-webkit-scrollbar-thumb { background: rgba(14, 165, 233, 0.4); border-radius: 2px; }

        /* Animasi */
        @keyframes pulseGreen { 0%,100%{opacity:1} 50%{opacity:.4} }
        @keyframes spinSlow { from{transform:rotate(0deg)} to{transform:rotate(360deg)} }
        @keyframes sweepLine { 0%{top:0;opacity:0} 10%{opacity:1} 90%{opacity:1} 100%{top:100%;opacity:0} }
        .scanner-sweep {
          position: absolute; left: 0; right: 0; top: 0; height: 2px;
          background: #10B981; box-shadow: 0 0 20px 2px #10B981;
          animation: sweepLine 2.5s linear infinite; z-index: 10;
        }
        .blinking-cursor { animation: blink 1s step-end infinite; }
        @keyframes blink { 0%,100%{opacity:1} 50%{opacity:0} }
      `}</style>
    </div>
  );
}
