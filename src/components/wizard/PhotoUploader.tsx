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
  Shield,
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
  onNext,
  onBack,
  onSkip,
  isSubmitting = false,
}) => {
  const [dragOver, setDragOver] = useState(false);
  const [error, setError] = useState<string | null>(null);
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
        portraitUrl: base64,
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
      mode: 'preset',
    });
  };

  const handleRemovePhoto = () => {
    onChange({
      photoBase64: undefined,
      portraitUrl: undefined,
      mode: 'skip',
    });
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleGenerateWithoutPhoto = () => {
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

  return (
    <div className="w-full space-y-6">
      <div className="text-center space-y-1">
        <span className="text-xs uppercase tracking-widest text-amber-400/90 font-medium">
          Визуализация персонажа • D&D Visualizer
        </span>
        <h2 className="text-2xl sm:text-3xl font-serif font-bold text-slate-100">
          Портрет героя
        </h2>
        <p className="text-sm text-slate-400 max-w-xl mx-auto">
          Загрузите селфи для превращения вашего лица в фэнтези-портрет, выберите готовый аватар или создайте героя чисто по описанию.
        </p>
      </div>

      {/* Main Drag-Drop / Upload Area */}
      <div className="p-5 rounded-xl border border-slate-800 bg-slate-900/80 space-y-4">
        {value.photoBase64 ? (
          <div className="flex flex-col sm:flex-row items-center gap-5 p-4 rounded-xl border border-amber-500/40 bg-slate-950">
            <div className="relative w-32 h-32 rounded-lg overflow-hidden border-2 border-amber-400 shadow-md shadow-amber-500/20 shrink-0">
              <img
                src={value.photoBase64}
                alt="Загруженное селфи"
                className="w-full h-full object-cover"
              />
            </div>
            <div className="flex-1 text-center sm:text-left space-y-1">
              <span className="text-xs font-semibold uppercase tracking-wider text-amber-400 flex items-center justify-center sm:justify-start gap-1">
                <Check className="w-4 h-4" /> Селфи загружено
              </span>
              <p className="text-sm text-slate-300">
                Нейросеть сохранит черты вашего лица и перенесет их на вашего {species} {characterClass}.
              </p>
              <button
                type="button"
                onClick={handleRemovePhoto}
                className="mt-2 text-xs text-rose-400 hover:text-rose-300 flex items-center gap-1 mx-auto sm:mx-0 transition-colors cursor-pointer"
              >
                <Trash2 className="w-3.5 h-3.5" /> Удалить фото
              </button>
            </div>
          </div>
        ) : (
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
                JPEG, PNG, WebP до 5 МБ. Портрет будет стилизован под D&D 2024.
              </p>
            </div>
          </div>
        )}

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
          disabled={isSubmitting}
          className="w-full sm:w-auto px-4 py-2 text-sm text-slate-300 hover:text-white border border-slate-700 hover:border-slate-600 rounded-lg transition-colors cursor-pointer"
        >
          Назад
        </button>

        <div className="w-full sm:w-auto flex flex-col sm:flex-row items-center gap-3">
          <button
            type="button"
            onClick={handleGenerateWithoutPhoto}
            disabled={isSubmitting}
            className="w-full sm:w-auto px-4 py-2 text-sm text-slate-400 hover:text-amber-300 border border-slate-800 hover:border-slate-700 rounded-lg transition-colors flex items-center justify-center gap-1.5 cursor-pointer"
          >
            <Sparkles className="w-3.5 h-3.5 text-amber-400" />
            Сгенерировать без фото
          </button>
          <button
            type="button"
            onClick={onNext}
            disabled={isSubmitting}
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
