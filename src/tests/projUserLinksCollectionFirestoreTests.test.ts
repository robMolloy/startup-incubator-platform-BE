import { assertSucceeds, RulesTestEnvironment } from "@firebase/rules-unit-testing";
import { deleteDoc, doc, getDoc, serverTimestamp, setDoc, Timestamp } from "firebase/firestore";
import {
  createTestEnvironment,
  expectFirestorePermissionDenied,
  setDefaultLogLevel,
} from "./firestoreTestUtils";
import { TProjectDbEntry } from "@/db/dbProjects";
import { TUserDbEntry } from "@/db/dbUsers";
import { TProjUserLinkDbEntry } from "@/db/dbProjUserLinks";

let testEnv: RulesTestEnvironment;
const usersCollectionName = "users";
const projectsCollectionName = "projects";
const projUserLinksCollectionName = "projUserLinks";
// const organisationsCollectionName = "organisations";
// const orgUserLinksCollectionName = "orgUserLinks";

const user1: TUserDbEntry = {
  id: "uid1",
  createdAt: Timestamp.now(),
  updatedAt: Timestamp.now(),
  uid: "uid1",
  isAdmin: false,
  email: "uid1@uid1.com",
  userName: "nonAdmin",
};

const project1: TProjectDbEntry = {
  id: "org1_proj1",
  organisationId: "org1",
  projectName: "proj1",
  subtitle: "proj subtitle",
  description: "the project1 description",
  imageUrl:
    "https://ohiocommunitycolleges.org/wp-content/uploads/2023/06/Cohort-1-Team-12-540x272.png",
  imageUrls: {},
  createdAt: Timestamp.now(),
  updatedAt: Timestamp.now(),
  adminUids: [],
};

const projUserLink1: TProjUserLinkDbEntry = {
  id: `${project1.id}_${user1.uid}`,
  projectId: project1.id,
  createdAt: Timestamp.now(),
  updatedAt: Timestamp.now(),
  uid: user1.uid,
  approvalStatus: "pending",
};

describe("firestore rules for projUserLinks collection", () => {
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

  it("deny delete - loggedOut", async () => {
    await testEnv.withSecurityRulesDisabled(async (context) => {
      const adminDb = context.firestore();
      await setDoc(doc(adminDb, projUserLinksCollectionName, projUserLink1.id), projUserLink1);
    });

    const unauthedDb = testEnv.unauthenticatedContext().firestore();
    const docRef = doc(unauthedDb, projUserLinksCollectionName, projUserLink1.id);

    await expectFirestorePermissionDenied(deleteDoc(docRef));
  });

  it("deny delete - loggedIn", async () => {
    await testEnv.withSecurityRulesDisabled(async (context) => {
      const adminDb = context.firestore();
      await setDoc(doc(adminDb, projUserLinksCollectionName, projUserLink1.id), projUserLink1);
    });

    const authedDb = testEnv.authenticatedContext("someUid").firestore();
    const docRef = doc(authedDb, projUserLinksCollectionName, projUserLink1.id);

    await expectFirestorePermissionDenied(deleteDoc(docRef));
  });

  it("deny delete - loggedIn owns projUserLink", async () => {
    await testEnv.withSecurityRulesDisabled(async (context) => {
      const adminDb = context.firestore();
      await setDoc(doc(adminDb, projUserLinksCollectionName, projUserLink1.id), projUserLink1);
    });

    const authedDb = testEnv.authenticatedContext(projUserLink1.uid).firestore();
    const docRef = doc(authedDb, projUserLinksCollectionName, projUserLink1.id);

    await expectFirestorePermissionDenied(deleteDoc(docRef));
  });

  it("allow get - loggedIn, owns projUserLink", async () => {
    await testEnv.withSecurityRulesDisabled(async (context) => {
      const adminDb = context.firestore();
      await setDoc(doc(adminDb, projUserLinksCollectionName, projUserLink1.id), projUserLink1);
    });

    const authedDb = testEnv.authenticatedContext(projUserLink1.uid).firestore();
    await assertSucceeds(getDoc(doc(authedDb, projUserLinksCollectionName, projUserLink1.id)));
  });

  it("deny get - loggedIn, doesn't own projUserLink", async () => {
    await testEnv.withSecurityRulesDisabled(async (context) => {
      const adminDb = context.firestore();
      await setDoc(doc(adminDb, projUserLinksCollectionName, projUserLink1.id), projUserLink1);
    });

    const authedDb = testEnv.authenticatedContext("someUid").firestore();
    await expectFirestorePermissionDenied(
      getDoc(doc(authedDb, projUserLinksCollectionName, projUserLink1.id)),
    );
  });

  it("deny get - loggedIn, doesn't own projUserLink", async () => {
    await testEnv.withSecurityRulesDisabled(async (context) => {
      const adminDb = context.firestore();
      await setDoc(doc(adminDb, projUserLinksCollectionName, projUserLink1.id), projUserLink1);
    });

    const authedDb = testEnv.authenticatedContext("someUid").firestore();
    await expectFirestorePermissionDenied(
      getDoc(doc(authedDb, projUserLinksCollectionName, projUserLink1.id)),
    );
  });

  it("allow create - loggedIn", async () => {
    await testEnv.withSecurityRulesDisabled(async (context) => {
      const adminDb = context.firestore();
      const promises = [
        setDoc(doc(adminDb, usersCollectionName, user1.id), user1),
        setDoc(doc(adminDb, projectsCollectionName, project1.id), project1),
      ];
      await Promise.all(promises);
    });

    const authedDb = testEnv.authenticatedContext(user1.id).firestore();
    await assertSucceeds(
      setDoc(doc(authedDb, projUserLinksCollectionName, projUserLink1.id), {
        ...projUserLink1,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      }),
    );
  });

  it("deny create - loggedIn", async () => {
    await testEnv.withSecurityRulesDisabled(async (context) => {
      const adminDb = context.firestore();
      const promises = [
        setDoc(doc(adminDb, usersCollectionName, user1.id), user1),
        setDoc(doc(adminDb, projectsCollectionName, project1.id), project1),
      ];
      await Promise.all(promises);
    });

    const authedDb = testEnv.authenticatedContext("someUid").firestore();
    await expectFirestorePermissionDenied(
      setDoc(doc(authedDb, projUserLinksCollectionName, projUserLink1.id), {
        ...projUserLink1,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      }),
    );
  });
});
