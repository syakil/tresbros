import { NextResponse } from 'next/server';
import axios from 'axios';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api';

export async function GET() {
  try {
    const response = await axios.get(`${API_URL}/Asset/report`);
    return NextResponse.json(response.data);
  } catch (error: any) {
    return NextResponse.json(
      { error: error.response?.data || 'Failed to fetch asset report' },
      { status: error.response?.status || 500 }
    );
  }
}
