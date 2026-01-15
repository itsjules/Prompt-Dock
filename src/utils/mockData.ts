import { useBlockStore } from '../stores/useBlockStore';
import { usePromptStore } from '../stores/usePromptStore';
import { useCollectionStore } from '../stores/useCollectionStore';
import { BlockType } from '../schemas/block.schema';

export const seedMockData = () => {
    const blockStore = useBlockStore.getState();
    const promptStore = usePromptStore.getState();
    const collectionStore = useCollectionStore.getState();

    // 1. Create Blocks (TACO Framework)
    const blocks = [
        // Role (Actor)
        {
            type: 'Role' as BlockType,
            content: "You are an expert Frontend Engineer specializing in React, TypeScript, and modern CSS frameworks. You prioritize accessibility, performance, and clean code.",
            label: "Frontend Expert Persona"
        },
        {
            type: 'Role' as BlockType,
            content: "Act as a Senior UX Designer who focuses on user-centric design principles, usability heuristics, and emotional design.",
            label: "UX Designer Persona"
        },
        // Task
        {
            type: 'Task' as BlockType,
            content: "Create a responsive React component for a dashboard widget that displays real-time data visualization.",
            label: "Dashboard Widget Task"
        },
        {
            type: 'Task' as BlockType,
            content: "Write a comprehensive unit test suite for a custom React hook that manages complex form state.",
            label: "Unit Test Task"
        },
        // Context
        {
            type: 'Context' as BlockType,
            content: "The project uses Next.js 14, Tailwind CSS for styling, and Shadcn UI components. State management is handled by Zustand.",
            label: "Tech Stack Context"
        },
        {
            type: 'Context' as BlockType,
            content: "The target audience is elderly users with low visual acuity. The design must adhere to WCAG 2.1 AAA standards.",
            label: "Accessibility Context"
        },
        // Output
        {
            type: 'Output' as BlockType,
            content: "Return only the complete source code for the component and a brief explanation of the props interface. Do not include installation instructions.",
            label: "Code Only Output"
        },
        {
            type: 'Output' as BlockType,
            content: "Provide a step-by-step implementation guide with code snippets for each file. Include comments explaining the logic.",
            label: "Tutorial Output"
        }
    ];

    const createdBlockIds: string[] = [];

    // Add blocks to store
    console.log("Seeding Blocks...");
    blocks.forEach(b => {
        // Note: addBlock expects omitted fields, label isn't in schema but might be useful if extended. 
        // Current schema doesn't have label, so we'll just ignore it or put in content? 
        // Wait, schema has NO label. I'll omit it from the actual call. 
        // Actually, users usually want to identify blocks. 
        // Schema checks: id, type, content, variables. No label. 
        // I'll stick to schema.
        const id = blockStore.addBlock({
            type: b.type,
            content: b.content,
            // variables: {} 
        });
        createdBlockIds.push(id);
    });

    // 2. Create Prompts using these blocks
    console.log("Seeding Prompts...");

    // Prompt 1: Widget Component
    const prompt1Id = promptStore.addPrompt({
        title: "Dashboard Widget Generator",
        description: "Generates a responsive dashboard widget code using React and Tailwind.",
        blocks: [createdBlockIds[0], createdBlockIds[2], createdBlockIds[4], createdBlockIds[6]], // Role, Task, Context, Output
        tags: {
            topic: ["Frontend", "React"],
            style: ["Professional"],
            technique: ["Chain of Thought"]
        }
    });

    // Prompt 2: Accessible Form Hook Test
    const prompt2Id = promptStore.addPrompt({
        title: "Accessible Form Tests",
        description: "Creates unit tests for form hooks focusing on accessibility standards.",
        blocks: [createdBlockIds[0], createdBlockIds[3], createdBlockIds[5], createdBlockIds[6]],
        tags: {
            topic: ["Testing", "Accessibility"],
            style: ["Concise"],
            technique: ["TDD"]
        }
    });

    // Prompt 3: UX Design Guide
    const prompt3Id = promptStore.addPrompt({
        title: "Accessibility Design Guide",
        description: "Generates a design guide for elderly user accessibility.",
        blocks: [createdBlockIds[1], createdBlockIds[5], createdBlockIds[7]],
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
    });

    // Add prompts to collection
    collectionStore.addPromptToCollection(collectionId, prompt1Id);
    collectionStore.addPromptToCollection(collectionId, prompt2Id);
    collectionStore.addPromptToCollection(collectionId, prompt3Id);

    console.log("Seed complete!");
};
