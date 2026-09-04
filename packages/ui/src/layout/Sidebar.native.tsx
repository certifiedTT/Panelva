import React from "react";
import { View, Text, TouchableOpacity, StyleSheet, ViewStyle, StyleProp } from "react-native";
import { colors, spacing, radius, typography } from "@panelva/theme";

export interface SidebarNativeItem {
  id: string;
  label: string;
  icon: (color: string) => React.ReactNode;
  badge?: string | number;
}

export interface SidebarNativeProps {
  items: SidebarNativeItem[];
  activeId: string;
  onSelect: (id: string) => void;
  header?: React.ReactNode;
  footer?: React.ReactNode;
  accentColor?: "blue" | "purple";
  style?: StyleProp<ViewStyle>;
}

export function Sidebar({
  items,
  activeId,
  onSelect,
  header,
  footer,
  accentColor = "blue",
  style,
}: SidebarNativeProps) {
  const activeBg = "rgba(37, 99, 235, 0.15)";
  const activeTextColor = "#60A5FA";
  const activeIconColor = colors.primary;

  return (
    <View style={[styles.container, style]}>
      {header && <View style={styles.headerContainer}>{header}</View>}

      <View style={styles.navContainer}>
        {items.map((item) => {
          const isActive = activeId === item.id;
          return (
            <TouchableOpacity
              key={item.id}
              style={[
                styles.itemBtn,
                isActive && { backgroundColor: activeBg },
              ]}
              onPress={() => onSelect(item.id)}
              activeOpacity={0.7}
            >
              <View style={styles.itemLeft}>
                {item.icon(isActive ? activeIconColor : colors.textMuted)}
                <Text
                  style={[
                    styles.itemLabel,
                    {
                      color: isActive ? activeTextColor : colors.textMuted,
                      fontWeight: isActive ? "700" : "500",
                    },
                  ]}
                >
                  {item.label}
                </Text>
              </View>
              {item.badge !== undefined && (
                <View style={styles.badge}>
                  <Text style={styles.badgeText}>{item.badge}</Text>
                </View>
              )}
            </TouchableOpacity>
          );
        })}
      </View>

      {footer && <View style={styles.footerContainer}>{footer}</View>}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    width: 220,
    backgroundColor: colors.surface,
    borderRightWidth: 1,
    borderRightColor: colors.border,
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.sm,
  },
  headerContainer: {
    marginBottom: spacing.md,
    paddingHorizontal: spacing.sm,
  },
  navContainer: {
    flex: 1,
    gap: spacing.xs,
  },
  itemBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.sm,
    borderRadius: radius.md,
  },
  itemLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
  },
  itemLabel: {
    ...typography.bodySm,
  },
  badge: {
    paddingHorizontal: spacing.xs,
    paddingVertical: 2,
    borderRadius: radius.full,
    backgroundColor: colors.card,
  },
  badgeText: {
    ...typography.caption,
    fontSize: 10,
    color: colors.textMuted,
  },
  footerContainer: {
    marginTop: "auto",
    paddingTop: spacing.sm,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
});
