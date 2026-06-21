"use client";

import posthog from "posthog-js";

// 2. Internal imports
import { signOutAction } from "@/actions/auth";

// 4. Component
export function SignOutButton() {
  return (
    <form action={signOutAction}>
      <button
        type="submit"
        onClick={() => posthog.reset()}
        className="rounded-md border border-border bg-surface px-4 py-2 text-sm font-medium text-text-primary hover:bg-surface-secondary"
      >
        Sign out
      </button>
    </form>
  );
}
