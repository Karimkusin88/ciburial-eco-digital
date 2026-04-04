"use client";
import { useState, useEffect } from "react";
import { supabase, isSupabaseReady } from "@/lib/supabase";

interface Anak { id: string; nama: string; tgl_lahir: string; jenis_kelamin: string; nama_ibu: string; no_wa_ibu: string; }
interface TumbuhKembang { id: string; anak_id: string; tanggal: string; bb_kg: number; tb_cm: number; status_gizi: string; catatan: string; }

const emptyAnak = { nama: "", tgl_lahir: "", jenis_kelamin: "L", nama_ibu: "", no_wa_ibu: "", kk_id: "" };
const emptyTK = { anak_id: "", tanggal: new Date().toISOString().split("T")[0], bb_kg: "", tb_cm: "", lila_cm: "", lk_cm: "", catatan: "" };

function hitungUmur(tgl: string) {
  const now = new Date(); const lahir = new Date(tgl);
  const bulan = (now.getFullYear() - lahir.getFullYear()) * 12 + (now.getMonth() - lahir.getMonth());
  return bulan < 24 ? `${bulan} bulan` : `${Math.floor(bulan / 12)} thn ${bulan % 12} bln`;
}

function statusGizi(bb: number, tb: number, bulan: number): { status: string; color: string } {
  const bbIdeal = bulan <= 12 ? bulan * 0.65 + 3 : 6 + (bulan - 12) * 0.22;
  const ratio = bb / bbIdeal;
  if (ratio >= 0.9) return { status: "normal", color: "#2d5a40" };
  if (ratio >= 0.75) return { status: "kurang", color: "#b8943f" };
  return { status: "buruk", color: "#8b0000" };
}

export default function AdminPosyanduPage() {
  const [anakList, setAnakList] = useState<Anak[]>([]);
  const [tkList, setTkList] = useState<TumbuhKembang[]>([]);
  const [formAnak, setFormAnak] = useState(emptyAnak);
  const [formTK, setFormTK] = useState(emptyTK);
  const [activeAnakId, setActiveAnakId] = useState<string | null>(null);
  const [tab, setTab] = useState<"daftar" | "input">("daftar");
  const [toast, setToast] = useState("");

  function showToast(msg: string) { setToast(msg); setTimeout(() => setToast(""), 3000); }

  async function fetchAll() {
    if (!isSupabaseReady()) return;
    const [a, tk] = await Promise.all([
      supabase.from("anak_posyandu").select("*").order("nama"),
      supabase.from("tumbuh_kembang").select("*").order("tanggal", { ascending: false }),
    ]);
    if (a.data) setAnakList(a.data as Anak[]);
    if (tk.data) setTkList(tk.data as TumbuhKembang[]);
  }

  useEffect(() => { fetchAll(); }, []);

  async function simpanAnak() {
    if (!formAnak.nama || !formAnak.tgl_lahir) return showToast("❌ Nama & tgl lahir wajib!");
    await supabase.from("anak_posyandu").insert(formAnak);
    showToast("✅ Data anak tersimpan!");
    setFormAnak(emptyAnak);
    fetchAll();
  }

  async function simpanTK() {
    if (!formTK.anak_id || !formTK.bb_kg) return showToast("❌ Pilih anak & isi BB!");
    const anak = anakList.find(a => a.id === formTK.anak_id)!;
    const bulan = Math.floor((new Date().getTime() - new Date(anak.tgl_lahir).getTime()) / (1000 * 60 * 60 * 24 * 30));
    const gz = statusGizi(Number(formTK.bb_kg), Number(formTK.tb_cm), bulan);
    await supabase.from("tumbuh_kembang").insert({ ...formTK, bb_kg: Number(formTK.bb_kg), tb_cm: Number(formTK.tb_cm), status_gizi: gz.status });
    showToast(`✅ Data tersimpan! Status: ${gz.status}`);
    if (gz.status !== "normal") showToast(`⚠️ Perhatian! Status gizi ${gz.status} - harap konsultasi ke bidan!`);
    setFormTK({ ...emptyTK, anak_id: formTK.anak_id });
    fetchAll();
  }

  const activeAnak = anakList.find(a => a.id === activeAnakId);
  const activeTK = tkList.filter(t => t.anak_id === activeAnakId);

  return (
    <div style={{ minHeight: "100vh", background: "#f5f0e8", fontFamily: "'Segoe UI',system-ui,sans-serif" }}>
      {toast && (
        <div style={{ position: "fixed", top: 20, left: "50%", transform: "translateX(-50%)", background: "#2d5a40", color: "white", padding: "10px 20px", borderRadius: 12, zIndex: 999, fontSize: 14 }}>{toast}</div>
      )}

      <header style={{ background: "#f5f0e8", borderBottom: "1px solid rgba(45,90,64,0.12)", padding: "14px 20px", position: "sticky", top: 0, zIndex: 10, display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <a href="/admin" style={{ color: "#6b7c6d", textDecoration: "none", fontSize: 13 }}>← Admin</a>
          <span style={{ color: "#c8bfaa" }}>|</span>
          <div>
            <div style={{ fontWeight: 800, fontSize: 15, color: "#1a2e1f" }}>👶 Posyandu Digital</div>
            <div style={{ fontSize: 10, color: "#7a9a7e", textTransform: "uppercase", letterSpacing: "0.08em" }}>{anakList.length} Anak Terdaftar</div>
          </div>
        </div>
        <div style={{ display: "flex", gap: 6 }}>
          {(["daftar", "input"] as const).map(t => (
            <button key={t} onClick={() => setTab(t)} style={{ padding: "6px 14px", borderRadius: 20, fontSize: 12, fontWeight: 600, border: "1.5px solid rgba(45,90,64,0.2)", cursor: "pointer", background: tab === t ? "#2d5a40" : "transparent", color: tab === t ? "white" : "#6b7c6d" }}>
              {t === "daftar" ? "📋 Daftar Anak" : "➕ Input Data"}
            </button>
          ))}
        </div>
      </header>

      <div style={{ maxWidth: 900, margin: "0 auto", padding: "20px 16px" }}>

        {/* Input Tab */}
        {tab === "input" && (
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
            {/* Form Daftar Anak */}
            <div style={{ background: "white", borderRadius: 16, padding: 20, border: "1px solid rgba(45,90,64,0.1)", boxShadow: "0 1px 6px rgba(0,0,0,0.04)" }}>
              <h3 style={{ margin: "0 0 16px", color: "#1a2e1f", fontSize: 15 }}>👶 Daftarkan Anak Baru</h3>
              {[
                { label: "Nama Anak *", key: "nama", placeholder: "Nama lengkap anak" },
                { label: "Nama Ibu *", key: "nama_ibu", placeholder: "Nama ibu kandung" },
                { label: "No. WA Ibu", key: "no_wa_ibu", placeholder: "08xxxxxxxxxx" },
              ].map(f => (
                <div key={f.key} style={{ marginBottom: 12 }}>
                  <label style={{ fontSize: 11, fontWeight: 700, color: "#6b7c6d", letterSpacing: "0.06em", textTransform: "uppercase", display: "block", marginBottom: 4 }}>{f.label}</label>
                  <input value={(formAnak as any)[f.key]} onChange={e => setFormAnak({ ...formAnak, [f.key]: e.target.value })} placeholder={f.placeholder}
                    style={{ width: "100%", padding: "9px 12px", borderRadius: 10, border: "1.5px solid rgba(45,90,64,0.2)", fontSize: 13, background: "#fafaf8", outline: "none", boxSizing: "border-box" }} />
                </div>
              ))}
              <div style={{ marginBottom: 12 }}>
                <label style={{ fontSize: 11, fontWeight: 700, color: "#6b7c6d", letterSpacing: "0.06em", textTransform: "uppercase", display: "block", marginBottom: 4 }}>Tanggal Lahir *</label>
                <input type="date" value={formAnak.tgl_lahir} onChange={e => setFormAnak({ ...formAnak, tgl_lahir: e.target.value })}
                  style={{ width: "100%", padding: "9px 12px", borderRadius: 10, border: "1.5px solid rgba(45,90,64,0.2)", fontSize: 13, background: "#fafaf8", outline: "none", boxSizing: "border-box" }} />
              </div>
              <div style={{ marginBottom: 16 }}>
                <label style={{ fontSize: 11, fontWeight: 700, color: "#6b7c6d", letterSpacing: "0.06em", textTransform: "uppercase", display: "block", marginBottom: 4 }}>Jenis Kelamin</label>
                <div style={{ display: "flex", gap: 8 }}>
                  {[{ v: "L", l: "👦 Laki-laki" }, { v: "P", l: "👧 Perempuan" }].map(({ v, l }) => (
                    <button key={v} onClick={() => setFormAnak({ ...formAnak, jenis_kelamin: v })}
                      style={{ flex: 1, padding: "8px", borderRadius: 10, border: "1.5px solid rgba(45,90,64,0.2)", cursor: "pointer", background: formAnak.jenis_kelamin === v ? "#2d5a40" : "transparent", color: formAnak.jenis_kelamin === v ? "white" : "#2d5a40", fontSize: 13, fontWeight: 600 }}>{l}</button>
                  ))}
                </div>
              </div>
              <button onClick={simpanAnak} style={{ width: "100%", background: "#2d5a40", color: "white", border: "none", borderRadius: 10, padding: "10px", fontSize: 14, fontWeight: 600, cursor: "pointer" }}>💾 Daftarkan</button>
            </div>

            {/* Form Input Tumbuh Kembang */}
            <div style={{ background: "white", borderRadius: 16, padding: 20, border: "1px solid rgba(45,90,64,0.1)", boxShadow: "0 1px 6px rgba(0,0,0,0.04)" }}>
              <h3 style={{ margin: "0 0 16px", color: "#1a2e1f", fontSize: 15 }}>📊 Input Tumbuh Kembang</h3>
              <div style={{ marginBottom: 12 }}>
                <label style={{ fontSize: 11, fontWeight: 700, color: "#6b7c6d", letterSpacing: "0.06em", textTransform: "uppercase", display: "block", marginBottom: 4 }}>Pilih Anak *</label>
                <select value={formTK.anak_id} onChange={e => setFormTK({ ...formTK, anak_id: e.target.value })}
                  style={{ width: "100%", padding: "9px 12px", borderRadius: 10, border: "1.5px solid rgba(45,90,64,0.2)", fontSize: 13, background: "#fafaf8", outline: "none" }}>
                  <option value="">-- Pilih anak --</option>
                  {anakList.map(a => <option key={a.id} value={a.id}>{a.nama} ({hitungUmur(a.tgl_lahir)})</option>)}
                </select>
              </div>
              <div style={{ marginBottom: 12 }}>
                <label style={{ fontSize: 11, fontWeight: 700, color: "#6b7c6d", letterSpacing: "0.06em", textTransform: "uppercase", display: "block", marginBottom: 4 }}>Tanggal Pemeriksaan</label>
                <input type="date" value={formTK.tanggal} onChange={e => setFormTK({ ...formTK, tanggal: e.target.value })}
                  style={{ width: "100%", padding: "9px 12px", borderRadius: 10, border: "1.5px solid rgba(45,90,64,0.2)", fontSize: 13, background: "#fafaf8", outline: "none", boxSizing: "border-box" }} />
              </div>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10, marginBottom: 12 }}>
                {[
                  { label: "BB (kg) *", key: "bb_kg", placeholder: "8.5" },
                  { label: "TB (cm)", key: "tb_cm", placeholder: "75" },
                  { label: "LILA (cm)", key: "lila_cm", placeholder: "14" },
                  { label: "LK (cm)", key: "lk_cm", placeholder: "46" },
                ].map(f => (
                  <div key={f.key}>
                    <label style={{ fontSize: 11, fontWeight: 700, color: "#6b7c6d", letterSpacing: "0.06em", textTransform: "uppercase", display: "block", marginBottom: 4 }}>{f.label}</label>
                    <input type="number" value={(formTK as any)[f.key]} onChange={e => setFormTK({ ...formTK, [f.key]: e.target.value })} placeholder={f.placeholder}
                      style={{ width: "100%", padding: "9px 12px", borderRadius: 10, border: "1.5px solid rgba(45,90,64,0.2)", fontSize: 13, background: "#fafaf8", outline: "none", boxSizing: "border-box" }} />
                  </div>
                ))}
              </div>
              <div style={{ marginBottom: 16 }}>
                <label style={{ fontSize: 11, fontWeight: 700, color: "#6b7c6d", letterSpacing: "0.06em", textTransform: "uppercase", display: "block", marginBottom: 4 }}>Catatan</label>
                <textarea value={formTK.catatan} onChange={e => setFormTK({ ...formTK, catatan: e.target.value })} placeholder="Catatan tambahan..." rows={2}
                  style={{ width: "100%", padding: "9px 12px", borderRadius: 10, border: "1.5px solid rgba(45,90,64,0.2)", fontSize: 13, background: "#fafaf8", outline: "none", resize: "none", fontFamily: "inherit", boxSizing: "border-box" }} />
              </div>
              <button onClick={simpanTK} style={{ width: "100%", background: "#2d5a40", color: "white", border: "none", borderRadius: 10, padding: "10px", fontSize: 14, fontWeight: 600, cursor: "pointer" }}>💾 Simpan Data</button>
            </div>
          </div>
        )}

        {/* Daftar Tab */}
        {tab === "daftar" && (
          <div style={{ display: "grid", gridTemplateColumns: activeAnak ? "1fr 1.5fr" : "1fr", gap: 16 }}>
            {/* List Anak */}
            <div>
              <div style={{ background: "white", borderRadius: 16, border: "1px solid rgba(45,90,64,0.1)", overflow: "hidden", boxShadow: "0 1px 6px rgba(0,0,0,0.04)" }}>
                {anakList.length === 0 ? (
                  <div style={{ padding: 40, textAlign: "center", color: "#a8b5a9" }}>Belum ada data anak</div>
                ) : anakList.map((a, i) => {
                  const lastTK = tkList.filter(t => t.anak_id === a.id)[0];
                  const bulan = Math.floor((new Date().getTime() - new Date(a.tgl_lahir).getTime()) / (1000 * 60 * 60 * 24 * 30));
                  const gz = lastTK ? statusGizi(lastTK.bb_kg, lastTK.tb_cm, bulan) : null;
                  return (
                    <div key={a.id} onClick={() => setActiveAnakId(a.id === activeAnakId ? null : a.id)}
                      style={{ padding: "14px 16px", borderBottom: i < anakList.length - 1 ? "1px solid rgba(45,90,64,0.07)" : "none", cursor: "pointer", background: activeAnakId === a.id ? "rgba(45,90,64,0.05)" : "transparent", display: "flex", alignItems: "center", gap: 12 }}>
                      <div style={{ width: 36, height: 36, borderRadius: 10, background: a.jenis_kelamin === "L" ? "rgba(26,58,107,0.1)" : "rgba(184,148,63,0.1)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 18, flexShrink: 0 }}>
                        {a.jenis_kelamin === "L" ? "👦" : "👧"}
                      </div>
                      <div style={{ flex: 1 }}>
                        <div style={{ fontWeight: 700, fontSize: 14, color: "#1a2e1f" }}>{a.nama}</div>
                        <div style={{ fontSize: 12, color: "#7a9a7e" }}>{hitungUmur(a.tgl_lahir)} · Ibu: {a.nama_ibu}</div>
                      </div>
                      {gz && (
                        <div style={{ background: gz.color + "15", color: gz.color, border: `1px solid ${gz.color}30`, borderRadius: 20, padding: "3px 10px", fontSize: 11, fontWeight: 600 }}>{gz.status}</div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Detail Anak */}
            {activeAnak && (
              <div style={{ background: "white", borderRadius: 16, padding: 20, border: "1px solid rgba(45,90,64,0.1)", boxShadow: "0 1px 6px rgba(0,0,0,0.04)" }}>
                <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 20, paddingBottom: 16, borderBottom: "1px solid rgba(45,90,64,0.1)" }}>
                  <div style={{ fontSize: 32 }}>{activeAnak.jenis_kelamin === "L" ? "👦" : "👧"}</div>
                  <div>
                    <div style={{ fontWeight: 800, fontSize: 16, color: "#1a2e1f" }}>{activeAnak.nama}</div>
                    <div style={{ fontSize: 12, color: "#7a9a7e" }}>{hitungUmur(activeAnak.tgl_lahir)} · Ibu: {activeAnak.nama_ibu}</div>
                  </div>
                </div>
                <h4 style={{ margin: "0 0 12px", color: "#1a2e1f", fontSize: 13, textTransform: "uppercase", letterSpacing: "0.06em" }}>Riwayat Tumbuh Kembang</h4>
                {activeTK.length === 0 ? (
                  <div style={{ textAlign: "center", padding: 24, color: "#a8b5a9", fontSize: 13 }}>Belum ada data pemeriksaan</div>
                ) : activeTK.map((tk, i) => {
                  const bulan = Math.floor((new Date(tk.tanggal).getTime() - new Date(activeAnak.tgl_lahir).getTime()) / (1000 * 60 * 60 * 24 * 30));
                  const gz = statusGizi(tk.bb_kg, tk.tb_cm, bulan);
                  return (
                    <div key={tk.id} style={{ padding: "12px 14px", borderRadius: 12, background: "#fafaf8", border: "1px solid rgba(45,90,64,0.08)", marginBottom: 8 }}>
                      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 6 }}>
                        <span style={{ fontWeight: 700, fontSize: 13, color: "#1a2e1f" }}>{new Date(tk.tanggal).toLocaleDateString("id-ID", { day: "numeric", month: "long", year: "numeric" })}</span>
                        <span style={{ background: gz.color + "15", color: gz.color, border: `1px solid ${gz.color}30`, borderRadius: 20, padding: "2px 8px", fontSize: 11, fontWeight: 600 }}>{gz.status}</span>
                      </div>
                      <div style={{ display: "flex", gap: 12, fontSize: 13, color: "#6b7c6d" }}>
                        <span>⚖️ {tk.bb_kg} kg</span>
                        {tk.tb_cm > 0 && <span>📏 {tk.tb_cm} cm</span>}
                        {tk.catatan && <span>📝 {tk.catatan}</span>}
                      </div>
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