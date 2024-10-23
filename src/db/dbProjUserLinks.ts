import {
  firestoreServerTimestampSchema,
  firestoreTimestampSchema,
} from "@/utils/firestoreUtils";
import { z } from "zod";

export const projUserLinkDbEntrySchema = z.object({
  id: z.string(),
  uid: z.string(),
  projectId: z.string(),
  approvalStatus: z.union([
    z.literal("approved"),
    z.literal("pending"),
    z.literal("blocked"),
  ]),
  createdAt: firestoreTimestampSchema.nullish(),
  updatedAt: firestoreTimestampSchema.nullish(),
});
const projUserLinkNewDbEntryPreSeedSchema = projUserLinkDbEntrySchema.omit({
  id: true,
  createdAt: true,
  updatedAt: true,
  approvalStatus: true,
});
const projUserLinkNewDbEntrySeedSchema = projUserLinkDbEntrySchema
  .omit({ createdAt: true, updatedAt: true })
  .merge(
    z.object({
      createdAt: firestoreServerTimestampSchema,
      updatedAt: firestoreServerTimestampSchema,
    })
  );
const projUserLinkNewDbEntryFormDataSchema = projUserLinkDbEntrySchema.omit({
  id: true,
  approvalStatus: true,
  createdAt: true,
  updatedAt: true,
});

const projUserLinkUpdateDbEntrySchema = projUserLinkDbEntrySchema
  .omit({ id: true, createdAt: true, updatedAt: true })
  .partial()
  .merge(z.object({ id: z.string() }));

export type TProjUserLinkDbEntry = z.infer<typeof projUserLinkDbEntrySchema>;
export type TProjUserLinkNewDbEntryPreSeed = z.infer<
  typeof projUserLinkNewDbEntryPreSeedSchema
>;
export type TProjUserLinkNewDbEntrySeed = z.infer<
  typeof projUserLinkNewDbEntrySeedSchema
>;
export type TProjUserLinkNewDbEntryFormData = z.infer<
  typeof projUserLinkNewDbEntryFormDataSchema
>;
export type TProjUserLinkUpdateDbEntrySchema = z.infer<
  typeof projUserLinkUpdateDbEntrySchema
>;
