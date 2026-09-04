import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, ActivityIndicator } from 'react-native';
import { Image as ExpoImage } from 'expo-image';
import { Coins, Check, ArrowRight, Package } from 'lucide-react-native';
import { radius, spacing } from '@panelva/theme';

export interface PackItem {
  id: string;
  title: string;
  description?: string;
  coverImage: string;
  accessType: 'FREE' | 'PAID' | 'MEMBERSHIP';
  price: number;
  stickerCount: number;
  isOwned?: boolean;
  stickers?: any[];
}

export interface CreatorPacksTabProps {
  freePacks: PackItem[];
  paidPacks: PackItem[];
  isLoading?: boolean;
  onClaimPack: (pack: PackItem) => void;
  onBuyPack: (pack: PackItem) => void;
  onSelectPack: (pack: PackItem) => void;
}

export function CreatorPacksTab({
  freePacks,
  paidPacks,
  isLoading,
  onClaimPack,
  onBuyPack,
  onSelectPack,
}: CreatorPacksTabProps) {
  const [activeSegment, setActiveSegment] = useState<'FREE' | 'PAID'>('FREE');

  const packs = activeSegment === 'FREE' ? freePacks : paidPacks;

  return (
    <View style={styles.container}>
      {/* Segmented Tabs: Free vs Paid */}
      <View style={styles.segmentContainer}>
        <TouchableOpacity
          style={[styles.segmentButton, activeSegment === 'FREE' && styles.segmentButtonActive]}
          onPress={() => setActiveSegment('FREE')}
        >
          <Text style={[styles.segmentText, activeSegment === 'FREE' && styles.segmentTextActive]}>
            Free
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.segmentButton, activeSegment === 'PAID' && styles.segmentButtonActive]}
          onPress={() => setActiveSegment('PAID')}
        >
          <Text style={[styles.segmentText, activeSegment === 'PAID' && styles.segmentTextActive]}>
            Paid
          </Text>
        </TouchableOpacity>
      </View>

      {/* Packs Feed */}
      <ScrollView contentContainerStyle={styles.feedContent} showsVerticalScrollIndicator={false}>
        {isLoading ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="small" color="#2563eb" />
          </View>
        ) : packs && packs.length > 0 ? (
          <View style={styles.packsList}>
            {packs.map((pack) => {
              const isOwned = pack.isOwned;

              return (
                <TouchableOpacity
                  key={pack.id}
                  style={styles.packCard}
                  onPress={() => onSelectPack(pack)}
                  activeOpacity={0.8}
                >
                  <ExpoImage source={{ uri: pack.coverImage }} style={styles.packCover} />

                  <View style={styles.packDetails}>
                    <Text style={styles.packTitle} numberOfLines={1}>
                      {pack.title}
                    </Text>
                    <Text style={styles.packSub} numberOfLines={1}>
                      {pack.stickerCount || 0} stickers
                    </Text>

                    {/* Price / Free Tag */}
                    <View style={styles.pricingRow}>
                      {pack.accessType === 'FREE' ? (
                        <Text style={styles.freeTag}>Free</Text>
                      ) : (
                        <View style={styles.priceRow}>
                          <Coins size={12} color="#fbbf24" />
                          <Text style={styles.priceText}>{pack.price.toLocaleString()} Credits</Text>
                        </View>
                      )}
                    </View>
                  </View>

                  {/* Claim / Buy / Owned Action */}
                  <View style={styles.actionCol}>
                    {isOwned ? (
                      <View style={styles.ownedBadge}>
                        <Check size={12} color="#10b981" />
                        <Text style={styles.ownedBadgeText}>Owned</Text>
                      </View>
                    ) : pack.accessType === 'FREE' ? (
                      <TouchableOpacity
                        style={styles.claimBtn}
                        onPress={() => onClaimPack(pack)}
                      >
                        <Text style={styles.claimBtnText}>Claim</Text>
                      </TouchableOpacity>
                    ) : (
                      <TouchableOpacity
                        style={styles.buyBtn}
                        onPress={() => onBuyPack(pack)}
                      >
                        <Text style={styles.buyBtnText}>Buy</Text>
                      </TouchableOpacity>
                    )}
                  </View>
                </TouchableOpacity>
              );
            })}
          </View>
        ) : (
          <View style={styles.emptyContainer}>
            <Package size={32} color="#64748b" />
            <Text style={styles.emptyTitle}>No {activeSegment === 'FREE' ? 'Free' : 'Paid'} Packs Yet</Text>
            <Text style={styles.emptySub}>Check back soon for new creator releases!</Text>
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
  segmentContainer: {
    flexDirection: 'row',
    alignSelf: 'center',
    backgroundColor: '#1f2937',
    borderRadius: radius.full,
    padding: 3,
    marginVertical: spacing.sm,
    width: 180,
  },
  segmentButton: {
    flex: 1,
    paddingVertical: 5,
    alignItems: 'center',
    borderRadius: radius.full,
  },
  segmentButtonActive: {
    backgroundColor: '#374151',
  },
  segmentText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#9ca3af',
  },
  segmentTextActive: {
    color: '#fff',
    fontWeight: '800',
  },
  feedContent: {
    paddingHorizontal: spacing.md,
    paddingBottom: 30,
  },
  loadingContainer: {
    paddingVertical: 40,
    alignItems: 'center',
  },
  packsList: {
    gap: spacing.sm,
  },
  packCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#1e293b',
    borderRadius: radius.md,
    padding: spacing.sm,
    borderWidth: 1,
    borderColor: '#334155',
    gap: spacing.sm,
  },
  packCover: {
    width: 56,
    height: 56,
    borderRadius: radius.sm,
    backgroundColor: '#0f172a',
  },
  packDetails: {
    flex: 1,
  },
  packTitle: {
    fontSize: 13,
    fontWeight: '800',
    color: '#fff',
  },
  packSub: {
    fontSize: 10,
    color: '#9ca3af',
    marginTop: 2,
  },
  pricingRow: {
    marginTop: 4,
  },
  freeTag: {
    fontSize: 11,
    color: '#10b981',
    fontWeight: '700',
  },
  priceRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
  },
  priceText: {
    fontSize: 11,
    color: '#fbbf24',
    fontWeight: '700',
  },
  actionCol: {
    paddingLeft: spacing.xs,
  },
  claimBtn: {
    backgroundColor: '#2563eb',
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: radius.full,
  },
  claimBtnText: {
    color: '#fff',
    fontSize: 11,
    fontWeight: '700',
  },
  buyBtn: {
    backgroundColor: '#d97706',
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: radius.full,
  },
  buyBtnText: {
    color: '#fff',
    fontSize: 11,
    fontWeight: '700',
  },
  ownedBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    backgroundColor: 'rgba(16, 185, 129, 0.15)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: radius.full,
    borderWidth: 1,
    borderColor: 'rgba(16, 185, 129, 0.35)',
  },
  ownedBadgeText: {
    fontSize: 10,
    color: '#10b981',
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
  },
});
