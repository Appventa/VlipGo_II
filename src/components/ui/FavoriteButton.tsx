import { useQuery, useMutation } from "convex/react";
import { useConvexAuth } from "convex/react";
import { useNavigate } from "react-router-dom";
import { api } from "../../../convex/_generated/api";
import { Id } from "../../../convex/_generated/dataModel";
import { Heart } from "lucide-react";
import { cn } from "../../lib/utils";

interface FavoriteButtonProps {
  templateId: Id<"templates">;
  className?: string;
}

export function FavoriteButton({ templateId, className }: FavoriteButtonProps) {
  const { isAuthenticated } = useConvexAuth();
  const favoriteIds = useQuery(api.favorites.getFavoriteIds);
  const toggle = useMutation(api.favorites.toggle);
  const navigate = useNavigate();

  const isFav = favoriteIds?.includes(templateId) ?? false;

  function handleClick(e: React.MouseEvent) {
    e.preventDefault();
    e.stopPropagation();
    if (!isAuthenticated) {
      navigate("/login");
      return;
    }
    toggle({ templateId });
  }

  return (
    <button
      type="button"
      onClick={handleClick}
      title={isFav ? "Remove from favorites" : "Add to favorites"}
      className={cn(
        "w-7 h-7 rounded-full flex items-center justify-center transition-all",
        isFav
          ? "text-rose-400 bg-rose-500/15 hover:bg-rose-500/25"
          : "text-gray-600 bg-black/30 hover:text-rose-400 hover:bg-rose-500/15",
        className
      )}
    >
      <Heart size={13} fill={isFav ? "currentColor" : "none"} strokeWidth={2} />
    </button>
  );
}
