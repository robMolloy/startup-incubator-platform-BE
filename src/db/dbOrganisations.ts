import { firestoreTimestampSchema } from "@/utils/firestoreUtils";
import { z } from "zod";

export const organisationDbEntrySchema = z.object({
  id: z.string(),
  adminUids: z.array(z.string()),
  organisationName: z.string(),
  subtitle: z.string(),
  description: z.string(),
  imageUrl: z.string(),
  imageUrls: z.record(z.string(), z.unknown()),
  createdAt: firestoreTimestampSchema.nullish(),
  updatedAt: firestoreTimestampSchema.nullish(),
});

const organisationNewDbEntrySeedSchema = organisationDbEntrySchema.omit({
  createdAt: true,
  updatedAt: true,
});
const organisationNewDbEntryFormDataSchema = organisationDbEntrySchema.omit({
  id: true,
  adminUids: true,
  createdAt: true,
  updatedAt: true,
});
const organisationUpdateDbEntryPreSeedSchema = organisationDbEntrySchema.omit({
  updatedAt: true,
});
export type TOrganisationDbEntry = z.infer<typeof organisationDbEntrySchema>;
export type TOrganisationNewDbEntrySeed = z.infer<
  typeof organisationNewDbEntrySeedSchema
>;
export type TOrganisationNewDbEntryFormData = z.infer<
  typeof organisationNewDbEntryFormDataSchema
>;
export type TOrganisationUpdateDbEntryPreSeedSchema = z.infer<
  typeof organisationUpdateDbEntryPreSeedSchema
>;
