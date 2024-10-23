import { TOrganisationDbEntry } from "@/db/dbOrganisations";
import { TOrgUserLinkDbEntry } from "@/db/dbOrgUserLinks";
import { TProjectDbEntry } from "@/db/dbProjects";
import { TUserDbEntry } from "@/db/dbUsers";
import { assertSucceeds, RulesTestEnvironment } from "@firebase/rules-unit-testing";
import {
  collection,
  deleteDoc,
  doc,
  getDoc,
  getDocs,
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

let testEnv: RulesTestEnvironment;
const projectsCollectionName = "projects";
const usersCollectionName = "users";
const organisationsCollectionName = "organisations";
const orgUserLinksCollectionName = "orgUserLinks";

const nonAdminUser: TUserDbEntry = {
  id: "idNonAdmin1",
  uid: "idNonAdmin1",
  email: "nonadmin@aol.com",
  isAdmin: false,
  createdAt: Timestamp.now(),
  updatedAt: Timestamp.now(),
  userName: "nonAdmin",
};
const organisation: TOrganisationDbEntry = {
  id: "organisation1",
  organisationName: "organisation1",
  subtitle: "this is the organisation1 subtitle",
  description: "this is the organisation1 description",
  imageUrl:
    "https://masterbundles.com/wp-content/uploads/2022/03/1-nike-logo-design-%E2%80%93-history-meaning-and-evolution.png",
  imageUrls: {},
  createdAt: Timestamp.now(),
  updatedAt: Timestamp.now(),
  adminUids: [nonAdminUser.uid],
};
const project: TProjectDbEntry = {
  id: `${organisation.id}_project1`,
  organisationId: organisation.id,
  projectName: "project1",
  subtitle: "project1 subtitle",
  description: "the project1 description",
  imageUrl:
    "https://ohiocommunitycolleges.org/wp-content/uploads/2023/06/Cohort-1-Team-12-540x272.png",
  imageUrls: {},
  createdAt: Timestamp.now(),
  updatedAt: Timestamp.now(),
  adminUids: [nonAdminUser.uid],
};
const project2: TProjectDbEntry = {
  id: `${organisation.id}_project2`,
  organisationId: organisation.id,
  projectName: "project2",
  subtitle: "project2 subtitle",
  description: "the project1 description",
  imageUrl:
    "https://ohiocommunitycolleges.org/wp-content/uploads/2023/06/Cohort-1-Team-12-540x272.png",
  imageUrls: {},
  createdAt: Timestamp.now(),
  updatedAt: Timestamp.now(),
  adminUids: [nonAdminUser.uid],
};
const nonAdminApprovedOrgUserLink: TOrgUserLinkDbEntry = {
  id: `${organisation.id}_${nonAdminUser.id}`,
  organisationId: organisation.id,
  createdAt: Timestamp.now(),
  updatedAt: Timestamp.now(),
  uid: nonAdminUser.id,
  approvalStatus: "approved",
};

describe("firestore rules for projects collection", () => {
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
      await setDoc(doc(adminDb, projectsCollectionName, project.id), project);
    });

    const unauthedDb = testEnv.unauthenticatedContext().firestore();
    const docRef = doc(unauthedDb, projectsCollectionName, project.id);

    await expectFirestorePermissionDenied(deleteDoc(docRef));
  });

  it("deny delete - loggedIn", async () => {
    await testEnv.withSecurityRulesDisabled(async (context) => {
      const adminDb = context.firestore();
      const docRef = doc(adminDb, projectsCollectionName, project.id);
      await setDoc(docRef, project);
    });

    const authedDb = testEnv.authenticatedContext("someUid").firestore();
    await expectFirestorePermissionDenied(
      deleteDoc(doc(authedDb, projectsCollectionName, project.id)),
    );
  });

  it("deny delete - loggedIn, is orgAdmin", async () => {
    await testEnv.withSecurityRulesDisabled(async (context) => {
      const adminDb = context.firestore();
      await setDoc(doc(adminDb, organisationsCollectionName, organisation.id), {
        ...organisation,
        adminUids: [nonAdminUser.id],
      });
      await setDoc(doc(adminDb, usersCollectionName, nonAdminUser.id), nonAdminUser);
    });
    const authedDb = testEnv.authenticatedContext(nonAdminUser.id).firestore();
    await expectFirestorePermissionDenied(
      deleteDoc(doc(authedDb, projectsCollectionName, project.id)),
    );
  });

  it("allow get - loggedIn, orgUserLink", async () => {
    await testEnv.withSecurityRulesDisabled(async (context) => {
      const adminDb = context.firestore();
      const promises = [
        setDoc(doc(adminDb, organisationsCollectionName, organisation.id), organisation),
        setDoc(
          doc(adminDb, orgUserLinksCollectionName, nonAdminApprovedOrgUserLink.id),
          nonAdminApprovedOrgUserLink,
        ),
        setDoc(doc(adminDb, usersCollectionName, nonAdminUser.id), nonAdminUser),
        setDoc(doc(adminDb, projectsCollectionName, project.id), project),
      ];
      await Promise.all(promises);
    });

    const authedDb = testEnv.authenticatedContext(nonAdminUser.id).firestore();
    await assertSucceeds(getDoc(doc(authedDb, projectsCollectionName, project.id)));
  });

  it("allow list - loggedIn, orgUserLink", async () => {
    await testEnv.withSecurityRulesDisabled(async (context) => {
      const adminDb = context.firestore();
      const promises = [
        setDoc(doc(adminDb, organisationsCollectionName, organisation.id), organisation),
        setDoc(
          doc(adminDb, orgUserLinksCollectionName, nonAdminApprovedOrgUserLink.id),
          nonAdminApprovedOrgUserLink,
        ),
        setDoc(doc(adminDb, usersCollectionName, nonAdminUser.id), nonAdminUser),
        setDoc(doc(adminDb, projectsCollectionName, project.id), project),
        setDoc(doc(adminDb, projectsCollectionName, project2.id), project2),
      ];
      await Promise.all(promises);
    });

    const authedDb = testEnv.authenticatedContext(nonAdminUser.id).firestore();
    const q = query(
      collection(authedDb, projectsCollectionName),
      where("organisationId", "==", organisation.id),
    );

    await assertSucceeds(getDocs(q));
  });

  it("deny get - loggedIn, not orgUserLink", async () => {
    await testEnv.withSecurityRulesDisabled(async (context) => {
      const adminDb = context.firestore();
      const promises = [
        setDoc(doc(adminDb, organisationsCollectionName, organisation.id), organisation),
        setDoc(doc(adminDb, orgUserLinksCollectionName, nonAdminApprovedOrgUserLink.id), {
          ...nonAdminApprovedOrgUserLink,
          approvalStatus: "pending",
        }),
        setDoc(doc(adminDb, usersCollectionName, nonAdminUser.id), nonAdminUser),
        setDoc(doc(adminDb, projectsCollectionName, project.id), project),
      ];
      await Promise.all(promises);
    });

    const authedDb = testEnv.authenticatedContext(nonAdminUser.id).firestore();

    await expectFirestorePermissionDenied(
      getDoc(doc(authedDb, projectsCollectionName, project.id)),
    );
  });

  it("deny list - loggedIn, unapproved orgUserLink", async () => {
    await testEnv.withSecurityRulesDisabled(async (context) => {
      const adminDb = context.firestore();
      const promises = [
        setDoc(doc(adminDb, organisationsCollectionName, organisation.id), organisation),
        setDoc(doc(adminDb, orgUserLinksCollectionName, nonAdminApprovedOrgUserLink.id), {
          ...nonAdminApprovedOrgUserLink,
          approvalStatus: "pending",
        }),
        setDoc(doc(adminDb, usersCollectionName, nonAdminUser.id), nonAdminUser),
        setDoc(doc(adminDb, projectsCollectionName, project.id), project),
        setDoc(doc(adminDb, projectsCollectionName, project2.id), project2),
      ];
      await Promise.all(promises);
    });

    const authedDb = testEnv.authenticatedContext(nonAdminUser.id).firestore();
    const q = query(
      collection(authedDb, projectsCollectionName),
      where("organisationId", "==", organisation.id),
    );

    await expectFirestorePermissionDenied(getDocs(q));
  });
  it("deny list - loggedIn, not orgUserLink", async () => {
    await testEnv.withSecurityRulesDisabled(async (context) => {
      const adminDb = context.firestore();
      const promises = [
        setDoc(doc(adminDb, organisationsCollectionName, organisation.id), organisation),
        setDoc(doc(adminDb, orgUserLinksCollectionName, nonAdminApprovedOrgUserLink.id), {
          ...nonAdminApprovedOrgUserLink,
          approvalStatus: "pending",
        }),
        setDoc(doc(adminDb, usersCollectionName, nonAdminUser.id), nonAdminUser),
        setDoc(doc(adminDb, projectsCollectionName, project.id), project),
        setDoc(doc(adminDb, projectsCollectionName, project2.id), project2),
      ];
      await Promise.all(promises);
    });

    const authedDb = testEnv.authenticatedContext(nonAdminUser.id).firestore();
    const q = query(
      collection(authedDb, projectsCollectionName),
      where("organisationId", "==", organisation.id),
    );

    await expectFirestorePermissionDenied(getDocs(q));
  });

  it("allow create - loggedIn, is orgAdmin", async () => {
    await testEnv.withSecurityRulesDisabled(async (context) => {
      const adminDb = context.firestore();
      const promises = [
        setDoc(doc(adminDb, organisationsCollectionName, organisation.id), organisation),
        setDoc(doc(adminDb, usersCollectionName, nonAdminUser.id), nonAdminUser),
      ];
      await Promise.all(promises);
    });
    const authedDb = testEnv.authenticatedContext(nonAdminUser.id).firestore();
    const newProj = {
      ...project,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    };
    await assertSucceeds(setDoc(doc(authedDb, projectsCollectionName, project.id), newProj));
  });

  it("deny create - loggedIn, not orgAdmin", async () => {
    await testEnv.withSecurityRulesDisabled(async (context) => {
      const adminDb = context.firestore();
      const newOrg = { ...organisation, adminUids: ["differentUid"] };
      const promises = [
        setDoc(doc(adminDb, organisationsCollectionName, organisation.id), newOrg),
        setDoc(doc(adminDb, usersCollectionName, nonAdminUser.id), nonAdminUser),
      ];
      await Promise.all(promises);
    });
    const authedDb = testEnv.authenticatedContext(nonAdminUser.id).firestore();
    const newProj = {
      ...project,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    };
    await expectFirestorePermissionDenied(
      setDoc(doc(authedDb, projectsCollectionName, project.id), newProj),
    );
  });

  it("deny create - loggedIn, is orgAdmin additional keyValues", async () => {
    await testEnv.withSecurityRulesDisabled(async (context) => {
      const adminDb = context.firestore();
      const promises = [
        setDoc(doc(adminDb, organisationsCollectionName, organisation.id), organisation),
        setDoc(doc(adminDb, usersCollectionName, nonAdminUser.id), nonAdminUser),
      ];
      await Promise.all(promises);
    });
    const authedDb = testEnv.authenticatedContext(nonAdminUser.id).firestore();
    const newProj = {
      ...project,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
      extra: "key",
    };
    await expectFirestorePermissionDenied(
      setDoc(doc(authedDb, projectsCollectionName, project.id), newProj),
    );
  });

  it("deny create - loggedIn, missing keyValues", async () => {
    await testEnv.withSecurityRulesDisabled(async (context) => {
      const adminDb = context.firestore();
      const promises = [
        setDoc(doc(adminDb, organisationsCollectionName, organisation.id), organisation),
        setDoc(doc(adminDb, usersCollectionName, nonAdminUser.id), nonAdminUser),
      ];
      await Promise.all(promises);
    });
    const authedDb = testEnv.authenticatedContext(nonAdminUser.id).firestore();
    const newProj = {
      ...project,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    };
    const { organisationId: _organisationId, ...invalidProject1 } = newProj;
    const { projectName: _projectName, ...invalidProject2 } = newProj;
    const { createdAt: _createdAt, ...invalidProject3 } = newProj;
    const { updatedAt: _updatedAt, ...invalidProject4 } = newProj;
    const invalidProjects = [invalidProject1, invalidProject2, invalidProject3, invalidProject4];
    for (const invalidProject of invalidProjects) {
      await expectFirestorePermissionDenied(
        setDoc(doc(authedDb, organisationsCollectionName, project.id), invalidProject),
      );
    }
  });

  it("deny create - loggedIn, incorrect keyValue types", async () => {
    await testEnv.withSecurityRulesDisabled(async (context) => {
      const adminDb = context.firestore();
      const promises = [
        setDoc(doc(adminDb, organisationsCollectionName, organisation.id), organisation),
        setDoc(doc(adminDb, usersCollectionName, nonAdminUser.id), nonAdminUser),
      ];
      await Promise.all(promises);
    });
    const authedDb = testEnv.authenticatedContext(nonAdminUser.id).firestore();
    const newProj = {
      ...project,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    };
    const invalidProject1 = { ...newProj, organisationId: 123 };
    const invalidProject2 = { ...newProj, projectName: 321 };
    const invalidProject3 = { ...newProj, createdAt: "createdAt" };
    const invalidProject4 = { ...newProj, updatedAt: "updatedAt" };
    const invalidProjects = [invalidProject1, invalidProject2, invalidProject3, invalidProject4];
    for (const invalidProject of invalidProjects) {
      await expectFirestorePermissionDenied(
        setDoc(doc(authedDb, organisationsCollectionName, project.id), invalidProject),
      );
    }
  });

  it("deny create - loggedOut", async () => {
    const unauthedDb = testEnv.unauthenticatedContext().firestore();
    await expectFirestorePermissionDenied(
      setDoc(doc(unauthedDb, projectsCollectionName, project.id), project),
    );
  });

  it("deny create - loggedIn", async () => {
    const authedDb = testEnv.authenticatedContext("someUid").firestore();
    await expectFirestorePermissionDenied(
      setDoc(doc(authedDb, projectsCollectionName, project.id), project),
    );
  });
});
