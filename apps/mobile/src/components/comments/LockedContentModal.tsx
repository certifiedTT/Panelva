import React from 'react';
import { Modal, View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Lock, Crown, Sparkles, UserPlus, X } from 'lucide-react-native';
import { radius, spacing } from '@panelva/theme';

export interface LockedContentModalProps {
  visible: boolean;
  onClose: () => void;
  reason: 'MEMBERSHIP' | 'PLUS' | 'PREMIUM' | 'LOCKED' | 'PAID';
  packTitle?: string;
  creatorName?: string;
  price?: number;
  onAction?: () => void;
}

export function LockedContentModal({
  visible,
  onClose,
  reason,
  packTitle,
  creatorName = 'the creator',
  price,
  onAction,
}: LockedContentModalProps) {
  let title = 'Content Locked';
  let message = 'You do not have access to this sticker.';
  let buttonText = 'Unlock';
  let Icon = Lock;
  let iconColor = '#f59e0b';
  let iconBg = 'rgba(245, 158, 11, 0.15)';

  if (reason === 'MEMBERSHIP') {
    title = 'Creator Pack';
    message = `Join ${creatorName}'s membership to claim and unlock this exclusive sticker pack.`;
    buttonText = 'Join Membership';
    Icon = UserPlus;
    iconColor = '#8b5cf6';
    iconBg = 'rgba(139, 92, 246, 0.15)';
  } else if (reason === 'PLUS') {
    title = 'Panelva Plus Pack';
    message = 'Upgrade to Panelva Plus to unlock this sticker pack and all Plus benefits.';
    buttonText = 'Upgrade to Plus';
    Icon = Sparkles;
    iconColor = '#3b82f6';
    iconBg = 'rgba(59, 130, 246, 0.15)';
  } else if (reason === 'PREMIUM') {
    title = 'Panelva Premium Pack';
    message = 'Upgrade to Panelva Premium to unlock this sticker pack, all Plus packs, and VIP perks.';
    buttonText = 'Upgrade to Premium';
    Icon = Crown;
    iconColor = '#fbbf24';
    iconBg = 'rgba(251, 191, 36, 0.15)';
  } else if (reason === 'PAID') {
    title = 'Paid Pack';
    message = `This pack costs ${price ? price.toLocaleString() : 'credits'} Credits to purchase.`;
    buttonText = `Buy for ${price || 100} Credits`;
    Icon = Lock;
  }

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <View style={styles.overlay}>
        <View style={styles.card}>
          <TouchableOpacity onPress={onClose} style={styles.closeBtn} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
            <X size={18} color="#9ca3af" />
          </TouchableOpacity>

          <View style={[styles.iconCircle, { backgroundColor: iconBg }]}>
            <Icon size={28} color={iconColor} />
          </View>

          <Text style={styles.title}>{title}</Text>
          {packTitle && <Text style={styles.packName}>{packTitle}</Text>}
          <Text style={styles.message}>{message}</Text>

          <TouchableOpacity
            style={[styles.actionBtn, { backgroundColor: iconColor === '#fbbf24' ? '#d97706' : iconColor }]}
            onPress={() => {
              onClose();
              onAction?.();
            }}
          >
            <Text style={styles.actionBtnText}>{buttonText}</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.75)',
    alignItems: 'center',
    justifyContent: 'center',
    padding: spacing.lg,
  },
  card: {
    width: '100%',
    maxWidth: 340,
    backgroundColor: '#111827',
    borderRadius: radius.lg,
    padding: spacing.lg,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#1f2937',
    position: 'relative',
  },
  closeBtn: {
    position: 'absolute',
    top: spacing.md,
    right: spacing.md,
    padding: 4,
  },
  iconCircle: {
    width: 60,
    height: 60,
    borderRadius: 30,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.sm + 4,
  },
  title: {
    fontSize: 16,
    fontWeight: '800',
    color: '#fff',
    textAlign: 'center',
  },
  packName: {
    fontSize: 13,
    fontWeight: '700',
    color: '#60a5fa',
    marginTop: 2,
  },
  message: {
    fontSize: 12,
    color: '#9ca3af',
    textAlign: 'center',
    marginTop: spacing.xs + 4,
    lineHeight: 18,
    marginBottom: spacing.md,
  },
  actionBtn: {
    width: '100%',
    height: 42,
    borderRadius: radius.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
  actionBtnText: {
    color: '#fff',
    fontWeight: '800',
    fontSize: 13,
  },
});
