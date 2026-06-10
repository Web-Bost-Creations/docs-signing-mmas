"use client";

import dynamic from "next/dynamic";
import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { BrandHeader } from "@/components/BrandHeader";
import { PageShell } from "@/components/PageShell";
import { Document, ClientInfo } from "@/lib/documents";
import { Loader2, CheckCircle2, AlertCircle } from "lucide-react";

const SigningFlow = dynamic(
  () => import("@/components/SigningFlow").then((mod) => mod.SigningFlow),
  {
    ssr: false,
    loading: () => (
      <PageShell>
        <div className="flex items-center justify-center py-24">
          <Loader2 className="w-8 h-8 animate-spin" style={{ color: "var(--accent)" }} />
        </div>
      </PageShell>
    ),
  }
);

type Props = {
  token: string;
};

export function SignLinkClient({ token }: Props) {
  const link = useQuery(api.signingLinks.getByToken, token ? { token } : "skip");

  if (link === undefined) {
    return (
      <PageShell>
        <div className="flex items-center justify-center py-24">
          <Loader2 className="w-8 h-8 animate-spin" style={{ color: "var(--accent)" }} />
        </div>
      </PageShell>
    );
  }

  if (link === null) {
    return (
      <PageShell>
        <BrandHeader
          title="Link not found"
          description="This signing link may have expired or the URL is incorrect."
        />
        <div
          className="flex items-center gap-3 p-4 rounded-xl"
          style={{
            background: "rgba(248,113,113,0.08)",
            border: "1px solid rgba(248,113,113,0.2)",
            color: "var(--danger)",
          }}
        >
          <AlertCircle className="w-5 h-5" />
          <p className="text-sm">Please contact Matt&apos;s Mobile Mechanic for a new link.</p>
        </div>
      </PageShell>
    );
  }

  if (link.status === "complete") {
    return (
      <PageShell>
        <BrandHeader
          title="Already signed"
          description={`Thanks, ${link.clientName.split(" ")[0]} — these documents were already submitted.`}
        />
        <div
          className="flex items-center gap-3 p-4 rounded-xl"
          style={{
            background: "rgba(34,197,94,0.08)",
            border: "1px solid rgba(34,197,94,0.2)",
          }}
        >
          <CheckCircle2 className="w-5 h-5" style={{ color: "var(--success)" }} />
          <p className="text-sm" style={{ color: "var(--text-secondary)" }}>
            If you need another copy, contact Matt&apos;s Mobile Mechanic.
          </p>
        </div>
      </PageShell>
    );
  }

  const documents: Document[] = link.documents.map((d) => ({
    id: d.id,
    title: d.title,
    description: d.description,
    pages: d.pages,
    category: d.category,
    required: d.required,
    pdfUrl: d.pdfUrl,
    signaturePlacementKey: d.signaturePlacementKey,
  }));

  const clientInfo: ClientInfo = {
    fullName: link.clientName,
    email: link.clientEmail,
    company: link.clientCompany,
  };

  return (
    <SigningFlow
      documents={documents}
      clientInfo={clientInfo}
      signingLinkId={link._id}
      welcomeDescription={
        link.note
          ? `${link.note} — review and sign the ${documents.length} document${documents.length !== 1 ? "s" : ""} below.`
          : `Review and sign the ${documents.length} document${documents.length !== 1 ? "s" : ""} Matt sent you.`
      }
    />
  );
}
