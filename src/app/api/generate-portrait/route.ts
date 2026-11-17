import { NextResponse } from 'next/server';
import { generatePortrait } from '@/lib/ai/portraitPipeline';
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

    const { character, photoBase64, presetId, useFreeApi, model } = body as {
      character?: Partial<Character>;
      photoBase64?: unknown;
      presetId?: unknown;
      useFreeApi?: unknown;
      model?: unknown;
    };

    if (!character || typeof character !== 'object') {
      return NextResponse.json(
        { error: 'Missing or invalid "character" property (expected an object)' },
        { status: 400 }
      );
    }

    if (photoBase64 !== undefined && typeof photoBase64 !== 'string') {
      return NextResponse.json(
        { error: 'Invalid "photoBase64" property (expected a string)' },
        { status: 400 }
      );
    }

    if (presetId !== undefined && typeof presetId !== 'string') {
      return NextResponse.json(
        { error: 'Invalid "presetId" property (expected a string)' },
        { status: 400 }
      );
    }

    try {
      const result = await generatePortrait({
        character,
        photoBase64: photoBase64 as string | undefined,
        presetId: presetId as string | undefined,
        useFreeApi: typeof useFreeApi === 'boolean' ? useFreeApi : undefined,
        model: typeof model === 'string' ? model : undefined,
      });

      return NextResponse.json({ portraitUrl: result.portraitUrl }, { status: 200 });
    } catch (validationOrGenError) {
      const message =
        validationOrGenError instanceof Error
          ? validationOrGenError.message
          : 'Failed to generate portrait';

      // Known client validation errors (e.g. 5MB photo limit, invalid base64 encoding)
      if (
        /5MB|size exceeds|oversized|invalid or corrupted photo|malformed/i.test(message)
      ) {
        return NextResponse.json({ error: message }, { status: 400 });
      }

      throw validationOrGenError;
    }
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Internal Server Error';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
