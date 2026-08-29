import React, { useState } from 'react';
import {
  StyleSheet,
  View,
  Text,
  Modal,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { Image as ExpoImage } from 'expo-image';
import { useTheme } from '../../theme/ThemeContext';
import { trpc } from '../../../lib/trpc';
import {
  XIcon,
  BookOpenIcon,
  NovelsIcon,
  TrashIcon,
  SparklesIcon,
} from '../common/Icons';

export interface LinkedContentModalProps {
  visible: boolean;
  onClose: () => void;
  series: any;
  sessionToken?: string | null;
  onSuccessUpdate?: () => void;
}

/**
 * Creator Studio Modal for managing Linked Content (Comic ↔ Novel relationships).
 */
export function LinkedContentModal({
  visible,
  onClose,
  series,
  onSuccessUpdate,
}: LinkedContentModalProps) {
  const { colors } = useTheme();

  const isUuid = typeof series?.id === 'string' && /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(series?.id);

  // Query linkable candidate series
  const { data: linkableCandidates, isLoading: isLoadingCandidates, refetch: refetchCandidates } = (trpc.creator as any).getLinkableSeries.useQuery(
    { seriesId: series?.id || '' },
    { enabled: visible && !!series?.id && isUuid, retry: false }
  );

  // Link mutation
  const linkMutation = (trpc.creator as any).linkSeries.useMutation({
    onSuccess: () => {
      Alert.alert('Linked! 🎉', 'Series versions are now successfully linked. Readers can choose formats from the Series Information page.');
      if (onSuccessUpdate) onSuccessUpdate();
      onClose();
    },
    onError: (err: any) => Alert.alert('Link Error', err.message),
  });

  // Unlink mutation
  const unlinkMutation = (trpc.creator as any).unlinkSeries.useMutation({
    onSuccess: () => {
      Alert.alert('Unlinked', 'The alternate format relationship has been removed.');
      if (onSuccessUpdate) onSuccessUpdate();
      onClose();
    },
    onError: (err: any) => Alert.alert('Unlink Error', err.message),
  });

  const handleLinkTarget = (targetId: string) => {
    if (!series?.id) return;
    linkMutation.mutate({ seriesId: series.id, targetSeriesId: targetId });
  };

  const handleUnlink = () => {
    if (!series?.id) return;
    unlinkMutation.mutate({ seriesId: series.id });
  };

  if (!visible) return null;

  const currentType = (series?.type || 'COMIC').toUpperCase();
  const alternateTypeLabel = currentType === 'NOVEL' ? 'Comic / Manhwa' : 'Novel';
  const hasExistingLink = !!(series?.linkedSeriesId || series?.linkedSeries);

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <View style={styles.backdrop}>
        <View style={[styles.modalCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
          {/* Modal Header */}
          <View style={[styles.headerRow, { borderBottomColor: colors.borderSubtle }]}>
            <View>
              <Text style={[styles.title, { color: colors.text }]}>Linked Versions</Text>
              <Text style={[styles.subtitle, { color: colors.textMuted }]}>
                {series?.title || 'Series'}
              </Text>
            </View>
            <TouchableOpacity style={styles.closeBtn} onPress={onClose} activeOpacity={0.7}>
              <XIcon size={20} color={colors.textMuted} />
            </TouchableOpacity>
          </View>

          <ScrollView contentContainerStyle={styles.body} showsVerticalScrollIndicator={false}>
            {/* Info Card */}
            <View style={[styles.infoBox, { backgroundColor: 'rgba(37, 99, 235, 0.1)', borderColor: colors.primary }]}>
              <SparklesIcon size={18} color={colors.primary} />
              <Text style={[styles.infoText, { color: colors.textSecondary }]}>
                Link your Comic/Manhwa and Novel versions of this story. Readers will be able to choose their preferred reading format directly from the Series Information page.
              </Text>
            </View>

            {/* Currently Linked Section */}
            {hasExistingLink ? (
              <View style={styles.section}>
                <Text style={[styles.sectionHeading, { color: colors.textMuted }]}>
                  CURRENTLY LINKED {alternateTypeLabel.toUpperCase()} VERSION
                </Text>

                <View style={[styles.linkedCard, { backgroundColor: colors.surfaceElevated, borderColor: colors.primary }]}>
                  <View style={styles.linkedContentRow}>
                    <View style={[styles.iconThumb, { backgroundColor: colors.primaryMuted }]}>
                      {currentType === 'NOVEL' ? (
                        <BookOpenIcon size={22} color={colors.primary} />
                      ) : (
                        <NovelsIcon size={22} color={colors.primary} />
                      )}
                    </View>
                    <View style={{ flex: 1 }}>
                      <Text style={[styles.linkedTitle, { color: colors.text }]}>
                        {series?.linkedSeries?.title || `Linked ${alternateTypeLabel} Version`}
                      </Text>
                      <Text style={[styles.linkedStatus, { color: colors.primary }]}>
                        Active & Connected
                      </Text>
                    </View>
                  </View>

                  <TouchableOpacity
                    style={[styles.unlinkBtn, { borderColor: '#EF4444' }]}
                    onPress={handleUnlink}
                    disabled={unlinkMutation.isLoading}
                    activeOpacity={0.8}
                  >
                    <TrashIcon size={14} color="#EF4444" />
                    <Text style={styles.unlinkBtnText}>
                      {unlinkMutation.isLoading ? 'Unlinking...' : 'Remove Link'}
                    </Text>
                  </TouchableOpacity>
                </View>
              </View>
            ) : (
              <View style={styles.section}>
                <Text style={[styles.sectionHeading, { color: colors.textMuted }]}>
                  CHOOSE {alternateTypeLabel.toUpperCase()} TO LINK
                </Text>

                {isLoadingCandidates ? (
                  <View style={styles.loadingBox}>
                    <ActivityIndicator size="small" color={colors.primary} />
                    <Text style={[styles.loadingText, { color: colors.textMuted }]}>
                      Fetching your owned series...
                    </Text>
                  </View>
                ) : (linkableCandidates || []).length === 0 ? (
                  <View style={[styles.emptyBox, { backgroundColor: colors.surfaceElevated, borderColor: colors.borderSubtle }]}>
                    <Text style={[styles.emptyTitle, { color: colors.text }]}>
                      No Eligible {alternateTypeLabel} Series Found
                    </Text>
                    <Text style={[styles.emptySubtitle, { color: colors.textMuted }]}>
                      You haven't created a {alternateTypeLabel} series yet. Create one in Creator Studio to link them together.
                    </Text>
                  </View>
                ) : (
                  <View style={{ gap: 10 }}>
                    {(linkableCandidates || []).map((candidate: any) => (
                      <View
                        key={candidate.id}
                        style={[styles.candidateCard, { backgroundColor: colors.surfaceElevated, borderColor: colors.border }]}
                      >
                        {candidate.coverUrl ? (
                          <ExpoImage source={{ uri: candidate.coverUrl }} style={styles.candidateCover} />
                        ) : (
                          <View style={[styles.candidatePlaceholder, { backgroundColor: colors.surfaceSecondary }]}>
                            <BookOpenIcon size={20} color={colors.textMuted} />
                          </View>
                        )}
                        <View style={{ flex: 1 }}>
                          <Text style={[styles.candidateTitle, { color: colors.text }]} numberOfLines={1}>
                            {candidate.title}
                          </Text>
                          <Text style={[styles.candidateType, { color: colors.textMuted }]}>
                            {candidate.type}
                          </Text>
                        </View>
                        <TouchableOpacity
                          style={[styles.linkBtn, { backgroundColor: colors.primary }]}
                          onPress={() => handleLinkTarget(candidate.id)}
                          disabled={linkMutation.isLoading}
                          activeOpacity={0.8}
                        >
                          <Text style={styles.linkBtnText}>
                            {linkMutation.isLoading ? 'Linking...' : 'Link'}
                          </Text>
                        </TouchableOpacity>
                      </View>
                    ))}
                  </View>
                )}
              </View>
            )}
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.75)',
    justifyContent: 'flex-end',
  },
  modalCard: {
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    borderWidth: 1,
    maxHeight: '80%',
    paddingBottom: 24,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
  },
  title: {
    fontSize: 18,
    fontWeight: '800',
  },
  subtitle: {
    fontSize: 12,
    marginTop: 2,
  },
  closeBtn: {
    padding: 6,
  },
  body: {
    padding: 20,
    gap: 16,
  },
  infoBox: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    borderRadius: 12,
    borderWidth: 1,
    gap: 10,
  },
  infoText: {
    flex: 1,
    fontSize: 12,
    lineHeight: 16,
  },
  section: {
    gap: 10,
  },
  sectionHeading: {
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  linkedCard: {
    padding: 16,
    borderRadius: 14,
    borderWidth: 1.5,
    gap: 14,
  },
  linkedContentRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  iconThumb: {
    width: 44,
    height: 44,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  linkedTitle: {
    fontSize: 15,
    fontWeight: '700',
  },
  linkedStatus: {
    fontSize: 12,
    fontWeight: '600',
    marginTop: 2,
  },
  unlinkBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 10,
    borderRadius: 8,
    borderWidth: 1,
  },
  unlinkBtnText: {
    color: '#EF4444',
    fontSize: 13,
    fontWeight: '700',
  },
  loadingBox: {
    padding: 24,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  loadingText: {
    fontSize: 13,
  },
  emptyBox: {
    padding: 24,
    borderRadius: 12,
    borderWidth: 1,
    alignItems: 'center',
    gap: 6,
  },
  emptyTitle: {
    fontSize: 14,
    fontWeight: '700',
  },
  emptySubtitle: {
    fontSize: 12,
    textAlign: 'center',
  },
  candidateCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    borderRadius: 12,
    borderWidth: 1,
    gap: 12,
  },
  candidateCover: {
    width: 40,
    height: 52,
    borderRadius: 6,
  },
  candidatePlaceholder: {
    width: 40,
    height: 52,
    borderRadius: 6,
    alignItems: 'center',
    justifyContent: 'center',
  },
  candidateTitle: {
    fontSize: 14,
    fontWeight: '700',
  },
  candidateType: {
    fontSize: 11,
    marginTop: 2,
  },
  linkBtn: {
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 8,
  },
  linkBtnText: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '700',
  },
});
