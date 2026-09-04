import React from "react";
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

export interface BadgeProps extends React.HTMLAttributes<HTMLSpanElement> {
  variant?: BadgeVariant;
  size?: BadgeSize;
  children: React.ReactNode;
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
  className = "",
  style,
  ...props
}) => {
  const currentVariant = variantStyles[variant];
  const isSmall = size === "sm";

  return (
    <span
      style={{
        backgroundColor: currentVariant.bg,
        color: currentVariant.text,
        borderColor: currentVariant.border,
        borderWidth: "1px",
        borderStyle: "solid",
        borderRadius: radius.full,
        paddingTop: isSmall ? spacing.xs / 2 : spacing.xs,
        paddingBottom: isSmall ? spacing.xs / 2 : spacing.xs,
        paddingLeft: isSmall ? spacing.sm : spacing.md,
        paddingRight: isSmall ? spacing.sm : spacing.md,
        fontSize: isSmall ? "11px" : "13px",
        ...style,
      }}
      className={`inline-flex items-center justify-center font-bold uppercase tracking-wider select-none ${className}`}
      {...props}
    >
      {children}
    </span>
  );
};
