export const FINE_RATES = {
  LATE: 50000,
  ABSENT: 100000,
} as const;

export type AttendanceStatus = 'pending' | 'present' | 'late' | 'absent';

export const calculateFine = (status: AttendanceStatus): number => {
  if (status === 'late') return FINE_RATES.LATE;
  if (status === 'absent') return FINE_RATES.ABSENT;
  return 0;
};
