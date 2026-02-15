import { z } from 'zod';
import { resetPasswordSchema, userFormValuesSchema } from './user.validation';
import { User, Doctor, Patient } from '@repo/store';

export type { User } from '@repo/store';

export type UserFormValues = z.infer<typeof userFormValuesSchema>;
export type ResetPasswordRequest = z.infer<typeof resetPasswordSchema>;

export type UserProfile = {
  user: User;
  doctor?: Doctor;
  patient?: Patient;
};
