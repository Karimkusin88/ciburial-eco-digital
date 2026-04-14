"use client";
import { useState, useEffect, useRef } from "react";
import { supabase, isSupabaseReady } from "@/lib/supabase";

interface Voting { id: string; judul: string; deskripsi: string; tgl_mulai: string; tgl_selesai: string; status: string; }
interface Pilihan { id: string; voting_id: string; teks: string; jumlah_vote: number; }
interface KK { id: string; kepala_keluarga: string; nfc_id: string; rt: string; }

export default function VotingPage() {
  const [votings, setVotings] = useState<Voting[]>([]);
  const [pilihanMap, setPilihanMap] = useState<Record<string, Pilihan[]>>({});
  const [kkList, setKkList] = useState<KK[]>([]);
  
  // Auth state
  const [activeVoting, setActiveVoting] = useState<string | null>(null);
  const [authMode, setAuthMode] = useState<"nfc"|"manual"|null>(null);
  const [selectedKk, setSelectedKk] = useState("");
  const [scanning, setScanning] = useState(false);
  const [verifikasiSukses, setVerifikasiSukses] = useState<KK | null>(null);

  const [loading, setLoading] = useState<string | null>(null);
  const [toast, setToast] = useState({ msg: "", type: "info" });
  
  const nfcRef = useRef<any>(null);

  const showToast = (msg: string, type: "success"|"error"|"info" = "info") => { 
    setToast({ msg, type }); 
    setTimeout(() => setToast({ msg: "", type: "info" }), 4000); 
  };

  async function fetchAll() {
    if (!isSupabaseReady()) return;
    const [vReq, kkReq] = await Promise.all([
      supabase.from("voting").select("*").eq("status", "aktif").order("tgl_mulai", { ascending: false }),
      supabase.from("keluarga").select("*").order("kepala_keluarga", { ascending: true })
    ]);
    
    if (vReq.data) {
      setVotings(vReq.data);
      const pm: Record<string, Pilihan[]> = {};
      await Promise.all(vReq.data.map(async (v) => {
        const { data: p } = await supabase.from("pilihan_voting").select("*").eq("voting_id", v.id).order("jumlah_vote", { ascending: false });
        if (p) pm[v.id] = p;
      }));
      setPilihanMap(pm);
    }
    if (kkReq.data) setKkList(kkReq.data);
  }

  useEffect(() => { fetchAll(); }, []);

  // Memastikan fungsi authentikasi NFC membaca KK terbaru
  const kkListRef = useRef(kkList);
  useEffect(() => { kkListRef.current = kkList; }, [kkList]);

  // NFC Logic
  async function startNfcScan() {
    if (!("NDEFReader" in window)) return showToast("NFC tidak didukung di perangkat ini", "error");
    try {
      const ndef = new (window as any).NDEFReader();
      nfcRef.current = ndef;
      await ndef.scan();
      setScanning(true);
      showToast("NFC Aktif! Tempelkan Kartu Warga ke punggung HP...", "info");
      
      ndef.addEventListener("reading", async ({ serialNumber }: any) => {
        const nfcId = serialNumber.replace(/:/g, "").toUpperCase();
        const found = kkListRef.current.find(k => k.nfc_id === nfcId);
        
        if (found) {
          stopNfcScan();
          await prosesVerifikasi(found);
        } else {
          showToast("❌ Kartu NFC ditolak! Tidak terdaftar dalam Data RT/RW", "error");
        }
      });
    } catch (e) {
      showToast("Gagal mengaktifkan NFC", "error");
      setScanning(false);
    }
  }

  function stopNfcScan() {
    if (nfcRef.current) nfcRef.current.stop?.();
    setScanning(false);
  }

  async function prosesVerifikasi(kk: KK) {
    if (!activeVoting) return;
    setLoading("verify");
    const { data: voteExist } = await supabase.from("vote_record")
      .select("id").eq("voting_id", activeVoting).eq("kk_id", kk.id).limit(1);
    
    if (voteExist && voteExist.length > 0) {
      showToast(`Keluarga Bpk/Ibu ${kk.kepala_keluarga} sudah memberikan suara pada agenda ini!`, "error");
      closeBilik();
    } else {
      setVerifikasiSukses(kk);
      showToast(`Verifikasi sukses: ${kk.kepala_keluarga}`, "success");
    }
    setLoading(null);
  }

  function handleManualSukses() {
    if (!selectedKk) return showToast("Pilih nama KK terlebih dahulu!", "error");
    const kk = kkList.find(k => k.id === selectedKk);
    if (kk) prosesVerifikasi(kk);
  }

  async function kirimSuara(pilihanId: string) {
    if (!activeVoting || !verifikasiSukses) return;
    setLoading(pilihanId);
    
    try {
      // Catat bahwa KK ini sudah vote (Pencegahan Dobel)
      const { error: errRecord } = await supabase.from("vote_record").insert({ 
        voting_id: activeVoting, 
        kk_id: verifikasiSukses.id,
        ip_address: "authenticated-frontend"
      });
      if (errRecord) throw errRecord;

      // Tambah jumlah suara realtime
      const currentChoice = pilihanMap[activeVoting]?.find(p => p.id === pilihanId);
      if (currentChoice) {
        await supabase.from("pilihan_voting")
          .update({ jumlah_vote: (currentChoice.jumlah_vote || 0) + 1 })
          .eq("id", pilihanId);
      }

      showToast("🎉 Suara berhasil masuk kotak digital!", "success");
      closeBilik();
      fetchAll(); // Refresh data
    } catch (e) {
      showToast("Terjadi kesalahan saat menyimpan suara.", "error");
    }
    setLoading(null);
  }

  function closeBilik() {
    setActiveVoting(null);
    setAuthMode(null);
    setVerifikasiSukses(null);
    setSelectedKk("");
    if (scanning) stopNfcScan();
  }

  function persen(suara: number, total: number) { return total === 0 ? 0 : Math.round((suara / total) * 100); }
  function totalSuara(vId: string) { return (pilihanMap[vId] || []).reduce((s, p) => s + (p.jumlah_vote || 0), 0); }

  return (
    <div style={{ minHeight: "100vh", background: "#f8f9fa", fontFamily: "'Inter', system-ui, sans-serif", paddingBottom: 60 }}>
      {toast.msg && (
        <div style={{
          position: "fixed", top: 20, left: "50%", transform: "translateX(-50%)", 
          background: toast.type === "success" ? "#10b981" : toast.type === "error" ? "#ef4444" : "#3b82f6", 
          color: "white", padding: "12px 24px", borderRadius: 99, zIndex: 9999, fontSize: 14, fontWeight: 600, 
          boxShadow: "0 10px 25px rgba(0,0,0,0.15)", display: "flex", alignItems: "center", gap: 8, whiteSpace: "nowrap"
        }}>
          {toast.msg}
        </div>
      )}

      <header style={{ background: "linear-gradient(135deg, #1C3A2B 0%, #2D5A40 100%)", color: "white", padding: "30px 20px", borderBottomLeftRadius: 36, borderBottomRightRadius: 36, boxShadow: "0 4px 24px rgba(45,90,64,0.2)", marginBottom: -50, paddingBottom: 100 }}>
        <div style={{ maxWidth: 800, margin: "0 auto", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <a href="/" style={{ color: "rgba(255,255,255,0.8)", textDecoration: "none", fontSize: 13, fontWeight: 600, background: "rgba(0,0,0,0.25)", padding: "8px 16px", borderRadius: 99 }}>← Beranda</a>
          <div style={{ display: "flex", gap: 6 }}>
            <span style={{ background: "rgba(255,255,255,0.15)", padding: "8px 14px", borderRadius: 10, fontSize: 11, fontWeight: 800, letterSpacing: "0.08em", backdropFilter: "blur(10px)" }}>✓ 1 KARTU KK = 1 SUARA</span>
          </div>
        </div>
        <div style={{ maxWidth: 800, margin: "40px auto 0" }}>
          <div style={{ fontSize: 12, fontWeight: 800, letterSpacing: "0.2em", color: "#a7f3d0", marginBottom: 12 }}>DESA MANDIRI CIBURIAL</div>
          <h1 style={{ margin: 0, fontSize: "clamp(32px, 6vw, 48px)", fontWeight: 800, letterSpacing: "-0.03em" }}>Digital E-Voting</h1>
          <p style={{ margin: "14px 0 0", fontSize: 16, color: "rgba(255,255,255,0.85)", maxWidth: 540, lineHeight: 1.7 }}>Musyawarah warga yang transparan, aman, dan langsung tercatat menggunakan otentikasi Kartu NFC Identitas.</p>
        </div>
      </header>

      <main style={{ maxWidth: 800, margin: "0 auto", padding: "0 16px", position: "relative", zIndex: 10 }}>
        {votings.length === 0 ? (
          <div style={{ background: "white", borderRadius: 24, padding: "70px 30px", textAlign: "center", boxShadow: "0 10px 40px rgba(0,0,0,0.06)", border: "1px solid rgba(0,0,0,0.04)" }}>
            <div style={{ fontSize: 64, marginBottom: 20 }}>🗳️</div>
            <h2 style={{ margin: "0 0 12px", color: "#111827", fontSize: 24, fontWeight: 800 }}>Bilik Suara Tutup</h2>
            <p style={{ margin: 0, color: "#6b7280", fontSize: 15 }}>Saat ini tidak ada agenda perumusan atau musyawarah yang sedang berlangsung.</p>
          </div>
        ) : votings.map(v => {
          const total = totalSuara(v.id);
          const pilihan = pilihanMap[v.id] || [];
          const maxSuara = Math.max(...pilihan.map(p => p.jumlah_vote || 0), 1);

          return (
            <div key={v.id} style={{ background: "white", borderRadius: 28, padding: "32px clamp(20px, 4vw, 40px)", marginBottom: 28, boxShadow: "0 12px 40px rgba(0,0,0,0.08)", border: "1px solid rgba(0,0,0,0.05)" }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 32, flexWrap: "wrap", gap: 20 }}>
                <div style={{ flex: 1, minWidth: 260 }}>
                  <div style={{ display: "flex", gap: 10, marginBottom: 14 }}>
                    <span style={{ background: "#ecfdf5", color: "#059669", padding: "6px 12px", borderRadius: 8, fontSize: 11, fontWeight: 800, letterSpacing: "0.06em", textTransform: "uppercase" }}>● SEDANG BERLANGSUNG</span>
                  </div>
                  <h2 style={{ margin: "0 0 10px", color: "#111827", fontSize: "clamp(24px, 3.5vw, 30px)", fontWeight: 900, lineHeight: 1.2, letterSpacing: "-0.01em" }}>{v.judul}</h2>
                  {v.deskripsi && <p style={{ margin: 0, color: "#6b7280", fontSize: 15, lineHeight: 1.6 }}>{v.deskripsi}</p>}
                </div>
                <div style={{ background: "#f8f9fa", padding: "18px 24px", borderRadius: 20, textAlign: "center", border: "1px solid #e5e7eb", minWidth: 140 }}>
                  <div style={{ fontSize: 40, fontWeight: 900, color: "#1C3A2B", lineHeight: 1 }}>{total}</div>
                  <div style={{ fontSize: 11, fontWeight: 700, color: "#6b7280", marginTop: 8, letterSpacing: "0.07em", textTransform: "uppercase" }}>Total Suara Masuk</div>
                </div>
              </div>

              {/* Progress Bar Hasil Sementara */}
              <div style={{ marginBottom: 40 }}>
                <h3 style={{ fontSize: 13, fontWeight: 800, color: "#9ca3af", letterSpacing: "0.08em", textTransform: "uppercase", marginBottom: 20, display: "flex", alignItems: "center", gap: 10 }}>
                  <span>📊</span> TABULASI TERBUKA (REAL-TIME)
                </h3>
                <div style={{ display: "flex", flexDirection: "column", gap: 18 }}>
                  {pilihan.map(p => {
                    const pc = persen(p.jumlah_vote || 0, total);
                    const isLeading = p.jumlah_vote === maxSuara && total > 0;
                    return (
                      <div key={p.id}>
                        <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 8, fontSize: 15 }}>
                          <span style={{ fontWeight: isLeading ? 800 : 600, color: isLeading ? "#1C3A2B" : "#4b5563", display: "flex", alignItems: "center", gap: 8 }}>
                            {isLeading && total > 0 && <span style={{ fontSize: 16 }}>🏆</span>} {p.teks}
                          </span>
                          <span style={{ fontWeight: 800, color: isLeading ? "#10b981" : "#6b7280" }}>{pc}% <span style={{ color: "#9ca3af", fontWeight: 600, fontSize: 13 }}>({p.jumlah_vote || 0})</span></span>
                        </div>
                        <div style={{ height: 14, background: "#f3f4f6", borderRadius: 99, overflow: "hidden", position: "relative" }}>
                          <div style={{ position: "absolute", top: 0, left: 0, bottom: 0, background: isLeading ? "linear-gradient(90deg, #1C3A2B, #10b981)" : "#9ca3af", width: `${pc}%`, borderRadius: 99, transition: "width 1s cubic-bezier(0.4, 0, 0.2, 1)" }} />
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Tombol Buka Bilik Suara */}
              <button 
                onClick={() => setActiveVoting(v.id)}
                style={{ width: "100%", padding: "20px", background: "linear-gradient(135deg, #1C3A2B 0%, #2D5A40 100%)", color: "white", borderRadius: 16, border: "none", fontSize: 16, fontWeight: 800, cursor: "pointer", display: "flex", justifyContent: "center", alignItems: "center", gap: 12, boxShadow: "0 8px 24px rgba(28,58,43,0.3)", transition: "all 0.2s" }}
                onMouseEnter={e => { e.currentTarget.style.transform = "translateY(-3px)"; e.currentTarget.style.boxShadow = "0 12px 30px rgba(28,58,43,0.4)"; }}
                onMouseLeave={e => { e.currentTarget.style.transform = "translateY(0)"; e.currentTarget.style.boxShadow = "0 8px 24px rgba(28,58,43,0.3)"; }}
              >
                <span style={{ fontSize: 22 }}>📬</span> Masuk ke Bilik Suara
              </button>
            </div>
          );
        })}
      </main>

      {/* OVERLAY BILIK SUARA / AUTH */}
      {activeVoting && (
        <div style={{ position: "fixed", top: 0, left: 0, right: 0, bottom: 0, background: "rgba(17,24,39,0.85)", backdropFilter: "blur(12px)", zIndex: 100, display: "flex", alignItems: "center", justifyContent: "center", padding: 20 }}>
          
          <div style={{ background: "white", width: "100%", maxWidth: 540, borderRadius: 28, overflow: "hidden", display: "flex", flexDirection: "column", maxHeight: "90vh", boxShadow: "0 25px 50px -12px rgba(0,0,0,0.5)" }}>
            <div style={{ padding: "24px 32px", borderBottom: "1px solid #f3f4f6", display: "flex", justifyContent: "space-between", alignItems: "center", background: "#f9fafb" }}>
              <h3 style={{ margin: 0, fontSize: 18, fontWeight: 900, color: "#111827", letterSpacing: "0.02em" }}>Bilik Suara Tertutup</h3>
              <button onClick={closeBilik} style={{ background: "#e5e7eb", border: "none", width: 36, height: 36, borderRadius: "50%", fontSize: 18, color: "#4b5563", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 700, transition: "background 0.2s" }} onMouseEnter={e => e.currentTarget.style.background = "#d1d5db"} onMouseLeave={e => e.currentTarget.style.background = "#e5e7eb"}>×</button>
            </div>

            <div style={{ padding: "32px", overflowY: "auto" }}>
              
              {/* STEP 1: VERIFIKASI */}
              {!verifikasiSukses && (
                <div style={{ animation: "fadeIn 0.3s ease-out" }}>
                  <div style={{ textAlign: "center", marginBottom: 36 }}>
                    <div style={{ width: 72, height: 72, borderRadius: "50%", background: "#ecfdf5", color: "#10b981", fontSize: 32, display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 20px" }}>🔐</div>
                    <h4 style={{ margin: "0 0 12px", fontSize: 22, fontWeight: 900, color: "#111827" }}>Otentikasi Wali Keluarga</h4>
                    <p style={{ margin: 0, color: "#6b7280", fontSize: 15, lineHeight: 1.6 }}>Sistem mendeteksi 1 Hak Suara Kepala Keluarga. Silakan verifikasi identitas Anda untuk mencoblos.</p>
                  </div>

                  {!authMode && (
                    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
                      <button onClick={() => setAuthMode("nfc")} style={{ padding: "28px 20px", borderRadius: 20, border: "2px solid #e5e7eb", background: "white", cursor: "pointer", display: "flex", flexDirection: "column", alignItems: "center", gap: 16, transition: "all 0.2s" }} onMouseEnter={e => { e.currentTarget.style.borderColor = "#2D5A40"; e.currentTarget.style.background = "#f8f9fa"; }} onMouseLeave={e => { e.currentTarget.style.borderColor = "#e5e7eb"; e.currentTarget.style.background = "white"; }}>
                        <span style={{ fontSize: 42 }}>💳</span>
                        <span style={{ fontSize: 14, fontWeight: 800, color: "#374151" }}>Tap Kartu (NFC)</span>
                      </button>
                      <button onClick={() => setAuthMode("manual")} style={{ padding: "28px 20px", borderRadius: 20, border: "2px solid #e5e7eb", background: "white", cursor: "pointer", display: "flex", flexDirection: "column", alignItems: "center", gap: 16, transition: "all 0.2s" }} onMouseEnter={e => { e.currentTarget.style.borderColor = "#2D5A40"; e.currentTarget.style.background = "#f8f9fa"; }} onMouseLeave={e => { e.currentTarget.style.borderColor = "#e5e7eb"; e.currentTarget.style.background = "white"; }}>
                        <span style={{ fontSize: 42 }}>📋</span>
                        <span style={{ fontSize: 14, fontWeight: 800, color: "#374151" }}>Pilih Nama KK</span>
                      </button>
                    </div>
                  )}

                  {authMode === "nfc" && (
                    <div style={{ textAlign: "center", padding: "10px 0" }}>
                      <div style={{ 
                        width: 140, height: 140, borderRadius: "50%", margin: "0 auto 30px", 
                        background: scanning ? "rgba(45,90,64,0.08)" : "#f3f4f6", 
                        border: `4px ${scanning ? "solid" : "dashed"} ${scanning ? "#2D5A40" : "#d1d5db"}`, 
                        display: "flex", alignItems: "center", justifyContent: "center", fontSize: 56,
                        animation: scanning ? "pulse 1.8s infinite" : "none" 
                      }}>
                        {scanning ? "📡" : "📵"}
                      </div>
                      
                      {loading === "verify" ? (
                        <div style={{ padding: "16px", background: "#f3f4f6", borderRadius: 12, fontWeight: 700, color: "#4b5563" }}>⏳ Mencocokkan data server...</div>
                      ) : (
                        <button onClick={scanning ? stopNfcScan : startNfcScan} style={{ padding: "16px 32px", borderRadius: 16, border: "none", background: scanning ? "#fee2e2" : "#1C3A2B", color: scanning ? "#dc2626" : "white", fontSize: 15, fontWeight: 800, cursor: "pointer", width: "100%", letterSpacing: "0.02em" }}>
                          {scanning ? "⏹ Batal Pindai" : "▶ Tempelkan Kartu ke Punggung HP"}
                        </button>
                      )}
                      <button onClick={() => { stopNfcScan(); setAuthMode(null); }} style={{ marginTop: 24, background: "none", border: "none", color: "#6b7280", fontSize: 15, fontWeight: 700, cursor: "pointer", textDecoration: "underline" }}>Pilih Cara Lain</button>
                    </div>
                  )}

                  {authMode === "manual" && (
                    <div style={{ padding: "10px 0" }}>
                      <label style={{ display: "block", fontSize: 13, fontWeight: 800, color: "#4b5563", marginBottom: 12, letterSpacing: "0.05em" }}>CARI NAMA KEPALA KELUARGA (KK)</label>
                      <select value={selectedKk} onChange={(e) => setSelectedKk(e.target.value)} disabled={loading === "verify"} style={{ width: "100%", padding: "16px 20px", borderRadius: 16, border: "2px solid #e5e7eb", fontSize: 15, fontWeight: 600, color: "#111827", outline: "none", background: "#f9fafb", marginBottom: 30, cursor: "pointer" }}>
                        <option value="" style={{ color: "#9ca3af" }}>-- Pilih Wakil Data KK --</option>
                        {kkList.map(k => (
                          <option key={k.id} value={k.id}>{k.kepala_keluarga} (Warga RT {k.rt})</option>
                        ))}
                      </select>
                      
                      <button onClick={handleManualSukses} disabled={loading === "verify"} style={{ padding: "18px", borderRadius: 16, border: "none", background: "#1C3A2B", color: "white", fontSize: 16, fontWeight: 800, cursor: loading === "verify" ? "not-allowed" : "pointer", width: "100%", opacity: loading === "verify" ? 0.7 : 1, transition: "background 0.2s" }}>
                        {loading === "verify" ? "⏳ Mengecek Hak Suara..." : "Lanjut ke Kertas Suara →"}
                      </button>
                      <div style={{ textAlign: "center", marginTop: 24 }}>
                        <button onClick={() => { setAuthMode(null); }} style={{ background: "none", border: "none", color: "#6b7280", fontSize: 15, fontWeight: 700, cursor: "pointer", textDecoration: "underline" }}>Pilih Cara Lain</button>
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* STEP 2: KERTAS SUARA (PILIH KANDIDAT) */}
              {verifikasiSukses && (
                <div style={{ animation: "fadeIn 0.4s ease-out" }}>
                  <div style={{ background: "linear-gradient(to right, #ecfdf5, #f0fdf4)", border: "2px solid #a7f3d0", borderRadius: 16, padding: "18px 20px", marginBottom: 36, display: "flex", alignItems: "center", gap: 16 }}>
                    <div style={{ width: 48, height: 48, borderRadius: "50%", background: "#d1fae5", color: "#059669", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 24 }}>✓</div>
                    <div>
                      <div style={{ fontSize: 12, fontWeight: 800, color: "#059669", letterSpacing: "0.08em", marginBottom: 4 }}>ID VALID: KEPALA KELUARGA</div>
                      <div style={{ fontSize: 18, fontWeight: 900, color: "#064e3b" }}>Kel. {verifikasiSukses.kepala_keluarga} <span style={{ opacity: 0.6, fontSize: 14 }}>(RT {verifikasiSukses.rt})</span></div>
                    </div>
                  </div>

                  <div style={{ textAlign: "center", marginBottom: 24 }}>
                    <h4 style={{ margin: "0 0 10px", fontSize: 22, fontWeight: 900, color: "#111827" }}>Kertas Suara Anda</h4>
                    <p style={{ margin: 0, fontSize: 14, color: "#6b7280", lineHeight: 1.5 }}>Hak suara Anda dilindungi kerahasiaannya. Ketukan Anda mutlak.</p>
                  </div>
                  
                  <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
                    {(pilihanMap[activeVoting] || []).map((p, i) => (
                      <button 
                        key={p.id}
                        onClick={() => { if(confirm(`Anda akan memberikan hak suara secara mutlak pada: \n\n[ ${p.teks} ]\n\nLanjutkan menetapkan pilihan?`)) kirimSuara(p.id); }}
                        disabled={loading !== null}
                        style={{
                          background: "white", border: "2px solid #e5e7eb", borderRadius: 20, padding: "24px",
                          display: "flex", alignItems: "center", justifyContent: "space-between", cursor: loading ? "not-allowed" : "pointer",
                          transition: "all 0.2s", opacity: loading && loading !== p.id ? 0.4 : 1, boxShadow: "0 2px 8px rgba(0,0,0,0.02)", textAlign: "left"
                        }}
                        onMouseEnter={e => { e.currentTarget.style.borderColor = "#10b981"; e.currentTarget.style.transform = "scale(1.02)"; }}
                        onMouseLeave={e => { e.currentTarget.style.borderColor = "#e5e7eb"; e.currentTarget.style.transform = "scale(1)"; }}
                      >
                        <div style={{ display: "flex", alignItems: "center", gap: 20 }}>
                          <span style={{ width: 44, height: 44, borderRadius: 12, background: "#f3f4f6", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 18, fontWeight: 900, color: "#4b5563" }}>{i+1}</span>
                          <span style={{ fontSize: 20, fontWeight: 800, color: "#1f2937" }}>{p.teks}</span>
                        </div>
                        {loading === p.id ? (
                          <span style={{ fontWeight: 800, color: "#10b981", fontSize: 15 }}>⏳ Mencatat...</span>
                        ) : (
                          <span style={{ width: 36, height: 36, display: "flex", alignItems: "center", justifyContent: "center", border: "2px solid #d1d5db", borderRadius: "50%", color: "white", fontSize: 14 }}></span>
                        )}
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      <style>{`
        @keyframes fadeIn { from { opacity: 0; transform: translateY(20px) } to { opacity: 1; transform: translateY(0) } }
        @keyframes pulse { 0%, 100% { opacity: 1; transform: scale(1) } 50% { opacity: 0.8; transform: scale(1.06) } }
      `}</style>
    </div>
  );
}