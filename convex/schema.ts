import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";
import { authTables } from "@convex-dev/auth/server";

export default defineSchema({
  ...authTables,

  users: defineTable({
    role: v.union(v.literal("ADMIN"), v.literal("CUSTOMER")),
    email: v.string(),
    name: v.optional(v.string()),
  }).index("by_email", ["email"]),

  templates: defineTable({
    title: v.string(),
    description: v.string(),
    category: v.string(),
    tags: v.array(v.string()),
    price: v.number(),
    currency: v.string(),
    thumbnailUrl: v.optional(v.string()),
    nexrenderComposition: v.string(),         // LQ preview nexrender template ID
    nexrenderCompositionName: v.optional(v.string()), // LQ preview AE composition name
    nexrenderFinalComposition: v.optional(v.string()),     // HQ final nexrender template ID
    nexrenderFinalCompositionName: v.optional(v.string()), // HQ final AE composition name
    previewVideoUrl: v.optional(v.string()),
    isPublished: v.boolean(),
    isArchived: v.boolean(),
  })
    .index("by_published", ["isPublished", "isArchived"])
    .index("by_category", ["category"]),

  templateFields: defineTable({
    templateId: v.id("templates"),
    label: v.string(),
    type: v.union(v.literal("TEXT"), v.literal("IMAGE"), v.literal("COLOR")),
    nexrenderLayer: v.string(),
    required: v.boolean(),
    order: v.number(),
  }).index("by_template", ["templateId"]),

  jobs: defineTable({
    userId: v.id("users"),
    templateId: v.id("templates"),
    paymentStatus: v.union(
      v.literal("PENDING"),
      v.literal("PAID"),
      v.literal("FAILED")
    ),
    stripePaymentIntentId: v.optional(v.string()),
    renderStatus: v.union(
      v.literal("QUEUED"),
      v.literal("RENDERING"),
      v.literal("PREVIEW_READY"),
      v.literal("DONE"),
      v.literal("ERROR")
    ),
    renderProgress: v.number(),
    nexrenderJobId: v.optional(v.string()),
    renderPhase: v.optional(v.union(v.literal("PREVIEW"), v.literal("FINAL"))),
    previewUrl: v.optional(v.string()),
    outputUrl: v.optional(v.string()),
    errorMessage: v.optional(v.string()),
  })
    .index("by_user", ["userId"])
    .index("by_stripe_intent", ["stripePaymentIntentId"]),

  jobAssets: defineTable({
    jobId: v.id("jobs"),
    fieldId: v.id("templateFields"),
    value: v.string(),
  }).index("by_job", ["jobId"]),

  favorites: defineTable({
    userId: v.id("users"),
    templateId: v.id("templates"),
  })
    .index("by_user", ["userId"])
    .index("by_user_template", ["userId", "templateId"]),
});
