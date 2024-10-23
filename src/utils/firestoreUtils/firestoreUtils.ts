import { FieldValue, serverTimestamp, Timestamp } from "firebase/firestore";
import { z } from "zod";

export const firestoreTimestampSchema = z
  .object({ seconds: z.number(), nanoseconds: z.number() })
  .transform((x) => new Timestamp(x.seconds, x.nanoseconds));

export const firestoreServerTimestampSchema = z.custom<FieldValue>((value: FieldValue) =>
  serverTimestamp().isEqual(value),
);

export const convertFirestoreTimestampToFormattedDate = (
  x: z.infer<typeof firestoreTimestampSchema>,
) => new Date(x.seconds * 1000).toUTCString();
