/**
 * Natural Hierarchical Chapter Sorting Utilities
 * 
 * Supports flexible numbering schemes:
 * - Pure numbers: "1", "2", "10"
 * - Sub-chapters: "0.5", "1.2", "2.5", "3.1", "3.1.5", "3.1.5.1"
 * - Special chapters: "Prologue", "Chapter 0", "Special", "Special 1", "Extra 1", "Epilogue"
 */

export function generateChapterSortKey(inputNumber: string): string {
  if (!inputNumber || typeof inputNumber !== 'string') {
    return '000001.000000.000000.000000';
  }

  const trimmed = inputNumber.trim().toLowerCase();

  // 1. Handle special keywords
  if (trimmed === 'prologue' || trimmed === 'chapter 0' || trimmed === 'ch. 0' || trimmed === 'ch 0' || trimmed === '0') {
    return '000000.000000.000000.000000';
  }

  if (trimmed === 'epilogue' || trimmed === 'afterword') {
    return '999999.000000.000000.000000';
  }

  if (trimmed.startsWith('special') || trimmed.startsWith('extra') || trimmed.startsWith('side story')) {
    // Extract any number after the special/extra keyword
    const numMatch = trimmed.match(/\d+(\.\d+)*/);
    if (numMatch) {
      const parts = numMatch[0].split('.').map(p => parseInt(p, 10) || 0);
      const p1 = String(parts[0] || 0).padStart(6, '0');
      const p2 = String(parts[1] || 0).padStart(6, '0');
      const p3 = String(parts[2] || 0).padStart(6, '0');
      const p4 = String(parts[3] || 0).padStart(6, '0');
      return `990000.${p1}.${p2}.${p3}.${p4}`;
    }
    return '990000.000000.000000.000000';
  }

  // 2. Extract numeric segments (e.g. "Chapter 3.1.5.1" -> "3.1.5.1")
  const cleaned = trimmed.replace(/^(chapter|ch\.|ch)\s*/i, '').trim();
  const numericMatch = cleaned.match(/\d+(\.\d+)*/);

  if (!numericMatch) {
    // Non-numeric custom title fallback - place after regular chapters
    return '900000.000000.000000.000000';
  }

  const segments = numericMatch[0].split('.').map(s => {
    const parsed = parseInt(s, 10);
    return isNaN(parsed) ? 0 : parsed;
  });

  const paddedSegments: string[] = [];
  for (let i = 0; i < 4; i++) {
    const val = segments[i] !== undefined ? segments[i] : 0;
    paddedSegments.push(String(val).padStart(6, '0'));
  }

  return paddedSegments.join('.');
}

/**
 * Format chapter title for display:
 * - If displayNumber is "3.1.5" and title is "Reunion" => "Chapter 3.1.5: Reunion"
 * - If displayNumber is "Prologue" and title is "Reunion" => "Prologue: Reunion"
 * - If displayNumber is "Chapter 0" and title is "The Beginning" => "Chapter 0: The Beginning"
 * - If title is empty => "Chapter 3.1.5" or "Prologue"
 */
export function formatChapterDisplayTitle(displayNumber: string, title?: string | null): string {
  const rawNum = (displayNumber || '1').trim();
  const subTitle = (title || '').trim();

  let prefix = rawNum;
  // If rawNum doesn't start with Chapter/Prologue/Epilogue/Special/Extra, add "Chapter "
  const lower = rawNum.toLowerCase();
  if (
    !lower.startsWith('chapter') &&
    !lower.startsWith('ch.') &&
    !lower.startsWith('ch ') &&
    !lower.startsWith('prologue') &&
    !lower.startsWith('epilogue') &&
    !lower.startsWith('special') &&
    !lower.startsWith('extra') &&
    !lower.startsWith('side story')
  ) {
    prefix = `Chapter ${rawNum}`;
  } else {
    // Capitalize first letter properly
    prefix = rawNum.charAt(0).toUpperCase() + rawNum.slice(1);
  }

  if (subTitle) {
    return `${prefix}: ${subTitle}`;
  }
  return prefix;
}
