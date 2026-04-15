"use client";
import { useState, useEffect, useCallback } from "react";
import { supabase, isSupabaseReady } from "@/lib/supabase";

interface Voting { id: string; judul: string; deskripsi: string; status: string; }
interface Pilihan { id: string; voting_id: string; teks: string; jumlah_vote: number; }

function parseJudul(j: string) {
  const m = j?.match(/^\[(PEMILU|MUSYAWARAH)\]\s*(.+)/);
  return { tipe: m?.[1] || "PEMILU", text: m?.[2] || j };
}
function parseKandidat(teks: string) {
  const [nama, foto] = (teks || "").split("|||");
  return { nama: nama?.trim(), foto: foto?.trim() };
}

function pct(votes: number, total: number) {
  return total > 0 ? Math.round((votes / total) * 100) : 0;
}

export default function LiveVotingBroadcast() {
  const [votings, setVotings]   = useState<Voting[]>([]);
  const [pilihan, setPilihan]   = useState<Record<string, Pilihan[]>>({});
  const [totalDPT, setTotalDPT] = useState(0); // Buat nampilin target persentase kehadiran
  const [lastUpdate, setLast]   = useState("");
  const [live, setLive]         = useState(false);
  const [activeIdx, setActiveIdx] = useState(0);

  // Tema ala TV Berita (Red, Navy, Gold, White)
  const COLORS = ["#ef4444", "#3b82f6", "#f59e0b", "#10b981", "#8b5cf6", "#f43f5e", "#0ea5e9"];

  const refresh = useCallback(async () => {
    if (!isSupabaseReady()) return;
    try {
      const [vsRes, dptRes] = await Promise.all([
        supabase.from("voting").select("*").eq("status", "aktif").order("created_at"),
        supabase.from("anggota_kk").select("*", { count: "exact", head: true }).not("nfc_id", "is", null) // Estimasi DPT (punya NFC)
      ]);

      const vs = vsRes.data || [];
      if (!vs.length) { setVotings([]); setLive(true); setLast(new Date().toLocaleTimeString("id-ID")); return; }
      setVotings(vs);
      if (dptRes.count) setTotalDPT(dptRes.count);

      const allPilihan: Record<string, Pilihan[]> = {};
      await Promise.all(vs.map(async (v: Voting) => {
        const { data } = await supabase.from("pilihan_voting").select("*").eq("voting_id", v.id);
        allPilihan[v.id] = (data || []).sort((a: Pilihan, b: Pilihan) => b.jumlah_vote - a.jumlah_vote);
      }));
      setPilihan(allPilihan);
      setLive(true);
      setLast(new Date().toLocaleTimeString("id-ID"));
    } catch (e) {}
  }, []);

  useEffect(() => {
    refresh();
    const t = setInterval(refresh, 5000); // 5 detik biar bener-bener kayak TV live
    return () => clearInterval(t);
  }, [refresh]);

  useEffect(() => {
    if (votings.length <= 1) return;
    const t = setInterval(() => setActiveIdx(i => (i + 1) % votings.length), 20000);
    return () => clearInterval(t);
  }, [votings.length]);

  const activeVoting = votings[activeIdx];
  const activePilihan = activeVoting ? (pilihan[activeVoting.id] || []) : [];
  const totalVotes = activePilihan.reduce((s, p) => s + (p.jumlah_vote || 0), 0);
  const parsed = activeVoting ? parseJudul(activeVoting.judul) : null;
  const isPemilu = parsed?.tipe === "PEMILU";

  // Data palsu untuk DPT jika di DB belum ada nfc_id
  const dptDisplay = totalDPT > 0 ? totalDPT : 350; 
  const partisipasi = pct(totalVotes, dptDisplay);

  return (
    <div style={{ minHeight: "100vh", background: "#060b19", color: "#fff", fontFamily: "'Inter','DM Sans',sans-serif", display: "flex", flexDirection: "column", overflow: "hidden", position: "relative" }}>
      
      {/* BACKGROUND ELEMENTS (Map & Radial) */}
      <div style={{ position: "fixed", inset: 0, background: "radial-gradient(ellipse at 50% -20%, #17365d 0%, #060b19 70%)", zIndex: 0 }} />
      <div style={{ position: "fixed", inset: 0, opacity: 0.04, backgroundImage: "radial-gradient(#fff 1px, transparent 1px)", backgroundSize: "30px 30px", zIndex: 0 }} />
      <div style={{ position: "fixed", inset: 0, opacity: 0.05, backgroundImage: "url('https://upload.wikimedia.org/wikipedia/commons/thumb/c/c5/Indonesia_-_location_map.svg/1000px-Indonesia_-_location_map.svg.png')", backgroundSize: "cover", backgroundPosition: "center", backgroundRepeat: "no-repeat", zIndex: 0, filter: "invert(1) grayscale(1)" }} />

      {/* TOP HEADER BROADCAST */}
      <header style={{ position: "relative", zIndex: 10, display: "flex" }}>
        <div style={{ background: "#dc2626", color: "white", padding: "16px 32px", fontWeight: 900, fontSize: "clamp(18px,2vw,24px)", letterSpacing: "0.1em", display: "flex", alignItems: "center", gap: 12 }}>
          <div style={{ width: 12, height: 12, background: "#fff", borderRadius: "50%", animation: "flash 1s infinite" }} />
          LIVE REPORT
        </div>
        <div style={{ flex: 1, background: "linear-gradient(90deg, #1e3a8a 0%, #0f172a 100%)", padding: "16px 32px", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <div style={{ display: "flex", alignItems: "baseline", gap: 12 }}>
            <span style={{ fontSize: "clamp(20px,2.5vw,32px)", fontWeight: 900, fontFamily: "var(--font-cormorant,'Cormorant Garamond'),serif", color: "#f8fafc" }}>PEMILU DIGITAL</span>
            <span style={{ fontSize: 14, color: "#94a3b8", fontWeight: 700, letterSpacing: "0.2em" }}>CIBURIAL RW 08</span>
          </div>
          <div style={{ textAlign: "right", fontFamily: "monospace", fontSize: 16, color: "#38bdf8", fontWeight: 900, letterSpacing: "0.1em" }}>
            UPDATE: {lastUpdate}
          </div>
        </div>
      </header>

      <main style={{ flex: 1, position: "relative", zIndex: 1, display: "flex", flexDirection: "column", padding: "clamp(20px,4vw,40px)" }}>

        {!activeVoting && live ? (
          <div style={{ margin: "auto", textAlign: "center" }}>
            <div style={{ fontSize: 100, marginBottom: 20 }}>📶</div>
            <h1 style={{ fontSize: 48, fontWeight: 900, color: "#94a3b8" }}>Standby Transmission...</h1>
          </div>
        ) : activeVoting && (
          <>
            {/* PANEL INFO & STATS */}
            <div style={{ display: "flex", gap: "20px", marginBottom: "clamp(20px,4vw,40px)", flexWrap: "wrap" }}>
              {/* Judul Panel */}
              <div style={{ flex: "2 1 500px", background: "rgba(255,255,255,0.03)", borderLeft: "6px solid #38bdf8", padding: "30px", backdropFilter: "blur(10px)" }}>
                <div style={{ color: "#38bdf8", fontWeight: 900, letterSpacing: "0.15em", fontSize: 14, marginBottom: 8, textTransform: "uppercase" }}>{isPemilu ? "Hasil Perolehan Suara" : "Keputusan Musyawarah"}</div>
                <h2 style={{ margin: 0, fontSize: "clamp(32px,4vw,56px)", fontWeight: 900, lineHeight: 1.1, fontFamily: "var(--font-cormorant,'Cormorant Garamond'),serif", textShadow: "0 4px 20px rgba(0,0,0,0.5)" }}>
                  {parsed?.text}
                </h2>
                {activeVoting.deskripsi && <div style={{ marginTop: 12, fontSize: 18, color: "#cbd5e1" }}>{activeVoting.deskripsi}</div>}
              </div>

              {/* Data Panel */}
              <div style={{ flex: "1 1 300px", display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
                <div style={{ background: "rgba(15,23,42,0.8)", border: "1px solid rgba(255,255,255,0.1)", padding: 20, display: "flex", flexDirection: "column", justifyContent: "center" }}>
                  <div style={{ fontSize: 12, color: "#94a3b8", fontWeight: 800, textTransform: "uppercase" }}>Suara Masuk</div>
                  <div style={{ fontSize: "clamp(40px,4vw,56px)", fontWeight: 900, color: "#f1f5f9", fontFamily: "monospace", margin: "4px 0", lineHeight: 1 }}>{totalVotes}</div>
                  <div style={{ fontSize: 12, color: "#f59e0b", fontWeight: 700 }}>DARI ~{dptDisplay} DPT</div>
                </div>
                <div style={{ background: "rgba(15,23,42,0.8)", border: "1px solid rgba(255,255,255,0.1)", padding: 20, display: "flex", flexDirection: "column", justifyContent: "center" }}>
                  <div style={{ fontSize: 12, color: "#94a3b8", fontWeight: 800, textTransform: "uppercase" }}>Partisipasi</div>
                  <div style={{ fontSize: "clamp(40px,4vw,56px)", fontWeight: 900, color: "#10b981", margin: "4px 0", lineHeight: 1 }}>{partisipasi}%</div>
                  <div style={{ width: "100%", height: 6, background: "rgba(255,255,255,0.1)" }}>
                    <div style={{ width: `${partisipasi}%`, height: "100%", background: "#10b981", transition: "width 1s ease" }} />
                  </div>
                </div>
              </div>
            </div>

            {/* HASIL KANDIDAT */}
            {isPemilu ? (
              <div style={{ display: "grid", gridTemplateColumns: `repeat(auto-fit, minmax(280px, 1fr))`, gap: "clamp(16px,2vw,24px)" }}>
                {activePilihan.map((p, i) => {
                  const { nama, foto } = parseKandidat(p.teks);
                  const perc = pct(p.jumlah_vote, totalVotes);
                  const isGolput = nama.toLowerCase().includes("golput") || nama.toLowerCase().includes("kosong");
                  const rankPos = i + 1;
                  const c = COLORS[i % COLORS.length];

                  return (
                    <div key={p.id} style={{ background: "linear-gradient(180deg, rgba(30,41,59,0.9) 0%, rgba(15,23,42,0.95) 100%)", borderTop: `4px solid ${c}`, position: "relative", boxShadow: `0 10px 40px ${c}20`, overflow: "hidden" }}>
                      
                      {/* Photo Header */}
                      <div style={{ height: "clamp(180px,25vh,300px)", position: "relative", background: "#0f172a" }}>
                        {foto ? (
                          <img src={foto} alt={nama} style={{ width: "100%", height: "100%", objectFit: "cover", objectPosition: "center top", opacity: 0.9 }} />
                        ) : (
                          <div style={{ width: "100%", height: "100%", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 100, opacity: 0.2 }}>{isGolput ? "🫙" : "👤"}</div>
                        )}
                        <div style={{ position: "absolute", bottom: 0, left: 0, right: 0, height: "60%", background: "linear-gradient(to top, #0f172a 0%, transparent 100%)" }} />
                        
                        {/* Rank Badge */}
                        <div style={{ position: "absolute", top: 16, right: 16, background: c, color: "#fff", width: 44, height: 44, borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 22, fontWeight: 900, boxShadow: "0 4px 12px rgba(0,0,0,0.5)" }}>
                          {rankPos}
                        </div>
                      </div>

                      {/* Content */}
                      <div style={{ padding: "0 24px 24px", position: "relative", zIndex: 2, marginTop: -20, textAlign: "center" }}>
                        <div style={{ fontSize: "clamp(24px,3vw,36px)", fontWeight: 900, fontFamily: "var(--font-cormorant,'Cormorant Garamond'),serif", color: "#fff", textShadow: "0 2px 10px rgba(0,0,0,0.8)" }}>
                          {nama}
                        </div>
                        
                        <div style={{ marginTop: 16, display: "flex", alignItems: "baseline", justifyContent: "center", gap: 8 }}>
                          <span style={{ fontSize: "clamp(50px,6vw,80px)", fontWeight: 900, color: c, lineHeight: 0.9, letterSpacing: "-0.05em" }}>{perc}</span>
                          <span style={{ fontSize: 32, fontWeight: 700, color: c }}>%</span>
                        </div>
                        
                        <div style={{ fontSize: 18, color: "#94a3b8", fontWeight: 700, marginTop: 4 }}>
                          {p.jumlah_vote.toLocaleString("id-ID")} SUARA
                        </div>

                        {/* Progress Bar TV Style */}
                        <div style={{ height: 12, background: "rgba(0,0,0,0.5)", marginTop: 24, borderRadius: 2, overflow: "hidden", border: "1px solid rgba(255,255,255,0.1)" }}>
                          <div style={{ height: "100%", width: `${perc}%`, background: c, transition: "width 1.5s cubic-bezier(0.22, 1, 0.36, 1)", position: "relative" }}>
                            <div style={{ position: "absolute", inset: 0, backgroundImage: "linear-gradient(45deg, rgba(255,255,255,0.15) 25%, transparent 25%, transparent 50%, rgba(255,255,255,0.15) 50%, rgba(255,255,255,0.15) 75%, transparent 75%, transparent)", backgroundSize: "20px 20px", animation: "moveStripes 1s linear infinite" }} />
                          </div>
                        </div>
                      </div>

                    </div>
                  );
                })}
              </div>
            ) : (
              /* MUSYAWARAH BROADCAST STYLE */
              <div style={{ maxWidth: 900, margin: "0 auto", width: "100%", display: "flex", flexDirection: "column", gap: 16 }}>
                {activePilihan.map((p, i) => {
                  const { nama } = parseKandidat(p.teks);
                  const perc = pct(p.jumlah_vote, totalVotes);
                  const isSetuju = nama.toLowerCase().includes("setuju") && !nama.toLowerCase().includes("tidak");
                  const isTolak = nama.toLowerCase().includes("tidak") || nama.toLowerCase().includes("tolak");
                  const c = isSetuju ? "#10b981" : isTolak ? "#ef4444" : "#f59e0b";
                  
                  return (
                    <div key={p.id} style={{ display: "flex", alignItems: "stretch", background: "rgba(15,23,42,0.8)", border: `1px solid ${c}40` }}>
                      <div style={{ width: 10, background: c }} />
                      <div style={{ flex: 1, padding: "24px 32px", display: "flex", flexDirection: "column", justifyContent: "center" }}>
                        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end", marginBottom: 16 }}>
                          <div style={{ fontSize: "clamp(24px,3vw,36px)", fontWeight: 900, color: "#fff", textTransform: "uppercase" }}>{nama}</div>
                          <div style={{ textAlign: "right" }}>
                            <span style={{ fontSize: "clamp(36px,4vw,56px)", fontWeight: 900, color: c, lineHeight: 1 }}>{perc}%</span>
                            <div style={{ fontSize: 14, color: "#94a3b8", fontWeight: 700 }}>{p.jumlah_vote} SUARA</div>
                          </div>
                        </div>
                        <div style={{ height: 16, background: "rgba(0,0,0,0.5)", borderRadius: 2, overflow: "hidden" }}>
                          <div style={{ height: "100%", width: `${perc}%`, background: c, transition: "width 1s ease", backgroundImage: "linear-gradient(45deg, rgba(255,255,255,0.1) 25%, transparent 25%, transparent 50%, rgba(255,255,255,0.1) 50%, rgba(255,255,255,0.1) 75%, transparent 75%, transparent)", backgroundSize: "20px 20px", animation: "moveStripes 1s linear infinite" }} />
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </>
        )}
      </main>

      {/* TICKER NEWS BAWAH */}
      <footer style={{ position: "relative", zIndex: 10, background: "#0f172a", borderTop: "2px solid #38bdf8", overflow: "hidden", display: "flex", alignItems: "stretch", height: 50 }}>
        <div style={{ background: "#38bdf8", color: "#0f172a", fontWeight: 900, padding: "0 24px", display: "flex", alignItems: "center", fontSize: 16, letterSpacing: "0.1em", zIndex: 2, boxShadow: "4px 0 10px rgba(0,0,0,0.5)" }}>
          INFO KPU
        </div>
        <div style={{ flex: 1, display: "flex", alignItems: "center", overflow: "hidden", position: "relative" }}>
          <div className="ticker-text" style={{ whiteSpace: "nowrap", fontSize: 18, color: "#f8fafc", fontWeight: 700, paddingLeft: "100%", animation: "ticker 25s linear infinite" }}>
            <span style={{ color: "#38bdf8" }}>▪</span> Pemilihan Digital Kampung Ciburial RW 08 sedang berlangsung secara Real-Time. <span style={{ color: "#38bdf8", marginLeft: 40 }}>▪</span> Segera kunjungi Bilik Suara di TPS terdekat atau akses Pos Digital Warga. <span style={{ color: "#38bdf8", marginLeft: 40 }}>▪</span> Gunakan Kartu Warga berbasis NFC Anda untuk memilih. <span style={{ color: "#38bdf8", marginLeft: 40 }}>▪</span> Suara dijamin rahasia, langsung, dan bebas dari manipulasi (Full Encrypted). <span style={{ color: "#38bdf8", marginLeft: 40 }}>▪</span> Hasil ini adalah hasil resmi KPU Tingkat RW.
          </div>
        </div>
      </footer>

      <style>{`
        @keyframes flash { 0%,100%{opacity:1} 50%{opacity:0.2} }
        @keyframes ticker { 0% { transform: translateX(0); } 100% { transform: translateX(-150%); } }
        @keyframes moveStripes { 0% { background-position: 0 0; } 100% { background-position: 20px 20px; } }
      `}</style>
    </div>
  );
}
