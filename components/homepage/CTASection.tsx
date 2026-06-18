"use client";

import Link from "next/link";
import { ChevronRight } from "lucide-react";
import posthog from "posthog-js";

type CTASectionProps = {
  ctaHref?: string;
};

export function CTASection({ ctaHref = "/login" }: CTASectionProps) {
  return (
    <section className="gradient-hero px-6 py-24 text-center">
      <div className="mx-auto max-w-2xl">
        <h2 className="text-4xl font-bold leading-tight text-text-primary">
          Your next job search can feel a lot less overwhelming
        </h2>
        <p className="mx-auto mt-4 max-w-md text-base text-text-secondary">
          Set up your profile, upload your resume, and start finding matches
          in minutes.
        </p>
        <div className="mt-8 flex items-center justify-center gap-3">
          <Link
            href={ctaHref}
            onClick={() => posthog.capture("bottom_cta_clicked", { label: "Get Started" })}
            className="flex items-center gap-1.5 rounded-md bg-text-slate px-4 py-2 text-sm font-medium text-white hover:opacity-90"
          >
            Get Started
            <ChevronRight className="h-4 w-4" />
          </Link>
          <Link
            href={ctaHref}
            onClick={() => posthog.capture("bottom_cta_clicked", { label: "Find Your First Match" })}
            className="rounded-md border border-border bg-surface px-4 py-2 text-sm font-medium text-text-primary hover:bg-surface-secondary"
          >
            Find Your First Match
          </Link>
        </div>
      </div>
    </section>
  );
}
