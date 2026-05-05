"use client";
import { useState, useEffect, useRef } from "react";
import { supabase, isSupabaseReady } from "@/lib/supabase";

const POIN_POSYANDU = 15;

// ─── HELPER FUNCTIONS ────────────────────────────────────────────────────────
function hitungUmurBulan(tgl: string): number {
  return Math.floor((new Date().getTime() - new Date(tgl).getTime()) / (1000 * 60 * 60 * 24 * 30));
}
function hitungUmurLabel(tgl: string): string {
  const b = hitungUmurBulan(tgl);
  return b < 24 ? `${b} bulan` : `${Math.floor(b / 12)} thn ${b % 12} bln`;
}
function statusGiziWHO(bb: number, tgl_lahir: string): { status: string; color: string; label: string } {
  const b = hitungUmurBulan(tgl_lahir);
  const ideal = b <= 12 ? b * 0.65 + 3 : 6 + (b - 12) * 0.22;
  const r = bb / ideal;
  if (r >= 1.1) return { status: "lebih", color: "#F59E0B", label: "Gizi Lebih ⚠️" };
  if (r >= 0.9) return { status: "normal", color: "#10B981", label: "Gizi Baik ✅" };
  if (r >= 0.75) return { status: "kurang", color: "#F97316", label: "Gizi Kurang ⚠️" };
  return { status: "buruk", color: "#EF4444", label: "Gizi Buruk 🚨" };
}

// ─── RADAR ANIMATION ─────────────────────────────────────────────────────────
function RadarPing({ active }: { active: boolean }) {
  return (
    <div style={{ position: "relative", width: 160, height: 160, margin: "0 auto" }}>
      {[1, 2, 3].map(i => (
        <div key={i} style={{
          position: "absolute", inset: 0, borderRadius: "50%",
          border: `1px solid rgba(244,63,94,${active ? 0.3 : 0.1})`,
          transform: `scale(${i * 0.33})`, transformOrigin: "center",
          animation: active ? `ping ${1 + i * 0.5}s infinite` : "none"
        }} />
      ))}
      {active && (
        <div style={{
          position: "absolute", inset: 0, borderRadius: "50%",
          background: "conic-gradient(from 0deg, transparent 270deg, rgba(244,63,94,0.15) 360deg)",
          animation: "sweep 2s linear infinite",
        }} />
      )}
      <div style={{
        position: "absolute", top: "50%", left: "50%",
        transform: "translate(-50%,-50%)",
        width: active ? 32 : 24, height: active ? 32 : 24,
        borderRadius: "50%",
        background: active ? "#F43F5E" : "#E5E7EB",
        boxShadow: active ? "0 0 30px #F43F5E, 0 0 60px rgba(244,63,94,0.3)" : "none",
        transition: "all 0.4s cubic-bezier(0.175, 0.885, 0.32, 1.275)",
      }} />
    </div>
  );
}

// ─── CARA KERJA ──────────────────────────────────────────────────────────────
function CaraKerja() {
  const steps = [
    { i: "01", t: "TEMPEL e-KTP", d: "Tempelkan e-KTP Bunda di belakang HP atau sensor NFC." },
    { i: "02", t: "CEK DATA", d: "Sistem akan membuka data Bunda & Si Kecil secara pribadi." },
    { i: "03", t: "TIMBANG", d: "Input berat & tinggi badan Si Kecil untuk pantau gizi." },
    { i: "04", t: "DAPAT POIN", d: "Kunjungan rutin Bunda akan mendapatkan Poin Posyandu." },
  ];
  return (
    <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(180px,1fr))", gap: 16, marginTop: 40, width: "100%" }}>
      {steps.map(s => (
        <div key={s.i} style={{ background: "white", padding: 20, borderRadius: 24, border: "1px solid #FFF1F2", boxShadow: "0 4px 12px rgba(244,63,94,0.05)" }}>
          <div style={{ fontSize: 10, fontWeight: 900, color: "#F43F5E", marginBottom: 8, opacity: 0.5 }}>LANGKAH {s.i}</div>
          <div style={{ fontSize: 14, fontWeight: 900, color: "#111827", marginBottom: 6 }}>{s.t}</div>
          <div style={{ fontSize: 12, color: "#6B7280", fontWeight: 600, lineHeight: 1.5 }}>{s.d}</div>
        </div>
      ))}
    </div>
  );
}

export default function PosyanduKioskPage() {
  const [anakList, setAnakList] = useState<any[]>([]);
  const [ibuList, setIbuList] = useState<any[]>([]);
  const [authenticatedIbu, setAuthenticatedIbu] = useState<any | null>(null);
  const [step, setStep] = useState<"scan" | "select" | "input" | "success">("scan");
  const [selectedAnak, setSelectedAnak] = useState<any>(null);
  const [formTK, setFormTK] = useState({ bb_kg: "", tb_cm: "", lila_cm: "", lk_cm: "" });
  const [loading, setLoading] = useState(false);
  const [toast, setToast] = useState({ msg: "", ok: true });
  const [resultGizi, setResultGizi] = useState<any>(null);
  const [scanning, setScanning] = useState(false);
  const nfcRef = useRef<any>(null);
  const ibuListRef = useRef(ibuList);
  useEffect(() => { ibuListRef.current = ibuList; }, [ibuList]);

  function showToast(msg: string, ok = true) {
    setToast({ msg, ok });
    setTimeout(() => setToast({ msg: "", ok: true }), 4000);
  }

  async function fetchAll() {
    if (!isSupabaseReady()) return;
    const [a, ibu] = await Promise.all([
      supabase.from("anak_posyandu").select("*").order("nama"),
      supabase.from("anggota_kk").select("id,kk_id,nama,nfc_id,saldo_poin,no_wa").eq("hubungan", "istri"),
    ]);
    if (a.data) setAnakList(a.data);
    if (ibu.data) setIbuList(ibu.data);
  }

  useEffect(() => { fetchAll(); }, []);

  async function nfcAbsensi(nfcId: string) {
    const id = nfcId.replace(/:/g, "").toUpperCase();
    const currentIbuList = ibuListRef.current;
    const ibu = currentIbuList.find(a => a.nfc_id === id);
    if (!ibu) return showToast(`❌ Bunda belum terdaftar! (${id})`, false);

    const anak = anakList.filter(a => a.kk_id === ibu.kk_id);
    const hariIni = new Date().toISOString().split("T")[0];
    const { data: cek } = await supabase.from("riwayat_poin").select("id").eq("anggota_id", ibu.id).eq("sumber", "posyandu_kunjungan").gte("created_at", `${hariIni}T00:00:00`).lte("created_at", `${hariIni}T23:59:59`).limit(1);

    if (!cek || cek.length === 0) {
      await supabase.from("riwayat_poin").insert({ anggota_id: ibu.id, kk_id: ibu.kk_id, jumlah: 5, jenis: "masuk", sumber: "posyandu_kunjungan", keterangan: `Kunjungan Kiosk Posyandu — ${hariIni}` });
    }

    setAuthenticatedIbu(ibu);
    setStep("select");
    showToast(`💖 Selamat datang ibu ${ibu.nama}! ✨`);
    fetchAll();
  }

  async function startNFC() {
    if (!("NDEFReader" in window)) return showToast("⚠️ Pakai Chrome Android + aktifkan NFC Bunda!", false);
    try {
      const ndef = new (window as any).NDEFReader();
      nfcRef.current = ndef; await ndef.scan(); setScanning(true);
      showToast("📡 KIOSK AKTIF! Silakan tempelkan e-KTP Bunda...");
      ndef.addEventListener("reading", ({ serialNumber }: any) => nfcAbsensi(serialNumber));
    } catch { showToast("❌ Gagal aktifkan NFC", false); }
  }

  function stopNFC() {
    try { nfcRef.current?.stop?.(); } catch { }
    setScanning(false);
    setAuthenticatedIbu(null);
    setStep("scan");
    showToast("Sesi berakhir, data dikunci.");
  }

  async function simpanTK() {
    if (!selectedAnak || !formTK.bb_kg) return showToast("❌ Isi berat badan!", false);
    setLoading(true);
    const gz = statusGiziWHO(Number(formTK.bb_kg), selectedAnak.tgl_lahir);
    const { error } = await supabase.from("tumbuh_kembang").insert({
      anak_id: selectedAnak.id,
      tanggal: new Date().toISOString().split("T")[0],
      bb_kg: Number(formTK.bb_kg),
      tb_cm: formTK.tb_cm ? Number(formTK.tb_cm) : null,
      lila_cm: formTK.lila_cm ? Number(formTK.lila_cm) : null,
      lk_cm: formTK.lk_cm ? Number(formTK.lk_cm) : null,
      status_gizi: gz.status,
    });
    if (error) { showToast(`❌ ${error.message}`, false); setLoading(false); return; }

    // Reward poin timbangan
    if (authenticatedIbu) {
      const hariIni = new Date().toISOString().split("T")[0];
      const { data: cek } = await supabase.from("riwayat_poin").select("id").eq("anggota_id", authenticatedIbu.id).eq("sumber", "posyandu_timbangan").gte("created_at", `${hariIni}T00:00:00`).lte("created_at", `${hariIni}T23:59:59`).limit(1);
      if (!cek || cek.length === 0) {
        await supabase.from("anggota_kk").update({ saldo_poin: (authenticatedIbu.saldo_poin || 0) + POIN_POSYANDU }).eq("id", authenticatedIbu.id);
        await supabase.from("riwayat_poin").insert({ anggota_id: authenticatedIbu.id, kk_id: authenticatedIbu.kk_id, jumlah: POIN_POSYANDU, jenis: "masuk", sumber: "posyandu_timbangan", keterangan: `Timbangan Si Kecil — ${selectedAnak.nama}` });
      }
    }

    setResultGizi(gz);
    setStep("success");
    setLoading(false);
  }

  function resetAll() {
    setAuthenticatedIbu(null);
    setStep("scan");
    setSelectedAnak(null);
    setFormTK({ bb_kg: "", tb_cm: "", lila_cm: "", lk_cm: "" });
    setResultGizi(null);
  }

  const myAnakList = authenticatedIbu ? anakList.filter(a => a.kk_id === authenticatedIbu.kk_id) : [];
  const IS = { width: "100%", padding: "16px 20px", borderRadius: 16, border: "2px solid #E5E7EB", fontSize: 16, background: "#F9FAFB", outline: "none", boxSizing: "border-box" as const, fontFamily: "inherit", color: "#374151", fontWeight: 700 };

  return (
    <div style={{ minHeight: "100vh", background: "linear-gradient(180deg,#FFF1F2 0%,#FFE4E6 100%)", fontFamily: "'Inter', system-ui, sans-serif", position: "relative", overflow: "hidden" }}>

      <style>{`
        @keyframes slide-up { from{transform:translateY(16px);opacity:0} to{transform:translateY(0);opacity:1} }
        @keyframes pop { 0%{transform:scale(0.8);opacity:0} 100%{transform:scale(1);opacity:1} }
        @keyframes ping { 0%{transform:scale(1);opacity:0.8} 100%{transform:scale(1.6);opacity:0} }
        @keyframes sweep { from{transform:rotate(0deg)} to{transform:rotate(360deg)} }
        @keyframes float { 0%,100%{transform:translateY(0)} 50%{transform:translateY(-8px)} }
        .posyandu-btn { transition:all 0.3s cubic-bezier(.175,.885,.32,1.275); cursor:pointer; }
        .posyandu-btn:hover { transform:translateY(-2px); filter:brightness(1.05); }
        .posyandu-btn:active { transform:translateY(0); }
      `}</style>

      {toast.msg && (
        <div style={{ position: "fixed", top: 24, left: "50%", transform: "translateX(-50%)", background: toast.ok ? "#F43F5E" : "#111827", color: "#FFF", padding: "14px 28px", borderRadius: 99, zIndex: 999, fontSize: 14, fontWeight: 800, boxShadow: "0 10px 30px rgba(244,63,94,0.3)", animation: "slide-up 0.4s ease", maxWidth: "90vw", textAlign: "center" }}>
          {toast.msg}
        </div>
      )}

      <div style={{ maxWidth: 600, margin: "0 auto", padding: "0 clamp(16px, 4vw, 20px)", minHeight: "100vh", display: "flex", flexDirection: "column" }}>

        <header style={{ textAlign: "center", paddingTop: 48, marginBottom: 32 }}>
          <div style={{ fontSize: 10, fontWeight: 800, letterSpacing: ".25em", color: "#F43F5E", marginBottom: 8, textTransform: "uppercase" }}>
            CLINIC & MATERNITY CIBURIAL
          </div>
          <h1 style={{ margin: "0 0 10px", fontSize: "clamp(32px,8vw,48px)", fontWeight: 900, color: "#111827", lineHeight: 1, letterSpacing: "-.03em" }}>
            Posyandu Ceria <span style={{ fontSize: "0.8em" }}>👶</span>
          </h1>
          <p style={{ margin: 0, fontSize: 15, color: "#6B7280", fontWeight: 600, lineHeight: 1.6 }}>
            {authenticatedIbu ? `Halo Bunda ${authenticatedIbu.nama}! 👋` : "Pantau tumbuh kembang si kecil secara digital"}
          </p>
        </header>

        {/* ─── SCAN STEP (LOCKED) ─── */}
        {step === "scan" && (
          <div style={{ animation: "slide-up 0.5s ease" }}>
            <div style={{ background: "white", borderRadius: 32, padding: "clamp(24px, 5vw, 48px) clamp(16px, 4vw, 32px)", boxShadow: "0 20px 50px rgba(244,63,94,0.15)", textAlign: "center", border: "1px solid #FFF1F2" }}>
              <h3 style={{ margin: "0 0 12px", fontSize: 24, fontWeight: 900, color: "#111827" }}>Selamat Datang Bunda!</h3>
              <p style={{ margin: "0 0 40px", fontSize: 15, color: "#6B7280", fontWeight: 600, lineHeight: 1.6 }}>
                Tempelkan **e-KTP Bunda** untuk membuka data KIA & mencatat timbangan hari ini.
              </p>

              {/* NFC Circle — seragam Learning Hub & Ronda */}
              <div style={{ position: "relative", width: 140, height: 140, margin: "0 auto 20px" }}>
                {scanning && <>
                  <div style={{ position: "absolute", inset: 0, borderRadius: "50%", border: "2px solid rgba(244,63,94,0.5)", animation: "nfc-pulse 2.2s ease-out infinite" }} />
                  <div style={{ position: "absolute", inset: 0, borderRadius: "50%", border: "1px solid rgba(244,63,94,0.25)", animation: "nfc-pulse 2.2s ease-out infinite 0.5s" }} />
                  <div style={{ position: "absolute", inset: 0, borderRadius: "50%", border: "1px solid rgba(244,63,94,0.12)", animation: "nfc-pulse 2.2s ease-out infinite 1s" }} />
                </>}
                <div style={{
                  position: "absolute", inset: 0, borderRadius: "50%",
                  background: scanning ? "rgba(244,63,94,0.08)" : "white",
                  border: `2px solid ${scanning ? "rgba(244,63,94,0.6)" : "rgba(244,63,94,0.2)"}`,
                  display: "flex", alignItems: "center", justifyContent: "center",
                  transition: "all 0.5s",
                  boxShadow: scanning ? "0 0 32px rgba(244,63,94,0.2)" : "none",
                }}>
                  <svg width="52" height="52" viewBox="0 0 24 24" fill="none" stroke={scanning ? "#F43F5E" : "rgba(244,63,94,0.4)"} strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round" style={{ transition: "stroke 0.5s" }}>
                    <path d="M2 7V5a2 2 0 0 1 2-2h2"/><path d="M2 17v2a2 2 0 0 0 2 2h2"/>
                    <path d="M22 7V5a2 2 0 0 0-2-2h-2"/><path d="M22 17v2a2 2 0 0 1-2 2h-2"/>
                    <rect x="7" y="7" width="10" height="10" rx="1.5"/>
                  </svg>
                </div>
              </div>
              <div style={{ fontSize: 13, fontWeight: 600, color: scanning ? "#F43F5E" : "#9CA3AF", marginBottom: 20, transition: "color 0.4s", textAlign: "center" }}>
                {scanning ? "Tempelkan e-KTP ke belakang HP..." : "NFC Scanner Belum Aktif"}
              </div>
              <button onClick={scanning ? stopNFC : startNFC} className="posyandu-btn"
                style={{ width: "100%", borderRadius: 14, padding: "16px 24px", border: scanning ? "1px solid rgba(244,63,94,0.3)" : "none",
                  background: scanning ? "rgba(244,63,94,0.05)" : "linear-gradient(135deg,#F43F5E,#E11D48)",
                  color: scanning ? "#F43F5E" : "white", fontSize: 15, fontWeight: 800,
                  boxShadow: scanning ? "none" : "0 10px 25px rgba(225,29,72,0.3)" }}>
                {scanning ? "⏹ Stop Scanning" : "⬡ Aktifkan NFC e-KTP"}
              </button>
              {!scanning && <div style={{ marginTop: 10, fontSize: 10, color: "#9CA3AF", textAlign: "center" }}>Chrome Android · NFC harus aktif</div>}
              <style>{`
                @keyframes nfc-pulse {
                  0%  { transform: scale(0.85); opacity: 0.75; }
                  100% { transform: scale(2.2); opacity: 0; }
                }
              `}</style>
            </div>

            <CaraKerja />
          </div>
        )}

        {/* ─── SELECT ANAK STEP ─── */}
        {step === "select" && authenticatedIbu && (
          <div style={{ flex: 1, animation: "slide-up 0.4s ease" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20 }}>
              <h3 style={{ margin: 0, fontSize: 20, fontWeight: 900, color: "#111827" }}>Pilih Buah Hati 🍼</h3>
              <button onClick={resetAll} style={{ background: "#FFE4E6", border: "none", color: "#F43F5E", fontSize: 11, fontWeight: 900, padding: "8px 16px", borderRadius: 99, cursor: "pointer" }}>LOGOUT</button>
            </div>
            
            {myAnakList.length === 0 ? (
              <div style={{ background: "white", borderRadius: 24, padding: "clamp(24px, 5vw, 40px)", textAlign: "center", color: "#9CA3AF", border: "2px dashed #FECACA" }}>
                <div style={{ fontSize: 48, marginBottom: 12 }}>💤</div>
                Bunda belum mendaftarkan data balita.<br/>Silakan hubungi Kader Posyandu.
              </div>
            ) : (
              <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                {myAnakList.map(a => (
                  <button key={a.id} onClick={() => { setSelectedAnak(a); setStep("input"); }} className="posyandu-btn"
                    style={{ background: "white", borderRadius: 24, padding: "clamp(16px, 4vw, 24px)", border: "1.5px solid #E5E7EB", display: "flex", alignItems: "center", gap: 16, width: "100%", textAlign: "left", boxShadow: "0 4px 12px rgba(0,0,0,0.04)" }}>
                    <div style={{ width: 56, height: 56, borderRadius: 18, background: a.jenis_kelamin === "L" ? "#EFF6FF" : "#FDF2F8", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 28 }}>
                      {a.jenis_kelamin === "L" ? "👦" : "👧"}
                    </div>
                    <div style={{ flex: 1 }}>
                      <div style={{ fontWeight: 900, fontSize: 18, color: "#111827" }}>{a.nama}</div>
                      <div style={{ fontSize: 13, color: "#9CA3AF", fontWeight: 700 }}>{hitungUmurLabel(a.tgl_lahir)} • Jagoan Bunda</div>
                    </div>
                    <div style={{ fontSize: 24, color: "#F43F5E" }}>→</div>
                  </button>
                ))}
              </div>
            )}
          </div>
        )}

        {/* ─── INPUT STEP ─── */}
        {step === "input" && selectedAnak && (
          <div style={{ flex: 1, animation: "slide-up 0.4s ease" }}>
            <button onClick={() => setStep("select")} style={{ background: "none", border: "none", color: "#F43F5E", fontSize: 14, fontWeight: 800, cursor: "pointer", marginBottom: 20, display: "flex", alignItems: "center", gap: 6 }}>← Pilih Anak Lain</button>

            <div style={{ background: "white", borderRadius: 28, padding: "clamp(20px, 4vw, 32px)", boxShadow: "0 15px 35px rgba(244,63,94,0.1)", border: "1px solid #FFF1F2" }}>
              <div style={{ display: "flex", alignItems: "center", gap: 16, marginBottom: 32 }}>
                <div style={{ width: 52, height: 52, borderRadius: 16, background: selectedAnak.jenis_kelamin === "L" ? "#EFF6FF" : "#FDF2F8", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 24 }}>
                  {selectedAnak.jenis_kelamin === "L" ? "👦" : "👧"}
                </div>
                <div>
                  <div style={{ fontWeight: 900, fontSize: 20, color: "#111827" }}>{selectedAnak.nama}</div>
                  <div style={{ fontSize: 12, color: "#9CA3AF", fontWeight: 700, letterSpacing: "0.05em" }}>TINGKAT: {hitungUmurLabel(selectedAnak.tgl_lahir).toUpperCase()}</div>
                </div>
              </div>

              {formTK.bb_kg && (() => {
                const gz = statusGiziWHO(Number(formTK.bb_kg), selectedAnak.tgl_lahir);
                return (
                  <div style={{ padding: 16, background: gz.color + "1A", border: `2px solid ${gz.color}40`, borderRadius: 20, marginBottom: 24, fontSize: 15, color: gz.color, fontWeight: 800, textAlign: "center", animation: "pop 0.3s ease" }}>
                    Status Gizi: <b>{gz.label}</b>
                  </div>
                );
              })()}

              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16, marginBottom: 24 }}>
                <div>
                  <label style={{ fontSize: 11, fontWeight: 800, color: "#9CA3AF", letterSpacing: ".1em", display: "block", marginBottom: 8 }}>BERAT (KG) *</label>
                  <input type="number" value={formTK.bb_kg} onChange={e => setFormTK({ ...formTK, bb_kg: e.target.value })} placeholder="0.0" style={IS} />
                </div>
                <div>
                  <label style={{ fontSize: 11, fontWeight: 800, color: "#9CA3AF", letterSpacing: ".1em", display: "block", marginBottom: 8 }}>TINGGI (CM)</label>
                  <input type="number" value={formTK.tb_cm} onChange={e => setFormTK({ ...formTK, tb_cm: e.target.value })} placeholder="0" style={IS} />
                </div>
              </div>

              <button onClick={simpanTK} disabled={loading} className="posyandu-btn"
                style={{ width: "100%", background: loading ? "#D1D5DB" : "linear-gradient(135deg,#10B981,#059669)", color: "white", border: "none", borderRadius: 20, padding: "clamp(16px, 4vw, 20px)", fontSize: 17, fontWeight: 900, boxShadow: loading ? "none" : "0 10px 25px rgba(16,185,129,0.3)" }}>
                {loading ? "MENYIMPAN..." : "💾 KUNCI DATA TIMBANGAN"}
              </button>
            </div>
          </div>
        )}

        {/* ─── SUCCESS STEP ─── */}
        {step === "success" && resultGizi && (
          <div style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", textAlign: "center", animation: "pop 0.5s ease" }}>
            <div style={{ fontSize: 80, marginBottom: 24, animation: "float 2s ease-in-out infinite" }}>
              {resultGizi.status === "normal" ? "🎉" : "💖"}
            </div>
            <h2 style={{ margin: "0 0 12px", fontSize: 32, fontWeight: 900, color: "#111827" }}>Berhasil!</h2>
            <div style={{ fontSize: 20, fontWeight: 800, color: resultGizi.color, marginBottom: 12 }}>{resultGizi.label}</div>
            <p style={{ fontSize: 16, color: "#6B7280", fontWeight: 600, marginBottom: 32 }}>
              Data {selectedAnak?.nama} sudah tercatat.<br/>Bunda mendapat +{POIN_POSYANDU} Poin Sehat!
            </p>
            <button onClick={resetAll} className="posyandu-btn"
              style={{ background: "linear-gradient(135deg,#F43F5E,#E11D48)", color: "white", border: "none", borderRadius: 20, padding: "clamp(16px, 4vw, 20px) clamp(30px, 6vw, 60px)", fontSize: 18, fontWeight: 900, boxShadow: "0 12px 25px rgba(225,29,72,0.3)" }}>
              SELESAI ✓
            </button>
          </div>
        )}

        <footer style={{ textAlign: "center", padding: "40px 0", opacity: 0.3 }}>
          <div style={{ fontSize: 10, fontWeight: 800, letterSpacing: ".2em", color: "#111827" }}>
            KIOSK MANDIRI POSYANDU CERIA
          </div>
        </footer>

      </div>
    </div>
  );
}
