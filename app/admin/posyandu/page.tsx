"use client";
import { useState, useEffect, useRef } from "react";
import { supabase, isSupabaseReady } from "@/lib/supabase";

// ─── TYPES ───────────────────────────────────────────────────────────────────
interface Anak { id:string; nama:string; tgl_lahir:string; jenis_kelamin:string; nama_ibu:string; no_wa_ibu:string; kk_id:string; }
interface TK { id:string; anak_id:string; tanggal:string; bb_kg:number; tb_cm:number; lila_cm:number; lk_cm:number; status_gizi:string; catatan:string; }
interface Imunisasi { id:string; anak_id:string; jenis:string; usia_bulan:number; tanggal_jadwal:string; tanggal_realisasi:string; status:string; catatan:string; }

// ─── KONSTANTA ───────────────────────────────────────────────────────────────
const POIN_POSYANDU = 15;

// Jadwal imunisasi standar Indonesia (Kemenkes 2023)
const JADWAL_IMUNISASI = [
  { jenis:"HB0", label:"Hepatitis B (0)", usia_bulan:0, wajib:true },
  { jenis:"BCG", label:"BCG + Polio 1", usia_bulan:1, wajib:true },
  { jenis:"DPT-HB-Hib1", label:"DPT-HB-Hib 1 + Polio 2", usia_bulan:2, wajib:true },
  { jenis:"DPT-HB-Hib2", label:"DPT-HB-Hib 2 + Polio 3", usia_bulan:3, wajib:true },
  { jenis:"DPT-HB-Hib3", label:"DPT-HB-Hib 3 + Polio 4 + IPV", usia_bulan:4, wajib:true },
  { jenis:"MR1", label:"Campak-Rubella (MR) 1", usia_bulan:9, wajib:true },
  { jenis:"DPT-HB-Hib4", label:"DPT-HB-Hib 4 + MR 2", usia_bulan:18, wajib:true },
  { jenis:"DPT5", label:"DPT 5 + Polio 5", usia_bulan:60, wajib:true },
  { jenis:"MR2", label:"Campak-Rubella (MR) 2", usia_bulan:60, wajib:true },
];

// ─── HELPERS ─────────────────────────────────────────────────────────────────
function hitungUmurBulan(tgl:string):number {
  return Math.floor((new Date().getTime()-new Date(tgl).getTime())/(1000*60*60*24*30));
}
function hitungUmurLabel(tgl:string):string {
  const bulan=hitungUmurBulan(tgl);
  return bulan<24?`${bulan} bulan`:`${Math.floor(bulan/12)} thn ${bulan%12} bln`;
}
function statusGiziWHO(bb:number, tgl_lahir:string):{status:string;color:string;label:string} {
  const bulan=hitungUmurBulan(tgl_lahir);
  const bbIdeal=bulan<=12?bulan*0.65+3:6+(bulan-12)*0.22;
  const ratio=bb/bbIdeal;
  if(ratio>=1.1)return{status:"lebih",color:"#b8943f",label:"Gizi Lebih ⚠️"};
  if(ratio>=0.9)return{status:"normal",color:"#2d5a40",label:"Gizi Baik ✅"};
  if(ratio>=0.75)return{status:"kurang",color:"#e07b00",label:"Gizi Kurang ⚠️"};
  return{status:"buruk",color:"#8b0000",label:"Gizi Buruk 🚨"};
}
function tglDariUsiaBulan(tgl_lahir:string, usia_bulan:number):string {
  const lahir=new Date(tgl_lahir);
  lahir.setMonth(lahir.getMonth()+usia_bulan);
  return lahir.toISOString().split("T")[0];
}
function formatTgl(tgl:string):string {
  if(!tgl)return"-";
  return new Date(tgl).toLocaleDateString("id-ID",{day:"numeric",month:"short",year:"numeric"});
}

const LS={fontSize:11,fontWeight:700 as const,color:"#6b7c6d",letterSpacing:"0.06em",textTransform:"uppercase" as const,display:"block",marginBottom:4};
const IS={width:"100%",padding:"9px 12px",borderRadius:10,border:"1.5px solid rgba(45,90,64,0.2)",fontSize:13,background:"#fafaf8",outline:"none",boxSizing:"border-box" as const,fontFamily:"inherit"};

// ─── MINI GRAFIK BB ───────────────────────────────────────────────────────────
function GrafikBB({data, tgl_lahir}:{data:TK[];tgl_lahir:string}) {
  if(data.length<2)return(
    <div style={{textAlign:"center",padding:"20px",color:"#a8b5a9",fontSize:12}}>
      Butuh minimal 2 data pemeriksaan untuk menampilkan grafik
    </div>
  );
  const sorted=[...data].sort((a,b)=>a.tanggal.localeCompare(b.tanggal));
  const maxBB=Math.max(...sorted.map(d=>d.bb_kg))*1.1;
  const minBB=Math.max(0,Math.min(...sorted.map(d=>d.bb_kg))*0.9);
  const W=300,H=120,PAD=30;
  const xStep=(W-PAD*2)/(sorted.length-1);
  const yScale=(v:number)=>H-PAD-((v-minBB)/(maxBB-minBB))*(H-PAD*2);
  const points=sorted.map((d,i)=>({x:PAD+i*xStep,y:yScale(d.bb_kg),bb:d.bb_kg,tgl:d.tanggal}));
  const path=points.map((p,i)=>`${i===0?"M":"L"}${p.x},${p.y}`).join(" ");
  const areaPath=`${path} L${points[points.length-1].x},${H-PAD} L${PAD},${H-PAD} Z`;
  return(
    <div style={{overflowX:"auto"}}>
      <svg width={W} height={H} style={{display:"block",margin:"0 auto"}}>
        {/* Grid lines */}
        {[0,0.25,0.5,0.75,1].map(t=>{
          const y=PAD+(1-t)*(H-PAD*2);
          const val=(minBB+t*(maxBB-minBB)).toFixed(1);
          return(
            <g key={t}>
              <line x1={PAD} y1={y} x2={W-PAD} y2={y} stroke="rgba(45,90,64,0.08)" strokeWidth={1}/>
              <text x={PAD-4} y={y+4} fontSize={8} textAnchor="end" fill="#a8b5a9">{val}</text>
            </g>
          );
        })}
        {/* Area fill */}
        <path d={areaPath} fill="rgba(45,90,64,0.08)"/>
        {/* Line */}
        <path d={path} fill="none" stroke="#2d5a40" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round"/>
        {/* Points */}
        {points.map((p,i)=>{
          const gz=statusGiziWHO(p.bb,tgl_lahir);
          return(
            <g key={i}>
              <circle cx={p.x} cy={p.y} r={5} fill={gz.color} stroke="white" strokeWidth={2}/>
              <text x={p.x} y={H-PAD+12} fontSize={8} textAnchor="middle" fill="#a8b5a9">
                {new Date(p.tgl).toLocaleDateString("id-ID",{month:"short"})}
              </text>
              <text x={p.x} y={p.y-8} fontSize={8} textAnchor="middle" fill={gz.color} fontWeight="700">
                {p.bb}
              </text>
            </g>
          );
        })}
        {/* Label Y */}
        <text x={PAD/2} y={H/2} fontSize={9} textAnchor="middle" fill="#7a9a7e" transform={`rotate(-90,${PAD/2},${H/2})`}>BB (kg)</text>
      </svg>
    </div>
  );
}

// ─── MAIN COMPONENT ───────────────────────────────────────────────────────────
export default function AdminPosyanduV2Page() {
  const[anakList,setAnakList]=useState<Anak[]>([]);
  const[tkList,setTkList]=useState<TK[]>([]);
  const[imunisasiList,setImunisasiList]=useState<Imunisasi[]>([]);
  const[kkList,setKkList]=useState<any[]>([]);
  const[anggotaList,setAnggotaList]=useState<any[]>([]);
  const[activeAnak,setActiveAnak]=useState<Anak|null>(null);
  const[tab,setTab]=useState<"daftar"|"input"|"imunisasi">("daftar");
  const[formTK,setFormTK]=useState({anak_id:"",tanggal:new Date().toISOString().split("T")[0],bb_kg:"",tb_cm:"",lila_cm:"",lk_cm:"",catatan:""});
  const[formAnak,setFormAnak]=useState({nama:"",tgl_lahir:"",jenis_kelamin:"L",nama_ibu:"",no_wa_ibu:"",kk_id:""});
  const[loading,setLoading]=useState(false);
  const[toast,setToast]=useState({msg:"",ok:true});
  const[showFormAnak,setShowFormAnak]=useState(false);

  function showToast(msg:string,ok=true){setToast({msg,ok});setTimeout(()=>setToast({msg:"",ok:true}),4000);}

  async function fetchAll(){
    if(!isSupabaseReady())return;
    const[a,tk,im,kk,ang]=await Promise.all([
      supabase.from("anak_posyandu").select("*").order("nama"),
      supabase.from("tumbuh_kembang").select("*").order("tanggal",{ascending:false}),
      supabase.from("imunisasi").select("*").order("usia_bulan"),
      supabase.from("keluarga").select("id,kepala_keluarga,rt").order("kepala_keluarga"),
      supabase.from("anggota_kk").select("id,kk_id,nama,nfc_id,saldo_poin,no_wa").eq("hubungan","istri"),
    ]);
    if(a.data)setAnakList(a.data as Anak[]);
    if(tk.data)setTkList(tk.data as TK[]);
    if(im.data)setImunisasiList(im.data as Imunisasi[]);
    if(kk.data)setKkList(kk.data);
    if(ang.data)setAnggotaList(ang.data);
  }

  useEffect(()=>{fetchAll();},[]);

  // Generate jadwal imunisasi otomatis untuk anak baru
  async function generateJadwalImunisasi(anakId:string, tgl_lahir:string){
    const jadwals=JADWAL_IMUNISASI.map(j=>({
      anak_id:anakId,
      jenis:j.jenis,
      usia_bulan:j.usia_bulan,
      tanggal_jadwal:tglDariUsiaBulan(tgl_lahir,j.usia_bulan),
      status:"belum",
    }));
    await supabase.from("imunisasi").insert(jadwals);
  }

  async function simpanAnak(){
    if(!formAnak.nama||!formAnak.tgl_lahir)return showToast("❌ Nama & tgl lahir wajib!",false);
    if(!formAnak.kk_id)return showToast("❌ Pilih KK dulu!",false);
    setLoading(true);
    const{data,error}=await supabase.from("anak_posyandu").insert({...formAnak,nama_ibu:formAnak.nama_ibu||"-"}).select().single();
    if(error){showToast(`❌ ${error.message}`,false);}
    else{
      // Auto-generate jadwal imunisasi
      await generateJadwalImunisasi(data.id,formAnak.tgl_lahir);
      showToast("✅ Anak terdaftar + jadwal imunisasi dibuat otomatis! 💉");
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
      catatan:formTK.catatan||null,
      status_gizi:gz.status,
    });
    if(error){showToast(`❌ ${error.message}`,false);setLoading(false);return;}

    // Alert kalau gizi buruk
    if(gz.status==="buruk"||gz.status==="kurang"){
      setTimeout(()=>showToast(`🚨 ALERT! ${anak.nama} status ${gz.label} — segera rujuk ke bidan/puskesmas!`,false),500);
    }

    // Eco-reward ke ibu (anti-spam)
    const ibu=anggotaList.find(a=>a.kk_id===anak.kk_id);
    if(ibu){
      const hariIni=new Date().toISOString().split("T")[0];
      const{data:cekSpam}=await supabase.from("riwayat_poin").select("id").eq("anggota_id",ibu.id).eq("sumber","posyandu").gte("created_at",`${hariIni}T00:00:00`).lte("created_at",`${hariIni}T23:59:59`).limit(1);
      if(!cekSpam||cekSpam.length===0){
        await supabase.from("anggota_kk").update({saldo_poin:(ibu.saldo_poin||0)+POIN_POSYANDU}).eq("id",ibu.id);
        await supabase.from("riwayat_poin").insert({anggota_id:ibu.id,kk_id:anak.kk_id,jumlah:POIN_POSYANDU,jenis:"masuk",sumber:"posyandu",keterangan:`Posyandu — ${anak.nama} — ${formTK.tanggal}`});
        showToast(`✅ Data tersimpan! Status: ${gz.label} | ${ibu.nama} +${POIN_POSYANDU} poin 🎉`);
      }else showToast(`✅ Data tersimpan! Status: ${gz.label}`);
    }else showToast(`✅ Data tersimpan! Status: ${gz.label}`);

    setFormTK({...formTK,anak_id:formTK.anak_id,bb_kg:"",tb_cm:"",lila_cm:"",lk_cm:"",catatan:""});
    setLoading(false);fetchAll();
  }

  async function updateImunisasi(id:string, realisasi:string){
    await supabase.from("imunisasi").update({tanggal_realisasi:realisasi,status:"sudah"}).eq("id",id);
    showToast("✅ Imunisasi dicatat!");fetchAll();
  }

  async function tandaiTerlewat(id:string){
    await supabase.from("imunisasi").update({status:"terlewat"}).eq("id",id);
    showToast("⚠️ Imunisasi ditandai terlewat");fetchAll();
  }

  const activeAnakTK=tkList.filter(t=>t.anak_id===activeAnak?.id);
  const activeAnakImun=imunisasiList.filter(i=>i.anak_id===activeAnak?.id);
  const bulanSekarang=activeAnak?hitungUmurBulan(activeAnak.tgl_lahir):0;

  // Alert anak yang butuh perhatian
  const anakAlert=anakList.filter(a=>{
    const lastTK=tkList.filter(t=>t.anak_id===a.id)[0];
    if(!lastTK)return false;
    const gz=statusGiziWHO(lastTK.bb_kg,a.tgl_lahir);
    return gz.status==="buruk"||gz.status==="kurang";
  });

  // Imunisasi yang akan jatuh tempo (dalam 30 hari)
  const imunisasiJatuhTempo=imunisasiList.filter(im=>{
    if(im.status!=="belum")return false;
    const jadwal=new Date(im.tanggal_jadwal);
    const diff=(jadwal.getTime()-new Date().getTime())/(1000*60*60*24);
    return diff>=0&&diff<=30;
  });

  return(
    <div style={{minHeight:"100vh",background:"#f5f0e8",fontFamily:"'Segoe UI',system-ui,sans-serif"}}>
      {toast.msg&&<div style={{position:"fixed",top:20,left:"50%",transform:"translateX(-50%)",background:toast.ok?"#2d5a40":"#dc3545",color:"white",padding:"10px 20px",borderRadius:12,zIndex:999,fontSize:14,boxShadow:"0 4px 20px rgba(0,0,0,0.15)",maxWidth:"85vw",textAlign:"center"}}>{toast.msg}</div>}

      <header style={{background:"#f5f0e8",borderBottom:"1px solid rgba(45,90,64,0.12)",padding:"14px 20px",position:"sticky",top:0,zIndex:10,display:"flex",alignItems:"center",justifyContent:"space-between"}}>
        <div style={{display:"flex",alignItems:"center",gap:12}}>
          <a href="/admin" style={{color:"#6b7c6d",textDecoration:"none",fontSize:13}}>← Admin</a>
          <span style={{color:"#c8bfaa"}}>|</span>
          <div>
            <div style={{fontWeight:800,fontSize:15,color:"#1a2e1f"}}>👶 Posyandu Digital</div>
            <div style={{fontSize:10,color:"#7a9a7e",textTransform:"uppercase",letterSpacing:"0.08em"}}>{anakList.length} Anak · {anakAlert.length>0?`⚠️ ${anakAlert.length} perlu perhatian`:""}</div>
          </div>
        </div>
        <div style={{display:"flex",gap:6}}>
          {(["daftar","input","imunisasi"] as const).map(t=>(
            <button key={t} onClick={()=>setTab(t)} style={{padding:"6px 12px",borderRadius:20,fontSize:11,fontWeight:600,border:"1.5px solid rgba(45,90,64,0.2)",cursor:"pointer",background:tab===t?"#2d5a40":"transparent",color:tab===t?"white":"#6b7c6d",position:"relative"}}>
              {{daftar:"📋 Daftar",input:"➕ Input",imunisasi:"💉 Imunisasi"}[t]}
              {t==="imunisasi"&&imunisasiJatuhTempo.length>0&&<span style={{position:"absolute",top:-4,right:-4,background:"#dc3545",color:"white",borderRadius:"50%",width:16,height:16,fontSize:9,display:"flex",alignItems:"center",justifyContent:"center",fontWeight:800}}>{imunisasiJatuhTempo.length}</span>}
            </button>
          ))}
        </div>
      </header>

      <div style={{maxWidth:1000,margin:"0 auto",padding:"20px 16px"}}>

        {/* ALERT STRIP */}
        {anakAlert.length>0&&(
          <div style={{background:"rgba(139,0,0,0.08)",border:"1px solid rgba(139,0,0,0.2)",borderRadius:12,padding:"10px 16px",marginBottom:16,display:"flex",alignItems:"center",gap:10}}>
            <span style={{fontSize:20}}>🚨</span>
            <div>
              <span style={{fontSize:13,color:"#8b0000",fontWeight:700}}>Perlu Perhatian: </span>
              <span style={{fontSize:13,color:"#8b0000"}}>{anakAlert.map(a=>a.nama).join(", ")} — status gizi bermasalah</span>
            </div>
          </div>
        )}

        {/* ── DAFTAR TAB ── */}
        {tab==="daftar"&&(
          <div>
            <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:14}}>
              <h3 style={{margin:0,fontSize:14,fontWeight:700,color:"#1a2e1f"}}>Daftar Anak Posyandu ({anakList.length})</h3>
              <button onClick={()=>setShowFormAnak(!showFormAnak)} style={{background:"#2d5a40",color:"white",border:"none",borderRadius:10,padding:"7px 14px",fontSize:13,fontWeight:600,cursor:"pointer"}}>
                {showFormAnak?"✕ Tutup":"+ Daftarkan Anak"}
              </button>
            </div>

            {/* Form tambah anak */}
            {showFormAnak&&(
              <div style={{background:"white",borderRadius:16,padding:18,border:"1px solid rgba(45,90,64,0.12)",boxShadow:"0 2px 12px rgba(0,0,0,0.06)",marginBottom:16}}>
                <h4 style={{margin:"0 0 14px",fontSize:14,color:"#1a2e1f"}}>👶 Daftarkan Anak Baru</h4>
                <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:10}}>
                  <div><label style={LS}>KK / Keluarga *</label>
                    <select value={formAnak.kk_id} onChange={e=>setFormAnak({...formAnak,kk_id:e.target.value})} style={IS}>
                      <option value="">-- Pilih KK --</option>
                      {kkList.map(k=><option key={k.id} value={k.id}>{k.kepala_keluarga} (RT {k.rt})</option>)}
                    </select>
                  </div>
                  <div><label style={LS}>Nama Anak *</label><input value={formAnak.nama} onChange={e=>setFormAnak({...formAnak,nama:e.target.value})} placeholder="Nama lengkap" style={IS}/></div>
                  <div><label style={LS}>Nama Ibu</label><input value={formAnak.nama_ibu} onChange={e=>setFormAnak({...formAnak,nama_ibu:e.target.value})} placeholder="Nama ibu" style={IS}/></div>
                  <div><label style={LS}>No. WA Ibu</label><input value={formAnak.no_wa_ibu} onChange={e=>setFormAnak({...formAnak,no_wa_ibu:e.target.value})} placeholder="08xxxxxxxxxx" style={IS}/></div>
                  <div><label style={LS}>Tanggal Lahir *</label><input type="date" value={formAnak.tgl_lahir} onChange={e=>setFormAnak({...formAnak,tgl_lahir:e.target.value})} style={IS}/></div>
                  <div><label style={LS}>Jenis Kelamin</label>
                    <div style={{display:"flex",gap:8}}>
                      {[{v:"L",l:"👦 Laki-laki"},{v:"P",l:"👧 Perempuan"}].map(({v,l})=>(
                        <button key={v} onClick={()=>setFormAnak({...formAnak,jenis_kelamin:v})} style={{flex:1,padding:"8px",borderRadius:10,border:"1.5px solid rgba(45,90,64,0.2)",cursor:"pointer",background:formAnak.jenis_kelamin===v?"#2d5a40":"transparent",color:formAnak.jenis_kelamin===v?"white":"#2d5a40",fontSize:13,fontWeight:600}}>{l}</button>
                      ))}
                    </div>
                  </div>
                </div>
                <div style={{marginTop:12,padding:"8px 14px",background:"rgba(45,90,64,0.06)",borderRadius:10,fontSize:12,color:"#2d5a40"}}>
                  💉 <strong>Jadwal imunisasi akan dibuat otomatis</strong> berdasarkan tanggal lahir (9 jenis imunisasi standar Kemenkes).
                </div>
                <div style={{display:"flex",gap:10,marginTop:14}}>
                  <button onClick={simpanAnak} disabled={loading} style={{flex:1,background:"#2d5a40",color:"white",border:"none",borderRadius:10,padding:"10px",fontSize:14,fontWeight:600,cursor:loading?"not-allowed":"pointer"}}>{loading?"Menyimpan...":"💾 Daftarkan + Buat Jadwal Imunisasi"}</button>
                  <button onClick={()=>{setShowFormAnak(false);}} style={{padding:"10px 16px",background:"transparent",border:"1.5px solid rgba(45,90,64,0.2)",borderRadius:10,fontSize:14,color:"#6b7c6d",cursor:"pointer"}}>Batal</button>
                </div>
              </div>
            )}

            {/* List + Detail */}
            <div style={{display:"grid",gridTemplateColumns:activeAnak?"1fr 1.6fr":"1fr",gap:16}}>
              <div style={{background:"white",borderRadius:16,border:"1px solid rgba(45,90,64,0.1)",overflow:"hidden",boxShadow:"0 1px 6px rgba(0,0,0,0.04)"}}>
                {anakList.length===0?(
                  <div style={{padding:40,textAlign:"center",color:"#a8b5a9"}}><div style={{fontSize:32,marginBottom:8}}>👶</div>Belum ada anak terdaftar</div>
                ):anakList.map((a,i)=>{
                  const lastTK=tkList.filter(t=>t.anak_id===a.id)[0];
                  const gz=lastTK?statusGiziWHO(lastTK.bb_kg,a.tgl_lahir):null;
                  const imunSudah=imunisasiList.filter(im=>im.anak_id===a.id&&im.status==="sudah").length;
                  const imunTotal=imunisasiList.filter(im=>im.anak_id===a.id).length;
                  return(
                    <div key={a.id} onClick={()=>setActiveAnak(activeAnak?.id===a.id?null:a)}
                      style={{padding:"14px 16px",borderBottom:i<anakList.length-1?"1px solid rgba(45,90,64,0.07)":"none",cursor:"pointer",background:activeAnak?.id===a.id?"rgba(45,90,64,0.05)":"transparent",display:"flex",alignItems:"center",gap:12}}>
                      <div style={{width:36,height:36,borderRadius:10,background:a.jenis_kelamin==="L"?"rgba(26,58,107,0.1)":"rgba(184,148,63,0.1)",display:"flex",alignItems:"center",justifyContent:"center",fontSize:18,flexShrink:0}}>
                        {a.jenis_kelamin==="L"?"👦":"👧"}
                      </div>
                      <div style={{flex:1}}>
                        <div style={{fontWeight:700,fontSize:14,color:"#1a2e1f"}}>{a.nama}</div>
                        <div style={{fontSize:11,color:"#7a9a7e"}}>{hitungUmurLabel(a.tgl_lahir)} · {a.nama_ibu}</div>
                        <div style={{fontSize:11,color:"#7a9a7e",marginTop:1}}>💉 {imunSudah}/{imunTotal} imunisasi</div>
                      </div>
                      {gz&&<div style={{background:gz.color+"15",color:gz.color,border:`1px solid ${gz.color}30`,borderRadius:20,padding:"3px 8px",fontSize:10,fontWeight:600}}>{gz.status}</div>}
                    </div>
                  );
                })}
              </div>

              {/* Detail Panel */}
              {activeAnak&&(
                <div>
                  {/* Info anak */}
                  <div style={{background:"#2d5a40",borderRadius:16,padding:"16px 18px",marginBottom:12,color:"white"}}>
                    <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start"}}>
                      <div>
                        <div style={{fontWeight:800,fontSize:16}}>{activeAnak.nama}</div>
                        <div style={{fontSize:12,opacity:0.8,marginTop:2}}>{hitungUmurLabel(activeAnak.tgl_lahir)} · Lahir: {formatTgl(activeAnak.tgl_lahir)}</div>
                        <div style={{fontSize:12,opacity:0.75}}>Ibu: {activeAnak.nama_ibu}</div>
                      </div>
                      <div style={{display:"flex",gap:8}}>
                        <button onClick={()=>{setTab("input");setFormTK({...formTK,anak_id:activeAnak.id});}} style={{background:"rgba(255,255,255,0.2)",border:"none",borderRadius:8,padding:"6px 12px",color:"white",cursor:"pointer",fontSize:12,fontWeight:600}}>+ Input Data</button>
                        <button onClick={()=>{setTab("imunisasi");}} style={{background:"rgba(255,255,255,0.15)",border:"none",borderRadius:8,padding:"6px 12px",color:"white",cursor:"pointer",fontSize:12}}>💉 Imunisasi</button>
                      </div>
                    </div>
                  </div>

                  {/* Grafik BB */}
                  <div style={{background:"white",borderRadius:16,padding:16,border:"1px solid rgba(45,90,64,0.1)",boxShadow:"0 1px 6px rgba(0,0,0,0.04)",marginBottom:12}}>
                    <h4 style={{margin:"0 0 12px",fontSize:13,fontWeight:700,color:"#1a2e1f",textTransform:"uppercase",letterSpacing:"0.06em"}}>📈 Grafik Berat Badan</h4>
                    <GrafikBB data={activeAnakTK} tgl_lahir={activeAnak.tgl_lahir}/>
                  </div>

                  {/* Riwayat pemeriksaan */}
                  <div style={{background:"white",borderRadius:16,border:"1px solid rgba(45,90,64,0.1)",overflow:"hidden",boxShadow:"0 1px 6px rgba(0,0,0,0.04)"}}>
                    <div style={{padding:"12px 16px",borderBottom:"1px solid rgba(45,90,64,0.08)"}}>
                      <span style={{fontSize:12,fontWeight:700,color:"#6b7c6d",textTransform:"uppercase",letterSpacing:"0.06em"}}>Riwayat Pemeriksaan ({activeAnakTK.length}x)</span>
                    </div>
                    {activeAnakTK.length===0?(
                      <div style={{padding:20,textAlign:"center",color:"#a8b5a9",fontSize:13}}>Belum ada data pemeriksaan</div>
                    ):activeAnakTK.map((tk,i)=>{
                      const gz=statusGiziWHO(tk.bb_kg,activeAnak.tgl_lahir);
                      return(
                        <div key={tk.id} style={{padding:"12px 16px",borderBottom:i<activeAnakTK.length-1?"1px solid rgba(45,90,64,0.07)":"none",display:"flex",alignItems:"center",gap:12}}>
                          <div style={{flex:1}}>
                            <div style={{fontWeight:600,fontSize:13,color:"#1a2e1f"}}>{formatTgl(tk.tanggal)}</div>
                            <div style={{fontSize:12,color:"#6b7c6d",marginTop:2}}>
                              ⚖️ {tk.bb_kg}kg{tk.tb_cm>0&&` · 📏 ${tk.tb_cm}cm`}{tk.lila_cm>0&&` · LILA ${tk.lila_cm}cm`}
                            </div>
                            {tk.catatan&&<div style={{fontSize:11,color:"#a8b5a9",marginTop:2}}>📝 {tk.catatan}</div>}
                          </div>
                          <div style={{background:gz.color+"15",color:gz.color,border:`1px solid ${gz.color}30`,borderRadius:20,padding:"3px 10px",fontSize:11,fontWeight:600}}>{gz.label}</div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {/* ── INPUT TAB ── */}
        {tab==="input"&&(
          <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:16}}>
            <div style={{background:"white",borderRadius:16,padding:20,border:"1px solid rgba(45,90,64,0.1)",boxShadow:"0 1px 6px rgba(0,0,0,0.04)"}}>
              <h3 style={{margin:"0 0 4px",fontSize:15,color:"#1a2e1f"}}>📊 Input Tumbuh Kembang</h3>
              <p style={{margin:"0 0 14px",fontSize:12,color:"#7a9a7e"}}>Ibu otomatis dapat +{POIN_POSYANDU} poin (1x/hari)</p>

              <div style={{marginBottom:12}}><label style={LS}>Pilih Anak *</label>
                <select value={formTK.anak_id} onChange={e=>setFormTK({...formTK,anak_id:e.target.value})} style={{...IS,background:formTK.anak_id?"#f0faf4":"#fafaf8"}}>
                  <option value="">-- Pilih anak --</option>
                  {anakList.map(a=><option key={a.id} value={a.id}>{a.nama} ({hitungUmurLabel(a.tgl_lahir)})</option>)}
                </select>
              </div>

              {/* Preview status gizi real-time */}
              {formTK.anak_id&&formTK.bb_kg&&(()=>{
                const anak=anakList.find(a=>a.id===formTK.anak_id)!;
                const gz=anak?statusGiziWHO(Number(formTK.bb_kg),anak.tgl_lahir):null;
                return gz?(
                  <div style={{padding:"8px 14px",background:gz.color+"10",border:`1px solid ${gz.color}30`,borderRadius:10,marginBottom:12}}>
                    <span style={{fontSize:13,color:gz.color,fontWeight:700}}>Status Gizi: {gz.label}</span>
                  </div>
                ):null;
              })()}

              <div style={{marginBottom:12}}><label style={LS}>Tanggal Pemeriksaan</label><input type="date" value={formTK.tanggal} onChange={e=>setFormTK({...formTK,tanggal:e.target.value})} style={IS}/></div>
              <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:10,marginBottom:12}}>
                {[{label:"BB (kg) *",key:"bb_kg",ph:"8.5"},{label:"TB (cm)",key:"tb_cm",ph:"75"},{label:"LILA (cm)",key:"lila_cm",ph:"14"},{label:"LK (cm)",key:"lk_cm",ph:"46"}].map(f=>(
                  <div key={f.key}><label style={LS}>{f.label}</label><input type="number" value={(formTK as any)[f.key]} onChange={e=>setFormTK({...formTK,[f.key]:e.target.value})} placeholder={f.ph} style={IS}/></div>
                ))}
              </div>
              <div style={{marginBottom:16}}><label style={LS}>Catatan</label><textarea value={formTK.catatan} onChange={e=>setFormTK({...formTK,catatan:e.target.value})} placeholder="Catatan tambahan..." rows={2} style={{...IS,resize:"none"}}/></div>
              <button onClick={simpanTK} disabled={loading} style={{width:"100%",background:loading?"#a8b5a9":"#2d5a40",color:"white",border:"none",borderRadius:10,padding:"10px",fontSize:14,fontWeight:600,cursor:loading?"not-allowed":"pointer"}}>{loading?"Menyimpan...":"💾 Simpan Data"}</button>
            </div>

            {/* Info & tips */}
            <div>
              <div style={{background:"white",borderRadius:16,padding:18,border:"1px solid rgba(45,90,64,0.1)",boxShadow:"0 1px 6px rgba(0,0,0,0.04)",marginBottom:12}}>
                <h4 style={{margin:"0 0 12px",fontSize:13,fontWeight:700,color:"#1a2e1f"}}>📏 Panduan Status Gizi</h4>
                {[{c:"#2d5a40",l:"Gizi Baik ✅",d:"BB sesuai usia (>90% ideal)"},{c:"#e07b00",l:"Gizi Kurang ⚠️",d:"BB kurang (75-90% ideal) → pantau"},{c:"#8b0000",l:"Gizi Buruk 🚨",d:"BB sangat kurang (<75%) → rujuk!"},{c:"#b8943f",l:"Gizi Lebih ⚠️",d:"BB berlebih (>110%) → konsultasi"}].map(g=>(
                  <div key={g.l} style={{display:"flex",gap:10,marginBottom:8,alignItems:"flex-start"}}>
                    <div style={{width:10,height:10,borderRadius:"50%",background:g.c,flexShrink:0,marginTop:3}}/>
                    <div><div style={{fontSize:12,fontWeight:600,color:g.c}}>{g.l}</div><div style={{fontSize:11,color:"#7a9a7e"}}>{g.d}</div></div>
                  </div>
                ))}
              </div>
              <div style={{background:"rgba(45,90,64,0.06)",borderRadius:14,padding:16,border:"1px solid rgba(45,90,64,0.12)"}}>
                <h4 style={{margin:"0 0 8px",fontSize:13,color:"#1a2e1f"}}>🏆 Eco-Reward Posyandu</h4>
                <p style={{fontSize:12,color:"#6b7c6d",margin:0,lineHeight:1.6}}>Setiap ibu yang hadir posyandu & dicatat tumbuh kembang anaknya otomatis mendapat <strong style={{color:"#2d5a40"}}>{POIN_POSYANDU} poin</strong> (1x per hari).</p>
              </div>
            </div>
          </div>
        )}

        {/* ── IMUNISASI TAB ── */}
        {tab==="imunisasi"&&(
          <div>
            {/* Reminder jatuh tempo */}
            {imunisasiJatuhTempo.length>0&&(
              <div style={{background:"rgba(220,53,69,0.08)",border:"1px solid rgba(220,53,69,0.2)",borderRadius:14,padding:"12px 16px",marginBottom:16}}>
                <div style={{fontWeight:700,fontSize:14,color:"#dc3545",marginBottom:8}}>🔔 Imunisasi Jatuh Tempo (30 hari ke depan)</div>
                {imunisasiJatuhTempo.slice(0,5).map(im=>{
                  const anak=anakList.find(a=>a.id===im.anak_id);
                  const hari=Math.ceil((new Date(im.tanggal_jadwal).getTime()-new Date().getTime())/(1000*60*60*24));
                  return(
                    <div key={im.id} style={{display:"flex",justifyContent:"space-between",alignItems:"center",padding:"6px 0",borderBottom:"1px solid rgba(220,53,69,0.1)"}}>
                      <div>
                        <span style={{fontWeight:600,fontSize:13,color:"#1a2e1f"}}>{anak?.nama}</span>
                        <span style={{fontSize:12,color:"#6b7c6d"}}> — {im.jenis}</span>
                      </div>
                      <div style={{fontSize:12,color:"#dc3545",fontWeight:600}}>{hari===0?"Hari ini!":hari===1?"Besok":`${hari} hari lagi`}</div>
                    </div>
                  );
                })}
              </div>
            )}

            {/* Pilih anak */}
            <div style={{marginBottom:16}}>
              <label style={LS}>Pilih Anak</label>
              <select onChange={e=>setActiveAnak(anakList.find(a=>a.id===e.target.value)||null)}
                style={{...IS,background:"white"}}>
                <option value="">-- Pilih anak untuk lihat jadwal imunisasi --</option>
                {anakList.map(a=><option key={a.id} value={a.id}>{a.nama} ({hitungUmurLabel(a.tgl_lahir)})</option>)}
              </select>
            </div>

            {activeAnak&&(
              <div style={{background:"white",borderRadius:16,border:"1px solid rgba(45,90,64,0.1)",overflow:"hidden",boxShadow:"0 1px 6px rgba(0,0,0,0.04)"}}>
                <div style={{padding:"14px 18px",borderBottom:"1px solid rgba(45,90,64,0.08)",background:"rgba(45,90,64,0.03)"}}>
                  <div style={{fontWeight:700,fontSize:14,color:"#1a2e1f"}}>{activeAnak.nama}</div>
                  <div style={{fontSize:12,color:"#7a9a7e"}}>{hitungUmurLabel(activeAnak.tgl_lahir)} · {activeAnakImun.filter(i=>i.status==="sudah").length}/{activeAnakImun.length} imunisasi selesai</div>
                  {/* Progress bar */}
                  <div style={{marginTop:8,height:6,background:"rgba(45,90,64,0.1)",borderRadius:4,overflow:"hidden"}}>
                    <div style={{height:"100%",width:`${activeAnakImun.length>0?(activeAnakImun.filter(i=>i.status==="sudah").length/activeAnakImun.length)*100:0}%`,background:"#2d5a40",borderRadius:4,transition:"width 0.6s"}}/>
                  </div>
                </div>

                {activeAnakImun.length===0?(
                  <div style={{padding:24,textAlign:"center",color:"#a8b5a9",fontSize:13}}>
                    Belum ada jadwal imunisasi. Daftarkan anak dulu untuk generate jadwal otomatis.
                  </div>
                ):activeAnakImun.map((im,i)=>{
                  const jadwal=JADWAL_IMUNISASI.find(j=>j.jenis===im.jenis);
                  const lewat=im.status==="belum"&&new Date(im.tanggal_jadwal)<new Date();
                  const SC={sudah:"#2d5a40",terlewat:"#8b0000",belum:lewat?"#dc3545":"#b8943f"};
                  const SL={sudah:"✅ Sudah",terlewat:"❌ Terlewat",belum:lewat?"⚠️ Terlambat":"🕐 Belum"};
                  return(
                    <div key={im.id} style={{padding:"14px 18px",borderBottom:i<activeAnakImun.length-1?"1px solid rgba(45,90,64,0.07)":"none",display:"flex",alignItems:"center",gap:12}}>
                      <div style={{width:36,height:36,borderRadius:10,background:(SC[im.status as keyof typeof SC]||"#9a8c85")+"15",display:"flex",alignItems:"center",justifyContent:"center",fontSize:16,flexShrink:0}}>
                        💉
                      </div>
                      <div style={{flex:1}}>
                        <div style={{fontWeight:700,fontSize:13,color:"#1a2e1f"}}>{jadwal?.label||im.jenis}</div>
                        <div style={{fontSize:11,color:"#7a9a7e",marginTop:2}}>
                          Jadwal: {formatTgl(im.tanggal_jadwal)} (usia {im.usia_bulan} bulan)
                          {im.tanggal_realisasi&&<span style={{color:"#2d5a40"}}> · Dilakukan: {formatTgl(im.tanggal_realisasi)}</span>}
                        </div>
                      </div>
                      <div style={{display:"flex",alignItems:"center",gap:8}}>
                        <span style={{background:(SC[im.status as keyof typeof SC]||"#9a8c85")+"15",color:(SC[im.status as keyof typeof SC]||"#9a8c85"),border:`1px solid ${(SC[im.status as keyof typeof SC]||"#9a8c85")}30`,borderRadius:20,padding:"3px 10px",fontSize:11,fontWeight:600}}>
                          {SL[im.status as keyof typeof SL]||im.status}
                        </span>
                        {im.status==="belum"&&(
                          <div style={{display:"flex",gap:4}}>
                            <button onClick={()=>updateImunisasi(im.id,new Date().toISOString().split("T")[0])}
                              style={{background:"rgba(45,90,64,0.08)",border:"none",borderRadius:8,padding:"5px 10px",cursor:"pointer",fontSize:11,color:"#2d5a40",fontWeight:600}}>✅ Catat</button>
                            {lewat&&<button onClick={()=>tandaiTerlewat(im.id)}
                              style={{background:"rgba(139,0,0,0.08)",border:"none",borderRadius:8,padding:"5px 10px",cursor:"pointer",fontSize:11,color:"#8b0000"}}>❌ Lewat</button>}
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
    </div>
  );
}
