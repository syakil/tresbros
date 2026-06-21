import { NextResponse } from 'next/server';
import { backendClient } from '@/lib/backendClient';

export async function PUT(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const body = await req.json();
    
    // First get existing user
    const existingUser = await backendClient.get(`/api/User/${id}`);
    
    // Update fields
    const updatedUser = await backendClient.put(`/api/User/${id}`, {
      ...existingUser,
      ...body
    });

    return NextResponse.json(updatedUser || { success: true });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function DELETE(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    await backendClient.delete(`/api/User/${id}`);
    return NextResponse.json({ success: true });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
