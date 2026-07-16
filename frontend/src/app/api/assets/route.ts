import { NextResponse } from 'next/server';
import { backendClient } from '@/lib/backendClient';

export async function GET() {
  try {
    const data = await backendClient.get('/api/Asset');
    return NextResponse.json(data);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const data = await backendClient.post('/api/Asset', body);
    return NextResponse.json(data);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
