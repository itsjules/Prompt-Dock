import { create } from 'zustand';
import { v4 as uuidv4 } from 'uuid';
import type { Role } from '../schemas/role.schema';

interface RoleStore {
    roles: Record<string, Role>;
    activeRoleId: string | null;
    activeRole: Role | null;

    addRole: (role: Omit<Role, 'id' | 'isSystem'>) => string;
    updateRole: (id: string, updates: Partial<Omit<Role, 'id' | 'isSystem'>>) => void;
    deleteRole: (id: string) => void;
    setActiveRole: (id: string | null) => void;

    setRoles: (roles: Record<string, Role>) => void;
    setActiveRoleId: (id: string | null) => void;

    getRelevanceScore: (text: string, tags?: string[]) => number;
}

export const DEFAULT_ROLES: Role[] = [
    { id: 'role-personal', name: 'Personal', keywords: ['personal', 'journal', 'creative', 'diary', 'story', 'blog', 'roleplay', 'character', 'wisdom', 'advice', 'mystery'], isSystem: true, description: 'For personal projects and creative writing' },
    { id: 'role-coding', name: 'Coding', keywords: ['code', 'programming', 'typescript', 'python', 'bug', 'refactor', 'git', 'test', 'frontend', 'backend', 'react', 'js', 'html', 'css', 'api', 'database'], isSystem: true, description: 'Software development tasks' },
    { id: 'role-research', name: 'Research', keywords: ['research', 'academic', 'paper', 'cite', 'analyze', 'summary', 'data', 'study'], isSystem: true, description: 'Academic and scientific research' },
    { id: 'role-paper', name: 'Paper', keywords: ['paper', 'writing', 'essay', 'outline', 'draft', 'thesis', 'introduction'], isSystem: true, description: 'Writing papers and essays' },
];

const processedDefaults = DEFAULT_ROLES.reduce((acc, role) => ({ ...acc, [role.id]: role }), {} as Record<string, Role>);

export const useRoleStore = create<RoleStore>((set, get) => ({
    roles: processedDefaults,
    activeRoleId: 'role-personal',
    activeRole: processedDefaults['role-personal'],

    addRole: (roleData) => {
        const id = uuidv4();
        const newRole: Role = { ...roleData, id, isSystem: false, keywords: roleData.keywords || [] };
        set(state => ({ roles: { ...state.roles, [id]: newRole } }));
        return id;
    },

    updateRole: (id, updates) => {
        set(state => {
            const role = state.roles[id];
            if (!role) return state;

            const updatedRole = { ...role, ...updates };
            // Prevent system role name/keyword nuking if crucial, but allowing edit is fine per specs

            const newState = { roles: { ...state.roles, [id]: updatedRole } };

            // Sync active role
            if (state.activeRoleId === id) {
                return { ...newState, activeRole: updatedRole };
            }
            return newState;
        });
    },

    deleteRole: (id) => {
        set(state => {
            const { [id]: deleted, ...rest } = state.roles;
            return { roles: rest };
        });
        if (get().activeRoleId === id) {
            get().setActiveRole(null);
        }
    },

    setActiveRole: (id) => {
        set({
            activeRoleId: id,
            activeRole: id ? get().roles[id] || null : null
        });
    },

    setRoles: (roles) => {
        const currentActiveId = get().activeRoleId;
        set({
            roles,
            activeRole: currentActiveId && roles[currentActiveId] ? roles[currentActiveId] : null
        });
    },

    setActiveRoleId: (id) => {
        set({
            activeRoleId: id,
            activeRole: id ? get().roles[id] || null : null
        });
    },

    getRelevanceScore: (text, tags = []) => {
        const activeRole = get().activeRole;
        if (!activeRole) return 0;

        let score = 0;
        const lowerText = text.toLowerCase();

        activeRole.keywords.forEach(keyword => {
            const lowerKey = keyword.toLowerCase();
            if (lowerText.includes(lowerKey)) score += 2;
            if (tags.some(t => t.toLowerCase().includes(lowerKey))) score += 5; // Higher weight for tags
        });

        return score;
    }
}));
