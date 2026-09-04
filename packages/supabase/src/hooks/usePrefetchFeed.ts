import { homeQueryKeys, fetchHomeFeaturedSeries, fetchTrendingSeries } from '../queries/home';
import { creatorQueryKeys, fetchCreatorHubPosts, fetchFeaturedCreators } from '../queries/creators';
import { profileQueryKeys, fetchUserNotifications } from '../queries/profile';

export interface QueryClientLike {
  prefetchQuery(options: {
    queryKey: readonly unknown[];
    queryFn: () => Promise<unknown>;
    staleTime?: number;
  }): Promise<void> | Promise<unknown>;
}

export interface PrefetchFeedOptions {
  userId?: string;
  staleTime?: number;
}

/**
 * Prefetches Home Feed, Creator Hub, and Notifications into React Query cache immediately after login.
 * Guarantees zero loading spinners when switching to Home, Creator Hub, or Alerts.
 */
export async function prefetchUserFeeds(
  queryClient: QueryClientLike,
  options?: PrefetchFeedOptions
): Promise<void> {
  const staleTime = options?.staleTime || 1000 * 60 * 5; // 5 minutes fresh cache

  try {
    const prefetchPromises: (Promise<void> | Promise<unknown>)[] = [
      // 1. Home Feed (Featured & Trending)
      queryClient.prefetchQuery({
        queryKey: homeQueryKeys.featured(),
        queryFn: () => fetchHomeFeaturedSeries(5),
        staleTime,
      }),
      queryClient.prefetchQuery({
        queryKey: homeQueryKeys.trending(),
        queryFn: () => fetchTrendingSeries(undefined, 10),
        staleTime,
      }),

      // 2. Creator Hub Feed & Featured Creators
      queryClient.prefetchQuery({
        queryKey: creatorQueryKeys.posts('all'),
        queryFn: () => fetchCreatorHubPosts(20),
        staleTime,
      }),
      queryClient.prefetchQuery({
        queryKey: creatorQueryKeys.featured(),
        queryFn: () => fetchFeaturedCreators(6),
        staleTime,
      }),
    ];

    // 3. User Notifications if authenticated
    if (options?.userId) {
      prefetchPromises.push(
        queryClient.prefetchQuery({
          queryKey: profileQueryKeys.notifications(options.userId),
          queryFn: () => fetchUserNotifications(options.userId!, 30),
          staleTime,
        })
      );
    }

    // Execute concurrently
    await Promise.all(prefetchPromises);
  } catch (error) {
    // Non-blocking background prefetch error swallow
    console.warn('[usePrefetchFeed] Background prefetch completed with warning:', error);
  }
}
