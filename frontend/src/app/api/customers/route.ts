import { NextResponse } from 'next/server';
import { backendClient } from '@/lib/backendClient';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const response = await backendClient.get('/api/Customer');
    return NextResponse.json(response);
  } catch (error: any) {
    console.error("Failed to fetch customers:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const response = await backendClient.post('/api/Customer', body);
    return NextResponse.json(response);
  } catch (error: any) {
    console.error("Failed to create customer:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
