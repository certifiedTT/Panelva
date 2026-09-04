import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Animated,
  Dimensions,
  SafeAreaView,
  Platform,
  KeyboardAvoidingView,
  StatusBar,
} from 'react-native';
import { useTheme } from '../../theme/ThemeContext';
import {
  MenuIcon,
  CloseIcon,
  SparklesIcon,
  ShieldIcon,
  LogOutIcon,
  ChevronRightIcon,
} from '../common/Icons';
import Constants from 'expo-constants';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const DRAWER_WIDTH = Math.min(SCREEN_WIDTH * 0.8, 320);
const STATUSBAR_HEIGHT = Platform.OS === 'ios' ? Math.max(Constants.statusBarHeight || 0, 50) : (StatusBar.currentHeight || 0);

export interface MobileWorkspaceNavItem {
  id: string;
  label: string;
  icon: (props: { size?: number; color?: string }) => React.ReactNode;
  badge?: string | number;
  badgeVariant?: 'default' | 'success' | 'warning' | 'error';
  authorized?: boolean;
}

export interface MobileWorkspaceNavGroup {
  id: string;
  label: string;
  items: MobileWorkspaceNavItem[];
}

interface MobileWorkspaceLayoutProps {
  type: 'creator' | 'admin';
  title: string;
  contextSubtitle?: string;
  user?: {
    username?: string;
    penName?: string;
    role?: string;
  };
  roleBadge?: string;
  groups: MobileWorkspaceNavGroup[];
  activeTab: string;
  onSelectTab: (tabId: string) => void;
  onClose: () => void;
  children: React.ReactNode;
}

export function MobileWorkspaceLayout({
  type,
  title,
  contextSubtitle,
  user,
  roleBadge,
  groups,
  activeTab,
  onSelectTab,
  onClose,
  children,
}: MobileWorkspaceLayoutProps) {
  const { colors } = useTheme();
  const [drawerOpen, setDrawerOpen] = useState(false);

  const drawerAnim = useRef(new Animated.Value(0)).current;

  const openDrawer = () => {
    setDrawerOpen(true);
    Animated.timing(drawerAnim, {
      toValue: 1,
      duration: 250,
      useNativeDriver: true,
    }).start();
  };

  const closeDrawer = () => {
    Animated.timing(drawerAnim, {
      toValue: 0,
      duration: 200,
      useNativeDriver: true,
    }).start(() => setDrawerOpen(false));
  };

  const handleSelectTab = (tabId: string) => {
    onSelectTab(tabId);
    closeDrawer();
  };

  const isCreator = type === 'creator';
  const userIdentifier = isCreator
    ? user?.penName || user?.username || 'Creator'
    : user?.username || 'Admin';

  const drawerTranslateX = drawerAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [-DRAWER_WIDTH, 0],
  });

  const backdropOpacity = drawerAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [0, 0.6],
  });

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.bg }]}>
      <StatusBar barStyle="light-content" backgroundColor={colors.bg} />

      {/* ─── 1. Persistent Top Workspace Header ─── */}
      <View
        style={[
          styles.header,
          {
            backgroundColor: colors.surfaceElevated || '#0c0d12',
            borderBottomColor: colors.borderSubtle || '#1c1e24',
          },
        ]}
      >
        {/* Left: Hamburger Button */}
        <TouchableOpacity
          style={[styles.headerBtn, { backgroundColor: colors.surface }]}
          onPress={openDrawer}
          activeOpacity={0.7}
          accessibilityLabel="Open Workspace Navigation"
        >
          <MenuIcon size={20} color={colors.text} />
        </TouchableOpacity>

        {/* Center: Workspace Context Pill */}
        <View style={[styles.contextPill, { backgroundColor: colors.surface, borderColor: colors.borderSubtle }]}>
          <View style={[styles.liveDot, { backgroundColor: '#10B981' }]} />
          <Text style={[styles.contextPillText, { color: colors.text }]} numberOfLines={1}>
            {isCreator ? `Studio • @${userIdentifier}` : `Admin • ${roleBadge || 'Operations'}`}
          </Text>
        </View>

        {/* Right: Role Tag & Close Button */}
        <View style={styles.headerRightRow}>
          {roleBadge && (
            <View
              style={[
                styles.roleBadgePill,
                {
                  backgroundColor: 'rgba(59, 130, 246, 0.15)',
                  borderColor: 'rgba(59, 130, 246, 0.3)',
                },
              ]}
            >
              <Text
                style={[
                  styles.roleBadgeText,
                  { color: '#3B82F6' },
                ]}
              >
                {roleBadge}
              </Text>
            </View>
          )}

          <TouchableOpacity
            style={[styles.closeBtn, { backgroundColor: colors.surface, borderColor: colors.borderSubtle }]}
            onPress={onClose}
            activeOpacity={0.7}
            accessibilityLabel="Close Workspace"
          >
            <CloseIcon size={16} color={colors.textMuted} />
          </TouchableOpacity>
        </View>
      </View>

      {/* ─── 2. Scrollable / Keyboard-Safe Body ─── */}
      <KeyboardAvoidingView
        style={styles.contentBody}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <View style={styles.contentBody}>{children}</View>
      </KeyboardAvoidingView>

      {/* ─── 3. Animated Off-Canvas Drawer ─── */}
      {drawerOpen && (
        <View style={StyleSheet.absoluteFillObject} pointerEvents="box-none">
          {/* Backdrop */}
          <Animated.View
            style={[
              styles.backdrop,
              {
                opacity: backdropOpacity,
              },
            ]}
          >
            <TouchableOpacity
              style={StyleSheet.absoluteFillObject}
              onPress={closeDrawer}
              activeOpacity={1}
            />
          </Animated.View>

          {/* Drawer Panel */}
          <Animated.View
            style={[
              styles.drawerPanel,
              {
                backgroundColor: colors.surfaceElevated || '#0d0e13',
                borderRightColor: colors.borderSubtle || '#1c1e24',
                transform: [{ translateX: drawerTranslateX }],
              },
            ]}
          >
            {/* Drawer Top Branding */}
            <View style={[styles.drawerHeader, { borderBottomColor: colors.borderSubtle || '#1c1e24' }]}>
              <View style={{ flex: 1 }}>
                <Text style={[styles.drawerTitle, { color: colors.text }]}>{title}</Text>
                <Text style={[styles.drawerSubtitle, { color: colors.textMuted }]}>
                  @{userIdentifier}
                </Text>
              </View>
              <TouchableOpacity
                style={styles.drawerCloseBtn}
                onPress={closeDrawer}
                activeOpacity={0.7}
              >
                <CloseIcon size={18} color={colors.textMuted} />
              </TouchableOpacity>
            </View>

            {/* Drawer Navigation Groups */}
            <ScrollView
              contentContainerStyle={styles.drawerScroll}
              showsVerticalScrollIndicator={false}
            >
              {groups.map((group) => {
                const visibleItems = group.items.filter((item) => item.authorized !== false);
                if (visibleItems.length === 0) return null;

                return (
                  <View key={group.id} style={styles.navGroup}>
                    <Text style={[styles.groupLabel, { color: colors.textMuted }]}>
                      {group.label}
                    </Text>

                    {visibleItems.map((item) => {
                      const isActive = activeTab === item.id;
                      const IconComponent = item.icon;

                      return (
                        <TouchableOpacity
                          key={item.id}
                          style={[
                            styles.navItemBtn,
                            {
                              backgroundColor: isActive
                                ? 'rgba(59, 130, 246, 0.15)'
                                : 'transparent',
                              borderColor: isActive
                                ? 'rgba(59, 130, 246, 0.3)'
                                : 'transparent',
                            },
                          ]}
                          onPress={() => handleSelectTab(item.id)}
                          activeOpacity={0.7}
                        >
                          <View style={styles.navItemLeft}>
                            <IconComponent
                              size={18}
                              color={isActive ? colors.primary : colors.textMuted}
                            />
                            <Text
                              style={[
                                styles.navItemText,
                                {
                                  color: isActive ? colors.primary : colors.text,
                                  fontWeight: isActive ? '800' : '600',
                                },
                              ]}
                            >
                              {item.label}
                            </Text>
                          </View>

                          {item.badge !== undefined && (
                            <View
                              style={[
                                styles.itemBadge,
                                {
                                  backgroundColor:
                                    item.badgeVariant === 'error'
                                      ? 'rgba(239, 68, 68, 0.2)'
                                      : item.badgeVariant === 'warning'
                                      ? 'rgba(245, 158, 11, 0.2)'
                                      : 'rgba(59, 130, 246, 0.2)',
                                },
                              ]}
                            >
                              <Text
                                style={[
                                  styles.itemBadgeText,
                                  {
                                    color:
                                      item.badgeVariant === 'error'
                                        ? '#EF4444'
                                        : item.badgeVariant === 'warning'
                                        ? '#F59E0B'
                                        : colors.primary,
                                  },
                                ]}
                              >
                                {item.badge}
                              </Text>
                            </View>
                          )}
                        </TouchableOpacity>
                      );
                    })}
                  </View>
                );
              })}
            </ScrollView>

            {/* Drawer Bottom Exit */}
            <View style={[styles.drawerFooter, { borderTopColor: colors.borderSubtle || '#1c1e24' }]}>
              <TouchableOpacity
                style={[styles.exitBtn, { backgroundColor: colors.surface, borderColor: colors.borderSubtle }]}
                onPress={() => {
                  closeDrawer();
                  onClose();
                }}
                activeOpacity={0.7}
              >
                <LogOutIcon size={16} color="#EF4444" />
                <Text style={styles.exitBtnText}>Exit Workspace</Text>
              </TouchableOpacity>
            </View>
          </Animated.View>
        </View>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    paddingTop: Platform.OS === 'ios' ? STATUSBAR_HEIGHT : 8,
    paddingBottom: 10,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 12,
    borderBottomWidth: 1,
    zIndex: 10,
  },
  headerBtn: {
    width: 36,
    height: 36,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  contextPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 14,
    borderWidth: 1,
    maxWidth: SCREEN_WIDTH * 0.45,
  },
  liveDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  contextPillText: {
    fontSize: 11,
    fontWeight: '700',
  },
  headerRightRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  roleBadgePill: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 10,
    borderWidth: 1,
  },
  roleBadgeText: {
    fontSize: 9,
    fontWeight: '800',
    textTransform: 'uppercase',
  },
  closeBtn: {
    width: 34,
    height: 34,
    borderRadius: 10,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  contentBody: {
    flex: 1,
  },
  backdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: '#000000',
    zIndex: 40,
  },
  drawerPanel: {
    position: 'absolute',
    left: 0,
    top: 0,
    bottom: 0,
    width: DRAWER_WIDTH,
    borderRightWidth: 1,
    zIndex: 50,
    shadowColor: '#000',
    shadowOffset: { width: 4, height: 0 },
    shadowOpacity: 0.5,
    shadowRadius: 10,
    elevation: 20,
  },
  drawerHeader: {
    paddingTop: Platform.OS === 'ios' ? STATUSBAR_HEIGHT : 14,
    paddingBottom: 14,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    borderBottomWidth: 1,
  },
  drawerTitle: {
    fontSize: 15,
    fontWeight: '800',
  },
  drawerSubtitle: {
    fontSize: 11,
    marginTop: 1,
  },
  drawerCloseBtn: {
    padding: 6,
  },
  drawerScroll: {
    paddingHorizontal: 12,
    paddingVertical: 14,
    gap: 16,
  },
  navGroup: {
    gap: 4,
  },
  groupLabel: {
    fontSize: 9,
    fontWeight: '800',
    letterSpacing: 0.8,
    textTransform: 'uppercase',
    paddingHorizontal: 8,
    marginBottom: 4,
  },
  navItemBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 10,
    paddingVertical: 10,
    borderRadius: 10,
    borderWidth: 1,
  },
  navItemLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    flex: 1,
  },
  navItemText: {
    fontSize: 12,
  },
  itemBadge: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 8,
  },
  itemBadgeText: {
    fontSize: 10,
    fontWeight: '800',
  },
  drawerFooter: {
    paddingHorizontal: 12,
    paddingTop: 12,
    paddingBottom: Platform.OS === 'ios' ? 34 : 16,
    borderTopWidth: 1,
  },
  exitBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 10,
    borderRadius: 10,
    borderWidth: 1,
  },
  exitBtnText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#EF4444',
  },
});
