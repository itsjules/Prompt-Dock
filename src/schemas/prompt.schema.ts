import { z } from 'zod';
import { BlockTypeEnum } from './block.schema';

// Inline block schema for unnamed blocks stored within prompts
export const InlineBlockSchema = z.object({
    type: BlockTypeEnum,
    content: z.string().min(1),
    // No label, no ID - these are not in the library
});

export const PromptSchema = z.object({
    id: z.string(),
    title: z.string().min(1),
    description: z.string().optional(),
    blocks: z.array(z.string()), // IDs of named library blocks
    inlineBlocks: z.array(InlineBlockSchema).optional(), // Unnamed blocks stored inline
    isFullPrompt: z.boolean().default(false), // True if this is a monolithic prompt
    fullPromptContent: z.string().optional(), // Raw content for full prompts
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
    importedFrom: z.string().optional(), // Source filename or "pasted text"
    importedAt: z.string().datetime().optional(), // When it was imported
    createdAt: z.string().datetime(),
    updatedAt: z.string().datetime(),
});

export type Prompt = z.infer<typeof PromptSchema>;
