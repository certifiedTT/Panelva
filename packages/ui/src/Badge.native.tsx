import React from "react";
import { View, Text, StyleProp, ViewStyle, TextStyle } from "react-native";
import { colors, radius, spacing } from "@panelva/theme";

export type BadgeVariant =
  | "default"
  | "primary"
  | "secondary"
  | "success"
  | "warning"
  | "danger"
  | "outline";
export type BadgeSize = "sm" | "md";

export interface BadgeProps {
  variant?: BadgeVariant;
  size?: BadgeSize;
  children: React.ReactNode;
  style?: StyleProp<ViewStyle>;
  textStyle?: StyleProp<TextStyle>;
}

const variantStyles: Record<BadgeVariant, { bg: string; text: string; border: string }> = {
  default: {
    bg: colors.surface,
    text: colors.textMuted,
    border: colors.border,
  },
  primary: {
    bg: "rgba(37, 99, 235, 0.15)",
    text: "#60A5FA",
    border: "rgba(37, 99, 235, 0.3)",
  },
  secondary: {
    bg: "rgba(100, 116, 139, 0.2)",
    text: "#CBD5E1",
    border: "rgba(100, 116, 139, 0.35)",
  },
  success: {
    bg: "rgba(34, 197, 94, 0.15)",
    text: "#4ADE80",
    border: "rgba(34, 197, 94, 0.3)",
  },
  warning: {
    bg: "rgba(245, 158, 11, 0.15)",
    text: "#FBBF24",
    border: "rgba(245, 158, 11, 0.3)",
  },
  danger: {
    bg: "rgba(239, 68, 68, 0.15)",
    text: "#F87171",
    border: "rgba(239, 68, 68, 0.3)",
  },
  outline: {
    bg: "transparent",
    text: colors.text,
    border: colors.border,
  },
};

export const Badge: React.FC<BadgeProps> = ({
  variant = "default",
  size = "sm",
  children,
  style,
  textStyle,
}) => {
  const currentVariant = variantStyles[variant];
  const isSmall = size === "sm";

  return (
    <View
      style={[
        {
          backgroundColor: currentVariant.bg,
          borderColor: currentVariant.border,
          borderWidth: 1,
          borderRadius: radius.full,
          paddingVertical: isSmall ? 2 : spacing.xs,
          paddingHorizontal: isSmall ? spacing.sm : spacing.md,
          alignSelf: "flex-start",
          alignItems: "center",
          justifyContent: "center",
        },
        style,
      ]}
    >
      {typeof children === "string" || typeof children === "number" ? (
        <Text
          style={[
            {
              color: currentVariant.text,
              fontSize: isSmall ? 10 : 12,
              fontWeight: "700",
              textTransform: "uppercase",
              letterSpacing: 0.5,
            },
            textStyle,
          ]}
        >
          {children}
        </Text>
      ) : (
        children
      )}
    </View>
  );
};
