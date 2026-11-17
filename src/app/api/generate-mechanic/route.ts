import { NextResponse } from 'next/server';
import { generateBalanceCards } from '@/lib/ai/balanceArbiter';
import { Character } from '@/types/character';

export async function POST(request: Request) {
  try {
    let body: unknown;
    try {
      body = await request.json();
    } catch {
      return NextResponse.json({ error: 'Invalid JSON request body' }, { status: 400 });
    }

    if (!body || typeof body !== 'object') {
      return NextResponse.json({ error: 'Request body must be an object' }, { status: 400 });
    }

    const { flavorText, character } = body as {
      flavorText?: unknown;
      character?: Partial<Character>;
    };

    if (flavorText === undefined || flavorText === null || typeof flavorText !== 'string') {
      return NextResponse.json(
        { error: 'Missing or invalid "flavorText" property (expected a string)' },
        { status: 400 }
      );
    }

    const cards = await generateBalanceCards(flavorText, character);
    return NextResponse.json({ cards }, { status: 200 });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Internal Server Error';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
