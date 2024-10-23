import {
  Auth,
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut,
} from "firebase/auth";
import { z } from "zod";

export type TCreateUserFormData = {
  userName: string;
  userEmail: string;
  userPassword: string;
  userPasswordConfirm: string;
};
export const createFirebaseUser = async (p: { auth: Auth; formData: TCreateUserFormData }) => {
  try {
    const userCredential = await createUserWithEmailAndPassword(
      p.auth,
      p.formData.userEmail,
      p.formData.userPassword,
    );

    const user = userCredential.user;
    if (!user) throw new Error("user has not been created");
    return { success: true, data: user } as const;
  } catch (e) {
    const error = e as { message: string };
    console.error({ error });
    return { success: false, error } as const;
  }
};
const loginFormDataSchema = z.object({ userEmail: z.string(), userPassword: z.string() });
export type TLoginFormData = z.infer<typeof loginFormDataSchema>;
export const loginFirebaseUser = async (p: { auth: Auth; formData: TLoginFormData }) => {
  try {
    const userCredential = await signInWithEmailAndPassword(
      p.auth,
      p.formData.userEmail,
      p.formData.userPassword,
    );

    const user = userCredential.user;
    if (!user) throw new Error("user login unsuccessful");
    return { success: true, data: user } as const;
  } catch (e) {
    const error = e as { message: string };
    console.error({ error });
    return { success: false, error } as const;
  }
};

export const logoutFirebaseUser = async (p: { auth: Auth }) => {
  try {
    await signOut(p.auth);
    return { success: true } as const;
  } catch (e) {
    const error = e as { message: string };
    console.error({ error });
    return { success: false, error } as const;
  }
};
