"use client";

import { useState } from "react";
import { Id } from "@/convex/_generated/dataModel";
import { DocumentList } from "@/components/DocumentList";
import { SigningModal } from "@/components/SigningModal";
import { SuccessScreen } from "@/components/SuccessScreen";
import { BrandHeader } from "@/components/BrandHeader";
import { PageShell } from "@/components/PageShell";
import { ClientInfo, Document, SignedDoc } from "@/lib/documents";

type Step = "documents" | "success";

type Props = {
  documents: Document[];
  clientInfo: ClientInfo;
  signingLinkId?: Id<"signingLinks">;
  welcomeDescription?: string;
  successDescription?: string;
};

export function SigningFlow({
  documents,
  clientInfo,
  signingLinkId,
  welcomeDescription,
  successDescription,
}: Props) {
  const [step, setStep] = useState<Step>("documents");
  const [selectedDocs, setSelectedDocs] = useState<Set<string>>(
    new Set(documents.map((d) => d.id))
  );
  const [signingDoc, setSigningDoc] = useState<Document | null>(null);
  const [signedDocs, setSignedDocs] = useState<SignedDoc[]>([]);
  const [submissionId, setSubmissionId] = useState<string>("");

  const handleSignatureComplete = (result: Omit<SignedDoc, "docId">) => {
    if (!signingDoc) return;

    setSignedDocs((prev) => {
      const existing = prev.find((s) => s.docId === signingDoc.id);
      if (existing) {
        URL.revokeObjectURL(existing.customerPdfBlobUrl);
        URL.revokeObjectURL(existing.businessPdfBlobUrl);
      }

      return [
        ...prev.filter((s) => s.docId !== signingDoc.id),
        { docId: signingDoc.id, ...result },
      ];
    });
    setSigningDoc(null);
  };

  const selectedDocsList = documents.filter((d) => selectedDocs.has(d.id));
  const selectedSignedCount = selectedDocsList.filter((d) =>
    signedDocs.some((s) => s.docId === d.id)
  ).length;
  const allRequiredSigned = documents
    .filter((d) => d.required)
    .every((d) => signedDocs.some((s) => s.docId === d.id));

  const firstName = clientInfo.fullName.split(" ")[0];

  return (
    <PageShell>
      <BrandHeader
        title={step === "documents" ? `Welcome, ${firstName}` : "All done"}
        description={
          step === "documents"
            ? welcomeDescription ??
              `Review and sign ${documents.length} document${documents.length !== 1 ? "s" : ""} below.`
            : successDescription ??
              "Your signed documents have been submitted to Matt's Mobile Mechanic."
        }
      />

      {step === "documents" && (
        <DocumentList
          documents={documents}
          selectedDocs={selectedDocs}
          setSelectedDocs={setSelectedDocs}
          signedDocs={signedDocs}
          onSignDoc={setSigningDoc}
          clientInfo={clientInfo}
          allRequiredSigned={allRequiredSigned}
          selectedSignedCount={selectedSignedCount}
          signingLinkId={signingLinkId}
          onSubmitAll={(id) => {
            setSubmissionId(id);
            setStep("success");
          }}
        />
      )}

      {step === "success" && (
        <SuccessScreen
          clientInfo={clientInfo}
          signedDocs={signedDocs}
          documents={documents}
          submissionId={submissionId}
        />
      )}

      {signingDoc && (
        <SigningModal
          document={signingDoc}
          clientName={clientInfo.fullName}
          onComplete={handleSignatureComplete}
          onClose={() => setSigningDoc(null)}
        />
      )}
    </PageShell>
  );
}
