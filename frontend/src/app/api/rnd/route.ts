import { NextResponse } from 'next/server';
import { backendClient } from '@/lib/backendClient';

export async function GET() {
    try {
        const data = await backendClient.get('/api/RnD');
        return NextResponse.json(data);
    } catch (error: any) {
        if (error.message.includes('401') || error.message.includes('Unauthorized')) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}

export async function POST(request: Request) {
    try {
        const body = await request.json();
        const data = await backendClient.post('/api/RnD', body);
        return NextResponse.json(data, { status: 201 });
    } catch (error: any) {
        if (error.message.includes('401') || error.message.includes('Unauthorized')) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }
        return NextResponse.json({ error: error.message || 'Internal Server Error' }, { status: 500 });
    }
}
