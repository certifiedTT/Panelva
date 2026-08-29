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
  ProfileIcon,
  CreditsIcon,
  BookmarkIcon,
  HistoryIcon,
  SettingsIcon,
  PaletteIcon,
  HelpCircleIcon,
  ShieldIcon,
  DownloadIcon,
  LogOutIcon,
  ChevronRightIcon,
  SparklesIcon,
  CrownIcon,
  CheckIcon,
  SunIcon,
  MoonIcon,
  SmartphoneIcon,
  CloseIcon,
  UsersIcon,
} from '../components/common/Icons';
import {
  isCreatorRole,
  isAdminRole,
  getRoleBadgeColor,
  getRoleDisplayName,
} from '../data/mockRoles';

interface MoreScreenProps {
  sessionToken: string | null;
  sessionUser: any;
  dbUser: any;
  onOpenAuthModal: () => void;
  onSignOut: () => void;
  onOpenWallet: () => void;
  onOpenBecomeCreator: () => void;
  onOpenCreatorStudio?: () => void;
  onOpenBookmarks: () => void;
  onOpenReadingHistory: () => void;
  onOpenSupport: () => void;
  onOpenDRMManager?: () => void;
  onOpenAdminHub?: () => void;
  onReplayPlatformTour?: () => void;
  onOpenDevRoleSwitcher?: () => void;
  activeMockRole?: string | null;
}

export function MoreScreen({
  sessionToken,
  sessionUser,
  dbUser,
  onOpenAuthModal,
  onSignOut,
  onOpenWallet,
  onOpenBecomeCreator,
  onOpenCreatorStudio,
  onOpenBookmarks,
  onOpenReadingHistory,
  onOpenSupport,
  onOpenDRMManager,
  onOpenAdminHub,
  onReplayPlatformTour,
  onOpenDevRoleSwitcher,
  activeMockRole,
}: MoreScreenProps) {
  const { colors, themeMode, setThemeMode } = useTheme();
  const [appearanceModalVisible, setAppearanceModalVisible] = useState(false);
  const [guidelinesModalVisible, setGuidelinesModalVisible] = useState(false);

  const isAuthenticated = !!sessionToken;
  const username = dbUser ? dbUser.username : (sessionUser ? sessionUser.username : null);
  const subscriptionTier = dbUser?.subscription || 'NONE';
  const role = dbUser?.role || 'USER';
  const isCreator = isCreatorRole(role);
  const isAdmin = isAdminRole(role);
  const creditsBalance = dbUser?.creditsBalance || dbUser?.wCoinBalance || 0;


  const handleSelectTheme = (mode: ThemeMode) => {
    setThemeMode(mode);
  };

  return (
    <ScrollView style={[styles.container, { backgroundColor: colors.bg }]} showsVerticalScrollIndicator={false}>
      {/* Header Profile / Guest Banner */}
      <View style={[styles.headerCard, { backgroundColor: colors.header, borderBottomColor: colors.borderSubtle }]}>
        {isAuthenticated ? (
          <View style={styles.authProfileRow}>
            <View style={[styles.profileAvatarCircle, { backgroundColor: colors.primary }]}>
              <Text style={styles.profileAvatarText}>
                {username ? username.charAt(0).toUpperCase() : 'U'}
              </Text>
            </View>
            <View style={{ flex: 1 }}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                <Text style={[styles.profileNameText, { color: colors.text }]}>{username}</Text>
                {subscriptionTier !== 'NONE' && (
                  <View style={[styles.subBadge, { backgroundColor: subscriptionTier === 'PREMIUM' ? colors.accentGold : colors.primary }]}>
                    <Text style={styles.subBadgeText}>{subscriptionTier}</Text>
                  </View>
                )}
              </View>
              <Text style={[styles.profileEmailText, { color: colors.textMuted }]}>
                {dbUser?.email || 'Authenticated User'}
              </Text>
            </View>
          </View>
        ) : (
          <View style={styles.guestProfileBlock}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
              <View style={[styles.guestAvatarCircle, { backgroundColor: colors.surfaceElevated, borderColor: colors.border }]}>
                <ProfileIcon size={24} color={colors.textMuted} />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={[styles.guestTitle, { color: colors.text }]}>Guest</Text>
                <Text style={[styles.guestSubtitle, { color: colors.textMuted }]}>
                  Sign in to access your account and sync your activity.
                </Text>
              </View>
            </View>
            <View style={styles.guestActionRow}>
              <TouchableOpacity
                style={[styles.guestPrimaryBtn, { backgroundColor: colors.primary }]}
                onPress={onOpenAuthModal}
                activeOpacity={0.8}
              >
                <Text style={styles.guestPrimaryBtnText}>Sign In</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.guestSecondaryBtn, { backgroundColor: colors.surfaceElevated, borderColor: colors.border }]}
                onPress={onOpenAuthModal}
                activeOpacity={0.8}
              >
                <Text style={[styles.guestSecondaryBtnText, { color: colors.text }]}>Create Account</Text>
              </TouchableOpacity>
            </View>
          </View>
        )}
      </View>

      {/* Account Section (Authenticated only) */}
      {isAuthenticated && (
        <View style={styles.section}>
          <Text style={[styles.sectionHeading, { color: colors.textMuted }]}>ACCOUNT</Text>
          <View style={[styles.menuGroup, { backgroundColor: colors.surfaceElevated, borderColor: colors.border }]}>
            {/* Credit Wallet Item */}
            <TouchableOpacity style={[styles.menuItem, { borderBottomColor: colors.borderSubtle }]} onPress={onOpenWallet} activeOpacity={0.7}>
              <View style={[styles.menuIconBg, { backgroundColor: colors.primaryMuted }]}>
                <CreditsIcon size={18} color={colors.primary} />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={[styles.menuItemLabel, { color: colors.text }]}>Credit Wallet</Text>
                <Text style={[styles.menuItemValue, { color: colors.primary }]}>
                  {creditsBalance.toLocaleString()} Credits available
                </Text>
              </View>
              <ChevronRightIcon size={18} color={colors.textMuted} />
            </TouchableOpacity>

            {/* Reading History */}
            <TouchableOpacity style={[styles.menuItem, { borderBottomColor: colors.borderSubtle }]} onPress={onOpenReadingHistory} activeOpacity={0.7}>
              <View style={[styles.menuIconBg, { backgroundColor: colors.surfaceSecondary }]}>
                <HistoryIcon size={18} color={colors.textSecondary} />
              </View>
              <Text style={[styles.menuItemLabel, { color: colors.text, flex: 1 }]}>Reading History</Text>
              <ChevronRightIcon size={18} color={colors.textMuted} />
            </TouchableOpacity>

            {/* Bookmarks */}
            <TouchableOpacity style={styles.menuItem} onPress={onOpenBookmarks} activeOpacity={0.7}>
              <View style={[styles.menuIconBg, { backgroundColor: colors.surfaceSecondary }]}>
                <BookmarkIcon size={18} color={colors.textSecondary} />
              </View>
              <Text style={[styles.menuItemLabel, { color: colors.text, flex: 1 }]}>Library & Bookmarks</Text>
              <ChevronRightIcon size={18} color={colors.textMuted} />
            </TouchableOpacity>
          </View>
        </View>
      )}

      {/* Creator Section (Hidden for Admins; shows Creator Studio for Creators, Become a Creator for Readers) */}
      {!isAdmin && (
        <View style={styles.section}>
          <Text style={[styles.sectionHeading, { color: colors.textMuted }]}>
            {isCreator ? 'CREATOR WORKSPACE' : 'CREATOR'}
          </Text>
          <View style={[styles.menuGroup, { backgroundColor: colors.surfaceElevated, borderColor: colors.border }]}>
            {isCreator ? (
              <TouchableOpacity
                style={styles.menuItem}
                onPress={onOpenCreatorStudio}
                activeOpacity={0.7}
              >
                <View style={[styles.menuIconBg, { backgroundColor: colors.primaryMuted }]}>
                  <SparklesIcon size={18} color={colors.primary} />
                </View>
                <View style={{ flex: 1 }}>
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                    <Text style={[styles.menuItemLabel, { color: colors.text }]}>Creator Studio</Text>
                    <View style={[styles.subBadge, { backgroundColor: colors.success }]}>
                      <Text style={styles.subBadgeText}>VERIFIED</Text>
                    </View>
                  </View>
                  <Text style={[styles.menuItemValue, { color: colors.textMuted }]}>
                    Series, chapters, analytics, revenue, collaborations & audience
                  </Text>
                </View>
                <ChevronRightIcon size={18} color={colors.textMuted} />
              </TouchableOpacity>
            ) : (
              <TouchableOpacity style={styles.menuItem} onPress={onOpenBecomeCreator} activeOpacity={0.7}>
                <View style={[styles.menuIconBg, { backgroundColor: colors.primaryMuted }]}>
                  <PaletteIcon size={18} color={colors.primary} />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={[styles.menuItemLabel, { color: colors.text }]}>Become a Creator</Text>
                  <Text style={[styles.menuItemValue, { color: colors.textMuted }]}>Apply to publish webcomics & novels</Text>
                </View>
                <ChevronRightIcon size={18} color={colors.textMuted} />
              </TouchableOpacity>
            )}
          </View>
        </View>
      )}

      {/* Development Mock Roles Switcher (Dev Mode Only) */}
      {__DEV__ && onOpenDevRoleSwitcher && (
        <View style={styles.section}>
          <Text style={[styles.sectionHeading, { color: colors.accentGold || '#F59E0B' }]}>
            🛠️ DEV PREVIEW (12 MOCK ROLES)
          </Text>
          <View
            style={[
              styles.menuGroup,
              {
                backgroundColor: colors.surfaceElevated,
                borderColor: colors.accentGold || '#F59E0B',
                borderWidth: 1.5,
              },
            ]}
          >
            <TouchableOpacity
              style={styles.menuItem}
              onPress={onOpenDevRoleSwitcher}
              activeOpacity={0.7}
            >
              <View style={[styles.menuIconBg, { backgroundColor: `${getRoleBadgeColor(role)}25` }]}>
                <CrownIcon size={18} color={getRoleBadgeColor(role)} />
              </View>
              <View style={{ flex: 1 }}>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                  <Text style={[styles.menuItemLabel, { color: colors.text }]}>Switch Mock Role</Text>
                  <View style={[styles.subBadge, { backgroundColor: getRoleBadgeColor(role) }]}>
                    <Text style={styles.subBadgeText}>{getRoleDisplayName(role).toUpperCase()}</Text>
                  </View>
                </View>
                <Text style={[styles.menuItemValue, { color: colors.textMuted }]}>
                  Instant in-memory role preview across Creator & Admin hubs
                </Text>
              </View>
              <ChevronRightIcon size={18} color={colors.textMuted} />
            </TouchableOpacity>
          </View>
        </View>
      )}

      {/* Admin Operations Section (Exclusively for Admins — not Creators or Standard Users) */}
      {isAdmin && onOpenAdminHub && (
        <View style={styles.section}>
          <Text style={[styles.sectionHeading, { color: colors.textMuted }]}>ADMINISTRATION</Text>
          <View style={[styles.menuGroup, { backgroundColor: colors.surfaceElevated, borderColor: colors.border }]}>
            <TouchableOpacity style={styles.menuItem} onPress={onOpenAdminHub} activeOpacity={0.7}>
              <View style={[styles.menuIconBg, { backgroundColor: `${getRoleBadgeColor(role)}25` }]}>
                <CrownIcon size={18} color={getRoleBadgeColor(role)} />
              </View>
              <View style={{ flex: 1 }}>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                  <Text style={[styles.menuItemLabel, { color: colors.text }]}>Admin Hub</Text>
                  <View
                    style={[
                      styles.subBadge,
                      {
                        backgroundColor: getRoleBadgeColor(role),
                      },
                    ]}
                  >
                    <Text style={styles.subBadgeText}>{getRoleDisplayName(role).toUpperCase()}</Text>
                  </View>
                </View>
                <Text style={[styles.menuItemValue, { color: colors.textMuted }]}>
                  Operational governance, moderation, creators, finance & logs
                </Text>
              </View>
              <ChevronRightIcon size={18} color={colors.textMuted} />
            </TouchableOpacity>
          </View>
        </View>
      )}


      {/* Settings & Appearance Section */}
      <View style={styles.section}>
        <Text style={[styles.sectionHeading, { color: colors.textMuted }]}>PREFERENCES & SYSTEM</Text>
        <View style={[styles.menuGroup, { backgroundColor: colors.surfaceElevated, borderColor: colors.border }]}>
          {/* Appearance / Theme Selector */}
          <TouchableOpacity
            style={[styles.menuItem, { borderBottomColor: colors.borderSubtle }]}
            onPress={() => setAppearanceModalVisible(true)}
            activeOpacity={0.7}
          >
            <View style={[styles.menuIconBg, { backgroundColor: colors.surfaceSecondary }]}>
              <PaletteIcon size={18} color={colors.textSecondary} />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={[styles.menuItemLabel, { color: colors.text }]}>Appearance</Text>
              <Text style={[styles.menuItemValue, { color: colors.textMuted }]}>
                {themeMode === 'system' ? 'System Theme' : themeMode === 'dark' ? 'Dark Theme' : 'Light Theme'}
              </Text>
            </View>
            <ChevronRightIcon size={18} color={colors.textMuted} />
          </TouchableOpacity>

          {/* DRM Downloader (if available) */}
          {isAuthenticated && onOpenDRMManager && (
            <TouchableOpacity style={styles.menuItem} onPress={onOpenDRMManager} activeOpacity={0.7}>
              <View style={[styles.menuIconBg, { backgroundColor: colors.surfaceSecondary }]}>
                <DownloadIcon size={18} color={colors.textSecondary} />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={[styles.menuItemLabel, { color: colors.text }]}>Offline Downloads</Text>
                <Text style={[styles.menuItemValue, { color: colors.textMuted }]}>AES-256 secure encrypted cache</Text>
              </View>
              <ChevronRightIcon size={18} color={colors.textMuted} />
            </TouchableOpacity>
          )}
        </View>
      </View>

      {/* Support & About Section */}
      <View style={styles.section}>
        <Text style={[styles.sectionHeading, { color: colors.textMuted }]}>HELP & LEGAL</Text>
        <View style={[styles.menuGroup, { backgroundColor: colors.surfaceElevated, borderColor: colors.border }]}>
          {onReplayPlatformTour && (
            <TouchableOpacity style={[styles.menuItem, { borderBottomColor: colors.borderSubtle }]} onPress={onReplayPlatformTour} activeOpacity={0.7}>
              <View style={[styles.menuIconBg, { backgroundColor: colors.primaryMuted }]}>
                <SparklesIcon size={18} color={colors.primary} />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={[styles.menuItemLabel, { color: colors.text }]}>Platform Tour & Guide</Text>
                <Text style={[styles.menuItemValue, { color: colors.primary }]}>Explore features and navigation overview</Text>
              </View>
              <ChevronRightIcon size={18} color={colors.textMuted} />
            </TouchableOpacity>
          )}

          <TouchableOpacity style={[styles.menuItem, { borderBottomColor: colors.borderSubtle }]} onPress={onOpenSupport} activeOpacity={0.7}>
            <View style={[styles.menuIconBg, { backgroundColor: colors.surfaceSecondary }]}>
              <HelpCircleIcon size={18} color={colors.textSecondary} />
            </View>
            <Text style={[styles.menuItemLabel, { color: colors.text, flex: 1 }]}>Support & Bug Report</Text>
            <ChevronRightIcon size={18} color={colors.textMuted} />
          </TouchableOpacity>

          <TouchableOpacity style={[styles.menuItem, { borderBottomColor: colors.borderSubtle }]} onPress={() => setGuidelinesModalVisible(true)} activeOpacity={0.7}>
            <View style={[styles.menuIconBg, { backgroundColor: colors.surfaceSecondary }]}>
              <ShieldIcon size={18} color={colors.textSecondary} />
            </View>
            <Text style={[styles.menuItemLabel, { color: colors.text, flex: 1 }]}>Community Guidelines</Text>
            <ChevronRightIcon size={18} color={colors.textMuted} />
          </TouchableOpacity>

          <View style={styles.menuItem}>
            <View style={[styles.menuIconBg, { backgroundColor: colors.surfaceSecondary }]}>
              <SettingsIcon size={18} color={colors.textSecondary} />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={[styles.menuItemLabel, { color: colors.text }]}>Panelva Mobile</Text>
              <Text style={[styles.menuItemValue, { color: colors.textMuted }]}>Version 1.0.0 (SDK 54 • Cobalt Design)</Text>
            </View>
          </View>
        </View>
      </View>

      {/* Sign Out Action (Authenticated only) */}
      {isAuthenticated && (
        <View style={{ paddingHorizontal: 16, marginTop: 14, marginBottom: 40 }}>
          <TouchableOpacity
            style={[styles.signOutBtn, { backgroundColor: colors.surfaceElevated, borderColor: colors.border }]}
            onPress={() => {
              Alert.alert('Sign Out', 'Are you sure you want to sign out of your account?', [
                { text: 'Cancel', style: 'cancel' },
                { text: 'Sign Out', style: 'destructive', onPress: onSignOut },
              ]);
            }}
            activeOpacity={0.7}
          >
            <LogOutIcon size={18} color={colors.error} />
            <Text style={[styles.signOutBtnText, { color: colors.error }]}>Sign Out</Text>
          </TouchableOpacity>
        </View>
      )}

      {/* Appearance Modal (Theme Selection: System, Light, Dark) */}
      <Modal visible={appearanceModalVisible} transparent animationType="fade" onRequestClose={() => setAppearanceModalVisible(false)}>
        <View style={styles.modalOverlay}>
          <View style={[styles.appearanceModalCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
            <View style={[styles.modalHeader, { borderBottomColor: colors.borderSubtle }]}>
              <Text style={[styles.modalHeaderTitle, { color: colors.text }]}>Appearance & Theme</Text>
              <TouchableOpacity onPress={() => setAppearanceModalVisible(false)} style={styles.closeBtn}>
                <CloseIcon size={18} color={colors.textMuted} />
              </TouchableOpacity>
            </View>

            <View style={{ padding: 16, gap: 10 }}>
              {[
                { id: 'system', label: 'System Default', desc: 'Match device system settings', icon: (c: string) => <SmartphoneIcon size={20} color={c} /> },
                { id: 'dark', label: 'Dark Theme', desc: 'Sleek dark mode with Cobalt accents', icon: (c: string) => <MoonIcon size={20} color={c} /> },
                { id: 'light', label: 'Light Theme', desc: 'Clean bright mode with Cobalt accents', icon: (c: string) => <SunIcon size={20} color={c} /> },
              ].map((item) => {
                const isSelected = themeMode === item.id;
                return (
                  <TouchableOpacity
                    key={item.id}
                    style={[
                      styles.themeOptionRow,
                      {
                        backgroundColor: isSelected ? colors.primaryMuted : colors.surfaceElevated,
                        borderColor: isSelected ? colors.primary : colors.border,
                      },
                    ]}
                    onPress={() => handleSelectTheme(item.id as ThemeMode)}
                    activeOpacity={0.7}
                  >
                    <View style={styles.themeOptionIcon}>
                      {item.icon(isSelected ? colors.primary : colors.textMuted)}
                    </View>
                    <View style={{ flex: 1 }}>
                      <Text style={[styles.themeOptionLabel, { color: colors.text, fontWeight: isSelected ? '700' : '600' }]}>
                        {item.label}
                      </Text>
                      <Text style={[styles.themeOptionDesc, { color: colors.textMuted }]}>{item.desc}</Text>
                    </View>
                    {isSelected && <CheckIcon size={18} color={colors.primary} strokeWidth={2.5} />}
                  </TouchableOpacity>
                );
              })}
            </View>
          </View>
        </View>
      </Modal>

      {/* Guidelines Modal */}
      <Modal visible={guidelinesModalVisible} transparent animationType="slide" onRequestClose={() => setGuidelinesModalVisible(false)}>
        <View style={styles.modalOverlay}>
          <View style={[styles.guidelinesModalCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
            <View style={[styles.modalHeader, { borderBottomColor: colors.borderSubtle }]}>
              <Text style={[styles.modalHeaderTitle, { color: colors.text }]}>Community Guidelines</Text>
              <TouchableOpacity onPress={() => setGuidelinesModalVisible(false)} style={styles.closeBtn}>
                <CloseIcon size={18} color={colors.textMuted} />
              </TouchableOpacity>
            </View>
            <ScrollView contentContainerStyle={{ padding: 16 }} showsVerticalScrollIndicator={false}>
              <Text style={[styles.guidelineBullet, { color: colors.text }]}>1. Be Respectful: Harassment and hate speech are strictly prohibited.</Text>
              <Text style={[styles.guidelineBullet, { color: colors.text }]}>2. Original Content: Only upload artwork and manuscripts you have rights to.</Text>
              <Text style={[styles.guidelineBullet, { color: colors.text }]}>3. Fair Monetization: Respect reader unlock schedules and supporter perks.</Text>
              <Text style={[styles.guidelineBullet, { color: colors.text }]}>4. Constructive Feedback: Support fellow creators in community discussions.</Text>
            </ScrollView>
          </View>
        </View>
      </Modal>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  headerCard: {
    paddingHorizontal: 16,
    paddingVertical: 18,
    borderBottomWidth: 1,
  },
  authProfileRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
  },
  profileAvatarCircle: {
    width: 52,
    height: 52,
    borderRadius: 26,
    alignItems: 'center',
    justifyContent: 'center',
  },
  profileAvatarText: {
    color: '#FFFFFF',
    fontSize: 22,
    fontWeight: '800',
  },
  profileNameText: {
    fontSize: 17,
    fontWeight: '800',
  },
  subBadge: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  subBadgeText: {
    color: '#FFFFFF',
    fontSize: 9,
    fontWeight: '800',
  },
  profileEmailText: {
    fontSize: 12,
    marginTop: 2,
  },
  guestProfileBlock: {
    gap: 14,
  },
  guestAvatarCircle: {
    width: 48,
    height: 48,
    borderRadius: 24,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  guestTitle: {
    fontSize: 16,
    fontWeight: '800',
  },
  guestSubtitle: {
    fontSize: 12,
    lineHeight: 16,
    marginTop: 2,
  },
  guestActionRow: {
    flexDirection: 'row',
    gap: 10,
  },
  guestPrimaryBtn: {
    flex: 1,
    paddingVertical: 11,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  guestPrimaryBtnText: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '700',
  },
  guestSecondaryBtn: {
    flex: 1,
    paddingVertical: 11,
    borderRadius: 8,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  guestSecondaryBtnText: {
    fontSize: 13,
    fontWeight: '700',
  },
  section: {
    paddingHorizontal: 16,
    marginTop: 18,
  },
  sectionHeading: {
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 0.5,
    marginBottom: 8,
    marginLeft: 4,
  },
  menuGroup: {
    borderRadius: 14,
    borderWidth: 1,
    overflow: 'hidden',
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 14,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: 'transparent',
    gap: 12,
  },
  menuIconBg: {
    width: 34,
    height: 34,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  menuItemLabel: {
    fontSize: 14,
    fontWeight: '600',
  },
  menuItemValue: {
    fontSize: 11,
    marginTop: 1,
  },
  signOutBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 14,
    borderRadius: 12,
    borderWidth: 1,
    gap: 8,
  },
  signOutBtnText: {
    fontSize: 14,
    fontWeight: '700',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(5, 5, 10, 0.75)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  appearanceModalCard: {
    width: '100%',
    maxWidth: 380,
    borderRadius: 16,
    borderWidth: 1,
    overflow: 'hidden',
  },
  guidelinesModalCard: {
    width: '100%',
    maxWidth: 420,
    maxHeight: '80%',
    borderRadius: 16,
    borderWidth: 1,
    overflow: 'hidden',
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderBottomWidth: 1,
  },
  modalHeaderTitle: {
    fontSize: 16,
    fontWeight: '700',
  },
  closeBtn: {
    padding: 4,
  },
  themeOptionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 14,
    borderRadius: 12,
    borderWidth: 1.5,
    gap: 12,
  },
  themeOptionIcon: {
    width: 32,
    alignItems: 'center',
  },
  themeOptionLabel: {
    fontSize: 14,
  },
  themeOptionDesc: {
    fontSize: 11,
    marginTop: 2,
  },
  guidelineBullet: {
    fontSize: 13,
    lineHeight: 18,
    marginBottom: 12,
  },
});
