import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TextInput, TouchableOpacity, ActivityIndicator } from 'react-native';
import { Image as ExpoImage } from 'expo-image';
import { Search, Flame, Heart, X } from 'lucide-react-native';
import { radius, spacing } from '@panelva/theme';
import { trpc } from '../../../../lib/trpc';

export interface GifItem {
  id: string;
  title: string;
  url: string;
  previewUrl: string;
  provider: 'Tenor';
}

export interface GifBrowserTabProps {
  onSelectGif: (gif: GifItem) => void;
  onLongPress: (gif: GifItem) => void;
}

const QUICK_TRENDING_TAGS = ['Anime', 'Hype', 'Shocked', 'Applause', 'Heart', 'Laugh', 'Plot Twist'];

export function GifBrowserTab({ onSelectGif, onLongPress }: GifBrowserTabProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [activeFilter, setActiveFilter] = useState<'trending' | 'search' | 'favorites'>('trending');

  // Queries
  const { data: gifs, isLoading } = (trpc.sticker as any).searchGifs.useQuery(
    { query: searchQuery, limit: 30 },
    { keepPreviousData: true }
  );

  return (
    <View style={styles.container}>
      {/* Search Bar */}
      <View style={styles.searchBar}>
        <Search size={14} color="#9ca3af" />
        <TextInput
          style={styles.searchInput}
          placeholder="Search Tenor GIFs..."
          placeholderTextColor="#9ca3af"
          value={searchQuery}
          onChangeText={(text) => {
            setSearchQuery(text);
            if (text.trim()) setActiveFilter('search');
            else setActiveFilter('trending');
          }}
        />
        {searchQuery ? (
          <TouchableOpacity onPress={() => setSearchQuery('')}>
            <X size={14} color="#9ca3af" />
          </TouchableOpacity>
        ) : null}
      </View>

      {/* Quick Category Chips */}
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.tagsScroll}>
        <TouchableOpacity
          style={[styles.tagPill, activeFilter === 'trending' && !searchQuery && styles.tagPillActive]}
          onPress={() => {
            setSearchQuery('');
            setActiveFilter('trending');
          }}
        >
          <Flame size={12} color={activeFilter === 'trending' && !searchQuery ? '#fff' : '#f97316'} />
          <Text style={[styles.tagText, activeFilter === 'trending' && !searchQuery && styles.tagTextActive]}>
            Trending
          </Text>
        </TouchableOpacity>

        {QUICK_TRENDING_TAGS.map((tag) => {
          const isSelected = searchQuery.toLowerCase() === tag.toLowerCase();
          return (
            <TouchableOpacity
              key={tag}
              style={[styles.tagPill, isSelected && styles.tagPillActive]}
              onPress={() => {
                setSearchQuery(tag);
                setActiveFilter('search');
              }}
            >
              <Text style={[styles.tagText, isSelected && styles.tagTextActive]}>{tag}</Text>
            </TouchableOpacity>
          );
        })}
      </ScrollView>

      {/* GIF Grid */}
      <ScrollView contentContainerStyle={styles.gridContent} showsVerticalScrollIndicator={false}>
        {isLoading ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="small" color="#2563eb" />
          </View>
        ) : gifs && gifs.length > 0 ? (
          <View style={styles.grid}>
            {gifs.map((gif: any) => (
              <TouchableOpacity
                key={gif.id}
                style={styles.gifTile}
                onPress={() => onSelectGif(gif)}
                onLongPress={() => onLongPress(gif)}
                activeOpacity={0.7}
              >
                <ExpoImage
                  source={{ uri: gif.previewUrl || gif.url }}
                  style={styles.gifImage}
                  contentFit="cover"
                />
                <View style={styles.gifBadge}>
                  <Text style={styles.gifBadgeText}>GIF</Text>
                </View>
              </TouchableOpacity>
            ))}
          </View>
        ) : (
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyText}>No GIFs found matching "{searchQuery}"</Text>
          </View>
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#1f2937',
    borderRadius: radius.full,
    paddingHorizontal: spacing.sm,
    height: 36,
    marginHorizontal: spacing.md,
    marginTop: spacing.sm,
    marginBottom: spacing.xs,
    gap: 6,
    borderWidth: 1,
    borderColor: '#374151',
  },
  searchInput: {
    flex: 1,
    color: '#fff',
    fontSize: 12,
    padding: 0,
  },
  tagsScroll: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
    gap: spacing.xs,
  },
  tagPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#1f2937',
    paddingHorizontal: spacing.sm + 2,
    paddingVertical: 4,
    borderRadius: radius.full,
  },
  tagPillActive: {
    backgroundColor: '#2563eb',
  },
  tagText: {
    fontSize: 11,
    color: '#9ca3af',
    fontWeight: '600',
  },
  tagTextActive: {
    color: '#fff',
  },
  gridContent: {
    paddingHorizontal: spacing.md,
    paddingTop: spacing.xs,
    paddingBottom: 30,
  },
  loadingContainer: {
    paddingVertical: 40,
    alignItems: 'center',
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.xs + 2,
    justifyContent: 'space-between',
  },
  gifTile: {
    width: '31.5%',
    height: 80,
    backgroundColor: '#1f2937',
    borderRadius: radius.sm,
    overflow: 'hidden',
    position: 'relative',
    borderWidth: 1,
    borderColor: '#374151',
  },
  gifImage: {
    width: '100%',
    height: '100%',
  },
  gifBadge: {
    position: 'absolute',
    bottom: 2,
    right: 2,
    backgroundColor: 'rgba(0, 0, 0, 0.75)',
    paddingHorizontal: 4,
    paddingVertical: 1,
    borderRadius: 3,
  },
  gifBadgeText: {
    fontSize: 8,
    color: '#fff',
    fontWeight: '700',
  },
  emptyContainer: {
    paddingVertical: 48,
    alignItems: 'center',
  },
  emptyText: {
    fontSize: 12,
    color: '#9ca3af',
  },
});
