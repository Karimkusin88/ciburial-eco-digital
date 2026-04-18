"use client";
import { useState, useEffect, useCallback } from "react";
import { supabase, isSupabaseReady } from "@/lib/supabase";

/* ─── SVG Area Chart ─── */
function SvgArea({ data, color = "#4ade80", h = 80, labels = [] }: { data: number[]; color?: string; h?: number; labels?: string[] }) {
  if (data.length < 2) return (
    <div style={{ height: h, display: "flex", alignItems: "center", justifyContent: "center", color: "rgba(255,255,255,0.3)", fontSize: 12, fontFamily: "'Inter',system-ui,sans-serif" }}>
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
        <div style={{ display: "flex", justifyContent: "space-between", marginTop: 4 }}>
          {labels.map((l, i) => <span key={i} style={{ fontSize: 9, color: "rgba(255,255,255,0.3)", fontFamily: "'Inter',system-ui,sans-serif" }}>{l}</span>)}
        </div>
      )}
    </div>
  );
}

/* ─── Donut Chart ─── */
function Donut({ segs }: { segs: { label: string; value: number; color: string }[] }) {
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
      <text x={CX} y={CY - 5} textAnchor="middle" fontSize={13} fontWeight="900" fill="#f5f0e8" fontFamily="Inter,system-ui,sans-serif">{total}</text>
      <text x={CX} y={CY + 10} textAnchor="middle" fontSize={9} fill="rgba(255,255,255,0.4)" fontFamily="Inter,system-ui,sans-serif">jiwa</text>
    </svg>
  );
}

/* ─── Horizontal Bar ─── */
function HBar({ value, max, color, label, count }: { value: number; max: number; color: string; label: string; count: number }) {
  const pct = max > 0 ? Math.min(100, (value / max) * 100) : 0;
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 12, fontFamily: "'Inter',system-ui,sans-serif" }}>
      <div style={{ width: 88, fontSize: 11, color: "rgba(255,255,255,0.6)", textAlign: "right", flexShrink: 0, lineHeight: 1.3 }}>{label}</div>
      <div style={{ flex: 1, background: "rgba(255,255,255,0.06)", borderRadius: 99, height: 8, overflow: "hidden" }}>
        <div style={{ width: `${pct}%`, height: "100%", background: color, borderRadius: 99, transition: "width 1s cubic-bezier(.34,1.56,.64,1)" }} />
      </div>
      <div style={{ width: 28, fontSize: 13, fontWeight: 900, color, textAlign: "left" }}>{count}</div>
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

  const C = { green: "#2d5a40", bright: "#4ade80", gold: "#b8943f", red: "#e74c3c", blue: "#60a5fa", pink: "#f472b6", dark: "#1a2e1f", cream: "#f5f0e8" };

  const donutSegs = [
    { label: "Laki-laki", value: d.laki, color: "#4ade80" },
    { label: "Perempuan", value: d.perempuan, color: C.gold },
    { label: "Balita (≤5th)", value: d.balita, color: C.blue },
    { label: "Lansia (≥60th)", value: d.lansia, color: "#a78bfa" },
  ];
  const stunMax = Math.max(d.anakNormal, d.anakRisiko, d.anakStunting, 1);

  return (
    <section style={{ padding: "80px clamp(16px,4vw,40px)", background: "#1a2e1f", position: "relative", overflow: "hidden", fontFamily: "var(--font-dm-sans,'DM Sans'),sans-serif" }}>
      {/* Ambient glow */}
      <div style={{ position: "absolute", inset: 0, backgroundImage: `radial-gradient(ellipse at 15% 25%, rgba(45,90,64,0.45) 0%, transparent 55%), radial-gradient(ellipse at 85% 75%, rgba(184,148,63,0.12) 0%, transparent 55%)`, pointerEvents: "none" }} />

      <div style={{ maxWidth: 1100, margin: "0 auto", position: "relative", zIndex: 1 }}>
        {/* Header */}
        <div style={{ textAlign: "center", marginBottom: 48 }}>
          <div style={{ display: "inline-flex", alignItems: "center", gap: 8, background: "rgba(74,222,128,0.1)", border: "1px solid rgba(74,222,128,0.25)", borderRadius: 99, padding: "6px 18px", marginBottom: 20 }}>
            <div style={{ width: 7, height: 7, borderRadius: "50%", background: live ? C.bright : "#666", animation: live ? "dashPulse 1.5s infinite" : "none" }} />
            <span style={{ fontSize: 11, color: live ? C.bright : "#888", fontWeight: 700, letterSpacing: "0.15em", textTransform: "uppercase" }}>
              {live ? `Live — ${d.updated}` : "Memuat…"}
            </span>
          </div>
          <h2 style={{ margin: "0 0 12px", fontSize: "clamp(26px,4.5vw,44px)", fontWeight: 300, color: "#f5f0e8", lineHeight: 1.1, letterSpacing: "-0.025em", fontFamily: "var(--font-cormorant,'Cormorant Garamond'),serif" }}>
            Denyut Nadi Kampung <em style={{ color: "#4ade80", fontStyle: "italic" }}>Ciburial RW 08</em>
          </h2>
          <p style={{ color: "rgba(245,240,232,0.5)", fontSize: 15, maxWidth: 480, margin: "0 auto", lineHeight: 1.7 }}>
            Data nyata diperbarui otomatis setiap 30 detik langsung dari sistem digital kampung.
          </p>
        </div>

        {/* Big stats */}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(140px,1fr))", gap: 14, marginBottom: 36 }}>
          {[
            { icon: "🏠", val: loading ? "—" : d.kk, label: "Kartu Keluarga", color: C.bright },
            { icon: "👥", val: loading ? "—" : d.jiwa, label: "Total Jiwa", color: "#93c5fd" },
            { icon: "♻️", val: loading ? "—" : `${d.totKg.toFixed(0)} kg`, label: "Sampah Dikelola", color: C.bright },
            { icon: "👶", val: loading ? "—" : d.anakNormal + d.anakRisiko + d.anakStunting, label: "Anak Posyandu", color: "#f9a8d4" },
          ].map((s, i) => (
            <div key={i} style={{ background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.09)", borderRadius: 20, padding: "22px 16px", textAlign: "center" }}>
              <div style={{ fontSize: 26, marginBottom: 8 }}>{s.icon}</div>
              <div style={{ fontSize: 30, fontWeight: 300, color: s.color, lineHeight: 1, letterSpacing: "-0.01em", fontFamily: "var(--font-cormorant,'Cormorant Garamond'),serif" }}>{s.val}</div>
              <div style={{ fontSize: 11, color: "rgba(255,255,255,0.4)", marginTop: 6, textTransform: "uppercase", letterSpacing: "0.07em" }}>{s.label}</div>
            </div>
          ))}
        </div>

        {/* 3 chart cards */}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(300px,1fr))", gap: 24 }}>

          {/* Demografi Donut */}
          <div style={{ background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.09)", borderRadius: 24, padding: "28px 24px" }}>
            <div style={{ fontSize: 11, color: "rgba(255,255,255,0.45)", fontWeight: 800, textTransform: "uppercase", letterSpacing: "0.12em", marginBottom: 20 }}>📊 Komposisi Jiwa</div>
            <div style={{ display: "flex", alignItems: "center", gap: 20 }}>
              <Donut segs={donutSegs} />
              <div style={{ flex: 1 }}>
                {donutSegs.map((s, i) => (
                  <div key={i} style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 9 }}>
                    <div style={{ width: 8, height: 8, borderRadius: 2, background: s.color, flexShrink: 0 }} />
                    <span style={{ fontSize: 12, color: "rgba(255,255,255,0.6)", flex: 1 }}>{s.label}</span>
                    <span style={{ fontSize: 14, fontWeight: 900, color: s.color }}>{s.value}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Bank Sampah */}
          <div style={{ background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.09)", borderRadius: 24, padding: "28px 24px" }}>
            <div style={{ fontSize: 11, color: "rgba(255,255,255,0.45)", fontWeight: 800, textTransform: "uppercase", letterSpacing: "0.12em", marginBottom: 6 }}>♻️ Bank Sampah — 6 Bulan</div>
            <div style={{ fontSize: 22, fontWeight: 900, color: C.bright, marginBottom: 18, letterSpacing: "-0.02em" }}>{d.totKg.toFixed(1)} kg total</div>
            <SvgArea data={d.sampahKg} color={C.bright} h={90} labels={d.sampahLbl} />
          </div>

          {/* Gizi Balita */}
          <div style={{ background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.09)", borderRadius: 24, padding: "28px 24px" }}>
            <div style={{ fontSize: 11, color: "rgba(255,255,255,0.45)", fontWeight: 800, textTransform: "uppercase", letterSpacing: "0.12em", marginBottom: 20 }}>👶 Status Gizi Balita</div>
            <HBar value={d.anakNormal} max={stunMax} color={C.bright} label="✅ Normal" count={d.anakNormal} />
            <HBar value={d.anakRisiko} max={stunMax} color={C.gold} label="⚠️ Risiko" count={d.anakRisiko} />
            <HBar value={d.anakStunting} max={stunMax} color={C.red} label="🔴 Stunting" count={d.anakStunting} />
            <div style={{ marginTop: 16, padding: "10px 14px", background: d.anakStunting === 0 ? "rgba(74,222,128,0.08)" : "rgba(231,76,60,0.1)", borderRadius: 12, fontSize: 12, color: d.anakStunting === 0 ? C.bright : "#f87171", fontWeight: 600 }}>
              {d.anakStunting === 0 ? "🎉 Tidak ada balita stunting saat ini!" : `⚠️ ${d.anakStunting} balita perlu perhatian khusus`}
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
