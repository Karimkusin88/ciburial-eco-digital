"use client";
import { useState, useEffect, useCallback } from "react";
import { KioskStyles } from "@/components/learning-hub/KioskStyles";
import { AuthScreen } from "@/components/learning-hub/AuthScreen";
import { Dashboard } from "@/components/learning-hub/Dashboard";

interface AuthUser { id: string; nama: string; kk_id: string; saldo_poin: number; nfc_id?: string; tipe: "warga" | "external" }

const IDLE_TIMEOUT = 30 * 60 * 1000;

export default function LearningHubPage() {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [toast, setToast] = useState({ msg: "", ok: true });
  const [lastActivity, setLastActivity] = useState(Date.now());

  const showToast = useCallback((msg: string, ok = true) => {
    setToast({ msg, ok });
    setTimeout(() => setToast({ msg: "", ok: true }), 4000);
  }, []);

  useEffect(() => {
    if (!user) return;
    const handleActivity = () => setLastActivity(Date.now());
    window.addEventListener("click", handleActivity);
    window.addEventListener("touchstart", handleActivity);
    const check = setInterval(() => {
      if (Date.now() - lastActivity > IDLE_TIMEOUT) {
        setUser(null);
        showToast("Sesi berakhir (idle 30 menit)", false);
      }
    }, 60000);
    return () => { window.removeEventListener("click", handleActivity); window.removeEventListener("touchstart", handleActivity); clearInterval(check); };
  }, [user, lastActivity, showToast]);

  return (
    <div className="lh-page">
      <KioskStyles />

      {/* Toast */}
      {toast.msg && (
        <div style={{
          position: "fixed", top: 20, left: "50%", transform: "translateX(-50%)",
          background: toast.ok ? "var(--fo)" : "rgba(139,32,32,.95)",
          color: "#fff", padding: "12px 28px", borderRadius: 100, zIndex: 9999,
          fontSize: 13, fontWeight: 600, letterSpacing: ".02em",
          animation: "fadeInUp 0.3s ease", maxWidth: "90vw", textAlign: "center",
          boxShadow: toast.ok ? "0 8px 32px rgba(47,143,78,.25)" : "0 8px 32px rgba(139,32,32,.25)",
        }}>
          {toast.msg}
        </div>
      )}

      {user ? (
        <Dashboard user={user} onLogout={() => { setUser(null); showToast("Berhasil logout"); }} showToast={showToast} />
      ) : (
        <AuthScreen onLogin={(u) => setUser(u)} showToast={showToast} />
      )}
    </div>
  );
}
