import React from "react";
import { View, Text, TouchableOpacity, StyleSheet, ViewStyle, StyleProp } from "react-native";
import { Home, BookOpen, Sparkles, Bell, MoreHorizontal } from "lucide-react-native";
import { colors, spacing, radius, typography } from "@panelva/theme";

export type BottomNavTabId = "home" | "series" | "creator_hub" | "alerts" | "more";

export interface BottomNavProps {
  activeTab: BottomNavTabId;
  onTabChange: (tab: BottomNavTabId) => void;
  unreadAlertsCount?: number;
  style?: StyleProp<ViewStyle>;
}

export function BottomNav({
  activeTab,
  onTabChange,
  unreadAlertsCount = 0,
  style,
}: BottomNavProps) {
  const tabs: {
    id: BottomNavTabId;
    label: string;
    icon: (color: string) => React.ReactNode;
  }[] = [
    {
      id: "home",
      label: "Home",
      icon: (color) => <Home size={22} color={color} strokeWidth={2} />,
    },
    {
      id: "series",
      label: "Series",
      icon: (color) => <BookOpen size={22} color={color} strokeWidth={2} />,
    },
    {
      id: "creator_hub",
      label: "Hub",
      icon: (color) => <Sparkles size={22} color={color} strokeWidth={2} />,
    },
    {
      id: "alerts",
      label: "Alerts",
      icon: (color) => (
        <View style={styles.alertIconWrapper}>
          <Bell size={22} color={color} strokeWidth={2} />
          {unreadAlertsCount > 0 && (
            <View style={styles.badge}>
              <Text style={styles.badgeText}>
                {unreadAlertsCount > 9 ? "9+" : unreadAlertsCount}
              </Text>
            </View>
          )}
        </View>
      ),
    },
    {
      id: "more",
      label: "More",
      icon: (color) => <MoreHorizontal size={22} color={color} strokeWidth={2} />,
    },
  ];

  return (
    <View style={[styles.container, style]}>
      {tabs.map((tab) => {
        const isActive = activeTab === tab.id;
        const iconColor = isActive ? colors.primary : colors.textMuted;
        const textColor = isActive ? colors.primary : colors.textMuted;

        return (
          <TouchableOpacity
            key={tab.id}
            style={styles.tabButton}
            onPress={() => onTabChange(tab.id)}
            activeOpacity={0.7}
            accessibilityRole="tab"
            accessibilityState={{ selected: isActive }}
            accessibilityLabel={tab.label}
          >
            <View
              style={[
                styles.iconContainer,
                isActive && styles.activeIconContainer,
              ]}
            >
              {tab.icon(iconColor)}
            </View>
            <Text
              style={[
                styles.label,
                { color: textColor, fontWeight: isActive ? "700" : "500" },
              ]}
              numberOfLines={1}
            >
              {tab.label}
            </Text>
          </TouchableOpacity>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: "row",
    height: 64,
    backgroundColor: colors.surface,
    borderTopWidth: 1,
    borderTopColor: colors.border,
    paddingBottom: spacing.xs,
    paddingTop: spacing.xs,
    paddingHorizontal: spacing.sm,
    alignItems: "center",
    justifyContent: "space-around",
  },
  tabButton: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    height: "100%",
  },
  iconContainer: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
    borderRadius: radius.md,
    alignItems: "center",
    justifyContent: "center",
  },
  activeIconContainer: {
    backgroundColor: "rgba(37, 99, 235, 0.12)",
  },
  label: {
    ...typography.caption,
    fontSize: 11,
    marginTop: 2,
    letterSpacing: 0.2,
  },
  alertIconWrapper: {
    position: "relative",
  },
  badge: {
    position: "absolute",
    top: -3,
    right: -7,
    minWidth: 16,
    height: 16,
    borderRadius: radius.full,
    backgroundColor: colors.primary,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 3,
    borderWidth: 1.5,
    borderColor: colors.surface,
  },
  badgeText: {
    color: "#FFFFFF",
    fontSize: 9,
    fontWeight: "700",
  },
});
