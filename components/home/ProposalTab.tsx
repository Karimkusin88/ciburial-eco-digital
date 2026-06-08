"use client";
import { useState } from "react";
import { ALOKASI, Transaksi } from "./types";
import { fRp } from "./types";
import { FileText, BookOpen, Target, Lightbulb, Leaf, BarChart2, PenTool, Landmark, Wheat, Zap, ShoppingCart, Coins, Heart, Smartphone, Search, MapPin, Globe } from "lucide-react";

interface ProposalTabProps {
  transaksi: Transaksi[];
}

export default function ProposalTab({ transaksi }: ProposalTabProps) {
  const [propOpen, setPropOpen] = useState<number | null>(null);
  const [loadingDonasi, setLoadingDonasi] = useState(false);

  const bayarDonasi = async () => {
    const raw = window.prompt("Berapa nominal donasi yang ingin disalurkan? (Contoh: 50000)\nMinimal: Rp 10.000", "50000");
    if (!raw) return;
    const qty = parseInt(raw.replace(/[^0-9]/g, ''), 10);
    if (isNaN(qty) || qty < 10000) {
      alert("Nominal tidak valid atau kurang dari minimal Rp 10.000");
      return;
    }
    setLoadingDonasi(true);
    try {
      const res = await fetch("/api/midtrans/tokenize", {
        method: "POST",
        headers: { "Content-type": "application/json" },
        body: JSON.stringify({
          order_id: `DONASI-${Date.now()}`,
          gross_amount: qty,
          item_details: [{ id: "dn-custom", price: qty, quantity: 1, name: "Donasi Ciburial Eco-Digital" }]
        })
      });
      const data = await res.json();
      if (data.token && (window as any).snap) {
        (window as any).snap.pay(data.token, {
          onSuccess: function (r: any) { alert("Donasi sukses diterima! Dana langsung terdata di transparansi."); },
          onPending: function (r: any) { alert("Menunggu status pembayaran donasi."); },
          onError: function (r: any) { alert("Pembayaran gagal."); }
        });
      } else {
        alert("Server Midtrans belum nyambung! Cek .env di Settings Vercel. (Pesan sistem: " + (data.error || "Missing Token") + ")");
      }
    } catch (e) {
      alert("Error menghubungi server.");
    }
    setLoadingDonasi(false);
  };


  const sections = [
    {
      title: "Surat Pengantar", icon: <FileText size={20} strokeWidth={1.5} color="currentColor" />,
      content: (
        <div style={{ fontSize: 14, lineHeight: 1.9, color: "var(--ts)" }}>
          <div style={{ padding: "clamp(12px, 3vw, 16px) clamp(16px, 4vw, 20px)", background: "var(--cr)", borderRadius: 12, border: "1px solid var(--bo)", marginBottom: 20 }}>
            <div style={{ fontSize: 11, fontWeight: 700, color: "var(--tm)", letterSpacing: ".08em", marginBottom: 4 }}>Nomor: 01/CBM/III/2026 &nbsp;|&nbsp; Hal: Permohonan Dukungan & Kolaborasi</div>
            <div style={{ fontSize: 11, color: "var(--tm)" }}>Lampiran: 1 (Satu) Berkas Proposal</div>
          </div>
          <p style={{ marginBottom: 14 }}>Kepada Yth, <strong>[Instansi / Perusahaan / Donatur]</strong> di Tempat. Dengan hormat,</p>
          <p style={{ marginBottom: 14 }}>Puji syukur ke hadirat Tuhan Yang Maha Esa atas segala limpahan rahmat-Nya. Bersama surat ini, kami dari Irmas Al Husain Ciburial bermaksud menyampaikan proposal program <strong>"Ciburial Eco-Digital Village"</strong>.</p>
          <p style={{ marginBottom: 14 }}>Program ini adalah inisiatif swadaya masyarakat akar rumput untuk membangun ekosistem desa yang mandiri, cerdas, dan ramah lingkungan. Mengawinkan kekayaan alam organik dengan literasi teknologi digital untuk menciptakan ketahanan pangan, keamanan lingkungan, dan peningkatan SDM generasi muda.</p>
          <p style={{ marginBottom: 28 }}>Mengingat besarnya skala pergerakan ini, kami membuka ruang kolaborasi dan memohon dukungan dari Bapak/Ibu/Saudara guna merealisasikan cetak biru kemakmuran desa ini.</p>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(min(100%, 180px),1fr))", gap: "clamp(8px, 2vw, 12px)" }}>
            {[
              { role: "Ketua Irmas Al Husain Ciburial", name: "— Soon —", label: "Tanda Tangan & Stempel" },
              { role: "Ketua DKM Ciburial", name: "Bpk. Pupu Apipudin", label: "Mengetahui / Menyetujui" },
              { role: "Ketua RW Kp. Ciburial", name: "Bpk. Enang", label: "Mengetahui / Menyetujui" },
            ].map((s, i) => (
              <div key={i} style={{ padding: "clamp(12px, 3vw, 16px)", background: "var(--cr)", borderRadius: 12, border: "1px solid var(--bo)", textAlign: "center" }}>
                <div style={{ fontSize: 10, fontWeight: 700, color: "var(--tm)", letterSpacing: ".07em", textTransform: "uppercase", marginBottom: 40 }}>{s.label}</div>
                <div style={{ borderTop: "1px solid var(--bo)", paddingTop: 12 }}>
                  <div style={{ fontSize: 13, fontWeight: 700, color: "var(--tp)" }}>{s.name}</div>
                  <div style={{ fontSize: 11, color: "var(--go)", fontWeight: 600, marginTop: 3 }}>{s.role}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )
    },
    {
      title: "Bab I — Latar Belakang", icon: <BookOpen size={20} strokeWidth={1.5} color="currentColor" />,
      content: (
        <div style={{ fontSize: 14, lineHeight: 1.9, color: "var(--ts)" }}>
          <p style={{ marginBottom: 16 }}>Dunia bergerak sangat cepat menuju era digital, namun masyarakat desa seringkali hanya menjadi penonton. Di Kampung Ciburial, kami menolak tertinggal. Kami memiliki kekayaan alam yang melimpah — pertanian organik, peternakan komunal — namun potensinya kerap tidak maksimal akibat minimnya infrastruktur dan panjangnya rantai distribusi.</p>
          <p style={{ marginBottom: 16 }}>Oleh karena itu, melalui semangat gotong royong pemuda dan IRMAS Al Husain, lahir sebuah inisiatif bernama <strong>"Ciburial Eco-Digital Village"</strong>. Ini bukan sekadar program fisik seperti pemasangan lampu jalan atau internet. Ini adalah langkah nyata untuk mengawinkan kearifan lokal desa dengan teknologi tepat guna.</p>
          <p>Kami ingin memutus rantai ketertinggalan dengan mendigitalisasi hasil bumi warga tanpa perantara tengkulak, membangun ekosistem sirkular pengolahan limbah, serta membekali anak-anak desa dengan fasilitas belajar (Learning Hub). Tujuannya satu: agar generasi muda Ciburial mampu bersaing di era digital dan membawa kemakmuran bagi warga, tanpa harus meninggalkan identitas agamis dan kearifan kampung halamannya.</p>
        </div>
      )
    },
    {
      title: "Bab II — Tujuan Program", icon: <Target size={20} strokeWidth={1.5} color="currentColor" />,
      content: (
        <div style={{ display: "flex", flexDirection: "column", gap: "clamp(8px, 2vw, 10px)" }}>
          {[
            { n: "01", t: "Kemakmuran Masjid & Warga", d: "Mendukung operasional DKM Al Husain dan menginisiasi program sosial keagamaan yang modern, mandiri, dan transparan." },
            { n: "02", t: "Keamanan & Kenyamanan Lingkungan", d: "Menerangi akses jalan warga menuju masjid dengan Smart PJU serta mewujudkan lingkungan yang aman lewat pantauan CCTV." },
            { n: "03", t: "Peningkatan SDM Generasi Muda", d: "Menyediakan fasilitas belajar interaktif untuk mencetak generasi penerus yang kompeten dan melek teknologi." },
            { n: "04", t: "Kemandirian Ekonomi & Ketahanan Pangan", d: "Sistem perdagangan sirkular dari warga untuk warga, memadukan pertanian dan peternakan modern dengan pemesanan digital." },
          ].map((item, i) => (
            <div key={i} style={{ display: "flex", gap: 14, padding: "clamp(12px, 3vw, 16px) clamp(14px, 4vw, 18px)", background: "var(--cr)", borderRadius: 12, border: "1px solid var(--bo)" }}>
              <span className="fnt" style={{ fontSize: 12, fontWeight: 700, color: "var(--go)", minWidth: 22 }}>{item.n}</span>
              <div>
                <div style={{ fontSize: 14, fontWeight: 700, color: "var(--tp)", marginBottom: 4 }}>{item.t}</div>
                <div style={{ fontSize: 13, lineHeight: 1.7, color: "var(--ts)" }}>{item.d}</div>
              </div>
            </div>
          ))}
        </div>
      )
    },
    {
      title: "Bab III — Visi & Misi", icon: <Lightbulb size={20} strokeWidth={1.5} color="currentColor" />,
      content: (
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(200px,1fr))", gap: 12 }}>
          {[
            { icon: <Lightbulb size={20} strokeWidth={1.5} color="currentColor" />, t: "Syiar Digital & Kemakmuran Masjid", d: "Menjadikan Masjid Al Husain sebagai pusat ibadah, sosial, dan pergerakan pemuda yang berdaya guna melalui sentuhan teknologi tepat guna." },
            { icon: <BookOpen size={20} strokeWidth={1.5} color="currentColor" />, t: "SDM Unggul", d: "Lab Komputer & Perpustakaan sebagai inkubator pemuda Ciburial." },
            { icon: <Leaf size={20} strokeWidth={1.5} color="currentColor" />, t: "Ekonomi Sirkular & Smart Farming", d: "Marketplace lokal untuk bambu, sayuran organik, peternakan, dan produk daur ulang." },
            { icon: <BarChart2 size={20} strokeWidth={1.5} color="currentColor" />, t: "Tata Kelola Transparan", d: "Aliran dana umat dan kas swadaya yang terbuka secara real-time melalui dasbor digital desa terintegrasi." },
          ].map((v, i) => (
            <div key={i} style={{ padding: "clamp(14px, 4vw, 18px)", background: "var(--cr)", borderRadius: 13, border: "1px solid var(--bo)" }}>
              <div style={{ fontSize: 26, marginBottom: 10 }}>{v.icon}</div>
              <div style={{ fontSize: 13, fontWeight: 700, color: "var(--tp)", marginBottom: 6 }}>{v.t}</div>
              <div style={{ fontSize: 12, lineHeight: 1.7, color: "var(--ts)" }}>{v.d}</div>
            </div>
          ))}
        </div>
      )
    },
    {
      title: "Bab IV — Program Kerja Unggulan (5 Program)", icon: <PenTool size={20} strokeWidth={1.5} color="currentColor" />,
      content: (
        <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
          {[
            { icon: <Landmark size={20} strokeWidth={1.5} color="currentColor" />, t: "Serambi Belajar Ciburial & Balai Warga", d: "Ruang interaksi ramah lingkungan untuk pengajian pemuda, perpustakaan desa, dan inkubator melek teknologi." },
            { icon: <Wheat size={20} strokeWidth={1.5} color="currentColor" />, t: "Smart Farming & Circular Eco-Waste", d: "Integrasi pertanian sayur organik dan peternakan modern komunal. Limbah kotoran hewan → pupuk kompos, plastik → material infrastruktur daur ulang." },
            { icon: <Zap size={20} strokeWidth={1.5} color="currentColor" />, t: "Instalasi Smart PJU & Pos Ronda Digital", d: "Lampu jalan cerdas bertenaga surya dan jaringan CCTV untuk sistem keamanan lingkungan." },
            { icon: <ShoppingCart size={20} strokeWidth={1.5} color="currentColor" />, t: "Ciburial Local Commerce (Web & App)", d: "Marketplace desa untuk memasarkan karya bambu, hasil panen, dan produk peternakan dengan sistem delivery." },
            { icon: <Coins size={20} strokeWidth={1.5} color="currentColor" />, t: "Digitalisasi Kas Masjid & Donasi Warga", d: "Modernisasi pengelolaan dana umat dan swadaya melalui QRIS dan transfer bank terpadu guna menjangkau donatur luas tanpa batas." },
          ].map((p, i) => (
            <div key={i} style={{ display: "flex", gap: 14, padding: "clamp(12px, 3vw, 15px) clamp(14px, 4vw, 18px)", background: "var(--cr)", borderRadius: 12, border: "1px solid var(--bo)", alignItems: "flex-start" }}>
              <span style={{ fontSize: 22, minWidth: 28 }}>{p.icon}</span>
              <div>
                <div style={{ fontSize: 14, fontWeight: 700, color: "var(--tp)", marginBottom: 3 }}>{p.t}</div>
                <div style={{ fontSize: 13, lineHeight: 1.7, color: "var(--ts)" }}>{p.d}</div>
              </div>
            </div>
          ))}
        </div>
      )
    },
    {
      title: "Bab V — Tata Kelola & Struktur Kepengurusan", icon: <Landmark size={20} strokeWidth={1.5} color="currentColor" />,
      content: (
        <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
          {[
            {
              group: "A. Dewan Pelindung & Penasihat", items: [
                "Tokoh Agama: [Hasil Voting]",
                "Kepala Kewilayahan: Bpk. Enang (Ketua RW)",
                "Koordinator: Ketua RT 01 (Sarip Hidayat), RT 02 (Oneng), RT 03 (Mumun)",
              ]
            },
            {
              group: "B. Dewan Pengawas Kas & Donasi", items: [
                "Pengelola Dana DKM: Bpk. Pupu Apipudin",
              ]
            },
            {
              group: "C. Tim Eksekutif Lapangan (Irmas Al Husain Ciburial)", items: [
                "Ketua Pelaksana : [Hasil Voting]",
                "Sekretaris & Administrasi: [Hasil Voting]",
                "Bendahara Program: [Hasil Voting]",
              ]
            },
            {
              group: "D. 4 Divisi Operasional", items: [
                "Syiar & Sosial — Keagamaan, Dana Sosial & Kebencanaan",
                "Infrastruktur & Lingkungan — Konstruksi Hijau & Maintenance Aset",
                "Ekonomi Terapan — Smart Farming, Bank Sampah & UMKM",
                "Digital & Humas — IT, Media, & Transparansi Publik",
              ]
            },
          ].map((s, i) => (
            <div key={i}>
              <div style={{ fontSize: 12, fontWeight: 700, color: "var(--go)", letterSpacing: ".07em", textTransform: "uppercase", marginBottom: 10 }}>{s.group}</div>
              <div style={{ display: "flex", flexDirection: "column", gap: "clamp(4px, 1vw, 6px)" }}>
                {s.items.map((item, j) => (
                  <div key={j} style={{ padding: "clamp(8px, 2vw, 10px) clamp(12px, 3vw, 16px)", background: "var(--cr)", borderRadius: 10, border: "1px solid var(--bo)", fontSize: 13, color: "var(--ts)" }}>{item}</div>
                ))}
              </div>
            </div>
          ))}
        </div>
      )
    },
    {
      title: "Bab VI — RAB Tahap 1 (Target Rp 5.952.308)", icon: <Coins size={20} strokeWidth={1.5} color="currentColor" />,
      content: (
        <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
          <p style={{ fontSize: 13, lineHeight: 1.7, color: "var(--ts)", marginBottom: 8 }}>
            Untuk Tahap 1 ini, kami akan memfasilitasi pemasangan 20 Titik Penerangan Jalan Umum (PJU). Sebagai pijakan awal dan percontohan (pilot project), pengerjaan akan difokuskan di area RT 01 dan RT 02 terlebih dahulu. Keberhasilan di titik ini akan menjadi standar acuan sebelum program kita perluas secara bertahap ke seluruh wilayah kampung.
          </p>
          <p style={{ fontSize: 13, lineHeight: 1.7, color: "var(--ts)", marginBottom: 8, padding: "clamp(8px, 2vw, 12px) clamp(12px, 3vw, 16px)", background: "rgba(184,148,63,.07)", borderRadius: 10, border: "1px solid rgba(184,148,63,.18)" }}>
            <Lightbulb size={14} style={{ display: "inline", marginRight: 4 }} /> <strong>Catatan:</strong> Agar pengerjaan efisien, seluruh proses instalasi fisik dan kelistrikan akan dikerjakan langsung secara swadaya oleh pemuda lokal. Kami menggalang dukungan dana murni untuk kebutuhan belanja material.
          </p>
          <div style={{ padding: "clamp(12px, 3vw, 16px)", background: "var(--cr)", borderRadius: 13, border: "1px solid var(--bo)", marginBottom: 4 }}>
            <div style={{ fontSize: 14, fontWeight: 700, color: "var(--tp)", marginBottom: 12 }}>💡 Rincian Anggaran Material (20 Titik PJU - Tahap 1):</div>
            <ul style={{ fontSize: 13, lineHeight: 1.8, color: "var(--ts)", paddingLeft: 20, margin: 0 }}>
              <li><strong>20 Tiang PJU Stainless</strong> = Rp 3.469.200</li>
              <li><strong>20 pcs Lampu 22 Watt</strong> = Rp 837.000</li>
              <li><strong>Kabel (50 meter)</strong> = Rp 611.108</li>
              <li><strong>Semen & Pasir (untuk pondasi)</strong> = Rp 500.000</li>
              <li><strong>Cetakan PJU</strong> = Rp 385.000</li>
              <li><strong>Cat & Material Pendukung</strong> = Rp 150.000</li>
            </ul>
          </div>
          <div style={{ padding: "clamp(12px, 3vw, 16px) clamp(16px, 4vw, 22px)", background: "var(--fo)", borderRadius: 14, display: "flex", justifyContent: "space-between", flexWrap: "wrap", gap: 8, marginTop: 4 }}>
            <span style={{ fontSize: 13, fontWeight: 700, color: "var(--cr)" }}>TOTAL KEBUTUHAN TAHAP 1</span>
            <div style={{ textAlign: "right" }}>
              <span className="fnt" style={{ fontSize: 22, fontWeight: 600, color: "var(--gl)" }}>Rp 5.952.308</span>
              <div style={{ fontSize: 11, color: "rgba(250,248,243,.45)" }}>Lima Juta Sembilan Ratus Lima Puluh Dua Ribu Tiga Ratus Delapan Rupiah</div>
            </div>
          </div>
        </div>
      )
    },
    {
      title: "Bab VII — Penyaluran Dana & Penutup", icon: <Heart size={20} strokeWidth={1.5} color="currentColor" />,
      content: (
        <div>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(min(100%, 200px),1fr))", gap: "clamp(8px, 2vw, 12px)", marginBottom: 24 }}>
            {[
              { id: "bank", icon: <Landmark size={24} strokeWidth={1.5} />, t: "Rekening Bank Resmi", sub: "Bank SeaBank", detail: "No. Rek: 901355550666\nA.n: Ubay Rahmat H" },
              { id: "evm", icon: <Coins size={24} strokeWidth={1.5} />, t: "Crypto (EVM)", sub: "ETH / BSC / Polygon", detail: "0x71723715478b344164e992b49ae1fceb6467888b" },
              { id: "paypal", icon: <Globe size={24} strokeWidth={1.5} />, t: "PayPal", sub: "Donasi Internasional", detail: "@ciburialecodigtal" },
              { id: "midtrans", icon: <Smartphone size={24} strokeWidth={1.5} />, t: "QRIS & E-Wallet", sub: "Secara Otomatis via Midtrans", detail: loadingDonasi ? "⏳ MEMUAT MIDTRANS..." : "SILAKAN KLIK KOTAK INI UNTUK MULAI DONASI" },
            ].map((m, i) => (
              <div key={i} onClick={m.id === "midtrans" ? bayarDonasi : undefined} style={{ padding: "clamp(14px, 4vw, 18px)", background: "var(--fo)", borderRadius: 14, cursor: m.id === "midtrans" ? (loadingDonasi ? "wait" : "pointer") : "default", opacity: m.id === "midtrans" && loadingDonasi ? 0.6 : 1, transition: "opacity .2s, background .2s" }}
                onMouseEnter={e => m.id === "midtrans" ? (e.currentTarget.style.background = "var(--cd)") : undefined}
                onMouseLeave={e => m.id === "midtrans" ? (e.currentTarget.style.background = "var(--fo)") : undefined}
              >
                <div style={{ fontSize: 24, marginBottom: 8 }}>{m.icon}</div>
                <div style={{ fontSize: 13, fontWeight: 700, color: "var(--cr)", marginBottom: 4 }}>{m.t}</div>
                <div style={{ fontSize: 11, color: "rgba(250,248,243,.5)" }}>{m.sub}</div>

                {m.detail && (
                  <div style={{ fontSize: 11, color: m.id === "midtrans" ? "var(--gl)" : "rgba(250,248,243,.35)", fontWeight: m.id === "midtrans" ? 700 : 400, marginTop: 9, whiteSpace: "pre-line" }}>
                    {m.detail}
                  </div>
                )}
              </div>
            ))}
          </div>
          <p style={{ fontSize: 14, lineHeight: 1.9, color: "var(--ts)", marginBottom: 24 }}>
            Setiap dukungan Anda adalah lentera nyata bagi jalan desa kami, buku dan ilmu bagi generasi muda kami, serta roda penggerak bagi kemakmuran warga Ciburial. Kami percaya, kemajuan teknologi akan membawa keberkahan jika disandingkan dengan kelestarian alam dan niat tulus bergotong royong.
          </p>
          <div style={{ padding: "clamp(20px, 5vw, 26px) clamp(20px, 5vw, 32px)", background: "var(--ea)", borderRadius: 18 }}>
            <p dir="rtl" className="fnt" style={{ fontSize: "clamp(16px,2.5vw,22px)", lineHeight: 1.9, color: "var(--cr)", marginBottom: 14 }}>
              رَبَّنَا آتِنَا فِي الدُّنْيَا حَسَنَةً وَفِي الْآخِرَةِ حَسَنَةً وَقِنَا عَذَابَ النَّارِ
            </p>
            <p style={{ fontSize: 13, fontStyle: "italic", color: "rgba(250,248,243,.55)", lineHeight: 1.8 }}>
              "Ya Tuhan kami, berilah mereka kebaikan di dunia dan di akhirat, dan lindungilah dari siksa neraka."
              <span style={{ fontStyle: "normal", fontWeight: 700, color: "var(--gl)" }}> — QS. Al-Baqarah: 201</span>
            </p>
          </div>
          <div style={{ marginTop: 22, textAlign: "right" }}>
            <div style={{ fontSize: 13, fontWeight: 700, color: "var(--tp)" }}>Hormat Kami,</div>
            <div className="fnt" style={{ fontSize: 22, fontWeight: 600, color: "var(--fo)", fontStyle: "italic" }}>Irmas Al Husain Ciburial</div>
          </div>
        </div>
      )
    },
  ];

  return (
    <div className="pi" style={{ paddingTop: "clamp(48px,8vw,106px)", paddingBottom: "clamp(48px,8vw,106px)" }}>
      <div style={{ maxWidth: 900, margin: "0 auto", padding: "0 clamp(16px,3vw,28px)" }}>

        {/* Header */}
        <div style={{ textAlign: "center", marginBottom: 48 }}>
          <div className="dl dlc" />
          <div style={{ fontSize: 10, fontWeight: 700, letterSpacing: ".2em", textTransform: "uppercase", color: "var(--go)", marginBottom: 14 }}>Dokumen Resmi — No. 01/CBM/III/2026</div>
          <h1 className="fnt" style={{ fontSize: "clamp(30px,5vw,58px)", fontWeight: 300, color: "var(--fo)", lineHeight: 1.05, letterSpacing: "-.025em", marginBottom: 10 }}>
            Proposal Program<br /><em>Kemakmuran Kampung</em>
          </h1>
          <p className="fnt" style={{ fontSize: "clamp(14px,2vw,18px)", fontStyle: "italic", color: "var(--em)", marginBottom: 14 }}>
            Inovasi Desa Mandiri Berbasis Kearifan Lokal dan Teknologi Tepat Guna
          </p>
          <p style={{ fontSize: 13, color: "var(--ts)", lineHeight: 1.7, maxWidth: 480, margin: "0 auto" }}>
            Diajukan oleh Irmas Al Husain Ciburial<br />
            Kp. Ciburial RW 08, Desa Hanjuang, Kec. Bungbulang, Kab. Garut 44165
          </p>
        </div>

        {/* Info strip */}
        <div style={{ display: "flex", flexWrap: "wrap", gap: 10, justifyContent: "center", marginBottom: 44 }}>
          {[{ icon: <Search size={24} strokeWidth={1.5} />, l: "www.ciburial.my.id" }, { icon: <FileText size={16} strokeWidth={1.5} />, l: "ciburial.smarthub@gmail.com" }, { icon: <MapPin size={16} strokeWidth={1.5} />, l: "Garut, Jawa Barat 44165" }].map((item, i) => (
            <div key={i} style={{ display: "flex", alignItems: "center", gap: 8, padding: "clamp(6px, 2vw, 9px) clamp(12px, 3vw, 18px)", background: "var(--cw)", border: "1px solid var(--bo)", borderRadius: 99 }}>
              <span>{item.icon}</span><span style={{ fontSize: 12, fontWeight: 600, color: "var(--ts)" }}>{item.l}</span>
            </div>
          ))}
        </div>

        {/* Accordion sections */}
        {sections.map((section, i) => (
          <div key={i} style={{ marginBottom: 8 }}>
            <button
              onClick={() => setPropOpen(propOpen === i ? null : i)}
              style={{ width: "100%", display: "flex", justifyContent: "space-between", alignItems: "center", padding: "clamp(16px, 4vw, 20px) clamp(16px, 4vw, 26px)", background: propOpen === i ? "var(--fo)" : "var(--cw)", border: "1px solid var(--bo)", borderRadius: propOpen === i ? "18px 18px 0 0" : 18, cursor: "pointer", transition: "background .25s,border-radius .25s", textAlign: "left" }}
            >
              <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                <span style={{ fontSize: 20 }}>{section.icon}</span>
                <span style={{ fontSize: 15, fontWeight: 700, color: propOpen === i ? "var(--cr)" : "var(--tp)" }}>{section.title}</span>
              </div>
              <span style={{ fontSize: 20, color: propOpen === i ? "var(--gl)" : "var(--tm)", transition: "transform .3s", transform: propOpen === i ? "rotate(45deg)" : "rotate(0)", display: "block" }}>+</span>
            </button>
            <div className={`ac ${propOpen === i ? "op" : ""}`} style={{ border: "1px solid var(--bo)", borderTop: "none", borderRadius: "0 0 18px 18px", padding: propOpen === i ? "clamp(16px, 4vw, 26px)" : "0 clamp(16px, 4vw, 26px)", background: "var(--cw)" }}>
              {section.content}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
