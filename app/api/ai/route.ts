// app/api/ai/route.ts
// ─────────────────────────────────────────────────────────────────────────
// Ciburial AI — Groq + Tool Calling + Agentic Loop + Vision
// Support: Bahasa Indonesia & Sunda, context-aware, multi-step reasoning
// ─────────────────────────────────────────────────────────────────────────
import { NextRequest, NextResponse } from "next/server";
import { supabase, isSupabaseReady } from "@/lib/supabase";

/* ═══════════════════════════════════════════════════════════════════════
   RATE LIMIT
   ═══════════════════════════════════════════════════════════════════════ */
const rateLimit = new Map<string, { count: number; reset: number }>();

function checkRateLimit(ip: string): boolean {
  const now = Date.now();
  const limit = rateLimit.get(ip);
  if (!limit || now > limit.reset) {
    rateLimit.set(ip, { count: 1, reset: now + 60 * 60 * 1000 });
    return true;
  }
  if (limit.count >= 30) return false;
  limit.count++;
  return true;
}

/* ═══════════════════════════════════════════════════════════════════════
   MODEL CONFIG
   - Text-only: llama-3.3-70b-versatile (cepat, cerdas)
   - Vision: meta-llama/llama-4-scout-17b-16e-instruct (support gambar)
   ═══════════════════════════════════════════════════════════════════════ */
const MODEL_TEXT   = "llama-3.3-70b-versatile";
const MODEL_VISION = "meta-llama/llama-4-scout-17b-16e-instruct";
const GROQ_URL     = "https://api.groq.com/openai/v1/chat/completions";
const MAX_ITERATIONS = 5;

/* ═══════════════════════════════════════════════════════════════════════
   SYSTEM PROMPT — Lengkap, konteks web utama, langsung ke inti
   ═══════════════════════════════════════════════════════════════════════ */
const SYSTEM_PROMPT = `Kamu adalah **Ciburial AI**, asisten digital resmi Kampung Ciburial Eco-Digital Village.

═══ IDENTITAS KAMPUNG ═══
- Nama Kampung: Kp. Ciburial, Desa Hanjuang, Kec. Bungbulang, Kab. Garut, Jawa Barat
- Website: ciburial.my.id (ciburial-eco-digital.vercel.app)
- Inisiator & Founder "Eco-Digital": Ubay Rahmat H. (dipimpin Irmas Al Husain Ciburial)
- Transformasi Digital: Dimulai tahun 2026 sebagai desa percontohan digital & ramah lingkungan pertama di Garut
- Motto: "Start small. Build real. Create impact." & "Inovasi Desa Mandiri Berbasis Kearifan Lokal dan Teknologi Masa Depan"

═══ PROGRAM & LAYANAN UTAMA (Ciburial Smart Hub) ═══
1. **E-Voting** (/voting) — Musyawarah digital & aman untuk warga
2. **Posyandu Pintar** (/posyandu) — Tracking gizi & kesehatan balita, deteksi stunting
3. **Monitoring Ronda** (/ronda) — Keamanan real-time berbasis NFC tap
4. **Zakat Digital** (/zakat) — Cek kewajiban & hak zakat fitrah
5. **Layanan Aduan** (/pengaduan) — Lapor masalah fasilitas publik (lampu mati, jalan rusak, dll)
6. **Tukar Poin / Eco-Reward** (/tukar-poin) — Mini ATM & dompet reward dari setor sampah
7. **Learning Hub** (/learning-hub) — E-Perpustakaan, Lab Komputer, video pelatihan digital
8. **Bank Sampah Digital** — Warga setor sampah pilah, dapat poin, tukar hadiah
9. **Ciburial AI** (/ai) — Asisten digital kampung (kamu sendiri)
10. **Kalender Kegiatan** (/kalender) — Agenda & jadwal kampung
11. **Marketplace** (/?tab=marketplace) — Produk lokal warga: sayur organik, kerajinan bambu, kompos
12. **Cek Pesanan** (/cek-pesanan) & **Tracking** (/tracking) — Status pesanan marketplace
13. **Transparansi Dana** (/?tab=transparansi) — Laporan keuangan kampung real-time

═══ PRODUK UNGGULAN LOKAL ═══
- Lampu Hex-Bamboo (Smart PJU berbahan bambu + panel surya)
- Kerajinan anyam bambu
- Sayur & hasil tani organik
- Pupuk kompos dari bank sampah

═══ RAB & DONASI ═══
- Target dana: Rp 250.000.000
- Alokasi:
  • Balai Serba Guna & Ruang Publik: Rp 80.000.000
  • Smart Farming & Peternakan Modern: Rp 60.000.000
  • Learning Hub (PC, server, buku): Rp 45.000.000
  • Smart PJU & Keamanan (panel surya, CCTV): Rp 25.000.000
  • Jaringan Internet RT/RW Net: Rp 20.000.000
  • Operasional Digital & Eco-Waste: Rp 20.000.000
- Cara donasi:
  • QRIS & E-Wallet: via Midtrans (langsung di web)
  • Transfer Bank: SeaBank (Kode 901) — No. Rek: 90135555066 a.n. Ubay Rahmat H
  • Crypto/Web3: 0x71723715478b344164e992b49ae1fCEb6467888B (Polygon, BSC, ETH, dll)

═══ TECH STACK KAMPUNG ═══
- Framework: Next.js 16 + TypeScript + Supabase (PostgreSQL)
- Auth: PIN 4-digit + NFC (bukan Supabase Auth bawaan)
- Styling: Tailwind CSS v4 + HEROIC Design System
- AI: Groq API — Llama 3.3 70B + Llama 4 Scout (vision)
- NFC: Web NFC API / NDEFReader — Chrome Android
- Payment: Midtrans (QRIS, e-wallet, VA)
- Deploy: Vercel

═══ KEMAMPUAN TOOLS REAL-TIME ═══
Kamu bisa akses data kampung secara live via tools:
- get_jadwal_kegiatan — agenda & event kampung
- get_info_posyandu — data balita, gizi, stunting
- get_info_bank_sampah — statistik setoran sampah & poin
- get_voting_aktif — musyawarah / voting aktif
- get_struktur_organisasi — pengurus RT/RW/DKM/pemuda
- get_transparansi_dana — saldo & laporan keuangan
- get_marketplace_produk — daftar produk warga
- submit_pengaduan — kirim laporan masalah

PAKAI TOOLS kalau user tanya data spesifik Ciburial. Jangan ngarang — cek data dulu.

═══ BAHASA ═══
- Default: Bahasa Indonesia natural, santai, akrab
- Sunda: Balas pakai Sunda lemes kalau user pakai Sunda (punten, hatur nuhun, mangga, kang/teteh)
- Inggris: Boleh campur untuk konteks coding/teknis

═══ GAYA MENJAWAB ═══
- LANGSUNG ke inti, tidak bertele-tele
- Jangan ulang pertanyaan user
- Kalau data kosong → jujur bilang belum ada
- Kalau ada foto → analisis dulu, baru jawab
- Untuk coding → ada contoh kode + step-by-step
- Untuk info kampung → gunakan tools real-time
- Arahkan ke halaman web yang tepat kalau relevan (misal: "buka /pengaduan di web")`;

/* ═══════════════════════════════════════════════════════════════════════
   TOOLS — OpenAI / Groq function-calling format
   ═══════════════════════════════════════════════════════════════════════ */
const TOOLS = [
  {
    type: "function",
    function: {
      name: "get_jadwal_kegiatan",
      description: "Ambil jadwal kegiatan kampung Ciburial. Pakai kalau user nanya agenda, jadwal, kegiatan, acara, atau event.",
      parameters: {
        type: "object",
        properties: {
          limit: { type: "number", description: "Jumlah kegiatan (default 5)" },
          kategori: { type: "string", description: "Filter kategori (optional): gotong-royong, religi, pemuda, dll" },
        },
      },
    },
  },
  {
    type: "function",
    function: {
      name: "get_info_posyandu",
      description: "Ambil statistik Posyandu — jumlah balita, status gizi, stunting. Pakai kalau user nanya kesehatan anak, balita, posyandu, gizi, stunting.",
      parameters: { type: "object", properties: {} },
    },
  },
  {
    type: "function",
    function: {
      name: "get_info_bank_sampah",
      description: "Ambil info Bank Sampah — total setoran, warga aktif, total poin. Pakai kalau user nanya bank sampah, daur ulang, setor sampah, eco-reward.",
      parameters: { type: "object", properties: {} },
    },
  },
  {
    type: "function",
    function: {
      name: "get_voting_aktif",
      description: "Ambil daftar voting/musyawarah desa yang aktif. Pakai kalau user nanya voting, pemilihan, musyawarah, polling.",
      parameters: { type: "object", properties: {} },
    },
  },
  {
    type: "function",
    function: {
      name: "get_struktur_organisasi",
      description: "Ambil struktur kepengurusan kampung — ketua RT/RW, DKM, pemuda, dll. Pakai kalau user nanya pengurus, tokoh, atau organisasi kampung.",
      parameters: {
        type: "object",
        properties: {
          jabatan: { type: "string", description: "Filter jabatan (optional), misal: 'RT 01', 'Ketua'" },
        },
      },
    },
  },
  {
    type: "function",
    function: {
      name: "get_transparansi_dana",
      description: "Ambil info keuangan kampung — saldo, donasi, pengeluaran, target RAB. Pakai kalau user nanya dana, donasi, saldo, keuangan, transparansi.",
      parameters: { type: "object", properties: {} },
    },
  },
  {
    type: "function",
    function: {
      name: "get_marketplace_produk",
      description: "Ambil daftar produk yang dijual warga. Pakai kalau user nanya produk lokal, marketplace, atau belanja.",
      parameters: {
        type: "object",
        properties: {
          limit: { type: "number", description: "Jumlah produk (default 8)" },
        },
      },
    },
  },
  {
    type: "function",
    function: {
      name: "submit_pengaduan",
      description: "Buat laporan pengaduan warga. Pakai kalau user ingin lapor masalah: lampu mati, jalan rusak, keamanan, dll. Konfirmasi dulu sebelum submit.",
      parameters: {
        type: "object",
        properties: {
          judul: { type: "string", description: "Judul singkat pengaduan (max 100 char)" },
          deskripsi: { type: "string", description: "Isi lengkap pengaduan" },
          kategori: { type: "string", description: "Kategori: infrastruktur, keamanan, lingkungan, sosial, lainnya" },
          nama_pelapor: { type: "string", description: "Nama pelapor (optional, default Anonim)" },
        },
        required: ["judul", "deskripsi"],
      },
    },
  },
];

/* ═══════════════════════════════════════════════════════════════════════
   TOOL EXECUTORS
   ═══════════════════════════════════════════════════════════════════════ */
async function execTool(name: string, args: any): Promise<string> {
  if (!isSupabaseReady()) {
    return JSON.stringify({ error: "Database belum siap. Coba lagi nanti." });
  }

  try {
    switch (name) {
      case "get_jadwal_kegiatan": {
        const limit = args?.limit || 5;
        let q = supabase
          .from("kegiatan")
          .select("judul, tanggal, kategori, deskripsi")
          .order("tanggal", { ascending: false })
          .limit(limit);
        if (args?.kategori) q = q.eq("kategori", args.kategori);
        const { data } = await q;
        if (!data || data.length === 0) return JSON.stringify({ keterangan: "Belum ada kegiatan tercatat saat ini." });
        return JSON.stringify(data);
      }

      case "get_info_posyandu": {
        const { data: anak } = await supabase
          .from("anak_posyandu")
          .select("nama, status_gizi, tgl_lahir");
        const total = anak?.length || 0;
        const normal = anak?.filter(a => !a.status_gizi || a.status_gizi === "normal").length || 0;
        const risiko = anak?.filter(a => a.status_gizi === "risiko").length || 0;
        const stunting = anak?.filter(a => a.status_gizi === "stunting").length || 0;
        return JSON.stringify({
          total_balita: total,
          gizi_normal: normal,
          gizi_risiko: risiko,
          stunting,
          keterangan: stunting === 0
            ? "Alhamdulillah, tidak ada balita dengan kondisi stunting"
            : `Ada ${stunting} balita yang perlu perhatian khusus`,
        });
      }

      case "get_info_bank_sampah": {
        // Query riwayat_poin untuk data setor sampah
        const { data: setor } = await supabase
          .from("riwayat_poin")
          .select("anggota_id, jumlah, sumber")
          .eq("sumber", "bank_sampah");

        const { data: poinData } = await supabase
          .from("saldo_poin")
          .select("kk_id, total_poin");

        const totalPoin = poinData?.reduce((s, x) => s + Number(x.total_poin || 0), 0) || 0;
        const wargaAktif = poinData?.filter(x => Number(x.total_poin || 0) > 0).length || 0;
        const totalTransaksi = setor?.length || 0;

        return JSON.stringify({
          total_transaksi_setor: totalTransaksi,
          jumlah_warga_aktif: wargaAktif,
          total_poin_terkumpul: totalPoin,
          keterangan: `Bank Sampah Ciburial: ${wargaAktif} KK aktif, ${totalTransaksi} kali setor, total ${totalPoin} poin terkumpul`,
        });
      }

      case "get_voting_aktif": {
        const { data } = await supabase
          .from("voting")
          .select("id, judul, deskripsi, status, created_at")
          .eq("status", "aktif")
          .order("created_at", { ascending: false });
        if (!data || data.length === 0) {
          return JSON.stringify({ voting: [], keterangan: "Belum ada voting/musyawarah aktif saat ini" });
        }
        return JSON.stringify({ voting: data, total: data.length });
      }

      case "get_struktur_organisasi": {
        // ── Data resmi dari web /tentang (sumber kebenaran) ──────────────
        const STRUKTUR_RESMI = {
          dewan_pelindung: [
            { nama: "— Hasil Musyawarah —", jabatan: "Tokoh Agama" },
            { nama: "Bpk. Enang", jabatan: "Kepala Kewilayahan (Ketua RW)" },
            { nama: "Sarip Hidayat", jabatan: "Koordinator RT 01" },
            { nama: "Oneng", jabatan: "Koordinator RT 02" },
            { nama: "Mumun", jabatan: "Koordinator RT 03" },
          ],
          dewan_pengawas: [
            { nama: "Bpk. Pupu Apipudin", jabatan: "Pengelola Dana DKM" },
          ],
          tim_eksekutif: [
            { nama: "— Hasil Voting —", jabatan: "Ketua Pelaksana (PM)" },
            { nama: "— Hasil Voting —", jabatan: "Sekretaris" },
            { nama: "— Hasil Voting —", jabatan: "Bendahara" },
          ],
          divisi: [
            { nama: "Divisi Syiar & Kemakmuran Masjid", jabatan: "Keagamaan & Pengajian", tugas: "Pengajian pemuda, panitia PHBI, jadwal muadzin" },
            { nama: "Divisi Sosial & Tanggap Warga", jabatan: "Dana Sosial & Kebencanaan", tugas: "Dana sosial warga, santunan yatim/dhuafa, tanggap bencana" },
            { nama: "Divisi Green Build", jabatan: "Infrastruktur & Konstruksi Hijau", tugas: "Balai Serba Guna, Smart PJU, drainase resapan" },
            { nama: "Divisi Logistik & Pemeliharaan", jabatan: "Maintenance & Aset", tugas: "Maintenance harian, kelistrikan PJU, perbaikan peralatan" },
            { nama: "Divisi Digital Hub", jabatan: "IT, Jaringan & Web3", tugas: "RT/RW Net, Learning Hub, Website, Crypto" },
            { nama: "Divisi Eco-Waste & Farming", jabatan: "Smart Farming & Lingkungan", tugas: "Pertanian organik, peternakan, Bank Sampah" },
            { nama: "Divisi Local Commerce", jabatan: "Ekonomi Kreatif & UMKM", tugas: "Pengrajin lokal, marketplace, quality control" },
            { nama: "Divisi Public Relations", jabatan: "Humas & Transparansi Publik", tugas: "Dokumentasi, laporan dana, komunikasi CSR" },
          ],
          founder: { nama: "Ubay Rahmat H.", jabatan: "Founder & Builder — Ciburial Eco-Digital Village" },
        };

        // Coba ambil data live dari DB (override jika ada)
        try {
          const pgRes = await supabase
            .from("pengurus_desa")
            .select("nama, jabatan, kategori, kontak")
            .order("urutan", { ascending: true });

          if (pgRes.data && pgRes.data.length > 0) {
            // Data DB ada → merge dengan struktur resmi
            const dbData = pgRes.data;
            if (args?.jabatan) {
              const filtered = dbData.filter(d =>
                d.jabatan?.toLowerCase().includes(args.jabatan.toLowerCase())
              );
              if (filtered.length > 0) {
                return JSON.stringify({ sumber: "database_live", data: filtered });
              }
            } else {
              return JSON.stringify({ sumber: "database_live", data: dbData, struktur_resmi: STRUKTUR_RESMI });
            }
          }
        } catch (_) {
          // tabel belum ada → pakai data statis
        }

        // Filter berdasarkan jabatan jika diminta
        if (args?.jabatan) {
          const q = args.jabatan.toLowerCase();
          const semua = [
            ...STRUKTUR_RESMI.dewan_pelindung,
            ...STRUKTUR_RESMI.dewan_pengawas,
            ...STRUKTUR_RESMI.tim_eksekutif,
            ...STRUKTUR_RESMI.divisi,
            STRUKTUR_RESMI.founder,
          ];
          const filtered = semua.filter(p =>
            p.jabatan?.toLowerCase().includes(q) || p.nama?.toLowerCase().includes(q)
          );
          return JSON.stringify({
            sumber: "data_resmi_web",
            data: filtered.length > 0 ? filtered : semua,
            keterangan: filtered.length === 0 ? `Tidak ditemukan untuk jabatan "${args.jabatan}"` : undefined,
          });
        }

        return JSON.stringify({ sumber: "data_resmi_web", ...STRUKTUR_RESMI });
      }

      case "get_transparansi_dana": {
        const { data: tx } = await supabase
          .from("transaksi")
          .select("tipe, jumlah, kategori, keterangan, tanggal")
          .order("tanggal", { ascending: false })
          .limit(50);
        const masuk = tx?.filter(t => t.tipe === "masuk").reduce((s, t) => s + Number(t.jumlah), 0) || 0;
        const keluar = tx?.filter(t => t.tipe === "keluar").reduce((s, t) => s + Number(t.jumlah), 0) || 0;
        const saldo = masuk - keluar;
        const RAB = 250_000_000;
        return JSON.stringify({
          saldo_aktif_format: `Rp ${saldo.toLocaleString("id-ID")}`,
          total_masuk_format: `Rp ${masuk.toLocaleString("id-ID")}`,
          total_keluar_format: `Rp ${keluar.toLocaleString("id-ID")}`,
          target_rab_format: `Rp ${RAB.toLocaleString("id-ID")}`,
          persen_target: ((masuk / RAB) * 100).toFixed(1) + "%",
          transaksi_terakhir: tx?.slice(0, 5) || [],
        });
      }

      case "get_marketplace_produk": {
        const limit = args?.limit || 8;
        const { data } = await supabase
          .from("produk")
          .select("nama, harga, tag, deskripsi")
          .order("created_at", { ascending: false })
          .limit(limit);
        if (!data || data.length === 0) {
          return JSON.stringify({ keterangan: "Belum ada produk di marketplace saat ini." });
        }
        return JSON.stringify(
          data.map(p => ({
            ...p,
            harga_format: `Rp ${Number(p.harga).toLocaleString("id-ID")}`,
          }))
        );
      }

      case "submit_pengaduan": {
        if (!args?.judul || !args?.deskripsi) {
          return JSON.stringify({ error: "Judul dan deskripsi wajib diisi" });
        }
        const { data, error } = await supabase
          .from("pengaduan")
          .insert({
            judul: args.judul,
            deskripsi: args.deskripsi,
            kategori: args.kategori || "lainnya",
            nama: args.nama_pelapor || "Anonim",
            kontak: "-",
            isi: args.deskripsi,
            status: "baru",
          })
          .select()
          .single();
        if (error) return JSON.stringify({ error: error.message });
        return JSON.stringify({
          success: true,
          id: data?.id,
          message: "Pengaduan berhasil terkirim! Admin akan segera menindaklanjuti.",
        });
      }

      default:
        return JSON.stringify({ error: `Tool "${name}" belum tersedia` });
    }
  } catch (err: any) {
    return JSON.stringify({ error: err?.message || "Gagal akses data" });
  }
}

/* ═══════════════════════════════════════════════════════════════════════
   FORMAT MESSAGES — Handle multimodal (vision) messages
   Groq vision format: content berupa array [{type: "text"}, {type: "image_url"}]
   ═══════════════════════════════════════════════════════════════════════ */
function formatMessagesForGroq(rawMessages: any[]): { formatted: any[]; hasImage: boolean } {
  let hasImage = false;
  const formatted = rawMessages.map((msg: any) => {
    if (msg.role === "user" && msg.image) {
      hasImage = true;
      const parts: any[] = [];
      if (msg.content && msg.content !== "[Foto dikirim]") {
        parts.push({ type: "text", text: msg.content });
      } else {
        parts.push({ type: "text", text: "Tolong analisis foto ini." });
      }
      // Groq vision: image_url dengan base64
      parts.push({
        type: "image_url",
        image_url: {
          url: msg.image, // base64 data URL sudah ok: "data:image/jpeg;base64,..."
        },
      });
      return { role: "user", content: parts };
    }
    // Pesan biasa — strip field image kalau ada
    return { role: msg.role, content: msg.content };
  });
  return { formatted, hasImage };
}

/* ═══════════════════════════════════════════════════════════════════════
   GROQ API CALL
   ═══════════════════════════════════════════════════════════════════════ */
async function callGroq(messages: any[], useVision: boolean) {
  const model = useVision ? MODEL_VISION : MODEL_TEXT;
  // Tools tidak support di vision model — hanya pakai di text model
  const body: any = {
    model,
    messages,
    max_tokens: 2048,
    temperature: 0.65,
  };
  if (!useVision) {
    body.tools = TOOLS;
    body.tool_choice = "auto";
  }

  const res = await fetch(GROQ_URL, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${process.env.GROQ_API_KEY}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(body),
  });

  if (!res.ok) {
    const err = await res.text();
    throw new Error(`Groq error: ${err}`);
  }
  return res.json();
}

/* ═══════════════════════════════════════════════════════════════════════
   MAIN HANDLER
   ═══════════════════════════════════════════════════════════════════════ */
export async function POST(req: NextRequest) {
  try {
    const ip = req.headers.get("x-forwarded-for") || "unknown";
    if (!checkRateLimit(ip)) {
      return NextResponse.json(
        { error: "Terlalu banyak pesan. Coba lagi dalam 1 jam ya!" },
        { status: 429 }
      );
    }

    const { messages } = await req.json();
    if (!messages || !Array.isArray(messages)) {
      return NextResponse.json({ error: "Format pesan tidak valid" }, { status: 400 });
    }

    if (!process.env.GROQ_API_KEY) {
      return NextResponse.json(
        { error: "AI belum dikonfigurasi. Tambahkan GROQ_API_KEY ke .env.local" },
        { status: 503 }
      );
    }

    // Batasi history 20 pesan terakhir
    const recentMessages = messages.slice(-20);

    // Cek apakah ada gambar di pesan terakhir
    const { formatted: formattedMessages, hasImage } = formatMessagesForGroq(recentMessages);

    const convo: any[] = [
      { role: "system", content: SYSTEM_PROMPT },
      ...formattedMessages,
    ];

    // ── VISION MODE ─────────────────────────────────────────────────────
    // Kalau ada gambar → pakai model vision, langsung jawab (no tool loop)
    if (hasImage) {
      const data = await callGroq(convo, true);
      const msg = data.choices?.[0]?.message;
      if (!msg) {
        return NextResponse.json({ error: "AI tidak merespon. Coba lagi ya!" }, { status: 500 });
      }
      return NextResponse.json({
        reply: msg.content || "Maaf, tidak bisa analisis foto sekarang.",
        model: MODEL_VISION,
      });
    }

    // ── TEXT + TOOL CALLING MODE (Agentic Loop) ───────────────────────
    for (let i = 0; i < MAX_ITERATIONS; i++) {
      const data = await callGroq(convo, false);
      const msg = data.choices?.[0]?.message;

      if (!msg) {
        return NextResponse.json({ error: "AI tidak merespon" }, { status: 500 });
      }

      // Kalau AI minta tool call
      if (msg.tool_calls && msg.tool_calls.length > 0) {
        convo.push(msg); // simpan assistant message dengan tool_calls

        // Eksekusi semua tool paralel
        const toolResults = await Promise.all(
          msg.tool_calls.map(async (tc: any) => {
            const args =
              typeof tc.function.arguments === "string"
                ? JSON.parse(tc.function.arguments || "{}")
                : tc.function.arguments;
            const result = await execTool(tc.function.name, args);
            return {
              role: "tool",
              tool_call_id: tc.id,
              content: result,
            };
          })
        );

        convo.push(...toolResults);
        continue; // lanjut iterasi biar AI synthesize hasil tool
      }

      // Selesai — AI kasih final answer
      return NextResponse.json({
        reply: msg.content || "Maaf, gak bisa jawab sekarang.",
        iterations: i + 1,
        model: MODEL_TEXT,
      });
    }

    return NextResponse.json({
      reply: "Pertanyaan terlalu kompleks. Coba pecah jadi pertanyaan yang lebih simpel ya.",
    });
  } catch (error: any) {
    console.error("AI route error:", error);
    return NextResponse.json(
      { error: error?.message || "Terjadi kesalahan. Coba lagi ya!" },
      { status: 500 }
    );
  }
}
