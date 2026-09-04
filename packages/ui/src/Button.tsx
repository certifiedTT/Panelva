import React from "react";

export type ButtonVariant = "primary" | "secondary" | "outline" | "ghost" | "danger";
export type ButtonSize = "sm" | "md" | "lg";

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  size?: ButtonSize;
  isLoading?: boolean;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
  fullWidth?: boolean;
  children?: React.ReactNode;
  title?: string;
  onPress?: () => void;
}

const variantStyles: Record<ButtonVariant, string> = {
  primary:
    "bg-blue-600 hover:bg-blue-700 active:bg-blue-800 text-white border border-blue-500/30 focus-visible:ring-blue-500/40",
  secondary:
    "bg-slate-800 hover:bg-slate-700 active:bg-slate-600 text-slate-100 border border-slate-700/60 focus-visible:ring-slate-400/40",
  outline:
    "bg-transparent hover:bg-slate-800/60 active:bg-slate-800 text-slate-200 border border-slate-700 hover:border-slate-600 focus-visible:ring-slate-400/40",
  ghost:
    "bg-transparent hover:bg-slate-800/50 active:bg-slate-800 text-slate-300 hover:text-white border border-transparent focus-visible:ring-slate-400/40",
  danger:
    "bg-red-600 hover:bg-red-700 active:bg-red-800 text-white border border-red-500/30 focus-visible:ring-red-500/40",
};

// 8-point system compliant sizing
const sizeStyles: Record<ButtonSize, string> = {
  sm: "h-8 px-3 text-xs gap-2 rounded-lg",
  md: "h-10 px-4 text-sm gap-2 rounded-xl",
  lg: "h-12 px-6 text-base gap-2 rounded-2xl",
};

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  (
    {
      variant = "primary",
      size = "md",
      isLoading = false,
      leftIcon,
      rightIcon,
      fullWidth = false,
      disabled,
      className = "",
      children,
      title,
      onPress,
      onClick,
      ...props
    },
    ref,
  ) => {
    const baseClasses =
      "inline-flex items-center justify-center font-semibold transition-colors duration-150 focus-visible:outline-none focus-visible:ring-2 disabled:pointer-events-none disabled:opacity-50 select-none";

    const computedClass = [
      baseClasses,
      variantStyles[variant],
      sizeStyles[size],
      fullWidth ? "w-full" : "",
      className,
    ]
      .filter(Boolean)
      .join(" ");

    return (
      <button
        ref={ref}
        disabled={disabled || isLoading}
        aria-busy={isLoading}
        onClick={onClick || onPress}
        className={computedClass}
        {...props}
      >
        {isLoading ? (
          /* Skeleton loader instead of spinner per Panelva Engineering Standards */
          <span className="flex items-center gap-2 animate-pulse">
            <span className="h-2 w-8 bg-current opacity-40 rounded-full" />
            <span className="h-2 w-12 bg-current opacity-30 rounded-full" />
          </span>
        ) : (
          <>
            {leftIcon && <span className="inline-flex shrink-0 items-center">{leftIcon}</span>}
            {children ? <span>{children}</span> : title ? <span>{title}</span> : null}
            {rightIcon && <span className="inline-flex shrink-0 items-center">{rightIcon}</span>}
          </>
        )}
      </button>
    );
  },
);

Button.displayName = "Button";
