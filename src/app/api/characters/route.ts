import { NextResponse } from 'next/server';
import {
  saveCharacterRecord,
  listRecentCharacters,
  generateCharacterKey,
} from '@/lib/storage/characterStore';
import { validateCharacter, Character } from '@/types/character';

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

    const payload = body as Record<string, unknown>;
    const rawCharacter = (payload.character || payload) as Record<string, unknown>;

    if (!rawCharacter || typeof rawCharacter !== 'object') {
      return NextResponse.json({ error: 'Character data must be provided as an object' }, { status: 400 });
    }

    // Ensure candidate has valid id and key shape if not already provided
    const candidate: Record<string, unknown> = {
      ...rawCharacter,
      id:
        typeof rawCharacter.id === 'string' && rawCharacter.id.trim() !== ''
          ? rawCharacter.id
          : `char-${Date.now()}-${Math.random().toString(36).substring(2, 8)}`,
      key:
        typeof rawCharacter.key === 'string' && /^HERO-[A-Za-z0-9_-]+$/i.test(rawCharacter.key)
          ? rawCharacter.key
          : generateCharacterKey(),
    };

    if (!validateCharacter(candidate)) {
      return NextResponse.json(
        { error: 'Character validation failed: required fields missing or invalid' },
        { status: 400 }
      );
    }

    const { key } = await saveCharacterRecord(candidate as Character);
    return NextResponse.json({ success: true, key }, { status: 200 });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Internal Server Error';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function GET(request?: Request) {
  try {
    const characters = await listRecentCharacters();
    return NextResponse.json({ success: true, characters }, { status: 200 });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Internal Server Error';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
