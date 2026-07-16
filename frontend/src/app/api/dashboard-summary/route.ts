import { NextResponse } from 'next/server';
import { backendClient } from '@/lib/backendClient';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const filter = searchParams.get('filter') || 'today'; 

    // Proxy the request to the optimized .NET DashboardController
    const data = await backendClient.get(`/api/Dashboard/summary?filter=${filter}`);

    return NextResponse.json(data);
  } catch (error: any) {
    console.error('Error fetching dashboard summary:', error);
    return NextResponse.json(
      { message: 'Failed to fetch dashboard data', error: error.message },
      { status: 500 }
    );
  }
}
