"use client";
import { useState, useEffect } from "react";
import "../admin-styles-heroic.css";
import { supabase, isSupabaseReady } from "@/lib/supabase";

interface Saldo { kk_id: string; total_poin: number; total_setor_kg: number; keluarga: { kepala_keluarga: string; rt: string; } }
interface JenisSampah { id: string; nama: string; kategori: string; poin_per_kg: number; }
interface Hadiah { id: string; nama: string; kategori: string; poin_dibutuhkan: number; stok: number; }
interface Penukaran { id: string; kk_id: string; poin_dipakai: number; status: string; tgl_request: string; katalog_hadiah: { nama: string; }; keluarga: { kepala_keluarga: string; }; }

const emptySetor = { kk_id: "", jenis_sampah_id: "", berat_kg: "", dicatat_oleh: "Admin" };

export default function AdminBankSampahPage() {
  const [kkList, setKkList] = useState<any[]>([]);
  const [jenisList, setJenisList] = useState<JenisSampah[]>([]);
  const [hadiah, setHadiah] = useState<Hadiah[]>([]);
  const [saldoList, setSaldoList] = useState<Saldo[]>([]);
  const [penukaran, setPenukaran] = useState<Penukaran[]>([]);
  const [form, setForm] = useState(emptySetor);
  const [tab, setTab] = useState<"setor" | "saldo" | "tukar" | "leaderboard">("setor");
  const [loading, setLoading] = useState(false);
  const [toast, setToast] = useState("");

  function showToast(msg: string) { setToast(msg); setTimeout(() => setToast(""), 3000); }

  async function fetchAll() {
    if (!isSupabaseReady()) return;
    const [kk, jenis, had, saldo, tukar] = await Promise.all([
      supabase.from("keluarga").select("id,kepala_keluarga,rt").order("kepala_keluarga"),
      supabase.from("jenis_sampah").select("*").eq("aktif", true),
      supabase.from("katalog_hadiah").select("*").eq("aktif", true).order("poin_dibutuhkan"),
      supabase.from("saldo_poin").select("*,keluarga(kepala_keluarga,rt)").order("total_poin", { ascending: false }),
      supabase.from("penukaran_poin").select("*,katalog_hadiah(nama),keluarga(kepala_keluarga)").eq("status", "pending").order("tgl_request", { ascending: false }),
    ]);
    if (kk.data) setKkList(kk.data);
    if (jenis.data) setJenisList(jenis.data as JenisSampah[]);
    if (had.data) setHadiah(had.data as Hadiah[]);
    if (saldo.data) setSaldoList(saldo.data as any);
    if (tukar.data) setPenukaran(tukar.data as any);
  }

  useEffect(() => { fetchAll(); }, []);

  async function simpanSetor() {
    if (!form.kk_id || !form.jenis_sampah_id || !form.berat_kg) return showToast("❌ Semua field wajib diisi!");
    setLoading(true);
    const jenis = jenisList.find(j => j.id === form.jenis_sampah_id)!;
    const poin = Math.round(Number(form.berat_kg) * jenis.poin_per_kg);
    
    // 1. Catat transaksi sampah
    await supabase.from("setor_sampah").insert({ ...form, berat_kg: Number(form.berat_kg), poin_didapat: poin });
    
    // 2. Update saldo poin pakai library terpusat
    const { data: anggota } = await supabase.from("anggota_kk").select("id").eq("kk_id", form.kk_id).limit(1).single();
    if (!anggota) {
      setLoading(false);
      return showToast("❌ Gagal menemukan data anggota untuk KK ini.");
    }

    const { tambahPoin } = await import("@/lib/ecoReward");
    await tambahPoin({
      anggotaId: anggota.id,
      kkId: form.kk_id,
      jumlah: poin,
      sumber: "bank_sampah",
      keterangan: `Setor ${form.berat_kg}kg sampah ${jenis.kategori}`
    });
    
    showToast(`✅ Berhasil! +${poin} poin untuk ${kkList.find(k => k.id === form.kk_id)?.kepala_keluarga}`);
    setForm(emptySetor);
    setLoading(false);
    fetchAll();
  }

  async function approvetukar(id: string) {
    await supabase.from("penukaran_poin").update({ status: "selesai", tgl_selesai: new Date().toISOString() }).eq("id", id);
    showToast("✅ Penukaran disetujui!");
    fetchAll();
  }

  const jenisByKat: Record<string, JenisSampah[]> = {};
  jenisList.forEach(j => { if (!jenisByKat[j.kategori]) jenisByKat[j.kategori] = []; jenisByKat[j.kategori].push(j); });
  const MEDAL = ["🥇", "🥈", "🥉"];
  const KATICON: Record<string, string> = { plastik: "♻️", kertas: "📄", logam: "🔧", organik: "🌿", elektronik: "💻" };

  return (
    <div className="admin-page heroic-bg" style={{ minHeight: "100vh", fontFamily: "'Segoe UI', system-ui, sans-serif" }}>
      {toast && <div style={{ position: "fixed", top: 20, left: "50%", transform: "translateX(-50%)", background: "#2d5a40", color: "white", padding: "10px 20px", borderRadius: 12, zIndex: 999, fontSize: 14, boxShadow: "0 4px 20px rgba(0,0,0,0.15)" }}>{toast}</div>}

      <header style={{ background: "#f5f0e8", borderBottom: "1px solid rgba(45,90,64,0.12)", padding: "14px 20px", position: "sticky", top: 0, zIndex: 10, display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <a href="/admin" style={{ color: "#6b7c6d", textDecoration: "none", fontSize: 13 }}>← Admin</a>
          <span style={{ color: "#c8bfaa" }}>|</span>
          <div>
            <div style={{ fontWeight: 800, fontSize: 15, color: "#1a2e1f" }}>♻️ Bank Sampah Digital</div>
            <div style={{ fontSize: 10, color: "#7a9a7e", textTransform: "uppercase", letterSpacing: "0.08em" }}>{saldoList.length} KK Aktif</div>
          </div>
        </div>
        <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
          {(["setor", "saldo", "tukar", "leaderboard"] as const).map(t => (
            <button key={t} onClick={() => setTab(t)} style={{ padding: "6px 12px", borderRadius: 20, fontSize: 11, fontWeight: 600, border: "1.5px solid rgba(45,90,64,0.2)", cursor: "pointer", background: tab === t ? "#2d5a40" : "transparent", color: tab === t ? "white" : "#6b7c6d" }}>
              {{ setor: "📥 Setor", saldo: "💳 Saldo", tukar: `🎁 Tukar${penukaran.length > 0 ? ` (${penukaran.length})` : ""}`, leaderboard: "🏆 Top" }[t]}
            </button>
          ))}
        </div>
      </header>

      <div style={{ maxWidth: 860, margin: "0 auto", padding: "20px 16px" }}>

        {/* SETOR */}
        {tab === "setor" && (
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
            <div className="card-heroic">
              <h3 style={{ margin: "0 0 16px", color: "#1a2e1f", fontSize: 15 }}>📥 Input Setor Sampah</h3>
              <div style={{ marginBottom: 12 }}>
                <label className="form-label-heroic">Warga / KK *</label>
                <select value={form.kk_id} onChange={e => setForm({ ...form, kk_id: e.target.value })}
                  style={{ width: "100%", padding: "9px 12px", borderRadius: 10, border: "1.5px solid rgba(45,90,64,0.2)", fontSize: 13, background: "#fafaf8", outline: "none" }}>
                  <option value="">-- Pilih warga --</option>
                  {kkList.map(k => <option key={k.id} value={k.id}>{k.kepala_keluarga} (RT {k.rt})</option>)}
                </select>
              </div>
              <div style={{ marginBottom: 12 }}>
                <label className="form-label-heroic">Jenis Sampah *</label>
                <select value={form.jenis_sampah_id} onChange={e => setForm({ ...form, jenis_sampah_id: e.target.value })}
                  style={{ width: "100%", padding: "9px 12px", borderRadius: 10, border: "1.5px solid rgba(45,90,64,0.2)", fontSize: 13, background: "#fafaf8", outline: "none" }}>
                  <option value="">-- Pilih jenis --</option>
                  {Object.entries(jenisByKat).map(([kat, items]) => (
                    <optgroup key={kat} label={`${KATICON[kat] || "♻️"} ${kat.toUpperCase()}`}>
                      {items.map(j => <option key={j.id} value={j.id}>{j.nama} ({j.poin_per_kg} poin/kg)</option>)}
                    </optgroup>
                  ))}
                </select>
              </div>
              <div style={{ marginBottom: 16 }}>
                <label className="form-label-heroic">Berat (kg) *</label>
                <input type="number" step="0.1" value={form.berat_kg} onChange={e => setForm({ ...form, berat_kg: e.target.value })} placeholder="2.5"
                  style={{ width: "100%", padding: "9px 12px", borderRadius: 10, border: "1.5px solid rgba(45,90,64,0.2)", fontSize: 13, background: "#fafaf8", outline: "none", boxSizing: "border-box" }} />
              </div>
              {/* Preview poin */}
              {form.berat_kg && form.jenis_sampah_id && (
                <div style={{ background: "rgba(45,90,64,0.06)", border: "1px solid rgba(45,90,64,0.15)", borderRadius: 12, padding: "10px 14px", marginBottom: 14, textAlign: "center" }}>
                  <span style={{ fontSize: 13, color: "#2d5a40", fontWeight: 700 }}>
                    +{Math.round(Number(form.berat_kg) * (jenisList.find(j => j.id === form.jenis_sampah_id)?.poin_per_kg || 0))} Poin
                  </span>
                  <span style={{ fontSize: 12, color: "#7a9a7e" }}> akan ditambahkan</span>
                </div>
              )}
              <button onClick={simpanSetor} disabled={loading} className="btn-heroic">
                {loading ? "Menyimpan..." : "💾 Catat Setoran"}
              </button>
            </div>

            {/* Tabel poin sampah */}
            <div className="card-heroic">
              <h3 style={{ margin: "0 0 14px", color: "#1a2e1f", fontSize: 15 }}>📊 Tabel Poin Sampah</h3>
              {Object.entries(jenisByKat).map(([kat, items]) => (
                <div key={kat} style={{ marginBottom: 14 }}>
                  <div style={{ fontSize: 11, fontWeight: 700, color: "#7a9a7e", textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: 6 }}>{KATICON[kat]} {kat}</div>
                  {items.map(j => (
                    <div key={j.id} style={{ display: "flex", justifyContent: "space-between", padding: "6px 10px", borderRadius: 8, background: "#fafaf8", marginBottom: 4 }}>
                      <span style={{ fontSize: 13, color: "#1a2e1f" }}>{j.nama}</span>
                      <span style={{ fontSize: 13, fontWeight: 700, color: "#2d5a40" }}>{j.poin_per_kg} poin/kg</span>
                    </div>
                  ))}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* SALDO */}
        {tab === "saldo" && (
          <div className="card-heroic">
            {saldoList.length === 0 ? (
              <div style={{ padding: 40, textAlign: "center", color: "#a8b5a9" }}>Belum ada setoran</div>
            ) : saldoList.map((s, i) => (
              <div key={s.kk_id} style={{ padding: "14px 18px", borderBottom: i < saldoList.length - 1 ? "1px solid rgba(45,90,64,0.07)" : "none", display: "flex", alignItems: "center", gap: 12 }}>
                <div style={{ fontWeight: 800, fontSize: 18, color: "#2d5a40", width: 28 }}>#{i + 1}</div>
                <div style={{ flex: 1 }}>
                  <div style={{ fontWeight: 700, fontSize: 14, color: "#1a2e1f" }}>{s.keluarga?.kepala_keluarga}</div>
                  <div style={{ fontSize: 12, color: "#7a9a7e" }}>RT {s.keluarga?.rt} · {s.total_setor_kg} kg disetor</div>
                </div>
                <div style={{ textAlign: "right" }}>
                  <div style={{ fontWeight: 900, fontSize: 18, color: "#2d5a40" }}>{s.total_poin}</div>
                  <div style={{ fontSize: 10, color: "#7a9a7e", textTransform: "uppercase" }}>Poin</div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* TUKAR */}
        {tab === "tukar" && (
          <div>
            {penukaran.length === 0 ? (
              <div className="card-heroic">
                Tidak ada permintaan penukaran pending
              </div>
            ) : penukaran.map(p => (
              <div key={p.id} style={{ background: "white", borderRadius: 14, padding: "16px 18px", marginBottom: 10, border: "1px solid rgba(45,90,64,0.1)", boxShadow: "0 1px 6px rgba(0,0,0,0.04)", display: "flex", alignItems: "center", gap: 12 }}>
                <div style={{ flex: 1 }}>
                  <div style={{ fontWeight: 700, fontSize: 14, color: "#1a2e1f" }}>{p.keluarga?.kepala_keluarga}</div>
                  <div style={{ fontSize: 13, color: "#6b7c6d" }}>🎁 {p.katalog_hadiah?.nama} · {p.poin_dipakai} poin</div>
                  <div style={{ fontSize: 11, color: "#a8b5a9", marginTop: 2 }}>{new Date(p.tgl_request).toLocaleDateString("id-ID")}</div>
                </div>
                <div style={{ display: "flex", gap: 8 }}>
                  <button onClick={() => approvetukar(p.id)} style={{ background: "#2d5a40", color: "white", border: "none", borderRadius: 8, padding: "8px 14px", fontSize: 13, fontWeight: 600, cursor: "pointer" }}>✅ Setujui</button>
                  <button onClick={async () => { await supabase.from("penukaran_poin").update({ status: "ditolak" }).eq("id", p.id); fetchAll(); }} style={{ background: "rgba(220,53,69,0.08)", color: "#dc3545", border: "1px solid rgba(220,53,69,0.2)", borderRadius: 8, padding: "8px 14px", fontSize: 13, cursor: "pointer" }}>✕ Tolak</button>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* LEADERBOARD */}
        {tab === "leaderboard" && (
          <div>
            <div className="card-heroic">
              <h3 style={{ margin: "0 0 4px", color: "#1a2e1f", fontSize: 16, fontWeight: 800 }}>🏆 Top Penabung Sampah</h3>
              <p style={{ margin: "0 0 16px", color: "#7a9a7e", fontSize: 12 }}>Warga terbaik dalam menjaga lingkungan Ciburial!</p>
              {saldoList.slice(0, 10).map((s, i) => (
                <div key={s.kk_id} style={{ display: "flex", alignItems: "center", gap: 14, padding: "12px 14px", borderRadius: 12, background: i < 3 ? "rgba(45,90,64,0.05)" : "transparent", marginBottom: 6, border: i < 3 ? "1px solid rgba(45,90,64,0.1)" : "1px solid transparent" }}>
                  <div style={{ fontSize: i < 3 ? 24 : 16, width: 30, textAlign: "center", fontWeight: 800, color: "#7a9a7e" }}>{i < 3 ? MEDAL[i] : `#${i + 1}`}</div>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontWeight: 700, fontSize: 14, color: "#1a2e1f" }}>{s.keluarga?.kepala_keluarga}</div>
                    <div style={{ fontSize: 12, color: "#7a9a7e" }}>RT {s.keluarga?.rt} · {Number(s.total_setor_kg).toFixed(1)} kg disetor</div>
                  </div>
                  <div style={{ textAlign: "right" }}>
                    <div style={{ fontWeight: 900, fontSize: 20, color: "#2d5a40" }}>{s.total_poin}</div>
                    <div style={{ fontSize: 10, color: "#7a9a7e" }}>POIN</div>
                  </div>
                </div>
              ))}
              <div style={{ marginTop: 16, padding: "12px 16px", background: "rgba(45,90,64,0.06)", borderRadius: 12, display: "flex", justifyContent: "space-between" }}>
                <span style={{ fontSize: 13, color: "#2d5a40", fontWeight: 600 }}>🌍 Total Sampah Terkelola</span>
                <span style={{ fontSize: 13, fontWeight: 900, color: "#2d5a40" }}>{saldoList.reduce((a, s) => a + Number(s.total_setor_kg), 0).toFixed(1)} kg</span>
              </div>
            </div>
            {/* Katalog Hadiah */}
            <h3 style={{ margin: "0 0 12px", color: "#1a2e1f", fontSize: 15 }}>🎁 Katalog Hadiah</h3>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill,minmax(180px,1fr))", gap: 10 }}>
              {hadiah.map(h => (
                <div key={h.id} style={{ background: "white", borderRadius: 14, padding: "14px 16px", border: "1px solid rgba(45,90,64,0.1)", boxShadow: "0 1px 4px rgba(0,0,0,0.04)" }}>
                  <div style={{ fontSize: 22, marginBottom: 6 }}>{h.kategori === "pulsa" ? "📱" : h.kategori === "sembako" ? "🛒" : "🎁"}</div>
                  <div style={{ fontWeight: 700, fontSize: 13, color: "#1a2e1f", marginBottom: 4 }}>{h.nama}</div>
                  <div style={{ fontWeight: 900, fontSize: 16, color: "#2d5a40" }}>{h.poin_dibutuhkan} <span style={{ fontSize: 11, fontWeight: 400 }}>poin</span></div>
                  <div style={{ fontSize: 11, color: "#a8b5a9", marginTop: 2 }}>Stok: {h.stok}</div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
