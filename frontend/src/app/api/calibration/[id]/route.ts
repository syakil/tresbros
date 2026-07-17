import { NextResponse } from 'next/server';
import { backendClient } from '@/lib/backendClient';

export async function DELETE(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const data = await backendClient.delete(`/api/Calibration/${id}`);
    return NextResponse.json(data);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
