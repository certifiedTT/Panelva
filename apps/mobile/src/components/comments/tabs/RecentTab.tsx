import React from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { Image as ExpoImage } from 'expo-image';
import { Clock, Sparkles } from 'lucide-react-native';
import { radius, spacing } from '@panelva/theme';

export interface RecentItem {
  type: 'STICKER' | 'GIF';
  id: string;
  name?: string;
  url?: string;
  provider: 'Panelva' | 'Tenor';
}

export interface RecentTabProps {
  recents: RecentItem[];
  onSelectSticker: (sticker: any) => void;
  onSelectGif: (gif: any) => void;
}

export function RecentTab({ recents, onSelectSticker, onSelectGif }: RecentTabProps) {
  if (!recents || recents.length === 0) {
    return (
      <View style={styles.emptyContainer}>
        <Clock size={32} color="#64748b" />
        <Text style={styles.emptyTitle}>No Recent Media</Text>
        <Text style={styles.emptySub}>
          Stickers and GIFs you use in comments will appear here for fast access.
        </Text>
      </View>
    );
  }

  return (
    <ScrollView contentContainerStyle={styles.container} showsVerticalScrollIndicator={false}>
      <View style={styles.grid}>
        {recents.map((item, idx) => {
          if (item.type === 'GIF') {
            return (
              <TouchableOpacity
                key={`${item.id}-${idx}`}
                style={styles.gifTile}
                onPress={() => onSelectGif(item)}
                activeOpacity={0.7}
              >
                <ExpoImage source={{ uri: item.url }} style={styles.gifImage} />
                <View style={styles.gifBadge}>
                  <Text style={styles.gifBadgeText}>GIF</Text>
                </View>
              </TouchableOpacity>
            );
          }

          return (
            <TouchableOpacity
              key={`${item.id}-${idx}`}
              style={styles.stickerTile}
              onPress={() => onSelectSticker(item)}
              activeOpacity={0.7}
            >
              {item.url ? (
                <ExpoImage source={{ uri: item.url }} style={styles.stickerImage} />
              ) : (
                <View style={styles.placeholderBox}>
                  <Sparkles size={20} color="#60a5fa" />
                </View>
              )}
              <Text style={styles.stickerName} numberOfLines={1}>
                {item.name || item.id}
              </Text>
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
