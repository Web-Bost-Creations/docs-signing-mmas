import { mutation, query } from "./_generated/server";
import { v } from "convex/values";

/**
 * Submit all signed documents for a client session.
 * Returns the submission ID (string).
 */
export const submitSignatures = mutation({
  args: {
    clientName: v.string(),
    clientEmail: v.string(),
    clientCompany: v.optional(v.string()),
    signatures: v.array(
      v.object({
        documentId: v.string(),
        documentTitle: v.string(),
        signatureData: v.string(),
        signedPdfStorageId: v.optional(v.id("_storage")),
        signedAt: v.string(),
      })
    ),
  },
  handler: async (ctx, args) => {
    // Create the parent submission record
    const submissionId = await ctx.db.insert("submissions", {
      clientName: args.clientName,
      clientEmail: args.clientEmail,
      clientCompany: args.clientCompany,
      submittedAt: new Date().toISOString(),
      status: "complete",
      totalDocs: args.signatures.length,
    });

    // Insert each signed document
    await Promise.all(
      args.signatures.map((sig) =>
        ctx.db.insert("signedDocuments", {
          submissionId,
          documentId: sig.documentId,
          documentTitle: sig.documentTitle,
          signatureData: sig.signatureData,
          signedPdfStorageId: sig.signedPdfStorageId,
          signedAt: sig.signedAt,
        })
      )
    );

    return submissionId;
  },
});

/**
 * List all submissions (admin use).
 */
export const listSubmissions = query({
  args: {},
  handler: async (ctx) => {
    return await ctx.db.query("submissions").order("desc").take(100);
  },
});

/**
 * Get a single submission with its signed documents.
 */
export const getSubmission = query({
  args: { submissionId: v.id("submissions") },
  handler: async (ctx, args) => {
    const submission = await ctx.db.get(args.submissionId);
    if (!submission) return null;

    const docs = await ctx.db
      .query("signedDocuments")
      .withIndex("by_submission", (q) =>
        q.eq("submissionId", args.submissionId)
      )
      .collect();

    return { ...submission, documents: docs };
  },
});

/**
 * Get all submissions by email.
 */
export const getSubmissionsByEmail = query({
  args: { email: v.string() },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("submissions")
      .withIndex("by_email", (q) => q.eq("clientEmail", args.email))
      .order("desc")
      .collect();
  },
});
