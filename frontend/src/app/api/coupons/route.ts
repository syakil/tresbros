import { NextResponse } from 'next/server';
import { backendClient } from '@/lib/backendClient';

export async function GET() {
  try {
    const coupons = await backendClient.get('/api/Coupon');
    return NextResponse.json(coupons);
  } catch (error: any) {
    console.error("Failed to fetch coupons:", error);
    if (error?.message === "Unauthorized") return NextResponse.json({ error: "Unauthorized" }, { status: 401 }); if (error?.message === "Unauthorized") return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { code, type, value, minPurchase, maxDiscount, maxUsage, isActive } = body;

    const newCoupon = await backendClient.post('/api/Coupon', {
      code: code.toUpperCase(),
      type,
      value: parseFloat(value),
      minPurchase: parseFloat(minPurchase || 0),
      maxDiscount: maxDiscount ? parseFloat(maxDiscount) : null,
      maxUsage: parseInt(maxUsage, 10),
      isActive: isActive !== undefined ? isActive : true,
      currentUsage: 0
    });

    return NextResponse.json(newCoupon, { status: 201 });
  } catch (error: any) {
    console.error("Failed to create coupon:", error);
    return NextResponse.json({ error: error.message || "Internal Server Error" }, { status: 500 });
  }
}

