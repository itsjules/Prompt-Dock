import { useState, useRef, useEffect } from 'react';
import { User, Settings, Check, ChevronDown } from 'lucide-react';
import { useRoleStore } from '../../stores/useRoleStore';
import { RoleManagerModal } from './RoleManagerModal';
import './RoleSelector.css';

interface RoleSelectorProps {
    size?: 'default' | 'small';
}

export const RoleSelector = ({ size = 'default' }: RoleSelectorProps) => {
    const { roles, activeRoleId, setActiveRole, activeRole } = useRoleStore();
    const [isOpen, setIsOpen] = useState(false);
    const [showManager, setShowManager] = useState(false);
    const dropdownRef = useRef<HTMLDivElement>(null);

    const roleList = Object.values(roles);

    // Close dropdown on click outside
    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
                setIsOpen(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    const handleSelect = (id: string) => {
        setActiveRole(id);
        setIsOpen(false);
    };

    const handleManage = () => {
        setIsOpen(false);
        setShowManager(true);
    };

    return (
        <>
            <div className={`role-selector-container ${size}`} ref={dropdownRef}>
                <button
                    className={`role-selector-btn ${size} ${isOpen ? 'active' : ''}`}
                    onClick={() => setIsOpen(!isOpen)}
                    title="Select Role"
                >
                    <User size={size === 'small' ? 14 : 16} />
                    <span>{activeRole?.name || 'Select Role'}</span>
                    <ChevronDown size={14} style={{ opacity: 0.5 }} />
                </button>

                {isOpen && (
                    <div className="role-dropdown-menu">
                        <div className="role-menu-description">
                            Select a role to prioritize content.
                        </div>
                        <div className="role-menu-header">Active Role</div>
                        <div className="role-menu-list">
                            {roleList.map(role => (
                                <div
                                    key={role.id}
                                    className={`role-menu-item ${activeRoleId === role.id ? 'selected' : ''}`}
                                    onClick={() => handleSelect(role.id)}
                                >
                                    <span>{role.name}</span>
                                    {activeRoleId === role.id && <Check size={14} />}
                                </div>
                            ))}
                        </div>
                        <div className="role-menu-footer">
                            <button className="manage-roles-btn" onClick={handleManage}>
                                <Settings size={14} />
                                Manage Roles
                            </button>
                        </div>
                    </div>
                )}
            </div>

            {showManager && (
                <RoleManagerModal onClose={() => setShowManager(false)} />
            )}
        </>
    );
};
