"use client";

import { SignedDoc } from "@/lib/documents";

type Props = {
  url: string;
  title: string;
  className?: string;
  signed?: boolean;
};

export function PdfViewer({ url, title, className = "", signed = false }: Props) {
  return (
    <div>
      {signed && (
        <p className="text-xs mb-2 font-medium" style={{ color: "var(--success)" }}>
          Signed copy — signature embedded at the bottom
        </p>
      )}
      <iframe
        src={`${url}#toolbar=1&navpanes=0`}
        title={title}
        className={`w-full rounded-xl border ${className}`}
        style={{
          borderColor: signed ? "rgba(74,222,128,0.3)" : "var(--border)",
          background: "var(--surface-2)",
          minHeight: "420px",
        }}
      />
    </div>
  );
}
