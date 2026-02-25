# Tars Full Stack Engineer Internship Coding Challenge 2026

This project is a real-time live chat messaging web app built for the **Tars Internship Challenge** using **Next.js (App Router), TypeScript, Convex, Clerk, and Tailwind CSS**.

## ✨ Premium Features (Recently Added)
1.  **Read Receipts (Blue Ticks)**: Real-time double ticks—gray for delivered, and vibrant blue for "seen"—implementing complex `seenBy` array tracking.
2.  **Reply to Messages (Quoting)**: Full message threading support with a sleek quote UI, allowing users to reply to specific messages with context.
3.  **Edit Messages**: Users can edit their sent messages with a soft-update indicator `(edited)` visible to all participants.
4.  **Last Seen Timestamps**: Shows exactly when a user was last active (e.g., "Active 5 mins ago") for offline users.
5.  **Robust Presence Syncing**: High-reliability online/offline status using heartbeats and event listeners for `visibilitychange` and `pagehide`.
6.  **Light/Dark Mode**: Fully integrated theme toggle with system preference support and premium Lucide-react iconography.

## 🚀 Core Features
1. **Authentication**: Secure Clerk integration with automatic user-sync to Convex DB.
2. **User List & Search**: Sidebar showing active conversations and a global user search for instant chat creation.
3. **1-on-1 & Group Chats**: Real-time communication powered by Convex subscriptions.
4. **Message Timestamps**: Contextual date formatting (Today, This Year, or Full Date).
5. **Typing Indicator**: Pulsing real-time feedback that appears when users are composing messages.
6. **Unread Counters**: Real-time notification bubbles in the sidebar for missed messages.
7. **Smart Auto-Scroll**: Intelligent scroll behavior that auto-anchors to new messages while preserving history reading position.
8. **Message Actions**: Soft-deletion and emoji reactions with synced counts.
9. **Responsive Layout**: Seamless mobile-first design with a standard dual-pane view on desktop.

## 🛠️ Running Locally

To run this locally, you will need to add the following to a `.env.local` file:
```env
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=your_key
CLERK_SECRET_KEY=your_secret
NEXT_PUBLIC_CONVEX_URL=your_convex_url
```

Then, boot the backend and frontend:
```bash
npx convex dev
npm run dev
```
