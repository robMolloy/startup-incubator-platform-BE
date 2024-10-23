import {
  firestoreServerTimestampSchema,
  firestoreTimestampSchema,
} from "@/utils/firestoreUtils";
import { z } from "zod";

export const userDbEntrySchema = z.object({
  id: z.string(),
  uid: z.string(),
  isAdmin: z.boolean(),
  email: z.string(),
  userName: z.string(),
  createdAt: firestoreTimestampSchema.nullish(),
  updatedAt: firestoreTimestampSchema.nullish(),
});

const userNewDbEntrySeedSchema = userDbEntrySchema
  .omit({ isAdmin: true, createdAt: true, updatedAt: true })
  .merge(
    z.object({
      isAdmin: z.literal(false),
      createdAt: firestoreServerTimestampSchema,
      updatedAt: firestoreServerTimestampSchema,
    })
  );

const userNewDbEntryPreSeedSchema = userDbEntrySchema.omit({
  id: true,
  isAdmin: true,
  createdAt: true,
  updatedAt: true,
});
const userUpdateDbEntryPreSeedSchema = userDbEntrySchema.omit({
  updatedAt: true,
});

export type TUserDbEntry = z.infer<typeof userDbEntrySchema>;
export type TUserNewDbEntrySeed = z.infer<typeof userNewDbEntrySeedSchema>;
export type TUserNewDbEntryPreSeed = z.infer<
  typeof userNewDbEntryPreSeedSchema
>;
export type TUserUpdateDbEntryPreSeedSchema = z.infer<
  typeof userUpdateDbEntryPreSeedSchema
>;
