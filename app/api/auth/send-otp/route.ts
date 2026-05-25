import { NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";

export async function POST(request: Request) {
  try {
    const { no_wa } = await request.json();
    if (!no_wa) {
      return NextResponse.json({ success: false, message: "Nomor WA wajib diisi" }, { status: 400 });
    }

    // Format nomor WA (pastikan pakai 62 atau 0)
    let formattedWa = no_wa.replace(/\D/g, "");
    if (formattedWa.startsWith("0")) {
      formattedWa = "62" + formattedWa.substring(1);
    }

    // Generate 4 digit OTP
    const otp = Math.floor(1000 + Math.random() * 9000).toString();

    // Simpan OTP sementara (di tabel otp_requests atau pakai redis. Karena Supabase, kita simpan di tabel temporary atau update/upsert ke tabel pembeli sementara)
    // Untuk simpel, kita akan return OTP ke client (Hanya untuk keperluan DEV). 
    // Di produksi, jangan return OTP. Cukup return success.
    // Tapi karena kita tidak punya backend Redis yang cepat, kita simpan otp di database atau kirim aja ke Fonnte, 
    // dan biarkan client verifikasi lewat API lain atau login sederhana pakai no_wa (karena ini hybrid).
    // KITA ANGGAP sistem menyimpannya di Supabase atau hanya pass-through.
    // Untuk tahap awal, kita bypass checking OTP di DB dan return OTP-nya untuk testing jika FONNTE_API_KEY kosong.
    
    const fonnteKey = process.env.FONNTE_API_KEY;
    if (fonnteKey) {
      const response = await fetch("https://api.fonnte.com/send", {
        method: "POST",
        headers: {
          "Authorization": fonnteKey,
        },
        body: new URLSearchParams({
          target: formattedWa,
          message: `*Ciburial Eco-Digital*\n\nKode OTP Anda adalah: *${otp}*\n\nJangan berikan kode ini kepada siapapun.`,
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

    // Di skenario nyata kita simpan `otp` ini di tabel db `auth_otp` yang expired 5 menit.
    // Tapi untuk keperluan development, kita mock login dan return OTP (WARNING: INSECURE)
    return NextResponse.json({ 
      success: true, 
      message: "OTP terkirim via Fonnte (Mock)",
      // HAPUS INI DI PRODUKSI:
      mock_otp: otp 
    });

  } catch (error: any) {
    return NextResponse.json({ success: false, message: error.message }, { status: 500 });
  }
}
