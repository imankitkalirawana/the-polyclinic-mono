import { User } from '../entities/user.entity';
import { FindOptions } from 'src/types';

export type UserFindOptions = FindOptions<User> & {
  globally?: boolean;
};
