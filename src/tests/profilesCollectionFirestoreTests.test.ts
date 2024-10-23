import { TProjProfileLinkDbEntry } from "@/db/dbProjProfileLinks";
import { TUserDbEntry } from "@/db/dbUsers";
import { assertSucceeds, RulesTestEnvironment } from "@firebase/rules-unit-testing";
import {
  collection,
  doc,
  getDoc,
  getDocs,
  limit,
  query,
  serverTimestamp,
  setDoc,
  Timestamp,
  where,
} from "firebase/firestore";
import {
  createTestEnvironment,
  expectFirestorePermissionDenied,
  setDefaultLogLevel,
} from "./firestoreTestUtils";
import { TProfileDbEntry } from "@/db/dbProfiles";
import { TProjectDbEntry } from "@/db/dbProjects";

let testEnv: RulesTestEnvironment;
const profilesCollName = "profiles";
const projectsCollName = "projects";
const projProfileLinksCollName = "projProfileLinks";

const uid = "idNonAdmin1";
const projAdminUid = "projAdminUid1";
const validNonAdminUser: TUserDbEntry = {
  id: "idNonAdmin1",
  uid,
  email: "nonadmin@aol.com",
  isAdmin: false,
  createdAt: Timestamp.now(),
  updatedAt: Timestamp.now(),
  userName: "nonAdmin",
};

const profile1: TProfileDbEntry = {
  id: "2kba3c9ey7AQCAiZsn6t",
  uid,
  title: "hhhhh",
  description: "hhhhh",
  createdAt: Timestamp.now(),
  updatedAt: Timestamp.now(),
  projProfileLinkIdReference: {
    "University of Nottingham_Cohort-1-Team-11_2kba3c9ey7AQCAiZsn6t": true,
  },
};

const projProfileLink1: TProjProfileLinkDbEntry = {
  id: "University of Nottingham_Cohort-1-Team-11_2kba3c9ey7AQCAiZsn6t",
  profileId: "2kba3c9ey7AQCAiZsn6t",
  projectId: "University of Nottingham_Cohort-1-Team-11",
  approvalStatus: "pending",
  createdAt: Timestamp.now(),
  updatedAt: Timestamp.now(),
};

const project1: TProjectDbEntry = {
  id: "University of Nottingham_Cohort-1-Team-11",
  organisationId: "University of Nottingham",
  projectName: "Cohort-1-Team-11",
  subtitle: "Cohort-1-Team-11",
  description: "Cohort-1-Team-11",
  imageUrl: "https://ohiocommunitycolleges.org/wp-content/uploads/2023/06/Cohort-1-Team-11.png",
  createdAt: Timestamp.now(),
  updatedAt: Timestamp.now(),
  adminUids: [projAdminUid],
  imageUrls: {},
};

describe("firestore rules for profiles collection", () => {
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

  it("allow create - loggedIn", async () => {
    const docId = profile1.id;
    const validProfileData = {
      ...profile1,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    };
    const authedDb = testEnv.authenticatedContext(validNonAdminUser.uid).firestore();
    await assertSucceeds(setDoc(doc(authedDb, profilesCollName, docId), validProfileData));
  });

  it("allow create - loggedIn, empty projProfileLinkIdReference", async () => {
    const docId = profile1.id;
    const { ...validProfileData } = {
      ...profile1,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
      projProfileLinkIdReference: {},
    };
    const authedDb = testEnv.authenticatedContext(validNonAdminUser.uid).firestore();
    await assertSucceeds(setDoc(doc(authedDb, profilesCollName, docId), validProfileData));
  });

  it("allow update - loggedIn, empty projProfileLinkIdReference", async () => {
    await testEnv.withSecurityRulesDisabled(async (context) => {
      const adminDb = context.firestore();
      await setDoc(doc(adminDb, profilesCollName, profile1.id), profile1);
    });

    const authedDb = testEnv.authenticatedContext(validNonAdminUser.uid).firestore();
    const docRef = doc(authedDb, profilesCollName, profile1.id);
    await assertSucceeds(
      setDoc(docRef, {
        ...profile1,
        projProfileLinkIdReference: { someId: true },
        updatedAt: serverTimestamp(),
      }),
    );
  });

  it("allow get - loggedIn accessing own doc", async () => {
    await testEnv.withSecurityRulesDisabled(async (context) => {
      const adminDb = context.firestore();
      await setDoc(doc(adminDb, profilesCollName, profile1.id), profile1);
    });

    const authedDb = testEnv.authenticatedContext(validNonAdminUser.uid).firestore();
    await assertSucceeds(getDoc(doc(authedDb, profilesCollName, profile1.id)));
  });
  it("deny get - loggedIn accessing doc from someRandomUid", async () => {
    await testEnv.withSecurityRulesDisabled(async (context) => {
      const adminDb = context.firestore();
      await setDoc(doc(adminDb, profilesCollName, profile1.id), profile1);
    });

    const authedDb = testEnv.authenticatedContext("someRandomUid").firestore();
    await expectFirestorePermissionDenied(getDoc(doc(authedDb, profilesCollName, profile1.id)));
  });
  it("allow list - loggedIn accessing own doc", async () => {
    await testEnv.withSecurityRulesDisabled(async (context) => {
      const adminDb = context.firestore();
      await setDoc(doc(adminDb, profilesCollName, profile1.id), profile1);
    });

    const authedDb = testEnv.authenticatedContext(validNonAdminUser.uid).firestore();
    await assertSucceeds(
      getDocs(query(collection(authedDb, profilesCollName), where("uid", "==", profile1.uid))),
    );
  });
  it("deny list - loggedIn accessing doc from someRandomUid", async () => {
    await testEnv.withSecurityRulesDisabled(async (context) => {
      const adminDb = context.firestore();
      await setDoc(doc(adminDb, profilesCollName, profile1.id), profile1);
    });

    const authedDb = testEnv.authenticatedContext("someRandomUid").firestore();
    await expectFirestorePermissionDenied(
      getDocs(query(collection(authedDb, profilesCollName), where("uid", "==", profile1.uid))),
    );
  });

  it("allow read - loggedIn as projAdmin, accessing doc of projUser", async () => {
    await testEnv.withSecurityRulesDisabled(async (context) => {
      const adminDb = context.firestore();

      const promises = [
        setDoc(doc(adminDb, profilesCollName, profile1.id), profile1),
        setDoc(doc(adminDb, projectsCollName, project1.id), project1),
        setDoc(doc(adminDb, projProfileLinksCollName, projProfileLink1.id), projProfileLink1),
      ];
      await Promise.all(promises);
    });

    const authedDb = testEnv.authenticatedContext(projAdminUid).firestore();

    await assertSucceeds(
      getDocs(
        query(
          collection(authedDb, profilesCollName),
          where(`projProfileLinkIdReference.${projProfileLink1.id}`, "==", true),
          limit(1),
        ),
      ),
    );
  });
});
