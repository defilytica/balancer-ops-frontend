import { NextRequest, NextResponse } from 'next/server';

const RPC_BASE_URL = 'https://lb.drpc.org/ogrpc';
const API_KEY = process.env.DRPC_API_KEY;

export async function POST(request: NextRequest, { params }: { params: { network: string[] } }) {
    const network = params.network.join('/');
    const body = await request.json();

    if (!API_KEY) {
        return NextResponse.json({ error: 'API key not configured' }, { status: 500 });
    }

    try {
        const response = await fetch(`${RPC_BASE_URL}?network=${network}&dkey=${API_KEY}`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(body),
        });

        const data = await response.json();
        return NextResponse.json(data);
    } catch (error) {
        return NextResponse.json({ error: 'Failed to fetch from RPC endpoint' }, { status: 500 });
    }
}
