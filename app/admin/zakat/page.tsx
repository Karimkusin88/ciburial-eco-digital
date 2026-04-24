"use client";
import { useState, useEffect } from "react";
import { supabase, isSupabaseReady } from "@/lib/supabase";

interface ZakatRow { id:string; kk_id:string; tahun:number; jumlah_jiwa:number; jenis:string; nominal_kg:number; nominal_uang:number; infaq_uang:number; tgl_bayar:string; keluarga:{kepala_keluarga:string;rt:string;golongan_zakat:string}; }
interface KK { id:string; kepala_keluarga:string; rt:string; golongan_zakat:string; kategori_mustahiq:string; no_wa:string; is_yatim?:boolean; }

const HARGA_BERAS = 15000;
const TAHUN_INI = new Date().getFullYear();

const emptyForm = { kk_id:"", tahun:TAHUN_INI, jumlah_jiwa:1, jenis:"beras", nominal_kg:0, nominal_uang:0, infaq_uang:0, tgl_bayar:new Date().toISOString().split("T")[0] };

const LS={fontSize:11,fontWeight:700 as const,color:"#6b7c6d",letterSpacing:"0.06em",textTransform:"uppercase" as const,display:"block",marginBottom:4};
const IS={width:"100%",padding:"9px 12px",borderRadius:10,border:"1.5px solid rgba(45,90,64,0.2)",fontSize:13,background:"#fafaf8",outline:"none",boxSizing:"border-box" as const,fontFamily:"inherit"};

export default function AdminZakatV2Page(){
  const[kkList,setKkList]=useState<KK[]>([]);
  const[zakatList,setZakatList]=useState<ZakatRow[]>([]);
  const[anggotaList,setAnggotaList]=useState<any[]>([]);
  const[form,setForm]=useState(emptyForm);
  const[tab,setTab]=useState<"input"|"rekap"|"distribusi"|"infaq_khusus">("rekap");
  const[loading,setLoading]=useState(false);
  const[toast,setToast]=useState({msg:"",ok:true});
  const[tahunFilter,setTahunFilter]=useState(TAHUN_INI);
  const[jatahKgPerJiwa,setJatahKgPerJiwa]=useState(2.0);

  function showToast(msg:string,ok=true){setToast({msg,ok});setTimeout(()=>setToast({msg:"",ok:true}),3500);}

  async function fetchAll(){
    if(!isSupabaseReady())return;
    const[kk,z,ang]=await Promise.all([
      supabase.from("keluarga").select("id,kepala_keluarga,rt,golongan_zakat,kategori_mustahiq,no_wa,is_yatim").order("rt").order("kepala_keluarga"),
      supabase.from("zakat_fitrah").select("*,keluarga(kepala_keluarga,rt,golongan_zakat)").order("tgl_bayar",{ascending:false}),
      supabase.from("anggota_kk").select("id,kk_id"),
    ]);
    if(kk.data)setKkList(kk.data as KK[]);
    if(z.data)setZakatList(z.data as any);
    if(ang.data)setAnggotaList(ang.data);
  }

  useEffect(()=>{fetchAll();},[]);

  function hitungZakat(){
    if(form.jenis==="beras")return{kg:form.jumlah_jiwa*2.5,uang:form.jumlah_jiwa*2.5*HARGA_BERAS};
    return{kg:0,uang:form.jumlah_jiwa*40000};
  }

  async function simpan(){
    if(!form.kk_id)return showToast("❌ Pilih warga dulu!",false);
    setLoading(true);
    const{kg,uang}=hitungZakat();
    const{error}=await supabase.from("zakat_fitrah").insert({...form,nominal_kg:kg,nominal_uang:uang});
    if(error)showToast(`❌ ${error.message}`,false);
    else{showToast("✅ Data berhasil disimpan!");setForm(emptyForm);}
    setLoading(false);fetchAll();
  }

  // Update status yatim/penerima infaq
  async function toggleYatim(id:string, val:boolean){
    const{error}=await supabase.from("keluarga").update({is_yatim: !val}).eq("id", id);
    if(!error) fetchAll();
  }

  const zakatTahunIni=zakatList.filter(z=>z.tahun===tahunFilter);
  const totalKg=zakatTahunIni.filter(z=>z.jenis==="beras").reduce((s,z)=>s+Number(z.nominal_kg),0);
  const totalUangZakat=zakatTahunIni.reduce((s,z)=>s+Number(z.nominal_uang),0);
  const totalInfaq=zakatTahunIni.reduce((s,z)=>s+Number(z.infaq_uang||0),0);
  
  const mustahiqList=kkList.filter(k=>k.golongan_zakat==="mustahiq");
  const yatimList=kkList.filter(k=>k.is_yatim);
  
  const totalJiwaMustahiq = mustahiqList.reduce((acc, kk) => acc + (anggotaList.filter(a => a.kk_id === kk.id).length || 1), 0);

  const sudahBayar=new Set(zakatTahunIni.map(z=>z.kk_id));
  const belumBayar=kkList.filter(k=>!sudahBayar.has(k.id));

  const {kg:prevKg,uang:prevUang}=hitungZakat();

  return(
    <div style={{minHeight:"100vh",background:"#f5f0e8",fontFamily:"system-ui,sans-serif"}}>
      {toast.msg&&<div style={{position:"fixed",top:20,left:"50%",transform:"translateX(-50%)",background:toast.ok?"#2d5a40":"#dc3545",color:"white",padding:"10px 20px",borderRadius:12,zIndex:999,fontSize:14,boxShadow:"0 4px 20px rgba(0,0,0,0.15)"}}>{toast.msg}</div>}

      <header style={{background:"#f5f0e8",borderBottom:"1px solid rgba(45,90,64,0.12)",padding:"14px 20px",position:"sticky",top:0,zIndex:10,display:"flex",alignItems:"center",justifyContent:"space-between"}}>
        <div style={{display:"flex",alignItems:"center",gap:12}}>
          <a href="/admin" style={{color:"#6b7c6d",textDecoration:"none",fontSize:13}}>← Admin</a>
          <div>
            <div style={{fontWeight:800,fontSize:15,color:"#1a2e1f"}}>🕌 Zakat & Infaq Ciburial</div>
            <div style={{fontSize:10,color:"#7a9a7e",textTransform:"uppercase"}}>Periode {tahunFilter}</div>
          </div>
        </div>
        <div style={{display:"flex",gap:6}}>
          {(["rekap","input","distribusi","infaq_khusus"] as const).map(t=>(
            <button key={t} onClick={()=>setTab(t)} style={{padding:"6px 12px",borderRadius:20,fontSize:11,fontWeight:700,border:"1.5px solid rgba(45,90,64,0.2)",cursor:"pointer",background:tab===t?"#2d5a40":"transparent",color:tab===t?"white":"#6b7c6d"}}>
              {{rekap:"📊 Rekap",input:"📥 Input",distribusi:"⚖️ Pembagian Zakat",infaq_khusus:"🧡 Alokasi Infaq"}[t]}
            </button>
          ))}
        </div>
      </header>

      <div style={{maxWidth:1000,margin:"0 auto",padding:"24px 16px"}}>

        {/* Stats cards */}
        <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fit, minmax(220px, 1fr))",gap:16,marginBottom:24}}>
          <div style={{background:"white",borderRadius:16,padding:20,borderLeft:"5px solid #2d5a40",boxShadow:"0 2px 8px rgba(0,0,0,0.05)"}}>
             <div style={{fontSize:11,fontWeight:800,color:"#999",marginBottom:8}}>TOTAL ZAKAT (BERAS)</div>
             <div style={{fontSize:24,fontWeight:900,color:"#2d5a40"}}>{totalKg.toFixed(1)} <span style={{fontSize:14,fontWeight:600}}>kg</span></div>
          </div>
          <div style={{background:"white",borderRadius:16,padding:20,borderLeft:"5px solid #1a3a6b",boxShadow:"0 2px 8px rgba(0,0,0,0.05)"}}>
             <div style={{fontSize:11,fontWeight:800,color:"#999",marginBottom:8}}>TOTAL ZAKAT (UANG)</div>
             <div style={{fontSize:24,fontWeight:900,color:"#1a3a6b"}}>Rp {totalUangZakat.toLocaleString("id-ID")}</div>
          </div>
          <div style={{background:"white",borderRadius:16,padding:20,borderLeft:"5px solid #b8943f",boxShadow:"0 2px 8px rgba(0,0,0,0.05)"}}>
             <div style={{fontSize:11,fontWeight:800,color:"#999",marginBottom:8}}>TOTAL INFAQ TERKUMPUL</div>
             <div style={{fontSize:24,fontWeight:900,color:"#b8943f"}}>Rp {totalInfaq.toLocaleString("id-ID")}</div>
          </div>
          <div style={{background:"white",borderRadius:16,padding:20,borderLeft:"5px solid #dc3545",boxShadow:"0 2px 8px rgba(0,0,0,0.05)"}}>
             <div style={{fontSize:11,fontWeight:800,color:"#999",marginBottom:8}}>BELUM SETOR</div>
             <div style={{fontSize:24,fontWeight:900,color:"#dc3545"}}>{belumBayar.length} <span style={{fontSize:14,fontWeight:600}}>KK</span></div>
          </div>
        </div>

        {/* ── REKAP TAB ── */}
        {tab==="rekap"&&(
          <div style={{background:"white",borderRadius:20,border:"1px solid rgba(0,0,0,0.05)",overflow:"hidden"}}>
            <div style={{padding:"18px 24px",borderBottom:"1px solid #eee",display:"flex",justifyContent:"space-between",alignItems:"center"}}>
               <h3 style={{fontSize:14,fontWeight:800,color:"#1a2e1f"}}>LOG AKTIVITAS SETORAN</h3>
               <div style={{fontSize:12,color:"#666"}}>{zakatTahunIni.length} Entri ditemukan</div>
            </div>
            {zakatTahunIni.length===0?(
              <div style={{padding:60,textAlign:"center",color:"#999"}}>Belum ada data masuk.</div>
            ):zakatTahunIni.map((z,i)=>(
              <div key={z.id} style={{padding:"16px 24px",borderBottom:i<zakatTahunIni.length-1?"1px solid #f5f5f5":"none",display:"flex",alignItems:"center",gap:16}}>
                <div style={{width:44,height:44,borderRadius:12,background:"#f9f9f7",display:"flex",alignItems:"center",justifyContent:"center",fontSize:20}}>{z.jenis==="beras"?"🌾":"💰"}</div>
                <div style={{flex:1}}>
                  <div style={{fontWeight:700,fontSize:15,color:"#1a2e1f"}}>{z.keluarga?.kepala_keluarga}</div>
                  <div style={{fontSize:12,color:"#777"}}>RT {z.keluarga?.rt} · {new Date(z.tgl_bayar).toLocaleDateString("id-ID")}</div>
                </div>
                <div style={{textAlign:"right"}}>
                  <div style={{fontWeight:800,fontSize:15,color:"#2d5a40"}}>{z.jenis==="beras"?`${z.nominal_kg}kg Beras`:`Rp${z.nominal_uang.toLocaleString()}`}</div>
                  {z.infaq_uang > 0 && <div style={{fontSize:11,fontWeight:700,color:"#b8943f"}}>+ Infaq Rp{z.infaq_uang.toLocaleString()}</div>}
                </div>
              </div>
            ))}
          </div>
        )}

        {/* ── INPUT TAB ── */}
        {tab==="input"&&(
          <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fit, minmax(320px, 1fr))",gap:20}}>
            <div style={{background:"white",borderRadius:20,padding:28,boxShadow:"0 4px 12px rgba(0,0,0,0.03)"}}>
              <h3 style={{margin:"0 0 24px",color:"#1a2e1f",fontSize:17,fontWeight:800}}>📥 Form Setoran Zakat & Infaq</h3>
              <div style={{marginBottom:16}}>
                <label style={LS}>Kepala Keluarga *</label>
                <select value={form.kk_id} onChange={e=>{
                  const jml = anggotaList.filter(a => a.kk_id === e.target.value).length || 1;
                  setForm({...form, kk_id:e.target.value, jumlah_jiwa: jml});
                }} style={IS}>
                  <option value="">-- Pilih KK --</option>
                  {kkList.map(k=>(
                    <option key={k.id} value={k.id} style={{color:sudahBayar.has(k.id)?"#bbb":"inherit"}}>
                      {k.kepala_keluarga} (RT {k.rt}){sudahBayar.has(k.id)?" ✅":""}
                    </option>
                  ))}
                </select>
              </div>
              
              <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:16,marginBottom:16}}>
                <div>
                  <label style={LS}>Jiwa</label>
                  <input type="number" value={form.jumlah_jiwa} onChange={e=>setForm({...form,jumlah_jiwa:Number(e.target.value)})} style={IS}/>
                </div>
                <div>
                  <label style={LS}>Jenis Zakat</label>
                  <select value={form.jenis} onChange={e=>setForm({...form,jenis:e.target.value})} style={IS}>
                    <option value="beras">🌾 Beras</option>
                    <option value="uang">💰 Uang</option>
                  </select>
                </div>
              </div>

              <div style={{background:"#f9f9f7",padding:20,borderRadius:14,marginBottom:20,border:"1px solid #eee"}}>
                <div style={{display:"flex",justifyContent:"space-between",marginBottom:10}}>
                   <span style={{fontSize:12,fontWeight:700,color:"#777"}}>WAJIB ZAKAT</span>
                   <span style={{fontSize:14,fontWeight:900,color:"#2d5a40"}}>{form.jenis==="beras"?`${prevKg} kg`:`Rp ${prevUang.toLocaleString()}`}</span>
                </div>
                <label style={LS}>TAMBAH INFAQ (OPSIONAL)</label>
                <div style={{position:"relative"}}>
                   <span style={{position:"absolute",left:12,top:10,fontSize:13,fontWeight:700,color:"#aaa"}}>Rp</span>
                   <input type="number" placeholder="0" value={form.infaq_uang} onChange={e=>setForm({...form,infaq_uang:Number(e.target.value)})} 
                    style={{...IS, paddingLeft:35, fontSize:15, fontWeight:800, color:"#b8943f", border:"1.5px solid #b8943f40"}}/>
                </div>
              </div>

              <button onClick={simpan} disabled={loading} style={{width:"100%",background:loading?"#ccc":"#2d5a40",color:"white",border:"none",borderRadius:12,padding:"14px",fontSize:14,fontWeight:800,cursor:"pointer",boxShadow:"0 4px 12px rgba(45,90,64,0.2)"}}>
                {loading?"Memproses...":"💾 SIMPAN DATA"}
              </button>
            </div>

            <div style={{background:"white",borderRadius:20,overflow:"hidden"}}>
              <div style={{padding:"16px 20px",background:"#dc3545",color:"white",fontSize:11,fontWeight:900,letterSpacing:".1em"}}>WARGA BELUM SETOR ({belumBayar.length})</div>
              <div style={{maxHeight:500,overflowY:"auto"}}>
                {belumBayar.map(k=>(
                  <div key={k.id} onClick={()=>setForm({...form, kk_id:k.id, jumlah_jiwa: anggotaList.filter(a => a.kk_id === k.id).length || 1})}
                    style={{padding:"12px 20px",borderBottom:"1px solid #f5f5f5",cursor:"pointer",background:form.kk_id===k.id?"#fff9f0":"white",display:"flex",justifyContent:"space-between",alignItems:"center"}}>
                    <div>
                      <div style={{fontWeight:700,fontSize:13}}>{k.kepala_keluarga}</div>
                      <div style={{fontSize:11,color:"#999"}}>RT {k.rt}</div>
                    </div>
                    <span style={{fontSize:10,fontWeight:800,color:"#dc3545"}}>PILIH →</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* ── DISTRIBUSI TAB ── */}
        {tab==="distribusi"&&(
          <div style={{display:"flex",flexDirection:"column",gap:20}}>
            <div style={{background:"white",borderRadius:20,padding:24}}>
              <h3 style={{margin:"0 0 16px",fontSize:16,fontWeight:800}}>⚖️ Rencana Distribusi Zakat (Beras/Uang Zakat)</h3>
              <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fit,minmax(250px,1fr))",gap:16,marginBottom:24}}>
                 <div style={{background:"#f9f9f7",padding:16,borderRadius:12}}>
                    <div style={LS}>Jatah Per Jiwa (Kg)</div>
                    <input type="number" step="0.1" value={jatahKgPerJiwa} onChange={e=>setJatahKgPerJiwa(Number(e.target.value))} style={IS}/>
                 </div>
                 <div style={{background:"#f9f9f7",padding:16,borderRadius:12}}>
                    <div style={LS}>Alokasi Operasional Desa/Masjid (%)</div>
                    <div style={{fontSize:18,fontWeight:900,color:"#2d5a40"}}>12.5% <span style={{fontSize:11,color:"#999",fontWeight:600}}> (Rp {(totalUangZakat * 0.125).toLocaleString()})</span></div>
                 </div>
              </div>
              
              <div style={{background:"#2d5a4008",padding:20,borderRadius:16,border:"1px solid #2d5a4020"}}>
                <h4 style={{margin:"0 0 12px",fontSize:13,fontWeight:800,color:"#2d5a40"}}>Penerima Hak Zakat (Mustahiq)</h4>
                <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fill,minmax(280px,1fr))",gap:12}}>
                  {mustahiqList.map(k=>{
                    const jiwa = anggotaList.filter(a => a.kk_id === k.id).length || 1;
                    return(
                      <div key={k.id} style={{background:"white",padding:14,borderRadius:12,border:"1px solid #eee",display:"flex",justifyContent:"space-between",alignItems:"center"}}>
                        <div>
                          <div style={{fontWeight:700,fontSize:14}}>{k.kepala_keluarga}</div>
                          <div style={{fontSize:11,color:"#999"}}>{jiwa} Jiwa · RT {k.rt}</div>
                        </div>
                        <div style={{textAlign:"right"}}>
                           <div style={{fontSize:14,fontWeight:900,color:"#2d5a40"}}>{(jiwa * jatahKgPerJiwa).toFixed(1)} kg</div>
                           <div style={{fontSize:10,fontWeight:700,color:"#bbb"}}>{k.kategori_mustahiq?.toUpperCase()}</div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ── ALOKASI INFAQ TAB ── */}
        {tab==="infaq_khusus"&&(
          <div style={{display:"flex",flexDirection:"column",gap:20}}>
            <div style={{background:"linear-gradient(135deg,#b8943f,#d4ac5a)",padding:32,borderRadius:24,color:"white"}}>
               <div style={{fontSize:12,fontWeight:800,letterSpacing:".1em",opacity:0.8}}>DANA INFAQ TERKUMPUL</div>
               <div style={{fontSize:42,fontWeight:900,marginTop:8}}>Rp {totalInfaq.toLocaleString("id-ID")}</div>
               <p style={{marginTop:16,fontSize:14,opacity:0.9,lineHeight:1.6,maxWidth:500}}>Dana ini bersifat fleksibel. Prioritas utama Ciburial: Santunan Anak Yatim, Piatu, dan Perbaikan Sarana Fasilitas Desa.</p>
            </div>

            <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:20}}>
               <div style={{background:"white",borderRadius:20,padding:24}}>
                  <h3 style={{margin:"0 0 20px",fontSize:15,fontWeight:800}}>🍊 Daftar Penerima Santunan (Yatim/Piatu)</h3>
                  <div style={{display:"flex",flexDirection:"column",gap:10}}>
                     {yatimList.length === 0 ? (
                       <div style={{textAlign:"center",padding:30,color:"#ccc"}}>Klik ikon 🧡 pada data warga untuk menambah ke daftar ini.</div>
                     ) : yatimList.map(y => (
                       <div key={y.id} style={{padding:14,background:"#fff9f0",borderRadius:12,border:"1px solid #b8943f20",display:"flex",justifyContent:"space-between",alignItems:"center"}}>
                          <div>
                            <div style={{fontWeight:700,fontSize:14}}>{y.kepala_keluarga}</div>
                            <div style={{fontSize:11,color:"#999"}}>RT {y.rt} · {anggotaList.filter(a=>a.kk_id===y.id).length} Jiwa</div>
                          </div>
                          <button onClick={()=>toggleYatim(y.id, true)} style={{background:"none",border:"none",color:"#dc3545",cursor:"pointer",fontSize:18}}>✕</button>
                       </div>
                     ))}
                  </div>
               </div>

               <div style={{background:"white",borderRadius:20,padding:24}}>
                  <h3 style={{margin:"0 0 20px",fontSize:15,fontWeight:800}}>👥 Pilih Warga untuk Santunan</h3>
                  <div style={{maxHeight:400,overflowY:"auto"}}>
                     {kkList.map(k => (
                       <div key={k.id} style={{padding:"10px 0",borderBottom:"1px solid #f5f5f5",display:"flex",justifyContent:"space-between",alignItems:"center"}}>
                          <div style={{fontSize:13,fontWeight:600}}>{k.kepala_keluarga} <span style={{fontSize:10,color:"#999"}}>(RT {k.rt})</span></div>
                          {!k.is_yatim && (
                            <button onClick={()=>toggleYatim(k.id, false)} style={{padding:"5px 10px",borderRadius:8,border:"1px solid #eee",background:"white",fontSize:10,fontWeight:700,cursor:"pointer"}}>+ TAMBAH 🧡</button>
                          )}
                       </div>
                     ))}
                  </div>
               </div>
            </div>
          </div>
        )}

      </div>
    </div>
  );
}