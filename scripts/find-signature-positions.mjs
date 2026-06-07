import fs from "fs";
import { getDocument } from "pdfjs-dist/legacy/build/pdf.mjs";

const base = "e:/fivem devs/[matts mobile mechanic]/website/docs-signing/public/documents/";

for (const file of ["general-service-agreement.pdf", "parts-policy-agreement.pdf"]) {
  const data = new Uint8Array(fs.readFileSync(base + file));
  const pdf = await getDocument({ data }).promise;
  console.log("\n===", file, "pages:", pdf.numPages, "===");

  for (let p = 1; p <= pdf.numPages; p++) {
    const page = await pdf.getPage(p);
    const viewport = page.getViewport({ scale: 1 });
    const content = await page.getTextContent();
    console.log(`Page ${p}: ${viewport.width}x${viewport.height}`);

    for (const item of content.items) {
      const text = item.str?.trim();
      if (!text) continue;
      if (
        /customer signature|printed name|^date:|mathew walls|authorized representative|mawalls/i.test(
          text
        )
      ) {
        const [, , , , x, y] = item.transform;
        console.log(JSON.stringify({ text, x: x.toFixed(1), y: y.toFixed(1) }));
      }
    }
  }
}
