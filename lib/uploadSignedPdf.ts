import { pdfBytesToBlob } from "./pdfBytesToBlob";

export async function uploadPdfToConvex(
  generateUploadUrl: () => Promise<string>,
  pdfBytes: Uint8Array
): Promise<string> {
  const uploadUrl = await generateUploadUrl();
  const blob = pdfBytesToBlob(pdfBytes);

  const response = await fetch(uploadUrl, {
    method: "POST",
    headers: { "Content-Type": "application/pdf" },
    body: blob,
  });

  if (!response.ok) {
    throw new Error(`PDF upload failed (${response.status})`);
  }

  const { storageId } = (await response.json()) as { storageId: string };
  return storageId;
}
