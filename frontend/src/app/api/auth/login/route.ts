import { NextResponse } from 'next/server';
import { backendClient } from '@/lib/backendClient';

export async function POST(req: Request) {
  try {
    const body = await req.json();
    
    // Call backend API (AuthController.cs allows anonymous)
    const data = await backendClient.post('/api/Auth/login', body);

    const { token, user } = data;

    if (!token) {
      return NextResponse.json({ error: 'Token tidak diterima dari server.' }, { status: 401 });
    }

    const response = NextResponse.json({ user, success: true });

    // Set HttpOnly cookie
    response.cookies.set({
      name: 'tresbros_token',
      value: token,
      httpOnly: true,
      path: '/',
      secure: process.env.NODE_ENV === 'production',
      maxAge: 60 * 60 * 24 * 7 // 7 days
    });
    
    // Also store user info in a non-httponly cookie so client can read basic info
    response.cookies.set({
      name: 'tresbros_user',
      value: JSON.stringify(user),
      httpOnly: false,
      path: '/',
      secure: process.env.NODE_ENV === 'production',
      maxAge: 60 * 60 * 24 * 7
    });

    return response;
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 401 });
  }
}
