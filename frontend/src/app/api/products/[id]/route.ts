import { NextResponse } from 'next/server';
import { backendClient } from '@/lib/backendClient';

export async function DELETE(req: Request, context: any) {
  try {
    const params = await context.params;
    const id = parseInt(params.id);
    
    // .NET backend will throw if there's a FK constraint error with OrderItem.
    // If it throws, backendClient will throw with the error message.
    await backendClient.delete(`/api/Product/${id}`);

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error("Failed to delete product:", error);
    return NextResponse.json({ error: error.message || "Internal Server Error" }, { status: 500 });
  }
}
