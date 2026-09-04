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
  LayoutDashboard,
  Users,
  BookOpen,
  Flag,
  DollarSign,
  ScrollText,
  Shield,
  X,
} from "lucide-react-native";
import { colors, spacing, radius, typography } from "@panelva/theme";

export type AdminRole = "MASTER_ADMIN" | "ADMIN" | "MODERATOR" | "BIZ_OPS";

export type AdminPageId =
  | "overview"
  | "users"
  | "series"
  | "reports"
  | "payouts"
  | "logs";

export interface AdminShellNativeProps {
  children: React.ReactNode;
  activePage: AdminPageId;
  onSelectPage: (page: AdminPageId) => void;
  role: AdminRole;
  adminName?: string;
  onClose?: () => void;
  style?: StyleProp<ViewStyle>;
}

const ROLE_ALLOWED_PAGES: Record<AdminRole, AdminPageId[]> = {
  MASTER_ADMIN: ["overview", "users", "series", "reports", "payouts", "logs"],
  ADMIN: ["overview", "users", "series"],
  MODERATOR: ["overview", "reports"],
  BIZ_OPS: ["overview", "payouts"],
};

const ALL_ADMIN_ITEMS: {
  id: AdminPageId;
  label: string;
  icon: (color: string) => React.ReactNode;
}[] = [
  {
    id: "overview",
    label: "Overview",
    icon: (c) => <LayoutDashboard size={18} color={c} />,
  },
  {
    id: "users",
    label: "Users",
    icon: (c) => <Users size={18} color={c} />,
  },
  {
    id: "series",
    label: "Series",
    icon: (c) => <BookOpen size={18} color={c} />,
  },
  {
    id: "reports",
    label: "Reports",
    icon: (c) => <Flag size={18} color={c} />,
  },
  {
    id: "payouts",
    label: "Payouts",
    icon: (c) => <DollarSign size={18} color={c} />,
  },
  {
    id: "logs",
    label: "Logs",
    icon: (c) => <ScrollText size={18} color={c} />,
  },
];

export function AdminShell({
  children,
  activePage,
  onSelectPage,
  role,
  adminName = "Console Admin",
  onClose,
  style,
}: AdminShellNativeProps) {
  const allowedPageIds = ROLE_ALLOWED_PAGES[role] || ["overview"];
  const visibleItems = ALL_ADMIN_ITEMS.filter((item) =>
    allowedPageIds.includes(item.id)
  );

  return (
    <SafeAreaView style={[styles.safeArea, style]}>
      {/* Admin Header with Blue Accents */}
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <View style={styles.badgeRow}>
            <Shield size={14} color="#60A5FA" />
            <Text style={styles.badgeText}>ADMIN CONSOLE</Text>
            <View style={styles.roleTag}>
              <Text style={styles.roleTagText}>{role.replace("_", " ")}</Text>
            </View>
          </View>
          <Text style={styles.adminName} numberOfLines={1}>
            {adminName}
          </Text>
        </View>
        {onClose && (
          <TouchableOpacity
            onPress={onClose}
            style={styles.closeBtn}
            activeOpacity={0.7}
            accessibilityRole="button"
            accessibilityLabel="Close Console"
          >
            <X size={18} color={colors.textMuted} />
          </TouchableOpacity>
        )}
      </View>

      {/* RBAC Navigation Tabs */}
      <View style={styles.tabsWrapper}>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.tabsScroll}
        >
          {visibleItems.map((item) => {
            const isActive = activePage === item.id;
            return (
              <TouchableOpacity
                key={item.id}
                style={[styles.tabBtn, isActive && styles.activeTabBtn]}
                onPress={() => onSelectPage(item.id)}
                activeOpacity={0.7}
                accessibilityRole="tab"
                accessibilityState={{ selected: isActive }}
              >
                {item.icon(isActive ? "#60A5FA" : colors.textMuted)}
                <Text
                  style={[
                    styles.tabLabel,
                    {
                      color: isActive ? "#FFFFFF" : colors.textMuted,
                      fontWeight: isActive ? "700" : "500",
                    },
                  ]}
                >
                  {item.label}
                </Text>
              </TouchableOpacity>
            );
          })}
        </ScrollView>
      </View>

      {/* Admin Content Area */}
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
    gap: 4,
  },
  badgeRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  badgeText: {
    ...typography.caption,
    fontSize: 10,
    fontWeight: "700",
    color: "#60A5FA",
    letterSpacing: 0.5,
  },
  roleTag: {
    backgroundColor: "rgba(37, 99, 235, 0.2)",
    paddingHorizontal: 6,
    paddingVertical: 1,
    borderRadius: radius.sm,
  },
  roleTagText: {
    color: "#93C5FD",
    fontSize: 9,
    fontWeight: "700",
  },
  adminName: {
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
    backgroundColor: "rgba(37, 99, 235, 0.2)",
  },
  tabLabel: {
    ...typography.caption,
    fontSize: 13,
  },
  content: {
    flex: 1,
  },
});
