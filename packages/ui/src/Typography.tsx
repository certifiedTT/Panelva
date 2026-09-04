import React from "react";
import { typography, TypographyVariant, colors } from "@panelva/theme";

export interface TypographyProps extends React.HTMLAttributes<HTMLElement> {
  variant?: TypographyVariant;
  as?: React.ElementType;
  color?: string;
  children: React.ReactNode;
}

const defaultElements: Record<TypographyVariant, React.ElementType> = {
  display: "h1",
  h1: "h1",
  h2: "h2",
  h3: "h3",
  body: "p",
  bodySm: "p",
  small: "p",
  caption: "span",
};

export const Typography: React.FC<TypographyProps> = ({
  variant = "body",
  as,
  color,
  children,
  className = "",
  style,
  ...props
}) => {
  const Component = as || defaultElements[variant] || "p";
  const token = typography[variant];

  return (
    <Component
      style={{
        fontSize: `${token.fontSize}px`,
        lineHeight: `${token.lineHeight}px`,
        fontWeight: token.fontWeight,
        color: color || colors.text,
        ...style,
      }}
      className={className}
      {...props}
    >
      {children}
    </Component>
  );
};
