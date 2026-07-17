import { NextResponse } from 'next/server';
import { backendClient } from '@/lib/backendClient';

export async function GET() {
  try {
    const res = await backendClient.get('/api/Closing');
    return NextResponse.json(res);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: error.response?.status || 500 });
  }
}
