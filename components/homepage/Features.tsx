import Image from "next/image";

const ITEMS = [
  {
    title: "Understand your match score",
    description:
      "See how your profile lines up with each role before you apply. Get a clear breakdown of what fits and what's missing.",
  },
  {
    title: "AI-Powered Job Matching",
    description:
      "Stop guessing which jobs are worth applying to. JobPilot scores every role against your actual skills so you focus on the ones that matter.",
  },
  {
    title: "Focus on the right roles",
    description:
      "Filter out low fit jobs and stay on the ones that actually matter. Spend less time sorting and more time applying.",
  },
];

export function Features() {
  return (
    <section className="bg-background px-6 py-24">
      <div className="mx-auto grid max-w-6xl gap-12 lg:grid-cols-2 lg:items-center">
        <Image
          src="/images/agnet-log.png"
          alt="JobPilot agent log"
          width={2144}
          height={1656}
          sizes="(max-width: 1024px) 100vw, 600px"
          className="h-auto w-full"
        />

        <div>
          <h2 className="text-4xl font-bold leading-tight text-text-primary">
            Apply With More Confidence, Every Time
          </h2>

          <div className="mt-10 divide-y divide-border">
            {ITEMS.map((item) => (
              <div key={item.title} className="py-6">
                <h3 className="text-base font-semibold text-text-primary">
                  {item.title}
                </h3>
                <p className="mt-2 text-sm text-text-secondary">
                  {item.description}
                </p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
