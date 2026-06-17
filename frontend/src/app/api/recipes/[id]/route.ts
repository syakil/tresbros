import { NextResponse } from 'next/server';
import { backendClient } from '@/lib/backendClient';

export async function DELETE(req: Request, context: any) {
  try {
    const params = await context.params;
    const id = parseInt(params.id);

    if (isNaN(id)) {
      return NextResponse.json({ error: "Invalid ID" }, { status: 400 });
    }

    await backendClient.delete(`/api/RecipeItem/${id}`);

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error("Failed to delete recipe item:", error);
    return NextResponse.json({ error: error.message || "Internal Server Error" }, { status: 500 });
  }
}
