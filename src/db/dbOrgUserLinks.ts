import {
  firestoreServerTimestampSchema,
  firestoreTimestampSchema,
} from "@/utils/firestoreUtils";
import { z } from "zod";

export const orgUserLinkDbEntrySchema = z.object({
  id: z.string(),
  uid: z.string(),
  organisationId: z.string(),
  approvalStatus: z.union([
    z.literal("approved"),
    z.literal("pending"),
    z.literal("blocked"),
  ]),
  createdAt: firestoreTimestampSchema.nullish(),
  updatedAt: firestoreTimestampSchema.nullish(),
});
const orgUserLinkNewDbEntrySeedSchema = orgUserLinkDbEntrySchema
  .omit({ id: true, createdAt: true, updatedAt: true })
  .merge(
    z.object({
      createdAt: firestoreServerTimestampSchema,
      updatedAt: firestoreServerTimestampSchema,
    })
  );
const orgUserLinkNewDbEntryFormDataSchema = orgUserLinkDbEntrySchema
  .omit({
    id: true,
    approvalStatus: true,
    createdAt: true,
    updatedAt: true,
  })
  .merge(orgUserLinkDbEntrySchema.pick({ approvalStatus: true }).partial());

const orgUserLinkUpdateDbEntrySchema = orgUserLinkDbEntrySchema
  .omit({
    id: true,
    createdAt: true,
    updatedAt: true,
  })
  .partial()
  .merge(z.object({ id: z.string() }));

export type TOrgUserLinkDbEntry = z.infer<typeof orgUserLinkDbEntrySchema>;
export type TOrgUserLinkNewDbEntrySeed = z.infer<
  typeof orgUserLinkNewDbEntrySeedSchema
>;
export type TOrgUserLinkNewDbEntryFormData = z.infer<
  typeof orgUserLinkNewDbEntryFormDataSchema
>;
export type TOrgUserLinkUpdateDbEntrySchema = z.infer<
  typeof orgUserLinkUpdateDbEntrySchema
>;
