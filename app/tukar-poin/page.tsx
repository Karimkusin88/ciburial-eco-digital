"use client";
import { useState, useEffect, useRef } from "react";
import { supabase, isSupabaseReady } from "@/lib/supabase";

interface Hadiah { id?: string; nama: string; kategori: string; poin_dibutuhkan: number; stok: number; }
interface Saldo { kk_id?: string; total_poin: number; total_setor_kg: number; }

const ATM_ITEMS: Hadiah[] = [
  // Tarik Tunai
  { nama: "Tarik Tunai Rp 10.000", kategori: "uang", poin_dibutuhkan: 100, stok: 999 },
  { nama: "Tarik Tunai Rp 20.000", kategori: "uang", poin_dibutuhkan: 200, stok: 999 },
  { nama: "Tarik Tunai Rp 50.000", kategori: "uang", poin_dibutuhkan: 500, stok: 999 },
  { nama: "Tarik Tunai Rp 100.000", kategori: "uang", poin_dibutuhkan: 1000, stok: 999 },
  // Pulsa
  { nama: "Pulsa Rp 5.000", kategori: "pulsa", poin_dibutuhkan: 50, stok: 999 },
  { nama: "Pulsa Rp 10.000", kategori: "pulsa", poin_dibutuhkan: 100, stok: 999 },
  { nama: "Pulsa Rp 25.000", kategori: "pulsa", poin_dibutuhkan: 250, stok: 999 },
  { nama: "Pulsa Rp 50.000", kategori: "pulsa", poin_dibutuhkan: 500, stok: 999 },
  // E-Wallet
  { nama: "Topup E-Wallet Rp 10.000", kategori: "ewallet", poin_dibutuhkan: 100, stok: 999 },
  { nama: "Topup E-Wallet Rp 20.000", kategori: "ewallet", poin_dibutuhkan: 200, stok: 999 },
  { nama: "Topup E-Wallet Rp 50.000", kategori: "ewallet", poin_dibutuhkan: 500, stok: 999 },
  // Sembako Eceran
  { nama: "Beras Premium 1 Kg", kategori: "sembako", poin_dibutuhkan: 150, stok: 999 },
  { nama: "Minyak Goreng 1 Liter", kategori: "sembako", poin_dibutuhkan: 180, stok: 999 },
  { nama: "Gula Pasir 1 Kg", kategori: "sembako", poin_dibutuhkan: 160, stok: 999 },
  { nama: "Telur Ayam 1 Kg", kategori: "sembako", poin_dibutuhkan: 280, stok: 999 },
  // Paket Sembako
  { nama: "Paket Hemat (Beras 2Kg, Minyak 1L, Sabun)", kategori: "paket", poin_dibutuhkan: 550, stok: 999 },
  { nama: "Paket Keluarga (Beras 5Kg, Minyak 2L, Sabun, Gula)", kategori: "paket", poin_dibutuhkan: 1300, stok: 999 },
];

const KAT_MAP: Record<string, { l: string; i: string }> = {
  "uang": { l: "Tarik Tunai", i: "💵" },
  "pulsa": { l: "Pulsa HP", i: "📱" },
  "ewallet": { l: "Topup E-Wallet", i: "💳" },
  "sembako": { l: "Sembako Eceran", i: "🛒" },
  "paket": { l: "Paket Sembako", i: "📦" },
  "riwayat": { l: "Riwayat", i: "📋" }
};

export default function TukarPoinPage() {
  const [hadiahList, setHadiahList] = useState<Hadiah[]>([]);
  const [selectedKK, setSelectedKK] = useState<{ id: string; nama: string; rt: string } | null>(null);
  const [saldo, setSaldo] = useState<Saldo | null>(null);
  const [riwayat, setRiwayat] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [toast, setToast] = useState({ msg: "", type: "success" });
  const [tab, setTab] = useState<string>("uang");
  const [confirm, setConfirm] = useState<Hadiah | null>(null);
  const [scanning, setScanning] = useState(false);
  const [manualNfcId, setManualNfcId] = useState("");
  
  const nfcRef = useRef<any>(null);

  function showToast(msg: string, type = "success") {
    setToast({ msg, type });
    setTimeout(() => setToast({ msg: "", type: "success" }), 4000);
  }

  async function fetchHadiah() {
    if (!isSupabaseReady()) {
      setHadiahList(ATM_ITEMS);
      return;
    }
    const { data } = await supabase.from("katalog_hadiah").select("*").eq("aktif", true).order("poin_dibutuhkan");
    const dbHadiah = data ? (data as Hadiah[]) : [];
    
    // Gabung DB dengan ATM_ITEMS, jangan duplikat
    const existingNames = dbHadiah.map((h) => h.nama);
    const combined = [...dbHadiah, ...ATM_ITEMS.filter(h => !existingNames.includes(h.nama))];
    setHadiahList(combined);
  }

  async function fetchSaldo(kkId: string) {
    if (!isSupabaseReady() || !kkId) return;
    const { data } = await supabase.from("saldo_poin").select("*").eq("kk_id", kkId).single();
    setSaldo(data as Saldo || { total_poin: 0, total_setor_kg: 0 });
    const { data: r } = await supabase.from("penukaran_poin").select("*,katalog_hadiah(nama,kategori)").eq("kk_id", kkId).order("tgl_request", { ascending: false });
    if (r) setRiwayat(r);
  }

  useEffect(() => { fetchHadiah(); }, []);

  useEffect(() => {
    if (selectedKK) fetchSaldo(selectedKK.id);
    else setSaldo(null);
  }, [selectedKK]);

  async function nfcAbsensi(nfcId: string) {
    const id = nfcId.replace(/:/g, "").toUpperCase();
    const { data: anggota } = await supabase.from("anggota_kk").select("kk_id, nama, nfc_id").eq("nfc_id", id).single();
    
    if (!anggota) return showToast(`❌ Kartu tidak terdaftar! (${id})`, "error");
    
    const { data: kk } = await supabase.from("keluarga").select("id,kepala_keluarga,rt").eq("id", anggota.kk_id).single();
    if (kk) {
      setSelectedKK({ id: kk.id, nama: kk.kepala_keluarga, rt: kk.rt });
      showToast(`👋 Halo ${anggota.nama}! Selamat datang di ATM Poin.`);
    }
  }

  async function startNFC() {
    if (!("NDEFReader" in window)) return showToast("Browser tidak support NFC. Gunakan Chrome Android.", "error");
    try {
      const ndef = new (window as any).NDEFReader();
      nfcRef.current = ndef;
      await ndef.scan();
      setScanning(true);
      showToast("📡 NFC siap! Silakan tempelkan kartu Warga/e-KTP...");
      ndef.addEventListener("reading", ({ serialNumber }: any) => nfcAbsensi(serialNumber));
    } catch { 
      showToast("Gagal aktifkan NFC", "error");
      setScanning(false);
    }
  }

  function stopNFC() {
    try { nfcRef.current?.stop?.(); } catch {}
    setScanning(false);
    showToast("Pemindai NFC dimatikan");
  }

  async function requestTukar(h: Hadiah) {
    if (!selectedKK) return showToast("Tap e-KTP / Kartu Warga dulu!", "error");
    if (!saldo || saldo.total_poin < h.poin_dibutuhkan) return showToast("Poin tidak cukup!", "error");
    setLoading(true);
    
    let hadiahId = h.id;
    if (!hadiahId) {
       // Buat data sementara di DB kalau belum ada
       const { data: inserted } = await supabase.from("katalog_hadiah").insert({
           nama: h.nama,
           kategori: h.kategori,
           poin_dibutuhkan: h.poin_dibutuhkan,
           stok: h.stok,
           aktif: true
       }).select("id").single();
       if (inserted) hadiahId = inserted.id;
    }
    
    if (hadiahId) {
      await supabase.from("penukaran_poin").insert({ kk_id: selectedKK.id, hadiah_id: hadiahId, poin_dipakai: h.poin_dibutuhkan, status: "pending" });
      await supabase.from("saldo_poin").update({ total_poin: saldo.total_poin - h.poin_dibutuhkan }).eq("kk_id", selectedKK.id);
      showToast(`✅ Transaksi ${h.nama} berhasil diproses!`);
    } else {
      showToast("Gagal mencatat transaksi katalog, silakan coba lagi.", "error");
    }
    
    setConfirm(null);
    setLoading(false);
    fetchSaldo(selectedKK.id);
  }

  return (
    <div style={{ minHeight: "100vh", background: "#FAF8F3", color: "#1C3A2B", fontFamily: "'Segoe UI',system-ui,sans-serif", paddingBottom: 80 }}>
      {/* Toast */}
      {toast.msg && (
        <div style={{ position: "fixed", top: 20, left: "50%", transform: "translateX(-50%)", background: toast.type === "error" ? "#8B2020" : "#2F8F4E", color: "white", padding: "16px 32px", borderRadius: 99, zIndex: 999, fontSize: 14, fontWeight: 800, boxShadow: "0 10px 40px rgba(0,0,0,0.2)", animation: "float-heroic 4s infinite" }}>{toast.msg}</div>
      )}

      {/* Confirm modal */}
      {confirm && (
        <div style={{ position: "fixed", inset: 0, background: "rgba(28,58,43,0.6)", backdropFilter: "blur(8px)", zIndex: 100, display: "flex", alignItems: "center", justifyContent: "center", padding: 20 }}>
          <div style={{ background: "white", border: "1px solid rgba(47,143,78,0.2)", borderRadius: 24, padding: "40px 32px", maxWidth: 420, width: "100%", textAlign: "center", color: "#1C3A2B", boxShadow: "0 20px 60px rgba(47,143,78,0.15)" }}>
            <div style={{ fontSize: 48, marginBottom: 16 }}>{KAT_MAP[confirm.kategori]?.i || "🎁"}</div>
            <h3 style={{ margin: "0 0 12px", fontSize: 22, fontWeight: 900 }}>Konfirmasi Transaksi</h3>
            <p style={{ color: "#2D5A40", margin: "0 0 8px", fontSize: 16, fontWeight: 700 }}>{confirm.nama}</p>
            <div style={{ background: "rgba(47,143,78,0.06)", padding: "16px", borderRadius: 16, margin: "24px 0", border: "1px solid rgba(47,143,78,0.1)" }}>
              <p style={{ color: "#1C3A2B", fontWeight: 900, fontSize: 32, margin: "0 0 4px" }}>-{confirm.poin_dibutuhkan}</p>
              <p style={{ color: "#4A7C59", fontSize: 12, margin: 0, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.1em" }}>Poin Eco-Digital</p>
            </div>
            <p style={{ color: "#4A7C59", fontSize: 13, margin: "0 0 32px", fontWeight: 600 }}>Sisa Saldo Poin: <strong style={{ color: "#1C3A2B" }}>{(saldo?.total_poin || 0) - confirm.poin_dibutuhkan}</strong></p>
            <div style={{ display: "flex", gap: 12 }}>
              <button onClick={() => setConfirm(null)} style={{ flex: 1, padding: "16px", borderRadius: 14, border: "2px solid rgba(28,58,43,0.15)", background: "transparent", color: "#1C3A2B", fontSize: 14, fontWeight: 700, cursor: "pointer" }}>Batal</button>
              <button onClick={() => requestTukar(confirm)} disabled={loading} style={{ flex: 2, padding: "16px", borderRadius: 14, border: "none", background: "linear-gradient(135deg, #2F8F4E, #4FBF7E)", color: "white", fontSize: 14, fontWeight: 800, cursor: loading ? "not-allowed" : "pointer", boxShadow: "0 8px 24px rgba(47,143,78,0.2)" }}>
                {loading ? "Memproses..." : "TUKAR SEKARANG"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Header HEROIC - Light Theme */}
      <header style={{ background: "rgba(250,248,243,0.9)", backdropFilter: "blur(12px)", borderBottom: "1px solid rgba(47,143,78,0.15)", padding: "20px 24px", position: "sticky", top: 0, zIndex: 10, display: "flex", alignItems: "center", gap: 16 }}>
        <a href="/" style={{ color: "#4A7C59", textDecoration: "none", fontSize: 14, fontWeight: 700 }}>← Web Publik</a>
        <div style={{ width: 1, height: 24, background: "rgba(79,191,126,0.3)" }}></div>
        <div>
          <div style={{ fontWeight: 900, fontSize: 18, color: "#1C3A2B", letterSpacing: "-0.02em" }}>ATM POIN ECO-DIGITAL</div>
          <div style={{ fontSize: 11, color: "#4FBF7E", textTransform: "uppercase", letterSpacing: "0.15em", fontWeight: 700, marginTop: 2 }}>Ciburial Smart Village</div>
        </div>
      </header>

      <div style={{ maxWidth: 800, margin: "0 auto", padding: "32px 20px" }}>
        
        {/* Identitas Kiosk NFC Style */}
        <div style={{ background: "white", border: "1px solid rgba(47,143,78,0.15)", borderRadius: 24, padding: "32px", marginBottom: 32, boxShadow: "0 10px 40px rgba(0,0,0,0.05)", position: "relative", overflow: "hidden" }}>
          
          <div style={{ display: "flex", flexWrap: "wrap", gap: 24 }}>
            {/* Kolom Kiri: NFC Tap Area */}
            <div style={{ flex: "1 1 300px", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", borderRight: "1px solid rgba(47,143,78,0.1)", paddingRight: 24 }}>
               <label style={{ fontSize: 11, fontWeight: 800, color: "#4A7C59", letterSpacing: "0.1em", textTransform: "uppercase", display: "block", marginBottom: 16, textAlign: "center" }}>Identitas Kartu Keluarga</label>
               
               {/* NFC Anim */}
               <div style={{ position:"relative", width:120, height:120, margin:"0 auto 24px" }}>
                 {scanning && <>
                   <div style={{ position:"absolute", inset:0, borderRadius:"50%", border:"2px solid rgba(47,143,78,0.4)", animation:"pulse-ring 2.2s ease-out infinite" }} />
                   <div style={{ position:"absolute", inset:0, borderRadius:"50%", border:"1px solid rgba(47,143,78,0.2)", animation:"pulse-ring2 2.2s ease-out infinite 0.5s" }} />
                 </>}
                 <div style={{
                   position:"absolute", inset:0, borderRadius:"50%",
                   background: scanning ? "rgba(47,143,78,0.08)" : "rgba(250,248,243,1)",
                   border:`2px solid ${scanning ? "rgba(47,143,78,0.6)" : "rgba(47,143,78,0.2)"}`,
                   display:"flex", alignItems:"center", justifyContent:"center",
                   transition:"all 0.5s",
                   boxShadow: scanning ? "0 0 24px rgba(47,143,78,0.1)" : "none",
                 }}>
                    <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke={scanning ? "#2F8F4E" : "rgba(47,143,78,0.4)"} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" style={{ transition:"stroke 0.5s" }}>
                      <path d="M2 7V5a2 2 0 0 1 2-2h2"/><path d="M2 17v2a2 2 0 0 0 2 2h2"/>
                      <path d="M22 7V5a2 2 0 0 0-2-2h-2"/><path d="M22 17v2a2 2 0 0 1-2 2h-2"/>
                      <rect x="7" y="7" width="10" height="10" rx="1.5"/>
                    </svg>
                 </div>
               </div>

               <div style={{ fontSize:13, fontWeight:600, letterSpacing:".02em", color: scanning ? "#2F8F4E" : "#4A7C59", marginBottom:16, transition:"color 0.4s", textAlign: "center" }}>
                 {scanning ? "Tempelkan e-KTP ke HP..." : "Tap NFC Belum Aktif"}
               </div>

               <button onClick={scanning ? stopNFC : startNFC} 
                 style={{
                   width:"100%", padding:"12px 24px", borderRadius:12,
                   background: scanning ? "rgba(200,50,50,0.05)" : "linear-gradient(135deg, #2F8F4E, #4FBF7E)",
                   color: scanning ? "#D32F2F" : "#fff",
                   border: scanning ? "1px solid rgba(220,50,50,0.3)" : "none",
                   fontSize:13, fontWeight:800, cursor: "pointer",
                   boxShadow: scanning ? "none" : "0 8px 24px rgba(47,143,78,0.25)",
                 }}>
                 {scanning ? "Stop Scanning" : "Aktifkan NFC e-KTP"}
               </button>

               {/* Manual Input Fallback */}
               <div style={{ display: "flex", gap: 8, marginTop: 16, width: "100%" }}>
                 <input type="text" placeholder="Atau ketik ID..." value={manualNfcId} onChange={e => setManualNfcId(e.target.value)}
                  style={{ flex: 1, padding: "10px", borderRadius: 8, border: "1px solid rgba(47,143,78,0.2)", fontSize: 12, outline: "none", background: "#FAF8F3" }} />
                 <button onClick={() => { if(manualNfcId) { nfcAbsensi(manualNfcId); setManualNfcId(""); } }}
                  style={{ padding: "10px 16px", borderRadius: 8, background: "rgba(47,143,78,0.1)", border: "1px solid rgba(47,143,78,0.2)", color: "#1C3A2B", fontSize: 12, fontWeight: 700, cursor: "pointer" }}>Cek</button>
               </div>
            </div>

            {/* Kolom Kanan: Saldo Info */}
            <div style={{ flex: "1 1 300px", display: "flex", flexDirection: "column", justifyContent: "center" }}>
               {selectedKK ? (
                 <div style={{ animation: "slideIn 0.4s ease" }}>
                   <div style={{ background: "linear-gradient(135deg, rgba(47,143,78,0.08), rgba(79,191,126,0.03))", padding: "20px", borderRadius: 16, border: "1px solid rgba(47,143,78,0.15)", marginBottom: 16 }}>
                     <div style={{ fontSize: 11, color: "#4A7C59", fontWeight: 800, letterSpacing: "0.1em", marginBottom: 6 }}>NAMA KEPALA KELUARGA</div>
                     <div style={{ fontSize: 24, fontWeight: 900, color: "#1C3A2B", lineHeight: 1.2 }}>{selectedKK.nama}</div>
                     <div style={{ fontSize: 13, color: "#4A7C59", fontWeight: 600, marginTop: 4 }}>Warga RT {selectedKK.rt}</div>
                   </div>

                   <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
                     <div style={{ background: "white", padding: "16px", borderRadius: 16, border: "1px solid rgba(47,143,78,0.15)", boxShadow: "0 4px 12px rgba(0,0,0,0.03)" }}>
                       <div style={{ fontSize: 10, color: "#4A7C59", fontWeight: 800, letterSpacing: "0.1em", marginBottom: 6 }}>SALDO POIN</div>
                       <div style={{ fontSize: "clamp(24px, 4vw, 32px)", fontWeight: 900, color: "#2F8F4E", lineHeight: 1 }}>{saldo?.total_poin?.toLocaleString("id-ID") || 0}</div>
                       <div style={{ fontSize: 11, color: "#6B7C6D", fontWeight: 600, marginTop: 6 }}>≈ Rp {((saldo?.total_poin || 0) * 100).toLocaleString("id-ID")}</div>
                     </div>
                     <div style={{ background: "white", padding: "16px", borderRadius: 16, border: "1px solid rgba(47,143,78,0.15)", boxShadow: "0 4px 12px rgba(0,0,0,0.03)" }}>
                       <div style={{ fontSize: 10, color: "#4A7C59", fontWeight: 800, letterSpacing: "0.1em", marginBottom: 6 }}>KONTRIBUSI</div>
                       <div style={{ fontSize: "clamp(24px, 4vw, 32px)", fontWeight: 900, color: "#1C3A2B", lineHeight: 1 }}>{Number(saldo?.total_setor_kg || 0).toFixed(1)} <span style={{ fontSize: 14, color: "#A8B5A9" }}>kg</span></div>
                       <div style={{ fontSize: 11, color: "#6B7C6D", fontWeight: 600, marginTop: 6 }}>Sampah Terdaur</div>
                     </div>
                   </div>
                 </div>
               ) : (
                 <div style={{ padding: "40px 20px", textAlign: "center", background: "#FAF8F3", border: "2px dashed rgba(47,143,78,0.2)", borderRadius: 16, color: "rgba(47,143,78,0.6)", fontSize: 14, fontWeight: 700, height: "100%", display: "flex", alignItems: "center", justifyContent: "center" }}>
                   <p>Tap e-KTP di samping<br/>untuk membuka ATM Poin</p>
                 </div>
               )}
            </div>
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="hide-scroll" style={{ display: "flex", gap: 12, overflowX: "auto", paddingBottom: 16, marginBottom: 24 }}>
          {Object.entries(KAT_MAP).map(([key, val]) => (
            <button key={key} onClick={() => setTab(key)} 
              style={{ padding: "14px 20px", borderRadius: 99, fontSize: 13, fontWeight: 800, border: `1.5px solid ${tab === key ? "#2F8F4E" : "rgba(47,143,78,0.15)"}`, cursor: "pointer", background: tab === key ? "linear-gradient(135deg, #2F8F4E, #4FBF7E)" : "white", color: tab === key ? "white" : "#2D5A40", whiteSpace: "nowrap", transition: "all 0.3s", display: "flex", alignItems: "center", gap: 8, boxShadow: tab === key ? "0 8px 24px rgba(47,143,78,0.25)" : "0 2px 8px rgba(0,0,0,0.02)" }}>
              <span style={{ fontSize: 16 }}>{val.i}</span> {val.l}
            </button>
          ))}
        </div>

        {/* Catalog List */}
        {tab !== "riwayat" && (
          <div>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill,minmax(250px,1fr))", gap: 16 }}>
              {hadiahList.filter(h => h.kategori === tab).map(h => {
                const cukup = saldo && saldo.total_poin >= h.poin_dibutuhkan;
                return (
                  <div key={h.id || h.nama} style={{ background: "white", borderRadius: 20, padding: 24, border: `1.5px solid ${cukup ? "rgba(47,143,78,0.3)" : "rgba(47,143,78,0.08)"}`, boxShadow: cukup ? "0 10px 30px rgba(47,143,78,0.1)" : "0 4px 12px rgba(0,0,0,0.03)", transition: "transform 0.3s" }}>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 16 }}>
                      <div style={{ fontSize: 32 }}>{KAT_MAP[h.kategori]?.i || "🎁"}</div>
                      <div style={{ background: cukup ? "rgba(47,143,78,0.1)" : "rgba(0,0,0,0.04)", padding: "6px 12px", borderRadius: 99, fontSize: 11, fontWeight: 800, color: cukup ? "#2F8F4E" : "#A8B5A9", border: `1px solid ${cukup ? "rgba(47,143,78,0.2)" : "transparent"}` }}>
                        {h.poin_dibutuhkan} Poin
                      </div>
                    </div>
                    <div style={{ fontWeight: 800, fontSize: 16, color: "#1C3A2B", marginBottom: 8, lineHeight: 1.4 }}>{h.nama}</div>
                    <div style={{ fontSize: 12, color: "#6B7C6D", marginBottom: 20, fontWeight: 600 }}>Setara Rp {(h.poin_dibutuhkan * 100).toLocaleString("id-ID")}</div>
                    <button onClick={() => { if (!selectedKK) return showToast("Tap e-KTP dulu di Kiosk!", "error"); if (cukup) setConfirm(h); else showToast("Poin tidak cukup!", "error"); }}
                      style={{ width: "100%", padding: "12px", borderRadius: 12, border: "none", background: cukup ? "linear-gradient(135deg, #2F8F4E, #4FBF7E)" : "#F5F0E8", color: cukup ? "white" : "#A8B5A9", fontSize: 13, fontWeight: 800, cursor: cukup ? "pointer" : "not-allowed", transition: "all 0.3s", boxShadow: cukup ? "0 8px 24px rgba(47,143,78,0.3)" : "none" }}>
                      {cukup ? "TUKAR POIN" : "POIN KURANG"}
                    </button>
                  </div>
                );
              })}
            </div>
            {hadiahList.filter(h => h.kategori === tab).length === 0 && (
              <div style={{ textAlign: "center", padding: 60, color: "#6B7C6D", background: "white", borderRadius: 24, border: "1px dashed rgba(47,143,78,0.2)", fontWeight: 700 }}>
                Katalog belum tersedia untuk kategori ini.
              </div>
            )}
          </div>
        )}

        {/* Riwayat Tab */}
        {tab === "riwayat" && (
          <div>
            {!selectedKK ? (
              <div style={{ textAlign: "center", padding: 60, color: "#6B7C6D", background: "white", borderRadius: 24, border: "1px dashed rgba(47,143,78,0.2)", fontWeight: 700 }}>Tap e-KTP dulu untuk lihat riwayat</div>
            ) : riwayat.length === 0 ? (
              <div style={{ textAlign: "center", padding: 60, color: "#6B7C6D", background: "white", borderRadius: 24, border: "1px dashed rgba(47,143,78,0.2)", fontWeight: 700 }}>Belum ada riwayat penukaran</div>
            ) : (
              <div style={{ background: "white", borderRadius: 24, border: "1px solid rgba(47,143,78,0.15)", overflow: "hidden", boxShadow: "0 10px 40px rgba(0,0,0,0.03)" }}>
                {riwayat.map((r, i) => {
                  const SC: Record<string, string> = { pending: "#D4AC5A", diproses: "#4A7C59", selesai: "#4FBF7E", ditolak: "#8B2020" };
                  return (
                    <div key={r.id} style={{ padding: "20px 24px", borderBottom: i < riwayat.length - 1 ? "1px solid rgba(47,143,78,0.08)" : "none", display: "flex", alignItems: "center", gap: 16 }}>
                      <div style={{ fontSize: 28 }}>{KAT_MAP[r.katalog_hadiah?.kategori]?.i || "🎁"}</div>
                      <div style={{ flex: 1 }}>
                        <div style={{ fontWeight: 800, fontSize: 15, color: "#1C3A2B", marginBottom: 4 }}>{r.katalog_hadiah?.nama || r.nama_item_sementara || "Hadiah Poin"}</div>
                        <div style={{ fontSize: 12, color: "#6B7C6D", fontWeight: 600 }}>{r.poin_dipakai} Poin · {new Date(r.tgl_request).toLocaleDateString("id-ID")}</div>
                      </div>
                      <div style={{ background: SC[r.status] + "15", color: SC[r.status], border: `1px solid ${SC[r.status]}40`, borderRadius: 99, padding: "6px 16px", fontSize: 11, fontWeight: 800, textTransform: "uppercase", letterSpacing: "0.05em" }}>{r.status}</div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}
      </div>

      <style>{`
        @keyframes pulse-ring {
          0%  { transform: scale(0.85); opacity: 0.75; }
          100% { transform: scale(1.7);  opacity: 0; }
        }
        @keyframes pulse-ring2 {
          0%  { transform: scale(0.85); opacity: 0.45; }
          100% { transform: scale(2.3);  opacity: 0; }
        }
        @keyframes slideIn {
          from { opacity: 0; transform: translateY(10px); }
          to { opacity: 1; transform: translateY(0); }
        }
      `}</style>
    </div>
  );
}
