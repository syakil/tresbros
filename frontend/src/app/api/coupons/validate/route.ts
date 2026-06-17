import { NextResponse } from 'next/server';
import { backendClient } from '@/lib/backendClient';

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { code, subtotal } = body;

    if (!code) {
      return NextResponse.json({ error: "Kode kupon wajib diisi" }, { status: 400 });
    }

    const coupons = await backendClient.get('/api/Coupon');
    const coupon = coupons.find((c: any) => c.code === code.toUpperCase());

    if (!coupon) {
      return NextResponse.json({ error: "Kupon tidak ditemukan" }, { status: 404 });
    }

    if (!coupon.isActive) {
      return NextResponse.json({ error: "Kupon sudah tidak aktif" }, { status: 400 });
    }

    if (coupon.currentUsage >= coupon.maxUsage) {
      return NextResponse.json({ error: "Kuota kupon sudah habis" }, { status: 400 });
    }

    if (subtotal < coupon.minPurchase) {
      return NextResponse.json({ error: `Minimal belanja untuk kupon ini adalah Rp ${coupon.minPurchase}` }, { status: 400 });
    }

    let discountAmount = 0;
    if (coupon.type === 'NOMINAL') {
      discountAmount = coupon.value;
    } else if (coupon.type === 'PERCENTAGE') {
      discountAmount = (subtotal * coupon.value) / 100;
      if (coupon.maxDiscount && discountAmount > coupon.maxDiscount) {
        discountAmount = coupon.maxDiscount;
      }
    }

    // Pastikan diskon tidak melebihi subtotal
    if (discountAmount > subtotal) {
      discountAmount = subtotal;
    }

    return NextResponse.json({
      success: true,
      coupon,
      calculatedDiscount: discountAmount
    });
  } catch (error: any) {
    console.error("Failed to validate coupon:", error);
    return NextResponse.json({ error: error.message || "Internal Server Error" }, { status: 500 });
  }
}
