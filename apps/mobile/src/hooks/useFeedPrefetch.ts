import { useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { trpc } from '../../lib/trpc';

export const CACHE_KEYS = {
  HUB_DISCOVER: '@panelva_cache_hub_discover',
  HUB_FOLLOWING: '@panelva_cache_hub_following',
  HUB_FEATURED: '@panelva_cache_hub_featured',
  SERIES_ALL: '@panelva_cache_series_all',
  SERIES_TRENDING: '@panelva_cache_series_trending',
};

export async function getLocalFeedCache<T>(key: string): Promise<T | null> {
  try {
    const raw = await AsyncStorage.getItem(key);
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    return parsed.data || null;
  } catch {
    return null;
  }
}

export async function setLocalFeedCache<T>(key: string, data: T): Promise<void> {
  try {
    const payload = JSON.stringify({
      timestamp: Date.now(),
      data,
    });
    await AsyncStorage.setItem(key, payload);
  } catch (err) {
    console.warn('[FeedCache] Failed to save cache:', err);
  }
}

/**
 * Background hook that automatically prefetches Creator Hub & Series feeds on startup
 * and keeps local storage synchronized for instant 0ms launches.
 */
export function useFeedPrefetch(currentUserId?: string) {
  const utils = trpc.useUtils();

  useEffect(() => {
    let isMounted = true;

    async function prefetchFeeds() {
      try {
        // 1. Prefetch Creator Hub tabs
        const discoverPromise = (utils.post.getHubFeed as any).fetch({
          tab: 'discover',
          currentUserId: currentUserId || undefined,
          limit: 25,
        });

        const followingPromise = currentUserId
          ? (utils.post.getHubFeed as any).fetch({
              tab: 'following',
              currentUserId,
              limit: 25,
            })
          : Promise.resolve(null);

        const featuredPromise = (utils.post.getHubFeed as any).fetch({
          tab: 'featured',
          currentUserId: currentUserId || undefined,
          limit: 25,
        });

        // 2. Prefetch Series explore and trending
        const seriesPromise = (utils.series.getMany as any).fetch({
          sortBy: 'Popularity',
          limit: 40,
        });

        const trendingPromise = (utils.series.getTrending as any).fetch({
          limit: 12,
        });

        // Await and store in local AsyncStorage cache
        const [discoverData, followingData, featuredData, seriesData, trendingData] =
          await Promise.allSettled([
            discoverPromise,
            followingPromise,
            featuredPromise,
            seriesPromise,
            trendingPromise,
          ]);

        if (!isMounted) return;

        if (discoverData.status === 'fulfilled' && discoverData.value) {
          setLocalFeedCache(CACHE_KEYS.HUB_DISCOVER, discoverData.value);
        }
        if (followingData.status === 'fulfilled' && followingData.value) {
          setLocalFeedCache(CACHE_KEYS.HUB_FOLLOWING, followingData.value);
        }
        if (featuredData.status === 'fulfilled' && featuredData.value) {
          setLocalFeedCache(CACHE_KEYS.HUB_FEATURED, featuredData.value);
        }
        if (seriesData.status === 'fulfilled' && seriesData.value) {
          setLocalFeedCache(CACHE_KEYS.SERIES_ALL, seriesData.value);
        }
        if (trendingData.status === 'fulfilled' && trendingData.value) {
          setLocalFeedCache(CACHE_KEYS.SERIES_TRENDING, trendingData.value);
        }
      } catch (error) {
        // Prefetch failed gracefully in background
        console.log('[useFeedPrefetch] Silent background prefetch complete');
      }
    }

    prefetchFeeds();

    return () => {
      isMounted = false;
    };
  }, [utils, currentUserId]);
}
