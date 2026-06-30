import { NextResponse } from 'next/server';
import { backendClient } from '@/lib/backendClient';

export async function DELETE(req: Request, context: any) {
  try {
    const params = await context.params;
    const id = parseInt(params.id);
    
    // .NET backend will throw if there's a FK constraint error with OrderItem.
    // If it throws, backendClient will throw with the error message.
    await backendClient.delete(`/api/Product/${id}`);

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error("Failed to delete product:", error);
    return NextResponse.json({ error: error.message || "Internal Server Error" }, { status: 500 });
  }
}

export async function PUT(req: Request, context: any) {
  try {
    const params = await context.params;
    const id = parseInt(params.id);
    const body = await req.json();
    const { name, price, category } = body;

    const categories = await backendClient.get('/api/Category');
    let cat = categories.find((c: any) => c.name === category);
    
    if (!cat) {
        cat = await backendClient.post('/api/Category', { name: category });
    }

    const updatedProduct = await backendClient.put(`/api/Product/${id}`, {
        id,
        name,
        price: parseFloat(price),
        categoryId: cat.id
    });

    return NextResponse.json(updatedProduct);
  } catch (error: any) {
    console.error("Failed to update product:", error);
    return NextResponse.json({ error: error.message || "Internal Server Error" }, { status: 500 });
  }
}
