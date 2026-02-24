import React, { useState, useEffect, useRef } from "react";
import { useQuery, useMutation } from "convex/react";
import { api } from "../../../convex/_generated/api";
import { useUser } from "@clerk/nextjs";
import { ArrowLeft, Send, MoreVertical, Loader2, Smile, MessageSquare } from "lucide-react";
import { format, isToday, isThisYear } from "date-fns";
import Image from "next/image";
import { Id } from "../../../convex/_generated/dataModel";

const REACTIONS = ["👍", "❤️", "😂", "😮", "😢"];

export default function ChatWindow({
    conversationId,
    onBack,
}: {
    conversationId: string;
    onBack: () => void;
}) {
    const { user } = useUser();
    const [messageText, setMessageText] = useState("");
    const [showReactionsFor, setShowReactionsFor] = useState<string | null>(null);

    const bottomRef = useRef<HTMLDivElement>(null);
    const containerRef = useRef<HTMLDivElement>(null);
    const [isScrolledUp, setIsScrolledUp] = useState(false);

    const conversation = useQuery(api.conversations.getConversation, {
        conversationId: conversationId as Id<"conversations">,
    });

    const messages = useQuery(api.messages.getMessages, {
        conversationId: conversationId as Id<"conversations">,
    });

    const typingIndicators = useQuery(api.messages.getTypingIndicators, {
        conversationId: conversationId as Id<"conversations">,
    });

    const sendMessage = useMutation(api.messages.sendMessage);
    const deleteMessage = useMutation(api.messages.deleteMessage);
    const toggleReaction = useMutation(api.messages.toggleReaction);
    const markAsRead = useMutation(api.conversations.markAsRead);
    const updateTyping = useMutation(api.messages.updateTypingStatus);

    useEffect(() => {
        if (messages && messages.length > 0) {
            markAsRead({ conversationId: conversationId as Id<"conversations"> }).catch(console.error);
        }
    }, [messages, conversationId, markAsRead]);

    const scrollToBottom = () => {
        bottomRef.current?.scrollIntoView({ behavior: "smooth" });
        setIsScrolledUp(false);
    };

    useEffect(() => {
        if (!isScrolledUp) {
            // eslint-disable-next-line react-hooks/set-state-in-effect
            scrollToBottom();
        }
    }, [messages, isScrolledUp]);

    const handleScroll = () => {
        if (!containerRef.current) return;
        const { scrollTop, scrollHeight, clientHeight } = containerRef.current;

        if (scrollHeight - scrollTop - clientHeight > 50) {
            setIsScrolledUp(true);
        } else {
            setIsScrolledUp(false);
        }
    };

    const handleSend = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!messageText.trim()) return;

        try {
            const text = messageText;
            setMessageText("");
            await updateTyping({ conversationId: conversationId as Id<"conversations">, isTyping: false });
            await sendMessage({
                conversationId: conversationId as Id<"conversations">,
                content: text,
            });
            scrollToBottom();
        } catch (e) {
            console.error(e);
        }
    };

    useEffect(() => {
        const isTyping = messageText.length > 0;
        updateTyping({ conversationId: conversationId as Id<"conversations">, isTyping }).catch(console.error);

        const timeout = setTimeout(() => {
            if (isTyping) {
                updateTyping({ conversationId: conversationId as Id<"conversations">, isTyping: false }).catch(console.error);
            }
        }, 2000);

        return () => clearTimeout(timeout);
    }, [messageText, conversationId, updateTyping]);

    const formatTimestamp = (timestamp: number) => {
        const date = new Date(timestamp);
        if (isToday(date)) return format(date, "h:mm a");
        if (isThisYear(date)) return format(date, "MMM d, h:mm a");
        return format(date, "MMM d, yyyy");
    };

    if (conversation === undefined || messages === undefined) {
        return (
            <div className="flex-1 flex items-center justify-center bg-white dark:bg-slate-950">
                <div className="flex flex-col items-center">
                    <Loader2 className="h-8 w-8 animate-spin text-blue-500 mb-4" />
                    <p className="text-slate-500 font-medium">Loading conversation...</p>
                </div>
            </div>
        );
    }

    if (conversation === null) {
        return (
            <div className="flex-1 flex items-center justify-center bg-white dark:bg-slate-950">
                <div className="text-center">
                    <div className="w-16 h-16 bg-red-100 dark:bg-red-900/30 text-red-500 rounded-full flex items-center justify-center mx-auto mb-4">
                        <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                    </div>
                    <h3 className="text-xl font-bold text-slate-800 dark:text-slate-200">Conversation not found</h3>
                    <button
                        onClick={onBack}
                        className="mt-6 px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition"
                    >
                        Go Back
                    </button>
                </div>
            </div>
        );
    }

    return (
        <div className="flex-1 flex flex-col h-full bg-slate-50 dark:bg-slate-900 relative">
            {/* Header */}
            <div className="h-16 flex items-center justify-between px-4 sm:px-6 bg-white/80 dark:bg-slate-950/80 backdrop-blur-lg border-b border-slate-200 dark:border-slate-800 shadow-sm z-10 sticky top-0">
                <div className="flex items-center gap-3">
                    <button
                        onClick={onBack}
                        className="md:hidden p-2 -ml-2 text-slate-500 hover:text-slate-800 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-full transition-colors"
                    >
                        <ArrowLeft className="h-5 w-5" />
                    </button>

                    <div className="relative">
                        <div className="h-10 w-10 bg-slate-200 dark:bg-slate-800 rounded-full overflow-hidden shadow-sm">
                            {!conversation.isGroup && conversation.otherUser?.imageUrl ? (
                                <Image
                                    src={conversation.otherUser.imageUrl}
                                    width={40}
                                    height={40}
                                    alt={conversation.otherUser.name || "User"}
                                    className="object-cover w-full h-full"
                                />
                            ) : (
                                <div className="w-full h-full flex items-center justify-center text-lg font-medium text-slate-500">
                                    {conversation.isGroup ? conversation.name?.[0] : (conversation.otherUser?.name?.[0] || "?")}
                                </div>
                            )}
                        </div>
                        {!conversation.isGroup && conversation.otherUser?.isOnline && (
                            <div className="absolute -bottom-0.5 -right-0.5 w-3.5 h-3.5 bg-green-500 border-2 border-white dark:border-slate-950 rounded-full" />
                        )}
                    </div>

                    <div>
                        <h2 className="font-semibold text-slate-900 dark:text-white leading-tight">
                            {conversation.isGroup ? conversation.name : conversation.otherUser?.name}
                        </h2>
                        <div className="text-xs text-slate-500 dark:text-slate-400">
                            {conversation.isGroup ? (
                                <span>{conversation.otherUsers?.length || 0} members</span>
                            ) : (
                                <span className={conversation.otherUser?.isOnline ? "text-green-600 dark:text-green-400 font-medium" : ""}>
                                    {conversation.otherUser?.isOnline ? "Online" : "Offline"}
                                </span>
                            )}
                        </div>
                    </div>
                </div>

                {/* Actions (placeholder for extra features) */}
                <div>
                    <button className="p-2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-full transition-colors">
                        <MoreVertical className="h-5 w-5" />
                    </button>
                </div>
            </div>

            {/* Messages */}
            <div
                className="flex-1 overflow-y-auto p-4 sm:p-6 pb-32 space-y-6"
                ref={containerRef}
                onScroll={handleScroll}
            >
                {messages.length === 0 ? (
                    <div className="h-full flex flex-col items-center justify-center text-slate-500">
                        <div className="w-20 h-20 bg-blue-50 dark:bg-blue-900/20 text-blue-500 rounded-full flex items-center justify-center mb-6">
                            <MessageSquare className="w-10 h-10" />
                        </div>
                        <p className="text-center font-medium mb-1">Say hello!</p>
                        <p className="text-sm text-center">Send the first message to start the conversation.</p>
                    </div>
                ) : (
                    messages.map((msg, index) => {
                        // eslint-disable-next-line @typescript-eslint/no-explicit-any
                        const isMe = msg.senderId === user?.id || (msg as any).senderName === user?.fullName;
                        const showUserImage = !isMe && (!messages[index - 1] || messages[index - 1].senderId !== msg.senderId);

                        const reactionCounts = msg.reactions.reduce((acc: Record<string, number>, r: { emoji: string }) => {
                            acc[r.emoji] = (acc[r.emoji] || 0) + 1;
                            return acc;
                        }, {});

                        return (
                            <div key={msg._id} className={`flex w-full ${isMe ? "justify-end" : "justify-start"} group`}>
                                <div className={`flex max-w-[85%] sm:max-w-[75%] ${isMe ? "flex-row-reverse" : "flex-row"} gap-2 sm:gap-3`}>

                                    {/* Avatar for others */}
                                    {!isMe && (
                                        <div className="w-8 h-8 flex-shrink-0 mt-auto">
                                            {showUserImage ? (
                                                <div className="w-8 h-8 rounded-full bg-slate-200 dark:bg-slate-800 overflow-hidden shadow-sm">
                                                    {msg.senderImageUrl ? (
                                                        <Image src={msg.senderImageUrl} width={32} height={32} alt="Avatar" className="object-cover" />
                                                    ) : (
                                                        <div className="w-full h-full flex items-center justify-center text-sm">{msg.senderName?.[0] || "?"}</div>
                                                    )}
                                                </div>
                                            ) : <div className="w-8 h-8" />}
                                        </div>
                                    )}

                                    <div className={`flex flex-col ${isMe ? "items-end" : "items-start"}`}>
                                        <div className={`relative group/message flex items-center ${isMe ? "flex-row-reverse" : "flex-row"} gap-2`}>

                                            {/* Message Bubble */}
                                            <div className={`px-4 py-2.5 rounded-2xl shadow-sm relative ${msg.isDeleted
                                                ? `opacity-60 bg-transparent border border-slate-300 dark:border-slate-700 text-slate-500 shadow-none ${isMe ? "rounded-br-sm" : "rounded-bl-sm"}`
                                                : isMe
                                                    ? "bg-blue-600 text-white rounded-br-sm"
                                                    : "bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 border border-slate-100 dark:border-slate-800 rounded-bl-sm"
                                                }`}>
                                                {msg.isDeleted ? (
                                                    <span className="italic">This message was deleted</span>
                                                ) : (
                                                    <div className="whitespace-pre-wrap break-words">{msg.content}</div>
                                                )}

                                                {/* Reactions Badge */}
                                                {!msg.isDeleted && Object.keys(reactionCounts).length > 0 && (
                                                    <div className={`absolute -bottom-3 ${isMe ? "right-2" : "left-2"} flex gap-1 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-full px-2 py-0.5 shadow-sm scale-90 origin-bottom`}>
                                                        {Object.entries(reactionCounts).map(([emoji, count]) => (
                                                            <span key={emoji} className="text-[10px] flex items-center gap-1">
                                                                {emoji} <span className="text-slate-500">{count as number}</span>
                                                            </span>
                                                        ))}
                                                    </div>
                                                )}
                                            </div>

                                            {/* Hover Actions */}
                                            {!msg.isDeleted && (
                                                <div className="opacity-0 group-hover/message:opacity-100 transition-opacity flex gap-1 bg-white dark:bg-slate-800 shadow-sm border border-slate-200 dark:border-slate-700 rounded-lg p-1">
                                                    <button
                                                        onClick={() => setShowReactionsFor(showReactionsFor === msg._id ? null : msg._id)}
                                                        className="p-1.5 text-slate-400 hover:text-blue-500 hover:bg-blue-50 dark:hover:bg-slate-700 rounded-md transition-colors relative"
                                                    >
                                                        <Smile className="w-4 h-4" />
                                                        {showReactionsFor === msg._id && (
                                                            <div className={`absolute bottom-full mb-2 ${isMe ? "right-0" : "left-0"} bg-white dark:bg-slate-800 shadow-xl border border-slate-200 dark:border-slate-700 rounded-full p-1.5 flex gap-1 z-20`}>
                                                                {REACTIONS.map(emoji => (
                                                                    <div
                                                                        key={emoji}
                                                                        onClick={(e) => { e.stopPropagation(); toggleReaction({ messageId: msg._id, emoji }); setShowReactionsFor(null); }}
                                                                        className="cursor-pointer hover:bg-slate-100 dark:hover:bg-slate-700 p-1.5 rounded-full text-lg hover:scale-125 transition-transform"
                                                                    >
                                                                        {emoji}
                                                                    </div>
                                                                ))}
                                                            </div>
                                                        )}
                                                    </button>
                                                    {isMe && (
                                                        <button
                                                            onClick={() => { if (confirm("Delete message?")) deleteMessage({ messageId: msg._id }) }}
                                                            className="p-1.5 text-slate-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/30 rounded-md transition-colors"
                                                        >
                                                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                                                        </button>
                                                    )}
                                                </div>
                                            )}
                                        </div>

                                        <div className={`text-[10px] text-slate-400 dark:text-slate-500 mt-1 px-1 ${Object.keys(reactionCounts).length > 0 && !msg.isDeleted ? "pt-2" : ""
                                            }`}>
                                            {formatTimestamp(msg._creationTime)}
                                        </div>
                                    </div>

                                </div>
                            </div>
                        );
                    })
                )}

                {/* Typing indicator */}
                {typingIndicators && typingIndicators.length > 0 && (
                    <div className="flex w-full justify-start items-center gap-2 text-slate-500 animate-pulse pb-4">
                        <div className="text-sm italic ml-12">
                            {typingIndicators.map(i => i.name?.split(' ')[0]).join(", ")} {typingIndicators.length > 1 ? "are" : "is"} typing...
                        </div>
                    </div>
                )}

                <div ref={bottomRef} className="h-4" />
            </div>

            {/* Floating Scroll to Bottom button */}
            {isScrolledUp && (
                <button
                    onClick={scrollToBottom}
                    className="absolute bottom-24 left-1/2 -translate-x-1/2 flex items-center gap-2 bg-blue-600 text-white shadow-lg shadow-blue-500/30 px-4 py-2 rounded-full font-medium text-sm hover:scale-105 transition-all z-20 animate-bounce-short"
                >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 14l-7 7m0 0l-7-7m7 7V3" /></svg>
                    New messages
                </button>
            )}

            {/* Input Area */}
            <div className="absolute bottom-0 w-full bg-slate-50/80 dark:bg-slate-900/80 backdrop-blur-xl border-t border-slate-200 dark:border-slate-800 p-4">
                <form
                    onSubmit={handleSend}
                    className="max-w-4xl mx-auto flex items-end gap-2"
                >
                    <div className="flex-1 bg-white dark:bg-slate-950 border border-slate-300 dark:border-slate-700 rounded-2xl shadow-sm focus-within:shadow-md focus-within:ring-2 focus-within:ring-blue-500 focus-within:border-transparent transition-all overflow-hidden flex items-center">
                        <textarea
                            value={messageText}
                            onChange={(e) => setMessageText(e.target.value)}
                            onKeyDown={(e) => {
                                if (e.key === "Enter" && !e.shiftKey) {
                                    e.preventDefault();
                                    handleSend(e);
                                }
                            }}
                            placeholder="Type a message..."
                            className="flex-1 max-h-32 min-h-[48px] bg-transparent resize-none px-4 py-3 focus:outline-none text-slate-900 dark:text-slate-100 placeholder-slate-400 dark:placeholder-slate-500 scrollbar-thin"
                            rows={1}
                        />
                    </div>
                    <button
                        type="submit"
                        disabled={!messageText.trim()}
                        className="w-12 h-12 flex-shrink-0 flex items-center justify-center bg-blue-600 text-white rounded-2xl shadow-md hover:bg-blue-700 disabled:opacity-50 disabled:shadow-none hover:scale-105 active:scale-95 transition-all"
                    >
                        <Send className="w-5 h-5 ml-1" />
                    </button>
                </form>
            </div>
        </div>
    );
}
