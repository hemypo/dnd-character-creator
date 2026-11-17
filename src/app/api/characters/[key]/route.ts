import { NextResponse } from 'next/server';
import { getCharacterRecord, updateCharacterRecord } from '@/lib/storage/characterStore';
import { Character } from '@/types/character';

export async function GET(
  request: Request,
  context: { params: { key: string } | Promise<{ key: string }> }
) {
  try {
    const params = await context.params;
    const key = params?.key;

    if (!key || typeof key !== 'string' || key.trim() === '') {
      return NextResponse.json({ error: 'Character key is required' }, { status: 400 });
    }

    const character = await getCharacterRecord(key);

    if (!character) {
      return NextResponse.json(
        { error: `Character with key "${key}" not found` },
        { status: 404 }
      );
    }

    return NextResponse.json({ success: true, character }, { status: 200 });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Internal Server Error';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function PATCH(
  request: Request,
  context: { params: { key: string } | Promise<{ key: string }> }
) {
  try {
    const params = await context.params;
    const key = params?.key;

    if (!key || typeof key !== 'string' || key.trim() === '') {
      return NextResponse.json({ error: 'Character key is required' }, { status: 400 });
    }

    let body: unknown;
    try {
      body = await request.json();
    } catch {
      return NextResponse.json({ error: 'Invalid JSON request body' }, { status: 400 });
    }

    if (!body || typeof body !== 'object') {
      return NextResponse.json({ error: 'Updates must be an object' }, { status: 400 });
    }

    const updates = body as Partial<Character>;
    const updated = await updateCharacterRecord(key, updates);

    if (!updated) {
      return NextResponse.json(
        { error: `Character with key "${key}" not found` },
        { status: 404 }
      );
    }

    return NextResponse.json({ success: true, character: updated }, { status: 200 });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Internal Server Error';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
