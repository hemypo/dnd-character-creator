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
