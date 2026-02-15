import { CreateAppointmentInput } from '@repo/store';

type CreateAppointmentMeta = {
  currentStep: number;
  showConfirmation: boolean;
  showReceipt: boolean;
  createNewPatient: boolean;
  knowYourDoctor: boolean;
};

export type CreateAppointmentFormValues = {
  appointment: CreateAppointmentInput;
  meta: CreateAppointmentMeta;
};
