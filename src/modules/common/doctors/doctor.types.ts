import { FindOptions } from 'src/types';
import { Doctor } from './entities/doctor.entity';

export type DoctorFindOptions = FindOptions<Doctor> & {
  globally?: boolean;
};
