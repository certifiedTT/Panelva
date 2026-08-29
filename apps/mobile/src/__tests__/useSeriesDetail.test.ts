import { describe, it, expect } from 'vitest';
import {
  normalizeChaptersList,
  normalizeCreator,
  normalizeSeriesResponse,
} from '../hooks/useSeriesDetail';

describe('Data Normalization & useSeriesDetail Resilience', () => {
  describe('normalizeChaptersList', () => {
    it('should return empty array for null, undefined, boolean, string, or invalid primitives', () => {
      expect(normalizeChaptersList(null)).toEqual([]);
      expect(normalizeChaptersList(undefined)).toEqual([]);
      expect(normalizeChaptersList(false)).toEqual([]);
      expect(normalizeChaptersList(12345)).toEqual([]);
      expect(normalizeChaptersList('invalid string')).toEqual([]);
    });

    it('should normalize nested chapters object structures (e.g. { chapters: [...] })', () => {
      const nested = {
        chapters: [
          { id: 'ch-1', chapterIndex: 1, title: 'Prologue', tier: 'FREE' },
        ],
      };
      const result = normalizeChaptersList(nested);
      expect(Array.isArray(result)).toBe(true);
      expect(result.length).toBe(1);
      expect(result[0].id).toBe('ch-1');
      expect(result[0].title).toBe('Prologue');
      expect(result[0].tier).toBe('FREE');
      expect(result[0].isLocked).toBe(false);
    });

    it('should normalize nested chaptersList object structures (e.g. { chaptersList: [...] })', () => {
      const nested = {
        chaptersList: [
          { id: 'ch-2', chapterIndex: 2, title: 'Episode 2', tier: 'PREMIUM' },
        ],
      };
      const result = normalizeChaptersList(nested);
      expect(Array.isArray(result)).toBe(true);
      expect(result.length).toBe(1);
      expect(result[0].tier).toBe('PREMIUM');
      expect(result[0].isLocked).toBe(true);
    });

    it('should handle malformed array items with robust fallbacks', () => {
      const malformedList = [
        null,
        undefined,
        'string-chapter',
        { title: 'Only Title' },
        { chapterIndex: 5 },
      ];
      const result = normalizeChaptersList(malformedList);
      expect(Array.isArray(result)).toBe(true);
      expect(result.length).toBe(5);

      // Null item fallback
      expect(result[0].id).toBe('ch-fallback-1');
      expect(result[0].title).toBe('Chapter 1');
      expect(result[0].tier).toBe('FREE');

      // Partial item with only title
      expect(result[3].title).toBe('Only Title');
      expect(result[3].chapterIndex).toBe(4);

      // Partial item with only index
      expect(result[4].chapterIndex).toBe(5);
      expect(result[4].title).toBe('Chapter 5');
    });

    it('should never fail .find(), .map(), or .length on normalized result', () => {
      const result = normalizeChaptersList(null);
      expect(() => result.find((c) => c.chapterIndex === 1)).not.toThrow();
      expect(() => result.map((c) => c.title)).not.toThrow();
      expect(result.length).toBe(0);
    });
  });

  describe('normalizeCreator', () => {
    it('should return null for non-object creator', () => {
      expect(normalizeCreator(null)).toBeNull();
      expect(normalizeCreator(undefined)).toBeNull();
      expect(normalizeCreator('author')).toBeNull();
    });

    it('should normalize creator with missing properties', () => {
      const result = normalizeCreator({ penName: 'LunaBlade' });
      expect(result).not.toBeNull();
      expect(result?.penName).toBe('LunaBlade');
      expect(result?.id).toBe('creator-default');
      expect(result?.isVetted).toBe(false);
    });

    it('should fallback to name or author if penName missing', () => {
      const result1 = normalizeCreator({ name: 'StudioSpectre' });
      expect(result1?.penName).toBe('StudioSpectre');

      const result2 = normalizeCreator({ author: 'DuchessPen' });
      expect(result2?.penName).toBe('DuchessPen');
    });
  });

  describe('normalizeSeriesResponse', () => {
    it('should return safe null-state object for null or undefined response', () => {
      const result = normalizeSeriesResponse(null);
      expect(result.series).toBeNull();
      expect(result.chapters).toEqual([]);
      expect(result.creator).toBeNull();
    });

    it('should handle unnested and nested series shapes', () => {
      const raw = {
        id: 'series-uuid-1',
        title: 'Shadow City: Neon Blade',
        type: 'COMIC',
        genre: 'Action',
        views: 120000,
        chapters: [
          { id: 'ch-1', chapterIndex: 1, title: 'Awakening', tier: 'FREE' },
          { id: 'ch-2', chapterIndex: 2, title: 'Underground', tier: 'PREMIUM' },
        ],
        creator: {
          id: 'cr-1',
          penName: 'LunaBlade',
          isVetted: true,
        },
      };

      const result = normalizeSeriesResponse(raw);
      expect(result.series).not.toBeNull();
      expect(result.series?.title).toBe('Shadow City: Neon Blade');
      expect(result.series?.type).toBe('COMIC');
      expect(result.series?.isHot).toBe(true);
      expect(result.chapters.length).toBe(2);
      expect(result.creator?.penName).toBe('LunaBlade');
      expect(result.creator?.isVetted).toBe(true);
    });

    it('should guarantee chapters is always an array even if chapters is null in raw object', () => {
      const rawWithNullChapters = {
        id: 'series-uuid-2',
        title: 'Archmage Curriculum',
        chapters: null,
      };

      const result = normalizeSeriesResponse(rawWithNullChapters);
      expect(Array.isArray(result.chapters)).toBe(true);
      expect(result.chapters.length).toBe(0);
      expect(result.series?.chapters).toEqual([]);
      expect(() => result.chapters.find((c) => c.chapterIndex === 1)).not.toThrow();
    });

    it('should handle wrapped { data: { ... } } responses', () => {
      const wrapped = {
        data: {
          id: 'series-uuid-3',
          title: 'Born to be Grand Duchess',
          type: 'NOVEL',
          chaptersList: [
            { id: 'ch-101', chapterIndex: 1, title: 'Rebirth', tier: 'FREE' },
          ],
        },
      };

      const result = normalizeSeriesResponse(wrapped);
      expect(result.series?.title).toBe('Born to be Grand Duchess');
      expect(result.series?.type).toBe('NOVEL');
      expect(result.chapters.length).toBe(1);
      expect(result.chapters[0].title).toBe('Rebirth');
    });
  });
});
