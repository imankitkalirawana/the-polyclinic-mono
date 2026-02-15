import Modal from '@/components/ui/modal';
import { useAppointmentStore } from '@/services/client/appointment/appointment.store';
import { useChangeDoctorAppointment } from '../appointment.query';
import { useAllDoctors } from '@/services/client/doctor';
import { Doctor } from '@repo/store';
import { SelectionList } from '@/components/dashboard/appointments/(common)';
import { useState } from 'react';

export default function ChangeDoctorModal({ type }: { type: 'change-doctor' | 'assign-doctor' }) {
  const { setAction, aid } = useAppointmentStore();
  const { mutateAsync: changeDoctor } = useChangeDoctorAppointment();
  const { data: doctorsData, isLoading: isDoctorsLoading } = useAllDoctors();

  const [selectedDoctor, setSelectedDoctor] = useState<Doctor | undefined>(undefined);

  const handleSubmit = async () => {
    if (!aid || !selectedDoctor) return;
    await changeDoctor({ aid, doctorId: selectedDoctor.id }).then(() => {
      setAction(null);
    });
  };

  const renderBody = () => {
    return (
      <div>
        <SelectionList
          isLoading={isDoctorsLoading}
          items={
            doctorsData?.doctors?.map((doctor) => ({
              title: doctor.name,
              id: doctor.id,
              subtitle: doctor.designation,
              image: doctor.image,
            })) || []
          }
          selectedId={selectedDoctor?.id}
          onSelect={(doctorId) =>
            setSelectedDoctor(doctorsData?.doctors?.find((d) => d.id === doctorId))
          }
        />
      </div>
    );
  };

  return (
    <Modal
      isOpen
      title={type === 'change-doctor' ? 'Change Doctor' : 'Assign a doctor'}
      subtitle="Select a doctor from the list below"
      body={renderBody()}
      onClose={() => setAction(null)}
      submitButton={{
        children: type === 'change-doctor' ? 'Change Doctor' : 'Assign a doctor',
        color: type === 'change-doctor' ? 'warning' : 'primary',
        isDisabled: !selectedDoctor,
      }}
      onSubmit={handleSubmit}
    />
  );
}
