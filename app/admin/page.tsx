"use client";
// app/admin/page.tsx
// Akses di: https://your-site.vercel.app/admin
// PIN admin disimpan di environment variable ADMIN_PIN
import { useState, useEffect, useCallback } from "react";
import { 
  LayoutDashboard, Users, Calendar, ShoppingCart, Wallet, MessageSquare, Video, UserCircle, 
  Home, Recycle, Coins, Baby, Landmark, ArrowUpCircle, ArrowDownCircle, 
  LogOut, ExternalLink, Mail, Trash2, Plus, ShieldCheck, FileText, 
  Image as ImageIcon, Package, Book, Info, AlertTriangle, ChevronRight, Save, Send, Sparkles
} from "lucide-react";
import { supabase, isSupabaseReady } from "@/lib/supabase";
import "./admin-styles-heroic.css";

// PIN diverifikasi server-side via /api/admin/verify

interface Kegiatan { id: string; judul: string; tanggal: string; kategori: string; deskripsi: string; foto?: string; fotos?: string[]; }
interface Produk    { id: string; nama: string; deskripsi: string; harga: number; tag: string; icon: string; foto?: string; }
interface Transaksi { id: string; tanggal: string; keterangan: string; kategori: string; tipe: "masuk" | "keluar"; jumlah: number; }
interface Testimoni { id: string; nama: string; jabatan: string; pesan: string; foto?: string; tipe: "tokoh" | "berita"; }
interface Iklan { id: string; judul: string; deskripsi: string; mediaUrl: string; tipe: "video" | "foto"; linkTujuan?: string; }
interface Pengurus { id: string; nama: string; jabatan: string; kategori: "pelindung" | "pengawas" | "eksekutif" | "divisi"; urutan: number; foto?: string; }

type AdminTab = "dashboard" | "kegiatan" | "produk" | "transaksi" | "testimoni" | "iklan" | "pengurus";

const formatRp = (n: number) => "Rp " + n.toLocaleString("id-ID");

const KAT_OPTIONS = [
  { value: "keagamaan",     label: "🕌 Keagamaan" },
  { value: "kemerdekaan",   label: "🇮🇩 Kemerdekaan" },
  { value: "kemasyarakatan",label: "🤝 Kemasyarakatan" },
  { value: "update-kampung",label: "📍 Update Kampung" },
];

// Kategori MASUK — untuk sumber pemasukan
const KAT_MASUK = [
  "Donasi Warga",
  "Donasi Online",
  "Donasi Institusi",
  "Donasi Perantau",
  "Infak / Sedekah DKM",
  "Marketplace",
  "Bank Sampah",
  "Lainnya",
];
// Kategori KELUAR — HARUS SAMA PERSIS dengan label ALOKASI di types.ts
// agar chart distribusi pengeluaran di Transparansi Dana terpetakan dengan benar
const KAT_KELUAR = [
  "Tiang PJU Stainless",
  "Lampu 22 Watt",
  "Kabel PJU",
  "Semen & Pasir",
  "Cetakan PJU",
  "Cat & Material",
  "Lainnya",
];


function openGmailNotif(t: Transaksi) {
  const tipe = t.tipe === "masuk" ? "📈 PEMASUKAN" : "📉 PENGELUARAN";
  const sub  = encodeURIComponent(`[${t.tipe === "masuk" ? "PEMASUKAN" : "PENGELUARAN"}] Dana Ciburial — ${t.keterangan}`);
  const body = encodeURIComponent(
`═══════════════════════════════════
   NOTIFIKASI DANA CIBURIAL
═══════════════════════════════════

Tipe       : ${tipe}
Tanggal    : ${new Date(t.tanggal).toLocaleDateString("id-ID", { weekday:"long", year:"numeric", month:"long", day:"numeric" })}
Keterangan : ${t.keterangan}
Kategori   : ${t.kategori}
Jumlah     : ${formatRp(t.jumlah)}

Cek transparansi lengkap:
https://ciburial-eco-digital.vercel.app/

Hormat,
Sistem Ciburial Eco-Digital Village`);
  window.open(`https://mail.google.com/mail/?view=cm&to=ciburial.smarthub@gmail.com&su=${sub}&body=${body}`, "_blank");
}

export default function AdminPage() {
  const [auth,       setAuth]       = useState(false);
  const [pwInput,    setPwInput]    = useState("");
  const [pwErr,      setPwErr]      = useState(false);
  const [activeTab,  setActiveTab]  = useState<AdminTab>("dashboard");
  // Dashboard state
  const [dashData,   setDashData]   = useState<any>({});
  const [aktivitas,  setAktivitas]  = useState<any[]>([]);
  const [ultahHari,  setUltahHari]  = useState<any[]>([]);
  const [ultahMinggu,setUltahMinggu]= useState<any[]>([]);
  const [sampahTren, setSampahTren] = useState<{b:string;kg:number}[]>([]);
  const [toast,      setToast]      = useState("");

  /* ─── data state ─── */
  const [kegiatanList,  setKegiatanList]  = useState<Kegiatan[]>([]);
  const [produkList,    setProdukList]    = useState<Produk[]>([]);
  const [transaksiList, setTransaksiList] = useState<Transaksi[]>([]);
  const [testimoniList, setTestimoniList] = useState<Testimoni[]>([]);
  const [iklanList, setIklanList] = useState<Iklan[]>([]);
  const [pengurusList, setPengurusList] = useState<Pengurus[]>([]);

  /* ─── form state ─── */
  const emptyK = { judul:"", tanggal: new Date().toISOString().split("T")[0], kategori:"keagamaan", deskripsi:"", foto:"" };
  const emptyP = { nama:"", deskripsi:"", harga:"", tag:"", icon:"🎋", foto:"" };
  const emptyT: { tanggal:string; keterangan:string; kategori:string; tipe:"masuk"|"keluar"; jumlah:string } = { tanggal: new Date().toISOString().split("T")[0], keterangan:"", kategori:"Donasi Warga", tipe:"masuk", jumlah:"" };
  const emptyTm: { nama:string; jabatan:string; pesan:string; tipe:"tokoh"|"berita"; foto:string } = { nama:"", jabatan:"", pesan:"", tipe:"tokoh", foto:"" };
  const emptyIk: { judul:string; deskripsi:string; tipe:"video"|"foto"; mediaUrl:string; linkTujuan:string } = { judul:"", deskripsi:"", tipe:"video", mediaUrl:"", linkTujuan:"" };
  const emptyPg: { nama:string; jabatan:string; kategori:"pelindung"|"pengawas"|"eksekutif"|"divisi"; urutan:string; foto:string } = { nama:"", jabatan:"", kategori:"pelindung", urutan:"1", foto:"" };

  const [kForm, setKForm] = useState(emptyK);
  const [kFile, setKFile] = useState<File | null>(null);
  const [kFiles, setKFiles] = useState<(File | null)[]>(Array(8).fill(null));
  const [pForm, setPForm] = useState(emptyP);
  const [pFile, setPFile] = useState<File | null>(null);
  const [pFiles, setPFiles] = useState<(File | null)[]>([null, null, null, null, null]); // 5 photo slots
  const [tForm, setTForm] = useState(emptyT);
  const [tmForm, setTmForm] = useState(emptyTm);
  const [tmFile, setTmFile] = useState<File | null>(null);
  const [ikForm, setIkForm] = useState(emptyIk);
  const [ikFile, setIkFile] = useState<File | null>(null);
  const [pgForm, setPgForm] = useState(emptyPg);
  const [pgFile, setPgFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);

  const showToast = (msg: string) => { setToast(msg); setTimeout(() => setToast(""), 3000); };

  /* ─── fetch all ─── */
  const fetchAll = useCallback(async () => {
    if (!isSupabaseReady()) return;
    const [k, p, t] = await Promise.all([
      supabase.from("kegiatan").select("*").order("tanggal", { ascending: false }),
      supabase.from("produk").select("*").order("created_at", { ascending: false }),
      supabase.from("transaksi").select("*").order("tanggal", { ascending: false }),
    ]);
    let tm: any = { data: null };
    let ik: any = { data: null };
    let pg: any = { data: null };
    try { 
      tm = await supabase.from("testimoni").select("*").order("created_at", { ascending: false }); 
      ik = await supabase.from("iklan").select("*").order("created_at", { ascending: false }); 
      pg = await supabase.from("pengurus_desa").select("*").order("kategori").order("urutan", { ascending: true });
    } catch (e) {}

    if (k.data) setKegiatanList(k.data as Kegiatan[]);
    if (p.data) setProdukList(p.data as Produk[]);
    if (t.data) setTransaksiList(t.data as Transaksi[]);
    if (tm.data) setTestimoniList(tm.data as Testimoni[]);
    if (ik.data) setIklanList(ik.data as Iklan[]);
    if (pg.data) setPengurusList(pg.data as Pengurus[]);

    // Fetch dashboard data
    if (isSupabaseReady()) {
      const [kk, ang, sp, anak, imun, rp] = await Promise.all([
        supabase.from("keluarga").select("id,rt,golongan_zakat"),
        supabase.from("anggota_kk").select("id,nama,tgl_lahir,hubungan,saldo_poin,jenis_kelamin"),
        supabase.from("saldo_poin").select("total_poin,total_setor_kg"),
        supabase.from("anak_posyandu").select("id", {count:"exact",head:true}),
        supabase.from("imunisasi").select("status"),
        supabase.from("riwayat_poin").select("*,anggota_kk(nama)").order("created_at",{ascending:false}).limit(8),
      ]);
      const allAng = ang.data || [];
      const totalJiwa = allAng.length;
      // Cek jenis_kelamin (bisa "L"/"P"/"laki-laki"/"perempuan"), fallback ke hubungan jika kosong
      const isPerempuan = (a: any) => {
        if (a.jenis_kelamin) {
          const jk = a.jenis_kelamin.toLowerCase();
          return jk === "perempuan" || jk === "p";
        }
        // fallback: hubungan yang secara konvensi perempuan
        return a.hubungan === "istri" || a.hubungan === "mertua" || a.hubungan === "nenek";
      };
      const perempuanCount = allAng.filter((a: any) => isPerempuan(a)).length;
      const laki = totalJiwa - perempuanCount;
      const totKg = (sp.data||[]).reduce((s:number,x:any)=>s+Number(x.total_setor_kg),0);
      const totPoin = (sp.data||[]).reduce((s:number,x:any)=>s+Number(x.total_poin),0);
      const imunSudah = (imun.data||[]).filter((i:any)=>i.status==="sudah").length;
      const imunTotal = (imun.data||[]).length;
      const kkData = kk.data || [];
      setDashData({
        totalKK: kkData.length, totalJiwa, laki, perempuan: totalJiwa-laki,
        totKg, totPoin, imunSudah, imunTotal,
        anakPosyandu: anak.count||0,
        muzakki: kkData.filter((k:any)=>k.golongan_zakat==="muzakki").length,
        mustahiq: kkData.filter((k:any)=>k.golongan_zakat==="mustahiq").length,
      });
      if (rp.data) setAktivitas(rp.data);

      // Ultah
      const hariIni = new Date();
      setUltahHari(allAng.filter((a:any) => {
        if (!a.tgl_lahir) return false;
        const l = new Date(a.tgl_lahir);
        return l.getDate()===hariIni.getDate() && l.getMonth()===hariIni.getMonth();
      }));
      setUltahMinggu(allAng.filter((a:any) => {
        if (!a.tgl_lahir) return false;
        const l = new Date(a.tgl_lahir);
        const next = new Date(hariIni.getFullYear(), l.getMonth(), l.getDate());
        const diff = (next.getTime()-hariIni.getTime())/(1000*60*60*24);
        return diff>0 && diff<=7;
      }));

      // Sampah tren per bulan
      const {data:sd} = await supabase.from("setor_sampah").select("tanggal,berat_kg")
        .gte("tanggal", new Date(Date.now()-180*24*60*60*1000).toISOString().split("T")[0]);
      if (sd) {
        const byB:Record<string,number> = {};
        sd.forEach((s:any) => {
          const b = new Date(s.tanggal).toLocaleDateString("id-ID",{month:"short"});
          byB[b] = (byB[b]||0)+Number(s.berat_kg);
        });
        setSampahTren(Object.entries(byB).map(([b,kg])=>({b,kg})).slice(-6));
      }
    }
  }, []);

  useEffect(() => { if (auth) fetchAll(); }, [auth, fetchAll]);

  /* ─── login ─── */
  function handleLogin() {
    if (!pwInput.trim()) { setPwErr(true); return; }
    setLoading(true);
    fetch("/api/admin/verify", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ pin: pwInput }),
    })
      .then(res => res.json())
      .then(data => {
        if (data.success) { setAuth(true); setPwErr(false); }
        else { setPwErr(true); }
      })
      .catch(() => setPwErr(true))
      .finally(() => setLoading(false));
  }

  /* ─── HELPER UPLOAD ─── */
  const uploadToSupabase = async (file: File) => {
    const ext = file.name.split('.').pop() || "jpg";
    const fName = `ast_${Date.now()}.${ext}`;
    const { error } = await supabase.storage.from('ciburial-assets').upload(fName, file);
    if (error) throw error;
    return supabase.storage.from('ciburial-assets').getPublicUrl(fName).data.publicUrl;
  };

  const hapusDariSupabase = (url?: string) => {
    if (url && url.includes("ciburial-assets")) {
      const fn = url.split("/").pop();
      if (fn) supabase.storage.from('ciburial-assets').remove([fn]);
    }
  };

  /* ─── kegiatan CRUD ─── */
  const addKegiatan = async () => {
    if (!kForm.judul || !kForm.tanggal) return showToast("❌ Judul & tanggal wajib diisi");
    setLoading(true);
    try {
      const uploadedUrls: string[] = [];
      for (const file of kFiles) {
        if (file) {
          try {
            const url = await uploadToSupabase(file);
            uploadedUrls.push(url);
          } catch (e) {
            console.error("File upload error:", e);
          }
        }
      }

      const kegiatanData: any = {
        judul: kForm.judul,
        tanggal: kForm.tanggal,
        kategori: kForm.kategori,
        deskripsi: kForm.deskripsi
      };

      if (uploadedUrls.length > 0) {
        kegiatanData.foto = uploadedUrls.join(',');
      } else if (kForm.foto) {
        kegiatanData.foto = kForm.foto;
      }
      
      const { error } = await supabase.from("kegiatan").insert(kegiatanData);
      if (error) throw error;
      
      setKForm(emptyK);
      setKFile(null);
      setKFiles(Array(8).fill(null));
      fetchAll();
      showToast("✅ Kegiatan berhasil ditambahkan!");
    } catch (err: any) {
      showToast(err.message?.includes("Bucket not found") ? "❌ Buat bucket 'ciburial-assets' dulu!" : "❌ Gagal: " + err.message);
    }
    setLoading(false);
  };

  const deleteKegiatan = async (id: string, foto?: string) => {
    if (!confirm("Hapus kegiatan ini?")) return;
    hapusDariSupabase(foto);
    await supabase.from("kegiatan").delete().eq("id", id);
    fetchAll(); showToast("🗑️ Kegiatan dihapus");
  };

  /* ─── produk CRUD ─── */
  const addProduk = async () => {
    if (!pForm.nama || !pForm.harga) return showToast("❌ Nama & harga wajib diisi");
    setLoading(true);
    try {
      // Upload multiple files
      const uploadedUrls: string[] = [];
      for (const file of pFiles) {
        if (file) {
          try {
            const url = await uploadToSupabase(file);
            uploadedUrls.push(url);
          } catch (e) {
            console.error("File upload error:", e);
          }
        }
      }

      const produkData: any = {
        nama: pForm.nama,
        deskripsi: pForm.deskripsi,
        harga: Number(pForm.harga),
        tag: pForm.tag,
        icon: pForm.icon
      };

      // Save fotos array
      if (uploadedUrls.length > 0) {
        produkData.fotos = uploadedUrls;
        produkData.foto = uploadedUrls[0]; // Main foto for backward compat
      }
      
      const { error } = await supabase.from("produk").insert(produkData);
      if (error) throw error;
      
      setPForm(emptyP);
      setPFile(null);
      setPFiles([null, null, null, null, null]);
      fetchAll();
      showToast("✅ Produk berhasil ditambahkan!");
    } catch (err: any) {
      console.error("Upload error:", err);
      showToast("❌ Gagal: " + err.message);
    }
    setLoading(false);
  };

  const deleteProduk = async (id: string, foto?: string) => {
    if (!confirm("Hapus produk ini?")) return;
    if (foto) hapusDariSupabase(foto);
    await supabase.from("produk").delete().eq("id", id);
    fetchAll(); showToast("🗑️ Produk dihapus");
  };

  /* ─── transaksi CRUD ─── */
  const addTransaksi = async (kirimNotif: boolean) => {
    if (!tForm.keterangan || !tForm.jumlah) return showToast("❌ Keterangan & jumlah wajib diisi");
    setLoading(true);
    const payload = { ...tForm, jumlah: Number(tForm.jumlah) };
    const { data, error } = await supabase.from("transaksi").insert(payload).select().single();
    setLoading(false);
    if (error) return showToast("❌ Gagal: " + error.message);
    setTForm(emptyT); fetchAll(); showToast("✅ Transaksi disimpan!");
    if (kirimNotif && data) openGmailNotif(data as Transaksi);
  };

  const deleteTransaksi = async (id: string) => {
    if (!confirm("Hapus transaksi ini?")) return;
    await supabase.from("transaksi").delete().eq("id", id);
    fetchAll(); showToast("🗑️ Transaksi dihapus");
  };

  /* ─── testimoni CRUD ─── */
  const addTestimoni = async () => {
    if (!tmForm.nama || !tmForm.pesan) return showToast("❌ Nama & pesan wajib diisi");
    setLoading(true);
    let finalUrl = tmForm.foto;
    try {
      if (tmFile) finalUrl = await uploadToSupabase(tmFile);
      const { error } = await supabase.from("testimoni").insert({ ...tmForm, foto: finalUrl || null });
      if (error) throw error;
      setTmForm(emptyTm); setTmFile(null); fetchAll(); showToast("✅ Testimoni ditambahkan!");
    } catch (err: any) {
      showToast(err.message?.includes("Bucket not found") ? "❌ Buat bucket 'ciburial-assets' dulu!" : "❌ Gagal: " + err.message);
    }
    setLoading(false);
  };

  const deleteTestimoni = async (id: string, foto?: string) => {
    if (!confirm("Hapus testimoni ini?")) return;
    hapusDariSupabase(foto);
    await supabase.from("testimoni").delete().eq("id", id);
    fetchAll(); showToast("🗑️ Testimoni dihapus");
  };

  /* ─── iklan CRUD ─── */
  const addIklan = async () => {
    if (!ikForm.judul || !ikForm.deskripsi) return showToast("❌ Judul & deskripsi wajib diisi");
    setLoading(true);
    let finalUrl = ikForm.mediaUrl;
    try {
      if (ikFile) finalUrl = await uploadToSupabase(ikFile);
      if (!finalUrl) throw new Error("Media belum diunggah/diinput");
      const { error } = await supabase.from("iklan").insert({ ...ikForm, mediaUrl: finalUrl });
      if (error) throw error;
      setIkForm(emptyIk); setIkFile(null); fetchAll(); showToast("✅ Iklan ditambahkan!");
    } catch (err: any) {
      showToast(err.message?.includes("Bucket not found") ? "❌ Buat bucket 'ciburial-assets' dulu!" : "❌ Gagal: " + err.message);
    }
    setLoading(false);
  };

  const deleteIklan = async (id: string, mediaUrl?: string) => {
    if (!confirm("Hapus iklan ini?")) return;
    hapusDariSupabase(mediaUrl);
    await supabase.from("iklan").delete().eq("id", id);
    fetchAll(); showToast("🗑️ Iklan dihapus");
  };

  /* ─── pengurus CRUD ─── */
  const addPengurus = async () => {
    if (!pgForm.nama || !pgForm.jabatan) return showToast("❌ Nama & jabatan wajib diisi");
    setLoading(true);
    let finalUrl = pgForm.foto;
    try {
      if (pgFile) finalUrl = await uploadToSupabase(pgFile);
      const { error } = await supabase.from("pengurus_desa").insert({ ...pgForm, urutan: Number(pgForm.urutan), foto: finalUrl || null });
      if (error) throw error;
      setPgForm(emptyPg); setPgFile(null); fetchAll(); showToast("✅ Pengurus ditambahkan!");
    } catch (err: any) {
      showToast("❌ Gagal: " + err.message);
    }
    setLoading(false);
  };

  const deletePengurus = async (id: string, foto?: string) => {
    if (!confirm("Hapus kepengurusan ini?")) return;
    hapusDariSupabase(foto);
    await supabase.from("pengurus_desa").delete().eq("id", id);
    fetchAll(); showToast("🗑️ Pengurus dihapus");
  };

  /* ─── Ringkasan keuangan ─── */
  const totalMasuk  = transaksiList.filter(t => t.tipe === "masuk").reduce((s, t) => s + t.jumlah, 0);
  const totalKeluar = transaksiList.filter(t => t.tipe === "keluar").reduce((s, t) => s + t.jumlah, 0);
  const saldo       = totalMasuk - totalKeluar;

  /* ══════ PASSWORD GATE ══════ */
  if (!auth) return (
    <div className="admin-page heroic-bg">
      <div style={{ minHeight:"100vh", display:"flex", alignItems:"center", justifyContent:"center", padding:"clamp(16px, 4vw, 24px)" }}>
        <div className="card-heroic" style={{ width:"100%", maxWidth:420, padding:"clamp(32px, 6vw, 48px) clamp(24px, 5vw, 40px)", textAlign:"center" }}>
          <div className="float-heroic" style={{ width:80, height:80, borderRadius:"50%", background:"linear-gradient(135deg, #2F8F4E, #4FBF7E)", display:"flex", alignItems:"center", justifyContent:"center", margin:"0 auto 24px", fontSize:32, boxShadow: "0 10px 30px rgba(47,143,78,0.3)", color:"white" }}>
            <ShieldCheck size={40} />
          </div>
          <h1 className="section-title-heroic" style={{ fontSize:"clamp(28px, 6vw, 36px)", marginBottom:8 }}>Admin Panel</h1>
          <p className="section-subtitle-heroic" style={{ marginBottom:32 }}>Ciburial Eco-Digital Village</p>
          
          <div className="form-group-heroic" style={{ marginBottom: 24 }}>
            <input
              type="tel" inputMode="numeric" placeholder="PIN ADMIN"
              className="form-input-heroic" value={pwInput}
              maxLength={6}
              onChange={e => { setPwInput(e.target.value.replace(/\D/g, '')); setPwErr(false); }}
              onKeyDown={e => e.key === "Enter" && handleLogin()}
              style={{ textAlign:"center", fontSize:24, letterSpacing:".4em", fontWeight:800, padding: "16px" }}
            />
            {pwErr && <p style={{ fontSize:12, color:"#8B2020", fontWeight:700, marginTop:8 }}><AlertTriangle size={14} style={{display:"inline", marginRight:4, verticalAlign:"middle"}} /> PIN salah. Coba lagi.</p>}
          </div>

          <button className="btn-heroic" onClick={handleLogin} disabled={loading} style={{ width:"100%", display:"flex", alignItems:"center", justifyContent:"center", gap:10 }}>
            <span>{loading ? "MEMVERIFIKASI..." : "MASUK KE DASHBOARD"}</span>
            {!loading && <ChevronRight size={18} />}
          </button>
          <p style={{ fontSize:11, color:"#9A8C85", marginTop:24, fontWeight: 500 }}>Akses terbatas untuk pengelola resmi Ciburial</p>
        </div>
      </div>
    </div>
  );

  /* ══════ ADMIN DASHBOARD ══════ */
  return (
    <div className="admin-page heroic-bg" style={{ minHeight:"100vh" }}>
      {toast && <div className="admin-toast pulse-glow-heroic">{toast}</div>}

      {/* ── HEADER HEROIC ── */}
      <header style={{ 
        background: "rgba(28, 58, 43, 0.95)", 
        backdropFilter: "blur(12px)",
        padding: "0 clamp(16px, 4vw, 32px)", 
        height: 72, 
        display: "flex", 
        alignItems: "center", 
        justifyContent: "space-between", 
        position: "sticky", 
        top: 0, 
        zIndex: 100,
        borderBottom: "1px solid rgba(79, 191, 126, 0.2)",
        boxShadow: "0 4px 20px rgba(0,0,0,0.15)"
      }}>
        <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
          <div className="pulse-glow-heroic" style={{ width: 40, height: 40, borderRadius: "50%", background: "linear-gradient(135deg, #2F8F4E, #4FBF7E)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 20, color: "white" }}><Sparkles size={20} /></div>
          <div>
            <div style={{ fontSize: 18, fontWeight: 800, color: "#FAF8F3", letterSpacing: "-0.01em", lineHeight: 1 }}>CIBURIAL</div>
            <div style={{ fontSize: 10, fontWeight: 700, color: "#4FBF7E", letterSpacing: "0.15em", textTransform: "uppercase", marginTop: 4 }}>DASHBOARD UTAMA</div>
          </div>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 20 }}>
          {!isSupabaseReady() && (
            <div className="badge-heroic" style={{ background: "rgba(139, 32, 32, 0.15)", color: "#FF8A8A", borderColor: "rgba(139, 32, 32, 0.3)", display:"flex", alignItems:"center", gap:6 }}><AlertTriangle size={12}/> OFFLINE MODE</div>
          )}
          <a href="/" target="_blank" className="badge-heroic" style={{ textDecoration: "none", display:"flex", alignItems:"center", gap:6 }}>LIHAT WEB <ExternalLink size={12}/></a>
          <button onClick={() => setAuth(false)} style={{ 
            padding: "8px 20px", 
            borderRadius: 8, 
            background: "rgba(255,255,255,0.05)", 
            border: "1px solid rgba(255,255,255,0.1)", 
            color: "rgba(250,248,243,0.7)", 
            fontSize: 11, 
            fontWeight: 700, 
            cursor: "pointer",
            transition: "all 0.3s",
            display: "flex",
            alignItems: "center",
            gap: 8
          }} 
          onMouseOver={e => e.currentTarget.style.background = "rgba(139, 32, 32, 0.2)"}
          onMouseOut={e => e.currentTarget.style.background = "rgba(255,255,255,0.05)"}
          ><LogOut size={14} /> KELUAR</button>
        </div>
      </header>

      <main style={{ maxWidth: 1280, margin: "0 auto", padding: "clamp(24px, 4vw, 40px) clamp(16px, 4vw, 32px) 100px" }}>

        {/* ── Supabase warning ── */}
        {!isSupabaseReady() && (
          <div className="card-heroic" style={{ padding:"24px", marginBottom:32, borderLeft: "4px solid #8B2020", background: "rgba(139, 32, 32, 0.05)" }}>
            <div style={{ display:"flex", gap:20, alignItems:"center" }}>
              <span className="float-heroic" style={{ fontSize:32 }}>⚠️</span>
              <div>
                <div style={{ fontSize:16, fontWeight:800, color:"#8B2020", marginBottom:4 }}>Supabase Belum Dikonfigurasi</div>
                <div style={{ fontSize:13, lineHeight:1.7, color:"#5A4A40" }}>
                  Data tidak akan tersimpan secara permanen. Tambahkan variabel environment Supabase ke file <code style={{ background:"rgba(0,0,0,.06)", padding:"2px 6px", borderRadius:4 }}>.env.local</code> Anda untuk mengaktifkan database real-time.
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ── SUMMARY STATS HEROIC ── */}
        <div style={{ display:"grid", gridTemplateColumns:"repeat(auto-fit, minmax(220px, 1fr))", gap:20, marginBottom:40 }}>
          {[
            { label:"Total Kegiatan", value: kegiatanList.length, unit: "Acara", icon:<Calendar size={18} />, desc: "Agenda kampung aktif" },
            { label:"Produk Desa",   value: produkList.length, unit: "Item", icon:<ShoppingCart size={18} />, desc: "Karya UMKM lokal" },
            { label:"Total Masuk",    value: formatRp(totalMasuk), unit: "", icon:<ArrowUpCircle size={18} />, desc: "Pemasukan dana", color: "#2F8F4E" },
            { label:"Total Keluar",   value: formatRp(totalKeluar), unit: "", icon:<ArrowDownCircle size={18} />, desc: "Alokasi dana", color: "#8B2020" },
            { label:"Saldo Aktual",   value: formatRp(saldo), unit: "", icon:<Wallet size={18} />, desc: "Dana tersedia", color: "#1C3A2B" },
          ].map((card, i) => (
            <div key={i} className="stat-box-heroic">
              <div className="stat-label-heroic">{card.label}</div>
              <div className="stat-value-heroic" style={{ color: card.color }}>
                {card.value}<span style={{ fontSize: 16, marginLeft: 4 }}>{card.unit}</span>
              </div>
              <div className="stat-desc-heroic" style={{display:"flex", alignItems:"center", gap:6, justifyContent:"center"}}>{card.icon} {card.desc}</div>
            </div>
          ))}
        </div>

        {/* ── TAB NAV HEROIC ── */}
        <div style={{ 
          display:"flex", 
          gap:8, 
          marginBottom:32, 
          background:"rgba(255, 254, 249, 0.6)", 
          padding:6, 
          borderRadius:16, 
          border:"1.5px solid rgba(47, 143, 78, 0.15)", 
          width:"fit-content", 
          flexWrap:"wrap",
          backdropFilter: "blur(8px)"
        }}>
          {([
            ["dashboard", <><LayoutDashboard size={16}/> Dashboard</>],
            ["pengurus", <><Users size={16}/> Pengurus</>],
            ["kegiatan", <><Calendar size={16}/> Kegiatan</>],
            ["produk", <><ShoppingCart size={16}/> Produk</>],
            ["transaksi", <><Wallet size={16}/> Transaksi</>],
            ["testimoni", <><MessageSquare size={16}/> Tokoh & Berita</>],
            ["iklan", <><Video size={16}/> Iklan Promo</>]
          ] as const).map(([key, label]) => (
            <button key={key} onClick={() => setActiveTab(key)} style={{
              padding:"10px 24px", 
              borderRadius:12, 
              fontSize:12, 
              fontWeight:800, 
              letterSpacing:".04em",
              border:"none", 
              cursor:"pointer", 
              transition:"all 0.3s cubic-bezier(0.22, 1, 0.36, 1)",
              background: activeTab === key ? "linear-gradient(135deg, #2F8F4E, #4FBF7E)" : "transparent",
              color: activeTab === key ? "#fff" : "#5A4A40",
              boxShadow: activeTab === key ? "0 8px 20px rgba(47, 143, 78, 0.25)" : "none",
              transform: activeTab === key ? "translateY(-2px)" : "none",
              display: "flex",
              alignItems: "center",
              gap: 8
            }}>{label}</button>
          ))}
        </div>

        {/* ═══════════════ TAB: DASHBOARD ═══════════════ */}
        {activeTab === "dashboard" && (() => {
          const imunPct = dashData.imunTotal>0?Math.round((dashData.imunSudah/dashData.imunTotal)*100):0;
          // Donut chart SVG helper
          function DonutChart({laki,perempuan}:{laki:number;perempuan:number}) {
            const total = laki+perempuan||1;
            const R=40,cx=50,cy=50,sw=14,circ=2*Math.PI*R;
            const lakiDash=circ*(laki/total);
            const perDash=circ*(perempuan/total);
            return (
              <svg width={100} height={100}>
                <circle cx={cx} cy={cy} r={R} fill="none" stroke="#2F8F4E" strokeWidth={sw} strokeDasharray={`${lakiDash} ${circ-lakiDash}`} strokeDashoffset={circ*0.25} style={{ opacity: 0.8 }}/>
                <circle cx={cx} cy={cy} r={R} fill="none" stroke="#4FBF7E" strokeWidth={sw} strokeDasharray={`${perDash} ${circ-perDash}`} strokeDashoffset={circ*0.25-lakiDash} style={{ opacity: 0.4 }}/>
                <text x={cx} y={cy-4} textAnchor="middle" fontSize={14} fontWeight="900" fill="#1C3A2B">{total}</text>
                <text x={cx} y={cy+12} textAnchor="middle" fontSize={8} fill="#9A8C85" fontWeight="700">JIWA</text>
              </svg>
            );
          }
          // Radial progress
          function RadialBar({pct}:{pct:number}) {
            const R=36,circ=2*Math.PI*R,dash=circ*(pct/100);
            return (
              <svg width={90} height={90}>
                <circle cx={45} cy={45} r={R} fill="none" stroke="rgba(47,143,78,.1)" strokeWidth={10}/>
                <circle cx={45} cy={45} r={R} fill="none" stroke="#2F8F4E" strokeWidth={10} strokeDasharray={`${dash} ${circ-dash}`} strokeDashoffset={circ*0.25} strokeLinecap="round"/>
                <text x={45} y={41} textAnchor="middle" fontSize={14} fontWeight="900" fill="#1C3A2B">{pct}%</text>
                <text x={45} y={55} textAnchor="middle" fontSize={8} fill="#9A8C85" fontWeight="700">TARGET</text>
              </svg>
            );
          }
          // Area chart sampah
          function AreaChart() {
            if (sampahTren.length < 2) return <div style={{textAlign:"center",padding:20,color:"#9A8C85",fontSize:11}}>Butuh min 2 bulan data</div>;
            const W=260,H=90,P=20;
            const maxKg=Math.max(...sampahTren.map(d=>d.kg))*1.1||1;
            const xStep=(W-P*2)/(sampahTren.length-1);
            const yFn=(v:number)=>H-P-((v/maxKg)*(H-P*2));
            const pts=sampahTren.map((d,i)=>({x:P+i*xStep,y:yFn(d.kg),kg:d.kg,b:d.b}));
            const path=pts.map((p,i)=>`${i===0?"M":"L"}${p.x},${p.y}`).join(" ");
            const area=`${path} L${pts[pts.length-1].x},${H-P} L${P},${H-P} Z`;
            return (
              <svg width="100%" height={H} viewBox={`0 0 ${W} ${H}`} preserveAspectRatio="none">
                <defs><linearGradient id="dg" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor="#2F8F4E" stopOpacity="0.2"/><stop offset="100%" stopColor="#2F8F4E" stopOpacity="0"/></linearGradient></defs>
                <path d={area} fill="url(#dg)"/>
                <path d={path} fill="none" stroke="#2F8F4E" strokeWidth={3} strokeLinecap="round" strokeLinejoin="round"/>
                {pts.map((p,i)=>(
                  <g key={i}>
                    <circle cx={p.x} cy={p.y} r={4} fill="#2F8F4E" stroke="white" strokeWidth={2}/>
                    <text x={p.x} y={H-4} fontSize={8} textAnchor="middle" fill="#9A8C85" fontWeight="700">{p.b}</text>
                  </g>
                ))}
              </svg>
            );
          }
          const ICON:Record<string,React.ReactNode>={
            posyandu:<Baby size={20}/>,
            ronda:<ShieldCheck size={20}/>,
            bank_sampah:<Recycle size={20}/>,
            tukar:<Sparkles size={20}/>,
            kerja_bakti:<Users size={20}/>,
            masjid:<Landmark size={20}/>,
            learning_hub:<Book size={20}/>,
            lapor_fasilitas:<Info size={20}/>
          };
          return (
            <div className="float-heroic-subtle">
              {/* Banner ultah hari ini heroic */}
              {ultahHari.length>0 && (
                <div className="pulse-glow-heroic" style={{background:"linear-gradient(135deg, #2F8F4E, #4FBF7E)", borderRadius:16, padding:"clamp(16px, 4vw, 20px) clamp(20px, 5vw, 28px)", marginBottom:32, color:"white", display:"flex", alignItems:"center", gap:20, border: "none" }}>
                  <div className="float-heroic" style={{background:"rgba(255,255,255,0.2)", width:60, height:60, borderRadius:"50%", display:"flex", alignItems:"center", justifyContent:"center"}}><Sparkles size={32} /></div>
                  <div>
                    <div style={{fontWeight:900, fontSize:18, letterSpacing: "-0.02em"}}>HARI SPESIAL DESA! 🎉</div>
                    <div style={{fontSize:15, opacity:0.95, fontWeight: 500}}>Warga berulang tahun: {ultahHari.map((a:any)=>{
                      const umur=new Date().getFullYear()-new Date(a.tgl_lahir).getFullYear();
                      return `${a.nama} (${umur} thn)`;
                    }).join(" · ")}</div>
                  </div>
                </div>
              )}

              {/* Stats row dash - mini heroic boxes */}
              <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fit,minmax(180px,1fr))",gap:16,marginBottom:32}}>
                {[
                  {i:<Home size={24}/>,v:dashData.totalKK||0,l:"TOTAL KK",c:"#1C3A2B"},
                  {i:<Users size={24}/>,v:dashData.totalJiwa||0,l:"TOTAL JIWA",c:"#1C3A2B"},
                  {i:<Recycle size={24}/>,v:`${(dashData.totKg||0).toFixed(0)}`,u:"kg",l:"SAMPAH",c:"#2F8F4E"},
                  {i:<Coins size={24}/>,v:(dashData.totPoin||0).toLocaleString(),l:"TOTAL POIN",c:"#4FBF7E"},
                  {i:<Baby size={24}/>,v:dashData.anakPosyandu||0,l:"ANAK POSYANDU",c:"#8B2020"},
                  {i:<Landmark size={24}/>,v:`${dashData.muzakki||0}/${dashData.mustahiq||0}`,l:"ZAKAT",c:"#1C3A2B"},
                ].map((s, idx)=>(
                  <div key={idx} className="stat-box-heroic" style={{ padding: "20px", textAlign: "left" }}>
                    <div style={{color: s.c, marginBottom:12}}>{s.i}</div>
                    <div className="stat-value-heroic" style={{fontSize:24, color: s.c}}>{s.v}<span style={{fontSize:12, marginLeft:2}}>{s.u}</span></div>
                    <div className="stat-label-heroic" style={{fontSize:10}}>{s.l}</div>
                  </div>
                ))}
              </div>

              {/* Charts row heroic cards */}
              <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fit, minmax(300px, 1fr))",gap:24,marginBottom:32}}>
                {/* Donut demografi */}
                <div className="card-heroic">
                  <div className="badge-heroic" style={{marginBottom:20}}>📊 DEMOGRAFI WARGA</div>
                  <div style={{display:"flex", alignItems:"center", gap: 32}}>
                    <DonutChart laki={dashData.laki||0} perempuan={dashData.perempuan||0}/>
                    <div style={{display:"flex", flexDirection:"column", gap:8}}>
                      <div style={{display:"flex", alignItems:"center", gap:8}}>
                        <div style={{width:12, height:12, borderRadius:3, background:"#2F8F4E"}}/>
                        <span style={{fontSize:13, fontWeight:700, color:"#1C3A2B"}}>👨 LAKI: {dashData.laki||0}</span>
                      </div>
                      <div style={{display:"flex", alignItems:"center", gap:8}}>
                        <div style={{width:12, height:12, borderRadius:3, background:"#4FBF7E", opacity: 0.6}}/>
                        <span style={{fontSize:13, fontWeight:700, color:"#1C3A2B"}}>👩 PEREMPUAN: {dashData.perempuan||0}</span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Radial imunisasi */}
                <div className="card-heroic" style={{textAlign:"center"}}>
                  <div className="badge-heroic" style={{marginBottom:20}}>💉 CAPAIAN POSYANDU</div>
                  <div style={{display:"flex", justifyContent:"center", marginBottom: 16}}><RadialBar pct={imunPct}/></div>
                  <div style={{fontSize:12, fontWeight: 700, color:"#9A8C85"}}>{dashData.imunSudah||0} DARI {dashData.imunTotal||0} JADWAL SELESAI</div>
                </div>

                {/* Area chart sampah */}
                <div className="card-heroic">
                  <div className="badge-heroic" style={{marginBottom:20}}>♻️ TREN BANK SAMPAH (KG)</div>
                  <div style={{ marginTop: 10 }}><AreaChart/></div>
                </div>
              </div>

              {/* Aktivitas & Quick Links Heroic */}
              <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fit, minmax(min(100%, 400px), 1fr))",gap:24}}>
                {/* Aktivitas realtime */}
                <div className="card-heroic">
                  <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:24}}>
                    <div className="badge-heroic">⚡ AKTIVITAS REALTIME</div>
                    <span className="pulse-glow-heroic" style={{width:10,height:10,borderRadius:"50%",background:"#2F8F4E"}}/>
                  </div>
                  <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
                    {aktivitas.length===0?(
                      <div style={{textAlign:"center",padding:"clamp(24px, 5vw, 40px)",color:"#9A8C85",fontSize:13, fontWeight: 600}}>Menunggu aktivitas warga...</div>
                    ):aktivitas.map((a:any,i:number)=>(
                      <div key={a.id} style={{display:"flex",gap:16,paddingBottom:16,borderBottom:i<aktivitas.length-1?"1px solid rgba(47,143,78,0.1)":"none",alignItems:"flex-start"}}>
                        <div style={{width:40, height:40, borderRadius:10, background:"rgba(47,143,78,0.1)", display:"flex", alignItems:"center", justifyContent:"center", fontSize:20, flexShrink:0}}>{ICON[a.sumber]||"📌"}</div>
                        <div style={{flex:1}}>
                          <div style={{fontSize:14, fontWeight:700, color:"#1C3A2B", marginBottom:4}}>{a.keterangan}</div>
                          <div style={{fontSize:11, color:"#9A8C85", fontWeight: 700}}>{a.anggota_kk?.nama || "Warga"} · +{a.jumlah} POIN</div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Right col: Quick Links & Ultah */}
                <div style={{ display: "flex", flexDirection: "column", gap: 24 }}>
                   {/* Quick links card */}
                   <div className="card-heroic" style={{ background: "linear-gradient(135deg, rgba(28, 58, 43, 0.95), rgba(47, 143, 78, 0.95))", color: "white" }}>
                    <div className="stat-label-heroic" style={{ color: "rgba(255,255,255,0.7)", marginBottom: 20 }}>AKSES CEPAT MODUL</div>
                    <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:12}}>
                      {[
                        {href:"/admin/warga",i:<Users size={16}/>,l:"DATA WARGA"},
                        {href:"/admin/posyandu",i:<Baby size={16}/>,l:"POSYANDU"},
                        {href:"/admin/bank-sampah",i:<Recycle size={16}/>,l:"BANK SAMPAH"},
                        {href:"/admin/ronda",i:<ShieldCheck size={16}/>,l:"RONDA NFC"},
                        {href:"/admin/zakat",i:<Landmark size={16}/>,l:"ZAKAT"},
                        {href:"/admin/dashboard",i:<LayoutDashboard size={16}/>,l:"ANALYTICS"},
                        {href:"/admin/orders",i:<Package size={16}/>,l:"PESANAN"},
                        {href:"/admin/kalender",i:<Calendar size={16}/>,l:"KALENDER"},
                        {href:"/admin/voting",i:<Coins size={16}/>,l:"VOTING"},
                        {href:"/admin/learning-hub",i:<Book size={16}/>,l:"LEARNING HUB"},
                        {href:"/admin/toko",i:<ShoppingCart size={16}/>,l:"TOKO & PENJUAL"},
                      ].map(l=>(
                        <a key={l.href} href={l.href} style={{display:"flex",alignItems:"center",gap:10,padding:"14px",borderRadius:12,background:"rgba(255,255,255,0.1)",border:"1px solid rgba(255,255,255,0.1)",textDecoration:"none",color:"white",fontSize:12,fontWeight:800, transition: "all 0.3s"}} 
                        onMouseOver={e => {e.currentTarget.style.background = "rgba(255,255,255,0.2)"; e.currentTarget.style.transform = "translateX(4px)"}}
                        onMouseOut={e => {e.currentTarget.style.background = "rgba(255,255,255,0.1)"; e.currentTarget.style.transform = "none"}}>
                          <span>{l.i}</span><span>{l.l}</span>
                        </a>
                      ))}
                    </div>
                  </div>

                  {/* Upcoming birthdays */}
                  {ultahMinggu.length > 0 && (
                    <div className="card-heroic">
                      <div className="badge-heroic" style={{marginBottom:20}}>📅 AKAN DATANG (7 HARI)</div>
                      <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                        {ultahMinggu.slice(0,4).map((a:any,i:number)=>(
                          <div key={i} style={{display:"flex",justifyContent:"space-between",alignItems:"center",fontSize:13,paddingBottom:10,borderBottom:i<ultahMinggu.length-1?"1px solid rgba(0,0,0,0.05)":"none"}}>
                            <span style={{fontWeight: 700, color: "#1C3A2B"}}>🎂 {a.nama}</span>
                            <span className="badge-heroic" style={{fontSize:10, padding: "4px 10px"}}>{new Date(a.tgl_lahir).getDate()}/{new Date(a.tgl_lahir).getMonth()+1}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          );
        })()}

        {/* ═══════════════ TAB: KEGIATAN ═══════════════ */}
        {activeTab === "kegiatan" && (
          <div style={{ display:"grid", gridTemplateColumns:"repeat(auto-fit, minmax(350px, 1fr))", gap:32, alignItems:"start" }}>

            {/* Form tambah */}
            <div className="card-heroic">
              <div className="badge-heroic" style={{marginBottom:24}}>➕ TAMBAH KEGIATAN BARU</div>
              <div className="form-heroic">
                <div className="form-group-heroic">
                  <label className="form-label-heroic">JUDUL ACARA *</label>
                  <input className="form-input-heroic" value={kForm.judul} onChange={e => setKForm({...kForm, judul:e.target.value})} placeholder="Cth: Peringatan Maulid Nabi SAW" />
                </div>
                <div className="form-group-heroic">
                  <label className="form-label-heroic">TANGGAL *</label>
                  <input type="date" className="form-input-heroic" value={kForm.tanggal} onChange={e => setKForm({...kForm, tanggal:e.target.value})} />
                </div>
                <div className="form-group-heroic">
                  <label className="form-label-heroic">KATEGORI *</label>
                  <select className="form-input-heroic" value={kForm.kategori} onChange={e => setKForm({...kForm, kategori:e.target.value})}>
                    {KAT_OPTIONS.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
                  </select>
                </div>
                <div className="form-group-heroic">
                  <label className="form-label-heroic">DESKRIPSI</label>
                  <textarea className="form-input-heroic" rows={3} value={kForm.deskripsi} onChange={e => setKForm({...kForm, deskripsi:e.target.value})} placeholder="Ceritakan sedikit tentang acara ini..." style={{ resize:"vertical" }} />
                </div>
                <div className="gradient-border-heroic" style={{ padding: 20 }}>
                  <label className="form-label-heroic" style={{ color:"#1C3A2B", marginBottom:12, display: "block" }}>📸 GALERI FOTO (MAX 8)</label>
                  <div style={{ display:"grid", gridTemplateColumns:"repeat(4,1fr)", gap:8 }}>
                    {kFiles.map((f, i) => (
                      <label key={i} style={{ aspectRatio:"1", background:f ? "rgba(47,143,78,0.1)" : "rgba(0,0,0,0.03)", border:f ? "2px solid #2F8F4E" : "1px dashed rgba(0,0,0,0.1)", borderRadius:10, display:"flex", alignItems:"center", justifyContent:"center", cursor:"pointer", overflow:"hidden", position:"relative", transition: "all 0.3s" }}>
                        <input type="file" accept="image/*,video/mp4,video/webm" style={{ display:"none" }} onChange={e => {
                          const n = [...kFiles];
                          n[i] = e.target.files?.[0] || null;
                          setKFiles(n);
                        }} />
                        {f ? <span style={{ fontSize:20 }}>🖼️</span> : <span style={{ fontSize:16, color:"rgba(0,0,0,0.2)" }}>+</span>}
                      </label>
                    ))}
                  </div>
                </div>
                <button className="btn-heroic" onClick={addKegiatan} disabled={loading} style={{ marginTop: 8 }}>
                  <span>{loading ? "MENYIMPAN..." : "SIMPAN KEGIATAN"}</span>
                </button>
              </div>
            </div>

            {/* List */}
            <div className="card-heroic" style={{ padding: 0, overflow: "hidden" }}>
              <div style={{ padding:"24px 32px", borderBottom:"1px solid rgba(47,143,78,0.1)", display:"flex", justifyContent:"space-between", alignItems:"center" }}>
                <div className="badge-heroic">📅 DAFTAR KEGIATAN ({kegiatanList.length})</div>
              </div>
              {kegiatanList.length === 0 ? (
                <div style={{ padding:"60px", textAlign:"center", color:"#9A8C85", fontWeight: 600 }}>Belum ada agenda kegiatan.</div>
              ) : (
                <div style={{ maxHeight:600, overflowY:"auto" }}>
                  {kegiatanList.map((k) => {
                    const kat = KAT_OPTIONS.find(o => o.value === k.kategori);
                    return (
                      <div key={k.id} style={{ padding:"20px 32px", borderBottom:"1px solid rgba(0,0,0,0.05)", display:"flex", gap:20, alignItems:"flex-start", transition:"all 0.3s" }} className="row-hover-heroic">
                        {k.foto && (() => {
                          const f = k.foto.split(',')[0];
                          return (f.toLowerCase().includes(".mp4") || f.toLowerCase().includes(".webm")) 
                            ? <video src={f} muted style={{ width:64, height:64, borderRadius:12, objectFit:"cover", flexShrink:0, boxShadow: "0 4px 12px rgba(0,0,0,0.1)" }} />
                            : <img src={f} alt="" style={{ width:64, height:64, borderRadius:12, objectFit:"cover", flexShrink:0, boxShadow: "0 4px 12px rgba(0,0,0,0.1)" }} />;
                        })()}
                        <div style={{ flex:1, minWidth:0 }}>
                          <div style={{ display:"flex", gap:8, alignItems:"center", marginBottom:6 }}>
                            <span style={{ fontSize:10, fontWeight:800, padding:"3px 10px", borderRadius:99, background:"rgba(47,143,78,0.1)", color:"#2F8F4E" }}>{kat?.label || k.kategori}</span>
                            <span style={{ fontSize:11, color:"#9A8C85", fontWeight: 700 }}>{new Date(k.tanggal).toLocaleDateString("id-ID", { day:"numeric", month:"short", year:"numeric" })}</span>
                          </div>
                          <div style={{ fontSize:15, fontWeight:800, color:"#1C3A2B", marginBottom:4 }}>{k.judul}</div>
                          {k.deskripsi && <div style={{ fontSize:13, color:"#5A4A40", lineHeight:1.6, opacity: 0.8 }}>{k.deskripsi.substring(0, 100)}...</div>}
                        </div>
                        <button onClick={() => deleteKegiatan(k.id)} style={{ padding: "8px", borderRadius: 8, background: "rgba(139,32,32,0.05)", border: "1px solid rgba(139,32,32,0.1)", color: "#8B2020", cursor: "pointer" }}>🗑️</button>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        )}

        {/* ═══════════════ TAB: PRODUK ═══════════════ */}
        {activeTab === "produk" && (
          <div style={{ display:"grid", gridTemplateColumns:"repeat(auto-fit, minmax(350px, 1fr))", gap:32, alignItems:"start" }}>

            {/* Form tambah */}
            <div className="card-heroic">
              <div className="badge-heroic" style={{marginBottom:24}}>➕ TAMBAH PRODUK BARU</div>
              <div className="form-heroic">
                <div className="form-group-heroic">
                  <label className="form-label-heroic">NAMA PRODUK *</label>
                  <input className="form-input-heroic" value={pForm.nama} onChange={e => setPForm({...pForm, nama:e.target.value})} placeholder="Cth: Lampu Hex-Bamboo" />
                </div>
                <div className="form-group-heroic">
                  <label className="form-label-heroic">DESKRIPSI</label>
                  <textarea className="form-input-heroic" rows={3} value={pForm.deskripsi} onChange={e => setPForm({...pForm, deskripsi:e.target.value})} placeholder="Deskripsi singkat produk..." style={{ resize:"vertical" }} />
                </div>
                <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:16 }}>
                  <div className="form-group-heroic">
                    <label className="form-label-heroic">HARGA (RP) *</label>
                    <input type="number" className="form-input-heroic" value={pForm.harga} onChange={e => setPForm({...pForm, harga:e.target.value})} placeholder="150000" />
                  </div>
                  <div className="form-group-heroic">
                    <label className="form-label-heroic">ICON / EMOJI</label>
                    <input className="form-input-heroic" value={pForm.icon} onChange={e => setPForm({...pForm, icon:e.target.value})} placeholder="🎋" style={{ fontSize:20 }} />
                  </div>
                </div>
                <div className="form-group-heroic">
                  <label className="form-label-heroic">TAG / LABEL</label>
                  <input className="form-input-heroic" value={pForm.tag} onChange={e => setPForm({...pForm, tag:e.target.value})} placeholder="Cth: Best Seller / Handmade / Eco" />
                </div>
                <div className="gradient-border-heroic" style={{ padding: 20 }}>
                  <label className="form-label-heroic" style={{ color:"#1C3A2B", marginBottom:12, display: "block" }}>📸 FOTO PRODUK (MAX 5)</label>
                  <div style={{ display:"grid", gridTemplateColumns:"repeat(5,1fr)", gap:8 }}>
                    {[0,1,2,3,4].map((idx) => (
                      <label key={idx} style={{ aspectRatio:"1", background:pFiles[idx] ? "rgba(47,143,78,0.1)" : "rgba(0,0,0,0.03)", border:pFiles[idx] ? "2px solid #2F8F4E" : "1px dashed rgba(0,0,0,0.1)", borderRadius:8, display:"flex", alignItems:"center", justifyContent:"center", cursor:"pointer", overflow:"hidden", transition: "all 0.3s" }}>
                        <input type="file" accept="image/*" onChange={(e) => {
                          const newFiles = [...pFiles];
                          newFiles[idx] = e.target.files?.[0] || null;
                          setPFiles(newFiles);
                        }} style={{ display:"none" }} />
                        {pFiles[idx] ? <span style={{ fontSize:16 }}>🖼️</span> : <span style={{ fontSize:14, color:"rgba(0,0,0,0.2)" }}>+</span>}
                      </label>
                    ))}
                  </div>
                </div>
                <button className="btn-heroic" onClick={addProduk} disabled={loading} style={{ marginTop: 8 }}>
                  <span>{loading ? "MENYIMPAN..." : "SIMPAN PRODUK"}</span>
                </button>
              </div>
            </div>

            {/* List */}
            <div className="card-heroic" style={{ padding: 0, overflow: "hidden" }}>
              <div style={{ padding:"24px 32px", borderBottom:"1px solid rgba(47,143,78,0.1)" }}>
                <div className="badge-heroic">🛒 DAFTAR PRODUK ({produkList.length})</div>
              </div>
              {produkList.length === 0 ? (
                <div style={{ padding:"60px", textAlign:"center", color:"#9A8C85", fontWeight: 600 }}>Belum ada produk terdaftar.</div>
              ) : (
                <div style={{ maxHeight:600, overflowY:"auto" }}>
                  {produkList.map((p) => (
                    <div key={p.id} style={{ padding:"20px 32px", borderBottom:"1px solid rgba(0,0,0,0.05)", display:"flex", gap:20, alignItems:"center", transition:"all 0.3s" }} className="row-hover-heroic">
                      <div style={{ width:56, height:56, borderRadius:12, background:"linear-gradient(135deg, rgba(47,143,78,0.1), rgba(79,191,126,0.1))", display:"flex", alignItems:"center", justifyContent:"center", fontSize:28, flexShrink:0 }}>{p.icon}</div>
                      <div style={{ flex:1 }}>
                        <div style={{ display:"flex", gap:8, alignItems:"center", marginBottom:4 }}>
                          <span style={{ fontSize:15, fontWeight:800, color:"#1C3A2B" }}>{p.nama}</span>
                          {p.tag && <span style={{ fontSize:9, fontWeight:800, padding:"2px 8px", borderRadius:99, background:"#2F8F4E", color:"#fff" }}>{p.tag}</span>}
                        </div>
                        <div style={{ fontSize:14, color:"#2F8F4E", fontWeight:800 }}>{formatRp(p.harga)}</div>
                        {p.deskripsi && <div style={{ fontSize:12, color:"#9A8C85", marginTop:4, fontWeight: 500 }}>{p.deskripsi}</div>}
                      </div>
                      <button onClick={() => deleteProduk(p.id, p.foto)} style={{ padding: "8px", borderRadius: 8, background: "rgba(139,32,32,0.05)", border: "1px solid rgba(139,32,32,0.1)", color: "#8B2020", cursor: "pointer" }}>🗑️</button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

        {/* ═══════════════ TAB: TRANSAKSI ═══════════════ */}
        {activeTab === "transaksi" && (
          <div style={{ display:"flex", flexDirection:"column", gap:32 }}>

            {/* Form tambah */}
            <div className="card-heroic">
              <div className="badge-heroic" style={{marginBottom:24}}>➕ CATAT TRANSAKSI BARU</div>
              <div style={{ display:"grid", gridTemplateColumns:"repeat(auto-fit, minmax(200px, 1fr))", gap:20 }}>
                <div className="form-group-heroic">
                  <label className="form-label-heroic">TANGGAL *</label>
                  <input type="date" className="form-input-heroic" value={tForm.tanggal} onChange={e => setTForm({...tForm, tanggal:e.target.value})} />
                </div>
                <div className="form-group-heroic">
                  <label className="form-label-heroic">TIPE ALIRAN DANA *</label>
                  <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:8 }}>
                    {(["masuk","keluar"] as const).map(t => (
                      <button key={t} onClick={() => setTForm(f => ({
                        ...f,
                        tipe: t,
                        kategori: t === "masuk" ? KAT_MASUK[0] : KAT_KELUAR[0],
                      }))} style={{
                        padding:"12px", borderRadius:10, fontSize:11, fontWeight:800, border:"2px solid transparent", cursor:"pointer", transition:"all 0.3s",
                        background: tForm.tipe === t ? (t === "masuk" ? "rgba(47,143,78,0.15)" : "rgba(139,32,32,0.1)") : "rgba(0,0,0,0.03)",
                        color: tForm.tipe === t ? (t === "masuk" ? "#2F8F4E" : "#8B2020") : "#9A8C85",
                        borderColor: tForm.tipe === t ? (t === "masuk" ? "#2F8F4E" : "#8B2020") : "transparent",
                      }}>
                        {t === "masuk" ? "↑ MASUK" : "↓ KELUAR"}
                      </button>
                    ))}
                  </div>
                </div>
                <div className="form-group-heroic">
                  <label className="form-label-heroic">KATEGORI</label>
                  <select className="form-input-heroic" value={tForm.kategori} onChange={e => setTForm({...tForm, kategori:e.target.value})}>
                    {(tForm.tipe === "masuk" ? KAT_MASUK : KAT_KELUAR).map(k => <option key={k}>{k}</option>)}
                  </select>
                </div>
                <div className="form-group-heroic">
                  <label className="form-label-heroic">JUMLAH (RP) *</label>
                  <input type="number" className="form-input-heroic" value={tForm.jumlah} onChange={e => setTForm({...tForm, jumlah:e.target.value})} placeholder="500000" />
                </div>
                <div className="form-group-heroic" style={{ gridColumn:"1/-1" }}>
                  <label className="form-label-heroic">KETERANGAN TRANSAKSI *</label>
                  <input className="form-input-heroic" value={tForm.keterangan} onChange={e => setTForm({...tForm, keterangan:e.target.value})} placeholder="Cth: Donasi QRIS dari Bpk. Ahmad" />
                </div>
              </div>
              <div style={{ display:"flex", gap:12, marginTop:24 }}>
                <button className="btn-heroic" onClick={() => addTransaksi(false)} disabled={loading} style={{ flex:1, background: "linear-gradient(135deg, #1C3A2B, #2F8F4E)" }}>
                  <span>{loading ? "MENYIMPAN..." : "SIMPAN DATA"}</span>
                </button>
                <button className="btn-heroic" onClick={() => addTransaksi(true)} disabled={loading} style={{ flex:1, background: "linear-gradient(135deg, #B8943F, #D4AC5A)" }}>
                  <span>✉️ SIMPAN & NOTIF GMAIL</span>
                </button>
              </div>
            </div>

            {/* List */}
            <div className="card-heroic" style={{ padding: 0, overflow: "hidden" }}>
              <div style={{ padding:"24px 32px", borderBottom:"1px solid rgba(47,143,78,0.1)", display:"flex", justifyContent:"space-between", alignItems:"center", flexWrap:"wrap", gap:16 }}>
                <div className="badge-heroic">💰 RIWAYAT TRANSAKSI ({transaksiList.length})</div>
                <div style={{ display:"flex", gap:20 }}>
                  <div style={{ textAlign: "right" }}>
                    <div style={{ fontSize: 10, fontWeight: 800, color: "#9A8C85" }}>TOTAL MASUK</div>
                    <div style={{ fontSize: 14, fontWeight: 900, color: "#2F8F4E" }}>{formatRp(totalMasuk)}</div>
                  </div>
                  <div style={{ textAlign: "right" }}>
                    <div style={{ fontSize: 10, fontWeight: 800, color: "#9A8C85" }}>TOTAL KELUAR</div>
                    <div style={{ fontSize: 14, fontWeight: 900, color: "#8B2020" }}>{formatRp(totalKeluar)}</div>
                  </div>
                </div>
              </div>
              <div style={{ overflowX:"auto" }}>
                <table className="table-heroic">
                  <thead>
                    <tr>
                      {["Tanggal","Keterangan","Kategori","Tipe","Jumlah","Aksi"].map(h => (
                        <th key={h}>{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {transaksiList.length === 0 ? (
                      <tr><td colSpan={6} style={{ padding:"60px", textAlign:"center", color:"#9A8C85", fontWeight: 600 }}>Belum ada data transaksi.</td></tr>
                    ) : transaksiList.map(t => (
                      <tr key={t.id}>
                        <td style={{ whiteSpace:"nowrap", fontSize: 12, fontWeight: 700 }}>
                          {new Date(t.tanggal).toLocaleDateString("id-ID", { day:"numeric", month:"short", year:"numeric" })}
                        </td>
                        <td style={{ fontSize: 13, fontWeight: 600, color: "#1C3A2B" }}>{t.keterangan}</td>
                        <td><span className="badge-heroic" style={{ padding: "4px 10px", fontSize: 10, border: "none", background: "rgba(0,0,0,0.05)" }}>{t.kategori}</span></td>
                        <td>
                          <span style={{ fontSize:10, fontWeight:900, color: t.tipe === "masuk" ? "#2F8F4E" : "#8B2020" }}>
                            {t.tipe === "masuk" ? "↑ MASUK" : "↓ KELUAR"}
                          </span>
                        </td>
                        <td style={{ fontSize:13, fontWeight:900, whiteSpace:"nowrap", color: t.tipe === "masuk" ? "#2F8F4E" : "#8B2020" }}>
                          {t.tipe === "masuk" ? "+" : "-"}{formatRp(t.jumlah)}
                        </td>
                        <td>
                          <div style={{ display:"flex", gap:8 }}>
                            <button onClick={() => openGmailNotif(t)} style={{ padding: "6px", borderRadius: 6, background: "rgba(184,148,63,0.1)", border: "none", cursor: "pointer" }}>✉️</button>
                            <button onClick={() => deleteTransaksi(t.id)} style={{ padding: "6px", borderRadius: 6, background: "rgba(139,32,32,0.05)", border: "none", cursor: "pointer" }}>🗑️</button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* ═══════════════ TAB: TESTIMONI ═══════════════ */}
        {activeTab === "testimoni" && (
          <div style={{ display:"grid", gridTemplateColumns:"repeat(auto-fit, minmax(350px, 1fr))", gap:32, alignItems:"start" }}>
            {/* Form tambah */}
            <div className="card-heroic">
              <div className="badge-heroic" style={{marginBottom:24}}>➕ TAMBAH TESTIMONI / BERITA</div>
              <div className="form-heroic">
                <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:10 }}>
                  <button onClick={() => setTmForm({...tmForm, tipe:"tokoh"})} style={{ padding:"12px", fontSize:11, fontWeight:800, borderRadius:10, border:"2px solid", cursor:"pointer", transition: "all 0.3s", background: tmForm.tipe === "tokoh" ? "#1C3A2B" : "rgba(0,0,0,0.03)", color: tmForm.tipe === "tokoh" ? "#fff" : "#9A8C85", borderColor: tmForm.tipe === "tokoh" ? "#1C3A2B" : "transparent" }}>👤 DARI TOKOH</button>
                  <button onClick={() => setTmForm({...tmForm, tipe:"berita"})} style={{ padding:"12px", fontSize:11, fontWeight:800, borderRadius:10, border:"2px solid", cursor:"pointer", transition: "all 0.3s", background: tmForm.tipe === "berita" ? "#1A3A6B" : "rgba(0,0,0,0.03)", color: tmForm.tipe === "berita" ? "#fff" : "#9A8C85", borderColor: tmForm.tipe === "berita" ? "#1A3A6B" : "transparent" }}>📰 ARTIKEL BERITA</button>
                </div>
                <div className="form-group-heroic">
                  <label className="form-label-heroic">NAMA TOKOH / MEDIA *</label>
                  <input className="form-input-heroic" value={tmForm.nama} onChange={e => setTmForm({...tmForm, nama:e.target.value})} placeholder="Cth: Garut News / H. Kepala Desa" />
                </div>
                <div className="form-group-heroic">
                  <label className="form-label-heroic">JABATAN / SUBTEKS</label>
                  <input className="form-input-heroic" value={tmForm.jabatan} onChange={e => setTmForm({...tmForm, jabatan:e.target.value})} placeholder="Cth: Media Lokal / Kepala Kecamatan" />
                </div>
                <div className="form-group-heroic">
                  <label className="form-label-heroic">ISI PESAN / KUTIPAN *</label>
                  <textarea className="form-input-heroic" rows={4} value={tmForm.pesan} onChange={e => setTmForm({...tmForm, pesan:e.target.value})} placeholder="Ketik disini..." style={{ resize:"vertical" }} />
                </div>
                <div className="gradient-border-heroic" style={{ padding: 20 }}>
                  <label className="form-label-heroic" style={{ marginBottom: 12, display: "block" }}>📸 UPLOAD FOTO / LOGO</label>
                  <input type="file" accept="image/*" onChange={e => setTmFile(e.target.files?.[0] || null)} style={{ fontSize:12, width:"100%" }} />
                  {tmFile && <p style={{ fontSize:10, color:"#2F8F4E", marginTop:8, fontWeight:800 }}>✓ {tmFile.name}</p>}
                </div>
                <button className="btn-heroic" onClick={addTestimoni} disabled={loading} style={{ marginTop: 8 }}>
                  <span>{loading ? "MENYIMPAN..." : "SIMPAN DATA"}</span>
                </button>
              </div>
            </div>

            {/* List */}
            <div className="card-heroic" style={{ padding: 0, overflow: "hidden" }}>
              <div style={{ padding:"24px 32px", borderBottom:"1px solid rgba(47,143,78,0.1)" }}>
                <div className="badge-heroic">💬 DAFTAR TESTIMONI & BERITA ({testimoniList.length})</div>
              </div>
              {testimoniList.length === 0 ? (
                <div style={{ padding:"60px", textAlign:"center", color:"#9A8C85", fontWeight: 600 }}>Belum ada data testimoni.</div>
              ) : (
                <div style={{ maxHeight:600, overflowY:"auto" }}>
                  {testimoniList.map((tm) => (
                    <div key={tm.id} style={{ padding:"20px 32px", borderBottom:"1px solid rgba(0,0,0,0.05)", display:"flex", gap:20, alignItems:"flex-start", transition: "all 0.3s" }} className="row-hover-heroic">
                      {tm.foto ? <img src={tm.foto} alt="" style={{ width:56, height:56, borderRadius:"50%", objectFit:"cover", flexShrink:0, border:"3px solid rgba(47,143,78,0.2)" }} /> : <div style={{ width:56, height:56, borderRadius:"50%", background:"rgba(0,0,0,0.05)", display:"flex", alignItems:"center", justifyContent:"center", fontSize:24, flexShrink:0 }}>👤</div>}
                      <div style={{ flex:1 }}>
                        <div style={{ display:"flex", gap:8, alignItems:"center", marginBottom:4 }}>
                          <span style={{ fontSize:15, fontWeight:800, color:"#1C3A2B" }}>{tm.nama}</span>
                          <span style={{ fontSize:9, fontWeight:800, padding:"2px 8px", borderRadius:6, textTransform:"uppercase", background: tm.tipe === "tokoh" ? "rgba(184,148,63,.1)" : "rgba(45,90,160,.1)", color: tm.tipe === "tokoh" ? "#7A5A1E" : "#1A3A6B" }}>
                            {tm.tipe}
                          </span>
                        </div>
                        <div style={{ fontSize:11, fontWeight:800, color:"#9A8C85", textTransform:"uppercase", letterSpacing:".04em", marginBottom:8 }}>{tm.jabatan}</div>
                        <div style={{ fontSize:13, color:"#5A4A40", fontStyle:"italic", lineHeight:1.6, opacity: 0.8 }}>&quot;{tm.pesan}&quot;</div>
                      </div>
                      <button onClick={() => deleteTestimoni(tm.id, tm.foto)} style={{ padding: "8px", borderRadius: 8, background: "rgba(139,32,32,0.05)", border: "none", color: "#8B2020", cursor: "pointer" }}>🗑️</button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

        {/* ═══════════════ TAB: IKLAN ═══════════════ */}
        {activeTab === "iklan" && (
          <div style={{ display:"grid", gridTemplateColumns:"repeat(auto-fit, minmax(350px, 1fr))", gap:32, alignItems:"start" }}>
            {/* Form tambah */}
            <div className="card-heroic">
              <div className="badge-heroic" style={{marginBottom:24}}>➕ TAMBAH IKLAN / PROMO</div>
              <div className="form-heroic">
                <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:10 }}>
                  <button onClick={() => setIkForm({...ikForm, tipe:"foto"})} style={{ padding:"12px", fontSize:11, fontWeight:800, borderRadius:10, border:"2px solid", cursor:"pointer", transition: "all 0.3s", background: ikForm.tipe === "foto" ? "#1C3A2B" : "rgba(0,0,0,0.03)", color: ikForm.tipe === "foto" ? "#fff" : "#9A8C85", borderColor: ikForm.tipe === "foto" ? "#1C3A2B" : "transparent" }}>🖼️ FOTO PROMO</button>
                  <button onClick={() => setIkForm({...ikForm, tipe:"video"})} style={{ padding:"12px", fontSize:11, fontWeight:800, borderRadius:10, border:"2px solid", cursor:"pointer", transition: "all 0.3s", background: ikForm.tipe === "video" ? "#1A3A6B" : "rgba(0,0,0,0.03)", color: ikForm.tipe === "video" ? "#fff" : "#9A8C85", borderColor: ikForm.tipe === "video" ? "#1A3A6B" : "transparent" }}>🎥 VIDEO PROMO</button>
                </div>
                <div className="form-group-heroic">
                  <label className="form-label-heroic">JUDUL IKLAN *</label>
                  <input className="form-input-heroic" value={ikForm.judul} onChange={e => setIkForm({...ikForm, judul:e.target.value})} placeholder="Cth: Promo Ramadhan" />
                </div>
                <div className="form-group-heroic">
                  <label className="form-label-heroic">DESKRIPSI *</label>
                  <textarea className="form-input-heroic" rows={3} value={ikForm.deskripsi} onChange={e => setIkForm({...ikForm, deskripsi:e.target.value})} placeholder="Diskon besar-besaran..." style={{ resize:"vertical" }} />
                </div>
                <div className="form-group-heroic">
                  <label className="form-label-heroic">LINK TUJUAN (OPSIONAL)</label>
                  <input className="form-input-heroic" value={ikForm.linkTujuan} onChange={e => setIkForm({...ikForm, linkTujuan:e.target.value})} placeholder="https://..." />
                </div>
                <div className="gradient-border-heroic" style={{ padding: 20 }}>
                  <label className="form-label-heroic" style={{ marginBottom: 12, display: "block" }}>📸 UPLOAD {ikForm.tipe.toUpperCase()} *</label>
                  <input type="file" accept={ikForm.tipe === "video" ? "video/*" : "image/*"} onChange={e => setIkFile(e.target.files?.[0] || null)} style={{ fontSize:12, width:"100%" }} />
                  {ikFile && <p style={{ fontSize:10, color:"#2F8F4E", marginTop:8, fontWeight:800 }}>✓ {ikFile.name}</p>}
                </div>
                <button className="btn-heroic" onClick={addIklan} disabled={loading} style={{ marginTop: 8 }}>
                  <span>{loading ? "MENYIMPAN..." : "SIMPAN IKLAN"}</span>
                </button>
              </div>
            </div>

            {/* List */}
            <div className="card-heroic" style={{ padding: 0, overflow: "hidden" }}>
              <div style={{ padding:"24px 32px", borderBottom:"1px solid rgba(47,143,78,0.1)" }}>
                <div className="badge-heroic">🎥 DAFTAR IKLAN PROMO ({iklanList.length})</div>
              </div>
              {iklanList.length === 0 ? (
                <div style={{ padding:"60px", textAlign:"center", color:"#9A8C85", fontWeight: 600 }}>Belum ada promo aktif.</div>
              ) : (
                <div style={{ maxHeight:600, overflowY:"auto" }}>
                  {iklanList.map((ik) => (
                    <div key={ik.id} style={{ padding:"20px 32px", borderBottom:"1px solid rgba(0,0,0,0.05)", display:"flex", gap:20, alignItems:"flex-start", transition: "all 0.3s" }} className="row-hover-heroic">
                      {ik.tipe === "video" ? (
                        <div style={{ width:80, height:56, background:"#000", borderRadius:10, display:"flex", alignItems:"center", justifyContent:"center", color:"#fff", fontSize:20, flexShrink:0, boxShadow: "0 4px 12px rgba(0,0,0,0.1)" }}>🎥</div>
                      ) : (
                        <img src={ik.mediaUrl} alt="" style={{ width:80, height:56, borderRadius:10, objectFit:"cover", flexShrink:0, border:"2px solid rgba(0,0,0,0.05)", boxShadow: "0 4px 12px rgba(0,0,0,0.1)" }} />
                      )}
                      <div style={{ flex:1 }}>
                        <div style={{ display:"flex", gap:8, alignItems:"center", marginBottom:4 }}>
                          <span style={{ fontSize:15, fontWeight:800, color:"#1C3A2B" }}>{ik.judul}</span>
                          <span style={{ fontSize:9, fontWeight:800, padding:"2px 8px", borderRadius:6, textTransform:"uppercase", background: ik.tipe === "video" ? "rgba(45,90,160,.1)" : "rgba(184,148,63,.1)", color: ik.tipe === "video" ? "#1A3A6B" : "#7A5A1E" }}>
                            {ik.tipe}
                          </span>
                        </div>
                        <div style={{ fontSize:13, color:"#5A4A40", lineHeight:1.4, opacity: 0.8 }}>{ik.deskripsi}</div>
                        {ik.linkTujuan && <div style={{ fontSize:11, color:"#2F8F4E", marginTop:6, fontWeight: 700 }}>🔗 {ik.linkTujuan.substring(0, 30)}...</div>}
                      </div>
                      <button onClick={() => deleteIklan(ik.id, ik.mediaUrl)} style={{ padding: "8px", borderRadius: 8, background: "rgba(139,32,32,0.05)", border: "none", color: "#8B2020", cursor: "pointer" }}>🗑️</button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

        {/* ═══════════════ TAB: PENGURUS ═══════════════ */}
        {activeTab === "pengurus" && (
          <div style={{ display:"grid", gridTemplateColumns:"repeat(auto-fit, minmax(350px, 1fr))", gap:32, alignItems:"start" }}>
            {/* Form tambah */}
            <div className="card-heroic">
              <div className="badge-heroic" style={{marginBottom:24}}>➕ TAMBAH PENGURUS DESA</div>
              <div className="form-heroic">
                <div className="form-group-heroic">
                  <label className="form-label-heroic">KATEGORI *</label>
                  <select className="form-input-heroic" value={pgForm.kategori} onChange={e => setPgForm({...pgForm, kategori:e.target.value as any})}>
                    <option value="pelindung">Dewan Pelindung & Penasihat</option>
                    <option value="pengawas">Dewan Pengawas DKM</option>
                    <option value="eksekutif">Tim Eksekutif Lapangan</option>
                    <option value="divisi">5 Divisi Operasional (Garda Depan)</option>
                  </select>
                </div>
                <div className="form-group-heroic">
                  <label className="form-label-heroic">NAMA LENGKAP *</label>
                  <input className="form-input-heroic" value={pgForm.nama} onChange={e => setPgForm({...pgForm, nama:e.target.value})} placeholder="Cth: Bpk. Enang" />
                </div>
                <div className="form-group-heroic">
                  <label className="form-label-heroic">JABATAN / PERAN *</label>
                  <input className="form-input-heroic" value={pgForm.jabatan} onChange={e => setPgForm({...pgForm, jabatan:e.target.value})} placeholder="Cth: Ketua RW 02" />
                </div>
                <div className="form-group-heroic">
                  <label className="form-label-heroic">URUTAN TAMPIL (ANGKA)</label>
                  <input type="number" className="form-input-heroic" value={pgForm.urutan} onChange={e => setPgForm({...pgForm, urutan:e.target.value})} placeholder="1" />
                </div>
                <div className="gradient-border-heroic" style={{ padding: 20 }}>
                  <label className="form-label-heroic" style={{ marginBottom: 12, display: "block" }}>📸 FOTO PROFIL (OPSIONAL)</label>
                  <input type="file" accept="image/*" onChange={e => setPgFile(e.target.files?.[0] || null)} style={{ fontSize:12, width:"100%" }} />
                  {pgFile && <p style={{ fontSize:10, color:"#2F8F4E", marginTop:8, fontWeight:800 }}>✓ {pgFile.name}</p>}
                </div>
                <button className="btn-heroic" onClick={addPengurus} disabled={loading} style={{ marginTop: 8 }}>
                  <span>{loading ? "MENYIMPAN..." : "SIMPAN PENGURUS"}</span>
                </button>
              </div>
            </div>

            {/* List */}
            <div className="card-heroic" style={{ padding: 0, overflow: "hidden" }}>
              <div style={{ padding:"24px 32px", borderBottom:"1px solid rgba(47,143,78,0.1)" }}>
                <div className="badge-heroic">👥 DAFTAR PENGURUS AKTUAL ({pengurusList.length})</div>
              </div>
              {pengurusList.length === 0 ? (
                <div style={{ padding:"60px", textAlign:"center", color:"#9A8C85", fontWeight: 600 }}>Belum ada pengurus terdaftar.</div>
              ) : (
                <div style={{ maxHeight:600, overflowY:"auto" }}>
                  {pengurusList.map((pg) => {
                    const bgKat = pg.kategori === 'pelindung' ? 'rgba(184,148,63,0.1)' : pg.kategori === 'pengawas' ? 'rgba(47,143,78,0.1)' : pg.kategori === 'eksekutif' ? 'rgba(139,32,32,0.1)' : 'rgba(26,58,107,0.1)';
                    const colKat = pg.kategori === 'pelindung' ? '#9C7A14' : pg.kategori === 'pengawas' ? '#2F8F4E' : pg.kategori === 'eksekutif' ? '#8B2020' : '#1A3A6B';
                    return (
                      <div key={pg.id} style={{ padding:"20px 32px", borderBottom:"1px solid rgba(0,0,0,0.05)", display:"flex", gap:20, alignItems:"center", transition: "all 0.3s" }} className="row-hover-heroic">
                        <div style={{ width:64, height:64, borderRadius:"50%", background:"rgba(0,0,0,0.05)", border:"3px solid rgba(47,143,78,0.2)", display:"flex", alignItems:"center", justifyContent:"center", fontSize:28, flexShrink:0, overflow:"hidden", boxShadow: "0 4px 12px rgba(0,0,0,0.1)" }}>
                          {pg.foto ? <img src={pg.foto} style={{width:"100%",height:"100%",objectFit:"cover"}} alt=""/> : "👤"}
                        </div>
                        <div style={{ flex:1 }}>
                          <div style={{ display:"flex", gap:8, alignItems:"center", marginBottom:4 }}>
                            <span style={{ fontSize:16, fontWeight:800, color:"#1C3A2B" }}>{pg.nama}</span>
                            <span style={{ fontSize:9, fontWeight:800, padding:"3px 10px", borderRadius:99, textTransform:"uppercase", background:bgKat, color:colKat }}>
                              {pg.kategori}
                            </span>
                          </div>
                          <div style={{ fontSize:12, fontWeight:800, color:"#9A8C85", letterSpacing: ".02em" }}>{pg.jabatan}</div>
                          <div style={{ fontSize:10, color:"#A89A90", fontWeight: 700, marginTop: 4 }}>PRIORITAS TAMPIL: #{pg.urutan}</div>
                        </div>
                        <button onClick={() => deletePengurus(pg.id, pg.foto)} style={{ padding: "8px", borderRadius: 8, background: "rgba(139,32,32,0.05)", border: "none", color: "#8B2020", cursor: "pointer" }}>🗑️</button>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        )}
      </main>
      <style>{`@keyframes pulse-soft-heroic{0%,100%{opacity:1;transform:scale(1)}50%{opacity:0.4;transform:scale(0.95)}}`}</style>
    </div>
  );
}