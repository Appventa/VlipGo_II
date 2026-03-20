import { query, mutation } from "./_generated/server";
import { v } from "convex/values";
import { getAuthUserId } from "@convex-dev/auth/server";

/** Array of templateIds the current user has favorited */
export const getFavoriteIds = query({
  args: {},
  handler: async (ctx) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) return [];
    const favs = await ctx.db
      .query("favorites")
      .withIndex("by_user", (q) => q.eq("userId", userId))
      .collect();
    return favs.map((f) => f.templateId);
  },
});

/** Full template objects (with resolved thumbnails) for user's favorites */
export const listFavoriteTemplates = query({
  args: {},
  handler: async (ctx) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) return [];
    const favs = await ctx.db
      .query("favorites")
      .withIndex("by_user", (q) => q.eq("userId", userId))
      .order("desc")
      .collect();
    const results = await Promise.all(
      favs.map(async (f) => {
        const t = await ctx.db.get(f.templateId);
        if (!t || t.isArchived) return null;
        let thumbnailUrl = t.thumbnailUrl;
        if (thumbnailUrl && !thumbnailUrl.startsWith("http")) {
          thumbnailUrl = (await ctx.storage.getUrl(thumbnailUrl)) ?? undefined;
        }
        return { ...t, thumbnailUrl };
      })
    );
    return results.filter((t): t is NonNullable<typeof t> => t !== null);
  },
});

/** Toggle favorite — add if not present, remove if present */
export const toggle = mutation({
  args: { templateId: v.id("templates") },
  handler: async (ctx, { templateId }) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("Unauthenticated");
    const existing = await ctx.db
      .query("favorites")
      .withIndex("by_user_template", (q) =>
        q.eq("userId", userId).eq("templateId", templateId)
      )
      .unique();
    if (existing) {
      await ctx.db.delete(existing._id);
    } else {
      await ctx.db.insert("favorites", { userId, templateId });
    }
  },
});
