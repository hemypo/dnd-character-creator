import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import React from 'react';
import { WizardContainer } from '@/components/wizard/WizardContainer';
import { PhotoUploader, PhotoUploaderValue } from '@/components/wizard/PhotoUploader';
import CreateCharacterPage from '@/app/create/page';
import { Character } from '@/types/character';

const mockPush = vi.fn();
vi.mock('next/navigation', () => ({
  useRouter: () => ({
    push: mockPush,
  }),
}));

describe('WizardContainer Component', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders step 1 archetype role cards and advances to power source', async () => {
    render(<WizardContainer initialMode="manual" onComplete={() => {}} />);

    // Step 1: Role selection
    expect(screen.getByText(/Какова ваша роль/i)).toBeDefined();

    // Renders "Стальной щит" (tank card)
    const roleCard = screen.getByText(/Стальной щит/i);
    expect(roleCard).toBeDefined();

    fireEvent.click(roleCard);

    // Advances to power source
    await waitFor(() => {
      expect(screen.getByText(/Источник вашей силы/i)).toBeDefined();
    });
  });

  it('advances through role, power source, species, and name updates selection state', async () => {
    render(<WizardContainer initialMode="manual" onComplete={() => {}} />);

    // 1. Select Tank
    const roleCard = screen.getByText(/Стальной щит/i);
    fireEvent.click(roleCard);

    // 2. Select Martial Power Source
    await waitFor(() => {
      expect(screen.getByText(/Источник вашей силы/i)).toBeDefined();
    });
    const martialCard = screen.getByText(/Воинское мастерство/i);
    fireEvent.click(martialCard);

    // 3. Species & Name
    await waitFor(() => {
      expect(screen.getByText(/Выберите происхождение/i)).toBeDefined();
    });

    const dwarfCard = screen.getByText(/Дварф/i);
    fireEvent.click(dwarfCard);

    // Enter character name
    const nameInput = screen.getByPlaceholderText(/Имя персонажа|Торин|Безымянный/i);
    fireEvent.change(nameInput, { target: { value: 'Бран Железнобокий' } });

    // Click Next to step 2 (Custom Mechanic)
    const nextBtn = screen.getByRole('button', { name: /Далее|Продолжить/i });
    fireEvent.click(nextBtn);

    await waitFor(() => {
      expect(screen.getByText(/Особая механика|Уникальная черта/i)).toBeDefined();
    });
  });

  it('custom mechanic step accepts text and displays selectable Balance Cards', async () => {
    render(<WizardContainer initialMode="manual" onComplete={() => {}} />);

    // Navigate to Custom Mechanic step
    fireEvent.click(screen.getByText(/Стальной щит/i));
    await waitFor(() => screen.getByText(/Воинское мастерство/i));
    fireEvent.click(screen.getByText(/Воинское мастерство/i));
    await waitFor(() => screen.getByText(/Дварф/i));
    fireEvent.click(screen.getByText(/Дварф/i));
    fireEvent.click(screen.getByRole('button', { name: /Далее|Продолжить/i }));

    // In Custom Mechanic step
    await waitFor(() => {
      expect(screen.getByText(/Особая механика|Уникальная черта/i)).toBeDefined();
    });

    const textarea = screen.getByPlaceholderText(/Хочу|Опишите|идею/i);
    fireEvent.change(textarea, { target: { value: 'Хочу плевать кислотой когда получаю урон' } });

    const generateBtn = screen.getByRole('button', { name: /Сбалансировать|Сгенерировать/i });
    fireEvent.click(generateBtn);

    // Should display generated balance cards
    await waitFor(() => {
      const cards = screen.getAllByTestId('balance-card');
      expect(cards.length).toBeGreaterThanOrEqual(1);
    }, { timeout: 4000 });

    // Select the first card
    const firstCard = screen.getAllByTestId('balance-card')[0];
    fireEvent.click(firstCard);

    // Advance to photo uploader step
    const nextBtn = screen.getByRole('button', { name: /Далее|К портрету/i });
    fireEvent.click(nextBtn);

    await waitFor(() => {
      expect(screen.getByText(/Портрет героя/i)).toBeDefined();
    });
  });

  it('photo uploader step supports photo drop, skip/generate without photo, and preset picking', async () => {
    render(<WizardContainer initialMode="manual" onComplete={() => {}} />);

    // Fast-forward to photo step
    fireEvent.click(screen.getByText(/Стальной щит/i));
    await waitFor(() => screen.getByText(/Воинское мастерство/i));
    fireEvent.click(screen.getByText(/Воинское мастерство/i));
    await waitFor(() => screen.getByText(/Дварф/i));
    fireEvent.click(screen.getByText(/Дварф/i));
    fireEvent.click(screen.getByRole('button', { name: /Далее|Продолжить/i }));

    await waitFor(() => screen.getByText(/Особая механика|Уникальная черта/i));
    // Skip custom mechanic
    const skipMechanicBtn = screen.getByRole('button', { name: /Пропустить/i });
    fireEvent.click(skipMechanicBtn);

    // Should be at Photo Uploader step
    await waitFor(() => {
      expect(screen.getByText(/Портрет героя/i)).toBeDefined();
    });

    // Check presets are available
    const presets = screen.getAllByTestId('preset-avatar');
    expect(presets.length).toBeGreaterThanOrEqual(1);

    // Click preset
    fireEvent.click(presets[0]);

    // Check "generate without photo" and "create character" buttons exist
    expect(screen.getByRole('button', { name: /Сгенерировать без фото/i })).toBeDefined();
    expect(screen.getByRole('button', { name: /Создать персонажа/i })).toBeDefined();
  });

  it('completes wizard, produces a valid Character and invokes onComplete', async () => {
    const handleComplete = vi.fn();
    render(<WizardContainer initialMode="manual" onComplete={handleComplete} />);

    // Step 1: Archetype
    fireEvent.click(screen.getByText(/Стальной щит/i));
    await waitFor(() => screen.getByText(/Воинское мастерство/i));
    fireEvent.click(screen.getByText(/Воинское мастерство/i));
    await waitFor(() => screen.getByText(/Дварф/i));
    fireEvent.click(screen.getByText(/Дварф/i));

    const nameInput = screen.getByPlaceholderText(/Имя персонажа|Торин|Безымянный/i);
    fireEvent.change(nameInput, { target: { value: 'Гримли' } });
    fireEvent.click(screen.getByRole('button', { name: /Далее|Продолжить/i }));

    // Step 2: Custom Mechanic
    await waitFor(() => screen.getByText(/Особая механика|Уникальная черта/i));
    fireEvent.click(screen.getByRole('button', { name: /Пропустить/i }));

    // Step 3: Photo
    await waitFor(() => screen.getByText(/Портрет героя/i));
    const presets = screen.getAllByTestId('preset-avatar');
    fireEvent.click(presets[0]);

    // Final creation button
    const finishBtn = screen.getByRole('button', { name: /Создать персонажа|Завершить/i });
    fireEvent.click(finishBtn);

    // Wait for onComplete callback
    await waitFor(() => {
      expect(handleComplete).toHaveBeenCalledTimes(1);
    }, { timeout: 5000 });

    const createdChar: Character = handleComplete.mock.calls[0][0];
    expect(createdChar).toBeDefined();
    expect(createdChar.key).toMatch(/^HERO-/);
    expect(createdChar.name).toBe('Гримли');
    expect(createdChar.species).toBe('dwarf');
    expect(createdChar.characterClass).toBe('fighter');
    expect(createdChar.hp).toBeGreaterThan(0);
    expect(createdChar.ac).toBeGreaterThan(0);
  });

  it('renders CreateCharacterPage and routes on completion', async () => {
    render(<CreateCharacterPage />);

    expect(screen.getByText(/Сотворение персонажа/i)).toBeDefined();
    // Switch to manual mode
    fireEvent.click(screen.getByTestId('mode-manual-btn'));
    expect(screen.getByText(/Стальной щит/i)).toBeDefined();

    // Select role
    fireEvent.click(screen.getByText(/Стальной щит/i));
    await waitFor(() => screen.getByText(/Воинское мастерство/i));
    fireEvent.click(screen.getByText(/Воинское мастерство/i));
    await waitFor(() => screen.getByText(/Человек/i));
    fireEvent.click(screen.getByText(/Человек/i));
    fireEvent.click(screen.getByRole('button', { name: /Далее|Продолжить/i }));

    // Skip mechanic
    await waitFor(() => screen.getByText(/Особая механика|Уникальная черта/i));
    fireEvent.click(screen.getByRole('button', { name: /Пропустить/i }));

    // Skip photo
    await waitFor(() => screen.getByText(/Портрет героя/i));
    const skipBtn = screen.getByRole('button', { name: /Сгенерировать без фото/i });
    fireEvent.click(skipBtn);

    // Should navigate via router.push
    await waitFor(() => {
      expect(mockPush).toHaveBeenCalledWith(expect.stringMatching(/^\/character\/HERO-/));
    }, { timeout: 5000 });
  });

  it('supports personality quiz mode: discovers archetype, calculates alignment, and transitions to step 2', async () => {
    render(<WizardContainer initialMode="quiz" onComplete={() => {}} />);

    // Starts in quiz mode
    expect(screen.getByText(/Ролевой тест личности/i)).toBeDefined();
    expect(screen.getByText(/Вопрос 1 из 10/i)).toBeDefined();

    // Answer questions iteratively
    for (let i = 1; i <= 10; i++) {
      // Find the first option button for the current question
      const allButtons = screen.getAllByRole('button');
      const optionBtn = allButtons.find(
        (b) =>
          b.className.includes('p-4 rounded-xl border text-left')
      );
      expect(optionBtn).toBeDefined();
      fireEvent.click(optionBtn!);
    }

    // Finished screen with alignment & summary
    await waitFor(() => {
      expect(screen.getByText(/Ваш архетип определен/i)).toBeDefined();
      expect(screen.getByText(/Мировоззрение/i)).toBeDefined();
    });

    // Accept result
    const acceptBtn = screen.getByRole('button', { name: /Принять и перейти к кастомной механике/i });
    fireEvent.click(acceptBtn);

    // Advances to Step 2: Custom Mechanic
    await waitFor(() => {
      expect(screen.getByText(/Особая механика|Уникальная черта/i)).toBeDefined();
    });
  });
});

describe('PhotoUploader Component (Interactive Portrait Preview & Regenerate)', () => {
  it('displays selfie and generate portrait button when photo is present', async () => {
    const value: PhotoUploaderValue = {
      photoBase64: 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==',
      mode: 'photo',
    };
    const onChange = vi.fn();

    render(
      <PhotoUploader
        value={value}
        onChange={onChange}
        species="human"
        characterClass="fighter"
        characterName="Арагорн"
      />
    );

    // Displays uploaded selfie badge and button
    expect(screen.getByText(/Селфи загружено/i)).toBeDefined();
    const generateBtn = screen.getByRole('button', {
      name: /Превратить селфи в портрет D&D|Сгенерировать арт-портрет/i,
    });
    expect(generateBtn).toBeDefined();

    // Mock fetch for generate-portrait
    const fetchSpy = vi.spyOn(global, 'fetch').mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        portraitUrl: 'https://images.unsplash.com/photo-flux-generated-12345',
        promptUsed: 'masterpiece fantasy portrait',
      }),
    } as unknown as Response);

    fireEvent.click(generateBtn);

    await waitFor(() => {
      expect(fetchSpy).toHaveBeenCalledWith(
        '/api/generate-portrait',
        expect.objectContaining({
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: expect.stringContaining('Арагорн'),
        })
      );
    });

    expect(onChange).toHaveBeenCalledWith(
      expect.objectContaining({
        portraitUrl: 'https://images.unsplash.com/photo-flux-generated-12345',
        mode: 'photo',
      })
    );
  });

  it('renders generated preview card with regenerate and remove buttons', () => {
    const value: PhotoUploaderValue = {
      portraitUrl: 'https://images.unsplash.com/photo-flux-generated-12345',
      photoBase64: 'data:image/png;base64,mock',
      mode: 'photo',
    };
    const onChange = vi.fn();

    render(
      <PhotoUploader
        value={value}
        onChange={onChange}
        species="elf"
        characterClass="wizard"
      />
    );

    expect(screen.getByText(/Портрет готов к бою/i)).toBeDefined();
    expect(screen.getByRole('button', { name: /Перегенерировать/i })).toBeDefined();
    expect(screen.getByRole('button', { name: /Загрузить другое фото/i })).toBeDefined();

    // Clicking remove photo clears value
    const removeBtn = screen.getByRole('button', { name: /Загрузить другое фото/i });
    fireEvent.click(removeBtn);
    expect(onChange).toHaveBeenCalledWith(
      expect.objectContaining({
        photoBase64: undefined,
        portraitUrl: undefined,
        mode: 'skip',
      })
    );
  });

  it('supports interactive preview and regeneration for AI-prompt lore generation without photo', async () => {
    const onChange = vi.fn();

    render(
      <PhotoUploader
        value={{ mode: 'skip' }}
        onChange={onChange}
        species="dwarf"
        characterClass="cleric"
        characterName="Торин"
      />
    );

    const fetchSpy = vi.spyOn(global, 'fetch').mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        portraitUrl: 'https://images.unsplash.com/photo-dwarf-cleric-flux',
      }),
    } as unknown as Response);

    const genLoreBtn = screen.getByRole('button', { name: /Сгенерировать арт по лору/i });
    fireEvent.click(genLoreBtn);

    await waitFor(() => {
      expect(fetchSpy).toHaveBeenCalledWith(
        '/api/generate-portrait',
        expect.objectContaining({
          method: 'POST',
          body: expect.stringContaining('dwarf'),
        })
      );
    });

    expect(onChange).toHaveBeenCalledWith(
      expect.objectContaining({
        portraitUrl: 'https://images.unsplash.com/photo-dwarf-cleric-flux',
        mode: 'ai-prompt',
      })
    );
  });
});
