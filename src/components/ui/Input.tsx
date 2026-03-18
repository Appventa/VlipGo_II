import { cn } from "../../lib/utils";
import { InputHTMLAttributes } from "react";

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
}

export function Input({ label, error, className, id, ...props }: InputProps) {
  return (
    <div className="flex flex-col gap-1">
      {label && (
        <label htmlFor={id} className="text-sm font-medium text-gray-300">
          {label}
        </label>
      )}
      <input
        id={id}
        className={cn(
          "block w-full rounded-lg border px-3 py-2 text-sm transition-colors text-white placeholder:text-gray-600",
          "focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent",
          error
            ? "border-red-500 bg-red-950/30"
            : "border-white/[0.12] bg-[#1a1a1a]",
          className
        )}
        {...props}
      />
      {error && <p className="text-xs text-red-400">{error}</p>}
    </div>
  );
}
