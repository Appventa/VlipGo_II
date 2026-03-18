import { convexAuth } from "@convex-dev/auth/server";
import { Password } from "@convex-dev/auth/providers/Password";

export const { auth, signIn, signOut, store } = convexAuth({
  providers: [Password],
  callbacks: {
    async createOrUpdateUser(ctx, args) {
      if (args.existingUserId) return args.existingUserId;
      return ctx.db.insert("users", {
        role: "CUSTOMER",
        email: args.profile.email ?? "",
        name: args.profile.name ?? undefined,
      });
    },
  },
});
