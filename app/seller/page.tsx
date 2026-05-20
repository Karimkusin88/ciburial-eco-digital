"use client";
import { useState, useRef } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft, CreditCard, Store, AlertTriangle } from "lucide-react";
import { supabase } from "@/lib/supabase";
import "../globals.css";

export default function SellerLoginPage() {
  const router = useRouter();
  const [scanning, setScanning] = useState(false);
  const [error, setError] = useState("");
  const nfcRef = useRef<any>(null);

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
          // Cari toko berdasarkan nfc_uid
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

          // Simpan session (sederhana pake localStorage)
          localStorage.setItem("seller_session", JSON.stringify({ id: data.id, nama_toko: data.nama_toko }));
          
          // Redirect ke dashboard
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
          Masuk ke dashboard toko menggunakan e-KTP yang telah didaftarkan oleh admin.
        </p>

        {error && (
          <div className="w-full bg-[var(--rb)] border border-[var(--rt)]/20 text-[var(--rt)] p-4 rounded-xl mb-6 text-sm flex items-start gap-3 text-left">
            <AlertTriangle size={18} className="shrink-0 mt-0.5" />
            <span>{error}</span>
          </div>
        )}

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
      </main>
    </div>
  );
}
