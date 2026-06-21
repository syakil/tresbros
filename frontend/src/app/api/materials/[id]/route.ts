import { NextResponse } from 'next/server';
import { backendClient } from '@/lib/backendClient';

export async function PUT(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const body = await req.json();
    const { action, adjustType, quantity, name, unit, minStock } = body;

    // Fetch the existing material from backend
    const existingMaterial = await backendClient.get(`/api/Material/${id}`);

    if (action === 'update_master') {
      const updatedMaterial = await backendClient.put(`/api/Material/${id}`, {
        ...existingMaterial,
        name,
        unit,
        minStock: Number(minStock),
      });
      return NextResponse.json(updatedMaterial || { success: true });
    }

    if (action === 'adjust_stock') {
      const response = await backendClient.post(`/api/Material/${id}/adjust`, {
        adjustType,
        quantity: Number(quantity),
        totalPrice: Number(body.price || 0),
        notes: body.notes || ''
      });
      return NextResponse.json(response || { success: true });
    }

    // Default legacy PUT logic
    let incrementValue = Number(quantity);
    if (adjustType === 'out') {
      incrementValue = -Math.abs(Number(quantity));
    }

    const updatedMaterial = await backendClient.put(`/api/Material/${id}`, {
      ...existingMaterial,
      stock: existingMaterial.stock + incrementValue
    });

    return NextResponse.json(updatedMaterial || { success: true });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
