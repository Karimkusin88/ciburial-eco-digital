"use client";
import { useState, useEffect, useRef } from "react";
import { supabase, isSupabaseReady } from "@/lib/supabase";

interface Jadwal { id:string; tanggal:string; rt:string; jam_mulai:string; }
interface Absensi { id:string; jadwal_id:string; nama:string; waktu_tap:string; metode:string; }

const POIN_RONDA = 30;
const emptyJadwal = { tanggal:new Date().toISOString().split("T")[0], rt:"01", jam_mulai:"21:00", jam_selesai:"04:00" };

export default function AdminRondaPage() {
  const [jadwal,setJadwal] = useState<Jadwal[]>([]);
  const [absensi,setAbsensi] = useState<Absensi[]>([]);
  const [kkList,setKkList] = useState<any[]>([]);
  const [anggotaList,setAnggotaList] = useState<any[]>([]);
  const [formJadwal,setFormJadwal] = useState(emptyJadwal);
  const [activeJadwal,setActiveJadwal] = useState<string|null>(null);
  const [tab,setTab] = useState<"jadwal"|"scan">("jadwal");
  const [scanning,setScanning] = useState(false);
  const [lastScan,setLastScan] = useState<{nama:string;poin:number}|null>(null);
  const [manualKK,setManualKK] = useState("");
  const [toast,setToast] = useState({msg:"",ok:true});
  
  const nfcRef = useRef<any>(null);

  // Gunakan refs agar NFC listener tidak kena "stale closure"
  const activeJadwalRef = useRef(activeJadwal);
  useEffect(()=>{activeJadwalRef.current = activeJadwal;}, [activeJadwal]);
  const kkListRef = useRef(kkList);
  useEffect(()=>{kkListRef.current = kkList;}, [kkList]);
  const anggotaListRef = useRef(anggotaList);
  useEffect(()=>{anggotaListRef.current = anggotaList;}, [anggotaList]);

  function showToast(msg:string,ok=true){setToast({msg,ok});setTimeout(()=>setToast({msg:"",ok:true}),4000);}

  async function fetchAll(){
    if(!isSupabaseReady())return;
    const[j,a,kk,ang]=await Promise.all([
      supabase.from("jadwal_ronda").select("*").order("tanggal",{ascending:false}).limit(10),
      supabase.from("absensi_ronda").select("*").order("waktu_tap",{ascending:false}).limit(50),
      supabase.from("keluarga").select("id,kepala_keluarga,rt,nfc_id,no_wa").order("kepala_keluarga"),
      supabase.from("anggota_kk").select("id,kk_id,nama,nfc_id,saldo_poin,hubungan").eq("hubungan","kepala"),
    ]);
    if(j.data)setJadwal(j.data as Jadwal[]);
    if(a.data)setAbsensi(a.data as Absensi[]);
    if(kk.data)setKkList(kk.data);
    if(ang.data)setAnggotaList(ang.data);
  }

  useEffect(()=>{fetchAll();},[]);

  async function buatJadwal(){
    const{error}=await supabase.from("jadwal_ronda").insert(formJadwal);
    if(error)showToast(`❌ ${error.message}`,false);
    else{showToast("✅ Barikade jadwal ronda baru dibuka!");setFormJadwal(emptyJadwal);fetchAll();}
  }

  async function catatAbsensiDanPoin(kkId:string, metode:string){
    const currentJadwal = activeJadwalRef.current;
    if(!currentJadwal)return showToast("⚠️ Pilih titik penjagaan (jadwal) terlebih dahulu!",false);

    // Cari kepala keluarga menggunakan refs yang up-to-date
    const kk = kkListRef.current.find(k=>k.id===kkId||k.nfc_id===kkId);
    const anggota = anggotaListRef.current.find(a=>a.kk_id===(kk?.id||kkId)||a.nfc_id===kkId);

    if(!kk&&!anggota)return showToast("⛔ Akses Ditolak: Kartu ID Warga tidak dikenali!",false);

    const nama = kk?.kepala_keluarga || anggota?.nama || "Unknown";
    const realKKId = kk?.id || anggota?.kk_id;

    // Cek DB langsung - anti spam
    if (!realKKId) return showToast("⛔ Identitas korup!", false);
    const{data:cekAbsen}=await supabase.from("absensi_ronda").select("id").eq("jadwal_id",currentJadwal).eq("kk_id",realKKId).limit(1);
    if(cekAbsen&&cekAbsen.length>0)return showToast(`⚠️ Personel ${nama} sudah terekam di sektor ini!`,false);

    // Catat absensi
    await supabase.from("absensi_ronda").insert({
      jadwal_id:currentJadwal, kk_id:realKKId,
      nama, metode, status:"hadir"
    });

    // Tambah poin ke anggota KK (kepala keluarga)
    let poinDitambah = 0;
    if(anggota?.id){
      const saldoBaru = (anggota.saldo_poin||0) + POIN_RONDA;
      await supabase.from("anggota_kk").update({saldo_poin:saldoBaru}).eq("id",anggota.id);
      await supabase.from("riwayat_poin").insert({
        anggota_id:anggota.id, kk_id:realKKId,
        jumlah:POIN_RONDA, jenis:"masuk",
        sumber:"ronda", keterangan:`Night Watch (Ronda) — ${new Date().toLocaleDateString("id-ID")}`,
      });
      poinDitambah = POIN_RONDA;
    }

    setLastScan({nama, poin:poinDitambah});
    showToast(`🟢 ${nama} [TERVERIFIKASI] — Hadir!${poinDitambah>0?` Bountry +${poinDitambah} XP`:""}`);
    fetchAll();
  }

  async function startNFC(){
    if(!("NDEFReader" in window))return showToast("⚠️ Sistem radar gagal. Gunakan Chrome Android + NFC.",false);
    try{
      const ndef = new (window as any).NDEFReader();
      nfcRef.current = ndef;
      await ndef.scan();
      setScanning(true);
      showToast("📡 Radar NFC Aktif! Memindai area...");
      ndef.addEventListener("reading",({serialNumber}:any)=>{
        const nfcId = serialNumber.replace(/:/g,"").toUpperCase();
        catatAbsensiDanPoin(nfcId,"nfc");
      });
    }catch{showToast("⛔ Modul NFC terminal rusak.",false);}
  }

  function stopNFC(){
    nfcRef.current?.stop?.();
    setScanning(false);
    showToast("Radar NFC dinonaktifkan.");
  }

  const activeAbsensi = absensi.filter(a=>a.jadwal_id===activeJadwal);
  const activeJadwalData = jadwal.find(j=>j.id===activeJadwal);

  return(
    <div style={{minHeight:"100vh",background:"#0B1120",fontFamily:"'Inter', system-ui, sans-serif",color:"#E2E8F0"}}>
      {/* GLOWING BACKGROUND EFFECT */}
      <div style={{position:"fixed",top:-100,left:"50%",transform:"translateX(-50%)",width:600,height:400,background:"radial-gradient(ellipse at top, rgba(16,185,129,0.15) 0%, rgba(11,17,32,0) 70%)",pointerEvents:"none",zIndex:0}}/>
      
      {toast.msg&&<div style={{position:"fixed",top:20,left:"50%",transform:"translateX(-50%)",background:toast.ok?"#047857":"#991B1B",color:"white",padding:"12px 24px",borderRadius:99,zIndex:999,fontSize:14,boxShadow:"0 10px 25px rgba(0,0,0,0.5)",fontWeight:800,letterSpacing:"0.05em",border:`1px solid ${toast.ok?"#34D399":"#F87171"}`}}>{toast.msg}</div>}

      <header style={{background:"rgba(11,17,32,0.8)",backdropFilter:"blur(12px)",borderBottom:"1px solid rgba(16,185,129,0.2)",padding:"16px 24px",position:"sticky",top:0,zIndex:10,display:"flex",alignItems:"center",justifyContent:"space-between",boxShadow:"0 4px 30px rgba(0,0,0,0.5)"}}>
        <div style={{display:"flex",alignItems:"center",gap:16}}>
          <a href="/admin" style={{color:"#9CA3AF",textDecoration:"none",fontSize:13,fontWeight:700,background:"rgba(255,255,255,0.05)",padding:"8px 16px",borderRadius:99}}>← Dashboard</a>
          <div>
            <div style={{fontWeight:900,fontSize:16,color:"#10B981",letterSpacing:"0.02em"}}>NIGHT WATCH TERMINAL</div>
            <div style={{fontSize:10,color:"#64748B",textTransform:"uppercase",letterSpacing:"0.15em"}}>+ {POIN_RONDA} XP PER PATROLI</div>
          </div>
        </div>
        <div style={{display:"flex",gap:8}}>
          {(["jadwal","scan"] as const).map(t=>(
            <button key={t} onClick={()=>setTab(t)} style={{padding:"8px 20px",borderRadius:99,fontSize:13,fontWeight:800,border:tab===t?"1px solid #10B981":"1px solid rgba(255,255,255,0.1)",cursor:"pointer",background:tab===t?"rgba(16,185,129,0.1)":"transparent",color:tab===t?"#10B981":"#9CA3AF",transition:"all 0.2s"}}>
              {t==="jadwal"?"📋 Sektor Patroli":"📡 Sistem Radar"}
            </button>
          ))}
        </div>
      </header>

      <div style={{maxWidth:960,margin:"0 auto",padding:"30px 20px",position:"relative",zIndex:1}}>

        {/* Info Poin */}
        <div style={{background:"linear-gradient(90deg, rgba(16,185,129,0.1) 0%, rgba(11,17,32,0) 100%)",borderLeft:"4px solid #10B981",borderRadius:"0 16px 16px 0",padding:"16px 20px",marginBottom:24,display:"flex",alignItems:"center",gap:16}}>
          <div style={{width:32,height:32,borderRadius:8,background:"rgba(16,185,129,0.2)",display:"flex",alignItems:"center",justifyContent:"center",color:"#34D399",fontSize:18}}>🛡️</div>
          <span style={{fontSize:14,color:"#A7F3D0",fontWeight:600,letterSpacing:"0.02em"}}><strong>SYSTEM ONLINE:</strong> Personel terverifikasi secara otomatis mendapatkan <span style={{color:"#34D399",fontWeight:900}}>{POIN_RONDA} XP</span> ke dalam Crypto-Wallet Desa.</span>
        </div>

        {tab==="jadwal"&&(
          <div style={{display:"grid",gridTemplateColumns:"1fr 1.8fr",gap:24,alignItems:"start"}}>
            <div style={{background:"rgba(30,41,59,0.5)",borderRadius:24,padding:28,border:"1px solid rgba(255,255,255,0.05)",boxShadow:"inset 0 0 0 1px rgba(255,255,255,0.02)"}}>
              <h3 style={{margin:"0 0 20px",color:"#F8FAFC",fontSize:16,fontWeight:900,letterSpacing:"0.05em",display:"flex",alignItems:"center",gap:10}}><span style={{color:"#10B981"}}>➕</span> DEPLOY SEKTOR BARU</h3>
              {[{label:"Tanggal Operasi",key:"tanggal",type:"date"},{label:"Jam Eksekusi",key:"jam_mulai",type:"time"},{label:"Estimasi Selesai",key:"jam_selesai",type:"time"}].map(f=>(
                <div key={f.key} style={{marginBottom:16}}>
                  <label style={{fontSize:11,fontWeight:800,color:"#64748B",letterSpacing:"0.1em",textTransform:"uppercase",display:"block",marginBottom:8}}>{f.label}</label>
                  <input type={f.type} value={(formJadwal as any)[f.key]} onChange={e=>setFormJadwal({...formJadwal,[f.key]:e.target.value})}
                    style={{width:"100%",padding:"12px 16px",borderRadius:12,border:"1px solid rgba(255,255,255,0.1)",fontSize:14,background:"rgba(15,23,42,0.8)",outline:"none",color:"white",boxSizing:"border-box"}}/>
                </div>
              ))}
              <div style={{marginBottom:24}}>
                <label style={{fontSize:11,fontWeight:800,color:"#64748B",letterSpacing:"0.1em",textTransform:"uppercase",display:"block",marginBottom:8}}>Sektor Utama (RT)</label>
                <select value={formJadwal.rt} onChange={e=>setFormJadwal({...formJadwal,rt:e.target.value})}
                  style={{width:"100%",padding:"12px 16px",borderRadius:12,border:"1px solid rgba(255,255,255,0.1)",fontSize:14,background:"rgba(15,23,42,0.8)",outline:"none",color:"white"}}>
                  {["01","02","03","04","05"].map(v=><option key={v} value={v}>Area RT {v}</option>)}
                </select>
              </div>
              <button onClick={buatJadwal} style={{width:"100%",background:"#10B981",color:"#064E3B",border:"none",borderRadius:12,padding:"14px",fontSize:15,fontWeight:900,cursor:"pointer",boxShadow:"0 0 20px rgba(16,185,129,0.3)"}}>DEPLOY JADWAL</button>
            </div>

            <div>
              <h3 style={{margin:"0 0 16px",color:"#F8FAFC",fontSize:15,fontWeight:900,letterSpacing:"0.05em"}}>LOG OPERASI TERAKHIR</h3>
              <div style={{display:"flex",flexDirection:"column",gap:12}}>
                {jadwal.map(j=>{
                  const jmlHadir = absensi.filter(a=>a.jadwal_id===j.id).length;
                  const isActive = activeJadwal===j.id;
                  return(
                    <div key={j.id} onClick={()=>{setActiveJadwal(j.id);setTab("scan");}}
                      style={{background:isActive?"rgba(16,185,129,0.05)":"rgba(30,41,59,0.3)",borderRadius:20,padding:"20px",border:`1px solid ${isActive?"rgba(16,185,129,0.4)":"rgba(255,255,255,0.05)"}`,cursor:"pointer",display:"flex",alignItems:"center",gap:20,transition:"all 0.2s"}}>
                      <div style={{width:52,height:52,borderRadius:16,background:isActive?"rgba(16,185,129,0.15)":"rgba(255,255,255,0.05)",display:"flex",alignItems:"center",justifyContent:"center",fontSize:24,color:isActive?"#10B981":"#9CA3AF"}}>
                        {isActive?"📡":"🔦"}
                      </div>
                      <div style={{flex:1}}>
                        <div style={{fontWeight:800,fontSize:16,color:"#F8FAFC",marginBottom:4,letterSpacing:"0.02em"}}>OPERASI SEKTOR {j.rt}</div>
                        <div style={{fontSize:13,color:"#94A3B8"}}>{new Date(j.tanggal).toLocaleDateString("id-ID",{weekday:"long",day:"numeric",month:"long"})} • <b>{j.jam_mulai}</b> WIB</div>
                      </div>
                      <div style={{textAlign:"right"}}>
                        <div style={{fontSize:18,fontWeight:900,color:isActive?"#10B981":"#E2E8F0"}}>{jmlHadir} <span style={{fontSize:12,color:"#64748B",fontWeight:700}}>HADIR</span></div>
                        <div style={{fontSize:11,color:"#10B981",fontWeight:800,marginTop:4}}>{jmlHadir*POIN_RONDA} XP Distribusi</div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        )}

        {tab==="scan"&&(
          <div>
            <div style={{marginBottom:24,background:"rgba(30,41,59,0.5)",padding:"20px",borderRadius:20,border:"1px solid rgba(255,255,255,0.05)"}}>
              <label style={{fontSize:11,fontWeight:800,color:"#64748B",letterSpacing:"0.1em",textTransform:"uppercase",display:"block",marginBottom:10}}>Sektor Target Operasi</label>
              <select value={activeJadwal||""} onChange={e=>setActiveJadwal(e.target.value)}
                style={{width:"100%",padding:"16px 20px",borderRadius:16,border:"1px solid rgba(16,185,129,0.3)",fontSize:15,fontWeight:700,background:"rgba(15,23,42,0.8)",color:"white",outline:"none",cursor:"pointer"}}>
                <option value="">-- [ NOT_SELECTED ] --</option>
                {jadwal.map(j=><option key={j.id} value={j.id}>Sektor RT {j.rt} — {new Date(j.tanggal).toLocaleDateString("id-ID",{day:"numeric",month:"long",year:"numeric"})} [{absensi.filter(a=>a.jadwal_id===j.id).length} Personel]</option>)}
              </select>
            </div>

            <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:24,alignItems:"start"}}>
              {/* NFC Scanner Radar */}
              <div style={{background:"rgba(15,23,42,0.8)",borderRadius:28,padding:40,border:"1px solid rgba(16,185,129,0.15)",boxShadow:"inset 0 0 60px rgba(16,185,129,0.05), 0 20px 40px rgba(0,0,0,0.5)",textAlign:"center",position:"relative",overflow:"hidden"}}>
                
                <div style={{position:"absolute",top:0,left:0,right:0,height:2,background:"linear-gradient(90deg, transparent, #10B981, transparent)"}}/>

                <h3 style={{margin:"0 0 30px",color:"#F8FAFC",fontSize:18,fontWeight:900,letterSpacing:"0.1em"}}>RADAR IDENTIFIKASI</h3>
                
                <div style={{position:"relative",width:180,height:180,borderRadius:"50%",margin:"0 auto 40px",background:"rgba(15,23,42,1)",border:`2px solid ${scanning?"#10B981":"#334155"}`,display:"flex",alignItems:"center",justifyContent:"center",boxShadow:scanning?"0 0 40px rgba(16,185,129,0.2)":"none"}}>
                  {/* Radar Circles */}
                  <div style={{position:"absolute",inset:20,border:`1px solid ${scanning?"rgba(16,185,129,0.3)":"rgba(255,255,255,0.05)"}`,borderRadius:"50%"}}/>
                  <div style={{position:"absolute",inset:40,border:`1px solid ${scanning?"rgba(16,185,129,0.2)":"rgba(255,255,255,0.05)"}`,borderRadius:"50%"}}/>
                  
                  {/* Sweep Animation */}
                  {scanning&&<div style={{position:"absolute",top:"50%",left:"50%",width:"50%",height:2,background:"linear-gradient(90deg, transparent, #10B981)",transformOrigin:"0 0",animation:"radarSweep 2s linear infinite"}}/>}
                  
                  {/* Icon */}
                  <div style={{fontSize:50,position:"relative",zIndex:2,filter:scanning?"drop-shadow(0 0 10px #10B981)":"none"}}>{scanning?"📡":"🛡️"}</div>
                </div>

                {lastScan&&(
                  <div style={{background:"rgba(16,185,129,0.1)",border:"1px solid rgba(16,185,129,0.3)",borderRadius:16,padding:"16px",marginBottom:24,animation:"fadeIn 0.3s ease-out"}}>
                    <div style={{fontWeight:900,fontSize:13,color:"#34D399",letterSpacing:"0.1em",marginBottom:6}}>🟩 AKSES DITERIMA</div>
                    <div style={{fontWeight:800,fontSize:18,color:"white"}}>{lastScan.nama}</div>
                    {lastScan.poin>0&&<div style={{fontSize:13,color:"#10B981",fontWeight:800,marginTop:6,display:"flex",alignItems:"center",justifyContent:"center",gap:6}}><span style={{fontSize:16}}>⚡</span> Bountry +{lastScan.poin} XP</div>}
                  </div>
                )}

                <button onClick={scanning?stopNFC:startNFC}
                  style={{width:"100%",background:scanning?"rgba(220,53,69,0.1)":"#10B981",color:scanning?"#EF4444":"#064E3B",border:scanning?"1px solid rgba(220,53,69,0.3)":"none",borderRadius:16,padding:"18px",fontSize:15,fontWeight:900,letterSpacing:"0.05em",cursor:"pointer",boxShadow:scanning?"none":"0 0 20px rgba(16,185,129,0.3)"}}>
                  {scanning?"DEAKTIVASI RADAR ⏹":"AKTIVASI RADAR NFC ▶"}
                </button>
              </div>

              {/* Manual + Rekap */}
              <div style={{display:"flex",flexDirection:"column",gap:24}}>
                
                <div style={{background:"rgba(30,41,59,0.5)",borderRadius:24,padding:24,border:"1px solid rgba(255,255,255,0.05)"}}>
                  <h3 style={{margin:"0 0 20px",color:"#F8FAFC",fontSize:13,fontWeight:900,letterSpacing:"0.1em"}}>OVERRIDE MANUAL</h3>
                  <select value={manualKK} onChange={e=>setManualKK(e.target.value)}
                    style={{width:"100%",padding:"14px 16px",borderRadius:12,border:"1px solid rgba(255,255,255,0.1)",fontSize:14,background:"rgba(15,23,42,0.8)",color:"white",outline:"none",marginBottom:16}}>
                    <option value="">-- Pilih identitas warga --</option>
                    {kkList.map(k=><option key={k.id} value={k.id}>{k.kepala_keluarga} (Sektor {k.rt})</option>)}
                  </select>
                  <button onClick={()=>{if(manualKK){catatAbsensiDanPoin(manualKK,"manual");setManualKK("");}}}
                    style={{width:"100%",background:"transparent",color:"#34D399",border:"1px dashed #10B981",borderRadius:12,padding:"12px",fontSize:14,fontWeight:800,cursor:"pointer",transition:"all 0.2s"}} onMouseEnter={e=>{e.currentTarget.style.background="rgba(16,185,129,0.1)";}} onMouseLeave={e=>{e.currentTarget.style.background="transparent";}}>
                    [ EXECUTE ENTRY ]
                  </button>
                </div>

                <div style={{background:"rgba(30,41,59,0.5)",borderRadius:24,border:"1px solid rgba(255,255,255,0.05)",overflow:"hidden",flex:1,display:"flex",flexDirection:"column"}}>
                  <div style={{padding:"16px 20px",borderBottom:"1px solid rgba(255,255,255,0.05)",display:"flex",justifyContent:"space-between",alignItems:"center",background:"rgba(15,23,42,0.5)"}}>
                    <div style={{fontSize:12,fontWeight:900,color:"#64748B",letterSpacing:"0.1em"}}>LIVE ROSTER</div>
                    <div style={{fontSize:12,fontWeight:900,color:"#10B981",background:"rgba(16,185,129,0.1)",padding:"4px 10px",borderRadius:99}}>Total: {activeAbsensi.length}</div>
                  </div>
                  
                  <div style={{flex:1,overflowY:"auto",padding:"10px",maxHeight:300}}>
                    {activeAbsensi.length===0?(
                      <div style={{fontSize:13,color:"#475569",textAlign:"center",padding:"40px 20px",fontWeight:600}}>Waiting for personnel data...</div>
                    ):activeAbsensi.map((a,i)=>(
                      <div key={a.id} style={{display:"flex",alignItems:"center",gap:12,padding:"10px 14px",borderRadius:12,background:i%2===0?"rgba(255,255,255,0.02)":"transparent",marginBottom:4}}>
                        <span style={{fontSize:14,color:a.metode==="nfc"?"#10B981":"#F59E0B",filter:"drop-shadow(0 0 5px currentColor)"}}>{a.metode==="nfc"?"📡":"⌨️"}</span>
                        <div style={{flex:1}}>
                          <div style={{fontSize:14,color:"white",fontWeight:800}}>{a.nama}</div>
                          <div style={{fontSize:11,color:"#64748B",fontWeight:600}}>{new Date(a.waktu_tap).toLocaleTimeString("en-US",{hour12:false})}</div>
                        </div>
                        <span style={{fontSize:13,color:"#34D399",fontWeight:900}}>+{POIN_RONDA} XP</span>
                      </div>
                    ))}
                  </div>
                  
                  {activeAbsensi.length>0&&(
                    <div style={{padding:"16px",background:"rgba(16,185,129,0.05)",borderTop:"1px solid rgba(16,185,129,0.1)",fontSize:12,color:"#34D399",fontWeight:800,textAlign:"center",letterSpacing:"0.05em"}}>
                      TOTAL BOUNTY REWARDED: <span style={{fontSize:16,color:"white"}}>{activeAbsensi.length*POIN_RONDA}</span> XP
                    </div>
                  )}
                </div>
                
              </div>
            </div>
          </div>
        )}
      </div>
      <style>{`
        @keyframes radarSweep { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
        @keyframes fadeIn { from { opacity: 0; transform: translateY(10px); } to { opacity: 1; transform: translateY(0); } }
        ::-webkit-scrollbar { width: 6px; }
        ::-webkit-scrollbar-track { background: rgba(15,23,42,0.8); }
        ::-webkit-scrollbar-thumb { background: rgba(51,65,85,1); border-radius: 10px; }
      `}</style>
    </div>
  );
}
