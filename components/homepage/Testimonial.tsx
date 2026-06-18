import Image from "next/image";

export function Testimonial() {
  return (
    <section className="bg-surface px-6 py-24">
      <div className="mx-auto max-w-2xl text-center">
        <p className="text-xs font-semibold uppercase tracking-wide text-accent">
          Success Stories
        </p>

        <p className="mt-6 text-xl font-medium leading-relaxed text-text-primary">
          &ldquo;I used to spend my evenings copy-pasting resumes. Now I open
          my dashboard to see interviews waiting. It feels like cheating. Had
          3 offers on the table simultaneously.&rdquo;
        </p>

        <div className="mt-6 flex items-center justify-center gap-3">
          <Image
            src="/images/user-icon.png"
            alt="Tom Wilson"
            width={192}
            height={192}
            className="h-10 w-10 rounded-full"
          />
          <div className="text-left">
            <p className="text-sm font-medium text-text-primary">
              Tom Wilson
            </p>
            <p className="text-xs text-text-muted">Junior Developer</p>
          </div>
        </div>
      </div>
    </section>
  );
}
