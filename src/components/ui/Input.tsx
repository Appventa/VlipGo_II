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
          "block w-full rounded-lg px-3 py-2 text-sm transition-all text-white placeholder:text-gray-600",
          "focus:outline-none focus:ring-1 focus:ring-[#C3C0FF]/40",
          error
            ? "bg-red-950/40 ring-1 ring-red-500/50"
            : "bg-[#262626]",
          className
        )}
        {...props}
      />
      {error && <p className="text-xs text-red-400">{error}</p>}
    </div>
  );
}
