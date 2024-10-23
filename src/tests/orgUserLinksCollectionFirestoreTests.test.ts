import { TOrganisationDbEntry } from "@/db/dbOrganisations";
import { TOrgUserLinkDbEntry } from "@/db/dbOrgUserLinks";
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
const usersCollectionName = "users";
const organisationsCollectionName = "organisations";
const orgUserLinksCollectionName = "orgUserLinks";

const orgAdminUser: TUserDbEntry = {
  id: "idOrgAdmin1",
  uid: "idOrgAdmin1",
  email: "orgadmin@aol.com",
  isAdmin: false,
  createdAt: Timestamp.now(),
  updatedAt: Timestamp.now(),
  userName: "orgAdmin",
};
const nonOrgAdminUser: TUserDbEntry = {
  id: "idNonOrgAdmin1",
  uid: "idNonOrgAdmin1",
  email: "nonOrgadmin@aol.com",
  isAdmin: false,
  createdAt: Timestamp.now(),
  updatedAt: Timestamp.now(),
  userName: "nonOrgAdmin",
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
  adminUids: [orgAdminUser.uid],
};
const organisation2: TOrganisationDbEntry = {
  id: "organisation2",
  organisationName: "organisation2",
  subtitle: "this is the organisation1 subtitle",
  description: "this is the organisation1 description",
  imageUrl:
    "https://cdn.shopify.com/s/files/1/0558/6413/1764/files/Rewrite_Reebok_Logo_Design_History_Evolution_0_1024x1024.jpg?v=1695309461",
  imageUrls: {},
  createdAt: Timestamp.now(),
  updatedAt: Timestamp.now(),
  adminUids: [orgAdminUser.uid],
};
const orgAdminApprovedOrgUserLink: TOrgUserLinkDbEntry = {
  id: `${organisation.id}_${orgAdminUser.id}`,
  organisationId: organisation.id,
  createdAt: Timestamp.now(),
  updatedAt: Timestamp.now(),
  uid: orgAdminUser.id,
  approvalStatus: "approved",
};
const nonOrgAdminApprovedOrgUserLink: TOrgUserLinkDbEntry = {
  id: `${organisation.id}_${nonOrgAdminUser.id}`,
  organisationId: organisation.id,
  createdAt: Timestamp.now(),
  updatedAt: Timestamp.now(),
  uid: nonOrgAdminUser.id,
  approvalStatus: "approved",
};
const nonOrgAdminApprovedOrgUserLink2: TOrgUserLinkDbEntry = {
  id: `${organisation2.id}_${nonOrgAdminUser.id}`,
  organisationId: organisation2.id,
  createdAt: Timestamp.now(),
  updatedAt: Timestamp.now(),
  uid: nonOrgAdminUser.id,
  approvalStatus: "approved",
};
const nonOrgAdminPendingOrgUserLink1: TOrgUserLinkDbEntry = {
  id: `${organisation2.id}_${nonOrgAdminUser.id}`,
  organisationId: organisation2.id,
  createdAt: Timestamp.now(),
  updatedAt: Timestamp.now(),
  uid: nonOrgAdminUser.id,
  approvalStatus: "pending",
};

describe("firestore rules for orgUserLinks collection", () => {
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
      await setDoc(
        doc(adminDb, orgUserLinksCollectionName, orgAdminApprovedOrgUserLink.id),
        orgAdminApprovedOrgUserLink,
      );
    });

    const unauthedDb = testEnv.unauthenticatedContext().firestore();
    const docRef = doc(unauthedDb, orgUserLinksCollectionName, orgAdminApprovedOrgUserLink.id);

    await expectFirestorePermissionDenied(deleteDoc(docRef));
  });

  it("deny delete - loggedIn, owns orgUserLinkDbEntry", async () => {
    await testEnv.withSecurityRulesDisabled(async (context) => {
      const adminDb = context.firestore();
      await setDoc(
        doc(adminDb, orgUserLinksCollectionName, orgAdminApprovedOrgUserLink.id),
        orgAdminApprovedOrgUserLink,
      );
    });

    const authedDb = testEnv.authenticatedContext(orgAdminApprovedOrgUserLink.uid).firestore();
    const docRef = doc(authedDb, orgUserLinksCollectionName, orgAdminApprovedOrgUserLink.id);

    await expectFirestorePermissionDenied(deleteDoc(docRef));
  });

  it("allow delete - orgAdmin deletes nonOrgAdminOrgUserLink", async () => {
    await testEnv.withSecurityRulesDisabled(async (context) => {
      const adminDb = context.firestore();
      const promises = [
        setDoc(doc(adminDb, organisationsCollectionName, organisation.id), organisation),
        setDoc(doc(adminDb, usersCollectionName, nonOrgAdminUser.id), nonOrgAdminUser),
        setDoc(doc(adminDb, usersCollectionName, orgAdminUser.id), orgAdminUser),
        setDoc(
          doc(adminDb, orgUserLinksCollectionName, orgAdminApprovedOrgUserLink.id),
          orgAdminApprovedOrgUserLink,
        ),
        setDoc(
          doc(adminDb, orgUserLinksCollectionName, nonOrgAdminApprovedOrgUserLink.id),
          nonOrgAdminApprovedOrgUserLink,
        ),
      ];
      await Promise.all(promises);
    });

    const adminDb = testEnv.authenticatedContext(orgAdminUser.id).firestore();
    const nonAdminDb = testEnv.authenticatedContext(nonOrgAdminUser.id).firestore();

    await expectFirestorePermissionDenied(
      deleteDoc(doc(nonAdminDb, orgUserLinksCollectionName, nonOrgAdminApprovedOrgUserLink.id)),
    );
    await assertSucceeds(
      deleteDoc(doc(adminDb, orgUserLinksCollectionName, nonOrgAdminApprovedOrgUserLink.id)),
    );
  });

  it("deny delete - nonOrgAdmin deletes nonOrgAdminOrgUserLink", async () => {
    const { id: organisationId, ...validOrganisationData } = organisation;
    const { id: nonOrgAdminUserId, ...validNonOrgAdminUserData } = nonOrgAdminUser;
    const { id: orgAdminUserId, ...validOrgAdminUserData } = orgAdminUser;
    const { id: orgAdminApprovedOrgUserLinkId, ...orgAdminApprovedOrgUserLinkData } =
      orgAdminApprovedOrgUserLink;
    const { id: nonOrgAdminApprovedOrgUserLinkId, ...nonOrgAdminApprovedOrgUserLinkData } =
      nonOrgAdminApprovedOrgUserLink;
    await testEnv.withSecurityRulesDisabled(async (context) => {
      const adminDb = context.firestore();
      const promises = [
        setDoc(doc(adminDb, organisationsCollectionName, organisationId), validOrganisationData),
        setDoc(doc(adminDb, usersCollectionName, nonOrgAdminUserId), validNonOrgAdminUserData),
        setDoc(doc(adminDb, usersCollectionName, orgAdminUserId), validOrgAdminUserData),
        setDoc(
          doc(adminDb, orgUserLinksCollectionName, orgAdminApprovedOrgUserLinkId),
          orgAdminApprovedOrgUserLinkData,
        ),
        setDoc(
          doc(adminDb, orgUserLinksCollectionName, nonOrgAdminApprovedOrgUserLinkId),
          nonOrgAdminApprovedOrgUserLinkData,
        ),
      ];
      await Promise.all(promises);
    });

    const authedDb = testEnv
      .authenticatedContext(nonOrgAdminApprovedOrgUserLinkData.uid)
      .firestore();
    const docRef = doc(authedDb, orgUserLinksCollectionName, orgAdminApprovedOrgUserLinkId);

    await expectFirestorePermissionDenied(deleteDoc(docRef));
  });

  it("allow get - loggedIn, orgUserLink", async () => {
    const { id: orgUserLinkId, ...validOrgUserLinkData } = nonOrgAdminApprovedOrgUserLink;

    await testEnv.withSecurityRulesDisabled(async (context) => {
      const adminDb = context.firestore();
      await setDoc(doc(adminDb, orgUserLinksCollectionName, orgUserLinkId), validOrgUserLinkData);
    });

    const authedDb = testEnv.authenticatedContext(validOrgUserLinkData.uid).firestore();
    await assertSucceeds(getDoc(doc(authedDb, orgUserLinksCollectionName, orgUserLinkId)));
  });

  it("allow get - loggedIn, orgAdmin", async () => {
    const { id: organisationId, ...validOrganisationData } = organisation;
    const { id: orgUserLinkId, ...validOrgUserLinkData } = nonOrgAdminApprovedOrgUserLink;
    const { id: orgAdminOrgUserLinkId, ...validOrgAdminOrgUserLinkData } =
      orgAdminApprovedOrgUserLink;

    await testEnv.withSecurityRulesDisabled(async (context) => {
      const adminDb = context.firestore();
      const promises = [
        setDoc(doc(adminDb, organisationsCollectionName, organisationId), validOrganisationData),
        setDoc(doc(adminDb, orgUserLinksCollectionName, orgUserLinkId), validOrgUserLinkData),
        setDoc(
          doc(adminDb, orgUserLinksCollectionName, orgAdminOrgUserLinkId),
          validOrgAdminOrgUserLinkData,
        ),
      ];
      await Promise.all(promises);
    });

    const authedDb = testEnv.authenticatedContext(orgAdminApprovedOrgUserLink.uid).firestore();
    await assertSucceeds(getDoc(doc(authedDb, orgUserLinksCollectionName, orgUserLinkId)));
  });

  it("allow list - loggedIn, orgUserLink", async () => {
    const { id: orgUserLinkId, ...validOrgUserLinkData } = nonOrgAdminApprovedOrgUserLink;
    const { id: orgUserLinkId2, ...validOrgUserLinkData2 } = nonOrgAdminApprovedOrgUserLink2;

    await testEnv.withSecurityRulesDisabled(async (context) => {
      const adminDb = context.firestore();
      const promises = [
        setDoc(doc(adminDb, orgUserLinksCollectionName, orgUserLinkId), validOrgUserLinkData),
        setDoc(doc(adminDb, orgUserLinksCollectionName, orgUserLinkId2), validOrgUserLinkData2),
      ];
      await Promise.all(promises);
    });

    const authedDb = testEnv.authenticatedContext(validOrgUserLinkData.uid).firestore();
    const q = query(
      collection(authedDb, orgUserLinksCollectionName),
      where("uid", "==", validOrgUserLinkData.uid),
    );

    await assertSucceeds(getDocs(q));
  });

  it("deny list - loggedOut", async () => {
    const { id: orgUserLinkId, ...validOrgUserLinkData } = nonOrgAdminApprovedOrgUserLink;
    const { id: orgUserLinkId2, ...validOrgUserLinkData2 } = nonOrgAdminApprovedOrgUserLink2;

    await testEnv.withSecurityRulesDisabled(async (context) => {
      const adminDb = context.firestore();
      const promises = [
        setDoc(doc(adminDb, orgUserLinksCollectionName, orgUserLinkId), validOrgUserLinkData),
        setDoc(doc(adminDb, orgUserLinksCollectionName, orgUserLinkId2), validOrgUserLinkData2),
      ];
      await Promise.all(promises);
    });

    const unauthedDb = testEnv.unauthenticatedContext().firestore();
    const q = query(
      collection(unauthedDb, orgUserLinksCollectionName),
      where("uid", "==", validOrgUserLinkData.uid),
    );

    await expectFirestorePermissionDenied(getDocs(q));
  });

  it("deny list - loggedOut", async () => {
    const { id: orgUserLinkId, ...validOrgUserLinkData } = nonOrgAdminApprovedOrgUserLink;
    const { id: orgUserLinkId2, ...validOrgUserLinkData2 } = nonOrgAdminApprovedOrgUserLink2;

    await testEnv.withSecurityRulesDisabled(async (context) => {
      const adminDb = context.firestore();
      const promises = [
        setDoc(doc(adminDb, orgUserLinksCollectionName, orgUserLinkId), validOrgUserLinkData),
        setDoc(doc(adminDb, orgUserLinksCollectionName, orgUserLinkId2), validOrgUserLinkData2),
      ];
      await Promise.all(promises);
    });

    const unauthedDb = testEnv.unauthenticatedContext().firestore();
    const q = query(
      collection(unauthedDb, orgUserLinksCollectionName),
      where("uid", "==", validOrgUserLinkData.uid),
      where("organisationId", "==", validOrgUserLinkData.organisationId),
    );

    await expectFirestorePermissionDenied(getDocs(q));
  });

  it("allow list - orgAdmin", async () => {
    const { id: orgId, ...validOrganisationData } = organisation;
    const { id: orgUserLinkId, ...validOrgUserLinkData } = nonOrgAdminApprovedOrgUserLink;
    const { id: orgUserLinkId2, ...validOrgUserLinkData2 } = nonOrgAdminApprovedOrgUserLink2;

    await testEnv.withSecurityRulesDisabled(async (context) => {
      const adminDb = context.firestore();
      const promises = [
        setDoc(doc(adminDb, organisationsCollectionName, orgId), validOrganisationData),
        setDoc(doc(adminDb, orgUserLinksCollectionName, orgUserLinkId), validOrgUserLinkData),
        setDoc(doc(adminDb, orgUserLinksCollectionName, orgUserLinkId2), validOrgUserLinkData2),
      ];
      await Promise.all(promises);
    });

    const authedDb = testEnv.authenticatedContext(orgAdminUser.id).firestore();
    const q = query(
      collection(authedDb, orgUserLinksCollectionName),
      where("uid", "==", validOrgUserLinkData.uid),
      where("organisationId", "==", validOrgUserLinkData.organisationId),
    );

    await assertSucceeds(getDocs(q));
  });

  it("allow list - orgUserLink", async () => {
    const { id: orgId, ...validOrganisationData } = organisation;
    const { id: orgUserLinkId, ...validOrgUserLinkData } = nonOrgAdminApprovedOrgUserLink;
    const { id: orgUserLinkId2, ...validOrgUserLinkData2 } = nonOrgAdminApprovedOrgUserLink2;

    await testEnv.withSecurityRulesDisabled(async (context) => {
      const adminDb = context.firestore();
      const promises = [
        setDoc(doc(adminDb, organisationsCollectionName, orgId), validOrganisationData),
        setDoc(doc(adminDb, orgUserLinksCollectionName, orgUserLinkId), validOrgUserLinkData),
        setDoc(doc(adminDb, orgUserLinksCollectionName, orgUserLinkId2), validOrgUserLinkData2),
      ];
      await Promise.all(promises);
    });

    const authedDb = testEnv.authenticatedContext(validOrgUserLinkData.uid).firestore();
    const q = query(
      collection(authedDb, orgUserLinksCollectionName),
      where("uid", "==", validOrgUserLinkData.uid),
      where("organisationId", "==", validOrgUserLinkData.organisationId),
    );

    await assertSucceeds(getDocs(q));
  });

  it("deny create - loggedOut", async () => {
    const { id: orgId, ...validOrganisationData } = organisation;
    const { id: orgUserLinkId, ...validOrgUserLinkData } = nonOrgAdminApprovedOrgUserLink;

    await testEnv.withSecurityRulesDisabled(async (context) => {
      const adminDb = context.firestore();
      const promises = [
        setDoc(doc(adminDb, organisationsCollectionName, orgId), validOrganisationData),
      ];
      await Promise.all(promises);
    });

    const unauthedDb = testEnv.unauthenticatedContext().firestore();
    await expectFirestorePermissionDenied(
      setDoc(doc(unauthedDb, orgUserLinksCollectionName, orgUserLinkId), validOrgUserLinkData),
    );
  });

  it("deny create - loggedIn create for different user", async () => {
    const { id: orgId, ...validOrganisationData } = organisation;
    const { id: orgUserLinkId, ...validOrgUserLinkData } = nonOrgAdminApprovedOrgUserLink;

    await testEnv.withSecurityRulesDisabled(async (context) => {
      const adminDb = context.firestore();
      const promises = [
        setDoc(doc(adminDb, organisationsCollectionName, orgId), validOrganisationData),
      ];
      await Promise.all(promises);
    });

    const authedDb = testEnv.authenticatedContext("someUid").firestore();
    await expectFirestorePermissionDenied(
      setDoc(doc(authedDb, orgUserLinksCollectionName, orgUserLinkId), validOrgUserLinkData),
    );
  });

  it("allow create - loggedIn create for current user", async () => {
    const { id: uid, ...validNonOrgAdminUserData } = nonOrgAdminUser;
    const nonOrgAdminPendingOrgUserLink = {
      ...nonOrgAdminApprovedOrgUserLink,
      approvalStatus: "pending",
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    };

    await testEnv.withSecurityRulesDisabled(async (context) => {
      const adminDb = context.firestore();
      const promises = [
        setDoc(doc(adminDb, organisationsCollectionName, organisation.id), organisation),
        setDoc(doc(adminDb, usersCollectionName, uid), validNonOrgAdminUserData),
      ];
      await Promise.all(promises);
    });

    const authedDb = testEnv.authenticatedContext(uid).firestore();
    await assertSucceeds(
      setDoc(
        doc(authedDb, orgUserLinksCollectionName, nonOrgAdminPendingOrgUserLink.id),
        nonOrgAdminPendingOrgUserLink,
      ),
    );
  });

  it("allow update - orgAdmin confirm approved user", async () => {
    await testEnv.withSecurityRulesDisabled(async (context) => {
      const adminDb = context.firestore();
      const promises = [
        setDoc(doc(adminDb, organisationsCollectionName, organisation.id), organisation),
        setDoc(doc(adminDb, usersCollectionName, orgAdminUser.id), orgAdminUser),
        setDoc(doc(adminDb, usersCollectionName, nonOrgAdminUser.id), nonOrgAdminUser),
        setDoc(
          doc(adminDb, orgUserLinksCollectionName, nonOrgAdminApprovedOrgUserLink.id),
          nonOrgAdminApprovedOrgUserLink,
        ),
      ];
      await Promise.all(promises);
    });

    const authedDb = testEnv.authenticatedContext(orgAdminUser.id).firestore();
    await assertSucceeds(
      setDoc(doc(authedDb, orgUserLinksCollectionName, nonOrgAdminApprovedOrgUserLink.id), {
        ...nonOrgAdminApprovedOrgUserLink,
        approvalStatus: "approved",
        updatedAt: serverTimestamp(),
      }),
    );
  });

  it("allow update - orgAdmin approves user", async () => {
    await testEnv.withSecurityRulesDisabled(async (context) => {
      const adminDb = context.firestore();
      const promises = [
        setDoc(doc(adminDb, organisationsCollectionName, organisation2.id), organisation2),
        setDoc(doc(adminDb, usersCollectionName, orgAdminUser.id), orgAdminUser),
        setDoc(doc(adminDb, usersCollectionName, nonOrgAdminUser.id), nonOrgAdminUser),
        setDoc(
          doc(adminDb, orgUserLinksCollectionName, nonOrgAdminPendingOrgUserLink1.id),
          nonOrgAdminPendingOrgUserLink1,
        ),
      ];
      await Promise.all(promises);
    });

    const authedDb = testEnv.authenticatedContext(orgAdminUser.id).firestore();
    await assertSucceeds(
      setDoc(doc(authedDb, orgUserLinksCollectionName, nonOrgAdminPendingOrgUserLink1.id), {
        ...nonOrgAdminPendingOrgUserLink1,
        approvalStatus: "approved",
        updatedAt: serverTimestamp(),
      }),
    );
  });

  it("deny update - nonOrgAdmin approves user", async () => {
    const { id: orgId, ...validOrganisationData } = organisation;
    const { id: nonOrgAdminUid, ...validNonOrgAdminUserData } = nonOrgAdminUser;
    const { id: _, ...validOrgAdminUserData } = orgAdminUser;
    const { id: orgUserLinkId, ...validOrgUserLinkData } = {
      ...nonOrgAdminApprovedOrgUserLink,
      approvalStatus: "pending",
    };

    await testEnv.withSecurityRulesDisabled(async (context) => {
      const adminDb = context.firestore();
      const promises = [
        setDoc(doc(adminDb, organisationsCollectionName, orgId), validOrganisationData),
        setDoc(doc(adminDb, usersCollectionName, validOrgAdminUserData.uid), validOrgAdminUserData),
        setDoc(
          doc(adminDb, usersCollectionName, validNonOrgAdminUserData.uid),
          validNonOrgAdminUserData,
        ),
        setDoc(doc(adminDb, orgUserLinksCollectionName, orgUserLinkId), validOrgUserLinkData),
      ];
      await Promise.all(promises);
    });

    const authedDb = testEnv.authenticatedContext(nonOrgAdminUid).firestore();
    await expectFirestorePermissionDenied(
      setDoc(
        doc(authedDb, orgUserLinksCollectionName, orgUserLinkId),
        { approvalStatus: "approved", updatedAt: serverTimestamp() },
        { merge: true },
      ),
    );
  });

  // it("deny create - loggedIn, is orgAdmin additional keyValues", async () => {
  //   const { id: projId, ...validProjectData } = validProject;
  //   const { id: orgId, ...validOrganisationData } = validOrganisation;
  //   const { id: uid, ...validNonAdminUserData } = validNonAdminUser;

  //   await testEnv.withSecurityRulesDisabled(async (context) => {
  //     const adminDb = context.firestore();
  //     const promises = [
  //       setDoc(doc(adminDb, organisationsCollectionName, orgId), validOrganisationData),
  //       setDoc(doc(adminDb, usersCollectionName, uid), validNonAdminUserData),
  //     ];
  //     await Promise.all(promises);
  //   });
  //   const authedDb = testEnv.authenticatedContext(uid).firestore();
  //   const newProj = {
  //     ...validProjectData,
  //     createdAt: serverTimestamp(),
  //     updatedAt: serverTimestamp(),
  //     extra: "key",
  //   };
  //   await expectFirestorePermissionDenied(
  //     setDoc(doc(authedDb, projectsCollectionName, projId), newProj),
  //   );
  // });

  // it("deny create - loggedIn, missing keyValues", async () => {
  //   const { id: projId, ...validProjectData } = validProject;
  //   const { id: orgId, ...validOrganisationData } = validOrganisation;
  //   const { id: uid, ...validNonAdminUserData } = validNonAdminUser;

  //   await testEnv.withSecurityRulesDisabled(async (context) => {
  //     const adminDb = context.firestore();
  //     const promises = [
  //       setDoc(doc(adminDb, organisationsCollectionName, orgId), validOrganisationData),
  //       setDoc(doc(adminDb, usersCollectionName, uid), validNonAdminUserData),
  //     ];
  //     await Promise.all(promises);
  //   });
  //   const authedDb = testEnv.authenticatedContext(uid).firestore();
  //   const newProj = {
  //     ...validProjectData,
  //     createdAt: serverTimestamp(),
  //     updatedAt: serverTimestamp(),
  //   };
  //   const { organisationId: _organisationId, ...invalidProject1 } = newProj;
  //   const { projectName: _projectName, ...invalidProject2 } = newProj;
  //   const { createdAt: _createdAt, ...invalidProject3 } = newProj;
  //   const { updatedAt: _updatedAt, ...invalidProject4 } = newProj;
  //   const invalidProjects = [invalidProject1, invalidProject2, invalidProject3, invalidProject4];
  //   for (const invalidProject of invalidProjects) {
  //     await expectFirestorePermissionDenied(
  //       setDoc(doc(authedDb, organisationsCollectionName, projId), invalidProject),
  //     );
  //   }
  // });

  // it("deny create - loggedIn, incorrect keyValue types", async () => {
  //   const { id: projId, ...validProjectData } = validProject;
  //   const { id: orgId, ...validOrganisationData } = validOrganisation;
  //   const { id: uid, ...validNonAdminUserData } = validNonAdminUser;

  //   await testEnv.withSecurityRulesDisabled(async (context) => {
  //     const adminDb = context.firestore();
  //     const promises = [
  //       setDoc(doc(adminDb, organisationsCollectionName, orgId), validOrganisationData),
  //       setDoc(doc(adminDb, usersCollectionName, uid), validNonAdminUserData),
  //     ];
  //     await Promise.all(promises);
  //   });
  //   const authedDb = testEnv.authenticatedContext(uid).firestore();
  //   const newProj = {
  //     ...validProjectData,
  //     createdAt: serverTimestamp(),
  //     updatedAt: serverTimestamp(),
  //   };
  //   const invalidProject1 = { ...newProj, organisationId: 123 };
  //   const invalidProject2 = { ...newProj, projectName: 321 };
  //   const invalidProject3 = { ...newProj, createdAt: "createdAt" };
  //   const invalidProject4 = { ...newProj, updatedAt: "updatedAt" };
  //   const invalidProjects = [invalidProject1, invalidProject2, invalidProject3, invalidProject4];
  //   for (const invalidProject of invalidProjects) {
  //     await expectFirestorePermissionDenied(
  //       setDoc(doc(authedDb, organisationsCollectionName, projId), invalidProject),
  //     );
  //   }
  // });

  // it("deny create - loggedOut", async () => {
  //   const { id: projId, ...validProjectData } = validProject;
  //   const unauthedDb = testEnv.unauthenticatedContext().firestore();
  //   await expectFirestorePermissionDenied(
  //     setDoc(doc(unauthedDb, projectsCollectionName, projId), validProjectData),
  //   );
  // });

  // it("deny create - loggedIn", async () => {
  //   const { id: projId, ...validProjectData } = validProject;
  //   const authedDb = testEnv.authenticatedContext("someUid").firestore();
  //   await expectFirestorePermissionDenied(
  //     setDoc(doc(authedDb, projectsCollectionName, projId), validProjectData),
  //   );
  // });
});
