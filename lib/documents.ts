export type Document = {
  id: string;
  title: string;
  description: string;
  pages: number;
  category: string;
  required: boolean;
  pdfUrl: string;
  signaturePlacementKey?: string;
};

export type ClientInfo = {
  fullName: string;
  email: string;
  company?: string;
};

export type SignedDoc = {
  docId: string;
  signature: string;
  signedAt: string;
  /** Customer Copy — shown to the client for download */
  customerPdfBlobUrl: string;
  customerPdfBytes: Uint8Array;
  /** Business Copy — downloaded by Matt */
  businessPdfBlobUrl: string;
  businessPdfBytes: Uint8Array;
  /** @deprecated use customerPdfBlobUrl */
  signedPdfBlobUrl: string;
  /** @deprecated use customerPdfBytes */
  signedPdfBytes: Uint8Array;
};

export const CLIENT_INFO_KEY = "docsign-client-info";

/**
 * Add your PDF templates here.
 *
 * Recommended: drop files into `public/documents/` and set pdfUrl to
 * `/documents/your-file.pdf` (works for reading + signing).
 *
 * External URLs can be used for viewing, but signing requires the browser
 * to fetch the PDF bytes — the host must allow CORS, or signing will fail.
 */
export const DOCUMENTS: Document[] = [
  {
    id: "general-service-agreement",
    title: "General Service Agreement",
    description:
      "Mobile repair work authorization, diagnostic terms, and service boundaries.",
    pages: 3,
    category: "Legal",
    required: true,
    pdfUrl: "/documents/general-service-agreement.pdf",
  },
  {
    id: "parts-policy-agreement",
    title: "Parts Policy Agreement",
    description:
      "Terms for parts sourcing, warranties, returns, and customer authorization.",
    pages: 2,
    category: "Legal",
    required: true,
    pdfUrl: "/documents/parts-policy-agreement.pdf",
  },
];
