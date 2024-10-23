import { TOrganisationDbEntry } from "@/db/dbOrganisations";
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
} from "firebase/firestore";
import {
  createTestEnvironment,
  expectFirestorePermissionDenied,
  setDefaultLogLevel,
} from "./firestoreTestUtils";
import { TUserDbEntry } from "@/db/dbUsers";

let testEnv: RulesTestEnvironment;
const organisationsCollectionName = "organisations";
const usersCollectionName = "users";

const validOrganisation: TOrganisationDbEntry = {
  id: "organisation1",
  organisationName: "organisation1",
  subtitle: "this is the organisation1 subtitle",
  description: "this is the organisation1 description",
  imageUrl:
    "https://masterbundles.com/wp-content/uploads/2022/03/1-nike-logo-design-%E2%80%93-history-meaning-and-evolution.png",
  imageUrls: { asd: "123" },
  createdAt: Timestamp.now(),
  updatedAt: Timestamp.now(),
  adminUids: [],
};
const validOrganisation2: TOrganisationDbEntry = {
  id: "organisation2",
  organisationName: "organisation2",
  subtitle: "this is the organisation2 subtitle",
  description: "this is the organisation2 description",
  imageUrl:
    "https://cdn.shopify.com/s/files/1/0558/6413/1764/files/Rewrite_Reebok_Logo_Design_History_Evolution_0_1024x1024.jpg?v=1695309461",
  imageUrls: {},
  createdAt: Timestamp.now(),
  updatedAt: Timestamp.now(),
  adminUids: [],
};
const initValidAdminUser: TUserDbEntry = {
  id: "idAdmin1",
  uid: "idAdmin1",
  email: "admin@aol.com",
  userName: "admin1",
  isAdmin: true,
  createdAt: Timestamp.now(),
  updatedAt: Timestamp.now(),
};
const validAdminUser = {
  ...initValidAdminUser,
  createdAt: serverTimestamp(),
  updatedAt: serverTimestamp(),
};
const initValidNonAdminUser = {
  id: "idNonAdmin1",
  uid: "idNonAdmin1",
  email: "nonadmin@aol.com",
  isAdmin: false,
  createdAt: serverTimestamp(),
  updatedAt: serverTimestamp(),
};

describe("firestore rules for organisations collection", () => {
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
      const docRef = doc(adminDb, organisationsCollectionName, validOrganisation.id);
      await setDoc(docRef, validOrganisation);
    });

    const unauthedDb = testEnv.unauthenticatedContext().firestore();
    const docRef = doc(unauthedDb, organisationsCollectionName, validOrganisation.id);

    await expectFirestorePermissionDenied(deleteDoc(docRef));
  });

  it("deny delete - loggedIn", async () => {
    const uid = "someUid";
    await testEnv.withSecurityRulesDisabled(async (context) => {
      const adminDb = context.firestore();
      const docRef = doc(adminDb, organisationsCollectionName, validOrganisation.id);
      await setDoc(docRef, validOrganisation);
    });

    const authedDb = testEnv.authenticatedContext(uid).firestore();
    const docRef = doc(authedDb, organisationsCollectionName, validOrganisation.id);

    await expectFirestorePermissionDenied(deleteDoc(docRef));
  });

  it("deny delete - orgAdminUser", async () => {
    const validOrganisationData = { ...validOrganisation, adminUids: [initValidNonAdminUser.id] };

    await testEnv.withSecurityRulesDisabled(async (context) => {
      const adminDb = context.firestore();
      const promises = [
        setDoc(
          doc(adminDb, organisationsCollectionName, validOrganisationData.id),
          validOrganisationData,
        ),
        setDoc(doc(adminDb, usersCollectionName, initValidNonAdminUser.id), initValidNonAdminUser),
      ];
      await Promise.all(promises);
    });

    const authedDb = testEnv.authenticatedContext(initValidNonAdminUser.id).firestore();

    await expectFirestorePermissionDenied(
      deleteDoc(doc(authedDb, organisationsCollectionName, validOrganisationData.id)),
    );
  });

  it("allow get - loggedOut", async () => {
    await testEnv.withSecurityRulesDisabled(async (context) => {
      const adminDb = context.firestore();
      await setDoc(
        doc(adminDb, organisationsCollectionName, validOrganisation.id),
        validOrganisation,
      );
    });

    const unauthedDb = testEnv.unauthenticatedContext().firestore();
    await assertSucceeds(
      getDoc(doc(unauthedDb, organisationsCollectionName, validOrganisation.id)),
    );
  });

  it("allow get - loggedIn", async () => {
    await testEnv.withSecurityRulesDisabled(async (context) => {
      const adminDb = context.firestore();
      await setDoc(
        doc(adminDb, organisationsCollectionName, validOrganisation.id),
        validOrganisation,
      );
    });

    const authedDb = testEnv.authenticatedContext("someUid").firestore();
    await assertSucceeds(getDoc(doc(authedDb, organisationsCollectionName, validOrganisation.id)));
  });

  it("allow list - loggedOut", async () => {
    await testEnv.withSecurityRulesDisabled(async (context) => {
      const adminDb = context.firestore();
      const promises = [
        setDoc(doc(adminDb, organisationsCollectionName, validOrganisation.id), validOrganisation),
        setDoc(
          doc(adminDb, organisationsCollectionName, validOrganisation2.id),
          validOrganisation2,
        ),
      ];
      await Promise.all(promises);
    });

    const unauthedDb = testEnv.unauthenticatedContext().firestore();
    await assertSucceeds(getDocs(query(collection(unauthedDb, organisationsCollectionName))));
  });

  it("allow list - loggedIn", async () => {
    await testEnv.withSecurityRulesDisabled(async (context) => {
      const adminDb = context.firestore();
      const promises = [
        setDoc(doc(adminDb, organisationsCollectionName, validOrganisation.id), validOrganisation),
        setDoc(
          doc(adminDb, organisationsCollectionName, validOrganisation2.id),
          validOrganisation2,
        ),
      ];
      await Promise.all(promises);
    });

    const authedDb = testEnv.authenticatedContext("someUid").firestore();
    await assertSucceeds(getDocs(query(collection(authedDb, organisationsCollectionName))));
  });

  it("allow create - appAdmin", async () => {
    await testEnv.withSecurityRulesDisabled(async (context) => {
      const adminDb = context.firestore();
      await setDoc(doc(adminDb, usersCollectionName, validAdminUser.id), validAdminUser);
    });

    const authedDb = testEnv.authenticatedContext(validAdminUser.id).firestore();
    await assertSucceeds(
      setDoc(doc(authedDb, organisationsCollectionName, validOrganisation.id), {
        ...validOrganisation,
        adminUids: [validAdminUser.id],
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      }),
    );
  });

  it("deny create - nonAppAdmin", async () => {
    await testEnv.withSecurityRulesDisabled(async (context) => {
      const adminDb = context.firestore();
      await setDoc(
        doc(adminDb, usersCollectionName, initValidNonAdminUser.id),
        initValidNonAdminUser,
      );
    });

    const authedDb = testEnv.authenticatedContext(initValidNonAdminUser.id).firestore();
    await expectFirestorePermissionDenied(
      setDoc(doc(authedDb, organisationsCollectionName, validOrganisation.id), {
        ...validOrganisation,
        adminUids: [initValidNonAdminUser.id],
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      }),
    );
  });

  it("deny create - loggedOut", async () => {
    const unauthedDb = testEnv.unauthenticatedContext().firestore();
    const newOrg = {
      ...validOrganisation,
      adminUids: [],
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    };
    const newOrg2 = { ...newOrg, adminUids: ["someUid"] };
    // purposefully sequential (not concurrent) - to update, not create
    await expectFirestorePermissionDenied(
      setDoc(doc(unauthedDb, organisationsCollectionName, validOrganisation.id), newOrg),
    );
    await expectFirestorePermissionDenied(
      setDoc(doc(unauthedDb, organisationsCollectionName, validOrganisation.id), newOrg2),
    );
  });

  it("deny create - appAdmin, additional keyValues", async () => {
    await testEnv.withSecurityRulesDisabled(async (context) => {
      const adminDb = context.firestore();
      await setDoc(doc(adminDb, usersCollectionName, validAdminUser.id), validAdminUser);
    });

    const authedDb = testEnv.authenticatedContext(validAdminUser.id).firestore();
    await expectFirestorePermissionDenied(
      setDoc(doc(authedDb, organisationsCollectionName, validOrganisation.id), {
        ...validOrganisation,
        adminUids: [validAdminUser.id],
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
        extra: "key",
      }),
    );
  });

  it("deny create - appAdmin, missing keyValues", async () => {
    await testEnv.withSecurityRulesDisabled(async (context) => {
      const adminDb = context.firestore();
      await setDoc(doc(adminDb, usersCollectionName, validAdminUser.id), validAdminUser);
    });

    const validNewOrg = {
      ...validOrganisation,
      adminUids: [validAdminUser.id],
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    };
    const { adminUids: _adminUids, ...invalidOrganisation1 } = validNewOrg;
    const { organisationName: _organisationName, ...invalidOrganisation2 } = validNewOrg;
    const { createdAt: _createdAt, ...invalidOrganisation3 } = validNewOrg;
    const { updatedAt: _updatedAt, ...invalidOrganisation4 } = validNewOrg;
    const invalidOrganisations = [
      invalidOrganisation1,
      invalidOrganisation2,
      invalidOrganisation3,
      invalidOrganisation4,
    ];

    const authedDb = testEnv.authenticatedContext(validAdminUser.id).firestore();
    // purposefully sequential (not concurrent) - to avoid an update, not create
    for (const invalidOrganisation of invalidOrganisations) {
      await expectFirestorePermissionDenied(
        setDoc(
          doc(authedDb, organisationsCollectionName, validOrganisation.id),
          invalidOrganisation,
        ),
      );
    }
  });
});
