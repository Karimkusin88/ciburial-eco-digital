"use client";
import { useState, useEffect } from "react";
import { supabase, isSupabaseReady } from "@/lib/supabase";

interface Pengaduan {
  id: string;
  nama_pelapor: string;
  kategori: string;
  judul: string;
  deskripsi: string;
  status: string;
  prioritas: string;
  created_at: string;
}

const KATEGORI = ["infrastruktur", "kebersihan", "keamanan", "sosial", "aspirasi", "lainnya"];
const KATEGORI_ICON: Record<string, string> = {
  infrastruktur: "🛣️", kebersihan: "🧹", keamanan: "🔒",
  sosial: "🤝", aspirasi: "💡", lainnya: "📝",
};
const STATUS_COLOR: Record<string, string> = {
  masuk: "#b8943f", diproses: "#1a3a6b", selesai: "#2d5a40", ditolak: "#8b0000",
};

const emptyForm = { nama_pelapor: "", no_wa_pelapor: "", kategori: "infrastruktur", judul: "", deskripsi: "" };

export default function PengaduanPage() {
  const [form, setForm] = useState(emptyForm);
  const [list, setList] = useState<Pengaduan[]>([]);
  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [activeTab, setActiveTab] = useState<"form" | "list">("form");

  async function fetchList() {
    if (!isSupabaseReady()) return;
    const { data } = await supabase
      .from("pengaduan")
      .select("id,nama_pelapor,kategori,judul,deskripsi,status,prioritas,created_at")
      .order("created_at", { ascending: false })
      .limit(20);
    if (data) setList(data as Pengaduan[]);
  }

  useEffect(() => { fetchList(); }, []);

  async function handleSubmit() {
    if (!form.judul || !form.deskripsi) return alert("Judul & deskripsi wajib diisi!");
    setLoading(true);
    await supabase.from("pengaduan").insert({
      ...form,
      nama_pelapor: form.nama_pelapor || "Anonim",
      status: "masuk",
      prioritas: "normal",
    });
    setLoading(false);
    setSubmitted(true);
    fetchList();
  }

  return (
    <div style={{ minHeight: "100vh", background: "#f5f0e8", fontFamily: "'Segoe UI',system-ui,sans-serif" }}>
      {/* Header */}
      <header style={{
        background: "#f5f0e8", borderBottom: "1px solid rgba(45,90,64,0.12)",
        padding: "clamp(12px, 3vw, 14px) clamp(16px, 4vw, 20px)", position: "sticky", top: 0, zIndex: 10,
        display: "flex", alignItems: "center", justifyContent: "space-between",
      }}>
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <a href="/" style={{ color: "#6b7c6d", textDecoration: "none", fontSize: 13 }}>← Beranda</a>
          <span style={{ color: "#c8bfaa" }}>|</span>
          <div>
            <div style={{ fontWeight: 800, fontSize: 15, color: "#1a2e1f" }}>📢 Pengaduan & Aspirasi</div>
            <div style={{ fontSize: 10, color: "#7a9a7e", textTransform: "uppercase", letterSpacing: "0.08em" }}>Suara Warga Ciburial</div>
          </div>
        </div>
        <div style={{ display: "flex", gap: 6 }}>
          {(["form", "list"] as const).map(t => (
            <button key={t} onClick={() => setActiveTab(t)} style={{
              padding: "6px 14px", borderRadius: 20, fontSize: 12, fontWeight: 600,
              border: "1.5px solid rgba(45,90,64,0.2)", cursor: "pointer",
              background: activeTab === t ? "#2d5a40" : "transparent",
              color: activeTab === t ? "white" : "#6b7c6d",
            }}>{t === "form" ? "Buat Laporan" : `Riwayat (${list.length})`}</button>
          ))}
        </div>
      </header>

      <div style={{ maxWidth: 700, margin: "0 auto", padding: "clamp(16px, 4vw, 24px) clamp(12px, 3vw, 16px)" }}>

        {/* Form Tab */}
        {activeTab === "form" && (
          submitted ? (
            <div style={{
              background: "white", borderRadius: 20, padding: "clamp(24px, 5vw, 40px)",
              textAlign: "center", border: "1px solid rgba(45,90,64,0.12)",
              boxShadow: "0 2px 12px rgba(0,0,0,0.06)",
            }}>
              <div style={{ fontSize: 48, marginBottom: 16 }}>✅</div>
              <h2 style={{ color: "#1a2e1f", margin: "0 0 8px", fontSize: 20 }}>Laporan Terkirim!</h2>
              <p style={{ color: "#6b7c6d", margin: "0 0 24px" }}>
                Terima kasih! Laporan kamu sudah diterima admin kampung dan akan segera ditindaklanjuti.
              </p>
              <button onClick={() => { setSubmitted(false); setForm(emptyForm); }}
                style={{
                  background: "#2d5a40", color: "white", border: "none",
                  borderRadius: 12, padding: "12px 28px", fontSize: 14,
                  fontWeight: 600, cursor: "pointer",
                }}>Buat Laporan Lain</button>
            </div>
          ) : (
            <div style={{
              background: "white", borderRadius: 20, padding: "clamp(16px, 4vw, 24px)",
              border: "1px solid rgba(45,90,64,0.12)",
              boxShadow: "0 2px 12px rgba(0,0,0,0.06)",
            }}>
              <h2 style={{ margin: "0 0 6px", color: "#1a2e1f", fontSize: 18 }}>Sampaikan Laporan / Aspirasi</h2>
              <p style={{ margin: "0 0 20px", color: "#7a9a7e", fontSize: 13 }}>
                Identitas pelapor bersifat opsional dan tidak ditampilkan publik.
              </p>

              {/* Kategori pills */}
              <div style={{ marginBottom: 16 }}>
                <label style={{ fontSize: 11, fontWeight: 700, color: "#6b7c6d", letterSpacing: "0.06em", textTransform: "uppercase", display: "block", marginBottom: 8 }}>Kategori</label>
                <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
                  {KATEGORI.map(k => (
                    <button key={k} onClick={() => setForm({ ...form, kategori: k })}
                      style={{
                        padding: "7px 14px", borderRadius: 20, fontSize: 13,
                        border: "1.5px solid rgba(45,90,64,0.2)", cursor: "pointer",
                        background: form.kategori === k ? "#2d5a40" : "transparent",
                        color: form.kategori === k ? "white" : "#2d5a40",
                        fontWeight: 500,
                      }}>
                      {KATEGORI_ICON[k]} {k.charAt(0).toUpperCase() + k.slice(1)}
                    </button>
                  ))}
                </div>
              </div>

              {/* Fields */}
              {[
                { label: "Judul Laporan *", key: "judul", placeholder: "Contoh: Jalan RT 02 berlubang", type: "input" },
                { label: "Nama (Opsional)", key: "nama_pelapor", placeholder: "Nama kamu atau kosongkan", type: "input" },
                { label: "No. WhatsApp (Opsional)", key: "no_wa_pelapor", placeholder: "Untuk notif update laporan", type: "input" },
              ].map(f => (
                <div key={f.key} style={{ marginBottom: 14 }}>
                  <label style={{ fontSize: 11, fontWeight: 700, color: "#6b7c6d", letterSpacing: "0.06em", textTransform: "uppercase", display: "block", marginBottom: 6 }}>{f.label}</label>
                  <input
                    value={(form as any)[f.key]}
                    onChange={e => setForm({ ...form, [f.key]: e.target.value })}
                    placeholder={f.placeholder}
                    style={{
                      width: "100%", padding: "10px 14px", borderRadius: 12,
                      border: "1.5px solid rgba(45,90,64,0.2)", fontSize: 14,
                      background: "#fafaf8", outline: "none", boxSizing: "border-box",
                    }}
                  />
                </div>
              ))}

              <div style={{ marginBottom: 20 }}>
                <label style={{ fontSize: 11, fontWeight: 700, color: "#6b7c6d", letterSpacing: "0.06em", textTransform: "uppercase", display: "block", marginBottom: 6 }}>Deskripsi *</label>
                <textarea
                  value={form.deskripsi}
                  onChange={e => setForm({ ...form, deskripsi: e.target.value })}
                  placeholder="Ceritakan secara detail masalah atau aspirasi kamu..."
                  rows={4}
                  style={{
                    width: "100%", padding: "10px 14px", borderRadius: 12,
                    border: "1.5px solid rgba(45,90,64,0.2)", fontSize: 14,
                    background: "#fafaf8", outline: "none", resize: "vertical",
                    boxSizing: "border-box", fontFamily: "inherit",
                  }}
                />
              </div>

              <button onClick={handleSubmit} disabled={loading}
                style={{
                  width: "100%", background: "#2d5a40", color: "white",
                  border: "none", borderRadius: 14, padding: "14px",
                  fontSize: 15, fontWeight: 700, cursor: loading ? "not-allowed" : "pointer",
                  boxShadow: "0 2px 10px rgba(45,90,64,0.3)",
                }}>
                {loading ? "Mengirim..." : "📤 Kirim Laporan"}
              </button>
            </div>
          )
        )}

        {/* List Tab */}
        {activeTab === "list" && (
          <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
            {list.length === 0 ? (
              <div style={{ textAlign: "center", padding: "clamp(24px, 5vw, 40px)", color: "#a8b5a9" }}>Belum ada laporan</div>
            ) : list.map(p => (
              <div key={p.id} style={{
                background: "white", borderRadius: 16, padding: "clamp(12px, 3vw, 16px) clamp(14px, 4vw, 18px)",
                border: "1px solid rgba(45,90,64,0.1)",
                boxShadow: "0 1px 6px rgba(0,0,0,0.04)",
              }}>
                <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 10 }}>
                  <div style={{ flex: 1 }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 6 }}>
                      <span style={{ fontSize: 16 }}>{KATEGORI_ICON[p.kategori] || "📝"}</span>
                      <span style={{ fontWeight: 700, fontSize: 14, color: "#1a2e1f" }}>{p.judul}</span>
                    </div>
                    <p style={{ margin: "0 0 8px", fontSize: 13, color: "#6b7c6d", lineHeight: 1.5 }}>
                      {p.deskripsi.length > 120 ? p.deskripsi.slice(0, 120) + "..." : p.deskripsi}
                    </p>
                    <div style={{ fontSize: 11, color: "#a8b5a9" }}>
                      👤 {p.nama_pelapor} · {new Date(p.created_at).toLocaleDateString("id-ID", { day: "numeric", month: "short", year: "numeric" })}
                    </div>
                  </div>
                  <div style={{
                    background: STATUS_COLOR[p.status] + "15",
                    color: STATUS_COLOR[p.status],
                    border: `1px solid ${STATUS_COLOR[p.status]}30`,
                    borderRadius: 20, padding: "4px 10px",
                    fontSize: 11, fontWeight: 600,
                    textTransform: "capitalize", flexShrink: 0,
                  }}>{p.status}</div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}