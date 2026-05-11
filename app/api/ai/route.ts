// app/api/ai/route.ts
// ─────────────────────────────────────────────────────────────────────────
// Ciburial AI — Groq + Tool Calling + Agentic Loop
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
   SYSTEM PROMPT — Multi-language (ID + Sunda), Ciburial-aware
   ═══════════════════════════════════════════════════════════════════════ */
const SYSTEM_PROMPT = `Kamu adalah **Ciburial AI**, asisten digital resmi Kampung Ciburial Eco-Digital Village di Garut, Jawa Barat.

═══ IDENTITAS ═══
- Nama: Ciburial AI
- Asal: Kampung Ciburial, Desa Hanjuang, Kec. Bungbulang, Kab. Garut
- Website: ciburial.my.id
- Dibuat oleh: Ciburial Makers (dipimpin Ubay Rahmat H.)

═══ KEMAMPUAN UTAMA ═══
Kamu punya akses ke TOOLS real-time untuk menjawab pertanyaan warga secara akurat:
1. **get_jadwal_kegiatan** — jadwal kegiatan/agenda kampung
2. **get_info_posyandu** — statistik balita, stunting, kesehatan
3. **get_info_bank_sampah** — total setoran sampah & poin warga
4. **get_voting_aktif** — musyawarah / voting yang sedang berjalan
5. **get_struktur_organisasi** — pengurus, RT/RW/pemuda/DKM
6. **get_transparansi_dana** — saldo donasi, pemasukan & alokasi
7. **get_marketplace_produk** — produk warga yang dijual
8. **submit_pengaduan** — buat laporan pengaduan warga

GUNAKAN TOOLS ini ketika user nanya hal spesifik tentang Ciburial. Jangan jawab ngarang — selalu cek data dulu lewat tool.

═══ BAHASA ═══
- **Default**: Bahasa Indonesia yang natural, santai, akrab (bukan formal kaku)
- **Bahasa Sunda**: Jika user bicara Sunda ATAU minta pakai Sunda, balas pakai Sunda halus (lemes) yang pantas untuk warga kampung. Contoh:
  • "punten" (maaf/permisi), "hatur nuhun" (terima kasih)
  • "Bapa/Ibu" (untuk tua), "kang/teteh" (untuk sebaya)
  • "mangga" (silakan), "tiasa" (bisa), "aya" (ada)
- **Bahasa Inggris**: Boleh campur kalau konteks teknis / coding

═══ GAYA KOMUNIKASI ═══
- Jawab langsung ke inti, jangan basa-basi
- Tulis seperti orang yang benar-benar paham, bukan robot
- Kalau data dari tool kosong, jujur bilang belum ada datanya
- Kalau butuh info lebih, arahkan ke fitur yang tepat (misal: "buka menu Pengaduan di web")
- Untuk coding/belajar: jelas, ada contoh, step by step

═══ KONTEKS CIBURIAL ═══
- Program unggulan: Smart PJU berbahan bambu, Bank Sampah Digital, Learning Hub, Posyandu Pintar
- Produk lokal: Lampu Hex-Bamboo, kerajinan anyam, sayur organik, kompos
- Visi: Desa percontohan digital & ramah lingkungan di Indonesia
- Tabel database internal terhubung real-time via Supabase

Kalau ada pertanyaan di luar Ciburial (belajar umum, coding, dll) — jawab seperti AI biasa tanpa tools.`;

/* ═══════════════════════════════════════════════════════════════════════
   TOOLS — OpenAI / Groq function-calling format
   ═══════════════════════════════════════════════════════════════════════ */
const TOOLS = [
  {
    type: "function",
    function: {
      name: "get_jadwal_kegiatan",
      description: "Ambil jadwal kegiatan kampung Ciburial. Pakai kalau user nanya agenda, jadwal, kegiatan, acara, atau event apa yang akan / sudah berlangsung di kampung.",
      parameters: {
        type: "object",
        properties: {
          limit: { type: "number", description: "Jumlah kegiatan yang diambil (default 5)" },
          kategori: { type: "string", description: "Filter kategori kegiatan (optional): gotong-royong, religi, pemuda, dll" },
        },
      },
    },
  },
  {
    type: "function",
    function: {
      name: "get_info_posyandu",
      description: "Ambil statistik Posyandu kampung Ciburial — jumlah balita, status gizi, stunting. Pakai kalau user nanya soal kesehatan anak, balita, posyandu, gizi, atau stunting.",
      parameters: { type: "object", properties: {} },
    },
  },
  {
    type: "function",
    function: {
      name: "get_info_bank_sampah",
      description: "Ambil info Bank Sampah — total setoran kg, jumlah warga yang menyetor, total poin. Pakai kalau user nanya bank sampah, daur ulang, setor sampah, atau eco-reward.",
      parameters: { type: "object", properties: {} },
    },
  },
  {
    type: "function",
    function: {
      name: "get_voting_aktif",
      description: "Ambil daftar voting / musyawarah desa yang sedang aktif. Pakai kalau user nanya voting, pemilihan, musyawarah, atau polling kampung.",
      parameters: { type: "object", properties: {} },
    },
  },
  {
    type: "function",
    function: {
      name: "get_struktur_organisasi",
      description: "Ambil struktur kepengurusan kampung — ketua RT/RW, kepala desa, DKM, pemuda, dll. Pakai kalau user nanya siapa ketua RT/RW, pengurus, tokoh, atau organisasi kampung.",
      parameters: {
        type: "object",
        properties: {
          jabatan: { type: "string", description: "Filter jabatan (optional), misal: 'RT 01', 'Ketua Pemuda', 'DKM'" },
        },
      },
    },
  },
  {
    type: "function",
    function: {
      name: "get_transparansi_dana",
      description: "Ambil info keuangan kampung — saldo, total donasi masuk, pengeluaran, target RAB. Pakai kalau user nanya dana, donasi, saldo, keuangan, atau transparansi.",
      parameters: { type: "object", properties: {} },
    },
  },
  {
    type: "function",
    function: {
      name: "get_marketplace_produk",
      description: "Ambil daftar produk yang dijual warga. Pakai kalau user nanya produk lokal, apa yang dijual, marketplace, atau belanja.",
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
      description: "Buat laporan pengaduan warga ke sistem. Pakai kalau user ingin lapor masalah: lampu jalan mati, jalan rusak, konflik, keamanan, dll. WAJIB konfirmasi dulu sebelum submit.",
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
        let q = supabase.from("kegiatan").select("judul, tanggal, kategori, deskripsi").order("tanggal", { ascending: false }).limit(limit);
        if (args?.kategori) q = q.eq("kategori", args.kategori);
        const { data } = await q;
        return JSON.stringify(data || []);
      }

      case "get_info_posyandu": {
        const { data: anak } = await supabase.from("anak_posyandu").select("nama, status_gizi, tgl_lahir");
        const total = anak?.length || 0;
        const normal = anak?.filter(a => !a.status_gizi || a.status_gizi === "normal").length || 0;
        const risiko = anak?.filter(a => a.status_gizi === "risiko").length || 0;
        const stunting = anak?.filter(a => a.status_gizi === "stunting").length || 0;
        return JSON.stringify({
          total_balita: total,
          gizi_normal: normal,
          gizi_risiko: risiko,
          stunting: stunting,
          keterangan: stunting === 0
            ? "Alhamdulillah, tidak ada balita dengan kondisi stunting"
            : `Ada ${stunting} balita yang perlu perhatian khusus`,
        });
      }

      case "get_info_bank_sampah": {
        const { data: saldo } = await supabase.from("saldo_poin").select("total_setor_kg, total_poin");
        const totalKg = saldo?.reduce((s, x) => s + Number(x.total_setor_kg || 0), 0) || 0;
        const totalPoin = saldo?.reduce((s, x) => s + Number(x.total_poin || 0), 0) || 0;
        const wargaAktif = saldo?.filter(x => Number(x.total_setor_kg || 0) > 0).length || 0;
        return JSON.stringify({
          total_setoran_kg: totalKg.toFixed(1),
          jumlah_warga_aktif: wargaAktif,
          total_poin_terkumpul: totalPoin,
          keterangan: `Sudah ${totalKg.toFixed(1)} kg sampah didaur ulang dari ${wargaAktif} KK aktif`,
        });
      }

      case "get_voting_aktif": {
        const { data } = await supabase.from("voting").select("id, judul, deskripsi, status, created_at").eq("status", "aktif").order("created_at", { ascending: false });
        if (!data || data.length === 0) return JSON.stringify({ voting: [], keterangan: "Belum ada voting aktif saat ini" });
        return JSON.stringify({ voting: data, total: data.length });
      }

      case "get_struktur_organisasi": {
        let q = supabase.from("pengurus_desa").select("nama, jabatan, kontak, foto").order("urutan", { ascending: true });
        if (args?.jabatan) q = q.ilike("jabatan", `%${args.jabatan}%`);
        const { data } = await q;
        return JSON.stringify(data || []);
      }

      case "get_transparansi_dana": {
        const { data: tx } = await supabase.from("transaksi").select("tipe, jumlah, kategori");
        const masuk = tx?.filter(t => t.tipe === "masuk").reduce((s, t) => s + Number(t.jumlah), 0) || 0;
        const keluar = tx?.filter(t => t.tipe === "keluar").reduce((s, t) => s + Number(t.jumlah), 0) || 0;
        const saldo = masuk - keluar;
        const RAB = 250_000_000;
        return JSON.stringify({
          saldo_aktif: saldo,
          saldo_format: `Rp ${saldo.toLocaleString("id-ID")}`,
          total_masuk: masuk,
          total_masuk_format: `Rp ${masuk.toLocaleString("id-ID")}`,
          total_keluar: keluar,
          total_keluar_format: `Rp ${keluar.toLocaleString("id-ID")}`,
          target_rab: RAB,
          target_rab_format: `Rp ${RAB.toLocaleString("id-ID")}`,
          persen_target: ((masuk / RAB) * 100).toFixed(1) + "%",
        });
      }

      case "get_marketplace_produk": {
        const limit = args?.limit || 8;
        const { data } = await supabase.from("produk").select("nama, harga, tag, deskripsi").order("created_at", { ascending: false }).limit(limit);
        return JSON.stringify(
          (data || []).map(p => ({
            ...p,
            harga_format: `Rp ${Number(p.harga).toLocaleString("id-ID")}`,
          }))
        );
      }

      case "submit_pengaduan": {
        if (!args?.judul || !args?.deskripsi) {
          return JSON.stringify({ error: "Judul dan deskripsi wajib diisi" });
        }
        const { data, error } = await supabase.from("pengaduan").insert({
          judul: args.judul,
          deskripsi: args.deskripsi,
          kategori: args.kategori || "lainnya",
          nama_pelapor: args.nama_pelapor || "Anonim",
          status: "baru",
        }).select().single();
        if (error) return JSON.stringify({ error: error.message });
        return JSON.stringify({
          success: true,
          id: data?.id,
          message: "Pengaduan berhasil terkirim. Admin akan segera menindaklanjuti.",
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
   AGENTIC LOOP — AI bisa multi-step reasoning dengan tools
   ═══════════════════════════════════════════════════════════════════════ */
const MAX_ITERATIONS = 5;
const GROQ_URL = "https://api.groq.com/openai/v1/chat/completions";
const MODEL = "llama-3.3-70b-versatile";

async function callGroq(messages: any[]) {
  const res = await fetch(GROQ_URL, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${process.env.GROQ_API_KEY}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model: MODEL,
      messages,
      tools: TOOLS,
      tool_choice: "auto",
      max_tokens: 2048,
      temperature: 0.7,
    }),
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
    const convo: any[] = [
      { role: "system", content: SYSTEM_PROMPT },
      ...recentMessages,
    ];

    // Agentic loop — AI bisa panggil tool berkali-kali sampai cukup info
    for (let i = 0; i < MAX_ITERATIONS; i++) {
      const data = await callGroq(convo);
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
            const args = typeof tc.function.arguments === "string"
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
        continue; // lanjut iterasi biar AI bisa synthesize hasil tool
      }

      // Selesai — AI kasih final answer
      return NextResponse.json({
        reply: msg.content || "Maaf, gak bisa jawab sekarang.",
        iterations: i + 1,
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
