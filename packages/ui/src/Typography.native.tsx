import React from "react";
import { Text, TextProps, StyleProp, TextStyle } from "react-native";
import { typography, TypographyVariant, colors } from "@panelva/theme";

export interface TypographyNativeProps extends TextProps {
  variant?: TypographyVariant;
  color?: string;
  children: React.ReactNode;
  style?: StyleProp<TextStyle>;
}

export const Typography: React.FC<TypographyNativeProps> = ({
  variant = "body",
  color,
  children,
  style,
  ...props
}) => {
  const token = typography[variant];

  return (
    <Text
      style={[
        {
          fontSize: token.fontSize,
          lineHeight: token.lineHeight,
          fontWeight: token.fontWeight as TextStyle["fontWeight"],
          color: color || colors.text,
        },
        style,
      ]}
      {...props}
    >
      {children}
    </Text>
  );
};
