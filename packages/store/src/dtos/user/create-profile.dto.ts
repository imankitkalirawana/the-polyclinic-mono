import { z } from "zod";
import { BloodType, Gender, UserRole } from "../../enums";
import { createUserSchema } from "./create-user.dto";
import {
  nullablePositiveNumberValidation,
  nullableStringValidation,
} from "../factory.dto";

const createDoctorProfileSchema = z.object({
  code: nullableStringValidation,
  specializations: nullableStringValidation.array(),
  designation: nullableStringValidation,
  education: nullableStringValidation,
  experience: nullablePositiveNumberValidation,
  biography: nullableStringValidation,
  seating: nullableStringValidation,
});

const vitalsSchema = z.object({
  bloodType: z.enum(BloodType),
  bloodPressure: nullableStringValidation,
  heartRate: nullableStringValidation,
  weight: nullablePositiveNumberValidation,
  height: nullablePositiveNumberValidation,
  allergy: nullableStringValidation,
});

const createPatientProfileSchema = z.object({
  gender: z.enum(Gender).optional(),
  dob: z.coerce.date().optional(),
  address: nullableStringValidation,
  vitals: vitalsSchema.optional(),
});

/**
 * Unified create profile schema: base user fields (from store) + optional role-specific block,
 * with validation linking user.role to the required profile block.
 */
export const createProfileSchema = z
  .object({
    user: createUserSchema,
    doctor: createDoctorProfileSchema.optional(),
    patient: createPatientProfileSchema.optional(),
  })
  .refine((data) => {
    const role = data.user?.role;
    if (!role) return true;
    if (role === UserRole.DOCTOR) return !!data.doctor && !data.patient;
    if (role === UserRole.PATIENT) return !!data.patient && !data.doctor;
    return !data.doctor && !data.patient;
  }, "doctor/patient profile is required when role is DOCTOR or PATIENT; only one profile block is allowed and must match the role");

export type CreateProfileDto = z.infer<typeof createProfileSchema>;
