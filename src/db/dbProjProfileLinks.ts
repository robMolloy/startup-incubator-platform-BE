import {
  firestoreServerTimestampSchema,
  firestoreTimestampSchema,
} from "@/utils/firestoreUtils";
import { z } from "zod";

export const projProfileLinkDbEntrySchema = z.object({
  id: z.string(),
  profileId: z.string(),
  projectId: z.string(),
  approvalStatus: z.union([
    z.literal("approved"),
    z.literal("pending"),
    z.literal("blocked"),
  ]),
  createdAt: firestoreTimestampSchema.nullish(),
  updatedAt: firestoreTimestampSchema.nullish(),
});
const projProfileLinkNewDbEntrySeedSchema = projProfileLinkDbEntrySchema
  .omit({ id: true, createdAt: true, updatedAt: true })
  .merge(
    z.object({
      createdAt: firestoreServerTimestampSchema,
      updatedAt: firestoreServerTimestampSchema,
    })
  );
const projProfileLinkNewDbEntryFormDataSchema =
  projProfileLinkDbEntrySchema.omit({
    id: true,
    approvalStatus: true,
    createdAt: true,
    updatedAt: true,
  });

const projProfileLinkUpdateDbEntrySchema = projProfileLinkDbEntrySchema
  .omit({ id: true, createdAt: true, updatedAt: true })
  .partial()
  .merge(z.object({ id: z.string() }));

export type TProjProfileLinkDbEntry = z.infer<
  typeof projProfileLinkDbEntrySchema
>;
export type TProjProfileLinkNewDbEntrySeed = z.infer<
  typeof projProfileLinkNewDbEntrySeedSchema
>;
export type TProjProfileLinkNewDbEntryFormData = z.infer<
  typeof projProfileLinkNewDbEntryFormDataSchema
>;
export type TProjProfileLinkUpdateDbEntrySchema = z.infer<
  typeof projProfileLinkUpdateDbEntrySchema
>;
