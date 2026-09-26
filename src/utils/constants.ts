import { SetupDataStorage } from './setup-data';

// ── CONFIGURE FOR YOUR APP ──
// Update this interface and getCommonTestData() to match the entities
// your application uses (users, accounts, projects, etc.)
interface CommonTestData {
  testUser: string;
  adminUser: string;
}

export function getCommonTestData(): CommonTestData {
  const setupData = SetupDataStorage.load();

  return {
    testUser: setupData?.testUser || process.env.TEST_USER_EMAIL || '',
    adminUser: setupData?.adminUser || process.env.ADMIN_EMAIL || '',
  };
}
