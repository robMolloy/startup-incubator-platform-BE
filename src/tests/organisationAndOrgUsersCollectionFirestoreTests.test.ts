import { TOrganisationDbEntry } from "@/db/dbOrganisations";
import { TOrgUserLinkDbEntry } from "@/db/dbOrgUserLinks";
import { TUserDbEntry } from "@/db/dbUsers";
import { assertSucceeds, RulesTestEnvironment } from "@firebase/rules-unit-testing";
import { doc, serverTimestamp, setDoc, Timestamp } from "firebase/firestore";
import { createTestEnvironment, setDefaultLogLevel } from "./firestoreTestUtils";

let testEnv: RulesTestEnvironment;
const usersCollectionName = "users";
const organisationsCollectionName = "organisations";
const orgUserLinksCollectionName = "orgUserLinks";

const appAdminUser: TUserDbEntry = {
  id: "idOrgAdmin1",
  uid: "idOrgAdmin1",
  email: "orgadmin@aol.com",
  isAdmin: true,
  createdAt: Timestamp.now(),
  updatedAt: Timestamp.now(),
  userName: "orgAdmin",
};
const validOrganisation: TOrganisationDbEntry = {
  id: "organisation1",
  organisationName: "organisation1",
  subtitle: "this is the organisation1 subtitle",
  description: "this is the organisation1 description",
  imageUrl:
    "https://masterbundles.com/wp-content/uploads/2022/03/1-nike-logo-design-%E2%80%93-history-meaning-and-evolution.png",
  imageUrls: {},
  createdAt: Timestamp.now(),
  updatedAt: Timestamp.now(),
  adminUids: [appAdminUser.uid],
};
const appAdminApprovedOrgUserLink: TOrgUserLinkDbEntry = {
  id: `${validOrganisation.id}_${appAdminUser.id}`,
  organisationId: validOrganisation.id,
  createdAt: Timestamp.now(),
  updatedAt: Timestamp.now(),
  uid: appAdminUser.id,
  approvalStatus: "approved",
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

  it("allow create - appAdmin creates organisation and then creates approved orgUserLink", async () => {
    await testEnv.withSecurityRulesDisabled(async (context) => {
      const adminDb = context.firestore();
      await setDoc(doc(adminDb, usersCollectionName, appAdminUser.id), appAdminUser);
    });

    const authedDb = testEnv.authenticatedContext(appAdminUser.id).firestore();
    await assertSucceeds(
      setDoc(doc(authedDb, organisationsCollectionName, validOrganisation.id), {
        ...validOrganisation,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      }),
    );
    await assertSucceeds(
      setDoc(doc(authedDb, orgUserLinksCollectionName, appAdminApprovedOrgUserLink.id), {
        ...appAdminApprovedOrgUserLink,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      }),
    );
  });
});
