"use client";
import { useState, useEffect } from "react";
import { supabase, isSupabaseReady } from "@/lib/supabase";

interface Voting { id: string; judul: string; deskripsi: string; tgl_mulai: string; tgl_selesai: string; status: string; }
interface Pilihan { id: string; voting_id: string; teks: string; jumlah_suara: number; }

export default function VotingPage() {
  const [votings, setVotings] = useState<Voting[]>([]);
  const [pilihanMap, setPilihanMap] = useState<Record<string, Pilihan[]>>({});
  const [voted, setVoted] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState<string | null>(null);
  const [toast, setToast] = useState("");

  function showToast(msg: string) { setToast(msg); setTimeout(() => setToast(""), 3000); }

  async function fetchData() {
    if (!isSupabaseReady()) return;
    const { data: vData } = await supabase.from("voting").select("*").eq("status", "aktif").order("tgl_mulai", { ascending: false });
    if (!vData) return;
    setVotings(vData as Voting[]);
    const pm: Record<string, Pilihan[]> = {};
    await Promise.all(vData.map(async (v) => {
      const { data: p } = await supabase.from("pilihan_voting").select("*").eq("voting_id", v.id);
      if (p) pm[v.id] = p as Pilihan[];
    }));
    setPilihanMap(pm);
  }

  useEffect(() => { fetchData(); }, []);

  async function handleVote(votingId: string, pilihanId: string) {
    if (voted[votingId]) return showToast("Kamu sudah vote!");
    setLoading(pilihanId);
    await supabase.from("suara_voting").insert({ voting_id: votingId, pilihan_id: pilihanId });
    // fallback: manual increment jumlah suara
    const current = pilihanMap[votingId]?.find(p => p.id === pilihanId);
    if (current) {
      await supabase
        .from("pilihan_voting")
        .update({ jumlah_suara: (current.jumlah_suara || 0) + 1 })
        .eq("id", pilihanId);
    }
    setVoted({ ...voted, [votingId]: pilihanId });
    showToast("✅ Suara kamu tercatat!");
    setLoading(null);
    fetchData();
  }

  function totalSuara(vId: string) { return (pilihanMap[vId] || []).reduce((s, p) => s + (p.jumlah_suara || 0), 0); }
  function persen(suara: number, total: number) { return total === 0 ? 0 : Math.round((suara / total) * 100); }
  function sisa(tgl: string) {
    const diff = new Date(tgl).getTime() - new Date().getTime();
    if (diff <= 0) return "Berakhir";
    const hari = Math.floor(diff / (1000 * 60 * 60 * 24));
    return hari === 0 ? "Hari ini berakhir" : `${hari} hari lagi`;
  }

  return (
    <div style={{ minHeight: "100vh", background: "#f5f0e8", fontFamily: "'Segoe UI',system-ui,sans-serif" }}>
      {toast && (
        <div style={{ position: "fixed", top: 20, left: "50%", transform: "translateX(-50%)", background: "#2d5a40", color: "white", padding: "10px 20px", borderRadius: 12, zIndex: 999, fontSize: 14, boxShadow: "0 4px 20px rgba(0,0,0,0.15)" }}>{toast}</div>
      )}

      <header style={{ background: "#f5f0e8", borderBottom: "1px solid rgba(45,90,64,0.12)", padding: "14px 20px", position: "sticky", top: 0, zIndex: 10, display: "flex", alignItems: "center", gap: 12 }}>
        <a href="/" style={{ color: "#6b7c6d", textDecoration: "none", fontSize: 13 }}>← Beranda</a>
        <span style={{ color: "#c8bfaa" }}>|</span>
        <div>
          <div style={{ fontWeight: 800, fontSize: 15, color: "#1a2e1f" }}>🗳️ Voting & Musyawarah</div>
          <div style={{ fontSize: 10, color: "#7a9a7e", textTransform: "uppercase", letterSpacing: "0.08em" }}>Suara Warga Ciburial</div>
        </div>
      </header>

      <div style={{ maxWidth: 700, margin: "0 auto", padding: "24px 16px" }}>

        {votings.length === 0 ? (
          <div style={{
            background: "white", borderRadius: 20, padding: 60,
            textAlign: "center", border: "1px solid rgba(45,90,64,0.1)",
          }}>
            <div style={{ fontSize: 48, marginBottom: 16 }}>🗳️</div>
            <h2 style={{ color: "#1a2e1f", margin: "0 0 8px" }}>Belum Ada Voting Aktif</h2>
            <p style={{ color: "#6b7c6d", margin: 0 }}>Voting akan muncul di sini saat admin membuat agenda musyawarah.</p>
          </div>
        ) : votings.map(v => {
          const pilihan = pilihanMap[v.id] || [];
          const total = totalSuara(v.id);
          const sudahVote = !!voted[v.id];

          return (
            <div key={v.id} style={{
              background: "white", borderRadius: 20, padding: 24, marginBottom: 20,
              border: "1px solid rgba(45,90,64,0.12)",
              boxShadow: "0 2px 12px rgba(0,0,0,0.06)",
            }}>
              {/* Header voting */}
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 16 }}>
                <div style={{ flex: 1 }}>
                  <h2 style={{ margin: "0 0 6px", color: "#1a2e1f", fontSize: 18, fontWeight: 800 }}>{v.judul}</h2>
                  {v.deskripsi && <p style={{ margin: 0, color: "#6b7c6d", fontSize: 13, lineHeight: 1.5 }}>{v.deskripsi}</p>}
                </div>
                <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-end", gap: 6, marginLeft: 12 }}>
                  <div style={{ background: "rgba(45,90,64,0.1)", color: "#2d5a40", borderRadius: 20, padding: "4px 12px", fontSize: 11, fontWeight: 600 }}>AKTIF</div>
                  <div style={{ fontSize: 11, color: "#a8b5a9" }}>⏱ {sisa(v.tgl_selesai)}</div>
                </div>
              </div>

              {/* Stats */}
              <div style={{ display: "flex", gap: 16, marginBottom: 20, padding: "10px 14px", background: "#fafaf8", borderRadius: 12 }}>
                <div style={{ textAlign: "center" }}>
                  <div style={{ fontSize: 20, fontWeight: 900, color: "#2d5a40" }}>{total}</div>
                  <div style={{ fontSize: 10, color: "#7a9a7e", textTransform: "uppercase" }}>Total Suara</div>
                </div>
                <div style={{ width: 1, background: "rgba(45,90,64,0.1)" }}/>
                <div style={{ textAlign: "center" }}>
                  <div style={{ fontSize: 20, fontWeight: 900, color: "#2d5a40" }}>{pilihan.length}</div>
                  <div style={{ fontSize: 10, color: "#7a9a7e", textTransform: "uppercase" }}>Pilihan</div>
                </div>
                <div style={{ width: 1, background: "rgba(45,90,64,0.1)" }}/>
                <div style={{ textAlign: "center" }}>
                  <div style={{ fontSize: 20, fontWeight: 900, color: sudahVote ? "#2d5a40" : "#a8b5a9" }}>{sudahVote ? "✓" : "-"}</div>
                  <div style={{ fontSize: 10, color: "#7a9a7e", textTransform: "uppercase" }}>Sudah Vote</div>
                </div>
              </div>

              {/* Pilihan */}
              <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                {pilihan.map(p => {
                  const pc = persen(p.jumlah_suara || 0, total);
                  const isMyVote = voted[v.id] === p.id;
                  const winner = sudahVote && pilihan.reduce((a, b) => (a.jumlah_suara || 0) > (b.jumlah_suara || 0) ? a : b).id === p.id;

                  return (
                    <div key={p.id}>
                      <button
                        onClick={() => !sudahVote && handleVote(v.id, p.id)}
                        disabled={sudahVote || loading === p.id}
                        style={{
                          width: "100%", background: "transparent",
                          border: `2px solid ${isMyVote ? "#2d5a40" : winner ? "#b8943f" : "rgba(45,90,64,0.2)"}`,
                          borderRadius: 14, padding: "12px 16px",
                          cursor: sudahVote ? "default" : "pointer",
                          textAlign: "left", transition: "all 0.2s",
                          position: "relative", overflow: "hidden",
                        }}
                      >
                        {/* Progress bar */}
                        {sudahVote && (
                          <div style={{
                            position: "absolute", left: 0, top: 0, bottom: 0,
                            width: `${pc}%`, background: isMyVote ? "rgba(45,90,64,0.08)" : "rgba(184,148,63,0.06)",
                            transition: "width 0.6s ease",
                          }}/>
                        )}
                        <div style={{ position: "relative", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                          <span style={{ fontWeight: 600, fontSize: 14, color: "#1a2e1f" }}>
                            {isMyVote && "✓ "}{p.teks}
                          </span>
                          {sudahVote && (
                            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                              <span style={{ fontSize: 13, color: "#6b7c6d" }}>{p.jumlah_suara || 0} suara</span>
                              <span style={{ fontWeight: 800, fontSize: 15, color: isMyVote ? "#2d5a40" : "#b8943f" }}>{pc}%</span>
                            </div>
                          )}
                          {!sudahVote && (
                            <span style={{ fontSize: 12, color: "#7a9a7e" }}>Pilih →</span>
                          )}
                        </div>
                      </button>
                    </div>
                  );
                })}
              </div>

              {!sudahVote && (
                <p style={{ margin: "12px 0 0", fontSize: 12, color: "#a8b5a9", textAlign: "center" }}>
                  🔒 1 perangkat = 1 suara. Hasil voting transparan untuk semua warga.
                </p>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}