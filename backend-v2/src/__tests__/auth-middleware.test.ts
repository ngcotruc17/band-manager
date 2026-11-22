/**
 * Express Auth Middleware & RBAC Security Unit Tests
 */

import fs from 'fs';
import path from 'path';
import jwt from 'jsonwebtoken';
import { admin, canManageShows, protect } from '../middleware/auth';
import { login, changePasswordFirstTime, resetUserPassword, generateToken } from '../controllers/auth.controller';
import User from '../models/User';
import {
  createMockNext,
  createMockRequest,
  createMockResponse,
  createQueryMock,
  isPrivateIP,
  withMockModel
} from './test-utils';

export const runAuthMiddlewareTests = async (): Promise<{ passed: boolean; details: string[] }> => {
  const details: string[] = [];
  let passed = true;
  const jwtSecret = process.env.JWT_SECRET || 'mat_khau_bi_mat_cua_ban_123456';

  // ----------------------------------------------------
  // Test 1: Admin Middleware - Allows Admin User
  // ----------------------------------------------------
  const adminReq = createMockRequest({ user: { role: 'admin', isApproved: true } as any });
  const adminRes = createMockResponse();
  const adminNext = createMockNext();

  admin(adminReq, adminRes as any, adminNext);

  if (adminNext.called && adminRes.statusCode === 200) {
    details.push("✅ Test 1 Passed: Admin middleware permits user with role='admin'.");
  } else {
    passed = false;
    details.push(`❌ Test 1 Failed: Admin was not permitted, status=${adminRes.statusCode}`);
  }

  // ----------------------------------------------------
  // Test 2: Admin Middleware - Rejects Non-Admin with 403
  // ----------------------------------------------------
  const memberReq = createMockRequest({ user: { role: 'member', isApproved: true } as any });
  const memberRes = createMockResponse();
  const memberNext = createMockNext();

  admin(memberReq, memberRes as any, memberNext);

  if (!memberNext.called && memberRes.statusCode === 403 && memberRes._jsonData?.message?.includes("Admin")) {
    details.push("✅ Test 2 Passed: Admin middleware rejects regular member with 403 Forbidden.");
  } else {
    passed = false;
    details.push(`❌ Test 2 Failed: Member was not rejected with 403, got status=${memberRes.statusCode}`);
  }

  // ----------------------------------------------------
  // Test 3: canManageShows - Allows Admin, Manager (CTSV), and Staff (Bộ môn)
  // ----------------------------------------------------
  const showAdminReq = createMockRequest({ user: { role: 'admin', isApproved: true } as any });
  const showManagerReq = createMockRequest({ user: { role: 'manager', isApproved: true } as any });
  const showStaffReq = createMockRequest({ user: { role: 'staff', isApproved: true } as any });

  const resA = createMockResponse();
  const resM = createMockResponse();
  const resS = createMockResponse();

  const nextA = createMockNext();
  const nextM = createMockNext();
  const nextS = createMockNext();

  canManageShows(showAdminReq, resA as any, nextA);
  canManageShows(showManagerReq, resM as any, nextM);
  canManageShows(showStaffReq, resS as any, nextS);

  if (nextA.called && nextM.called && nextS.called) {
    details.push("✅ Test 3 Passed: canManageShows permits Admin, Manager (CTSV), and Staff (Bộ môn).");
  } else {
    passed = false;
    details.push("❌ Test 3 Failed: canManageShows failed to permit authorized roles.");
  }

  // ----------------------------------------------------
  // Test 4: canManageShows - Blocks Student, Lecturer, and Member with 403
  // ----------------------------------------------------
  const studentReq = createMockRequest({ user: { role: 'student', isApproved: true } as any });
  const lecturerReq = createMockRequest({ user: { role: 'lecturer', isApproved: true } as any });
  const normalMemberReq = createMockRequest({ user: { role: 'member', isApproved: true } as any });

  const resStudent = createMockResponse();
  const resLecturer = createMockResponse();
  const resMember = createMockResponse();

  const nextStudent = createMockNext();
  const nextLecturer = createMockNext();
  const nextMember = createMockNext();

  canManageShows(studentReq, resStudent as any, nextStudent);
  canManageShows(lecturerReq, resLecturer as any, nextLecturer);
  canManageShows(normalMemberReq, resMember as any, nextMember);

  if (
    !nextStudent.called && resStudent.statusCode === 403 &&
    !nextLecturer.called && resLecturer.statusCode === 403 &&
    !nextMember.called && resMember.statusCode === 403
  ) {
    details.push("✅ Test 4 Passed: canManageShows blocks Student, Lecturer, and Member with 403 Forbidden.");
  } else {
    passed = false;
    details.push("❌ Test 4 Failed: canManageShows failed to reject unauthorized roles.");
  }

  // ----------------------------------------------------
  // Test 5: protect Middleware - Missing Authorization Header Rejection with 401
  // ----------------------------------------------------
  const noAuthReq = createMockRequest({ headers: {} });
  const noAuthRes = createMockResponse();
  const noAuthNext = createMockNext();

  await protect(noAuthReq, noAuthRes as any, noAuthNext);

  if (!noAuthNext.called && noAuthRes.statusCode === 401 && noAuthRes._jsonData?.message?.includes("chưa đăng nhập")) {
    details.push("✅ Test 5 Passed: protect rejects missing Authorization header with HTTP 401.");
  } else {
    passed = false;
    details.push(`❌ Test 5 Failed: Expected 401 for missing auth header, got ${noAuthRes.statusCode}`);
  }

  // ----------------------------------------------------
  // Test 6: protect Middleware - Invalid / Malformed Token Rejection with 401
  // ----------------------------------------------------
  const origConsoleError = console.error;
  console.error = () => {}; // silence expected jwt error log
  try {
    const invalidTokenReq = createMockRequest({
      headers: { authorization: 'Bearer invalid.token.payload' }
    });
    const invalidTokenRes = createMockResponse();
    const invalidTokenNext = createMockNext();

    await protect(invalidTokenReq, invalidTokenRes as any, invalidTokenNext);

    if (!invalidTokenNext.called && invalidTokenRes.statusCode === 401 && invalidTokenRes._jsonData?.message?.includes("không hợp lệ")) {
      details.push("✅ Test 6 Passed: protect rejects malformed/invalid token with HTTP 401.");
    } else {
      passed = false;
      details.push(`❌ Test 6 Failed: Expected 401 for malformed token, got ${invalidTokenRes.statusCode}`);
    }
  } finally {
    console.error = origConsoleError;
  }

  // ----------------------------------------------------
  // Test 7: protect Middleware - Banned User Status Rejection with 403
  // ----------------------------------------------------
  const bannedToken = jwt.sign({ id: "user_banned_id" }, jwtSecret, { expiresIn: '1h' });
  const bannedReq = createMockRequest({
    headers: { authorization: `Bearer ${bannedToken}` }
  });
  const bannedRes = createMockResponse();
  const bannedNext = createMockNext();

  await withMockModel(
    User,
    'findById',
    (id: string) => {
      return createQueryMock({
        _id: id,
        fullName: "Banned Member",
        role: "member",
        status: "banned",
        isApproved: true
      });
    },
    async () => {
      await protect(bannedReq, bannedRes as any, bannedNext);
    }
  );

  if (!bannedNext.called && bannedRes.statusCode === 403 && bannedRes._jsonData?.message?.includes("khóa")) {
    details.push("✅ Test 7 Passed: protect rejects banned user account with HTTP 403 ('Tài khoản của bạn đã bị khóa').");
  } else {
    passed = false;
    details.push(`❌ Test 7 Failed: Expected 403 for banned user, got status=${bannedRes.statusCode}`);
  }

  // ----------------------------------------------------
  // Test 8: protect Middleware - Unapproved Member Rejection & Active Member Pass
  // ----------------------------------------------------
  const unapprovedToken = jwt.sign({ id: "user_pending_id" }, jwtSecret, { expiresIn: '1h' });
  const unapprovedReq = createMockRequest({
    headers: { authorization: `Bearer ${unapprovedToken}` }
  });
  const unapprovedRes = createMockResponse();
  const unapprovedNext = createMockNext();

  const activeToken = jwt.sign({ id: "user_active_id" }, jwtSecret, { expiresIn: '1h' });
  const activeReq = createMockRequest({
    headers: { authorization: `Bearer ${activeToken}` }
  });
  const activeRes = createMockResponse();
  const activeNext = createMockNext();

  await withMockModel(
    User,
    'findById',
    (id: string) => {
      if (id === "user_pending_id") {
        return createQueryMock({
          _id: id,
          fullName: "Pending Student",
          role: "student",
          status: "pending",
          isApproved: false
        });
      }
      return createQueryMock({
        _id: id,
        fullName: "Active Approved Member",
        role: "member",
        status: "active",
        isApproved: true
      });
    },
    async () => {
      await protect(unapprovedReq, unapprovedRes as any, unapprovedNext);
      await protect(activeReq, activeRes as any, activeNext);
    }
  );

  if (
    !unapprovedNext.called && unapprovedRes.statusCode === 403 && unapprovedRes._jsonData?.message?.includes("chưa được duyệt") &&
    activeNext.called && String(activeReq.user?._id) === "user_active_id"
  ) {
    details.push("✅ Test 8 Passed: protect blocks unapproved users (403) and attaches verified user for active approved members.");
  } else {
    passed = false;
    details.push(`❌ Test 8 Failed: User approval status verification failed.`);
  }

  // ----------------------------------------------------
  // Test 9: CORS Private IP Regex Rejects Public Domain Prefixes
  // ----------------------------------------------------
  const maliciousHostnames = [
    '10.attacker.com',
    '192.168.evil.org',
    '172.16.phishing.io',
    '10.0.0.1.attacker.com',
    '192.168.1.1.evil.org',
    'attacker10.com',
    '10.0.0', // Incomplete octets
    '192.168.1', // Incomplete octets
    '172.15.0.1', // Outside RFC1918 range
    '172.32.0.1' // Outside RFC1918 range
  ];

  const anyMaliciousAccepted = maliciousHostnames.some(h => isPrivateIP(h));
  if (!anyMaliciousAccepted) {
    details.push("✅ Test 9 Passed: CORS private IP regex strictly rejects public domains starting with private IP prefixes (10.attacker.com, 192.168.evil.org).");
  } else {
    passed = false;
    const leaked = maliciousHostnames.filter(h => isPrivateIP(h));
    details.push(`❌ Test 9 Failed: CORS private IP regex allowed malicious hostnames: ${leaked.join(', ')}`);
  }

  // ----------------------------------------------------
  // Test 10: CORS Private IP Regex Accepts RFC 1918 Addresses & Server.ts Anchoring
  // ----------------------------------------------------
  const validPrivateIPs = [
    '10.0.0.1',
    '10.255.255.255',
    '172.16.0.1',
    '172.31.255.255',
    '192.168.1.100',
    '192.168.0.1'
  ];

  const allValidAccepted = validPrivateIPs.every(h => isPrivateIP(h));

  // Inspect server.ts to verify the production regex uses strict end anchoring
  const serverPath = path.resolve(__dirname, '../server.ts');
  const serverSrc = fs.existsSync(serverPath) ? fs.readFileSync(serverPath, 'utf-8') : '';
  const serverUsesStrictAnchoring =
    serverSrc.includes('^10(\\.\\d{1,3}){3}$') &&
    serverSrc.includes('^192\\.168(\\.\\d{1,3}){2}$') &&
    !serverSrc.includes('/^10\\./') &&
    !serverSrc.includes('/^192\\.168\\./');

  if (allValidAccepted && serverUsesStrictAnchoring) {
    details.push("✅ Test 10 Passed: CORS private IP regex correctly permits RFC 1918 IPs (10.0.0.1, 192.168.1.100) and server.ts enforces strict regex anchoring.");
  } else {
    passed = false;
    details.push(`❌ Test 10 Failed: Valid IPs accepted: ${allValidAccepted}, server.ts anchored regex verified: ${serverUsesStrictAnchoring}`);
  }

  // ----------------------------------------------------
  // Test 11: protect Middleware - Rejects Token with Mismatched tokenVersion (R3 Token Revocation)
  // ----------------------------------------------------
  const revokedToken = jwt.sign({ id: "user_revoked_id", tokenVersion: 1 }, jwtSecret, { expiresIn: '1h' });
  const revokedReq = createMockRequest({
    headers: { authorization: `Bearer ${revokedToken}` }
  });
  const revokedRes = createMockResponse();
  const revokedNext = createMockNext();

  await withMockModel(
    User,
    'findById',
    (id: string) => {
      return createQueryMock({
        _id: id,
        fullName: "Revoked Member",
        role: "member",
        status: "active",
        isApproved: true,
        tokenVersion: 2 // user has incremented tokenVersion to 2
      });
    },
    async () => {
      await protect(revokedReq, revokedRes as any, revokedNext);
    }
  );

  if (
    !revokedNext.called &&
    revokedRes.statusCode === 401 &&
    revokedRes._jsonData?.message?.includes("đăng nhập lại")
  ) {
    details.push("✅ Test 11 Passed: protect rejects outdated token with HTTP 401 when tokenVersion does not match user.tokenVersion.");
  } else {
    passed = false;
    details.push(`❌ Test 11 Failed: Expected 401 for outdated tokenVersion, got status=${revokedRes.statusCode}, msg=${revokedRes._jsonData?.message}`);
  }

  // ----------------------------------------------------
  // Test 12: protect Middleware - Accepts Token with Matching tokenVersion (R3 Valid Session)
  // ----------------------------------------------------
  const validVersionToken = jwt.sign({ id: "user_valid_version_id", tokenVersion: 2 }, jwtSecret, { expiresIn: '1h' });
  const validVersionReq = createMockRequest({
    headers: { authorization: `Bearer ${validVersionToken}` }
  });
  const validVersionRes = createMockResponse();
  const validVersionNext = createMockNext();

  await withMockModel(
    User,
    'findById',
    (id: string) => {
      return createQueryMock({
        _id: id,
        fullName: "Valid Version Member",
        role: "member",
        status: "active",
        isApproved: true,
        tokenVersion: 2 // matches token
      });
    },
    async () => {
      await protect(validVersionReq, validVersionRes as any, validVersionNext);
    }
  );

  if (
    validVersionNext.called &&
    validVersionRes.statusCode === 200 &&
    String(validVersionReq.user?._id) === "user_valid_version_id"
  ) {
    details.push("✅ Test 12 Passed: protect accepts token with matching tokenVersion (HTTP 200 / next called).");
  } else {
    passed = false;
    details.push(`❌ Test 12 Failed: Expected matching tokenVersion to be accepted, got status=${validVersionRes.statusCode}`);
  }

  // ----------------------------------------------------
  // Test 13: login Controller - Account Lockout on 5 Consecutive Failed Attempts (R1 Brute-Force Protection)
  // ----------------------------------------------------
  const mockLockoutUser: any = {
    _id: "user_lockout_test_id",
    username: "victim_user",
    email: "victim@example.com",
    role: "student",
    status: "active",
    isApproved: true,
    mustChangePassword: false,
    failedLoginAttempts: 0,
    lockUntil: null,
    tokenVersion: 0,
    matchPassword: async (pwd: string) => pwd === 'CorrectPassword123',
    save: async function() { return this; }
  };

  let test13AllAttemptsPassed = true;
  await withMockModel(
    User,
    'findOne',
    () => mockLockoutUser,
    async () => {
      // Attempts 1 to 4 with incorrect password
      for (let i = 1; i <= 4; i++) {
        const req = createMockRequest({ body: { username: "victim_user", password: "wrong_password" } });
        const res = createMockResponse();
        await login(req as any, res as any);
        if (res.statusCode !== 400 || mockLockoutUser.failedLoginAttempts !== i || res._jsonData?.failedLoginAttempts !== i) {
          test13AllAttemptsPassed = false;
          details.push(`❌ Test 13 Failed at attempt ${i}: Expected 400 and failedLoginAttempts=${i}, got status=${res.statusCode}`);
          break;
        }
      }

      // Attempt 5 with incorrect password -> Lockout triggered
      if (test13AllAttemptsPassed) {
        const req5 = createMockRequest({ body: { username: "victim_user", password: "wrong_password" } });
        const res5 = createMockResponse();
        await login(req5 as any, res5 as any);

        const lockTimeValid = mockLockoutUser.lockUntil && (mockLockoutUser.lockUntil.getTime() > Date.now());
        const msgMatches = /Tài khoản bị tạm khóa đến \[\d{2}:\d{2}:\d{2}\] do nhập sai mật khẩu quá 5 lần/.test(res5._jsonData?.message || '');

        if (res5.statusCode === 429 && mockLockoutUser.failedLoginAttempts === 5 && lockTimeValid && msgMatches && res5._jsonData?.lockMinutes === 5) {
          // Verify progressive tiers: 3 more attempts -> 15 min; 3 more -> 60 min; 3 more -> 24h
          let progressiveTiersPassed = true;

          // Simulate lock expiration after tier 1 (5 min)
          mockLockoutUser.lockUntil = new Date(Date.now() - 1000);

          // Attempts 6 and 7 should return 400 (not locked yet)
          for (let att = 6; att <= 7; att++) {
            const reqAtt = createMockRequest({ body: { username: "victim_user", password: "wrong_password" } });
            const resAtt = createMockResponse();
            await login(reqAtt as any, resAtt as any);
            if (resAtt.statusCode !== 400 || mockLockoutUser.failedLoginAttempts !== att) {
              progressiveTiersPassed = false;
              break;
            }
          }

          // Attempt 8 (3 more attempts) -> 15 minutes lockout
          const req8 = createMockRequest({ body: { username: "victim_user", password: "wrong_password" } });
          const res8 = createMockResponse();
          await login(req8 as any, res8 as any);
          if (res8.statusCode !== 429 || res8._jsonData?.lockMinutes !== 15 || mockLockoutUser.failedLoginAttempts !== 8) {
            progressiveTiersPassed = false;
          }

          // Simulate lock expiration after tier 2 (15 min)
          mockLockoutUser.lockUntil = new Date(Date.now() - 1000);

          // Attempts 9 and 10 should return 400
          for (let att = 9; att <= 10; att++) {
            const reqAtt = createMockRequest({ body: { username: "victim_user", password: "wrong_password" } });
            const resAtt = createMockResponse();
            await login(reqAtt as any, resAtt as any);
            if (resAtt.statusCode !== 400 || mockLockoutUser.failedLoginAttempts !== att) {
              progressiveTiersPassed = false;
              break;
            }
          }

          // Attempt 11 -> 60 minutes lockout
          const req11 = createMockRequest({ body: { username: "victim_user", password: "wrong_password" } });
          const res11 = createMockResponse();
          await login(req11 as any, res11 as any);
          if (res11.statusCode !== 429 || res11._jsonData?.lockMinutes !== 60 || mockLockoutUser.failedLoginAttempts !== 11) {
            progressiveTiersPassed = false;
          }

          // Simulate lock expiration after tier 3 (60 min)
          mockLockoutUser.lockUntil = new Date(Date.now() - 1000);

          // Attempts 12 and 13 should return 400
          for (let att = 12; att <= 13; att++) {
            const reqAtt = createMockRequest({ body: { username: "victim_user", password: "wrong_password" } });
            const resAtt = createMockResponse();
            await login(reqAtt as any, resAtt as any);
            if (resAtt.statusCode !== 400 || mockLockoutUser.failedLoginAttempts !== att) {
              progressiveTiersPassed = false;
              break;
            }
          }

          // Attempt 14 -> 24 hours (1440 min) lockout
          const req14 = createMockRequest({ body: { username: "victim_user", password: "wrong_password" } });
          const res14 = createMockResponse();
          await login(req14 as any, res14 as any);
          if (res14.statusCode !== 429 || res14._jsonData?.lockMinutes !== 1440 || mockLockoutUser.failedLoginAttempts !== 14) {
            progressiveTiersPassed = false;
          }

          if (progressiveTiersPassed) {
            details.push("✅ Test 13 Passed: Progressive lockout tiers enforced: 5 min at 5 attempts, 15 min at 8 attempts, 60 min at 11 attempts, and 24h at 14+ attempts.");
          } else {
            test13AllAttemptsPassed = false;
            passed = false;
            details.push("❌ Test 13 Failed: Progressive tiers evaluation mismatch.");
          }
        } else {
          test13AllAttemptsPassed = false;
          passed = false;
          details.push(`❌ Test 13 Failed at attempt 5: status=${res5.statusCode}, attempts=${mockLockoutUser.failedLoginAttempts}, msg=${res5._jsonData?.message}`);
        }
      }
    }
  );
  if (!test13AllAttemptsPassed) {
    passed = false;
  }

  // ----------------------------------------------------
  // Test 14: login Controller - Immediate HTTP 429 Rejection While Account is Locked (R1 Lockout Guard)
  // ----------------------------------------------------
  let test14Passed = false;
  let matchPasswordCalledWhileLocked = false;
  const lockedUser: any = {
    _id: "user_locked_id",
    username: "locked_user",
    status: "active",
    isApproved: true,
    failedLoginAttempts: 5,
    lockUntil: new Date(Date.now() + 10 * 60 * 1000), // locked for another 10 minutes
    matchPassword: async () => {
      matchPasswordCalledWhileLocked = true;
      return true;
    },
    save: async function() { return this; }
  };

  await withMockModel(
    User,
    'findOne',
    () => lockedUser,
    async () => {
      const req = createMockRequest({ body: { username: "locked_user", password: "any_password" } });
      const res = createMockResponse();
      await login(req as any, res as any);

      const msgMatches = /Tài khoản bị tạm khóa đến \[\d{2}:\d{2}:\d{2}\] do nhập sai mật khẩu quá 5 lần/.test(res._jsonData?.message || '');
      if (res.statusCode === 429 && msgMatches && !matchPasswordCalledWhileLocked) {
        test14Passed = true;
      }
    }
  );

  if (test14Passed) {
    details.push("✅ Test 14 Passed: Immediate HTTP 429 rejection returned while lockUntil > Date.now() without invoking password verification.");
  } else {
    passed = false;
    details.push(`❌ Test 14 Failed: Lockout guard did not block immediately with 429 or called matchPassword.`);
  }

  // ----------------------------------------------------
  // Test 15: login Controller - Auto-Unlock After Lockout Expiry & Counter Reset on Valid Login (R1 Auto-Unlock)
  // ----------------------------------------------------
  let test15Passed = false;
  const expiredLockUser: any = {
    _id: "user_expired_lock_id",
    username: "recovered_user",
    fullName: "Recovered User",
    role: "student",
    status: "active",
    isApproved: true,
    mustChangePassword: false,
    failedLoginAttempts: 5,
    lockUntil: new Date(Date.now() - 1000), // lock expired 1 second ago
    tokenVersion: 1,
    matchPassword: async (pwd: string) => pwd === 'ValidPassword123',
    save: async function() { return this; }
  };

  await withMockModel(
    User,
    'findOne',
    () => expiredLockUser,
    async () => {
      const req = createMockRequest({ body: { username: "recovered_user", password: "ValidPassword123" } });
      const res = createMockResponse();
      await login(req as any, res as any);

      const decodedToken = res._jsonData?.token ? (jwt.verify(res._jsonData.token, jwtSecret) as any) : null;

      if (
        res.statusCode === 200 &&
        expiredLockUser.failedLoginAttempts === 0 &&
        expiredLockUser.lockUntil === null &&
        decodedToken?.tokenVersion === 1
      ) {
        test15Passed = true;
      }
    }
  );

  if (test15Passed) {
    details.push("✅ Test 15 Passed: Auto-unlock succeeds after lockUntil expires, resets failedLoginAttempts to 0, clears lockUntil to null, and signs token with tokenVersion.");
  } else {
    passed = false;
    details.push(`❌ Test 15 Failed: Failed auto-unlock reset, attempts=${expiredLockUser.failedLoginAttempts}, lockUntil=${expiredLockUser.lockUntil}`);
  }

  // ----------------------------------------------------
  // Test 16: Password Change & Admin Reset - Increments tokenVersion for Token Revocation (R3 Revocation Trigger)
  // ----------------------------------------------------
  let test16Passed = false;
  const changePwdUser: any = {
    _id: "user_pwd_change_id",
    fullName: "Password Change User",
    username: "pwd_user",
    password: "oldPasswordHash",
    mustChangePassword: true,
    tokenVersion: 1,
    save: async function() { return this; }
  };

  await withMockModel(
    User,
    'findById',
    () => changePwdUser,
    async () => {
      // 1. User changes password
      const changeReq = createMockRequest({
        user: { _id: "user_pwd_change_id" } as any,
        body: { newPassword: "NewSecretPassword999" }
      });
      const changeRes = createMockResponse();
      await changePasswordFirstTime(changeReq as any, changeRes as any);

      const versionAfterUserChange = changePwdUser.tokenVersion; // expected 2

      // 2. Admin resets user password
      const resetReq = createMockRequest({
        params: { id: "user_pwd_change_id" }
      });
      const resetRes = createMockResponse();
      await resetUserPassword(resetReq as any, resetRes as any);

      const versionAfterAdminReset = changePwdUser.tokenVersion; // expected 3

      if (
        changeRes.statusCode === 200 &&
        versionAfterUserChange === 2 &&
        resetRes.statusCode === 200 &&
        versionAfterAdminReset === 3
      ) {
        test16Passed = true;
      }
    }
  );

  if (test16Passed) {
    details.push("✅ Test 16 Passed: changePasswordFirstTime and resetUserPassword automatically increment tokenVersion, revoking all existing active tokens.");
  } else {
    passed = false;
    details.push(`❌ Test 16 Failed: tokenVersion was not incremented properly during password change/reset.`);
  }

  return { passed, details };
};
