"use client";

export default function NotFound() {
  return (
    <div style={{
      minHeight: "100vh",
      background: "#FAF8F3",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      fontFamily: "'DM Sans', sans-serif",
      padding: "24px",
    }}>
      <div style={{ textAlign: "center", maxWidth: 440 }}>
        <div style={{ fontSize: 72, marginBottom: 16 }}>🌿</div>
        <h1 style={{
          fontFamily: "'Cormorant Garamond', serif",
          fontSize: "clamp(48px, 10vw, 80px)",
          fontWeight: 300,
          color: "#1C3A2B",
          lineHeight: 1,
          letterSpacing: "-.03em",
          marginBottom: 10,
        }}>404</h1>
        <p style={{
          fontSize: 16,
          fontWeight: 600,
          color: "#5A4A40",
          marginBottom: 8,
        }}>Halaman tidak ditemukan</p>
        <p style={{
          fontSize: 13,
          color: "#9A8C85",
          lineHeight: 1.7,
          marginBottom: 32,
        }}>
          Sepertinya jalan yang kamu tuju belum ada di peta Ciburial.
          <br />Yuk kembali ke beranda!
        </p>
        <a href="/" style={{
          display: "inline-block",
          padding: "12px 28px",
          background: "#1C3A2B",
          color: "#fff",
          borderRadius: 99,
          fontSize: 12,
          fontWeight: 700,
          letterSpacing: ".1em",
          textTransform: "uppercase",
          textDecoration: "none",
          transition: "opacity .2s",
        }}>
          ← Kembali ke Beranda
        </a>
      </div>
    </div>
  );
}
