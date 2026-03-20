import { Link } from "react-router-dom";
import { useQuery } from "convex/react";
import { api } from "../../../convex/_generated/api";
import { Bell } from "lucide-react";

export function NotificationBell() {
  const count = useQuery(api.notifications.getUnreadCount) ?? 0;

  return (
    <Link
      to="/inbox"
      className="relative w-8 h-8 flex items-center justify-center rounded-lg text-gray-400 hover:text-[#C3C0FF] hover:bg-[#C3C0FF]/[0.06] transition-colors"
      title="Inbox"
    >
      <Bell size={16} />
      {count > 0 && (
        <span className="absolute top-0.5 right-0.5 min-w-[14px] h-[14px] rounded-full bg-indigo-500 text-white text-[9px] font-bold flex items-center justify-center px-0.5 leading-none">
          {count > 99 ? "99+" : count}
        </span>
      )}
    </Link>
  );
}
