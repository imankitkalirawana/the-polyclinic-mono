import { FindOptionsOrder } from 'typeorm';
import { User } from '../entities/user.entity';

export type UserFindOptions = {
  globally?: boolean;
  withDeleted?: boolean;
  order?: FindOptionsOrder<User> | FindOptionsOrder<User>[];
};
