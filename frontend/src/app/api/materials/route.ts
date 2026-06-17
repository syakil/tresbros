import { NextResponse } from 'next/server';
import { backendClient } from '@/lib/backendClient';

export async function GET() {
  try {
    const materials = await backendClient.get('/api/Material');
    return NextResponse.json(materials);
  } catch (error: any) {
    console.error("BACKEND FETCH ERROR:", error);
    return NextResponse.json({ error: error.message, stack: error.stack }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { name, unit, minStock } = body;
    const material = await backendClient.post('/api/Material', {
        name,
        unit,
        minStock: Number(minStock) || 0,
        stock: 0,
    });
    return NextResponse.json(material);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
