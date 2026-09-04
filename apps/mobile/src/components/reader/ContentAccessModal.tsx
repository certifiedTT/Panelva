import React, { useState } from 'react';
import {
  Modal,
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
} from 'react-native';
import {
  X,
  Crown,
  Coins,
  Sparkles,
} from 'lucide-react-native';
import { colors, spacing, radius, typography } from '@panelva/theme';
import { Card } from '../common/Card';
import { Button } from '../common/Button';
import { Badge } from '@panelva/ui';
import { EarlyAccessSchedule } from '../../types';

interface ContentAccessModalProps {
  visible: boolean;
  onClose: () => void;
  accessType: 'EARLY_ACCESS' | 'AD_SUPPORTED' | 'PREMIUM';
  chapterIndex?: number;
  chapterTitle?: string;
  seriesTitle?: string;
  earlyAccessSchedule?: EarlyAccessSchedule | null;
  creditBalance?: number;
  onUnlockWithCredits?: () => void;
  onWatchAd?: () => void;
  onOpenWallet?: () => void;
  onRequireAuth?: () => void;
  onSubscribe?: (tier: 'PLUS' | 'PREMIUM') => void;
  isAuthenticated?: boolean;
}

export function ContentAccessModal({
  visible,
  onClose,
  accessType = 'PREMIUM',
  chapterIndex = 1,
  chapterTitle,
  seriesTitle,
  earlyAccessSchedule,
  creditBalance = 0,
  onUnlockWithCredits,
  onWatchAd,
  onOpenWallet,
  onRequireAuth,
  onSubscribe,
  isAuthenticated = false,
}: ContentAccessModalProps) {
  const [isAdPlaying, setIsAdPlaying] = useState(false);
  const [adCountdown, setAdCountdown] = useState(3);
  const [isUnlocking, setIsUnlocking] = useState(false);

  const unlockCost = 50;
  const hasEnoughCredits = creditBalance >= unlockCost;

  const handleStartWatchAd = () => {
    setIsAdPlaying(true);
    setAdCountdown(3);
    const interval = setInterval(() => {
      setAdCountdown((prev) => {
        if (prev <= 1) {
          clearInterval(interval);
          setIsAdPlaying(false);
          if (onWatchAd) onWatchAd();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
  };

  const handleCreditUnlock = async () => {
    if (!isAuthenticated) {
      onClose();
      if (onRequireAuth) onRequireAuth();
      return;
    }
    if (!hasEnoughCredits) {
      onClose();
      if (onOpenWallet) onOpenWallet();
      return;
    }
    setIsUnlocking(true);
    try {
      if (onUnlockWithCredits) await onUnlockWithCredits();
    } finally {
      setIsUnlocking(false);
    }
  };

  const handleSelectTier = (tier: 'PLUS' | 'PREMIUM') => {
    onClose();
    if (!isAuthenticated) {
      if (onRequireAuth) onRequireAuth();
    } else {
      if (onSubscribe) {
        onSubscribe(tier);
      } else if (onOpenWallet) {
        onOpenWallet();
      }
    }
  };

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <View style={styles.overlay}>
        <View style={styles.container}>
          {/* Header */}
          <View style={styles.header}>
            <Text style={styles.headerTitle}>
              {accessType === 'EARLY_ACCESS'
                ? 'Early Access Release'
                : accessType === 'PREMIUM'
                ? 'Premium Chapter Access'
                : 'Ad-Supported Chapter'}
            </Text>
            <TouchableOpacity
              onPress={onClose}
              style={styles.closeBtn}
              accessibilityRole="button"
              accessibilityLabel="Close access modal"
            >
              <X size={20} color={colors.textMuted} />
            </TouchableOpacity>
          </View>

          <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
            {/* Badge & Chapter Title */}
            <View style={styles.badgeRow}>
              <View
                style={[
                  styles.iconBadge,
                  {
                    backgroundColor:
                      accessType === 'EARLY_ACCESS'
                        ? 'rgba(37, 99, 235, 0.15)'
                        : accessType === 'PREMIUM'
                        ? 'rgba(245, 158, 11, 0.15)'
                        : 'rgba(37, 99, 235, 0.15)',
                  },
                ]}
              >
                {accessType === 'EARLY_ACCESS' ? (
                  <Sparkles size={24} color={colors.primary} />
                ) : accessType === 'PREMIUM' ? (
                  <Crown size={24} color={colors.warning} />
                ) : (
                  <Sparkles size={24} color={colors.primary} />
                )}
              </View>

              <View style={{ flex: 1, gap: spacing.xs / 2 }}>
                <Text style={styles.seriesName} numberOfLines={1}>
                  {seriesTitle || 'Panelva Series'}
                </Text>
                <Text style={styles.chapterHeading}>
                  Chapter {chapterIndex}
                  {chapterTitle ? `: ${chapterTitle}` : ''}
                </Text>
              </View>
            </View>

            {/* 1. EARLY ACCESS FLOW */}
            {accessType === 'EARLY_ACCESS' ? (
              <View style={styles.bodySection}>
                <Card style={{ gap: spacing.xs }}>
                  <Text style={styles.earlyAccessHeading}>Early Access Schedule</Text>
                  <Text style={styles.earlyAccessSubheading}>
                    This newly published chapter is currently available exclusively to subscribers during its early access window.
                  </Text>
                </Card>

                {/* Subscription Upgrade Tiers */}
                <View style={styles.tierOptionList}>
                  {/* Premium Option */}
                  <TouchableOpacity
                    onPress={() => handleSelectTier('PREMIUM')}
                    activeOpacity={0.8}
                    accessibilityRole="button"
                    accessibilityLabel="Subscribe to Premium for instant access"
                  >
                    <Card style={[styles.tierOptionCard, { borderColor: colors.warning }]}>
                      <View style={styles.tierCardHeader}>
                        <View style={{ flexDirection: 'row', alignItems: 'center', gap: spacing.xs }}>
                          <Crown size={18} color={colors.warning} />
                          <Text style={styles.tierCardTitle}>Premium</Text>
                        </View>
                        <Badge variant="primary" size="sm">
                          Instant Access
                        </Badge>
                      </View>
                      <Text style={styles.tierCardDesc}>
                        Get instant access to all new series and chapters the second they are published.
                      </Text>
                    </Card>
                  </TouchableOpacity>

                  {/* Plus Option */}
                  <TouchableOpacity
                    onPress={() => handleSelectTier('PLUS')}
                    activeOpacity={0.8}
                    accessibilityRole="button"
                    accessibilityLabel="Subscribe to Plus for early access"
                  >
                    <Card style={[styles.tierOptionCard, { borderColor: colors.primary }]}>
                      <View style={styles.tierCardHeader}>
                        <View style={{ flexDirection: 'row', alignItems: 'center', gap: spacing.xs }}>
                          <Sparkles size={18} color={colors.primary} />
                          <Text style={styles.tierCardTitle}>Plus</Text>
                        </View>
                        <Badge variant="primary" size="sm">
                          {earlyAccessSchedule?.isPlusAvailable
                            ? 'Available Now'
                            : `In ${earlyAccessSchedule?.plusWaitFormatted || '2h'}`}
                        </Badge>
                      </View>
                      <Text style={styles.tierCardDesc}>
                        Get early access 2 hours after Premium subscribers.
                      </Text>
                    </Card>
                  </TouchableOpacity>
                </View>

                {/* Continue Waiting (Free Reader) */}
                <Card style={styles.continueWaitingBox}>
                  <Text style={styles.waitingTitle}>Continue Waiting for Free</Text>
                  <Text style={styles.waitingTimeText}>
                    Available to free readers in{' '}
                    <Text style={{ color: colors.primary, fontWeight: '700' }}>
                      {earlyAccessSchedule?.freeWaitFormatted || '4h'}
                    </Text>
                    {earlyAccessSchedule?.freeAccessTimeFormatted
                      ? ` (at ${earlyAccessSchedule.freeAccessTimeFormatted})`
                      : ''}
                    .
                  </Text>
                  <View style={{ width: '100%', maxWidth: 160, marginTop: spacing.xs }}>
                    <Button title="I'll Wait" variant="secondary" onPress={onClose} />
                  </View>
                </Card>
              </View>
            ) : accessType === 'AD_SUPPORTED' ? (
              /* 2. AD SUPPORTED FLOW */
              <View style={styles.bodySection}>
                <Text style={styles.bodyDescription}>
                  This episode is unlocked by viewing a quick sponsor message.
                </Text>

                {isAdPlaying ? (
                  <Card style={styles.adContainer}>
                    <Text style={styles.adCountdownText}>
                      Sponsor message playing... {adCountdown}s
                    </Text>
                  </Card>
                ) : (
                  <Button
                    title="Watch Ad to Unlock"
                    variant="primary"
                    onPress={handleStartWatchAd}
                  />
                )}
              </View>
            ) : (
              /* 3. PREMIUM CHAPTER FLOW */
              <View style={styles.bodySection}>
                <Text style={styles.bodyDescription}>
                  Unlock this episode using Panelva Credits or subscribe to Panelva Plus for unlimited access.
                </Text>

                {/* Credit balance box */}
                <Card style={styles.balanceCard}>
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: spacing.sm }}>
                    <Coins size={20} color={colors.primary} />
                    <Text style={styles.balanceLabel}>Your Credit Balance:</Text>
                  </View>
                  <Text style={styles.balanceValue}>
                    {creditBalance.toLocaleString()} Credits
                  </Text>
                </Card>

                {/* Unlock Button */}
                <Button
                  title={
                    isUnlocking
                      ? 'Unlocking...'
                      : !isAuthenticated
                      ? 'Sign in to Unlock'
                      : hasEnoughCredits
                      ? `Unlock for ${unlockCost} Credits`
                      : 'Recharge Credits to Unlock'
                  }
                  variant="primary"
                  disabled={isUnlocking}
                  onPress={handleCreditUnlock}
                />

                {/* Secondary wallet recharge link if low balance */}
                {isAuthenticated && !hasEnoughCredits && (
                  <Button
                    title="+ Buy Credits in Wallet"
                    variant="secondary"
                    onPress={() => {
                      onClose();
                      if (onOpenWallet) onOpenWallet();
                    }}
                  />
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
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.75)',
    justifyContent: 'flex-end',
  },
  container: {
    borderTopLeftRadius: radius.lg,
    borderTopRightRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.background,
    maxHeight: '85%',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  headerTitle: {
    fontSize: typography.h3.fontSize,
    lineHeight: typography.h3.lineHeight,
    fontWeight: '700',
    color: colors.text,
  },
  closeBtn: {
    padding: spacing.xs,
    borderRadius: radius.sm,
  },
  content: {
    padding: spacing.md,
    paddingBottom: spacing.xxl,
    gap: spacing.md,
  },
  badgeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
  },
  iconBadge: {
    width: 48,
    height: 48,
    borderRadius: radius.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
  seriesName: {
    color: colors.textMuted,
    fontSize: typography.caption.fontSize,
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 0.4,
  },
  chapterHeading: {
    color: colors.text,
    fontSize: typography.body.fontSize,
    fontWeight: '800',
  },
  bodySection: {
    gap: spacing.md,
  },
  bodyDescription: {
    color: colors.textMuted,
    fontSize: typography.small.fontSize,
    lineHeight: typography.small.lineHeight,
  },
  earlyAccessHeading: {
    color: colors.text,
    fontSize: typography.small.fontSize,
    fontWeight: '700',
  },
  earlyAccessSubheading: {
    color: colors.textMuted,
    fontSize: typography.caption.fontSize,
    lineHeight: typography.caption.lineHeight,
  },
  tierOptionList: {
    gap: spacing.sm,
  },
  tierOptionCard: {
    gap: spacing.xs,
  },
  tierCardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  tierCardTitle: {
    color: colors.text,
    fontSize: typography.small.fontSize,
    fontWeight: '700',
  },
  tierCardDesc: {
    color: colors.textMuted,
    fontSize: typography.caption.fontSize,
    lineHeight: typography.caption.lineHeight,
  },
  continueWaitingBox: {
    alignItems: 'center',
    gap: spacing.xs,
  },
  waitingTitle: {
    color: colors.text,
    fontSize: typography.small.fontSize,
    fontWeight: '600',
  },
  waitingTimeText: {
    color: colors.textMuted,
    fontSize: typography.caption.fontSize,
    textAlign: 'center',
  },
  adContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: spacing.md,
  },
  adCountdownText: {
    color: colors.text,
    fontSize: typography.small.fontSize,
    fontWeight: '700',
  },
  balanceCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  balanceLabel: {
    color: colors.textMuted,
    fontSize: typography.small.fontSize,
    fontWeight: '600',
  },
  balanceValue: {
    color: colors.text,
    fontSize: typography.small.fontSize,
    fontWeight: '800',
  },
});
