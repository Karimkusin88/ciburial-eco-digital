"use client";
import { useState, useRef } from "react";
import { 
  Smartphone, Mail, Lock, User, CheckCircle, XCircle, 
  ArrowLeft, LogIn, UserPlus, Sparkles, Home, Globe, 
  Scan, Info, AlertCircle, Leaf, PartyPopper
} from "lucide-react";
import { supabase, isSupabaseReady } from "@/lib/supabase";

interface AuthUser { id: string; nama: string; kk_id: string; saldo_poin: number; nfc_id?: string; tipe: "warga" | "external" }
interface AuthProps { onLogin: (u: AuthUser) => void; showToast: (m: string, ok?: boolean) => void }

export function AuthScreen({ onLogin, showToast }: AuthProps) {
  const [mode, setMode] = useState<"landing" | "email-login" | "email-register">("landing");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [nama, setNama] = useState("");
  const [scanning, setScanning] = useState(false);
  const [loading, setLoading] = useState(false);
  const nfcRef = useRef<any>(null);

  // ── NFC untuk Warga Kampung ──
  async function startNFC() {
    if (!("NDEFReader" in window)) return showToast("NFC butuh Chrome Android ya", false);
    try {
      const ndef = new (window as any).NDEFReader();
      nfcRef.current = ndef;
      await ndef.scan();
      setScanning(true);
      ndef.addEventListener("reading", async ({ serialNumber }: any) => {
        const uid = serialNumber.replace(/:/g, "").toUpperCase();
        stopNFC();
        if (!isSupabaseReady()) return showToast("Punten, sistem belum siap", false);
        const { data } = await supabase.from("anggota_kk").select("id,nama,kk_id,saldo_poin,nfc_id").eq("nfc_id", uid).single();
        if (data) {
          onLogin({ ...data, tipe: "warga" } as AuthUser);
          showToast(`Wilujeng sumping, ${data.nama}!`);
        } else showToast("Kartu tidak terdaftar di sistem desa!", false);
      });
    } catch { showToast("Gagal aktifkan NFC", false); setScanning(false); }
  }

  function stopNFC() { try { nfcRef.current?.stop?.(); } catch {} setScanning(false); }

  // ── Email + Password untuk User Luar ──
  async function handleEmailLogin() {
    if (!email || !password) return showToast("Isi email dan password dulu ya", false);
    if (!isSupabaseReady()) return showToast("Punten, sistem belum siap", false);
    setLoading(true);
    const { data, error } = await supabase.from("user_learning").select("*").eq("email", email.toLowerCase().trim()).single();
    if (error || !data) { setLoading(false); return showToast("Email tidak ditemukan. Silakan daftar dulu!", false); }
    if (data.password !== password) { setLoading(false); return showToast("Password salah!", false); }
    onLogin({ id: data.id, nama: data.nama, kk_id: "", saldo_poin: data.saldo_poin || 0, tipe: "external" });
    showToast(`Welcome, ${data.nama}!`);
    setLoading(false);
  }

  async function handleEmailRegister() {
    if (!nama || !email || !password) return showToast("Semua field harus diisi ya", false);
    if (password.length < 6) return showToast("Password minimal 6 karakter", false);
    if (!isSupabaseReady()) return showToast("Punten, sistem belum siap", false);
    setLoading(true);
    const { data: exist } = await supabase.from("user_learning").select("id").eq("email", email.toLowerCase().trim()).single();
    if (exist) { setLoading(false); return showToast("Email sudah terdaftar! Silakan login.", false); }
    const { data, error } = await supabase.from("user_learning").insert({ nama, email: email.toLowerCase().trim(), password }).select().single();
    if (error) { setLoading(false); return showToast("Gagal daftar: " + error.message, false); }
    if (data) {
      onLogin({ id: data.id, nama: data.nama, kk_id: "", saldo_poin: 0, tipe: "external" });
      showToast(`Selamat bergabung, ${data.nama}!`);
    }
    setLoading(false);
  }

  // ── Email Login Form ──
  if (mode === "email-login") return (
    <div style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", minHeight: "80vh", padding: "clamp(20px, 4vw, 32px) 20px", position: "relative", zIndex: 1 }}>
      <div className="lh-card" style={{ padding: "clamp(24px, 5vw, 40px) clamp(20px, 4vw, 36px)", maxWidth: 420, width: "100%", animation: "fadeInUp .5s ease both" }}>
        <div style={{ textAlign: "center", marginBottom: 28 }}>
          <div style={{ color: "var(--fo)", marginBottom: 12, display: "flex", justifyContent: "center" }}><Mail size={44} /></div>
          <h2 className="fnt" style={{ fontSize: 24, fontWeight: 600, color: "var(--fo)", marginBottom: 6 }}>Login dengan Email</h2>
          <p style={{ fontSize: 13, color: "var(--tm)", lineHeight: 1.5 }}>Untuk pengguna dari luar Kampung Ciburial</p>
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
          <div>
            <label style={{ fontSize: 11, fontWeight: 700, color: "var(--ts)", letterSpacing: ".06em", textTransform: "uppercase", marginBottom: 6, display: "block" }}>EMAIL</label>
            <input className="lh-input" type="email" placeholder="nama@gmail.com" value={email} onChange={e => setEmail(e.target.value)} />
          </div>
          <div>
            <label style={{ fontSize: 11, fontWeight: 700, color: "var(--ts)", letterSpacing: ".06em", textTransform: "uppercase", marginBottom: 6, display: "block" }}>PASSWORD</label>
            <input className="lh-input" type="password" placeholder="Masukkan password" value={password} onChange={e => setPassword(e.target.value)} onKeyDown={e => e.key === "Enter" && handleEmailLogin()} />
          </div>
          <button className="lh-btn lh-btn-primary" onClick={handleEmailLogin} disabled={loading} style={{ marginTop: 8, width: "100%", display: "flex", alignItems: "center", justifyContent: "center", gap: 8 }}>
            {loading ? "Memproses..." : <><LogIn size={18}/> Masuk</>}
          </button>
        </div>

        <div className="lh-divider" />
        <p style={{ textAlign: "center", fontSize: 13, color: "var(--tm)" }}>
          Belum punya akun?{" "}
          <button onClick={() => { setMode("email-register"); setEmail(""); setPassword(""); setNama(""); }} style={{ color: "var(--accent)", fontWeight: 700, background: "none", border: "none", cursor: "pointer", fontFamily: "inherit", fontSize: 13 }}>Daftar sekarang</button>
        </p>
        <button onClick={() => setMode("landing")} className="lh-btn" style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 8, margin: "16px auto 0", padding: "8px 20px", background: "rgba(47,143,78,.06)", color: "var(--ts)", fontSize: 12, fontWeight: 600 }}><ArrowLeft size={14}/> Kembali</button>
      </div>
    </div>
  );

  // ── Email Register Form ──
  if (mode === "email-register") return (
    <div style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", minHeight: "80vh", padding: "clamp(20px, 4vw, 32px) 20px", position: "relative", zIndex: 1 }}>
      <div className="lh-card" style={{ padding: "clamp(24px, 5vw, 40px) clamp(20px, 4vw, 36px)", maxWidth: 420, width: "100%", animation: "fadeInUp .5s ease both" }}>
        <div style={{ textAlign: "center", marginBottom: 28 }}>
          <div style={{ color: "var(--fo)", marginBottom: 12, display: "flex", justifyContent: "center" }}><Sparkles size={44} /></div>
          <h2 className="fnt" style={{ fontSize: 24, fontWeight: 600, color: "var(--fo)", marginBottom: 6 }}>Buat Akun Baru</h2>
          <p style={{ fontSize: 13, color: "var(--tm)", lineHeight: 1.5 }}>Daftar gratis untuk akses Learning Hub</p>
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
          <div>
            <label style={{ fontSize: 11, fontWeight: 700, color: "var(--ts)", letterSpacing: ".06em", textTransform: "uppercase", marginBottom: 6, display: "block" }}>NAMA LENGKAP</label>
            <input className="lh-input" type="text" placeholder="Masukkan nama lengkap" value={nama} onChange={e => setNama(e.target.value)} />
          </div>
          <div>
            <label style={{ fontSize: 11, fontWeight: 700, color: "var(--ts)", letterSpacing: ".06em", textTransform: "uppercase", marginBottom: 6, display: "block" }}>EMAIL</label>
            <input className="lh-input" type="email" placeholder="nama@gmail.com" value={email} onChange={e => setEmail(e.target.value)} />
          </div>
          <div>
            <label style={{ fontSize: 11, fontWeight: 700, color: "var(--ts)", letterSpacing: ".06em", textTransform: "uppercase", marginBottom: 6, display: "block" }}>PASSWORD</label>
            <input className="lh-input" type="password" placeholder="Minimal 6 karakter" value={password} onChange={e => setPassword(e.target.value)} onKeyDown={e => e.key === "Enter" && handleEmailRegister()} />
          </div>
          <button className="lh-btn lh-btn-primary" onClick={handleEmailRegister} disabled={loading} style={{ marginTop: 8, width: "100%", display: "flex", alignItems: "center", justifyContent: "center", gap: 8 }}>
            {loading ? "Mendaftar..." : <><UserPlus size={18}/> Daftar & Masuk</>}
          </button>
        </div>

        <div className="lh-divider" />
        <p style={{ textAlign: "center", fontSize: 13, color: "var(--tm)" }}>
          Sudah punya akun?{" "}
          <button onClick={() => { setMode("email-login"); setEmail(""); setPassword(""); }} style={{ color: "var(--accent)", fontWeight: 700, background: "none", border: "none", cursor: "pointer", fontFamily: "inherit", fontSize: 13 }}>Login di sini</button>
        </p>
        <button onClick={() => setMode("landing")} className="lh-btn" style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 8, margin: "16px auto 0", padding: "8px 20px", background: "rgba(47,143,78,.06)", color: "var(--ts)", fontSize: 12, fontWeight: 600 }}><ArrowLeft size={14}/> Kembali</button>
      </div>
    </div>
  );

  // ── Landing — Pilih metode ──
  return (
    <div style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", minHeight: "100vh", padding: "clamp(24px, 5vw, 40px) 20px", position: "relative", zIndex: 1 }}>
      {/* Hero */}
      <div style={{ textAlign: "center", marginBottom: 40, animation: "fadeInUp .6s ease both" }}>
        <div className="lh-badge lh-badge-green" style={{ marginBottom: 16 }}>
          <span style={{ width: 6, height: 6, borderRadius: "50%", background: "var(--gt)", display: "inline-block" }} />
          Platform Pembelajaran Ciburial
        </div>
        <h1 className="fnt lh-hero-title" style={{ fontSize: "clamp(40px,8vw,64px)", fontWeight: 300, letterSpacing: "-.03em", color: "var(--fo)", lineHeight: 1.1, marginBottom: 12 }}>
          Learning Hub
        </h1>
        <p style={{ fontSize: "clamp(14px,2vw,17px)", color: "var(--tm)", maxWidth: 480, margin: "0 auto", lineHeight: 1.7 }}>
          Akses E-Perpustakaan, Lab Komputer, Video Pelatihan, dan materi digital lainnya untuk memajukan Ciburial.
        </p>
      </div>

      {/* Two-column auth */}
      <div className="lh-auth-split" style={{ display: "flex", gap: 48, alignItems: "stretch", maxWidth: 800, width: "100%", animation: "fadeInUp .6s ease .15s both" }}>

        {/* Warga Ciburial — NFC */}
        <div className="lh-card" style={{ flex: 1, padding: "clamp(24px, 5vw, 36px) clamp(20px, 4vw, 28px)", textAlign: "center", display: "flex", flexDirection: "column", alignItems: "center", gap: 20 }}>
          <div className="lh-badge lh-badge-green" style={{ display: "flex", alignItems: "center", gap: 6 }}><Home size={14}/> Warga Ciburial</div>
          <h3 className="fnt" style={{ fontSize: 22, fontWeight: 600, color: "var(--fo)" }}>Masuk via e-KTP</h3>
          <p style={{ fontSize: 13, color: "var(--tm)", lineHeight: 1.6, maxWidth: 260 }}>
            Tempel kartu e-KTP di HP untuk login langsung — khusus warga Kampung Ciburial.
          </p>

          <div style={{ position: "relative", margin: "8px 0" }}>
            {scanning && <>
              <div style={{ position: "absolute", inset: -8, borderRadius: "50%", border: "2px solid rgba(47,143,78,.4)", animation: "pulse-ring 2.2s ease-out infinite" }} />
              <div style={{ position: "absolute", inset: -8, borderRadius: "50%", border: "1px solid rgba(47,143,78,.2)", animation: "pulse-ring2 2.2s ease-out infinite .5s" }} />
            </>}
            <button onClick={scanning ? stopNFC : startNFC} className={`nfc-circle ${scanning ? "scanning" : ""}`}>
              <div style={{ color: scanning ? "#2F8F4E" : "var(--tm)", transition: "color .4s" }}>
                <Scan size={44} strokeWidth={1.3} />
              </div>
              <span style={{ fontSize: 10, fontWeight: 700, letterSpacing: ".1em", color: scanning ? "#2F8F4E" : "var(--tm)" }}>
                {scanning ? "SCANNING..." : "TAP e-KTP"}
              </span>
            </button>
          </div>

          <div style={{ fontSize: 10, color: "var(--tm)", opacity: .6, display: "flex", alignItems: "center", gap: 4 }}><Info size={10}/> Chrome Android · NFC aktif</div>
        </div>

        {/* Divider */}
        <div style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 12 }}>
          <div style={{ width: 1, flex: 1, background: "linear-gradient(to bottom, transparent, var(--bo), transparent)" }} />
          <span style={{ fontSize: 12, color: "var(--tm)", fontWeight: 600, padding: "6px 12px", background: "var(--cr)", borderRadius: 8 }}>atau</span>
          <div style={{ width: 1, flex: 1, background: "linear-gradient(to bottom, transparent, var(--bo), transparent)" }} />
        </div>

        {/* User Luar — Email */}
        <div className="lh-card" style={{ flex: 1, padding: "clamp(24px, 5vw, 36px) clamp(20px, 4vw, 28px)", textAlign: "center", display: "flex", flexDirection: "column", alignItems: "center", gap: 20 }}>
          <div className="lh-badge lh-badge-gold" style={{ display: "flex", alignItems: "center", gap: 6 }}><Globe size={14}/> Pengguna Umum</div>
          <h3 className="fnt" style={{ fontSize: 22, fontWeight: 600, color: "var(--fo)" }}>Login / Daftar</h3>
          <p style={{ fontSize: 13, color: "var(--tm)", lineHeight: 1.6, maxWidth: 260 }}>
            Gunakan email dan password untuk mengakses materi pembelajaran digital.
          </p>

          <div style={{ display: "flex", flexDirection: "column", gap: 10, width: "100%", marginTop: 4 }}>
            <button onClick={() => setMode("email-login")} className="lh-btn lh-btn-primary" style={{ width: "100%", display: "flex", alignItems: "center", justifyContent: "center", gap: 8 }}>
              <Mail size={18} /> Login dengan Email
            </button>
            <button onClick={() => setMode("email-register")} className="lh-btn lh-btn-outline" style={{ width: "100%", display: "flex", alignItems: "center", justifyContent: "center", gap: 8 }}>
              <UserPlus size={18} /> Buat Akun Baru
            </button>
          </div>
        </div>
      </div>

      {/* Footer */}
      <div style={{ marginTop: 48, textAlign: "center", animation: "fadeInUp .6s ease .3s both" }}>
        <div style={{ fontSize: 10, color: "var(--tm)", opacity: .4, letterSpacing: ".12em", fontWeight: 600 }}>CIBURIAL ECO-DIGITAL VILLAGE · LEARNING HUB</div>
      </div>
    </div>
  );
}
