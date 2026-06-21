import { NextResponse } from "next/server";

export async function POST(req: Request) {
  try {
    const { phone } = await req.json();

    if (!phone) {
      return NextResponse.json(
        { success: false, message: "Nomor WhatsApp wajib diisi." },
        { status: 400 },
      );
    }

    // Simulasi pembuatan token/link reset (Di tahap produksi, Anda akan menggunakan Supabase Admin Auth)
    const resetLink = `https://shareteagorontalo.com/reset?token=mock123xyz`;

    // Kirim pesan via WhatsApp menggunakan API Fonnte
    const response = await fetch("https://api.fonnte.com/send", {
      method: "POST",
      headers: {
        Authorization: process.env.FONNTE_TOKEN || "TOKEN_FONNTE_ANDA", // Masukkan token Anda di .env.local
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        target: phone,
        message: `*Sharetea Gorontalo*\n\nHalo! Kami menerima permintaan untuk mereset password akun Anda. Silakan klik tautan di bawah ini untuk membuat password baru:\n\n${resetLink}\n\nTautan ini hanya berlaku selama 15 menit. Abaikan pesan ini jika Anda tidak merasa memintanya.`,
        countryCode: "62", // Memastikan format nomor Indonesia
      }),
    });

    const result = await response.json();

    if (result.status) {
      return NextResponse.json({
        success: true,
        message: "Link pemulihan berhasil dikirim ke WhatsApp Anda!",
      });
    } else {
      return NextResponse.json(
        { success: false, message: result.reason },
        { status: 400 },
      );
    }
  } catch (error) {
    console.error("Fonnte API Error:", error);
    return NextResponse.json(
      { success: false, message: "Terjadi kesalahan pada server pengiriman." },
      { status: 500 },
    );
  }
}
