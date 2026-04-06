"use client";
// app/admin/voting/page.tsx
import { useState, useEffect } from "react";
import { supabase, isSupabaseReady } from "@/lib/supabase";

interface VotingItem {
  id: string; judul: string; deskripsi: string;
  status: "aktif"|"tutup"|"draft"; tgl_mulai: string; tgl_selesai: string; created_at: string;
}
interface Pilihan { id: string; voting_id: string; teks: string; jumlah_vote: number; }
interface HasilVoting extends VotingItem { pilihan: Pilihan[]; total_vote: number; }

const emptyForm = { judul:"", deskripsi:"", status:"draft" as const, tgl_mulai: new Date().toISOString().split("T")[0], tgl_selesai:"" };
const STS = { aktif:{label:"Aktif",bg:"#E8F5EE",color:"#1C6B3A"}, tutup:{label:"Tutup",bg:"#FDF0F0",color:"#8B2020"}, draft:{label:"Draft",bg:"#F5F0E8",color:"#7A5A1E"} };
const fRp = (n:number) => n.toLocaleString("id-ID");
const fTgl = (s:string) => new Date(s).toLocaleDateString("id-ID",{day:"numeric",month:"short",year:"numeric"});

export default function AdminVotingPage() {
  const [list,       setList]       = useState<HasilVoting[]>([]);
  const [form,       setForm]       = useState(emptyForm);
  const [opsi,       setOpsi]       = useState(["",""]);
  const [loading,    setLoading]    = useState(false);
  const [toast,      setToast]      = useState("");
  const [tab,        setTab]        = useState<"daftar"|"buat">("daftar");
  const [expandId,   setExpandId]   = useState<string|null>(null);

  const showToast = (msg:string) => { setToast(msg); setTimeout(()=>setToast(""),3000); };

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

  async function buatVoting() {
    if(!form.judul) return showToast("❌ Judul wajib diisi!");
    const bersih = opsi.filter(p=>p.trim());
    if(bersih.length < 2) return showToast("❌ Minimal 2 pilihan!");
    setLoading(true);
    const { data:v, error } = await supabase.from("voting").insert(form).select().single();
    if(error||!v){ showToast("❌ Gagal: "+error?.message); setLoading(false); return; }
    await supabase.from("pilihan_voting").insert(bersih.map(teks=>({voting_id:v.id,teks,jumlah_vote:0})));
    showToast("✅ Voting berhasil dibuat!");
    setForm(emptyForm); setOpsi(["",""]); setTab("daftar"); setLoading(false); fetchAll();
  }

  async function ubahStatus(id:string, status:"aktif"|"tutup"|"draft") {
    await supabase.from("voting").update({status}).eq("id",id);
    showToast(`✅ Status → ${STS[status].label}`); fetchAll();
  }

  async function hapus(id:string) {
    if(!confirm("Hapus voting ini?")) return;
    await supabase.from("pilihan_voting").delete().eq("voting_id",id);
    await supabase.from("voting").delete().eq("id",id);
    showToast("🗑️ Dihapus"); fetchAll();
  }

  async function resetVote(id:string) {
    if(!confirm("Reset semua vote ke 0?")) return;
    const ids = list.find(v=>v.id===id)?.pilihan.map(p=>p.id)||[];
    await Promise.all(ids.map(pid=>supabase.from("pilihan_voting").update({jumlah_vote:0}).eq("id",pid)));
    await supabase.from("vote_record").delete().eq("voting_id",id);
    showToast("🔄 Vote direset"); fetchAll();
  }

  const totalAktif = list.filter(v=>v.status==="aktif").length;
  const totalVote  = list.reduce((s,v)=>s+v.total_vote,0);

  return (
    <div style={{minHeight:"100vh",background:"#F5F0E8",fontFamily:"'DM Sans',system-ui,sans-serif"}}>
      {toast&&<div style={{position:"fixed",top:20,left:"50%",transform:"translateX(-50%)",background:"#1C3A2B",color:"white",padding:"10px 24px",borderRadius:99,zIndex:999,fontSize:14,fontWeight:600,boxShadow:"0 8px 32px rgba(0,0,0,.2)",whiteSpace:"nowrap"}}>{toast}</div>}

      {/* Header */}
      <header style={{background:"#F5F0E8",borderBottom:"1px solid rgba(45,90,64,0.12)",padding:"14px 20px",position:"sticky",top:0,zIndex:10,display:"flex",alignItems:"center",justifyContent:"space-between",flexWrap:"wrap",gap:8}}>
        <div style={{display:"flex",alignItems:"center",gap:12}}>
          <a href="/admin" style={{color:"#6B7C6D",textDecoration:"none",fontSize:13,fontWeight:600}}>← Admin</a>
          <span style={{color:"#C8BFAA"}}>|</span>
          <div>
            <div style={{fontWeight:800,fontSize:15,color:"#1A2E1F"}}>🗳️ Kelola Voting</div>
            <div style={{fontSize:10,color:"#7A9A7E",textTransform:"uppercase",letterSpacing:".08em"}}>{totalAktif} aktif · {fRp(totalVote)} suara</div>
          </div>
        </div>
        <div style={{display:"flex",gap:6,flexWrap:"wrap"}}>
          <a href="/voting" target="_blank" style={{padding:"7px 14px",borderRadius:99,fontSize:11,fontWeight:700,letterSpacing:".06em",textTransform:"uppercase",border:"1px solid rgba(45,90,64,.2)",color:"#2D5A40",textDecoration:"none"}}>Lihat Publik ↗</a>
          {(["daftar","buat"] as const).map(t=>(
            <button key={t} onClick={()=>setTab(t)} style={{padding:"7px 16px",borderRadius:99,fontSize:12,fontWeight:700,border:"none",cursor:"pointer",background:tab===t?"#1C3A2B":"transparent",color:tab===t?"white":"#6B7C6D"}}>
              {t==="daftar"?"📋 Daftar":"➕ Buat Baru"}
            </button>
          ))}
        </div>
      </header>

      <div style={{maxWidth:900,margin:"0 auto",padding:"20px 16px 80px"}}>

        {/* Stats */}
        <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fit,minmax(140px,1fr))",gap:12,marginBottom:24}}>
          {[{icon:"🗳️",val:list.length,label:"Total Voting"},{icon:"✅",val:totalAktif,label:"Sedang Aktif"},{icon:"👥",val:fRp(totalVote),label:"Total Suara"}].map(s=>(
            <div key={s.label} style={{background:"white",borderRadius:16,padding:"16px 18px",border:"1px solid rgba(45,90,64,.1)"}}>
              <div style={{fontSize:22,marginBottom:6}}>{s.icon}</div>
              <div style={{fontSize:22,fontWeight:900,color:"#1C3A2B"}}>{s.val}</div>
              <div style={{fontSize:10,color:"#7A9A7E",textTransform:"uppercase",letterSpacing:".06em"}}>{s.label}</div>
            </div>
          ))}
        </div>

        {/* ═══ DAFTAR ═══ */}
        {tab==="daftar"&&(
          <div style={{display:"flex",flexDirection:"column",gap:12}}>
            {list.length===0?(
              <div style={{textAlign:"center",padding:"64px 20px",color:"#9A9A8A"}}>
                <div style={{fontSize:48,marginBottom:12}}>🗳️</div>
                <div style={{fontSize:16,fontWeight:600}}>Belum ada voting</div>
                <button onClick={()=>setTab("buat")} style={{marginTop:16,padding:"10px 24px",borderRadius:99,background:"#1C3A2B",color:"white",border:"none",cursor:"pointer",fontSize:13,fontWeight:700}}>Buat Voting Pertama</button>
              </div>
            ):list.map(v=>{
              const cfg = STS[v.status];
              const isExp = expandId===v.id;
              const maxV = Math.max(...v.pilihan.map(p=>p.jumlah_vote),1);
              return(
                <div key={v.id} style={{background:"white",borderRadius:18,border:"1px solid rgba(45,90,64,.1)",overflow:"hidden"}}>
                  <div style={{padding:"18px 20px",display:"flex",alignItems:"flex-start",justifyContent:"space-between",gap:12,flexWrap:"wrap"}}>
                    <div style={{flex:1,minWidth:200}}>
                      <div style={{display:"flex",alignItems:"center",gap:8,marginBottom:6,flexWrap:"wrap"}}>
                        <span style={{padding:"3px 10px",borderRadius:99,fontSize:11,fontWeight:700,background:cfg.bg,color:cfg.color}}>{cfg.label}</span>
                        <span style={{fontSize:12,color:"#9A8C85"}}>{fTgl(v.tgl_mulai)}{v.tgl_selesai?` — ${fTgl(v.tgl_selesai)}`:""}</span>
                        <span style={{fontSize:12,color:"#9A8C85"}}>· {fRp(v.total_vote)} suara</span>
                      </div>
                      <div style={{fontSize:15,fontWeight:700,color:"#1A1410",marginBottom:4}}>{v.judul}</div>
                      {v.deskripsi&&<div style={{fontSize:12,color:"#9A8C85",lineHeight:1.6}}>{v.deskripsi}</div>}
                    </div>
                    <div style={{display:"flex",gap:6,flexWrap:"wrap"}}>
                      <button onClick={()=>setExpandId(isExp?null:v.id)} style={{padding:"6px 12px",borderRadius:10,fontSize:11,fontWeight:700,border:"1px solid rgba(45,90,64,.2)",background:isExp?"#E8F5EE":"transparent",color:"#2D5A40",cursor:"pointer"}}>{isExp?"▲ Tutup":"📊 Hasil"}</button>
                      {v.status!=="aktif"&&<button onClick={()=>ubahStatus(v.id,"aktif")} style={{padding:"6px 12px",borderRadius:10,fontSize:11,fontWeight:700,border:"none",background:"#E8F5EE",color:"#1C6B3A",cursor:"pointer"}}>▶ Aktifkan</button>}
                      {v.status==="aktif"&&<button onClick={()=>ubahStatus(v.id,"tutup")} style={{padding:"6px 12px",borderRadius:10,fontSize:11,fontWeight:700,border:"none",background:"#FDF0F0",color:"#8B2020",cursor:"pointer"}}>⏹ Tutup</button>}
                      <button onClick={()=>resetVote(v.id)} style={{padding:"6px 12px",borderRadius:10,fontSize:11,fontWeight:700,border:"1px solid rgba(45,90,64,.15)",background:"transparent",color:"#9A8C85",cursor:"pointer"}}>🔄</button>
                      <button onClick={()=>hapus(v.id)} style={{padding:"6px 12px",borderRadius:10,fontSize:11,fontWeight:700,border:"none",background:"#FDF0F0",color:"#8B2020",cursor:"pointer"}}>🗑️</button>
                    </div>
                  </div>

                  {isExp&&(
                    <div style={{borderTop:"1px solid rgba(45,90,64,.08)",padding:"16px 20px",background:"#FAFAF8"}}>
                      <div style={{fontSize:11,fontWeight:700,letterSpacing:".1em",textTransform:"uppercase",color:"#9A8C85",marginBottom:14}}>Hasil Suara</div>
                      {v.pilihan.map(p=>{
                        const pct = v.total_vote>0?Math.round((p.jumlah_vote/v.total_vote)*100):0;
                        const win = p.jumlah_vote===maxV&&v.total_vote>0;
                        return(
                          <div key={p.id} style={{marginBottom:12}}>
                            <div style={{display:"flex",justifyContent:"space-between",marginBottom:5}}>
                              <div style={{display:"flex",alignItems:"center",gap:8}}>
                                {win&&<span>🏆</span>}
                                <span style={{fontSize:13,fontWeight:win?700:500,color:win?"#1C3A2B":"#5A4A40"}}>{p.teks}</span>
                              </div>
                              <span style={{fontSize:13,fontWeight:700,color:"#1C3A2B"}}>{fRp(p.jumlah_vote)} ({pct}%)</span>
                            </div>
                            <div style={{height:8,background:"#F0EDE5",borderRadius:99,overflow:"hidden"}}>
                              <div style={{height:"100%",borderRadius:99,background:win?"#1C3A2B":"#B8943F",width:`${pct}%`,transition:"width .8s"}}/>
                            </div>
                          </div>
                        );
                      })}
                      <div style={{marginTop:10,fontSize:12,color:"#9A8C85",borderTop:"1px solid rgba(45,90,64,.08)",paddingTop:10}}>Total: <strong>{fRp(v.total_vote)} suara</strong></div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}

        {/* ═══ BUAT BARU ═══ */}
        {tab==="buat"&&(
          <div style={{background:"white",borderRadius:20,border:"1px solid rgba(45,90,64,.1)",padding:"28px"}}>
            <h3 style={{fontSize:16,fontWeight:800,color:"#1A2E1F",marginBottom:24}}>➕ Buat Voting Baru</h3>
            <div style={{display:"flex",flexDirection:"column",gap:18}}>

              <div>
                <label style={{display:"block",fontSize:11,fontWeight:700,letterSpacing:".1em",textTransform:"uppercase",color:"#6B7C6D",marginBottom:6}}>Judul Voting *</label>
                <input value={form.judul} onChange={e=>setForm({...form,judul:e.target.value})} placeholder="Cth: Pemilihan Ketua RT 01 Periode 2026"
                  style={{width:"100%",padding:"11px 14px",borderRadius:12,border:"1.5px solid rgba(45,90,64,.2)",fontSize:14,outline:"none",fontFamily:"inherit",boxSizing:"border-box"}}/>
              </div>

              <div>
                <label style={{display:"block",fontSize:11,fontWeight:700,letterSpacing:".1em",textTransform:"uppercase",color:"#6B7C6D",marginBottom:6}}>Deskripsi (opsional)</label>
                <textarea value={form.deskripsi} onChange={e=>setForm({...form,deskripsi:e.target.value})} rows={3} placeholder="Jelaskan konteks voting ini..."
                  style={{width:"100%",padding:"11px 14px",borderRadius:12,border:"1.5px solid rgba(45,90,64,.2)",fontSize:14,outline:"none",fontFamily:"inherit",resize:"vertical",boxSizing:"border-box"}}/>
              </div>

              <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fit,minmax(150px,1fr))",gap:12}}>
                <div>
                  <label style={{display:"block",fontSize:11,fontWeight:700,letterSpacing:".1em",textTransform:"uppercase",color:"#6B7C6D",marginBottom:6}}>Tgl Mulai</label>
                  <input type="date" value={form.tgl_mulai} onChange={e=>setForm({...form,tgl_mulai:e.target.value})}
                    style={{width:"100%",padding:"11px 14px",borderRadius:12,border:"1.5px solid rgba(45,90,64,.2)",fontSize:13,outline:"none",fontFamily:"inherit",boxSizing:"border-box"}}/>
                </div>
                <div>
                  <label style={{display:"block",fontSize:11,fontWeight:700,letterSpacing:".1em",textTransform:"uppercase",color:"#6B7C6D",marginBottom:6}}>Tgl Selesai</label>
                  <input type="date" value={form.tgl_selesai} onChange={e=>setForm({...form,tgl_selesai:e.target.value})}
                    style={{width:"100%",padding:"11px 14px",borderRadius:12,border:"1.5px solid rgba(45,90,64,.2)",fontSize:13,outline:"none",fontFamily:"inherit",boxSizing:"border-box"}}/>
                </div>
                <div>
                  <label style={{display:"block",fontSize:11,fontWeight:700,letterSpacing:".1em",textTransform:"uppercase",color:"#6B7C6D",marginBottom:6}}>Status Awal</label>
                  <select value={form.status} onChange={e=>setForm({...form,status:e.target.value as any})}
                    style={{width:"100%",padding:"11px 14px",borderRadius:12,border:"1.5px solid rgba(45,90,64,.2)",fontSize:13,outline:"none",fontFamily:"inherit",background:"white",boxSizing:"border-box"}}>
                    <option value="draft">Draft</option>
                    <option value="aktif">Langsung Aktif</option>
                  </select>
                </div>
              </div>

              <div>
                <label style={{display:"block",fontSize:11,fontWeight:700,letterSpacing:".1em",textTransform:"uppercase",color:"#6B7C6D",marginBottom:10}}>Pilihan / Kandidat * <span style={{fontWeight:400,textTransform:"none",letterSpacing:0,color:"#9A8C85"}}>(min. 2)</span></label>
                <div style={{display:"flex",flexDirection:"column",gap:8}}>
                  {opsi.map((p,i)=>(
                    <div key={i} style={{display:"flex",gap:8,alignItems:"center"}}>
                      <div style={{width:28,height:28,borderRadius:"50%",background:"#F0EDE5",display:"flex",alignItems:"center",justifyContent:"center",fontSize:12,fontWeight:700,color:"#6B7C6D",flexShrink:0}}>{i+1}</div>
                      <input value={p} onChange={e=>{const n=[...opsi];n[i]=e.target.value;setOpsi(n);}} placeholder={`Pilihan ${i+1}${i<2?" *":""}`}
                        style={{flex:1,padding:"10px 14px",borderRadius:10,border:"1.5px solid rgba(45,90,64,.2)",fontSize:13,outline:"none",fontFamily:"inherit"}}/>
                      {opsi.length>2&&<button onClick={()=>setOpsi(opsi.filter((_,j)=>j!==i))} style={{width:32,height:32,borderRadius:8,border:"none",background:"#FDF0F0",color:"#8B2020",cursor:"pointer",fontSize:16,flexShrink:0}}>×</button>}
                    </div>
                  ))}
                  <button onClick={()=>setOpsi([...opsi,""])} style={{padding:"9px",borderRadius:10,border:"1.5px dashed rgba(45,90,64,.25)",background:"transparent",color:"#2D5A40",cursor:"pointer",fontSize:13,fontWeight:600}}>+ Tambah Pilihan</button>
                </div>
              </div>

              <div style={{display:"flex",gap:10,paddingTop:8}}>
                <button onClick={()=>setTab("daftar")} style={{flex:1,padding:"13px",borderRadius:12,background:"transparent",border:"1.5px solid rgba(45,90,64,.2)",color:"#6B7C6D",cursor:"pointer",fontSize:13,fontWeight:700}}>Batal</button>
                <button onClick={buatVoting} disabled={loading} style={{flex:2,padding:"13px",borderRadius:12,background:"#1C3A2B",color:"white",border:"none",cursor:loading?"not-allowed":"pointer",fontSize:13,fontWeight:700,opacity:loading?.6:1}}>
                  {loading?"Menyimpan...":"🗳️ Buat Voting"}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* SQL Guide */}
        <details style={{marginTop:24,background:"rgba(184,148,63,.07)",border:"1px solid rgba(184,148,63,.2)",borderRadius:14,padding:"14px 18px"}}>
          <summary style={{fontSize:12,fontWeight:700,color:"#7A5A1E",cursor:"pointer"}}>📋 Setup Supabase SQL — klik untuk lihat</summary>
          <pre style={{marginTop:12,fontSize:11,lineHeight:1.7,color:"#5A4A35",overflow:"auto",whiteSpace:"pre-wrap"}}>{`CREATE TABLE voting (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  judul text NOT NULL,
  deskripsi text,
  status text DEFAULT 'draft' CHECK (status IN ('draft','aktif','tutup')),
  tgl_mulai date,
  tgl_selesai date,
  created_at timestamptz DEFAULT now()
);

CREATE TABLE pilihan_voting (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  voting_id uuid REFERENCES voting(id) ON DELETE CASCADE,
  teks text NOT NULL,
  jumlah_vote integer DEFAULT 0
);

CREATE TABLE vote_record (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  voting_id uuid REFERENCES voting(id) ON DELETE CASCADE,
  kk_id text,
  ip_address text,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE voting ENABLE ROW LEVEL SECURITY;
ALTER TABLE pilihan_voting ENABLE ROW LEVEL SECURITY;
ALTER TABLE vote_record ENABLE ROW LEVEL SECURITY;

CREATE POLICY "all" ON voting FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "all" ON pilihan_voting FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "all" ON vote_record FOR ALL USING (true) WITH CHECK (true);`}</pre>
        </details>
      </div>
    </div>
  );
}