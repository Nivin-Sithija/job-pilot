import Image from "next/image";
import Link from "next/link";

const NAV_LINKS = [
  { label: "Dashboard", href: "/dashboard" },
  { label: "Find Jobs", href: "/find-jobs" },
  { label: "Profile", href: "/profile" },
];

type AppNavbarProps = {
  active: "Dashboard" | "Find Jobs" | "Profile";
};

export function AppNavbar({ active }: AppNavbarProps) {
  return (
    <header className="w-full border-b border-border bg-surface">
      <div className="mx-auto flex h-16 max-w-[1440px] items-center justify-between px-6">
        <Link href="/dashboard" className="flex items-center">
          <Image
            src="/logo.png"
            alt="JobPilot"
            width={496}
            height={168}
            preload
            className="h-7 w-auto"
          />
        </Link>

        <nav className="flex items-center gap-8">
          {NAV_LINKS.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className={
                link.label === active
                  ? "text-sm font-medium text-accent"
                  : "text-sm font-medium text-text-dark hover:text-text-primary"
              }
            >
              {link.label}
            </Link>
          ))}
        </nav>
      </div>
    </header>
  );
}
