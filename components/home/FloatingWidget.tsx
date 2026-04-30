"use client";
import dynamic from "next/dynamic";
import { useState } from "react";

const CuacaSholatWidget = dynamic(() => import("@/components/CuacaSholatWidget"), { ssr: false });

export default function FloatingWidget() {
  const [open, setOpen] = useState(false);

  return (
    <div style={{ position: "fixed", bottom: 24, right: 24, zIndex: 1000, display: "flex", flexDirection: "column", alignItems: "flex-end", gap: 12 }}>
      {open && (
        <div className="animate-masuk" style={{ 
          background: "white", 
          padding: "16px", 
          borderRadius: "24px", 
          boxShadow: "0 12px 48px rgba(0,0,0,0.15)",
          border: "1.5px solid rgba(47,143,78,0.2)",
          width: "clamp(300px, 80vw, 400px)",
          maxHeight: "80vh",
          overflowY: "auto",
          position: "relative"
        }}>
          <button onClick={() => setOpen(false)} style={{ 
            position: "absolute", top: 12, right: 12, 
            background: "none", border: "none", 
            fontSize: 20, cursor: "pointer", color: "#9A8C85" 
          }}>✕</button>
          <div style={{ marginTop: 12 }}>
            <CuacaSholatWidget />
          </div>
        </div>
      )}
      
      <button 
        onClick={() => setOpen(!open)}
        className="btn-heroic pulse-glow"
        style={{ 
          width: 56, height: 56, borderRadius: "50%", 
          padding: 0, display: "flex", alignItems: "center", justifyContent: "center",
          fontSize: 24, background: open ? "#1B4332" : "linear-gradient(135deg,#2F8F4E,#4FBF7E)"
        }}
      >
        {open ? "✕" : "⛅"}
      </button>
    </div>
  );
}
