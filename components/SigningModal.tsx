"use client";

import { useRef, useState, useEffect } from "react";
import { Document, SignedDoc } from "@/lib/documents";
import { PdfViewer } from "@/components/PdfViewer";
import { embedSignatureInPdf } from "@/lib/embedSignature";
import { SIGNATURE_PLACEMENTS } from "@/lib/signaturePlacements";
import { exportSignatureFromCanvas } from "@/lib/trimSignatureCanvas";
import { pdfBytesToBlob } from "@/lib/pdfBytesToBlob";
import { X, RotateCcw, Check, PenLine, Loader2 } from "lucide-react";

type SignResult = Omit<SignedDoc, "docId">;

type Props = {
  document: Document;
  clientName: string;
  onComplete: (result: SignResult) => void;
  onClose: () => void;
};

// Canvas dimensions (logical pixels — scaled to display width)
const CANVAS_W = 600;
const CANVAS_H = 140;
// The baseline sits 28px from the bottom of the canvas
const BASELINE_Y = CANVAS_H - 28;

export function SigningModal({ document: doc, clientName, onComplete, onClose }: Props) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [hasSignature, setHasSignature] = useState(false);
  const [agreed, setAgreed] = useState(false);
  const [processing, setProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const lastPos = useRef<{ x: number; y: number } | null>(null);

  useEffect(() => {
    window.document.body.style.overflow = "hidden";
    return () => {
      window.document.body.style.overflow = "";
    };
  }, []);

  const getPos = (e: React.MouseEvent | React.TouchEvent, canvas: HTMLCanvasElement) => {
    const rect = canvas.getBoundingClientRect();
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;
    if ("touches" in e) {
      const touch = e.touches[0];
      return {
        x: (touch.clientX - rect.left) * scaleX,
        y: (touch.clientY - rect.top) * scaleY,
      };
    }
    return {
      x: (e.clientX - rect.left) * scaleX,
      y: (e.clientY - rect.top) * scaleY,
    };
  };

  const startDrawing = (e: React.MouseEvent | React.TouchEvent) => {
    e.preventDefault();
    const canvas = canvasRef.current;
    if (!canvas) return;
    setIsDrawing(true);
    setHasSignature(true);
    lastPos.current = getPos(e, canvas);
  };

  const draw = (e: React.MouseEvent | React.TouchEvent) => {
    e.preventDefault();
    if (!isDrawing) return;
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext("2d");
    if (!canvas || !ctx || !lastPos.current) return;

    const pos = getPos(e, canvas);

    // Clamp Y so strokes don't go below the baseline
    const clampedY = Math.min(pos.y, BASELINE_Y);
    const clampedLastY = Math.min(lastPos.current.y, BASELINE_Y);

    ctx.beginPath();
    ctx.moveTo(lastPos.current.x, clampedLastY);
    ctx.lineTo(pos.x, clampedY);
    ctx.strokeStyle = "#2563eb";
    ctx.lineWidth = 2.5;
    ctx.lineCap = "round";
    ctx.lineJoin = "round";
    ctx.stroke();

    lastPos.current = { x: pos.x, y: clampedY };
  };

  const stopDrawing = () => {
    setIsDrawing(false);
    lastPos.current = null;
  };

  const clearCanvas = () => {
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext("2d");
    if (!canvas || !ctx) return;
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    setHasSignature(false);
  };

  const handleConfirm = async () => {
    const canvas = canvasRef.current;
    if (!canvas || !hasSignature || !agreed || processing) return;

    const signatureDataUrl = exportSignatureFromCanvas(canvas);
    const signedAt = new Date().toISOString();

    setProcessing(true);
    setError(null);

    try {
      const placement = SIGNATURE_PLACEMENTS[doc.id];
      if (!placement) {
        throw new Error(`No signature placement configured for ${doc.id}`);
      }

      const shared = {
        pdfUrl: doc.pdfUrl,
        signatureDataUrl,
        signerName: clientName,
        signedAt,
        placement,
      };

      // Generate both copies in parallel
      const [customerPdfBytes, businessPdfBytes] = await Promise.all([
        embedSignatureInPdf({ ...shared, copyLabel: "Customer Copy" }),
        embedSignatureInPdf({ ...shared, copyLabel: "Matt's Mobile Automotive Repair Services Copy" }),
      ]);

      const toBlob = (bytes: Uint8Array) =>
        URL.createObjectURL(pdfBytesToBlob(bytes));

      const customerPdfBlobUrl = toBlob(customerPdfBytes);
      const businessPdfBlobUrl = toBlob(businessPdfBytes);

      onComplete({
        signature: signatureDataUrl,
        signedAt,
        customerPdfBytes,
        customerPdfBlobUrl,
        businessPdfBytes,
        businessPdfBlobUrl,
        // backward-compat aliases
        signedPdfBytes: customerPdfBytes,
        signedPdfBlobUrl: customerPdfBlobUrl,
      });
    } catch (err) {
      console.error(err);
      setError(
        "Could not embed your signature into the PDF. Make sure the document file is available."
      );
    } finally {
      setProcessing(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-end md:items-center justify-center p-4"
      style={{ background: "rgba(0,0,0,0.75)", backdropFilter: "blur(8px)" }}
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <div
        className="w-full max-w-2xl rounded-2xl overflow-hidden animate-fade-up max-h-[90vh] flex flex-col"
        style={{
          background: "var(--surface)",
          border: "1px solid var(--border-light)",
          boxShadow: "0 25px 80px rgba(0,0,0,0.6)",
        }}
      >
        {/* Modal header */}
        <div
          className="flex items-center justify-between px-6 py-4 border-b"
          style={{ borderColor: "var(--border)" }}
        >
          <div className="flex items-center gap-3">
            <div
              className="w-8 h-8 rounded-lg flex items-center justify-center"
              style={{ background: "rgba(37, 99, 235, 0.12)" }}
            >
              <PenLine className="w-4 h-4" style={{ color: "var(--accent)" }} />
            </div>
            <div>
              <p className="text-sm font-medium" style={{ color: "var(--text-primary)" }}>
                {doc.title}
              </p>
              <p className="text-xs" style={{ color: "var(--text-muted)" }}>
                Signing as {clientName}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-lg transition-all"
            style={{ color: "var(--text-muted)" }}
            onMouseEnter={(e) => {
              (e.currentTarget as HTMLElement).style.background = "var(--surface-2)";
              (e.currentTarget as HTMLElement).style.color = "var(--text-secondary)";
            }}
            onMouseLeave={(e) => {
              (e.currentTarget as HTMLElement).style.background = "transparent";
              (e.currentTarget as HTMLElement).style.color = "var(--text-muted)";
            }}
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* PDF preview */}
        <div className="px-6 pb-4 overflow-y-auto flex-1">
          <PdfViewer url={doc.pdfUrl} title={doc.title} className="min-h-[280px]" />
        </div>

        {/* Signature area */}
        <div className="px-6 pt-2 pb-4">
          <div className="flex items-center justify-between mb-3">
            <p className="text-xs font-medium uppercase tracking-widest" style={{ color: "var(--text-muted)" }}>
              Draw your signature
            </p>
            <button
              onClick={clearCanvas}
              className="flex items-center gap-1.5 text-xs px-2.5 py-1.5 rounded-lg transition-all"
              style={{ color: "var(--text-muted)", background: "var(--surface-2)" }}
              onMouseEnter={(e) => {
                (e.currentTarget as HTMLElement).style.color = "var(--text-secondary)";
              }}
              onMouseLeave={(e) => {
                (e.currentTarget as HTMLElement).style.color = "var(--text-muted)";
              }}
            >
              <RotateCcw className="w-3 h-3" />
              Clear
            </button>
          </div>

          {/* Canvas wrapper — baseline label outside canvas bottom */}
          <div
            className="relative rounded-xl overflow-hidden"
            style={{
              background: "var(--surface-2)",
              border: "1px solid var(--border)",
            }}
          >
            {!hasSignature && (
              <div
                className="absolute pointer-events-none select-none"
                style={{
                  // Position hint text just above the baseline
                  left: "50%",
                  transform: "translateX(-50%)",
                  // CANVAS_H=140, BASELINE_Y=112 → hint sits ~30px above baseline
                  // Canvas renders at CSS height 140px
                  bottom: `calc(28px + 22px)`,
                  color: "var(--text-muted)",
                }}
              >
                <p className="text-sm font-heading italic whitespace-nowrap">Sign above the line…</p>
              </div>
            )}

            <canvas
              ref={canvasRef}
              width={CANVAS_W}
              height={CANVAS_H}
              className="sig-canvas w-full block"
              style={{ height: `${CANVAS_H}px` }}
              onMouseDown={startDrawing}
              onMouseMove={draw}
              onMouseUp={stopDrawing}
              onMouseLeave={stopDrawing}
              onTouchStart={startDrawing}
              onTouchMove={draw}
              onTouchEnd={stopDrawing}
            />

            {/* Baseline guide — HTML overlay so it is not baked into the exported PNG */}
            <div
              className="absolute pointer-events-none"
              style={{ left: 24, right: 24, top: BASELINE_Y }}
            >
              <div
                style={{
                  borderTop: "1px dashed rgba(148, 163, 184, 0.55)",
                }}
              />
              <span
                className="absolute -left-1 -top-3 text-xs"
                style={{ color: "rgba(148, 163, 184, 0.55)" }}
              >
                ✕
              </span>
            </div>

            {/* "Signature" label below the baseline, inside the canvas bottom strip */}
            <div
              className="absolute bottom-0 left-0 right-0 flex items-center px-6"
              style={{
                height: "28px",
                pointerEvents: "none",
              }}
            >
              <span
                className="text-xs font-mono"
                style={{ color: "rgba(148,163,184,0.5)", letterSpacing: "0.08em" }}
              >
                Signature
              </span>
              <div className="flex-1 mx-3" style={{ height: "1px", background: "rgba(148,163,184,0.2)" }} />
              <span
                className="text-xs font-mono"
                style={{ color: "rgba(148,163,184,0.5)" }}
              >
                {new Date().toLocaleDateString("en-US", {
                  month: "short",
                  day: "numeric",
                  year: "numeric",
                })}
              </span>
            </div>
          </div>
        </div>

        {/* Agreement checkbox */}
        <div className="px-6 pb-5">
          <label
            className="flex items-start gap-3 cursor-pointer group"
            onClick={() => setAgreed((p) => !p)}
          >
            <div
              className="mt-0.5 w-4 h-4 rounded flex items-center justify-center flex-shrink-0 transition-all"
              style={{
                background: agreed ? "var(--accent)" : "var(--surface-2)",
                border: `1.5px solid ${agreed ? "var(--accent)" : "var(--border-light)"}`,
              }}
            >
              {agreed && <Check className="w-2.5 h-2.5 text-black" />}
            </div>
            <p className="text-xs leading-relaxed" style={{ color: "var(--text-secondary)" }}>
              I agree that this digital signature represents my legal signature for{" "}
              <span style={{ color: "var(--text-primary)", fontWeight: 500 }}>
                {doc.title}
              </span>{" "}
              and I consent to the terms outlined therein.
            </p>
          </label>
        </div>

        {/* Confirm button */}
        <div
          className="px-6 py-4 border-t"
          style={{ borderColor: "var(--border)" }}
        >
          {error && (
            <p className="text-xs mb-3" style={{ color: "var(--danger)" }}>
              {error}
            </p>
          )}
          <button
            onClick={handleConfirm}
            disabled={!hasSignature || !agreed || processing}
            className="w-full flex items-center justify-center gap-2 py-3.5 rounded-xl font-medium text-sm transition-all"
            style={{
              background: hasSignature && agreed && !processing ? "var(--accent)" : "var(--surface-2)",
              color: hasSignature && agreed && !processing ? "var(--accent-foreground)" : "var(--text-muted)",
              opacity: hasSignature && agreed && !processing ? 1 : 0.5,
              cursor: hasSignature && agreed && !processing ? "pointer" : "not-allowed",
            }}
            onMouseEnter={(e) => {
              if (!hasSignature || !agreed || processing) return;
              (e.currentTarget as HTMLElement).style.boxShadow =
                "0 4px 20px rgba(37, 99, 235, 0.35)";
            }}
            onMouseLeave={(e) => {
              (e.currentTarget as HTMLElement).style.boxShadow = "none";
            }}
          >
            {processing ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <Check className="w-4 h-4" />
            )}
            {processing ? "Applying signature…" : "Confirm Signature"}
          </button>
        </div>
      </div>
    </div>
  );
}
