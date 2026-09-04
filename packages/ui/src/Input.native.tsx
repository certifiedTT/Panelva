import React from "react";
import {
  View,
  Text,
  TextInput,
  TextInputProps,
  StyleProp,
  ViewStyle,
  TextStyle,
} from "react-native";
import { colors, radius, spacing } from "@panelva/theme";

export interface InputProps extends TextInputProps {
  label?: string;
  error?: string;
  helperText?: string;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
  containerStyle?: StyleProp<ViewStyle>;
  inputStyle?: StyleProp<TextStyle>;
}

export const Input = React.forwardRef<TextInput, InputProps>(
  (
    {
      label,
      error,
      helperText,
      leftIcon,
      rightIcon,
      containerStyle,
      inputStyle,
      editable = true,
      style,
      ...props
    },
    ref,
  ) => {
    return (
      <View style={[{ width: "100%", gap: spacing.xs }, containerStyle]}>
        {label && (
          <Text
            style={{
              color: colors.textMuted,
              fontSize: 12,
              fontWeight: "600",
              textTransform: "uppercase",
              letterSpacing: 0.5,
            }}
          >
            {label}
          </Text>
        )}

        <View
          style={{
            flexDirection: "row",
            alignItems: "center",
            backgroundColor: colors.surface,
            borderColor: error ? colors.danger : colors.border,
            borderRadius: radius.md,
            borderWidth: 1,
            opacity: editable ? 1 : 0.5,
          }}
        >
          {leftIcon && (
            <View style={{ paddingLeft: spacing.md }}>{leftIcon}</View>
          )}

          <TextInput
            ref={ref}
            editable={editable}
            placeholderTextColor={colors.textMuted}
            style={[
              {
                flex: 1,
                paddingVertical: spacing.sm,
                paddingHorizontal: spacing.md,
                color: colors.text,
                fontSize: 14,
              },
              inputStyle,
              style,
            ]}
            {...props}
          />

          {rightIcon && (
            <View style={{ paddingRight: spacing.md }}>{rightIcon}</View>
          )}
        </View>

        {error && (
          <Text style={{ color: colors.danger, fontSize: 12, fontWeight: "500" }}>
            {error}
          </Text>
        )}

        {!error && helperText && (
          <Text style={{ color: colors.textMuted, fontSize: 12 }}>
            {helperText}
          </Text>
        )}
      </View>
    );
  },
);

Input.displayName = "Input";
