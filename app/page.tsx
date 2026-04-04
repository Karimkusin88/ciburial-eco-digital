"use client";
// app/page.tsx — Ciburial Eco-Digital Village
// Requires: lib/supabase.ts + npm install @supabase/supabase-js
import { useState, useEffect } from "react";
import { supabase, isSupabaseReady } from "@/lib/supabase";

type TabType = "tentang"|"kegiatan"|"proposal"|"transparansi"|"marketplace";
interface Kegiatan  { id:string; judul:string; tanggal:string; kategori:string; deskripsi:string; foto?:string; }
interface Produk    { id:string; nama:string; deskripsi:string; harga:number; tag:string; icon:string; }
interface Transaksi { id:string; tanggal:string; keterangan:string; kategori:string; tipe:"masuk"|"keluar"; jumlah:number; }

const fRp = (n:number) => "Rp " + n.toLocaleString("id-ID");

// ─── DEFAULT DATA (fallback sebelum Supabase dikonfigurasi) ─────────────────
const DEF_KEG:Kegiatan[] = [
  {id:"d1",judul:"Pemasangan Smart PJU Perdana",tanggal:"2026-03-20",kategori:"update-kampung",deskripsi:"Milestone pertama! Smart PJU berbahan bambu berhasil dipasang di 2 titik strategis jalan utama Ciburial."},
  {id:"d2",judul:"HUT Kemerdekaan RI ke-81",tanggal:"2026-08-17",kategori:"kemerdekaan",deskripsi:"Perayaan HUT RI dengan lomba tradisional, upacara bendera, dan pentas seni pemuda Ciburial."},
  {id:"d3",judul:"Peringatan Maulid Nabi SAW",tanggal:"2026-09-10",kategori:"keagamaan",deskripsi:"Pengajian dan doa bersama seluruh warga memperingati Maulid Nabi Muhammad SAW."},
  {id:"d4",judul:"Musyawarah Pembentukan Bank Sampah",tanggal:"2026-02-10",kategori:"kemasyarakatan",deskripsi:"Rembug warga menyiapkan sistem Bank Sampah Digital Ciburial perdana."},
];
const DEF_PROD:Produk[] = [
  {id:"p1",nama:"Lampu Hex-Bamboo",deskripsi:"Lampu tidur estetik anyaman bambu asli pegunungan. Cahaya hangat, aroma alami.",harga:150000,tag:"Best Seller",icon:"🪔"},
  {id:"p2",nama:"Keranjang Anyam",deskripsi:"Kerajinan tangan warga, multifungsi dan ramah lingkungan untuk dekorasi.",harga:85000,tag:"Handmade",icon:"🧺"},
  {id:"p3",nama:"Mini Pot Bambu",deskripsi:"Pot tanaman dari bambu pilihan. Natural, kuat, mempercantik ruangan.",harga:60000,tag:"Eco",icon:"🌿"},
  {id:"p4",nama:"Kompos Organik",deskripsi:"Pupuk dari Bank Sampah Ciburial. 100% organik, baik untuk tanaman.",harga:25000,tag:"Eco-Waste",icon:"🌱"},
  {id:"p5",nama:"Sayur Organik Box",deskripsi:"Sayuran segar dari ladang warga Ciburial, bebas pestisida kimia.",harga:45000,tag:"Fresh Farm",icon:"🥬"},
  {id:"p6",nama:"Pigura Bambu",deskripsi:"Pigura foto artistik dari bambu terpilih. Cocok untuk dekorasi atau hadiah.",harga:70000,tag:"Craft",icon:"🎋"},
];
const DEF_TX:Transaksi[] = [
  {id:"t1",tanggal:"2026-01-15",keterangan:"Donasi Ust. Kurniadin & jamaah",kategori:"Donasi Warga",tipe:"masuk",jumlah:500000},
  {id:"t2",tanggal:"2026-01-20",keterangan:"Donasi CSR PT. Sejahtera Garut",kategori:"Donasi Institusi",tipe:"masuk",jumlah:2000000},
  {id:"t3",tanggal:"2026-02-01",keterangan:"Pembelian material tiang PJU (2 unit)",kategori:"Smart PJU & Keamanan",tipe:"keluar",jumlah:850000},
  {id:"t4",tanggal:"2026-02-05",keterangan:"Donasi online via QRIS (Februari)",kategori:"Donasi Online",tipe:"masuk",jumlah:750000},
  {id:"t5",tanggal:"2026-02-10",keterangan:"Pembelian LED Solar 20W (4 buah)",kategori:"Smart PJU & Keamanan",tipe:"keluar",jumlah:480000},
  {id:"t6",tanggal:"2026-02-18",keterangan:"Donasi perantau Ciburial (transfer)",kategori:"Donasi Perantau",tipe:"masuk",jumlah:1200000},
  {id:"t7",tanggal:"2026-03-01",keterangan:"Kas DKM bulan Maret",kategori:"DKM Masjid",tipe:"keluar",jumlah:300000},
  {id:"t8",tanggal:"2026-03-10",keterangan:"Pengadaan buku Learning Hub",kategori:"Learning Hub",tipe:"keluar",jumlah:180000},
  {id:"t9",tanggal:"2026-03-15",keterangan:"Donasi online via QRIS (Maret)",kategori:"Donasi Online",tipe:"masuk",jumlah:420000},
  {id:"t10",tanggal:"2026-03-22",keterangan:"Penjualan Lampu Hex-Bamboo (3 unit)",kategori:"Marketplace",tipe:"masuk",jumlah:450000},
];

// ─── RAB GLOBAL (dari proposal) ─────────────────────────────────────────────
const ALOKASI = [
  {label:"Balai Serba Guna & Ruang Publik",  target:80000000, icon:"🏛️",color:"#2D5A40",desc:"Material konstruksi baja ringan & bambu"},
  {label:"Smart Farming & Peternakan Modern", target:60000000, icon:"🌾",color:"#4A7C59",desc:"Infrastruktur kandang, bibit, instalasi kebun, pupuk"},
  {label:"Learning Hub",                      target:45000000, icon:"📚",color:"#B8943F",desc:"PC/Laptop, server, perabotan, buku perpustakaan"},
  {label:"Smart PJU & Keamanan",              target:25000000, icon:"💡",color:"#1A3A6B",desc:"Panel surya, lampu DC, tiang, IP Camera CCTV"},
  {label:"Jaringan Internet (RT/RW Net)",     target:20000000, icon:"📶",color:"#6B4F3A",desc:"Router utama, kabel distribusi, Wi-Fi publik"},
  {label:"Operasional Digital & Eco-Waste",  target:20000000, icon:"♻️",color:"#8A7065",desc:"Alat press limbah, server/domain, marketplace"},
];

const KAT_CFG:Record<string,{label:string;bg:string;color:string}> = {
  "keagamaan":      {label:"🕌 Keagamaan",     bg:"rgba(184,148,63,.1)", color:"#7A5A1E"},
  "kemerdekaan":    {label:"🇮🇩 Kemerdekaan",  bg:"rgba(196,50,50,.09)",color:"#8B2020"},
  "kemasyarakatan": {label:"🤝 Kemasyarakatan",bg:"rgba(28,58,43,.1)",  color:"#1C3A2B"},
  "update-kampung": {label:"📍 Update Kampung",bg:"rgba(45,90,160,.09)",color:"#1A3A6B"},
};

// ─── KOMPONEN UTAMA ──────────────────────────────────────────────────────────
export default function Home() {
  const [tab,        setTab]        = useState<TabType>("tentang");
  const [checkout,   setCheckout]   = useState(false);
  const [scrolled,   setScrolled]   = useState(false);
  const [mobOpen,    setMobOpen]    = useState(false);
  const [dropOpen,   setDropOpen]   = useState(false);
  const [fTipe,      setFTipe]      = useState<"semua"|"masuk"|"keluar">("semua");
  const [fKat,       setFKat]       = useState("semua");
  const [propOpen,   setPropOpen]   = useState<number|null>(null);
  const [kegiatan,   setKegiatan]   = useState<Kegiatan[]>(DEF_KEG);
  const [produk,     setProduk]     = useState<Produk[]>(DEF_PROD);
  const [transaksi,  setTransaksi]  = useState<Transaksi[]>(DEF_TX);
  const [dataLoad,   setDataLoad]   = useState(false);

  useEffect(()=>{
    const f=()=>setScrolled(window.scrollY>40);
    window.addEventListener("scroll",f);
    return()=>window.removeEventListener("scroll",f);
  },[]);

  useEffect(()=>{
    const obs=new IntersectionObserver(
      es=>es.forEach(e=>{if(e.isIntersecting)e.target.classList.add("iv");}),
      {threshold:.08}
    );
    document.querySelectorAll(".rv").forEach(el=>obs.observe(el));
    return()=>obs.disconnect();
  },[tab,checkout]);

  useEffect(()=>{
    if(!isSupabaseReady())return;
    (async()=>{
      setDataLoad(true);
      const[k,p,t]=await Promise.all([
        supabase.from("kegiatan").select("*").order("tanggal",{ascending:false}),
        supabase.from("produk").select("*").order("created_at",{ascending:false}),
        supabase.from("transaksi").select("*").order("tanggal",{ascending:false}),
      ]);
      if(k.data?.length)setKegiatan(k.data as Kegiatan[]);
      if(p.data?.length)setProduk(p.data as Produk[]);
      if(t.data?.length)setTransaksi(t.data as Transaksi[]);
      setDataLoad(false);
    })();
  },[]);

  const go=(t:TabType)=>{setTab(t);setCheckout(false);setMobOpen(false);};

  // keuangan
  const totMasuk  = transaksi.filter(t=>t.tipe==="masuk").reduce((s,t)=>s+t.jumlah,0);
  const totKeluar = transaksi.filter(t=>t.tipe==="keluar").reduce((s,t)=>s+t.jumlah,0);
  const saldo     = totMasuk-totKeluar;
  const totTarget = ALOKASI.reduce((s,a)=>s+a.target,0); // 250.000.000
  const kegFil    = fKat==="semua"?kegiatan:kegiatan.filter(k=>k.kategori===fKat);
  const txFil     = fTipe==="semua"?transaksi:transaksi.filter(t=>t.tipe===fTipe);

  const TABS=[
    {key:"tentang"      as TabType,label:"Tentang Kampung"},
    {key:"kegiatan"     as TabType,label:"Kegiatan"},
    {key:"proposal"     as TabType,label:"Proposal"},
    {key:"transparansi" as TabType,label:"Transparansi Dana"},
    {key:"marketplace"  as TabType,label:"Marketplace"},
  ];

  // ─── STRUKTUR ORGANISASI ─────────────────────────────────────────────────
  const dwnPelindung=[
    {role:"Tokoh Agama",         name:"Ust. Kurniadin",   icon:"🕌"},
    {role:"Kepala Kewilayahan",  name:"Bpk. Enang (Ketua RW)", icon:"🏘️"},
    {role:"Koordinator RT 01",   name:"Sarip Hidayat",    icon:"👤"},
    {role:"Koordinator RT 02",   name:"Oneng",            icon:"👤"},
    {role:"Koordinator RT 03",   name:"Mumun",            icon:"👤"},
  ];
  const dwnPengawas=[
    {role:"Pengelola Dana DKM",  name:"Bpk. Pupu Apipudin", icon:"🤲"},
  ];
  const timEksekutif=[
    {role:"Ketua Pelaksana (PM)",name:"Ubay Rahmat H.",   icon:"⚡"},
    {role:"Sekretaris",          name:"— Hasil Voting —", icon:"📋"},
    {role:"Bendahara",           name:"— Hasil Voting —", icon:"💰"},
  ];
  const divisi=[
    {icon:"🏗️",nama:"Green Build",        full:"Infrastruktur & Konstruksi Hijau", tugas:"Balai Serba Guna, Smart PJU, drainase resapan"},
    {icon:"💻",nama:"Digital Hub",         full:"IT, Jaringan & Web3",              tugas:"RT/RW Net, Learning Hub, Website, Crypto"},
    {icon:"🌾",nama:"Eco-Waste & Farming", full:"Smart Farming & Lingkungan",       tugas:"Pertanian organik, peternakan, Bank Sampah"},
    {icon:"🛒",nama:"Local Commerce",      full:"Ekonomi Kreatif & UMKM",           tugas:"Pengrajin lokal, marketplace, quality control"},
    {icon:"📢",nama:"Public Relations",    full:"Humas & Transparansi Publik",      tugas:"Dokumentasi, laporan dana, komunikasi CSR"},
  ];

  // ─── CSS ────────────────────────────────────────────────────────────────
  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Cormorant+Garamond:ital,wght@0,300;0,400;0,600;0,700;1,300;1,400&family=DM+Sans:opsz,wght@9..40,300;9..40,400;9..40,500;9..40,600;9..40,700&display=swap');
        :root{
          --fo:#1C3A2B;--fm:#2D5A40;--fl:#4A7C59;
          --cr:#FAF8F3;--cd:#F0EDE5;--cw:#FFFEF9;
          --go:#B8943F;--gl:#D4AC5A;
          --ea:#3D2B1F;--em:#6B4F3A;--el:#A08070;
          --tp:#1A1410;--ts:#5A4A40;--tm:#9A8C85;
          --bo:#E5E0D8;
          --gb:#E8F5EE;--gt:#1C6B3A;
          --rb:#FDF0F0;--rt:#8B2020;
        }
        *{box-sizing:border-box;margin:0;padding:0;}
        body{background:var(--cr);color:var(--tp);font-family:'DM Sans',sans-serif;}
        .fnt{font-family:'Cormorant Garamond',serif;}

        /* reveal */
        .rv{opacity:0;transform:translateY(24px);transition:opacity .7s cubic-bezier(.22,1,.36,1),transform .7s cubic-bezier(.22,1,.36,1);}
        .rv.iv{opacity:1;transform:none;}
        .d1{transition-delay:.06s}.d2{transition-delay:.12s}.d3{transition-delay:.18s}
        .d4{transition-delay:.24s}.d5{transition-delay:.3s}.d6{transition-delay:.36s}

        /* hero anim */
        @keyframes fu{from{opacity:0;transform:translateY(44px)}to{opacity:1;transform:translateY(0)}}
        .h1{animation:fu .9s cubic-bezier(.22,1,.36,1) .05s both}
        .h2{animation:fu .9s cubic-bezier(.22,1,.36,1) .2s both}
        .h3{animation:fu .9s cubic-bezier(.22,1,.36,1) .34s both}
        .h4{animation:fu .9s cubic-bezier(.22,1,.36,1) .46s both}
        .h5{animation:fu .9s cubic-bezier(.22,1,.36,1) .57s both}
        @keyframes pi{from{opacity:0;transform:translateY(18px)}to{opacity:1;transform:translateY(0)}}
        .pi{animation:pi .4s cubic-bezier(.22,1,.36,1) both}

        /* nav */
        .ng{background:rgba(250,248,243,.97)!important;box-shadow:0 1px 0 var(--bo);}

        /* deco line */
        .dl{display:inline-block;width:44px;height:2px;background:var(--go);margin-bottom:20px;}
        .dlc{display:block;margin:0 auto 20px;}

        /* marquee */
        @keyframes mq{from{transform:translateX(0)}to{transform:translateX(-50%)}}
        .mq{animation:mq 22s linear infinite}.mq:hover{animation-play-state:paused}

        /* button slide effect */
        .btn{position:relative;overflow:hidden;transition:color .3s;}
        .btn::before{content:'';position:absolute;inset:0;background:var(--go);transform:translateX(-105%);transition:transform .4s cubic-bezier(.22,1,.36,1);}
        .btn:hover::before{transform:translateX(0);}
        .btn span{position:relative;z-index:1;}

        /* card hover */
        .ch{transition:transform .35s cubic-bezier(.22,1,.36,1),box-shadow .35s ease;}
        .ch:hover{transform:translateY(-5px);box-shadow:0 18px 52px rgba(28,58,43,.1);}

        /* inputs */
        .fi{border:1px solid var(--bo);background:var(--cw);transition:border-color .25s,box-shadow .25s;outline:none;font-family:'DM Sans',sans-serif;width:100%;border-radius:12px;padding:14px 18px;font-size:14px;}
        .fi:focus{border-color:var(--fm);box-shadow:0 0 0 3px rgba(45,90,64,.08);}

        /* progress */
        .pg{height:5px;background:var(--cd);border-radius:99px;overflow:hidden;}
        .pgf{height:100%;border-radius:99px;transition:width 1.2s cubic-bezier(.22,1,.36,1) .2s;}
        .pgw:not(.iv) .pgf{width:0!important;}

        /* table */
        .tbl{width:100%;border-collapse:collapse;}
        .tbl th{font-size:10px;font-weight:700;letter-spacing:.13em;text-transform:uppercase;color:var(--tm);padding:12px 16px;text-align:left;border-bottom:1px solid var(--bo);}
        .tbl td{font-size:13px;padding:13px 16px;border-bottom:1px solid var(--bo);color:var(--ts);vertical-align:middle;}
        .tbl tr:last-child td{border-bottom:none;}
        .tbl tr:hover td{background:var(--cr);}

        /* accordion */
        .ac{max-height:0;overflow:hidden;transition:max-height .45s cubic-bezier(.22,1,.36,1);}
        .ac.op{max-height:1200px;}

        /* mobile menu */
        .mob{opacity:0;transform:translateY(-10px);pointer-events:none;transition:opacity .25s,transform .25s cubic-bezier(.22,1,.36,1);}
        .mob.op{opacity:1;transform:translateY(0);pointer-events:all;}

        /* kegiatan card */
        .kc{transition:transform .3s cubic-bezier(.22,1,.36,1),box-shadow .3s ease;}
        .kc:hover{transform:translateY(-4px);box-shadow:0 14px 44px rgba(28,58,43,.1);}

        /* skeleton */
        @keyframes sh{0%{background-position:-400px 0}100%{background-position:400px 0}}
        .sk{background:linear-gradient(90deg,var(--cd) 25%,var(--cr) 50%,var(--cd) 75%);background-size:800px;animation:sh 1.5s infinite;}

        /* divisi badge */
        .div-card{transition:all .3s cubic-bezier(.22,1,.36,1);}
        .div-card:hover{transform:translateY(-3px);box-shadow:0 12px 36px rgba(28,58,43,.08);}

        ::-webkit-scrollbar{width:5px;}
        ::-webkit-scrollbar-thumb{background:var(--el);border-radius:99px;}

        /* ── DROPDOWN LAYANAN ── */
        .drop-menu{
          position:absolute; top:calc(100% + 8px); right:0;
          background:var(--cw); border:1px solid var(--bo);
          border-radius:16px; padding:8px; min-width:200px;
          box-shadow:0 16px 48px rgba(28,58,43,.12);
          opacity:0; transform:translateY(-8px); pointer-events:none;
          transition:opacity .25s cubic-bezier(.22,1,.36,1), transform .25s cubic-bezier(.22,1,.36,1);
          z-index:100;
        }
        .drop-menu.open{ opacity:1; transform:translateY(0); pointer-events:all; }
        .drop-item{
          display:flex; align-items:center; gap:10;
          padding:10px 14px; border-radius:10px;
          text-decoration:none; font-size:12px; font-weight:600;
          letter-spacing:.05em; color:var(--ts);
          transition:background .15s, color .15s;
          white-space:nowrap;
        }
        .drop-item:hover{ background:var(--cd); color:var(--fo); }

        /* ── HERO MOBILE RESPONSIVE ── */
        /* Desktop: full viewport height, content di bawah */
        .hero-section{
          min-height: 100svh;
          display: flex;
          flex-direction: column;
          justify-content: flex-end;
        }
        .hero-content{
          padding: 0 32px 80px;
          padding-top: 140px;
          max-width: 100%;
          position: relative;
          z-index: 1;
        }
        .hero-title{ font-size: clamp(54px, 12vw, 154px); }
        .hero-sub{   font-size: clamp(22px, 5vw, 58px); }

        /* Mobile: hilangkan full-height, konten langsung keliatan */
        @media (max-width: 768px) {
          .hero-section{
            min-height: 0 !important;
            justify-content: flex-start !important;
          }
          .hero-content{
            padding: 96px 22px 48px !important;
          }
          .hero-title{ font-size: clamp(48px, 14vw, 72px) !important; }
          .hero-sub{   font-size: clamp(18px, 6vw, 28px) !important; }
        }
      `}</style>

      <main style={{minHeight:"100vh",background:"var(--cr)"}}>

        {/* ════════════════ NAVBAR ════════════════ */}
        <nav className={scrolled?"ng":""} style={{position:"fixed",top:0,width:"100%",zIndex:50,transition:"background .3s,box-shadow .3s",background:scrolled?undefined:"transparent"}}>
          <div style={{maxWidth:1320,margin:"0 auto",padding:"0 28px",height:70,display:"flex",alignItems:"center",justifyContent:"space-between"}}>

            <button onClick={()=>go("tentang")} style={{background:"none",border:"none",cursor:"pointer",textAlign:"left"}}>
              <div className="fnt" style={{fontSize:20,fontWeight:600,color:"var(--fo)",lineHeight:1,letterSpacing:"-.02em"}}>Ciburial</div>
              <div style={{fontSize:9,fontWeight:700,letterSpacing:".18em",textTransform:"uppercase",color:"var(--go)"}}>Eco-Digital Village</div>
            </button>

            {/* Desktop */}
            <div className="hidden md:flex" style={{gap:2,alignItems:"center"}}>
              {TABS.map(t=>(
                <button key={t.key} onClick={()=>go(t.key)} style={{padding:"8px 14px",fontSize:11,fontWeight:600,letterSpacing:".08em",textTransform:"uppercase",border:"none",borderRadius:99,cursor:"pointer",transition:"all .25s",background:(tab===t.key)||(t.key==="marketplace"&&checkout)?"var(--fo)":"transparent",color:(tab===t.key)||(t.key==="marketplace"&&checkout)?"#fff":"var(--ts)"}}>
                  {t.label}
                </button>
              ))}
              {/* Dropdown Layanan Warga */}
              <div style={{position:"relative"}} onMouseEnter={()=>setDropOpen(true)} onMouseLeave={()=>setDropOpen(false)}>
                <button style={{
                  display:"flex",alignItems:"center",gap:5,
                  padding:"8px 14px",fontSize:11,fontWeight:600,letterSpacing:".08em",textTransform:"uppercase",
                  border:"none",borderRadius:99,cursor:"pointer",transition:"all .25s",
                  background:dropOpen?"var(--fo)":"transparent",
                  color:dropOpen?"#fff":"var(--ts)",
                }}>
                  Layanan
                  <span style={{fontSize:9,transition:"transform .25s",transform:dropOpen?"rotate(180deg)":"rotate(0)"}}>▾</span>
                </button>
                <div className={`drop-menu ${dropOpen?"open":""}`}>
                  <a href="/pengaduan" className="drop-item">
                    <span style={{fontSize:18}}>📢</span>
                    <div>
                      <div style={{fontWeight:700,color:"var(--tp)"}}>Pengaduan Warga</div>
                      <div style={{fontSize:10,color:"var(--tm)",fontWeight:500}}>Laporkan masalah kampung</div>
                    </div>
                  </a>
                  <a href="/voting" className="drop-item">
                    <span style={{fontSize:18}}>🗳️</span>
                    <div>
                      <div style={{fontWeight:700,color:"var(--tp)"}}>Voting</div>
                      <div style={{fontSize:10,color:"var(--tm)",fontWeight:500}}>Suara warga Ciburial</div>
                    </div>
                  </a>
                </div>
              </div>

              {/* Tombol AI — link ke halaman terpisah /ai */}
              <a href="/ai" style={{
                display:"flex",alignItems:"center",gap:6,
                padding:"7px 14px",
                fontSize:11,fontWeight:700,letterSpacing:".08em",textTransform:"uppercase",
                borderRadius:99,textDecoration:"none",
                background:"linear-gradient(135deg,#1a3320,#2d5a40)",
                color:"#7aad8a",
                border:"1px solid rgba(74,140,92,0.35)",
                marginLeft:4,
                transition:"all .25s",
                boxShadow:"0 0 12px rgba(74,140,92,0.15)",
              }}
                onMouseEnter={e=>{(e.currentTarget as HTMLAnchorElement).style.boxShadow="0 0 20px rgba(74,140,92,0.35)";(e.currentTarget as HTMLAnchorElement).style.color="#a8d4b4";}}
                onMouseLeave={e=>{(e.currentTarget as HTMLAnchorElement).style.boxShadow="0 0 12px rgba(74,140,92,0.15)";(e.currentTarget as HTMLAnchorElement).style.color="#7aad8a";}}
              >
                <span style={{fontSize:14}}>🤖</span>
                Ciburial AI
                <span style={{fontSize:9,padding:"2px 6px",background:"rgba(74,140,92,0.25)",borderRadius:99,letterSpacing:".06em"}}>BETA</span>
              </a>
            </div>

            {/* Mobile burger */}
            <button className="md:hidden" onClick={()=>setMobOpen(!mobOpen)} style={{background:"none",border:"none",cursor:"pointer",padding:8,display:"flex",flexDirection:"column",gap:5}}>
              <div style={{width:22,height:2,background:"var(--fo)",borderRadius:2}}/>
              <div style={{width:15,height:2,background:"var(--fo)",borderRadius:2}}/>
              <div style={{width:22,height:2,background:"var(--fo)",borderRadius:2}}/>
            </button>
          </div>

          <div className={`mob md:hidden ${mobOpen?"op":""}`} style={{background:"var(--cw)",borderTop:"1px solid var(--bo)",padding:"12px 28px 20px"}}>
            {TABS.map(t=>(
              <button key={t.key} onClick={()=>go(t.key)} style={{display:"block",width:"100%",textAlign:"left",padding:"11px 0",fontSize:12,fontWeight:600,letterSpacing:".08em",textTransform:"uppercase",background:"none",border:"none",color:tab===t.key?"var(--fo)":"var(--ts)",cursor:"pointer",borderBottom:"1px solid var(--bo)"}}>
                {t.label}
              </button>
            ))}
            {/* AI di mobile menu */}
            <a href="/ai" style={{display:"flex",alignItems:"center",gap:8,padding:"12px 0",fontSize:12,fontWeight:700,letterSpacing:".08em",textTransform:"uppercase",color:"#2d5a40",textDecoration:"none",borderBottom:"1px solid var(--bo)"}}>
              <span>🤖</span> Ciburial AI <span style={{fontSize:9,padding:"2px 6px",background:"rgba(45,90,64,0.1)",borderRadius:99,color:"#4a7c59"}}>BETA</span>
            </a>
            {/* Layanan Warga di mobile menu */}
            <div style={{padding:"8px 0 4px",borderBottom:"1px solid var(--bo)"}}>
              <div style={{fontSize:9,fontWeight:700,letterSpacing:".15em",textTransform:"uppercase",color:"var(--tm)",marginBottom:8}}>Layanan Warga</div>
              <a href="/pengaduan" style={{display:"flex",alignItems:"center",gap:10,padding:"10px 0",textDecoration:"none",borderBottom:"1px solid rgba(229,224,216,.5)"}}>
                <span style={{fontSize:18}}>📢</span>
                <div>
                  <div style={{fontSize:12,fontWeight:700,color:"var(--tp)",letterSpacing:".04em",textTransform:"uppercase"}}>Pengaduan Warga</div>
                  <div style={{fontSize:11,color:"var(--tm)"}}>Laporkan masalah kampung</div>
                </div>
              </a>
              <a href="/voting" style={{display:"flex",alignItems:"center",gap:10,padding:"10px 0",textDecoration:"none"}}>
                <span style={{fontSize:18}}>🗳️</span>
                <div>
                  <div style={{fontSize:12,fontWeight:700,color:"var(--tp)",letterSpacing:".04em",textTransform:"uppercase"}}>Voting</div>
                  <div style={{fontSize:11,color:"var(--tm)"}}>Suara warga Ciburial</div>
                </div>
              </a>
            </div>
          </div>
        </nav>

        {/* ════════════════════════════════════════════════
            TAB: TENTANG KAMPUNG
        ════════════════════════════════════════════════ */}
        {tab==="tentang"&&!checkout&&(
          <div className="pi">

            {/* HERO — mobile responsive fix */}
            <section className="hero-section" style={{position:"relative",overflow:"hidden"}}>
              <div style={{position:"absolute",top:0,right:0,width:"42%",height:"100%",background:"linear-gradient(135deg,var(--fo) 0%,var(--fm) 60%,var(--fl) 100%)",clipPath:"polygon(18% 0%,100% 0%,100% 100%,0% 100%)",opacity:.055,pointerEvents:"none"}}/>
              <div style={{position:"absolute",bottom:0,left:0,width:"100%",height:"35%",background:"linear-gradient(0deg,var(--cd) 0%,transparent 100%)",pointerEvents:"none"}}/>

              <div className="hero-content">
                {/* Tag lokasi */}
                <div className="h1" style={{display:"flex",alignItems:"center",gap:10,marginBottom:28}}>
                  <div style={{width:28,height:1,background:"var(--go)",flexShrink:0}}/>
                  <span style={{fontSize:10,fontWeight:700,letterSpacing:".2em",textTransform:"uppercase",color:"var(--go)"}}>Kp. Ciburial, Garut — Est. 2026</span>
                </div>

                <div style={{maxWidth:1320,margin:"0 auto",width:"100%"}}>
                  <div className="h2" style={{marginBottom:6}}>
                    <span style={{fontSize:12,fontWeight:600,letterSpacing:".14em",textTransform:"uppercase",color:"var(--em)"}}>Selamat Datang di</span>
                  </div>
                  <h1 className="fnt h3 hero-title" style={{fontWeight:300,lineHeight:.9,color:"var(--fo)",letterSpacing:"-.03em",marginBottom:6}}>Ciburial</h1>
                  <h2 className="fnt h4 hero-sub" style={{fontWeight:600,fontStyle:"italic",color:"var(--go)",letterSpacing:"-.02em",marginBottom:10}}>Eco-Digital Village</h2>
                  <div className="h5" style={{marginBottom:24}}>
                    <p className="fnt" style={{fontSize:"clamp(13px,2vw,18px)",fontWeight:300,fontStyle:"italic",color:"var(--em)",letterSpacing:".02em"}}>
                      Inovasi Desa Mandiri Berbasis Kearifan Lokal dan Teknologi Masa Depan
                    </p>
                  </div>
                  <div className="h5" style={{display:"flex",flexWrap:"wrap",gap:10}}>
                    <p style={{maxWidth:480,fontSize:15,fontWeight:400,lineHeight:1.8,color:"var(--ts)",marginBottom:12}}>
                      Memutus rantai ketertinggalan dengan digitalisasi hasil bumi, ekosistem sirkular, dan generasi muda yang melek teknologi — tanpa meninggalkan identitas kampung halaman.
                    </p>
                    <div style={{display:"flex",gap:8,flexWrap:"wrap"}}>
                      {["🌱 Pertanian Organik","🐄 Peternakan Modern","🎋 Kerajinan Bambu","💡 Smart PJU","♻️ Eco-Waste","📚 Learning Hub","🏛️ Balai Warga"].map(tag=>(
                        <span key={tag} style={{padding:"6px 13px",fontSize:11,fontWeight:600,border:"1px solid var(--bo)",borderRadius:99,color:"var(--ts)",background:"var(--cw)"}}>{tag}</span>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            </section>

            {/* MARQUEE */}
            <div style={{background:"var(--fo)",overflow:"hidden",padding:"12px 0"}}>
              <div className="mq" style={{display:"flex",whiteSpace:"nowrap",width:"max-content"}}>
                {[...Array(4)].map((_,i)=>(
                  <span key={i} style={{display:"flex",alignItems:"center",gap:26,padding:"0 26px",color:"rgba(255,255,255,.38)",fontSize:10,fontWeight:700,letterSpacing:".2em",textTransform:"uppercase"}}>
                    {["Mandiri","Berkelanjutan","Inovatif","Transparan","Eco-Digital","Gotong Royong","Quantum Leap"].map((w,j)=>(
                      <span key={j}>{w}{j<6&&<span style={{color:"var(--gl)",margin:"0 12px"}}>✦</span>}</span>
                    ))}
                  </span>
                ))}
              </div>
            </div>

            {/* STATS */}
            <section style={{background:"var(--cw)",padding:"68px 32px"}}>
              <div style={{maxWidth:1320,margin:"0 auto",display:"grid",gridTemplateColumns:"repeat(auto-fit,minmax(130px,1fr))",gap:2}}>
                {[
                  {v:"450",    l:"Jiwa",      s:"Total Populasi"},
                  {v:"3",      l:"RT",        s:"Rukun Tetangga"},
                  {v:"55%",    l:"Pemuda",    s:"Gen. Penerus"},
                  {v:"5",      l:"Divisi",    s:"Tim Lapangan"},
                  {v:"7",      l:"Program",   s:"Unggulan"},
                  {v:"250jt",  l:"Target",    s:"RAB Global"},
                ].map((s,i)=>(
                  <div key={i} className={`rv d${i+1}`} style={{padding:"40px 18px",textAlign:"center",borderRight:i<5?"1px solid var(--bo)":"none"}}>
                    <div className="fnt" style={{fontSize:"clamp(30px,4vw,56px)",fontWeight:300,color:"var(--fo)",lineHeight:1}}>{s.v}</div>
                    <div style={{fontSize:14,fontWeight:600,color:"var(--ts)",marginTop:4,marginBottom:5}}>{s.l}</div>
                    <div style={{fontSize:9,fontWeight:700,letterSpacing:".12em",textTransform:"uppercase",color:"var(--tm)"}}>{s.s}</div>
                  </div>
                ))}
              </div>
            </section>

            {/* VISI MISI */}
            <section style={{padding:"104px 32px",background:"var(--cr)"}}>
              <div style={{maxWidth:1320,margin:"0 auto",display:"flex",flexWrap:"wrap",gap:52,alignItems:"flex-start"}}>
                <div className="rv" style={{flex:"0 0 270px"}}>
                  <div className="dl"/>
                  <h2 className="fnt" style={{fontSize:"clamp(30px,4vw,50px)",fontWeight:300,color:"var(--fo)",lineHeight:1.1,letterSpacing:"-.02em",marginBottom:16}}>Visi &<br/>Misi Kami</h2>
                  <p style={{fontSize:14,lineHeight:1.8,color:"var(--ts)",marginBottom:20}}>
                    Empat pilar yang menjadi cetak biru (<em>blueprint</em>) peradaban desa modern Ciburial — makmur, mandiri, tangguh, dan melek teknologi.
                  </p>
                </div>
                <div style={{flex:1,minWidth:250,display:"flex",flexDirection:"column",gap:8}}>
                  {[
                    {no:"01",icon:"💡",t:"Infrastruktur Cerdas",d:"Balai Serba Guna berkonsep hijau, Smart PJU, Jaringan CCTV, dan Internet Mandiri (Wi-Fi Kampung)."},
                    {no:"02",icon:"📚",t:"SDM Unggul",d:"Laboratorium Komputer & Perpustakaan sebagai inkubator pemuda Ciburial yang melek teknologi."},
                    {no:"03",icon:"🌱",t:"Ekonomi Sirkular & Smart Farming",d:"Pasar lokal untuk bambu, sayuran organik, peternakan terpadu, dan produk daur ulang limbah."},
                    {no:"04",icon:"📊",t:"Tata Kelola Transparan",d:"Aliran dana kemakmuran terbuka secara real-time, dari fiat konvensional hingga aset kripto (Web3)."},
                  ].map((v,i)=>(
                    <div key={i} className={`rv ch d${i+1}`}
                      style={{padding:"22px 26px",background:"var(--cw)",borderRadius:15,border:"1px solid var(--bo)",display:"flex",gap:16,alignItems:"flex-start"}}
                      onMouseEnter={e=>(e.currentTarget.style.background="var(--cd)")}
                      onMouseLeave={e=>(e.currentTarget.style.background="var(--cw)")}
                    >
                      <span className="fnt" style={{fontSize:12,fontWeight:700,color:"var(--go)",minWidth:22,paddingTop:2}}>{v.no}</span>
                      <span style={{fontSize:22}}>{v.icon}</span>
                      <div>
                        <div style={{fontSize:15,fontWeight:700,color:"var(--tp)",marginBottom:4}}>{v.t}</div>
                        <div style={{fontSize:13,lineHeight:1.7,color:"var(--ts)"}}>{v.d}</div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </section>

            {/* DEMOGRAFI */}
            <section style={{padding:"104px 32px",background:"var(--fo)"}}>
              <div style={{maxWidth:1320,margin:"0 auto"}}>
                <div className="rv" style={{textAlign:"center",marginBottom:56}}>
                  <div className="dl dlc"/>
                  <h2 className="fnt" style={{fontSize:"clamp(30px,5vw,54px)",fontWeight:300,color:"var(--cr)",letterSpacing:"-.02em"}}>Keluarga Besar Ciburial</h2>
                  <p style={{color:"rgba(250,248,243,.45)",fontSize:14,marginTop:10,maxWidth:400,margin:"10px auto 0"}}>Pemuda mendominasi — 55% dari 450 jiwa. Mereka adalah modal utama quantum leap Ciburial.</p>
                </div>
                <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fit,minmax(230px,1fr))",gap:18}}>
                  {[{l:"Pemuda (Penerus)",pct:55,c:"var(--go)"},{l:"Lansia (Sesepuh)",pct:45,c:"rgba(250,248,243,.28)"}].map((item,i)=>(
                    <div key={i} className={`rv pgw d${i+1}`} style={{padding:"32px",background:"rgba(255,255,255,.05)",borderRadius:18,border:"1px solid rgba(255,255,255,.08)"}}>
                      <div style={{display:"flex",justifyContent:"space-between",marginBottom:16}}>
                        <span style={{fontSize:13,fontWeight:600,color:"rgba(250,248,243,.62)"}}>{item.l}</span>
                        <span className="fnt" style={{fontSize:30,fontWeight:300,color:"var(--cr)",lineHeight:1}}>{item.pct}%</span>
                      </div>
                      <div className="pg"><div className="pgf" style={{background:item.c,width:`${item.pct}%`}}/></div>
                    </div>
                  ))}
                </div>
              </div>
            </section>

            {/* PAGUYUBAN + DIVISI */}
            <section style={{padding:"104px 32px",background:"var(--cr)"}}>
              <div style={{maxWidth:1320,margin:"0 auto"}}>
                <div className="rv" style={{textAlign:"center",marginBottom:60}}>
                  <div className="dl dlc"/>
                  <h2 className="fnt" style={{fontSize:"clamp(30px,5vw,54px)",fontWeight:300,color:"var(--fo)",letterSpacing:"-.02em"}}>Struktur Kepengurusan</h2>
                  <p style={{color:"var(--ts)",fontSize:14,marginTop:10}}>Gerakan ini digerakkan oleh tenaga muda profesional dari desa sendiri.</p>
                </div>

                {/* Dewan Pelindung */}
                <div className="rv" style={{marginBottom:12}}>
                  <div style={{fontSize:11,fontWeight:700,letterSpacing:".14em",textTransform:"uppercase",color:"var(--go)",marginBottom:14}}>A. Dewan Pelindung & Penasihat</div>
                  <div style={{display:"flex",gap:12,flexWrap:"wrap"}}>
                    {dwnPelindung.map((item,i)=>(
                      <div key={i} className="ch" style={{flex:"0 0 auto",minWidth:150,background:"var(--cw)",border:"1px solid var(--bo)",borderRadius:16,padding:"18px 16px 14px",textAlign:"center"}}>
                        <div style={{width:44,height:44,borderRadius:"50%",background:"var(--cd)",margin:"0 auto 10px",display:"flex",alignItems:"center",justifyContent:"center",fontSize:20,border:"2px solid var(--bo)"}}>{item.icon}</div>
                        <div style={{fontSize:13,fontWeight:700,color:"var(--tp)",marginBottom:3}}>{item.name}</div>
                        <div style={{fontSize:9,fontWeight:700,letterSpacing:".09em",textTransform:"uppercase",color:"var(--go)"}}>{item.role}</div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* DKM + Tim Eksekutif */}
                <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fit,minmax(260px,1fr))",gap:14,marginBottom:12}}>
                  <div className="rv d2" style={{background:"var(--cw)",border:"1px solid var(--bo)",borderRadius:20,padding:"28px"}}>
                    <div style={{fontSize:11,fontWeight:700,letterSpacing:".14em",textTransform:"uppercase",color:"var(--go)",marginBottom:20}}>B. Dewan Pengawas Kas</div>
                    {dwnPengawas.map((item,i)=>(
                      <div key={i} style={{display:"flex",alignItems:"center",gap:12,padding:"14px",background:"var(--cd)",borderRadius:12}}>
                        <span style={{fontSize:24}}>{item.icon}</span>
                        <div>
                          <div style={{fontSize:14,fontWeight:700,color:"var(--tp)"}}>{item.name}</div>
                          <div style={{fontSize:10,fontWeight:700,color:"var(--go)",textTransform:"uppercase",letterSpacing:".07em"}}>{item.role}</div>
                        </div>
                      </div>
                    ))}
                  </div>
                  <div className="rv d3" style={{background:"var(--cw)",border:"1px solid var(--bo)",borderRadius:20,padding:"28px"}}>
                    <div style={{fontSize:11,fontWeight:700,letterSpacing:".14em",textTransform:"uppercase",color:"var(--go)",marginBottom:20}}>C. Tim Eksekutif Lapangan</div>
                    <div style={{display:"flex",flexDirection:"column",gap:10}}>
                      {timEksekutif.map((item,i)=>(
                        <div key={i} style={{display:"flex",alignItems:"center",justifyContent:"space-between",padding:"11px 14px",background:"var(--cd)",borderRadius:10}}>
                          <div style={{display:"flex",alignItems:"center",gap:10}}>
                            <span style={{fontSize:18}}>{item.icon}</span>
                            <span style={{fontSize:13,fontWeight:700,color:"var(--tp)",fontStyle:item.name.includes("—")?"italic":"normal"}}>{item.name}</span>
                          </div>
                          <span style={{fontSize:9,fontWeight:700,color:"var(--tm)",textTransform:"uppercase",letterSpacing:".07em",background:"var(--cw)",padding:"3px 9px",borderRadius:99}}>{item.role}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>

                {/* 5 Divisi */}
                <div className="rv" style={{marginTop:8}}>
                  <div style={{fontSize:11,fontWeight:700,letterSpacing:".14em",textTransform:"uppercase",color:"var(--go)",marginBottom:14}}>D. 5 Divisi Operasional (Garda Depan)</div>
                  <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fit,minmax(190px,1fr))",gap:12}}>
                    {divisi.map((d,i)=>(
                      <div key={i} className={`div-card d${i+1}`} style={{background:"var(--cw)",border:"1px solid var(--bo)",borderRadius:16,padding:"20px 16px"}}>
                        <div style={{fontSize:28,marginBottom:10}}>{d.icon}</div>
                        <div style={{fontSize:12,fontWeight:800,color:"var(--fo)",marginBottom:3,textTransform:"uppercase",letterSpacing:".04em"}}>{d.nama}</div>
                        <div style={{fontSize:11,fontWeight:600,color:"var(--ts)",marginBottom:8}}>{d.full}</div>
                        <div style={{fontSize:11,lineHeight:1.6,color:"var(--tm)"}}>{d.tugas}</div>
                        <div style={{marginTop:12,fontSize:10,fontWeight:700,color:"var(--tm)",fontStyle:"italic"}}>Kepala: — Hasil Voting —</div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </section>

            {/* DONASI SPLIT */}
            <section style={{padding:"0 32px 104px"}}>
              <div style={{maxWidth:1320,margin:"0 auto"}}>
                <div className="rv" style={{borderRadius:28,overflow:"hidden",display:"grid",gridTemplateColumns:"repeat(auto-fit,minmax(250px,1fr))"}}>
                  <div style={{background:"var(--fo)",padding:"60px 52px"}}>
                    <div className="dl"/>
                    <h2 className="fnt" style={{fontSize:36,fontWeight:300,color:"var(--cr)",lineHeight:1.15,letterSpacing:"-.02em",marginBottom:14}}>Donasi<br/>Kemakmuran<br/>Kampung</h2>
                    <p style={{fontSize:13,lineHeight:1.85,color:"rgba(250,248,243,.5)",marginBottom:32}}>
                      Target RAB Global <strong style={{color:"var(--gl)"}}>Rp 250.000.000</strong>.<br/>
                      Dukung Balai Warga, Smart Farming, Learning Hub, Smart PJU, dan Internet Desa.
                    </p>
                    <div style={{display:"flex",flexDirection:"column",gap:10,marginBottom:22}}>
                      {[{icon:"📱",l:"QRIS",s:"Scan & Bayar Instan"},{icon:"🏦",l:"Transfer Bank",s:"Rekening Resmi DKM"},{icon:"🌐",l:"Crypto / Web3",s:"EVM-Compatible Wallet"}].map((m,i)=>(
                        <div key={i} style={{display:"flex",alignItems:"center",gap:14,padding:"13px 18px",background:"rgba(255,255,255,.06)",borderRadius:12,border:"1px solid rgba(255,255,255,.09)",cursor:"pointer",transition:"background .2s"}}
                          onMouseEnter={e=>(e.currentTarget.style.background="rgba(255,255,255,.11)")}
                          onMouseLeave={e=>(e.currentTarget.style.background="rgba(255,255,255,.06)")}
                        >
                          <span style={{fontSize:22}}>{m.icon}</span>
                          <div>
                            <div style={{fontSize:13,fontWeight:700,color:"var(--cr)"}}>{m.l}</div>
                            <div style={{fontSize:11,color:"rgba(250,248,243,.38)"}}>{m.s}</div>
                          </div>
                        </div>
                      ))}
                    </div>
                    <button onClick={()=>go("transparansi")} style={{padding:"10px 20px",borderRadius:99,fontSize:11,fontWeight:700,letterSpacing:".09em",textTransform:"uppercase",border:"1px solid rgba(255,255,255,.18)",background:"transparent",color:"rgba(250,248,243,.55)",cursor:"pointer",transition:"all .2s"}}
                      onMouseEnter={e=>{(e.currentTarget as HTMLButtonElement).style.background="rgba(255,255,255,.08)";(e.currentTarget as HTMLButtonElement).style.color="var(--cr)";}}
                      onMouseLeave={e=>{(e.currentTarget as HTMLButtonElement).style.background="transparent";(e.currentTarget as HTMLButtonElement).style.color="rgba(250,248,243,.55)";}}
                    >
                      Lihat Transparansi Dana →
                    </button>
                  </div>
                  <div style={{background:"var(--ea)",padding:"60px 52px",display:"flex",flexDirection:"column",justifyContent:"center"}}>
                    <div style={{fontSize:10,fontWeight:700,letterSpacing:".2em",textTransform:"uppercase",color:"var(--go)",marginBottom:20}}>Doa untuk Donatur</div>
                    <p dir="rtl" className="fnt" style={{fontSize:"clamp(18px,2.8vw,27px)",lineHeight:1.9,color:"var(--cr)",fontWeight:400,marginBottom:22}}>
                      رَبَّنَا آتِنَا فِي الدُّنْيَا حَسَنَةً وَفِي الْآخِرَةِ حَسَنَةً وَقِنَا عَذَابَ النَّارِ
                    </p>
                    <p style={{fontSize:13,fontStyle:"italic",lineHeight:1.85,color:"rgba(250,248,243,.48)",marginBottom:14}}>
                      "Ya Tuhan kami, berilah mereka kebaikan di dunia dan di akhirat, serta lindungilah dari siksa neraka."
                    </p>
                    <span style={{fontSize:10,fontWeight:700,letterSpacing:".1em",textTransform:"uppercase",color:"var(--gl)",opacity:.65}}>QS. Al-Baqarah: 201</span>
                  </div>
                </div>
              </div>
            </section>
          </div>
        )}

        {/* ════════════════════════════════════════════════
            TAB: KEGIATAN KAMPUNG
        ════════════════════════════════════════════════ */}
        {tab==="kegiatan"&&(
          <div className="pi" style={{paddingTop:106,paddingBottom:106}}>
            <div style={{maxWidth:1320,margin:"0 auto",padding:"0 28px"}}>

              <div className="rv" style={{marginBottom:44,display:"flex",flexWrap:"wrap",alignItems:"flex-end",justifyContent:"space-between",gap:20}}>
                <div>
                  <div className="dl"/>
                  <h1 className="fnt" style={{fontSize:"clamp(40px,7vw,84px)",fontWeight:300,color:"var(--fo)",lineHeight:.95,letterSpacing:"-.03em"}}>Kegiatan<br/><em>Kampung</em></h1>
                </div>
                <p style={{maxWidth:320,fontSize:14,lineHeight:1.8,color:"var(--ts)"}}>Setiap momen yang menghidupkan Ciburial — dari perayaan hingga kemajuan nyata pembangunan desa.</p>
              </div>

              {/* Filter kategori */}
              <div className="rv" style={{display:"flex",gap:8,flexWrap:"wrap",marginBottom:36}}>
                {[{k:"semua",l:"✦ Semua"},...Object.entries(KAT_CFG).map(([k,v])=>({k,l:v.label}))].map(item=>(
                  <button key={item.k} onClick={()=>setFKat(item.k)} style={{padding:"7px 16px",fontSize:11,fontWeight:700,letterSpacing:".06em",border:"1px solid var(--bo)",borderRadius:99,cursor:"pointer",transition:"all .2s",background:fKat===item.k?"var(--fo)":"var(--cw)",color:fKat===item.k?"#fff":"var(--ts)"}}>
                    {item.l}
                  </button>
                ))}
              </div>

              {dataLoad&&(
                <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fill,minmax(270px,1fr))",gap:18}}>
                  {[1,2,3].map(i=><div key={i} className="sk" style={{height:220,borderRadius:18}}/>)}
                </div>
              )}

              {!dataLoad&&(
                kegFil.length===0?(
                  <div style={{textAlign:"center",padding:"72px 20px",color:"var(--tm)"}}>
                    <div style={{fontSize:44,marginBottom:14}}>📅</div>
                    <div style={{fontSize:16,fontWeight:600}}>Belum ada kegiatan di kategori ini.</div>
                    <div style={{fontSize:13,marginTop:8}}>Admin dapat menambahkan melalui panel admin.</div>
                  </div>
                ):(
                  <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fill,minmax(270px,1fr))",gap:18}}>
                    {kegFil.map((k,i)=>{
                      const kat=KAT_CFG[k.kategori]||{label:"📌 Lainnya",bg:"rgba(90,74,64,.08)",color:"#5A4A40"};
                      const d=new Date(k.tanggal);
                      return(
                        <div key={k.id} className={`rv kc d${(i%3)+1}`} style={{background:"var(--cw)",border:"1px solid var(--bo)",borderRadius:18,overflow:"hidden"}}>
                          {k.foto?(
                            <img src={k.foto} alt={k.judul} style={{width:"100%",aspectRatio:"16/9",objectFit:"cover"}}/>
                          ):(
                            <div style={{height:5,background:kat.color}}/>
                          )}
                          <div style={{padding:"20px 22px"}}>
                            <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start",marginBottom:11}}>
                              <span style={{fontSize:10,fontWeight:700,letterSpacing:".06em",padding:"4px 11px",borderRadius:99,background:kat.bg,color:kat.color}}>{kat.label}</span>
                              <div style={{textAlign:"right"}}>
                                <div className="fnt" style={{fontSize:26,fontWeight:300,color:"var(--fo)",lineHeight:1}}>{d.getDate()}</div>
                                <div style={{fontSize:9,fontWeight:700,letterSpacing:".1em",textTransform:"uppercase",color:"var(--tm)"}}>
                                  {d.toLocaleDateString("id-ID",{month:"short"})} {d.getFullYear()}
                                </div>
                              </div>
                            </div>
                            <h3 style={{fontSize:16,fontWeight:700,color:"var(--tp)",marginBottom:7,lineHeight:1.3}}>{k.judul}</h3>
                            {k.deskripsi&&<p style={{fontSize:12,lineHeight:1.7,color:"var(--ts)"}}>{k.deskripsi}</p>}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )
              )}
            </div>
          </div>
        )}

        {/* ════════════════════════════════════════════════
            TAB: PROPOSAL
        ════════════════════════════════════════════════ */}
        {tab==="proposal"&&(
          <div className="pi" style={{paddingTop:106,paddingBottom:106}}>
            <div style={{maxWidth:900,margin:"0 auto",padding:"0 28px"}}>

              {/* Header */}
              <div className="rv" style={{textAlign:"center",marginBottom:48}}>
                <div className="dl dlc"/>
                <div style={{fontSize:10,fontWeight:700,letterSpacing:".2em",textTransform:"uppercase",color:"var(--go)",marginBottom:14}}>Dokumen Resmi — No. 01/CBM/III/2026</div>
                <h1 className="fnt" style={{fontSize:"clamp(30px,5vw,58px)",fontWeight:300,color:"var(--fo)",lineHeight:1.05,letterSpacing:"-.025em",marginBottom:10}}>
                  Proposal Program<br/><em>Kemakmuran Kampung</em>
                </h1>
                <p className="fnt" style={{fontSize:"clamp(14px,2vw,18px)",fontStyle:"italic",color:"var(--em)",marginBottom:14}}>
                  Inovasi Desa Mandiri Berbasis Kearifan Lokal dan Teknologi Masa Depan
                </p>
                <p style={{fontSize:13,color:"var(--ts)",lineHeight:1.7,maxWidth:480,margin:"0 auto"}}>
                  Diajukan oleh Paguyuban Warga & Pemuda Ciburial Makers<br/>
                  Kp. Ciburial, Desa Hanjuang, Kec. Bungbulang, Kab. Garut 44165
                </p>
              </div>

              {/* Info strip */}
              <div className="rv" style={{display:"flex",flexWrap:"wrap",gap:10,justifyContent:"center",marginBottom:44}}>
                {[{icon:"🌐",l:"ciburial-eco-digital.vercel.app"},{icon:"📧",l:"ciburial.smarthub@gmail.com"},{icon:"📍",l:"Garut, Jawa Barat 44165"}].map((item,i)=>(
                  <div key={i} style={{display:"flex",alignItems:"center",gap:8,padding:"9px 18px",background:"var(--cw)",border:"1px solid var(--bo)",borderRadius:99}}>
                    <span>{item.icon}</span><span style={{fontSize:12,fontWeight:600,color:"var(--ts)"}}>{item.l}</span>
                  </div>
                ))}
              </div>

              {/* Accordion sections */}
              {[
                {
                  title:"Surat Pengantar",icon:"📜",
                  content:(
                    <div style={{fontSize:14,lineHeight:1.9,color:"var(--ts)"}}>
                      <div style={{padding:"16px 20px",background:"var(--cr)",borderRadius:12,border:"1px solid var(--bo)",marginBottom:20}}>
                        <div style={{fontSize:11,fontWeight:700,color:"var(--tm)",letterSpacing:".08em",marginBottom:4}}>Nomor: 01/CBM/III/2026 &nbsp;|&nbsp; Hal: Permohonan Dukungan & Kolaborasi</div>
                        <div style={{fontSize:11,color:"var(--tm)"}}>Lampiran: 1 (Satu) Berkas Proposal</div>
                      </div>
                      <p style={{marginBottom:14}}>Kepada Yth, <strong>[Nama Instansi / Perusahaan / Calon Donatur]</strong> di Tempat. Dengan hormat,</p>
                      <p style={{marginBottom:14}}>Puji syukur ke hadirat Tuhan Yang Maha Esa atas segala limpahan rahmat-Nya. Bersama surat ini, kami dari Paguyuban Warga & Pemuda Ciburial Makers bermaksud menyampaikan proposal program <strong>"Ciburial Eco-Digital Village"</strong>.</p>
                      <p style={{marginBottom:14}}>Program ini adalah inisiatif swadaya masyarakat akar rumput untuk membangun ekosistem desa yang mandiri, cerdas, dan ramah lingkungan. Mengawinkan kekayaan alam organik dengan literasi teknologi digital untuk menciptakan ketahanan pangan, keamanan lingkungan, dan peningkatan SDM generasi muda.</p>
                      <p style={{marginBottom:28}}>Mengingat besarnya skala pergerakan ini, kami membuka ruang kolaborasi dan memohon dukungan dari Bapak/Ibu/Saudara guna merealisasikan cetak biru kemakmuran desa ini.</p>
                      <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fit,minmax(180px,1fr))",gap:12}}>
                        {[
                          {role:"Ketua Pemuda Ciburial Makers",name:"— Soon —",label:"Tanda Tangan & Stempel"},
                          {role:"Ketua DKM Ciburial",name:"Bpk. Pupu Apipudin",label:"Mengetahui / Menyetujui"},
                          {role:"Ketua RW Kp. Ciburial",name:"Bpk. Enang",label:"Mengetahui / Menyetujui"},
                        ].map((s,i)=>(
                          <div key={i} style={{padding:"16px",background:"var(--cr)",borderRadius:12,border:"1px solid var(--bo)",textAlign:"center"}}>
                            <div style={{fontSize:10,fontWeight:700,color:"var(--tm)",letterSpacing:".07em",textTransform:"uppercase",marginBottom:40}}>{s.label}</div>
                            <div style={{borderTop:"1px solid var(--bo)",paddingTop:12}}>
                              <div style={{fontSize:13,fontWeight:700,color:"var(--tp)"}}>{s.name}</div>
                              <div style={{fontSize:11,color:"var(--go)",fontWeight:600,marginTop:3}}>{s.role}</div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )
                },
                {
                  title:"Bab I — Latar Belakang",icon:"📖",
                  content:(
                    <div style={{fontSize:14,lineHeight:1.9,color:"var(--ts)"}}>
                      <p style={{marginBottom:16}}>Dunia bergerak sangat cepat menuju era digital, namun masyarakat desa seringkali hanya menjadi penonton. Di Kampung Ciburial, kami menolak tertinggal. Kami memiliki kekayaan alam yang melimpah — pertanian organik, peternakan komunal, dan mahakarya bambu — namun potensinya kerap tidak maksimal akibat minimnya infrastruktur dan panjangnya rantai distribusi.</p>
                      <p style={{marginBottom:16}}>Oleh karena itu, lahir sebuah inisiatif raksasa bernama <strong>"Ciburial Eco-Digital Village"</strong>. Ini bukan sekadar program pemasangan internet atau lampu jalan. Ini adalah <em>lompatan besar (quantum leap)</em> untuk mengawinkan kearifan lokal dengan teknologi masa depan.</p>
                      <p>Kami ingin memutus rantai ketertinggalan dengan mendigitalisasi hasil bumi warga secara langsung tanpa tengkulak, membangun ekosistem sirkular di mana limbah diolah menjadi pupuk dan material infrastruktur yang berharga, serta membekali anak-anak desa dengan Learning Hub. Tujuannya: agar generasi muda Ciburial mampu bersaing secara global tanpa harus meninggalkan identitas dan kampung halamannya.</p>
                    </div>
                  )
                },
                {
                  title:"Bab II — Tujuan Program",icon:"🎯",
                  content:(
                    <div style={{display:"flex",flexDirection:"column",gap:12}}>
                      {[
                        {n:"01",t:"Kemakmuran Masjid & Warga",d:"Membantu kas DKM agar kegiatan keagamaan dan sosial warga berjalan optimal."},
                        {n:"02",t:"Keamanan & Kenyamanan Lingkungan",d:"Menerangi jalan desa dengan Smart PJU dan mewujudkan Pos Ronda Digital berbasis pantauan CCTV."},
                        {n:"03",t:"Peningkatan SDM Generasi Muda",d:"Menyediakan fasilitas belajar interaktif untuk mencetak generasi penerus yang kompeten dan melek teknologi."},
                        {n:"04",t:"Kemandirian Ekonomi & Ketahanan Pangan",d:"Sistem perdagangan sirkular dari warga untuk warga, memadukan pertanian dan peternakan modern dengan pemesanan digital."},
                      ].map((item,i)=>(
                        <div key={i} style={{display:"flex",gap:14,padding:"16px 18px",background:"var(--cr)",borderRadius:12,border:"1px solid var(--bo)"}}>
                          <span className="fnt" style={{fontSize:12,fontWeight:700,color:"var(--go)",minWidth:22}}>{item.n}</span>
                          <div>
                            <div style={{fontSize:14,fontWeight:700,color:"var(--tp)",marginBottom:4}}>{item.t}</div>
                            <div style={{fontSize:13,lineHeight:1.7,color:"var(--ts)"}}>{item.d}</div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )
                },
                {
                  title:"Bab III — Visi & Misi",icon:"💡",
                  content:(
                    <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fit,minmax(200px,1fr))",gap:12}}>
                      {[
                        {icon:"💡",t:"Infrastruktur Cerdas",d:"Balai Serba Guna berkonsep hijau, Smart PJU, Jaringan CCTV, dan Internet Mandiri."},
                        {icon:"📚",t:"SDM Unggul",d:"Lab Komputer & Perpustakaan sebagai inkubator pemuda Ciburial."},
                        {icon:"🌱",t:"Ekonomi Sirkular & Smart Farming",d:"Marketplace lokal untuk bambu, sayuran organik, peternakan, dan produk daur ulang."},
                        {icon:"📊",t:"Tata Kelola Transparan",d:"Dana kemakmuran terbuka real-time, dari fiat konvensional hingga aset kripto (Web3)."},
                      ].map((v,i)=>(
                        <div key={i} style={{padding:"18px",background:"var(--cr)",borderRadius:13,border:"1px solid var(--bo)"}}>
                          <div style={{fontSize:26,marginBottom:10}}>{v.icon}</div>
                          <div style={{fontSize:13,fontWeight:700,color:"var(--tp)",marginBottom:6}}>{v.t}</div>
                          <div style={{fontSize:12,lineHeight:1.7,color:"var(--ts)"}}>{v.d}</div>
                        </div>
                      ))}
                    </div>
                  )
                },
                {
                  title:"Bab IV — Program Kerja Unggulan (5 Program)",icon:"🛠️",
                  content:(
                    <div style={{display:"flex",flexDirection:"column",gap:10}}>
                      {[
                        {icon:"🏛️",t:"Ciburial Learning Hub & Balai Warga",d:"Balai Serba Guna berkonsep ramah lingkungan (bambu & baja ringan). Berfungsi sebagai pusat interaksi warga, perpustakaan desa, dan laboratorium komputer."},
                        {icon:"🌾",t:"Smart Farming & Circular Eco-Waste",d:"Integrasi pertanian sayur organik dan peternakan modern komunal. Limbah kotoran hewan → pupuk kompos, plastik → material infrastruktur daur ulang."},
                        {icon:"🔦",t:"Instalasi Smart PJU & Pos Ronda Digital",d:"Lampu jalan cerdas bertenaga surya dan jaringan CCTV untuk sistem keamanan lingkungan."},
                        {icon:"🛒",t:"Ciburial Local Commerce (Web & App)",d:"Marketplace desa untuk memasarkan karya bambu, hasil panen, dan produk peternakan dengan sistem delivery."},
                        {icon:"💰",t:"Digitalisasi Kas Donasi (Fiat & Crypto)",d:"Sentralisasi dana melalui QRIS, Rekening Bank, dan Crypto Wallet (EVM Compatible) untuk menjangkau filantropis global."},
                      ].map((p,i)=>(
                        <div key={i} style={{display:"flex",gap:14,padding:"15px 18px",background:"var(--cr)",borderRadius:12,border:"1px solid var(--bo)",alignItems:"flex-start"}}>
                          <span style={{fontSize:22,minWidth:28}}>{p.icon}</span>
                          <div>
                            <div style={{fontSize:14,fontWeight:700,color:"var(--tp)",marginBottom:3}}>{p.t}</div>
                            <div style={{fontSize:13,lineHeight:1.7,color:"var(--ts)"}}>{p.d}</div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )
                },
                {
                  title:"Bab V — Tata Kelola & Struktur Kepengurusan",icon:"🏛️",
                  content:(
                    <div style={{display:"flex",flexDirection:"column",gap:16}}>
                      {[
                        {group:"A. Dewan Pelindung & Penasihat",items:[
                          "Tokoh Agama: Ust. Kurniadin",
                          "Kepala Kewilayahan: Bpk. Enang (Ketua RW)",
                          "Koordinator: Ketua RT 01 (Sarip Hidayat), RT 02 (Oneng), RT 03 (Mumun)",
                        ]},
                        {group:"B. Dewan Pengawas Kas & Donasi",items:[
                          "Pengelola Dana DKM: Bpk. Pupu Apipudin",
                        ]},
                        {group:"C. Tim Eksekutif Lapangan (Ciburial Makers)",items:[
                          "Ketua Pelaksana (PM): Ubay Rahmat H.",
                          "Sekretaris & Administrasi: [Hasil Voting]",
                          "Bendahara Program: [Hasil Voting]",
                        ]},
                        {group:"D. 5 Divisi Operasional",items:[
                          "🏗️ Green Build — Infrastruktur & Konstruksi Hijau",
                          "💻 Digital Hub — IT, Jaringan & Web3",
                          "🌾 Eco-Waste & Farming — Smart Farming & Lingkungan",
                          "🛒 Local Commerce — Ekonomi Kreatif & UMKM",
                          "📢 Public Relations — Humas & Transparansi Publik",
                        ]},
                      ].map((s,i)=>(
                        <div key={i}>
                          <div style={{fontSize:12,fontWeight:700,color:"var(--go)",letterSpacing:".07em",textTransform:"uppercase",marginBottom:10}}>{s.group}</div>
                          <div style={{display:"flex",flexDirection:"column",gap:6}}>
                            {s.items.map((item,j)=>(
                              <div key={j} style={{padding:"10px 16px",background:"var(--cr)",borderRadius:10,border:"1px solid var(--bo)",fontSize:13,color:"var(--ts)"}}>{item}</div>
                            ))}
                          </div>
                        </div>
                      ))}
                    </div>
                  )
                },
                {
                  title:"Bab VI — RAB Global (Target Rp 250.000.000)",icon:"💰",
                  content:(
                    <div style={{display:"flex",flexDirection:"column",gap:10}}>
                      <p style={{fontSize:13,lineHeight:1.7,color:"var(--ts)",marginBottom:8,padding:"12px 16px",background:"rgba(184,148,63,.07)",borderRadius:10,border:"1px solid rgba(184,148,63,.18)"}}>
                        💡 <strong>Catatan:</strong> Seluruh pengerjaan fisik/instalasi bernilai Rp 0 karena dilakukan secara <strong>swadaya & gotong royong</strong>. Dana donasi digunakan untuk material saja.
                      </p>
                      {ALOKASI.map((item,i)=>{
                        const used=transaksi.filter(t=>t.tipe==="keluar"&&t.kategori===item.label).reduce((s,t)=>s+t.jumlah,0);
                        const pct=Math.min(100,(used/item.target)*100);
                        return(
                          <div key={i} style={{padding:"16px 20px",background:"var(--cr)",borderRadius:13,border:"1px solid var(--bo)"}}>
                            <div style={{display:"flex",justifyContent:"space-between",marginBottom:6,flexWrap:"wrap",gap:6}}>
                              <div style={{display:"flex",gap:10,alignItems:"center"}}>
                                <span style={{fontSize:20}}>{item.icon}</span>
                                <div>
                                  <div style={{fontSize:13,fontWeight:700,color:"var(--tp)"}}>{item.label}</div>
                                  <div style={{fontSize:11,color:"var(--tm)"}}>{item.desc}</div>
                                </div>
                              </div>
                              <span className="fnt" style={{fontSize:17,fontWeight:600,color:"var(--fo)"}}>{fRp(item.target)}</span>
                            </div>
                            <div className="pg" style={{marginBottom:5}}><div className="pgf" style={{background:item.color,width:`${pct}%`}}/></div>
                            <div style={{fontSize:11,color:"var(--tm)"}}>Terpakai: {fRp(used)} / Target {fRp(item.target)} ({Math.round(pct)}%)</div>
                          </div>
                        );
                      })}
                      <div style={{padding:"16px 22px",background:"var(--fo)",borderRadius:14,display:"flex",justifyContent:"space-between",flexWrap:"wrap",gap:8,marginTop:4}}>
                        <span style={{fontSize:13,fontWeight:700,color:"var(--cr)"}}>TOTAL ESTIMASI KEBUTUHAN</span>
                        <div style={{textAlign:"right"}}>
                          <span className="fnt" style={{fontSize:22,fontWeight:600,color:"var(--gl)"}}>Rp 250.000.000</span>
                          <div style={{fontSize:11,color:"rgba(250,248,243,.45)"}}>Dua Ratus Lima Puluh Juta Rupiah</div>
                        </div>
                      </div>
                    </div>
                  )
                },
                {
                  title:"Bab VII — Penyaluran Dana & Penutup",icon:"🙏",
                  content:(
                    <div>
                      <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fit,minmax(200px,1fr))",gap:12,marginBottom:24}}>
                        {[
                          {icon:"🏦",t:"Rekening Bank Resmi",sub:"Bank [Nama Bank]",detail:"No. Rek: [Masukkan No Rekening]\nA.n: [Nama Pemilik]"},
                          {icon:"📱",t:"QRIS Resmi",sub:"Scan & Bayar Instan",detail:"(Barcode QRIS akan disisipkan di sini)"},
                          {icon:"🌐",t:"Crypto / Web3",sub:"EVM Compatible Wallet",detail:"Wallet Address:\n[Masukkan Address]"},
                        ].map((m,i)=>(
                          <div key={i} style={{padding:"18px",background:"var(--fo)",borderRadius:14}}>
                            <div style={{fontSize:24,marginBottom:8}}>{m.icon}</div>
                            <div style={{fontSize:13,fontWeight:700,color:"var(--cr)",marginBottom:4}}>{m.t}</div>
                            <div style={{fontSize:11,color:"rgba(250,248,243,.5)"}}>{m.sub}</div>
                            <div style={{fontSize:11,color:"rgba(250,248,243,.35)",marginTop:6,whiteSpace:"pre-line"}}>{m.detail}</div>
                          </div>
                        ))}
                      </div>
                      <p style={{fontSize:14,lineHeight:1.9,color:"var(--ts)",marginBottom:24}}>
                        Setiap dukungan Anda adalah lentera nyata bagi jalan desa kami, buku dan ilmu bagi generasi muda kami, serta roda penggerak bagi kemakmuran warga Ciburial. Kami percaya, kemajuan teknologi akan membawa keberkahan jika disandingkan dengan kelestarian alam dan niat tulus bergotong royong.
                      </p>
                      <div style={{padding:"26px 32px",background:"var(--ea)",borderRadius:18}}>
                        <p dir="rtl" className="fnt" style={{fontSize:"clamp(16px,2.5vw,22px)",lineHeight:1.9,color:"var(--cr)",marginBottom:14}}>
                          رَبَّنَا آتِنَا فِي الدُّنْيَا حَسَنَةً وَفِي الْآخِرَةِ حَسَنَةً وَقِنَا عَذَابَ النَّارِ
                        </p>
                        <p style={{fontSize:13,fontStyle:"italic",color:"rgba(250,248,243,.55)",lineHeight:1.8}}>
                          "Ya Tuhan kami, berilah mereka kebaikan di dunia dan di akhirat, dan lindungilah dari siksa neraka."
                          <span style={{fontStyle:"normal",fontWeight:700,color:"var(--gl)"}}> — QS. Al-Baqarah: 201</span>
                        </p>
                      </div>
                      <div style={{marginTop:22,textAlign:"right"}}>
                        <div style={{fontSize:13,fontWeight:700,color:"var(--tp)"}}>Hormat Kami,</div>
                        <div className="fnt" style={{fontSize:22,fontWeight:600,color:"var(--fo)",fontStyle:"italic"}}>Paguyuban & Pemuda Ciburial Makers</div>
                      </div>
                    </div>
                  )
                },
              ].map((section,i)=>(
                <div key={i} className="rv" style={{marginBottom:8}}>
                  <button
                    onClick={()=>setPropOpen(propOpen===i?null:i)}
                    style={{width:"100%",display:"flex",justifyContent:"space-between",alignItems:"center",padding:"20px 26px",background:propOpen===i?"var(--fo)":"var(--cw)",border:"1px solid var(--bo)",borderRadius:propOpen===i?"18px 18px 0 0":18,cursor:"pointer",transition:"background .25s,border-radius .25s",textAlign:"left"}}
                  >
                    <div style={{display:"flex",alignItems:"center",gap:12}}>
                      <span style={{fontSize:20}}>{section.icon}</span>
                      <span style={{fontSize:15,fontWeight:700,color:propOpen===i?"var(--cr)":"var(--tp)"}}>{section.title}</span>
                    </div>
                    <span style={{fontSize:20,color:propOpen===i?"var(--gl)":"var(--tm)",transition:"transform .3s",transform:propOpen===i?"rotate(45deg)":"rotate(0)",display:"block"}}>+</span>
                  </button>
                  <div className={`ac ${propOpen===i?"op":""}`} style={{border:"1px solid var(--bo)",borderTop:"none",borderRadius:"0 0 18px 18px",padding:propOpen===i?"26px":"0 26px",background:"var(--cw)"}}>
                    {section.content}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ════════════════════════════════════════════════
            TAB: TRANSPARANSI DANA
        ════════════════════════════════════════════════ */}
        {tab==="transparansi"&&(
          <div className="pi" style={{paddingTop:106,paddingBottom:106}}>
            <div style={{maxWidth:1100,margin:"0 auto",padding:"0 28px"}}>

              <div className="rv" style={{textAlign:"center",marginBottom:48}}>
                <div className="dl dlc"/>
                <h1 className="fnt" style={{fontSize:"clamp(30px,5vw,58px)",fontWeight:300,color:"var(--fo)",lineHeight:1.05,letterSpacing:"-.025em",marginBottom:10}}>Transparansi<br/><em>Dana Kampung</em></h1>
                <p style={{fontSize:14,color:"var(--ts)",lineHeight:1.7,maxWidth:400,margin:"0 auto"}}>
                  Setiap rupiah yang masuk dan keluar dicatat secara terbuka.<br/>Kepercayaan Anda adalah amanah yang kami jaga.
                </p>
              </div>

              {/* Summary cards */}
              <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fit,minmax(190px,1fr))",gap:14,marginBottom:36}}>
                {[
                  {label:"Total Masuk",  val:fRp(totMasuk),  icon:"↑",c:"var(--gt)",bg:"var(--gb)"},
                  {label:"Total Keluar", val:fRp(totKeluar), icon:"↓",c:"var(--rt)",bg:"var(--rb)"},
                  {label:"Saldo Dana",   val:fRp(saldo),     icon:"◎",c:"var(--fo)",bg:"var(--cd)"},
                  {label:"Target RAB",   val:fRp(totTarget), icon:"◈",c:"var(--em)",bg:"rgba(184,148,63,.1)"},
                ].map((card,i)=>(
                  <div key={i} className={`rv d${i+1}`} style={{padding:"24px",background:"var(--cw)",border:"1px solid var(--bo)",borderRadius:18}}>
                    <div style={{display:"flex",justifyContent:"space-between",marginBottom:10}}>
                      <span style={{fontSize:10,fontWeight:700,letterSpacing:".1em",textTransform:"uppercase",color:"var(--tm)"}}>{card.label}</span>
                      <span style={{padding:"3px 9px",background:card.bg,color:card.c,borderRadius:99,fontSize:13,fontWeight:800}}>{card.icon}</span>
                    </div>
                    <div className="fnt" style={{fontSize:"clamp(16px,2.3vw,24px)",fontWeight:600,color:card.c,lineHeight:1}}>{card.val}</div>
                  </div>
                ))}
              </div>

              {/* Progress global */}
              <div className="rv pgw" style={{padding:"24px 28px",background:"var(--cw)",border:"1px solid var(--bo)",borderRadius:18,marginBottom:36}}>
                <div style={{display:"flex",justifyContent:"space-between",marginBottom:12,flexWrap:"wrap",gap:8}}>
                  <span style={{fontSize:13,fontWeight:700,color:"var(--tp)"}}>Progress Pencapaian Target RAB (Rp 250 juta)</span>
                  <span style={{fontSize:14,fontWeight:700,color:"var(--fo)"}}>{Math.round((totMasuk/totTarget)*100)}%</span>
                </div>
                <div className="pg" style={{height:8}}><div className="pgf" style={{background:"linear-gradient(90deg,var(--fo) 0%,var(--fl) 100%)",width:`${Math.min(100,(totMasuk/totTarget)*100)}%`}}/></div>
                <div style={{fontSize:11,color:"var(--tm)",marginTop:8}}>Terkumpul {fRp(totMasuk)} dari target {fRp(totTarget)}</div>
              </div>

              {/* Alokasi breakdown */}
              <div className="rv" style={{marginBottom:36}}>
                <h3 style={{fontSize:11,fontWeight:700,letterSpacing:".12em",textTransform:"uppercase",color:"var(--tm)",marginBottom:16}}>Rincian Alokasi Dana (RAB Global)</h3>
                <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fit,minmax(230px,1fr))",gap:12}}>
                  {ALOKASI.map((item,i)=>{
                    const used=transaksi.filter(t=>t.tipe==="keluar"&&t.kategori===item.label).reduce((s,t)=>s+t.jumlah,0);
                    const pct=Math.min(100,(used/item.target)*100);
                    return(
                      <div key={i} className={`rv pgw d${i+1}`} style={{padding:"18px 20px",background:"var(--cw)",border:"1px solid var(--bo)",borderRadius:15}}>
                        <div style={{display:"flex",gap:10,alignItems:"flex-start",marginBottom:10}}>
                          <span style={{fontSize:20,marginTop:1}}>{item.icon}</span>
                          <div style={{flex:1}}>
                            <div style={{fontSize:12,fontWeight:700,color:"var(--tp)"}}>{item.label}</div>
                            <div style={{fontSize:11,color:"var(--tm)"}}>{fRp(used)} / {fRp(item.target)}</div>
                          </div>
                          <span style={{fontSize:12,fontWeight:800,color:item.color,whiteSpace:"nowrap"}}>{Math.round(pct)}%</span>
                        </div>
                        <div className="pg"><div className="pgf" style={{background:item.color,width:`${pct}%`}}/></div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Riwayat transaksi */}
              <div className="rv">
                <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:16,flexWrap:"wrap",gap:12}}>
                  <h3 style={{fontSize:11,fontWeight:700,letterSpacing:".12em",textTransform:"uppercase",color:"var(--tm)"}}>Riwayat Transaksi</h3>
                  <div style={{display:"flex",gap:6}}>
                    {(["semua","masuk","keluar"] as const).map(f=>(
                      <button key={f} onClick={()=>setFTipe(f)} style={{padding:"7px 15px",fontSize:11,fontWeight:700,letterSpacing:".07em",textTransform:"uppercase",border:"1px solid var(--bo)",borderRadius:99,cursor:"pointer",transition:"all .2s",background:fTipe===f?"var(--fo)":"var(--cw)",color:fTipe===f?"#fff":"var(--ts)"}}>
                        {f}
                      </button>
                    ))}
                  </div>
                </div>
                <div style={{background:"var(--cw)",border:"1px solid var(--bo)",borderRadius:18,overflow:"hidden"}}>
                  <div style={{overflowX:"auto"}}>
                    <table className="tbl">
                      <thead>
                        <tr style={{background:"var(--cr)"}}>
                          <th>Tanggal</th><th>Keterangan</th><th>Kategori</th><th>Tipe</th><th style={{textAlign:"right"}}>Jumlah</th>
                        </tr>
                      </thead>
                      <tbody>
                        {txFil.map(t=>(
                          <tr key={t.id}>
                            <td style={{whiteSpace:"nowrap",fontSize:12}}>{new Date(t.tanggal).toLocaleDateString("id-ID",{day:"numeric",month:"short",year:"numeric"})}</td>
                            <td>{t.keterangan}</td>
                            <td><span style={{padding:"3px 10px",background:"var(--cd)",borderRadius:99,fontSize:11,fontWeight:600,color:"var(--ts)",whiteSpace:"nowrap"}}>{t.kategori}</span></td>
                            <td><span style={{padding:"3px 10px",borderRadius:99,fontSize:11,fontWeight:700,whiteSpace:"nowrap",background:t.tipe==="masuk"?"var(--gb)":"var(--rb)",color:t.tipe==="masuk"?"var(--gt)":"var(--rt)"}}>
                              {t.tipe==="masuk"?"↑ Masuk":"↓ Keluar"}
                            </span></td>
                            <td style={{textAlign:"right",fontWeight:700,whiteSpace:"nowrap",color:t.tipe==="masuk"?"var(--gt)":"var(--rt)"}}>
                              {t.tipe==="masuk"?"+":"-"}{fRp(t.jumlah)}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                  <div style={{padding:"14px 22px",borderTop:"2px solid var(--bo)",background:"var(--cr)",display:"flex",justifyContent:"flex-end",gap:24,flexWrap:"wrap"}}>
                    <span style={{fontSize:12,fontWeight:700,color:"var(--gt)"}}>Masuk: {fRp(totMasuk)}</span>
                    <span style={{fontSize:12,fontWeight:700,color:"var(--rt)"}}>Keluar: {fRp(totKeluar)}</span>
                    <span style={{fontSize:13,fontWeight:800,color:"var(--fo)"}}>Saldo: {fRp(saldo)}</span>
                  </div>
                </div>
                <div style={{marginTop:16,padding:"13px 18px",background:"rgba(184,148,63,.07)",border:"1px solid rgba(184,148,63,.18)",borderRadius:13,display:"flex",gap:10,alignItems:"flex-start"}}>
                  <span style={{fontSize:16}}>ℹ️</span>
                  <div style={{fontSize:12,lineHeight:1.7,color:"var(--em)"}}>
                    Data diperbarui berkala oleh Divisi Humas & Transparansi Publik. Pertanyaan: <strong>ciburial.smarthub@gmail.com</strong>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ════════════════════════════════════════════════
            TAB: MARKETPLACE
        ════════════════════════════════════════════════ */}
        {tab==="marketplace"&&!checkout&&(
          <div className="pi" style={{paddingTop:106,paddingBottom:106}}>
            <div style={{maxWidth:1320,margin:"0 auto",padding:"0 28px"}}>
              <div className="rv" style={{marginBottom:60,display:"flex",flexWrap:"wrap",alignItems:"flex-end",justifyContent:"space-between",gap:20}}>
                <div>
                  <div className="dl"/>
                  <h1 className="fnt" style={{fontSize:"clamp(40px,7vw,84px)",fontWeight:300,color:"var(--fo)",lineHeight:.95,letterSpacing:"-.03em"}}>Galeri<br/><em>Produk</em></h1>
                </div>
                <p style={{maxWidth:320,fontSize:14,lineHeight:1.8,color:"var(--ts)"}}>Setiap produk adalah cerminan keahlian dan kecintaan pemuda Ciburial terhadap tanah dan bambu mereka.</p>
              </div>

              {dataLoad&&(
                <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fill,minmax(270px,1fr))",gap:18}}>
                  {[1,2,3,4].map(i=><div key={i} className="sk" style={{height:310,borderRadius:20}}/>)}
                </div>
              )}

              {!dataLoad&&(
                <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fill,minmax(270px,1fr))",gap:18}}>
                  {produk.map((p,i)=>(
                    <div key={p.id} className={`rv ch d${(i%3)+1}`} style={{background:"var(--cw)",border:"1px solid var(--bo)",borderRadius:20,overflow:"hidden"}}>
                      <div style={{aspectRatio:"4/3",background:"linear-gradient(135deg,var(--cd) 0%,var(--cr) 100%)",display:"flex",alignItems:"center",justifyContent:"center",position:"relative"}}>
                        <span style={{fontSize:52}}>{p.icon||"🎋"}</span>
                        {p.tag&&<div style={{position:"absolute",top:13,left:13,padding:"5px 12px",background:"var(--fo)",borderRadius:99,fontSize:10,fontWeight:700,letterSpacing:".09em",textTransform:"uppercase",color:"#fff"}}>{p.tag}</div>}
                      </div>
                      <div style={{padding:"21px 22px 18px"}}>
                        <h3 style={{fontSize:16,fontWeight:700,color:"var(--tp)",marginBottom:6}}>{p.nama}</h3>
                        <p style={{fontSize:12,lineHeight:1.7,color:"var(--ts)",marginBottom:18}}>{p.deskripsi}</p>
                        <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",paddingTop:15,borderTop:"1px solid var(--bo)"}}>
                          <span className="fnt" style={{fontSize:20,fontWeight:600,color:"var(--fo)"}}>{fRp(p.harga)}</span>
                          <button onClick={()=>setCheckout(true)} className="btn" style={{padding:"9px 20px",borderRadius:99,fontSize:11,fontWeight:700,letterSpacing:".08em",textTransform:"uppercase",border:"none",cursor:"pointer",background:"var(--fo)",color:"#fff"}}>
                            <span>Beli</span>
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

        {/* CHECKOUT */}
        {checkout&&(
          <div className="pi" style={{paddingTop:106,paddingBottom:106,minHeight:"100vh"}}>
            <div style={{maxWidth:560,margin:"0 auto",padding:"0 28px"}}>
              <button onClick={()=>setCheckout(false)} style={{display:"flex",alignItems:"center",gap:8,background:"none",border:"none",cursor:"pointer",fontSize:11,fontWeight:700,letterSpacing:".1em",textTransform:"uppercase",color:"var(--tm)",marginBottom:32,padding:0,transition:"color .2s"}}
                onMouseEnter={e=>(e.currentTarget.style.color="var(--fo)")}
                onMouseLeave={e=>(e.currentTarget.style.color="var(--tm)")}
              >← Kembali</button>
              <div style={{padding:"20px",background:"var(--fo)",borderRadius:16,marginBottom:18,display:"flex",alignItems:"center",gap:16}}>
                <span style={{fontSize:32}}>🪔</span>
                <div>
                  <div style={{fontSize:10,fontWeight:700,letterSpacing:".15em",textTransform:"uppercase",color:"rgba(250,248,243,.4)",marginBottom:3}}>Pesanan Anda</div>
                  <div style={{fontSize:15,fontWeight:700,color:"var(--cr)"}}>Produk Ciburial Makers</div>
                </div>
              </div>
              <div style={{background:"var(--cw)",border:"1px solid var(--bo)",borderRadius:22,padding:"38px"}}>
                <h2 className="fnt" style={{fontSize:27,fontWeight:300,color:"var(--fo)",letterSpacing:"-.02em",marginBottom:6}}>Detail Pengiriman</h2>
                <p style={{fontSize:12,color:"var(--tm)",marginBottom:30}}>Pesanan diteruskan ke tim Ciburial Makers via email resmi.</p>
                <div style={{display:"flex",flexDirection:"column",gap:18}}>
                  {[{l:"Nama Lengkap",t:"text",p:"Cth: Budi Santoso"},{l:"No. WhatsApp Aktif",t:"tel",p:"Cth: 08123456789"}].map((f,i)=>(
                    <div key={i}>
                      <label style={{display:"block",fontSize:10,fontWeight:700,letterSpacing:".12em",textTransform:"uppercase",color:"var(--ts)",marginBottom:7}}>{f.l}</label>
                      <input type={f.t} placeholder={f.p} className="fi"/>
                    </div>
                  ))}
                  <div>
                    <label style={{display:"block",fontSize:10,fontWeight:700,letterSpacing:".12em",textTransform:"uppercase",color:"var(--ts)",marginBottom:7}}>Alamat Lengkap</label>
                    <textarea rows={3} className="fi" style={{resize:"vertical"}}/>
                  </div>
                  <div>
                    <label style={{display:"block",fontSize:10,fontWeight:700,letterSpacing:".12em",textTransform:"uppercase",color:"var(--ts)",marginBottom:7}}>Catatan (opsional)</label>
                    <textarea rows={2} className="fi" placeholder="Warna, ukuran, atau permintaan khusus..." style={{resize:"vertical"}}/>
                  </div>
                  <button type="button" className="btn" style={{width:"100%",padding:"15px",borderRadius:13,fontSize:11,fontWeight:700,letterSpacing:".14em",textTransform:"uppercase",border:"none",cursor:"pointer",background:"var(--fo)",color:"#fff",marginTop:4}}>
                    <span>Kirim Pesanan →</span>
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ════════════════════════════════════════════════
            FOOTER
        ════════════════════════════════════════════════ */}
        <footer style={{background:"var(--ea)",borderTop:"1px solid rgba(255,255,255,.05)"}}>
          <div style={{maxWidth:1320,margin:"0 auto",padding:"64px 28px 48px",display:"grid",gridTemplateColumns:"repeat(auto-fit,minmax(160px,1fr))",gap:40}}>
            <div>
              <div className="fnt" style={{fontSize:24,fontWeight:300,color:"var(--cr)",letterSpacing:"-.02em",marginBottom:4}}>Ciburial</div>
              <div style={{fontSize:9,fontWeight:700,letterSpacing:".18em",textTransform:"uppercase",color:"var(--go)",marginBottom:6}}>Eco-Digital Village</div>
              <div className="fnt" style={{fontSize:12,fontStyle:"italic",color:"rgba(250,248,243,.35)",marginBottom:14}}>Inovasi Desa Mandiri Berbasis Kearifan Lokal</div>
              <p style={{fontSize:12,lineHeight:1.85,color:"rgba(250,248,243,.35)"}}>Pelopor eco-digital village sejak 2026 — bambu lokal & infrastruktur cerdas dari Garut untuk dunia.</p>
            </div>
            <div>
              <h4 style={{fontSize:10,fontWeight:700,letterSpacing:".14em",textTransform:"uppercase",color:"var(--go)",marginBottom:18}}>Lokasi</h4>
              <p style={{fontSize:12,lineHeight:1.9,color:"rgba(250,248,243,.38)"}}>Kp Ciburial<br/>Desa Hanjuang, Kec. Bungbulang<br/>Kab. Garut, Jawa Barat 44165</p>
            </div>
            <div>
              <h4 style={{fontSize:10,fontWeight:700,letterSpacing:".14em",textTransform:"uppercase",color:"var(--go)",marginBottom:18}}>Navigasi</h4>
              <div style={{display:"flex",flexDirection:"column",gap:10}}>
                {TABS.map(t=>(
                  <button key={t.key} onClick={()=>go(t.key)} style={{background:"none",border:"none",cursor:"pointer",textAlign:"left",fontSize:12,fontWeight:500,color:"rgba(250,248,243,.38)",padding:0,transition:"color .2s"}}
                    onMouseEnter={e=>(e.currentTarget.style.color="var(--cr)")}
                    onMouseLeave={e=>(e.currentTarget.style.color="rgba(250,248,243,.38)")}
                  >{t.label}</button>
                ))}
                <a href="/pengaduan" style={{fontSize:12,fontWeight:500,color:"rgba(250,248,243,.38)",textDecoration:"none",transition:"color .2s"}}
                  onMouseEnter={e=>(e.currentTarget.style.color="var(--cr)")}
                  onMouseLeave={e=>(e.currentTarget.style.color="rgba(250,248,243,.38)")}
                >📢 Pengaduan Warga</a>
                <a href="/voting" style={{fontSize:12,fontWeight:500,color:"rgba(250,248,243,.38)",textDecoration:"none",transition:"color .2s"}}
                  onMouseEnter={e=>(e.currentTarget.style.color="var(--cr)")}
                  onMouseLeave={e=>(e.currentTarget.style.color="rgba(250,248,243,.38)")}
                >🗳️ Voting</a>
                <a href="/ai" style={{fontSize:12,fontWeight:500,color:"rgba(122,173,138,.6)",textDecoration:"none",transition:"color .2s"}}
                  onMouseEnter={e=>(e.currentTarget.style.color="#7aad8a")}
                  onMouseLeave={e=>(e.currentTarget.style.color="rgba(122,173,138,.6)")}
                >🤖 Ciburial AI</a>
              </div>
            </div>
            <div>
              <h4 style={{fontSize:10,fontWeight:700,letterSpacing:".14em",textTransform:"uppercase",color:"var(--go)",marginBottom:18}}>Kontak</h4>
              <div style={{display:"flex",flexDirection:"column",gap:10}}>
                {["ciburial.smarthub@gmail.com","support.ciburial@gmail.com"].map(e=>(
                  <a key={e} href={`mailto:${e}`} style={{fontSize:12,fontWeight:500,color:"rgba(250,248,243,.38)",textDecoration:"none",transition:"color .2s"}}
                    onMouseEnter={ev=>(ev.currentTarget.style.color="var(--cr)")}
                    onMouseLeave={ev=>(ev.currentTarget.style.color="rgba(250,248,243,.38)")}
                  >{e}</a>
                ))}
              </div>
            </div>
          </div>
          <div style={{borderTop:"1px solid rgba(255,255,255,.05)",padding:"16px 28px",maxWidth:1320,margin:"0 auto",display:"flex",flexWrap:"wrap",alignItems:"center",justifyContent:"space-between",gap:14}}>
            <p style={{fontSize:10,fontWeight:600,color:"rgba(250,248,243,.2)",letterSpacing:".07em",textTransform:"uppercase"}}>
              © {new Date().getFullYear()} Ciburial Eco-Digital Village. All Rights Reserved.
            </p>
            <div style={{display:"flex",gap:16}}>
              {[
                <path key="fb" fillRule="evenodd" d="M22 12c0-5.523-4.477-10-10-10S2 6.477 2 12c0 4.991 3.657 9.128 8.438 9.878v-6.987h-2.54V12h2.54V9.797c0-2.506 1.492-3.89 3.777-3.89 1.094 0 2.238.195 2.238.195v2.46h-1.26c-1.243 0-1.63.771-1.63 1.562V12h2.773l-.443 2.89h-2.33v6.988C18.343 21.128 22 16.991 22 12z" clipRule="evenodd"/>,
                <path key="yt" fillRule="evenodd" d="M21.582 6.186a2.665 2.665 0 00-1.876-1.884C17.96 3.842 12 3.842 12 3.842s-5.96 0-7.706.46A2.665 2.665 0 002.418 6.186C2 7.942 2 12 2 12s0 4.058.418 5.814a2.665 2.665 0 001.876 1.884C5.96 20.158 12 20.158 12 20.158s5.96 0 7.706-.46a2.665 2.665 0 001.876-1.884C22 15.942 22 12 22 12s0-4.058-.418-5.814zM9.99 15.292v-6.58L15.694 12l-5.704 3.292z" clipRule="evenodd"/>,
                <path key="tt" d="M12.525.02c1.31-.02 2.61-.01 3.91-.04.08 1.53.63 3.09 1.75 4.17 1.12 1.11 2.7 1.62 4.24 1.79v4.03c-1.44-.05-2.89-.35-4.2-.97-.57-.26-1.1-.59-1.62-.93-.01 2.92.01 5.84-.02 8.75-.08 1.4-.54 2.79-1.35 3.94-1.31 1.92-3.58 3.17-5.91 3.21-1.43.08-2.86-.31-4.08-1.03-2.02-1.19-3.44-3.37-3.65-5.71-.02-.5-.03-1-.01-1.49.18-1.9 1.12-3.72 2.58-4.96 1.66-1.44 3.98-2.13 6.15-1.72.02 1.48-.04 2.96-.04 4.44-.99-.32-2.15-.23-3.02.37-.63.41-1.11 1.04-1.36 1.75-.21.51-.15 1.07-.14 1.61.24 1.64 1.82 3.02 3.5 2.87 1.12-.01 2.19-.66 2.77-1.61.19-.33.4-.67.41-1.06.1-1.79.06-3.57.07-5.36.01-4.03-.01-8.05.02-12.07z"/>,
              ].map((icon,i)=>(
                <a key={i} href="#" style={{color:"rgba(250,248,243,.22)",transition:"color .2s"}}
                  onMouseEnter={e=>((e.currentTarget as HTMLAnchorElement).style.color="var(--cr)")}
                  onMouseLeave={e=>((e.currentTarget as HTMLAnchorElement).style.color="rgba(250,248,243,.22)")}
                >
                  <svg style={{width:16,height:16}} fill="currentColor" viewBox="0 0 24 24">{icon}</svg>
                </a>
              ))}
            </div>
          </div>
        </footer>

      </main>
    </>
  );
}