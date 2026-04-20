"use client";
import { useState, useEffect } from "react";
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

export default function CekPesananPage() {
  const [noWa, setNoWa] = useState("");
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(false);
  const [searched, setSearched] = useState(false);
  const [expandedOrder, setExpandedOrder] = useState<string | null>(null);

  const STATUS_INFO = {
    pending: { label: "⏳ Menunggu Pembayaran", warna: "#FFB84D", icon: "⏳" },
    dibayar: { label: "✅ Pembayaran Diterima", warna: "#4FBF7E", icon: "✅" },
    diproses: { label: "📦 Sedang Diproses", warna: "#0066CC", icon: "📦" },
    dikirim: { label: "🚚 Sedang Dikirim", warna: "#6366F1", icon: "🚚" },
    selesai: { label: "🎉 Pesanan Selesai", warna: "#2F8F4E", icon: "🎉" },
    dibatalkan: { label: "❌ Pesanan Dibatalkan", warna: "#B8472F", icon: "❌" },
  };

  const normalizWa = (wa: string) => {
    const cleaned = wa.replace(/[^0-9]/g, "");
    return cleaned.startsWith("62") ? cleaned : "62" + (cleaned.startsWith("0") ? cleaned.slice(1) : cleaned);
  };

  const cariPesanan = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!noWa.trim()) {
      alert("Masukkan no. WhatsApp terlebih dahulu!");
      return;
    }

    setLoading(true);
    setSearched(true);

    if (!isSupabaseReady()) {
      alert("Database belum siap");
      setLoading(false);
      return;
    }

    try {
      const normalized = normalizWa(noWa);
      const { data, error } = await supabase
        .from("orders_marketplace")
        .select("*")
        .like("no_wa", `%${normalized}%`)
        .order("created_at", { ascending: false });

      if (error) throw error;
      setOrders(data || []);
    } catch (e) {
      console.error("Error:", e);
      alert("Error mencari pesanan");
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

  return (
    <div style={{ minHeight: "100vh", background: "linear-gradient(135deg,#FAF8F3,#F0EFE8)", paddingTop: 40, paddingBottom: 60 }}>
      <div style={{ maxWidth: 800, margin: "0 auto", padding: "0 20px" }}>
        {/* Header */}
        <div style={{ textAlign: "center", marginBottom: 40 }}>
          <h1 style={{ margin: "0 0 8px", color: "#1C3A2B", fontSize: "clamp(24px,5vw,36px)", fontWeight: 800 }}>
            🔍 Cek Pesanan Anda
          </h1>
          <p style={{ margin: 0, color: "#6b7c6d", fontSize: 14 }}>
            Masukkan nomor WhatsApp untuk melihat status pesanan Anda
          </p>
        </div>

        {/* Search Form */}
        <form onSubmit={cariPesanan} style={{ marginBottom: 40 }}>
          <div style={{ display: "flex", gap: 8 }}>
            <input
              type="tel"
              value={noWa}
              onChange={(e) => setNoWa(e.target.value)}
              placeholder="Contoh: 0812-3456-7890 atau +62812-3456-7890"
              style={{
                flex: 1,
                padding: "14px 16px",
                borderRadius: 12,
                border: "1.5px solid rgba(47,143,78,.2)",
                fontSize: 14,
                outline: "none",
                boxSizing: "border-box",
              }}
            />
            <button
              type="submit"
              disabled={loading}
              style={{
                padding: "14px 24px",
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
              {loading ? "⏳ Pencarian..." : "🔍 Cari"}
            </button>
          </div>
        </form>

        {/* Results */}
        {searched && (
          <>
            {orders.length === 0 ? (
              <div style={{ background: "white", borderRadius: 16, padding: 40, textAlign: "center", border: "1.5px solid rgba(47,143,78,.12)" }}>
                <div style={{ fontSize: 48, marginBottom: 16 }}>📭</div>
                <div style={{ fontSize: 16, fontWeight: 700, color: "#1C3A2B", marginBottom: 8 }}>Pesanan Tidak Ditemukan</div>
                <div style={{ fontSize: 13, color: "#6b7c6d" }}>
                  Silakan periksa kembali nomor WhatsApp Anda atau hubungi admin jika ada pertanyaan
                </div>
              </div>
            ) : (
              <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
                <div style={{ fontSize: 13, fontWeight: 700, color: "#6b7c6d", textTransform: "uppercase", letterSpacing: "0.06em" }}>
                  Ditemukan {orders.length} Pesanan
                </div>
                {orders.map((order) => {
                  const statusInfo = STATUS_INFO[order.status as keyof typeof STATUS_INFO];
                  const items = parseItems(order.items);
                  const isExpanded = expandedOrder === order.id;

                  return (
                    <div
                      key={order.id}
                      onClick={() => setExpandedOrder(isExpanded ? null : order.id)}
                      style={{
                        background: "white",
                        borderRadius: 14,
                        border: `1.5px solid ${statusInfo?.warna}40`,
                        overflow: "hidden",
                        cursor: "pointer",
                        transition: "all 0.2s",
                        boxShadow: isExpanded ? "0 8px 24px rgba(47,143,78,.12)" : "0 2px 8px rgba(47,143,78,.06)",
                      }}
                    >
                      {/* Summary */}
                      <div style={{ padding: 18, borderBottom: isExpanded ? `1px solid rgba(47,143,78,.1)` : "none" }}>
                        <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 16 }}>
                          <div style={{ flex: 1 }}>
                            <div style={{ fontSize: 11, fontFamily: "monospace", fontWeight: 700, color: "#2F8F4E", marginBottom: 8 }}>
                              {order.order_id}
                            </div>
                            <div style={{ fontSize: 13, fontWeight: 700, color: "#1C3A2B", marginBottom: 4 }}>
                              📦 {items.length} Produk • {fRp(order.total_bayar)}
                            </div>
                            <div style={{ fontSize: 12, color: "#6b7c6d" }}>
                              {new Date(order.created_at).toLocaleDateString("id-ID", {
                                day: "numeric",
                                month: "long",
                                year: "numeric",
                              })}
                            </div>
                          </div>
                          <div
                            style={{
                              padding: "6px 14px",
                              borderRadius: 10,
                              background: `${statusInfo?.warna}15`,
                              color: statusInfo?.warna,
                              fontSize: 12,
                              fontWeight: 700,
                              textAlign: "center",
                              whiteSpace: "nowrap",
                            }}
                          >
                            {statusInfo?.label || order.status}
                          </div>
                        </div>

                        {/* Status badge dengan icon */}
                        <div style={{ marginTop: 12, display: "flex", alignItems: "center", gap: 10 }}>
                          <div style={{ fontSize: 24 }}>{statusInfo?.icon}</div>
                          <div style={{ flex: 1, height: 4, background: "rgba(47,143,78,.1)", borderRadius: 2, overflow: "hidden" }}>
                            <div
                              style={{
                                height: "100%",
                                background: statusInfo?.warna,
                                width: order.status === "selesai" ? "100%" : 
                                       order.status === "dikirim" ? "75%" :
                                       order.status === "diproses" ? "50%" :
                                       order.status === "dibayar" ? "25%" : "10%",
                                transition: "width 0.3s",
                              }}
                            />
                          </div>
                        </div>
                      </div>

                      {/* Expanded Details */}
                      {isExpanded && (
                        <div style={{ padding: "16px", background: "rgba(47,143,78,.02)" }}>
                          {/* Resi Pengiriman */}
                          {order.no_resi && order.status !== "pending" && order.status !== "dibatalkan" && (
                            <div style={{ marginBottom: 16, padding: "12px 14px", background: "white", borderRadius: 10, border: "1.5px solid rgba(47,143,78,.15)" }}>
                              <div style={{ fontSize: 11, fontWeight: 700, color: "#6b7c6d", textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: 6 }}>
                                🚚 No. Resi
                              </div>
                              <div style={{ fontSize: 14, fontFamily: "monospace", fontWeight: 700, color: "#2F8F4E" }}>
                                {order.no_resi}
                              </div>
                              <div style={{ fontSize: 11, color: "#9A8C85", marginTop: 4 }}>
                                Metode: {order.metode_kirim === "ambil_sendiri" ? "Ambil Sendiri" : "Pengiriman"}
                              </div>
                            </div>
                          )}

                          {/* Daftar Produk */}
                          <div style={{ marginBottom: 16 }}>
                            <div style={{ fontSize: 11, fontWeight: 700, color: "#6b7c6d", textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: 10 }}>
                              📦 Produk
                            </div>
                            <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                              {items.map((item: any, i: number) => (
                                <div key={i} style={{ padding: "8px 12px", background: "white", borderRadius: 8, border: "1px solid rgba(47,143,78,.1)", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                                  <div>
                                    <div style={{ fontSize: 12, fontWeight: 600, color: "#1C3A2B" }}>
                                      {item.nama}
                                    </div>
                                    <div style={{ fontSize: 11, color: "#9A8C85" }}>
                                      ×{item.qty} • {fRp(item.harga)}
                                    </div>
                                  </div>
                                  <div style={{ fontSize: 12, fontWeight: 700, color: "#2F8F4E" }}>
                                    {fRp(item.harga * item.qty)}
                                  </div>
                                </div>
                              ))}
                            </div>
                          </div>

                          {/* Detail Pengiriman */}
                          <div style={{ marginBottom: 16, padding: "12px 14px", background: "white", borderRadius: 10, border: "1.5px solid rgba(47,143,78,.15)" }}>
                            <div style={{ fontSize: 11, fontWeight: 700, color: "#6b7c6d", textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: 10 }}>
                              📍 Alamat Pengiriman
                            </div>
                            <div style={{ fontSize: 12, lineHeight: 1.6, color: "#1C3A2B" }}>
                              <strong>{order.nama_pembeli}</strong><br />
                              {order.alamat || "-"}<br />
                              {order.kecamatan}
                            </div>
                          </div>

                          {/* Ringkasan Pembayaran */}
                          <div style={{ padding: "12px 14px", background: "white", borderRadius: 10, border: "1.5px solid rgba(47,143,78,.15)" }}>
                            <div style={{ fontSize: 11, fontWeight: 700, color: "#6b7c6d", textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: 10 }}>
                              💰 Ringkasan Pembayaran
                            </div>
                            <div style={{ display: "flex", justifyContent: "space-between", fontSize: 12, marginBottom: 6 }}>
                              <span>Subtotal</span>
                              <span style={{ fontWeight: 600, color: "#1C3A2B" }}>{fRp(order.total_harga)}</span>
                            </div>
                            <div style={{ display: "flex", justifyContent: "space-between", fontSize: 12, marginBottom: 10, borderBottom: "1px solid rgba(47,143,78,.1)", paddingBottom: 8 }}>
                              <span>Ongkos Kirim</span>
                              <span style={{ fontWeight: 600, color: order.ongkos_kirim === 0 ? "#2F8F4E" : "#1C3A2B" }}>
                                {order.ongkos_kirim === 0 ? "Gratis" : fRp(order.ongkos_kirim)}
                              </span>
                            </div>
                            <div style={{ display: "flex", justifyContent: "space-between", fontSize: 14, fontWeight: 700 }}>
                              <span>Total</span>
                              <span style={{ color: "#2F8F4E" }}>{fRp(order.total_bayar)}</span>
                            </div>
                          </div>

                          {/* CTA */}
                          <div style={{ marginTop: 16 }}>
                            <a
                              href={`https://wa.me/${order.no_wa.replace(/[^0-9]/g, "")}?text=Halo, saya ingin tanya tentang pesanan ${order.order_id}`}
                              target="_blank"
                              rel="noopener noreferrer"
                              style={{
                                display: "block",
                                padding: "11px",
                                borderRadius: 10,
                                background: "#25D366",
                                color: "white",
                                textAlign: "center",
                                textDecoration: "none",
                                fontSize: 13,
                                fontWeight: 700,
                                cursor: "pointer",
                              }}
                            >
                              💬 Hubungi via WhatsApp
                            </a>
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </>
        )}

        {/* Info Box */}
        <div style={{ marginTop: 40, padding: 20, background: "rgba(47,143,78,.08)", borderRadius: 14, border: "1.5px solid rgba(47,143,78,.15)" }}>
          <div style={{ fontSize: 12, color: "#6b7c6d", lineHeight: 1.8 }}>
            <strong style={{ color: "#1C3A2B" }}>📞 Nama pembeli dan nomor WhatsApp harus sama</strong> dengan yang terdaftar saat melakukan pemesanan.<br />
            Jika ada pertanyaan, langsung hubungi admin melalui WhatsApp atau datang ke Pos Kampung Ciburial.
          </div>
        </div>
      </div>
    </div>
  );
}
