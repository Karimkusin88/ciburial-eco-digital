"use client";
export function KioskStyles() {
  return <style>{`
    @keyframes fadeInUp{from{opacity:0;transform:translateY(24px)}to{opacity:1;transform:translateY(0)}}
    @keyframes pulse-ring{0%{transform:scale(.85);opacity:.75}100%{transform:scale(1.7);opacity:0}}
    @keyframes pulse-ring2{0%{transform:scale(.85);opacity:.45}100%{transform:scale(2.3);opacity:0}}
    @keyframes float-slow{0%,100%{transform:translateY(0)}50%{transform:translateY(-12px)}}
    @keyframes shimmer{0%{background-position:-400px 0}100%{background-position:400px 0}}
    @keyframes glow-green{0%,100%{box-shadow:0 0 20px rgba(47,143,78,.15)}50%{box-shadow:0 0 40px rgba(47,143,78,.25)}}

    .lh-page{min-height:100vh;background:var(--cr,#FAF8F3);font-family:var(--font-dm-sans,'DM Sans'),sans-serif;color:var(--tp,#1A1410);position:relative;overflow-x:hidden}
    .lh-page::before{content:'';position:fixed;top:0;left:0;width:100%;height:100%;background:radial-gradient(circle at 15% 30%,rgba(47,143,78,.05) 0%,transparent 50%),radial-gradient(circle at 85% 70%,rgba(184,148,63,.04) 0%,transparent 50%);pointer-events:none;z-index:0}

    .lh-card{background:var(--cw,#FFFEF9);border:1.5px solid rgba(47,143,78,.1);border-radius:20px;transition:all .35s cubic-bezier(.22,1,.36,1);box-shadow:0 4px 24px rgba(28,58,43,.06)}
    .lh-card:hover{transform:translateY(-6px);box-shadow:0 20px 48px rgba(28,58,43,.12);border-color:rgba(47,143,78,.25)}

    .lh-btn{transition:all .25s cubic-bezier(.22,1,.36,1);cursor:pointer;border:none;font-family:inherit;border-radius:12px}
    .lh-btn:hover{transform:translateY(-2px)}
    .lh-btn:active{transform:translateY(0) scale(.97)}

    .lh-btn-primary{background:linear-gradient(135deg,#2F8F4E,#4FBF7E);color:#fff;padding:14px 32px;font-weight:700;font-size:13px;letter-spacing:.06em;border-radius:14px;box-shadow:0 8px 28px rgba(47,143,78,.25)}
    .lh-btn-primary:hover{box-shadow:0 12px 36px rgba(47,143,78,.35);letter-spacing:.08em}

    .lh-btn-outline{background:transparent;border:1.5px solid rgba(47,143,78,.2);color:var(--fo,#1C3A2B);padding:14px 32px;font-weight:600;font-size:13px}
    .lh-btn-outline:hover{background:rgba(47,143,78,.05);border-color:rgba(47,143,78,.35)}

    .lh-input{width:100%;padding:14px 18px;border:2px solid var(--bo,#E5E0D8);background:rgba(255,254,249,.7);border-radius:14px;font-size:14px;font-family:inherit;outline:none;transition:border-color .25s,box-shadow .25s}
    .lh-input:focus{border-color:var(--accent,#2F8F4E);box-shadow:0 0 0 4px rgba(47,143,78,.12)}
    .lh-input::placeholder{color:var(--tm,#9A8C85)}

    .lh-feature{background:var(--cw,#FFFEF9);border:1.5px solid rgba(47,143,78,.08);border-radius:20px;padding:28px;cursor:pointer;transition:all .35s cubic-bezier(.22,1,.36,1);text-align:left;font-family:inherit;display:flex;flex-direction:column;gap:14;box-shadow:0 2px 16px rgba(28,58,43,.04)}
    .lh-feature:hover{transform:translateY(-6px);box-shadow:0 20px 48px rgba(28,58,43,.12);border-color:rgba(47,143,78,.25);background:linear-gradient(135deg,rgba(47,143,78,.02),rgba(79,191,126,.02))}

    .lh-badge{display:inline-flex;align-items:center;gap:6px;padding:6px 14px;border-radius:100px;font-size:11px;font-weight:700;letter-spacing:.06em}
    .lh-badge-green{background:var(--gb,#E8F5EE);color:var(--gt,#1C6B3A);border:1px solid rgba(28,107,58,.12)}
    .lh-badge-gold{background:rgba(184,148,63,.1);color:#7A5A1E;border:1px solid rgba(184,148,63,.15)}

    .lh-divider{height:1px;background:linear-gradient(90deg,transparent,var(--bo,#E5E0D8),transparent);margin:24px 0}

    .nfc-circle{width:160px;height:160px;border-radius:50%;border:2.5px solid rgba(47,143,78,.2);background:linear-gradient(135deg,rgba(47,143,78,.04),rgba(79,191,126,.06));display:flex;flex-direction:column;align-items:center;justify-content:center;gap:8px;cursor:pointer;transition:all .4s;position:relative}
    .nfc-circle:hover{border-color:rgba(47,143,78,.4);box-shadow:0 8px 32px rgba(47,143,78,.15)}
    .nfc-circle.scanning{border-color:#2F8F4E;background:linear-gradient(135deg,rgba(47,143,78,.08),rgba(79,191,126,.12));animation:glow-green 2s ease-in-out infinite}

    .tab-btn{padding:8px 18px;border-radius:100px;font-size:12px;font-weight:600;border:1.5px solid transparent;cursor:pointer;transition:all .25s;background:transparent;color:var(--ts,#5A4A40);font-family:inherit}
    .tab-btn:hover{background:rgba(47,143,78,.06)}
    .tab-btn.active{background:var(--fo,#1C3A2B);color:#fff;border-color:var(--fo)}

    @media(max-width:768px){
      .lh-grid-features{grid-template-columns:1fr!important}
      .lh-auth-split{flex-direction:column!important;gap:32px!important}
      .lh-hero-title{font-size:clamp(32px,8vw,48px)!important}
    }
  `}</style>;
}
