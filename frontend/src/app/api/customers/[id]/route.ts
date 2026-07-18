import { NextResponse } from 'next/server';
import { backendClient } from '@/lib/backendClient';

export async function PUT(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const body = await req.json();
    const response = await backendClient.put(`/api/Customer/${id}`, body);
    return NextResponse.json(response);
  } catch (error: any) {
    console.error(`Failed to update customer:`, error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}

export async function DELETE(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const response = await backendClient.delete(`/api/Customer/${id}`);
    return NextResponse.json(response);
  } catch (error: any) {
    console.error(`Failed to delete customer:`, error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
