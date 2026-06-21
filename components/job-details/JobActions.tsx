type JobActionsProps = {
  company: string;
  externalApplyUrl: string;
};

export function JobActions({ company, externalApplyUrl }: JobActionsProps) {
  return (
    <a
      href={externalApplyUrl}
      target="_blank"
      rel="noopener noreferrer"
      className="flex w-full items-center justify-center rounded-md bg-accent px-4 py-3 text-sm font-medium text-accent-foreground hover:opacity-90"
    >
      Apply Now at {company}
    </a>
  );
}
