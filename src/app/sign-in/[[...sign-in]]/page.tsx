import { SignIn } from "@clerk/nextjs";

export default function Page() {
    return (
        <div className="flex h-screen w-screen items-center justify-center bg-slate-50 dark:bg-slate-900">
            <SignIn
                path="/sign-in"
                routing="path"
                signUpUrl="/sign-up"
                appearance={{
                    elements: {
                        formButtonPrimary:
                            "bg-emerald-600 hover:bg-emerald-700 text-sm normal-case",
                    }
                }}
            />
        </div>
    );
}
