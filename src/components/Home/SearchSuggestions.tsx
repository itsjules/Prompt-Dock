import { useMemo } from 'react';
import { Search, History, Sparkles, FileText, LayoutGrid } from 'lucide-react';
import { useUIStore } from '../../stores/useUIStore';
import { usePromptStore } from '../../stores/usePromptStore';
import { useBlockStore } from '../../stores/useBlockStore';
import './SearchSuggestions.css';

interface SearchSuggestionsProps {
    onSelect: (query: string) => void;
}

export const SearchSuggestions = ({ onSelect }: SearchSuggestionsProps) => {
    const { searchQuery, recentSearches } = useUIStore();
    const { getAllPrompts } = usePromptStore();
    const { getAllBlocks } = useBlockStore();

    const query = searchQuery.trim().toLowerCase();

    const suggestions = useMemo(() => {
        if (!query) return [];

        const prompts = getAllPrompts();
        const blocks = getAllBlocks();

        // 1. Extract Keywords/Tags (Prioritized)
        const keywordMatches = new Map<string, { pCount: number, bCount: number }>();

        // Helper to add matches
        const addMatch = (term: string, isPrompt: boolean) => {
            const normalized = term.toLowerCase().trim();
            if (normalized.length < 2) return;
            if (normalized.includes(query) || query.includes(normalized)) {
                if (!keywordMatches.has(normalized)) {
                    keywordMatches.set(normalized, { pCount: 0, bCount: 0 });
                }
                const current = keywordMatches.get(normalized)!;
                if (isPrompt) current.pCount++;
                else current.bCount++;
            }
        };

        // Extract from Prompt tags and titles
        prompts.forEach(p => {
            p.title.split(/[\s-]+/).forEach(w => addMatch(w, true));
            if (p.tags) {
                Object.values(p.tags).flat().forEach(t => addMatch(t, true));
            }
        });

        // Extract from Block labels
        blocks.forEach(b => {
            b.label.split(/[\s-]+/).forEach(w => addMatch(w, false));
        });

        const results: any[] = [];

        // Add matching keywords first (Prioritized per user request)
        const sortedKeywords = Array.from(keywordMatches.entries())
            .sort((a, b) => {
                const aText = a[0];
                const bText = b[0];
                const aPrefix = aText.startsWith(query);
                const bPrefix = bText.startsWith(query);

                if (aPrefix && !bPrefix) return -1;
                if (!aPrefix && bPrefix) return 1;

                // If same prefix status, prioritize high volume
                return (b[1].pCount + b[1].bCount) - (a[1].pCount + a[1].bCount);
            })
            .slice(0, 4);

        sortedKeywords.forEach(([text, counts]) => {
            results.push({
                text,
                type: 'keyword',
                icon: <Search size={14} />,
                pCount: counts.pCount,
                bCount: counts.bCount
            });
        });

        // 2. Direct matches in titles/labels (Secondary)
        const matchingPrompts = prompts.filter(p =>
            p.title.toLowerCase().includes(query) &&
            !results.some(r => r.text.toLowerCase() === p.title.toLowerCase())
        );
        const matchingBlocks = blocks.filter(b =>
            b.label.toLowerCase().includes(query) &&
            !results.some(r => r.text.toLowerCase() === b.label.toLowerCase())
        );

        matchingPrompts.slice(0, 3).forEach(p => {
            results.push({
                text: p.title,
                type: 'prompt',
                icon: <FileText size={14} />
            });
        });

        matchingBlocks.slice(0, 2).forEach(b => {
            results.push({
                text: b.label,
                type: 'block',
                icon: <LayoutGrid size={14} />
            });
        });

        return results;
    }, [query, getAllPrompts, getAllBlocks]);

    if (!query && recentSearches.length === 0) return null;

    return (
        <div className="search-suggestions-container">
            <div className="search-suggestions-overlay">
                {/* Recent Searches */}
                {!query && recentSearches.length > 0 && (
                    <div className="suggestion-section">
                        <div className="section-header">Recent Searches</div>
                        {recentSearches.map((s, i) => (
                            <div key={i} className="suggestion-item" onClick={() => onSelect(s)}>
                                <History size={14} className="item-icon" />
                                <span className="item-text">{s}</span>
                            </div>
                        ))}
                    </div>
                )}

                {/* Autocomplete Suggestions */}
                {query && suggestions.length > 0 && (
                    <div className="suggestion-section">
                        <div className="section-header">Suggestions</div>
                        {suggestions.map((s, i) => (
                            <div key={i} className="suggestion-item" onClick={() => onSelect(s.text)}>
                                <div className="item-main">
                                    <span className="item-icon">{s.icon}</span>
                                    <span className="item-text">{s.text}</span>
                                </div>
                                {s.type === 'keyword' && (s.pCount > 0 || s.bCount > 0) && (
                                    <div className="item-counts">
                                        {s.pCount > 0 && <span>{s.pCount} prompts</span>}
                                        {s.bCount > 0 && <span>{s.bCount} blocks</span>}
                                    </div>
                                )}
                                {s.type !== 'keyword' && (
                                    <div className="item-tag">{s.type}</div>
                                )}
                            </div>
                        ))}
                    </div>
                )}

                {query && suggestions.length === 0 && (
                    <div className="no-suggestions">
                        <Sparkles size={16} />
                        <span>Search for "{searchQuery}" in Library</span>
                    </div>
                )}
            </div>
        </div>
    );
};
