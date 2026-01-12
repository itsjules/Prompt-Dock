import { z } from 'zod';

export const PromptSchema = z.object({
    id: z.string().uuid(),
    title: z.string().min(1),
    description: z.string().optional(),
    blocks: z.array(z.string().uuid()), // Block IDs in order
    tags: z
        .object({
            style: z.array(z.string()).default([]),
            topic: z.array(z.string()).default([]),
            technique: z.array(z.string()).default([]),
        })
        .default({}),
    rating: z.number().min(0).max(5).optional(),
    usageCount: z.number().int().min(0).default(0),
    isFavorite: z.boolean().default(false),
    createdAt: z.string().datetime(),
    updatedAt: z.string().datetime(),
});

export type Prompt = z.infer<typeof PromptSchema>;
