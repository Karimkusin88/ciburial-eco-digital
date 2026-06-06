"use client";
import { Vote, Stethoscope, ShieldCheck, HandHeart, Megaphone, HandCoins, BookOpen, Smartphone, Landmark, Search, Lightbulb, Globe, AlertCircle, CheckCircle, FileText } from "lucide-react";
import { TabType, Testimoni } from "./types";
import { useState, useEffect } from "react";
import { supabase, isSupabaseReady } from "@/lib/supabase";

import CommunityDashboard from "@/components/home/CommunityDashboard";
import { Transaksi, DEF_TX } from "./types";
import Reveal from "@/components/ui/Reveal";
import Counter from "@/components/ui/Counter";
<<<<<<< HEAD
=======
import { playSound } from "@/lib/sound";
>>>>>>> a637e63bec351e4f46e7425aaaea45b9a1ab3434


interface TentangTabProps {
    onNavigate: (t: TabType) => void;
    testimoni?: Testimoni[];
    transaksi?: Transaksi[];
    onPaymentSuccess?: (total: number, isMkt: boolean, orderId: string, payType: string) => void;
}

// Array struktur organisasi telah dipindah ke app/tentang/page.tsx


export default function TentangTab({ onNavigate, testimoni = [], transaksi = DEF_TX, onPaymentSuccess }: TentangTabProps) {
    const [loadingDonasi, setLoadingDonasi] = useState(false);
    const [totalJiwa, setTotalJiwa] = useState<number | null>(null);
    const [pengurusDb, setPengurusDb] = useState<any[]>([]);
    const [showStory, setShowStory] = useState(false);
    const [expandedDonation, setExpandedDonation] = useState<string | null>(null);
    const [selectedDonationMethod, setSelectedDonationMethod] = useState<string | null>(null);
    const [popoverPos, setPopoverPos] = useState({ top: 0, left: 0 });

    // Calculate saldo from transaksi
    const totMasuk = transaksi.filter(t => t.tipe === "masuk").reduce((s, t) => s + t.jumlah, 0);
    const totKeluar = transaksi.filter(t => t.tipe === "keluar").reduce((s, t) => s + t.jumlah, 0);
    const saldo = totMasuk - totKeluar;

    useEffect(() => {
        if (!isSupabaseReady()) return;
        (async () => {
            // Total jiwa = anggota_kk saja (kepala keluarga sudah termasuk di dalamnya)
            // Tabel "keluarga" adalah data KK, bukan jiwa — jangan dijumlahkan
            const angRes = await supabase.from("anggota_kk").select("id", { count: "exact", head: true });
            setTotalJiwa(angRes.count || 0);

            const pgRes = await supabase.from("pengurus_desa").select("*").order("urutan", { ascending: true });
            if (pgRes.data && pgRes.data.length > 0) {
                setPengurusDb(pgRes.data);
            }
        })();
    }, []);

    const bayarDonasi = async () => {
        const raw = window.prompt("Berapa nominal donasi yang ingin disalurkan? (Contoh: 50000)\nMinimal: Rp 5.000", "50000");
        if (!raw) return;
        const qty = parseInt(raw.replace(/[^0-9]/g, ''), 10);
        if (isNaN(qty) || qty < 5000) {
            alert("Nominal tidak valid atau kurang dari minimal Rp 5.000");
            return;
        }
        setLoadingDonasi(true);
        const orderId = `DONASI-${Date.now()}`;
        try {
            const res = await fetch("/api/midtrans/tokenize", {
                method: "POST",
                headers: { "Content-type": "application/json" },
                body: JSON.stringify({
                    order_id: orderId,
                    gross_amount: qty,
                    item_details: [{ id: "dn-custom", price: qty, quantity: 1, name: "Donasi Ciburial Eco-Digital" }]
                })
            });
            const data = await res.json();
            if (data.token && (window as any).snap) {
                (window as any).snap.pay(data.token, {
                    onSuccess: function (r: any) {
                        alert("Donasi sukses diterima! Dana langsung terdata di transparansi.");
                        if (onPaymentSuccess) onPaymentSuccess(qty, false, orderId, r.payment_type || "Midtrans");
                    },
                    onPending: function (r: any) { alert("Menunggu status pembayaran donasi."); },
                    onError: function (r: any) { alert("Pembayaran gagal."); }
                });
            } else {
                alert("Server Midtrans belum nyambung! Cek .env di Settings Vercel. (Pesan sistem: " + (data.error || "Missing Token") + ")");
            }
        } catch (e) {
            alert("Error.");
        }
        setLoadingDonasi(false);
    };

    return (
        <div className="pi">

            {/* HERO - ELEGANT EDITION */}
            <section
                className="hero-section"
                style={{
                    position: "relative",
                    overflow: "hidden",
                    minHeight: "clamp(400px, 75vh, 800px)",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    backgroundImage: "url('/padi.jpeg')",
                    backgroundSize: "cover",
                    backgroundPosition: "center",
                    backgroundAttachment: "fixed",
                }}
            >
                {/* Overlay - lebih gelap dan dramatis */}
                <div style={{
                    position: "absolute",
                    inset: 0,
                    background: "linear-gradient(170deg, rgba(15,35,25,0.72) 0%, rgba(27,67,50,0.78) 50%, rgba(10,28,18,0.90) 100%)",
                    zIndex: 1,
                }} />

                {/* Grain texture - kesan premium */}
                <div style={{
                    position: "absolute",
                    inset: 0,
                    backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noise'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noise)' opacity='0.06'/%3E%3C/svg%3E")`,
                    opacity: 0.4,
                    zIndex: 1,
                }} />

                <div className="hero-content" style={{ position: "relative", zIndex: 2, maxWidth: 900, width: "100%", textAlign: "center", padding: "0 clamp(12px, 3vw, 24px)" }}>

                    {/* Badge - lebih minimalis */}
                    <div style={{ marginBottom: 20, display: "flex", alignItems: "center", justifyContent: "center", gap: 8 }}>
                        <div style={{ width: 24, height: 1, background: "rgba(149,213,178,0.5)" }} />
                        <span style={{
                            fontSize: 9,
                            fontWeight: 600,
                            letterSpacing: ".15em",
                            textTransform: "uppercase",
                            color: "#95D5B2",
                            padding: "5px 10px",
                            borderRadius: 99,
                            border: "1px solid rgba(149,213,178,0.25)",
                            background: "rgba(149,213,178,0.08)",
                        }}>
                            Kp. Ciburial, Garut — Est. 2026
                        </span>
                        <div style={{ width: 24, height: 1, background: "rgba(149,213,178,0.5)" }} />
                    </div>

                    {/* Main Title */}
                    <h1
                        className="fnt hero-title"
                        style={{
                            fontWeight: 200,
                            lineHeight: 0.92,
                            color: "#FFFFFF",
                            letterSpacing: "-.04em",
                            marginBottom: 6,
                            fontSize: "clamp(72px,15vw,180px)",
                            textShadow: "0 8px 40px rgba(0,0,0,0.3)",
                        }}
                    >
                        Ciburial
                    </h1>

                    {/* Subtitle */}
                    <h2
                        className="fnt hero-sub"
                        style={{
                            fontWeight: 400,
                            fontStyle: "italic",
                            color: "#95D5B2", // hijau sage
                            letterSpacing: "-.01em",
                            marginBottom: 0,
                            fontSize: "clamp(24px,5.5vw,56px)",
                            textShadow: "0 4px 16px rgba(0,0,0,0.2)",
                        }}
                    >
                        Eco-Digital Village
                    </h2>

                    {/* Divider */}
                    <div style={{
                        height: 1,
                        background: "linear-gradient(90deg, transparent, rgba(149,213,178,0.6) 25%, rgba(149,213,178,0.8) 50%, rgba(149,213,178,0.6) 75%, transparent)",
                        margin: "20px auto",
                        maxWidth: 140,
                    }} />

                    {/* Tagline - italic, clean */}
                    <p
                        className="fnt"
                        style={{
                            fontSize: "clamp(12px,1.8vw,18px)",
                            fontWeight: 300,
                            fontStyle: "italic",
                            color: "rgba(255,255,255,0.75)",
                            letterSpacing: ".01em",
                            lineHeight: 1.6,
                            marginBottom: 12,
                            maxWidth: 500,
                            margin: "0 auto 12px",
                        }}
                    >
<<<<<<< HEAD
                        Inovasi Desa Mandiri Berbasis Kearifan Lokal dan Teknologi Masa Depan
=======
                        Inovasi Desa Mandiri Berbasis Kearifan Lokal dan Teknologi Tepat Guna
>>>>>>> a637e63bec351e4f46e7425aaaea45b9a1ab3434
                    </p>

                    {/* Description */}
                    <p style={{
                        maxWidth: 520,
                        fontSize: "clamp(12px,1.6vw,15px)",
                        fontWeight: 400,
                        lineHeight: 1.8,
                        color: "rgba(255,255,255,0.7)",
                        margin: "0 auto 20px",
                    }}>
                        Memutus rantai ketertinggalan dengan{" "}
                        <strong style={{ color: "#95D5B2", fontWeight: 600 }}>digitalisasi hasil bumi</strong>,{" "}
                        <strong style={{ color: "#95D5B2", fontWeight: 600 }}>ekosistem sirkular</strong>, dan{" "}
                        <strong style={{ color: "#95D5B2", fontWeight: 600 }}>generasi muda yang melek teknologi</strong>.
                    </p>

                    {/* Tags - kurangi jadi 4, hapus yang kurang penting */}
                    <div style={{ display: "flex", gap: 6, flexWrap: "wrap", justifyContent: "center", marginBottom: 28 }}>
<<<<<<< HEAD
                        {["Pertanian Organik", "Kerajinan", "Eco-Waste", "Learning Hub"].map(tag => (
=======
                        {["Pertanian Organik", "Eco-Waste", "Learning Hub", "Kas Transparan"].map(tag => (
>>>>>>> a637e63bec351e4f46e7425aaaea45b9a1ab3434
                            <span
                                key={tag}
                                style={{
                                    padding: "5px 10px",
                                    fontSize: 10,
                                    fontWeight: 500,
                                    borderRadius: 99,
                                    color: "rgba(255,255,255,0.85)",
                                    background: "rgba(255,255,255,0.08)",
                                    border: "1px solid rgba(255,255,255,0.15)",
                                    backdropFilter: "blur(4px)",
                                }}
                            >
                                {tag}
                            </span>
                        ))}
                    </div>

                    {/* CTA Buttons */}
                    <div style={{ display: "flex", justifyContent: "center", gap: "clamp(6px, 2vw, 10px)", width: "100%", padding: "0 8px" }}>
                        <button
                            className="btn-heroic"
                            onClick={() => document.getElementById("content-start")?.scrollIntoView({ behavior: "smooth" })}
                            style={{
                                flex: "1 1 auto",
                                maxWidth: 180,
                                padding: "clamp(10px, 2.5vw, 13px) clamp(8px, 2vw, 28px)",
                                fontSize: "clamp(9px, 2.5vw, 11px)",
                                fontWeight: 700,
                                letterSpacing: ".08em",
                                textTransform: "uppercase",
                                border: "none",
                                borderRadius: 6,
                                background: "#95D5B2", // sage green
                                color: "#1B4332",
                                cursor: "pointer",
                                boxShadow: "0 6px 20px rgba(149,213,178,0.25)",
                                transition: "all .35s cubic-bezier(.22,1,.36,1)",
                                whiteSpace: "nowrap",
                                overflow: "hidden",
                                textOverflow: "ellipsis"
                            }}
                            onMouseEnter={e => {
                                e.currentTarget.style.transform = "translateY(-3px)";
                                e.currentTarget.style.boxShadow = "0 12px 32px rgba(149,213,178,0.35)";
                                e.currentTarget.style.background = "#b0e0c8";
                            }}
                            onMouseLeave={e => {
                                e.currentTarget.style.transform = "translateY(0)";
                                e.currentTarget.style.boxShadow = "0 6px 20px rgba(149,213,178,0.25)";
                                e.currentTarget.style.background = "#95D5B2";
                            }}
                        >
                            Jelajahi
                        </button>

                        <button
                            onClick={() => setShowStory(true)}
                            style={{
                                flex: "1 1 auto",
                                maxWidth: 180,
                                padding: "clamp(10px, 2.5vw, 13px) clamp(8px, 2vw, 28px)",
                                fontSize: "clamp(9px, 2.5vw, 11px)",
                                fontWeight: 700,
                                letterSpacing: ".08em",
                                textTransform: "uppercase",
                                border: "1px solid rgba(255,255,255,0.25)",
                                borderRadius: 6,
                                background: "rgba(255,255,255,0.08)",
                                color: "rgba(255,255,255,0.9)",
                                cursor: "pointer",
                                whiteSpace: "nowrap",
                                overflow: "hidden",
                                textOverflow: "ellipsis",
                                backdropFilter: "blur(12px)",
                                transition: "all .35s cubic-bezier(.22,1,.36,1)",
                                display: "flex",
                                alignItems: "center",
                                justifyContent: "center",
                                gap: 6,
                            }}
                            onMouseEnter={e => {
                                e.currentTarget.style.transform = "translateY(-3px)";
                                e.currentTarget.style.background = "rgba(255,255,255,0.15)";
                                e.currentTarget.style.borderColor = "rgba(255,255,255,0.4)";
                            }}
                            onMouseLeave={e => {
                                e.currentTarget.style.transform = "translateY(0)";
                                e.currentTarget.style.background = "rgba(255,255,255,0.08)";
                                e.currentTarget.style.borderColor = "rgba(255,255,255,0.25)";
                            }}
                        >
                            <BookOpen size={14} style={{ display: "inline", marginRight: 4 }} /> Story
                        </button>
                    </div>
                </div>

                {/* Scroll Indicator - CSS arrow, bukan emoji */}
                <div style={{
                    position: "absolute",
                    bottom: 36,
                    left: "50%",
                    transform: "translateX(-50%)",
                    zIndex: 2,
                    display: "flex",
                    flexDirection: "column",
                    alignItems: "center",
                    gap: 6,
                    animation: "scrollBounce 2.5s ease-in-out infinite",
                }}>
                    <span style={{ fontSize: 9, color: "rgba(255,255,255,0.4)", letterSpacing: ".2em", textTransform: "uppercase", fontFamily: "sans-serif" }}>scroll</span>
                    <div style={{ width: 1, height: 40, background: "linear-gradient(to bottom, rgba(149,213,178,0.6), transparent)" }} />
                </div>

                <style>{`
 @keyframes scrollBounce {
 0%, 100% { transform: translateX(-50%) translateY(0); opacity: 1; }
 50% { transform: translateX(-50%) translateY(8px); opacity: 0.5; }
 }
 `}</style>
            </section>

            {/* MARQUEE - fix jadi 2x bukan 4x */}
            <div id="content-start" className="marquee-section" style={{ background: "var(--fo)", overflow: "hidden", padding: "10px 0" }}>
                <div className="mq" style={{ display: "flex", whiteSpace: "nowrap", width: "max-content" }}>
                    {[...Array(2)].map((_, i) => ( // 2x
                        <span key={i} style={{ display: "flex", alignItems: "center", gap: 24, padding: "0 clamp(16px, 4vw, 24px)", color: "rgba(255,255,255,0.35)", fontSize: 10, fontWeight: 600, letterSpacing: ".2em", textTransform: "uppercase" }}>
                            {["Mandiri", "Berkelanjutan", "Inovatif", "Transparan", "Eco-Digital", "Gotong Royong", "Quantum Leap"].map((w, j) => (
                                <span key={j}>{w}{j < 6 && <span style={{ color: "rgba(149,213,178,0.5)", margin: "0 10px" }}></span>}</span>
                            ))}
                        </span>
                    ))}
                </div>
            </div>
            {/* DENYUT NADI — Live Community Dashboard */}
            <CommunityDashboard />

            {/* CIBURIAL SMART HUB — DIGITAL SERVICES */}
            <section className="sec" style={{ padding: "clamp(36px,6vw,80px) clamp(12px,3vw,28px)", background: "linear-gradient(180deg, rgba(232,245,238,0.5) 0%, #FAF8F3 100%)" }}>
                <div style={{ maxWidth: 1320, margin: "0 auto" }}>
                    <Reveal>
                        <div style={{ textAlign: "center", marginBottom: 32 }}>
                            <span className="badge-heroic" style={{ padding: "5px 12px", fontSize: 9, borderRadius: 99, background: "rgba(47,143,78,0.1)", color: "#2F8F4E", border: "1px solid rgba(47,143,78,0.2)", fontWeight: 800, letterSpacing: "0.08em" }}>DIGITAL TRANSFORMATION</span>
                            <h2 className="fnt" style={{ fontSize: "clamp(26px,4.5vw,40px)", fontWeight: 300, color: "#1C3A2B", marginTop: 12, marginBottom: 8, letterSpacing: "-.02em" }}>Ciburial Smart Hub</h2>
                            <p style={{ color: "#5A4A40", fontSize: "clamp(12px,2.5vw,14px)", maxWidth: 500, margin: "0 auto", fontWeight: 500, lineHeight: 1.6 }}>Pusat kendali dan layanan warga berbasis teknologi.</p>
                        </div>
                    </Reveal>

                    <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(min(100%, 160px), 1fr))", gap: "clamp(8px, 2vw, 18px)", maxWidth: 1200 }} className="grid-2x3-hub">
                        {[
                            {
                                title: "E-Voting",
                                desc: "Musyawarah digital & aman",
                                icon: <Vote strokeWidth={1.5} className="hub-icon" />,
                                link: "/voting",
                                color: "#2F8F4E",
                                tag: "MUSYAWARAH",
                                comingSoon: false
                            },
                            {
                                title: "Posyandu Pintar",
                                desc: "Tracking gizi & kesehatan balita",
                                icon: <Stethoscope strokeWidth={1.5} className="hub-icon" />,
                                link: "/posyandu",
                                color: "#8B2020",
                                tag: "KESEHATAN",
                                comingSoon: false
                            },
                            {
                                title: "Monitoring Ronda",
                                desc: "Keamanan real-time berbasis E-KTP",
                                icon: <ShieldCheck strokeWidth={1.5} className="hub-icon" />,
                                link: "/ronda",
                                color: "#1C3A2B",
                                tag: "KEAMANAN",
                                comingSoon: false
                            },
                            {
                                title: "Zakat Digital",
                                desc: "Cek kewajiban & hak Zakat",
                                icon: <HandHeart strokeWidth={1.5} className="hub-icon" />,
                                link: "/zakat",
                                color: "#B8943F",
                                tag: "DKM / SOSIAL",
                                comingSoon: false
                            },
                            {
                                title: "Layanan Aduan",
                                desc: "Lapor masalah fasilitas publik",
                                icon: <Megaphone strokeWidth={1.5} className="hub-icon" />,
                                link: "/pengaduan",
                                color: "#2D5A40",
                                tag: "RESPONS CEPAT",
                                comingSoon: false
                            },
                            {
                                title: "Tukar Poin",
                                desc: "Mini ATM & dompet reward untuk semua layanan",
                                icon: <HandCoins strokeWidth={1.5} className="hub-icon" />,
                                link: "/tukar-poin",
                                color: "#B8943F",
                                tag: "ECO-REWARD",
                                comingSoon: false
                            },
                            {
                                title: "Learning Hub",
                                desc: "E-Perpus, Lab Komputer & video pelatihan digital",
                                icon: <BookOpen strokeWidth={1.5} className="hub-icon" />,
                                link: "/learning-hub",
                                color: "#2563EB",
                                tag: "PENDIDIKAN",
                                comingSoon: false
                            }
                        ].map((item, i) => (
                            <Reveal key={i} delay={i * 50} direction="up">
<<<<<<< HEAD
                                <a href={item.link} style={{ textDecoration: "none", color: "inherit", pointerEvents: item.comingSoon ? "none" : "auto", display: "block", height: "100%" }} className="hub-card-link">
=======
                                <a 
                                    href={item.link} 
                                    onClick={() => playSound("tap")}
                                    style={{ textDecoration: "none", color: "inherit", pointerEvents: item.comingSoon ? "none" : "auto", display: "block", height: "100%" }} 
                                    className="hub-card-link"
                                >
>>>>>>> a637e63bec351e4f46e7425aaaea45b9a1ab3434
                                    <div className="card-heroic" style={{
                                        height: "100%",
                                        padding: "clamp(10px, 2.5vw, 24px) clamp(8px, 2.5vw, 20px)",
                                        background: item.comingSoon ? "linear-gradient(135deg,rgba(250,248,243,.5),rgba(232,245,238,.3))" : "white",
                                        border: `1.5px solid ${item.comingSoon ? "rgba(155,125,76,.2)" : "rgba(0,0,0,0.04)"}`,
                                        display: "flex",
                                        flexDirection: "column",
                                        gap: "clamp(6px, 1.5vw, 12px)",
                                        transition: "all 0.4s cubic-bezier(0.22, 1, 0.36, 1)",
                                        position: "relative",
                                        overflow: "hidden",
                                        opacity: item.comingSoon ? 0.7 : 1,
                                        borderRadius: "clamp(10px, 2vw, 14px)"
                                    }}>
                                        {/* Decorative Gradient Background on Hover */}
                                        <div className="hover-gradient" style={{
                                            position: "absolute",
                                            top: 0, left: 0, width: "100%", height: "3px",
                                            background: `linear-gradient(90deg, transparent, ${item.color}, transparent)`,
                                            opacity: 0.6
                                        }} />

                                        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 4 }}>
                                            <div style={{
                                                width: "clamp(32px, 8vw, 44px)", height: "clamp(32px, 8vw, 44px)", borderRadius: "clamp(6px, 1.5vw, 10px)",
                                                background: `${item.color}10`,
                                                display: "flex", alignItems: "center", justifyContent: "center",
                                                boxShadow: `0 6px 16px ${item.color}15`,
                                                color: item.color,
                                                flexShrink: 0
                                            }}>
                                                <span style={{ display: "flex", alignItems: "center", justifyContent: "center" }}>
                                                    {item.icon}
                                                </span>
                                            </div>
                                            {item.comingSoon ? (
                                                <span style={{ fontSize: "clamp(6px, 1.5vw, 7px)", fontWeight: 900, letterSpacing: "0.08em", color: item.color, background: `${item.color}15`, padding: "clamp(2px, 0.5vw, 4px) clamp(4px, 1vw, 8px)", borderRadius: 5, border: `1.5px solid ${item.color}40`, textTransform: "uppercase", flexShrink: 0 }}>Soon</span>
                                            ) : (
                                                <span style={{ fontSize: "clamp(6px, 1.5vw, 7px)", fontWeight: 900, letterSpacing: "0.08em", color: item.color, background: `${item.color}08`, padding: "clamp(2px, 0.5vw, 3px) clamp(4px, 1vw, 8px)", borderRadius: 5, border: `1px solid ${item.color}20`, flexShrink: 0, whiteSpace: "nowrap" }}>{item.tag}</span>
                                            )}
                                        </div>

                                        <div style={{ minHeight: 0 }}>
                                            <h3 style={{ fontSize: "clamp(12px, 3vw, 14px)", fontWeight: 700, color: "#1C3A2B", marginBottom: 2, lineHeight: 1.2 }}>{item.title}</h3>
                                            <p style={{ fontSize: "clamp(10px, 2.5vw, 11px)", color: "#5A4A40", lineHeight: 1.4, fontWeight: 500 }}>{item.desc}</p>
                                        </div>

                                        {!item.comingSoon && (
                                            <div style={{ marginTop: "auto", display: "flex", alignItems: "center", gap: 4, color: item.color, fontSize: "clamp(8px, 2vw, 10px)", fontWeight: 700, letterSpacing: "0.04em" }}>
                                                BUKA <span style={{ transition: "transform 0.3s" }} className="arrow">→</span>
                                            </div>
                                        )}
                                    </div>
                                </a>
                            </Reveal>
                        ))}
                    </div>
                </div>
                <style>{`
 @media (max-width: 768px) {
 .grid-2x3-hub {
 grid-template-columns: repeat(2, 1fr) !important;
 gap: 8px !important;
 }
 .grid-2x3-hub .card-heroic {
 padding: 12px 10px !important;
 }
 }
 @media (max-width: 400px) {
 .grid-2x3-hub {
 grid-template-columns: repeat(2, 1fr) !important;
 gap: 6px !important;
 }
 }
 .hub-card-link:hover .card-heroic {
 transform: translateY(-8px);
 box-shadow: 0 20px 40px rgba(0,0,0,0.08);
 border-color: rgba(47,143,78,0.2);
 }
 .hub-card-link:hover .arrow {
 transform: translateX(4px);
 }
 `}</style>
            </section>


            {/* VISI MISI & STRUKTUR KEPENGURUSAN (Telah dipindah ke halaman /tentang) */}


            {/* TESTIMONI & BERITA SLIDER (Telah dipindah ke halaman Info Harian) */}


            {/* DONASI SPLIT */}
            <section className="sec donasi-section" style={{ padding: "0 clamp(12px,3vw,32px) clamp(48px,8vw,104px)" }}>
                <div style={{ maxWidth: 1320, margin: "0 auto" }}>
                    <Reveal>
                        <div style={{ borderRadius: 28, overflow: "hidden", display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(min(100%, 300px),1fr))" }}>
                            <div className="donasi-panel-dark" style={{ background: "var(--fo)", padding: "clamp(32px, 6vw, 60px) clamp(24px, 5vw, 52px)" }}>
                                <div className="dl" />
                                <h2 className="fnt" style={{ fontSize: "clamp(26px, 4.5vw, 40px)", fontWeight: 300, color: "var(--cr)", lineHeight: 1.2, letterSpacing: "-.02em", marginBottom: 14 }}>Donasi Kemakmuran<br />Kampung Ciburial</h2>
                                <p style={{ fontSize: "clamp(12px,2.5vw,13px)", lineHeight: 1.75, color: "rgba(250,248,243,.5)", marginBottom: 28 }}>
<<<<<<< HEAD
                                    Target RAB Global <strong style={{ color: "var(--gl)" }}>Rp 250.000.000</strong>. Dukung Balai Warga, Smart Farming, Learning Hub, Smart PJU, dan Internet Desa.
                                </p>

                                {/* PROGRESS BAR */}
                                <div style={{ marginBottom: 28 }}>
                                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 10 }}>
                                        <span style={{ fontSize: 11, fontWeight: 700, letterSpacing: ".08em", textTransform: "uppercase", color: "rgba(250,248,243,.6)" }}>Progress Donasi</span>
                                        <span style={{ fontSize: 12, fontWeight: 700, color: "var(--gl)" }}><Counter value={(saldo / 250000000) * 100} decimals={1} suffix="%" duration={1400} /></span>
                                    </div>
                                    <div style={{ width: "100%", height: 12, background: "rgba(255,255,255,.12)", borderRadius: 99, overflow: "hidden", boxShadow: "inset 0 1px 3px rgba(0,0,0,.2)" }}>
                                        <div style={{ width: `${Math.min((saldo / 250000000) * 100, 100)}%`, height: "100%", background: "linear-gradient(90deg, #4FBF7E, var(--gl))", borderRadius: 99, transition: "width 1s cubic-bezier(.22,1,.36,1)", boxShadow: "0 0 12px rgba(79,191,126,.6)" }} />
                                    </div>
                                    <div style={{ fontSize: 10, color: "rgba(250,248,243,.45)", marginTop: 6 }}>
                                        <Counter value={saldo / 1000000} decimals={1} duration={1400} /> dari 250 juta terkumpul
                                    </div>
                                </div>

                                <div style={{ display: "flex", flexDirection: "column", gap: 12, marginBottom: 24 }}>
                                    {[
                                        { id: "midtrans", icon: <Smartphone size={24} strokeWidth={1.5} />, l: "QRIS & E-Wallet", s: "Donasi Instan via Midtrans" },
                                        { id: "bank", icon: <Landmark size={24} strokeWidth={1.5} />, l: "Transfer Bank", s: "Rekening Resmi DKM Ciburial", rek: "90135555066", an: "Ubay Rahmat H", ket: "SeaBank (901)" },
                                        { id: "crypto", icon: <Search size={24} strokeWidth={1.5} />, l: "Crypto / Web3", s: "EVM-Compatible Wallet", rek: "0x71723715478b344164e992b49ae1fCEb6467888B", an: "Multi-Chain", ket: "Polygon, BSC, ETH, dll." }
                                    ].map((m, i) => {
                                        const isExp = expandedDonation === m.id;
                                        return (
                                            <div key={i} style={{ borderRadius: 16, overflow: "hidden", border: "1px solid rgba(255,255,255,.12)", transition: "all .3s" }}>
                                                <div
                                                    onClick={() => {
                                                        if (m.id === "midtrans") bayarDonasi();
                                                        else setExpandedDonation(isExp ? null : m.id);
                                                    }}
                                                    style={{ display: "flex", alignItems: "center", gap: 14, padding: "clamp(12px, 3vw, 16px) clamp(16px, 4vw, 20px)", background: isExp ? "rgba(255,255,255,.15)" : "rgba(255,255,255,.06)", cursor: "pointer", transition: "all .2s" }}
                                                    onMouseEnter={e => { if (!isExp) e.currentTarget.style.background = "rgba(255,255,255,.12)"; }}
                                                    onMouseLeave={e => { if (!isExp) e.currentTarget.style.background = "rgba(255,255,255,.06)"; }}
                                                >
                                                    <span style={{ fontSize: 28 }}>{m.icon}</span>
                                                    <div style={{ flex: 1 }}>
                                                        <div style={{ fontSize: 14, fontWeight: 800, color: "var(--cr)" }}>{m.l}</div>
                                                        <div style={{ fontSize: 11, color: "rgba(250,248,243,.5)" }}>{m.s}</div>
                                                    </div>
                                                    {m.id !== "midtrans" && (
                                                        <span style={{ fontSize: 12, color: "var(--cr)", transform: isExp ? "rotate(180deg)" : "rotate(0)", transition: "transform .3s" }}>▼</span>
                                                    )}
                                                </div>

                                                {/* Inline Details */}
                                                {isExp && m.rek && (
                                                    <div style={{ background: "white", padding: "clamp(16px, 4vw, 20px)", color: "#000" }}>
                                                        <div style={{ background: "#F1F5F9", padding: "clamp(12px, 3vw, 16px)", borderRadius: 12, border: "1px solid #E2E8F0" }}>
                                                            <div style={{ fontSize: 9, fontWeight: 800, color: "#059669", marginBottom: 4 }}>{m.id === "bank" ? "NOMOR REKENING" : "WALLET ADDRESS"}</div>
                                                            <div style={{ fontSize: m.id === "bank" ? 22 : 11, fontWeight: 900, fontFamily: "monospace", wordBreak: "break-all", color: "#000" }}>{m.rek}</div>
                                                            <div style={{ fontSize: 9, fontWeight: 800, color: "#64748B", marginTop: 10, marginBottom: 2 }}>{m.id === "bank" ? "ATAS NAMA" : "NETWORK"}</div>
                                                            <div style={{ fontSize: 14, fontWeight: 700, color: "#000" }}>{m.an}</div>
                                                        </div>
                                                        <div style={{ marginTop: 12, fontSize: 11, color: "#166534", background: "#F0FDF4", padding: "8px 12px", borderRadius: 8, border: "1px solid #BBF7D0", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                                                            <span> {m.ket}</span>
                                                            <button
                                                                onClick={(e) => {
                                                                    e.stopPropagation();
                                                                    navigator.clipboard.writeText(m.rek!);
                                                                    alert(" Copied!");
                                                                }}
                                                                style={{ background: "#2F8F4E", border: "none", color: "white", padding: "4px 10px", borderRadius: 6, fontSize: 10, fontWeight: 700, cursor: "pointer" }}
                                                            >
                                                                SALIN
                                                            </button>
                                                        </div>
                                                    </div>
                                                )}
                                            </div>
                                        );
                                    })}
                                </div>
                                <div style={{ display: "flex", gap: 14, flexWrap: "wrap", alignItems: "center" }}>
                                    <button onClick={() => onNavigate("transparansi")} style={{ padding: "11px 22px", borderRadius: 99, fontSize: 11, fontWeight: 700, letterSpacing: ".09em", textTransform: "uppercase", border: "1.5px solid rgba(79,191,126,.4)", background: "rgba(79,191,126,.15)", color: "var(--cr)", cursor: "pointer", transition: "all .2s" }}
                                        onMouseEnter={e => { (e.currentTarget as HTMLButtonElement).style.background = "rgba(79,191,126,.25)"; (e.currentTarget as HTMLButtonElement).style.borderColor = "rgba(79,191,126,.6)"; }}
                                        onMouseLeave={e => { (e.currentTarget as HTMLButtonElement).style.background = "rgba(79,191,126,.15)"; (e.currentTarget as HTMLButtonElement).style.borderColor = "rgba(79,191,126,.4)"; }}
                                    >
                                        Lihat Transparansi Dana →
                                    </button>
                                </div>
                            </div>
                            <div className="donasi-panel-light" style={{ background: "linear-gradient(135deg,rgba(47,143,78,.05) 0%,rgba(79,191,126,.05) 100%)", padding: "clamp(32px, 6vw, 60px) clamp(24px, 5vw, 52px)", display: "flex", flexDirection: "column", justifyContent: "center" }}>
                                <div style={{ fontSize: 10, fontWeight: 700, letterSpacing: ".2em", textTransform: "uppercase", color: "#2F8F4E", marginBottom: 20 }}>Doa untuk Donatur</div>
                                <p dir="rtl" className="fnt" style={{ fontSize: "clamp(18px,4vw,27px)", lineHeight: 1.9, color: "#1C3A2B", fontWeight: 400, marginBottom: 22 }}>
                                    رَبَّنَا آتِنَا فِي الدُّنْيَا حَسَنَةً وَفِي الْآخِرَةِ حَسَنَةً وَقِنَا عَذَابَ النَّارِ
                                </p>
                                <p style={{ fontSize: 13, fontStyle: "italic", lineHeight: 1.85, color: "#5A4A40", marginBottom: 14 }}>
                                    &quot;Ya Tuhan kami, berilah mereka kebaikan di dunia dan di akhirat, serta lindungilah dari siksa neraka.&quot;
                                </p>
                                <span style={{ fontSize: 10, fontWeight: 700, letterSpacing: ".1em", textTransform: "uppercase", color: "#2F8F4E", opacity: .65 }}>QS. Al-Baqarah: 201</span>
                            </div>
                        </div>
                    </Reveal>
                </div>
            </section>

            {/* DONASI DETAIL POPOVER */}
            {selectedDonationMethod && (
                <div
                    style={{ position: "fixed", top: 0, left: 0, right: 0, bottom: 0, zIndex: 10000, background: "rgba(0,0,0,0.15)", backdropFilter: "blur(2px)" }}
                    onClick={() => setSelectedDonationMethod(null)}
                >
                    <div
                        style={{
                            position: "fixed",
                            top: Math.max(10, Math.min(popoverPos.top || 100, window.innerHeight - 320)),
                            left: Math.max(10, Math.min(popoverPos.left || 20, window.innerWidth - 360)),
                            width: "min(340px, 92vw)",
                            maxHeight: "80vh",
                            overflowY: "auto",
                            background: "#FFFFFF",
                            borderRadius: "20px",
                            border: "2px solid #2F8F4E",
                            boxShadow: "0 25px 50px -12px rgba(0,0,0,0.4)",
                            padding: "24px",
                            zIndex: 10001,
                            color: "#1A1410",
                            visibility: selectedDonationMethod ? "visible" : "hidden",
                            opacity: selectedDonationMethod ? 1 : 0,
                            transition: "opacity 0.3s ease"
                        }}
                        onClick={(e) => e.stopPropagation()}
                    >
                        {/* Close Button */}
                        <button
                            onClick={() => setSelectedDonationMethod(null)}
                            style={{ position: "absolute", top: 12, right: 12, width: 28, height: 28, borderRadius: "50%", background: "#F0FDF4", border: "1px solid #DCFCE7", color: "#166534", fontSize: 14, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", fontWeight: "bold" }}
                        >
                            X
                        </button>

                        {/* Render Berdasarkan ID Metode */}
                        {selectedDonationMethod === "bank" ? (
                            <div style={{ textAlign: "left" }}>
                                <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 16 }}>
                                    <span style={{ fontSize: 32 }}><Landmark size={32} strokeWidth={1.5} /></span>
                                    <div>
                                        <h3 style={{ fontSize: 18, fontWeight: 800, color: "#1C3A2B", margin: 0 }}>Transfer Bank</h3>
                                        <p style={{ fontSize: 11, color: "#6B7280", margin: 0 }}>Rekening Resmi DKM Ciburial</p>
                                    </div>
                                </div>

=======
                                    Dukung inisiatif Balai Warga, Smart Farming, Learning Hub, Smart PJU, dan Internet Desa untuk masa depan Ciburial.
                                </p>

                                <div style={{ display: "flex", flexDirection: "column", gap: 12, marginBottom: 24 }}>
                                    {[
                                        { id: "midtrans", icon: <Smartphone size={24} strokeWidth={1.5} />, l: "QRIS & E-Wallet", s: "Donasi Instan via Midtrans" },
                                        { id: "bank", icon: <Landmark size={24} strokeWidth={1.5} />, l: "Transfer Bank", s: "Rekening Titipan Gotong Royong", rek: "90135555066", an: "Ubay Rahmat H", ket: "SeaBank (901)" }
                                    ].map((m, i) => {
                                        const isExp = expandedDonation === m.id;
                                        return (
                                            <div key={i} style={{ borderRadius: 16, overflow: "hidden", border: "1px solid rgba(255,255,255,.12)", transition: "all .3s" }}>
                                                <div
                                                    onClick={() => {
                                                        if (m.id === "midtrans") bayarDonasi();
                                                        else setExpandedDonation(isExp ? null : m.id);
                                                    }}
                                                    style={{ display: "flex", alignItems: "center", gap: 14, padding: "clamp(12px, 3vw, 16px) clamp(16px, 4vw, 20px)", background: isExp ? "rgba(255,255,255,.15)" : "rgba(255,255,255,.06)", cursor: "pointer", transition: "all .2s" }}
                                                    onMouseEnter={e => { if (!isExp) e.currentTarget.style.background = "rgba(255,255,255,.12)"; }}
                                                    onMouseLeave={e => { if (!isExp) e.currentTarget.style.background = "rgba(255,255,255,.06)"; }}
                                                >
                                                    <span style={{ fontSize: 28 }}>{m.icon}</span>
                                                    <div style={{ flex: 1 }}>
                                                        <div style={{ fontSize: 14, fontWeight: 800, color: "var(--cr)" }}>{m.l}</div>
                                                        <div style={{ fontSize: 11, color: "rgba(250,248,243,.5)" }}>{m.s}</div>
                                                    </div>
                                                    {m.id !== "midtrans" && (
                                                        <span style={{ fontSize: 12, color: "var(--cr)", transform: isExp ? "rotate(180deg)" : "rotate(0)", transition: "transform .3s" }}>▼</span>
                                                    )}
                                                </div>

                                                {/* Inline Details */}
                                                {isExp && m.rek && (
                                                    <div style={{ background: "white", padding: "clamp(16px, 4vw, 20px)", color: "#000" }}>
                                                        <div style={{ background: "#F1F5F9", padding: "clamp(12px, 3vw, 16px)", borderRadius: 12, border: "1px solid #E2E8F0" }}>
                                                            <div style={{ fontSize: 9, fontWeight: 800, color: "#059669", marginBottom: 4 }}>{m.id === "bank" ? "NOMOR REKENING" : "WALLET ADDRESS"}</div>
                                                            <div style={{ fontSize: m.id === "bank" ? 22 : 11, fontWeight: 900, fontFamily: "monospace", wordBreak: "break-all", color: "#000" }}>{m.rek}</div>
                                                            <div style={{ fontSize: 9, fontWeight: 800, color: "#64748B", marginTop: 10, marginBottom: 2 }}>{m.id === "bank" ? "ATAS NAMA" : "NETWORK"}</div>
                                                            <div style={{ fontSize: 14, fontWeight: 700, color: "#000" }}>{m.an}</div>
                                                        </div>
                                                        <div style={{ marginTop: 12, fontSize: 11, color: "#166534", background: "#F0FDF4", padding: "8px 12px", borderRadius: 8, border: "1px solid #BBF7D0", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                                                            <span> {m.ket}</span>
                                                            <button
                                                                onClick={(e) => {
                                                                    e.stopPropagation();
                                                                    navigator.clipboard.writeText(m.rek!);
                                                                    alert(" Copied!");
                                                                }}
                                                                style={{ background: "#2F8F4E", border: "none", color: "white", padding: "4px 10px", borderRadius: 6, fontSize: 10, fontWeight: 700, cursor: "pointer" }}
                                                            >
                                                                SALIN
                                                            </button>
                                                        </div>
                                                    </div>
                                                )}
                                            </div>
                                        );
                                    })}
                                </div>
                                <div style={{ display: "flex", gap: 14, flexWrap: "wrap", alignItems: "center" }}>
                                    <button onClick={() => onNavigate("transparansi")} style={{ padding: "11px 22px", borderRadius: 99, fontSize: 11, fontWeight: 700, letterSpacing: ".09em", textTransform: "uppercase", border: "1.5px solid rgba(79,191,126,.4)", background: "rgba(79,191,126,.15)", color: "var(--cr)", cursor: "pointer", transition: "all .2s" }}
                                        onMouseEnter={e => { (e.currentTarget as HTMLButtonElement).style.background = "rgba(79,191,126,.25)"; (e.currentTarget as HTMLButtonElement).style.borderColor = "rgba(79,191,126,.6)"; }}
                                        onMouseLeave={e => { (e.currentTarget as HTMLButtonElement).style.background = "rgba(79,191,126,.15)"; (e.currentTarget as HTMLButtonElement).style.borderColor = "rgba(79,191,126,.4)"; }}
                                    >
                                        Lihat Transparansi Dana →
                                    </button>
                                </div>
                            </div>
                            <div className="donasi-panel-light" style={{ background: "linear-gradient(135deg,rgba(47,143,78,.05) 0%,rgba(79,191,126,.05) 100%)", padding: "clamp(32px, 6vw, 60px) clamp(24px, 5vw, 52px)", display: "flex", flexDirection: "column", justifyContent: "center" }}>
                                <div style={{ fontSize: 10, fontWeight: 700, letterSpacing: ".2em", textTransform: "uppercase", color: "#2F8F4E", marginBottom: 20 }}>Doa untuk Donatur</div>
                                <p dir="rtl" className="fnt" style={{ fontSize: "clamp(18px,4vw,27px)", lineHeight: 1.9, color: "#1C3A2B", fontWeight: 400, marginBottom: 22 }}>
                                    رَبَّنَا آتِنَا فِي الدُّنْيَا حَسَنَةً وَفِي الْآخِرَةِ حَسَنَةً وَقِنَا عَذَابَ النَّارِ
                                </p>
                                <p style={{ fontSize: 13, fontStyle: "italic", lineHeight: 1.85, color: "#5A4A40", marginBottom: 14 }}>
                                    &quot;Ya Tuhan kami, berilah mereka kebaikan di dunia dan di akhirat, serta lindungilah dari siksa neraka.&quot;
                                </p>
                                <span style={{ fontSize: 10, fontWeight: 700, letterSpacing: ".1em", textTransform: "uppercase", color: "#2F8F4E", opacity: .65 }}>QS. Al-Baqarah: 201</span>
                            </div>
                        </div>
                    </Reveal>
                </div>
            </section>

            {/* DONASI DETAIL POPOVER */}
            {selectedDonationMethod && (
                <div
                    style={{ position: "fixed", top: 0, left: 0, right: 0, bottom: 0, zIndex: 10000, background: "rgba(0,0,0,0.15)", backdropFilter: "blur(2px)" }}
                    onClick={() => setSelectedDonationMethod(null)}
                >
                    <div
                        style={{
                            position: "fixed",
                            top: Math.max(10, Math.min(popoverPos.top || 100, window.innerHeight - 320)),
                            left: Math.max(10, Math.min(popoverPos.left || 20, window.innerWidth - 360)),
                            width: "min(340px, 92vw)",
                            maxHeight: "80vh",
                            overflowY: "auto",
                            background: "#FFFFFF",
                            borderRadius: "20px",
                            border: "2px solid #2F8F4E",
                            boxShadow: "0 25px 50px -12px rgba(0,0,0,0.4)",
                            padding: "24px",
                            zIndex: 10001,
                            color: "#1A1410",
                            visibility: selectedDonationMethod ? "visible" : "hidden",
                            opacity: selectedDonationMethod ? 1 : 0,
                            transition: "opacity 0.3s ease"
                        }}
                        onClick={(e) => e.stopPropagation()}
                    >
                        {/* Close Button */}
                        <button
                            onClick={() => setSelectedDonationMethod(null)}
                            style={{ position: "absolute", top: 12, right: 12, width: 28, height: 28, borderRadius: "50%", background: "#F0FDF4", border: "1px solid #DCFCE7", color: "#166534", fontSize: 14, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", fontWeight: "bold" }}
                        >
                            X
                        </button>

                        {/* Render Berdasarkan ID Metode */}
                        {selectedDonationMethod === "bank" ? (
                            <div style={{ textAlign: "left" }}>
                                <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 16 }}>
                                    <span style={{ fontSize: 32 }}><Landmark size={32} strokeWidth={1.5} /></span>
                                    <div>
                                        <h3 style={{ fontSize: 18, fontWeight: 800, color: "#1C3A2B", margin: 0 }}>Transfer Bank</h3>
                                        <p style={{ fontSize: 11, color: "#6B7280", margin: 0 }}>Rekening Titipan Gotong Royong</p>
                                    </div>
                                </div>

>>>>>>> a637e63bec351e4f46e7425aaaea45b9a1ab3434
                                <div style={{ background: "#F8FAFC", border: "1.5px solid #E2E8F0", borderRadius: 12, padding: 16, marginBottom: 16 }}>
                                    <div style={{ fontSize: 10, fontWeight: 700, letterSpacing: "0.05em", textTransform: "uppercase", color: "#059669", marginBottom: 6 }}>Nomor Rekening (SeaBank)</div>
                                    <div style={{ fontSize: 18, fontWeight: 800, color: "#1E293B", fontFamily: "monospace", letterSpacing: "1.5px" }}>90135555066</div>

                                    <div style={{ height: "1px", background: "#E2E8F0", margin: "12px 0" }}></div>

                                    <div style={{ fontSize: 10, fontWeight: 700, letterSpacing: "0.05em", textTransform: "uppercase", color: "#64748B", marginBottom: 4 }}>Atas Nama</div>
                                    <div style={{ fontSize: 14, fontWeight: 700, color: "#1E293B" }}>Ubay Rahmat H</div>
                                </div>

                                <div style={{ fontSize: 11, color: "#166534", background: "#F0FDF4", border: "1px solid #BBF7D0", borderRadius: 8, padding: 10, display: "flex", gap: 8, alignItems: "center" }}>
                                    <span><Lightbulb size={16} strokeWidth={1.5} /></span>
                                    <span>SeaBank (Kode: 901) • Transfer sesama/e-wallet gratis.</span>
                                </div>
                            </div>
<<<<<<< HEAD
                        ) : selectedDonationMethod === "crypto" ? (
                            <div style={{ textAlign: "left" }}>
                                <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 16 }}>
                                    <span style={{ fontSize: 32 }}><Globe size={32} strokeWidth={1.5} /></span>
                                    <div>
                                        <h3 style={{ fontSize: 18, fontWeight: 800, color: "#1C3A2B", margin: 0 }}>Crypto / Web3</h3>
                                        <p style={{ fontSize: 11, color: "#6B7280", margin: 0 }}>EVM-Compatible Wallet</p>
                                    </div>
                                </div>

                                <div style={{ background: "#F8FAFC", border: "1.5px solid #E2E8F0", borderRadius: 12, padding: 16, marginBottom: 16 }}>
                                    <div style={{ fontSize: 10, fontWeight: 700, letterSpacing: "0.05em", textTransform: "uppercase", color: "#059669", marginBottom: 6 }}>Wallet Address (Multi-Chain)</div>
                                    <div style={{ fontSize: 11, fontWeight: 700, color: "#1E293B", fontFamily: "monospace", wordBreak: "break-all", lineHeight: 1.5, background: "#F1F5F9", padding: "8px", borderRadius: "6px", marginBottom: 12 }}>
                                        0x71723715478b344164e992b49ae1fCEb6467888B
                                    </div>
                                    <button
                                        onClick={() => {
                                            navigator.clipboard.writeText("0x71723715478b344164e992b49ae1fCEb6467888B");
                                            alert(" Wallet address copied!");
                                        }}
                                        style={{ width: "100%", padding: "10px", background: "#2F8F4E", border: "none", borderRadius: "8px", color: "white", fontWeight: 700, fontSize: 12, cursor: "pointer", transition: "all .2s", boxShadow: "0 4px 12px rgba(47,143,78,0.2)" }}
                                        onMouseEnter={e => { (e.currentTarget as HTMLButtonElement).style.background = "#1A5C32"; }}
                                        onMouseLeave={e => { (e.currentTarget as HTMLButtonElement).style.background = "#2F8F4E"; }}
                                    >
                                        Copy Address
                                    </button>
                                </div>

                                <div style={{ fontSize: 11, color: "#166534", background: "#F0FDF4", border: "1px solid #BBF7D0", borderRadius: 8, padding: 10, display: "flex", gap: 8, alignItems: "center" }}>
                                    <span><Lightbulb size={16} strokeWidth={1.5} /></span>
                                    <span>Polygon, BSC, ETH, Base, Arbitrum, Optimism.</span>
                                </div>
                            </div>
=======
>>>>>>> a637e63bec351e4f46e7425aaaea45b9a1ab3434
                        ) : (
                            <div style={{ padding: "clamp(16px, 4vw, 20px)", textAlign: "center", color: "#66463F", background: "#FFF5F0", borderRadius: 12, border: "1px solid #FFDDD0" }}>
                                <div style={{ fontSize: 14, fontWeight: 700, marginBottom: 8 }}><AlertCircle size={14} style={{ display: "inline", marginRight: 4 }} /> Invalid Method</div>
                                <div style={{ fontSize: 11, color: "#8B6B63" }}>Method: <code style={{ background: "#FFE8DC", padding: "2px 6px", borderRadius: 4 }}>{selectedDonationMethod}</code></div>
<<<<<<< HEAD
                                <div style={{ fontSize: 10, marginTop: 8, color: "#A0837B" }}>Expected: "bank" or "crypto"</div>
=======
                                <div style={{ fontSize: 10, marginTop: 8, color: "#A0837B" }}>Expected: "bank"</div>
>>>>>>> a637e63bec351e4f46e7425aaaea45b9a1ab3434
                            </div>
                        )}
                    </div>

                    <style>{`
 @media (max-width: 768px) {
 /* Mobile responsive adjustments handled inline */
 }
 `}</style>
                </div>
            )}
            {/* STORY MODAL */}
            {showStory && (
                <div style={{ position: "fixed", inset: 0, zIndex: 9999, overflowY: "auto", background: "rgba(28,58,43,.7)", backdropFilter: "blur(12px)", padding: "clamp(20px, 5vw, 80px) clamp(12px, 3vw, 20px)", animation: "storyFadeIn .3s ease", display: "block" }}>
                    <div style={{ margin: "0 auto", flexShrink: 0, background: "linear-gradient(135deg,rgba(255,254,249,1) 0%,rgba(232,245,238,1) 100%)", borderRadius: "clamp(16px, 4vw, 24px)", maxWidth: 500, width: "100%", border: "1px solid rgba(47,143,78,.2)", boxShadow: "0 24px 64px rgba(28,58,43,.3)", position: "relative", animation: "storySlideUp .4s cubic-bezier(.22,1,.36,1)" }}>

                        {/* Header / Cover */}
                        <div style={{ height: "clamp(100px, 20vw, 160px)", background: "linear-gradient(135deg,#1C3A2B 0%,#2F8F4E 100%)", position: "relative", borderRadius: "clamp(16px, 4vw, 24px) clamp(16px, 4vw, 24px) 0 0" }}>
                            <div style={{ position: "absolute", top: "clamp(12px, 3vw, 20px)", right: "clamp(12px, 3vw, 20px)" }}>
                                <button onClick={() => setShowStory(false)} style={{ width: "clamp(28px, 7vw, 36px)", height: "clamp(28px, 7vw, 36px)", borderRadius: "50%", background: "rgba(255,255,255,.2)", border: "none", color: "white", fontSize: "clamp(14px, 3.5vw, 18px)", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", backdropFilter: "blur(4px)", transition: "background .2s" }} onMouseEnter={e => e.currentTarget.style.background = "rgba(255,255,255,.4)"} onMouseLeave={e => e.currentTarget.style.background = "rgba(255,255,255,.2)"}>X</button>
                            </div>
                            <div style={{ position: "absolute", bottom: "clamp(-24px, -6vw, -40px)", left: "clamp(20px, 5vw, 40px)", width: "clamp(50px, 14vw, 80px)", height: "clamp(50px, 14vw, 80px)", borderRadius: "clamp(12px, 3vw, 20px)", background: "transparent", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "clamp(30px, 8vw, 50px)", overflow: "hidden", border: "3px solid #FFFEF9", boxShadow: "0 8px 24px rgba(28,58,43,.15)" }}>
                                <img src="/founder.png" alt="Ubay Rahmat H." style={{ width: "100%", height: "100%", objectFit: "cover", objectPosition: "top" }} onError={(e) => { e.currentTarget.style.display = 'none'; e.currentTarget.parentElement!.innerHTML = '<div style="width:100%;height:100%;background:#4FBF7E;display:flex;align-items:center;justify-content:center;color:white;font-size:40px;"><CheckCircle size={40} /></div>'; }} />
                            </div>
                        </div>

                        {/* Body */}
                        <div style={{ padding: "clamp(28px, 7vw, 50px) clamp(16px, 4vw, 40px) clamp(20px, 5vw, 40px)" }}>
                            <div style={{ fontSize: "clamp(9px, 2.5vw, 11px)", fontWeight: 700, letterSpacing: ".15em", textTransform: "uppercase", color: "#2F8F4E", marginBottom: "clamp(4px, 1.5vw, 8px)" }}>The Origin Story</div>
                            <h3 className="fnt" style={{ fontSize: "clamp(20px, 5vw, 32px)", fontWeight: 300, color: "#1C3A2B", lineHeight: 1.2, letterSpacing: "-.02em", marginBottom: "clamp(14px, 4vw, 24px)" }}>Dari Pelosok Garut Menuju Masa Depan</h3>

                            <div style={{ fontSize: "clamp(11px, 3vw, 14px)", lineHeight: 1.7, color: "#5A4A40", display: "flex", flexDirection: "column", gap: "clamp(10px, 3vw, 16px)" }}>
                                <p style={{ margin: 0 }}>Semua berawal dari satu pertanyaan sederhana: kenapa potensi lokal yang begitu besar justru tertinggal oleh perkembangan zaman?</p>
                                <p style={{ margin: 0 }}>Kami tidak menunggu jawaban. Kami mulai membangun.</p>
                                <p style={{ margin: 0 }}><strong>Ciburial Eco-Digital</strong> hadir sebagai jembatan antara kearifan lokal dan teknologi modern — membawa sistem yang transparan, terstruktur, dan berdampak nyata bagi masyarakat.</p>
                                <p style={{ margin: 0 }}>Kami percaya masa depan tidak hanya milik kota besar. Masa depan bisa dibangun dari desa — oleh mereka yang berani memulai.</p>
                                <div style={{ background: "linear-gradient(135deg,rgba(47,143,78,.08),rgba(47,143,78,.03))", padding: "clamp(10px, 3vw, 16px) clamp(12px, 3.5vw, 20px)", borderRadius: "clamp(8px, 2vw, 12px)", borderLeft: "3px solid #2F8F4E", fontStyle: "italic", fontWeight: 500, color: "#1C3A2B", marginTop: "clamp(4px, 1.5vw, 8px)" }}>
                                    &ldquo;Start small. Build real. Create impact.&rdquo;
                                </div>
                            </div>

                            <div style={{ marginTop: "clamp(16px, 5vw, 32px)", display: "flex", alignItems: "center", gap: "clamp(10px, 3vw, 16px)", borderTop: "1px solid rgba(47,143,78,.1)", paddingTop: "clamp(14px, 4vw, 24px)" }}>
                                <div>
                                    <div style={{ fontSize: "clamp(12px, 3.5vw, 15px)", fontWeight: 800, color: "#1A1410" }}>Ubay Rahmat H.</div>
                                    <div style={{ fontSize: "clamp(9px, 2.5vw, 11px)", fontWeight: 700, color: "#2F8F4E", letterSpacing: ".05em", textTransform: "uppercase", marginTop: 2 }}>Founder & Builder</div>
                                </div>
                                <div style={{ marginLeft: "auto" }}>
                                    <span className="fnt" style={{ fontSize: "clamp(20px, 6vw, 32px)", color: "rgba(184,148,63,.4)", fontStyle: "italic", fontWeight: 200, letterSpacing: "-.02em" }}>Ciburial</span>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            <style>{`
 @keyframes storyFadeIn { from { opacity: 0 } to { opacity: 1 } }
 @keyframes storySlideUp { from { opacity: 0; transform: translateY(30px) scale(0.95); } to { opacity: 1; transform: translateY(0) scale(1); } }
 `}</style>
        </div>
    );
}
