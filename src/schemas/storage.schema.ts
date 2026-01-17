import { z } from 'zod';
import { BlockSchema } from './block.schema';
import { PromptSchema } from './prompt.schema';
import { CollectionSchema } from './collection.schema';
import { RoleSchema } from './role.schema';

export const StorageSchema = z.object({
    version: z.literal('1.0.0'),
    blocks: z.record(z.string().uuid(), BlockSchema),
    prompts: z.record(z.string().uuid(), PromptSchema),
    collections: z.record(z.string().uuid(), CollectionSchema),
    roles: z.record(z.string().uuid(), RoleSchema).optional(), // Optional for backward compatibility
    activeRoleId: z.string().uuid().nullable().optional(),
    settings: z.object({
        globalHotkey: z.string().default('CommandOrControl+Shift+P'),
        theme: z.enum(['light', 'dark', 'system']).default('system'),
    }),
});

export type StorageData = z.infer<typeof StorageSchema>;
