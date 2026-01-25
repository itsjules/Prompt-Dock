import { useMemo } from 'react';
import { Search, History, Sparkles, FileText, LayoutGrid, Folder } from 'lucide-react';
import { useUIStore } from '../../stores/useUIStore';
import { usePromptStore } from '../../stores/usePromptStore';
import { useBlockStore } from '../../stores/useBlockStore';
import { useCollectionStore } from '../../stores/useCollectionStore';
import { useRoleStore } from '../../stores/useRoleStore';
import './SearchSuggestions.css';

export interface SuggestionItem {
    text: string;
    type: 'keyword' | 'prompt' | 'block' | 'collection';
    id?: string;
    icon?: React.ReactNode;
    pCount?: number;
    bCount?: number;
}

interface SearchSuggestionsProps {
    onSelect: (item: SuggestionItem | string) => void;
}

export const SearchSuggestions = ({ onSelect }: SearchSuggestionsProps) => {
    const { searchQuery, recentSearches } = useUIStore();
    const { getAllPrompts } = usePromptStore();
    const { getLibraryBlocks } = useBlockStore();
    const { getAllCollections } = useCollectionStore();
    const activeRoleId = useRoleStore(state => state.activeRoleId);
    const getRelevanceScore = useRoleStore(state => state.getRelevanceScore);

    const query = searchQuery.trim().toLowerCase();

    const suggestions = useMemo(() => {
        if (!query) return [];

        const prompts = getAllPrompts();
        const blocks = getLibraryBlocks();
        const collections = getAllCollections();

        // 1. Extract Keywords/Tags (Prioritized)
        const keywordMatches = new Map<string, { pCount: number, bCount: number }>();

        // Helper to add matches
        const addMatch = (term: string, isPrompt: boolean) => {
            // Strip punctuation and normalize
            const normalized = term.toLowerCase().replace(/[.,!?;:]/g, '').trim();
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

        // Extract from Prompt tags, titles, and descriptions
        prompts.forEach(p => {
            p.title.split(/[\s-]+/).forEach(w => addMatch(w, true));
            if (p.description) {
                p.description.split(/[\s-]+/).forEach(w => addMatch(w, true));
            }
            if (p.tags) {
                Object.values(p.tags).flat().forEach(t => addMatch(t, true));
            }
        });

        // Extract from Block labels and content
        blocks.forEach(b => {
            (b.label || '').split(/[\s-]+/).forEach(w => addMatch(w, false));
            b.content.split(/[\s-]+/).forEach(w => addMatch(w, false));
        });

        const results: SuggestionItem[] = [];

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
            .slice(0, 3); // Slightly reduced to make room for collections

        sortedKeywords.forEach(([text, counts]) => {
            // Only add if it's not a direct match to a collection name (avoid dupe-ish feel)
            results.push({
                text,
                type: 'keyword',
                icon: <Search size={14} />,
                pCount: counts.pCount,
                bCount: counts.bCount
            });
        });

        // 2. Direct matches (Collections, Prompts, Blocks)

        const matchingCollections = collections.filter(c =>
            c.name.toLowerCase().includes(query)
        );

        const matchingPrompts = prompts.filter(p =>
            p.title.toLowerCase().includes(query) &&
            !results.some(r => r.text.toLowerCase() === p.title.toLowerCase())
        );
        const matchingBlocks = blocks.filter(b =>
            (b.label || '').toLowerCase().includes(query) &&
            !results.some(r => r.text.toLowerCase() === (b.label || '').toLowerCase())
        );

        // Add Collections
        matchingCollections.slice(0, 2).forEach(c => {
            results.push({
                text: c.name,
                type: 'collection',
                id: c.id,
                icon: <Folder size={14} />
            });
        });

        // Add Prompts
        matchingPrompts.slice(0, 3).forEach(p => {
            results.push({
                text: p.title,
                type: 'prompt',
                // id: p.id, // Can add ID if we want direct nav to builder later
                icon: <FileText size={14} />
            });
        });

        // Add Blocks
        matchingBlocks.slice(0, 2).forEach(b => {
            results.push({
                text: b.label || 'Unnamed Block',
                type: 'block',
                // id: b.id, 
                icon: <LayoutGrid size={14} />
            });
        });

        const { getRelevanceScore } = useRoleStore.getState();

        // Final Sort: Apply Role Relevance to results
        // Keywords are already sorted by volume, but we might want to boost role-relevant ones?
        // Prioritize keywords that match role keywords.

        // 1. Re-sort keywords
        // We can check if the keyword matches any active role keywords for a boost.
        // Actually keywords are user inputs, but if they match role keywords they are likely better.

        // 2. Re-sort Items (Prompts/Blocks)
        // We want to sort the typed results (prompts/blocks/collections) by relevance too.

        const finalResults = results.sort((a, b) => {
            // Priority: Keyword > Collection > Prompt > Block (default structure)
            // But within same type, use relevance.

            const typeScore = (type: string) => {
                if (type === 'keyword') return 4;
                if (type === 'collection') return 3;
                if (type === 'prompt') return 2;
                return 1;
            };

            if (a.type !== b.type) {
                return typeScore(b.type) - typeScore(a.type);
            }

            // Same type: check content relevance
            const textA = a.text; // rudimentary, ideally check full object
            const textB = b.text;

            const scoreA = getRelevanceScore(textA); // tags missing here, but okay for quick suggestions
            const scoreB = getRelevanceScore(textB);

            if (scoreA !== scoreB) {
                return scoreB - scoreA;
            }

            return 0; // maintain original order (like volume match)
        });

        return finalResults;
    }, [query, getAllPrompts, getLibraryBlocks, getAllCollections, activeRoleId, getRelevanceScore]);

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
                            <div key={i} className="suggestion-item" onClick={() => onSelect(s)}>
                                <div className="item-main">
                                    <span className="item-icon">{s.icon}</span>
                                    <span className="item-text">{s.text}</span>
                                </div>
                                {s.type === 'keyword' && (
                                    <div className="item-counts">
                                        <span>
                                            {[
                                                (s.pCount ?? 0) > 0 && `${s.pCount} prompts`,
                                                (s.bCount ?? 0) > 0 && `${s.bCount} blocks`
                                            ].filter(Boolean).join(', ')}
                                        </span>
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
                        <div className="no-suggestions-text">
                            <span>No direct matches for "{searchQuery}"</span>
                            <span className="sub-text">Press <b>Enter</b> to search text in Library.</span>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};
