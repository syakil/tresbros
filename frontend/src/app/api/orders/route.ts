import { NextResponse } from 'next/server';
import { backendClient } from '@/lib/backendClient';

export const dynamic = 'force-dynamic';

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { customerName, totalAmount, items, couponCode, discountAmount, paymentMethod } = body;

    // We can handle coupon logic directly in .NET or do it here. 
    // The .NET backend doesn't automatically increment coupon usage right now, so we do it via a separate PUT or skip it for now.
    // For now, just forward the order creation.
    const newOrder = await backendClient.post('/api/Order', {
      customerName: customerName || null,
      totalAmount,
      couponCode: couponCode || null,
      discountAmount: discountAmount || 0,
      paymentMethod: paymentMethod || 'CASH',
      status: 'TODO',
      items: items.map((item: any) => ({
        productId: item.id,
        quantity: item.quantity,
        price: item.price,
        notes: item.notes || null,
      }))
    });

    return NextResponse.json(newOrder, { status: 201 });
  } catch (error: any) {
    console.error("Failed to create order:", error);
    const status = error.message?.includes("Internal Server Error") ? 500 : 400;
    return NextResponse.json({ error: error.message || "Internal Server Error" }, { status });
  }
}

export async function GET() {
  try {
    const orders = await backendClient.get('/api/Order');
    // Filter out failed orders
    const activeOrders = orders.filter((o: any) => o.paymentStatus !== 'failed');
    // Ensure ascending order if backend sends descending
    activeOrders.sort((a: any, b: any) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());

    return NextResponse.json(activeOrders);
  } catch (error: any) {
    console.error("Failed to fetch orders:", error);
    return NextResponse.json({ error: error.message || "Internal Server Error" }, { status: 500 });
  }
}
