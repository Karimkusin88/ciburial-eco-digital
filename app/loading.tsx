export default function Loading() {
  return (
    <div style={{
      minHeight: "100vh",
      background: "#FAF8F3",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      fontFamily: "'DM Sans', sans-serif",
    }}>
      <div style={{ textAlign: "center" }}>
        <div style={{
          width: 48,
          height: 48,
          borderRadius: "50%",
          border: "3px solid #E5E0D8",
          borderTopColor: "#2D5A40",
          animation: "spin 0.8s linear infinite",
          margin: "0 auto 16px",
        }} />
        <p style={{
          fontSize: 12,
          fontWeight: 700,
          letterSpacing: ".12em",
          textTransform: "uppercase",
          color: "#9A8C85",
        }}>Memuat...</p>
        <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
      </div>
    </div>
  );
}
