import { NextResponse } from 'next/server';
import { backendClient } from '@/lib/backendClient';

export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
    try {
        const { id } = await params;
        const data = await backendClient.post(`/api/RnD/${id}/test`, {});
        return NextResponse.json(data);
    } catch (error: any) {
        if (error.message?.includes('401') || error.message?.includes('Unauthorized')) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }
        return NextResponse.json({ error: error.message || 'Internal Server Error' }, { status: 500 });
    }
}
