import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Modal,
  Alert,
} from 'react-native';
import {
  X,
  Coins,
  Sparkles,
  Coffee,
  Gem,
  Crown,
  Flame,
  Globe,
  Zap,
  Star,
} from 'lucide-react-native';
import { radius, spacing } from '@panelva/theme';

export interface GiftItem {
  id: string;
  name: string;
  credits: number;
  icon: React.ComponentType<{ size?: number; color?: string }>;
  color: string;
  tier: 0 | 1 | 2 | 3;
}

export const GIFT_CATALOG: GiftItem[] = [
  { id: 'rose', name: 'Rose', credits: 5, icon: Sparkles, color: '#f43f5e', tier: 0 },
  { id: 'coffee', name: 'Coffee', credits: 20, icon: Coffee, color: '#d97706', tier: 0 },
  { id: 'crystal', name: 'Crystal', credits: 100, icon: Gem, color: '#06b6d4', tier: 0 },
  { id: 'crown', name: 'Crown', credits: 400, icon: Crown, color: '#eab308', tier: 0 },
  { id: 'phoenix', name: 'Phoenix', credits: 1000, icon: Flame, color: '#f97316', tier: 0 },
  { id: 'galaxy', name: 'Galaxy', credits: 2000, icon: Globe, color: '#8b5cf6', tier: 1 },
  { id: 'dragon', name: 'Dragon', credits: 5000, icon: Zap, color: '#ec4899', tier: 2 },
  { id: 'supernova', name: 'Supernova', credits: 10000, icon: Star, color: '#f59e0b', tier: 3 },
];

export interface GiftDrawerProps {
  visible: boolean;
  onClose: () => void;
  userCredits: number;
  onSendGift: (gift: GiftItem) => void;
}

export function GiftDrawer({
  visible,
  onClose,
  userCredits,
  onSendGift,
}: GiftDrawerProps) {
  const [selectedGiftId, setSelectedGiftId] = useState<string>('rose');

  const selectedGift = GIFT_CATALOG.find((g) => g.id === selectedGiftId) || GIFT_CATALOG[0];

  const handleSend = () => {
    if (userCredits < selectedGift.credits) {
      Alert.alert(
        'Insufficient Credits',
        `You have ${userCredits} Credits, but ${selectedGift.name} costs ${selectedGift.credits.toLocaleString()} Credits. Please recharge your wallet.`
      );
      return;
    }
    onSendGift(selectedGift);
    onClose();
  };

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <View style={styles.overlay}>
        <View style={styles.sheetContainer}>
          {/* Drag Handle */}
          <View style={styles.dragHandleRow}>
            <View style={styles.dragHandle} />
          </View>

          {/* Header Row with Credit Balance */}
          <View style={styles.headerRow}>
            <View>
              <Text style={styles.sheetTitle}>Send a Gift</Text>
              <Text style={styles.sheetSubtitle}>Support creators directly</Text>
            </View>

            <View style={styles.balanceBadge}>
              <Coins size={14} color="#60a5fa" />
              <Text style={styles.balanceText}>{userCredits.toLocaleString()} Credits</Text>
            </View>
          </View>

          {/* Gift Grid */}
          <ScrollView contentContainerStyle={styles.gridContent} showsVerticalScrollIndicator={false}>
            <View style={styles.grid}>
              {GIFT_CATALOG.map((gift) => {
                const Icon = gift.icon;
                const isSelected = selectedGiftId === gift.id;
                const isHighTier = gift.tier > 0;

                return (
                  <TouchableOpacity
                    key={gift.id}
                    style={[
                      styles.giftCard,
                      isSelected && styles.giftCardSelected,
                      isHighTier && isSelected && { borderColor: '#f59e0b' },
                    ]}
                    onPress={() => setSelectedGiftId(gift.id)}
                    activeOpacity={0.7}
                  >
                    {isHighTier && (
                      <View style={styles.tierBadge}>
                        <Text style={styles.tierBadgeText}>Tier {gift.tier}</Text>
                      </View>
                    )}

                    <View
                      style={[
                        styles.iconWrapper,
                        { backgroundColor: isSelected ? 'rgba(37, 99, 235, 0.15)' : '#1F2937' },
                      ]}
                    >
                      <Icon size={24} color={gift.color} />
                    </View>

                    <Text style={styles.giftName}>{gift.name}</Text>
                    <View style={styles.creditsRow}>
                      <Coins size={10} color="#fbbf24" />
                      <Text style={styles.creditsAmount}>{gift.credits.toLocaleString()}</Text>
                    </View>
                  </TouchableOpacity>
                );
              })}
            </View>
          </ScrollView>

          {/* Send Gift Button */}
          <View style={styles.footerContainer}>
            <TouchableOpacity
              style={styles.sendButton}
              onPress={handleSend}
              activeOpacity={0.8}
            >
              <Text style={styles.sendButtonText}>
                Send {selectedGift.name} ({selectedGift.credits.toLocaleString()} Credits)
              </Text>
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
    backgroundColor: 'rgba(0, 0, 0, 0.65)',
    justifyContent: 'flex-end',
  },
  sheetContainer: {
    backgroundColor: '#111827',
    borderTopLeftRadius: 18,
    borderTopRightRadius: 18,
    borderTopWidth: 1,
    borderColor: '#1F2937',
    maxHeight: '65%',
    paddingBottom: spacing.lg,
  },
  dragHandleRow: {
    alignItems: 'center',
    paddingVertical: spacing.xs + 2,
  },
  dragHandle: {
    width: 48,
    height: 4,
    borderRadius: 2,
    backgroundColor: '#4B5563',
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.md,
    marginBottom: spacing.sm,
  },
  sheetTitle: {
    fontSize: 15,
    fontWeight: '800',
    color: '#fff',
  },
  sheetSubtitle: {
    fontSize: 11,
    color: '#9ca3af',
  },
  balanceBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    backgroundColor: 'rgba(59, 130, 246, 0.15)',
    paddingHorizontal: spacing.sm,
    paddingVertical: 5,
    borderRadius: radius.full,
    borderWidth: 1,
    borderColor: 'rgba(59, 130, 246, 0.3)',
  },
  balanceText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#60a5fa',
  },
  gridContent: {
    paddingHorizontal: spacing.md,
    paddingTop: spacing.xs,
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
    justifyContent: 'space-between',
  },
  giftCard: {
    width: '23%',
    backgroundColor: '#1F2937',
    borderRadius: radius.md,
    paddingVertical: spacing.sm,
    paddingHorizontal: 4,
    alignItems: 'center',
    borderWidth: 1.5,
    borderColor: '#374151',
    position: 'relative',
  },
  giftCardSelected: {
    borderColor: '#2563EB',
    backgroundColor: '#172554',
  },
  tierBadge: {
    position: 'absolute',
    top: 3,
    right: 3,
    backgroundColor: 'rgba(245, 158, 11, 0.25)',
    paddingHorizontal: 4,
    paddingVertical: 1,
    borderRadius: 4,
  },
  tierBadgeText: {
    fontSize: 8,
    fontWeight: '800',
    color: '#f59e0b',
  },
  iconWrapper: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 4,
  },
  giftName: {
    fontSize: 11,
    fontWeight: '600',
    color: '#E5E7EB',
    marginBottom: 2,
    textAlign: 'center',
  },
  creditsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
  },
  creditsAmount: {
    fontSize: 10,
    fontWeight: '700',
    color: '#FBBF24',
  },
  footerContainer: {
    paddingHorizontal: spacing.md,
    paddingTop: spacing.sm,
  },
  sendButton: {
    backgroundColor: '#2563EB',
    borderRadius: radius.md,
    height: 42,
    alignItems: 'center',
    justifyContent: 'center',
  },
  sendButtonText: {
    color: '#FFFFFF',
    fontWeight: '800',
    fontSize: 13,
  },
});
