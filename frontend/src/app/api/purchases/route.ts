import { NextResponse } from 'next/server';
import { backendClient } from '@/lib/backendClient';
import { writeFile, mkdir } from 'fs/promises';
import path from 'path';

export async function GET() {
  try {
    const purchases = await backendClient.get('/api/Purchase');
    return NextResponse.json(purchases);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { supplierName, items, receiptBase64, receiptFileName } = body;
    
    let receiptUrl = null;
    if (receiptBase64 && receiptFileName) {
      try {
        const base64Data = receiptBase64.replace(/^data:image\/\w+;base64,/, '');
        const buffer = Buffer.from(base64Data, 'base64');
        const uploadDir = path.join(process.cwd(), 'public', 'uploads', 'receipts');
        
        await mkdir(uploadDir, { recursive: true });
        
        const safeFileName = receiptFileName.replace(/[^a-zA-Z0-9.-]/g, '_');
        const fileName = `${Date.now()}-${safeFileName}`;
        const filePath = path.join(uploadDir, fileName);
        
        await writeFile(filePath, buffer);
        receiptUrl = `/uploads/receipts/${fileName}`;
      } catch (err) {
        console.error("Failed to save receipt image:", err);
      }
    }
    
    const totalAmount = items.reduce((acc: number, item: any) => acc + (Number(item.price) || 0), 0);
    const dateStr = new Date().toISOString().replace(/[-:T.]/g, '').slice(0, 8);
    const purchaseNo = `PO-${dateStr}-${Math.floor(Math.random() * 1000).toString().padStart(3, '0')}`;

    // backendClient will call the .NET API which will increment stock natively
    const purchase = await backendClient.post('/api/Purchase', {
      purchaseNo,
      supplierName,
      totalAmount,
      receiptUrl,
      items: items.map((item: any) => ({
        materialId: Number(item.materialId),
        quantity: Number(item.quantity),
        price: Number(item.price)
      }))
    });

    return NextResponse.json(purchase);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
