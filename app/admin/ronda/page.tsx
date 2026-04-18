"use client";
import { useState, useEffect, useRef } from "react";
import { supabase, isSupabaseReady } from "@/lib/supabase";

interface Jadwal { id:string; tanggal:string; rt:string; jam_mulai:string; }
interface Absensi { id:string; jadwal_id:string; kk_id:string; nama:string; waktu_tap:string; metode:string; status:string; }

const POIN_RONDA = 30;
const JAM_RONDA = "21:00";

// ── Motif Batik Sunda SVG (ornamen kujang & liris) ───────────────────────
function MotifBatik({ opacity = 0.04 }: { opacity?: number }) {
  return (
    <svg style={{ position: "absolute", inset: 0, width: "100%", height: "100%", pointerEvents: "none", opacity }} aria-hidden>
      <defs>
        <pattern id="batik" x="0" y="0" width="80" height="80" patternUnits="userSpaceOnUse">
          {/* Motif liris / tumpal sederhana */}
          <path d="M40 0 L80 40 L40 80 L0 40 Z" fill="none" stroke="#B8943F" strokeWidth="0.8"/>
          <path d="M40 10 L70 40 L40 70 L10 40 Z" fill="none" stroke="#2D5A40" strokeWidth="0.5"/>
          <circle cx="40" cy="40" r="4" fill="#B8943F" opacity="0.6"/>
          <circle cx="40" cy="40" r="1.5" fill="#2D5A40"/>
          {/* Sudut kecil */}
          <path d="M0 0 L10 0 L0 10 Z" fill="#B8943F" opacity="0.3"/>
          <path d="M80 0 L80 10 L70 0 Z" fill="#B8943F" opacity="0.3"/>
          <path d="M0 80 L10 80 L0 70 Z" fill="#B8943F" opacity="0.3"/>
          <path d="M80 80 L70 80 L80 70 Z" fill="#B8943F" opacity="0.3"/>
        </pattern>
      </defs>
      <rect width="100%" height="100%" fill="url(#batik)"/>
    </svg>
  );
}

// ── Ikon Kujang SVG ──────────────────────────────────────────────────────
function KujangIcon({ size = 32, color = "#B8943F" }: { size?: number; color?: string }) {
  return (
    <svg width={size} height={size} viewBox="0 0 100 100" fill="none" aria-label="Kujang">
      {/* Gagang */}
      <path d="M15 85 L30 65 L35 70 Z" fill={color} opacity="0.8"/>
      {/* Bilah utama kujang */}
      <path d="M30 65 L85 25 Q90 20 88 28 L55 55 Q50 60 45 58 L35 70 Z" fill={color}/>
      {/* Lekukan khas kujang */}
      <path d="M55 55 Q70 45 75 35 L68 38 Q60 50 55 55Z" fill="#1a2e1f" opacity="0.4"/>
      {/* Lubang kujang */}
      <circle cx="65" cy="38" r="4" fill="#1a2e1f" opacity="0.5"/>
      <circle cx="72" cy="33" r="2.5" fill="#1a2e1f" opacity="0.4"/>
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
  const [tabSub, setTabSub] = useState<"hadir" | "scan">("hadir");
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
      setTabSub("hadir");
      return;
    }
    // Buat jadwal baru otomatis — 1 sektor (RW 08, tidak perlu pilih RT)
    const { data, error } = await supabase.from("jadwal_ronda").insert({
      tanggal: tglStr, rt: "RW08", jam_mulai: JAM_RONDA,
    }).select().single();
    if (error) return tampilPesan(`❌ Gagal membuat jadwal: ${error.message}`, false);
    tampilPesan("✅ Jadwal ronda malam ini berhasil dibuat!");
    await muatSemua();
    setJadwalAktif(data.id);
    setTabSub("hadir");
  }

  // ── Catat kehadiran + poin ────────────────────────────────────────────────
  async function catatKehadiran(kkId: string, metode: string) {
    const currentJadwal = jadwalAktifRef.current;
    if (!currentJadwal) return tampilPesan("⚠️ Pilih tanggal ronda terlebih dahulu!", false);

    const kk = kkListRef.current.find(k => k.id === kkId || k.nfc_id === kkId);
    const anggota = anggotaListRef.current.find(a => a.kk_id === (kk?.id || kkId) || a.nfc_id === kkId);

    if (!kk && !anggota) return tampilPesan("⛔ Kartu warga tidak dikenali!", false);

    const nama = kk?.kepala_keluarga || anggota?.nama || "Tidak Diketahui";
    const realKKId = kk?.id || anggota?.kk_id;

    if (!realKKId) return tampilPesan("⛔ Data identitas tidak valid!", false);

    const { data: cekAbsen } = await supabase.from("absensi_ronda")
      .select("id").eq("jadwal_id", currentJadwal).eq("kk_id", realKKId).limit(1);
    if (cekAbsen && cekAbsen.length > 0)
      return tampilPesan(`⚠️ ${nama} sudah tercatat hadir malam ini!`, false);

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
        keterangan: `Ronda Digital Ciburial RW 08 — ${new Date(tanggalAktif).toLocaleDateString("id-ID", { weekday: "long", day: "numeric", month: "long", year: "numeric" })}`,
      });
      poinDitambah = POIN_RONDA;
    }

    setLastScan({ nama, poin: poinDitambah });
    tampilPesan(`🟢 ${nama} berhasil dicatat hadir!${poinDitambah > 0 ? ` +${poinDitambah} poin` : ""}`);
    muatSemua();
  }

  // ── NFC ──────────────────────────────────────────────────────────────────
  async function aktifkanNFC() {
    if (!("NDEFReader" in window)) return tampilPesan("⚠️ NFC tidak tersedia. Gunakan Chrome Android.", false);
    try {
      const ndef = new (window as any).NDEFReader();
      nfcRef.current = ndef;
      await ndef.scan();
      setScanning(true);
      tampilPesan("📡 Pemindai NFC aktif! Dekatkan kartu warga...");
      ndef.addEventListener("reading", ({ serialNumber }: any) => {
        const nfcId = serialNumber.replace(/:/g, "").toUpperCase();
        catatKehadiran(nfcId, "nfc");
      });
    } catch { tampilPesan("⛔ Gagal mengaktifkan NFC.", false); }
  }

  function matikanNFC() {
    nfcRef.current?.stop?.();
    setScanning(false);
    tampilPesan("Pemindai NFC dinonaktifkan.");
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

  // Warna & style sistem
  const C = {
    hijau: "#2D5A40", terang: "#4ade80", emas: "#B8943F", emasTerang: "#D4AC5A",
    krem: "#FAF8F3", gelap: "#1a2e1f", coklat: "#6B4F3A",
  };

  return (
    <div style={{ minHeight: "100vh", background: `linear-gradient(160deg, #1a2e1f 0%, #0e1f13 60%, #1a2012 100%)`, fontFamily: "var(--font-dm-sans,'DM Sans',system-ui,sans-serif)", color: C.krem, position: "relative", overflow: "hidden" }}>
      {/* Latar motif batik global */}
      <MotifBatik opacity={0.035} />

      {/* Cahaya ambient hijau & emas */}
      <div style={{ position: "fixed", top: -200, left: "50%", transform: "translateX(-50%)", width: 700, height: 500, background: "radial-gradient(ellipse, rgba(45,90,64,0.3) 0%, transparent 70%)", pointerEvents: "none", zIndex: 0 }} />
      <div style={{ position: "fixed", bottom: -100, right: -100, width: 400, height: 400, background: "radial-gradient(ellipse, rgba(184,148,63,0.12) 0%, transparent 70%)", pointerEvents: "none", zIndex: 0 }} />

      {/* Notifikasi */}
      {toast.msg && (
        <div style={{ position: "fixed", top: 24, left: "50%", transform: "translateX(-50%)", background: toast.ok ? "#2D5A40" : "#7f1d1d", color: "white", padding: "12px 28px", borderRadius: 99, zIndex: 9999, fontSize: 14, fontWeight: 700, boxShadow: "0 8px 32px rgba(0,0,0,0.5)", border: `1px solid ${toast.ok ? "rgba(74,222,128,0.4)" : "rgba(248,113,113,0.4)"}`, whiteSpace: "nowrap", maxWidth: "90vw" }}>
          {toast.msg}
        </div>
      )}

      {/* ── Header ── */}
      <header style={{ background: "rgba(26,46,31,0.85)", backdropFilter: "blur(16px)", borderBottom: "1px solid rgba(184,148,63,0.25)", padding: "0 24px", height: 64, position: "sticky", top: 0, zIndex: 40, display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
          <a href="/admin" style={{ color: "rgba(250,248,243,.5)", textDecoration: "none", fontSize: 12, fontWeight: 600, letterSpacing: ".06em" }}>← Kembali</a>
          <div style={{ width: 1, height: 24, background: "rgba(184,148,63,.3)" }} />
          <KujangIcon size={28} color={C.emas} />
          <div>
            <div style={{ fontWeight: 800, fontSize: 15, color: C.krem, letterSpacing: ".02em" }}>Ronda Digital Ciburial</div>
            <div style={{ fontSize: 9, fontWeight: 700, color: C.emas, letterSpacing: ".18em", textTransform: "uppercase" }}>RW 08 · Satu Sektor · Satu Jiwa</div>
          </div>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <div style={{ background: "rgba(184,148,63,0.12)", border: "1px solid rgba(184,148,63,0.3)", borderRadius: 99, padding: "5px 14px", fontSize: 11, fontWeight: 700, color: C.emas }}>
            +{POIN_RONDA} poin / hadir
          </div>
          <div style={{ width: 8, height: 8, borderRadius: "50%", background: C.terang, boxShadow: `0 0 8px ${C.terang}`, animation: "nadiPulse 2s infinite" }} />
        </div>
      </header>

      <div style={{ maxWidth: 1060, margin: "0 auto", padding: "32px 20px 60px", position: "relative", zIndex: 1 }}>

        {/* ── Spanduk atas ── */}
        <div style={{ textAlign: "center", marginBottom: 36 }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 18, marginBottom: 12 }}>
            <div style={{ flex: 1, height: 1, background: "linear-gradient(90deg, transparent, rgba(184,148,63,0.4))" }} />
            <KujangIcon size={36} color={C.emas} />
            <div style={{ flex: 1, height: 1, background: "linear-gradient(90deg, rgba(184,148,63,0.4), transparent)" }} />
          </div>
          <h1 style={{ fontFamily: "'Cormorant Garamond',serif", fontSize: "clamp(28px,5vw,48px)", fontWeight: 300, color: C.krem, letterSpacing: "-.02em", margin: "0 0 8px" }}>
            Ronda Digital <em style={{ color: C.emasTerang }}>Ciburial RW 08</em>
          </h1>
          <p style={{ fontSize: 13, color: "rgba(250,248,243,.45)", lineHeight: 1.7 }}>
            Klik tanggal pada kalender → jadwal otomatis terbuat · Absen warga langsung tercatat
          </p>
        </div>

        {/* ── Grid utama: Kalender + Panel kanan ── */}
        <div style={{ display: "grid", gridTemplateColumns: "minmax(300px,480px) 1fr", gap: 24, alignItems: "start" }}>

          {/* ══ KALENDER ══ */}
          <div style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(184,148,63,0.2)", borderRadius: 24, overflow: "hidden", position: "relative" }}>
            <MotifBatik opacity={0.06} />

            {/* Navigasi bulan */}
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "20px 22px 16px", position: "relative" }}>
              <button onClick={bulanSebelum} style={{ background: "rgba(184,148,63,0.1)", border: "1px solid rgba(184,148,63,0.25)", borderRadius: 10, padding: "7px 14px", color: C.emas, cursor: "pointer", fontSize: 14, fontWeight: 700 }}>‹</button>
              <div style={{ textAlign: "center" }}>
                <div style={{ fontSize: 15, fontWeight: 800, color: C.krem, letterSpacing: ".02em" }}>{namaBulan}</div>
                <div style={{ fontSize: 10, color: "rgba(250,248,243,.35)", letterSpacing: ".12em", textTransform: "uppercase", marginTop: 2 }}>Kalender Ronda Harian</div>
              </div>
              <button onClick={bulanBerikut} style={{ background: "rgba(184,148,63,0.1)", border: "1px solid rgba(184,148,63,0.25)", borderRadius: 10, padding: "7px 14px", color: C.emas, cursor: "pointer", fontSize: 14, fontWeight: 700 }}>›</button>
            </div>

            {/* Nama hari */}
            <div style={{ display: "grid", gridTemplateColumns: "repeat(7,1fr)", padding: "0 14px", marginBottom: 6 }}>
              {["Min","Sen","Sel","Rab","Kam","Jum","Sab"].map(h => (
                <div key={h} style={{ textAlign: "center", fontSize: 9, fontWeight: 800, color: "rgba(250,248,243,.3)", letterSpacing: ".1em", paddingBottom: 6, textTransform: "uppercase" }}>{h}</div>
              ))}
            </div>

            {/* Grid tanggal */}
            <div style={{ display: "grid", gridTemplateColumns: "repeat(7,1fr)", gap: 4, padding: "0 14px 18px" }}>
              {/* Sel kosong sebelum hari pertama */}
              {Array.from({ length: hariPertama === 0 ? 6 : hariPertama - 1 }).map((_, i) => <div key={`e${i}`} />)}
              {Array.from({ length: jumlahHari }, (_, i) => {
                const tgl = i + 1;
                const tglStr = `${bulanAktif.y}-${String(bulanAktif.m + 1).padStart(2, "0")}-${String(tgl).padStart(2, "0")}`;
                const sudahAda = tglJadwal.has(tglStr);
                const jumlahHadir = tglAbsensi[tglStr] || 0;
                const isHariIni = tglStr === hariIni;
                const isAktif = tglStr === tanggalAktif;
                const isMasaDepan = tglStr > hariIni;

                return (
                  <button key={tgl} onClick={() => buatAtauAktifkanJadwal(tglStr)}
                    title={sudahAda ? `${jumlahHadir} warga hadir` : isMasaDepan ? "Klik untuk buat jadwal" : "Klik untuk buat jadwal"}
                    style={{
                      aspectRatio: "1", borderRadius: 10, border: isAktif ? `2px solid ${C.emas}` : sudahAda ? "1px solid rgba(74,222,128,0.4)" : isHariIni ? `1px solid ${C.emas}` : "1px solid transparent",
                      background: isAktif ? "rgba(184,148,63,0.25)" : sudahAda ? "rgba(45,90,64,0.5)" : isHariIni ? "rgba(184,148,63,0.12)" : "rgba(255,255,255,0.03)",
                      color: isAktif ? C.emasTerang : sudahAda ? C.terang : isHariIni ? C.emas : isMasaDepan ? "rgba(250,248,243,.3)" : "rgba(250,248,243,.65)",
                      cursor: "pointer", fontSize: 12, fontWeight: sudahAda || isAktif ? 800 : 500,
                      display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 1,
                      transition: "all .18s", position: "relative", padding: 0,
                    }}
                    onMouseEnter={e => { e.currentTarget.style.background = isAktif ? "rgba(184,148,63,0.3)" : "rgba(184,148,63,0.1)"; }}
                    onMouseLeave={e => { e.currentTarget.style.background = isAktif ? "rgba(184,148,63,0.25)" : sudahAda ? "rgba(45,90,64,0.5)" : isHariIni ? "rgba(184,148,63,0.12)" : "rgba(255,255,255,0.03)"; }}
                  >
                    <span style={{ fontSize: 12, lineHeight: 1 }}>{tgl}</span>
                    {sudahAda && <span style={{ fontSize: 7, color: C.terang, lineHeight: 1 }}>{jumlahHadir}✓</span>}
                    {isHariIni && !sudahAda && <span style={{ width: 4, height: 4, borderRadius: "50%", background: C.emas, display: "block" }} />}
                  </button>
                );
              })}
            </div>

            {/* Legenda */}
            <div style={{ borderTop: "1px solid rgba(184,148,63,0.15)", padding: "14px 20px", display: "flex", flexWrap: "wrap", gap: 14 }}>
              {[
                { warna: "rgba(45,90,64,0.5)", garis: "rgba(74,222,128,0.4)", label: "Sudah ronda" },
                { warna: "rgba(184,148,63,0.12)", garis: C.emas, label: "Hari ini" },
                { warna: "rgba(184,148,63,0.25)", garis: C.emas, label: "Dipilih" },
              ].map(l => (
                <div key={l.label} style={{ display: "flex", alignItems: "center", gap: 6 }}>
                  <div style={{ width: 14, height: 14, borderRadius: 4, background: l.warna, border: `1px solid ${l.garis}` }} />
                  <span style={{ fontSize: 10, color: "rgba(250,248,243,.45)" }}>{l.label}</span>
                </div>
              ))}
            </div>
          </div>

          {/* ══ PANEL KANAN ══ */}
          <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>

            {/* Jika belum pilih tanggal */}
            {!tanggalAktif && (
              <div style={{ background: "rgba(255,255,255,0.03)", border: "1px dashed rgba(184,148,63,0.3)", borderRadius: 24, padding: "48px 28px", textAlign: "center" }}>
                <KujangIcon size={48} color={C.emas} />
                <div style={{ fontSize: 16, fontWeight: 700, color: "rgba(250,248,243,.5)", marginTop: 16, marginBottom: 8 }}>Pilih Tanggal Ronda</div>
                <div style={{ fontSize: 13, color: "rgba(250,248,243,.3)", lineHeight: 1.7 }}>Klik tanggal pada kalender untuk memulai atau melihat daftar hadir ronda malam.</div>
              </div>
            )}

            {tanggalAktif && (
              <>
                {/* Info tanggal aktif */}
                <div style={{ background: "rgba(184,148,63,0.08)", border: "1px solid rgba(184,148,63,0.3)", borderRadius: 18, padding: "18px 22px", display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 12 }}>
                  <div>
                    <div style={{ fontSize: 10, fontWeight: 700, color: C.emas, letterSpacing: ".12em", textTransform: "uppercase", marginBottom: 4 }}>Jadwal Ronda Aktif</div>
                    <div style={{ fontSize: 16, fontWeight: 800, color: C.krem }}>
                      {new Date(tanggalAktif + "T00:00:00").toLocaleDateString("id-ID", { weekday: "long", day: "numeric", month: "long", year: "numeric" })}
                    </div>
                    <div style={{ fontSize: 12, color: "rgba(250,248,243,.5)", marginTop: 3 }}>Mulai pukul {JAM_RONDA} WIB · Satu Sektor RW 08</div>
                  </div>
                  <div style={{ textAlign: "center" }}>
                    <div style={{ fontSize: 32, fontWeight: 300, color: C.terang, lineHeight: 1 }}>{absensiAktif.length}</div>
                    <div style={{ fontSize: 10, color: "rgba(250,248,243,.4)", textTransform: "uppercase", letterSpacing: ".08em" }}>warga hadir</div>
                  </div>
                </div>

                {/* Sub-tab */}
                <div style={{ display: "flex", gap: 6, background: "rgba(255,255,255,0.04)", padding: 4, borderRadius: 14, border: "1px solid rgba(255,255,255,0.07)" }}>
                  {([["hadir", "📋 Daftar Hadir"], ["scan", "📡 Absen Warga"]] as const).map(([k, l]) => (
                    <button key={k} onClick={() => setTabSub(k)} style={{
                      flex: 1, padding: "10px", borderRadius: 10, fontSize: 13, fontWeight: 700, border: "none", cursor: "pointer", transition: "all .2s",
                      background: tabSub === k ? C.hijau : "transparent",
                      color: tabSub === k ? C.terang : "rgba(250,248,243,.4)",
                    }}>{l}</button>
                  ))}
                </div>

                {/* ── Tab: Daftar Hadir ── */}
                {tabSub === "hadir" && (
                  <div style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)", borderRadius: 20, overflow: "hidden" }}>
                    <div style={{ padding: "16px 20px", borderBottom: "1px solid rgba(255,255,255,0.06)", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                      <span style={{ fontSize: 11, fontWeight: 800, color: "rgba(250,248,243,.4)", textTransform: "uppercase", letterSpacing: ".1em" }}>Roster Warga Hadir</span>
                      <span style={{ background: "rgba(74,222,128,0.12)", border: "1px solid rgba(74,222,128,0.25)", borderRadius: 99, padding: "3px 12px", fontSize: 12, fontWeight: 700, color: C.terang }}>{absensiAktif.length} hadir</span>
                    </div>
                    <div style={{ maxHeight: 360, overflowY: "auto" }}>
                      {absensiAktif.length === 0 ? (
                        <div style={{ padding: "40px", textAlign: "center", color: "rgba(250,248,243,.25)", fontSize: 13 }}>
                          <div style={{ fontSize: 32, marginBottom: 12 }}>🔦</div>
                          Belum ada warga yang dicatat hadir malam ini
                        </div>
                      ) : absensiAktif.map((a, i) => (
                        <div key={a.id} style={{ display: "flex", alignItems: "center", gap: 14, padding: "13px 20px", borderBottom: i < absensiAktif.length - 1 ? "1px solid rgba(255,255,255,0.05)" : "none" }}>
                          <div style={{ width: 36, height: 36, borderRadius: 10, background: a.metode === "nfc" ? "rgba(74,222,128,0.12)" : "rgba(184,148,63,0.12)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 16, flexShrink: 0 }}>
                            {a.metode === "nfc" ? "📡" : "✍️"}
                          </div>
                          <div style={{ flex: 1 }}>
                            <div style={{ fontSize: 14, fontWeight: 700, color: C.krem }}>{a.nama}</div>
                            <div style={{ fontSize: 11, color: "rgba(250,248,243,.4)" }}>
                              {new Date(a.waktu_tap).toLocaleTimeString("id-ID", { hour: "2-digit", minute: "2-digit" })} WIB ·{" "}
                              {a.metode === "nfc" ? "Pindai NFC" : "Input Manual"}
                            </div>
                          </div>
                          <span style={{ fontSize: 13, fontWeight: 800, color: C.terang }}>+{POIN_RONDA}</span>
                        </div>
                      ))}
                    </div>
                    {absensiAktif.length > 0 && (
                      <div style={{ padding: "12px 20px", borderTop: "1px solid rgba(255,255,255,0.06)", display: "flex", justifyContent: "flex-end" }}>
                        <span style={{ fontSize: 12, fontWeight: 700, color: C.emas }}>Total poin terdistribusi: {absensiAktif.length * POIN_RONDA} poin</span>
                      </div>
                    )}
                  </div>
                )}

                {/* ── Tab: Absen Warga ── */}
                {tabSub === "scan" && (
                  <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>

                    {/* Input Manual */}
                    <div style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)", borderRadius: 20, padding: "22px" }}>
                      <div style={{ fontSize: 11, fontWeight: 800, color: "rgba(250,248,243,.4)", textTransform: "uppercase", letterSpacing: ".1em", marginBottom: 14 }}>✍️ Absen Manual</div>
                      <select value={manualKK} onChange={e => setManualKK(e.target.value)}
                        style={{ width: "100%", padding: "12px 16px", borderRadius: 12, border: "1px solid rgba(255,255,255,0.1)", fontSize: 14, background: "rgba(0,0,0,0.3)", color: C.krem, outline: "none", marginBottom: 12 }}>
                        <option value="">-- Pilih nama kepala keluarga --</option>
                        {kkList.map(k => <option key={k.id} value={k.id}>{k.kepala_keluarga} (RT {k.rt})</option>)}
                      </select>
                      <button onClick={() => { if (manualKK) { catatKehadiran(manualKK, "manual"); setManualKK(""); } }}
                        disabled={!manualKK}
                        style={{ width: "100%", background: manualKK ? C.hijau : "rgba(255,255,255,0.05)", color: manualKK ? C.terang : "rgba(255,255,255,.3)", border: "none", borderRadius: 12, padding: "12px", fontSize: 13, fontWeight: 700, cursor: manualKK ? "pointer" : "not-allowed", transition: "all .2s" }}>
                        Catat Hadir →
                      </button>
                    </div>

                    {/* NFC Scanner */}
                    <div style={{ background: "rgba(255,255,255,0.04)", border: `1px solid ${scanning ? "rgba(74,222,128,0.4)" : "rgba(255,255,255,0.08)"}`, borderRadius: 20, padding: "24px", textAlign: "center", position: "relative", overflow: "hidden", transition: "border-color .3s" }}>
                      <MotifBatik opacity={0.08} />
                      <div style={{ fontSize: 11, fontWeight: 800, color: "rgba(250,248,243,.4)", textTransform: "uppercase", letterSpacing: ".1em", marginBottom: 20 }}>📡 Pindai NFC</div>

                      {/* Lingkaran radar */}
                      <div style={{ position: "relative", width: 140, height: 140, borderRadius: "50%", margin: "0 auto 24px", border: `2px solid ${scanning ? "rgba(74,222,128,0.5)" : "rgba(255,255,255,0.1)"}`, display: "flex", alignItems: "center", justifyContent: "center", boxShadow: scanning ? "0 0 30px rgba(74,222,128,0.2)" : "none", transition: "all .3s" }}>
                        <div style={{ position: "absolute", inset: 16, borderRadius: "50%", border: `1px solid ${scanning ? "rgba(74,222,128,0.25)" : "rgba(255,255,255,0.05)"}` }} />
                        <div style={{ position: "absolute", inset: 32, borderRadius: "50%", border: `1px solid ${scanning ? "rgba(74,222,128,0.15)" : "rgba(255,255,255,0.03)"}` }} />
                        {scanning && <div style={{ position: "absolute", top: "50%", left: "50%", width: "50%", height: 2, background: "linear-gradient(90deg,transparent,rgba(74,222,128,0.8))", transformOrigin: "0 0", animation: "putarRadar 2s linear infinite" }} />}
                        <div style={{ fontSize: 44, position: "relative", zIndex: 2, filter: scanning ? "drop-shadow(0 0 10px rgba(74,222,128,0.6))" : "none", animation: scanning ? "nadiPulse 2s infinite" : "none" }}>
                          {scanning ? "📡" : "🛡️"}
                        </div>
                      </div>

                      {lastScan && (
                        <div style={{ background: "rgba(74,222,128,0.08)", border: "1px solid rgba(74,222,128,0.25)", borderRadius: 14, padding: "14px 18px", marginBottom: 16 }}>
                          <div style={{ fontSize: 10, fontWeight: 800, color: C.terang, letterSpacing: ".1em", marginBottom: 6 }}>✅ BERHASIL TERCATAT</div>
                          <div style={{ fontSize: 16, fontWeight: 800, color: C.krem }}>{lastScan.nama}</div>
                          {lastScan.poin > 0 && <div style={{ fontSize: 12, color: C.terang, marginTop: 4 }}>+{lastScan.poin} poin telah diberikan</div>}
                        </div>
                      )}

                      <button onClick={scanning ? matikanNFC : aktifkanNFC}
                        style={{ width: "100%", background: scanning ? "rgba(248,113,113,0.1)" : "rgba(74,222,128,0.15)", color: scanning ? "#f87171" : C.terang, border: scanning ? "1px solid rgba(248,113,113,0.3)" : "1px solid rgba(74,222,128,0.3)", borderRadius: 14, padding: "14px", fontSize: 14, fontWeight: 700, cursor: "pointer", transition: "all .2s", letterSpacing: ".02em" }}>
                        {scanning ? "⏹ Matikan Pemindai" : "▶ Aktifkan Pemindai NFC"}
                      </button>
                      <div style={{ fontSize: 10, color: "rgba(250,248,243,.25)", marginTop: 8 }}>Butuh Chrome Android + NFC aktif</div>
                    </div>
                  </div>
                )}
              </>
            )}

            {/* ── Statistik keseluruhan ── */}
            <div style={{ background: "rgba(184,148,63,0.06)", border: "1px solid rgba(184,148,63,0.2)", borderRadius: 20, padding: "20px 22px", position: "relative", overflow: "hidden" }}>
              <MotifBatik opacity={0.07} />
              <div style={{ fontSize: 11, fontWeight: 800, color: C.emas, letterSpacing: ".1em", textTransform: "uppercase", marginBottom: 16 }}>📊 Rekap Ronda RW 08</div>
              <div style={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: 12, position: "relative" }}>
                {[
                  { angka: jadwal.length, label: "Malam Ronda" },
                  { angka: absensi.length, label: "Total Hadir" },
                  { angka: absensi.length * POIN_RONDA, label: "Poin Disebar" },
                ].map((s, i) => (
                  <div key={i} style={{ textAlign: "center", padding: "14px 8px", background: "rgba(255,255,255,0.04)", borderRadius: 14 }}>
                    <div style={{ fontSize: 24, fontWeight: 300, color: C.emasTerang, fontFamily: "'Cormorant Garamond',serif", lineHeight: 1 }}>{s.angka.toLocaleString("id-ID")}</div>
                    <div style={{ fontSize: 9, color: "rgba(250,248,243,.4)", textTransform: "uppercase", letterSpacing: ".08em", marginTop: 4 }}>{s.label}</div>
                  </div>
                ))}
              </div>
            </div>

          </div>
        </div>
      </div>

      <style>{`
        @keyframes nadiPulse { 0%,100%{opacity:1;transform:scale(1)} 50%{opacity:.6;transform:scale(1.15)} }
        @keyframes putarRadar { from{transform:rotate(0deg)} to{transform:rotate(360deg)} }
        ::-webkit-scrollbar{width:5px}
        ::-webkit-scrollbar-track{background:rgba(26,46,31,.5)}
        ::-webkit-scrollbar-thumb{background:rgba(184,148,63,.4);border-radius:10px}
      `}</style>
    </div>
  );
}
