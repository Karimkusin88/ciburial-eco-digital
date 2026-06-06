"use client";
import { useState, useEffect, useCallback } from "react";
<<<<<<< HEAD
=======
import { createPortal } from "react-dom";
>>>>>>> a637e63bec351e4f46e7425aaaea45b9a1ab3434
import { Kegiatan, KAT_CFG } from "./types";
import { CalendarDays, X, ChevronLeft, ChevronRight, ZoomIn } from "lucide-react";

/* ─── LIGHTBOX ─── */
interface LightboxProps {
  fotos: string[];
  judul: string;
  startIdx: number;
  onClose: () => void;
}

function Lightbox({ fotos, judul, startIdx, onClose }: LightboxProps) {
  const [cur, setCur] = useState(startIdx);

  const prev = useCallback(() => setCur(i => (i - 1 + fotos.length) % fotos.length), [fotos.length]);
  const next = useCallback(() => setCur(i => (i + 1) % fotos.length), [fotos.length]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
      if (e.key === "ArrowLeft") prev();
      if (e.key === "ArrowRight") next();
    };
    document.addEventListener("keydown", onKey);
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = "";
    };
  }, [onClose, prev, next]);

  const url = fotos[cur];
  const isVideo = url.toLowerCase().includes(".mp4") || url.toLowerCase().includes(".webm");

<<<<<<< HEAD
  return (
=======
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);
  if (!mounted) return null;

  return createPortal(
>>>>>>> a637e63bec351e4f46e7425aaaea45b9a1ab3434
    <div
      onClick={onClose}
      style={{
        position: "fixed", inset: 0, zIndex: 9999,
        background: "rgba(0,0,0,0.92)",
        backdropFilter: "blur(12px)",
        display: "flex", flexDirection: "column",
        alignItems: "center", justifyContent: "center",
        animation: "lbFadeIn .2s ease",
      }}
    >
      {/* Header */}
      <div
        onClick={e => e.stopPropagation()}
        style={{
          position: "absolute", top: 0, left: 0, right: 0,
          padding: "16px 20px",
          display: "flex", alignItems: "center", justifyContent: "space-between",
          background: "linear-gradient(to bottom, rgba(0,0,0,0.7), transparent)",
          zIndex: 2,
        }}
      >
        <div>
          <div style={{ fontSize: 13, fontWeight: 700, color: "#fff", lineHeight: 1.3 }}>{judul}</div>
          {fotos.length > 1 && (
            <div style={{ fontSize: 11, color: "rgba(255,255,255,0.5)", marginTop: 2 }}>
              {cur + 1} / {fotos.length}
            </div>
          )}
        </div>
        <button
          onClick={onClose}
          style={{
            width: 40, height: 40, borderRadius: "50%",
            background: "rgba(255,255,255,0.12)",
            border: "1px solid rgba(255,255,255,0.2)",
            color: "#fff", cursor: "pointer",
            display: "flex", alignItems: "center", justifyContent: "center",
            transition: "background .2s",
          }}
          onMouseEnter={e => (e.currentTarget.style.background = "rgba(255,255,255,0.22)")}
          onMouseLeave={e => (e.currentTarget.style.background = "rgba(255,255,255,0.12)")}
        >
          <X size={18} strokeWidth={2} />
        </button>
      </div>

      {/* Media */}
      <div
        onClick={e => e.stopPropagation()}
        style={{
<<<<<<< HEAD
          maxWidth: "min(92vw, 900px)",
          maxHeight: "80vh",
          display: "flex", alignItems: "center", justifyContent: "center",
          position: "relative",
=======
          position: "absolute",
          top: 80, bottom: 60, left: 16, right: 16,
          display: "flex", alignItems: "center", justifyContent: "center",
>>>>>>> a637e63bec351e4f46e7425aaaea45b9a1ab3434
        }}
      >
        {isVideo ? (
          <video
            src={url}
            controls
            autoPlay
            playsInline
<<<<<<< HEAD
            style={{ maxWidth: "100%", maxHeight: "80vh", borderRadius: 12, boxShadow: "0 32px 80px rgba(0,0,0,0.6)" }}
=======
            style={{ maxWidth: "100%", maxHeight: "100%", borderRadius: 12, boxShadow: "0 32px 80px rgba(0,0,0,0.6)" }}
>>>>>>> a637e63bec351e4f46e7425aaaea45b9a1ab3434
          />
        ) : (
          <img
            src={url}
            alt={judul}
            style={{
<<<<<<< HEAD
              maxWidth: "100%", maxHeight: "80vh",
=======
              maxWidth: "100%", maxHeight: "100%",
>>>>>>> a637e63bec351e4f46e7425aaaea45b9a1ab3434
              objectFit: "contain",
              borderRadius: 12,
              boxShadow: "0 32px 80px rgba(0,0,0,0.6)",
              userSelect: "none",
            }}
          />
        )}
      </div>

      {/* Prev / Next */}
      {fotos.length > 1 && (
        <>
          <button
            onClick={e => { e.stopPropagation(); prev(); }}
            style={{
              position: "absolute", left: 16, top: "50%", transform: "translateY(-50%)",
              width: 44, height: 44, borderRadius: "50%",
              background: "rgba(255,255,255,0.12)",
              border: "1px solid rgba(255,255,255,0.2)",
              color: "#fff", cursor: "pointer",
              display: "flex", alignItems: "center", justifyContent: "center",
              transition: "background .2s",
            }}
            onMouseEnter={e => (e.currentTarget.style.background = "rgba(255,255,255,0.25)")}
            onMouseLeave={e => (e.currentTarget.style.background = "rgba(255,255,255,0.12)")}
          >
            <ChevronLeft size={22} strokeWidth={2} />
          </button>
          <button
            onClick={e => { e.stopPropagation(); next(); }}
            style={{
              position: "absolute", right: 16, top: "50%", transform: "translateY(-50%)",
              width: 44, height: 44, borderRadius: "50%",
              background: "rgba(255,255,255,0.12)",
              border: "1px solid rgba(255,255,255,0.2)",
              color: "#fff", cursor: "pointer",
              display: "flex", alignItems: "center", justifyContent: "center",
              transition: "background .2s",
            }}
            onMouseEnter={e => (e.currentTarget.style.background = "rgba(255,255,255,0.25)")}
            onMouseLeave={e => (e.currentTarget.style.background = "rgba(255,255,255,0.12)")}
          >
            <ChevronRight size={22} strokeWidth={2} />
          </button>
        </>
      )}

      {/* Dot indicators */}
      {fotos.length > 1 && (
        <div
          onClick={e => e.stopPropagation()}
          style={{
            position: "absolute", bottom: 24,
            display: "flex", gap: 8,
          }}
        >
          {fotos.map((_, i) => (
            <div
              key={i}
              onClick={() => setCur(i)}
              style={{
                width: i === cur ? 24 : 8, height: 8, borderRadius: 99,
                background: i === cur ? "#95D5B2" : "rgba(255,255,255,0.35)",
                cursor: "pointer",
                transition: "all .3s cubic-bezier(.22,1,.36,1)",
              }}
            />
          ))}
        </div>
      )}

      <style>{`
        @keyframes lbFadeIn { from { opacity:0 } to { opacity:1 } }
      `}</style>
<<<<<<< HEAD
    </div>
=======
    </div>,
    document.body
>>>>>>> a637e63bec351e4f46e7425aaaea45b9a1ab3434
  );
}

/* ─── SLIDER (thumbnail in card) ─── */
interface SliderProps {
  fotos: string[];
  judul: string;
  onOpenLightbox: (idx: number) => void;
}

function KegiatanSlider({ fotos, judul, onOpenLightbox }: SliderProps) {
  const [act, setAct] = useState(0);
  return (
    <div style={{ position: "relative", width: "100%", aspectRatio: "4/3", overflow: "hidden", background: "#1A2016", cursor: "zoom-in" }}>
      <div
        className="hide-scroll"
        onScroll={e => {
          const w = e.currentTarget.clientWidth;
          const idx = Math.round(e.currentTarget.scrollLeft / w);
          if (idx !== act) setAct(idx);
        }}
        style={{ display: "flex", overflowX: "auto", scrollSnapType: "x mandatory", width: "100%", height: "100%", scrollBehavior: "smooth" }}
      >
        {fotos.map((url, idx) => (
          <div
            key={idx}
            onClick={() => onOpenLightbox(idx)}
            style={{ scrollSnapAlign: "center", flex: "0 0 100%", height: "100%", display: "flex", alignItems: "center", justifyContent: "center", background: `url('${url}') center/cover no-repeat`, position: "relative" }}
          >
            <div style={{ position: "absolute", inset: 0, background: "rgba(28,58,43,0.8)", backdropFilter: "blur(16px)" }} />
            {(url.toLowerCase().includes(".mp4") || url.toLowerCase().includes(".webm")) ? (
              <video src={url} playsInline style={{ width: "100%", height: "100%", objectFit: "contain", position: "relative", zIndex: 1 }} />
            ) : (
              <img src={url} alt={`${judul} ${idx}`} style={{ width: "100%", height: "100%", objectFit: "contain", position: "relative", zIndex: 1 }} />
            )}
            {/* Zoom hint */}
            <div style={{ position: "absolute", bottom: 10, right: 10, zIndex: 2, background: "rgba(0,0,0,0.45)", borderRadius: 8, padding: "4px 8px", display: "flex", alignItems: "center", gap: 4, color: "rgba(255,255,255,0.8)", fontSize: 10, fontWeight: 700, backdropFilter: "blur(4px)" }}>
              <ZoomIn size={12} strokeWidth={2} /> Tap untuk perbesar
            </div>
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

<<<<<<< HEAD
=======
/* ─── EXPANDABLE TEXT ─── */
function ExpandableText({ text }: { text: string }) {
  const [expanded, setExpanded] = useState(false);
  const isLong = text.length > 120;

  return (
    <div>
      <p style={{ 
        fontSize: "clamp(11px, 2.8vw, 13px)", 
        lineHeight: 1.5, 
        color: "#5A4A40", 
        marginBottom: isLong && !expanded ? 4 : (isLong && expanded ? 8 : 0),
        display: expanded ? "block" : "-webkit-box",
        WebkitLineClamp: expanded ? "unset" : 3,
        WebkitBoxOrient: "vertical",
        overflow: "hidden"
      }}>
        {text}
      </p>
      {isLong && (
        <button 
          onClick={(e) => { e.stopPropagation(); setExpanded(!expanded); }} 
          style={{ 
            background: "none", border: "none", color: "#2F8F4E", 
            fontSize: "clamp(11px, 2.8vw, 12px)", fontWeight: 700, 
            padding: 0, cursor: "pointer", display: "inline-block",
            transition: "color 0.2s"
          }}
          onMouseEnter={e => e.currentTarget.style.color = "#1C3A2B"}
          onMouseLeave={e => e.currentTarget.style.color = "#2F8F4E"}
        >
          {expanded ? "Sembunyikan" : "Lihat selengkapnya"}
        </button>
      )}
    </div>
  );
}

>>>>>>> a637e63bec351e4f46e7425aaaea45b9a1ab3434
/* ─── MAIN ─── */
interface KegiatanTabProps {
  kegiatan: Kegiatan[];
  dataLoad: boolean;
}

export default function KegiatanTab({ kegiatan, dataLoad }: KegiatanTabProps) {
  const [fKat, setFKat] = useState<string>("semua");
  const [lightbox, setLightbox] = useState<{ fotos: string[]; judul: string; idx: number } | null>(null);

  const kegFil = fKat === "semua" ? kegiatan : kegiatan.filter(k => k.kategori === fKat);

  const openLightbox = (fotos: string[], judul: string, idx = 0) => setLightbox({ fotos, judul, idx });
  const closeLightbox = () => setLightbox(null);

  return (
    <div className="pi" style={{ paddingTop: "clamp(60px,8vw,100px)", paddingBottom: "clamp(60px,8vw,100px)", background: "linear-gradient(135deg,rgba(250,248,243,.5) 0%,rgba(255,254,249,.8) 100%)", minHeight: "100vh" }}>

      {/* Lightbox */}
      {lightbox && (
        <Lightbox
          fotos={lightbox.fotos}
          judul={lightbox.judul}
          startIdx={lightbox.idx}
          onClose={closeLightbox}
        />
      )}

      <div style={{ maxWidth: 1320, margin: "0 auto", padding: "0 clamp(16px,3vw,28px)" }}>

        {/* Header */}
        <div style={{ marginBottom: 56, textAlign: "center" }}>
          <div style={{ display: "inline-block", width: "44px", height: "3px", background: "linear-gradient(90deg, #2F8F4E, #4FBF7E)", borderRadius: "99px", boxShadow: "0 0 16px rgba(47,143,78,.4)", marginBottom: "24px" }} />
          <h1 className="fnt" style={{ fontSize: "clamp(40px,7vw,72px)", fontWeight: 300, background: "linear-gradient(135deg,#1C3A2B,#2F8F4E)", backgroundClip: "text", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent", lineHeight: 1.1, letterSpacing: "-.03em", marginBottom: 16 }}>
            Kegiatan<br />Kampung
          </h1>
          <p style={{ maxWidth: 480, fontSize: 14, lineHeight: 1.8, color: "#5A4A40", fontWeight: 500, margin: "0 auto" }}>Setiap momen yang menghidupkan Ciburial — dari perayaan hingga kemajuan nyata pembangunan desa.</p>
        </div>

        {/* Filter */}
        <div style={{ display: "flex", gap: "clamp(8px, 2vw, 12px)", flexWrap: "wrap", marginBottom: 44, justifyContent: "center" }}>
          {[{ k: "semua", l: "✦ Semua" }, ...Object.entries(KAT_CFG).map(([k, v]) => ({ k, l: v.label }))].map(item => (
            <button key={item.k} onClick={() => setFKat(item.k)} style={{ padding: "11px 20px", fontSize: 12, fontWeight: 700, letterSpacing: ".06em", border: fKat === item.k ? "1.5px solid #2F8F4E" : "1.5px solid rgba(47,143,78,.2)", borderRadius: 10, cursor: "pointer", transition: "all 0.3s cubic-bezier(.22,1,.36,1)", background: fKat === item.k ? "linear-gradient(135deg,#2F8F4E,#4FBF7E)" : "rgba(255,254,249,.9)", color: fKat === item.k ? "#fff" : "#1C3A2B", transform: fKat === item.k ? "translateY(-2px)" : "translateY(0)", boxShadow: fKat === item.k ? "0 8px 16px rgba(47,143,78,.2)" : "0 2px 8px rgba(0,0,0,.04)" }}>
              {item.l}
            </button>
          ))}
        </div>

        {/* Skeleton */}
        {dataLoad && (
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill,minmax(min(100%, 160px),1fr))", gap: "clamp(10px, 2vw, 20px)" }}>
            {[1, 2, 3].map(i => <div key={i} className="sk" style={{ height: 200, borderRadius: 14 }} />)}
          </div>
        )}

        {/* Grid */}
        {!dataLoad && (
          kegFil.length === 0 ? (
            <div style={{ textAlign: "center", padding: "clamp(32px, 6vw, 60px) clamp(12px, 3vw, 16px)", color: "#5A4A40" }}>
              <div style={{ display: "flex", justifyContent: "center", marginBottom: 12 }}><CalendarDays size={44} strokeWidth={1.5} /></div>
              <div style={{ fontSize: 16, fontWeight: 700, color: "#1C3A2B", marginBottom: 4 }}>Belum ada kegiatan di kategori ini.</div>
              <div style={{ fontSize: 12, color: "#5A4A40" }}>Admin dapat menambahkan melalui panel admin.</div>
            </div>
          ) : (
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill,minmax(min(100%, 160px),1fr))", gap: "clamp(10px, 2vw, 20px)" }} className="kegiatan-grid">
              {kegFil.map((k) => {
                const kat = KAT_CFG[k.kategori] || { label: "Lainnya", bg: "rgba(90,74,64,.08)", color: "#5A4A40" };
                const d = new Date(k.tanggal);
                const fotoList = k.foto ? k.foto.split(',').filter(Boolean) : [];
                return (
                  <div
                    key={k.id}
                    className="keg-card"
                    style={{
                      background: "linear-gradient(135deg,rgba(255,254,249,.95),rgba(250,248,243,.85))",
                      border: "1.5px solid rgba(47,143,78,.12)",
                      borderRadius: 12, overflow: "hidden",
                      transition: "all 0.35s cubic-bezier(.22,1,.36,1)",
                      boxShadow: "0 4px 12px rgba(0,0,0,.04)"
                    }}
                    onMouseEnter={e => {
                      (e.currentTarget as HTMLElement).style.transform = "translateY(-6px) scale(1.01)";
                      (e.currentTarget as HTMLElement).style.boxShadow = "0 12px 28px rgba(47,143,78,.12)";
                    }}
                    onMouseLeave={e => {
                      (e.currentTarget as HTMLElement).style.transform = "translateY(0) scale(1)";
                      (e.currentTarget as HTMLElement).style.boxShadow = "0 4px 12px rgba(0,0,0,.04)";
                    }}
                  >
                    {/* Media area */}
                    {fotoList.length > 1 ? (
                      <KegiatanSlider fotos={fotoList} judul={k.judul} onOpenLightbox={(idx) => openLightbox(fotoList, k.judul, idx)} />
                    ) : fotoList.length === 1 ? (
                      <div
                        onClick={() => openLightbox(fotoList, k.judul, 0)}
                        style={{ position: "relative", width: "100%", aspectRatio: "4/3", background: `url('${fotoList[0]}') center/cover no-repeat`, overflow: "hidden", cursor: "zoom-in" }}
                      >
                        <div style={{ position: "absolute", inset: 0, background: "rgba(28,58,43,0.8)", backdropFilter: "blur(16px)" }} />
                        {(fotoList[0].toLowerCase().includes(".mp4") || fotoList[0].toLowerCase().includes(".webm")) ? (
                          <video src={fotoList[0]} playsInline style={{ width: "100%", height: "100%", objectFit: "contain", position: "relative", zIndex: 1 }} />
                        ) : (
                          <img src={fotoList[0]} alt={k.judul} style={{ width: "100%", height: "100%", objectFit: "contain", position: "relative", zIndex: 1 }} />
                        )}
                        {/* Zoom hint */}
                        <div style={{ position: "absolute", bottom: 10, right: 10, zIndex: 2, background: "rgba(0,0,0,0.45)", borderRadius: 8, padding: "4px 8px", display: "flex", alignItems: "center", gap: 4, color: "rgba(255,255,255,0.8)", fontSize: 10, fontWeight: 700, backdropFilter: "blur(4px)" }}>
                          <ZoomIn size={12} strokeWidth={2} /> Tap untuk perbesar
                        </div>
                      </div>
                    ) : (
                      <div style={{ aspectRatio: "4/3", background: `linear-gradient(135deg,${kat.color}30,${kat.color}10)`, borderBottom: `4px solid ${kat.color}` }} />
                    )}

                    {/* Info */}
                    <div style={{ padding: "clamp(12px, 3vw, 22px) clamp(12px, 3vw, 24px)" }}>
                      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 10, gap: 8 }}>
                        <span style={{ fontSize: "clamp(9px, 2.5vw, 11px)", fontWeight: 700, letterSpacing: ".08em", padding: "clamp(4px, 1vw, 6px) clamp(8px, 2vw, 13px)", borderRadius: 6, background: kat.bg, color: kat.color }}>{kat.label}</span>
                        <div style={{ textAlign: "right", flexShrink: 0 }}>
                          <div className="fnt" style={{ fontSize: "clamp(20px, 5vw, 28px)", fontWeight: 300, color: "#2F8F4E", lineHeight: 1, marginBottom: 2 }}>{d.getDate()}</div>
                          <div style={{ fontSize: "clamp(8px, 2vw, 10px)", fontWeight: 700, letterSpacing: ".1em", textTransform: "uppercase", color: "#5A4A40" }}>
                            {d.toLocaleDateString("id-ID", { month: "short" })} {d.getFullYear()}
                          </div>
                        </div>
                      </div>
                      <h3 style={{ fontSize: "clamp(13px, 3.5vw, 16px)", fontWeight: 700, color: "#1C3A2B", marginBottom: 6, lineHeight: 1.3 }}>{k.judul}</h3>
<<<<<<< HEAD
                      {k.deskripsi && <p style={{ fontSize: "clamp(11px, 2.8vw, 13px)", lineHeight: 1.5, color: "#5A4A40", marginBottom: 0 }}>{k.deskripsi}</p>}
=======
                      {k.deskripsi && <ExpandableText text={k.deskripsi} />}
>>>>>>> a637e63bec351e4f46e7425aaaea45b9a1ab3434
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
