import { NextResponse } from 'next/server';
import { backendClient } from '@/lib/backendClient';

export const dynamic = 'force-dynamic';

export async function GET(req: Request, { params }: { params: Promise<{ key: string }> }) {
  try {
    const { key } = await params;
    const res = await backendClient.get(`/api/Settings/${key}`);
    return NextResponse.json(res);
  } catch (error: any) {
    const isNotFound = error.message && error.message.includes('Not Found');
    return NextResponse.json({ error: error.message }, { status: isNotFound ? 404 : (error.response?.status || 500) });
  }
}
