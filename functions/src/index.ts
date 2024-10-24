/**
 * Import function triggers from their respective submodules:
 *
 * import {onCall} from "firebase-functions/v2/https";
 * import {onDocumentWritten} from "firebase-functions/v2/firestore";
 *
 * See a full list of supported triggers at https://firebase.google.com/docs/functions
 */

import * as logger from "firebase-functions/logger";
import { onCall } from "firebase-functions/v2/https";
import { z } from "zod";

const schema = z.object({ a: z.string() });
// Start writing functions
// https://firebase.google.com/docs/functions/typescript

export const helloWorld = onCall((request) => {
  const greetings = { hello: "Hello" };
  logger.info(`${greetings.hello} logs!`, { structuredData: true });
  return `${greetings.hello} from ${request.auth?.uid}!`;
});

export const passData = onCall((request) => {
  const greetings = { hello: "Hello" };
  logger.info(`${greetings.hello} logs!`, { structuredData: true });
  const parsedResponse = schema.safeParse(request.data);

  return `${greetings.hello} from ${parsedResponse.success ? "success" : "fail"}!`;
});

export const doesUserNameExist = onCall((request) => {
  return { success: !!request.data.userName };
});
