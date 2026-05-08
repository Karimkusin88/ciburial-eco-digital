"use client";
import { useState, useEffect } from "react";
import { 
  ArrowLeft, Users, RefreshCcw, Plus, X, Home, User, Smartphone, CreditCard, 
  CheckCircle, Trash2, Edit2, Baby, Heart, Info, AlertCircle, Save, 
  Building, Swords, Store, ShoppingCart, Wheat, Hammer, Anchor, Book, 
  GraduationCap, FileText, PenTool, UserCheck, Smile, UserPlus, Coins
} from "lucide-react";
import "../admin-styles-heroic.css";
import { supabase, isSupabaseReady } from "@/lib/supabase";

interface KK { id:string; no_kk:string; kepala_keluarga:string; alamat:string; rt:string; rw:string; no_wa:string; nfc_id:string; status:string; golongan_zakat:string; kategori_mustahiq:string; pekerjaan_kepala:string; tgl_lahir_kepala:string; }
interface Anggota { id:string; kk_id:string; nama:string; nik:string; tgl_lahir:string; jenis_kelamin:string; hubungan:string; no_wa:string; pekerjaan:string; saldo_poin:number; nfc_id:string; golongan_zakat:string; kategori_mustahiq:string; }

const PEKERJAAN = [
  {v:"pns",l:"🏛️ PNS / ASN"},{v:"tni_polri",l:"⚔️ TNI / Polri"},
  {v:"wiraswasta",l:"🏪 Wiraswasta"},{v:"pedagang",l:"🛒 Pedagang"},
  {v:"petani",l:"🌾 Petani"},{v:"buruh",l:"🔨 Buruh"},
  {v:"nelayan",l:"🎣 Nelayan"},{v:"guru_honorer",l:"📚 Guru Honorer"},
  {v:"ibu_rumah_tangga",l:"🏠 Ibu Rumah Tangga"},
  {v:"pelajar",l:"🎓 Pelajar"},{v:"tidak_bekerja",l:"— Tidak Bekerja"},{v:"lainnya",l:"📝 Lainnya"},
];
const HUBUNGAN = [
  {v:"kepala",l:"👨 Kepala Keluarga"},{v:"istri",l:"👩 Istri"},
  {v:"anak",l:"👦 Anak"},{v:"cucu",l:"👶 Cucu"},
  {v:"orang_tua",l:"👴 Orang Tua"},{v:"mertua",l:"👵 Mertua"},
  {v:"saudara",l:"🧑 Saudara"},{v:"lainnya",l:"👤 Lainnya"},
];
const GOLONGAN_ZAKAT = [
  {v:"muzakki",l:"✅ Muzakki (Wajib Bayar)",c:"#2d5a40"},
  {v:"mustahiq",l:"🤲 Mustahiq (Berhak Terima)",c:"#b8943f"},
  {v:"amil",l:"🕌 Amil (Pengurus)",c:"#1a3a6b"},
  {v:"netral",l:"— Netral / Belum Dikaji",c:"#9a8c85"},
];
const KATEGORI_MUSTAHIQ = [
  {v:"fakir",l:"Fakir — Tidak punya apa-apa"},
  {v:"miskin",l:"Miskin — Punya tapi kurang"},
  {v:"amil",l:"Amil — Pengurus zakat"},
  {v:"muallaf",l:"Muallaf — Baru masuk Islam"},
  {v:"gharimin",l:"Gharimin — Terlilit hutang"},
  {v:"fisabilillah",l:"Fisabilillah — Di jalan Allah"},
  {v:"ibnu_sabil",l:"Ibnu Sabil — Musafir terlantar"},
];

const emptyKK = {no_kk:"",kepala_keluarga:"",alamat:"",rt:"01",rw:"01",no_wa:"",nfc_id:"",status:"tetap",golongan_zakat:"netral",kategori_mustahiq:"",pekerjaan_kepala:"tidak_bekerja",tgl_lahir_kepala:""};
const emptyAnggota = {kk_id:"",nama:"",nik:"",tgl_lahir:"",jenis_kelamin:"L",hubungan:"anak",no_wa:"",pekerjaan:"tidak_bekerja",nfc_id:"",golongan_zakat:"netral",kategori_mustahiq:""};

function hitungUmur(tgl:string){if(!tgl)return"";const now=new Date(),lahir=new Date(tgl),bulan=(now.getFullYear()-lahir.getFullYear())*12+(now.getMonth()-lahir.getMonth());return bulan<24?`${bulan} bln`:`${Math.floor(bulan/12)} thn`;}
function isBalita(tgl:string){if(!tgl)return false;const bulan=(new Date().getFullYear()-new Date(tgl).getFullYear())*12+(new Date().getMonth()-new Date(tgl).getMonth());return bulan<=60;}

const SC:Record<string,string>={tetap:"#2d5a40",pendatang:"#b8943f",perantau:"#1a3a6b"};
const GC:Record<string,string>={muzakki:"#2d5a40",mustahiq:"#b8943f",amil:"#1a3a6b",netral:"#9a8c85"};
const HI:Record<string,React.ReactNode>={
  kepala:<User size={20}/>,
  istri:<UserCheck size={20}/>,
  anak:<Smile size={20}/>,
  cucu:<Baby size={20}/>,
  orang_tua:<User size={20}/>,
  mertua:<UserCheck size={20}/>,
  saudara:<Users size={20}/>,
  lainnya:<UserPlus size={20}/>
};
const LS={fontSize:11,fontWeight:700 as const,color:"#6b7c6d",letterSpacing:"0.06em",textTransform:"uppercase" as const,display:"block",marginBottom:4};
const IS={width:"100%",padding:"9px 12px",borderRadius:10,border:"1.5px solid rgba(45,90,64,0.2)",fontSize:13,background:"#fafaf8",outline:"none",boxSizing:"border-box" as const,fontFamily:"inherit"};

export default function AdminWargaPage(){
  const[kkList,setKkList]=useState<KK[]>([]);
  const[anggotaMap,setAnggotaMap]=useState<Record<string,Anggota[]>>({});
  const[formKK,setFormKK]=useState(emptyKK);
  const[formAnggota,setFormAnggota]=useState(emptyAnggota);
  const[editKKId,setEditKKId]=useState<string|null>(null);
  const[editAnggotaId,setEditAnggotaId]=useState<string|null>(null);
  const[activeKK,setActiveKK]=useState<string|null>(null);
  const[showFormKK,setShowFormKK]=useState(false);
  const[showFormAnggota,setShowFormAnggota]=useState(false);
  const[loading,setLoading]=useState(false);
  const[search,setSearch]=useState("");
  const[toast,setToast]=useState({msg:"",ok:true});

  function showToast(msg:string,ok=true){setToast({msg,ok});setTimeout(()=>setToast({msg:"",ok:true}),3500);}

  async function fetchAll(){
    if(!isSupabaseReady())return;
    const[kk,ang]=await Promise.all([
      supabase.from("keluarga").select("*").order("rt").order("kepala_keluarga"),
      supabase.from("anggota_kk").select("*").order("hubungan").order("nama"),
    ]);
    if(kk.data)setKkList(kk.data as KK[]);
    if(ang.data){
      const map:Record<string,Anggota[]>={};
      (ang.data as Anggota[]).forEach(a=>{if(!map[a.kk_id])map[a.kk_id]=[];map[a.kk_id].push(a);});
      setAnggotaMap(map);
    }
  }
  useEffect(()=>{fetchAll();},[]);

  async function simpanKK(){
    if(!formKK.no_kk||!formKK.kepala_keluarga)return showToast("❌ No KK & nama wajib!",false);
    setLoading(true);

    if(editKKId){
      // Update KK existing
      const{error}=await supabase.from("keluarga").update(formKK).eq("id",editKKId);
      if(error){showToast(`❌ ${error.message}`,false);setLoading(false);return;}
      // Update anggota kepala juga kalau ada
      await supabase.from("anggota_kk").update({
        nama:formKK.kepala_keluarga,
        no_wa:formKK.no_wa||null,
        pekerjaan:formKK.pekerjaan_kepala||"tidak_bekerja",
        tgl_lahir:formKK.tgl_lahir_kepala||null,
        nfc_id:formKK.nfc_id||null,
      }).eq("kk_id",editKKId).eq("hubungan","kepala");
      showToast("✅ KK diupdate!");
    } else {
      // Insert KK baru
      const{data:kkBaru,error}=await supabase.from("keluarga").insert(formKK).select().single();
      if(error){showToast(`❌ ${error.message}`,false);setLoading(false);return;}
      // Auto-insert kepala keluarga ke tabel anggota_kk
      await supabase.from("anggota_kk").insert({
        kk_id: kkBaru.id,
        nama: formKK.kepala_keluarga,
        hubungan: "kepala",
        jenis_kelamin: "L",
        no_wa: formKK.no_wa||null,
        pekerjaan: formKK.pekerjaan_kepala||"tidak_bekerja",
        tgl_lahir: formKK.tgl_lahir_kepala||null,
        nfc_id: formKK.nfc_id||null,
        saldo_poin: 0,
        golongan_zakat: formKK.golongan_zakat||"netral",
      });
      showToast("✅ KK ditambahkan! Kepala KK otomatis masuk daftar anggota.");
    }

    setFormKK(emptyKK);setEditKKId(null);setShowFormKK(false);
    setLoading(false);fetchAll();
  }

  async function hapusKK(id:string){
    if(!confirm("Hapus KK ini beserta semua anggotanya?"))return;
    await supabase.from("anggota_kk").delete().eq("kk_id",id);
    await supabase.from("keluarga").delete().eq("id",id);
    showToast("🗑️ KK dihapus");if(activeKK===id)setActiveKK(null);fetchAll();
  }

  function editKK(kk:KK){
    setFormKK({no_kk:kk.no_kk,kepala_keluarga:kk.kepala_keluarga,alamat:kk.alamat||"",rt:kk.rt,rw:kk.rw,no_wa:kk.no_wa||"",nfc_id:kk.nfc_id||"",status:kk.status,golongan_zakat:kk.golongan_zakat||"netral",kategori_mustahiq:kk.kategori_mustahiq||"",pekerjaan_kepala:kk.pekerjaan_kepala||"tidak_bekerja",tgl_lahir_kepala:kk.tgl_lahir_kepala||""});
    setEditKKId(kk.id);setShowFormKK(true);window.scrollTo({top:0,behavior:"smooth"});
  }

  async function simpanAnggota(){
    if(!formAnggota.nama)return showToast("❌ Nama anggota wajib!",false);
    const kkId=formAnggota.kk_id||activeKK;
    if(!kkId)return showToast("❌ Pilih KK dulu!",false);
    setLoading(true);
    const payload={...formAnggota,kk_id:kkId};
    const{error}=editAnggotaId
      ?await supabase.from("anggota_kk").update(payload).eq("id",editAnggotaId)
      :await supabase.from("anggota_kk").insert(payload);
    if(error)showToast(`❌ ${error.message}`,false);
    else{
      if(!editAnggotaId&&isBalita(formAnggota.tgl_lahir)&&formAnggota.hubungan==="anak"){
        const ibu=anggotaMap[kkId||""]?.find(a=>a.hubungan==="istri");
        await supabase.from("anak_posyandu").insert({kk_id:kkId,nama:formAnggota.nama,tgl_lahir:formAnggota.tgl_lahir,jenis_kelamin:formAnggota.jenis_kelamin,nama_ibu:ibu?.nama||"-",no_wa_ibu:ibu?.no_wa||null});
        showToast("✅ Tersimpan + otomatis terdaftar Posyandu! 👶");
      }else showToast(editAnggotaId?"✅ Anggota diupdate!":"✅ Anggota ditambahkan!");
      setFormAnggota(emptyAnggota);setEditAnggotaId(null);setShowFormAnggota(false);
    }
    setLoading(false);fetchAll();
  }

  function editAnggota(a:Anggota){
    setFormAnggota({kk_id:a.kk_id,nama:a.nama,nik:a.nik||"",tgl_lahir:a.tgl_lahir||"",jenis_kelamin:a.jenis_kelamin||"L",hubungan:a.hubungan||"anak",no_wa:a.no_wa||"",pekerjaan:a.pekerjaan||"tidak_bekerja",nfc_id:a.nfc_id||"",golongan_zakat:a.golongan_zakat||"netral",kategori_mustahiq:a.kategori_mustahiq||""});
    setEditAnggotaId(a.id);setShowFormAnggota(true);
  }

  async function hapusAnggota(id:string){
    if(!confirm("Hapus anggota ini?"))return;
    await supabase.from("anggota_kk").delete().eq("id",id);
    showToast("🗑️ Anggota dihapus");fetchAll();
  }

  // Sinkronisasi: cari KK yang belum punya kepala di anggota_kk, lalu insert
  async function sinkronisasiKepala(){
    if(!confirm(`Sinkronisasi kepala KK?\n\nFitur ini akan menambahkan entri kepala ke tabel anggota_kk untuk KK yang belum memilikinya (data lama).\n\nLanjutkan?`))return;
    setLoading(true);
    let ditambahkan=0;
    for(const kk of kkList){
      const sudahAda=(anggotaMap[kk.id]||[]).some(a=>a.hubungan==="kepala");
      if(!sudahAda){
        await supabase.from("anggota_kk").insert({
          kk_id: kk.id,
          nama: kk.kepala_keluarga,
          hubungan: "kepala",
          jenis_kelamin: "L",
          no_wa: kk.no_wa||null,
          pekerjaan: kk.pekerjaan_kepala||"tidak_bekerja",
          tgl_lahir: kk.tgl_lahir_kepala||null,
          nfc_id: kk.nfc_id||null,
          saldo_poin: 0,
          golongan_zakat: kk.golongan_zakat||"netral",
        });
        ditambahkan++;
      }
    }
    setLoading(false);
    if(ditambahkan>0){
      showToast(`✅ ${ditambahkan} kepala KK berhasil disinkronisasi ke anggota!`);
      fetchAll();
    } else {
      showToast(`✔️ Semua KK sudah punya kepala. Tidak ada yang perlu disinkronisasi.`);
    }
  }

  const filtered=kkList.filter(k=>k.kepala_keluarga.toLowerCase().includes(search.toLowerCase())||k.no_kk.includes(search)||k.rt.includes(search));
  const activeKKData=kkList.find(k=>k.id===activeKK);
  const activeAnggota=activeKK?(anggotaMap[activeKK]||[]):[];

  return(
    <div className="admin-page heroic-bg" style={{ minHeight: "100vh", fontFamily: "'Segoe UI', system-ui, sans-serif" }}>
      {toast.msg&&<div style={{position:"fixed",top:20,left:"50%",transform:"translateX(-50%)",background:toast.ok?"#2d5a40":"#dc3545",color:"white",padding:"10px 20px",borderRadius:12,zIndex:999,fontSize:14,boxShadow:"0 4px 20px rgba(0,0,0,0.15)",maxWidth:"85vw",textAlign:"center"}}>{toast.msg}</div>}

      <header style={{background:"#f5f0e8",borderBottom:"1px solid rgba(45,90,64,0.12)",padding:"14px 20px",position:"sticky",top:0,zIndex:10,display:"flex",alignItems:"center",justifyContent:"space-between"}}>
        <div style={{display:"flex",alignItems:"center",gap:12}}>
          <a href="/admin" style={{color:"#6b7c6d",textDecoration:"none",fontSize:13,display:"flex",alignItems:"center",gap:4}}><ArrowLeft size={14}/> Admin</a>
          <span style={{color:"#c8bfaa"}}>|</span>
          <div>
            <div style={{fontWeight:800,fontSize:15,color:"#1a2e1f",display:"flex",alignItems:"center",gap:6}}><Users size={18}/> Data Warga</div>
            <div style={{fontSize:10,color:"#7a9a7e",textTransform:"uppercase",letterSpacing:"0.08em"}}>{kkList.length} KK · {Object.values(anggotaMap).flat().length} Jiwa</div>
          </div>
        </div>
        <div style={{display:"flex",gap:8,alignItems:"center"}}>
          {/* Tombol sinkronisasi — tampil jika ada KK yang belum punya kepala di anggota_kk */}
          {kkList.some(k=>!(anggotaMap[k.id]||[]).some(a=>a.hubungan==="kepala"))&&(
            <button onClick={sinkronisasiKepala} disabled={loading}
              style={{background:"#b8943f",color:"white",border:"none",borderRadius:10,padding:"8px 14px",fontSize:12,fontWeight:700,cursor:loading?"not-allowed":"pointer",display:"flex",alignItems:"center",gap:6}}>
              <RefreshCcw size={14} className={loading?"animate-spin":""} /> Sinkronisasi Kepala KK
              <span style={{background:"rgba(255,255,255,0.25)",borderRadius:99,padding:"1px 7px",fontSize:11}}>
                {kkList.filter(k=>!(anggotaMap[k.id]||[]).some(a=>a.hubungan==="kepala")).length}
              </span>
            </button>
          )}
          <button onClick={()=>{setFormKK(emptyKK);setEditKKId(null);setShowFormKK(!showFormKK);setActiveKK(null);}} style={{background:"#2d5a40",color:"white",border:"none",borderRadius:10,padding:"8px 16px",fontSize:13,fontWeight:600,cursor:"pointer",display:"flex",alignItems:"center",gap:6}}>
            {showFormKK ? <><X size={16}/> Tutup</> : <><Plus size={16}/> Tambah KK</>}
          </button>
        </div>
      </header>

      <div style={{maxWidth:1000,margin:"0 auto",padding:"20px 16px"}}>

        {/* Form KK */}
        {showFormKK&&(
          <div className="card-heroic">
            <h3 style={{margin:"0 0 16px",color:"#1a2e1f",fontSize:15,display:"flex",alignItems:"center",gap:8}}>{editKKId ? <><Edit2 size={16}/> Edit KK</> : <><Plus size={16}/> Tambah KK Baru</>}</h3>
            <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:12}}>
              {[{label:"No. KK *",key:"no_kk",ph:"3204xxxxxxxxxxxx"},{label:"Kepala Keluarga *",key:"kepala_keluarga",ph:"Nama lengkap"},{label:"No. WhatsApp",key:"no_wa",ph:"08xxxxxxxxxx"},{label:"NFC Card ID",key:"nfc_id",ph:"ID chip NFC"}].map(f=>(
                <div key={f.key}><label style={LS}>{f.label}</label><input value={(formKK as any)[f.key]} onChange={e=>setFormKK({...formKK,[f.key]:e.target.value})} placeholder={f.ph} style={IS}/></div>
              ))}
              <div style={{gridColumn:"1/-1"}}><label style={LS}>Alamat</label><input value={formKK.alamat} onChange={e=>setFormKK({...formKK,alamat:e.target.value})} placeholder="Alamat lengkap" style={IS}/></div>
              <div><label style={LS}>RT</label><select value={formKK.rt} onChange={e=>setFormKK({...formKK,rt:e.target.value})} style={IS}>{["01","02","03","04","05"].map(v=><option key={v} value={v}>RT {v}</option>)}</select></div>
              <div><label style={LS}>Status</label><select value={formKK.status} onChange={e=>setFormKK({...formKK,status:e.target.value})} style={IS}><option value="tetap">Warga Tetap</option><option value="pendatang">Pendatang</option><option value="perantau">Perantau</option></select></div>
              <div><label style={LS}>Pekerjaan Kepala KK</label><select value={formKK.pekerjaan_kepala} onChange={e=>setFormKK({...formKK,pekerjaan_kepala:e.target.value})} style={IS}>{PEKERJAAN.map(p=><option key={p.v} value={p.v}>{p.l}</option>)}</select></div>
              <div><label style={LS}>Tgl Lahir Kepala KK</label><input type="date" value={formKK.tgl_lahir_kepala} onChange={e=>setFormKK({...formKK,tgl_lahir_kepala:e.target.value})} style={IS}/></div>
              <div><label style={LS}>Golongan Zakat</label><select value={formKK.golongan_zakat} onChange={e=>setFormKK({...formKK,golongan_zakat:e.target.value})} style={IS}>{GOLONGAN_ZAKAT.map(g=><option key={g.v} value={g.v}>{g.l}</option>)}</select></div>
              {/* Auto-suggest hint */}
              {formKK.pekerjaan_kepala&&["pns","tni_polri","wiraswasta"].includes(formKK.pekerjaan_kepala)&&formKK.golongan_zakat==="netral"&&(
                <div style={{gridColumn:"1/-1",padding:"8px 12px",background:"rgba(45,90,64,0.07)",borderRadius:10,fontSize:12,color:"#2d5a40",display:"flex",alignItems:"center",gap:8}}>
                  <Info size={16} /> <div><strong>Saran:</strong> Pekerjaan {PEKERJAAN.find(p=>p.v===formKK.pekerjaan_kepala)?.l} biasanya termasuk <strong>Muzakki</strong> (wajib bayar zakat).</div>
                </div>
              )}
              {formKK.pekerjaan_kepala&&["buruh","petani","tidak_bekerja","nelayan","guru_honorer"].includes(formKK.pekerjaan_kepala)&&formKK.golongan_zakat==="netral"&&(
                <div style={{gridColumn:"1/-1",padding:"8px 12px",background:"rgba(184,148,63,0.08)",borderRadius:10,fontSize:12,color:"#b8943f",display:"flex",alignItems:"center",gap:8}}>
                  <Info size={16} /> <div><strong>Saran:</strong> Pekerjaan {PEKERJAAN.find(p=>p.v===formKK.pekerjaan_kepala)?.l} perlu dikaji — kemungkinan termasuk <strong>Mustahiq</strong>.</div>
                </div>
              )}
              {formKK.golongan_zakat==="mustahiq"&&<div><label style={LS}>Kategori Mustahiq</label><select value={formKK.kategori_mustahiq} onChange={e=>setFormKK({...formKK,kategori_mustahiq:e.target.value})} style={IS}><option value="">-- Pilih --</option>{KATEGORI_MUSTAHIQ.map(k=><option key={k.v} value={k.v}>{k.l}</option>)}</select></div>}
            </div>
            <div style={{display:"flex",gap:10,marginTop:16}}>
              <button onClick={simpanKK} disabled={loading} className="btn-heroic" style={{display:"flex",alignItems:"center",gap:8}}>
                <Save size={18}/> {loading ? "Menyimpan..." : editKKId ? "Update" : "Simpan"}
              </button>
              <button onClick={()=>{setShowFormKK(false);setFormKK(emptyKK);setEditKKId(null);}} style={{padding:"10px 20px",background:"transparent",border:"1.5px solid rgba(45,90,64,0.2)",borderRadius:10,fontSize:14,color:"#6b7c6d",cursor:"pointer"}}>Batal</button>
            </div>
          </div>
        )}

        {/* Stats */}
        <div style={{display:"grid",gridTemplateColumns:"repeat(4,1fr)",gap:12,marginBottom:20}}>
          {[
            {i:<Home size={20}/>,v:kkList.length,l:"Total KK",c:"#2d5a40"},
            {i:<Users size={20}/>,v:Object.values(anggotaMap).flat().length,l:"Total Jiwa",c:"#2d5a40"},
            {i:<CheckCircle size={20}/>,v:kkList.filter(k=>k.golongan_zakat==="muzakki").length,l:"Muzakki",c:"#2d5a40"},
            {i:<Heart size={20}/>,v:kkList.filter(k=>k.golongan_zakat==="mustahiq").length,l:"Mustahiq",c:"#b8943f"}
          ].map(s=>(
            <div key={s.l} style={{background:"white",borderRadius:14,padding:"14px 16px",border:"1px solid rgba(45,90,64,0.1)",boxShadow:"0 1px 6px rgba(0,0,0,0.04)"}}>
              <div style={{color: s.c, marginBottom:4}}>{s.i}</div>
              <div style={{fontSize:22,fontWeight:900,color:s.c}}>{s.v}</div>
              <div style={{fontSize:11,color:"#7a9a7e",textTransform:"uppercase",letterSpacing:"0.06em"}}>{s.l}</div>
            </div>
          ))}
        </div>

        {/* Search */}
        <input value={search} onChange={e=>setSearch(e.target.value)} placeholder="🔍 Cari nama, No.KK, atau RT..."
          style={{width:"100%",padding:"11px 16px",borderRadius:12,border:"1.5px solid rgba(45,90,64,0.2)",fontSize:14,background:"white",outline:"none",marginBottom:16,boxSizing:"border-box"}}/>

        <div style={{display:"grid",gridTemplateColumns:activeKK?"1fr 1.4fr":"1fr",gap:16}}>

          {/* List KK */}
          <div className="card-heroic">
            {filtered.length===0?(
              <div style={{padding:40,textAlign:"center",color:"#a8b5a9"}}>{search?"Tidak ada hasil":"Belum ada data warga"}</div>
            ):filtered.map((kk,i)=>{
              const jml=(anggotaMap[kk.id]||[]).length;
              const gc=GC[kk.golongan_zakat]||"#9a8c85";
              return(
                <div key={kk.id} onClick={()=>setActiveKK(kk.id===activeKK?null:kk.id)}
                  style={{padding:"14px 18px",borderBottom:i<filtered.length-1?"1px solid rgba(45,90,64,0.07)":"none",cursor:"pointer",background:activeKK===kk.id?"rgba(45,90,64,0.05)":"transparent",display:"flex",alignItems:"center",gap:12}}>
                  <div style={{width:40,height:40,borderRadius:12,background:"rgba(45,90,64,0.08)",display:"flex",alignItems:"center",justifyContent:"center",fontSize:18,flexShrink:0,color:"#2d5a40"}}><Home size={20}/></div>
                  <div style={{flex:1}}>
                    <div style={{fontWeight:700,fontSize:14,color:"#1a2e1f"}}>{kk.kepala_keluarga}</div>
                    <div style={{fontSize:12,color:"#7a9a7e",marginTop:2,display:"flex",alignItems:"center",gap:4}}>
                      RT {kk.rt} · {jml} jiwa {kk.no_wa&&<Smartphone size={12}/>} {kk.nfc_id&&<CreditCard size={12}/>}
                    </div>
                    {kk.pekerjaan_kepala&&kk.pekerjaan_kepala!=="tidak_bekerja"&&<div style={{fontSize:11,color:"#a8b5a9"}}>{PEKERJAAN.find(p=>p.v===kk.pekerjaan_kepala)?.l||kk.pekerjaan_kepala}</div>}
                  </div>
                  <div style={{display:"flex",flexDirection:"column",alignItems:"flex-end",gap:4}}>
                    <div style={{background:SC[kk.status]+"15",color:SC[kk.status],border:`1px solid ${SC[kk.status]}30`,borderRadius:20,padding:"2px 8px",fontSize:10,fontWeight:600}}>{kk.status}</div>
                    {kk.golongan_zakat!=="netral"&&<div style={{background:gc+"15",color:gc,border:`1px solid ${gc}30`,borderRadius:20,padding:"2px 8px",fontSize:10,fontWeight:600}}>{kk.golongan_zakat}</div>}
                  </div>
                  <div style={{display:"flex",gap:4}}>
                    <button onClick={e=>{e.stopPropagation();editKK(kk);}} style={{background:"rgba(45,90,64,0.08)",border:"none",borderRadius:8,padding:"6px 8px",cursor:"pointer",fontSize:13,color:"#2d5a40"}}><Edit2 size={14}/></button>
                    <button onClick={e=>{e.stopPropagation();hapusKK(kk.id);}} style={{background:"rgba(220,53,69,0.08)",border:"none",borderRadius:8,padding:"6px 8px",cursor:"pointer",fontSize:13,color:"#dc3545"}}><Trash2 size={14}/></button>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Detail KK + Anggota */}
          {activeKK&&activeKKData&&(
            <div>
              <div style={{background:"#2d5a40",borderRadius:16,padding:"16px 20px",marginBottom:12,color:"white"}}>
                <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start"}}>
                  <div>
                    <div style={{fontSize:11,opacity:0.7,textTransform:"uppercase",letterSpacing:"0.08em",marginBottom:4}}>Kepala Keluarga</div>
                    <div style={{fontWeight:800,fontSize:18}}>{activeKKData.kepala_keluarga}</div>
                    <div style={{fontSize:12,opacity:0.75,marginTop:4}}>RT {activeKKData.rt} · {activeKKData.no_kk}</div>
                    {activeKKData.no_wa&&<div style={{fontSize:12,opacity:0.75,display:"flex",alignItems:"center",gap:6}}><Smartphone size={12}/> {activeKKData.no_wa}</div>}
                    {activeKKData.nfc_id&&<div style={{fontSize:12,opacity:0.75,display:"flex",alignItems:"center",gap:6}}><CreditCard size={12}/> NFC: {activeKKData.nfc_id}</div>}
                    <div style={{fontSize:11,opacity:0.6,marginTop:4,display:"flex",alignItems:"center",gap:6}}><Heart size={12}/> {GOLONGAN_ZAKAT.find(g=>g.v===activeKKData.golongan_zakat)?.l||"—"}</div>
                  </div>
                  <button onClick={()=>{setFormAnggota({...emptyAnggota,kk_id:activeKK});setEditAnggotaId(null);setShowFormAnggota(!showFormAnggota);}}
                    style={{background:"rgba(255,255,255,0.2)",border:"1px solid rgba(255,255,255,0.3)",borderRadius:10,padding:"8px 14px",color:"white",cursor:"pointer",fontSize:13,fontWeight:600,display:"flex",alignItems:"center",gap:6}}>
                    {showFormAnggota ? <><X size={14}/> Batal</> : <><Plus size={14}/> Tambah Anggota</>}
                  </button>
                </div>
              </div>

              {/* Form Anggota */}
              {showFormAnggota&&(
                <div className="card-heroic">
                  <h4 style={{margin:"0 0 14px",color:"#1a2e1f",fontSize:14}}>{editAnggotaId?"✏️ Edit Anggota":"➕ Tambah Anggota"}</h4>
                  <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:10}}>
                    <div style={{gridColumn:"1/-1"}}><label style={LS}>Nama Lengkap *</label><input value={formAnggota.nama} onChange={e=>setFormAnggota({...formAnggota,nama:e.target.value})} placeholder="Nama lengkap" style={IS}/></div>
                    <div><label style={LS}>NIK</label><input value={formAnggota.nik} onChange={e=>setFormAnggota({...formAnggota,nik:e.target.value})} placeholder="3204xxxxxxxxxxxxxxxx" style={IS}/></div>
                    <div><label style={LS}>No. WhatsApp</label><input value={formAnggota.no_wa} onChange={e=>setFormAnggota({...formAnggota,no_wa:e.target.value})} placeholder="08xxxxxxxxxx" style={IS}/></div>
                    <div><label style={LS}>Tanggal Lahir</label><input type="date" value={formAnggota.tgl_lahir} onChange={e=>setFormAnggota({...formAnggota,tgl_lahir:e.target.value})} style={IS}/></div>
                    <div><label style={LS}>Hubungan</label><select value={formAnggota.hubungan} onChange={e=>setFormAnggota({...formAnggota,hubungan:e.target.value})} style={IS}>{HUBUNGAN.map(h=><option key={h.v} value={h.v}>{h.l}</option>)}</select></div>
                    <div><label style={LS}>Jenis Kelamin</label><select value={formAnggota.jenis_kelamin} onChange={e=>setFormAnggota({...formAnggota,jenis_kelamin:e.target.value})} style={IS}><option value="L">Laki-laki</option><option value="P">Perempuan</option></select></div>
                    <div><label style={LS}>Pekerjaan</label><select value={formAnggota.pekerjaan} onChange={e=>setFormAnggota({...formAnggota,pekerjaan:e.target.value})} style={IS}>{PEKERJAAN.map(p=><option key={p.v} value={p.v}>{p.l}</option>)}</select></div>
                    <div><label style={LS}>NFC Card ID</label><input value={formAnggota.nfc_id} onChange={e=>setFormAnggota({...formAnggota,nfc_id:e.target.value})} placeholder="ID chip NFC" style={IS}/></div>
                  </div>
                  {formAnggota.tgl_lahir&&isBalita(formAnggota.tgl_lahir)&&formAnggota.hubungan==="anak"&&(
                    <div style={{marginTop:10,padding:"10px 14px",background:"rgba(45,90,64,0.08)",borderRadius:10,fontSize:13,color:"#2d5a40"}}>
                      👶 <strong>Balita terdeteksi!</strong> Otomatis didaftarkan ke Posyandu.
                    </div>
                  )}
                  <div style={{display:"flex",gap:10,marginTop:14}}>
                    <button onClick={simpanAnggota} disabled={loading} className="btn-heroic">{loading?"Menyimpan...":editAnggotaId?"💾 Update":"💾 Simpan"}</button>
                    <button onClick={()=>{setShowFormAnggota(false);setFormAnggota(emptyAnggota);setEditAnggotaId(null);}} style={{padding:"10px 16px",background:"transparent",border:"1.5px solid rgba(45,90,64,0.2)",borderRadius:10,fontSize:14,color:"#6b7c6d",cursor:"pointer"}}>Batal</button>
                  </div>
                </div>
              )}

              {/* List Anggota */}
              <div className="card-heroic">
                <div style={{padding:"12px 16px",borderBottom:"1px solid rgba(45,90,64,0.08)"}}>
                  <span style={{fontSize:12,fontWeight:700,color:"#6b7c6d",textTransform:"uppercase",letterSpacing:"0.06em"}}>Anggota ({activeAnggota.length} jiwa)</span>
                </div>
                {activeAnggota.length===0?(
                  <div style={{padding:24,textAlign:"center",color:"#a8b5a9",fontSize:13}}>Belum ada anggota. Klik "+ Tambah Anggota"</div>
                ):activeAnggota.map((a,i)=>{
                  const balita=a.tgl_lahir&&isBalita(a.tgl_lahir);
                  return(
                    <div key={a.id} style={{padding:"12px 16px",borderBottom:i<activeAnggota.length-1?"1px solid rgba(45,90,64,0.07)":"none",display:"flex",alignItems:"center",gap:10}}>
                      <div style={{color:"#2d5a40", flexShrink:0}}>{HI[a.hubungan]||<User size={20}/>}</div>
                      <div style={{flex:1}}>
                        <div style={{fontWeight:700,fontSize:14,color:"#1a2e1f",display:"flex",alignItems:"center",gap:6}}>
                          {a.nama}
                          {balita&&<span style={{fontSize:10,background:"rgba(45,90,64,0.1)",color:"#2d5a40",borderRadius:10,padding:"1px 6px",fontWeight:600,display:"flex",alignItems:"center",gap:4}}><Baby size={10}/> BALITA</span>}
                        </div>
                        <div style={{fontSize:11,color:"#7a9a7e",marginTop:2,display:"flex",alignItems:"center",gap:4,flexWrap:"wrap"}}>
                          {a.hubungan} · {a.tgl_lahir?hitungUmur(a.tgl_lahir):"—"}
                          {a.pekerjaan&&a.pekerjaan!=="tidak_bekerja"&&` · ${PEKERJAAN.find(p=>p.v===a.pekerjaan)?.l||a.pekerjaan}`}
                          {a.nfc_id&&<CreditCard size={12}/>}
                        </div>
                        <div style={{fontSize:11,color:"#2d5a40",fontWeight:600,marginTop:2,display:"flex",alignItems:"center",gap:4}}><Coins size={12}/> {a.saldo_poin||0} poin</div>
                      </div>
                      <div style={{display:"flex",gap:4}}>
                        <button onClick={()=>editAnggota(a)} style={{background:"rgba(45,90,64,0.08)",border:"none",borderRadius:8,padding:"5px 8px",cursor:"pointer",fontSize:12,color:"#2d5a40"}}><Edit2 size={12}/></button>
                        <button onClick={()=>hapusAnggota(a.id)} style={{background:"rgba(220,53,69,0.08)",border:"none",borderRadius:8,padding:"5px 8px",cursor:"pointer",fontSize:12,color:"#dc3545"}}><Trash2 size={12}/></button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}