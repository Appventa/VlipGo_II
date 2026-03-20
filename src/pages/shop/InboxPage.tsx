import { useQuery, useMutation } from "convex/react";
import { api } from "../../../convex/_generated/api";
import { Id } from "../../../convex/_generated/dataModel";
import { ShopLayout } from "../../layouts/ShopLayout";
import { Loading } from "../../components/ui/Loading";
import { cn } from "../../lib/utils";
import { Bell, Info, ShieldAlert, CheckCheck, Dot } from "lucide-react";

function timeAgo(ts: number) {
  const m = Math.floor((Date.now() - ts) / 60000);
  if (m < 1)  return "just now";
  if (m < 60) return `${m}m ago`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h ago`;
  return `${Math.floor(h / 24)}d ago`;
}

export function InboxPage() {
  const notifications = useQuery(api.notifications.listForUser);
  const markRead      = useMutation(api.notifications.markRead);
  const markAllRead   = useMutation(api.notifications.markAllRead);

  const unreadCount = notifications?.filter((n) => !n.isRead).length ?? 0;

  return (
    <ShopLayout>
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <p className="text-xs font-semibold uppercase tracking-widest text-[#C3C0FF] mb-1">Notifications</p>
          <h1 className="text-2xl font-bold text-white">Inbox</h1>
        </div>
        {unreadCount > 0 && (
          <button
            onClick={() => markAllRead()}
            className="flex items-center gap-2 text-xs text-gray-500 hover:text-[#C3C0FF] transition-colors px-3 py-1.5 rounded-lg hover:bg-[#C3C0FF]/[0.06]"
          >
            <CheckCheck size={13} />
            Mark all as read
          </button>
        )}
      </div>

      {notifications === undefined ? (
        <Loading />
      ) : notifications.length === 0 ? (
        <div className="flex flex-col items-center py-24 text-center">
          <div className="w-14 h-14 rounded-2xl bg-[#1e1e1e] flex items-center justify-center mb-4">
            <Bell size={22} className="text-gray-600" />
          </div>
          <p className="text-gray-500 text-sm">No notifications yet.</p>
        </div>
      ) : (
        <div className="flex flex-col gap-2 max-w-2xl">
          {notifications.map((notif) => {
            const isAccount = notif.type === "ACCOUNT_ACTION";
            return (
              <div
                key={notif._id}
                onClick={() => !notif.isRead && markRead({ notificationId: notif._id as Id<"notifications"> })}
                className={cn(
                  "flex gap-4 p-4 rounded-2xl transition-colors cursor-default",
                  notif.isRead
                    ? "bg-[#1a1a1a]"
                    : "bg-[#1e1e1e] ring-1 ring-[#C3C0FF]/10"
                )}
              >
                {/* Icon */}
                <div className={cn(
                  "w-9 h-9 rounded-xl flex items-center justify-center shrink-0 mt-0.5",
                  isAccount ? "bg-amber-500/10" : "bg-indigo-500/10"
                )}>
                  {isAccount
                    ? <ShieldAlert size={15} className="text-amber-400" />
                    : <Info size={15} className="text-[#C3C0FF]" />
                  }
                </div>

                {/* Content */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between gap-2">
                    <p className={cn("text-sm font-semibold leading-snug", notif.isRead ? "text-gray-400" : "text-white")}>
                      {notif.title}
                    </p>
                    <span className="text-xs text-gray-700 shrink-0 mt-0.5">{timeAgo(notif._creationTime)}</span>
                  </div>
                  <p className="text-sm text-gray-500 mt-1 leading-relaxed">{notif.body}</p>
                </div>

                {/* Unread dot */}
                {!notif.isRead && (
                  <div className="shrink-0 mt-2">
                    <Dot size={18} className="text-indigo-400" />
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </ShopLayout>
  );
}
