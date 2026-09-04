import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Modal,
  Alert,
} from 'react-native';
import { useTheme, ThemeMode } from '../theme/ThemeContext';
import {
  User,
  Coins,
  Bookmark,
  History,
  Settings,
  Palette,
  HelpCircle,
  Shield,
  Download,
  ChevronRight,
  Sparkles,
  Crown,
  Check,
  Sun,
  Moon,
  Smartphone,
  X,
  Wrench,
  BookOpen,
  BarChart3,
  DollarSign,
  Users,
  AlertTriangle,
  Activity,
  FileText,
} from 'lucide-react-native';
import { colors, spacing, radius, typography } from '@panelva/theme';
import { Card } from '../components/common/Card';
import { Button } from '../components/common/Button';
import { Badge } from '@panelva/ui';
import {
  isCreatorRole,
  isAdminRole,
  getRoleDisplayName,
} from '../data/mockRoles';

interface MoreScreenProps {
  sessionToken: string | null;
  sessionUser: any;
  dbUser: any;
  onOpenAuthModal: () => void;
  onSignOut: () => void;
  onOpenProfile: () => void;
  onOpenEditProfile?: () => void;
  onOpenWallet: () => void;
  onOpenBecomeCreator: () => void;
  onOpenCreatorStudio?: () => void;
  onOpenBookmarks: () => void;
  onOpenReadingHistory: () => void;
  onOpenSupport: () => void;
  onOpenDRMManager?: () => void;
  onOpenAdminHub?: () => void;
  onReplayPlatformTour?: () => void;
  onOpenDevTools?: () => void;
  activeMockRole?: string | null;
}

export function MoreScreen({
  sessionToken,
  sessionUser,
  dbUser,
  onOpenAuthModal,
  onSignOut,
  onOpenProfile,
  onOpenEditProfile,
  onOpenWallet,
  onOpenBecomeCreator,
  onOpenCreatorStudio,
  onOpenBookmarks,
  onOpenReadingHistory,
  onOpenSupport,
  onOpenDRMManager,
  onOpenAdminHub,
  onReplayPlatformTour,
  onOpenDevTools,
}: MoreScreenProps) {
  const { themeMode, setThemeMode } = useTheme();
  const [appearanceModalVisible, setAppearanceModalVisible] = useState(false);
  const [guidelinesModalVisible, setGuidelinesModalVisible] = useState(false);

  const isAuthenticated = !!sessionToken;
  const username = dbUser?.username || sessionUser?.username || 'user';
  const displayName = dbUser?.displayName || dbUser?.name || username;
  const subscriptionTier = dbUser?.subscription || 'NONE';
  const role = dbUser?.role || 'USER';

  const isCreator = isCreatorRole(role);
  const isAdmin = isAdminRole(role);
  const isMasterAdmin = role === 'MASTER_ADMIN';

  const creditsBalance = dbUser?.creditsBalance || dbUser?.wCoinBalance || 420;
  const creatorEarningsUsd = dbUser?.availableEarningsUsd || 1240.0;

  const handleSelectTheme = (mode: ThemeMode) => {
    setThemeMode(mode);
  };

  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      {/* 1. Profile Header (Everyone) */}
      <View style={styles.headerSection}>
        {isAuthenticated ? (
          <TouchableOpacity
            style={styles.profileHeaderCard}
            onPress={onOpenProfile}
            activeOpacity={0.8}
            accessibilityRole="button"
            accessibilityLabel="View full profile"
          >
            {/* Left: Avatar Circle */}
            <View style={styles.avatarCircle}>
              <Text style={styles.avatarInitial}>
                {displayName.charAt(0).toUpperCase()}
              </Text>
            </View>

            {/* Middle: Identity Info */}
            <View style={styles.profileMeta}>
              <View style={styles.nameRow}>
                <Text style={styles.displayNameText} numberOfLines={1}>
                  {displayName}
                </Text>
                <Badge
                  variant={isCreator ? 'success' : isAdmin ? 'danger' : 'primary'}
                  size="sm"
                >
                  {getRoleDisplayName(role).toUpperCase()}
                </Badge>
              </View>

              <Text style={styles.usernameText}>@{username}</Text>

              {/* Role-Aware Balance / Status Tag */}
              <View style={styles.balanceTag}>
                {isCreator ? (
                  <Text style={styles.balanceTextCreator}>
                    ${creatorEarningsUsd.toLocaleString()} Available
                  </Text>
                ) : isMasterAdmin ? (
                  <Text style={styles.balanceTextAdmin}>Platform Operations</Text>
                ) : (
                  <Text style={styles.balanceTextReader}>
                    {creditsBalance.toLocaleString()} Credits
                  </Text>
                )}
              </View>
            </View>

            {/* Right: Edit Button */}
            <TouchableOpacity
              style={styles.editButtonPill}
              onPress={(e) => {
                e.stopPropagation();
                if (onOpenEditProfile) {
                  onOpenEditProfile();
                } else {
                  onOpenProfile();
                }
              }}
              activeOpacity={0.7}
              accessibilityLabel="Edit profile"
            >
              <Text style={styles.editButtonText}>Edit</Text>
            </TouchableOpacity>
          </TouchableOpacity>
        ) : (
          /* Guest Banner */
          <Card style={styles.guestProfileBlock}>
            <View style={styles.guestTopRow}>
              <View style={styles.guestAvatarCircle}>
                <User size={24} color={colors.textMuted} />
              </View>
              <View style={{ flex: 1, gap: spacing.xs }}>
                <Text style={styles.guestTitle}>Welcome to Panelva</Text>
                <Text style={styles.guestSubtitle}>
                  Sign in to access your profile, library, and personalized settings.
                </Text>
              </View>
            </View>
            <View style={styles.guestActionRow}>
              <View style={{ flex: 1 }}>
                <Button title="Sign In" variant="primary" onPress={onOpenAuthModal} />
              </View>
              <View style={{ flex: 1 }}>
                <Button title="Create Account" variant="secondary" onPress={onOpenAuthModal} />
              </View>
            </View>
          </Card>
        )}
      </View>

      {/* 2. Personal & Discovery Section (Role Aware) */}
      {isAuthenticated && (
        <View style={styles.section}>
          <Text style={styles.sectionHeading}>
            {isCreator ? 'CREATOR HUBS' : isAdmin ? 'ADMINISTRATION' : 'PERSONAL'}
          </Text>
          <View style={styles.menuGroup}>
            {/* Profile (Common to all roles) */}
            <TouchableOpacity
              style={[styles.menuItem, styles.menuItemBorder]}
              onPress={onOpenProfile}
              activeOpacity={0.7}
              accessibilityRole="button"
              accessibilityLabel="Open public profile"
            >
              <View style={styles.menuIconBg}>
                <User size={18} color={colors.primary} />
              </View>
              <Text style={styles.menuItemLabel}>
                {isCreator ? 'Public Profile' : 'Profile'}
              </Text>
              <ChevronRight size={18} color={colors.textMuted} />
            </TouchableOpacity>

            {/* --- READER MENU --- */}
            {!isCreator && !isAdmin && (
              <>
                <TouchableOpacity
                  style={[styles.menuItem, styles.menuItemBorder]}
                  onPress={onOpenBookmarks}
                  activeOpacity={0.7}
                  accessibilityRole="button"
                  accessibilityLabel="Open library"
                >
                  <View style={styles.menuIconBg}>
                    <BookOpen size={18} color={colors.textMuted} />
                  </View>
                  <Text style={styles.menuItemLabel}>Library</Text>
                  <ChevronRight size={18} color={colors.textMuted} />
                </TouchableOpacity>

                <TouchableOpacity
                  style={[styles.menuItem, styles.menuItemBorder]}
                  onPress={onOpenReadingHistory}
                  activeOpacity={0.7}
                  accessibilityRole="button"
                  accessibilityLabel="Open reading history"
                >
                  <View style={styles.menuIconBg}>
                    <History size={18} color={colors.textMuted} />
                  </View>
                  <Text style={styles.menuItemLabel}>Reading History</Text>
                  <ChevronRight size={18} color={colors.textMuted} />
                </TouchableOpacity>

                <TouchableOpacity
                  style={[styles.menuItem, styles.menuItemBorder]}
                  onPress={onOpenBookmarks}
                  activeOpacity={0.7}
                  accessibilityRole="button"
                  accessibilityLabel="Open bookmarks"
                >
                  <View style={styles.menuIconBg}>
                    <Bookmark size={18} color={colors.textMuted} />
                  </View>
                  <Text style={styles.menuItemLabel}>Bookmarks</Text>
                  <ChevronRight size={18} color={colors.textMuted} />
                </TouchableOpacity>

                <TouchableOpacity
                  style={styles.menuItem}
                  onPress={onOpenWallet}
                  activeOpacity={0.7}
                  accessibilityRole="button"
                  accessibilityLabel="Open credits & membership"
                >
                  <View style={styles.menuIconBg}>
                    <Coins size={18} color={colors.primary} />
                  </View>
                  <View style={{ flex: 1, gap: 2 }}>
                    <Text style={styles.menuItemLabel}>Credits & Membership</Text>
                    <Text style={[styles.menuItemValue, { color: colors.primary }]}>
                      {creditsBalance.toLocaleString()} Credits available
                    </Text>
                  </View>
                  <ChevronRight size={18} color={colors.textMuted} />
                </TouchableOpacity>
              </>
            )}

            {/* --- CREATOR MENU --- */}
            {isCreator && (
              <>
                <TouchableOpacity
                  style={[styles.menuItem, styles.menuItemBorder]}
                  onPress={onOpenCreatorStudio}
                  activeOpacity={0.7}
                  accessibilityRole="button"
                  accessibilityLabel="Open my series"
                >
                  <View style={styles.menuIconBg}>
                    <BookOpen size={18} color={colors.primary} />
                  </View>
                  <Text style={styles.menuItemLabel}>My Series</Text>
                  <ChevronRight size={18} color={colors.textMuted} />
                </TouchableOpacity>

                <TouchableOpacity
                  style={[styles.menuItem, styles.menuItemBorder]}
                  onPress={onOpenCreatorStudio}
                  activeOpacity={0.7}
                  accessibilityRole="button"
                  accessibilityLabel="Open creator analytics"
                >
                  <View style={styles.menuIconBg}>
                    <BarChart3 size={18} color={colors.textMuted} />
                  </View>
                  <Text style={styles.menuItemLabel}>Analytics</Text>
                  <ChevronRight size={18} color={colors.textMuted} />
                </TouchableOpacity>

                <TouchableOpacity
                  style={[styles.menuItem, styles.menuItemBorder]}
                  onPress={onOpenWallet}
                  activeOpacity={0.7}
                  accessibilityRole="button"
                  accessibilityLabel="Open revenue & payouts"
                >
                  <View style={styles.menuIconBg}>
                    <DollarSign size={18} color={colors.success} />
                  </View>
                  <View style={{ flex: 1, gap: 2 }}>
                    <Text style={styles.menuItemLabel}>Revenue & Payouts</Text>
                    <Text style={[styles.menuItemValue, { color: colors.success }]}>
                      ${creatorEarningsUsd.toLocaleString()} Available
                    </Text>
                  </View>
                  <ChevronRight size={18} color={colors.textMuted} />
                </TouchableOpacity>

                <TouchableOpacity
                  style={styles.menuItem}
                  onPress={onOpenProfile}
                  activeOpacity={0.7}
                  accessibilityRole="button"
                  accessibilityLabel="Open creator community"
                >
                  <View style={styles.menuIconBg}>
                    <Users size={18} color={colors.textMuted} />
                  </View>
                  <Text style={styles.menuItemLabel}>Community</Text>
                  <ChevronRight size={18} color={colors.textMuted} />
                </TouchableOpacity>
              </>
            )}

            {/* --- MASTER ADMIN MENU --- */}
            {isAdmin && (
              <>
                <TouchableOpacity
                  style={[styles.menuItem, styles.menuItemBorder]}
                  onPress={onOpenAdminHub}
                  activeOpacity={0.7}
                  accessibilityRole="button"
                  accessibilityLabel="Open user management"
                >
                  <View style={styles.menuIconBg}>
                    <Users size={18} color={colors.textMuted} />
                  </View>
                  <Text style={styles.menuItemLabel}>User Management</Text>
                  <ChevronRight size={18} color={colors.textMuted} />
                </TouchableOpacity>

                <TouchableOpacity
                  style={[styles.menuItem, styles.menuItemBorder]}
                  onPress={onOpenAdminHub}
                  activeOpacity={0.7}
                  accessibilityRole="button"
                  accessibilityLabel="Open moderation queue"
                >
                  <View style={styles.menuIconBg}>
                    <AlertTriangle size={18} color={colors.warning} />
                  </View>
                  <Text style={styles.menuItemLabel}>Moderation Queue</Text>
                  <ChevronRight size={18} color={colors.textMuted} />
                </TouchableOpacity>

                {isMasterAdmin && (
                  <TouchableOpacity
                    style={[styles.menuItem, styles.menuItemBorder]}
                    onPress={onOpenAdminHub}
                    activeOpacity={0.7}
                    accessibilityRole="button"
                    accessibilityLabel="Open financial operations"
                  >
                    <View style={styles.menuIconBg}>
                      <DollarSign size={18} color={colors.success} />
                    </View>
                    <Text style={styles.menuItemLabel}>Financial Operations</Text>
                    <ChevronRight size={18} color={colors.textMuted} />
                  </TouchableOpacity>
                )}

                <TouchableOpacity
                  style={styles.menuItem}
                  onPress={onOpenAdminHub}
                  activeOpacity={0.7}
                  accessibilityRole="button"
                  accessibilityLabel="Open system health"
                >
                  <View style={styles.menuIconBg}>
                    <Activity size={18} color={colors.primary} />
                  </View>
                  <Text style={styles.menuItemLabel}>System Health</Text>
                  <ChevronRight size={18} color={colors.textMuted} />
                </TouchableOpacity>
              </>
            )}
          </View>
        </View>
      )}

      {/* 3. Workspace Section (Role Aware) */}
      {isCreator && (
        <View style={styles.section}>
          <Text style={styles.sectionHeading}>WORKSPACE</Text>
          <Card style={styles.workspaceCard}>
            <TouchableOpacity
              style={styles.workspaceCardInner}
              onPress={onOpenCreatorStudio}
              activeOpacity={0.7}
            >
              <View style={styles.workspaceIconCircle}>
                <Sparkles size={22} color={colors.primary} />
              </View>
              <View style={{ flex: 1, gap: 2 }}>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: spacing.xs }}>
                  <Text style={styles.workspaceTitle}>Creator Studio</Text>
                  <Badge variant="success" size="sm">
                    VERIFIED
                  </Badge>
                </View>
                <Text style={styles.workspaceSubtitle}>
                  Collaborative Kanban, episode uploads, analytics & splits
                </Text>
              </View>
              <ChevronRight size={18} color={colors.textMuted} />
            </TouchableOpacity>
          </Card>
        </View>
      )}

      {isAdmin && (
        <View style={styles.section}>
          <Text style={styles.sectionHeading}>WORKSPACE</Text>
          <Card style={styles.workspaceCard}>
            <TouchableOpacity
              style={styles.workspaceCardInner}
              onPress={onOpenAdminHub}
              activeOpacity={0.7}
            >
              <View style={[styles.workspaceIconCircle, { backgroundColor: '#312e81' }]}>
                <Crown size={22} color="#a5b4fc" />
              </View>
              <View style={{ flex: 1, gap: 2 }}>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: spacing.xs }}>
                  <Text style={styles.workspaceTitle}>Admin Console</Text>
                  <Badge variant="primary" size="sm">
                    {getRoleDisplayName(role).toUpperCase()}
                  </Badge>
                </View>
                <Text style={styles.workspaceSubtitle}>
                  Governance, moderation, ledger audit & system operations
                </Text>
              </View>
              <ChevronRight size={18} color={colors.textMuted} />
            </TouchableOpacity>
          </Card>
        </View>
      )}

      {/* Unverified Consumer Creator CTA */}
      {!isCreator && !isAdmin && isAuthenticated && (
        <View style={styles.section}>
          <Card style={styles.workspaceCard}>
            <TouchableOpacity
              style={styles.workspaceCardInner}
              onPress={onOpenBecomeCreator}
              activeOpacity={0.7}
            >
              <View style={styles.workspaceIconCircle}>
                <Palette size={20} color={colors.primary} />
              </View>
              <View style={{ flex: 1, gap: 2 }}>
                <Text style={styles.workspaceTitle}>Become a Creator</Text>
                <Text style={styles.workspaceSubtitle}>
                  Publish original comics & novels to the global community
                </Text>
              </View>
              <ChevronRight size={18} color={colors.textMuted} />
            </TouchableOpacity>
          </Card>
        </View>
      )}

      {/* 4. Settings & System Section */}
      <View style={styles.section}>
        <Text style={styles.sectionHeading}>SETTINGS & PREFERENCES</Text>
        <View style={styles.menuGroup}>
          {/* Appearance / Theme Selector */}
          <TouchableOpacity
            style={[styles.menuItem, styles.menuItemBorder]}
            onPress={() => setAppearanceModalVisible(true)}
            activeOpacity={0.7}
            accessibilityRole="button"
            accessibilityLabel="Open appearance settings"
          >
            <View style={styles.menuIconBg}>
              <Palette size={18} color={colors.textMuted} />
            </View>
            <View style={{ flex: 1, gap: 2 }}>
              <Text style={styles.menuItemLabel}>Appearance</Text>
              <Text style={styles.menuItemValue}>
                {themeMode === 'system'
                  ? 'System Theme'
                  : themeMode === 'dark'
                  ? 'Dark Theme'
                  : 'Light Theme'}
              </Text>
            </View>
            <ChevronRight size={18} color={colors.textMuted} />
          </TouchableOpacity>

          {/* DRM Offline Downloads */}
          {isAuthenticated && onOpenDRMManager && (
            <TouchableOpacity
              style={[styles.menuItem, styles.menuItemBorder]}
              onPress={onOpenDRMManager}
              activeOpacity={0.7}
              accessibilityRole="button"
              accessibilityLabel="Open offline downloads"
            >
              <View style={styles.menuIconBg}>
                <Download size={18} color={colors.textMuted} />
              </View>
              <View style={{ flex: 1, gap: 2 }}>
                <Text style={styles.menuItemLabel}>Offline Downloads</Text>
                <Text style={styles.menuItemValue}>AES-256 secure encrypted cache</Text>
              </View>
              <ChevronRight size={18} color={colors.textMuted} />
            </TouchableOpacity>
          )}

          {/* Platform Tour Replay */}
          {onReplayPlatformTour && (
            <TouchableOpacity
              style={[styles.menuItem, styles.menuItemBorder]}
              onPress={onReplayPlatformTour}
              activeOpacity={0.7}
              accessibilityRole="button"
              accessibilityLabel="Replay platform tour"
            >
              <View style={styles.menuIconBg}>
                <Sparkles size={18} color={colors.primary} />
              </View>
              <Text style={styles.menuItemLabel}>Platform Tour & Guide</Text>
              <ChevronRight size={18} color={colors.textMuted} />
            </TouchableOpacity>
          )}

          {/* Support Ticket Submission */}
          <TouchableOpacity
            style={[styles.menuItem, styles.menuItemBorder]}
            onPress={onOpenSupport}
            activeOpacity={0.7}
            accessibilityRole="button"
            accessibilityLabel="Open support ticket"
          >
            <View style={styles.menuIconBg}>
              <HelpCircle size={18} color={colors.textMuted} />
            </View>
            <Text style={styles.menuItemLabel}>Support & Bug Report</Text>
            <ChevronRight size={18} color={colors.textMuted} />
          </TouchableOpacity>

          {/* Community Guidelines */}
          <TouchableOpacity
            style={[styles.menuItem, styles.menuItemBorder]}
            onPress={() => setGuidelinesModalVisible(true)}
            activeOpacity={0.7}
            accessibilityRole="button"
            accessibilityLabel="Open community guidelines"
          >
            <View style={styles.menuIconBg}>
              <Shield size={18} color={colors.textMuted} />
            </View>
            <Text style={styles.menuItemLabel}>Community Guidelines</Text>
            <ChevronRight size={18} color={colors.textMuted} />
          </TouchableOpacity>

          {/* Hidden Developer Tools: Only accessible to Master Admin in __DEV__ builds */}
          {__DEV__ && isMasterAdmin && onOpenDevTools && (
            <TouchableOpacity
              style={[styles.menuItem, styles.menuItemBorder]}
              onPress={onOpenDevTools}
              activeOpacity={0.7}
              accessibilityRole="button"
              accessibilityLabel="Open developer tools"
            >
              <View style={[styles.menuIconBg, { backgroundColor: '#451a03' }]}>
                <Wrench size={18} color={colors.warning} />
              </View>
              <View style={{ flex: 1, gap: 2 }}>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: spacing.xs }}>
                  <Text style={[styles.menuItemLabel, { color: colors.warning }]}>
                    Developer Tools
                  </Text>
                  <Badge variant="warning" size="sm">
                    DEV
                  </Badge>
                </View>
                <Text style={styles.menuItemValue}>Role preview switcher & debug tools</Text>
              </View>
              <ChevronRight size={18} color={colors.warning} />
            </TouchableOpacity>
          )}

          {/* Version Info */}
          <View style={styles.menuItem}>
            <View style={styles.menuIconBg}>
              <Settings size={18} color={colors.textMuted} />
            </View>
            <View style={{ flex: 1, gap: 2 }}>
              <Text style={styles.menuItemLabel}>Panelva Mobile</Text>
              <Text style={styles.menuItemValue}>Version 1.0.0 (Cobalt Architecture)</Text>
            </View>
          </View>
        </View>
      </View>

      {/* 5. Sign Out Button */}
      {isAuthenticated && (
        <View style={styles.signOutWrapper}>
          <Button
            title="Sign Out"
            variant="secondary"
            onPress={() => {
              Alert.alert('Sign Out', 'Are you sure you want to sign out of your account?', [
                { text: 'Cancel', style: 'cancel' },
                { text: 'Sign Out', style: 'destructive', onPress: onSignOut },
              ]);
            }}
          />
        </View>
      )}

      <View style={{ height: 48 }} />

      {/* Theme Appearance Modal */}
      <Modal
        visible={appearanceModalVisible}
        transparent
        animationType="fade"
        onRequestClose={() => setAppearanceModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <Card style={styles.appearanceModalCard}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Select Theme</Text>
              <TouchableOpacity
                onPress={() => setAppearanceModalVisible(false)}
                style={styles.modalCloseBtn}
              >
                <X size={20} color={colors.textMuted} />
              </TouchableOpacity>
            </View>
            <View style={styles.themeOptionsList}>
              <TouchableOpacity
                style={[
                  styles.themeOptionRow,
                  themeMode === 'system' && styles.themeOptionRowActive,
                ]}
                onPress={() => handleSelectTheme('system')}
              >
                <Smartphone size={20} color={colors.text} />
                <Text style={styles.themeOptionLabel}>System Default</Text>
                {themeMode === 'system' && <Check size={18} color={colors.primary} />}
              </TouchableOpacity>

              <TouchableOpacity
                style={[
                  styles.themeOptionRow,
                  themeMode === 'dark' && styles.themeOptionRowActive,
                ]}
                onPress={() => handleSelectTheme('dark')}
              >
                <Moon size={20} color={colors.text} />
                <Text style={styles.themeOptionLabel}>Dark Theme</Text>
                {themeMode === 'dark' && <Check size={18} color={colors.primary} />}
              </TouchableOpacity>

              <TouchableOpacity
                style={[
                  styles.themeOptionRow,
                  themeMode === 'light' && styles.themeOptionRowActive,
                ]}
                onPress={() => handleSelectTheme('light')}
              >
                <Sun size={20} color={colors.text} />

                <Text style={styles.themeOptionLabel}>Light Theme</Text>
                {themeMode === 'light' && <Check size={18} color={colors.primary} />}
              </TouchableOpacity>
            </View>
          </Card>
        </View>
      </Modal>

      {/* Guidelines Modal */}
      <Modal
        visible={guidelinesModalVisible}
        transparent
        animationType="slide"
        onRequestClose={() => setGuidelinesModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <Card style={styles.guidelinesModalCard}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Community Guidelines</Text>
              <TouchableOpacity
                onPress={() => setGuidelinesModalVisible(false)}
                style={styles.modalCloseBtn}
              >
                <X size={20} color={colors.textMuted} />
              </TouchableOpacity>
            </View>
            <ScrollView style={{ maxHeight: 300 }} showsVerticalScrollIndicator={false}>
              <Text style={styles.guidelinesBody}>
                Panelva is committed to a safe, supportive, and inclusive comic community.
                {'\n\n'}
                1. Respect All Creators: Do not harass, bully, or demean creators or readers.
                {'\n\n'}
                2. Original Art & IP: Only upload work you own or have explicit rights to publish.
                {'\n\n'}
                3. Appropriate Ratings: Clearly tag mature themes, violence, and intense scenes.
                {'\n\n'}
                4. Zero Tolerance for Hate: Discrimination of any kind will result in permanent removal.
              </Text>
            </ScrollView>
            <Button
              title="I Understand"
              variant="primary"
              onPress={() => setGuidelinesModalVisible(false)}
              style={{ marginTop: spacing.md }}
            />
          </Card>
        </View>
      </Modal>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  headerSection: {
    paddingHorizontal: spacing.md,
    paddingTop: spacing.md,
    marginBottom: spacing.lg,
  },
  profileHeaderCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: spacing.md,
    backgroundColor: '#1f2937',
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.border,
    gap: spacing.md,
  },
  avatarCircle: {
    width: 54,
    height: 54,
    borderRadius: 27,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarInitial: {
    fontSize: 22,
    fontWeight: '800',
    color: '#ffffff',
  },
  profileMeta: {
    flex: 1,
    gap: 2,
  },
  nameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    flexWrap: 'wrap',
  },
  displayNameText: {
    ...typography.body,
    fontWeight: '800',
    color: colors.text,
  },
  usernameText: {
    ...typography.caption,
    fontSize: 12,
    color: colors.textMuted,
  },
  balanceTag: {
    marginTop: 2,
  },
  balanceTextReader: {
    ...typography.caption,
    fontSize: 11,
    fontWeight: '700',
    color: colors.success,
  },
  balanceTextCreator: {
    ...typography.caption,
    fontSize: 11,
    fontWeight: '700',
    color: colors.warning,
  },
  balanceTextAdmin: {
    ...typography.caption,
    fontSize: 11,
    fontWeight: '700',
    color: '#a5b4fc',
  },
  editButtonPill: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs + 2,
    borderRadius: radius.full,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  editButtonText: {
    ...typography.caption,
    fontWeight: '700',
    color: '#ffffff',
  },
  guestProfileBlock: {
    padding: spacing.md,
    gap: spacing.md,
  },
  guestTopRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
  },
  guestAvatarCircle: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  guestTitle: {
    ...typography.body,
    fontWeight: '700',
    color: colors.text,
  },
  guestSubtitle: {
    ...typography.caption,
    color: colors.textMuted,
    lineHeight: 16,
  },
  guestActionRow: {
    flexDirection: 'row',
    gap: spacing.sm,
  },
  section: {
    paddingHorizontal: spacing.md,
    marginBottom: spacing.lg,
  },
  sectionHeading: {
    ...typography.caption,
    fontWeight: '700',
    letterSpacing: 1,
    color: colors.textMuted,
    marginBottom: spacing.sm,
  },
  menuGroup: {
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surface,
    overflow: 'hidden',
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: spacing.md,
    gap: spacing.md,
  },
  menuItemBorder: {
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  menuIconBg: {
    width: 32,
    height: 32,
    borderRadius: radius.md,
    backgroundColor: colors.background,
    alignItems: 'center',
    justifyContent: 'center',
  },
  menuItemLabel: {
    ...typography.body,
    color: colors.text,
    fontWeight: '600',
    flex: 1,
  },
  menuItemValue: {
    ...typography.caption,
    color: colors.textMuted,
  },
  workspaceCard: {
    padding: 0,
    overflow: 'hidden',
  },
  workspaceCardInner: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: spacing.md,
    gap: spacing.md,
  },
  workspaceIconCircle: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#1e3a8a',
    alignItems: 'center',
    justifyContent: 'center',
  },
  workspaceTitle: {
    ...typography.body,
    fontWeight: '700',
    color: colors.text,
  },
  workspaceSubtitle: {
    ...typography.caption,
    color: colors.textMuted,
    lineHeight: 16,
  },
  signOutWrapper: {
    paddingHorizontal: spacing.md,
    marginTop: spacing.sm,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: spacing.lg,
  },
  appearanceModalCard: {
    width: '100%',
    maxWidth: 340,
    padding: spacing.lg,
  },
  guidelinesModalCard: {
    width: '100%',
    maxWidth: 340,
    padding: spacing.lg,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.md,
  },
  modalTitle: {
    ...typography.h3,
    fontWeight: '700',
    color: colors.text,
  },
  modalCloseBtn: {
    padding: 4,
  },
  themeOptionsList: {
    gap: spacing.xs,
  },
  themeOptionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: spacing.md,
    borderRadius: radius.md,
    gap: spacing.md,
  },
  themeOptionRowActive: {
    backgroundColor: colors.card,
  },
  themeOptionLabel: {
    ...typography.body,
    color: colors.text,
    flex: 1,
  },
  guidelinesBody: {
    ...typography.body,
    color: colors.textMuted,
    lineHeight: 22,
  },
});

