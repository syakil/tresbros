import { NextResponse } from 'next/server';

export async function POST() {
  const response = NextResponse.json({ success: true });
  
  response.cookies.delete('tresbros_token');
  response.cookies.delete('tresbros_user');

  return response;
}
