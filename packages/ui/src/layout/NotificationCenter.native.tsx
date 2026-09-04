import React from "react";
import {
  View,
  Text,
  TouchableOpacity,
  Image,
  ImageStyle,
  StyleSheet,
  ViewStyle,
  StyleProp,
} from "react-native";
import { Bell, CheckCheck } from "lucide-react-native";
import { colors, spacing, radius, typography } from "@panelva/theme";

export interface NotificationItem {
  id: string;
  avatarUrl?: string;
  title: string;
  message: string;
  timestamp: string;
  isRead: boolean;
  linkUrl?: string;
}

export interface NotificationCenterNativeProps {
  notifications: NotificationItem[];
  onMarkAllAsRead?: () => void;
  onSelectNotification?: (item: NotificationItem) => void;
  style?: StyleProp<ViewStyle>;
}

export function NotificationCenter({
  notifications,
  onMarkAllAsRead,
  onSelectNotification,
  style,
}: NotificationCenterNativeProps) {
  const unreadCount = notifications.filter((n) => !n.isRead).length;

  return (
    <View style={[styles.container, style]}>
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <Bell size={16} color={colors.primary} />
          <Text style={styles.headerTitle}>Notifications</Text>
          {unreadCount > 0 && (
            <View style={styles.unreadBadge}>
              <Text style={styles.unreadBadgeText}>{unreadCount} new</Text>
            </View>
          )}
        </View>

        {unreadCount > 0 && onMarkAllAsRead && (
          <TouchableOpacity
            onPress={onMarkAllAsRead}
            style={styles.markAllBtn}
            activeOpacity={0.7}
          >
            <CheckCheck size={14} color={colors.textMuted} />
            <Text style={styles.markAllText}>Mark all read</Text>
          </TouchableOpacity>
        )}
      </View>

      {/* Cells List */}
      <View style={styles.listContainer}>
        {notifications.length === 0 ? (
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyText}>No notifications at this time.</Text>
          </View>
        ) : (
          notifications.map((item) => (
            <TouchableOpacity
              key={item.id}
              style={[styles.cell, !item.isRead && styles.unreadCell]}
              onPress={() => onSelectNotification?.(item)}
              activeOpacity={0.7}
            >
              {/* Avatar */}
              <View style={styles.avatarWrapper}>
                {item.avatarUrl ? (
                  <Image source={{ uri: item.avatarUrl }} style={styles.avatar as ImageStyle} />
                ) : (
                  <View style={styles.avatarPlaceholder}>
                    <Bell size={16} color={colors.primary} />
                  </View>
                )}
                {!item.isRead && <View style={styles.dotIndicator} />}
              </View>

              {/* Text */}
              <View style={styles.textContent}>
                <View style={styles.titleRow}>
                  <Text
                    style={[
                      styles.cellTitle,
                      !item.isRead && styles.unreadTitle,
                    ]}
                    numberOfLines={1}
                  >
                    {item.title}
                  </Text>
                  <Text style={styles.cellTime}>{item.timestamp}</Text>
                </View>
                <Text style={styles.cellMessage} numberOfLines={2}>
                  {item.message}
                </Text>
              </View>
            </TouchableOpacity>
          ))
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.border,
    overflow: "hidden",
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
    backgroundColor: colors.card,
  },
  headerLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.xs,
  },
  headerTitle: {
    ...typography.h3,
    fontSize: 14,
    color: colors.text,
  },
  unreadBadge: {
    backgroundColor: "rgba(37, 99, 235, 0.2)",
    paddingHorizontal: spacing.xs,
    paddingVertical: 2,
    borderRadius: radius.full,
  },
  unreadBadgeText: {
    ...typography.caption,
    fontSize: 10,
    color: colors.primary,
    fontWeight: "700",
  },
  markAllBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  markAllText: {
    ...typography.caption,
    color: colors.textMuted,
  },
  listContainer: {},
  emptyContainer: {
    padding: spacing.xl,
    alignItems: "center",
  },
  emptyText: {
    ...typography.bodySm,
    color: colors.textMuted,
  },
  cell: {
    flexDirection: "row",
    alignItems: "flex-start",
    padding: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
    gap: spacing.sm,
  },
  unreadCell: {
    backgroundColor: "rgba(37, 99, 235, 0.05)",
  },
  avatarWrapper: {
    position: "relative",
  },
  avatar: {
    width: 40,
    height: 40,
    borderRadius: radius.full,
    backgroundColor: colors.card,
  },
  avatarPlaceholder: {
    width: 40,
    height: 40,
    borderRadius: radius.full,
    backgroundColor: "rgba(37, 99, 235, 0.15)",
    alignItems: "center",
    justifyContent: "center",
  },
  dotIndicator: {
    position: "absolute",
    top: 0,
    right: 0,
    width: 10,
    height: 10,
    borderRadius: radius.full,
    backgroundColor: colors.primary,
    borderWidth: 2,
    borderColor: colors.surface,
  },
  textContent: {
    flex: 1,
    gap: 3,
  },
  titleRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  cellTitle: {
    ...typography.bodySm,
    fontWeight: "500",
    color: colors.textMuted,
    flex: 1,
  },
  unreadTitle: {
    fontWeight: "700",
    color: colors.text,
  },
  cellTime: {
    ...typography.caption,
    fontSize: 11,
    color: colors.textMuted,
    marginLeft: spacing.xs,
  },
  cellMessage: {
    ...typography.caption,
    fontSize: 12,
    color: colors.textMuted,
    lineHeight: 16,
  },
});
