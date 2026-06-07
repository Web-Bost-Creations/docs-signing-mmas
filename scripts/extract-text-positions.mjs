import fs from "fs";
import { getDocument } from "pdfjs-dist/legacy/build/pdf.mjs";

const pdfPath =
  "e:/fivem devs/[matts mobile mechanic]/website/docs-signing/public/documents/general-service-agreement.pdf";
const data = new Uint8Array(fs.readFileSync(pdfPath));
const doc = await getDocument({ data, useSystemFonts: true }).promise;

for (let i = 1; i <= doc.numPages; i++) {
  const page = await doc.getPage(i);
  const viewport = page.getViewport({ scale: 1 });
  console.log(`\nPage ${i}: ${viewport.width} x ${viewport.height}`);
  const content = await page.getTextContent();
  for (const item of content.items) {
    const str = item.str?.trim();
    if (!str) continue;
    if (/Customer|Printed|Date|Mathew|Signature|Representative/i.test(str)) {
      console.log({
        str,
        x: Math.round(item.transform[4]),
        y: Math.round(item.transform[5]),
      });
    }
  }
}
