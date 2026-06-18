"use client";

import Image from "next/image";
import Link from "next/link";
import { ChevronRight } from "lucide-react";
import posthog from "posthog-js";

type HeroProps = {
  ctaHref?: string;
};

export function Hero({ ctaHref = "/login" }: HeroProps) {
  return (
    <>
      <section className="gradient-hero px-6 pt-20 pb-56 text-center">
        <div className="mx-auto max-w-3xl">
          <h1 className="text-5xl font-bold leading-tight text-text-primary sm:text-6xl">
            Job hunting is hard.
            <br />
            Your tools shouldn&apos;t be.
          </h1>
          <p className="mx-auto mt-6 max-w-xl text-base text-text-secondary">
            Stop applying blind. JobPilot finds the jobs, researches the
            companies, and gives you everything you need to stand out.
          </p>
          <div className="mt-8 flex items-center justify-center gap-3">
            <Link
              href={ctaHref}
              onClick={() => posthog.capture("hero_cta_clicked", { label: "Get Started" })}
              className="flex items-center gap-1.5 rounded-md bg-text-slate px-4 py-2 text-sm font-medium text-white hover:opacity-90"
            >
              Get Started
              <ChevronRight className="h-4 w-4" />
            </Link>
            <Link
              href={ctaHref}
              onClick={() => posthog.capture("hero_cta_clicked", { label: "Find Your First Match" })}
              className="rounded-md border border-border bg-surface px-4 py-2 text-sm font-medium text-text-primary hover:bg-surface-secondary"
            >
              Find Your First Match
            </Link>
          </div>
        </div>
      </section>

      <div className="-mt-32 bg-background px-6 pb-24">
        <div className="mx-auto max-w-5xl">
          <Image
            src="/images/dashboard-demo.png"
            alt="JobPilot dashboard preview"
            width={4788}
            height={2416}
            preload
            sizes="(max-width: 1024px) 100vw, 1024px"
            className="h-auto w-full"
          />
        </div>
      </div>
    </>
  );
}
