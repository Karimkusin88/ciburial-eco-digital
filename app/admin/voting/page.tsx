"use client";
import { useState, useEffect } from "react";
import "../admin-styles-heroic.css";
import { supabase, isSupabaseReady } from "@/lib/supabase";

interface VotingItem {
  id: string; judul: string; deskripsi: string;
  status: "aktif"|"tutup"|"draft"; tgl_mulai: string; tgl_selesai: string; created_at: string;
}
interface Pilihan { id: string; voting_id: string; teks: string; jumlah_vote: number; }
interface HasilVoting extends VotingItem { pilihan: Pilihan[]; total_vote: number; }

const emptyForm = { judul:"", deskripsi:"", status:"draft" as const, tgl_mulai: new Date().toISOString().split("T")[0], tgl_selesai:"" };
const STS = { aktif:{label:"Sedang Berjalan",bg:"#ECFDF5",color:"#059669"}, tutup:{label:"Ditutup",bg:"#FEF2F2",color:"#DC2626"}, draft:{label:"Draft",bg:"#F3F4F6",color:"#4B5563"} };

const fRp = (n:number) => n.toLocaleString("id-ID");
const fTgl = (s:string) => new Date(s).toLocaleDateString("id-ID",{day:"numeric",month:"short",year:"numeric"});

interface OpsiInput { id:number; teks:string; foto:string; }

export default function AdminVotingPage() {
  const [list,       setList]       = useState<HasilVoting[]>([]);
  const [form,       setForm]       = useState(emptyForm);
  const [tipe,       setTipe]       = useState<"PEMILU"|"MUSYAWARAH">("PEMILU");
  const [opsi,       setOpsi]       = useState<OpsiInput[]>([{id:1,teks:"",foto:""},{id:2,teks:"",foto:""}]);
  const [inklusiGolput, setInklusiGolput] = useState(false);
  const [inklusiNetral, setInklusiNetral] = useState(false);
  const [loading,    setLoading]    = useState(false);
  const [toast,      setToast]      = useState({msg:"", type:"info"});
  const [tab,        setTab]        = useState<"daftar"|"buat">("daftar");
  const [expandId,   setExpandId]   = useState<string|null>(null);
  const [uploadingId, setUploadingId] = useState<number|null>(null);

  async function uploadFoto(opsiId: number, file: File) {
    setUploadingId(opsiId);
    try {
      const ext = file.name.split(".").pop()?.toLowerCase() || "jpg";
      const path = `kandidat/${Date.now()}_${opsiId}.${ext}`;
      const { error } = await supabase.storage
        .from("foto-kandidat")
        .upload(path, file, { upsert: true, contentType: file.type });
      if (error) throw error;
      const { data: urlData } = supabase.storage.from("foto-kandidat").getPublicUrl(path);
      ubahOpsi(opsiId, "foto", urlData.publicUrl);
    } catch (e: any) {
      showToast("Upload gagal: " + (e?.message || "Coba lagi"), "error");
    }
    setUploadingId(null);
  }

  const showToast = (msg:string, type:"success"|"error"|"info"="info") => { setToast({msg,type}); setTimeout(()=>setToast({msg:"",type:"info"}),4000); };

  async function fetchAll() {
    if(!isSupabaseReady()) return;
    const { data:votings } = await supabase.from("voting").select("*").order("created_at",{ascending:false});
    if(!votings) return;
    const hasil:HasilVoting[] = await Promise.all(votings.map(async v => {
      const { data:pilihan } = await supabase.from("pilihan_voting").select("*").eq("voting_id",v.id).order("jumlah_vote",{ascending:false});
      const total = (pilihan||[]).reduce((s,p)=>s+Number(p.jumlah_vote),0);
      return {...v, pilihan:pilihan||[], total_vote:total};
    }));
    setList(hasil);
  }
  useEffect(()=>{ fetchAll(); },[]);

  function ubahOpsi(id:number, field:"teks"|"foto", val:string) {
    setOpsi(opsi.map(o => o.id === id ? {...o, [field]:val} : o));
  }
  function tambahOpsi() { setOpsi([...opsi, {id: Date.now(), teks:"", foto:""}]); }
  function hapusOpsi(id:number) { if(opsi.length>2) setOpsi(opsi.filter(o=>o.id!==id)); }

  async function buatVoting() {
    if(!form.judul) return showToast("Judul wajib diisi!", "error");
    
    // Menyiapkan string opsi
    let kandidatTeks: string[] = [];
    if(tipe === "PEMILU") {
      const validOpsi = opsi.filter(o => o.teks.trim());
      if(validOpsi.length < 2) return showToast("Minimal 2 kandidat untuk pemilu!", "error");
      kandidatTeks = validOpsi.map(o => o.foto.trim() ? `${o.teks.trim()}|||${o.foto.trim()}` : o.teks.trim());
    } else {
      const validOpsi = opsi.filter(o => o.teks.trim());
      if(validOpsi.length < 2) return showToast("Minimal 2 opsi untuk musyawarah!", "error");
      kandidatTeks = validOpsi.map(o => o.teks.trim());
    }

    if(inklusiGolput) kandidatTeks.push("Kotak Kosong / Golput");
    if(inklusiNetral) kandidatTeks.push("Netral / Abstain");

    setLoading(true);
    
    // Modifikasi judul dengan prefix
    const payloadForm = {
      ...form, 
      judul: `[${tipe}] ${form.judul.trim()}`
    };

    const { data:v, error } = await supabase.from("voting").insert(payloadForm).select().single();
    if(error||!v){ showToast("Gagal Dibuat: "+error?.message, "error"); setLoading(false); return; }
    
    // Insert array of opsi — CEK ERROR dengan benar
    const { error: errPilihan } = await supabase.from("pilihan_voting").insert(
      kandidatTeks.map(teks=>({voting_id:v.id, teks, jumlah_vote:0}))
    );
    
    if(errPilihan) {
      // Rollback: hapus voting yang sudah dibuat karena pilihan gagal
      await supabase.from("voting").delete().eq("id", v.id);
      showToast(`❌ GAGAL SIMPAN KANDIDAT: ${errPilihan.message} | Code: ${errPilihan.code}`, "error");
      setLoading(false);
      return;
    }
    
    showToast("✅ Agenda E-Voting berhasil dideploy!");
    setForm(emptyForm); 
    setOpsi([{id:1,teks:"",foto:""},{id:2,teks:"",foto:""}]); 
    setInklusiGolput(false); setInklusiNetral(false);
    setTab("daftar"); setLoading(false); fetchAll();
  }

  async function ubahStatus(id:string, status:"aktif"|"tutup"|"draft") {
    await supabase.from("voting").update({status}).eq("id",id);
    showToast(`Status Voting diubah menjadi ${STS[status].label}`, "success"); fetchAll();
  }

  async function hapus(id:string) {
    if(!confirm("Anda yakin ingin menghapus agenda ini beserta seluruh riwayat suaranya secara permanen?")) return;
    await supabase.from("pilihan_voting").delete().eq("voting_id",id);
    await supabase.from("voting").delete().eq("id",id);
    showToast("Agenda dihapus dari database.", "success"); fetchAll();
  }

  async function resetVote(id:string) {
    if(!confirm("WARNING PENTING: Aksi ini akan mereset KOTAK SUARA (semua vote kandidat menjadi 0 dan riwayat pemilih dihapus). Lanjut?")) return;
    const ids = list.find(v=>v.id===id)?.pilihan.map(p=>p.id)||[];
    await Promise.all(ids.map(pid=>supabase.from("pilihan_voting").update({jumlah_vote:0}).eq("id",pid)));
    await supabase.from("vote_record").delete().eq("voting_id",id);
    showToast("Kotak Suara berhasil dikosongkan.", "success"); fetchAll();
  }

  const totalAktif = list.filter(v=>v.status==="aktif").length;
  const totalVote  = list.reduce((s,v)=>s+v.total_vote,0);

  // Parsing helper for display in admin
  function parseKandidat(str:string) {
    const parts = str.split("|||");
    return { nama: parts[0], foto: parts[1]||null };
  }
  function parseJudul(str:string) {
    if(str.startsWith("[PEMILU] ")) return { tipe:"PEMILU", text:str.replace("[PEMILU] ","") };
    if(str.startsWith("[MUSYAWARAH] ")) return { tipe:"MUSYAWARAH", text:str.replace("[MUSYAWARAH] ","") };
    return { tipe:"STANDAR", text:str };
  }

  return (
    <div className="admin-page heroic-bg" style={{ minHeight: "100vh", fontFamily: "'Segoe UI', system-ui, sans-serif" }}>
      {/* Toast Notification */}
      {toast.msg&&<div style={{position:"fixed",top:20,left:"50%",transform:"translateX(-50%)",background:toast.type==="success"?"#059669":toast.type==="error"?"#DC2626":"#1E293B",color:"white",padding:"12px 24px",borderRadius:99,zIndex:999,fontSize:14,fontWeight:700,boxShadow:"0 10px 25px rgba(0,0,0,0.2)",display:"flex",alignItems:"center",gap:8}}>
        {toast.type==="success"?"🎉":toast.type==="error"?"🚨":"ℹ️"} {toast.msg}
      </div>}

      {/* Header */}
      <header style={{background:"white",borderBottom:"1px solid #E2E8F0",padding:"20px 24px",position:"sticky",top:0,zIndex:10,display:"flex",alignItems:"center",justifyContent:"space-between",flexWrap:"wrap",gap:16}}>
        <div style={{display:"flex",alignItems:"center",gap:16}}>
          <a href="/admin" style={{color:"#64748B",textDecoration:"none",fontSize:13,fontWeight:700,background:"#F1F5F9",padding:"8px 16px",borderRadius:99}}>← Dashboard Admin</a>
          <div>
            <div style={{fontWeight:900,fontSize:18,color:"#0F172A",letterSpacing:"-0.02em"}}>E-Voting Komite 🗳️</div>
            <div style={{fontSize:11,color:"#64748B",textTransform:"uppercase",letterSpacing:"0.1em",fontWeight:800,marginTop:2}}>{totalAktif} Agenda Aktif • {fRp(totalVote)} Total Partisipan</div>
          </div>
        </div>
        <div style={{display:"flex",gap:8,flexWrap:"wrap"}}>
          <a href="/voting" target="_blank" style={{padding:"10px 20px",borderRadius:12,fontSize:13,fontWeight:800,border:"2px solid #E2E8F0",color:"#475569",textDecoration:"none",display:"flex",alignItems:"center",gap:8}}>Buka Bilik Suara ↗</a>
          {(["daftar","buat"] as const).map(t=>(
            <button key={t} onClick={()=>setTab(t)} style={{padding:"10px 20px",borderRadius:12,fontSize:13,fontWeight:800,border:"none",cursor:"pointer",background:tab===t?"#0F172A":"transparent",color:tab===t?"white":"#475569",transition:"all 0.2s"}}>
              {t==="daftar"?"📋 Daftar Agenda":"➕ Rancang Agenda"}
            </button>
          ))}
        </div>
      </header>

      <div style={{maxWidth:1000,margin:"0 auto",padding:"32px 20px"}}>
        
        {/* ===================== TAB BUAT AGENDA ===================== */}
        {tab==="buat"&&(
          <div style={{animation:"fadeIn 0.3s ease-out"}}>
            
            {/* Tipe Selector */}
            <div style={{display:"flex",gap:16,marginBottom:32}}>
              <div onClick={()=>{setTipe("PEMILU");if(opsi.length===2&&opsi[0].teks==="") setOpsi([{id:1,teks:"Kandidat 1",foto:""},{id:2,teks:"Kandidat 2",foto:""}]);}} 
                   style={{flex:1,padding:"24px",borderRadius:24,border:`2px solid ${tipe==="PEMILU"?"#3B82F6":"#E2E8F0"}`,background:tipe==="PEMILU"?"#EFF6FF":"white",cursor:"pointer",transition:"all 0.2s",boxShadow:tipe==="PEMILU"?"0 10px 25px rgba(59,130,246,0.1)":"none"}}>
                <div style={{fontSize:32,marginBottom:12}}>🧑‍💼</div>
                <div style={{fontWeight:900,fontSize:16,color:tipe==="PEMILU"?"#1E3A8A":"#334155",marginBottom:4}}>Pemilihan (RT/RW/Pemuda)</div>
                <div style={{fontSize:13,color:tipe==="PEMILU"?"#3B82F6":"#64748B",fontWeight:600}}>Kandidat dengan opsi tautan foto wajah.</div>
              </div>
              <div onClick={()=>{setTipe("MUSYAWARAH");if(opsi.length===2&&opsi[0].teks.includes("Kandidat")) setOpsi([{id:1,teks:"Setuju",foto:""},{id:2,teks:"Tidak Setuju",foto:""}]);}} 
                   style={{flex:1,padding:"24px",borderRadius:24,border:`2px solid ${tipe==="MUSYAWARAH"?"#10B981":"#E2E8F0"}`,background:tipe==="MUSYAWARAH"?"#ECFDF5":"white",cursor:"pointer",transition:"all 0.2s",boxShadow:tipe==="MUSYAWARAH"?"0 10px 25px rgba(16,185,129,0.1)":"none"}}>
                <div style={{fontSize:32,marginBottom:12}}>⚖️</div>
                <div style={{fontWeight:900,fontSize:16,color:tipe==="MUSYAWARAH"?"#064E3B":"#334155",marginBottom:4}}>Musyawarah / Keputusan</div>
                <div style={{fontSize:13,color:tipe==="MUSYAWARAH"?"#10B981":"#64748B",fontWeight:600}}>Pemungutan suara Setuju/Tidak Setuju.</div>
              </div>
            </div>

            <div style={{background:"white",borderRadius:24,padding:"32px",border:"1px solid #E2E8F0",boxShadow:"0 10px 30px rgba(0,0,0,0.02)"}}>
              <h3 style={{margin:"0 0 24px",color:"#0F172A",fontSize:18,fontWeight:900}}>Rincian Agenda Voting</h3>
              
              <div style={{display:"flex",flexDirection:"column",gap:20,marginBottom:32}}>
                <div>
                  <label style={{display:"block",fontSize:12,fontWeight:800,color:"#64748B",marginBottom:8,textTransform:"uppercase",letterSpacing:"0.05em"}}>Judul Agenda *</label>
                  <input value={form.judul} onChange={e=>setForm({...form,judul:e.target.value})} placeholder={tipe==="PEMILU"?"Cth: Pemilihan Ketua Pemuda 2026":"Cth: Pembuatan Portal Jaga"} 
                    style={{width:"100%",padding:"14px 16px",borderRadius:12,border:"2px solid #E2E8F0",fontSize:15,fontWeight:600,outline:"none",background:"#F8FAFC"}}/>
                </div>
                <div>
                  <label style={{display:"block",fontSize:12,fontWeight:800,color:"#64748B",marginBottom:8,textTransform:"uppercase",letterSpacing:"0.05em"}}>Deskripsi & Latar Belakang</label>
                  <textarea value={form.deskripsi} onChange={e=>setForm({...form,deskripsi:e.target.value})} placeholder="Penjelasan singkat tujuan agenda..." rows={3}
                    style={{width:"100%",padding:"14px 16px",borderRadius:12,border:"2px solid #E2E8F0",fontSize:14,outline:"none",background:"#F8FAFC",resize:"none"}}/>
                </div>
                <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:16}}>
                  <div>
                    <label style={{display:"block",fontSize:12,fontWeight:800,color:"#64748B",marginBottom:8,textTransform:"uppercase",letterSpacing:"0.05em"}}>Tanggal Mulai</label>
                    <input type="date" value={form.tgl_mulai} onChange={e=>setForm({...form,tgl_mulai:e.target.value})} style={{width:"100%",padding:"14px 16px",borderRadius:12,border:"2px solid #E2E8F0",fontSize:14,outline:"none",background:"#F8FAFC",fontWeight:600}}/>
                  </div>
                  <div>
                    <label style={{display:"block",fontSize:12,fontWeight:800,color:"#64748B",marginBottom:8,textTransform:"uppercase",letterSpacing:"0.05em"}}>Batas Waktu Tutup</label>
                    <input type="date" value={form.tgl_selesai} onChange={e=>setForm({...form,tgl_selesai:e.target.value})} style={{width:"100%",padding:"14px 16px",borderRadius:12,border:"2px solid #E2E8F0",fontSize:14,outline:"none",background:"#F8FAFC",fontWeight:600}}/>
                  </div>
                </div>
              </div>

              <h3 style={{margin:"0 0 16px",color:"#0F172A",fontSize:16,fontWeight:900,display:"flex",alignItems:"center",justifyContent:"space-between"}}>
                Tentukan Pilihan / Kandidat
                <button onClick={tambahOpsi} style={{background:"#F1F5F9",color:"#0F172A",border:"none",borderRadius:8,padding:"8px 12px",fontSize:12,fontWeight:800,cursor:"pointer"}}>+ Opsi Baru</button>
              </h3>
              
              <div style={{display:"flex",flexDirection:"column",gap:12,marginBottom:24}}>
                {opsi.map((o,i)=>(
                  <div key={o.id} style={{display:"flex",gap:12,alignItems:"flex-start",background:"#F8FAFC",padding:"16px",borderRadius:16,border:"1px solid #E2E8F0"}}>
                    <div style={{background:"#E2E8F0",color:"#64748B",width:28,height:28,borderRadius:"50%",display:"flex",alignItems:"center",justifyContent:"center",fontWeight:800,fontSize:12,flexShrink:0}}>{i+1}</div>
                    <div style={{flex:1,display:"flex",flexDirection:"column",gap:12}}>
                      <input value={o.teks} onChange={e=>ubahOpsi(o.id,"teks",e.target.value)} placeholder={tipe==="PEMILU"?"Nama Lengkap Kandidat":"Teks Opsi (Setuju/Tolak dsb)"} 
                        style={{width:"100%",padding:"12px 14px",borderRadius:8,border:"1px solid #CBD5E1",fontSize:14,fontWeight:600,outline:"none"}}/>
                      {tipe==="PEMILU"&&(
                        <div style={{display:"flex",gap:10,alignItems:"flex-start"}}>
                          {/* Preview thumbnail */}
                          <label htmlFor={`foto-${o.id}`} style={{flexShrink:0,cursor:uploadingId===o.id?"wait":"pointer",position:"relative"}}>
                            <div style={{width:64,height:64,borderRadius:10,overflow:"hidden",border:"2px dashed #CBD5E1",background:"#F1F5F9",display:"flex",alignItems:"center",justifyContent:"center",fontSize:26,transition:"border-color 0.2s"}}
                              onMouseEnter={e=>(e.currentTarget.style.borderColor="#3B82F6")}
                              onMouseLeave={e=>(e.currentTarget.style.borderColor="#CBD5E1")}>
                              {uploadingId===o.id ? (
                                <div style={{fontSize:12,color:"#3B82F6",fontWeight:800,textAlign:"center",lineHeight:1.3}}>⏳<br/>Upload...</div>
                              ) : o.foto ? (
                                <img src={o.foto} alt="" style={{width:"100%",height:"100%",objectFit:"cover"}} onError={e=>{(e.target as HTMLImageElement).style.display="none";}} />
                              ) : "📷"}
                            </div>
                            <div style={{fontSize:9,color:"#94A3B8",fontWeight:700,textAlign:"center",marginTop:3,letterSpacing:"0.05em"}}>TAP GALERI</div>
                            <input id={`foto-${o.id}`} type="file" accept="image/*" style={{display:"none"}}
                              onChange={e=>{ const f=e.target.files?.[0]; if(f) uploadFoto(o.id, f); e.target.value=""; }} />
                          </label>
                          <div style={{flex:1}}>
                            <div style={{fontSize:11,color:"#64748B",fontWeight:700,marginBottom:4}}>Foto Kandidat</div>
                            <input value={o.foto} onChange={e=>ubahOpsi(o.id,"foto",e.target.value)} placeholder="atau paste URL foto..." 
                              style={{width:"100%",padding:"8px 12px",borderRadius:8,border:"1px solid #CBD5E1",fontSize:12,outline:"none",background:"white",color:"#475569"}}/>
                            {o.foto && <div style={{fontSize:11,color:"#10B981",fontWeight:700,marginTop:4}}>✅ Foto siap digunakan</div>}
                          </div>
                        </div>
                      )}
                    </div>
                    {opsi.length>2&&<button onClick={()=>hapusOpsi(o.id)} style={{background:"#FEE2E2",color:"#EF4444",border:"none",borderRadius:8,width:36,height:36,fontSize:14,cursor:"pointer",fontWeight:800,flexShrink:0}}>✕</button>}
                  </div>
                ))}
              </div>

              {/* Advanced Inclusion */}
              <div style={{background:"#F1F5F9",borderRadius:16,padding:"20px",marginBottom:32}}>
                <div style={{fontSize:12,fontWeight:800,color:"#64748B",letterSpacing:"0.05em",textTransform:"uppercase",marginBottom:12}}>Opsi Pintar Tingkat Lanjut</div>
                <div style={{display:"flex",gap:24,flexWrap:"wrap"}}>
                  <label style={{display:"flex",alignItems:"center",gap:8,fontSize:14,fontWeight:700,color:"#334155",cursor:"pointer"}}>
                    <input type="checkbox" checked={inklusiGolput} onChange={e=>setInklusiGolput(e.target.checked)} style={{width:18,height:18,accentColor:"#0F172A",cursor:"pointer"}}/> Sertakan "Kotak Kosong / Golput"
                  </label>
                  <label style={{display:"flex",alignItems:"center",gap:8,fontSize:14,fontWeight:700,color:"#334155",cursor:"pointer"}}>
                    <input type="checkbox" checked={inklusiNetral} onChange={e=>setInklusiNetral(e.target.checked)} style={{width:18,height:18,accentColor:"#0F172A",cursor:"pointer"}}/> Sertakan "Netral / Abstain"
                  </label>
                </div>
              </div>

              <button onClick={buatVoting} disabled={loading} style={{width:"100%",background:loading?"#94A3B8":"#1E293B",color:"white",border:"none",borderRadius:16,padding:"16px",fontSize:16,fontWeight:800,cursor:loading?"not-allowed":"pointer",transition:"all 0.2s",boxShadow:loading?"none":"0 8px 20px rgba(30,41,59,0.3)"}}>
                {loading?"Memproses Agenda...":"🚀 Deploy Agenda Voting Sekarang!"}
              </button>
            </div>
          </div>
        )}

        {/* ===================== TAB DAFTAR AGENDA ===================== */}
        {tab==="daftar"&&(
          <div style={{display:"flex",flexDirection:"column",gap:24,animation:"fadeIn 0.3s ease-out"}}>
            {list.length===0?<div style={{padding:"60px 20px",textAlign:"center",color:"#94A3B8",fontSize:15,fontWeight:600}}>Belum ada agenda voting dibuat.</div>
            :list.map(v=>{
              const {tipe:t_tipe, text:t_teks} = parseJudul(v.judul);
              const totalV = v.total_vote;
              return(
                <div key={v.id} style={{background:"white",borderRadius:24,border:"1px solid #E2E8F0",overflow:"hidden",boxShadow:"0 10px 25px rgba(0,0,0,0.02)"}}>
                  <div style={{padding:"24px 28px",borderBottom:"1px solid #F1F5F9",display:"flex",justifyContent:"space-between",alignItems:"flex-start",flexWrap:"wrap",gap:16}}>
                    <div>
                      <div style={{display:"flex",alignItems:"center",gap:12,marginBottom:8}}>
                        <span style={{background:STS[v.status].bg,color:STS[v.status].color,padding:"4px 12px",borderRadius:99,fontSize:11,fontWeight:800,textTransform:"uppercase",letterSpacing:"0.05em"}}>{STS[v.status].label}</span>
                        <span style={{background:t_tipe==="PEMILU"?"#EFF6FF":"#ECFDF5",color:t_tipe==="PEMILU"?"#3B82F6":"#10B981",padding:"4px 12px",borderRadius:99,fontSize:11,fontWeight:800}}>{t_tipe==="PEMILU"?"🧑‍💼 PEMILU KANDIDAT":"⚖️ MUSYAWARAH"}</span>
                      </div>
                      <div style={{fontWeight:900,fontSize:20,color:"#0F172A",marginBottom:6,letterSpacing:"-0.02em"}}>{t_teks}</div>
                      <div style={{fontSize:13,color:"#64748B",fontWeight:600}}>{fTgl(v.tgl_mulai)} — {v.tgl_selesai?fTgl(v.tgl_selesai):"Sekarang"}</div>
                    </div>
                    <div style={{textAlign:"right"}}>
                      <div style={{fontSize:28,fontWeight:900,color:"#1E293B",lineHeight:1}}>{fRp(totalV)}</div>
                      <div style={{fontSize:11,fontWeight:800,color:"#94A3B8",textTransform:"uppercase",letterSpacing:"0.05em",marginTop:6}}>Total Kotak Suara</div>
                    </div>
                  </div>

                  <div style={{padding:"16px 28px",background:"#F8FAFC",display:"flex",flexDirection:"column",gap:12}}>
                    {v.pilihan.map(p=>{
                      const {nama,foto} = parseKandidat(p.teks);
                      const pct = totalV===0?0:Math.round((p.jumlah_vote/totalV)*100);
                      return(
                        <div key={p.id} style={{display:"flex",alignItems:"center",gap:16}}>
                          {t_tipe==="PEMILU"&&(
                            <div style={{width:40,height:40,borderRadius:"50%",background:"#E2E8F0",overflow:"hidden",flexShrink:0,border:"2px solid white",boxShadow:"0 2px 8px rgba(0,0,0,0.1)"}}>
                              {foto?<img src={foto} alt={nama} style={{width:"100%",height:"100%",objectFit:"cover"}}/>:<div style={{width:"100%",height:"100%",display:"flex",alignItems:"center",justifyContent:"center",fontSize:18}}>👤</div>}
                            </div>
                          )}
                          <div style={{flex:1}}>
                            <div style={{display:"flex",justifyContent:"space-between",marginBottom:6}}>
                              <span style={{fontSize:14,fontWeight:800,color:"#334155"}}>{nama}</span>
                              <span style={{fontSize:13,fontWeight:800,color:"#0F172A"}}>{fRp(p.jumlah_vote)} <span style={{color:"#94A3B8"}}>({pct}%)</span></span>
                            </div>
                            <div style={{height:8,background:"#E2E8F0",borderRadius:99,overflow:"hidden"}}>
                              <div style={{height:"100%",width:`${pct}%`,background:"#1E293B",borderRadius:99}}/>
                            </div>
                          </div>
                        </div>
                      )
                    })}
                  </div>

                  <div style={{padding:"16px 28px",borderTop:"1px solid #F1F5F9",display:"flex",justifyContent:"space-between",background:"white",alignItems:"center",flexWrap:"wrap",gap:16}}>
                    <div style={{display:"flex",gap:8}}>
                      {v.status!=="aktif"&&<button onClick={()=>ubahStatus(v.id,"aktif")} style={{padding:"8px 16px",borderRadius:8,fontSize:13,fontWeight:700,background:"#ECFDF5",color:"#059669",border:"none",cursor:"pointer"}}>▶ Buka Voting</button>}
                      {v.status==="aktif"&&<button onClick={()=>ubahStatus(v.id,"tutup")} style={{padding:"8px 16px",borderRadius:8,fontSize:13,fontWeight:700,background:"#FEF2F2",color:"#DC2626",border:"none",cursor:"pointer"}}>⏹ Tutup Voting</button>}
                    </div>
                    <div style={{display:"flex",gap:8}}>
                      <button onClick={()=>resetVote(v.id)} style={{padding:"8px 16px",borderRadius:8,fontSize:13,fontWeight:700,background:"white",color:"#64748B",border:"1px solid #E2E8F0",cursor:"pointer"}}>🔄 Reset Suara</button>
                      <button onClick={()=>hapus(v.id)} style={{padding:"8px 16px",borderRadius:8,fontSize:13,fontWeight:700,background:"#FEF2F2",color:"#EF4444",border:"none",cursor:"pointer"}}>🗑️ Hapus Agenda</button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
      <style>{`@keyframes fadeIn {from{opacity:0;transform:translateY(10px)}to{opacity:1;transform:translateY(0)}}`}</style>
    </div>
  );
}