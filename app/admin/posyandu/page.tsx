"use client";
import { useState, useEffect, useRef } from "react";
import { supabase, isSupabaseReady } from "@/lib/supabase";

interface Anak { id:string; nama:string; tgl_lahir:string; jenis_kelamin:string; nama_ibu:string; no_wa_ibu:string; kk_id:string; }
interface TK { id:string; anak_id:string; tanggal:string; bb_kg:number; tb_cm:number; lila_cm:number; lk_cm:number; status_gizi:string; catatan:string; }
interface Imunisasi { id:string; anak_id:string; jenis:string; usia_bulan:number; tanggal_jadwal:string; tanggal_realisasi:string; status:string; }

const POIN_POSYANDU = 15;

const JADWAL_IMUNISASI = [
  { jenis:"HB0",        label:"Hepatitis B (0)",              usia_bulan:0  },
  { jenis:"BCG",        label:"BCG + Polio 1",                usia_bulan:1  },
  { jenis:"DPT1",       label:"DPT-HB-Hib 1 + Polio 2",      usia_bulan:2  },
  { jenis:"DPT2",       label:"DPT-HB-Hib 2 + Polio 3",      usia_bulan:3  },
  { jenis:"DPT3",       label:"DPT-HB-Hib 3 + Polio 4 + IPV",usia_bulan:4  },
  { jenis:"MR1",        label:"Campak-Rubella (MR) 1",        usia_bulan:9  },
  { jenis:"DPT4",       label:"DPT-HB-Hib 4 + MR 2",         usia_bulan:18 },
  { jenis:"DPT5",       label:"DPT 5 + Polio 5",             usia_bulan:60 },
  { jenis:"MR2",        label:"Campak-Rubella (MR) 2",        usia_bulan:60 },
];

// ─── HELPER FUNCTIONS ────────────────────────────────────────────────────────
function hitungUmurBulan(tgl:string):number {
  return Math.floor((new Date().getTime()-new Date(tgl).getTime())/(1000*60*60*24*30));
}
function hitungUmurLabel(tgl:string):string {
  const b=hitungUmurBulan(tgl);
  return b<24?`${b} bulan`:`${Math.floor(b/12)} thn ${b%12} bln`;
}
function statusGiziWHO(bb:number,tgl_lahir:string):{status:string;color:string;label:string}{
  const b=hitungUmurBulan(tgl_lahir);
  const ideal=b<=12?b*0.65+3:6+(b-12)*0.22;
  const r=bb/ideal;
  if(r>=1.1)return{status:"lebih",  color:"#F59E0B",label:"Gizi Lebih ⚠️"};
  if(r>=0.9)return{status:"normal", color:"#10B981",label:"Gizi Baik ✅"};
  if(r>=0.75)return{status:"kurang",color:"#F97316",label:"Gizi Kurang ⚠️"};
  return{status:"buruk",color:"#EF4444",label:"Gizi Buruk 🚨"};
}
function tglDariUsia(tgl_lahir:string,bulan:number):string {
  const d=new Date(tgl_lahir);d.setMonth(d.getMonth()+bulan);
  return d.toISOString().split("T")[0];
}
function fmtTgl(tgl:string):string {
  if(!tgl)return"-";
  return new Date(tgl).toLocaleDateString("id-ID",{day:"numeric",month:"short",year:"numeric"});
}

function GrafikBB({data,tgl_lahir}:{data:TK[];tgl_lahir:string}){
  if(data.length<2)return<div style={{textAlign:"center",padding:"30px",color:"#9CA3AF",fontSize:13,background:"#F9FAFB",borderRadius:16}}>Butuh minimal 2 data untuk menggambar grafik kurva pertumbuhan si kecil</div>;
  const sorted=[...data].sort((a,b)=>a.tanggal.localeCompare(b.tanggal));
  const maxBB=Math.max(...sorted.map(d=>d.bb_kg))*1.15;
  const minBB=Math.max(0,Math.min(...sorted.map(d=>d.bb_kg))*0.85);
  const W=320,H=140,P=32;
  const xS=(W-P*2)/(sorted.length-1);
  const yS=(v:number)=>H-P-((v-minBB)/(maxBB-minBB))*(H-P*2);
  const pts=sorted.map((d,i)=>({x:P+i*xS,y:yS(d.bb_kg),bb:d.bb_kg,tgl:d.tanggal}));
  const path=pts.map((p,i)=>`${i===0?"M":"L"}${p.x.toFixed(1)},${p.y.toFixed(1)}`).join(" ");
  const area=`${path} L${pts[pts.length-1].x},${H-P} L${P},${H-P} Z`;
  return(
    <div style={{overflowX:"auto"}}>
      <svg width={W} height={H} style={{display:"block",margin:"0 auto"}}>
        <defs>
          <linearGradient id="gGrad" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#FDA4AF" stopOpacity="0.4"/>
            <stop offset="100%" stopColor="#FDA4AF" stopOpacity="0"/>
          </linearGradient>
        </defs>
        {[0,0.5,1].map(t=>{
          const y=P+(1-t)*(H-P*2);
          return<line key={t} x1={P} y1={y} x2={W-P} y2={y} stroke="#F3F4F6" strokeWidth={1}/>;
        })}
        <path d={area} fill="url(#gGrad)"/>
        <path d={path} fill="none" stroke="#F43F5E" strokeWidth={3} strokeLinecap="round" strokeLinejoin="round"/>
        {pts.map((p,i)=>{
          const gz=statusGiziWHO(p.bb,tgl_lahir);
          return(
            <g key={i}>
              <circle cx={p.x} cy={p.y} r={6} fill={gz.color} stroke="white" strokeWidth={2}/>
              <text x={p.x} y={p.y-12} fontSize={10} textAnchor="middle" fill={gz.color} fontWeight="800">{p.bb}</text>
              <text x={p.x} y={H-P+14} fontSize={9} textAnchor="middle" fill="#9CA3AF" fontWeight="600">{new Date(p.tgl).toLocaleDateString("id-ID",{month:"short"})}</text>
            </g>
          );
        })}
      </svg>
    </div>
  );
}

// ─── RADAR ANIMATION ─────────────────────────────────────────────────────────
function RadarPing({ active }:{ active:boolean }) {
  return (
    <div style={{ position:"relative", width:140, height:140, margin:"0 auto" }}>
      {[1,2,3].map(i => (
        <div key={i} style={{
          position:"absolute", inset:0, borderRadius:"50%",
          border:`1px solid rgba(244,63,94,${active?0.3:0.1})`,
          transform:`scale(${i*0.33})`, transformOrigin:"center",
          animation: active ? `ping ${1+i*0.5}s infinite` : "none"
        }}/>
      ))}
      {active && (
        <div style={{
          position:"absolute", inset:0, borderRadius:"50%",
          background:"conic-gradient(from 0deg, transparent 270deg, rgba(244,63,94,0.15) 360deg)",
          animation:"sweep 2s linear infinite",
        }}/>
      )}
      <div style={{
        position:"absolute", top:"50%", left:"50%",
        transform:"translate(-50%,-50%)",
        width:active?24:18, height:active?24:18,
        borderRadius:"50%",
        background:active?"#F43F5E":"#E5E7EB",
        boxShadow:active?"0 0 25px #F43F5E, 0 0 50px rgba(244,63,94,0.3)":"none",
        transition:"all 0.4s cubic-bezier(0.175, 0.885, 0.32, 1.275)",
      }}/>
    </div>
  );
}

// ─── CARA KERJA ──────────────────────────────────────────────────────────────
function CaraKerja() {
  const steps = [
    { i:"01", t:"TEMPEL e-KTP", d:"Tempelkan e-KTP Bunda di belakang HP atau alat sensor NFC." },
    { i:"02", t:"VERIFIKASI", d:"Sistem akan mencari data Bunda & Si Kecil secara otomatis." },
    { i:"03", t:"TIMBANG", d:"Input berat & tinggi badan Si Kecil untuk pantau gizi." },
    { i:"04", t:"DAPAT POIN", d:"Setiap kunjungan rutin Bunda akan mendapatkan Poin Posyandu." },
  ];
  return (
    <div style={{ display:"grid", gridTemplateColumns:"repeat(auto-fit,minmax(180px,1fr))", gap:16, marginTop:40 }}>
      {steps.map(s => (
        <div key={s.i} style={{ background:"white", padding:20, borderRadius:20, border:"1px solid #FFF1F2", boxShadow:"0 4px 12px rgba(244,63,94,0.05)" }}>
          <div style={{ fontSize:10, fontWeight:900, color:"#F43F5E", marginBottom:8, opacity:0.5 }}>Langkah {s.i}</div>
          <div style={{ fontSize:14, fontWeight:900, color:"#111827", marginBottom:6 }}>{s.t}</div>
          <div style={{ fontSize:12, color:"#6B7280", fontWeight:600, lineHeight:1.5 }}>{s.d}</div>
        </div>
      ))}
    </div>
  );
}

const LS={fontSize:11,fontWeight:800 as const,color:"#9CA3AF",letterSpacing:"0.08em",textTransform:"uppercase" as const,display:"block",marginBottom:6};
const IS={width:"100%",padding:"12px 16px",borderRadius:16,border:"2px solid #E5E7EB",fontSize:14,background:"#F9FAFB",outline:"none",boxSizing:"border-box" as const,fontFamily:"inherit",color:"#374151",fontWeight:600};

export default function AdminPosyanduPage(){
  const[anakList,setAnakList]=useState<Anak[]>([]);
  const[tkList,setTkList]=useState<TK[]>([]);
  const[imunList,setImunList]=useState<Imunisasi[]>([]);
  const[kkList,setKkList]=useState<any[]>([]);
  const[ibuList,setIbuList]=useState<any[]>([]);
  const[activeAnak,setActiveAnak]=useState<Anak|null>(null);
  const[tab,setTab]=useState<"daftar"|"scan"|"input"|"imunisasi">("scan");
  const[scanning,setScanning]=useState(false);
  const[lastScan,setLastScan]=useState<{nama:string;namaAnak:string;poin:number}|null>(null);
  const[authenticatedIbu, setAuthenticatedIbu] = useState<any|null>(null);
  const[formTK,setFormTK]=useState({anak_id:"",tanggal:new Date().toISOString().split("T")[0],bb_kg:"",tb_cm:"",lila_cm:"",lk_cm:"",catatan:""});
  const[formAnak,setFormAnak]=useState({nama:"",tgl_lahir:"",jenis_kelamin:"L",nama_ibu:"",no_wa_ibu:"",kk_id:""});
  const[showFormAnak,setShowFormAnak]=useState(false);
  const[loading,setLoading]=useState(false);
  const[toast,setToast]=useState({msg:"",ok:true});
  
  const nfcRef = useRef<any>(null);
  const ibuListRef = useRef(ibuList);
  useEffect(() => { ibuListRef.current = ibuList; }, [ibuList]);

  function showToast(msg:string,ok=true){setToast({msg,ok});setTimeout(()=>setToast({msg:"",ok:true}),4000);}

  async function fetchAll(){
    if(!isSupabaseReady()) return;
    const[a,tk,im,kk,ibu]=await Promise.all([
      supabase.from("anak_posyandu").select("*").order("nama"),
      supabase.from("tumbuh_kembang").select("*").order("tanggal",{ascending:false}),
      supabase.from("imunisasi").select("*").order("usia_bulan"),
      supabase.from("keluarga").select("id,kepala_keluarga,rt").order("kepala_keluarga"),
      supabase.from("anggota_kk").select("id,kk_id,nama,nfc_id,saldo_poin,no_wa").eq("hubungan","istri"),
    ]);
    if(a.data)setAnakList(a.data as Anak[]);
    if(tk.data)setTkList(tk.data as TK[]);
    if(im.data)setImunList(im.data as Imunisasi[]);
    if(kk.data)setKkList(kk.data);
    if(ibu.data)setIbuList(ibu.data);
  }
  useEffect(()=>{fetchAll();},[]);

  async function generateJadwal(anakId:string,tgl_lahir:string){
    const rows=JADWAL_IMUNISASI.map(j=>({anak_id:anakId,jenis:j.jenis,usia_bulan:j.usia_bulan,tanggal_jadwal:tglDariUsia(tgl_lahir,j.usia_bulan),status:"belum"}));
    await supabase.from("imunisasi").insert(rows);
  }

  async function simpanAnak(){
    if(!formAnak.nama||!formAnak.tgl_lahir)return showToast("❌ Nama & tgl lahir wajib!",false);
    setLoading(true);
    const{data,error}=await supabase.from("anak_posyandu").insert({...formAnak,nama_ibu:authenticatedIbu?.nama||"-"}).select().single();
    if(error)showToast(`❌ ${error.message}`,false);
    else{
      await generateJadwal(data.id,formAnak.tgl_lahir);
      showToast("💕 Anak terdaftar + jadwal imunisasi dibuat! 💉");
      setFormAnak({nama:"",tgl_lahir:"",jenis_kelamin:"L",nama_ibu:"",no_wa_ibu:"",kk_id:""});
      setShowFormAnak(false);
      fetchAll();
    }
    setLoading(false);
  }

  async function simpanTK(){
    if(!formTK.anak_id||!formTK.bb_kg)return showToast("❌ Pilih anak & isi BB!",false);
    setLoading(true);
    const anak=anakList.find(a=>a.id===formTK.anak_id)!;
    const gz=statusGiziWHO(Number(formTK.bb_kg),anak.tgl_lahir);
    const{error}=await supabase.from("tumbuh_kembang").insert({
      anak_id:formTK.anak_id,tanggal:formTK.tanggal,
      bb_kg:Number(formTK.bb_kg), tb_cm:formTK.tb_cm?Number(formTK.tb_cm):null,
      lila_cm:formTK.lila_cm?Number(formTK.lila_cm):null, lk_cm:formTK.lk_cm?Number(formTK.lk_cm):null,
      catatan:formTK.catatan||null,status_gizi:gz.status,
    });
    if(error){showToast(`❌ ${error.message}`,false);setLoading(false);return;}
    
    // Reward poin otomatis
    if(authenticatedIbu){
      const hariIni=new Date().toISOString().split("T")[0];
      const{data:cek}=await supabase.from("riwayat_poin").select("id").eq("anggota_id",authenticatedIbu.id).eq("sumber","posyandu").gte("created_at",`${hariIni}T00:00:00`).lte("created_at",`${hariIni}T23:59:59`).limit(1);
      if(!cek||cek.length===0){
        await supabase.from("anggota_kk").update({saldo_poin:(authenticatedIbu.saldo_poin||0)+POIN_POSYANDU}).eq("id",authenticatedIbu.id);
        await supabase.from("riwayat_poin").insert({anggota_id:authenticatedIbu.id,kk_id:authenticatedIbu.kk_id,jumlah:POIN_POSYANDU,jenis:"masuk",sumber:"posyandu",keterangan:`Timbangan Si Kecil — ${anak.nama}`});
      }
    }
    
    showToast(`💕 Tersimpan! Status: ${gz.label}`);
    setFormTK({...formTK,bb_kg:"",tb_cm:"",lila_cm:"",lk_cm:"",catatan:""});
    setLoading(false);fetchAll();
  }

  async function nfcAbsensi(nfcId:string){
    const id=nfcId.replace(/:/g,"").toUpperCase();
    const currentIbuList = ibuListRef.current;
    const ibu=currentIbuList.find(a=>a.nfc_id===id);
    if(!ibu)return showToast(`❌ Bunda belum terdaftar di Sistem Desa! (${id})`,false);
    
    const anak=anakList.filter(a=>a.kk_id===ibu.kk_id);
    const hariIni=new Date().toISOString().split("T")[0];
    const{data:cek}=await supabase.from("riwayat_poin").select("id").eq("anggota_id",ibu.id).eq("sumber","posyandu_kunjungan").gte("created_at",`${hariIni}T00:00:00`).lte("created_at",`${hariIni}T23:59:59`).limit(1);
    
    if(!cek||cek.length===0){
      await supabase.from("riwayat_poin").insert({anggota_id:ibu.id,kk_id:ibu.kk_id,jumlah:5,jenis:"masuk",sumber:"posyandu_kunjungan",keterangan:`Kunjungan Posyandu — ${hariIni}`});
      showToast(`💕 Selamat datang ibu ${ibu.nama}! ✨`);
    } else {
      showToast(`💕 Senang berjumpa lagi, Ibu ${ibu.nama}! ✨`);
    }

    setAuthenticatedIbu(ibu);
    setTab("daftar");
    setLastScan({nama:ibu.nama,namaAnak:anak.map(a=>a.nama).join(", ") || "Belum ada balita terdaftar",poin:5});
    fetchAll();
  }

  async function startNFC(){
    if(!("NDEFReader" in window))return showToast("⚠️ Gunakan Chrome di HP & Aktifkan NFC Bunda!",false);
    try{
      const ndef=new (window as any).NDEFReader();
      nfcRef.current=ndef;await ndef.scan();setScanning(true);
      showToast("📡 KIOSK AKTIF! Silakan tempelkan e-KTP Bunda...");
      ndef.addEventListener("reading",({serialNumber}:any)=>nfcAbsensi(serialNumber));
    }catch(e:any){showToast(`❌ Gagal: ${e?.message||"Error"}`,false);setScanning(false);}
  }
  
  function stopNFC(){
    try{nfcRef.current?.stop?.();}catch{}
    setScanning(false);setLastScan(null);
    setAuthenticatedIbu(null);
    setTab("scan");
    showToast("Sesi berakhir, data dikunci kembali.");
  }

  async function updateImunisasi(id:string){
    await supabase.from("imunisasi").update({tanggal_realisasi:new Date().toISOString().split("T")[0],status:"sudah"}).eq("id",id);
    showToast("💖 Vaksin masuk, Si Kecil kuat!");fetchAll();
  }
  
  async function tandaiTerlewat(id:string){
    await supabase.from("imunisasi").update({status:"terlewat"}).eq("id",id);
    showToast("⚠️ Vaksin ditandai terlewat");fetchAll();
  }

  const myAnakList = authenticatedIbu ? anakList.filter(a => a.kk_id === authenticatedIbu.kk_id) : [];
  const activeTK=tkList.filter(t=>t.anak_id===activeAnak?.id);
  const activeImun=imunList.filter(i=>i.anak_id===activeAnak?.id);
  const anakAlert=myAnakList.filter(a=>{const last=tkList.filter(t=>t.anak_id===a.id)[0];return last&&(statusGiziWHO(last.bb_kg,a.tgl_lahir).status==="buruk"||statusGiziWHO(last.bb_kg,a.tgl_lahir).status==="kurang");});
  const imunJatuhTempo=imunList.filter(im=>{if(im.status!=="belum")return false;const anak=myAnakList.find(a=>a.id===im.anak_id);if(!anak)return false;const diff=(new Date(im.tanggal_jadwal).getTime()-new Date().getTime())/(1000*60*60*24);return diff>=0&&diff<=30;});

  return(
    <div style={{minHeight:"100vh",background:"#FFF1F2",fontFamily:"'Inter', system-ui, sans-serif"}}>
      <style>{`
        @keyframes pulse{0%,100%{opacity:1;transform:scale(1)}50%{opacity:0.6;transform:scale(1.2)}}
        @keyframes ping{0%{transform:scale(1);opacity:0.8}100%{transform:scale(1.8);opacity:0}}
        @keyframes sweep { from{transform:rotate(0deg)} to{transform:rotate(360deg)} }
        @keyframes fadeIn{from{opacity:0;transform:translateY(10px)}to{opacity:1;transform:translateY(0)}}
      `}</style>

      {toast.msg&&<div style={{position:"fixed",top:20,left:"50%",transform:"translateX(-50%)",background:toast.ok?"#F43F5E":"#111827",color:"white",padding:"12px 24px",borderRadius:99,zIndex:999,fontSize:14,fontWeight:700,boxShadow:"0 10px 25px rgba(244,63,94,0.3)",width:"max-content"}}>{toast.msg}</div>}

      <header style={{background:"linear-gradient(135deg, #FDA4AF 0%, #F43F5E 100%)",color:"white",padding:"24px 24px 70px",borderBottomLeftRadius:40,borderBottomRightRadius:40,marginBottom:-40,boxShadow:"0 10px 30px rgba(244,63,94,0.2)",position:"relative",overflow:"hidden"}}>
        <div style={{position:"absolute",top:-20,right:-20,fontSize:160,opacity:0.1,transform:"rotate(15deg)"}}>🧸</div>
        
        <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:24,position:"relative",zIndex:2}}>
          <div style={{display:"flex",alignItems:"center",gap:12}}>
            <a href="/admin" style={{color:"rgba(255,255,255,0.9)",textDecoration:"none",fontSize:13,fontWeight:700,background:"rgba(0,0,0,0.15)",padding:"8px 16px",borderRadius:99}}>← Dashboard</a>
            {authenticatedIbu && (
              <div style={{background:"rgba(255,255,255,0.2)",padding:"8px 16px",borderRadius:99,fontSize:13,fontWeight:800,display:"flex",alignItems:"center",gap:8}}>
                👩 Bunda {authenticatedIbu.nama} 
                <button onClick={stopNFC} style={{background:"#FFF",border:"none",borderRadius:99,padding:"2px 8px",fontSize:10,fontWeight:900,color:"#F43F5E",cursor:"pointer"}}>SELESAI</button>
              </div>
            )}
          </div>
          {authenticatedIbu && <div style={{fontSize:16,fontWeight:900,color:"white",background:"rgba(0,0,0,0.1)",padding:"8px 16px",borderRadius:12}}>🏆 {authenticatedIbu.saldo_poin} POIN</div>}
        </div>
        
        <div style={{position:"relative",zIndex:2}}>
          <div style={{fontSize:12,fontWeight:800,letterSpacing:"0.15em",color:"#FFE4E6",marginBottom:8}}>CLINIC & MATERNITY CIBURIAL</div>
          <h1 style={{margin:"0 0 10px",fontSize:32,fontWeight:900,letterSpacing:"-0.02em"}}>Posyandu Ceria 👶</h1>
          <p style={{margin:0,color:"rgba(255,255,255,0.9)",fontSize:15,maxWidth:450,lineHeight:1.6}}>Pantau tumbuh kembang si kecil dengan teknologi e-KTP. Privasi data terjamin hanya untuk Bunda.</p>
        </div>
      </header>

      <div style={{maxWidth:1000,margin:"0 auto",padding:"0 16px 40px",position:"relative",zIndex:10}}>
        
        {authenticatedIbu && (
          <div style={{display:"flex",gap:10,overflowX:"auto",paddingBottom:20,scrollbarWidth:"none"}}>
            {(["daftar","input","imunisasi"] as const).map(t=>(
              <button key={t} onClick={()=>setTab(t)} style={{padding:"14px 24px",borderRadius:99,fontSize:14,fontWeight:800,border:"none",cursor:"pointer",background:tab===t?"white":"rgba(255,255,255,0.5)",color:tab===t?"#F43F5E":"#6B7280",boxShadow:tab===t?"0 8px 20px rgba(244,63,94,0.15)":"none",whiteSpace:"nowrap",display:"flex",alignItems:"center",gap:8,transition:"all 0.2s"}}>
                {{daftar:"📋 Buku Balita",input:"⚖️ Timbangan",imunisasi:"💉 Vaksin"}[t]}
                {t==="imunisasi"&&imunJatuhTempo.length>0&&<span style={{background:"#F43F5E",color:"white",borderRadius:"50%",width:20,height:20,fontSize:11,display:"flex",alignItems:"center",justifyContent:"center",fontWeight:800}}>{imunJatuhTempo.length}</span>}
              </button>
            ))}
          </div>
        )}

        {!authenticatedIbu && (
          <div style={{animation:"fadeIn 0.5s ease-out"}}>
            <div style={{background:"white",borderRadius:32,padding:48,boxShadow:"0 25px 50px -12px rgba(244,63,94,0.15)",textAlign:"center",border:"1px solid #FFF1F2",maxWidth:600,margin:"0 auto"}}>
              <h3 style={{margin:"0 0 12px",color:"#111827",fontSize:26,fontWeight:900}}>Selamat Datang Bunda! 👋</h3>
              <p style={{fontSize:15,color:"#6B7280",margin:"0 0 40px",lineHeight:1.6}}>Silakan tempelkan **e-KTP Bunda** di sini untuk membuka data tumbuh kembang Si Kecil dan mencatat timbangan hari ini.</p>
              
              <RadarPing active={scanning}/>
              
              <div style={{marginTop:40}}>
                <button onClick={scanning?stopNFC:startNFC} style={{width:"100%",background:scanning?"#FFE4E6":"linear-gradient(135deg, #F43F5E 0%, #E11D48 100%)",color:scanning?"#E11D48":"white",border:scanning?"2px solid #FECACA":"none",borderRadius:20,padding:"20px",fontSize:18,fontWeight:900,cursor:"pointer",boxShadow:scanning?"none":"0 12px 25px rgba(225,29,72,0.3)",transition:"all 0.3s cubic-bezier(0.175, 0.885, 0.32, 1.275)"}}>
                  {scanning ? "⏹ HENTIKAN PEMINDAI" : "SENTUHKAN e-KTP SEKARANG ▶"}
                </button>
              </div>
            </div>
            <CaraKerja />
          </div>
        )}

        {authenticatedIbu && tab==="daftar"&&(
          <div>
            <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:20}}>
              <h3 style={{margin:0,fontSize:20,fontWeight:900,color:"#111827"}}>Buku KIA Balita Bunda <span style={{color:"#F43F5E"}}>({myAnakList.length})</span></h3>
              <button onClick={()=>setShowFormAnak(!showFormAnak)} style={{background:"white",color:"#F43F5E",border:"none",borderRadius:16,padding:"12px 20px",fontSize:14,fontWeight:800,cursor:"pointer",boxShadow:"0 4px 12px rgba(244,63,94,0.15)"}}>{showFormAnak?"✕ Tutup Pendaftaran":"+ Daftarkan Balita"}</button>
            </div>
            
            {showFormAnak && (
              <div style={{background:"white",borderRadius:24,padding:32,boxShadow:"0 20px 40px -15px rgba(244,63,94,0.1)",marginBottom:24,border:"1px solid #FFF1F2"}}>
                <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:16}}>
                  <div><label style={LS}>Nama Buah Hati *</label><input value={formAnak.nama} onChange={e=>setFormAnak({...formAnak,nama:e.target.value,kk_id:authenticatedIbu.kk_id})} style={IS}/></div>
                  <div><label style={LS}>Tanggal Lahir *</label><input type="date" value={formAnak.tgl_lahir} onChange={e=>setFormAnak({...formAnak,tgl_lahir:e.target.value})} style={IS}/></div>
                  <div><label style={LS}>Gender</label><select value={formAnak.jenis_kelamin} onChange={e=>setFormAnak({...formAnak,jenis_kelamin:e.target.value})} style={IS}><option value="L">Laki-laki</option><option value="P">Perempuan</option></select></div>
                </div>
                <button onClick={simpanAnak} disabled={loading} style={{width:"100%",marginTop:20,background:"#F43F5E",color:"white",border:"none",borderRadius:16,padding:"16px",fontSize:15,fontWeight:800}}>{loading?"Menyimpan...":"💖 Simpan Data Anak"}</button>
              </div>
            )}
            
            <div style={{display:"grid",gridTemplateColumns:activeAnak?"1fr 1.6fr":"1fr",gap:24}}>
              <div style={{display:"flex",flexDirection:"column",gap:16}}>
                {myAnakList.map((a)=>(
                  <div key={a.id} onClick={()=>setActiveAnak(a)} style={{padding:20,borderRadius:20,background:"white",cursor:"pointer",border:`2px solid ${activeAnak?.id===a.id?"#F43F5E":"white"}`}}>
                    <div style={{fontWeight:900}}>{a.nama}</div>
                    <div style={{fontSize:12,color:"#6B7280"}}>{hitungUmurLabel(a.tgl_lahir)}</div>
                  </div>
                ))}
              </div>
              {activeAnak && (
                <div style={{background:"white",borderRadius:28,padding:32}}>
                   <h4 style={{margin:"0 0 20px",fontWeight:900}}>📈 Kurva Pertumbuhan</h4>
                   <GrafikBB data={activeTK} tgl_lahir={activeAnak.tgl_lahir}/>
                   <div style={{marginTop:20}}>
                     {activeTK.map(tk=>(
                       <div key={tk.id} style={{padding:12,borderBottom:"1px solid #EEE",display:"flex",justifyContent:"space-between"}}>
                         <span>{fmtTgl(tk.tanggal)}</span>
                         <b>{tk.bb_kg} kg</b>
                       </div>
                     ))}
                   </div>
                </div>
              )}
            </div>
          </div>
        )}

        {authenticatedIbu && tab==="input" && (
          <div style={{background:"white",borderRadius:28,padding:36}}>
            <h3 style={{fontWeight:900,marginBottom:20}}>⚖️ Timbangan Balita</h3>
            <div style={{marginBottom:20}}>
              <label style={LS}>Pilih Buah Hati Bunda *</label>
              <select value={formTK.anak_id} onChange={e=>setFormTK({...formTK,anak_id:e.target.value})} style={IS}>
                <option value="">-- Pilih Anak --</option>
                {myAnakList.map(a=><option key={a.id} value={a.id}>{a.nama}</option>)}
              </select>
            </div>
            <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:16}}>
              <div><label style={LS}>Berat (kg) *</label><input type="number" value={formTK.bb_kg} onChange={e=>setFormTK({...formTK,bb_kg:e.target.value})} style={IS}/></div>
              <div><label style={LS}>Tinggi (cm)</label><input type="number" value={formTK.tb_cm} onChange={e=>setFormTK({...formTK,tb_cm:e.target.value})} style={IS}/></div>
            </div>
            <button onClick={simpanTK} disabled={loading} style={{width:"100%",marginTop:24,background:"#10B981",color:"white",border:"none",borderRadius:16,padding:"16px",fontSize:16,fontWeight:900}}>{loading?"Menyimpan...":"💾 Simpan Timbangan"}</button>
          </div>
        )}

        {authenticatedIbu && tab==="imunisasi" && (
          <div style={{background:"white",borderRadius:28,padding:32}}>
            <h3 style={{fontWeight:900,marginBottom:20}}>💉 Kartu Vaksinasi</h3>
            <select onChange={e=>setActiveAnak(myAnakList.find(a=>a.id===e.target.value)||null)} style={IS}>
              <option value="">-- Pilih Anak --</option>
              {myAnakList.map(a=><option key={a.id} value={a.id}>{a.nama}</option>)}
            </select>
            {activeAnak && (
              <div style={{marginTop:20}}>
                {activeImun.map(im=>(
                  <div key={im.id} style={{padding:16,borderBottom:"1px solid #EEE",display:"flex",justifyContent:"space-between",alignItems:"center"}}>
                    <div>
                      <div style={{fontWeight:800}}>{im.jenis}</div>
                      <div style={{fontSize:12,color:"#6B7280"}}>Jadwal: {fmtTgl(im.tanggal_jadwal)}</div>
                    </div>
                    {im.status==="belum" ? (
                      <button onClick={()=>updateImunisasi(im.id)} style={{background:"#F43F5E",color:"white",border:"none",padding:"8px 16px",borderRadius:8}}>Beri Vaksin</button>
                    ) : <span style={{color:"#10B981",fontWeight:800}}>TUNTAS ✅</span>}
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
