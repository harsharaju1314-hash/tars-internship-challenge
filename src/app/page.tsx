"use client";

import { SignedIn, SignedOut } from "@clerk/nextjs";
import ChatLayout from "@/components/chat/ChatLayout";
import AuthSync from "@/components/auth/AuthSync";
import Link from "next/link";

export default function Home() {
  return (
    <main className="h-screen w-screen flex flex-col bg-slate-50 dark:bg-slate-900 overflow-hidden">
      <SignedOut>
        <div className="flex-1 flex flex-col items-center justify-center p-4">
          <div className="max-w-md w-full bg-white dark:bg-slate-950 p-8 rounded-2xl shadow-xl border border-slate-100 dark:border-slate-800 text-center">
            <div className="w-16 h-16 mx-auto mb-6 bg-blue-500 rounded-2xl flex items-center justify-center text-white rotate-3 shadow-lg">
              <svg className="w-8 h-8 -rotate-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
              </svg>
            </div>
            <h1 className="text-3xl font-bold text-slate-900 dark:text-white mb-2 tracking-tight">Tars Live Chat</h1>
            <p className="text-slate-500 dark:text-slate-400 mb-8">
              Connect and chat in real-time. Join the conversation today.
            </p>
            <Link
              href="/sign-in"
              className="w-full block py-3 px-4 bg-blue-600 hover:bg-emerald-700 text-white font-medium rounded-xl transition-colors shadow-md shadow-emerald-500/20"
            >
              Sign In to Start Chatting
            </Link>
          </div>
        </div>
      </SignedOut>

      <SignedIn>
        <AuthSync>
          <ChatLayout />
        </AuthSync>
      </SignedIn>
    </main>
  );
}
