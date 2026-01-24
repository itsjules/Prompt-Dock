import { z } from 'zod';
import { BlockTypeEnum } from './block.schema';

/**
 * Import source types
 */
export const ImportSourceTypeEnum = z.enum(['text', 'file']);
export type ImportSourceType = z.infer<typeof ImportSourceTypeEnum>;

/**
 * Import source schema
 * Represents the raw input (text paste or file upload)
 */
export const ImportSourceSchema = z.object({
    type: ImportSourceTypeEnum,
    content: z.string().min(1, 'Content cannot be empty'),
    filename: z.string().optional(),
    fileSize: z.number().optional(),
});

export type ImportSource = z.infer<typeof ImportSourceSchema>;

/**
 * Confidence level for dissection suggestions
 */
export const ConfidenceLevelEnum = z.enum(['high', 'medium', 'low', 'manual']);
export type ConfidenceLevel = z.infer<typeof ConfidenceLevelEnum>;

/**
 * Dissected block schema
 * Temporary staging structure for blocks during import workflow
 */
export const DissectedBlockSchema = z.object({
    id: z.string(), // Temporary ID for staging
    content: z.string().min(1),
    suggestedType: BlockTypeEnum,
    confidence: z.number().min(0).max(100), // 0-100 confidence score
    confidenceLevel: ConfidenceLevelEnum, // Derived from confidence score
    isManual: z.boolean().default(false), // True if user manually set the type
    label: z.string().optional(), // Optional label for the block
    startPosition: z.number().optional(), // Character position in original text
    endPosition: z.number().optional(), // Character position in original text
});

export type DissectedBlock = z.infer<typeof DissectedBlockSchema>;

/**
 * Import session schema
 * Tracks the current import state (ephemeral, not persisted)
 */
export const ImportSessionSchema = z.object({
    id: z.string(),
    source: ImportSourceSchema,
    blocks: z.array(DissectedBlockSchema).default([]),
    originalText: z.string(),
    metadata: z.object({
        promptTitle: z.string().optional(),
        promptDescription: z.string().optional(),
        tags: z.array(z.string()).default([]),
    }).optional(),
    stage: z.enum(['input', 'dissection', 'review', 'complete']).default('input'),
    createdAt: z.string().datetime(),
});

export type ImportSession = z.infer<typeof ImportSessionSchema>;

/**
 * Helper function to determine confidence level from score
 */
export function getConfidenceLevel(score: number): ConfidenceLevel {
    if (score >= 80) return 'high';
    if (score >= 50) return 'medium';
    return 'low';
}

/**
 * Helper function to create a new dissected block
 */
export function createDissectedBlock(
    content: string,
    suggestedType: string,
    confidence: number,
    options?: {
        label?: string;
        startPosition?: number;
        endPosition?: number;
        isManual?: boolean;
    }
): DissectedBlock {
    return {
        id: crypto.randomUUID(),
        content,
        suggestedType,
        confidence,
        confidenceLevel: getConfidenceLevel(confidence),
        isManual: options?.isManual ?? false,
        label: options?.label,
        startPosition: options?.startPosition,
        endPosition: options?.endPosition,
    };
}
