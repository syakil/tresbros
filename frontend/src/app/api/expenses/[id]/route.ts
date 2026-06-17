import { NextResponse } from 'next/server';
import { backendClient } from '@/lib/backendClient';

export async function DELETE(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const resolvedParams = await params;
    const id = parseInt(resolvedParams.id);
    if (isNaN(id)) {
      return NextResponse.json({ error: "Invalid ID" }, { status: 400 });
    }

    await backendClient.delete(`/api/Finance/expenses/${id}`);

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error("DELETE Expense Error:", error);
    return NextResponse.json({ error: error.message || "Internal Server Error" }, { status: 500 });
  }
}

export async function PUT(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const resolvedParams = await params;
    const id = parseInt(resolvedParams.id);
    if (isNaN(id)) {
      return NextResponse.json({ error: "Invalid ID" }, { status: 400 });
    }

    const data = await request.json();
    const { description, amount, date, imageUrl } = data;

    if (!description || !amount) {
      return NextResponse.json({ error: "Description and amount are required" }, { status: 400 });
    }

    const existingExpense = await backendClient.get(`/api/Finance/expenses/${id}`);

    const expense = await backendClient.put(`/api/Finance/expenses/${id}`, {
      ...existingExpense,
      description,
      amount: parseFloat(amount),
      date: date ? new Date(date).toISOString() : existingExpense.date,
      imageUrl: imageUrl !== undefined ? imageUrl : existingExpense.imageUrl
    });

    return NextResponse.json(expense || { success: true });
  } catch (error: any) {
    console.error("PUT Expense Error:", error);
    return NextResponse.json({ error: error.message || "Internal Server Error" }, { status: 500 });
  }
}
