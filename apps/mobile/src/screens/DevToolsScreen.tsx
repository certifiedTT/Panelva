import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  SafeAreaView,
  Alert,
} from 'react-native';
import * as Haptics from 'expo-haptics';
import { colors, spacing, radius, typography } from '@panelva/theme';
import { Badge } from '@panelva/ui';
import { Card } from '../components/common/Card';
import { Button } from '../components/common/Button';
import {
  ArrowLeft,
  Wrench,
  Crown,
  Check,
  RotateCcw,
  Shield,
  Sparkles,
  Info,
} from 'lucide-react-native';
import {
  MOCK_ACCOUNTS_MAP,
  MOCK_ACCOUNTS_LIST,
  MockRoleKey,
  getRoleDisplayName,
} from '../data/mockRoles';

interface DevToolsScreenProps {
  activeRole: MockRoleKey | string | null;
  onSelectRole: (roleKey: MockRoleKey) => void;
  onResetTour?: () => void;
  onBack: () => void;
}

export function DevToolsScreen({
  activeRole,
  onSelectRole,
  onResetTour,
  onBack,
}: DevToolsScreenProps) {
  const [selectedCategory, setSelectedCategory] = useState<string>('ALL');

  if (!__DEV__) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.topBar}>
          <TouchableOpacity style={styles.iconButton} onPress={onBack}>
            <ArrowLeft size={20} color={colors.text} />
          </TouchableOpacity>
          <Text style={styles.topBarTitle}>Developer Tools</Text>
          <View style={{ width: 36 }} />
        </View>
        <View style={styles.restrictedContainer}>
          <Shield size={48} color={colors.danger} />
          <Text style={styles.restrictedTitle}>Access Restricted</Text>
          <Text style={styles.restrictedSubtitle}>
            Developer tools are only enabled in development builds for platform administrators.
          </Text>
        </View>
      </SafeAreaView>
    );
  }

  const triggerHaptic = () => {
    try {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    } catch {}
  };

  const categories = [
    'ALL',
    'Executive Admin',
    'Creator',
    'Content & Growth',
    'Moderation & Safety',
    'Finance',
    'Operations',
    'Consumer',
  ];

  const filteredRoles = MOCK_ACCOUNTS_LIST.filter((account) => {
    if (selectedCategory === 'ALL') return true;
    return account.category === selectedCategory;
  });

  const handleChooseRole = (roleKey: MockRoleKey) => {
    triggerHaptic();
    onSelectRole(roleKey);
    Alert.alert('Role Switched', `Preview active as ${getRoleDisplayName(roleKey)}`);
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      {/* Top App Bar */}
      <View style={styles.topBar}>
        <TouchableOpacity
          style={styles.iconButton}
          onPress={onBack}
          activeOpacity={0.7}
          accessibilityLabel="Go back to more"
        >
          <ArrowLeft size={20} color={colors.text} />
        </TouchableOpacity>

        <View style={styles.titleWithBadge}>
          <Text style={styles.topBarTitle}>Developer Tools</Text>
          <Badge variant="warning" size="sm">
            DEV ONLY
          </Badge>
        </View>
        <View style={{ width: 36 }} />
      </View>

      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        {/* Active Role Status Card */}
        <View style={styles.section}>
          <Card style={styles.activeRoleCard}>
            <View style={styles.activeRoleHeader}>
              <Crown size={20} color={colors.warning} />
              <View style={{ flex: 1 }}>
                <Text style={styles.activeRoleLabel}>ACTIVE MOCK PREVIEW</Text>
                <Text style={styles.activeRoleTitle}>
                  {getRoleDisplayName(activeRole || 'USER')}
                </Text>
              </View>
              <Badge variant="primary" size="sm">
                IN-MEMORY
              </Badge>
            </View>
            <Text style={styles.activeRoleDesc}>
              Allows instantaneous previewing across Reader, Creator Studio, and Admin Hub workspaces
              without altering production database states.
            </Text>
          </Card>
        </View>

        {/* Quick Debug Actions */}
        <View style={styles.section}>
          <Text style={styles.sectionHeading}>DEBUG ACTIONS</Text>
          <Card style={styles.debugActionsCard}>
            {onResetTour && (
              <TouchableOpacity
                style={[styles.debugActionRow, styles.actionBorder]}
                onPress={() => {
                  onResetTour();
                  Alert.alert('Platform Tour', 'Platform tour has been reset for the next launch.');
                }}
                activeOpacity={0.7}
              >
                <RotateCcw size={18} color={colors.primary} />
                <View style={{ flex: 1 }}>
                  <Text style={styles.debugActionTitle}>Reset Platform Tour</Text>
                  <Text style={styles.debugActionSubtitle}>Replays interactive user walkthrough</Text>
                </View>
              </TouchableOpacity>
            )}
            <View style={styles.debugActionRow}>
              <Info size={18} color={colors.textMuted} />
              <View style={{ flex: 1 }}>
                <Text style={styles.debugActionTitle}>Panelva Engine v1.0.0</Text>
                <Text style={styles.debugActionSubtitle}>Expo Go • React Native • Supabase Postgres</Text>
              </View>
            </View>
          </Card>
        </View>

        {/* 12 Mock Roles Switcher */}
        <View style={styles.section}>
          <Text style={styles.sectionHeading}>SWITCH MOCK ROLE (12 PROFILES)</Text>

          {/* Category Filter Chips */}
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.categoryScroll}
          >
            {categories.map((cat) => {
              const isSelected = selectedCategory === cat;
              return (
                <TouchableOpacity
                  key={cat}
                  style={[styles.categoryChip, isSelected && styles.categoryChipActive]}
                  onPress={() => {
                    triggerHaptic();
                    setSelectedCategory(cat);
                  }}
                  activeOpacity={0.7}
                >
                  <Text
                    style={[styles.categoryChipText, isSelected && styles.categoryChipTextActive]}
                  >
                    {cat}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </ScrollView>

          {/* Roles List */}
          <View style={styles.rolesList}>
            {filteredRoles.map((account) => {
              const isCurrent = activeRole === account.roleKey;
              return (
                <Card
                  key={account.id}
                  style={[styles.roleCard, isCurrent && styles.roleCardActive]}
                >
                  <TouchableOpacity
                    style={styles.roleCardInner}
                    onPress={() => handleChooseRole(account.roleKey)}
                    activeOpacity={0.7}
                  >
                    <View style={styles.roleCardHeader}>
                      <View style={{ flex: 1, gap: 2 }}>
                        <View style={{ flexDirection: 'row', alignItems: 'center', gap: spacing.xs }}>
                          <Text style={styles.roleDisplayName}>{account.displayName}</Text>
                          {isCurrent && <Check size={16} color={colors.primary} />}
                        </View>
                        <Text style={styles.roleUsername}>@{account.username}</Text>
                      </View>
                      <Badge
                        variant={
                          account.category === 'Executive Admin'
                            ? 'danger'
                            : account.category === 'Creator'
                            ? 'success'
                            : account.category === 'Finance'
                            ? 'warning'
                            : 'primary'
                        }
                        size="sm"
                      >
                        {account.roleLabel.toUpperCase()}
                      </Badge>
                    </View>

                    <Text style={styles.roleDescription}>{account.description}</Text>

                    <View style={styles.roleFooter}>
                      <Text style={styles.roleCategoryTag}>{account.category}</Text>
                      <Text style={styles.roleCreditsTag}>
                        {account.category === 'Creator'
                          ? `$${(account.creditsBalance / 100).toFixed(2)} Available`
                          : `${account.creditsBalance.toLocaleString()} Credits`}
                      </Text>
                    </View>
                  </TouchableOpacity>
                </Card>
              );
            })}
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: colors.background,
  },
  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  titleWithBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
  },
  topBarTitle: {
    ...typography.h3,
    color: colors.text,
    fontWeight: '700',
  },
  iconButton: {
    width: 36,
    height: 36,
    borderRadius: radius.md,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.surface,
  },
  scrollView: {
    flex: 1,
  },
  section: {
    paddingHorizontal: spacing.md,
    marginTop: spacing.lg,
  },
  sectionHeading: {
    ...typography.caption,
    fontWeight: '700',
    letterSpacing: 1,
    color: colors.textMuted,
    marginBottom: spacing.sm,
  },
  activeRoleCard: {
    padding: spacing.md,
    borderColor: colors.warning,
    borderWidth: 1,
    gap: spacing.xs,
  },
  activeRoleHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  activeRoleLabel: {
    ...typography.caption,
    fontSize: 10,
    color: colors.warning,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  activeRoleTitle: {
    ...typography.h3,
    color: colors.text,
    fontWeight: '800',
  },
  activeRoleDesc: {
    ...typography.caption,
    color: colors.textMuted,
    lineHeight: 18,
    marginTop: spacing.xs,
  },
  debugActionsCard: {
    padding: 0,
    overflow: 'hidden',
  },
  debugActionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    padding: spacing.md,
  },
  actionBorder: {
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  debugActionTitle: {
    ...typography.body,
    fontWeight: '600',
    color: colors.text,
  },
  debugActionSubtitle: {
    ...typography.caption,
    color: colors.textMuted,
  },
  categoryScroll: {
    flexDirection: 'row',
    gap: spacing.xs,
    paddingBottom: spacing.sm,
  },
  categoryChip: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs + 2,
    borderRadius: radius.full,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
  },
  categoryChipActive: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  categoryChipText: {
    ...typography.caption,
    fontWeight: '600',
    color: colors.textMuted,
  },
  categoryChipTextActive: {
    color: '#ffffff',
  },
  rolesList: {
    gap: spacing.sm,
    marginTop: spacing.sm,
    paddingBottom: spacing.xl,
  },
  roleCard: {
    padding: 0,
    overflow: 'hidden',
  },
  roleCardActive: {
    borderColor: colors.primary,
    borderWidth: 1.5,
  },
  roleCardInner: {
    padding: spacing.md,
    gap: spacing.xs,
  },
  roleCardHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
  },
  roleDisplayName: {
    ...typography.body,
    fontWeight: '700',
    color: colors.text,
  },
  roleUsername: {
    ...typography.caption,
    color: colors.textMuted,
  },
  roleDescription: {
    ...typography.caption,
    color: colors.textMuted,
    lineHeight: 16,
    marginTop: 2,
  },
  roleFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: spacing.xs,
    paddingTop: spacing.xs,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  roleCategoryTag: {
    ...typography.caption,
    fontSize: 11,
    color: colors.textMuted,
  },
  roleCreditsTag: {
    ...typography.caption,
    fontSize: 11,
    fontWeight: '700',
    color: colors.primary,
  },
  restrictedContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: spacing.xl,
    gap: spacing.md,
  },
  restrictedTitle: {
    ...typography.h2,
    color: colors.text,
    fontWeight: '800',
  },
  restrictedSubtitle: {
    ...typography.body,
    color: colors.textMuted,
    textAlign: 'center',
    lineHeight: 22,
  },
});

