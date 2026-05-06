"use client";
import { useState, useEffect, useCallback } from "react";
import { supabase, isSupabaseReady } from "@/lib/supabase";
import { Home, TreePine, Wheat, Soup, Recycle, Leaf, QrCode, Heart, Landmark, CheckCircle, Package, Truck, PartyPopper, XCircle, Search, MapPin, Zap, Eye, ShoppingCart, MessageSquare, Loader, Smartphone, FileText, CreditCard, Lock, ArrowRight, CornerDownRight, AlertCircle, BarChart2, Coins, TrendingUp, TrendingDown, Target, Building, BookOpen, Lightbulb, Wifi, PenTool, Globe, Radio } from "lucide-react";
import { Transaksi, ALOKASI, fRp, DEF_TX } from "./types";

// ─── RAB target global ─────────────────────────────────────────────────────
const RAB_TARGET = 250_000_000;

// ─── Warna kategori alokasi ────────────────────────────────────────────────
const ALOKASI_COLORS = ["#2D5A40","#4A7C59","#B8943F","#1A3A6B","#6B4F3A","#8A7065"];

/* ══════════════════════════ CHART COMPONENTS ══════════════════════════════ */

// Area + Line chart – masuk vs keluar per bulan (6 bln terakhir)
function DanaFlowChart({ transaksi }: { transaksi: Transaksi[] }) {
  const W = 540, H = 160, PX = 48, PY = 20;

  // Kumpulkan per bulan
  const byMonth: Record<string, { masuk: number; keluar: number }> = {};
  transaksi.forEach(t => {
    const key = new Date(t.tanggal).toLocaleDateString("id-ID", { month: "short", year: "2-digit" });
    if (!byMonth[key]) byMonth[key] = { masuk: 0, keluar: 0 };
    byMonth[key][t.tipe] += t.jumlah;
  });

  // Ambil 6 bulan terakhir, urutkan kronologis
  const entries = Object.entries(byMonth).slice(-6);
  if (entries.length < 2) {
    return (
      <div style={{ height: H, display: "flex", alignItems: "center", justifyContent: "center", color: "#9A8C85", fontSize: 13 }}>
        Butuh min. 2 bulan data untuk chart
      </div>
    );
  }

  const maxV = Math.max(...entries.flatMap(([, v]) => [v.masuk, v.keluar])) * 1.15 || 1;
  const n = entries.length;
  const xStep = (W - PX * 2) / (n - 1);
  const yFn = (v: number) => PY + (H - PY * 2) * (1 - v / maxV);
  const pts = (key: "masuk" | "keluar") => entries.map(([, v], i) => ({ x: PX + i * xStep, y: yFn(v[key]), v: v[key] }));

  const masukPts = pts("masuk");
  const keluarPts = pts("keluar");
  const linePath = (ps: typeof masukPts) => ps.map((p, i) => `${i === 0 ? "M" : "L"}${p.x},${p.y}`).join(" ");
  const areaPath = (ps: typeof masukPts) => `${linePath(ps)} L${ps[ps.length - 1].x},${H - PY} L${PX},${H - PY} Z`;

  return (
    <div>
      <svg width="100%" height={H} viewBox={`0 0 ${W} ${H}`} preserveAspectRatio="xMidYMid meet">
        <defs>
          <linearGradient id="gMasuk" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#4ade80" stopOpacity="0.22" />
            <stop offset="100%" stopColor="#4ade80" stopOpacity="0.02" />
          </linearGradient>
          <linearGradient id="gKeluar" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#f87171" stopOpacity="0.18" />
            <stop offset="100%" stopColor="#f87171" stopOpacity="0.01" />
          </linearGradient>
        </defs>
        {/* Grid lines */}
        {[0.25, 0.5, 0.75, 1].map(f => (
          <line key={f} x1={PX} y1={yFn(maxV * (1 - f))} x2={W - PX} y2={yFn(maxV * (1 - f))}
            stroke="rgba(47,143,78,0.08)" strokeWidth={1} strokeDasharray="4 3" />
        ))}
        {/* Area masuk */}
        <path d={areaPath(masukPts)} fill="url(#gMasuk)" />
        <path d={linePath(masukPts)} fill="none" stroke="#4ade80" strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round" />
        {/* Area keluar */}
        <path d={areaPath(keluarPts)} fill="url(#gKeluar)" />
        <path d={linePath(keluarPts)} fill="none" stroke="#f87171" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" strokeDasharray="6 3" />
        {/* Dots + tooltip data */}
        {masukPts.map((p, i) => (
          <g key={`m${i}`}>
            <circle cx={p.x} cy={p.y} r={4} fill="#4ade80" stroke="rgba(0,0,0,.4)" strokeWidth={1.5} />
          </g>
        ))}
        {keluarPts.map((p, i) => (
          <g key={`k${i}`}>
            <circle cx={p.x} cy={p.y} r={3.5} fill="#f87171" stroke="rgba(0,0,0,.4)" strokeWidth={1.5} />
          </g>
        ))}
        {/* X labels */}
        {entries.map(([label], i) => (
          <text key={i} x={PX + i * xStep} y={H - 4} textAnchor="middle"
            fontSize={9} fill="rgba(47,143,78,0.45)" fontFamily="Inter,system-ui,sans-serif">
            {label}
          </text>
        ))}
        {/* Y label (max) */}
        <text x={PX - 6} y={PY + 4} textAnchor="end" fontSize={8} fill="rgba(47,143,78,0.35)" fontFamily="Inter,system-ui,sans-serif">
          {(maxV / 1e6).toFixed(1)}jt
        </text>
      </svg>
      {/* Legend */}
      <div style={{ display: "flex", gap: 20, justifyContent: "center", marginTop: 6 }}>
        {[{ color: "#4ade80", label: "Dana Masuk" }, { color: "#f87171", label: "Dana Keluar" }].map(l => (
          <div key={l.label} style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 11, color: "#5A4A40" }}>
            <div style={{ width: 22, height: 2.5, background: l.color, borderRadius: 99 }} />
            {l.label}
          </div>
        ))}
      </div>
    </div>
  );
}

// Donut chart – distribusi pengeluaran per kategori RAB
function AlokasiDonut({ transaksi }: { transaksi: Transaksi[] }) {
  const keluar = ALOKASI.map((a, i) => ({
    ...a,
    used: transaksi.filter(t => t.tipe === "keluar" && t.kategori === a.label).reduce((s, t) => s + t.jumlah, 0),
    color: ALOKASI_COLORS[i],
  })).filter(a => a.used > 0);

  const totalUsed = keluar.reduce((s, a) => s + a.used, 0);
  if (totalUsed === 0) {
    return (
      <div style={{ height: 140, display: "flex", alignItems: "center", justifyContent: "center", color: "#9A8C85", fontSize: 13, textAlign: "center" }}>
        Belum ada pengeluaran<br />yang tercatat
      </div>
    );
  }

  const R = 50, CX = 70, CY = 70, SW = 18;
  const circ = 2 * Math.PI * R;
  let off = -circ * 0.25;
  const arcs = keluar.map(a => {
    const dash = circ * (a.used / totalUsed);
    const el = { ...a, dash, off };
    off += dash;
    return el;
  });

  return (
    <div style={{ display: "flex", alignItems: "center", gap: 20, flexWrap: "wrap" }}>
      <svg width={140} height={140} style={{ flexShrink: 0, overflow: "visible" }}>
        {/* Track */}
        <circle cx={CX} cy={CY} r={R} fill="none" stroke="rgba(47,143,78,0.08)" strokeWidth={SW} />
        {arcs.map((a, i) => (
          <circle key={i} cx={CX} cy={CY} r={R} fill="none" stroke={a.color} strokeWidth={SW}
            strokeDasharray={`${a.dash} ${circ - a.dash}`}
            strokeDashoffset={-a.off}
            style={{ transition: "stroke-dasharray 0.8s ease" }} />
        ))}
        <text x={CX} y={CY - 6} textAnchor="middle" fontSize={12} fontWeight="900" fill="#1C3A2B" fontFamily="Inter,system-ui,sans-serif">
          {fRp(totalUsed).replace("Rp ", "")}
        </text>
        <text x={CX} y={CY + 9} textAnchor="middle" fontSize={8} fill="rgba(47,143,78,0.4)" fontFamily="Inter,system-ui,sans-serif">
          total keluar
        </text>
      </svg>
      <div style={{ flex: 1, minWidth: 160 }}>
        {keluar.map((a, i) => (
          <div key={i} style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 8 }}>
            <div style={{ width: 8, height: 8, borderRadius: 2, background: a.color, flexShrink: 0 }} />
            <span style={{ flex: 1, fontSize: 11, color: "#5A4A40", lineHeight: 1.3 }}>{a.label}</span>
            <span style={{ fontSize: 12, fontWeight: 800, color: a.color, whiteSpace: "nowrap" }}>
              {Math.round((a.used / totalUsed) * 100)}%
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}

/* ══════════════════════════ MAIN COMPONENT ════════════════════════════════ */

export default function TransparansiTab() {
  const [transaksi, setTransaksi] = useState<Transaksi[]>(DEF_TX);
  const [live, setLive] = useState(false);
  const [updated, setUpdated] = useState("");
  const [fTipe, setFTipe] = useState<"semua" | "masuk" | "keluar">("semua");

  // ── Fetch & real-time subscribe ──────────────────────────────────────────
  const fetchData = useCallback(async () => {
    if (!isSupabaseReady()) return;
    const { data } = await supabase
      .from("transaksi")
      .select("*")
      .order("tanggal", { ascending: false });
    if (data && data.length > 0) {
      setTransaksi(data as Transaksi[]);
      setLive(true);
      setUpdated(new Date().toLocaleTimeString("id-ID"));
    }
  }, []);

  useEffect(() => {
    fetchData();
    if (!isSupabaseReady()) return;
    // Real-time subscription — auto-refresh saat ada INSERT/UPDATE/DELETE
    const channel = supabase
      .channel("transparansi-live")
      .on("postgres_changes", { event: "*", schema: "public", table: "transaksi" }, () => {
        fetchData();
      })
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [fetchData]);

  // ── Computed ─────────────────────────────────────────────────────────────
  const totMasuk  = transaksi.filter(t => t.tipe === "masuk").reduce((s, t) => s + t.jumlah, 0);
  const totKeluar = transaksi.filter(t => t.tipe === "keluar").reduce((s, t) => s + t.jumlah, 0);
  const saldo     = totMasuk - totKeluar;
  const pctTarget = Math.min(100, (totMasuk / RAB_TARGET) * 100);
  const txFil     = fTipe === "semua" ? transaksi : transaksi.filter(t => t.tipe === fTipe);

  // Style helpers - Heroic colors
  const C = { green: "#2F8F4E", bright: "#4FBF7E", gold: "#b8943f", red: "#f87171", dark: "#1C3A2B", cream: "#FAF8F3" };
  const card = (bg: string): React.CSSProperties => ({
    background: bg, border: "1.5px solid rgba(47,143,78,.15)",
    borderRadius: 16, padding: "clamp(16px, 4vw, 24px) clamp(16px, 4vw, 20px)", transition: "all 0.35s cubic-bezier(.22,1,.36,1)", cursor: "pointer"
  });

  return (
    <div className="pi" style={{ paddingTop: "clamp(60px,8vw,100px)", paddingBottom: "clamp(60px,8vw,100px)", background: "linear-gradient(135deg,rgba(250,248,243,.5) 0%,rgba(255,254,249,.8) 100%)", minHeight: "100vh" }}>
      <div style={{ maxWidth: 1100, margin: "0 auto", padding: "0 clamp(16px,3vw,28px)" }}>

        {/* Header */}
        <div style={{ textAlign: "center", marginBottom: 56 }}>
          <div style={{ display: "inline-flex", alignItems: "center", gap: 8, background: "rgba(79,191,126,.1)", border: "1.5px solid rgba(47,143,78,.2)", borderRadius: 99, padding: "clamp(4px, 1vw, 6px) clamp(12px, 3vw, 16px)", marginBottom: 20 }}>
            <div style={{ width: 8, height: 8, borderRadius: "50%", background: live ? "#2F8F4E" : "#9A8C85", animation: live ? "pulse-glow 2s infinite" : "none", boxShadow: live ? "0 0 12px rgba(47,143,78,.6)" : "none" }} />
            <span style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 10, fontWeight: 700, color: live ? "#2F8F4E" : "#9A8C85", letterSpacing: ".15em", textTransform: "uppercase" }}>
              {live ? <><Radio size={12} strokeWidth={2} /> Live · {updated}</> : <div style={{display:"flex", alignItems:"center", gap:6}}><Loader size={14} strokeWidth={2}/> Memuat...</div>}
            </span>
          </div>
          <div style={{ display: "inline-block", width: "44px", height: "3px", background: "linear-gradient(90deg, #2F8F4E, #4FBF7E)", borderRadius: "99px", boxShadow: "0 0 16px rgba(47,143,78,.4)", marginBottom: "20px" }} />
          <h1 className="fnt" style={{ fontSize: "clamp(32px,5vw,56px)", fontWeight: 300, background: "linear-gradient(135deg,#1C3A2B,#2F8F4E)", backgroundClip: "text", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent", lineHeight: 1.1, letterSpacing: "-.03em", marginBottom: 12 }}>
            Transparansi<br />Dana Kampung
          </h1>
          <p style={{ fontSize: 14, color: "#5A4A40", lineHeight: 1.8, maxWidth: 480, margin: "0 auto", fontWeight: 500 }}>
            Setiap rupiah yang masuk dan keluar dicatat secara terbuka dengan integrasi blockchain Web3. Data diperbarui otomatis secara real-time.
          </p>
        </div>

        {/* KPI Cards - Heroic */}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(min(100%, 130px),1fr))", gap: "clamp(12px, 2vw, 18px)", marginBottom: 36 }}>
          {[
            { label: "Total Masuk", val: fRp(totMasuk), icon: "📈", color: "#1C3A2B", valColor: "#2F8F4E", bg: "linear-gradient(135deg,rgba(79,191,126,.08) 0%,rgba(47,143,78,.04) 100%)", border: "rgba(47,143,78,.2)" },
            { label: "Total Keluar", val: fRp(totKeluar), icon: "📉", color: "#1C3A2B", valColor: "#B8472F", bg: "linear-gradient(135deg,rgba(248,113,113,.08) 0%,rgba(248,113,113,.02) 100%)", border: "rgba(248,113,113,.2)" },
            { label: "Saldo Dana", val: fRp(saldo), icon: <Coins size={20} strokeWidth={1.5} color="currentColor" />, color: "#1C3A2B", valColor: "#2F8F4E", bg: "linear-gradient(135deg,rgba(255,254,249,.8) 0%,rgba(232,245,238,.4) 100%)", border: "rgba(47,143,78,.15)" },
            { label: "Target RAB", val: fRp(RAB_TARGET), icon: <Target size={20} strokeWidth={1.5} color="currentColor" />, color: "#1C3A2B", valColor: "#9B7D4C", bg: "linear-gradient(135deg,rgba(184,148,63,.1) 0%,rgba(184,148,63,.04) 100%)", border: "rgba(184,148,63,.2)" },
          ].map((c, i) => (
            <div key={i} style={{ 
              minWidth: 0,
              background: c.bg, 
              border: `1.5px solid ${c.border}`,
              borderRadius: 16, 
              padding: "clamp(20px, 5vw, 28px) clamp(16px, 4vw, 22px)", 
              position: "relative", 
              overflow: "hidden",
              transition: "all 0.35s cubic-bezier(.22,1,.36,1)",
              cursor: "pointer",
              transform: "translateY(0)"
            }}
            onMouseEnter={e => {
              (e.currentTarget as HTMLElement).style.transform = "translateY(-6px)";
              (e.currentTarget as HTMLElement).style.boxShadow = "0 18px 52px rgba(47,143,78,.12)";
            }}
            onMouseLeave={e => {
              (e.currentTarget as HTMLElement).style.transform = "translateY(0)";
              (e.currentTarget as HTMLElement).style.boxShadow = "0 0 0 transparent";
            }}
            >
              <div style={{ fontSize: "clamp(8px, 2vw, 10px)", fontWeight: 800, letterSpacing: ".05em", textTransform: "uppercase", color: "#1C3A2B", marginBottom: 12, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{c.label}</div>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end" }}>
                <div className="fnt" style={{ fontSize: "clamp(16px,4vw,24px)", fontWeight: 700, color: c.valColor || c.color, lineHeight: 1, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis", paddingRight: 4 }}>{c.val}</div>
                <span style={{ fontSize: "clamp(18px, 4vw, 24px)", opacity: 0.7 }}>{c.icon}</span>
              </div>
            </div>
          ))}
        </div>

        {/* ── Progress RAB Global - Heroic ── */}
        <div style={{ background: "linear-gradient(135deg,rgba(255,254,249,.9),rgba(232,245,238,.5))", border: "1.5px solid rgba(47,143,78,.15)", borderRadius: 16, padding: "clamp(24px, 6vw, 32px) clamp(20px, 5vw, 28px)", marginBottom: 32, transition: "all 0.35s ease" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", marginBottom: 20, flexWrap: "wrap", gap: 16 }}>
            <div>
              <div style={{ fontSize: 11, fontWeight: 800, textTransform: "uppercase", letterSpacing: ".1em", color: "#2F8F4E", marginBottom: 6 }}><Target size={24} strokeWidth={1.5} />Target Global RAB 2026</div>
              <div style={{ fontSize: 14, color: "#5A4A40", fontWeight: 500 }}>
                Terkumpul <strong style={{ color: "#2F8F4E" }}>{fRp(totMasuk)}</strong> dari <strong>{fRp(RAB_TARGET)}</strong>
              </div>
            </div>
            <div className="fnt" style={{ fontSize: "clamp(32px,5vw,48px)", fontWeight: 300, color: "#2F8F4E", letterSpacing: "-.02em", lineHeight: 1 }}>
              {pctTarget.toFixed(1)}<span style={{ fontSize: "0.4em", opacity: 0.7 }}>%</span>
            </div>
          </div>
          
          {/* Progress bar with glow */}
          <div style={{ background: "rgba(47,143,78,.1)", borderRadius: 99, height: 10, overflow: "hidden", position: "relative", marginBottom: 20, boxShadow: "inset 0 1px 3px rgba(47,143,78,.1)" }}>
            <div style={{
              width: `${pctTarget}%`, 
              height: "100%", 
              borderRadius: 99,
              background: `linear-gradient(90deg, #2F8F4E 0%, #4FBF7E 100%)`,
              transition: "width 1.2s cubic-bezier(.22,1,.36,1)",
              boxShadow: `0 0 16px rgba(47,143,78,.5), inset 0 1px 2px rgba(47,143,78,.2)`,
            }} />
          </div>
          
          {/* Milestones */}
          <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 20 }}>
            {[25, 50, 75, 100].map(m => (
              <div key={m} style={{ textAlign: "center", flex: 1 }}>
                <div style={{ width: "100%", height: 3, background: "rgba(47,143,78,.1)", margin: "0 auto 6px", borderRadius: 2 }} />
                <span style={{ fontSize: 10, color: pctTarget >= m ? "#2F8F4E" : "#9A8C85", fontWeight: 700, letterSpacing: ".05em" }}>{m}%</span>
              </div>
            ))}
          </div>
          
          {/* Sisa target info */}
          {totMasuk < RAB_TARGET && (
            <div style={{ padding: "clamp(8px, 2vw, 12px) clamp(12px, 3vw, 16px)", background: "linear-gradient(135deg,rgba(184,148,63,.1) 0%,rgba(184,148,63,.05) 100%)", border: "1.5px solid rgba(184,148,63,.2)", borderRadius: 12, fontSize: 13, color: "#2F8F4E", fontWeight: 500, display: "flex", alignItems: "center", gap: 10 }}>
              <span><PartyPopper size={16} /></span>
              <span>Masih butuh <strong>{fRp(RAB_TARGET - totMasuk)}</strong> untuk target global</span>
            </div>
          )}
        </div>

        {/* ── 2-col: Flow Chart + Alokasi Donut ── */}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(min(100%, 240px),1fr))", gap: "clamp(16px, 3vw, 20px)", marginBottom: 28 }}>

          {/* Area chart: performa aliran dana */}
          <div style={{ ...card("linear-gradient(135deg,rgba(255,254,249,.9),rgba(232,245,238,.5))") }}>
            <div style={{ fontSize: 12, fontWeight: 800, textTransform: "uppercase", letterSpacing: ".1em", color: "#2F8F4E", marginBottom: 20 }}><TrendingUp size={24} strokeWidth={1.5} />Performa Aliran Dana (Per Bulan)</div>
            <DanaFlowChart transaksi={transaksi} />
          </div>

          {/* Donut: distribusi pengeluaran RAB */}
          <div style={{ ...card("linear-gradient(135deg,rgba(255,254,249,.9),rgba(232,245,238,.5))") }}>
            <div style={{ fontSize: 12, fontWeight: 800, textTransform: "uppercase", letterSpacing: ".1em", color: "#2F8F4E", marginBottom: 20 }}>Distribusi Pengeluaran per Program</div>
            <AlokasiDonut transaksi={transaksi} />
          </div>
        </div>

        {/* ── Rincian Alokasi RAB per Program ── */}
        <div style={{ marginBottom: 28 }}>
          <div style={{ fontSize: 12, fontWeight: 800, textTransform: "uppercase", letterSpacing: ".1em", color: "#2F8F4E", marginBottom: 18 }}>Rincian Alokasi Dana per Program RAB</div>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(min(100%, 260px),1fr))", gap: "clamp(14px, 3vw, 20px)" }}>
            {ALOKASI.map((item, i) => {
              const used = transaksi.filter(t => t.tipe === "keluar" && t.kategori === item.label).reduce((s, t) => s + t.jumlah, 0);
              const pct = Math.min(100, (used / item.target) * 100);
              const sisa = item.target - used;
              const col = ALOKASI_COLORS[i];
              return (
                <div key={i} style={{ minWidth: 0, ...card("linear-gradient(135deg,rgba(255,254,249,.9),rgba(232,245,238,.5))") }}>
                  <div style={{ display: "flex", gap: 10, alignItems: "flex-start", marginBottom: 14 }}>
                    <span style={{ fontSize: 22, lineHeight: 1, marginTop: 1 }}>{item.icon}</span>
                    <div style={{ flex: 1 }}>
                      <div style={{ fontSize: 12, fontWeight: 700, color: "#1C3A2B", lineHeight: 1.3, marginBottom: 3 }}>{item.label}</div>
                      <div style={{ fontSize: 10, color: "#5A4A40", lineHeight: 1.4 }}>{item.desc}</div>
                    </div>
                    <span style={{ fontSize: 16, fontWeight: 900, color: col, whiteSpace: "nowrap", lineHeight: 1 }}>{Math.round(pct)}%</span>
                  </div>
                  {/* Progress */}
                  <div style={{ background: "rgba(47,143,78,.08)", borderRadius: 99, height: 8, overflow: "hidden", marginBottom: 12 }}>
                    <div style={{
                      width: `${pct}%`, height: "100%", borderRadius: 99, background: col,
                      transition: "width 1.2s cubic-bezier(.34,1.1,.64,1)",
                      boxShadow: pct > 0 ? `0 0 8px ${col}60` : "none",
                    }} />
                  </div>
                  {/* Angka */}
                  <div style={{ display: "flex", justifyContent: "space-between", fontSize: 11, marginBottom: 4 }}>
                    <span style={{ color: col, fontWeight: 700 }}>{fRp(used)} terpakai</span>
                    <span style={{ color: "#5A4A40", fontWeight: 500 }}>{fRp(sisa)} sisa</span>
                  </div>
                  {/* Target */}
                  <div style={{ fontSize: 10, color: "#9A8C85" }}>Target: {fRp(item.target)}</div>
                </div>
              );
            })}
          </div>
        </div>

        {/* ── Riwayat Transaksi ── */}
        <div>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 18, flexWrap: "wrap", gap: 12 }}>
            <div style={{ fontSize: 12, fontWeight: 800, textTransform: "uppercase", letterSpacing: ".1em", color: "#2F8F4E" }}>Riwayat Transaksi ({txFil.length})</div>
            <div style={{ display: "flex", gap: 8 }}>
              {(["semua", "masuk", "keluar"] as const).map(f => (
                <button key={f} onClick={() => setFTipe(f)} style={{
                  padding: "clamp(6px, 2vw, 8px) clamp(12px, 3vw, 16px)", fontSize: 11, fontWeight: 700, letterSpacing: ".07em", textTransform: "uppercase",
                  border: fTipe === f ? "1.5px solid #2F8F4E" : "1.5px solid rgba(47,143,78,.2)", borderRadius: 8, cursor: "pointer", transition: "all 0.3s",
                  background: fTipe === f ? "linear-gradient(135deg,#2F8F4E,#4FBF7E)" : "rgba(255,254,249,.8)",
                  color: fTipe === f ? "#FFF" : "#1C3A2B",
                  boxShadow: fTipe === f ? "0 4px 12px rgba(47,143,78,.2)" : "none",
                }}>
                  {f}
                </button>
              ))}
            </div>
          </div>

          <div style={{ background: "linear-gradient(135deg,rgba(255,254,249,.95),rgba(232,245,238,.5))", border: "1.5px solid rgba(47,143,78,.12)", borderRadius: 16, overflow: "hidden" }}>
            <div style={{ overflowX: "auto" }}>
              <table style={{ width: "100%", borderCollapse: "collapse", fontFamily: "'Inter',system-ui,sans-serif" }}>
                <thead>
                  <tr style={{ borderBottom: "1.5px solid rgba(47,143,78,.12)" }}>
                    {["Tanggal", "Keterangan", "Kategori", "Tipe", "Jumlah"].map((h, i) => (
                      <th key={h} style={{ padding: "clamp(10px, 3vw, 14px) clamp(12px, 3vw, 16px)", fontSize: 10, fontWeight: 800, letterSpacing: ".1em", textTransform: "uppercase", color: "#2F8F4E", textAlign: i === 4 ? "right" : "left", whiteSpace: "nowrap" }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {txFil.map((t, i) => (
                    <tr key={t.id} style={{ borderBottom: i < txFil.length - 1 ? "1px solid rgba(47,143,78,.1)" : "none", transition: "background .15s" }}
                      onMouseEnter={e => (e.currentTarget.style.background = "rgba(47,143,78,.05)")}
                      onMouseLeave={e => (e.currentTarget.style.background = "transparent")}>
                      <td style={{ padding: "clamp(10px, 3vw, 13px) clamp(12px, 3vw, 16px)", fontSize: 12, color: "#5A4A40", whiteSpace: "nowrap", fontWeight: 500 }}>
                        {new Date(t.tanggal).toLocaleDateString("id-ID", { day: "numeric", month: "short", year: "numeric" })}
                      </td>
                      <td style={{ padding: "clamp(10px, 3vw, 13px) clamp(12px, 3vw, 16px)", fontSize: 13, color: "#1C3A2B", maxWidth: 240, fontWeight: 500 }}>{t.keterangan}</td>
                      <td style={{ padding: "clamp(10px, 3vw, 13px) clamp(12px, 3vw, 16px)" }}>
                        <span style={{ padding: "clamp(4px, 1vw, 4px) clamp(8px, 2vw, 12px)", background: "rgba(47,143,78,.08)", borderRadius: 8, fontSize: 11, fontWeight: 600, color: "#2F8F4E", whiteSpace: "nowrap" }}>
                          {t.kategori}
                        </span>
                      </td>
                      <td style={{ padding: "clamp(10px, 3vw, 13px) clamp(12px, 3vw, 16px)" }}>
                        <span style={{
                          padding: "clamp(4px, 1vw, 4px) clamp(8px, 2vw, 12px)", borderRadius: 8, fontSize: 11, fontWeight: 700, whiteSpace: "nowrap",
                          background: t.tipe === "masuk" ? "rgba(79,191,126,.15)" : "rgba(184,72,48,.15)",
                          color: t.tipe === "masuk" ? "#2F8F4E" : "#B8472F",
                        }}>
                          {t.tipe === "masuk" ? "↑ Masuk" : "↓ Keluar"}
                        </span>
                      </td>
                      <td style={{ padding: "clamp(10px, 3vw, 13px) clamp(12px, 3vw, 16px)", textAlign: "right", fontWeight: 700, whiteSpace: "nowrap", fontSize: 13, color: t.tipe === "masuk" ? "#2F8F4E" : "#B8472F" }}>
                        {t.tipe === "masuk" ? "+" : "−"}{fRp(t.jumlah)}
                      </td>
                    </tr>
                  ))}
                  {txFil.length === 0 && (
                    <tr><td colSpan={5} style={{ padding: "clamp(24px, 6vw, 40px)", textAlign: "center", color: "#9A8C85", fontSize: 13 }}>Tidak ada transaksi</td></tr>
                  )}
                </tbody>
              </table>
            </div>
            {/* Footer */}
            <div style={{ padding: "clamp(10px, 3vw, 14px) clamp(16px, 4vw, 22px)", borderTop: "1px solid rgba(47,143,78,.12)", display: "flex", justifyContent: "flex-end", gap: 24, flexWrap: "wrap" }}>
              <span style={{ fontSize: 12, fontWeight: 700, color: "#2F8F4E" }}>Masuk: {fRp(totMasuk)}</span>
              <span style={{ fontSize: 12, fontWeight: 700, color: "#B8472F" }}>Keluar: {fRp(totKeluar)}</span>
              <span style={{ fontSize: 13, fontWeight: 900, color: "#1C3A2B" }}>Saldo: {fRp(saldo)}</span>
            </div>
          </div>

          <div style={{ marginTop: 16, padding: "clamp(10px, 3vw, 13px) clamp(14px, 4vw, 18px)", background: "rgba(184,148,63,.08)", border: "1px solid rgba(184,148,63,.2)", borderRadius: 13, display: "flex", gap: 10, alignItems: "flex-start" }}>
            <span style={{ fontSize: 16 }}>ℹ️</span>
            <div style={{ fontSize: 12, lineHeight: 1.7, color: "#7A6B5D" }}>
              Data diperbarui otomatis secara real-time via Supabase. Pertanyaan terkait keuangan: <strong>ciburial.smarthub@gmail.com</strong>
            </div>
          </div>

          {/* METODE DONASI & WALLET */}
          <div style={{ marginTop: 40, padding: 0 }}>
            <h3 className="fnt" style={{ fontSize: 24, fontWeight: 300, color: "#1C3A2B", marginBottom: 24, borderBottom: "2px solid rgba(47,143,78,.2)", paddingBottom: "clamp(8px, 2vw, 12px)" }}>Metode Donasi & Penerima</h3>
            
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(min(100%, 260px), 1fr))", gap: "clamp(14px, 3vw, 20px)" }}>
              {[
                { 
                  icon: <Smartphone size={24} strokeWidth={1.5} />, 
                  title: "QRIS & E-Wallet", 
                  desc: "Donasi instan melalui Midtrans (dukungan semua e-wallet populer)",
                  detail: "Klik tombol 'Donasi' di halaman utama"
                },
                { 
                  icon: <Landmark size={24} strokeWidth={1.5} />, 
                  title: "Transfer Bank", 
                  desc: "Rekening resmi untuk donasi melalui perbankan",
                  detail: "SeaBank: 90135555066\na.n Ubay Rahmat H"
                },
                { 
                  icon: <Search size={24} strokeWidth={1.5} />, 
                  title: "Crypto / Web3", 
                  desc: "Untuk donasi menggunakan aset digital",
                  detail: "0x71723715478b344164e992b49ae1fCEb6467888B\n(EVM-Compatible)"
                }
              ].map((m, i) => (
                <div key={i} style={{ padding: "clamp(16px, 4vw, 20px)", background: "rgba(47,143,78,.04)", border: "1.5px solid rgba(47,143,78,.12)", borderRadius: 14, display: "flex", flexDirection: "column", gap: 12 }}>
                  <div style={{ fontSize: 32 }}>{m.icon}</div>
                  <div>
                    <h4 style={{ fontSize: 14, fontWeight: 700, color: "#1C3A2B", marginBottom: 6 }}>{m.title}</h4>
                    <p style={{ fontSize: 12, color: "#5A4A40", lineHeight: 1.6, marginBottom: 10 }}>{m.desc}</p>
                    <div style={{ padding: "clamp(8px, 2vw, 12px)", background: "rgba(255,255,255,.6)", borderRadius: 8, border: "1px solid rgba(47,143,78,.1)", fontSize: 12, color: "#1C3A2B", fontFamily: "monospace", fontWeight: 500, lineHeight: 1.6, whiteSpace: "pre-wrap", wordBreak: "break-all" }}>
                      {m.detail}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      <style>{`@keyframes dashPulse{0%,100%{opacity:1;transform:scale(1)}50%{opacity:.5;transform:scale(1.2)}}`}</style>
    </div>
  );
}
