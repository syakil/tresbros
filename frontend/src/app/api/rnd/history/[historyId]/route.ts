import { NextResponse } from 'next/server';
import { backendClient } from '@/lib/backendClient';

export async function PUT(request: Request, { params }: { params: Promise<{ historyId: string }> }) {
    try {
        const { historyId } = await params;
        const body = await request.json();
        const data = await backendClient.put(`/api/RnD/history/${historyId}`, body);
        return NextResponse.json(data);
    } catch (error: any) {
        if (error.message?.includes('401') || error.message?.includes('Unauthorized')) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }
        return NextResponse.json({ error: error.message || 'Internal Server Error' }, { status: 500 });
    }
}
