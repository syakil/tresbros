import { NextResponse } from 'next/server';
import { cookies, headers } from 'next/headers';

const BACKEND_URL = process.env.BACKEND_URL || 'http://localhost:5052';

export async function GET(req: Request) {
  try {
    // Get Auth Token
    const headerStore = await headers();
    let authHeader = headerStore.get('authorization');
    if (!authHeader) {
      const cookieStore = await cookies();
      const token = cookieStore.get('tresbros_token')?.value;
      if (token) authHeader = `Bearer ${token}`;
    }

    const fetchHeaders: HeadersInit = {};
    if (authHeader) fetchHeaders['Authorization'] = authHeader;

    const res = await fetch(`${BACKEND_URL}/api/Material/export`, {
      headers: fetchHeaders,
      cache: 'no-store'
    });

    if (!res.ok) {
        throw new Error(`Export failed: ${res.statusText}`);
    }
    
    // Return the response as a file stream
    return new NextResponse(res.body, {
        headers: {
            'Content-Type': 'text/csv',
            'Content-Disposition': 'attachment; filename="stock_export.csv"'
        }
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
