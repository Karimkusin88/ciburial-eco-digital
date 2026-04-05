"use client";
import { useState, useEffect } from "react";
import { supabase, isSupabaseReady } from "@/lib/supabase";

interface Stat { label: string; value: string | number; icon: string; sub?: string; color?: string; }

export default function DashboardPage() {
  const [stats, setStats] = useState<Stat[]>([]);
  const [transaksi, setTransaksi] = useState<any[]>([]);
  const [pengaduan, setPengaduan] = useState<any[]>([]);
  const [sampah, setSampah] = useState<any[]>([]);
  const [anak, setAnak] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  async function fetchAll() {
    if (!isSupabaseReady()) { setLoading(false); return; }
    const [kk, anggota, tx, pg, sp, ak, voting, absensi] = await Promise.all([
      supabase.from("keluarga").select("id,rt,status", { count: "exact" }),
      supabase.from("anggota_kk").select("id", { count: "exact" }),
      supabase.from("transaksi").select("*").order("tanggal", { ascending: false }).limit(6),
      supabase.from("pengaduan").select("status").order("created_at", { ascending: false }),
      supabase.from("saldo_poin").select("total_poin,total_setor_kg"),
      supabase.from("anak_posyandu").select("id", { count: "exact", head: true }),
      supabase.from("voting").select("id,status"),
      supabase.from("absensi_ronda").select("id", { count: "exact" }),
    ]);

    const totalKK = kk.count || 0;
    const totalWarga = anggota.count || 0;
    const totalSampahKg = (sp.data || []).reduce((a: number, s: any) => a + Number(s.total_setor_kg), 0);
    const totalPoin = (sp.data || []).reduce((a: number, s: any) => a + Number(s.total_poin), 0);
    const pengaduanMasuk = (pg.data || []).filter((p: any) => p.status === "masuk").length;
    const pengaduanSelesai = (pg.data || []).filter((p: any) => p.status === "selesai").length;
    const txMasuk = (tx.data || []).filter((t: any) => t.tipe === "masuk").reduce((a: number, t: any) => a + t.jumlah, 0);
    const txKeluar = (tx.data || []).filter((t: any) => t.tipe === "keluar").reduce((a: number, t: any) => a + t.jumlah, 0);

    setStats([
      { icon: "🏠", label: "Total KK", value: totalKK, sub: "Kepala Keluarga", color: "#2d5a40" },
      { icon: "👥", label: "Total Warga", value: totalWarga, sub: "Jiwa tercatat", color: "#1a3a6b" },
      { icon: "♻️", label: "Sampah Terkelola", value: `${totalSampahKg.toFixed(0)} kg`, sub: `${(sp.data || []).length} KK aktif`, color: "#4a8c5c" },
      { icon: "🪙", label: "Total Poin", value: totalPoin.toLocaleString(), sub: "Poin terdistribusi", color: "#b8943f" },
      { icon: "👶", label: "Anak Posyandu", value: ak.count || 0, sub: "Terdaftar", color: "#8b2020" },
      { icon: "📢", label: "Pengaduan", value: pengaduanMasuk, sub: `${pengaduanSelesai} selesai`, color: "#5a2d82" },
      { icon: "💰", label: "Dana Masuk", value: `Rp${(txMasuk / 1000000).toFixed(1)}jt`, sub: "Total donasi", color: "#2d5a40" },
      { icon: "📊", label: "Saldo Kas", value: `Rp${((txMasuk - txKeluar) / 1000000).toFixed(1)}jt`, sub: "Saldo saat ini", color: "#1a3a6b" },
    ]);
    if (tx.data) setTransaksi(tx.data);
    if (pg.data) setPengaduan(pg.data);
    if (sp.data) setSampah(sp.data);
    setLoading(false);
  }

  useEffect(() => { fetchAll(); }, []);

  // Hitung per RT
  const rtStats = ["01", "02", "03"].map(rt => ({
    rt,
    // dummy data karena belum bisa count per RT dari query ini
    warga: Math.floor(Math.random() * 50) + 30,
  }));

  const STATUS_COLOR: Record<string, string> = { masuk: "#b8943f", diproses: "#1a3a6b", selesai: "#2d5a40", ditolak: "#8b0000" };

  const pengaduanByStatus = ["masuk", "diproses", "selesai", "ditolak"].map(s => ({
    status: s,
    count: pengaduan.filter((p: any) => p.status === s).length,
  }));

  return (
    <div style={{ minHeight: "100vh", background: "#f5f0e8", fontFamily: "'Segoe UI',system-ui,sans-serif" }}>
      <header style={{ background: "#f5f0e8", borderBottom: "1px solid rgba(45,90,64,0.12)", padding: "14px 20px", position: "sticky", top: 0, zIndex: 10, display: "flex", alignItems: "center", gap: 12 }}>
        <a href="/admin" style={{ color: "#6b7c6d", textDecoration: "none", fontSize: 13 }}>← Admin</a>
        <span style={{ color: "#c8bfaa" }}>|</span>
        <div>
          <div style={{ fontWeight: 800, fontSize: 15, color: "#1a2e1f" }}>📊 Dashboard Analytics</div>
          <div style={{ fontSize: 10, color: "#7a9a7e", textTransform: "uppercase", letterSpacing: "0.08em" }}>Ciburial Eco-Digital Village</div>
        </div>
        <button onClick={fetchAll} style={{ marginLeft: "auto", background: "rgba(45,90,64,0.08)", border: "1px solid rgba(45,90,64,0.2)", borderRadius: 8, padding: "6px 12px", fontSize: 12, color: "#2d5a40", cursor: "pointer" }}>🔄 Refresh</button>
      </header>

      <div style={{ maxWidth: 960, margin: "0 auto", padding: "20px 16px" }}>
        {loading ? (
          <div style={{ textAlign: "center", padding: 60, color: "#7a9a7e" }}>Memuat data...</div>
        ) : (
          <>
            {/* Stats Grid */}
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill,minmax(200px,1fr))", gap: 12, marginBottom: 24 }}>
              {stats.map(s => (
                <div key={s.label} style={{ background: "white", borderRadius: 16, padding: "18px 16px", border: "1px solid rgba(45,90,64,0.1)", boxShadow: "0 1px 6px rgba(0,0,0,0.04)", borderLeft: `4px solid ${s.color || "#2d5a40"}` }}>
                  <div style={{ fontSize: 24, marginBottom: 8 }}>{s.icon}</div>
                  <div style={{ fontSize: 24, fontWeight: 900, color: s.color || "#2d5a40", lineHeight: 1 }}>{s.value}</div>
                  <div style={{ fontSize: 13, fontWeight: 600, color: "#1a2e1f", marginTop: 4 }}>{s.label}</div>
                  {s.sub && <div style={{ fontSize: 11, color: "#a8b5a9", marginTop: 2 }}>{s.sub}</div>}
                </div>
              ))}
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16, marginBottom: 16 }}>
              {/* Transaksi terbaru */}
              <div style={{ background: "white", borderRadius: 16, padding: 20, border: "1px solid rgba(45,90,64,0.1)", boxShadow: "0 1px 6px rgba(0,0,0,0.04)" }}>
                <h3 style={{ margin: "0 0 14px", fontSize: 14, fontWeight: 700, color: "#1a2e1f" }}>💰 Transaksi Terbaru</h3>
                {transaksi.length === 0 ? <div style={{ color: "#a8b5a9", fontSize: 13 }}>Belum ada data</div> :
                  transaksi.map((t: any, i: number) => (
                    <div key={t.id} style={{ display: "flex", alignItems: "center", gap: 10, padding: "8px 0", borderBottom: i < transaksi.length - 1 ? "1px solid rgba(45,90,64,0.07)" : "none" }}>
                      <div style={{ width: 8, height: 8, borderRadius: "50%", background: t.tipe === "masuk" ? "#2d5a40" : "#dc3545", flexShrink: 0 }}/>
                      <div style={{ flex: 1 }}>
                        <div style={{ fontSize: 13, color: "#1a2e1f", fontWeight: 500 }}>{t.keterangan?.slice(0, 35)}{t.keterangan?.length > 35 ? "..." : ""}</div>
                        <div style={{ fontSize: 11, color: "#a8b5a9" }}>{new Date(t.tanggal).toLocaleDateString("id-ID")}</div>
                      </div>
                      <div style={{ fontSize: 13, fontWeight: 700, color: t.tipe === "masuk" ? "#2d5a40" : "#dc3545" }}>
                        {t.tipe === "masuk" ? "+" : "-"}Rp{(t.jumlah / 1000).toFixed(0)}rb
                      </div>
                    </div>
                  ))
                }
              </div>

              {/* Status Pengaduan */}
              <div style={{ background: "white", borderRadius: 16, padding: 20, border: "1px solid rgba(45,90,64,0.1)", boxShadow: "0 1px 6px rgba(0,0,0,0.04)" }}>
                <h3 style={{ margin: "0 0 14px", fontSize: 14, fontWeight: 700, color: "#1a2e1f" }}>📢 Status Pengaduan</h3>
                {pengaduanByStatus.map(p => {
                  const total = pengaduan.length || 1;
                  const pct = Math.round((p.count / total) * 100);
                  return (
                    <div key={p.status} style={{ marginBottom: 12 }}>
                      <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 4 }}>
                        <span style={{ fontSize: 13, color: "#1a2e1f", textTransform: "capitalize", fontWeight: 500 }}>{p.status}</span>
                        <span style={{ fontSize: 13, fontWeight: 700, color: STATUS_COLOR[p.status] }}>{p.count}</span>
                      </div>
                      <div style={{ height: 8, background: "#f0ece4", borderRadius: 4, overflow: "hidden" }}>
                        <div style={{ height: "100%", width: `${pct}%`, background: STATUS_COLOR[p.status], borderRadius: 4, transition: "width 0.6s ease" }}/>
                      </div>
                    </div>
                  );
                })}
                <div style={{ marginTop: 14, padding: "10px 14px", background: "#fafaf8", borderRadius: 10 }}>
                  <span style={{ fontSize: 13, color: "#6b7c6d" }}>Total Laporan: </span>
                  <span style={{ fontSize: 14, fontWeight: 700, color: "#2d5a40" }}>{pengaduan.length}</span>
                </div>
              </div>
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
              {/* Bank Sampah Stats */}
              <div style={{ background: "white", borderRadius: 16, padding: 20, border: "1px solid rgba(45,90,64,0.1)", boxShadow: "0 1px 6px rgba(0,0,0,0.04)" }}>
                <h3 style={{ margin: "0 0 14px", fontSize: 14, fontWeight: 700, color: "#1a2e1f" }}>♻️ Bank Sampah</h3>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
                  {[
                    { label: "KK Aktif", value: sampah.length, icon: "🏠" },
                    { label: "Total Kg", value: `${sampah.reduce((a: number, s: any) => a + Number(s.total_setor_kg), 0).toFixed(0)} kg`, icon: "⚖️" },
                    { label: "Total Poin", value: sampah.reduce((a: number, s: any) => a + Number(s.total_poin), 0).toLocaleString(), icon: "🪙" },
                    { label: "Setara Pohon", value: `${Math.floor(sampah.reduce((a: number, s: any) => a + Number(s.total_setor_kg), 0) / 50)} 🌳`, icon: "🌍" },
                  ].map(s => (
                    <div key={s.label} style={{ background: "rgba(45,90,64,0.05)", borderRadius: 12, padding: "12px 14px" }}>
                      <div style={{ fontSize: 18, marginBottom: 4 }}>{s.icon}</div>
                      <div style={{ fontSize: 18, fontWeight: 900, color: "#2d5a40" }}>{s.value}</div>
                      <div style={{ fontSize: 11, color: "#7a9a7e" }}>{s.label}</div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Quick Links */}
              <div style={{ background: "white", borderRadius: 16, padding: 20, border: "1px solid rgba(45,90,64,0.1)", boxShadow: "0 1px 6px rgba(0,0,0,0.04)" }}>
                <h3 style={{ margin: "0 0 14px", fontSize: 14, fontWeight: 700, color: "#1a2e1f" }}>⚡ Akses Cepat</h3>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
                  {[
                    { href: "/admin/warga", icon: "👥", label: "Data Warga" },
                    { href: "/admin/posyandu", icon: "👶", label: "Posyandu" },
                    { href: "/admin/bank-sampah", icon: "♻️", label: "Bank Sampah" },
                    { href: "/admin/ronda", icon: "🔦", label: "Ronda" },
                    { href: "/admin/zakat", icon: "🕌", label: "Zakat" },
                    { href: "/admin", icon: "💰", label: "Keuangan" },
                  ].map(l => (
                    <a key={l.href} href={l.href} style={{ display: "flex", alignItems: "center", gap: 8, padding: "10px 12px", borderRadius: 12, background: "rgba(45,90,64,0.05)", border: "1px solid rgba(45,90,64,0.1)", textDecoration: "none", color: "#1a2e1f", fontSize: 13, fontWeight: 500, transition: "all 0.15s" }}
                      onMouseEnter={e => (e.currentTarget.style.background = "rgba(45,90,64,0.12)")}
                      onMouseLeave={e => (e.currentTarget.style.background = "rgba(45,90,64,0.05)")}>
                      <span>{l.icon}</span><span>{l.label}</span>
                    </a>
                  ))}
                </div>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
