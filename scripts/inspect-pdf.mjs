import fs from "fs";
import { PDFDocument } from "pdf-lib";

const base = new URL("../public/documents/", import.meta.url);

for (const f of ["general-service-agreement.pdf", "parts-policy-agreement.pdf"]) {
  const bytes = fs.readFileSync(new URL(f, base));
  const doc = await PDFDocument.load(bytes);
  const form = doc.getForm();
  const fields = form.getFields();
  console.log("\n===", f, "===");
  console.log("pages:", doc.getPageCount());
  console.log("fields:", fields.length);
  for (const field of fields) {
    console.log(" -", field.getName(), field.constructor.name);
  }
  const last = doc.getPages()[doc.getPageCount() - 1];
  const { width, height } = last.getSize();
  console.log("last page:", width, "x", height);
}
