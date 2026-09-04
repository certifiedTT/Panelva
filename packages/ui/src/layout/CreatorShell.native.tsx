import React from "react";
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  TouchableOpacity,
  ScrollView,
  ViewStyle,
  StyleProp,
} from "react-native";
import {
  Home,
  BookOpen,
  BarChart3,
  Wallet,
  Users,
  Settings,
  X,
  Sparkles,
} from "lucide-react-native";
import { colors, spacing, radius, typography } from "@panelva/theme";

export type CreatorStudioTab =
  | "dashboard"
  | "series"
  | "analytics"
  | "revenue"
  | "membership"
  | "stickers"
  | "community"
  | "settings";

export interface CreatorShellNativeProps {
  children: React.ReactNode;
  activeTab: CreatorStudioTab;
  onTabChange: (tab: CreatorStudioTab) => void;
  creatorName?: string;
  onClose?: () => void;
  style?: StyleProp<ViewStyle>;
}

export function CreatorShell({
  children,
  activeTab,
  onTabChange,
  creatorName = "Creator Studio",
  onClose,
  style,
}: CreatorShellNativeProps) {
  const tabs: {
    id: CreatorStudioTab;
    label: string;
    icon: (color: string) => React.ReactNode;
  }[] = [
    {
      id: "dashboard",
      label: "Dashboard",
      icon: (c) => <Home size={18} color={c} />,
    },
    {
      id: "series",
      label: "Series",
      icon: (c) => <BookOpen size={18} color={c} />,
    },
    {
      id: "analytics",
      label: "Analytics",
      icon: (c) => <BarChart3 size={18} color={c} />,
    },
    {
      id: "revenue",
      label: "Monetization",
      icon: (c) => <Wallet size={18} color={c} />,
    },
    {
      id: "membership",
      label: "Membership",
      icon: (c) => <Users size={18} color={c} />,
    },
    {
      id: "stickers",
      label: "Sticker Packs",
      icon: (c) => <Sparkles size={18} color={c} />,
    },
    {
      id: "community",
      label: "Community",
      icon: (c) => <Users size={18} color={c} />,
    },
    {
      id: "settings",
      label: "Settings",
      icon: (c) => <Settings size={18} color={c} />,
    },
  ];

  return (
    <SafeAreaView style={[styles.safeArea, style]}>
      {/* Studio Header */}
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <Text style={styles.badgeText}>STUDIO</Text>
          <Text style={styles.creatorName} numberOfLines={1}>
            {creatorName}
          </Text>
        </View>
        {onClose && (
          <TouchableOpacity
            onPress={onClose}
            style={styles.closeBtn}
            activeOpacity={0.7}
            accessibilityRole="button"
            accessibilityLabel="Close Studio"
          >
            <X size={18} color={colors.textMuted} />
          </TouchableOpacity>
        )}
      </View>

      {/* Horizontal Studio Navigation Tabs */}
      <View style={styles.tabsWrapper}>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.tabsScroll}
        >
          {tabs.map((tab) => {
            const isActive = activeTab === tab.id;
            return (
              <TouchableOpacity
                key={tab.id}
                style={[styles.tabBtn, isActive && styles.activeTabBtn]}
                onPress={() => onTabChange(tab.id)}
                activeOpacity={0.7}
                accessibilityRole="tab"
                accessibilityState={{ selected: isActive }}
              >
                {tab.icon(isActive ? colors.primary : colors.textMuted)}
                <Text
                  style={[
                    styles.tabLabel,
                    {
                      color: isActive ? colors.text : colors.textMuted,
                      fontWeight: isActive ? "700" : "500",
                    },
                  ]}
                >
                  {tab.label}
                </Text>
              </TouchableOpacity>
            );
          })}
        </ScrollView>
      </View>

      {/* Content */}
      <View style={styles.content}>{children}</View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: colors.background,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
    backgroundColor: colors.surface,
  },
  headerLeft: {
    flex: 1,
    gap: 2,
  },
  badgeText: {
    ...typography.caption,
    fontSize: 10,
    fontWeight: "700",
    color: colors.primary,
    letterSpacing: 0.5,
  },
  creatorName: {
    ...typography.h3,
    color: colors.text,
  },
  closeBtn: {
    width: 32,
    height: 32,
    borderRadius: radius.full,
    backgroundColor: colors.card,
    alignItems: "center",
    justifyContent: "center",
  },
  tabsWrapper: {
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
    backgroundColor: colors.surface,
  },
  tabsScroll: {
    paddingHorizontal: spacing.md,
    gap: spacing.xs,
    paddingVertical: spacing.xs,
  },
  tabBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.xs,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: radius.md,
  },
  activeTabBtn: {
    backgroundColor: "rgba(37, 99, 235, 0.15)",
  },
  tabLabel: {
    ...typography.caption,
    fontSize: 13,
  },
  content: {
    flex: 1,
  },
});
