import { NextResponse } from 'next/server';
import { backendClient } from '@/lib/backendClient';

export async function POST(request: Request) {
    try {
        const body = await request.json();
        const data = await backendClient.post('/api/Material/bulk', body);
        return NextResponse.json(data);
    } catch (error: any) {
        if (error.message?.includes('401') || error.message?.includes('Unauthorized')) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }
        return NextResponse.json(
            { error: error.message || 'Failed to bulk create materials' },
            { status: 500 }
        );
    }
}
