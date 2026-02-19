import { User, Doctor, Patient } from '@repo/store';

export type UserProfile = {
  user: User;
  doctor?: Doctor;
  patient?: Patient;
};
