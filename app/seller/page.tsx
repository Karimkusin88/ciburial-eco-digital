"use client";
import { useState, useRef } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft, CreditCard, Store, AlertTriangle, Smartphone, User } from "lucide-react";
import { supabase } from "@/lib/supabase";
import "../globals.css";

export default function SellerLoginPage() {
  const router = useRouter();
  const [loginMethod, setLoginMethod] = useState<"nfc" | "wa">("nfc");
  const [scanning, setScanning] = useState(false);
  const [error, setError] = useState("");
  const nfcRef = useRef<any>(null);

  // WA Login State
  const [loginStep, setLoginStep] = useState<"phone" | "otp">("phone");
  const [loginForm, setLoginForm] = useState({ no_wa: "", otp: "" });
  const [loginLoading, setLoginLoading] = useState(false);

  async function startNFC() {
    if (!("NDEFReader" in window)) {
      setError("Perangkat atau browser ini tidak mendukung NFC (Gunakan Chrome Android).");
      return;
    }

    try {
      setError("");
      const ndef = new (window as any).NDEFReader();
      nfcRef.current = ndef;
      await ndef.scan();
      setScanning(true);

      ndef.addEventListener("reading", async ({ serialNumber }: any) => {
        const uid = serialNumber.replace(/:/g, "").toUpperCase();
        stopNFC();
        
        try {
          const { data, error } = await supabase
            .from("toko")
            .select("id, nama_toko, status")
            .eq("nfc_uid", uid)
            .single();

          if (error || !data) {
            setError("e-KTP tidak terdaftar sebagai penjual. Hubungi admin.");
            return;
          }

          if (data.status !== "aktif") {
            setError("Toko Anda sedang dinonaktifkan.");
            return;
          }

          localStorage.setItem("seller_session", JSON.stringify({ id: data.id, nama_toko: data.nama_toko }));
          router.push("/seller/dashboard");
          
        } catch (err: any) {
          setError(`Gagal memverifikasi: ${err.message}`);
        }
      });
    } catch (err: any) {
      setScanning(false);
      setError(`Gagal mengaktifkan NFC: ${err.message}`);
    }
  }

  function stopNFC() {
    try { nfcRef.current?.stop?.(); } catch {}
    setScanning(false);
  }

  async function handleSendOtp() {
    if (!loginForm.no_wa) return;
    setLoginLoading(true);
    setError("");
    try {
      const res = await fetch("/api/auth/seller-send-otp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ no_wa: loginForm.no_wa })
      });
      const data = await res.json();
      if (!data.success) {
        setError(data.message || "Gagal mengirim OTP");
        setLoginLoading(false);
        return;
      }
      if (data.mock_otp) {
        // Hanya untuk DEV jika tidak ada key Fonnte
        // alert(`DEV MODE: OTP Anda adalah ${data.mock_otp}`);
        setLoginForm(prev => ({ ...prev, otp: data.mock_otp }));
      } else {
        setLoginForm(prev => ({ ...prev, otp: "" }));
      }
      setLoginStep("otp");
    } catch (err: any) {
      setError("Terjadi kesalahan sistem");
    }
    setLoginLoading(false);
  }

  async function handleVerifyOtp() {
    if (loginForm.otp.length !== 4) return;
    setLoginLoading(true);
    setError("");
    try {
      const res = await fetch("/api/auth/seller-verify-otp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ no_wa: loginForm.no_wa, otp: loginForm.otp })
      });
      const data = await res.json();
      if (!data.success) {
        setError(data.message || "OTP tidak valid");
        setLoginLoading(false);
        return;
      }
      
      localStorage.setItem("seller_session", JSON.stringify({ id: data.toko.id, nama_toko: data.toko.nama_toko }));
      router.push("/seller/dashboard");
    } catch (err: any) {
      setError("Terjadi kesalahan sistem");
      setLoginLoading(false);
    }
  }

  return (
    <div className="min-h-screen bg-[var(--cr)] flex flex-col font-sans">
      <header className="p-4 flex items-center gap-4">
        <button onClick={() => router.push("/")} className="w-10 h-10 rounded-full bg-white shadow-sm flex items-center justify-center text-[var(--fo)]">
          <ArrowLeft size={20} />
        </button>
        <span className="font-bold text-[var(--tp)]">Kembali</span>
      </header>

      <main className="flex-1 flex flex-col items-center justify-center p-6 max-w-md mx-auto w-full text-center">
        <div className="w-20 h-20 bg-gradient-to-br from-[var(--fo)] to-[var(--accent)] rounded-full flex items-center justify-center text-white mb-6 shadow-lg shadow-[rgba(47,143,78,0.2)]">
          <Store size={36} />
        </div>
        
        <h1 className="fnt text-3xl font-bold text-[var(--tp)] mb-2">Login Penjual</h1>
        <p className="text-[var(--ts)] mb-8 text-[15px]">
          Masuk ke dashboard toko menggunakan e-KTP atau Nomor WhatsApp yang terdaftar.
        </p>

        {error && (
          <div className="w-full bg-[var(--rb)] border border-[var(--rt)]/20 text-[var(--rt)] p-4 rounded-xl mb-6 text-sm flex items-start gap-3 text-left">
            <AlertTriangle size={18} className="shrink-0 mt-0.5" />
            <span>{error}</span>
          </div>
        )}

        {/* Tab Switcher */}
        <div className="w-full bg-white p-1 rounded-2xl flex mb-8 shadow-sm border border-[rgba(45,90,64,0.08)]">
          <button 
            onClick={() => { setLoginMethod("nfc"); setError(""); }}
            className={`flex-1 py-3 text-sm font-bold rounded-xl transition-all ${loginMethod === "nfc" ? "bg-[var(--fo)] text-white shadow-md" : "text-[var(--ts)]"}`}
          >
            Scan e-KTP
          </button>
          <button 
            onClick={() => { setLoginMethod("wa"); setError(""); }}
            className={`flex-1 py-3 text-sm font-bold rounded-xl transition-all ${loginMethod === "wa" ? "bg-[var(--fo)] text-white shadow-md" : "text-[var(--ts)]"}`}
          >
            Nomor WA
          </button>
        </div>

        {loginMethod === "nfc" && (
          <>
            <button 
              onClick={scanning ? stopNFC : startNFC}
              className={`w-full py-4 rounded-2xl font-bold text-[16px] flex items-center justify-center gap-3 transition-all ${
                scanning 
                  ? "bg-[var(--rb)] text-[var(--rt)] border-2 border-[var(--rt)]"
                  : "btn-heroic shadow-xl"
              }`}
            >
              <CreditCard size={20} className={scanning ? "animate-pulse" : ""} />
              {scanning ? "Batal Scan" : "Scan e-KTP Sekarang"}
            </button>

            {scanning && (
              <div className="mt-8 relative">
                <div className="absolute inset-0 bg-[var(--accent)] opacity-20 rounded-full animate-ping"></div>
                <div className="w-32 h-32 bg-white rounded-full flex items-center justify-center shadow-lg relative z-10 border-4 border-[var(--cr)]">
                  <CreditCard size={40} className="text-[var(--accent)]" />
                </div>
                <p className="text-[var(--fo)] font-semibold mt-6">Tempelkan e-KTP di belakang HP Anda...</p>
              </div>
            )}
          </>
        )}

        {loginMethod === "wa" && (
          <div className="w-full bg-white p-6 rounded-2xl shadow-sm border border-[rgba(45,90,64,0.08)] text-left">
            {loginStep === "phone" ? (
              <div>
                <label className="block text-[12px] font-bold text-[var(--fo)] mb-2">Nomor WhatsApp</label>
                <input 
                  type="tel" 
                  placeholder="Contoh: 08123456789" 
                  value={loginForm.no_wa}
                  onChange={e => setLoginForm({...loginForm, no_wa: e.target.value})}
                  className="w-full p-4 rounded-xl border-2 border-[#E5E7E9] text-[15px] outline-none transition-all focus:border-[var(--accent)] mb-6"
                />
                <button 
                  onClick={handleSendOtp}
                  disabled={loginLoading || !loginForm.no_wa}
                  className="w-full btn-heroic py-4 rounded-xl font-bold text-[15px] disabled:opacity-50"
                >
                  {loginLoading ? "Mengecek Nomor..." : "Kirim OTP"}
                </button>
              </div>
            ) : (
              <div>
                <label className="block text-[12px] font-bold text-[var(--fo)] mb-2">Kode OTP</label>
                <input 
                  type="text" 
                  placeholder="4 Digit OTP" 
                  maxLength={4}
                  value={loginForm.otp}
                  onChange={e => setLoginForm({...loginForm, otp: e.target.value.replace(/\D/g, "")})}
                  className="w-full p-4 rounded-xl border-2 border-[#E5E7E9] text-[20px] text-center tracking-[0.5em] font-bold outline-none transition-all focus:border-[var(--accent)] mb-4"
                />
                <p className="text-[12px] text-center text-[var(--ts)] mb-6">
                  OTP dikirim ke {loginForm.no_wa} <br/>
                  <span onClick={() => setLoginStep("phone")} className="text-[var(--accent)] font-bold cursor-pointer inline-block mt-1">Ganti Nomor</span>
                </p>
                <button 
                  onClick={handleVerifyOtp}
                  disabled={loginLoading || loginForm.otp.length < 4}
                  className="w-full btn-heroic py-4 rounded-xl font-bold text-[15px] disabled:opacity-50"
                >
                  {loginLoading ? "Memverifikasi..." : "Verifikasi & Masuk"}
                </button>
              </div>
            )}
          </div>
        )}
      </main>
    </div>
  );
}
