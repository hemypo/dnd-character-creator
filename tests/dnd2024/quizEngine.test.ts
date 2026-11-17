import { describe, it, expect } from 'vitest';
import { QUIZ_QUESTIONS, evaluateQuiz } from '@/lib/dnd2024/quizEngine';

describe('D&D 2024 Personality Quiz Engine', () => {
  it('provides 10 narrative questions with 2-3 questions per variable trait', () => {
    expect(QUIZ_QUESTIONS.length).toBe(10);

    const alignmentQuestions = QUIZ_QUESTIONS.filter((q) => q.category === 'alignment');
    const combatQuestions = QUIZ_QUESTIONS.filter((q) => q.category === 'combat');
    const backgroundQuestions = QUIZ_QUESTIONS.filter((q) => q.category === 'background');
    const speciesQuestions = QUIZ_QUESTIONS.filter((q) => q.category === 'species');

    expect(alignmentQuestions.length).toBe(3);
    expect(combatQuestions.length).toBe(3);
    expect(backgroundQuestions.length).toBe(2);
    expect(speciesQuestions.length).toBe(2);

    for (const q of QUIZ_QUESTIONS) {
      expect(q.id).toBeDefined();
      expect(q.categoryTitle).toMatch(/[А-Яа-яЁё]/);
      expect(q.question).toMatch(/[А-Яа-яЁё]/);
      expect(q.options.length).toBeGreaterThanOrEqual(3);

      for (const opt of q.options) {
        expect(opt.id).toBeDefined();
        expect(opt.title).toMatch(/[А-Яа-яЁё]/);
        expect(opt.scores).toBeDefined();
      }
    }
  });

  it('calculates Lawful-Good alignment when selecting lawful and good options', () => {
    const answers = {
      q1_law_justice: 'q1_lawful',
      q2_cost_of_victory: 'q2_good',
      q3_word_of_honor: 'q3_lawful',
      q4_first_strike: 'q4_tank',
      q5_power_source: 'q5_martial',
      q6_weapon_choice: 'q6_sword_shield',
      q7_past_life: 'q7_soldier',
      q8_relic_habit: 'q8_whetstone',
      q9_heritage_blood: 'q9_dwarf',
      q10_elemental_calling: 'q10_dwarf',
    };

    const result = evaluateQuiz(answers);

    expect(result.alignment).toBe('Законно-добрый');
    expect(result.roleId).toBe('tank');
    expect(result.powerSourceId).toBe('martial');
    expect(result.speciesId).toBe('dwarf');
    expect(result.backgroundId).toBe('soldier');
    expect(typeof result.characterName).toBe('string');
    expect(result.characterName.length).toBeGreaterThan(1);
    expect(result.summaryTitle).toContain('Законно-добрый');
    expect(result.summaryDescription).toContain('Законно-добрый');
  });

  it('calculates Chaotic-Good alignment when selecting chaotic and good options', () => {
    const answers = {
      q1_law_justice: 'q1_chaotic',
      q2_cost_of_victory: 'q2_good',
      q3_word_of_honor: 'q3_chaotic',
      q4_first_strike: 'q4_striker',
      q5_power_source: 'q5_shadow',
      q6_weapon_choice: 'q6_daggers_bow',
      q7_past_life: 'q7_criminal',
      q8_relic_habit: 'q8_thieves_tools',
      q9_heritage_blood: 'q9_elf',
      q10_elemental_calling: 'q10_elf',
    };

    const result = evaluateQuiz(answers);

    expect(result.alignment).toBe('Хаотично-добрый');
    expect(result.roleId).toBe('striker');
    expect(result.powerSourceId).toBe('shadow');
    expect(result.speciesId).toBe('elf');
    expect(result.backgroundId).toBe('criminal');
  });

  it('calculates True-Neutral alignment when scores balance out or neutral options chosen', () => {
    const answers = {
      q1_law_justice: 'q1_pragmatic',
      q2_cost_of_victory: 'q2_neutral',
      q3_word_of_honor: 'q3_neutral',
    };

    const result = evaluateQuiz(answers);

    expect(result.alignment).toBe('Истинно-нейтральный');
  });

  it('calculates Chaotic-Evil alignment when selecting chaotic and evil options', () => {
    const answers = {
      q1_law_justice: 'q1_chaotic',
      q2_cost_of_victory: 'q2_evil',
      q3_word_of_honor: 'q3_chaotic',
      q4_first_strike: 'q4_blaster',
      q5_power_source: 'q5_arcane',
      q6_weapon_choice: 'q6_staff_grimoire',
      q7_past_life: 'q7_sage',
      q8_relic_habit: 'q8_puzzle_book',
      q9_heritage_blood: 'q9_tiefling',
      q10_elemental_calling: 'q10_tiefling',
    };

    const result = evaluateQuiz(answers);

    expect(result.alignment).toBe('Хаотично-злой');
    expect(result.roleId).toBe('blaster');
    expect(result.powerSourceId).toBe('arcane');
    expect(result.speciesId).toBe('tiefling');
  });
});
