'use client';

import React, { useState } from 'react';
import {
  Sparkles,
  ArrowRight,
  ArrowLeft,
  RotateCcw,
  CheckCircle2,
  Dice5,
  Shield,
  Compass,
  Scroll,
  User,
  Scale,
} from 'lucide-react';
import { QUIZ_QUESTIONS, evaluateQuiz } from '@/lib/dnd2024/quizEngine';
import { ArchetypeSelection, QuizResult } from '@/types/archetype';
import { buildBaseChassis } from '@/lib/dnd2024/rulesEngine';

const ROLE_RU: Record<string, string> = {
  tank: 'Танк (Стальной щит)',
  striker: 'Дамагер (Теневой клинок)',
  blaster: 'Кастер (Штормовой вихрь)',
  support: 'Поддержка (Свет надежды)',
};

const POWER_RU: Record<string, string> = {
  martial: 'Воинское мастерство',
  shadow: 'Скрытность и тени',
  arcane: 'Тайная магия',
  divine: 'Божественная благодать',
};

const SPECIES_RU: Record<string, string> = {
  human: 'Человек',
  elf: 'Эльф',
  dwarf: 'Дварф',
  tiefling: 'Тифлинг',
  halfling: 'Полурослик',
  dragonborn: 'Драконорожденный',
};

const BACKGROUND_RU: Record<string, string> = {
  soldier: 'Солдат',
  sage: 'Мудрец',
  criminal: 'Преступник',
  acolyte: 'Прислужник',
  guide: 'Проводник',
};

export interface PersonalityQuizProps {
  onComplete: (selection: ArchetypeSelection) => void;
  onSwitchToManual?: () => void;
  initialSelection?: ArchetypeSelection;
}

export const PersonalityQuiz: React.FC<PersonalityQuizProps> = ({
  onComplete,
  onSwitchToManual,
  initialSelection,
}) => {
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [quizResult, setQuizResult] = useState<QuizResult | null>(null);
  const [customName, setCustomName] = useState(initialSelection?.characterName || '');

  const currentQuestion = QUIZ_QUESTIONS[currentQuestionIndex];
  const isFinished = quizResult !== null;

  const handleSelectOption = (optionId: string) => {
    const updated = { ...answers, [currentQuestion.id]: optionId };
    setAnswers(updated);

    // If last question, evaluate results immediately
    if (currentQuestionIndex === QUIZ_QUESTIONS.length - 1) {
      const result = evaluateQuiz(updated);
      setQuizResult(result);
      if (!customName) {
        setCustomName(result.characterName);
      }
    } else {
      setCurrentQuestionIndex((prev) => prev + 1);
    }
  };

  const handleBack = () => {
    if (currentQuestionIndex > 0) {
      setCurrentQuestionIndex((prev) => prev - 1);
    }
  };

  const handleRestart = () => {
    setAnswers({});
    setCurrentQuestionIndex(0);
    setQuizResult(null);
  };

  const handleAcceptResult = () => {
    if (!quizResult) return;

    onComplete({
      roleId: quizResult.roleId,
      powerSourceId: quizResult.powerSourceId,
      speciesId: quizResult.speciesId,
      characterName: customName || quizResult.characterName,
      alignment: quizResult.alignment,
      backgroundId: quizResult.backgroundId,
    });
  };

  const handleRandomizeName = () => {
    if (!quizResult) return;
    const fresh = evaluateQuiz(answers);
    setCustomName(fresh.characterName);
  };

  return (
    <div className="w-full space-y-6">
      {/* Quiz Header */}
      <div className="text-center space-y-1">
        <span className="text-xs uppercase tracking-widest text-amber-400 font-medium flex items-center justify-center gap-1.5">
          <Sparkles className="w-3.5 h-3.5" /> Ролевой тест личности • D&D 2024
        </span>
        <h2 className="text-2xl sm:text-3xl font-serif font-bold text-slate-100">
          {isFinished ? 'Ваш архетип определен!' : 'Кто вы в мире приключений?'}
        </h2>
        <p className="text-sm text-slate-400 max-w-xl mx-auto">
          {isFinished
            ? 'На основе ваших ответов сформирован сбалансированный персонаж по официальным правилам D&D 2024.'
            : `Ответьте на ${QUIZ_QUESTIONS.length} сюжетных вопросов, чтобы раскрыть боевой стиль, мировоззрение и судьбу героя.`}
        </p>
      </div>

      {!isFinished ? (
        <div className="space-y-6">
          {/* Progress bar */}
          <div className="space-y-2">
            <div className="flex items-center justify-between text-xs text-slate-400">
              <span className="font-semibold text-amber-400">
                {currentQuestion.categoryTitle}
              </span>
              <span>
                Вопрос {currentQuestionIndex + 1} из {QUIZ_QUESTIONS.length}
              </span>
            </div>
            <div className="w-full h-1.5 bg-slate-800 rounded-full overflow-hidden">
              <div
                className="h-full bg-gradient-to-r from-amber-500 to-amber-300 transition-all duration-300"
                style={{
                  width: `${((currentQuestionIndex + 1) / QUIZ_QUESTIONS.length) * 100}%`,
                }}
              />
            </div>
          </div>

          {/* Question Text */}
          <div className="p-5 sm:p-6 rounded-2xl border border-slate-800 bg-slate-900/80 shadow-lg space-y-5">
            <h3 className="text-lg sm:text-xl font-serif font-semibold text-slate-100 leading-snug">
              {currentQuestion.question}
            </h3>

            {/* Options Grid */}
            <div className="grid grid-cols-1 gap-3">
              {currentQuestion.options.map((option) => {
                const isSelected = answers[currentQuestion.id] === option.id;

                return (
                  <button
                    key={option.id}
                    type="button"
                    onClick={() => handleSelectOption(option.id)}
                    className={`p-4 rounded-xl border text-left transition-all duration-150 flex items-start gap-3.5 cursor-pointer group ${
                      isSelected
                        ? 'border-amber-400 bg-amber-500/10 shadow-md shadow-amber-500/10'
                        : 'border-slate-800 bg-slate-950/60 hover:border-slate-700 hover:bg-slate-950/90'
                    }`}
                  >
                    <div
                      className={`w-5 h-5 rounded-full border flex items-center justify-center shrink-0 mt-0.5 transition-colors ${
                        isSelected
                          ? 'border-amber-400 bg-amber-400 text-slate-950'
                          : 'border-slate-700 group-hover:border-slate-500'
                      }`}
                    >
                      {isSelected && <div className="w-2 h-2 rounded-full bg-slate-950" />}
                    </div>

                    <div className="space-y-1">
                      <span className="text-sm font-semibold text-slate-200 block group-hover:text-amber-300 transition-colors">
                        {option.title}
                      </span>
                      {option.description && (
                        <p className="text-xs text-slate-400 leading-relaxed">
                          {option.description}
                        </p>
                      )}
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Bottom Bar: Back button and manual switch */}
          <div className="flex items-center justify-between pt-2">
            <button
              type="button"
              onClick={handleBack}
              disabled={currentQuestionIndex === 0}
              className="px-4 py-2 text-sm text-slate-400 hover:text-white disabled:opacity-30 disabled:cursor-not-allowed flex items-center gap-1.5 transition-colors cursor-pointer"
            >
              <ArrowLeft className="w-4 h-4" /> Назад
            </button>

            {onSwitchToManual && (
              <button
                type="button"
                onClick={onSwitchToManual}
                className="text-xs text-slate-500 hover:text-amber-400 transition-colors underline cursor-pointer"
              >
                Выбрать архетип вручную
              </button>
            )}
          </div>
        </div>
      ) : (
        /* Result Screen */
        <div className="p-6 sm:p-8 rounded-2xl border border-amber-500/40 bg-slate-900/90 shadow-2xl space-y-6 animate-fadeIn">
          <div className="flex items-center gap-2 text-emerald-400 text-xs font-semibold uppercase tracking-wider">
            <CheckCircle2 className="w-4 h-4" />
            <span>Тест успешно завершен</span>
          </div>

          {/* Badges Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
            <div className="p-4 rounded-xl border border-slate-800 bg-slate-950/80 space-y-1">
              <span className="text-[11px] font-semibold uppercase tracking-wider text-amber-400/90 flex items-center gap-1.5">
                <Scale className="w-3.5 h-3.5" /> Мировоззрение (Alignment)
              </span>
              <span className="text-base font-serif font-bold text-slate-100 block">
                {quizResult.alignment}
              </span>
              <p className="text-xs text-slate-400">
                Определяет внутренний компас, принципы и моральный выбор героя.
              </p>
            </div>

            <div className="p-4 rounded-xl border border-slate-800 bg-slate-950/80 space-y-1">
              <span className="text-[11px] font-semibold uppercase tracking-wider text-amber-400/90 flex items-center gap-1.5">
                <Shield className="w-3.5 h-3.5" /> Боевая роль и класс
              </span>
              <span className="text-base font-serif font-bold text-slate-100 block">
                {ROLE_RU[quizResult.roleId] || quizResult.roleId} • {POWER_RU[quizResult.powerSourceId] || quizResult.powerSourceId}
              </span>
              <p className="text-xs text-slate-400">
                Определяет хиты, спасброски, боевые приемы и тактику в сражениях.
              </p>
            </div>

            <div className="p-4 rounded-xl border border-slate-800 bg-slate-950/80 space-y-1">
              <span className="text-[11px] font-semibold uppercase tracking-wider text-amber-400/90 flex items-center gap-1.5">
                <User className="w-3.5 h-3.5" /> Народ (Species)
              </span>
              <span className="text-base font-serif font-bold text-slate-100 block">
                {SPECIES_RU[quizResult.speciesId] || quizResult.speciesId}
              </span>
              <p className="text-xs text-slate-400">
                Дарует ночное зрение, родовую скорость и особые врожденные способности.
              </p>
            </div>

            <div className="p-4 rounded-xl border border-slate-800 bg-slate-950/80 space-y-1">
              <span className="text-[11px] font-semibold uppercase tracking-wider text-amber-400/90 flex items-center gap-1.5">
                <Scroll className="w-3.5 h-3.5" /> Предыстория (Background)
              </span>
              <span className="text-base font-serif font-bold text-slate-100 block">
                {BACKGROUND_RU[quizResult.backgroundId] || quizResult.backgroundId}
              </span>
              <p className="text-xs text-slate-400">
                Дарует стартовые +2/+1 к характеристикам и черту происхождения (Origin Feat).
              </p>
            </div>
          </div>

          {/* Character Name Input with randomizer */}
          <div className="p-4 rounded-xl border border-slate-800 bg-slate-950/50 space-y-2">
            <label className="text-xs font-semibold uppercase tracking-wider text-slate-300 block">
              Имя вашего героя:
            </label>
            <div className="flex items-center gap-2">
              <input
                type="text"
                value={customName}
                onChange={(e) => setCustomName(e.target.value)}
                placeholder={quizResult.characterName}
                className="flex-1 px-4 py-2 text-sm text-slate-100 bg-slate-900 border border-slate-700 rounded-lg focus:outline-none focus:border-amber-400 transition-colors"
              />
              <button
                type="button"
                onClick={handleRandomizeName}
                className="p-2.5 rounded-lg border border-slate-700 bg-slate-900 hover:border-amber-400 hover:text-amber-400 text-slate-300 transition-colors cursor-pointer"
                title="Случайное имя"
              >
                <Dice5 className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-2">
            <button
              type="button"
              onClick={handleRestart}
              className="w-full sm:w-auto px-4 py-2 text-sm text-slate-400 hover:text-white border border-slate-800 hover:border-slate-700 rounded-lg transition-colors flex items-center justify-center gap-1.5 cursor-pointer"
            >
              <RotateCcw className="w-4 h-4" /> Пройти тест заново
            </button>

            <button
              type="button"
              onClick={handleAcceptResult}
              className="w-full sm:w-auto px-6 py-2.5 text-sm font-semibold text-slate-950 bg-amber-400 hover:bg-amber-300 rounded-lg shadow-lg shadow-amber-500/20 transition-all flex items-center justify-center gap-2 cursor-pointer"
            >
              <span>Принять и перейти к кастомной механике</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
