"use client";
import { useState, useEffect, useRef } from "react";
import { supabase, isSupabaseReady } from "@/lib/supabase";

interface Voting { id: string; judul: string; deskripsi: string; tgl_mulai: string; tgl_selesai: string; status: string; }
interface Pilihan { id: string; voting_id: string; teks: string; jumlah_vote: number; }
interface Pemilih { id: string; kk_id: string; nama: string; nfc_id: string; tgl_lahir: string; rt: string; }

function hitungUmur(tgl_lahir: string) {
  if (!tgl_lahir) return 0;
  const d1 = new Date(), d2 = new Date(tgl_lahir);
  let age = d1.getFullYear() - d2.getFullYear();
  const m = d1.getMonth() - d2.getMonth();
  if (m < 0 || (m === 0 && d1.getDate() < d2.getDate())) age--;
  return age;
}

function parseJudul(str: string) {
  if (str.startsWith("[PEMILU] ")) return { tipe: "PEMILU", text: str.replace("[PEMILU] ", "") };
  if (str.startsWith("[MUSYAWARAH] ")) return { tipe: "MUSYAWARAH", text: str.replace("[MUSYAWARAH] ", "") };
  return { tipe: "STANDAR", text: str };
}
function parseKandidat(str: string) {
  const parts = str.split("|||");
  return { nama: parts[0], foto: parts[1] || null };
}

const PESAN_MOTIVASI = [
  { foto: "/vm1.png", kutipan: "Satu suara Anda adalah cahaya bagi masa depan kampung. Gunakan hak pilih dengan penuh tanggung jawab.", nama: "Bapak Ketua RW 08" },
  { foto: "/vm2.png", kutipan: "Teknologi digital hadir bukan untuk mempersulit, tapi mempermudah kita berdemokrasi dari rumah sendiri.", nama: "Warga Digital Ciburial" },
  { foto: "/vm3.png", kutipan: "Bersatu kita coblos! Demokrasi yang kuat lahir dari partisipasi aktif seluruh warga, tanpa terkecuali.", nama: "Komunitas RW 08 Ciburial" },
  { foto: "/vm4.png", kutipan: "Tap kartu, berikan suara. Sesederhana itu hak pilih Anda dihitung dan dihormati sistem Eco-Digital.", nama: "Tim TI Kampung Ciburial" },
  { foto: "/vm5.png", kutipan: "Suara Anda hari ini adalah warisan terbaik yang bisa kita titipkan kepada generasi penerus kampung kita.", nama: "Pesan KPK Ciburial RW 08" },
];

const C = {
  cream: "#f5f0e8",
  darkGreen: "#1a2e1f",
  green: "#2d5a40",
  lightGreen: "#7a9a7e",
  gold: "#b8943f",
  red: "#c0392b",
  white: "#ffffff",
};

export default function VotingPage() {
  const [votings, setVotings] = useState<Voting[]>([]);
  const [aktivPilihan, setAktivPilihan] = useState<Pilihan[]>([]);
  const [pemilihList, setPemilihList] = useState<Pemilih[]>([]);

  const [activeVoting, setActiveVoting] = useState<Voting | null>(null);
  const [scanning, setScanning] = useState(false);
  const [terverifikasi, setTerverifikasi] = useState<Pemilih | null>(null);
  const [konfirmasi, setKonfirmasi] = useState<Pilihan | null>(null);
  const [loading, setLoading] = useState(false);
  const [fetchError, setFetchError] = useState<string | null>(null);
  const [toast, setToast] = useState({ msg: "", type: "info" });
  const [slideIdx, setSlideIdx] = useState(0);

  const nfcRef = useRef<any>(null);
  const pemilihRef = useRef<Pemilih[]>([]);
  useEffect(() => { pemilihRef.current = pemilihList; }, [pemilihList]);

  // Auto-slide motivasi
  useEffect(() => {
    if (activeVoting) return;
    const t = setInterval(() => setSlideIdx(i => (i + 1) % PESAN_MOTIVASI.length), 5000);
    return () => clearInterval(t);
  }, [activeVoting]);

  const showToast = (msg: string, type: "success" | "error" | "info" = "info") => {
    setToast({ msg, type });
    setTimeout(() => setToast({ msg: "", type: "info" }), 4000);
  };

  // Fetch global list
  useEffect(() => {
    if (!isSupabaseReady()) return;
    Promise.all([
      supabase.from("voting").select("*").eq("status", "aktif").order("created_at", { ascending: false }),
      supabase.from("anggota_kk").select("id, kk_id, nama, nfc_id, tgl_lahir, keluarga(rt)"),
      supabase.from("keluarga").select("id, kepala_keluarga, nfc_id, rt, tgl_lahir_kepala"),
    ]).then(([vRes, angRes, kkRes]) => {
      if (vRes.data) setVotings(vRes.data);

      let list: Pemilih[] = [];
      if (angRes.data) {
        (angRes.data as any[]).filter(a => hitungUmur(a.tgl_lahir) >= 18).forEach(a =>
          list.push({ id: a.id, kk_id: a.kk_id, nama: a.nama, nfc_id: a.nfc_id, tgl_lahir: a.tgl_lahir, rt: (a.keluarga as any)?.rt ?? "" })
        );
      }
      if (kkRes.data) {
        (kkRes.data as any[]).filter(k => hitungUmur(k.tgl_lahir_kepala) >= 18).forEach(k =>
          list.push({ id: k.id, kk_id: k.id, nama: k.kepala_keluarga, nfc_id: k.nfc_id, tgl_lahir: k.tgl_lahir_kepala, rt: k.rt })
        );
      }
      const unik = Array.from(new Map(list.filter(v => v.nfc_id).map(v => [v.nfc_id, v])).values());
      setPemilihList(unik);
    });
  }, []);

  // Fetch pilihan LAZILY ketika user Pilih agenda
  async function bukaBilik(v: Voting) {
    setActiveVoting(v);
    setAktivPilihan([]);
    setFetchError(null);
    setTerverifikasi(null);
    setKonfirmasi(null);

    try {
      const { data, error } = await supabase.from("pilihan_voting").select("*").eq("voting_id", v.id);
      if (error) {
        setFetchError(`Supabase Error: ${error.message} (kode: ${error.code})`);
        return;
      }
      if (!data || data.length === 0) {
        setFetchError("DATA KOSONG — Kemungkinan RLS (Row Level Security) Supabase memblokir akses. Jalankan SQL di bawah di Supabase → SQL Editor");
        return;
      }
      setAktivPilihan(data);
    } catch (e: any) {
      setFetchError(`Koneksi error: ${e?.message ?? e}`);
    }
  }

  // NFC
  async function startNFC() {
    if (!("NDEFReader" in window)) return showToast("Perangkat tidak mendukung NFC (Chrome Android diperlukan).", "error");
    try {
      const ndef = new (window as any).NDEFReader();
      nfcRef.current = ndef;
      await ndef.scan();
      setScanning(true);
      showToast("📡 Pemindai Aktif! Tempelkan ID Card ke belakang HP...", "info");
      ndef.addEventListener("reading", async ({ serialNumber }: any) => {
        const nfcId = serialNumber.replace(/:/g, "").toUpperCase();
        const found = pemilihRef.current.find(p => p.nfc_id === nfcId);
        if (!found) return showToast("❌ Kartu ditolak! Tidak terdaftar / usia < 18 tahun.", "error");
        stopNFC();
        await verifikasi(found);
      });
    } catch { showToast("Gagal mengakses NFC.", "error"); }
  }

  function stopNFC() { nfcRef.current?.stop?.(); setScanning(false); }

  async function verifikasi(p: Pemilih) {
    if (!activeVoting) return;
    setLoading(true);
    const { data } = await supabase.from("vote_record").select("id").eq("voting_id", activeVoting.id).eq("ip_address", p.id).limit(1);
    if (data && data.length > 0) {
      showToast(`Akses Ditolak: Hak suara ${p.nama} sudah digunakan!`, "error");
      setActiveVoting(null);
    } else {
      setTerverifikasi(p);
      showToast(`✅ Terverifikasi: ${p.nama}`, "success");
    }
    setLoading(false);
  }

  async function kirimSuara() {
    if (!activeVoting || !terverifikasi || !konfirmasi) return;
    setLoading(true);
    try {
      const { error } = await supabase.from("vote_record").insert({
        voting_id: activeVoting.id,
        kk_id: terverifikasi.kk_id,
        ip_address: terverifikasi.id,
      });
      if (error) throw error;

      const terpilih = aktivPilihan.find(p => p.id === konfirmasi.id);
      if (terpilih) await supabase.from("pilihan_voting").update({ jumlah_vote: (terpilih.jumlah_vote || 0) + 1 }).eq("id", terpilih.id);

      showToast("🎉 Suara sah berhasil masuk ke kotak digital!", "success");
      setKonfirmasi(null);
      setActiveVoting(null);
      setTerverifikasi(null);
    } catch { showToast("Gagal menyimpan suara. Coba lagi.", "error"); }
    setLoading(false);
  }

  const tipeAktif = activeVoting ? parseJudul(activeVoting.judul) : null;
  const slide = PESAN_MOTIVASI[slideIdx];

  return (
    <div style={{ minHeight: "100vh", background: C.cream, fontFamily: "'Inter','DM Sans',system-ui,sans-serif", color: C.darkGreen }}>
      {/* Toast */}
      {toast.msg && (
        <div style={{ position: "fixed", top: 24, left: "50%", transform: "translateX(-50%)", zIndex: 9999, padding: "14px 28px", borderRadius: 12, background: toast.type === "success" ? C.green : toast.type === "error" ? C.red : C.darkGreen, color: "white", fontWeight: 800, fontSize: 14, boxShadow: "0 15px 35px rgba(0,0,0,0.25)", animation: "slideDown .4s ease" }}>
          {toast.msg}
        </div>
      )}

      {/* Konfirmasi Modal */}
      {konfirmasi && (
        <div style={{ position: "fixed", inset: 0, background: "rgba(26,46,31,.95)", zIndex: 999, display: "flex", alignItems: "center", justifyContent: "center" }}>
          <div style={{ background: C.white, borderRadius: 28, padding: 40, maxWidth: 480, width: "100%", textAlign: "center", animation: "zoomIn .3s ease" }}>
            <div style={{ fontSize: 44, marginBottom: 12 }}>🔒</div>
            <h2 style={{ margin: "0 0 8px", fontSize: 22, color: C.darkGreen, fontWeight: 900 }}>Kunci Pilihan Anda?</h2>
            <p style={{ color: C.lightGreen, fontSize: 14, margin: "0 0 24px", lineHeight: 1.7 }}>Pilihan yang disahkan tidak bisa diubah atau dibatalkan oleh siapapun. Pastikan ini adalah keputusan terbaik Anda.</p>
            <div style={{ background: C.cream, borderRadius: 16, padding: 20, marginBottom: 28 }}>
              <div style={{ fontSize: 12, color: C.lightGreen, fontWeight: 800, letterSpacing: "0.08em", marginBottom: 8 }}>PILIHAN ANDA:</div>
              <div style={{ fontSize: 20, fontWeight: 900, color: C.green }}>{parseKandidat(konfirmasi.teks).nama}</div>
            </div>
            <div style={{ display: "flex", gap: 12 }}>
              <button onClick={() => setKonfirmasi(null)} style={{ flex: 1, padding: 16, borderRadius: 12, background: "transparent", border: `2px solid ${C.lightGreen}`, color: C.lightGreen, fontWeight: 800, fontSize: 14, cursor: "pointer" }}>Koreksi</button>
              <button onClick={kirimSuara} disabled={loading} style={{ flex: 2, padding: 16, borderRadius: 12, background: C.green, color: "white", border: "none", fontWeight: 900, fontSize: 15, cursor: loading ? "not-allowed" : "pointer" }}>
                {loading ? "Menyimpan..." : "🔐 SAH! Masukkan Suara"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Header */}
      <header style={{ background: C.white, borderBottom: "1px solid rgba(45,90,64,.12)", padding: "20px 32px", display: "flex", alignItems: "center", justifyContent: "space-between", position: "sticky", top: 0, zIndex: 50, boxShadow: "0 4px 20px rgba(0,0,0,.05)" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
          <div style={{ width: 52, height: 52, background: C.green, borderRadius: 14, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 26 }}>🗳️</div>
          <div>
            <div style={{ fontSize: 10, color: C.green, letterSpacing: "0.2em", fontWeight: 900 }}>KPK CIBURIAL RW 08 — E-VOTING</div>
            <h1 style={{ margin: 0, fontSize: 20, fontWeight: 900, color: C.darkGreen }}>Bilik Suara Pintar Digital</h1>
          </div>
        </div>
        {terverifikasi ? (
          <div style={{ background: "rgba(45,90,64,.08)", border: `1px solid rgba(45,90,64,.25)`, borderRadius: 99, padding: "10px 20px", display: "flex", alignItems: "center", gap: 10 }}>
            <div style={{ width: 8, height: 8, background: C.green, borderRadius: "50%", animation: "pulse 1.5s infinite" }} />
            <div>
              <div style={{ fontSize: 10, color: C.lightGreen, fontWeight: 800, textTransform: "uppercase" }}>DPT Terverifikasi</div>
              <div style={{ fontSize: 14, fontWeight: 900, color: C.green }}>{terverifikasi.nama}</div>
            </div>
          </div>
        ) : (
          <a href="/" style={{ color: C.lightGreen, fontSize: 13, fontWeight: 700, textDecoration: "none" }}>← Kembali</a>
        )}
      </header>

      <main style={{ maxWidth: 1000, margin: "0 auto", padding: "36px 20px" }}>

        {/* ===== LOBBY: Pilih Agenda ===== */}
        {!activeVoting && (
          <>
            {/* Motivasi Slide */}
            <div style={{ borderRadius: 24, overflow: "hidden", marginBottom: 32, position: "relative", height: 280, background: C.darkGreen, boxShadow: "0 15px 40px rgba(0,0,0,.15)" }}>
              <img src={slide.foto} alt="motivasi" style={{ position: "absolute", inset: 0, width: "100%", height: "100%", objectFit: "cover", opacity: 0.45, transition: "opacity .5s" }} />
              <div style={{ position: "absolute", inset: 0, background: "linear-gradient(to right, rgba(26,46,31,.95) 0%, rgba(26,46,31,.2) 100%)" }} />
              <div style={{ position: "relative", zIndex: 2, padding: "36px 40px", height: "100%", display: "flex", flexDirection: "column", justifyContent: "center" }}>
                <div style={{ fontSize: 11, color: C.gold, fontWeight: 900, letterSpacing: "0.2em", marginBottom: 12, textTransform: "uppercase" }}>💬 Pesan Motivasi Pemilihan</div>
                <blockquote style={{ margin: 0, fontSize: 22, fontWeight: 800, color: "white", lineHeight: 1.5, maxWidth: 600, fontStyle: "italic" }}>"{slide.kutipan}"</blockquote>
                <div style={{ marginTop: 16, fontSize: 13, color: C.gold, fontWeight: 700 }}>— {slide.nama}</div>
              </div>
              {/* Dots indicator */}
              <div style={{ position: "absolute", bottom: 16, right: 20, display: "flex", gap: 6 }}>
                {PESAN_MOTIVASI.map((_, i) => (
                  <div key={i} onClick={() => setSlideIdx(i)} style={{ width: i === slideIdx ? 20 : 8, height: 8, borderRadius: 99, background: i === slideIdx ? C.gold : "rgba(255,255,255,.4)", cursor: "pointer", transition: "all .3s" }} />
                ))}
              </div>
            </div>

            {/* Himbauan KPU */}
            <div style={{ background: C.green, borderRadius: 20, padding: "20px 28px", marginBottom: 32, display: "flex", alignItems: "center", gap: 20 }}>
              <span style={{ fontSize: 32, flexShrink: 0 }}>📣</span>
              <div>
                <div style={{ fontWeight: 900, fontSize: 16, color: "white", marginBottom: 4 }}>Himbauan Komisi Pemilihan Kampung (KPK)</div>
                <div style={{ fontSize: 14, color: "rgba(255,255,255,.8)", lineHeight: 1.6 }}>Gunakan hak pilih Anda sesuai <b>hati nurani</b> — bukan tekanan pihak manapun. Pemilihan ini bersifat <b>LANGSUNG, UMUM, BEBAS & RAHASIA</b>. Suara Anda dijamin aman oleh sistem enkripsi digital.</div>
              </div>
            </div>

            <h2 style={{ fontSize: 24, fontWeight: 900, color: C.darkGreen, marginBottom: 20 }}>Agenda Pemilihan Terbuka 📋</h2>

            {votings.length === 0 ? (
              <div style={{ textAlign: "center", padding: "60px 20px", background: C.white, borderRadius: 20, border: `1px dashed ${C.lightGreen}` }}>
                <div style={{ fontSize: 40, marginBottom: 12 }}>📭</div>
                <div style={{ color: C.lightGreen, fontWeight: 700, fontSize: 15 }}>Tidak ada agenda pemilihan yang aktif saat ini.</div>
              </div>
            ) : votings.map(v => {
              const { tipe, text } = parseJudul(v.judul);
              return (
                <div key={v.id} onClick={() => bukaBilik(v)} style={{ background: C.white, borderRadius: 20, padding: "28px 32px", marginBottom: 16, display: "flex", alignItems: "center", justifyContent: "space-between", border: `1px solid rgba(45,90,64,.12)`, boxShadow: "0 8px 20px rgba(0,0,0,.04)", cursor: "pointer", transition: "all .2s" }}>
                  <div>
                    <span style={{ background: tipe === "PEMILU" ? "rgba(45,90,64,.1)" : "rgba(184,148,63,.1)", color: tipe === "PEMILU" ? C.green : C.gold, padding: "5px 12px", borderRadius: 8, fontSize: 11, fontWeight: 900, letterSpacing: ".05em" }}>
                      {tipe === "PEMILU" ? "🗳️ KOTAK PEMILU" : "⚖️ MUSYAWARAH"}
                    </span>
                    <h3 style={{ margin: "12px 0 6px", fontSize: 20, fontWeight: 900, color: C.darkGreen }}>{text}</h3>
                    <div style={{ fontSize: 14, color: C.lightGreen, fontWeight: 600 }}>{v.deskripsi || "Silakan masuk dan berikan suara Anda."}</div>
                  </div>
                  <div style={{ width: 44, height: 44, background: C.cream, borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center", color: C.green, fontWeight: 900, fontSize: 18, flexShrink: 0, marginLeft: 20 }}>→</div>
                </div>
              );
            })}

            {/* ===== LIVE RESULTS BUTTON ===== */}
            <div style={{ background: C.darkGreen, borderRadius: 20, padding: "24px 28px", marginTop: 28, display: "flex", alignItems: "center", justifyContent: "space-between", gap: 16, flexWrap: "wrap" }}>
              <div>
                <div style={{ fontSize: 13, fontWeight: 900, color: C.gold, letterSpacing: "0.1em", marginBottom: 4 }}>📺 PAPAN PUBLIK</div>
                <div style={{ fontSize: 15, fontWeight: 700, color: "white" }}>Tampilkan Hasil Voting Live Real-time</div>
                <div style={{ fontSize: 12, color: "rgba(255,255,255,0.6)", marginTop: 4 }}>Otomatis update</div>
              </div>
              <a href="/voting/live" target="_blank" style={{ display: "inline-flex", alignItems: "center", gap: 8, padding: "14px 24px", background: C.gold, color: "#1a2e1f", borderRadius: 14, fontWeight: 900, fontSize: 14, textDecoration: "none", flexShrink: 0, boxShadow: "0 6px 20px rgba(184,148,63,0.4)", transition: "all 0.2s" }}>
                🔴 Buka Live Results →
              </a>
            </div>

            {/* ===== INFO SECTION ===== */}
            <div style={{ marginTop: 40, display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(260px,1fr))", gap: 18 }}>

              {/* Cara voting */}
              <div style={{ background: C.white, borderRadius: 20, padding: "24px 28px", border: `1px solid rgba(45,90,64,.1)` }}>
                <div style={{ fontSize: 22, marginBottom: 12 }}>📋</div>
                <div style={{ fontSize: 14, fontWeight: 900, color: C.darkGreen, marginBottom: 12 }}>Cara Menggunakan Bilik Suara Digital</div>
                {[
                  "Pilih agenda pemilihan yang aktif",
                  "Tempelkan Kartu Warga NFC ke HP petugas",
                  "Sistem verifikasi identitas & umur (18+)",
                  "Pilih kandidat/opsi yang Anda yakini",
                  "Konfirmasi pilihan pada layar berikutnya — FINAL!",
                ].map((s, i) => (
                  <div key={i} style={{ display: "flex", gap: 10, marginBottom: 8, alignItems: "flex-start" }}>
                    <div style={{ width: 22, height: 22, background: C.green, borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 11, color: "white", fontWeight: 900, flexShrink: 0, marginTop: 1 }}>{i + 1}</div>
                    <span style={{ fontSize: 13, color: "#5a4a40", lineHeight: 1.5 }}>{s}</span>
                  </div>
                ))}
              </div>

              {/* Cara dapat kartu */}
              <div style={{ background: C.white, borderRadius: 20, padding: "24px 28px", border: `1px solid rgba(45,90,64,.1)` }}>
                <div style={{ fontSize: 22, marginBottom: 12 }}>💳</div>
                <div style={{ fontSize: 14, fontWeight: 900, color: C.darkGreen, marginBottom: 12 }}>Belum Punya Kartu Warga Digital?</div>
                <div style={{ fontSize: 13, color: "#5a4a40", lineHeight: 1.7, marginBottom: 12 }}>
                  Kartu Warga NFC Ciburial diterbitkan untuk seluruh warga RW 08 yang terdaftar. Ambil di:
                </div>
                {[
                  { icon: "🏠", text: "Ketua RT masing-masing (RT 01, 02, 03)" },
                  { icon: "📍", text: "Pos Digital Warga RW 08" },
                  { icon: "📧", text: "Daftar via Email: ciburial.smarthub@gmail.com" },
                ].map((x, i) => (
                  <div key={i} style={{ display: "flex", gap: 10, alignItems: "center", marginBottom: 8, padding: "8px 12px", background: "rgba(45,90,64,0.05)", borderRadius: 10 }}>
                    <span style={{ fontSize: 16 }}>{x.icon}</span>
                    <span style={{ fontSize: 12, color: C.darkGreen, fontWeight: 600 }}>{x.text}</span>
                  </div>
                ))}
              </div>

              {/* Jaminan keamanan */}
              <div style={{ background: C.darkGreen, borderRadius: 20, padding: "24px 28px" }}>
                <div style={{ fontSize: 22, marginBottom: 12 }}>🔒</div>
                <div style={{ fontSize: 14, fontWeight: 900, color: C.gold, marginBottom: 12 }}>Pemilihan Digital Tidak Bisa Dimanipulasi</div>
                {[
                  "Suara direkam langsung ke database terenkripsi",
                  "Satu warga hanya bisa memilih SATU kali",
                  "Identitas pemilih tidak terhubung ke pilihan (anonim)",
                  "Tidak ada admin yang bisa mengubah hasil suara",
                  "Semua data tersimpan di server terverifikasi",
                ].map((s, i) => (
                  <div key={i} style={{ display: "flex", gap: 8, marginBottom: 8, alignItems: "flex-start" }}>
                    <span style={{ color: C.gold, fontWeight: 900, flexShrink: 0, marginTop: 1 }}>✓</span>
                    <span style={{ fontSize: 12, color: "rgba(255,255,255,0.75)", lineHeight: 1.5 }}>{s}</span>
                  </div>
                ))}
              </div>
            </div>
          </>
        )}

        {/* ===== BILIK: Verifikasi NFC ===== */}
        {activeVoting && !terverifikasi && (
          <div style={{ maxWidth: 560, margin: "0 auto", background: C.white, borderRadius: 28, padding: 48, boxShadow: "0 20px 50px rgba(0,0,0,.08)", textAlign: "center", animation: "zoomIn .3s ease" }}>
            <div style={{ fontSize: 52, marginBottom: 16 }}>🏛️</div>
            <h2 style={{ margin: "0 0 8px", fontSize: 24, fontWeight: 900, color: C.darkGreen }}>{parseJudul(activeVoting.judul).text}</h2>
            <p style={{ color: C.lightGreen, fontSize: 14, lineHeight: 1.7, margin: "0 0 36px" }}>
              Anda memasuki Bilik Suara Resmi. Untuk menjaga keadilan pemilihan, <b>hanya warga terdaftar (DPT) berusia 18+ tahun</b> yang dapat memberikan suara menggunakan <b>Kartu Warga NFC Ciburial</b>.
            </p>

            {!scanning ? (
              <>
                <button onClick={startNFC} style={{ width: "100%", padding: "20px", background: C.green, color: "white", border: "none", borderRadius: 18, fontSize: 17, fontWeight: 900, cursor: "pointer", boxShadow: `0 10px 25px rgba(45,90,64,.3)`, marginBottom: 20 }}>
                  <span style={{ fontSize: 22, display: "block", marginBottom: 6 }}>💳</span>
                  Tempelkan Kartu Warga (Tap NFC)
                </button>
                <button onClick={() => setActiveVoting(null)} style={{ color: C.lightGreen, background: "transparent", border: "none", fontWeight: 700, fontSize: 14, cursor: "pointer" }}>← Kembali ke Daftar Agenda</button>
              </>
            ) : (
              <div style={{ padding: "40px 20px", background: "rgba(45,90,64,.05)", borderRadius: 24, border: `2px dashed ${C.green}` }}>
                <div style={{ width: 80, height: 80, background: C.green, borderRadius: "50%", margin: "0 auto 20px", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 30, animation: "pulse 1.5s infinite", boxShadow: `0 0 30px rgba(45,90,64,.4)` }}>📡</div>
                <div style={{ fontWeight: 800, fontSize: 17, color: C.green, marginBottom: 8 }}>Menunggu Pindaian NFC...</div>
                <div style={{ fontSize: 14, color: C.lightGreen, lineHeight: 1.6 }}>Dekatkan Kartu DPT Ciburial ke punggung handphone atau tablet petugas TPS.</div>
                <button onClick={stopNFC} style={{ marginTop: 20, padding: "10px 24px", background: "transparent", color: C.red, border: `1px solid ${C.red}`, borderRadius: 99, fontSize: 13, fontWeight: 800, cursor: "pointer" }}>⏹ Batalkan</button>
              </div>
            )}

            <div style={{ marginTop: 24, fontSize: 12, color: C.lightGreen, background: C.cream, borderRadius: 12, padding: "12px 16px", fontWeight: 600, lineHeight: 1.6 }}>
              🔒 Identitas Anda digunakan <b>hanya</b> untuk pengecekan Hak Pilih (anti coblos ganda). Suara Anda terekam secara anonim dan tidak dapat dilacak.
            </div>
          </div>
        )}

        {/* ===== BILIK: Layar Pencoblosan ===== */}
        {activeVoting && terverifikasi && (
          <div style={{ animation: "slideUp .4s ease" }}>
            <div style={{ textAlign: "center", marginBottom: 28 }}>
              <h2 style={{ margin: "0 0 12px", fontSize: 34, fontWeight: 900, color: C.darkGreen }}>{parseJudul(activeVoting.judul).text}</h2>
              <p style={{ color: C.lightGreen, fontSize: 16, maxWidth: 650, margin: "0 auto" }}>{activeVoting.deskripsi}</p>
              <div style={{ display: "inline-block", marginTop: 16, background: "rgba(45,90,64,.1)", color: C.green, border: `1px solid rgba(45,90,64,.25)`, borderRadius: 99, padding: "8px 20px", fontSize: 12, fontWeight: 900, letterSpacing: ".08em" }}>
                {tipeAktif?.tipe === "PEMILU" ? "🧑‍💼 SURAT SUARA PEMILU BERGAMBAR" : "⚖️ SURAT MUSYAWARAH RW — PILIH SATU OPSI"}
              </div>
            </div>

            {/* Instruksi Singkat */}
            <div style={{ background: "rgba(184,148,63,.08)", border: `1px solid rgba(184,148,63,.3)`, borderRadius: 14, padding: "16px 22px", marginBottom: 28, color: C.darkGreen }}>
              <span style={{ fontWeight: 800, fontSize: 14 }}>📌 Petunjuk: </span>
              <span style={{ fontSize: 14, lineHeight: 1.6 }}>Perhatikan setiap pilihan/kandidat. Tekan tombol <b>COBLOS</b> lalu konfirmasi pada tahap terakhir. Pilihan Anda bersifat <b>final & tidak dapat diubah</b>.</span>
            </div>

            {aktivPilihan.length === 0 ? (
              <div style={{ textAlign: "center", padding: "32px", background: C.white, borderRadius: 20, border: `2px solid ${fetchError ? C.red : "#e0dccc"}` }}>
                {fetchError ? (
                  <>
                    <div style={{ fontSize: 30, marginBottom: 12 }}>🚨</div>
                    <div style={{ fontWeight: 900, fontSize: 16, color: C.red, marginBottom: 12 }}>Gagal Memuat Data Pilihan!</div>
                    <div style={{ fontSize: 13, color: "#666", marginBottom: 20, padding: "12px", background: "#fff0f0", borderRadius: 10, fontFamily: "monospace", wordBreak: "break-word" }}>{fetchError}</div>
                    <div style={{ textAlign: "left", background: C.darkGreen, borderRadius: 12, padding: "16px", color: "#c8ffd4", fontSize: 12, fontFamily: "monospace", lineHeight: 1.8 }}>
                      <div style={{ color: C.gold, fontWeight: 900, marginBottom: 8, fontFamily: "Inter" }}>🔧 SOLUSI: Jalankan SQL ini di Supabase → SQL Editor:</div>
                      <div>ALTER TABLE voting ENABLE ROW LEVEL SECURITY;</div>
                      <div>ALTER TABLE pilihan_voting ENABLE ROW LEVEL SECURITY;</div>
                      <div>ALTER TABLE vote_record ENABLE ROW LEVEL SECURITY;</div>
                      <div>CREATE POLICY "pub_r_v" ON voting FOR SELECT USING (true);</div>
                      <div>CREATE POLICY "pub_r_pv" ON pilihan_voting FOR SELECT USING (true);</div>
                      <div>CREATE POLICY "pub_r_vr" ON vote_record FOR SELECT USING (true);</div>
                      <div>CREATE POLICY "pub_w_v" ON voting FOR ALL USING (true) WITH CHECK (true);</div>
                      <div>CREATE POLICY "pub_w_pv" ON pilihan_voting FOR ALL USING (true) WITH CHECK (true);</div>
                      <div>CREATE POLICY "pub_w_vr" ON vote_record FOR ALL USING (true) WITH CHECK (true);</div>
                    </div>
                    <button onClick={() => bukaBilik(activeVoting!)} style={{ marginTop: 16, padding: "12px 24px", background: C.green, color: "white", border: "none", borderRadius: 12, fontWeight: 800, fontSize: 14, cursor: "pointer" }}>🔄 Coba Muat Ulang</button>
                  </>
                ) : (
                  <div style={{ color: C.lightGreen, fontWeight: 700 }}>⏳ Memuat daftar pilihan...</div>
                )}
              </div>
            ) : tipeAktif?.tipe === "PEMILU" ? (
              /* LAYOUT PEMILU - Kartu Grid Foto */
              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(260px, 1fr))", gap: 24 }}>
                {aktivPilihan.map(p => {
                  const { nama, foto } = parseKandidat(p.teks);
                  const isSpecial = nama.toLowerCase().includes("golput") || nama.toLowerCase().includes("kosong") || nama.toLowerCase().includes("netral") || nama.toLowerCase().includes("abstain");
                  return (
                    <div key={p.id} style={{ background: C.white, borderRadius: 24, overflow: "hidden", boxShadow: "0 12px 30px rgba(0,0,0,.08)", border: `2px solid ${isSpecial ? "#e0dccc" : C.green}` }}>
                      <div style={{ height: 260, background: C.cream, display: "flex", alignItems: "center", justifyContent: "center", position: "relative" }}>
                        {foto ? (
                          <img src={foto} alt={nama} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                        ) : (
                          <div style={{ fontSize: isSpecial ? 70 : 100, opacity: 0.25 }}>{isSpecial ? "🫙" : "👤"}</div>
                        )}
                        <div style={{ position: "absolute", inset: 0, background: "linear-gradient(to top, rgba(255,255,255,.95) 0%, transparent 60%)" }} />
                      </div>
                      <div style={{ padding: "16px 28px 24px", textAlign: "center", marginTop: -30, position: "relative" }}>
                        <div style={{ fontSize: 20, fontWeight: 900, color: C.darkGreen, marginBottom: 14 }}>{nama}</div>
                        <button onClick={() => setKonfirmasi(p)} style={{ width: "100%", padding: "14px", background: isSpecial ? C.cream : C.green, color: isSpecial ? C.lightGreen : "white", border: isSpecial ? `2px dashed ${C.lightGreen}` : "none", borderRadius: 14, fontSize: 15, fontWeight: 900, cursor: "pointer", boxShadow: isSpecial ? "none" : "0 6px 16px rgba(45,90,64,.25)" }}>
                          {isSpecial ? "Pilih Opsi Ini" : "✅ COBLOS KANDIDAT"}
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              /* LAYOUT MUSYAWARAH - Kartu Horizontal */
              <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
                {aktivPilihan.map(p => {
                  const { nama } = parseKandidat(p.teks);
                  const isSetuju = nama.toLowerCase().includes("setuju") && !nama.toLowerCase().includes("tidak");
                  const isTolak = nama.toLowerCase().includes("tidak") || nama.toLowerCase().includes("tolak");
                  const isNetral = nama.toLowerCase().includes("netral") || nama.toLowerCase().includes("abstain");
                  const isGolput = nama.toLowerCase().includes("golput") || nama.toLowerCase().includes("kosong");
                  const emoji = isSetuju ? "✅" : isTolak ? "❌" : isNetral ? "⚖️" : isGolput ? "🫙" : "📌";
                  return (
                    <div key={p.id} onClick={() => setKonfirmasi(p)} style={{ background: C.white, borderRadius: 20, padding: "28px 36px", display: "flex", alignItems: "center", justifyContent: "space-between", border: `2px solid ${isSetuju ? C.green : isTolak ? C.red : "#e0dccc"}`, boxShadow: "0 8px 20px rgba(0,0,0,.05)", cursor: "pointer", transition: "all .2s" }}>
                      <div style={{ display: "flex", alignItems: "center", gap: 20 }}>
                        <div style={{ width: 56, height: 56, borderRadius: "50%", background: C.cream, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 24 }}>{emoji}</div>
                        <div style={{ fontSize: 22, fontWeight: 900, color: C.darkGreen }}>{nama}</div>
                      </div>
                      <button style={{ padding: "14px 28px", background: isSetuju ? C.green : isTolak ? C.red : C.darkGreen, color: "white", border: "none", borderRadius: 14, fontSize: 15, fontWeight: 900, cursor: "pointer", boxShadow: "0 6px 16px rgba(0,0,0,.15)" }}>
                        Dukung Opsi Ini
                      </button>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}
      </main>

      <style>{`
        @keyframes pulse { 0%,100%{opacity:1;transform:scale(1)} 50%{opacity:.5;transform:scale(1.12)} }
        @keyframes zoomIn { from{opacity:0;transform:scale(.9)} to{opacity:1;transform:scale(1)} }
        @keyframes slideDown { from{opacity:0;transform:translate(-50%,-20px)} to{opacity:1;transform:translate(-50%,0)} }
        @keyframes slideUp { from{opacity:0;transform:translateY(30px)} to{opacity:1;transform:translateY(0)} }
      `}</style>
    </div>
  );
}