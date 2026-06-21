type JobDescriptionProps = {
  aboutRole: string | null;
  responsibilities: string[];
  requirements: string[];
  niceToHave: string[];
  benefits: string[];
  aboutCompany: string | null;
};

function BulletSection({ heading, items }: { heading: string; items: string[] }) {
  if (items.length === 0) return null;

  return (
    <div className="flex flex-col gap-2">
      <h3 className="text-sm font-semibold text-text-primary">{heading}</h3>
      <ul className="flex flex-col gap-1.5 pl-1">
        {items.map((item) => (
          <li key={item} className="flex gap-2 text-sm text-text-secondary">
            <span className="mt-1.5 h-1 w-1 shrink-0 rounded-full bg-text-muted" />
            {item}
          </li>
        ))}
      </ul>
    </div>
  );
}

export function JobDescription({
  aboutRole,
  responsibilities,
  requirements,
  niceToHave,
  benefits,
  aboutCompany,
}: JobDescriptionProps) {
  return (
    <section className="flex flex-col gap-5 rounded-2xl border border-border bg-surface p-6 shadow-[0px_1px_3px_rgba(0,0,0,0.1),0px_1px_2px_-1px_rgba(0,0,0,0.1)]">
      <h2 className="text-base font-semibold text-text-primary">Job Description</h2>

      {aboutRole && <p className="whitespace-pre-line text-sm text-text-secondary">{aboutRole}</p>}

      <BulletSection heading="Responsibilities" items={responsibilities} />
      <BulletSection heading="Requirements" items={requirements} />
      <BulletSection heading="Nice to Have" items={niceToHave} />
      <BulletSection heading="Benefits" items={benefits} />

      {aboutCompany && (
        <div className="flex flex-col gap-2">
          <h3 className="text-sm font-semibold text-text-primary">About the Company</h3>
          <p className="text-sm text-text-secondary">{aboutCompany}</p>
        </div>
      )}
    </section>
  );
}
