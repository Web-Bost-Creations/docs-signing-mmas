import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";

const linkDocument = v.object({
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

export default defineSchema({
  submissions: defineTable({
    clientName: v.string(),
    clientEmail: v.string(),
    clientCompany: v.optional(v.string()),
    submittedAt: v.string(),
    status: v.string(),
    totalDocs: v.number(),
    signingLinkId: v.optional(v.id("signingLinks")),
  }).index("by_email", ["clientEmail"]),

  signedDocuments: defineTable({
    submissionId: v.id("submissions"),
    documentId: v.string(),
    documentTitle: v.string(),
    signatureData: v.string(),
    signedPdfStorageId: v.optional(v.id("_storage")),
    signedAt: v.string(),
  }).index("by_submission", ["submissionId"]),

  signingLinks: defineTable({
    token: v.string(),
    clientName: v.string(),
    clientEmail: v.string(),
    clientCompany: v.optional(v.string()),
    documents: v.array(linkDocument),
    status: v.string(), // pending | complete
    submissionId: v.optional(v.id("submissions")),
    createdAt: v.string(),
    note: v.optional(v.string()),
  }).index("by_token", ["token"]),
});
