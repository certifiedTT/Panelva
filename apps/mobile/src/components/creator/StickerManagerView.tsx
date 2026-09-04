import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { Image as ExpoImage } from 'expo-image';
import { Plus, Sparkles, Coins, Users, Eye, Archive, CheckCircle2, Clock, AlertCircle } from 'lucide-react-native';
import { colors, radius, spacing } from '@panelva/theme';
import { trpc } from '../../../lib/trpc';
import { CreateStickerPackModal } from './CreateStickerPackModal';

export function StickerManagerView() {
  const [showCreateModal, setShowCreateModal] = useState(false);

  // Queries
  const { data: packs, isLoading, refetch: refetchPacks } = (trpc.creator as any).getCreatorStickerPacks.useQuery();
  const { data: analytics } = (trpc.creator as any).getStickerAnalytics.useQuery();

  // Mutations
  const archiveMutation = (trpc.creator as any).archiveStickerPack.useMutation({
    onSuccess: () => {
      refetchPacks();
      Alert.alert('Pack Archived', 'Sticker pack has been archived.');
    },
  });

  const submitMutation = (trpc.creator as any).submitStickerPackForReview.useMutation({
    onSuccess: () => {
      refetchPacks();
      Alert.alert('Submitted!', 'Your pack has been submitted for admin moderation.');
    },
    onError: (err: any) => Alert.alert('Submission Error', err.message),
  });

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'PUBLISHED':
        return (
          <View style={[styles.badge, { backgroundColor: 'rgba(16, 185, 129, 0.15)', borderColor: 'rgba(16, 185, 129, 0.35)' }]}>
            <CheckCircle2 size={10} color="#10b981" />
            <Text style={[styles.badgeText, { color: '#10b981' }]}>Published</Text>
          </View>
        );
      case 'REVIEW':
        return (
          <View style={[styles.badge, { backgroundColor: 'rgba(245, 158, 11, 0.15)', borderColor: 'rgba(245, 158, 11, 0.35)' }]}>
            <Clock size={10} color="#f59e0b" />
            <Text style={[styles.badgeText, { color: '#f59e0b' }]}>In Review</Text>
          </View>
        );
      case 'DRAFT':
        return (
          <View style={[styles.badge, { backgroundColor: 'rgba(107, 114, 128, 0.15)', borderColor: 'rgba(107, 114, 128, 0.35)' }]}>
            <AlertCircle size={10} color="#9ca3af" />
            <Text style={[styles.badgeText, { color: '#9ca3af' }]}>Draft</Text>
          </View>
        );
      case 'ARCHIVED':
        return (
          <View style={[styles.badge, { backgroundColor: 'rgba(239, 68, 68, 0.15)', borderColor: 'rgba(239, 68, 68, 0.35)' }]}>
            <Archive size={10} color="#ef4444" />
            <Text style={[styles.badgeText, { color: '#ef4444' }]}>Archived</Text>
          </View>
        );
      default:
        return null;
    }
  };

  const getAccessTypeBadge = (type: string, price: number) => {
    if (type === 'FREE') {
      return <Text style={styles.accessFreeText}>Free</Text>;
    }
    if (type === 'PAID') {
      return (
        <View style={styles.priceRow}>
          <Coins size={10} color="#fbbf24" />
          <Text style={styles.accessPaidText}>{price} Credits</Text>
        </View>
      );
    }
    if (type === 'MEMBERSHIP') {
      return (
        <View style={styles.membershipBadge}>
          <Text style={styles.membershipBadgeText}>Members Only</Text>
        </View>
      );
    }
    return null;
  };

  return (
    <View style={styles.container}>
      {/* Analytics Summary Banner */}
      <View style={styles.analyticsGrid}>
        <View style={styles.statCard}>
          <View style={styles.statHeader}>
            <Sparkles size={14} color="#60a5fa" />
            <Text style={styles.statLabel}>Stickers Sent</Text>
          </View>
          <Text style={styles.statValue}>{analytics?.stickersSent || 0}</Text>
        </View>

        <View style={styles.statCard}>
          <View style={styles.statHeader}>
            <Users size={14} color="#10b981" />
            <Text style={styles.statLabel}>Claims & Sales</Text>
          </View>
          <Text style={styles.statValue}>
            {(analytics?.packsClaimed || 0) + (analytics?.packsPurchased || 0)}
          </Text>
        </View>

        <View style={styles.statCard}>
          <View style={styles.statHeader}>
            <Eye size={14} color="#f59e0b" />
            <Text style={styles.statLabel}>Pack Views</Text>
          </View>
          <Text style={styles.statValue}>{analytics?.packsViewed || 0}</Text>
        </View>
      </View>

      {/* Header Row */}
      <View style={styles.headerRow}>
        <View>
          <Text style={styles.headerTitle}>Sticker Packs</Text>
          <Text style={styles.headerSub}>Manage your creator stickers & distribution</Text>
        </View>

        <TouchableOpacity style={styles.createBtn} onPress={() => setShowCreateModal(true)}>
          <Plus size={14} color="#fff" />
          <Text style={styles.createBtnText}>Create Pack</Text>
        </TouchableOpacity>
      </View>

      {/* Packs List */}
      <ScrollView contentContainerStyle={styles.scrollList} showsVerticalScrollIndicator={false}>
        {isLoading ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color="#2563eb" />
          </View>
        ) : packs && packs.length > 0 ? (
          <View style={{ gap: spacing.sm }}>
            {packs.map((pack: any) => (
              <View key={pack.id} style={styles.packCard}>
                <ExpoImage source={{ uri: pack.coverImage }} style={styles.packCover} />

                <View style={styles.packInfo}>
                  <View style={styles.titleRow}>
                    <Text style={styles.packTitle} numberOfLines={1}>
                      {pack.title}
                    </Text>
                    {getStatusBadge(pack.status)}
                  </View>

                  <Text style={styles.packDesc} numberOfLines={2}>
                    {pack.description || 'No description provided.'}
                  </Text>

                  <View style={styles.metaRow}>
                    <Text style={styles.countText}>{pack.stickerCount || 0} stickers</Text>
                    <Text style={styles.bulletDot}>•</Text>
                    {getAccessTypeBadge(pack.accessType, pack.price)}
                  </View>

                  {/* Action Buttons */}
                  <View style={styles.actionRow}>
                    {pack.status === 'DRAFT' && (
                      <TouchableOpacity
                        style={styles.submitBtn}
                        onPress={() => submitMutation.mutate({ packId: pack.id })}
                      >
                        <Text style={styles.submitBtnText}>Submit for Review</Text>
                      </TouchableOpacity>
                    )}

                    {pack.status !== 'ARCHIVED' && (
                      <TouchableOpacity
                        style={styles.archiveBtn}
                        onPress={() => {
                          Alert.alert('Archive Pack', 'Are you sure you want to archive this pack?', [
                            { text: 'Cancel', style: 'cancel' },
                            {
                              text: 'Archive',
                              style: 'destructive',
                              onPress: () => archiveMutation.mutate({ packId: pack.id }),
                            },
                          ]);
                        }}
                      >
                        <Archive size={12} color="#9ca3af" />
                        <Text style={styles.archiveBtnText}>Archive</Text>
                      </TouchableOpacity>
                    )}
                  </View>
                </View>
              </View>
            ))}
          </View>
        ) : (
          <View style={styles.emptyContainer}>
            <Sparkles size={36} color="#6b7280" />
            <Text style={styles.emptyTitle}>No Sticker Packs Yet</Text>
            <Text style={styles.emptySub}>
              Create customized sticker packs for your readers and membership subscribers!
            </Text>
            <TouchableOpacity style={styles.emptyCreateBtn} onPress={() => setShowCreateModal(true)}>
              <Plus size={14} color="#fff" />
              <Text style={styles.createBtnText}>Create Your First Pack</Text>
            </TouchableOpacity>
          </View>
        )}
      </ScrollView>

      {/* Creation Modal Wizard */}
      <CreateStickerPackModal
        visible={showCreateModal}
        onClose={() => setShowCreateModal(false)}
        onSuccess={() => refetchPacks()}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0f172a',
    padding: spacing.md,
  },
  analyticsGrid: {
    flexDirection: 'row',
    gap: spacing.sm,
    marginBottom: spacing.md,
  },
  statCard: {
    flex: 1,
    backgroundColor: '#1e293b',
    padding: spacing.sm + 2,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: '#334155',
  },
  statHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 10,
    color: '#9ca3af',
    fontWeight: '600',
  },
  statValue: {
    fontSize: 18,
    fontWeight: '800',
    color: '#fff',
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: spacing.md,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: '#fff',
  },
  headerSub: {
    fontSize: 11,
    color: '#9ca3af',
    marginTop: 2,
  },
  createBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#2563eb',
    paddingHorizontal: spacing.sm + 4,
    paddingVertical: 8,
    borderRadius: radius.md,
  },
  createBtnText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '700',
  },
  scrollList: {
    paddingBottom: 40,
  },
  loadingContainer: {
    paddingVertical: 40,
    alignItems: 'center',
  },
  packCard: {
    flexDirection: 'row',
    backgroundColor: '#1e293b',
    borderRadius: radius.md,
    padding: spacing.sm + 2,
    borderWidth: 1,
    borderColor: '#334155',
    gap: spacing.sm + 2,
  },
  packCover: {
    width: 80,
    height: 80,
    borderRadius: radius.md,
    backgroundColor: '#0f172a',
  },
  packInfo: {
    flex: 1,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 6,
  },
  packTitle: {
    fontSize: 14,
    fontWeight: '800',
    color: '#fff',
    flex: 1,
  },
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: radius.full,
    borderWidth: 1,
  },
  badgeText: {
    fontSize: 9,
    fontWeight: '700',
  },
  packDesc: {
    fontSize: 11,
    color: '#9ca3af',
    marginVertical: 4,
    lineHeight: 15,
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: 2,
  },
  countText: {
    fontSize: 11,
    color: '#d1d5db',
    fontWeight: '600',
  },
  bulletDot: {
    color: '#6b7280',
    fontSize: 10,
  },
  accessFreeText: {
    fontSize: 11,
    color: '#10b981',
    fontWeight: '700',
  },
  priceRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
  },
  accessPaidText: {
    fontSize: 11,
    color: '#fbbf24',
    fontWeight: '700',
  },
  membershipBadge: {
    backgroundColor: 'rgba(124, 58, 237, 0.2)',
    paddingHorizontal: 5,
    paddingVertical: 1,
    borderRadius: 4,
  },
  membershipBadgeText: {
    fontSize: 9,
    color: '#a78bfa',
    fontWeight: '700',
  },
  actionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    marginTop: spacing.xs + 4,
  },
  submitBtn: {
    backgroundColor: '#2563eb',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: radius.sm,
  },
  submitBtnText: {
    color: '#fff',
    fontSize: 11,
    fontWeight: '700',
  },
  archiveBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: radius.sm,
    backgroundColor: 'rgba(55, 65, 81, 0.6)',
  },
  archiveBtnText: {
    color: '#9ca3af',
    fontSize: 11,
    fontWeight: '600',
  },
  emptyContainer: {
    paddingVertical: 48,
    alignItems: 'center',
    gap: 8,
  },
  emptyTitle: {
    fontSize: 15,
    fontWeight: '800',
    color: '#fff',
  },
  emptySub: {
    fontSize: 12,
    color: '#9ca3af',
    textAlign: 'center',
    maxWidth: 240,
  },
  emptyCreateBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#2563eb',
    paddingHorizontal: spacing.md,
    paddingVertical: 10,
    borderRadius: radius.md,
    marginTop: spacing.sm,
  },
});
