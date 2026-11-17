import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor, act } from '@testing-library/react';
import React from 'react';
import { InteractiveSheet } from '@/components/sheet/InteractiveSheet';
import { ActionCards } from '@/components/sheet/ActionCards';
import { ShareKeyModal } from '@/components/sheet/ShareKeyModal';
import { Character } from '@/types/character';

const mockCharacter: Character = {
  id: 'char-12345',
  key: 'HERO-7788',
  name: 'Бран Железнобокий',
  species: 'dwarf',
  characterClass: 'fighter',
  background: 'soldier',
  abilityScores: {
    strength: 17,
    dexterity: 13,
    constitution: 15,
    intelligence: 8,
    wisdom: 12,
    charisma: 10,
  },
  hp: 12,
  maxHp: 12,
  ac: 16,
  speed: 30,
  originFeat: 'Savage Attacker',
  customMechanic: {
    id: 'mech-1',
    title: 'Дыхание кузни',
    trigger: 'Когда вы получаете урон в ближнем бою (Реакция)',
    effect: 'Вы выдыхаете струю раскалённого пара, нанося 1d4 огня.',
    costOrTradeoff: '1 раз за короткий отдых',
    ruleEquivalent: 'Заменяет черту происхождения',
  },
  backstory: 'Рождённый в глубинах клановых чертогов, Бран поклялся восстановить честь своего рода...',
  portraitUrl: 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==',
  createdAt: '2026-11-17T00:00:00.000Z',
};

describe('InteractiveSheet Component', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders character identity, species, class, background, and access key', () => {
    render(<InteractiveSheet character={mockCharacter} />);

    expect(screen.getByText('Бран Железнобокий')).toBeDefined();
    expect(screen.getByText(/HERO-7788/)).toBeDefined();
    expect(screen.getByText(/Воин|Fighter/i)).toBeDefined();
    expect(screen.getByText(/Дварф|Dwarf/i)).toBeDefined();
    expect(screen.getByText(/Солдат|Soldier/i)).toBeDefined();
  });

  it('displays combat badges: AC, HP, Speed, Initiative, and Proficiency bonus', () => {
    render(<InteractiveSheet character={mockCharacter} />);

    // AC is 16
    expect(screen.getByText('16')).toBeDefined();
    expect(screen.getAllByText(/КД|Класс доспеха|AC/i).length).toBeGreaterThanOrEqual(1);

    // Speed is 30 ft
    expect(screen.getByText(/30/)).toBeDefined();
    expect(screen.getByText(/Скорость|Speed/i)).toBeDefined();

    // Initiative (DEX mod = +1)
    expect(screen.getAllByText(/\+1/).length).toBeGreaterThanOrEqual(1);
    expect(screen.getByText(/Инициатива|Initiative/i)).toBeDefined();

    // Proficiency bonus (+2 at level 1)
    expect(screen.getAllByText(/\+2/).length).toBeGreaterThanOrEqual(1);
    expect(screen.getAllByText(/Мастерство|Бонус мастерства|Prof/i).length).toBeGreaterThanOrEqual(1);
  });

  it('interactive HP counter decreases and increases current HP with bounds', () => {
    render(<InteractiveSheet character={mockCharacter} />);

    // Initial HP displays 12
    const hpDisplay = screen.getByTestId('current-hp-display');
    expect(hpDisplay.textContent).toContain('12');

    const minusBtn = screen.getByTestId('hp-decrease-btn');
    const plusBtn = screen.getByTestId('hp-increase-btn');

    // WCAG 2.5.5 touch target size compliance
    expect(minusBtn.className).toContain('min-w-[48px]');
    expect(minusBtn.className).toContain('min-h-[48px]');
    expect(plusBtn.className).toContain('min-w-[48px]');
    expect(plusBtn.className).toContain('min-h-[48px]');

    // Click minus -> 11
    fireEvent.click(minusBtn);
    expect(hpDisplay.textContent).toContain('11');

    // Click minus again -> 10
    fireEvent.click(minusBtn);
    expect(hpDisplay.textContent).toContain('10');

    // Click plus -> 11
    fireEvent.click(plusBtn);
    expect(hpDisplay.textContent).toContain('11');

    // Click plus multiple times up to maxHp (12)
    fireEvent.click(plusBtn);
    fireEvent.click(plusBtn);
    expect(hpDisplay.textContent).toContain('12');
  });

  it('displays Custom Balance Card with title, trigger, effect, and cost/tradeoff', () => {
    render(<InteractiveSheet character={mockCharacter} />);

    expect(screen.getByText('Дыхание кузни')).toBeDefined();
    expect(screen.getByText(/Когда вы получаете урон в ближнем бою/i)).toBeDefined();
    expect(screen.getByText(/Вы выдыхаете струю раскалённого пара/i)).toBeDefined();
    expect(screen.getByText(/1 раз за короткий отдых/i)).toBeDefined();
  });

  it('displays narrative backstory text when present', () => {
    render(<InteractiveSheet character={mockCharacter} />);

    expect(screen.getByText(/Рождённый в глубинах клановых чертогов/i)).toBeDefined();
  });

  it('triggers PDF export download when clicking the PDF download button', async () => {
    const mockBlob = new Blob(['%PDF-1.4 mock content'], { type: 'application/pdf' });
    const fetchSpy = vi.spyOn(global, 'fetch').mockResolvedValueOnce({
      ok: true,
      blob: async () => mockBlob,
    } as unknown as Response);

    // Mock window.URL.createObjectURL and revokeObjectURL
    const createObjectURLSpy = vi.fn().mockReturnValue('blob:http://localhost/mock-pdf');
    const revokeObjectURLSpy = vi.fn();
    window.URL.createObjectURL = createObjectURLSpy;
    window.URL.revokeObjectURL = revokeObjectURLSpy;

    render(<InteractiveSheet character={mockCharacter} />);

    const downloadBtn = screen.getByRole('button', { name: /Скачать официальный PDF|Скачать PDF/i });
    fireEvent.click(downloadBtn);

    await waitFor(() => {
      expect(fetchSpy).toHaveBeenCalledWith(
        '/api/export-pdf',
        expect.objectContaining({
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
        })
      );
    });

    expect(createObjectURLSpy).toHaveBeenCalled();
  });

  it('opens and closes ShareKeyModal displaying the HERO-XXXX key and copy button', async () => {
    // Mock navigator.clipboard
    const writeTextSpy = vi.fn().mockResolvedValue(undefined);
    Object.defineProperty(navigator, 'clipboard', {
      value: { writeText: writeTextSpy },
      configurable: true,
      writable: true,
    });

    render(<InteractiveSheet character={mockCharacter} />);

    // Click share button or key badge to open modal
    const shareTrigger = screen.getByTestId('share-key-trigger');
    fireEvent.click(shareTrigger);

    // Share modal is open
    await waitFor(() => {
      expect(screen.getByRole('dialog')).toBeDefined();
    });

    expect(screen.getAllByText('HERO-7788').length).toBeGreaterThanOrEqual(1);

    const copyBtn = screen.getByRole('button', { name: /Скопировать код/i });
    await act(async () => {
      fireEvent.click(copyBtn);
    });

    expect(writeTextSpy).toHaveBeenCalledWith(expect.stringContaining('HERO-7788'));

    // Close modal
    const closeBtn = screen.getByRole('button', { name: /Закрыть|✕/i });
    fireEvent.click(closeBtn);

    await waitFor(() => {
      expect(screen.queryByRole('dialog')).toBeNull();
    });
  });

  it('handles edge case character with zero maxHp and missing ability scores safely without NaN', () => {
    const edgeChar = {
      ...mockCharacter,
      hp: 0,
      maxHp: 0,
      abilityScores: {} as unknown as Character['abilityScores'],
    };
    render(<InteractiveSheet character={edgeChar} />);
    const hpDisplay = screen.getByTestId('current-hp-display');
    expect(hpDisplay.textContent).toContain('0');
    expect(hpDisplay.textContent).toContain('/ 1');
    expect(screen.getByText(/Инициатива|Initiative/i)).toBeDefined();
  });

  it('opens D&D 2024 CompendiumModal when clicking the compendium trigger and allows searching spells', async () => {
    render(<InteractiveSheet character={mockCharacter} />);

    const compendiumBtn = screen.getByTestId('compendium-trigger');
    expect(compendiumBtn).toBeDefined();

    fireEvent.click(compendiumBtn);

    // Modal dialog is open
    await waitFor(() => {
      expect(screen.getByRole('dialog')).toBeDefined();
    });

    // Check tabs
    expect(screen.getByTestId('tab-spells')).toBeDefined();
    expect(screen.getByTestId('tab-masteries')).toBeDefined();
    expect(screen.getByTestId('tab-conditions')).toBeDefined();
    expect(screen.getByTestId('tab-actions')).toBeDefined();

    // Switch to weapon masteries tab
    fireEvent.click(screen.getByTestId('tab-masteries'));
    expect(screen.getAllByText(/Topple/i).length).toBeGreaterThanOrEqual(1);
    expect(screen.getAllByText(/Nick/i).length).toBeGreaterThanOrEqual(1);

    // Close compendium
    const closeBtn = screen.getByRole('button', { name: /Закрыть справочник|✕/i });
    fireEvent.click(closeBtn);
    await waitFor(() => {
      expect(screen.queryByRole('dialog')).toBeNull();
    });
  });

  it('allows live editing: temp HP counter, coins wallet, and notes with auto-persistence', async () => {
    const fetchSpy = vi.spyOn(global, 'fetch').mockResolvedValue({
      ok: true,
      json: async () => ({ success: true }),
    } as unknown as Response);

    render(<InteractiveSheet character={mockCharacter} />);

    // Temp HP test
    const tempHpDisplay = screen.getByTestId('temp-hp-display');
    expect(tempHpDisplay.textContent).toContain('0');

    const tempPlus = screen.getByTestId('temp-hp-increase-btn');
    const tempMinus = screen.getByTestId('temp-hp-decrease-btn');

    fireEvent.click(tempPlus);
    expect(tempHpDisplay.textContent).toContain('1');

    fireEvent.click(tempPlus);
    expect(tempHpDisplay.textContent).toContain('2');

    fireEvent.click(tempMinus);
    expect(tempHpDisplay.textContent).toContain('1');

    // Coins wallet test
    const gpDisplay = screen.getByTestId('coin-gp-display');
    const gpInc = screen.getByTestId('coin-gp-inc');
    const gpDec = screen.getByTestId('coin-gp-dec');

    expect(gpDisplay).toBeDefined();
    fireEvent.click(gpInc);
    fireEvent.click(gpDec);

    // Notes test
    const notesInput = screen.getByTestId('character-notes-input');
    fireEvent.change(notesInput, { target: { value: 'Найдено 50 золотых в склепе.' } });
    expect((notesInput as HTMLTextAreaElement).value).toBe('Найдено 50 золотых в склепе.');

    // Wait for debounced sync or trigger
    await waitFor(() => {
      expect(fetchSpy).toHaveBeenCalledWith(
        expect.stringContaining('/api/characters/HERO-7788'),
        expect.objectContaining({ method: 'PATCH' })
      );
    });

    // Check localStorage was populated
    const saved = window.localStorage.getItem(`dnd_char_${mockCharacter.key}`);
    expect(saved).not.toBeNull();
    const parsed = JSON.parse(saved!);
    expect(parsed.notes).toBe('Найдено 50 золотых в склепе.');
    expect(parsed.tempHp).toBe(1);
  });

  it('renders and tracks spell slots for a spellcaster class', () => {
    const wizardCharacter: Character = {
      ...mockCharacter,
      id: 'char-wizard-1',
      key: 'HERO-WIZ1',
      characterClass: 'wizard',
      spellSlots: { level1Max: 2, level1Used: 0 },
    };

    render(<InteractiveSheet character={wizardCharacter} />);

    // Spell slots section should be visible for wizard
    const slot0 = screen.getByTestId('spell-slot-checkbox-0');
    expect(slot0).toBeDefined();

    // Click slot to expend it
    fireEvent.click(slot0);

    // Reset button restores slots
    const resetBtn = screen.getByTestId('reset-spell-slots-btn');
    expect(resetBtn).toBeDefined();
    fireEvent.click(resetBtn);
  });
});

describe('ActionCards Component', () => {
  it('renders weapon attacks, weapon masteries, and starting equipment', () => {
    render(<ActionCards characterClass="fighter" abilityScores={mockCharacter.abilityScores} />);

    // Fighter should have masteries like Topple, Push, Vex
    expect(screen.getAllByText(/Topple|Опрокидывание/i).length).toBeGreaterThanOrEqual(1);

    // Equipment should list Chain Mail or weapons
    expect(screen.getAllByText(/Кольчуга|Двуручный меч/i).length).toBeGreaterThanOrEqual(1);

    // Should display attack roll bonus
    expect(screen.getAllByText(/\+\d/).length).toBeGreaterThanOrEqual(1);
  });
});

describe('ShareKeyModal Component', () => {
  it('renders modal with access key, direct link, and handles copy', async () => {
    const writeTextSpy = vi.fn().mockResolvedValue(undefined);
    Object.defineProperty(navigator, 'clipboard', {
      value: { writeText: writeTextSpy },
      configurable: true,
      writable: true,
    });

    const onClose = vi.fn();
    render(<ShareKeyModal isOpen={true} characterKey="HERO-9999" characterName="Арагорн" onClose={onClose} />);

    expect(screen.getByText('HERO-9999')).toBeDefined();
    expect(screen.getByText(/Арагорн/)).toBeDefined();

    const copyBtn = screen.getByRole('button', { name: /Скопировать код/i });
    await act(async () => {
      fireEvent.click(copyBtn);
    });

    expect(writeTextSpy).toHaveBeenCalledWith(expect.stringContaining('HERO-9999'));
  });

  it('does not render when isOpen is false', () => {
    const { container } = render(
      <ShareKeyModal isOpen={false} characterKey="HERO-9999" characterName="Арагорн" onClose={() => {}} />
    );
    expect(container.firstChild).toBeNull();
  });
});
