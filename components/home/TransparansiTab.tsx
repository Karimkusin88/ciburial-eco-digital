"use client";
import { useState, useEffect, useCallback } from "react";
import { supabase, isSupabaseReady } from "@/lib/supabase";
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
      <div style={{ height: H, display: "flex", alignItems: "center", justifyContent: "center", color: "rgba(255,255,255,.3)", fontSize: 13 }}>
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
            stroke="rgba(255,255,255,0.06)" strokeWidth={1} strokeDasharray="4 3" />
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
            fontSize={9} fill="rgba(255,255,255,0.35)" fontFamily="Inter,system-ui,sans-serif">
            {label}
          </text>
        ))}
        {/* Y label (max) */}
        <text x={PX - 6} y={PY + 4} textAnchor="end" fontSize={8} fill="rgba(255,255,255,0.25)" fontFamily="Inter,system-ui,sans-serif">
          {(maxV / 1e6).toFixed(1)}jt
        </text>
      </svg>
      {/* Legend */}
      <div style={{ display: "flex", gap: 20, justifyContent: "center", marginTop: 6 }}>
        {[{ color: "#4ade80", label: "Dana Masuk" }, { color: "#f87171", label: "Dana Keluar" }].map(l => (
          <div key={l.label} style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 11, color: "rgba(255,255,255,0.55)" }}>
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
      <div style={{ height: 140, display: "flex", alignItems: "center", justifyContent: "center", color: "rgba(255,255,255,.3)", fontSize: 13, textAlign: "center" }}>
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
        <circle cx={CX} cy={CY} r={R} fill="none" stroke="rgba(255,255,255,0.07)" strokeWidth={SW} />
        {arcs.map((a, i) => (
          <circle key={i} cx={CX} cy={CY} r={R} fill="none" stroke={a.color} strokeWidth={SW}
            strokeDasharray={`${a.dash} ${circ - a.dash}`}
            strokeDashoffset={-a.off}
            style={{ transition: "stroke-dasharray 0.8s ease" }} />
        ))}
        <text x={CX} y={CY - 6} textAnchor="middle" fontSize={12} fontWeight="900" fill="#f5f0e8" fontFamily="Inter,system-ui,sans-serif">
          {fRp(totalUsed).replace("Rp ", "")}
        </text>
        <text x={CX} y={CY + 9} textAnchor="middle" fontSize={8} fill="rgba(255,255,255,0.4)" fontFamily="Inter,system-ui,sans-serif">
          total keluar
        </text>
      </svg>
      <div style={{ flex: 1, minWidth: 160 }}>
        {keluar.map((a, i) => (
          <div key={i} style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 8 }}>
            <div style={{ width: 8, height: 8, borderRadius: 2, background: a.color, flexShrink: 0 }} />
            <span style={{ flex: 1, fontSize: 11, color: "rgba(255,255,255,0.6)", lineHeight: 1.3 }}>{a.label}</span>
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

  // Style helpers
  const C = { green: "#2d5a40", bright: "#4ade80", gold: "#b8943f", red: "#f87171", dark: "#1a2e1f", cream: "#f5f0e8" };
  const card = (bg: string): React.CSSProperties => ({
    background: bg, border: "1px solid rgba(255,255,255,0.09)",
    borderRadius: 20, padding: "22px 20px",
  });

  return (
    <div className="pi" style={{ paddingTop: "clamp(48px,8vw,106px)", paddingBottom: "clamp(48px,8vw,106px)", background: C.dark, minHeight: "100vh" }}>
      <div style={{ maxWidth: 1100, margin: "0 auto", padding: "0 clamp(16px,3vw,28px)" }}>

        {/* Header */}
        <div style={{ textAlign: "center", marginBottom: 48 }}>
          <div style={{ display: "inline-flex", alignItems: "center", gap: 8, background: "rgba(74,222,128,0.1)", border: "1px solid rgba(74,222,128,0.2)", borderRadius: 99, padding: "5px 16px", marginBottom: 18 }}>
            <div style={{ width: 7, height: 7, borderRadius: "50%", background: live ? C.bright : "#666", animation: live ? "dashPulse 1.5s infinite" : "none" }} />
            <span style={{ fontSize: 10, fontWeight: 700, color: live ? C.bright : "#888", letterSpacing: ".14em", textTransform: "uppercase" }}>
              {live ? `Live · ${updated}` : "Memuat…"}
            </span>
          </div>
          <h1 className="fnt" style={{ fontSize: "clamp(30px,5vw,58px)", fontWeight: 300, color: C.cream, lineHeight: 1.05, letterSpacing: "-.025em", marginBottom: 10 }}>
            Transparansi<br /><em style={{ color: C.bright }}>Dana Kampung</em>
          </h1>
          <p style={{ fontSize: 14, color: "rgba(245,240,232,.5)", lineHeight: 1.7, maxWidth: 400, margin: "0 auto" }}>
            Setiap rupiah yang masuk dan keluar dicatat secara terbuka.<br />Data diperbarui otomatis secara real-time.
          </p>
        </div>

        {/* KPI Cards */}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(190px,1fr))", gap: 14, marginBottom: 32 }}>
          {[
            { label: "Total Masuk", val: fRp(totMasuk), icon: "↑", color: C.bright, bg: "rgba(74,222,128,0.1)" },
            { label: "Total Keluar", val: fRp(totKeluar), icon: "↓", color: C.red, bg: "rgba(248,113,113,0.1)" },
            { label: "Saldo Dana", val: fRp(saldo), icon: "◎", color: C.cream, bg: "rgba(255,255,255,0.06)" },
            { label: "Target RAB", val: fRp(RAB_TARGET), icon: "◈", color: C.gold, bg: "rgba(184,148,63,0.1)" },
          ].map((c, i) => (
            <div key={i} style={{ ...card(c.bg), position: "relative", overflow: "hidden" }}>
              <div style={{ fontSize: 10, fontWeight: 700, letterSpacing: ".1em", textTransform: "uppercase", color: "rgba(255,255,255,.4)", marginBottom: 10 }}>{c.label}</div>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end" }}>
                <div className="fnt" style={{ fontSize: "clamp(14px,2vw,20px)", fontWeight: 600, color: c.color, lineHeight: 1 }}>{c.val}</div>
                <span style={{ fontSize: 18, color: c.color, opacity: 0.5 }}>{c.icon}</span>
              </div>
            </div>
          ))}
        </div>

        {/* ── Progress RAB Global ── */}
        <div style={{ ...card("rgba(255,255,255,0.04)"), marginBottom: 28 }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", marginBottom: 14, flexWrap: "wrap", gap: 8 }}>
            <div>
              <div style={{ fontSize: 11, fontWeight: 800, textTransform: "uppercase", letterSpacing: ".1em", color: "rgba(255,255,255,.4)", marginBottom: 4 }}>🎯 Progress Pencapaian Target RAB Global</div>
              <div style={{ fontSize: 13, color: "rgba(255,255,255,.6)" }}>
                Terkumpul <strong style={{ color: C.bright }}>{fRp(totMasuk)}</strong> dari target <strong style={{ color: C.gold }}>{fRp(RAB_TARGET)}</strong>
              </div>
            </div>
            <div className="fnt" style={{ fontSize: 38, fontWeight: 300, color: C.bright, letterSpacing: "-.02em", lineHeight: 1 }}>
              {pctTarget.toFixed(1)}<span style={{ fontSize: 18, opacity: 0.7 }}>%</span>
            </div>
          </div>
          {/* Progress bar */}
          <div style={{ background: "rgba(255,255,255,0.08)", borderRadius: 99, height: 12, overflow: "hidden", position: "relative" }}>
            <div style={{
              width: `${pctTarget}%`, height: "100%", borderRadius: 99,
              background: `linear-gradient(90deg, ${C.green} 0%, ${C.bright} 100%)`,
              transition: "width 1.2s cubic-bezier(.34,1.1,.64,1)",
              boxShadow: `0 0 12px rgba(74,222,128,0.4)`,
            }} />
          </div>
          {/* Milestones */}
          <div style={{ display: "flex", justifyContent: "space-between", marginTop: 10 }}>
            {[25, 50, 75, 100].map(m => (
              <div key={m} style={{ textAlign: "center" }}>
                <div style={{ width: 1, height: 6, background: "rgba(255,255,255,0.15)", margin: "0 auto 3px" }} />
                <span style={{ fontSize: 9, color: pctTarget >= m ? C.bright : "rgba(255,255,255,.25)", fontWeight: 700 }}>{m}%</span>
              </div>
            ))}
          </div>
          {/* Sisa target */}
          {totMasuk < RAB_TARGET && (
            <div style={{ marginTop: 14, padding: "10px 14px", background: "rgba(184,148,63,0.08)", border: "1px solid rgba(184,148,63,0.18)", borderRadius: 12, fontSize: 12, color: C.gold }}>
              💰 Masih perlu <strong>{fRp(RAB_TARGET - totMasuk)}</strong> lagi untuk mencapai target RAB Global
            </div>
          )}
        </div>

        {/* ── 2-col: Flow Chart + Alokasi Donut ── */}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(300px,1fr))", gap: 20, marginBottom: 28 }}>

          {/* Area chart: performa aliran dana */}
          <div style={{ ...card("rgba(255,255,255,0.04)") }}>
            <div style={{ fontSize: 11, fontWeight: 800, textTransform: "uppercase", letterSpacing: ".1em", color: "rgba(255,255,255,.4)", marginBottom: 18 }}>📈 Performa Aliran Dana (Per Bulan)</div>
            <DanaFlowChart transaksi={transaksi} />
          </div>

          {/* Donut: distribusi pengeluaran RAB */}
          <div style={{ ...card("rgba(255,255,255,0.04)") }}>
            <div style={{ fontSize: 11, fontWeight: 800, textTransform: "uppercase", letterSpacing: ".1em", color: "rgba(255,255,255,.4)", marginBottom: 18 }}>🍩 Distribusi Pengeluaran per Program</div>
            <AlokasiDonut transaksi={transaksi} />
          </div>
        </div>

        {/* ── Rincian Alokasi RAB per Program ── */}
        <div style={{ marginBottom: 28 }}>
          <div style={{ fontSize: 11, fontWeight: 800, textTransform: "uppercase", letterSpacing: ".1em", color: "rgba(255,255,255,.4)", marginBottom: 16 }}>📊 Rincian Alokasi Dana per Program RAB</div>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(260px,1fr))", gap: 14 }}>
            {ALOKASI.map((item, i) => {
              const used = transaksi.filter(t => t.tipe === "keluar" && t.kategori === item.label).reduce((s, t) => s + t.jumlah, 0);
              const pct = Math.min(100, (used / item.target) * 100);
              const sisa = item.target - used;
              const col = ALOKASI_COLORS[i];
              return (
                <div key={i} style={{ ...card("rgba(255,255,255,0.04)") }}>
                  <div style={{ display: "flex", gap: 10, alignItems: "flex-start", marginBottom: 14 }}>
                    <span style={{ fontSize: 22, lineHeight: 1, marginTop: 1 }}>{item.icon}</span>
                    <div style={{ flex: 1 }}>
                      <div style={{ fontSize: 12, fontWeight: 700, color: C.cream, lineHeight: 1.3, marginBottom: 3 }}>{item.label}</div>
                      <div style={{ fontSize: 10, color: "rgba(255,255,255,.35)", lineHeight: 1.4 }}>{item.desc}</div>
                    </div>
                    <span style={{ fontSize: 16, fontWeight: 900, color: col, whiteSpace: "nowrap", lineHeight: 1 }}>{Math.round(pct)}%</span>
                  </div>
                  {/* Progress */}
                  <div style={{ background: "rgba(255,255,255,0.08)", borderRadius: 99, height: 7, overflow: "hidden", marginBottom: 10 }}>
                    <div style={{
                      width: `${pct}%`, height: "100%", borderRadius: 99, background: col,
                      transition: "width 1.2s cubic-bezier(.34,1.1,.64,1)",
                      boxShadow: pct > 0 ? `0 0 8px ${col}60` : "none",
                    }} />
                  </div>
                  {/* Angka */}
                  <div style={{ display: "flex", justifyContent: "space-between", fontSize: 11 }}>
                    <span style={{ color: col, fontWeight: 700 }}>{fRp(used)} terpakai</span>
                    <span style={{ color: "rgba(255,255,255,.35)" }}>{fRp(sisa)} sisa</span>
                  </div>
                  {/* Target */}
                  <div style={{ marginTop: 4, fontSize: 10, color: "rgba(255,255,255,.2)" }}>Target: {fRp(item.target)}</div>
                </div>
              );
            })}
          </div>
        </div>

        {/* ── Riwayat Transaksi ── */}
        <div>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16, flexWrap: "wrap", gap: 12 }}>
            <div style={{ fontSize: 11, fontWeight: 800, textTransform: "uppercase", letterSpacing: ".1em", color: "rgba(255,255,255,.4)" }}>📋 Riwayat Transaksi ({txFil.length})</div>
            <div style={{ display: "flex", gap: 6 }}>
              {(["semua", "masuk", "keluar"] as const).map(f => (
                <button key={f} onClick={() => setFTipe(f)} style={{
                  padding: "7px 15px", fontSize: 11, fontWeight: 700, letterSpacing: ".07em", textTransform: "uppercase",
                  border: "1px solid rgba(255,255,255,.12)", borderRadius: 99, cursor: "pointer", transition: "all .2s",
                  background: fTipe === f ? C.bright : "transparent",
                  color: fTipe === f ? C.dark : "rgba(255,255,255,.45)",
                }}>
                  {f}
                </button>
              ))}
            </div>
          </div>

          <div style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.09)", borderRadius: 20, overflow: "hidden" }}>
            <div style={{ overflowX: "auto" }}>
              <table style={{ width: "100%", borderCollapse: "collapse", fontFamily: "'Inter',system-ui,sans-serif" }}>
                <thead>
                  <tr style={{ borderBottom: "1px solid rgba(255,255,255,0.08)" }}>
                    {["Tanggal", "Keterangan", "Kategori", "Tipe", "Jumlah"].map((h, i) => (
                      <th key={h} style={{ padding: "12px 16px", fontSize: 9, fontWeight: 800, letterSpacing: ".1em", textTransform: "uppercase", color: "rgba(255,255,255,.3)", textAlign: i === 4 ? "right" : "left", whiteSpace: "nowrap" }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {txFil.map((t, i) => (
                    <tr key={t.id} style={{ borderBottom: i < txFil.length - 1 ? "1px solid rgba(255,255,255,0.05)" : "none", transition: "background .15s" }}
                      onMouseEnter={e => (e.currentTarget.style.background = "rgba(255,255,255,0.04)")}
                      onMouseLeave={e => (e.currentTarget.style.background = "transparent")}>
                      <td style={{ padding: "13px 16px", fontSize: 12, color: "rgba(255,255,255,.45)", whiteSpace: "nowrap" }}>
                        {new Date(t.tanggal).toLocaleDateString("id-ID", { day: "numeric", month: "short", year: "numeric" })}
                      </td>
                      <td style={{ padding: "13px 16px", fontSize: 13, color: C.cream, maxWidth: 240 }}>{t.keterangan}</td>
                      <td style={{ padding: "13px 16px" }}>
                        <span style={{ padding: "3px 10px", background: "rgba(255,255,255,0.07)", borderRadius: 99, fontSize: 11, fontWeight: 600, color: "rgba(255,255,255,.55)", whiteSpace: "nowrap" }}>
                          {t.kategori}
                        </span>
                      </td>
                      <td style={{ padding: "13px 16px" }}>
                        <span style={{
                          padding: "3px 10px", borderRadius: 99, fontSize: 11, fontWeight: 700, whiteSpace: "nowrap",
                          background: t.tipe === "masuk" ? "rgba(74,222,128,0.15)" : "rgba(248,113,113,0.15)",
                          color: t.tipe === "masuk" ? C.bright : C.red,
                        }}>
                          {t.tipe === "masuk" ? "↑ Masuk" : "↓ Keluar"}
                        </span>
                      </td>
                      <td style={{ padding: "13px 16px", textAlign: "right", fontWeight: 700, whiteSpace: "nowrap", fontSize: 13, color: t.tipe === "masuk" ? C.bright : C.red }}>
                        {t.tipe === "masuk" ? "+" : "−"}{fRp(t.jumlah)}
                      </td>
                    </tr>
                  ))}
                  {txFil.length === 0 && (
                    <tr><td colSpan={5} style={{ padding: 40, textAlign: "center", color: "rgba(255,255,255,.25)", fontSize: 13 }}>Tidak ada transaksi</td></tr>
                  )}
                </tbody>
              </table>
            </div>
            {/* Footer */}
            <div style={{ padding: "14px 22px", borderTop: "1px solid rgba(255,255,255,0.08)", display: "flex", justifyContent: "flex-end", gap: 24, flexWrap: "wrap" }}>
              <span style={{ fontSize: 12, fontWeight: 700, color: C.bright }}>Masuk: {fRp(totMasuk)}</span>
              <span style={{ fontSize: 12, fontWeight: 700, color: C.red }}>Keluar: {fRp(totKeluar)}</span>
              <span style={{ fontSize: 13, fontWeight: 900, color: C.cream }}>Saldo: {fRp(saldo)}</span>
            </div>
          </div>

          <div style={{ marginTop: 16, padding: "13px 18px", background: "rgba(184,148,63,.07)", border: "1px solid rgba(184,148,63,.18)", borderRadius: 13, display: "flex", gap: 10, alignItems: "flex-start" }}>
            <span style={{ fontSize: 16 }}>ℹ️</span>
            <div style={{ fontSize: 12, lineHeight: 1.7, color: "rgba(184,148,63,.8)" }}>
              Data diperbarui otomatis secara real-time via Supabase. Pertanyaan terkait keuangan: <strong>ciburial.smarthub@gmail.com</strong>
            </div>
          </div>
        </div>
      </div>

      <style>{`@keyframes dashPulse{0%,100%{opacity:1;transform:scale(1)}50%{opacity:.5;transform:scale(1.2)}}`}</style>
    </div>
  );
}
