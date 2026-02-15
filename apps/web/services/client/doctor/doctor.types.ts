export type {
  Doctor,
  DoctorSpecialization,
  TimeSlot,
  DaySchedule,
  WeeklySchedule,
  GuestPermissions,
  SpecificDateAvailability,
  SlotConfig,
} from '@repo/store';

/** @deprecated Use Doctor instead */
export type DoctorType = import('@repo/store').Doctor;
