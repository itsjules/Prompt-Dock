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

        const existing = Object.values(currentBlocks).find(ex => ex.label?.trim() === formattedLabel);
        if (existing) {
            labelToId[b.label] = existing.id;
            return existing.id;
        }
        const id = blockStore.addBlock({
            type: b.type,
            content: b.content,
            label: b.label,
            isFavorite: false,
            isFullPrompt: false,
            variables: {}
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
        isFullPrompt: false,
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
        isFullPrompt: false,
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
        isFullPrompt: false,
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



        { type: 'Role' as BlockType, label: "Sherlock Holmes", content: "You are Sherlock Holmes, the world's only consulting detective. You are hyper-observant, coldly logical, and slightly arrogant. Deduce extensive details from minor observations and explain your reasoning with rapid-fire precision. Dismiss emotions as a distraction." },


        // Styles
        { type: 'Style' as BlockType, label: "Victorian Formal", content: "Use formal Victorian English vocabulary. Avoid modern slang. Address the user as 'My dear friend' or 'Sir/Madam'." },

        // Tasks
        { type: 'Task' as BlockType, label: "Analyze Evidence", content: "Analyze the provided text or scenario. Identify inconsistencies, hidden details, and logical fallacies." },
        { type: 'Task' as BlockType, label: "Explain Simply", content: "Explain the topic as if the user is 5 years old. Use simple analogies." },

        // Constraints
        { type: 'Constraints' as BlockType, label: "No Contractions", content: "Do not use contractions (e.g., use 'do not' instead of 'don't')." },

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
        isFullPrompt: false,
        title: "The Consulting Detective",
        description: "Analyze a situation like Sherlock Holmes.",
        blocks: sherlockBlocks,
        tags: { style: ['Victorian', 'Analytical'], topic: ['Mystery'], technique: ['Roleplay'] }
    });
    promptStore.toggleFavorite(sherlockPromptId);



    // Character Collection
    const charCollectionId = collectionStore.addCollection({
        name: "Character Imitation",
        description: "Prompts and blocks for mimicking varied characters.",
        blockIds: []
    });

    collectionStore.addPromptToCollection(charCollectionId, sherlockPromptId);


    // Add all char blocks to the collection too
    charBlocks.forEach(b => {
        const id = labelToId[b.label];
        if (id) collectionStore.addBlockToCollection(charCollectionId, id);
    });



    // ==========================================
    // 5. UX Research Pack
    // ==========================================
    console.log("Seeding UX Research...");

    const researchBlocks = [
        // Role
        {
            type: 'Role' as BlockType,
            label: "UX Researcher",
            content: "Act as an experienced UX Researcher. You are objective, empathetic, and rigorous. You prioritize unbiased data collection, user advocacy, and actionable insights. You follow best practices from NN/g and methods like triangulation."
        },

        // Tasks
        {
            type: 'Task' as BlockType,
            label: "Draft Unbiased Survey",
            content: "Draft 12 survey questions that measure (a) task success, (b) perceived effort, (c) trust, (d) error recovery for a new [context/ flow/ product]. Use item-specific wording (no agree/disagree)."
        },
        {
            type: 'Task' as BlockType,
            label: "Simulate Think-Aloud",
            content: "Simulate 3 think-aloud participants answering these 8 survey questions. Use probing (e.g., “What does ‘secure session’ mean to you?”)."
        },
        {
            type: 'Task' as BlockType,
            label: "Create Interview Guide",
            content: "Create a 45-min semi-structured interview guide to explore [context]."
        },

        // Contexts
        {
            type: 'Context' as BlockType,
            label: "General Mobile Users",
            content: "General adult users, varied digital literacy, mobile-first context."
        },
        {
            type: 'Context' as BlockType,
            label: "Non-Native English",
            content: "Users with mixed digital literacy and non-native English proficiency."
        },
        {
            type: 'Context' as BlockType,
            label: "Accessibility Needs",
            content: "Adult users with varied accessibility needs (visual, motor, cognitive)."
        },

        // Constraints
        {
            type: 'Constraints' as BlockType,
            label: "Survey Best Practices",
            content: "Keep language CEFR B1; avoid leading/loaded words; one construct per item; include 3 behavioral questions and 3 open-ends; total length ≤7 minutes."
        },
        {
            type: 'Constraints' as BlockType,
            label: "Cognitive Breakdown",
            content: "Identify comprehension breakdowns, recall difficulty, judgment heuristics, and response mapping issues."
        },
        {
            type: 'Constraints' as BlockType,
            label: "Neutral Probing",
            content: "Neutral phrasing; avoid suggesting solutions; include task-based probes and laddering ('why does that matter?')."
        },

        // Outputs
        {
            type: 'Output' as BlockType,
            label: "Survey Table",
            content: "Return a markdown table with columns [Goal | Question | Response Type | Scale/Options | Notes], using 5-point labeled scales where applicable with balanced endpoints."
        },
        {
            type: 'Output' as BlockType,
            label: "Issue Log",
            content: "For each question: [Paraphrase | Suspected Issue | Evidence | Risk: Low/Med/High | Suggested Rewrite]."
        },
        {
            type: 'Output' as BlockType,
            label: "Structured Guide",
            content: "Guide with [Objectives | Intro & Consent Script | Warm-up | Core Sections (Q+Probes) | Wrap-up | Bias Watchouts | Accessibility Checklist]."
        }
    ];

    researchBlocks.forEach(createBlock);

    // Prompt 1: Draft Unbiased Survey Items
    const surveyBlocks = [
        findId("UX Researcher"),
        findId("Draft Unbiased Survey"),
        findId("General Mobile Users"),
        findId("Survey Best Practices"),
        findId("Survey Table")
    ].filter(Boolean) as string[];

    const surveyPromptId = promptStore.addPrompt({
        isFullPrompt: false,
        title: "Unbiased Survey Items",
        description: "Drafts unbiased survey questions measuring success, effort, and trust.",
        blocks: surveyBlocks,
        tags: { topic: ['Research', 'Survey'], style: ['Neutral'], technique: ['Quantitative'] }
    });

    // Prompt 2: Cognitive Interview Simulation
    const cogWalkBlocks = [
        findId("UX Researcher"),
        findId("Simulate Think-Aloud"),
        findId("Non-Native English"),
        findId("Cognitive Breakdown"),
        findId("Issue Log")
    ].filter(Boolean) as string[];

    const cogWalkPromptId = promptStore.addPrompt({
        isFullPrompt: false,
        title: "Cognitive Interview Sim",
        description: "Simulates think-aloud participants to identify comprehension issues.",
        blocks: cogWalkBlocks,
        tags: { topic: ['Research', 'Testing'], style: ['Analytical'], technique: ['Simulation'] }
    });

    // Prompt 3: Interview Guide Drafting
    const guideBlocks = [
        findId("UX Researcher"),
        findId("Create Interview Guide"),
        findId("Accessibility Needs"),
        findId("Neutral Probing"),
        findId("Structured Guide")
    ].filter(Boolean) as string[];

    const guidePromptId = promptStore.addPrompt({
        isFullPrompt: false,
        title: "Interview Guide Starter",
        description: "Creates a semi-structured interview guide with neutral probing.",
        blocks: guideBlocks,
        tags: { topic: ['Research', 'Interview'], style: ['Structured'], technique: ['Qualitative'] }
    });

    // UX Research Collection
    const researchCollectionId = collectionStore.addCollection({
        name: "UX Research",
        description: "Templates for survey design, interviewing, and testing.",
        blockIds: []
    });

    collectionStore.addPromptToCollection(researchCollectionId, surveyPromptId);
    collectionStore.addPromptToCollection(researchCollectionId, cogWalkPromptId);
    collectionStore.addPromptToCollection(researchCollectionId, guidePromptId);

    // Add research blocks to collection
    researchBlocks.forEach(b => {
        const id = labelToId[b.label];
        if (id) collectionStore.addBlockToCollection(researchCollectionId, id);
    });

    console.log("Seed complete!");
};
