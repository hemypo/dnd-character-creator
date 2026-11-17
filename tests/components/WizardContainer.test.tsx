import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import React from 'react';
import { WizardContainer } from '@/components/wizard/WizardContainer';
import { Character } from '@/types/character';

describe('WizardContainer Component', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders step 1 archetype role cards and advances to power source', async () => {
    render(<WizardContainer onComplete={() => {}} />);

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
    render(<WizardContainer onComplete={() => {}} />);

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
    render(<WizardContainer onComplete={() => {}} />);

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
    render(<WizardContainer onComplete={() => {}} />);

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
    render(<WizardContainer onComplete={handleComplete} />);

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
});
