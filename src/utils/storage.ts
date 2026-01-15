import { StorageSchema, type StorageData } from '../schemas/storage.schema';

// Electron IPC will be available via preload script
declare global {
    interface Window {
        electronAPI: {
            loadStorage: () => Promise<StorageData | null>;
            saveStorage: (data: StorageData) => Promise<boolean>;
            copyToClipboard: (text: string) => Promise<boolean>;
        };
    }
}

export async function loadStorage(): Promise<StorageData> {
    try {
        const data = await window.electronAPI.loadStorage();
        if (data === null) {
            // File doesn't exist, return defaults
            return getDefaultStorage();
        }
        return StorageSchema.parse(data);
    } catch (error) {
        console.error('Error loading storage:', error);
        // Initialize with default data if there's an error
        return getDefaultStorage();
    }
}

export async function saveStorage(data: StorageData): Promise<void> {
    try {
        const validated = StorageSchema.parse(data);
        await window.electronAPI.saveStorage(validated);
    } catch (error) {
        console.error('Error saving storage:', error);
        throw error;
    }
}

export async function copyToClipboard(text: string): Promise<void> {
    try {
        await window.electronAPI.copyToClipboard(text);
    } catch (error) {
        console.error('Error copying to clipboard:', error);
        throw error;
    }
}

function getDefaultStorage(): StorageData {
    const now = new Date().toISOString();

    // Collection IDs
    const charImitationId = 'char-imitation-coll';

    // Block IDs (Roles)
    const berndBtnId = 'bernd-btn';
    const louisBtnId = 'louis-btn';
    const patrickBtnId = 'patrick-btn';
    const yodaBtnId = 'yoda-btn';
    const sherlockBtnId = 'sherlock-btn';
    const gokuBtnId = 'goku-btn';

    // Block IDs (Styles)
    const victorianStyleId = 'victorian-style';
    const pessimisticStyleId = 'pessimistic-style';
    const crypticStyleId = 'cryptic-style';

    // Block IDs (Tasks)
    const analyzeTaskId = 'analyze-task';
    const explainTaskId = 'explain-task';
    const adviceTaskId = 'advice-task';

    // Block IDs (Constraints)
    const noContractionsId = 'no-contractions';
    const yodaGrammarId = 'yoda-grammar';
    const endMistId = 'end-mist';

    // Prompt IDs
    const sherlockPromptId = 'sherlock-prompt';
    const yodaPromptId = 'yoda-prompt';

    return {
        version: '1.0.0',
        blocks: {
            // Roles
            [berndBtnId]: {
                id: berndBtnId,
                type: 'Role',
                label: 'Bernd das Brot',
                content: 'Du bist Bernd das Brot, ein deprimiertes, kastenförmiges Brot. Deine Antworten sind kurz, pessimistisch und du willst eigentlich nur nach Hause gegen eine Raufasertapete starren. Mist.',
                isFavorite: false,
                createdAt: now,
                updatedAt: now
            },
            [louisBtnId]: {
                id: louisBtnId,
                type: 'Role',
                label: 'Louis Armstrong (FMAB)',
                content: 'I am Alex Louis Armstrong! The Strong Arm Alchemist! My techniques have been passed down the Armstrong line for GENERATIONS! *sparkles intensely*',
                isFavorite: false,
                createdAt: now,
                updatedAt: now
            },
            [patrickBtnId]: {
                id: patrickBtnId,
                type: 'Role',
                label: 'Patrick Star',
                content: 'Is this the Krusty Krab? No, this is Patrick! *heavy breathing* I have an idea! ... I forgot it.',
                isFavorite: false,
                createdAt: now,
                updatedAt: now
            },
            [yodaBtnId]: {
                id: yodaBtnId,
                type: 'Role',
                label: 'Yoda',
                content: 'Yoda you are. Grandmaster of the Jedi Order. Speak in inverted syntax you must. Wise and cryptic your advice should be.',
                isFavorite: false,
                createdAt: now,
                updatedAt: now
            },
            [sherlockBtnId]: {
                id: sherlockBtnId,
                type: 'Role',
                label: 'Sherlock Holmes',
                content: 'You are Sherlock Holmes. Highly analytical, observant, and slightly arrogant. Deduce details from the smallest clues and explain reasoning with rapid precision.',
                isFavorite: false,
                createdAt: now,
                updatedAt: now
            },
            [gokuBtnId]: {
                id: gokuBtnId,
                type: 'Role',
                label: 'Goku',
                content: 'Hey, it\'s me, Goku! You are a Saiyan raised on Earth. You love fighting strong opponents, eating lots of food, and protecting your friends. Optimistic and eager to train.',
                isFavorite: false,
                createdAt: now,
                updatedAt: now
            },

            // Styles
            [victorianStyleId]: {
                id: victorianStyleId,
                type: 'Style',
                label: 'Victorian Formal',
                content: 'Use formal Victorian English vocabulary. Avoid modern slang. Address the user as "My dear friend" or "Sir/Madam".',
                isFavorite: false,
                createdAt: now,
                updatedAt: now
            },
            [pessimisticStyleId]: {
                id: pessimisticStyleId,
                type: 'Style',
                label: 'Pessimistic/Depressed',
                content: 'Frame everything in a negative light. Focus on the futility of the task. Sigh frequently (*sigh*).',
                isFavorite: false,
                createdAt: now,
                updatedAt: now
            },
            [crypticStyleId]: {
                id: crypticStyleId,
                type: 'Style',
                label: 'Wise & Cryptic',
                content: 'Do not give direct answers. Use metaphors, riddles, and proverbs. Let the user find their own path.',
                isFavorite: false,
                createdAt: now,
                updatedAt: now
            },

            // Tasks
            [analyzeTaskId]: {
                id: analyzeTaskId,
                type: 'Task',
                label: 'Analyze Evidence',
                content: 'Analyze the provided text or scenario. Identify inconsistencies, hidden details, and logical fallacies.',
                isFavorite: false,
                createdAt: now,
                updatedAt: now
            },
            [explainTaskId]: {
                id: explainTaskId,
                type: 'Task',
                label: 'Explain Simply',
                content: 'Explain the topic as if the user is 5 years old. Use simple analogies.',
                isFavorite: false,
                createdAt: now,
                updatedAt: now
            },
            [adviceTaskId]: {
                id: adviceTaskId,
                type: 'Task',
                label: 'Give Philosophical Advice',
                content: 'Offer advice based on stoic philosophy or ancient wisdom.',
                isFavorite: false,
                createdAt: now,
                updatedAt: now
            },

            // Constraints
            [noContractionsId]: {
                id: noContractionsId,
                type: 'Constraints',
                label: 'No Contractions',
                content: 'Do not use contractions (e.g., use "do not" instead of "don\'t").',
                isFavorite: false,
                createdAt: now,
                updatedAt: now
            },
            [yodaGrammarId]: {
                id: yodaGrammarId,
                type: 'Constraints',
                label: 'Yoda Grammar',
                content: 'Object-Subject-Verb word order use. Verbs at the end of sentences place.',
                isFavorite: false,
                createdAt: now,
                updatedAt: now
            },
            [endMistId]: {
                id: endMistId,
                type: 'Constraints',
                label: 'End with "Mist"',
                content: 'End every response with the word "Mist".',
                isFavorite: false,
                createdAt: now,
                updatedAt: now
            }
        },
        prompts: {
            [sherlockPromptId]: {
                id: sherlockPromptId,
                title: 'The Consulting Detective',
                description: 'Analyze a situation like Sherlock Holmes.',
                blocks: [sherlockBtnId, victorianStyleId, analyzeTaskId, noContractionsId],
                tags: { style: ['Victorian', 'Analytical'], topic: ['Mystery', 'Logic'], technique: ['Roleplay'] },
                isFavorite: true,
                usageCount: 0,
                createdAt: now,
                updatedAt: now
            },
            [yodaPromptId]: {
                id: yodaPromptId,
                title: 'Wise Master\'s Advice',
                description: 'Get cryptic advice from Master Yoda.',
                blocks: [yodaBtnId, crypticStyleId, adviceTaskId, yodaGrammarId],
                tags: { style: ['Cryptic'], topic: ['Wisdom', 'Life'], technique: ['Roleplay'] },
                isFavorite: true,
                usageCount: 0,
                createdAt: now,
                updatedAt: now
            }
        },
        collections: {
            [charImitationId]: {
                id: charImitationId,
                name: 'Character Imitation',
                description: 'Prompts and blocks for mimicking varied characters.',
                promptIds: [sherlockPromptId, yodaPromptId],
                blockIds: [
                    berndBtnId, louisBtnId, patrickBtnId, yodaBtnId, sherlockBtnId, gokuBtnId,
                    victorianStyleId, pessimisticStyleId, crypticStyleId,
                    analyzeTaskId, explainTaskId, adviceTaskId,
                    noContractionsId, yodaGrammarId, endMistId
                ],
                createdAt: now,
                updatedAt: now
            }
        },
        settings: {
            globalHotkey: 'CommandOrControl+Shift+P',
            theme: 'system',
        },
    };
}
