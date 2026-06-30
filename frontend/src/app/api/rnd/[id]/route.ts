import { NextResponse } from 'next/server';
import { backendClient } from '@/lib/backendClient';

export async function GET(request: Request, { params }: { params: Promise<{ id: string }> }) {
    try {
        const { id } = await params;
        const data = await backendClient.get(`/api/RnD/${id}`);
        return NextResponse.json(data);
    } catch (error: any) {
        if (error.message.includes('401') || error.message.includes('Unauthorized')) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}

export async function PUT(request: Request, { params }: { params: Promise<{ id: string }> }) {
    try {
        const { id } = await params;
        const body = await request.json();
        const data = await backendClient.put(`/api/RnD/${id}`, body);
        return NextResponse.json(data || { success: true });
    } catch (error: any) {
        if (error.message.includes('401') || error.message.includes('Unauthorized')) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }
        return NextResponse.json({ error: error.message || 'Internal Server Error' }, { status: 500 });
    }
}

export async function DELETE(request: Request, { params }: { params: Promise<{ id: string }> }) {
    try {
        const { id } = await params;
        await backendClient.delete(`/api/RnD/${id}`);
        return NextResponse.json({ success: true });
    } catch (error: any) {
        if (error.message.includes('401') || error.message.includes('Unauthorized')) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }
        return NextResponse.json({ error: error.message || 'Internal Server Error' }, { status: 500 });
    }
}
