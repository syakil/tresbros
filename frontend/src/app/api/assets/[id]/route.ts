import { NextResponse } from 'next/server';
import axios from 'axios';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api';

export async function GET(request: Request, { params }: { params: { id: string } }) {
  try {
    const response = await axios.get(`${API_URL}/Asset/${params.id}`);
    return NextResponse.json(response.data);
  } catch (error: any) {
    return NextResponse.json(
      { error: error.response?.data || 'Failed to fetch asset' },
      { status: error.response?.status || 500 }
    );
  }
}

export async function DELETE(request: Request, { params }: { params: { id: string } }) {
  try {
    const url = new URL(request.url);
    const searchParams = url.searchParams.toString();
    const targetUrl = `${API_URL}/Asset/${params.id}${searchParams ? '?' + searchParams : ''}`;
    const response = await axios.delete(targetUrl);
    return NextResponse.json(response.data || { success: true });
  } catch (error: any) {
    return NextResponse.json(
      { error: error.response?.data || 'Failed to dispose asset' },
      { status: error.response?.status || 500 }
    );
  }
}
