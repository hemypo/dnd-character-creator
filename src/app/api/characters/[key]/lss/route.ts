import { NextRequest, NextResponse } from 'next/server';
import { getCharacterRecord } from '@/lib/storage/characterStore';
import { exportToLongStoryShort } from '@/lib/lss/lssExporter';

export async function GET(
  _request: NextRequest,
  { params }: { params: { key: string } }
) {
  try {
    const key = params.key;
    if (!key) {
      return NextResponse.json({ error: 'Character key is required' }, { status: 400 });
    }

    const character = await getCharacterRecord(key);
    if (!character) {
      return NextResponse.json({ error: 'Character not found' }, { status: 404 });
    }

    const lssDoc = exportToLongStoryShort(character);
    const fileName = `${character.name.replace(/[^a-zA-Z0-9а-яА-ЯёЁ_-]/g, '_')}_lss.json`;

    return new NextResponse(JSON.stringify(lssDoc, null, 2), {
      status: 200,
      headers: {
        'Content-Type': 'application/json',
        'Content-Disposition': `attachment; filename*=UTF-8''${encodeURIComponent(fileName)}`,
        'Cache-Control': 'no-store',
      },
    });
  } catch (err) {
    console.error('Failed to export character to Long Story Short format:', err);
    return NextResponse.json(
      { error: 'Internal server error during LSS export' },
      { status: 500 }
    );
  }
}
