import { NextResponse } from 'next/server';
import { backendClient } from '@/lib/backendClient';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const categories = await backendClient.get('/api/Category');
    return NextResponse.json(categories);
  } catch (error: any) {
    console.error("Failed to fetch categories:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
