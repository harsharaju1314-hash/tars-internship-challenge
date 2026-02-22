import { mutation, query } from "./_generated/server";
import { v } from "convex/values";

export const store = mutation({
    args: {},
    handler: async (ctx) => {
        const identity = await ctx.auth.getUserIdentity();
        if (!identity) {
            throw new Error("Called storeUser without authentication present");
        }

        const user = await ctx.db
            .query("users")
            .withIndex("by_clerkId", (q) => q.eq("clerkId", identity.subject))
            .unique();

        if (user !== null) {
            if (
                user.name !== identity.name ||
                user.imageUrl !== identity.pictureUrl ||
                user.email !== identity.email
            ) {
                await ctx.db.patch(user._id, {
                    name: identity.name ?? "Anonymous",
                    imageUrl: identity.pictureUrl,
                    email: identity.email ?? "",
                });
            }
            return user._id;
        }
        return await ctx.db.insert("users", {
            clerkId: identity.subject,
            name: identity.name ?? "Anonymous",
            email: identity.email ?? "",
            imageUrl: identity.pictureUrl,
            isOnline: true,
            lastSeen: Date.now(),
        });
    },
});

export const getMe = query({
    args: {},
    handler: async (ctx) => {
        const identity = await ctx.auth.getUserIdentity();
        if (!identity) return null;
        return await ctx.db
            .query("users")
            .withIndex("by_clerkId", (q) => q.eq("clerkId", identity.subject))
            .unique();
    },
});

export const setOnlineStatus = mutation({
    args: { isOnline: v.boolean() },
    handler: async (ctx, args) => {
        const identity = await ctx.auth.getUserIdentity();
        if (!identity) return null;

        const user = await ctx.db
            .query("users")
            .withIndex("by_clerkId", (q) => q.eq("clerkId", identity.subject))
            .unique();

        if (user) {
            await ctx.db.patch(user._id, {
                isOnline: args.isOnline,
                lastSeen: Date.now(),
            });
        }
    },
});

export const searchUsers = query({
    args: { searchTerm: v.string() },
    handler: async (ctx, args) => {
        const identity = await ctx.auth.getUserIdentity();
        if (!identity) return [];

        const users = await ctx.db.query("users").collect();

        return users.filter(user => {
            const isNotMe = user.clerkId !== identity.subject;
            const matchesSearch = user.name?.toLowerCase().includes(args.searchTerm.toLowerCase()) ||
                user.email?.toLowerCase().includes(args.searchTerm.toLowerCase());
            return isNotMe && matchesSearch;
        });
    },
});
