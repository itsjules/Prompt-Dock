import { useMemo } from 'react';
import Fuse from 'fuse.js';
import { usePromptStore } from '../../stores/usePromptStore';
import { useUIStore } from '../../stores/useUIStore';
import { useBuilderStore } from '../../stores/useBuilderStore';
import { PromptCard } from './PromptCard';
import { SearchBar } from './SearchBar';
import './LibraryView.css';

export const LibraryView = () => {
    const { getAllPrompts } = usePromptStore();
    const { searchQuery, setActiveView } = useUIStore();
    const { loadPrompt } = useBuilderStore();

    // Get all prompts from store
    const prompts = getAllPrompts();

    // Setup Fuse instance
    const fuse = useMemo(() => {
        return new Fuse(prompts, {
            keys: [
                'title',
                'description',
                'tags.style',
                'tags.topic',
                'tags.technique'
            ],
            threshold: 0.4,
        });
    }, [prompts]);

    // Filter prompts
    const displayedPrompts = useMemo(() => {
        if (!searchQuery.trim()) return prompts;
        return fuse.search(searchQuery).map(result => result.item);
    }, [fuse, searchQuery, prompts]);

    const handleUsePrompt = (promptId: string) => {
        const prompt = prompts.find(p => p.id === promptId);
        if (prompt) {
            loadPrompt(prompt);
            setActiveView('builder');
        }
    };

    return (
        <div className="library-view">
            <SearchBar />

            <div className="library-content">
                {displayedPrompts.length === 0 ? (
                    <div className="empty-state">
                        <p>No prompts found. Try a different search or create a new one.</p>
                    </div>
                ) : (
                    <div className="prompts-grid">
                        {displayedPrompts.map(prompt => (
                            <PromptCard
                                key={prompt.id}
                                prompt={prompt}
                                onUse={() => handleUsePrompt(prompt.id)}
                            />
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
};
