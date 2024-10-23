import { TOrganisationDbEntry } from "@/db/dbOrganisations";
import { orgUserLinkDbEntrySchema, TOrgUserLinkDbEntry } from "@/db/dbOrgUserLinks";
import { TUserDbEntry } from "@/db/dbUsers";
import { assertSucceeds, RulesTestEnvironment } from "@firebase/rules-unit-testing";
import { doc, getDoc, serverTimestamp, setDoc, Timestamp } from "firebase/firestore";
import { createTestEnvironment, setDefaultLogLevel } from "./firestoreTestUtils";

let testEnv: RulesTestEnvironment;
const usersCollectionName = "users";
const organisationsCollectionName = "organisations";
const orgUserLinksCollectionName = "orgUserLinks";

const user1: TUserDbEntry = {
  id: "uid1",
  createdAt: Timestamp.now(),
  updatedAt: Timestamp.now(),
  uid: "uid1",
  isAdmin: false,
  email: "uid1@uid1.com",
  userName: "nonAdmin1",
};
const newUser1 = { ...user1, createdAt: serverTimestamp(), updatedAt: serverTimestamp() };

const user2: TUserDbEntry = {
  id: "uid2",
  createdAt: Timestamp.now(),
  updatedAt: Timestamp.now(),
  uid: "uid2",
  isAdmin: false,
  email: "uid2@uid2.com",
  userName: "nonAdmin2",
};
const newUser2 = { ...user2, createdAt: serverTimestamp(), updatedAt: serverTimestamp() };

const org1: TOrganisationDbEntry = {
  id: "organisation1Id",
  organisationName: "uon",
  subtitle: "uon",
  description: "uon",
  imageUrl: "https://asd.com",
  imageUrls: {},
  adminUids: [user1.id],
  createdAt: Timestamp.now(),
  updatedAt: Timestamp.now(),
};
const newOrg1 = { ...org1, createdAt: serverTimestamp(), updatedAt: serverTimestamp() };

const orgUserLink1: TOrgUserLinkDbEntry = {
  id: `${org1.id}_${user1.id}`,
  uid: user1.id,
  createdAt: Timestamp.now(),
  updatedAt: Timestamp.now(),
  organisationId: org1.id,
  approvalStatus: "approved",
};
const newOrgUserLink1 = {
  ...orgUserLink1,
  createdAt: serverTimestamp(),
  updatedAt: serverTimestamp(),
};

const orgUserLink2: TOrgUserLinkDbEntry = {
  id: `${org1.id}_${user2.id}`,
  uid: user2.id,
  createdAt: Timestamp.now(),
  updatedAt: Timestamp.now(),
  organisationId: org1.id,
  approvalStatus: "pending",
};
const newOrgUserLink2 = {
  ...orgUserLink2,
  createdAt: serverTimestamp(),
  updatedAt: serverTimestamp(),
};
/*
user1:
- creates an account
- upgraded to appAdmin (withSecurityRulesDisabled)
- creates org1 (as admin) and related orgUserLink

user2
- creates an account
- requests access to organisation
*/

describe("userJourneyTest1:", () => {
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

  it("is success", async () => {
    const uid1Db = testEnv.authenticatedContext(user1.id, { email: newUser1.email }).firestore();
    await assertSucceeds(setDoc(doc(uid1Db, usersCollectionName, user1.id), newUser1));

    await testEnv.withSecurityRulesDisabled(async (context) => {
      const adminDb = context.firestore();
      await setDoc(doc(adminDb, usersCollectionName, user1.id), { ...newUser1, isAdmin: true });
    });

    await assertSucceeds(setDoc(doc(uid1Db, organisationsCollectionName, org1.id), newOrg1));
    await assertSucceeds(
      setDoc(doc(uid1Db, orgUserLinksCollectionName, orgUserLink1.id), newOrgUserLink1),
    );

    const uid2Db = testEnv.authenticatedContext(user2.id, { email: newUser2.email }).firestore();
    await assertSucceeds(setDoc(doc(uid2Db, usersCollectionName, user2.id), newUser2));

    await assertSucceeds(
      setDoc(doc(uid2Db, orgUserLinksCollectionName, orgUserLink2.id), newOrgUserLink2),
    );
    const docSnapshot = await assertSucceeds(
      getDoc(doc(uid2Db, orgUserLinksCollectionName, orgUserLink2.id)),
    );

    const receivedOrgUserLink2DbEntry = docSnapshot.data();
    const receivedOrgUserLink2DbEntryResponse = orgUserLinkDbEntrySchema.safeParse(
      receivedOrgUserLink2DbEntry,
    );

    expect(receivedOrgUserLink2DbEntryResponse.success).toBe(true);

    if (!receivedOrgUserLink2DbEntryResponse.success) return;

    const receivedOrgUserLink2Data = receivedOrgUserLink2DbEntryResponse.data;

    await assertSucceeds(
      setDoc(doc(uid1Db, orgUserLinksCollectionName, orgUserLink2.id), {
        ...receivedOrgUserLink2Data,
        updatedAt: serverTimestamp(),
      }),
    );
  });
});
