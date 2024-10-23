import {
  firestoreServerTimestampSchema,
  firestoreTimestampSchema,
} from "@/utils/firestoreUtils";
import { z } from "zod";

const appSettingsSchema = z.object({
  id: z.string(),
  welcomeLabel: z.string(),
  organisationsLabel: z.string(),
  profilesLabel: z.string(),
  projectsLabel: z.string(),
  usersLabel: z.string(),
  createdAt: firestoreTimestampSchema.nullish(),
  updatedAt: firestoreTimestampSchema.nullish(),
});
const appSettingFormDataSchema = appSettingsSchema.omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});
const appSettingsCreatePreSeedSchema = appSettingsSchema.omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});
const appSettingsCreateSeedSchema = appSettingsSchema
  .omit({ createdAt: true, updatedAt: true })
  .merge(
    z.object({
      createdAt: firestoreServerTimestampSchema,
      updatedAt: firestoreServerTimestampSchema,
    })
  );
const appSettingsUpdatePreSeedSchema = appSettingsSchema.omit({
  id: true,
  updatedAt: true,
});
const appSettingsUpdateSeedSchema = appSettingsSchema
  .omit({ updatedAt: true })
  .merge(z.object({ updatedAt: firestoreServerTimestampSchema }));

export type TAppSettings = z.infer<typeof appSettingsSchema>;
export type TAppSettingFormData = z.infer<typeof appSettingFormDataSchema>;
export type TAppSettingsCreatePreSeed = z.infer<
  typeof appSettingsCreatePreSeedSchema
>;
export type TAppSettingsCreateSeed = z.infer<
  typeof appSettingsCreateSeedSchema
>;
export type TAppSettingsUpdatePreSeed = z.infer<
  typeof appSettingsUpdatePreSeedSchema
>;
export type TAppSettingsUpdateSeed = z.infer<
  typeof appSettingsUpdateSeedSchema
>;
