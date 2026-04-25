"use client";
import { useState, useEffect } from "react";
import "../admin-styles-heroic.css";
import { supabase, isSupabaseReady } from "@/lib/supabase";

interface ZakatRow { id:string; kk_id:string; tahun:number; jumlah_jiwa:number; jenis:string; nominal_kg:number; nominal_uang:number; infaq_uang:number; tgl_bayar:string; keluarga:{kepala_keluarga:string;rt:string;golongan_zakat:string}; }
interface KK { id:string; kepala_keluarga:string; rt:string; golongan_zakat:string; kategori_mustahiq:string; no_wa:string; }
interface Anggota { id:string; kk_id:string; nama:string; hubungan:string; is_yatim:boolean; }
interface AmbilZakat { id:string; kk_id:string; tipe:string; jumlah:number; tgl_ambil:string; keluarga:{kepala_keluarga:string}; }

const HARGA_BERAS = 15000;
const TAHUN_INI = new Date().getFullYear();

const emptyForm = { id: "", kk_id:"", tahun:TAHUN_INI, jumlah_jiwa:1, jenis:"beras", nominal_kg:0, nominal_uang:0, infaq_uang:0, tgl_bayar:new Date().toISOString().split("T")[0] };

const LS={fontSize:11,fontWeight:700 as const,color:"#6b7c6d",letterSpacing:"0.06em",textTransform:"uppercase" as const,display:"block",marginBottom:4};
const IS={width:"100%",padding:"9px 12px",borderRadius:10,border:"1.5px solid rgba(45,90,64,0.2)",fontSize:13,background:"#fafaf8",outline:"none",boxSizing:"border-box" as const,fontFamily:"inherit"};

export default function AdminZakatV2Page(){
  const[kkList,setKkList]=useState<KK[]>([]);
  const[zakatList,setZakatList]=useState<ZakatRow[]>([]);
  const[anggotaList,setAnggotaList]=useState<Anggota[]>([]);
  const[ambilList,setAmbilList]=useState<AmbilZakat[]>([]);
  const[tab,setTab]=useState<"rekap"|"input"|"distribusi"|"infaq_khusus"|"pengambilan">("rekap");
  const[loading,setLoading]=useState(false);
  const[toast,setToast]=useState({msg:"",ok:true});
  const[tahunFilter,setTahunFilter]=useState(TAHUN_INI);
  const[jatahKgPerJiwa,setJatahKgPerJiwa]=useState(2.0);
  
  // State form HARUS ada di sini
  const[form,setForm]=useState(emptyForm);

  const[selectedKKForYatim,setSelectedKKForYatim]=useState<string>("");

  function showToast(msg:string,ok=true){setToast({msg,ok});setTimeout(()=>setToast({msg:"",ok:true}),3500);}

  async function fetchAll(){
    if(!isSupabaseReady())return;
    const[kk,z,ang,am]=await Promise.all([
      supabase.from("keluarga").select("id,kepala_keluarga,rt,golongan_zakat,kategori_mustahiq,no_wa").order("rt").order("kepala_keluarga"),
      supabase.from("zakat_fitrah").select("*,keluarga(kepala_keluarga,rt,golongan_zakat)").order("tgl_bayar",{ascending:false}),
      supabase.from("anggota_kk").select("id,kk_id,nama,hubungan,is_yatim"),
      supabase.from("pengambilan_zakat").select("*,keluarga(kepala_keluarga)").order("tgl_ambil",{ascending:false})
    ]);
    if(kk.data)setKkList(kk.data as KK[]);
    if(z.data)setZakatList(z.data as any);
    if(ang.data)setAnggotaList(ang.data as Anggota[]);
    if(am.data)setAmbilList(am.data as any);
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
    const payload:any = {
       kk_id: form.kk_id,
       tahun: form.tahun,
       jumlah_jiwa: form.jumlah_jiwa,
       jenis: form.jenis,
       nominal_kg: kg,
       nominal_uang: uang,
       infaq_uang: form.infaq_uang,
       tgl_bayar: form.tgl_bayar
    };
    
    let res;
    if(form.id) res = await supabase.from("zakat_fitrah").update(payload).eq("id", form.id);
    else res = await supabase.from("zakat_fitrah").insert(payload);

    if(res.error) showToast(`❌ ${res.error.message}`,false);
    else { showToast("✅ Data Berhasil Disimpan!"); setForm(emptyForm); fetchAll(); }
    setLoading(false);
  }

  async function hapusZakat(id:string){
    if(!confirm("Hapus data setoran ini?")) return;
    const {error} = await supabase.from("zakat_fitrah").delete().eq("id", id);
    if(!error) { showToast("🗑️ Data dihapus"); fetchAll(); }
  }

  async function toggleMustahiq(kkId: string, currentStatus: string) {
    const nextStatus = currentStatus === "mustahiq" ? "muzakki" : "mustahiq";
    const { error } = await supabase.from("keluarga").update({ golongan_zakat: nextStatus }).eq("id", kkId);
    if (error) showToast("❌ Gagal update status", false);
    else { showToast(`✅ Status KK diperbarui ke ${nextStatus}`); fetchAll(); }
  }

  async function toggleYatimIndividu(id:string, val:boolean){
    const {error} = await supabase.from("anggota_kk").update({is_yatim: !val}).eq("id", id);
    if(!error) fetchAll();
  }

  // --- DATA KALKULASI ---
  const zakatTahunIni = zakatList.filter(z=>z.tahun===tahunFilter);
  const totalKgMasuk = zakatTahunIni.filter(z=>z.jenis==="beras").reduce((s,z)=>s+Number(z.nominal_kg),0);
  const totalUangZakat = zakatTahunIni.reduce((s,z)=>s+Number(z.nominal_uang),0);
  const totalInfaq = zakatTahunIni.reduce((s,z)=>s+Number(z.infaq_uang||0),0);
  
  const mustahiqList = kkList.filter(k=> k.golongan_zakat==="mustahiq");
  const totalJiwaMustahiq = mustahiqList.reduce((acc, kk) => acc + (anggotaList.filter(a => a.kk_id === kk.id).length || 1), 0);
  const totalKgTargetDistribusi = totalJiwaMustahiq * jatahKgPerJiwa;
  const totalKgKeluar = ambilList.filter(a=>a.tipe==='zakat_beras').reduce((s,a)=>s+Number(a.jumlah),0);
  const totalUangKeluar = ambilList.filter(a=>a.tipe==='santunan_uang').reduce((s,a)=>s+Number(a.jumlah),0);
  
  const progressAmbil = totalKgTargetDistribusi > 0 ? (totalKgKeluar / totalKgTargetDistribusi) * 100 : 0;
  const sudahBayar = new Set(zakatTahunIni.map(z=>z.kk_id));
  const belumBayar = kkList.filter(k=>!sudahBayar.has(k.id));
  const yatimList = anggotaList.filter(a => a.is_yatim);

  const {kg:prevKg,uang:prevUang}=hitungZakat();

  // --- CHART COMPONENT ---
  function MiniBarChart({label, masuk, keluar, unit}: {label:string, masuk:number, keluar:number, unit:string}) {
     const max = Math.max(masuk, keluar, 1);
     return (
        <div className="card-heroic">
           <div style={{fontSize:11, fontWeight:800, color:"#999", marginBottom:16}}>{label.toUpperCase()}</div>
           <div style={{display:"flex", alignItems:"flex-end", gap:20, height:100, marginBottom:12}}>
              <div style={{flex:1, display:"flex", flexDirection:"column", alignItems:"center", gap:8}}>
                 <div style={{width:"100%", background:"#2d5a40", borderRadius:"4px 4px 0 0", height:`${(masuk/max)*100}%`, minHeight:4}}/>
                 <span style={{fontSize:10, fontWeight:700, color:"#2d5a40"}}>{masuk.toFixed(0)}{unit}</span>
                 <span style={{fontSize:9, color:"#999"}}>MASUK</span>
              </div>
              <div style={{flex:1, display:"flex", flexDirection:"column", alignItems:"center", gap:8}}>
                 <div style={{width:"100%", background:"#b8943f", borderRadius:"4px 4px 0 0", height:`${(keluar/max)*100}%`, minHeight:4}}/>
                 <span style={{fontSize:10, fontWeight:700, color:"#b8943f"}}>{keluar.toFixed(0)}{unit}</span>
                 <span style={{fontSize:9, color:"#999"}}>KELUAR</span>
              </div>
           </div>
        </div>
     )
  }

  return(
    <div className="admin-page heroic-bg" style={{ minHeight: "100vh", fontFamily: "'Segoe UI', system-ui, sans-serif" }}>
      {toast.msg&&<div style={{position:"fixed",top:20,left:"50%",transform:"translateX(-50%)",background:toast.ok?"#2d5a40":"#dc3545",color:"white",padding:"10px 20px",borderRadius:12,zIndex:999,fontSize:14,boxShadow:"0 4px 20px rgba(0,0,0,0.15)"}}>{toast.msg}</div>}

      <header style={{background:"#f5f0e8",borderBottom:"1px solid rgba(45,90,64,0.12)",padding:"14px 20px",position:"sticky",top:0,zIndex:10,display:"flex",alignItems:"center",justifyContent:"space-between"}}>
        <div style={{display:"flex",alignItems:"center",gap:12}}>
          <a href="/admin" style={{color:"#6b7c6d",textDecoration:"none",fontSize:13}}>← Admin</a>
          <div>
            <div style={{fontWeight:800,fontSize:15,color:"#1a2e1f"}}>🕌 Zakat & Infaq Ciburial</div>
            <div style={{fontSize:10,color:"#7a9a7e",textTransform:"uppercase"}}>Admin Control Panel</div>
          </div>
        </div>
        <div style={{display:"flex",gap:6, flexWrap:"wrap"}}>
          {(["rekap","input","distribusi","infaq_khusus","pengambilan"] as const).map(t=>(
            <button key={t} onClick={()=>setTab(t)} style={{padding:"6px 12px",borderRadius:20,fontSize:11,fontWeight:700,border:"1.5px solid rgba(45,90,64,0.2)",cursor:"pointer",background:tab===t?"#2d5a40":"transparent",color:tab===t?"white":"#6b7c6d"}}>
              {{rekap:"📊 Dash",input:"📥 Input",distribusi:"⚖️ Zakat",infaq_khusus:"🧡 Infaq",pengambilan:"✅ Ambil"}[t]}
            </button>
          ))}
        </div>
      </header>

      <div style={{maxWidth:1000,margin:"0 auto",padding:"24px 16px"}}>

        {/* ── DASHBOARD TAB ── */}
        {tab==="rekap"&&(
          <div style={{display:"flex", flexDirection:"column", gap:24}}>
             <div style={{display:"grid", gridTemplateColumns:"repeat(auto-fit, minmax(280px, 1fr))", gap:16}}>
                <div style={{background:"white", padding:24, borderRadius:20, border:"1px solid #eee"}}>
                   <div style={{fontSize:12, fontWeight:800, color:"#999", marginBottom:8}}>PROGRESS PENYALURAN BERAS</div>
                   <div style={{fontSize:32, fontWeight:900, color:"#2d5a40", marginBottom:12}}>{progressAmbil.toFixed(1)}%</div>
                   <div style={{height:12, background:"#f0f0f0", borderRadius:99, overflow:"hidden"}}>
                      <div style={{height:"100%", width:`${progressAmbil}%`, background:"linear-gradient(90deg, #2d5a40, #4fbf7e)", borderRadius:99}}/>
                   </div>
                   <div style={{marginTop:12, fontSize:11, color:"#777"}}>{totalKgKeluar.toFixed(1)}kg disalurkan dari {totalKgTargetDistribusi.toFixed(1)}kg target.</div>
                </div>
                <MiniBarChart label="Beras (kg)" masuk={totalKgMasuk} keluar={totalKgKeluar} unit="kg" />
                <MiniBarChart label="Uang Infaq (rp)" masuk={totalInfaq} keluar={totalUangKeluar} unit="" />
             </div>

             <div style={{background:"white",borderRadius:20,border:"1px solid rgba(0,0,0,0.05)",overflow:"hidden"}}>
                <div style={{padding:"18px 24px",borderBottom:"1px solid #eee",display:"flex",justifyContent:"space-between"}}>
                   <h3 style={{fontSize:14,fontWeight:800}}>RIWAYAT SETORAN TERBARU</h3>
                </div>
                {zakatTahunIni.map((z,i)=>(
                    <div key={z.id} style={{padding:"14px 24px",borderBottom:"1px solid #f5f5f5",display:"flex",alignItems:"center",gap:16}}>
                        <div style={{width:36,height:36,borderRadius:10,background:"#f9f9f7",display:"flex",alignItems:"center",justifyContent:"center",fontSize:16}}>{z.jenis==="beras"?"🌾":"💰"}</div>
                        <div style={{flex:1}}>
                            <div style={{fontWeight:700,fontSize:14}}>{z.keluarga?.kepala_keluarga}</div>
                            <div style={{fontSize:11,color:"#999"}}>RT {z.keluarga?.rt} · {new Date(z.tgl_bayar).toLocaleDateString("id-ID")}</div>
                        </div>
                        <div style={{textAlign:"right", marginRight:12}}>
                            <div style={{fontWeight:800,fontSize:14,color:"#2d5a40"}}>{z.jenis==="beras"?`${z.nominal_kg}kg`:`Rp${z.nominal_uang.toLocaleString()}`}</div>
                            {z.infaq_uang > 0 && <div style={{fontSize:10,fontWeight:700,color:"#b8943f"}}>+ Infaq Rp{z.infaq_uang.toLocaleString()}</div>}
                        </div>
                        <div style={{display:"flex", gap:4}}>
                            <button onClick={()=>{setForm({...z as any, id:z.id}); setTab("input");}} style={{padding:6, border:"none", background:"#f0f0f0", borderRadius:6, cursor:"pointer"}}>✏️</button>
                            <button onClick={()=>hapusZakat(z.id)} style={{padding:6, border:"none", background:"#fff0f0", color:"#dc3545", borderRadius:6, cursor:"pointer"}}>🗑️</button>
                        </div>
                    </div>
                ))}
             </div>
          </div>
        )}

        {/* ── INPUT TAB ── */}
        {tab==="input"&&(
          <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fit, minmax(320px, 1fr))",gap:20}}>
            <div style={{background:"white",borderRadius:20,padding:28,boxShadow:"0 4px 12px rgba(0,0,0,0.03)"}}>
              <h3 style={{margin:"0 0 24px",color:"#1a2e1f",fontSize:17,fontWeight:800}}>{form.id ? "✏️ Edit Setoran" : "📥 Input Setoran"}</h3>
              <div style={{marginBottom:16}}>
                <label style={LS}>Kepala Keluarga *</label>
                <select value={form.kk_id} onChange={e=>{
                  const jml = anggotaList.filter(a => a.kk_id === e.target.value).length || 1;
                  setForm({...form, kk_id:e.target.value, jumlah_jiwa: jml});
                }} style={IS}>
                  <option value="">-- Pilih KK --</option>
                  {kkList.map(k=>(<option key={k.id} value={k.id}>{k.kepala_keluarga} (RT {k.rt}){sudahBayar.has(k.id)?" ✅":""}</option>))}
                </select>
              </div>
              <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:16,marginBottom:16}}>
                <div><label style={LS}>Jiwa</label><input type="number" value={form.jumlah_jiwa} onChange={e=>setForm({...form,jumlah_jiwa:Number(e.target.value)})} style={IS}/></div>
                <div><label style={LS}>Media</label><select value={form.jenis} onChange={e=>setForm({...form,jenis:e.target.value})} style={IS}><option value="beras">🌾 Beras</option><option value="uang">💰 Uang</option></select></div>
              </div>
              <div style={{background:"#f9f9f7",padding:20,borderRadius:14,marginBottom:20,border:"1px solid #eee"}}>
                <div style={{display:"flex",justifyContent:"space-between",marginBottom:10}}><span style={{fontSize:12,fontWeight:700,color:"#777"}}>WAJIB ZAKAT</span><span style={{fontSize:14,fontWeight:900,color:"#2d5a40"}}>{form.jenis==="beras"?`${prevKg} kg`:`Rp ${prevUang.toLocaleString()}`}</span></div>
                <label style={LS}>INFAQ TAMBAHAN</label><input type="number" value={form.infaq_uang} onChange={e=>setForm({...form,infaq_uang:Number(e.target.value)})} style={{...IS, border:"1.5px solid #b8943f40", fontWeight:800}}/>
              </div>
              <div style={{display:"flex", gap:10}}>
                 <button onClick={simpan} disabled={loading} className="btn-heroic">💾 SIMPAN</button>
                 {form.id && <button onClick={()=>setForm(emptyForm)} style={{flex:1, background:"#eee", border:"none", borderRadius:12, fontWeight:700, cursor:"pointer"}}>BATAL</button>}
              </div>
            </div>
            <div style={{background:"white",borderRadius:20,overflow:"hidden"}}>
              <div style={{padding:"16px 20px",background:"#dc3545",color:"white",fontSize:11,fontWeight:900}}>BELUM SETOR ({belumBayar.length})</div>
              <div style={{maxHeight:500, overflowY:"auto"}}>
                {belumBayar.map(k=>(
                    <div key={k.id} onClick={()=>setForm({...form, kk_id:k.id, jumlah_jiwa: anggotaList.filter(a => a.kk_id === k.id).length || 1})} style={{padding:"12px 20px",borderBottom:"1px solid #f5f5f5",cursor:"pointer",display:"flex",justifyContent:"space-between"}}>
                    <div><div style={{fontWeight:700,fontSize:13}}>{k.kepala_keluarga}</div><div style={{fontSize:11,color:"#999"}}>RT {k.rt}</div></div>
                    <span style={{fontSize:10,fontWeight:800,color:"#dc3545"}}>PILIH →</span>
                    </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* ── DISTRIBUSI TAB ── */}
        {tab==="distribusi"&&(
          <div style={{background:"white",borderRadius:20,padding:24}}>
             <h3 style={{fontSize:16, fontWeight:800, marginBottom:16}}>⚖️ Manajemen Pembagian Beras</h3>
             <div style={{background:"#f9f9f7", padding:16, borderRadius:12, marginBottom:24, display:"flex", alignItems:"center", gap:20}}>
                <div style={{flex:1}}><label style={LS}>Jatah Per Jiwa (Kg)</label><input type="number" step="0.1" value={jatahKgPerJiwa} onChange={e=>setJatahKgPerJiwa(Number(e.target.value))} style={IS}/></div>
                <div style={{flex:2, fontSize:12, color:"#666"}}>Ubah angka ini untuk menyesuaikan estimasi pembagian di Kiosk Zakat warga.</div>
             </div>
             <div style={{display:"grid", gridTemplateColumns:"repeat(auto-fill, minmax(300px, 1fr))", gap:12}}>
                {kkList.map(k => {
                   const isMustahiq = k.golongan_zakat === "mustahiq";
                   const jiwa = anggotaList.filter(a => a.kk_id === k.id).length || 1;
                   return (
                      <div key={k.id} style={{padding:16, background: isMustahiq ? "white" : "#f9f9f9", border: isMustahiq ? "1.5px solid #2d5a40" : "1px solid #eee", borderRadius:12, display:"flex", justifyContent:"space-between", opacity: isMustahiq ? 1 : 0.6}}>
                         <div>
                            <div style={{fontWeight:700}}>{k.kepala_keluarga} {isMustahiq && "🤲"}</div>
                            <div style={{fontSize:11,color:"#999"}}>RT {k.rt} · {jiwa} Jiwa</div>
                            {isMustahiq && <div style={{fontSize:14, fontWeight:900, color:"#2d5a40", marginTop:4}}>{(jiwa * jatahKgPerJiwa).toFixed(1)} kg</div>}
                         </div>
                         <button onClick={()=>toggleMustahiq(k.id, k.golongan_zakat)} style={{padding:"6px 10px", borderRadius:8, border:"none", background: isMustahiq ? "#fff0f0" : "#2d5a40", color: isMustahiq ? "#dc3545" : "white", fontSize:10, fontWeight:800, cursor:"pointer"}}>
                            {isMustahiq ? "✕ HAPUS" : "+ MASUK"}
                         </button>
                      </div>
                   )
                })}
             </div>
          </div>
        )}

        {/* ── INFAQ KHUSUS TAB ── */}
        {tab==="infaq_khusus"&&(
          <div style={{display:"grid", gridTemplateColumns:"1fr 1fr", gap:20}}>
             <div style={{background:"white", padding:24, borderRadius:20}}>
                <h3 style={{fontSize:15, fontWeight:800, marginBottom:16}}>🧡 Kelola Penerima Santunan (Anak)</h3>
                <label style={LS}>Pilih KK</label>
                <select value={selectedKKForYatim} onChange={e=>setSelectedKKForYatim(e.target.value)} style={IS}>
                   <option value="">-- Pilih KK --</option>
                   {kkList.map(k=>(<option key={k.id} value={k.id}>{k.kepala_keluarga} (RT {k.rt})</option>))}
                </select>
                {selectedKKForYatim && (
                   <div style={{marginTop:20, background:"#f9f9f7", padding:16, borderRadius:12}}>
                      {anggotaList.filter(a=>a.kk_id===selectedKKForYatim).map(a=>(
                         <div key={a.id} style={{display:"flex", justifyContent:"space-between", padding:"10px 0", borderBottom:"1px solid #eee"}}>
                            <div style={{fontSize:14, fontWeight:700}}>{a.nama}</div>
                            <button onClick={()=>toggleYatimIndividu(a.id, a.is_yatim)} style={{padding:"5px 12px", borderRadius:20, border:"none", background:a.is_yatim?"#b8943f":"#eee", color:a.is_yatim?"white":"#777", fontSize:10, fontWeight:800, cursor:"pointer"}}>{a.is_yatim ? "🧡 TERDATA" : "+ TAMBAH"}</button>
                         </div>
                      ))}
                   </div>
                )}
             </div>
             <div style={{background:"white", padding:24, borderRadius:20}}>
                <h3 style={{fontSize:15, fontWeight:800, marginBottom:16}}>📋 Daftar Santunan ({yatimList.length} Jiwa)</h3>
                {yatimList.map(y=>(
                   <div key={y.id} style={{padding:12, background:"#fff9f0", borderRadius:12, border:"1px solid #b8943f20", display:"flex", justifyContent:"space-between", marginBottom:8}}>
                      <div><div style={{fontWeight:700,fontSize:14}}>{y.nama}</div><div style={{fontSize:10,color:"#999"}}>Keluarga: {kkList.find(k=>k.id===y.kk_id)?.kepala_keluarga}</div></div>
                      <button onClick={()=>toggleYatimIndividu(y.id, true)} style={{color:"#dc3545", background:"none", border:"none", cursor:"pointer"}}>✕</button>
                   </div>
                ))}
             </div>
          </div>
        )}

        {/* ── PENGAMBILAN LOG ── */}
        {tab==="pengambilan"&&(
          <div style={{background:"white",borderRadius:20,overflow:"hidden"}}>
            <div style={{padding:"18px 24px",background:"#2d5a40", color:"white"}}><h3 style={{fontSize:14,fontWeight:800}}>LOG PENYALURAN REAL-TIME</h3></div>
            <div style={{maxHeight:600, overflowY:"auto"}}>
                {ambilList.map(a=>(
                <div key={a.id} style={{padding:"14px 24px",borderBottom:"1px solid #f5f5f5",display:"flex",justifyContent:"space-between",alignItems:"center"}}>
                    <div><div style={{fontWeight:700}}>{a.keluarga?.kepala_keluarga}</div><div style={{fontSize:11,color:"#999"}}>{a.tipe==='zakat_beras'?'Beras Zakat':'Santunan Uang'} · {new Date(a.tgl_ambil).toLocaleString()}</div></div>
                    <div style={{fontWeight:900,color:"#2d5a40"}}>{a.jumlah} {a.tipe==='zakat_beras'?'kg':'Rp'}</div>
                </div>
                ))}
            </div>
          </div>
        )}

      </div>
    </div>
  );
}