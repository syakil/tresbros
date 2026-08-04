import { NextResponse } from 'next/server';
import { backendClient } from '@/lib/backendClient';

export async function GET() {
  try {
    const res = await backendClient.get('/api/Accounting/Journals');
    return NextResponse.json(res);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: error.response?.status || 500 });
  }
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const res = await backendClient.post('/api/Accounting/Journals', body);
    return NextResponse.json(res);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
