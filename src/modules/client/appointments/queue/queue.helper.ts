import { Queue } from './entities/queue.entity';

export function formatQueue(queue: Queue) {
  return {
    id: queue.id,
    status: queue.status,
    sequenceNumber: queue.sequenceNumber,
    createdAt: queue.createdAt,
    updatedAt: queue.updatedAt,

    patient: {
      id: queue.patient.id,
      gender: queue.patient.gender,
      age: queue.patient.age,
      email: queue.patient.user?.email ?? null,
      name: queue.patient.user?.name ?? null,
      phone: queue.patient.user?.phone ?? null,
    },

    doctor: {
      id: queue.doctor.id,
      specialization: queue.doctor.specialization,
      email: queue.doctor.user?.email ?? null,
      name: queue.doctor.user?.name ?? null,
    },

    bookedByUser: {
      id: queue.bookedByUser.id,
      email: queue.bookedByUser.email,
      name: queue.bookedByUser.name,
    },
  };
}
