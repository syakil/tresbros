import { NextResponse } from 'next/server';
import { backendClient } from '@/lib/backendClient';

export const dynamic = 'force-dynamic';

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const productId = searchParams.get('productId');

    if (!productId) {
      return NextResponse.json({ error: "productId is required" }, { status: 400 });
    }

    const recipeItems = await backendClient.get(`/api/RecipeItem?productId=${productId}`);

    return NextResponse.json(recipeItems);
  } catch (error: any) {
    console.error("Failed to fetch recipe:", error);
    return NextResponse.json({ error: error.message || "Internal Server Error" }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { productId, materialId, quantity } = body;

    if (!productId || !materialId || quantity <= 0) {
      return NextResponse.json({ error: "Invalid data" }, { status: 400 });
    }

    const newItem = await backendClient.post('/api/RecipeItem', {
      productId: parseInt(productId),
      materialId: parseInt(materialId),
      quantity: parseFloat(quantity)
    });

    return NextResponse.json(newItem, { status: 201 });
  } catch (error: any) {
    console.error("Failed to add recipe item:", error);
    return NextResponse.json({ error: error.message || "Internal Server Error" }, { status: 500 });
  }
}
