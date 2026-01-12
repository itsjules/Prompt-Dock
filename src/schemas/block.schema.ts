import { z } from 'zod';

export const BlockTypeEnum = z.enum([
    'Role',
    'Task',
    'Context',
    'Output',
    'Style',
    'Constraints',
]);

export const BlockSchema = z.object({
    id: z.string().uuid(),
    type: BlockTypeEnum,
    content: z.string().min(1),
    variables: z.record(z.string()).optional(),
    createdAt: z.string().datetime(),
    updatedAt: z.string().datetime(),
});

export type Block = z.infer<typeof BlockSchema>;
export type BlockType = z.infer<typeof BlockTypeEnum>;
