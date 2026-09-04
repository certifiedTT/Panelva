import React from "react";
import { View, Text, TouchableOpacity, StyleSheet, ViewStyle, StyleProp } from "react-native";
import { Search, Bell, User } from "lucide-react-native";
import { colors, spacing, radius, typography } from "@panelva/theme";

export interface TopBarNativeProps {
  title?: string;
  onOpenSearch?: () => void;
  onOpenNotifications?: () => void;
  onOpenProfile?: () => void;
  unreadCount?: number;
  leftElement?: React.ReactNode;
  rightElement?: React.ReactNode;
  style?: StyleProp<ViewStyle>;
}

export function TopBar({
  title = "Panelva",
  onOpenSearch,
  onOpenNotifications,
  onOpenProfile,
  unreadCount = 0,
  leftElement,
  rightElement,
  style,
}: TopBarNativeProps) {
  return (
    <View style={[styles.container, style]}>
      <View style={styles.leftContainer}>
        {leftElement || (
          <View style={styles.brandRow}>
            <View style={styles.logoBadge}>
              <Text style={styles.logoLetter}>P</Text>
            </View>
            <Text style={styles.title}>{title}</Text>
          </View>
        )}
      </View>

      <View style={styles.rightContainer}>
        {rightElement || (
          <View style={styles.actionsRow}>
            {onOpenSearch && (
              <TouchableOpacity
                onPress={onOpenSearch}
                style={styles.iconBtn}
                activeOpacity={0.7}
                accessibilityRole="button"
                accessibilityLabel="Search"
              >
                <Search size={18} color={colors.text} />
              </TouchableOpacity>
            )}

            {onOpenNotifications && (
              <TouchableOpacity
                onPress={onOpenNotifications}
                style={styles.iconBtn}
                activeOpacity={0.7}
                accessibilityRole="button"
                accessibilityLabel="Notifications"
              >
                <Bell size={18} color={colors.text} />
                {unreadCount > 0 && (
                  <View style={styles.badge}>
                    <Text style={styles.badgeText}>
                      {unreadCount > 9 ? "9+" : unreadCount}
                    </Text>
                  </View>
                )}
              </TouchableOpacity>
            )}

            {onOpenProfile && (
              <TouchableOpacity
                onPress={onOpenProfile}
                style={styles.profileBtn}
                activeOpacity={0.7}
                accessibilityRole="button"
                accessibilityLabel="Profile"
              >
                <User size={16} color={colors.text} />
              </TouchableOpacity>
            )}
          </View>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    height: 56,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: spacing.md,
    backgroundColor: colors.background,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  leftContainer: {
    flex: 1,
    justifyContent: "center",
  },
  brandRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
  },
  logoBadge: {
    width: 28,
    height: 28,
    borderRadius: radius.sm,
    backgroundColor: colors.primary,
    alignItems: "center",
    justifyContent: "center",
  },
  logoLetter: {
    color: colors.text,
    fontSize: 14,
    fontWeight: "700",
  },
  title: {
    ...typography.h3,
    color: colors.text,
  },
  rightContainer: {
    flexDirection: "row",
    alignItems: "center",
  },
  actionsRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.xs,
  },
  iconBtn: {
    width: 36,
    height: 36,
    borderRadius: radius.md,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    alignItems: "center",
    justifyContent: "center",
    position: "relative",
  },
  profileBtn: {
    width: 36,
    height: 36,
    borderRadius: radius.full,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    alignItems: "center",
    justifyContent: "center",
  },
  badge: {
    position: "absolute",
    top: -2,
    right: -2,
    minWidth: 14,
    height: 14,
    borderRadius: radius.full,
    backgroundColor: colors.primary,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 2,
    borderWidth: 1,
    borderColor: colors.background,
  },
  badgeText: {
    color: "#FFFFFF",
    fontSize: 8,
    fontWeight: "700",
  },
});
