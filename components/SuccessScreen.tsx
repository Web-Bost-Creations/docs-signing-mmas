"use client";

import { ClientInfo, SignedDoc, Document } from "@/lib/documents";
import { CheckCircle2, Download, FileText, Calendar, User, Mail, Building2 } from "lucide-react";

type Props = {
  clientInfo: ClientInfo;
  signedDocs: SignedDoc[];
  documents: Document[];
  submissionId: string;
};

export function SuccessScreen({ clientInfo, signedDocs, documents, submissionId }: Props) {
  const downloadPdf = (blobUrl: string, filename: string) => {
    const a = window.document.createElement("a");
    a.href = blobUrl;
    a.download = filename;
    a.click();
  };

  const slug = (title: string) => title.replace(/\s+/g, "-").toLowerCase();

  const handleDownloadReceipt = () => {
    const lines = [
      `DOCUMENT SIGNING RECEIPT`,
      `========================`,
      ``,
      `Submission ID: ${submissionId}`,
      `Date: ${new Date().toLocaleString()}`,
      ``,
      `CLIENT INFORMATION`,
      `------------------`,
      `Name: ${clientInfo.fullName}`,
      `Email: ${clientInfo.email}`,
      clientInfo.company ? `Company: ${clientInfo.company}` : "",
      ``,
      `SIGNED DOCUMENTS`,
      `----------------`,
      ...signedDocs.map((s) => {
        const doc = documents.find((d) => d.id === s.docId);
        return `• ${doc?.title || s.docId} — ${new Date(s.signedAt).toLocaleString()}`;
      }),
      ``,
      `This receipt confirms the above documents were digitally signed.`,
    ]
      .filter((l) => l !== undefined)
      .join("\n");

    const blob = new Blob([lines], { type: "text/plain" });
    const url = URL.createObjectURL(blob);
    const a = window.document.createElement("a");
    a.href = url;
    a.download = `signing-receipt-${submissionId}.txt`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="animate-fade-up space-y-5">
      {/* Success card */}
      <div
        className="rounded-2xl p-8 text-center"
        style={{
          background: "var(--surface)",
          border: "1px solid rgba(74,222,128,0.25)",
        }}
      >
        <div
          className="w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-5"
          style={{
            background: "rgba(74,222,128,0.1)",
            border: "1px solid rgba(74,222,128,0.25)",
          }}
        >
          <CheckCircle2 className="w-8 h-8" style={{ color: "var(--success)" }} />
        </div>

        <h2
          className="font-heading text-2xl font-bold mb-2"
          style={{ color: "var(--text-primary)" }}
        >
          Documents Submitted
        </h2>
        <p className="text-sm mb-4" style={{ color: "var(--text-secondary)" }}>
          Your signed agreements have been recorded. Download your copies below.
        </p>
        <p className="text-xs font-mono" style={{ color: "var(--text-muted)" }}>
          Submission ID:{" "}
          <span style={{ color: "var(--accent)" }}>{submissionId}</span>
        </p>
      </div>

      {/* Details */}
      <div
        className="rounded-2xl p-6"
        style={{ background: "var(--surface)", border: "1px solid var(--border)" }}
      >
        <p
          className="text-xs font-medium uppercase tracking-widest mb-4"
          style={{ color: "var(--text-muted)" }}
        >
          Submission Details
        </p>

        <div className="space-y-3 mb-5">
          {[
            { icon: User, label: "Name", value: clientInfo.fullName },
            { icon: Mail, label: "Email", value: clientInfo.email },
            ...(clientInfo.company
              ? [{ icon: Building2, label: "Company", value: clientInfo.company }]
              : []),
            {
              icon: Calendar,
              label: "Submitted",
              value: new Date().toLocaleDateString("en-US", {
                month: "long",
                day: "numeric",
                year: "numeric",
                hour: "2-digit",
                minute: "2-digit",
              }),
            },
          ].map(({ icon: Icon, label, value }) => (
            <div key={label} className="flex items-center gap-3">
              <Icon className="w-4 h-4 flex-shrink-0" style={{ color: "var(--text-muted)" }} />
              <span className="text-xs" style={{ color: "var(--text-muted)" }}>
                {label}
              </span>
              <span
                className="text-xs ml-auto font-medium"
                style={{ color: "var(--text-secondary)" }}
              >
                {value}
              </span>
            </div>
          ))}
        </div>

        {/* Per-document download section */}
        <div
          className="border-t pt-4"
          style={{ borderColor: "var(--border)" }}
        >
          <p
            className="text-xs font-medium mb-3"
            style={{ color: "var(--text-muted)" }}
          >
            Signed Documents
          </p>

          <div className="space-y-3">
            {signedDocs.map((s) => {
              const doc = documents.find((d) => d.id === s.docId);
              if (!doc) return null;

              return (
                <div
                  key={s.docId}
                  className="rounded-xl p-3"
                  style={{
                    background: "var(--surface-2)",
                    border: "1px solid var(--border)",
                  }}
                >
                  {/* Doc title row */}
                  <div className="flex items-center gap-2 mb-3">
                    <FileText className="w-3.5 h-3.5 flex-shrink-0" style={{ color: "var(--accent)" }} />
                    <span className="text-xs font-medium flex-1" style={{ color: "var(--text-primary)" }}>
                      {doc.title}
                    </span>
                    <CheckCircle2 className="w-3.5 h-3.5 flex-shrink-0" style={{ color: "var(--success)" }} />
                  </div>

                  {/* Two download buttons */}
                  <div className="grid grid-cols-2 gap-2">
                    {/* Customer Copy */}
                    <button
                      onClick={() =>
                        downloadPdf(
                          s.customerPdfBlobUrl,
                          `${slug(doc.title)}-customer-copy.pdf`
                        )
                      }
                      className="flex items-center justify-center gap-1.5 py-2 px-3 rounded-lg text-xs font-medium transition-all"
                      style={{
                        background: "rgba(37,99,235,0.1)",
                        border: "1px solid rgba(37,99,235,0.25)",
                        color: "var(--accent)",
                      }}
                      onMouseEnter={(e) => {
                        (e.currentTarget as HTMLElement).style.background = "rgba(37,99,235,0.18)";
                      }}
                      onMouseLeave={(e) => {
                        (e.currentTarget as HTMLElement).style.background = "rgba(37,99,235,0.1)";
                      }}
                    >
                      <Download className="w-3 h-3" />
                      Customer Copy
                    </button>

                    {/* Business Copy */}
                    <button
                      onClick={() =>
                        downloadPdf(
                          s.businessPdfBlobUrl,
                          `${slug(doc.title)}-matts-copy.pdf`
                        )
                      }
                      className="flex items-center justify-center gap-1.5 py-2 px-3 rounded-lg text-xs font-medium transition-all"
                      style={{
                        background: "rgba(100,116,139,0.12)",
                        border: "1px solid rgba(100,116,139,0.25)",
                        color: "var(--text-secondary)",
                      }}
                      onMouseEnter={(e) => {
                        (e.currentTarget as HTMLElement).style.background = "rgba(100,116,139,0.22)";
                      }}
                      onMouseLeave={(e) => {
                        (e.currentTarget as HTMLElement).style.background = "rgba(100,116,139,0.12)";
                      }}
                    >
                      <Download className="w-3 h-3" />
                      Matt&apos;s Copy
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Receipt download */}
      <button
        onClick={handleDownloadReceipt}
        className="w-full flex items-center justify-center gap-2 py-4 rounded-xl text-sm font-medium transition-all"
        style={{
          background: "var(--surface)",
          border: "1px solid var(--border)",
          color: "var(--text-secondary)",
        }}
        onMouseEnter={(e) => {
          (e.currentTarget as HTMLElement).style.borderColor = "var(--accent)";
          (e.currentTarget as HTMLElement).style.color = "var(--accent)";
        }}
        onMouseLeave={(e) => {
          (e.currentTarget as HTMLElement).style.borderColor = "var(--border)";
          (e.currentTarget as HTMLElement).style.color = "var(--text-secondary)";
        }}
      >
        <Download className="w-4 h-4" />
        Download Receipt (.txt)
      </button>
    </div>
  );
}
