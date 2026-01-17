import { z } from 'zod';

export const RoleSchema = z.object({
    id: z.string().uuid(),
    name: z.string().min(1, "Name is required"),
    description: z.string().optional(),
    keywords: z.array(z.string()),
    linkedCollectionIds: z.array(z.string().uuid()).optional(),
    isSystem: z.boolean().optional(),
});

export type Role = z.infer<typeof RoleSchema>;
