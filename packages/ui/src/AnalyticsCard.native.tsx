import React from "react";
import { View, Text, StyleSheet, ViewStyle, StyleProp } from "react-native";
import { TrendingUp, TrendingDown } from "lucide-react-native";
import { colors, spacing, radius, typography } from "@panelva/theme";
import { Card } from "./Card.native";

export interface AnalyticsCardProps {
  title: string;
  value: string | number;
  growth?: number | string;
  isPositive?: boolean;
  icon?: React.ReactNode;
  subtitle?: string;
  style?: StyleProp<ViewStyle>;
}

export function AnalyticsCard({
  title,
  value,
  growth,
  isPositive = true,
  icon,
  subtitle,
  style,
}: AnalyticsCardProps) {
  return (
    <Card style={[styles.card, style]}>
      {/* Header: Title and Icon */}
      <View style={styles.header}>
        <Text style={styles.title} numberOfLines={1}>
          {title}
        </Text>
        {icon && <View style={styles.iconContainer}>{icon}</View>}
      </View>

      {/* Main Metric Value */}
      <Text style={styles.value} numberOfLines={1}>
        {value}
      </Text>

      {/* Footer: Growth pill & optional subtitle */}
      {(growth !== undefined || subtitle) && (
        <View style={styles.footer}>
          {growth !== undefined && (
            <View
              style={[
                styles.growthPill,
                {
                  backgroundColor: isPositive
                    ? "rgba(34, 197, 94, 0.15)"
                    : "rgba(239, 68, 68, 0.15)",
                },
              ]}
            >
              {isPositive ? (
                <TrendingUp size={12} color={colors.success} />
              ) : (
                <TrendingDown size={12} color={colors.danger} />
              )}
              <Text
                style={[
                  styles.growthText,
                  { color: isPositive ? colors.success : colors.danger },
                ]}
              >
                {typeof growth === "number"
                  ? `${growth > 0 ? "+" : ""}${growth}%`
                  : growth}
              </Text>
            </View>
          )}

          {subtitle && (
            <Text style={styles.subtitle} numberOfLines={1}>
              {subtitle}
            </Text>
          )}
        </View>
      )}
    </Card>
  );
}

const styles = StyleSheet.create({
  card: {
    padding: spacing.md,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: spacing.xs,
  },
  title: {
    ...typography.caption,
    fontWeight: "600",
    color: colors.textMuted,
    textTransform: "uppercase",
    letterSpacing: 0.5,
    flex: 1,
  },
  iconContainer: {
    width: 28,
    height: 28,
    borderRadius: radius.sm,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    alignItems: "center",
    justifyContent: "center",
    marginLeft: spacing.xs,
  },
  value: {
    ...typography.h2,
    color: colors.text,
    marginVertical: spacing.xs,
  },
  footer: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: spacing.xs,
    gap: spacing.xs,
  },
  growthPill: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: spacing.xs,
    paddingVertical: 2,
    borderRadius: radius.sm,
    gap: 3,
  },
  growthText: {
    ...typography.caption,
    fontSize: 11,
    fontWeight: "700",
  },
  subtitle: {
    ...typography.caption,
    color: colors.textMuted,
    flex: 1,
  },
});
