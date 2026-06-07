import Image from "next/image";
import { BRAND } from "@/lib/brand";

type Props = {
  subtitle?: string;
  title: string;
  description?: string;
};

export function BrandHeader({ subtitle, title, description }: Props) {
  return (
    <header className="mb-12 animate-fade-up">
      <div className="flex items-center gap-3 mb-6">
        <Image
          src="/logo.svg"
          alt={BRAND.name}
          width={44}
          height={44}
          className="rounded-xl"
          priority
        />
        <div>
          <p
            className="font-heading text-sm font-bold tracking-wide uppercase"
            style={{ color: "var(--accent)" }}
          >
            {BRAND.name}
          </p>
          <p className="text-xs" style={{ color: "var(--text-muted)" }}>
            {subtitle ?? BRAND.documentPortal}
          </p>
        </div>
      </div>

      <h1
        className="font-heading text-4xl md:text-5xl font-bold leading-tight mb-3"
        style={{ color: "var(--text-primary)" }}
      >
        {title}
      </h1>
      {description && (
        <p className="text-base max-w-2xl" style={{ color: "var(--text-secondary)" }}>
          {description}
        </p>
      )}
    </header>
  );
}
