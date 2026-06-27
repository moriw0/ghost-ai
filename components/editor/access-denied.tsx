import Link from "next/link";
import { Lock } from "lucide-react";

export function AccessDenied() {
  return (
    <div className="flex h-screen flex-col items-center justify-center bg-[var(--bg-base)]">
      <div className="flex flex-col items-center gap-4 text-center">
        <div className="rounded-2xl bg-[var(--bg-subtle)] p-4">
          <Lock className="h-8 w-8 text-[var(--text-muted)]" />
        </div>
        <div className="flex flex-col gap-1">
          <h1 className="text-xl font-semibold text-[var(--text-primary)]">
            Access denied
          </h1>
          <p className="max-w-sm text-sm text-[var(--text-secondary)]">
            This project does not exist or you do not have permission to access
            it.
          </p>
        </div>
        <Link
          href="/editor"
          className="text-sm text-[var(--accent-primary)] hover:underline"
        >
          Back to projects
        </Link>
      </div>
    </div>
  );
}
