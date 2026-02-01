import type { DissectedBlock } from '../schemas/import.schema';
import { createDissectedBlock } from '../schemas/import.schema';

/**
 * Block type patterns and keywords for detection
 */
const BLOCK_PATTERNS = {
    Role: {
        markers: [
            /^#+\s*Role\s*:?/im,
            /^Role\s*:?/im,
            /^#+\s*Persona\s*:?/im,
            /^Persona\s*:?/im,
            /^#+\s*Character\s*:?/im,
            /^#+\s*Actor\s*:?/im,  // Added as requested
            /^Actor\s*:?/im,       // Added as requested
            /^A:\s*/im,            // Abbreviated format (TACO)
        ],
        keywords: ['expert', 'assistant', 'persona', 'character', 'specialist', 'professional', 'actor'],
        patterns: [
            /^(you are|act as|imagine you are|as an?)\s+/im,
            /^(your role is|you will be)\s+/im,
        ],
    },
    Task: {
        markers: [
            /^#+\s*Task\s*:?/im,
            /^Task\s*:?/im,
            /^#+\s*Objective\s*:?/im,
            /^Objective\s*:?/im,
            /^#+\s*Goal\s*:?/im,
            /^T:\s*/im,            // Abbreviated format (TACO)
        ],
        keywords: ['create', 'generate', 'write', 'analyze', 'develop', 'design', 'build', 'implement'],
        patterns: [
            /^(your task is|please|you need to|you must|you should)\s+/im,
            /^(i want you to|i need you to)\s+/im,
        ],
    },
    Context: {
        markers: [
            /^#+\s*Context\s*:?/im,
            /^Context\s*:?/im,
            /^#+\s*Background\s*:?/im,
            /^Background\s*:?/im,
            /^#+\s*Information\s*:?/im,
            /^C:\s*/im,            // Abbreviated format (TACO)
        ],
        keywords: ['given', 'considering', 'based on', 'background', 'information', 'details'],
        patterns: [
            /^(here is|the following|given that|based on)\s+/im,
            /^(for context|as context)\s*:?/im,
        ],
    },
    Output: {
        markers: [
            /^#+\s*Output\s*:?/im,
            /^Output\s*:?/im,
            /^#+\s*Format\s*:?/im,
            /^Format\s*:?/im,
            /^#+\s*Response\s*:?/im,
            /^O:\s*/im,            // Abbreviated format (TACO)
        ],
        keywords: ['format', 'structure', 'return', 'provide', 'output', 'response', 'result'],
        patterns: [
            /^(output should|return|provide|format as|structure as)\s+/im,
            /^(your response should|the result should)\s+/im,
        ],
    },
    Style: {
        markers: [
            /^#+\s*Style\s*:?/im,
            /^Style\s*:?/im,
            /^#+\s*Tone\s*:?/im,
            /^Tone\s*:?/im,
            /^#+\s*Voice\s*:?/im,
        ],
        keywords: ['tone', 'voice', 'style', 'manner', 'approach', 'formal', 'casual', 'professional'],
        patterns: [
            /^(write in|use a|adopt a|maintain a)\s+(tone|style|voice)/im,
            /^(be |sound )(formal|casual|professional|friendly)/im,
        ],
    },
    Constraints: {
        markers: [
            /^#+\s*Constraints\s*:?/im,
            /^Constraints\s*:?/im,
            /^#+\s*Rules\s*:?/im,
            /^Rules\s*:?/im,
            /^#+\s*Limitations\s*:?/im,
        ],
        keywords: ['don\'t', 'avoid', 'must', 'should not', 'cannot', 'never', 'always', 'ensure'],
        patterns: [
            /^(do not|don't|avoid|never|must not)\s+/im,
            /^(ensure|make sure|remember to)\s+/im,
        ],
    },
};

/**
 * Detect block type from a text segment
 * Returns the detected type and confidence score (0-100)
 */
export function detectBlockType(segment: string): { type: string; confidence: number } {
    const trimmed = segment.trim();
    const lower = trimmed.toLowerCase();

    // Check each block type
    const scores: { type: string; score: number }[] = [];

    for (const [blockType, patterns] of Object.entries(BLOCK_PATTERNS)) {
        let score = 0;

        // Check explicit markers (highest confidence)
        for (const marker of patterns.markers) {
            if (marker.test(trimmed)) {
                score += 90;
                break;
            }
        }

        // Check structural patterns (high confidence)
        if (score === 0) {
            for (const pattern of patterns.patterns) {
                if (pattern.test(trimmed)) {
                    score += 70;
                    break;
                }
            }
        }

        // Check keywords (medium confidence)
        if (score === 0) {
            const keywordMatches = patterns.keywords.filter((keyword) =>
                lower.includes(keyword.toLowerCase())
            ).length;

            if (keywordMatches > 0) {
                score += Math.min(50 + keywordMatches * 10, 65);
            }
        }

        scores.push({ type: blockType, score });
    }

    // Sort by score and return the highest
    scores.sort((a, b) => b.score - a.score);

    // If no good match, default to Task with low confidence
    if (scores[0].score < 30) {
        return { type: 'Task', confidence: 20 };
    }

    return { type: scores[0].type, confidence: scores[0].score };
}

/**
 * Split text by explicit markers (headings, labels)
 */
export function splitByMarkers(text: string): string[] {
    const segments: string[] = [];
    const lines = text.split('\n');
    let currentSegment: string[] = [];

    // Regex to detect any heading or label marker
    const markerRegex = /^(#+\s*|\*\*)?([A-Z][a-z]+)\s*:?\s*(\*\*)?$/;

    for (const line of lines) {
        const trimmedLine = line.trim();

        // Check if this line is a marker
        const isMarker = markerRegex.test(trimmedLine) ||
            Object.values(BLOCK_PATTERNS).some((patterns) =>
                patterns.markers.some((marker) => marker.test(trimmedLine))
            );

        if (isMarker && currentSegment.length > 0) {
            // Save current segment and start new one
            segments.push(currentSegment.join('\n').trim());
            currentSegment = [line];
        } else {
            currentSegment.push(line);
        }
    }

    // Add final segment
    if (currentSegment.length > 0) {
        segments.push(currentSegment.join('\n').trim());
    }

    return segments.filter((s) => s.length > 0);
}

/**
 * Split text by paragraphs (fallback method)
 */
export function splitByParagraphs(text: string): string[] {
    // Split by double line breaks
    const paragraphs = text.split(/\n\s*\n/).map((p) => p.trim()).filter((p) => p.length > 0);

    // If we only get one paragraph, try splitting by single line breaks
    if (paragraphs.length === 1) {
        return text.split('\n').map((p) => p.trim()).filter((p) => p.length > 20);
    }

    return paragraphs;
}

/**
 * Main dissection function
 * Analyzes text and returns an array of dissected blocks with confidence scores
 */
export function dissectPrompt(text: string): DissectedBlock[] {
    if (!text || text.trim().length === 0) {
        return [];
    }

    // Step 1: Try to split by explicit markers
    let segments = splitByMarkers(text);

    // Step 2: If no markers found, split by paragraphs
    if (segments.length === 0 || (segments.length === 1 && segments[0] === text.trim())) {
        segments = splitByParagraphs(text);
    }

    // Step 3: If still only one segment and it's very long, split it
    if (segments.length === 1 && segments[0].length > 500) {
        segments = splitByParagraphs(segments[0]);
    }

    // Step 4: Detect block type for each segment
    const blocks: DissectedBlock[] = segments.map((segment) => {
        const { type, confidence } = detectBlockType(segment);

        // Don't auto-generate labels - let users enter them manually
        return createDissectedBlock(segment, type, confidence, {
            startPosition: text.indexOf(segment),
            endPosition: text.indexOf(segment) + segment.length,
        });
    });

    return blocks;
}



/**
 * Analyze keywords in text to help determine block type
 */
export function analyzeKeywords(text: string): string {
    const lower = text.toLowerCase();
    const scores: Record<string, number> = {};

    for (const [blockType, patterns] of Object.entries(BLOCK_PATTERNS)) {
        let score = 0;

        patterns.keywords.forEach((keyword) => {
            if (lower.includes(keyword.toLowerCase())) {
                score += 1;
            }
        });

        scores[blockType] = score;
    }

    // Return the type with highest score
    const sorted = Object.entries(scores).sort((a, b) => b[1] - a[1]);
    return sorted[0][0];
}

/**
 * Calculate confidence score for a block type suggestion
 */
export function calculateConfidence(segment: string): number {
    const { confidence } = detectBlockType(segment);
    return confidence;
}
