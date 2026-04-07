import { NextResponse } from 'next/server';
import crypto from 'crypto';
import { supabase } from '@/lib/supabase';

export async function POST(req: Request) {
  try {
    const data = await req.json();
    
    // Security: Validate Signature Key
    const serverKey = process.env.MIDTRANS_SERVER_KEY || '';
    const verifyString = data.order_id + data.status_code + data.gross_amount + serverKey;
    const hash = crypto.createHash('sha512').update(verifyString).digest('hex');

    if (hash !== data.signature_key) {
      console.warn("Midtrans Webhook: Invalid Signature");
      return NextResponse.json({ error: "Invalid signature" }, { status: 401 });
    }

    // Process valid payment status
    if (data.transaction_status === 'capture' || data.transaction_status === 'settlement') {
      const isMarketplace = data.order_id.startsWith('MKT-');
      
      const payload = {
        tanggal: new Date().toISOString().split('T')[0],
        keterangan: `Pembayaran ${isMarketplace ? 'Produk' : 'Donasi'} (ID: ${data.order_id}) via ${data.payment_type}`,
        kategori: isMarketplace ? 'Marketplace' : 'Donasi Online',
        tipe: 'masuk',
        jumlah: parseFloat(data.gross_amount),
      };

      const { error } = await supabase.from('transaksi').insert(payload);
      if (error) throw error;
      
      console.log(`Auto-Sync Success: Added Rp ${data.gross_amount} to Supabase`);
    }

    return NextResponse.json({ status: "success" });
  } catch (error: any) {
    console.error("Webhook processing error:", error.message);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
