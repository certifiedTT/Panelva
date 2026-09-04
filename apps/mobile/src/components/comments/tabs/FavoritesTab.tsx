import React from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { Image as ExpoImage } from 'expo-image';
import { Heart, Lock, Sparkles } from 'lucide-react-native';
import { radius, spacing } from '@panelva/theme';

export interface FavoriteItem {
  id: string;
  mediaType: 'STICKER' | 'GIF';
  mediaId: string;
  provider: 'Panelva' | 'Tenor';
  isLocked?: boolean;
  lockReason?: string;
  metadata?: any;
}

export interface FavoritesTabProps {
  favorites: FavoriteItem[];
  onSelectSticker: (item: any) => void;
  onSelectGif: (item: any) => void;
  onLockedClick: (item: FavoriteItem) => void;
  onLongPress: (item: FavoriteItem) => void;
}

export function FavoritesTab({
  favorites,
  onSelectSticker,
  onSelectGif,
  onLockedClick,
  onLongPress,
}: FavoritesTabProps) {
  if (!favorites || favorites.length === 0) {
    return (
      <View style={styles.emptyContainer}>
        <Heart size={32} color="#64748b" />
        <Text style={styles.emptyTitle}>No Favorites Saved</Text>
        <Text style={styles.emptySub}>
          Long press any sticker or GIF in comments or packs to add it to your favorites!
        </Text>
      </View>
    );
  }

  return (
    <ScrollView contentContainerStyle={styles.container} showsVerticalScrollIndicator={false}>
      <View style={styles.grid}>
        {favorites.map((fav) => {
          const isGif = fav.mediaType === 'GIF';
          const isLocked = fav.isLocked;
          const imageUrl = fav.metadata?.url || fav.metadata?.imageUrl;

          if (isGif) {
            return (
              <TouchableOpacity
                key={fav.id}
                style={styles.gifTile}
                onPress={() => onSelectGif(fav)}
                onLongPress={() => onLongPress(fav)}
                activeOpacity={0.7}
              >
                <ExpoImage source={{ uri: imageUrl }} style={styles.gifImage} />
                <View style={styles.gifBadge}>
                  <Text style={styles.gifBadgeText}>GIF</Text>
                </View>
              </TouchableOpacity>
            );
          }

          return (
            <TouchableOpacity
              key={fav.id}
              style={[styles.stickerTile, isLocked && styles.stickerTileLocked]}
              onPress={() => {
                if (isLocked) {
                  onLockedClick(fav);
                } else {
                  onSelectSticker(fav);
                }
              }}
              onLongPress={() => onLongPress(fav)}
              activeOpacity={0.7}
            >
              {imageUrl ? (
                <ExpoImage source={{ uri: imageUrl }} style={styles.stickerImage} />
              ) : (
                <View style={styles.placeholderBox}>
                  <Sparkles size={20} color="#60a5fa" />
                </View>
              )}

              <Text style={styles.stickerName} numberOfLines={1}>
                {fav.metadata?.name || 'Sticker'}
              </Text>

              {/* Locked Overlay for Expired / Inaccessible Membership & Subscriptions */}
              {isLocked && (
                <View style={styles.lockedOverlay}>
                  <View style={styles.lockBadge}>
                    <Lock size={12} color="#fff" />
                  </View>
                </View>
              )}
            </TouchableOpacity>
          );
        })}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: spacing.md,
    paddingBottom: 30,
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
  },
  stickerTile: {
    width: '22%',
    alignItems: 'center',
    backgroundColor: '#1f2937',
    padding: 6,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: '#374151',
    position: 'relative',
  },
  stickerTileLocked: {
    opacity: 0.7,
  },
  stickerImage: {
    width: 48,
    height: 48,
    borderRadius: 6,
    marginBottom: 2,
  },
  placeholderBox: {
    width: 48,
    height: 48,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#111827',
    borderRadius: 6,
    marginBottom: 2,
  },
  stickerName: {
    fontSize: 9,
    color: '#d1d5db',
    textAlign: 'center',
  },
  lockedOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(15, 23, 42, 0.65)',
    borderRadius: radius.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
  lockBadge: {
    backgroundColor: '#d97706',
    width: 22,
    height: 22,
    borderRadius: 11,
    alignItems: 'center',
    justifyContent: 'center',
  },
  gifTile: {
    width: '30%',
    height: 70,
    borderRadius: radius.md,
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
    bottom: 3,
    right: 3,
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
    gap: 6,
    paddingHorizontal: spacing.lg,
  },
  emptyTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: '#fff',
  },
  emptySub: {
    fontSize: 11,
    color: '#9ca3af',
    textAlign: 'center',
    lineHeight: 16,
  },
});
