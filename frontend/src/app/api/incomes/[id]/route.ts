import { NextResponse } from 'next/server';
import { backendClient } from '@/lib/backendClient';

export async function DELETE(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const resolvedParams = await params;
    const id = parseInt(resolvedParams.id);
    if (isNaN(id)) {
      return NextResponse.json({ error: "Invalid ID" }, { status: 400 });
    }

    await backendClient.delete(`/api/Finance/incomes/${id}`);

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error("DELETE Income Error:", error);
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

    const existingIncome = await backendClient.get(`/api/Finance/incomes/${id}`);

    const income = await backendClient.put(`/api/Finance/incomes/${id}`, {
      ...existingIncome,
      description,
      amount: parseFloat(amount),
      date: date ? new Date(date).toISOString() : existingIncome.date,
      imageUrl: imageUrl !== undefined ? imageUrl : existingIncome.imageUrl
    });

    return NextResponse.json(income || { success: true });
  } catch (error: any) {
    console.error("PUT Income Error:", error);
    return NextResponse.json({ error: error.message || "Internal Server Error" }, { status: 500 });
  }
}
