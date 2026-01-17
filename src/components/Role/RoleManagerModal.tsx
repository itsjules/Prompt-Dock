import { useState } from 'react';
import { X, Plus, Edit2, Trash2, Check, User } from 'lucide-react';
import { useRoleStore } from '../../stores/useRoleStore';
import { Role } from '../../schemas/role.schema';
import './RoleManagerModal.css';

interface RoleManagerModalProps {
    onClose: () => void;
}

export const RoleManagerModal = ({ onClose }: RoleManagerModalProps) => {
    const { roles, addRole, updateRole, deleteRole, activeRoleId, setActiveRole } = useRoleStore();
    const roleList = Object.values(roles);

    const [editingId, setEditingId] = useState<string | null>(null);
    const [isCreating, setIsCreating] = useState(false);

    // Form State
    const [formData, setFormData] = useState<Partial<Role>>({
        name: '',
        description: '',
        keywords: []
    });
    const [keywordInput, setKeywordInput] = useState('');

    const resetForm = () => {
        setFormData({ name: '', description: '', keywords: [] });
        setKeywordInput('');
        setEditingId(null);
        setIsCreating(false);
    };

    const startEdit = (role: Role) => {
        setFormData({
            name: role.name,
            description: role.description || '',
            keywords: [...role.keywords]
        });
        setEditingId(role.id);
        setIsCreating(false);
    };

    const startCreate = () => {
        resetForm();
        setIsCreating(true);
    };

    const handleSave = () => {
        if (!formData.name) return;

        if (isCreating) {
            addRole({
                name: formData.name,
                description: formData.description,
                keywords: formData.keywords || [],
                linkedCollectionIds: []
            });
        } else if (editingId) {
            updateRole(editingId, {
                name: formData.name,
                description: formData.description,
                keywords: formData.keywords
            });
        }
        resetForm();
    };

    const handleDelete = (id: string, e: React.MouseEvent) => {
        e.stopPropagation();
        if (confirm('Are you sure you want to delete this role?')) {
            deleteRole(id);
        }
    };

    const handleAddKeyword = (e: React.KeyboardEvent) => {
        if (e.key === 'Enter' && keywordInput.trim()) {
            e.preventDefault();
            const newKeywords = [...(formData.keywords || [])];
            if (!newKeywords.includes(keywordInput.trim())) {
                newKeywords.push(keywordInput.trim());
                setFormData({ ...formData, keywords: newKeywords });
            }
            setKeywordInput('');
        }
    };

    const removeKeyword = (kw: string) => {
        const newKeywords = formData.keywords?.filter(k => k !== kw) || [];
        setFormData({ ...formData, keywords: newKeywords });
    };

    return (
        <div className="modal-overlay" onClick={onClose}>
            <div className="modal-content role-manager-modal" onClick={e => e.stopPropagation()}>
                <div className="modal-header">
                    <h3>Manage Roles</h3>
                    <button className="close-btn" onClick={onClose}>
                        <X size={18} />
                    </button>
                </div>

                <div className="role-manager-content">
                    {/* List View */}
                    {!isCreating && !editingId && (
                        <>
                            <div className="role-manager-header-actions">
                                <button className="primary-btn" onClick={startCreate} style={{ width: '100%', display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '8px' }}>
                                    <Plus size={16} /> Create New Role
                                </button>
                            </div>

                            <div className="role-list-container">
                                {roleList.map(role => (
                                    <div
                                        key={role.id}
                                        className={`role-item ${activeRoleId === role.id ? 'active' : ''}`}
                                        onClick={() => setActiveRole(role.id)}
                                    >
                                        <div className="role-info">
                                            <div className="role-name">
                                                {role.name}
                                                {role.isSystem && <span className="system-badge">System</span>}
                                                {activeRoleId === role.id && <Check size={14} color="var(--accent-primary)" />}
                                            </div>
                                            <div className="role-desc">{role.description}</div>
                                            <div className="keyword-chips" style={{ marginTop: '4px' }}>
                                                {role.keywords.slice(0, 3).map(k => (
                                                    <span key={k} style={{ fontSize: '0.75rem', opacity: 0.7 }}>#{k}</span>
                                                ))}
                                                {role.keywords.length > 3 && <span style={{ fontSize: '0.75rem', opacity: 0.7 }}>+{role.keywords.length - 3}</span>}
                                            </div>
                                        </div>

                                        <div className="role-actions">
                                            <button
                                                className="role-action-btn"
                                                onClick={(e) => { e.stopPropagation(); startEdit(role); }}
                                                title="Edit Role"
                                            >
                                                <Edit2 size={14} />
                                            </button>
                                            {!role.isSystem && (
                                                <button
                                                    className="role-action-btn delete"
                                                    onClick={(e) => handleDelete(role.id, e)}
                                                    title="Delete Role"
                                                >
                                                    <Trash2 size={14} />
                                                </button>
                                            )}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </>
                    )}

                    {/* Edit/Create View */}
                    {(isCreating || editingId) && (
                        <div className="edit-role-form">
                            <div className="form-group">
                                <label>Role Name</label>
                                <input
                                    value={formData.name}
                                    onChange={e => setFormData({ ...formData, name: e.target.value })}
                                    placeholder="e.g. Creative Writer"
                                    autoFocus
                                />
                            </div>
                            <div className="form-group">
                                <label>Description</label>
                                <input
                                    value={formData.description}
                                    onChange={e => setFormData({ ...formData, description: e.target.value })}
                                    placeholder="Short purpose description"
                                />
                            </div>
                            <div className="form-group">
                                <label>Keywords (Press Enter)</label>
                                <input
                                    value={keywordInput}
                                    onChange={e => setKeywordInput(e.target.value)}
                                    onKeyDown={handleAddKeyword}
                                    placeholder="Add keywords to prioritize content..."
                                />
                                <div className="keyword-chips">
                                    {formData.keywords?.map(kw => (
                                        <span key={kw} className="keyword-chip">
                                            {kw}
                                            <X size={12} className="remove-keyword" onClick={() => removeKeyword(kw)} />
                                        </span>
                                    ))}
                                </div>
                            </div>

                            <div className="form-actions">
                                <button className="secondary-btn" onClick={resetForm}>Cancel</button>
                                <button className="primary-btn" onClick={handleSave}>
                                    {isCreating ? 'Create Role' : 'Save Changes'}
                                </button>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};
