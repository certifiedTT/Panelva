import React from "react";
import {
  Pressable,
  Text,
  View,
  StyleSheet,
  ViewStyle,
  StyleProp,
  TextStyle,
} from "react-native";
import { colors, radius, spacing, typography } from "@panelva/theme";

export type ButtonVariant = "primary" | "secondary" | "outline" | "ghost" | "danger";
export type ButtonSize = "sm" | "md" | "lg";

export interface ButtonProps {
  title?: string;
  children?: React.ReactNode;
  onPress: () => void;
  variant?: ButtonVariant;
  size?: ButtonSize;
  disabled?: boolean;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
  fullWidth?: boolean;
  style?: StyleProp<ViewStyle>;
  textStyle?: StyleProp<TextStyle>;
}

export function Button({
  title,
  children,
  onPress,
  variant = "primary",
  size = "md",
  disabled = false,
  leftIcon,
  rightIcon,
  fullWidth = false,
  style,
  textStyle,
}: ButtonProps) {
  const getBackgroundColor = (pressed: boolean) => {
    if (disabled) return colors.surface;
    switch (variant) {
      case "primary":
        return pressed ? "#1D4ED8" : colors.primary;
      case "secondary":
        return pressed ? "#1E293B" : colors.card;
      case "outline":
      case "ghost":
        return pressed ? "rgba(255, 255, 255, 0.05)" : "transparent";
      case "danger":
        return pressed ? "#DC2626" : colors.danger;
      default:
        return colors.primary;
    }
  };

  const getBorderColor = () => {
    if (disabled) return colors.border;
    switch (variant) {
      case "primary":
        return colors.primary;
      case "secondary":
      case "outline":
        return colors.border;
      case "danger":
        return colors.danger;
      case "ghost":
        return "transparent";
      default:
        return colors.border;
    }
  };

  const getTextColor = () => {
    if (disabled) return colors.textMuted;
    switch (variant) {
      case "outline":
      case "ghost":
        return colors.text;
      case "secondary":
        return colors.text;
      default:
        return colors.text;
    }
  };

  const sizeStyles = {
    sm: {
      paddingVertical: spacing.xs,
      paddingHorizontal: spacing.sm,
      minHeight: 32,
      borderRadius: radius.sm,
      fontSize: 12,
    },
    md: {
      paddingVertical: spacing.sm,
      paddingHorizontal: spacing.md,
      minHeight: 40,
      borderRadius: radius.md,
      fontSize: 14,
    },
    lg: {
      paddingVertical: spacing.md,
      paddingHorizontal: spacing.lg,
      minHeight: 48,
      borderRadius: radius.lg,
      fontSize: 16,
    },
  }[size];

  return (
    <Pressable
      onPress={onPress}
      disabled={disabled}
      style={({ pressed }) => [
        styles.base,
        {
          backgroundColor: getBackgroundColor(pressed),
          borderColor: getBorderColor(),
          borderWidth: variant === "ghost" ? 0 : 1,
          paddingVertical: sizeStyles.paddingVertical,
          paddingHorizontal: sizeStyles.paddingHorizontal,
          minHeight: sizeStyles.minHeight,
          borderRadius: sizeStyles.borderRadius,
          width: fullWidth ? "100%" : undefined,
          opacity: disabled ? 0.5 : 1,
        },
        style,
      ]}
    >
      <View style={styles.contentRow}>
        {leftIcon && <View style={styles.leftIcon}>{leftIcon}</View>}

        {children ? (
          typeof children === "string" ? (
            <Text
              style={[
                styles.text,
                {
                  color: getTextColor(),
                  fontSize: sizeStyles.fontSize,
                },
                textStyle,
              ]}
            >
              {children}
            </Text>
          ) : (
            children
          )
        ) : title ? (
          <Text
            style={[
              styles.text,
              {
                color: getTextColor(),
                fontSize: sizeStyles.fontSize,
              },
              textStyle,
            ]}
          >
            {title}
          </Text>
        ) : null}

        {rightIcon && <View style={styles.rightIcon}>{rightIcon}</View>}
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  base: {
    alignItems: "center",
    justifyContent: "center",
  },
  contentRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
  },
  leftIcon: {
    marginRight: spacing.xs,
  },
  rightIcon: {
    marginLeft: spacing.xs,
  },
  text: {
    ...typography.caption,
    fontWeight: "600",
    textAlign: "center",
  },
});
