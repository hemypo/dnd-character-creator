import fs from 'fs';
import path from 'path';
import { PDFDocument, rgb, RGB, PDFFont, PDFPage } from 'pdf-lib';
import fontkit from '@pdf-lib/fontkit';
import { Character } from '@/types/character';
import {
  calculateModifier,
  getWeaponMasteries,
  getStartingEquipment,
} from '@/lib/dnd2024/rulesEngine';

/**
 * Searches for a TrueType Cyrillic font file in predictable locations.
 */
function loadCyrillicFontBytes(): Uint8Array {
  const candidatePaths = [
    path.resolve(process.cwd(), 'src/assets/fonts/Arial.ttf'),
    path.resolve(__dirname, '../../assets/fonts/Arial.ttf'),
    path.resolve(__dirname, '../assets/fonts/Arial.ttf'),
    'C:/Windows/Fonts/arial.ttf',
    'C:\\Windows\\Fonts\\arial.ttf',
  ];

  for (const candidate of candidatePaths) {
    try {
      if (fs.existsSync(candidate)) {
        return fs.readFileSync(candidate);
      }
    } catch {
      // Continue to next path
    }
  }

  throw new Error(
    `Cyrillic font (Arial.ttf) could not be located in candidate paths: ${candidatePaths.join(', ')}`
  );
}

/**
 * Wraps text into lines that fit within a maximum point width.
 */
function wrapText(text: string, maxWidth: number, font: PDFFont, fontSize: number): string[] {
  if (!text) return [];
  const lines: string[] = [];
  const paragraphs = text.split('\n');

  for (const paragraph of paragraphs) {
    const trimmed = paragraph.trim();
    if (!trimmed) {
      lines.push('');
      continue;
    }

    const words = trimmed.split(/\s+/);
    let currentLine = '';

    for (const word of words) {
      const candidate = currentLine ? `${currentLine} ${word}` : word;
      const textWidth = font.widthOfTextAtSize(candidate, fontSize);

      if (textWidth <= maxWidth) {
        currentLine = candidate;
      } else {
        if (currentLine) {
          lines.push(currentLine);
        }
        currentLine = word;
      }
    }

    if (currentLine) {
      lines.push(currentLine);
    }
  }

  return lines;
}

/**
 * Draws a rounded-look card frame with background and border.
 */
function drawCard(
  page: PDFPage,
  x: number,
  y: number,
  width: number,
  height: number,
  fillColor: RGB,
  borderColor: RGB,
  borderWidth: number = 1
) {
  page.drawRectangle({
    x,
    y,
    width,
    height,
    color: fillColor,
    borderColor,
    borderWidth,
  });
}

/**
 * Renders a stylized heraldic fallback frame when portrait is missing or in vector format (SVG).
 */
function drawHeraldicFallback(
  page: PDFPage,
  x: number,
  y: number,
  width: number,
  height: number,
  characterName: string,
  font: PDFFont
) {
  // Inner dark/gold frame
  const padding = 4;
  const innerX = x + padding;
  const innerY = y + padding;
  const innerW = width - padding * 2;
  const innerH = height - padding * 2;

  page.drawRectangle({
    x: innerX,
    y: innerY,
    width: innerW,
    height: innerH,
    color: rgb(0.93, 0.92, 0.89),
    borderColor: rgb(0.72, 0.58, 0.28),
    borderWidth: 1,
  });

  // Draw heraldic shield outline
  const cx = innerX + innerW / 2;
  const topY = innerY + innerH - 12;
  const bottomY = innerY + 18;
  const halfShieldW = 20;

  // Crest shield
  page.drawRectangle({
    x: cx - halfShieldW,
    y: innerY + 22,
    width: halfShieldW * 2,
    height: 42,
    color: rgb(0.85, 0.82, 0.77),
    borderColor: rgb(0.55, 0.12, 0.12),
    borderWidth: 1.5,
  });

  // Initial letter
  const initial = characterName ? characterName.trim().charAt(0).toUpperCase() : 'H';
  const initialSize = 22;
  const initialWidth = font.widthOfTextAtSize(initial, initialSize);
  page.drawText(initial, {
    x: cx - initialWidth / 2,
    y: innerY + 34,
    size: initialSize,
    font,
    color: rgb(0.55, 0.12, 0.12),
  });

  // Label banner
  const label = 'ГЕРБ ГЕРОЯ';
  const labelSize = 7;
  const labelWidth = font.widthOfTextAtSize(label, labelSize);
  page.drawText(label, {
    x: cx - labelWidth / 2,
    y: innerY + 9,
    size: labelSize,
    font,
    color: rgb(0.4, 0.38, 0.35),
  });
}

/**
 * Generates an official D&D 2024 Character Sheet PDF with Cyrillic support and embedded portrait.
 */
export async function generateCharacterPdf(character: Character): Promise<Uint8Array> {
  const pdfDoc = await PDFDocument.create();
  pdfDoc.registerFontkit(fontkit);

  const fontBytes = loadCyrillicFontBytes();
  const font = await pdfDoc.embedFont(fontBytes);

  // A4 Standard Dimensions in points
  const pageWidth = 595.28;
  const pageHeight = 841.89;
  const page = pdfDoc.addPage([pageWidth, pageHeight]);

  // Color Palette
  const cParchment = rgb(0.98, 0.98, 0.97);
  const cCardBg = rgb(0.96, 0.95, 0.93);
  const cHeaderBg = rgb(0.93, 0.91, 0.87);
  const cCrimson = rgb(0.55, 0.1, 0.12);
  const cDarkText = rgb(0.12, 0.12, 0.14);
  const cMutedText = rgb(0.38, 0.4, 0.44);
  const cGold = rgb(0.72, 0.58, 0.25);
  const cBorder = rgb(0.78, 0.75, 0.7);

  // Background and outer decorative margin
  page.drawRectangle({
    x: 0,
    y: 0,
    width: pageWidth,
    height: pageHeight,
    color: cParchment,
  });

  // Outer border
  page.drawRectangle({
    x: 18,
    y: 18,
    width: pageWidth - 36,
    height: pageHeight - 36,
    borderColor: cBorder,
    borderWidth: 1.5,
    color: undefined,
  });

  const contentLeft = 32;
  const contentWidth = pageWidth - 64; // ~531 pt

  // ==========================================
  // 1. HEADER SECTION (y: 720 to 812)
  // ==========================================
  const headerY = 718;
  const headerHeight = 96;

  drawCard(page, contentLeft, headerY, contentWidth, headerHeight, cHeaderBg, cBorder, 1.2);

  // Top banner label
  page.drawText('DUNGEONS & DRAGONS 2024 • ЛИСТ ПЕРСОНАЖА (УРОВЕНЬ 1)', {
    x: contentLeft + 14,
    y: headerY + headerHeight - 16,
    size: 8,
    font,
    color: cCrimson,
  });

  // Hero Name
  const charName = character.name || 'Безымянный герой';
  page.drawText(charName, {
    x: contentLeft + 14,
    y: headerY + headerHeight - 38,
    size: 18,
    font,
    color: cCrimson,
  });

  // Class, Species, Background, Hero Key
  const classLabel = `Класс: ${(character.characterClass || 'Воин').toUpperCase()} (1 ур.)`;
  const speciesLabel = `Раса: ${(character.species || 'Человек').toUpperCase()}`;
  const bgLabel = `Предыстория: ${(character.background || 'Солдат').toUpperCase()}`;
  const keyLabel = `ID: ${character.key || 'HERO-0000'}`;

  page.drawText(`${classLabel}  |  ${speciesLabel}`, {
    x: contentLeft + 14,
    y: headerY + headerHeight - 55,
    size: 10,
    font,
    color: cDarkText,
  });

  const alignmentStr = character.alignment ? `  |  ${character.alignment.toUpperCase()}` : '';

  page.drawText(`${bgLabel}${alignmentStr}  |  ${keyLabel}`, {
    x: contentLeft + 14,
    y: headerY + headerHeight - 71,
    size: 9.5,
    font,
    color: cMutedText,
  });

  // ------------------------------------------
  // Portrait Embedding or Heraldic Fallback
  // ------------------------------------------
  const portraitW = 80;
  const portraitH = 84;
  const portraitX = contentLeft + contentWidth - portraitW - 6;
  const portraitY = headerY + 6;

  drawCard(page, portraitX, portraitY, portraitW, portraitH, rgb(1, 1, 1), cGold, 1.5);

  let portraitEmbedded = false;
  const portraitUrl = character.portraitUrl;

  if (portraitUrl && typeof portraitUrl === 'string' && portraitUrl.trim() !== '') {
    const isSvg =
      portraitUrl.includes('image/svg') ||
      portraitUrl.trim().startsWith('<svg') ||
      portraitUrl.includes('xmlns=');

    if (!isSvg) {
      try {
        let imageBytes: Uint8Array | null = null;
        let isPng = false;

        if (portraitUrl.startsWith('data:image/png;base64,')) {
          const b64 = portraitUrl.replace('data:image/png;base64,', '');
          imageBytes = Buffer.from(b64, 'base64');
          isPng = true;
        } else if (
          portraitUrl.startsWith('data:image/jpeg;base64,') ||
          portraitUrl.startsWith('data:image/jpg;base64,')
        ) {
          const b64 = portraitUrl.replace(/^data:image\/jpe?g;base64,/, '');
          imageBytes = Buffer.from(b64, 'base64');
          isPng = false;
        } else if (portraitUrl.startsWith('data:')) {
          const match = portraitUrl.match(/^data:([^;]+);base64,(.+)$/);
          if (match) {
            imageBytes = Buffer.from(match[2], 'base64');
            isPng = match[1].includes('png');
          }
        }

        if (imageBytes && imageBytes.length > 0) {
          const embeddedImg = isPng
            ? await pdfDoc.embedPng(imageBytes)
            : await pdfDoc.embedJpg(imageBytes);

          const scale = Math.min(
            (portraitW - 6) / embeddedImg.width,
            (portraitH - 6) / embeddedImg.height
          );
          const drawW = embeddedImg.width * scale;
          const drawH = embeddedImg.height * scale;
          const drawX = portraitX + (portraitW - drawW) / 2;
          const drawY = portraitY + (portraitH - drawH) / 2;

          page.drawImage(embeddedImg, {
            x: drawX,
            y: drawY,
            width: drawW,
            height: drawH,
          });
          portraitEmbedded = true;
        }
      } catch {
        // Fallback to heraldic display on corrupted or unsupported binary
        portraitEmbedded = false;
      }
    }
  }

  if (!portraitEmbedded) {
    drawHeraldicFallback(page, portraitX, portraitY, portraitW, portraitH, charName, font);
  }

  // ==========================================
  // 2. COMBAT BADGES BAR (y: 658 to 708)
  // ==========================================
  const badgesY = 660;
  const badgesHeight = 48;
  const numBadges = 5;
  const badgeGap = 8;
  const badgeWidth = (contentWidth - badgeGap * (numBadges - 1)) / numBadges;

  const dexMod = calculateModifier(character.abilityScores?.dexterity ?? 10);
  const initStr = dexMod >= 0 ? `+${dexMod}` : `${dexMod}`;

  const badges = [
    { label: 'КЛАСС БРОНИ (AC)', value: `${character.ac ?? 10}` },
    { label: 'ХИТЫ (HP)', value: `${character.hp ?? 10} / ${character.maxHp ?? character.hp ?? 10}` },
    { label: 'СКОРОСТЬ', value: `${character.speed ?? 30} фт` },
    { label: 'ИНИЦИАТИВА', value: initStr },
    { label: 'МАСТЕРСТВО', value: '+2' },
  ];

  badges.forEach((b, idx) => {
    const bx = contentLeft + idx * (badgeWidth + badgeGap);
    drawCard(page, bx, badgesY, badgeWidth, badgesHeight, cCardBg, cBorder, 1);

    // Value
    const valSize = 14;
    const valWidth = font.widthOfTextAtSize(b.value, valSize);
    page.drawText(b.value, {
      x: bx + (badgeWidth - valWidth) / 2,
      y: badgesY + badgesHeight - 22,
      size: valSize,
      font,
      color: cCrimson,
    });

    // Label
    const lblSize = 6.5;
    const lblWidth = font.widthOfTextAtSize(b.label, lblSize);
    page.drawText(b.label, {
      x: bx + (badgeWidth - lblWidth) / 2,
      y: badgesY + 8,
      size: lblSize,
      font,
      color: cMutedText,
    });
  });

  // ==========================================
  // 3. MIDDLE ROW (y: 385 to 648)
  // Left: Ability Scores (width: 155)
  // Right Top: Attacks & Equipment (width: 368)
  // Right Bottom: Weapon Masteries & Origin Feat (width: 368)
  // ==========================================
  const middleY = 385;
  const middleH = 263;
  const leftColW = 155;
  const rightColX = contentLeft + leftColW + 10;
  const rightColW = contentWidth - leftColW - 10;

  // 3A. Ability Scores Column
  drawCard(page, contentLeft, middleY, leftColW, middleH, cCardBg, cBorder, 1);

  page.drawText('ХАРАКТЕРИСТИКИ', {
    x: contentLeft + 12,
    y: middleY + middleH - 18,
    size: 10,
    font,
    color: cCrimson,
  });

  const abilityDefs: Array<{ key: keyof typeof character.abilityScores; name: string }> = [
    { key: 'strength', name: 'СИЛА (STR)' },
    { key: 'dexterity', name: 'ЛОВКОСТЬ (DEX)' },
    { key: 'constitution', name: 'ТЕЛОСЛОЖЕНИЕ (CON)' },
    { key: 'intelligence', name: 'ИНТЕЛЛЕКТ (INT)' },
    { key: 'wisdom', name: 'МУДРОСТЬ (WIS)' },
    { key: 'charisma', name: 'ХАРИЗМА (CHA)' },
  ];

  const abBoxH = 36;
  const abSpacing = 3;
  const abStartY = middleY + middleH - 28;

  abilityDefs.forEach((ab, i) => {
    const ay = abStartY - (i + 1) * (abBoxH + abSpacing);
    const ax = contentLeft + 8;
    const aw = leftColW - 16;

    page.drawRectangle({
      x: ax,
      y: ay,
      width: aw,
      height: abBoxH,
      color: rgb(1, 1, 1),
      borderColor: cBorder,
      borderWidth: 0.8,
    });

    const score = character.abilityScores?.[ab.key] ?? 10;
    const mod = calculateModifier(score);
    const modStr = mod >= 0 ? `+${mod}` : `${mod}`;

    // Ability Name
    page.drawText(ab.name, {
      x: ax + 8,
      y: ay + abBoxH - 13,
      size: 7.5,
      font,
      color: cMutedText,
    });

    // Score
    page.drawText(`Значение: ${score}`, {
      x: ax + 8,
      y: ay + 8,
      size: 8,
      font,
      color: cDarkText,
    });

    // Big Modifier Box on the right
    const modBadgeW = 34;
    page.drawRectangle({
      x: ax + aw - modBadgeW - 4,
      y: ay + 4,
      width: modBadgeW,
      height: abBoxH - 8,
      color: rgb(0.95, 0.94, 0.92),
      borderColor: cGold,
      borderWidth: 1,
    });

    const modW = font.widthOfTextAtSize(modStr, 12);
    page.drawText(modStr, {
      x: ax + aw - modBadgeW - 4 + (modBadgeW - modW) / 2,
      y: ay + 10,
      size: 12,
      font,
      color: cCrimson,
    });
  });

  // 3B. Attacks & Starting Equipment (Right Col Top)
  const attacksY = middleY + 128;
  const attacksH = middleH - 128;
  drawCard(page, rightColX, attacksY, rightColW, attacksH, cCardBg, cBorder, 1);

  page.drawText('ОРУЖИЕ, АТАКИ И ЭКИПИРОВКА', {
    x: rightColX + 12,
    y: attacksY + attacksH - 16,
    size: 10,
    font,
    color: cCrimson,
  });

  const equipmentList =
    (character as unknown as { startingEquipment?: string[] }).startingEquipment ||
    getStartingEquipment(character.characterClass || 'fighter');

  let eqY = attacksY + attacksH - 32;
  const maxEqItems = 5;
  for (let i = 0; i < Math.min(equipmentList.length, maxEqItems); i++) {
    const item = equipmentList[i];
    page.drawText(`• ${item}`, {
      x: rightColX + 12,
      y: eqY,
      size: 8.5,
      font,
      color: cDarkText,
    });
    eqY -= 15;
  }

  // 3C. Origin Feats & 2024 Weapon Masteries (Right Col Bottom)
  const featY = middleY;
  const featH = 120;
  drawCard(page, rightColX, featY, rightColW, featH, cCardBg, cBorder, 1);

  page.drawText('ЧЕРТА ПРОИСХОЖДЕНИЯ И ПРИЕМЫ ОРУЖИЯ (2024)', {
    x: rightColX + 12,
    y: featY + featH - 16,
    size: 9.5,
    font,
    color: cCrimson,
  });

  const originFeat = character.originFeat || 'Savage Attacker';
  page.drawText(`Черта 1-го уровня: ${originFeat}`, {
    x: rightColX + 12,
    y: featY + featH - 34,
    size: 9,
    font,
    color: cDarkText,
  });

  const masteries =
    (character as unknown as { weaponMasteries?: string[] }).weaponMasteries ||
    getWeaponMasteries(character.characterClass || 'fighter');

  page.drawText('Владение свойствами оружия (Weapon Masteries 2024):', {
    x: rightColX + 12,
    y: featY + featH - 52,
    size: 8.5,
    font,
    color: cMutedText,
  });

  if (masteries && masteries.length > 0) {
    const masteriesText = masteries.join('  •  ');
    page.drawText(masteriesText, {
      x: rightColX + 12,
      y: featY + featH - 68,
      size: 8.5,
      font,
      color: cCrimson,
    });
  } else {
    page.drawText('Заклинатель (нет базовых оружейных приемов 2024 на 1 ур.)', {
      x: rightColX + 12,
      y: featY + featH - 68,
      size: 8.5,
      font,
      color: cMutedText,
    });
  }

  page.drawText(
    'Пассивная Внимательность (Passive Perception): ' +
      `${10 + calculateModifier(character.abilityScores?.wisdom ?? 10)}`,
    {
      x: rightColX + 12,
      y: featY + 14,
      size: 8.5,
      font,
      color: cDarkText,
    }
  );

  // ==========================================
  // 4. BOTTOM ROW (y: 36 to 375)
  // Left: Custom Mechanic (Make-Tech Balance Card) (width: 255)
  // Right: Narrative Backstory (width: 268)
  // ==========================================
  const bottomY = 36;
  const bottomH = 338;
  const bLeftW = 255;
  const bRightX = contentLeft + bLeftW + 10;
  const bRightW = contentWidth - bLeftW - 10;

  // 4A. Custom Mechanic (Balance Card)
  drawCard(page, contentLeft, bottomY, bLeftW, bottomH, cCardBg, cBorder, 1);

  page.drawText('ОСОБАЯ МЕХАНИКА (БАЛАНС-КАРТА)', {
    x: contentLeft + 12,
    y: bottomY + bottomH - 18,
    size: 9.5,
    font,
    color: cCrimson,
  });

  const cm = character.customMechanic;
  if (cm) {
    let curY = bottomY + bottomH - 36;

    // Title
    page.drawText(`Название: ${cm.title}`, {
      x: contentLeft + 12,
      y: curY,
      size: 9,
      font,
      color: cDarkText,
    });
    curY -= 16;

    // Trigger
    page.drawText(`Триггер: ${cm.trigger}`, {
      x: contentLeft + 12,
      y: curY,
      size: 8,
      font,
      color: cMutedText,
    });
    curY -= 18;

    // Effect
    page.drawText('Эффект:', {
      x: contentLeft + 12,
      y: curY,
      size: 8,
      font,
      color: cCrimson,
    });
    curY -= 12;

    const effectLines = wrapText(cm.effect, bLeftW - 24, font, 7.5);
    for (const line of effectLines.slice(0, 7)) {
      page.drawText(line, {
        x: contentLeft + 12,
        y: curY,
        size: 7.5,
        font,
        color: cDarkText,
      });
      curY -= 11;
    }
    curY -= 6;

    // Cost / Tradeoff
    page.drawText('Плата / Ограничение:', {
      x: contentLeft + 12,
      y: curY,
      size: 8,
      font,
      color: cCrimson,
    });
    curY -= 12;

    const costLines = wrapText(cm.costOrTradeoff, bLeftW - 24, font, 7.5);
    for (const line of costLines.slice(0, 5)) {
      page.drawText(line, {
        x: contentLeft + 12,
        y: curY,
        size: 7.5,
        font,
        color: cDarkText,
      });
      curY -= 11;
    }
    curY -= 6;

    // Rule Equivalent
    page.drawText(`Аналог правил 2024: ${cm.ruleEquivalent}`, {
      x: contentLeft + 12,
      y: bottomY + 12,
      size: 7.5,
      font,
      color: cMutedText,
    });
  } else {
    page.drawText('Стандартный балансный профиль D&D 2024.', {
      x: contentLeft + 12,
      y: bottomY + bottomH - 40,
      size: 8.5,
      font,
      color: cDarkText,
    });
    page.drawText('Особая механика отсутствует или не выбрана.', {
      x: contentLeft + 12,
      y: bottomY + bottomH - 58,
      size: 8,
      font,
      color: cMutedText,
    });
  }

  // 4B. Narrative Backstory Box
  drawCard(page, bRightX, bottomY, bRightW, bottomH, cCardBg, cBorder, 1);

  page.drawText('ПРЕДЫСТОРИЯ И ХАРАКТЕР ГЕРОЯ', {
    x: bRightX + 12,
    y: bottomY + bottomH - 18,
    size: 9.5,
    font,
    color: cCrimson,
  });

  const backstoryText =
    character.backstory ||
    'Герой только начинает свой путь в мире D&D 2024. ' +
      'Слухи о его деяниях еще не достигли таверн, но сталь его клинка и воля не вызывают сомнений.';

  const storyLines = wrapText(backstoryText, bRightW - 24, font, 8);
  let storyY = bottomY + bottomH - 36;
  const maxStoryLines = 24;

  for (let i = 0; i < Math.min(storyLines.length, maxStoryLines); i++) {
    const line = storyLines[i];
    page.drawText(line, {
      x: bRightX + 12,
      y: storyY,
      size: 8,
      font,
      color: cDarkText,
    });
    storyY -= 12;
  }

  // Bottom tiny stamp
  page.drawText(`Make-Tech D&D 2024 Generator • ${character.key || 'HERO'} • Лист персонажа`, {
    x: bRightX + 12,
    y: bottomY + 10,
    size: 7,
    font,
    color: cMutedText,
  });

  return await pdfDoc.save();
}
