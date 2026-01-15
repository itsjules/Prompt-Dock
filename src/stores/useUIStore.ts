import { create } from 'zustand';

export type LibraryTab = 'all' | 'favorites' | 'recents' | 'collections';

type View = 'home' | 'builder' | 'library' | 'settings';

interface UIStore {
    isOverlayOpen: boolean;
    searchQuery: string;
    activeView: View;
    libraryTab: LibraryTab;
    activeCollectionId: string | null;
    recentSearches: string[];
    setOverlayOpen: (open: boolean) => void;
    setSearchQuery: (query: string) => void;
    setActiveView: (view: View) => void;
    setLibraryTab: (tab: LibraryTab) => void;
    setActiveCollectionId: (id: string | null) => void;
    addRecentSearch: (query: string) => void;
    toggleOverlay: () => void;
}

export const useUIStore = create<UIStore>((set) => ({
    isOverlayOpen: false,
    searchQuery: '',
    activeView: 'home',
    libraryTab: 'all',
    activeCollectionId: null,
    recentSearches: [],

    setOverlayOpen: (open) => set({ isOverlayOpen: open }),

    setSearchQuery: (query) => set({ searchQuery: query }),

    setActiveView: (view) => set({ activeView: view }),

    setLibraryTab: (tab) => set({ libraryTab: tab }),

    setActiveCollectionId: (id) => set({ activeCollectionId: id }),

    addRecentSearch: (query) => set((state) => {
        if (!query.trim()) return state;
        const filtered = state.recentSearches.filter(s => s !== query);
        return { recentSearches: [query, ...filtered].slice(0, 5) };
    }),

    toggleOverlay: () => set((state) => ({ isOverlayOpen: !state.isOverlayOpen })),
}));
