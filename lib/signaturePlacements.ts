/** PDF coordinates (points, bottom-left origin) measured from template files. */
export type SignaturePlacement = {
  pageIndex: number;
  signature: { x: number; y: number; width: number; maxHeight: number };
  /** Omit when the PDF already shows the customer name elsewhere. */
  printedName?: { x: number; y: number; size: number };
  /** Single formatted date (MM/DD/YY) — used on invoice-style PDFs. */
  dateSingle?: { x: number; y: number; size: number };
  /** Split month / day / year fields — used on agreement templates. */
  date?: {
    month: { x: number; y: number; size: number };
    day: { x: number; y: number; size: number };
    year: { x: number; y: number; size: number };
  };
};

export const SIGNATURE_PLACEMENTS: Record<string, SignaturePlacement> = {
  "general-service-agreement": {
    pageIndex: 1,
    signature: { x: 298, y: 352, width: 220, maxHeight: 48 },
    printedName: { x: 364, y: 327.5, size: 10 },
    date: {
      month: { x: 324, y: 314.6, size: 10 },
      day: { x: 377, y: 314.6, size: 10 },
      year: { x: 448, y: 314.6, size: 10 },
    },
  },
  "parts-policy-agreement": {
    pageIndex: 1,
    signature: { x: 298, y: 542, width: 220, maxHeight: 48 },
    printedName: { x: 364, y: 517.5, size: 10 },
    date: {
      month: { x: 324, y: 504.6, size: 10 },
      day: { x: 377, y: 504.6, size: 10 },
      year: { x: 448, y: 504.6, size: 10 },
    },
  },
  /** Matt's service invoice / estimate PDFs — signature + date at page bottom. */
  "custom-invoice": {
    pageIndex: 0,
    signature: { x: 52, y: 210, width: 195, maxHeight: 30 },
    dateSingle: { x: 410, y: 210, size: 10 },
  },
};

export const DEFAULT_SIGNATURE_PLACEMENT =
  SIGNATURE_PLACEMENTS["general-service-agreement"];

export function getSignaturePlacement(doc: {
  id: string;
  signaturePlacementKey?: string;
}) {
  const key =
    doc.signaturePlacementKey ??
    (doc.id.startsWith("custom-") ? "custom-invoice" : doc.id);
  return SIGNATURE_PLACEMENTS[key] ?? DEFAULT_SIGNATURE_PLACEMENT;
}
