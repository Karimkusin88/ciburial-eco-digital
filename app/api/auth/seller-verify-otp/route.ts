import { NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";

export async function POST(request: Request) {
  try {
    const { no_wa, otp } = await request.json();
    if (!no_wa || !otp) {
      return NextResponse.json({ success: false, message: "Nomor WA dan OTP wajib diisi" }, { status: 400 });
    }

    if (otp.length !== 4) {
      return NextResponse.json({ success: false, message: "OTP tidak valid" }, { status: 400 });
    }

    let formattedWa = no_wa.replace(/\D/g, "");
    let altFormattedWa = formattedWa;
    
    if (formattedWa.startsWith("0")) {
      altFormattedWa = "62" + formattedWa.substring(1);
    } else if (formattedWa.startsWith("62")) {
      altFormattedWa = "0" + formattedWa.substring(2);
    }

    // Cek toko berdasarkan nomor WA
    const { data: tokoList, error } = await supabase
      .from("toko")
      .select("id, nama_toko, status")
      .or(`no_wa.eq.${formattedWa},no_wa.eq.${altFormattedWa}`);

    if (error || !tokoList || tokoList.length === 0) {
      return NextResponse.json({ success: false, message: "Toko tidak ditemukan atau belum terdaftar" }, { status: 404 });
    }

    const toko = tokoList[0];

    if (toko.status !== "aktif") {
      return NextResponse.json({ success: false, message: "Toko Anda sedang dinonaktifkan." }, { status: 403 });
    }

    return NextResponse.json({ 
      success: true, 
      toko 
    });

  } catch (error: any) {
    return NextResponse.json({ success: false, message: error.message }, { status: 500 });
  }
}
