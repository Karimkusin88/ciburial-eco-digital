"use client";
import { useState } from "react";
import { Kegiatan, KAT_CFG } from "./types";

interface KegiatanTabProps {
  kegiatan: Kegiatan[];
  dataLoad: boolean;
}

export default function KegiatanTab({ kegiatan, dataLoad }: KegiatanTabProps) {
  const [fKat, setFKat] = useState<string>("semua");
  const kegFil = fKat === "semua" ? kegiatan : kegiatan.filter(k => k.kategori === fKat);

  return (
    <div className="pi" style={{ paddingTop: "clamp(48px,8vw,106px)", paddingBottom: "clamp(48px,8vw,106px)" }}>
      <div style={{ maxWidth: 1320, margin: "0 auto", padding: "0 clamp(16px,3vw,28px)" }}>

        <div style={{ marginBottom: 44, display: "flex", flexWrap: "wrap", alignItems: "flex-end", justifyContent: "space-between", gap: 20 }}>
          <div>
            <div className="dl" />
            <h1 className="fnt" style={{ fontSize: "clamp(40px,7vw,84px)", fontWeight: 300, color: "var(--fo)", lineHeight: .95, letterSpacing: "-.03em" }}>Kegiatan<br /><em>Kampung</em></h1>
          </div>
          <p style={{ maxWidth: 320, fontSize: 14, lineHeight: 1.8, color: "var(--ts)" }}>Setiap momen yang menghidupkan Ciburial — dari perayaan hingga kemajuan nyata pembangunan desa.</p>
        </div>

        {/* Filter kategori */}
        <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginBottom: 36 }}>
          {[{ k: "semua", l: "✦ Semua" }, ...Object.entries(KAT_CFG).map(([k, v]) => ({ k, l: v.label }))].map(item => (
            <button key={item.k} onClick={() => setFKat(item.k)} style={{ padding: "7px 16px", fontSize: 11, fontWeight: 700, letterSpacing: ".06em", border: "1px solid var(--bo)", borderRadius: 99, cursor: "pointer", transition: "all .2s", background: fKat === item.k ? "var(--fo)" : "var(--cw)", color: fKat === item.k ? "#fff" : "var(--ts)" }}>
              {item.l}
            </button>
          ))}
        </div>

        {dataLoad && (
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill,minmax(270px,1fr))", gap: 18 }}>
            {[1, 2, 3].map(i => <div key={i} className="sk" style={{ height: 220, borderRadius: 18 }} />)}
          </div>
        )}

        {!dataLoad && (
          kegFil.length === 0 ? (
            <div style={{ textAlign: "center", padding: "72px 20px", color: "var(--tm)" }}>
              <div style={{ fontSize: 44, marginBottom: 14 }}>📅</div>
              <div style={{ fontSize: 16, fontWeight: 600 }}>Belum ada kegiatan di kategori ini.</div>
              <div style={{ fontSize: 13, marginTop: 8 }}>Admin dapat menambahkan melalui panel admin.</div>
            </div>
          ) : (
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill,minmax(270px,1fr))", gap: 18 }}>
              {kegFil.map((k, i) => {
                const kat = KAT_CFG[k.kategori] || { label: "📌 Lainnya", bg: "rgba(90,74,64,.08)", color: "#5A4A40" };
                const d = new Date(k.tanggal);
                return (
                  <div key={k.id} className={`rv kc d${(i % 3) + 1}`} style={{ background: "var(--cw)", border: "1px solid var(--bo)", borderRadius: 18, overflow: "hidden" }}>
                    {k.foto ? (
                      <img src={k.foto} alt={k.judul} style={{ width: "100%", aspectRatio: "16/9", objectFit: "cover" }} />
                    ) : (
                      <div style={{ height: 5, background: kat.color }} />
                    )}
                    <div style={{ padding: "20px 22px" }}>
                      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 11 }}>
                        <span style={{ fontSize: 10, fontWeight: 700, letterSpacing: ".06em", padding: "4px 11px", borderRadius: 99, background: kat.bg, color: kat.color }}>{kat.label}</span>
                        <div style={{ textAlign: "right" }}>
                          <div className="fnt" style={{ fontSize: 26, fontWeight: 300, color: "var(--fo)", lineHeight: 1 }}>{d.getDate()}</div>
                          <div style={{ fontSize: 9, fontWeight: 700, letterSpacing: ".1em", textTransform: "uppercase", color: "var(--tm)" }}>
                            {d.toLocaleDateString("id-ID", { month: "short" })} {d.getFullYear()}
                          </div>
                        </div>
                      </div>
                      <h3 style={{ fontSize: 16, fontWeight: 700, color: "var(--tp)", marginBottom: 7, lineHeight: 1.3 }}>{k.judul}</h3>
                      {k.deskripsi && <p style={{ fontSize: 12, lineHeight: 1.7, color: "var(--ts)" }}>{k.deskripsi}</p>}
                    </div>
                  </div>
                );
              })}
            </div>
          )
        )}
      </div>
    </div>
  );
}
