import { User } from '../entities/user.entity';

export const formatUser = (user: User) => {
  return {
    id: user.id,
    name: user.name,
    email: user.email,
    phone: user.phone,
    status: user.status,
    createdAt: user.createdAt,
    updatedAt: user.updatedAt,
    deletedAt: user.deletedAt,
    emailVerified: user.email_verified,
    companies: user.companies,
    role: user.role,
    permissions: user.permissions,
    timeZone: user.time_zone,
    companyType: user.company_type,
  };
};
