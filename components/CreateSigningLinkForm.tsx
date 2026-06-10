"use client";

import { useEffect, useState, type CSSProperties, type FocusEvent, type ComponentType } from "react";
import Link from "next/link";
import { useMutation, useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Id } from "@/convex/_generated/dataModel";
import { DOCUMENTS } from "@/lib/documents";
import { uploadPdfToConvex } from "@/lib/uploadSignedPdf";
import { BrandHeader } from "@/components/BrandHeader";
import { PageShell } from "@/components/PageShell";
import { clsx } from "clsx";
import {
  ArrowLeft,
  Building2,
  Check,
  CheckCircle2,
  Copy,
  FileText,
  KeyRound,
  Link2,
  Loader2,
  Mail,
  Plus,
  StickyNote,
  Trash2,
  Upload,
  User,
} from "lucide-react";

const ADMIN_SECRET_KEY = "docsign-admin-secret";

type CustomUpload = {
  title: string;
  file?: File;
};

function inputStyle(hasError = false): CSSProperties {
  return {
    background: "var(--surface-2)",
    border: `1px solid ${hasError ? "var(--danger)" : "var(--border)"}`,
    color: "var(--text-primary)",
  };
}

function focusInput(e: FocusEvent<HTMLInputElement>) {
  e.target.style.borderColor = "var(--accent)";
  e.target.style.boxShadow = "0 0 0 3px rgba(37, 99, 235, 0.12)";
}

function blurInput(e: FocusEvent<HTMLInputElement>) {
  e.target.style.borderColor = "var(--border)";
  e.target.style.boxShadow = "none";
}

function SectionCard({
  icon: Icon,
  title,
  description,
  children,
  action,
  delay = "0.1s",
}: {
  icon: ComponentType<{ className?: string; style?: CSSProperties }>;
  title: string;
  description?: string;
  children: React.ReactNode;
  action?: React.ReactNode;
  delay?: string;
}) {
  return (
    <section
      className="rounded-2xl p-6 md:p-7 animate-fade-up"
      style={{
        background: "var(--surface)",
        border: "1px solid var(--border)",
        animationDelay: delay,
        opacity: 0,
      }}
    >
      <div className="flex items-start justify-between gap-4 mb-5">
        <div className="flex items-start gap-3">
          <div
            className="flex items-center justify-center w-10 h-10 rounded-xl flex-shrink-0"
            style={{
              background: "rgba(37, 99, 235, 0.12)",
              border: "1px solid rgba(37, 99, 235, 0.2)",
            }}
          >
            <Icon className="w-5 h-5" style={{ color: "var(--accent)" }} />
          </div>
          <div>
            <h2 className="font-heading font-semibold text-lg" style={{ color: "var(--text-primary)" }}>
              {title}
            </h2>
            {description && (
              <p className="text-sm mt-0.5" style={{ color: "var(--text-muted)" }}>
                {description}
              </p>
            )}
          </div>
        </div>
        {action}
      </div>
      {children}
    </section>
  );
}

export function CreateSigningLinkForm() {
  const [adminSecret, setAdminSecret] = useState("");
  const [unlocked, setUnlocked] = useState(false);
  const [clientName, setClientName] = useState("");
  const [clientEmail, setClientEmail] = useState("");
  const [clientCompany, setClientCompany] = useState("");
  const [note, setNote] = useState("");
  const [selectedCatalog, setSelectedCatalog] = useState<Set<string>>(new Set());
  const [customUploads, setCustomUploads] = useState<CustomUpload[]>([]);
  const [creating, setCreating] = useState(false);
  const [unlocking, setUnlocking] = useState(false);
  const [createdUrl, setCreatedUrl] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const createSigningLink = useMutation(api.signingLinks.createSigningLink);
  const verifyAdminSecret = useMutation(api.signingLinks.verifyAdminSecret);
  const generateUploadUrl = useMutation(api.files.generateUploadUrl);
  const links = useQuery(
    api.signingLinks.listSigningLinks,
    unlocked ? { adminSecret } : "skip"
  );

  const unlock = async () => {
    if (!adminSecret.trim()) {
      setError("Enter your admin secret.");
      return;
    }

    setUnlocking(true);
    setError(null);

    try {
      await verifyAdminSecret({ adminSecret: adminSecret.trim() });
      sessionStorage.setItem(ADMIN_SECRET_KEY, adminSecret.trim());
      setUnlocked(true);
    } catch (err) {
      sessionStorage.removeItem(ADMIN_SECRET_KEY);
      setError(err instanceof Error ? err.message : "Could not unlock admin panel");
    } finally {
      setUnlocking(false);
    }
  };

  useEffect(() => {
    const stored = sessionStorage.getItem(ADMIN_SECRET_KEY);
    if (!stored) return;

    setAdminSecret(stored);
    verifyAdminSecret({ adminSecret: stored })
      .then(() => setUnlocked(true))
      .catch(() => sessionStorage.removeItem(ADMIN_SECRET_KEY));
  }, [verifyAdminSecret]);

  const toggleCatalog = (id: string) => {
    setSelectedCatalog((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const addCustomSlot = () => {
    setCustomUploads((prev) => [...prev, { title: "" }]);
  };

  const titleFromFile = (file: File) =>
    file.name.replace(/\.pdf$/i, "").replace(/[-_]+/g, " ").trim();

  const handleCreate = async () => {
    if (!clientName.trim() || !clientEmail.trim()) {
      setError("Client name and email are required.");
      return;
    }

    const customWithFile = customUploads.filter((u) => u.file);
    const customMissingTitle = customWithFile.some((u) => !u.title.trim());
    if (customMissingTitle) {
      setError("Each custom PDF needs a title.");
      return;
    }

    if (selectedCatalog.size === 0 && customWithFile.length === 0) {
      setError("Upload a custom PDF or select at least one standard document.");
      return;
    }

    setCreating(true);
    setError(null);
    setCreatedUrl(null);

    try {
      const documents: Array<{
        id: string;
        title: string;
        description: string;
        pages: number;
        category: string;
        required: boolean;
        pdfUrl?: string;
        pdfStorageId?: Id<"_storage">;
        signaturePlacementKey?: string;
      }> = [
        ...DOCUMENTS.filter((d) => selectedCatalog.has(d.id)).map((d) => ({
          id: d.id,
          title: d.title,
          description: d.description,
          pages: d.pages,
          category: d.category,
          required: true,
          pdfUrl: d.pdfUrl,
          signaturePlacementKey: d.id,
        })),
      ];

      for (let i = 0; i < customUploads.length; i++) {
        const upload = customUploads[i];
        if (!upload.file) continue;

        const title = upload.title.trim() || titleFromFile(upload.file);
        const bytes = new Uint8Array(await upload.file.arrayBuffer());
        const storageId = await uploadPdfToConvex(
          () => generateUploadUrl(),
          bytes
        );

        documents.push({
          id: `custom-${Date.now()}-${i}`,
          title,
          description: "Custom document for this client",
          pages: 1,
          category: "Custom",
          required: true,
          pdfStorageId: storageId as Id<"_storage">,
          signaturePlacementKey: "custom-invoice",
        });
      }

      if (documents.length === 0) {
        throw new Error("No documents were added. Upload a PDF or select a standard document.");
      }

      const { token } = await createSigningLink({
        adminSecret,
        clientName: clientName.trim(),
        clientEmail: clientEmail.trim(),
        clientCompany: clientCompany.trim() || undefined,
        note: note.trim() || undefined,
        documents,
      });

      const url = `${window.location.origin}/sign/${token}`;
      setCreatedUrl(url);
      setCustomUploads([]);
      setSelectedCatalog(new Set());
    } catch (err) {
      console.error(err);
      setError(err instanceof Error ? err.message : "Failed to create link");
    } finally {
      setCreating(false);
    }
  };

  const copyUrl = async (url: string) => {
    await navigator.clipboard.writeText(url);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const clientFields = [
    { label: "Full name", value: clientName, setValue: setClientName, icon: User, placeholder: "Jane Smith" },
    { label: "Email", value: clientEmail, setValue: setClientEmail, icon: Mail, type: "email", placeholder: "jane@example.com" },
    { label: "Company (optional)", value: clientCompany, setValue: setClientCompany, icon: Building2, placeholder: "Acme Inc." },
    { label: "Internal note (optional)", value: note, setValue: setNote, icon: StickyNote, placeholder: "Fleet account, rush job, etc." },
  ];

  if (!unlocked) {
    return (
      <PageShell>
        <Link
          href="/"
          className="inline-flex items-center gap-1.5 text-xs mb-8 animate-fade-up"
          style={{ color: "var(--text-muted)" }}
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          Back to client portal
        </Link>

        <BrandHeader
          subtitle="Admin"
          title="Create a client signing link"
          description="Enter your admin secret to build private links with specific PDFs for each client."
        />

        <div
          className="max-w-md mx-auto rounded-2xl p-8 animate-fade-up"
          style={{
            background: "var(--surface)",
            border: "1px solid var(--border)",
            boxShadow: "0 24px 48px rgba(0, 0, 0, 0.35)",
            animationDelay: "0.15s",
            opacity: 0,
          }}
        >
          <div
            className="flex items-center justify-center w-14 h-14 rounded-2xl mx-auto mb-6"
            style={{
              background: "rgba(37, 99, 235, 0.12)",
              border: "1px solid rgba(37, 99, 235, 0.25)",
            }}
          >
            <KeyRound className="w-7 h-7" style={{ color: "var(--accent)" }} />
          </div>

          <h2
            className="font-heading text-xl font-bold text-center mb-2"
            style={{ color: "var(--text-primary)" }}
          >
            Admin access
          </h2>
          <p className="text-sm text-center mb-6" style={{ color: "var(--text-muted)" }}>
            This area is for Matt&apos;s Mobile Mechanic staff only.
          </p>

          <label className="block text-sm font-medium mb-2" style={{ color: "var(--text-secondary)" }}>
            Admin secret
          </label>
          <input
            type="password"
            value={adminSecret}
            onChange={(e) => setAdminSecret(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") void unlock();
            }}
            placeholder="Enter your secret key"
            className="w-full px-4 py-3.5 rounded-xl text-sm mb-5 outline-none transition-all"
            style={inputStyle()}
            onFocus={focusInput}
            onBlur={blurInput}
          />

          {error && (
            <p className="text-sm mb-4 text-center" style={{ color: "var(--danger)" }}>
              {error}
            </p>
          )}

          <button
            type="button"
            onClick={() => void unlock()}
            disabled={unlocking}
            className="w-full flex items-center justify-center gap-2 py-4 rounded-xl font-medium text-sm transition-all active:scale-[0.98] disabled:opacity-60"
            style={{ background: "var(--accent)", color: "var(--accent-foreground)" }}
            onMouseEnter={(e) => {
              if (unlocking) return;
              (e.currentTarget as HTMLElement).style.background = "var(--accent-hover)";
              (e.currentTarget as HTMLElement).style.boxShadow = "0 4px 20px rgba(37, 99, 235, 0.35)";
            }}
            onMouseLeave={(e) => {
              (e.currentTarget as HTMLElement).style.background = "var(--accent)";
              (e.currentTarget as HTMLElement).style.boxShadow = "none";
            }}
          >
            {unlocking ? <Loader2 className="w-4 h-4 animate-spin" /> : <KeyRound className="w-4 h-4" />}
            {unlocking ? "Checking…" : "Unlock admin panel"}
          </button>

          <div
            className="mt-6 p-4 rounded-xl text-xs leading-relaxed"
            style={{
              background: "var(--surface-2)",
              border: "1px solid var(--border)",
              color: "var(--text-muted)",
            }}
          >
            <p className="font-medium mb-2" style={{ color: "var(--text-secondary)" }}>
              First time? Create your admin key
            </p>
            <p className="mb-2">
              There is no default password — you choose one and save it in Convex:
            </p>
            <code
              className="block p-2 rounded-lg text-[11px] font-mono break-all"
              style={{ background: "var(--surface)", color: "var(--accent)" }}
            >
              npx convex env set ADMIN_SECRET your-password-here
            </code>
            <p className="mt-2">
              Use the same password on the form above. For production, run the same command with{" "}
              <code className="font-mono">--prod</code>.
            </p>
          </div>
        </div>
      </PageShell>
    );
  }

  return (
    <PageShell>
      <Link
        href="/"
        className="inline-flex items-center gap-1.5 text-xs mb-8 animate-fade-up"
        style={{ color: "var(--text-muted)" }}
      >
        <ArrowLeft className="w-3.5 h-3.5" />
        Back to client portal
      </Link>

      <BrandHeader
        subtitle="Admin"
        title="Create a client signing link"
        description="Upload the PDF for this client. They only see what you attach here — not the main site documents unless you add those below."
      />

      {createdUrl && (
        <div
          className="rounded-2xl p-5 mb-6 animate-fade-up"
          style={{
            background: "rgba(34, 197, 94, 0.08)",
            border: "1px solid rgba(34, 197, 94, 0.25)",
            animationDelay: "0.05s",
            opacity: 0,
          }}
        >
          <div className="flex items-start gap-3 mb-4">
            <CheckCircle2 className="w-5 h-5 flex-shrink-0 mt-0.5" style={{ color: "var(--success)" }} />
            <div>
              <p className="text-sm font-semibold" style={{ color: "var(--success)" }}>
                Link created — send this to your client
              </p>
              <p className="text-xs mt-1" style={{ color: "var(--text-muted)" }}>
                They&apos;ll only see the documents you selected below.
              </p>
            </div>
          </div>
          <div
            className="flex items-center gap-2 p-3 rounded-xl mb-3"
            style={{ background: "var(--surface)", border: "1px solid var(--border)" }}
          >
            <Link2 className="w-4 h-4 flex-shrink-0" style={{ color: "var(--accent)" }} />
            <p className="text-xs font-mono truncate flex-1" style={{ color: "var(--text-secondary)" }}>
              {createdUrl}
            </p>
          </div>
          <button
            onClick={() => copyUrl(createdUrl)}
            className="flex items-center justify-center gap-2 w-full py-3 rounded-xl text-sm font-medium transition-all"
            style={{
              background: copied ? "rgba(34, 197, 94, 0.15)" : "var(--accent)",
              color: copied ? "var(--success)" : "var(--accent-foreground)",
              border: copied ? "1px solid rgba(34, 197, 94, 0.3)" : "none",
            }}
          >
            {copied ? (
              <>
                <Check className="w-4 h-4" />
                Copied!
              </>
            ) : (
              <>
                <Copy className="w-4 h-4" />
                Copy link to clipboard
              </>
            )}
          </button>
        </div>
      )}

      {error && (
        <div
          className="rounded-xl px-4 py-3 mb-6 text-sm animate-fade-up"
          style={{
            background: "rgba(239, 68, 68, 0.08)",
            border: "1px solid rgba(239, 68, 68, 0.25)",
            color: "var(--danger)",
          }}
        >
          {error}
        </div>
      )}

      <div className="space-y-6">
        <SectionCard icon={User} title="Client details" description="Prefilled on their signing page." delay="0.1s">
          <div className="grid gap-4 md:grid-cols-2">
            {clientFields.map(({ label, value, setValue, icon: Icon, type = "text", placeholder }) => (
              <div key={label}>
                <label className="block text-sm font-medium mb-2" style={{ color: "var(--text-secondary)" }}>
                  {label}
                </label>
                <div className="relative">
                  <Icon
                    className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4"
                    style={{ color: "var(--text-muted)" }}
                  />
                  <input
                    type={type}
                    value={value}
                    placeholder={placeholder}
                    onChange={(e) => setValue(e.target.value)}
                    className="w-full pl-11 pr-4 py-3.5 rounded-xl text-sm outline-none transition-all"
                    style={inputStyle()}
                    onFocus={focusInput}
                    onBlur={blurInput}
                  />
                </div>
              </div>
            ))}
          </div>
        </SectionCard>

        <SectionCard
          icon={Upload}
          title="Client PDF"
          description="The document this client will review and sign. Only this file appears on their link."
          delay="0.15s"
          action={
            <button
              type="button"
              onClick={addCustomSlot}
              className="flex items-center gap-1.5 text-xs px-3 py-2 rounded-lg font-medium transition-all flex-shrink-0"
              style={{
                background: "rgba(37, 99, 235, 0.12)",
                color: "var(--accent)",
                border: "1px solid rgba(37, 99, 235, 0.25)",
              }}
            >
              <Plus className="w-3.5 h-3.5" />
              Add PDF
            </button>
          }
        >
          {customUploads.length === 0 ? (
            <button
              type="button"
              onClick={addCustomSlot}
              className="w-full py-10 rounded-xl border-2 border-dashed transition-all"
              style={{
                borderColor: "var(--border)",
                color: "var(--text-muted)",
                background: "var(--surface-2)",
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.borderColor = "var(--accent)";
                e.currentTarget.style.background = "rgba(37, 99, 235, 0.05)";
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.borderColor = "var(--border)";
                e.currentTarget.style.background = "var(--surface-2)";
              }}
            >
              <Upload className="w-6 h-6 mx-auto mb-2" style={{ color: "var(--accent)" }} />
              <p className="text-sm font-medium" style={{ color: "var(--text-secondary)" }}>
                Click to upload this client&apos;s PDF
              </p>
              <p className="text-xs mt-1">Only this file will appear on their signing link</p>
            </button>
          ) : (
            <div className="space-y-3">
              {customUploads.map((upload, i) => (
                <div
                  key={i}
                  className="flex flex-col sm:flex-row gap-3 p-3 rounded-xl"
                  style={{ background: "var(--surface-2)", border: "1px solid var(--border)" }}
                >
                  <input
                    placeholder="Document title (auto-filled from filename)"
                    value={upload.title}
                    onChange={(e) =>
                      setCustomUploads((prev) =>
                        prev.map((u, j) => (j === i ? { ...u, title: e.target.value } : u))
                      )
                    }
                    className="flex-1 px-4 py-3 rounded-xl text-sm outline-none transition-all"
                    style={inputStyle()}
                    onFocus={focusInput}
                    onBlur={blurInput}
                  />
                  <label
                    className="flex items-center justify-center gap-2 px-4 py-3 rounded-xl text-sm cursor-pointer transition-all sm:min-w-[180px]"
                    style={{
                      background: upload.file ? "rgba(37, 99, 235, 0.1)" : "var(--surface)",
                      border: upload.file ? "1px solid var(--accent)" : "1px solid var(--border)",
                      color: upload.file ? "var(--accent)" : "var(--text-secondary)",
                    }}
                  >
                    <Upload className="w-4 h-4" />
                    <span className="truncate max-w-[140px]">
                      {upload.file ? upload.file.name : "Choose PDF"}
                    </span>
                    <input
                      type="file"
                      accept="application/pdf"
                      className="hidden"
                      onChange={(e) => {
                        const file = e.target.files?.[0];
                        if (!file) return;
                        setCustomUploads((prev) =>
                          prev.map((u, j) =>
                            j === i
                              ? {
                                  ...u,
                                  file,
                                  title: u.title.trim() || titleFromFile(file),
                                }
                              : u
                          )
                        );
                        setSelectedCatalog(new Set());
                      }}
                    />
                  </label>
                  <button
                    type="button"
                    onClick={() => setCustomUploads((prev) => prev.filter((_, j) => j !== i))}
                    className="flex items-center justify-center px-3 py-3 rounded-xl transition-all"
                    style={{ color: "var(--text-muted)", border: "1px solid var(--border)" }}
                    aria-label="Remove PDF"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              ))}
            </div>
          )}
        </SectionCard>

        <SectionCard
          icon={FileText}
          title="Standard documents (optional)"
          description="Only check these if this client also needs the main service agreements."
          delay="0.2s"
        >
          <div className="grid gap-3 sm:grid-cols-2">
            {DOCUMENTS.map((doc) => {
              const selected = selectedCatalog.has(doc.id);
              return (
                <button
                  key={doc.id}
                  type="button"
                  onClick={() => toggleCatalog(doc.id)}
                  className="text-left p-4 rounded-xl transition-all active:scale-[0.99]"
                  style={{
                    background: selected ? "rgba(37, 99, 235, 0.1)" : "var(--surface-2)",
                    border: selected ? "1px solid var(--accent)" : "1px solid var(--border)",
                    boxShadow: selected ? "0 0 0 1px rgba(37, 99, 235, 0.15)" : "none",
                  }}
                >
                  <div className="flex items-start justify-between gap-2 mb-2">
                    <FileText className="w-4 h-4 flex-shrink-0 mt-0.5" style={{ color: "var(--accent)" }} />
                    <div
                      className={clsx(
                        "w-5 h-5 rounded-md flex items-center justify-center flex-shrink-0 transition-all",
                        selected ? "opacity-100" : "opacity-40"
                      )}
                      style={{
                        background: selected ? "var(--accent)" : "var(--surface)",
                        border: selected ? "none" : "1px solid var(--border)",
                      }}
                    >
                      {selected && <Check className="w-3 h-3" style={{ color: "var(--accent-foreground)" }} />}
                    </div>
                  </div>
                  <p className="text-sm font-medium" style={{ color: "var(--text-primary)" }}>
                    {doc.title}
                  </p>
                  <p className="text-xs mt-1 line-clamp-2" style={{ color: "var(--text-muted)" }}>
                    {doc.description}
                  </p>
                </button>
              );
            })}
          </div>
        </SectionCard>

        <button
          type="button"
          onClick={handleCreate}
          disabled={creating}
          className="w-full flex items-center justify-center gap-2 py-4 rounded-xl font-medium text-sm transition-all active:scale-[0.98] disabled:opacity-60 animate-fade-up"
          style={{
            background: "var(--accent)",
            color: "var(--accent-foreground)",
            animationDelay: "0.25s",
            opacity: 0,
          }}
          onMouseEnter={(e) => {
            if (!creating) {
              (e.currentTarget as HTMLElement).style.background = "var(--accent-hover)";
              (e.currentTarget as HTMLElement).style.boxShadow = "0 4px 20px rgba(37, 99, 235, 0.35)";
            }
          }}
          onMouseLeave={(e) => {
            (e.currentTarget as HTMLElement).style.background = "var(--accent)";
            (e.currentTarget as HTMLElement).style.boxShadow = "none";
          }}
        >
          {creating ? <Loader2 className="w-4 h-4 animate-spin" /> : <Link2 className="w-4 h-4" />}
          {creating ? "Creating link…" : "Create signing link"}
        </button>

        {links && links.length > 0 && (
          <SectionCard
            icon={Link2}
            title="Recent links"
            description="Quick access to links you've created."
            delay="0.3s"
          >
            <div className="space-y-2">
              {links.map((link) => {
                const url = `${typeof window !== "undefined" ? window.location.origin : ""}/sign/${link.token}`;
                const isComplete = link.status === "complete";
                return (
                  <div
                    key={link._id}
                    className="flex items-center gap-3 p-4 rounded-xl transition-all"
                    style={{ background: "var(--surface-2)", border: "1px solid var(--border)" }}
                  >
                    <div
                      className="w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0"
                      style={{
                        background: isComplete ? "rgba(34, 197, 94, 0.12)" : "rgba(37, 99, 235, 0.12)",
                      }}
                    >
                      {isComplete ? (
                        <CheckCircle2 className="w-4 h-4" style={{ color: "var(--success)" }} />
                      ) : (
                        <Link2 className="w-4 h-4" style={{ color: "var(--accent)" }} />
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <p className="text-sm font-medium truncate" style={{ color: "var(--text-primary)" }}>
                          {link.clientName}
                        </p>
                        <span
                          className="text-[10px] uppercase tracking-wide font-semibold px-2 py-0.5 rounded-full"
                          style={{
                            background: isComplete ? "rgba(34, 197, 94, 0.12)" : "rgba(251, 191, 36, 0.12)",
                            color: isComplete ? "var(--success)" : "#fbbf24",
                          }}
                        >
                          {link.status}
                        </span>
                      </div>
                      <p className="text-xs truncate mt-0.5" style={{ color: "var(--text-muted)" }}>
                        {link.clientEmail} · {link.documents.length} doc
                        {link.documents.length !== 1 ? "s" : ""}
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={() => copyUrl(url)}
                      className="flex items-center gap-1 text-xs px-3 py-2 rounded-lg font-medium flex-shrink-0 transition-all"
                      style={{
                        color: "var(--accent)",
                        border: "1px solid rgba(37, 99, 235, 0.25)",
                        background: "rgba(37, 99, 235, 0.06)",
                      }}
                    >
                      <Copy className="w-3 h-3" />
                      Copy
                    </button>
                  </div>
                );
              })}
            </div>
          </SectionCard>
        )}
      </div>
    </PageShell>
  );
}
