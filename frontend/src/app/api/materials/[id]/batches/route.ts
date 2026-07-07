import { NextResponse } from 'next/server';
import { backendClient } from '@/lib/backendClient';

export async function GET(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const response = await backendClient.get(`/api/Material/${id}/batches`);
    return NextResponse.json(response);
  } catch (error: any) {
    console.error("BATCHES FETCH ERROR:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function PUT(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const body = await req.json();
    const { batchId, originalQty, remainingQty, unitPrice } = body;
    
    const response = await backendClient.put(`/api/Material/batches/${batchId}`, {
      originalQty: Number(originalQty),
      remainingQty: Number(remainingQty),
      unitPrice: Number(unitPrice),
    });
    
    return NextResponse.json(response || { success: true });
  } catch (error: any) {
    console.error("BATCH UPDATE ERROR:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
