import { mutation, query } from "./_generated/server";
import { v } from "convex/values";

const linkDocumentArg = v.object({
  id: v.string(),
  title: v.string(),
  description: v.string(),
  pages: v.number(),
  category: v.string(),
  required: v.boolean(),
  pdfUrl: v.optional(v.string()),
  pdfStorageId: v.optional(v.id("_storage")),
  signaturePlacementKey: v.optional(v.string()),
});

function assertAdmin(adminSecret: string) {
  const expected = process.env.ADMIN_SECRET;
  if (!expected) {
    throw new Error(
      "Admin secret is not set in Convex yet. Run: npx convex env set ADMIN_SECRET your-password"
    );
  }
  if (adminSecret !== expected) {
    throw new Error("Incorrect admin secret");
  }
}

export const verifyAdminSecret = mutation({
  args: { adminSecret: v.string() },
  handler: async (_ctx, args) => {
    assertAdmin(args.adminSecret);
    return { ok: true as const };
  },
});

function generateToken() {
  return crypto.randomUUID().replace(/-/g, "").slice(0, 16);
}

export const createSigningLink = mutation({
  args: {
    adminSecret: v.string(),
    clientName: v.string(),
    clientEmail: v.string(),
    clientCompany: v.optional(v.string()),
    note: v.optional(v.string()),
    documents: v.array(linkDocumentArg),
  },
  handler: async (ctx, args) => {
    assertAdmin(args.adminSecret);

    if (args.documents.length === 0) {
      throw new Error("Select at least one document");
    }

    const token = generateToken();

    const linkId = await ctx.db.insert("signingLinks", {
      token,
      clientName: args.clientName,
      clientEmail: args.clientEmail,
      clientCompany: args.clientCompany,
      note: args.note,
      documents: args.documents,
      status: "pending",
      createdAt: new Date().toISOString(),
    });

    return { linkId, token };
  },
});

export const listSigningLinks = query({
  args: { adminSecret: v.string() },
  handler: async (ctx, args) => {
    assertAdmin(args.adminSecret);

    return await ctx.db.query("signingLinks").order("desc").take(50);
  },
});

export const getByToken = query({
  args: { token: v.string() },
  handler: async (ctx, args) => {
    const link = await ctx.db
      .query("signingLinks")
      .withIndex("by_token", (q) => q.eq("token", args.token))
      .unique();

    if (!link) return null;

    const documents = await Promise.all(
      link.documents.map(async (doc) => {
        let pdfUrl = doc.pdfUrl;
        if (doc.pdfStorageId) {
          pdfUrl = (await ctx.storage.getUrl(doc.pdfStorageId)) ?? undefined;
        }
        return {
          ...doc,
          pdfUrl: pdfUrl ?? "",
          signaturePlacementKey: doc.pdfStorageId
            ? doc.signaturePlacementKey === "general-service-agreement" ||
              !doc.signaturePlacementKey
              ? "custom-invoice"
              : doc.signaturePlacementKey
            : doc.signaturePlacementKey,
        };
      })
    );

    return {
      _id: link._id,
      token: link.token,
      clientName: link.clientName,
      clientEmail: link.clientEmail,
      clientCompany: link.clientCompany,
      note: link.note,
      status: link.status,
      submissionId: link.submissionId,
      createdAt: link.createdAt,
      documents,
    };
  },
});

export const completeSigningLink = mutation({
  args: {
    signingLinkId: v.id("signingLinks"),
    submissionId: v.id("submissions"),
  },
  handler: async (ctx, args) => {
    const link = await ctx.db.get(args.signingLinkId);
    if (!link) throw new Error("Signing link not found");

    await ctx.db.patch(args.signingLinkId, {
      status: "complete",
      submissionId: args.submissionId,
    });
  },
});
