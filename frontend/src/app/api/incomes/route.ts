import { NextResponse } from 'next/server';
import { backendClient } from '@/lib/backendClient';

export async function GET() {
  try {
    const incomes = await backendClient.get('/api/Finance/incomes');
    return NextResponse.json(incomes);
  } catch (error: any) {
    console.error("GET Incomes Error:", error);
    if (error?.message === "Unauthorized") return NextResponse.json({ error: "Unauthorized" }, { status: 401 }); if (error?.message === "Unauthorized") return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const data = await request.json();
    const { description, amount, date, imageUrl } = data;

    if (!description || !amount) {
      return NextResponse.json({ error: "Description and amount are required" }, { status: 400 });
    }

    const income = await backendClient.post('/api/Finance/incomes', {
      description,
      amount: parseFloat(amount),
      date: date ? new Date(date).toISOString() : new Date().toISOString(),
      imageUrl: imageUrl || null
    });

    return NextResponse.json(income, { status: 201 });
  } catch (error: any) {
    console.error("POST Income Error:", error);
    if (error?.message === "Unauthorized") return NextResponse.json({ error: "Unauthorized" }, { status: 401 }); if (error?.message === "Unauthorized") return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}

