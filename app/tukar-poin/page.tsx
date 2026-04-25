"use client";
import { useState, useEffect } from "react";
import { supabase, isSupabaseReady } from "@/lib/supabase";

interface Hadiah { id: string; nama: string; kategori: string; poin_dibutuhkan: number; stok: number; }
interface Saldo { total_poin: number; total_setor_kg: number; }

const ATM_ITEMS = [
  // Tarik Tunai
  { nama: "Tarik Tunai Rp 10.000", kategori: "uang", poin_dibutuhkan: 100, stok: 999, aktif: true },
  { nama: "Tarik Tunai Rp 20.000", kategori: "uang", poin_dibutuhkan: 200, stok: 999, aktif: true },
  { nama: "Tarik Tunai Rp 50.000", kategori: "uang", poin_dibutuhkan: 500, stok: 999, aktif: true },
  { nama: "Tarik Tunai Rp 100.000", kategori: "uang", poin_dibutuhkan: 1000, stok: 999, aktif: true },
  // Pulsa
  { nama: "Pulsa Rp 5.000", kategori: "pulsa", poin_dibutuhkan: 50, stok: 999, aktif: true },
  { nama: "Pulsa Rp 10.000", kategori: "pulsa", poin_dibutuhkan: 100, stok: 999, aktif: true },
  { nama: "Pulsa Rp 25.000", kategori: "pulsa", poin_dibutuhkan: 250, stok: 999, aktif: true },
  { nama: "Pulsa Rp 50.000", kategori: "pulsa", poin_dibutuhkan: 500, stok: 999, aktif: true },
  // E-Wallet
  { nama: "Topup E-Wallet Rp 10.000", kategori: "ewallet", poin_dibutuhkan: 100, stok: 999, aktif: true },
  { nama: "Topup E-Wallet Rp 20.000", kategori: "ewallet", poin_dibutuhkan: 200, stok: 999, aktif: true },
  { nama: "Topup E-Wallet Rp 50.000", kategori: "ewallet", poin_dibutuhkan: 500, stok: 999, aktif: true },
  // Sembako Eceran
  { nama: "Beras Premium 1 Kg", kategori: "sembako", poin_dibutuhkan: 150, stok: 999, aktif: true },
  { nama: "Minyak Goreng 1 Liter", kategori: "sembako", poin_dibutuhkan: 180, stok: 999, aktif: true },
  { nama: "Gula Pasir 1 Kg", kategori: "sembako", poin_dibutuhkan: 160, stok: 999, aktif: true },
  { nama: "Telur Ayam 1 Kg", kategori: "sembako", poin_dibutuhkan: 280, stok: 999, aktif: true },
  // Paket Sembako
  { nama: "Paket Hemat (Beras 2Kg, Minyak 1L, Sabun)", kategori: "paket", poin_dibutuhkan: 550, stok: 999, aktif: true },
  { nama: "Paket Keluarga (Beras 5Kg, Minyak 2L, Sabun, Gula)", kategori: "paket", poin_dibutuhkan: 1300, stok: 999, aktif: true },
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
  const [hadiah, setHadiah] = useState<Hadiah[]>([]);
  const [kkList, setKkList] = useState<any[]>([]);
  const [selectedKK, setSelectedKK] = useState("");
  const [saldo, setSaldo] = useState<Saldo | null>(null);
  const [riwayat, setRiwayat] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [toast, setToast] = useState({ msg: "", type: "success" });
  const [tab, setTab] = useState<string>("uang");
  const [confirm, setConfirm] = useState<Hadiah | null>(null);

  function showToast(msg: string, type = "success") {
    setToast({ msg, type });
    setTimeout(() => setToast({ msg: "", type: "success" }), 4000);
  }

  async function fetchHadiah() {
    if (!isSupabaseReady()) return;
    const { data } = await supabase.from("katalog_hadiah").select("*").eq("aktif", true).order("poin_dibutuhkan");
    
    const existingNames = (data || []).map((h: any) => h.nama);
    const toInsert = ATM_ITEMS.filter(item => !existingNames.includes(item.nama));
    
    if (toInsert.length > 0) {
      await supabase.from("katalog_hadiah").insert(toInsert);
      const { data: newData } = await supabase.from("katalog_hadiah").select("*").eq("aktif", true).order("poin_dibutuhkan");
      if (newData) setHadiah(newData as Hadiah[]);
    } else if (data) {
      setHadiah(data as Hadiah[]);
    }
  }

  async function fetchKK() {
    if (!isSupabaseReady()) return;
    const { data } = await supabase.from("keluarga").select("id,kepala_keluarga,rt").order("kepala_keluarga");
    if (data) setKkList(data);
  }

  async function fetchSaldo(kkId: string) {
    if (!isSupabaseReady() || !kkId) return;
    const { data } = await supabase.from("saldo_poin").select("*").eq("kk_id", kkId).single();
    setSaldo(data as Saldo || { total_poin: 0, total_setor_kg: 0 });
    const { data: r } = await supabase.from("penukaran_poin").select("*,katalog_hadiah(nama,kategori)").eq("kk_id", kkId).order("tgl_request", { ascending: false });
    if (r) setRiwayat(r);
  }

  useEffect(() => { fetchHadiah(); fetchKK(); }, []);
  useEffect(() => { if (selectedKK) fetchSaldo(selectedKK); else setSaldo(null); }, [selectedKK]);

  async function requestTukar(h: Hadiah) {
    if (!selectedKK) return showToast("Pilih nama KK dulu!", "error");
    if (!saldo || saldo.total_poin < h.poin_dibutuhkan) return showToast("Poin tidak cukup!", "error");
    setLoading(true);
    await supabase.from("penukaran_poin").insert({ kk_id: selectedKK, hadiah_id: h.id, poin_dipakai: h.poin_dibutuhkan, status: "pending" });
    await supabase.from("saldo_poin").update({ total_poin: saldo.total_poin - h.poin_dibutuhkan }).eq("kk_id", selectedKK);
    showToast(`✅ Permintaan ${h.nama} berhasil masuk sistem!`);
    setConfirm(null);
    setLoading(false);
    fetchSaldo(selectedKK);
  }

  return (
    <div style={{ minHeight: "100vh", background: "#0D1B13", color: "#FAF8F3", fontFamily: "'Segoe UI',system-ui,sans-serif", paddingBottom: 80 }}>
      {/* Toast */}
      {toast.msg && (
        <div style={{ position: "fixed", top: 20, left: "50%", transform: "translateX(-50%)", background: toast.type === "error" ? "#8B2020" : "#2F8F4E", color: "white", padding: "16px 32px", borderRadius: 99, zIndex: 999, fontSize: 14, fontWeight: 800, boxShadow: "0 10px 40px rgba(0,0,0,0.5)", animation: "float-heroic 4s infinite" }}>{toast.msg}</div>
      )}

      {/* Confirm modal */}
      {confirm && (
        <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.85)", backdropFilter: "blur(12px)", zIndex: 100, display: "flex", alignItems: "center", justifyContent: "center", padding: 20 }}>
          <div style={{ background: "rgba(255,254,249,0.95)", border: "2px solid #2F8F4E", borderRadius: 24, padding: "40px 32px", maxWidth: 420, width: "100%", textAlign: "center", color: "#1C3A2B", boxShadow: "0 20px 60px rgba(47,143,78,0.2)" }}>
            <div style={{ fontSize: 48, marginBottom: 16 }}>{KAT_MAP[confirm.kategori]?.i || "🎁"}</div>
            <h3 style={{ margin: "0 0 12px", fontSize: 22, fontWeight: 900 }}>Konfirmasi Transaksi</h3>
            <p style={{ color: "#2D5A40", margin: "0 0 8px", fontSize: 16, fontWeight: 700 }}>{confirm.nama}</p>
            <div style={{ background: "rgba(47,143,78,0.1)", padding: "16px", borderRadius: 16, margin: "24px 0" }}>
              <p style={{ color: "#1C3A2B", fontWeight: 900, fontSize: 32, margin: "0 0 4px" }}>-{confirm.poin_dibutuhkan}</p>
              <p style={{ color: "#4A7C59", fontSize: 12, margin: 0, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.1em" }}>Poin Eco-Digital</p>
            </div>
            <p style={{ color: "#4A7C59", fontSize: 13, margin: "0 0 32px", fontWeight: 600 }}>Sisa Saldo Poin: <strong style={{ color: "#1C3A2B" }}>{(saldo?.total_poin || 0) - confirm.poin_dibutuhkan}</strong></p>
            <div style={{ display: "flex", gap: 12 }}>
              <button onClick={() => setConfirm(null)} style={{ flex: 1, padding: "16px", borderRadius: 14, border: "2px solid rgba(28,58,43,0.2)", background: "transparent", color: "#1C3A2B", fontSize: 14, fontWeight: 700, cursor: "pointer" }}>Batal</button>
              <button onClick={() => requestTukar(confirm)} disabled={loading} style={{ flex: 2, padding: "16px", borderRadius: 14, border: "none", background: "linear-gradient(135deg, #2F8F4E, #4FBF7E)", color: "white", fontSize: 14, fontWeight: 800, cursor: loading ? "not-allowed" : "pointer", boxShadow: "0 8px 24px rgba(47,143,78,0.3)" }}>
                {loading ? "Memproses..." : "TUKAR SEKARANG"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Header HEROIC */}
      <header style={{ background: "rgba(13,27,19,0.9)", backdropFilter: "blur(12px)", borderBottom: "1px solid rgba(47,143,78,0.2)", padding: "20px 24px", position: "sticky", top: 0, zIndex: 10, display: "flex", alignItems: "center", gap: 16 }}>
        <a href="/" style={{ color: "#4FBF7E", textDecoration: "none", fontSize: 14, fontWeight: 700 }}>← Web Publik</a>
        <div style={{ width: 1, height: 24, background: "rgba(79,191,126,0.3)" }}></div>
        <div>
          <div style={{ fontWeight: 900, fontSize: 18, color: "#FAF8F3", letterSpacing: "-0.02em" }}>ATM POIN ECO-DIGITAL</div>
          <div style={{ fontSize: 11, color: "#4FBF7E", textTransform: "uppercase", letterSpacing: "0.15em", fontWeight: 700, marginTop: 2 }}>Ciburial Smart Village</div>
        </div>
      </header>

      <div style={{ maxWidth: 800, margin: "0 auto", padding: "32px 20px" }}>
        
        {/* Identitas & Saldo Poin */}
        <div style={{ background: "linear-gradient(135deg, rgba(47,143,78,0.1), rgba(28,58,43,0.4))", border: "1px solid rgba(79,191,126,0.2)", borderRadius: 24, padding: "32px", marginBottom: 32, boxShadow: "0 20px 60px rgba(0,0,0,0.5)", position: "relative", overflow: "hidden" }}>
          <div style={{ position: "absolute", top: -50, right: -50, width: 200, height: 200, background: "radial-gradient(circle, rgba(79,191,126,0.15) 0%, transparent 70%)", borderRadius: "50%", zIndex: 0 }}></div>
          
          <div style={{ position: "relative", zIndex: 1 }}>
            <label style={{ fontSize: 11, fontWeight: 800, color: "#4FBF7E", letterSpacing: "0.1em", textTransform: "uppercase", display: "block", marginBottom: 12 }}>Identitas Akun Kartu Keluarga</label>
            <select value={selectedKK} onChange={e => setSelectedKK(e.target.value)}
              style={{ width: "100%", padding: "16px 20px", borderRadius: 16, border: "1.5px solid rgba(79,191,126,0.3)", fontSize: 16, fontWeight: 700, background: "rgba(0,0,0,0.4)", color: "white", outline: "none", appearance: "none", marginBottom: 24 }}>
              <option value="" style={{ color: "#1C3A2B" }}>-- Pilih Nama Kepala Keluarga --</option>
              {kkList.map(k => <option key={k.id} value={k.id} style={{ color: "#1C3A2B" }}>{k.kepala_keluarga} (RT {k.rt})</option>)}
            </select>

            {saldo ? (
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 20 }}>
                <div style={{ background: "rgba(0,0,0,0.4)", padding: "20px", borderRadius: 16, border: "1px solid rgba(79,191,126,0.2)" }}>
                  <div style={{ fontSize: 11, color: "#4FBF7E", fontWeight: 800, letterSpacing: "0.1em", marginBottom: 8 }}>SALDO POIN</div>
                  <div style={{ fontSize: "clamp(32px, 5vw, 44px)", fontWeight: 900, color: "#FAF8F3", lineHeight: 1 }}>{saldo.total_poin.toLocaleString("id-ID")}</div>
                  <div style={{ fontSize: 13, color: "rgba(250,248,243,0.6)", fontWeight: 600, marginTop: 8 }}>Setara Rp {(saldo.total_poin * 100).toLocaleString("id-ID")}</div>
                </div>
                <div style={{ background: "rgba(0,0,0,0.4)", padding: "20px", borderRadius: 16, border: "1px solid rgba(79,191,126,0.2)" }}>
                  <div style={{ fontSize: 11, color: "#4FBF7E", fontWeight: 800, letterSpacing: "0.1em", marginBottom: 8 }}>KONTRIBUSI SAMPAH</div>
                  <div style={{ fontSize: "clamp(32px, 5vw, 44px)", fontWeight: 900, color: "#FAF8F3", lineHeight: 1 }}>{Number(saldo.total_setor_kg).toFixed(1)} <span style={{ fontSize: 18, color: "rgba(250,248,243,0.5)" }}>kg</span></div>
                  <div style={{ fontSize: 13, color: "rgba(250,248,243,0.6)", fontWeight: 600, marginTop: 8 }}>Pahlawan Lingkungan 🌍</div>
                </div>
              </div>
            ) : (
              <div style={{ padding: "20px", textAlign: "center", border: "2px dashed rgba(79,191,126,0.2)", borderRadius: 16, color: "rgba(79,191,126,0.5)", fontSize: 14, fontWeight: 700 }}>
                Pilih KK untuk melihat saldo
              </div>
            )}
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="hide-scroll" style={{ display: "flex", gap: 12, overflowX: "auto", paddingBottom: 16, marginBottom: 24 }}>
          {Object.entries(KAT_MAP).map(([key, val]) => (
            <button key={key} onClick={() => setTab(key)} 
              style={{ padding: "14px 20px", borderRadius: 99, fontSize: 13, fontWeight: 800, border: `1.5px solid ${tab === key ? "#2F8F4E" : "rgba(79,191,126,0.2)"}`, cursor: "pointer", background: tab === key ? "linear-gradient(135deg, #2F8F4E, #4FBF7E)" : "transparent", color: tab === key ? "white" : "#4FBF7E", whiteSpace: "nowrap", transition: "all 0.3s", display: "flex", alignItems: "center", gap: 8 }}>
              <span style={{ fontSize: 16 }}>{val.i}</span> {val.l}
            </button>
          ))}
        </div>

        {/* Catalog List */}
        {tab !== "riwayat" && (
          <div>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill,minmax(250px,1fr))", gap: 16 }}>
              {hadiah.filter(h => h.kategori === tab).map(h => {
                const cukup = saldo && saldo.total_poin >= h.poin_dibutuhkan;
                return (
                  <div key={h.id} style={{ background: "rgba(255,254,249,0.03)", borderRadius: 20, padding: 24, border: `1.5px solid ${cukup ? "rgba(79,191,126,0.3)" : "rgba(255,255,255,0.05)"}`, boxShadow: "0 10px 30px rgba(0,0,0,0.2)", transition: "transform 0.3s" }}>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 16 }}>
                      <div style={{ fontSize: 32 }}>{KAT_MAP[h.kategori]?.i || "🎁"}</div>
                      <div style={{ background: "rgba(0,0,0,0.3)", padding: "6px 12px", borderRadius: 99, fontSize: 11, fontWeight: 800, color: cukup ? "#4FBF7E" : "rgba(250,248,243,0.3)", border: "1px solid rgba(255,255,255,0.05)" }}>
                        {h.poin_dibutuhkan} Poin
                      </div>
                    </div>
                    <div style={{ fontWeight: 800, fontSize: 16, color: "#FAF8F3", marginBottom: 8, lineHeight: 1.4 }}>{h.nama}</div>
                    <div style={{ fontSize: 12, color: "rgba(250,248,243,0.5)", marginBottom: 20, fontWeight: 600 }}>Setara Rp {(h.poin_dibutuhkan * 100).toLocaleString("id-ID")}</div>
                    <button onClick={() => { if (!selectedKK) return showToast("Pilih nama KK dulu!", "error"); if (cukup) setConfirm(h); else showToast("Poin tidak cukup!", "error"); }}
                      style={{ width: "100%", padding: "12px", borderRadius: 12, border: "none", background: cukup ? "#2F8F4E" : "rgba(255,255,255,0.05)", color: cukup ? "white" : "rgba(250,248,243,0.3)", fontSize: 13, fontWeight: 800, cursor: cukup ? "pointer" : "not-allowed", transition: "all 0.3s" }}>
                      {cukup ? "TUKAR POIN" : "POIN KURANG"}
                    </button>
                  </div>
                );
              })}
            </div>
            {hadiah.filter(h => h.kategori === tab).length === 0 && (
              <div style={{ textAlign: "center", padding: 60, color: "rgba(250,248,243,0.4)", background: "rgba(255,254,249,0.02)", borderRadius: 24, border: "1px dashed rgba(255,255,255,0.1)", fontWeight: 700 }}>
                Katalog belum tersedia untuk kategori ini.
              </div>
            )}
          </div>
        )}

        {/* Riwayat Tab */}
        {tab === "riwayat" && (
          <div>
            {!selectedKK ? (
              <div style={{ textAlign: "center", padding: 60, color: "rgba(250,248,243,0.4)", background: "rgba(255,254,249,0.02)", borderRadius: 24, border: "1px dashed rgba(255,255,255,0.1)", fontWeight: 700 }}>Pilih nama KK dulu untuk lihat riwayat</div>
            ) : riwayat.length === 0 ? (
              <div style={{ textAlign: "center", padding: 60, color: "rgba(250,248,243,0.4)", background: "rgba(255,254,249,0.02)", borderRadius: 24, border: "1px dashed rgba(255,255,255,0.1)", fontWeight: 700 }}>Belum ada riwayat penukaran</div>
            ) : (
              <div style={{ background: "rgba(255,254,249,0.02)", borderRadius: 24, border: "1px solid rgba(255,255,255,0.05)", overflow: "hidden" }}>
                {riwayat.map((r, i) => {
                  const SC: Record<string, string> = { pending: "#D4AC5A", diproses: "#4A7C59", selesai: "#4FBF7E", ditolak: "#8B2020" };
                  return (
                    <div key={r.id} style={{ padding: "20px 24px", borderBottom: i < riwayat.length - 1 ? "1px solid rgba(255,255,255,0.05)" : "none", display: "flex", alignItems: "center", gap: 16 }}>
                      <div style={{ fontSize: 28 }}>{KAT_MAP[r.katalog_hadiah?.kategori]?.i || "🎁"}</div>
                      <div style={{ flex: 1 }}>
                        <div style={{ fontWeight: 800, fontSize: 15, color: "#FAF8F3", marginBottom: 4 }}>{r.katalog_hadiah?.nama}</div>
                        <div style={{ fontSize: 12, color: "rgba(250,248,243,0.5)", fontWeight: 600 }}>{r.poin_dipakai} Poin · {new Date(r.tgl_request).toLocaleDateString("id-ID")}</div>
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
    </div>
  );
}
