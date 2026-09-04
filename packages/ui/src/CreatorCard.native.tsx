import React from "react";
import { View, Text, StyleSheet, TouchableOpacity, ViewStyle, StyleProp } from "react-native";
import { Image as ExpoImage } from "expo-image";
import { Check, Plus } from "lucide-react-native";
import { colors, spacing, radius, typography } from "@panelva/theme";
import { Card } from "./Card.native";
import { Button } from "./Button.native";

export interface CreatorCardProps {
  id?: string;
  name: string;
  handle?: string;
  avatarUrl?: string;
  isVerified?: boolean;
  followersCount?: number | string;
  isFollowing?: boolean;
  onFollowToggle?: () => void;
  onPress?: () => void;
  style?: StyleProp<ViewStyle>;
}

export function CreatorCard({
  name,
  handle,
  avatarUrl,
  isVerified = false,
  followersCount,
  isFollowing = false,
  onFollowToggle,
  onPress,
  style,
}: CreatorCardProps) {
  const formattedFollowers =
    typeof followersCount === "number"
      ? followersCount >= 1000
        ? `${(followersCount / 1000).toFixed(1)}k`
        : `${followersCount}`
      : followersCount;

  return (
    <Card style={[styles.card, style]}>
      <TouchableOpacity
        activeOpacity={0.7}
        onPress={onPress}
        disabled={!onPress}
        style={styles.contentRow}
      >
        <View style={styles.avatarContainer}>
          {avatarUrl ? (
            <ExpoImage
              source={{ uri: avatarUrl }}
              style={styles.avatar}
              contentFit="cover"
              transition={200}
            />
          ) : (
            <View style={[styles.avatar, styles.avatarFallback]}>
              <Text style={styles.fallbackText}>{name.charAt(0).toUpperCase()}</Text>
            </View>
          )}
          {isVerified && (
            <View style={styles.verifiedBadge}>
              <Check size={10} color={colors.text} strokeWidth={3} />
            </View>
          )}
        </View>

        <View style={styles.infoContainer}>
          <View style={styles.nameRow}>
            <Text style={styles.name} numberOfLines={1}>
              {name}
            </Text>
          </View>
          {handle && (
            <Text style={styles.handle} numberOfLines={1}>
              @{handle}
            </Text>
          )}
          {formattedFollowers !== undefined && (
            <Text style={styles.followers}>
              {formattedFollowers} <Text style={styles.followersLabel}>followers</Text>
            </Text>
          )}
        </View>
      </TouchableOpacity>

      {onFollowToggle && (
        <View style={styles.actionContainer}>
          <Button
            variant={isFollowing ? "outline" : "primary"}
            size="sm"
            onPress={onFollowToggle}
          >
            {isFollowing ? "Following" : "Follow"}
          </Button>
        </View>
      )}
    </Card>
  );
}

const styles = StyleSheet.create({
  card: {
    padding: spacing.md,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  contentRow: {
    flexDirection: "row",
    alignItems: "center",
    flex: 1,
    marginRight: spacing.sm,
  },
  avatarContainer: {
    position: "relative",
    marginRight: spacing.md,
  },
  avatar: {
    width: 48,
    height: 48,
    borderRadius: radius.full,
    backgroundColor: colors.surface,
  },
  avatarFallback: {
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: colors.border,
  },
  fallbackText: {
    ...typography.body,
    fontWeight: "700",
    color: colors.text,
  },
  verifiedBadge: {
    position: "absolute",
    bottom: -2,
    right: -2,
    width: 16,
    height: 16,
    borderRadius: radius.full,
    backgroundColor: colors.primary,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1.5,
    borderColor: colors.card,
  },
  infoContainer: {
    flex: 1,
    justifyContent: "center",
  },
  nameRow: {
    flexDirection: "row",
    alignItems: "center",
  },
  name: {
    ...typography.body,
    fontWeight: "700",
    color: colors.text,
  },
  handle: {
    ...typography.caption,
    color: colors.textMuted,
    marginTop: 2,
  },
  followers: {
    ...typography.caption,
    fontWeight: "600",
    color: colors.text,
    marginTop: spacing.xs,
  },
  followersLabel: {
    fontWeight: "400",
    color: colors.textMuted,
  },
  actionContainer: {
    marginLeft: spacing.xs,
  },
});
