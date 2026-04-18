"use client";
import { useState, useEffect, useRef } from "react";
import { supabase, isSupabaseReady } from "@/lib/supabase";

interface Jadwal { id:string; tanggal:string; rt:string; jam_mulai:string; }
interface Absensi { id:string; jadwal_id:string; kk_id:string; nama:string; waktu_tap:string; metode:string; status:string; }

const POIN_RONDA = 30;
const JAM_RONDA = "21:00";

// ── Motif Digital Grid / Eco-Tech ─────────────────────────────────────────
function CyberGrid({ opacity = 0.05 }: { opacity?: number }) {
  return (
    <div style={{ position: "absolute", inset: 0, pointerEvents: "none", opacity, zIndex: 0, backgroundSize: "40px 40px", backgroundImage: "linear-gradient(to right, #4ade80 1px, transparent 1px), linear-gradient(to bottom, #4ade80 1px, transparent 1px)" }} aria-hidden />
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
  const [tabSub, setTabSub] = useState<"panduan" | "hadir" | "scan">("panduan");
  const [scanning, setScanning] = useState(false);
  const [lastScan, setLastScan] = useState<{ nama: string; poin: number } | null>(null);
  const [manualKK, setManualKK] = useState("");
  const [toast, setToast] = useState({ msg: "", ok: true });
  const nfcRef = useRef<any>(null);

  // Refs untuk NFC closure
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

  // ── Buat jadwal otomatis untuk tanggal yang diklik ───────────────────────
  async function buatAtauAktifkanJadwal(tglStr: string) {
    setTanggalAktif(tglStr);
    // Cek apakah jadwal untuk tanggal ini sudah ada
    const existing = jadwal.find(j => j.tanggal === tglStr);
    if (existing) {
      setJadwalAktif(existing.id);
      setTabSub("scan");
      return;
    }
    // Buat jadwal baru otomatis — 1 sektor (RW 08, tidak perlu pilih RT)
    const { data, error } = await supabase.from("jadwal_ronda").insert({
      tanggal: tglStr, rt: "RW08", jam_mulai: JAM_RONDA,
    }).select().single();
    if (error) return tampilPesan(`❌ Gagal membuat jadwal: ${error.message}`, false);
    tampilPesan("✅ Jadwal ronda untuk sektor RW 08 berhasil dibuat!");
    await muatSemua();
    setJadwalAktif(data.id);
    setTabSub("scan");
  }

  // ── Catat kehadiran + poin ────────────────────────────────────────────────
  async function catatKehadiran(kkId: string, metode: "nfc" | "manual" | "cctv") {
    const currentJadwal = jadwalAktifRef.current;
    if (!currentJadwal) return tampilPesan("⚠️ Anda harus memilih tanggal di kalender terlebih dahulu!", false);

    const kk = kkListRef.current.find(k => k.id === kkId || k.nfc_id === kkId);
    const anggota = anggotaListRef.current.find(a => a.kk_id === (kk?.id || kkId) || a.nfc_id === kkId);

    if (!kk && !anggota) return tampilPesan("⛔ Kartu warga atau data tidak dikenali!", false);

    const nama = kk?.kepala_keluarga || anggota?.nama || "Tidak Diketahui";
    const realKKId = kk?.id || anggota?.kk_id;

    if (!realKKId) return tampilPesan("⛔ Data identitas tidak valid!", false);

    const { data: cekAbsen } = await supabase.from("absensi_ronda")
      .select("id").eq("jadwal_id", currentJadwal).eq("kk_id", realKKId).limit(1);
    if (cekAbsen && cekAbsen.length > 0)
      return tampilPesan(`⚠️ Warga bernama ${nama} sudah tercatat hadir malam ini!`, false);

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
        keterangan: `Ronda Digital RW 08 — ${new Date(tanggalAktif).toLocaleDateString("id-ID", { weekday: "long", day: "numeric", month: "long", year: "numeric" })}`,
      });
      poinDitambah = POIN_RONDA;
    }

    setLastScan({ nama, poin: poinDitambah });
    tampilPesan(`🟢 Bapak/Ibu ${nama} berhasil absen! Reward +${poinDitambah} XP terkirim.`);
    muatSemua();
  }

  // ── NFC ──────────────────────────────────────────────────────────────────
  async function aktifkanNFC() {
    if (!("NDEFReader" in window)) return tampilPesan("⚠️ NFC tidak tersedia. Fitur ini membutuhkan HP Android dengan fitur NFC menyala.", false);
    try {
      const ndef = new (window as any).NDEFReader();
      nfcRef.current = ndef;
      await ndef.scan();
      setScanning(true);
      tampilPesan("📡 Pemindai NFC aktif! Silakan tempelkan kartu pintar warga ke punggung HP.");
      ndef.addEventListener("reading", ({ serialNumber }: any) => {
        const nfcId = serialNumber.replace(/:/g, "").toUpperCase();
        catatKehadiran(nfcId, "nfc");
      });
    } catch { tampilPesan("⛔ HP Anda gagal mengaktifkan NFC.", false); }
  }

  function matikanNFC() {
    nfcRef.current?.stop?.();
    setScanning(false);
    tampilPesan("Pemindai NFC telah dinonaktifkan.");
  }

  // ── Kalender ─────────────────────────────────────────────────────────────
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

  // Tema Warna Eco-Digital CCTV
  const C = {
    utama: "#0f1f15",          // Gelap background
    panel: "rgba(16,36,25,0.7)", // Panel transparan hijau gelap
    border: "rgba(74,222,128,0.2)",
    hijau: "#4ade80",          // Hijau neon digital
    hijauTua: "#2D5A40",       // Hijau hutan
    emas: "#b8943f",           // Aksen
    teksTerang: "#f5f0e8",
    teksGrey: "rgba(245,240,232,0.6)",
    merahAlert: "#ef4444"
  };

  return (
    <div style={{ minHeight: "100vh", background: C.utama, fontFamily: "'Inter', system-ui, sans-serif", color: C.teksTerang, position: "relative", overflow: "hidden" }}>
      <CyberGrid />
      <div style={{ position: "fixed", top: "10%", left: "50%", transform: "translateX(-50%)", width: "80%", height: 300, background: "radial-gradient(ellipse, rgba(74,222,128,0.06) 0%, transparent 60%)", pointerEvents: "none", zIndex: 0 }} />

      {/* Pesan Alert */}
      {toast.msg && (
        <div style={{ position: "fixed", top: 24, left: "50%", transform: "translateX(-50%)", background: toast.ok ? C.hijauTua : C.merahAlert, color: "white", padding: "14px 32px", borderRadius: 12, zIndex: 9999, fontSize: 13, fontWeight: 700, boxShadow: "0 10px 40px rgba(0,0,0,0.6)", border: `1px solid ${toast.ok ? C.hijau : "#fca5a5"}` }}>
          {toast.msg}
        </div>
      )}

      {/* ── Header ── */}
      <header style={{ background: "rgba(15,31,21,0.9)", backdropFilter: "blur(20px)", borderBottom: `1px solid ${C.border}`, padding: "0 24px", height: 68, position: "sticky", top: 0, zIndex: 40, display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
          <a href="/admin" style={{ color: C.teksGrey, textDecoration: "none", fontSize: 13, fontWeight: 600, padding: "6px 12px", background: "rgba(255,255,255,0.05)", borderRadius: 8 }}>← Kembali ke Dashboard</a>
          <div style={{ width: 1, height: 24, background: C.border }} />
          <div style={{ fontWeight: 800, fontSize: 16, color: C.hijau, letterSpacing: ".02em", display: "flex", alignItems: "center", gap: 8 }}>
            <span style={{ fontSize: 20 }}>👁️</span> Ciburial Command Center
          </div>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 11, fontWeight: 800, color: C.merahAlert, background: "rgba(239,68,68,0.1)", padding: "4px 12px", borderRadius: 99, border: "1px solid rgba(239,68,68,0.3)" }}>
            <div style={{ width: 8, height: 8, borderRadius: "50%", background: C.merahAlert, animation: "rekam 1.5s infinite" }} />
            CCTV REC
          </div>
          <div style={{ background: "rgba(74,222,128,0.1)", border: `1px solid ${C.hijau}`, borderRadius: 12, padding: "6px 16px", fontSize: 12, fontWeight: 800, color: C.hijau }}>
            XP {POIN_RONDA} / Hadir
          </div>
        </div>
      </header>

      <div style={{ maxWidth: 1140, margin: "0 auto", padding: "32px 20px 80px", position: "relative", zIndex: 1 }}>

        <div style={{ textAlign: "center", marginBottom: 36 }}>
          <h1 style={{ fontSize: "clamp(24px,4vw,40px)", fontWeight: 900, color: C.teksTerang, letterSpacing: "-.02em", margin: "0 0 10px" }}>
            Sistem Keamanan Pintar <span style={{ color: C.hijau }}>RW 08 Ciburial</span>
          </h1>
          <p style={{ fontSize: 14, color: C.teksGrey, maxWidth: 600, margin: "0 auto", lineHeight: 1.6 }}>
            Pantau kehadiran ronda secara real-time yang terintegrasi dengan jaringan CCTV Desa. Otomatisasi data dan distribusi poin ramah lingkungan.
          </p>
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "minmax(320px, 400px) 1fr", gap: 24, alignItems: "start" }}>
          
          {/* ══ KOLOM KIRI: KALENDER ══ */}
          <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
            <div style={{ background: C.panel, border: `1px solid ${C.border}`, borderRadius: 20, padding: 24, boxShadow: "0 10px 30px rgba(0,0,0,0.3)" }}>
              <div style={{ fontSize: 11, fontWeight: 800, color: C.hijau, letterSpacing: ".1em", textTransform: "uppercase", marginBottom: 16, display: "flex", alignItems: "center", gap: 8 }}>
                <span>🗓️</span> Jadwal Ronda
              </div>

              {/* Navigasi bulan */}
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 16 }}>
                <button onClick={bulanSebelum} style={{ background: "rgba(255,255,255,0.05)", border: "none", borderRadius: 8, padding: "8px 14px", color: C.teksTerang, cursor: "pointer", fontWeight: 700 }}>‹</button>
                <div style={{ fontSize: 16, fontWeight: 800, color: C.teksTerang }}>{namaBulan}</div>
                <button onClick={bulanBerikut} style={{ background: "rgba(255,255,255,0.05)", border: "none", borderRadius: 8, padding: "8px 14px", color: C.teksTerang, cursor: "pointer", fontWeight: 700 }}>›</button>
              </div>

              {/* Grid hari */}
              <div style={{ display: "grid", gridTemplateColumns: "repeat(7,1fr)", gap: 4 }}>
                {["Min","Sen","Sel","Rab","Kam","Jum","Sab"].map(h => (
                  <div key={h} style={{ textAlign: "center", fontSize: 10, fontWeight: 800, color: C.teksGrey, padding: "4px 0", textTransform: "uppercase" }}>{h}</div>
                ))}
                {Array.from({ length: hariPertama === 0 ? 6 : hariPertama - 1 }).map((_, i) => <div key={`e${i}`} />)}
                {Array.from({ length: jumlahHari }, (_, i) => {
                  const tgl = i + 1;
                  const tglStr = `${bulanAktif.y}-${String(bulanAktif.m + 1).padStart(2, "0")}-${String(tgl).padStart(2, "0")}`;
                  const sudahAda = tglJadwal.has(tglStr);
                  const jumlahHadir = tglAbsensi[tglStr] || 0;
                  const isHariIni = tglStr === hariIni;
                  const isAktif = tglStr === tanggalAktif;

                  return (
                    <button key={tgl} onClick={() => buatAtauAktifkanJadwal(tglStr)}
                      style={{
                        aspectRatio: "1", borderRadius: 10,
                        border: isAktif ? `2px solid ${C.hijau}` : isHariIni ? `1px dashed ${C.hijau}` : "1px solid rgba(255,255,255,0.05)",
                        background: isAktif ? "rgba(74,222,128,0.15)" : sudahAda ? "rgba(74,222,128,0.05)" : "rgba(0,0,0,0.2)",
                        color: isAktif ? C.hijau : sudahAda ? C.hijau : C.teksTerang,
                        cursor: "pointer", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center",
                        fontSize: 13, fontWeight: sudahAda || isAktif ? 800 : 500, transition: "all .15s",
                      }}>
                      <span>{tgl}</span>
                      {sudahAda && <span style={{ fontSize: 9, color: C.hijau, marginTop: 2 }}>{jumlahHadir} {jumlahHadir > 0 ? "✓" : "-"}</span>}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Statistik Panel */}
            <div style={{ background: C.panel, border: `1px solid ${C.border}`, borderRadius: 20, padding: 20 }}>
              <div style={{ fontSize: 11, fontWeight: 800, color: C.hijau, letterSpacing: ".1em", textTransform: "uppercase", marginBottom: 12 }}>📊 Analisis Data Ronda</div>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
                <div style={{ background: "rgba(0,0,0,0.4)", borderRadius: 12, padding: "16px", border: "1px solid rgba(255,255,255,0.05)" }}>
                  <div style={{ fontSize: 24, fontWeight: 900, color: C.hijau }}>{absensi.length}</div>
                  <div style={{ fontSize: 10, color: C.teksGrey, textTransform: "uppercase", letterSpacing: ".05em" }}>Total Kehadiran</div>
                </div>
                <div style={{ background: "rgba(0,0,0,0.4)", borderRadius: 12, padding: "16px", border: "1px solid rgba(255,255,255,0.05)" }}>
                  <div style={{ fontSize: 24, fontWeight: 900, color: C.emas }}>{absensi.length * POIN_RONDA}</div>
                  <div style={{ fontSize: 10, color: C.teksGrey, textTransform: "uppercase", letterSpacing: ".05em" }}>XP Didistribusikan</div>
                </div>
              </div>
            </div>
          </div>

          {/* ══ KOLOM KANAN: PANEL KONTROL ══ */}
          <div>
            {!tanggalAktif ? (
              <div style={{ background: C.panel, border: `1px solid ${C.border}`, borderRadius: 24, padding: "60px 40px", textAlign: "center", height: "100%", display: "flex", flexDirection: "column", justifyContent: "center" }}>
                <div style={{ fontSize: 60, marginBottom: 20 }}>📡</div>
                <div style={{ fontSize: 20, fontWeight: 800, color: C.hijau, marginBottom: 12 }}>Sistem Menunggu Input</div>
                <div style={{ fontSize: 14, color: C.teksGrey, lineHeight: 1.6, maxWidth: 300, margin: "0 auto" }}>
                  Silakan pilih tanggal pada kalender di samping untuk mulai memantau absensi CCTV dan mencatat kehadiran warga.
                </div>
              </div>
            ) : (
              <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
                {/* Header Aktif */}
                <div style={{ background: "rgba(74,222,128,0.05)", border: `1px solid ${C.hijau}`, borderRadius: 20, padding: "20px 24px", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                  <div>
                    <div style={{ fontSize: 11, fontWeight: 800, color: C.hijau, letterSpacing: ".1em", textTransform: "uppercase" }}>Status Operasional: Siaga</div>
                    <div style={{ fontSize: 18, fontWeight: 900, color: C.teksTerang, marginTop: 4 }}>
                      Monitor RW 08 — {new Date(tanggalAktif).toLocaleDateString("id-ID", { day: "numeric", month: "long", year: "numeric" })}
                    </div>
                  </div>
                  <div style={{ background: C.utama, padding: "8px 16px", borderRadius: 12, border: `1px solid ${C.border}`, textAlign: "center" }}>
                    <div style={{ fontSize: 24, fontWeight: 900, color: C.hijau, lineHeight: 1 }}>{absensiAktif.length}</div>
                    <div style={{ fontSize: 10, color: C.teksGrey, textTransform: "uppercase", marginTop: 2 }}>Terpantau</div>
                  </div>
                </div>

                {/* Tabs Kanan */}
                <div style={{ display: "flex", gap: 8 }}>
                  {[
                    { id: "panduan" as const, label: "📖 Panduan Sistem" },
                    { id: "scan" as const, label: "📷 Perekaman Hadir" },
                    { id: "hadir" as const, label: "📋 Log Kehadiran" }
                  ].map(t => (
                    <button key={t.id} onClick={() => setTabSub(t.id)} style={{
                      flex: 1, padding: "12px", borderRadius: 14, fontSize: 13, fontWeight: 800, cursor: "pointer", transition: "all .2s",
                      background: tabSub === t.id ? C.hijauTua : C.panel,
                      color: tabSub === t.id ? C.teksTerang : C.teksGrey,
                      border: tabSub === t.id ? `1px solid ${C.hijau}` : `1px solid ${C.border}`
                    }}>
                      {t.label}
                    </button>
                  ))}
                </div>

                {/* TAB: PANDUAN */}
                {tabSub === "panduan" && (
                  <div style={{ background: C.panel, border: `1px solid ${C.border}`, borderRadius: 20, padding: 28 }}>
                    <h3 style={{ fontSize: 16, fontWeight: 800, color: C.hijau, marginBottom: 20 }}>Cara Menggunakan Sistem Absensi</h3>
                    
                    <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
                      <div style={{ display: "flex", gap: 16, alignItems: "flex-start" }}>
                        <div style={{ width: 32, height: 32, borderRadius: "50%", background: "rgba(74,222,128,0.2)", color: C.hijau, display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 900, flexShrink: 0 }}>1</div>
                        <div>
                          <div style={{ fontSize: 15, fontWeight: 700, color: C.teksTerang, marginBottom: 4 }}>Pilih Tanggal di Kalender</div>
                          <div style={{ fontSize: 13, color: C.teksGrey, lineHeight: 1.6 }}>Klik angka tanggal pada kalender di sebelah kiri. Jika jadwal belum ada, sistem akan otomatis membuatkannya untuk sektor RW 08.</div>
                        </div>
                      </div>
                      <div style={{ display: "flex", gap: 16, alignItems: "flex-start" }}>
                        <div style={{ width: 32, height: 32, borderRadius: "50%", background: "rgba(74,222,128,0.2)", color: C.hijau, display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 900, flexShrink: 0 }}>2</div>
                        <div>
                          <div style={{ fontSize: 15, fontWeight: 700, color: C.teksTerang, marginBottom: 4 }}>Perekaman / Absen Warga</div>
                          <div style={{ fontSize: 13, color: C.teksGrey, lineHeight: 1.6 }}>Buka tab <strong>Perekaman Hadir</strong>. Anda dapat menyentuhkan Kartu Pintar (NFC) warga ke bagian belakang HP yang mendukung, ATAU memilih nama warga secara manual dari daftar.</div>
                        </div>
                      </div>
                      <div style={{ display: "flex", gap: 16, alignItems: "flex-start" }}>
                        <div style={{ width: 32, height: 32, borderRadius: "50%", background: "rgba(74,222,128,0.2)", color: C.hijau, display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 900, flexShrink: 0 }}>3</div>
                        <div>
                          <div style={{ fontSize: 15, fontWeight: 700, color: C.teksTerang, marginBottom: 4 }}>Mulai Patroli & Pantau CCTV</div>
                          <div style={{ fontSize: 13, color: C.teksGrey, lineHeight: 1.6 }}>Warga yang sudah absen akan terlihat di tab <strong>Log Kehadiran</strong> dan otomatis mendapatkan +30 poin. Kamera CCTV di titik strategis akan merekam pergerakan di area ronda.</div>
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {/* TAB: SCAN/ABSEN */}
                {tabSub === "scan" && (
                  <div style={{ display: "grid", gridTemplateColumns: "1fr", gap: 20 }}>
                    {/* Dummy CCTV Feed Representasi */}
                    <div style={{ background: "#000", border: `1px solid ${C.border}`, borderRadius: 20, padding: 16, display: "flex", alignItems: "flex-end", height: 260, position: "relative", overflow: "hidden", backgroundImage: "url('https://images.unsplash.com/photo-1558000143-a60d1b9136ca?q=80&w=800&auto=format&fit=crop')", backgroundSize: "cover", backgroundPosition: "center" }}>
                      <div style={{ position: "absolute", inset: 0, background: "linear-gradient(to top, rgba(0,0,0,0.9), transparent)", zIndex: 1 }} />
                      <div style={{ position: "absolute", top: 16, right: 16, color: C.teksTerang, fontSize: 12, fontWeight: 700, background: "rgba(0,0,0,0.6)", padding: "4px 8px", borderRadius: 6, zIndex: 2, display: "flex", alignItems: "center", gap: 6 }}>
                        <span style={{ width: 6, height: 6, background: C.merahAlert, borderRadius: "50%", animation: "rekam 1s infinite" }} /> CAM-01 POS UTAMA
                      </div>
                      
                      <div style={{ position: "relative", zIndex: 2, width: "100%", display: "flex", gap: 12 }}>
                        <div style={{ flex: 1 }}>
                          <label style={{ fontSize: 11, fontWeight: 800, color: C.hijau, textTransform: "uppercase", display: "block", marginBottom: 8 }}>Identifikasi Manual</label>
                          <select value={manualKK} onChange={e => setManualKK(e.target.value)}
                            style={{ width: "100%", padding: "12px", borderRadius: 10, border: "1px solid rgba(255,255,255,0.2)", fontSize: 13, background: "rgba(0,0,0,0.6)", color: "white", outline: "none", backdropFilter: "blur(5px)" }}>
                            <option value="">Pilih data warga...</option>
                            {kkList.map(k => <option key={k.id} value={k.id}>{k.kepala_keluarga} (RT {k.rt})</option>)}
                          </select>
                        </div>
                        <button onClick={() => { if (manualKK) { catatKehadiran(manualKK, "manual"); setManualKK(""); } }}
                          disabled={!manualKK}
                          style={{ alignSelf: "flex-end", background: manualKK ? C.hijau : "rgba(255,255,255,0.1)", color: manualKK ? "#000" : "rgba(255,255,255,0.4)", border: "none", borderRadius: 10, padding: "0 24px", height: 42, fontSize: 13, fontWeight: 800, cursor: manualKK ? "pointer" : "not-allowed" }}>
                          Sahkan Hadir
                        </button>
                      </div>
                    </div>

                    {/* Scanner NFC */}
                    <div style={{ background: C.panel, border: `1px solid ${scanning ? C.hijau : C.border}`, borderRadius: 20, padding: 24, textAlign: "center", transition: "all .3s" }}>
                      <div style={{ fontSize: 13, fontWeight: 800, color: C.teksTerang, marginBottom: 16 }}>Sensor Kartu Pintar NFC</div>
                      <div style={{ position: "relative", width: 80, height: 80, borderRadius: "50%", margin: "0 auto 16px", border: `2px solid ${scanning ? C.hijau : "rgba(255,255,255,0.1)"}`, display: "flex", alignItems: "center", justifyContent: "center", boxShadow: scanning ? `0 0 30px ${C.hijau}40` : "none" }}>
                        <div style={{ fontSize: 32, filter: scanning ? `drop-shadow(0 0 10px ${C.hijau})` : "none" }}>💳</div>
                      </div>
                      
                      {lastScan && (
                        <div style={{ background: "rgba(74,222,128,0.1)", border: `1px solid ${C.border}`, borderRadius: 12, padding: "12px", marginBottom: 16 }}>
                          <div style={{ fontSize: 14, fontWeight: 800, color: C.teksTerang }}>{lastScan.nama} Teridentifikasi</div>
                          <div style={{ fontSize: 12, color: C.hijau, marginTop: 4 }}>Akses masuk diizinkan, +{lastScan.poin} XP</div>
                        </div>
                      )}

                      <button onClick={scanning ? matikanNFC : aktifkanNFC}
                        style={{ width: "100%", background: scanning ? "rgba(239,68,68,0.1)" : "rgba(74,222,128,0.1)", color: scanning ? C.merahAlert : C.hijau, border: `1px solid ${scanning ? "rgba(239,68,68,0.3)" : C.border}`, borderRadius: 10, padding: "12px", fontSize: 13, fontWeight: 800, cursor: "pointer", transition: "all .2s" }}>
                        {scanning ? "⏹ Matikan Scanner NFC" : "▶ Hubungkan Scanner NFC Hp"}
                      </button>
                    </div>
                  </div>
                )}

                {/* TAB: LOG KEHADIRAN */}
                {tabSub === "hadir" && (
                  <div style={{ background: C.panel, border: `1px solid ${C.border}`, borderRadius: 20, overflow: "hidden" }}>
                    <div style={{ padding: "16px 20px", background: "rgba(0,0,0,0.3)", borderBottom: `1px solid ${C.border}`, display: "flex", justifyContent: "space-between" }}>
                      <span style={{ fontSize: 12, fontWeight: 800, color: C.teksTerang }}>Daftar Personel Hadir</span>
                      <span style={{ fontSize: 12, color: C.hijau }}>Total XP: {absensiAktif.length * POIN_RONDA}</span>
                    </div>
                    <div style={{ maxHeight: 400, overflowY: "auto" }}>
                      {absensiAktif.length === 0 ? (
                        <div style={{ padding: "40px", textAlign: "center", color: C.teksGrey, fontSize: 13 }}>
                          Belum ada personel yang merekam kehadiran malam ini.
                        </div>
                      ) : absensiAktif.map((a, i) => (
                        <div key={a.id} style={{ display: "flex", alignItems: "center", gap: 14, padding: "14px 20px", borderBottom: i < absensiAktif.length - 1 ? `1px solid ${C.border}` : "none" }}>
                          <div style={{ fontSize: 18, background: "rgba(255,255,255,0.05)", width: 40, height: 40, borderRadius: 10, display: "flex", alignItems: "center", justifyContent: "center" }}>
                            {a.metode === "nfc" ? "💳" : "⌨️"}
                          </div>
                          <div style={{ flex: 1 }}>
                            <div style={{ fontSize: 14, fontWeight: 800, color: C.teksTerang }}>{a.nama}</div>
                            <div style={{ fontSize: 11, color: C.teksGrey, marginTop: 4 }}>
                              Dironda sejak {new Date(a.waktu_tap).toLocaleTimeString("id-ID", { hour: "2-digit", minute: "2-digit" })} WIB
                            </div>
                          </div>
                          <div style={{ color: C.hijau, fontSize: 12, fontWeight: 800 }}>+{POIN_RONDA} XP</div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>

      <style>{`
        @keyframes rekam { 0%,100%{opacity:1} 50%{opacity:.3} }
      `}</style>
    </div>
  );
}
