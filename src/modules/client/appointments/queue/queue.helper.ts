import { Queue } from './entities/queue.entity';

interface FormattedQueue extends Queue {
  nextQueueId?: string;
  previousQueueId?: string;
}

export function formatQueue(queue: FormattedQueue) {
  return {
    id: queue.id,
    status: queue.status,
    sequenceNumber: queue.sequenceNumber,
    notes: queue.notes,
    title: queue.title,
    prescription: queue.prescription,
    startedAt: queue.startedAt,
    completedAt: queue.completedAt,
    completedBy: queue.completedBy,
    completedByUser: queue.completedByUser
      ? {
          id: queue.completedByUser.id,
          email: queue.completedByUser.email,
          name: queue.completedByUser.name,
        }
      : null,
    createdAt: queue.createdAt,
    updatedAt: queue.updatedAt,
    nextQueueId: queue.nextQueueId,
    previousQueueId: queue.previousQueueId,

    patient: queue.patient
      ? {
          id: queue.patient.id,
          gender: queue.patient.gender,
          age: queue.patient.age,
          email: queue.patient.user?.email ?? null,
          name: queue.patient.user?.name ?? null,
          phone: queue.patient.user?.phone ?? null,
          userId: queue.patient.user?.id ?? null,
        }
      : null,

    doctor: queue.doctor
      ? {
          id: queue.doctor.id,
          specialization: queue.doctor.specialization,
          email: queue.doctor.user?.email ?? null,
          name: queue.doctor.user?.name ?? null,
          userId: queue.doctor.user?.id ?? null,
        }
      : null,

    bookedByUser: queue.bookedByUser
      ? {
          id: queue.bookedByUser.id,
          email: queue.bookedByUser.email,
          name: queue.bookedByUser.name,
        }
      : null,
  };
}
