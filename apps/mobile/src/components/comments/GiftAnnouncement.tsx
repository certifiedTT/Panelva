import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Trophy, Sparkles, Coins } from 'lucide-react-native';
import { radius, spacing } from '@panelva/theme';

export interface GiftAnnouncementProps {
  senderUsername: string;
  giftName: string;
  credits: number;
}

export function GiftAnnouncement({ senderUsername, giftName, credits }: GiftAnnouncementProps) {
  // Only display for gifts worth >= 2,000 Credits ($20+)
  if (credits < 2000) return null;

  return (
    <View style={styles.container}>
      <View style={styles.iconCircle}>
        <Trophy size={16} color="#111827" />
      </View>

      <View style={styles.textContainer}>
        <View style={styles.headlineRow}>
          <Text style={styles.senderText} numberOfLines={1}>
            {senderUsername}
          </Text>
          <Text style={styles.actionText}> sent a {giftName} Gift</Text>
          <Sparkles size={12} color="#f59e0b" />
        </View>
        <Text style={styles.subtitle}>Supporting the creator</Text>
      </View>

      <View style={styles.creditsPill}>
        <Coins size={12} color="#111827" />
        <Text style={styles.creditsText}>{credits.toLocaleString()} Credits</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#3A2A0A',
    borderColor: '#785412',
    borderWidth: 1,
    borderRadius: radius.md,
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs + 2,
    marginBottom: spacing.sm,
    gap: spacing.xs + 2,
  },
  iconCircle: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: '#f59e0b',
    alignItems: 'center',
    justifyContent: 'center',
  },
  textContainer: {
    flex: 1,
    justifyContent: 'center',
  },
  headlineRow: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
  },
  senderText: {
    fontSize: 12,
    fontWeight: '800',
    color: '#fde68a',
  },
  actionText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#fef3c7',
  },
  subtitle: {
    fontSize: 10,
    color: '#d1d5db',
    marginTop: 1,
  },
  creditsPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#f59e0b',
    paddingHorizontal: spacing.xs + 4,
    paddingVertical: 3,
    borderRadius: radius.full,
  },
  creditsText: {
    fontSize: 11,
    fontWeight: '800',
    color: '#111827',
  },
});
