import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, ActivityIndicator } from 'react-native';
import { Image as ExpoImage } from 'expo-image';
import { LayoutGrid, List, Package, Sparkles } from 'lucide-react-native';
import { radius, spacing } from '@panelva/theme';

export interface OwnedPackItem {
  id: string;
  title: string;
  description?: string;
  coverImage: string;
  stickerCount: number;
  source?: string;
  stickers?: any[];
}

export interface MyPacksTabProps {
  packs: OwnedPackItem[];
  isLoading?: boolean;
  onSelectPack: (pack: OwnedPackItem) => void;
  onBrowseMarketplace: () => void;
}

export function MyPacksTab({
  packs,
  isLoading,
  onSelectPack,
  onBrowseMarketplace,
}: MyPacksTabProps) {
  const [layoutMode, setLayoutMode] = useState<'grid' | 'list'>('grid');

  return (
    <View style={styles.container}>
      {/* Header with Grid / List Layout Toggle */}
      <View style={styles.headerRow}>
        <Text style={styles.headerTitle}>My Packs ({packs.length})</Text>

        <View style={styles.layoutToggle}>
          <TouchableOpacity
            style={[styles.toggleBtn, layoutMode === 'grid' && styles.toggleBtnActive]}
            onPress={() => setLayoutMode('grid')}
          >
            <LayoutGrid size={13} color={layoutMode === 'grid' ? '#fff' : '#9ca3af'} />
            <Text style={[styles.toggleText, layoutMode === 'grid' && styles.toggleTextActive]}>
              Grid
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.toggleBtn, layoutMode === 'list' && styles.toggleBtnActive]}
            onPress={() => setLayoutMode('list')}
          >
            <List size={13} color={layoutMode === 'list' ? '#fff' : '#9ca3af'} />
            <Text style={[styles.toggleText, layoutMode === 'list' && styles.toggleTextActive]}>
              List
            </Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Content */}
      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        {isLoading ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="small" color="#2563eb" />
          </View>
        ) : packs && packs.length > 0 ? (
          layoutMode === 'grid' ? (
            /* Grid Layout (Large Covers) */
            <View style={styles.grid}>
              {packs.map((pack) => (
                <TouchableOpacity
                  key={pack.id}
                  style={styles.gridCard}
                  onPress={() => onSelectPack(pack)}
                  activeOpacity={0.8}
                >
                  <ExpoImage source={{ uri: pack.coverImage }} style={styles.gridCover} />
                  <View style={styles.gridInfo}>
                    <Text style={styles.gridTitle} numberOfLines={1}>
                      {pack.title}
                    </Text>
                    <Text style={styles.gridCount}>{pack.stickerCount || 0} stickers</Text>
                  </View>
                </TouchableOpacity>
              ))}
            </View>
          ) : (
            /* List Layout (Compact Rows) */
            <View style={styles.list}>
              {packs.map((pack) => (
                <TouchableOpacity
                  key={pack.id}
                  style={styles.listCard}
                  onPress={() => onSelectPack(pack)}
                  activeOpacity={0.8}
                >
                  <ExpoImage source={{ uri: pack.coverImage }} style={styles.listCover} />
                  <View style={styles.listInfo}>
                    <Text style={styles.listTitle} numberOfLines={1}>
                      {pack.title}
                    </Text>
                    <Text style={styles.listSub}>{pack.stickerCount || 0} stickers</Text>
                  </View>
                  {pack.source && (
                    <View style={styles.sourceBadge}>
                      <Text style={styles.sourceBadgeText}>{pack.source}</Text>
                    </View>
                  )}
                </TouchableOpacity>
              ))}
            </View>
          )
        ) : (
          <View style={styles.emptyContainer}>
            <Package size={36} color="#64748b" />
            <Text style={styles.emptyTitle}>No Sticker Packs Owned</Text>
            <Text style={styles.emptySub}>
              Browse creator packs to claim free packs or purchase creator exclusives!
            </Text>
            <TouchableOpacity style={styles.browseBtn} onPress={onBrowseMarketplace}>
              <Sparkles size={14} color="#fff" />
              <Text style={styles.browseBtnText}>Browse Creator Packs</Text>
            </TouchableOpacity>
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
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs + 2,
    borderBottomWidth: 1,
    borderBottomColor: '#1f2937',
  },
  headerTitle: {
    fontSize: 13,
    fontWeight: '800',
    color: '#fff',
  },
  layoutToggle: {
    flexDirection: 'row',
    backgroundColor: '#1f2937',
    borderRadius: radius.full,
    padding: 2,
  },
  toggleBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: radius.full,
  },
  toggleBtnActive: {
    backgroundColor: '#374151',
  },
  toggleText: {
    fontSize: 10,
    fontWeight: '600',
    color: '#9ca3af',
  },
  toggleTextActive: {
    color: '#fff',
  },
  scrollContent: {
    padding: spacing.md,
    paddingBottom: 30,
  },
  loadingContainer: {
    paddingVertical: 40,
    alignItems: 'center',
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
    justifyContent: 'space-between',
  },
  gridCard: {
    width: '48%',
    backgroundColor: '#1e293b',
    borderRadius: radius.md,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: '#334155',
    marginBottom: spacing.xs,
  },
  gridCover: {
    width: '100%',
    height: 100,
    backgroundColor: '#0f172a',
  },
  gridInfo: {
    padding: spacing.xs + 2,
  },
  gridTitle: {
    fontSize: 12,
    fontWeight: '700',
    color: '#fff',
  },
  gridCount: {
    fontSize: 10,
    color: '#9ca3af',
    marginTop: 2,
  },
  list: {
    gap: spacing.xs + 2,
  },
  listCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#1e293b',
    borderRadius: radius.md,
    padding: spacing.xs + 2,
    borderWidth: 1,
    borderColor: '#334155',
    gap: spacing.sm,
  },
  listCover: {
    width: 44,
    height: 44,
    borderRadius: radius.sm,
    backgroundColor: '#0f172a',
  },
  listInfo: {
    flex: 1,
  },
  listTitle: {
    fontSize: 12,
    fontWeight: '700',
    color: '#fff',
  },
  listSub: {
    fontSize: 10,
    color: '#9ca3af',
    marginTop: 1,
  },
  sourceBadge: {
    backgroundColor: 'rgba(37, 99, 235, 0.15)',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: radius.full,
  },
  sourceBadgeText: {
    fontSize: 9,
    color: '#60a5fa',
    fontWeight: '700',
  },
  emptyContainer: {
    paddingVertical: 48,
    alignItems: 'center',
    gap: 6,
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
    maxWidth: 240,
    lineHeight: 16,
  },
  browseBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#2563eb',
    paddingHorizontal: spacing.md,
    paddingVertical: 8,
    borderRadius: radius.md,
    marginTop: spacing.sm,
  },
  browseBtnText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '700',
  },
});
