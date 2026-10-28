/**
 * Auth & RBAC Authorization Unit Tests
 */

import jwt from 'jsonwebtoken';

export interface UserAuthTest {
  _id: string;
  username: string;
  role: 'admin' | 'manager' | 'staff' | 'lecturer' | 'student' | 'member' | 'system' | 'viewer';
  isApproved: boolean;
}

export const generateTestToken = (userId: string, secret: string): string => {
  return jwt.sign({ id: userId }, secret, { expiresIn: '1h' });
};

export const verifyTestToken = (token: string, secret: string): { id: string } | null => {
  try {
    return jwt.verify(token, secret) as { id: string };
  } catch {
    return null;
  }
};

export const canAccessAdminRoute = (user: UserAuthTest): boolean => {
  return user.isApproved && user.role === 'admin';
};

export const canManageShowsGuard = (user: UserAuthTest): boolean => {
  return user.isApproved && (user.role === 'admin' || user.role === 'manager' || user.role === 'staff');
};

export const runAuthTests = (): { passed: boolean; details: string[] } => {
  const details: string[] = [];
  let passed = true;
  const testSecret = "test_secret_key_999";

  // Test 1: JWT token generation & verification
  const token = generateTestToken("user_12345", testSecret);
  const decoded = verifyTestToken(token, testSecret);

  if (decoded && decoded.id === "user_12345") {
    details.push("✅ Test 1 Passed: JWT generation and verification verified.");
  } else {
    passed = false;
    details.push("❌ Test 1 Failed: Token verification failed.");
  }

  // Test 2: Invalid JWT signature rejection
  const invalidDecoded = verifyTestToken(token, "wrong_secret");
  if (invalidDecoded === null) {
    details.push("✅ Test 2 Passed: Reject token with invalid signature.");
  } else {
    passed = false;
    details.push("❌ Test 2 Failed: Accepted token with wrong signature.");
  }

  // Test 3: RBAC Guard
  const adminUser: UserAuthTest = { _id: "a1", username: "admin", role: "admin", isApproved: true };
  const memberUser: UserAuthTest = { _id: "m1", username: "member", role: "member", isApproved: true };
  const managerUser: UserAuthTest = { _id: "mg1", username: "manager_ctsv", role: "manager", isApproved: true };
  const lecturerUser: UserAuthTest = { _id: "lec1", username: "lecturer_music", role: "lecturer", isApproved: true };
  const studentUser: UserAuthTest = { _id: "stu1", username: "student_guitar", role: "student", isApproved: true };

  if (canAccessAdminRoute(adminUser) && !canAccessAdminRoute(memberUser) && !canAccessAdminRoute(managerUser)) {
    details.push("✅ Test 3 Passed: Correctly enforced Admin RBAC permissions.");
  } else {
    passed = false;
    details.push("❌ Test 3 Failed: RBAC permissions guard failed.");
  }

  // Test 4: Show Manager Guard (Admin & Cán bộ phòng ban phụ trách xếp show)
  if (
    canManageShowsGuard(adminUser) &&
    canManageShowsGuard(managerUser) &&
    !canManageShowsGuard(lecturerUser) &&
    !canManageShowsGuard(studentUser)
  ) {
    details.push("✅ Test 4 Passed: Correctly enforced Department Staff (CTSV / Bộ môn) show management permissions.");
  } else {
    passed = false;
    details.push("❌ Test 4 Failed: Department Staff show management guard failed.");
  }

  return { passed, details };
};
