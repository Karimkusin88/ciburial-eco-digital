"use client";
// app/admin/page.tsx
// Akses di: https://your-site.vercel.app/admin
// PIN admin disimpan di environment variable ADMIN_PIN
import { useState, useEffect, useCallback } from "react";
import { supabase, isSupabaseReady } from "@/lib/supabase";
import "./admin-styles.css";

// PIN diverifikasi server-side via /api/admin/verify

interface Kegiatan { id: string; judul: string; tanggal: string; kategori: string; deskripsi: string; foto?: string; }
interface Produk    { id: string; nama: string; deskripsi: string; harga: number; tag: string; icon: string; foto?: string; }
interface Transaksi { id: string; tanggal: string; keterangan: string; kategori: string; tipe: "masuk" | "keluar"; jumlah: number; }
interface Testimoni { id: string; nama: string; jabatan: string; pesan: string; foto?: string; tipe: "tokoh" | "berita"; }
interface Iklan { id: string; judul: string; deskripsi: string; mediaUrl: string; tipe: "video" | "foto"; linkTujuan?: string; }

type AdminTab = "dashboard" | "kegiatan" | "produk" | "transaksi" | "testimoni" | "iklan";

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
  "Balai Serba Guna & Ruang Publik",
  "Smart Farming & Peternakan Modern",
  "Learning Hub",
  "Smart PJU & Keamanan",
  "Jaringan Internet (RT/RW Net)",
  "Operasional Digital & Eco-Waste",
  "DKM / Masjid",
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

  /* ─── form state ─── */
  const emptyK = { judul:"", tanggal: new Date().toISOString().split("T")[0], kategori:"keagamaan", deskripsi:"", foto:"" };
  const emptyP = { nama:"", deskripsi:"", harga:"", tag:"", icon:"🎋", foto:"" };
  const emptyT: { tanggal:string; keterangan:string; kategori:string; tipe:"masuk"|"keluar"; jumlah:string } = { tanggal: new Date().toISOString().split("T")[0], keterangan:"", kategori:"Donasi Warga", tipe:"masuk", jumlah:"" };
  const emptyTm: { nama:string; jabatan:string; pesan:string; tipe:"tokoh"|"berita"; foto:string } = { nama:"", jabatan:"", pesan:"", tipe:"tokoh", foto:"" };
  const emptyIk: { judul:string; deskripsi:string; tipe:"video"|"foto"; mediaUrl:string; linkTujuan:string } = { judul:"", deskripsi:"", tipe:"video", mediaUrl:"", linkTujuan:"" };

  const [kForm, setKForm] = useState(emptyK);
  const [kFile, setKFile] = useState<File | null>(null);
  const [pForm, setPForm] = useState(emptyP);
  const [pFile, setPFile] = useState<File | null>(null);
  const [pFiles, setPFiles] = useState<(File | null)[]>([null, null, null, null, null]); // 5 photo slots
  const [tForm, setTForm] = useState(emptyT);
  const [tmForm, setTmForm] = useState(emptyTm);
  const [tmFile, setTmFile] = useState<File | null>(null);
  const [ikForm, setIkForm] = useState(emptyIk);
  const [ikFile, setIkFile] = useState<File | null>(null);
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
    try { 
      tm = await supabase.from("testimoni").select("*").order("created_at", { ascending: false }); 
      ik = await supabase.from("iklan").select("*").order("created_at", { ascending: false }); 
    } catch (e) {}

    if (k.data) setKegiatanList(k.data as Kegiatan[]);
    if (p.data) setProdukList(p.data as Produk[]);
    if (t.data) setTransaksiList(t.data as Transaksi[]);
    if (tm.data) setTestimoniList(tm.data as Testimoni[]);
    if (ik.data) setIklanList(ik.data as Iklan[]);

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
    let finalUrl = kForm.foto;
    try {
      if (kFile) finalUrl = await uploadToSupabase(kFile);
      const { error } = await supabase.from("kegiatan").insert({ ...kForm, foto: finalUrl || null });
      if (error) throw error;
      setKForm(emptyK); setKFile(null); fetchAll(); showToast("✅ Kegiatan berhasil ditambahkan!");
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

  /* ─── Ringkasan keuangan ─── */
  const totalMasuk  = transaksiList.filter(t => t.tipe === "masuk").reduce((s, t) => s + t.jumlah, 0);
  const totalKeluar = transaksiList.filter(t => t.tipe === "keluar").reduce((s, t) => s + t.jumlah, 0);
  const saldo       = totalMasuk - totalKeluar;

  /* ══════ PASSWORD GATE ══════ */
  if (!auth) return (
    <div className="admin-page">
      <div style={{ minHeight:"100vh", background:"#FAF8F3", display:"flex", alignItems:"center", justifyContent:"center", padding:"24px" }}>
        <div style={{ width:"100%", maxWidth:400, background:"#FFFEF9", border:"1px solid #E5E0D8", borderRadius:28, padding:"48px 40px", textAlign:"center" }}>
          <div style={{ width:64, height:64, borderRadius:"50%", background:"#1C3A2B", display:"flex", alignItems:"center", justifyContent:"center", margin:"0 auto 20px", fontSize:28 }}>🌿</div>
          <h1 className="fnt" style={{ fontSize:30, fontWeight:300, color:"#1C3A2B", letterSpacing:"-.02em", marginBottom:6 }}>Admin Panel</h1>
          <p style={{ fontSize:12, color:"#9A8C85", marginBottom:32, fontWeight:600, letterSpacing:".05em" }}>Ciburial Eco-Digital Village</p>
          <input
            type="tel" inputMode="numeric" placeholder="Masukkan PIN admin (6 digit)"
            className="field-login" value={pwInput}
            maxLength={6}
            onChange={e => { setPwInput(e.target.value.replace(/\D/g, '')); setPwErr(false); }}
            onKeyDown={e => e.key === "Enter" && handleLogin()}
            style={{ marginBottom: pwErr ? 8 : 20, borderColor: pwErr ? "#8B2020" : undefined, textAlign:"center", fontSize:24, letterSpacing:".3em", fontWeight:700 }}
          />
          {pwErr && <p style={{ fontSize:12, color:"#8B2020", fontWeight:700, marginBottom:16 }}>PIN salah. Coba lagi.</p>}
          <button onClick={handleLogin} disabled={loading} style={{ width:"100%", padding:"14px", borderRadius:14, background:"#1C3A2B", color:"#fff", fontSize:12, fontWeight:700, letterSpacing:".1em", textTransform:"uppercase", border:"none", cursor: loading ? "not-allowed" : "pointer", opacity: loading ? 0.7 : 1 }}>
            {loading ? "Memverifikasi..." : "Masuk →"}
          </button>
          <p style={{ fontSize:11, color:"#C8C0B8", marginTop:20 }}>Hanya untuk pengelola resmi Ciburial</p>
        </div>
      </div>
    </div>
  );

  /* ══════ ADMIN DASHBOARD ══════ */
  return (
    <>
      <div className="admin-page" style={{background:"#F0EDE5",minHeight:"100vh"}}>
        {toast && <div className="admin-toast">{toast}</div>}

      {/* ── HEADER ── */}
      <header style={{ background:"#1C3A2B", padding:"0 28px", height:60, display:"flex", alignItems:"center", justifyContent:"space-between", position:"sticky", top:0, zIndex:40 }}>
        <div style={{ display:"flex", alignItems:"center", gap:12 }}>
          <span style={{ fontSize:20 }}>🌿</span>
          <div>
            <span className="fnt" style={{ fontSize:18, fontWeight:300, color:"#FAF8F3", letterSpacing:"-.02em" }}>Ciburial</span>
            <span style={{ fontSize:10, fontWeight:700, color:"#B8943F", letterSpacing:".15em", textTransform:"uppercase", marginLeft:8 }}>Admin Panel</span>
          </div>
        </div>
        <div style={{ display:"flex", alignItems:"center", gap:12 }}>
          {!isSupabaseReady() && (
            <span style={{ fontSize:11, fontWeight:700, color:"#D4AC5A", background:"rgba(184,148,63,.15)", padding:"4px 12px", borderRadius:99, letterSpacing:".06em" }}>⚠️ Supabase belum dikonfigurasi</span>
          )}
          <a href="/" target="_blank" style={{ fontSize:11, fontWeight:700, letterSpacing:".08em", textTransform:"uppercase", color:"rgba(250,248,243,.5)", textDecoration:"none" }}>Lihat Website →</a>
          <button onClick={() => setAuth(false)} style={{ padding:"7px 16px", borderRadius:99, background:"rgba(255,255,255,.08)", border:"1px solid rgba(255,255,255,.12)", color:"rgba(250,248,243,.6)", fontSize:11, fontWeight:700, cursor:"pointer" }}>Keluar</button>
        </div>
      </header>

      <main style={{ maxWidth:1100, margin:"0 auto", padding:"28px 24px 80px" }}>

        {/* ── Supabase warning ── */}
        {!isSupabaseReady() && (
          <div style={{ padding:"20px 24px", background:"rgba(184,148,63,.1)", border:"1px solid rgba(184,148,63,.3)", borderRadius:16, marginBottom:24, display:"flex", gap:16, alignItems:"flex-start" }}>
            <span style={{ fontSize:22, marginTop:2 }}>⚠️</span>
            <div>
              <div style={{ fontSize:14, fontWeight:700, color:"#7A5A1E", marginBottom:4 }}>Supabase belum dikonfigurasi</div>
              <div style={{ fontSize:13, lineHeight:1.7, color:"#9A7A3A" }}>
                Data tidak akan tersimpan. Tambahkan <code style={{ background:"rgba(0,0,0,.06)", padding:"1px 6px", borderRadius:4 }}>NEXT_PUBLIC_SUPABASE_URL</code> dan <code style={{ background:"rgba(0,0,0,.06)", padding:"1px 6px", borderRadius:4 }}>NEXT_PUBLIC_SUPABASE_ANON_KEY</code> ke file <code style={{ background:"rgba(0,0,0,.06)", padding:"1px 6px", borderRadius:4 }}>.env.local</code> kamu, lalu restart server. Lihat panduan setup di <code style={{ background:"rgba(0,0,0,.06)", padding:"1px 6px", borderRadius:4 }}>lib/supabase.ts</code>.
              </div>
            </div>
          </div>
        )}

        {/* ── SUMMARY CARDS ── */}
        <div style={{ display:"grid", gridTemplateColumns:"repeat(auto-fit, minmax(180px, 1fr))", gap:14, marginBottom:28 }}>
          {[
            { label:"Total Kegiatan", value: kegiatanList.length + " Acara",    icon:"📅", c:"#1C3A2B" },
            { label:"Total Produk",   value: produkList.length + " Item",        icon:"🛒", c:"#3D2B1F" },
            { label:"Total Masuk",    value: formatRp(totalMasuk),              icon:"↑",  c:"#1C6B3A" },
            { label:"Total Keluar",   value: formatRp(totalKeluar),             icon:"↓",  c:"#8B2020" },
            { label:"Saldo Dana",     value: formatRp(saldo),                   icon:"◎",  c:"#1C3A2B" },
          ].map((card, i) => (
            <div key={i} style={{ padding:"20px 22px", background:"#FFFEF9", border:"1px solid #E5E0D8", borderRadius:16 }}>
              <div style={{ fontSize:11, fontWeight:700, letterSpacing:".1em", textTransform:"uppercase", color:"#9A8C85", marginBottom:8 }}>{card.label}</div>
              <div style={{ display:"flex", alignItems:"center", gap:8 }}>
                <span style={{ fontSize:18 }}>{card.icon}</span>
                <span className="fnt" style={{ fontSize:20, fontWeight:600, color:card.c }}>{card.value}</span>
              </div>
            </div>
          ))}
        </div>

        {/* ── TAB NAV ── */}
        <div style={{ display:"flex", gap:4, marginBottom:20, background:"#FFFEF9", padding:4, borderRadius:14, border:"1px solid #E5E0D8", width:"fit-content", flexWrap:"wrap" }}>
          {([["dashboard","📊 Dashboard"],["kegiatan","📅 Kegiatan"],["produk","🛒 Produk"],["transaksi","💰 Transaksi"],["testimoni","💬 Tokoh & Berita"],["iklan","🎥 Iklan Promo"]] as const).map(([key, label]) => (
            <button key={key} onClick={() => setActiveTab(key)} style={{
              padding:"9px 20px", borderRadius:10, fontSize:12, fontWeight:700, letterSpacing:".06em",
              border:"none", cursor:"pointer", transition:"all .2s",
              background: activeTab === key ? "#1C3A2B" : "transparent",
              color: activeTab === key ? "#fff" : "#9A8C85",
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
                <circle cx={cx} cy={cy} r={R} fill="none" stroke="#1a3a6b" strokeWidth={sw} strokeDasharray={`${lakiDash} ${circ-lakiDash}`} strokeDashoffset={circ*0.25} transform={`rotate(0 ${cx} ${cy})`}/>
                <circle cx={cx} cy={cy} r={R} fill="none" stroke="#b8943f" strokeWidth={sw} strokeDasharray={`${perDash} ${circ-perDash}`} strokeDashoffset={circ*0.25-lakiDash} transform={`rotate(0 ${cx} ${cy})`}/>
                <text x={cx} y={cy-4} textAnchor="middle" fontSize={14} fontWeight="800" fill="#1C3A2B">{total}</text>
                <text x={cx} y={cy+12} textAnchor="middle" fontSize={8} fill="#9A8C85">jiwa</text>
              </svg>
            );
          }
          // Radial progress
          function RadialBar({pct}:{pct:number}) {
            const R=36,circ=2*Math.PI*R,dash=circ*(pct/100);
            return (
              <svg width={90} height={90}>
                <circle cx={45} cy={45} r={R} fill="none" stroke="rgba(28,58,43,.1)" strokeWidth={10}/>
                <circle cx={45} cy={45} r={R} fill="none" stroke="#1C3A2B" strokeWidth={10} strokeDasharray={`${dash} ${circ-dash}`} strokeDashoffset={circ*0.25} strokeLinecap="round"/>
                <text x={45} y={41} textAnchor="middle" fontSize={14} fontWeight="800" fill="#1C3A2B">{pct}%</text>
                <text x={45} y={55} textAnchor="middle" fontSize={8} fill="#9A8C85">imunisasi</text>
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
              <svg width={W} height={H}>
                <defs><linearGradient id="dg" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor="#1C3A2B" stopOpacity="0.15"/><stop offset="100%" stopColor="#1C3A2B" stopOpacity="0"/></linearGradient></defs>
                <path d={area} fill="url(#dg)"/>
                <path d={path} fill="none" stroke="#1C3A2B" strokeWidth={2} strokeLinecap="round"/>
                {pts.map((p,i)=>(
                  <g key={i}>
                    <circle cx={p.x} cy={p.y} r={3} fill="#1C3A2B" stroke="white" strokeWidth={1.5}/>
                    <text x={p.x} y={H-4} fontSize={7} textAnchor="middle" fill="#9A8C85">{p.b}</text>
                    <text x={p.x} y={p.y-6} fontSize={7} textAnchor="middle" fill="#1C3A2B" fontWeight="700">{p.kg.toFixed(0)}</text>
                  </g>
                ))}
              </svg>
            );
          }
          // Bar chart poin per RT
          function BarChart() {
            const rts = ["01","02","03"];
            // dummy sampai data real tersedia
            const vals = rts.map(rt => ({rt, poin: Math.floor(Math.random()*500)+100}));
            const maxV = Math.max(...vals.map(v=>v.poin))||1;
            return (
              <div style={{display:"flex",gap:12,alignItems:"flex-end",height:80,padding:"0 8px"}}>
                {vals.map(v=>(
                  <div key={v.rt} style={{flex:1,display:"flex",flexDirection:"column",alignItems:"center",gap:4}}>
                    <span style={{fontSize:10,fontWeight:700,color:"#1C3A2B"}}>{v.poin}</span>
                    <div style={{width:"100%",background:"#1C3A2B",borderRadius:"4px 4px 0 0",height:`${(v.poin/maxV)*60}px`,opacity:0.8}}/>
                    <span style={{fontSize:10,color:"#9A8C85"}}>RT {v.rt}</span>
                  </div>
                ))}
              </div>
            );
          }
          // Line chart kas
          function LineChart() {
            const txByMonth:Record<string,{masuk:number;keluar:number}> = {};
            transaksiList.forEach(t => {
              const b = new Date(t.tanggal).toLocaleDateString("id-ID",{month:"short"});
              if (!txByMonth[b]) txByMonth[b]={masuk:0,keluar:0};
              txByMonth[b][t.tipe] += t.jumlah;
            });
            const data = Object.entries(txByMonth).slice(-6).map(([b,v])=>({b,...v}));
            if (data.length < 2) return <div style={{textAlign:"center",padding:20,color:"#9A8C85",fontSize:11}}>Butuh min 2 bulan data</div>;
            const W=260,H=90,P=20;
            const maxV=Math.max(...data.flatMap(d=>[d.masuk,d.keluar]))*1.1||1;
            const xStep=(W-P*2)/(data.length-1);
            const yFn=(v:number)=>H-P-((v/maxV)*(H-P*2));
            const mkPath=(key:"masuk"|"keluar")=>data.map((d,i)=>`${i===0?"M":"L"}${P+i*xStep},${yFn(d[key])}`).join(" ");
            return (
              <svg width={W} height={H}>
                <path d={mkPath("masuk")} fill="none" stroke="#1C6B3A" strokeWidth={2} strokeLinecap="round"/>
                <path d={mkPath("keluar")} fill="none" stroke="#8B2020" strokeWidth={2} strokeLinecap="round" strokeDasharray="4 2"/>
                {data.map((d,i)=>(
                  <text key={i} x={P+i*xStep} y={H-4} fontSize={7} textAnchor="middle" fill="#9A8C85">{d.b}</text>
                ))}
                <circle cx={W-40} cy={8} r={4} fill="#1C6B3A"/>
                <text x={W-33} y={12} fontSize={8} fill="#1C6B3A">Masuk</text>
                <circle cx={W-40} cy={22} r={4} fill="#8B2020"/>
                <text x={W-33} y={26} fontSize={8} fill="#8B2020">Keluar</text>
              </svg>
            );
          }
          const ICON:Record<string,string>={posyandu:"👶",ronda:"🔦",bank_sampah:"♻️",tukar:"🎁",kerja_bakti:"🌿",masjid:"🕌",learning_hub:"📚",lapor_fasilitas:"🔧"};
          return (
            <div>
              {/* Banner ultah hari ini */}
              {ultahHari.length>0 && (
                <div style={{background:"linear-gradient(135deg,#B8943F,#D4AC5A)",borderRadius:16,padding:"14px 20px",marginBottom:20,color:"white",display:"flex",alignItems:"center",gap:12}}>
                  <span style={{fontSize:28}}>🎂</span>
                  <div>
                    <div style={{fontWeight:800,fontSize:14}}>🎉 Selamat Ulang Tahun!</div>
                    <div style={{fontSize:13,opacity:0.9}}>{ultahHari.map((a:any)=>{
                      const umur=new Date().getFullYear()-new Date(a.tgl_lahir).getFullYear();
                      return `${a.nama} (${umur} tahun)`;
                    }).join(" · ")}</div>
                  </div>
                </div>
              )}

              {/* Stats row */}
              <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fit,minmax(150px,1fr))",gap:12,marginBottom:20}}>
                {[
                  {i:"🏠",v:dashData.totalKK||0,l:"Total KK",c:"#1C3A2B"},
                  {i:"👥",v:dashData.totalJiwa||0,l:"Total Jiwa",c:"#1A3A6B"},
                  {i:"♻️",v:`${(dashData.totKg||0).toFixed(0)}kg`,l:"Sampah Terkelola",c:"#4A7C59"},
                  {i:"🪙",v:(dashData.totPoin||0).toLocaleString(),l:"Total Poin",c:"#B8943F"},
                  {i:"👶",v:dashData.anakPosyandu||0,l:"Anak Posyandu",c:"#8B2020"},
                  {i:"🕌",v:`${dashData.muzakki||0}/${dashData.mustahiq||0}`,l:"Muzakki/Mustahiq",c:"#1C3A2B"},
                ].map(s=>(
                  <div key={s.l} style={{background:"#FFFEF9",border:"1px solid #E5E0D8",borderRadius:14,padding:"16px",borderLeft:`4px solid ${s.c}`}}>
                    <div style={{fontSize:18,marginBottom:6}}>{s.i}</div>
                    <div style={{fontSize:20,fontWeight:900,color:s.c}}>{s.v}</div>
                    <div style={{fontSize:10,color:"#9A8C85",textTransform:"uppercase",letterSpacing:"0.08em"}}>{s.l}</div>
                  </div>
                ))}
              </div>

              {/* Charts row */}
              <div style={{display:"grid",gridTemplateColumns:"1fr 1fr 1fr",gap:16,marginBottom:16}}>
                {/* Donut demografi */}
                <div style={{background:"#FFFEF9",border:"1px solid #E5E0D8",borderRadius:16,padding:18}}>
                  <div style={{fontSize:11,fontWeight:700,color:"#9A8C85",textTransform:"uppercase",letterSpacing:"0.08em",marginBottom:10}}>📊 Demografi Warga</div>
                  <div style={{display:"flex",justifyContent:"center"}}><DonutChart laki={dashData.laki||0} perempuan={dashData.perempuan||0}/></div>
                  <div style={{display:"flex",gap:12,justifyContent:"center",marginTop:6}}>
                    <span style={{fontSize:11,color:"#1A3A6B"}}>👨 L: {dashData.laki||0}</span>
                    <span style={{fontSize:11,color:"#B8943F"}}>👩 P: {dashData.perempuan||0}</span>
                  </div>
                </div>

                {/* Radial imunisasi */}
                <div style={{background:"#FFFEF9",border:"1px solid #E5E0D8",borderRadius:16,padding:18,textAlign:"center"}}>
                  <div style={{fontSize:11,fontWeight:700,color:"#9A8C85",textTransform:"uppercase",letterSpacing:"0.08em",marginBottom:10}}>💉 Capaian Posyandu</div>
                  <div style={{display:"flex",justifyContent:"center"}}><RadialBar pct={imunPct}/></div>
                  <div style={{fontSize:11,color:"#9A8C85",marginTop:4}}>{dashData.imunSudah||0}/{dashData.imunTotal||0} jadwal selesai</div>
                </div>

                {/* Area chart sampah */}
                <div style={{background:"#FFFEF9",border:"1px solid #E5E0D8",borderRadius:16,padding:18}}>
                  <div style={{fontSize:11,fontWeight:700,color:"#9A8C85",textTransform:"uppercase",letterSpacing:"0.08em",marginBottom:10}}>♻️ Tren Bank Sampah (kg)</div>
                  <AreaChart/>
                </div>
              </div>

              {/* Charts row 2 */}
              <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:16,marginBottom:16}}>
                {/* Bar chart poin per RT */}
                <div style={{background:"#FFFEF9",border:"1px solid #E5E0D8",borderRadius:16,padding:18}}>
                  <div style={{fontSize:11,fontWeight:700,color:"#9A8C85",textTransform:"uppercase",letterSpacing:"0.08em",marginBottom:10}}>🏆 Poin per RT</div>
                  <BarChart/>
                </div>

                {/* Line chart kas */}
                <div style={{background:"#FFFEF9",border:"1px solid #E5E0D8",borderRadius:16,padding:18}}>
                  <div style={{fontSize:11,fontWeight:700,color:"#9A8C85",textTransform:"uppercase",letterSpacing:"0.08em",marginBottom:10}}>💰 Pertumbuhan Kas</div>
                  <LineChart/>
                </div>
              </div>

              {/* Running text + ultah minggu */}
              <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:16}}>
                {/* Aktivitas realtime */}
                <div style={{background:"#FFFEF9",border:"1px solid #E5E0D8",borderRadius:16,padding:18}}>
                  <div style={{display:"flex",alignItems:"center",gap:6,marginBottom:12}}>
                    <span style={{width:7,height:7,borderRadius:"50%",background:"#1C6B3A",display:"inline-block",animation:"pulse 1.5s infinite"}}/>
                    <span style={{fontSize:11,fontWeight:700,color:"#9A8C85",textTransform:"uppercase",letterSpacing:"0.08em"}}>Aktivitas Realtime</span>
                  </div>
                  {aktivitas.length===0?(
                    <div style={{textAlign:"center",padding:20,color:"#9A8C85",fontSize:12}}>Belum ada aktivitas</div>
                  ):aktivitas.map((a:any,i:number)=>{
                    const usia=Math.round((new Date().getTime()-new Date(a.created_at).getTime())/(1000*60));
                    const lbl=usia<60?`${usia}m lalu`:usia<1440?`${Math.round(usia/60)}j lalu`:`${Math.round(usia/1440)}h lalu`;
                    return(
                      <div key={a.id} style={{display:"flex",gap:8,padding:"7px 0",borderBottom:i<aktivitas.length-1?"1px solid #F0EDE5":"none",alignItems:"flex-start"}}>
                        <span style={{fontSize:14,flexShrink:0}}>{ICON[a.sumber]||"📌"}</span>
                        <div style={{flex:1}}>
                          <div style={{fontSize:12,color:"#1A1410",lineHeight:1.4}}>{a.keterangan}</div>
                          <div style={{fontSize:10,color:"#9A8C85"}}>{lbl} · +{a.jumlah} poin</div>
                        </div>
                      </div>
                    );
                  })}
                </div>

                {/* Ultah + quick links */}
                <div>
                  {/* Ultah minggu ini */}
                  {ultahMinggu.length>0 && (
                    <div style={{background:"rgba(184,148,63,0.08)",border:"1px solid rgba(184,148,63,0.2)",borderRadius:14,padding:16,marginBottom:12}}>
                      <div style={{fontSize:11,fontWeight:700,color:"#B8943F",marginBottom:8,textTransform:"uppercase",letterSpacing:"0.06em"}}>📅 Akan Ultah (7 hari)</div>
                      {ultahMinggu.slice(0,4).map((a:any,i:number)=>{
                        const l=new Date(a.tgl_lahir);
                        const next=new Date(new Date().getFullYear(),l.getMonth(),l.getDate());
                        const hari=Math.ceil((next.getTime()-new Date().getTime())/(1000*60*60*24));
                        const umur=new Date().getFullYear()-l.getFullYear();
                        return(
                          <div key={i} style={{display:"flex",justifyContent:"space-between",fontSize:12,color:"#5A4A40",padding:"4px 0",borderBottom:i<ultahMinggu.length-1?"1px solid rgba(184,148,63,0.15)":"none"}}>
                            <span>🎂 {a.nama} <span style={{color:"#9A8C85",fontSize:11}}>(ke-{umur+1})</span></span>
                            <span style={{color:"#B8943F",fontWeight:700}}>{hari===1?"Besok":`${hari} hari`}</span>
                          </div>
                        );
                      })}
                    </div>
                  )}

                  {/* Quick links */}
                  <div style={{background:"#FFFEF9",border:"1px solid #E5E0D8",borderRadius:14,padding:16}}>
                    <div style={{fontSize:11,fontWeight:700,color:"#9A8C85",textTransform:"uppercase",letterSpacing:"0.08em",marginBottom:10}}>⚡ Akses Cepat</div>
                    <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:6}}>
                      {[
                        {href:"/admin/warga",i:"👥",l:"Data Warga"},
                        {href:"/admin/posyandu",i:"👶",l:"Posyandu"},
                        {href:"/admin/bank-sampah",i:"♻️",l:"Bank Sampah"},
                        {href:"/admin/ronda",i:"🔦",l:"Ronda NFC"},
                        {href:"/admin/zakat",i:"🕌",l:"Zakat"},
                        {href:"/admin/dashboard",i:"📊",l:"Full Analytics"},
                      ].map(l=>(
                        <a key={l.href} href={l.href} style={{display:"flex",alignItems:"center",gap:6,padding:"8px 10px",borderRadius:10,background:"rgba(28,58,43,0.04)",border:"1px solid #E5E0D8",textDecoration:"none",color:"#1A1410",fontSize:12,fontWeight:500}}>
                          <span>{l.i}</span><span>{l.l}</span>
                        </a>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          );
        })()}

        {/* ═══════════════ TAB: KEGIATAN ═══════════════ */}
        {activeTab === "kegiatan" && (
          <div style={{ display:"grid", gridTemplateColumns:"1fr 2fr", gap:20, alignItems:"start" }}>

            {/* Form tambah */}
            <div style={{ background:"#FFFEF9", border:"1px solid #E5E0D8", borderRadius:20, padding:"28px" }}>
              <h3 style={{ fontSize:14, fontWeight:700, color:"#1C3A2B", marginBottom:20, paddingBottom:14, borderBottom:"1px solid #E5E0D8" }}>➕ Tambah Kegiatan Baru</h3>
              <div style={{ display:"flex", flexDirection:"column", gap:14 }}>
                <div>
                  <label style={{ display:"block", fontSize:10, fontWeight:700, letterSpacing:".12em", textTransform:"uppercase", color:"#9A8C85", marginBottom:6 }}>Judul Acara *</label>
                  <input className="field" value={kForm.judul} onChange={e => setKForm({...kForm, judul:e.target.value})} placeholder="Cth: Peringatan Maulid Nabi SAW" />
                </div>
                <div>
                  <label style={{ display:"block", fontSize:10, fontWeight:700, letterSpacing:".12em", textTransform:"uppercase", color:"#9A8C85", marginBottom:6 }}>Tanggal *</label>
                  <input type="date" className="field" value={kForm.tanggal} onChange={e => setKForm({...kForm, tanggal:e.target.value})} />
                </div>
                <div>
                  <label style={{ display:"block", fontSize:10, fontWeight:700, letterSpacing:".12em", textTransform:"uppercase", color:"#9A8C85", marginBottom:6 }}>Kategori *</label>
                  <select className="field" value={kForm.kategori} onChange={e => setKForm({...kForm, kategori:e.target.value})}>
                    {KAT_OPTIONS.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
                  </select>
                </div>
                <div>
                  <label style={{ display:"block", fontSize:10, fontWeight:700, letterSpacing:".12em", textTransform:"uppercase", color:"#9A8C85", marginBottom:6 }}>Deskripsi</label>
                  <textarea className="field" rows={3} value={kForm.deskripsi} onChange={e => setKForm({...kForm, deskripsi:e.target.value})} placeholder="Ceritakan sedikit tentang acara ini..." style={{ resize:"vertical" }} />
                </div>
                <div style={{ background:"rgba(28,58,43,.06)", padding:14, borderRadius:12, border:"1px dashed rgba(28,58,43,.2)" }}>
                  <label style={{ display:"block", fontSize:10, fontWeight:700, letterSpacing:".12em", textTransform:"uppercase", color:"#1C3A2B", marginBottom:6 }}>Upload Foto / Video (opsional)</label>
                  <input type="file" accept="image/*,video/mp4,video/webm" onChange={e => setKFile(e.target.files?.[0] || null)} style={{ fontSize:12, width:"100%" }} />
                  {kFile && <p style={{ fontSize:10, color:"#1C6B3A", marginTop:8, fontWeight:700 }}>✓ File terpilih: {kFile.name}</p>}
                  
                  <div style={{ marginTop:14, fontSize:10, color:"#9A8C85", borderTop:"1px solid rgba(28,58,43,.1)", paddingTop:10 }}>ATAU paste link (opsional):</div>
                  <input className="field" value={kForm.foto} onChange={e => setKForm({...kForm, foto:e.target.value})} placeholder="https://..." style={{ marginTop:6, fontSize:11, padding:"8px 12px" }} disabled={!!kFile} />
                </div>
                <button onClick={addKegiatan} disabled={loading} style={{ padding:"13px", borderRadius:12, background:"#1C3A2B", color:"#fff", fontSize:12, fontWeight:700, letterSpacing:".08em", textTransform:"uppercase", border:"none", cursor:"pointer", opacity:loading ? .6 : 1, marginTop:4 }}>
                  {loading ? "Menyimpan..." : "Simpan Kegiatan"}
                </button>
              </div>
            </div>

            {/* List */}
            <div style={{ background:"#FFFEF9", border:"1px solid #E5E0D8", borderRadius:20, overflow:"hidden" }}>
              <div style={{ padding:"20px 24px", borderBottom:"1px solid #E5E0D8", display:"flex", justifyContent:"space-between", alignItems:"center" }}>
                <h3 style={{ fontSize:14, fontWeight:700, color:"#1C3A2B" }}>Daftar Kegiatan ({kegiatanList.length})</h3>
              </div>
              {kegiatanList.length === 0 ? (
                <div style={{ padding:"48px", textAlign:"center", color:"#9A8C85", fontSize:13 }}>Belum ada kegiatan. Tambahkan yang pertama!</div>
              ) : (
                <div style={{ maxHeight:520, overflowY:"auto" }}>
                  {kegiatanList.map((k) => {
                    const kat = KAT_OPTIONS.find(o => o.value === k.kategori);
                    return (
                      <div key={k.id} className="row-hover" style={{ padding:"16px 24px", borderBottom:"1px solid #E5E0D8", display:"flex", gap:14, alignItems:"flex-start", transition:"background .15s" }}>
                        {k.foto && <img src={k.foto} alt="" style={{ width:56, height:56, borderRadius:10, objectFit:"cover", flexShrink:0 }} />}
                        <div style={{ flex:1, minWidth:0 }}>
                          <div style={{ display:"flex", gap:8, alignItems:"center", marginBottom:4, flexWrap:"wrap" }}>
                            <span style={{ fontSize:10, fontWeight:700, letterSpacing:".06em", padding:"2px 8px", borderRadius:99, background:"rgba(28,58,43,.1)", color:"#1C3A2B" }}>{kat?.label || k.kategori}</span>
                            <span style={{ fontSize:11, color:"#9A8C85" }}>{new Date(k.tanggal).toLocaleDateString("id-ID", { day:"numeric", month:"long", year:"numeric" })}</span>
                          </div>
                          <div style={{ fontSize:14, fontWeight:700, color:"#1A1410", marginBottom:4 }}>{k.judul}</div>
                          {k.deskripsi && <div style={{ fontSize:12, color:"#9A8C85", lineHeight:1.6, overflow:"hidden", display:"-webkit-box", WebkitLineClamp:2, WebkitBoxOrient:"vertical" as any }}>{k.deskripsi}</div>}
                        </div>
                        <button className="btn-sm" onClick={() => deleteKegiatan(k.id)} style={{ background:"#FDF0F0", color:"#8B2020", flexShrink:0 }}>🗑️ Hapus</button>
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
          <div style={{ display:"grid", gridTemplateColumns:"1fr 2fr", gap:20, alignItems:"start" }}>

            {/* Form tambah */}
            <div style={{ background:"#FFFEF9", border:"1px solid #E5E0D8", borderRadius:20, padding:"28px" }}>
              <h3 style={{ fontSize:14, fontWeight:700, color:"#1C3A2B", marginBottom:20, paddingBottom:14, borderBottom:"1px solid #E5E0D8" }}>➕ Tambah Produk Baru</h3>
              <div style={{ display:"flex", flexDirection:"column", gap:14 }}>
                <div>
                  <label style={{ display:"block", fontSize:10, fontWeight:700, letterSpacing:".12em", textTransform:"uppercase", color:"#9A8C85", marginBottom:6 }}>Nama Produk *</label>
                  <input className="field" value={pForm.nama} onChange={e => setPForm({...pForm, nama:e.target.value})} placeholder="Cth: Lampu Hex-Bamboo" />
                </div>
                <div>
                  <label style={{ display:"block", fontSize:10, fontWeight:700, letterSpacing:".12em", textTransform:"uppercase", color:"#9A8C85", marginBottom:6 }}>Deskripsi</label>
                  <textarea className="field" rows={3} value={pForm.deskripsi} onChange={e => setPForm({...pForm, deskripsi:e.target.value})} placeholder="Deskripsi singkat produk..." style={{ resize:"vertical" }} />
                </div>
                <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:12 }}>
                  <div>
                    <label style={{ display:"block", fontSize:10, fontWeight:700, letterSpacing:".12em", textTransform:"uppercase", color:"#9A8C85", marginBottom:6 }}>Harga (Rp) *</label>
                    <input type="number" className="field" value={pForm.harga} onChange={e => setPForm({...pForm, harga:e.target.value})} placeholder="150000" />
                  </div>
                  <div>
                    <label style={{ display:"block", fontSize:10, fontWeight:700, letterSpacing:".12em", textTransform:"uppercase", color:"#9A8C85", marginBottom:6 }}>Icon/Emoji</label>
                    <input className="field" value={pForm.icon} onChange={e => setPForm({...pForm, icon:e.target.value})} placeholder="🎋" style={{ fontSize:20 }} />
                  </div>
                </div>
                <div>
                  <label style={{ display:"block", fontSize:10, fontWeight:700, letterSpacing:".12em", textTransform:"uppercase", color:"#9A8C85", marginBottom:6 }}>Tag / Label</label>
                  <input className="field" value={pForm.tag} onChange={e => setPForm({...pForm, tag:e.target.value})} placeholder="Cth: Best Seller / Handmade / Eco" />
                </div>
                <div style={{ background:"rgba(61,43,31,.06)", padding:14, borderRadius:12, border:"1px dashed rgba(61,43,31,.2)" }}>
                  <label style={{ display:"block", fontSize:10, fontWeight:700, letterSpacing:".12em", textTransform:"uppercase", color:"#3D2B1F", marginBottom:10 }}>📸 Upload Foto Produk (Maksimal 5)</label>
                  <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:10 }}>
                    {[0,1,2,3,4].map((idx) => (
                      <div key={idx} style={{ background:"#FFFEF9", padding:10, borderRadius:8, border:"1.5px solid rgba(61,43,31,.15)" }}>
                        <div style={{ fontSize:9, fontWeight:700, color:"#9A8C85", marginBottom:6, textTransform:"uppercase" }}>Foto {idx + 1}</div>
                        <input 
                          type="file" 
                          accept="image/*" 
                          onChange={(e) => {
                            const newFiles = [...pFiles];
                            newFiles[idx] = e.target.files?.[0] || null;
                            setPFiles(newFiles);
                          }} 
                          style={{ fontSize:11, width:"100%", cursor:"pointer" }} 
                        />
                        {pFiles[idx] && (
                          <p style={{ fontSize:9, color:"#4A7C59", marginTop:4, fontWeight:700 }}>
                            ✓ {pFiles[idx]!.name.substring(0, 15)}...
                          </p>
                        )}
                      </div>
                    ))}
                  </div>
                  <div style={{ fontSize:10, color:"#9A8C85", marginTop:10, paddingTop:10, borderTop:"1px solid rgba(61,43,31,.15)" }}>
                    💡 Upload sampai 5 foto. Format: JPG, PNG, WebP (max ~5MB per file)
                  </div>
                </div>
                <button onClick={addProduk} disabled={loading} style={{ padding:"13px", borderRadius:12, background:"#3D2B1F", color:"#fff", fontSize:12, fontWeight:700, letterSpacing:".08em", textTransform:"uppercase", border:"none", cursor:"pointer", opacity:loading ? .6 : 1, marginTop:4 }}>
                  {loading ? "Menyimpan..." : "Simpan Produk"}
                </button>
              </div>
            </div>

            {/* List */}
            <div style={{ background:"#FFFEF9", border:"1px solid #E5E0D8", borderRadius:20, overflow:"hidden" }}>
              <div style={{ padding:"20px 24px", borderBottom:"1px solid #E5E0D8" }}>
                <h3 style={{ fontSize:14, fontWeight:700, color:"#3D2B1F" }}>Daftar Produk ({produkList.length})</h3>
              </div>
              {produkList.length === 0 ? (
                <div style={{ padding:"48px", textAlign:"center", color:"#9A8C85", fontSize:13 }}>Belum ada produk. Tambahkan yang pertama!</div>
              ) : (
                <div style={{ maxHeight:520, overflowY:"auto" }}>
                  {produkList.map((p) => (
                    <div key={p.id} className="row-hover" style={{ padding:"16px 24px", borderBottom:"1px solid #E5E0D8", display:"flex", gap:14, alignItems:"center", transition:"background .15s" }}>
                      <div style={{ width:48, height:48, borderRadius:10, background:"#F0EDE5", display:"flex", alignItems:"center", justifyContent:"center", fontSize:26, flexShrink:0 }}>{p.icon}</div>
                      <div style={{ flex:1 }}>
                        <div style={{ display:"flex", gap:8, alignItems:"center", marginBottom:3 }}>
                          <span style={{ fontSize:14, fontWeight:700, color:"#1A1410" }}>{p.nama}</span>
                          {p.tag && <span style={{ fontSize:10, fontWeight:700, padding:"2px 8px", borderRadius:99, background:"rgba(61,43,31,.08)", color:"#6B4F3A" }}>{p.tag}</span>}
                        </div>
                        <div style={{ fontSize:13, color:"#4A7C59", fontWeight:700 }}>{formatRp(p.harga)}</div>
                        {p.deskripsi && <div style={{ fontSize:12, color:"#9A8C85", marginTop:2 }}>{p.deskripsi}</div>}
                      </div>
                      <button className="btn-sm" onClick={() => deleteProduk(p.id, p.foto)} style={{ background:"#FDF0F0", color:"#8B2020" }}>🗑️ Hapus</button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

        {/* ═══════════════ TAB: TRANSAKSI ═══════════════ */}
        {activeTab === "transaksi" && (
          <div style={{ display:"flex", flexDirection:"column", gap:20 }}>

            {/* Form tambah */}
            <div style={{ background:"#FFFEF9", border:"1px solid #E5E0D8", borderRadius:20, padding:"28px" }}>
              <h3 style={{ fontSize:14, fontWeight:700, color:"#1C3A2B", marginBottom:20, paddingBottom:14, borderBottom:"1px solid #E5E0D8" }}>➕ Catat Transaksi Baru</h3>
              <div style={{ display:"grid", gridTemplateColumns:"repeat(auto-fit, minmax(160px, 1fr))", gap:14 }}>
                <div>
                  <label style={{ display:"block", fontSize:10, fontWeight:700, letterSpacing:".12em", textTransform:"uppercase", color:"#9A8C85", marginBottom:6 }}>Tanggal *</label>
                  <input type="date" className="field" value={tForm.tanggal} onChange={e => setTForm({...tForm, tanggal:e.target.value})} />
                </div>
                <div>
                  <label style={{ display:"block", fontSize:10, fontWeight:700, letterSpacing:".12em", textTransform:"uppercase", color:"#9A8C85", marginBottom:6 }}>Tipe *</label>
                  <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:6 }}>
                    {(["masuk","keluar"] as const).map(t => (
                      <button key={t} onClick={() => setTForm(f => ({
                        ...f,
                        tipe: t,
                        kategori: t === "masuk" ? KAT_MASUK[0] : KAT_KELUAR[0],
                      }))} style={{
                        padding:"11px 8px", borderRadius:10, fontSize:12, fontWeight:700, border:"1px solid #E5E0D8", cursor:"pointer", transition:"all .2s",
                        background: tForm.tipe === t ? (t === "masuk" ? "#E8F5EE" : "#FDF0F0") : "#FFFEF9",
                        color: tForm.tipe === t ? (t === "masuk" ? "#1C6B3A" : "#8B2020") : "#9A8C85",
                        borderColor: tForm.tipe === t ? (t === "masuk" ? "#B8DFCA" : "#F0C8C8") : "#E5E0D8",
                      }}>
                        {t === "masuk" ? "↑ Masuk" : "↓ Keluar"}
                      </button>
                    ))}
                  </div>
                </div>
                <div>
                  <label style={{ display:"block", fontSize:10, fontWeight:700, letterSpacing:".12em", textTransform:"uppercase", color:"#9A8C85", marginBottom:6 }}>Kategori</label>
                  <select className="field" value={tForm.kategori} onChange={e => setTForm({...tForm, kategori:e.target.value})}>
                    <optgroup label="━━ Kategori">
                      {(tForm.tipe === "masuk" ? KAT_MASUK : KAT_KELUAR).map(k => <option key={k}>{k}</option>)}
                    </optgroup>
                  </select>

                </div>
                <div>
                  <label style={{ display:"block", fontSize:10, fontWeight:700, letterSpacing:".12em", textTransform:"uppercase", color:"#9A8C85", marginBottom:6 }}>Jumlah (Rp) *</label>
                  <input type="number" className="field" value={tForm.jumlah} onChange={e => setTForm({...tForm, jumlah:e.target.value})} placeholder="500000" />
                </div>
                <div style={{ gridColumn:"1/-1" }}>
                  <label style={{ display:"block", fontSize:10, fontWeight:700, letterSpacing:".12em", textTransform:"uppercase", color:"#9A8C85", marginBottom:6 }}>Keterangan *</label>
                  <input className="field" value={tForm.keterangan} onChange={e => setTForm({...tForm, keterangan:e.target.value})} placeholder="Cth: Donasi QRIS dari Bpk. Ahmad" />
                </div>
              </div>
              <div style={{ display:"flex", gap:10, marginTop:18 }}>
                <button onClick={() => addTransaksi(false)} disabled={loading} style={{ flex:1, padding:"13px", borderRadius:12, background:"#1C3A2B", color:"#fff", fontSize:12, fontWeight:700, letterSpacing:".08em", textTransform:"uppercase", border:"none", cursor:"pointer", opacity:loading ? .6 : 1 }}>
                  {loading ? "Menyimpan..." : "Simpan Saja"}
                </button>
                <button onClick={() => addTransaksi(true)} disabled={loading} style={{ flex:1, padding:"13px", borderRadius:12, background:"#B8943F", color:"#fff", fontSize:12, fontWeight:700, letterSpacing:".08em", textTransform:"uppercase", border:"none", cursor:"pointer", opacity:loading ? .6 : 1, display:"flex", alignItems:"center", justifyContent:"center", gap:8 }}>
                  ✉️ Simpan & Notif Gmail
                </button>
              </div>

              {/* QRIS info */}
              <div style={{ marginTop:20, padding:"16px 20px", background:"rgba(45,90,64,.06)", borderRadius:12, border:"1px dashed rgba(45,90,64,.2)" }}>
                <div style={{ fontSize:12, fontWeight:700, color:"#2D5A40", marginBottom:4 }}>💡 Auto-Sync QRIS & Rekening Bank</div>
                <div style={{ fontSize:12, lineHeight:1.7, color:"#4A7C59" }}>
                  Untuk sinkronisasi otomatis dari QRIS/transfer bank, kamu butuh integrasi dengan <strong>Midtrans</strong> atau <strong>Xendit</strong> + webhook ke API route Next.js. Hubungi developer untuk setup ini — nilainya worth it untuk transparansi 100% otomatis.
                </div>
              </div>
            </div>

            {/* List */}
            <div style={{ background:"#FFFEF9", border:"1px solid #E5E0D8", borderRadius:20, overflow:"hidden" }}>
              <div style={{ padding:"20px 24px", borderBottom:"1px solid #E5E0D8", display:"flex", justifyContent:"space-between", alignItems:"center", flexWrap:"wrap", gap:12 }}>
                <h3 style={{ fontSize:14, fontWeight:700, color:"#1C3A2B" }}>Riwayat Transaksi ({transaksiList.length})</h3>
                <div style={{ display:"flex", gap:16 }}>
                  <span style={{ fontSize:12, fontWeight:700, color:"#1C6B3A" }}>↑ {formatRp(totalMasuk)}</span>
                  <span style={{ fontSize:12, fontWeight:700, color:"#8B2020" }}>↓ {formatRp(totalKeluar)}</span>
                  <span style={{ fontSize:13, fontWeight:800, color:"#1C3A2B" }}>Saldo: {formatRp(saldo)}</span>
                </div>
              </div>
              <div style={{ overflowX:"auto" }}>
                <table style={{ width:"100%", borderCollapse:"collapse" }}>
                  <thead>
                    <tr style={{ background:"#F0EDE5" }}>
                      {["Tanggal","Keterangan","Kategori","Tipe","Jumlah","Aksi"].map(h => (
                        <th key={h} style={{ padding:"11px 16px", fontSize:10, fontWeight:700, letterSpacing:".12em", textTransform:"uppercase", color:"#9A8C85", textAlign:"left", borderBottom:"1px solid #E5E0D8" }}>{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {transaksiList.length === 0 ? (
                      <tr><td colSpan={6} style={{ padding:"40px", textAlign:"center", color:"#9A8C85", fontSize:13 }}>Belum ada transaksi tercatat.</td></tr>
                    ) : transaksiList.map(t => (
                      <tr key={t.id} className="row-hover" style={{ transition:"background .15s" }}>
                        <td style={{ padding:"12px 16px", fontSize:12, color:"#5A4A40", whiteSpace:"nowrap", borderBottom:"1px solid #E5E0D8" }}>
                          {new Date(t.tanggal).toLocaleDateString("id-ID", { day:"numeric", month:"short", year:"numeric" })}
                        </td>
                        <td style={{ padding:"12px 16px", fontSize:13, color:"#1A1410", borderBottom:"1px solid #E5E0D8" }}>{t.keterangan}</td>
                        <td style={{ padding:"12px 16px", borderBottom:"1px solid #E5E0D8" }}>
                          <span style={{ fontSize:11, fontWeight:600, color:"#5A4A40", background:"#F0EDE5", padding:"3px 10px", borderRadius:99 }}>{t.kategori}</span>
                        </td>
                        <td style={{ padding:"12px 16px", borderBottom:"1px solid #E5E0D8" }}>
                          <span style={{ fontSize:11, fontWeight:700, padding:"3px 10px", borderRadius:99, background: t.tipe === "masuk" ? "#E8F5EE" : "#FDF0F0", color: t.tipe === "masuk" ? "#1C6B3A" : "#8B2020" }}>
                            {t.tipe === "masuk" ? "↑ Masuk" : "↓ Keluar"}
                          </span>
                        </td>
                        <td style={{ padding:"12px 16px", fontSize:13, fontWeight:700, whiteSpace:"nowrap", color: t.tipe === "masuk" ? "#1C6B3A" : "#8B2020", borderBottom:"1px solid #E5E0D8" }}>
                          {t.tipe === "masuk" ? "+" : "-"}{formatRp(t.jumlah)}
                        </td>
                        <td style={{ padding:"12px 16px", borderBottom:"1px solid #E5E0D8" }}>
                          <div style={{ display:"flex", gap:6 }}>
                            <button className="btn-sm" onClick={() => openGmailNotif(t)} style={{ background:"rgba(184,148,63,.1)", color:"#7A5A1E" }}>✉️</button>
                            <button className="btn-sm" onClick={() => deleteTransaksi(t.id)} style={{ background:"#FDF0F0", color:"#8B2020" }}>🗑️</button>
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
          <div style={{ display:"grid", gridTemplateColumns:"1fr 2fr", gap:20, alignItems:"start" }}>
            {/* Form tambah */}
            <div style={{ background:"#FFFEF9", border:"1px solid #E5E0D8", borderRadius:20, padding:"28px" }}>
              <h3 style={{ fontSize:14, fontWeight:700, color:"#1C3A2B", marginBottom:20, paddingBottom:14, borderBottom:"1px solid #E5E0D8" }}>➕ Tambah Testimoni / Berita</h3>
              <div style={{ display:"flex", flexDirection:"column", gap:14 }}>
                <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:10 }}>
                  <button onClick={() => setTmForm({...tmForm, tipe:"tokoh"})} style={{ padding:"10px", fontSize:11, fontWeight:700, borderRadius:10, border:"1px solid #E5E0D8", background: tmForm.tipe === "tokoh" ? "#1C3A2B" : "#FFFEF9", color: tmForm.tipe === "tokoh" ? "#fff" : "#9A8C85", cursor:"pointer" }}>👤 Dari Tokoh</button>
                  <button onClick={() => setTmForm({...tmForm, tipe:"berita"})} style={{ padding:"10px", fontSize:11, fontWeight:700, borderRadius:10, border:"1px solid #E5E0D8", background: tmForm.tipe === "berita" ? "#1A3A6B" : "#FFFEF9", color: tmForm.tipe === "berita" ? "#fff" : "#9A8C85", cursor:"pointer" }}>📰 Artikel Berita</button>
                </div>
                <div>
                  <label style={{ display:"block", fontSize:10, fontWeight:700, letterSpacing:".12em", textTransform:"uppercase", color:"#9A8C85", marginBottom:6 }}>Nama Tokoh / Media *</label>
                  <input className="field" value={tmForm.nama} onChange={e => setTmForm({...tmForm, nama:e.target.value})} placeholder="Cth: Garut News / H. Kepala Desa" />
                </div>
                <div>
                  <label style={{ display:"block", fontSize:10, fontWeight:700, letterSpacing:".12em", textTransform:"uppercase", color:"#9A8C85", marginBottom:6 }}>Jabatan / Subteks</label>
                  <input className="field" value={tmForm.jabatan} onChange={e => setTmForm({...tmForm, jabatan:e.target.value})} placeholder="Cth: Media Lokal / Kepala Kecamatan" />
                </div>
                <div>
                  <label style={{ display:"block", fontSize:10, fontWeight:700, letterSpacing:".12em", textTransform:"uppercase", color:"#9A8C85", marginBottom:6 }}>Isi Pesan/Kutipan *</label>
                  <textarea className="field" rows={4} value={tmForm.pesan} onChange={e => setTmForm({...tmForm, pesan:e.target.value})} placeholder="Ketik disini..." style={{ resize:"vertical" }} />
                </div>
                <div style={{ background:"rgba(28,58,43,.06)", padding:14, borderRadius:12, border:"1px dashed rgba(28,58,43,.2)" }}>
                  <label style={{ display:"block", fontSize:10, fontWeight:700, letterSpacing:".12em", textTransform:"uppercase", color:"#1C3A2B", marginBottom:6 }}>Upload Foto / Logo</label>
                  <input type="file" accept="image/*" onChange={e => setTmFile(e.target.files?.[0] || null)} style={{ fontSize:12, width:"100%" }} />
                  {tmFile && <p style={{ fontSize:10, color:"#1C6B3A", marginTop:8, fontWeight:700 }}>✓ File dipilih: {tmFile.name}</p>}
                  
                  <div style={{ marginTop:14, fontSize:10, color:"#9A8C85", borderTop:"1px solid rgba(28,58,43,.1)", paddingTop:10 }}>ATAU paste link (opsional):</div>
                  <input className="field" value={tmForm.foto} onChange={e => setTmForm({...tmForm, foto:e.target.value})} placeholder="https://..." style={{ marginTop:6, fontSize:11, padding:"8px 12px" }} disabled={!!tmFile} />
                  <p style={{ fontSize:9, color:"#8B2020", marginTop:6 }}>PENTING: Fitur upload lokal mewajibkan pembuatan Bucket bernama <strong>ciburial-assets</strong> di menu Supabase Storage dan diaturnya ke setting Public.</p>
                </div>
                <button onClick={addTestimoni} disabled={loading} style={{ padding:"13px", borderRadius:12, background:"#1C3A2B", color:"#fff", fontSize:12, fontWeight:700, letterSpacing:".08em", textTransform:"uppercase", border:"none", cursor:"pointer", opacity:loading ? .6 : 1, marginTop:4 }}>
                  {loading ? "Menyimpan/Upload..." : "Simpan Data"}
                </button>
              </div>
            </div>

            {/* List */}
            <div style={{ background:"#FFFEF9", border:"1px solid #E5E0D8", borderRadius:20, overflow:"hidden" }}>
              <div style={{ padding:"20px 24px", borderBottom:"1px solid #E5E0D8" }}>
                <h3 style={{ fontSize:14, fontWeight:700, color:"#1C3A2B" }}>Daftar Testimoni & Berita ({testimoniList.length})</h3>
              </div>
              {testimoniList.length === 0 ? (
                <div style={{ padding:"48px", textAlign:"center", color:"#9A8C85", fontSize:13 }}>Belum ada data. Tambahkan Testimoni pertama lu!</div>
              ) : (
                <div style={{ maxHeight:520, overflowY:"auto" }}>
                  {testimoniList.map((tm) => (
                    <div key={tm.id} className="row-hover" style={{ padding:"16px 24px", borderBottom:"1px solid #E5E0D8", display:"flex", gap:14, alignItems:"flex-start", transition:"background .15s" }}>
                      {tm.foto ? <img src={tm.foto} alt="" style={{ width:50, height:50, borderRadius:"50%", objectFit:"cover", flexShrink:0, border:"2px solid #E5E0D8" }} /> : <div style={{ width:50, height:50, borderRadius:"50%", background:"#F0EDE5", display:"flex", alignItems:"center", justifyContent:"center", fontSize:20, flexShrink:0 }}>👤</div>}
                      <div style={{ flex:1 }}>
                        <div style={{ display:"flex", gap:8, alignItems:"center", marginBottom:4 }}>
                          <span style={{ fontSize:14, fontWeight:700, color:"#1A1410" }}>{tm.nama}</span>
                          <span style={{ fontSize:9, fontWeight:700, padding:"2px 8px", borderRadius:6, textTransform:"uppercase", background: tm.tipe === "tokoh" ? "rgba(184,148,63,.1)" : "rgba(45,90,160,.1)", color: tm.tipe === "tokoh" ? "#7A5A1E" : "#1A3A6B" }}>
                            {tm.tipe}
                          </span>
                        </div>
                        <div style={{ fontSize:11, fontWeight:700, color:"#9A8C85", textTransform:"uppercase", letterSpacing:".06em", marginBottom:8 }}>{tm.jabatan}</div>
                        <div style={{ fontSize:12, color:"#5A4A40", fontStyle:"italic", lineHeight:1.6 }}>&quot;{tm.pesan}&quot;</div>
                      </div>
                      <button className="btn-sm" onClick={() => deleteTestimoni(tm.id, tm.foto)} style={{ background:"#FDF0F0", color:"#8B2020", flexShrink:0 }}>🗑️ Hapus</button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

        {/* ═══════════════ TAB: IKLAN ═══════════════ */}
        {activeTab === "iklan" && (
          <div style={{ display:"grid", gridTemplateColumns:"1fr 2fr", gap:20, alignItems:"start" }}>
            {/* Form tambah */}
            <div style={{ background:"#FFFEF9", border:"1px solid #E5E0D8", borderRadius:20, padding:"28px" }}>
              <h3 style={{ fontSize:14, fontWeight:700, color:"#1C3A2B", marginBottom:20, paddingBottom:14, borderBottom:"1px solid #E5E0D8" }}>➕ Tambah Iklan / Promo</h3>
              <div style={{ display:"flex", flexDirection:"column", gap:14 }}>
                <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:10 }}>
                  <button onClick={() => setIkForm({...ikForm, tipe:"foto"})} style={{ padding:"10px", fontSize:11, fontWeight:700, borderRadius:10, border:"1px solid #E5E0D8", background: ikForm.tipe === "foto" ? "#1C3A2B" : "#FFFEF9", color: ikForm.tipe === "foto" ? "#fff" : "#9A8C85", cursor:"pointer" }}>🖼️ Foto Promo</button>
                  <button onClick={() => setIkForm({...ikForm, tipe:"video"})} style={{ padding:"10px", fontSize:11, fontWeight:700, borderRadius:10, border:"1px solid #E5E0D8", background: ikForm.tipe === "video" ? "#1A3A6B" : "#FFFEF9", color: ikForm.tipe === "video" ? "#fff" : "#9A8C85", cursor:"pointer" }}>🎥 Video Promo</button>
                </div>
                <div>
                  <label style={{ display:"block", fontSize:10, fontWeight:700, letterSpacing:".12em", textTransform:"uppercase", color:"#9A8C85", marginBottom:6 }}>Judul Iklan *</label>
                  <input className="field" value={ikForm.judul} onChange={e => setIkForm({...ikForm, judul:e.target.value})} placeholder="Cth: Promo Ramadhan" />
                </div>
                <div>
                  <label style={{ display:"block", fontSize:10, fontWeight:700, letterSpacing:".12em", textTransform:"uppercase", color:"#9A8C85", marginBottom:6 }}>Deskripsi *</label>
                  <textarea className="field" rows={3} value={ikForm.deskripsi} onChange={e => setIkForm({...ikForm, deskripsi:e.target.value})} placeholder="Diskon besar-besaran..." style={{ resize:"vertical" }} />
                </div>
                <div>
                  <label style={{ display:"block", fontSize:10, fontWeight:700, letterSpacing:".12em", textTransform:"uppercase", color:"#9A8C85", marginBottom:6 }}>Link Tujuan (opsional)</label>
                  <input className="field" value={ikForm.linkTujuan} onChange={e => setIkForm({...ikForm, linkTujuan:e.target.value})} placeholder="https://..." />
                </div>
                <div style={{ background:"rgba(28,58,43,.06)", padding:14, borderRadius:12, border:"1px dashed rgba(28,58,43,.2)" }}>
                  <label style={{ display:"block", fontSize:10, fontWeight:700, letterSpacing:".12em", textTransform:"uppercase", color:"#1C3A2B", marginBottom:6 }}>Upload {ikForm.tipe} *</label>
                  <input type="file" accept={ikForm.tipe === "video" ? "video/*" : "image/*"} onChange={e => setIkFile(e.target.files?.[0] || null)} style={{ fontSize:12, width:"100%" }} />
                  {ikFile && <p style={{ fontSize:10, color:"#1C6B3A", marginTop:8, fontWeight:700 }}>✓ File terpilih: {ikFile.name}</p>}
                  
                  <div style={{ marginTop:14, fontSize:10, color:"#9A8C85", borderTop:"1px solid rgba(28,58,43,.1)", paddingTop:10 }}>ATAU paste link media:</div>
                  <input className="field" value={ikForm.mediaUrl} onChange={e => setIkForm({...ikForm, mediaUrl:e.target.value})} placeholder="https://..." style={{ marginTop:6, fontSize:11, padding:"8px 12px" }} disabled={!!ikFile} />
                </div>
                <button onClick={addIklan} disabled={loading} style={{ padding:"13px", borderRadius:12, background:"#1C3A2B", color:"#fff", fontSize:12, fontWeight:700, letterSpacing:".08em", textTransform:"uppercase", border:"none", cursor:"pointer", opacity:loading ? .6 : 1, marginTop:4 }}>
                  {loading ? "Menyimpan/Upload..." : "Simpan Iklan"}
                </button>
              </div>
            </div>

            {/* List */}
            <div style={{ background:"#FFFEF9", border:"1px solid #E5E0D8", borderRadius:20, overflow:"hidden" }}>
              <div style={{ padding:"20px 24px", borderBottom:"1px solid #E5E0D8" }}>
                <h3 style={{ fontSize:14, fontWeight:700, color:"#1C3A2B" }}>Daftar Iklan Promo ({iklanList.length})</h3>
              </div>
              {iklanList.length === 0 ? (
                <div style={{ padding:"48px", textAlign:"center", color:"#9A8C85", fontSize:13 }}>Belum ada iklan. Buat promo pertama lur!</div>
              ) : (
                <div style={{ maxHeight:520, overflowY:"auto" }}>
                  {iklanList.map((ik) => (
                    <div key={ik.id} className="row-hover" style={{ padding:"16px 24px", borderBottom:"1px solid #E5E0D8", display:"flex", gap:14, alignItems:"flex-start", transition:"background .15s" }}>
                      {ik.tipe === "video" ? (
                        <div style={{ width:70, height:48, background:"#000", borderRadius:8, display:"flex", alignItems:"center", justifyContent:"center", color:"#fff", fontSize:16, flexShrink:0 }}>🎥</div>
                      ) : (
                        <img src={ik.mediaUrl} alt="" style={{ width:70, height:48, borderRadius:8, objectFit:"cover", flexShrink:0, border:"1px solid #E5E0D8" }} />
                      )}
                      <div style={{ flex:1 }}>
                        <div style={{ display:"flex", gap:8, alignItems:"center", marginBottom:4 }}>
                          <span style={{ fontSize:14, fontWeight:700, color:"#1A1410" }}>{ik.judul}</span>
                          <span style={{ fontSize:9, fontWeight:700, padding:"2px 8px", borderRadius:6, textTransform:"uppercase", background: ik.tipe === "video" ? "rgba(45,90,160,.1)" : "rgba(184,148,63,.1)", color: ik.tipe === "video" ? "#1A3A6B" : "#7A5A1E" }}>
                            {ik.tipe}
                          </span>
                        </div>
                        <div style={{ fontSize:11, color:"#5A4A40", lineHeight:1.4 }}>{ik.deskripsi}</div>
                        {ik.linkTujuan && <div style={{ fontSize:10, color:"#1C3A2B", marginTop:4 }}>🔗 {ik.linkTujuan}</div>}
                      </div>
                      <button className="btn-sm" onClick={() => deleteIklan(ik.id, ik.mediaUrl)} style={{ background:"#FDF0F0", color:"#8B2020", flexShrink:0 }}>🗑️</button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}
      </main>
    </div>
    <style>{`@keyframes pulse{0%,100%{opacity:1}50%{opacity:0.3}}`}</style>
    </>
  );
}