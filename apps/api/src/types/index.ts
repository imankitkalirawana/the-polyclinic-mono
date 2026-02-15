import { FindOptionsOrder, FindOptionsRelations } from 'typeorm';

export type FindOptions<T> = {
  withDeleted?: boolean;
  order?: FindOptionsOrder<T>;
  relations?: FindOptionsRelations<T>;
};
