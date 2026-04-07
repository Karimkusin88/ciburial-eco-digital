// app/api/ai/route.ts
import { NextRequest, NextResponse } from "next/server";

// Rate limiting sederhana (in-memory)
const rateLimit = new Map<string, { count: number; reset: number }>();

function checkRateLimit(ip: string): boolean {
  const now = Date.now();
  const limit = rateLimit.get(ip);
  if (!limit || now > limit.reset) {
    rateLimit.set(ip, { count: 1, reset: now + 60 * 60 * 1000 }); // reset per jam
    return true;
  }
  if (limit.count >= 30) return false; // max 30 pesan per jam
  limit.count++;
  return true;
}

const SYSTEM_PROMPT = `Kamu adalah asisten AI cerdas milik Kampung Ciburial Eco-Digital Village.

IDENTITAS:
- Nama: Ciburial AI
- Dibuat untuk membantu warga dan siapapun yang butuh bantuan
- Berbasis di Kampung Ciburial, Garut, Jawa Barat

KEMAMPUAN:
- Menjawab pertanyaan umum dan pengetahuan
- Membantu belajar (matematika, sains, bahasa, dll)
- Membantu coding dan teknologi
- Memberikan info seputar kampung Ciburial
- Memecahkan masalah sehari-hari
- Menulis, merangkum, menerjemahkan

GAYA KOMUNIKASI:
- Jawab langsung ke inti, tidak basa-basi berlebihan
- Gunakan bahasa yang natural dan mudah dipahami
- Sesuaikan tingkat penjelasan dengan pertanyaan user
- Kalau bisa jawab singkat, jangan panjang-panjang
- Gunakan bahasa Indonesia yang baik, tapi santai dan bersahabat
- Boleh mix bahasa Indonesia-Inggris kalau konteksnya teknis
- Jangan jawab kayak robot — tulis seperti orang yang benar-benar paham

TENTANG CIBURIAL:
- Kampung Ciburial adalah desa inovatif di Garut, Jawa Barat
- Program unggulan: Smart PJU berbahan bambu, Bank Sampah Digital, Learning Hub
- Produk lokal: Lampu Hex-Bamboo, kerajinan anyam, sayur organik, kompos
- Website: ciburial-eco-digital.vercel.app
- Visi: Menjadi desa percontohan digital dan ramah lingkungan di Indonesia`;

export async function POST(req: NextRequest) {
  try {
    // Ambil IP untuk rate limiting
    const ip = req.headers.get("x-forwarded-for") || "unknown";

    // Cek rate limit
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

    // Batasi history maksimal 20 pesan biar ga kebanyakan token
    const recentMessages = messages.slice(-20);

    // Validasi API key
    if (!process.env.GROQ_API_KEY) {
      console.error("GROQ_API_KEY belum dikonfigurasi di .env.local");
      return NextResponse.json(
        { error: "AI belum dikonfigurasi. Tambahkan GROQ_API_KEY ke .env.local" },
        { status: 503 }
      );
    }

    const response = await fetch("https://api.groq.com/openai/v1/chat/completions", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${process.env.GROQ_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "llama-3.3-70b-versatile",
        messages: [
          { role: "system", content: SYSTEM_PROMPT },
          ...recentMessages,
        ],
        max_tokens: 2048,
        temperature: 0.7,
        stream: false,
      }),
    });

    if (!response.ok) {
      const err = await response.text();
      console.error("Groq error:", err);
      return NextResponse.json(
        { error: "Maaf, AI lagi ada masalah. Coba lagi bentar ya!" },
        { status: 500 }
      );
    }

    const data = await response.json();
    const reply = data.choices?.[0]?.message?.content || "Maaf, gw ga bisa jawab sekarang.";

    return NextResponse.json({ reply });
  } catch (error) {
    console.error("AI route error:", error);
    return NextResponse.json(
      { error: "Terjadi kesalahan. Coba lagi ya!" },
      { status: 500 }
    );
  }
}