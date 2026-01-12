import { z } from 'zod';
import { BlockSchema } from './block.schema';
import { PromptSchema } from './prompt.schema';
import { CollectionSchema } from './collection.schema';

export const StorageSchema = z.object({
    version: z.literal('1.0.0'),
    blocks: z.record(z.string().uuid(), BlockSchema),
    prompts: z.record(z.string().uuid(), PromptSchema),
    collections: z.record(z.string().uuid(), CollectionSchema),
    settings: z.object({
        globalHotkey: z.string().default('CommandOrControl+Shift+P'),
        theme: z.enum(['light', 'dark', 'system']).default('system'),
    }),
});

export type StorageData = z.infer<typeof StorageSchema>;
