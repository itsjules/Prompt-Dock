import { z } from 'zod';

export const BlockTypeEnum = z.string();

export const BlockSchema = z.object({
    id: z.string(),
    type: BlockTypeEnum,
    label: z.string().min(1),
    content: z.string().min(1),
    variables: z.record(z.string()).optional(),
    isFavorite: z.boolean().default(false),
    createdAt: z.string().datetime(),
    updatedAt: z.string().datetime(),
});

export type Block = z.infer<typeof BlockSchema>;
export type BlockType = z.infer<typeof BlockTypeEnum>;
