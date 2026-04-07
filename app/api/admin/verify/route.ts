import { NextResponse } from "next/server";

export async function POST(req: Request) {
  try {
    const { pin } = await req.json();

    // Ambil PIN dari environment variable
    const adminPin = process.env.ADMIN_PIN;

    if (!adminPin) {
      console.error("ADMIN_PIN belum dikonfigurasi di .env.local");
      return NextResponse.json(
        { success: false, error: "PIN admin belum dikonfigurasi." },
        { status: 503 }
      );
    }

    if (!pin || typeof pin !== "string") {
      return NextResponse.json(
        { success: false, error: "PIN harus diisi." },
        { status: 400 }
      );
    }

    // Perbandingan sederhana — PIN dari env variable
    if (pin === adminPin) {
      return NextResponse.json({ success: true });
    }

    return NextResponse.json(
      { success: false, error: "PIN salah." },
      { status: 401 }
    );
  } catch {
    return NextResponse.json(
      { success: false, error: "Terjadi kesalahan." },
      { status: 500 }
    );
  }
}
