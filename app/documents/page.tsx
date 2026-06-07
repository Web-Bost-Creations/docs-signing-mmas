"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { DocumentList } from "@/components/DocumentList";
import { SigningModal } from "@/components/SigningModal";
import { SuccessScreen } from "@/components/SuccessScreen";
import { BrandHeader } from "@/components/BrandHeader";
import { PageShell } from "@/components/PageShell";
import {
  ClientInfo,
  Document,
  SignedDoc,
  DOCUMENTS,
  CLIENT_INFO_KEY,
} from "@/lib/documents";

type Step = "documents" | "success";

export default function DocumentsPage() {
  const router = useRouter();
  const [step, setStep] = useState<Step>("documents");
  const [clientInfo, setClientInfo] = useState<ClientInfo | null>(null);
  const [selectedDocs, setSelectedDocs] = useState<Set<string>>(new Set());
  const [signingDoc, setSigningDoc] = useState<Document | null>(null);
  const [signedDocs, setSignedDocs] = useState<SignedDoc[]>([]);
  const [submissionId, setSubmissionId] = useState<string>("");

  useEffect(() => {
    const stored = sessionStorage.getItem(CLIENT_INFO_KEY);
    if (!stored) {
      router.replace("/");
      return;
    }

    try {
      const info = JSON.parse(stored) as ClientInfo;
      setClientInfo(info);
      setSelectedDocs(new Set(DOCUMENTS.map((d) => d.id)));
    } catch {
      router.replace("/");
    }
  }, [router]);

  const handleSignDoc = (doc: Document) => {
    setSigningDoc(doc);
  };

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

  const handleSuccess = (id: string) => {
    setSubmissionId(id);
    setStep("success");
    sessionStorage.removeItem(CLIENT_INFO_KEY);
  };

  const selectedDocsList = DOCUMENTS.filter((d) => selectedDocs.has(d.id));
  const selectedSignedCount = selectedDocsList.filter((d) =>
    signedDocs.some((s) => s.docId === d.id)
  ).length;
  const allRequiredSigned = DOCUMENTS.every((d) =>
    signedDocs.some((s) => s.docId === d.id)
  );

  if (!clientInfo) {
    return null;
  }

  const firstName = clientInfo.fullName.split(" ")[0];

  return (
    <PageShell>
      <BrandHeader
        title={step === "documents" ? `Welcome, ${firstName}` : "All done"}
        description={
          step === "documents"
            ? "Review each PDF below, then sign both documents to authorize service."
            : "Your signed documents have been submitted to Matt's Mobile Mechanic."
        }
      />

      {step === "documents" && (
        <DocumentList
          documents={DOCUMENTS}
          selectedDocs={selectedDocs}
          setSelectedDocs={setSelectedDocs}
          signedDocs={signedDocs}
          onSignDoc={handleSignDoc}
          clientInfo={clientInfo}
          allRequiredSigned={allRequiredSigned}
          selectedSignedCount={selectedSignedCount}
          onSubmitAll={handleSuccess}
        />
      )}

      {step === "success" && (
        <SuccessScreen
          clientInfo={clientInfo}
          signedDocs={signedDocs}
          documents={DOCUMENTS}
          submissionId={submissionId}
        />
      )}

      {signingDoc && clientInfo && (
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
