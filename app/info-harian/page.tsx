"use client";
import { useState, useEffect } from "react";
import { supabase, isSupabaseReady } from "@/lib/supabase";
import { Testimoni, DEF_TESTIMONI } from "@/components/home/types";

export default function InfoHarianPage() {
  const [testimoni, setTestimoni] = useState<Testimoni[]>(DEF_TESTIMONI);
  const [dataLoad, setDataLoad] = useState(false);

  useEffect(() => {
    if (!isSupabaseReady()) return;
    (async () => {
      setDataLoad(true);
      try {
        const { data } = await supabase.from("testimoni").select("*").order("created_at", { ascending: false });
        if (data && data.length > 0) setTestimoni(data as Testimoni[]);
      } catch (e) {
        // Table might not exist yet
      }
      setDataLoad(false);
    })();
  }, []);

  return (
    <main style={{ minHeight: "100dvh", background: "var(--cr)", paddingBottom: 60 }}>
      {/* HEADER PAGE */}
      <header style={{ background: "var(--fo)", padding: "clamp(40px,6vw,60px) 20px 80px", textAlign: "center", position: "relative", overflow: "hidden" }}>
        <div style={{ position: "absolute", top: 0, left: 0, right: 0, bottom: 0, opacity: 0.05, backgroundImage: "radial-gradient(circle at 2px 2px, rgba(255,255,255,1) 1px, transparent 0)", backgroundSize: "24px 24px" }} />
        <div style={{ position: "relative", zIndex: 1 }}>
          <h1 className="fnt" style={{ fontSize: "clamp(32px, 5vw, 48px)", fontWeight: 300, color: "var(--cw)", letterSpacing: "-.02em", marginBottom: 12 }}>Info Harian</h1>
          <p style={{ color: "rgba(255,255,255,0.7)", fontSize: "clamp(15px, 2vw, 17px)", maxWidth: 500, margin: "0 auto", lineHeight: 1.6 }}>
            Dukungan, liputan, dan update harian seputar pergerakan Ciburial Eco-Digital Village.
          </p>
        </div>
      </header>

      {/* KONTEN */}
      <div style={{ maxWidth: 1320, margin: "-40px auto 0", padding: "0 20px", position: "relative", zIndex: 2 }}>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(300px, 1fr))", gap: 24 }}>
          {testimoni.map((t, i) => (
            <div key={t.id || i} style={{ background: "var(--cw)", border: "1.5px solid rgba(47,143,78,.1)", borderRadius: 20, padding: t.tipe === "berita" && t.foto ? "12px 12px 28px 12px" : "32px 28px", display: "flex", flexDirection: "column", gap: 14, boxShadow: "0 12px 32px rgba(0,0,0,0.05)", transition: "all .3s ease" }}
              onMouseEnter={e => { (e.currentTarget as HTMLElement).style.transform = "translateY(-4px)"; (e.currentTarget as HTMLElement).style.boxShadow = "0 20px 48px rgba(47,143,78,.1)"; }}
              onMouseLeave={e => { (e.currentTarget as HTMLElement).style.transform = "translateY(0)"; (e.currentTarget as HTMLElement).style.boxShadow = "0 12px 32px rgba(0,0,0,0.05)"; }}
            >
              {/* COVER BESAR KHUSUS BERITA */}
              {t.tipe === "berita" && t.foto && (
                (t.foto.toLowerCase().includes(".mp4") || t.foto.toLowerCase().includes(".webm")) ? (
                  <video src={t.foto} controls playsInline style={{ width: "100%", height: 190, borderRadius: 14, objectFit: "cover", marginBottom: 4 }} />
                ) : (
                  <img src={t.foto} alt={t.nama} style={{ width: "100%", height: 190, borderRadius: 14, objectFit: "cover", marginBottom: 4 }} />
                )
              )}

              <div style={{ padding: t.tipe === "berita" && t.foto ? "0 16px" : 0, display: "flex", flexDirection: "column", gap: 14, flex: 1 }}>
                {t.tipe === "tokoh" && <div style={{ fontSize: 32, lineHeight: 1, color: "var(--go)", opacity: 0.5 }}>&quot;</div>}
                {t.tipe === "berita" && !t.foto && <div style={{ fontSize: 28, lineHeight: 1, color: "var(--go)", opacity: 0.5 }}>📰</div>}

                <p className="fnt" style={{ fontSize: "16px", lineHeight: 1.75, color: "#1C3A2B", flex: 1, fontStyle: t.tipe === "tokoh" ? "italic" : "normal", fontWeight: 400 }}>
                  {t.tipe === "tokoh" ? `"${t.pesan}"` : t.pesan}
                </p>

                <div style={{ display: "flex", alignItems: "center", gap: 14, marginTop: 10, borderTop: "1px solid var(--bo)", paddingTop: 18 }}>
                  {/* AVATAR KECIL (Khusus Tokoh) */}
                  {t.tipe === "tokoh" && t.foto ? (
                    (t.foto.toLowerCase().includes(".mp4") || t.foto.toLowerCase().includes(".webm")) ? (
                      <video src={t.foto} autoPlay muted loop playsInline style={{ width: 44, height: 44, borderRadius: "50%", objectFit: "cover", flexShrink: 0 }} />
                    ) : (
                      <img src={t.foto} alt={t.nama} style={{ width: 44, height: 44, borderRadius: "50%", objectFit: "cover", flexShrink: 0 }} />
                    )
                  ) : (
                    <div style={{ width: 44, height: 44, borderRadius: "50%", background: "var(--cd)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 18 }}>
                      {t.tipe === "tokoh" ? "👤" : "🗞️"}
                    </div>
                  )}
                  <div>
                    <div style={{ fontSize: 16, fontWeight: 800, color: "#1C3A2B" }}>{t.nama}</div>
                    <div style={{ fontSize: 11, fontWeight: 700, color: "#2F8F4E", letterSpacing: ".05em", textTransform: "uppercase", marginTop: 2 }}>{t.jabatan}</div>
                  </div>
                  <span style={{ marginLeft: "auto", fontSize: 10, fontWeight: 700, padding: "4px 8px", background: t.tipe === "tokoh" ? "rgba(184,148,63,.1)" : "rgba(45,90,64,.1)", color: t.tipe === "tokoh" ? "#7A5A1E" : "#2D5A40", borderRadius: 6, textTransform: "uppercase" }}>
                    {t.tipe}
                  </span>
                </div>
              </div>
            </div>
          ))}
        </div>
        
        {testimoni.length === 0 && !dataLoad && (
           <div style={{ textAlign: "center", padding: "40px 20px", color: "var(--tm)", fontSize: 14, fontWeight: 500 }}>
             Belum ada info harian / liputan yang tersedia saat ini.
           </div>
        )}
      </div>
    </main>
  );
}
