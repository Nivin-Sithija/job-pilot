import Image from "next/image";

const ITEMS = [
  {
    title: "Find jobs that actually fit",
    description:
      "Search by title and location or paste a job link. Get matched roles you can quickly scan.",
  },
  {
    title: "Know the Company Before You Apply",
    description:
      "Stop guessing what a company is about. JobPilot browses their site and gives you everything you need to apply with confidence.",
  },
  {
    title: "Keep track of every application",
    description:
      "Keep a clear view of every job you've found, tailored. Your activity and progress all stay in one simple place.",
  },
];

export function HowItWorks() {
  return (
    <section className="bg-surface px-6 py-24">
      <div className="mx-auto grid max-w-6xl gap-12 lg:grid-cols-2 lg:items-center">
        <div>
          <h2 className="text-4xl font-bold leading-tight text-text-primary">
            Manage Your Job Search With Ease
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

        <Image
          src="/images/jobs-lists.png"
          alt="JobPilot matched jobs list"
          width={2364}
          height={1778}
          sizes="(max-width: 1024px) 100vw, 600px"
          className="h-auto w-full"
        />
      </div>
    </section>
  );
}
