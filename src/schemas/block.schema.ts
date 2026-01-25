import { z } from 'zod';

export const BlockTypeEnum = z.string();

export const BlockSchema = z.object({
    id: z.string(),
    type: BlockTypeEnum,
    label: z.string().optional(), // Optional - unnamed blocks don't have labels
    content: z.string().min(1),
    variables: z.record(z.string()).optional(),
    isFavorite: z.boolean().default(false),
    isFullPrompt: z.boolean().optional(), // Flag for full prompt blocks
    usageCount: z.number().default(0),
    createdAt: z.string().datetime(),
    updatedAt: z.string().datetime(),
});

export type Block = z.infer<typeof BlockSchema>;
export type BlockType = z.infer<typeof BlockTypeEnum>;
