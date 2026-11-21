export interface SalarySplitMember {
  id: string;
  role: string;
}

export interface SalarySplitInput {
  totalPrice: number;
  bandFundPercent: number; // e.g. 5% or 10%
  members: SalarySplitMember[];
  roleMultipliers?: Record<string, number>;
  allowances?: Array<{ id: string; amount: number }>;
}

export interface SalarySplitResult {
  totalPrice: number;
  bandFundAmount: number;
  remainingPool: number;
  memberPayouts: Record<string, number>;
}

/**
 * Calculates the salary split according to band fund deduction,
 * allowances subtraction, and role multiplier weighting.
 */
export const calculateSalarySplit = (input: SalarySplitInput): SalarySplitResult => {
  const {
    totalPrice,
    bandFundPercent,
    members,
    roleMultipliers = {},
    allowances = []
  } = input;

  const bandFundAmount = Math.round((totalPrice * bandFundPercent) / 100);
  let remainingPool = totalPrice - bandFundAmount;

  // Trừ các khoản phụ cấp trước khi chia phần còn lại
  allowances.forEach(a => {
    remainingPool -= a.amount;
  });

  if (remainingPool < 0) {
    remainingPool = 0;
  }

  // Tính tổng điểm hệ số theo nhạc cụ/vai trò
  let totalPoints = 0;
  const memberPointsMap: Record<string, number> = {};

  members.forEach(m => {
    const mult = roleMultipliers[m.role] !== undefined ? roleMultipliers[m.role] : 1.0;
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
