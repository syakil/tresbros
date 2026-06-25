import { NextResponse } from 'next/server';
import { backendClient } from '@/lib/backendClient';

export async function GET() {
  try {
    const expenses = await backendClient.get('/api/Finance/expenses');
    return NextResponse.json(expenses);
  } catch (error: any) {
    console.error("GET Expenses Error:", error);
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

    const expense = await backendClient.post('/api/Finance/expenses', {
      description,
      amount: parseFloat(amount),
      date: date ? new Date(date).toISOString() : new Date().toISOString(),
      imageUrl: imageUrl || null
    });

    return NextResponse.json(expense, { status: 201 });
  } catch (error: any) {
    console.error("POST Expense Error:", error);
    if (error?.message === "Unauthorized") return NextResponse.json({ error: "Unauthorized" }, { status: 401 }); if (error?.message === "Unauthorized") return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}

