import React from "react";
import { colors, radius, spacing } from "@panelva/theme";

export interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
  children?: React.ReactNode;
  className?: string;
}

export const Card = React.forwardRef<HTMLDivElement, CardProps>(
  ({ children, className = "", style, ...props }, ref) => {
    return (
      <div
        ref={ref}
        style={{
          backgroundColor: colors.card,
          borderColor: colors.border,
          borderRadius: radius.lg,
          padding: spacing.md,
          borderWidth: "1px",
          borderStyle: "solid",
          ...style,
        }}
        className={className}
        {...props}
      >
        {children}
      </div>
    );
  },
);

Card.displayName = "Card";
