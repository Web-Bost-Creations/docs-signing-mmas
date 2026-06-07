import { ReactNode } from "react";

type Props = {
  children: ReactNode;
};

export function PageShell({ children }: Props) {
  return (
    <div className="relative min-h-screen" style={{ background: "var(--bg)" }}>
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div
          className="absolute -top-32 -right-32 w-96 h-96 rounded-full opacity-15 blur-3xl"
          style={{ background: "radial-gradient(circle, var(--accent) 0%, transparent 70%)" }}
        />
        <div
          className="absolute bottom-0 -left-32 w-80 h-80 rounded-full opacity-10 blur-3xl"
          style={{ background: "radial-gradient(circle, var(--accent-secondary) 0%, transparent 70%)" }}
        />
        <div
          className="absolute inset-0 opacity-[0.03]"
          style={{
            backgroundImage:
              "repeating-linear-gradient(-45deg, transparent, transparent 40px, #ffffff 40px, #ffffff 41px)",
          }}
        />
      </div>

      <div className="relative z-10 max-w-4xl mx-auto px-4 py-8 md:py-16">{children}</div>
    </div>
  );
}
