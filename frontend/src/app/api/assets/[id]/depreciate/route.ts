import { NextResponse } from 'next/server';
import { backendClient } from '@/lib/backendClient';

export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const body = await request.json();
    const data = await backendClient.post(`/api/Asset/${id}/depreciate`, body);
    return NextResponse.json(data);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
