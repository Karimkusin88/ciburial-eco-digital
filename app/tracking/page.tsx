"use client";
import { useState } from "react";
import { supabase, isSupabaseReady } from "@/lib/supabase";

interface Order {
  id: string;
  order_id: string;
  nama_pembeli: string;
  no_wa: string;
  alamat: string;
  kecamatan: string;
  metode_kirim: string;
  metode_bayar: string;
  total_harga: number;
  ongkos_kirim: number;
  total_bayar: number;
  items: any[];
  status: "pending" | "dibayar" | "diproses" | "dikirim" | "selesai" | "dibatalkan";
  no_resi: string | null;
  created_at: string;
}

export default function TrackingPage() {
  const [orderId, setOrderId] = useState("");
  const [order, setOrder] = useState<Order | null>(null);
  const [loading, setLoading] = useState(false);
  const [searched, setSearched] = useState(false);
  const [error, setError] = useState("");

  const STATUS_INFO = {
    pending: { label: "⏳ Menunggu Pembayaran", warna: "#FFB84D", progress: 10 },
    dibayar: { label: "✅ Pembayaran Diterima", warna: "#4FBF7E", progress: 25 },
    diproses: { label: "📦 Sedang Diproses", warna: "#0066CC", progress: 50 },
    dikirim: { label: "🚚 Sedang Dikirim", warna: "#6366F1", progress: 75 },
    selesai: { label: "🎉 Pesanan Selesai", warna: "#2F8F4E", progress: 100 },
    dibatalkan: { label: "❌ Pesanan Dibatalkan", warna: "#B8472F", progress: 0 },
  };

  const cariOrderId = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!orderId.trim()) {
      setError("Masukkan Order ID terlebih dahulu!");
      return;
    }

    setLoading(true);
    setSearched(true);
    setError("");
    setOrder(null);

    if (!isSupabaseReady()) {
      setError("Database belum siap");
      setLoading(false);
      return;
    }

    try {
      const { data, error: queryError } = await supabase
        .from("orders_marketplace")
        .select("*")
        .eq("order_id", orderId.toUpperCase())
        .single();

      if (queryError || !data) {
        setError("❌ Order ID tidak ditemukan. Periksa kembali nomor pesanan Anda.");
        setOrder(null);
      } else {
        setOrder(data as Order);
        setError("");
      }
    } catch (e) {
      console.error("Error:", e);
      setError("Error mencari pesanan");
    }
    setLoading(false);
  };

  const fRp = (num: number) => new Intl.NumberFormat("id-ID", { style: "currency", currency: "IDR", minimumFractionDigits: 0 }).format(num);

  const parseItems = (itemsJson: any) => {
    try {
      return typeof itemsJson === "string" ? JSON.parse(itemsJson) : itemsJson;
    } catch {
      return [];
    }
  };

  const statusInfo = order ? STATUS_INFO[order.status as keyof typeof STATUS_INFO] : null;
  const items = order ? parseItems(order.items) : [];

  return (
    <div style={{ minHeight: "100vh", background: "linear-gradient(135deg,#FAF8F3,#F0EFE8)", paddingTop: 60, paddingBottom: 80 }}>
      <div style={{ maxWidth: 800, margin: "0 auto", padding: "0 20px" }}>
        {/* Header */}
        <div style={{ textAlign: "center", marginBottom: 40 }}>
          <h1 style={{ margin: "0 0 12px", color: "#1C3A2B", fontSize: "clamp(26px,5vw,36px)", fontWeight: 800 }}>
            📦 Lacak Pesanan Anda
          </h1>
          <p style={{ margin: 0, color: "#6b7c6d", fontSize: 14, lineHeight: 1.6 }}>
            Masukkan Order ID untuk melihat status pengiriman pesanan Anda secara real-time
          </p>
        </div>

        {/* Search Form */}
        <form onSubmit={cariOrderId} style={{ marginBottom: 40 }}>
          <div style={{ display: "flex", gap: 10 }}>
            <input
              type="text"
              value={orderId}
              onChange={(e) => {
                setOrderId(e.target.value.toUpperCase());
                setError("");
              }}
              placeholder='Contoh: MKT-1776656649289'
              style={{
                flex: 1,
                padding: "14px 16px",
                borderRadius: 12,
                border: "1.5px solid rgba(47,143,78,.2)",
                fontSize: 14,
                outline: "none",
                boxSizing: "border-box",
                fontFamily: "monospace",
                fontWeight: 600,
              }}
            />
            <button
              type="submit"
              disabled={loading}
              style={{
                padding: "14px 28px",
                borderRadius: 12,
                background: loading ? "rgba(47,143,78,.3)" : "linear-gradient(135deg,#2F8F4E,#4FBF7E)",
                color: "white",
                border: "none",
                fontSize: 14,
                fontWeight: 700,
                cursor: loading ? "not-allowed" : "pointer",
                letterSpacing: "0.05em",
              }}
            >
              {loading ? "⏳ Mencari..." : "🔍 Lacak"}
            </button>
          </div>
          {error && searched && (
            <div style={{ marginTop: 12, padding: 12, background: "rgba(184,72,48,.12)", border: "1px solid rgba(184,72,48,.3)", borderRadius: 10, color: "#B8472F", fontSize: 13, fontWeight: 600 }}>
              {error}
            </div>
          )}
        </form>

        {/* Results */}
        {searched && order && statusInfo && (
          <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
            {/* Status Card */}
            <div style={{ background: "white", borderRadius: 16, padding: 24, border: `1.5px solid ${statusInfo.warna}40`, boxShadow: "0 8px 24px rgba(47,143,78,.1)" }}>
              <div style={{ marginBottom: 20 }}>
                <div style={{ fontSize: 32, marginBottom: 12 }}>
                  {statusInfo.label.split(" ")[0]} {/* emoji */}
                </div>
                <h2 style={{ margin: "0 0 8px", color: "#1C3A2B", fontSize: 22, fontWeight: 800 }}>
                  {statusInfo.label.substring(2)} {/* label without emoji */}
                </h2>
                <div style={{ fontSize: 13, color: "#6b7c6d" }}>
                  Order ID: <span style={{ fontFamily: "monospace", fontWeight: 700, color: "#2F8F4E" }}>{order.order_id}</span>
                </div>
              </div>

              {/* Progress Bar */}
              <div style={{ marginBottom: 20 }}>
                <div style={{ height: 8, background: "rgba(47,143,78,.1)", borderRadius: 4, overflow: "hidden", marginBottom: 8 }}>
                  <div
                    style={{
                      height: "100%",
                      background: statusInfo.warna,
                      width: `${statusInfo.progress}%`,
                      transition: "width 0.6s ease",
                    }}
                  />
                </div>
                <div style={{ fontSize: 12, color: "#6b7c6d", fontWeight: 600 }}>
                  {statusInfo.progress}% Selesai
                </div>
              </div>

              {/* Resi */}
              {order.no_resi && order.status !== "pending" && order.status !== "dibatalkan" && (
                <div style={{ padding: 14, background: "rgba(47,143,78,.06)", borderRadius: 10, border: "1.5px solid rgba(47,143,78,.15)" }}>
                  <div style={{ fontSize: 11, fontWeight: 700, color: "#6b7c6d", textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: 8 }}>
                    🚚 No. Resi Pengiriman
                  </div>
                  <div style={{ fontSize: 16, fontFamily: "monospace", fontWeight: 800, color: "#2F8F4E" }}>
                    {order.no_resi}
                  </div>
                </div>
              )}
            </div>

            {/* Detail Card */}
            <div style={{ background: "white", borderRadius: 14, border: "1.5px solid rgba(47,143,78,.12)" }}>
              {/* Produk */}
              <div style={{ padding: 20, borderBottom: "1px solid rgba(47,143,78,.1)" }}>
                <h3 style={{ margin: "0 0 14px", color: "#1C3A2B", fontSize: 14, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.06em" }}>
                  📦 Produk ({items.length})
                </h3>
                <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                  {items.map((item: any, i: number) => (
                    <div key={i} style={{ padding: 10, background: "rgba(47,143,78,.02)", borderRadius: 8, border: "1px solid rgba(47,143,78,.1)", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                      <div>
                        <div style={{ fontSize: 13, fontWeight: 700, color: "#1C3A2B" }}>{item.nama}</div>
                        <div style={{ fontSize: 11, color: "#9A8C85", marginTop: 2 }}>×{item.qty} • {fRp(item.harga)}</div>
                      </div>
                      <div style={{ fontSize: 13, fontWeight: 700, color: "#2F8F4E" }}>{fRp(item.harga * item.qty)}</div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Alamat */}
              <div style={{ padding: 20, borderBottom: "1px solid rgba(47,143,78,.1)" }}>
                <h3 style={{ margin: "0 0 12px", color: "#1C3A2B", fontSize: 14, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.06em" }}>
                  📍 Alamat Pengiriman
                </h3>
                <div style={{ fontSize: 13, lineHeight: 1.8, color: "#1C3A2B" }}>
                  <strong>{order.nama_pembeli}</strong><br />
                  {order.alamat || "-"}<br />
                  {order.kecamatan}
                </div>
                <div style={{ marginTop: 12, fontSize: 12, color: "#9A8C85", padding: "10px 12px", background: "rgba(47,143,78,.04)", borderRadius: 8 }}>
                  Metode: {order.metode_kirim === "ambil_sendiri" ? "🏠 Ambil Sendiri" : "🚚 Pengiriman"}
                </div>
              </div>

              {/* Ringkasan Pembayaran */}
              <div style={{ padding: 20 }}>
                <h3 style={{ margin: "0 0 14px", color: "#1C3A2B", fontSize: 14, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.06em" }}>
                  💰 Ringkasan Pembayaran
                </h3>
                <div style={{ display: "flex", justifyContent: "space-between", fontSize: 13, marginBottom: 8 }}>
                  <span color="#6b7c6d">Subtotal</span>
                  <span style={{ fontWeight: 600, color: "#1C3A2B" }}>{fRp(order.total_harga)}</span>
                </div>
                <div style={{ display: "flex", justifyContent: "space-between", fontSize: 13, marginBottom: 12, paddingBottom: 12, borderBottom: "1px solid rgba(47,143,78,.1)" }}>
                  <span style={{ color: "#6b7c6d" }}>Ongkos Kirim</span>
                  <span style={{ fontWeight: 600, color: order.ongkos_kirim === 0 ? "#2F8F4E" : "#1C3A2B" }}>
                    {order.ongkos_kirim === 0 ? "Gratis" : fRp(order.ongkos_kirim)}
                  </span>
                </div>
                <div style={{ display: "flex", justifyContent: "space-between", fontSize: 16, fontWeight: 700 }}>
                  <span style={{ color: "#1C3A2B" }}>Total</span>
                  <span style={{ color: "#2F8F4E" }}>{fRp(order.total_bayar)}</span>
                </div>
              </div>
            </div>

            {/* Hubungi Admin */}
            <div style={{ background: "#25D36615", borderRadius: 14, padding: 20, border: "1.5px solid rgba(37,211,102,.25)" }}>
              <div style={{ marginBottom: 14 }}>
                <div style={{ fontSize: 13, fontWeight: 700, color: "#1C3A2B", marginBottom: 6 }}>
                  Ada pertanyaan tentang pesanan Anda?
                </div>
                <div style={{ fontSize: 12, color: "#6b7c6d", lineHeight: 1.6 }}>
                  Hubungi tim admin kami via WhatsApp untuk bantuan lebih lanjut
                </div>
              </div>
              <a
                href="https://wa.me/6281234567890"
                target="_blank"
                rel="noopener noreferrer"
                style={{
                  display: "block",
                  padding: "12px",
                  borderRadius: 10,
                  background: "#25D366",
                  color: "white",
                  textAlign: "center",
                  textDecoration: "none",
                  fontSize: 14,
                  fontWeight: 700,
                  cursor: "pointer",
                }}
              >
                💬 Hubungi Admin via WhatsApp
              </a>
            </div>
          </div>
        )}

        {/* Empty State */}
        {searched && !order && !error && (
          <div style={{ background: "white", borderRadius: 16, padding: 40, textAlign: "center", border: "1.5px solid rgba(47,143,78,.12)" }}>
            <div style={{ fontSize: 48, marginBottom: 16 }}>🔍</div>
            <div style={{ fontSize: 16, fontWeight: 700, color: "#1C3A2B", marginBottom: 8 }}>Pesanan Tidak Ditemukan</div>
            <div style={{ fontSize: 13, color: "#6b7c6d" }}>
              Silakan periksa kembali Order ID Anda atau hubungi admin
            </div>
          </div>
        )}

        {/* Info Box */}
        {!searched && (
          <div style={{ marginTop: 40, padding: 20, background: "rgba(47,143,78,.08)", borderRadius: 14, border: "1.5px solid rgba(47,143,78,.15)" }}>
            <div style={{ fontSize: 13, color: "#6b7c6d", lineHeight: 1.8 }}>
              <strong style={{ color: "#1C3A2B", display: "block", marginBottom: 8 }}>💡 Cara Menggunakan:</strong>
              1. Cari Order ID di konfirmasi pesanan Anda<br />
              2. Paste ke kolom di atas<br />
              3. Lihat status pengiriman real-time<br />
              <br />
              <strong style={{ color: "#1C3A2B" }}>Order ID Format:</strong> MKT-XXXXXXXXXX<br />
              (Anda bisa melihatnya di pesan WhatsApp atau email konfirmasi)
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
