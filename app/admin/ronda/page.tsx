"use client";
import { useState, useEffect, useRef } from "react";
import { supabase, isSupabaseReady } from "@/lib/supabase";

interface Jadwal { id:string; tanggal:string; rt:string; jam_mulai:string; }
interface Absensi { id:string; jadwal_id:string; kk_id:string; nama:string; waktu_tap:string; metode:string; status:string; }

const POIN_RONDA = 30;
const JAM_RONDA = "21:00";

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
    if (error) return tampilPesan(`Gagal membuat jadwal: ${error.message}`, false);
    tampilPesan("Jadwal ronda berhasil dibuat.");
    await muatSemua();
    setJadwalAktif(data.id);
  }

  async function catatKehadiran(kkId: string, metode: "nfc" | "manual") {
    const currentJadwal = jadwalAktifRef.current;
    if (!currentJadwal) return tampilPesan("Anda harus memilih tanggal di kalender terlebih dahulu.", false);

    const kk = kkListRef.current.find(k => k.id === kkId || k.nfc_id === kkId);
    const anggota = anggotaListRef.current.find(a => a.kk_id === (kk?.id || kkId) || a.nfc_id === kkId);

    if (!kk && !anggota) return tampilPesan("Kartu warga atau data identitas tidak dikenali.", false);

    const nama = kk?.kepala_keluarga || anggota?.nama || "Tidak Diketahui";
    const realKKId = kk?.id || anggota?.kk_id;

    if (!realKKId) return tampilPesan("Data identitas tidak valid.", false);

    const { data: cekAbsen } = await supabase.from("absensi_ronda")
      .select("id").eq("jadwal_id", currentJadwal).eq("kk_id", realKKId).limit(1);
    if (cekAbsen && cekAbsen.length > 0)
      return tampilPesan(`Warga bernama ${nama} sudah tercatat hadir.`, false);

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
        keterangan: `Ronda Digital RW 08 - ${new Date(tanggalAktif).toLocaleDateString("id-ID", { weekday: "long", day: "numeric", month: "long", year: "numeric" })}`,
      });
      poinDitambah = POIN_RONDA;
    }

    setLastScan({ nama, poin: poinDitambah });
    tampilPesan(`Kehadiran ${nama} berhasil dicatat.`);
    muatSemua();
  }

  async function aktifkanNFC() {
    if (!("NDEFReader" in window)) return tampilPesan("Fitur ini membutuhkan peramban web pada ponsel cerdas Android dengan NFC aktif.", false);
    try {
      const ndef = new (window as any).NDEFReader();
      nfcRef.current = ndef;
      await ndef.scan();
      setScanning(true);
      tampilPesan("Pemindai NFC aktif. Silakan tempelkan kartu pintar warga.");
      ndef.addEventListener("reading", ({ serialNumber }: any) => {
        const nfcId = serialNumber.replace(/:/g, "").toUpperCase();
        catatKehadiran(nfcId, "nfc");
      });
    } catch { tampilPesan("Gagal menginisiasi modul pemindai NFC.", false); }
  }

  function matikanNFC() {
    nfcRef.current?.stop?.();
    setScanning(false);
    tampilPesan("Pemindai NFC telah dinonaktifkan.");
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

  // Tema Terang, Bersih, Profesional
  const C = {
    utama: "#F5F0E8",          // Latar belakang utama
    card: "#FFFEF9",           // Latar card / komponen
    teksUtama: "#1C3A2B",      // Hijau gelap tebal
    teksSekunder: "#9A8C85",   // Abu-abu kecoklatan
    emas: "#B8943F",           // Aksen emas
    border: "#E5E0D8",         // Garis batas
  };

  return (
    <div style={{ minHeight: "100vh", background: C.utama, fontFamily: "'Inter', system-ui, sans-serif", color: C.teksUtama }}>
      
      {toast.msg && (
        <div style={{ position: "fixed", top: 24, left: "50%", transform: "translateX(-50%)", background: toast.ok ? C.teksUtama : "#8B2020", color: "white", padding: "14px 32px", borderRadius: 12, zIndex: 9999, fontSize: 13, fontWeight: 700, boxShadow: "0 10px 40px rgba(0,0,0,0.1)", border: `1px solid ${C.border}` }}>
          {toast.msg}
        </div>
      )}

      {/* Header Utama */}
      <header style={{ background: C.card, borderBottom: `1px solid ${C.border}`, padding: "0 24px", height: 72, position: "sticky", top: 0, zIndex: 40, display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
          <a href="/admin" style={{ color: C.teksSekunder, textDecoration: "none", fontSize: 13, fontWeight: 700, padding: "8px 16px", border: `1px solid ${C.border}`, borderRadius: 8, transition: "background .15s" }} onMouseEnter={e => e.currentTarget.style.background="#F5F0E8"} onMouseLeave={e => e.currentTarget.style.background="transparent"}>
            Kembali
          </a>
          <div style={{ width: 1, height: 24, background: C.border }} />
          <div style={{ fontWeight: 800, fontSize: 18, color: C.teksUtama, letterSpacing: ".02em", fontFamily: "'Cormorant Garamond', serif" }}>
            Sistem Ronda Ciburial
          </div>
        </div>
      </header>

      <div style={{ maxWidth: 1100, margin: "0 auto", padding: "40px 24px 80px" }}>

        <div style={{ textAlign: "center", marginBottom: 40 }}>
          <h1 style={{ fontSize: "clamp(30px, 4vw, 42px)", fontWeight: 700, color: C.teksUtama, letterSpacing: "-.02em", margin: "0 0 12px", fontFamily: "'Cormorant Garamond', serif" }}>
            Sistem Pencatatan <span style={{ color: C.emas }}>Digital</span>
          </h1>
          <p style={{ fontSize: 15, color: C.teksSekunder, maxWidth: 640, margin: "0 auto", lineHeight: 1.6 }}>
            Kelola kehadiran kegiatan ronda malam lingkungan secara terpusat untuk RW 08. Data didistribusi ke sistem poin secara langsung.
          </p>
        </div>

        {/* ── Komponen Atas: Kalender + Scanner + Log ── */}
        <div style={{ display: "grid", gridTemplateColumns: "minmax(340px, 380px) 1fr", gap: 28, alignItems: "start", marginBottom: 48 }}>
          
          {/* Kolom Kiri: Kalender */}
          <div style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: 16, overflow: "hidden", boxShadow: "0 2px 10px rgba(0,0,0,0.02)" }}>
            <div style={{ padding: "20px 24px", borderBottom: `1px solid ${C.border}`, background: "#FAF8F3" }}>
              <div style={{ fontSize: 11, fontWeight: 800, color: C.teksUtama, letterSpacing: ".1em", textTransform: "uppercase" }}>Jadwal Ronda Bulanan</div>
            </div>
            <div style={{ padding: 24 }}>
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 20 }}>
                <button onClick={bulanSebelum} style={{ background: C.utama, border: `1px solid ${C.border}`, borderRadius: 8, padding: "6px 12px", color: C.teksUtama, cursor: "pointer", fontWeight: 700 }}>Kembali</button>
                <div style={{ fontSize: 15, fontWeight: 800, color: C.teksUtama }}>{namaBulan}</div>
                <button onClick={bulanBerikut} style={{ background: C.utama, border: `1px solid ${C.border}`, borderRadius: 8, padding: "6px 12px", color: C.teksUtama, cursor: "pointer", fontWeight: 700 }}>Lanjut</button>
              </div>

              <div style={{ display: "grid", gridTemplateColumns: "repeat(7,1fr)", gap: 4, marginBottom: 8 }}>
                {["Min","Sen","Sel","Rab","Kam","Jum","Sab"].map(h => (
                  <div key={h} style={{ textAlign: "center", fontSize: 10, fontWeight: 800, color: C.teksSekunder, textTransform: "uppercase", paddingBottom: 8 }}>{h}</div>
                ))}
              </div>

              <div style={{ display: "grid", gridTemplateColumns: "repeat(7,1fr)", gap: 6 }}>
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
                        aspectRatio: "1", borderRadius: 8,
                        border: isAktif ? `1px solid ${C.emas}` : isHariIni ? `1px dashed ${C.teksSekunder}` : `1px solid transparent`,
                        background: isAktif ? "rgba(184,148,63,0.1)" : sudahAda ? "#F3EFE9" : "transparent",
                        color: isAktif ? C.emas : C.teksUtama,
                        cursor: "pointer", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center",
                        fontSize: 13, fontWeight: sudahAda || isAktif ? 700 : 500, transition: "background .15s",
                      }}
                      onMouseEnter={e => { if(!isAktif && !sudahAda) e.currentTarget.style.background = C.utama; }}
                      onMouseLeave={e => { if(!isAktif && !sudahAda) e.currentTarget.style.background = "transparent"; }}
                    >
                      <span>{tgl}</span>
                      {sudahAda && <span style={{ fontSize: 9, color: C.emas, marginTop: 2 }}>{jumlahHadir} hadir</span>}
                    </button>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Kolom Kanan: Scanner & Log */}
          <div style={{ display: "flex", flexDirection: "column", gap: 28 }}>
            
            {!tanggalAktif ? (
              <div style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: 16, padding: "60px 40px", textAlign: "center", height: "100%", display: "flex", flexDirection: "column", justifyContent: "center" }}>
                <div style={{ fontSize: 18, fontWeight: 700, color: C.teksUtama, marginBottom: 12, fontFamily: "'Cormorant Garamond', serif" }}>Menunggu Pilihan Tanggal</div>
                <div style={{ fontSize: 14, color: C.teksSekunder, lineHeight: 1.6, maxWidth: 360, margin: "0 auto" }}>
                  Pilih tanggal pada kalender untuk memulai sesi pencatatan kehadiran personel ronda.
                </div>
              </div>
            ) : (
              <>
                {/* Modul Scanner & Input */}
                <div style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: 16, overflow: "hidden", boxShadow: "0 2px 10px rgba(0,0,0,0.02)" }}>
                  <div style={{ padding: "20px 24px", borderBottom: `1px solid ${C.border}`, background: "#FAF8F3", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                    <div>
                      <div style={{ fontSize: 11, fontWeight: 800, color: C.teksUtama, letterSpacing: ".1em", textTransform: "uppercase" }}>Tercatat</div>
                      <div style={{ fontSize: 15, fontWeight: 700, color: C.teksUtama, marginTop: 4 }}>
                        {new Date(tanggalAktif).toLocaleDateString("id-ID", { day: "numeric", month: "long", year: "numeric" })}
                      </div>
                    </div>
                  </div>

                  <div style={{ padding: 24, display: "grid", gridTemplateColumns: "1fr 1fr", gap: 24 }}>
                    
                    {/* NFC Scanner Area */}
                    <div style={{ background: scanning ? "#F8FBF9" : C.utama, border: `1px solid ${scanning ? "#4A7C59" : C.border}`, borderRadius: 12, padding: 20, textAlign: "center", transition: "all .3s" }}>
                      <div style={{ fontSize: 12, fontWeight: 700, color: C.teksUtama, marginBottom: 16 }}>Pemindaian Kartu NFC</div>
                      <div style={{ position: "relative", width: 64, height: 64, borderRadius: "50%", margin: "0 auto 16px", border: `2px solid ${scanning ? "#4A7C59" : C.border}`, display: "flex", alignItems: "center", justifyContent: "center", background: C.card }}>
                        <div style={{ width: 24, height: 2, background: scanning ? "#4A7C59" : C.teksSekunder, borderRadius: 2, position: "absolute" }} />
                        <div style={{ width: 2, height: 24, background: scanning ? "#4A7C59" : C.teksSekunder, borderRadius: 2, position: "absolute" }} />
                      </div>
                      
                      {lastScan && (
                        <div style={{ fontSize: 12, fontWeight: 700, color: C.emas, marginBottom: 16 }}>
                          {lastScan.nama} Tercatat (+{lastScan.poin} Poin)
                        </div>
                      )}

                      <button onClick={scanning ? matikanNFC : aktifkanNFC}
                        style={{ width: "100%", background: scanning ? "#FDF0F0" : "#1C3A2B", color: scanning ? "#8B2020" : "#fff", border: scanning ? "1px solid #F0C8C8" : "none", borderRadius: 8, padding: "10px", fontSize: 12, fontWeight: 700, cursor: "pointer", transition: "background .2s" }}>
                        {scanning ? "Matikan Pemindai" : "Aktifkan Pemindai"}
                      </button>
                    </div>

                    {/* Manual Input Area */}
                    <div style={{ display: "flex", flexDirection: "column" }}>
                      <div style={{ fontSize: 12, fontWeight: 700, color: C.teksUtama, marginBottom: 10 }}>Pencatatan Manual</div>
                      <select value={manualKK} onChange={e => setManualKK(e.target.value)}
                        style={{ width: "100%", padding: "12px", borderRadius: 8, border: `1px solid ${C.border}`, fontSize: 13, background: C.card, color: C.teksUtama, outline: "none", marginBottom: 16, cursor: "pointer" }}>
                        <option value="">Pilih identitas personel...</option>
                        {kkList.map(k => <option key={k.id} value={k.id}>{k.kepala_keluarga} (RT {k.rt})</option>)}
                      </select>
                      <button onClick={() => { if (manualKK) { catatKehadiran(manualKK, "manual"); setManualKK(""); } }}
                        disabled={!manualKK}
                        style={{ marginTop: "auto", width: "100%", background: manualKK ? C.emas : C.utama, color: manualKK ? "#fff" : C.teksSekunder, border: "none", borderRadius: 8, padding: "12px", fontSize: 13, fontWeight: 700, cursor: manualKK ? "pointer" : "not-allowed", transition: "background .2s" }}>
                        Catat Kehadiran
                      </button>
                    </div>
                  </div>
                </div>

                {/* Log Kehadiran */}
                <div style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: 16, overflow: "hidden", boxShadow: "0 2px 10px rgba(0,0,0,0.02)" }}>
                  <div style={{ padding: "16px 24px", borderBottom: `1px solid ${C.border}`, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                    <span style={{ fontSize: 11, fontWeight: 800, color: C.teksUtama, textTransform: "uppercase", letterSpacing: ".1em" }}>Daftar Personel Hadir</span>
                    <span style={{ fontSize: 12, fontWeight: 700, color: C.emas }}>Jumlah: {absensiAktif.length}</span>
                  </div>
                  <div style={{ maxHeight: 300, overflowY: "auto" }}>
                    {absensiAktif.length === 0 ? (
                      <div style={{ padding: "30px", textAlign: "center", color: C.teksSekunder, fontSize: 13 }}>
                        Belum ada pencatatan kehadiran untuk tanggal ini.
                      </div>
                    ) : absensiAktif.map((a, i) => (
                      <div key={a.id} style={{ display: "flex", alignItems: "center", gap: 14, padding: "14px 24px", borderBottom: i < absensiAktif.length - 1 ? `1px solid ${C.border}` : "none" }}>
                        <div style={{ fontSize: 11, fontWeight: 700, color: C.teksSekunder, background: C.utama, padding: "4px 8px", borderRadius: 6 }}>
                          {new Date(a.waktu_tap).toLocaleTimeString("id-ID", { hour: "2-digit", minute: "2-digit" })}
                        </div>
                        <div style={{ flex: 1 }}>
                          <div style={{ fontSize: 14, fontWeight: 700, color: C.teksUtama }}>{a.nama}</div>
                          <div style={{ fontSize: 11, color: C.teksSekunder, marginTop: 4 }}>Metode: {a.metode === "nfc" ? "Pemindai NFC" : "Sistem Manual"}</div>
                        </div>
                        <div style={{ color: C.emas, fontSize: 12, fontWeight: 700 }}>+{POIN_RONDA} Poin</div>
                      </div>
                    ))}
                  </div>
                </div>
              </>
            )}
          </div>
        </div>

        {/* ── Panduan Tampil Terbuka di Bawah ── */}
        <div style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: 16, padding: "36px 40px", boxShadow: "0 2px 10px rgba(0,0,0,0.02)" }}>
          <h2 style={{ fontSize: 24, fontWeight: 700, color: C.teksUtama, marginBottom: 28, fontFamily: "'Cormorant Garamond', serif" }}>Panduan Sistem Ronda</h2>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))", gap: 32 }}>
            <div>
              <div style={{ fontSize: 13, fontWeight: 800, color: C.emas, marginBottom: 8, letterSpacing: ".05em" }}>LANGKAH PERTAMA</div>
              <div style={{ fontSize: 16, fontWeight: 700, color: C.teksUtama, marginBottom: 8 }}>Pilih Tanggal</div>
              <div style={{ fontSize: 14, color: C.teksSekunder, lineHeight: 1.6 }}>Klik tanggal yang dituju pada kalender bulanan. Sistem akan secara otomatis mengelola pengaturan tabel absensi dasar untuk lingkungan.</div>
            </div>
            <div>
              <div style={{ fontSize: 13, fontWeight: 800, color: C.emas, marginBottom: 8, letterSpacing: ".05em" }}>LANGKAH KEDUA</div>
              <div style={{ fontSize: 16, fontWeight: 700, color: C.teksUtama, marginBottom: 8 }}>Merekam Identitas</div>
              <div style={{ fontSize: 14, color: C.teksSekunder, lineHeight: 1.6 }}>Pada kolom pencatatan, personel dapat langsung menempelkan kartu pinta pada perangkat sistem utama, atau operator dapat memvalidasi identitas dari daftar secara manual.</div>
            </div>
            <div>
              <div style={{ fontSize: 13, fontWeight: 800, color: C.emas, marginBottom: 8, letterSpacing: ".05em" }}>LANGKAH KETIGA</div>
              <div style={{ fontSize: 16, fontWeight: 700, color: C.teksUtama, marginBottom: 8 }}>Mulai Bertugas</div>
              <div style={{ fontSize: 14, color: C.teksSekunder, lineHeight: 1.6 }}>Setiap pencatatan identitas berhasil, sistem insentif digital desa langsung memproses injeksi poin saldo bagi keluarga yang bersangkutan.</div>
            </div>
          </div>
        </div>

      </div>

      <style>{`
        ::-webkit-scrollbar { width: 6px; }
        ::-webkit-scrollbar-track { background: ${C.utama}; }
        ::-webkit-scrollbar-thumb { background: #D0C9BE; border-radius: 10px; }
      `}</style>
    </div>
  );
}
