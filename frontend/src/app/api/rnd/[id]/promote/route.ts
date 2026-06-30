import { NextResponse } from 'next/server';
import { backendClient } from '@/lib/backendClient';

export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
    try {
        const { id } = await params;
        const body = await request.json();
        
        let categoryId = body.categoryId;
        if (body.categoryName) {
            const categories = await backendClient.get('/api/Category');
            let cat = categories.find((c: any) => c.name === body.categoryName);
            if (!cat) {
                cat = await backendClient.post('/api/Category', { name: body.categoryName });
            }
            categoryId = cat.id;
        }

        const data = await backendClient.post(`/api/RnD/${id}/promote`, { price: parseFloat(body.price), categoryId: categoryId || 1 });
        return NextResponse.json(data, { status: 201 });
    } catch (error: any) {
        if (error.message.includes('401') || error.message.includes('Unauthorized')) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }
        return NextResponse.json({ error: error.message || 'Internal Server Error' }, { status: 500 });
    }
}
