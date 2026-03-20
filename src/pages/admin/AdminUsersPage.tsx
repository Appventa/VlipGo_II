import { useState } from "react";
import { useQuery, useMutation } from "convex/react";
import { Link } from "react-router-dom";
import { api } from "../../../convex/_generated/api";
import { Id } from "../../../convex/_generated/dataModel";
import { AdminLayout } from "../../layouts/AdminLayout";
import { Loading } from "../../components/ui/Loading";
import { cn } from "../../lib/utils";
import { ShieldBan, Snowflake, CheckCircle2, Users, MessageSquare, Send, X, ArrowRight } from "lucide-react";

const STATUS_META: Record<string, { label: string; color: string }> = {
  ACTIVE:  { label: "Active",  color: "bg-green-500/20 text-green-400"  },
  FROZEN:  { label: "Frozen",  color: "bg-sky-500/20 text-sky-400"      },
  BANNED:  { label: "Banned",  color: "bg-red-500/20 text-red-400"      },
};

type StatusAction = "ACTIVE" | "FROZEN" | "BANNED";

interface ActionState {
  userId: Id<"users">;
  userName: string;
  type: "status" | "message";
  targetStatus?: StatusAction;
}

function timeAgo(ts: number | null) {
  if (!ts) return "—";
  const m = Math.floor((Date.now() - ts) / 60000);
  if (m < 1)  return "just now";
  if (m < 60) return `${m}m ago`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h ago`;
  return `${Math.floor(h / 24)}d ago`;
}

function joinedDate(ts: number) {
  return new Date(ts).toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" });
}

export function AdminUsersPage() {
  const users     = useQuery(api.users.listAllUsers);
  const setStatus = useMutation(api.users.setUserStatus);
  const sendMsg   = useMutation(api.notifications.send);

  const [action, setAction] = useState<ActionState | null>(null);
  const [reason, setReason] = useState("");
  const [msgTitle, setMsgTitle] = useState("");
  const [msgBody, setMsgBody]   = useState("");
  const [sending, setSending]   = useState(false);

  function openStatus(userId: Id<"users">, userName: string, targetStatus: StatusAction) {
    setAction({ userId, userName, type: "status", targetStatus });
    setReason("");
  }

  function openMessage(userId: Id<"users">, userName: string) {
    setAction({ userId, userName, type: "message" });
    setMsgTitle("");
    setMsgBody("");
  }

  async function confirmStatus() {
    if (!action || action.type !== "status" || !action.targetStatus) return;
    setSending(true);
    await setStatus({ userId: action.userId, status: action.targetStatus, reason: reason.trim() || undefined });
    setSending(false);
    setAction(null);
  }

  async function confirmMessage() {
    if (!action || action.type !== "message" || !msgTitle.trim() || !msgBody.trim()) return;
    setSending(true);
    await sendMsg({ userId: action.userId, title: msgTitle.trim(), body: msgBody.trim() });
    setSending(false);
    setAction(null);
  }

  const statusLabels: Record<StatusAction, string> = {
    ACTIVE: "reactivate",
    FROZEN: "freeze",
    BANNED: "ban",
  };
  const statusColors: Record<StatusAction, string> = {
    ACTIVE: "bg-gradient-to-b from-green-500 to-green-600 hover:brightness-110",
    FROZEN: "bg-gradient-to-b from-sky-500 to-sky-600 hover:brightness-110",
    BANNED: "bg-gradient-to-b from-red-500 to-red-600 hover:brightness-110",
  };

  return (
    <AdminLayout>
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <p className="text-xs font-semibold uppercase tracking-widest text-[#C3C0FF] mb-1">Management</p>
          <h1 className="text-2xl font-bold text-white">Users</h1>
        </div>
        {users && (
          <div className="flex items-center gap-2 px-4 py-2 rounded-xl bg-[#1e1e1e]">
            <Users size={14} className="text-[#C3C0FF]" />
            <span className="text-sm text-gray-400">{users.length} registered</span>
          </div>
        )}
      </div>

      {users === undefined ? (
        <Loading />
      ) : users === null ? (
        <div className="text-center py-20 text-gray-600">Unauthorized.</div>
      ) : users.length === 0 ? (
        <div className="text-center py-20 text-gray-600">No registered users yet.</div>
      ) : (
        <div className="bg-[#1e1e1e] rounded-2xl overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-[#191919]">
              <tr>
                <th className="text-left px-5 py-3 font-medium text-gray-500">User</th>
                <th className="text-left px-5 py-3 font-medium text-gray-500">Joined</th>
                <th className="text-left px-5 py-3 font-medium text-gray-500">Jobs</th>
                <th className="text-left px-5 py-3 font-medium text-gray-500">Completed</th>
                <th className="text-left px-5 py-3 font-medium text-gray-500">Last Active</th>
                <th className="text-left px-5 py-3 font-medium text-gray-500">Status</th>
                <th className="px-5 py-3" />
              </tr>
            </thead>
            <tbody>
              {users.map((user, i) => {
                const effectiveStatus = (user.status ?? "ACTIVE") as StatusAction;
                const meta = STATUS_META[effectiveStatus];
                const displayName = user.name ?? user.email;
                return (
                  <tr
                    key={user._id}
                    className={cn(
                      "transition-colors hover:bg-[#262626]/40",
                      i % 2 === 0 ? "bg-[#1e1e1e]" : "bg-[#1a1a1a]"
                    )}
                  >
                    {/* User */}
                    <td className="px-5 py-3.5">
                      <Link to={`/admin/users/${user._id}`} className="group">
                        <p className="font-medium text-white group-hover:text-[#C3C0FF] transition-colors">{user.name ?? "—"}</p>
                        <p className="text-xs text-gray-600 mt-0.5">{user.email}</p>
                      </Link>
                    </td>

                    <td className="px-5 py-3.5 text-gray-500 text-xs">{joinedDate(user._creationTime)}</td>

                    <td className="px-5 py-3.5">
                      <span className="text-white font-semibold">{user.jobCount}</span>
                    </td>

                    <td className="px-5 py-3.5">
                      <span className="text-green-400 font-semibold">{user.completedJobs}</span>
                    </td>

                    <td className="px-5 py-3.5 text-gray-500 text-xs">{timeAgo(user.lastActiveTs)}</td>

                    <td className="px-5 py-3.5">
                      <span className={cn("text-xs font-medium px-2 py-0.5 rounded-full", meta.color)}>
                        {meta.label}
                      </span>
                    </td>

                    {/* Actions */}
                    <td className="px-5 py-3.5">
                      <div className="flex items-center justify-end gap-1">
                        {/* View detail */}
                        <Link
                          to={`/admin/users/${user._id}`}
                          title="View user detail"
                          className="w-7 h-7 rounded-lg flex items-center justify-center text-gray-600 hover:text-gray-200 hover:bg-[#333] transition-colors"
                        >
                          <ArrowRight size={13} />
                        </Link>
                        {/* Message */}
                        <button
                          onClick={() => openMessage(user._id as Id<"users">, displayName)}
                          title="Send message"
                          className="w-7 h-7 rounded-lg flex items-center justify-center text-gray-600 hover:text-[#C3C0FF] hover:bg-indigo-500/10 transition-colors"
                        >
                          <MessageSquare size={13} />
                        </button>

                        {effectiveStatus !== "ACTIVE" && (
                          <button
                            onClick={() => openStatus(user._id as Id<"users">, displayName, "ACTIVE")}
                            title="Activate account"
                            className="w-7 h-7 rounded-lg flex items-center justify-center text-gray-600 hover:text-green-400 hover:bg-green-500/10 transition-colors"
                          >
                            <CheckCircle2 size={13} />
                          </button>
                        )}
                        {effectiveStatus !== "FROZEN" && (
                          <button
                            onClick={() => openStatus(user._id as Id<"users">, displayName, "FROZEN")}
                            title="Freeze account"
                            className="w-7 h-7 rounded-lg flex items-center justify-center text-gray-600 hover:text-sky-400 hover:bg-sky-500/10 transition-colors"
                          >
                            <Snowflake size={13} />
                          </button>
                        )}
                        {effectiveStatus !== "BANNED" && (
                          <button
                            onClick={() => openStatus(user._id as Id<"users">, displayName, "BANNED")}
                            title="Ban account"
                            className="w-7 h-7 rounded-lg flex items-center justify-center text-gray-600 hover:text-red-400 hover:bg-red-500/10 transition-colors"
                          >
                            <ShieldBan size={13} />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {/* ── Action panel overlay ── */}
      {action && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div className="bg-[#1e1e1e] rounded-2xl p-6 w-full max-w-md shadow-[0_40px_60px_rgba(0,0,0,0.5)]">
            <div className="flex items-start justify-between mb-5">
              <div>
                <p className="text-xs font-semibold uppercase tracking-widest text-[#C3C0FF] mb-1">
                  {action.type === "message" ? "Send Message" : "Confirm Action"}
                </p>
                <h3 className="text-white font-bold text-base">{action.userName}</h3>
              </div>
              <button
                onClick={() => setAction(null)}
                className="w-7 h-7 rounded-lg flex items-center justify-center text-gray-600 hover:text-gray-300 hover:bg-[#333] transition-colors"
              >
                <X size={14} />
              </button>
            </div>

            {action.type === "status" ? (
              <>
                <p className="text-sm text-gray-400 mb-4">
                  You're about to <span className="text-white font-medium">{statusLabels[action.targetStatus!]}</span> this account.
                  A notification will be sent to the user.
                </p>
                <label className="block text-xs font-medium text-gray-500 mb-1.5">
                  Reason <span className="text-gray-700">(optional — shown to user)</span>
                </label>
                <textarea
                  value={reason}
                  onChange={(e) => setReason(e.target.value)}
                  placeholder="e.g. Violation of terms of service..."
                  rows={3}
                  className="w-full bg-[#262626] rounded-xl px-3 py-2.5 text-sm text-white placeholder-gray-600 outline-none focus:ring-1 focus:ring-[#C3C0FF]/40 resize-none"
                />
                <button
                  onClick={confirmStatus}
                  disabled={sending}
                  className={cn(
                    "mt-4 w-full py-2.5 rounded-xl text-sm font-semibold text-white transition-all active:scale-[0.98] disabled:opacity-50",
                    statusColors[action.targetStatus!]
                  )}
                >
                  {sending ? "Applying…" : `Confirm ${statusLabels[action.targetStatus!]}`}
                </button>
              </>
            ) : (
              <>
                <div className="mb-4 space-y-3">
                  <div>
                    <label className="block text-xs font-medium text-gray-500 mb-1.5">Subject</label>
                    <input
                      type="text"
                      value={msgTitle}
                      onChange={(e) => setMsgTitle(e.target.value)}
                      placeholder="Message subject..."
                      className="w-full bg-[#262626] rounded-xl px-3 py-2.5 text-sm text-white placeholder-gray-600 outline-none focus:ring-1 focus:ring-[#C3C0FF]/40"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-500 mb-1.5">Message</label>
                    <textarea
                      value={msgBody}
                      onChange={(e) => setMsgBody(e.target.value)}
                      placeholder="Write your message here..."
                      rows={4}
                      className="w-full bg-[#262626] rounded-xl px-3 py-2.5 text-sm text-white placeholder-gray-600 outline-none focus:ring-1 focus:ring-[#C3C0FF]/40 resize-none"
                    />
                  </div>
                </div>
                <button
                  onClick={confirmMessage}
                  disabled={sending || !msgTitle.trim() || !msgBody.trim()}
                  className="flex items-center justify-center gap-2 w-full py-2.5 rounded-xl bg-gradient-to-b from-indigo-500 to-indigo-600 hover:brightness-110 active:scale-[0.98] text-sm font-semibold text-white transition-all disabled:opacity-50"
                >
                  <Send size={13} />
                  {sending ? "Sending…" : "Send Message"}
                </button>
              </>
            )}
          </div>
        </div>
      )}
    </AdminLayout>
  );
}
