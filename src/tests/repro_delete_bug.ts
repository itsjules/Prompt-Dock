
// Simulation of BlockStore and PromptStore behavior to reproduce the bug
// We can't import the actual stores easily in a standalone node script without transpilation setup,
// so we'll mock the minimal state logic to demonstrate the flaw.

console.log("=== Reproduction Script: Unnamed Block Persistence ===");

// Mock Data Structures
interface Block {
    id: string;
    label: string;
    content: string;
}

interface Prompt {
    id: string;
    blocks: (string | { content: string })[]; // mixed IDs and inline objects
}

// Stores
let blocks: Record<string, Block> = {};
let prompts: Record<string, Prompt> = {};

// Helper to add block
const addBlock = (content: string, label: string = ''): string => {
    const id = Math.random().toString(36).substring(7);
    blocks[id] = { id, label, content };
    return id;
};

// SETUP: Creating "Duplicate" Unnamed Blocks (Simulating the user's state)
console.log("Step 1: Setup - Creating duplicates...");
// User imported the same prompt multiple times or builder created hydration duplicates
const blockId1 = addBlock("This is text A", ""); // Unnamed 1
const blockId2 = addBlock("This is text A", ""); // Unnamed 2 (Duplicate content!)
const blockId3 = addBlock("This is text B", "Named Block"); // Named block (Library)

// Create a Prompt that uses "This is text A" as an INLINE block (hydrated)
// In the real app, the prompt stores: blocks: [{ content: "This is text A" }]
// And the Builder hydrates this into a temp block, or in this case, 
// let's assume the user has run the builder and "hydrated" blocks exist in the store (blockId1, blockId2).
prompts['prompt-1'] = {
    id: 'prompt-1',
    blocks: [
        { content: "This is text A" }, // Inline block
        blockId3 // Named block ID
    ]
};

console.log(`Initial Store State: 
    Blocks: ${Object.keys(blocks).length} (${Object.values(blocks).map(b => b.label || 'unnamed').join(', ')})
    Prompts: 1
`);


// THE BUGGY DELETE FUNCTION (Simulating current implementation)
function deletePromptBuggy(promptId: string) {
    console.log(`Deleting prompt ${promptId}...`);
    const prompt = prompts[promptId];
    if (!prompt) return;

    // logic from current implementation
    const candidateBlockIds = new Set<string>();

    // Check inline blocks
    prompt.blocks.forEach(item => {
        if (typeof item !== 'string') {
            // "checkDuplicates" mock - finds FIRST match
            const match = Object.values(blocks).find(b => b.content === item.content);
            if (match && (!match.label || match.label === '')) {
                console.log(`  Found candidate via content match: ${match.id}`);
                candidateBlockIds.add(match.id);
            }
        }
    });

    // Deletion
    candidateBlockIds.forEach(id => {
        console.log(`  Deleting block ${id}`);
        delete blocks[id];
    });

    delete prompts[promptId];
}

// EXECUTE BUGGY DELETE
deletePromptBuggy('prompt-1');

// VERIFY RESULT
const remainingUnnamed = Object.values(blocks).filter(b => !b.label);
console.log("\nResult:");
if (remainingUnnamed.length > 0) {
    console.log(`❌ FAILURE: ${remainingUnnamed.length} unnamed block(s) still exist!`);
    console.log(`   Remaining IDs: ${remainingUnnamed.map(b => b.id).join(', ')}`);
} else {
    console.log("✅ SUCCESS: All unnamed blocks deleted.");
}

console.log("\n=== Proposed Fix: Garbage Collection ===");

// Reset
blocks = {};
prompts = {};
addBlock("This is text A", ""); // Unnamed 1
addBlock("This is text A", ""); // Unnamed 2
prompts['prompt-1'] = { id: 'prompt-1', blocks: [{ content: "This is text A" }] };

// FIX LOGIC
function deletePromptFixed(promptId: string) {
    console.log(`Deleting prompt ${promptId} (Fixed Logic)...`);

    // 1. Calculate ALL explicitly used block IDs from OTHER prompts
    const otherPrompts = Object.values(prompts).filter(p => p.id !== promptId);
    const usedBlockIds = new Set<string>();
    otherPrompts.forEach(p => {
        p.blocks.forEach(b => {
            if (typeof b === 'string') usedBlockIds.add(b);
        });
    });

    // 2. Identify blocks in the DELETED prompt (both explicit IDs and content matches)
    const promptToDelete = prompts[promptId];
    // We want to delete ANY unnamed block that matches the content of this prompt's inline blocks
    // AND is not used elsewhere.
    // actually, even simpler: "Garbage Collect" approach.
    // If we delete the prompt, we just scan ALL unnamed blocks in the store.
    // If an unnamed block is NOT in `usedBlockIds`, it is an orphan. Delete it.
    // Wait, is there a case where an unnamed block exists validly but isn't in a prompt?
    // - User created it in "Unnamed" category manually but hasn't assigned it?
    // - If we delete "Prompt A", should we delete "Manual Unnamed Block X"?
    // The user wants "associated unnamed blocks" deleted.
    // "Associated" implies they came from this prompt.
    // Checking content match against `promptToDelete` + orphan check is safer than global GC.

    const contentToClean = new Set<string>();
    promptToDelete.blocks.forEach(b => {
        if (typeof b !== 'string') contentToClean.add(b.content);
    });

    const blocksToDelete = Object.values(blocks).filter(b => {
        const isUnnamed = !b.label || b.label === '';
        const matchesContent = contentToClean.has(b.content); // Matches deleted prompt content
        const isNotUsedElsewhere = !usedBlockIds.has(b.id);

        return isUnnamed && matchesContent && isNotUsedElsewhere;
    });

    blocksToDelete.forEach(b => {
        console.log(`  GC: Deleting block ${b.id}`);
        delete blocks[b.id];
    });

    delete prompts[promptId];
}

deletePromptFixed('prompt-1');

// VERIFY FIX
const remainingUnnamedFixed = Object.values(blocks).filter(b => !b.label);
if (remainingUnnamedFixed.length === 0) {
    console.log("✅ SUCCESS: All duplicates deleted.");
} else {
    console.log("❌ FAILURE: Duplicates persist.");
}
