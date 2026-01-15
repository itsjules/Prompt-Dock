import { z } from 'zod';

export const CollectionSchema = z.object({
    id: z.string().uuid(),
    name: z.string().min(1),
    description: z.string().optional(),
    promptIds: z.array(z.string().uuid()).default([]),
    blockIds: z.array(z.string().uuid()).default([]),
    createdAt: z.string().datetime(),
    updatedAt: z.string().datetime(),
});

export type Collection = z.infer<typeof CollectionSchema>;
