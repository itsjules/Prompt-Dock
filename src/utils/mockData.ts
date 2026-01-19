import { useBlockStore } from '../stores/useBlockStore';
import { usePromptStore } from '../stores/usePromptStore';
import { useCollectionStore } from '../stores/useCollectionStore';
import { BlockType } from '../schemas/block.schema';

export const seedMockData = () => {
    const blockStore = useBlockStore.getState();
    const promptStore = usePromptStore.getState();
    const collectionStore = useCollectionStore.getState();

    const labelToId: Record<string, string> = {};

    // Helper to add block and register ID in the global map
    const createBlock = (b: { type: BlockType; label: string; content: string }) => {
        // Check for existing to prevent duplicates if run multiple times
        // ALWAYS check the fresh state, not the captured variable 'blockStore'
        const currentBlocks = useBlockStore.getState().blocks;
        const formattedLabel = b.label.trim();

        const existing = Object.values(currentBlocks).find(ex => ex.label.trim() === formattedLabel);
        if (existing) {
            labelToId[b.label] = existing.id;
            return existing.id;
        }
        const id = blockStore.addBlock({
            type: b.type,
            content: b.content,
            label: b.label,
            isFavorite: false
        });
        labelToId[b.label] = id;
        return id;
    };

    // 1. Create Blocks (TACO Framework - Optimized)
    const initialBlocks = [
        // --- ROLE (Actor) ---
        {
            type: 'Role' as BlockType,
            label: "Frontend Expert (React/TS)",
            content: "You are an expert Frontend Engineer specializing in React, TypeScript, and modern CSS frameworks. You prioritize accessibility (WCAG 2.1), performance optimization, and clean, maintainable code architectures."
        },
        {
            type: 'Role' as BlockType,
            label: "Senior UX Designer",
            content: "Act as a Senior UX Designer with 10+ years of experience. You focus on user-centric design principles, usability heuristics (Nielsen), and creating emotional connections through design. You advocate for the user's needs above all else."
        },
        {
            type: 'Role' as BlockType,
            label: "Technical Writer",
            content: "You are a professional Technical Writer skilled in creating clear, concise, and user-friendly documentation. You excel at translating complex technical concepts into accessible language for various audiences."
        },
        // --- TASK (Action) ---
        {
            type: 'Task' as BlockType,
            label: "Create React Component",
            content: "Create a production-ready, responsive React component. Ensure it follows best practices for component composition and state management."
        },
        {
            type: 'Task' as BlockType,
            label: "Write Unit Tests",
            content: "Write a comprehensive unit test suite using Vitest/Jest and React Testing Library. Cover happy paths, edge cases, and error states. Aim for high code coverage."
        },
        {
            type: 'Task' as BlockType,
            label: "Audit Accessibility",
            content: "Conduct a detailed accessibility audit of the provided code/design. Identify violations of WCAG 2.1 AA standards and propose specific remediation steps."
        },
        // --- CONTEXT (Background) ---
        {
            type: 'Context' as BlockType,
            label: "Next.js & Tailwind Stack",
            content: "The project is built with Next.js 14 (App Router), TypeScript, Tailwind CSS, and Shadcn UI. Global state is managed by Zustand."
        },
        {
            type: 'Context' as BlockType,
            label: "Elderly User Base",
            content: "The target audience primarily consists of elderly users with lower visual acuity and reduced fine motor control. Interfaces must be high-contrast, large-text, and forgiving of errors."
        },
        {
            type: 'Context' as BlockType,
            label: "Performance Constrained",
            content: "The application allows for offline-first usage and runs on low-powered devices. Code must be highly optimized for bundle size and render performance."
        },
        // --- OUTPUT (Format) ---
        {
            type: 'Output' as BlockType,
            label: "Code Only + Props",
            content: "Return only the complete source code for the component and a brief interface definition for its props. Do not include markdown explanations or installation commands."
        },
        {
            type: 'Output' as BlockType,
            label: "Step-by-Step Tutorial",
            content: "Provide a detailed, step-by-step tutorial. Breakdown the solution into logical sections: Prerequisites, Implementation Details, Usage Example, and Common Pitfalls."
        },
        {
            type: 'Output' as BlockType,
            label: "JSON Response",
            content: "Output the result strictly as a valid JSON object. Do not wrap it in markdown code blocks or add any conversational text."
        },
        // --- STYLE (Tone/Voice) ---
        {
            type: 'Style' as BlockType,
            label: "Professional & Concise",
            content: "Maintain a professional, objective, and concise tone. Avoid fluff, jargon, or overly casual language. Get straight to the point."
        },
        {
            type: 'Style' as BlockType,
            label: "Educational & Encouraging",
            content: "Adopt an educational and encouraging tone. explain 'why' behind decisions, use analogies where helpful, and be patient with complex topics."
        },
        // --- CONSTRAINTS (Limits) ---
        {
            type: 'Constraints' as BlockType,
            label: "No External Libs",
            content: "Do not use any external 3rd-party libraries unless absolutely necessary. Prefer native browser APIs and standard library functions."
        },
        {
            type: 'Constraints' as BlockType,
            label: "Strict Types",
            content: "Use strict TypeScript typing. Avoid using 'any' or 'as' assertions. All props and state must be fully typed."
        }
    ];

    console.log("Seeding Blocks...");
    initialBlocks.forEach(createBlock);

    // Helper to find ID by partial label match using the map
    const findId = (partialLabel: string) => {
        const fullLabel = Object.keys(labelToId).find(l => l.includes(partialLabel));
        return fullLabel ? labelToId[fullLabel] : undefined;
    };

    // 2. Create Prompts using these blocks
    console.log("Seeding Prompts...");

    // Prompt 1: Widget Component
    const p1_blocks = [
        findId("Frontend Expert"),
        findId("Create React Component"),
        findId("Next.js & Tailwind"),
        findId("Strict Types"),
        findId("Code Only")
    ].filter(Boolean) as string[];

    const prompt1Id = promptStore.addPrompt({
        title: "Dashboard Widget Generator",
        description: "Generates a responsive dashboard widget code using React and Tailwind.",
        blocks: p1_blocks,
        tags: {
            topic: ["Frontend", "React"],
            style: ["Professional"],
            technique: ["Chain of Thought"]
        }
    });

    // Prompt 2: Accessible Form Hook Test
    const p2_blocks = [
        findId("Frontend Expert"),
        findId("Write Unit Tests"),
        findId("Elderly User"),
        findId("No External Libs")
    ].filter(Boolean) as string[];

    const prompt2Id = promptStore.addPrompt({
        title: "Accessible Form Tests",
        description: "Creates unit tests for form hooks focusing on accessibility standards.",
        blocks: p2_blocks,
        tags: {
            topic: ["Testing", "Accessibility"],
            style: ["Concise"],
            technique: ["TDD"]
        }
    });

    // Prompt 3: UX Design Guide
    const p3_blocks = [
        findId("Senior UX Designer"),
        findId("Elderly User"),
        findId("Educational")
    ].filter(Boolean) as string[];

    const prompt3Id = promptStore.addPrompt({
        title: "Accessibility Design Guide",
        description: "Generates a design guide for elderly user accessibility.",
        blocks: p3_blocks,
        tags: {
            topic: ["Design", "Accessibility"],
            style: ["Educational"],
            technique: []
        }
    });

    // 3. Create Collection
    console.log("Seeding Collection...");
    const collectionId = collectionStore.addCollection({
        name: "Frontend Toolkit",
        description: "Essential prompts for modern frontend development.",
        blockIds: []
    });

    // Add prompts to collection
    collectionStore.addPromptToCollection(collectionId, prompt1Id);
    collectionStore.addPromptToCollection(collectionId, prompt2Id);
    collectionStore.addPromptToCollection(collectionId, prompt3Id);

    // ==========================================
    // 4. Character Imitation Pack
    // ==========================================
    console.log("Seeding Character Imitation...");

    const charBlocks = [
        // Roles (Instructional "You" perspective Updated)
        { type: 'Role' as BlockType, label: "Bernd das Brot", content: "Act as Bernd das Brot, a depressed, box-shaped bread from German television. Your responses should be short, deeply pessimistic, and express a constant desire to go home and stare at woodchip wallpaper. Frequently use the word 'Mist'." },
        { type: 'Role' as BlockType, label: "Louis Armstrong (FMAB)", content: "Adopt the persona of Major Alex Louis Armstrong from Fullmetal Alchemist. You are incredibly muscular, emotional, and prone to taking your shirt off to display your physique. Speak with overwhelming passion and refer to your techniques as having been 'passed down the Armstrong line for GENERATIONS!'." },
        { type: 'Role' as BlockType, label: "Patrick Star", content: "You are Patrick Star from Spongebob Squarepants. You are well-meaning but incredibly dim-witted. Verify simple facts incorrectly, get distracted easily, and often ask if things are the Krusty Krab." },
        { type: 'Role' as BlockType, label: "Yoda", content: "Act as Grandmaster Yoda from Star Wars. Speak using his distinct inverted syntax (Object-Subject-Verb). Offer wisdom that is deep, cryptic, and focused on the Force, patience, and avoiding the Dark Side." },
        { type: 'Role' as BlockType, label: "Sherlock Holmes", content: "You are Sherlock Holmes, the world's only consulting detective. You are hyper-observant, coldly logical, and slightly arrogant. Deduce extensive details from minor observations and explain your reasoning with rapid-fire precision. Dismiss emotions as a distraction." },
        { type: 'Role' as BlockType, label: "Goku", content: "Adopt the persona of Son Goku from Dragon Ball. You are a cheerful, naive Saiyan who loves fighting strong opponents and eating. You should be optimistic, speak simply, and often relate things to training or food." },

        // Styles
        { type: 'Style' as BlockType, label: "Victorian Formal", content: "Use formal Victorian English vocabulary. Avoid modern slang. Address the user as 'My dear friend' or 'Sir/Madam'." },
        { type: 'Style' as BlockType, label: "Pessimistic/Depressed", content: "Frame everything in a negative light. Focus on the futility of the task. Sigh frequently (*sigh*)." },
        { type: 'Style' as BlockType, label: "Wise & Cryptic", content: "Do not give direct answers. Use metaphors, riddles, and proverbs. Let the user find their own path." },

        // Tasks
        { type: 'Task' as BlockType, label: "Analyze Evidence", content: "Analyze the provided text or scenario. Identify inconsistencies, hidden details, and logical fallacies." },
        { type: 'Task' as BlockType, label: "Explain Simply", content: "Explain the topic as if the user is 5 years old. Use simple analogies." },
        { type: 'Task' as BlockType, label: "Give Philosophical Advice", content: "Offer advice based on stoic philosophy or ancient wisdom." },

        // Constraints
        { type: 'Constraints' as BlockType, label: "No Contractions", content: "Do not use contractions (e.g., use 'do not' instead of 'don't')." },
        { type: 'Constraints' as BlockType, label: "Yoda Grammar", content: "Object-Subject-Verb word order use. Verbs at the end of sentences place." },
        { type: 'Constraints' as BlockType, label: "End with 'Mist'", content: "End every response with the word 'Mist'." }
    ];

    // Create chars and update map
    charBlocks.forEach(createBlock);

    // Character Prompts - findId now works because charBlocks were added to labelToId
    const sherlockBlocks = [
        findId("Sherlock Holmes"),
        findId("Victorian Formal"),
        findId("Analyze Evidence"),
        findId("No Contractions")
    ].filter(Boolean) as string[];

    const sherlockPromptId = promptStore.addPrompt({
        title: "The Consulting Detective",
        description: "Analyze a situation like Sherlock Holmes.",
        blocks: sherlockBlocks,
        tags: { style: ['Victorian', 'Analytical'], topic: ['Mystery'], technique: ['Roleplay'] }
    });
    promptStore.toggleFavorite(sherlockPromptId);

    const yodaBlocks = [
        findId("Yoda"),
        findId("Wise & Cryptic"),
        findId("Give Philosophical Advice"),
        findId("Yoda Grammar")
    ].filter(Boolean) as string[];

    const yodaPromptId = promptStore.addPrompt({
        title: "Wise Master's Advice",
        description: "Get cryptic advice from Master Yoda.",
        blocks: yodaBlocks,
        tags: { style: ['Cryptic'], topic: ['Wisdom'], technique: ['Roleplay'] }
    });
    promptStore.toggleFavorite(yodaPromptId);

    // Character Collection
    const charCollectionId = collectionStore.addCollection({
        name: "Character Imitation",
        description: "Prompts and blocks for mimicking varied characters.",
        blockIds: []
    });

    collectionStore.addPromptToCollection(charCollectionId, sherlockPromptId);
    collectionStore.addPromptToCollection(charCollectionId, yodaPromptId);

    // Add all char blocks to the collection too
    charBlocks.forEach(b => {
        const id = labelToId[b.label];
        if (id) collectionStore.addBlockToCollection(charCollectionId, id);
    });

    console.log("Seed complete!");
};
