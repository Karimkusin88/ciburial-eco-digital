"use client";
import { useState } from "react";
import { Transaksi, ALOKASI } from "./types";
import { fRp } from "./types";

interface TransparansiTabProps {
  transaksi: Transaksi[];
  totMasuk: number;
  totKeluar: number;
  saldo: number;
  totTarget: number;
}

export default function TransparansiTab({ transaksi, totMasuk, totKeluar, saldo, totTarget }: TransparansiTabProps) {
  const [fTipe, setFTipe] = useState<"semua" | "masuk" | "keluar">("semua");
  const txFil = fTipe === "semua" ? transaksi : transaksi.filter(t => t.tipe === fTipe);

  return (
    <div className="pi" style={{ paddingTop: "clamp(48px,8vw,106px)", paddingBottom: "clamp(48px,8vw,106px)" }}>
      <div style={{ maxWidth: 1100, margin: "0 auto", padding: "0 clamp(16px,3vw,28px)" }}>

        <div style={{ textAlign: "center", marginBottom: 48 }}>
          <div className="dl dlc" />
          <h1 className="fnt" style={{ fontSize: "clamp(30px,5vw,58px)", fontWeight: 300, color: "var(--fo)", lineHeight: 1.05, letterSpacing: "-.025em", marginBottom: 10 }}>Transparansi<br /><em>Dana Kampung</em></h1>
          <p style={{ fontSize: 14, color: "var(--ts)", lineHeight: 1.7, maxWidth: 400, margin: "0 auto" }}>
            Setiap rupiah yang masuk dan keluar dicatat secara terbuka.<br />Kepercayaan Anda adalah amanah yang kami jaga.
          </p>
        </div>

        {/* Summary cards */}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(190px,1fr))", gap: 14, marginBottom: 36 }}>
          {[
            { label: "Total Masuk", val: fRp(totMasuk), icon: "↑", c: "var(--gt)", bg: "var(--gb)" },
            { label: "Total Keluar", val: fRp(totKeluar), icon: "↓", c: "var(--rt)", bg: "var(--rb)" },
            { label: "Saldo Dana", val: fRp(saldo), icon: "◎", c: "var(--fo)", bg: "var(--cd)" },
            { label: "Target RAB", val: fRp(totTarget), icon: "◈", c: "var(--em)", bg: "rgba(184,148,63,.1)" },
          ].map((card, i) => (
            <div key={i} className={`rv d${i + 1}`} style={{ padding: "24px", background: "var(--cw)", border: "1px solid var(--bo)", borderRadius: 18 }}>
              <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 10 }}>
                <span style={{ fontSize: 10, fontWeight: 700, letterSpacing: ".1em", textTransform: "uppercase", color: "var(--tm)" }}>{card.label}</span>
                <span style={{ padding: "3px 9px", background: card.bg, color: card.c, borderRadius: 99, fontSize: 13, fontWeight: 800 }}>{card.icon}</span>
              </div>
              <div className="fnt" style={{ fontSize: "clamp(16px,2.3vw,24px)", fontWeight: 600, color: card.c, lineHeight: 1 }}>{card.val}</div>
            </div>
          ))}
        </div>

        {/* Progress global */}
        <div className="pgw" style={{ padding: "24px 28px", background: "var(--cw)", border: "1px solid var(--bo)", borderRadius: 18, marginBottom: 36 }}>
          <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 12, flexWrap: "wrap", gap: 8 }}>
            <span style={{ fontSize: 13, fontWeight: 700, color: "var(--tp)" }}>Progress Pencapaian Target RAB (Rp 250 juta)</span>
            <span style={{ fontSize: 14, fontWeight: 700, color: "var(--fo)" }}>{Math.round((totMasuk / totTarget) * 100)}%</span>
          </div>
          <div className="pg" style={{ height: 8 }}><div className="pgf" style={{ background: "linear-gradient(90deg,var(--fo) 0%,var(--fl) 100%)", width: `${Math.min(100, (totMasuk / totTarget) * 100)}%` }} /></div>
          <div style={{ fontSize: 11, color: "var(--tm)", marginTop: 8 }}>Terkumpul {fRp(totMasuk)} dari target {fRp(totTarget)}</div>
        </div>

        {/* Alokasi breakdown */}
        <div style={{ marginBottom: 36 }}>
          <h3 style={{ fontSize: 11, fontWeight: 700, letterSpacing: ".12em", textTransform: "uppercase", color: "var(--tm)", marginBottom: 16 }}>Rincian Alokasi Dana (RAB Global)</h3>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(230px,1fr))", gap: 12 }}>
            {ALOKASI.map((item, i) => {
              const used = transaksi.filter(t => t.tipe === "keluar" && t.kategori === item.label).reduce((s, t) => s + t.jumlah, 0);
              const pct = Math.min(100, (used / item.target) * 100);
              return (
                <div key={i} className={`rv pgw d${i + 1}`} style={{ padding: "18px 20px", background: "var(--cw)", border: "1px solid var(--bo)", borderRadius: 15 }}>
                  <div style={{ display: "flex", gap: 10, alignItems: "flex-start", marginBottom: 10 }}>
                    <span style={{ fontSize: 20, marginTop: 1 }}>{item.icon}</span>
                    <div style={{ flex: 1 }}>
                      <div style={{ fontSize: 12, fontWeight: 700, color: "var(--tp)" }}>{item.label}</div>
                      <div style={{ fontSize: 11, color: "var(--tm)" }}>{fRp(used)} / {fRp(item.target)}</div>
                    </div>
                    <span style={{ fontSize: 12, fontWeight: 800, color: item.color, whiteSpace: "nowrap" }}>{Math.round(pct)}%</span>
                  </div>
                  <div className="pg"><div className="pgf" style={{ background: item.color, width: `${pct}%` }} /></div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Riwayat transaksi */}
        <div>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16, flexWrap: "wrap", gap: 12 }}>
            <h3 style={{ fontSize: 11, fontWeight: 700, letterSpacing: ".12em", textTransform: "uppercase", color: "var(--tm)" }}>Riwayat Transaksi</h3>
            <div style={{ display: "flex", gap: 6 }}>
              {(["semua", "masuk", "keluar"] as const).map(f => (
                <button key={f} onClick={() => setFTipe(f)} style={{ padding: "7px 15px", fontSize: 11, fontWeight: 700, letterSpacing: ".07em", textTransform: "uppercase", border: "1px solid var(--bo)", borderRadius: 99, cursor: "pointer", transition: "all .2s", background: fTipe === f ? "var(--fo)" : "var(--cw)", color: fTipe === f ? "#fff" : "var(--ts)" }}>
                  {f}
                </button>
              ))}
            </div>
          </div>
          <div style={{ background: "var(--cw)", border: "1px solid var(--bo)", borderRadius: 18, overflow: "hidden" }}>
            <div style={{ overflowX: "auto" }}>
              <table className="tbl">
                <thead>
                  <tr style={{ background: "var(--cr)" }}>
                    <th>Tanggal</th><th>Keterangan</th><th>Kategori</th><th>Tipe</th><th style={{ textAlign: "right" }}>Jumlah</th>
                  </tr>
                </thead>
                <tbody>
                  {txFil.map(t => (
                    <tr key={t.id}>
                      <td style={{ whiteSpace: "nowrap", fontSize: 12 }}>{new Date(t.tanggal).toLocaleDateString("id-ID", { day: "numeric", month: "short", year: "numeric" })}</td>
                      <td>{t.keterangan}</td>
                      <td><span style={{ padding: "3px 10px", background: "var(--cd)", borderRadius: 99, fontSize: 11, fontWeight: 600, color: "var(--ts)", whiteSpace: "nowrap" }}>{t.kategori}</span></td>
                      <td><span style={{ padding: "3px 10px", borderRadius: 99, fontSize: 11, fontWeight: 700, whiteSpace: "nowrap", background: t.tipe === "masuk" ? "var(--gb)" : "var(--rb)", color: t.tipe === "masuk" ? "var(--gt)" : "var(--rt)" }}>
                        {t.tipe === "masuk" ? "↑ Masuk" : "↓ Keluar"}
                      </span></td>
                      <td style={{ textAlign: "right", fontWeight: 700, whiteSpace: "nowrap", color: t.tipe === "masuk" ? "var(--gt)" : "var(--rt)" }}>
                        {t.tipe === "masuk" ? "+" : "-"}{fRp(t.jumlah)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <div style={{ padding: "14px 22px", borderTop: "2px solid var(--bo)", background: "var(--cr)", display: "flex", justifyContent: "flex-end", gap: 24, flexWrap: "wrap" }}>
              <span style={{ fontSize: 12, fontWeight: 700, color: "var(--gt)" }}>Masuk: {fRp(totMasuk)}</span>
              <span style={{ fontSize: 12, fontWeight: 700, color: "var(--rt)" }}>Keluar: {fRp(totKeluar)}</span>
              <span style={{ fontSize: 13, fontWeight: 800, color: "var(--fo)" }}>Saldo: {fRp(saldo)}</span>
            </div>
          </div>
          <div style={{ marginTop: 16, padding: "13px 18px", background: "rgba(184,148,63,.07)", border: "1px solid rgba(184,148,63,.18)", borderRadius: 13, display: "flex", gap: 10, alignItems: "flex-start" }}>
            <span style={{ fontSize: 16 }}>ℹ️</span>
            <div style={{ fontSize: 12, lineHeight: 1.7, color: "var(--em)" }}>
              Data diperbarui berkala oleh Divisi Humas & Transparansi Publik. Pertanyaan: <strong>ciburial.smarthub@gmail.com</strong>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
