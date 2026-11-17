import { NextResponse } from 'next/server';
import { generateBackstory } from '@/lib/ai/backstoryGenerator';
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

    const { character } = body as { character?: Partial<Character> };

    if (!character || typeof character !== 'object') {
      return NextResponse.json(
        { error: 'Missing or invalid "character" property (expected an object)' },
        { status: 400 }
      );
    }

    const backstory = await generateBackstory(character);
    return NextResponse.json({ backstory }, { status: 200 });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Internal Server Error';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
