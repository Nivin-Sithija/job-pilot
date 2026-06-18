import { redirect } from "next/navigation";

// 2. Internal imports
import { createInsforgeServer } from "@/lib/insforge-server";
import { PostHogIdentify } from "@/components/PostHogIdentify";
import { SignOutButton } from "@/components/dashboard/SignOutButton";

// 4. Component
export default async function DashboardPage() {
  const insforge = await createInsforgeServer();
  const { data } = await insforge.auth.getCurrentUser();

  if (!data.user) {
    redirect("/login");
  }

  const userId = (data.user as { id?: string }).id ?? data.user.email;

  return (
    <main className="flex min-h-screen flex-col items-center justify-center gap-4 bg-background px-6">
      <PostHogIdentify userId={userId} />
      <p className="text-sm text-text-secondary">Signed in as</p>
      <p className="text-lg font-semibold text-text-primary">
        {data.user.email}
      </p>
      <SignOutButton />
    </main>
  );
}
