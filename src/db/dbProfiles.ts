import {
  firestoreServerTimestampSchema,
  firestoreTimestampSchema,
} from "@/utils/firestoreUtils";
import { z } from "zod";

export const profileDbEntrySchema = z.object({
  id: z.string(),
  uid: z.string(),
  title: z.string(),
  description: z.string(),
  createdAt: firestoreTimestampSchema.nullish(),
  updatedAt: firestoreTimestampSchema.nullish(),
  projProfileLinkIdReference: z.record(z.string(), z.boolean()),
});

const profileNewDbEntrySeedSchema = profileDbEntrySchema
  .omit({ createdAt: true, updatedAt: true })
  .merge(
    z.object({
      createdAt: firestoreServerTimestampSchema,
      updatedAt: firestoreServerTimestampSchema,
    })
  );
const profileNewDbEntryFormDataSchema = profileDbEntrySchema.omit({
  id: true,
  createdAt: true,
  updatedAt: true,
  projProfileLinkIdReference: true,
});

export type TProfileDbEntry = z.infer<typeof profileDbEntrySchema>;
export type TProfileNewDbEntrySeed = z.infer<
  typeof profileNewDbEntrySeedSchema
>;
export type TProfileNewDbEntryFormData = z.infer<
  typeof profileNewDbEntryFormDataSchema
>;
