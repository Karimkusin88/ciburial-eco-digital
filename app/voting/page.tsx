"use client";
import { useState, useEffect, useRef } from "react";
import { supabase, isSupabaseReady } from "@/lib/supabase";

interface Voting { id: string; judul: string; deskripsi: string; tgl_mulai: string; tgl_selesai: string; status: string; }
interface Pilihan { id: string; voting_id: string; teks: string; jumlah_vote: number; }
interface Anggota { id: string; kk_id: string; nama: string; nfc_id: string; tgl_lahir: string; rt:string; }

function hitungUmur(tgl_lahir: string) {
  if(!tgl_lahir) return 0;
  const d1 = new Date();
  const d2 = new Date(tgl_lahir);
  let age = d1.getFullYear() - d2.getFullYear();
  const m = d1.getMonth() - d2.getMonth();
  if (m < 0 || (m === 0 && d1.getDate() < d2.getDate())) age--;
  return age;
}

export default function VotingPage() {
  const [votings, setVotings] = useState<Voting[]>([]);
  const [pilihanMap, setPilihanMap] = useState<Record<string, Pilihan[]>>({});
  const [pemilihList, setPemilihList] = useState<Anggota[]>([]);
  
  const [activeVoting, setActiveVoting] = useState<string | null>(null);
  const [scanning, setScanning] = useState(false);
  const [verifikasiSukses, setVerifikasiSukses] = useState<Anggota | null>(null);

  const [loading, setLoading] = useState<string | null>(null);
  const [konfirmasiSuara, setKonfirmasiSuara] = useState<Pilihan | null>(null);
  const [toast, setToast] = useState({ msg: "", type: "info" });
  
  const nfcRef = useRef<any>(null);
  const pemilihListRef = useRef(pemilihList);
  useEffect(() => { pemilihListRef.current = pemilihList; }, [pemilihList]);

  const showToast = (msg: string, type: "success"|"error"|"info" = "info") => { setToast({ msg, type }); setTimeout(() => setToast({ msg: "", type: "info" }), 4000); };

  async function fetchAll() {
    if (!isSupabaseReady()) return;
    const [vReq, angReq, kkReq, pilReq] = await Promise.all([
      supabase.from("voting").select("*").eq("status", "aktif").order("created_at", { ascending: false }),
      supabase.from("anggota_kk").select("id, kk_id, nama, nfc_id, tgl_lahir, keluarga(rt)"),
      supabase.from("keluarga").select("id, kepala_keluarga, nfc_id, rt, tgl_lahir_kepala"),
      supabase.from("pilihan_voting").select("*")
    ]);
    
    if (vReq.data) {
      setVotings(vReq.data);
      const pm: Record<string, Pilihan[]> = {};
      if (pilReq.data) {
        // Grouping without db-side order constraints that might cause silent fails
        const sortedPilihan = [...(pilReq.data as Pilihan[])].sort((a,b) => String(a.id).localeCompare(String(b.id)));
        sortedPilihan.forEach((p) => {
          if (!pm[p.voting_id]) pm[p.voting_id] = [];
          pm[p.voting_id].push(p);
        });
      }
      setPilihanMap(pm);
    }
    
    // Combine Anggota and Kepala Keluarga to ensure nobody is left behind, filter >= 18
    let allDewasa: Anggota[] = [];
    if (angReq.data) {
      const angDewasa = (angReq.data as any[]).filter(a => hitungUmur(a.tgl_lahir) >= 18).map(a => ({ id: a.id, kk_id: a.kk_id, nama: a.nama, nfc_id: a.nfc_id, tgl_lahir: a.tgl_lahir, rt: a.keluarga?.rt }));
      allDewasa.push(...angDewasa);
    }
    if (kkReq.data) {
      const kkDewasa = (kkReq.data as any[]).filter(k => hitungUmur(k.tgl_lahir_kepala) >= 18).map(k => ({ id: k.id, kk_id: k.id, nama: k.kepala_keluarga, nfc_id: k.nfc_id, tgl_lahir: k.tgl_lahir_kepala, rt: k.rt }));
      allDewasa.push(...kkDewasa);
    }

    // Remove duplicates by nfc_id
    const unikNfc = Array.from(new Map(allDewasa.filter(v => v.nfc_id).map(item => [item.nfc_id, item])).values());
    setPemilihList(unikNfc);
  }

  useEffect(() => { fetchAll(); }, []);

  // --- Otorisasi Pemilih ---
  async function startNfcScan() {
    if (!("NDEFReader" in window)) return showToast("Sistem NFC E-KTP/Kartu tidak didukung di perangkat ini.", "error");
    try {
      const ndef = new (window as any).NDEFReader();
      nfcRef.current = ndef;
      await ndef.scan();
      setScanning(true);
      showToast("Pemindai Aktif! Tempelkan ID Card DPT Anda ke belakang perangkat...", "info");
      
      ndef.addEventListener("reading", async ({ serialNumber }: any) => {
        const nfcId = serialNumber.replace(/:/g, "").toUpperCase();
        const found = pemilihListRef.current.find(a => a.nfc_id === nfcId);
        
        if (found) {
          stopNfcScan();
          await prosesVerifikasi(found);
        } else {
          showToast("❌ Kartu NFC Ditolak! ID tidak valid atau usia belum mencukupi hak pilih.", "error");
        }
      });
    } catch (e) {
      showToast("Akses perangkat keras NFC gagal.", "error");
      setScanning(false);
    }
  }

  function stopNfcScan() {
    if (nfcRef.current) nfcRef.current.stop?.();
    setScanning(false);
  }

  async function prosesVerifikasi(anggota: Anggota) {
    if (!activeVoting) return;
    setLoading("verify");
    
    // Pengecekan Single Vote menggunakan kolom ip_address untuk menampung unique Anggota ID.
    const { data: voteExist } = await supabase.from("vote_record")
      .select("id").eq("voting_id", activeVoting).eq("ip_address", anggota.id).limit(1);
    
    if (voteExist && voteExist.length > 0) {
      showToast(`Akses Ditolak: Hak suara Sdr/i ${anggota.nama} telah digunakan!`, "error");
      closeBilik();
    } else {
      setVerifikasiSukses(anggota);
      showToast(`Verifikasi Sukses. Selamat datang, ${anggota.nama}.`, "success");
    }
    setLoading(null);
  }

  // --- Proses Pemungutan ---
  async function kirimSuara() {
    if (!activeVoting || !verifikasiSukses || !konfirmasiSuara) return;
    setLoading("submit");
    
    try {
      // Merekam ke dalam buku suara
      const { error: errRecord } = await supabase.from("vote_record").insert({ 
        voting_id: activeVoting, 
        kk_id: verifikasiSukses.kk_id,
        ip_address: verifikasiSukses.id 
      });
      if (errRecord) throw errRecord;

      const currentChoice = pilihanMap[activeVoting]?.find(p => p.id === konfirmasiSuara.id);
      if (currentChoice) {
        await supabase.from("pilihan_voting")
          .update({ jumlah_vote: (currentChoice.jumlah_vote || 0) + 1 })
          .eq("id", konfirmasiSuara.id);
      }

      showToast("🎉 Suara sah! Hak konstitusional Anda berhasil dienkripsi dan masuk ke kotak digital.", "success");
      setKonfirmasiSuara(null);
      closeBilik();
    } catch (e) {
      showToast("Terjadi kesalahan sistem saat mengenkripsi suara (Koneksi Terputus).", "error");
    }
    setLoading(null);
  }

  function closeBilik() {
    setActiveVoting(null); setVerifikasiSukses(null);
    if (scanning) stopNfcScan();
  }

  // --- Parsing Strings ---
  const activeData = votings.find(v => v.id === activeVoting);
  function parseJudul(str:string) {
    if(str.startsWith("[PEMILU] ")) return { tipe:"PEMILU", text:str.replace("[PEMILU] ","") };
    if(str.startsWith("[MUSYAWARAH] ")) return { tipe:"MUSYAWARAH", text:str.replace("[MUSYAWARAH] ","") };
    return { tipe:"STANDAR", text:str };
  }
  function parseKandidat(str:string) {
    const parts = str.split("|||");
    return { nama: parts[0], foto: parts[1]||null };
  }

  // Tema Warna Eco-Digital Ciburial
  const Colors = {
    bgCreme: "#f5f0e8",
    bgDarkGreen: "#1a2e1f",
    greenPrimary: "#2d5a40",
    greenLight: "#7a9a7e",
    textLight: "#f5f0e8",
    goldAccent: "#b8943f",
    redAlert: "#dc3545"
  };

  const bgTexture = `url("data:image/svg+xml,%3Csvg width='40' height='40' viewBox='0 0 40 40' xmlns='http://www.w3.org/2000/svg'%3E%3Cpath d='M20 20.5V18H0v-2h20v-2H0v-2h20v-2H0V8h20V6H0V4h20V2H0V0h22v20h2V0h2v20h2V0h2v20h2V0h2v20h2V0h2v20h2v2H20v-1.5zM0 20h2v20H0V20zm4 0h2v20H4V20zm4 0h2v20H8V20zm4 0h2v20h-2V20zm4 0h2v20h-2V20zm4 4h20v2H20v-2zm0 4h20v2H20v-2zm0 4h20v2H20v-2zm0 4h20v2H20v-2z' fill='%236b7c6d' fill-opacity='0.1' fill-rule='evenodd'/%3E%3C/svg%3E")`;

  return (
    <div style={{minHeight:"100vh",background:Colors.bgCreme,backgroundImage:bgTexture,fontFamily:"'Inter',system-ui,sans-serif",color:Colors.bgDarkGreen,display:"flex",flexDirection:"column"}}>
      {/* Notifikasi Absolut */}
      {toast.msg && (
        <div style={{position:"fixed",top:40,left:"50%",transform:"translateX(-50%)",zIndex:9999,background:toast.type==="success"?Colors.greenPrimary:toast.type==="error"?Colors.redAlert:Colors.bgDarkGreen,color:"white",padding:"16px 32px",borderRadius:12,boxShadow:"0 20px 40px rgba(0,0,0,0.3)",fontWeight:800,fontSize:15,animation:"slideDown 0.4s cubic-bezier(0.175, 0.885, 0.32, 1.275)"}}>
          {toast.type==="success"?"✅ ":toast.type==="error"?"🚫 ":"ℹ️ "}{toast.msg}
        </div>
      )}

      {/* HEADER RESMI */}
      <header style={{padding:"32px 40px",borderBottom:`1px solid rgba(45,90,64,0.15)`,background:"white",boxShadow:"0 10px 30px rgba(45,90,64,0.05)",zIndex:20,display:"flex",alignItems:"center",justifyContent:"space-between"}}>
        <div style={{display:"flex",alignItems:"center",gap:24}}>
          <div style={{width:60,height:60,background:Colors.greenPrimary,borderRadius:16,display:"flex",alignItems:"center",justifyContent:"center",fontSize:32,boxShadow:`0 0 20px rgba(45,90,64,0.2)`}}>🗳️</div>
          <div>
            <div style={{fontSize:11,color:Colors.greenPrimary,letterSpacing:"0.3em",fontWeight:900,marginBottom:4}}>KOMISI PEMILIHAN KAMPUNG (KPK) CIBURIAL RW 08</div>
            <h1 style={{margin:0,fontSize:26,fontWeight:900,color:Colors.bgDarkGreen,letterSpacing:"-0.02em"}}>Bilik Suara Pintar Digital</h1>
          </div>
        </div>
        {verifikasiSukses ? (
          <div style={{background:"rgba(45,90,64,0.1)",border:`1px solid rgba(45,90,64,0.3)`,padding:"12px 24px",borderRadius:99,display:"flex",alignItems:"center",gap:12}}>
            <div style={{width:10,height:10,borderRadius:"50%",background:Colors.greenPrimary,animation:"pulse 2s infinite"}}/>
            <div>
              <div style={{fontSize:10,color:Colors.greenLight,fontWeight:800,textTransform:"uppercase",letterSpacing:"0.1em"}}>Identitas DPT Tervalidasi</div>
              <div style={{fontSize:15,fontWeight:900,color:Colors.greenPrimary}}>{verifikasiSukses.nama} <span style={{fontSize:12,color:Colors.greenLight,marginLeft:6}}>— Usia {hitungUmur(verifikasiSukses.tgl_lahir)}th</span></div>
            </div>
          </div>
        ) : (
          <button onClick={() => window.location.href="/"} style={{background:"transparent",color:Colors.greenLight,border:`1px solid rgba(45,90,64,0.2)`,padding:"10px 20px",borderRadius:99,fontSize:14,fontWeight:800,cursor:"pointer"}}>
            Tinggalkan TPS ✕
          </button>
        )}
      </header>

      {/* MODAL KONFIRMASI (FINAL STEP) */}
      {konfirmasiSuara && activeData && (
        <div style={{position:"fixed",inset:0,background:"rgba(26,46,31,0.95)",backdropFilter:"blur(10px)",zIndex:999,display:"flex",alignItems:"center",justifyContent:"center"}}>
          <div style={{background:"white",border:`1px solid ${Colors.greenLight}`,padding:48,borderRadius:32,maxWidth:500,width:"100%",textAlign:"center",boxShadow:"0 25px 50px -12px rgba(0,0,0,0.5)",animation:"zoomIn 0.3s cubic-bezier(0.175, 0.885, 0.32, 1.275)"}}>
            <div style={{fontSize:40,marginBottom:16}}>🔒</div>
            <h2 style={{margin:"0 0 8px",fontSize:24,color:Colors.bgDarkGreen,fontWeight:900}}>Kunci Pilihan Sah Anda?</h2>
            <p style={{margin:"0 0 32px",color:Colors.greenLight,fontSize:15,lineHeight:1.6}}>Keputusan yang telah disetujui, dienkripsi sepenuhnya, dan tidak dapat dibatalkan atau diubah oleh siapapun. Pastikan ini adalah pilihan terbaik dari Anda pribadi.</p>
            
            <div style={{background:Colors.bgCreme,padding:"24px",borderRadius:24,border:`1px solid rgba(45,90,64,0.1)`,marginBottom:32}}>
              <div style={{fontSize:11,color:Colors.greenLight,fontWeight:800,letterSpacing:"0.1em",marginBottom:8}}>PILIHAN TERCATAT:</div>
              <div style={{fontSize:20,fontWeight:900,color:Colors.greenPrimary}}>{parseKandidat(konfirmasiSuara.teks).nama}</div>
            </div>

            <div style={{display:"flex",gap:16}}>
              <button onClick={()=>setKonfirmasiSuara(null)} style={{flex:1,padding:"18px",background:"transparent",color:Colors.greenLight,border:`2px solid rgba(45,90,64,0.2)`,borderRadius:16,fontSize:16,fontWeight:800,cursor:"pointer"}}>Koreksi Ulang</button>
              <button 
                onClick={kirimSuara} disabled={loading==="submit"}
                style={{flex:1.5,padding:"18px",background:Colors.greenPrimary,color:"white",border:"none",borderRadius:16,fontSize:16,fontWeight:800,cursor:loading?"not-allowed":"pointer",boxShadow:`0 10px 20px rgba(45,90,64,0.3)`}}>
                {loading==="submit" ? "Mengenkripsi..." : "🔐 SAH! Masukkan Suara"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ARENA PEMILIHAN */}
      <main style={{flex:1,display:"flex",alignItems:"center",justifyContent:"center",padding:"40px 20px",position:"relative",zIndex:10}}>
        
        {/* SKENARIO 1: Belum Pilih Agenda */}
        {!activeVoting && (
          <div style={{maxWidth:800,width:"100%"}}>
            
            <div style={{background:Colors.bgDarkGreen, borderLeft:`6px solid ${Colors.goldAccent}`, padding:"24px", borderRadius:"16px", marginBottom:32, boxShadow:"0 5px 15px rgba(0,0,0,0.05)"}}>
              <h3 style={{color:Colors.goldAccent, margin:"0 0 8px 0", fontSize:18, fontWeight:900}}>Pesan Komisi Pemilihan Kampung (KPK)</h3>
              <p style={{color:Colors.textLight, margin:0, fontSize:15, lineHeight:1.6}}>Selamat datang para pemilih! Suara Anda adalah fondasi masa depan Kampung Ciburial. Gunakan hak pilih Anda dengan <b>LUBER</b> (Langsung, Umum, Bebas, Rahasia) dan <b>JURDIL</b> (Jujur & Adil). Masa depan RW 08 berada di tangan kita bersama!</p>
            </div>

            <div style={{textAlign:"center",marginBottom:40}}>
              <h2 style={{fontSize:32,fontWeight:900,color:Colors.bgDarkGreen,marginBottom:12}}>Agenda Pemilihan Terbuka</h2>
              <p style={{color:Colors.greenLight,fontSize:16}}>Pilih bilik pemungutan suara resmi di bawah ini yang akan Anda masuki.</p>
            </div>
            
            <div style={{display:"grid",gap:20}}>
              {votings.length===0 ? (
                <div style={{padding:"60px 20px",textAlign:"center",background:"white",borderRadius:24,border:`1px dashed ${Colors.greenLight}`,boxShadow:"0 10px 30px rgba(0,0,0,0.05)"}}>
                  <div style={{fontSize:40,marginBottom:16}}>📭</div>
                  <div style={{fontSize:16,color:Colors.greenLight,fontWeight:600}}>Tidak ada agenda pemungutan suara yang aktif/dibuka saat ini.</div>
                </div>
              ) : votings.map(v => {
                const { tipe, text } = parseJudul(v.judul);
                return (
                  <div key={v.id} onClick={()=>setActiveVoting(v.id)} style={{background:"white",padding:"32px 40px",borderRadius:24,border:`1px solid rgba(45,90,64,0.1)`,cursor:"pointer",display:"flex",alignItems:"center",justifyContent:"space-between",boxShadow:"0 10px 30px rgba(0,0,0,0.05)",transition:"all 0.2s"}}>
                    <div>
                      <div style={{display:"flex",alignItems:"center",gap:12,marginBottom:12}}>
                        <span style={{background:tipe==="PEMILU"?"rgba(45,90,64,0.1)":"rgba(184,148,63,0.1)",color:tipe==="PEMILU"?Colors.greenPrimary:Colors.goldAccent,padding:"6px 12px",borderRadius:8,fontSize:11,fontWeight:900,letterSpacing:"0.1em"}}>{tipe==="PEMILU"?"KOTAK PEMILU DPT":"JAJAK PENDAPAT (MUSYAWARAH)"}</span>
                      </div>
                      <h3 style={{margin:"0 0 8px",color:Colors.bgDarkGreen,fontSize:22,fontWeight:900}}>{text}</h3>
                      <p style={{margin:0,color:Colors.greenLight,fontSize:14,maxWidth:500,lineHeight:1.6}}>{v.deskripsi || "Tanpa deskripsi resmi tambahan."}</p>
                    </div>
                    <div style={{width:50,height:50,background:Colors.bgCreme,borderRadius:"50%",display:"flex",alignItems:"center",justifyContent:"center",color:Colors.greenPrimary,fontSize:20,fontWeight:900}}>→</div>
                  </div>
                )
              })}
            </div>
          </div>
        )}

        {/* SKENARIO 2: Otorisasi NFC Sahaja */}
        {activeVoting && !verifikasiSukses && (
          <div style={{maxWidth:600,width:"100%",background:"white",padding:48,borderRadius:32,border:`1px solid rgba(45,90,64,0.1)`,boxShadow:"0 20px 50px rgba(0,0,0,0.08)",textAlign:"center",animation:"zoomIn 0.3s ease-out"}}>
            <h2 style={{margin:"0 0 12px",fontSize:28,fontWeight:900,color:Colors.bgDarkGreen}}>Otorisasi Daftar Pemilih Tetap (DPT)</h2>
            <p style={{margin:"0 0 40px",fontSize:15,color:Colors.greenLight,lineHeight:1.6}}>Sistem mendeteksi bahwa hak pilih untuk agenda ini mewajibkan usia peserta minimum <b>18 Tahun (+1 Hari)</b>. Harap siapkan Kartu Warga E-KTP Ciburial Anda.</p>
            
            <div style={{display:"flex",flexDirection:"column",gap:20}}>
              {/* Scan NFC Button */}
              {!scanning && (
                <button onClick={startNfcScan} style={{padding:"24px",background:Colors.greenPrimary,color:"white",border:"none",borderRadius:24,fontSize:18,fontWeight:900,cursor:"pointer",boxShadow:`0 10px 25px rgba(45,90,64,0.3)`}}>
                  <span style={{fontSize:24,display:"block",marginBottom:8}}>💳</span> Pindai Kartu Warga Terdaftar (Tap E-KTP)
                </button>
              )}
              {scanning && (
                <div style={{padding:"40px 24px",background:"rgba(45,90,64,0.05)",border:`2px dashed ${Colors.greenPrimary}`,borderRadius:24}}>
                  <div style={{width:80,height:80,background:Colors.greenPrimary,borderRadius:"50%",margin:"0 auto 20px",display:"flex",alignItems:"center",justifyContent:"center",fontSize:32,animation:"pulse 1.5s infinite",boxShadow:`0 0 30px rgba(45,90,64,0.4)`}}>📡</div>
                  <div style={{fontSize:18,fontWeight:800,color:Colors.greenPrimary,marginBottom:8}}>Menunggu Pindaian...</div>
                  <div style={{fontSize:14,color:Colors.greenLight}}>Tempelkan Kartu DPT Warga Kampung Ciburial ke zona NFC (Punggung Handphone).</div>
                  <button onClick={stopNfcScan} style={{marginTop:24,padding:"10px 24px",background:"transparent",color:Colors.redAlert,border:`1px solid ${Colors.redAlert}`,borderRadius:99,fontSize:14,fontWeight:800,cursor:"pointer"}}>Batalkan Pindai</button>
                </div>
              )}
              
              <div style={{marginTop:20,fontSize:13,color:Colors.greenLight,background:Colors.bgCreme,padding:"12px 16px",borderRadius:12,fontWeight:600}}>
                💡 Prinsip Rahasia & Aman: Identitas Anda hanya digunakan untuk mengecek Hak Pilih (mencegah pencoblosan ganda). Suara Anda terekam secara anonim.
              </div>
            </div>
          </div>
        )}

        {/* SKENARIO 3: Bilik Pencoblosan Sesungguhnya */}
        {activeVoting && verifikasiSukses && activeData && (
          <div style={{width:"100%",maxWidth:1000,animation:"slideUp 0.4s cubic-bezier(0.175, 0.885, 0.32, 1.275)"}}>
            
            <div style={{textAlign:"center",marginBottom:24}}>
              {(() => {
                const { tipe, text } = parseJudul(activeData.judul);
                return (
                  <>
                    <h2 style={{fontSize:40,fontWeight:900,color:Colors.bgDarkGreen,marginBottom:16,letterSpacing:"-0.02em"}}>{text}</h2>
                    <p style={{color:Colors.greenLight,fontSize:18,maxWidth:700,margin:"0 auto"}}>{activeData.deskripsi}</p>
                    {tipe === "PEMILU" ? (
                      <div style={{display:"inline-block",background:"rgba(45,90,64,0.1)",color:Colors.greenPrimary,padding:"8px 24px",borderRadius:99,fontSize:13,fontWeight:900,letterSpacing:"0.1em",marginTop:24,border:`1px solid rgba(45,90,64,0.2)`}}>🧑‍💼 FORMAT: SURAT SUARA PEMILU KANDIDAT B BERGAMBAR</div>
                    ) : (
                      <div style={{display:"inline-block",background:"rgba(184,148,63,0.1)",color:Colors.goldAccent,padding:"8px 24px",borderRadius:99,fontSize:13,fontWeight:900,letterSpacing:"0.1em",marginTop:24,border:`1px solid rgba(184,148,63,0.2)`}}>⚖️ FORMAT: SURAT KEPUTUSAN MUSYAWARAH RW</div>
                    )}
                  </>
                )
              })()}
            </div>

            <div style={{background:"rgba(45,90,64,0.05)", border:`1px solid rgba(45,90,64,0.2)`, padding:"20px", borderRadius:"16px", marginBottom:32, color:Colors.greenPrimary, textAlign:"left"}}>
              <div style={{fontSize:16, fontWeight:900, marginBottom:8}}>💡 Himbauan Pencoblosan:</div>
              <div style={{fontSize:14, lineHeight:1.6, fontWeight:600}}>Amati setiap pilihan atau kandidat dengan seksama. Setelah menekan tombol <b>COBLOS KANDIDAT</b> atau <b>Dukung Opsi Ini</b>, Anda akan diarahkan ke tahap Validasi Kunci Akhir. Pastikan Anda memilih dengan tepat!</div>
            </div>

            {/* Render Kandidat Dinamis */}
            <div style={{
              display:"grid", 
              gridTemplateColumns: parseJudul(activeData.judul).tipe === "PEMILU" ? "repeat(auto-fit, minmax(280px, 1fr))" : "repeat(1, 1fr)", 
              gap: 24
            }}>
              {(pilihanMap[activeVoting]||[]).map((p) => {
                const isPemilu = parseJudul(activeData.judul).tipe === "PEMILU";
                const { nama, foto } = parseKandidat(p.teks);
                
                // Deteksi Pilihan Kosong/Netral
                const isGolput = nama.toLowerCase().includes("golput") || nama.toLowerCase().includes("kosong");
                const isNetral = nama.toLowerCase().includes("netral") || nama.toLowerCase().includes("abstain");

                // Layout Pemilihan (Kartu Vertikal Dgn Frame Foto Besar)
                if(isPemilu) {
                  return (
                    <div key={p.id} onClick={() => setKonfirmasiSuara(p)} style={{background:"white",border:`2px solid ${isGolput?Colors.bgCreme:isNetral?Colors.bgCreme:Colors.greenPrimary}`,borderRadius:32,overflow:"hidden",cursor:"pointer",transition:"all 0.2s",boxShadow:"0 15px 35px rgba(0,0,0,0.08)"}}>
                      <div style={{height:300,background:Colors.bgCreme,position:"relative",display:"flex",alignItems:"center",justifyContent:"center"}}>
                        {foto ? (
                          <img src={foto} alt={nama} style={{width:"100%",height:"100%",objectFit:"cover"}} />
                        ) : (
                          <div style={{fontSize:isGolput||isNetral?80:120,filter:"grayscale(1) opacity(0.2)"}}>{isGolput?"⬜":isNetral?"➖":"👤"}</div>
                        )}
                        <div style={{position:"absolute",inset:0,background:"linear-gradient(to top, rgba(255,255,255,0.9), transparent)"}}/>
                      </div>
                      <div style={{padding:"24px 32px",textAlign:"center",marginTop:-40,position:"relative",zIndex:2}}>
                        <div style={{fontSize:24,fontWeight:900,color:Colors.bgDarkGreen,marginBottom:16,textShadow:"0 2px 4px white"}}>{nama}</div>
                        <button style={{width:"100%",padding:"16px",borderRadius:16,background:Colors.bgCreme,color:Colors.greenPrimary,border:`2px dashed ${Colors.greenPrimary}`,fontSize:15,fontWeight:900,letterSpacing:"0.05em",cursor:"pointer"}}>COBLOS KANDIDAT</button>
                      </div>
                    </div>
                  );
                }

                // Layout Musyawarah (Balok Horisontal Formal)
                return (
                  <div key={p.id} onClick={() => setKonfirmasiSuara(p)} style={{background:"white",border:`2px solid ${isNetral?Colors.bgCreme:Colors.greenPrimary}`,borderRadius:24,padding:"32px 40px",cursor:"pointer",display:"flex",alignItems:"center",justifyContent:"space-between",boxShadow:"0 10px 25px rgba(0,0,0,0.05)",transition:"all 0.2s"}}>
                    <div style={{display:"flex",alignItems:"center",gap:24}}>
                      <div style={{width:60,height:60,borderRadius:"50%",background:Colors.bgCreme,display:"flex",alignItems:"center",justifyContent:"center",fontSize:24}}>{isNetral?"⚖️":nama.toLowerCase().includes("tidak")?"❌":"✅"}</div>
                      <div style={{fontSize:24,fontWeight:900,color:Colors.bgDarkGreen}}>{nama}</div>
                    </div>
                    <button style={{padding:"16px 32px",borderRadius:16,background:Colors.greenPrimary,color:"white",border:"none",fontSize:16,fontWeight:900,cursor:"pointer",boxShadow:`0 8px 20px rgba(45,90,64,0.2)`}}>Dukung Opsi Ini</button>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </main>

      <style>{`
        @keyframes pulse { 0%, 100% { opacity: 1; transform: scale(1); } 50% { opacity: 0.5; transform: scale(1.1); } }
        @keyframes zoomIn { from { opacity: 0; transform: scale(0.95); } to { opacity: 1; transform: scale(1); } }
        @keyframes slideDown { from { opacity: 0; transform: translate(-50%, -20px); } to { opacity: 1; transform: translate(-50%, 0); } }
        @keyframes slideUp { from { opacity: 0; transform: translateY(40px); } to { opacity: 1; transform: translateY(0); } }
      `}</style>
    </div>
  );
}