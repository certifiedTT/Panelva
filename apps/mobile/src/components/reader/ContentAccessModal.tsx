import React, { useState } from 'react';
import {
  Modal,
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
  ScrollView,
} from 'react-native';
import { useTheme } from '../../theme/ThemeContext';
import {
  CloseIcon,
  CrownIcon,
  CreditsIcon,
  SparklesIcon,
  CheckIcon,
  LockIcon,
  BookOpenIcon,
  ChevronRightIcon,
} from '../common/Icons';
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
  const { colors } = useTheme();
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
        <View style={[styles.container, { backgroundColor: '#1A1A2E', borderColor: '#28283C' }]}>
          {/* Header */}
          <View style={[styles.header, { borderBottomColor: '#28283C' }]}>
            <Text style={[styles.headerTitle, { color: '#FFFFFF' }]}>
              {accessType === 'EARLY_ACCESS'
                ? 'Early Access Release'
                : accessType === 'PREMIUM'
                ? 'Premium Chapter Access'
                : 'Ad-Supported Chapter'}
            </Text>
            <TouchableOpacity onPress={onClose} style={styles.closeBtn} accessibilityLabel="Close">
              <CloseIcon size={20} color="#94A3B8" />
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
                        ? 'rgba(37, 99, 235, 0.2)'
                        : accessType === 'PREMIUM'
                        ? 'rgba(251, 191, 36, 0.15)'
                        : 'rgba(59, 130, 246, 0.15)',
                  },
                ]}
              >
                {accessType === 'EARLY_ACCESS' ? (
                  <SparklesIcon size={26} color="#3B82F6" />
                ) : accessType === 'PREMIUM' ? (
                  <CrownIcon size={26} color="#FBBF24" />
                ) : (
                  <SparklesIcon size={26} color="#3B82F6" />
                )}
              </View>

              <View style={{ flex: 1 }}>
                <Text style={styles.seriesName} numberOfLines={1}>
                  {seriesTitle || 'Panelva Series'}
                </Text>
                <Text style={styles.chapterHeading}>
                  Chapter {chapterIndex}{chapterTitle ? `: ${chapterTitle}` : ''}
                </Text>
              </View>
            </View>

            {/* 1. EARLY ACCESS FLOW */}
            {accessType === 'EARLY_ACCESS' ? (
              <View style={styles.bodySection}>
                <View style={styles.earlyAccessNoticeBox}>
                  <Text style={styles.earlyAccessHeading}>Early Access Schedule</Text>
                  <Text style={styles.earlyAccessSubheading}>
                    This newly published chapter is currently available exclusively to subscribers during its early access window.
                  </Text>
                </View>

                {/* Subscription Upgrade Tiers */}
                <View style={styles.tierOptionList}>
                  {/* Premium Option */}
                  <TouchableOpacity
                    style={[styles.tierOptionCard, styles.premiumOptionCard]}
                    onPress={() => handleSelectTier('PREMIUM')}
                    activeOpacity={0.8}
                  >
                    <View style={styles.tierCardHeader}>
                      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                        <CrownIcon size={18} color="#FBBF24" />
                        <Text style={styles.tierCardTitle}>Premium</Text>
                      </View>
                      <View style={styles.instantTag}>
                        <Text style={styles.instantTagText}>Instant Access</Text>
                      </View>
                    </View>
                    <Text style={styles.tierCardDesc}>
                      Get instant access to all new series and chapters the second they are published.
                    </Text>
                  </TouchableOpacity>

                  {/* Plus Option */}
                  <TouchableOpacity
                    style={[styles.tierOptionCard, styles.plusOptionCard]}
                    onPress={() => handleSelectTier('PLUS')}
                    activeOpacity={0.8}
                  >
                    <View style={styles.tierCardHeader}>
                      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                        <SparklesIcon size={18} color="#3B82F6" />
                        <Text style={styles.tierCardTitle}>Plus</Text>
                      </View>
                      <View style={styles.plusTag}>
                        <Text style={styles.plusTagText}>
                          {earlyAccessSchedule?.isPlusAvailable
                            ? 'Available Now'
                            : `In ${earlyAccessSchedule?.plusWaitFormatted || '2h'}`}
                        </Text>
                      </View>
                    </View>
                    <Text style={styles.tierCardDesc}>
                      Get early access 2 hours after Premium subscribers.
                    </Text>
                  </TouchableOpacity>
                </View>

                {/* Continue Waiting (Free Reader) */}
                <View style={styles.continueWaitingBox}>
                  <Text style={styles.waitingTitle}>Continue Waiting for Free</Text>
                  <Text style={styles.waitingTimeText}>
                    Available to free readers in{' '}
                    <Text style={{ color: '#60A5FA', fontWeight: '700' }}>
                      {earlyAccessSchedule?.freeWaitFormatted || '4h'}
                    </Text>
                    {earlyAccessSchedule?.freeAccessTimeFormatted
                      ? ` (at ${earlyAccessSchedule.freeAccessTimeFormatted})`
                      : ''}
                    .
                  </Text>
                  <TouchableOpacity
                    style={styles.closeWaitingBtn}
                    onPress={onClose}
                    activeOpacity={0.7}
                  >
                    <Text style={styles.closeWaitingBtnText}>I'll Wait</Text>
                  </TouchableOpacity>
                </View>
              </View>
            ) : accessType === 'AD_SUPPORTED' ? (
              /* 2. AD SUPPORTED FLOW */
              <View style={styles.bodySection}>
                <Text style={styles.bodyDescription}>
                  This episode is unlocked by viewing a quick sponsor message.
                </Text>

                {isAdPlaying ? (
                  <View style={styles.adContainer}>
                    <ActivityIndicator size="small" color="#2563EB" />
                    <Text style={styles.adCountdownText}>
                      Sponsor message playing... {adCountdown}s
                    </Text>
                  </View>
                ) : (
                  <TouchableOpacity
                    style={[styles.primaryActionBtn, { backgroundColor: '#2563EB' }]}
                    onPress={handleStartWatchAd}
                    activeOpacity={0.85}
                  >
                    <SparklesIcon size={18} color="#FFFFFF" />
                    <Text style={styles.primaryActionBtnText}>Watch Ad to Unlock</Text>
                  </TouchableOpacity>
                )}
              </View>
            ) : (
              /* 3. PREMIUM CHAPTER FLOW */
              <View style={styles.bodySection}>
                <Text style={styles.bodyDescription}>
                  Unlock this episode using Panelva Credits or subscribe to Panelva Plus for unlimited access.
                </Text>

                {/* Credit balance box */}
                <View style={styles.balanceCard}>
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                    <CreditsIcon size={20} color="#3B82F6" />
                    <Text style={styles.balanceLabel}>Your Credit Balance:</Text>
                  </View>
                  <Text style={styles.balanceValue}>
                    {creditBalance.toLocaleString()} Credits
                  </Text>
                </View>

                {/* Unlock Button */}
                <TouchableOpacity
                  style={[
                    styles.primaryActionBtn,
                    {
                      backgroundColor: hasEnoughCredits || !isAuthenticated ? '#2563EB' : '#12121E',
                      borderColor: '#28283C',
                      borderWidth: hasEnoughCredits || !isAuthenticated ? 0 : 1,
                    },
                  ]}
                  onPress={handleCreditUnlock}
                  disabled={isUnlocking}
                  activeOpacity={0.85}
                >
                  {isUnlocking ? (
                    <ActivityIndicator size="small" color="#FFFFFF" />
                  ) : (
                    <>
                      <CreditsIcon size={18} color={hasEnoughCredits || !isAuthenticated ? '#FFFFFF' : '#3B82F6'} />
                      <Text
                        style={[
                          styles.primaryActionBtnText,
                          { color: hasEnoughCredits || !isAuthenticated ? '#FFFFFF' : '#E2E8F0' },
                        ]}
                      >
                        {!isAuthenticated
                          ? 'Sign in to Unlock'
                          : hasEnoughCredits
                          ? `Unlock for ${unlockCost} Credits`
                          : 'Recharge Credits to Unlock'}
                      </Text>
                    </>
                  )}
                </TouchableOpacity>

                {/* Secondary wallet recharge link if low balance */}
                {isAuthenticated && !hasEnoughCredits && (
                  <TouchableOpacity
                    style={styles.secondaryActionBtn}
                    onPress={() => {
                      onClose();
                      if (onOpenWallet) onOpenWallet();
                    }}
                  >
                    <Text style={styles.secondaryActionBtnText}>
                      + Buy Credits in Wallet
                    </Text>
                  </TouchableOpacity>
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
    backgroundColor: 'rgba(5, 5, 10, 0.75)',
    justifyContent: 'flex-end',
  },
  container: {
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    borderWidth: 1,
    maxHeight: '85%',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderBottomWidth: 1,
  },
  headerTitle: {
    fontSize: 16,
    fontWeight: '700',
  },
  closeBtn: {
    padding: 6,
  },
  content: {
    padding: 18,
    paddingBottom: 36,
    gap: 16,
  },
  badgeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
  },
  iconBadge: {
    width: 52,
    height: 52,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  seriesName: {
    color: '#94A3B8',
    fontSize: 12,
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 0.4,
  },
  chapterHeading: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '800',
    marginTop: 2,
  },
  bodySection: {
    gap: 14,
  },
  bodyDescription: {
    color: '#94A3B8',
    fontSize: 13,
    lineHeight: 18,
  },
  earlyAccessNoticeBox: {
    backgroundColor: '#0F0F1A',
    padding: 14,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#28283C',
  },
  earlyAccessHeading: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '700',
    marginBottom: 4,
  },
  earlyAccessSubheading: {
    color: '#94A3B8',
    fontSize: 12,
    lineHeight: 17,
  },
  tierOptionList: {
    gap: 10,
  },
  tierOptionCard: {
    padding: 14,
    borderRadius: 12,
    borderWidth: 1,
    backgroundColor: '#12121E',
  },
  premiumOptionCard: {
    borderColor: 'rgba(251, 191, 36, 0.4)',
    backgroundColor: 'rgba(251, 191, 36, 0.05)',
  },
  plusOptionCard: {
    borderColor: 'rgba(37, 99, 235, 0.4)',
    backgroundColor: 'rgba(37, 99, 235, 0.05)',
  },
  tierCardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 6,
  },
  tierCardTitle: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '700',
  },
  instantTag: {
    backgroundColor: '#FBBF24',
    paddingVertical: 2,
    paddingHorizontal: 8,
    borderRadius: 6,
  },
  instantTagText: {
    color: '#000000',
    fontSize: 11,
    fontWeight: '700',
  },
  plusTag: {
    backgroundColor: '#2563EB',
    paddingVertical: 2,
    paddingHorizontal: 8,
    borderRadius: 6,
  },
  plusTagText: {
    color: '#FFFFFF',
    fontSize: 11,
    fontWeight: '700',
  },
  tierCardDesc: {
    color: '#94A3B8',
    fontSize: 12,
    lineHeight: 16,
  },
  continueWaitingBox: {
    padding: 12,
    borderRadius: 10,
    backgroundColor: '#0F0F1A',
    borderWidth: 1,
    borderColor: '#28283C',
    alignItems: 'center',
    gap: 6,
  },
  waitingTitle: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '600',
  },
  waitingTimeText: {
    color: '#94A3B8',
    fontSize: 12,
    textAlign: 'center',
  },
  closeWaitingBtn: {
    marginTop: 4,
    paddingVertical: 6,
    paddingHorizontal: 16,
    borderRadius: 8,
    backgroundColor: '#24243E',
  },
  closeWaitingBtnText: {
    color: '#E2E8F0',
    fontSize: 12,
    fontWeight: '600',
  },
  adContainer: {
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#28283C',
    backgroundColor: '#12121E',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
  },
  adCountdownText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '700',
  },
  balanceCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 12,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#28283C',
    backgroundColor: '#12121E',
  },
  balanceLabel: {
    color: '#94A3B8',
    fontSize: 13,
    fontWeight: '600',
  },
  balanceValue: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '800',
  },
  primaryActionBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 13,
    borderRadius: 10,
    gap: 8,
  },
  primaryActionBtnText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '700',
  },
  secondaryActionBtn: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 11,
    borderRadius: 10,
    backgroundColor: 'rgba(37, 99, 235, 0.15)',
  },
  secondaryActionBtnText: {
    color: '#3B82F6',
    fontSize: 13,
    fontWeight: '700',
  },
});
