'use client';

import React, { useState } from 'react';
import {
  Heart,
  Shield,
  Zap,
  Footprints,
  Award,
  Download,
  Share2,
  Sparkles,
  BookOpen,
  Plus,
  Minus,
  Scroll,
  Key,
  User,
  Loader2,
} from 'lucide-react';
import { Character, AbilityScores } from '@/types/character';
import { calculateModifier } from '@/lib/dnd2024/rulesEngine';
import { ActionCards } from './ActionCards';
import { ShareKeyModal } from './ShareKeyModal';

export interface InteractiveSheetProps {
  character: Character;
}

const SPECIES_RU: Record<string, string> = {
  human: 'Человек',
  elf: 'Эльф',
  dwarf: 'Дварф',
  halfling: 'Полурослик',
  gnome: 'Гном',
  dragonborn: 'Драконорождённый',
  tiefling: 'Тифлинг',
  orc: 'Орк',
  goliath: 'Голиаф',
};

const CLASS_RU: Record<string, string> = {
  fighter: 'Воин (Fighter)',
  wizard: 'Волшебник (Wizard)',
  rogue: 'Плут (Rogue)',
  cleric: 'Жрец (Cleric)',
  barbarian: 'Варвар (Barbarian)',
  bard: 'Бард (Bard)',
  druid: 'Друид (Druid)',
  monk: 'Монах (Monk)',
  paladin: 'Паладин (Paladin)',
  ranger: 'Следопыт (Ranger)',
  sorcerer: 'Чародей (Sorcerer)',
  warlock: 'Колдун (Warlock)',
};

const BACKGROUND_RU: Record<string, string> = {
  soldier: 'Солдат (Soldier)',
  sage: 'Мудрец (Sage)',
  criminal: 'Преступник (Criminal)',
  acolyte: 'Прислужник (Acolyte)',
  artisan: 'Ремесленник',
  charlatan: 'Шарлатан',
  entertainer: 'Артист',
  farmer: 'Фермер',
  guard: 'Стражник',
  guide: 'Проводник',
  hermit: 'Отшельник',
  merchant: 'Купец',
  noble: 'Дворянин',
  sailor: 'Моряк',
  scribe: 'Писец',
  wayfarer: 'Странник',
};

export function InteractiveSheet({ character }: InteractiveSheetProps) {
  const [currentHp, setCurrentHp] = useState<number>(character.hp);
  const [isShareOpen, setIsShareOpen] = useState(false);
  const [isDownloadingPdf, setIsDownloadingPdf] = useState(false);
  const [downloadError, setDownloadError] = useState<string | null>(null);

  const maxHp = character.maxHp || character.hp;
  const dexMod = calculateModifier(character.abilityScores.dexterity);
  const formatBonus = (val: number) => (val >= 0 ? `+${val}` : `${val}`);

  const handleDecreaseHp = () => {
    setCurrentHp((prev) => Math.max(0, prev - 1));
  };

  const handleIncreaseHp = () => {
    setCurrentHp((prev) => Math.min(maxHp, prev + 1));
  };

  const handleDownloadPdf = async () => {
    try {
      setIsDownloadingPdf(true);
      setDownloadError(null);

      const response = await fetch('/api/export-pdf', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ character: { ...character, hp: currentHp } }),
      });

      if (!response.ok) {
        throw new Error('Не удалось сформировать PDF');
      }

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `${character.name || 'character'}_2024.pdf`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
    } catch (err) {
      console.error('PDF export failed:', err);
      setDownloadError('Ошибка при создании PDF. Попробуйте еще раз.');
    } finally {
      setIsDownloadingPdf(false);
    }
  };

  const abilities: Array<{
    key: keyof AbilityScores;
    label: string;
    short: string;
  }> = [
    { key: 'strength', label: 'Сила', short: 'СИЛ' },
    { key: 'dexterity', label: 'Ловкость', short: 'ЛОВ' },
    { key: 'constitution', label: 'Телосложение', short: 'ТЕЛ' },
    { key: 'intelligence', label: 'Интеллект', short: 'ИНТ' },
    { key: 'wisdom', label: 'Мудрость', short: 'МДР' },
    { key: 'charisma', label: 'Харизма', short: 'ХАР' },
  ];

  const speciesName =
    SPECIES_RU[character.species.toLowerCase()] || character.species;
  const className =
    CLASS_RU[character.characterClass.toLowerCase()] || character.characterClass;
  const backgroundName =
    BACKGROUND_RU[character.background.toLowerCase()] || character.background;

  const hpPercentage = Math.round((currentHp / maxHp) * 100);
  const hpColor =
    hpPercentage > 50
      ? 'bg-emerald-500'
      : hpPercentage > 25
      ? 'bg-amber-500'
      : 'bg-rose-500';

  return (
    <div className="max-w-4xl mx-auto space-y-6 pb-16">
      {/* Top Action Bar (Mobile Game Table) */}
      <div className="flex flex-wrap items-center justify-between gap-3 bg-slate-900/90 border border-slate-800 rounded-2xl p-4 shadow-lg backdrop-blur">
        <div className="flex items-center gap-3">
          <button
            onClick={() => setIsShareOpen(true)}
            data-testid="share-key-trigger"
            className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-amber-500/10 border border-amber-500/30 text-amber-400 hover:bg-amber-500/20 transition-colors font-mono font-bold text-xs sm:text-sm"
            title="Нажмите, чтобы открыть меню шеринга"
          >
            <Key className="w-3.5 h-3.5" />
            <span>{character.key}</span>
            <Share2 className="w-3.5 h-3.5 ml-1 opacity-70" />
          </button>
          <span className="text-xs text-slate-400 hidden sm:inline">
            1-й уровень D&D 2024
          </span>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={handleDownloadPdf}
            disabled={isDownloadingPdf}
            className="flex items-center gap-2 px-4 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-semibold text-xs sm:text-sm transition-all shadow-md active:scale-95 disabled:opacity-50"
          >
            {isDownloadingPdf ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>Генерация PDF...</span>
              </>
            ) : (
              <>
                <Download className="w-4 h-4" />
                <span>Скачать официальный PDF</span>
              </>
            )}
          </button>
        </div>
      </div>

      {downloadError && (
        <div className="p-3 rounded-xl bg-rose-950/50 border border-rose-800 text-rose-300 text-xs">
          {downloadError}
        </div>
      )}

      {/* Hero Header Card */}
      <section className="bg-slate-900/80 border border-slate-800 rounded-3xl p-5 sm:p-6 shadow-xl relative overflow-hidden">
        <div className="absolute top-0 right-0 w-64 h-64 bg-amber-500/5 rounded-full blur-3xl pointer-events-none" />

        <div className="flex flex-col sm:flex-row items-center sm:items-start gap-5 sm:gap-6 relative z-10">
          {/* Portrait */}
          <div className="relative w-28 h-28 sm:w-32 sm:h-32 rounded-2xl overflow-hidden bg-slate-950 border-2 border-amber-500/40 shadow-lg flex-shrink-0 flex items-center justify-center">
            {character.portraitUrl ? (
              <img
                src={character.portraitUrl}
                alt={character.name}
                className="w-full h-full object-cover"
              />
            ) : (
              <User className="w-12 h-12 text-slate-600" />
            )}
            <div className="absolute inset-0 ring-1 ring-inset ring-amber-500/20 rounded-2xl pointer-events-none" />
          </div>

          {/* Hero Details */}
          <div className="flex-1 text-center sm:text-left space-y-2">
            <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2">
              <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-amber-500/10 text-amber-400 border border-amber-500/20">
                Уровень 1
              </span>
              <span className="px-2.5 py-0.5 rounded-full text-xs font-medium bg-slate-800 text-slate-300">
                {speciesName}
              </span>
              <span className="px-2.5 py-0.5 rounded-full text-xs font-medium bg-slate-800 text-slate-300">
                {className}
              </span>
              <span className="px-2.5 py-0.5 rounded-full text-xs font-medium bg-slate-800 text-slate-300">
                {backgroundName}
              </span>
            </div>

            <h1 className="text-2xl sm:text-4xl font-serif font-black text-slate-100 tracking-tight">
              {character.name}
            </h1>

            <p className="text-xs sm:text-sm text-slate-400">
              Черта происхождения: <strong className="text-slate-200">{character.originFeat}</strong>
            </p>
          </div>
        </div>
      </section>

      {/* Combat Vitals & Live HP Bar (Optimized for Smartphone at the Table) */}
      <section className="grid grid-cols-2 sm:grid-cols-5 gap-3">
        {/* Armor Class */}
        <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-4 text-center space-y-1 shadow-sm">
          <div className="flex items-center justify-center gap-1.5 text-slate-400 text-xs font-medium uppercase tracking-wider">
            <Shield className="w-4 h-4 text-amber-400" />
            <span>КД / AC</span>
          </div>
          <div className="text-3xl font-serif font-black text-slate-100">
            {character.ac}
          </div>
          <div className="text-[11px] text-slate-400">Класс доспеха</div>
        </div>

        {/* Speed */}
        <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-4 text-center space-y-1 shadow-sm">
          <div className="flex items-center justify-center gap-1.5 text-slate-400 text-xs font-medium uppercase tracking-wider">
            <Footprints className="w-4 h-4 text-amber-400" />
            <span>Скорость</span>
          </div>
          <div className="text-3xl font-serif font-black text-slate-100">
            {character.speed}
          </div>
          <div className="text-[11px] text-slate-400">футов / ход</div>
        </div>

        {/* Initiative */}
        <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-4 text-center space-y-1 shadow-sm">
          <div className="flex items-center justify-center gap-1.5 text-slate-400 text-xs font-medium uppercase tracking-wider">
            <Zap className="w-4 h-4 text-amber-400" />
            <span>Инициатива</span>
          </div>
          <div className="text-3xl font-serif font-black text-slate-100 font-mono">
            {formatBonus(dexMod)}
          </div>
          <div className="text-[11px] text-slate-400">Бонус к реакции</div>
        </div>

        {/* Proficiency */}
        <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-4 text-center space-y-1 shadow-sm">
          <div className="flex items-center justify-center gap-1.5 text-slate-400 text-xs font-medium uppercase tracking-wider">
            <Award className="w-4 h-4 text-amber-400" />
            <span>Мастерство</span>
          </div>
          <div className="text-3xl font-serif font-black text-slate-100 font-mono">
            +2
          </div>
          <div className="text-[11px] text-slate-400">Бонус мастерства</div>
        </div>

        {/* Interactive HP Counter (Takes 2 cols on mobile, 1 on larger screens) */}
        <div className="col-span-2 sm:col-span-1 bg-slate-900/90 border border-rose-900/40 rounded-2xl p-3 sm:p-4 text-center space-y-2 shadow-sm relative overflow-hidden">
          <div className="flex items-center justify-center gap-1.5 text-rose-400 text-xs font-medium uppercase tracking-wider">
            <Heart className="w-4 h-4 fill-rose-500/20 text-rose-400" />
            <span>Хиты (HP)</span>
          </div>

          <div
            data-testid="current-hp-display"
            className="text-2xl sm:text-3xl font-serif font-black text-slate-100 flex items-center justify-center gap-1"
          >
            <span>{currentHp}</span>
            <span className="text-slate-500 text-lg">/ {maxHp}</span>
          </div>

          {/* Interactive - / + buttons */}
          <div className="flex items-center justify-center gap-2">
            <button
              onClick={handleDecreaseHp}
              data-testid="hp-decrease-btn"
              className="w-8 h-8 rounded-lg bg-slate-800 hover:bg-rose-900/40 text-slate-200 border border-slate-700 hover:border-rose-700 flex items-center justify-center transition-colors active:scale-90"
              aria-label="Уменьшить текущие хиты"
            >
              <Minus className="w-4 h-4" />
            </button>
            <button
              onClick={handleIncreaseHp}
              data-testid="hp-increase-btn"
              className="w-8 h-8 rounded-lg bg-slate-800 hover:bg-emerald-900/40 text-slate-200 border border-slate-700 hover:border-emerald-700 flex items-center justify-center transition-colors active:scale-90"
              aria-label="Увеличить текущие хиты"
            >
              <Plus className="w-4 h-4" />
            </button>
          </div>

          {/* Progress mini bar */}
          <div className="w-full h-1.5 bg-slate-800 rounded-full overflow-hidden">
            <div
              className={`h-full ${hpColor} transition-all duration-300`}
              style={{ width: `${Math.min(100, Math.max(0, hpPercentage))}%` }}
            />
          </div>
        </div>
      </section>

      {/* Ability Scores Grid */}
      <section className="bg-slate-900/80 border border-slate-800 rounded-2xl p-4 sm:p-5 shadow-sm space-y-3">
        <h3 className="text-xs font-semibold uppercase tracking-wider text-slate-400 font-serif">
          Характеристики и Модификаторы
        </h3>
        <div className="grid grid-cols-3 sm:grid-cols-6 gap-2 sm:gap-3">
          {abilities.map((ability) => {
            const score = character.abilityScores[ability.key] ?? 10;
            const mod = calculateModifier(score);
            return (
              <div
                key={ability.key}
                className="bg-slate-950/70 border border-slate-800/80 rounded-xl p-3 text-center space-y-1 hover:border-slate-700 transition-colors"
              >
                <span className="text-[11px] font-bold tracking-wider text-slate-400 block uppercase">
                  {ability.short}
                </span>
                <div className="text-xl sm:text-2xl font-mono font-bold text-amber-300">
                  {formatBonus(mod)}
                </div>
                <div className="text-[11px] text-slate-400">{score}</div>
              </div>
            );
          })}
        </div>
      </section>

      {/* Custom Balance Card Mechanic (Gold / Amber Accent) */}
      {character.customMechanic && (
        <section className="bg-gradient-to-br from-amber-950/30 to-slate-900/90 border-2 border-amber-500/50 rounded-2xl p-5 shadow-xl space-y-3 relative overflow-hidden">
          <div className="flex items-center gap-2 text-amber-400">
            <Sparkles className="w-5 h-5 flex-shrink-0" />
            <h3 className="text-base font-bold uppercase tracking-wide font-serif">
              Особая способность героя (Custom Balance Card)
            </h3>
          </div>

          <div className="space-y-2">
            <h4 className="text-lg font-bold text-slate-100">
              {character.customMechanic.title}
            </h4>

            {character.customMechanic.trigger && (
              <div className="inline-block bg-amber-500/15 border border-amber-500/30 text-amber-300 text-xs px-2.5 py-1 rounded-md font-medium">
                Триггер: {character.customMechanic.trigger}
              </div>
            )}

            <p className="text-sm text-slate-200 leading-relaxed">
              {character.customMechanic.effect}
            </p>

            <div className="pt-2 flex flex-wrap gap-2 text-xs">
              {character.customMechanic.costOrTradeoff && (
                <span className="bg-slate-950/80 border border-slate-700/80 text-slate-300 px-2.5 py-1 rounded-md">
                  Ограничение: <strong className="text-amber-400">{character.customMechanic.costOrTradeoff}</strong>
                </span>
              )}
              {character.customMechanic.ruleEquivalent && (
                <span className="bg-slate-950/80 border border-slate-700/80 text-slate-400 px-2.5 py-1 rounded-md">
                  Баланс: {character.customMechanic.ruleEquivalent}
                </span>
              )}
            </div>
          </div>
        </section>
      )}

      {/* Combat Actions & Inventory Cards */}
      <ActionCards
        characterClass={character.characterClass}
        abilityScores={character.abilityScores}
      />

      {/* Narrative Backstory Card */}
      {character.backstory && (
        <section className="bg-slate-900/80 border border-slate-800 rounded-2xl p-5 sm:p-6 shadow-sm space-y-3">
          <div className="flex items-center gap-2 text-slate-300">
            <Scroll className="w-5 h-5 text-amber-400" />
            <h3 className="text-base font-semibold tracking-wide uppercase font-serif">
              Предыстория и мотивы
            </h3>
          </div>
          <div className="prose prose-invert prose-sm text-slate-300 leading-relaxed italic bg-slate-950/50 p-4 rounded-xl border border-slate-800/60">
            {character.backstory}
          </div>
        </section>
      )}

      {/* Share Key Modal */}
      <ShareKeyModal
        isOpen={isShareOpen}
        characterKey={character.key}
        characterName={character.name}
        onClose={() => setIsShareOpen(false)}
      />
    </div>
  );
}
