import { NextResponse } from 'next/server';
import { cookies, headers } from 'next/headers';

const BACKEND_URL = process.env.BACKEND_URL || 'http://localhost:5052';

export async function POST(req: Request) {
  try {
    const formData = await req.formData();
    
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

    const res = await fetch(`${BACKEND_URL}/api/Material/import`, {
      method: 'POST',
      headers: fetchHeaders,
      body: formData,
      cache: 'no-store'
    });

    if (!res.ok) {
        let errorMsg = res.statusText;
        try {
            const errBody = await res.json();
            errorMsg = errBody.error || errBody.message || errorMsg;
        } catch(e) {}
        throw new Error(errorMsg);
    }
    
    const data = await res.json();
    return NextResponse.json(data);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
