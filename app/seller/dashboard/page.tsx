"use client";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { supabase, isSupabaseReady } from "@/lib/supabase";
import { 
  Store, Package, ShoppingBag, LogOut, Plus, Edit2, 
  Trash2, Wallet, CheckCircle, Clock, X, Image as ImageIcon
} from "lucide-react";
import "../../globals.css";

export default function SellerDashboard() {
  const router = useRouter();
  const [tokoId, setTokoId] = useState<string | null>(null);
  const [toko, setToko] = useState<any>(null);
  const [tab, setTab] = useState<"dashboard" | "produk" | "pesanan">("dashboard");
  const [produk, setProduk] = useState<any[]>([]);
  const [pesanan, setPesanan] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showFormProduk, setShowFormProduk] = useState(false);
  const [formProduk, setFormProduk] = useState({ id: "", nama: "", deskripsi: "", harga: 0, kategori: "makanan", foto: "" });

  useEffect(() => {
    // Cek session
    const sessionStr = localStorage.getItem("seller_session");
    if (!sessionStr) {
      router.push("/seller");
      return;
    }
    const session = JSON.parse(sessionStr);
    setTokoId(session.id);
  }, [router]);

  useEffect(() => {
    if (!tokoId || !isSupabaseReady()) return;
    fetchData();
  }, [tokoId, tab]);

  async function fetchData() {
    setLoading(true);
    
    // Fetch Toko
    const { data: tData } = await supabase.from("toko").select("*").eq("id", tokoId).single();
    if (tData) setToko(tData);

    if (tab === "dashboard" || tab === "produk") {
      const { data: pData } = await supabase.from("produk").select("*").eq("toko_id", tokoId).order("created_at", { ascending: false });
      if (pData) setProduk(pData);
    }

    if (tab === "dashboard" || tab === "pesanan") {
      // Ambil detail pesanan yang itemnya ada di toko ini
      // Sederhananya, jika struktur orders_marketplace menyimpan toko_id, kita pakai itu.
      // Jika di phase 1 kita tambahkan toko_id di orders_marketplace
      const { data: ordData } = await supabase.from("orders_marketplace").select("*, pembeli(*)").eq("toko_id", tokoId).order("created_at", { ascending: false });
      if (ordData) setPesanan(ordData);
    }

    setLoading(false);
  }

  function handleLogout() {
    localStorage.removeItem("seller_session");
    router.push("/seller");
  }

  async function simpanProduk() {
    if (!formProduk.nama || formProduk.harga <= 0) {
      alert("Nama dan harga valid wajib diisi.");
      return;
    }
    
    const payload = {
      nama: formProduk.nama,
      deskripsi: formProduk.deskripsi,
      harga: formProduk.harga,
      kategori: formProduk.kategori,
      foto: formProduk.foto,
      toko_id: tokoId,
      status: "aktif"
    };

    if (formProduk.id) {
      await supabase.from("produk").update(payload).eq("id", formProduk.id);
    } else {
      await supabase.from("produk").insert(payload);
    }

    setShowFormProduk(false);
    setFormProduk({ id: "", nama: "", deskripsi: "", harga: 0, kategori: "makanan", foto: "" });
    fetchData();
  }

  async function hapusProduk(id: string) {
    if (!confirm("Hapus produk ini?")) return;
    await supabase.from("produk").delete().eq("id", id);
    fetchData();
  }

  async function updateStatusPesanan(id: string, statusBaru: string) {
    await supabase.from("orders_marketplace").update({ status: statusBaru }).eq("id", id);
    fetchData();
  }

  if (loading && !toko) return <div className="min-h-screen flex items-center justify-center bg-[var(--cr)]">Loading...</div>;

  return (
    <div className="min-h-screen bg-[var(--cr)] font-sans flex flex-col md:flex-row">
      {/* Sidebar Mobile */}
      <div className="md:hidden bg-white border-b border-[var(--bo)] p-4 flex items-center justify-between sticky top-0 z-50">
        <div className="font-bold text-[var(--fo)] flex items-center gap-2"><Store size={20} /> {toko?.nama_toko}</div>
        <button onClick={handleLogout} className="text-[var(--rt)]"><LogOut size={20} /></button>
      </div>

      {/* Sidebar Desktop */}
      <div className="hidden md:flex flex-col w-64 bg-white border-r border-[var(--bo)] min-h-screen sticky top-0">
        <div className="p-6 border-b border-[var(--bo)]">
          <div className="w-16 h-16 bg-[var(--gb)] rounded-2xl flex items-center justify-center text-[var(--fo)] mb-4">
            <Store size={32} />
          </div>
          <div className="font-bold text-lg text-[var(--tp)]">{toko?.nama_toko}</div>
          <div className="text-sm text-[var(--ts)] flex items-center gap-1 mt-1"><CheckCircle size={14} className="text-[var(--accent)]"/> Toko Aktif</div>
        </div>
        <div className="flex-1 p-4 space-y-2">
          {[
            { id: "dashboard", icon: <Wallet size={20}/>, label: "Dashboard" },
            { id: "produk", icon: <Package size={20}/>, label: "Kelola Produk" },
            { id: "pesanan", icon: <ShoppingBag size={20}/>, label: "Pesanan Masuk" },
          ].map(item => (
            <button 
              key={item.id} 
              onClick={() => setTab(item.id as any)}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl font-semibold transition-all ${
                tab === item.id 
                  ? "bg-[var(--fo)] text-white shadow-md shadow-[rgba(45,90,64,0.2)]" 
                  : "text-[var(--ts)] hover:bg-[var(--gb)] hover:text-[var(--fo)]"
              }`}
            >
              {item.icon} {item.label}
            </button>
          ))}
        </div>
        <div className="p-4 border-t border-[var(--bo)]">
          <button onClick={handleLogout} className="w-full flex items-center gap-3 px-4 py-3 rounded-xl font-semibold text-[var(--rt)] hover:bg-[var(--rb)] transition-all">
            <LogOut size={20}/> Keluar
          </button>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 p-4 md:p-8">
        
        {/* Mobile Navigation Tabs */}
        <div className="flex md:hidden bg-white p-1 rounded-xl shadow-sm mb-6 border border-[var(--bo)]">
          {[
            { id: "dashboard", label: "Dashboard" },
            { id: "produk", label: "Produk" },
            { id: "pesanan", label: "Pesanan" },
          ].map(item => (
            <button 
              key={item.id} 
              onClick={() => setTab(item.id as any)}
              className={`flex-1 py-2 text-sm font-bold rounded-lg transition-all ${
                tab === item.id ? "bg-[var(--fo)] text-white" : "text-[var(--ts)]"
              }`}
            >
              {item.label}
            </button>
          ))}
        </div>

        {tab === "dashboard" && (
          <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
            <h2 className="fnt text-3xl font-bold text-[var(--tp)] mb-6">Ringkasan Toko</h2>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mb-8">
              <div className="card-heroic p-6 rounded-2xl border border-[var(--bo)] bg-gradient-to-br from-white to-[var(--gb)]">
                <div className="w-10 h-10 rounded-full bg-[rgba(47,143,78,0.1)] flex items-center justify-center text-[var(--accent)] mb-4"><Wallet size={20}/></div>
                <div className="text-[var(--ts)] text-sm font-semibold mb-1">Total Saldo</div>
                <div className="text-2xl font-black text-[var(--fo)]">Rp {toko?.saldo?.toLocaleString("id-ID") || 0}</div>
              </div>
              <div className="card-heroic p-6 rounded-2xl border border-[var(--bo)] bg-white">
                <div className="w-10 h-10 rounded-full bg-[rgba(184,148,63,0.1)] flex items-center justify-center text-[var(--go)] mb-4"><Package size={20}/></div>
                <div className="text-[var(--ts)] text-sm font-semibold mb-1">Total Produk</div>
                <div className="text-2xl font-black text-[var(--tp)]">{produk.length}</div>
              </div>
              <div className="card-heroic p-6 rounded-2xl border border-[var(--bo)] bg-white col-span-2 md:col-span-1">
                <div className="w-10 h-10 rounded-full bg-[rgba(26,58,107,0.1)] flex items-center justify-center text-[#1a3a6b] mb-4"><ShoppingBag size={20}/></div>
                <div className="text-[var(--ts)] text-sm font-semibold mb-1">Pesanan (Menunggu)</div>
                <div className="text-2xl font-black text-[var(--tp)]">{pesanan.filter(p => p.status === "pending").length}</div>
              </div>
            </div>
          </div>
        )}

        {tab === "produk" && (
          <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
            <div className="flex justify-between items-center mb-6">
              <h2 className="fnt text-3xl font-bold text-[var(--tp)]">Katalog Produk</h2>
              <button 
                onClick={() => { setFormProduk({ id: "", nama: "", deskripsi: "", harga: 0, kategori: "makanan", foto: "" }); setShowFormProduk(true); }}
                className="btn-heroic py-2 px-4 rounded-xl flex items-center gap-2 text-sm"
              >
                <Plus size={16} /> Tambah
              </button>
            </div>

            {showFormProduk && (
              <div className="card-heroic p-6 rounded-2xl mb-6 bg-white border border-[var(--accent)]/30 relative">
                <button onClick={() => setShowFormProduk(false)} className="absolute top-4 right-4 text-[var(--ts)]"><X size={20}/></button>
                <h3 className="font-bold text-lg text-[var(--fo)] mb-4">{formProduk.id ? "Edit Produk" : "Tambah Produk"}</h3>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="col-span-1 md:col-span-2">
                    <label className="block text-xs font-bold text-[var(--ts)] uppercase mb-1">Nama Produk *</label>
                    <input type="text" value={formProduk.nama} onChange={e => setFormProduk({...formProduk, nama: e.target.value})} className="w-full border border-[var(--bo)] rounded-lg p-3 outline-none focus:border-[var(--accent)]" />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-[var(--ts)] uppercase mb-1">Harga (Rp) *</label>
                    <input type="number" value={formProduk.harga} onChange={e => setFormProduk({...formProduk, harga: parseInt(e.target.value) || 0})} className="w-full border border-[var(--bo)] rounded-lg p-3 outline-none focus:border-[var(--accent)]" />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-[var(--ts)] uppercase mb-1">Kategori</label>
                    <select value={formProduk.kategori} onChange={e => setFormProduk({...formProduk, kategori: e.target.value})} className="w-full border border-[var(--bo)] rounded-lg p-3 outline-none focus:border-[var(--accent)]">
                      <option value="makanan">Makanan & Minuman</option>
                      <option value="kerajinan">Kerajinan Tangan</option>
                      <option value="jasa">Jasa</option>
                      <option value="lainnya">Lainnya</option>
                    </select>
                  </div>
                  <div className="col-span-1 md:col-span-2">
                    <label className="block text-xs font-bold text-[var(--ts)] uppercase mb-1">Deskripsi</label>
                    <textarea value={formProduk.deskripsi} onChange={e => setFormProduk({...formProduk, deskripsi: e.target.value})} className="w-full border border-[var(--bo)] rounded-lg p-3 outline-none focus:border-[var(--accent)] min-h-[80px]" />
                  </div>
                  <div className="col-span-1 md:col-span-2">
                    <label className="block text-xs font-bold text-[var(--ts)] uppercase mb-1">URL Foto Produk</label>
                    <div className="flex gap-2">
                      <input type="text" value={formProduk.foto} onChange={e => setFormProduk({...formProduk, foto: e.target.value})} placeholder="https://..." className="flex-1 border border-[var(--bo)] rounded-lg p-3 outline-none focus:border-[var(--accent)]" />
                      {formProduk.foto && <img src={formProduk.foto} className="w-12 h-12 rounded-lg object-cover border border-[var(--bo)]" alt="Preview"/>}
                    </div>
                  </div>
                </div>
                
                <button onClick={simpanProduk} className="mt-6 w-full btn-heroic py-3 rounded-xl font-bold">
                  Simpan Produk
                </button>
              </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {produk.length === 0 && !showFormProduk && (
                <div className="col-span-full py-12 text-center text-[var(--ts)] border-2 border-dashed border-[var(--bo)] rounded-2xl">
                  Belum ada produk. Klik "Tambah" untuk mulai jualan.
                </div>
              )}
              {produk.map(p => (
                <div key={p.id} className="card-heroic bg-white p-4 rounded-2xl border border-[var(--bo)] flex gap-4 items-center">
                  <div className="w-16 h-16 bg-[var(--gb)] rounded-xl flex items-center justify-center text-2xl overflow-hidden shrink-0">
                    {p.foto ? <img src={p.foto} className="w-full h-full object-cover" /> : <ImageIcon className="text-[var(--fo)]"/>}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="font-bold text-[var(--tp)] truncate">{p.nama}</div>
                    <div className="text-[var(--accent)] font-extrabold text-sm">Rp {p.harga.toLocaleString("id-ID")}</div>
                  </div>
                  <div className="flex flex-col gap-2 shrink-0">
                    <button onClick={() => { setFormProduk(p); setShowFormProduk(true); window.scrollTo({top:0, behavior:"smooth"}); }} className="p-2 bg-[rgba(47,143,78,0.1)] text-[var(--fo)] rounded-lg hover:bg-[rgba(47,143,78,0.2)]">
                      <Edit2 size={16}/>
                    </button>
                    <button onClick={() => hapusProduk(p.id)} className="p-2 bg-[rgba(220,53,69,0.1)] text-[var(--rt)] rounded-lg hover:bg-[rgba(220,53,69,0.2)]">
                      <Trash2 size={16}/>
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {tab === "pesanan" && (
          <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
            <h2 className="fnt text-3xl font-bold text-[var(--tp)] mb-6">Kelola Pesanan</h2>
            <div className="space-y-4">
              {pesanan.length === 0 ? (
                <div className="py-12 text-center text-[var(--ts)] border-2 border-dashed border-[var(--bo)] rounded-2xl">
                  Belum ada pesanan masuk.
                </div>
              ) : pesanan.map(ord => (
                <div key={ord.id} className="card-heroic bg-white p-5 rounded-2xl border border-[var(--bo)]">
                  <div className="flex flex-col md:flex-row justify-between md:items-center gap-4 mb-4 border-b border-[var(--bo)] pb-4">
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        <span className="font-bold text-[var(--tp)]">Pesanan #{ord.id.slice(0,8).toUpperCase()}</span>
                        <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                          ord.status === 'pending' ? 'bg-[rgba(184,148,63,0.15)] text-[var(--go)]' :
                          ord.status === 'diproses' ? 'bg-[rgba(47,143,78,0.15)] text-[var(--accent)]' :
                          'bg-[rgba(45,90,64,0.15)] text-[var(--fo)]'
                        }`}>
                          {ord.status}
                        </span>
                      </div>
                      <div className="text-[var(--ts)] text-sm flex items-center gap-1">
                        <Clock size={14}/> {new Date(ord.created_at).toLocaleDateString("id-ID", {day:"numeric",month:"long",hour:"2-digit",minute:"2-digit"})}
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-[var(--ts)] text-sm">Total Belanja</div>
                      <div className="text-xl font-black text-[var(--fo)]">Rp {ord.total_harga.toLocaleString("id-ID")}</div>
                    </div>
                  </div>
                  
                  <div className="mb-4">
                    <div className="text-xs font-bold text-[var(--ts)] uppercase mb-2">Item Pesanan:</div>
                    {/* Asumsi JSON items order disimpen di kolom items */}
                    {(ord.items || []).map((it:any, idx:number) => (
                      <div key={idx} className="flex justify-between text-sm py-1">
                        <span>{it.qty}x {it.nama}</span>
                        <span className="font-semibold">Rp {(it.harga * it.qty).toLocaleString("id-ID")}</span>
                      </div>
                    ))}
                  </div>

                  <div className="bg-[var(--gb)] p-3 rounded-xl mb-4">
                    <div className="text-xs font-bold text-[var(--fo)] uppercase mb-1">Info Pembeli:</div>
                    <div className="text-sm font-semibold text-[var(--tp)]">{ord.pembeli?.nama || ord.guest_name}</div>
                    <div className="text-sm text-[var(--ts)] flex items-center gap-2 mt-1">
                      <a href={`https://wa.me/62${(ord.pembeli?.no_wa || ord.guest_phone || "").replace(/^0+/, '')}`} target="_blank" className="text-[#128C7E] font-bold flex items-center gap-1 no-underline hover:underline">
                        Hubungi via WA
                      </a>
                    </div>
                    {ord.catatan && <div className="text-sm text-[var(--ts)] mt-2 italic">" {ord.catatan} "</div>}
                  </div>

                  <div className="flex gap-2 justify-end pt-2">
                    {ord.status === 'pending' && (
                      <button onClick={() => updateStatusPesanan(ord.id, 'diproses')} className="btn-heroic py-2 px-4 rounded-lg text-sm font-bold shadow-md">
                        Terima & Proses
                      </button>
                    )}
                    {ord.status === 'diproses' && (
                      <button onClick={() => updateStatusPesanan(ord.id, 'selesai')} className="bg-[var(--fo)] text-white py-2 px-4 rounded-lg text-sm font-bold shadow-md hover:bg-[var(--fm)] transition-colors">
                        Tandai Selesai
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
