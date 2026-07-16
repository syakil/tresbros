import { NextResponse } from 'next/server';
import { backendClient } from '@/lib/backendClient';

export async function GET() {
  try {
    const data = await backendClient.get('/api/Asset/report');
    return NextResponse.json(data);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
