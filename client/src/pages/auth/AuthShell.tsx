import { ReactNode } from 'react';

export default function AuthShell({ children, tagline }: { children: ReactNode; tagline: string }) {
  return (
    <div className="flex min-h-screen flex-col md:flex-row">
      {/* Brand panel */}
      <div className="relative flex flex-col justify-between overflow-hidden bg-pine-darkest p-8 text-paper md:w-[44%] md:p-12">
        <div className="pointer-events-none absolute -right-24 -top-24 h-72 w-72 rounded-full bg-pine opacity-40 blur-3xl" />
        <div className="pointer-events-none absolute -bottom-32 -left-16 h-80 w-80 rounded-full bg-marigold opacity-15 blur-3xl" />
        <p className="font-display text-3xl font-black tracking-tight">
          Pulse<span className="text-marigold">.</span>
        </p>
        <div className="py-10 md:py-0">
          <h1 className="font-display text-4xl font-black leading-[1.05] md:text-5xl">
            Stop Excel.
            <br />
            <span className="text-marigold">Team performance,</span>
            <br />
            one place.
          </h1>
          <p className="mt-4 max-w-sm text-sm leading-relaxed text-paper/65">{tagline}</p>
        </div>
        <p className="hidden text-xs text-paper/40 md:block">
          Multi-business · Self-reported time · Automation that chases follow-ups for you
        </p>
      </div>
      {/* Form panel */}
      <div className="flex flex-1 items-center justify-center p-6 md:p-12">
        <div className="rise w-full max-w-sm">{children}</div>
      </div>
    </div>
  );
}
