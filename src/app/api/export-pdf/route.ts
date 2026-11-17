import { NextResponse } from 'next/server';
import { generateCharacterPdf } from '@/lib/pdf/pdfExporter';
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
    const rawCharacter = (payload.character || payload) as unknown;

    if (!rawCharacter || typeof rawCharacter !== 'object') {
      return NextResponse.json(
        { error: 'Character data must be provided as an object' },
        { status: 400 }
      );
    }

    if (!validateCharacter(rawCharacter)) {
      return NextResponse.json(
        { error: 'Character validation failed: required fields missing or invalid' },
        { status: 400 }
      );
    }

    const character = rawCharacter as Character;
    const pdfBytes = await generateCharacterPdf(character);

    // Prepare HTTP-safe and UTF-8 friendly attachment filename
    const safeBaseName = encodeURIComponent((character.name || 'character').trim());
    const disposition = `attachment; filename="${safeBaseName}_2024.pdf"; filename*=UTF-8''${safeBaseName}_2024.pdf`;

    return new Response(Buffer.from(pdfBytes), {
      status: 200,
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': disposition,
        'Content-Length': pdfBytes.length.toString(),
      },
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Internal Server Error';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
