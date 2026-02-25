import { mutation, query } from "./_generated/server";
import { v } from "convex/values";

export const getMessages = query({
    args: { conversationId: v.id("conversations") },
    handler: async (ctx, args) => {
        const identity = await ctx.auth.getUserIdentity();
        if (!identity) return [];

        const messages = await ctx.db
            .query("messages")
            .withIndex("by_conversationId", (q) => q.eq("conversationId", args.conversationId))
            .collect();

        const messagesWithSender = await Promise.all(
            messages.map(async (msg) => {
                const sender = await ctx.db.get(msg.senderId);
                const reactions = await ctx.db
                    .query("reactions")
                    .withIndex("by_messageId", (q) => q.eq("messageId", msg._id))
                    .collect();

                return {
                    ...msg,
                    senderName: sender?.name,
                    senderImageUrl: sender?.imageUrl,
                    reactions,
                };
            })
        );

        return messagesWithSender;
    },
});

export const sendMessage = mutation({
    args: {
        conversationId: v.id("conversations"),
        content: v.string(),
    },
    handler: async (ctx, args) => {
        const identity = await ctx.auth.getUserIdentity();
        if (!identity) throw new Error("Unauthorized");

        const me = await ctx.db
            .query("users")
            .withIndex("by_clerkId", (q) => q.eq("clerkId", identity.subject))
            .unique();

        if (!me) throw new Error("User not found");

        const messageId = await ctx.db.insert("messages", {
            conversationId: args.conversationId,
            senderId: me._id,
            content: args.content,
            isDeleted: false,
        });

        await ctx.db.patch(args.conversationId, {
            lastMessageId: messageId,
        });

        const members = await ctx.db
            .query("conversationMembers")
            .withIndex("by_conversationId", (q) => q.eq("conversationId", args.conversationId))
            .filter((q) => q.neq(q.field("userId"), me._id))
            .collect();

        for (const member of members) {
            await ctx.db.patch(member._id, {
                unreadCount: member.unreadCount + 1,
            });
        }

        return messageId;
    },
});

export const deleteMessage = mutation({
    args: { messageId: v.id("messages") },
    handler: async (ctx, args) => {
        const identity = await ctx.auth.getUserIdentity();
        if (!identity) throw new Error("Unauthorized");

        const me = await ctx.db
            .query("users")
            .withIndex("by_clerkId", (q) => q.eq("clerkId", identity.subject))
            .unique();

        if (!me) throw new Error("User not found");

        const message = await ctx.db.get(args.messageId);
        if (!message) throw new Error("Message not found");

        if (message.senderId !== me._id) {
            throw new Error("Cannot delete someone else's message");
        }

        await ctx.db.patch(args.messageId, {
            isDeleted: true,
            content: "",
        });
    },
});

export const editMessage = mutation({
    args: { messageId: v.id("messages"), content: v.string() },
    handler: async (ctx, args) => {
        const identity = await ctx.auth.getUserIdentity();
        if (!identity) throw new Error("Unauthorized");

        const me = await ctx.db
            .query("users")
            .withIndex("by_clerkId", (q) => q.eq("clerkId", identity.subject))
            .unique();

        if (!me) throw new Error("User not found");

        const message = await ctx.db.get(args.messageId);
        if (!message) throw new Error("Message not found");

        if (message.senderId !== me._id) {
            throw new Error("Cannot edit someone else's message");
        }

        if (message.isDeleted) {
            throw new Error("Cannot edit a deleted message");
        }

        await ctx.db.patch(args.messageId, {
            content: args.content,
            isEdited: true,
        });
    },
});

export const toggleReaction = mutation({
    args: { messageId: v.id("messages"), emoji: v.string() },
    handler: async (ctx, args) => {
        const identity = await ctx.auth.getUserIdentity();
        if (!identity) return;

        const me = await ctx.db
            .query("users")
            .withIndex("by_clerkId", (q) => q.eq("clerkId", identity.subject))
            .unique();

        if (!me) return;

        const existingReaction = await ctx.db
            .query("reactions")
            .withIndex("by_messageId_userId_emoji", (q) =>
                q
                    .eq("messageId", args.messageId)
                    .eq("userId", me._id)
                    .eq("emoji", args.emoji)
            )
            .unique();

        if (existingReaction) {
            await ctx.db.delete(existingReaction._id);
        } else {
            await ctx.db.insert("reactions", {
                messageId: args.messageId,
                userId: me._id,
                emoji: args.emoji,
            });
        }
    },
});

export const updateTypingStatus = mutation({
    args: { conversationId: v.id("conversations"), isTyping: v.boolean() },
    handler: async (ctx, args) => {
        const identity = await ctx.auth.getUserIdentity();
        if (!identity) return;

        const me = await ctx.db
            .query("users")
            .withIndex("by_clerkId", (q) => q.eq("clerkId", identity.subject))
            .unique();

        if (!me) return;

        const existingIndicator = await ctx.db
            .query("typingIndicators")
            .withIndex("by_conversationId", (q) => q.eq("conversationId", args.conversationId))
            .filter((q) => q.eq(q.field("userId"), me._id))
            .first();

        if (existingIndicator) {
            await ctx.db.patch(existingIndicator._id, {
                isTyping: args.isTyping,
                updatedAt: Date.now(),
            });
        } else {
            await ctx.db.insert("typingIndicators", {
                conversationId: args.conversationId,
                userId: me._id,
                isTyping: args.isTyping,
                updatedAt: Date.now(),
            });
        }
    },
});

export const getTypingIndicators = query({
    args: { conversationId: v.id("conversations") },
    handler: async (ctx, args) => {
        const identity = await ctx.auth.getUserIdentity();
        if (!identity) return [];

        const me = await ctx.db
            .query("users")
            .withIndex("by_clerkId", (q) => q.eq("clerkId", identity.subject))
            .unique();

        if (!me) return [];

        const indicators = await ctx.db
            .query("typingIndicators")
            .withIndex("by_conversationId", (q) => q.eq("conversationId", args.conversationId))
            .filter((q) => q.neq(q.field("userId"), me._id))
            .filter((q) => q.eq(q.field("isTyping"), true))
            .collect();

        const activeIndicators = indicators.filter(
            (ind) => Date.now() - ind.updatedAt < 3000
        );

        const typingUsers = await Promise.all(
            activeIndicators.map(async (ind) => await ctx.db.get(ind.userId))
        );

        return typingUsers.filter((u) => u !== null);
    },
});
