import { AuthApi } from '@/services/common/auth/auth.api';
import { Session } from '@/types/session';
import { cache } from 'react';

export const getServerSession = cache(async (): Promise<Session | null> => {
  try {
    const res = await AuthApi.getSession();

    return res.data;
  } catch {
    return null;
  }
});
