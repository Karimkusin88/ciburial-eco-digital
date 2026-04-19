"use client";
import { useState, useEffect, useRef } from "react";
import { supabase, isSupabaseReady } from "@/lib/supabase";

interface Jadwal { id:string; tanggal:string; rt:string; jam_mulai:string; }
interface Absensi { id:string; jadwal_id:string; kk_id:string; nama:string; waktu_tap:string; metode:string; status:string; }

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
  
  // Untuk simulasi kamera scan barcode
  const scannerVideoRef = useRef<HTMLVideoElement>(null);

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

  async function catatKehadiran(kkId: string, metode: "scan-qr" | "manual") {
    const currentJadwal = jadwalAktifRef.current;
    if (!currentJadwal) return tampilPesan("Pilih jadwal di kalender terlebih dahulu, kang.", false);

    const kk = kkListRef.current.find(k => k.id === kkId || k.nfc_id === kkId);
    const anggota = anggotaListRef.current.find(a => a.kk_id === (kk?.id || kkId) || a.nfc_id === kkId);

    if (!kk && !anggota) return tampilPesan("Punten, data warga tidak ditemukan di sistem.", false);

    const nama = kk?.kepala_keluarga || anggota?.nama || "Warga Anonim";
    const realKKId = kk?.id || anggota?.kk_id;

    if (!realKKId) return tampilPesan("Kejadian error identitas.", false);

    const { data: cekAbsen } = await supabase.from("absensi_ronda")
      .select("id").eq("jadwal_id", currentJadwal).eq("kk_id", realKKId).limit(1);
    if (cekAbsen && cekAbsen.length > 0)
      return tampilPesan(`Mang ${nama} sudah tercatat hadir untuk piket hari ini!`, false);

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
        keterangan: `Apresiasi Piket Ronda RW 08 - ${new Date(tanggalAktif).toLocaleDateString("id-ID", { day: "numeric", month: "long" })}`,
      });
      poinDitambah = POIN_RONDA;
    }

    setLastScan({ nama, poin: poinDitambah });
    tampilPesan(`Kehadiran ${nama} berhasil dicatat. Hatur nuhun!`);
    muatSemua();
  }

  // Simulasi kamera/scanner
  function aktifkanKamera() {
    setScanning(true);
    tampilPesan("Kamera aktif. Silakan scan QR code di titik checkpoint pos ronda.");
    // Simulasi delay scan berhasil karena ini environment browser tanpa akses real kamera
    setTimeout(() => {
      if (kkListRef.current.length > 0 && scanning) {
        // Ambil warga acak untuk demo jika tombol kamera ditekan
        const randomKk = kkListRef.current[Math.floor(Math.random() * kkListRef.current.length)];
        catatKehadiran(randomKk.id, "scan-qr");
        setScanning(false);
      }
    }, 3000);
  }

  function matikanKamera() {
    setScanning(false);
    tampilPesan("Kamera scan QR dinonaktifkan.");
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
    bgCahaya: "#F5F0E8",         // Krem alami daun pandan/bambu
    bgElemen: "#FFFEF9",         // Putih gading untuk card
    bgBambu: "#e4d0a5",          // Warna bambu kering
    kayuCoklat: "#6B4F3A",       // Cokelat kayu jati
    kayuTua: "#4a3525",
    hijauDaun: "#2D5A40",        // Hijau rimbun alam
    hijauMuda: "#4A7C59",        // Hijau pucukeun dedaunan
    emasCiburial: "#B8943F",
  };

  return (
    <div className="sunda-eco-theme" style={{ minHeight: "100vh", background: TEMA.bgCahaya, position: "relative", overflowX: "hidden", fontFamily: "'Inter', sans-serif", color: TEMA.kayuTua }}>
      <MotifBambu />

      {/* Latar Belakang Gradasi Halus */}
      <div style={{ position: "fixed", top: 0, left: 0, right: 0, height: 200, background: `linear-gradient(to bottom, rgba(45, 90, 64, 0.08), transparent)`, pointerEvents: "none", zIndex: 1 }} />

      {/* Toast Alert */}
      {toast.msg && (
        <div style={{ position: "fixed", top: 30, left: "50%", transform: "translateX(-50%)", background: toast.ok ? TEMA.hijauDaun : "#8B2020", color: "#FFFEF9", padding: "14px 28px", borderRadius: 8, zIndex: 9999, fontSize: 14, fontWeight: 600, border: `2px solid ${toast.ok ? TEMA.hijauMuda : "#F0C8C8"}`, boxShadow: `0 4px 15px rgba(0,0,0,0.15)` }}>
          {toast.msg}
        </div>
      )}

      {/* ── Header Utama ── */}
      <header style={{ position: "sticky", top: 0, zIndex: 40, background: "rgba(255, 254, 249, 0.9)", backdropFilter: "blur(12px)", borderBottom: `2px solid ${TEMA.bgBambu}`, padding: "0 24px", height: 70, display: "flex", alignItems: "center", justifyContent: "space-between", boxShadow: "0 2px 10px rgba(107, 79, 58, 0.05)" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 20 }}>
          <a href="/admin" style={{ color: TEMA.kayuCoklat, textDecoration: "none", fontSize: 13, fontWeight: 700, padding: "8px 16px", border: `1px solid ${TEMA.bgBambu}`, borderRadius: 6, transition: "background .2s", background: TEMA.bgCahaya }}>
            ← Pelataran Admin
          </a>
          <div style={{ width: 2, height: 30, background: TEMA.bgBambu, borderRadius: 2 }} />
          <div>
            <div style={{ fontFamily: "'Cormorant Garamond', serif", fontWeight: 700, fontSize: 24, color: TEMA.hijauDaun, letterSpacing: "-0.5px" }}>
              Pos Ronda <span style={{ color: TEMA.emasCiburial }}>Ciburial</span>
            </div>
          </div>
        </div>

        {/* Maskot / Identitas Lokal */}
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <div style={{ textAlign: "right", display: "none", "@media (min-width: 600px)": { display: "block" } } as any}>
            <div style={{ fontSize: 12, fontWeight: 700, color: TEMA.kayuTua }}>Silih Asah, Asih, Asuh</div>
            <div style={{ fontSize: 10, color: TEMA.hijauMuda, letterSpacing: "0.5px" }}>Falsafah Keamanan Warga</div>
          </div>
          <div style={{ width: 40, height: 40, borderRadius: "50%", background: TEMA.bgBambu, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 22, border: `2px solid ${TEMA.emasCiburial}`, boxShadow: "0 2px 5px rgba(0,0,0,0.1)" }} title="Aki Ronda Ciburial">
            👨🏽‍🌾
          </div>
        </div>
      </header>

      <div style={{ maxWidth: 1100, margin: "0 auto", padding: "40px 24px 80px", position: "relative", zIndex: 10 }}>

        {/* ── Banner Judul ── */}
        <div style={{ textAlign: "center", marginBottom: 40 }}>
          <div style={{ display: "inline-block", background: TEMA.bgElemen, border: `2px solid ${TEMA.bgBambu}`, borderRadius: 20, padding: "6px 16px", fontSize: 12, fontWeight: 700, color: TEMA.hijauMuda, marginBottom: 12, boxShadow: "0 2px 4px rgba(0,0,0,0.03)" }}>
            Astra-Jaga Digital Warga RW 08
          </div>
          <h1 style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: "clamp(32px, 4vw, 44px)", fontWeight: 700, color: TEMA.kayuTua, lineHeight: 1.2, margin: "0 0 12px" }}>
            Gotong Royong Menjaga <span style={{ color: TEMA.hijauDaun }}>Keamanan Lingkungan</span>
          </h1>
          <p style={{ fontSize: 15, color: TEMA.kayuCoklat, maxWidth: 600, margin: "0 auto", lineHeight: 1.6 }}>
            Mari kelola kehadiran jadwal piket warga dengan mudah menggunakan fitur modern berbalut kehangatan nilai-nilai kasundaan.
          </p>
        </div>

        {/* ── Menu Pintas Modern Ala Sunda ── */}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: 16, marginBottom: 40 }}>
          {[
            { icon: "☕", title: "Ngadu Bako", desc: "Forum Diskusi Warga" },
            { icon: "🔔", title: "Kentongan Digital", desc: "Tombol Tanda Bahaya" },
            { icon: "📅", title: "Jadwal Piket", desc: "Kelola E-Ronda Warga" },
            { icon: "📰", title: "Warta Lembur", desc: "Info Penting Lingkungan" }
          ].map((menu, i) => (
            <div key={i} style={{ background: TEMA.bgElemen, border: `1px solid ${TEMA.bgBambu}`, borderRadius: 12, padding: "16px 20px", display: "flex", alignItems: "center", gap: 16, boxShadow: "0 2px 6px rgba(107, 79, 58, 0.04)", cursor: "pointer", transition: "transform .2s" }} className="hover-lift">
              <div style={{ width: 46, height: 46, borderRadius: "10px", background: TEMA.bgCahaya, border: `1px solid ${TEMA.bgBambu}`, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 24 }}>
                {menu.icon}
              </div>
              <div>
                <div style={{ fontSize: 14, fontWeight: 700, color: TEMA.hijauDaun }}>{menu.title}</div>
                <div style={{ fontSize: 11, color: TEMA.kayuCoklat, marginTop: 2 }}>{menu.desc}</div>
              </div>
            </div>
          ))}
        </div>

        {/* ── Konten Utama ── */}
        <div style={{ display: "grid", gridTemplateColumns: "minmax(340px, 400px) 1fr", gap: 30, alignItems: "start", marginBottom: 50 }}>
          
          {/* KOLOM KIRI: JADWAL PIKET */}
          <div style={{ background: TEMA.bgElemen, border: `1px solid ${TEMA.bgBambu}`, borderRadius: 16, overflow: "hidden", boxShadow: "0 4px 15px rgba(107, 79, 58, 0.05)" }}>
            <div style={{ background: TEMA.bgCahaya, padding: "20px 24px", borderBottom: `1px solid ${TEMA.bgBambu}`, display: "flex", alignItems: "center", gap: 12 }}>
              <span style={{ fontSize: 20 }}>🗓️</span>
              <span style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: 18, fontWeight: 700, color: TEMA.kayuTua }}>Jadwal Piket Per Bulan</span>
            </div>
            
            <div style={{ padding: 24 }}>
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 20 }}>
                <button onClick={bulanSebelum} className="bambu-btn-sm">Mundur</button>
                <div style={{ fontSize: 15, fontWeight: 700, color: TEMA.hijauDaun }}>{namaBulan}</div>
                <button onClick={bulanBerikut} className="bambu-btn-sm">Maju</button>
              </div>

              <div style={{ display: "grid", gridTemplateColumns: "repeat(7,1fr)", gap: 6, marginBottom: 8, padding: "0 10px" }}>
                {["Aga","Sen","Sel","Reb","Kem","Jum","Sap"].map(h => (
                  <div key={h} style={{ textAlign: "center", fontSize: 11, fontWeight: 700, color: TEMA.kayuCoklat }}>{h}</div>
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
                      {sudahAda && <span className="data-indicator">{jumlahHadir} ☑</span>}
                    </button>
                  );
                })}
              </div>
            </div>
          </div>

          {/* KOLOM KANAN: CHECKPOINT & LOG */}
          <div style={{ display: "flex", flexDirection: "column", gap: 30 }}>
            
            {!tanggalAktif ? (
              <div style={{ background: TEMA.bgElemen, border: `2px dashed ${TEMA.bgBambu}`, borderRadius: 16, padding: "50px 30px", textAlign: "center" }}>
                <div style={{ fontSize: 50, marginBottom: 16 }}>🌿</div>
                <div style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: 20, fontWeight: 700, color: TEMA.kayuTua, marginBottom: 12 }}>Mangga Dipilih Tanggalnya</div>
                <div style={{ fontSize: 14, color: TEMA.kayuCoklat, maxWidth: 360, margin: "0 auto", lineHeight: 1.6 }}>
                  Pilih salah satu tanggal di kalender piket sebelelah kiri untuk membuka halaman presensi kehadiran warga wilayah RW 08.
                </div>
              </div>
            ) : (
              <>
                {/* Modul Kehadiran Modern (QR & Foto) */}
                <div style={{ background: TEMA.bgElemen, border: `1px solid ${TEMA.bgBambu}`, borderRadius: 16, boxShadow: "0 4px 15px rgba(107, 79, 58, 0.05)" }}>
                  <div style={{ padding: "16px 24px", background: TEMA.bgCahaya, borderBottom: `1px solid ${TEMA.bgBambu}`, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                    <div style={{ fontSize: 14, fontWeight: 700, color: TEMA.hijauDaun }}>Pos Scan Presensi Warga</div>
                    <div style={{ fontSize: 13, fontWeight: 600, color: TEMA.kayuCoklat }}>Piket: {new Date(tanggalAktif).toLocaleDateString("id-ID", { day: "numeric", month: "long" })}</div>
                  </div>

                  <div style={{ padding: 24, display: "grid", gridTemplateColumns: "1fr 1fr", gap: 30 }}>
                    
                    {/* Scanner QR Code Posisi/Checkpoint */}
                    <div style={{ display: "flex", flexDirection: "column" }}>
                      <div style={{ fontSize: 13, fontWeight: 700, color: TEMA.kayuTua, marginBottom: 16 }}>Barcode Checkpoint Gang</div>
                      
                      <div style={{ background: TEMA.bgCahaya, border: `1px solid ${TEMA.bgBambu}`, borderRadius: 12, height: 160, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", marginBottom: 16, position: "relative", overflow: "hidden" }}>
                        {scanning ? (
                          <>
                            <div className="scanner-line-bambu" />
                            <div style={{ width: 100, height: 100, border: `2px dashed ${TEMA.hijauDaun}`, opacity: 0.5 }} />
                            <div style={{ position: "absolute", bottom: 12, fontSize: 11, color: TEMA.hijauDaun, fontWeight: 600 }}>Mode Kamera Terbuka...</div>
                          </>
                        ) : (
                          <>
                            <div style={{ fontSize: 40, opacity: 0.4, marginBottom: 8 }}>📷</div>
                            <div style={{ fontSize: 12, color: TEMA.kayuCoklat }}>Sorot QR Code Sudut RT</div>
                          </>
                        )}
                      </div>

                      <button onClick={scanning ? matikanKamera : aktifkanKamera} className={scanning ? "bambu-btn-primary" : "bambu-btn-outline"} style={{ width: "100%", padding: "12px", fontSize: 13, borderRadius: 8 }}>
                        {scanning ? "Batalkan Scan Kamera" : "Mulai Scan QR Checkpoint"}
                      </button>
                    </div>

                    {/* Input Absen Nama Manual */}
                    <div style={{ display: "flex", flexDirection: "column" }}>
                      <div style={{ fontSize: 13, fontWeight: 700, color: TEMA.kayuTua, marginBottom: 16 }}>Atau Tulis Laporan Kehadiran</div>
                      
                      <div style={{ flex: 1 }}>
                        <select value={manualKK} onChange={e => setManualKK(e.target.value)}
                          style={{ width: "100%", padding: "14px", borderRadius: 8, border: `1px solid ${TEMA.bgBambu}`, background: TEMA.bgElemen, fontSize: 14, color: TEMA.kayuTua, outline: "none", cursor: "pointer", fontFamily: "inherit" }}>
                          <option value="">Pilih nama bapak/ibu...</option>
                          {kkList.map(k => <option key={k.id} value={k.id}>{k.kepala_keluarga} (RT {k.rt})</option>)}
                        </select>
                        
                        <div style={{ marginTop: 16, fontSize: 12, color: TEMA.kayuCoklat, lineHeight: 1.6, background: TEMA.bgCahaya, padding: "12px", borderRadius: 8, border: `1px dashed ${TEMA.bgBambu}` }}>
                          Pilih nama jika warga sudah tiba di Saung Ronda Utama tapi belum melaporkan posisinya melalui titik scan.
                        </div>
                      </div>

                      <button onClick={() => { if (manualKK) { catatKehadiran(manualKK, "manual"); setManualKK(""); } }} disabled={!manualKK}
                        className="bambu-btn-primary" style={{ width: "100%", padding: "12px", fontSize: 13, borderRadius: 8, opacity: manualKK ? 1 : 0.5, cursor: manualKK ? "pointer" : "not-allowed" }}>
                        Ceklis Kehadiran
                      </button>
                    </div>

                  </div>
                </div>

                {/* Buku Catatan Kehadiran (Log) */}
                <div style={{ background: TEMA.bgElemen, border: `1px solid ${TEMA.bgBambu}`, borderRadius: 16, boxShadow: "0 4px 15px rgba(107, 79, 58, 0.05)", overflow: "hidden" }}>
                  <div style={{ padding: "16px 24px", background: TEMA.bgCahaya, borderBottom: `1px solid ${TEMA.bgBambu}`, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                    <div style={{ fontSize: 14, fontWeight: 700, color: TEMA.hijauDaun }}>Buku Tamu Piket Malam Ini</div>
                    <div style={{ fontSize: 12, color: TEMA.kayuCoklat, fontWeight: 600 }}>Tercatat: {absensiAktif.length} warga</div>
                  </div>
                  
                  <div style={{ maxHeight: 300, overflowY: "auto" }} className="bambu-scrollbar">
                    {absensiAktif.length === 0 ? (
                      <div style={{ padding: 40, textAlign: "center", color: TEMA.kayuCoklat, fontSize: 13 }}>
                        Buku tamu masih kosong, belum ada wargi yang mengisi absen malam ini.
                      </div>
                    ) : (
                      absensiAktif.map((a, i) => (
                        <div key={a.id} style={{ display: "flex", alignItems: "center", gap: 16, padding: "16px 24px", borderBottom: i < absensiAktif.length - 1 ? `1px solid ${TEMA.bgBambu}` : "none" }}>
                          <div style={{ fontSize: 24 }}>{a.metode === "scan-qr" ? "📸" : "✍️"}</div>
                          <div style={{ flex: 1 }}>
                            <div style={{ fontSize: 15, fontWeight: 700, color: TEMA.kayuTua }}>{a.nama}</div>
                            <div style={{ fontSize: 12, color: TEMA.kayuCoklat, marginTop: 4 }}>
                              Masuk pukul {new Date(a.waktu_tap).toLocaleTimeString("id-ID", { hour: "2-digit", minute: "2-digit" })} WIB via {a.metode === "scan-qr" ? "Scan Kode QR" : "Catatan Bendahara"}
                            </div>
                          </div>
                          <div style={{ padding: "6px 12px", background: "rgba(45, 90, 64, 0.1)", color: TEMA.hijauDaun, borderRadius: 20, fontSize: 12, fontWeight: 700 }}>
                            +{POIN_RONDA} Kebaikan
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

        {/* ── Sistem Reward: Filosofi Sunda Silih Asah, Asih, Asuh ── */}
        <div style={{ border: `1px solid ${TEMA.emasCiburial}`, borderRadius: 16, padding: 32, background: TEMA.bgElemen, boxShadow: "0 10px 30px rgba(184, 148, 63, 0.1)", position: "relative", overflow: "hidden" }}>
          
          {/* Aksen Batik di pojok Box Bawah */}
          <div style={{ position: "absolute", bottom: -20, right: -20, fontSize: 150, opacity: 0.05, transform: "rotate(-15deg)" }}>🌿</div>

          <h3 style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: 24, fontWeight: 700, color: TEMA.kayuTua, marginBottom: 24, display: "flex", alignItems: "center", gap: 12 }}>
            Sistem Poin: Silih Asah, Silih Asih, Silih Asuh
          </h3>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))", gap: 24 }}>
            <div style={{ background: TEMA.bgCahaya, padding: 20, borderRadius: 12, border: `1px solid ${TEMA.bgBambu}` }}>
              <div style={{ fontSize: 16, fontWeight: 700, color: TEMA.hijauDaun, marginBottom: 8 }}>Silih Asah (Saling Mencerdaskan)</div>
              <div style={{ fontSize: 14, color: TEMA.kayuCoklat, lineHeight: 1.6 }}>Warga yang aktif mengirim laporan visal (foto/video kondisi lingkungan seperti lampu mati atau gerbang tidak aman) ke Menu <strong>Warta Lembur</strong> akan mendapatkan apresiasi poin.</div>
            </div>
            <div style={{ background: TEMA.bgCahaya, padding: 20, borderRadius: 12, border: `1px solid ${TEMA.bgBambu}` }}>
              <div style={{ fontSize: 16, fontWeight: 700, color: TEMA.hijauDaun, marginBottom: 8 }}>Silih Asih (Saling Mengayomi)</div>
              <div style={{ fontSize: 14, color: TEMA.kayuCoklat, lineHeight: 1.6 }}>Warga di rumah dapat memberikan apresiasi berupa jempol, sapaan "hatur nuhun", atau bahkan "kopi stiker virtual" ke petugas piket di forum <strong>Ngadu Bako</strong>.</div>
            </div>
            <div style={{ background: TEMA.bgCahaya, padding: 20, borderRadius: 12, border: `1px solid ${TEMA.bgBambu}` }}>
              <div style={{ fontSize: 16, fontWeight: 700, color: TEMA.hijauDaun, marginBottom: 8 }}>Silih Asuh (Saling Membimbing)</div>
              <div style={{ fontSize: 14, color: TEMA.kayuCoklat, lineHeight: 1.6 }}>Kedisiplinan adalah kunci. Warga yang tertib melakukan scan <strong>QR Checkpoint</strong> otomatis mendapat +30 Poin, sedangkan yang alpha tanpa keterangan memengaruhi batas kuota poin sosialnya.</div>
            </div>
          </div>
        </div>

      </div>

      <style>{`
        /* Utilitas Tampilan Sunda Eco-Theme */
        .hover-lift:hover { transform: translateY(-4px); border-color: ${TEMA.emasCiburial}; box-shadow: 0 6px 15px rgba(184, 148, 63, 0.15); }
        
        .bambu-btn-sm { background: ${TEMA.bgCahaya}; border: 1px solid ${TEMA.bgBambu}; border-radius: 6px; padding: 6px 12px; font-size: 12px; font-weight: 600; color: ${TEMA.kayuCoklat}; cursor: pointer; transition: all .2s; }
        .bambu-btn-sm:hover { background: ${TEMA.bgElemen}; color: ${TEMA.hijauDaun}; border-color: ${TEMA.hijauMuda}; }

        .bambu-btn-primary { background: ${TEMA.hijauDaun}; color: ${TEMA.bgElemen}; border: 1px solid ${TEMA.hijauDaun}; cursor: pointer; transition: background .2s; font-weight: 600; }
        .bambu-btn-primary:hover:not(:disabled) { background: ${TEMA.hijauMuda}; }
        
        .bambu-btn-outline { background: ${TEMA.bgCahaya}; color: ${TEMA.kayuTua}; border: 1px solid ${TEMA.kayuTua}; cursor: pointer; transition: background .2s; font-weight: 600; }
        .bambu-btn-outline:hover { background: ${TEMA.bgElemen}; }

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
        .bambu-date.today { border: 1px dashed ${TEMA.hijauDaun}; color: ${TEMA.hijauDaun}; }
        .bambu-date.has-data { background: rgba(184, 148, 63, 0.1); border: 1px solid rgba(184, 148, 63, 0.2); }
        .bambu-date.active { background: ${TEMA.hijauDaun}; color: ${TEMA.bgElemen}; border-color: ${TEMA.hijauMuda}; font-weight: 700; box-shadow: 0 4px 10px rgba(45, 90, 64, 0.3); }
        .data-indicator { font-size: 10px; color: inherit; margin-top: 2px; font-weight: 700; opacity: 0.8; }

        /* UI Scanner Baru */
        @keyframes scanSweep { 0% { top: 0; } 50% { top: 100%; } 100% { top: 0; } }
        .scanner-line-bambu {
          position: absolute; left: 0; right: 0; height: 3px; background: rgba(45, 90, 64, 0.6);
          box-shadow: 0 0 10px rgba(45, 90, 64, 0.4);
          animation: scanSweep 3s ease-in-out infinite; z-index: 10;
        }

        /* Scrollbar Natural */
        .bambu-scrollbar::-webkit-scrollbar { width: 6px; }
        .bambu-scrollbar::-webkit-scrollbar-track { background: ${TEMA.bgCahaya}; }
        .bambu-scrollbar::-webkit-scrollbar-thumb { background: ${TEMA.bgBambu}; border-radius: 10px; border: 1px solid ${TEMA.bgCahaya}; }
      `}</style>
    </div>
  );
}
