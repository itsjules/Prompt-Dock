import { create } from 'zustand';

export type LibraryTab = 'all' | 'favorites' | 'recents' | 'collections';

type View = 'home' | 'builder' | 'library' | 'settings';

interface UIStore {
    isOverlayOpen: boolean;
    searchQuery: string;
    activeView: View;
    libraryTab: LibraryTab;
    setOverlayOpen: (open: boolean) => void;
    setSearchQuery: (query: string) => void;
    setActiveView: (view: View) => void;
    setLibraryTab: (tab: LibraryTab) => void;
    toggleOverlay: () => void;
}

export const useUIStore = create<UIStore>((set) => ({
    isOverlayOpen: false,
    searchQuery: '',
    activeView: 'home',
    libraryTab: 'all',

    setOverlayOpen: (open) => set({ isOverlayOpen: open }),

    setSearchQuery: (query) => set({ searchQuery: query }),

    setActiveView: (view) => set({ activeView: view }),

    setLibraryTab: (tab) => set({ libraryTab: tab }),

    toggleOverlay: () => set((state) => ({ isOverlayOpen: !state.isOverlayOpen })),
}));
