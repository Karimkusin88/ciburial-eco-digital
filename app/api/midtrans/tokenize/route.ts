import { NextResponse } from 'next/server';

export async function POST(req: Request) {
  try {
    const { order_id, gross_amount, customer_details, item_details } = await req.json();

    if (!gross_amount) {
      return NextResponse.json({ error: "Gross amount is required" }, { status: 400 });
    }

    const orderId = order_id || `TRX-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
    const secret = process.env.MIDTRANS_SERVER_KEY;
    const isProd = process.env.NEXT_PUBLIC_MIDTRANS_IS_PRODUCTION === "true";
    const apiUrl = isProd 
      ? 'https://app.midtrans.com/snap/v1/transactions'
      : 'https://app.sandbox.midtrans.com/snap/v1/transactions';

    if (!secret) throw new Error("MIDTRANS_SERVER_KEY is not configured.");

    const payload = {
      transaction_details: {
        order_id: orderId,
        gross_amount: Math.round(gross_amount),
      },
      customer_details: customer_details || {
        first_name: "Tamu",
        email: "guest@ciburial.desa.id",
      },
      item_details: item_details || [],
    };

    const response = await fetch(apiUrl, {
      method: 'POST',
      headers: {
        'Accept': 'application/json',
        'Content-Type': 'application/json',
        'Authorization': `Basic ${Buffer.from(secret + ':').toString('base64')}`,
      },
      body: JSON.stringify(payload),
    });

    const data = await response.json();

    if (!response.ok) {
      return NextResponse.json({ error: data.error_messages || "Error contacting midtrans" }, { status: response.status });
    }

    // data.token is the Snap Token needed for the frontend pop-up
    return NextResponse.json({
      token: data.token,
      redirect_url: data.redirect_url,
      order_id: orderId
    });
  } catch (error: any) {
    console.error("Tokenize Error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
