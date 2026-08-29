import React from 'react';
import {
  StyleSheet,
  Text,
  View,
  TouchableOpacity,
  Modal,
} from 'react-native';
import {
  ChevronLeftIcon,
  ChevronRightIcon,
  SettingsIcon,
  NovelsIcon,
  CommentIcon,
  LockIcon,
} from '../common/Icons';

interface ReaderTutorialOverlayProps {
  visible: boolean;
  onDismiss: () => void;
  format: 'comic' | 'novel';
}

export function ReaderTutorialOverlay({
  visible,
  onDismiss,
  format,
}: ReaderTutorialOverlayProps) {
  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onDismiss}>
      <View style={styles.backdrop}>
        {/* Top hint: Navigation & Mode */}
        <View style={styles.topHintContainer}>
          <View style={styles.hintBadge}>
            <Text style={styles.hintBadgeText}>Reader Controls Guide</Text>
          </View>
          <Text style={styles.hintTitle}>Tap Center to Toggle Controls</Text>
          <Text style={styles.hintSubtitle}>
            Tap anywhere in the center zone to reveal the chapter index, comments, and display settings.
          </Text>
        </View>

        {/* Center Guide Visuals */}
        <View style={styles.centerVisualsContainer}>
          {format === 'comic' ? (
            <View style={styles.zoneGrid}>
              <View style={styles.zoneBox}>
                <View style={styles.iconCircle}>
                  <ChevronLeftIcon size={20} color="#a855f7" />
                </View>
                <Text style={styles.zoneTitle}>Prev Page</Text>
                <Text style={styles.zoneDesc}>Tap Left Edge</Text>
              </View>

              <View style={[styles.zoneBox, styles.zoneBoxCenter]}>
                <View style={[styles.iconCircle, { backgroundColor: 'rgba(168, 85, 247, 0.2)' }]}>
                  <SettingsIcon size={20} color="#c084fc" />
                </View>
                <Text style={styles.zoneTitle}>Menu & Stats</Text>
                <Text style={styles.zoneDesc}>Tap Center</Text>
              </View>

              <View style={styles.zoneBox}>
                <View style={styles.iconCircle}>
                  <ChevronRightIcon size={20} color="#a855f7" />
                </View>
                <Text style={styles.zoneTitle}>Next Page</Text>
                <Text style={styles.zoneDesc}>Tap Right / Scroll</Text>
              </View>
            </View>
          ) : (
            <View style={styles.zoneGrid}>
              <View style={styles.zoneBox}>
                <View style={styles.iconCircle}>
                  <NovelsIcon size={20} color="#a855f7" />
                </View>
                <Text style={styles.zoneTitle}>Continuous Scroll</Text>
                <Text style={styles.zoneDesc}>Vertical reading mode</Text>
              </View>

              <View style={[styles.zoneBox, styles.zoneBoxCenter]}>
                <View style={[styles.iconCircle, { backgroundColor: 'rgba(168, 85, 247, 0.2)' }]}>
                  <CommentIcon size={20} color="#c084fc" />
                </View>
                <Text style={styles.zoneTitle}>Community Reactions</Text>
                <Text style={styles.zoneDesc}>Comment on paragraphs</Text>
              </View>
            </View>
          )}
        </View>

        {/* Bottom CTA Card */}
        <View style={styles.bottomCard}>
          <View style={styles.perkRow}>
            <View style={[styles.iconCircle, { width: 32, height: 32, borderRadius: 16 }]}>
              <LockIcon size={16} color="#fbbf24" />
            </View>
            <Text style={styles.perkText}>
              Locked chapters can be unlocked using Credits or rewarded video ads.
            </Text>
          </View>

          <TouchableOpacity style={styles.dismissBtn} onPress={onDismiss} accessibilityRole="button" accessibilityLabel="Start reading">
            <Text style={styles.dismissBtnText}>Got it! Start Reading</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(5, 5, 10, 0.88)',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 40,
  },
  topHintContainer: {
    alignItems: 'center',
    marginTop: 20,
  },
  hintBadge: {
    backgroundColor: 'rgba(168, 85, 247, 0.25)',
    borderColor: '#a855f7',
    borderWidth: 1,
    paddingHorizontal: 12,
    paddingVertical: 5,
    borderRadius: 12,
    marginBottom: 10,
  },
  hintBadgeText: {
    color: '#c084fc',
    fontSize: 12,
    fontWeight: '700',
    textTransform: 'uppercase',
  },
  hintTitle: {
    color: '#FFFFFF',
    fontSize: 20,
    fontWeight: '800',
    textAlign: 'center',
    marginBottom: 6,
  },
  hintSubtitle: {
    color: '#9CA3AF',
    fontSize: 13,
    textAlign: 'center',
    lineHeight: 18,
    paddingHorizontal: 10,
  },
  centerVisualsContainer: {
    marginVertical: 20,
  },
  zoneGrid: {
    flexDirection: 'row',
    gap: 10,
    justifyContent: 'center',
  },
  zoneBox: {
    flex: 1,
    backgroundColor: 'rgba(30, 30, 45, 0.7)',
    borderColor: 'rgba(107, 114, 128, 0.4)',
    borderWidth: 1.5,
    borderStyle: 'dashed',
    borderRadius: 14,
    paddingVertical: 20,
    paddingHorizontal: 8,
    alignItems: 'center',
  },
  zoneBoxCenter: {
    borderColor: '#a855f7',
    backgroundColor: 'rgba(168, 85, 247, 0.12)',
  },
  iconCircle: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(168, 85, 247, 0.15)',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 8,
  },
  zoneTitle: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '700',
    textAlign: 'center',
    marginBottom: 4,
  },
  zoneDesc: {
    color: '#9CA3AF',
    fontSize: 11,
    textAlign: 'center',
  },
  bottomCard: {
    backgroundColor: '#13131F',
    borderColor: '#232336',
    borderWidth: 1,
    borderRadius: 16,
    padding: 18,
  },
  perkRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginBottom: 16,
  },
  perkText: {
    flex: 1,
    color: '#D1D5DB',
    fontSize: 12,
    lineHeight: 17,
  },
  dismissBtn: {
    backgroundColor: '#8b5cf6',
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: 'center',
  },
  dismissBtnText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '700',
  },
});
