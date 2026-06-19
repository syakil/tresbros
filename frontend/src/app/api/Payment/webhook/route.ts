import { NextResponse } from 'next/server';
import { backendClient } from '@/lib/backendClient';

export async function POST(req: Request) {
  try {
    const body = await req.json();
    
    // Forward the webhook payload to the .NET backend
    const response = await backendClient.post('/api/Payment/webhook', body);
    
    return NextResponse.json(response, { status: 200 });
  } catch (error: any) {
    console.error("Failed to forward Midtrans webhook:", error);
    // Midtrans expects a 200 OK or it will retry. If it's a genuine processing error, we might return 500,
    // but typically we should return 200 if we received it, though forwarding failure means we should probably let it retry.
    return NextResponse.json({ error: error.message || "Internal Server Error" }, { status: 500 });
  }
}
