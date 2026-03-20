import { useState } from "react";
import { useParams, Link } from "react-router-dom";
import { useQuery, useMutation } from "convex/react";
import { api } from "../../../convex/_generated/api";
import { Id } from "../../../convex/_generated/dataModel";
import { AdminLayout } from "../../layouts/AdminLayout";
import { Loading } from "../../components/ui/Loading";
import { cn } from "../../lib/utils";
import {
  ArrowLeft, ChevronDown, ChevronUp, ExternalLink, Film,
  Type, Palette, Image as ImageIcon, CheckCircle2, Snowflake,
  ShieldBan, MessageSquare, Send, X, RotateCcw,
} from "lucide-react";

const STATUS_COLOR: Record<string, string> = {
  QUEUED:        "bg-[#262626] text-gray-400",
  RENDERING:     "bg-indigo-500/20 text-[#C3C0FF]",
  PREVIEW_READY: "bg-amber-500/20 text-amber-400",
  DONE:          "bg-green-500/20 text-green-400",
  ERROR:         "bg-red-500/20 text-red-400",
};
const STATUS_LABEL: Record<string, string> = {
  QUEUED:        "Queued",
  RENDERING:     "Rendering",
  PREVIEW_READY: "Preview Ready",
  DONE:          "Done",
  ERROR:         "Error",
};
const USER_STATUS_META: Record<string, { label: string; color: string }> = {
  ACTIVE:  { label: "Active",  color: "bg-green-500/20 text-green-400"  },
  FROZEN:  { label: "Frozen",  color: "bg-sky-500/20 text-sky-400"      },
  BANNED:  { label: "Banned",  color: "bg-red-500/20 text-red-400"      },
};

function formatDate(ts: number) {
  return new Date(ts).toLocaleDateString("en-GB", {
    day: "2-digit", month: "short", year: "numeric",
    hour: "2-digit", minute: "2-digit",
  });
}

type ActionPanel = { type: "message" } | { type: "status"; target: "ACTIVE" | "FROZEN" | "BANNED" };

export function AdminUserDetailPage() {
  const { userId } = useParams<{ userId: string }>();
  const user    = useQuery(api.users.getAdminUserDetail, { userId: userId as Id<"users"> });
  const jobs    = useQuery(api.jobs.getJobsForAdminUser, { userId: userId as Id<"users"> });
  const setStatus = useMutation(api.users.setUserStatus);
  const sendMsg   = useMutation(api.notifications.send);
  const retry     = useMutation(api.jobs.retryRender);

  const [expanded, setExpanded] = useState<Set<string>>(new Set());
  const [panel, setPanel]       = useState<ActionPanel | null>(null);
  const [reason, setReason]     = useState("");
  const [msgTitle, setMsgTitle] = useState("");
  const [msgBody, setMsgBody]   = useState("");
  const [sending, setSending]   = useState(false);

  function toggleJob(id: string) {
    setExpanded((prev) => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  }

  async function confirmStatus(target: "ACTIVE" | "FROZEN" | "BANNED") {
    if (!userId) return;
    setSending(true);
    await setStatus({ userId: userId as Id<"users">, status: target, reason: reason.trim() || undefined });
    setSending(false);
    setPanel(null);
  }

  async function confirmMessage() {
    if (!userId || !msgTitle.trim() || !msgBody.trim()) return;
    setSending(true);
    await sendMsg({ userId: userId as Id<"users">, title: msgTitle.trim(), body: msgBody.trim() });
    setSending(false);
    setPanel(null);
  }

  if (user === undefined || jobs === undefined) return <AdminLayout><Loading /></AdminLayout>;
  if (!user) return <AdminLayout><div className="text-gray-600 py-20 text-center">User not found.</div></AdminLayout>;

  const effectiveStatus = (user.status ?? "ACTIVE") as "ACTIVE" | "FROZEN" | "BANNED";
  const userMeta = USER_STATUS_META[effectiveStatus];

  const statCards = [
    { label: "Total Jobs",    value: user.jobCount,      color: "text-white" },
    { label: "Active",        value: user.activeJobCount, color: "text-[#C3C0FF]" },
    { label: "Preview Ready", value: user.previewReady,  color: "text-amber-400" },
    { label: "Completed",     value: user.completedJobs, color: "text-green-400" },
    { label: "Errors",        value: user.errorJobs,     color: "text-red-400" },
  ];

  const statusColors: Record<string, string> = {
    ACTIVE: "from-green-500 to-green-600",
    FROZEN: "from-sky-500 to-sky-600",
    BANNED: "from-red-500 to-red-600",
  };

  return (
    <AdminLayout>
      {/* Back */}
      <Link
        to="/admin/users"
        className="inline-flex items-center gap-1.5 text-xs text-gray-600 hover:text-gray-300 transition-colors mb-6"
      >
        <ArrowLeft size={13} /> Back to Users
      </Link>

      {/* Header */}
      <div className="flex items-start justify-between mb-6">
        <div>
          <div className="flex items-center gap-3 mb-1">
            <h1 className="text-2xl font-bold text-white">{user.name ?? "—"}</h1>
            <span className={cn("text-xs font-medium px-2 py-0.5 rounded-full", userMeta.color)}>
              {userMeta.label}
            </span>
          </div>
          <p className="text-sm text-gray-500">{user.email}</p>
          <p className="text-xs text-gray-700 mt-1">
            Joined {new Date(user._creationTime).toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" })}
          </p>
        </div>

        {/* Action buttons */}
        <div className="flex items-center gap-1.5">
          <button
            onClick={() => { setPanel({ type: "message" }); setMsgTitle(""); setMsgBody(""); }}
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-[#1e1e1e] text-sm text-gray-400 hover:text-[#C3C0FF] hover:bg-indigo-500/10 transition-colors"
          >
            <MessageSquare size={13} /> Message
          </button>
          {effectiveStatus !== "ACTIVE" && (
            <button
              onClick={() => { setPanel({ type: "status", target: "ACTIVE" }); setReason(""); }}
              className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-[#1e1e1e] text-sm text-gray-400 hover:text-green-400 hover:bg-green-500/10 transition-colors"
            >
              <CheckCircle2 size={13} /> Activate
            </button>
          )}
          {effectiveStatus !== "FROZEN" && (
            <button
              onClick={() => { setPanel({ type: "status", target: "FROZEN" }); setReason(""); }}
              className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-[#1e1e1e] text-sm text-gray-400 hover:text-sky-400 hover:bg-sky-500/10 transition-colors"
            >
              <Snowflake size={13} /> Freeze
            </button>
          )}
          {effectiveStatus !== "BANNED" && (
            <button
              onClick={() => { setPanel({ type: "status", target: "BANNED" }); setReason(""); }}
              className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-[#1e1e1e] text-sm text-gray-400 hover:text-red-400 hover:bg-red-500/10 transition-colors"
            >
              <ShieldBan size={13} /> Ban
            </button>
          )}
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-5 gap-3 mb-8">
        {statCards.map(({ label, value, color }) => (
          <div key={label} className="bg-[#1e1e1e] rounded-2xl p-4 text-center">
            <p className={cn("text-2xl font-bold leading-none mb-1", color)}>{value}</p>
            <p className="text-xs text-gray-600">{label}</p>
          </div>
        ))}
      </div>

      {/* Jobs */}
      <div>
        <p className="text-xs font-semibold uppercase tracking-widest text-[#C3C0FF] mb-4">Job History</p>
        {jobs.length === 0 ? (
          <div className="text-center py-16 text-gray-600 text-sm bg-[#1e1e1e] rounded-2xl">
            No jobs submitted yet.
          </div>
        ) : (
          <div className="flex flex-col gap-3">
            {jobs.map((job) => {
              const isExpanded = expanded.has(job._id);
              return (
                <div key={job._id} className="bg-[#1e1e1e] rounded-2xl overflow-hidden">
                  {/* Job header row */}
                  <div
                    className="flex items-center gap-4 px-5 py-4 cursor-pointer hover:bg-[#262626]/30 transition-colors"
                    onClick={() => toggleJob(job._id)}
                  >
                    {/* Thumbnail */}
                    <div className="w-16 h-10 rounded-lg overflow-hidden bg-[#262626] shrink-0">
                      {job.templateThumbnailUrl ? (
                        <img src={job.templateThumbnailUrl} alt="" className="w-full h-full object-cover" />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center">
                          <Film size={12} className="text-gray-600" />
                        </div>
                      )}
                    </div>

                    {/* Info */}
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-white truncate">{job.templateTitle}</p>
                      <p className="text-xs text-gray-600 mt-0.5">{formatDate(job._creationTime)}</p>
                    </div>

                    {/* Progress */}
                    {(job.renderStatus === "RENDERING" || job.renderStatus === "QUEUED") && (
                      <div className="flex items-center gap-2 shrink-0">
                        <div className="h-1 w-20 bg-white/[0.06] rounded-full">
                          <div className="h-full bg-indigo-500 rounded-full" style={{ width: `${job.renderProgress}%` }} />
                        </div>
                        <span className="text-xs text-gray-600">{job.renderProgress}%</span>
                      </div>
                    )}

                    {/* Status */}
                    <span className={cn("text-xs font-medium px-2 py-0.5 rounded-full shrink-0", STATUS_COLOR[job.renderStatus] ?? "bg-[#262626] text-gray-400")}>
                      {STATUS_LABEL[job.renderStatus] ?? job.renderStatus}
                    </span>

                    {/* Retry */}
                    {(job.renderStatus === "ERROR" || job.renderStatus === "QUEUED") && (
                      <button
                        onClick={(e) => { e.stopPropagation(); retry({ jobId: job._id as Id<"jobs"> }); }}
                        className="w-7 h-7 rounded-lg flex items-center justify-center text-gray-600 hover:text-[#C3C0FF] hover:bg-indigo-500/10 transition-colors shrink-0"
                        title="Retry render"
                      >
                        <RotateCcw size={12} />
                      </button>
                    )}

                    {/* Expand toggle */}
                    <div className="text-gray-600 shrink-0">
                      {isExpanded ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
                    </div>
                  </div>

                  {/* Expanded detail */}
                  {isExpanded && (
                    <div className="border-t border-white/[0.04] px-5 py-4 space-y-4">
                      {/* Assets */}
                      {job.assets.length > 0 && (
                        <div>
                          <p className="text-xs font-semibold text-gray-600 uppercase tracking-wider mb-3">Submitted Inputs</p>
                          <div className="grid gap-2">
                            {job.assets.map((asset, i) => (
                              <div key={i} className="flex items-start gap-3 bg-[#262626] rounded-xl px-4 py-3">
                                <div className="w-6 h-6 rounded-md bg-[#1e1e1e] flex items-center justify-center shrink-0 mt-0.5">
                                  {asset.type === "IMAGE"  && <ImageIcon size={11} className="text-[#C3C0FF]" />}
                                  {asset.type === "COLOR"  && <Palette    size={11} className="text-[#C3C0FF]" />}
                                  {asset.type === "TEXT"   && <Type       size={11} className="text-[#C3C0FF]" />}
                                </div>
                                <div className="flex-1 min-w-0">
                                  <p className="text-xs text-gray-500 mb-1">{asset.label}</p>
                                  {asset.type === "IMAGE" ? (
                                    <div className="flex items-center gap-3">
                                      <img
                                        src={asset.value}
                                        alt={asset.label}
                                        className="w-20 h-14 object-cover rounded-lg bg-[#1e1e1e]"
                                      />
                                      <a
                                        href={asset.value}
                                        target="_blank"
                                        rel="noreferrer"
                                        className="text-xs text-[#C3C0FF] hover:underline flex items-center gap-1"
                                      >
                                        Open full image <ExternalLink size={10} />
                                      </a>
                                    </div>
                                  ) : asset.type === "COLOR" ? (
                                    <div className="flex items-center gap-2">
                                      <div
                                        className="w-5 h-5 rounded-md border border-white/[0.08]"
                                        style={{ background: asset.value }}
                                      />
                                      <span className="text-sm text-white font-mono">{asset.value}</span>
                                    </div>
                                  ) : (
                                    <p className="text-sm text-white">{asset.value}</p>
                                  )}
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* Video links */}
                      {(job.previewUrl || job.outputUrl) && (
                        <div>
                          <p className="text-xs font-semibold text-gray-600 uppercase tracking-wider mb-3">Video Output</p>
                          <div className="flex flex-wrap gap-2">
                            {job.previewUrl && (
                              <a
                                href={job.previewUrl}
                                target="_blank"
                                rel="noreferrer"
                                className="flex items-center gap-2 px-4 py-2 rounded-xl bg-amber-500/10 text-amber-400 text-sm font-medium hover:bg-amber-500/20 transition-colors"
                              >
                                <Film size={13} /> Preview Video
                                <ExternalLink size={11} />
                              </a>
                            )}
                            {job.outputUrl && (
                              <a
                                href={job.outputUrl}
                                target="_blank"
                                rel="noreferrer"
                                className="flex items-center gap-2 px-4 py-2 rounded-xl bg-green-500/10 text-green-400 text-sm font-medium hover:bg-green-500/20 transition-colors"
                              >
                                <Film size={13} /> Final HD Video
                                <ExternalLink size={11} />
                              </a>
                            )}
                          </div>
                        </div>
                      )}

                      {/* Error */}
                      {job.renderStatus === "ERROR" && job.errorMessage && (
                        <div className="bg-red-500/10 rounded-xl px-4 py-3 text-sm text-red-400">
                          <span className="font-semibold">Error: </span>{job.errorMessage}
                        </div>
                      )}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* ── Action overlay ── */}
      {panel && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div className="bg-[#1e1e1e] rounded-2xl p-6 w-full max-w-md shadow-[0_40px_60px_rgba(0,0,0,0.5)]">
            <div className="flex items-start justify-between mb-5">
              <div>
                <p className="text-xs font-semibold uppercase tracking-widest text-[#C3C0FF] mb-1">
                  {panel.type === "message" ? "Send Message" : "Confirm Action"}
                </p>
                <h3 className="text-white font-bold">{user.name ?? user.email}</h3>
              </div>
              <button onClick={() => setPanel(null)} className="w-7 h-7 rounded-lg flex items-center justify-center text-gray-600 hover:text-gray-300 hover:bg-[#333] transition-colors">
                <X size={14} />
              </button>
            </div>

            {panel.type === "status" ? (
              <>
                <p className="text-sm text-gray-400 mb-4">
                  You are about to <span className="text-white font-medium">{panel.target.toLowerCase()}</span> this account. A notification will be sent.
                </p>
                <label className="block text-xs font-medium text-gray-500 mb-1.5">
                  Reason <span className="text-gray-700">(optional)</span>
                </label>
                <textarea
                  value={reason}
                  onChange={(e) => setReason(e.target.value)}
                  placeholder="Describe the reason…"
                  rows={3}
                  className="w-full bg-[#262626] rounded-xl px-3 py-2.5 text-sm text-white placeholder-gray-600 outline-none focus:ring-1 focus:ring-[#C3C0FF]/40 resize-none"
                />
                <button
                  onClick={() => confirmStatus(panel.target)}
                  disabled={sending}
                  className={cn(
                    "mt-4 w-full py-2.5 rounded-xl text-sm font-semibold text-white bg-gradient-to-b transition-all active:scale-[0.98] disabled:opacity-50",
                    statusColors[panel.target]
                  )}
                >
                  {sending ? "Applying…" : `Confirm ${panel.target.toLowerCase()}`}
                </button>
              </>
            ) : (
              <>
                <div className="space-y-3 mb-4">
                  <div>
                    <label className="block text-xs font-medium text-gray-500 mb-1.5">Subject</label>
                    <input
                      type="text"
                      value={msgTitle}
                      onChange={(e) => setMsgTitle(e.target.value)}
                      placeholder="Message subject…"
                      className="w-full bg-[#262626] rounded-xl px-3 py-2.5 text-sm text-white placeholder-gray-600 outline-none focus:ring-1 focus:ring-[#C3C0FF]/40"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-500 mb-1.5">Message</label>
                    <textarea
                      value={msgBody}
                      onChange={(e) => setMsgBody(e.target.value)}
                      placeholder="Write your message…"
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
                  <Send size={13} /> {sending ? "Sending…" : "Send Message"}
                </button>
              </>
            )}
          </div>
        </div>
      )}
    </AdminLayout>
  );
}
