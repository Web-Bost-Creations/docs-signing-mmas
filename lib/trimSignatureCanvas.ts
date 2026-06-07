/** Export only the signature ink — no transparent padding below strokes. */
export function exportSignatureFromCanvas(canvas: HTMLCanvasElement): string {
  const ctx = canvas.getContext("2d");
  if (!ctx) return canvas.toDataURL("image/png");

  const { width, height } = canvas;
  const { data } = ctx.getImageData(0, 0, width, height);

  let minX = width;
  let maxX = 0;
  let minY = height;
  let maxY = 0;

  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const i = (y * width + x) * 4;
      const alpha = data[i + 3];
      const r = data[i];
      const g = data[i + 1];
      const b = data[i + 2];

      const isSignatureInk = alpha > 30 && b > 120 && r < 80;
      if (!isSignatureInk) continue;

      minX = Math.min(minX, x);
      maxX = Math.max(maxX, x);
      minY = Math.min(minY, y);
      maxY = Math.max(maxY, y);
    }
  }

  if (minX > maxX) return canvas.toDataURL("image/png");

  const padX = 4;
  const padY = 2;
  const cropX = Math.max(0, minX - padX);
  const cropY = Math.max(0, minY - padY);
  const cropW = Math.min(width - cropX, maxX - minX + padX * 2);
  const cropH = Math.min(height - cropY, maxY - minY + padY * 2);

  const out = document.createElement("canvas");
  out.width = cropW;
  out.height = cropH;
  const outCtx = out.getContext("2d");
  if (!outCtx) return canvas.toDataURL("image/png");

  outCtx.drawImage(canvas, cropX, cropY, cropW, cropH, 0, 0, cropW, cropH);
  return out.toDataURL("image/png");
}
