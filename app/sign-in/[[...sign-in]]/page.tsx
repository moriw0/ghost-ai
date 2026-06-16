import { SignIn } from "@clerk/nextjs";
import { Network, MousePointer2, ScrollText } from "lucide-react";

const features = [
  {
    icon: Network,
    title: "AI Architecture Generation",
    description:
      "Describe your system, AI maps it to nodes and edges on a live canvas.",
  },
  {
    icon: MousePointer2,
    title: "Real-time Collaboration",
    description:
      "Live cursors, presence indicators, and shared node editing across your team.",
  },
  {
    icon: ScrollText,
    title: "Instant Spec Generation",
    description:
      "Export a complete Markdown technical spec directly from the canvas graph.",
  },
];

export default function SignInPage() {
  return (
    <div className="flex min-h-screen bg-[var(--bg-base)]">
      <div className="hidden lg:flex lg:w-1/2 flex-col px-16 py-12 border-r border-[var(--border-default)]">
        <div className="flex items-center gap-2.5">
          <div className="h-6 w-6 rounded-lg bg-[var(--accent-primary)]" />
          <span className="text-sm font-semibold text-[var(--text-primary)]">
            Ghost AI
          </span>
        </div>

        <div className="flex flex-1 flex-col justify-center max-w-md">
          <h1 className="text-4xl font-bold text-[var(--text-primary)] leading-tight mb-5">
            Design systems at the speed of thought.
          </h1>
          <p className="text-sm text-[var(--text-secondary)] leading-relaxed mb-10">
            Describe your architecture in plain English. Ghost AI maps it to a
            shared canvas your whole team can refine in real time.
          </p>
          <ul className="space-y-6">
            {features.map(({ icon: Icon, title, description }) => (
              <li key={title} className="flex items-start gap-4">
                <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-[var(--accent-primary-dim)]">
                  <Icon className="h-4 w-4 text-[var(--accent-primary)]" />
                </div>
                <div>
                  <p className="text-sm font-medium text-[var(--text-primary)]">
                    {title}
                  </p>
                  <p className="text-xs text-[var(--text-muted)] mt-0.5 leading-relaxed">
                    {description}
                  </p>
                </div>
              </li>
            ))}
          </ul>
        </div>

        <p className="text-xs text-[var(--text-faint)]">
          © 2026 Ghost AI. All rights reserved.
        </p>
      </div>

      <div className="flex flex-1 items-center justify-center px-6 py-12">
        <SignIn />
      </div>
    </div>
  );
}
