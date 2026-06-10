import { PDFDocument, StandardFonts, rgb } from "pdf-lib";
import { SignaturePlacement } from "./signaturePlacements";

type EmbedOptions = {
  pdfUrl: string;
  signatureDataUrl: string;
  signerName: string;
  signedAt: string;
  placement: SignaturePlacement;
  copyLabel?: string;
};

function parseFormDate(iso: string) {
  const d = new Date(iso);
  return {
    month: String(d.getMonth() + 1).padStart(2, "0"),
    day: String(d.getDate()).padStart(2, "0"),
    year: String(d.getFullYear()).slice(-2),
  };
}

export async function embedSignatureInPdf({
  pdfUrl,
  signatureDataUrl,
  signerName,
  signedAt,
  placement,
  copyLabel,
}: EmbedOptions): Promise<Uint8Array> {
  const response = await fetch(pdfUrl);
  if (!response.ok) throw new Error(`Could not load PDF (${response.status})`);

  const pdfBytes = await response.arrayBuffer();
  const pdfDoc = await PDFDocument.load(pdfBytes);
  const pages = pdfDoc.getPages();
  const page = pages[placement.pageIndex] ?? pages[pages.length - 1];

  const font = await pdfDoc.embedFont(StandardFonts.Helvetica);
  const boldFont = await pdfDoc.embedFont(StandardFonts.HelveticaBold);

  const pngImage = await pdfDoc.embedPng(signatureDataUrl);
  const { x, y, width, maxHeight } = placement.signature;
  let sigHeight = (pngImage.height / pngImage.width) * width;
  if (sigHeight > maxHeight) sigHeight = maxHeight;

  page.drawImage(pngImage, {
    x,
    y,
    width,
    height: sigHeight,
  });

  if (placement.printedName) {
    page.drawText(signerName, {
      x: placement.printedName.x,
      y: placement.printedName.y,
      size: placement.printedName.size,
      font,
      color: rgb(0.1, 0.1, 0.1),
    });
  }

  const { month, day, year } = parseFormDate(signedAt);
  const textColor = rgb(0.1, 0.1, 0.1);

  if (placement.dateSingle) {
    page.drawText(`${month}/${day}/${year}`, {
      x: placement.dateSingle.x,
      y: placement.dateSingle.y,
      size: placement.dateSingle.size,
      font,
      color: textColor,
    });
  } else if (placement.date) {
    page.drawText(month, {
      x: placement.date.month.x,
      y: placement.date.month.y,
      size: placement.date.month.size,
      font,
      color: textColor,
    });

    page.drawText(day, {
      x: placement.date.day.x,
      y: placement.date.day.y,
      size: placement.date.day.size,
      font,
      color: textColor,
    });

    page.drawText(year, {
      x: placement.date.year.x,
      y: placement.date.year.y,
      size: placement.date.year.size,
      font,
      color: textColor,
    });
  }

  if (copyLabel) {
    for (const p of pages) {
      const { width: pw, height: ph } = p.getSize();
      const bandH = 22;
      const bandY = ph - bandH;

      p.drawRectangle({
        x: 0,
        y: bandY,
        width: pw,
        height: bandH,
        color: rgb(0.13, 0.22, 0.47),
        opacity: 0.9,
      });

      const fontSize = 9;
      const textWidth = boldFont.widthOfTextAtSize(copyLabel, fontSize);
      p.drawText(copyLabel, {
        x: (pw - textWidth) / 2,
        y: bandY + 7,
        size: fontSize,
        font: boldFont,
        color: rgb(1, 1, 1),
      });
    }
  }

  return pdfDoc.save();
}
