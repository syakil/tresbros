import { NextResponse } from 'next/server';
import { backendClient } from '@/lib/backendClient';

export async function PUT(req: Request, { params }: { params: { id: string } }) {
  try {
    const body = await req.json();
    const response = await backendClient.put(`/api/Customer/${params.id}`, body);
    return NextResponse.json(response);
  } catch (error: any) {
    console.error(`Failed to update customer ${params.id}:`, error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}

export async function DELETE(req: Request, { params }: { params: { id: string } }) {
  try {
    const response = await backendClient.delete(`/api/Customer/${params.id}`);
    return NextResponse.json(response);
  } catch (error: any) {
    console.error(`Failed to delete customer ${params.id}:`, error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
