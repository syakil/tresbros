import { NextResponse } from 'next/server';
import { backendClient } from '@/lib/backendClient';

export async function POST(req: Request, context: any) {
  try {
    const params = await context.params;
    const orderId = parseInt(params.id);

    // Forward cancel request to .NET backend
    await backendClient.post(`/api/Order/${orderId}/cancel`, {});

    return NextResponse.json({ success: true, message: 'Order cancelled successfully' });
  } catch (error: any) {
    console.error("Failed to cancel order:", error);
    const status = error.response?.status || 500;
    const message = error.response?.data?.message || error.message || "Failed to cancel order";
    return NextResponse.json({ error: message }, { status });
  }
}
