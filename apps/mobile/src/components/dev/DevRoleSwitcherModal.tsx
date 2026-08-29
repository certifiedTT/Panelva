import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  SafeAreaView,
  TouchableOpacity,
  ScrollView,
  Dimensions,
  Platform,
} from 'react-native';
import * as Haptics from 'expo-haptics';
import { useTheme } from '../../theme/ThemeContext';
import {
  MOCK_ACCOUNTS_MAP,
  MOCK_ACCOUNTS_LIST,
  MockRoleKey,
  MockAccountProfile,
} from '../../data/mockRoles';
import {
  CloseIcon,
  CrownIcon,
  CreatorHubIcon,
  ShieldIcon,
  ShieldAlertIcon,
  UsersIcon,
  DollarSignIcon,
  SparklesIcon,
  CheckIcon,
  HelpCircleIcon,
  SunIcon,
} from '../common/Icons';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

interface DevRoleSwitcherModalProps {
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
  const { colors } = useTheme();
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
      <SafeAreaView style={[styles.safeArea, { backgroundColor: colors.bg }]}>
        {/* Header */}
        <View style={[styles.header, { backgroundColor: colors.header, borderBottomColor: colors.borderSubtle }]}>
          <View style={styles.headerTitleRow}>
            <View style={[styles.devBadge, { backgroundColor: 'rgba(239, 68, 68, 0.15)', borderColor: '#EF4444' }]}>
              <Text style={styles.devBadgeText}>DEV ONLY</Text>
            </View>
            <View>
              <Text style={[styles.headerTitle, { color: colors.text }]}>Role Preview Switcher</Text>
              <Text style={[styles.headerSubtitle, { color: colors.textMuted }]}>
                Switch between 12 mock accounts to preview permissions in real time
              </Text>
            </View>
          </View>
          <TouchableOpacity onPress={onClose} style={[styles.closeBtn, { backgroundColor: colors.surfaceSecondary }]}>
            <CloseIcon size={18} color={colors.text} />
          </TouchableOpacity>
        </View>

        {/* Category Filter Pills */}
        <View style={[styles.categoryBar, { backgroundColor: colors.surfaceElevated, borderBottomColor: colors.borderSubtle }]}>
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
                      borderColor: isSelected ? colors.primaryDark : colors.border,
                    },
                  ]}
                  onPress={() => {
                    triggerHaptic();
                    setSelectedCategory(cat);
                  }}
                >
                  <Text style={[styles.catPillText, { color: isSelected ? '#FFFFFF' : colors.textSecondary }]}>
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
                  style={[
                    styles.roleCard,
                    {
                      backgroundColor: colors.surfaceElevated,
                      borderColor: isActive ? profile.badgeColor : colors.borderSubtle,
                      borderWidth: isActive ? 2 : 1,
                    },
                  ]}
                  onPress={() => handleChooseRole(profile.roleKey)}
                  activeOpacity={0.8}
                >
                  {/* Top Row: Role Header, Badge, Active Pill */}
                  <View style={styles.cardHeader}>
                    <View style={styles.cardHeaderLeft}>
                      <View style={[styles.roleDot, { backgroundColor: profile.badgeColor }]} />
                      <Text style={[styles.roleTitle, { color: colors.text }]}>{profile.roleLabel}</Text>
                    </View>

                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                      <View style={[styles.categoryBadge, { backgroundColor: colors.surfaceSecondary }]}>
                        <Text style={[styles.categoryBadgeText, { color: colors.textMuted }]}>{profile.category}</Text>
                      </View>
                      {isActive && (
                        <View style={[styles.activePill, { backgroundColor: profile.badgeColor }]}>
                          <CheckIcon size={12} color="#FFFFFF" strokeWidth={3} />
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
                      <Text style={[styles.profileName, { color: colors.text }]}>
                        {profile.displayName}{' '}
                        <Text style={{ color: colors.textMuted, fontWeight: '500', fontSize: 12 }}>
                          (@{profile.username})
                        </Text>
                      </Text>
                      <Text style={[styles.profileEmail, { color: colors.textMuted }]}>{profile.email}</Text>
                    </View>
                  </View>

                  {/* Description */}
                  <Text style={[styles.roleDesc, { color: colors.textSecondary }]}>{profile.description}</Text>

                  {/* Capabilities Tags */}
                  <View style={styles.capabilitiesRow}>
                    {profile.hasCreatorStudioAccess && (
                      <View style={[styles.capTag, { backgroundColor: 'rgba(16, 185, 129, 0.12)', borderColor: '#10B981' }]}>
                        <SparklesIcon size={11} color="#10B981" />
                        <Text style={[styles.capTagText, { color: '#10B981' }]}>Creator Studio</Text>
                      </View>
                    )}
                    {profile.hasAdminDashboardAccess && (
                      <View style={[styles.capTag, { backgroundColor: 'rgba(59, 130, 246, 0.12)', borderColor: '#3B82F6' }]}>
                        <CrownIcon size={11} color="#3B82F6" />
                        <Text style={[styles.capTagText, { color: '#3B82F6' }]}>
                          Admin Dashboard ({profile.visibleAdminTabs.length} tabs)
                        </Text>
                      </View>
                    )}
                    {profile.subscription === 'PREMIUM' && (
                      <View style={[styles.capTag, { backgroundColor: 'rgba(245, 158, 11, 0.12)', borderColor: '#F59E0B' }]}>
                        <Text style={[styles.capTagText, { color: '#F59E0B' }]}>Premium Reader</Text>
                      </View>
                    )}
                  </View>

                  {/* Permissions List */}
                  <View style={styles.permissionsContainer}>
                    <Text style={[styles.permHeader, { color: colors.textMuted }]}>Simulated Permissions:</Text>
                    <View style={styles.permPillsWrap}>
                      {profile.permissions.map((perm, pIdx) => (
                        <View key={pIdx} style={[styles.permPill, { backgroundColor: colors.surface, borderColor: colors.borderSubtle }]}>
                          <Text style={[styles.permPillText, { color: colors.textMuted }]}>✓ {perm}</Text>
                        </View>
                      ))}
                    </View>
                  </View>
                </TouchableOpacity>
              );
            })}
          </View>
        </ScrollView>
      </SafeAreaView>
    </Modal>
  );
}

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
          backgroundColor: '#1E1B4B',
          borderColor: profile.badgeColor,
        },
      ]}
      onPress={onPress}
      activeOpacity={0.85}
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
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderBottomWidth: 1,
  },
  headerTitleRow: {
    flex: 1,
    marginRight: 10,
    gap: 4,
  },
  devBadge: {
    alignSelf: 'flex-start',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
    borderWidth: 1,
  },
  devBadgeText: {
    color: '#EF4444',
    fontSize: 9,
    fontWeight: '900',
    letterSpacing: 0.5,
  },
  headerTitle: {
    fontSize: 17,
    fontWeight: '800',
  },
  headerSubtitle: {
    fontSize: 11,
  },
  closeBtn: {
    padding: 6,
    borderRadius: 18,
  },
  categoryBar: {
    borderBottomWidth: 1,
  },
  categoryScroll: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    gap: 6,
  },
  catPill: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 14,
    borderWidth: 1,
  },
  catPillText: {
    fontSize: 11,
    fontWeight: '600',
  },
  listContent: {
    padding: 14,
    paddingBottom: 40,
  },
  cardsGrid: {
    gap: 12,
  },
  roleCard: {
    padding: 14,
    borderRadius: 14,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  cardHeaderLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    flex: 1,
  },
  roleDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
  },
  roleTitle: {
    fontSize: 15,
    fontWeight: '800',
  },
  categoryBadge: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  categoryBadgeText: {
    fontSize: 10,
    fontWeight: '600',
  },
  activePill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 10,
  },
  activePillText: {
    color: '#FFFFFF',
    fontSize: 10,
    fontWeight: '800',
  },
  profileRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginBottom: 8,
  },
  avatarCircle: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '800',
  },
  profileName: {
    fontSize: 13,
    fontWeight: '700',
  },
  profileEmail: {
    fontSize: 11,
  },
  roleDesc: {
    fontSize: 12,
    lineHeight: 16,
    marginBottom: 10,
  },
  capabilitiesRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
    marginBottom: 10,
  },
  capTag: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
    borderWidth: 1,
  },
  capTagText: {
    fontSize: 10,
    fontWeight: '700',
  },
  permissionsContainer: {
    paddingTop: 8,
    borderTopWidth: 0.5,
    borderTopColor: 'rgba(255,255,255,0.06)',
    gap: 4,
  },
  permHeader: {
    fontSize: 10,
    fontWeight: '700',
    textTransform: 'uppercase',
  },
  permPillsWrap: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 4,
  },
  permPill: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
    borderWidth: 1,
  },
  permPillText: {
    fontSize: 10,
  },
  // Floating pill
  floatingPill: {
    position: 'absolute',
    bottom: 74,
    right: 14,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 20,
    borderWidth: 1.5,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.35,
    shadowRadius: 6,
    elevation: 8,
    gap: 8,
    zIndex: 999,
  },
  floatingDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  floatingRoleText: {
    color: '#FFFFFF',
    fontSize: 11,
  },
  floatingSubText: {
    color: '#94A3B8',
    fontSize: 9,
  },
  floatingTag: {
    paddingHorizontal: 5,
    paddingVertical: 1,
    borderRadius: 4,
  },
  floatingTagText: {
    color: '#FFFFFF',
    fontSize: 9,
    fontWeight: '900',
  },
});
