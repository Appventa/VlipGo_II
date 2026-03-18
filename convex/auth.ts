import { convexAuth } from "@convex-dev/auth/server";
import { Password } from "@convex-dev/auth/providers/Password";
import { DataModel } from "./_generated/dataModel";
import { MutationCtx } from "./_generated/server";

export const { auth, signIn, signOut, store, isAuthenticated } = convexAuth({
  providers: [Password],
  callbacks: {
    async createOrUpdateUser(ctx: MutationCtx, args: {
      existingUserId?: DataModel["users"]["_id"];
      profile: { email?: string | null; name?: string | null };
    }) {
      if (args.existingUserId) return args.existingUserId;
      return ctx.db.insert("users", {
        role: "CUSTOMER",
        email: args.profile.email ?? "",
        name: args.profile.name ?? undefined,
      });
    },
  },
});
