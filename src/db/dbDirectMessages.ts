import {
  firestoreServerTimestampSchema,
  firestoreTimestampSchema,
} from "@/utils/firestoreUtils";
import { z } from "zod";

export const directMessageDbEntrySchema = z.object({
  id: z.string(),
  text: z.string(),
  senderUid: z.string(),
  uids: z.record(z.string(), z.boolean()),
  createdAt: firestoreTimestampSchema.nullish(),
  updatedAt: firestoreTimestampSchema.nullish(),
});

const directMessageNewDbEntrySeedSchema = directMessageDbEntrySchema
  .omit({
    id: true,
    createdAt: true,
    updatedAt: true,
  })
  .merge(
    z.object({
      createdAt: firestoreServerTimestampSchema,
      updatedAt: firestoreServerTimestampSchema,
    })
  );

const directMessageNewDbEntryFormDataSchema = directMessageDbEntrySchema.omit({
  id: true,
  senderUid: true,
  uids: true,
  createdAt: true,
  updatedAt: true,
});

export type TDirectMessageDbEntry = z.infer<typeof directMessageDbEntrySchema>;
export type TDirectMessageNewDbEntrySeed = z.infer<
  typeof directMessageNewDbEntrySeedSchema
>;
export type TDirectMessageNewDbEntryFormData = z.infer<
  typeof directMessageNewDbEntryFormDataSchema
>;
