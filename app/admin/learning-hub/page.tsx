"use client";
import { useState, useEffect } from "react";
import "../admin-styles-heroic.css";
import { supabase, isSupabaseReady } from "@/lib/supabase";

type Tab = "buku"|"video"|"dokumen"|"galeri"|"lab";
const TABS: {key:Tab;icon:string;label:string}[] = [
  {key:"buku",icon:"📚",label:"Buku"},
  {key:"video",icon:"▶️",label:"Video"},
  {key:"dokumen",icon:"📄",label:"Dokumen"},
  {key:"galeri",icon:"🖼️",label:"Galeri"},
  {key:"lab",icon:"💻",label:"Lab PC"},
];

const EB = {judul:"",penulis:"",icon:"📕",kategori:"umum",status:"tersedia",deskripsi:"",foto_sampul:"",jenis_buku:"fisik",file_url:""};
const EV = {judul:"",url:"",kategori:"umum",durasi:"",deskripsi:""};
const ED = {judul:"",url:"",tipe:"PDF",ukuran:"",deskripsi:""};
const EG = {judul:"",url:"",deskripsi:""};
const EL = {nomor_pc:"",status:"tersedia",spesifikasi:""};

const IS: React.CSSProperties = {width:"100%",padding:"11px 14px",borderRadius:10,border:"1.5px solid rgba(45,90,64,0.2)",fontSize:13,background:"#fafaf8",outline:"none",boxSizing:"border-box",fontFamily:"inherit"};

export default function AdminLearningHub() {
  const [tab, setTab] = useState<Tab>("buku");
  const [toast, setToast] = useState("");
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [editId, setEditId] = useState<string|null>(null);
  const [books, setBooks] = useState<any[]>([]);
  const [videos, setVideos] = useState<any[]>([]);
  const [docs, setDocs] = useState<any[]>([]);
  const [galeri, setGaleri] = useState<any[]>([]);
  const [labPCs, setLabPCs] = useState<any[]>([]);
  const [fB, setFB] = useState({...EB});
  const [fV, setFV] = useState({...EV});
  const [fD, setFD] = useState({...ED});
  const [fG, setFG] = useState({...EG});
  const [fL, setFL] = useState({...EL});

  const showToast = (m:string) => { setToast(m); setTimeout(()=>setToast(""),3500); };

  async function fetchAll() {
    if(!isSupabaseReady()) return;
    const [b,v,d,g,l] = await Promise.all([
      supabase.from("buku_perpustakaan").select("*").order("judul"),
      supabase.from("video_pembelajaran").select("*").order("created_at",{ascending:false}),
      supabase.from("dokumen_hub").select("*").order("created_at",{ascending:false}),
      supabase.from("galeri_hub").select("*").order("created_at",{ascending:false}),
      supabase.from("lab_komputer").select("*").order("nomor_pc"),
    ]);
    if(b.data) setBooks(b.data);
    if(v.data) setVideos(v.data);
    if(d.data) setDocs(d.data);
    if(g.data) setGaleri(g.data);
    if(l.data) setLabPCs(l.data);
  }

  useEffect(()=>{ fetchAll(); },[]);

  async function uploadFile(file: File, bucket: string): Promise<string|null> {
    setUploading(true);
    const ext = file.name.split('.').pop();
    const name = `${bucket}-${Date.now()}.${ext}`;
    const {error} = await supabase.storage.from(bucket).upload(name, file, {upsert:true});
    setUploading(false);
    if(error){ showToast("❌ Upload gagal: "+error.message); return null; }
    const {data} = supabase.storage.from(bucket).getPublicUrl(name);
    showToast("✅ File diupload!");
    return data.publicUrl;
  }

  function openAdd() {
    setEditId(null);
    setFB({...EB}); setFV({...EV}); setFD({...ED}); setFG({...EG}); setFL({...EL});
    setShowModal(true);
  }

  function openEdit(item:any) {
    setEditId(item.id);
    if(tab==="buku") setFB({judul:item.judul,penulis:item.penulis||"",icon:item.icon||"📕",kategori:item.kategori||"umum",status:item.status||"tersedia",deskripsi:item.deskripsi||"",foto_sampul:item.foto_sampul||"",jenis_buku:item.jenis_buku||"fisik",file_url:item.file_url||""});
    if(tab==="video") setFV({judul:item.judul,url:item.url||"",kategori:item.kategori||"umum",durasi:item.durasi||"",deskripsi:item.deskripsi||""});
    if(tab==="dokumen") setFD({judul:item.judul,url:item.url||"",tipe:item.tipe||"PDF",ukuran:item.ukuran||"",deskripsi:item.deskripsi||""});
    if(tab==="galeri") setFG({judul:item.judul||"",url:item.url||"",deskripsi:item.deskripsi||""});
    if(tab==="lab") setFL({nomor_pc:String(item.nomor_pc||""),status:item.status||"tersedia",spesifikasi:item.spesifikasi||""});
    setShowModal(true);
  }

  async function handleSave() {
    if(!isSupabaseReady()) return;
    setLoading(true);
    let tbl="", payload:any={};
    if(tab==="buku"){ tbl="buku_perpustakaan"; payload=fB; if(!payload.judul){showToast("❌ Judul wajib!");setLoading(false);return;} }
    if(tab==="video"){ tbl="video_pembelajaran"; payload=fV; if(!payload.judul||!payload.url){showToast("❌ Judul & URL wajib!");setLoading(false);return;} }
    if(tab==="dokumen"){ tbl="dokumen_hub"; payload=fD; if(!payload.judul||!payload.url){showToast("❌ Judul & URL wajib!");setLoading(false);return;} }
    if(tab==="galeri"){ tbl="galeri_hub"; payload=fG; if(!payload.url){showToast("❌ URL foto wajib!");setLoading(false);return;} }
    if(tab==="lab"){ tbl="lab_komputer"; payload={...fL,nomor_pc:Number(fL.nomor_pc)}; if(!fL.nomor_pc){showToast("❌ Nomor PC wajib!");setLoading(false);return;} }
    const {error} = editId
      ? await supabase.from(tbl).update(payload).eq("id",editId)
      : await supabase.from(tbl).insert(payload);
    if(error) showToast("❌ "+error.message);
    else showToast(editId?"✅ Data diupdate!":"✅ Data ditambahkan!");
    setShowModal(false); setEditId(null); setLoading(false); fetchAll();
  }

  async function handleDelete(id:string) {
    if(!confirm("Yakin hapus data ini?")) return;
    const tblMap:Record<Tab,string> = {buku:"buku_perpustakaan",video:"video_pembelajaran",dokumen:"dokumen_hub",galeri:"galeri_hub",lab:"lab_komputer"};
    const {error} = await supabase.from(tblMap[tab]).delete().eq("id",id);
    if(error) showToast("❌ "+error.message);
    else { showToast("🗑️ Dihapus!"); fetchAll(); }
  }

  const counts = {buku:books.length,video:videos.length,dokumen:docs.length,galeri:galeri.length,lab:labPCs.length};
  const currentList = tab==="buku"?books:tab==="video"?videos:tab==="dokumen"?docs:tab==="galeri"?galeri:labPCs;

  // Upload helper component inline
  function UploadOrUrl({label, value, onChange, bucket, accept, urlPlaceholder}:{label:string;value:string;onChange:(v:string)=>void;bucket:string;accept:string;urlPlaceholder:string}) {
    return (
      <div>
        <div style={{fontSize:11,fontWeight:700,color:"#7a9a7e",marginBottom:8,textTransform:"uppercase",letterSpacing:".06em"}}>{label}</div>
        <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:8,marginBottom:8}}>
          <div style={{padding:"10px 12px",borderRadius:10,background:"rgba(47,143,78,0.06)",border:"1.5px solid rgba(47,143,78,0.2)",fontSize:11,fontWeight:700,color:"#2d5a40",textAlign:"center"}}>🔗 Dari URL</div>
          <div style={{padding:"10px 12px",borderRadius:10,background:"rgba(47,143,78,0.06)",border:"1.5px solid rgba(47,143,78,0.2)",fontSize:11,fontWeight:700,color:"#2d5a40",textAlign:"center"}}>⬆️ Upload File</div>
        </div>
        <input style={{...IS,marginBottom:8}} placeholder={urlPlaceholder} value={value} onChange={e=>onChange(e.target.value)} />
        <label style={{display:"flex",alignItems:"center",gap:10,padding:"10px 14px",borderRadius:10,border:"1.5px dashed rgba(45,90,64,0.3)",cursor:"pointer",background:"rgba(47,143,78,0.03)"}}>
          <span style={{fontSize:18}}>📁</span>
          <span style={{fontSize:12,color:"#6b7c6d",fontWeight:600}}>{uploading?"Mengupload...":"Pilih file dari perangkat"}</span>
          <input type="file" accept={accept} style={{display:"none"}} onChange={async e=>{
            const file=e.target.files?.[0]; if(!file) return;
            const url = await uploadFile(file, bucket);
            if(url) onChange(url);
          }}/>
        </label>
        {value && (
          <div style={{marginTop:8,padding:"8px 12px",borderRadius:8,background:"rgba(47,143,78,0.06)",fontSize:11,color:"#2d5a40",fontWeight:600,wordBreak:"break-all"}}>
            ✅ {value.startsWith("http")?value.substring(0,60)+"...":value}
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="admin-page heroic-bg" style={{minHeight:"100vh",fontFamily:"'Segoe UI',system-ui,sans-serif"}}>
      {toast && <div style={{position:"fixed",top:20,left:"50%",transform:"translateX(-50%)",background:toast.startsWith("❌")?"#8B2020":"#2d5a40",color:"white",padding:"10px 24px",borderRadius:12,zIndex:999,fontSize:14,fontWeight:700,boxShadow:"0 4px 20px rgba(0,0,0,.15)",whiteSpace:"nowrap"}}>{toast}</div>}

      <header style={{background:"#f5f0e8",borderBottom:"1px solid rgba(45,90,64,0.12)",padding:"14px 20px",position:"sticky",top:0,zIndex:10,display:"flex",alignItems:"center",justifyContent:"space-between"}}>
        <div style={{display:"flex",alignItems:"center",gap:12}}>
          <a href="/admin" style={{color:"#6b7c6d",textDecoration:"none",fontSize:13,fontWeight:600}}>← Admin</a>
          <span style={{color:"#c8bfaa"}}>|</span>
          <div>
            <div style={{fontWeight:800,fontSize:15,color:"#1a2e1f"}}>📚 Learning Hub</div>
            <div style={{fontSize:10,color:"#7a9a7e",textTransform:"uppercase",letterSpacing:"0.08em"}}>Kelola Konten Edukasi</div>
          </div>
        </div>
        <button onClick={openAdd} style={{background:"linear-gradient(135deg,#2F8F4E,#4FBF7E)",color:"white",border:"none",borderRadius:12,padding:"10px 20px",fontWeight:700,fontSize:13,cursor:"pointer",boxShadow:"0 6px 20px rgba(47,143,78,0.3)"}}>+ Tambah Data</button>
      </header>

      <div style={{maxWidth:960,margin:"0 auto",padding:"20px 16px"}}>
        {/* Stat cards */}
        <div style={{display:"grid",gridTemplateColumns:"repeat(5,1fr)",gap:12,marginBottom:20}}>
          {TABS.map(t=>(
            <div key={t.key} onClick={()=>setTab(t.key)} style={{background:"white",borderRadius:14,padding:"16px",border:`2px solid ${tab===t.key?"#2F8F4E":"rgba(45,90,64,0.1)"}`,textAlign:"center",cursor:"pointer",transition:"all .3s",boxShadow:tab===t.key?"0 4px 16px rgba(47,143,78,0.15)":"none"}}>
              <div style={{fontSize:24,marginBottom:4}}>{t.icon}</div>
              <div style={{fontSize:24,fontWeight:900,color:"#1a2e1f"}}>{counts[t.key]}</div>
              <div style={{fontSize:10,color:tab===t.key?"#2d5a40":"#7a9a7e",fontWeight:700,textTransform:"uppercase"}}>{t.label}</div>
            </div>
          ))}
        </div>

        {/* Tab buttons */}
        <div style={{display:"flex",gap:6,marginBottom:20,flexWrap:"wrap"}}>
          {TABS.map(t=>(
            <button key={t.key} onClick={()=>setTab(t.key)} style={{padding:"8px 16px",borderRadius:20,fontSize:12,fontWeight:700,border:"1.5px solid rgba(45,90,64,0.2)",cursor:"pointer",transition:"all .2s",background:tab===t.key?"#2d5a40":"transparent",color:tab===t.key?"white":"#6b7c6d"}}>
              {t.icon} {t.label} ({counts[t.key]})
            </button>
          ))}
        </div>

        {/* List */}
        <div className="card-heroic" style={{padding:0,overflow:"hidden"}}>
          <div style={{padding:"16px 20px",borderBottom:"1px solid rgba(45,90,64,0.08)"}}>
            <div style={{fontWeight:800,fontSize:14,color:"#1a2e1f"}}>{TABS.find(t=>t.key===tab)?.icon} Daftar {TABS.find(t=>t.key===tab)?.label} ({currentList.length})</div>
          </div>
          {currentList.length===0 ? (
            <div style={{padding:60,textAlign:"center",color:"#a8b5a9",fontWeight:600}}>
              <div style={{fontSize:40,marginBottom:12,opacity:.3}}>📭</div>
              Belum ada data. Klik &quot;+ Tambah Data&quot; untuk mulai.
            </div>
          ) : (
            <div style={{maxHeight:520,overflowY:"auto"}}>
              {currentList.map(item=>(
                <div key={item.id} style={{padding:"14px 20px",borderBottom:"1px solid rgba(0,0,0,0.04)",display:"flex",alignItems:"center",gap:14,transition:"background .2s"}}
                  onMouseOver={e=>(e.currentTarget.style.background="rgba(47,143,78,0.02)")}
                  onMouseOut={e=>(e.currentTarget.style.background="")}>
                  {/* Thumbnail */}
                  {(tab==="buku"&&item.foto_sampul) ? (
                    <img src={item.foto_sampul} alt="" style={{width:44,height:56,borderRadius:8,objectFit:"cover",flexShrink:0,border:"1px solid rgba(0,0,0,0.08)"}}/>
                  ) : tab==="galeri"&&item.url ? (
                    <img src={item.url} alt="" style={{width:56,height:44,borderRadius:8,objectFit:"cover",flexShrink:0}}/>
                  ) : (
                    <div style={{width:44,height:44,borderRadius:12,background:"rgba(47,143,78,0.08)",display:"flex",alignItems:"center",justifyContent:"center",fontSize:20,flexShrink:0}}>
                      {tab==="buku"?(item.icon||"📕"):tab==="video"?"▶️":tab==="dokumen"?"📄":tab==="galeri"?"🖼️":"🖥️"}
                    </div>
                  )}
                  <div style={{flex:1,minWidth:0}}>
                    <div style={{fontSize:14,fontWeight:700,color:"#1a2e1f",whiteSpace:"nowrap",overflow:"hidden",textOverflow:"ellipsis"}}>
                      {tab==="lab"?`PC-${item.nomor_pc}`:item.judul}
                    </div>
                    <div style={{fontSize:12,color:"#7a9a7e",marginTop:2}}>
                      {tab==="buku"&&<><span style={{fontWeight:800,color:item.jenis_buku==="ebook"?"#3B82F6":"#D97706"}}>[{item.jenis_buku==="ebook"?"E-Book":"Fisik"}]</span> {item.penulis||"—"} · {item.kategori}</>}
                      {tab==="video"&&`${item.kategori||"Umum"} · ${item.durasi||"—"}`}
                      {tab==="dokumen"&&`${item.tipe||"PDF"} · ${item.ukuran||"—"}`}
                      {tab==="galeri"&&(item.deskripsi||"Foto kegiatan")}
                      {tab==="lab"&&(item.spesifikasi||"—")}
                    </div>
                  </div>
                  {(tab==="buku"||tab==="lab")&&(
                    <span style={{fontSize:10,fontWeight:800,padding:"4px 10px",borderRadius:99,flexShrink:0,background:item.status==="tersedia"?"rgba(47,143,78,0.1)":"rgba(220,53,69,0.08)",color:item.status==="tersedia"?"#2d5a40":"#8b2020"}}>{item.status}</span>
                  )}
                  <div style={{display:"flex",gap:6,flexShrink:0}}>
                    <button onClick={()=>openEdit(item)} style={{padding:"6px 10px",borderRadius:8,background:"rgba(45,90,64,0.06)",border:"1px solid rgba(45,90,64,0.12)",color:"#2d5a40",cursor:"pointer",fontSize:12,fontWeight:700}}>✏️</button>
                    <button onClick={()=>handleDelete(item.id)} style={{padding:"6px 10px",borderRadius:8,background:"rgba(139,32,32,0.05)",border:"1px solid rgba(139,32,32,0.1)",color:"#8B2020",cursor:"pointer",fontSize:12}}>🗑️</button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Modal */}
      {showModal && (
        <div style={{position:"fixed",inset:0,background:"rgba(0,0,0,0.55)",display:"flex",alignItems:"center",justifyContent:"center",zIndex:50,padding:20}}>
          <div style={{background:"white",borderRadius:20,width:"100%",maxWidth:520,padding:28,maxHeight:"88vh",overflowY:"auto"}}>
            <h2 style={{margin:"0 0 20px",fontSize:20,fontWeight:800,color:"#1a2e1f"}}>{editId?"Edit":"Tambah"} {TABS.find(t=>t.key===tab)?.label}</h2>

            {tab==="buku" && (
              <div style={{display:"flex",flexDirection:"column",gap:14}}>
                <select style={{...IS,fontWeight:700,color:"#2d5a40"}} value={fB.jenis_buku} onChange={e=>setFB({...fB,jenis_buku:e.target.value})}>
                  <option value="fisik">📚 Jenis: Buku Fisik (Cetak)</option>
                  <option value="ebook">📱 Jenis: E-Book (Digital)</option>
                </select>
                <input style={IS} placeholder="Judul buku *" value={fB.judul} onChange={e=>setFB({...fB,judul:e.target.value})}/>
                <input style={IS} placeholder="Penulis / Pengarang" value={fB.penulis} onChange={e=>setFB({...fB,penulis:e.target.value})}/>
                <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:10}}>
                  <input style={IS} placeholder="Emoji icon (📕)" value={fB.icon} onChange={e=>setFB({...fB,icon:e.target.value})}/>
                  <select style={IS} value={fB.kategori} onChange={e=>setFB({...fB,kategori:e.target.value})}>
                    {["umum","agama","teknologi","pertanian","anak","novel","bisnis"].map(k=><option key={k}>{k}</option>)}
                  </select>
                </div>
                {fB.jenis_buku === "fisik" && (
                  <select style={IS} value={fB.status} onChange={e=>setFB({...fB,status:e.target.value})}>
                    <option value="tersedia">✅ Tersedia</option>
                    <option value="dipinjam">📤 Dipinjam</option>
                  </select>
                )}
                {fB.jenis_buku === "ebook" && (
                  <UploadOrUrl label="File PDF E-Book" value={fB.file_url} onChange={v=>setFB({...fB,file_url:v})} bucket="dokumen-hub" accept=".pdf" urlPlaceholder="URL file PDF E-Book"/>
                )}
                <UploadOrUrl label="Foto Sampul" value={fB.foto_sampul} onChange={v=>setFB({...fB,foto_sampul:v})} bucket="buku-sampul" accept="image/*" urlPlaceholder="URL gambar sampul buku"/>
                {fB.foto_sampul && <img src={fB.foto_sampul} alt="" style={{maxHeight:160,borderRadius:10,objectFit:"cover",border:"1px solid rgba(0,0,0,0.08)"}}/>}
                <textarea style={{...IS,minHeight:80}} placeholder="Deskripsi / sinopsis singkat" value={fB.deskripsi} onChange={e=>setFB({...fB,deskripsi:e.target.value})}/>
              </div>
            )}

            {tab==="video" && (
              <div style={{display:"flex",flexDirection:"column",gap:14}}>
                <input style={IS} placeholder="Judul video *" value={fV.judul} onChange={e=>setFV({...fV,judul:e.target.value})}/>
                <UploadOrUrl label="File / Link Video *" value={fV.url} onChange={v=>setFV({...fV,url:v})} bucket="video-hub" accept="video/*" urlPlaceholder="https://youtube.com/watch?v=... atau URL video"/>
                <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:10}}>
                  <select style={IS} value={fV.kategori} onChange={e=>setFV({...fV,kategori:e.target.value})}>
                    {["umum","umkm","pertanian","teknologi","koding","kesehatan","agama"].map(k=><option key={k}>{k}</option>)}
                  </select>
                  <input style={IS} placeholder="Durasi (cth: 15:30)" value={fV.durasi} onChange={e=>setFV({...fV,durasi:e.target.value})}/>
                </div>
                <textarea style={{...IS,minHeight:80}} placeholder="Deskripsi video" value={fV.deskripsi} onChange={e=>setFV({...fV,deskripsi:e.target.value})}/>
              </div>
            )}

            {tab==="dokumen" && (
              <div style={{display:"flex",flexDirection:"column",gap:14}}>
                <input style={IS} placeholder="Judul dokumen *" value={fD.judul} onChange={e=>setFD({...fD,judul:e.target.value})}/>
                <UploadOrUrl label="File / Link Dokumen *" value={fD.url} onChange={v=>setFD({...fD,url:v})} bucket="dokumen-hub" accept=".pdf,.doc,.docx,.ppt,.pptx,.xls,.xlsx" urlPlaceholder="https://drive.google.com/... atau URL dokumen"/>
                <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:10}}>
                  <select style={IS} value={fD.tipe} onChange={e=>setFD({...fD,tipe:e.target.value})}>
                    {["PDF","DOC","PPT","XLS","Lainnya"].map(k=><option key={k}>{k}</option>)}
                  </select>
                  <input style={IS} placeholder="Ukuran (cth: 2.5 MB)" value={fD.ukuran} onChange={e=>setFD({...fD,ukuran:e.target.value})}/>
                </div>
                <textarea style={{...IS,minHeight:80}} placeholder="Deskripsi dokumen" value={fD.deskripsi} onChange={e=>setFD({...fD,deskripsi:e.target.value})}/>
              </div>
            )}

            {tab==="galeri" && (
              <div style={{display:"flex",flexDirection:"column",gap:14}}>
                <input style={IS} placeholder="Judul / nama foto" value={fG.judul} onChange={e=>setFG({...fG,judul:e.target.value})}/>
                <UploadOrUrl label="Foto Kegiatan *" value={fG.url} onChange={v=>setFG({...fG,url:v})} bucket="galeri-hub" accept="image/*" urlPlaceholder="https://... URL foto"/>
                {fG.url && <img src={fG.url} alt="" style={{maxHeight:180,borderRadius:12,objectFit:"cover"}}/>}
                <textarea style={{...IS,minHeight:80}} placeholder="Keterangan foto / kegiatan" value={fG.deskripsi} onChange={e=>setFG({...fG,deskripsi:e.target.value})}/>
              </div>
            )}

            {tab==="lab" && (
              <div style={{display:"flex",flexDirection:"column",gap:14}}>
                <input type="number" style={IS} placeholder="Nomor PC *" value={fL.nomor_pc} onChange={e=>setFL({...fL,nomor_pc:e.target.value})}/>
                <select style={IS} value={fL.status} onChange={e=>setFL({...fL,status:e.target.value})}>
                  <option value="tersedia">✅ Tersedia</option>
                  <option value="dipakai">🔄 Sedang Dipakai</option>
                  <option value="maintenance">🔧 Maintenance</option>
                </select>
                <textarea style={{...IS,minHeight:80}} placeholder="Spesifikasi (cth: Intel i5 Gen12, RAM 8GB, SSD 256GB)" value={fL.spesifikasi} onChange={e=>setFL({...fL,spesifikasi:e.target.value})}/>
              </div>
            )}

            <div style={{display:"flex",gap:12,marginTop:24}}>
              <button onClick={()=>{setShowModal(false);setEditId(null);}} style={{flex:1,padding:14,borderRadius:12,border:"1px solid #ddd",background:"white",fontSize:13,fontWeight:600,cursor:"pointer"}}>Batal</button>
              <button onClick={handleSave} disabled={loading||uploading} className="btn-heroic" style={{flex:2}}>
                {uploading?"⬆️ Mengupload...":loading?"Menyimpan...":"💾 Simpan"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
