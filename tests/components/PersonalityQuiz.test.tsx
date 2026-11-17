import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import React from 'react';
import { PersonalityQuiz } from '@/components/wizard/PersonalityQuiz';

describe('PersonalityQuiz Component', () => {
  it('renders initial question with progress and options', () => {
    render(<PersonalityQuiz onComplete={() => {}} />);

    expect(screen.getByText(/Ролевой тест личности/i)).toBeDefined();
    expect(screen.getByText(/Вопрос 1 из 10/i)).toBeDefined();
    expect(screen.getByText(/Закон и справедливость/i)).toBeDefined();
    expect(screen.getByText(/Задержать вора/i)).toBeDefined();
  });

  it('navigates through questions and allows going back', () => {
    render(<PersonalityQuiz onComplete={() => {}} />);

    // Click first option of question 1
    const option1 = screen.getByText(/Задержать вора/i);
    fireEvent.click(option1);

    // Question 2
    expect(screen.getByText(/Вопрос 2 из 10/i)).toBeDefined();
    expect(screen.getByText(/Цена победы/i)).toBeDefined();

    // Click Back
    const backBtn = screen.getByRole('button', { name: /Назад/i });
    fireEvent.click(backBtn);

    // Back at question 1
    expect(screen.getByText(/Вопрос 1 из 10/i)).toBeDefined();
    expect(screen.getByText(/Закон и справедливость/i)).toBeDefined();
  });

  it('invokes onSwitchToManual when clicking manual switch link', () => {
    const handleSwitch = vi.fn();
    render(<PersonalityQuiz onComplete={() => {}} onSwitchToManual={handleSwitch} />);

    const manualBtn = screen.getByText(/Выбрать архетип вручную/i);
    fireEvent.click(manualBtn);

    expect(handleSwitch).toHaveBeenCalledTimes(1);
  });

  it('completes all 10 questions, displays result card, and calls onComplete upon acceptance', async () => {
    const handleComplete = vi.fn();
    render(<PersonalityQuiz onComplete={handleComplete} />);

    // Answer all 10 questions
    for (let i = 1; i <= 10; i++) {
      expect(screen.getByText(new RegExp(`Вопрос ${i} из 10`, 'i'))).toBeDefined();
      const allButtons = screen.getAllByRole('button');
      const optionBtn = allButtons.find((b) =>
        b.className.includes('p-4 rounded-xl border text-left')
      );
      expect(optionBtn).toBeDefined();
      fireEvent.click(optionBtn!);
    }

    // Result card appears
    await waitFor(() => {
      expect(screen.getByText(/Ваш архетип определен/i)).toBeDefined();
      expect(screen.getByText(/Мировоззрение/i)).toBeDefined();
      expect(screen.getByText(/Тест успешно завершен/i)).toBeDefined();
    });

    // Test name randomize button
    const diceBtn = screen.getByTitle(/Случайное имя/i);
    fireEvent.click(diceBtn);

    // Accept result
    const acceptBtn = screen.getByRole('button', { name: /Принять и перейти к кастомной механике/i });
    fireEvent.click(acceptBtn);

    expect(handleComplete).toHaveBeenCalledTimes(1);
    const selection = handleComplete.mock.calls[0][0];
    expect(selection).toBeDefined();
    expect(selection.alignment).toBeDefined();
    expect(selection.roleId).toBeDefined();
    expect(selection.powerSourceId).toBeDefined();
    expect(selection.speciesId).toBeDefined();
    expect(selection.characterName).toBeDefined();
  });

  it('allows restarting quiz from the result screen', async () => {
    render(<PersonalityQuiz onComplete={() => {}} />);

    // Fast-forward through all questions
    for (let i = 1; i <= 10; i++) {
      const allButtons = screen.getAllByRole('button');
      const optionBtn = allButtons.find((b) =>
        b.className.includes('p-4 rounded-xl border text-left')
      );
      fireEvent.click(optionBtn!);
    }

    await waitFor(() => {
      expect(screen.getByText(/Пройти тест заново/i)).toBeDefined();
    });

    // Click restart
    const restartBtn = screen.getByRole('button', { name: /Пройти тест заново/i });
    fireEvent.click(restartBtn);

    // Returns to question 1
    await waitFor(() => {
      expect(screen.getByText(/Вопрос 1 из 10/i)).toBeDefined();
    });
  });
});
