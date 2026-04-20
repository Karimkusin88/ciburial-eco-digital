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
  catatan: string;
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

export default function AdminOrdersPage() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterStatus, setFilterStatus] = useState<string>("semua");
  const [editingOrder, setEditingOrder] = useState<string | null>(null);
  const [resiInput, setResiInput] = useState("");
  const [statusMap, setStatusMap] = useState<Record<string, string>>({});
  const [sendingWa, setSendingWa] = useState<string | null>(null);

  const STATUS_OPTIONS = [
    { v: "pending", l: "⏳ Pending", warna: "#FFB84D" },
    { v: "dibayar", l: "✅ Dibayar", warna: "#4FBF7E" },
    { v: "diproses", l: "📦 Diproses", warna: "#0066CC" },
    { v: "dikirim", l: "🚚 Dikirim", warna: "#6366F1" },
    { v: "selesai", l: "🎉 Selesai", warna: "#2F8F4E" },
    { v: "dibatalkan", l: "❌ Dibatalkan", warna: "#B8472F" },
  ];

  useEffect(() => {
    fetchOrders();
    const interval = setInterval(fetchOrders, 5000); // Realtime check setiap 5 detik
    return () => clearInterval(interval);
  }, []);

  const fetchOrders = async () => {
    if (!isSupabaseReady()) {
      setLoading(false);
      return;
    }
    try {
      const { data, error } = await supabase
        .from("orders_marketplace")
        .select("*")
        .order("created_at", { ascending: false });
      
      if (error) throw error;
      setOrders(data || []);
    } catch (e) {
      console.error("Error fetching orders:", e);
    }
    setLoading(false);
  };

  const updateOrderStatus = async (orderId: string, newStatus: string) => {
    if (!isSupabaseReady()) return;
    try {
      const { error } = await supabase
        .from("orders_marketplace")
        .update({ status: newStatus })
        .eq("id", orderId);
      
      if (error) throw error;
      
      setOrders(orders.map(o => o.id === orderId ? {...o, status: newStatus as any} : o));
      setEditingOrder(null);
    } catch (e) {
      alert("Error update status");
    }
  };

  const updateResi = async (orderId: string, resi: string) => {
    if (!isSupabaseReady() || !resi) return;
    try {
      const { error } = await supabase
        .from("orders_marketplace")
        .update({ no_resi: resi })
        .eq("id", orderId);
      
      if (error) throw error;
      
      setOrders(orders.map(o => o.id === orderId ? {...o, no_resi: resi} : o));
      setEditingOrder(null);
      setResiInput("");
      alert("✅ No. resi disimpan!");
    } catch (e) {
      alert("Error update resi");
    }
  };

  const sendWaBlast = async (order: Order) => {
    setSendingWa(order.id);
    try {
      const statusLabel = STATUS_OPTIONS.find(s => s.v === order.status)?.l || order.status;
      const message = order.no_resi 
        ? `Halo ${order.nama_pembeli}! 👋\n\nStatus pesanan Anda: ${statusLabel}\n🚚 No. Resi: ${order.no_resi}\n\nOrder ID: ${order.order_id}\n\nTerima kasih telah berbelanja di Ciburial Marketplace! 🙏`
        : `Halo ${order.nama_pembeli}! 👋\n\nStatus pesanan Anda: ${statusLabel}\n\nOrder ID: ${order.order_id}\n\nTerima kasih telah berbelanja di Ciburial Marketplace! 🙏`;

      const waLink = `https://wa.me/${order.no_wa.replace(/[^0-9]/g, '')}?text=${encodeURIComponent(message)}`;
      window.open(waLink, "_blank");
      
      // Log ke database (opsional)
      alert("✅ Tautan WhatsApp terbuka!");
    } catch (e) {
      alert("Error membuka WhatsApp");
    }
    setSendingWa(null);
  };

  const filtered = filterStatus === "semua" 
    ? orders 
    : orders.filter(o => o.status === filterStatus);

  const fRp = (num: number) => new Intl.NumberFormat("id-ID", { style: "currency", currency: "IDR", minimumFractionDigits: 0 }).format(num);

  if (loading) {
    return (
      <div style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", background: "linear-gradient(135deg,#FAF8F3,#F0EFE8)" }}>
        <div style={{ fontSize: 48 }}>⏳ Memuat pesanan...</div>
      </div>
    );
  }

  return (
    <div style={{ minHeight: "100vh", background: "linear-gradient(135deg,#FAF8F3,#F0EFE8)", paddingTop: 80, paddingBottom: 40 }}>
      <div style={{ maxWidth: 1200, margin: "0 auto", padding: "0 20px" }}>
        {/* Header */}
        <div style={{ display: "flex", alignItems: "center", gap: 16, marginBottom: 32 }}>
          <a href="/admin" style={{ color: "#2F8F4E", textDecoration: "none", fontSize: 14, fontWeight: 700 }}>← ADMIN</a>
          <div style={{ width: 1, height: 24, background: "rgba(47,143,78,.15)" }} />
          <h1 style={{ margin: 0, color: "#1C3A2B", fontSize: 32, fontWeight: 800 }}>📋 Kelola Pesanan</h1>
        </div>

        {/* Filter Status */}
        <div style={{ display: "flex", gap: 8, marginBottom: 24, flexWrap: "wrap" }}>
          {[{ v: "semua", l: "Semua" }, ...STATUS_OPTIONS].map(s => (
            <button
              key={s.v}
              onClick={() => setFilterStatus(s.v)}
              style={{
                padding: "8px 16px",
                borderRadius: 10,
                border: `2px solid ${filterStatus === s.v ? (s as any).warna || "#2F8F4E" : "rgba(47,143,78,.2)"}`,
                background: filterStatus === s.v ? `${(s as any).warna || "#2F8F4E"}15` : "white",
                color: filterStatus === s.v ? (s as any).warna || "#2F8F4E" : "#6b7c6d",
                fontSize: 13,
                fontWeight: 700,
                cursor: "pointer",
                transition: "all 0.2s"
              }}
            >
              {s.l}
            </button>
          ))}
        </div>

        {/* Stats */}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(160px,1fr))", gap: 16, marginBottom: 24 }}>
          {[
            { label: "Total Pesanan", val: orders.length, icon: "📊" },
            { label: "Pending", val: orders.filter(o => o.status === "pending").length, icon: "⏳" },
            { label: "Dalam Proses", val: orders.filter(o => o.status === "diproses").length, icon: "📦" },
            { label: "Selesai", val: orders.filter(o => o.status === "selesai").length, icon: "🎉" },
          ].map((stat, i) => (
            <div key={i} style={{ background: "white", borderRadius: 14, padding: 16, border: "1.5px solid rgba(47,143,78,.12)" }}>
              <div style={{ fontSize: 28, marginBottom: 8 }}>{stat.icon}</div>
              <div style={{ fontSize: 14, color: "#6b7c6d", marginBottom: 4 }}>{stat.label}</div>
              <div style={{ fontSize: 24, fontWeight: 800, color: "#1C3A2B" }}>{stat.val}</div>
            </div>
          ))}
        </div>

        {/* Orders Table */}
        <div style={{ background: "white", borderRadius: 16, border: "1.5px solid rgba(47,143,78,.12)", overflow: "hidden", boxShadow: "0 4px 16px rgba(47,143,78,.06)" }}>
          {filtered.length === 0 ? (
            <div style={{ padding: 60, textAlign: "center", color: "rgba(47,143,78,.2)" }}>
              <div style={{ fontSize: 48, marginBottom: 16 }}>📭</div>
              <div style={{ fontSize: 16, color: "#6b7c6d" }}>Belum ada pesanan</div>
            </div>
          ) : (
            <div style={{ overflowX: "auto" }}>
              <table style={{ width: "100%", borderCollapse: "collapse" }}>
                <thead>
                  <tr style={{ background: "rgba(47,143,78,.05)", borderBottom: "2px solid rgba(47,143,78,.15)" }}>
                    {["Order ID", "Pembeli", "Total", "Status", "Resi", "Aksi"].map(h => (
                      <th key={h} style={{ padding: "12px 16px", textAlign: "left", fontSize: 12, fontWeight: 800, color: "#6b7c6d", textTransform: "uppercase", letterSpacing: "0.06em" }}>
                        {h}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {filtered.map((order, i) => {
                    const statusInfo = STATUS_OPTIONS.find(s => s.v === order.status);
                    return (
                      <tr key={order.id} style={{ borderBottom: i < filtered.length - 1 ? "1px solid rgba(47,143,78,.08)" : "none", hover: { background: "rgba(47,143,78,.02)" } }}>
                        <td style={{ padding: "12px 16px", fontSize: 12, fontFamily: "monospace", fontWeight: 700, color: "#2F8F4E" }}>
                          {order.order_id}
                          <div style={{ fontSize: 10, color: "#9A8C85", marginTop: 2 }}>
                            {new Date(order.created_at).toLocaleDateString("id-ID")}
                          </div>
                        </td>
                        <td style={{ padding: "12px 16px" }}>
                          <div style={{ fontSize: 13, fontWeight: 600, color: "#1C3A2B" }}>{order.nama_pembeli}</div>
                          <div style={{ fontSize: 11, color: "#9A8C85" }}>{order.no_wa}</div>
                        </td>
                        <td style={{ padding: "12px 16px", fontSize: 14, fontWeight: 700, color: "#1C3A2B" }}>
                          {fRp(order.total_bayar)}
                        </td>
                        <td style={{ padding: "12px 16px" }}>
                          {editingOrder === order.id ? (
                            <select
                              value={statusMap[order.id] || order.status}
                              onChange={(e) => {
                                setStatusMap({ ...statusMap, [order.id]: e.target.value });
                              }}
                              style={{
                                padding: "6px 10px",
                                borderRadius: 8,
                                border: "1.5px solid rgba(47,143,78,.2)",
                                fontSize: 12,
                                fontWeight: 600,
                                cursor: "pointer",
                              }}
                            >
                              {STATUS_OPTIONS.map(s => (
                                <option key={s.v} value={s.v}>{s.l}</option>
                              ))}
                            </select>
                          ) : (
                            <div style={{
                              display: "inline-block",
                              padding: "6px 12px",
                              borderRadius: 8,
                              background: `${statusInfo?.warna}15`,
                              color: statusInfo?.warna,
                              fontSize: 12,
                              fontWeight: 700,
                              border: `1.5px solid ${statusInfo?.warna}40`,
                            }}>
                              {statusInfo?.l || order.status}
                            </div>
                          )}
                        </td>
                        <td style={{ padding: "12px 16px" }}>
                          {editingOrder === order.id ? (
                            <input
                              type="text"
                              value={resiInput}
                              onChange={(e) => setResiInput(e.target.value)}
                              placeholder="Input no resi..."
                              style={{
                                padding: "6px 10px",
                                borderRadius: 8,
                                border: "1.5px solid rgba(47,143,78,.2)",
                                fontSize: 12,
                                width: 120,
                              }}
                            />
                          ) : (
                            <div style={{ fontSize: 12, fontFamily: "monospace", fontWeight: 600, color: order.no_resi ? "#2F8F4E" : "#9A8C85" }}>
                              {order.no_resi || "-"}
                            </div>
                          )}
                        </td>
                        <td style={{ padding: "12px 16px" }}>
                          <div style={{ display: "flex", gap: 6 }}>
                            {editingOrder === order.id ? (
                              <>
                                <button
                                  onClick={() => {
                                    updateOrderStatus(order.id, statusMap[order.id] || order.status);
                                    if (resiInput) updateResi(order.id, resiInput);
                                  }}
                                  style={{
                                    padding: "6px 10px",
                                    borderRadius: 6,
                                    background: "#2F8F4E",
                                    color: "white",
                                    border: "none",
                                    fontSize: 11,
                                    fontWeight: 700,
                                    cursor: "pointer",
                                  }}
                                >
                                  ✓
                                </button>
                                <button
                                  onClick={() => {
                                    setEditingOrder(null);
                                    setResiInput("");
                                  }}
                                  style={{
                                    padding: "6px 10px",
                                    borderRadius: 6,
                                    background: "#B8472F",
                                    color: "white",
                                    border: "none",
                                    fontSize: 11,
                                    fontWeight: 700,
                                    cursor: "pointer",
                                  }}
                                >
                                  ✕
                                </button>
                              </>
                            ) : (
                              <>
                                <button
                                  onClick={() => {
                                    setEditingOrder(order.id);
                                    setResiInput(order.no_resi || "");
                                    setStatusMap({ [order.id]: order.status });
                                  }}
                                  style={{
                                    padding: "6px 10px",
                                    borderRadius: 6,
                                    background: "rgba(47,143,78,.08)",
                                    color: "#2F8F4E",
                                    border: "1.5px solid rgba(47,143,78,.2)",
                                    fontSize: 11,
                                    fontWeight: 700,
                                    cursor: "pointer",
                                  }}
                                >
                                  ✏️ Edit
                                </button>
                                <button
                                  onClick={() => sendWaBlast(order)}
                                  disabled={sendingWa === order.id}
                                  style={{
                                    padding: "6px 10px",
                                    borderRadius: 6,
                                    background: sendingWa === order.id ? "#ccc" : "#25D366",
                                    color: "white",
                                    border: "none",
                                    fontSize: 11,
                                    fontWeight: 700,
                                    cursor: sendingWa === order.id ? "not-allowed" : "pointer",
                                  }}
                                >
                                  💬 WA
                                </button>
                              </>
                            )}
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
