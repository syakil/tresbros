import { NextResponse } from 'next/server';
import { backendClient } from '@/lib/backendClient';

export async function PUT(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const body = await req.json();
    const res = await backendClient.put(`/api/Accounting/COA/${id}`, body);
    return NextResponse.json(res);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: error.response?.status || 500 });
  }
}

export async function DELETE(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const res = await backendClient.delete(`/api/Accounting/COA/${id}`);
    return NextResponse.json(res);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: error.response?.status || 500 });
  }
}
