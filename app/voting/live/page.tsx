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

export default function LiveVotingPage() {
  const [votings, setVotings]   = useState<Voting[]>([]);
  const [pilihan, setPilihan]   = useState<Record<string, Pilihan[]>>({});
  const [lastUpdate, setLast]   = useState("");
  const [live, setLive]         = useState(false);
  const [activeIdx, setActiveIdx] = useState(0);

  const COLORS = ["#4ade80","#60a5fa","#f59e0b","#f472b6","#a78bfa","#34d399","#fb923c","#e879f9"];
  const MEDAL = ["🥇","🥈","🥉"];

  const refresh = useCallback(async () => {
    if (!isSupabaseReady()) return;
    const { data: vs } = await supabase
      .from("voting").select("*").eq("status", "aktif").order("created_at");
    if (!vs?.length) { setVotings([]); setLive(true); setLast(new Date().toLocaleTimeString("id-ID")); return; }
    setVotings(vs);

    const allPilihan: Record<string, Pilihan[]> = {};
    await Promise.all(vs.map(async (v: Voting) => {
      const { data } = await supabase.from("pilihan_voting").select("*").eq("voting_id", v.id);
      allPilihan[v.id] = (data || []).sort((a: Pilihan, b: Pilihan) => b.jumlah_vote - a.jumlah_vote);
    }));
    setPilihan(allPilihan);
    setLive(true);
    setLast(new Date().toLocaleTimeString("id-ID"));
  }, []);

  useEffect(() => {
    refresh();
    const t = setInterval(refresh, 10000); // Auto-refresh tiap 10 detik
    return () => clearInterval(t);
  }, [refresh]);

  // Auto-rotate agenda jika lebih dari 1
  useEffect(() => {
    if (votings.length <= 1) return;
    const t = setInterval(() => setActiveIdx(i => (i + 1) % votings.length), 15000);
    return () => clearInterval(t);
  }, [votings.length]);

  const activeVoting = votings[activeIdx];
  const activePilihan = activeVoting ? (pilihan[activeVoting.id] || []) : [];
  const totalVotes = activePilihan.reduce((s, p) => s + (p.jumlah_vote || 0), 0);
  const parsed = activeVoting ? parseJudul(activeVoting.judul) : null;
  const isPemilu = parsed?.tipe === "PEMILU";

  return (
    <div style={{ minHeight: "100vh", background: "#0a1a0f", color: "#f5f0e8", fontFamily: "var(--font-dm-sans,'DM Sans'),system-ui,sans-serif", display: "flex", flexDirection: "column" }}>

      {/* Background */}
      <div style={{ position: "fixed", inset: 0, backgroundImage: `radial-gradient(ellipse at 20% 20%, rgba(45,90,64,0.35) 0%, transparent 60%), radial-gradient(ellipse at 80% 80%, rgba(184,148,63,0.12) 0%, transparent 60%)`, pointerEvents: "none" }} />

      {/* TOP BAR */}
      <header style={{ position: "sticky", top: 0, zIndex: 50, background: "rgba(10,26,15,0.95)", backdropFilter: "blur(12px)", borderBottom: "1px solid rgba(74,222,128,0.15)", padding: "16px clamp(16px,3vw,40px)", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
          <div style={{ fontSize: "clamp(18px,3vw,28px)", fontWeight: 900, color: "#4ade80", fontFamily: "var(--font-cormorant,'Cormorant Garamond'),serif", letterSpacing: "-0.02em" }}>
            🌿 KPU Digital Ciburial RW 08
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 6, background: "rgba(74,222,128,0.12)", border: "1px solid rgba(74,222,128,0.25)", borderRadius: 99, padding: "5px 14px" }}>
            <div style={{ width: 7, height: 7, borderRadius: "50%", background: live ? "#4ade80" : "#666", animation: live ? "dashPulse 1.5s infinite" : "none" }} />
            <span style={{ fontSize: 11, color: "#4ade80", fontWeight: 700, letterSpacing: "0.12em", textTransform: "uppercase" }}>{live ? `Live — ${lastUpdate}` : "Terhubung…"}</span>
          </div>
        </div>
        <div style={{ fontSize: 12, color: "rgba(255,255,255,0.4)" }}>
          🔄 Auto-refresh tiap 10 detik
        </div>
      </header>

      <main style={{ flex: 1, padding: "clamp(24px,4vw,48px) clamp(16px,4vw,40px)", position: "relative", zIndex: 1, maxWidth: 1400, margin: "0 auto", width: "100%" }}>

        {/* Tidak ada voting aktif */}
        {!activeVoting && live && (
          <div style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", minHeight: "60vh", gap: 20 }}>
            <div style={{ fontSize: 80 }}>🗳️</div>
            <h1 style={{ fontSize: "clamp(24px,4vw,48px)", fontWeight: 300, color: "#f5f0e8", fontFamily: "var(--font-cormorant,'Cormorant Garamond'),serif", textAlign: "center" }}>
              Belum ada voting aktif<br /><em style={{ color: "#4ade80" }}>saat ini</em>
            </h1>
            <p style={{ color: "rgba(255,255,255,0.4)", fontSize: 16, textAlign: "center" }}>Administrator akan mengaktifkan agenda voting sebentar lagi.</p>
          </div>
        )}

        {/* Tab agenda */}
        {votings.length > 1 && (
          <div style={{ display: "flex", gap: 10, marginBottom: 28, flexWrap: "wrap" }}>
            {votings.map((v, i) => {
              const p = parseJudul(v.judul);
              return (
                <button key={v.id} onClick={() => setActiveIdx(i)}
                  style={{ padding: "10px 20px", borderRadius: 12, fontSize: 13, fontWeight: 700, border: `2px solid ${i === activeIdx ? "#4ade80" : "rgba(255,255,255,0.1)"}`, background: i === activeIdx ? "rgba(74,222,128,0.12)" : "transparent", color: i === activeIdx ? "#4ade80" : "rgba(255,255,255,0.5)", cursor: "pointer", transition: "all 0.2s" }}>
                  {p.tipe === "PEMILU" ? "🗳️" : "⚖️"} {p.text}
                </button>
              );
            })}
          </div>
        )}

        {activeVoting && (
          <div>
            {/* Judul voting */}
            <div style={{ textAlign: "center", marginBottom: 40 }}>
              <div style={{ display: "inline-block", background: isPemilu ? "rgba(74,222,128,0.12)" : "rgba(184,148,63,0.12)", border: `1px solid ${isPemilu ? "rgba(74,222,128,0.3)" : "rgba(184,148,63,0.3)"}`, borderRadius: 99, padding: "6px 18px", fontSize: 12, fontWeight: 800, letterSpacing: "0.12em", color: isPemilu ? "#4ade80" : "#b8943f", marginBottom: 16 }}>
                {isPemilu ? "🗳️ PEMILIHAN DIGITAL" : "⚖️ MUSYAWARAH DIGITAL"}
              </div>
              <h1 style={{ margin: "0 0 8px", fontSize: "clamp(28px,5vw,64px)", fontWeight: 300, color: "#f5f0e8", fontFamily: "var(--font-cormorant,'Cormorant Garamond'),serif", letterSpacing: "-0.02em", lineHeight: 1.1 }}>
                {parsed?.text}
              </h1>
              {activeVoting.deskripsi && <p style={{ color: "rgba(255,255,255,0.45)", fontSize: 16 }}>{activeVoting.deskripsi}</p>}
              <div style={{ marginTop: 16, fontSize: 20, fontWeight: 900, color: "#f5f0e8" }}>
                <span style={{ fontFamily: "var(--font-cormorant,'Cormorant Garamond'),serif", fontSize: "clamp(28px,4vw,48px)", fontWeight: 300 }}>{totalVotes}</span>
                <span style={{ fontSize: 14, color: "rgba(255,255,255,0.4)", marginLeft: 8 }}>suara masuk</span>
              </div>
            </div>

            {/* Hasil Voting */}
            {activePilihan.length === 0 ? (
              <div style={{ textAlign: "center", padding: 48, color: "rgba(255,255,255,0.3)", fontSize: 18 }}>Menunggu suara masuk…</div>
            ) : isPemilu ? (
              /* PEMILU — Card Grid Besar */
              <div style={{ display: "grid", gridTemplateColumns: `repeat(auto-fit,minmax(clamp(220px,28vw,340px),1fr))`, gap: 24 }}>
                {activePilihan.map((p, i) => {
                  const { nama, foto } = parseKandidat(p.teks);
                  const perc = pct(p.jumlah_vote, totalVotes);
                  const isGolput = nama.toLowerCase().includes("golput") || nama.toLowerCase().includes("kosong") || nama.toLowerCase().includes("netral");
                  const isLeading = i === 0 && p.jumlah_vote > 0;
                  return (
                    <div key={p.id} style={{ background: isLeading ? "rgba(74,222,128,0.08)" : "rgba(255,255,255,0.04)", border: `2px solid ${isLeading ? "#4ade80" : "rgba(255,255,255,0.1)"}`, borderRadius: 28, overflow: "hidden", position: "relative", transition: "transform 0.3s" }}>
                      {isLeading && <div style={{ position: "absolute", top: 12, right: 12, background: "#4ade80", color: "#0a1a0f", borderRadius: 99, padding: "4px 12px", fontSize: 11, fontWeight: 900 }}>UNGGUL</div>}
                      {/* Foto */}
                      <div style={{ height: "clamp(140px,22vw,260px)", background: "rgba(255,255,255,0.03)", display: "flex", alignItems: "center", justifyContent: "center", position: "relative" }}>
                        {foto ? (
                          <img src={foto} alt={nama} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                        ) : (
                          <div style={{ fontSize: "clamp(60px,10vw,120px)", opacity: 0.15 }}>{isGolput ? "🫙" : "👤"}</div>
                        )}
                        <div style={{ position: "absolute", top: 12, left: 12, background: "rgba(0,0,0,0.6)", borderRadius: 12, padding: "4px 10px", fontSize: 13, fontWeight: 900, color: "white" }}>{MEDAL[i] || `#${i+1}`}</div>
                      </div>
                      {/* Info */}
                      <div style={{ padding: "20px 24px" }}>
                        <div style={{ fontSize: "clamp(16px,2.5vw,24px)", fontWeight: 900, color: "#f5f0e8", marginBottom: 16, fontFamily: "var(--font-cormorant,'Cormorant Garamond'),serif" }}>{nama}</div>
                        {/* Progress bar */}
                        <div style={{ background: "rgba(255,255,255,0.08)", borderRadius: 99, height: 10, overflow: "hidden", marginBottom: 8 }}>
                          <div style={{ width: `${perc}%`, height: "100%", background: COLORS[i], borderRadius: 99, transition: "width 1.2s cubic-bezier(0.34,1.56,0.64,1)" }} />
                        </div>
                        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                          <span style={{ fontSize: "clamp(28px,5vw,56px)", fontWeight: 300, color: COLORS[i], fontFamily: "var(--font-cormorant,'Cormorant Garamond'),serif", lineHeight: 1 }}>{perc}%</span>
                          <span style={{ fontSize: 14, color: "rgba(255,255,255,0.4)", fontWeight: 700 }}>{p.jumlah_vote} suara</span>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              /* MUSYAWARAH — Horizontal bars besar */
              <div style={{ display: "flex", flexDirection: "column", gap: 20, maxWidth: 800, margin: "0 auto" }}>
                {activePilihan.map((p, i) => {
                  const { nama } = parseKandidat(p.teks);
                  const perc = pct(p.jumlah_vote, totalVotes);
                  const isSetuju = nama.toLowerCase().includes("setuju") && !nama.toLowerCase().includes("tidak");
                  const isTolak = nama.toLowerCase().includes("tidak") || nama.toLowerCase().includes("tolak");
                  const col = isSetuju ? "#4ade80" : isTolak ? "#f87171" : "#b8943f";
                  return (
                    <div key={p.id} style={{ background: "rgba(255,255,255,0.05)", border: `2px solid ${col}30`, borderRadius: 24, padding: "clamp(20px,3vw,32px)" }}>
                      <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 16, alignItems: "center" }}>
                        <span style={{ fontSize: "clamp(20px,3vw,36px)", fontWeight: 900, color: col, fontFamily: "var(--font-cormorant,'Cormorant Garamond'),serif" }}>{nama}</span>
                        <span style={{ fontSize: "clamp(16px,2.5vw,28px)", fontWeight: 700, color: "rgba(255,255,255,0.6)" }}>{p.jumlah_vote} suara</span>
                      </div>
                      <div style={{ background: "rgba(255,255,255,0.06)", borderRadius: 99, height: "clamp(14px,2vw,24px)", overflow: "hidden" }}>
                        <div style={{ width: `${perc}%`, height: "100%", background: col, borderRadius: 99, transition: "width 1.5s cubic-bezier(0.34,1.56,0.64,1)", display: "flex", alignItems: "center", justifyContent: "flex-end", paddingRight: 12 }}>
                          {perc > 10 && <span style={{ fontSize: 12, fontWeight: 900, color: "rgba(0,0,0,0.6)" }}>{perc}%</span>}
                        </div>
                      </div>
                      <div style={{ fontSize: 32, fontWeight: 300, color: col, marginTop: 10, fontFamily: "var(--font-cormorant,'Cormorant Garamond'),serif" }}>{perc}%</div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}
      </main>

      {/* FOOTER */}
      <footer style={{ borderTop: "1px solid rgba(255,255,255,0.06)", padding: "16px clamp(16px,3vw,40px)", display: "flex", justifyContent: "space-between", alignItems: "center", fontSize: 12, color: "rgba(255,255,255,0.25)", position: "relative", zIndex: 1 }}>
        <span>🔒 Sistem Pemungutan Suara Digital Terenkripsi — Kampung Ciburial RW 08</span>
        <span>Data diperbarui tiap 10 detik secara otomatis</span>
      </footer>

      <style>{`@keyframes dashPulse{0%,100%{opacity:1;transform:scale(1)}50%{opacity:.5;transform:scale(1.3)}}`}</style>
    </div>
  );
}
