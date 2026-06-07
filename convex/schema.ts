import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";

export default defineSchema({
  submissions: defineTable({
    clientName: v.string(),
    clientEmail: v.string(),
    clientCompany: v.optional(v.string()),
    submittedAt: v.string(),
    status: v.string(), // "pending" | "complete"
    totalDocs: v.number(),
  }).index("by_email", ["clientEmail"]),

  signedDocuments: defineTable({
    submissionId: v.id("submissions"),
    documentId: v.string(),
    documentTitle: v.string(),
    signatureData: v.string(), // base64 PNG data URL
    signedPdfStorageId: v.optional(v.id("_storage")),
    signedAt: v.string(),
  }).index("by_submission", ["submissionId"]),
});
