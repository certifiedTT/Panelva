import React from "react";
import { View, Text, StyleSheet, TouchableOpacity, ViewStyle, StyleProp } from "react-native";
import { Image as ExpoImage } from "expo-image";
import { Star, BookOpen } from "lucide-react-native";
import { colors, spacing, radius, typography } from "@panelva/theme";
import { Card } from "./Card.native";
import { Badge } from "./Badge.native";

export interface SeriesCardProps {
  id?: string;
  title: string;
  coverUrl: string;
  type?: "COMIC" | "NOVEL";
  rating?: string | number;
  genre?: string;
  author?: string;
  totalChapters?: number;
  badgeText?: string;
  cardWidth?: number;
  onPress?: () => void;
  style?: StyleProp<ViewStyle>;
}

export function SeriesCard({
  title,
  coverUrl,
  type = "COMIC",
  rating,
  genre,
  author,
  totalChapters,
  badgeText,
  cardWidth,
  onPress,
  style,
}: SeriesCardProps) {
  const isNovel = type === "NOVEL";

  return (
    <Card
      style={[
        styles.card,
        cardWidth ? { width: cardWidth } : undefined,
        style,
      ]}
    >
      <TouchableOpacity
        activeOpacity={0.8}
        onPress={onPress}
        disabled={!onPress}
        style={styles.touchable}
      >
        {/* Cover Aspect Ratio container (approx 3:4) */}
        <View style={styles.imageContainer}>
          <ExpoImage
            source={{ uri: coverUrl }}
            style={styles.coverImage}
            contentFit="cover"
            transition={200}
          />
          {/* Top badges */}
          <View style={styles.badgeRow}>
            <Badge variant={isNovel ? "secondary" : "primary"} size="sm">
              {type}
            </Badge>
            {badgeText && (
              <Badge variant="outline" size="sm">
                {badgeText}
              </Badge>
            )}
          </View>

          {/* Rating Pill overlay at bottom of cover */}
          {rating !== undefined && (
            <View style={styles.ratingPill}>
              <Star size={10} color={colors.warning} fill={colors.warning} />
              <Text style={styles.ratingText}>{rating}</Text>
            </View>
          )}
        </View>

        {/* Content details */}
        <View style={styles.detailsContainer}>
          <Text style={styles.title} numberOfLines={1}>
            {title}
          </Text>

          <View style={styles.metadataRow}>
            {genre && (
              <Text style={styles.genreText} numberOfLines={1}>
                {genre}
              </Text>
            )}
            {genre && (author || totalChapters !== undefined) && (
              <Text style={styles.dotSeparator}>•</Text>
            )}
            {author && (
              <Text style={styles.authorText} numberOfLines={1}>
                {author}
              </Text>
            )}
            {!author && totalChapters !== undefined && (
              <Text style={styles.authorText} numberOfLines={1}>
                {totalChapters} ch
              </Text>
            )}
          </View>
        </View>
      </TouchableOpacity>
    </Card>
  );
}

const styles = StyleSheet.create({
  card: {
    padding: 0,
    overflow: "hidden",
    borderRadius: radius.md,
  },
  touchable: {
    width: "100%",
  },
  imageContainer: {
    width: "100%",
    aspectRatio: 0.72,
    backgroundColor: colors.surface,
    position: "relative",
    overflow: "hidden",
    borderTopLeftRadius: radius.md,
    borderTopRightRadius: radius.md,
  },
  coverImage: {
    width: "100%",
    height: "100%",
  },
  badgeRow: {
    position: "absolute",
    top: spacing.xs,
    left: spacing.xs,
    flexDirection: "row",
    gap: spacing.xs,
  },
  ratingPill: {
    position: "absolute",
    bottom: spacing.xs,
    right: spacing.xs,
    backgroundColor: "rgba(15, 23, 42, 0.85)",
    paddingHorizontal: spacing.xs,
    paddingVertical: 2,
    borderRadius: radius.sm,
    flexDirection: "row",
    alignItems: "center",
    gap: 3,
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.1)",
  },
  ratingText: {
    ...typography.caption,
    fontSize: 10,
    fontWeight: "700",
    color: colors.text,
  },
  detailsContainer: {
    padding: spacing.sm,
  },
  title: {
    ...typography.bodySm,
    fontWeight: "700",
    color: colors.text,
  },
  metadataRow: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 2,
  },
  genreText: {
    ...typography.caption,
    color: colors.primary,
    fontWeight: "600",
  },
  dotSeparator: {
    ...typography.caption,
    color: colors.textMuted,
    marginHorizontal: 4,
  },
  authorText: {
    ...typography.caption,
    color: colors.textMuted,
    flex: 1,
  },
});
