import { NextResponse } from 'next/server';
import { backendClient } from '@/lib/backendClient';

export const dynamic = 'force-dynamic';

export async function POST() {
  try {
    const res = await backendClient.post('/api/Settings/reset', {});
    return NextResponse.json(res);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: error.response?.status || 500 });
  }
}
