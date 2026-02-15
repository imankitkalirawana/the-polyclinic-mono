import type { DateValue } from '@internationalized/date';
import { BookQueueSteps } from '@/components/dashboard/appointments/create/data';
import { QueueStatus, type AppointmentQueueRequest } from '@repo/store';

export type CreateAppointmentQueueFormValues = {
  appointment: AppointmentQueueRequest;
  meta: {
    currentStep: BookQueueSteps;
    showConfirmation: boolean;
    showReceipt: boolean;
    createNewPatient: boolean;
  };
};

export type AppointmentQueueFilters = {
  date: { start: DateValue | null; end: DateValue | null };
  status?: QueueStatus[];
  doctorId?: string | null;
};

export const DEFAULT_APPOINTMENT_QUEUE_FILTERS: AppointmentQueueFilters = {
  date: { start: null, end: null },
  status: undefined,
  doctorId: null,
};
