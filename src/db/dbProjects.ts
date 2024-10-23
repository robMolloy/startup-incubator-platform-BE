import {
  firestoreServerTimestampSchema,
  firestoreTimestampSchema,
} from "@/utils/firestoreUtils";
import { z } from "zod";

export const projectDbEntrySchema = z.object({
  id: z.string(),
  organisationId: z.string(),
  projectName: z.string(),
  subtitle: z.string(),
  description: z.string(),
  imageUrl: z.string(),
  imageUrls: z.record(z.string().url(), z.unknown()),
  createdAt: firestoreTimestampSchema.nullish(),
  updatedAt: firestoreTimestampSchema.nullish(),
  adminUids: z.array(z.string()),
});

const projectNewDbEntrySeedSchema = projectDbEntrySchema
  .omit({ id: true, createdAt: true, updatedAt: true })
  .merge(
    z.object({
      createdAt: firestoreServerTimestampSchema,
      updatedAt: firestoreServerTimestampSchema,
    })
  );
const projectNewDbEntryFormDataSchema = projectDbEntrySchema.omit({
  id: true,
  createdAt: true,
  updatedAt: true,
  adminUids: true,
  organisationId: true,
});
const projectUpdateDbEntryPreSeedSchema = projectDbEntrySchema.omit({
  updatedAt: true,
});
export type TProjectDbEntry = z.infer<typeof projectDbEntrySchema>;
export type TProjectNewDbEntrySeed = z.infer<
  typeof projectNewDbEntrySeedSchema
>;
export type TProjectNewDbEntryFormData = z.infer<
  typeof projectNewDbEntryFormDataSchema
>;
export type TProjectUpdateDbEntryPreSeedSchema = z.infer<
  typeof projectUpdateDbEntryPreSeedSchema
>;
