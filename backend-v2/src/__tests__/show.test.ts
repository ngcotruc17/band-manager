/**
 * Show Lifecycle, Registration Deadline Lock & Salary Split Matrix Unit Tests
 */

import { calculateSalarySplit, SalarySplitInput } from '../utils/salary';

/**
 * Validates Show status state machine transitions.
 */
export const isValidShowTransition = (currentStatus: string, nextStatus: string): boolean => {
  const allowedTransitions: Record<string, string[]> = {
    draft: ['pending', 'confirmed', 'cancelled'],
    pending: ['confirmed', 'cancelled'],
    confirmed: ['completed', 'cancelled'],
    completed: [], // Terminal state - cannot transition out
    cancelled: ['pending'] // Can be reopened by admin
  };
  return (allowedTransitions[currentStatus] || []).includes(nextStatus);
};

/**
 * Checks if show registration is locked based on manual lock, status, or lockRegistrationHours deadline.
 */
export const checkShowRegistrationLock = (
  show: {
    date: Date;
    time: string; // e.g. "20:00"
    isRegistrationClosed?: boolean;
    lockRegistrationHours?: number;
    status?: string;
  },
  currentTime: Date
): { isLocked: boolean; reason?: string } => {
  if (show.status === 'completed' || show.status === 'cancelled') {
    return { isLocked: true, reason: 'Show không ở trạng thái mở đăng ký' };
  }
  if (show.isRegistrationClosed) {
    return { isLocked: true, reason: 'Đăng ký đã được đóng bởi quản trị viên' };
  }

  const lockHours = show.lockRegistrationHours ?? 24;
  const [hour, min] = (show.time || '00:00').split(':').map(Number);
  const showDateTime = new Date(
    show.date.getFullYear(),
    show.date.getMonth(),
    show.date.getDate(),
    hour,
    min
  );

  const deadline = new Date(showDateTime.getTime() - lockHours * 60 * 60 * 1000);

  if (currentTime.getTime() >= deadline.getTime()) {
    return { isLocked: true, reason: `Đã quá hạn đăng ký (${lockHours}h trước giờ diễn)` };
  }

  return { isLocked: false };
};

export const runShowTests = (): { passed: boolean; details: string[] } => {
  const details: string[] = [];
  let passed = true;

  // ----------------------------------------------------
  // Test 1: Show State Machine Transitions
  // ----------------------------------------------------
  const transitionsValid =
    isValidShowTransition('draft', 'pending') &&
    isValidShowTransition('pending', 'confirmed') &&
    isValidShowTransition('confirmed', 'completed') &&
    isValidShowTransition('confirmed', 'cancelled') &&
    !isValidShowTransition('completed', 'confirmed') && // Cannot undo completed
    !isValidShowTransition('completed', 'draft');

  if (transitionsValid) {
    details.push("✅ Test 1 Passed: Valid show lifecycle transitions enforced (draft -> pending -> confirmed -> completed).");
  } else {
    passed = false;
    details.push("❌ Test 1 Failed: Show state machine transitions failed validation.");
  }

  // ----------------------------------------------------
  // Test 2: Registration Lock - Open when before deadline (48h before)
  // ----------------------------------------------------
  const showDate = new Date(2026, 11, 25); // 2026-12-25
  const showTime = "20:00"; // 20:00:00

  const time48hBefore = new Date(2026, 11, 23, 20, 0);
  const checkOpen = checkShowRegistrationLock(
    { date: showDate, time: showTime, lockRegistrationHours: 24, status: 'confirmed' },
    time48hBefore
  );
  if (!checkOpen.isLocked) {
    details.push("✅ Test 2 Passed: Registration open 48h before show time (lock deadline is 24h).");
  } else {
    passed = false;
    details.push(`❌ Test 2 Failed: Expected open registration, got locked: ${checkOpen.reason}`);
  }

  // ----------------------------------------------------
  // Test 3: Registration Lock - Locked when within 24h deadline (12h before)
  // ----------------------------------------------------
  const time12hBefore = new Date(2026, 11, 25, 8, 0); // 12 hours before show
  const checkLocked = checkShowRegistrationLock(
    { date: showDate, time: showTime, lockRegistrationHours: 24, status: 'confirmed' },
    time12hBefore
  );
  if (checkLocked.isLocked && checkLocked.reason?.includes("24h trước giờ diễn")) {
    details.push("✅ Test 3 Passed: Registration locked when past the 24h deadline.");
  } else {
    passed = false;
    details.push("❌ Test 3 Failed: Registration should be locked within 24h of showtime.");
  }

  // ----------------------------------------------------
  // Test 4: Registration Lock - Manual isRegistrationClosed override
  // ----------------------------------------------------
  const checkManual = checkShowRegistrationLock(
    { date: showDate, time: showTime, isRegistrationClosed: true, status: 'confirmed' },
    time48hBefore
  );
  if (checkManual.isLocked && checkManual.reason?.includes("đóng bởi quản trị viên")) {
    details.push("✅ Test 4 Passed: Manual isRegistrationClosed=true immediately locks registration.");
  } else {
    passed = false;
    details.push("❌ Test 4 Failed: Manual registration closure flag was ignored.");
  }

  // ----------------------------------------------------
  // Test 5: Full Salary Split Matrix with Multipliers & Allowances
  // ----------------------------------------------------
  const salaryInput: SalarySplitInput = {
    totalPrice: 20000000, // 20,000,000 VND
    bandFundPercent: 10,   // 10% = 2,000,000 VND -> Remaining 18,000,000 VND
    members: [
      { id: "u_leader", role: "Leader" },
      { id: "u_vocal", role: "Vocal" },
      { id: "u_guitar", role: "Guitar" },
      { id: "u_bass", role: "Bass" }
    ],
    roleMultipliers: {
      Leader: 1.5,
      Vocal: 1.2,
      Guitar: 1.0,
      Bass: 1.0
    }, // Total points = 1.5 + 1.2 + 1.0 + 1.0 = 4.7
    allowances: [
      { id: "u_leader", amount: 500000 } // 500,000 VND allowance
    ]
  };

  const splitResult = calculateSalarySplit(salaryInput);

  // Band Fund check: 10% of 20M = 2M VND
  if (splitResult.bandFundAmount === 2000000) {
    details.push("✅ Test 5 Passed: Correct 10% Band Fund deduction (2,000,000 VND).");
  } else {
    passed = false;
    details.push(`❌ Test 5 Failed: Expected 2,000,000 VND band fund, got ${splitResult.bandFundAmount}`);
  }

  // Pool check: 18,000,000 - 500,000 = 17,500,000 VND
  if (splitResult.remainingPool === 17500000) {
    details.push("✅ Test 6 Passed: Allowances deducted from remaining pool before multiplier distribution.");
  } else {
    passed = false;
    details.push(`❌ Test 6 Failed: Expected 17,500,000 pool, got ${splitResult.remainingPool}`);
  }

  // Leader payout: (1.5 / 4.7) * 17,500,000 + 500,000 = 5,585,106 + 500,000 = 6,085,106 VND
  const expectedLeader = Math.round((1.5 / 4.7) * 17500000 + 500000);
  const actualLeader = splitResult.memberPayouts["u_leader"];
  if (actualLeader === expectedLeader) {
    details.push(`✅ Test 7 Passed: Leader payout accurately calculated with multiplier and allowance (${actualLeader.toLocaleString()} VND).`);
  } else {
    passed = false;
    details.push(`❌ Test 7 Failed: Expected leader payout ${expectedLeader}, got ${actualLeader}`);
  }

  // Exact balance reconciliation check:
  // BandFund + sum(memberPayouts) should equal totalPrice (within rounding tolerance <= 4 VND)
  const totalPayoutSum = Object.values(splitResult.memberPayouts).reduce((a, b) => a + b, 0);
  const totalReconciled = splitResult.bandFundAmount + totalPayoutSum;
  const reconciliationDiff = Math.abs(totalReconciled - salaryInput.totalPrice);
  if (reconciliationDiff <= 4) {
    details.push(`✅ Test 8 Passed: Exact balance reconciliation verified (total ${totalReconciled.toLocaleString()} VND, diff <= 4 VND).`);
  } else {
    passed = false;
    details.push(`❌ Test 8 Failed: Balance reconciliation diff too large: ${reconciliationDiff} VND`);
  }

  // ----------------------------------------------------
  // Test 6: Zero Participants & Zero Price Edge Cases
  // ----------------------------------------------------
  const zeroParticipantsSplit = calculateSalarySplit({
    totalPrice: 10000000,
    bandFundPercent: 10,
    members: []
  });
  const zeroPriceSplit = calculateSalarySplit({
    totalPrice: 0,
    bandFundPercent: 10,
    members: [{ id: "u1", role: "Vocal" }]
  });

  if (
    zeroParticipantsSplit.bandFundAmount === 1000000 &&
    Object.keys(zeroParticipantsSplit.memberPayouts).length === 0 &&
    zeroPriceSplit.bandFundAmount === 0 &&
    zeroPriceSplit.memberPayouts["u1"] === 0
  ) {
    details.push("✅ Test 9 Passed: Zero-participants and zero-price edge cases handled cleanly without NaN.");
  } else {
    passed = false;
    details.push("❌ Test 9 Failed: Edge case handling failed.");
  }

  return { passed, details };
};
