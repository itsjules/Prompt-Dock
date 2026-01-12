import { create } from 'zustand';

type View = 'home' | 'builder' | 'library' | 'settings';

interface UIStore {
    isOverlayOpen: boolean;
    searchQuery: string;
    activeView: View;
    setOverlayOpen: (open: boolean) => void;
    setSearchQuery: (query: string) => void;
    setActiveView: (view: View) => void;
    toggleOverlay: () => void;
}

export const useUIStore = create<UIStore>((set) => ({
    isOverlayOpen: false,
    searchQuery: '',
    activeView: 'home',

    setOverlayOpen: (open) => set({ isOverlayOpen: open }),

    setSearchQuery: (query) => set({ searchQuery: query }),

    setActiveView: (view) => set({ activeView: view }),

    toggleOverlay: () => set((state) => ({ isOverlayOpen: !state.isOverlayOpen })),
}));
