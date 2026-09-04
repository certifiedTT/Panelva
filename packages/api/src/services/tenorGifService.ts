export interface TenorGifItem {
  id: string;
  title: string;
  url: string;
  previewUrl: string;
  width: number;
  height: number;
  provider: "Tenor";
}

// Curated high quality GIF fallbacks for instant response and offline test stability
const FALLBACK_GIFS: TenorGifItem[] = [
  {
    id: "tenor-anime-sparkle-1",
    title: "Anime Sparkle Joy",
    url: "https://images.unsplash.com/photo-1534447677768-be436bb09401?w=400&auto=format&fit=crop&q=80",
    previewUrl: "https://images.unsplash.com/photo-1534447677768-be436bb09401?w=200&auto=format&fit=crop&q=80",
    width: 320,
    height: 240,
    provider: "Tenor",
  },
  {
    id: "tenor-hyped-flame-2",
    title: "Hype Flame Burst",
    url: "https://images.unsplash.com/photo-1579783902614-a3fb3927b675?w=400&auto=format&fit=crop&q=80",
    previewUrl: "https://images.unsplash.com/photo-1579783902614-a3fb3927b675?w=200&auto=format&fit=crop&q=80",
    width: 320,
    height: 240,
    provider: "Tenor",
  },
  {
    id: "tenor-plot-twist-3",
    title: "Shocked Reaction",
    url: "https://images.unsplash.com/photo-1509198397868-475647b2a1e5?w=400&auto=format&fit=crop&q=80",
    previewUrl: "https://images.unsplash.com/photo-1509198397868-475647b2a1e5?w=200&auto=format&fit=crop&q=80",
    width: 320,
    height: 240,
    provider: "Tenor",
  },
  {
    id: "tenor-applause-4",
    title: "Standing Ovation",
    url: "https://images.unsplash.com/photo-1492684223066-81342ee5ff30?w=400&auto=format&fit=crop&q=80",
    previewUrl: "https://images.unsplash.com/photo-1492684223066-81342ee5ff30?w=200&auto=format&fit=crop&q=80",
    width: 320,
    height: 240,
    provider: "Tenor",
  },
  {
    id: "tenor-heart-5",
    title: "Love Wholesome Heart",
    url: "https://images.unsplash.com/photo-1518199266791-5375a83190b7?w=400&auto=format&fit=crop&q=80",
    previewUrl: "https://images.unsplash.com/photo-1518199266791-5375a83190b7?w=200&auto=format&fit=crop&q=80",
    width: 320,
    height: 240,
    provider: "Tenor",
  },
  {
    id: "tenor-dead-laugh-6",
    title: "Laughing Dead",
    url: "https://images.unsplash.com/photo-1517841905240-472988babdf9?w=400&auto=format&fit=crop&q=80",
    previewUrl: "https://images.unsplash.com/photo-1517841905240-472988babdf9?w=200&auto=format&fit=crop&q=80",
    width: 320,
    height: 240,
    provider: "Tenor",
  },
];

export const TenorGifService = {
  async getTrending(limit = 20): Promise<TenorGifItem[]> {
    const apiKey = process.env.TENOR_API_KEY;
    if (!apiKey) {
      return FALLBACK_GIFS.slice(0, limit);
    }

    try {
      const response = await fetch(
        `https://tenor.googleapis.com/v2/featured?key=${apiKey}&limit=${limit}&media_filter=gif,tinygif`
      );
      if (!response.ok) return FALLBACK_GIFS.slice(0, limit);

      const data = await response.json();
      return (data.results || []).map((r: any) => ({
        id: r.id,
        title: r.content_description || "GIF",
        url: r.media_formats?.gif?.url || r.media_formats?.tinygif?.url,
        previewUrl: r.media_formats?.tinygif?.url || r.media_formats?.gif?.url,
        width: r.media_formats?.gif?.dims?.[0] || 320,
        height: r.media_formats?.gif?.dims?.[1] || 240,
        provider: "Tenor" as const,
      }));
    } catch {
      return FALLBACK_GIFS.slice(0, limit);
    }
  },

  async search(query: string, limit = 20): Promise<TenorGifItem[]> {
    if (!query || !query.trim()) {
      return this.getTrending(limit);
    }

    const apiKey = process.env.TENOR_API_KEY;
    if (!apiKey) {
      const q = query.toLowerCase();
      const filtered = FALLBACK_GIFS.filter(
        (g) => g.title.toLowerCase().includes(q) || g.id.toLowerCase().includes(q)
      );
      return filtered.length > 0 ? filtered : FALLBACK_GIFS.slice(0, limit);
    }

    try {
      const response = await fetch(
        `https://tenor.googleapis.com/v2/search?q=${encodeURIComponent(
          query
        )}&key=${apiKey}&limit=${limit}&media_filter=gif,tinygif`
      );
      if (!response.ok) {
        return FALLBACK_GIFS.filter((g) =>
          g.title.toLowerCase().includes(query.toLowerCase())
        );
      }

      const data = await response.json();
      return (data.results || []).map((r: any) => ({
        id: r.id,
        title: r.content_description || "GIF",
        url: r.media_formats?.gif?.url || r.media_formats?.tinygif?.url,
        previewUrl: r.media_formats?.tinygif?.url || r.media_formats?.gif?.url,
        width: r.media_formats?.gif?.dims?.[0] || 320,
        height: r.media_formats?.gif?.dims?.[1] || 240,
        provider: "Tenor" as const,
      }));
    } catch {
      return FALLBACK_GIFS.slice(0, limit);
    }
  },

  getById(id: string): TenorGifItem | undefined {
    return FALLBACK_GIFS.find((g) => g.id === id);
  },
};
