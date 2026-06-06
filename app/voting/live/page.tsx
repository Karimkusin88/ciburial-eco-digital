"use client";
import { useState, useEffect, useCallback } from "react";
import { 
  Signal, Vote, Scale, Trophy, Inbox, User, 
  Leaf, CheckCircle, Smartphone, Mail, Lock, 
  Megaphone, Clock
} from "lucide-react";
import { supabase, isSupabaseReady } from "@/lib/supabase";

interface Voting { id: string; judul: string; deskripsi: string; status: string; }
interface Pilihan { id: string; voting_id: string; teks: string; jumlah_vote: number; }

function parseJudul(j: string) {
  const m = j?.match(/^\[(PEMILU|MUSYAWARAH)\]\s*(.+)/);
  return { tipe: m?.[1] || "PEMILU", text: m?.[2] || j };
}
function parseKandidat(teks: string) {
  const [nama, foto] = (teks || "").split("|||");
  return { nama: nama?.trim(), foto: foto?.trim() };
}
function pct(votes: number, total: number) {
  return total > 0 ? Math.round((votes / total) * 100) : 0;
}

const CANDS = ["#1C3A2B", "#B8943F", "#2D6B8C", "#8B2020", "#5A2080", "#1A5A3A"];

export default function LiveVotingBroadcast() {
  const [votings, setVotings] = useState<Voting[]>([]);
  const [pilihan, setPilihan] = useState<Record<string, Pilihan[]>>({});
  const [totalDPT, setTotalDPT] = useState(350);
  const [lastUpdate, setLast] = useState("");
  const [live, setLive] = useState(false);
  const [activeIdx, setActiveIdx] = useState(0);

  // Live clock
  const [now, setNow] = useState(new Date());
  useEffect(() => {
    const t = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(t);
  }, []);
  const clockStr = now.toLocaleTimeString("id-ID", { hour: "2-digit", minute: "2-digit", second: "2-digit" });
  const dateStr = now.toLocaleDateString("id-ID", { weekday: "long", day: "numeric", month: "long", year: "numeric" });

  const refresh = useCallback(async () => {
    if (!isSupabaseReady()) return;
    try {
      const [vsRes, dptRes] = await Promise.all([
        supabase.from("voting").select("*").eq("status", "aktif").order("created_at"),
        supabase.from("anggota_kk").select("*", { count: "exact", head: true }),
      ]);
      const vs = vsRes.data || [];
      if (!vs.length) { setVotings([]); setLive(true); setLast(new Date().toLocaleTimeString("id-ID")); return; }
      setVotings(vs);
      if (dptRes.count) setTotalDPT(dptRes.count);

      const allPilihan: Record<string, Pilihan[]> = {};
      await Promise.all(vs.map(async (v: Voting) => {
        const { data } = await supabase.from("pilihan_voting").select("*").eq("voting_id", v.id);
        allPilihan[v.id] = (data || []).sort((a: Pilihan, b: Pilihan) => b.jumlah_vote - a.jumlah_vote);
      }));
      setPilihan(allPilihan);
      setLive(true);
      setLast(new Date().toLocaleTimeString("id-ID"));
    } catch (e) {}
  }, []);

  useEffect(() => {
    refresh();
    const t = setInterval(refresh, 5000); // Polling lebih cepat
    return () => clearInterval(t);
  }, [refresh]);

  useEffect(() => {
    if (votings.length <= 1) return;
    const t = setInterval(() => setActiveIdx(i => (i + 1) % votings.length), 20000);
    return () => clearInterval(t);
  }, [votings.length]);

  const active = votings[activeIdx];
  const aktifPilihan = active ? (pilihan[active.id] || []) : [];
  const totalVotes = aktifPilihan.reduce((s, p) => s + (p.jumlah_vote || 0), 0);
  const parsed = active ? parseJudul(active.judul) : null;
  const isPemilu = parsed?.tipe === "PEMILU";
  const partisipasi = pct(totalVotes, totalDPT);
  const leading = aktifPilihan[0];

  return (
    <div className="min-h-screen bg-[var(--cr)] text-[var(--tp)] font-sans flex flex-col relative overflow-hidden">
      {/* ─── CINEMATIC BACKGROUND (HEROIC) ─── */}
      <div className="fixed inset-0 opacity-[0.03] bg-[radial-gradient(circle,_var(--fo)_1px,_transparent_1px)] bg-[size:28px_28px] pointer-events-none z-0" />
      <div className="fixed inset-0 bg-[radial-gradient(ellipse_at_80%_10%,_rgba(184,148,63,0.1)_0%,_transparent_55%),_radial-gradient(ellipse_at_10%_90%,_rgba(47,143,78,0.08)_0%,_transparent_55%)] pointer-events-none z-0" />
      <div className="fixed inset-0 bg-gradient-to-b from-[var(--fo)]/5 to-transparent pointer-events-none z-0" />

      {/* ─── HEADER KPU (GLASSMORPHISM) ─── */}
      <header className="relative z-10 bg-[var(--fo)] text-white shadow-[0_12px_40px_rgba(28,58,43,0.3)] border-b border-[var(--go)]/20">
        <div className="flex flex-col md:flex-row items-center justify-between min-h-[100px]">
          
          {/* Left: Live Badge */}
          <div className="bg-red-600 self-stretch px-8 md:px-12 flex items-center justify-center gap-4 relative overflow-hidden group min-w-[200px]">
            <div className="absolute inset-0 bg-red-500 opacity-0 group-hover:opacity-20 transition-opacity" />
            <div className="w-4 h-4 rounded-full bg-white animate-pulse shadow-[0_0_15px_rgba(255,255,255,0.9)]" />
            <span className="font-black text-xl md:text-2xl tracking-[0.25em] relative z-10">LIVE</span>
          </div>

          {/* Center: Title Area (Expanded & Centered) */}
          <div className="flex-1 py-6 px-4 md:px-12 flex flex-col items-center text-center justify-center bg-gradient-to-b from-transparent to-black/5">
            <div className="text-xs md:text-sm text-[var(--gl)] font-extrabold tracking-[0.3em] uppercase mb-2 flex items-center justify-center gap-2">
              <ShieldIcon /> KOMISI PEMILIHAN KAMPUNG (KPK)
            </div>
            <h1 className="fnt text-3xl md:text-[40px] font-black leading-none bg-gradient-to-br from-white to-gray-300 bg-clip-text text-transparent tracking-wide">
              Kampung Ciburial RW 08
            </h1>
          </div>

          {/* Right: Digital Clock */}
          <div className="bg-black/20 self-stretch px-8 md:px-12 flex flex-col justify-center items-center md:items-end border-t md:border-t-0 md:border-l border-white/10 min-w-[280px]">
            <div className="text-4xl md:text-[44px] font-black font-mono text-[var(--gl)] tracking-widest leading-none drop-shadow-[0_0_20px_rgba(212,172,90,0.4)]">
              {clockStr}
            </div>
            <div className="text-[13px] text-white/60 font-bold uppercase tracking-[0.2em] mt-2">
              {dateStr}
            </div>
          </div>
        </div>

        {/* Slim Status Bar */}
        <div className="bg-black/30 backdrop-blur-md px-6 md:px-10 py-2.5 flex flex-wrap items-center gap-x-6 gap-y-2 text-xs">
          <div className="flex items-center gap-2.5">
            <div className={`w-2 h-2 rounded-full ${live ? 'bg-green-400 animate-pulse shadow-[0_0_8px_#4ade80]' : 'bg-gray-400'}`} />
            <span className={`font-bold tracking-widest ${live ? 'text-green-400' : 'text-gray-400'}`}>
              {live ? 'SISTEM AKTIF & TERENKRIPSI' : 'MENGHUBUNGKAN...'}
            </span>
          </div>
          <span className="text-white/40 font-medium">Update: {lastUpdate}</span>
          <span className="text-white/40 hidden md:inline">•</span>
          <span className="text-white/40 font-medium flex items-center gap-1.5">
            <Clock size={12} /> Auto-sync 5s
          </span>

          {votings.length > 1 && (
            <div className="ml-auto flex gap-2 overflow-x-auto pb-1 md:pb-0 scrollbar-hide">
              {votings.map((v, i) => {
                const p = parseJudul(v.judul);
                return (
                  <button 
                    key={v.id} 
                    onClick={() => setActiveIdx(i)} 
                    className={`px-3.5 py-1.5 rounded-md text-[10px] font-extrabold tracking-wider whitespace-nowrap transition-all duration-300 border ${
                      i === activeIdx 
                        ? 'bg-[var(--gl)] text-[var(--fo)] border-[var(--gl)] shadow-[0_0_15px_rgba(212,172,90,0.3)]' 
                        : 'bg-transparent text-white/60 border-white/20 hover:bg-white/5 hover:text-white'
                    }`}
                  >
                    {p.text}
                  </button>
                );
              })}
            </div>
          )}
        </div>
      </header>

      {/* ─── MAIN CONTENT ─── */}
      <main className="flex-1 relative z-1 p-4 md:p-8 lg:p-10 max-w-[1600px] mx-auto w-full">
        {!active && live && (
          <div className="flex flex-col items-center justify-center min-h-[60vh] animate-masuk">
            <div className="w-32 h-32 rounded-full bg-[var(--cd)] border-2 border-dashed border-[var(--fo)]/20 flex items-center justify-center text-[var(--fm)] mb-8 relative">
              <div className="absolute inset-0 rounded-full border-4 border-[var(--accent)] border-t-transparent animate-spin opacity-20" />
              <Signal size={56} className="animate-pulse" />
            </div>
            <h2 className="fnt text-4xl md:text-5xl lg:text-6xl font-light text-[var(--fm)] text-center max-w-2xl leading-tight">
              Standby — <em className="text-[var(--go)] font-normal">Belum ada bilik suara yang aktif saat ini.</em>
            </h2>
          </div>
        )}

        {active && (
          <div className="animate-masuk">
            {/* META DASHBOARD (HEROIC) */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6 mb-8 md:mb-12">
              {/* Card 1: Info Agenda */}
              <div className="lg:col-span-2 relative overflow-hidden rounded-2xl p-6 md:p-8 shadow-[0_8px_30px_rgba(28,58,43,0.15)] group">
                <div className="absolute inset-0 bg-gradient-to-br from-[var(--fo)] to-[var(--accent-dark)] transition-transform duration-700 group-hover:scale-105" />
                <div className="absolute inset-0 bg-[url('/padi.jpeg')] bg-cover bg-center opacity-10 mix-blend-overlay" />
                <div className="relative z-10 flex flex-col h-full justify-center">
                  <div className="inline-flex items-center gap-2 bg-black/30 backdrop-blur-sm rounded-full px-4 py-1.5 text-[10px] md:text-xs font-black text-[var(--gl)] tracking-[0.15em] mb-4 w-fit border border-white/10">
                    {isPemilu ? <><Vote size={14}/> PEMILIHAN DIGITAL</> : <><Scale size={14}/> MUSYAWARAH DIGITAL</>}
                  </div>
                  <h2 className="fnt text-3xl md:text-4xl lg:text-[42px] font-black text-white leading-[1.1] drop-shadow-md">
                    {parsed?.text}
                  </h2>
                  {active.deskripsi && (
                    <p className="mt-3 text-sm md:text-base text-white/70 font-medium max-w-xl">
                      {active.deskripsi}
                    </p>
                  )}
                </div>
              </div>

              {/* Card 2: Suara Masuk */}
              <div className="bg-white rounded-2xl p-6 md:p-8 border border-[var(--cr)] shadow-[0_8px_25px_rgba(28,58,43,0.06)] flex flex-col items-center justify-center text-center relative overflow-hidden group">
                <div className="absolute top-0 right-0 w-32 h-32 bg-[var(--fo)]/5 rounded-full blur-3xl -mr-10 -mt-10 transition-transform group-hover:scale-150" />
                <div className="text-[10px] md:text-xs font-black text-[var(--ts)] tracking-[0.2em] mb-2 relative z-10">SUARA MASUK</div>
                <div className="fnt text-[56px] md:text-[72px] lg:text-[84px] font-black text-[var(--fo)] leading-none tracking-tight relative z-10 drop-shadow-sm">
                  {totalVotes.toLocaleString("id-ID")}
                </div>
                <div className="text-xs md:text-sm text-[var(--ts)] font-bold mt-2 relative z-10 bg-[var(--cr)] px-3 py-1 rounded-full">
                  dari ±{totalDPT} DPT
                </div>
              </div>

              {/* Card 3: Partisipasi / Leading */}
              {isPemilu && leading ? (
                <div className="bg-gradient-to-br from-[var(--go)] to-[var(--ea)] rounded-2xl p-6 md:p-8 shadow-[0_12px_35px_rgba(184,148,63,0.25)] flex flex-col items-center justify-center text-center relative overflow-hidden group">
                  <div className="absolute inset-0 bg-[url('/anyaman-bambu.jpg')] bg-cover opacity-10 mix-blend-overlay transition-transform duration-700 group-hover:scale-110" />
                  <div className="absolute -right-4 -bottom-4 opacity-20 transform rotate-12 transition-transform duration-500 group-hover:rotate-0">
                    <Trophy size={120} color="#fff" />
                  </div>
                  <div className="text-[10px] md:text-xs font-black text-white/80 tracking-[0.2em] mb-2 relative z-10">KANDIDAT UNGGUL</div>
                  <div className="fnt text-xl md:text-2xl font-black text-white leading-tight relative z-10 drop-shadow-md px-4">
                    {parseKandidat(leading.teks).nama}
                  </div>
                  <div className="fnt text-4xl md:text-5xl lg:text-[56px] font-black text-[var(--cr)] mt-1 relative z-10 drop-shadow-[0_2px_10px_rgba(0,0,0,0.3)]">
                    {pct(leading.jumlah_vote, totalVotes)}%
                  </div>
                </div>
              ) : (
                <div className="bg-white rounded-2xl p-6 md:p-8 border border-[var(--cr)] shadow-[0_8px_25px_rgba(28,58,43,0.06)] flex flex-col items-center justify-center text-center relative overflow-hidden">
                   <div className="text-[10px] md:text-xs font-black text-[var(--ts)] tracking-[0.2em] mb-2">PARTISIPASI</div>
                   <div className={`fnt text-[56px] md:text-[72px] lg:text-[84px] font-black leading-none tracking-tight drop-shadow-sm ${partisipasi >= 50 ? 'text-[var(--accent)]' : 'text-[var(--go)]'}`}>
                     {partisipasi}%
                   </div>
                   <div className="w-4/5 h-2 bg-[var(--cr)] rounded-full mt-4 overflow-hidden shadow-inner">
                     <div 
                       className={`h-full rounded-full transition-all duration-1000 ease-out relative overflow-hidden ${partisipasi >= 50 ? 'bg-[var(--accent)]' : 'bg-[var(--go)]'}`} 
                       style={{ width: `${partisipasi}%` }}
                     >
                        <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/40 to-transparent -translate-x-full animate-[shimmer_2s_infinite]" />
                     </div>
                   </div>
                </div>
              )}
            </div>

            {/* ══ KANDIDAT & HASIL VOTING (HEROIC) ══ */}
            {aktifPilihan.length === 0 ? (
              <div className="text-center py-20 bg-white/50 backdrop-blur-sm rounded-3xl border-2 border-dashed border-[var(--fo)]/10 text-[var(--ts)] text-xl font-medium shadow-sm">
                <Inbox size={48} className="mx-auto mb-4 opacity-50" />
                ⏳ Menunggu suara masuk dari bilik TPS...
              </div>
            ) : isPemilu ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 md:gap-8">
                {aktifPilihan.map((p, i) => {
                  const { nama, foto } = parseKandidat(p.teks);
                  const perc = pct(p.jumlah_vote, totalVotes);
                  const isGolput = nama.toLowerCase().includes("golput") || nama.toLowerCase().includes("kosong");
                  const isLeading = i === 0 && p.jumlah_vote > 0;
                  const col = CANDS[i % CANDS.length];

                  return (
                    <div 
                      key={p.id} 
                      className={`group relative bg-black rounded-3xl overflow-hidden transition-all duration-500 hover:-translate-y-2 ${
                        isLeading 
                          ? 'shadow-[0_20px_50px_rgba(47,143,78,0.3),_0_0_0_4px_var(--accent)]' 
                          : 'shadow-[0_10px_30px_rgba(0,0,0,0.15)] hover:shadow-[0_20px_40px_rgba(0,0,0,0.2)]'
                      }`}
                    >
                      {/* Rank Badge */}
                      <div className="absolute top-5 left-5 z-20 bg-white/90 backdrop-blur-md text-black px-3 py-1.5 rounded-xl text-xs font-black tracking-wider shadow-lg flex items-center gap-2">
                        {isLeading ? <Trophy size={14} className="text-[var(--go)]" /> : `#${i+1}`}
                        NOMOR {i + 1}
                      </div>

                      {isLeading && (
                        <div className="absolute top-5 right-5 z-20 bg-red-600 text-white px-3 py-1.5 rounded-full text-[10px] font-black tracking-[0.15em] shadow-[0_4px_15px_rgba(220,38,38,0.5)] animate-pulse">
                          TERTINGGI
                        </div>
                      )}

                      {/* Photo Area */}
                      <div className="relative h-[380px] md:h-[450px] lg:h-[500px] w-full overflow-hidden bg-[var(--cr)]">
                        {foto ? (
                          <img 
                            src={foto} 
                            alt={nama} 
                            className="w-full h-full object-cover object-top transition-transform duration-700 group-hover:scale-105" 
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center text-[var(--fo)] opacity-10 transition-transform duration-700 group-hover:scale-110">
                            {isGolput ? <Inbox size={140} /> : <User size={140} />}
                          </div>
                        )}

                        {/* Grand Gradient Overlay */}
                        <div className="absolute inset-0 bg-gradient-to-t from-black via-black/60 to-transparent opacity-90 transition-opacity duration-300 group-hover:opacity-100" />
                        
                        {/* Content Overlay */}
                        <div className="absolute bottom-0 left-0 right-0 p-6 md:p-8 z-10 flex flex-col justify-end">
                          <h3 className="fnt text-2xl md:text-3xl font-black text-white leading-[1.1] mb-4 drop-shadow-[0_2px_10px_rgba(0,0,0,0.8)]">
                            {nama}
                          </h3>

                          <div className="flex items-baseline gap-1.5 mb-4">
                            <span 
                              className="fnt text-[56px] md:text-[72px] font-black leading-none drop-shadow-[0_0_20px_rgba(255,255,255,0.2)]"
                              style={{ color: col }}
                            >
                              {perc}
                            </span>
                            <span className="text-2xl md:text-3xl font-bold" style={{ color: col }}>%</span>
                          </div>

                          {/* Progress Bar Glow */}
                          <div className="h-2.5 w-full bg-white/10 rounded-full overflow-hidden mb-3 shadow-inner">
                            <div 
                              className="h-full rounded-full relative overflow-hidden transition-all duration-1000 cubic-bezier(0.22, 1, 0.36, 1)"
                              style={{ width: `${perc}%`, backgroundColor: col, boxShadow: `0 0 15px ${col}` }}
                            >
                              <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/40 to-transparent -translate-x-full animate-[shimmer_2s_infinite]" />
                            </div>
                          </div>

                          <div className="text-sm font-bold text-white/60 tracking-wide">
                            {p.jumlah_vote.toLocaleString("id-ID")} SUARA SAH
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              /* MUSYAWARAH LIST (Premium Bars) */
              <div className="flex flex-col gap-5 max-w-4xl mx-auto">
                {aktifPilihan.map((p) => {
                  const { nama } = parseKandidat(p.teks);
                  const perc = pct(p.jumlah_vote, totalVotes);
                  const isSetuju = nama.toLowerCase().includes("setuju") && !nama.toLowerCase().includes("tidak");
                  const isTolak = nama.toLowerCase().includes("tidak") || nama.toLowerCase().includes("tolak");
                  const col = isSetuju ? "var(--accent)" : isTolak ? "#ef4444" : "var(--go)";
                  const isWinner = perc > 50;

                  return (
                    <div 
                      key={p.id} 
                      className={`bg-white rounded-2xl p-6 md:p-8 relative overflow-hidden transition-all duration-300 hover:-translate-y-1 ${
                        isWinner 
                          ? 'border-2 shadow-[0_12px_30px_rgba(28,58,43,0.1)]' 
                          : 'border border-[var(--bo)] shadow-[0_4px_15px_rgba(0,0,0,0.03)]'
                      }`}
                      style={{ borderColor: isWinner ? col : 'var(--bo)' }}
                    >
                      {/* Status Accent Line */}
                      <div className="absolute left-0 top-0 bottom-0 w-2" style={{ backgroundColor: col }} />
                      
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-5 pl-4 relative z-10">
                        <span className="fnt text-2xl md:text-3xl font-black text-[var(--tp)] mb-2 sm:mb-0">
                          {nama}
                        </span>
                        <div className="text-left sm:text-right">
                          <div className="fnt text-4xl md:text-[48px] font-black leading-none mb-1" style={{ color: col }}>
                            {perc}%
                          </div>
                          <div className="text-xs font-black tracking-widest text-[var(--ts)] bg-[var(--cr)] px-3 py-1 rounded-md inline-block">
                            {p.jumlah_vote} SUARA
                          </div>
                        </div>
                      </div>
                      
                      {/* Premium Progress */}
                      <div className="ml-4 h-3.5 bg-[var(--cr)] rounded-full overflow-hidden shadow-inner relative z-10">
                        <div 
                          className="h-full rounded-full relative overflow-hidden transition-all duration-1000"
                          style={{ width: `${perc}%`, backgroundColor: col }}
                        >
                          <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/30 to-transparent -translate-x-full animate-[shimmer_2.5s_infinite]" />
                        </div>
                      </div>
                      
                      {/* Background highlight for winner */}
                      {isWinner && (
                        <div className="absolute right-0 top-0 bottom-0 w-1/3 bg-gradient-to-l from-current to-transparent opacity-5 pointer-events-none" style={{ color: col }} />
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}
      </main>

      {/* ─── PREMIUM TICKER ─── */}
      <footer className="relative z-20 bg-[var(--fo)] border-t-[3px] border-[var(--gl)] overflow-hidden h-14 flex items-stretch shadow-[0_-8px_20px_rgba(0,0,0,0.2)]">
        {/* Ticker Label */}
        <div className="bg-gradient-to-r from-[var(--go)] to-[var(--gl)] text-[var(--fo)] font-black px-6 md:px-8 flex items-center text-xs md:text-sm tracking-[0.15em] whitespace-nowrap z-10 shadow-[4px_0_15px_rgba(0,0,0,0.4)] gap-2.5 uppercase relative">
          <div className="absolute right-0 top-0 bottom-0 w-8 bg-gradient-to-l from-black/20 to-transparent" />
          <Megaphone size={18} className="animate-pulse" />
          <span className="hidden sm:inline">INFO</span> KPK
        </div>
        
        {/* Ticker Scroll */}
        <div className="flex-1 overflow-hidden flex items-center bg-black/20">
          <div className="whitespace-nowrap text-sm md:text-[15px] font-bold text-white/90 flex items-center gap-12 animate-[ticker_40s_linear_infinite] hover:[animation-play-state:paused]">
            <span className="flex items-center gap-3 ml-12">
              <Leaf size={16} className="text-[var(--gl)]" /> Pemilihan Digital Kampung Ciburial sedang berlangsung — Gunakan Kartu Warga NFC Anda di Bilik Suara.
            </span>
            <span className="flex items-center gap-3">
              <CheckCircle size={16} className="text-green-400" /> Suara Anda dijamin rahasia, langsung, dan bebas dari manipulasi — 100% Terenkripsi ke Supabase.
            </span>
            <span className="flex items-center gap-3">
              <Smartphone size={16} className="text-[var(--gl)]" /> Belum punya Kartu Warga Pintar? Hubungi RT/RW atau kunjungi Balai Desa.
            </span>
            <span className="flex items-center gap-3">
              <Lock size={16} className="text-[var(--gl)]" /> Satu NIK Satu Suara — Sistem cerdas otomatis mencegah pencoblosan ganda (Double Voting).
            </span>
            <span className="flex items-center gap-3">
              <Trophy size={16} className="text-[var(--gl)]" /> Hasil Live Result ini bersifat resmi, real-time, dan menjadi keputusan final musyawarah.
            </span>
          </div>
        </div>
      </footer>

      {/* Inline styles for custom animations that Tailwind doesn't have by default */}
      <style dangerouslySetInnerHTML={{__html: `
        @keyframes shimmer {
          100% { transform: translateX(100%); }
        }
        @keyframes ticker {
          0% { transform: translateX(0); }
          100% { transform: translateX(-50%); }
        }
        /* Custom scrollbar hiding for the horizontal tab buttons */
        .scrollbar-hide::-webkit-scrollbar { display: none; }
        .scrollbar-hide { -ms-overflow-style: none; scrollbar-width: none; }
      `}} />
    </div>
  );
}

function ShieldIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>
    </svg>
  );
}