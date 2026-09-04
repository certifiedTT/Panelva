import React, { useState } from 'react';
import {
  Modal,
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Dimensions,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useTheme } from '../../theme/ThemeContext';
import {
  HomeIcon,
  SeriesIcon,
  CreatorHubIcon,
  AlertsIcon,
  BookmarkIcon,
  CreditsIcon,
  BookOpenIcon,
  ChevronLeftIcon,
  ChevronRightIcon,
  CloseIcon,
  SparklesIcon,
} from '../common/Icons';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
export const PLATFORM_TOUR_STORAGE_KEY = '@panelva_has_seen_platform_tour';

interface GuideStep {
  id: string;
  title: string;
  subtitle: string;
  badge: string;
  icon: (color: string) => React.ReactNode;
  highlights: string[];
}

const GUIDE_STEPS: GuideStep[] = [
  {
    id: 'home',
    title: 'Welcome to Panelva',
    subtitle: 'Your next-generation digital publishing platform for high-quality webcomics, manhwa, and light novels.',
    badge: 'Home & Highlights',
    icon: (c) => <HomeIcon size={32} color={c} />,
    highlights: [
      'Featured release carousels',
      'Instant "Continue Reading" resume',
      'Trending community charts',
    ],
  },
  {
    id: 'series',
    title: 'Discover & Search',
    subtitle: 'Easily explore thousands of episodes across Fantasy, Action, Romance, Sci-Fi, and more.',
    badge: 'Library Discovery',
    icon: (c) => <SeriesIcon size={32} color={c} />,
    highlights: [
      'Filter by Comics, Manhwa, or Novels',
      'Fast keyword and author search',
      'Sort by popularity, likes, or newest',
    ],
  },
  {
    id: 'reader',
    title: 'Immersive Reading Experience',
    subtitle: 'Enjoy gapless vertical comic reading and customizable typography for light novels.',
    badge: 'Content Reader',
    icon: (c) => <BookOpenIcon size={32} color={c} />,
    highlights: [
      'Continuous smooth vertical scroll',
      'Adjustable novel font sizes & line height',
      'Automatic reading progress synchronization',
    ],
  },
  {
    id: 'creator_hub',
    title: 'Creator Community & Studio',
    subtitle: 'Connect with storytellers, view concept artwork, vote in polls, or publish your own work.',
    badge: 'Creator Hub',
    icon: (c) => <CreatorHubIcon size={32} color={c} />,
    highlights: [
      'Direct creator feeds & updates',
      'Interactive reader polls & reactions',
      'Creator studio & collaboration splits',
    ],
  },
  {
    id: 'alerts',
    title: 'Release Alerts & Activity',
    subtitle: 'Never miss an episode drop from creators you follow.',
    badge: 'Notifications',
    icon: (c) => <AlertsIcon size={32} color={c} />,
    highlights: [
      'Instant chapter drop notifications',
      'Platform announcements & rewards',
      'Creator collaboration requests',
    ],
  },
  {
    id: 'library',
    title: 'Cloud Library & Bookmarks',
    subtitle: 'Keep your personal reading history and bookmarks synchronized across web and mobile.',
    badge: 'Account & Library',
    icon: (c) => <BookmarkIcon size={32} color={c} />,
    highlights: [
      'One-tap series bookmarking',
      'Detailed reading history with progress',
      'Offline encrypted access',
    ],
  },
  {
    id: 'memberships',
    title: 'Credits & Creator Memberships',
    subtitle: 'Directly support your favorite authors and unlock early-access chapters.',
    badge: 'Wallet & Support',
    icon: (c) => <CreditsIcon size={32} color={c} />,
    highlights: [
      'Ad-supported and Free chapters',
      'Credits wallet system',
      'Supporter tiers with exclusive perks',
    ],
  },
];

interface InteractivePlatformGuideProps {
  visible: boolean;
  onDismiss: () => void;
  onNavigateToTab?: (tab: string) => void;
}

export function InteractivePlatformGuide({
  visible,
  onDismiss,
  onNavigateToTab,
}: InteractivePlatformGuideProps) {
  const { colors } = useTheme();
  const [currentStepIndex, setCurrentStepIndex] = useState(0);

  const currentStep = GUIDE_STEPS[currentStepIndex];
  const isFirstStep = currentStepIndex === 0;
  const isLastStep = currentStepIndex === GUIDE_STEPS.length - 1;

  const handleNext = async () => {
    if (isLastStep) {
      await handleComplete();
    } else {
      setCurrentStepIndex((prev) => prev + 1);
    }
  };

  const handleBack = () => {
    if (!isFirstStep) {
      setCurrentStepIndex((prev) => prev - 1);
    }
  };

  const handleComplete = async () => {
    try {
      await AsyncStorage.setItem(PLATFORM_TOUR_STORAGE_KEY, 'true');
    } catch {
      // ignore
    }
    onDismiss();
    setCurrentStepIndex(0);
  };

  if (!visible) return null;

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={handleComplete}>
      <View style={styles.overlay}>
        <View style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.border }]}>
          {/* Header */}
          <View style={styles.cardHeader}>
            <View style={[styles.stepBadge, { backgroundColor: colors.primaryMuted }]}>
              <Text style={[styles.stepBadgeText, { color: colors.primary }]}>
                {currentStep.badge} • Step {currentStepIndex + 1}/{GUIDE_STEPS.length}
              </Text>
            </View>

            <TouchableOpacity onPress={handleComplete} style={styles.closeBtn}>
              <CloseIcon size={18} color={colors.textMuted} />
            </TouchableOpacity>
          </View>

          {/* Icon Hero */}
          <View style={styles.heroRow}>
            <View style={[styles.iconCircle, { backgroundColor: colors.primaryMuted, borderColor: colors.primary }]}>
              {currentStep.icon(colors.primary)}
            </View>
            <View style={{ flex: 1 }}>
              <Text style={[styles.title, { color: colors.text }]}>{currentStep.title}</Text>
            </View>
          </View>

          {/* Description */}
          <Text style={[styles.subtitle, { color: colors.textSecondary }]}>
            {currentStep.subtitle}
          </Text>

          {/* Key Highlights */}
          <View style={[styles.highlightsBox, { backgroundColor: colors.surfaceElevated, borderColor: colors.borderSubtle }]}>
            {currentStep.highlights.map((h, i) => (
              <View key={i} style={styles.highlightItem}>
                <View style={[styles.highlightDot, { backgroundColor: colors.primary }]} />
                <Text style={[styles.highlightText, { color: colors.textSecondary }]}>{h}</Text>
              </View>
            ))}
          </View>

          {/* Pagination dots */}
          <View style={styles.dotsRow}>
            {GUIDE_STEPS.map((_, idx) => (
              <View
                key={idx}
                style={[
                  styles.dot,
                  { backgroundColor: idx === currentStepIndex ? colors.primary : colors.border },
                  idx === currentStepIndex && { width: 20 },
                ]}
              />
            ))}
          </View>

          {/* Navigation Actions */}
          <View style={styles.actionsRow}>
            {!isFirstStep ? (
              <TouchableOpacity
                style={[styles.backBtn, { borderColor: colors.border }]}
                onPress={handleBack}
                activeOpacity={0.7}
              >
                <ChevronLeftIcon size={18} color={colors.textSecondary} />
                <Text style={[styles.backBtnText, { color: colors.textSecondary }]}>Back</Text>
              </TouchableOpacity>
            ) : (
              <TouchableOpacity style={styles.skipBtn} onPress={handleComplete} activeOpacity={0.7}>
                <Text style={[styles.skipBtnText, { color: colors.textMuted }]}>Skip Tour</Text>
              </TouchableOpacity>
            )}

            <TouchableOpacity
              style={[styles.nextBtn, { backgroundColor: colors.primary }]}
              onPress={handleNext}
              activeOpacity={0.85}
            >
              <Text style={styles.nextBtnText}>{isLastStep ? 'Get Started' : 'Next'}</Text>
              {!isLastStep && <ChevronRightIcon size={18} color="#FFFFFF" />}
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(5, 5, 12, 0.85)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  card: {
    width: '100%',
    maxWidth: 420,
    borderRadius: 20,
    borderWidth: 1.5,
    padding: 22,
    gap: 16,
    elevation: 8,
    shadowColor: '#2563EB',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.25,
    shadowRadius: 16,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  stepBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 6,
  },
  stepBadgeText: {
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 0.3,
  },
  closeBtn: {
    padding: 4,
  },
  heroRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
  },
  iconCircle: {
    width: 60,
    height: 60,
    borderRadius: 18,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: {
    fontSize: 19,
    fontWeight: '900',
    letterSpacing: -0.3,
  },
  subtitle: {
    fontSize: 13,
    lineHeight: 19,
  },
  highlightsBox: {
    padding: 14,
    borderRadius: 12,
    borderWidth: 1,
    gap: 8,
  },
  highlightItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  highlightDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  highlightText: {
    fontSize: 12,
    fontWeight: '500',
  },
  dotsRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 6,
    paddingVertical: 2,
  },
  dot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  actionsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 12,
    marginTop: 4,
  },
  skipBtn: {
    paddingVertical: 10,
    paddingHorizontal: 12,
  },
  skipBtnText: {
    fontSize: 13,
    fontWeight: '600',
  },
  backBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingVertical: 10,
    paddingHorizontal: 14,
    borderRadius: 10,
    borderWidth: 1,
  },
  backBtnText: {
    fontSize: 13,
    fontWeight: '700',
  },
  nextBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 12,
    borderRadius: 10,
  },
  nextBtnText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '700',
  },
});
