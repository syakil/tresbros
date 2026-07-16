import { NextResponse } from 'next/server';
import axios from 'axios';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api';

export async function POST(request: Request, { params }: { params: { id: string } }) {
  try {
    const data = await request.json();
    const response = await axios.post(`${API_URL}/Asset/${params.id}/depreciate`, data);
    return NextResponse.json(response.data);
  } catch (error: any) {
    return NextResponse.json(
      { error: error.response?.data || 'Failed to depreciate asset' },
      { status: error.response?.status || 500 }
    );
  }
}
