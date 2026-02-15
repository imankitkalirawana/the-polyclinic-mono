/** @deprecated Use Patient from '@repo/store' instead */
export type PatientType = import('@repo/store').Patient;

/** ABO + Rh blood types for patient vitals */
export const BloodType = {
  A_POSITIVE: 'a_positive',
  A_NEGATIVE: 'a_negative',
  B_POSITIVE: 'b_positive',
  B_NEGATIVE: 'b_negative',
  AB_POSITIVE: 'ab_positive',
  AB_NEGATIVE: 'ab_negative',
  O_POSITIVE: 'o_positive',
  O_NEGATIVE: 'o_negative',
} as const;

export type BloodType = (typeof BloodType)[keyof typeof BloodType];
