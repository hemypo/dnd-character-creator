'use client';

import React, { useState, useEffect } from 'react';
import { Copy, Check, X, Share2, Key } from 'lucide-react';

export interface ShareKeyModalProps {
  isOpen: boolean;
  characterKey: string;
  characterName?: string;
  onClose: () => void;
}

export function ShareKeyModal({
  isOpen,
  characterKey,
  characterName,
  onClose,
}: ShareKeyModalProps) {
  const [copiedKey, setCopiedKey] = useState(false);
  const [copiedLink, setCopiedLink] = useState(false);

  useEffect(() => {
    if (!isOpen) {
      setCopiedKey(false);
      setCopiedLink(false);
    }
  }, [isOpen]);

  // Handle escape key
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) {
    return null;
  }

  const handleCopyKey = async () => {
    try {
      if (navigator.clipboard) {
        await navigator.clipboard.writeText(characterKey);
        setCopiedKey(true);
        setTimeout(() => setCopiedKey(false), 2500);
      }
    } catch {
      // Fallback
    }
  };

  const handleCopyLink = async () => {
    try {
      if (navigator.clipboard) {
        const fullUrl = typeof window !== 'undefined'
          ? `${window.location.origin}/character/${characterKey}`
          : `/character/${characterKey}`;
        await navigator.clipboard.writeText(fullUrl);
        setCopiedLink(true);
        setTimeout(() => setCopiedLink(false), 2500);
      }
    } catch {
      // Fallback
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200"
      onClick={onClose}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="modal-title"
        className="relative w-full max-w-md bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-2xl text-slate-100 space-y-6"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-400">
              <Share2 className="w-5 h-5" />
            </div>
            <div>
              <h3 id="modal-title" className="text-lg font-bold font-serif text-slate-100">
                Поделиться героем
              </h3>
              {characterName && (
                <p className="text-xs text-slate-400 font-medium">
                  {characterName}
                </p>
              )}
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-100 hover:bg-slate-800 transition-colors"
            aria-label="Закрыть"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Access Code Box */}
        <div className="bg-slate-950/80 border border-slate-800 rounded-xl p-4 text-center space-y-2">
          <span className="text-xs font-semibold uppercase tracking-wider text-slate-400 flex items-center justify-center gap-1.5">
            <Key className="w-3.5 h-3.5 text-amber-400" />
            Код доступа персонажа
          </span>
          <div className="text-3xl font-mono font-black tracking-widest text-amber-400 select-all">
            {characterKey}
          </div>
          <p className="text-xs text-slate-400 leading-relaxed max-w-xs mx-auto">
            Используйте этот код, чтобы мгновенно загрузить лист персонажа на любом смартфоне или планшете.
          </p>
        </div>

        {/* Action Buttons */}
        <div className="space-y-2.5">
          <button
            onClick={handleCopyKey}
            className="w-full flex items-center justify-center gap-2 py-3 px-4 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-semibold text-sm transition-all shadow-md active:scale-[0.99]"
          >
            {copiedKey ? (
              <>
                <Check className="w-4 h-4 text-slate-950" />
                <span>Код скопирован!</span>
              </>
            ) : (
              <>
                <Copy className="w-4 h-4" />
                <span>Скопировать код ({characterKey})</span>
              </>
            )}
          </button>

          <button
            onClick={handleCopyLink}
            className="w-full flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl bg-slate-800/80 hover:bg-slate-800 text-slate-200 border border-slate-700/80 font-medium text-xs transition-colors"
          >
            {copiedLink ? (
              <>
                <Check className="w-4 h-4 text-emerald-400" />
                <span className="text-emerald-400">Ссылка скопирована!</span>
              </>
            ) : (
              <>
                <Share2 className="w-4 h-4 text-slate-400" />
                <span>Скопировать прямую ссылку</span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
