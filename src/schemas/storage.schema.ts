import { z } from 'zod';
import { BlockSchema } from './block.schema';
import { PromptSchema } from './prompt.schema';
import { CollectionSchema } from './collection.schema';
import { RoleSchema } from './role.schema';

export const StorageSchema = z.object({
    version: z.literal('1.0.0'),
    blocks: z.record(z.string(), BlockSchema),
    prompts: z.record(z.string(), PromptSchema),
    collections: z.record(z.string(), CollectionSchema),
    roles: z.record(z.string(), RoleSchema).optional(), // Keys can be any string (e.g. 'role-personal')
    activeRoleId: z.string().nullable().optional(),
    settings: z.object({
        globalHotkey: z.string().default('CommandOrControl+Shift+P'),
        theme: z.enum(['light', 'dark', 'system']).default('system'),
    }),
});

export type StorageData = z.infer<typeof StorageSchema>;
