import { assertSucceeds, RulesTestEnvironment } from "@firebase/rules-unit-testing";
import { deleteDoc, doc, getDoc, serverTimestamp, setDoc, Timestamp } from "firebase/firestore";
import {
  createTestEnvironment,
  expectFirestorePermissionDenied,
  setDefaultLogLevel,
} from "./firestoreTestUtils";
import { TUserDbEntry } from "@/db/dbUsers";

let testEnv: RulesTestEnvironment;
const collectionName = "users";

const initAdminUser: TUserDbEntry = {
  id: "idAdmin1",
  uid: "idAdmin1",
  email: "admin@aol.com",
  userName: "admin1",
  isAdmin: true,
  createdAt: Timestamp.now(),
  updatedAt: Timestamp.now(),
};
const adminUser = { ...initAdminUser, createdAt: serverTimestamp(), updatedAt: serverTimestamp() };

const initAdminUser2: TUserDbEntry = {
  id: "idAdmin2",
  uid: "idAdmin2",
  userName: "admin2",
  email: "admin2@aol.com",
  isAdmin: true,
  createdAt: Timestamp.now(),
  updatedAt: Timestamp.now(),
};
const adminUser2 = {
  ...initAdminUser2,
  createdAt: serverTimestamp(),
  updatedAt: serverTimestamp(),
};
const initNonAdminUser: TUserDbEntry = {
  id: "idNonAdmin1",
  uid: "idNonAdmin1",
  email: "nonadmin@aol.com",
  userName: "nonAdmin1",
  isAdmin: false,
  createdAt: Timestamp.now(),
  updatedAt: Timestamp.now(),
};
const nonAdminUser = {
  ...initNonAdminUser,
  createdAt: serverTimestamp(),
  updatedAt: serverTimestamp(),
};
const initNonAdminUser2: TUserDbEntry = {
  id: "idNonAdmin2",
  uid: "idNonAdmin2",
  email: "nonadmin2@aol.com",
  userName: "nonAdmin1",
  isAdmin: false,
  createdAt: Timestamp.now(),
  updatedAt: Timestamp.now(),
};
const nonAdminUser2 = {
  ...initNonAdminUser2,
  createdAt: serverTimestamp(),
  updatedAt: serverTimestamp(),
};

describe("firestore rules for users collection", () => {
  beforeAll(async () => {
    setDefaultLogLevel();
    testEnv = await createTestEnvironment();
  });
  beforeEach(async () => {
    await testEnv.clearFirestore();
  });
  afterAll(async () => {
    await testEnv.cleanup();
  });

  it("deny delete - logged out", async () => {
    await testEnv.withSecurityRulesDisabled(async (context) => {
      const adminDb = context.firestore();
      const docRef = doc(adminDb, collectionName, adminUser.id);
      await setDoc(docRef, adminUser);
    });

    const unauthedDb = testEnv.unauthenticatedContext().firestore();
    const docRef = doc(unauthedDb, collectionName, adminUser.id);

    await expectFirestorePermissionDenied(deleteDoc(docRef));
  });

  it("deny delete - adminLoggedIn", async () => {
    await testEnv.withSecurityRulesDisabled(async (context) => {
      const adminDb = context.firestore();
      const docRef = doc(adminDb, collectionName, adminUser.id);
      await setDoc(docRef, adminUser);
    });

    const unauthedDb = testEnv
      .authenticatedContext(adminUser.id, { email: adminUser.email })
      .firestore();
    const docRef = doc(unauthedDb, collectionName, adminUser.id);

    await expectFirestorePermissionDenied(deleteDoc(docRef));
  });

  it("deny delete - nonAdminLoggedIn", async () => {
    await testEnv.withSecurityRulesDisabled(async (context) => {
      const adminDb = context.firestore();
      await setDoc(doc(adminDb, collectionName, nonAdminUser.id), nonAdminUser);
    });

    const unauthedDb = testEnv
      .authenticatedContext(nonAdminUser.id, { email: nonAdminUser.email })
      .firestore();
    const docRef = doc(unauthedDb, collectionName, nonAdminUser.id);

    await expectFirestorePermissionDenied(deleteDoc(docRef));
  });

  // it("deny get access - loggedOut", async () => {
  //   const { id: nonAdminId, ...validNonAdminUserData } = validNonAdminUser;
  //   const { id: adminId, ...validAdminUserData } = validAdminUser;
  //   await testEnv.withSecurityRulesDisabled(async (context) => {
  //     const adminDb = context.firestore();
  //     const promises = [
  //       setDoc(doc(adminDb, collectionName, adminId), validAdminUserData),
  //       setDoc(doc(adminDb, collectionName, nonAdminId), validNonAdminUserData),
  //     ];
  //     await Promise.all(promises);
  //   });

  //   const unauthedDb = testEnv.unauthenticatedContext().firestore();
  //   const promises = [
  //     expectFirestorePermissionDenied(getDoc(doc(unauthedDb, collectionName, nonAdminId))),
  //     expectFirestorePermissionDenied(getDoc(doc(unauthedDb, collectionName, adminId))),
  //   ];
  //   await Promise.all(promises);
  // });

  it("allow get access - adminLoggedIn", async () => {
    await testEnv.withSecurityRulesDisabled(async (context) => {
      const adminDb = context.firestore();
      const promises = [
        setDoc(doc(adminDb, collectionName, adminUser.id), adminUser),
        setDoc(doc(adminDb, collectionName, nonAdminUser.id), nonAdminUser),
      ];
      await Promise.all(promises);
    });

    const authedDb = testEnv
      .authenticatedContext(adminUser.id, { email: adminUser.email })
      .firestore();
    const promises = [
      assertSucceeds(getDoc(doc(authedDb, collectionName, nonAdminUser.id))),
      assertSucceeds(getDoc(doc(authedDb, collectionName, adminUser.id))),
    ];
    await Promise.all(promises);
  });

  it("allow get - nonAdminLoggedIn accessing own user", async () => {
    await testEnv.withSecurityRulesDisabled(async (context) => {
      const adminDb = context.firestore();
      const promises = [
        setDoc(doc(adminDb, collectionName, adminUser.id), adminUser),
        setDoc(doc(adminDb, collectionName, nonAdminUser.id), nonAdminUser),
      ];
      await Promise.all(promises);
    });

    const authedDb = testEnv
      .authenticatedContext(nonAdminUser.id, { email: nonAdminUser.email })
      .firestore();
    await assertSucceeds(getDoc(doc(authedDb, collectionName, nonAdminUser.id)));
  });
  // it("deny get - nonAdminLoggedIn accessing other user", async () => {
  //   const { id: nonAdminId, ...validNonAdminUserData } = validNonAdminUser;
  //   const { id: adminId, ...validAdminUserData } = validAdminUser;
  //   await testEnv.withSecurityRulesDisabled(async (context) => {
  //     const adminDb = context.firestore();
  //     const promises = [
  //       setDoc(doc(adminDb, collectionName, adminId), validAdminUserData),
  //       setDoc(doc(adminDb, collectionName, nonAdminId), validNonAdminUserData),
  //     ];
  //     await Promise.all(promises);
  //   });

  //   const authedDb = testEnv
  //     .authenticatedContext(nonAdminId, { email: validNonAdminUserData.email })
  //     .firestore();

  //   await expectFirestorePermissionDenied(getDoc(doc(authedDb, collectionName, adminId)));
  // });

  // it("deny get - nonAdminLoggedIn accessing other user", async () => {
  //   const { id: nonAdminId, ...validNonAdminUserData } = validNonAdminUser;
  //   const { id: nonAdminId2, ...validNonAdmin2UserData } = validNonAdmin2User;
  //   await testEnv.withSecurityRulesDisabled(async (context) => {
  //     const adminDb = context.firestore();
  //     const promises = [
  //       setDoc(doc(adminDb, collectionName, nonAdminId), validNonAdminUserData),
  //       setDoc(doc(adminDb, collectionName, nonAdminId2), validNonAdmin2UserData),
  //     ];
  //     await Promise.all(promises);
  //   });

  //   const authedDb = testEnv
  //     .authenticatedContext(nonAdminId, { email: validNonAdminUserData.email })
  //     .firestore();
  //   const promises = [
  //     expectFirestorePermissionDenied(getDoc(doc(authedDb, collectionName, nonAdminId2))),
  //   ];
  //   await Promise.all(promises);
  // });

  it("allow create access - loggedIn, owns doc ", async () => {
    const authedDb = testEnv
      .authenticatedContext(nonAdminUser.id, { email: nonAdminUser.email })
      .firestore();

    const docRef = doc(authedDb, collectionName, nonAdminUser.id);
    await assertSucceeds(setDoc(docRef, nonAdminUser));
  });

  it("deny create access - loggedIn, isAdmin:true ", async () => {
    const authedDb = testEnv
      .authenticatedContext(adminUser.id, { email: adminUser.email })
      .firestore();

    await expectFirestorePermissionDenied(
      setDoc(doc(authedDb, collectionName, adminUser.id), adminUser),
    );
  });

  it("deny create access - loggedOut", async () => {
    const authedDb = testEnv.unauthenticatedContext().firestore();

    await expectFirestorePermissionDenied(
      setDoc(doc(authedDb, collectionName, nonAdminUser.id), nonAdminUser),
    );
  });

  it("allow update - adminLoggedIn elevate nonAdmin to admin", async () => {
    await testEnv.withSecurityRulesDisabled(async (context) => {
      const adminDb = context.firestore();
      const promises = [
        setDoc(doc(adminDb, collectionName, adminUser.id), adminUser),
        setDoc(doc(adminDb, collectionName, nonAdminUser.id), nonAdminUser),
      ];
      await Promise.all(promises);
    });

    const authedDb = testEnv
      .authenticatedContext(adminUser.id, { email: adminUser.email })
      .firestore();

    const nonAdminUserDocRef = doc(authedDb, collectionName, nonAdminUser.id);
    const newNonAdminUser = (await assertSucceeds(getDoc(nonAdminUserDocRef))).data();
    const updatedUser = { ...newNonAdminUser, updatedAt: serverTimestamp(), isAdmin: true };
    await assertSucceeds(setDoc(nonAdminUserDocRef, updatedUser));
  });

  it("allow update - adminLoggedIn demote admin2 to nonAdmin", async () => {
    await testEnv.withSecurityRulesDisabled(async (context) => {
      const adminDb = context.firestore();
      const promises = [
        setDoc(doc(adminDb, collectionName, adminUser.id), adminUser),
        setDoc(doc(adminDb, collectionName, adminUser2.id), adminUser2),
      ];
      await Promise.all(promises);
    });

    const authedDb = testEnv
      .authenticatedContext(adminUser.id, { email: adminUser.email })
      .firestore();
    const adminUser2DocRef = doc(authedDb, collectionName, adminUser2.id);
    const newNonAdminUser = (await assertSucceeds(getDoc(adminUser2DocRef))).data();
    const updatedUser = { ...newNonAdminUser, updatedAt: serverTimestamp(), isAdmin: false };
    await assertSucceeds(setDoc(adminUser2DocRef, updatedUser));
  });

  it("deny update - nonAdminLoggedIn elevate nonAdmin2 to admin", async () => {
    await testEnv.withSecurityRulesDisabled(async (context) => {
      const adminDb = context.firestore();
      const promises = [
        setDoc(doc(adminDb, collectionName, nonAdminUser.id), nonAdminUser),
        setDoc(doc(adminDb, collectionName, nonAdminUser2.id), nonAdminUser2),
      ];
      await Promise.all(promises);
    });

    const authedDb = testEnv
      .authenticatedContext(nonAdminUser.id, { email: nonAdminUser.email })
      .firestore();
    const updatedUser = { ...nonAdminUser2, isAdmin: true };
    await expectFirestorePermissionDenied(
      setDoc(doc(authedDb, collectionName, nonAdminUser2.id), updatedUser),
    );
  });
});
