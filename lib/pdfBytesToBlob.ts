/** Normalize Uint8Array for Blob constructor (TS strict ArrayBuffer typing). */
export function pdfBytesToBlob(bytes: Uint8Array): Blob {
  return new Blob([new Uint8Array(bytes)], { type: "application/pdf" });
}
