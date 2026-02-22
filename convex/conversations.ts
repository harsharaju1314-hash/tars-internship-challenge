import { mutation, query } from "./_generated/server";
import { v } from "convex/values";

export const getOrCreateConversation = mutation({
    args: { otherUserId: v.id("users") },
    handler: async (ctx, args) => {
        const identity = await ctx.auth.getUserIdentity();
        if (!identity) throw new Error("Unauthorized");

        const me = await ctx.db
            .query("users")
            .withIndex("by_clerkId", (q) => q.eq("clerkId", identity.subject))
            .unique();

        if (!me) throw new Error("User not found");

        const myMemberships = await ctx.db
            .query("conversationMembers")
            .withIndex("by_userId", (q) => q.eq("userId", me._id))
            .collect();

        const otherMemberships = await ctx.db
            .query("conversationMembers")
            .withIndex("by_userId", (q) => q.eq("userId", args.otherUserId))
            .collect();

        const myConversationIds = new Set(myMemberships.map((m) => m.conversationId));

        let existingConversationId = null;
        for (const membership of otherMemberships) {
            if (myConversationIds.has(membership.conversationId)) {
                const conversation = await ctx.db.get(membership.conversationId);
                if (conversation && !conversation.isGroup) {
                    existingConversationId = conversation._id;
                    break;
                }
            }
        }

        if (existingConversationId) {
            return existingConversationId;
        }

        const newConversationId = await ctx.db.insert("conversations", {
            isGroup: false,
        });

        await ctx.db.insert("conversationMembers", {
            conversationId: newConversationId,
            userId: me._id,
            unreadCount: 0,
        });

        await ctx.db.insert("conversationMembers", {
            conversationId: newConversationId,
            userId: args.otherUserId,
            unreadCount: 0,
        });

        return newConversationId;
    },
});

export const getMyConversations = query({
    args: {},
    handler: async (ctx) => {
        const identity = await ctx.auth.getUserIdentity();
        if (!identity) return [];

        const me = await ctx.db
            .query("users")
            .withIndex("by_clerkId", (q) => q.eq("clerkId", identity.subject))
            .unique();

        if (!me) return [];

        const memberships = await ctx.db
            .query("conversationMembers")
            .withIndex("by_userId", (q) => q.eq("userId", me._id))
            .collect();

        const conversations = await Promise.all(
            memberships.map(async (membership) => {
                const conversation = await ctx.db.get(membership.conversationId);
                if (!conversation) return null;

                let otherUser = null;
                if (!conversation.isGroup) {
                    const otherMembership = await ctx.db
                        .query("conversationMembers")
                        .withIndex("by_conversationId", (q) => q.eq("conversationId", conversation._id))
                        .filter((q) => q.neq(q.field("userId"), me._id))
                        .first();

                    if (otherMembership) {
                        otherUser = await ctx.db.get(otherMembership.userId);
                    }
                }

                let lastMessage = null;
                if (conversation.lastMessageId) {
                    lastMessage = await ctx.db.get(conversation.lastMessageId);
                }

                return {
                    ...conversation,
                    otherUser,
                    unreadCount: membership.unreadCount,
                    lastMessage,
                };
            })
        );

        return conversations
            .filter((c) => c !== null)
            .sort((a, b) => {
                const aTime = a!.lastMessage?._creationTime ?? a!._creationTime;
                const bTime = b!.lastMessage?._creationTime ?? b!._creationTime;
                return bTime - aTime;
            });
    },
});

export const getConversation = query({
    args: { conversationId: v.id("conversations") },
    handler: async (ctx, args) => {
        const identity = await ctx.auth.getUserIdentity();
        if (!identity) return null;

        const me = await ctx.db
            .query("users")
            .withIndex("by_clerkId", (q) => q.eq("clerkId", identity.subject))
            .unique();

        if (!me) return null;

        const conversation = await ctx.db.get(args.conversationId);
        if (!conversation) return null;

        let otherUser = null;
        const otherUsers = [];
        if (!conversation.isGroup) {
            const otherMembership = await ctx.db
                .query("conversationMembers")
                .withIndex("by_conversationId", (q) => q.eq("conversationId", conversation._id))
                .filter((q) => q.neq(q.field("userId"), me._id))
                .first();

            if (otherMembership) {
                otherUser = await ctx.db.get(otherMembership.userId);
            }
        } else {
            const allMemberships = await ctx.db
                .query("conversationMembers")
                .withIndex("by_conversationId", (q) => q.eq("conversationId", conversation._id))
                .filter((q) => q.neq(q.field("userId"), me._id))
                .collect();
            for (let m of allMemberships) {
                otherUsers.push(await ctx.db.get(m.userId));
            }
        }

        return { ...conversation, otherUser, otherUsers };
    }
});

export const markAsRead = mutation({
    args: { conversationId: v.id("conversations") },
    handler: async (ctx, args) => {
        const identity = await ctx.auth.getUserIdentity();
        if (!identity) return;

        const me = await ctx.db
            .query("users")
            .withIndex("by_clerkId", (q) => q.eq("clerkId", identity.subject))
            .unique();

        if (!me) return;

        const membership = await ctx.db
            .query("conversationMembers")
            .withIndex("by_conversationId_userId", (q) =>
                q.eq("conversationId", args.conversationId).eq("userId", me._id)
            )
            .unique();

        if (membership && membership.unreadCount > 0) {
            await ctx.db.patch(membership._id, { unreadCount: 0 });
        }
    },
});

export const createGroup = mutation({
    args: { name: v.string(), memberIds: v.array(v.id("users")) },
    handler: async (ctx, args) => {
        const identity = await ctx.auth.getUserIdentity();
        if (!identity) throw new Error("Unauthorized");

        const me = await ctx.db
            .query("users")
            .withIndex("by_clerkId", (q) => q.eq("clerkId", identity.subject))
            .unique();

        if (!me) throw new Error("User not found");

        const newConversationId = await ctx.db.insert("conversations", {
            isGroup: true,
            name: args.name,
        });

        await ctx.db.insert("conversationMembers", {
            conversationId: newConversationId,
            userId: me._id,
            unreadCount: 0,
        });

        for (const memberId of args.memberIds) {
            await ctx.db.insert("conversationMembers", {
                conversationId: newConversationId,
                userId: memberId,
                unreadCount: 0,
            });
        }

        return newConversationId;
    },
});
