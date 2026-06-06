"use client";
import { useState, useEffect, useRef } from "react";
import { 
  ArrowLeft, Store, Plus, X, Edit2, Trash2, Smartphone, 
  CreditCard, CheckCircle, Save, AlertCircle, ShoppingCart
} from "lucide-react";
import "../admin-styles-heroic.css";
import { supabase, isSupabaseReady } from "@/lib/supabase";

interface Toko {
  id: string;
  nama_toko: string;
  deskripsi: string;
  foto_toko: string;
  no_wa: string;
  nfc_uid: string;
  saldo: number;
  status: string;
  created_at: string;
}

const emptyToko = {
  nama_toko: "",
  deskripsi: "",
  foto_toko: "",
  no_wa: "",
  nfc_uid: "",
  status: "aktif"
};

const LS = { fontSize: 11, fontWeight: 700 as const, color: "#6b7c6d", letterSpacing: "0.06em", textTransform: "uppercase" as const, display: "block", marginBottom: 4 };
const IS = { width: "100%", padding: "9px 12px", borderRadius: 10, border: "1.5px solid rgba(45,90,64,0.2)", fontSize: 13, background: "#fafaf8", outline: "none", boxSizing: "border-box" as const, fontFamily: "inherit" };

export default function AdminTokoPage() {
  const [tokoList, setTokoList] = useState<Toko[]>([]);
  const [formToko, setFormToko] = useState(emptyToko);
  const [editId, setEditId] = useState<string | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState("");
  const [toast, setToast] = useState({ msg: "", ok: true });
  const [scanning, setScanning] = useState(false);
  const nfcRef = useRef<any>(null);

  function showToast(msg: string, ok = true) {
    setToast({ msg, ok });
    setTimeout(() => setToast({ msg: "", ok: true }), 3500);
  }

  async function fetchAll() {
    if (!isSupabaseReady()) return;
    const { data, error } = await supabase.from("toko").select("*").order("created_at", { ascending: false });
    if (data) setTokoList(data as Toko[]);
    if (error) showToast(`❌ Error: ${error.message}`, false);
  }

  useEffect(() => { fetchAll(); }, []);

  async function startNFC() {
    if (!("NDEFReader" in window)) return showToast("⚠️ Browser tidak support NFC", false);
    try {
      const ndef = new (window as any).NDEFReader();
      nfcRef.current = ndef;
      await ndef.scan();
      setScanning(true);
      showToast("📲 Tempelkan e-KTP penjual ke HP...");
      ndef.addEventListener("reading", ({ serialNumber }: any) => {
        const uid = serialNumber.replace(/:/g, "").toUpperCase();
        setFormToko(prev => ({ ...prev, nfc_uid: uid }));
        showToast("✅ NFC berhasil dibaca!");
        stopNFC();
      });
    } catch { 
      showToast("❌ Gagal aktifkan NFC", false); 
      setScanning(false);
    }
  }

  function stopNFC() {
    try { nfcRef.current?.stop?.(); } catch {}
    setScanning(false);
  }

  async function simpanToko() {
    if (!formToko.nama_toko) return showToast("❌ Nama toko wajib diisi!", false);
    setLoading(true);

    if (editId) {
      const { error } = await supabase.from("toko").update(formToko).eq("id", editId);
      if (error) showToast(`❌ ${error.message}`, false);
      else showToast("✅ Toko berhasil diupdate!");
    } else {
      const { error } = await supabase.from("toko").insert(formToko);
      if (error) showToast(`❌ ${error.message}`, false);
      else showToast("✅ Toko berhasil ditambahkan!");
    }

    setFormToko(emptyToko);
    setEditId(null);
    setShowForm(false);
    setLoading(false);
    fetchAll();
  }

  function editToko(toko: Toko) {
    setFormToko({
      nama_toko: toko.nama_toko,
      deskripsi: toko.deskripsi || "",
      foto_toko: toko.foto_toko || "",
      no_wa: toko.no_wa || "",
      nfc_uid: toko.nfc_uid || "",
      status: toko.status
    });
    setEditId(toko.id);
    setShowForm(true);
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  async function hapusToko(id: string) {
    if (!confirm("Hapus toko ini? Semua produk di dalamnya mungkin akan kehilangan referensi toko.")) return;
    const { error } = await supabase.from("toko").delete().eq("id", id);
    if (error) showToast(`❌ ${error.message}`, false);
    else {
      showToast("🗑️ Toko dihapus");
      fetchAll();
    }
  }

  const filtered = tokoList.filter(t => 
    t.nama_toko.toLowerCase().includes(search.toLowerCase()) || 
    (t.no_wa && t.no_wa.includes(search))
  );

  return (
    <div className="admin-page heroic-bg" style={{ minHeight: "100vh", fontFamily: "'Segoe UI', system-ui, sans-serif" }}>
      {toast.msg && (
        <div style={{ position: "fixed", top: 20, left: "50%", transform: "translateX(-50%)", background: toast.ok ? "#2d5a40" : "#dc3545", color: "white", padding: "10px 20px", borderRadius: 12, zIndex: 999, fontSize: 14, boxShadow: "0 4px 20px rgba(0,0,0,0.15)", maxWidth: "85vw", textAlign: "center" }}>
          {toast.msg}
        </div>
      )}

      <header style={{ background: "#f5f0e8", borderBottom: "1px solid rgba(45,90,64,0.12)", padding: "14px 20px", position: "sticky", top: 0, zIndex: 10, display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <a href="/admin" style={{ color: "#6b7c6d", textDecoration: "none", fontSize: 13, display: "flex", alignItems: "center", gap: 4 }}><ArrowLeft size={14} /> Admin</a>
          <span style={{ color: "#c8bfaa" }}>|</span>
          <div>
            <div style={{ fontWeight: 800, fontSize: 15, color: "#1a2e1f", display: "flex", alignItems: "center", gap: 6 }}><Store size={18} /> Kelola Toko & Penjual</div>
            <div style={{ fontSize: 10, color: "#7a9a7e", textTransform: "uppercase", letterSpacing: "0.08em" }}>{tokoList.length} Toko Terdaftar</div>
          </div>
        </div>
        <button onClick={() => { setFormToko(emptyToko); setEditId(null); setShowForm(!showForm); }} style={{ background: "#2d5a40", color: "white", border: "none", borderRadius: 10, padding: "8px 16px", fontSize: 13, fontWeight: 600, cursor: "pointer", display: "flex", alignItems: "center", gap: 6 }}>
          {showForm ? <><X size={16} /> Tutup</> : <><Plus size={16} /> Tambah Toko</>}
        </button>
      </header>

      <div style={{ maxWidth: 800, margin: "0 auto", padding: "20px 16px" }}>
        
        {/* FORM TOKO */}
        {showForm && (
          <div className="card-heroic" style={{ marginBottom: 20 }}>
            <h3 style={{ margin: "0 0 16px", color: "#1a2e1f", fontSize: 15, display: "flex", alignItems: "center", gap: 8 }}>
              {editId ? <><Edit2 size={16} /> Edit Toko</> : <><Plus size={16} /> Tambah Toko Baru</>}
            </h3>
            
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
              <div style={{ gridColumn: "1/-1" }}>
                <label style={LS}>Nama Toko *</label>
                <input value={formToko.nama_toko} onChange={e => setFormToko({ ...formToko, nama_toko: e.target.value })} placeholder="Ciburial Store" style={IS} />
              </div>
              <div style={{ gridColumn: "1/-1" }}>
                <label style={LS}>Deskripsi Toko</label>
                <textarea value={formToko.deskripsi} onChange={e => setFormToko({ ...formToko, deskripsi: e.target.value })} placeholder="Jual sayuran, makanan, dsb" style={{ ...IS, minHeight: 80, resize: "vertical" }} />
              </div>
              <div>
                <label style={LS}>No. WhatsApp</label>
                <input value={formToko.no_wa} onChange={e => setFormToko({ ...formToko, no_wa: e.target.value })} placeholder="08xxxxxxxxxx" style={IS} />
              </div>
              <div>
                <label style={LS}>Status</label>
                <select value={formToko.status} onChange={e => setFormToko({ ...formToko, status: e.target.value })} style={IS}>
                  <option value="aktif">Aktif</option>
                  <option value="nonaktif">Nonaktif</option>
                </select>
              </div>
              <div style={{ gridColumn: "1/-1" }}>
                <label style={LS}>NFC e-KTP Penjual (Akses Dashboard)</label>
                <div style={{ display: "flex", gap: 8 }}>
                  <input value={formToko.nfc_uid} onChange={e => setFormToko({ ...formToko, nfc_uid: e.target.value })} placeholder="ID e-KTP NFC" style={{ ...IS, flex: 1, fontFamily: "monospace" }} />
                  <button onClick={scanning ? stopNFC : startNFC} style={{ background: scanning ? "#dc3545" : "#0066cc", color: "white", border: "none", borderRadius: 10, padding: "0 16px", fontSize: 12, fontWeight: 700, cursor: "pointer", display: "flex", alignItems: "center", gap: 6, whiteSpace: "nowrap" }}>
                    <CreditCard size={14} /> {scanning ? "Batal Scan" : "Scan NFC"}
                  </button>
                </div>
                {scanning && <div style={{ fontSize: 11, color: "#0066cc", marginTop: 6 }}>Menunggu scan kartu/e-KTP...</div>}
              </div>
            </div>

            <div style={{ display: "flex", gap: 10, marginTop: 16 }}>
              <button onClick={simpanToko} disabled={loading} className="btn-heroic" style={{ display: "flex", alignItems: "center", gap: 8 }}>
                <Save size={18} /> {loading ? "Menyimpan..." : "Simpan Toko"}
              </button>
              <button onClick={() => { setShowForm(false); setFormToko(emptyToko); setEditId(null); }} style={{ padding: "10px 20px", background: "transparent", border: "1.5px solid rgba(45,90,64,0.2)", borderRadius: 10, fontSize: 14, color: "#6b7c6d", cursor: "pointer" }}>
                Batal
              </button>
            </div>
          </div>
        )}

        <input value={search} onChange={e => setSearch(e.target.value)} placeholder="🔍 Cari nama toko atau no WA..."
          style={{ width: "100%", padding: "11px 16px", borderRadius: 12, border: "1.5px solid rgba(45,90,64,0.2)", fontSize: 14, background: "white", outline: "none", marginBottom: 16, boxSizing: "border-box" }} />

        <div className="card-heroic">
          {filtered.length === 0 ? (
            <div style={{ padding: 40, textAlign: "center", color: "#a8b5a9" }}>{search ? "Toko tidak ditemukan" : "Belum ada toko"}</div>
          ) : filtered.map((toko, i) => (
            <div key={toko.id} style={{ padding: "14px 18px", borderBottom: i < filtered.length - 1 ? "1px solid rgba(45,90,64,0.07)" : "none", display: "flex", alignItems: "center", gap: 12 }}>
              <div style={{ width: 44, height: 44, borderRadius: 12, background: "rgba(45,90,64,0.08)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 20, flexShrink: 0, color: "#2d5a40" }}>
                <Store size={22} />
              </div>
              <div style={{ flex: 1 }}>
                <div style={{ fontWeight: 700, fontSize: 15, color: "#1a2e1f", display: "flex", alignItems: "center", gap: 6 }}>
                  {toko.nama_toko}
                  {toko.status === "aktif" ? 
                    <span style={{ fontSize: 9, background: "rgba(45,90,64,0.1)", color: "#2d5a40", borderRadius: 10, padding: "2px 6px", fontWeight: 700 }}>AKTIF</span> : 
                    <span style={{ fontSize: 9, background: "rgba(220,53,69,0.1)", color: "#dc3545", borderRadius: 10, padding: "2px 6px", fontWeight: 700 }}>NONAKTIF</span>
                  }
                </div>
                <div style={{ fontSize: 12, color: "#7a9a7e", marginTop: 4, display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
                  {toko.no_wa && <span style={{ display: "flex", alignItems: "center", gap: 4 }}><Smartphone size={12} /> {toko.no_wa}</span>}
                  {toko.nfc_uid ? 
                    <span style={{ display: "flex", alignItems: "center", gap: 4, color: "#0066cc" }}><CreditCard size={12} /> Terhubung e-KTP</span> : 
                    <span style={{ display: "flex", alignItems: "center", gap: 4, color: "#b8943f" }}><AlertCircle size={12} /> Belum ada e-KTP</span>
                  }
                </div>
                <div style={{ fontSize: 12, color: "#2d5a40", fontWeight: 600, marginTop: 4 }}>Saldo: Rp {toko.saldo.toLocaleString("id-ID")}</div>
              </div>
              
              <div style={{ display: "flex", gap: 4 }}>
                <button onClick={() => editToko(toko)} style={{ background: "rgba(45,90,64,0.08)", border: "none", borderRadius: 8, padding: "8px 10px", cursor: "pointer", fontSize: 13, color: "#2d5a40" }}>
                  <Edit2 size={16} />
                </button>
                <button onClick={() => hapusToko(toko.id)} style={{ background: "rgba(220,53,69,0.08)", border: "none", borderRadius: 8, padding: "8px 10px", cursor: "pointer", fontSize: 13, color: "#dc3545" }}>
                  <Trash2 size={16} />
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
