import { NextResponse } from 'next/server';
import { backendClient } from '@/lib/backendClient';

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const accountId = searchParams.get('accountId');
    const startDate = searchParams.get('startDate');
    const endDate = searchParams.get('endDate');

    const query = new URLSearchParams();
    if (accountId) query.append('accountId', accountId);
    if (startDate) query.append('startDate', startDate);
    if (endDate) query.append('endDate', endDate);

    const res = await backendClient.get(`/api/Accounting/Ledger?${query.toString()}`);
    return NextResponse.json(res);
  } catch (error: any) {
    const isNotFound = error.message && error.message.includes('Not Found');
    const isBadRequest = error.message && error.message.includes('Bad Request');
    let status = 500;
    if (isNotFound) status = 404;
    else if (isBadRequest) status = 400;
    else if (error.response?.status) status = error.response.status;

    return NextResponse.json({ error: error.message }, { status });
  }
}
