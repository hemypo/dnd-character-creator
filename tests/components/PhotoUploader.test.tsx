import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import React from 'react';
import { PhotoUploader, PhotoUploaderValue } from '@/components/wizard/PhotoUploader';

describe('PhotoUploader Component', () => {
  const mockOnChange = vi.fn();
  const mockOnNext = vi.fn();
  const mockOnBack = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders initial upload dropzone and preset gallery', () => {
    render(
      <PhotoUploader
        onChange={mockOnChange}
        species="elf"
        characterClass="wizard"
        characterName="Леголас"
        onNext={mockOnNext}
        onBack={mockOnBack}
      />
    );

    expect(screen.getByText(/Портрет героя/i)).toBeDefined();
    expect(screen.getByText(/Перетащите ваше фото сюда/i)).toBeDefined();
    expect(screen.getAllByTestId('preset-avatar').length).toBeGreaterThanOrEqual(1);
  });

  it('shows uploaded photo preview and allows turning selfie into D&D portrait with SubNP Flux', async () => {
    const fakeSelfie = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==';
    const fakeGeneratedArt = 'https://subnp.ai/generated-art-1.jpg';

    const fetchSpy = vi.spyOn(global, 'fetch').mockImplementation(async (url: RequestInfo | URL) => {
      if (String(url).includes('/api/generate-portrait')) {
        return {
          ok: true,
          json: async () => ({ portraitUrl: fakeGeneratedArt }),
        } as unknown as Response;
      }
      return { ok: false } as unknown as Response;
    });

    const photoValue: PhotoUploaderValue = {
      photoBase64: fakeSelfie,
      mode: 'photo',
    };

    render(
      <PhotoUploader
        value={photoValue}
        onChange={mockOnChange}
        species="elf"
        characterClass="wizard"
        characterName="Леголас"
        onNext={mockOnNext}
      />
    );

    // Initial uploaded selfie preview is displayed
    const selfieImg = screen.getByAltText(/Загруженное селфи/i) as HTMLImageElement;
    expect(selfieImg).toBeDefined();
    expect(selfieImg.src).toContain(fakeSelfie);

    // Button to turn selfie into D&D portrait
    const generateBtn = screen.getByRole('button', {
      name: /Превратить селфи в портрет D&D|Сгенерировать арт-портрет/i,
    });
    expect(generateBtn).toBeDefined();

    fireEvent.click(generateBtn);

    // Loading state is shown
    expect(screen.getByText(/Нейросеть SubNP Flux генерирует портрет/i)).toBeDefined();

    await waitFor(() => {
      expect(fetchSpy).toHaveBeenCalledWith(
        '/api/generate-portrait',
        expect.objectContaining({
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            character: { species: 'elf', characterClass: 'wizard', name: 'Леголас' },
            photoBase64: fakeSelfie,
            useFreeApi: true,
            model: 'flux',
          }),
        })
      );
    });

    // onChange should have been called with generated portraitUrl
    await waitFor(() => {
      expect(mockOnChange).toHaveBeenCalledWith(
        expect.objectContaining({
          photoBase64: fakeSelfie,
          portraitUrl: fakeGeneratedArt,
          mode: 'photo',
        })
      );
    });
  });

  it('displays generated fantasy art in preview card with regenerate and change photo buttons', async () => {
    const fakeSelfie = 'data:image/png;base64,mockSelfie';
    const fakeGeneratedArt = 'https://subnp.ai/generated-art-1.jpg';
    const regeneratedArt = 'https://subnp.ai/generated-art-2.jpg';

    const fetchSpy = vi.spyOn(global, 'fetch').mockImplementation(async (url: RequestInfo | URL) => {
      if (String(url).includes('/api/generate-portrait')) {
        return {
          ok: true,
          json: async () => ({ portraitUrl: regeneratedArt }),
        } as unknown as Response;
      }
      return { ok: false } as unknown as Response;
    });

    const photoValue: PhotoUploaderValue = {
      photoBase64: fakeSelfie,
      portraitUrl: fakeGeneratedArt,
      mode: 'photo',
    };

    render(
      <PhotoUploader
        value={photoValue}
        onChange={mockOnChange}
        species="elf"
        characterClass="wizard"
        characterName="Леголас"
      />
    );

    // The generated fantasy art is rendered in preview
    const artImg = screen.getByAltText(/Сгенерированный арт-портрет/i) as HTMLImageElement;
    expect(artImg).toBeDefined();
    expect(artImg.src).toContain(fakeGeneratedArt);

    // Regenerate and Change photo buttons exist
    const regenBtn = screen.getByRole('button', { name: /Перегенерировать/i });
    const clearBtn = screen.getByRole('button', { name: /Загрузить другое фото|Удалить фото/i });

    expect(regenBtn).toBeDefined();
    expect(clearBtn).toBeDefined();

    // Click regenerate
    fireEvent.click(regenBtn);

    expect(screen.getByText(/Нейросеть SubNP Flux генерирует портрет/i)).toBeDefined();

    await waitFor(() => {
      expect(fetchSpy).toHaveBeenCalled();
      expect(mockOnChange).toHaveBeenCalledWith(
        expect.objectContaining({
          portraitUrl: regeneratedArt,
        })
      );
    });

    // Click clear photo (re-queried after re-render)
    const currentClearBtn = screen.getByRole('button', { name: /Загрузить другое фото|Удалить фото/i });
    fireEvent.click(currentClearBtn);
    expect(mockOnChange).toHaveBeenCalledWith(
      expect.objectContaining({
        photoBase64: undefined,
        portraitUrl: undefined,
        mode: 'skip',
      })
    );
  });

  it('supports generating fantasy art by lore without uploading a photo', async () => {
    const loreArt = 'https://subnp.ai/generated-lore-art.jpg';

    const fetchSpy = vi.spyOn(global, 'fetch').mockImplementation(async (url: RequestInfo | URL) => {
      if (String(url).includes('/api/generate-portrait')) {
        return {
          ok: true,
          json: async () => ({ portraitUrl: loreArt }),
        } as unknown as Response;
      }
      return { ok: false } as unknown as Response;
    });

    render(
      <PhotoUploader
        onChange={mockOnChange}
        species="dwarf"
        characterClass="fighter"
        characterName="Гримли"
      />
    );

    const loreBtn = screen.getByRole('button', { name: /Сгенерировать арт по лору|Сгенерировать по лору/i });
    expect(loreBtn).toBeDefined();

    fireEvent.click(loreBtn);

    // Shows loading
    expect(screen.getByText(/Нейросеть SubNP Flux генерирует портрет/i)).toBeDefined();

    await waitFor(() => {
      expect(fetchSpy).toHaveBeenCalledWith(
        '/api/generate-portrait',
        expect.objectContaining({
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            character: { species: 'dwarf', characterClass: 'fighter', name: 'Гримли' },
            useFreeApi: true,
            model: 'flux',
          }),
        })
      );
    });

    await waitFor(() => {
      expect(mockOnChange).toHaveBeenCalledWith(
        expect.objectContaining({
          mode: 'ai-prompt',
          portraitUrl: loreArt,
        })
      );
    });
  });
});
