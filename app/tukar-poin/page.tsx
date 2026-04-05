"use client";
import { useState, useEffect } from "react";
import { supabase, isSupabaseReady } from "@/lib/supabase";

interface Hadiah { id: string; nama: string; kategori: string; poin_dibutuhkan: number; stok: number; nominal: number; }
interface Saldo { total_poin: number; total_setor_kg: number; }

export default function TukarPoinPage() {
  const [hadiah, setHadiah] = useState<Hadiah[]>([]);
  const [kkList, setKkList] = useState<any[]>([]);
  const [selectedKK, setSelectedKK] = useState("");
  const [saldo, setSaldo] = useState<Saldo | null>(null);
  const [riwayat, setRiwayat] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [toast, setToast] = useState({ msg: "", type: "success" });
  const [tab, setTab] = useState<"tukar" | "riwayat">("tukar");
  const [confirm, setConfirm] = useState<Hadiah | null>(null);

  function showToast(msg: string, type = "success") {
    setToast({ msg, type });
    setTimeout(() => setToast({ msg: "", type: "success" }), 4000);
  }

  async function fetchHadiah() {
    if (!isSupabaseReady()) return;
    const { data } = await supabase.from("katalog_hadiah").select("*").eq("aktif", true).gt("stok", 0).order("poin_dibutuhkan");
    if (data) setHadiah(data as Hadiah[]);
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
    const { data: r } = await supabase.from("penukaran_poin").select("*,katalog_hadiah(nama)").eq("kk_id", kkId).order("tgl_request", { ascending: false });
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
    showToast(`✅ Permintaan ${h.nama} berhasil! Ambil ke pos bank sampah ya!`);
    setConfirm(null);
    setLoading(false);
    fetchSaldo(selectedKK);
  }

  const KAT_ICON: Record<string, string> = { pulsa: "📱", sembako: "🛒", produk: "🎁", uang: "💵" };

  return (
    <div style={{ minHeight: "100vh", background: "#f5f0e8", fontFamily: "'Segoe UI',system-ui,sans-serif" }}>
      {/* Toast */}
      {toast.msg && (
        <div style={{ position: "fixed", top: 20, left: "50%", transform: "translateX(-50%)", background: toast.type === "error" ? "#dc3545" : "#2d5a40", color: "white", padding: "12px 24px", borderRadius: 14, zIndex: 999, fontSize: 14, boxShadow: "0 4px 20px rgba(0,0,0,0.2)", maxWidth: "85vw", textAlign: "center" }}>{toast.msg}</div>
      )}

      {/* Confirm modal */}
      {confirm && (
        <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.5)", zIndex: 100, display: "flex", alignItems: "center", justifyContent: "center", padding: 20 }}>
          <div style={{ background: "white", borderRadius: 20, padding: 28, maxWidth: 360, width: "100%", textAlign: "center" }}>
            <div style={{ fontSize: 40, marginBottom: 12 }}>{KAT_ICON[confirm.kategori] || "🎁"}</div>
            <h3 style={{ margin: "0 0 8px", color: "#1a2e1f" }}>Konfirmasi Penukaran</h3>
            <p style={{ color: "#6b7c6d", margin: "0 0 6px", fontSize: 15 }}><strong>{confirm.nama}</strong></p>
            <p style={{ color: "#2d5a40", fontWeight: 800, fontSize: 18, margin: "0 0 20px" }}>{confirm.poin_dibutuhkan} Poin</p>
            <p style={{ color: "#a8b5a9", fontSize: 12, margin: "0 0 20px" }}>Sisa poin setelah tukar: <strong>{(saldo?.total_poin || 0) - confirm.poin_dibutuhkan}</strong></p>
            <div style={{ display: "flex", gap: 10 }}>
              <button onClick={() => setConfirm(null)} style={{ flex: 1, padding: "11px", borderRadius: 12, border: "1.5px solid rgba(45,90,64,0.2)", background: "transparent", color: "#6b7c6d", fontSize: 14, cursor: "pointer" }}>Batal</button>
              <button onClick={() => requestTukar(confirm)} disabled={loading} style={{ flex: 1, padding: "11px", borderRadius: 12, border: "none", background: "#2d5a40", color: "white", fontSize: 14, fontWeight: 700, cursor: loading ? "not-allowed" : "pointer" }}>
                {loading ? "..." : "✅ Ya, Tukar!"}
              </button>
            </div>
          </div>
        </div>
      )}

      <header style={{ background: "#f5f0e8", borderBottom: "1px solid rgba(45,90,64,0.12)", padding: "14px 20px", position: "sticky", top: 0, zIndex: 10, display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <a href="/" style={{ color: "#6b7c6d", textDecoration: "none", fontSize: 13 }}>← Beranda</a>
          <span style={{ color: "#c8bfaa" }}>|</span>
          <div>
            <div style={{ fontWeight: 800, fontSize: 15, color: "#1a2e1f" }}>🎁 Tukar Poin</div>
            <div style={{ fontSize: 10, color: "#7a9a7e", textTransform: "uppercase", letterSpacing: "0.08em" }}>Bank Sampah Ciburial</div>
          </div>
        </div>
        <div style={{ display: "flex", gap: 6 }}>
          {(["tukar", "riwayat"] as const).map(t => (
            <button key={t} onClick={() => setTab(t)} style={{ padding: "6px 14px", borderRadius: 20, fontSize: 12, fontWeight: 600, border: "1.5px solid rgba(45,90,64,0.2)", cursor: "pointer", background: tab === t ? "#2d5a40" : "transparent", color: tab === t ? "white" : "#6b7c6d" }}>
              {t === "tukar" ? "🎁 Katalog" : "📋 Riwayat"}
            </button>
          ))}
        </div>
      </header>

      <div style={{ maxWidth: 800, margin: "0 auto", padding: "20px 16px" }}>
        {/* Pilih KK */}
        <div style={{ background: "white", borderRadius: 16, padding: 16, border: "1px solid rgba(45,90,64,0.1)", marginBottom: 16, boxShadow: "0 1px 6px rgba(0,0,0,0.04)" }}>
          <label style={{ fontSize: 11, fontWeight: 700, color: "#6b7c6d", letterSpacing: "0.06em", textTransform: "uppercase", display: "block", marginBottom: 8 }}>Pilih Nama KK Kamu</label>
          <select value={selectedKK} onChange={e => setSelectedKK(e.target.value)}
            style={{ width: "100%", padding: "10px 14px", borderRadius: 12, border: "1.5px solid rgba(45,90,64,0.2)", fontSize: 14, background: "#fafaf8", outline: "none" }}>
            <option value="">-- Pilih nama kepala keluarga --</option>
            {kkList.map(k => <option key={k.id} value={k.id}>{k.kepala_keluarga} (RT {k.rt})</option>)}
          </select>
          {saldo && (
            <div style={{ display: "flex", gap: 16, marginTop: 12, padding: "12px 16px", background: "rgba(45,90,64,0.06)", borderRadius: 12 }}>
              <div>
                <div style={{ fontSize: 22, fontWeight: 900, color: "#2d5a40" }}>{saldo.total_poin}</div>
                <div style={{ fontSize: 11, color: "#7a9a7e", textTransform: "uppercase" }}>Saldo Poin</div>
              </div>
              <div style={{ width: 1, background: "rgba(45,90,64,0.15)" }}/>
              <div>
                <div style={{ fontSize: 22, fontWeight: 900, color: "#2d5a40" }}>{Number(saldo.total_setor_kg).toFixed(1)} kg</div>
                <div style={{ fontSize: 11, color: "#7a9a7e", textTransform: "uppercase" }}>Total Setor</div>
              </div>
            </div>
          )}
        </div>

        {/* Katalog */}
        {tab === "tukar" && (
          <div>
            <h3 style={{ margin: "0 0 14px", color: "#1a2e1f", fontSize: 15, fontWeight: 700 }}>Pilih Hadiah</h3>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill,minmax(200px,1fr))", gap: 12 }}>
              {hadiah.map(h => {
                const cukup = saldo && saldo.total_poin >= h.poin_dibutuhkan;
                return (
                  <div key={h.id} style={{ background: "white", borderRadius: 16, padding: 18, border: `1.5px solid ${cukup ? "rgba(45,90,64,0.2)" : "rgba(0,0,0,0.08)"}`, boxShadow: "0 1px 6px rgba(0,0,0,0.04)", opacity: cukup ? 1 : 0.6 }}>
                    <div style={{ fontSize: 28, marginBottom: 8 }}>{KAT_ICON[h.kategori] || "🎁"}</div>
                    <div style={{ fontWeight: 700, fontSize: 14, color: "#1a2e1f", marginBottom: 4 }}>{h.nama}</div>
                    <div style={{ fontWeight: 900, fontSize: 18, color: "#2d5a40", marginBottom: 2 }}>{h.poin_dibutuhkan} <span style={{ fontSize: 12, fontWeight: 400, color: "#7a9a7e" }}>poin</span></div>
                    <div style={{ fontSize: 11, color: "#a8b5a9", marginBottom: 12 }}>Stok: {h.stok}</div>
                    <button onClick={() => { if (!selectedKK) return showToast("Pilih nama KK dulu!", "error"); if (cukup) setConfirm(h); else showToast("Poin tidak cukup!", "error"); }}
                      style={{ width: "100%", padding: "9px", borderRadius: 10, border: "none", background: cukup ? "#2d5a40" : "rgba(0,0,0,0.06)", color: cukup ? "white" : "#a8b5a9", fontSize: 13, fontWeight: 600, cursor: cukup ? "pointer" : "not-allowed" }}>
                      {cukup ? "Tukar Sekarang" : "Poin Kurang"}
                    </button>
                  </div>
                );
              })}
            </div>
            {hadiah.length === 0 && (
              <div style={{ textAlign: "center", padding: 40, color: "#a8b5a9", background: "white", borderRadius: 16, border: "1px solid rgba(45,90,64,0.1)" }}>
                Belum ada hadiah tersedia. Cek lagi nanti ya!
              </div>
            )}
          </div>
        )}

        {/* Riwayat */}
        {tab === "riwayat" && (
          <div>
            {!selectedKK ? (
              <div style={{ textAlign: "center", padding: 40, color: "#a8b5a9", background: "white", borderRadius: 16, border: "1px solid rgba(45,90,64,0.1)" }}>Pilih nama KK dulu untuk lihat riwayat</div>
            ) : riwayat.length === 0 ? (
              <div style={{ textAlign: "center", padding: 40, color: "#a8b5a9", background: "white", borderRadius: 16, border: "1px solid rgba(45,90,64,0.1)" }}>Belum ada riwayat penukaran</div>
            ) : (
              <div style={{ background: "white", borderRadius: 16, border: "1px solid rgba(45,90,64,0.1)", overflow: "hidden" }}>
                {riwayat.map((r, i) => {
                  const SC: Record<string, string> = { pending: "#b8943f", diproses: "#1a3a6b", selesai: "#2d5a40", ditolak: "#8b0000" };
                  return (
                    <div key={r.id} style={{ padding: "14px 18px", borderBottom: i < riwayat.length - 1 ? "1px solid rgba(45,90,64,0.07)" : "none", display: "flex", alignItems: "center", gap: 12 }}>
                      <div style={{ fontSize: 24 }}>🎁</div>
                      <div style={{ flex: 1 }}>
                        <div style={{ fontWeight: 600, fontSize: 14, color: "#1a2e1f" }}>{r.katalog_hadiah?.nama}</div>
                        <div style={{ fontSize: 12, color: "#7a9a7e" }}>{r.poin_dipakai} poin · {new Date(r.tgl_request).toLocaleDateString("id-ID")}</div>
                      </div>
                      <div style={{ background: SC[r.status] + "15", color: SC[r.status], border: `1px solid ${SC[r.status]}30`, borderRadius: 20, padding: "4px 12px", fontSize: 11, fontWeight: 600, textTransform: "capitalize" }}>{r.status}</div>
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
