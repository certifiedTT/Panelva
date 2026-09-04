import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Dimensions,
  TouchableOpacity,
  Modal,
  ScrollView,
  Platform,
  SafeAreaView,
  Alert,
  Animated,
  PanResponder,
} from 'react-native';
import * as Haptics from 'expo-haptics';
import { colors, spacing, radius, typography } from '@panelva/theme';
import {
  Crown,
  Moon,
  Sun,
  User,
  ShieldCheck,
  FileText,
  X,
  Sparkles,
  RotateCcw,
  EyeOff,
  Sliders,
  Check,
  Activity,
  Terminal,
} from 'lucide-react-native';
import { MOCK_ACCOUNTS_MAP, MockRoleKey } from '../../data/mockRoles';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

const ORB_SIZE = 44;
const SAFE_MARGIN = 12;
const RADIAL_RADIUS = 76;

// Module-level persistent coordinates across component re-renders
let savedOrbPosition = {
  x: SCREEN_WIDTH - ORB_SIZE - SAFE_MARGIN,
  y: SCREEN_HEIGHT - 170,
};

export interface FloatingDevOrbProps {
  userRole?: string | null;
  activeMockRole?: MockRoleKey | string | null;
  onOpenRoleSwitcher: () => void;
  onOpenProfile: () => void;
  onToggleTheme?: () => void;
  isDarkTheme?: boolean;
}

export function FloatingDevOrb({
  userRole,
  activeMockRole = 'USER',
  onOpenRoleSwitcher,
  onOpenProfile,
  onToggleTheme,
  isDarkTheme = true,
}: FloatingDevOrbProps) {
  // Session hide state
  const [hiddenUntilRestart, setHiddenUntilRestart] = useState(false);
  const [radialOpen, setRadialOpen] = useState(false);
  const [quickActionsVisible, setQuickActionsVisible] = useState(false);
  const [rlsModalVisible, setRlsModalVisible] = useState(false);
  const [logsModalVisible, setLogsModalVisible] = useState(false);
  const [devModeEnabled, setDevModeEnabled] = useState(true);

  // Bounds
  const minY = 56;
  const maxY = SCREEN_HEIGHT - ORB_SIZE - 90;
  const minX = SAFE_MARGIN;
  const maxX = SCREEN_WIDTH - ORB_SIZE - SAFE_MARGIN;

  // Built-in Animated Values for 60 FPS smooth gestures & edge snapping
  const pan = useRef(new Animated.ValueXY({ x: savedOrbPosition.x, y: savedOrbPosition.y })).current;
  const dragScale = useRef(new Animated.Value(1)).current;
  const dragOpacity = useRef(new Animated.Value(0.90)).current;
  const radialProgress = useRef(new Animated.Value(0)).current;
  const isDockedLeftRef = useRef(savedOrbPosition.x < SCREEN_WIDTH / 2);
  const [isDockedLeftState, setIsDockedLeftState] = useState(savedOrbPosition.x < SCREEN_WIDTH / 2);

  const longPressTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const isDraggingRef = useRef(false);
  const startPosRef = useRef({ x: savedOrbPosition.x, y: savedOrbPosition.y });
  const touchStartTimeRef = useRef(0);

  // Sync radial animation when state changes
  useEffect(() => {
    Animated.spring(radialProgress, {
      toValue: radialOpen ? 1 : 0,
      damping: 16,
      stiffness: 220,
      useNativeDriver: false,
    }).start();
  }, [radialOpen]);

  // Access Control: Only render in __DEV__ or when authenticated role is MASTER_ADMIN
  const isMasterAdmin =
    userRole === 'MASTER_ADMIN' ||
    (activeMockRole && activeMockRole.toUpperCase() === 'MASTER_ADMIN');

  if ((!__DEV__ && !isMasterAdmin) || hiddenUntilRestart) {
    return null;
  }

  const triggerHaptic = (type: 'light' | 'medium' | 'warning' = 'light') => {
    try {
      if (type === 'light') Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      else if (type === 'medium') Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
      else if (type === 'warning') Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
    } catch {}
  };

  const updateSavedPosition = (x: number, y: number) => {
    savedOrbPosition = { x, y };
  };

  // PanResponder to handle Pan, Tap, and Long-Press without external native dependencies
  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onMoveShouldSetPanResponder: (_, gestureState) => {
        return Math.abs(gestureState.dx) > 3 || Math.abs(gestureState.dy) > 3;
      },
      onPanResponderGrant: () => {
        touchStartTimeRef.current = Date.now();
        isDraggingRef.current = false;
        startPosRef.current = {
          x: (pan.x as any)._value ?? savedOrbPosition.x,
          y: (pan.y as any)._value ?? savedOrbPosition.y,
        };

        // Long-press detection (500ms) for Quick Actions
        longPressTimerRef.current = setTimeout(() => {
          if (!isDraggingRef.current) {
            triggerHaptic('warning');
            setRadialOpen(false);
            setQuickActionsVisible(true);
          }
        }, 500);
      },
      onPanResponderMove: (_, gestureState) => {
        const dist = Math.hypot(gestureState.dx, gestureState.dy);
        if (dist > 5) {
          if (longPressTimerRef.current) {
            clearTimeout(longPressTimerRef.current);
            longPressTimerRef.current = null;
          }
          if (!isDraggingRef.current) {
            isDraggingRef.current = true;
            if (radialOpen) {
              setRadialOpen(false);
            }
            Animated.parallel([
              Animated.spring(dragScale, { toValue: 1.08, useNativeDriver: false }),
              Animated.timing(dragOpacity, { toValue: 1.0, duration: 120, useNativeDriver: false }),
            ]).start();
          }

          const nextX = Math.max(minX - 4, Math.min(startPosRef.current.x + gestureState.dx, maxX + 4));
          const nextY = Math.max(minY, Math.min(startPosRef.current.y + gestureState.dy, maxY));
          pan.setValue({ x: nextX, y: nextY });
        }
      },
      onPanResponderRelease: (_, gestureState) => {
        if (longPressTimerRef.current) {
          clearTimeout(longPressTimerRef.current);
          longPressTimerRef.current = null;
        }

        const touchDuration = Date.now() - touchStartTimeRef.current;
        const dist = Math.hypot(gestureState.dx, gestureState.dy);

        if (!isDraggingRef.current && dist < 6 && touchDuration < 450) {
          // Tap: Toggle radial menu
          triggerHaptic('medium');
          setRadialOpen((prev) => !prev);
        } else if (isDraggingRef.current) {
          // Release from drag: Snap to nearest edge
          isDraggingRef.current = false;
          const currentX = (pan.x as any)._value ?? (startPosRef.current.x + gestureState.dx);
          const currentY = (pan.y as any)._value ?? (startPosRef.current.y + gestureState.dy);
          const centerX = currentX + ORB_SIZE / 2;
          const snapToLeft = centerX < SCREEN_WIDTH / 2;
          const targetX = snapToLeft ? minX : maxX;
          const targetY = Math.max(minY, Math.min(currentY, maxY));

          setIsDockedLeftState(snapToLeft);
          isDockedLeftRef.current = snapToLeft;
          updateSavedPosition(targetX, targetY);

          Animated.parallel([
            Animated.spring(pan, {
              toValue: { x: targetX, y: targetY },
              damping: 18,
              stiffness: 220,
              useNativeDriver: false,
            }),
            Animated.spring(dragScale, { toValue: 1, useNativeDriver: false }),
            Animated.timing(dragOpacity, { toValue: 0.90, duration: 150, useNativeDriver: false }),
          ]).start();

          triggerHaptic('light');
        } else {
          Animated.parallel([
            Animated.spring(dragScale, { toValue: 1, useNativeDriver: false }),
            Animated.timing(dragOpacity, { toValue: 0.90, duration: 150, useNativeDriver: false }),
          ]).start();
        }
      },
      onPanResponderTerminate: () => {
        if (longPressTimerRef.current) {
          clearTimeout(longPressTimerRef.current);
          longPressTimerRef.current = null;
        }
        isDraggingRef.current = false;
        Animated.parallel([
          Animated.spring(dragScale, { toValue: 1, useNativeDriver: false }),
          Animated.timing(dragOpacity, { toValue: 0.90, duration: 150, useNativeDriver: false }),
        ]).start();
      },
    })
  ).current;

  // Reset Orb Position
  const handleResetPosition = () => {
    const defaultX = SCREEN_WIDTH - ORB_SIZE - SAFE_MARGIN;
    const defaultY = SCREEN_HEIGHT - 170;
    Animated.spring(pan, {
      toValue: { x: defaultX, y: defaultY },
      damping: 18,
      stiffness: 220,
      useNativeDriver: false,
    }).start();
    setIsDockedLeftState(false);
    isDockedLeftRef.current = false;
    updateSavedPosition(defaultX, defaultY);
    setQuickActionsVisible(false);
    triggerHaptic('medium');
  };

  // Radial Menu Items configuration
  const menuItems = [
    {
      id: 'role',
      label: 'Role',
      icon: <Crown size={16} color="#60A5FA" />,
      onPress: () => {
        setRadialOpen(false);
        onOpenRoleSwitcher();
      },
    },
    {
      id: 'theme',
      label: 'Theme',
      icon: isDarkTheme ? <Sun size={16} color="#FBBF24" /> : <Moon size={16} color="#818CF8" />,
      onPress: () => {
        setRadialOpen(false);
        if (onToggleTheme) onToggleTheme();
      },
    },
    {
      id: 'profile',
      label: 'Profile',
      icon: <User size={16} color="#34D399" />,
      onPress: () => {
        setRadialOpen(false);
        onOpenProfile();
      },
    },
    {
      id: 'rls',
      label: 'RLS',
      icon: <ShieldCheck size={16} color="#F87171" />,
      onPress: () => {
        setRadialOpen(false);
        setRlsModalVisible(true);
      },
    },
    {
      id: 'logs',
      label: 'Logs',
      icon: <FileText size={16} color="#38BDF8" />,
      onPress: () => {
        setRadialOpen(false);
        setLogsModalVisible(true);
      },
    },
    {
      id: 'close',
      label: 'Close',
      icon: <X size={16} color="#9CA3AF" />,
      onPress: () => {
        setRadialOpen(false);
      },
    },
  ];

  // Selected mock account for RLS inspection
  const roleKey = (activeMockRole || 'USER').toUpperCase() as MockRoleKey;
  const currentProfile = MOCK_ACCOUNTS_MAP[roleKey] || MOCK_ACCOUNTS_MAP.USER;

  return (
    <>
      {/* Semi-transparent backdrop when radial menu is open */}
      {radialOpen && (
        <TouchableOpacity
          activeOpacity={1}
          style={styles.radialBackdrop}
          onPress={() => setRadialOpen(false)}
        />
      )}

      {/* Floating Developer Orb */}
      <Animated.View
        style={[
          styles.orbWrapper,
          {
            transform: [
              { translateX: pan.x },
              { translateY: pan.y },
              { scale: dragScale },
            ],
            opacity: dragOpacity,
          },
        ]}
      >
        {/* Radial Menu Items orbiting the button */}
        {menuItems.map((item, index) => {
          // Angle calculations:
          // If docked on Left: arc expands rightwards (-70° to +70°)
          // If docked on Right: arc expands leftwards (110° to 250°)
          const leftAngles = [-70, -42, -14, 14, 42, 70];
          const rightAngles = [110, 138, 166, 194, 222, 250];

          return (
            <RadialMenuItem
              key={item.id}
              item={item}
              progress={radialProgress}
              isDockedLeft={isDockedLeftState}
              leftAngle={leftAngles[index]}
              rightAngle={rightAngles[index]}
            />
          );
        })}

        {/* Primary 44x44 AssistiveTouch Button with panResponder */}
        <View {...panResponder.panHandlers} style={styles.orbButton}>
          {/* Concentric rings mimicking AssistiveTouch */}
          <View style={styles.orbOuterRing}>
            <View style={styles.orbInnerRing}>
              <View style={styles.orbCore}>
                <Terminal size={15} color="#60A5FA" strokeWidth={2.5} />
              </View>
            </View>
          </View>
        </View>
      </Animated.View>

      {/* Compact Quick-Actions Popup (Long Press) */}
      <Modal
        visible={quickActionsVisible}
        transparent
        animationType="fade"
        onRequestClose={() => setQuickActionsVisible(false)}
      >
        <TouchableOpacity
          activeOpacity={1}
          style={styles.modalOverlay}
          onPress={() => setQuickActionsVisible(false)}
        >
          <View style={styles.quickActionsCard}>
            <View style={styles.quickActionsHeader}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                <Sliders size={15} color="#3B82F6" />
                <Text style={styles.quickActionsTitle}>Developer Orb Actions</Text>
              </View>
              <TouchableOpacity onPress={() => setQuickActionsVisible(false)} style={{ padding: 4 }}>
                <X size={16} color="#9CA3AF" />
              </TouchableOpacity>
            </View>

            <TouchableOpacity
              style={styles.quickActionRow}
              onPress={() => {
                setDevModeEnabled(!devModeEnabled);
                setQuickActionsVisible(false);
                triggerHaptic('medium');
                Alert.alert(
                  'Dev Mode',
                  !devModeEnabled ? 'Dev Mode Enabled (Badges visible)' : 'Dev Mode Disabled'
                );
              }}
            >
              <View style={[styles.actionIconBox, { backgroundColor: '#1E293B' }]}>
                <Sparkles size={16} color="#60A5FA" />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.actionRowTitle}>Toggle Dev Mode</Text>
                <Text style={styles.actionRowSub}>
                  {devModeEnabled ? 'Currently Active' : 'Currently Inactive'}
                </Text>
              </View>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.quickActionRow}
              onPress={handleResetPosition}
            >
              <View style={[styles.actionIconBox, { backgroundColor: '#1E293B' }]}>
                <RotateCcw size={16} color="#34D399" />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.actionRowTitle}>Reset Position</Text>
                <Text style={styles.actionRowSub}>Snap back to bottom-right corner</Text>
              </View>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.quickActionRow, { borderBottomWidth: 0 }]}
              onPress={() => {
                setQuickActionsVisible(false);
                setHiddenUntilRestart(true);
                triggerHaptic('warning');
              }}
            >
              <View style={[styles.actionIconBox, { backgroundColor: 'rgba(239, 68, 68, 0.15)' }]}>
                <EyeOff size={16} color="#EF4444" />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={[styles.actionRowTitle, { color: '#EF4444' }]}>Hide Until Restart</Text>
                <Text style={styles.actionRowSub}>Dismiss developer orb for this session</Text>
              </View>
            </TouchableOpacity>
          </View>
        </TouchableOpacity>
      </Modal>

      {/* RLS Simulator Modal */}
      <Modal
        visible={rlsModalVisible}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={() => setRlsModalVisible(false)}
      >
        <SafeAreaView style={styles.detailModalSafe}>
          <View style={styles.detailModalHeader}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
              <ShieldCheck size={20} color="#3B82F6" />
              <View>
                <Text style={styles.detailModalTitle}>RLS & Permission Matrix</Text>
                <Text style={styles.detailModalSub}>Active Role: {currentProfile.label}</Text>
              </View>
            </View>
            <TouchableOpacity onPress={() => setRlsModalVisible(false)} style={{ padding: 6 }}>
              <X size={20} color="#9CA3AF" />
            </TouchableOpacity>
          </View>

          <ScrollView contentContainerStyle={{ padding: spacing.md, gap: spacing.md }}>
            <View style={styles.rlsRoleCard}>
              <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
                <Text style={{ fontSize: 16, fontWeight: '800', color: '#FFFFFF' }}>
                  {currentProfile.username}
                </Text>
                <View style={[styles.rlsBadge, { backgroundColor: currentProfile.badgeColor + '20', borderColor: currentProfile.badgeColor }]}>
                  <Text style={[styles.rlsBadgeText, { color: currentProfile.badgeColor }]}>
                    {currentProfile.category}
                  </Text>
                </View>
              </View>
              <Text style={{ fontSize: 12, color: '#94A3AF', marginTop: 4 }}>
                {currentProfile.description}
              </Text>
            </View>

            <Text style={styles.sectionHeader}>Enforced Row Level Security Policies:</Text>
            <View style={{ gap: spacing.xs }}>
              {[
                { table: 'comics & series', rule: 'SELECT for all; INSERT/UPDATE only if creator_id = auth.uid()' },
                { table: 'chapters & pages', rule: 'Early access locked unless subscription >= PLUS or purchased' },
                { table: 'comments & reactions', rule: 'Authenticated insert; single attachment rule verified' },
                { table: 'wallets & ledgers', rule: 'Double-entry ledger immutable; updates rejected' },
                { table: 'sticker_packs', rule: 'DRAFT visible to creator; PUBLISHED visible to all' },
                { table: 'admin_audit_logs', rule: 'MASTER_ADMIN & OPERATIONS_ADMIN read only' },
              ].map((policy, idx) => (
                <View key={idx} style={styles.policyRow}>
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                    <Check size={14} color="#34D399" />
                    <Text style={{ fontSize: 13, fontWeight: '700', color: '#E2E8F0' }}>
                      {policy.table}
                    </Text>
                  </View>
                  <Text style={{ fontSize: 11, color: '#94A3AF', marginTop: 2, paddingLeft: 20 }}>
                    {policy.rule}
                  </Text>
                </View>
              ))}
            </View>
          </ScrollView>
        </SafeAreaView>
      </Modal>

      {/* Debug Logs Modal */}
      <Modal
        visible={logsModalVisible}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={() => setLogsModalVisible(false)}
      >
        <SafeAreaView style={styles.detailModalSafe}>
          <View style={styles.detailModalHeader}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
              <Activity size={20} color="#38BDF8" />
              <View>
                <Text style={styles.detailModalTitle}>Developer Event Log</Text>
                <Text style={styles.detailModalSub}>Real-time system events & queries</Text>
              </View>
            </View>
            <TouchableOpacity onPress={() => setLogsModalVisible(false)} style={{ padding: 6 }}>
              <X size={20} color="#9CA3AF" />
            </TouchableOpacity>
          </View>

          <ScrollView contentContainerStyle={{ padding: spacing.md, gap: 8 }}>
            {[
              { time: '19:42:01', tag: 'METRO', msg: 'Bundle loaded successfully at 60 FPS' },
              { time: '19:42:04', tag: 'TRPC', msg: 'chapter.getComments query resolved (12 items)' },
              { time: '19:42:06', tag: 'STICKER', msg: 'Sticker entitlement verified: FREE (allowed: true)' },
              { time: '19:42:10', tag: 'TENOR', msg: 'Search GIF cache hit for query: "anime"' },
              { time: '19:42:12', tag: 'AUTH', msg: `Current active simulated role: ${roleKey}` },
              { time: '19:42:18', tag: 'GESTURE', msg: 'AssistiveTouch developer orb docked to nearest edge' },
            ].map((log, idx) => (
              <View key={idx} style={styles.logItem}>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                  <Text style={{ fontSize: 10, fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace', color: '#64748B' }}>
                    {log.time}
                  </Text>
                  <View style={styles.logTag}>
                    <Text style={{ fontSize: 9, fontWeight: '800', color: '#38BDF8' }}>{log.tag}</Text>
                  </View>
                </View>
                <Text style={{ fontSize: 12, color: '#CBD5E1', marginTop: 3 }}>
                  {log.msg}
                </Text>
              </View>
            ))}
          </ScrollView>
        </SafeAreaView>
      </Modal>
    </>
  );
}

// Subcomponent: Animated Radial Menu Item
function RadialMenuItem({
  item,
  progress,
  isDockedLeft,
  leftAngle,
  rightAngle,
}: {
  item: any;
  progress: Animated.Value;
  isDockedLeft: boolean;
  leftAngle: number;
  rightAngle: number;
}) {
  const angleDeg = isDockedLeft ? leftAngle : rightAngle;
  const angleRad = (angleDeg * Math.PI) / 180;
  const targetX = Math.round(Math.cos(angleRad) * RADIAL_RADIUS);
  const targetY = Math.round(Math.sin(angleRad) * RADIAL_RADIUS);

  const translateX = progress.interpolate({
    inputRange: [0, 1],
    outputRange: [0, targetX],
  });
  const translateY = progress.interpolate({
    inputRange: [0, 1],
    outputRange: [0, targetY],
  });
  const scale = progress.interpolate({
    inputRange: [0, 0.4, 1],
    outputRange: [0, 0.6, 1],
    extrapolate: 'clamp',
  });
  const opacity = progress.interpolate({
    inputRange: [0, 0.3, 1],
    outputRange: [0, 0.5, 1],
    extrapolate: 'clamp',
  });

  return (
    <Animated.View
      style={[
        styles.radialItemWrapper,
        {
          transform: [{ translateX }, { translateY }, { scale }],
          opacity,
        },
      ]}
    >
      <TouchableOpacity
        style={styles.radialButton}
        onPress={item.onPress}
        activeOpacity={0.8}
        accessibilityRole="button"
        accessibilityLabel={item.label}
      >
        {item.icon}
        <Text style={styles.radialItemLabel}>{item.label}</Text>
      </TouchableOpacity>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  radialBackdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0, 0, 0, 0.35)',
    zIndex: 99990,
  },
  orbWrapper: {
    position: 'absolute',
    top: 0,
    left: 0,
    width: ORB_SIZE,
    height: ORB_SIZE,
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 99999,
  },
  orbButton: {
    width: ORB_SIZE,
    height: ORB_SIZE,
    borderRadius: ORB_SIZE / 2,
    backgroundColor: 'rgba(15, 23, 42, 0.94)',
    borderWidth: 1.5,
    borderColor: 'rgba(59, 130, 246, 0.55)',
    alignItems: 'center',
    justifyContent: 'center',
    // Soft elevation shadow
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.38,
    shadowRadius: 6,
    elevation: 8,
  },
  orbOuterRing: {
    width: 36,
    height: 36,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.15)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  orbInnerRing: {
    width: 28,
    height: 28,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: 'rgba(96, 165, 250, 0.3)',
    backgroundColor: 'rgba(30, 41, 59, 0.85)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  orbCore: {
    width: 18,
    height: 18,
    borderRadius: 9,
    alignItems: 'center',
    justifyContent: 'center',
  },
  radialItemWrapper: {
    position: 'absolute',
    width: 44,
    height: 44,
    alignItems: 'center',
    justifyContent: 'center',
  },
  radialButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#0F172A',
    borderWidth: 1.2,
    borderColor: '#334155',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 6,
    gap: 1,
  },
  radialItemLabel: {
    fontSize: 9,
    fontWeight: '700',
    color: '#E2E8F0',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.55)',
    alignItems: 'center',
    justifyContent: 'center',
    padding: spacing.lg,
  },
  quickActionsCard: {
    width: '100%',
    maxWidth: 320,
    backgroundColor: '#0F172A',
    borderRadius: 16,
    borderWidth: 1.5,
    borderColor: '#1E293B',
    padding: spacing.md,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.45,
    shadowRadius: 16,
    elevation: 12,
  },
  quickActionsHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingBottom: spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(30, 41, 59, 0.8)',
    marginBottom: spacing.xs,
  },
  quickActionsTitle: {
    fontSize: 14,
    fontWeight: '800',
    color: '#F8FAFC',
  },
  quickActionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    paddingVertical: spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(30, 41, 59, 0.6)',
  },
  actionIconBox: {
    width: 32,
    height: 32,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  actionRowTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: '#F1F5F9',
  },
  actionRowSub: {
    fontSize: 11,
    color: '#94A3B8',
    marginTop: 1,
  },
  detailModalSafe: {
    flex: 1,
    backgroundColor: '#0F172A',
  },
  detailModalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: '#1E293B',
  },
  detailModalTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: '#F8FAFC',
  },
  detailModalSub: {
    fontSize: 12,
    color: '#94A3B8',
  },
  rlsRoleCard: {
    backgroundColor: '#1E293B',
    borderRadius: 12,
    padding: spacing.md,
    borderWidth: 1,
    borderColor: '#334155',
  },
  rlsBadge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
    borderWidth: 1,
  },
  rlsBadgeText: {
    fontSize: 10,
    fontWeight: '800',
  },
  sectionHeader: {
    fontSize: 13,
    fontWeight: '700',
    color: '#94A3B8',
    marginTop: spacing.xs,
  },
  policyRow: {
    backgroundColor: 'rgba(15, 23, 42, 0.7)',
    borderRadius: 8,
    padding: spacing.sm,
    borderWidth: 1,
    borderColor: 'rgba(30, 41, 59, 0.9)',
  },
  logItem: {
    backgroundColor: '#1E293B',
    borderRadius: 8,
    padding: spacing.sm,
    borderLeftWidth: 3,
    borderLeftColor: '#38BDF8',
  },
  logTag: {
    backgroundColor: 'rgba(56, 189, 248, 0.15)',
    paddingHorizontal: 5,
    paddingVertical: 1,
    borderRadius: 4,
  },
});
