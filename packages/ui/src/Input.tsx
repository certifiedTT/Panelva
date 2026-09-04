import React from "react";
import { colors, radius, spacing } from "@panelva/theme";

export interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  helperText?: string;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
  containerClassName?: string;
}

export const Input = React.forwardRef<HTMLInputElement, InputProps>(
  (
    {
      label,
      error,
      helperText,
      leftIcon,
      rightIcon,
      containerClassName = "",
      className = "",
      disabled,
      id,
      ...props
    },
    ref,
  ) => {
    const inputId = id || (label ? label.toLowerCase().replace(/\s+/g, "-") : undefined);

    return (
      <div className={`flex flex-col gap-1.5 w-full ${containerClassName}`}>
        {label && (
          <label
            htmlFor={inputId}
            style={{ color: colors.textMuted }}
            className="text-xs font-semibold uppercase tracking-wider"
          >
            {label}
          </label>
        )}

        <div
          style={{
            backgroundColor: colors.surface,
            borderColor: error ? colors.danger : colors.border,
            borderRadius: radius.md,
            borderWidth: "1px",
            borderStyle: "solid",
          }}
          className={`flex items-center w-full transition-colors focus-within:border-blue-500 ${
            disabled ? "opacity-50 pointer-events-none" : ""
          }`}
        >
          {leftIcon && (
            <span
              style={{ paddingLeft: spacing.md, color: colors.textMuted }}
              className="inline-flex shrink-0 items-center"
            >
              {leftIcon}
            </span>
          )}

          <input
            ref={ref}
            id={inputId}
            disabled={disabled}
            style={{
              paddingTop: spacing.sm,
              paddingBottom: spacing.sm,
              paddingLeft: leftIcon ? spacing.sm : spacing.md,
              paddingRight: rightIcon ? spacing.sm : spacing.md,
              color: colors.text,
            }}
            className={`w-full bg-transparent text-sm placeholder-slate-500 focus:outline-none ${className}`}
            {...props}
          />

          {rightIcon && (
            <span
              style={{ paddingRight: spacing.md, color: colors.textMuted }}
              className="inline-flex shrink-0 items-center"
            >
              {rightIcon}
            </span>
          )}
        </div>

        {error && (
          <span style={{ color: colors.danger }} className="text-xs font-medium">
            {error}
          </span>
        )}

        {!error && helperText && (
          <span style={{ color: colors.textMuted }} className="text-xs">
            {helperText}
          </span>
        )}
      </div>
    );
  },
);

Input.displayName = "Input";
