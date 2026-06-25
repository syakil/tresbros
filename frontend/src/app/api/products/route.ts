import { NextResponse } from 'next/server';
import { backendClient } from '@/lib/backendClient';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const products = await backendClient.get('/api/Product');
    
    // Format for frontend
    const formattedProducts = products.map((p: any) => {
      let maxCanBeMade = Infinity;
      let missingMaterials: string[] = [];
      
      const recipeItems = p.recipeItems || [];
      
      for (const recipe of recipeItems) {
        if (!recipe.material) continue;
        const possible = Math.floor(recipe.material.stock / recipe.quantity);
        if (possible < maxCanBeMade) maxCanBeMade = possible;
        
        // Cek jika stok material ini secara spesifik tidak mencukupi untuk 1 porsi
        if (recipe.material.stock < recipe.quantity) {
          missingMaterials.push(recipe.material.name);
        }
      }
      
      return {
        id: p.id,
        name: p.name,
        price: p.price,
        category: p.category?.name || "Uncategorized",
        availableCount: recipeItems.length > 0 ? maxCanBeMade : null,
        missingMaterials
      };
    });

    return NextResponse.json(formattedProducts);
  } catch (error: any) {
    console.error("Failed to fetch products from backend:", error);
    if (error?.message === "Unauthorized") return NextResponse.json({ error: "Unauthorized" }, { status: 401 }); if (error?.message === "Unauthorized") return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { name, price, category } = body;

    // First fetch categories to see if it exists, or create it.
    // The .NET backend doesn't have an 'upsert', so we might need to GET first or just POST and handle the new ID.
    // But actually, we can just let .NET handle it if we create a specialized endpoint, or we can do it in two steps.
    const categories = await backendClient.get('/api/Category');
    let cat = categories.find((c: any) => c.name === category);
    
    if (!cat) {
        cat = await backendClient.post('/api/Category', { name: category });
    }

    const newProduct = await backendClient.post('/api/Product', {
        name,
        price: parseFloat(price),
        categoryId: cat.id
    });

    return NextResponse.json({
      id: newProduct.id,
      name: newProduct.name,
      price: newProduct.price,
      category: cat.name
    }, { status: 201 });
  } catch (error: any) {
    console.error("Failed to add product via backend:", error.message);
    return NextResponse.json({ error: error.message || "Internal Server Error" }, { status: 500 });
  }
}

