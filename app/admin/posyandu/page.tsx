"use client";
import { useState, useEffect, useRef } from "react";
import "../admin-styles-heroic.css";
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

const LS={fontSize:11,fontWeight:800 as const,color:"#9CA3AF",letterSpacing:"0.08em",textTransform:"uppercase" as const,display:"block",marginBottom:6};
const IS={width:"100%",padding:"12px 16px",borderRadius:16,border:"2px solid #E5E7EB",fontSize:14,background:"#F9FAFB",outline:"none",boxSizing:"border-box" as const,fontFamily:"inherit",color:"#374151",fontWeight:600};

export default function AdminPosyanduPage(){
  const[anakList,setAnakList]=useState<Anak[]>([]);
  const[tkList,setTkList]=useState<TK[]>([]);
  const[imunList,setImunList]=useState<Imunisasi[]>([]);
  const[kkList,setKkList]=useState<any[]>([]);
  const[ibuList,setIbuList]=useState<any[]>([]);
  const[activeAnak,setActiveAnak]=useState<Anak|null>(null);
  const[tab,setTab]=useState<"daftar"|"scan"|"input"|"imunisasi">("daftar");
  const[scanning,setScanning]=useState(false);
  const[lastScan,setLastScan]=useState<{nama:string;namaAnak:string;poin:number}|null>(null);
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
    if(!isSupabaseReady())return;
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
    if(!formAnak.kk_id)return showToast("❌ Pilih KK dulu!",false);
    setLoading(true);
    const{data,error}=await supabase.from("anak_posyandu").insert({...formAnak,nama_ibu:formAnak.nama_ibu||"-"}).select().single();
    if(error)showToast(`❌ ${error.message}`,false);
    else{
      await generateJadwal(data.id,formAnak.tgl_lahir);
      showToast("💕 Anak terdaftar + jadwal imunisasi dibuat! 💉");
      setFormAnak({nama:"",tgl_lahir:"",jenis_kelamin:"L",nama_ibu:"",no_wa_ibu:"",kk_id:""});
      setShowFormAnak(false);
    }
    setLoading(false);fetchAll();
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
    if(gz.status==="buruk"||gz.status==="kurang")
      setTimeout(()=>showToast(`🚨 ${anak.nama} — ${gz.label}! Segera rujuk ke bidan!`,false),600);
    
    const ibu=ibuList.find(a=>a.kk_id===anak.kk_id);
    if(ibu){
      const hariIni=new Date().toISOString().split("T")[0];
      const{data:cek}=await supabase.from("riwayat_poin").select("id").eq("anggota_id",ibu.id).eq("sumber","posyandu").gte("created_at",`${hariIni}T00:00:00`).lte("created_at",`${hariIni}T23:59:59`).limit(1);
      if(!cek||cek.length===0){
        const { tambahPoin } = await import("@/lib/ecoReward");
        await tambahPoin({ anggotaId: ibu.id, kkId: anak.kk_id, jumlah: POIN_POSYANDU, sumber: "posyandu", keterangan: `Posyandu Ceria — ${anak.nama} — ${formTK.tanggal}` });
        showToast(`💕 Tersimpan! ${gz.label} | Ibu ${ibu.nama} +${POIN_POSYANDU} poin 🎉`);
      }else showToast(`💕 Tersimpan! Status: ${gz.label}`);
    }else showToast(`💕 Tersimpan! Status: ${gz.label}`);
    setFormTK({...formTK,bb_kg:"",tb_cm:"",lila_cm:"",lk_cm:"",catatan:""});
    setLoading(false);fetchAll();
  }

  async function nfcAbsensi(nfcId:string){
    const id=nfcId.replace(/:/g,"").toUpperCase();
    const currentIbuList = ibuListRef.current;
    const ibu=currentIbuList.find(a=>a.nfc_id===id);
    if(!ibu)return showToast(`❌ Kartu tidak terdaftar! (${id})`,false);
    
    const anak=anakList.filter(a=>a.kk_id===ibu.kk_id);
    if(anak.length===0)return showToast(`⚠️ Ibu ${ibu.nama} belum mendaftarkan sekecilnya`,false);
    
    const hariIni=new Date().toISOString().split("T")[0];
    const{data:cek}=await supabase.from("riwayat_poin").select("id").eq("anggota_id",ibu.id).eq("sumber","posyandu").gte("created_at",`${hariIni}T00:00:00`).lte("created_at",`${hariIni}T23:59:59`).limit(1);
    if(cek&&cek.length>0)return showToast(`⚠️ Ibu ${ibu.nama} sudah scan kartu hari ini!`,false);

    const { tambahPoin } = await import("@/lib/ecoReward");
    await tambahPoin({ anggotaId: ibu.id, kkId: ibu.kk_id, jumlah: POIN_POSYANDU, sumber: "posyandu", keterangan: `Tap NFC Posyandu Ceria — ${hariIni}` });

    setLastScan({nama:ibu.nama,namaAnak:anak.map(a=>a.nama).join(", "),poin:POIN_POSYANDU});
    showToast(`💕 Selamat datang ibu ${ibu.nama}! +${POIN_POSYANDU} poin 🎉`);
    fetchAll();
    }
  async function startNFC(){
    if(!("NDEFReader" in window))return showToast("⚠️ Pakai Chrome Android + aktifkan NFC dulu ya bunda!",false);
    try{
      const ndef=new (window as any).NDEFReader();
      nfcRef.current=ndef;await ndef.scan();setScanning(true);
      showToast("📡 NFC siap! Silakan ibu tempelkan kartu sehat...");
      ndef.addEventListener("reading",({serialNumber}:any)=>nfcAbsensi(serialNumber));
    }catch(e:any){showToast(`❌ Gagal: ${e?.message||"Error"}`,false);setScanning(false);}
  }
  function stopNFC(){
    try{nfcRef.current?.stop?.();}catch{}
    setScanning(false);setLastScan(null);
    showToast("Pemindai NFC dimatikan");
  }

  async function updateImunisasi(id:string){
    await supabase.from("imunisasi").update({tanggal_realisasi:new Date().toISOString().split("T")[0],status:"sudah"}).eq("id",id);
    showToast("💖 Vaksin masuk, Si Kecil kuat!");fetchAll();
  }
  async function tandaiTerlewat(id:string){
    await supabase.from("imunisasi").update({status:"terlewat"}).eq("id",id);
    showToast("⚠️ Vaksin ditandai terlewat");fetchAll();
  }

  const activeTK=tkList.filter(t=>t.anak_id===activeAnak?.id);
  const activeImun=imunList.filter(i=>i.anak_id===activeAnak?.id);
  const anakAlert=anakList.filter(a=>{const last=tkList.filter(t=>t.anak_id===a.id)[0];return last&&(statusGiziWHO(last.bb_kg,a.tgl_lahir).status==="buruk"||statusGiziWHO(last.bb_kg,a.tgl_lahir).status==="kurang");});
  const imunJatuhTempo=imunList.filter(im=>{if(im.status!=="belum")return false;const diff=(new Date(im.tanggal_jadwal).getTime()-new Date().getTime())/(1000*60*60*24);return diff>=0&&diff<=30;});

  return(
    <div className="admin-page heroic-bg" style={{ minHeight: "100vh", fontFamily: "'Segoe UI', system-ui, sans-serif" }}>
      {toast.msg&&<div style={{position:"fixed",top:20,left:"50%",transform:"translateX(-50%)",background:toast.ok?"#F43F5E":"#111827",color:"white",padding:"12px 24px",borderRadius:99,zIndex:999,fontSize:14,fontWeight:700,boxShadow:"0 10px 25px rgba(244,63,94,0.3)",width:"max-content"}}>{toast.msg}</div>}

      <header style={{background:"linear-gradient(135deg, #FDA4AF 0%, #F43F5E 100%)",color:"white",padding:"24px 24px 70px",borderBottomLeftRadius:40,borderBottomRightRadius:40,marginBottom:-40,boxShadow:"0 10px 30px rgba(244,63,94,0.2)",position:"relative",overflow:"hidden"}}>
        <div style={{position:"absolute",top:-20,right:-20,fontSize:160,opacity:0.1,transform:"rotate(15deg)"}}>🧸</div>
        
        <div style={{display:"flex",alignItems:"center",gap:12,marginBottom:24,position:"relative",zIndex:2}}>
          <a href="/admin" style={{color:"rgba(255,255,255,0.9)",textDecoration:"none",fontSize:13,fontWeight:700,background:"rgba(0,0,0,0.15)",padding:"8px 16px",borderRadius:99}}>← Dashboard Admin</a>
        </div>
        
        <div style={{position:"relative",zIndex:2}}>
          <div style={{fontSize:12,fontWeight:800,letterSpacing:"0.15em",color:"#FFE4E6",marginBottom:8}}>CLINIC & MATERNITY CIBURIAL</div>
          <h1 style={{margin:"0 0 10px",fontSize:32,fontWeight:900,letterSpacing:"-0.02em"}}>Posyandu Ceria 👶</h1>
          <p style={{margin:0,color:"rgba(255,255,255,0.9)",fontSize:15,maxWidth:450,lineHeight:1.6}}>Sentuhan kecil pagi ini, tumbuh kembang optimal esok hari. Pantau nutrisi dan imunisasi para balita desa tercinta.</p>
        </div>
      </header>

      <div style={{maxWidth:1000,margin:"0 auto",padding:"0 16px 40px",position:"relative",zIndex:10}}>
        
        <div style={{display:"flex",gap:10,overflowX:"auto",paddingBottom:20,scrollbarWidth:"none"}}>
          {(["daftar","scan","input","imunisasi"] as const).map(t=>(
            <button key={t} onClick={()=>setTab(t)} className="btn-heroic" style={{}}>
              {{daftar:"📋 Buku Balita",scan:"💳 Scan Bunda",input:"⚖️ Timbangan",imunisasi:"💉 Vaksin"}[t]}
              {t==="scan"&&scanning&&<span style={{width:10,height:10,background:"#F43F5E",borderRadius:"50%",animation:"pulse 1s infinite"}}/>}
              {t==="imunisasi"&&imunJatuhTempo.length>0&&<span style={{background:"#F43F5E",color:"white",borderRadius:"50%",width:20,height:20,fontSize:11,display:"flex",alignItems:"center",justifyContent:"center",fontWeight:800}}>{imunJatuhTempo.length}</span>}
            </button>
          ))}
        </div>

        {anakAlert.length>0&&(
          <div style={{background:"#FEF2F2",border:"2px solid #FECACA",borderRadius:20,padding:"16px 20px",marginBottom:24,display:"flex",alignItems:"center",gap:16,boxShadow:"0 4px 12px rgba(254,202,202,0.5)"}}>
            <span style={{fontSize:28}}>🚨</span>
            <div>
              <div style={{fontSize:15,color:"#991B1B",fontWeight:800,marginBottom:4}}>Tindakan Medis Diperlukan!</div>
              <div style={{fontSize:14,color:"#B91C1C",fontWeight:600}}>Mohon periksa data: {anakAlert.map(a=>a.nama).join(", ")}</div>
            </div>
          </div>
        )}

        {/* ── NFC SCAN ── */}
        {tab==="scan"&&(
          <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:24}}>
            <div className="card-heroic">
              <div style={{width:64,height:64,background:"#FFE4E6",borderRadius:20,display:"flex",alignItems:"center",justifyContent:"center",fontSize:32,margin:"0 auto 20px"}}>🤱</div>
              <h3 style={{margin:"0 0 8px",color:"#111827",fontSize:22,fontWeight:900}}>Verifikasi Kehadiran Bunda</h3>
              <p style={{fontSize:14,color:"#6B7280",margin:"0 0 32px",lineHeight:1.6}}>Sentuhkan Kartu Warga ke belakang layar untuk absensi. Ibu akan otomatis menerima poin apresiasi kader kesejahteraan.</p>
              
              <div style={{position:"relative",width:160,height:160,borderRadius:"50%",margin:"0 auto 30px",background:scanning?"#FFE4E6":"#F3F4F6",border:`4px ${scanning?"solid":"dashed"} ${scanning?"#F43F5E":"#D1D5DB"}`,display:"flex",alignItems:"center",justifyContent:"center",fontSize:60}}>
                {scanning?"📡":"💳"}
                {scanning&&<div style={{position:"absolute",inset:-10,borderRadius:"50%",border:"2px solid rgba(244,63,94,0.4)",animation:"ping 1.5s infinite"}}/>}
              </div>
              
              {lastScan&&(
                <div style={{background:"#ECFDF5",border:"2px solid #A7F3D0",borderRadius:20,padding:"16px",marginBottom:20,textAlign:"left"}}>
                  <div style={{fontWeight:800,fontSize:16,color:"#064E3B",marginBottom:4}}>💖 Halo, Ibu {lastScan.nama}!</div>
                  <div style={{fontSize:13,color:"#059669",fontWeight:600}}>Data Sekecil: {lastScan.namaAnak}</div>
                  <div style={{fontSize:15,color:"#10B981",fontWeight:900,marginTop:8}}>+ {lastScan.poin} Poin Sehat 🌟</div>
                </div>
              )}
              <button 
                onClick={scanning?stopNFC:startNFC} 
                style={{width:"100%",background:scanning?"#FFE4E6":"linear-gradient(135deg, #F43F5E 0%, #E11D48 100%)",color:scanning?"#E11D48":"white",border:scanning?"2px solid #FECACA":"none",borderRadius:16,padding:"16px",fontSize:16,fontWeight:800,cursor:"pointer",boxShadow:scanning?"none":"0 8px 20px rgba(225,29,72,0.3)"}}
              >
                {scanning?"⏹ Matikan Pindai":"Mulai Pindai Kartu Bunda ▶"}
              </button>
            </div>
          </div>
        )}

        {/* ── DAFTAR ANAK ── */}
        {tab==="daftar"&&(
          <div>
            <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:20}}>
              <h3 style={{margin:0,fontSize:20,fontWeight:900,color:"#111827"}}>Buku KIA Balita <span style={{color:"#F43F5E"}}>({anakList.length})</span></h3>
              <button onClick={()=>setShowFormAnak(!showFormAnak)} style={{background:"white",color:"#F43F5E",border:"none",borderRadius:16,padding:"12px 20px",fontSize:14,fontWeight:800,cursor:"pointer",boxShadow:"0 4px 12px rgba(244,63,94,0.15)"}}>
                {showFormAnak?"✕ Tutup Pendaftaran":"+ Daftarkan Biodata"}
              </button>
            </div>
            
            {showFormAnak&&(
              <div style={{background:"white",borderRadius:24,padding:32,boxShadow:"0 20px 40px -15px rgba(244,63,94,0.1)",marginBottom:24,border:"1px solid #FFF1F2"}}>
                <h4 style={{margin:"0 0 24px",fontSize:18,fontWeight:900,color:"#111827",display:"flex",alignItems:"center",gap:10}}><span style={{fontSize:24}}>🍼</span> Daftarkan Sang Buah Hati</h4>
                <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:16}}>
                  <div><label style={LS}>Kepala Keluarga *</label><select value={formAnak.kk_id} onChange={e=>setFormAnak({...formAnak,kk_id:e.target.value})} style={IS}><option value="">-- Pilih KK --</option>{kkList.map(k=><option key={k.id} value={k.id}>{k.kepala_keluarga} (RT {k.rt})</option>)}</select></div>
                  <div><label style={LS}>Nama Buah Hati *</label><input value={formAnak.nama} onChange={e=>setFormAnak({...formAnak,nama:e.target.value})} placeholder="Ketik nama lengkap..." style={IS}/></div>
                  <div><label style={LS}>Nama Ibu Panggilan</label><input value={formAnak.nama_ibu} onChange={e=>setFormAnak({...formAnak,nama_ibu:e.target.value})} placeholder="Cth: Ibu Anis" style={IS}/></div>
                  <div><label style={LS}>WhatsApp Bunda</label><input value={formAnak.no_wa_ibu} onChange={e=>setFormAnak({...formAnak,no_wa_ibu:e.target.value})} placeholder="08xxxxxxxxxx" style={IS}/></div>
                  <div><label style={LS}>Tanggal Lahir *</label><input type="date" value={formAnak.tgl_lahir} onChange={e=>setFormAnak({...formAnak,tgl_lahir:e.target.value})} style={IS}/></div>
                  <div><label style={LS}>Gender Hati</label><div style={{display:"flex",gap:8}}>{[{v:"L",l:"👦 Jagoan"},{v:"P",l:"👧 Putri"}].map(({v,l})=><button key={v} onClick={()=>setFormAnak({...formAnak,jenis_kelamin:v})} style={{flex:1,padding:"10px",borderRadius:12,border:`2px solid ${formAnak.jenis_kelamin===v?"#F43F5E":"#E5E7EB"}`,cursor:"pointer",background:formAnak.jenis_kelamin===v?"#FFF1F2":"#F9FAFB",color:formAnak.jenis_kelamin===v?"#F43F5E":"#6B7280",fontSize:13,fontWeight:800}}>{l}</button>)}</div></div>
                </div>
                <div style={{marginTop:16,padding:"12px 16px",background:"#F0FDF4",borderRadius:12,fontSize:13,color:"#059669",fontWeight:600,display:"flex",alignItems:"center",gap:10}}>
                  <span>📌</span> Jadwal imunisasi 9 bulan otomatis akan didaftarkan sistem.
                </div>
                <div style={{display:"flex",gap:12,marginTop:24}}>
                  <button onClick={simpanAnak} disabled={loading} style={{flex:1,background:"linear-gradient(135deg, #F43F5E 0%, #E11D48 100%)",color:"white",border:"none",borderRadius:16,padding:"16px",fontSize:15,fontWeight:800,cursor:loading?"not-allowed":"pointer",boxShadow:"0 8px 20px rgba(225,29,72,0.3)"}}>{loading?"Menyiapkan Berkas...":"💖 Simpan Data Anak"}</button>
                  <button onClick={()=>setShowFormAnak(false)} style={{padding:"16px 24px",background:"white",border:"2px solid #E5E7EB",borderRadius:16,fontSize:15,fontWeight:800,color:"#6B7280",cursor:"pointer"}}>Batalkan</button>
                </div>
              </div>
            )}
            
            <div style={{display:"grid",gridTemplateColumns:activeAnak?"1fr 1.6fr":"1fr",gap:24,alignItems:"start"}}>
              
              <div style={{display:"flex",flexDirection:"column",gap:16}}>
                {anakList.length===0?<div style={{background:"white",borderRadius:24,padding:40,textAlign:"center",color:"#9CA3AF",border:"2px dashed #E5E7EB"}}><div style={{fontSize:48,marginBottom:12}}>💤</div>Belum ada sekecil yang tercatat.</div>
                :anakList.map((a)=>{
                  const last=tkList.filter(t=>t.anak_id===a.id)[0];
                  const gz=last?statusGiziWHO(last.bb_kg,a.tgl_lahir):null;
                  const sudah=imunList.filter(im=>im.anak_id===a.id&&im.status==="sudah").length;
                  const total=imunList.filter(im=>im.anak_id===a.id).length;
                  const isActive = activeAnak?.id===a.id;
                  
                  return(
                    <div key={a.id} onClick={()=>setActiveAnak(isActive?null:a)} style={{padding:"20px",borderRadius:20,border:`2px solid ${isActive?"#FDA4AF":"white"}`,background:"white",cursor:"pointer",boxShadow:isActive?"0 12px 30px rgba(244,63,94,0.15)":"0 4px 12px rgba(0,0,0,0.03)",display:"flex",alignItems:"flex-start",gap:16,transition:"all 0.2s"}}>
                      <div style={{width:48,height:48,borderRadius:16,background:a.jenis_kelamin==="L"?"#EFF6FF":"#FDF2F8",display:"flex",alignItems:"center",justifyContent:"center",fontSize:24,flexShrink:0,boxShadow:a.jenis_kelamin==="L"?"0 4px 12px rgba(59,130,246,0.15)":"0 4px 12px rgba(236,72,153,0.15)"}}>
                        {a.jenis_kelamin==="L"?"🪀":"🧸"}
                      </div>
                      <div style={{flex:1}}>
                        <div style={{fontWeight:900,fontSize:16,color:"#111827",marginBottom:4}}>{a.nama}</div>
                        <div style={{fontSize:13,color:"#6B7280",fontWeight:600}}>{hitungUmurLabel(a.tgl_lahir)} • Bunda {a.nama_ibu}</div>
                        <div style={{fontSize:12,color:"#9CA3AF",fontWeight:700,marginTop:8}}>💉 Vaksinasi {sudah}/{total}</div>
                      </div>
                      {gz&&<div style={{background:gz.color,color:"white",borderRadius:99,padding:"6px 12px",fontSize:11,fontWeight:800,boxShadow:`0 4px 10px ${gz.color}40`,whiteSpace:"nowrap"}}>{gz.status.toUpperCase()}</div>}
                    </div>
                  );
                })}
              </div>
              
              {activeAnak&&(
                <div style={{animation:"fadeIn 0.3s ease-out"}}>
                  <div style={{background:"white",borderRadius:28,padding:"24px 32px",marginBottom:24,boxShadow:"0 10px 30px rgba(244,63,94,0.1)",border:"1px solid #FFF1F2",position:"relative",overflow:"hidden"}}>
                    <div style={{position:"absolute",top:0,left:0,bottom:0,width:8,background:"#F43F5E"}}/>
                    <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start"}}>
                      <div>
                        <div style={{fontWeight:900,fontSize:24,color:"#111827",letterSpacing:"-0.02em",marginBottom:6}}>{activeAnak.nama}</div>
                        <div style={{fontSize:14,color:"#6B7280",fontWeight:600,display:"flex",gap:12,alignItems:"center"}}>
                          <span style={{background:"#F3F4F6",padding:"4px 10px",borderRadius:8}}>🎂 {hitungUmurLabel(activeAnak.tgl_lahir)}</span>
                          <span>Bunda: <b>{activeAnak.nama_ibu}</b></span>
                        </div>
                      </div>
                      <div style={{display:"flex",gap:10}}>
                        <button onClick={()=>{setTab("input");setFormTK({...formTK,anak_id:activeAnak.id});}} style={{background:"#FEF2F2",border:"none",borderRadius:12,padding:"10px 16px",color:"#E11D48",cursor:"pointer",fontSize:14,fontWeight:800}}>⚖️ Timbang</button>
                        <button onClick={()=>setTab("imunisasi")} style={{background:"#FEF2F2",border:"none",borderRadius:12,padding:"10px 16px",color:"#E11D48",cursor:"pointer",fontSize:14,fontWeight:800}}>💉 Vaksin</button>
                      </div>
                    </div>
                  </div>
                  
                  <div style={{background:"white",borderRadius:28,padding:32,boxShadow:"0 10px 25px rgba(0,0,0,0.03)",border:"1px solid #E5E7EB",marginBottom:24}}>
                    <h4 style={{margin:"0 0 20px",fontSize:15,fontWeight:900,color:"#111827",textTransform:"uppercase",letterSpacing:"0.1em",display:"flex",alignItems:"center",gap:10}}><span style={{fontSize:20}}>📈</span> Riwayat Tumbuh Kembang</h4>
                    <GrafikBB data={activeTK} tgl_lahir={activeAnak.tgl_lahir}/>
                  </div>
                  
                  <div style={{background:"white",borderRadius:28,border:"1px solid #E5E7EB",overflow:"hidden",boxShadow:"0 10px 25px rgba(0,0,0,0.03)"}}>
                    <div style={{padding:"20px 24px",borderBottom:"1px solid #F3F4F6",background:"#F9FAFB"}}>
                      <span style={{fontSize:14,fontWeight:800,color:"#374151",textTransform:"uppercase",letterSpacing:"0.05em"}}>Log Pencatatan Buku Gizi</span>
                    </div>
                    {activeTK.length===0?<div style={{padding:40,textAlign:"center",color:"#9CA3AF",fontSize:14,fontWeight:600}}>Buku log masih kosong buntik! 😊</div>
                    :activeTK.map((tk,i)=>{
                      const gz=statusGiziWHO(tk.bb_kg,activeAnak.tgl_lahir);
                      return(
                        <div key={tk.id} style={{padding:"16px 24px",borderBottom:i<activeTK.length-1?"1px solid #F3F4F6":"none",display:"flex",alignItems:"center",gap:16}}>
                          <div style={{flex:1}}>
                            <div style={{fontWeight:800,fontSize:15,color:"#111827",marginBottom:4}}>{fmtTgl(tk.tanggal)}</div>
                            <div style={{fontSize:14,color:"#4B5563",fontWeight:600}}>⚖️ {tk.bb_kg} kg <span style={{color:"#D1D5DB",margin:"0 6px"}}>|</span> 📏 {tk.tb_cm||"-"} cm</div>
                          </div>
                          <div style={{background:gz.color,color:"white",borderRadius:99,padding:"6px 14px",fontSize:12,fontWeight:800}}>{gz.label}</div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {/* ── INPUT ── */}
        {tab==="input"&&(
          <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:24}}>
            <div style={{background:"white",borderRadius:28,padding:36,boxShadow:"0 20px 40px -15px rgba(244,63,94,0.1)",border:"1px solid #FFF1F2"}}>
              <h3 style={{margin:"0 0 8px",fontSize:22,fontWeight:900,color:"#111827",display:"flex",alignItems:"center",gap:12}}>⚖️ Timbangan Balita</h3>
              <p style={{margin:"0 0 28px",fontSize:14,color:"#6B7280",lineHeight:1.6,fontWeight:600}}>Pencatatan angka berat badan akurat. Bunda berhak +{POIN_POSYANDU} Poin Apresiasi atas kontribusinya hari ini!</p>
              
              <div style={{marginBottom:20}}><label style={LS}>Nama Si Kecil *</label><select value={formTK.anak_id} onChange={e=>setFormTK({...formTK,anak_id:e.target.value})} style={IS}><option value="">-- Coba ketik & pilih anak --</option>{anakList.map(a=><option key={a.id} value={a.id}>{a.nama}</option>)}</select></div>
              
              {formTK.anak_id&&formTK.bb_kg&&(()=>{const anak=anakList.find(a=>a.id===formTK.anak_id);const gz=anak?statusGiziWHO(Number(formTK.bb_kg),anak.tgl_lahir):null;return gz?<div style={{padding:"12px 16px",background:gz.color+"1A",border:`2px solid ${gz.color}40`,borderRadius:16,marginBottom:20,fontSize:14,color:gz.color,fontWeight:800,display:"flex",alignItems:"center",gap:10}}><span style={{fontSize:18}}>🔬</span> Analisa Instan: <span style={{marginLeft:"auto"}}>{gz.label}</span></div>:null;})()}
              
              <div style={{marginBottom:20}}><label style={LS}>Tanggal Kontrol</label><input type="date" value={formTK.tanggal} onChange={e=>setFormTK({...formTK,tanggal:e.target.value})} style={IS}/></div>
              
              <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:16,marginBottom:20}}>
                {[{label:"Berat (kg) *",key:"bb_kg",ph:"Contoh: 8.5"},{label:"Tinggi (cm)",key:"tb_cm",ph:"Contoh: 75"},{label:"Lingk. Lengan",key:"lila_cm",ph:"cm"},{label:"Lingk. Kepala",key:"lk_cm",ph:"cm"}].map(f=>(
                  <div key={f.key}><label style={LS}>{f.label}</label><input type="number" value={(formTK as any)[f.key]} onChange={e=>setFormTK({...formTK,[f.key]:e.target.value})} placeholder={f.ph} style={IS}/></div>
                ))}
              </div>
              <div style={{marginBottom:24}}><label style={LS}>Pesan / Keluhan Bunda</label><textarea value={formTK.catatan} onChange={e=>setFormTK({...formTK,catatan:e.target.value})} placeholder="Catatan asupan ASI, MPASI, alergi dsb..." rows={3} style={{...IS,resize:"none"}}/></div>
              <button onClick={simpanTK} disabled={loading} className="btn-heroic" style={{ width:"100%" }}>{loading?"Menyimpan Riwayat...":"💾 Kunci Data Sekecil"}</button>
            </div>
            
            <div style={{display:"flex",flexDirection:"column",gap:20}}>
              <div style={{background:"#F0FDF4",borderRadius:24,padding:28,border:"2px solid #BBF7D0"}}>
                <h4 style={{margin:"0 0 16px",fontSize:15,fontWeight:900,color:"#064E3B",textTransform:"uppercase",letterSpacing:"0.05em",display:"flex",alignItems:"center",gap:10}}><span style={{fontSize:20}}>📏</span> Indikator Standar WHO</h4>
                <div style={{display:"flex",flexDirection:"column",gap:12}}>
                  {[{c:"#10B981",l:"Gizi Baik ✅",d:"Aman. Di atas 90% berat ideal usianya."},{c:"#F97316",l:"Gizi Kurang ⚠️",d:"75-90% batas normal. Perlu booster MPASI."},{c:"#EF4444",l:"Gizi Buruk 🚨",d:"Di bawah 75%! Tindakan medis segera direkomendasikan."},{c:"#F59E0B",l:"Gizi Lebih ⚠️",d:"Berlebih 110%. Konsultasi untuk pencegahan dini obesitas."}].map(g=>(
                    <div key={g.l} style={{display:"flex",gap:12,alignItems:"center",background:"white",padding:"12px 16px",borderRadius:16}}>
                      <div style={{width:14,height:14,borderRadius:"50%",background:g.c,flexShrink:0}}/>
                      <div>
                        <div style={{fontSize:14,fontWeight:800,color:g.c}}>{g.l}</div>
                        <div style={{fontSize:12,color:"#6B7280",fontWeight:600}}>{g.d}</div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ── IMUNISASI ── */}
        {tab==="imunisasi"&&(
          <div style={{maxWidth:700,margin:"0 auto"}}>
            {imunJatuhTempo.length>0&&(
              <div style={{background:"#FEF2F2",border:"2px solid #FECACA",borderRadius:24,padding:"24px",marginBottom:24,boxShadow:"0 8px 20px rgba(239,68,68,0.1)"}}>
                <div style={{fontWeight:900,fontSize:16,color:"#B91C1C",marginBottom:16,display:"flex",alignItems:"center",gap:10}}><span style={{fontSize:24}}>🚨</span> Jatuh Tempo Imunisasi!</div>
                <div style={{display:"flex",flexDirection:"column",gap:10}}>
                  {imunJatuhTempo.slice(0,5).map(im=>{
                    const anak=anakList.find(a=>a.id===im.anak_id);
                    const hari=Math.ceil((new Date(im.tanggal_jadwal).getTime()-new Date().getTime())/(1000*60*60*24));
                    return(
                      <div key={im.id} style={{display:"flex",justifyContent:"space-between",alignItems:"center",padding:"12px 16px",background:"white",borderRadius:12}}>
                        <span style={{fontSize:15,color:"#111827",fontWeight:600}}><b>{anak?.nama}</b> <span style={{color:"#D1D5DB",margin:"0 8px"}}>|</span> {im.jenis}</span>
                        <span style={{fontSize:14,color:"white",background:"#EF4444",padding:"4px 12px",borderRadius:99,fontWeight:800}}>{hari===0?"Sekarang!":hari===1?"Besok Pagi!":`${hari} Hari Terlewat`}</span>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
            
            <div style={{marginBottom:24}}>
              <label style={LS}>Pilih Lembar KIA Bayi</label>
              <select onChange={e=>setActiveAnak(anakList.find(a=>a.id===e.target.value)||null)} style={{...IS,background:"white",border:"2px solid #F43F5E",color:"#BE123C"}}>
                <option value="">-- Cari Nama Anak --</option>
                {anakList.map(a=><option key={a.id} value={a.id}>{a.nama}</option>)}
              </select>
            </div>
            
            {activeAnak&&(
              <div style={{background:"white",borderRadius:28,border:"1px solid #E5E7EB",overflow:"hidden",boxShadow:"0 10px 30px rgba(0,0,0,0.05)"}}>
                <div style={{padding:"24px 32px",borderBottom:"1px solid #F3F4F6",background:"#FFF1F2"}}>
                  <div style={{fontWeight:900,fontSize:20,color:"#9F1239",marginBottom:4}}>Kartu Vaksin: {activeAnak.nama}</div>
                  <div style={{fontSize:13,color:"#E11D48",fontWeight:700,marginBottom:12}}>Siklus dasar: {activeImun.filter(i=>i.status==="sudah").length}/{activeImun.length} Tahap Selesai</div>
                  <div style={{height:10,background:"white",borderRadius:99,overflow:"hidden"}}>
                    <div style={{height:"100%",width:`${activeImun.length>0?(activeImun.filter(i=>i.status==="sudah").length/activeImun.length)*100:0}%`,background:"linear-gradient(90deg, #F43F5E, #10B981)",borderRadius:99,transition:"width 1s cubic-bezier(0.4, 0, 0.2, 1)"}}/>
                  </div>
                </div>
                
                {activeImun.length===0?<div style={{padding:40,textAlign:"center",color:"#9CA3AF",fontSize:14,fontWeight:600}}>Data vaksin kosong. Harap sinkronisasi sistem pendaftaran.</div>
                :activeImun.map((im,i)=>{
                  const jadwal=JADWAL_IMUNISASI.find(j=>j.jenis===im.jenis);
                  const lewat=im.status==="belum"&&new Date(im.tanggal_jadwal)<new Date();
                  const SC={sudah:"#10B981",terlewat:"#9CA3AF",belum:lewat?"#EF4444":"#F59E0B"};
                  const SL={sudah:"✅ Tuntas",terlewat:"❌ Gugur",belum:lewat?"⚠️ Terlewat!":"🕐 Terjadwal"};
                  const sc=SC[im.status as keyof typeof SC]||"#9A8C85";
                  
                  return(
                    <div key={im.id} style={{padding:"20px 32px",borderBottom:i<activeImun.length-1?"1px solid #F3F4F6":"none",display:"flex",alignItems:"center",gap:20,transition:"all 0.2s"}}>
                      <div style={{fontSize:28,filter:im.status==="sudah"?"none":"grayscale(1) opacity(0.5)"}}>💉</div>
                      <div style={{flex:1}}>
                        <div style={{fontWeight:900,fontSize:16,color:"#111827",marginBottom:4}}>{jadwal?.label||im.jenis}</div>
                        <div style={{fontSize:13,color:"#6B7280",fontWeight:600}}>Tenggat Fase: {fmtTgl(im.tanggal_jadwal)} {im.tanggal_realisasi&&<span style={{color:"#10B981"}}> • Disuntik: {fmtTgl(im.tanggal_realisasi)}</span>}</div>
                      </div>
                      <div style={{display:"flex",alignItems:"center",gap:10}}>
                        <span style={{background:im.status==="sudah"?sc:sc+"15",color:im.status==="sudah"?"white":sc,borderRadius:8,padding:"6px 14px",fontSize:12,fontWeight:800}}>{SL[im.status as keyof typeof SL]}</span>
                        {im.status==="belum"&&(
                          <div style={{display:"flex",gap:8}}>
                            <button onClick={()=>updateImunisasi(im.id)} style={{background:"#D1FAE5",border:"none",borderRadius:10,padding:"8px 12px",cursor:"pointer",fontSize:13,color:"#059669",fontWeight:800,boxShadow:"0 4px 10px rgba(16,185,129,0.2)"}}>Beri Vaksin</button>
                            {lewat&&<button onClick={()=>tandaiTerlewat(im.id)} style={{background:"white",border:"2px solid #E5E7EB",borderRadius:10,padding:"8px 12px",cursor:"pointer",fontSize:13,color:"#9CA3AF",fontWeight:800}}>Lewati</button>}
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}
      </div>
      <style>{`
        @keyframes pulse{0%,100%{opacity:1;transform:scale(1)}50%{opacity:0.6;transform:scale(1.2)}}
        @keyframes ping{0%{transform:scale(1);opacity:0.8}100%{transform:scale(1.6);opacity:0}}
        @keyframes fadeIn{from{opacity:0;transform:translateY(10px)}to{opacity:1;transform:translateY(0)}}
      `}</style>
    </div>
  );
}
