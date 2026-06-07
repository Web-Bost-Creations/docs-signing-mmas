import fs from "fs";
import { PDFDocument, rgb } from "pdf-lib";

const base = "e:/fivem devs/[matts mobile mechanic]/website/docs-signing/public/documents/";
const file = "general-service-agreement.pdf";
const bytes = fs.readFileSync(base + file);
const doc = await PDFDocument.load(bytes);
const page = doc.getPages()[1];
const { width, height } = page.getSize();

// Candidate positions for customer signature line (right column)
const candidates = [
  { x: 300, y: 175, label: "A" },
  { x: 310, y: 175, label: "B" },
  { x: 300, y: 185, label: "C" },
  { x: 310, y: 185, label: "D" },
  { x: 302, y: 178, label: "E" },
  { x: 305, y: 170, label: "F" },
  { x: 300, y: 165, label: "G" },
  { x: 320, y: 175, label: "H" },
];

for (const c of candidates) {
  page.drawLine({
    start: { x: c.x, y: c.y },
    end: { x: c.x + 120, y: c.y },
    thickness: 1,
    color: rgb(1, 0, 0),
  });
  page.drawText(c.label, { x: c.x, y: c.y + 4, size: 8, color: rgb(1, 0, 0) });
}

page.drawText(`page ${width}x${height}`, { x: 40, y: 40, size: 10, color: rgb(0, 0, 1) });

const out = await doc.save();
fs.writeFileSync(base + "calibration-test.pdf", out);
console.log("Wrote calibration-test.pdf");
