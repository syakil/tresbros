import { NextResponse } from 'next/server';
import { backendClient } from '@/lib/backendClient';

export async function PUT(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const id = parseInt((await params).id);
    const body = await req.json();
    const { isActive } = body;

    const existingCoupon = await backendClient.get(`/api/Coupon/${id}`);
    
    const updatedCoupon = await backendClient.put(`/api/Coupon/${id}`, {
      ...existingCoupon,
      isActive
    });

    return NextResponse.json(updatedCoupon || { success: true });
  } catch (error: any) {
    console.error("Failed to update coupon:", error);
    return NextResponse.json({ error: error.message || "Internal Server Error" }, { status: 500 });
  }
}

export async function DELETE(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const id = parseInt((await params).id);
    await backendClient.delete(`/api/Coupon/${id}`);
    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error("Failed to delete coupon:", error);
    return NextResponse.json({ error: error.message || "Internal Server Error" }, { status: 500 });
  }
}
