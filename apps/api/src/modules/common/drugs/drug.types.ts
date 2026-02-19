import { FindOptions } from 'src/types';
import { Drug } from './entities/drug.entity';

export type DrugFindOptions = FindOptions<Drug> & {
  globally?: boolean;
};
