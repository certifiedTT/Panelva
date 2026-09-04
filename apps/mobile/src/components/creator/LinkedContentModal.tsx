import React from 'react';
import {
  StyleSheet,
  View,
  Text,
  Modal,
  TouchableOpacity,
  ScrollView,
  Alert,
} from 'react-native';
import { Image as ExpoImage } from 'expo-image';
import { colors, spacing, radius, typography } from '@panelva/theme';
import { trpc } from '../../../lib/trpc';
import { Card } from '../common/Card';
import { Button } from '../common/Button';

// Lucide Line Icons
import {
  X,
  BookOpen,
  BookText,
  Trash2,
  Sparkles,
} from 'lucide-react-native';

export interface LinkedContentModalProps {
  visible: boolean;
  onClose: () => void;
  series: any;
  sessionToken?: string | null;
  onSuccessUpdate?: () => void;
}

function LinkedCandidateSkeleton() {
  return (
    <View style={{ gap: spacing.sm }}>
      {[1, 2].map((i) => (
        <Card key={i} style={styles.skeletonCard}>
          <View style={styles.skeletonThumb} />
          <View style={{ flex: 1, gap: spacing.xs }}>
            <View style={styles.skeletonLine} />
            <View style={[styles.skeletonLine, { width: '40%' }]} />
          </View>
        </Card>
      ))}
    </View>
  );
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
  const isUuid = typeof series?.id === 'string' && /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(series?.id);

  // Query linkable candidate series
  const { data: linkableCandidates, isLoading: isLoadingCandidates } = (trpc.creator as any).getLinkableSeries.useQuery(
    { seriesId: series?.id || '' },
    { enabled: visible && !!series?.id && isUuid, retry: false }
  );

  // Link mutation
  const linkMutation = (trpc.creator as any).linkSeries.useMutation({
    onSuccess: () => {
      Alert.alert('Linked', 'Series versions are now successfully linked. Readers can choose formats from the Series Information page.');
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
        <View style={styles.modalCard}>
          {/* Modal Header */}
          <View style={styles.headerRow}>
            <View style={{ flex: 1 }}>
              <Text style={styles.title}>Linked Versions</Text>
              <Text style={styles.subtitle} numberOfLines={1}>
                {series?.title || 'Series'}
              </Text>
            </View>
            <TouchableOpacity
              style={styles.closeBtn}
              onPress={onClose}
              accessibilityRole="button"
              accessibilityLabel="Close Linked Versions Modal"
            >
              <X size={20} color={colors.textMuted} />
            </TouchableOpacity>
          </View>

          <ScrollView contentContainerStyle={styles.body} showsVerticalScrollIndicator={false}>
            {/* Info Card */}
            <Card style={styles.infoBox}>
              <Sparkles size={18} color={colors.primary} />
              <Text style={styles.infoText}>
                Link your Comic/Manhwa and Novel versions of this story. Readers will be able to choose their preferred reading format directly from the Series Information page.
              </Text>
            </Card>

            {/* Currently Linked Section */}
            {hasExistingLink ? (
              <View style={styles.section}>
                <Text style={styles.sectionHeading}>
                  CURRENTLY LINKED {alternateTypeLabel.toUpperCase()} VERSION
                </Text>

                <Card style={styles.linkedCard}>
                  <View style={styles.linkedContentRow}>
                    <View style={styles.iconThumb}>
                      {currentType === 'NOVEL' ? (
                        <BookOpen size={24} color={colors.primary} />
                      ) : (
                        <BookText size={24} color={colors.primary} />
                      )}
                    </View>
                    <View style={{ flex: 1, gap: spacing.xs / 2 }}>
                      <Text style={styles.linkedTitle} numberOfLines={1}>
                        {series?.linkedSeries?.title || `Linked ${alternateTypeLabel} Version`}
                      </Text>
                      <Text style={styles.linkedStatus}>
                        Active & Connected
                      </Text>
                    </View>
                  </View>

                  <Button
                    title={unlinkMutation.isLoading ? 'Unlinking...' : 'Remove Link'}
                    variant="secondary"
                    disabled={unlinkMutation.isLoading}
                    onPress={handleUnlink}
                  />
                </Card>
              </View>
            ) : (
              <View style={styles.section}>
                <Text style={styles.sectionHeading}>
                  CHOOSE {alternateTypeLabel.toUpperCase()} TO LINK
                </Text>

                {isLoadingCandidates ? (
                  <LinkedCandidateSkeleton />
                ) : (linkableCandidates || []).length === 0 ? (
                  <Card style={styles.emptyBox}>
                    <BookOpen size={36} color={colors.textMuted} />
                    <Text style={styles.emptyTitle}>
                      No Eligible {alternateTypeLabel} Series Found
                    </Text>
                    <Text style={styles.emptySubtitle}>
                      You haven't created a {alternateTypeLabel} series yet. Create one in Creator Studio to link them together.
                    </Text>
                  </Card>
                ) : (
                  <View style={{ gap: spacing.sm }}>
                    {(linkableCandidates || []).map((candidate: any) => (
                      <Card
                        key={candidate.id}
                        style={styles.candidateCard}
                      >
                        {candidate.coverUrl ? (
                          <ExpoImage source={{ uri: candidate.coverUrl }} style={styles.candidateCover} />
                        ) : (
                          <View style={styles.candidatePlaceholder}>
                            <BookOpen size={20} color={colors.textMuted} />
                          </View>
                        )}
                        <View style={{ flex: 1, gap: spacing.xs / 2 }}>
                          <Text style={styles.candidateTitle} numberOfLines={1}>
                            {candidate.title}
                          </Text>
                          <Text style={styles.candidateType}>
                            {candidate.type}
                          </Text>
                        </View>
                        <Button
                          title={linkMutation.isLoading ? 'Linking...' : 'Link'}
                          variant="primary"
                          disabled={linkMutation.isLoading}
                          onPress={() => handleLinkTarget(candidate.id)}
                        />
                      </Card>
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
    borderTopLeftRadius: radius.lg,
    borderTopRightRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surface,
    maxHeight: '80%',
    paddingBottom: spacing.lg,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  title: {
    fontSize: typography.h3.fontSize,
    lineHeight: typography.h3.lineHeight,
    fontWeight: '700',
    color: colors.text,
  },
  subtitle: {
    fontSize: typography.caption.fontSize,
    lineHeight: typography.caption.lineHeight,
    color: colors.textMuted,
    marginTop: spacing.xs / 2,
  },
  closeBtn: {
    padding: spacing.xs,
  },
  body: {
    padding: spacing.md,
    gap: spacing.md,
  },
  infoBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  infoText: {
    flex: 1,
    fontSize: typography.caption.fontSize,
    lineHeight: typography.caption.lineHeight,
    color: colors.textMuted,
  },
  section: {
    gap: spacing.sm,
  },
  sectionHeading: {
    fontSize: typography.caption.fontSize,
    fontWeight: '700',
    letterSpacing: 0.5,
    color: colors.textMuted,
    textTransform: 'uppercase',
  },
  linkedCard: {
    gap: spacing.md,
  },
  linkedContentRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
  },
  iconThumb: {
    width: 48,
    height: 48,
    borderRadius: radius.md,
    backgroundColor: colors.background,
    borderWidth: 1,
    borderColor: colors.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  linkedTitle: {
    fontSize: typography.body.fontSize,
    fontWeight: '700',
    color: colors.text,
  },
  linkedStatus: {
    fontSize: typography.caption.fontSize,
    fontWeight: '600',
    color: colors.primary,
  },
  emptyBox: {
    paddingVertical: spacing.xl,
    paddingHorizontal: spacing.md,
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.xs,
  },
  emptyTitle: {
    fontSize: typography.body.fontSize,
    fontWeight: '700',
    color: colors.text,
    marginTop: spacing.xs,
  },
  emptySubtitle: {
    fontSize: typography.caption.fontSize,
    lineHeight: typography.caption.lineHeight,
    textAlign: 'center',
    color: colors.textMuted,
  },
  candidateCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
  },
  candidateCover: {
    width: 48,
    height: 64,
    borderRadius: radius.sm,
    backgroundColor: colors.background,
  },
  candidatePlaceholder: {
    width: 48,
    height: 64,
    borderRadius: radius.sm,
    backgroundColor: colors.background,
    borderWidth: 1,
    borderColor: colors.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  candidateTitle: {
    fontSize: typography.small.fontSize,
    fontWeight: '700',
    color: colors.text,
  },
  candidateType: {
    fontSize: typography.caption.fontSize,
    color: colors.textMuted,
  },
  skeletonCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
  },
  skeletonThumb: {
    width: 48,
    height: 64,
    borderRadius: radius.sm,
    backgroundColor: colors.surface,
  },
  skeletonLine: {
    height: 14,
    borderRadius: radius.sm,
    backgroundColor: colors.surface,
    width: '70%',
  },
});
