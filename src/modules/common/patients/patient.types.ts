import { FindOptions } from 'src/types';
import { Patient } from './entities/patient.entity';

export type PatientFindOptions = FindOptions<Patient> & {
  globally?: boolean;
};
