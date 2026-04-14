"use client";
import { useState, useEffect, useCallback } from "react";
import { supabase, isSupabaseReady } from "@/lib/supabase";

/* ─── Tiny SVG Chart Primitives ─── */
function SvgArea({ data, color = "#2d5a40", h = 80 }: { data: number[]; color?: string; h?: number }) {
  if (data.length < 2) return <div style={{ height: h, display: "flex", alignItems: "center", justifyContent: "center", color: "#b0b8b2", fontSize: 12 }}>Data masih sedikit…</div>;
  const W = 260, P = 12;
  const max = Math.max(...data) * 1.15 || 1;
  const xs = data.map((_, i) => P + (i / (data.length - 1)) * (W - P * 2));
  const ys = data.map(v => h - P - (v / max) * (h - P * 2));
  const line = xs.map((x, i) => `${i === 0 ? "M" : "L"}${x},${ys[i]}`).join(" ");
  const area = `${line} L${xs[xs.length - 1]},${h - P} L${xs[0]},${h - P} Z`;
  return (
    <svg width="100%" height={h} viewBox={`0 0 ${W} ${h}`} preserveAspectRatio="none">
      <defs><linearGradient id={`g${color.replace("#","")}`} x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor={color} stopOpacity="0.2" /><stop offset="100%" stopColor={color} stopOpacity="0" /></linearGradient></defs>
      <path d={area} fill={`url(#g${color.replace("#","")})`} />
      <path d={line} fill="none" stroke={color} strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round" />
      {xs.map((x, i) => <circle key={i} cx={x} cy={ys[i]} r={3} fill={color} stroke="white" strokeWidth={1.5} />)}
    </svg>
  );
}

function DonutChart({ segments }: { segments: { label: string; value: number; color: string }[] }) {
  const total = segments.reduce((s, x) => s + x.value, 0) || 1;
  const R = 42, CX = 50, CY = 50, SW = 16, circ = 2 * Math.PI * R;
  let offset = circ * 0.25;
  return (
    <svg width={100} height={100}>
      {segments.map((seg, i) => {
        const dash = circ * (seg.value / total);
        const el = <circle key={i} cx={CX} cy={CY} r={R} fill="none" stroke={seg.color} strokeWidth={SW} strokeDasharray={`${dash} ${circ - dash}`} strokeDashoffset={-offset + circ * 0.25} />;
        offset += dash;
        return el;
      })}
      <text x={CX} y={CY - 5} textAnchor="middle" fontSize={13} fontWeight="900" fill="#1a2e1f">{total}</text>
      <text x={CX} y={CY + 10} textAnchor="middle" fontSize={8} fill="#7a9a7e">jiwa</text>
    </svg>
  );
}

function HBar({ value, max, color, label, count }: { value: number; max: number; color: string; label: string; count: number }) {
  const pct = max > 0 ? (value / max) * 100 : 0;
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 10 }}>
      <div style={{ width: 80, fontSize: 12, color: "#1a2e1f", fontWeight: 600, textAlign: "right", flexShrink: 0 }}>{label}</div>
      <div style={{ flex: 1, background: "rgba(45,90,64,0.08)", borderRadius: 99, height: 10, overflow: "hidden" }}>
        <div style={{ width: `${pct}%`, height: "100%", background: color, borderRadius: 99, transition: "width 0.8s cubic-bezier(0.34,1.56,0.64,1)" }} />
      </div>
      <div style={{ width: 36, fontSize: 12, fontWeight: 800, color, textAlign: "left" }}>{count}</div>
    </div>
  );
}

/* ─── Tipe Data ─── */
interface DashData {
  totalKK: number; totalJiwa: number; laki: number; perempuan: number; balita: number; lansia: number;
  totKg: number; totPoin: number;
  anakNormal: number; anakRisiko: number; anakStunting: number;
  sampahTren: number[];  // 6 bulan terakhir kg
  sampahLabels: string[];
  rondaTren: number[];   // 6 minggu terakhir kehadiran
  rondaLabels: string[];
  topPoin: { nama: string; poin: number }[];
  lastUpdate: string;
}

const EMPTY: DashData = { totalKK:0,totalJiwa:0,laki:0,perempuan:0,balita:0,lansia:0,totKg:0,totPoin:0,anakNormal:0,anakRisiko:0,anakStunting:0,sampahTren:[],sampahLabels:[],rondaTren:[],rondaLabels:[],topPoin:[],lastUpdate:"" };

export default function CommunityDashboard() {
  const [d, setD] = useState<DashData>(EMPTY);
  const [loading, setLoading] = useState(true);
  const [live, setLive] = useState(false);

  const fetch = useCallback(async () => {
    if (!isSupabaseReady()) return;
    try {
      const [kkRes, angRes, spRes, anakRes, rondaRes, sampahRes] = await Promise.all([
        supabase.from("keluarga").select("id", { count: "exact", head: true }),
        supabase.from("anggota_kk").select("id,tgl_lahir,saldo_poin"),
        supabase.from("saldo_poin").select("total_poin,total_setor_kg"),
        supabase.from("anak_posyandu").select("status_gizi"),
        supabase.from("ronda_log").select("tanggal,jumlah_hadir").order("tanggal", { ascending: false }).limit(12),
        supabase.from("setor_sampah").select("tanggal,berat_kg").gte("tanggal", new Date(Date.now() - 180 * 864e5).toISOString().split("T")[0]),
      ]);

      const angs = angRes.data || [];
      const now = new Date();
      const getUmur = (tgl: string) => { if (!tgl) return 0; const d = new Date(tgl); let a = now.getFullYear() - d.getFullYear(); if (now.getMonth() < d.getMonth() || (now.getMonth() === d.getMonth() && now.getDate() < d.getDate())) a--; return a; };
      const totalJiwa = angs.length;
      const laki = angs.filter((a: any) => a.hubungan !== "istri" && a.hubungan !== "mertua").length;
      const balita = angs.filter((a: any) => getUmur(a.tgl_lahir) <= 5).length;
      const lansia = angs.filter((a: any) => getUmur(a.tgl_lahir) >= 60).length;

      const sp = spRes.data || [];
      const totKg = sp.reduce((s: number, x: any) => s + Number(x.total_setor_kg), 0);
      const totPoin = sp.reduce((s: number, x: any) => s + Number(x.total_poin), 0);

      // Posyandu
      const anakRows = anakRes.data || [];
      const anakNormal = anakRows.filter((a: any) => !a.status_gizi || a.status_gizi === "normal").length;
      const anakRisiko = anakRows.filter((a: any) => a.status_gizi === "risiko").length;
      const anakStunting = anakRows.filter((a: any) => a.status_gizi === "stunting").length;

      // Sampah tren 6 bulan
      const sampahByB: Record<string, number> = {};
      (sampahRes.data || []).forEach((s: any) => {
        const b = new Date(s.tanggal).toLocaleDateString("id-ID", { month: "short", year: "2-digit" });
        sampahByB[b] = (sampahByB[b] || 0) + Number(s.berat_kg);
      });
      const sampahEntries = Object.entries(sampahByB).slice(-6);
      const sampahLabels = sampahEntries.map(([b]) => b);
      const sampahTren = sampahEntries.map(([, kg]) => kg);

      // Ronda tren 6 minggu
      const rondaRows = (rondaRes.data || []).slice(0,6).reverse();
      const rondaLabels = rondaRows.map((r: any) => new Date(r.tanggal).toLocaleDateString("id-ID", { day:"numeric", month:"short" }));
      const rondaTren = rondaRows.map((r: any) => Number(r.jumlah_hadir) || 0);

      // Top poin dari anggota_kk saldo_poin
      const topPoin = angs
        .filter((a: any) => Number(a.saldo_poin) > 0)
        .sort((a: any, b: any) => Number(b.saldo_poin) - Number(a.saldo_poin))
        .slice(0, 5)
        .map((a: any) => ({ nama: a.nama || "—", poin: Number(a.saldo_poin) }));

      setD({ totalKK: kkRes.count || 0, totalJiwa, laki, perempuan: totalJiwa - laki, balita, lansia, totKg, totPoin, anakNormal, anakRisiko, anakStunting, sampahTren: sampahTren.length ? sampahTren : [0,0,0,0,0,0], sampahLabels: sampahLabels.length ? sampahLabels : ["?","?","?","?","?","?"], rondaTren: rondaTren.length ? rondaTren : [], rondaLabels, topPoin, lastUpdate: new Date().toLocaleTimeString("id-ID") });
      setLive(true);
    } catch (e) { console.error(e); }
    setLoading(false);
  }, []);

  useEffect(() => {
    fetch();
    const t = setInterval(fetch, 30000); // Live polling 30 detik
    return () => clearInterval(t);
  }, [fetch]);

  const C = { green: "#2d5a40", light: "#7a9a7e", gold: "#b8943f", red: "#c0392b", cream: "#f5f0e8", white: "#fff", dark: "#1a2e1f" };

  const donutSegs = [
    { label: "L", value: d.laki, color: "#2d5a40" },
    { label: "P", value: d.perempuan, color: C.gold },
    { label: "Balita", value: d.balita, color: "#4a90d9" },
    { label: "Lansia", value: d.lansia, color: "#9b59b6" },
  ];

  const stunMax = Math.max(d.anakNormal, d.anakRisiko, d.anakStunting, 1);

  return (
    <section style={{ padding: "80px clamp(16px,4vw,40px)", background: C.dark, position: "relative", overflow: "hidden" }}>
      {/* Decorative bg */}
      <div style={{ position: "absolute", inset: 0, backgroundImage: `radial-gradient(circle at 10% 20%, rgba(45,90,64,0.4) 0%, transparent 50%), radial-gradient(circle at 90% 80%, rgba(184,148,63,0.15) 0%, transparent 50%)`, pointerEvents: "none" }} />

      <div style={{ maxWidth: 1100, margin: "0 auto", position: "relative", zIndex: 1 }}>

        {/* Header */}
        <div style={{ textAlign: "center", marginBottom: 52 }}>
          <div style={{ display: "inline-flex", alignItems: "center", gap: 8, background: "rgba(45,90,64,0.3)", border: "1px solid rgba(45,90,64,0.5)", borderRadius: 99, padding: "6px 16px", marginBottom: 16 }}>
            <div style={{ width: 8, height: 8, borderRadius: "50%", background: live ? "#4ade80" : "#888", animation: live ? "pulse 1.5s infinite" : "none" }} />
            <span style={{ fontSize: 11, color: live ? "#4ade80" : "#888", fontWeight: 800, letterSpacing: "0.15em", textTransform: "uppercase" }}>{live ? `Live • Update ${d.lastUpdate}` : "Memuat Data..."}</span>
          </div>
          <h2 style={{ margin: "0 0 12px", fontSize: "clamp(28px,5vw,48px)", fontWeight: 900, color: "#f5f0e8", lineHeight: 1.1, letterSpacing: "-0.02em" }}>
            Denyut Nadi Kampung<br />
            <em style={{ color: "#4ade80", fontStyle: "normal" }}>Ciburial RW 08</em>
          </h2>
          <p style={{ color: C.light, fontSize: 15, maxWidth: 500, margin: "0 auto", lineHeight: 1.7 }}>Data nyata, diperbarui otomatis setiap 30 detik langsung dari sistem digital kampung.</p>
        </div>

        {/* Big Stats */}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(140px,1fr))", gap: 14, marginBottom: 36 }}>
          {[
            { icon: "🏠", val: d.totalKK, label: "Kartu Keluarga", color: C.green },
            { icon: "👥", val: d.totalJiwa, label: "Total Jiwa", color: "#4a90d9" },
            { icon: "♻️", val: `${d.totKg.toFixed(0)} kg`, label: "Sampah Dikelola", color: "#4ade80" },
            { icon: "🪙", val: d.totPoin.toLocaleString(), label: "Total Poin", color: C.gold },
            { icon: "👶", val: d.anakNormal + d.anakRisiko + d.anakStunting, label: "Anak Posyandu", color: "#f472b6" },
          ].map((s, i) => (
            <div key={i} style={{ background: "rgba(255,255,255,0.05)", backdropFilter: "blur(8px)", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 20, padding: "20px 16px", textAlign: "center" }}>
              <div style={{ fontSize: 28, marginBottom: 8 }}>{s.icon}</div>
              <div style={{ fontSize: 26, fontWeight: 900, color: s.color, lineHeight: 1 }}>{loading ? "—" : s.val}</div>
              <div style={{ fontSize: 11, color: C.light, marginTop: 6, textTransform: "uppercase", letterSpacing: "0.06em" }}>{s.label}</div>
            </div>
          ))}
        </div>

        {/* Charts Grid */}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(300px,1fr))", gap: 24 }}>

          {/* 1. Demografi Jiwa */}
          <div style={{ background: "rgba(255,255,255,0.06)", backdropFilter: "blur(10px)", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 24, padding: 28 }}>
            <div style={{ fontSize: 11, color: C.light, fontWeight: 800, textTransform: "uppercase", letterSpacing: "0.1em", marginBottom: 20 }}>📊 Komposisi Jiwa</div>
            <div style={{ display: "flex", alignItems: "center", gap: 20 }}>
              <DonutChart segments={donutSegs} />
              <div style={{ flex: 1 }}>
                {donutSegs.map((s, i) => (
                  <div key={i} style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 8 }}>
                    <div style={{ width: 10, height: 10, borderRadius: 3, background: s.color, flexShrink: 0 }} />
                    <span style={{ fontSize: 12, color: "#e0e8e4", flex: 1 }}>{s.label}</span>
                    <span style={{ fontSize: 14, fontWeight: 800, color: s.color }}>{s.value}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* 2. Tren Sampah */}
          <div style={{ background: "rgba(255,255,255,0.06)", backdropFilter: "blur(10px)", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 24, padding: 28 }}>
            <div style={{ fontSize: 11, color: C.light, fontWeight: 800, textTransform: "uppercase", letterSpacing: "0.1em", marginBottom: 8 }}>♻️ Bank Sampah — Tren 6 Bulan</div>
            <div style={{ fontSize: 20, fontWeight: 900, color: "#4ade80", marginBottom: 16 }}>{d.totKg.toFixed(1)} kg total</div>
            <SvgArea data={d.sampahTren} color="#4ade80" h={80} />
            <div style={{ display: "flex", justifyContent: "space-between", marginTop: 6 }}>
              {d.sampahLabels.map((l, i) => (
                <span key={i} style={{ fontSize: 9, color: "#5a7065", textAlign: "center" }}>{l}</span>
              ))}
            </div>
          </div>

          {/* 3. Status Gizi Posyandu */}
          <div style={{ background: "rgba(255,255,255,0.06)", backdropFilter: "blur(10px)", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 24, padding: 28 }}>
            <div style={{ fontSize: 11, color: C.light, fontWeight: 800, textTransform: "uppercase", letterSpacing: "0.1em", marginBottom: 20 }}>👶 Status Gizi Balita</div>
            <HBar value={d.anakNormal} max={stunMax} color="#4ade80" label="Normal ✅" count={d.anakNormal} />
            <HBar value={d.anakRisiko} max={stunMax} color={C.gold} label="Risiko ⚠️" count={d.anakRisiko} />
            <HBar value={d.anakStunting} max={stunMax} color={C.red} label="Stunting 🔴" count={d.anakStunting} />
            <div style={{ marginTop: 16, fontSize: 12, color: C.light, background: "rgba(255,255,255,0.05)", borderRadius: 12, padding: "10px 14px" }}>
              {d.anakStunting === 0 ? "🎉 Tidak ada anak stunting saat ini!" : `⚠️ ${d.anakStunting} anak perlu perhatian khusus`}
            </div>
          </div>

          {/* 4. Kehadiran Ronda */}
          <div style={{ background: "rgba(255,255,255,0.06)", backdropFilter: "blur(10px)", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 24, padding: 28 }}>
            <div style={{ fontSize: 11, color: C.light, fontWeight: 800, textTransform: "uppercase", letterSpacing: "0.1em", marginBottom: 8 }}>🔦 Kehadiran Ronda</div>
            {d.rondaTren.length >= 2 ? (
              <>
                <div style={{ fontSize: 20, fontWeight: 900, color: "#60a5fa", marginBottom: 16 }}>Rata-rata: {Math.round(d.rondaTren.reduce((a,b)=>a+b,0)/d.rondaTren.length)} orang/malam</div>
                <SvgArea data={d.rondaTren} color="#60a5fa" h={80} />
                <div style={{ display: "flex", justifyContent: "space-between", marginTop: 6 }}>
                  {d.rondaLabels.map((l, i) => (
                    <span key={i} style={{ fontSize: 9, color: "#5a7065" }}>{l}</span>
                  ))}
                </div>
              </>
            ) : (
              <div style={{ textAlign: "center", padding: "32px 0", color: C.light, fontSize: 13 }}>
                <div style={{ fontSize: 32, marginBottom: 8 }}>🔦</div>
                Data ronda akan tampil otomatis setelah petugas mulai absen NFC
              </div>
            )}
          </div>

          {/* 5. Leaderboard Poin */}
          <div style={{ background: "rgba(255,255,255,0.06)", backdropFilter: "blur(10px)", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 24, padding: 28, gridColumn: "span 2" }}>
            <div style={{ fontSize: 11, color: C.light, fontWeight: 800, textTransform: "uppercase", letterSpacing: "0.1em", marginBottom: 20 }}>🏆 Warga Teladan — Top Kontributor Poin</div>
            {d.topPoin.length === 0 ? (
              <div style={{ textAlign: "center", padding: "24px 0", color: C.light, fontSize: 13 }}>Mulai aktif setor sampah, ikut ronda & posyandu untuk masuk leaderboard!</div>
            ) : (
              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(180px,1fr))", gap: 14 }}>
                {d.topPoin.map((p, i) => (
                  <div key={i} style={{ background: i === 0 ? "rgba(184,148,63,0.15)" : "rgba(255,255,255,0.05)", border: `1px solid ${i === 0 ? "rgba(184,148,63,0.4)" : "rgba(255,255,255,0.08)"}`, borderRadius: 16, padding: "16px 18px", display: "flex", alignItems: "center", gap: 12 }}>
                    <div style={{ width: 36, height: 36, borderRadius: "50%", background: i === 0 ? C.gold : i === 1 ? "#c0c0c0" : "#cd7f32", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 14, fontWeight: 900, color: i < 3 ? "white" : "white", flexShrink: 0 }}>
                      {i === 0 ? "🥇" : i === 1 ? "🥈" : i === 2 ? "🥉" : i + 1}
                    </div>
                    <div>
                      <div style={{ fontSize: 14, fontWeight: 700, color: "#f5f0e8", lineHeight: 1.2 }}>{p.nama}</div>
                      <div style={{ fontSize: 16, fontWeight: 900, color: i === 0 ? C.gold : "#4ade80" }}>{p.poin.toLocaleString()} poin</div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

        </div>

        {/* Footer note */}
        <div style={{ textAlign: "center", marginTop: 36, fontSize: 12, color: "#3d5a47" }}>
          Data tersambung langsung ke sistem digital Kampung Ciburial RW 08 • Diperbarui otomatis setiap 30 detik
        </div>
      </div>

      <style>{`@keyframes pulse{0%,100%{opacity:1;transform:scale(1)}50%{opacity:.6;transform:scale(1.15)}}`}</style>
    </section>
  );
}
