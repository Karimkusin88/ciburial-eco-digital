"use client";
import { useState, useEffect, useCallback } from "react";
import { supabase, isSupabaseReady } from "@/lib/supabase";
import { Home, Users, Recycle, Baby, Loader, Radio, BarChart2, CheckCircle, AlertTriangle, AlertCircle, PartyPopper } from "lucide-react";

/* ─── SVG Area Chart ─── */
function SvgArea({ data, color = "#2F8F4E", h = 80, labels = [] }: { data: number[]; color?: string; h?: number; labels?: string[] }) {
  if (data.length < 2) return (
    <div style={{ height: h, display: "flex", alignItems: "center", justifyContent: "center", color: "#5A4A40", fontSize: 12, fontFamily: "'Inter',system-ui,sans-serif" }}>
      Belum ada data cukup
    </div>
  );
  const W = 300, P = 14;
  const max = Math.max(...data) * 1.2 || 1;
  const xs = data.map((_, i) => P + (i / (data.length - 1)) * (W - P * 2));
  const ys = data.map(v => h - P - (v / max) * (h - P * 2));
  const line = xs.map((x, i) => `${i === 0 ? "M" : "L"}${x},${ys[i]}`).join(" ");
  const area = `${line} L${xs[xs.length - 1]},${h - P} L${P},${h - P} Z`;
  const gid = `g${color.replace(/[^a-z0-9]/gi, "")}`;
  return (
    <div>
      <svg width="100%" height={h} viewBox={`0 0 ${W} ${h}`} preserveAspectRatio="none">
        <defs>
          <linearGradient id={gid} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={color} stopOpacity="0.22" />
            <stop offset="100%" stopColor={color} stopOpacity="0.02" />
          </linearGradient>
        </defs>
        <path d={area} fill={`url(#${gid})`} />
        <path d={line} fill="none" stroke={color} strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round" />
        {xs.map((x, i) => <circle key={i} cx={x} cy={ys[i]} r={3.5} fill={color} stroke="rgba(0,0,0,0.4)" strokeWidth={1.5} />)}
      </svg>
      {labels.length > 0 && (
        <div style={{ display: "flex", justifyContent: "space-between", marginTop: 6 }}>
          {labels.map((l, i) => <span key={i} style={{ fontSize: 10, color: "#5A4A40", fontFamily: "'Inter',system-ui,sans-serif", fontWeight: 500 }}>{l}</span>)}
        </div>
      )}
    </div>
  );
}

/* ─── Donut Chart ─── */
function Donut({ segs, jiwa }: { segs: { label: string; value: number; color: string }[]; jiwa: number }) {
  const total = segs.reduce((s, x) => s + x.value, 0) || 1;
  const R = 40, CX = 50, CY = 50, SW = 14, circ = 2 * Math.PI * R;
  let off = circ * 0.25;
  const arcs = segs.map((seg) => {
    const dash = circ * (seg.value / total);
    const el = { ...seg, dash, off };
    off += dash;
    return el;
  });
  return (
    <svg width={100} height={100} style={{ overflow: "visible" }}>
      {arcs.map((a, i) => (
        <circle key={i} cx={CX} cy={CY} r={R} fill="none" stroke={a.color} strokeWidth={SW}
          strokeDasharray={`${a.dash} ${circ - a.dash}`} strokeDashoffset={-a.off + circ * 0.25} />
      ))}
      {/* Center menampilkan total jiwa, bukan sum segment (balita/lansia adalah subset dari jiwa) */}
      <text x={CX} y={CY - 5} textAnchor="middle" fontSize={13} fontWeight="900" fill="#1C3A2B" fontFamily="Inter,system-ui,sans-serif">{jiwa}</text>
      <text x={CX} y={CY + 10} textAnchor="middle" fontSize={9} fill="#5A4A40" fontFamily="Inter,system-ui,sans-serif">jiwa</text>
    </svg>
  );
}

function HBar({ value, max, color, label, count }: { value: number; max: number; color: string; label: string; count: number }) {
  const pct = max > 0 ? Math.min(100, (value / max) * 100) : 0;
  return (
    <div style={{ marginBottom: 14, fontFamily: "'Inter',system-ui,sans-serif" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end", marginBottom: 6 }}>
        <div style={{ fontSize: 12, color: "#1C3A2B", fontWeight: 600 }}>{label}</div>
        <div style={{ fontSize: 14, fontWeight: 800, color }}>{count}</div>
      </div>
      <div style={{ width: "100%", background: "rgba(47,143,78,.08)", borderRadius: 99, height: 10, overflow: "hidden", boxShadow: "inset 0 1px 2px rgba(0,0,0,.02)" }}>
        <div style={{ width: `${pct}%`, height: "100%", background: `linear-gradient(90deg, ${color}, ${color}dd)`, borderRadius: 99, transition: "width 1s cubic-bezier(.34,1.56,.64,1)", boxShadow: `0 0 8px ${color}60` }} />
      </div>
    </div>
  );
}

/* ─── State ─── */
interface D {
  kk: number; jiwa: number; laki: number; perempuan: number; balita: number; lansia: number;
  totKg: number;
  anakNormal: number; anakRisiko: number; anakStunting: number;
  sampahKg: number[]; sampahLbl: string[];
  updated: string;
}

const EMPTY: D = { kk:0,jiwa:0,laki:0,perempuan:0,balita:0,lansia:0,totKg:0,anakNormal:0,anakRisiko:0,anakStunting:0,sampahKg:[],sampahLbl:[],updated:"" };

export default function CommunityDashboard() {
  const [d, setD] = useState<D>(EMPTY);
  const [live, setLive] = useState(false);
  const [loading, setLoading] = useState(true);

  const refresh = useCallback(async () => {
    if (!isSupabaseReady()) return;
    try {
      const [kkRes, angRes, spRes, anakRes, sampahRes] = await Promise.all([
        supabase.from("keluarga").select("id, tgl_lahir_kepala"),
        supabase.from("anggota_kk").select("id, tgl_lahir, hubungan, jenis_kelamin"),
        supabase.from("saldo_poin").select("total_setor_kg"),
        supabase.from("anak_posyandu").select("status_gizi"),
        supabase.from("setor_sampah").select("tanggal, berat_kg")
          .gte("tanggal", new Date(Date.now() - 180 * 864e5).toISOString().split("T")[0]),
      ]);

      const kks  = kkRes.data  || []; // KK records (untuk count KK & tgl lahir kepala)
      const angs = angRes.data || []; // anggota_kk — SUDAH include kepala (hubungan='kepala')

      // Total jiwa = hanya anggota_kk saja (kepala sudah ada di dalamnya)
      const totalJiwa = angs.length;

      const now = new Date();
      const umur = (tgl: string) => {
        if (!tgl) return -1;
        const d = new Date(tgl), a = now.getFullYear() - d.getFullYear();
        return (now.getMonth() < d.getMonth() || (now.getMonth() === d.getMonth() && now.getDate() < d.getDate())) ? a - 1 : a;
      };

      const isP = (a: any) => {
        if (a.jenis_kelamin) return a.jenis_kelamin === "perempuan" || a.jenis_kelamin === "P" || a.jenis_kelamin === "p";
        return a.hubungan === "istri" || a.hubungan === "mertua" || a.hubungan === "nenek";
      };

      const perempuan = angs.filter((a: any) => isP(a)).length;
      const laki = totalJiwa - perempuan;

      // Hanya dari anggota_kk — kepala KK sudah termasuk di dalamnya (hubungan='kepala')
      // Jangan gabungkan tgl_lahir_kepala dari keluarga karena akan double-count
      const allTgl = angs.map((a: any) => a.tgl_lahir).filter(Boolean);
      const balita = allTgl.filter((t: string) => { const u = umur(t); return u >= 0 && u <= 5; }).length;
      const lansia = allTgl.filter((t: string) => umur(t) >= 60).length;

      const totKg = (spRes.data || []).reduce((s: number, x: any) => s + Number(x.total_setor_kg), 0);

      const anakRows = anakRes.data || [];
      const anakNormal   = anakRows.filter((a: any) => !a.status_gizi || a.status_gizi === "normal").length;
      const anakRisiko   = anakRows.filter((a: any) => a.status_gizi === "risiko").length;
      const anakStunting = anakRows.filter((a: any) => a.status_gizi === "stunting").length;

      const byB: Record<string, number> = {};
      (sampahRes.data || []).forEach((s: any) => {
        const b = new Date(s.tanggal).toLocaleDateString("id-ID", { month: "short" });
        byB[b] = (byB[b] || 0) + Number(s.berat_kg);
      });
      const entries = Object.entries(byB).slice(-6);

      setD({
        kk: kks.length, jiwa: totalJiwa, laki, perempuan, balita, lansia,
        totKg, anakNormal, anakRisiko, anakStunting,
        sampahKg: entries.length ? entries.map(([,v]) => v) : [0,0,0,0,0,0],
        sampahLbl: entries.length ? entries.map(([b]) => b) : ["","","","","",""],
        updated: new Date().toLocaleTimeString("id-ID"),
      });
      setLive(true);
    } catch (e) { console.error("Dashboard err:", e); }
    setLoading(false);
  }, []);

  useEffect(() => {
    refresh();
    const t = setInterval(refresh, 30000);
    return () => clearInterval(t);
  }, [refresh]);

  const C = { green: "#2F8F4E", bright: "#4FBF7E", gold: "#9B7D4C", red: "#B8472F", blue: "#4FBF7E", pink: "#9B7D4C", dark: "#1C3A2B", cream: "#FAF8F3" };

  const donutSegs = [
    { label: "Laki-laki", value: d.laki, color: "#4ade80" },
    { label: "Perempuan", value: d.perempuan, color: C.gold },
    { label: "Balita (≤5th)", value: d.balita, color: C.blue },
    { label: "Lansia (≥60th)", value: d.lansia, color: "#a78bfa" },
  ];
  const stunMax = Math.max(d.anakNormal, d.anakRisiko, d.anakStunting, 1);

  return (
    <section style={{ padding: "clamp(60px,8vw,100px) clamp(16px,4vw,40px)", background: "linear-gradient(135deg,rgba(255,254,249,.95) 0%,rgba(232,245,238,.6) 100%)", position: "relative", overflow: "hidden", fontFamily: "var(--font-dm-sans,'DM Sans'),sans-serif", borderTop: "1.5px solid rgba(47,143,78,.15)" }}>
      {/* Ambient glow - Heroic */}
      <div style={{ position: "absolute", inset: 0, backgroundImage: `radial-gradient(ellipse at 15% 25%, rgba(47,143,78,0.08) 0%, transparent 55%), radial-gradient(ellipse at 85% 75%, rgba(184,148,63,0.06) 0%, transparent 55%)`, pointerEvents: "none" }} />

      <div style={{ maxWidth: 1100, margin: "0 auto", position: "relative", zIndex: 1 }}>
        {/* Header */}
        <div style={{ textAlign: "center", marginBottom: 48 }}>
          <div style={{ display: "inline-flex", alignItems: "center", gap: 8, background: "rgba(79,191,126,.1)", border: "1.5px solid rgba(47,143,78,.2)", borderRadius: 99, padding: "8px 18px", marginBottom: 20 }}>
            <div style={{ width: 8, height: 8, borderRadius: "50%", background: live ? "#2F8F4E" : "#9A8C85", animation: live ? "pulse-glow 2s infinite" : "none", boxShadow: live ? "0 0 12px rgba(47,143,78,.6)" : "none" }} />
            <span style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 11, color: live ? "#2F8F4E" : "#9A8C85", fontWeight: 700, letterSpacing: "0.15em", textTransform: "uppercase" }}>
              {live ? <><Radio size={12} strokeWidth={2} /> Live — {d.updated}</> : <><Loader size={12} strokeWidth={2} /> Memuat…</>}
            </span>
          </div>
          <h2 style={{ margin: "0 0 16px", fontSize: "clamp(32px,5vw,48px)", fontWeight: 300, background: "linear-gradient(135deg,#1C3A2B,#2F8F4E)", backgroundClip: "text", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent", lineHeight: 1.1, letterSpacing: "-0.03em" }}>
            Denyut Nadi Kampung <em style={{ background: "linear-gradient(135deg,#4FBF7E,#2F8F4E)", backgroundClip: "text", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent", fontStyle: "italic" }}>Ciburial RW 08</em>
          </h2>
          <p style={{ color: "#5A4A40", fontSize: 14, maxWidth: 500, margin: "0 auto", lineHeight: 1.8, fontWeight: 500 }}>
            Data nyata diperbarui otomatis setiap 30 detik langsung dari sistem digital kampung.
          </p>
        </div>

        {/* Big stats */}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(min(100%, 110px),1fr))", gap: "clamp(8px, 2vw, 16px)", marginBottom: 44 }}>
          {[
            { icon: <Home size={28} strokeWidth={1.5} />, val: loading ? "—" : d.kk, label: "Kartu Keluarga", color: "#2F8F4E" },
            { icon: <Users size={28} strokeWidth={1.5} />, val: loading ? "—" : d.jiwa, label: "Total Jiwa", color: "#4FBF7E" },
            { icon: <Recycle size={28} strokeWidth={1.5} />, val: loading ? "—" : `${d.totKg.toFixed(0)} kg`, label: "Sampah Dikelola", color: "#2F8F4E" },
            { icon: <Baby size={28} strokeWidth={1.5} />, val: loading ? "—" : d.anakNormal + d.anakRisiko + d.anakStunting, label: "Anak Posyandu", color: "#9B7D4C" },
          ].map((s, i) => (
            <div key={i} style={{ minWidth: 0, overflow: "hidden", background: "linear-gradient(135deg,rgba(255,254,249,.9),rgba(232,245,238,.5))", border: "1.5px solid rgba(47,143,78,.12)", borderRadius: 14, padding: "clamp(16px, 4vw, 28px) clamp(8px, 2vw, 16px)", textAlign: "center", transition: "all 0.35s cubic-bezier(.22,1,.36,1)", cursor: "pointer" }}
              onMouseEnter={(e) => {
                const el = e.currentTarget as HTMLElement;
                el.style.transform = "translateY(-6px)";
                el.style.boxShadow = "0 12px 28px rgba(47,143,78,.12)";
              }}
              onMouseLeave={(e) => {
                const el = e.currentTarget as HTMLElement;
                el.style.transform = "translateY(0)";
                el.style.boxShadow = "none";
              }}>
              <div style={{ display: "flex", justifyContent: "center", marginBottom: 8, color: s.color }}>{s.icon}</div>
              <div style={{ fontSize: "clamp(24px, 5vw, 32px)", fontWeight: 300, color: s.color, lineHeight: 1, letterSpacing: "-0.02em", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{s.val}</div>
              <div style={{ fontSize: "clamp(9px, 2.5vw, 11px)", color: "#5A4A40", marginTop: 8, textTransform: "uppercase", letterSpacing: "0.08em", fontWeight: 600, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{s.label}</div>
            </div>
          ))}
        </div>

        {/* 3 chart cards */}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(min(100%, 260px),1fr))", gap: "clamp(16px, 3vw, 24px)" }}>

          {/* Demografi Donut */}
          <div style={{ background: "linear-gradient(135deg,rgba(255,254,249,.9),rgba(232,245,238,.5))", border: "1.5px solid rgba(47,143,78,.12)", borderRadius: 16, padding: "clamp(20px, 5vw, 32px) clamp(16px, 4vw, 28px)", transition: "all 0.35s cubic-bezier(.22,1,.36,1)" }}>
            <div style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 12, color: "#2F8F4E", fontWeight: 800, textTransform: "uppercase", letterSpacing: "0.12em", marginBottom: 24 }}><BarChart2 size={16} strokeWidth={2} /> Komposisi Jiwa</div>
            <div style={{ display: "flex", alignItems: "center", gap: 20, flexWrap: "wrap", justifyContent: "center" }}>
              <Donut segs={donutSegs} jiwa={d.jiwa} />
              <div style={{ flex: 1, minWidth: 120 }}>
                {donutSegs.map((s, i) => (
                  <div key={i} style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 12 }}>
                    <div style={{ width: 10, height: 10, borderRadius: 3, background: s.color, flexShrink: 0, boxShadow: `0 2px 8px ${s.color}40` }} />
                    <span style={{ fontSize: 13, color: "#1C3A2B", flex: 1, fontWeight: 500 }}>{s.label}</span>
                    <span style={{ fontSize: 14, fontWeight: 800, color: s.color }}>{s.value}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Bank Sampah */}
          <div style={{ background: "linear-gradient(135deg,rgba(255,254,249,.9),rgba(232,245,238,.5))", border: "1.5px solid rgba(47,143,78,.12)", borderRadius: 16, padding: "clamp(20px, 5vw, 32px) clamp(16px, 4vw, 28px)", transition: "all 0.35s cubic-bezier(.22,1,.36,1)" }}>
            <div style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 12, color: "#2F8F4E", fontWeight: 800, textTransform: "uppercase", letterSpacing: "0.12em", marginBottom: 8 }}><Recycle size={16} strokeWidth={2} /> Bank Sampah — 6 Bulan</div>
            <div style={{ fontSize: 28, fontWeight: 300, color: "#2F8F4E", marginBottom: 22, letterSpacing: "-0.02em" }}>{d.totKg.toFixed(1)} <span style={{ fontSize: "0.5em", opacity: 0.7 }}>kg</span></div>
            <SvgArea data={d.sampahKg} color={C.bright} h={90} labels={d.sampahLbl} />
          </div>

          {/* Gizi Balita */}
          <div style={{ background: "linear-gradient(135deg,rgba(255,254,249,.9),rgba(232,245,238,.5))", border: "1.5px solid rgba(47,143,78,.12)", borderRadius: 16, padding: "clamp(20px, 5vw, 32px) clamp(16px, 4vw, 28px)", transition: "all 0.35s cubic-bezier(.22,1,.36,1)" }}>
            <div style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 12, color: "#2F8F4E", fontWeight: 800, textTransform: "uppercase", letterSpacing: "0.12em", marginBottom: 24 }}><Baby size={16} strokeWidth={2} /> Status Gizi Balita</div>
            <HBar value={d.anakNormal} max={stunMax} color={C.bright} label={<div style={{ display: "flex", alignItems: "center", gap: 6 }}><CheckCircle size={14} strokeWidth={2} /> Normal</div> as any} count={d.anakNormal} />
            <HBar value={d.anakRisiko} max={stunMax} color={C.gold} label={<div style={{ display: "flex", alignItems: "center", gap: 6 }}><AlertTriangle size={14} strokeWidth={2} /> Risiko</div> as any} count={d.anakRisiko} />
            <HBar value={d.anakStunting} max={stunMax} color={C.red} label={<div style={{ display: "flex", alignItems: "center", gap: 6 }}><AlertCircle size={14} strokeWidth={2} /> Stunting</div> as any} count={d.anakStunting} />
            <div style={{ marginTop: 20, padding: "14px 16px", background: d.anakStunting === 0 ? "linear-gradient(135deg,rgba(79,191,126,.1),rgba(47,143,78,.05))" : "linear-gradient(135deg,rgba(248,113,113,.1),rgba(184,80,80,.05))", borderRadius: 12, fontSize: 13, border: d.anakStunting === 0 ? "1px solid rgba(47,143,78,.2)" : "1px solid rgba(248,113,113,.2)", color: d.anakStunting === 0 ? "#2F8F4E" : "#B8472F", fontWeight: 600 }}>
              {d.anakStunting === 0 ? <div style={{ display: "flex", alignItems: "center", gap: 6 }}><PartyPopper size={16} strokeWidth={2} /> Tidak ada balita stunting saat ini!</div> : <div style={{ display: "flex", alignItems: "center", gap: 6 }}><AlertTriangle size={16} strokeWidth={2} /> {d.anakStunting} balita perlu perhatian khusus</div>}
            </div>
          </div>
        </div>

        <div style={{ textAlign: "center", marginTop: 32, fontSize: 11, color: "rgba(255,255,255,0.2)", letterSpacing: "0.05em" }}>
          Data langsung dari sistem Kampung Ciburial RW 08 • Auto-refresh tiap 30 detik
        </div>
      </div>

      <style>{`@keyframes dashPulse{0%,100%{opacity:1;transform:scale(1)}50%{opacity:.5;transform:scale(1.2)}}`}</style>
    </section>
  );
}
