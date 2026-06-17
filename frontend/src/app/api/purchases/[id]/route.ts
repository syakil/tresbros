import { NextResponse } from 'next/server';
import { backendClient } from '@/lib/backendClient';

export async function PATCH(req: Request, context: any) {
  try {
    const params = await context.params;
    const id = params.id;
    const body = await req.json();
    const { action } = body;

    if (action === 'cancel') {
      const purchaseId = parseInt(id, 10);
      
      if (isNaN(purchaseId)) {
        return NextResponse.json({ error: `Invalid purchase ID: ${id}` }, { status: 400 });
      }

      await backendClient.put(`/api/Purchase/${purchaseId}/cancel`, {});

      return NextResponse.json({ success: true, status: 'CANCELLED' });
    }

    return NextResponse.json({ error: 'Invalid action' }, { status: 400 });

  } catch (error: any) {
    console.error("Failed to cancel PO:", error);
    return NextResponse.json({ error: error.message || "Terjadi kesalahan internal" }, { status: 500 });
  }
}
