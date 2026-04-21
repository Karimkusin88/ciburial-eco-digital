"use client";
import { useState, useEffect, useRef } from "react";
import { supabase, isSupabaseReady } from "@/lib/supabase";

const POIN_POSYANDU = 15;

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

export default function PosyanduKioskPage() {
  const [anakList, setAnakList] = useState<any[]>([]);
  const [kkList, setKkList] = useState<any[]>([]);
  const [ibuList, setIbuList] = useState<any[]>([]);
  const [step, setStep] = useState<"home" | "select" | "input" | "success">("home");
  const [selectedAnak, setSelectedAnak] = useState<any>(null);
  const [formTK, setFormTK] = useState({ bb_kg: "", tb_cm: "", lila_cm: "", lk_cm: "" });
  const [loading, setLoading] = useState(false);
  const [toast, setToast] = useState({ msg: "", ok: true });
  const [resultGizi, setResultGizi] = useState<any>(null);
  const [scanning, setScanning] = useState(false);
  const [lastScan, setLastScan] = useState<any>(null);
  const nfcRef = useRef<any>(null);
  const ibuListRef = useRef(ibuList);
  useEffect(() => { ibuListRef.current = ibuList; }, [ibuList]);

  function showToast(msg: string, ok = true) {
    setToast({ msg, ok });
    setTimeout(() => setToast({ msg: "", ok: true }), 4000);
  }

  async function fetchAll() {
    if (!isSupabaseReady()) return;
    const [a, kk, ibu] = await Promise.all([
      supabase.from("anak_posyandu").select("*").order("nama"),
      supabase.from("keluarga").select("id,kepala_keluarga,rt").order("kepala_keluarga"),
      supabase.from("anggota_kk").select("id,kk_id,nama,nfc_id,saldo_poin,no_wa").eq("hubungan", "istri"),
    ]);
    if (a.data) setAnakList(a.data);
    if (kk.data) setKkList(kk.data);
    if (ibu.data) setIbuList(ibu.data);
  }

  useEffect(() => { fetchAll(); }, []);

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

    // Award poin to mother
    const ibu = ibuList.find(a => a.kk_id === selectedAnak.kk_id);
    if (ibu) {
      const hariIni = new Date().toISOString().split("T")[0];
      const { data: cek } = await supabase.from("riwayat_poin").select("id").eq("anggota_id", ibu.id).eq("sumber", "posyandu").gte("created_at", `${hariIni}T00:00:00`).lte("created_at", `${hariIni}T23:59:59`).limit(1);
      if (!cek || cek.length === 0) {
        await supabase.from("anggota_kk").update({ saldo_poin: (ibu.saldo_poin || 0) + POIN_POSYANDU }).eq("id", ibu.id);
        await supabase.from("riwayat_poin").insert({ anggota_id: ibu.id, kk_id: selectedAnak.kk_id, jumlah: POIN_POSYANDU, jenis: "masuk", sumber: "posyandu", keterangan: `Posyandu Ceria — ${selectedAnak.nama} — ${hariIni}` });
      }
    }

    setResultGizi(gz);
    setStep("success");
    setLoading(false);
  }

  async function nfcAbsensi(nfcId: string) {
    const id = nfcId.replace(/:/g, "").toUpperCase();
    const currentIbuList = ibuListRef.current;
    const ibu = currentIbuList.find(a => a.nfc_id === id);
    if (!ibu) return showToast(`❌ Kartu tidak terdaftar! (${id})`, false);

    const anak = anakList.filter(a => a.kk_id === ibu.kk_id);
    if (anak.length === 0) return showToast(`⚠️ Ibu ${ibu.nama} belum mendaftarkan anak`, false);

    const hariIni = new Date().toISOString().split("T")[0];
    const { data: cek } = await supabase.from("riwayat_poin").select("id").eq("anggota_id", ibu.id).eq("sumber", "posyandu").gte("created_at", `${hariIni}T00:00:00`).lte("created_at", `${hariIni}T23:59:59`).limit(1);
    if (cek && cek.length > 0) return showToast(`⚠️ Ibu ${ibu.nama} sudah absen hari ini!`, false);

    await supabase.from("anggota_kk").update({ saldo_poin: (ibu.saldo_poin || 0) + POIN_POSYANDU }).eq("id", ibu.id);
    await supabase.from("riwayat_poin").insert({ anggota_id: ibu.id, kk_id: ibu.kk_id, jumlah: POIN_POSYANDU, jenis: "masuk", sumber: "posyandu", keterangan: `Tap NFC Posyandu Ceria — ${hariIni}` });
    setLastScan({ nama: ibu.nama, namaAnak: anak.map(a => a.nama).join(", "), poin: POIN_POSYANDU });
    showToast(`💖 Selamat datang ibu ${ibu.nama}! +${POIN_POSYANDU} poin`);
  }

  async function startNFC() {
    if (!("NDEFReader" in window)) return showToast("⚠️ Pakai Chrome Android + aktifkan NFC", false);
    try {
      const ndef = new (window as any).NDEFReader();
      nfcRef.current = ndef; await ndef.scan(); setScanning(true);
      ndef.addEventListener("reading", ({ serialNumber }: any) => nfcAbsensi(serialNumber));
    } catch { showToast("❌ Gagal aktifkan NFC", false); }
  }
  function stopNFC() {
    try { nfcRef.current?.stop?.(); } catch {}
    setScanning(false); setLastScan(null);
  }

  function resetAll() {
    setStep("home");
    setSelectedAnak(null);
    setFormTK({ bb_kg: "", tb_cm: "", lila_cm: "", lk_cm: "" });
    setResultGizi(null);
    setLastScan(null);
  }

  const IS = { width: "100%", padding: "16px 20px", borderRadius: 16, border: "2px solid #E5E7EB", fontSize: 16, background: "#F9FAFB", outline: "none", boxSizing: "border-box" as const, fontFamily: "inherit", color: "#374151", fontWeight: 700 };

  return (
    <div style={{ minHeight: "100vh", background: "linear-gradient(180deg,#F4F9F6 0%,#E8F5EE 50%,#F0FDF4 100%)", fontFamily: "'Inter', system-ui, sans-serif", position: "relative", overflow: "hidden" }}>

      {/* Soft bubbles */}
      <div style={{ position: "fixed", top: "-10%", right: "-10%", width: 400, height: 400, borderRadius: "50%", background: "radial-gradient(circle,rgba(253,164,175,0.15),transparent 70%)", pointerEvents: "none" }} />
      <div style={{ position: "fixed", bottom: "-10%", left: "-10%", width: 500, height: 500, borderRadius: "50%", background: "radial-gradient(circle,rgba(167,243,208,0.2),transparent 70%)", pointerEvents: "none" }} />

      <style>{`
        @keyframes slide-up { from{transform:translateY(16px);opacity:0} to{transform:translateY(0);opacity:1} }
        @keyframes pop { 0%{transform:scale(0.8);opacity:0} 100%{transform:scale(1);opacity:1} }
        @keyframes ping { 0%{transform:scale(1);opacity:0.8} 100%{transform:scale(1.6);opacity:0} }
        @keyframes float { 0%,100%{transform:translateY(0)} 50%{transform:translateY(-8px)} }
        .posyandu-btn { transition:all 0.3s cubic-bezier(.22,1,.36,1); cursor:pointer; }
        .posyandu-btn:hover { transform:translateY(-2px); filter:brightness(1.05); }
        .posyandu-btn:active { transform:translateY(0); }
      `}</style>

      {/* Toast */}
      {toast.msg && (
        <div style={{ position: "fixed", top: 24, left: "50%", transform: "translateX(-50%)", background: toast.ok ? "linear-gradient(135deg,#F43F5E,#E11D48)" : "#111827", color: "#FFF", padding: "14px 28px", borderRadius: 99, zIndex: 999, fontSize: 14, fontWeight: 800, boxShadow: "0 10px 30px rgba(244,63,94,0.3)", animation: "slide-up 0.4s ease", maxWidth: "90vw", textAlign: "center" }}>
          {toast.msg}
        </div>
      )}

      <div style={{ maxWidth: 480, margin: "0 auto", padding: "0 20px", minHeight: "100vh", display: "flex", flexDirection: "column" }}>

        {/* Header */}
        <header style={{ textAlign: "center", paddingTop: 36, marginBottom: 24 }}>
          <div style={{ fontSize: 9, fontWeight: 800, letterSpacing: ".25em", color: "#FDA4AF", marginBottom: 8, textTransform: "uppercase" }}>
            Ciburial Eco-Digital Village
          </div>
          <h1 style={{ margin: "0 0 6px", fontSize: "clamp(28px,7vw,40px)", fontWeight: 900, color: "#111827", lineHeight: 1.2, letterSpacing: "-.02em" }}>
            Posyandu Ceria <span style={{ fontSize: "clamp(24px,6vw,36px)" }}>👶</span>
          </h1>
          <p style={{ margin: 0, fontSize: 13, color: "#6B7280", fontWeight: 600, lineHeight: 1.6 }}>
            Sentuhan kecil hari ini, tumbuh kembang optimal esok hari
          </p>
        </header>

        {/* ─── HOME STEP ─── */}
        {step === "home" && (
          <div style={{ flex: 1, display: "flex", flexDirection: "column", gap: 16, animation: "slide-up 0.5s ease" }}>

            {/* NFC Scan Card */}
            <div style={{ background: "white", borderRadius: 28, padding: "28px 24px", boxShadow: "0 10px 40px rgba(244,63,94,0.08)", border: "1px solid rgba(253,164,175,0.3)", textAlign: "center" }}>
              <div style={{ width: 56, height: 56, background: scanning ? "#FFE4E6" : "#FFF1F2", borderRadius: 16, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 28, margin: "0 auto 16px", transition: "all 0.3s" }}>
                {scanning ? "📡" : "💳"}
              </div>
              <h3 style={{ margin: "0 0 6px", fontSize: 18, fontWeight: 900, color: "#111827" }}>Tap Kartu Bunda</h3>
              <p style={{ margin: "0 0 20px", fontSize: 13, color: "#9CA3AF", fontWeight: 600 }}>
                Tempelkan kartu warga untuk absensi kehadiran posyandu
              </p>

              {scanning && (
                <div style={{ position: "relative", width: 100, height: 100, margin: "0 auto 16px" }}>
                  <div style={{ position: "absolute", inset: 0, borderRadius: "50%", border: "3px dashed #FDA4AF", animation: "ping 1.5s infinite" }} />
                  <div style={{ width: "100%", height: "100%", borderRadius: "50%", background: "#FFF1F2", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 40 }}>📡</div>
                </div>
              )}

              {lastScan && (
                <div style={{ background: "#ECFDF5", border: "2px solid #A7F3D0", borderRadius: 20, padding: 16, marginBottom: 16, textAlign: "left", animation: "pop 0.4s ease" }}>
                  <div style={{ fontWeight: 900, fontSize: 16, color: "#064E3B", marginBottom: 2 }}>💖 Halo, Ibu {lastScan.nama}!</div>
                  <div style={{ fontSize: 13, color: "#059669", fontWeight: 700 }}>Anak: {lastScan.namaAnak}</div>
                  <div style={{ fontSize: 15, color: "#10B981", fontWeight: 900, marginTop: 6 }}>+{lastScan.poin} Poin Sehat 🌟</div>
                </div>
              )}

              <button onClick={scanning ? stopNFC : startNFC} className="posyandu-btn"
                style={{ width: "100%", background: scanning ? "#FFE4E6" : "linear-gradient(135deg,#F43F5E,#E11D48)", color: scanning ? "#E11D48" : "white", border: scanning ? "2px solid #FECACA" : "none", borderRadius: 16, padding: 16, fontSize: 15, fontWeight: 800, boxShadow: scanning ? "none" : "0 8px 25px rgba(225,29,72,0.25)" }}>
                {scanning ? "⏹ Matikan Pindai" : "Mulai Pindai Kartu ▶"}
              </button>
            </div>

            {/* Divider */}
            <div style={{ display: "flex", alignItems: "center", gap: 12, margin: "4px 0" }}>
              <div style={{ flex: 1, height: 1, background: "rgba(253,164,175,0.3)" }} />
              <span style={{ fontSize: 10, fontWeight: 800, letterSpacing: ".15em", color: "#FDA4AF" }}>ATAU</span>
              <div style={{ flex: 1, height: 1, background: "rgba(253,164,175,0.3)" }} />
            </div>

            {/* Input Timbangan Card */}
            <button onClick={() => setStep("select")} className="posyandu-btn"
              style={{ background: "white", borderRadius: 24, padding: "24px", boxShadow: "0 8px 30px rgba(16,185,129,0.08)", border: "2px solid #D1FAE5", display: "flex", alignItems: "center", gap: 16, textAlign: "left", width: "100%" }}>
              <div style={{ width: 52, height: 52, background: "#ECFDF5", borderRadius: 16, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 26, flexShrink: 0 }}>⚖️</div>
              <div>
                <div style={{ fontSize: 17, fontWeight: 900, color: "#111827", marginBottom: 2 }}>Input Timbangan Balita</div>
                <div style={{ fontSize: 12, color: "#6B7280", fontWeight: 600 }}>Catat berat & tinggi badan hari ini</div>
              </div>
              <div style={{ marginLeft: "auto", fontSize: 20, color: "#D1D5DB" }}>→</div>
            </button>

            {/* Footer */}
            <div style={{ textAlign: "center", paddingTop: 24, paddingBottom: 20 }}>
              <div style={{ fontSize: 9, color: "#D1D5DB", letterSpacing: ".2em", lineHeight: 1.8, fontWeight: 600 }}>
                KIOSK POSYANDU · HANYA UNTUK INPUT DATA<br />
                DATA DIJAGA SECARA AMAN DI SERVER
              </div>
            </div>
          </div>
        )}

        {/* ─── SELECT ANAK ─── */}
        {step === "select" && (
          <div style={{ flex: 1, animation: "slide-up 0.4s ease" }}>
            <button onClick={() => setStep("home")} style={{ background: "none", border: "none", color: "#F43F5E", fontSize: 13, fontWeight: 800, cursor: "pointer", marginBottom: 16, padding: 0 }}>← Kembali</button>
            <h3 style={{ margin: "0 0 16px", fontSize: 20, fontWeight: 900, color: "#111827" }}>Pilih Nama Anak 👶</h3>
            {anakList.length === 0 ? (
              <div style={{ textAlign: "center", padding: 40, color: "#9CA3AF", fontSize: 14, fontWeight: 700 }}>Belum ada data anak terdaftar</div>
            ) : (
              <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                {anakList.map(a => (
                  <button key={a.id} onClick={() => { setSelectedAnak(a); setStep("input"); }} className="posyandu-btn"
                    style={{ background: "white", borderRadius: 20, padding: "18px 20px", border: "1.5px solid #E5E7EB", display: "flex", alignItems: "center", gap: 14, width: "100%", textAlign: "left", boxShadow: "0 2px 8px rgba(0,0,0,0.03)" }}>
                    <div style={{ width: 44, height: 44, borderRadius: 14, background: a.jenis_kelamin === "L" ? "#EFF6FF" : "#FDF2F8", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 22, flexShrink: 0 }}>
                      {a.jenis_kelamin === "L" ? "👦" : "👧"}
                    </div>
                    <div style={{ flex: 1 }}>
                      <div style={{ fontWeight: 900, fontSize: 16, color: "#111827" }}>{a.nama}</div>
                      <div style={{ fontSize: 12, color: "#9CA3AF", fontWeight: 700 }}>{hitungUmurLabel(a.tgl_lahir)} · Bunda {a.nama_ibu}</div>
                    </div>
                    <div style={{ fontSize: 18, color: "#D1D5DB" }}>→</div>
                  </button>
                ))}
              </div>
            )}
          </div>
        )}

        {/* ─── INPUT STEP ─── */}
        {step === "input" && selectedAnak && (
          <div style={{ flex: 1, animation: "slide-up 0.4s ease" }}>
            <button onClick={() => setStep("select")} style={{ background: "none", border: "none", color: "#F43F5E", fontSize: 13, fontWeight: 800, cursor: "pointer", marginBottom: 16, padding: 0 }}>← Ganti Anak</button>

            {/* Anak Info */}
            <div style={{ background: "white", borderRadius: 24, padding: "20px 24px", marginBottom: 20, boxShadow: "0 4px 16px rgba(0,0,0,0.04)", border: "1.5px solid #E5E7EB", display: "flex", alignItems: "center", gap: 14 }}>
              <div style={{ width: 48, height: 48, borderRadius: 16, background: selectedAnak.jenis_kelamin === "L" ? "#EFF6FF" : "#FDF2F8", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 24 }}>
                {selectedAnak.jenis_kelamin === "L" ? "👦" : "👧"}
              </div>
              <div>
                <div style={{ fontWeight: 900, fontSize: 18, color: "#111827" }}>{selectedAnak.nama}</div>
                <div style={{ fontSize: 12, color: "#9CA3AF", fontWeight: 700 }}>{hitungUmurLabel(selectedAnak.tgl_lahir)} · Bunda {selectedAnak.nama_ibu}</div>
              </div>
            </div>

            {/* Live Gizi Preview */}
            {formTK.bb_kg && (() => {
              const gz = statusGiziWHO(Number(formTK.bb_kg), selectedAnak.tgl_lahir);
              return (
                <div style={{ padding: "14px 18px", background: gz.color + "1A", border: `2px solid ${gz.color}40`, borderRadius: 16, marginBottom: 16, fontSize: 15, color: gz.color, fontWeight: 800, display: "flex", alignItems: "center", gap: 10, animation: "pop 0.3s ease" }}>
                  <span style={{ fontSize: 20 }}>🔬</span> Prediksi: <span style={{ marginLeft: "auto" }}>{gz.label}</span>
                </div>
              );
            })()}

            {/* Form */}
            <div style={{ background: "white", borderRadius: 24, padding: 24, boxShadow: "0 8px 30px rgba(0,0,0,0.04)", border: "1px solid #E5E7EB" }}>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14, marginBottom: 16 }}>
                <div>
                  <label style={{ fontSize: 10, fontWeight: 800, color: "#9CA3AF", letterSpacing: ".1em", display: "block", marginBottom: 6 }}>BERAT (KG) *</label>
                  <input type="number" value={formTK.bb_kg} onChange={e => setFormTK({ ...formTK, bb_kg: e.target.value })} placeholder="8.5" style={IS} />
                </div>
                <div>
                  <label style={{ fontSize: 10, fontWeight: 800, color: "#9CA3AF", letterSpacing: ".1em", display: "block", marginBottom: 6 }}>TINGGI (CM)</label>
                  <input type="number" value={formTK.tb_cm} onChange={e => setFormTK({ ...formTK, tb_cm: e.target.value })} placeholder="75" style={IS} />
                </div>
                <div>
                  <label style={{ fontSize: 10, fontWeight: 800, color: "#9CA3AF", letterSpacing: ".1em", display: "block", marginBottom: 6 }}>LINGK. LENGAN</label>
                  <input type="number" value={formTK.lila_cm} onChange={e => setFormTK({ ...formTK, lila_cm: e.target.value })} placeholder="cm" style={IS} />
                </div>
                <div>
                  <label style={{ fontSize: 10, fontWeight: 800, color: "#9CA3AF", letterSpacing: ".1em", display: "block", marginBottom: 6 }}>LINGK. KEPALA</label>
                  <input type="number" value={formTK.lk_cm} onChange={e => setFormTK({ ...formTK, lk_cm: e.target.value })} placeholder="cm" style={IS} />
                </div>
              </div>

              <button onClick={simpanTK} disabled={loading} className="posyandu-btn"
                style={{ width: "100%", background: loading ? "#D1D5DB" : "linear-gradient(135deg,#10B981,#059669)", color: "white", border: "none", borderRadius: 16, padding: 18, fontSize: 16, fontWeight: 900, boxShadow: loading ? "none" : "0 8px 25px rgba(16,185,129,0.3)" }}>
                {loading ? "Menyimpan..." : "💾 Simpan Data Timbangan"}
              </button>
            </div>
          </div>
        )}

        {/* ─── SUCCESS STEP ─── */}
        {step === "success" && resultGizi && (
          <div style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", textAlign: "center", animation: "pop 0.5s ease", padding: "40px 0" }}>
            <div style={{ fontSize: 72, marginBottom: 16, animation: "float 2s ease-in-out infinite" }}>
              {resultGizi.status === "normal" ? "🎉" : resultGizi.status === "lebih" ? "⚠️" : "🚨"}
            </div>
            <h2 style={{ margin: "0 0 8px", fontSize: 28, fontWeight: 900, color: "#111827" }}>Data Tersimpan!</h2>
            <div style={{ fontSize: 18, fontWeight: 800, color: resultGizi.color, marginBottom: 8 }}>{resultGizi.label}</div>
            <p style={{ fontSize: 14, color: "#6B7280", fontWeight: 600, marginBottom: 8 }}>
              {selectedAnak?.nama} · {formTK.bb_kg} kg {formTK.tb_cm ? `· ${formTK.tb_cm} cm` : ""}
            </p>
            <div style={{ fontSize: 14, color: "#10B981", fontWeight: 800, marginBottom: 32 }}>
              Bunda mendapat +{POIN_POSYANDU} Poin Sehat 🌟
            </div>
            <button onClick={resetAll} className="posyandu-btn"
              style={{ background: "linear-gradient(135deg,#F43F5E,#E11D48)", color: "white", border: "none", borderRadius: 16, padding: "16px 48px", fontSize: 16, fontWeight: 900, boxShadow: "0 8px 25px rgba(225,29,72,0.25)" }}>
              Selesai ✓
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
