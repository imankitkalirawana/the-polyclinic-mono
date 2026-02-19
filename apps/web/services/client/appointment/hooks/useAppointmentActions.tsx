import { useSession } from '@/libs/providers/session-provider';
import { useConfirmAppointment, useSendReminder } from '../appointment.query';
import { AppointmentQueue, UserRole } from '@repo/store';

export const useAppointmentActions = () => {
  const confirmMutation = useConfirmAppointment();
  const reminderMutation = useSendReminder();
  const { user } = useSession();
  const role = user?.role;

  const handleConfirm = async (appointment: AppointmentQueue) => {
    await confirmMutation.mutateAsync(appointment.aid);
  };

  const handleReminder = async (appointment: AppointmentQueue) => {
    let emails: string[] = [];

    if (role === UserRole.DOCTOR) {
      emails = [appointment.patient.email];
    } else {
      emails = [appointment.patient.email, appointment.doctor?.email || ''];
    }

    await reminderMutation.mutateAsync({
      aid: appointment.aid,
      emails,
    });
  };

  return {
    handleConfirm,
    handleReminder,
  };
};
