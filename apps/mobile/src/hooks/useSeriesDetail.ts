import { useState, useEffect, useCallback, useMemo } from 'react';
import { trpc } from '../../lib/trpc';
import { Series, Chapter, Creator, EarlyAccessSchedule, UseSeriesDetailResult } from '../types';
import { MOCK_PLATFORM_SERIES, MOCK_CHAPTERS_SERIES_1, MOCK_CHAPTERS_NOVEL_1 } from '../data/mockData';

const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

/**
 * Compute the Early Access Schedule for a given publication timestamp.
 * Premium: 0h (Immediate)
 * Plus: +2h
 * Free: +4h
 */
export function computeEarlyAccessSchedule(publishedAtInput: string | Date | null | undefined): EarlyAccessSchedule {
  const pub = publishedAtInput ? new Date(publishedAtInput) : new Date();
  const validPub = isNaN(pub.getTime()) ? new Date() : pub;
  const now = Date.now();
  const pubTime = validPub.getTime();

  const premiumAccessAt = new Date(pubTime);
  const plusAccessAt = new Date(pubTime + 2 * 60 * 60 * 1000);
  const freeAccessAt = new Date(pubTime + 4 * 60 * 60 * 1000);

  const isEarlyAccessActive = now < freeAccessAt.getTime();
  const isPlusAvailable = now >= plusAccessAt.getTime();
  const isFreeAvailable = now >= freeAccessAt.getTime();

  const timeUntilPlusMs = Math.max(0, plusAccessAt.getTime() - now);
  const timeUntilFreeMs = Math.max(0, freeAccessAt.getTime() - now);

  const formatWait = (ms: number) => {
    if (ms <= 0) return 'Available now';
    const totalMinutes = Math.ceil(ms / (1000 * 60));
    const hours = Math.floor(totalMinutes / 60);
    const mins = totalMinutes % 60;
    if (hours > 0 && mins > 0) return `${hours}h ${mins}m`;
    if (hours > 0) return `${hours}h`;
    return `${mins}m`;
  };

  return {
    publishedAt: validPub,
    premiumAccessAt,
    plusAccessAt,
    freeAccessAt,
    isEarlyAccessActive,
    isPlusAvailable,
    isFreeAvailable,
    timeUntilPlusMs,
    timeUntilFreeMs,
    plusWaitFormatted: formatWait(timeUntilPlusMs),
    freeWaitFormatted: formatWait(timeUntilFreeMs),
    freeAccessTimeFormatted: freeAccessAt.toLocaleTimeString(undefined, {
      hour: 'numeric',
      minute: '2-digit',
    }),
  };
}

/**
 * Pure normalization function for chapter lists.
 * ALWAYS returns a valid Chapter[] array regardless of malformed inputs.
 */
export function normalizeChaptersList(rawChaptersInput: unknown): Chapter[] {
  if (!rawChaptersInput) {
    return [];
  }

  // Handle cases where raw input might be nested in an object (e.g., { chapters: [...] } or { chaptersList: [...] })
  let rawList: unknown = rawChaptersInput;
  if (typeof rawChaptersInput === 'object' && rawChaptersInput !== null && !Array.isArray(rawChaptersInput)) {
    const obj = rawChaptersInput as Record<string, unknown>;
    if (Array.isArray(obj.chapters)) {
      rawList = obj.chapters;
    } else if (Array.isArray(obj.chaptersList)) {
      rawList = obj.chaptersList;
    } else if (Array.isArray(obj.data)) {
      rawList = obj.data;
    } else if (Array.isArray(obj.items)) {
      rawList = obj.items;
    } else {
      return [];
    }
  }

  if (!Array.isArray(rawList)) {
    return [];
  }

  return rawList.map((ch, index) => {
    if (!ch || typeof ch !== 'object') {
      const idx = index + 1;
      const createdAt = new Date().toISOString();
      const earlyAccess = computeEarlyAccessSchedule(createdAt);
      return {
        id: `ch-fallback-${idx}`,
        chapterIndex: idx,
        title: `Chapter ${idx}`,
        subtitle: null,
        tier: 'FREE',
        isLocked: false,
        isEarlyAccess: earlyAccess.isEarlyAccessActive,
        earlyAccess,
        pages: [],
        textContent: null,
        createdAt,
        views: 0,
        likes: 0,
      };
    }

    const c = ch as Record<string, any>;
    const chapterIndex = typeof c.chapterIndex === 'number' && !isNaN(c.chapterIndex)
      ? c.chapterIndex
      : typeof c.index === 'number' && !isNaN(c.index)
      ? c.index
      : index + 1;

    const id = typeof c.id === 'string' && c.id.trim().length > 0
      ? c.id
      : `ch-${chapterIndex}-${index}`;

    const title = typeof c.title === 'string' && c.title.trim().length > 0
      ? c.title
      : `Chapter ${chapterIndex}`;

    const rawTier = typeof c.tier === 'string' ? c.tier.toUpperCase() : 'FREE';
    const tier = rawTier === 'PREMIUM' || rawTier === 'AD_SUPPORTED' ? rawTier : 'FREE';
    const isLocked = typeof c.isLocked === 'boolean'
      ? c.isLocked
      : typeof c.locked === 'boolean'
      ? c.locked
      : tier !== 'FREE';

    const pages = Array.isArray(c.pages)
      ? c.pages.filter((p: any) => typeof p === 'string')
      : [];

    const textContent = typeof c.textContent === 'string'
      ? c.textContent
      : typeof c.content === 'string'
      ? c.content
      : null;

    const createdAt = typeof c.createdAt === 'string' || c.createdAt instanceof Date
      ? c.createdAt
      : new Date().toISOString();

    const earlyAccess = c.earlyAccess || computeEarlyAccessSchedule(createdAt);
    const isEarlyAccess = typeof c.isEarlyAccess === 'boolean' ? c.isEarlyAccess : earlyAccess.isEarlyAccessActive;

    return {
      ...c,
      id,
      chapterIndex,
      title,
      subtitle: typeof c.subtitle === 'string' ? c.subtitle : null,
      tier,
      isLocked,
      isEarlyAccess,
      earlyAccess,
      pages,
      textContent,
      createdAt,
      views: typeof c.views === 'number' ? c.views : 0,
      likes: typeof c.likes === 'number' ? c.likes : 0,
      commentCount: typeof c.commentCount === 'number' ? c.commentCount : 0,
    };
  });
}

/**
 * Pure normalization function for creator object.
 */
export function normalizeCreator(rawCreator: unknown): Creator | null {
  if (!rawCreator || typeof rawCreator !== 'object') {
    return null;
  }

  const c = rawCreator as Record<string, any>;
  const penName = typeof c.penName === 'string' && c.penName.trim().length > 0
    ? c.penName
    : typeof c.name === 'string' && c.name.trim().length > 0
    ? c.name
    : typeof c.author === 'string' && c.author.trim().length > 0
    ? c.author
    : 'Creator';

  return {
    ...c,
    id: typeof c.id === 'string' ? c.id : 'creator-default',
    penName,
    bio: typeof c.bio === 'string' ? c.bio : null,
    avatarUrl: typeof c.avatarUrl === 'string' ? c.avatarUrl : c.user?.avatarUrl || null,
    isVetted: !!c.isVetted,
    user: c.user && typeof c.user === 'object' ? {
      id: c.user.id,
      username: c.user.username || penName,
      avatarUrl: c.user.avatarUrl || null,
    } : null,
  };
}

/**
 * Pure normalization function for entire series API response.
 * Resilient against null, undefined, invalid shapes, unexpected schemas.
 */
export function normalizeSeriesResponse(rawResponse: unknown): {
  series: Series | null;
  chapters: Chapter[];
  creator: Creator | null;
} {
  if (!rawResponse || typeof rawResponse !== 'object') {
    return {
      series: null,
      chapters: [],
      creator: null,
    };
  }

  const raw = rawResponse as Record<string, any>;

  // Handle nested data wrappers (e.g. { data: { series: ... } } or { series: ... })
  const s = (raw.data && typeof raw.data === 'object' && !Array.isArray(raw.data))
    ? raw.data
    : (raw.series && typeof raw.series === 'object' && !Array.isArray(raw.series))
    ? raw.series
    : raw;

  if (!s || typeof s !== 'object') {
    return { series: null, chapters: [], creator: null };
  }

  // Extract chapters safely
  const rawChapters = s.chapters || s.chaptersList || raw.chapters || raw.chaptersList || [];
  const chapters = normalizeChaptersList(rawChapters);

  // Extract creator safely
  const rawCreator = s.creator || raw.creator || (s.author ? { penName: s.author, id: s.creatorId } : null);
  const creator = normalizeCreator(rawCreator);

  const id = typeof s.id === 'string' && s.id.trim().length > 0 ? s.id : 'series-unknown';
  const title = typeof s.title === 'string' && s.title.trim().length > 0 ? s.title : 'Untitled Series';
  const rawType = typeof s.type === 'string' ? s.type.toUpperCase() : 'COMIC';
  const type = rawType === 'NOVEL' ? 'NOVEL' : rawType === 'MANHWA' ? 'MANHWA' : 'COMIC';

  const createdAt = typeof s.createdAt === 'string' || s.createdAt instanceof Date ? s.createdAt : new Date().toISOString();
  const seriesEarlyAccess = s.earlyAccess || computeEarlyAccessSchedule(createdAt);
  const isEarlyAccess = typeof s.isEarlyAccess === 'boolean' ? s.isEarlyAccess : seriesEarlyAccess.isEarlyAccessActive;

  const series: Series = {
    ...s,
    id,
    title,
    description: typeof s.description === 'string' ? s.description : s.synopsis || s.quote || '',
    synopsis: typeof s.synopsis === 'string' ? s.synopsis : s.description || s.quote || '',
    quote: typeof s.quote === 'string' ? s.quote : null,
    coverUrl: typeof s.coverUrl === 'string' ? s.coverUrl : null,
    coverBg: typeof s.coverBg === 'string' ? s.coverBg : '#1A1A2E',
    rating: s.rating !== undefined && s.rating !== null ? String(s.rating) : '9.8',
    genre: typeof s.genre === 'string' && s.genre.trim().length > 0 ? s.genre : 'General',
    type,
    views: s.views !== undefined && s.views !== null ? s.views : '0',
    likes: typeof s.likes === 'number' ? s.likes : 0,
    status: typeof s.status === 'string' ? s.status : 'Ongoing',
    statusMessage: typeof s.statusMessage === 'string' ? s.statusMessage : null,
    statusUpdatedAt: s.statusUpdatedAt || null,
    author: creator?.penName || s.author || 'Creator',
    creatorId: creator?.id || s.creatorId || null,
    creator,
    chapters,
    isEarlyAccess,
    earlyAccess: seriesEarlyAccess,
    linkedSeriesId: typeof s.linkedSeriesId === 'string' ? s.linkedSeriesId : null,
    linkedSeries: s.linkedSeries && typeof s.linkedSeries === 'object'
      ? normalizeSeriesResponse(s.linkedSeries).series
      : null,
    createdAt,
  };

  return {
    series,
    chapters,
    creator,
  };
}

// In-memory cache for series details to prevent duplicate network calls
const seriesDetailCache = new Map<string, { data: { series: Series | null; chapters: Chapter[]; creator: Creator | null }; timestamp: number }>();
const CACHE_TTL_MS = 60 * 1000; // 1 minute

/**
 * Custom hook to safely fetch, cache, and normalize series details.
 * Prevents ReaderScreen crashes by ensuring chapters is ALWAYS a Chapter[].
 */
export function useSeriesDetail(seriesIdInput: string | null | undefined): UseSeriesDetailResult {
  const seriesId = seriesIdInput || 's-1';
  const isUuid = UUID_REGEX.test(seriesId);

  const [state, setState] = useState<{
    series: Series | null;
    chapters: Chapter[];
    creator: Creator | null;
    isLoading: boolean;
    error: Error | null;
  }>(() => {
    // Check cache on initial mount
    const cached = seriesDetailCache.get(seriesId);
    if (cached && Date.now() - cached.timestamp < CACHE_TTL_MS) {
      return {
        ...cached.data,
        isLoading: false,
        error: null,
      };
    }

    return {
      series: null,
      chapters: [],
      creator: null,
      isLoading: true,
      error: null,
    };
  });

  // Query TRPC backend if ID is a valid UUID
  const {
    data: trpcData,
    isLoading: isTrpcLoading,
    error: trpcError,
    refetch: trpcRefetch,
  } = (trpc.series.getById as any).useQuery(
    { id: seriesId },
    {
      enabled: isUuid,
      retry: 1,
      staleTime: 300000, // 5 mins
    }
  );

  // Sync TRPC query results or Fallback to Mock Data
  useEffect(() => {
    if (isUuid) {
      if (isTrpcLoading) {
        setState((prev) => ({ ...prev, isLoading: true, error: null }));
        return;
      }

      if (trpcError) {
        // Fallback to local mock data matching or general fallback
        const mockFallback = MOCK_PLATFORM_SERIES[0];
        const normalized = normalizeSeriesResponse(mockFallback);
        setState({
          series: normalized.series,
          chapters: normalized.chapters,
          creator: normalized.creator,
          isLoading: false,
          error: new Error(trpcError.message || 'Failed to load series details'),
        });
        return;
      }

      if (trpcData) {
        const normalized = normalizeSeriesResponse(trpcData);
        seriesDetailCache.set(seriesId, { data: normalized, timestamp: Date.now() });
        setState({
          series: normalized.series,
          chapters: normalized.chapters,
          creator: normalized.creator,
          isLoading: false,
          error: null,
        });
        return;
      }
      // Non-UUID: Resolve immediately from local Mock platform data
      const mockMatch = MOCK_PLATFORM_SERIES.find((s) => s.id === seriesId) || MOCK_PLATFORM_SERIES[0];
      const normalized = normalizeSeriesResponse(mockMatch);

      // Resolve linked mock series if configured
      if (mockMatch.linkedSeriesId && !normalized.series?.linkedSeries) {
        const linkedMock = MOCK_PLATFORM_SERIES.find((s) => s.id === mockMatch.linkedSeriesId);
        if (linkedMock && normalized.series) {
          const normalizedLinked = normalizeSeriesResponse(linkedMock);
          normalized.series.linkedSeries = normalizedLinked.series;
        }
      }

      // If mock chapters need to be merged
      if (normalized.chapters.length === 0) {
        if (mockMatch.type === 'NOVEL') {
          normalized.chapters = normalizeChaptersList(MOCK_CHAPTERS_NOVEL_1);
        } else {
          normalized.chapters = normalizeChaptersList(MOCK_CHAPTERS_SERIES_1);
        }
      }

      seriesDetailCache.set(seriesId, { data: normalized, timestamp: Date.now() });
      setState({
        series: normalized.series,
        chapters: normalized.chapters,
        creator: normalized.creator,
        isLoading: false,
        error: null,
      });
    }
  }, [seriesId, isUuid, trpcData, isTrpcLoading, trpcError]);

  const refetch = useCallback(async () => {
    seriesDetailCache.delete(seriesId);
    setState((prev) => ({ ...prev, isLoading: true, error: null }));
    if (isUuid) {
      await trpcRefetch();
    } else {
      const mockMatch = MOCK_PLATFORM_SERIES.find((s) => s.id === seriesId) || MOCK_PLATFORM_SERIES[0];
      const normalized = normalizeSeriesResponse(mockMatch);
      setState({
        series: normalized.series,
        chapters: normalized.chapters,
        creator: normalized.creator,
        isLoading: false,
        error: null,
      });
    }
  }, [seriesId, isUuid, trpcRefetch]);

  return {
    series: state.series,
    chapters: state.chapters,
    creator: state.creator,
    isLoading: state.isLoading,
    error: state.error,
    refetch,
  };
}
