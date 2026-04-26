import { z } from 'zod';

export const UserSchema = z.object({
  username: z.string().min(3, 'Username must be at least 3 characters'),
  password: z.string().min(6, 'Password must be at least 6 characters').optional().nullable(),
  role: z.enum(['admin', 'user', 'reseller']).default('user'),
  status: z.enum(['active', 'inactive', 'suspended']).default('active'),
  traffic_limit_gb: z.number().min(0).default(10),
  max_connections: z.number().min(0).default(1),
  expires_at: z.string().optional().nullable(),
  inboundIds: z.array(z.number()).optional(),
  cisco_password: z.string().optional().nullable(),
  l2tp_password: z.string().optional().nullable(),
  wg_pubkey: z.string().optional().nullable(),
  xray_uuid: z.string().optional().nullable(),
  port: z.number().optional().nullable(),
  main_protocol: z.string().optional().nullable(),
});

export type UserFormData = z.infer<typeof UserSchema>;

export const UpdateUserSchema = UserSchema.partial();
