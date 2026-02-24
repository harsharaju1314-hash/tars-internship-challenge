# Tars Full Stack Engineer Internship Coding Challenge 2026

This project is a real-time live chat messaging web app built for the **Tars Internship Challenge** using **Next.js (App Router), TypeScript, Convex, Clerk, and Tailwind CSS**.

## Features Implemented
1. **Authentication**: Set up Clerk for authentication and synced users to my Convex database upon login. 
2. **User List & Search**: Created a sidebar showing active conversations and a search bar to filter global users to start chats with.
3. **1-on-1 Direct Messages**: Messages are fetched and updated in real time using Convex subscriptions.
4. **Message Timestamps**: Added dynamic formatting to show times for today, date+time for this year, and full dates for older messages.
5. **Empty States**: Developed helpful UI to show when there are no conversations, no search results, or no chat selected.
6. **Responsive Layout**: On desktop, the sidebar and chat appear side by side. On mobile, the active chat takes up the full screen, and a "back" button allows navigation.
7. **Online/Offline Status**: Implemented a heartbeat function so user avatars display real-time green dots when they are online.
8. **Typing Indicator**: Built a pulsing typing indicator that disappears after 2 seconds of inactivity or upon sending.
9. **Unread Message Count**: Integrated a real-time unread counter in the sidebar for each conversation.
10. **Smart Auto-Scroll**: Implemented ref-based scrolling bounds that scroll to new messages automatically unless the user has scrolled up to read history.
11. **Delete Own Messages**: Uses Convex logic to allow users to soft-delete their own messages.
12. **Message Reactions**: Created a hover menu for message emojis that syncs reaction amounts.

## Running Locally

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
