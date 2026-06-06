"use client";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { supabase, isSupabaseReady } from "@/lib/supabase";
import { 
  Store, Package, ShoppingBag, LogOut, Plus, Edit2, 
  Trash2, Wallet, CheckCircle, Clock, X, Image as ImageIcon,
  Upload, Loader2, Settings
} from "lucide-react";
import "../../globals.css";

export default function SellerDashboard() {
  const router = useRouter();
  const [tokoId, setTokoId] = useState<string | null>(null);
  const [toko, setToko] = useState<any>(null);
  const [tab, setTab] = useState<"dashboard" | "produk" | "pesanan" | "pengaturan">("dashboard");
  const [produk, setProduk] = useState<any[]>([]);
  const [pesanan, setPesanan] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [showFormProduk, setShowFormProduk] = useState(false);
  const [formProduk, setFormProduk] = useState({ 
    id: "", nama: "", deskripsi: "", harga: 0, kategori: "makanan", fotos: [] as string[]
  });
  const [formToko, setFormToko] = useState({
    nama_toko: "", deskripsi: "", foto_toko: ""
  });
  const [savingToko, setSavingToko] = useState(false);

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
    if (tData) {
      setToko(tData);
      setFormToko({
        nama_toko: tData.nama_toko || "",
        deskripsi: tData.deskripsi || "",
        foto_toko: tData.foto_toko || ""
      });
    }

    if (tab === "dashboard" || tab === "produk") {
      const { data: pData } = await supabase.from("produk").select("*").eq("toko_id", tokoId).order("created_at", { ascending: false });
      if (pData) setProduk(pData);
    }

    if (tab === "dashboard" || tab === "pesanan") {
      const { data: ordData } = await supabase.from("orders_marketplace").select("*, pembeli(*)").eq("toko_id", tokoId).order("created_at", { ascending: false });
      if (ordData) setPesanan(ordData);
    }

    setLoading(false);
  }

  function handleLogout() {
    localStorage.removeItem("seller_session");
    router.push("/seller");
  }

  const uploadToSupabase = async (file: File) => {
    const ext = file.name.split('.').pop() || "jpg";
    const fName = `ast_${Date.now()}_${Math.random().toString(36).substring(7)}.${ext}`;
    const { error } = await supabase.storage.from('ciburial-assets').upload(fName, file);
    if (error) throw error;
    return supabase.storage.from('ciburial-assets').getPublicUrl(fName).data.publicUrl;
  };

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    if (files.length === 0) return;
    
    if (formProduk.fotos.length + files.length > 5) {
      alert("Maksimal 5 foto per produk.");
      return;
    }

    setUploading(true);
    try {
      const newUrls = [...formProduk.fotos];
      for (const file of files) {
        if (!file.type.startsWith("image/")) continue;
        const url = await uploadToSupabase(file);
        newUrls.push(url);
      }
      setFormProduk({ ...formProduk, fotos: newUrls });
    } catch (err) {
      console.error(err);
      alert("Gagal mengunggah gambar. Silakan coba lagi.");
    } finally {
      setUploading(false);
      // Reset input value so the same file can be selected again
      e.target.value = '';
    }
  };

  const removeFoto = (index: number) => {
    const newFotos = [...formProduk.fotos];
    newFotos.splice(index, 1);
    setFormProduk({ ...formProduk, fotos: newFotos });
  };

  const uploadFotoToko = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files || e.target.files.length === 0) return;
    const file = e.target.files[0];
    const fileExt = file.name.split('.').pop();
    const fileName = `toko_${tokoId}_${Date.now()}.${fileExt}`;

    setUploading(true);
    try {
      const { error: uploadError } = await supabase.storage.from('ciburial-assets').upload(fileName, file);
      if (uploadError) throw uploadError;

      const { data } = supabase.storage.from('ciburial-assets').getPublicUrl(fileName);
      setFormToko({ ...formToko, foto_toko: data.publicUrl });
    } catch (e: any) {
      alert("Gagal upload foto toko: " + e.message);
    } finally {
      setUploading(false);
    }
  };

  async function simpanPengaturanToko() {
    if (!formToko.nama_toko.trim()) return alert("Nama toko tidak boleh kosong!");
    setSavingToko(true);
    try {
      const { error } = await supabase.from("toko").update({
        nama_toko: formToko.nama_toko,
        deskripsi: formToko.deskripsi,
        foto_toko: formToko.foto_toko
      }).eq("id", tokoId);
      
      if (error) throw error;
      alert("Pengaturan toko berhasil disimpan!");
      fetchData();
    } catch (e: any) {
      alert("Gagal menyimpan: " + e.message);
    } finally {
      setSavingToko(false);
    }
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
      tag: formProduk.kategori,
      foto: formProduk.fotos.length > 0 ? formProduk.fotos[0] : "",
      fotos: formProduk.fotos,
      toko_id: tokoId,
      aktif: true
    };

    let error = null;
    if (formProduk.id) {
      const res = await supabase.from("produk").update(payload).eq("id", formProduk.id);
      error = res.error;
    } else {
      const res = await supabase.from("produk").insert(payload);
      error = res.error;
    }

    if (error) {
      alert("Gagal menyimpan produk: " + error.message);
      console.error(error);
      return;
    }

    setShowFormProduk(false);
    setFormProduk({ id: "", nama: "", deskripsi: "", harga: 0, kategori: "makanan", fotos: [] });
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

  if (loading && !toko) return <div className="min-h-screen flex items-center justify-center bg-[var(--cr)]"><Loader2 className="animate-spin text-[var(--accent)]" size={40} /></div>;

  return (
    <div className="min-h-screen bg-[var(--cr)] font-sans flex flex-col md:flex-row">
      {/* Sidebar Mobile */}
      <div className="md:hidden bg-white/80 backdrop-blur-md border-b border-[var(--bo)] p-4 flex items-center justify-between sticky top-0 z-50 shadow-sm">
        <div className="font-bold text-[var(--fo)] flex items-center gap-2">
          <div className="w-8 h-8 rounded-full bg-gradient-to-br from-[var(--fo)] to-[var(--accent)] text-white flex items-center justify-center shadow-md">
            <Store size={16} />
          </div>
          {toko?.nama_toko}
        </div>
        <button onClick={handleLogout} className="p-2 bg-[var(--rb)] text-[var(--rt)] rounded-full shadow-sm hover:bg-red-100 transition-colors"><LogOut size={18} /></button>
      </div>

      {/* Sidebar Desktop */}
      <div className="hidden md:flex flex-col w-72 bg-white/60 backdrop-blur-xl border-r border-[var(--bo)] min-h-screen sticky top-0 shadow-[4px_0_24px_rgba(45,90,64,0.03)]">
        <div className="p-8 border-b border-[var(--bo)] relative overflow-hidden">
          <div className="absolute top-0 right-0 w-32 h-32 bg-[var(--accent)]/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/3"></div>
          <div className="w-16 h-16 bg-gradient-to-br from-[var(--fo)] to-[var(--accent)] rounded-2xl flex items-center justify-center text-white mb-4 shadow-lg shadow-[var(--fo)]/20 relative z-10">
            <Store size={32} />
          </div>
          <div className="font-bold text-xl text-[var(--tp)] relative z-10">{toko?.nama_toko}</div>
          <div className="text-sm font-semibold text-[var(--ts)] flex items-center gap-1.5 mt-2 relative z-10 bg-[var(--gb)] w-fit px-3 py-1 rounded-full border border-[var(--accent)]/20"><CheckCircle size={14} className="text-[var(--accent)]"/> Toko Terverifikasi</div>
        </div>
        <div className="flex-1 p-5 space-y-2">
          {[
            { id: "dashboard", icon: <Wallet size={20}/>, label: "Dashboard" },
            { id: "produk", icon: <Package size={20}/>, label: "Katalog Produk" },
            { id: "pesanan", icon: <ShoppingBag size={20}/>, label: "Pesanan Masuk" },
            { id: "pengaturan", icon: <Settings size={20}/>, label: "Pengaturan Toko" },
          ].map(item => (
            <button 
              key={item.id} 
              onClick={() => setTab(item.id as any)}
              className={`w-full flex items-center gap-3 px-4 py-3.5 rounded-xl font-bold transition-all duration-300 ${
                tab === item.id 
                  ? "bg-gradient-to-r from-[var(--fo)] to-[var(--accent)] text-white shadow-md shadow-[var(--fo)]/20 translate-x-1" 
                  : "text-[var(--ts)] hover:bg-[var(--gb)] hover:text-[var(--fo)]"
              }`}
            >
              {item.icon} {item.label}
            </button>
          ))}
        </div>
        <div className="p-5 border-t border-[var(--bo)]">
          <button onClick={handleLogout} className="w-full flex items-center justify-center gap-2 px-4 py-3.5 rounded-xl font-bold text-[var(--rt)] bg-[var(--rb)] border border-[var(--rt)]/10 hover:bg-red-50 transition-all shadow-sm">
            <LogOut size={18}/> Keluar Dasbor
          </button>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 p-4 md:p-10 max-w-[1200px] mx-auto w-full">
        
        {/* Mobile Navigation Tabs */}
        <div className="flex md:hidden bg-white/80 backdrop-blur-md p-1.5 rounded-2xl shadow-sm mb-6 border border-[var(--bo)] sticky top-[76px] z-40">
          {[
            { id: "dashboard", label: "Ringkasan" },
            { id: "produk", label: "Produk" },
            { id: "pesanan", label: "Pesanan" },
            { id: "pengaturan", label: "Pengaturan" },
          ].map(item => (
            <button 
              key={item.id} 
              onClick={() => setTab(item.id as any)}
              className={`flex-1 py-2.5 text-sm font-bold rounded-xl transition-all duration-300 ${
                tab === item.id ? "bg-gradient-to-r from-[var(--fo)] to-[var(--accent)] text-white shadow-md shadow-[var(--fo)]/20" : "text-[var(--ts)]"
              }`}
            >
              {item.label}
            </button>
          ))}
        </div>

        {tab === "dashboard" && (
          <div className="animate-in fade-in slide-in-from-bottom-4 duration-700">
            <h2 className="fnt text-4xl font-light bg-gradient-to-br from-[var(--fo)] to-[var(--accent)] bg-clip-text text-transparent mb-8">
              Ringkasan Toko
            </h2>
            <div className="grid grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6 mb-8">
              <div className="card-heroic p-6 rounded-[24px] border border-[var(--accent)]/10 bg-gradient-to-br from-white to-[var(--gb)]/50 relative overflow-hidden group">
                <div className="absolute -right-6 -top-6 w-24 h-24 bg-[var(--accent)]/5 rounded-full blur-xl group-hover:scale-150 transition-transform duration-700"></div>
                <div className="w-12 h-12 rounded-2xl bg-[var(--fo)] flex items-center justify-center text-white mb-5 shadow-lg shadow-[var(--fo)]/20"><Wallet size={24}/></div>
                <div className="text-[var(--ts)] text-sm font-bold mb-1 uppercase tracking-wider">Total Saldo</div>
                <div className="text-3xl font-black text-[var(--tp)] tracking-tight">Rp {toko?.saldo?.toLocaleString("id-ID") || 0}</div>
              </div>
              <div className="card-heroic p-6 rounded-[24px] border border-[var(--go)]/10 bg-gradient-to-br from-white to-[rgba(184,148,63,0.05)] relative overflow-hidden group">
                <div className="absolute -right-6 -top-6 w-24 h-24 bg-[var(--go)]/5 rounded-full blur-xl group-hover:scale-150 transition-transform duration-700"></div>
                <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-[var(--go)] to-[var(--gl)] flex items-center justify-center text-white mb-5 shadow-lg shadow-[var(--go)]/20"><Package size={24}/></div>
                <div className="text-[var(--ts)] text-sm font-bold mb-1 uppercase tracking-wider">Total Produk</div>
                <div className="text-3xl font-black text-[var(--tp)] tracking-tight">{produk.length}</div>
              </div>
              <div className="card-heroic p-6 rounded-[24px] border border-[#1a3a6b]/10 bg-gradient-to-br from-white to-[rgba(26,58,107,0.05)] col-span-2 lg:col-span-1 relative overflow-hidden group">
                <div className="absolute -right-6 -top-6 w-24 h-24 bg-[#1a3a6b]/5 rounded-full blur-xl group-hover:scale-150 transition-transform duration-700"></div>
                <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-[#1a3a6b] to-[#2a5a9b] flex items-center justify-center text-white mb-5 shadow-lg shadow-[#1a3a6b]/20"><ShoppingBag size={24}/></div>
                <div className="text-[var(--ts)] text-sm font-bold mb-1 uppercase tracking-wider">Pesanan Baru</div>
                <div className="text-3xl font-black text-[var(--tp)] tracking-tight">{pesanan.filter(p => p.status === "pending").length}</div>
              </div>
            </div>
          </div>
        )}

        {tab === "produk" && (
          <div className="animate-in fade-in slide-in-from-bottom-4 duration-700">
            <div className="flex flex-col md:flex-row justify-between md:items-end gap-4 mb-8">
              <div>
                <h2 className="fnt text-4xl font-light bg-gradient-to-br from-[var(--fo)] to-[var(--accent)] bg-clip-text text-transparent mb-2">
                  Katalog Produk
                </h2>
                <p className="text-[var(--ts)] text-sm">Kelola daftar produk, harga, dan foto jualan Anda.</p>
              </div>
              <button 
                onClick={() => { setFormProduk({ id: "", nama: "", deskripsi: "", harga: 0, kategori: "makanan", fotos: [] }); setShowFormProduk(true); }}
                className="btn-heroic py-3 px-6 rounded-xl flex items-center justify-center gap-2 text-sm font-bold shadow-xl shadow-[var(--fo)]/20 w-full md:w-auto"
              >
                <Plus size={18} strokeWidth={2.5} /> Tambah Produk
              </button>
            </div>

            {showFormProduk && (
              <div className="card-heroic p-6 md:p-8 rounded-[24px] mb-10 bg-white/90 backdrop-blur-xl border-2 border-[var(--accent)]/30 relative shadow-2xl shadow-[var(--fo)]/10">
                <button onClick={() => setShowFormProduk(false)} className="absolute top-5 right-5 p-2 bg-[var(--gb)] text-[var(--fo)] rounded-full hover:bg-[var(--accent)] hover:text-white transition-colors"><X size={20}/></button>
                <h3 className="fnt text-2xl font-bold text-[var(--fo)] mb-6 flex items-center gap-3">
                  {formProduk.id ? <Edit2 size={24} className="text-[var(--accent)]"/> : <Plus size={24} className="text-[var(--accent)]"/>} 
                  {formProduk.id ? "Edit Produk" : "Tambah Produk Baru"}
                </h3>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="col-span-1 md:col-span-2">
                    <label className="block text-xs font-black text-[var(--fo)] uppercase tracking-wider mb-2">Nama Produk *</label>
                    <input type="text" value={formProduk.nama} onChange={e => setFormProduk({...formProduk, nama: e.target.value})} placeholder="Contoh: Keripik Singkong Balado" className="w-full border-2 border-[var(--bo)] rounded-xl p-3.5 outline-none focus:border-[var(--accent)] focus:bg-[var(--gb)]/30 transition-all font-medium text-[var(--tp)]" />
                  </div>
                  <div>
                    <label className="block text-xs font-black text-[var(--fo)] uppercase tracking-wider mb-2">Harga (Rp) *</label>
                    <div className="relative">
                      <span className="absolute left-4 top-1/2 -translate-y-1/2 font-bold text-[var(--ts)]">Rp</span>
                      <input type="number" value={formProduk.harga || ""} onChange={e => setFormProduk({...formProduk, harga: parseInt(e.target.value) || 0})} placeholder="0" className="w-full border-2 border-[var(--bo)] rounded-xl p-3.5 pl-12 outline-none focus:border-[var(--accent)] focus:bg-[var(--gb)]/30 transition-all font-medium text-[var(--tp)]" />
                    </div>
                  </div>
                  <div>
                    <label className="block text-xs font-black text-[var(--fo)] uppercase tracking-wider mb-2">Kategori</label>
                    <div className="relative">
                      <select value={formProduk.kategori} onChange={e => setFormProduk({...formProduk, kategori: e.target.value})} className="w-full border-2 border-[var(--bo)] rounded-xl p-3.5 appearance-none outline-none focus:border-[var(--accent)] focus:bg-[var(--gb)]/30 transition-all font-medium text-[var(--tp)] bg-white cursor-pointer">
                        <option value="makanan">🍔 Makanan & Minuman</option>
                        <option value="kerajinan">🏺 Kerajinan Tangan</option>
                        <option value="jasa">🛠️ Jasa</option>
                        <option value="lainnya">📦 Lainnya</option>
                      </select>
                    </div>
                  </div>
                  <div className="col-span-1 md:col-span-2">
                    <label className="block text-xs font-black text-[var(--fo)] uppercase tracking-wider mb-2">Deskripsi Produk</label>
                    <textarea value={formProduk.deskripsi} onChange={e => setFormProduk({...formProduk, deskripsi: e.target.value})} placeholder="Ceritakan detail produk Anda di sini..." className="w-full border-2 border-[var(--bo)] rounded-xl p-3.5 outline-none focus:border-[var(--accent)] focus:bg-[var(--gb)]/30 transition-all font-medium text-[var(--tp)] min-h-[120px] resize-y" />
                  </div>
                  
                  {/* MULTI PHOTO UPLOAD */}
                  <div className="col-span-1 md:col-span-2 bg-[var(--cr)]/50 p-5 rounded-2xl border border-[var(--bo)]">
                    <div className="flex items-center justify-between mb-4">
                      <label className="block text-xs font-black text-[var(--fo)] uppercase tracking-wider">Foto Produk (Maks 5) *</label>
                      <span className="text-xs font-bold bg-white px-2 py-1 rounded-md text-[var(--ts)] border border-[var(--bo)]">
                        {formProduk.fotos.length} / 5
                      </span>
                    </div>
                    
                    <div className="flex flex-wrap gap-3 mb-4">
                      {formProduk.fotos.map((url, idx) => (
                        <div key={idx} className="relative w-24 h-24 rounded-xl border-2 border-[var(--bo)] bg-white overflow-hidden group">
                          <img src={url} alt={`Preview ${idx}`} className="w-full h-full object-cover" />
                          <button 
                            onClick={() => removeFoto(idx)}
                            className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity text-white"
                          >
                            <Trash2 size={20} />
                          </button>
                          {idx === 0 && <span className="absolute bottom-0 left-0 right-0 bg-[var(--fo)]/80 backdrop-blur-sm text-[8px] text-white font-black uppercase text-center py-1">Cover</span>}
                        </div>
                      ))}
                      
                      {formProduk.fotos.length < 5 && (
                        <label className={`w-24 h-24 rounded-xl border-2 border-dashed border-[var(--accent)]/50 bg-[var(--gb)]/30 hover:bg-[var(--gb)] cursor-pointer flex flex-col items-center justify-center text-[var(--accent)] transition-colors ${uploading ? 'opacity-50 cursor-not-allowed' : ''}`}>
                          {uploading ? <Loader2 className="animate-spin mb-1" size={24} /> : <Plus size={24} className="mb-1" />}
                          <span className="text-[10px] font-bold uppercase">{uploading ? 'Upload...' : 'Tambah'}</span>
                          <input 
                            type="file" 
                            accept="image/*" 
                            multiple 
                            onChange={handleFileSelect} 
                            disabled={uploading}
                            className="hidden" 
                          />
                        </label>
                      )}
                    </div>
                    <p className="text-xs text-[var(--ts)]">Format JPG, PNG. Foto pertama otomatis akan menjadi cover/thumbnail produk di halaman pembeli.</p>
                  </div>
                </div>
                
                <div className="mt-8 flex gap-3">
                  <button onClick={() => setShowFormProduk(false)} className="px-6 py-4 rounded-xl font-bold text-[var(--ts)] bg-white border-2 border-[var(--bo)] hover:bg-[var(--cr)] transition-colors w-1/3">
                    Batal
                  </button>
                  <button onClick={simpanProduk} disabled={uploading} className="flex-1 btn-heroic py-4 rounded-xl font-bold text-lg flex items-center justify-center gap-2 shadow-xl shadow-[var(--fo)]/20 disabled:opacity-70">
                    <CheckCircle size={20}/> Simpan Produk
                  </button>
                </div>
              </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
              {produk.length === 0 && !showFormProduk && (
                <div className="col-span-full py-20 flex flex-col items-center justify-center text-center bg-white/50 border-2 border-dashed border-[var(--bo)] rounded-[24px]">
                  <div className="w-20 h-20 bg-[var(--gb)] rounded-full flex items-center justify-center text-[var(--accent)] mb-4">
                    <Package size={32} strokeWidth={1.5} />
                  </div>
                  <h3 className="font-bold text-xl text-[var(--tp)] mb-2">Toko Masih Kosong</h3>
                  <p className="text-[var(--ts)] mb-6 max-w-sm">Anda belum menambahkan produk apapun. Yuk, mulai isi etalase toko Anda sekarang!</p>
                  <button onClick={() => { setFormProduk({ id: "", nama: "", deskripsi: "", harga: 0, kategori: "makanan", fotos: [] }); setShowFormProduk(true); }} className="btn-heroic py-2.5 px-6 rounded-xl font-bold shadow-lg">Tambah Produk</button>
                </div>
              )}
              {produk.map(p => {
                const photos = p.fotos && Array.isArray(p.fotos) && p.fotos.length > 0 ? p.fotos : (p.foto ? [p.foto] : []);
                return (
                  <div key={p.id} className="card-heroic bg-white rounded-2xl border border-[var(--bo)] overflow-hidden flex flex-col group">
                    <div className="h-40 bg-[var(--cr)] relative overflow-hidden">
                      {photos.length > 0 ? (
                        <img src={photos[0]} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700" alt={p.nama} />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-[var(--bo)]">
                          <ImageIcon size={48} strokeWidth={1}/>
                        </div>
                      )}
                      <div className="absolute top-3 right-3 bg-white/90 backdrop-blur-sm px-2.5 py-1 rounded-lg text-xs font-black text-[var(--fo)] shadow-sm">
                        {p.kategori.toUpperCase()}
                      </div>
                    </div>
                    <div className="p-5 flex-1 flex flex-col">
                      <div className="font-bold text-lg text-[var(--tp)] mb-1 leading-tight line-clamp-2">{p.nama}</div>
                      <div className="text-[var(--accent)] font-black text-xl mb-4">Rp {p.harga.toLocaleString("id-ID")}</div>
                      
                      <div className="mt-auto grid grid-cols-2 gap-2 pt-4 border-t border-[var(--bo)]">
                        <button 
                          onClick={() => { 
                            setFormProduk({ ...p, fotos: p.fotos || (p.foto ? [p.foto] : []) }); 
                            setShowFormProduk(true); 
                            window.scrollTo({top:0, behavior:"smooth"}); 
                          }} 
                          className="flex items-center justify-center gap-2 py-2.5 bg-[var(--gb)] text-[var(--fo)] font-bold rounded-xl hover:bg-[var(--accent)] hover:text-white transition-colors text-sm"
                        >
                          <Edit2 size={14}/> Edit
                        </button>
                        <button 
                          onClick={() => hapusProduk(p.id)} 
                          className="flex items-center justify-center gap-2 py-2.5 bg-[var(--rb)] text-[var(--rt)] font-bold rounded-xl hover:bg-red-100 transition-colors text-sm"
                        >
                          <Trash2 size={14}/> Hapus
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {tab === "pesanan" && (
          <div className="animate-in fade-in slide-in-from-bottom-4 duration-700">
            <h2 className="fnt text-4xl font-light bg-gradient-to-br from-[var(--fo)] to-[var(--accent)] bg-clip-text text-transparent mb-8">
              Kelola Pesanan
            </h2>
            <div className="space-y-5">
              {pesanan.length === 0 ? (
                <div className="py-20 flex flex-col items-center justify-center text-center bg-white/50 border-2 border-dashed border-[var(--bo)] rounded-[24px]">
                  <div className="w-20 h-20 bg-[var(--gb)] rounded-full flex items-center justify-center text-[var(--accent)] mb-4">
                    <ShoppingBag size={32} strokeWidth={1.5} />
                  </div>
                  <h3 className="font-bold text-xl text-[var(--tp)] mb-2">Belum Ada Pesanan</h3>
                  <p className="text-[var(--ts)] max-w-sm">Toko Anda belum menerima pesanan baru. Jangan lupa bagikan link toko Anda ke warga!</p>
                </div>
              ) : pesanan.map(ord => (
                <div key={ord.id} className="card-heroic bg-white p-6 rounded-[24px] border border-[var(--bo)] shadow-sm">
                  <div className="flex flex-col lg:flex-row justify-between lg:items-center gap-4 mb-5 border-b border-[var(--bo)] pb-5">
                    <div>
                      <div className="flex items-center gap-3 mb-2">
                        <span className="font-black text-lg text-[var(--tp)] tracking-tight">Order #{ord.id.slice(0,6).toUpperCase()}</span>
                        <span className={`px-3 py-1 rounded-lg text-xs font-black uppercase tracking-wider ${
                          ord.status === 'pending' ? 'bg-[var(--go)]/10 text-[var(--go)] border border-[var(--go)]/20' :
                          ord.status === 'diproses' ? 'bg-[var(--accent)]/10 text-[var(--accent)] border border-[var(--accent)]/20' :
                          'bg-[var(--fo)]/10 text-[var(--fo)] border border-[var(--fo)]/20'
                        }`}>
                          {ord.status === 'pending' ? '🟡 Menunggu' : ord.status === 'diproses' ? '🔵 Diproses' : '🟢 Selesai'}
                        </span>
                      </div>
                      <div className="text-[var(--ts)] text-sm font-medium flex items-center gap-1.5">
                        <Clock size={16}/> {new Date(ord.created_at).toLocaleDateString("id-ID", {day:"numeric",month:"long",year:"numeric",hour:"2-digit",minute:"2-digit"})}
                      </div>
                    </div>
                    <div className="lg:text-right bg-[var(--cr)]/50 p-4 rounded-xl border border-[var(--bo)] w-full lg:w-auto">
                      <div className="text-[var(--ts)] text-xs font-bold uppercase tracking-wider mb-1">Total Belanja</div>
                      <div className="text-2xl font-black text-[var(--fo)]">Rp {ord.total_harga.toLocaleString("id-ID")}</div>
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                    <div>
                      <div className="text-xs font-black text-[var(--ts)] uppercase tracking-wider mb-3 flex items-center gap-2">
                        <Package size={14}/> Rincian Item:
                      </div>
                      <div className="bg-[var(--cr)]/50 rounded-xl border border-[var(--bo)] p-1">
                        {(ord.items || []).map((it:any, idx:number) => (
                          <div key={idx} className="flex justify-between items-center text-sm p-3 border-b border-[var(--bo)] last:border-0">
                            <span className="font-semibold text-[var(--tp)]"><span className="text-[var(--accent)]">{it.qty}x</span> {it.nama}</span>
                            <span className="font-black text-[var(--ts)]">Rp {(it.harga * it.qty).toLocaleString("id-ID")}</span>
                          </div>
                        ))}
                      </div>
                    </div>

                    <div className="bg-gradient-to-br from-[var(--gb)] to-[rgba(47,143,78,0.05)] p-5 rounded-xl border border-[var(--accent)]/20">
                      <div className="text-xs font-black text-[var(--fo)] uppercase tracking-wider mb-3">Informasi Pembeli:</div>
                      <div className="text-base font-black text-[var(--tp)] mb-2">{ord.pembeli?.nama || ord.guest_name}</div>
                      
                      <a href={`https://wa.me/62${(ord.pembeli?.no_wa || ord.guest_phone || "").replace(/^0+/, '')}?text=Halo%20kak%2C%20saya%20dari%20toko%20${encodeURIComponent(toko?.nama_toko||'Ciburial')}%20mengonfirmasi%20pesanan%20%23${ord.id.slice(0,6).toUpperCase()}`} target="_blank" rel="noreferrer" className="inline-flex items-center gap-2 bg-[#25D366] text-white px-4 py-2 rounded-lg text-sm font-bold shadow-md hover:bg-[#20bd5a] transition-all mb-4">
                        <svg className="w-4 h-4 fill-current" viewBox="0 0 24 24"><path d="M.057 24l1.687-6.163c-1.041-1.804-1.588-3.849-1.587-5.946.003-6.556 5.338-11.891 11.893-11.891 3.181.001 6.167 1.24 8.413 3.488 2.245 2.248 3.481 5.236 3.48 8.414-.003 6.557-5.338 11.892-11.893 11.892-1.99-.001-3.951-.5-5.688-1.448l-6.305 1.654zm6.597-3.807c1.676.995 3.276 1.591 5.392 1.592 5.448 0 9.886-4.434 9.889-9.885.002-5.462-4.415-9.89-9.881-9.892-5.452 0-9.887 4.434-9.889 9.884-.001 2.225.651 3.891 1.746 5.634l-.999 3.648 3.742-.981zm11.387-5.464c-.074-.124-.272-.198-.57-.347-.297-.149-1.758-.868-2.031-.967-.272-.099-.47-.149-.669.149-.198.297-.768.967-.941 1.165-.173.198-.347.223-.644.074-.297-.149-1.255-.462-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.297-.347.446-.521.151-.172.2-.296.3-.495.099-.198.05-.372-.025-.521-.075-.148-.669-1.611-.916-2.206-.242-.579-.487-.501-.669-.51l-.57-.01c-.198 0-.52.074-.792.372s-1.04 1.016-1.04 2.479 1.065 2.876 1.213 3.074c.149.198 2.095 3.2 5.076 4.487.709.306 1.263.489 1.694.626.712.226 1.36.194 1.872.118.571-.085 1.758-.719 2.006-1.413.248-.695.248-1.29.173-1.414z"/></svg>
                        Hubungi via WA
                      </a>
                      
                      {ord.catatan && (
                        <div>
                          <div className="text-[10px] font-black text-[var(--ts)] uppercase tracking-wider mb-1">Catatan Pembeli:</div>
                          <div className="text-sm text-[var(--tp)] bg-white p-3 rounded-lg border border-[var(--bo)] shadow-inner italic">"{ord.catatan}"</div>
                        </div>
                      )}
                    </div>
                  </div>

                  {ord.status !== 'selesai' && (
                    <div className="flex flex-col sm:flex-row gap-3 justify-end pt-4 border-t border-[var(--bo)]">
                      {ord.status === 'pending' && (
                        <button onClick={() => updateStatusPesanan(ord.id, 'diproses')} className="btn-heroic py-3 px-6 rounded-xl text-sm font-bold shadow-xl shadow-[var(--fo)]/20 flex-1 sm:flex-none">
                          Terima & Proses Pesanan
                        </button>
                      )}
                      {ord.status === 'diproses' && (
                        <button onClick={() => updateStatusPesanan(ord.id, 'selesai')} className="bg-[var(--fo)] text-white py-3 px-6 rounded-xl text-sm font-bold shadow-xl shadow-[var(--fo)]/20 hover:bg-[var(--fm)] transition-colors flex-1 sm:flex-none flex items-center justify-center gap-2">
                          <CheckCircle size={18}/> Tandai Selesai Dikirim
                        </button>
                      )}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {tab === "pengaturan" && (
          <div className="space-y-6 animate-fadeIn">
            <h2 className="fnt text-2xl md:text-3xl font-bold text-[var(--tp)] flex items-center gap-2">
              <Settings className="text-[var(--accent)]" /> Pengaturan Toko
            </h2>
            
            <div className="card-heroic rounded-2xl border border-[var(--bo)] p-5 md:p-8">
              <div className="flex flex-col md:flex-row gap-8">
                {/* Upload Foto Toko */}
                <div className="flex-shrink-0 flex flex-col items-center">
                  <div className="w-32 h-32 rounded-full border-4 border-white shadow-xl bg-[var(--cr)] relative overflow-hidden group">
                    {formToko.foto_toko ? (
                      <img src={formToko.foto_toko} className="w-full h-full object-cover" alt="Foto Toko" />
                    ) : (
                      <div className="w-full h-full flex flex-col items-center justify-center text-[var(--ts)] bg-[var(--gb)]">
                        <Store size={32} className="mb-1 text-[var(--accent)]" />
                      </div>
                    )}
                    <label className="absolute inset-0 bg-black/50 flex flex-col items-center justify-center text-white opacity-0 group-hover:opacity-100 cursor-pointer transition-opacity">
                      {uploading ? <Loader2 className="animate-spin" size={24} /> : (
                        <>
                          <Upload size={24} className="mb-1" />
                          <span className="text-xs font-bold">Ubah Foto</span>
                        </>
                      )}
                      <input type="file" accept="image/*" className="hidden" onChange={uploadFotoToko} disabled={uploading} />
                    </label>
                  </div>
                  <p className="text-xs text-[var(--ts)] mt-3 text-center max-w-[120px]">Disarankan resolusi 1:1, max 2MB.</p>
                </div>

                {/* Form Data Toko */}
                <div className="flex-1 space-y-5">
                  <div>
                    <label className="block text-sm font-bold text-[var(--tp)] mb-1.5">Nama Toko <span className="text-red-500">*</span></label>
                    <input 
                      type="text" 
                      value={formToko.nama_toko} 
                      onChange={e => setFormToko({...formToko, nama_toko: e.target.value})} 
                      className="w-full p-3.5 rounded-xl border border-[var(--bo)] bg-[var(--cr)]/50 focus:outline-none focus:ring-2 focus:ring-[var(--accent)] focus:border-transparent transition-all font-semibold"
                      placeholder="Masukkan nama toko"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-bold text-[var(--tp)] mb-1.5">Deskripsi Toko</label>
                    <textarea 
                      value={formToko.deskripsi} 
                      onChange={e => setFormToko({...formToko, deskripsi: e.target.value})} 
                      className="w-full p-3.5 rounded-xl border border-[var(--bo)] bg-[var(--cr)]/50 focus:outline-none focus:ring-2 focus:ring-[var(--accent)] focus:border-transparent transition-all font-medium min-h-[120px]"
                      placeholder="Ceritakan tentang toko dan produk yang Anda jual (Slogan, jam buka, dll)"
                    />
                  </div>

                  <div className="pt-4 border-t border-[var(--bo)]">
                    <button 
                      onClick={simpanPengaturanToko} 
                      disabled={savingToko}
                      className="btn-heroic w-full md:w-auto px-8 py-3.5 rounded-xl flex items-center justify-center gap-2 font-bold shadow-lg"
                    >
                      {savingToko ? <Loader2 size={18} className="animate-spin" /> : <CheckCircle size={18} />}
                      Simpan Pengaturan
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
