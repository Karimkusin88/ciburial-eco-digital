"use client";
import { useState, useEffect, useRef } from "react";
import { supabase, isSupabaseReady } from "@/lib/supabase";

interface Jadwal { id:string; tanggal:string; rt:string; jam_mulai:string; }
interface Absensi { id:string; jadwal_id:string; kk_id:string; nama:string; waktu_tap:string; metode:string; status:string; keterangan?:string; }

const POIN_RONDA = 30;
const JAM_RONDA = "21:00";

// --- Motif Anyaman Bambu (SVG Background) ---
function MotifBambu({ opacity = 0.08 }: { opacity?: number }) {
  return (
    <svg style={{ position: "absolute", inset: 0, width: "100%", height: "100%", pointerEvents: "none", opacity, zIndex: 0 }} aria-hidden>
      <defs>
        <pattern id="anyaman" x="0" y="0" width="40" height="40" patternUnits="userSpaceOnUse">
          <rect width="40" height="40" fill="#F5F0E8" />
          <path d="M0 20 L40 20 M20 0 L20 40" stroke="#6B4F3A" strokeWidth="2" strokeDasharray="10 5" opacity="0.4" />
          <path d="M10 0 L10 40 M30 0 L30 40 M0 10 L40 10 M0 30 L40 30" stroke="#2D5A40" strokeWidth="1" opacity="0.15" />
        </pattern>
      </defs>
      <rect width="100%" height="100%" fill="url(#anyaman)"/>
    </svg>
  );
}

// Icon Sederhana Tanpa Emoji
function IconKtp() { return <div style={{ fontWeight: 800, fontSize: 10, letterSpacing: "1px", border: "1px solid currentColor", padding: "2px 6px", borderRadius: 4 }}>KTP</div>; }
function IconQr() { return <div style={{ fontWeight: 800, fontSize: 10, letterSpacing: "1px", border: "1px dashed currentColor", padding: "2px 6px", borderRadius: 4 }}>[QR]</div>; }
function IconManual() { return <div style={{ fontWeight: 800, fontSize: 10, letterSpacing: "1px", borderBottom: "2px solid currentColor", padding: "2px 6px" }}>TULIS</div>; }


export default function AdminRondaPage() {
  const today = new Date();
  const [bulanAktif, setBulanAktif] = useState({ y: today.getFullYear(), m: today.getMonth() });
  const [jadwal, setJadwal] = useState<Jadwal[]>([]);
  const [absensi, setAbsensi] = useState<Absensi[]>([]);
  const [kkList, setKkList] = useState<any[]>([]);
  const [anggotaList, setAnggotaList] = useState<any[]>([]);
  const [tanggalAktif, setTanggalAktif] = useState<string>("");
  const [jadwalAktif, setJadwalAktif] = useState<string | null>(null);
  
  // UI States
  const [metodeAktif, setMetodeAktif] = useState<"ektp"|"qr"|"manual">("ektp");
  const [scanningEktp, setScanningEktp] = useState(false);
  const [scanningQr, setScanningQr] = useState(false);
  const [manualKK, setManualKK] = useState("");
  const [lastScan, setLastScan] = useState<{ nama: string; poin: number } | null>(null);
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
      tanggal: tglStr, rt: "RW 08", jam_mulai: JAM_RONDA,
    }).select().single();
    if (error) return tampilPesan(`Punten, gagal membuat jadwal: ${error.message}`, false);
    tampilPesan("Jadwal piket ronda berhasil disiapkan.");
    await muatSemua();
    setJadwalAktif(data.id);
  }

  async function catatKehadiran(kkId: string, metode: "e-ktp" | "manual") {
    const currentJadwal = jadwalAktifRef.current;
    if (!currentJadwal) return tampilPesan("Pilih jadwal di kalender terlebih dahulu, kang.", false);

    const kk = kkListRef.current.find(k => k.id === kkId || k.nfc_id === kkId);
    const anggota = anggotaListRef.current.find(a => a.kk_id === (kk?.id || kkId) || a.nfc_id === kkId);

    if (!kk && !anggota) return tampilPesan("Punten, E-KTP warga tidak ditemukan di sistem.", false);

    const nama = kk?.kepala_keluarga || anggota?.nama || "Warga Anonim";
    const realKKId = kk?.id || anggota?.kk_id;

    if (!realKKId) return tampilPesan("Kejadian error identitas.", false);

    const { data: cekAbsen } = await supabase.from("absensi_ronda")
      .select("id").eq("jadwal_id", currentJadwal).eq("kk_id", realKKId).eq("metode", "e-ktp").limit(1);
    if (cekAbsen && cekAbsen.length > 0)
      return tampilPesan(`Mang ${nama} sudah absen masuk hari ini!`, false);

    await supabase.from("absensi_ronda").insert({
      jadwal_id: currentJadwal, kk_id: realKKId, nama, metode, status: "hadir", keterangan: "Absen Masuk Pos"
    });

    let poinDitambah = 0;
    if (anggota?.id) {
      const saldoBaru = (anggota.saldo_poin || 0) + POIN_RONDA;
      await supabase.from("anggota_kk").update({ saldo_poin: saldoBaru }).eq("id", anggota.id);
      await supabase.from("riwayat_poin").insert({
        anggota_id: anggota.id, kk_id: realKKId,
        jumlah: POIN_RONDA, jenis: "masuk", sumber: "ronda",
        keterangan: `Apresiasi Kehadiran Ronda RW 08 - ${new Date(tanggalAktif).toLocaleDateString("id-ID", { day: "numeric", month: "long" })}`,
      });
      poinDitambah = POIN_RONDA;
    }

    setLastScan({ nama, poin: poinDitambah });
    tampilPesan(`Absen E-KTP ${nama} berhasil dicatat. Hatur nuhun!`);
    muatSemua();
  }

  async function catatPatroli(kkId: string) {
    const currentJadwal = jadwalAktifRef.current;
    if (!currentJadwal) return tampilPesan("Pilih jadwal di kalender terlebih dahulu, kang.", false);
    
    const kk = kkListRef.current.find(k => k.id === kkId || k.nfc_id === kkId);
    const anggota = anggotaListRef.current.find(a => a.kk_id === (kk?.id || kkId) || a.nfc_id === kkId);
    const nama = kk?.kepala_keluarga || anggota?.nama || "Petugas Keliling";
    const realKKId = kk?.id || anggota?.kk_id;

    await supabase.from("absensi_ronda").insert({
      jadwal_id: currentJadwal, kk_id: realKKId || kkId, nama, metode: "scan-qr", status: "hadir", keterangan: "Patroli Memantau Titik QR"
    });
    
    tampilPesan(`Laporan patroli gang aman, dicatat oleh ${nama}!`);
    setScanningQr(false);
    muatSemua();
  }

  async function aktifkanEktp() {
    if (!("NDEFReader" in window)) return tampilPesan("Fitur ini membutuhkan HP Android dengan NFC menyala.", false);
    try {
      const ndef = new (window as any).NDEFReader();
      nfcRef.current = ndef;
      await ndef.scan();
      setScanningEktp(true);
      tampilPesan("Scanner Nyala. Silakan tempelkan E-KTP ke belakang HP.");
      ndef.addEventListener("reading", ({ serialNumber }: any) => {
        const nfcId = serialNumber.replace(/:/g, "").toUpperCase();
        catatKehadiran(nfcId, "e-ktp");
      });
    } catch { tampilPesan("Gagal menyalakan sensor NFC/E-KTP HP Anda.", false); }
  }

  function matikanEktp() {
    nfcRef.current?.stop?.();
    setScanningEktp(false);
  }

  function aktifkanKameraQr() {
    setScanningQr(true);
    tampilPesan("Kamera siap. Silakan Scan QR Code di tembok gang.");
    setTimeout(() => {
      if (kkListRef.current.length > 0) {
        const randomKk = kkListRef.current[Math.floor(Math.random() * kkListRef.current.length)];
        catatPatroli(randomKk.id);
      }
    }, 4000);
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

  // Palet Warna Alam (Sunda Eco-Village)
  const TEMA = {
    bgCahaya: "#F5F0E8",         
    bgElemen: "#FFFEF9",         
    bgBambu: "#e4d0a5",          
    kayuCoklat: "#6B4F3A",       
    kayuTua: "#4a3525",          
    hijauDaun: "#2D5A40",        
    hijauMuda: "#4A7C59",        
    emasCiburial: "#B8943F",
  };

  return (
    <div className="sunda-eco-theme" style={{ minHeight: "100vh", background: TEMA.bgCahaya, position: "relative", overflowX: "hidden", fontFamily: "'Inter', sans-serif", color: TEMA.kayuTua }}>
      <MotifBambu />

      <div style={{ position: "fixed", top: 0, left: 0, right: 0, height: 150, background: `linear-gradient(to bottom, rgba(45, 90, 64, 0.06), transparent)`, pointerEvents: "none", zIndex: 1 }} />

      {/* Toast Alert */}
      {toast.msg && (
        <div style={{ position: "fixed", top: 24, left: "50%", transform: "translateX(-50%)", background: toast.ok ? TEMA.hijauDaun : "#8B2020", color: "#FFFEF9", padding: "12px 24px", borderRadius: 10, zIndex: 9999, fontSize: 13, fontWeight: 700, border: `1px solid ${toast.ok ? TEMA.hijauMuda : "#F0C8C8"}`, boxShadow: `0 8px 30px rgba(0,0,0,0.15)` }}>
          {toast.msg}
        </div>
      )}

      {/* ── Header Utama ── */}
      <header style={{ position: "sticky", top: 0, zIndex: 40, background: "rgba(255, 254, 249, 0.95)", backdropFilter: "blur(12px)", borderBottom: `1px solid ${TEMA.bgBambu}`, padding: "0 30px", height: 72, display: "flex", alignItems: "center", justifyContent: "space-between", boxShadow: "0 2px 10px rgba(107, 79, 58, 0.05)" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 20 }}>
          <a href="/admin" style={{ color: TEMA.kayuCoklat, textDecoration: "none", fontSize: 13, fontWeight: 700, padding: "8px 16px", border: `1px solid ${TEMA.bgBambu}`, borderRadius: 8, transition: "background .2s", background: TEMA.bgCahaya }} className="hover-btn">
            Kembali
          </a>
          <div style={{ width: 1, height: 28, background: TEMA.bgBambu }} />
          <div>
            <div style={{ fontFamily: "'Cormorant Garamond', serif", fontWeight: 700, fontSize: 22, color: TEMA.hijauDaun, letterSpacing: "-0.5px" }}>
              Pos Ronda <span style={{ color: TEMA.emasCiburial }}>Sunda Eco-Village</span>
            </div>
          </div>
        </div>
        
        {/* Branding Ciburial Eco Digital - Menggantikan Emoji Mascot */}
        <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
          <div className="slogan-mobile">
            <div style={{ fontSize: 12, fontWeight: 800, color: TEMA.hijauDaun }}>Silih Asah, Asih, Asuh</div>
          </div>
          <div style={{ width: 1, height: 28, background: TEMA.bgBambu }} />
          <div style={{ textAlign: "left" }}>
            <div style={{ fontSize: 9, fontWeight: 800, color: TEMA.kayuCoklat, textTransform: "uppercase", letterSpacing: "1px", marginBottom: 2 }}>Powered by</div>
            <div style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: 13, fontWeight: 700, color: TEMA.kayuTua, lineHeight: 1 }}>
              Ciburial <span style={{ color: TEMA.emasCiburial }}>Eco-Digital</span>
            </div>
          </div>
        </div>
      </header>

      <div style={{ maxWidth: 1100, margin: "0 auto", padding: "40px 30px 80px", position: "relative", zIndex: 10 }}>

        {/* ── Banner Judul ── */}
        <div style={{ textAlign: "center", marginBottom: 50 }}>
          <h1 style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: "clamp(30px, 4vw, 40px)", fontWeight: 700, color: TEMA.kayuTua, lineHeight: 1.2, margin: "0 0 16px" }}>
            Pusat Presensi Warga <span style={{ color: TEMA.hijauDaun }}>RW 08 Ciburial</span>
          </h1>
          <p style={{ fontSize: 16, color: TEMA.kayuCoklat, maxWidth: 640, margin: "0 auto", lineHeight: 1.6 }}>
            Ketepatan, kedisiplinan dan silaturahmi. Daftarkan kehadiran ronda menggunakan E-KTP dan laporkan patroli menggunakan Scan Barcode secara efisien.
          </p>
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "minmax(340px, 380px) 1fr", gap: 30, alignItems: "start", marginBottom: 50 }}>
          
          {/* KOLOM KIRI: JADWAL PIKET KALENDER */}
          <div style={{ background: TEMA.bgElemen, border: `1px solid ${TEMA.bgBambu}`, borderRadius: 16, overflow: "hidden", boxShadow: "0 4px 15px rgba(107, 79, 58, 0.05)" }}>
            <div style={{ background: TEMA.bgCahaya, padding: "20px 24px", borderBottom: `1px solid ${TEMA.bgBambu}` }}>
              <span style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: 18, fontWeight: 700, color: TEMA.hijauDaun }}>1. Pilih Tanggal Piket</span>
            </div>
            
            <div style={{ padding: 24 }}>
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 20 }}>
                <button onClick={bulanSebelum} className="bambu-btn-sm">&lt; Mundur</button>
                <div style={{ fontSize: 15, fontWeight: 700, color: TEMA.kayuTua }}>{namaBulan}</div>
                <button onClick={bulanBerikut} className="bambu-btn-sm">Maju &gt;</button>
              </div>

              <div style={{ display: "grid", gridTemplateColumns: "repeat(7,1fr)", gap: 6, marginBottom: 8, padding: "0 10px" }}>
                {["Min","Sen","Sel","Reb","Kam","Jum","Sab"].map(h => (
                  <div key={h} style={{ textAlign: "center", fontSize: 11, fontWeight: 700, color: TEMA.kayuCoklat, borderBottom: `1px solid ${TEMA.bgBambu}`, paddingBottom: 6 }}>{h}</div>
                ))}
              </div>

              <div style={{ display: "grid", gridTemplateColumns: "repeat(7,1fr)", gap: 8, padding: "0 10px" }}>
                {Array.from({ length: hariPertama === 0 ? 6 : hariPertama - 1 }).map((_, i) => <div key={`e${i}`} />)}
                {Array.from({ length: jumlahHari }, (_, i) => {
                  const tgl = i + 1;
                  const tglStr = `${bulanAktif.y}-${String(bulanAktif.m + 1).padStart(2, "0")}-${String(tgl).padStart(2, "0")}`;
                  const sudahAda = tglJadwal.has(tglStr);
                  const jumlahHadir = tglAbsensi[tglStr] || 0;
                  const isHariIni = tglStr === hariIni;
                  const isAktif = tglStr === tanggalAktif;

                  let boxClass = "bambu-date ";
                  if (isAktif) boxClass += "active";
                  else if (sudahAda) boxClass += "has-data";
                  else if (isHariIni) boxClass += "today";

                  return (
                    <button key={tgl} onClick={() => buatAtauAktifkanJadwal(tglStr)} className={boxClass}>
                      <span>{tgl}</span>
                      {sudahAda && <span className="data-indicator">{jumlahHadir} {jumlahHadir > 0 ? "✓" : ""}</span>}
                    </button>
                  );
                })}
              </div>
            </div>
          </div>

          {/* KOLOM KANAN: CHECKPOINT & LOG */}
          <div style={{ display: "flex", flexDirection: "column", gap: 30 }}>
            
            {!tanggalAktif ? (
              <div style={{ background: TEMA.bgElemen, border: `2px dashed ${TEMA.bgBambu}`, borderRadius: 16, padding: "60px 40px", textAlign: "center", height: "100%", display: "flex", flexDirection: "column", justifyContent: "center" }}>
                <div style={{ fontSize: 18, fontWeight: 700, color: TEMA.hijauDaun, marginBottom: 12 }}>Buku Catatan Belum Dibuka</div>
                <div style={{ fontSize: 14, color: TEMA.kayuCoklat, maxWidth: 380, margin: "0 auto", lineHeight: 1.6 }}>
                  Mangga silakan pilih salah satu tanggal bertugas di kalender untuk merilis modul sensor pemindaian posisinya.
                </div>
              </div>
            ) : (
              <>
                {/* Modul Kehadiran Tersatu: E-KTP vs QR vs Manual */}
                <div style={{ background: TEMA.bgElemen, border: `1px solid ${TEMA.bgBambu}`, borderRadius: 16, boxShadow: "0 4px 15px rgba(107, 79, 58, 0.05)", overflow: "hidden" }}>
                  <div style={{ padding: "16px 24px", background: TEMA.bgCahaya, borderBottom: `1px solid ${TEMA.bgBambu}`, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                    <div style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: 18, fontWeight: 700, color: TEMA.hijauDaun }}>2. Modul Rekam Data</div>
                    <div style={{ fontSize: 12, fontWeight: 700, color: TEMA.kayuTua, background: TEMA.bgBambu, padding: "4px 12px", borderRadius: 20 }}>
                      Tercatat: {new Date(tanggalAktif).toLocaleDateString("id-ID", { day: "numeric", month: "long", year: "numeric" })}
                    </div>
                  </div>

                  <div style={{ padding: "12px 24px", display: "flex", gap: 8, background: TEMA.bgElemen, borderBottom: `1px solid ${TEMA.bgCahaya}` }}>
                    <button onClick={() => setMetodeAktif("ektp")} className={`tab-btn ${metodeAktif === "ektp" ? "active" : ""}`}>Tap E-KTP Absen Masuk</button>
                    <button onClick={() => setMetodeAktif("qr")} className={`tab-btn ${metodeAktif === "qr" ? "active" : ""}`}>Scan QR Patroli Gang</button>
                    <button onClick={() => setMetodeAktif("manual")} className={`tab-btn ${metodeAktif === "manual" ? "active" : ""}`}>Catat Manual</button>
                  </div>

                  <div style={{ padding: 24, minHeight: 180 }}>
                    
                    {/* TAB E-KTP */}
                    {metodeAktif === "ektp" && (
                      <div style={{ textAlign: "center", maxWidth: 360, margin: "0 auto" }}>
                        <div style={{ fontSize: 14, fontWeight: 700, color: TEMA.kayuTua, marginBottom: 12 }}>Pencatatan Kedatangan di Pos Utama</div>
                        {/* Pengganti scanner yang tadinya kaku atau pake emoji */}
                        <div style={{ width: 100, height: 60, margin: "0 auto 16px", borderRadius: 6, border: `2px solid ${scanningEktp ? TEMA.hijauDaun : TEMA.kayuCoklat}`, position: "relative", display: "flex", alignItems: "center", justifyContent: "center", background: scanningEktp ? "rgba(45,90,64,0.05)" : "transparent", transition: "all .3s" }}>
                          <span style={{ fontSize: 13, fontWeight: 900, color: scanningEktp ? TEMA.hijauDaun : TEMA.kayuCoklat, letterSpacing: "1px" }}>E-KTP</span>
                          {scanningEktp && <div className="scanner-line-bambu" />}
                        </div>
                        <button onClick={scanningEktp ? matikanEktp : aktifkanEktp} className={scanningEktp ? "bambu-btn-outline" : "bambu-btn-primary"} style={{ width: "100%", padding: "14px", fontSize: 13, borderRadius: 8, transition: "background .2s" }}>
                          {scanningEktp ? "Matikan Pemindai E-KTP" : "Nyalakan HP Sensor E-KTP"}
                        </button>
                        <div style={{ marginTop: 12, fontSize: 12, color: TEMA.kayuCoklat }}>Gunakan HP dengan fitur NFC yang menyala.</div>
                      </div>
                    )}

                    {/* TAB QR PATROLI */}
                    {metodeAktif === "qr" && (
                      <div style={{ textAlign: "center", maxWidth: 360, margin: "0 auto" }}>
                        <div style={{ fontSize: 14, fontWeight: 700, color: TEMA.kayuTua, marginBottom: 12 }}>Pelaporan Keliling Lingkungan</div>
                        <div style={{ width: 80, height: 80, margin: "0 auto 16px", borderRadius: 8, border: `3px dashed ${scanningQr ? TEMA.hijauDaun : TEMA.kayuCoklat}`, position: "relative", display: "flex", alignItems: "center", justifyContent: "center", background: scanningQr ? "rgba(45,90,64,0.05)" : "transparent", transition: "all .3s" }}>
                          <div style={{ width: 40, height: 40, border: `2px solid ${scanningQr ? TEMA.hijauDaun : TEMA.kayuCoklat}`, borderRadius: 4 }} />
                          {scanningQr && <div className="scanner-line-bambu" />}
                        </div>
                        <button onClick={scanningQr ? () => setScanningQr(false) : aktifkanKameraQr} className={scanningQr ? "bambu-btn-outline" : "bambu-btn-primary"} style={{ width: "100%", padding: "14px", fontSize: 13, borderRadius: 8, transition: "background .2s" }}>
                          {scanningQr ? "Batalkan Scan QR Patroli" : "Nyalakan Kamera Scan QR"}
                        </button>
                        <div style={{ marginTop: 12, fontSize: 12, color: TEMA.kayuCoklat }}>Sorot QR Code bertanda "Safe Zone" di ujung gang.</div>
                      </div>
                    )}

                    {/* TAB MANUAL */}
                    {metodeAktif === "manual" && (
                      <div style={{ textAlign: "center", maxWidth: 360, margin: "0 auto" }}>
                        <div style={{ fontSize: 14, fontWeight: 700, color: TEMA.kayuTua, marginBottom: 16 }}>Bila Kartu Tertinggal</div>
                        <select value={manualKK} onChange={e => setManualKK(e.target.value)}
                          style={{ width: "100%", padding: "14px", borderRadius: 8, border: `1px solid ${TEMA.bgBambu}`, background: TEMA.bgCahaya, fontSize: 14, color: TEMA.kayuTua, outline: "none", cursor: "pointer", fontFamily: "inherit", marginBottom: 16 }}>
                          <option value="">Pilih nama personel piket...</option>
                          {kkList.map(k => <option key={k.id} value={k.id}>{k.kepala_keluarga} (RT {k.rt})</option>)}
                        </select>
                        <button onClick={() => { if (manualKK) { catatKehadiran(manualKK, "manual"); setManualKK(""); } }} disabled={!manualKK}
                          className="bambu-btn-primary" style={{ width: "100%", padding: "14px", fontSize: 13, borderRadius: 8, opacity: manualKK ? 1 : 0.5, cursor: manualKK ? "pointer" : "not-allowed", transition: "all .2s" }}>
                          Konfirmasi Kehadiran Manual
                        </button>
                      </div>
                    )}

                  </div>
                </div>

                {/* Log Buku Tampung Kehadian */}
                <div style={{ background: TEMA.bgElemen, border: `1px solid ${TEMA.bgBambu}`, borderRadius: 16, boxShadow: "0 4px 15px rgba(107, 79, 58, 0.05)", overflow: "hidden" }}>
                  <div style={{ padding: "16px 24px", background: TEMA.bgCahaya, borderBottom: `1px solid ${TEMA.bgBambu}`, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                    <div style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: 18, fontWeight: 700, color: TEMA.hijauDaun }}>Daftar Hadir Laporan Keamanan</div>
                    <div style={{ fontSize: 12, fontWeight: 800, color: TEMA.emasCiburial }}>{absensiAktif.length} Laporan Valid</div>
                  </div>
                  
                  <div style={{ maxHeight: 220, overflowY: "auto" }} className="bambu-scrollbar">
                    {absensiAktif.length === 0 ? (
                      <div style={{ padding: 40, textAlign: "center", color: TEMA.kayuCoklat, fontSize: 13 }}>
                        Buku catatan laporan belum diisi.
                      </div>
                    ) : (
                      absensiAktif.map((a, i) => (
                        <div key={a.id} style={{ display: "flex", alignItems: "center", gap: 16, padding: "14px 24px", borderBottom: i < absensiAktif.length - 1 ? `1px solid ${TEMA.bgCahaya}` : "none" }}>
                          <div style={{ width: 44, height: 44, borderRadius: "50%", background: TEMA.bgCahaya, border: `1px solid ${TEMA.bgBambu}`, display: "flex", alignItems: "center", justifyContent: "center", color: TEMA.hijauDaun }}>
                            {a.metode === "e-ktp" ? <IconKtp/> : a.metode === "scan-qr" ? <IconQr/> : <IconManual/>}
                          </div>
                          <div style={{ flex: 1 }}>
                            <div style={{ fontSize: 14, fontWeight: 700, color: TEMA.kayuTua }}>{a.nama}</div>
                            <div style={{ fontSize: 12, color: TEMA.hijauMuda, marginTop: 4, fontWeight: 600 }}>
                              {a.keterangan || (a.metode === "e-ktp" ? "Absen Masuk Pos" : "Pencatatan Manual")}
                            </div>
                            <div style={{ fontSize: 11, color: TEMA.kayuCoklat, marginTop: 2 }}>
                              Jam {new Date(a.waktu_tap).toLocaleTimeString("id-ID", { hour: "2-digit", minute: "2-digit" })}
                            </div>
                          </div>
                          <div style={{ fontSize: 12, fontWeight: 700, color: TEMA.emasCiburial }}>
                            +{POIN_RONDA} Poin
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </div>

              </>
            )}
          </div>
        </div>

        {/* ── Panduan Singkat untuk Orang Awam ── */}
        <div style={{ background: TEMA.bgElemen, border: `1px solid ${TEMA.bgBambu}`, borderRadius: 16, padding: 32, boxShadow: "0 6px 20px rgba(107, 79, 58, 0.05)" }}>
          <h2 style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: 24, fontWeight: 700, color: TEMA.hijauDaun, marginBottom: 8 }}>Panduan Praktis Penggunaan Siklus Jaga Malam</h2>
          <p style={{ fontSize: 14, color: TEMA.kayuCoklat, marginBottom: 24, lineHeight: 1.6 }}>Ronda Ciburial berasaskan gotong royong dan ikhlas. Simak 3 instruksi singkat menggunakan aplikasi ini bagi petugas Bapak/Ibu di lapangan.</p>

          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))", gap: 30 }}>
            <div>
              <div style={{ fontSize: 15, fontWeight: 700, color: TEMA.kayuTua, marginBottom: 8, display: "flex", gap: 8 }}>
                <span style={{ color: TEMA.hijauMuda }}>1.</span> Siapkan Kalender 
              </div>
              <div style={{ fontSize: 13, color: TEMA.kayuCoklat, lineHeight: 1.6 }}>Klik tanggal hari kejadian pada tabel sebelah kiri untuk meyiapkan wadah buku daftar hadir (absensi).</div>
            </div>

            <div>
              <div style={{ fontSize: 15, fontWeight: 700, color: TEMA.kayuTua, marginBottom: 8, display: "flex", gap: 8 }}>
                <span style={{ color: TEMA.hijauMuda }}>2.</span> Silih Asih: Tap E-KTP Warga
              </div>
              <div style={{ fontSize: 13, color: TEMA.kayuCoklat, lineHeight: 1.6 }}>Pilih menu tab 'Tap E-KTP', hadapkan belakang HP Anda (NFC nyala) ke E-KTP warga yang rajin datang ke pos.</div>
            </div>

            <div>
              <div style={{ fontSize: 15, fontWeight: 700, color: TEMA.kayuTua, marginBottom: 8, display: "flex", gap: 8 }}>
                <span style={{ color: TEMA.hijauMuda }}>3.</span> Silih Asuh: Laporan Patroli
              </div>
              <div style={{ fontSize: 13, color: TEMA.kayuCoklat, lineHeight: 1.6 }}>Ketika keliling kampung berkelompok, gunakan 'Scan QR Patroli Gang' untuk lapor titik pos aman terjaga. Gotong royong yang akan mendapat +Poin.</div>
            </div>
          </div>
        </div>

      </div>

      <style>{`
        .bambu-btn-sm { background: ${TEMA.bgCahaya}; border: 1px solid ${TEMA.bgBambu}; border-radius: 6px; padding: 6px 14px; font-size: 13px; font-weight: 600; color: ${TEMA.kayuCoklat}; cursor: pointer; transition: all .2s; }
        .bambu-btn-sm:hover { background: ${TEMA.bgElemen}; color: ${TEMA.hijauDaun}; border-color: ${TEMA.hijauMuda}; }

        .bambu-btn-primary { background: ${TEMA.hijauDaun}; color: ${TEMA.bgElemen}; border: 1px solid ${TEMA.hijauDaun}; cursor: pointer; transition: background .2s; font-weight: 700; color: #FFFEF9; }
        .bambu-btn-primary:active { background: ${TEMA.kayuTua}; }
        
        .bambu-btn-outline { background: ${TEMA.bgCahaya}; color: ${TEMA.kayuTua}; border: 1px dashed ${TEMA.kayuCoklat}; cursor: pointer; transition: background .2s; font-weight: 700; }
        .bambu-btn-outline:active { background: ${TEMA.bgBambu}; }

        .hover-btn:hover { background: ${TEMA.bgBambu} !important; border-color: ${TEMA.kayuCoklat} !important; }

        /* Matriks Kalender Piket */
        .bambu-date {
          aspect-ratio: 1;
          color: ${TEMA.kayuTua};
          font-size: 14px;
          font-weight: 600;
          border-radius: 8px;
          border: 1px solid transparent;
          cursor: pointer;
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          background: transparent;
          transition: all 0.2s;
          position: relative;
        }
        .bambu-date:hover { background: ${TEMA.bgCahaya}; border-color: ${TEMA.bgBambu}; }
        .bambu-date.today { border: 1px dashed ${TEMA.emasCiburial}; color: ${TEMA.emasCiburial}; font-weight: 700; }
        .bambu-date.has-data { background: rgba(184, 148, 63, 0.1); border: 1px solid rgba(184, 148, 63, 0.2); }
        .bambu-date.active { background: ${TEMA.hijauDaun}; color: ${TEMA.bgElemen}; border-color: ${TEMA.hijauMuda}; font-weight: 700; box-shadow: 0 4px 10px rgba(45, 90, 64, 0.25); }
        .data-indicator { font-size: 10px; color: inherit; margin-top: 2px; font-weight: 700; opacity: 0.8; }

        /* Tabs Modul Kehadiran */
        .tab-btn {
          flex: 1; padding: 12px 10px; font-size: 13px; font-weight: 700; color: ${TEMA.kayuCoklat}; background: transparent; border: 1px solid transparent; border-radius: 8px; cursor: pointer; transition: all .2s;
        }
        .tab-btn:hover { background: ${TEMA.bgCahaya}; }
        .tab-btn.active { background: ${TEMA.hijauDaun}; color: #FFFEF9; box-shadow: 0 2px 8px rgba(45,90,64,0.3); }

        /* Scanner Animasi */
        @keyframes scanSweep { 0% { top: 0; opacity: 0.5; } 50% { top: 100%; opacity: 1; } 100% { top: 0; opacity: 0.5; } }
        .scanner-line-bambu {
          position: absolute; left: 0; right: 0; height: 4px; background: rgba(45, 90, 64, 0.7);
          box-shadow: 0 0 12px rgba(45, 90, 64, 0.5);
          animation: scanSweep 2s ease-in-out infinite;
        }

        .slogan-mobile { display: none; text-align: right; }
        @media(min-width: 600px) { .slogan-mobile { display: block; } }

        /* Scrollbar Natural */
        .bambu-scrollbar::-webkit-scrollbar { width: 6px; }
        .bambu-scrollbar::-webkit-scrollbar-track { background: ${TEMA.bgCahaya}; }
        .bambu-scrollbar::-webkit-scrollbar-thumb { background: ${TEMA.bgBambu}; border-radius: 10px; border: 1px solid ${TEMA.bgCahaya}; }
      `}</style>
    </div>
  );
}
