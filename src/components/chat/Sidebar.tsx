import React, { useState } from "react";
import { UserButton } from "@clerk/nextjs";
import { useQuery, useMutation } from "convex/react";
import { api } from "../../../convex/_generated/api";
import { Search, Loader2, MessageSquare, Plus, Users, CheckSquare, Square, X } from "lucide-react";
import { format, isToday, isThisYear } from "date-fns";
import Image from "next/image";
import { Id } from "../../../convex/_generated/dataModel";

export default function Sidebar({
    selectedId,
    onSelect,
}: {
    selectedId: string | null;
    onSelect: (id: string) => void;
}) {
    const [searchTerm, setSearchTerm] = useState("");
    const myConversations = useQuery(api.conversations.getMyConversations);
    const searchResults = useQuery(
        api.users.searchUsers,
        searchTerm.length > 0 ? { searchTerm } : "skip"
    );

    const getOrCreateConversation = useMutation(api.conversations.getOrCreateConversation);
    const createGroup = useMutation(api.conversations.createGroup);

    const [isCreating, setIsCreating] = useState(false);
    const [isGroupMode, setIsGroupMode] = useState(false);
    const [selectedUsers, setSelectedUsers] = useState<Id<"users">[]>([]);
    const [groupName, setGroupName] = useState("");

    const handleUserClick = async (userId: string) => {
        if (isGroupMode) {
            const id = userId as Id<"users">;
            setSelectedUsers(prev => prev.includes(id) ? prev.filter(u => u !== id) : [...prev, id]);
            return;
        }

        try {
            setIsCreating(true);
            const convId = await getOrCreateConversation({ otherUserId: userId as Id<"users"> });
            onSelect(convId);
            setSearchTerm("");
        } catch (e) {
            console.error(e);
        } finally {
            setIsCreating(false);
        }
    };

    const handleCreateGroup = async () => {
        if (selectedUsers.length === 0 || !groupName.trim()) return;
        try {
            setIsCreating(true);
            const convId = await createGroup({
                name: groupName,
                memberIds: selectedUsers
            });
            onSelect(convId);
            setIsGroupMode(false);
            setSelectedUsers([]);
            setGroupName("");
            setSearchTerm("");
        } catch (e) {
            console.error(e);
        } finally {
            setIsCreating(false);
        }
    };

    const formatTimestamp = (timestamp?: number) => {
        if (!timestamp) return "";
        const date = new Date(timestamp);
        if (isToday(date)) return format(date, "h:mm a");
        if (isThisYear(date)) return format(date, "MMM d, h:mm a");
        return format(date, "MMM d, yyyy");
    };

    const renderConversations = () => {
        if (myConversations === undefined) {
            return (
                <div className="flex-1 overflow-y-auto p-4 space-y-4">
                    {[1, 2, 3, 4, 5].map((i) => (
                        <div key={i} className="flex gap-4 items-center">
                            <div className="w-12 h-12 rounded-2xl bg-slate-200 dark:bg-slate-800 animate-pulse flex-shrink-0" />
                            <div className="flex-1 space-y-2">
                                <div className="h-4 bg-slate-200 dark:bg-slate-800 rounded w-1/2 animate-pulse" />
                                <div className="h-3 bg-slate-200 dark:bg-slate-800 rounded w-3/4 animate-pulse" />
                            </div>
                        </div>
                    ))}
                </div>
            );
        }

        if (myConversations.length === 0) {
            return (
                <div className="flex-1 flex flex-col items-center justify-center text-slate-500 p-8 text-center bg-slate-50 dark:bg-slate-900 border-none">
                    <MessageSquare className="w-12 h-12 mb-4 text-slate-300 dark:text-slate-700" />
                    <h4 className="text-lg font-medium text-slate-700 dark:text-slate-300">No conversations yet</h4>
                    <p className="text-sm mt-2 max-w-[250px]">
                        Search for an existing user above to start chatting in real-time.
                    </p>
                </div>
            );
        }

        return (
            <div className="overflow-y-auto flex-1">
                {myConversations.map((conv) => {
                    const isSelected = selectedId === conv._id;
                    const otherUser = conv.otherUser;

                    return (
                        <div
                            key={conv._id}
                            onClick={() => onSelect(conv._id)}
                            className={`p-4 border-b border-slate-100 dark:border-slate-800 cursor-pointer transition-all hover:bg-slate-50 dark:hover:bg-slate-900/50 flex gap-4 ${isSelected ? "bg-blue-50/50 dark:bg-blue-900/10 border-l-4 border-l-blue-500 pl-3" : "pl-4"
                                }`}
                        >
                            <div className="relative isolate">
                                <div className="w-12 h-12 rounded-2xl bg-slate-200 dark:bg-slate-800 overflow-hidden flex-shrink-0 shadow-sm border border-slate-200 dark:border-slate-800">
                                    {otherUser?.imageUrl ? (
                                        <Image
                                            src={otherUser.imageUrl}
                                            width={48}
                                            height={48}
                                            alt={otherUser.name || "User"}
                                            className="object-cover w-full h-full"
                                        />
                                    ) : (
                                        <div className="w-full h-full flex items-center justify-center text-xl font-medium text-slate-500">
                                            {otherUser?.name?.[0] || "?"}
                                        </div>
                                    )}
                                </div>
                                {otherUser?.isOnline && (
                                    <div className="absolute -bottom-1 -right-1 w-4 h-4 bg-green-500 border-2 border-white dark:border-slate-950 rounded-full z-10" />
                                )}
                            </div>

                            <div className="flex-1 min-w-0 flex flex-col justify-center">
                                <div className="flex justify-between items-baseline mb-1">
                                    <h3 className="font-semibold text-slate-900 dark:text-slate-100 truncate pr-2 tracking-tight">
                                        {conv.isGroup ? conv.name : otherUser?.name}
                                    </h3>
                                    {conv.lastMessage && (
                                        <span className="text-xs text-slate-400 dark:text-slate-500 flex-shrink-0">
                                            {formatTimestamp(conv.lastMessage._creationTime)}
                                        </span>
                                    )}
                                </div>
                                <div className="flex justify-between items-center gap-2">
                                    <p className={`text-sm truncate ${conv.unreadCount > 0 ? "text-slate-900 dark:text-slate-200 font-medium" : "text-slate-500 dark:text-slate-400"
                                        }`}>
                                        {conv.lastMessage ? (
                                            conv.lastMessage.isDeleted ? (
                                                <span className="italic">This message was deleted</span>
                                            ) : (
                                                conv.lastMessage.content
                                            )
                                        ) : (
                                            <span className="italic text-slate-400">Start a conversation</span>
                                        )}
                                    </p>
                                    {conv.unreadCount > 0 && (
                                        <span className="bg-blue-500 text-white text-[10px] font-bold px-2 py-0.5 rounded-full flex-shrink-0">
                                            {conv.unreadCount}
                                        </span>
                                    )}
                                </div>
                            </div>
                        </div>
                    );
                })}
            </div>
        );
    };

    const renderSearchResults = () => {
        if (!searchTerm) return null;

        if (searchResults === undefined) {
            return (
                <div className="flex-1 overflow-y-auto p-4 space-y-4">
                    {[1, 2, 3, 4, 5].map((i) => (
                        <div key={i} className="flex gap-4 items-center">
                            <div className="w-10 h-10 rounded-full bg-slate-200 dark:bg-slate-800 animate-pulse flex-shrink-0" />
                            <div className="flex-1">
                                <div className="h-4 bg-slate-200 dark:bg-slate-800 rounded w-1/2 animate-pulse" />
                            </div>
                        </div>
                    ))}
                </div>
            );
        }

        if (searchResults.length === 0) {
            return (
                <div className="p-8 text-center text-slate-500 text-sm">
                    No users found matching &quot;{searchTerm}&quot;
                </div>
            );
        }

        return (
            <div className="overflow-y-auto flex-1">
                <div className="px-4 py-2 bg-slate-50 dark:bg-slate-900 border-y border-slate-100 dark:border-slate-800 text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                    Search Results
                </div>
                {searchResults.map((user) => (
                    <div
                        key={user._id}
                        onClick={() => handleUserClick(user._id)}
                        className="p-4 border-b border-slate-100 dark:border-slate-800 cursor-pointer hover:bg-slate-50 dark:hover:bg-slate-900/50 flex items-center gap-4 transition-colors group"
                    >
                        {isGroupMode && (
                            <div className="text-blue-500">
                                {selectedUsers.includes(user._id as Id<"users">) ? (
                                    <CheckSquare className="w-5 h-5 text-blue-600" />
                                ) : (
                                    <Square className="w-5 h-5 text-slate-400" />
                                )}
                            </div>
                        )}
                        <div className="relative isolate">
                            <div className="w-10 h-10 rounded-full bg-slate-200 dark:bg-slate-800 overflow-hidden shadow-sm">
                                {user.imageUrl ? (
                                    <Image
                                        src={user.imageUrl}
                                        width={40}
                                        height={40}
                                        alt={user.name || "User"}
                                        className="object-cover w-full h-full"
                                    />
                                ) : (
                                    <div className="w-full h-full flex items-center justify-center text-lg font-medium text-slate-500">
                                        {user.name?.[0] || "?"}
                                    </div>
                                )}
                            </div>
                            {user.isOnline && (
                                <div className="absolute bottom-0 right-0 w-3 h-3 bg-green-500 border-2 border-white dark:border-slate-950 rounded-full" />
                            )}
                        </div>

                        <div className="flex-1 min-w-0">
                            <h3 className="font-medium text-slate-900 dark:text-slate-100 truncate group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
                                {user.name}
                            </h3>
                        </div>
                        {!isGroupMode && (
                            isCreating ? (
                                <Loader2 className="w-4 h-4 animate-spin text-blue-500" />
                            ) : (
                                <div className="w-8 h-8 rounded-full bg-blue-50 text-blue-600 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all scale-75 group-hover:scale-100">
                                    <Plus className="w-4 h-4" />
                                </div>
                            )
                        )}
                    </div>
                ))}
            </div>
        );
    };

    return (
        <div className="h-full flex flex-col bg-white dark:bg-slate-950 shadow-[1px_0_10px_rgba(0,0,0,0.02)]">
            {/* Header */}
            <div className="p-4 border-b border-slate-200 dark:border-slate-800 bg-white/50 dark:bg-slate-950/50 backdrop-blur-md sticky top-0 z-10 flex justify-between items-center">
                <h2 className="text-xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
                    Messages
                    {myConversations && myConversations.length > 0 && (
                        <span className="text-xs font-medium bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400 px-2 py-0.5 rounded-full">
                            {myConversations.length}
                        </span>
                    )}
                </h2>
                <div className="ring-2 ring-slate-100 dark:ring-slate-800 rounded-full shadow-sm hover:ring-blue-200 transition-all cursor-pointer">
                    <UserButton afterSignOutUrl="/" appearance={{ elements: { avatarBox: "w-8 h-8" } }} />
                </div>
            </div>

            {/* Search and Group creation */}
            <div className="p-4 space-y-3">
                <div className="flex gap-2">
                    <div className="relative group flex-1">
                        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                            <Search className="h-4 w-4 text-slate-400 group-focus-within:text-blue-500 transition-colors" />
                        </div>
                        <input
                            type="text"
                            className="block w-full pl-10 pr-3 py-2 border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900 rounded-xl text-sm placeholder-slate-400 dark:placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                            placeholder="Search users to chat..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                        />
                    </div>
                    <button
                        onClick={() => {
                            setIsGroupMode(!isGroupMode);
                            setSelectedUsers([]);
                            setGroupName("");
                            if (!isGroupMode) setSearchTerm("");
                        }}
                        className={`p-2 rounded-xl border flex-shrink-0 transition-colors ${isGroupMode
                            ? "bg-blue-50 dark:bg-blue-900/30 border-blue-200 dark:border-blue-800 text-blue-600"
                            : "bg-slate-50 dark:bg-slate-900 border-slate-200 dark:border-slate-800 text-slate-500 hover:text-blue-600"
                            }`}
                        title="Create Group"
                    >
                        {isGroupMode ? <X className="w-5 h-5" /> : <Users className="w-5 h-5" />}
                    </button>
                </div>

                {isGroupMode && (
                    <div className="flex flex-col gap-3 p-3 bg-blue-50/50 dark:bg-blue-900/10 border border-blue-100 dark:border-blue-900/50 rounded-xl animate-in slide-in-from-top-2">
                        <input
                            type="text"
                            placeholder="Group Name"
                            value={groupName}
                            onChange={(e) => setGroupName(e.target.value)}
                            className="w-full px-3 py-2 text-sm border-b border-slate-200 dark:border-slate-800 bg-transparent focus:outline-none focus:border-blue-500 transition-colors"
                        />
                        <div className="flex justify-between items-center">
                            <span className="text-xs text-slate-500 font-medium">{selectedUsers.length} selected</span>
                            <button
                                onClick={handleCreateGroup}
                                disabled={selectedUsers.length === 0 || !groupName.trim() || isCreating}
                                className="px-4 py-1.5 bg-blue-600 hover:bg-blue-700 disabled:bg-slate-300 disabled:cursor-not-allowed text-white text-xs font-semibold rounded-lg transition-colors flex items-center gap-2"
                            >
                                {isCreating ? <Loader2 className="w-3 h-3 animate-spin" /> : null}
                                Create
                            </button>
                        </div>
                    </div>
                )}
            </div>

            {/* Lists */}
            <div className="flex-1 overflow-hidden flex flex-col">
                {searchTerm ? renderSearchResults() : renderConversations()}
            </div>
        </div>
    );
}
