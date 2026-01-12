import { BlockType } from '../schemas/block.schema';

export const MOCK_PRESETS: Record<BlockType, string[]> = {
    Role: ['UX Expert', 'Senior Developer', 'Creative Writer', 'Data Analyst'],
    Task: ['Analyze Data', 'Write Documentation', 'Debug Code', 'Brainstorm Ideas'],
    Context: ['Technical Audience', 'Beginner Friendly', 'Executive Summary'],
    Output: ['Markdown Table', 'JSON Format', 'Bullet Points'],
    Style: ['Professional', 'Casual', 'Socratic', 'Concise'],
    Constraints: ['No Jargon', 'Under 500 words', 'Use active voice'],
};
