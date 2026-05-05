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

const EMPTY_BUKU = {judul:"",penulis:"",icon:"📕",kategori:"umum",status:"tersedia",deskripsi:""};
const EMPTY_VIDEO = {judul:"",url:"",kategori:"umum",durasi:"",deskripsi:""};
const EMPTY_DOK = {judul:"",url:"",tipe:"PDF",ukuran:"",deskripsi:""};
const EMPTY_GALERI = {judul:"",url:"",deskripsi:""};
const EMPTY_LAB = {nomor_pc:"",status:"tersedia",spesifikasi:""};

export default function AdminLearningHub() {
  const [tab, setTab] = useState<Tab>("buku");
  const [toast, setToast] = useState("");
  const [loading, setLoading] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [editId, setEditId] = useState<string|null>(null);

  // Data lists
  const [books, setBooks] = useState<any[]>([]);
  const [videos, setVideos] = useState<any[]>([]);
  const [docs, setDocs] = useState<any[]>([]);
  const [galeri, setGaleri] = useState<any[]>([]);
  const [labPCs, setLabPCs] = useState<any[]>([]);

  // Forms
  const [fBuku, setFBuku] = useState({...EMPTY_BUKU});
  const [fVideo, setFVideo] = useState({...EMPTY_VIDEO});
  const [fDok, setFDok] = useState({...EMPTY_DOK});
  const [fGaleri, setFGaleri] = useState({...EMPTY_GALERI});
  const [fLab, setFLab] = useState({...EMPTY_LAB});

  function showToast(m:string){setToast(m);setTimeout(()=>setToast(""),3000);}

  async function fetchAll(){
    if(!isSupabaseReady())return;
    const [b,v,d,g,l] = await Promise.all([
      supabase.from("buku_perpustakaan").select("*").order("judul"),
      supabase.from("video_pembelajaran").select("*").order("created_at",{ascending:false}),
      supabase.from("dokumen_hub").select("*").order("created_at",{ascending:false}),
      supabase.from("galeri_hub").select("*").order("created_at",{ascending:false}),
      supabase.from("lab_komputer").select("*").order("nomor_pc"),
    ]);
    if(b.data)setBooks(b.data);
    if(v.data)setVideos(v.data);
    if(d.data)setDocs(d.data);
    if(g.data)setGaleri(g.data);
    if(l.data)setLabPCs(l.data);
  }

  useEffect(()=>{fetchAll();},[]);

  function openAdd(){setEditId(null);setFBuku({...EMPTY_BUKU});setFVideo({...EMPTY_VIDEO});setFDok({...EMPTY_DOK});setFGaleri({...EMPTY_GALERI});setFLab({...EMPTY_LAB});setShowModal(true);}

  function openEdit(item:any){
    setEditId(item.id);
    if(tab==="buku")setFBuku({judul:item.judul,penulis:item.penulis||"",icon:item.icon||"📕",kategori:item.kategori||"umum",status:item.status||"tersedia",deskripsi:item.deskripsi||""});
    if(tab==="video")setFVideo({judul:item.judul,url:item.url||"",kategori:item.kategori||"umum",durasi:item.durasi||"",deskripsi:item.deskripsi||""});
    if(tab==="dokumen")setFDok({judul:item.judul,url:item.url||"",tipe:item.tipe||"PDF",ukuran:item.ukuran||"",deskripsi:item.deskripsi||""});
    if(tab==="galeri")setFGaleri({judul:item.judul||"",url:item.url||"",deskripsi:item.deskripsi||""});
    if(tab==="lab")setFLab({nomor_pc:String(item.nomor_pc||""),status:item.status||"tersedia",spesifikasi:item.spesifikasi||""});
    setShowModal(true);
  }

  async function handleSave(){
    if(!isSupabaseReady())return;
    setLoading(true);
    let tbl="",payload:any={};
    if(tab==="buku"){tbl="buku_perpustakaan";payload=fBuku;if(!payload.judul){showToast("❌ Judul wajib!");setLoading(false);return;}}
    if(tab==="video"){tbl="video_pembelajaran";payload=fVideo;if(!payload.judul||!payload.url){showToast("❌ Judul & URL wajib!");setLoading(false);return;}}
    if(tab==="dokumen"){tbl="dokumen_hub";payload=fDok;if(!payload.judul||!payload.url){showToast("❌ Judul & URL wajib!");setLoading(false);return;}}
    if(tab==="galeri"){tbl="galeri_hub";payload=fGaleri;if(!payload.url){showToast("❌ URL foto wajib!");setLoading(false);return;}}
    if(tab==="lab"){tbl="lab_komputer";payload={...fLab,nomor_pc:Number(fLab.nomor_pc)};if(!fLab.nomor_pc){showToast("❌ Nomor PC wajib!");setLoading(false);return;}}

    const {error} = editId
      ? await supabase.from(tbl).update(payload).eq("id",editId)
      : await supabase.from(tbl).insert(payload);

    if(error)showToast("❌ "+error.message);
    else showToast(editId?"✅ Data diupdate!":"✅ Data ditambahkan!");
    setShowModal(false);setEditId(null);setLoading(false);fetchAll();
  }

  async function handleDelete(id:string){
    if(!confirm("Yakin hapus data ini?"))return;
    let tbl="";
    if(tab==="buku")tbl="buku_perpustakaan";
    if(tab==="video")tbl="video_pembelajaran";
    if(tab==="dokumen")tbl="dokumen_hub";
    if(tab==="galeri")tbl="galeri_hub";
    if(tab==="lab")tbl="lab_komputer";
    const {error}=await supabase.from(tbl).delete().eq("id",id);
    if(error)showToast("❌ "+error.message);
    else{showToast("🗑️ Dihapus!");fetchAll();}
  }

  async function handleUpload(e:React.ChangeEvent<HTMLInputElement>, bucket:string, cb:(url:string)=>void){
    const file=e.target.files?.[0];if(!file)return;
    const ext=file.name.split('.').pop();
    const name=`${bucket}-${Date.now()}.${ext}`;
    const {error}=await supabase.storage.from(bucket).upload(name,file,{upsert:true});
    if(error){showToast("❌ Upload gagal: "+error.message);return;}
    const {data}=supabase.storage.from(bucket).getPublicUrl(name);
    cb(data.publicUrl);showToast("✅ File diupload!");
  }

  const IS:React.CSSProperties={width:"100%",padding:"12px 14px",borderRadius:10,border:"1.5px solid rgba(45,90,64,0.2)",fontSize:13,background:"#fafaf8",outline:"none",boxSizing:"border-box",fontFamily:"inherit"};

  const counts = {buku:books.length,video:videos.length,dokumen:docs.length,galeri:galeri.length,lab:labPCs.length};
  const currentList = tab==="buku"?books:tab==="video"?videos:tab==="dokumen"?docs:tab==="galeri"?galeri:labPCs;

  return (
    <div className="admin-page heroic-bg" style={{minHeight:"100vh",fontFamily:"'Segoe UI',system-ui,sans-serif"}}>
      {toast&&<div style={{position:"fixed",top:20,left:"50%",transform:"translateX(-50%)",background:"#2d5a40",color:"white",padding:"10px 24px",borderRadius:12,zIndex:999,fontSize:14,fontWeight:700,boxShadow:"0 4px 20px rgba(0,0,0,.15)"}}>{toast}</div>}

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

      {/* Stats */}
      <div style={{maxWidth:900,margin:"0 auto",padding:"20px 16px"}}>
        <div style={{display:"grid",gridTemplateColumns:"repeat(5,1fr)",gap:12,marginBottom:20}}>
          {TABS.map(t=>(
            <div key={t.key} style={{background:"white",borderRadius:14,padding:"14px 16px",border:`1.5px solid ${tab===t.key?"#2F8F4E":"rgba(45,90,64,0.1)"}`,textAlign:"center",cursor:"pointer",transition:"all .3s"}} onClick={()=>setTab(t.key)}>
              <div style={{fontSize:22,marginBottom:4}}>{t.icon}</div>
              <div style={{fontSize:22,fontWeight:900,color:"#1a2e1f"}}>{counts[t.key]}</div>
              <div style={{fontSize:10,color:"#7a9a7e",fontWeight:700,textTransform:"uppercase"}}>{t.label}</div>
            </div>
          ))}
        </div>

        {/* Tab buttons */}
        <div style={{display:"flex",gap:6,marginBottom:20,flexWrap:"wrap"}}>
          {TABS.map(t=>(
            <button key={t.key} onClick={()=>setTab(t.key)} style={{padding:"8px 16px",borderRadius:20,fontSize:12,fontWeight:700,border:"1.5px solid rgba(45,90,64,0.2)",cursor:"pointer",background:tab===t.key?"#2d5a40":"transparent",color:tab===t.key?"white":"#6b7c6d"}}>
              {t.icon} {t.label} ({counts[t.key]})
            </button>
          ))}
        </div>

        {/* List */}
        <div className="card-heroic" style={{padding:0,overflow:"hidden"}}>
          <div style={{padding:"16px 20px",borderBottom:"1px solid rgba(45,90,64,0.08)",display:"flex",justifyContent:"space-between",alignItems:"center"}}>
            <div style={{fontWeight:800,fontSize:14,color:"#1a2e1f"}}>{TABS.find(t=>t.key===tab)?.icon} Daftar {TABS.find(t=>t.key===tab)?.label} ({currentList.length})</div>
          </div>
          {currentList.length===0?(
            <div style={{padding:60,textAlign:"center",color:"#a8b5a9",fontWeight:600}}>Belum ada data. Klik &quot;+ Tambah Data&quot; untuk mulai.</div>
          ):(
            <div style={{maxHeight:500,overflowY:"auto"}}>
              {currentList.map(item=>(
                <div key={item.id} style={{padding:"14px 20px",borderBottom:"1px solid rgba(0,0,0,0.04)",display:"flex",alignItems:"center",gap:14}}>
                  <div style={{width:44,height:44,borderRadius:12,background:"rgba(47,143,78,0.08)",display:"flex",alignItems:"center",justifyContent:"center",fontSize:20,flexShrink:0}}>
                    {tab==="buku"?(item.icon||"📕"):tab==="video"?"▶️":tab==="dokumen"?"📄":tab==="galeri"?"🖼️":"🖥️"}
                  </div>
                  <div style={{flex:1,minWidth:0}}>
                    <div style={{fontSize:14,fontWeight:700,color:"#1a2e1f",whiteSpace:"nowrap",overflow:"hidden",textOverflow:"ellipsis"}}>
                      {tab==="lab"?`PC-${item.nomor_pc}`:item.judul}
                    </div>
                    <div style={{fontSize:12,color:"#7a9a7e",marginTop:2}}>
                      {tab==="buku"&&`${item.penulis||"—"} · ${item.kategori}`}
                      {tab==="video"&&`${item.kategori||"Umum"} · ${item.durasi||"—"}`}
                      {tab==="dokumen"&&`${item.tipe||"PDF"} · ${item.ukuran||"—"}`}
                      {tab==="galeri"&&(item.deskripsi||"—")}
                      {tab==="lab"&&(item.spesifikasi||"—")}
                    </div>
                  </div>
                  {(tab==="buku"||tab==="lab")&&(
                    <span style={{fontSize:10,fontWeight:800,padding:"4px 10px",borderRadius:99,background:item.status==="tersedia"?"rgba(47,143,78,0.1)":"rgba(220,53,69,0.08)",color:item.status==="tersedia"?"#2d5a40":"#8b2020"}}>{item.status}</span>
                  )}
                  <div style={{display:"flex",gap:6}}>
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
      {showModal&&(
        <div style={{position:"fixed",inset:0,background:"rgba(0,0,0,0.5)",display:"flex",alignItems:"center",justifyContent:"center",zIndex:50,padding:20}}>
          <div style={{background:"white",borderRadius:20,width:"100%",maxWidth:500,padding:28,maxHeight:"85vh",overflowY:"auto"}}>
            <h2 style={{margin:"0 0 20px",fontSize:20,fontWeight:800,color:"#1a2e1f"}}>{editId?"Edit":"Tambah"} {TABS.find(t=>t.key===tab)?.label}</h2>

            {tab==="buku"&&<div style={{display:"flex",flexDirection:"column",gap:14}}>
              <input style={IS} placeholder="Judul buku *" value={fBuku.judul} onChange={e=>setFBuku({...fBuku,judul:e.target.value})}/>
              <input style={IS} placeholder="Penulis" value={fBuku.penulis} onChange={e=>setFBuku({...fBuku,penulis:e.target.value})}/>
              <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:10}}>
                <input style={IS} placeholder="Icon emoji" value={fBuku.icon} onChange={e=>setFBuku({...fBuku,icon:e.target.value})}/>
                <select style={IS} value={fBuku.kategori} onChange={e=>setFBuku({...fBuku,kategori:e.target.value})}>
                  {["umum","agama","teknologi","pertanian","anak","novel","bisnis"].map(k=><option key={k} value={k}>{k}</option>)}
                </select>
              </div>
              <select style={IS} value={fBuku.status} onChange={e=>setFBuku({...fBuku,status:e.target.value})}>
                <option value="tersedia">Tersedia</option><option value="dipinjam">Dipinjam</option>
              </select>
              <textarea style={{...IS,minHeight:80}} placeholder="Deskripsi" value={fBuku.deskripsi} onChange={e=>setFBuku({...fBuku,deskripsi:e.target.value})}/>
            </div>}

            {tab==="video"&&<div style={{display:"flex",flexDirection:"column",gap:14}}>
              <input style={IS} placeholder="Judul video *" value={fVideo.judul} onChange={e=>setFVideo({...fVideo,judul:e.target.value})}/>
              <input style={IS} placeholder="URL YouTube/link *" value={fVideo.url} onChange={e=>setFVideo({...fVideo,url:e.target.value})}/>
              <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:10}}>
                <select style={IS} value={fVideo.kategori} onChange={e=>setFVideo({...fVideo,kategori:e.target.value})}>
                  {["umum","umkm","pertanian","teknologi","koding","kesehatan"].map(k=><option key={k}>{k}</option>)}
                </select>
                <input style={IS} placeholder="Durasi (cth: 10:30)" value={fVideo.durasi} onChange={e=>setFVideo({...fVideo,durasi:e.target.value})}/>
              </div>
              <textarea style={{...IS,minHeight:80}} placeholder="Deskripsi" value={fVideo.deskripsi} onChange={e=>setFVideo({...fVideo,deskripsi:e.target.value})}/>
            </div>}

            {tab==="dokumen"&&<div style={{display:"flex",flexDirection:"column",gap:14}}>
              <input style={IS} placeholder="Judul dokumen *" value={fDok.judul} onChange={e=>setFDok({...fDok,judul:e.target.value})}/>
              <input style={IS} placeholder="URL file / Google Drive *" value={fDok.url} onChange={e=>setFDok({...fDok,url:e.target.value})}/>
              <div style={{fontSize:12,color:"#7a9a7e",fontWeight:600}}>Atau upload langsung:</div>
              <input type="file" accept=".pdf,.doc,.docx,.ppt,.pptx,.xls,.xlsx" onChange={e=>handleUpload(e,"dokumen-hub",url=>setFDok({...fDok,url}))} style={{fontSize:12}}/>
              <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:10}}>
                <select style={IS} value={fDok.tipe} onChange={e=>setFDok({...fDok,tipe:e.target.value})}>
                  {["PDF","DOC","PPT","XLS","Lainnya"].map(k=><option key={k}>{k}</option>)}
                </select>
                <input style={IS} placeholder="Ukuran (cth: 2.5 MB)" value={fDok.ukuran} onChange={e=>setFDok({...fDok,ukuran:e.target.value})}/>
              </div>
              <textarea style={{...IS,minHeight:80}} placeholder="Deskripsi" value={fDok.deskripsi} onChange={e=>setFDok({...fDok,deskripsi:e.target.value})}/>
            </div>}

            {tab==="galeri"&&<div style={{display:"flex",flexDirection:"column",gap:14}}>
              <input style={IS} placeholder="Judul foto" value={fGaleri.judul} onChange={e=>setFGaleri({...fGaleri,judul:e.target.value})}/>
              <input style={IS} placeholder="URL foto *" value={fGaleri.url} onChange={e=>setFGaleri({...fGaleri,url:e.target.value})}/>
              <div style={{fontSize:12,color:"#7a9a7e",fontWeight:600}}>Atau upload langsung:</div>
              <input type="file" accept="image/*" onChange={e=>handleUpload(e,"galeri-hub",url=>setFGaleri({...fGaleri,url}))} style={{fontSize:12}}/>
              {fGaleri.url&&<img src={fGaleri.url} alt="" style={{maxHeight:180,borderRadius:12,objectFit:"cover"}}/>}
              <textarea style={{...IS,minHeight:80}} placeholder="Deskripsi" value={fGaleri.deskripsi} onChange={e=>setFGaleri({...fGaleri,deskripsi:e.target.value})}/>
            </div>}

            {tab==="lab"&&<div style={{display:"flex",flexDirection:"column",gap:14}}>
              <input type="number" style={IS} placeholder="Nomor PC *" value={fLab.nomor_pc} onChange={e=>setFLab({...fLab,nomor_pc:e.target.value})}/>
              <select style={IS} value={fLab.status} onChange={e=>setFLab({...fLab,status:e.target.value})}>
                <option value="tersedia">Tersedia</option><option value="dipakai">Dipakai</option><option value="maintenance">Maintenance</option>
              </select>
              <textarea style={{...IS,minHeight:80}} placeholder="Spesifikasi (cth: i5 Gen12, 8GB RAM)" value={fLab.spesifikasi} onChange={e=>setFLab({...fLab,spesifikasi:e.target.value})}/>
            </div>}

            <div style={{display:"flex",gap:12,marginTop:24}}>
              <button onClick={()=>{setShowModal(false);setEditId(null);}} style={{flex:1,padding:14,borderRadius:12,border:"1px solid #ddd",background:"white",fontSize:13,fontWeight:600,cursor:"pointer"}}>Batal</button>
              <button onClick={handleSave} disabled={loading} className="btn-heroic" style={{flex:2}}>{loading?"Menyimpan...":"💾 Simpan"}</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
