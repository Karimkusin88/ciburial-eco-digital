"use client";
import { useState, useEffect } from "react";
import { supabase, isSupabaseReady } from "@/lib/supabase";

// =====================
// ZAKAT PAGE
// =====================
interface ZakatRow { id: string; kk_id: string; tahun: number; jumlah_jiwa: number; jenis: string; nominal_kg: number; nominal_uang: number; tgl_bayar: string; keluarga: { kepala_keluarga: string; rt: string; }; }

const HARGA_BERAS = 15000;
const emptyZakat = { kk_id: "", tahun: new Date().getFullYear(), jumlah_jiwa: 1, jenis: "beras", nominal_kg: 0, nominal_uang: 0, tgl_bayar: new Date().toISOString().split("T")[0] };

export function ZakatPage() {
  const [kkList, setKkList] = useState<any[]>([]);
  const [zakatList, setZakatList] = useState<ZakatRow[]>([]);
  const [form, setForm] = useState(emptyZakat);
  const [tab, setTab] = useState<"input" | "rekap">("input");
  const [loading, setLoading] = useState(false);
  const [toast, setToast] = useState("");

  function showToast(msg: string) { setToast(msg); setTimeout(() => setToast(""), 3000); }

  async function fetchAll() {
    if (!isSupabaseReady()) return;
    const [kk, z] = await Promise.all([
      supabase.from("keluarga").select("id,kepala_keluarga,rt").order("kepala_keluarga"),
      supabase.from("zakat_fitrah").select("*,keluarga(kepala_keluarga,rt)").order("tgl_bayar", { ascending: false }),
    ]);
    if (kk.data) setKkList(kk.data);
    if (z.data) setZakatList(z.data as any);
  }

  useEffect(() => { fetchAll(); }, []);

  function hitungZakat() {
    if (form.jenis === "beras") return { kg: form.jumlah_jiwa * 2.5, uang: form.jumlah_jiwa * 2.5 * HARGA_BERAS };
    return { kg: 0, uang: form.jumlah_jiwa * 40000 };
  }

  async function simpan() {
    if (!form.kk_id) return showToast("❌ Pilih warga dulu!");
    setLoading(true);
    const { kg, uang } = hitungZakat();
    await supabase.from("zakat_fitrah").insert({ ...form, nominal_kg: kg, nominal_uang: uang });
    showToast("✅ Zakat tercatat!");
    setForm(emptyZakat);
    setLoading(false);
    fetchAll();
  }

  const totalKg = zakatList.filter(z => z.jenis === "beras").reduce((s, z) => s + Number(z.nominal_kg), 0);
  const totalUang = zakatList.reduce((s, z) => s + Number(z.nominal_uang), 0);
  const tahunIni = new Date().getFullYear();
  const sudahBayar = zakatList.filter(z => z.tahun === tahunIni);
  const { kg: prevKg, uang: prevUang } = hitungZakat();

  return (
    <div style={{ minHeight: "100vh", background: "#f5f0e8", fontFamily: "'Segoe UI',system-ui,sans-serif" }}>
      {toast && <div style={{ position: "fixed", top: 20, left: "50%", transform: "translateX(-50%)", background: "#2d5a40", color: "white", padding: "10px 20px", borderRadius: 12, zIndex: 999, fontSize: 14 }}>{toast}</div>}
      <header style={{ background: "#f5f0e8", borderBottom: "1px solid rgba(45,90,64,0.12)", padding: "14px 20px", position: "sticky", top: 0, zIndex: 10, display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <a href="/admin" style={{ color: "#6b7c6d", textDecoration: "none", fontSize: 13 }}>← Admin</a>
          <span style={{ color: "#c8bfaa" }}>|</span>
          <div>
            <div style={{ fontWeight: 800, fontSize: 15, color: "#1a2e1f" }}>🕌 Zakat & Sumbangan</div>
            <div style={{ fontSize: 10, color: "#7a9a7e", textTransform: "uppercase", letterSpacing: "0.08em" }}>{sudahBayar.length} KK sudah bayar {tahunIni}</div>
          </div>
        </div>
        <div style={{ display: "flex", gap: 6 }}>
          {(["input", "rekap"] as const).map(t => (
            <button key={t} onClick={() => setTab(t)} style={{ padding: "6px 14px", borderRadius: 20, fontSize: 12, fontWeight: 600, border: "1.5px solid rgba(45,90,64,0.2)", cursor: "pointer", background: tab === t ? "#2d5a40" : "transparent", color: tab === t ? "white" : "#6b7c6d" }}>
              {t === "input" ? "📥 Input" : "📊 Rekap"}
            </button>
          ))}
        </div>
      </header>

      <div style={{ maxWidth: 860, margin: "0 auto", padding: "20px 16px" }}>
        {/* Stats */}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: 12, marginBottom: 20 }}>
          {[
            { icon: "🏠", val: sudahBayar.length, label: `KK Bayar ${tahunIni}` },
            { icon: "🌾", val: `${totalKg.toFixed(1)} kg`, label: "Total Beras" },
            { icon: "💰", val: `Rp${(totalUang / 1000).toFixed(0)}rb`, label: "Total Nilai" },
          ].map(s => (
            <div key={s.label} style={{ background: "white", borderRadius: 14, padding: "14px 16px", border: "1px solid rgba(45,90,64,0.1)", boxShadow: "0 1px 6px rgba(0,0,0,0.04)" }}>
              <div style={{ fontSize: 20, marginBottom: 4 }}>{s.icon}</div>
              <div style={{ fontSize: 20, fontWeight: 900, color: "#2d5a40" }}>{s.val}</div>
              <div style={{ fontSize: 11, color: "#7a9a7e", textTransform: "uppercase", letterSpacing: "0.06em" }}>{s.label}</div>
            </div>
          ))}
        </div>

        {tab === "input" && (
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
            <div style={{ background: "white", borderRadius: 16, padding: 20, border: "1px solid rgba(45,90,64,0.1)", boxShadow: "0 1px 6px rgba(0,0,0,0.04)" }}>
              <h3 style={{ margin: "0 0 16px", color: "#1a2e1f", fontSize: 15 }}>📥 Input Zakat Fitrah</h3>
              <div style={{ marginBottom: 12 }}>
                <label style={{ fontSize: 11, fontWeight: 700, color: "#6b7c6d", letterSpacing: "0.06em", textTransform: "uppercase", display: "block", marginBottom: 4 }}>Warga / KK *</label>
                <select value={form.kk_id} onChange={e => setForm({ ...form, kk_id: e.target.value })}
                  style={{ width: "100%", padding: "9px 12px", borderRadius: 10, border: "1.5px solid rgba(45,90,64,0.2)", fontSize: 13, background: "#fafaf8", outline: "none" }}>
                  <option value="">-- Pilih warga --</option>
                  {kkList.map(k => <option key={k.id} value={k.id}>{k.kepala_keluarga} (RT {k.rt})</option>)}
                </select>
              </div>
              <div style={{ marginBottom: 12 }}>
                <label style={{ fontSize: 11, fontWeight: 700, color: "#6b7c6d", letterSpacing: "0.06em", textTransform: "uppercase", display: "block", marginBottom: 4 }}>Jumlah Jiwa *</label>
                <input type="number" min="1" value={form.jumlah_jiwa} onChange={e => setForm({ ...form, jumlah_jiwa: Number(e.target.value) })}
                  style={{ width: "100%", padding: "9px 12px", borderRadius: 10, border: "1.5px solid rgba(45,90,64,0.2)", fontSize: 13, background: "#fafaf8", outline: "none", boxSizing: "border-box" }} />
              </div>
              <div style={{ marginBottom: 12 }}>
                <label style={{ fontSize: 11, fontWeight: 700, color: "#6b7c6d", letterSpacing: "0.06em", textTransform: "uppercase", display: "block", marginBottom: 4 }}>Jenis Zakat</label>
                <div style={{ display: "flex", gap: 8 }}>
                  {[{ v: "beras", l: "🌾 Beras" }, { v: "uang", l: "💰 Uang" }].map(({ v, l }) => (
                    <button key={v} onClick={() => setForm({ ...form, jenis: v })}
                      style={{ flex: 1, padding: "8px", borderRadius: 10, border: "1.5px solid rgba(45,90,64,0.2)", cursor: "pointer", background: form.jenis === v ? "#2d5a40" : "transparent", color: form.jenis === v ? "white" : "#2d5a40", fontSize: 13, fontWeight: 600 }}>{l}</button>
                  ))}
                </div>
              </div>
              {/* Preview */}
              <div style={{ background: "rgba(45,90,64,0.06)", border: "1px solid rgba(45,90,64,0.15)", borderRadius: 12, padding: "12px 14px", marginBottom: 16 }}>
                <div style={{ fontSize: 12, color: "#7a9a7e", marginBottom: 4 }}>Estimasi Zakat</div>
                <div style={{ fontWeight: 800, fontSize: 16, color: "#2d5a40" }}>
                  {form.jenis === "beras" ? `${prevKg.toFixed(1)} kg beras` : `Rp ${prevUang.toLocaleString("id-ID")}`}
                </div>
                <div style={{ fontSize: 12, color: "#7a9a7e" }}>{form.jumlah_jiwa} jiwa × {form.jenis === "beras" ? "2.5 kg" : "Rp 40.000"}</div>
              </div>
              <button onClick={simpan} disabled={loading} style={{ width: "100%", background: "#2d5a40", color: "white", border: "none", borderRadius: 10, padding: "11px", fontSize: 14, fontWeight: 600, cursor: loading ? "not-allowed" : "pointer" }}>
                {loading ? "Menyimpan..." : "💾 Simpan Zakat"}
              </button>
            </div>

            <div style={{ background: "white", borderRadius: 16, padding: 20, border: "1px solid rgba(45,90,64,0.1)", boxShadow: "0 1px 6px rgba(0,0,0,0.04)" }}>
              <h3 style={{ margin: "0 0 14px", color: "#1a2e1f", fontSize: 15 }}>📋 Terbaru</h3>
              <div style={{ maxHeight: 380, overflowY: "auto" }}>
                {zakatList.slice(0, 15).map((z, i) => (
                  <div key={z.id} style={{ display: "flex", alignItems: "center", gap: 10, padding: "10px 0", borderBottom: i < zakatList.slice(0, 15).length - 1 ? "1px solid rgba(45,90,64,0.07)" : "none" }}>
                    <div style={{ fontSize: 18 }}>{z.jenis === "beras" ? "🌾" : "💰"}</div>
                    <div style={{ flex: 1 }}>
                      <div style={{ fontWeight: 600, fontSize: 13, color: "#1a2e1f" }}>{z.keluarga?.kepala_keluarga}</div>
                      <div style={{ fontSize: 11, color: "#7a9a7e" }}>RT {z.keluarga?.rt} · {z.jumlah_jiwa} jiwa · {z.tahun}</div>
                    </div>
                    <div style={{ textAlign: "right", fontSize: 13, fontWeight: 700, color: "#2d5a40" }}>
                      {z.jenis === "beras" ? `${z.nominal_kg} kg` : `Rp${(z.nominal_uang / 1000).toFixed(0)}rb`}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {tab === "rekap" && (
          <div style={{ background: "white", borderRadius: 16, border: "1px solid rgba(45,90,64,0.1)", overflow: "hidden" }}>
            {zakatList.map((z, i) => (
              <div key={z.id} style={{ padding: "12px 18px", borderBottom: i < zakatList.length - 1 ? "1px solid rgba(45,90,64,0.07)" : "none", display: "flex", alignItems: "center", gap: 12 }}>
                <div style={{ fontSize: 20 }}>{z.jenis === "beras" ? "🌾" : "💰"}</div>
                <div style={{ flex: 1 }}>
                  <div style={{ fontWeight: 600, fontSize: 14, color: "#1a2e1f" }}>{z.keluarga?.kepala_keluarga}</div>
                  <div style={{ fontSize: 12, color: "#7a9a7e" }}>RT {z.keluarga?.rt} · {z.jumlah_jiwa} jiwa · {new Date(z.tgl_bayar).toLocaleDateString("id-ID")}</div>
                </div>
                <div style={{ fontWeight: 800, fontSize: 15, color: "#2d5a40" }}>
                  {z.jenis === "beras" ? `${z.nominal_kg} kg` : `Rp${(z.nominal_uang / 1000).toFixed(0)}rb`}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

export default ZakatPage;