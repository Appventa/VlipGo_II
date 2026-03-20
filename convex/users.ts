import { query, mutation } from "./_generated/server";
import { v } from "convex/values";
import { getAuthUserId } from "@convex-dev/auth/server";

export const currentUser = query({
  args: {},
  handler: async (ctx) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) return null;
    return ctx.db.get(userId);
  },
});

/** Admin: list all CUSTOMER accounts with activity stats */
export const listAllUsers = query({
  args: {},
  handler: async (ctx) => {
    const adminId = await getAuthUserId(ctx);
    if (!adminId) return null;
    const admin = await ctx.db.get(adminId);
    if (admin?.role !== "ADMIN") return null;

    const users = await ctx.db
      .query("users")
      .filter((q) => q.eq(q.field("role"), "CUSTOMER"))
      .collect();

    return Promise.all(
      users.map(async (user) => {
        const jobs = await ctx.db
          .query("jobs")
          .withIndex("by_user", (q) => q.eq("userId", user._id))
          .collect();

        const completedJobs = jobs.filter((j) => j.renderStatus === "DONE").length;
        const lastActiveTs =
          jobs.length > 0 ? Math.max(...jobs.map((j) => j._creationTime)) : null;

        const activeJobCount = jobs.filter(
          (j) => j.renderStatus === "QUEUED" || j.renderStatus === "RENDERING"
        ).length;

        return {
          ...user,
          jobCount: jobs.length,
          completedJobs,
          activeJobCount,
          lastActiveTs,
        };
      })
    );
  },
});

/** Admin: get a single user's profile + job stats (no full job list) */
export const getAdminUserDetail = query({
  args: { userId: v.id("users") },
  handler: async (ctx, { userId }) => {
    const adminId = await getAuthUserId(ctx);
    if (!adminId) return null;
    const admin = await ctx.db.get(adminId);
    if (admin?.role !== "ADMIN") return null;

    const user = await ctx.db.get(userId);
    if (!user) return null;

    const jobs = await ctx.db
      .query("jobs")
      .withIndex("by_user", (q) => q.eq("userId", userId))
      .collect();

    return {
      ...user,
      jobCount: jobs.length,
      completedJobs: jobs.filter((j) => j.renderStatus === "DONE").length,
      activeJobCount: jobs.filter(
        (j) => j.renderStatus === "QUEUED" || j.renderStatus === "RENDERING"
      ).length,
      previewReady: jobs.filter((j) => j.renderStatus === "PREVIEW_READY").length,
      errorJobs: jobs.filter((j) => j.renderStatus === "ERROR").length,
    };
  },
});

/** Admin: set a user's status (ACTIVE | FROZEN | BANNED) and auto-notify */
export const setUserStatus = mutation({
  args: {
    userId: v.id("users"),
    status: v.union(v.literal("ACTIVE"), v.literal("FROZEN"), v.literal("BANNED")),
    reason: v.optional(v.string()),
  },
  handler: async (ctx, { userId, status, reason }) => {
    const adminId = await getAuthUserId(ctx);
    if (!adminId) throw new Error("Unauthenticated");
    const admin = await ctx.db.get(adminId);
    if (admin?.role !== "ADMIN") throw new Error("Unauthorized");

    await ctx.db.patch(userId, { status });

    // Auto-send account-action notification
    const titleMap: Record<string, string> = {
      ACTIVE:  "Your account has been reactivated",
      FROZEN:  "Your account has been temporarily frozen",
      BANNED:  "Your account has been banned",
    };
    const defaultBodyMap: Record<string, string> = {
      ACTIVE:  "Your account is now active again. Welcome back!",
      FROZEN:  "Your account has been temporarily suspended. Please contact support for more information.",
      BANNED:  "Your account has been permanently banned due to a violation of our terms of service.",
    };
    await ctx.db.insert("notifications", {
      userId,
      title: titleMap[status],
      body: reason?.trim() || defaultBodyMap[status],
      isRead: false,
      type: "ACCOUNT_ACTION",
    });
  },
});
