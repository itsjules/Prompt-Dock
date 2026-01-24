import { BlockType } from '../schemas/block.schema';

export const BLOCK_COLORS: Record<BlockType, string> = {
    Role: '#214357ff',        // Rich Ocean (Teal)
    Task: '#49375fff',        // Rich Indigo (Was Aubergine)
    Context: '#64480eff',     // Rich Mustard (Bronze)
    Output: '#2f4933ff',      // Rich Sage (Forest)
    Style: '#662b4fff',       // Rich Raspberry (Was Lavender)
    Constraints: '#6e2f2fff', // Rich Rosewood (Terra Cotta)
};

// Accent colors: Normalized high-brightness for consistent visibility against dark rich backgrounds
export const BLOCK_ACCENTS: Record<BlockType, string> = {
    Role: '#80DEEA',        // Bright Cyan
    Task: '#9FA8DA',        // Bright Indigo/Periwinkle
    Context: '#FFE082',     // Bright Amber
    Output: '#C5E1A5',      // Bright Light Green
    Style: '#F48FB1',       // Bright Pink
    Constraints: '#EF9A9A', // Bright Red
};

// Helper: Darken slightly for rich background (0.6 multiplier)
export const darkenColor = (hex: string): string => {
    // Handle rgba/rgb if needed, but assuming hex for now based on previous code
    if (!hex.startsWith('#')) return hex;

    // Remove alpha if present for calculation (strictly handling 6-digit or 8-digit hex)
    const cleanHex = hex.slice(1, 7);
    const r = parseInt(cleanHex.slice(0, 2), 16);
    const g = parseInt(cleanHex.slice(2, 4), 16);
    const b = parseInt(cleanHex.slice(4, 6), 16);

    const dark = (c: number) => Math.floor(c * 0.6);

    return `#${dark(r).toString(16).padStart(2, '0')}${dark(g).toString(16).padStart(2, '0')}${dark(b).toString(16).padStart(2, '0')}`;
};
