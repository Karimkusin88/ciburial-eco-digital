import { NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";

export async function POST(request: Request) {
  try {
    const { no_wa } = await request.json();
    if (!no_wa) {
      return NextResponse.json({ success: false, message: "Nomor WA wajib diisi" }, { status: 400 });
    }

    // Format nomor WA (pastikan pakai 62 atau 0)
    // Walaupun admin mungkin menginput 08xx atau 628xx, kita cek keduanya
    let formattedWa = no_wa.replace(/\D/g, "");
    let altFormattedWa = formattedWa;
    
    if (formattedWa.startsWith("0")) {
      altFormattedWa = "62" + formattedWa.substring(1);
    } else if (formattedWa.startsWith("62")) {
      altFormattedWa = "0" + formattedWa.substring(2);
    }

    // Cek apakah nomor WA terdaftar di tabel toko
    const { data: tokoList, error } = await supabase
      .from("toko")
      .select("id, nama_toko, no_wa, status")
      .or(`no_wa.eq.${formattedWa},no_wa.eq.${altFormattedWa}`);

    if (error) {
      return NextResponse.json({ success: false, message: "Gagal mengecek data toko" }, { status: 500 });
    }

    if (!tokoList || tokoList.length === 0) {
      return NextResponse.json({ success: false, message: "Nomor WhatsApp belum didaftarkan Admin. Silakan hubungi Admin desa." }, { status: 404 });
    }

    const toko = tokoList[0];

    if (toko.status !== "aktif") {
      return NextResponse.json({ success: false, message: "Toko Anda sedang dinonaktifkan." }, { status: 403 });
    }

    // Generate 4 digit OTP
    const otp = Math.floor(1000 + Math.random() * 9000).toString();

    const fonnteKey = process.env.FONNTE_API_KEY;
    if (fonnteKey) {
      const response = await fetch("https://api.fonnte.com/send", {
        method: "POST",
        headers: {
          "Authorization": fonnteKey,
        },
        body: new URLSearchParams({
          target: formattedWa,
          message: `*Ciburial Eco-Digital*\n\nLogin Penjual\nKode OTP Anda adalah: *${otp}*\n\nJangan berikan kode ini kepada siapapun.`,
        }),
      });
      const data = await response.json();
      if (!data.status) {
        return NextResponse.json({ success: false, message: `Gagal mengirim pesan WA: ${data.reason || JSON.stringify(data)}`, data });
      }
      
      return NextResponse.json({ 
        success: true, 
        message: "OTP terkirim via WA!"
      });
    }

    // Fallback jika tidak ada Fonnte
    return NextResponse.json({ 
      success: true, 
      message: "OTP terkirim via Fonnte (Mock)",
      mock_otp: otp 
    });

  } catch (error: any) {
    return NextResponse.json({ success: false, message: error.message }, { status: 500 });
  }
}
