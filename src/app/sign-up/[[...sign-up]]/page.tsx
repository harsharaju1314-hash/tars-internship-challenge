import { SignUp } from "@clerk/nextjs";

export default function Page() {
    return (
        <div className="flex h-screen w-screen items-center justify-center bg-slate-50 dark:bg-slate-900">
            <SignUp path="/sign-up" routing="path" signInUrl="/sign-in" />
        </div>
    );
}
