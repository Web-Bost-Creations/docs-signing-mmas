/**
 * Run this once to find the Y coordinate of the signature line in your PDFs:
 *
 *   node scripts/measure-pdf.js public/documents/general-service-agreement.pdf
 *
 * It prints page sizes and all horizontal lines found, so you can see
 * exactly where the "Customer Signature" line sits. Use that Y value as
 * BASELINE_Y in lib/embedSignature.ts.
 */

const { PDFDocument } = require("pdf-lib");
const fs = require("fs");

async function main() {
  const file = process.argv[2];
  if (!file) {
    console.error("Usage: node scripts/measure-pdf.js <path-to.pdf>");
    process.exit(1);
  }

  const bytes = fs.readFileSync(file);
  const pdfDoc = await PDFDocument.load(bytes);
  const pages = pdfDoc.getPages();

  pages.forEach((page, i) => {
    const { width, height } = page.getSize();
    console.log(`\nPage ${i + 1}: ${width.toFixed(1)} x ${height.toFixed(1)} pt`);
    console.log(`  (${(width / 72).toFixed(2)}" x ${(height / 72).toFixed(2)}")`);

    // Print the page's content stream operators that draw lines
    // We look for 'm' (moveto) and 'l' (lineto) operators near horizontal lines
    const ops = page.node.Contents();
    if (ops) {
      const raw = Buffer.from(ops.asUint8Array()).toString("latin1");
      // Match patterns like: x1 y1 m  x2 y2 l  — horizontal lines (same Y)
      const lineRe = /([\d.]+)\s+([\d.]+)\s+m\s+([\d.]+)\s+([\d.]+)\s+l/g;
      let m;
      const horizontal = [];
      while ((m = lineRe.exec(raw)) !== null) {
        const [, x1, y1, , y2] = m;
        if (Math.abs(parseFloat(y1) - parseFloat(y2)) < 2) {
          horizontal.push(parseFloat(y1).toFixed(1));
        }
      }
      if (horizontal.length) {
        const unique = [...new Set(horizontal)].sort((a, b) => b - a);
        console.log(`  Horizontal lines at Y (from bottom): ${unique.join(", ")}`);
      } else {
        console.log("  No horizontal lines detected in content stream.");
        console.log("  Try visually measuring: page height is " + height.toFixed(1) + "pt");
        console.log("  If signature line is ~1/4 from bottom: ~" + (height * 0.25).toFixed(0) + "pt");
      }
    }
  });
}

main().catch(console.error);
