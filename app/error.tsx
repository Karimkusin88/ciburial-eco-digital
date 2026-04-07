"use client";

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
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
        <div style={{ fontSize: 56, marginBottom: 16 }}>⚠️</div>
        <h1 style={{
          fontFamily: "'Cormorant Garamond', serif",
          fontSize: 36,
          fontWeight: 300,
          color: "#1C3A2B",
          letterSpacing: "-.02em",
          marginBottom: 10,
        }}>Terjadi Kesalahan</h1>
        <p style={{
          fontSize: 13,
          color: "#9A8C85",
          lineHeight: 1.7,
          marginBottom: 28,
        }}>
          Mohon maaf, ada yang tidak beres. Silakan coba lagi atau kembali ke beranda.
        </p>
        <div style={{ display: "flex", gap: 10, justifyContent: "center", flexWrap: "wrap" }}>
          <button onClick={reset} style={{
            padding: "12px 28px",
            background: "#1C3A2B",
            color: "#fff",
            border: "none",
            borderRadius: 99,
            fontSize: 12,
            fontWeight: 700,
            letterSpacing: ".1em",
            textTransform: "uppercase",
            cursor: "pointer",
          }}>
            Coba Lagi
          </button>
          <a href="/" style={{
            padding: "12px 28px",
            background: "transparent",
            color: "#5A4A40",
            border: "1px solid #E5E0D8",
            borderRadius: 99,
            fontSize: 12,
            fontWeight: 700,
            letterSpacing: ".1em",
            textTransform: "uppercase",
            textDecoration: "none",
          }}>
            Beranda
          </a>
        </div>
      </div>
    </div>
  );
}
