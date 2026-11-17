'use client';

import React from 'react';
import { useRouter } from 'next/navigation';
import { WizardContainer } from '@/components/wizard/WizardContainer';
import { Character } from '@/types/character';

export default function CreateCharacterPage() {
  let router: ReturnType<typeof useRouter> | null = null;
  try {
    // In some test runners or SSR mocks, useRouter may throw outside App Router
    // eslint-disable-next-line react-hooks/rules-of-hooks
    router = useRouter();
  } catch {
    router = null;
  }

  const handleComplete = (character: Character) => {
    try {
      if (typeof window !== 'undefined' && window.localStorage) {
        localStorage.setItem(`hero_${character.key}`, JSON.stringify(character));
        localStorage.setItem('latest_hero_key', character.key);
      }
      if (router && typeof router.push === 'function') {
        router.push(`/character/${character.key}`);
      }
    } catch {
      // Fallback if router is not mounted
    }
  };

  return (
    <main className="min-h-screen bg-slate-950 text-slate-100 py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-4xl mx-auto space-y-8">
        <header className="text-center space-y-2">
          <span className="text-xs uppercase tracking-widest text-amber-400 font-semibold">
            D&D 2024 Hero Creator
          </span>
          <h1 className="text-3xl sm:text-4xl font-serif font-black text-slate-100 tracking-tight">
            Сотворение персонажа
          </h1>
          <p className="text-sm text-slate-400 max-w-lg mx-auto">
            Создайте оригинального героя 1-го уровня без знания толстых книг правил. Всего несколько простых шагов.
          </p>
        </header>

        <WizardContainer onComplete={handleComplete} />
      </div>
    </main>
  );
}
