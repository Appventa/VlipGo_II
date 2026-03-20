import { cn } from "../../lib/utils";

interface Props {
  name?: string | null;
  avatarUrl?: string | null;
  size?: "xs" | "sm" | "md" | "lg";
  className?: string;
}

const SIZES = {
  xs: "w-6 h-6 text-[10px]",
  sm: "w-8 h-8 text-xs",
  md: "w-9 h-9 text-sm",
  lg: "w-14 h-14 text-lg",
};

function initials(name?: string | null) {
  if (!name?.trim()) return "?";
  return name
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((w) => w[0]?.toUpperCase() ?? "")
    .join("");
}

export function UserAvatar({ name, avatarUrl, size = "md", className }: Props) {
  return (
    <div
      className={cn(
        "rounded-full bg-indigo-600/25 flex items-center justify-center",
        "text-[#C3C0FF] font-semibold overflow-hidden shrink-0 select-none",
        SIZES[size],
        className
      )}
    >
      {avatarUrl ? (
        <img src={avatarUrl} alt={name ?? ""} className="w-full h-full object-cover" />
      ) : (
        initials(name)
      )}
    </div>
  );
}
