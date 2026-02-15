import { z } from "zod";
import { AuthSource, CompanyType, UserRole } from "../../enums";

export const createUserSchema = z.object({
  email: z.email("Invalid email address"),

  password: z.string().optional(),

  name: z.string().min(1),

  role: z.enum(UserRole).optional().default(UserRole.PATIENT),

  company_type: z.enum(CompanyType).optional(),

  phone: z.string().optional(),

  time_zone: z.string().optional(),

  auth_source: z.enum(AuthSource).optional(),

  /**
   * Optional list of tenant schema slugs this user can access.
   * Values are normalized/validated server-side.
   */
  companies: z.array(z.string()).optional(),
});

export type CreateUserInput = z.infer<typeof createUserSchema>;
