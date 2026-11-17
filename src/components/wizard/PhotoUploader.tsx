'use client';

import React, { useState, useRef } from 'react';
import {
  Upload,
  Image as ImageIcon,
  Check,
  Trash2,
  Sparkles,
  AlertCircle,
  ArrowRight,
  RefreshCw,
  Loader2,
} from 'lucide-react';
import { getPresetAvatars, PresetAvatar } from '@/lib/ai/portraitPipeline';

export interface PhotoUploaderValue {
  photoBase64?: string;
  presetId?: string;
  portraitUrl?: string;
  mode: 'photo' | 'preset' | 'ai-prompt' | 'skip';
}

export interface PhotoUploaderProps {
  value?: PhotoUploaderValue;
  onChange: (value: PhotoUploaderValue) => void;
  species?: string;
  characterClass?: string;
  characterName?: string;
  onNext?: () => void;
  onBack?: () => void;
  onSkip?: () => void;
  isSubmitting?: boolean;
}

const MAX_BYTES = 5 * 1024 * 1024; // 5 MB

export const PhotoUploader: React.FC<PhotoUploaderProps> = ({
  value = { mode: 'skip' },
  onChange,
  species = 'human',
  characterClass = 'fighter',
  characterName = 'Герой',
  onNext,
  onBack,
  onSkip,
  isSubmitting = false,
}) => {
  const [dragOver, setDragOver] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Load curated presets for the chosen species & class
  const presets: PresetAvatar[] = getPresetAvatars(species, characterClass);

  const processFile = (file: File) => {
    setError(null);
    if (!file.type.startsWith('image/')) {
      setError('Пожалуйста, выберите файл изображения (JPEG, PNG или WebP)');
      return;
    }

    if (file.size > MAX_BYTES) {
      setError('Размер фотографии превышает лимит 5 МБ. Выберите файл поменьше.');
      return;
    }

    const reader = new FileReader();
    reader.onload = (e) => {
      const base64 = e.target?.result as string;
      onChange({
        photoBase64: base64,
        portraitUrl: undefined,
        presetId: undefined,
        mode: 'photo',
      });
    };
    reader.onerror = () => {
      setError('Ошибка при чтении файла');
    };
    reader.readAsDataURL(file);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      processFile(e.dataTransfer.files[0]);
    }
  };

  const handleSelectPreset = (preset: PresetAvatar) => {
    setError(null);
    onChange({
      presetId: preset.id,
      portraitUrl: preset.url,
      photoBase64: undefined,
      mode: 'preset',
    });
  };

  const handleRemovePhoto = () => {
    setError(null);
    onChange({
      photoBase64: undefined,
      portraitUrl: undefined,
      presetId: undefined,
      mode: 'skip',
    });
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleGenerateWithoutPhoto = () => {
    setError(null);
    onChange({
      photoBase64: undefined,
      presetId: undefined,
      portraitUrl: undefined,
      mode: 'ai-prompt',
    });
    if (onNext) {
      onNext();
    }
  };

  const handleGeneratePortrait = async (withPhoto: boolean) => {
    setError(null);
    setIsGenerating(true);

    try {
      const payload: Record<string, unknown> = {
        character: {
          species,
          characterClass,
          name: characterName || 'Герой',
        },
      };

      if (withPhoto && value.photoBase64) {
        payload.photoBase64 = value.photoBase64;
      }

      payload.useFreeApi = true;
      payload.model = 'flux';

      const res = await fetch('/api/generate-portrait', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        throw new Error('Не удалось сгенерировать портрет через API');
      }

      const data = await res.json();
      if (typeof data.portraitUrl === 'string' && data.portraitUrl) {
        onChange({
          ...value,
          portraitUrl: data.portraitUrl,
          mode: withPhoto ? 'photo' : 'ai-prompt',
        });
      } else {
        throw new Error('API вернул пустой адрес портрета');
      }
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Ошибка генерации портрета';
      setError(msg);
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <div className="w-full space-y-6">
      <div className="text-center space-y-1">
        <span className="text-xs uppercase tracking-widest text-amber-400/90 font-medium">
          Визуализация персонажа • SubNP Flux Free API
        </span>
        <h2 className="text-2xl sm:text-3xl font-serif font-bold text-slate-100">
          Портрет героя
        </h2>
        <p className="text-sm text-slate-400 max-w-xl mx-auto">
          Загрузите селфи и превратите его в фэнтези-портрет, сгенерируйте арт по описанию или выберите готовый аватар.
        </p>
      </div>

      {/* Main Upload / Generation Area */}
      <div className="p-5 rounded-xl border border-slate-800 bg-slate-900/80 space-y-4">
        {/* Loading overlay / indicator */}
        {isGenerating && (
          <div className="p-6 rounded-xl border border-amber-500/50 bg-slate-950 flex flex-col items-center justify-center space-y-3 text-center animate-pulse">
            <Loader2 className="w-8 h-8 text-amber-400 animate-spin" />
            <p className="text-sm font-medium text-amber-300">
              Нейросеть SubNP Flux генерирует портрет...
            </p>
            <p className="text-xs text-slate-400">
              Превращаем ваше фото и черты {species} {characterClass} в фэнтези-арт
            </p>
          </div>
        )}

        {/* State A: Generated Portrait Result Ready */}
        {!isGenerating && value.portraitUrl && (value.mode === 'photo' || value.mode === 'ai-prompt') && (
          <div className="flex flex-col sm:flex-row items-center gap-5 p-4 rounded-xl border border-amber-500/50 bg-slate-950">
            <div className="relative w-36 h-36 rounded-xl overflow-hidden border-2 border-amber-400 shadow-lg shadow-amber-500/20 shrink-0 bg-slate-900">
              <img
                src={value.portraitUrl}
                alt="Сгенерированный арт-портрет"
                className="w-full h-full object-cover"
              />
              <div className="absolute top-1.5 right-1.5 px-2 py-0.5 rounded-full bg-amber-400 text-slate-950 text-[10px] font-bold uppercase tracking-wider flex items-center gap-1 shadow">
                <Sparkles className="w-3 h-3" /> Flux
              </div>
            </div>

            <div className="flex-1 text-center sm:text-left space-y-2">
              <div className="flex items-center justify-center sm:justify-start gap-1.5 text-xs font-semibold uppercase tracking-wider text-amber-400">
                <Check className="w-4 h-4 text-emerald-400" />
                <span>Портрет готов к бою!</span>
              </div>
              <p className="text-sm text-slate-300">
                {value.mode === 'photo'
                  ? 'Стилизованный портрет с сохранением ваших черт лица.'
                  : `Фэнтези-арт, сгенерированный по лору: ${species} ${characterClass}.`}
              </p>

              <div className="pt-2 flex flex-wrap items-center justify-center sm:justify-start gap-2.5">
                <button
                  type="button"
                  onClick={() => handleGeneratePortrait(value.mode === 'photo')}
                  className="px-3.5 py-1.5 text-xs font-medium text-slate-950 bg-amber-400 hover:bg-amber-300 rounded-lg transition-colors flex items-center gap-1.5 shadow-sm cursor-pointer"
                >
                  <RefreshCw className="w-3.5 h-3.5" />
                  Перегенерировать
                </button>
                <button
                  type="button"
                  onClick={handleRemovePhoto}
                  className="px-3.5 py-1.5 text-xs text-slate-300 hover:text-white border border-slate-700 hover:border-slate-600 rounded-lg transition-colors flex items-center gap-1.5 cursor-pointer"
                >
                  <Trash2 className="w-3.5 h-3.5 text-rose-400" />
                  Загрузить другое фото
                </button>
              </div>
            </div>
          </div>
        )}

        {/* State B: Photo uploaded, awaiting generation button click */}
        {!isGenerating && value.photoBase64 && !value.portraitUrl && (
          <div className="flex flex-col sm:flex-row items-center gap-5 p-4 rounded-xl border border-amber-500/40 bg-slate-950">
            <div className="relative w-32 h-32 rounded-lg overflow-hidden border-2 border-slate-700 shrink-0">
              <img
                src={value.photoBase64}
                alt="Загруженное селфи"
                className="w-full h-full object-cover"
              />
            </div>
            <div className="flex-1 text-center sm:text-left space-y-2">
              <span className="text-xs font-semibold uppercase tracking-wider text-slate-300 flex items-center justify-center sm:justify-start gap-1">
                <Check className="w-4 h-4 text-amber-400" /> Селфи загружено
              </span>
              <p className="text-xs sm:text-sm text-slate-400">
                Нажмите кнопку ниже, чтобы нейросеть Flux превратила фото в портрет персонажа:
              </p>
              <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2 pt-1">
                <button
                  type="button"
                  onClick={() => handleGeneratePortrait(true)}
                  className="px-4 py-2 text-xs sm:text-sm font-semibold text-slate-950 bg-amber-400 hover:bg-amber-300 rounded-lg shadow-md shadow-amber-500/20 transition-all flex items-center gap-1.5 cursor-pointer"
                >
                  <Sparkles className="w-4 h-4 text-slate-950" />
                  Превратить селфи в портрет D&D
                </button>
                <button
                  type="button"
                  onClick={handleRemovePhoto}
                  className="px-3 py-1.5 text-xs text-rose-400 hover:text-rose-300 flex items-center gap-1 transition-colors cursor-pointer"
                >
                  <Trash2 className="w-3.5 h-3.5" /> Удалить фото
                </button>
              </div>
            </div>
          </div>
        )}

        {/* State C: No photo uploaded yet */}
        {!isGenerating && !value.photoBase64 && !value.portraitUrl && (
          <div
            onDragOver={(e) => {
              e.preventDefault();
              setDragOver(true);
            }}
            onDragLeave={() => setDragOver(false)}
            onDrop={handleDrop}
            onClick={() => fileInputRef.current?.click()}
            className={`border-2 border-dashed rounded-xl p-8 text-center transition-all cursor-pointer flex flex-col items-center justify-center space-y-3 ${
              dragOver
                ? 'border-amber-400 bg-amber-950/20'
                : 'border-slate-700 bg-slate-950/60 hover:border-slate-600 hover:bg-slate-950/90'
            }`}
          >
            <input
              ref={fileInputRef}
              type="file"
              accept="image/jpeg,image/png,image/webp"
              className="hidden"
              onChange={(e) => {
                if (e.target.files && e.target.files[0]) {
                  processFile(e.target.files[0]);
                }
              }}
            />
            <div className="p-3 rounded-full bg-slate-900 border border-slate-800 text-amber-400">
              <Upload className="w-6 h-6" />
            </div>
            <div className="space-y-1">
              <p className="text-sm font-medium text-slate-200">
                Перетащите ваше фото сюда или <span className="text-amber-400 underline">выберите файл</span>
              </p>
              <p className="text-xs text-slate-500">
                JPEG, PNG, WebP до 5 МБ. Портрет будет стилизован под D&D 2024 через SubNP Flux.
              </p>
            </div>
          </div>
        )}

        {/* Generation error display */}
        {error && (
          <div className="flex items-center gap-2 p-3 rounded-lg border border-rose-500/40 bg-rose-950/30 text-rose-300 text-xs">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}
      </div>

      {/* Preset Avatars Gallery */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h3 className="text-xs sm:text-sm font-semibold text-slate-300 uppercase tracking-wide flex items-center gap-1.5">
            <ImageIcon className="w-4 h-4 text-amber-400" />
            Или выберите готовый аватар
          </h3>
          <span className="text-xs text-slate-500">Быстрый старт</span>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
          {presets.map((preset) => {
            const isSelected = value.presetId === preset.id;

            return (
              <button
                key={preset.id}
                type="button"
                data-testid="preset-avatar"
                onClick={() => handleSelectPreset(preset)}
                className={`relative p-3 rounded-xl border text-left transition-all duration-200 cursor-pointer flex flex-col items-center gap-2 group ${
                  isSelected
                    ? 'border-amber-400 bg-slate-900/90 shadow-md shadow-amber-500/10 ring-2 ring-amber-400/80'
                    : 'border-slate-800 bg-slate-900/60 hover:border-slate-700 hover:bg-slate-900/80'
                }`}
              >
                <div className="relative w-20 h-20 sm:w-24 sm:h-24 rounded-lg overflow-hidden border border-slate-700 bg-slate-950 shrink-0">
                  <img
                    src={preset.url}
                    alt={preset.name}
                    className="w-full h-full object-cover"
                  />
                  {isSelected && (
                    <div className="absolute top-1 right-1 w-5 h-5 rounded-full bg-amber-400 text-slate-950 flex items-center justify-center">
                      <Check className="w-3 h-3 stroke-[3]" />
                    </div>
                  )}
                </div>
                <div className="text-center w-full">
                  <span className="font-serif font-bold text-xs text-slate-200 block truncate">
                    {preset.name}
                  </span>
                  <span className="text-[10px] text-slate-400 block truncate">
                    {preset.description || `${preset.species} ${preset.characterClass}`}
                  </span>
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* Navigation Controls */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-4 border-t border-slate-800">
        <button
          type="button"
          onClick={onBack}
          disabled={isSubmitting || isGenerating}
          className="w-full sm:w-auto px-4 py-2 text-sm text-slate-300 hover:text-white border border-slate-700 hover:border-slate-600 rounded-lg transition-colors cursor-pointer"
        >
          Назад
        </button>

        <div className="w-full sm:w-auto flex flex-wrap items-center justify-end gap-2.5">
          <button
            type="button"
            onClick={() => handleGeneratePortrait(false)}
            disabled={isSubmitting || isGenerating}
            className="px-3.5 py-2 text-sm text-slate-400 hover:text-amber-300 border border-slate-800 hover:border-slate-700 rounded-lg transition-colors flex items-center justify-center gap-1.5 cursor-pointer"
            title="Сгенерировать и просмотреть арт перед завершением"
          >
            <Sparkles className="w-3.5 h-3.5 text-amber-400" />
            <span>✨ Сгенерировать арт по лору</span>
          </button>

          <button
            type="button"
            onClick={handleGenerateWithoutPhoto}
            disabled={isSubmitting || isGenerating}
            className="px-3.5 py-2 text-sm text-slate-400 hover:text-slate-200 border border-slate-800 hover:border-slate-700 rounded-lg transition-colors cursor-pointer"
          >
            Сгенерировать без фото
          </button>

          <button
            type="button"
            onClick={onNext}
            disabled={isSubmitting || isGenerating}
            className="w-full sm:w-auto px-6 py-2.5 text-sm font-semibold text-slate-950 bg-amber-400 hover:bg-amber-300 disabled:opacity-50 disabled:cursor-not-allowed rounded-lg shadow-md shadow-amber-500/20 transition-all flex items-center justify-center gap-1.5 cursor-pointer"
          >
            <span>Создать персонажа</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
};
