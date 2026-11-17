import fs from 'fs';
import path from 'path';
import { describe, it, expect, beforeEach } from 'vitest';
import {
  generateCharacterKey,
  generateUniqueCharacterKey,
  saveCharacterRecord,
  getCharacterRecord,
  listRecentCharacters,
  resetCharacterStore,
} from '@/lib/storage/characterStore';
import { buildBaseChassis } from '@/lib/dnd2024/rulesEngine';
import { POST as postCharacter, GET as getCharactersList } from '@/app/api/characters/route';
import { GET as getCharacterByKey } from '@/app/api/characters/[key]/route';

describe('Key-Based Character Store & Persistence', () => {
  beforeEach(async () => {
    await resetCharacterStore();
  });

  describe('generateCharacterKey and generateUniqueCharacterKey', () => {
    it('generates a clean human-readable key matching /^HERO-[A-Z0-9]{4}$/', () => {
      const key = generateCharacterKey();
      expect(key).toMatch(/^HERO-[A-Z0-9]{4}$/);
    });

    it('generates unique keys across multiple invocations', () => {
      const keys = new Set<string>();
      for (let i = 0; i < 50; i++) {
        keys.add(generateCharacterKey());
      }
      expect(keys.size).toBe(50);
    });

    it('generateUniqueCharacterKey guarantees a key not currently in store', async () => {
      const char = buildBaseChassis({
        roleId: 'tank',
        powerSourceId: 'martial',
        speciesId: 'human',
        characterName: 'Первый',
      });
      const { key } = await saveCharacterRecord(char);

      const newKey = generateUniqueCharacterKey();
      expect(newKey).toMatch(/^HERO-[A-Z0-9]{4}$/);
      expect(newKey).not.toBe(key);
    });
  });

  describe('saveCharacterRecord and getCharacterRecord', () => {
    it('saves and retrieves a character record by key', async () => {
      const char = buildBaseChassis({
        roleId: 'tank',
        powerSourceId: 'martial',
        speciesId: 'human',
        characterName: 'Арагорн',
      });

      const { key } = await saveCharacterRecord(char);
      expect(key).toMatch(/^HERO-[A-Z0-9]{4}$/);

      const loaded = await getCharacterRecord(key);
      expect(loaded).not.toBeNull();
      expect(loaded?.name).toBe('Арагорн');
      expect(loaded?.key).toBe(key);
      expect(loaded?.species).toBe('human');
      expect(loaded?.characterClass).toBe('fighter');
    });

    it('performs case-insensitive lookup (e.g. hero-xxxx finds HERO-XXXX)', async () => {
      const char = buildBaseChassis({
        roleId: 'blaster',
        powerSourceId: 'arcane',
        speciesId: 'elf',
        characterName: 'Элоир',
      });

      const { key } = await saveCharacterRecord(char);
      const lowerKey = key.toLowerCase();

      const loaded = await getCharacterRecord(lowerKey);
      expect(loaded).not.toBeNull();
      expect(loaded?.name).toBe('Элоир');
      expect(loaded?.key).toBe(key);
    });

    it('returns null when an unknown key is queried', async () => {
      const result = await getCharacterRecord('HERO-NONE');
      expect(result).toBeNull();
    });

    it('preserves valid predefined hero keys when saving', async () => {
      const char = buildBaseChassis({
        roleId: 'healer',
        powerSourceId: 'divine',
        speciesId: 'dwarf',
        characterName: 'Брунор',
      });
      char.key = 'HERO-SPEC';

      const { key } = await saveCharacterRecord(char);
      expect(key).toBe('HERO-SPEC');

      const loaded = await getCharacterRecord('hero-spec');
      expect(loaded?.name).toBe('Брунор');
    });

    it('saves 10 characters concurrently with Promise.all and leaves no orphan .tmp files', async () => {
      const characters = Array.from({ length: 10 }, (_, i) =>
        buildBaseChassis({
          roleId: 'tank',
          powerSourceId: 'martial',
          speciesId: 'human',
          characterName: `Конкурентный герой ${i + 1}`,
        })
      );

      const results = await Promise.all(characters.map((char) => saveCharacterRecord(char)));
      expect(results).toHaveLength(10);

      const uniqueKeys = new Set(results.map((r) => r.key));
      expect(uniqueKeys.size).toBe(10);

      for (const { key } of results) {
        const retrieved = await getCharacterRecord(key);
        expect(retrieved).not.toBeNull();
        expect(retrieved?.key).toBe(key);
      }

      const dataDir = path.join(process.cwd(), 'data');
      if (fs.existsSync(dataDir)) {
        const files = fs.readdirSync(dataDir);
        const tmpFiles = files.filter((f) => f.includes('.tmp'));
        expect(tmpFiles).toHaveLength(0);
      }
    });
  });

  describe('listRecentCharacters', () => {
    it('returns recent character summaries sorted by creation time descending', async () => {
      const char1 = buildBaseChassis({
        roleId: 'tank',
        powerSourceId: 'martial',
        speciesId: 'human',
        characterName: 'Первый',
      });
      char1.createdAt = new Date('2026-01-01T10:00:00Z').toISOString();

      const char2 = buildBaseChassis({
        roleId: 'scout',
        powerSourceId: 'primal',
        speciesId: 'halfling',
        characterName: 'Второй',
      });
      char2.createdAt = new Date('2026-01-02T10:00:00Z').toISOString();

      await saveCharacterRecord(char1);
      await saveCharacterRecord(char2);

      const recent = await listRecentCharacters();
      expect(recent.length).toBe(2);
      expect(recent[0].name).toBe('Второй');
      expect(recent[1].name).toBe('Первый');
    });

    it('respects the limit argument', async () => {
      for (let i = 1; i <= 5; i++) {
        const char = buildBaseChassis({
          roleId: 'striker',
          powerSourceId: 'shadow',
          speciesId: 'tiefling',
          characterName: `Герой ${i}`,
        });
        char.createdAt = new Date(`2026-01-0${i}T10:00:00Z`).toISOString();
        await saveCharacterRecord(char);
      }

      const recent = await listRecentCharacters(3);
      expect(recent.length).toBe(3);
      expect(recent[0].name).toBe('Герой 5');
    });
  });

  describe('API Route: /api/characters (POST and GET)', () => {
    it('POST returns 200 with { success: true, key } for valid character payload', async () => {
      const char = buildBaseChassis({
        roleId: 'tank',
        powerSourceId: 'martial',
        speciesId: 'human',
        characterName: 'Артур',
      });

      const req = new Request('http://localhost:3000/api/characters', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ character: char }),
      });

      const res = await postCharacter(req);
      expect(res.status).toBe(200);

      const data = await res.json();
      expect(data.success).toBe(true);
      expect(data.key).toMatch(/^HERO-[A-Z0-9]{4}$/);

      // Verify persistence
      const saved = await getCharacterRecord(data.key);
      expect(saved?.name).toBe('Артур');
    });

    it('POST returns 400 when request body is missing or malformed JSON', async () => {
      const reqMalformed = new Request('http://localhost:3000/api/characters', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: 'invalid-json',
      });

      const res = await postCharacter(reqMalformed);
      expect(res.status).toBe(400);
      const data = await res.json();
      expect(data.error).toBeDefined();
    });

    it('POST returns 400 when character validation fails', async () => {
      const reqInvalid = new Request('http://localhost:3000/api/characters', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          character: {
            name: '', // Empty name fails validation
            hp: -5,
          },
        }),
      });

      const res = await postCharacter(reqInvalid);
      expect(res.status).toBe(400);
      const data = await res.json();
      expect(data.error).toBeDefined();
    });

    it('GET returns 200 with list of recent characters', async () => {
      const char = buildBaseChassis({
        roleId: 'controller',
        powerSourceId: 'divine',
        speciesId: 'human',
        characterName: 'Клирик',
      });
      await saveCharacterRecord(char);

      const req = new Request('http://localhost:3000/api/characters');
      const res = await getCharactersList(req);
      expect(res.status).toBe(200);

      const data = await res.json();
      expect(data.success).toBe(true);
      expect(Array.isArray(data.characters)).toBe(true);
      expect(data.characters.length).toBeGreaterThanOrEqual(1);
    });
  });

  describe('API Route: /api/characters/[key] (GET)', () => {
    it('GET returns 200 with character object when key exists', async () => {
      const char = buildBaseChassis({
        roleId: 'tank',
        powerSourceId: 'martial',
        speciesId: 'human',
        characterName: 'Боромир',
      });
      const { key } = await saveCharacterRecord(char);

      const req = new Request(`http://localhost:3000/api/characters/${key}`);
      const res = await getCharacterByKey(req, { params: Promise.resolve({ key }) });
      expect(res.status).toBe(200);

      const data = await res.json();
      expect(data.success).toBe(true);
      expect(data.character).toBeDefined();
      expect(data.character.name).toBe('Боромир');
    });

    it('GET returns 200 when key is lowercase in URL parameter', async () => {
      const char = buildBaseChassis({
        roleId: 'tank',
        powerSourceId: 'martial',
        speciesId: 'human',
        characterName: 'Фарамир',
      });
      const { key } = await saveCharacterRecord(char);

      const req = new Request(`http://localhost:3000/api/characters/${key.toLowerCase()}`);
      const res = await getCharacterByKey(req, { params: { key: key.toLowerCase() } });
      expect(res.status).toBe(200);

      const data = await res.json();
      expect(data.character.name).toBe('Фарамир');
    });

    it('GET returns 404 when key does not exist', async () => {
      const req = new Request('http://localhost:3000/api/characters/HERO-NONE');
      const res = await getCharacterByKey(req, { params: Promise.resolve({ key: 'HERO-NONE' }) });
      expect(res.status).toBe(404);

      const data = await res.json();
      expect(data.error).toBeDefined();
    });
  });
});
