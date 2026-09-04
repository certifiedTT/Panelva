import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  SafeAreaView,
  TouchableOpacity,
  ScrollView,
} from 'react-native';
import * as Haptics from 'expo-haptics';
import { colors, spacing, radius, typography } from '@panelva/theme';
import { Card } from '../common/Card';
import {
  MOCK_ACCOUNTS_MAP,
  MOCK_ACCOUNTS_LIST,
  MockRoleKey,
} from '../../data/mockRoles';

// Lucide Line Icons
import {
  X,
  Check,
  Sparkles,
  Crown,
} from 'lucide-react-native';

export interface DevRoleSwitcherModalProps {
  visible: boolean;
  onClose: () => void;
  activeRole: MockRoleKey | string | null;
  onSelectRole: (roleKey: MockRoleKey) => void;
}

export function DevRoleSwitcherModal({
  visible,
  onClose,
  activeRole,
  onSelectRole,
}: DevRoleSwitcherModalProps) {
  const [selectedCategory, setSelectedCategory] = useState<string>('ALL');

  if (!__DEV__) return null;

  const triggerHaptic = () => {
    try {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    } catch {}
  };

  const categories = ['ALL', 'Executive Admin', 'Creator', 'Content & Growth', 'Moderation & Safety', 'Finance', 'Operations', 'Consumer'];

  const filteredRoles = MOCK_ACCOUNTS_LIST.filter((account) => {
    if (selectedCategory === 'ALL') return true;
    return account.category === selectedCategory;
  });

  const handleChooseRole = (roleKey: MockRoleKey) => {
    triggerHaptic();
    onSelectRole(roleKey);
    onClose();
  };

  return (
    <Modal visible={visible} animationType="slide" presentationStyle="pageSheet" onRequestClose={onClose}>
      <SafeAreaView style={styles.safeArea}>
        {/* Header */}
        <View style={styles.header}>
          <View style={styles.headerTitleRow}>
            <View style={styles.devBadge}>
              <Text style={styles.devBadgeText}>DEV ONLY</Text>
            </View>
            <View>
              <Text style={styles.headerTitle}>Role Preview Switcher</Text>
              <Text style={styles.headerSubtitle}>
                Switch between 12 mock accounts to preview permissions in real time
              </Text>
            </View>
          </View>
          <TouchableOpacity
            onPress={onClose}
            style={styles.closeBtn}
            accessibilityRole="button"
            accessibilityLabel="Close Role Switcher Modal"
          >
            <X size={18} color={colors.text} />
          </TouchableOpacity>
        </View>

        {/* Category Filter Pills */}
        <View style={styles.categoryBar}>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.categoryScroll}>
            {categories.map((cat) => {
              const isSelected = selectedCategory === cat;
              return (
                <TouchableOpacity
                  key={cat}
                  style={[
                    styles.catPill,
                    {
                      backgroundColor: isSelected ? colors.primary : colors.surface,
                      borderColor: isSelected ? colors.primary : colors.border,
                    },
                  ]}
                  onPress={() => {
                    triggerHaptic();
                    setSelectedCategory(cat);
                  }}
                  accessibilityRole="button"
                  accessibilityLabel={`Filter by ${cat}`}
                >
                  <Text style={[styles.catPillText, { color: isSelected ? colors.text : colors.textMuted }]}>
                    {cat}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </ScrollView>
        </View>

        {/* Roles List */}
        <ScrollView contentContainerStyle={styles.listContent} showsVerticalScrollIndicator={false}>
          <View style={styles.cardsGrid}>
            {filteredRoles.map((profile) => {
              const isActive = activeRole === profile.roleKey || (activeRole === 'CREATOR' && profile.roleKey === 'CREATOR');

              return (
                <TouchableOpacity
                  key={profile.roleKey}
                  onPress={() => handleChooseRole(profile.roleKey)}
                  activeOpacity={0.8}
                  accessibilityRole="button"
                  accessibilityLabel={`Switch to ${profile.roleLabel} role`}
                >
                  <Card
                    style={[
                      styles.roleCard,
                      {
                        borderColor: isActive ? profile.badgeColor : colors.border,
                        borderWidth: isActive ? 2 : 1,
                      },
                    ]}
                  >
                    {/* Top Row: Role Header, Badge, Active Pill */}
                    <View style={styles.cardHeader}>
                      <View style={styles.cardHeaderLeft}>
                        <View style={[styles.roleDot, { backgroundColor: profile.badgeColor }]} />
                        <Text style={styles.roleTitle}>{profile.roleLabel}</Text>
                      </View>

                      <View style={{ flexDirection: 'row', alignItems: 'center', gap: spacing.xs }}>
                        <View style={styles.categoryBadge}>
                          <Text style={styles.categoryBadgeText}>{profile.category}</Text>
                        </View>
                        {isActive && (
                          <View style={[styles.activePill, { backgroundColor: profile.badgeColor }]}>
                            <Check size={12} color={colors.text} strokeWidth={3} />
                            <Text style={styles.activePillText}>ACTIVE</Text>
                          </View>
                        )}
                      </View>
                    </View>

                    {/* Profile info: username, email */}
                    <View style={styles.profileRow}>
                      <View style={[styles.avatarCircle, { backgroundColor: profile.badgeColor }]}>
                        <Text style={styles.avatarText}>{profile.username.charAt(0).toUpperCase()}</Text>
                      </View>
                      <View style={{ flex: 1 }}>
                        <Text style={styles.profileName}>
                          {profile.displayName}{' '}
                          <Text style={{ color: colors.textMuted, fontWeight: '500', fontSize: typography.caption.fontSize }}>
                            (@{profile.username})
                          </Text>
                        </Text>
                        <Text style={styles.profileEmail}>{profile.email}</Text>
                      </View>
                    </View>

                    {/* Description */}
                    <Text style={styles.roleDesc}>{profile.description}</Text>

                    {/* Capabilities Tags */}
                    <View style={styles.capabilitiesRow}>
                      {profile.hasCreatorStudioAccess && (
                        <View style={[styles.capTag, { borderColor: colors.success }]}>
                          <Sparkles size={12} color={colors.success} />
                          <Text style={[styles.capTagText, { color: colors.success }]}>Creator Studio</Text>
                        </View>
                      )}
                      {profile.hasAdminDashboardAccess && (
                        <View style={[styles.capTag, { borderColor: colors.primary }]}>
                          <Crown size={12} color={colors.primary} />
                          <Text style={[styles.capTagText, { color: colors.primary }]}>
                            Admin Dashboard ({profile.visibleAdminTabs.length} tabs)
                          </Text>
                        </View>
                      )}
                      {profile.subscription === 'PREMIUM' && (
                        <View style={[styles.capTag, { borderColor: colors.warning }]}>
                          <Text style={[styles.capTagText, { color: colors.warning }]}>Premium Reader</Text>
                        </View>
                      )}
                    </View>

                    {/* Permissions List */}
                    <View style={styles.permissionsContainer}>
                      <Text style={styles.permHeader}>Simulated Permissions:</Text>
                      <View style={styles.permPillsWrap}>
                        {profile.permissions.map((perm, pIdx) => (
                          <View key={pIdx} style={[styles.permPill, { flexDirection: 'row', alignItems: 'center', gap: 4 }]}>
                            <Check size={10} color={colors.primary} strokeWidth={2.5} />
                            <Text style={styles.permPillText}>{perm}</Text>
                          </View>
                        ))}
                      </View>
                    </View>
                  </Card>
                </TouchableOpacity>
              );
            })}
          </View>
        </ScrollView>
      </SafeAreaView>
    </Modal>
  );
}

export { FloatingDevOrb } from './FloatingDevOrb';

/**
 * Floating draggable/docked Dev Role Pill rendered in development mode.
 */
export function DevFloatingRolePill({
  currentRole,
  onPress,
}: {
  currentRole: MockRoleKey | string | null;
  onPress: () => void;
}) {
  if (!__DEV__) return null;

  const roleKey = (currentRole || 'USER').toUpperCase() as MockRoleKey;
  const profile = MOCK_ACCOUNTS_MAP[roleKey] || MOCK_ACCOUNTS_MAP.USER;

  return (
    <TouchableOpacity
      style={[
        styles.floatingPill,
        {
          borderColor: profile.badgeColor,
        },
      ]}
      onPress={onPress}
      activeOpacity={0.85}
      accessibilityRole="button"
      accessibilityLabel="Open development role switcher"
    >
      <View style={[styles.floatingDot, { backgroundColor: profile.badgeColor }]} />
      <View style={{ flexDirection: 'column' }}>
        <Text style={styles.floatingRoleText}>
          Mock: <Text style={{ color: profile.badgeColor, fontWeight: '800' }}>{profile.roleLabel}</Text>
        </Text>
        <Text style={styles.floatingSubText}>Tap to switch role</Text>
      </View>
      <View style={[styles.floatingTag, { backgroundColor: profile.badgeColor }]}>
        <Text style={styles.floatingTagText}>DEV</Text>
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: colors.background,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
    backgroundColor: colors.surface,
  },
  headerTitleRow: {
    flex: 1,
    marginRight: spacing.sm,
    gap: spacing.xs,
  },
  devBadge: {
    alignSelf: 'flex-start',
    paddingHorizontal: spacing.xs,
    paddingVertical: spacing.xs / 2,
    borderRadius: radius.sm,
    borderWidth: 1,
    borderColor: colors.danger,
    backgroundColor: colors.surface,
  },
  devBadgeText: {
    color: colors.danger,
    fontSize: typography.caption.fontSize,
    fontWeight: '900',
    letterSpacing: 0.5,
  },
  headerTitle: {
    fontSize: typography.h3.fontSize,
    lineHeight: typography.h3.lineHeight,
    fontWeight: '700',
    color: colors.text,
  },
  headerSubtitle: {
    fontSize: typography.caption.fontSize,
    lineHeight: typography.caption.lineHeight,
    color: colors.textMuted,
  },
  closeBtn: {
    padding: spacing.xs,
    borderRadius: radius.full,
    backgroundColor: colors.background,
  },
  categoryBar: {
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
    backgroundColor: colors.surface,
  },
  categoryScroll: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    gap: spacing.sm,
  },
  catPill: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
    borderRadius: radius.full,
    borderWidth: 1,
  },
  catPillText: {
    fontSize: typography.caption.fontSize,
    fontWeight: '600',
  },
  listContent: {
    padding: spacing.md,
    paddingBottom: spacing.xxl,
  },
  cardsGrid: {
    gap: spacing.md,
  },
  roleCard: {
    gap: spacing.sm,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: spacing.xs,
  },
  cardHeaderLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    flex: 1,
  },
  roleDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  roleTitle: {
    fontSize: typography.body.fontSize,
    fontWeight: '700',
    color: colors.text,
  },
  categoryBadge: {
    paddingHorizontal: spacing.xs,
    paddingVertical: spacing.xs / 2,
    borderRadius: radius.sm,
    backgroundColor: colors.background,
  },
  categoryBadgeText: {
    fontSize: typography.caption.fontSize,
    fontWeight: '600',
    color: colors.textMuted,
  },
  activePill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs / 2,
    borderRadius: radius.full,
  },
  activePillText: {
    color: colors.text,
    fontSize: typography.caption.fontSize,
    fontWeight: '800',
  },
  profileRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    marginBottom: spacing.xs,
  },
  avatarCircle: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: {
    color: colors.text,
    fontSize: typography.small.fontSize,
    fontWeight: '800',
  },
  profileName: {
    fontSize: typography.small.fontSize,
    fontWeight: '700',
    color: colors.text,
  },
  profileEmail: {
    fontSize: typography.caption.fontSize,
    color: colors.textMuted,
  },
  roleDesc: {
    fontSize: typography.caption.fontSize,
    lineHeight: typography.caption.lineHeight,
    color: colors.textMuted,
    marginBottom: spacing.xs,
  },
  capabilitiesRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.xs,
    marginBottom: spacing.xs,
  },
  capTag: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    borderRadius: radius.sm,
    borderWidth: 1,
    backgroundColor: colors.background,
  },
  capTagText: {
    fontSize: typography.caption.fontSize,
    fontWeight: '700',
  },
  permissionsContainer: {
    paddingTop: spacing.sm,
    borderTopWidth: 1,
    borderTopColor: colors.border,
    gap: spacing.xs,
  },
  permHeader: {
    fontSize: typography.caption.fontSize,
    fontWeight: '700',
    textTransform: 'uppercase',
    color: colors.textMuted,
  },
  permPillsWrap: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.xs,
  },
  permPill: {
    paddingHorizontal: spacing.xs,
    paddingVertical: spacing.xs / 2,
    borderRadius: radius.sm,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.background,
  },
  permPillText: {
    fontSize: typography.caption.fontSize,
    color: colors.textMuted,
  },
  // Floating pill with subtle border and zero heavy shadows
  floatingPill: {
    position: 'absolute',
    bottom: 80,
    right: spacing.md,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: radius.full,
    borderWidth: 1.5,
    backgroundColor: colors.surface,
    gap: spacing.sm,
    zIndex: 999,
  },
  floatingDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  floatingRoleText: {
    color: colors.text,
    fontSize: typography.caption.fontSize,
  },
  floatingSubText: {
    color: colors.textMuted,
    fontSize: typography.caption.fontSize,
  },
  floatingTag: {
    paddingHorizontal: spacing.xs,
    paddingVertical: spacing.xs / 2,
    borderRadius: radius.sm,
  },
  floatingTagText: {
    color: colors.text,
    fontSize: typography.caption.fontSize,
    fontWeight: '900',
  },
});
