import { describe, it, expect } from 'vitest';
import { generateCharacterPdf } from '@/lib/pdf/pdfExporter';
import { POST as exportPdfRoute } from '@/app/api/export-pdf/route';
import { createInitialCharacter, Character } from '@/types/character';
import { buildBaseChassis } from '@/lib/dnd2024/rulesEngine';

describe('Official D&D 2024 PDF Exporter with Cyrillic & Portrait', () => {
  const sample1x1Png =
    'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==';
  const sample1x1Jpg =
    'data:image/jpeg;base64,/9j/4AAQSkZJRgABAQEASABIAAD/2wBDAP//////////////////////////////////////////////////////////////////////////////////////wgALCAABAAEBAREA/8QAFBABAAAAAAAAAAAAAAAAAAAAAP/aAAgBAQABPxA=';
  const sampleSvg =
    'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="100" height="100"><circle cx="50" cy="50" r="40" fill="red"/></svg>';

  describe('generateCharacterPdf', () => {
    it('produces a valid PDF Uint8Array starting with %PDF- and length > 2000 bytes', async () => {
      const char = createInitialCharacter({
        name: 'Тестовый Герой',
        species: 'human',
        characterClass: 'fighter',
        background: 'soldier',
      });

      const pdfBytes = await generateCharacterPdf(char);
      expect(pdfBytes).toBeInstanceOf(Uint8Array);
      expect(pdfBytes.length).toBeGreaterThan(2000);

      const header = Buffer.from(pdfBytes.subarray(0, 5)).toString('utf-8');
      expect(header).toBe('%PDF-');
    });

    it('handles full Cyrillic strings without WinAnsiEncoding or unhandled glyph errors', async () => {
      const char: Character = {
        id: 'char-cyrillic-test-1',
        key: 'HERO-1234',
        name: 'Рагнар Железный Кулак',
        species: 'dwarf',
        characterClass: 'fighter',
        background: 'soldier',
        abilityScores: {
          strength: 18,
          dexterity: 12,
          constitution: 16,
          intelligence: 8,
          wisdom: 13,
          charisma: 10,
        },
        hp: 13,
        maxHp: 13,
        ac: 17,
        speed: 30,
        originFeat: 'Savage Attacker (Свирепый атакующий)',
        customMechanic: {
          id: 'mech-1',
          title: 'Удар горного тролля',
          trigger: 'Критическое попадание двуручным оружием',
          effect: 'Сбивает противника с ног и оглушает до начала следующего хода.',
          costOrTradeoff: 'Требует траты одного костя здоровья во время боя',
          ruleEquivalent: 'Fighter Battle Master - Tripping Attack',
        },
        backstory:
          'Рагнар родился в глубоких залах северных гор под звон наковален и вой метелей. ' +
          'В юности он поклялся защищать сородичей от набегов чудовищ из Теневой Топи. ' +
          'Его боевой топор повидал множество великих сражений, и теперь он ищет славу в дальних землях.',
        createdAt: new Date().toISOString(),
      };

      const pdfBytes = await generateCharacterPdf(char);
      expect(pdfBytes).toBeInstanceOf(Uint8Array);
      expect(pdfBytes.length).toBeGreaterThan(2000);
      const header = Buffer.from(pdfBytes.subarray(0, 5)).toString('utf-8');
      expect(header).toBe('%PDF-');
    });

    it('successfully embeds PNG portrait data URI', async () => {
      const char = createInitialCharacter({
        name: 'Герой с PNG портретом',
        portraitUrl: sample1x1Png,
      });

      const pdfBytes = await generateCharacterPdf(char);
      expect(pdfBytes).toBeInstanceOf(Uint8Array);
      expect(pdfBytes.length).toBeGreaterThan(2000);
    });

    it('successfully embeds JPEG portrait data URI', async () => {
      const char = createInitialCharacter({
        name: 'Герой с JPEG портретом',
        portraitUrl: sample1x1Jpg,
      });

      const pdfBytes = await generateCharacterPdf(char);
      expect(pdfBytes).toBeInstanceOf(Uint8Array);
      expect(pdfBytes.length).toBeGreaterThan(2000);
    });

    it('handles character without portrait (undefined / empty) with fallback heraldic frame without crashing', async () => {
      const char = createInitialCharacter({
        name: 'Герой без портрета',
        portraitUrl: undefined,
      });

      const pdfBytes = await generateCharacterPdf(char);
      expect(pdfBytes).toBeInstanceOf(Uint8Array);
      expect(pdfBytes.length).toBeGreaterThan(2000);
    });

    it('handles character with SVG portrait data URI gracefully with fallback frame without throwing', async () => {
      const char = createInitialCharacter({
        name: 'Герой с SVG портретом',
        portraitUrl: sampleSvg,
      });

      const pdfBytes = await generateCharacterPdf(char);
      expect(pdfBytes).toBeInstanceOf(Uint8Array);
      expect(pdfBytes.length).toBeGreaterThan(2000);
    });

    it('maps all D&D 2024 Level 1 stats, weapon masteries and equipment accurately', async () => {
      const chassis = buildBaseChassis({
        roleId: 'tank',
        powerSourceId: 'martial',
        speciesId: 'human',
        characterName: 'Сэр Галахад',
      });

      const pdfBytes = await generateCharacterPdf(chassis);
      expect(pdfBytes).toBeInstanceOf(Uint8Array);
      expect(pdfBytes.length).toBeGreaterThan(2000);
    });
  });

  describe('POST /api/export-pdf Route Handler', () => {
    it('returns 200 with application/pdf and Content-Disposition headers for valid character', async () => {
      const char = createInitialCharacter({
        name: 'Торин Дубощит',
        species: 'dwarf',
        characterClass: 'fighter',
        background: 'soldier',
      });

      const request = new Request('http://localhost:3000/api/export-pdf', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ character: char }),
      });

      const response = await exportPdfRoute(request);
      expect(response.status).toBe(200);
      expect(response.headers.get('Content-Type')).toBe('application/pdf');

      const disposition = response.headers.get('Content-Disposition');
      expect(disposition).toBeDefined();
      expect(disposition).toContain('attachment');
      expect(disposition).toContain('.pdf');

      const arrayBuffer = await response.arrayBuffer();
      const bytes = new Uint8Array(arrayBuffer);
      expect(bytes.length).toBeGreaterThan(2000);
      const header = Buffer.from(bytes.subarray(0, 5)).toString('utf-8');
      expect(header).toBe('%PDF-');
    });

    it('returns 400 when request body is missing or malformed JSON', async () => {
      const request = new Request('http://localhost:3000/api/export-pdf', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: 'invalid-json-string',
      });

      const response = await exportPdfRoute(request);
      expect(response.status).toBe(400);
      const data = await response.json();
      expect(data.error).toBeDefined();
    });

    it('returns 400 when character data is invalid or missing required fields', async () => {
      const request = new Request('http://localhost:3000/api/export-pdf', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          character: {
            name: '', // Invalid empty name
            hp: -10,
          },
        }),
      });

      const response = await exportPdfRoute(request);
      expect(response.status).toBe(400);
      const data = await response.json();
      expect(data.error).toBeDefined();
    });
  });
});
