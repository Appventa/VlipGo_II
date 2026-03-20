import { cn } from "../../lib/utils";
import { ButtonHTMLAttributes } from "react";

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "primary" | "secondary" | "danger" | "ghost";
  size?: "sm" | "md" | "lg";
  loading?: boolean;
}

export function Button({
  variant = "primary",
  size = "md",
  loading,
  className,
  children,
  disabled,
  ...props
}: ButtonProps) {
  return (
    <button
      disabled={disabled || loading}
      className={cn(
        "inline-flex items-center justify-center font-medium rounded-lg transition-all focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-transparent disabled:opacity-50 disabled:cursor-not-allowed active:scale-[0.98]",
        {
          "bg-gradient-to-b from-indigo-500 to-indigo-600 text-white hover:brightness-110 focus:ring-indigo-500": variant === "primary",
          "border border-[#C3C0FF]/15 text-[#C3C0FF] hover:bg-[#C3C0FF]/[0.06] focus:ring-[#C3C0FF]/30": variant === "secondary",
          "bg-gradient-to-b from-red-500 to-red-600 text-white hover:brightness-110 focus:ring-red-500": variant === "danger",
          "text-gray-400 hover:bg-white/[0.05] hover:text-gray-200 focus:ring-white/20": variant === "ghost",
          "px-3 py-1.5 text-sm": size === "sm",
          "px-4 py-2 text-sm": size === "md",
          "px-6 py-3 text-base": size === "lg",
        },
        className
      )}
      {...props}
    >
      {loading ? (
        <span className="flex items-center gap-2">
          <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24" fill="none">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
          </svg>
          {children}
        </span>
      ) : children}
    </button>
  );
}
