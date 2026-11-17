import { NextResponse } from 'next/server';
import { getCharacterRecord } from '@/lib/storage/characterStore';

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
