import { NextResponse } from 'next/server';
import { backendClient } from '@/lib/backendClient';

export async function PATCH(req: Request, context: any) {
  try {
    const params = await context.params;
    const orderId = parseInt(params.id);
    const body = await req.json();
    const { status } = body;

    // Send status update to .NET backend.
    // The .NET backend should handle the stock deduction logic to ensure database transaction integrity.
    await backendClient.put(`/api/Order/${orderId}/status`, status, {
        headers: {
            'Content-Type': 'application/json'
        }
    });

    // Fetch the updated order to return
    const updatedOrder = await backendClient.get(`/api/Order/${orderId}`);

    return NextResponse.json(updatedOrder);
  } catch (error: any) {
    console.error("Failed to update order:", error);
    return NextResponse.json({ error: error.message || "Internal Server Error" }, { status: 500 });
  }
}
