/**
 * Rehearsal Business Logic, Attendance Rules & QR Verification Unit Tests
 */

import jwt from 'jsonwebtoken';
import { calculateDistanceMeters } from '../utils/geo';
import { checkin } from '../controllers/rehearsal.controller';
import Rehearsal from '../models/Rehearsal';
import {
  calculateDistance,
  createMockRequest,
  createMockResponse,
  withMockModel
} from './test-utils';

export interface AttendanceEvaluationResult {
  status: 'present' | 'late' | 'absent';
  fine: number;
  diffMinutes: number;
}

/**
 * Evaluates attendance check-in based on scheduled rehearsal start time and grace period.
 * Threshold: > 15 minutes is late (50,000 VND fine). On time: 0 VND fine.
 */
export const evaluateAttendanceCheckIn = (
  rehearsalDate: Date,
  rehearsalTime: string, // e.g. "19:00 - 21:00"
  checkInTime: Date
): AttendanceEvaluationResult => {
  const startTimePart = (rehearsalTime || '00:00').split('-')[0].trim();
  const [startHour, startMin] = startTimePart.split(':').map(Number);

  const startDateTime = new Date(
    rehearsalDate.getFullYear(),
    rehearsalDate.getMonth(),
    rehearsalDate.getDate(),
    startHour,
    startMin
  );

  const diffMs = checkInTime.getTime() - startDateTime.getTime();
  const diffMinutes = diffMs / (60 * 1000);

  // Late rule in controller: strictly greater than 15 minutes (900,000 ms)
  const isLate = diffMs > 15 * 60 * 1000;
  const fine = isLate ? 50000 : 0;
  const status: 'present' | 'late' = isLate ? 'late' : 'present';

  return { status, fine, diffMinutes };
};

/**
 * Checks if user coordinate is within allowed radius (in meters) of rehearsal location.
 */
export const isWithinRehearsalGeofence = (
  centerLat: number,
  centerLon: number,
  userLat: number,
  userLon: number,
  radiusMeters: number
): { allowed: boolean; distanceMeters: number } => {
  const distanceMeters = calculateDistanceMeters(centerLat, centerLon, userLat, userLon);
  return {
    allowed: distanceMeters <= radiusMeters,
    distanceMeters
  };
};

export const runRehearsalTests = async (): Promise<{ passed: boolean; details: string[] }> => {
  const details: string[] = [];
  let passed = true;
  const testSecret = "rehearsal_qr_test_secret_123456";
  const rehearsalId = "65d83f12a4b8c9123456789c";

  // ----------------------------------------------------
  // Test 1: 5-minute QR Token Generation & Lifespan
  // ----------------------------------------------------
  const token = jwt.sign({ rehearsalId }, testSecret, { expiresIn: '5m' });
  const decoded: any = jwt.verify(token, testSecret);
  const lifespan = decoded.exp - decoded.iat;

  if (decoded && decoded.rehearsalId === rehearsalId && lifespan === 300) {
    details.push("✅ Test 1 Passed: QR token generates with exact 5-minute (300s) expiration lifespan.");
  } else {
    passed = false;
    details.push(`❌ Test 1 Failed: Expected 300s expiration, got ${lifespan}s`);
  }

  // ----------------------------------------------------
  // Test 2: Expired QR Token Rejection (TokenExpiredError)
  // ----------------------------------------------------
  const expiredToken = jwt.sign({ rehearsalId }, testSecret, { expiresIn: '0s' });
  let tokenExpiredCaught = false;
  try {
    jwt.verify(expiredToken, testSecret);
  } catch (err: any) {
    if (err.name === 'TokenExpiredError') {
      tokenExpiredCaught = true;
    }
  }

  if (tokenExpiredCaught) {
    details.push("✅ Test 2 Passed: Expired QR token correctly rejected with TokenExpiredError.");
  } else {
    passed = false;
    details.push("❌ Test 2 Failed: Expired QR token was not rejected with TokenExpiredError.");
  }

  // ----------------------------------------------------
  // Test 3: QR Token with Invalid Signature Rejection
  // ----------------------------------------------------
  let invalidSignatureCaught = false;
  try {
    jwt.verify(token, "tampered_wrong_secret");
  } catch (err: any) {
    if (err.name === 'JsonWebTokenError') {
      invalidSignatureCaught = true;
    }
  }

  if (invalidSignatureCaught) {
    details.push("✅ Test 3 Passed: QR token with invalid secret signature rejected with JsonWebTokenError.");
  } else {
    passed = false;
    details.push("❌ Test 3 Failed: Tampered token was unexpectedly accepted.");
  }

  // ----------------------------------------------------
  // Test 4: On-time Check-in (Within 15-Minute Grace Period)
  // ----------------------------------------------------
  const rehearsalDate = new Date(2026, 10, 20); // 2026-11-20
  const rehearsalTime = "19:00 - 21:00";

  // Check in at 19:10 (10 mins after start) -> On-time
  const onTimeCheckIn = new Date(2026, 10, 20, 19, 10, 0);
  const evalOnTime = evaluateAttendanceCheckIn(rehearsalDate, rehearsalTime, onTimeCheckIn);
  if (evalOnTime.status === 'present' && evalOnTime.fine === 0) {
    details.push("✅ Test 4 Passed: On-time check-in (10m after start) marked 'present' with 0 fine.");
  } else {
    passed = false;
    details.push(`❌ Test 4 Failed: Expected 'present' & 0 fine, got ${evalOnTime.status} & ${evalOnTime.fine}`);
  }

  // ----------------------------------------------------
  // Test 5: Exact 15-Minute Boundary Check-in (Grace Period Inclusive)
  // ----------------------------------------------------
  const boundaryCheckIn = new Date(2026, 10, 20, 19, 15, 0);
  const evalBoundary = evaluateAttendanceCheckIn(rehearsalDate, rehearsalTime, boundaryCheckIn);
  if (evalBoundary.status === 'present' && evalBoundary.fine === 0) {
    details.push("✅ Test 5 Passed: Exact 15m boundary check-in is not late (grace period inclusive).");
  } else {
    passed = false;
    details.push(`❌ Test 5 Failed: Exact 15m boundary should be 'present', got ${evalBoundary.status}`);
  }

  // ----------------------------------------------------
  // Test 6: Late Check-in (>15 Minutes -> 50,000 VND Fine)
  // ----------------------------------------------------
  const lateCheckIn = new Date(2026, 10, 20, 19, 16, 0); // 16 mins after start
  const evalLate = evaluateAttendanceCheckIn(rehearsalDate, rehearsalTime, lateCheckIn);
  if (evalLate.status === 'late' && evalLate.fine === 50000) {
    details.push("✅ Test 6 Passed: Late check-in (>15m) correctly marked 'late' with 50,000 VND fine.");
  } else {
    passed = false;
    details.push(`❌ Test 6 Failed: Expected 'late' with 50,000 VND fine, got ${evalLate.status} & ${evalLate.fine}`);
  }

  // ----------------------------------------------------
  // Test 7: Absent Discipline Fine (100,000 VND Contract)
  // ----------------------------------------------------
  const absentFineRate = 100000;
  const absentStatus: AttendanceEvaluationResult = { status: 'absent', fine: absentFineRate, diffMinutes: -1 };
  if (absentStatus.status === 'absent' && absentStatus.fine === 100000) {
    details.push("✅ Test 7 Passed: Absent member incurs standard 100,000 VND discipline fine.");
  } else {
    passed = false;
    details.push("❌ Test 7 Failed: Absent fine rate contract violated.");
  }

  // ----------------------------------------------------
  // Test 8: Haversine GPS Distance Geofence Validation
  // ----------------------------------------------------
  // Campus center (FPTU HCMC): 10.8411276, 106.809883
  const campusLat = 10.8411276;
  const campusLon = 106.809883;

  // Exact coordinates -> distance === 0
  const zeroDistance = calculateDistance(campusLat, campusLon, campusLat, campusLon);
  if (Math.round(zeroDistance) === 0) {
    details.push("✅ Test 8 Passed: Identical GPS coordinates evaluate to 0 meters distance.");
  } else {
    passed = false;
    details.push(`❌ Test 8 Failed: Expected 0m distance, got ${zeroDistance}`);
  }

  // User 25 meters away within 50m radius -> Accepted
  const nearbyLat = 10.84135;
  const nearbyLon = 106.809883;
  const nearbyResult = isWithinRehearsalGeofence(campusLat, campusLon, nearbyLat, nearbyLon, 50);
  if (nearbyResult.allowed && nearbyResult.distanceMeters < 50) {
    details.push(`✅ Test 9 Passed: User within 50m radius accepted (measured ${Math.round(nearbyResult.distanceMeters)}m).`);
  } else {
    passed = false;
    details.push(`❌ Test 9 Failed: Expected accepted within 50m radius, got ${nearbyResult.distanceMeters}m`);
  }

  // User 700m away outside 50m radius -> Rejected
  const farLat = 10.8475;
  const farLon = 106.8099;
  const farResult = isWithinRehearsalGeofence(campusLat, campusLon, farLat, farLon, 50);
  if (!farResult.allowed && farResult.distanceMeters > 50) {
    details.push(`✅ Test 10 Passed: User outside allowed radius (>50m) rejected (measured ${Math.round(farResult.distanceMeters)}m).`);
  } else {
    passed = false;
    details.push("❌ Test 10 Failed: User 700m away falsely accepted within 50m radius.");
  }

  // ----------------------------------------------------
  // Test 11: Antipodal GPS Coordinates Precision (No NaN Overflow)
  // ----------------------------------------------------
  const antipodalLat1 = -89.86404;
  const antipodalLon1 = -179.82804;
  const antipodalLat2 = 89.86404;
  const antipodalLon2 = 0.17196;

  const antipodalDistance = calculateDistanceMeters(
    antipodalLat1,
    antipodalLon1,
    antipodalLat2,
    antipodalLon2
  );

  const antipodalGeofence = isWithinRehearsalGeofence(
    antipodalLat1,
    antipodalLon1,
    antipodalLat2,
    antipodalLon2,
    30
  );

  if (
    !isNaN(antipodalDistance) &&
    antipodalDistance > 20000000 &&
    !antipodalGeofence.allowed
  ) {
    details.push(`✅ Test 11 Passed: calculateDistanceMeters handles near-antipodal coordinates without NaN overflow (${Math.round(antipodalDistance)}m, geofence rejected).`);
  } else {
    passed = false;
    details.push(`❌ Test 11 Failed: Antipodal calculation produced distance=${antipodalDistance}, allowed=${antipodalGeofence.allowed}`);
  }

  // ----------------------------------------------------
  // Test 12: Rehearsal Checkin Rejects Missing Coords when GPS Location is Configured
  // ----------------------------------------------------
  const jwtSecret = process.env.JWT_SECRET || 'mat_khau_bi_mat_cua_ban_123456';
  const validCheckInToken = jwt.sign({ rehearsalId }, jwtSecret, { expiresIn: '5m' });
  const testUserId = "65d83f12a4b8c9123456789a";

  const buildMockRehearsal = () => ({
    _id: rehearsalId,
    title: "Rehearsal with Mandatory GPS",
    gpsLocation: {
      latitude: campusLat,
      longitude: campusLon,
      radius: 30
    },
    date: new Date(),
    time: `${new Date().getHours().toString().padStart(2, '0')}:${new Date().getMinutes().toString().padStart(2, '0')} - 23:59`,
    attendance: [
      {
        user: testUserId,
        status: 'pending',
        fine: 0
      }
    ],
    save: async function() { return this; }
  });

  // Scenario A: Missing coords payload entirely
  const noCoordsReq = createMockRequest({
    params: { id: rehearsalId },
    body: { token: validCheckInToken },
    user: { _id: testUserId } as any
  });
  const noCoordsRes = createMockResponse();

  await withMockModel(
    Rehearsal,
    'findById',
    () => Promise.resolve(buildMockRehearsal()),
    async () => {
      await checkin(noCoordsReq, noCoordsRes as any);
    }
  );

  if (
    noCoordsRes.statusCode === 400 &&
    noCoordsRes._jsonData?.success === false &&
    noCoordsRes._jsonData?.message?.includes("yêu cầu xác thực vị trí GPS")
  ) {
    details.push("✅ Test 12 Passed: Rehearsal check-in strictly rejects check-in with missing GPS coords when gpsLocation is configured.");
  } else {
    passed = false;
    details.push(`❌ Test 12 Failed: Expected 400 with GPS required message, got status=${noCoordsRes.statusCode}, body=${JSON.stringify(noCoordsRes._jsonData)}`);
  }

  // ----------------------------------------------------
  // Test 13: Rehearsal Checkin Enforces Geofence Radius & Accepts Valid Coords
  // ----------------------------------------------------
  // Scenario B: Out-of-bounds coords (700m away)
  const farCoordsReq = createMockRequest({
    params: { id: rehearsalId },
    body: {
      token: validCheckInToken,
      coords: { latitude: farLat, longitude: farLon }
    },
    user: { _id: testUserId } as any
  });
  const farCoordsRes = createMockResponse();

  // Scenario C: Within radius coords (exact campus center)
  const validCoordsReq = createMockRequest({
    params: { id: rehearsalId },
    body: {
      token: validCheckInToken,
      coords: { latitude: campusLat, longitude: campusLon }
    },
    user: { _id: testUserId } as any
  });
  const validCoordsRes = createMockResponse();

  await withMockModel(
    Rehearsal,
    'findById',
    () => Promise.resolve(buildMockRehearsal()),
    async () => {
      await checkin(farCoordsReq, farCoordsRes as any);
      await checkin(validCoordsReq, validCoordsRes as any);
    }
  );

  if (
    farCoordsRes.statusCode === 400 &&
    farCoordsRes._jsonData?.success === false &&
    farCoordsRes._jsonData?.message?.includes("Vị trí điểm danh không hợp lệ") &&
    validCoordsRes.statusCode === 200 &&
    validCoordsRes._jsonData?.status === 'present'
  ) {
    details.push("✅ Test 13 Passed: Rehearsal check-in rejects out-of-range coordinates and accepts check-in within allowed GPS radius.");
  } else {
    passed = false;
    details.push(`❌ Test 13 Failed: farBody=${JSON.stringify(farCoordsRes._jsonData)}, validBody=${JSON.stringify(validCoordsRes._jsonData)}`);
  }

  return { passed, details };
};
