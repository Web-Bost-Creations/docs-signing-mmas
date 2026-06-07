"use client";

import { useRouter } from "next/navigation";
import { ClientInfoForm } from "@/components/ClientInfoForm";
import { BrandHeader } from "@/components/BrandHeader";
import { PageShell } from "@/components/PageShell";
import { Shield, Clock, FileText, Wrench } from "lucide-react";
import { ClientInfo, CLIENT_INFO_KEY } from "@/lib/documents";

export default function HomePage() {
  const router = useRouter();

  const handleClientInfoSubmit = (info: ClientInfo) => {
    sessionStorage.setItem(CLIENT_INFO_KEY, JSON.stringify(info));
    router.push("/documents");
  };

  return (
    <PageShell>
      <BrandHeader
        title="Sign your service documents"
        description="Review and sign your General Service Agreement and Parts Policy before we begin work on your vehicle."
      />

      <div
        className="flex flex-wrap gap-4 mb-10 animate-fade-up"
        style={{ animationDelay: "0.1s", opacity: 0 }}
      >
        {[
          { icon: Shield, label: "Secure & encrypted" },
          { icon: Clock, label: "Legally binding" },
          { icon: FileText, label: "2 documents to sign" },
          { icon: Wrench, label: "Required before service" },
        ].map(({ icon: Icon, label }) => (
          <div
            key={label}
            className="flex items-center gap-2 px-3 py-1.5 rounded-full text-xs"
            style={{
              background: "var(--surface)",
              border: "1px solid var(--border)",
              color: "var(--text-secondary)",
            }}
          >
            <Icon className="w-3 h-3" style={{ color: "var(--accent)" }} />
            {label}
          </div>
        ))}
      </div>

      <ClientInfoForm onSubmit={handleClientInfoSubmit} />
    </PageShell>
  );
}
