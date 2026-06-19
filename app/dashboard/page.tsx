import { redirect } from "next/navigation";

// 2. Internal imports
import { createInsforgeServer } from "@/lib/insforge-server";
import { PostHogIdentify } from "@/components/PostHogIdentify";
import { SignOutButton } from "@/components/dashboard/SignOutButton";
import { AppNavbar } from "@/components/layout/AppNavbar";

// 4. Component
export default async function DashboardPage() {
  const insforge = await createInsforgeServer();
  const { data } = await insforge.auth.getCurrentUser();

  if (!data.user) {
    redirect("/login");
  }

  const userId = (data.user as { id?: string }).id ?? data.user.email;

  return (
    <div className="min-h-screen bg-background">
      <AppNavbar active="Dashboard" />
      <main className="flex flex-col items-center justify-center gap-4 px-6 py-24">
        <PostHogIdentify userId={userId} />
        <p className="text-sm text-text-secondary">Signed in as</p>
        <p className="text-lg font-semibold text-text-primary">
          {data.user.email}
        </p>
        <SignOutButton />
      </main>
    </div>
  );
}
