"use client";
import { useState, useEffect } from "react";
import { supabase, isSupabaseReady } from "@/lib/supabase";

interface ZakatRow { id:string; kk_id:string; tahun:number; jumlah_jiwa:number; jenis:string; nominal_kg:number; nominal_uang:number; tgl_bayar:string; keluarga:{kepala_keluarga:string;rt:string;golongan_zakat:string}; }
interface KK { id:string; kepala_keluarga:string; rt:string; golongan_zakat:string; kategori_mustahiq:string; no_wa:string; }
interface Anggota { id:string; kk_id:string; nama:string; hubungan:string; jumlah_jiwa?:number; }

const HARGA_BERAS = 15000;
const TAHUN_INI = new Date().getFullYear();

// Distribusi zakat berdasarkan 8 asnaf (%)
const ASNAF_DISTRIBUSI = [
  { key:"fakir",      label:"Fakir",        pct:25, icon:"🏚️", desc:"Tidak punya apa-apa" },
  { key:"miskin",     label:"Miskin",       pct:25, icon:"🧑‍🦯", desc:"Punya tapi kurang" },
  { key:"amil",       label:"Amil",         pct:12.5, icon:"🕌", desc:"Pengurus zakat" },
  { key:"muallaf",    label:"Muallaf",      pct:12.5, icon:"🤲", desc:"Baru masuk Islam" },
  { key:"gharimin",   label:"Gharimin",     pct:12.5, icon:"💸", desc:"Terlilit hutang" },
  { key:"fisabilillah",label:"Fisabilillah",pct:6.25, icon:"⚔️", desc:"Di jalan Allah" },
  { key:"ibnu_sabil", label:"Ibnu Sabil",   pct:6.25, icon:"🧳", desc:"Musafir terlantar" },
];

const emptyForm = { kk_id:"", tahun:TAHUN_INI, jumlah_jiwa:1, jenis:"beras", nominal_kg:0, nominal_uang:0, tgl_bayar:new Date().toISOString().split("T")[0] };

const LS={fontSize:11,fontWeight:700 as const,color:"#6b7c6d",letterSpacing:"0.06em",textTransform:"uppercase" as const,display:"block",marginBottom:4};
const IS={width:"100%",padding:"9px 12px",borderRadius:10,border:"1.5px solid rgba(45,90,64,0.2)",fontSize:13,background:"#fafaf8",outline:"none",boxSizing:"border-box" as const,fontFamily:"inherit"};

export default function AdminZakatV2Page(){
  const[kkList,setKkList]=useState<KK[]>([]);
  const[zakatList,setZakatList]=useState<ZakatRow[]>([]);
  const[form,setForm]=useState(emptyForm);
  const[tab,setTab]=useState<"input"|"rekap"|"distribusi"|"muzakki"|"mustahiq">("rekap");
  const[loading,setLoading]=useState(false);
  const[toast,setToast]=useState({msg:"",ok:true});
  const[tahunFilter,setTahunFilter]=useState(TAHUN_INI);

  function showToast(msg:string,ok=true){setToast({msg,ok});setTimeout(()=>setToast({msg:"",ok:true}),3500);}

  async function fetchAll(){
    if(!isSupabaseReady())return;
    const[kk,z]=await Promise.all([
      supabase.from("keluarga").select("id,kepala_keluarga,rt,golongan_zakat,kategori_mustahiq,no_wa").order("rt").order("kepala_keluarga"),
      supabase.from("zakat_fitrah").select("*,keluarga(kepala_keluarga,rt,golongan_zakat)").order("tgl_bayar",{ascending:false}),
    ]);
    if(kk.data)setKkList(kk.data as KK[]);
    if(z.data)setZakatList(z.data as any);
  }

  useEffect(()=>{fetchAll();},[]);

  // Auto-hitung nominal
  function hitungZakat(){
    if(form.jenis==="beras")return{kg:form.jumlah_jiwa*2.5,uang:form.jumlah_jiwa*2.5*HARGA_BERAS};
    return{kg:0,uang:form.jumlah_jiwa*40000};
  }

  async function simpan(){
    if(!form.kk_id)return showToast("❌ Pilih warga dulu!",false);
    // Cek sudah bayar tahun ini
    const sudah=zakatList.find(z=>z.kk_id===form.kk_id&&z.tahun===form.tahun);
    if(sudah)return showToast("⚠️ KK ini sudah bayar zakat tahun "+form.tahun,false);
    setLoading(true);
    const{kg,uang}=hitungZakat();
    const{error}=await supabase.from("zakat_fitrah").insert({...form,nominal_kg:kg,nominal_uang:uang});
    if(error)showToast(`❌ ${error.message}`,false);
    else{showToast("✅ Zakat tercatat!");setForm(emptyForm);}
    setLoading(false);fetchAll();
  }

  // Data kalkulasi
  const zakatTahunIni=zakatList.filter(z=>z.tahun===tahunFilter);
  const totalKg=zakatTahunIni.filter(z=>z.jenis==="beras").reduce((s,z)=>s+Number(z.nominal_kg),0);
  const totalUang=zakatTahunIni.reduce((s,z)=>s+Number(z.nominal_uang),0);
  const totalJiwa=zakatTahunIni.reduce((s,z)=>s+z.jumlah_jiwa,0);

  const muzakkiList=kkList.filter(k=>k.golongan_zakat==="muzakki");
  const mustahiqList=kkList.filter(k=>k.golongan_zakat==="mustahiq");
  const sudahBayar=new Set(zakatTahunIni.map(z=>z.kk_id));
  const belumBayar=muzakkiList.filter(k=>!sudahBayar.has(k.id));

  // Kalkulasi distribusi
  const totalUangDistribusi=totalUang*(1-0.125); // kurangi bagian amil
  const distribusiPerAsnaf=ASNAF_DISTRIBUSI.map(a=>({
    ...a,
    nominal:Math.round((totalUang*a.pct)/100),
    penerima:mustahiqList.filter(k=>k.kategori_mustahiq===a.key).length,
  }));

  const{kg:prevKg,uang:prevUang}=hitungZakat();

  return(
    <div style={{minHeight:"100vh",background:"#f5f0e8",fontFamily:"'Segoe UI',system-ui,sans-serif"}}>
      {toast.msg&&<div style={{position:"fixed",top:20,left:"50%",transform:"translateX(-50%)",background:toast.ok?"#2d5a40":"#dc3545",color:"white",padding:"10px 20px",borderRadius:12,zIndex:999,fontSize:14,boxShadow:"0 4px 20px rgba(0,0,0,0.15)",maxWidth:"85vw",textAlign:"center"}}>{toast.msg}</div>}

      <header style={{background:"#f5f0e8",borderBottom:"1px solid rgba(45,90,64,0.12)",padding:"14px 20px",position:"sticky",top:0,zIndex:10,display:"flex",alignItems:"center",justifyContent:"space-between"}}>
        <div style={{display:"flex",alignItems:"center",gap:12}}>
          <a href="/admin" style={{color:"#6b7c6d",textDecoration:"none",fontSize:13}}>← Admin</a>
          <span style={{color:"#c8bfaa"}}>|</span>
          <div>
            <div style={{fontWeight:800,fontSize:15,color:"#1a2e1f"}}>🕌 Zakat & Sumbangan</div>
            <div style={{fontSize:10,color:"#7a9a7e",textTransform:"uppercase",letterSpacing:"0.08em"}}>{zakatTahunIni.length} KK bayar · {belumBayar.length} belum</div>
          </div>
        </div>
        <div style={{display:"flex",gap:6,flexWrap:"wrap"}}>
          {(["rekap","input","distribusi","muzakki","mustahiq"] as const).map(t=>(
            <button key={t} onClick={()=>setTab(t)} style={{padding:"5px 11px",borderRadius:20,fontSize:11,fontWeight:600,border:"1.5px solid rgba(45,90,64,0.2)",cursor:"pointer",background:tab===t?"#2d5a40":"transparent",color:tab===t?"white":"#6b7c6d"}}>
              {{rekap:"📊 Rekap",input:"📥 Input",distribusi:"⚖️ Distribusi",muzakki:"✅ Muzakki",mustahiq:"🤲 Mustahiq"}[t]}
            </button>
          ))}
        </div>
      </header>

      <div style={{maxWidth:960,margin:"0 auto",padding:"20px 16px"}}>

        {/* Filter tahun */}
        <div style={{display:"flex",alignItems:"center",gap:10,marginBottom:16}}>
          <span style={{fontSize:13,color:"#6b7c6d",fontWeight:600}}>Tahun:</span>
          {[TAHUN_INI,TAHUN_INI-1,TAHUN_INI-2].map(t=>(
            <button key={t} onClick={()=>setTahunFilter(t)} style={{padding:"5px 14px",borderRadius:20,fontSize:12,fontWeight:600,border:"1.5px solid rgba(45,90,64,0.2)",cursor:"pointer",background:tahunFilter===t?"#2d5a40":"white",color:tahunFilter===t?"white":"#6b7c6d"}}>{t}</button>
          ))}
        </div>

        {/* Stats cards */}
        <div style={{display:"grid",gridTemplateColumns:"repeat(4,1fr)",gap:12,marginBottom:20}}>
          {[
            {i:"🏠",v:`${zakatTahunIni.length} KK`,l:"Sudah Bayar",c:"#2d5a40"},
            {i:"❌",v:`${belumBayar.length} KK`,l:"Belum Bayar",c:"#dc3545"},
            {i:"🌾",v:`${totalKg.toFixed(1)} kg`,l:"Total Beras",c:"#b8943f"},
            {i:"💰",v:`Rp${(totalUang/1000000).toFixed(1)}jt`,l:"Total Nilai",c:"#1a3a6b"},
          ].map(s=>(
            <div key={s.l} style={{background:"white",borderRadius:14,padding:"14px 16px",border:`1px solid ${s.c}20`,boxShadow:"0 1px 6px rgba(0,0,0,0.04)",borderLeft:`4px solid ${s.c}`}}>
              <div style={{fontSize:20,marginBottom:6}}>{s.i}</div>
              <div style={{fontSize:20,fontWeight:900,color:s.c}}>{s.v}</div>
              <div style={{fontSize:11,color:"#7a9a7e",textTransform:"uppercase",letterSpacing:"0.06em"}}>{s.l}</div>
            </div>
          ))}
        </div>

        {/* ── REKAP TAB ── */}
        {tab==="rekap"&&(
          <div>
            {/* Alert belum bayar */}
            {belumBayar.length>0&&(
              <div style={{background:"rgba(220,53,69,0.07)",border:"1px solid rgba(220,53,69,0.2)",borderRadius:12,padding:"12px 16px",marginBottom:16,display:"flex",alignItems:"center",gap:10}}>
                <span style={{fontSize:18}}>⚠️</span>
                <span style={{fontSize:13,color:"#dc3545"}}><strong>{belumBayar.length} muzakki</strong> belum bayar zakat {tahunFilter}: {belumBayar.slice(0,3).map(k=>k.kepala_keluarga).join(", ")}{belumBayar.length>3&&` +${belumBayar.length-3} lainnya`}</span>
              </div>
            )}

            {/* Progress bayar */}
            <div style={{background:"white",borderRadius:16,padding:18,border:"1px solid rgba(45,90,64,0.1)",boxShadow:"0 1px 6px rgba(0,0,0,0.04)",marginBottom:16}}>
              <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:10}}>
                <span style={{fontWeight:700,fontSize:14,color:"#1a2e1f"}}>Progress Pembayaran {tahunFilter}</span>
                <span style={{fontSize:13,fontWeight:700,color:"#2d5a40"}}>{muzakkiList.length>0?Math.round((zakatTahunIni.length/muzakkiList.length)*100):0}%</span>
              </div>
              <div style={{height:10,background:"rgba(45,90,64,0.1)",borderRadius:6,overflow:"hidden"}}>
                <div style={{height:"100%",width:`${muzakkiList.length>0?(zakatTahunIni.length/muzakkiList.length)*100:0}%`,background:"linear-gradient(90deg,#2d5a40,#4a8c5c)",borderRadius:6,transition:"width 0.8s"}}/>
              </div>
              <div style={{display:"flex",justifyContent:"space-between",marginTop:6,fontSize:11,color:"#7a9a7e"}}>
                <span>{zakatTahunIni.length} sudah bayar</span>
                <span>{muzakkiList.length} total muzakki</span>
              </div>
            </div>

            {/* List pembayaran */}
            <div style={{background:"white",borderRadius:16,border:"1px solid rgba(45,90,64,0.1)",overflow:"hidden",boxShadow:"0 1px 6px rgba(0,0,0,0.04)"}}>
              <div style={{padding:"12px 18px",borderBottom:"1px solid rgba(45,90,64,0.08)",display:"flex",justifyContent:"space-between"}}>
                <span style={{fontSize:12,fontWeight:700,color:"#6b7c6d",textTransform:"uppercase",letterSpacing:"0.06em"}}>Riwayat Pembayaran</span>
                <span style={{fontSize:12,color:"#7a9a7e"}}>{totalJiwa} jiwa · {totalKg.toFixed(1)}kg beras</span>
              </div>
              {zakatTahunIni.length===0?(
                <div style={{padding:40,textAlign:"center",color:"#a8b5a9"}}>Belum ada pembayaran zakat {tahunFilter}</div>
              ):zakatTahunIni.map((z,i)=>(
                <div key={z.id} style={{padding:"12px 18px",borderBottom:i<zakatTahunIni.length-1?"1px solid rgba(45,90,64,0.07)":"none",display:"flex",alignItems:"center",gap:12}}>
                  <div style={{fontSize:20}}>{z.jenis==="beras"?"🌾":"💰"}</div>
                  <div style={{flex:1}}>
                    <div style={{fontWeight:600,fontSize:14,color:"#1a2e1f"}}>{z.keluarga?.kepala_keluarga}</div>
                    <div style={{fontSize:12,color:"#7a9a7e"}}>RT {z.keluarga?.rt} · {z.jumlah_jiwa} jiwa · {new Date(z.tgl_bayar).toLocaleDateString("id-ID")}</div>
                  </div>
                  <div style={{fontWeight:800,fontSize:15,color:"#2d5a40"}}>
                    {z.jenis==="beras"?`${z.nominal_kg}kg`:`Rp${(z.nominal_uang/1000).toFixed(0)}rb`}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ── INPUT TAB ── */}
        {tab==="input"&&(
          <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:16}}>
            <div style={{background:"white",borderRadius:16,padding:20,border:"1px solid rgba(45,90,64,0.1)",boxShadow:"0 1px 6px rgba(0,0,0,0.04)"}}>
              <h3 style={{margin:"0 0 16px",color:"#1a2e1f",fontSize:15}}>📥 Input Zakat Fitrah</h3>
              <div style={{marginBottom:12}}>
                <label style={LS}>Warga / KK *</label>
                <select value={form.kk_id} onChange={e=>setForm({...form,kk_id:e.target.value})} style={IS}>
                  <option value="">-- Pilih warga --</option>
                  {kkList.map(k=>(
                    <option key={k.id} value={k.id} style={{color:sudahBayar.has(k.id)?"#a8b5a9":"inherit"}}>
                      {k.kepala_keluarga} (RT {k.rt}){sudahBayar.has(k.id)?" ✅":""}
                    </option>
                  ))}
                </select>
              </div>
              <div style={{marginBottom:12}}>
                <label style={LS}>Jumlah Jiwa *</label>
                <input type="number" min="1" value={form.jumlah_jiwa} onChange={e=>setForm({...form,jumlah_jiwa:Number(e.target.value)})} style={IS}/>
              </div>
              <div style={{marginBottom:16}}>
                <label style={LS}>Jenis Zakat</label>
                <div style={{display:"flex",gap:8}}>
                  {[{v:"beras",l:"🌾 Beras"},{v:"uang",l:"💰 Uang"}].map(({v,l})=>(
                    <button key={v} onClick={()=>setForm({...form,jenis:v})} style={{flex:1,padding:"9px",borderRadius:10,border:"1.5px solid rgba(45,90,64,0.2)",cursor:"pointer",background:form.jenis===v?"#2d5a40":"transparent",color:form.jenis===v?"white":"#2d5a40",fontSize:13,fontWeight:600}}>{l}</button>
                  ))}
                </div>
              </div>
              <div style={{marginBottom:12}}>
                <label style={LS}>Tanggal Bayar</label>
                <input type="date" value={form.tgl_bayar} onChange={e=>setForm({...form,tgl_bayar:e.target.value})} style={IS}/>
              </div>

              {/* Preview */}
              <div style={{background:"rgba(45,90,64,0.06)",border:"1px solid rgba(45,90,64,0.15)",borderRadius:12,padding:"12px 16px",marginBottom:16}}>
                <div style={{fontSize:12,color:"#7a9a7e",marginBottom:4}}>Estimasi Zakat</div>
                <div style={{fontWeight:900,fontSize:18,color:"#2d5a40"}}>
                  {form.jenis==="beras"?`${prevKg.toFixed(1)} kg beras`:`Rp ${prevUang.toLocaleString("id-ID")}`}
                </div>
                <div style={{fontSize:12,color:"#7a9a7e"}}>{form.jumlah_jiwa} jiwa × {form.jenis==="beras"?"2.5 kg":"Rp 40.000"}</div>
              </div>

              <button onClick={simpan} disabled={loading} style={{width:"100%",background:loading?"#a8b5a9":"#2d5a40",color:"white",border:"none",borderRadius:10,padding:"11px",fontSize:14,fontWeight:600,cursor:loading?"not-allowed":"pointer"}}>
                {loading?"Menyimpan...":"💾 Simpan Zakat"}
              </button>
            </div>

            {/* Belum bayar list */}
            <div>
              <h4 style={{margin:"0 0 12px",fontSize:13,fontWeight:700,color:"#dc3545"}}>❌ Muzakki Belum Bayar ({belumBayar.length})</h4>
              <div style={{background:"white",borderRadius:16,border:"1px solid rgba(45,90,64,0.1)",overflow:"hidden",maxHeight:400,overflowY:"auto"}}>
                {belumBayar.length===0?(
                  <div style={{padding:24,textAlign:"center",color:"#2d5a40",fontWeight:600}}>🎉 Semua muzakki sudah bayar!</div>
                ):belumBayar.map((k,i)=>(
                  <div key={k.id} onClick={()=>setForm({...form,kk_id:k.id})}
                    style={{padding:"12px 16px",borderBottom:i<belumBayar.length-1?"1px solid rgba(45,90,64,0.07)":"none",cursor:"pointer",background:form.kk_id===k.id?"rgba(45,90,64,0.06)":"transparent",display:"flex",alignItems:"center",gap:10}}>
                    <div style={{flex:1}}>
                      <div style={{fontWeight:600,fontSize:13,color:"#1a2e1f"}}>{k.kepala_keluarga}</div>
                      <div style={{fontSize:11,color:"#7a9a7e"}}>RT {k.rt}</div>
                    </div>
                    <span style={{fontSize:12,color:"#2d5a40",fontWeight:600}}>Pilih →</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* ── DISTRIBUSI TAB ── */}
        {tab==="distribusi"&&(
          <div>
            <div style={{background:"white",borderRadius:16,padding:20,border:"1px solid rgba(45,90,64,0.1)",boxShadow:"0 1px 6px rgba(0,0,0,0.04)",marginBottom:16}}>
              <h3 style={{margin:"0 0 4px",fontSize:15,color:"#1a2e1f",fontWeight:800}}>⚖️ Distribusi Zakat {tahunFilter}</h3>
              <p style={{margin:"0 0 20px",fontSize:12,color:"#7a9a7e"}}>Berdasarkan 8 Asnaf (golongan penerima zakat)</p>

              {/* Total */}
              <div style={{display:"grid",gridTemplateColumns:"1fr 1fr 1fr",gap:12,marginBottom:20}}>
                {[
                  {l:"Total Terkumpul",v:`Rp${(totalUang/1000).toFixed(0)}rb`,i:"💰"},
                  {l:"Untuk Distribusi",v:`Rp${(totalUang*0.875/1000).toFixed(0)}rb`,i:"📤"},
                  {l:"Bagian Amil (12.5%)",v:`Rp${(totalUang*0.125/1000).toFixed(0)}rb`,i:"🕌"},
                ].map(s=>(
                  <div key={s.l} style={{background:"rgba(45,90,64,0.05)",borderRadius:12,padding:"12px 14px"}}>
                    <div style={{fontSize:20,marginBottom:4}}>{s.i}</div>
                    <div style={{fontWeight:800,fontSize:16,color:"#2d5a40"}}>{s.v}</div>
                    <div style={{fontSize:11,color:"#7a9a7e"}}>{s.l}</div>
                  </div>
                ))}
              </div>

              {/* Per asnaf */}
              {distribusiPerAsnaf.map(a=>(
                <div key={a.key} style={{display:"flex",alignItems:"center",gap:14,padding:"12px 0",borderBottom:"1px solid rgba(45,90,64,0.08)"}}>
                  <div style={{fontSize:24,width:36,textAlign:"center",flexShrink:0}}>{a.icon}</div>
                  <div style={{flex:1}}>
                    <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:4}}>
                      <span style={{fontWeight:700,fontSize:13,color:"#1a2e1f"}}>{a.label}</span>
                      <span style={{fontSize:13,fontWeight:800,color:"#2d5a40"}}>Rp{(a.nominal/1000).toFixed(0)}rb ({a.pct}%)</span>
                    </div>
                    <div style={{height:6,background:"rgba(45,90,64,0.1)",borderRadius:4,overflow:"hidden",marginBottom:4}}>
                      <div style={{height:"100%",width:`${a.pct*4}%`,background:"#2d5a40",borderRadius:4}}/>
                    </div>
                    <div style={{fontSize:11,color:"#7a9a7e"}}>{a.desc} · {a.penerima} penerima terdaftar</div>
                  </div>
                </div>
              ))}
            </div>

            {/* Penerima per asnaf */}
            <div style={{background:"white",borderRadius:16,padding:18,border:"1px solid rgba(45,90,64,0.1)",boxShadow:"0 1px 6px rgba(0,0,0,0.04)"}}>
              <h4 style={{margin:"0 0 14px",fontSize:13,fontWeight:700,color:"#1a2e1f"}}>🤲 Daftar Penerima Zakat</h4>
              {mustahiqList.length===0?(
                <div style={{textAlign:"center",padding:20,color:"#a8b5a9",fontSize:13}}>
                  Belum ada data mustahiq. Update golongan zakat di Data Warga.
                </div>
              ):(
                <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fill,minmax(200px,1fr))",gap:10}}>
                  {mustahiqList.map(k=>{
                    const asnaf=ASNAF_DISTRIBUSI.find(a=>a.key===k.kategori_mustahiq);
                    const totalMustahiqKat=mustahiqList.filter(m=>m.kategori_mustahiq===k.kategori_mustahiq).length;
                    const bagian=asnaf?Math.round((totalUang*asnaf.pct/100)/Math.max(totalMustahiqKat,1)):0;
                    return(
                      <div key={k.id} style={{background:"rgba(45,90,64,0.04)",borderRadius:12,padding:"12px 14px",border:"1px solid rgba(45,90,64,0.1)"}}>
                        <div style={{fontWeight:700,fontSize:13,color:"#1a2e1f"}}>{k.kepala_keluarga}</div>
                        <div style={{fontSize:11,color:"#7a9a7e",marginTop:2}}>RT {k.rt} · {asnaf?.label||k.kategori_mustahiq||"Belum dikategorikan"}</div>
                        {bagian>0&&<div style={{fontSize:12,fontWeight:700,color:"#2d5a40",marginTop:4}}>≈ Rp{bagian.toLocaleString("id-ID")}</div>}
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        )}

        {/* ── MUZAKKI TAB ── */}
        {tab==="muzakki"&&(
          <div>
            <div style={{display:"flex",gap:12,marginBottom:16}}>
              <div style={{background:"white",borderRadius:14,padding:"14px 18px",border:"1px solid rgba(45,90,64,0.1)",flex:1}}>
                <div style={{fontSize:22,fontWeight:900,color:"#2d5a40"}}>{muzakkiList.length}</div>
                <div style={{fontSize:11,color:"#7a9a7e",textTransform:"uppercase"}}>Total Muzakki</div>
              </div>
              <div style={{background:"white",borderRadius:14,padding:"14px 18px",border:"1px solid rgba(45,90,64,0.1)",flex:1}}>
                <div style={{fontSize:22,fontWeight:900,color:"#2d5a40"}}>{zakatTahunIni.length}</div>
                <div style={{fontSize:11,color:"#7a9a7e",textTransform:"uppercase"}}>Sudah Bayar {tahunFilter}</div>
              </div>
              <div style={{background:"white",borderRadius:14,padding:"14px 18px",border:"1px solid rgba(220,53,69,0.15)",flex:1}}>
                <div style={{fontSize:22,fontWeight:900,color:"#dc3545"}}>{belumBayar.length}</div>
                <div style={{fontSize:11,color:"#7a9a7e",textTransform:"uppercase"}}>Belum Bayar</div>
              </div>
            </div>
            <div style={{background:"white",borderRadius:16,border:"1px solid rgba(45,90,64,0.1)",overflow:"hidden"}}>
              {muzakkiList.map((k,i)=>{
                const bayar=zakatTahunIni.find(z=>z.kk_id===k.id);
                return(
                  <div key={k.id} style={{padding:"12px 18px",borderBottom:i<muzakkiList.length-1?"1px solid rgba(45,90,64,0.07)":"none",display:"flex",alignItems:"center",gap:12}}>
                    <div style={{width:8,height:8,borderRadius:"50%",background:bayar?"#2d5a40":"#dc3545",flexShrink:0}}/>
                    <div style={{flex:1}}>
                      <div style={{fontWeight:600,fontSize:14,color:"#1a2e1f"}}>{k.kepala_keluarga}</div>
                      <div style={{fontSize:11,color:"#7a9a7e"}}>RT {k.rt}</div>
                    </div>
                    {bayar?(
                      <div style={{textAlign:"right"}}>
                        <div style={{fontSize:13,fontWeight:700,color:"#2d5a40"}}>✅ Sudah</div>
                        <div style={{fontSize:11,color:"#7a9a7e"}}>{bayar.jenis==="beras"?`${bayar.nominal_kg}kg`:`Rp${(bayar.nominal_uang/1000).toFixed(0)}rb`}</div>
                      </div>
                    ):(
                      <div style={{background:"rgba(220,53,69,0.08)",color:"#dc3545",border:"1px solid rgba(220,53,69,0.2)",borderRadius:20,padding:"3px 10px",fontSize:11,fontWeight:600}}>Belum</div>
                    )}
                  </div>
                );
              })}
              {muzakkiList.length===0&&(
                <div style={{padding:40,textAlign:"center",color:"#a8b5a9"}}>
                  Belum ada muzakki. Update golongan zakat di Data Warga.
                </div>
              )}
            </div>
          </div>
        )}

        {/* ── MUSTAHIQ TAB ── */}
        {tab==="mustahiq"&&(
          <div>
            <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fill,minmax(140px,1fr))",gap:10,marginBottom:16}}>
              {ASNAF_DISTRIBUSI.map(a=>{
                const jml=mustahiqList.filter(k=>k.kategori_mustahiq===a.key).length;
                return(
                  <div key={a.key} style={{background:"white",borderRadius:14,padding:"14px 12px",border:"1px solid rgba(45,90,64,0.1)",textAlign:"center"}}>
                    <div style={{fontSize:24,marginBottom:4}}>{a.icon}</div>
                    <div style={{fontSize:20,fontWeight:900,color:"#2d5a40"}}>{jml}</div>
                    <div style={{fontSize:11,color:"#7a9a7e"}}>{a.label}</div>
                  </div>
                );
              })}
            </div>

            <div style={{background:"white",borderRadius:16,border:"1px solid rgba(45,90,64,0.1)",overflow:"hidden"}}>
              <div style={{padding:"12px 18px",borderBottom:"1px solid rgba(45,90,64,0.08)"}}>
                <span style={{fontSize:12,fontWeight:700,color:"#6b7c6d",textTransform:"uppercase",letterSpacing:"0.06em"}}>Daftar Mustahiq ({mustahiqList.length} KK)</span>
              </div>
              {mustahiqList.length===0?(
                <div style={{padding:40,textAlign:"center",color:"#a8b5a9"}}>Belum ada mustahiq terdaftar. Update di Data Warga → Golongan Zakat.</div>
              ):mustahiqList.map((k,i)=>{
                const asnaf=ASNAF_DISTRIBUSI.find(a=>a.key===k.kategori_mustahiq);
                return(
                  <div key={k.id} style={{padding:"12px 18px",borderBottom:i<mustahiqList.length-1?"1px solid rgba(45,90,64,0.07)":"none",display:"flex",alignItems:"center",gap:12}}>
                    <div style={{fontSize:22}}>{asnaf?.icon||"🤲"}</div>
                    <div style={{flex:1}}>
                      <div style={{fontWeight:600,fontSize:14,color:"#1a2e1f"}}>{k.kepala_keluarga}</div>
                      <div style={{fontSize:11,color:"#7a9a7e"}}>RT {k.rt} · {asnaf?.label||"Belum dikategorikan"}</div>
                    </div>
                    <div style={{fontSize:11,color:"#7a9a7e"}}>{asnaf?.desc||""}</div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

      </div>
    </div>
  );
}
