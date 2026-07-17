import { NextResponse } from 'next/server';
import { backendClient } from '@/lib/backendClient';

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const res = await backendClient.post('/api/Closing/eoy', body);
    return NextResponse.json(res);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: error.response?.status || 500 });
  }
}
