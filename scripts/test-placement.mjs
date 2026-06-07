import fs from "fs";
import { PDFDocument, StandardFonts, rgb } from "pdf-lib";
import { SIGNATURE_PLACEMENTS } from "../lib/signaturePlacements.ts";

// Minimal 1x1 blue PNG
const PNG = Buffer.from(
  "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==",
  "base64"
);

const base = "e:/fivem devs/[matts mobile mechanic]/website/docs-signing/public/documents/";

for (const [id, placement] of Object.entries(SIGNATURE_PLACEMENTS)) {
  const file = id === "general-service-agreement"
    ? "general-service-agreement.pdf"
    : "parts-policy-agreement.pdf";

  const pdfDoc = await PDFDocument.load(fs.readFileSync(base + file));
  const page = pdfDoc.getPages()[placement.pageIndex];
  const font = await pdfDoc.embedFont(StandardFonts.Helvetica);
  const png = await pdfDoc.embedPng(PNG);

  const { x, y, width, maxHeight } = placement.signature;
  page.drawImage(png, { x, y, width, height: maxHeight });
  page.drawText("Test Customer", {
    x: placement.printedName.x,
    y: placement.printedName.y,
    size: placement.printedName.size,
    font,
    color: rgb(0, 0, 1),
  });
  page.drawText("06 / 06 / 2026", {
    x: placement.date.x,
    y: placement.date.y,
    size: placement.date.size,
    font,
    color: rgb(0, 0, 1),
  });

  const out = await pdfDoc.save();
  fs.writeFileSync(base + `test-${id}.pdf`, out);
  console.log("Wrote test-", id);
}
