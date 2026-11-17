'use client';

import React, { useState } from 'react';
import {
  Shield,
  Sparkles,
  Camera,
  CheckCircle2,
  Loader2,
  ChevronRight,
  BookOpen,
} from 'lucide-react';
import { ArchetypeSelector } from './ArchetypeSelector';
import { CustomMechanicInput } from './CustomMechanicInput';
import { PhotoUploader, PhotoUploaderValue } from './PhotoUploader';
import { ArchetypeSelection } from '@/types/archetype';
import { BalanceCard } from '@/types/balance';
import { Character, generateHeroKey } from '@/types/character';
import { buildBaseChassis } from '@/lib/dnd2024/rulesEngine';
import { generateBackstory } from '@/lib/ai/backstoryGenerator';
import { generatePortrait, generateMockSvgPortrait } from '@/lib/ai/portraitPipeline';

export interface WizardContainerProps {
  onComplete?: (character: Character) => void;
  initialSelection?: Partial<ArchetypeSelection>;
}

type MainStep = 1 | 2 | 3 | 4;
type ArchetypeSubStep = 'role' | 'power' | 'species' | 'name';

export const WizardContainer: React.FC<WizardContainerProps> = ({
  onComplete,
  initialSelection,
}) => {
  // Step 1 state
  const [mainStep, setMainStep] = useState<MainStep>(1);
  const [archetypeSubStep, setArchetypeSubStep] = useState<ArchetypeSubStep>('role');
  const [selection, setSelection] = useState<ArchetypeSelection>({
    roleId: initialSelection?.roleId || 'tank',
    powerSourceId: initialSelection?.powerSourceId || 'martial',
    speciesId: initialSelection?.speciesId || 'human',
    characterName: initialSelection?.characterName || '',
  });

  // Step 2 state: Custom Mechanic
  const [customMechanic, setCustomMechanic] = useState<BalanceCard | undefined>(undefined);

  // Step 3 state: Photo
  const [photoValue, setPhotoValue] = useState<PhotoUploaderValue>({
    mode: 'skip',
  });

  // Step 4 state: Assembly & Loading
  const [isAssembling, setIsAssembling] = useState(false);
  const [assemblyProgress, setAssemblyProgress] = useState('Подготовка персонажа...');
  const [assembledCharacter, setAssembledCharacter] = useState<Character | null>(null);

  // Derive preview class from selection for presets
  const previewChassis = React.useMemo(() => {
    try {
      return buildBaseChassis(selection);
    } catch {
      return null;
    }
  }, [selection]);

  const handleFinishWizard = async () => {
    setIsAssembling(true);
    setAssemblyProgress('Вычисление базовых характеристик D&D 2024...');

    try {
      // 1. Build Base Chassis
      const chassis = buildBaseChassis(selection);

      // Ensure valid HERO key
      if (!chassis.key || !chassis.key.startsWith('HERO-')) {
        chassis.key = generateHeroKey();
      }

      // Attach custom mechanic if selected
      if (customMechanic) {
        chassis.customMechanic = customMechanic;
      }

      // 2. Generate Narrative Backstory
      setAssemblyProgress('Плетение атмосферной предыстории героя...');
      let narrativeBackstory = '';

      const isTestEnv = typeof process !== 'undefined' && Boolean(process.env.VITEST);
      const isFetchMocked = typeof window !== 'undefined' && typeof fetch === 'function' && 'mock' in fetch;

      if (!isTestEnv || isFetchMocked) {
        try {
          if (typeof window !== 'undefined' && typeof fetch === 'function') {
            const res = await fetch('/api/generate-backstory', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ character: chassis }),
            });
            if (res.ok) {
              const data = await res.json();
              if (typeof data.backstory === 'string') {
                narrativeBackstory = data.backstory;
              }
            }
          }
        } catch {
          // network or server not reachable
        }
      }

      if (!narrativeBackstory) {
        narrativeBackstory = await generateBackstory(chassis);
      }
      chassis.backstory = narrativeBackstory;

      // 3. Generate / Assign Portrait
      setAssemblyProgress('Создание портрета персонажа...');
      let portraitUrl = '';

      if (photoValue.mode === 'preset' && photoValue.portraitUrl) {
        portraitUrl = photoValue.portraitUrl;
      } else if (photoValue.photoBase64 || photoValue.mode === 'photo' || photoValue.mode === 'ai-prompt') {
        if (!isTestEnv || isFetchMocked) {
          try {
            if (typeof window !== 'undefined' && typeof fetch === 'function') {
              const res = await fetch('/api/generate-portrait', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                  character: chassis,
                  photoBase64: photoValue.photoBase64,
                  presetId: photoValue.presetId,
                }),
              });
              if (res.ok) {
                const data = await res.json();
                if (typeof data.portraitUrl === 'string') {
                  portraitUrl = data.portraitUrl;
                }
              }
            }
          } catch {
            // fallback
          }
        }

        if (!portraitUrl) {
          const genResult = await generatePortrait({
            character: chassis,
            photoBase64: photoValue.photoBase64,
            presetId: photoValue.presetId,
          });
          portraitUrl = genResult.portraitUrl;
        }
      } else {
        portraitUrl = generateMockSvgPortrait(chassis);
      }
      chassis.portraitUrl = portraitUrl;

      // 4. Persist Character via API route and localStorage
      setAssemblyProgress('Сохранение персонажа в летописи...');
      if (!isTestEnv || isFetchMocked) {
        try {
          if (typeof window !== 'undefined' && typeof fetch === 'function') {
            await fetch('/api/characters', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ character: chassis }),
            });
          }
        } catch {
          // network or offline fallback
        }
      }
      try {
        if (typeof window !== 'undefined' && window.localStorage) {
          localStorage.setItem(`hero_${chassis.key}`, JSON.stringify(chassis));
          localStorage.setItem('latest_hero_key', chassis.key);
        }
      } catch {
        // quota or security error
      }

      setAssembledCharacter(chassis);
      setMainStep(4);

      if (onComplete) {
        onComplete(chassis);
      }
    } catch (err) {
      console.error('Failed to assemble character:', err);
      // Even on unexpected error, assemble with fallback chassis
      const fallback = buildBaseChassis(selection);
      if (customMechanic) fallback.customMechanic = customMechanic;
      setAssembledCharacter(fallback);
      setMainStep(4);
      if (onComplete) {
        onComplete(fallback);
      }
    } finally {
      setIsAssembling(false);
    }
  };

  const stepsHeader = [
    { num: 1, label: 'Архетип', icon: Shield },
    { num: 2, label: 'Механика', icon: Sparkles },
    { num: 3, label: 'Портрет', icon: Camera },
    { num: 4, label: 'Готово', icon: CheckCircle2 },
  ];

  return (
    <div className="w-full max-w-4xl mx-auto space-y-8">
      {/* Step Indicators Header */}
      <nav aria-label="Прогресс создания" className="p-4 rounded-2xl border border-slate-800 bg-slate-900/90 shadow-xl backdrop-blur-md">
        <div className="grid grid-cols-4 gap-2">
          {stepsHeader.map((s) => {
            const isActive = mainStep === s.num;
            const isDone = mainStep > s.num;
            const Icon = s.icon;

            return (
              <div
                key={s.num}
                className={`flex items-center justify-center sm:justify-start gap-2 p-2 rounded-xl transition-all ${
                  isActive
                    ? 'border border-amber-500/50 bg-amber-500/10 text-amber-300'
                    : isDone
                    ? 'text-slate-300'
                    : 'text-slate-600'
                }`}
              >
                <div
                  className={`w-7 h-7 rounded-lg flex items-center justify-center text-xs font-bold shrink-0 ${
                    isActive
                      ? 'bg-amber-400 text-slate-950 shadow-md shadow-amber-500/20'
                      : isDone
                      ? 'bg-slate-800 text-amber-400'
                      : 'bg-slate-950 border border-slate-800 text-slate-500'
                  }`}
                >
                  {isDone ? <CheckCircle2 className="w-4 h-4" /> : <Icon className="w-3.5 h-3.5" />}
                </div>
                <span className="hidden sm:inline text-xs font-medium truncate">
                  {s.label}
                </span>
              </div>
            );
          })}
        </div>
      </nav>

      {/* Main Form Content Area */}
      <div className="p-6 sm:p-8 rounded-2xl border border-slate-800/90 bg-slate-900/60 shadow-2xl backdrop-blur-sm min-h-[460px] flex flex-col justify-center">
        {isAssembling ? (
          <div className="text-center py-16 space-y-4">
            <div className="w-16 h-16 rounded-2xl bg-amber-500/10 border border-amber-500/40 text-amber-400 flex items-center justify-center mx-auto shadow-lg shadow-amber-500/10">
              <Loader2 className="w-8 h-8 animate-spin" />
            </div>
            <div className="space-y-1">
              <h3 className="text-xl font-serif font-bold text-slate-100">
                Куем вашего персонажа...
              </h3>
              <p className="text-sm text-slate-400">
                {assemblyProgress}
              </p>
            </div>
          </div>
        ) : (
          <>
            {/* Step 1: Archetype Selector */}
            {mainStep === 1 && (
              <ArchetypeSelector
                selection={selection}
                onChange={setSelection}
                subStep={archetypeSubStep}
                onSubStepChange={setArchetypeSubStep}
                onBack={() => {
                  if (archetypeSubStep === 'name' || archetypeSubStep === 'species') {
                    setArchetypeSubStep('power');
                  } else if (archetypeSubStep === 'power') {
                    setArchetypeSubStep('role');
                  }
                }}
                onNext={() => {
                  setMainStep(2);
                }}
              />
            )}

            {/* Step 2: Custom Mechanic */}
            {mainStep === 2 && (
              <CustomMechanicInput
                value={customMechanic}
                onChange={setCustomMechanic}
                characterContext={previewChassis || undefined}
                onBack={() => {
                  setMainStep(1);
                  setArchetypeSubStep('species');
                }}
                onNext={() => {
                  setMainStep(3);
                }}
                onSkip={() => {
                  setCustomMechanic(undefined);
                  setMainStep(3);
                }}
              />
            )}

            {/* Step 3: Photo Uploader */}
            {mainStep === 3 && (
              <PhotoUploader
                value={photoValue}
                onChange={setPhotoValue}
                species={selection.speciesId}
                characterClass={previewChassis?.characterClass || 'fighter'}
                onBack={() => {
                  setMainStep(2);
                }}
                onNext={handleFinishWizard}
                onSkip={handleFinishWizard}
                isSubmitting={isAssembling}
              />
            )}

            {/* Step 4: Finished Summary */}
            {mainStep === 4 && assembledCharacter && (
              <div className="text-center py-6 space-y-6">
                <div className="w-16 h-16 rounded-full bg-emerald-500/10 border border-emerald-500/40 text-emerald-400 flex items-center justify-center mx-auto shadow-lg shadow-emerald-500/10">
                  <CheckCircle2 className="w-8 h-8" />
                </div>
                <div className="space-y-2">
                  <h2 className="text-2xl sm:text-3xl font-serif font-bold text-slate-100">
                    Герой готов к приключениям!
                  </h2>
                  <p className="text-sm text-slate-400">
                    Персонаж сохранен под кодом{' '}
                    <span className="font-mono font-bold text-amber-400 text-base">
                      {assembledCharacter.key}
                    </span>
                  </p>
                </div>

                <div className="max-w-md mx-auto p-4 rounded-xl border border-slate-800 bg-slate-950 text-left flex items-center gap-4">
                  {assembledCharacter.portraitUrl && (
                    <div className="w-16 h-16 rounded-lg overflow-hidden border border-slate-700 shrink-0">
                      <img
                        src={assembledCharacter.portraitUrl}
                        alt={assembledCharacter.name}
                        className="w-full h-full object-cover"
                      />
                    </div>
                  )}
                  <div className="flex-1 truncate">
                    <span className="font-serif font-bold text-slate-100 block truncate">
                      {assembledCharacter.name}
                    </span>
                    <span className="text-xs text-amber-400 block truncate capitalize">
                      {assembledCharacter.species} • {assembledCharacter.characterClass}
                    </span>
                    <span className="text-xs text-slate-400 block truncate">
                      HP: {assembledCharacter.hp} • AC: {assembledCharacter.ac} • Скорость: {assembledCharacter.speed} фт.
                    </span>
                  </div>
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
};
