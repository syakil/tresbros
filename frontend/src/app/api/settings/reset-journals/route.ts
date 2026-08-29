import { NextResponse } from 'next/server';
import { backendClient } from '@/lib/backendClient';

export async function POST() {
  try {
    const response = await backendClient.post('/api/Settings/reset-journals', {});
    return NextResponse.json(response.data, { status: 200 });
  } catch (error: any) {
    return NextResponse.json(
      { error: error.response?.data?.error || error.message || "Internal Server Error" },
      { status: error.response?.status || 500 }
    );
  }
}
