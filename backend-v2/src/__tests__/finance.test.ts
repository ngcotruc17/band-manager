/**
 * Finance & Bank Webhook Reconciliation Unit Tests
 */

export interface SalarySplitInput {
  totalPrice: number;
  bandFundPercent: number; // e.g. 5%
  members: Array<{ id: string; role: string }>;
  roleMultipliers: Record<string, number>;
  allowances: Array<{ id: string; amount: number }>;
}

export interface SalarySplitResult {
  totalPrice: number;
  bandFundAmount: number;
  remainingPool: number;
  memberPayouts: Record<string, number>;
}

// Business logic function for Salary Split Matrix calculation
export const calculateSalarySplit = (input: SalarySplitInput): SalarySplitResult => {
  const { totalPrice, bandFundPercent, members, roleMultipliers, allowances } = input;

  const bandFundAmount = (totalPrice * bandFundPercent) / 100;
  let remainingPool = totalPrice - bandFundAmount;

  // Subtract allowances
  allowances.forEach(a => {
    remainingPool -= a.amount;
  });

  if (remainingPool < 0) remainingPool = 0;

  // Calculate total multiplier points
  let totalPoints = 0;
  const memberPointsMap: Record<string, number> = {};

  members.forEach(m => {
    const mult = roleMultipliers[m.role] || 1.0;
    memberPointsMap[m.id] = mult;
    totalPoints += mult;
  });

  const memberPayouts: Record<string, number> = {};

  members.forEach(m => {
    const share = totalPoints > 0 ? (memberPointsMap[m.id] / totalPoints) * remainingPool : 0;
    const allowance = allowances.find(a => a.id === m.id)?.amount || 0;
    memberPayouts[m.id] = Math.round(share + allowance);
  });

  return {
    totalPrice,
    bandFundAmount,
    remainingPool,
    memberPayouts
  };
};

// Regex parser test helper for bank transfer descriptions
export const parseBankTransferContent = (content: string) => {
  const cleanContent = content.toUpperCase().replace(/[-_]/g, ' ');
  const showMatch = cleanContent.match(/SHOW\s*([A-F0-9]{24})/i);
  const fineMatch = cleanContent.match(/PHAT\s*([A-F0-9]{24})/i);

  return {
    showId: showMatch ? showMatch[1].toLowerCase() : null,
    userId: fineMatch ? fineMatch[1].toLowerCase() : null
  };
};

export const runFinanceTests = (): { passed: boolean; details: string[] } => {
  const details: string[] = [];
  let passed = true;

  // Test 1: Bank transfer regex parsing
  const test1 = parseBankTransferContent("Chuyen tien coc show 65d83f12a4b8c9123456789a sacband");
  if (test1.showId === "65d83f12a4b8c9123456789a") {
    details.push("✅ Test 1 Passed: Correctly parsed Show ID from bank transfer content.");
  } else {
    passed = false;
    details.push(`❌ Test 1 Failed: Expected showId 65d83f12a4b8c9123456789a but got ${test1.showId}`);
  }

  // Test 2: Fine parsing
  const test2 = parseBankTransferContent("Nop tien phat 65d83f12a4b8c9123456789b tre gio");
  if (test2.userId === "65d83f12a4b8c9123456789b") {
    details.push("✅ Test 2 Passed: Correctly parsed User ID for fine payment.");
  } else {
    passed = false;
    details.push(`❌ Test 2 Failed: Expected userId 65d83f12a4b8c9123456789b but got ${test2.userId}`);
  }

  // Test 3: Salary Split Matrix calculation
  const splitInput: SalarySplitInput = {
    totalPrice: 10000000, // 10M VND
    bandFundPercent: 10,  // 10% = 1M VND -> Remaining 9M
    members: [
      { id: "u1", role: "Vocal" },
      { id: "u2", role: "Guitar" },
      { id: "u3", role: "Bass" }
    ],
    roleMultipliers: { Vocal: 1.2, Guitar: 1.0, Bass: 1.0 }, // Total mult = 3.2
    allowances: [{ id: "u1", amount: 200000 }] // Allowance 200k for Vocal
  };

  const splitResult = calculateSalarySplit(splitInput);
  if (splitResult.bandFundAmount === 1000000) {
    details.push("✅ Test 3 Passed: Correct 10% Band Fund deduction (1,000,000 VND).");
  } else {
    passed = false;
    details.push(`❌ Test 3 Failed: Expected Band Fund 1,000,000 but got ${splitResult.bandFundAmount}`);
  }

  return { passed, details };
};
