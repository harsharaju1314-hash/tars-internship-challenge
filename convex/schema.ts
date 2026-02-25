import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";

export default defineSchema({
    users: defineTable({
        clerkId: v.string(),
        name: v.string(),
        email: v.string(),
        imageUrl: v.optional(v.string()),
        isOnline: v.boolean(),
        lastSeen: v.number(),
    }).index("by_clerkId", ["clerkId"]),

    conversations: defineTable({
        isGroup: v.boolean(),
        name: v.optional(v.string()),
        lastMessageId: v.optional(v.id("messages")),
    }),

    conversationMembers: defineTable({
        conversationId: v.id("conversations"),
        userId: v.id("users"),
        unreadCount: v.number(),
    })
        .index("by_userId", ["userId"])
        .index("by_conversationId", ["conversationId"])
        .index("by_conversationId_userId", ["conversationId", "userId"]),

    messages: defineTable({
        conversationId: v.id("conversations"),
        senderId: v.id("users"),
        content: v.string(),
        isDeleted: v.boolean(),
        isEdited: v.optional(v.boolean()),
        replyToId: v.optional(v.id("messages")),
        seenBy: v.optional(v.array(v.id("users"))),
    }).index("by_conversationId", ["conversationId"]),

    typingIndicators: defineTable({
        conversationId: v.id("conversations"),
        userId: v.id("users"),
        isTyping: v.boolean(),
        updatedAt: v.number(),
    }).index("by_conversationId", ["conversationId"]),

    reactions: defineTable({
        messageId: v.id("messages"),
        userId: v.id("users"),
        emoji: v.string(),
    })
        .index("by_messageId", ["messageId"])
        .index("by_messageId_userId_emoji", ["messageId", "userId", "emoji"]),
});
