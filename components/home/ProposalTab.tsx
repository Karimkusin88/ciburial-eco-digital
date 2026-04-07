"use client";
import { useState } from "react";
import { ALOKASI, Transaksi } from "./types";
import { fRp } from "./types";

interface ProposalTabProps {
  transaksi: Transaksi[];
}

export default function ProposalTab({ transaksi }: ProposalTabProps) {
  const [propOpen, setPropOpen] = useState<number | null>(null);

  const sections = [
    {
      title: "Surat Pengantar", icon: "📜",
      content: (
        <div style={{ fontSize: 14, lineHeight: 1.9, color: "var(--ts)" }}>
          <div style={{ padding: "16px 20px", background: "var(--cr)", borderRadius: 12, border: "1px solid var(--bo)", marginBottom: 20 }}>
            <div style={{ fontSize: 11, fontWeight: 700, color: "var(--tm)", letterSpacing: ".08em", marginBottom: 4 }}>Nomor: 01/CBM/III/2026 &nbsp;|&nbsp; Hal: Permohonan Dukungan & Kolaborasi</div>
            <div style={{ fontSize: 11, color: "var(--tm)" }}>Lampiran: 1 (Satu) Berkas Proposal</div>
          </div>
          <p style={{ marginBottom: 14 }}>Kepada Yth, <strong>[Nama Instansi / Perusahaan / Calon Donatur]</strong> di Tempat. Dengan hormat,</p>
          <p style={{ marginBottom: 14 }}>Puji syukur ke hadirat Tuhan Yang Maha Esa atas segala limpahan rahmat-Nya. Bersama surat ini, kami dari Paguyuban Warga & Pemuda Ciburial Makers bermaksud menyampaikan proposal program <strong>"Ciburial Eco-Digital Village"</strong>.</p>
          <p style={{ marginBottom: 14 }}>Program ini adalah inisiatif swadaya masyarakat akar rumput untuk membangun ekosistem desa yang mandiri, cerdas, dan ramah lingkungan. Mengawinkan kekayaan alam organik dengan literasi teknologi digital untuk menciptakan ketahanan pangan, keamanan lingkungan, dan peningkatan SDM generasi muda.</p>
          <p style={{ marginBottom: 28 }}>Mengingat besarnya skala pergerakan ini, kami membuka ruang kolaborasi dan memohon dukungan dari Bapak/Ibu/Saudara guna merealisasikan cetak biru kemakmuran desa ini.</p>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(180px,1fr))", gap: 12 }}>
            {[
              { role: "Ketua Pemuda Ciburial Makers", name: "— Soon —", label: "Tanda Tangan & Stempel" },
              { role: "Ketua DKM Ciburial", name: "Bpk. Pupu Apipudin", label: "Mengetahui / Menyetujui" },
              { role: "Ketua RW Kp. Ciburial", name: "Bpk. Enang", label: "Mengetahui / Menyetujui" },
            ].map((s, i) => (
              <div key={i} style={{ padding: "16px", background: "var(--cr)", borderRadius: 12, border: "1px solid var(--bo)", textAlign: "center" }}>
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
      title: "Bab I — Latar Belakang", icon: "📖",
      content: (
        <div style={{ fontSize: 14, lineHeight: 1.9, color: "var(--ts)" }}>
          <p style={{ marginBottom: 16 }}>Dunia bergerak sangat cepat menuju era digital, namun masyarakat desa seringkali hanya menjadi penonton. Di Kampung Ciburial, kami menolak tertinggal. Kami memiliki kekayaan alam yang melimpah — pertanian organik, peternakan komunal, dan mahakarya bambu — namun potensinya kerap tidak maksimal akibat minimnya infrastruktur dan panjangnya rantai distribusi.</p>
          <p style={{ marginBottom: 16 }}>Oleh karena itu, lahir sebuah inisiatif raksasa bernama <strong>"Ciburial Eco-Digital Village"</strong>. Ini bukan sekadar program pemasangan internet atau lampu jalan. Ini adalah <em>lompatan besar (quantum leap)</em> untuk mengawinkan kearifan lokal dengan teknologi masa depan.</p>
          <p>Kami ingin memutus rantai ketertinggalan dengan mendigitalisasi hasil bumi warga secara langsung tanpa tengkulak, membangun ekosistem sirkular di mana limbah diolah menjadi pupuk dan material infrastruktur yang berharga, serta membekali anak-anak desa dengan Learning Hub. Tujuannya: agar generasi muda Ciburial mampu bersaing secara global tanpa harus meninggalkan identitas dan kampung halamannya.</p>
        </div>
      )
    },
    {
      title: "Bab II — Tujuan Program", icon: "🎯",
      content: (
        <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
          {[
            { n: "01", t: "Kemakmuran Masjid & Warga", d: "Membantu kas DKM agar kegiatan keagamaan dan sosial warga berjalan optimal." },
            { n: "02", t: "Keamanan & Kenyamanan Lingkungan", d: "Menerangi jalan desa dengan Smart PJU dan mewujudkan Pos Ronda Digital berbasis pantauan CCTV." },
            { n: "03", t: "Peningkatan SDM Generasi Muda", d: "Menyediakan fasilitas belajar interaktif untuk mencetak generasi penerus yang kompeten dan melek teknologi." },
            { n: "04", t: "Kemandirian Ekonomi & Ketahanan Pangan", d: "Sistem perdagangan sirkular dari warga untuk warga, memadukan pertanian dan peternakan modern dengan pemesanan digital." },
          ].map((item, i) => (
            <div key={i} style={{ display: "flex", gap: 14, padding: "16px 18px", background: "var(--cr)", borderRadius: 12, border: "1px solid var(--bo)" }}>
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
      title: "Bab III — Visi & Misi", icon: "💡",
      content: (
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(200px,1fr))", gap: 12 }}>
          {[
            { icon: "💡", t: "Infrastruktur Cerdas", d: "Balai Serba Guna berkonsep hijau, Smart PJU, Jaringan CCTV, dan Internet Mandiri." },
            { icon: "📚", t: "SDM Unggul", d: "Lab Komputer & Perpustakaan sebagai inkubator pemuda Ciburial." },
            { icon: "🌱", t: "Ekonomi Sirkular & Smart Farming", d: "Marketplace lokal untuk bambu, sayuran organik, peternakan, dan produk daur ulang." },
            { icon: "📊", t: "Tata Kelola Transparan", d: "Dana kemakmuran terbuka real-time, dari fiat konvensional hingga aset kripto (Web3)." },
          ].map((v, i) => (
            <div key={i} style={{ padding: "18px", background: "var(--cr)", borderRadius: 13, border: "1px solid var(--bo)" }}>
              <div style={{ fontSize: 26, marginBottom: 10 }}>{v.icon}</div>
              <div style={{ fontSize: 13, fontWeight: 700, color: "var(--tp)", marginBottom: 6 }}>{v.t}</div>
              <div style={{ fontSize: 12, lineHeight: 1.7, color: "var(--ts)" }}>{v.d}</div>
            </div>
          ))}
        </div>
      )
    },
    {
      title: "Bab IV — Program Kerja Unggulan (5 Program)", icon: "🛠️",
      content: (
        <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
          {[
            { icon: "🏛️", t: "Ciburial Learning Hub & Balai Warga", d: "Balai Serba Guna berkonsep ramah lingkungan (bambu & baja ringan). Berfungsi sebagai pusat interaksi warga, perpustakaan desa, dan laboratorium komputer." },
            { icon: "🌾", t: "Smart Farming & Circular Eco-Waste", d: "Integrasi pertanian sayur organik dan peternakan modern komunal. Limbah kotoran hewan → pupuk kompos, plastik → material infrastruktur daur ulang." },
            { icon: "🔦", t: "Instalasi Smart PJU & Pos Ronda Digital", d: "Lampu jalan cerdas bertenaga surya dan jaringan CCTV untuk sistem keamanan lingkungan." },
            { icon: "🛒", t: "Ciburial Local Commerce (Web & App)", d: "Marketplace desa untuk memasarkan karya bambu, hasil panen, dan produk peternakan dengan sistem delivery." },
            { icon: "💰", t: "Digitalisasi Kas Donasi (Fiat & Crypto)", d: "Sentralisasi dana melalui QRIS, Rekening Bank, dan Crypto Wallet (EVM Compatible) untuk menjangkau filantropis global." },
          ].map((p, i) => (
            <div key={i} style={{ display: "flex", gap: 14, padding: "15px 18px", background: "var(--cr)", borderRadius: 12, border: "1px solid var(--bo)", alignItems: "flex-start" }}>
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
      title: "Bab V — Tata Kelola & Struktur Kepengurusan", icon: "🏛️",
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
              group: "C. Tim Eksekutif Lapangan (Ciburial Makers)", items: [
                "Ketua Pelaksana (PM): [Hasil Voting]",
                "Sekretaris & Administrasi: [Hasil Voting]",
                "Bendahara Program: [Hasil Voting]",
              ]
            },
            {
              group: "D. 5 Divisi Operasional", items: [
                "🏗️ Green Build — Infrastruktur & Konstruksi Hijau",
                "💻 Digital Hub — IT, Jaringan & Web3",
                "🌾 Eco-Waste & Farming — Smart Farming & Lingkungan",
                "🛒 Local Commerce — Ekonomi Kreatif & UMKM",
                "📢 Public Relations — Humas & Transparansi Publik",
              ]
            },
          ].map((s, i) => (
            <div key={i}>
              <div style={{ fontSize: 12, fontWeight: 700, color: "var(--go)", letterSpacing: ".07em", textTransform: "uppercase", marginBottom: 10 }}>{s.group}</div>
              <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                {s.items.map((item, j) => (
                  <div key={j} style={{ padding: "10px 16px", background: "var(--cr)", borderRadius: 10, border: "1px solid var(--bo)", fontSize: 13, color: "var(--ts)" }}>{item}</div>
                ))}
              </div>
            </div>
          ))}
        </div>
      )
    },
    {
      title: "Bab VI — RAB Global (Target Rp 250.000.000)", icon: "💰",
      content: (
        <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
          <p style={{ fontSize: 13, lineHeight: 1.7, color: "var(--ts)", marginBottom: 8, padding: "12px 16px", background: "rgba(184,148,63,.07)", borderRadius: 10, border: "1px solid rgba(184,148,63,.18)" }}>
            💡 <strong>Catatan:</strong> Seluruh pengerjaan fisik/instalasi bernilai Rp 0 karena dilakukan secara <strong>swadaya & gotong royong</strong>. Dana donasi digunakan untuk material saja.
          </p>
          {ALOKASI.map((item, i) => {
            const used = transaksi.filter(t => t.tipe === "keluar" && t.kategori === item.label).reduce((s, t) => s + t.jumlah, 0);
            const pct = Math.min(100, (used / item.target) * 100);
            return (
              <div key={i} style={{ padding: "16px 20px", background: "var(--cr)", borderRadius: 13, border: "1px solid var(--bo)" }}>
                <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 6, flexWrap: "wrap", gap: 6 }}>
                  <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
                    <span style={{ fontSize: 20 }}>{item.icon}</span>
                    <div>
                      <div style={{ fontSize: 13, fontWeight: 700, color: "var(--tp)" }}>{item.label}</div>
                      <div style={{ fontSize: 11, color: "var(--tm)" }}>{item.desc}</div>
                    </div>
                  </div>
                  <span className="fnt" style={{ fontSize: 17, fontWeight: 600, color: "var(--fo)" }}>{fRp(item.target)}</span>
                </div>
                <div className="pg" style={{ marginBottom: 5 }}><div className="pgf" style={{ background: item.color, width: `${pct}%` }} /></div>
                <div style={{ fontSize: 11, color: "var(--tm)" }}>Terpakai: {fRp(used)} / Target {fRp(item.target)} ({Math.round(pct)}%)</div>
              </div>
            );
          })}
          <div style={{ padding: "16px 22px", background: "var(--fo)", borderRadius: 14, display: "flex", justifyContent: "space-between", flexWrap: "wrap", gap: 8, marginTop: 4 }}>
            <span style={{ fontSize: 13, fontWeight: 700, color: "var(--cr)" }}>TOTAL ESTIMASI KEBUTUHAN</span>
            <div style={{ textAlign: "right" }}>
              <span className="fnt" style={{ fontSize: 22, fontWeight: 600, color: "var(--gl)" }}>Rp 250.000.000</span>
              <div style={{ fontSize: 11, color: "rgba(250,248,243,.45)" }}>Dua Ratus Lima Puluh Juta Rupiah</div>
            </div>
          </div>
        </div>
      )
    },
    {
      title: "Bab VII — Penyaluran Dana & Penutup", icon: "🙏",
      content: (
        <div>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(200px,1fr))", gap: 12, marginBottom: 24 }}>
            {[
              { icon: "🏦", t: "Rekening Bank Resmi", sub: "Bank SeaBank", detail: "No. Rek: 901355550666\nA.n: Ubay Rahmat H" },
              { icon: "📱", t: "QRIS & E-Wallet", sub: "Scan via GoPay/OVO/ShopeePay", detail: "Generate otomatis melalui integrasi Payment Gateway Ciburial." },
              { icon: "🌐", t: "Crypto / Web3", sub: "EVM Compatible Wallet", detail: "Wallet Address:\n0x71723715478b344164e992b49ae1fCEb6467888B" },
            ].map((m, i) => (
              <div key={i} style={{ padding: "18px", background: "var(--fo)", borderRadius: 14 }}>
                <div style={{ fontSize: 24, marginBottom: 8 }}>{m.icon}</div>
                <div style={{ fontSize: 13, fontWeight: 700, color: "var(--cr)", marginBottom: 4 }}>{m.t}</div>
                <div style={{ fontSize: 11, color: "rgba(250,248,243,.5)" }}>{m.sub}</div>

                {m.detail && (
                  <div style={{ fontSize: 11, color: "rgba(250,248,243,.35)", marginTop: 6, whiteSpace: "pre-line" }}>
                    {m.detail}
                  </div>
                )}

                {m.img && (
                  <div style={{ marginTop: 10, background: "#fff", padding: 6, borderRadius: 8, width: "fit-content" }}>
                    <img src={m.img} alt="QRIS Ciburial" style={{ width: 100, height: 100, objectFit: "contain", display: "block" }} />
                  </div>
                )}
              </div>
            ))}
          </div>
          <p style={{ fontSize: 14, lineHeight: 1.9, color: "var(--ts)", marginBottom: 24 }}>
            Setiap dukungan Anda adalah lentera nyata bagi jalan desa kami, buku dan ilmu bagi generasi muda kami, serta roda penggerak bagi kemakmuran warga Ciburial. Kami percaya, kemajuan teknologi akan membawa keberkahan jika disandingkan dengan kelestarian alam dan niat tulus bergotong royong.
          </p>
          <div style={{ padding: "26px 32px", background: "var(--ea)", borderRadius: 18 }}>
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
            <div className="fnt" style={{ fontSize: 22, fontWeight: 600, color: "var(--fo)", fontStyle: "italic" }}>Paguyuban & Pemuda Ciburial Makers</div>
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
            Inovasi Desa Mandiri Berbasis Kearifan Lokal dan Teknologi Masa Depan
          </p>
          <p style={{ fontSize: 13, color: "var(--ts)", lineHeight: 1.7, maxWidth: 480, margin: "0 auto" }}>
            Diajukan oleh Paguyuban Warga & Pemuda Ciburial Makers<br />
            Kp. Ciburial RW 08, Desa Hanjuang, Kec. Bungbulang, Kab. Garut 44165
          </p>
        </div>

        {/* Info strip */}
        <div style={{ display: "flex", flexWrap: "wrap", gap: 10, justifyContent: "center", marginBottom: 44 }}>
          {[{ icon: "🌐", l: "ciburial-eco-digital.vercel.app" }, { icon: "📧", l: "ciburial.smarthub@gmail.com" }, { icon: "📍", l: "Garut, Jawa Barat 44165" }].map((item, i) => (
            <div key={i} style={{ display: "flex", alignItems: "center", gap: 8, padding: "9px 18px", background: "var(--cw)", border: "1px solid var(--bo)", borderRadius: 99 }}>
              <span>{item.icon}</span><span style={{ fontSize: 12, fontWeight: 600, color: "var(--ts)" }}>{item.l}</span>
            </div>
          ))}
        </div>

        {/* Accordion sections */}
        {sections.map((section, i) => (
          <div key={i} style={{ marginBottom: 8 }}>
            <button
              onClick={() => setPropOpen(propOpen === i ? null : i)}
              style={{ width: "100%", display: "flex", justifyContent: "space-between", alignItems: "center", padding: "20px 26px", background: propOpen === i ? "var(--fo)" : "var(--cw)", border: "1px solid var(--bo)", borderRadius: propOpen === i ? "18px 18px 0 0" : 18, cursor: "pointer", transition: "background .25s,border-radius .25s", textAlign: "left" }}
            >
              <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                <span style={{ fontSize: 20 }}>{section.icon}</span>
                <span style={{ fontSize: 15, fontWeight: 700, color: propOpen === i ? "var(--cr)" : "var(--tp)" }}>{section.title}</span>
              </div>
              <span style={{ fontSize: 20, color: propOpen === i ? "var(--gl)" : "var(--tm)", transition: "transform .3s", transform: propOpen === i ? "rotate(45deg)" : "rotate(0)", display: "block" }}>+</span>
            </button>
            <div className={`ac ${propOpen === i ? "op" : ""}`} style={{ border: "1px solid var(--bo)", borderTop: "none", borderRadius: "0 0 18px 18px", padding: propOpen === i ? "26px" : "0 26px", background: "var(--cw)" }}>
              {section.content}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
