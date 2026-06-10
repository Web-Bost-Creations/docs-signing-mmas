"use client";

import { useState } from "react";
import { useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Id } from "@/convex/_generated/dataModel";
import { Document, ClientInfo, SignedDoc } from "@/lib/documents";
import { PdfViewer } from "@/components/PdfViewer";
import { uploadPdfToConvex } from "@/lib/uploadSignedPdf";
import {
  FileText,
  CheckCircle2,
  ChevronDown,
  ChevronUp,
  PenLine,
  Lock,
  AlertCircle,
  Loader2,
  Send,
} from "lucide-react";
import { clsx } from "clsx";

type Props = {
  documents: Document[];
  selectedDocs: Set<string>;
  setSelectedDocs: (fn: (prev: Set<string>) => Set<string>) => void;
  signedDocs: SignedDoc[];
  onSignDoc: (doc: Document) => void;
  clientInfo: ClientInfo;
  allRequiredSigned: boolean;
  selectedSignedCount: number;
  onSubmitAll: (id: string) => void;
  signingLinkId?: Id<"signingLinks">;
};

const CATEGORY_COLORS: Record<string, string> = {
  Legal: "#2563eb",
  Project: "#64748b",
  Compliance: "#22c55e",
};

export function DocumentList({
  documents,
  selectedDocs,
  setSelectedDocs,
  signedDocs,
  onSignDoc,
  clientInfo,
  allRequiredSigned,
  selectedSignedCount,
  onSubmitAll,
  signingLinkId,
}: Props) {
  const [expanded, setExpanded] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const submitSignatures = useMutation(api.signatures.submitSignatures);
  const completeSigningLink = useMutation(api.signingLinks.completeSigningLink);
  const generateUploadUrl = useMutation(api.files.generateUploadUrl);

  const toggleSelect = (doc: Document) => {
    if (doc.required) return;
    setSelectedDocs((prev) => {
      const next = new Set(prev);
      if (next.has(doc.id)) next.delete(doc.id);
      else next.add(doc.id);
      return next;
    });
  };

  const isSigned = (id: string) => signedDocs.some((s) => s.docId === id);
  const isSelected = (id: string) => selectedDocs.has(id);

  const selectedList = documents.filter((d) => isSelected(d.id));
  const allSelectedSigned = selectedList.every((d) => isSigned(d.id));

  const handleSubmit = async () => {
    if (!allSelectedSigned) return;
    setSubmitting(true);
    try {
      const selectedSigned = signedDocs.filter((s) => isSelected(s.docId));

      const signatures = await Promise.all(
        selectedSigned.map(async (s) => {
          const storageId = await uploadPdfToConvex(
            () => generateUploadUrl(),
            s.customerPdfBytes
          );

          return {
            documentId: s.docId,
            documentTitle: documents.find((d) => d.id === s.docId)?.title || "",
            signatureData: s.signature,
            signedPdfStorageId: storageId as Id<"_storage">,
            signedAt: s.signedAt,
          };
        })
      );

      const id = await submitSignatures({
        clientName: clientInfo.fullName,
        clientEmail: clientInfo.email,
        clientCompany: clientInfo.company || "",
        signingLinkId,
        signatures,
      });

      if (signingLinkId) {
        await completeSigningLink({
          signingLinkId,
          submissionId: id as Id<"submissions">,
        });
      }

      onSubmitAll(id);
    } catch (err) {
      console.error(err);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="space-y-3 animate-fade-up" style={{ animationDelay: "0.1s", opacity: 0 }}>
      {/* Progress bar */}
      <div
        className="rounded-2xl p-5 mb-6"
        style={{ background: "var(--surface)", border: "1px solid var(--border)" }}
      >
        <div className="flex items-center justify-between mb-3">
          <span className="text-sm font-medium" style={{ color: "var(--text-secondary)" }}>
            Signing Progress
          </span>
          <span className="text-sm font-mono" style={{ color: "var(--accent)" }}>
            {selectedSignedCount} / {selectedList.length} signed
          </span>
        </div>
        <div
          className="h-1.5 rounded-full overflow-hidden"
          style={{ background: "var(--surface-2)" }}
        >
          <div
            className="h-full rounded-full transition-all duration-700"
            style={{
              width: `${selectedList.length ? (selectedSignedCount / selectedList.length) * 100 : 0}%`,
              background: "linear-gradient(90deg, var(--accent), var(--accent-hover))",
            }}
          />
        </div>
      </div>

      {/* Document cards */}
      {documents.map((doc, i) => {
        const signed = isSigned(doc.id);
        const selected = isSelected(doc.id);
        const isOpen = expanded === doc.id;
        const signedEntry = signedDocs.find((s) => s.docId === doc.id);

        return (
          <div
            key={doc.id}
            className="rounded-2xl overflow-hidden transition-all duration-200"
            style={{
              background: "var(--surface)",
              border: `1px solid ${signed ? "rgba(74,222,128,0.3)" : selected ? "var(--border-light)" : "var(--border)"}`,
              animationDelay: `${i * 0.06}s`,
              opacity: 0,
              animation: `fadeUp 0.4s ease ${i * 0.06}s forwards`,
            }}
          >
            {/* Card header */}
            <div className="p-5">
              <div className="flex items-start gap-4">
                {/* Checkbox / signed indicator */}
                <button
                  onClick={() => toggleSelect(doc)}
                  className="mt-0.5 flex-shrink-0 w-5 h-5 rounded flex items-center justify-center transition-all"
                  style={{
                    background: signed
                      ? "rgba(74,222,128,0.15)"
                      : selected
                      ? "var(--accent)"
                      : "var(--surface-2)",
                    border: `1.5px solid ${signed ? "var(--success)" : selected ? "var(--accent)" : "var(--border-light)"}`,
                    cursor: doc.required ? "not-allowed" : "pointer",
                  }}
                  title={doc.required ? "Required document" : "Toggle selection"}
                >
                  {signed ? (
                    <CheckCircle2 className="w-3 h-3" style={{ color: "var(--success)" }} />
                  ) : selected ? (
                    <div className="w-2 h-2 rounded-sm bg-black" />
                  ) : null}
                </button>

                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1 flex-wrap">
                    <h3
                      className="font-heading font-semibold text-base leading-tight"
                      style={{ color: "var(--text-primary)" }}
                    >
                      {doc.title}
                    </h3>
                    {doc.required && (
                      <span
                        className="text-xs px-2 py-0.5 rounded-full font-mono"
                        style={{
                          background: "rgba(37, 99, 235, 0.12)",
                          color: "var(--accent)",
                          border: "1px solid rgba(37, 99, 235, 0.25)",
                        }}
                      >
                        Required
                      </span>
                    )}
                    <span
                      className="text-xs px-2 py-0.5 rounded-full"
                      style={{
                        background: `${CATEGORY_COLORS[doc.category]}18`,
                        color: CATEGORY_COLORS[doc.category],
                        border: `1px solid ${CATEGORY_COLORS[doc.category]}30`,
                      }}
                    >
                      {doc.category}
                    </span>
                  </div>
                  <p className="text-sm leading-relaxed mb-3" style={{ color: "var(--text-secondary)" }}>
                    {doc.description}
                  </p>
                  <div className="flex items-center gap-4">
                    <span className="text-xs font-mono" style={{ color: "var(--text-muted)" }}>
                      {doc.pages} pages
                    </span>
                    <span className="text-xs font-mono" style={{ color: "var(--text-muted)" }}>
                      #{doc.id}
                    </span>
                  </div>
                </div>

                <div className="flex items-center gap-2 flex-shrink-0">
                  {/* Expand toggle */}
                  <button
                    onClick={() => setExpanded(isOpen ? null : doc.id)}
                    className="p-2 rounded-lg transition-all"
                    style={{
                      background: "var(--surface-2)",
                      color: "var(--text-muted)",
                    }}
                    onMouseEnter={(e) => {
                      (e.currentTarget as HTMLElement).style.color = "var(--text-secondary)";
                    }}
                    onMouseLeave={(e) => {
                      (e.currentTarget as HTMLElement).style.color = "var(--text-muted)";
                    }}
                  >
                    {isOpen ? (
                      <ChevronUp className="w-4 h-4" />
                    ) : (
                      <ChevronDown className="w-4 h-4" />
                    )}
                  </button>

                  {/* Sign button */}
                  {selected && !signed && (
                    <button
                      onClick={() => onSignDoc(doc)}
                      className="flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm font-medium transition-all"
                      style={{
                        background: "var(--accent)",
                        color: "var(--accent-foreground)",
                      }}
                      onMouseEnter={(e) => {
                        (e.currentTarget as HTMLElement).style.boxShadow =
                          "0 4px 14px rgba(37, 99, 235, 0.35)";
                      }}
                      onMouseLeave={(e) => {
                        (e.currentTarget as HTMLElement).style.boxShadow = "none";
                      }}
                    >
                      <PenLine className="w-3.5 h-3.5" />
                      Sign
                    </button>
                  )}

                  {signed && (
                    <div
                      className="flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-medium"
                      style={{
                        background: "rgba(74,222,128,0.1)",
                        color: "var(--success)",
                        border: "1px solid rgba(74,222,128,0.2)",
                      }}
                    >
                      <CheckCircle2 className="w-3.5 h-3.5" />
                      Signed
                    </div>
                  )}

                  {!selected && !signed && !doc.required && (
                    <div
                      className="p-2 rounded-lg"
                      style={{ color: "var(--text-muted)" }}
                      title="Select to sign"
                    >
                      <Lock className="w-4 h-4" />
                    </div>
                  )}
                </div>
              </div>
            </div>

            {isOpen && (
              <div
                className="px-5 pb-5 border-t"
                style={{ borderColor: "var(--border)" }}
              >
                <div className="mt-4">
                  <PdfViewer
                    url={signedEntry?.customerPdfBlobUrl ?? doc.pdfUrl}
                    title={doc.title}
                    signed={Boolean(signedEntry)}
                  />
                </div>
              </div>
            )}
          </div>
        );
      })}

      {/* Submit section */}
      <div
        className="rounded-2xl p-6 mt-6"
        style={{
          background: "var(--surface)",
          border: `1px solid ${allSelectedSigned ? "rgba(37, 99, 235, 0.3)" : "var(--border)"}`,
        }}
      >
        {!allSelectedSigned && (
          <div
            className="flex items-center gap-2 mb-4 p-3 rounded-xl text-sm"
            style={{
              background: "rgba(248,113,113,0.07)",
              border: "1px solid rgba(248,113,113,0.15)",
              color: "var(--danger)",
            }}
          >
            <AlertCircle className="w-4 h-4 flex-shrink-0" />
            Please sign all selected documents before submitting.
          </div>
        )}

        <button
          onClick={handleSubmit}
          disabled={!allSelectedSigned || submitting}
          className={clsx(
            "w-full flex items-center justify-center gap-2.5 py-4 rounded-xl font-medium text-sm transition-all",
            !allSelectedSigned && "opacity-40 cursor-not-allowed"
          )}
          style={{
            background: allSelectedSigned ? "var(--accent)" : "var(--surface-2)",
            color: allSelectedSigned ? "var(--accent-foreground)" : "var(--text-muted)",
          }}
          onMouseEnter={(e) => {
            if (!allSelectedSigned) return;
            (e.currentTarget as HTMLElement).style.boxShadow =
              "0 4px 20px rgba(37, 99, 235, 0.35)";
          }}
          onMouseLeave={(e) => {
            (e.currentTarget as HTMLElement).style.boxShadow = "none";
          }}
        >
          {submitting ? (
            <Loader2 className="w-4 h-4 animate-spin" />
          ) : (
            <Send className="w-4 h-4" />
          )}
          {submitting ? "Submitting…" : `Submit ${selectedList.length} Document${selectedList.length !== 1 ? "s" : ""}`}
        </button>
      </div>
    </div>
  );
}
