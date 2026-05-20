import { NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";

export async function POST(request: Request) {
  try {
    const { no_wa, otp } = await request.json();
    if (!no_wa || !otp) {
      return NextResponse.json({ success: false, message: "Nomor WA dan OTP wajib diisi" }, { status: 400 });
    }

    // In a real app, verify OTP against db/redis. 
    // Here we just mock verify if length is 4.
    if (otp.length !== 4) {
      return NextResponse.json({ success: false, message: "OTP tidak valid" }, { status: 400 });
    }

    let formattedWa = no_wa.replace(/\D/g, "");
    if (formattedWa.startsWith("0")) {
      formattedWa = "62" + formattedWa.substring(1);
    }

    // Cek apakah pembeli sudah ada
    const { data: existing, error: errCek } = await supabase
      .from("pembeli")
      .select("*")
      .eq("no_wa", formattedWa)
      .single();

    let pembeli = existing;

    if (!pembeli) {
      // Buat baru jika belum ada
      const { data: newPembeli, error: errInsert } = await supabase
        .from("pembeli")
        .insert({
          no_wa: formattedWa,
          nama: `Pengguna ${formattedWa.slice(-4)}`
        })
        .select()
        .single();
        
      if (errInsert) {
        return NextResponse.json({ success: false, message: "Gagal membuat profil pembeli", detail: errInsert.message }, { status: 500 });
      }
      pembeli = newPembeli;
    }

    return NextResponse.json({ 
      success: true, 
      pembeli 
    });

  } catch (error: any) {
    return NextResponse.json({ success: false, message: error.message }, { status: 500 });
  }
}
