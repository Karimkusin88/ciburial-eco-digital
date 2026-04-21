"use client";
import { useState } from "react";
import { Kegiatan, KAT_CFG } from "./types";

function KegiatanSlider({ fotos, judul }: { fotos: string[], judul: string }) {
  const [act, setAct] = useState(0);
  return (
    <div style={{ position: "relative", width: "100%", aspectRatio: "16/9", overflow: "hidden" }}>
      <div className="hide-scroll" onScroll={e => {
          const w = e.currentTarget.clientWidth;
          const idx = Math.round(e.currentTarget.scrollLeft / w);
          if (idx !== act) setAct(idx);
        }}
        style={{ display: "flex", overflowX: "auto", scrollSnapType: "x mandatory", width: "100%", height: "100%", scrollBehavior: "smooth" }}>
        {fotos.map((url, idx) => (
          <div key={idx} style={{ scrollSnapAlign: "center", flex: "0 0 100%", height: "100%", display: "flex", alignItems: "center", justifyContent: "center", background: "linear-gradient(135deg,rgba(255,254,249,.8),rgba(250,248,243,.6))" }}>
            {(url.toLowerCase().includes(".mp4") || url.toLowerCase().includes(".webm")) ? (
              <video src={url} controls playsInline style={{ width: "100%", height: "100%", objectFit: "cover" }} />
            ) : (
              <img src={url} alt={`${judul} ${idx}`} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
            )}
          </div>
        ))}
      </div>
      <div style={{ position: "absolute", bottom: 12, left: "50%", transform: "translateX(-50%)", display: "flex", gap: 6, background: "rgba(0,0,0,0.5)", padding: "6px 10px", borderRadius: 16, backdropFilter: "blur(4px)" }}>
        {fotos.map((_, idx) => (
          <div key={idx} style={{ width: 6, height: 6, borderRadius: "50%", background: act === idx ? "#FFF" : "rgba(255,255,255,0.4)", transition: "background .3s", boxShadow: act === idx ? "0 0 8px rgba(255,255,255,0.8)" : "none" }} />
        ))}
      </div>
      <div style={{ position: "absolute", top: 12, right: 12, background: "rgba(0,0,0,0.5)", color: "white", padding: "4px 10px", borderRadius: 12, fontSize: 10, fontWeight: 800, backdropFilter: "blur(4px)", letterSpacing: ".1em" }}>
        {act + 1} / {fotos.length}
      </div>
    </div>
  );
}

interface KegiatanTabProps {
  kegiatan: Kegiatan[];
  dataLoad: boolean;
}

export default function KegiatanTab({ kegiatan, dataLoad }: KegiatanTabProps) {
  const [fKat, setFKat] = useState<string>("semua");
  const kegFil = fKat === "semua" ? kegiatan : kegiatan.filter(k => k.kategori === fKat);

  return (
    <div className="pi" style={{ paddingTop: "clamp(60px,8vw,100px)", paddingBottom: "clamp(60px,8vw,100px)", background: "linear-gradient(135deg,rgba(250,248,243,.5) 0%,rgba(255,254,249,.8) 100%)", minHeight: "100vh" }}>
      <div style={{ maxWidth: 1320, margin: "0 auto", padding: "0 clamp(16px,3vw,28px)" }}>

        {/* Header - Heroic */}
        <div style={{ marginBottom: 56, textAlign: "center" }}>
          <div style={{ display: "inline-block", width: "44px", height: "3px", background: "linear-gradient(90deg, #2F8F4E, #4FBF7E)", borderRadius: "99px", boxShadow: "0 0 16px rgba(47,143,78,.4)", marginBottom: "24px" }} />
          <h1 className="fnt" style={{ fontSize: "clamp(40px,7vw,72px)", fontWeight: 300, background: "linear-gradient(135deg,#1C3A2B,#2F8F4E)", backgroundClip: "text", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent", lineHeight: 1.1, letterSpacing: "-.03em", marginBottom: 16 }}>
            Kegiatan<br />Kampung
          </h1>
          <p style={{ maxWidth: 480, fontSize: 14, lineHeight: 1.8, color: "#5A4A40", fontWeight: 500, margin: "0 auto" }}>Setiap momen yang menghidupkan Ciburial — dari perayaan hingga kemajuan nyata pembangunan desa.</p>
        </div>

        {/* Filter kategori - Heroic */}
        <div style={{ display: "flex", gap: 12, flexWrap: "wrap", marginBottom: 44, justifyContent: "center" }}>
          {[{ k: "semua", l: "✦ Semua" }, ...Object.entries(KAT_CFG).map(([k, v]) => ({ k, l: v.label }))].map(item => (
            <button key={item.k} onClick={() => setFKat(item.k)} style={{ padding: "11px 20px", fontSize: 12, fontWeight: 700, letterSpacing: ".06em", border: fKat === item.k ? "1.5px solid #2F8F4E" : "1.5px solid rgba(47,143,78,.2)", borderRadius: 10, cursor: "pointer", transition: "all 0.3s cubic-bezier(.22,1,.36,1)", background: fKat === item.k ? "linear-gradient(135deg,#2F8F4E,#4FBF7E)" : "rgba(255,254,249,.9)", color: fKat === item.k ? "#fff" : "#1C3A2B", transform: fKat === item.k ? "translateY(-2px)" : "translateY(0)", boxShadow: fKat === item.k ? "0 8px 16px rgba(47,143,78,.2)" : "0 2px 8px rgba(0,0,0,.04)" }}>
              {item.l}
            </button>
          ))}
        </div>

        {dataLoad && (
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill,minmax(280px,1fr))", gap: 20 }}>
            {[1, 2, 3].map(i => <div key={i} className="sk" style={{ height: 240, borderRadius: 18, background: "linear-gradient(135deg,rgba(255,254,249,.8),rgba(250,248,243,.6))", border: "1.5px solid rgba(47,143,78,.1)" }} />)}
          </div>
        )}

        {!dataLoad && (
          kegFil.length === 0 ? (
            <div style={{ textAlign: "center", padding: "80px 20px", color: "#5A4A40" }}>
              <div style={{ fontSize: 56, marginBottom: 16 }}>📅</div>
              <div style={{ fontSize: 18, fontWeight: 700, color: "#1C3A2B", marginBottom: 6 }}>Belum ada kegiatan di kategori ini.</div>
              <div style={{ fontSize: 13, color: "#5A4A40" }}>Admin dapat menambahkan melalui panel admin.</div>
            </div>
          ) : (
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill,minmax(280px,1fr))", gap: 20 }}>
              {kegFil.map((k, i) => {
                const kat = KAT_CFG[k.kategori] || { label: "📌 Lainnya", bg: "rgba(90,74,64,.08)", color: "#5A4A40" };
                const d = new Date(k.tanggal);
                return (
                  <div key={k.id} className="keg-card" style={{ 
                    background: "linear-gradient(135deg,rgba(255,254,249,.95),rgba(250,248,243,.85))", 
                    border: "1.5px solid rgba(47,143,78,.12)", 
                    borderRadius: 16, 
                    overflow: "hidden",
                    transition: "all 0.35s cubic-bezier(.22,1,.36,1)",
                    cursor: "pointer",
                    boxShadow: "0 4px 12px rgba(0,0,0,.04)"
                  }}
                  onMouseEnter={e => {
                    const el = e.currentTarget as HTMLElement;
                    el.style.transform = "translateY(-8px) scale(1.01)";
                    el.style.boxShadow = "0 16px 36px rgba(47,143,78,.15)";
                  }}
                  onMouseLeave={e => {
                    const el = e.currentTarget as HTMLElement;
                    el.style.transform = "translateY(0) scale(1)";
                    el.style.boxShadow = "0 4px 12px rgba(0,0,0,.04)";
                  }}>
                    {k.fotos && k.fotos.length > 1 ? (
                      <KegiatanSlider fotos={k.fotos} judul={k.judul} />
                    ) : k.foto ? (
                      (k.foto.toLowerCase().includes(".mp4") || k.foto.toLowerCase().includes(".webm")) ? (
                        <video src={k.foto} controls playsInline style={{ width: "100%", aspectRatio: "16/9", objectFit: "cover" }} />
                      ) : (
                        <img src={k.foto} alt={k.judul} style={{ width: "100%", aspectRatio: "16/9", objectFit: "cover" }} />
                      )
                    ) : (
                      <div style={{ height: 140, background: `linear-gradient(135deg,${kat.color}30,${kat.color}10)`, borderBottom: `4px solid ${kat.color}` }} />
                    )}
                    <div style={{ padding: "22px 24px" }}>
                      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 14 }}>
                        <span style={{ fontSize: 11, fontWeight: 700, letterSpacing: ".08em", padding: "6px 13px", borderRadius: 8, background: kat.bg, color: kat.color }}>{kat.label}</span>
                        <div style={{ textAlign: "right" }}>
                          <div className="fnt" style={{ fontSize: 28, fontWeight: 300, color: "#2F8F4E", lineHeight: 1, marginBottom: 2 }}>{d.getDate()}</div>
                          <div style={{ fontSize: 10, fontWeight: 700, letterSpacing: ".1em", textTransform: "uppercase", color: "#5A4A40" }}>
                            {d.toLocaleDateString("id-ID", { month: "short" })} {d.getFullYear()}
                          </div>
                        </div>
                      </div>
                      <h3 style={{ fontSize: 16, fontWeight: 700, color: "#1C3A2B", marginBottom: 9, lineHeight: 1.4 }}>{k.judul}</h3>
                      {k.deskripsi && <p style={{ fontSize: 13, lineHeight: 1.6, color: "#5A4A40", marginBottom: 0 }}>{k.deskripsi}</p>}
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
