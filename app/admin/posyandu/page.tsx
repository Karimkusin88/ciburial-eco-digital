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
  if(r>=1.1)return{status:"lebih",  color:"#b8943f",label:"Gizi Lebih ⚠️"};
  if(r>=0.9)return{status:"normal", color:"#2d5a40",label:"Gizi Baik ✅"};
  if(r>=0.75)return{status:"kurang",color:"#e07b00",label:"Gizi Kurang ⚠️"};
  return{status:"buruk",color:"#8b0000",label:"Gizi Buruk 🚨"};
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
  if(data.length<2)return<div style={{textAlign:"center",padding:"20px",color:"#a8b5a9",fontSize:12}}>Butuh minimal 2 data untuk grafik</div>;
  const sorted=[...data].sort((a,b)=>a.tanggal.localeCompare(b.tanggal));
  const maxBB=Math.max(...sorted.map(d=>d.bb_kg))*1.15;
  const minBB=Math.max(0,Math.min(...sorted.map(d=>d.bb_kg))*0.85);
  const W=300,H=130,P=32;
  const xS=(W-P*2)/(sorted.length-1);
  const yS=(v:number)=>H-P-((v-minBB)/(maxBB-minBB))*(H-P*2);
  const pts=sorted.map((d,i)=>({x:P+i*xS,y:yS(d.bb_kg),bb:d.bb_kg,tgl:d.tanggal}));
  const path=pts.map((p,i)=>`${i===0?"M":"L"}${p.x.toFixed(1)},${p.y.toFixed(1)}`).join(" ");
  const area=`${path} L${pts[pts.length-1].x},${H-P} L${P},${H-P} Z`;
  return(
    <div style={{overflowX:"auto"}}>
      <svg width={W} height={H} style={{display:"block",margin:"0 auto"}}>
        {[0,0.5,1].map(t=>{
          const y=P+(1-t)*(H-P*2);
          return<line key={t} x1={P} y1={y} x2={W-P} y2={y} stroke="rgba(45,90,64,0.08)" strokeWidth={1}/>;
        })}
        <path d={area} fill="rgba(45,90,64,0.07)"/>
        <path d={path} fill="none" stroke="#2d5a40" strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round"/>
        {pts.map((p,i)=>{
          const gz=statusGiziWHO(p.bb,tgl_lahir);
          return(
            <g key={i}>
              <circle cx={p.x} cy={p.y} r={5} fill={gz.color} stroke="white" strokeWidth={2}/>
              <text x={p.x} y={p.y-9} fontSize={9} textAnchor="middle" fill={gz.color} fontWeight="700">{p.bb}</text>
              <text x={p.x} y={H-P+12} fontSize={8} textAnchor="middle" fill="#a8b5a9">
                {new Date(p.tgl).toLocaleDateString("id-ID",{month:"short"})}
              </text>
            </g>
          );
        })}
      </svg>
    </div>
  );
}

const LS={fontSize:11,fontWeight:700 as const,color:"#6b7c6d",letterSpacing:"0.06em",textTransform:"uppercase" as const,display:"block",marginBottom:4};
const IS={width:"100%",padding:"9px 12px",borderRadius:10,border:"1.5px solid rgba(45,90,64,0.2)",fontSize:13,background:"#fafaf8",outline:"none",boxSizing:"border-box" as const,fontFamily:"inherit"};

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
  const nfcRef=useRef<any>(null);

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
      showToast("✅ Anak terdaftar + jadwal imunisasi dibuat! 💉");
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
      bb_kg:Number(formTK.bb_kg),
      tb_cm:formTK.tb_cm?Number(formTK.tb_cm):null,
      lila_cm:formTK.lila_cm?Number(formTK.lila_cm):null,
      lk_cm:formTK.lk_cm?Number(formTK.lk_cm):null,
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
        await supabase.from("anggota_kk").update({saldo_poin:(ibu.saldo_poin||0)+POIN_POSYANDU}).eq("id",ibu.id);
        await supabase.from("riwayat_poin").insert({anggota_id:ibu.id,kk_id:anak.kk_id,jumlah:POIN_POSYANDU,jenis:"masuk",sumber:"posyandu",keterangan:`Posyandu — ${anak.nama} — ${formTK.tanggal}`});
        showToast(`✅ Tersimpan! ${gz.label} | ${ibu.nama} +${POIN_POSYANDU} poin 🎉`);
      }else showToast(`✅ Tersimpan! Status: ${gz.label}`);
    }else showToast(`✅ Tersimpan! Status: ${gz.label}`);
    setFormTK({...formTK,bb_kg:"",tb_cm:"",lila_cm:"",lk_cm:"",catatan:""});
    setLoading(false);fetchAll();
  }

  async function nfcAbsensi(nfcId:string){
    const id=nfcId.replace(/:/g,"").toUpperCase();
    const ibu=ibuList.find(a=>a.nfc_id===id);
    if(!ibu)return showToast(`❌ Kartu tidak terdaftar! (${id})`,false);
    const anak=anakList.filter(a=>a.kk_id===ibu.kk_id);
    if(anak.length===0)return showToast(`⚠️ ${ibu.nama} belum punya anak di posyandu`,false);
    const hariIni=new Date().toISOString().split("T")[0];
    const{data:cek}=await supabase.from("riwayat_poin").select("id").eq("anggota_id",ibu.id).eq("sumber","posyandu").gte("created_at",`${hariIni}T00:00:00`).lte("created_at",`${hariIni}T23:59:59`).limit(1);
    if(cek&&cek.length>0)return showToast(`⚠️ ${ibu.nama} sudah dapat poin hari ini!`,false);
    await supabase.from("anggota_kk").update({saldo_poin:(ibu.saldo_poin||0)+POIN_POSYANDU}).eq("id",ibu.id);
    await supabase.from("riwayat_poin").insert({anggota_id:ibu.id,kk_id:ibu.kk_id,jumlah:POIN_POSYANDU,jenis:"masuk",sumber:"posyandu",keterangan:`Tap NFC posyandu — ${hariIni}`});
    setLastScan({nama:ibu.nama,namaAnak:anak.map(a=>a.nama).join(", "),poin:POIN_POSYANDU});
    showToast(`✅ ${ibu.nama} hadir! +${POIN_POSYANDU} poin 🎉`);
    fetchAll();
  }

  async function startNFC(){
    if(!("NDEFReader" in window))return showToast("⚠️ Pakai Chrome Android + aktifkan NFC dulu!",false);
    try{
      const ndef=new (window as any).NDEFReader();
      nfcRef.current=ndef;await ndef.scan();setScanning(true);
      showToast("📡 NFC aktif! Tempelkan kartu ibu...");
      ndef.addEventListener("reading",({serialNumber}:any)=>nfcAbsensi(serialNumber));
    }catch(e:any){showToast(`❌ Gagal: ${e?.message||"Error"}`,false);setScanning(false);}
  }
  function stopNFC(){
    try{nfcRef.current?.stop?.();}catch{}
    setScanning(false);setLastScan(null);
    showToast("NFC dimatikan");
  }

  async function updateImunisasi(id:string){
    await supabase.from("imunisasi").update({tanggal_realisasi:new Date().toISOString().split("T")[0],status:"sudah"}).eq("id",id);
    showToast("✅ Imunisasi dicatat!");fetchAll();
  }
  async function tandaiTerlewat(id:string){
    await supabase.from("imunisasi").update({status:"terlewat"}).eq("id",id);
    showToast("⚠️ Ditandai terlewat");fetchAll();
  }

  const activeTK=tkList.filter(t=>t.anak_id===activeAnak?.id);
  const activeImun=imunList.filter(i=>i.anak_id===activeAnak?.id);
  const anakAlert=anakList.filter(a=>{const last=tkList.filter(t=>t.anak_id===a.id)[0];return last&&(statusGiziWHO(last.bb_kg,a.tgl_lahir).status==="buruk"||statusGiziWHO(last.bb_kg,a.tgl_lahir).status==="kurang");});
  const imunJatuhTempo=imunList.filter(im=>{if(im.status!=="belum")return false;const diff=(new Date(im.tanggal_jadwal).getTime()-new Date().getTime())/(1000*60*60*24);return diff>=0&&diff<=30;});

  return(
    <div style={{minHeight:"100vh",background:"#f5f0e8",fontFamily:"'Segoe UI',system-ui,sans-serif"}}>
      {toast.msg&&<div style={{position:"fixed",top:20,left:"50%",transform:"translateX(-50%)",background:toast.ok?"#2d5a40":"#dc3545",color:"white",padding:"10px 20px",borderRadius:12,zIndex:999,fontSize:14,boxShadow:"0 4px 20px rgba(0,0,0,0.15)",maxWidth:"85vw",textAlign:"center"}}>{toast.msg}</div>}

      <header style={{background:"#f5f0e8",borderBottom:"1px solid rgba(45,90,64,0.12)",padding:"14px 20px",position:"sticky",top:0,zIndex:10,display:"flex",alignItems:"center",justifyContent:"space-between"}}>
        <div style={{display:"flex",alignItems:"center",gap:12}}>
          <a href="/admin" style={{color:"#6b7c6d",textDecoration:"none",fontSize:13}}>← Admin</a>
          <span style={{color:"#c8bfaa"}}>|</span>
          <div>
            <div style={{fontWeight:800,fontSize:15,color:"#1a2e1f"}}>👶 Posyandu Digital</div>
            <div style={{fontSize:10,color:"#7a9a7e",textTransform:"uppercase",letterSpacing:"0.08em"}}>{anakList.length} Anak · +{POIN_POSYANDU} Poin{anakAlert.length>0?` · ⚠️ ${anakAlert.length} perhatian`:""}</div>
          </div>
        </div>
        <div style={{display:"flex",gap:5,flexWrap:"wrap"}}>
          {(["daftar","scan","input","imunisasi"] as const).map(t=>(
            <button key={t} onClick={()=>setTab(t)} style={{padding:"6px 11px",borderRadius:20,fontSize:11,fontWeight:600,border:"1.5px solid rgba(45,90,64,0.2)",cursor:"pointer",background:tab===t?"#2d5a40":"transparent",color:tab===t?"white":"#6b7c6d",position:"relative"}}>
              {{daftar:"📋 Daftar",scan:"📡 NFC",input:"➕ Input",imunisasi:"💉 Imunisasi"}[t]}
              {t==="scan"&&scanning&&<span style={{position:"absolute",top:-3,right:-3,width:8,height:8,background:"#4a8c5c",borderRadius:"50%",animation:"pulse 1s infinite",display:"block"}}/>}
              {t==="imunisasi"&&imunJatuhTempo.length>0&&<span style={{position:"absolute",top:-4,right:-4,background:"#dc3545",color:"white",borderRadius:"50%",width:15,height:15,fontSize:8,display:"flex",alignItems:"center",justifyContent:"center",fontWeight:800}}>{imunJatuhTempo.length}</span>}
            </button>
          ))}
        </div>
      </header>

      <div style={{maxWidth:1000,margin:"0 auto",padding:"20px 16px"}}>

        {anakAlert.length>0&&(
          <div style={{background:"rgba(139,0,0,0.08)",border:"1px solid rgba(139,0,0,0.2)",borderRadius:12,padding:"10px 16px",marginBottom:16,display:"flex",alignItems:"center",gap:10}}>
            <span style={{fontSize:18}}>🚨</span>
            <span style={{fontSize:13,color:"#8b0000",fontWeight:600}}>Perlu Perhatian: {anakAlert.map(a=>a.nama).join(", ")}</span>
          </div>
        )}

        {/* ── NFC SCAN ── */}
        {tab==="scan"&&(
          <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:16}}>
            <div style={{background:"white",borderRadius:16,padding:24,border:"1px solid rgba(45,90,64,0.1)",boxShadow:"0 1px 6px rgba(0,0,0,0.04)",textAlign:"center"}}>
              <h3 style={{margin:"0 0 4px",color:"#1a2e1f",fontSize:15}}>📡 Absensi via NFC</h3>
              <p style={{fontSize:12,color:"#7a9a7e",margin:"0 0 20px"}}>Ibu tap kartu → absen + poin otomatis</p>
              <div style={{position:"relative",width:120,height:120,borderRadius:"50%",margin:"0 auto 16px",background:scanning?"rgba(45,90,64,0.08)":"rgba(45,90,64,0.04)",border:`3px ${scanning?"solid":"dashed"} ${scanning?"#2d5a40":"rgba(45,90,64,0.2)"}`,display:"flex",alignItems:"center",justifyContent:"center",fontSize:44}}>
                👶
                {scanning&&<div style={{position:"absolute",inset:-6,borderRadius:"50%",border:"2px solid rgba(45,90,64,0.3)",animation:"ping 1.5s infinite"}}/>}
              </div>
              {lastScan&&(
                <div style={{background:"rgba(45,90,64,0.06)",border:"1px solid rgba(45,90,64,0.15)",borderRadius:12,padding:"12px 16px",marginBottom:14,textAlign:"left"}}>
                  <div style={{fontWeight:800,fontSize:14,color:"#1a2e1f"}}>✅ {lastScan.nama}</div>
                  <div style={{fontSize:12,color:"#7a9a7e"}}>Anak: {lastScan.namaAnak}</div>
                  <div style={{fontSize:14,color:"#2d5a40",fontWeight:700,marginTop:4}}>+{lastScan.poin} poin! 🎉</div>
                </div>
              )}
              <button onClick={scanning?stopNFC:startNFC} style={{width:"100%",background:scanning?"rgba(220,53,69,0.1)":"#2d5a40",color:scanning?"#dc3545":"white",border:scanning?"1.5px solid rgba(220,53,69,0.3)":"none",borderRadius:12,padding:"13px",fontSize:14,fontWeight:700,cursor:"pointer"}}>
                {scanning?"⏹ Stop NFC":"▶ Aktifkan NFC"}
              </button>
              <p style={{fontSize:11,color:"#a8b5a9",marginTop:10}}>Chrome Android + NFC aktif</p>
            </div>
            <div>
              <div style={{background:"white",borderRadius:16,padding:18,border:"1px solid rgba(45,90,64,0.1)",boxShadow:"0 1px 6px rgba(0,0,0,0.04)",marginBottom:12}}>
                <h4 style={{margin:"0 0 12px",fontSize:13,fontWeight:700,color:"#1a2e1f"}}>🏆 Cara Kerja</h4>
                {[{n:"1",t:"Ibu tap kartu NFC",d:"Tempelkan kartu ke belakang HP admin"},{n:"2",t:"Cek otomatis",d:"Sistem cari data ibu & balita"},{n:"3",t:`+${POIN_POSYANDU} poin masuk`,d:"Langsung ke saldo ibu (1x/hari)"},{n:"4",t:"Input data anak",d:"Admin input BB/TB di tab Input"}].map(s=>(
                  <div key={s.n} style={{display:"flex",gap:10,marginBottom:10}}>
                    <div style={{width:22,height:22,borderRadius:"50%",background:"#2d5a40",color:"white",display:"flex",alignItems:"center",justifyContent:"center",fontSize:11,fontWeight:800,flexShrink:0}}>{s.n}</div>
                    <div><div style={{fontSize:13,fontWeight:600,color:"#1a2e1f"}}>{s.t}</div><div style={{fontSize:11,color:"#7a9a7e"}}>{s.d}</div></div>
                  </div>
                ))}
              </div>
              <div style={{background:"rgba(184,148,63,0.08)",border:"1px solid rgba(184,148,63,0.2)",borderRadius:12,padding:14}}>
                <div style={{fontWeight:700,fontSize:13,color:"#b8943f",marginBottom:6}}>⚠️ Syarat NFC berfungsi:</div>
                <div style={{fontSize:12,color:"#6b7c6d",lineHeight:1.8}}>
                  • NFC ID kartu sudah diisi di Data Warga → Anggota<br/>
                  • Yang tap harus ibu (bukan bapak/anak)<br/>
                  • Ada anak terdaftar posyandu dari KK tersebut<br/>
                  • Belum tap hari ini (anti-spam aktif)
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ── DAFTAR ── */}
        {tab==="daftar"&&(
          <div>
            <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:14}}>
              <h3 style={{margin:0,fontSize:14,fontWeight:700,color:"#1a2e1f"}}>Daftar Anak ({anakList.length})</h3>
              <button onClick={()=>setShowFormAnak(!showFormAnak)} style={{background:"#2d5a40",color:"white",border:"none",borderRadius:10,padding:"7px 14px",fontSize:13,fontWeight:600,cursor:"pointer"}}>
                {showFormAnak?"✕ Tutup":"+ Daftarkan Anak"}
              </button>
            </div>
            {showFormAnak&&(
              <div style={{background:"white",borderRadius:16,padding:18,border:"1px solid rgba(45,90,64,0.12)",boxShadow:"0 2px 12px rgba(0,0,0,0.06)",marginBottom:16}}>
                <h4 style={{margin:"0 0 14px",fontSize:14,color:"#1a2e1f"}}>👶 Daftarkan Anak Baru</h4>
                <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:10}}>
                  <div><label style={LS}>KK *</label><select value={formAnak.kk_id} onChange={e=>setFormAnak({...formAnak,kk_id:e.target.value})} style={IS}><option value="">-- Pilih KK --</option>{kkList.map(k=><option key={k.id} value={k.id}>{k.kepala_keluarga} (RT {k.rt})</option>)}</select></div>
                  <div><label style={LS}>Nama Anak *</label><input value={formAnak.nama} onChange={e=>setFormAnak({...formAnak,nama:e.target.value})} placeholder="Nama lengkap" style={IS}/></div>
                  <div><label style={LS}>Nama Ibu</label><input value={formAnak.nama_ibu} onChange={e=>setFormAnak({...formAnak,nama_ibu:e.target.value})} placeholder="Nama ibu" style={IS}/></div>
                  <div><label style={LS}>No. WA Ibu</label><input value={formAnak.no_wa_ibu} onChange={e=>setFormAnak({...formAnak,no_wa_ibu:e.target.value})} placeholder="08xxxxxxxxxx" style={IS}/></div>
                  <div><label style={LS}>Tgl Lahir *</label><input type="date" value={formAnak.tgl_lahir} onChange={e=>setFormAnak({...formAnak,tgl_lahir:e.target.value})} style={IS}/></div>
                  <div><label style={LS}>Jenis Kelamin</label><div style={{display:"flex",gap:8}}>{[{v:"L",l:"👦 L"},{v:"P",l:"👧 P"}].map(({v,l})=><button key={v} onClick={()=>setFormAnak({...formAnak,jenis_kelamin:v})} style={{flex:1,padding:"8px",borderRadius:10,border:"1.5px solid rgba(45,90,64,0.2)",cursor:"pointer",background:formAnak.jenis_kelamin===v?"#2d5a40":"transparent",color:formAnak.jenis_kelamin===v?"white":"#2d5a40",fontSize:13,fontWeight:600}}>{l}</button>)}</div></div>
                </div>
                <div style={{marginTop:10,padding:"8px 14px",background:"rgba(45,90,64,0.06)",borderRadius:10,fontSize:12,color:"#2d5a40"}}>💉 Jadwal imunisasi otomatis dibuat (9 jenis standar Kemenkes)</div>
                <div style={{display:"flex",gap:10,marginTop:12}}>
                  <button onClick={simpanAnak} disabled={loading} style={{flex:1,background:"#2d5a40",color:"white",border:"none",borderRadius:10,padding:"10px",fontSize:14,fontWeight:600,cursor:loading?"not-allowed":"pointer"}}>{loading?"Menyimpan...":"💾 Daftarkan"}</button>
                  <button onClick={()=>setShowFormAnak(false)} style={{padding:"10px 16px",background:"transparent",border:"1.5px solid rgba(45,90,64,0.2)",borderRadius:10,fontSize:14,color:"#6b7c6d",cursor:"pointer"}}>Batal</button>
                </div>
              </div>
            )}
            <div style={{display:"grid",gridTemplateColumns:activeAnak?"1fr 1.6fr":"1fr",gap:16}}>
              <div style={{background:"white",borderRadius:16,border:"1px solid rgba(45,90,64,0.1)",overflow:"hidden",boxShadow:"0 1px 6px rgba(0,0,0,0.04)"}}>
                {anakList.length===0?<div style={{padding:40,textAlign:"center",color:"#a8b5a9"}}><div style={{fontSize:32,marginBottom:8}}>👶</div>Belum ada anak</div>
                :anakList.map((a,i)=>{
                  const last=tkList.filter(t=>t.anak_id===a.id)[0];
                  const gz=last?statusGiziWHO(last.bb_kg,a.tgl_lahir):null;
                  const sudah=imunList.filter(im=>im.anak_id===a.id&&im.status==="sudah").length;
                  const total=imunList.filter(im=>im.anak_id===a.id).length;
                  return(
                    <div key={a.id} onClick={()=>setActiveAnak(activeAnak?.id===a.id?null:a)} style={{padding:"14px 16px",borderBottom:i<anakList.length-1?"1px solid rgba(45,90,64,0.07)":"none",cursor:"pointer",background:activeAnak?.id===a.id?"rgba(45,90,64,0.05)":"transparent",display:"flex",alignItems:"center",gap:12}}>
                      <div style={{width:36,height:36,borderRadius:10,background:a.jenis_kelamin==="L"?"rgba(26,58,107,0.1)":"rgba(184,148,63,0.1)",display:"flex",alignItems:"center",justifyContent:"center",fontSize:18,flexShrink:0}}>{a.jenis_kelamin==="L"?"👦":"👧"}</div>
                      <div style={{flex:1}}>
                        <div style={{fontWeight:700,fontSize:14,color:"#1a2e1f"}}>{a.nama}</div>
                        <div style={{fontSize:11,color:"#7a9a7e"}}>{hitungUmurLabel(a.tgl_lahir)} · {a.nama_ibu}</div>
                        <div style={{fontSize:11,color:"#7a9a7e"}}>💉 {sudah}/{total}</div>
                      </div>
                      {gz&&<div style={{background:gz.color+"15",color:gz.color,border:`1px solid ${gz.color}30`,borderRadius:20,padding:"3px 8px",fontSize:10,fontWeight:600}}>{gz.status}</div>}
                    </div>
                  );
                })}
              </div>
              {activeAnak&&(
                <div>
                  <div style={{background:"#2d5a40",borderRadius:16,padding:"14px 18px",marginBottom:12,color:"white"}}>
                    <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start"}}>
                      <div>
                        <div style={{fontWeight:800,fontSize:16}}>{activeAnak.nama}</div>
                        <div style={{fontSize:12,opacity:0.8}}>{hitungUmurLabel(activeAnak.tgl_lahir)} · Ibu: {activeAnak.nama_ibu}</div>
                      </div>
                      <div style={{display:"flex",gap:6}}>
                        <button onClick={()=>{setTab("input");setFormTK({...formTK,anak_id:activeAnak.id});}} style={{background:"rgba(255,255,255,0.2)",border:"none",borderRadius:8,padding:"6px 10px",color:"white",cursor:"pointer",fontSize:12,fontWeight:600}}>+ Input</button>
                        <button onClick={()=>setTab("imunisasi")} style={{background:"rgba(255,255,255,0.15)",border:"none",borderRadius:8,padding:"6px 10px",color:"white",cursor:"pointer",fontSize:12}}>💉</button>
                      </div>
                    </div>
                  </div>
                  <div style={{background:"white",borderRadius:16,padding:16,border:"1px solid rgba(45,90,64,0.1)",boxShadow:"0 1px 6px rgba(0,0,0,0.04)",marginBottom:12}}>
                    <h4 style={{margin:"0 0 10px",fontSize:12,fontWeight:700,color:"#1a2e1f",textTransform:"uppercase",letterSpacing:"0.06em"}}>📈 Grafik Berat Badan</h4>
                    <GrafikBB data={activeTK} tgl_lahir={activeAnak.tgl_lahir}/>
                  </div>
                  <div style={{background:"white",borderRadius:16,border:"1px solid rgba(45,90,64,0.1)",overflow:"hidden",boxShadow:"0 1px 6px rgba(0,0,0,0.04)"}}>
                    <div style={{padding:"10px 14px",borderBottom:"1px solid rgba(45,90,64,0.08)"}}>
                      <span style={{fontSize:11,fontWeight:700,color:"#6b7c6d",textTransform:"uppercase",letterSpacing:"0.06em"}}>Riwayat ({activeTK.length}x)</span>
                    </div>
                    {activeTK.length===0?<div style={{padding:20,textAlign:"center",color:"#a8b5a9",fontSize:13}}>Belum ada data</div>
                    :activeTK.map((tk,i)=>{
                      const gz=statusGiziWHO(tk.bb_kg,activeAnak.tgl_lahir);
                      return(
                        <div key={tk.id} style={{padding:"10px 14px",borderBottom:i<activeTK.length-1?"1px solid rgba(45,90,64,0.07)":"none",display:"flex",alignItems:"center",gap:10}}>
                          <div style={{flex:1}}>
                            <div style={{fontWeight:600,fontSize:13,color:"#1a2e1f"}}>{fmtTgl(tk.tanggal)}</div>
                            <div style={{fontSize:12,color:"#6b7c6d"}}>⚖️ {tk.bb_kg}kg{tk.tb_cm>0&&` · 📏 ${tk.tb_cm}cm`}</div>
                          </div>
                          <div style={{background:gz.color+"15",color:gz.color,border:`1px solid ${gz.color}30`,borderRadius:20,padding:"3px 8px",fontSize:10,fontWeight:600}}>{gz.label}</div>
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
          <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:16}}>
            <div style={{background:"white",borderRadius:16,padding:20,border:"1px solid rgba(45,90,64,0.1)",boxShadow:"0 1px 6px rgba(0,0,0,0.04)"}}>
              <h3 style={{margin:"0 0 4px",fontSize:15,color:"#1a2e1f"}}>📊 Input Tumbuh Kembang</h3>
              <p style={{margin:"0 0 14px",fontSize:12,color:"#7a9a7e"}}>Ibu dapat +{POIN_POSYANDU} poin otomatis (1x/hari)</p>
              <div style={{marginBottom:12}}><label style={LS}>Pilih Anak *</label><select value={formTK.anak_id} onChange={e=>setFormTK({...formTK,anak_id:e.target.value})} style={IS}><option value="">-- Pilih anak --</option>{anakList.map(a=><option key={a.id} value={a.id}>{a.nama} ({hitungUmurLabel(a.tgl_lahir)})</option>)}</select></div>
              {formTK.anak_id&&formTK.bb_kg&&(()=>{const anak=anakList.find(a=>a.id===formTK.anak_id);const gz=anak?statusGiziWHO(Number(formTK.bb_kg),anak.tgl_lahir):null;return gz?<div style={{padding:"8px 12px",background:gz.color+"10",border:`1px solid ${gz.color}30`,borderRadius:10,marginBottom:12,fontSize:13,color:gz.color,fontWeight:700}}>Preview: {gz.label}</div>:null;})()}
              <div style={{marginBottom:12}}><label style={LS}>Tanggal</label><input type="date" value={formTK.tanggal} onChange={e=>setFormTK({...formTK,tanggal:e.target.value})} style={IS}/></div>
              <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:10,marginBottom:12}}>
                {[{label:"BB (kg) *",key:"bb_kg",ph:"8.5"},{label:"TB (cm)",key:"tb_cm",ph:"75"},{label:"LILA (cm)",key:"lila_cm",ph:"14"},{label:"LK (cm)",key:"lk_cm",ph:"46"}].map(f=>(
                  <div key={f.key}><label style={LS}>{f.label}</label><input type="number" value={(formTK as any)[f.key]} onChange={e=>setFormTK({...formTK,[f.key]:e.target.value})} placeholder={f.ph} style={IS}/></div>
                ))}
              </div>
              <div style={{marginBottom:16}}><label style={LS}>Catatan</label><textarea value={formTK.catatan} onChange={e=>setFormTK({...formTK,catatan:e.target.value})} placeholder="Catatan..." rows={2} style={{...IS,resize:"none"}}/></div>
              <button onClick={simpanTK} disabled={loading} style={{width:"100%",background:loading?"#a8b5a9":"#2d5a40",color:"white",border:"none",borderRadius:10,padding:"10px",fontSize:14,fontWeight:600,cursor:loading?"not-allowed":"pointer"}}>{loading?"Menyimpan...":"💾 Simpan Data"}</button>
            </div>
            <div style={{background:"rgba(45,90,64,0.06)",borderRadius:14,padding:18,border:"1px solid rgba(45,90,64,0.12)"}}>
              <h4 style={{margin:"0 0 12px",fontSize:13,fontWeight:700,color:"#1a2e1f"}}>📏 Panduan Status Gizi WHO</h4>
              {[{c:"#2d5a40",l:"Gizi Baik ✅",d:">90% berat ideal"},{c:"#e07b00",l:"Gizi Kurang ⚠️",d:"75-90% berat ideal → pantau"},{c:"#8b0000",l:"Gizi Buruk 🚨",d:"<75% berat ideal → rujuk!"},{c:"#b8943f",l:"Gizi Lebih ⚠️",d:">110% berat ideal → konsultasi"}].map(g=>(
                <div key={g.l} style={{display:"flex",gap:8,marginBottom:10}}>
                  <div style={{width:10,height:10,borderRadius:"50%",background:g.c,flexShrink:0,marginTop:3}}/>
                  <div><div style={{fontSize:12,fontWeight:600,color:g.c}}>{g.l}</div><div style={{fontSize:11,color:"#7a9a7e"}}>{g.d}</div></div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ── IMUNISASI ── */}
        {tab==="imunisasi"&&(
          <div>
            {imunJatuhTempo.length>0&&(
              <div style={{background:"rgba(220,53,69,0.08)",border:"1px solid rgba(220,53,69,0.2)",borderRadius:12,padding:"12px 16px",marginBottom:16}}>
                <div style={{fontWeight:700,fontSize:13,color:"#dc3545",marginBottom:8}}>🔔 Jatuh Tempo 30 Hari Ke Depan</div>
                {imunJatuhTempo.slice(0,5).map(im=>{
                  const anak=anakList.find(a=>a.id===im.anak_id);
                  const hari=Math.ceil((new Date(im.tanggal_jadwal).getTime()-new Date().getTime())/(1000*60*60*24));
                  return(
                    <div key={im.id} style={{display:"flex",justifyContent:"space-between",padding:"5px 0",borderBottom:"1px solid rgba(220,53,69,0.08)"}}>
                      <span style={{fontSize:13,color:"#1a2e1f"}}><strong>{anak?.nama}</strong> — {im.jenis}</span>
                      <span style={{fontSize:12,color:"#dc3545",fontWeight:600}}>{hari===0?"Hari ini!":hari===1?"Besok":`${hari} hari lagi`}</span>
                    </div>
                  );
                })}
              </div>
            )}
            <div style={{marginBottom:16}}>
              <label style={LS}>Pilih Anak</label>
              <select onChange={e=>setActiveAnak(anakList.find(a=>a.id===e.target.value)||null)} style={{...IS,background:"white"}}>
                <option value="">-- Pilih anak --</option>
                {anakList.map(a=><option key={a.id} value={a.id}>{a.nama} ({hitungUmurLabel(a.tgl_lahir)})</option>)}
              </select>
            </div>
            {activeAnak&&(
              <div style={{background:"white",borderRadius:16,border:"1px solid rgba(45,90,64,0.1)",overflow:"hidden",boxShadow:"0 1px 6px rgba(0,0,0,0.04)"}}>
                <div style={{padding:"14px 18px",borderBottom:"1px solid rgba(45,90,64,0.08)",background:"rgba(45,90,64,0.03)"}}>
                  <div style={{fontWeight:700,fontSize:14,color:"#1a2e1f"}}>{activeAnak.nama}</div>
                  <div style={{fontSize:12,color:"#7a9a7e",marginBottom:6}}>{activeImun.filter(i=>i.status==="sudah").length}/{activeImun.length} selesai</div>
                  <div style={{height:6,background:"rgba(45,90,64,0.1)",borderRadius:4,overflow:"hidden"}}>
                    <div style={{height:"100%",width:`${activeImun.length>0?(activeImun.filter(i=>i.status==="sudah").length/activeImun.length)*100:0}%`,background:"#2d5a40",borderRadius:4,transition:"width 0.6s"}}/>
                  </div>
                </div>
                {activeImun.length===0?<div style={{padding:24,textAlign:"center",color:"#a8b5a9",fontSize:13}}>Belum ada jadwal. Daftarkan anak untuk generate otomatis.</div>
                :activeImun.map((im,i)=>{
                  const jadwal=JADWAL_IMUNISASI.find(j=>j.jenis===im.jenis);
                  const lewat=im.status==="belum"&&new Date(im.tanggal_jadwal)<new Date();
                  const SC={sudah:"#2d5a40",terlewat:"#8b0000",belum:lewat?"#dc3545":"#b8943f"};
                  const SL={sudah:"✅ Sudah",terlewat:"❌ Lewat",belum:lewat?"⚠️ Terlambat":"🕐 Belum"};
                  const sc=SC[im.status as keyof typeof SC]||"#9a8c85";
                  return(
                    <div key={im.id} style={{padding:"12px 18px",borderBottom:i<activeImun.length-1?"1px solid rgba(45,90,64,0.07)":"none",display:"flex",alignItems:"center",gap:12}}>
                      <div style={{fontSize:20}}>💉</div>
                      <div style={{flex:1}}>
                        <div style={{fontWeight:700,fontSize:13,color:"#1a2e1f"}}>{jadwal?.label||im.jenis}</div>
                        <div style={{fontSize:11,color:"#7a9a7e"}}>Jadwal: {fmtTgl(im.tanggal_jadwal)} · usia {im.usia_bulan} bln{im.tanggal_realisasi&&<span style={{color:"#2d5a40"}}> · Done: {fmtTgl(im.tanggal_realisasi)}</span>}</div>
                      </div>
                      <div style={{display:"flex",alignItems:"center",gap:6}}>
                        <span style={{background:sc+"15",color:sc,border:`1px solid ${sc}30`,borderRadius:20,padding:"3px 8px",fontSize:10,fontWeight:600}}>{SL[im.status as keyof typeof SL]}</span>
                        {im.status==="belum"&&(
                          <div style={{display:"flex",gap:4}}>
                            <button onClick={()=>updateImunisasi(im.id)} style={{background:"rgba(45,90,64,0.08)",border:"none",borderRadius:8,padding:"4px 8px",cursor:"pointer",fontSize:11,color:"#2d5a40",fontWeight:600}}>✅</button>
                            {lewat&&<button onClick={()=>tandaiTerlewat(im.id)} style={{background:"rgba(139,0,0,0.08)",border:"none",borderRadius:8,padding:"4px 8px",cursor:"pointer",fontSize:11,color:"#8b0000"}}>❌</button>}
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
        @keyframes pulse{0%,100%{opacity:1}50%{opacity:0.4}}
        @keyframes ping{0%{transform:scale(1);opacity:0.8}100%{transform:scale(1.5);opacity:0}}
      `}</style>
    </div>
  );
}
