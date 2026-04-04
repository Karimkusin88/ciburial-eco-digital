"use client";
import { useState, useEffect } from "react";
import { supabase, isSupabaseReady } from "@/lib/supabase";

interface KK {
  id: string;
  no_kk: string;
  kepala_keluarga: string;
  alamat: string;
  rt: string;
  rw: string;
  no_wa: string;
  nfc_id: string;
  status: string;
  created_at: string;
}

const emptyForm = {
  no_kk: "", kepala_keluarga: "", alamat: "",
  rt: "01", rw: "01", no_wa: "", nfc_id: "", status: "tetap"
};

export default function AdminWargaPage() {
  const [data, setData] = useState<KK[]>([]);
  const [form, setForm] = useState(emptyForm);
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState("");
  const [editId, setEditId] = useState<string | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [toast, setToast] = useState("");

  function showToast(msg: string) {
    setToast(msg);
    setTimeout(() => setToast(""), 3000);
  }

  async function fetchData() {
    if (!isSupabaseReady()) return;
    const { data: rows } = await supabase
      .from("keluarga")
      .select("*")
      .order("rt")
      .order("kepala_keluarga");
    if (rows) setData(rows as KK[]);
  }

  useEffect(() => { fetchData(); }, []);

  async function handleSave() {
    if (!form.no_kk || !form.kepala_keluarga) return showToast("❌ No KK & nama wajib diisi!");
    setLoading(true);
    if (editId) {
      await supabase.from("keluarga").update(form).eq("id", editId);
      showToast("✅ Data berhasil diupdate!");
    } else {
      await supabase.from("keluarga").insert(form);
      showToast("✅ Data KK berhasil ditambah!");
    }
    setForm(emptyForm);
    setEditId(null);
    setShowForm(false);
    setLoading(false);
    fetchData();
  }

  async function handleDelete(id: string) {
    if (!confirm("Hapus data KK ini?")) return;
    await supabase.from("keluarga").delete().eq("id", id);
    showToast("🗑️ Data dihapus");
    fetchData();
  }

  function handleEdit(kk: KK) {
    setForm({
      no_kk: kk.no_kk, kepala_keluarga: kk.kepala_keluarga,
      alamat: kk.alamat || "", rt: kk.rt, rw: kk.rw,
      no_wa: kk.no_wa || "", nfc_id: kk.nfc_id || "", status: kk.status,
    });
    setEditId(kk.id);
    setShowForm(true);
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  const filtered = data.filter(k =>
    k.kepala_keluarga.toLowerCase().includes(search.toLowerCase()) ||
    k.no_kk.includes(search) ||
    k.rt.includes(search)
  );

  const S: Record<string, string> = {
    tetap: "#2d5a40", pendatang: "#b8943f", perantau: "#1a3a6b"
  };

  return (
    <div style={{ minHeight: "100vh", background: "#f5f0e8", fontFamily: "'Segoe UI',system-ui,sans-serif" }}>
      {/* Toast */}
      {toast && (
        <div style={{
          position: "fixed", top: 20, left: "50%", transform: "translateX(-50%)",
          background: "#2d5a40", color: "white", padding: "10px 20px",
          borderRadius: 12, zIndex: 999, fontSize: 14,
          boxShadow: "0 4px 20px rgba(0,0,0,0.15)",
        }}>{toast}</div>
      )}

      {/* Header */}
      <header style={{
        background: "#f5f0e8", borderBottom: "1px solid rgba(45,90,64,0.12)",
        padding: "14px 20px", display: "flex", alignItems: "center",
        justifyContent: "space-between", position: "sticky", top: 0, zIndex: 10,
      }}>
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <a href="/admin" style={{ color: "#6b7c6d", textDecoration: "none", fontSize: 13 }}>← Admin</a>
          <span style={{ color: "#c8bfaa" }}>|</span>
          <div>
            <div style={{ fontWeight: 800, fontSize: 15, color: "#1a2e1f" }}>👥 Data Warga</div>
            <div style={{ fontSize: 10, color: "#7a9a7e", textTransform: "uppercase", letterSpacing: "0.08em" }}>
              {data.length} KK Terdaftar
            </div>
          </div>
        </div>
        <button onClick={() => { setForm(emptyForm); setEditId(null); setShowForm(!showForm); }}
          style={{
            background: "#2d5a40", color: "white", border: "none",
            borderRadius: 10, padding: "8px 16px", fontSize: 13,
            fontWeight: 600, cursor: "pointer",
          }}>
          {showForm ? "✕ Tutup" : "+ Tambah KK"}
        </button>
      </header>

      <div style={{ maxWidth: 900, margin: "0 auto", padding: "20px 16px" }}>

        {/* Form */}
        {showForm && (
          <div style={{
            background: "white", borderRadius: 16, padding: 20,
            border: "1px solid rgba(45,90,64,0.12)",
            boxShadow: "0 2px 12px rgba(0,0,0,0.06)", marginBottom: 20,
          }}>
            <h3 style={{ margin: "0 0 16px", color: "#1a2e1f", fontSize: 15 }}>
              {editId ? "✏️ Edit Data KK" : "➕ Tambah Data KK Baru"}
            </h3>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
              {[
                { label: "No. KK *", key: "no_kk", placeholder: "3204xxxxxxxxxxxx" },
                { label: "Kepala Keluarga *", key: "kepala_keluarga", placeholder: "Nama lengkap" },
                { label: "No. WhatsApp", key: "no_wa", placeholder: "08xxxxxxxxxx" },
                { label: "NFC Card ID", key: "nfc_id", placeholder: "ID chip kartu NFC" },
              ].map(f => (
                <div key={f.key}>
                  <label style={{ fontSize: 11, fontWeight: 700, color: "#6b7c6d", letterSpacing: "0.06em", textTransform: "uppercase", display: "block", marginBottom: 4 }}>{f.label}</label>
                  <input
                    value={(form as any)[f.key]}
                    onChange={e => setForm({ ...form, [f.key]: e.target.value })}
                    placeholder={f.placeholder}
                    style={{
                      width: "100%", padding: "9px 12px", borderRadius: 10,
                      border: "1.5px solid rgba(45,90,64,0.2)", fontSize: 13,
                      background: "#fafaf8", outline: "none", boxSizing: "border-box",
                    }}
                  />
                </div>
              ))}
              <div style={{ gridColumn: "1/-1" }}>
                <label style={{ fontSize: 11, fontWeight: 700, color: "#6b7c6d", letterSpacing: "0.06em", textTransform: "uppercase", display: "block", marginBottom: 4 }}>Alamat</label>
                <input
                  value={form.alamat}
                  onChange={e => setForm({ ...form, alamat: e.target.value })}
                  placeholder="Alamat lengkap"
                  style={{
                    width: "100%", padding: "9px 12px", borderRadius: 10,
                    border: "1.5px solid rgba(45,90,64,0.2)", fontSize: 13,
                    background: "#fafaf8", outline: "none", boxSizing: "border-box",
                  }}
                />
              </div>
              <div>
                <label style={{ fontSize: 11, fontWeight: 700, color: "#6b7c6d", letterSpacing: "0.06em", textTransform: "uppercase", display: "block", marginBottom: 4 }}>RT</label>
                <select value={form.rt} onChange={e => setForm({ ...form, rt: e.target.value })}
                  style={{ width: "100%", padding: "9px 12px", borderRadius: 10, border: "1.5px solid rgba(45,90,64,0.2)", fontSize: 13, background: "#fafaf8", outline: "none" }}>
                  {["01", "02", "03", "04", "05"].map(v => <option key={v} value={v}>RT {v}</option>)}
                </select>
              </div>
              <div>
                <label style={{ fontSize: 11, fontWeight: 700, color: "#6b7c6d", letterSpacing: "0.06em", textTransform: "uppercase", display: "block", marginBottom: 4 }}>Status</label>
                <select value={form.status} onChange={e => setForm({ ...form, status: e.target.value })}
                  style={{ width: "100%", padding: "9px 12px", borderRadius: 10, border: "1.5px solid rgba(45,90,64,0.2)", fontSize: 13, background: "#fafaf8", outline: "none" }}>
                  <option value="tetap">Warga Tetap</option>
                  <option value="pendatang">Pendatang</option>
                  <option value="perantau">Perantau</option>
                </select>
              </div>
            </div>
            <div style={{ display: "flex", gap: 10, marginTop: 16 }}>
              <button onClick={handleSave} disabled={loading}
                style={{
                  flex: 1, background: "#2d5a40", color: "white", border: "none",
                  borderRadius: 10, padding: "10px", fontSize: 14, fontWeight: 600,
                  cursor: loading ? "not-allowed" : "pointer",
                }}>
                {loading ? "Menyimpan..." : editId ? "💾 Update" : "💾 Simpan"}
              </button>
              <button onClick={() => { setShowForm(false); setForm(emptyForm); setEditId(null); }}
                style={{
                  padding: "10px 20px", background: "transparent",
                  border: "1.5px solid rgba(45,90,64,0.2)", borderRadius: 10,
                  fontSize: 14, color: "#6b7c6d", cursor: "pointer",
                }}>Batal</button>
            </div>
          </div>
        )}

        {/* Stats */}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: 12, marginBottom: 20 }}>
          {[
            { label: "Total KK", value: data.length, icon: "🏠" },
            { label: "Warga Tetap", value: data.filter(d => d.status === "tetap").length, icon: "👥" },
            { label: "Ada No. WA", value: data.filter(d => d.no_wa).length, icon: "📱" },
          ].map(s => (
            <div key={s.label} style={{
              background: "white", borderRadius: 14, padding: "14px 16px",
              border: "1px solid rgba(45,90,64,0.1)",
              boxShadow: "0 1px 6px rgba(0,0,0,0.04)",
            }}>
              <div style={{ fontSize: 20, marginBottom: 4 }}>{s.icon}</div>
              <div style={{ fontSize: 22, fontWeight: 900, color: "#2d5a40" }}>{s.value}</div>
              <div style={{ fontSize: 11, color: "#7a9a7e", textTransform: "uppercase", letterSpacing: "0.06em" }}>{s.label}</div>
            </div>
          ))}
        </div>

        {/* Search */}
        <input
          value={search}
          onChange={e => setSearch(e.target.value)}
          placeholder="🔍 Cari nama, no. KK, atau RT..."
          style={{
            width: "100%", padding: "11px 16px", borderRadius: 12,
            border: "1.5px solid rgba(45,90,64,0.2)", fontSize: 14,
            background: "white", outline: "none", marginBottom: 16,
            boxSizing: "border-box",
          }}
        />

        {/* Table */}
        <div style={{ background: "white", borderRadius: 16, border: "1px solid rgba(45,90,64,0.1)", overflow: "hidden", boxShadow: "0 1px 6px rgba(0,0,0,0.04)" }}>
          {filtered.length === 0 ? (
            <div style={{ padding: 40, textAlign: "center", color: "#a8b5a9" }}>
              {search ? "Tidak ada hasil pencarian" : "Belum ada data warga"}
            </div>
          ) : (
            filtered.map((kk, i) => (
              <div key={kk.id} style={{
                padding: "14px 18px",
                borderBottom: i < filtered.length - 1 ? "1px solid rgba(45,90,64,0.07)" : "none",
                display: "flex", alignItems: "center", gap: 12,
              }}>
                <div style={{
                  width: 38, height: 38, borderRadius: 10,
                  background: "rgba(45,90,64,0.08)",
                  display: "flex", alignItems: "center", justifyContent: "center",
                  fontSize: 16, flexShrink: 0,
                }}>🏠</div>
                <div style={{ flex: 1 }}>
                  <div style={{ fontWeight: 700, fontSize: 14, color: "#1a2e1f" }}>{kk.kepala_keluarga}</div>
                  <div style={{ fontSize: 12, color: "#7a9a7e", marginTop: 2 }}>
                    RT {kk.rt} · {kk.no_kk}
                    {kk.no_wa && <span> · 📱 {kk.no_wa}</span>}
                    {kk.nfc_id && <span> · 💳 NFC</span>}
                  </div>
                </div>
                <div style={{
                  background: S[kk.status] + "15", color: S[kk.status],
                  border: `1px solid ${S[kk.status]}30`,
                  borderRadius: 20, padding: "3px 10px", fontSize: 11,
                  fontWeight: 600, textTransform: "capitalize",
                }}>{kk.status}</div>
                <div style={{ display: "flex", gap: 6 }}>
                  <button onClick={() => handleEdit(kk)}
                    style={{ background: "rgba(45,90,64,0.08)", border: "none", borderRadius: 8, padding: "6px 10px", cursor: "pointer", fontSize: 13 }}>✏️</button>
                  <button onClick={() => handleDelete(kk.id)}
                    style={{ background: "rgba(220,53,69,0.08)", border: "none", borderRadius: 8, padding: "6px 10px", cursor: "pointer", fontSize: 13 }}>🗑️</button>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}