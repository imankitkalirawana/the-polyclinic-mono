import { Doctor } from './entities/doctor.entity';

export function formatDoctor(doctor: Doctor) {
  return {
    id: doctor.id,
    userId: doctor.userId,
    name: doctor.user.name,
    email: doctor.user.email,
    phone: doctor.user.phone,
    image: doctor.user.image,
    lastSequenceNumber: doctor.lastSequenceNumber,
    specialization: doctor.specialization,
    experience: doctor.experience,
    createdAt: doctor.createdAt,
    updatedAt: doctor.updatedAt,
  };
}
