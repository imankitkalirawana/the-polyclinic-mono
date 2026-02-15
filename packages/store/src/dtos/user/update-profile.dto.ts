import { z } from "zod";
import { Gender, PatientVitals } from "../../enums";

/**
 * Base user fields shared across all roles
 */
export const updateUserProfileSchema = z.object({
  name: z.string().optional(),
  email: z.string().email().optional(),
  phone: z.string().optional(),
});

/**
 * Doctor-specific profile fields
 */
export const updateDoctorProfileSchema = z.object({
  code: z.string().optional(),

  /**
   * Replace semantics:
   * - send full list to assign
   * - empty array clears all
   */
  specializations: z.array(z.string()).optional(),

  designation: z.string().optional(),
  education: z.string().optional(),
  experience: z.number().optional(),
  biography: z.string().optional(),
  seating: z.string().optional(),
});

/**
 * Patient-specific profile fields
 */
export const updatePatientProfileSchema = z.object({
  gender: z.nativeEnum(Gender).optional(),

  // Accept both string and Date
  dob: z.union([z.string(), z.date()]).optional(),

  address: z.string().optional(),

  /**
   * TODO: validate nested vitals properly if you define a Zod schema for it.
   * For now this mirrors @IsObject()
   */
  vitals: z.custom<PatientVitals>().optional(),
});

/**
 * Unified profile update schema
 */
export const updateProfileSchema = z.object({
  user: updateUserProfileSchema.optional(),
  doctor: updateDoctorProfileSchema.optional(),
  patient: updatePatientProfileSchema.optional(),
});

export type UpdateProfileDto = z.infer<typeof updateProfileSchema>;
