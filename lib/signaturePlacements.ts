/** PDF coordinates (points, bottom-left origin) measured from template files. */
export type SignaturePlacement = {
  pageIndex: number;
  /** y = bottom of signature image, aligned to the printed signature line */
  signature: { x: number; y: number; width: number; maxHeight: number };
  printedName: { x: number; y: number; size: number };
  date: {
    month: { x: number; y: number; size: number };
    day: { x: number; y: number; size: number };
    year: { x: number; y: number; size: number };
  };
};

export const SIGNATURE_PLACEMENTS: Record<string, SignaturePlacement> = {
  "general-service-agreement": {
    pageIndex: 1,
    // Line just above the "Customer Signature" label (y=341.6)
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
};
